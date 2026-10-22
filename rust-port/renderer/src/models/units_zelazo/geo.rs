//! Geometries of the MOD-07 Iron package that neither the unit-core
//! [`Prim`] nor the MOD-06 [`BrazGeo`] describe
//! (`R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1`), module bodies
//! ([`crate::scene::GeoBody`]) of the one scene type since P4.27:
//!
//! - `RingGeometry` (`hastati-falangita.ts:229`, `jednostki-p6-super.ts:269`);
//! - the iron rim strip of the Hastati scutum (`makeOvalRimGeo`,
//!   `hastati-opus5.ts:326-349`);
//! - the narrow javelin head (`sjMakeLeafHeadGeo`,
//!   `zelazo-jezdziec-oszczepami-opus5.ts:527-551`), a section loft with its
//!   own profile table.
//!
//! The oval scutum shell / face (`makeOvalShellGeo`, `z1MakeShell`,
//! `z2OvalShellGeo`, `s6OvalShellGeo`, `trOvalShell`, … — textually the same
//! function as the MOD-06 copies) and the leaf lance head of
//! `acMakeLeafHeadGeo` (the MOD-06 `LeafHead` profile) are the existing
//! [`BrazGeo`] values (one implementation).
//!
//! Hand-built bodies are rebuilt vertex for vertex: positions computed in
//! `f64` like the JavaScript source, stored as `f32`
//! (`Float32BufferAttribute`), non-indexed, then `computeVertexNormals()`.
//!
//! [`Prim`]: crate::models::unit_core::model::Prim
//! [`BrazGeo`]: crate::models::units_braz::geo::BrazGeo

use crate::geom;
use crate::jsmath::{js_cos, js_sin};
use std::f64::consts::PI;

/// Rim segment subset of `makeOvalRimGeo` (`HO_RIM_TOP` / `HO_RIM_BOT`,
/// `hastati-opus5.ts:352-353`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RimArc {
    /// `HO_RIM_TOP = [N - 2, N - 1, 0, 1]`.
    Top,
    /// `HO_RIM_BOT = [N/2 - 2, N/2 - 1, N/2, N/2 + 1]`.
    Bottom,
}

impl RimArc {
    /// Segment indices for a ring of `n` points (`n` even).
    #[must_use]
    pub const fn indices(self, n: u32) -> [u32; 4] {
        match self {
            Self::Top => [n - 2, n - 1, 0, 1],
            Self::Bottom => [n / 2 - 2, n / 2 - 1, n / 2, n / 2 + 1],
        }
    }
}

/// A MOD-07 geometry (all parameters already multiplied by `HEX_R`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ZelazoGeo {
    /// `new THREE.RingGeometry(inner, outer, thetaSegments, phiSegments)`
    /// (full circle).
    Ring {
        /// Inner radius.
        inner: f64,
        /// Outer radius.
        outer: f64,
        /// `thetaSegments`.
        theta_seg: u32,
        /// `phiSegments`.
        phi_seg: u32,
    },
    /// `makeOvalRimGeo(a, b, c, t2, N, idx, k)` (`hastati-opus5.ts:326-349`).
    OvalRim {
        /// Half width of the inner outline.
        a: f64,
        /// Half height of the inner outline.
        b: f64,
        /// Bow depth.
        c: f64,
        /// Strip thickness.
        t2: f64,
        /// Ring points.
        n: u32,
        /// Segment subset.
        arc: RimArc,
        /// Outer scale factor.
        k: f64,
    },
    /// `sjMakeLeafHeadGeo(len, wMax, tMax)`
    /// (`zelazo-jezdziec-oszczepami-opus5.ts:527-551`).
    JavelinHead {
        /// Length (along +Y).
        len: f64,
        /// Maximum width.
        w_max: f64,
        /// Maximum thickness.
        t_max: f64,
    },
}

impl ZelazoGeo {
    /// Three.js `geometry.type` of the web object.
    #[must_use]
    pub const fn three_type(&self) -> &'static str {
        match self {
            Self::Ring { .. } => "RingGeometry",
            Self::OvalRim { .. } | Self::JavelinHead { .. } => "BufferGeometry",
        }
    }

    /// Builds the geometry (vertex-for-vertex like the web code).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        match *self {
            Self::Ring {
                inner,
                outer,
                theta_seg,
                phi_seg,
            } => geom::ring_geometry(inner, outer, theta_seg, phi_seg, 0.0, PI * 2.0),
            Self::OvalRim {
                a,
                b,
                c,
                t2,
                n,
                arc,
                k,
            } => from_positions(&oval_rim_positions(a, b, c, t2, n, arc, k)),
            Self::JavelinHead { len, w_max, t_max } => {
                from_positions(&javelin_head_positions(len, w_max, t_max))
            }
        }
    }
}

