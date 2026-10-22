//! Port of `render/braz-lucznik-nubijski-opus5.ts` (`edb8fb56`):
//! `buildNubianArcherOpus5` (Łucznik nubijski / Nubian Archer).
//!
//! The lazily created `getNB*` singletons have fixed arguments, so each maps
//! to one geometry value. `nbSeg` / `nbArmIK` are textually the MOD-05 chain
//! helpers (`units_kamien::kit::{seg, arm_ik}`).

use super::kit::{add_scaled, bx, cn, cy, rot3, seg, stretch, v3, Y_UP};
use crate::geom::{Mat4, Vec3};
use crate::jsmath::js_atan2;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use crate::models::units_kamien::kit::{arm_ik, rotate_on_axis, ArmIk, ArmIkKit};
use std::f64::consts::PI;

// ── paleta (`braz-lucznik-nubijski-opus5.ts:124-156`)
const NB_SKIN: u32 = 0x5c3620;
const NB_SKIN_DK: u32 = 0x3d2314;
const NB_HIDE: u32 = 0x8a6a42;
const NB_HIDE_DK: u32 = 0x6a4f2e;
const NB_FRINGE: u32 = 0x5a3f24;
const NB_LEATHER: u32 = 0x6b4a28;
const NB_LEATHER_DK: u32 = 0x4a331b;
const NB_HEADBAND: u32 = 0x4a331b;
const NB_WOOD_BOW: u32 = 0x6f4e2c;
const NB_WOOD_SHAFT: u32 = 0x9c7748;
const NB_STRING: u32 = 0xe8e0cc;
const NB_SINEW: u32 = 0xd8cba8;
const NB_BRONZE: u32 = 0xcf9234;
const NB_BRONZE_LT: u32 = 0xdaa84e;
const NB_HAIR: u32 = 0x150d07;
const NB_FEATHER: u32 = 0xeae3d2;
const NB_FEATHER_DK: u32 = 0x8c7c64;
const NB_SHIELD: u32 = 0x8a3a26;
const NB_SHIELD_DK: u32 = 0x5a2416;
const NB_EYE: u32 = 0x14100c;
const NB_BEAD: u32 = 0xdccfa6;

// ── wymiary sylwetki (`:159-178`)
const NB_HIP_Y: f64 = 0.208 * HEX_R;
const NB_TORSO_W: f64 = 0.180 * HEX_R;
const NB_TORSO_H: f64 = 0.205 * HEX_R;
const NB_TORSO_D: f64 = 0.100 * HEX_R;
const NB_TORSO_BOT: f64 = 0.240 * HEX_R;
const NB_TORSO_CTR: f64 = NB_TORSO_BOT + NB_TORSO_H * 0.5;
const NB_TORSO_TOP: f64 = NB_TORSO_BOT + NB_TORSO_H;
const NB_NECK_H: f64 = 0.028 * HEX_R;
const NB_HEAD_S: f64 = 0.128 * HEX_R;
const NB_HEAD_CTR: f64 = NB_TORSO_TOP + NB_NECK_H + NB_HEAD_S * 0.5;
const NB_HEAD_TOP: f64 = NB_TORSO_TOP + NB_NECK_H + NB_HEAD_S;
const NB_SHLD_X: f64 = NB_TORSO_W * 0.5 + 0.030 * HEX_R;
const NB_SHLD_Y: f64 = NB_TORSO_TOP - 0.024 * HEX_R;
const NB_HIP_X: f64 = 0.052 * HEX_R;
const NB_THIGH_L: f64 = 0.104 * HEX_R;
const NB_SHIN_L: f64 = 0.096 * HEX_R;
const NB_UPARM_L: f64 = 0.100 * HEX_R;
const NB_FOREARM_L: f64 = 0.092 * HEX_R;

