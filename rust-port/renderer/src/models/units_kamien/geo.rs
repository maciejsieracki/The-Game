//! Geometries of the MOD-05 package that are not Three.js primitives with a
//! [`Prim`](crate::models::unit_core::model::Prim) counterpart: the hand-built
//! `BufferGeometry` bodies of `kamien-bazowe-opus5.ts` (`makeTaperGeo`) and
//! `kamien-zulu-taran-opus5.ts` (`kzShellGeo`, `kzFaceGeo`), plus
//! `CircleGeometry` (`getKZPatch`).
//!
//! Every body is rebuilt vertex for vertex: positions are computed in `f64`
//! exactly like the JavaScript source, stored as `f32`
//! (`Float32BufferAttribute`), non-indexed, then `computeVertexNormals()`; no
//! UVs.

use crate::geom::{self, Mesh};
use crate::jsmath::{js_cos, js_pow, js_sin};
use std::f64::consts::PI;

use super::kit::js_sign;

/// Section profile of `makeTaperGeo` (`[y, halfW, halfT]` fractions).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaperProfile {
    /// `makeCeltGeo` (`kamien-bazowe-opus5.ts:217-221`): polished flint axe.
    Celt,
    /// `makeLeafPointGeo` (`:224-229`): leaf-shaped javelin point / knife.
    LeafPoint,
    /// `makeBarbedPointGeo` (`:232-237`): barbed arrowhead.
    BarbedPoint,
}

impl TaperProfile {
    /// The `[y, w, t]` fractions in source order.
    #[must_use]
    pub const fn sections(self) -> &'static [[f64; 3]] {
        match self {
            Self::Celt => &[
                [0.00, 0.50, 0.82],
                [0.34, 0.66, 1.00],
                [0.76, 0.94, 0.70],
                [1.00, 1.00, 0.10],
            ],
            Self::LeafPoint => &[
                [0.00, 0.30, 0.55],
                [0.16, 0.80, 1.00],
                [0.46, 1.00, 0.92],
                [0.76, 0.66, 0.60],
                [1.00, 0.05, 0.14],
            ],
            Self::BarbedPoint => &[
                [0.00, 0.16, 0.40],
                [0.10, 1.00, 0.90],
                [0.24, 0.86, 1.00],
                [0.66, 0.48, 0.66],
                [1.00, 0.05, 0.16],
            ],
        }
    }
}

/// Geometry description (copyable, like every `Prim`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum KamienGeo {
    /// `makeTaperGeo(profile.map(([y, w, t]) => [y * len, w * wMax * 0.5,
    /// t * tMax * 0.5]))`.
    Taper {
        /// Profile.
        profile: TaperProfile,
        /// `len`.
        len: f64,
        /// `wMax`.
        w_max: f64,
        /// `tMax`.
        t_max: f64,
    },
    /// `kzShellGeo(a, b, c, t, N)` (`kamien-zulu-taran-opus5.ts:245-261`).
    NguniShell {
        /// Horizontal half axis.
        a: f64,
        /// Vertical half axis.
        b: f64,
        /// Bow depth.
        c: f64,
        /// Shell thickness.
        t: f64,
        /// Ring points.
        n: u32,
    },
    /// `kzFaceGeo(a, b, c, N)` (`:263-274`).
    NguniFace {
        /// Horizontal half axis.
        a: f64,
        /// Vertical half axis.
        b: f64,
        /// Bow depth.
        c: f64,
        /// Ring points.
        n: u32,
    },
    /// `CircleGeometry(r, segments)` (default `thetaStart = 0`,
    /// `thetaLength = 2π`).
    Circle {
        /// Radius.
        r: f64,
        /// Segments.
        segments: u32,
    },
}

/// `KZ_SH_P` (`kamien-zulu-taran-opus5.ts:231`).
const KZ_SH_P: f64 = 1.32;

impl KamienGeo {
    /// Builds the CPU geometry.
    #[must_use]
    pub fn build(&self) -> Mesh {
        match *self {
            Self::Taper {
                profile,
                len,
                w_max,
                t_max,
            } => {
                let sections: Vec<[f64; 3]> = profile
                    .sections()
                    .iter()
                    .map(|&[y, w, t]| [y * len, w * w_max * 0.5, t * t_max * 0.5])
                    .collect();
                taper_geometry(&sections)
            }
            Self::NguniShell { a, b, c, t, n } => nguni_shell(a, b, c, t, n),
            Self::NguniFace { a, b, c, n } => nguni_face(a, b, c, n),
            Self::Circle { r, segments } => geom::circle_geometry(r, segments, 0.0, PI * 2.0),
        }
    }
}

