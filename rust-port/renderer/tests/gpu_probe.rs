//! GPU probe (feature `gpu` only): try to create a wgpu instance and an
//! adapter.
//!
//! - No adapter (`RequestAdapterError::NotFound`, e.g. a CI container without
//!   `/dev/dri`, Vulkan ICD or EGL): the test PASSES and writes an explicit
//!   `SKIPPED: no GPU adapter` line with the reason.
//! - Any other `RequestAdapterError` variant (the enum is `#[non_exhaustive]`):
//!   the test FAILS with the variant, so a misconfiguration is never reported
//!   as a skip.
//! - Adapter found: writes its name, backend, device type and driver.
//!
//! The lines are written straight to the process stderr handle
//! (`std::io::stderr()`), not via `println!`/`eprintln!`: libtest captures
//! only the print macros, so the report is visible in a plain
//! `cargo test --features gpu` run, without `-- --nocapture`.
#![cfg(feature = "gpu")]

use std::io::Write as _;

use civ_renderer::gpu::wgpu;

/// Write one report line to the real stderr, bypassing libtest output capture.
fn report(line: &str) {
    let mut err = std::io::stderr().lock();
    writeln!(err, "{line}").expect("write probe report to stderr");
}

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
            report(&format!(
                "GPU PROBE: adapter found: name={:?} backend={:?} device_type={:?} driver={:?} driver_info={:?}",
                info.name, info.backend, info.device_type, info.driver, info.driver_info
            ));
        }
        Err(err @ wgpu::RequestAdapterError::NotFound { .. }) => {
            report(&format!(
                "SKIPPED: no GPU adapter (request_adapter error: {err})"
            ));
        }
        Err(other) => {
            panic!("GPU PROBE: unexpected request_adapter error (not a skip): {other:?} ({other})");
        }
    }
}
