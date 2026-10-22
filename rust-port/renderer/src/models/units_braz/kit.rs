//! Shared geometry constructors and Three.js helpers of the MOD-06 Bronze
//! files (`edb8fb56`). Every web file has its own private copy of the chain
//! helpers (`xxDirDown`, `xxSeg`, `xxSpan`, …); the copies that are textually
//! identical to the MOD-05 ones are taken from
//! [`crate::models::units_kamien::kit`] (one implementation), the others live
//! next to their file.

use super::geo::{BladeProfile, BrazGeo};
use crate::geom::{Euler, Vec3};
use crate::models::unit_core::model::{
    quat_from_euler, quat_from_unit_vectors, Geo, MatId, NodeId, Prim, UnitModel,
};
pub use crate::models::units_kamien::kit::{
    dir_down, euler_from_quat, js_sign, orient_y_to, rotate_on_axis, seg, span, Y_UP,
};

/// `new THREE.BoxGeometry(w, h, d)`.
#[must_use]
pub fn bx(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w, h, d))
}

/// `new THREE.CylinderGeometry(rt, rb, h, seg, 1)`.
#[must_use]
pub fn cy(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl(rt, rb, h, seg))
}

/// `new THREE.CylinderGeometry(rt, rb, h, seg, 1, true)`.
#[must_use]
pub fn cy_open(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl_open(rt, rb, h, seg))
}

/// `new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)`.
#[must_use]
pub fn cy_o(rt: f64, rb: f64, h: f64, seg: u32, open: bool) -> Geo {
    if open {
        cy_open(rt, rb, h, seg)
    } else {
        cy(rt, rb, h, seg)
    }
}

/// `new THREE.ConeGeometry(r, h, seg)`.
#[must_use]
pub fn cn(r: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cone(r, h, seg))
}

/// `new THREE.SphereGeometry(r, ws, hs, phiStart, phiLength, thetaStart, thetaLength)`.
#[must_use]
pub fn sph(
    r: f64,
    ws: u32,
    hs: u32,
    phi_start: f64,
    phi_len: f64,
    theta_start: f64,
    theta_len: f64,
) -> Geo {
    Geo::Prim(Prim::Sphere {
        r,
        ws,
        hs,
        phi_start,
        phi_len,
        theta_start,
        theta_len,
    })
}

/// `new THREE.SphereGeometry(r, ws, hs)` (full sphere).
#[must_use]
pub fn sph_full(r: f64, ws: u32, hs: u32) -> Geo {
    use std::f64::consts::PI;
    sph(r, ws, hs, 0.0, PI * 2.0, 0.0, PI)
}

/// `new THREE.TorusGeometry(r, tube, radial, tubular)` (full arc).
#[must_use]
pub fn torus(r: f64, tube: f64, radial: u32, tubular: u32) -> Geo {
    use std::f64::consts::PI;
    Geo::Prim(Prim::Torus {
        r,
        tube,
        radial,
        tubular,
        arc: PI * 2.0,
    })
}

/// `new THREE.IcosahedronGeometry(r, detail)`.
#[must_use]
pub fn ico(r: f64, detail: u32) -> Geo {
    Geo::Prim(Prim::Icosahedron { r, detail })
}

/// `new THREE.OctahedronGeometry(r, detail)`.
#[must_use]
pub fn octa(r: f64, detail: u32) -> Geo {
    Geo::Prim(Prim::Braz(BrazGeo::Octahedron { r, detail }))
}

/// Section-lofted blade (`knMakeLeafHeadGeo` / `wbMakeLeafHeadGeo` /
/// `makeRapierBladeGeo`).
#[must_use]
pub fn blade(profile: BladeProfile, len: f64, w_max: f64, t_max: f64) -> Geo {
    Geo::Prim(Prim::Braz(BrazGeo::Blade {
        profile,
        len,
        w_max,
        t_max,
    }))
}

/// Faceted oval shield shell (`xxOvalShell` / `xxMakeShell`).
#[must_use]
pub fn oval_shell(a: f64, b: f64, c: f64, t: f64, n: u32) -> Geo {
    Geo::Prim(Prim::Braz(BrazGeo::OvalShell { a, b, c, t, n }))
}

