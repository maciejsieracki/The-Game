//! Port of `render/kamien-zulu-taran-opus5.ts` (`edb8fb56`):
//! `buildZuluJavelineerOpus5` (Izijula) and `buildBatteringRamOpus5` (Taran).
//!
//! The lazily created `getKZ*`/`getKT*` singletons have fixed arguments, so
//! each maps to one geometry value.

use super::geo::KamienGeo;
use super::kit::seg;
use super::kit::{arm_ik, copy_quat_then_add_rot_y, ArmIkKit, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{
    quat_from_unit_vectors, Geo, MatId, NodeId, Prim, UnitModel, ROOT,
};
use std::f64::consts::PI;

const KZ_SKIN: u32 = 0xb06030;
const KZ_SKIN_DK: u32 = 0x8f4c25;
const KZ_BONE: u32 = 0xe4dcc0;
const KZ_BONE_DK: u32 = 0xc9bf9c;
const KZ_SINEW: u32 = 0xd8c8a4;
const KZ_WOOD: u32 = 0x7a5c3a;
const KZ_WOOD_LT: u32 = 0x8f6c42;
const KZ_HIDE_BRN: u32 = 0x8a3a26;
const KZ_HIDE_BRN_D: u32 = 0x6a2b1c;
const KZ_HIDE_WHT: u32 = 0xeae3d2;
const KZ_HIDE_BLK: u32 = 0x241a12;
const KZ_FUR_DK: u32 = 0x3a2214;
const KZ_FUR_LT: u32 = 0x6b4a28;
const KZ_HAIR_DK: u32 = 0x1a0c06;
const KZ_LOIN_DK: u32 = 0x3a2810;

const KZ_HIP_Y: f64 = 0.208 * HEX_R;
const KZ_TORSO_W: f64 = 0.180 * HEX_R;
const KZ_TORSO_H: f64 = 0.205 * HEX_R;
const KZ_TORSO_D: f64 = 0.100 * HEX_R;
const KZ_TORSO_BOT: f64 = 0.240 * HEX_R;
const KZ_TORSO_CTR: f64 = KZ_TORSO_BOT + KZ_TORSO_H * 0.5;
const KZ_TORSO_TOP: f64 = KZ_TORSO_BOT + KZ_TORSO_H;
const KZ_NECK_H: f64 = 0.028 * HEX_R;
const KZ_HEAD_S: f64 = 0.128 * HEX_R;
const KZ_HEAD_CTR: f64 = KZ_TORSO_TOP + KZ_NECK_H + KZ_HEAD_S * 0.5;
const KZ_HEAD_TOP: f64 = KZ_TORSO_TOP + KZ_NECK_H + KZ_HEAD_S;
const KZ_SHLD_X: f64 = KZ_TORSO_W * 0.5 + 0.030 * HEX_R;
const KZ_SHLD_Y: f64 = KZ_TORSO_TOP - 0.024 * HEX_R;
const KZ_HIP_X: f64 = 0.052 * HEX_R;
const KZ_THIGH_L: f64 = 0.104 * HEX_R;
const KZ_SHIN_L: f64 = 0.096 * HEX_R;
const KZ_UPARM_L: f64 = 0.100 * HEX_R;
const KZ_FOREARM_L: f64 = 0.092 * HEX_R;

const KZ_SH_N: u32 = 16;
const KZ_SH_A: f64 = 0.108 * HEX_R;
const KZ_SH_B: f64 = 0.212 * HEX_R;
const KZ_SH_C: f64 = 0.044 * HEX_R;
const KZ_SH_T: f64 = 0.018 * HEX_R;

const KT_WOOD: u32 = 0x7a5c3a;
const KT_WOOD_DK: u32 = 0x4a3018;
const KT_LOG: u32 = 0x6d5232;
const KT_LOG_DK: u32 = 0x513d24;
const KT_BARK: u32 = 0x3f2f1c;
const KT_CHAR: u32 = 0x1c1712;
const KT_STONE: u32 = 0x8a8e94;
const KT_STONE_DK: u32 = 0x6d7178;
const KT_HIDE_A: u32 = 0x9a6a42;
const KT_HIDE_B: u32 = 0x7a5232;
const KT_LEATHER: u32 = 0x6b4a28;
const KT_ROPE: u32 = 0x9a8060;
const KT_LASH: u32 = 0xb09a72;

fn bx(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w, h, d))
}
fn cy(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl(rt, rb, h, seg))
}
fn cy_open(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl_open(rt, rb, h, seg))
}
fn cn(r: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cone(r, h, seg))
}
fn v3(x: f64, y: f64, z: f64) -> Vec3 {
    Vec3::new(x, y, z)
}

