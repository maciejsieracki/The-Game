//! Object tree of the MOD-13 models.
//!
//! Since R-RUSTPORT-P4-27-SCENE-UNIFY-Q1 a MOD-13 model is the renderer's
//! one scene-tree type, [`crate::scene::Scene`] ([`MiscModel`] is an alias).
//! What P4.22 kept in side tables (`NodeInfo`: shadows, `renderOrder`,
//! circle / ring meshes, sprites; `MiscMaterial` mirrored into the unit
//! tree) is now carried by the scene itself:
//! - materials ([`MiscMaterial`] = [`Material`]) hold the class
//!   ([`MatKind`] = [`crate::scene::MaterialKind`]), colour, flat shading,
//!   transparency, depth flags, side, polygon offset and the glyph map;
//! - `CircleGeometry` / `RingGeometry` are parametric [`Prim`]s
//!   ([`MiscGeo`] = [`Geo`]);
//! - sprites are [`NodeKind::Sprite`] nodes; `castShadow` /
//!   `receiveShadow` / `renderOrder` are node fields.
//!
//! Only the MOD-13 parity signature (a different byte stream from the unit
//! one) is specific to this module: [`signature`].

use crate::scene::{geo_hash, hash::len_u32, Fnv};
pub use crate::scene::{
    Geo, GlyphTexture, Material, MaterialKind as MatKind, NodeKind, Prim, Scene, Side,
};

/// A MOD-13 model (alias of [`Scene`]).
pub type MiscModel = Scene;

/// Material parameters of a MOD-13 model (alias of [`Material`]).
pub type MiscMaterial = Material;

/// Geometry of a MOD-13 mesh (alias of [`Geo`]: a primitive of the unit
/// builders, `CircleGeometry` = [`Prim::Circle`], `RingGeometry` =
/// [`Prim::Ring`]).
pub type MiscGeo = Geo;

/// Model summary (`signature` in `tests/fixtures/misc/gen.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MiscSignature {
    /// Number of meshes.
    pub meshes: u32,
    /// Number of triangles.
    pub tris: u32,
    /// FNV-1a over (geometry hash, colour, flatShading, transparent,
    /// opacity, world matrix) of every mesh in traverse order.
    pub sig: u32,
}

/// The MOD-13 signature: same byte stream as `treeRecord` in
/// `tests/fixtures/misc/gen.ts` (geometry hash, `color.getHex()`,
/// `flatShading`, `transparent`, `opacity`, world matrix of every mesh in
/// traverse order).
#[must_use]
pub fn signature(m: &Scene) -> MiscSignature {
    let world = m.world_matrices(None);
    let mut f = Fnv::default();
    let mut meshes = 0u32;
    let mut tris = 0u32;
    for id in m.meshes() {
        let NodeKind::Mesh(md) = &m.nodes[id].kind else {
            continue;
        };
        let g = md.geo.mesh();
        meshes += 1;
        tris += len_u32(g.triangle_count());
        f.u32(geo_hash(&g));
        let mt = &m.materials[md.material()];
        f.u32(mt.hex());
        f.byte(u8::from(mt.flat_shading));
        f.byte(u8::from(mt.transparent));
        f.f64(mt.opacity);
        for e in world[id].e {
            f.f64(e);
        }
    }
    f.u32(meshes);
    MiscSignature {
        meshes,
        tris,
        sig: f.finish(),
    }
}
