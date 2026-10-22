//! Port of `render/jednostki-p6-super.ts` (`edb8fb56`): `buildSuperGreece`
//! (records "Hieros Lochos (Święty Zastęp)" via `buildSuperUnit('grecja')`,
//! `units.ts:4807-4825`) and `buildSuperRome` (record "Evocati").
//!
//! The lazily created `getGS6*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, cy_open, dir_down, oval_face, oval_shell, ring, v3};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`jednostki-p6-super.ts:144-158`)
const S6_SKIN: u32 = 0xe0ac69;
const S6_STEEL: u32 = 0xc2cad2;
const S6_SILVER: u32 = 0xd7dce2;
const S6_BRONZE: u32 = 0xcf9234;
const S6_BRONZE_LT: u32 = 0xd0a050;
const S6_GOLD: u32 = 0xe0b53a;
const S6_WOOD: u32 = 0x7a5c3a;
const S6_WOOD_DK: u32 = 0x5f4020;
const S6_LEATHER: u32 = 0x6b4a28;
const S6_ROMAN_RED: u32 = 0xa42a22;
const S6_MAIL: u32 = 0x8e99a6;
const S6_PURPLE: u32 = 0x7a2c96;
const S6_EYE: u32 = 0x1a1008;
const S6_DARK: u32 = 0x20180f;

const S6_MONT_Y_OFF: f64 = 0.068 * HEX_R;
const S6_COR_TIP: f64 = 0.34;
const S6_CLUB_TILT: f64 = 1.05;