// `getKZ*` (`kamien-zulu-taran-opus5.ts:327-371`)
fn kz_torso() -> Geo {
    bx(KZ_TORSO_W, KZ_TORSO_H, KZ_TORSO_D)
}
fn kz_chest() -> Geo {
    bx(KZ_TORSO_W * 1.05, 0.068 * HEX_R, KZ_TORSO_D * 1.08)
}
fn kz_waist() -> Geo {
    bx(KZ_TORSO_W * 0.86, 0.052 * HEX_R, KZ_TORSO_D * 0.90)
}
fn kz_neck() -> Geo {
    bx(0.042 * HEX_R, KZ_NECK_H * 1.6, 0.042 * HEX_R)
}
fn kz_head() -> Geo {
    bx(KZ_HEAD_S, KZ_HEAD_S, KZ_HEAD_S)
}
fn kz_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn kz_nose() -> Geo {
    bx(0.024 * HEX_R, 0.024 * HEX_R, 0.016 * HEX_R)
}
fn kz_eye() -> Geo {
    bx(0.020 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn kz_thigh() -> Geo {
    bx(0.056 * HEX_R, KZ_THIGH_L, 0.060 * HEX_R)
}
fn kz_shin() -> Geo {
    bx(0.038 * HEX_R, KZ_SHIN_L, 0.042 * HEX_R)
}
fn kz_sole() -> Geo {
    bx(0.046 * HEX_R, 0.018 * HEX_R, 0.078 * HEX_R)
}
fn kz_toes() -> Geo {
    bx(0.044 * HEX_R, 0.014 * HEX_R, 0.024 * HEX_R)
}
fn kz_hair() -> Geo {
    cy(0.056 * HEX_R, 0.070 * HEX_R, 0.052 * HEX_R, 8)
}
fn kz_ring() -> Geo {
    cy(0.062 * HEX_R, 0.062 * HEX_R, 0.014 * HEX_R, 8)
}
fn kz_band() -> Geo {
    cy(0.072 * HEX_R, 0.076 * HEX_R, 0.030 * HEX_R, 8)
}
fn kz_band_tag() -> Geo {
    bx(0.052 * HEX_R, 0.020 * HEX_R, 0.014 * HEX_R)
}
fn kz_ear_flap() -> Geo {
    bx(0.014 * HEX_R, 0.044 * HEX_R, 0.036 * HEX_R)
}
fn kz_feather() -> Geo {
    bx(0.017 * HEX_R, 0.082 * HEX_R, 0.009 * HEX_R)
}
fn kz_feat_tip() -> Geo {
    bx(0.011 * HEX_R, 0.030 * HEX_R, 0.007 * HEX_R)
}
fn kz_belt() -> Geo {
    bx(0.176 * HEX_R, 0.024 * HEX_R, 0.110 * HEX_R)
}
fn kz_isinene() -> Geo {
    bx(0.026 * HEX_R, 0.086 * HEX_R, 0.018 * HEX_R)
}
fn kz_bheshu() -> Geo {
    bx(0.118 * HEX_R, 0.104 * HEX_R, 0.020 * HEX_R)
}
fn kz_tuft() -> Geo {
    cy(0.016 * HEX_R, 0.028 * HEX_R, 0.044 * HEX_R, 6)
}
fn kz_tuft_end() -> Geo {
    cy(0.026 * HEX_R, 0.010 * HEX_R, 0.032 * HEX_R, 6)
}
fn kz_arm_band() -> Geo {
    cy(0.034 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R, 8)
}
fn kz_jav_shaft() -> Geo {
    cy(0.0085 * HEX_R, 0.0110 * HEX_R, 0.300 * HEX_R, 6)
}
fn kz_jav_butt() -> Geo {
    cy(0.0130 * HEX_R, 0.0090 * HEX_R, 0.022 * HEX_R, 6)
}
fn kz_jav_lash() -> Geo {
    cy(0.0135 * HEX_R, 0.0135 * HEX_R, 0.016 * HEX_R, 6)
}
fn kz_jav_blade() -> Geo {
    bx(0.030 * HEX_R, 0.052 * HEX_R, 0.010 * HEX_R)
}
fn kz_jav_tip() -> Geo {
    cn(0.016 * HEX_R, 0.040 * HEX_R, 4)
}
fn kz_sp_shaft() -> Geo {
    cy(0.0080 * HEX_R, 0.0092 * HEX_R, 0.292 * HEX_R, 5)
}
fn kz_sp_tip() -> Geo {
    cn(0.0115 * HEX_R, 0.040 * HEX_R, 4)
}
fn kz_sp_wrap() -> Geo {
    cy(0.0215 * HEX_R, 0.0215 * HEX_R, 0.016 * HEX_R, 8)
}
fn kz_shell() -> Geo {
    Geo::Prim(Prim::Kamien(KamienGeo::NguniShell {
        a: KZ_SH_A,
        b: KZ_SH_B,
        c: KZ_SH_C,
        t: KZ_SH_T,
        n: KZ_SH_N,
    }))
}
fn kz_face() -> Geo {
    Geo::Prim(Prim::Kamien(KamienGeo::NguniFace {
        a: KZ_SH_A * 0.94,
        b: KZ_SH_B * 0.94,
        c: KZ_SH_C * 0.82,
        n: KZ_SH_N,
    }))
}
fn kz_patch() -> Geo {
    Geo::Prim(Prim::Kamien(KamienGeo::Circle {
        r: 0.040 * HEX_R,
        segments: 7,
    }))
}
fn kz_umgobo() -> Geo {
    cy(0.0105 * HEX_R, 0.0125 * HEX_R, 0.428 * HEX_R, 6)
}
fn kz_umg_knot() -> Geo {
    cy_open(0.016 * HEX_R, 0.016 * HEX_R, 0.014 * HEX_R, 6)
}
fn kz_lace() -> Geo {
    bx(0.052 * HEX_R, 0.011 * HEX_R, 0.009 * HEX_R)
}
fn kz_lace_col() -> Geo {
    bx(0.034 * HEX_R, 0.300 * HEX_R, 0.008 * HEX_R)
}
fn kz_grip_bar() -> Geo {
    bx(0.014 * HEX_R, 0.070 * HEX_R, 0.016 * HEX_R)
}
fn kz_porpax() -> Geo {
    bx(0.062 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)
}

// `getKT*` (`:817-847`)
fn kt_runner() -> Geo {
    bx(0.046 * HEX_R, 0.042 * HEX_R, 0.376 * HEX_R)
}
fn kt_nose() -> Geo {
    bx(0.046 * HEX_R, 0.038 * HEX_R, 0.096 * HEX_R)
}
fn kt_cross() -> Geo {
    bx(0.300 * HEX_R, 0.026 * HEX_R, 0.032 * HEX_R)
}
fn kt_lash() -> Geo {
    cy_open(0.026 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R, 6)
}
fn kt_lash_sm() -> Geo {
    cy_open(0.020 * HEX_R, 0.020 * HEX_R, 0.016 * HEX_R, 6)
}
fn kt_leg() -> Geo {
    bx(0.030 * HEX_R, 0.300 * HEX_R, 0.030 * HEX_R)
}
fn kt_brace() -> Geo {
    bx(0.020 * HEX_R, 0.020 * HEX_R, 0.300 * HEX_R)
}
fn kt_ridge() -> Geo {
    bx(0.036 * HEX_R, 0.036 * HEX_R, 0.344 * HEX_R)
}
fn kt_log_a() -> Geo {
    cy(0.036 * HEX_R, 0.030 * HEX_R, 0.198 * HEX_R, 10)
}
fn kt_log_b() -> Geo {
    cy(0.047 * HEX_R, 0.036 * HEX_R, 0.190 * HEX_R, 10)
}
fn kt_bark() -> Geo {
    cy_open(0.040 * HEX_R, 0.040 * HEX_R, 0.026 * HEX_R, 8)
}
fn kt_stub() -> Geo {
    cy(0.008 * HEX_R, 0.014 * HEX_R, 0.042 * HEX_R, 5)
}
fn kt_char() -> Geo {
    cy(0.038 * HEX_R, 0.047 * HEX_R, 0.052 * HEX_R, 10)
}
fn kt_wedge() -> Geo {
    cy(0.024 * HEX_R, 0.050 * HEX_R, 0.062 * HEX_R, 4)
}
fn kt_chip() -> Geo {
    bx(0.022 * HEX_R, 0.020 * HEX_R, 0.030 * HEX_R)
}
fn kt_thong() -> Geo {
    bx(0.104 * HEX_R, 0.011 * HEX_R, 0.011 * HEX_R)
}
fn kt_cradle() -> Geo {
    cy_open(0.044 * HEX_R, 0.044 * HEX_R, 0.022 * HEX_R, 8)
}
fn kt_rope() -> Geo {
    bx(0.010 * HEX_R, 0.104 * HEX_R, 0.010 * HEX_R)
}
fn kt_post() -> Geo {
    bx(0.024 * HEX_R, 0.310 * HEX_R, 0.024 * HEX_R)
}
fn kt_roof() -> Geo {
    bx(0.196 * HEX_R, 0.014 * HEX_R, 0.176 * HEX_R)
}
fn kt_roof_rdg() -> Geo {
    bx(0.034 * HEX_R, 0.028 * HEX_R, 0.362 * HEX_R)
}
fn kt_batten() -> Geo {
    cy(0.008 * HEX_R, 0.008 * HEX_R, 0.190 * HEX_R, 5)
}
fn kt_drape() -> Geo {
    bx(0.220 * HEX_R, 0.086 * HEX_R, 0.012 * HEX_R)
}
fn kt_side_flap() -> Geo {
    bx(0.012 * HEX_R, 0.062 * HEX_R, 0.160 * HEX_R)
}
fn kt_handle() -> Geo {
    cy(0.012 * HEX_R, 0.014 * HEX_R, 0.120 * HEX_R, 6)
}
fn kt_drag_rope() -> Geo {
    bx(0.009 * HEX_R, 0.009 * HEX_R, 0.112 * HEX_R)
}
fn kt_mast() -> Geo {
    bx(0.013 * HEX_R, 0.130 * HEX_R, 0.013 * HEX_R)
}
fn kt_banner() -> Geo {
    bx(0.088 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)
}
fn kt_banner_bar() -> Geo {
    bx(0.098 * HEX_R, 0.010 * HEX_R, 0.010 * HEX_R)
}
fn kt_panel() -> Geo {
    bx(0.010 * HEX_R, 0.086 * HEX_R, 0.150 * HEX_R)
}
fn kt_log_wrap() -> Geo {
    cy_open(0.040 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R, 8)
}

const KZ_ARM_KIT: ArmIkKit = ArmIkKit {
    up: Geo::Prim(Prim::Box {
        w: 0.054 * HEX_R,
        h: KZ_UPARM_L,
        d: 0.054 * HEX_R,
    }),
    fore: Geo::Prim(Prim::Box {
        w: 0.040 * HEX_R,
        h: KZ_FOREARM_L,
        d: 0.040 * HEX_R,
    }),
    fist: Geo::Prim(Prim::Box {
        w: 0.046 * HEX_R,
        h: 0.046 * HEX_R,
        d: 0.048 * HEX_R,
    }),
    l1: KZ_UPARM_L,
    l2: KZ_FOREARM_L,
    fist_off: 0.012 * HEX_R,
};

/// `kzBuildLeg` (`:436-452`).
#[allow(clippy::too_many_arguments)]
fn kz_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_limb: MatId,
    m_foot: MatId,
    hip_y: f64,
) {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, kz_thigh(), m_limb, p, th_u, KZ_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, kz_shin(), m_limb, p, th_l, KZ_SHIN_L);
    let foot_z = p.z + 0.014 * HEX_R;
    m.add_mesh(g, kz_sole(), m_foot)
        .set_pos(sx, 0.009 * HEX_R, foot_z);
    m.add_mesh(g, kz_toes(), m_foot)
        .set_pos(sx, 0.007 * HEX_R, foot_z + 0.046 * HEX_R);
}

