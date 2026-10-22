//! Port of `render/jednostki-p8a-bliskiwschod.ts` (`edb8fb56`):
//! `buildPiechotaHetycka`, `buildGwardiaIshtar`, `buildWojownikBabilonski`,
//! `buildWojownikFenicki` (all four exports).
//!
//! The lazily created `getGBW*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{
    add_scaled, bx, cn, cy, cy_open, dir_down, oval_face, oval_shell, seg, torus, v3,
};
use crate::geom::Vec3;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── kolory serii (`jednostki-p8a-bliskiwschod.ts:64-81`)
const BW_SKIN: u32 = 0xe0ac69;
const BW_BRONZE: u32 = 0xcf9234;
const BW_BRONZE_LT: u32 = 0xd0a050;
const BW_GOLD: u32 = 0xd8b040;
const BW_WOOD: u32 = 0x7a5c3a;
const BW_LEATHER: u32 = 0x6b4a28;
const BW_LEATHER_DK: u32 = 0x53381e;
const BW_LINEN: u32 = 0xe8e0c8;
const BW_LAPIS: u32 = 0x2450a0;
const BW_LAPIS_DK: u32 = 0x1a3c7e;
const BW_BRICK: u32 = 0x9c4a2e;
const BW_CREAM: u32 = 0xe6d9b8;
const BW_PURPLE: u32 = 0x7a1f5e;
const BW_ROPE: u32 = 0xb89a6a;
const BW_DARKHAIR: u32 = 0x2a1a0a;
const BW_DARK: u32 = 0x20180f;

