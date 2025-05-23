use super::{GpuInfo, GpuUsage};

impl GpuInfo {
    #[cfg(not(target_os = "linux"))]
    #[cfg(not(target_os = "windows"))]
    pub fn get_usage_amd(&self) -> GpuUsage {
        self.get_usage_unsupported()
    }

    #[cfg(target_os = "linux")]
    pub fn get_usage_amd(&self) -> GpuUsage {
        use super::GpuAdditionalInfo;
        use std::fs;
        use std::path::Path;

        for card_idx in 0.. {
            let device_path = format!("/sys/class/drm/card{}/device", card_idx);
            if !Path::new(&device_path).exists() {
                break;
            }

            // Check if this is an AMD GPU by looking for amdgpu directory
            if !Path::new(&format!("{}/driver/module/drivers/pci:amdgpu", device_path)).exists() {
                continue;
            }

            // match device_id from Vulkan info
            let this_device_id = fs::read_to_string(format!("{}/device", device_path))
                .map(|s| u32::from_str_radix(s.trim(), 16).unwrap_or(0))
                .unwrap_or(0);

            match self.additional_info {
                GpuAdditionalInfo::Vulkan { device_id, .. } => {
                    if this_device_id != device_id {
                        continue;
                    }
                }
                _ => {
                    continue;
                }
            }

            let read_mem = |path: &str| -> u64 {
                fs::read_to_string(path)
                    .map(|content| content.trim().parse::<u64>().unwrap_or(0))
                    .unwrap_or(0)
                    / 1024
                    / 1024 // Convert bytes to MiB
            };
            return GpuUsage {
                uuid: self.uuid.clone(),
                total_memory: read_mem(&format!("{}/mem_info_vram_total", device_path)),
                used_memory: read_mem(&format!("{}/mem_info_vram_used", device_path)),
            };
        }

        this.get_usage_unsupported()
    }

    #[cfg(target_os = "windows")]
    pub fn get_usage_amd(&self) -> GpuUsage {
        use std::collections::HashMap;

        let memory_usage_map = windows_impl::get_gpu_usage().unwrap_or_else(|_| {
            log::error!("Failed to get AMD GPU memory usage");
            HashMap::new()
        });

        match memory_usage_map.get(&self.name) {
            Some(&used_memory) => GpuUsage {
                uuid: self.uuid.clone(),
                used_memory: used_memory as u64,
                total_memory: self.total_memory,
            },
            None => self.get_usage_unsupported(),
        }
    }
}

// TODO: refactor this into a more egonomic API
#[cfg(target_os = "windows")]
mod windows_impl {
    use libc;
    use libloading::{Library, Symbol};
    use std::collections::HashMap;
    use std::ffi::{c_char, c_int, c_void, CStr};
    use std::mem::{self, MaybeUninit};
    use std::ptr;

    // === FFI Struct Definitions ===
    #[repr(C)]
    #[allow(non_snake_case)]
    #[derive(Debug, Copy, Clone)]
    pub struct AdapterInfo {
        pub iSize: c_int,
        pub iAdapterIndex: c_int,
        pub strUDID: [c_char; 256],
        pub iBusNumber: c_int,
        pub iDeviceNumber: c_int,
        pub iFunctionNumber: c_int,
        pub iVendorID: c_int,
        pub strAdapterName: [c_char; 256],
        pub strDisplayName: [c_char; 256],
        pub iPresent: c_int,
        pub iExist: c_int,
        pub strDriverPath: [c_char; 256],
        pub strDriverPathExt: [c_char; 256],
        pub strPNPString: [c_char; 256],
        pub iOSDisplayIndex: c_int,
    }