/// `kzAmashoba` (`:455-469`).
#[allow(clippy::too_many_arguments)]
fn kz_amashoba(
    m: &mut UnitModel,
    g: NodeId,
    x: f64,
    y: f64,
    z: f64,
    rz: f64,
    m_a: MatId,
    m_b: MatId,
    sc: f64,
) {
    m.add_mesh(g, kz_tuft(), m_a)
        .rot_z(rz)
        .set_scale_scalar(sc)
        .set_pos(x, y, z);
    m.add_mesh(g, kz_tuft_end(), m_b)
        .rot_z(rz)
        .set_scale_scalar(sc)
        .set_pos(
            x + js_sin(rz) * 0.030 * HEX_R * sc,
            y - 0.034 * HEX_R * sc,
            z,
        );
}

/// `buildZuluJavelineerOpus5` (`kamien-zulu-taran-opus5.ts:479-764`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_zulu_javelineer_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KZ_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(KZ_SKIN_DK, 0.05, 0.82);
    let m_bone = m.mat(KZ_BONE, 0.06, 0.62);
    let m_bone_dk = m.mat(KZ_BONE_DK, 0.05, 0.70);
    let m_sinew = m.mat(KZ_SINEW, 0.03, 0.88);
    let m_wood = m.mat(KZ_WOOD, 0.05, 0.85);
    let m_wood_lt = m.mat(KZ_WOOD_LT, 0.05, 0.82);
    let m_hide = m.mat(KZ_HIDE_BRN, 0.04, 0.90);
    let m_hide_dk = m.mat(KZ_HIDE_BRN_D, 0.04, 0.92);
    let m_white = m.mat(KZ_HIDE_WHT, 0.03, 0.92);
    let m_black = m.mat(KZ_HIDE_BLK, 0.04, 0.90);
    let m_fur = m.mat(KZ_FUR_DK, 0.04, 0.92);
    let m_fur_lt = m.mat(KZ_FUR_LT, 0.05, 0.88);
    let m_hair = m.mat(KZ_HAIR_DK, 0.04, 0.90);
    let m_loin = m.mat(KZ_LOIN_DK, 0.05, 0.88);
    let m_owner = m.mat(owner, 0.10, 0.68);

    let hip = KZ_HIP_Y - 0.014 * HEX_R;

    m.add_mesh(g, kz_torso(), m_skin)
        .set_pos(0.0, KZ_TORSO_CTR, 0.0);
    m.add_mesh(g, kz_chest(), m_skin)
        .set_pos(0.0, KZ_TORSO_TOP - 0.036 * HEX_R, 0.0);
    m.add_mesh(g, kz_waist(), m_skin)
        .set_pos(0.0, KZ_TORSO_BOT + 0.024 * HEX_R, 0.0);
    m.add_mesh(g, kz_neck(), m_skin)
        .set_pos(0.0, KZ_TORSO_TOP + KZ_NECK_H * 0.5, 0.0);

    m.add_mesh(g, kz_head(), m_skin)
        .set_pos(0.0, KZ_HEAD_CTR, 0.0);
    m.add_mesh(g, kz_jaw(), m_skin_dk)
        .set_pos(0.0, KZ_HEAD_CTR - KZ_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, kz_nose(), m_skin).set_pos(
        0.0,
        KZ_HEAD_CTR - 0.004 * HEX_R,
        KZ_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, kz_eye(), m_hair).set_pos(
            sx * 0.026 * HEX_R,
            KZ_HEAD_CTR + 0.016 * HEX_R,
            KZ_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
    }

    m.add_mesh(g, kz_hair(), m_hair)
        .set_pos(0.0, KZ_HEAD_TOP - 0.008 * HEX_R, 0.0);
    m.add_mesh(g, kz_ring(), m_hair)
        .set_pos(0.0, KZ_HEAD_TOP + 0.016 * HEX_R, 0.0);
    m.add_mesh(g, kz_band(), m_fur)
        .set_pos(0.0, KZ_HEAD_CTR + 0.042 * HEX_R, 0.0);
    m.add_mesh(g, kz_band_tag(), m_owner)
        .set_pos(0.0, KZ_HEAD_CTR + 0.042 * HEX_R, 0.070 * HEX_R);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, kz_ear_flap(), m_fur)
            .rot_z(sx * 0.20)
            .set_pos(
                sx * 0.074 * HEX_R,
                KZ_HEAD_CTR + 0.014 * HEX_R,
                0.004 * HEX_R,
            );
    }
    for sx in [-1.0_f64, 0.0, 1.0] {
        let y0 = KZ_HEAD_TOP + (if sx == 0.0 { 0.068 } else { 0.054 }) * HEX_R;
        m.add_mesh(g, kz_feather(), m_white)
            .rot_z(-sx * 0.20)
            .rot_x(-0.10)
            .set_pos(sx * 0.030 * HEX_R, y0, -0.010 * HEX_R);
        m.add_mesh(g, kz_feat_tip(), m_white)
            .rot_z(-sx * 0.20)
            .rot_x(-0.10)
            .set_pos(sx * 0.041 * HEX_R, y0 + 0.054 * HEX_R, -0.016 * HEX_R);
    }

    m.add_mesh(g, kz_belt(), m_fur_lt)
        .set_pos(0.0, KZ_TORSO_BOT - 0.006 * HEX_R, 0.0);
    for sx in [-1.5_f64, -0.5, 0.5, 1.5] {
        let mtl = if sx < 0.0 { m_fur } else { m_fur_lt };
        m.add_mesh(g, kz_isinene(), mtl).rot_z(sx * 0.05).set_pos(
            sx * 0.028 * HEX_R,
            KZ_TORSO_BOT - 0.060 * HEX_R,
            KZ_TORSO_D * 0.5 + 0.004 * HEX_R,
        );
    }
    m.add_mesh(g, kz_bheshu(), m_loin).rot_x(-0.14).set_pos(
        0.0,
        KZ_TORSO_BOT - 0.056 * HEX_R,
        -(KZ_TORSO_D * 0.5 + 0.012 * HEX_R),
    );

    kz_build_leg(&mut m, g, KZ_HIP_X, 0.62, 0.36, m_skin, m_skin_dk, hip);
    kz_build_leg(&mut m, g, -KZ_HIP_X, -0.55, -0.22, m_skin, m_skin_dk, hip);
    kz_amashoba(
        &mut m,
        g,
        KZ_HIP_X,
        0.118 * HEX_R,
        0.086 * HEX_R,
        0.10,
        m_white,
        m_white,
        0.90,
    );
    kz_amashoba(
        &mut m,
        g,
        -KZ_HIP_X,
        0.118 * HEX_R,
        -0.072 * HEX_R,
        -0.10,
        m_white,
        m_white,
        0.90,
    );

    // right (-X): swing, javelin on the hand axis
    let arm_r = arm_ik(
        &mut m,
        g,
        &KZ_ARM_KIT,
        v3(-KZ_SHLD_X, KZ_SHLD_Y, 0.0),
        v3(-0.150 * HEX_R, 0.560 * HEX_R, -0.058 * HEX_R),
        v3(-0.85, 0.10, -0.52),
        m_skin,
        m_skin,
        Some(m_skin_dk),
    );
    let jav_d = v3(0.05, -0.07, 0.996).normalize();
    let grip = arm_r.hand;
    let at_j = |d: f64| grip.plus(jav_d.scale(d * HEX_R));
    let q_jav = quat_from_unit_vectors(Y_UP, jav_d);

    m.add_mesh(g, kz_jav_shaft(), m_wood)
        .set_pos_v(at_j(0.088))
        .quaternion = q_jav;
    m.add_mesh(g, kz_jav_butt(), m_wood)
        .set_pos_v(at_j(-0.072))
        .quaternion = q_jav;
    for d in [0.216, 0.244] {
        m.add_mesh(g, kz_jav_lash(), m_sinew)
            .set_pos_v(at_j(d))
            .quaternion = q_jav;
    }
    m.add_mesh(g, kz_jav_blade(), m_bone)
        .set_pos_v(at_j(0.278))
        .quaternion = q_jav;
    let n = m.add_mesh(g, kz_jav_blade(), m_bone_dk);
    n.quaternion = q_jav;
    n.set_scale(0.34, 0.94, 1.30);
    n.set_pos_v(at_j(0.278));
    let j_tip = m.add_mesh_id(g, kz_jav_tip(), m_bone);
    copy_quat_then_add_rot_y(&mut m, j_tip, q_jav, PI / 4.0);
    m.node(j_tip).set_pos_v(at_j(0.322));
    kz_amashoba(
        &mut m,
        g,
        -KZ_SHLD_X - 0.014 * HEX_R,
        KZ_SHLD_Y + 0.020 * HEX_R,
        0.0,
        -0.30,
        m_white,
        m_white,
        1.0,
    );
    m.add_mesh(g, kz_arm_band(), m_owner).rot_z(-0.95).set_pos(
        -KZ_SHLD_X - 0.026 * HEX_R,
        KZ_SHLD_Y - 0.024 * HEX_R,
        -0.012 * HEX_R,
    );

    // left (+X): Nguni shield
    let arm_l = arm_ik(
        &mut m,
        g,
        &KZ_ARM_KIT,
        v3(KZ_SHLD_X, KZ_SHLD_Y, 0.0),
        v3(0.150 * HEX_R, 0.300 * HEX_R, 0.100 * HEX_R),
        v3(0.85, -0.20, 0.15),
        m_skin,
        m_skin,
        None,
    );
    kz_amashoba(
        &mut m,
        g,
        KZ_SHLD_X + 0.014 * HEX_R,
        KZ_SHLD_Y + 0.018 * HEX_R,
        0.0,
        0.30,
        m_white,
        m_white,
        1.0,
    );

    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            arm_l.hand.x + 0.012 * HEX_R,
            arm_l.hand.y + 0.052 * HEX_R,
            arm_l.hand.z + 0.034 * HEX_R,
        )
        .rot_y(-0.18)
        .rot_z(0.05);
    m.add_mesh(sh, kz_shell(), m_hide_dk);
    m.add_mesh(sh, kz_face(), m_hide)
        .set_pos(0.0, 0.0, 0.010 * HEX_R);
    let patches: [(f64, f64, f64, f64, f64, bool); 6] = [
        (-0.040, 0.104, 0.34, 0.72, 1.05, false),
        (0.044, 0.030, -0.28, 0.98, 0.74, false),
        (-0.030, -0.058, 0.52, 0.86, 1.02, false),
        (0.028, -0.132, -0.40, 0.66, 0.80, false),
        (0.012, 0.152, 0.18, 0.52, 0.58, true),
        (-0.052, -0.016, -0.60, 0.44, 0.66, true),
    ];
    for (px, py, rz, sx, sy, blk) in patches {
        m.add_mesh(sh, kz_patch(), if blk { m_black } else { m_white })
            .rot_z(rz)
            .set_scale(sx, sy, 1.0)
            .set_pos(px * HEX_R, py * HEX_R, 0.018 * HEX_R);
    }
    m.add_mesh(sh, kz_lace_col(), m_owner)
        .set_pos(0.0, 0.006 * HEX_R, 0.022 * HEX_R);
    for i in 0..8u32 {
        let ly = (-0.128 + f64::from(i) * 0.037) * HEX_R;
        let mtl = if i % 2 == 0 { m_fur_lt } else { m_hide_dk };
        m.add_mesh(sh, kz_lace(), mtl)
            .rot_z((if i % 2 == 0 { 1.0 } else { -1.0 }) * 0.24)
            .set_pos(0.0, ly, 0.028 * HEX_R);
    }
    m.add_mesh(sh, kz_umgobo(), m_wood)
        .set_pos(0.0, -0.016 * HEX_R, -0.022 * HEX_R);
    for ky in [0.120, -0.120] {
        m.add_mesh(sh, kz_umg_knot(), m_fur_lt)
            .rot_x(PI / 2.0)
            .set_pos(0.0, ky * HEX_R, -0.022 * HEX_R);
    }
    m.add_mesh(sh, kz_porpax(), m_fur_lt)
        .set_pos(0.0, 0.014 * HEX_R, -0.036 * HEX_R);
    m.add_mesh(sh, kz_grip_bar(), m_wood_lt)
        .set_pos(0.0, -0.036 * HEX_R, -0.038 * HEX_R);
    m.node(sh).set_scale_scalar(0.72);
    m.attach(g, sh);

    // bundle of 3 spare javelins
    let sp_d = v3(0.20, 0.94, -0.28).normalize();
    let q_sp = quat_from_unit_vectors(Y_UP, sp_d);
    let sp_p1 = sp_d.cross(Y_UP).normalize();
    let sp_p2 = sp_d.cross(sp_p1).normalize();
    let sp_base = v3(
        arm_l.hand.x + 0.090 * HEX_R,
        arm_l.hand.y - 0.010 * HEX_R,
        arm_l.hand.z - 0.050 * HEX_R,
    );
    let sp_r = 0.0092 * HEX_R;
    for ang in [PI / 2.0, PI * 7.0 / 6.0, PI * 11.0 / 6.0] {
        let off = sp_p1
            .scale(js_cos(ang) * sp_r)
            .plus(sp_p2.scale(js_sin(ang) * sp_r));
        let o = sp_base.plus(off);
        m.add_mesh(g, kz_sp_shaft(), m_wood)
            .set_pos_v(o.plus(sp_d.scale(0.082 * HEX_R)))
            .quaternion = q_sp;
        let tp = m.add_mesh_id(g, kz_sp_tip(), m_bone_dk);
        copy_quat_then_add_rot_y(&mut m, tp, q_sp, PI / 4.0);
        m.node(tp).set_pos_v(o.plus(sp_d.scale(0.248 * HEX_R)));
    }
    for d in [0.048, 0.186] {
        m.add_mesh(g, kz_sp_wrap(), m_owner)
            .set_pos_v(sp_base.plus(sp_d.scale(d * HEX_R)))
            .quaternion = q_sp;
    }
    m
}

