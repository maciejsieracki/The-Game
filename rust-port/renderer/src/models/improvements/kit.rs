//! Shared helpers of the "partia 2/3" files (`ulepszenia-modele-p2/p3a/p3b`,
//! `pastwisko-modele`, `swinia-trzoda`): the identical local `B`, `CYL`,
//! `CONE`, `azXZ` and `tangRotY` of those files.

#![allow(clippy::too_many_arguments)]

use std::f64::consts::PI;

use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{MatId, NodeId, Prim};

use super::model::ImprovementModel;

/// `B(g, w, h, d, cx, cy, cz, m, rx, ry, rz)`: box centred at `(cx, cy, cz)`,
/// `rotation.set(rx, ry, rz)` only when one of them is non-zero, `castShadow`.
pub fn b(
    m: &mut ImprovementModel,
    g: NodeId,
    w: f64,
    h: f64,
    d: f64,
    cx: f64,
    cy: f64,
    cz: f64,
    mat: MatId,
    rx: f64,
    ry: f64,
    rz: f64,
) -> NodeId {
    let id = m.mesh(g, Prim::bx(w, h, d), mat);
    m.node(id).set_pos(cx, cy, cz);
    if rx != 0.0 || ry != 0.0 || rz != 0.0 {
        m.set_rotation(id, rx, ry, rz);
    }
    m.shadows(id, true, false);
    id
}

/// `B(...)` without rotation.
pub fn b0(
    m: &mut ImprovementModel,
    g: NodeId,
    w: f64,
    h: f64,
    d: f64,
    cx: f64,
    cy: f64,
    cz: f64,
    mat: MatId,
) -> NodeId {
    b(m, g, w, h, d, cx, cy, cz, mat, 0.0, 0.0, 0.0)
}

/// `CYL(g, rt, rb, h, cx, cy, cz, m, seg, rx, ry, rz)`.
pub fn cyl(
    m: &mut ImprovementModel,
    g: NodeId,
    rt: f64,
    rb: f64,
    h: f64,
    cx: f64,
    cy: f64,
    cz: f64,
    mat: MatId,
    seg: u32,
    rx: f64,
    ry: f64,
    rz: f64,
) -> NodeId {
    let id = m.mesh(g, Prim::cyl(rt, rb, h, seg), mat);
    m.node(id).set_pos(cx, cy, cz);
    if rx != 0.0 || ry != 0.0 || rz != 0.0 {
        m.set_rotation(id, rx, ry, rz);
    }
    m.shadows(id, true, false);
    id
}

/// `CONE(g, r, h, cx, cy, cz, m, seg, ry[, rx, rz])` — the p2/p3a variant
/// sets only `rotation.y = ry` when `ry` is non-zero, which yields the same
/// quaternion as `rotation.set(0, ry, 0)` of the p3b variant.
pub fn cone(
    m: &mut ImprovementModel,
    g: NodeId,
    r: f64,
    h: f64,
    cx: f64,
    cy: f64,
    cz: f64,
    mat: MatId,
    seg: u32,
    rx: f64,
    ry: f64,
    rz: f64,
) -> NodeId {
    let id = m.mesh(g, Prim::cone(r, h, seg), mat);
    m.node(id).set_pos(cx, cy, cz);
    if rx != 0.0 || ry != 0.0 || rz != 0.0 {
        m.set_rotation(id, rx, ry, rz);
    }
    m.shadows(id, true, false);
    id
}

/// `azXZ(deg, r)`: `{ x: r * sin(deg·π/180), z: -r * cos(deg·π/180) }`.
#[must_use]
pub fn az_xz(deg: f64, r: f64) -> (f64, f64) {
    let a = (deg * PI) / 180.0;
    (r * js_sin(a), -r * js_cos(a))
}

/// `tangRotY(deg)`: `(-deg · π) / 180`.
#[must_use]
pub fn tang_rot_y(deg: f64) -> f64 {
    (-deg * PI) / 180.0
}