/// `NB_GRIP` / `NB_NOCK` (`:409-410`).
const NB_GRIP: Vec3 = Vec3::new(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
const NB_NOCK: Vec3 = Vec3::new(-0.052 * HEX_R, 0.458 * HEX_R, -0.020 * HEX_R);

// ── geometrie-singletony (`:229-273`)
fn g_torso() -> Geo {
    bx(NB_TORSO_W, NB_TORSO_H, NB_TORSO_D)
}
fn g_chest() -> Geo {
    bx(NB_TORSO_W * 1.05, 0.072 * HEX_R, NB_TORSO_D * 1.06)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, NB_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(NB_HEAD_S, NB_HEAD_S, NB_HEAD_S)
}
fn g_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn g_nose() -> Geo {
    bx(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)
}
fn g_ear() -> Geo {
    bx(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, NB_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, NB_SHIN_L, 0.042 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R)
}
fn g_toes() -> Geo {
    bx(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, NB_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, NB_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_hide_wrap() -> Geo {
    bx(0.206 * HEX_R, 0.088 * HEX_R, 0.126 * HEX_R)
}
fn g_hide_pan() -> Geo {
    bx(0.084 * HEX_R, 0.070 * HEX_R, 0.014 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.017 * HEX_R, 0.058 * HEX_R, 0.010 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.198 * HEX_R, 0.024 * HEX_R, 0.122 * HEX_R)
}
fn g_knot() -> Geo {
    bx(0.036 * HEX_R, 0.032 * HEX_R, 0.019 * HEX_R)
}
fn g_bracer() -> Geo {
    bx(0.050 * HEX_R, 0.046 * HEX_R, 0.050 * HEX_R)
}
fn g_hair_cap() -> Geo {
    bx(0.130 * HEX_R, 0.040 * HEX_R, 0.130 * HEX_R)
}
fn g_head_band() -> Geo {
    bx(0.136 * HEX_R, 0.024 * HEX_R, 0.136 * HEX_R)
}
fn g_feather() -> Geo {
    bx(0.020 * HEX_R, 0.100 * HEX_R, 0.010 * HEX_R)
}
fn g_feat_tip() -> Geo {
    bx(0.013 * HEX_R, 0.036 * HEX_R, 0.008 * HEX_R)
}
fn g_feat_tuft() -> Geo {
    bx(0.026 * HEX_R, 0.020 * HEX_R, 0.026 * HEX_R)
}
fn g_shin_wrap() -> Geo {
    bx(0.042 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)
}
fn g_grip() -> Geo {
    bx(0.024 * HEX_R, 0.076 * HEX_R, 0.026 * HEX_R)
}
fn g_grip_wrap() -> Geo {
    bx(0.029 * HEX_R, 0.040 * HEX_R, 0.031 * HEX_R)
}
fn g_nock() -> Geo {
    bx(0.015 * HEX_R, 0.019 * HEX_R, 0.017 * HEX_R)
}
fn g_arrow_tip() -> Geo {
    cn(0.012 * HEX_R, 0.044 * HEX_R, 4)
}
fn g_binding() -> Geo {
    bx(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R)
}
fn g_fletch() -> Geo {
    bx(0.006 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R)
}
fn g_quiver() -> Geo {
    bx(0.048 * HEX_R, 0.156 * HEX_R, 0.048 * HEX_R)
}
fn g_q_rim() -> Geo {
    bx(0.056 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R)
}
fn g_q_strap() -> Geo {
    bx(0.026 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)
}
fn g_q_arrow() -> Geo {
    bx(0.009 * HEX_R, 0.090 * HEX_R, 0.009 * HEX_R)
}
fn g_shield() -> Geo {
    cy(0.076 * HEX_R, 0.076 * HEX_R, 0.014 * HEX_R, 10)
}
fn g_shield_rim() -> Geo {
    cy(0.020 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R, 8)
}
fn g_shield_strap() -> Geo {
    bx(0.020 * HEX_R, 0.170 * HEX_R, 0.009 * HEX_R)
}
fn g_cord() -> Geo {
    bx(0.150 * HEX_R, 0.010 * HEX_R, 0.092 * HEX_R)
}
fn g_bead() -> Geo {
    bx(0.016 * HEX_R, 0.016 * HEX_R, 0.012 * HEX_R)
}
fn g_anklet() -> Geo {
    bx(0.040 * HEX_R, 0.011 * HEX_R, 0.044 * HEX_R)
}

/// `nbStretch(parent, mtl, A, B, w, d)` (`:310-324`).
#[allow(clippy::too_many_arguments)]
fn nb_stretch(
    m: &mut UnitModel,
    parent: NodeId,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    w: f64,
    d: Option<f64>,
) {
    stretch(m, parent, g_unit(), mtl, a, b, w, d);
}

/// `nbBuildLeg` (`:327-343`).
#[allow(clippy::too_many_arguments)]
fn nb_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_skin: MatId,
    m_skin_dk: MatId,
    hip_y: f64,
) {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_skin, p, th_u, NB_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_skin, p, th_l, NB_SHIN_L);
    let foot_z = p.z + 0.012 * HEX_R;
    m.add_mesh(g, g_sole(), m_skin)
        .set_pos(sx, 0.009 * HEX_R, foot_z);
    m.add_mesh(g, g_toes(), m_skin_dk)
        .set_pos(sx, 0.007 * HEX_R, foot_z + 0.038 * HEX_R);
}

/// `nbArmIK` (`:349-377`) = MOD-05 `arm_ik` with the NB geometries.
#[allow(clippy::too_many_arguments)]
fn nb_arm_ik(
    m: &mut UnitModel,
    g: NodeId,
    s: Vec3,
    t: Vec3,
    pole: Vec3,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> ArmIk {
    let kit = ArmIkKit {
        up: g_up_arm(),
        fore: g_forearm(),
        fist: g_fist(),
        l1: NB_UPARM_L,
        l2: NB_FOREARM_L,
        fist_off: 0.012 * HEX_R,
    };
    arm_ik(m, g, &kit, s, t, pole, m_up, m_fore, m_fist)
}

/// `nbBuildCore` (`:380-406`).
fn nb_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, m_skin: MatId, m_skin_dk: MatId) {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, NB_TORSO_CTR, 0.0);
    m.add_mesh(g, g_chest(), m_torso)
        .set_pos(0.0, NB_TORSO_TOP - 0.038 * HEX_R, 0.0);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, NB_TORSO_TOP + NB_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, NB_HEAD_CTR, 0.0);
    m.add_mesh(g, g_jaw(), m_skin_dk)
        .set_pos(0.0, NB_HEAD_CTR - NB_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, g_nose(), m_skin).set_pos(
        0.0,
        NB_HEAD_CTR - 0.004 * HEX_R,
        NB_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_ear(), m_skin_dk).set_pos(
            sx * (NB_HEAD_S * 0.5 + 0.004 * HEX_R),
            NB_HEAD_CTR - 0.006 * HEX_R,
            0.0,
        );
    }
}