/// Non-indexed mesh from `f64` positions (`Float32BufferAttribute`) +
/// `computeVertexNormals()`.
fn finish(pos: &[f64]) -> Mesh {
    #[allow(clippy::cast_possible_truncation)]
    let positions: Vec<f32> = pos.iter().map(|&v| v as f32).collect();
    let mut m = Mesh {
        positions,
        normals: Vec::new(),
        uvs: Vec::new(),
        indices: None,
        groups: Vec::new(),
    };
    m.compute_vertex_normals();
    m
}

/// `makeTaperGeo(sections)` (`kamien-bazowe-opus5.ts:189-214`).
fn taper_geometry(sections: &[[f64; 3]]) -> Mesh {
    let mut pos: Vec<f64> = Vec::new();
    let mut quad = |a: [f64; 3], b: [f64; 3], c: [f64; 3], d: [f64; 3]| {
        for v in [a, b, c, a, c, d] {
            pos.extend_from_slice(&v);
        }
    };
    for i in 0..sections.len() - 1 {
        let [y0, w0, t0] = sections[i];
        let [y1, w1, t1] = sections[i + 1];
        quad([-w0, y0, t0], [w0, y0, t0], [w1, y1, t1], [-w1, y1, t1]);
        quad([w0, y0, -t0], [-w0, y0, -t0], [-w1, y1, -t1], [w1, y1, -t1]);
        quad([w0, y0, t0], [w0, y0, -t0], [w1, y1, -t1], [w1, y1, t1]);
        quad([-w0, y0, -t0], [-w0, y0, t0], [-w1, y1, t1], [-w1, y1, -t1]);
    }
    let b = sections[0];
    quad(
        [-b[1], b[0], -b[2]],
        [b[1], b[0], -b[2]],
        [b[1], b[0], b[2]],
        [-b[1], b[0], b[2]],
    );
    finish(&pos)
}

/// `kzNguniRing(a, b, c, N)` (`kamien-zulu-taran-opus5.ts:233-243`).
fn nguni_ring(a: f64, b: f64, c: f64, n: u32) -> Vec<[f64; 3]> {
    (0..n)
        .map(|i| {
            let ang = (f64::from(i) / f64::from(n)) * PI * 2.0 + PI / 2.0;
            let cx = js_cos(ang);
            let x = a * js_sign(cx) * js_pow(cx.abs(), KZ_SH_P);
            let y = b * js_sin(ang);
            [x, y, -c * (x / a) * (x / a)]
        })
        .collect()
}

/// `kzShellGeo` (`:245-261`).
fn nguni_shell(a: f64, b: f64, c: f64, t: f64, n: u32) -> Mesh {
    let ring = nguni_ring(a, b, c, n);
    let mut pos: Vec<f64> = Vec::new();
    let f = t * 0.5;
    let bk = -t * 0.5;
    let n = ring.len();
    for i in 0..n {
        let p = ring[i];
        let q = ring[(i + 1) % n];
        for v in [
            [0.0, 0.0, f],
            [p[0], p[1], p[2] + f],
            [q[0], q[1], q[2] + f],
            [0.0, 0.0, bk],
            [q[0], q[1], q[2] + bk],
            [p[0], p[1], p[2] + bk],
            [p[0], p[1], p[2] + f],
            [p[0], p[1], p[2] + bk],
            [q[0], q[1], q[2] + bk],
            [p[0], p[1], p[2] + f],
            [q[0], q[1], q[2] + bk],
            [q[0], q[1], q[2] + f],
        ] {
            pos.extend_from_slice(&v);
        }
    }
    finish(&pos)
}

/// `kzFaceGeo` (`:263-274`).
fn nguni_face(a: f64, b: f64, c: f64, n: u32) -> Mesh {
    let ring = nguni_ring(a, b, c, n);
    let mut pos: Vec<f64> = Vec::new();
    let n = ring.len();
    for i in 0..n {
        let p = ring[i];
        let q = ring[(i + 1) % n];
        pos.extend_from_slice(&[0.0, 0.0, 0.0, p[0], p[1], p[2], q[0], q[1], q[2]]);
    }
    finish(&pos)
}

/// The Stone package bodies are module geometries of the one scene type
/// (P4.27): they replace the former `Prim::Kamien` hook.
impl crate::scene::GeoBody for KamienGeo {
    fn build(&self) -> Mesh {
        KamienGeo::build(self)
    }
    fn three_type(&self) -> &'static str {
        match self {
            Self::Taper { .. } | Self::NguniShell { .. } | Self::NguniFace { .. } => {
                "BufferGeometry"
            }
            Self::Circle { .. } => "CircleGeometry",
        }
    }
}
