//! `view` — adapter from the render view model (DTO, crate
//! `civ-view-model`) to the renderer inputs (P4-1G, task #216).
//!
//! Decision D-DTO-1 = A (`P4-1-RENDER-DTO-CONTRACT.md` §7): the DTO types
//! live in their own crate and are computed by the producer in the engine;
//! this module only *translates* them into the types the renderer already
//! takes (`pick::hex::HexCoord`, `HexKey`, `"q,r"` strings, `i32` owners,
//! renderer enums, fog sets). No game rules here, no engine state: the DTO
//! already carries axial `HexCoord { q, r }`, so there is no position mapping
//! to do in the renderer.
//!
//! Topics:
//! - Q1 `R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE` (this): the shared conversions
//!   ([`convert`]) and the fog sets ([`fog`]), see
//!   `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §2, §3.3;
//! - Q2–Q6: terrain, cities, battle, overlays, units (same document, §7).

pub mod cities;
pub mod convert;
pub mod fog;

pub use cities::{
    apply_city_fog, apply_wonder_fog, atlas_owner_emblem_context, city_badge_input, city_renderer,
    owner_emblem_context, placed_wonder, production_kind, wonder_renderer, CityAdapterError,
    CityInputs, CityRenderEntry, OwnerRenderEntry, WonderInputs,
};
pub use convert::{
    battle_side, city_id_string, city_wall_kind, fort_kind, hex_build_highlight, hex_f64, hex_key,
    hex_key_string, map_outline_kind, owner_f64, owner_i32, owner_i64, pick_hex, river_kind,
    seed_i32, siege_machine_kind, terrain, tower_material, trade_medium, unit_id_string,
};
pub use fog::FogSets;

/// A DTO value the renderer input cannot represent. The adapter reports it
/// instead of clamping, truncating or picking a default.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ViewAdapterError {
    /// An owner number (`OwnerRef::legacy_i64`) outside `i32`, where the
    /// renderer takes `i32` (`City.owner_id`, `apply_fog_visibility`, …).
    OwnerOutOfI32 {
        /// The legacy owner number.
        value: i64,
    },
    /// A per-hex array whose length differs from `map.hexes`.
    LengthMismatch {
        /// Field name (e.g. `"fog.state"`).
        field: &'static str,
        /// `map.hexes.len()`.
        expected: usize,
        /// Actual length.
        actual: usize,
    },
}

impl std::fmt::Display for ViewAdapterError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::OwnerOutOfI32 { value } => {
                write!(f, "owner {value} does not fit the renderer's i32")
            }
            Self::LengthMismatch {
                field,
                expected,
                actual,
            } => write!(f, "{field}: length {actual}, expected {expected}"),
        }
    }
}

impl std::error::Error for ViewAdapterError {}
