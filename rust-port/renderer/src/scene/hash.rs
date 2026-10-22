//! FNV-1a hashing of CPU geometry — the byte stream of the web generators
//! (`tests/fixtures/unit_core/gen.ts`, class `Fnv`, function `geoHash`),
//! shared by every model module (moved here from `unit_core::model`, whose
//! public paths re-export it).

use crate::geom::Mesh;

use super::graph::Scene;
use super::node::NodeKind;

/// FNV-1a 32-bit over little-endian bytes.
#[derive(Debug, Clone, Copy)]
pub struct Fnv(u32);

impl Default for Fnv {
    fn default() -> Self {
        Self(0x811c_9dc5)
    }
}

impl Fnv {
    /// One byte.
    pub fn byte(&mut self, b: u8) {
        self.0 ^= u32::from(b);
        self.0 = self.0.wrapping_mul(0x0100_0193);
    }
    /// `u32` little-endian.
    pub fn u32(&mut self, v: u32) {
        for b in v.to_le_bytes() {
            self.byte(b);
        }
    }
    /// `f32` little-endian bits.
    pub fn f32(&mut self, v: f32) {
        for b in v.to_le_bytes() {
            self.byte(b);
        }
    }
    /// `f64` little-endian bits.
    pub fn f64(&mut self, v: f64) {
        for b in v.to_le_bytes() {
            self.byte(b);
        }
    }
    /// Current hash.
    #[must_use]
    pub const fn finish(self) -> u32 {
        self.0
    }
}

/// `usize` → `u32`, saturating.
#[must_use]
pub fn len_u32(n: usize) -> u32 {
    u32::try_from(n).unwrap_or(u32::MAX)
}

/// Geometry hash: vertex count, position/normal/uv floats, index, groups —
/// same byte stream as `geoHash` in `gen.ts`.
#[must_use]
pub fn geo_hash(m: &Mesh) -> u32 {
    let mut f = Fnv::default();
    f.u32(len_u32(m.vertex_count()));
    for arr in [&m.positions, &m.normals, &m.uvs] {
        f.u32(len_u32(arr.len()));
        for &v in arr {
            f.f32(v);
        }
    }
    match &m.indices {
        Some(idx) => {
            f.byte(1);
            f.u32(len_u32(idx.len()));
            for &i in idx {
                f.u32(i);
            }
        }
        None => f.byte(0),
    }
    f.u32(len_u32(m.groups.len()));
    for g in &m.groups {
        f.u32(g.start);
        f.u32(g.count);
        f.u32(g.material_index);
    }
    f.finish()
}

/// Model signature (`signature` of `tests/fixtures/unit_core/gen.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Signature {
    /// Number of meshes.
    pub meshes: u32,
    /// Number of triangles.
    pub tris: u32,
    /// FNV-1a over (geometry hash, material, world matrix) of every mesh.
    pub sig: u32,
}

/// The parity signature of the unit-core generator (`signature` in
/// `tests/fixtures/unit_core/gen.ts`): mesh count, triangle count and a hash
/// of every mesh's geometry, material parameters (`color.getHex()`,
/// `metalness`, `roughness`, `transparent`, `opacity`, `flatShading`) and
/// world matrix, in traverse order.
#[must_use]
pub fn signature(m: &Scene) -> Signature {
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
        f.f64(mt.metalness);
        f.f64(mt.roughness);
        f.byte(u8::from(mt.transparent));
        f.f64(mt.opacity);
        f.byte(u8::from(mt.flat_shading));
        for e in world[id].e {
            f.f64(e);
        }
    }
    f.u32(meshes);
    Signature {
        meshes,
        tris,
        sig: f.finish(),
    }
}

impl Scene {
    /// [`signature`] (`model.signature()`, the call shape of the parity
    /// tests).
    #[must_use]
    pub fn signature(&self) -> Signature {
        signature(self)
    }
}
