//! `assets` — registry of shared GPU resources (buffers, textures,
//! pipelines, bind groups) with a single owner, content keys, generational
//! handles and reference counts; budgets and CPU-side counters for the
//! "N turns does not grow memory" regression test (P4.3 §7.3).
//!
//! Topic: **RR-T6** (`R-RUSTPORT-P4-9-ASSET-REGISTRY-Q1`). The whole module
//! is CPU-only and independent of `wgpu`; the GPU layer later instantiates
//! the registry with its own resource payload.
//!
//! Map of the web memory findings (P4.3 §7.1) to mechanisms:
//!
//! | Web finding | Mechanism here |
//! |---|---|
//! | M1 city model rebuilt without freeing | [`Cache`] keyed by `(primitive, params)` + [`Owned::replace`] / [`Registry::replace`] (new first, then old) |
//! | M2 badge texture cache only grows | [`Cache`] with [`CachePolicy`] (LRU) + [`Cache::end_of_turn`] |
//! | M3 listeners never removed | [`Listeners`] + [`Subscription`] (removed on `Drop`) |
//! | M6 `dispose*` never called | [`Scope`] / [`Owned`] (`Drop` releases), [`Cache::clear`]; no free-standing dispose functions |
//!
//! Layers:
//! - [`registry`]: [`Registry`] (single owner), typed generational
//!   [`Handle`]s, per-kind [`RegistryStats`]; stale handles give
//!   [`AssetError::Stale`], never a panic or a use-after-free;
//! - [`shared`]: [`Assets`] (shared registry), [`Owned`] (RAII reference),
//!   [`Scope`] (RAII group);
//! - [`cache`]: [`Cache`] with eviction policy;
//! - [`listeners`]: [`Listeners`] / [`Subscription`];
//! - [`budget`]: [`Snapshot`], [`Budget`] (thresholds of `D-RR-7`,
//!   default: no growth);
//! - [`fake`]: [`FakeGpu`], an allocation-counting CPU backend for tests.

pub mod budget;
pub mod cache;
pub mod fake;
pub mod listeners;
pub mod registry;
pub mod shared;

pub use budget::{
    Budget, Growth, Metric, Snapshot, Violation, DEFAULT_BASELINE_TURN, DEFAULT_CHECK_TURNS,
};
pub use cache::{Cache, CachePolicy, CacheStats};
pub use fake::{FakeEvent, FakeGpu, FakeResource};
pub use listeners::{ListenerStats, Listeners, Subscription};
pub use registry::{
    kinds, AssetError, Handle, Kind, KindStats, LiveEntry, RawHandle, Registry, RegistryStats,
    Release, ResourceKind,
};
pub use shared::{Assets, Owned, Scope};
