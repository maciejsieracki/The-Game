//! Port of `render/kamien-lucznicy-opus5.ts` (`edb8fb56`):
//! `buildEgyptianArcherOpus5` and `buildSumerianArcherOpus5`.
//!
//! The lazily created `getKL*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{arm_ik, orient_y_to, rotate_on_axis, seg, ArmIk, ArmIkKit, Y_UP};
use crate::geom::{Mat4, Vec3};
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{
    quat_from_unit_vectors, Geo, MatId, NodeId, Prim, UnitModel, ROOT,
};
use std::f64::consts::PI;

const KL_SKIN_EG: u32 = 0xb9743c;
const KL_SKIN_EG_DK: u32 = 0x995c2e;
const KL_SKIN_SU: u32 = 0xdda971;
const KL_SKIN_SU_DK: u32 = 0xba8a58;
const KL_LINEN: u32 = 0xeee6d2;
const KL_LINEN_DK: u32 = 0xd2c7ac;
const KL_FLEECE: u32 = 0xe6dcc0;
const KL_FLEECE_DK: u32 = 0x8f7448;
const KL_WOOL_BAND: u32 = 0x8a6a48;
const KL_WOOL_DYED: u32 = 0x8f4a2e;
const KL_WOOL_DYED_D: u32 = 0x6e3722;
const KL_WOOD_BOW: u32 = 0x8a6238;
const KL_WOOD_SHAFT: u32 = 0x9c7748;
const KL_LEATHER: u32 = 0x6b4a28;
const KL_LEATHER_DK: u32 = 0x4a331b;
const KL_STRING: u32 = 0xe8e0cc;
const KL_SINEW: u32 = 0xd8cba8;
const KL_FLINT: u32 = 0x7d8288;
const KL_FLINT_LT: u32 = 0x9aa0a6;
const KL_BONE: u32 = 0xe2d8ba;
const KL_HAIR_DK: u32 = 0x422915;
const KL_KOHL: u32 = 0x14100c;
const KL_EYE_WHITE: u32 = 0xece7db;
const KL_FEATHER: u32 = 0xeae3d2;
const KL_FEATHER_DK: u32 = 0x8c7c64;
const KL_BEAD_RED: u32 = 0xa8432a;
const KL_BEAD_TEAL: u32 = 0x2f8f86;

const KL_HIP_Y: f64 = 0.208 * HEX_R;
const KL_TORSO_W: f64 = 0.180 * HEX_R;
const KL_TORSO_H: f64 = 0.205 * HEX_R;
const KL_TORSO_D: f64 = 0.100 * HEX_R;
const KL_TORSO_BOT: f64 = 0.240 * HEX_R;
const KL_TORSO_CTR: f64 = KL_TORSO_BOT + KL_TORSO_H * 0.5;
const KL_TORSO_TOP: f64 = KL_TORSO_BOT + KL_TORSO_H;
const KL_NECK_H: f64 = 0.028 * HEX_R;
const KL_HEAD_S: f64 = 0.128 * HEX_R;
const KL_HEAD_CTR: f64 = KL_TORSO_TOP + KL_NECK_H + KL_HEAD_S * 0.5;
const KL_HEAD_TOP: f64 = KL_TORSO_TOP + KL_NECK_H + KL_HEAD_S;
const KL_SHLD_X: f64 = KL_TORSO_W * 0.5 + 0.030 * HEX_R;
const KL_SHLD_Y: f64 = KL_TORSO_TOP - 0.024 * HEX_R;
const KL_HIP_X: f64 = 0.052 * HEX_R;
const KL_THIGH_L: f64 = 0.104 * HEX_R;
const KL_SHIN_L: f64 = 0.096 * HEX_R;
const KL_UPARM_L: f64 = 0.100 * HEX_R;
const KL_FOREARM_L: f64 = 0.092 * HEX_R;

fn bx(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w, h, d))
}
fn v3(x: f64, y: f64, z: f64) -> Vec3 {
    Vec3::new(x, y, z)
}

