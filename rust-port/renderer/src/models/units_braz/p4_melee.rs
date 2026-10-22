//! Port of `render/jednostki-p4-melee.ts` (`edb8fb56`): `buildSherden`,
//! `buildTyrrhenian`, `buildShekelesh`, `buildMycenaeanWarrior`,
//! `buildShangHalberdier`, `buildKhopeshWarrior` (all six exports).
//!
//! The lazily created `getGMS*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, cy_open, dir_down, oval_shell, seg, v3, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── kolory serii (`jednostki-p4-melee.ts:74-94`)
const MS_SKIN: u32 = 0xe0ac69;
const MS_BRONZE: u32 = 0xcf9234;
const MS_BRONZE_LT: u32 = 0xd0a050;
const MS_STEEL: u32 = 0xc2cad2;
const MS_WOOD: u32 = 0x7a5c3a;
const MS_LEATHER: u32 = 0x6b4a28;
const MS_LEATHER_DK: u32 = 0x53381e;
const MS_GOLD: u32 = 0xd8b040;
const MS_LINEN: u32 = 0xe8e0c8;
const MS_WOAD: u32 = 0x2f5aa0;
const MS_LACQUER: u32 = 0xa8252a;
const MS_TEAL: u32 = 0x2e6e63;
const MS_SEABLUE: u32 = 0x33607a;
const MS_SEAGREEN: u32 = 0x3e7a5e;
const MS_OCHRE: u32 = 0xc8932e;
const MS_TUSK: u32 = 0xeae0c4;
const MS_HIDE: u32 = 0x8a6a3e;
const MS_DARKHAIR: u32 = 0x2a1a0a;
const MS_DARK: u32 = 0x20180f;

