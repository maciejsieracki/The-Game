//! Shared kinematics and Three.js helpers of the four `kamien-*-opus5.ts`
//! files (`edb8fb56`). Each web file has its own copy of the chain helpers
//! (`kbSeg`/`kiSeg`/`klSeg`/`kzSeg`, `klSegDir`/`kzSegDir`, `klArmIK`/
//! `kzArmIK`); the copies are textually identical apart from the geometry
//! getters, which are parameters here.
//!
//! Three.js operations that the unit-core tree ([`UnitModel`]) does not
//! provide are reproduced from three r169 sources:
//! `Object3D.rotateOnAxis` (`rotateY`/`rotateZ`), `Quaternion.setFromAxisAngle`,
//! `Quaternion.multiply`, `Euler.setFromQuaternion` (used by
//! `quaternion.copy(q); rotation.y += …`, with V8 `Math.asin` from
//! [`crate::jsmath`]) and `Math.sign`.

use crate::geom::{Euler, Mat4, Quat, Vec3};
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::model::{
    quat_from_euler, quat_from_unit_vectors, Geo, MatId, NodeId, UnitModel,
};
use crate::pick::three::{js_max, js_min};
use std::f64::consts::PI;

/// `new THREE.Vector3(0, 1, 0)` (`KL_Y_UP`, `KZ_Y_UP`).
pub const Y_UP: Vec3 = Vec3::new(0.0, 1.0, 0.0);

/// `Math.sign(x)`: `±1`, or `x` itself for `±0` and NaN.
#[must_use]
pub fn js_sign(x: f64) -> f64 {
    if x > 0.0 {
        1.0
    } else if x < 0.0 {
        -1.0
    } else {
        x
    }
}

/// `dirDown(theta)` = `(0, -Math.cos(theta), Math.sin(theta))` (theta from
/// the vertical downwards, `+` towards `+Z`).
#[must_use]
pub fn dir_down(theta: f64) -> Vec3 {
    Vec3::new(0.0, -js_cos(theta), js_sin(theta))
}

/// `kbSeg`/`kiSeg`/`klSeg`/`kzSeg`: a Y-axis mesh laid along `dir_down(theta)`
/// from `p` (`rotation.x = PI - theta`); returns the far end.
pub fn seg(
    m: &mut UnitModel,
    g: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    theta: f64,
    len: f64,
) -> Vec3 {
    let dir = dir_down(theta);
    m.add_mesh(g, geo, mtl)
        .rot_x(PI - theta)
        .set_pos_v(p.plus(dir.scale(len * 0.5)));
    p.plus(dir.scale(len))
}

/// `kbSpan(group, geo, mtl, A, B, baseH)` (`kamien-bazowe-opus5.ts:260-273`).
pub fn span(
    m: &mut UnitModel,
    g: NodeId,
    geo: Geo,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    base_h: f64,
) -> NodeId {
    let dir = b.minus(a);
    let len = dir.length();
    let dir = dir.normalize();
    let id = m.add_mesh_id(g, geo, mtl);
    let n = m.node(id);
    n.quat_from_unit_vectors(Y_UP, dir);
    n.scale.y = len / base_h;
    n.set_pos_v(a.plus(dir.scale(len * 0.5)));
    id
}

/// Orientation used by `klSegDir`/`kzSegDir`/`klStretch` and the IK fists:
/// `if (D.y < -0.9999) rotation.x = PI; else quaternion.setFromUnitVectors(Y_UP, D)`.
pub fn orient_y_to(m: &mut UnitModel, id: NodeId, d: Vec3) {
    let n = m.node(id);
    if d.y < -0.9999 {
        n.rot_x(PI);
    } else {
        n.quat_from_unit_vectors(Y_UP, d);
    }
}

/// `klSegDir`/`kzSegDir`: a constant mesh from `a` along the unit vector `d`.
pub fn seg_dir(
    m: &mut UnitModel,
    g: NodeId,
    geo: Geo,
    mtl: MatId,
    a: Vec3,
    d: Vec3,
    len: f64,
) -> Vec3 {
    let id = m.add_mesh_id(g, geo, mtl);
    orient_y_to(m, id, d);
    m.node(id).set_pos_v(a.plus(d.scale(len * 0.5)));
    a.plus(d.scale(len))
}

/// Result of [`arm_ik`].
#[derive(Debug, Clone, Copy)]
pub struct ArmIk {
    /// Hand (end of the forearm).
    pub hand: Vec3,
    /// Forearm axis (unit).
    pub axis: Vec3,
    /// Elbow.
    pub elbow: Vec3,
}

/// Geometries and lengths of an IK arm.
#[derive(Debug, Clone, Copy)]
pub struct ArmIkKit {
    /// Upper arm geometry.
    pub up: Geo,
    /// Forearm geometry.
    pub fore: Geo,
    /// Fist geometry.
    pub fist: Geo,
    /// `L1` (upper arm length).
    pub l1: f64,
    /// `L2` (forearm length).
    pub l2: f64,
    /// Fist offset along the axis (`0.012 * HEX_R`).
    pub fist_off: f64,
}