// `getKL*` (`kamien-lucznicy-opus5.ts:269-323`)
fn kl_torso() -> Geo {
    bx(KL_TORSO_W, KL_TORSO_H, KL_TORSO_D)
}
fn kl_chest() -> Geo {
    bx(KL_TORSO_W * 1.05, 0.072 * HEX_R, KL_TORSO_D * 1.06)
}
fn kl_neck() -> Geo {
    bx(0.042 * HEX_R, KL_NECK_H * 1.6, 0.042 * HEX_R)
}
fn kl_head() -> Geo {
    bx(KL_HEAD_S, KL_HEAD_S, KL_HEAD_S)
}
fn kl_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn kl_nose() -> Geo {
    bx(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)
}
fn kl_ear() -> Geo {
    bx(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)
}
fn kl_eye() -> Geo {
    bx(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn kl_eye_big() -> Geo {
    bx(0.028 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)
}
fn kl_pupil() -> Geo {
    bx(0.012 * HEX_R, 0.012 * HEX_R, 0.006 * HEX_R)
}
fn kl_brow() -> Geo {
    bx(0.034 * HEX_R, 0.010 * HEX_R, 0.010 * HEX_R)
}
fn kl_kohl() -> Geo {
    bx(0.040 * HEX_R, 0.007 * HEX_R, 0.007 * HEX_R)
}
fn kl_thigh() -> Geo {
    bx(0.056 * HEX_R, KL_THIGH_L, 0.060 * HEX_R)
}
fn kl_shin() -> Geo {
    bx(0.038 * HEX_R, KL_SHIN_L, 0.042 * HEX_R)
}
fn kl_sole() -> Geo {
    bx(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R)
}
fn kl_toes() -> Geo {
    bx(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)
}
fn kl_up_arm() -> Geo {
    bx(0.054 * HEX_R, KL_UPARM_L, 0.054 * HEX_R)
}
fn kl_forearm() -> Geo {
    bx(0.040 * HEX_R, KL_FOREARM_L, 0.040 * HEX_R)
}
fn kl_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn kl_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn kl_belt() -> Geo {
    bx(0.200 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)
}
fn kl_knot() -> Geo {
    bx(0.038 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R)
}
fn kl_bracer() -> Geo {
    bx(0.050 * HEX_R, 0.046 * HEX_R, 0.050 * HEX_R)
}
fn kl_arm_band() -> Geo {
    bx(0.058 * HEX_R, 0.018 * HEX_R, 0.058 * HEX_R)
}
fn kl_kilt() -> Geo {
    bx(0.206 * HEX_R, 0.094 * HEX_R, 0.130 * HEX_R)
}
fn kl_kilt_pan() -> Geo {
    bx(0.096 * HEX_R, 0.112 * HEX_R, 0.016 * HEX_R)
}
fn kl_pleat() -> Geo {
    bx(0.020 * HEX_R, 0.078 * HEX_R, 0.012 * HEX_R)
}
fn kl_band_eg() -> Geo {
    bx(0.136 * HEX_R, 0.022 * HEX_R, 0.136 * HEX_R)
}
fn kl_feather() -> Geo {
    bx(0.020 * HEX_R, 0.086 * HEX_R, 0.010 * HEX_R)
}
fn kl_feat_tip() -> Geo {
    bx(0.013 * HEX_R, 0.032 * HEX_R, 0.008 * HEX_R)
}
fn kl_beard() -> Geo {
    bx(0.034 * HEX_R, 0.040 * HEX_R, 0.024 * HEX_R)
}
fn kl_hair_cap() -> Geo {
    bx(0.132 * HEX_R, 0.028 * HEX_R, 0.132 * HEX_R)
}
fn kl_cord() -> Geo {
    bx(0.168 * HEX_R, 0.012 * HEX_R, 0.104 * HEX_R)
}
fn kl_bead() -> Geo {
    bx(0.019 * HEX_R, 0.019 * HEX_R, 0.014 * HEX_R)
}
fn kl_knife() -> Geo {
    bx(0.016 * HEX_R, 0.048 * HEX_R, 0.007 * HEX_R)
}
fn kl_knife_hlt() -> Geo {
    bx(0.018 * HEX_R, 0.022 * HEX_R, 0.011 * HEX_R)
}
fn kl_knife_she() -> Geo {
    bx(0.022 * HEX_R, 0.034 * HEX_R, 0.013 * HEX_R)
}
fn kl_stick() -> Geo {
    bx(0.014 * HEX_R, 0.120 * HEX_R, 0.012 * HEX_R)
}
fn kl_anklet() -> Geo {
    bx(0.042 * HEX_R, 0.012 * HEX_R, 0.046 * HEX_R)
}
fn kl_kaun_tier() -> Geo {
    bx(0.188 * HEX_R, 0.030 * HEX_R, 0.118 * HEX_R)
}
fn kl_tuft() -> Geo {
    bx(0.042 * HEX_R, 0.038 * HEX_R, 0.032 * HEX_R)
}
fn kl_shawl() -> Geo {
    bx(0.062 * HEX_R, 0.160 * HEX_R, 0.086 * HEX_R)
}
fn kl_head_band() -> Geo {
    bx(0.136 * HEX_R, 0.030 * HEX_R, 0.136 * HEX_R)
}
fn kl_grip() -> Geo {
    bx(0.024 * HEX_R, 0.076 * HEX_R, 0.026 * HEX_R)
}
fn kl_grip_wrap() -> Geo {
    bx(0.029 * HEX_R, 0.038 * HEX_R, 0.031 * HEX_R)
}
fn kl_nock() -> Geo {
    bx(0.016 * HEX_R, 0.020 * HEX_R, 0.018 * HEX_R)
}
fn kl_transv() -> Geo {
    bx(0.034 * HEX_R, 0.022 * HEX_R, 0.007 * HEX_R)
}
fn kl_transv_ed() -> Geo {
    bx(0.038 * HEX_R, 0.008 * HEX_R, 0.004 * HEX_R)
}
fn kl_leaf_tip() -> Geo {
    Geo::Prim(Prim::cone(0.014 * HEX_R, 0.050 * HEX_R, 4))
}
fn kl_binding() -> Geo {
    bx(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R)
}
fn kl_fletch() -> Geo {
    bx(0.006 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R)
}
fn kl_quiver() -> Geo {
    bx(0.048 * HEX_R, 0.156 * HEX_R, 0.048 * HEX_R)
}
fn kl_q_rim() -> Geo {
    bx(0.056 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R)
}
fn kl_q_strap() -> Geo {
    bx(0.026 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)
}
fn kl_q_arrow() -> Geo {
    bx(0.009 * HEX_R, 0.090 * HEX_R, 0.009 * HEX_R)
}

/// `KL_GRIP` (`:470`).
const KL_GRIP: Vec3 = Vec3::new(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
/// `KL_NOCK` (`:471`).
const KL_NOCK: Vec3 = Vec3::new(-0.052 * HEX_R, 0.458 * HEX_R, -0.020 * HEX_R);

/// `klStretch(parent, mtl, A, B, w, d)` (`:361-375`): unit box from `a` to `b`.
fn kl_stretch(
    m: &mut UnitModel,
    parent: NodeId,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    w: f64,
    d: Option<f64>,
) {
    let v = b.minus(a);
    let len = v.length();
    let dn = v.normalize();
    let id = m.add_mesh_id(parent, kl_unit(), mtl);
    m.node(id).set_scale(w, len, d.unwrap_or(w));
    orient_y_to(m, id, dn);
    m.node(id).set_pos_v(a.plus(dn.scale(len * 0.5)));
}

/// `klBuildLeg` (`:378-395`).
#[allow(clippy::too_many_arguments)]
fn kl_build_leg(
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
    p = seg(m, g, kl_thigh(), m_skin, p, th_u, KL_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, kl_shin(), m_skin, p, th_l, KL_SHIN_L);
    let foot_z = p.z + 0.012 * HEX_R;
    m.add_mesh(g, kl_sole(), m_skin)
        .set_pos(sx, 0.009 * HEX_R, foot_z);
    m.add_mesh(g, kl_toes(), m_skin_dk)
        .set_pos(sx, 0.007 * HEX_R, foot_z + 0.038 * HEX_R);
}

/// `klBuildCore` (`:433-461`).
fn kl_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, m_skin: MatId, m_skin_dk: MatId) {
    m.add_mesh(g, kl_torso(), m_torso)
        .set_pos(0.0, KL_TORSO_CTR, 0.0);
    m.add_mesh(g, kl_chest(), m_torso)
        .set_pos(0.0, KL_TORSO_TOP - 0.038 * HEX_R, 0.0);
    m.add_mesh(g, kl_neck(), m_skin)
        .set_pos(0.0, KL_TORSO_TOP + KL_NECK_H * 0.5, 0.0);
    m.add_mesh(g, kl_head(), m_skin)
        .set_pos(0.0, KL_HEAD_CTR, 0.0);
    m.add_mesh(g, kl_jaw(), m_skin_dk)
        .set_pos(0.0, KL_HEAD_CTR - KL_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, kl_nose(), m_skin).set_pos(
        0.0,
        KL_HEAD_CTR - 0.004 * HEX_R,
        KL_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, kl_ear(), m_skin_dk).set_pos(
            sx * (KL_HEAD_S * 0.5 + 0.004 * HEX_R),
            KL_HEAD_CTR - 0.006 * HEX_R,
            0.0,
        );
    }
}

/// Bow tips of [`kl_add_bow_limbs`].
struct BowTips {
    top: Vec3,
    bot: Vec3,
}

/// `klAddBowLimbs` (`:479-515`).
fn kl_add_bow_limbs(
    m: &mut UnitModel,
    g: NodeId,
    profile: &[[f64; 2]],
    widths: &[f64],
    m_bow: MatId,
    m_wrap: MatId,
) -> BowTips {
    let dir_a = KL_GRIP.minus(KL_NOCK).normalize();
    let yaw = js_atan2(dir_a.x, dir_a.z);

    let bow = m.detached_group();
    m.node(bow).set_pos_v(KL_GRIP).rot_y(yaw);
    m.add_mesh(bow, kl_grip(), m_bow);
    m.add_mesh(bow, kl_grip_wrap(), m_wrap);
    for sg in [1.0, -1.0] {
        for i in 0..profile.len() - 1 {
            let p = profile[i];
            let q = profile[i + 1];
            let a = v3(0.0, sg * p[0] * HEX_R, p[1] * HEX_R);
            let b = v3(0.0, sg * q[0] * HEX_R, q[1] * HEX_R);
            kl_stretch(
                m,
                bow,
                m_bow,
                a,
                b,
                widths[i] * HEX_R,
                Some((widths[i] + 0.004) * HEX_R),
            );
        }
        let last = profile[profile.len() - 1];
        m.add_mesh(bow, kl_nock(), m_bow)
            .set_pos(0.0, sg * last[0] * HEX_R, last[1] * HEX_R);
    }
    m.attach(g, bow);

    let last = profile[profile.len() - 1];
    let rot_y = Mat4::rotation_y(yaw);
    let top = v3(0.0, last[0] * HEX_R, last[1] * HEX_R)
        .apply_mat4(&rot_y)
        .plus(KL_GRIP);
    let bot = v3(0.0, -last[0] * HEX_R, last[1] * HEX_R)
        .apply_mat4(&rot_y)
        .plus(KL_GRIP);
    BowTips { top, bot }
}

/// `klAddString` (`:518-524`).
fn kl_add_string(m: &mut UnitModel, g: NodeId, tips: &BowTips, m_string: MatId) {
    kl_stretch(m, g, m_string, tips.top, KL_NOCK, 0.008 * HEX_R, None);
    kl_stretch(m, g, m_string, tips.bot, KL_NOCK, 0.008 * HEX_R, None);
}

/// `klAddArrow` head.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Head {
    Transverse,
    Leaf,
}

