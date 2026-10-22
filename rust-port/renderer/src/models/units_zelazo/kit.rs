//! Shared geometry constructors and Three.js helpers of the MOD-07 Iron
//! files (`edb8fb56`). Every web file has its own private copy of the
//! chain helpers (`niSeg`, `hoSeg`, `s6Seg`, `z1Seg`, …); the copies that are
//! textually identical to the MOD-05 / MOD-06 ones are taken from
//! [`crate::models::units_braz::kit`] (which re-exports
//! [`crate::models::units_kamien::kit`]) — one implementation.

use super::geo::{RimArc, ZelazoGeo};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{Geo, MatId, NodeId, Prim, UnitModel};
pub use crate::models::units_braz::geo::BladeProfile;
pub use crate::models::units_braz::kit::{
    add_scaled, apply_axis_angle, apply_quat, blade, bx, cn, cy, cy_o, cy_open, dir_down,
    euler_from_quat, ico, js_sign, octa, orient_y_to, oval_face, oval_shell, quat_units_synced,
    rot3, rotate_on_axis, seg, span, sph, sph_full, stretch, torus, v3, Y_UP,
};
pub use crate::models::units_kamien::kit::{
    copy_quat_then_add_rot_y, quat_from_axis_angle, quat_mul, seg_dir,
};
use crate::pick::three::{js_max, js_min};
use std::f64::consts::PI;

/// `new THREE.RingGeometry(inner, outer, thetaSegments, phiSegments)`.
#[must_use]
pub fn ring(inner: f64, outer: f64, theta_seg: u32, phi_seg: u32) -> Geo {
    Geo::body(ZelazoGeo::Ring {
        inner,
        outer,
        theta_seg,
        phi_seg,
    })
}

/// `makeOvalRimGeo(a, b, c, t2, N, idx, k)`.
#[must_use]
pub fn oval_rim(a: f64, b: f64, c: f64, t2: f64, n: u32, arc: RimArc, k: f64) -> Geo {
    Geo::body(ZelazoGeo::OvalRim {
        a,
        b,
        c,
        t2,
        n,
        arc,
        k,
    })
}

/// `sjMakeLeafHeadGeo(len, wMax, tMax)`.
#[must_use]
pub fn javelin_head(len: f64, w_max: f64, t_max: f64) -> Geo {
    Geo::body(ZelazoGeo::JavelinHead { len, w_max, t_max })
}

/// `new THREE.TorusGeometry(r, tube, radial, tubular, arc)`.
#[must_use]
pub fn torus_arc(r: f64, tube: f64, radial: u32, tubular: u32, arc: f64) -> Geo {
    Geo::Prim(Prim::Torus {
        r,
        tube,
        radial,
        tubular,
        arc,
    })
}

// ── kinematyka rodziny konnej (`sj*` / `ac*` w `zelazo-*-opus5.ts`) ─────────

/// `sjUpDir(phi)` / `acUpDir(phi)` = `(0, cos phi, sin phi)`.
#[must_use]
pub fn up_dir(phi: f64) -> Vec3 {
    Vec3::new(0.0, js_cos(phi), js_sin(phi))
}

/// `sjSegDown` / `acSegDown` with an optional mesh name: a Y-axis mesh laid
/// along `dir_down(theta)` from `p` (`rotation.x = PI - theta`); returns the
/// far end.
#[allow(clippy::too_many_arguments)]
pub fn seg_down(
    m: &mut UnitModel,
    parent: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    theta: f64,
    len: f64,
    name: Option<&str>,
) -> Vec3 {
    let dir = dir_down(theta);
    let n = m.add_mesh(parent, geo, mtl);
    n.rot_x(PI - theta).set_pos_v(add_scaled(p, dir, len * 0.5));
    if let Some(nm) = name {
        n.set_name(nm);
    }
    add_scaled(p, dir, len)
}

/// `sjSegUp` / `acSegUp`: `rotation.x = phi` (and `rotation.y = spin` when
/// `spin !== 0`), centred along `up_dir(phi)`; returns the far end.
#[allow(clippy::too_many_arguments)]
pub fn seg_up(
    m: &mut UnitModel,
    parent: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    phi: f64,
    len: f64,
    spin: f64,
) -> Vec3 {
    let dir = up_dir(phi);
    let n = m.add_mesh(parent, geo, mtl);
    n.rot_x(phi);
    if spin != 0.0 {
        n.rot_y(spin);
    }
    n.set_pos_v(add_scaled(p, dir, len * 0.5));
    add_scaled(p, dir, len)
}

/// `sjAlong` / `acAlong`: `if (D.y < -0.9999) rotation.x = PI; else
/// quaternion.setFromUnitVectors(UP, D.clone().normalize())`, position `P`.
/// The quaternion path also re-derives the Euler angles (`normalize()` →
/// `_onChangeCallback`), so a later `rotation.* = v` sees them
/// ([`quat_units_synced`]).
pub fn along(
    m: &mut UnitModel,
    parent: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    d: Vec3,
    name: Option<&str>,
) -> NodeId {
    let id = m.add_mesh_id(parent, geo, mtl);
    if d.y < -0.9999 {
        m.node(id).rot_x(PI);
    } else {
        quat_units_synced(m, id, Y_UP, d.normalize());
    }
    m.node(id).set_pos_v(p);
    if let Some(nm) = name {
        m.node(id).set_name(nm);
    }
    id
}