/// `nbAddBowLimbs` (`:423-466`): returns the two bow tips.
fn nb_add_bow_limbs(m: &mut UnitModel, g: NodeId, m_bow: MatId, m_wrap: MatId) -> (Vec3, Vec3) {
    const PROFILE: [[f64; 2]; 5] = [
        [0.040, 0.006],
        [0.150, 0.014],
        [0.260, 0.018],
        [0.350, 0.014],
        [0.420, -0.010],
    ];
    const W: [f64; 4] = [0.017, 0.015, 0.013, 0.011];
    let dir_a = NB_GRIP.minus(NB_NOCK).normalize();
    let yaw = js_atan2(dir_a.x, dir_a.z);
    let bow = m.detached_group();
    m.node(bow).set_pos_v(NB_GRIP).rot_y(yaw);
    m.add_mesh(bow, g_grip(), m_bow);
    m.add_mesh(bow, g_grip_wrap(), m_wrap);
    for sg in [1.0, -1.0] {
        for i in 0..PROFILE.len() - 1 {
            let p = PROFILE[i];
            let q = PROFILE[i + 1];
            let a = v3(0.0, sg * p[0] * HEX_R, p[1] * HEX_R);
            let b = v3(0.0, sg * q[0] * HEX_R, q[1] * HEX_R);
            nb_stretch(
                m,
                bow,
                m_bow,
                a,
                b,
                W[i] * HEX_R,
                Some((W[i] + 0.003) * HEX_R),
            );
        }
        let last = PROFILE[PROFILE.len() - 1];
        m.add_mesh(bow, g_nock(), m_bow)
            .set_pos(0.0, sg * last[0] * HEX_R, last[1] * HEX_R);
    }
    m.attach(g, bow);
    let last = PROFILE[PROFILE.len() - 1];
    let rot_y = Mat4::rotation_y(yaw);
    let tip_top = v3(0.0, last[0] * HEX_R, last[1] * HEX_R)
        .apply_mat4(&rot_y)
        .plus(NB_GRIP);
    let tip_bot = v3(0.0, -last[0] * HEX_R, last[1] * HEX_R)
        .apply_mat4(&rot_y)
        .plus(NB_GRIP);
    (tip_top, tip_bot)
}

