//! Geometries of the MOD-06 Bronze package that the unit-core [`Prim`]
//! does not describe: `OctahedronGeometry` and the hand-built
//! `BufferGeometry` bodies (non-indexed, positions only, then
//! `computeVertexNormals()`), hooked into the unit-core tree through
//! `Prim::Braz` (`R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1`).
//!
//! [`Prim`]: crate::models::unit_core::model::Prim

use crate::geom;
use crate::jsmath::{js_cos, js_sin};
use std::f64::consts::PI;

/// Section table of a lens blade / spear head (`[y, w, t]` per section).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BladeProfile {
    /// Leaf spear head: `knMakeLeafHeadGeo` (`braz-konnica-opus5.ts:387-411`),
    /// `wbMakeLeafHeadGeo` (`braz-wlocznik-opus5.ts:320-344`).
    LeafHead,
    /// Rapier blade: `makeRapierBladeGeo` (`braz-miecznik-opus5.ts:326-352`).
    Rapier,
}

impl BladeProfile {
    const fn sections(self) -> [[f64; 3]; 5] {
        match self {
            Self::LeafHead => [
                [0.00, 0.34, 0.60],
                [0.14, 0.82, 1.00],
                [0.40, 1.00, 0.90],
                [0.74, 0.62, 0.56],
                [1.00, 0.04, 0.12],
            ],
            Self::Rapier => [
                [0.00, 0.62, 0.55],
                [0.08, 1.00, 0.66],
                [0.55, 0.60, 0.42],
                [0.84, 0.30, 0.24],
                [1.00, 0.04, 0.10],
            ],
        }
    }
}

/// A MOD-06 geometry (all parameters already multiplied by `HEX_R`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum BrazGeo {
    /// `new THREE.OctahedronGeometry(r, detail)` (`braz-procarz-opus5.ts:236,253`).
    Octahedron {
        /// Radius.
        r: f64,
        /// Detail.
        detail: u32,
    },
    /// Section-lofted blade (`knMakeLeafHeadGeo` / `wbMakeLeafHeadGeo` /
    /// `makeRapierBladeGeo`): 4 side quads per section pair + base cap.
    Blade {
        /// Section table.
        profile: BladeProfile,
        /// Length (along +Y).
        len: f64,
        /// Maximum width.
        w_max: f64,
        /// Maximum thickness.
        t_max: f64,
    },
    /// Faceted oval shield shell (`pdOvalShellGeo`, `msMakeShell`,
    /// `wmOvalShell`, `bwMakeShell`, `p8MakeOvalShellGeo` — textually the
    /// same function in five files).
    OvalShell {
        /// Half width.
        a: f64,
        /// Half height.
        b: f64,
        /// Bulge.
        c: f64,
        /// Thickness.
        t: f64,
        /// Ring points.
        n: u32,
    },
    /// Faceted oval shield face (`pdOvalFaceGeo`, `wmOvalFace`, `bwMakeFace`,
    /// `p8MakeOvalFaceGeo`).
    OvalFace {
        /// Half width.
        a: f64,
        /// Half height.
        b: f64,
        /// Bulge.
        c: f64,
        /// Ring points.
        n: u32,
    },
}

impl BrazGeo {
    /// Three.js `geometry.type` of the web object.
    #[must_use]
    pub const fn three_type(&self) -> &'static str {
        match self {
            Self::Octahedron { .. } => "OctahedronGeometry",
            Self::Blade { .. } | Self::OvalShell { .. } | Self::OvalFace { .. } => "BufferGeometry",
        }
    }

    /// Builds the geometry (vertex-for-vertex like the web code).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        match *self {
            Self::Octahedron { r, detail } => geom::octahedron_geometry(r, detail),
            Self::Blade {
                profile,
                len,
                w_max,
                t_max,
            } => from_positions(&blade_positions(profile, len, w_max, t_max)),
            Self::OvalShell { a, b, c, t, n } => {
                from_positions(&oval_shell_positions(a, b, c, t, n))
            }
            Self::OvalFace { a, b, c, n } => from_positions(&oval_face_positions(a, b, c, n)),
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

fn quad(pos: &mut Vec<f64>, a: P3, b: P3, c: P3, d: P3) {
    for p in [a, b, c, a, c, d] {
        pos.extend_from_slice(&p);
    }
}

/// Body of `knMakeLeafHeadGeo` / `wbMakeLeafHeadGeo` / `makeRapierBladeGeo`.
fn blade_positions(profile: BladeProfile, len: f64, w_max: f64, t_max: f64) -> Vec<f64> {
    let sections: Vec<P3> = profile
        .sections()
        .iter()
        .map(|&[y, w, t]| [y * len, w * w_max * 0.5, t * t_max * 0.5])
        .collect();
    let mut pos = Vec::new();
    for i in 0..sections.len() - 1 {
        let [y0, w0, t0] = sections[i];
        let [y1, w1, t1] = sections[i + 1];
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
    let b = sections[0];
    quad(
        &mut pos,
        [-b[1], b[0], -b[2]],
        [b[1], b[0], -b[2]],
        [b[1], b[0], b[2]],
        [-b[1], b[0], b[2]],
    );
    pos
}

/// `pdOvalRing` / `msOvalRing` / `wmOvalRing` / `bwOvalRing` / `p8OvalRing`.
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

fn oval_shell_positions(a: f64, b: f64, c: f64, t: f64, n: u32) -> Vec<f64> {
    let ring = oval_ring(a, b, c, n);
    let mut pos = Vec::new();
    let f = t * 0.5;
    let bk = -t * 0.5;
    let nu = ring.len();
    for i in 0..nu {
        let p = ring[i];
        let q = ring[(i + 1) % nu];
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
    pos
}

fn oval_face_positions(a: f64, b: f64, c: f64, n: u32) -> Vec<f64> {
    let ring = oval_ring(a, b, c, n);
    let mut pos = Vec::new();
    let nu = ring.len();
    for i in 0..nu {
        let p = ring[i];
        let q = ring[(i + 1) % nu];
        pos.extend_from_slice(&[0.0, 0.0, 0.0, p[0], p[1], p[2], q[0], q[1], q[2]]);
    }
    pos
}