/// `klAddArrow` (`:532-579`).
#[allow(clippy::too_many_arguments)]
fn kl_add_arrow(
    m: &mut UnitModel,
    g: NodeId,
    head: Head,
    m_shaft: MatId,
    m_flint: MatId,
    m_flint_lt: MatId,
    m_sinew: MatId,
    m_fletch: MatId,
) {
    let dir_a = KL_GRIP.minus(KL_NOCK).normalize();
    let yaw = js_atan2(dir_a.x, dir_a.z);
    let shaft_end = KL_GRIP.plus(dir_a.scale(0.058 * HEX_R));
    kl_stretch(m, g, m_shaft, KL_NOCK, shaft_end, 0.012 * HEX_R, None);

    let q_a = quat_from_unit_vectors(Y_UP, dir_a);
    m.add_mesh(g, kl_binding(), m_sinew)
        .set_pos_v(shaft_end.plus(dir_a.scale(0.004 * HEX_R)))
        .quaternion = q_a;

    if head == Head::Transverse {
        m.add_mesh(g, kl_transv(), m_flint)
            .rot_y(yaw)
            .set_pos_v(shaft_end.plus(dir_a.scale(0.022 * HEX_R)));
        m.add_mesh(g, kl_transv_ed(), m_flint_lt)
            .rot_y(yaw)
            .set_pos_v(shaft_end.plus(dir_a.scale(0.036 * HEX_R)));
    } else {
        m.add_mesh(g, kl_leaf_tip(), m_flint)
            .set_pos_v(shaft_end.plus(dir_a.scale(0.026 * HEX_R)))
            .quaternion = q_a;
        let barb = m.add_mesh(g, kl_binding(), m_flint_lt);
        barb.set_scale(1.4, 0.5, 0.7);
        barb.quaternion = q_a;
        barb.set_pos_v(shaft_end.plus(dir_a.scale(0.012 * HEX_R)));
    }

    for rz in [0.0, PI / 2.0] {
        let id = m.add_mesh_id(g, kl_fletch(), m_fletch);
        m.node(id).quaternion = q_a;
        rotate_on_axis(m, id, Y_UP, rz);
        m.node(id)
            .set_pos_v(KL_NOCK.plus(dir_a.scale(0.030 * HEX_R)));
    }
}

