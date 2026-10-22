//! Port of `render/braz-miecznik-opus5.ts` (`edb8fb56`):
//! `buildMiecznikBrazOpus5` (Wojownik z mieczem i tarczą / Swordsman, Bronze).
//!
//! The lazily created `getBM*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::geo::BladeProfile;
use super::kit::{add_scaled, blade, bx, cn, cy, cy_open, dir_down, rot3, seg, sph_full, v3, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`braz-miecznik-opus5.ts:142-165`)
const BM_SKIN: u32 = 0xc08a54;
const BM_SKIN_DK: u32 = 0x9c6c3e;
const BM_TUNIC: u32 = 0xcdb684;
const BM_TUNIC_DK: u32 = 0xa8925f;
const BM_LEATHER: u32 = 0x6b4a28;
const BM_LEATHER_DK: u32 = 0x4a331b;
const BM_LEATHER_LT: u32 = 0x8a6a42;
const BM_WOOD: u32 = 0x7a5c3a;
const BM_WOOD_DK: u32 = 0x5c452c;
const BM_BONE: u32 = 0xe6ddc2;
const BM_SINEW: u32 = 0xd8cfb4;
const BM_BRONZE: u32 = 0xcf9234;
const BM_BRONZE_LT: u32 = 0xdaa84e;
const BM_HAIR: u32 = 0x3c2a17;
const BM_EYE: u32 = 0x14100c;
const BM_SHIELD_HIDE: u32 = 0x8a6a3e;

// ── wymiary sylwetki (`:168-200`)
const BM_HIP_Y: f64 = 0.208 * HEX_R;
const BM_TORSO_W: f64 = 0.180 * HEX_R;
const BM_TORSO_H: f64 = 0.205 * HEX_R;
const BM_TORSO_D: f64 = 0.100 * HEX_R;
const BM_TORSO_BOT: f64 = 0.240 * HEX_R;
const BM_TORSO_CTR: f64 = BM_TORSO_BOT + BM_TORSO_H * 0.5;
const BM_TORSO_TOP: f64 = BM_TORSO_BOT + BM_TORSO_H;
const BM_NECK_H: f64 = 0.062 * HEX_R;
const BM_HEAD_S: f64 = 0.122 * HEX_R;
const BM_HEAD_D: f64 = 0.106 * HEX_R;
const BM_HEAD_CTR: f64 = BM_TORSO_TOP + BM_NECK_H + BM_HEAD_S * 0.5;
const BM_HEAD_TOP: f64 = BM_TORSO_TOP + BM_NECK_H + BM_HEAD_S;
const BM_SHLD_X: f64 = BM_TORSO_W * 0.5 + 0.030 * HEX_R;
const BM_SHLD_Y: f64 = BM_TORSO_TOP - 0.024 * HEX_R;
const BM_HIP_X: f64 = 0.052 * HEX_R;
const BM_THIGH_L: f64 = 0.104 * HEX_R;
const BM_SHIN_L: f64 = 0.096 * HEX_R;
const BM_UPARM_L: f64 = 0.100 * HEX_R;
const BM_FOREARM_L: f64 = 0.092 * HEX_R;
const BM_FIGURE_SCALE: f64 = 1.166;

