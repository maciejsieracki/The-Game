//! `scene` — the ONE scene-tree type of the renderer's model layer
//! (R-RUSTPORT-P4-27-SCENE-UNIFY-Q1).
//!
//! Before P4.27 the crate had three tree representations (the recursive
//! `core::scene::SceneNode` of P4.12 used by `decor`, the recursive
//! `wonders::model::Node`, and the `unit_core::model::UnitModel` arena with
//! side tables in `misc` / `improvements` / `cities` and the
//! `Prim::Kamien/Braz/Zelazo` geometry hooks). They are replaced by:
//!
//! - [`Scene`]: an arena of [`Node`]s (transform, payload, name, shadows,
//!   `renderOrder`, `matrixAutoUpdate`, `userData`) plus shared
//!   [`Material`]s referenced by slot;
//! - [`Geo`]: geometry as data — a parametric Three primitive ([`Prim`]), a
//!   procedural body owned by a model module ([`GeoBody`]) or a prebuilt
//!   shared CPU buffer ([`Geometry`]);
//! - [`Material`]: material parameters as data (class, linear colour,
//!   emissive, metalness / roughness, transparency, depth, side, polygon
//!   offset, map, fog base colour);
//! - [`export`]: a CPU-only view for the GPU layer (vertex / index buffers,
//!   colours, world transforms).
//!
//! No GPU, no shaders. Model modules keep their builders; only the tree type
//! they build changed, and every web-parity fixture is unchanged.

pub mod export;
pub mod geometry;
pub mod graph;
pub mod hash;
pub mod material;
pub mod node;

pub use export::{GeometryKey, GpuExport, GpuGroup, GpuMesh, GpuSprite, Topology};
pub use geometry::{DynEq, Geo, GeoBody, Geometry, Prim};
pub use graph::{Scene, WorldMesh};
pub use hash::{geo_hash, Fnv};
pub use material::{GlyphTexture, Material, MaterialKind, Side, Texture};
pub use node::{
    quat_from_unit_vectors, MatId, MeshData, Node, NodeId, NodeKind, UserData, UserValue, ROOT,
};

#[cfg(test)]
mod tests;
