//! Diagnostics policy for the engine library.
//!
//! The engine only emits `tracing` events (`error!`, `warn!`, ...). It never
//! installs a subscriber: the shell (`src-tauri`) owns subscriber setup,
//! format and level filtering. Without a subscriber the macros are no-ops, so
//! logging never changes domain state, RNG or event order.
//!
//! Policy (see `dyspozycje/rust-port/p3/P3-3-ERRORS-LOGGING.md` section 4):
//! - ERROR: rejected imports of an event queue (exhausted sequence space).
//! - WARN: imports approaching the sequence ceiling.
//! - `bridge.rs` stays free of `tracing`: `src-tauri` includes it via `#[path]`
//!   and does not depend on `tracing` directly.
//! - Log identifiers and sequence numbers only, never player names or save
//!   contents.
//! - No logging in the map generator or other domain loops.