// ── geometrie-singletony (`:261-318`, `:354-356`)
fn g_torso() -> Geo {
    bx(BM_TORSO_W, BM_TORSO_H, BM_TORSO_D)
}
fn g_cuirass() -> Geo {
    bx(0.146 * HEX_R, 0.114 * HEX_R, 0.022 * HEX_R)
}
fn g_strap() -> Geo {
    bx(0.026 * HEX_R, 0.118 * HEX_R, 0.014 * HEX_R)
}
fn g_neck() -> Geo {
    bx(0.050 * HEX_R, BM_NECK_H * 1.10, 0.048 * HEX_R)
}
fn g_collar() -> Geo {
    bx(0.104 * HEX_R, 0.020 * HEX_R, 0.086 * HEX_R)
}
fn g_trap() -> Geo {
    bx(0.056 * HEX_R, 0.024 * HEX_R, 0.076 * HEX_R)
}
fn g_head() -> Geo {
    bx(BM_HEAD_S, BM_HEAD_S, 0.106 * HEX_R)
}
fn g_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn g_nose() -> Geo {
    bx(0.019 * HEX_R, 0.026 * HEX_R, 0.017 * HEX_R)
}
fn g_ear() -> Geo {
    bx(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn g_brow() -> Geo {
    bx(0.104 * HEX_R, 0.014 * HEX_R, 0.016 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.074 * HEX_R, 0.038 * HEX_R, 0.030 * HEX_R)
}
fn g_hair_top() -> Geo {
    bx(0.126 * HEX_R, 0.028 * HEX_R, 0.126 * HEX_R)
}
fn g_hair_back() -> Geo {
    bx(0.124 * HEX_R, 0.096 * HEX_R, 0.024 * HEX_R)
}
fn g_cap() -> Geo {
    cy(0.046 * HEX_R, 0.068 * HEX_R, 0.066 * HEX_R, 10)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, BM_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, BM_SHIN_L, 0.042 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.046 * HEX_R, 0.016 * HEX_R, 0.084 * HEX_R)
}
fn g_toes() -> Geo {
    bx(0.042 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R)
}
fn g_ank_strap() -> Geo {
    bx(0.050 * HEX_R, 0.020 * HEX_R, 0.014 * HEX_R)
}
fn g_foot_strap() -> Geo {
    bx(0.048 * HEX_R, 0.014 * HEX_R, 0.010 * HEX_R)
}
fn g_heel_strap() -> Geo {
    bx(0.044 * HEX_R, 0.024 * HEX_R, 0.012 * HEX_R)
}
fn g_shin_bind() -> Geo {
    bx(0.042 * HEX_R, 0.016 * HEX_R, 0.046 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, BM_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, BM_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_delt() -> Geo {
    bx(0.046 * HEX_R, 0.038 * HEX_R, 0.062 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.192 * HEX_R, 0.028 * HEX_R, 0.114 * HEX_R)
}
fn g_buckle() -> Geo {
    bx(0.028 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)
}
fn g_pouch() -> Geo {
    bx(0.040 * HEX_R, 0.046 * HEX_R, 0.026 * HEX_R)
}
fn g_apron() -> Geo {
    bx(0.086 * HEX_R, 0.072 * HEX_R, 0.013 * HEX_R)
}
fn g_tasset() -> Geo {
    bx(0.026 * HEX_R, 0.060 * HEX_R, 0.011 * HEX_R)
}
fn g_sideburn() -> Geo {
    bx(0.013 * HEX_R, 0.040 * HEX_R, 0.018 * HEX_R)
}
fn g_lace() -> Geo {
    bx(0.018 * HEX_R, 0.090 * HEX_R, 0.011 * HEX_R)
}
fn g_rivet() -> Geo {
    bx(0.012 * HEX_R, 0.012 * HEX_R, 0.010 * HEX_R)
}
fn g_bracer() -> Geo {
    bx(0.048 * HEX_R, 0.044 * HEX_R, 0.048 * HEX_R)
}
fn g_sheath() -> Geo {
    bx(0.026 * HEX_R, 0.190 * HEX_R, 0.015 * HEX_R)
}
fn g_sheath_top() -> Geo {
    bx(0.032 * HEX_R, 0.020 * HEX_R, 0.019 * HEX_R)
}
fn g_sheath_tip() -> Geo {
    bx(0.018 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)
}
fn g_frog() -> Geo {
    bx(0.022 * HEX_R, 0.036 * HEX_R, 0.012 * HEX_R)
}
fn g_grip() -> Geo {
    cy(0.013 * HEX_R, 0.015 * HEX_R, 0.040 * HEX_R, 6)
}
fn g_grip_wrap() -> Geo {
    cy(0.016 * HEX_R, 0.016 * HEX_R, 0.010 * HEX_R, 6)
}
fn g_pommel() -> Geo {
    sph_full(0.017 * HEX_R, 7, 5)
}
fn g_guard() -> Geo {
    bx(0.056 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R)
}
fn g_blade_edge() -> Geo {
    bx(0.006 * HEX_R, 0.094 * HEX_R, 0.030 * HEX_R)
}
fn g_sh_field() -> Geo {
    cy(0.120 * HEX_R, 0.120 * HEX_R, 0.020 * HEX_R, 14)
}
fn g_sh_rim() -> Geo {
    cy_open(0.128 * HEX_R, 0.128 * HEX_R, 0.018 * HEX_R, 14)
}
fn g_sh_boss() -> Geo {
    cn(0.040 * HEX_R, 0.030 * HEX_R, 9)
}
fn g_sh_boss_ring() -> Geo {
    cy(0.050 * HEX_R, 0.050 * HEX_R, 0.008 * HEX_R, 12)
}
fn g_sh_stitch() -> Geo {
    bx(0.024 * HEX_R, 0.015 * HEX_R, 0.032 * HEX_R)
}
fn g_sh_grip() -> Geo {
    bx(0.058 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R)
}
fn g_sh_loop() -> Geo {
    bx(0.074 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)
}
fn g_blade() -> Geo {
    blade(
        BladeProfile::Rapier,
        0.170 * HEX_R,
        0.034 * HEX_R,
        0.020 * HEX_R,
    )
}

/// `bmBuildLeg` (`:381-412`).
#[allow(clippy::too_many_arguments)]
fn bm_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_skin: MatId,
    m_leath: MatId,
    m_leath_dk: MatId,
    hip_y: f64,
) {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_skin, p, th_u, BM_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_skin, p, th_l, BM_SHIN_L);
    let foot_z = p.z + 0.014 * HEX_R;
    m.add_mesh(g, g_sole(), m_leath)
        .set_pos(sx, 0.008 * HEX_R, foot_z);
    m.add_mesh(g, g_toes(), m_skin)
        .set_pos(sx, 0.007 * HEX_R, foot_z + 0.040 * HEX_R);
    m.add_mesh(g, g_ank_strap(), m_leath_dk)
        .rot_x(PI / 2.0)
        .set_pos(sx, 0.034 * HEX_R, foot_z - 0.010 * HEX_R);
    m.add_mesh(g, g_foot_strap(), m_leath_dk)
        .rot_x(PI / 2.0)
        .set_pos(sx, 0.018 * HEX_R, foot_z + 0.014 * HEX_R);
    m.add_mesh(g, g_heel_strap(), m_leath_dk)
        .set_pos(sx, 0.026 * HEX_R, foot_z - 0.034 * HEX_R);
    m.add_mesh(g, g_shin_bind(), m_leath_dk)
        .set_pos(sx, 0.126 * HEX_R, 0.008 * HEX_R);
}

/// Result of `bmBuildArm`.
struct Arm {
    wrist: Vec3,
    axis: Vec3,
}

/// `bmBuildArm` (`:415-435`).
#[allow(clippy::too_many_arguments)]
fn bm_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> Arm {
    m.add_mesh(g, g_delt(), m_up).set_pos(
        sx * (BM_TORSO_W * 0.5 + 0.018 * HEX_R),
        BM_SHLD_Y - 0.016 * HEX_R,
        0.0,
    );
    let mut p = v3(sx, BM_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, BM_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, BM_FOREARM_L);
    let axis = dir_down(th_f);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, axis, 0.013 * HEX_R));
    }
    Arm { wrist, axis }
}