// ── wymiary sylwetki (`:97-114`)
const MS_HIP_Y: f64 = 0.208 * HEX_R;
const MS_TORSO_W: f64 = 0.180 * HEX_R;
const MS_TORSO_H: f64 = 0.205 * HEX_R;
const MS_TORSO_D: f64 = 0.100 * HEX_R;
const MS_TORSO_BOT: f64 = 0.240 * HEX_R;
const MS_TORSO_CTR: f64 = MS_TORSO_BOT + MS_TORSO_H * 0.5;
const MS_TORSO_TOP: f64 = MS_TORSO_BOT + MS_TORSO_H;
const MS_NECK_H: f64 = 0.028 * HEX_R;
const MS_HEAD_S: f64 = 0.128 * HEX_R;
const MS_HEAD_CTR: f64 = MS_TORSO_TOP + MS_NECK_H + MS_HEAD_S * 0.5;
const MS_HEAD_TOP: f64 = MS_TORSO_TOP + MS_NECK_H + MS_HEAD_S;
const MS_SHLD_X: f64 = MS_TORSO_W * 0.5 + 0.030 * HEX_R;
const MS_SHLD_Y: f64 = MS_TORSO_TOP - 0.024 * HEX_R;
const MS_HIP_X: f64 = 0.052 * HEX_R;
const MS_THIGH_L: f64 = 0.104 * HEX_R;
const MS_SHIN_L: f64 = 0.096 * HEX_R;
const MS_UPARM_L: f64 = 0.100 * HEX_R;
const MS_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:173-225`, `:254-255`)
fn g_torso() -> Geo {
    bx(MS_TORSO_W, MS_TORSO_H, MS_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, MS_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(MS_HEAD_S, MS_HEAD_S, MS_HEAD_S)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, MS_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, MS_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, MS_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, MS_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)
}
fn g_band_t() -> Geo {
    bx(0.192 * HEX_R, 0.024 * HEX_R, 0.114 * HEX_R)
}
fn g_strap() -> Geo {
    bx(0.026 * HEX_R, 0.120 * HEX_R, 0.008 * HEX_R)
}
fn g_bowl() -> Geo {
    cy(0.062 * HEX_R, 0.092 * HEX_R, 0.100 * HEX_R, 8)
}
fn g_band() -> Geo {
    cy_open(0.097 * HEX_R, 0.097 * HEX_R, 0.022 * HEX_R, 8)
}
fn g_sh_face() -> Geo {
    cy(0.112 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 10)
}
fn g_sh_rim() -> Geo {
    cy_open(0.122 * HEX_R, 0.122 * HEX_R, 0.016 * HEX_R, 10)
}
fn g_sh_boss() -> Geo {
    bx(0.036 * HEX_R, 0.036 * HEX_R, 0.026 * HEX_R)
}
fn g_blade() -> Geo {
    bx(0.026 * HEX_R, 0.140 * HEX_R, 0.013 * HEX_R)
}
fn g_blade_tip() -> Geo {
    cn(0.016 * HEX_R, 0.042 * HEX_R, 4)
}
fn g_guard() -> Geo {
    bx(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)
}
fn g_sp_shaft() -> Geo {
    bx(0.019 * HEX_R, 0.560 * HEX_R, 0.019 * HEX_R)
}
fn g_sp_tip() -> Geo {
    cn(0.019 * HEX_R, 0.058 * HEX_R, 4)
}
fn g_haft() -> Geo {
    bx(0.020 * HEX_R, 0.440 * HEX_R, 0.020 * HEX_R)
}
fn g_axe_head() -> Geo {
    bx(0.094 * HEX_R, 0.056 * HEX_R, 0.020 * HEX_R)
}
fn g_axe_edge() -> Geo {
    bx(0.014 * HEX_R, 0.056 * HEX_R, 0.026 * HEX_R)
}
fn g_pole() -> Geo {
    bx(0.018 * HEX_R, 0.660 * HEX_R, 0.018 * HEX_R)
}
fn g_ge_blade() -> Geo {
    bx(0.018 * HEX_R, 0.032 * HEX_R, 0.130 * HEX_R)
}
fn g_ge_tassel() -> Geo {
    bx(0.030 * HEX_R, 0.052 * HEX_R, 0.014 * HEX_R)
}
fn g_ge_cap() -> Geo {
    cn(0.016 * HEX_R, 0.040 * HEX_R, 4)
}
fn g_horn() -> Geo {
    bx(0.020 * HEX_R, 0.062 * HEX_R, 0.020 * HEX_R)
}
fn g_disc() -> Geo {
    bx(0.034 * HEX_R, 0.034 * HEX_R, 0.012 * HEX_R)
}
fn g_spike() -> Geo {
    bx(0.014 * HEX_R, 0.055 * HEX_R, 0.014 * HEX_R)
}
fn g_crest_base() -> Geo {
    bx(0.018 * HEX_R, 0.022 * HEX_R, 0.112 * HEX_R)
}
fn g_crest_hair() -> Geo {
    bx(0.022 * HEX_R, 0.062 * HEX_R, 0.150 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.086 * HEX_R, 0.044 * HEX_R, 0.022 * HEX_R)
}
fn g_medal() -> Geo {
    bx(0.032 * HEX_R, 0.032 * HEX_R, 0.010 * HEX_R)
}
fn g_reed() -> Geo {
    bx(0.020 * HEX_R, 0.080 * HEX_R, 0.013 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.022 * HEX_R, 0.034 * HEX_R, 0.012 * HEX_R)
}
fn g_cap() -> Geo {
    cy(0.058 * HEX_R, 0.086 * HEX_R, 0.108 * HEX_R, 8)
}
fn g_tusk_b1() -> Geo {
    cy_open(0.0905 * HEX_R, 0.0925 * HEX_R, 0.026 * HEX_R, 8)
}
fn g_tusk_b2() -> Geo {
    cy_open(0.0820 * HEX_R, 0.0850 * HEX_R, 0.026 * HEX_R, 8)
}
fn g_tusk_b3() -> Geo {
    cy_open(0.0715 * HEX_R, 0.0760 * HEX_R, 0.026 * HEX_R, 8)
}
fn g_knob() -> Geo {
    bx(0.028 * HEX_R, 0.038 * HEX_R, 0.028 * HEX_R)
}
fn g_cheek() -> Geo {
    bx(0.018 * HEX_R, 0.050 * HEX_R, 0.042 * HEX_R)
}
fn g_waist_bar() -> Geo {
    bx(0.140 * HEX_R, 0.028 * HEX_R, 0.016 * HEX_R)
}
fn g_mask() -> Geo {
    bx(0.108 * HEX_R, 0.054 * HEX_R, 0.016 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.026 * HEX_R, 0.017 * HEX_R, 0.008 * HEX_R)
}
fn g_flap() -> Geo {
    bx(0.150 * HEX_R, 0.050 * HEX_R, 0.038 * HEX_R)
}
fn g_khep() -> Geo {
    cy(0.050 * HEX_R, 0.090 * HEX_R, 0.110 * HEX_R, 8)
}
fn g_uraeus() -> Geo {
    bx(0.016 * HEX_R, 0.034 * HEX_R, 0.013 * HEX_R)
}
fn g_collar() -> Geo {
    bx(0.192 * HEX_R, 0.028 * HEX_R, 0.110 * HEX_R)
}
fn g_kh_str() -> Geo {
    bx(0.024 * HEX_R, 0.096 * HEX_R, 0.013 * HEX_R)
}
fn g_kh_seg() -> Geo {
    bx(0.024 * HEX_R, 0.064 * HEX_R, 0.013 * HEX_R)
}
fn g_lobe_big() -> Geo {
    oval_shell(
        0.078 * HEX_R,
        0.088 * HEX_R,
        0.030 * HEX_R,
        0.016 * HEX_R,
        8,
    )
}
fn g_lobe_sm() -> Geo {
    oval_shell(
        0.064 * HEX_R,
        0.072 * HEX_R,
        0.024 * HEX_R,
        0.016 * HEX_R,
        8,
    )
}

/// `msBuildLeg` (`:271-283`).
#[allow(clippy::too_many_arguments)]
fn ms_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
    hip_y: f64,
) {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, MS_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, MS_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
}

/// `msBuildArm` (`:284-299`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn ms_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, MS_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, MS_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, MS_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `msBuildCore` (`:300-313`).
fn ms_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId) {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, MS_TORSO_CTR, 0.0);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, MS_TORSO_TOP + MS_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, MS_HEAD_CTR, 0.0);
}

/// `msStrapArmor` (`:316-329`).
fn ms_strap_armor(m: &mut UnitModel, g: NodeId, m_band: MatId, m_strap: MatId) {
    for dy in [0.058, 0.0, -0.058] {
        m.add_mesh(g, g_band_t(), m_band)
            .set_pos(0.0, MS_TORSO_CTR + dy * HEX_R, 0.0);
    }
    for s in [-1.0, 1.0] {
        let n = m.add_mesh(g, g_strap(), m_strap);
        n.rot_x(-0.55).rot_y(0.0).rot_z(s * 0.62);
        n.set_pos(s * 0.020 * HEX_R, 0.446 * HEX_R, 0.040 * HEX_R);
    }
}

/// `msRoundShield(mFace, mRim, mBoss, scale)` (`:332-349`): a detached group.
fn ms_round_shield(
    m: &mut UnitModel,
    m_face: MatId,
    m_rim: MatId,
    m_boss: Option<MatId>,
    scale: f64,
) -> NodeId {
    let sh = m.detached_group();
    m.add_mesh(sh, g_sh_face(), m_face).rot_x(PI / 2.0);
    {
        let n = m.add_mesh(sh, g_sh_rim(), m_rim);
        n.rot_x(PI / 2.0);
        n.position.z = -0.004 * HEX_R;
    }
    if let Some(mb) = m_boss {
        m.add_mesh(sh, g_sh_boss(), mb).position.z = 0.020 * HEX_R;
    }
    m.node(sh).set_scale_scalar(scale);
    sh
}

/// `msMountShield(group, sh, wrist)` (`:352-356`).
fn ms_mount_shield(m: &mut UnitModel, g: NodeId, sh: NodeId, wrist: Vec3) {
    m.node(sh)
        .set_pos(
            wrist.x - 0.025 * HEX_R,
            wrist.y + 0.030 * HEX_R,
            wrist.z + 0.042 * HEX_R,
        )
        .rot_y(-0.20);
    m.attach(g, sh);
}

/// `msPoleBetween(A, B)` (`:363-371`): detached group `W` + `d2`.
fn ms_pole_between(m: &mut UnitModel, a: Vec3, b: Vec3) -> (NodeId, f64) {
    let dir = a.minus(b);
    let d2 = dir.length() * 0.5;
    let dir = dir.normalize();
    let w = m.detached_group();
    m.node(w)
        .set_pos_v(a.plus(b).scale(0.5))
        .quat_from_unit_vectors(Y_UP, dir);
    (w, d2)
}

/// `niCoreP4` (`:433-444`).
fn ni_core_p4(m: &mut UnitModel, g: NodeId, m_tunic: MatId, m_leath: MatId, m_leat_d: MatId) {
    ms_build_core(m, g, m_tunic);
    m.add_mesh(g, g_skirt(), m_tunic)
        .set_pos(0.0, MS_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
    ms_strap_armor(m, g, m_leat_d, m_leath);
}

/// The sword of Sherden / Mycenaean (`:409-422`, `:661-674`): blade, tip and
/// guard on the forearm axis at angle `th`.
fn ms_sword(
    m: &mut UnitModel,
    g: NodeId,
    wrist: Vec3,
    axis: Vec3,
    th: f64,
    m_blade: MatId,
    m_guard: MatId,
) {
    m.add_mesh(g, g_blade(), m_blade)
        .rot_x(PI - th)
        .set_pos_v(add_scaled(wrist, axis, 0.100 * HEX_R));
    m.add_mesh(g, g_blade_tip(), m_blade)
        .rot_x(PI - th)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist, axis, 0.192 * HEX_R));
    m.add_mesh(g, g_guard(), m_guard)
        .rot_x(PI - th)
        .set_pos_v(add_scaled(wrist, axis, 0.030 * HEX_R));
}

/// `buildSherden(ownerColor)` (`jednostki-p4-melee.ts:382-430`).
#[must_use]
pub fn build_sherden(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(MS_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(MS_BRONZE_LT, 0.52, 0.38);
    let m_steel = m.mat(MS_STEEL, 0.52, 0.40);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_tunic = m.mat(MS_TEAL, 0.05, 0.80);
    let m_leath = m.mat(MS_LEATHER, 0.06, 0.82);
    let m_leat_d = m.mat(MS_LEATHER_DK, 0.06, 0.84);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);

    let hip_y = MS_HIP_Y - 0.012 * HEX_R;
    ni_core_p4(&mut m, g, m_tunic, m_leath, m_leat_d);

    ms_build_leg(
        &mut m, g, MS_HIP_X, 0.58, 0.34, m_skin, m_bronz_l, m_leath, hip_y,
    );
    ms_build_leg(
        &mut m, g, -MS_HIP_X, -0.52, -0.20, m_skin, m_bronz_l, m_leath, hip_y,
    );

    m.add_mesh(g, g_bowl(), m_bronze)
        .set_pos(0.0, MS_HEAD_CTR + 0.030 * HEX_R, 0.0);
    m.add_mesh(g, g_spike(), m_bronz_l)
        .set_pos(0.0, MS_HEAD_TOP + 0.052 * HEX_R, 0.0);
    m.add_mesh(g, g_disc(), m_bronz_l)
        .set_pos(0.0, MS_HEAD_TOP + 0.092 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_horn(), m_bronz_l)
            .rot_z(-sx * 0.62)
            .set_pos(sx * 0.058 * HEX_R, MS_HEAD_TOP + 0.016 * HEX_R, 0.0);
        m.add_mesh(g, g_horn(), m_bronz_l)
            .set_scale(0.85, 0.85, 0.85)
            .rot_z(sx * 0.25)
            .set_pos(sx * 0.070 * HEX_R, MS_HEAD_TOP + 0.066 * HEX_R, 0.0);
    }

    let (wrist_r, axis_r) = ms_build_arm(
        &mut m,
        g,
        -MS_SHLD_X,
        -2.15,
        2.85,
        m_tunic,
        m_skin,
        Some(m_leath),
    );
    ms_sword(&mut m, g, wrist_r, axis_r, 2.85, m_bronz_l, m_bronze);

    let (wrist_l, _) = ms_build_arm(&mut m, g, MS_SHLD_X, 0.50, 1.10, m_tunic, m_skin, None);
    let sh = ms_round_shield(&mut m, m_owner, m_bronze, Some(m_steel), 1.0);
    ms_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildTyrrhenian(ownerColor)` (`jednostki-p4-melee.ts:468-536`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_tyrrhenian(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(MS_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(MS_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_tunic = m.mat(MS_SEABLUE, 0.05, 0.80);
    let m_wood = m.mat(MS_WOOD, 0.05, 0.85);
    let m_leath = m.mat(MS_LEATHER, 0.06, 0.82);
    let m_leat_d = m.mat(MS_LEATHER_DK, 0.06, 0.84);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);
    let m_hair = m.mat(MS_DARKHAIR, 0.04, 0.88);

    let hip_y = MS_HIP_Y - 0.016 * HEX_R;
    ni_core_p4(&mut m, g, m_tunic, m_leath, m_leat_d);

    m.add_mesh(g, g_medal(), m_bronz_l).set_pos(
        0.0,
        MS_TORSO_CTR + 0.055 * HEX_R,
        MS_TORSO_D * 0.5 + 0.008 * HEX_R,
    );
    m.add_mesh(g, g_beard(), m_hair).set_pos(
        0.0,
        MS_HEAD_CTR - 0.042 * HEX_R,
        MS_HEAD_S * 0.5 + 0.004 * HEX_R,
    );

    ms_build_leg(
        &mut m, g, MS_HIP_X, 0.66, 0.42, m_skin, m_bronz_l, m_leath, hip_y,
    );
    ms_build_leg(
        &mut m, g, -MS_HIP_X, -0.58, -0.24, m_skin, m_bronz_l, m_leath, hip_y,
    );

    m.add_mesh(g, g_bowl(), m_bronze)
        .set_pos(0.0, MS_HEAD_CTR + 0.030 * HEX_R, 0.0);
    m.add_mesh(g, g_crest_base(), m_bronz_l)
        .set_pos(0.0, MS_HEAD_TOP + 0.022 * HEX_R, 0.0);
    m.add_mesh(g, g_crest_hair(), m_owner).rot_x(0.10).set_pos(
        0.0,
        MS_HEAD_TOP + 0.062 * HEX_R,
        -0.006 * HEX_R,
    );

    let (wrist_r, _) = ms_build_arm(
        &mut m,
        g,
        -MS_SHLD_X,
        -2.45,
        2.85,
        m_tunic,
        m_skin,
        Some(m_leath),
    );
    let (wrist_l, _) = ms_build_arm(
        &mut m,
        g,
        MS_SHLD_X,
        0.45,
        2.05,
        m_tunic,
        m_skin,
        Some(m_leath),
    );
    let (w, d2) = ms_pole_between(&mut m, wrist_r, wrist_l);
    m.add_mesh(w, g_haft(), m_wood).position.y = 0.030 * HEX_R;
    m.add_mesh(w, g_axe_head(), m_bronze)
        .set_pos(0.034 * HEX_R, d2 + 0.115 * HEX_R, 0.0);
    m.add_mesh(w, g_axe_edge(), m_owner)
        .set_pos(0.086 * HEX_R, d2 + 0.115 * HEX_R, 0.0);
    m.add_mesh(w, g_knob(), m_bronz_l)
        .set_pos(0.0, d2 + 0.115 * HEX_R, 0.0);
    m.attach(g, w);

    let sh = ms_round_shield(&mut m, m_owner, m_bronze, None, 0.85);
    m.node(sh).rot_y(PI).set_pos(
        0.010 * HEX_R,
        MS_TORSO_CTR + 0.020 * HEX_R,
        -(MS_TORSO_D * 0.5 + 0.034 * HEX_R),
    );
    m.attach(g, sh);
    m
}

/// `buildShekelesh(ownerColor)` (`jednostki-p4-melee.ts:544-606`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_shekelesh(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(MS_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(MS_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_tunic = m.mat(MS_SEAGREEN, 0.05, 0.80);
    let m_wood = m.mat(MS_WOOD, 0.05, 0.85);
    let m_leath = m.mat(MS_LEATHER, 0.06, 0.82);
    let m_leat_d = m.mat(MS_LEATHER_DK, 0.06, 0.84);
    let m_linen = m.mat(MS_LINEN, 0.04, 0.88);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);

    let hip_y = MS_HIP_Y - 0.010 * HEX_R;
    ni_core_p4(&mut m, g, m_tunic, m_leath, m_leat_d);

    for i in [-0.5, 0.5] {
        m.add_mesh(g, g_fringe(), m_linen).set_pos(
            i * 0.048 * HEX_R,
            MS_TORSO_BOT - 0.062 * HEX_R,
            0.052 * HEX_R,
        );
    }

    ms_build_leg(
        &mut m, g, MS_HIP_X, 0.52, 0.28, m_skin, m_bronz_l, m_leath, hip_y,
    );
    ms_build_leg(
        &mut m, g, -MS_HIP_X, -0.46, -0.16, m_skin, m_bronz_l, m_leath, hip_y,
    );

    m.add_mesh(g, g_bowl(), m_leat_d)
        .set_pos(0.0, MS_HEAD_CTR + 0.030 * HEX_R, 0.0);
    for k in [-1.0, 0.0, 1.0] {
        let ang = k * 0.80;
        m.add_mesh(g, g_reed(), m_linen)
            .rot_y(ang)
            .rot_z(-js_sin(ang) * 0.14)
            .set_pos(
                js_sin(ang) * 0.086 * HEX_R,
                MS_HEAD_CTR + 0.052 * HEX_R,
                js_cos(ang) * 0.086 * HEX_R,
            );
    }
    m.add_mesh(g, g_band(), m_owner)
        .set_scale_scalar(1.05)
        .set_pos(0.0, MS_HEAD_CTR + 0.020 * HEX_R, 0.0);

    let (wrist_r, axis_r) = ms_build_arm(
        &mut m,
        g,
        -MS_SHLD_X,
        0.55,
        1.62,
        m_tunic,
        m_skin,
        Some(m_leath),
    );
    m.add_mesh(g, g_sp_shaft(), m_wood)
        .rot_x(PI - 1.62)
        .set_pos_v(add_scaled(wrist_r, axis_r, 0.150 * HEX_R));
    m.add_mesh(g, g_sp_tip(), m_bronz_l)
        .rot_x(PI - 1.62)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, axis_r, (0.150 + 0.280 + 0.026) * HEX_R));

    let (wrist_l, _) = ms_build_arm(&mut m, g, MS_SHLD_X, 0.45, 1.08, m_tunic, m_skin, None);
    let sh = ms_round_shield(&mut m, m_owner, m_bronze, Some(m_bronz_l), 0.74);
    ms_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildMycenaeanWarrior(ownerColor)` (`jednostki-p4-melee.ts:616-698`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_mycenaean_warrior(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(MS_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(MS_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_tunic = m.mat(MS_OCHRE, 0.05, 0.80);
    let m_tusk = m.mat(MS_TUSK, 0.04, 0.80);
    let m_hide = m.mat(MS_HIDE, 0.05, 0.86);
    let m_leath = m.mat(MS_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);

    let hip_y = MS_HIP_Y - 0.012 * HEX_R;
    ms_build_core(&mut m, g, m_bronze);
    m.add_mesh(g, g_skirt(), m_leath)
        .set_pos(0.0, MS_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_bronz_l)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);

    ms_build_leg(
        &mut m, g, MS_HIP_X, 0.58, 0.34, m_tunic, m_bronz_l, m_leath, hip_y,
    );
    ms_build_leg(
        &mut m, g, -MS_HIP_X, -0.52, -0.20, m_tunic, m_bronz_l, m_leath, hip_y,
    );

    m.add_mesh(g, g_cap(), m_leath)
        .set_pos(0.0, MS_HEAD_CTR + 0.032 * HEX_R, 0.0);
    m.add_mesh(g, g_tusk_b1(), m_tusk)
        .set_pos(0.0, MS_HEAD_CTR + 0.006 * HEX_R, 0.0);
    m.add_mesh(g, g_tusk_b2(), m_tusk)
        .set_pos(0.0, MS_HEAD_CTR + 0.042 * HEX_R, 0.0);
    m.add_mesh(g, g_tusk_b3(), m_tusk)
        .set_pos(0.0, MS_HEAD_CTR + 0.078 * HEX_R, 0.0);
    m.add_mesh(g, g_knob(), m_bronz_l)
        .set_pos(0.0, MS_HEAD_TOP + 0.052 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_cheek(), m_tusk).set_pos(
            sx * (MS_HEAD_S * 0.5 + 0.004 * HEX_R),
            MS_HEAD_CTR - 0.016 * HEX_R,
            0.016 * HEX_R,
        );
    }

    let (wrist_r, axis_r) = ms_build_arm(
        &mut m,
        g,
        -MS_SHLD_X,
        0.95,
        1.50,
        m_tunic,
        m_skin,
        Some(m_leath),
    );
    ms_sword(&mut m, g, wrist_r, axis_r, 1.50, m_bronz_l, m_bronze);

    let (wrist_l, _) = ms_build_arm(&mut m, g, MS_SHLD_X, 0.52, 1.05, m_tunic, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.028 * HEX_R,
            wrist_l.y + 0.040 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.32);
    m.add_mesh(sh, g_lobe_big(), m_hide)
        .set_pos(0.0, -0.070 * HEX_R, 0.0);
    m.add_mesh(sh, g_lobe_sm(), m_hide)
        .set_pos(0.0, 0.088 * HEX_R, 0.004 * HEX_R);
    m.add_mesh(sh, g_waist_bar(), m_owner)
        .set_pos(0.0, 0.010 * HEX_R, 0.014 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildShangHalberdier(ownerColor)` (`jednostki-p4-melee.ts:707-786`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_shang_halberdier(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_lac = m.mat(MS_LACQUER, 0.10, 0.55);
    let m_bronze = m.mat(MS_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(MS_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(MS_WOOD, 0.05, 0.85);
    let m_leath = m.mat(MS_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);
    let m_dark = m.mat(MS_DARK, 0.05, 0.90);

    let hip_y = MS_HIP_Y - 0.014 * HEX_R;
    ms_build_core(&mut m, g, m_lac);
    m.add_mesh(g, g_skirt(), m_lac)
        .set_pos(0.0, MS_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
    for dy in [0.058, 0.0, -0.058] {
        m.add_mesh(g, g_band_t(), m_bronz_l)
            .set_pos(0.0, MS_TORSO_CTR + dy * HEX_R, 0.0);
    }

    ms_build_leg(
        &mut m, g, MS_HIP_X, 0.60, 0.36, m_lac, m_lac, m_leath, hip_y,
    );
    ms_build_leg(
        &mut m, g, -MS_HIP_X, -0.54, -0.22, m_lac, m_lac, m_leath, hip_y,
    );

    m.add_mesh(g, g_bowl(), m_bronze)
        .set_pos(0.0, MS_HEAD_CTR + 0.030 * HEX_R, 0.0);
    m.add_mesh(g, g_mask(), m_bronz_l)
        .set_pos(0.0, MS_HEAD_CTR + 0.030 * HEX_R, 0.072 * HEX_R);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_dark).set_pos(
            sx * 0.028 * HEX_R,
            MS_HEAD_CTR + 0.034 * HEX_R,
            0.084 * HEX_R,
        );
    }
    m.add_mesh(g, g_eye(), m_dark)
        .set_scale(2.6, 0.8, 1.0)
        .set_pos(0.0, MS_HEAD_CTR + 0.052 * HEX_R, 0.084 * HEX_R);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_cheek(), m_bronze).set_pos(
            sx * (MS_HEAD_S * 0.5 + 0.004 * HEX_R),
            MS_HEAD_CTR - 0.014 * HEX_R,
            0.014 * HEX_R,
        );
    }
    m.add_mesh(g, g_spike(), m_bronz_l)
        .set_pos(0.0, MS_HEAD_TOP + 0.048 * HEX_R, 0.0);
    m.add_mesh(g, g_flap(), m_owner).set_pos(
        0.0,
        MS_HEAD_CTR - 0.034 * HEX_R,
        -MS_HEAD_S * 0.5 - 0.008 * HEX_R,
    );

    let (wrist_r, _) = ms_build_arm(
        &mut m,
        g,
        -MS_SHLD_X,
        -2.20,
        2.60,
        m_lac,
        m_skin,
        Some(m_leath),
    );
    let (wrist_l, _) = ms_build_arm(
        &mut m,
        g,
        MS_SHLD_X,
        0.50,
        1.30,
        m_lac,
        m_skin,
        Some(m_leath),
    );
    let (w, d2) = ms_pole_between(&mut m, wrist_r, wrist_l);
    m.add_mesh(w, g_pole(), m_wood).position.y = -0.060 * HEX_R;
    m.add_mesh(w, g_ge_blade(), m_bronz_l)
        .set_pos(0.0, -(d2 + 0.130 * HEX_R), 0.052 * HEX_R);
    m.add_mesh(w, g_ge_tassel(), m_owner)
        .set_pos(0.0, -(d2 + 0.088 * HEX_R), 0.030 * HEX_R);
    m.add_mesh(w, g_ge_cap(), m_bronze)
        .rot_x(PI)
        .set_pos(0.0, -(d2 + 0.185 * HEX_R), 0.0);
    m.attach(g, w);
    m
}