/// `klAddQuiver` (`:582-620`).
fn kl_add_quiver(
    m: &mut UnitModel,
    g: NodeId,
    m_leath: MatId,
    m_leath_dk: MatId,
    m_shaft: MatId,
    m_fletch_owner: MatId,
) {
    let qx = -0.056 * HEX_R;
    let qz = -(KL_TORSO_D * 0.5 + 0.032 * HEX_R);
    m.add_mesh(g, kl_quiver(), m_leath)
        .rot_x(-0.24)
        .rot_z(0.22)
        .set_pos(qx, KL_TORSO_CTR + 0.050 * HEX_R, qz);
    m.add_mesh(g, kl_q_rim(), m_leath_dk)
        .rot_x(-0.24)
        .rot_z(0.22)
        .set_pos(
            qx - 0.018 * HEX_R,
            KL_TORSO_CTR + 0.126 * HEX_R,
            qz - 0.020 * HEX_R,
        );
    m.add_mesh(g, kl_q_strap(), m_leath_dk)
        .rot_x(0.10)
        .rot_z(-0.62)
        .set_pos(
            -0.012 * HEX_R,
            KL_TORSO_CTR + 0.010 * HEX_R,
            -(KL_TORSO_D * 0.5 + 0.008 * HEX_R),
        );
    m.add_mesh(g, kl_q_strap(), m_leath)
        .rot_x(-0.10)
        .rot_z(0.60)
        .set_pos(
            -0.010 * HEX_R,
            KL_TORSO_CTR + 0.008 * HEX_R,
            KL_TORSO_D * 0.5 + 0.006 * HEX_R,
        );
    for (dx, dy) in [(-0.022, 0.0), (0.002, 0.012), (0.020, -0.006)] {
        m.add_mesh(g, kl_q_arrow(), m_shaft)
            .rot_x(-0.24)
            .rot_z(0.22)
            .set_pos(
                qx + dx * HEX_R,
                KL_TORSO_CTR + (0.140 + dy) * HEX_R,
                qz - 0.020 * HEX_R,
            );
        m.add_mesh(g, kl_fletch(), m_fletch_owner)
            .rot_x(-0.24)
            .rot_z(0.22)
            .set_scale(1.0, 0.66, 0.66)
            .set_pos(
                qx + (dx - 0.012) * HEX_R,
                KL_TORSO_CTR + (0.180 + dy) * HEX_R,
                qz - 0.030 * HEX_R,
            );
    }
}