/// `sjAlongLen` / `acAlongLen`: a constant mesh from `a` along the unit
/// vector `d` (NOT re-normalised); returns `a + d · len`.
#[allow(clippy::too_many_arguments)]
pub fn along_len(
    m: &mut UnitModel,
    parent: NodeId,
    geo: Geo,
    mtl: MatId,
    a: Vec3,
    d: Vec3,
    len: f64,
    name: Option<&str>,
) -> Vec3 {
    let id = m.add_mesh_id(parent, geo, mtl);
    orient_y_to(m, id, d);
    m.node(id).set_pos_v(add_scaled(a, d, len * 0.5));
    if let Some(nm) = name {
        m.node(id).set_name(nm);
    }
    add_scaled(a, d, len)
}

/// `sjStrap` / `acStrap`: unit box from `a` to `b`, `scale = (w, max(len,
/// 1e-5), t)`; oriented only when `len > 1e-6` (`d.y / len < -0.9999` →
/// `rotation.x = PI`, else `setFromUnitVectors(UP, d.normalize())`);
/// `position = a + d · 0.5`.
#[allow(clippy::too_many_arguments)]
pub fn strap_unit(
    m: &mut UnitModel,
    parent: NodeId,
    unit: Geo,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    w: f64,
    t: f64,
    name: Option<&str>,
) -> NodeId {
    let d = b.minus(a);
    let len = d.length();
    let id = m.add_mesh_id(parent, unit, mtl);
    m.node(id).set_scale(w, js_max(len, 1e-5), t);
    if len > 1e-6 {
        if d.y / len < -0.9999 {
            m.node(id).rot_x(PI);
        } else {
            m.node(id).quat_from_unit_vectors(Y_UP, d.normalize());
        }
    }
    m.node(id).set_pos_v(add_scaled(a, d, 0.5));
    if let Some(nm) = name {
        m.node(id).set_name(nm);
    }
    id
}

/// Geometries and lengths of an [`ik_arm`] (`sjArmIK` / `acArmIK`).
#[derive(Debug, Clone)]
pub struct IkArmKit {
    /// Upper arm.
    pub up: Geo,
    /// Forearm.
    pub fore: Geo,
    /// Fist.
    pub fist: Geo,
    /// `L1`.
    pub l1: f64,
    /// `L2`.
    pub l2: f64,
    /// Fist offset along the forearm axis (`0.010 * HEX_R`).
    pub fist_off: f64,
}

/// Result of [`ik_arm`]: `{ hand, elbow: E, axis }`.
#[derive(Debug, Clone, Copy)]
pub struct IkArm {
    /// Hand (end of the forearm).
    pub hand: Vec3,
    /// Elbow `E = S + dU · L1`.
    pub elbow: Vec3,
    /// Forearm axis.
    pub axis: Vec3,
}

/// `sjArmIK` (`zelazo-jezdziec-oszczepami-opus5.ts:636-666`) / `acArmIK`
/// (`zelazo-konnica-asyryjska-opus5.ts:541-572`): two-bone IK from shoulder
/// `s` to hand target `t`, elbow side from `pole`; meshes named
/// `<prefix>-uparm` / `-forearm` / `-fist` when a prefix is given.
#[allow(clippy::too_many_arguments)]
pub fn ik_arm(
    m: &mut UnitModel,
    parent: NodeId,
    kit: &IkArmKit,
    s: Vec3,
    t: Vec3,
    pole: Vec3,
    m_arm: MatId,
    m_fist: Option<MatId>,
    prefix: Option<&str>,
) -> IkArm {
    let (l1, l2) = (kit.l1, kit.l2);
    let dv = t.minus(s);
    let dist = js_min(dv.length(), (l1 + l2) * 0.999);
    let dn = dv.normalize();
    let a = (dist * dist + l1 * l1 - l2 * l2) / (2.0 * dist);
    let h = js_max(l1 * l1 - a * a, 0.0).sqrt();
    let c = add_scaled(s, dn, a);
    let mut pp = pole.minus(dn.scale(pole.dot(dn)));
    if pp.x * pp.x + pp.y * pp.y + pp.z * pp.z < 1e-8 {
        pp = Vec3::new(0.0, -1.0, 0.0);
    }
    let pp = pp.normalize();
    let elbow = add_scaled(c, pp, h);
    let d_u = elbow.minus(s).normalize();
    let nm = |part: &str| prefix.map(|p| format!("{p}-{part}"));
    along_len(
        m,
        parent,
        kit.up.clone(),
        m_arm,
        s,
        d_u,
        l1,
        nm("uparm").as_deref(),
    );
    let e = add_scaled(s, d_u, l1);
    let axis = t.minus(e).normalize();
    let hand = along_len(
        m,
        parent,
        kit.fore.clone(),
        m_arm,
        e,
        axis,
        l2,
        nm("forearm").as_deref(),
    );
    if let Some(mf) = m_fist {
        let id = m.add_mesh_id(parent, kit.fist.clone(), mf);
        orient_y_to(m, id, axis);
        m.node(id).set_pos_v(add_scaled(hand, axis, kit.fist_off));
        if let Some(n) = nm("fist") {
            m.node(id).set_name(&n);
        }
    }
    IkArm {
        hand,
        elbow: e,
        axis,
    }
}