/// `new Float32BufferAttribute(pos, 3)` + `computeVertexNormals()`.
fn from_positions(pos: &[f64]) -> geom::Mesh {
    #[allow(clippy::cast_possible_truncation)]
    let positions: Vec<f32> = pos.iter().map(|&v| v as f32).collect();
    let mut m = geom::Mesh {
        positions,
        normals: Vec::new(),
        uvs: Vec::new(),
        indices: None,
        groups: Vec::new(),
    };
    m.compute_vertex_normals();
    m
}

type P3 = [f64; 3];

/// `hoOvalRing(a, b, c, N)` (`hastati-opus5.ts:280-288`).
fn oval_ring(a: f64, b: f64, c: f64, n: u32) -> Vec<P3> {
    (0..n)
        .map(|i| {
            let ang = (f64::from(i) / f64::from(n)) * PI * 2.0 + PI / 2.0;
            let x = js_cos(ang) * a;
            let y = js_sin(ang) * b;
            [x, y, -c * (x / a) * (x / a)]
        })
        .collect()
}

/// Body of `makeOvalRimGeo`.
fn oval_rim_positions(a: f64, b: f64, c: f64, t2: f64, n: u32, arc: RimArc, k: f64) -> Vec<f64> {
    let inner = oval_ring(a, b, c, n);
    let outer = oval_ring(a * k, b * k, c * k, n);
    let mut pos = Vec::new();
    let mut p = |v: P3, dz: f64| pos.extend_from_slice(&[v[0], v[1], v[2] + dz]);
    let f = t2 * 0.5;
    let bk = -t2 * 0.5;
    let nu = n as usize;
    for i in arc.indices(n) {
        let i = i as usize;
        let (pi, qi) = (inner[i], inner[(i + 1) % nu]);
        let (po, qo) = (outer[i], outer[(i + 1) % nu]);
        p(pi, f);
        p(po, f);
        p(qo, f);
        p(pi, f);
        p(qo, f);
        p(qi, f);
        p(pi, bk);
        p(qo, bk);
        p(po, bk);
        p(pi, bk);
        p(qi, bk);
        p(qo, bk);
        p(po, f);
        p(po, bk);
        p(qo, bk);
        p(po, f);
        p(qo, bk);
        p(qo, f);
    }
    pos
}

fn quad(pos: &mut Vec<f64>, a: P3, b: P3, c: P3, d: P3) {
    for p in [a, b, c, a, c, d] {
        pos.extend_from_slice(&p);
    }
}

/// Body of `sjMakeLeafHeadGeo`.
fn javelin_head_positions(len: f64, w_max: f64, t_max: f64) -> Vec<f64> {
    const SECTIONS: [P3; 5] = [
        [0.00, 0.30, 0.60],
        [0.16, 0.78, 1.00],
        [0.42, 1.00, 0.88],
        [0.76, 0.54, 0.50],
        [1.00, 0.04, 0.10],
    ];
    let s: Vec<P3> = SECTIONS
        .iter()
        .map(|&[y, w, t]| [y * len, w * w_max * 0.5, t * t_max * 0.5])
        .collect();
    let mut pos = Vec::new();
    for i in 0..s.len() - 1 {
        let [y0, w0, t0] = s[i];
        let [y1, w1, t1] = s[i + 1];
        quad(
            &mut pos,
            [-w0, y0, t0],
            [w0, y0, t0],
            [w1, y1, t1],
            [-w1, y1, t1],
        );
        quad(
            &mut pos,
            [w0, y0, -t0],
            [-w0, y0, -t0],
            [-w1, y1, -t1],
            [w1, y1, -t1],
        );
        quad(
            &mut pos,
            [w0, y0, t0],
            [w0, y0, -t0],
            [w1, y1, -t1],
            [w1, y1, t1],
        );
        quad(
            &mut pos,
            [-w0, y0, -t0],
            [-w0, y0, t0],
            [-w1, y1, t1],
            [-w1, y1, -t1],
        );
    }
    let b = s[0];
    quad(
        &mut pos,
        [-b[1], b[0], -b[2]],
        [b[1], b[0], -b[2]],
        [b[1], b[0], b[2]],
        [-b[1], b[0], b[2]],
    );
    pos
}

/// The Iron package bodies are module geometries of the one scene type
/// (P4.27): they replace the former `Prim::Zelazo` hook.
impl crate::scene::GeoBody for ZelazoGeo {
    fn build(&self) -> geom::Mesh {
        ZelazoGeo::build(self)
    }
    fn three_type(&self) -> &'static str {
        ZelazoGeo::three_type(self)
    }
}