/// `klArcherLegs` (`:623-630`).
fn kl_archer_legs(m: &mut UnitModel, g: NodeId, m_skin: MatId, m_skin_dk: MatId) {
    let hip = KL_HIP_Y - 0.006 * HEX_R;
    kl_build_leg(m, g, KL_HIP_X, 0.30, 0.16, m_skin, m_skin_dk, hip);
    kl_build_leg(m, g, -KL_HIP_X, -0.34, -0.14, m_skin, m_skin_dk, hip);
}

const KL_ARM_KIT: ArmIkKit = ArmIkKit {
    up: Geo::Prim(Prim::Box {
        w: 0.054 * HEX_R,
        h: KL_UPARM_L,
        d: 0.054 * HEX_R,
    }),
    fore: Geo::Prim(Prim::Box {
        w: 0.040 * HEX_R,
        h: KL_FOREARM_L,
        d: 0.040 * HEX_R,
    }),
    fist: Geo::Prim(Prim::Box {
        w: 0.046 * HEX_R,
        h: 0.046 * HEX_R,
        d: 0.048 * HEX_R,
    }),
    l1: KL_UPARM_L,
    l2: KL_FOREARM_L,
    fist_off: 0.012 * HEX_R,
};

/// `klArcherArms` (`:633-643`).
fn kl_archer_arms(
    m: &mut UnitModel,
    g: NodeId,
    m_up: MatId,
    m_fore: MatId,
    m_fist: MatId,
) -> (ArmIk, ArmIk) {
    debug_assert_eq!(KL_ARM_KIT.up, kl_up_arm());
    debug_assert_eq!(KL_ARM_KIT.fore, kl_forearm());
    debug_assert_eq!(KL_ARM_KIT.fist, kl_fist());
    let left = arm_ik(
        m,
        g,
        &KL_ARM_KIT,
        v3(KL_SHLD_X, KL_SHLD_Y, 0.0),
        KL_GRIP,
        v3(0.55, -0.70, 0.20),
        m_up,
        m_fore,
        Some(m_fist),
    );
    let right = arm_ik(
        m,
        g,
        &KL_ARM_KIT,
        v3(-KL_SHLD_X, KL_SHLD_Y, 0.0),
        KL_NOCK,
        v3(-0.55, 0.85, -0.25),
        m_up,
        m_fore,
        Some(m_fist),
    );
    (left, right)
}

/// `Math.sign` for the non-zero hand x of the arm bands.
fn sign(x: f64) -> f64 {
    super::kit::js_sign(x)
}