/// `buildKhopeshWarrior(ownerColor)` (`jednostki-p4-melee.ts:796-866`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_khopesh_warrior(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(MS_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(MS_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_linen = m.mat(MS_LINEN, 0.05, 0.86);
    let m_blue = m.mat(MS_WOAD, 0.06, 0.72);
    let m_gold = m.mat(MS_GOLD, 0.55, 0.38);
    let m_leath = m.mat(MS_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(MS_SKIN, 0.05, 0.80);

    let hip_y = MS_HIP_Y - 0.012 * HEX_R;
    ms_build_core(&mut m, g, m_linen);
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, MS_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
    m.add_mesh(g, g_collar(), m_gold)
        .set_pos(0.0, MS_TORSO_TOP - 0.008 * HEX_R, 0.0);

    ms_build_leg(
        &mut m, g, MS_HIP_X, 0.56, 0.32, m_skin, m_skin, m_leath, hip_y,
    );
    ms_build_leg(
        &mut m, g, -MS_HIP_X, -0.50, -0.18, m_skin, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_khep(), m_blue).rot_x(-0.10).set_pos(
        0.0,
        MS_HEAD_CTR + 0.034 * HEX_R,
        -0.006 * HEX_R,
    );
    m.add_mesh(g, g_band(), m_gold)
        .set_scale_scalar(0.97)
        .set_pos(0.0, MS_HEAD_CTR + 0.016 * HEX_R, 0.0);
    m.add_mesh(g, g_uraeus(), m_gold)
        .set_pos(0.0, MS_HEAD_CTR + 0.075 * HEX_R, 0.060 * HEX_R);

    let (wrist_r, _) = ms_build_arm(
        &mut m,
        g,
        -MS_SHLD_X,
        -2.35,
        2.75,
        m_skin,
        m_skin,
        Some(m_leath),
    );
    let kh = m.detached_group();
    m.node(kh).set_pos_v(wrist_r).rot_x(PI - 2.75);
    m.add_mesh(kh, g_kh_str(), m_bronz_l)
        .set_pos(0.0, 0.072 * HEX_R, 0.0);
    let mut py = 0.120 * HEX_R;
    let mut pz = 0.0;
    for a in [0.40, 0.95, 1.55] {
        let dy = js_cos(a) * 0.062 * HEX_R;
        let dz = js_sin(a) * 0.062 * HEX_R;
        m.add_mesh(kh, g_kh_seg(), m_bronz_l)
            .rot_x(a)
            .set_pos(0.0, py + dy * 0.5, pz + dz * 0.5);
        py += dy;
        pz += dz;
    }
    m.add_mesh(kh, g_guard(), m_gold)
        .set_pos(0.0, 0.026 * HEX_R, 0.0);
    m.attach(g, kh);

    let (wrist_l, _) = ms_build_arm(&mut m, g, MS_SHLD_X, 0.48, 1.06, m_skin, m_skin, None);
    let sh = ms_round_shield(&mut m, m_owner, m_bronze, Some(m_bronz_l), 0.78);
    ms_mount_shield(&mut m, g, sh, wrist_l);
    m
}