/// `nbAddArrow` (`:478-514`).
#[allow(clippy::too_many_arguments)]
fn nb_add_arrow(
    m: &mut UnitModel,
    g: NodeId,
    m_shaft: MatId,
    m_bronze: MatId,
    m_bronze_lt: MatId,
    m_sinew: MatId,
    m_fletch: MatId,
) {
    let dir_a = NB_GRIP.minus(NB_NOCK).normalize();
    let shaft_end = add_scaled(NB_GRIP, dir_a, 0.058 * HEX_R);
    nb_stretch(m, g, m_shaft, NB_NOCK, shaft_end, 0.011 * HEX_R, None);
    m.add_mesh(g, g_binding(), m_sinew)
        .quat_from_unit_vectors(Y_UP, dir_a)
        .set_pos_v(add_scaled(shaft_end, dir_a, 0.004 * HEX_R));
    m.add_mesh(g, g_arrow_tip(), m_bronze)
        .quat_from_unit_vectors(Y_UP, dir_a)
        .set_pos_v(add_scaled(shaft_end, dir_a, 0.024 * HEX_R));
    m.add_mesh(g, g_binding(), m_bronze_lt)
        .set_scale(0.55, 1.6, 0.28)
        .quat_from_unit_vectors(Y_UP, dir_a)
        .set_pos_v(add_scaled(shaft_end, dir_a, 0.034 * HEX_R));
    for rz in [0.0, PI / 2.0] {
        let id = m.add_mesh_id(g, g_fletch(), m_fletch);
        m.node(id).quat_from_unit_vectors(Y_UP, dir_a);
        rotate_on_axis(m, id, Y_UP, rz);
        m.node(id)
            .set_pos_v(add_scaled(NB_NOCK, dir_a, 0.030 * HEX_R));
    }
}

/// `nbAddQuiver` (`:517-553`).
fn nb_add_quiver(
    m: &mut UnitModel,
    g: NodeId,
    m_leath: MatId,
    m_leath_dk: MatId,
    m_shaft: MatId,
    m_fletch_owner: MatId,
) {
    let qx = -0.056 * HEX_R;
    let qz = -(NB_TORSO_D * 0.5 + 0.032 * HEX_R);
    m.add_mesh(g, g_quiver(), m_leath)
        .rot_x(-0.24)
        .rot_z(0.22)
        .set_pos(qx, NB_TORSO_CTR + 0.050 * HEX_R, qz);
    m.add_mesh(g, g_q_rim(), m_leath_dk)
        .rot_x(-0.24)
        .rot_z(0.22)
        .set_pos(
            qx - 0.018 * HEX_R,
            NB_TORSO_CTR + 0.126 * HEX_R,
            qz - 0.020 * HEX_R,
        );
    let id = m.add_mesh_id(g, g_q_strap(), m_leath_dk);
    rot3(m, id, 0.10, 0.0, -0.62);
    m.node(id).set_pos(
        -0.012 * HEX_R,
        NB_TORSO_CTR + 0.010 * HEX_R,
        -(NB_TORSO_D * 0.5 + 0.008 * HEX_R),
    );
    let id = m.add_mesh_id(g, g_q_strap(), m_leath);
    rot3(m, id, -0.10, 0.0, 0.60);
    m.node(id).set_pos(
        -0.010 * HEX_R,
        NB_TORSO_CTR + 0.008 * HEX_R,
        NB_TORSO_D * 0.5 + 0.006 * HEX_R,
    );
    for [dx, dy] in [[-0.022, 0.0], [0.002, 0.012], [0.020, -0.006]] {
        m.add_mesh(g, g_q_arrow(), m_shaft)
            .rot_x(-0.24)
            .rot_z(0.22)
            .set_pos(
                qx + dx * HEX_R,
                NB_TORSO_CTR + (0.140 + dy) * HEX_R,
                qz - 0.020 * HEX_R,
            );
        m.add_mesh(g, g_fletch(), m_fletch_owner)
            .rot_x(-0.24)
            .rot_z(0.22)
            .set_scale(1.0, 0.66, 0.66)
            .set_pos(
                qx + (dx - 0.012) * HEX_R,
                NB_TORSO_CTR + (0.180 + dy) * HEX_R,
                qz - 0.030 * HEX_R,
            );
    }
}