/// `bmBuildCore` (`:453-505`).
#[allow(clippy::too_many_arguments)]
fn bm_build_core(
    m: &mut UnitModel,
    g: NodeId,
    m_tunic: MatId,
    m_skin: MatId,
    m_skin_dk: MatId,
    m_eye: MatId,
    m_tunic_dk: MatId,
    m_collar: MatId,
) {
    m.add_mesh(g, g_torso(), m_tunic)
        .set_pos(0.0, BM_TORSO_CTR, 0.0);
    m.add_mesh(g, g_collar(), m_collar)
        .set_pos(0.0, BM_TORSO_TOP - 0.002 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_trap(), m_tunic_dk)
            .rot_z(sx * 0.44)
            .set_pos(sx * 0.060 * HEX_R, BM_TORSO_TOP - 0.024 * HEX_R, 0.0);
    }
    m.add_mesh(g, g_neck(), m_skin_dk)
        .set_pos(0.0, BM_TORSO_TOP + BM_NECK_H * 0.52, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, BM_HEAD_CTR, 0.0);
    m.add_mesh(g, g_jaw(), m_skin_dk)
        .set_pos(0.0, BM_HEAD_CTR - BM_HEAD_S * 0.30, 0.010 * HEX_R);
    m.add_mesh(g, g_nose(), m_skin).set_pos(
        0.0,
        BM_HEAD_CTR - 0.002 * HEX_R,
        BM_HEAD_D * 0.5 + 0.007 * HEX_R,
    );
    m.add_mesh(g, g_brow(), m_skin_dk).rot_x(0.12).set_pos(
        0.0,
        BM_HEAD_CTR + 0.030 * HEX_R,
        BM_HEAD_D * 0.5 + 0.003 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            sx * 0.026 * HEX_R,
            BM_HEAD_CTR + 0.012 * HEX_R,
            BM_HEAD_D * 0.5 + 0.002 * HEX_R,
        );
        m.add_mesh(g, g_ear(), m_skin_dk).set_pos(
            sx * (BM_HEAD_S * 0.5 + 0.004 * HEX_R),
            BM_HEAD_CTR - 0.006 * HEX_R,
            0.0,
        );
        m.add_mesh(g, g_sideburn(), m_skin_dk).set_pos(
            sx * (BM_HEAD_S * 0.5 + 0.002 * HEX_R),
            BM_HEAD_CTR - 0.030 * HEX_R,
            0.018 * HEX_R,
        );
    }
}