/// Faceted oval shield face (`xxOvalFace` / `xxMakeFace`).
#[must_use]
pub fn oval_face(a: f64, b: f64, c: f64, n: u32) -> Geo {
    Geo::Prim(Prim::Braz(BrazGeo::OvalFace { a, b, c, n }))
}

/// `new THREE.Vector3(x, y, z)`.
#[must_use]
pub const fn v3(x: f64, y: f64, z: f64) -> Vec3 {
    Vec3::new(x, y, z)
}

/// `object.rotation.set(x, y, z)` (default `XYZ` order; recomputes the
/// quaternion like `Euler.set` → `_onChangeCallback`).
pub fn rot3(m: &mut UnitModel, id: NodeId, x: f64, y: f64, z: f64) {
    let n = m.node(id);
    n.rotation = Euler::xyz(x, y, z);
    n.quaternion = quat_from_euler(n.rotation);
}

/// Unit box stretched from `a` to `b` (`pzStretch`, `nbStretch`, `klStretch`
/// pattern): `scale.set(w, |b - a|, d ?? w)`, then
/// `if (D.y < -0.9999) rotation.x = PI; else quaternion.setFromUnitVectors(Y_UP, D)`,
/// `position = a + D · len / 2`. Returns the mesh.
#[allow(clippy::too_many_arguments)]
pub fn stretch(
    m: &mut UnitModel,
    parent: NodeId,
    unit: Geo,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    w: f64,
    d: Option<f64>,
) -> NodeId {
    let v = b.minus(a);
    let len = v.length();
    let dir = v.normalize();
    let id = m.add_mesh_id(parent, unit, mtl);
    m.node(id).set_scale(w, len, d.unwrap_or(w));
    orient_y_to(m, id, dir);
    m.node(id).set_pos_v(a.plus(dir.scale(len * 0.5)));
    id
}

/// `mesh.quaternion.setFromUnitVectors(from, to)` WITH the Three.js side
/// effect that matters when the code later assigns an Euler angle:
/// `Quaternion.normalize()` fires `_onChangeCallback`, which re-derives
/// `rotation` (`Euler.setFromQuaternion`, V8 `Math.asin`/`atan2`). A later
/// `rotation.y = v` then rebuilds the quaternion from that Euler.
pub fn quat_units_synced(m: &mut UnitModel, id: NodeId, from: Vec3, to: Vec3) {
    let q = quat_from_unit_vectors(from, to);
    let n = m.node(id);
    n.quaternion = q;
    n.rotation = euler_from_quat(q);
}

/// `Vector3.applyQuaternion(q)` (three r169 `Vector3.js:252-271`).
#[must_use]
pub fn apply_quat(v: Vec3, q: crate::geom::Quat) -> Vec3 {
    let (vx, vy, vz) = (v.x, v.y, v.z);
    let (qx, qy, qz, qw) = (q.x, q.y, q.z, q.w);
    let tx = 2.0 * (qy * vz - qz * vy);
    let ty = 2.0 * (qz * vx - qx * vz);
    let tz = 2.0 * (qx * vy - qy * vx);
    Vec3::new(
        vx + qw * tx + qy * tz - qz * ty,
        vy + qw * ty + qz * tx - qx * tz,
        vz + qw * tz + qx * ty - qy * tx,
    )
}

/// `Vector3.applyAxisAngle(axis, angle)` = `applyQuaternion(setFromAxisAngle)`.
#[must_use]
pub fn apply_axis_angle(v: Vec3, axis: Vec3, angle: f64) -> Vec3 {
    apply_quat(
        v,
        crate::models::units_kamien::kit::quat_from_axis_angle(axis, angle),
    )
}

/// `P.clone().addScaledVector(dir, s)`.
#[must_use]
pub fn add_scaled(p: Vec3, dir: Vec3, s: f64) -> Vec3 {
    Vec3::new(p.x + dir.x * s, p.y + dir.y * s, p.z + dir.z * s)
}