/// `nbAddBackShield` (`:557-578`).
fn nb_add_back_shield(
    m: &mut UnitModel,
    g: NodeId,
    m_shield: MatId,
    m_shield_dk: MatId,
    m_strap: MatId,
) {
    let sx = 0.052 * HEX_R;
    let sz = -(NB_TORSO_D * 0.5 + 0.020 * HEX_R);
    let sy = NB_TORSO_BOT + 0.058 * HEX_R;
    m.add_mesh(g, g_shield(), m_shield)
        .rot_x(PI / 2.0 - 0.30)
        .rot_z(0.10)
        .set_pos(sx, sy, sz);
    m.add_mesh(g, g_shield_rim(), m_shield_dk)
        .rot_x(PI / 2.0 - 0.30)
        .set_pos(sx, sy, sz - 0.012 * HEX_R);
    let id = m.add_mesh_id(g, g_shield_strap(), m_strap);
    rot3(m, id, 0.06, 0.0, 0.30);
    m.node(id)
        .set_pos(sx * 0.4, NB_TORSO_CTR - 0.010 * HEX_R, sz + 0.006 * HEX_R);
}

/// `nbArcherLegs` (`:581-594`).
fn nb_archer_legs(m: &mut UnitModel, g: NodeId, m_skin: MatId, m_skin_dk: MatId) {
    let hip = NB_HIP_Y - 0.006 * HEX_R;
    nb_build_leg(m, g, NB_HIP_X, 0.30, 0.16, m_skin, m_skin_dk, hip);
    nb_build_leg(m, g, -NB_HIP_X, -0.34, -0.14, m_skin, m_skin_dk, hip);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_shin_wrap(), m_skin_dk).set_pos(
            sx * NB_HIP_X * 1.05,
            0.052 * HEX_R,
            if sx > 0.0 {
                0.006 * HEX_R
            } else {
                -0.002 * HEX_R
            },
        );
    }
}

