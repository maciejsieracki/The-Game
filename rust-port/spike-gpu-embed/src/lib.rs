//! Spike RR-T1 (`R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1`): wgpu surface under a
//! transparent Tauri webview, input mechanisms M1/M2 (P4-5B §2), IPC latency,
//! memory, keyboard focus and fullscreen state.
//!
//! Layout:
//! - CPU modules (always built, unit-tested in any container): [`report`],
//!   [`stats`], [`regions`], [`clock`], [`memory`], [`protocol`], [`log`].
//! - [`gpu`] (feature `gpu`): wgpu device, triangle pipeline, frame rendering,
//!   offscreen self-test with pixel read-back.
//! - [`app`] (feature `app`, default): the Tauri application and the platform
//!   hooks (Windows / Linux GTK / macOS stub).
//!
//! Rule of the spike: nothing here claims that anything works on a GPU, in a
//! window or in a webview. Every check starts as `NIE_ZMIERZONO` and only a run
//! on the owner's machine can change it, with evidence in the report.

pub mod clock;
pub mod log;
pub mod memory;
pub mod protocol;
pub mod regions;
pub mod report;
pub mod stats;

#[cfg(feature = "gpu")]
pub mod gpu;

#[cfg(feature = "app")]
pub mod app;