/// `klArmIK` / `kzArmIK` (`kamien-lucznicy-opus5.ts:401-430`,
/// `kamien-zulu-taran-opus5.ts:404-433`): shoulder `s` → hand target `t`,
/// elbow pole `pole`.
#[allow(clippy::too_many_arguments)]
pub fn arm_ik(
    m: &mut UnitModel,
    g: NodeId,
    kit: &ArmIkKit,
    s: Vec3,
    t: Vec3,
    pole: Vec3,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> ArmIk {
    let (l1, l2) = (kit.l1, kit.l2);
    let dv = t.minus(s);
    let dist = js_min(dv.length(), (l1 + l2) * 0.999);
    let dn = dv.normalize();
    let a = (dist * dist + l1 * l1 - l2 * l2) / (2.0 * dist);
    let h = js_max(l1 * l1 - a * a, 0.0).sqrt();
    let c = s.plus(dn.scale(a));
    let mut pp = pole.minus(dn.scale(pole.dot(dn)));
    if pp.x * pp.x + pp.y * pp.y + pp.z * pp.z < 1e-8 {
        pp = Vec3::new(0.0, -1.0, 0.0);
    }
    let pp = pp.normalize();
    let e = c.plus(pp.scale(h));
    let d_u = e.minus(s).normalize();
    seg_dir(m, g, kit.up, m_up, s, d_u, l1);
    let elbow = s.plus(d_u.scale(l1));
    let axis = t.minus(elbow).normalize();
    let hand = seg_dir(m, g, kit.fore, m_fore, elbow, axis, l2);
    if let Some(mf) = m_fist {
        let id = m.add_mesh_id(g, kit.fist, mf);
        orient_y_to(m, id, axis);
        m.node(id).set_pos_v(hand.plus(axis.scale(kit.fist_off)));
    }
    ArmIk { hand, axis, elbow }
}

/// `Quaternion.multiplyQuaternions(a, b)` (three r169).
#[must_use]
pub fn quat_mul(a: Quat, b: Quat) -> Quat {
    let (qax, qay, qaz, qaw) = (a.x, a.y, a.z, a.w);
    let (qbx, qby, qbz, qbw) = (b.x, b.y, b.z, b.w);
    Quat {
        x: qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
        y: qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
        z: qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
        w: qaw * qbw - qax * qbx - qay * qby - qaz * qbz,
    }
}

/// `Quaternion.setFromAxisAngle(axis, angle)` (axis normalised).
#[must_use]
pub fn quat_from_axis_angle(axis: Vec3, angle: f64) -> Quat {
    let half = angle / 2.0;
    let s = js_sin(half);
    Quat {
        x: axis.x * s,
        y: axis.y * s,
        z: axis.z * s,
        w: js_cos(half),
    }
}

/// `object.rotateOnAxis(axis, angle)` = `quaternion.multiply(q(axis, angle))`
/// (`rotateX/Y/Z`). Only the quaternion matters for the matrices.
pub fn rotate_on_axis(m: &mut UnitModel, id: NodeId, axis: Vec3, angle: f64) {
    let n = m.node(id);
    n.quaternion = quat_mul(n.quaternion, quat_from_axis_angle(axis, angle));
}

/// `Euler.setFromQuaternion(q)` with the default `XYZ` order:
/// `makeRotationFromQuaternion` (= `compose(0, q, 1)`) then
/// `setFromRotationMatrix` (three r169 `Euler.js`).
#[must_use]
pub fn euler_from_quat(q: Quat) -> Euler {
    let te = Mat4::compose(Vec3::new(0.0, 0.0, 0.0), q, Vec3::new(1.0, 1.0, 1.0)).e;
    let (m11, m12, m13) = (te[0], te[4], te[8]);
    let (m22, m23) = (te[5], te[9]);
    let (m32, m33) = (te[6], te[10]);
    let y = js_asin(js_max(-1.0, js_min(1.0, m13)));
    let (x, z) = if m13.abs() < 0.999_999_9 {
        (js_atan2(-m23, m33), js_atan2(-m12, m11))
    } else {
        (js_atan2(m32, m22), 0.0)
    };
    Euler::xyz(x, y, z)
}

/// `node.quaternion.copy(q); node.rotation.y += dy` — the copy re-derives the
/// Euler angles from `q` (`_onChangeCallback`), the `+=` then rebuilds the
/// quaternion from them (`setFromEuler`).
pub fn copy_quat_then_add_rot_y(m: &mut UnitModel, id: NodeId, q: Quat, dy: f64) {
    let mut eu = euler_from_quat(q);
    eu.y += dy;
    let n = m.node(id);
    n.rotation = eu;
    n.quaternion = quat_from_euler(eu);
}

/// `quaternion.setFromUnitVectors(from, to)` (normalised), re-exported for
/// the builders.
#[must_use]
pub fn q_from_units(from: Vec3, to: Vec3) -> Quat {
    quat_from_unit_vectors(from, to)
}

/// V8 `Math.asin` — the ONE implementation lives in [`crate::jsmath`]
/// (moved there by `R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1`); re-exported here
/// so the existing `units_kamien::kit::js_asin` path keeps working.
pub use crate::jsmath::js_asin;
