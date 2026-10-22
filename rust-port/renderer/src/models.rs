//! `models` — procedural 3D models (units, cities, improvements,
//! decorations, wonders, camps, ships) rebuilt 1:1 from the web builders in
//! batches according to the P4.4 model catalogue, built as instance lists of
//! shared `geom` meshes (P4.3 §7.3 pt 2).
//!
//! Topics: **RR-T7..RR-T7n** (one sub-module per batch). Empty until the
//! first batch lands (now: `unit_core`, `wonders`).

pub mod improvements;
pub mod misc;
pub mod unit_core;
pub mod units_kamien;
pub mod wonders;