/// Lashing axis of `ktLashing` (the web helper also accepts `'x'`, which
/// `buildBatteringRamOpus5` never passes).
#[derive(Clone, Copy, PartialEq, Eq)]
enum Axis {
    Y,
    Z,
}

/// `ktLashing` (`:850-859`).
#[allow(clippy::too_many_arguments)]
fn kt_lashing(
    m: &mut UnitModel,
    g: NodeId,
    mtl: MatId,
    x: f64,
    y: f64,
    z: f64,
    axis: Axis,
    small: bool,
) {
    let n = m.add_mesh(g, if small { kt_lash_sm() } else { kt_lash() }, mtl);
    if axis == Axis::Z {
        n.rot_x(PI / 2.0);
    }
    n.set_pos(x * HEX_R, y * HEX_R, z * HEX_R);
}

/// `buildBatteringRamOpus5` (`kamien-zulu-taran-opus5.ts:869-1091`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_battering_ram_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(KT_WOOD, 0.06, 0.82);
    let m_dk_wood = m.mat(KT_WOOD_DK, 0.04, 0.88);
    let m_log = m.mat(KT_LOG, 0.05, 0.86);
    let m_log_dk = m.mat(KT_LOG_DK, 0.04, 0.90);
    let m_bark = m.mat(KT_BARK, 0.03, 0.94);
    let m_char = m.mat(KT_CHAR, 0.05, 0.96);
    let m_stone = m.mat(KT_STONE, 0.08, 0.85);
    let m_stone_d = m.mat(KT_STONE_DK, 0.08, 0.88);
    let m_hide_a = m.mat(KT_HIDE_A, 0.04, 0.92);
    let m_hide_b = m.mat(KT_HIDE_B, 0.04, 0.92);
    let m_leath = m.mat(KT_LEATHER, 0.05, 0.88);
    let m_rope = m.mat(KT_ROPE, 0.04, 0.90);
    let m_lash = m.mat(KT_LASH, 0.03, 0.92);
    let m_owner = m.mat(owner, 0.12, 0.70);

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, kt_runner(), m_dk_wood).set_pos(
            sx * 0.128 * HEX_R,
            0.021 * HEX_R,
            -0.012 * HEX_R,
        );
        m.add_mesh(g, kt_nose(), m_dk_wood).rot_x(-0.46).set_pos(
            sx * 0.128 * HEX_R,
            0.0393 * HEX_R,
            0.214 * HEX_R,
        );
    }

    for cz in [-0.172, -0.012, 0.144] {
        m.add_mesh(g, kt_cross(), m_wood)
            .set_pos(0.0, 0.056 * HEX_R, cz * HEX_R);
        for sx in [-1.0, 1.0] {
            kt_lashing(&mut m, g, m_lash, sx * 0.128, 0.050, cz, Axis::Y, true);
        }
    }

    for sz in [-0.120, 0.108] {
        for s in [-1.0, 1.0] {
            m.add_mesh(g, kt_leg(), m_wood).rot_z(-s * 0.44).set_pos(
                s * 0.064 * HEX_R,
                0.216 * HEX_R,
                sz * HEX_R,
            );
            kt_lashing(&mut m, g, m_lash, s * 0.128, 0.072, sz, Axis::Y, true);
        }
        kt_lashing(&mut m, g, m_lash, 0.0, 0.344, sz, Axis::Z, false);
    }
    m.add_mesh(g, kt_ridge(), m_dk_wood)
        .set_pos(0.0, 0.356 * HEX_R, -0.008 * HEX_R);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, kt_brace(), m_wood).rot_x(0.52).set_pos(
            s * 0.098 * HEX_R,
            0.212 * HEX_R,
            -0.010 * HEX_R,
        );
    }

    let log_y = 0.208 * HEX_R;
    m.add_mesh(g, kt_log_a(), m_log)
        .rot_x(PI / 2.0)
        .set_pos(0.0, log_y, -0.072 * HEX_R);
    m.add_mesh(g, kt_log_b(), m_log)
        .rot_x(PI / 2.0)
        .set_pos(0.0, log_y, 0.122 * HEX_R);
    m.add_mesh(g, kt_log_a(), m_log_dk)
        .rot_x(PI / 2.0)
        .set_scale(0.98, 1.0, 0.42)
        .set_pos(0.0, log_y - 0.020 * HEX_R, -0.072 * HEX_R);
    m.add_mesh(g, kt_bark(), m_bark)
        .rot_x(PI / 2.0)
        .set_pos(0.0, log_y, 0.026 * HEX_R);
    for (sx, sy, sz, rz) in [
        (1.0, 0.6, -0.136, 1.10),
        (-1.0, 0.4, 0.034, -1.24),
        (0.3, 1.0, -0.018, 0.30),
    ] {
        m.add_mesh(g, kt_stub(), m_log_dk)
            .rot_z(rz)
            .rot_x(sy * 0.30)
            .set_pos(sx * 0.036 * HEX_R, log_y + sy * 0.024 * HEX_R, sz * HEX_R);
    }

    m.add_mesh(g, kt_char(), m_char)
        .rot_x(-PI / 2.0)
        .set_pos(0.0, log_y, 0.230 * HEX_R);
    m.add_mesh(g, kt_wedge(), m_stone)
        .rot_x(-PI / 2.0)
        .rot_z(PI / 4.0)
        .set_pos(0.0, log_y, 0.282 * HEX_R);
    for (cx, cy_) in [(1.0, 0.6), (-1.0, -0.5)] {
        m.add_mesh(g, kt_chip(), m_stone_d).rot_z(cx * 0.4).set_pos(
            cx * 0.026 * HEX_R,
            log_y + cy_ * 0.022 * HEX_R,
            0.274 * HEX_R,
        );
    }
    for rz in [0.72, -0.72] {
        for dz in [0.214, 0.252] {
            m.add_mesh(g, kt_thong(), m_leath)
                .rot_z(rz)
                .set_pos(0.0, log_y, dz * HEX_R);
        }
    }
    for dz in [0.204, 0.258] {
        m.add_mesh(g, kt_log_wrap(), m_leath)
            .rot_x(PI / 2.0)
            .set_scale_scalar(1.12)
            .set_pos(0.0, log_y, dz * HEX_R);
    }

    for cz in [-0.080, 0.094] {
        m.add_mesh(g, kt_cradle(), m_leath)
            .rot_x(PI / 2.0)
            .set_pos(0.0, log_y, cz * HEX_R);
    }
    for (rz, tilt) in [(-0.092, 0.30), (-0.028, 0.36), (0.068, 0.44), (0.126, 0.50)] {
        for s in [-1.0, 1.0] {
            m.add_mesh(g, kt_rope(), m_rope)
                .rot_x(tilt)
                .rot_z(s * 0.10)
                .set_pos(s * 0.014 * HEX_R, 0.288 * HEX_R, (rz + 0.014) * HEX_R);
        }
    }
    for dz in [-0.136, 0.054] {
        m.add_mesh(g, kt_log_wrap(), m_owner)
            .rot_x(PI / 2.0)
            .set_pos(0.0, log_y, dz * HEX_R);
    }

    for sx in [-0.146, 0.146] {
        for sz in [-0.142, 0.136] {
            m.add_mesh(g, kt_post(), m_wood)
                .set_pos(sx * HEX_R, 0.226 * HEX_R, sz * HEX_R);
            kt_lashing(&mut m, g, m_lash, sx, 0.372, sz, Axis::Y, true);
        }
    }
    for s in [-1.0_f64, 1.0] {
        for sz in [-0.084_f64, 0.084] {
            let hide = if s * sz > 0.0 { m_hide_a } else { m_hide_b };
            m.add_mesh(g, kt_roof(), hide).rot_z(-s * 0.520).set_pos(
                s * 0.086 * HEX_R,
                0.432 * HEX_R,
                sz * HEX_R,
            );
        }
    }
    m.add_mesh(g, kt_roof_rdg(), m_dk_wood)
        .set_pos(0.0, 0.478 * HEX_R, 0.0);
    for s in [-1.0, 1.0] {
        for sz in [-0.118, 0.118] {
            m.add_mesh(g, kt_batten(), m_log_dk)
                .rot_z(PI / 2.0 - s * 0.520)
                .set_pos(s * 0.086 * HEX_R, 0.440 * HEX_R, sz * HEX_R);
        }
    }
    m.add_mesh(g, kt_drape(), m_hide_b)
        .rot_x(0.16)
        .set_pos(0.0, 0.352 * HEX_R, -0.166 * HEX_R);
    m.add_mesh(g, kt_drape(), m_hide_a)
        .rot_x(-0.16)
        .set_scale(0.92, 0.52, 1.0)
        .set_pos(0.0, 0.372 * HEX_R, 0.174 * HEX_R);
    m.add_mesh(g, kt_side_flap(), m_hide_b)
        .set_pos(-0.152 * HEX_R, 0.348 * HEX_R, -0.012 * HEX_R);

    for s in [-1.0, 1.0] {
        m.add_mesh(g, kt_handle(), m_wood).rot_x(-0.50).set_pos(
            s * 0.100 * HEX_R,
            0.132 * HEX_R,
            -0.184 * HEX_R,
        );
        kt_lashing(&mut m, g, m_lash, s * 0.100, 0.080, -0.162, Axis::Y, true);
    }
    for s in [-1.0, 1.0] {
        m.add_mesh(g, kt_drag_rope(), m_rope)
            .rot_x(0.30)
            .rot_y(s * 0.16)
            .set_pos(s * 0.118 * HEX_R, 0.046 * HEX_R, 0.244 * HEX_R);
    }

    m.add_mesh(g, kt_mast(), m_wood)
        .set_pos(0.0, 0.545 * HEX_R, -0.156 * HEX_R);
    m.add_mesh(g, kt_banner_bar(), m_wood)
        .set_pos(0.044 * HEX_R, 0.598 * HEX_R, -0.156 * HEX_R);
    m.add_mesh(g, kt_banner(), m_owner)
        .set_pos(0.046 * HEX_R, 0.562 * HEX_R, -0.156 * HEX_R);
    m.add_mesh(g, kt_panel(), m_owner)
        .set_pos(0.152 * HEX_R, 0.340 * HEX_R, -0.012 * HEX_R);
    m
}
