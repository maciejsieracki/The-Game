//! `core` — MOD-01 of `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` §5
//! (topic R-RUSTPORT-P4-12-MOD01-CORE-Q1): the foundation the model topics
//! (MOD-02..MOD-15) build on. Ports, 1:1 with web `edb8fb56`:
//!
//! | web file | module | note |
//! |---|---|---|
//! | `render/hexutil.ts` | [`hexutil`] | re-export of `crate::pick::hex` (P4.10) |
//! | `render/hexShape.ts` | [`hex_shape`] | on `crate::geom::Path2` (P4.8) |
//! | `render/fogDim.ts` | [`fog_dim`] | decor fog; prism fog is `crate::terrain` (P4.11) |
//! | `render/zoomLod.ts` | [`zoom_lod`] | zoom-out ladder + city-badge LOD |
//! | `render/mergeDecor.ts` | [`merge_decor`] | per-hex decor collapse, on [`scene`] |
//! | `render/unitVitalsPalette.ts` | [`vitals`] | constants |
//! | `render/mapRenderStyle.ts` (no builders) | [`map_style`] | presets, heights, palettes |
//! | `render/bronzeCity.ts` (types + `rnd`) | [`bronze`] | builder = D-MOD-1 |
//!
//! [`scene`] is the minimal CPU model tree (mesh + material parameters as
//! data, no GPU) that `fogDim`/`mergeDecor` operate on; [`jsnum`] holds the
//! JavaScript number semantics they need.
//!
//! Verified against vectors produced by running the web modules themselves
//! (`tests/core_web_parity.rs`, `tests/fixtures/core/`).

pub mod bronze;
pub mod fog_dim;
pub mod hex_shape;
pub mod hexutil;
pub mod jsnum;
pub mod map_style;
pub mod merge_decor;
pub mod scene;
pub mod vitals;
pub mod zoom_lod;
