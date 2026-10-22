//! `render/droga-6-ramion.ts` (six-armed road star) and the pure helpers of
//! `map/road-network.ts` it reads (`edb8fb56`).

#![allow(clippy::too_many_arguments)]

use crate::jsmath::js_atan2;
use crate::models::unit_core::model::{MatId, NodeId, Prim, ROOT};

use super::model::ImprovementExt;
use super::model::ImprovementModel;

/// `RoadTyp` (`droga-6-ramion.ts:47`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoadTyp {
    /// `'droga'` (dirt).
    Droga,
    /// `'droga_brukowana'` (cobbled).
    DrogaBrukowana,
}

/// `ROAD_DIRS` (`road-network.ts:32-34`): axial `(dq, dr)`, index = mask bit.
pub const ROAD_DIRS: [(f64, f64); 6] = [
    (1.0, 0.0),
    (1.0, -1.0),
    (0.0, -1.0),
    (-1.0, 0.0),
    (-1.0, 1.0),
    (0.0, 1.0),
];
/// `ROAD_MASK_NONE`.
pub const ROAD_MASK_NONE: u32 = 0;
/// `ROAD_MASK_FULL`.
pub const ROAD_MASK_FULL: u32 = 0b11_1111;
/// `ROAD_NODE_MIN_ARMS`.
pub const ROAD_NODE_MIN_ARMS: usize = 3;
/// `ROAD_ARM_WIDTH_RATIO = 15 / 54`.
pub const ROAD_ARM_WIDTH_RATIO: f64 = 15.0 / 54.0;
/// `ROAD_NODE_RADIUS_RATIO = 11 / 54`.
pub const ROAD_NODE_RADIUS_RATIO: f64 = 11.0 / 54.0;

fn sqrt3() -> f64 {
    3.0_f64.sqrt()
}

/// `roadMaskArms(mask)`: active direction indices.
#[must_use]
pub fn road_mask_arms(mask: u32) -> Vec<usize> {
    (0..ROAD_DIRS.len())
        .filter(|&i| mask & (1 << i) != 0)
        .collect()
}

/// `roadMaskHasNode(mask)`: 3+ arms.
#[must_use]
pub fn road_mask_has_node(mask: u32) -> bool {
    road_mask_arms(mask).len() >= ROAD_NODE_MIN_ARMS
}

/// `roadMaskIsLonePatch(mask)`: no arm.
#[must_use]
pub fn road_mask_is_lone_patch(mask: u32) -> bool {
    road_mask_arms(mask).is_empty()
}

/// `roadPortOffset(dir, hexR)` (`road-network.ts:137-143`); an unknown
/// direction uses `[0, 0]` like `ROAD_DIRS[dir] ?? [0, 0]`.
#[must_use]
pub fn road_port_offset(dir: usize, hex_r: f64) -> (f64, f64) {
    let (dq, dr) = ROAD_DIRS.get(dir).copied().unwrap_or((0.0, 0.0));
    (
        sqrt3() * (dq + dr / 2.0) * hex_r * 0.5,
        1.5 * dr * hex_r * 0.5,
    )
}

/// `roadPortRotationY(dir)`: `Math.atan2(-p.z, p.x)`.
#[must_use]
pub fn road_port_rotation_y(dir: usize) -> f64 {
    let (x, z) = road_port_offset(dir, 1.0);
    js_atan2(-z, x)
}

/// `roadArmLength(hexR)`: `(√3 / 2) · hexR`.
#[must_use]
pub fn road_arm_length(hex_r: f64) -> f64 {
    (sqrt3() / 2.0) * hex_r
}

/// Palette `P` (`droga-6-ramion.ts:50-54`).
mod pal {
    pub const DROGA_PAS: u32 = 0xd2b184;
    pub const DROGA_KOLEINA: u32 = 0xa8895e;
    pub const DROGA_PLAMA: u32 = 0xc3a173;
    pub const BRUK_BAZA: u32 = 0x7b8794;
    pub const BRUK_A: u32 = 0xb9c2ca;
    pub const BRUK_B: u32 = 0x939ea9;
    pub const KAMIEN: u32 = 0x9aa5b1;
}
use pal::*;

const H_GRUNT: f64 = 0.045;
const H_BRUK: f64 = 0.052;

/// Local `B`: cast + receive shadow, optional `rotation.y`.
fn b(
    m: &mut ImprovementModel,
    g: NodeId,
    w: f64,
    h: f64,
    d: f64,
    cx: f64,
    cy: f64,
    cz: f64,
    mat: MatId,
    ry: f64,
) {
    let id = m.mesh(g, Prim::bx(w, h, d), mat);
    m.node(id).set_pos(cx, cy, cz);
    if ry != 0.0 {
        m.node(id).rot_y(ry);
    }
    m.shadows(id, true, true);
}

/// Local `CYL`: `CylinderGeometry(r, r, h, seg)` at `(0, cy, 0)`, receive
/// shadow only.
fn cyl(m: &mut ImprovementModel, g: NodeId, r: f64, h: f64, cy: f64, mat: MatId, seg: u32) {
    let id = m.mesh(g, Prim::cyl(r, r, h, seg), mat);
    m.node(id).set_pos(0.0, cy, 0.0);
    m.shadows(id, false, true);
}

