//! GPU probe (feature `gpu` only): try to create a wgpu instance and an
//! adapter.
//!
//! - No adapter (e.g. a CI container without `/dev/dri`, Vulkan ICD or EGL):
//!   the test PASSES and prints an explicit `SKIPPED: no GPU adapter` line
//!   with the reason. It is a reported skip, not a silent pass: run with
//!   `-- --nocapture` to see the line (the CI workflow does).
//! - Adapter found: prints its name, backend, device type and driver.
#![cfg(feature = "gpu")]

use civ_renderer::gpu::wgpu;

#[test]
fn gpu_probe_adapter_or_explicit_skip() {
    // Headless probe: no window/display handle; backends and options can be
    // overridden through the standard WGPU_* environment variables.
    let instance =
        wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle_from_env());
    let options = wgpu::RequestAdapterOptions::default();
    match pollster::block_on(instance.request_adapter(&options)) {
        Ok(adapter) => {
            let info = adapter.get_info();
            println!(
                "GPU PROBE: adapter found: name={:?} backend={:?} device_type={:?} driver={:?} driver_info={:?}",
                info.name, info.backend, info.device_type, info.driver, info.driver_info
            );
        }
        Err(err) => {
            println!("SKIPPED: no GPU adapter (request_adapter error: {err})");
        }
    }
}