// ── wymiary sylwetki (`:172-189`)
const S6_HIP_Y: f64 = 0.208 * HEX_R;
const S6_TORSO_W: f64 = 0.180 * HEX_R;
const S6_TORSO_H: f64 = 0.205 * HEX_R;
const S6_TORSO_D: f64 = 0.100 * HEX_R;
const S6_TORSO_BOT: f64 = 0.240 * HEX_R;
const S6_TORSO_CTR: f64 = S6_TORSO_BOT + S6_TORSO_H * 0.5;
const S6_TORSO_TOP: f64 = S6_TORSO_BOT + S6_TORSO_H;
const S6_NECK_H: f64 = 0.028 * HEX_R;
const S6_HEAD_S: f64 = 0.128 * HEX_R;
const S6_HEAD_CTR: f64 = S6_TORSO_TOP + S6_NECK_H + S6_HEAD_S * 0.5;
const S6_HEAD_TOP: f64 = S6_TORSO_TOP + S6_NECK_H + S6_HEAD_S;
const S6_SHLD_X: f64 = S6_TORSO_W * 0.5 + 0.030 * HEX_R;
const S6_SHLD_Y: f64 = S6_TORSO_TOP - 0.024 * HEX_R;
const S6_HIP_X: f64 = 0.052 * HEX_R;
const S6_THIGH_L: f64 = 0.104 * HEX_R;
const S6_SHIN_L: f64 = 0.096 * HEX_R;
const S6_UPARM_L: f64 = 0.100 * HEX_R;
const S6_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie (`:242-285`, `:326-327`)
fn g_torso() -> Geo {
    bx(S6_TORSO_W, S6_TORSO_H, S6_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, S6_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(S6_HEAD_S, S6_HEAD_S, S6_HEAD_S)
}
fn g_eye() -> Geo {
    bx(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, S6_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, S6_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, S6_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, S6_FOREARM_L, 0.040 * HEX_R)
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
fn g_greave() -> Geo {
    bx(0.046 * HEX_R, 0.098 * HEX_R, 0.050 * HEX_R)
}
fn g_pole() -> Geo {
    bx(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)
}
fn g_flag() -> Geo {
    bx(0.085 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)
}
fn g_finial() -> Geo {
    bx(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)
}
fn g_cor_dome() -> Geo {
    cy(0.066 * HEX_R, 0.084 * HEX_R, 0.128 * HEX_R, 9)
}
fn g_slit() -> Geo {
    bx(0.052 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)
}
fn g_crest_base() -> Geo {
    bx(0.024 * HEX_R, 0.034 * HEX_R, 0.130 * HEX_R)
}
fn g_crest_tall() -> Geo {
    bx(0.030 * HEX_R, 0.104 * HEX_R, 0.196 * HEX_R)
}
fn g_crest_curl() -> Geo {
    bx(0.030 * HEX_R, 0.052 * HEX_R, 0.034 * HEX_R)
}
fn g_pec_plate() -> Geo {
    bx(0.150 * HEX_R, 0.050 * HEX_R, 0.012 * HEX_R)
}
fn g_abs_plate() -> Geo {
    bx(0.104 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)
}
fn g_cloak() -> Geo {
    bx(0.196 * HEX_R, 0.170 * HEX_R, 0.014 * HEX_R)
}
fn g_aspis_face() -> Geo {
    cy(0.128 * HEX_R, 0.100 * HEX_R, 0.034 * HEX_R, 10)
}
fn g_aspis_rim() -> Geo {
    cy_open(0.140 * HEX_R, 0.140 * HEX_R, 0.020 * HEX_R, 10)
}
fn g_aspis_band() -> Geo {
    ring(0.094 * HEX_R, 0.126 * HEX_R, 14, 1)
}
fn g_club(i: usize) -> Geo {
    match i {
        0 => bx(0.042 * HEX_R, 0.074 * HEX_R, 0.014 * HEX_R),
        1 => bx(0.070 * HEX_R, 0.072 * HEX_R, 0.014 * HEX_R),
        _ => bx(0.102 * HEX_R, 0.066 * HEX_R, 0.014 * HEX_R),
    }
}
fn g_dory_shaft() -> Geo {
    bx(0.021 * HEX_R, 0.740 * HEX_R, 0.021 * HEX_R)
}
fn g_dory_tip() -> Geo {
    cn(0.020 * HEX_R, 0.062 * HEX_R, 4)
}
fn g_sauroter() -> Geo {
    bx(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R)
}
fn g_mont_bowl() -> Geo {
    cy(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8)
}
fn g_cheek() -> Geo {
    bx(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)
}
fn g_plume_rom() -> Geo {
    bx(0.026 * HEX_R, 0.118 * HEX_R, 0.013 * HEX_R)
}
fn g_phalera() -> Geo {
    bx(0.038 * HEX_R, 0.038 * HEX_R, 0.012 * HEX_R)
}
fn g_umbo() -> Geo {
    bx(0.050 * HEX_R, 0.050 * HEX_R, 0.024 * HEX_R)
}
fn g_wing_rom() -> Geo {
    bx(0.058 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)
}
fn g_wreath() -> Geo {
    cy_open(0.056 * HEX_R, 0.056 * HEX_R, 0.012 * HEX_R, 8)
}
fn g_blade() -> Geo {
    bx(0.026 * HEX_R, 0.135 * HEX_R, 0.014 * HEX_R)
}
fn g_blade_tip() -> Geo {
    cn(0.016 * HEX_R, 0.040 * HEX_R, 4)
}
fn g_guard() -> Geo {
    bx(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)
}
fn g_scut_shell() -> Geo {
    oval_shell(
        0.104 * HEX_R,
        0.190 * HEX_R,
        0.052 * HEX_R,
        0.020 * HEX_R,
        10,
    )
}
fn g_scut_face() -> Geo {
    oval_face(0.0874 * HEX_R, 0.1596 * HEX_R, 0.0367 * HEX_R, 10)
}

const fn lr(s: f64) -> &'static str {
    if s < 0.0 {
        "right"
    } else {
        "left"
    }
}

/// `s6Seg` (`:333-344`).
#[allow(clippy::too_many_arguments)]
fn s6_seg(
    m: &mut UnitModel,
    g: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    theta: f64,
    len: f64,
    nm: &str,
) -> Vec3 {
    let dir = dir_down(theta);
    let n = m.add_mesh(g, geo, mtl);
    n.rot_x(PI - theta).set_pos_v(add_scaled(p, dir, len * 0.5));
    if !nm.is_empty() {
        n.set_name(nm);
    }
    add_scaled(p, dir, len)
}

/// `s6BuildLeg` (`:345-360`).
#[allow(clippy::too_many_arguments)]
fn s6_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
    hip_y: f64,
    pf: &str,
    side: &str,
) {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-leg-{side}-{part}")
        }
    };
    let mut p = v3(sx, hip_y, 0.0);
    p = s6_seg(m, g, g_thigh(), m_thigh, p, th_u, S6_THIGH_L, &nm("thigh"));
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = s6_seg(m, g, g_shin(), m_shin, p, th_l, S6_SHIN_L, &nm("shin"));
    let foot = m.add_mesh_id(g, g_foot(), m_foot);
    m.node(foot).set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
    if !pf.is_empty() {
        m.node(foot).set_name(&nm("foot"));
    }
}