/// `buildEgyptianArcherOpus5` (`kamien-lucznicy-opus5.ts:653-817`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_egyptian_archer_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KL_SKIN_EG, 0.05, 0.80);
    let m_skin_dk = m.mat(KL_SKIN_EG_DK, 0.05, 0.82);
    let m_linen = m.mat(KL_LINEN, 0.04, 0.88);
    let m_linen_dk = m.mat(KL_LINEN_DK, 0.04, 0.90);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_wood = m.mat(KL_WOOD_BOW, 0.05, 0.82);
    let m_shaft = m.mat(KL_WOOD_SHAFT, 0.05, 0.84);
    let m_leath = m.mat(KL_LEATHER, 0.06, 0.82);
    let m_leath_dk = m.mat(KL_LEATHER_DK, 0.06, 0.86);
    let m_string = m.mat(KL_STRING, 0.02, 0.95);
    let m_sinew = m.mat(KL_SINEW, 0.03, 0.92);
    let m_flint = m.mat(KL_FLINT, 0.20, 0.52);
    let m_flint_lt = m.mat(KL_FLINT_LT, 0.24, 0.44);
    let m_bone = m.mat(KL_BONE, 0.06, 0.76);
    let m_hair = m.mat(KL_HAIR_DK, 0.04, 0.90);
    let m_kohl = m.mat(KL_KOHL, 0.05, 0.86);
    let m_feath = m.mat(KL_FEATHER, 0.03, 0.92);
    let m_feath_dk = m.mat(KL_FEATHER_DK, 0.04, 0.90);
    let m_bead_r = m.mat(KL_BEAD_RED, 0.12, 0.60);
    let m_bead_t = m.mat(KL_BEAD_TEAL, 0.14, 0.55);

    kl_build_core(&mut m, g, m_skin, m_skin, m_skin_dk);
    kl_archer_legs(&mut m, g, m_skin, m_skin_dk);

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, kl_eye(), m_kohl).set_pos(
            sx * 0.026 * HEX_R,
            KL_HEAD_CTR + 0.014 * HEX_R,
            KL_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
    }
    m.add_mesh(g, kl_kohl(), m_kohl)
        .set_pos(
            0.0,
            KL_HEAD_CTR + 0.020 * HEX_R,
            KL_HEAD_S * 0.5 + 0.001 * HEX_R,
        )
        .set_scale(1.6, 1.0, 1.0);
    m.add_mesh(g, kl_beard(), m_hair).rot_x(0.22).set_pos(
        0.0,
        KL_HEAD_CTR - 0.056 * HEX_R,
        KL_HEAD_S * 0.5 - 0.008 * HEX_R,
    );

    m.add_mesh(g, kl_hair_cap(), m_hair)
        .set_pos(0.0, KL_HEAD_TOP - 0.008 * HEX_R, 0.0);
    m.add_mesh(g, kl_band_eg(), m_linen)
        .set_pos(0.0, KL_HEAD_CTR + 0.036 * HEX_R, 0.0);
    for (sx, tilt) in [(0.032, -0.30), (-0.010, -0.12)] {
        m.add_mesh(g, kl_feather(), m_feath)
            .rot_z(tilt)
            .rot_x(-0.26)
            .set_pos(sx * HEX_R, KL_HEAD_TOP + 0.038 * HEX_R, -0.026 * HEX_R);
        m.add_mesh(g, kl_feat_tip(), m_feath_dk)
            .rot_z(tilt)
            .rot_x(-0.26)
            .set_pos(
                (sx + 0.024 * js_sin(-tilt)) * HEX_R,
                KL_HEAD_TOP + 0.086 * HEX_R,
                -0.048 * HEX_R,
            );
    }

    m.add_mesh(g, kl_cord(), m_leath_dk)
        .set_pos(0.0, KL_TORSO_TOP - 0.014 * HEX_R, 0.0);
    for i in 0..5u32 {
        let mtl = if i % 2 == 0 { m_bead_r } else { m_bead_t };
        let t = (f64::from(i) - 2.0) / 2.0;
        m.add_mesh(g, kl_bead(), mtl).set_pos(
            t * 0.058 * HEX_R,
            KL_TORSO_TOP - (0.014 + t.abs() * -0.008) * HEX_R,
            KL_TORSO_D * 0.5 + (0.014 - t.abs() * 0.008) * HEX_R,
        );
    }

    m.add_mesh(g, kl_kilt(), m_linen)
        .set_pos(0.0, KL_TORSO_BOT - 0.026 * HEX_R, 0.0);
    m.add_mesh(g, kl_kilt_pan(), m_linen).rot_x(-0.10).set_pos(
        0.0,
        KL_TORSO_BOT - 0.038 * HEX_R,
        KL_TORSO_D * 0.5 + 0.022 * HEX_R,
    );
    for sx in [-0.062, -0.020, 0.020, 0.062] {
        m.add_mesh(g, kl_pleat(), m_linen_dk).set_pos(
            sx * HEX_R,
            KL_TORSO_BOT - 0.034 * HEX_R,
            KL_TORSO_D * 0.5 + 0.014 * HEX_R,
        );
    }
    m.add_mesh(g, kl_belt(), m_owner)
        .set_pos(0.0, KL_TORSO_BOT + 0.012 * HEX_R, 0.0);
    m.add_mesh(g, kl_knot(), m_owner).set_pos(
        0.030 * HEX_R,
        KL_TORSO_BOT + 0.006 * HEX_R,
        KL_TORSO_D * 0.5 + 0.012 * HEX_R,
    );

    let kn_x = KL_TORSO_W * 0.5 + 0.008 * HEX_R;
    m.add_mesh(g, kl_knife_she(), m_leath_dk)
        .rot_z(0.20)
        .set_pos(kn_x, KL_TORSO_BOT - 0.026 * HEX_R, -0.018 * HEX_R);
    m.add_mesh(g, kl_knife(), m_flint).rot_z(0.20).set_pos(
        kn_x + 0.004 * HEX_R,
        KL_TORSO_BOT - 0.008 * HEX_R,
        -0.018 * HEX_R,
    );
    m.add_mesh(g, kl_knife_hlt(), m_bone).rot_z(0.20).set_pos(
        kn_x + 0.010 * HEX_R,
        KL_TORSO_BOT + 0.024 * HEX_R,
        -0.018 * HEX_R,
    );

    m.add_mesh(g, kl_stick(), m_wood)
        .rot_x(0.24)
        .rot_z(-0.34)
        .set_pos(
            -(KL_TORSO_W * 0.5 + 0.008 * HEX_R),
            KL_TORSO_BOT - 0.026 * HEX_R,
            -0.014 * HEX_R,
        );
    m.add_mesh(g, kl_stick(), m_wood)
        .set_scale(1.0, 0.55, 1.0)
        .rot_x(0.24)
        .rot_z(-0.88)
        .set_pos(
            -(KL_TORSO_W * 0.5 + 0.038 * HEX_R),
            KL_TORSO_BOT - 0.086 * HEX_R,
            -0.002 * HEX_R,
        );

    let (left, right) = kl_archer_arms(&mut m, g, m_skin, m_skin, m_skin_dk);
    m.add_mesh(g, kl_bracer(), m_leath)
        .set_pos_v(left.hand.plus(left.axis.scale(-0.040 * HEX_R)))
        .quaternion = quat_from_unit_vectors(Y_UP, left.axis);
    for a in [left, right] {
        let shoulder = v3(sign(a.hand.x) * KL_SHLD_X, KL_SHLD_Y, 0.0);
        let q = quat_from_unit_vectors(Y_UP, a.elbow.minus(shoulder).normalize());
        m.add_mesh(g, kl_arm_band(), m_bead_t)
            .set_pos_v(a.elbow.lerp(shoulder, 0.72))
            .quaternion = q;
    }
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, kl_anklet(), m_bead_r).set_pos(
            sx * KL_HIP_X,
            0.026 * HEX_R,
            if sx > 0.0 {
                0.030 * HEX_R
            } else {
                -0.024 * HEX_R
            },
        );
    }

    let eg_profile: [[f64; 2]; 5] = [
        [0.038, 0.006],
        [0.116, 0.026],
        [0.192, 0.032],
        [0.252, 0.014],
        [0.292, -0.016],
    ];
    let eg_w = [0.019, 0.018, 0.016, 0.014];
    let eg = kl_add_bow_limbs(&mut m, g, &eg_profile, &eg_w, m_wood, m_leath);
    kl_add_string(&mut m, g, &eg, m_string);
    kl_add_arrow(
        &mut m,
        g,
        Head::Transverse,
        m_shaft,
        m_flint,
        m_flint_lt,
        m_sinew,
        m_owner,
    );
    kl_add_quiver(&mut m, g, m_leath, m_leath_dk, m_shaft, m_owner);
    m
}

