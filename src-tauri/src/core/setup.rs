use flate2::read::GzDecoder;
use std::{
    fs::{self, File},
    io::Read,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tar::Archive;
use tauri::{App, Emitter, Listener, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::time::{sleep, Duration};
use tauri_plugin_store::StoreExt;

// MCP
use super::{
    cmd::{get_jan_data_folder_path, get_jan_extensions_path},
    mcp::run_mcp_commands,
    state::AppState,
};

pub fn install_extensions(app: tauri::AppHandle, force: bool) -> Result<(), String> {
    let mut store_path = get_jan_data_folder_path(app.clone());
    store_path.push("store.json");
    let store = app.store(store_path).expect("Store not initialized");
    let stored_version = store
        .get("version")
        .and_then(|v| v.as_str().map(String::from))
        .unwrap_or_default();

    let app_version = app
        .config()
        .version
        .clone()
        .unwrap_or_else(|| "".to_string());

    let extensions_path = get_jan_extensions_path(app.clone());
    let pre_install_path = app
        .path()
        .resource_dir()
        .unwrap()
        .join("resources")
        .join("pre-install");

    let mut clean_up = force;

    // Check CLEAN environment variable to optionally skip extension install
    if std::env::var("CLEAN").is_ok() {
        clean_up = true;
    }
    if !clean_up && stored_version == app_version && extensions_path.exists() {
        return Ok(());
    }

    // Attempt to remove extensions folder
    if extensions_path.exists() {
        fs::remove_dir_all(&extensions_path).unwrap_or_else(|_| {
            log::info!("Failed to remove existing extensions folder, it may not exist.");
        });
    }

    // Attempt to create it again
    if !extensions_path.exists() {
        fs::create_dir_all(&extensions_path).map_err(|e| e.to_string())?;
    }

    let extensions_json_path = extensions_path.join("extensions.json");
    let mut extensions_list = if extensions_json_path.exists() {
        let existing_data =
            fs::read_to_string(&extensions_json_path).unwrap_or_else(|_| "[]".to_string());
        serde_json::from_str::<Vec<serde_json::Value>>(&existing_data).unwrap_or_else(|_| vec![])
    } else {
        vec![]
    };

    for entry in fs::read_dir(&pre_install_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "tgz") {
            log::info!("Installing extension from {:?}", path);
            let tar_gz = File::open(&path).map_err(|e| e.to_string())?;
            let gz_decoder = GzDecoder::new(tar_gz);
            let mut archive = Archive::new(gz_decoder);

            let mut extension_name = None;
            let mut extension_manifest = None;
            extract_extension_manifest(&mut archive)
                .map_err(|e| e.to_string())
                .and_then(|manifest| match manifest {
                    Some(manifest) => {
                        extension_name = manifest["name"].as_str().map(|s| s.to_string());
                        extension_manifest = Some(manifest);
                        Ok(())
                    }
                    None => Err("Manifest is None".to_string()),
                })?;

            let extension_name = extension_name.ok_or("package.json not found in archive")?;
            let extension_dir = extensions_path.join(extension_name.clone());
            fs::create_dir_all(&extension_dir).map_err(|e| e.to_string())?;

            let tar_gz = File::open(&path).map_err(|e| e.to_string())?;
            let gz_decoder = GzDecoder::new(tar_gz);
            let mut archive = Archive::new(gz_decoder);
            for entry in archive.entries().map_err(|e| e.to_string())? {
                let mut entry = entry.map_err(|e| e.to_string())?;
                let file_path = entry.path().map_err(|e| e.to_string())?;
                let components: Vec<_> = file_path.components().collect();
                if components.len() > 1 {
                    let relative_path: PathBuf = components[1..].iter().collect();
                    let target_path = extension_dir.join(relative_path);
                    if let Some(parent) = target_path.parent() {
                        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                    let _result = entry.unpack(&target_path).map_err(|e| e.to_string())?;
                }
            }

            let main_entry = extension_manifest
                .as_ref()
                .and_then(|manifest| manifest["main"].as_str())
                .unwrap_or("index.js");
            let url = extension_dir.join(main_entry).to_string_lossy().to_string();

            let new_extension = serde_json::json!({
                "url": url,
                "name": extension_name.clone(),
                "origin": extension_dir.to_string_lossy(),
                "active": true,
                "description": extension_manifest
                    .as_ref()
                    .and_then(|manifest| manifest["description"].as_str())
                    .unwrap_or(""),
                "version": extension_manifest
                    .as_ref()
                    .and_then(|manifest| manifest["version"].as_str())
                    .unwrap_or(""),
                "productName": extension_manifest
                    .as_ref()
                    .and_then(|manifest| manifest["productName"].as_str())
                    .unwrap_or(""),
            });

            extensions_list.push(new_extension);

            log::info!("Installed extension to {:?}", extension_dir);
        }
    }
    fs::write(
        &extensions_json_path,
        serde_json::to_string_pretty(&extensions_list).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    // Store the new app version
    store.set("version", serde_json::json!(app_version));
    store.save().expect("Failed to save store");

    Ok(())
}

fn extract_extension_manifest<R: Read>(
    archive: &mut Archive<R>,
) -> Result<Option<serde_json::Value>, String> {
    let entry = archive
        .entries()
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok()) // Ignore errors in individual entries
        .find(|entry| {
            if let Ok(file_path) = entry.path() {
                let path_str = file_path.to_string_lossy();
                path_str == "package/package.json" || path_str == "package.json"
            } else {
                false
            }
        });

    if let Some(mut entry) = entry {
        let mut content = String::new();
        entry
            .read_to_string(&mut content)
            .map_err(|e| e.to_string())?;

        let package_json: serde_json::Value =
            serde_json::from_str(&content).map_err(|e| e.to_string())?;
        return Ok(Some(package_json));
    }

    Ok(None)
}

pub fn setup_mcp(app: &App) {
    let state = app.state::<AppState>().inner();
    let servers = state.mcp_servers.clone();
    let app_handle: tauri::AppHandle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_mcp_commands(&app_handle, servers).await {
            log::error!("Failed to run mcp commands: {}", e);
        }
        app_handle
            .emit("mcp-update", "MCP servers updated")
            .unwrap();
    });
}