/// `s6BuildArm` (`:361-380`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn s6_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
    pf: &str,
    side: &str,
) -> (Vec3, Vec3) {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-arm-{side}-{part}")
        }
    };
    let mut p = v3(sx, S6_SHLD_Y, 0.0);
    p = s6_seg(m, g, g_up_arm(), m_up, p, th_u, S6_UPARM_L, &nm("upper"));
    p.y += 0.010 * HEX_R;
    let wrist = s6_seg(
        m,
        g,
        g_forearm(),
        m_fore,
        p,
        th_f,
        S6_FOREARM_L,
        &nm("fore"),
    );
    if let Some(mf) = m_fist {
        let fist = m.add_mesh_id(g, g_fist(), mf);
        m.node(fist)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
        if !pf.is_empty() {
            m.node(fist).set_name(&nm("fist"));
        }
    }
    (wrist, dir_down(th_f))
}

/// `s6Core` (`:382-410`): returns the skin material.
fn s6_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin: u32, eyes: bool, pf: &str) -> MatId {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-{part}")
        }
    };
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, S6_TORSO_CTR, 0.0)
        .set_name(&nm("torso"));
    let m_skin = m.mat(skin, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, S6_TORSO_TOP + S6_NECK_H * 0.5, 0.0)
        .set_name(&nm("neck"));
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, S6_HEAD_CTR, 0.0)
        .set_name(&nm("head"));
    if eyes {
        let m_eye = m.mat(S6_EYE, 0.02, 0.95);
        for sx in [-1.0_f64, 1.0] {
            m.add_mesh(g, g_eye(), m_eye)
                .set_pos(
                    sx * 0.028 * HEX_R,
                    S6_HEAD_CTR + 0.008 * HEX_R,
                    S6_HEAD_S * 0.5 + 0.004 * HEX_R,
                )
                .set_name(&nm(&format!("eye-{}", lr(sx))));
        }
    }
    m_skin
}

/// `s6Banner` (`:415-435`).
fn s6_banner(
    m: &mut UnitModel,
    g: NodeId,
    m_pole: MatId,
    m_flag: MatId,
    m_gold: MatId,
    pf: &str,
    sx: f64,
) {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-banner-{part}")
        }
    };
    m.add_mesh(g, g_pole(), m_pole)
        .rot_x(-0.14)
        .set_pos(sx * 0.052 * HEX_R, 0.340 * HEX_R, -0.086 * HEX_R)
        .set_name(&nm("pole"));
    m.add_mesh(g, g_flag(), m_flag)
        .rot_x(-0.14)
        .set_pos(sx * 0.100 * HEX_R, 0.548 * HEX_R, -0.115 * HEX_R)
        .set_name(&nm("flag"));
    m.add_mesh(g, g_finial(), m_gold)
        .set_pos(sx * 0.052 * HEX_R, 0.600 * HEX_R, -0.122 * HEX_R)
        .set_name(&nm("finial"));
}

