//! `civ-renderer` — native Rust map renderer for Civ "The Game" (staging crate).
//!
//! **Scaffold only** (R-RUSTPORT-P4-6, candidate topic "RR-T0" from
//! `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` §8). No rendering is
//! implemented yet. The module tree exists so that follow-up topics
//! (RR-T2..RR-T13) can work in parallel on disjoint files.
//!
//! Owner decisions in force (LEDGER 2026-10-21):
//! - D-RR-1 = A: the engine is `wgpu` used directly (no Bevy, no ECS);
//! - D-RR-4 = A: text is rasterised in Rust;
//! - D-RR-8 = A: only the `roblox` map style is ported (no tone mapping).
//!
//! Layering:
//! - CPU modules (always compiled, testable without a GPU): [`geom`],
//!   [`pick`], [`camera`], [`assets`], [`view`], and the CPU-side parts of
//!   [`material`], [`text`], [`overlays`], [`models`];
//! - GPU layer: module `gpu`, compiled only with the `gpu` cargo feature.

// The whole crate is safe Rust today, with and without the `gpu` feature.
// `wgpu::Instance::create_surface` accepts safe window handles; only
// `create_surface_unsafe` would need `unsafe`. If the Tauri embedding spike
// (RR-T1) proves it necessary, relax this to `deny` and allow it in exactly
// one documented module of the GPU layer.
#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod assets;
pub mod camera;
pub mod core;
pub mod geom;
pub mod material;
pub mod models;
pub mod overlays;
pub mod pick;
pub mod terrain;
pub mod text;
pub mod view;

#[cfg(feature = "gpu")]
pub mod gpu;

/// Returns `true` when the crate was compiled with the `gpu` cargo feature.
///
/// This is a real build-configuration readback (not a placeholder): CPU-only
/// callers and tests use it to decide whether the GPU layer exists.
#[must_use]
pub const fn gpu_feature_enabled() -> bool {
    cfg!(feature = "gpu")
}
