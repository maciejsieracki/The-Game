//! `render/hexutil.ts` (web `edb8fb56`, 71 LOC): pointy-top axial ↔ world.
//!
//! **Already ported in P4.10** (`crate::pick::hex`, topic RR-T3); this module
//! only re-exports it under the MOD-01 name so that model topics have a single
//! `core` entry point. Nothing is reimplemented here.
//!
//! | web (`hexutil.ts`) | Rust |
//! |---|---|
//! | `HEX_R` (`:24`) | [`HEX_R`] |
//! | `SQRT3` (`:26`) | [`sqrt3`] (function: `f64::sqrt` is not `const`) |
//! | `axialToWorld(q, r, R)` (`:32-36`) | [`axial_to_world_f`] (any `q, r`), [`axial_to_world`] (integer hex) |
//! | `mapCenter(w, h, R)` (`:41-45`) | [`map_center`] |
//! | `worldToAxial(x, z, R)` (`:53-71`) | [`world_to_axial`] (= `world_to_axial_hexutil`; the picker's variant with a different tie rule is `crate::pick::hex::world_to_axial_picker`) |

pub use crate::pick::hex::{
    axial_to_world, axial_to_world_f, map_center, sqrt3, world_to_axial_hexutil as world_to_axial,
    HexCoord, HEX_R,
};

/// The web hex key `` `${q},${r}` `` used by every `Set<string>` / `Map` of
/// the renderer (fog sets, decor maps).
#[must_use]
pub fn hex_key(h: HexCoord) -> String {
    format!("{},{}", h.q, h.r)
}