fn arm_gruntowe(
    m: &mut ImprovementModel,
    len: f64,
    w: f64,
    pas_m: MatId,
    koleina_m: MatId,
    kam_m: MatId,
) -> NodeId {
    let g = m.detached();
    b(
        m,
        g,
        len,
        H_GRUNT,
        w,
        len / 2.0,
        H_GRUNT / 2.0,
        0.0,
        pas_m,
        0.0,
    );
    for sz in [-1.0, 1.0] {
        b(
            m,
            g,
            len - w * 0.22,
            0.012,
            w * 0.19,
            len / 2.0,
            H_GRUNT + 0.004,
            sz * w * 0.27,
            koleina_m,
            0.0,
        );
    }
    b(
        m,
        g,
        w * 0.30,
        0.014,
        w * 0.24,
        len * 0.42,
        H_GRUNT + 0.005,
        w * 0.10,
        kam_m,
        0.6,
    );
    b(
        m,
        g,
        w * 0.24,
        0.014,
        w * 0.20,
        len * 0.78,
        H_GRUNT + 0.005,
        -w * 0.12,
        kam_m,
        -0.4,
    );
    g
}

fn arm_brukowane(
    m: &mut ImprovementModel,
    len: f64,
    w: f64,
    baza_m: MatId,
    plyta_a: MatId,
    plyta_b: MatId,
) -> NodeId {
    let g = m.detached();
    b(
        m,
        g,
        len,
        H_BRUK,
        w,
        len / 2.0,
        H_BRUK / 2.0,
        0.0,
        baza_m,
        0.0,
    );
    let plyta_len = len / 3.6;
    for row in 0..2_u32 {
        let rz = (if row == 0 { -1.0 } else { 1.0 }) * w * 0.25;
        let off = if row == 1 { plyta_len * 0.45 } else { 0.0 };
        for col in 0..3_u32 {
            let px = crate::models::improvements::model::js_min_nan(
                plyta_len * 0.62 + f64::from(col) * plyta_len * 1.14 + off,
                len - plyta_len / 2.0,
            );
            let mat = if (row + col) % 2 == 1 {
                plyta_a
            } else {
                plyta_b
            };
            b(
                m,
                g,
                plyta_len,
                0.014,
                w * 0.42,
                px,
                H_BRUK + 0.004,
                rz,
                mat,
                0.0,
            );
        }
    }
    g
}

fn wezel(m: &mut ImprovementModel, typ: RoadTyp, promien: f64) -> NodeId {
    let g = m.detached();
    match typ {
        RoadTyp::DrogaBrukowana => {
            let a = m.lambert(BRUK_BAZA);
            cyl(m, g, promien, H_BRUK + 0.004, (H_BRUK + 0.004) / 2.0, a, 6);
            let c = m.lambert(BRUK_A);
            cyl(m, g, promien * 0.55, 0.014, H_BRUK + 0.011, c, 6);
        }
        RoadTyp::Droga => {
            let a = m.lambert(DROGA_PAS);
            cyl(
                m,
                g,
                promien,
                H_GRUNT + 0.004,
                (H_GRUNT + 0.004) / 2.0,
                a,
                6,
            );
            let c = m.lambert(DROGA_PLAMA);
            cyl(m, g, promien * 0.52, 0.014, H_GRUNT + 0.011, c, 6);
        }
    }
    g
}

/// `buildDrogaGwiazda(typ, mask, hexR = 1)` (`droga-6-ramion.ts:159-190`)
/// into `g`.
pub fn build_droga_gwiazda_into(
    m: &mut ImprovementModel,
    g: NodeId,
    typ: RoadTyp,
    mask: u32,
    hex_r: f64,
) {
    let w = ROAD_ARM_WIDTH_RATIO * hex_r;
    let len = road_arm_length(hex_r);
    let node_r = ROAD_NODE_RADIUS_RATIO * hex_r;
    let pas_m = m.lambert(DROGA_PAS);
    let koleina_m = m.lambert(DROGA_KOLEINA);
    let kam_m = m.lambert(KAMIEN);
    let baza_m = m.lambert(BRUK_BAZA);
    let plyta_a = m.lambert(BRUK_A);
    let plyta_b = m.lambert(BRUK_B);
    let arms = road_mask_arms(mask);
    for (i, &dir) in arms.iter().enumerate() {
        let arm = match typ {
            RoadTyp::DrogaBrukowana => arm_brukowane(m, len, w, baza_m, plyta_a, plyta_b),
            RoadTyp::Droga => arm_gruntowe(m, len, w, pas_m, koleina_m, kam_m),
        };
        let y = f64::from(u32::try_from(i).unwrap_or(u32::MAX)) * 0.0006;
        m.node(arm).rot_y(road_port_rotation_y(dir)).position.y = y;
        m.attach(g, arm);
    }
    if road_mask_has_node(mask) {
        let n = wezel(m, typ, node_r);
        let y = f64::from(u32::try_from(arms.len()).unwrap_or(u32::MAX)) * 0.0006;
        m.node(n).position.y = y;
        m.attach(g, n);
    } else if road_mask_is_lone_patch(mask) {
        let n = wezel(m, typ, w * 0.62);
        m.attach(g, n);
    }
}

/// `buildDrogaGwiazda(typ, mask, hexR)` as a standalone model.
#[must_use]
pub fn build_droga_gwiazda(typ: RoadTyp, mask: u32, hex_r: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_droga_gwiazda_into(&mut m, ROOT, typ, mask, hex_r);
    m
}