/// `buildSumerianArcherOpus5` (`kamien-lucznicy-opus5.ts:827-958`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_sumerian_archer_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KL_SKIN_SU, 0.05, 0.80);
    let m_skin_dk = m.mat(KL_SKIN_SU_DK, 0.05, 0.82);
    let m_fleece = m.mat(KL_FLEECE, 0.03, 0.96);
    let m_fleec_d = m.mat(KL_FLEECE_DK, 0.03, 0.97);
    let m_wool_bd = m.mat(KL_WOOL_BAND, 0.03, 0.94);
    let m_dyed = m.mat(KL_WOOL_DYED, 0.04, 0.90);
    let m_dyed_dk = m.mat(KL_WOOL_DYED_D, 0.04, 0.92);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_wood = m.mat(KL_WOOD_BOW, 0.05, 0.82);
    let m_shaft = m.mat(KL_WOOD_SHAFT, 0.05, 0.84);
    let m_leath = m.mat(KL_LEATHER, 0.06, 0.82);
    let m_leath_dk = m.mat(KL_LEATHER_DK, 0.06, 0.86);
    let m_string = m.mat(KL_STRING, 0.02, 0.95);
    let m_sinew = m.mat(KL_SINEW, 0.03, 0.92);
    let m_flint = m.mat(KL_FLINT, 0.20, 0.52);
    let m_flint_lt = m.mat(KL_FLINT_LT, 0.24, 0.44);
    let m_eye_w = m.mat(KL_EYE_WHITE, 0.04, 0.72);
    let m_dark = m.mat(KL_HAIR_DK, 0.04, 0.90);

    kl_build_core(&mut m, g, m_skin, m_skin, m_skin_dk);
    kl_archer_legs(&mut m, g, m_skin, m_skin_dk);

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, kl_eye_big(), m_eye_w).set_pos(
            sx * 0.028 * HEX_R,
            KL_HEAD_CTR + 0.014 * HEX_R,
            KL_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
        m.add_mesh(g, kl_pupil(), m_dark).set_pos(
            sx * 0.028 * HEX_R,
            KL_HEAD_CTR + 0.014 * HEX_R,
            KL_HEAD_S * 0.5 + 0.005 * HEX_R,
        );
        m.add_mesh(g, kl_brow(), m_dark).rot_z(-sx * 0.16).set_pos(
            sx * 0.028 * HEX_R,
            KL_HEAD_CTR + 0.032 * HEX_R,
            KL_HEAD_S * 0.5 + 0.003 * HEX_R,
        );
    }
    m.add_mesh(g, kl_hair_cap(), m_skin_dk)
        .set_pos(0.0, KL_HEAD_TOP - 0.006 * HEX_R, 0.0);
    m.add_mesh(g, kl_head_band(), m_wool_bd)
        .set_pos(0.0, KL_HEAD_CTR + 0.050 * HEX_R, 0.0);

    let tier_y = [0.238, 0.194, 0.150, 0.106];
    for (t, &ty) in tier_y.iter().enumerate() {
        let mt = if t % 2 == 0 { m_fleece } else { m_fleec_d };
        #[allow(clippy::cast_precision_loss)]
        let s = 1.0 - (t as f64) * 0.035;
        m.add_mesh(g, kl_kaun_tier(), mt)
            .set_scale(s, 1.0, s)
            .set_pos(0.0, ty * HEX_R, 0.0);
        for j in 0..6u32 {
            let ang = -PI * 0.5 + (f64::from(j) / 5.0) * PI * 1.35;
            m.add_mesh(g, kl_tuft(), mt).rot_y(ang).rot_x(0.30).set_pos(
                js_sin(ang) * 0.100 * s * HEX_R,
                (ty - 0.018) * HEX_R,
                js_cos(ang) * 0.066 * s * HEX_R,
            );
        }
    }
    m.add_mesh(g, kl_belt(), m_owner)
        .set_scale(0.98, 1.0, 0.98)
        .set_pos(0.0, KL_TORSO_BOT + 0.024 * HEX_R, 0.0);
    m.add_mesh(g, kl_knot(), m_owner).set_pos(
        -0.028 * HEX_R,
        KL_TORSO_BOT + 0.018 * HEX_R,
        KL_TORSO_D * 0.5 + 0.012 * HEX_R,
    );

    m.add_mesh(g, kl_shawl(), m_dyed)
        .rot_z(-0.22)
        .set_scale(1.0, 0.92, 1.05)
        .set_pos(
            KL_TORSO_W * 0.5 + 0.004 * HEX_R,
            KL_TORSO_CTR + 0.044 * HEX_R,
            -0.004 * HEX_R,
        );
    m.add_mesh(g, kl_shawl(), m_dyed)
        .rot_z(PI / 2.0 - 0.30)
        .set_scale(0.62, 0.46, 1.02)
        .set_pos(
            KL_SHLD_X - 0.006 * HEX_R,
            KL_SHLD_Y + 0.020 * HEX_R,
            -0.002 * HEX_R,
        );
    for j in 0..3u32 {
        let mtl = if j % 2 == 0 { m_dyed } else { m_dyed_dk };
        m.add_mesh(g, kl_tuft(), mtl)
            .set_scale(0.72, 0.62, 0.78)
            .set_pos(
                (KL_TORSO_W * 0.5 + 0.012) * HEX_R,
                (KL_TORSO_CTR - 0.012 + f64::from(j) * 0.034) * HEX_R,
                0.028 * HEX_R,
            );
    }

    let (left, right) = kl_archer_arms(&mut m, g, m_skin, m_skin, m_skin_dk);
    m.add_mesh(g, kl_bracer(), m_leath)
        .set_pos_v(left.hand.plus(left.axis.scale(-0.040 * HEX_R)))
        .quaternion = quat_from_unit_vectors(Y_UP, left.axis);
    m.add_mesh(g, kl_arm_band(), m_leath_dk)
        .set_pos_v(right.hand.plus(right.axis.scale(-0.052 * HEX_R)))
        .quaternion = quat_from_unit_vectors(Y_UP, right.axis);

    let su_profile: [[f64; 2]; 4] = [
        [0.036, 0.006],
        [0.108, 0.022],
        [0.176, 0.026],
        [0.238, 0.012],
    ];
    let su_w = [0.020, 0.018, 0.015];
    let su = kl_add_bow_limbs(&mut m, g, &su_profile, &su_w, m_wood, m_leath);
    kl_add_string(&mut m, g, &su, m_string);
    kl_add_arrow(
        &mut m,
        g,
        Head::Leaf,
        m_shaft,
        m_flint,
        m_flint_lt,
        m_sinew,
        m_owner,
    );
    kl_add_quiver(&mut m, g, m_leath, m_leath_dk, m_shaft, m_owner);
    m
}