/// `buildSuperGreece(ownerColor)` (`jednostki-p6-super.ts:512-707`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_super_greece(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(S6_BRONZE, 0.40, 0.42);
    let m_bronz_l = m.mat(S6_BRONZE_LT, 0.55, 0.35);
    let m_gold = m.mat(S6_GOLD, 0.58, 0.32);
    let m_steel = m.mat(S6_STEEL, 0.50, 0.40);
    let m_purple = m.mat(S6_PURPLE, 0.06, 0.78);
    let m_owner = m.mat(owner, 0.16, 0.62);
    let m_wood = m.mat(S6_WOOD, 0.05, 0.85);
    let m_wood_d = m.mat(S6_WOOD_DK, 0.05, 0.85);
    let m_leath = m.mat(S6_LEATHER, 0.06, 0.82);
    let m_dark = m.mat(S6_DARK, 0.05, 0.90);

    let hip_y = S6_HIP_Y - 0.012 * HEX_R;

    let m_skin = s6_core(&mut m, g, m_bronze, S6_SKIN, true, "hl");
    m.add_mesh(g, g_pec_plate(), m_gold)
        .set_pos(
            0.0,
            S6_TORSO_CTR + 0.048 * HEX_R,
            S6_TORSO_D * 0.5 + 0.008 * HEX_R,
        )
        .set_name("hl-cuirass-pec");
    m.add_mesh(g, g_abs_plate(), m_gold)
        .set_pos(
            0.0,
            S6_TORSO_CTR - 0.024 * HEX_R,
            S6_TORSO_D * 0.5 + 0.008 * HEX_R,
        )
        .set_name("hl-cuirass-abs");
    m.add_mesh(g, g_cloak(), m_purple)
        .rot_x(0.16)
        .set_pos(
            0.0,
            S6_TORSO_CTR + 0.012 * HEX_R,
            -S6_TORSO_D * 0.5 - 0.016 * HEX_R,
        )
        .set_name("hl-cloak");
    m.add_mesh(g, g_skirt(), m_leath)
        .set_pos(0.0, S6_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("hl-pteruges");
    m.add_mesh(g, g_belt(), m_gold)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("hl-belt");

    s6_build_leg(
        &mut m, g, S6_HIP_X, 0.55, 0.30, m_bronze, m_skin, m_leath, hip_y, "hl", "left",
    );
    s6_build_leg(
        &mut m, g, -S6_HIP_X, -0.50, -0.16, m_bronze, m_skin, m_leath, hip_y, "hl", "right",
    );
    m.add_mesh(g, g_greave(), m_gold)
        .rot_x(PI - 0.30)
        .set_pos(S6_HIP_X, 0.072 * HEX_R, 0.070 * HEX_R)
        .set_name("hl-greave-left");
    m.add_mesh(g, g_greave(), m_gold)
        .rot_x(PI + 0.16)
        .set_pos(-S6_HIP_X, 0.068 * HEX_R, -0.052 * HEX_R)
        .set_name("hl-greave-right");

    m.add_mesh(g, g_cor_dome(), m_bronze)
        .rot_x(-S6_COR_TIP)
        .set_pos(0.0, S6_HEAD_CTR + 0.072 * HEX_R, -0.016 * HEX_R)
        .set_name("hl-helmet-dome");
    m.add_mesh(g, g_slit(), m_dark)
        .rot_x(-S6_COR_TIP)
        .set_pos(0.0, S6_HEAD_CTR + 0.062 * HEX_R, 0.052 * HEX_R)
        .set_name("hl-helmet-slit");
    m.add_mesh(g, g_crest_base(), m_gold)
        .set_pos(0.0, S6_HEAD_TOP + 0.078 * HEX_R, -0.024 * HEX_R)
        .set_name("hl-crest-base");
    m.add_mesh(g, g_crest_tall(), m_purple)
        .rot_x(0.10)
        .set_pos(0.0, S6_HEAD_TOP + 0.146 * HEX_R, -0.030 * HEX_R)
        .set_name("hl-crest-hair");
    m.add_mesh(g, g_crest_curl(), m_purple)
        .rot_x(0.42)
        .set_pos(0.0, S6_HEAD_TOP + 0.178 * HEX_R, 0.068 * HEX_R)
        .set_name("hl-crest-curl");

    let (wrist_r, axis_r) = s6_build_arm(
        &mut m,
        g,
        -S6_SHLD_X,
        -2.55,
        1.85,
        m_bronze,
        m_skin,
        Some(m_leath),
        "hl",
        "right",
    );
    let spear_th = PI * 0.5 + 0.20;
    let spear_axis = v3(0.0, -js_sin(0.20), js_cos(0.20));
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_dory_shaft(), m_wood)
        .rot_x(spear_th)
        .set_pos_v(add_scaled(grip, spear_axis, 0.130 * HEX_R))
        .set_name("hl-dory-shaft");
    m.add_mesh(g, g_dory_tip(), m_steel)
        .rot_x(spear_th)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(
            grip,
            spear_axis,
            (0.130 + 0.370 + 0.028) * HEX_R,
        ))
        .set_name("hl-dory-tip");
    m.add_mesh(g, g_sauroter(), m_bronz_l)
        .rot_x(spear_th)
        .set_pos_v(add_scaled(
            grip,
            spear_axis,
            (0.130 - 0.370 - 0.024) * HEX_R,
        ))
        .set_name("hl-sauroter");

    let (wrist_l, _) = s6_build_arm(
        &mut m, g, S6_SHLD_X, 0.52, 1.05, m_bronze, m_skin, None, "hl", "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.055 * HEX_R,
            wrist_l.y + 0.065 * HEX_R,
            wrist_l.z + 0.052 * HEX_R,
        )
        .rot_y(-0.20);
    m.add_mesh(sh, g_aspis_face(), m_owner)
        .rot_x(PI / 2.0)
        .set_name("hl-shield-face");
    m.add_mesh(sh, g_aspis_rim(), m_gold)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, -0.004 * HEX_R)
        .set_name("hl-shield-rim");
    m.add_mesh(sh, g_aspis_band(), m_gold)
        .set_pos(0.0, 0.0, 0.021 * HEX_R)
        .set_name("hl-shield-band");
    let club_d = [-0.068_f64, -0.004, 0.056];
    for (i, &d) in club_d.iter().enumerate() {
        m.add_mesh(sh, g_club(i), m_gold)
            .rot_z(S6_CLUB_TILT)
            .set_pos(
                -d * js_sin(S6_CLUB_TILT) * HEX_R,
                d * js_cos(S6_CLUB_TILT) * HEX_R,
                0.026 * HEX_R,
            )
            .set_name(&format!("hl-episema-club-{i}"));
    }
    m.attach(g, sh);

    s6_banner(&mut m, g, m_wood_d, m_owner, m_gold, "hl", 1.0);
    m
}

