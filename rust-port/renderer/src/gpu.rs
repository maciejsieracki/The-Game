//! `gpu` — GPU layer on top of `wgpu` (compiled only with the `gpu` feature):
//! device/queue ownership, surfaces, render passes, offscreen
//! render-to-texture for the 1:1 comparison harness.
//!
//! Topics: **RR-T1** (embedding spike under the Tauri webview), **RR-T2**
//! (first real frame), **RR-T5** (pipelines), **RR-T11** (offscreen harness).
//! Today it only re-exports the pinned `wgpu` crate so that tests and
//! follow-up topics use exactly the version pinned in `Cargo.toml`.

pub use wgpu;
