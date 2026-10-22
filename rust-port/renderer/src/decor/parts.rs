//! The non-indexed vertex-colour emitter shared by every decor file of the
//! web (`interface Parts`, `rgb`, `pushTri`, `zbudujGeometrie`), identical in
//! `lasy-modele.ts:165-180`, `djungla-modele.ts:46-60`,
//! `teren-gory-wzgorza.ts:160-175`, `dekor-laki-rowniny.ts:171-186`,
//! `oaza-pustynia.ts:322-337` and `tarasy-model.ts:114-129` (each file has
//! its own copy; the operations are the same, so one Rust copy serves all).
//!
//! Positions and colours are accumulated as JavaScript numbers (f64) and
//! rounded to `f32` once, like `new THREE.Float32BufferAttribute(P.pos, 3)`;
//! normals come from `computeVertexNormals()` on the non-indexed geometry
//! (flat face normals), [`crate::geom::Mesh::compute_vertex_normals`].

use crate::core::scene::{Geometry, Material, MaterialKind};
use crate::geom::Mesh;

/// `type V3 = [number, number, number]`.
pub(crate) type V3 = [f64; 3];

/// `interface Parts { pos: number[]; col: number[]; }`.
#[derive(Debug, Default)]
pub(crate) struct Parts {
    pub(crate) pos: Vec<f64>,
    pub(crate) col: Vec<f64>,
}

/// `rgb(hex)`: `[((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]`.
pub(crate) fn rgb(hex: u32) -> V3 {
    [
        f64::from((hex >> 16) & 255) / 255.0,
        f64::from((hex >> 8) & 255) / 255.0,
        f64::from(hex & 255) / 255.0,
    ]
}

impl Parts {
    /// `pushTri(P, a, b, c, col, ref)`: swaps `b`/`c` when the face normal
    /// points away from `ref`.
    pub(crate) fn tri(&mut self, a: V3, b: V3, c: V3, col: V3, r: V3) {
        let (ux, uy, uz) = (b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        let (vx, vy, vz) = (c[0] - a[0], c[1] - a[1], c[2] - a[2]);
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        let (b, c) = if nx * r[0] + ny * r[1] + nz * r[2] < 0.0 {
            (c, b)
        } else {
            (b, c)
        };
        self.pos
            .extend_from_slice(&[a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]]);
        for _ in 0..3 {
            self.col.extend_from_slice(&col);
        }
    }

    /// `quad(P, a, b, c, d, col, ref)` (`tarasy-model.ts:131-134`).
    pub(crate) fn quad(&mut self, a: V3, b: V3, c: V3, d: V3, col: V3, r: V3) {
        self.tri(a, b, c, col, r);
        self.tri(a, c, d, col, r);
    }

    /// `zbudujGeometrie(P, nazwa)`: `position` + `color` as `Float32`,
    /// `computeVertexNormals()`.
    #[allow(clippy::cast_possible_truncation)]
    pub(crate) fn into_geometry(self) -> Geometry {
        let mut mesh = Mesh {
            positions: self.pos.iter().map(|&v| v as f32).collect(),
            ..Mesh::default()
        };
        mesh.compute_vertex_normals();
        Geometry {
            mesh,
            colors: Some(self.col.iter().map(|&v| v as f32).collect()),
        }
    }
}

/// `new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })`
/// — `LAS_MATERIAL`, `DJUNGLA_MATERIAL`, `TEREN_MATERIAL`, `DEKOR_MATERIAL`,
/// `DEKOR_PUSTYNIA_MATERIAL`, `TARASY_MATERIAL` (colour = default white).
#[must_use]
pub fn vertex_color_material() -> Material {
    let mut m = Material::new(MaterialKind::Lambert, None);
    m.vertex_colors = true;
    m.flat_shading = true;
    m
}

/// `new THREE.MeshLambertMaterial({ color, flatShading: flat })` (`mat()` of
/// `mapRenderStyle.ts:353-355` and `oaza-pustynia.ts:85-87`).
#[must_use]
pub fn lambert(color: u32, flat: bool) -> Material {
    let mut m = Material::lambert(color);
    m.flat_shading = flat;
    m
}