/// `buildSuperRome(ownerColor)` (`jednostki-p6-super.ts:768-911`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_super_rome(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_gold = m.mat(S6_GOLD, 0.58, 0.32);
    let m_silver = m.mat(S6_SILVER, 0.62, 0.28);
    let m_steel = m.mat(S6_STEEL, 0.55, 0.35);
    let m_mail = m.mat(S6_MAIL, 0.55, 0.52);
    let m_red = m.mat(S6_ROMAN_RED, 0.05, 0.80);
    let m_purple = m.mat(S6_PURPLE, 0.08, 0.72);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_leath = m.mat(S6_LEATHER, 0.05, 0.82);
    let m_wood_d = m.mat(S6_WOOD_DK, 0.05, 0.85);

    let hip_y = S6_HIP_Y - 0.012 * HEX_R;

    let m_skin = s6_core(&mut m, g, m_mail, S6_SKIN, true, "ev");
    m.add_mesh(g, g_skirt(), m_red)
        .set_pos(0.0, S6_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("ev-tunic-hem");
    m.add_mesh(g, g_belt(), m_mail)
        .set_pos(0.0, S6_TORSO_BOT + 0.008 * HEX_R, 0.0)
        .set_name("ev-mail-hem");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("ev-belt");
    for (fi, dx) in [-0.052_f64, 0.0, 0.052].into_iter().enumerate() {
        let mt = if fi % 2 == 0 { m_gold } else { m_silver };
        m.add_mesh(g, g_phalera(), mt)
            .rot_z(PI / 4.0)
            .set_pos(
                dx * HEX_R,
                S6_TORSO_CTR + 0.034 * HEX_R,
                S6_TORSO_D * 0.5 + 0.010 * HEX_R,
            )
            .set_name(&format!("ev-phalera-{fi}"));
    }

    s6_build_leg(
        &mut m, g, S6_HIP_X, 0.58, 0.34, m_red, m_skin, m_leath, hip_y, "ev", "left",
    );
    s6_build_leg(
        &mut m, g, -S6_HIP_X, -0.52, -0.20, m_red, m_skin, m_leath, hip_y, "ev", "right",
    );

    m.add_mesh(g, g_mont_bowl(), m_silver)
        .set_pos(0.0, S6_HEAD_CTR + S6_MONT_Y_OFF, 0.0)
        .set_name("ev-helmet-bowl");
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_cheek(), m_gold)
            .set_pos(
                sx * (S6_HEAD_S * 0.5 + 0.004 * HEX_R),
                S6_HEAD_CTR + 0.000 * HEX_R,
                0.018 * HEX_R,
            )
            .set_name(&format!("ev-helmet-cheek-{}", lr(sx)));
    }
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_plume_rom(), m_purple)
            .rot_z(-sx * 0.12)
            .set_pos(sx * 0.026 * HEX_R, S6_HEAD_TOP + 0.086 * HEX_R, 0.0)
            .set_name(&format!("ev-plume-{}", lr(sx)));
    }

    let (wrist_r, axis_r) = s6_build_arm(
        &mut m,
        g,
        -S6_SHLD_X,
        0.95,
        1.50,
        m_red,
        m_skin,
        Some(m_leath),
        "ev",
        "right",
    );
    m.add_mesh(g, g_blade(), m_steel)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, axis_r, 0.098 * HEX_R))
        .set_name("ev-sword-blade");
    m.add_mesh(g, g_blade_tip(), m_steel)
        .rot_x(PI - 1.50)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, axis_r, 0.1875 * HEX_R))
        .set_name("ev-sword-tip");
    m.add_mesh(g, g_guard(), m_gold)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, axis_r, 0.030 * HEX_R))
        .set_name("ev-sword-guard");

    let (wrist_l, _) = s6_build_arm(
        &mut m, g, S6_SHLD_X, 0.50, 1.10, m_red, m_skin, None, "ev", "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y + 0.034 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.22);
    m.add_mesh(sh, g_scut_shell(), m_leath)
        .set_name("ev-shield-shell");
    m.add_mesh(sh, g_scut_face(), m_owner)
        .set_pos(0.0, 0.0, 0.016 * HEX_R)
        .set_name("ev-shield-face");
    m.add_mesh(sh, g_wreath(), m_gold)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, 0.024 * HEX_R)
        .set_name("ev-shield-wreath");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(sh, g_wing_rom(), m_gold)
            .rot_z(s * 0.45)
            .set_pos(s * 0.062 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R)
            .set_name(&format!("ev-shield-wing-{}", lr(s)));
    }
    m.add_mesh(sh, g_umbo(), m_gold)
        .set_pos(0.0, 0.0, 0.032 * HEX_R)
        .set_name("ev-shield-umbo");
    m.attach(g, sh);

    s6_banner(&mut m, g, m_wood_d, m_owner, m_gold, "ev", -1.0);
    m
}