    type ADL_MAIN_MALLOC_CALLBACK = Option<unsafe extern "C" fn(i32) -> *mut c_void>;
    type ADL_MAIN_CONTROL_CREATE = unsafe extern "C" fn(ADL_MAIN_MALLOC_CALLBACK, c_int) -> c_int;
    type ADL_MAIN_CONTROL_DESTROY = unsafe extern "C" fn() -> c_int;
    type ADL_ADAPTER_NUMBEROFADAPTERS_GET = unsafe extern "C" fn(*mut c_int) -> c_int;
    type ADL_ADAPTER_ADAPTERINFO_GET = unsafe extern "C" fn(*mut AdapterInfo, c_int) -> c_int;
    type ADL_ADAPTER_ACTIVE_GET = unsafe extern "C" fn(c_int, *mut c_int) -> c_int;
    type ADL_GET_DEDICATED_VRAM_USAGE =
        unsafe extern "C" fn(*mut c_void, c_int, *mut c_int) -> c_int;

    // === ADL Memory Allocator ===
    unsafe extern "C" fn adl_malloc(i_size: i32) -> *mut c_void {
        libc::malloc(i_size as usize)
    }

    pub fn get_gpu_usage() -> Result<HashMap<String, i32>, Box<dyn std::error::Error>> {
        unsafe {
            let lib = Library::new("atiadlxx.dll").or_else(|_| Library::new("atiadlxy.dll"))?;

            let adl_main_control_create: Symbol<ADL_MAIN_CONTROL_CREATE> =
                lib.get(b"ADL_Main_Control_Create")?;
            let adl_main_control_destroy: Symbol<ADL_MAIN_CONTROL_DESTROY> =
                lib.get(b"ADL_Main_Control_Destroy")?;
            let adl_adapter_number_of_adapters_get: Symbol<ADL_ADAPTER_NUMBEROFADAPTERS_GET> =
                lib.get(b"ADL_Adapter_NumberOfAdapters_Get")?;
            let adl_adapter_adapter_info_get: Symbol<ADL_ADAPTER_ADAPTERINFO_GET> =
                lib.get(b"ADL_Adapter_AdapterInfo_Get")?;
            let adl_adapter_active_get: Symbol<ADL_ADAPTER_ACTIVE_GET> =
                lib.get(b"ADL_Adapter_Active_Get")?;
            let adl_get_dedicated_vram_usage: Symbol<ADL_GET_DEDICATED_VRAM_USAGE> =
                lib.get(b"ADL2_Adapter_DedicatedVRAMUsage_Get")?;

            // TODO: try to put nullptr here. then we don't need direct libc dep
            if adl_main_control_create(Some(adl_malloc), 1) != 0 {
                return Err("ADL initialization error!".into());
            }
            // NOTE: after this call, we must call ADL_Main_Control_Destroy
            // whenver we encounter an error

            let mut num_adapters: c_int = 0;
            if adl_adapter_number_of_adapters_get(&mut num_adapters as *mut _) != 0 {
                return Err("Cannot get number of adapters".into());
            }

            let mut vram_usages = HashMap::new();

            if num_adapters > 0 {
                let mut adapter_info: Vec<AdapterInfo> =
                    vec![MaybeUninit::zeroed().assume_init(); num_adapters as usize];
                let ret = adl_adapter_adapter_info_get(
                    adapter_info.as_mut_ptr(),
                    mem::size_of::<AdapterInfo>() as i32 * num_adapters,
                );
                if ret != 0 {
                    return Err("Cannot get adapter info".into());
                }

                for adapter in adapter_info.iter() {
                    let mut is_active = 0;
                    adl_adapter_active_get(adapter.iAdapterIndex, &mut is_active);

                    if is_active != 0 {
                        let mut vram_mb = 0;
                        let _ = adl_get_dedicated_vram_usage(
                            ptr::null_mut(),
                            adapter.iAdapterIndex,
                            &mut vram_mb,
                        );
                        // NOTE: adapter name might not be unique?
                        let name = CStr::from_ptr(adapter.strAdapterName.as_ptr())
                            .to_string_lossy()
                            .into_owned();
                        vram_usages.insert(name, vram_mb);
                    }
                }
            }

            adl_main_control_destroy();

            Ok(vram_usages)
        }
    }
}
