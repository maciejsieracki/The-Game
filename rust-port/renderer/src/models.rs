//! `models` — procedural 3D models (units, cities, improvements,
//! decorations, wonders, camps, ships) rebuilt 1:1 from the web builders in
//! batches according to the P4.4 model catalogue, built as instance lists of
//! shared `geom` meshes (P4.3 §7.3 pt 2).
//!
//! Topics: **RR-T7..RR-T7n** (one sub-module per batch). Batches landed so
//! far: `unit_core` (MOD-01 core of the unit models), `units_kamien`,
//! `wonders`, `improvements` and `misc` (MOD-13: village / camp, siege,
//! sky decor, range / territory / trade overlays as CPU buffers); every
//! batch is verified against vectors from the running web code
//! (`tests/*_web_parity.rs`).

pub mod cities;
pub mod improvements;
pub mod misc;
pub mod unit_core;
pub mod units_kamien;
pub mod wonders;
