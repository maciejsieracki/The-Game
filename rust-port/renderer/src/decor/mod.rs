//! `decor` — MOD-03 of `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md`
//! (topic R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1): terrain decorations,
//! ported 1:1 from the web at pin `edb8fb56`.
//!
//! | web file (`gra/src/render/`) | module | content |
//! |---|---|---|
//! | `lasy-modele.ts` | [`forest`] | 5 forest clumps |
//! | `djungla-modele.ts` | [`jungle`] | 5 jungle clumps |
//! | `teren-gory-wzgorza.ts` | [`relief`] | 5 hills + 5 mountains, `powierzchniaReliefuY` |
//! | `dekor-laki-rowniny.ts` | [`meadow`] | 4 meadow + 4 plains micro-decors |
//! | `oaza-pustynia.ts` | [`desert`] | 4 desert micro-decors + the oasis |
//! | `tarasy-model.ts` | [`terraces`] | 2 terrace overlays (hill W0 / W3) |
//! | `mapRenderStyle.ts` (builders, roblox) | [`style`] | forest cluster, peak, hill, terrace mound, pads, coast caps, dune, oasis |
//! | `riverLod.ts` | [`river_lod`] | river merge buckets, LOD, ribbon fog index |
//!
//! 34 shared geometry variants: 5 + 5 + 2×5 + 2×4 + 4 + 2.
//!
//! A model is a [`crate::scene::Scene`] (the renderer's one scene-tree type
//! since P4.27; [`DecorObject`] is an alias). `name` and `renderOrder` are
//! node fields. Meshes carry CPU geometry
//! ([`crate::scene::Geometry`]: `geom::Mesh` + the
//! `color` attribute) and material parameters as data. No GPU.
//!
//! Numerics: `Math.sin/cos/pow/hypot` follow V8 ([`js`]); every geometry,
//! node transform, world matrix and bounding box is verified bit for bit
//! against vectors produced by running the web modules
//! (`tests/decor_web_parity.rs`, `tests/fixtures/decor/`).

pub mod desert;
pub mod forest;
pub mod js;
pub mod jungle;
pub mod meadow;
mod object;
mod parts;
pub mod relief;
pub mod river_lod;
pub mod style;
pub mod terraces;

pub use object::DecorObject;
pub use parts::{lambert, vertex_color_material};