/// `buildMiecznikBrazOpus5(ownerColor)` (`braz-miecznik-opus5.ts:514-738`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_miecznik_braz_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(BM_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(BM_SKIN_DK, 0.05, 0.82);
    let m_tunic = m.mat(BM_TUNIC, 0.04, 0.86);
    let m_tunic_dk = m.mat(BM_TUNIC_DK, 0.04, 0.88);
    let m_leath = m.mat(BM_LEATHER, 0.06, 0.82);
    let m_leath_dk = m.mat(BM_LEATHER_DK, 0.06, 0.86);
    let m_leath_lt = m.mat(BM_LEATHER_LT, 0.06, 0.80);
    let m_wood = m.mat(BM_WOOD, 0.05, 0.85);
    let m_wood_dk = m.mat(BM_WOOD_DK, 0.05, 0.87);
    let m_bone = m.mat(BM_BONE, 0.05, 0.72);
    let m_sinew = m.mat(BM_SINEW, 0.03, 0.90);
    let m_bronze = m.mat(BM_BRONZE, 0.55, 0.40);
    let m_bronze_lt = m.mat(BM_BRONZE_LT, 0.60, 0.34);
    let m_hair = m.mat(BM_HAIR, 0.04, 0.90);
    let m_eye = m.mat(BM_EYE, 0.05, 0.86);
    let m_shield_hide = m.mat(BM_SHIELD_HIDE, 0.05, 0.84);
    let m_owner = m.mat(owner, 0.10, 0.70);

    let hip_y = BM_HIP_Y - 0.010 * HEX_R;

    bm_build_core(
        &mut m, g, m_tunic, m_skin, m_skin_dk, m_eye, m_tunic_dk, m_leath_dk,
    );

    // NAPIERŚNIK + SZELKI
    m.add_mesh(g, g_cuirass(), m_leath).set_pos(
        0.0,
        BM_TORSO_TOP - 0.086 * HEX_R,
        BM_TORSO_D * 0.5 + 0.011 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        let id = m.add_mesh_id(g, g_strap(), m_leath_lt);
        rot3(&mut m, id, -0.30, 0.0, sx * 0.20);
        m.node(id).set_pos(
            sx * 0.038 * HEX_R,
            BM_TORSO_TOP - 0.006 * HEX_R,
            0.010 * HEX_R,
        );
        m.add_mesh(g, g_rivet(), m_bronze).set_pos(
            sx * 0.052 * HEX_R,
            BM_TORSO_TOP - 0.048 * HEX_R,
            BM_TORSO_D * 0.5 + 0.020 * HEX_R,
        );
    }
    m.add_mesh(g, g_lace(), m_leath_dk).set_pos(
        0.0,
        BM_TORSO_TOP - 0.080 * HEX_R,
        BM_TORSO_D * 0.5 + 0.020 * HEX_R,
    );

    // TUNIKA
    m.add_mesh(g, g_skirt(), m_tunic)
        .set_pos(0.0, BM_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_foot_strap(), m_tunic_dk)
        .set_scale(1.6, 3.2, 1.0)
        .set_pos(
            0.032 * HEX_R,
            BM_TORSO_BOT - 0.030 * HEX_R,
            BM_TORSO_D * 0.5 + 0.010 * HEX_R,
        );

    // PAS
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
    m.add_mesh(g, g_buckle(), m_bone)
        .set_pos(0.0, 0.252 * HEX_R, BM_TORSO_D * 0.5 + 0.014 * HEX_R);
    m.add_mesh(g, g_pouch(), m_leath_dk)
        .set_pos(-0.072 * HEX_R, 0.222 * HEX_R, -0.028 * HEX_R);
    m.add_mesh(g, g_apron(), m_leath_lt).rot_x(-0.10).set_pos(
        0.0,
        BM_TORSO_BOT - 0.052 * HEX_R,
        BM_TORSO_D * 0.5 + 0.024 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_tasset(), m_leath_lt).rot_x(-0.08).set_pos(
            sx * 0.072 * HEX_R,
            BM_TORSO_BOT - 0.048 * HEX_R,
            BM_TORSO_D * 0.5 + 0.020 * HEX_R,
        );
    }

    // NOGI
    bm_build_leg(
        &mut m, g, BM_HIP_X, 0.54, 0.30, m_skin, m_leath, m_leath_dk, hip_y,
    );
    bm_build_leg(
        &mut m, g, -BM_HIP_X, -0.48, -0.16, m_skin, m_leath, m_leath_dk, hip_y,
    );

    // GŁOWA
    m.add_mesh(g, g_hair_top(), m_leath)
        .set_pos(0.0, BM_HEAD_TOP - 0.014 * HEX_R, -0.006 * HEX_R);
    m.add_mesh(g, g_hair_back(), m_hair).set_pos(
        0.0,
        BM_HEAD_CTR - 0.006 * HEX_R,
        -(BM_HEAD_D * 0.5 + 0.011 * HEX_R),
    );
    m.add_mesh(g, g_beard(), m_hair)
        .set_pos(0.0, BM_HEAD_CTR - 0.052 * HEX_R, 0.024 * HEX_R);
    m.add_mesh(g, g_cap(), m_leath)
        .set_pos(0.0, BM_HEAD_CTR + 0.050 * HEX_R, 0.0);

    // PRAWE RAMIĘ: MIECZ
    let arm_r = bm_build_arm(
        &mut m,
        g,
        -BM_SHLD_X,
        0.22,
        0.85,
        m_tunic,
        m_skin,
        Some(m_leath_dk),
    );
    let ax_r = arm_r.axis;
    let at_r = |d: f64| add_scaled(arm_r.wrist, ax_r, d * HEX_R);
    let rot_r = PI - 0.85;
    m.add_mesh(g, g_grip(), m_wood)
        .rot_x(rot_r)
        .set_pos_v(at_r(0.013));
    m.add_mesh(g, g_grip_wrap(), m_sinew)
        .rot_x(rot_r)
        .set_pos_v(at_r(0.003));
    m.add_mesh(g, g_grip_wrap(), m_sinew)
        .rot_x(rot_r)
        .set_pos_v(at_r(0.023));
    m.add_mesh(g, g_bracer(), m_leath_lt)
        .quat_from_unit_vectors(Y_UP, ax_r)
        .set_pos_v(at_r(-0.048));
    m.add_mesh(g, g_pommel(), m_bone).set_pos_v(at_r(-0.017));
    m.add_mesh(g, g_guard(), m_bronze)
        .rot_x(rot_r)
        .set_pos_v(at_r(0.040));
    m.add_mesh(g, g_blade(), m_bronze)
        .rot_x(rot_r)
        .set_pos_v(at_r(0.047));
    m.add_mesh(g, g_blade_edge(), m_bronze_lt)
        .set_scale(1.0, 1.0, 0.5)
        .rot_x(rot_r)
        .set_pos_v(at_r(0.1235));

    // POCHWA
    let sh_x = 0.070 * HEX_R;
    m.add_mesh(g, g_sheath(), m_leath)
        .rot_z(0.16)
        .set_pos(sh_x, 0.180 * HEX_R, -0.018 * HEX_R);
    m.add_mesh(g, g_sheath(), m_wood_dk)
        .set_scale(0.55, 0.97, 0.55)
        .rot_z(0.16)
        .set_pos(sh_x, 0.180 * HEX_R, -0.018 * HEX_R);
    m.add_mesh(g, g_sheath_top(), m_leath_dk)
        .rot_z(0.16)
        .set_pos(sh_x - 0.006 * HEX_R, 0.264 * HEX_R, -0.018 * HEX_R);
    m.add_mesh(g, g_sheath_tip(), m_leath_dk)
        .rot_z(0.16)
        .set_pos(sh_x + 0.012 * HEX_R, 0.088 * HEX_R, -0.018 * HEX_R);
    m.add_mesh(g, g_frog(), m_leath_lt).rot_z(0.16).set_pos(
        sh_x - 0.004 * HEX_R,
        0.240 * HEX_R,
        -0.006 * HEX_R,
    );

    // LEWE RAMIĘ: TARCZA
    let arm_l = bm_build_arm(
        &mut m,
        g,
        BM_SHLD_X,
        0.30,
        1.32,
        m_tunic,
        m_skin,
        Some(m_skin),
    );
    let sh_tilt = -0.66;
    let sh_n = v3(0.0, -js_sin(sh_tilt), js_cos(sh_tilt));
    let fore_mid = add_scaled(arm_l.wrist, arm_l.axis, -BM_FOREARM_L * 0.5);
    let sh = m.detached_group();
    {
        let n = m.node(sh);
        n.set_pos_v(add_scaled(fore_mid, sh_n, 0.030 * HEX_R));
        n.position.x -= 0.004 * HEX_R;
        n.rot_x(sh_tilt).rot_y(-0.16).rot_z(0.03);
    }
    m.add_mesh(sh, g_sh_field(), m_owner).rot_x(PI / 2.0);
    {
        let n = m.add_mesh(sh, g_sh_rim(), m_shield_hide);
        n.rot_x(PI / 2.0);
        n.position.z = -0.006 * HEX_R;
    }
    {
        let n = m.add_mesh(sh, g_sh_boss_ring(), m_leath_dk);
        n.rot_x(PI / 2.0);
        n.position.z = 0.012 * HEX_R;
    }
    {
        let n = m.add_mesh(sh, g_sh_boss(), m_bronze_lt);
        n.rot_x(-PI / 2.0);
        n.position.z = 0.020 * HEX_R;
    }
    for ang in [0.0, PI / 2.0, PI, PI * 1.5] {
        m.add_mesh(sh, g_sh_stitch(), m_leath_dk).set_pos(
            js_sin(ang) * 0.113 * HEX_R,
            js_cos(ang) * 0.113 * HEX_R,
            0.007 * HEX_R,
        );
    }
    m.add_mesh(sh, g_sh_grip(), m_wood)
        .set_pos(0.0, -0.018 * HEX_R, -0.035 * HEX_R);
    m.add_mesh(sh, g_sh_grip(), m_wood_dk)
        .rot_z(PI / 2.0)
        .set_scale(0.68, 1.0, 1.0)
        .set_pos(0.0, 0.0, -0.028 * HEX_R);
    m.add_mesh(sh, g_sh_loop(), m_leath_dk)
        .set_pos(0.0, 0.026 * HEX_R, -0.030 * HEX_R);
    m.attach(g, sh);

    m.node(g).set_scale_scalar(BM_FIGURE_SCALE);
    m
}