// ── wymiary sylwetki (`:84-101`)
const BW_HIP_Y: f64 = 0.208 * HEX_R;
const BW_TORSO_W: f64 = 0.180 * HEX_R;
const BW_TORSO_H: f64 = 0.205 * HEX_R;
const BW_TORSO_D: f64 = 0.100 * HEX_R;
const BW_TORSO_BOT: f64 = 0.240 * HEX_R;
const BW_TORSO_CTR: f64 = BW_TORSO_BOT + BW_TORSO_H * 0.5;
const BW_TORSO_TOP: f64 = BW_TORSO_BOT + BW_TORSO_H;
const BW_NECK_H: f64 = 0.028 * HEX_R;
const BW_HEAD_S: f64 = 0.128 * HEX_R;
const BW_HEAD_CTR: f64 = BW_TORSO_TOP + BW_NECK_H + BW_HEAD_S * 0.5;
const BW_HEAD_TOP: f64 = BW_TORSO_TOP + BW_NECK_H + BW_HEAD_S;
const BW_SHLD_X: f64 = BW_TORSO_W * 0.5 + 0.030 * HEX_R;
const BW_SHLD_Y: f64 = BW_TORSO_TOP - 0.024 * HEX_R;
const BW_HIP_X: f64 = 0.052 * HEX_R;
const BW_THIGH_L: f64 = 0.104 * HEX_R;
const BW_SHIN_L: f64 = 0.096 * HEX_R;
const BW_UPARM_L: f64 = 0.100 * HEX_R;
const BW_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:146-191`, `:228-229`)
fn g_torso() -> Geo {
    bx(BW_TORSO_W, BW_TORSO_H, BW_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, BW_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(BW_HEAD_S, BW_HEAD_S, BW_HEAD_S)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, BW_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, BW_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_toe() -> Geo {
    bx(0.030 * HEX_R, 0.034 * HEX_R, 0.022 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, BW_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, BW_FOREARM_L, 0.040 * HEX_R)
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
fn g_belt_wide() -> Geo {
    bx(0.192 * HEX_R, 0.056 * HEX_R, 0.114 * HEX_R)
}
fn g_sash() -> Geo {
    bx(0.052 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)
}
fn g_hem() -> Geo {
    bx(0.198 * HEX_R, 0.026 * HEX_R, 0.120 * HEX_R)
}
fn g_merlon() -> Geo {
    bx(0.024 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)
}
fn g_cone() -> Geo {
    cy(0.040 * HEX_R, 0.098 * HEX_R, 0.115 * HEX_R, 8)
}
fn g_cone_tall() -> Geo {
    cy(0.038 * HEX_R, 0.096 * HEX_R, 0.125 * HEX_R, 8)
}
fn g_cheek() -> Geo {
    bx(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)
}
fn g_plume_top() -> Geo {
    bx(0.026 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)
}
fn g_plume_fall() -> Geo {
    bx(0.024 * HEX_R, 0.115 * HEX_R, 0.018 * HEX_R)
}
fn g_crest_base() -> Geo {
    bx(0.018 * HEX_R, 0.022 * HEX_R, 0.092 * HEX_R)
}
fn g_crest_hair() -> Geo {
    bx(0.022 * HEX_R, 0.050 * HEX_R, 0.118 * HEX_R)
}
fn g_bowl() -> Geo {
    cy_open(0.062 * HEX_R, 0.090 * HEX_R, 0.066 * HEX_R, 8)
}
fn g_bowl_top() -> Geo {
    cy(0.024 * HEX_R, 0.060 * HEX_R, 0.034 * HEX_R, 8)
}
fn g_tuft() -> Geo {
    bx(0.022 * HEX_R, 0.048 * HEX_R, 0.052 * HEX_R)
}
fn g_beard(i: usize) -> Geo {
    match i {
        0 => bx(0.088 * HEX_R, 0.026 * HEX_R, 0.026 * HEX_R),
        1 => bx(0.074 * HEX_R, 0.026 * HEX_R, 0.022 * HEX_R),
        _ => bx(0.056 * HEX_R, 0.026 * HEX_R, 0.018 * HEX_R),
    }
}
fn g_sh_face() -> Geo {
    cy(0.112 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 8)
}
fn g_sh_rim() -> Geo {
    cy_open(0.122 * HEX_R, 0.122 * HEX_R, 0.016 * HEX_R, 8)
}
fn g_sh_boss() -> Geo {
    bx(0.036 * HEX_R, 0.036 * HEX_R, 0.026 * HEX_R)
}
fn g_star_ray() -> Geo {
    bx(0.026 * HEX_R, 0.186 * HEX_R, 0.010 * HEX_R)
}
fn g_ros_petal() -> Geo {
    bx(0.030 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R)
}
fn g_sp_shaft() -> Geo {
    bx(0.019 * HEX_R, 0.560 * HEX_R, 0.019 * HEX_R)
}
fn g_sp_tip() -> Geo {
    cn(0.019 * HEX_R, 0.058 * HEX_R, 4)
}
fn g_sp_butt() -> Geo {
    bx(0.022 * HEX_R, 0.048 * HEX_R, 0.022 * HEX_R)
}
fn g_sp_collar() -> Geo {
    bx(0.030 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)
}
fn g_grip() -> Geo {
    bx(0.024 * HEX_R, 0.062 * HEX_R, 0.024 * HEX_R)
}
fn g_blade_str() -> Geo {
    bx(0.014 * HEX_R, 0.132 * HEX_R, 0.026 * HEX_R)
}
fn g_blade_arc() -> Geo {
    bx(0.014 * HEX_R, 0.070 * HEX_R, 0.030 * HEX_R)
}
fn g_rope() -> Geo {
    torus(0.030 * HEX_R, 0.011 * HEX_R, 3, 7)
}
fn g_pouch() -> Geo {
    bx(0.042 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)
}
fn g_fig8_shell() -> Geo {
    oval_shell(
        0.082 * HEX_R,
        0.094 * HEX_R,
        0.026 * HEX_R,
        0.018 * HEX_R,
        8,
    )
}
fn g_fig8_face() -> Geo {
    oval_face(0.070 * HEX_R, 0.080 * HEX_R, 0.020 * HEX_R, 8)
}

/// `bwBuildLeg` (`:250-263`): returns `footZ`.
#[allow(clippy::too_many_arguments)]
fn bw_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
    hip_y: f64,
) -> f64 {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, BW_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, BW_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
    p.z + 0.016 * HEX_R
}

/// `bwBuildArm` (`:264-279`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn bw_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, BW_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, BW_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, BW_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `bwBuildCore` (`:280-293`).
fn bw_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId) {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, BW_TORSO_CTR, 0.0);
    let m_skin = m.mat(BW_SKIN, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, BW_TORSO_TOP + BW_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, BW_HEAD_CTR, 0.0);
}

/// `bwSash` (`:296-301`).
fn bw_sash(m: &mut UnitModel, g: NodeId, m_owner: MatId) {
    m.add_mesh(g, g_sash(), m_owner).rot_z(0.60).set_pos(
        0.0,
        BW_TORSO_CTR + 0.012 * HEX_R,
        BW_TORSO_D * 0.5 + 0.007 * HEX_R,
    );
}

/// `bwBeard(group, mHair, rows)` (`:304-312`).
fn bw_beard(m: &mut UnitModel, g: NodeId, m_hair: MatId, rows: usize) {
    let z0 = BW_HEAD_S * 0.5 - 0.004 * HEX_R;
    for i in 0..rows {
        #[allow(clippy::cast_precision_loss)]
        let fi = i as f64;
        m.add_mesh(g, g_beard(i), m_hair).set_pos(
            0.0,
            BW_HEAD_CTR - (0.052 + fi * 0.026) * HEX_R,
            z0 + (0.012 - fi * 0.003) * HEX_R,
        );
    }
}

/// `bwRoundShield` (`:315-332`): a detached group.
fn bw_round_shield(
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

/// `bwMountShield` (`:335-339`).
fn bw_mount_shield(m: &mut UnitModel, g: NodeId, sh: NodeId, wrist: Vec3) {
    m.node(sh)
        .set_pos(
            wrist.x - 0.025 * HEX_R,
            wrist.y + 0.030 * HEX_R,
            wrist.z + 0.042 * HEX_R,
        )
        .rot_y(-0.20);
    m.attach(g, sh);
}

/// `bwSpearUnderhand` (`:343-372`).
#[allow(clippy::too_many_arguments)]
fn bw_spear_underhand(
    m: &mut UnitModel,
    g: NodeId,
    wrist: Vec3,
    axis: Vec3,
    m_wood: MatId,
    m_tip: MatId,
    m_butt: Option<MatId>,
    tilt: f64,
    m_collar: Option<MatId>,
) {
    let spear_th = PI * 0.5 + tilt;
    let s_axis = dir_down(spear_th);
    let grip = add_scaled(wrist, axis, 0.014 * HEX_R);
    m.add_mesh(g, g_sp_shaft(), m_wood)
        .rot_x(PI - spear_th)
        .set_pos_v(add_scaled(grip, s_axis, 0.105 * HEX_R));
    m.add_mesh(g, g_sp_tip(), m_tip)
        .rot_x(PI - spear_th)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(grip, s_axis, (0.105 + 0.280 + 0.026) * HEX_R));
    if let Some(mc) = m_collar {
        m.add_mesh(g, g_sp_collar(), mc)
            .rot_x(PI - spear_th)
            .set_pos_v(add_scaled(grip, s_axis, (0.105 + 0.280 - 0.020) * HEX_R));
    }
    if let Some(mb) = m_butt {
        m.add_mesh(g, g_sp_butt(), mb)
            .rot_x(PI - spear_th)
            .set_pos_v(add_scaled(grip, s_axis, (0.105 - 0.280 - 0.018) * HEX_R));
    }
}

/// `buildPiechotaHetycka(ownerColor)` (`jednostki-p8a-bliskiwschod.ts:380-459`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_piechota_hetycka(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_linen = m.mat(BW_LINEN, 0.06, 0.82);
    let m_bronze = m.mat(BW_BRONZE, 0.35, 0.50);
    let m_bronz_l = m.mat(BW_BRONZE_LT, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(BW_WOOD, 0.05, 0.85);
    let m_leath = m.mat(BW_LEATHER, 0.06, 0.82);
    let m_leath_d = m.mat(BW_LEATHER_DK, 0.05, 0.85);
    let m_skin = m.mat(BW_SKIN, 0.05, 0.80);
    let m_dark = m.mat(BW_DARK, 0.05, 0.88);

    let hip_y = BW_HIP_Y - 0.010 * HEX_R;

    bw_build_core(&mut m, g, m_linen);
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, BW_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt_wide(), m_leath_d)
        .set_pos(0.0, 0.258 * HEX_R, 0.0);
    bw_sash(&mut m, g, m_owner);

    let fz_l = bw_build_leg(
        &mut m, g, BW_HIP_X, 0.55, 0.30, m_linen, m_skin, m_leath, hip_y,
    );
    let fz_r = bw_build_leg(
        &mut m, g, -BW_HIP_X, -0.50, -0.16, m_linen, m_skin, m_leath, hip_y,
    );
    for (sx, fz) in [(BW_HIP_X, fz_l), (-BW_HIP_X, fz_r)] {
        m.add_mesh(g, g_toe(), m_leath)
            .rot_x(-0.55)
            .set_pos(sx, 0.030 * HEX_R, fz + 0.042 * HEX_R);
    }

    m.add_mesh(g, g_cone(), m_bronze)
        .set_pos(0.0, BW_HEAD_CTR + 0.042 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_cheek(), m_bronze).set_pos(
            sx * (BW_HEAD_S * 0.5 + 0.004 * HEX_R),
            BW_HEAD_CTR - 0.012 * HEX_R,
            0.014 * HEX_R,
        );
    }
    m.add_mesh(g, g_plume_top(), m_dark)
        .set_pos(0.0, BW_HEAD_TOP + 0.058 * HEX_R, -0.006 * HEX_R);
    m.add_mesh(g, g_plume_fall(), m_dark).rot_x(-2.35).set_pos(
        0.0,
        BW_HEAD_TOP + 0.014 * HEX_R,
        -0.075 * HEX_R,
    );

    let (wrist_r, axis_r) = bw_build_arm(
        &mut m,
        g,
        -BW_SHLD_X,
        0.85,
        1.42,
        m_linen,
        m_skin,
        Some(m_leath),
    );
    bw_spear_underhand(
        &mut m,
        g,
        wrist_r,
        axis_r,
        m_wood,
        m_bronz_l,
        Some(m_bronze),
        0.30,
        None,
    );

    let (wrist_l, _) = bw_build_arm(&mut m, g, BW_SHLD_X, 0.50, 1.08, m_linen, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y + 0.052 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.20);
    for dy in [0.072, -0.072] {
        m.add_mesh(sh, g_fig8_shell(), m_leath)
            .set_pos(0.0, dy * HEX_R, 0.0);
        m.add_mesh(sh, g_fig8_face(), m_owner)
            .set_pos(0.0, dy * HEX_R, 0.013 * HEX_R);
    }
    m.attach(g, sh);
    m
}

/// `buildGwardiaIshtar(ownerColor)` (`jednostki-p8a-bliskiwschod.ts:468-534`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_gwardia_ishtar(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_lapis = m.mat(BW_LAPIS, 0.10, 0.62);
    let m_lapis_d = m.mat(BW_LAPIS_DK, 0.10, 0.66);
    let m_gold = m.mat(BW_GOLD, 0.58, 0.32);
    let m_bronze = m.mat(BW_BRONZE, 0.35, 0.50);
    let m_owner = m.mat(owner, 0.14, 0.60);
    let m_wood = m.mat(BW_WOOD, 0.05, 0.85);
    let m_leath = m.mat(BW_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(BW_SKIN, 0.05, 0.80);
    let m_hair = m.mat(BW_DARKHAIR, 0.05, 0.88);

    let hip_y = BW_HIP_Y - 0.012 * HEX_R;

    bw_build_core(&mut m, g, m_lapis);
    m.add_mesh(g, g_skirt(), m_lapis_d)
        .set_pos(0.0, BW_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_hem(), m_gold)
        .set_pos(0.0, BW_TORSO_BOT - 0.052 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_gold)
        .set_pos(0.0, 0.256 * HEX_R, 0.0);
    bw_sash(&mut m, g, m_owner);

    bw_build_leg(
        &mut m, g, BW_HIP_X, 0.58, 0.34, m_lapis, m_skin, m_leath, hip_y,
    );
    bw_build_leg(
        &mut m, g, -BW_HIP_X, -0.52, -0.20, m_lapis, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_cone_tall(), m_gold)
        .set_pos(0.0, BW_HEAD_CTR + 0.047 * HEX_R, 0.0);
    m.add_mesh(g, g_crest_base(), m_bronze).set_pos(
        0.0,
        BW_HEAD_TOP + 0.058 * HEX_R,
        -0.006 * HEX_R,
    );
    m.add_mesh(g, g_crest_hair(), m_lapis).set_pos(
        0.0,
        BW_HEAD_TOP + 0.092 * HEX_R,
        -0.008 * HEX_R,
    );
    bw_beard(&mut m, g, m_hair, 3);

    let (wrist_r, axis_r) = bw_build_arm(
        &mut m,
        g,
        -BW_SHLD_X,
        -2.55,
        1.32,
        m_lapis,
        m_skin,
        Some(m_leath),
    );
    bw_spear_underhand(
        &mut m,
        g,
        wrist_r,
        axis_r,
        m_wood,
        m_bronze,
        Some(m_gold),
        -0.20,
        Some(m_gold),
    );

    let (wrist_l, _) = bw_build_arm(&mut m, g, BW_SHLD_X, 0.52, 1.05, m_lapis, m_skin, None);
    let sh = bw_round_shield(&mut m, m_gold, m_lapis_d, None, 1.0);
    for i in 0..4 {
        m.add_mesh(sh, g_star_ray(), m_owner)
            .rot_z(f64::from(i) * PI / 4.0)
            .position
            .z = 0.017 * HEX_R;
    }
    m.add_mesh(sh, g_sh_boss(), m_gold).position.z = 0.024 * HEX_R;
    bw_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildWojownikBabilonski(ownerColor)` (`jednostki-p8a-bliskiwschod.ts:543-619`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_wojownik_babilonski(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_brick = m.mat(BW_BRICK, 0.05, 0.84);
    let m_cream = m.mat(BW_CREAM, 0.06, 0.82);
    let m_bronze = m.mat(BW_BRONZE, 0.35, 0.50);
    let m_bronz_l = m.mat(BW_BRONZE_LT, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(BW_WOOD, 0.05, 0.85);
    let m_leath = m.mat(BW_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(BW_SKIN, 0.05, 0.80);
    let m_hair = m.mat(BW_DARKHAIR, 0.05, 0.88);

    let hip_y = BW_HIP_Y - 0.010 * HEX_R;

    bw_build_core(&mut m, g, m_brick);
    m.add_mesh(g, g_skirt(), m_brick)
        .set_pos(0.0, BW_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_hem(), m_cream)
        .set_pos(0.0, BW_TORSO_BOT - 0.052 * HEX_R, 0.0);
    for sx in [-1.5, -0.5, 0.5, 1.5] {
        m.add_mesh(g, g_merlon(), m_brick).set_pos(
            sx * 0.046 * HEX_R,
            BW_TORSO_BOT - 0.044 * HEX_R,
            0.062 * HEX_R,
        );
    }
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.256 * HEX_R, 0.0);
    bw_sash(&mut m, g, m_owner);

    bw_build_leg(
        &mut m, g, BW_HIP_X, 0.55, 0.30, m_brick, m_skin, m_leath, hip_y,
    );
    bw_build_leg(
        &mut m, g, -BW_HIP_X, -0.50, -0.16, m_brick, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_cone(), m_bronze)
        .set_pos(0.0, BW_HEAD_CTR + 0.042 * HEX_R, 0.0);
    bw_beard(&mut m, g, m_hair, 2);

    let (wrist_r, s_axis) = bw_build_arm(
        &mut m,
        g,
        -BW_SHLD_X,
        -2.15,
        2.45,
        m_brick,
        m_skin,
        Some(m_leath),
    );
    let sw_th = 2.45;
    m.add_mesh(g, g_grip(), m_wood)
        .rot_x(PI - sw_th)
        .set_pos_v(add_scaled(wrist_r, s_axis, 0.016 * HEX_R));
    m.add_mesh(g, g_blade_str(), m_bronz_l)
        .rot_x(PI - sw_th)
        .set_pos_v(add_scaled(wrist_r, s_axis, 0.110 * HEX_R));
    let arc_base = add_scaled(wrist_r, s_axis, 0.176 * HEX_R);
    m.add_mesh(g, g_blade_arc(), m_bronz_l)
        .rot_x(PI - (sw_th - 0.55))
        .set_pos_v(add_scaled(arc_base, dir_down(sw_th - 0.55), 0.032 * HEX_R));
    let arc_end = add_scaled(arc_base, dir_down(sw_th - 0.55), 0.064 * HEX_R);
    m.add_mesh(g, g_blade_arc(), m_bronz_l)
        .rot_x(PI - (sw_th - 1.10))
        .set_pos_v(add_scaled(arc_end, dir_down(sw_th - 1.10), 0.030 * HEX_R));

    let (wrist_l, _) = bw_build_arm(&mut m, g, BW_SHLD_X, 0.50, 1.08, m_brick, m_skin, None);
    let sh = bw_round_shield(&mut m, m_owner, m_wood, None, 0.74);
    bw_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildWojownikFenicki(ownerColor)` (`jednostki-p8a-bliskiwschod.ts:628-704`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_wojownik_fenicki(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_purple = m.mat(BW_PURPLE, 0.06, 0.78);
    let m_cream = m.mat(BW_CREAM, 0.06, 0.82);
    let m_bronze = m.mat(BW_BRONZE, 0.35, 0.50);
    let m_bronz_l = m.mat(BW_BRONZE_LT, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(BW_WOOD, 0.05, 0.85);
    let m_leath = m.mat(BW_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(BW_SKIN, 0.05, 0.80);
    let m_dark = m.mat(BW_DARK, 0.05, 0.88);
    let m_rope = m.mat(BW_ROPE, 0.05, 0.86);

    let hip_y = BW_HIP_Y - 0.010 * HEX_R;

    bw_build_core(&mut m, g, m_purple);
    m.add_mesh(g, g_skirt(), m_purple)
        .set_pos(0.0, BW_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_hem(), m_cream)
        .set_pos(0.0, BW_TORSO_BOT - 0.052 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.256 * HEX_R, 0.0);
    bw_sash(&mut m, g, m_owner);

    m.add_mesh(g, g_rope(), m_rope)
        .set_pos(0.088 * HEX_R, 0.250 * HEX_R, -0.046 * HEX_R)
        .rot_y(0.55);
    m.add_mesh(g, g_pouch(), m_leath)
        .set_pos(-0.096 * HEX_R, 0.236 * HEX_R, -0.020 * HEX_R);

    bw_build_leg(
        &mut m, g, BW_HIP_X, 0.52, 0.28, m_purple, m_skin, m_leath, hip_y,
    );
    bw_build_leg(
        &mut m, g, -BW_HIP_X, -0.48, -0.14, m_purple, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_bowl(), m_bronze)
        .set_pos(0.0, BW_HEAD_CTR + 0.038 * HEX_R, 0.0);
    m.add_mesh(g, g_bowl_top(), m_bronze)
        .set_pos(0.0, BW_HEAD_CTR + 0.088 * HEX_R, 0.0);
    m.add_mesh(g, g_tuft(), m_dark).rot_x(0.30).set_pos(
        0.0,
        BW_HEAD_TOP + 0.066 * HEX_R,
        -0.012 * HEX_R,
    );

    let (wrist_r, axis_r) = bw_build_arm(
        &mut m,
        g,
        -BW_SHLD_X,
        0.78,
        1.52,
        m_purple,
        m_skin,
        Some(m_leath),
    );
    bw_spear_underhand(
        &mut m,
        g,
        wrist_r,
        axis_r,
        m_wood,
        m_bronz_l,
        Some(m_bronze),
        0.18,
        None,
    );

    let (wrist_l, _) = bw_build_arm(&mut m, g, BW_SHLD_X, 0.52, 1.05, m_purple, m_skin, None);
    let sh = bw_round_shield(&mut m, m_owner, m_bronze, None, 0.90);
    for i in 0..3 {
        m.add_mesh(sh, g_ros_petal(), m_cream)
            .rot_z(f64::from(i) * PI / 3.0)
            .position
            .z = 0.017 * HEX_R;
    }
    m.add_mesh(sh, g_sh_boss(), m_bronz_l).position.z = 0.024 * HEX_R;
    bw_mount_shield(&mut m, g, sh, wrist_l);
    m
}