pub fn setup_sidecar(app: &App) -> Result<(), String> {
    let app_handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        const MAX_RESTARTS: u32 = 5;
        const RESTART_DELAY_MS: u64 = 5000;

        let app_state = app_handle.state::<AppState>();
        let cortex_restart_count_state = app_state.cortex_restart_count.clone();
        let app_data_dir = get_jan_data_folder_path(app_handle.clone());

        // It's important to clone sidecar_command_builder or re-create it in the loop
        // because `spawn()` consumes the builder.
        let sidecar_command_builder = || {
            let mut cmd = app_handle
                .shell()
                .sidecar("cortex-server")
                .expect("Failed to get sidecar command")
                .args([
                    "--start-server",
                    "--port",
                    "39291",
                    "--config_file_path",
                    app_data_dir.join(".janrc").to_str().unwrap(),
                    "--data_folder_path",
                    app_data_dir.to_str().unwrap(),
                    "--cors",
                    "ON",
                    "--allowed_origins",
                    "http://localhost:3000,http://localhost:1420,tauri://localhost,http://tauri.localhost",
                    "config",
                    "--api_keys",
                    app_state.inner().app_token.as_deref().unwrap_or(""),
                ]);

            #[cfg(target_os = "windows")]
            {
                cmd = cmd.env("PATH", {
                    let current_app_data_dir = app_handle.path().app_data_dir().unwrap();
                    let dest = current_app_data_dir.to_str().unwrap();
                    let path_env = std::env::var("PATH").unwrap_or_default();
                    format!("{}{}{}", path_env, std::path::MAIN_SEPARATOR, dest)
                });
            }

            #[cfg(not(target_os = "windows"))]
            {
                cmd = cmd.env("LD_LIBRARY_PATH", {
                    let current_app_data_dir = app_handle.path().app_data_dir().unwrap();
                    let dest = current_app_data_dir.to_str().unwrap();
                    let ld_path_env = std::env::var("LD_LIBRARY_PATH").unwrap_or_default();
                    format!("{}{}{}", ld_path_env, std::path::MAIN_SEPARATOR, dest)
                });
            }
            cmd
        };


        let child_process: Arc<Mutex<Option<CommandChild>>> = Arc::new(Mutex::new(None));

        // Listen for kill event
        let child_process_clone_for_kill = child_process.clone();
        app_handle.listen("kill-sidecar", move |_| {
            log::info!("Received kill-sidecar event.");
            if let Some(child) = child_process_clone_for_kill.lock().unwrap().take() {
                log::info!("Attempting to kill sidecar process...");
                if let Err(e) = child.kill() {
                    log::error!("Failed to kill sidecar process: {}", e);
                } else {
                    log::info!("Sidecar process killed successfully via event.");
                }
            } else {
                log::warn!("Kill event received, but no active sidecar process found to kill.");
            }
        });

        loop {
            let current_restart_count = *cortex_restart_count_state.lock().await;
            if current_restart_count >= MAX_RESTARTS {
                log::error!(
                    "Cortex server reached maximum restart attempts ({}). Giving up.",
                    current_restart_count
                );
                if let Err(e) = app_handle.emit("cortex_max_restarts_reached", ()) {
                    log::error!("Failed to emit cortex_max_restarts_reached event: {}", e);
                }
                break;
            }

            log::info!(
                "Spawning cortex-server (Attempt {}/{})",
                current_restart_count + 1,
                MAX_RESTARTS
            );

            let current_command = sidecar_command_builder();
            match current_command.spawn() {
                Ok((mut rx, child)) => {
                    log::info!("Cortex server spawned successfully. PID: {:?}", child.pid());
                    *child_process.lock().unwrap() = Some(child);

                    // Reset restart count on successful spawn
                    {
                        let mut count = cortex_restart_count_state.lock().await;
                        if *count > 0 {
                            log::info!(
                                "Cortex server started successfully, resetting restart count from {} to 0.",
                                *count
                            );
                            *count = 0;
                        }
                    }

                    let mut process_terminated_unexpectedly = false;
                    while let Some(event) = rx.recv().await {
                        match event {
                            CommandEvent::Stdout(line_bytes) => {
                                log::info!("[Cortex STDOUT]: {}", String::from_utf8_lossy(&line_bytes));
                            }
                            CommandEvent::Stderr(line_bytes) => {
                                log::error!("[Cortex STDERR]: {}", String::from_utf8_lossy(&line_bytes));
                            }
                            CommandEvent::Error(message) => {
                                log::error!("[Cortex ERROR]: {}", message);
                                process_terminated_unexpectedly = true;
                                break;
                            }
                            CommandEvent::Terminated(payload) => {
                                log::info!("[Cortex Terminated]: Signal {:?}, Code {:?}", payload.signal, payload.code);
                                // Check if termination was intentional (e.g. via kill-sidecar event)
                                // If child_process is None, it means it was killed intentionally.
                                if child_process.lock().unwrap().is_some() { // Still Some, means it was not killed by our event
                                    if payload.code.map_or(true, |c| c != 0) { // Exited with error or unknown
                                        process_terminated_unexpectedly = true;
                                    }
                                }
                                break;
                            }
                            _ => {}
                        }
                    }
                    
                    // Ensure the child process is cleared if it terminated
                    // and was not already cleared by the kill-sidecar event
                    if child_process.lock().unwrap().is_some() {
                        *child_process.lock().unwrap() = None;
                        log::info!("Cleared child process lock after termination.");
                    }


                    if process_terminated_unexpectedly {
                        log::warn!("Cortex server terminated unexpectedly.");
                        let mut count = cortex_restart_count_state.lock().await;
                        *count += 1;
                        log::info!(
                            "Waiting {}ms before attempting restart {}/{}...",
                            RESTART_DELAY_MS,
                            *count,
                            MAX_RESTARTS
                        );
                        // Drop the lock before sleeping
                        drop(count);
                        sleep(Duration::from_millis(RESTART_DELAY_MS)).await;
                        continue; // Restart the loop
                    } else {
                        log::info!("Cortex server terminated normally or was killed. Not restarting.");
                        break; // Exit the loop, server stopped intentionally or successfully
                    }
                }
                Err(e) => {
                    log::error!("Failed to spawn cortex-server: {}", e);
                    let mut count = cortex_restart_count_state.lock().await;
                    *count += 1;
                    log::info!(
                        "Waiting {}ms before attempting restart {}/{} due to spawn failure...",
                        RESTART_DELAY_MS,
                        *count,
                        MAX_RESTARTS
                    );
                     // Drop the lock before sleeping
                    drop(count);
                    sleep(Duration::from_millis(RESTART_DELAY_MS)).await;
                }
            }
        }
    });
    Ok(())
}

fn copy_dir_all(src: PathBuf, dst: PathBuf) -> Result<(), String> {
    fs::create_dir_all(&dst).map_err(|e| e.to_string())?;
    log::info!("Copying from {:?} to {:?}", src, dst);
    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let ty = entry.file_type().map_err(|e| e.to_string())?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.join(entry.file_name())).map_err(|e| e.to_string())?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name())).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub fn setup_engine_binaries(app: &App) -> Result<(), String> {
    // Copy engine binaries to app_data
    let app_data_dir = get_jan_data_folder_path(app.handle().clone());
    let binaries_dir = app.handle().path().resource_dir().unwrap().join("binaries");
    let themes_dir = app
        .handle()
        .path()
        .resource_dir()
        .unwrap()
        .join("resources");

    if let Err(e) = copy_dir_all(binaries_dir, app_data_dir.clone()) {
        log::error!("Failed to copy binaries: {}", e);
    }
    if let Err(e) = copy_dir_all(themes_dir, app_data_dir.clone()) {
        log::error!("Failed to copy themes: {}", e);
    }
    Ok(())
}
