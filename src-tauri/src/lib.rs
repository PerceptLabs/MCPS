mod core;
use core::{
    cmd::get_jan_data_folder_path,
    setup::{self, setup_engine_binaries, setup_mcp, setup_sidecar},
    state::{generate_app_token, AppState},
    utils::download::DownloadManagerState,
};
use std::{collections::HashMap, sync::Arc};

use tauri::Emitter;
use tokio::sync::Mutex;

use reqwest::blocking::Client;
use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // FS commands - Deperecate soon
            core::fs::join_path,
            core::fs::mkdir,
            core::fs::exists_sync,
            core::fs::readdir_sync,
            core::fs::read_file_sync,
            core::fs::rm,
            core::fs::file_stat,
            // App commands
            core::cmd::get_themes,
            core::cmd::get_app_configurations,
            core::cmd::get_active_extensions,
            core::cmd::get_user_home_path,
            core::cmd::update_app_configuration,
            core::cmd::get_jan_data_folder_path,
            core::cmd::get_jan_extensions_path,
            core::cmd::relaunch,
            core::cmd::open_app_directory,
            core::cmd::open_file_explorer,
            core::cmd::install_extensions,
            core::cmd::read_theme,
            core::cmd::app_token,
            core::cmd::start_server,
            core::cmd::stop_server,
            core::cmd::read_logs,
            // MCP commands
            core::mcp::get_tools,
            core::mcp::call_tool,
            core::mcp::restart_mcp_servers,
            core::mcp::get_connected_servers,
            core::mcp::save_mcp_configs,
            core::mcp::get_mcp_configs,
            // Threads
            core::threads::list_threads,
            core::threads::create_thread,
            core::threads::modify_thread,
            core::threads::delete_thread,
            core::threads::list_messages,
            core::threads::create_message,
            core::threads::modify_message,
            core::threads::delete_message,
            core::threads::get_thread_assistant,
            core::threads::create_thread_assistant,
            core::threads::modify_thread_assistant,
            // Download
            core::utils::download::download_file,
            core::utils::download::download_hf_repo,
            core::utils::download::cancel_download_task,
        ])
        .manage(AppState {
            app_token: Some(generate_app_token()),
            mcp_servers: Arc::new(Mutex::new(HashMap::new())),
            download_manager: Arc::new(Mutex::new(DownloadManagerState::default())),
        })
        .setup(|app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .targets([
                        tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                        tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                        tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Folder {
                            path: get_jan_data_folder_path(app.handle().clone()).join("logs"),
                            file_name: Some("app".to_string()),
                        }),
                    ])
                    .build(),
            )?;
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            // Install extensions
            if let Err(e) = setup::install_extensions(app.handle().clone(), false) {
                log::error!("Failed to install extensions: {}", e);
            }
            setup_mcp(app);
            setup_sidecar(app).expect("Failed to setup sidecar");
            setup_engine_binaries(app).expect("Failed to setup engine binaries");
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                update(handle).await.unwrap();
            });
            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { .. } => {
                let client = Client::new();
                let url = "http://127.0.0.1:39291/processManager/destroy";
                let _ = client.delete(url).send();

                window.emit("kill-sidecar", ()).unwrap();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        // alternatively we could also call update.download() and update.install() separately
        log::info!("Has update");
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    log::info!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    log::info!("download finished");
                },
            )
            .await?;

        log::info!("update installed");
        app.restart();
    } else {
        log::info!("Cannot parse");
    }

    Ok(())
}