/// `buildNubianArcherOpus5(ownerColor)` (`braz-lucznik-nubijski-opus5.ts:620-752`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_nubian_archer_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(NB_SKIN, 0.05, 0.82);
    let m_skin_dk = m.mat(NB_SKIN_DK, 0.05, 0.85);
    let m_hide = m.mat(NB_HIDE, 0.05, 0.86);
    let m_hide_dk = m.mat(NB_HIDE_DK, 0.05, 0.88);
    let m_fringe = m.mat(NB_FRINGE, 0.05, 0.88);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_wood = m.mat(NB_WOOD_BOW, 0.05, 0.84);
    let m_shaft = m.mat(NB_WOOD_SHAFT, 0.05, 0.84);
    let m_leath = m.mat(NB_LEATHER, 0.06, 0.82);
    let m_leath_dk = m.mat(NB_LEATHER_DK, 0.06, 0.86);
    let m_head_band = m.mat(NB_HEADBAND, 0.06, 0.84);
    let m_string = m.mat(NB_STRING, 0.02, 0.95);
    let m_sinew = m.mat(NB_SINEW, 0.03, 0.92);
    let m_bronze = m.mat(NB_BRONZE, 0.55, 0.40);
    let m_bronze_lt = m.mat(NB_BRONZE_LT, 0.60, 0.34);
    let m_hair = m.mat(NB_HAIR, 0.04, 0.90);
    let m_feath = m.mat(NB_FEATHER, 0.03, 0.92);
    let m_feath_dk = m.mat(NB_FEATHER_DK, 0.04, 0.90);
    let m_shield = m.mat(NB_SHIELD, 0.05, 0.84);
    let m_shield_dk = m.mat(NB_SHIELD_DK, 0.05, 0.86);
    let m_eye = m.mat(NB_EYE, 0.05, 0.86);
    let m_bead = m.mat(NB_BEAD, 0.05, 0.70);

    nb_build_core(&mut m, g, m_skin, m_skin, m_skin_dk);
    nb_archer_legs(&mut m, g, m_skin, m_skin_dk);

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            sx * 0.026 * HEX_R,
            NB_HEAD_CTR + 0.014 * HEX_R,
            NB_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
    }

    m.add_mesh(g, g_hair_cap(), m_hair)
        .set_pos(0.0, NB_HEAD_TOP - 0.020 * HEX_R, 0.0);
    m.add_mesh(g, g_head_band(), m_head_band)
        .set_pos(0.0, NB_HEAD_CTR + 0.040 * HEX_R, 0.0);
    m.add_mesh(g, g_feat_tuft(), m_feath_dk).set_pos(
        -0.006 * HEX_R,
        NB_HEAD_TOP + 0.010 * HEX_R,
        -0.030 * HEX_R,
    );
    m.add_mesh(g, g_feather(), m_feath).rot_x(-0.06).set_pos(
        -0.006 * HEX_R,
        NB_HEAD_TOP + 0.062 * HEX_R,
        -0.032 * HEX_R,
    );
    m.add_mesh(g, g_feat_tip(), m_feath_dk)
        .rot_x(-0.06)
        .set_pos(-0.006 * HEX_R, NB_HEAD_TOP + 0.116 * HEX_R, -0.036 * HEX_R);
    m.add_mesh(g, g_feather(), m_feath)
        .rot_x(0.10)
        .set_scale(0.8, 0.62, 0.8)
        .set_pos(0.014 * HEX_R, NB_HEAD_TOP + 0.044 * HEX_R, -0.020 * HEX_R);
    m.add_mesh(g, g_feat_tip(), m_feath_dk)
        .rot_x(0.10)
        .set_scale(0.8, 0.62, 0.8)
        .set_pos(0.014 * HEX_R, NB_HEAD_TOP + 0.076 * HEX_R, -0.022 * HEX_R);

    m.add_mesh(g, g_cord(), m_leath_dk)
        .set_pos(0.0, NB_TORSO_TOP - 0.012 * HEX_R, 0.0);
    for i in 0..3 {
        let t = (f64::from(i) - 1.0) / 1.0;
        m.add_mesh(g, g_bead(), m_bead).set_pos(
            t * 0.052 * HEX_R,
            NB_TORSO_TOP - (0.012 + t.abs() * 0.010) * HEX_R,
            NB_TORSO_D * 0.5 + 0.012 * HEX_R,
        );
    }

    m.add_mesh(g, g_hide_wrap(), m_hide)
        .set_pos(0.0, NB_TORSO_BOT - 0.024 * HEX_R, 0.0);
    m.add_mesh(g, g_hide_pan(), m_hide_dk).rot_x(-0.08).set_pos(
        0.0,
        NB_TORSO_BOT - 0.040 * HEX_R,
        NB_TORSO_D * 0.5 + 0.020 * HEX_R,
    );
    for sx in [-0.070, -0.038, -0.006, 0.026, 0.058, 0.084] {
        m.add_mesh(g, g_fringe(), m_fringe).set_pos(
            sx * HEX_R,
            NB_TORSO_BOT - 0.058 * HEX_R,
            NB_TORSO_D * 0.5 + 0.010 * HEX_R,
        );
    }
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, NB_TORSO_BOT + 0.014 * HEX_R, 0.0);
    m.add_mesh(g, g_knot(), m_owner).set_pos(
        0.030 * HEX_R,
        NB_TORSO_BOT + 0.008 * HEX_R,
        NB_TORSO_D * 0.5 + 0.012 * HEX_R,
    );

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_anklet(), m_leath_dk).set_pos(
            sx * NB_HIP_X,
            0.024 * HEX_R,
            if sx > 0.0 {
                0.028 * HEX_R
            } else {
                -0.022 * HEX_R
            },
        );
    }

    // nbArcherArms (`:597-607`)
    let left = nb_arm_ik(
        &mut m,
        g,
        v3(NB_SHLD_X, NB_SHLD_Y, 0.0),
        NB_GRIP,
        v3(0.55, -0.70, 0.20),
        m_skin,
        m_skin,
        Some(m_skin_dk),
    );
    let _right = nb_arm_ik(
        &mut m,
        g,
        v3(-NB_SHLD_X, NB_SHLD_Y, 0.0),
        NB_NOCK,
        v3(-0.55, 0.85, -0.25),
        m_skin,
        m_skin,
        Some(m_skin_dk),
    );
    m.add_mesh(g, g_bracer(), m_leath)
        .quat_from_unit_vectors(Y_UP, left.axis)
        .set_pos_v(add_scaled(left.hand, left.axis, -0.040 * HEX_R));
    m.add_mesh(g, g_bracer(), m_leath_dk)
        .quat_from_unit_vectors(Y_UP, left.axis)
        .set_pos_v(left.elbow.lerp(v3(NB_SHLD_X, NB_SHLD_Y, 0.0), 0.72));

    nb_add_quiver(&mut m, g, m_leath, m_leath_dk, m_shaft, m_owner);
    nb_add_back_shield(&mut m, g, m_shield, m_shield_dk, m_leath_dk);

    let (tip_top, tip_bot) = nb_add_bow_limbs(&mut m, g, m_wood, m_leath);
    nb_stretch(&mut m, g, m_string, tip_top, NB_NOCK, 0.007 * HEX_R, None);
    nb_stretch(&mut m, g, m_string, tip_bot, NB_NOCK, 0.007 * HEX_R, None);
    nb_add_arrow(&mut m, g, m_shaft, m_bronze, m_bronze_lt, m_sinew, m_owner);
    m
}
