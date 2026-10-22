//! Port of `render/jednostki-z2-srodziemne.ts` (`edb8fb56`):
//! `buildTyrskiMiecznik`, `buildGwardiaTyrenska`, `buildZelaznyKhopesh`,
//! `buildThorakites`, `buildTriari` (all five exports).
//!
//! The lazily created `getGZ2*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, cy_open, dir_down, oval_face, oval_shell, v3};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── kolory serii (`jednostki-z2-srodziemne.ts:212-231`)
const Z2_SKIN: u32 = 0xe0ac69;
const Z2_STEEL: u32 = 0xc2cad2;
const Z2_STEEL_DK: u32 = 0x8e99a6;
const Z2_BRONZE: u32 = 0xcf9234;
const Z2_BRONZE_LT: u32 = 0xd0a050;
const Z2_BRONZE_DK: u32 = 0x9a6b20;
const Z2_CRIMSON: u32 = 0xa01f2e;
const Z2_GOLD: u32 = 0xd8b040;
const Z2_WOOD: u32 = 0x7a5c3a;
const Z2_WOOD_DK: u32 = 0x5c452c;
const Z2_LEATHER: u32 = 0x6b4a28;
const Z2_LINEN: u32 = 0xe8e0c8;
const Z2_CREAM: u32 = 0xe6d9b8;
const Z2_PURPLE: u32 = 0x6e2170;
const Z2_ROMAN_RED: u32 = 0xa42a22;
const Z2_KHEP_DK: u32 = 0x233a5e;
const Z2_WHITE: u32 = 0xe8e4da;
const Z2_GREY: u32 = 0xb9b5ac;
const Z2_DARK: u32 = 0x20180f;
const Z2_EYE: u32 = 0x1a1a1a;

// ── wymiary sylwetki (`:234-251`)
const Z2_HIP_Y: f64 = 0.208 * HEX_R;
const Z2_TORSO_W: f64 = 0.180 * HEX_R;
const Z2_TORSO_H: f64 = 0.205 * HEX_R;
const Z2_TORSO_D: f64 = 0.100 * HEX_R;
const Z2_TORSO_BOT: f64 = 0.240 * HEX_R;
const Z2_TORSO_CTR: f64 = Z2_TORSO_BOT + Z2_TORSO_H * 0.5;
const Z2_TORSO_TOP: f64 = Z2_TORSO_BOT + Z2_TORSO_H;
const Z2_NECK_H: f64 = 0.028 * HEX_R;
const Z2_HEAD_S: f64 = 0.128 * HEX_R;
const Z2_HEAD_CTR: f64 = Z2_TORSO_TOP + Z2_NECK_H + Z2_HEAD_S * 0.5;
const Z2_HEAD_TOP: f64 = Z2_TORSO_TOP + Z2_NECK_H + Z2_HEAD_S;
const Z2_SHLD_X: f64 = Z2_TORSO_W * 0.5 + 0.030 * HEX_R;
const Z2_SHLD_Y: f64 = Z2_TORSO_TOP - 0.024 * HEX_R;
const Z2_HIP_X: f64 = 0.052 * HEX_R;
const Z2_THIGH_L: f64 = 0.104 * HEX_R;
const Z2_SHIN_L: f64 = 0.096 * HEX_R;
const Z2_UPARM_L: f64 = 0.100 * HEX_R;
const Z2_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie (`:319-374`, `:415-418`)
fn g_torso() -> Geo {
    bx(Z2_TORSO_W, Z2_TORSO_H, Z2_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, Z2_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(Z2_HEAD_S, Z2_HEAD_S, Z2_HEAD_S)
}
fn g_eye() -> Geo {
    bx(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, Z2_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, Z2_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, Z2_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, Z2_FOREARM_L, 0.040 * HEX_R)
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
fn g_hem() -> Geo {
    bx(0.198 * HEX_R, 0.026 * HEX_R, 0.120 * HEX_R)
}
fn g_greave() -> Geo {
    bx(0.046 * HEX_R, 0.098 * HEX_R, 0.050 * HEX_R)
}
fn g_sash() -> Geo {
    bx(0.052 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)
}
fn g_bowl() -> Geo {
    cy_open(0.062 * HEX_R, 0.090 * HEX_R, 0.066 * HEX_R, 8)
}
fn g_bowl_top() -> Geo {
    cy(0.024 * HEX_R, 0.060 * HEX_R, 0.034 * HEX_R, 8)
}
fn g_crest_base() -> Geo {
    bx(0.020 * HEX_R, 0.026 * HEX_R, 0.104 * HEX_R)
}
fn g_crest_hair() -> Geo {
    bx(0.024 * HEX_R, 0.058 * HEX_R, 0.138 * HEX_R)
}
fn g_att_bowl() -> Geo {
    cy(0.056 * HEX_R, 0.086 * HEX_R, 0.092 * HEX_R, 8)
}
fn g_att_brow() -> Geo {
    cy_open(0.097 * HEX_R, 0.097 * HEX_R, 0.028 * HEX_R, 8)
}
fn g_cheek() -> Geo {
    bx(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)
}
fn g_khep() -> Geo {
    cy(0.050 * HEX_R, 0.090 * HEX_R, 0.110 * HEX_R, 8)
}
fn g_kh_band() -> Geo {
    cy_open(0.094 * HEX_R, 0.094 * HEX_R, 0.022 * HEX_R, 8)
}
fn g_uraeus() -> Geo {
    bx(0.016 * HEX_R, 0.034 * HEX_R, 0.013 * HEX_R)
}
fn g_mont_bowl() -> Geo {
    cy(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8)
}
fn g_feather() -> Geo {
    bx(0.026 * HEX_R, 0.108 * HEX_R, 0.012 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.086 * HEX_R, 0.040 * HEX_R, 0.022 * HEX_R)
}
fn g_sh_face() -> Geo {
    cy(0.112 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 10)
}
fn g_sh_rim() -> Geo {
    cy_open(0.122 * HEX_R, 0.122 * HEX_R, 0.016 * HEX_R, 10)
}
fn g_sh_face_b() -> Geo {
    cy(0.126 * HEX_R, 0.098 * HEX_R, 0.032 * HEX_R, 10)
}
fn g_sh_rim_b() -> Geo {
    cy_open(0.137 * HEX_R, 0.137 * HEX_R, 0.018 * HEX_R, 10)
}
fn g_sh_boss() -> Geo {
    bx(0.036 * HEX_R, 0.036 * HEX_R, 0.026 * HEX_R)
}
fn g_petal() -> Geo {
    bx(0.030 * HEX_R, 0.150 * HEX_R, 0.012 * HEX_R)
}
fn g_rect_pl() -> Geo {
    bx(0.148 * HEX_R, 0.190 * HEX_R, 0.016 * HEX_R)
}
fn g_rect_top() -> Geo {
    bx(0.118 * HEX_R, 0.036 * HEX_R, 0.016 * HEX_R)
}
fn g_rect_cap() -> Geo {
    bx(0.072 * HEX_R, 0.024 * HEX_R, 0.016 * HEX_R)
}
fn g_spine() -> Geo {
    bx(0.020 * HEX_R, 0.330 * HEX_R, 0.012 * HEX_R)
}
fn g_spine_umb() -> Geo {
    bx(0.042 * HEX_R, 0.078 * HEX_R, 0.026 * HEX_R)
}
fn g_spina() -> Geo {
    bx(0.020 * HEX_R, 0.300 * HEX_R, 0.014 * HEX_R)
}
fn g_umbo() -> Geo {
    bx(0.052 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)
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
fn g_dory() -> Geo {
    bx(0.021 * HEX_R, 0.700 * HEX_R, 0.021 * HEX_R)
}
fn g_kh_str() -> Geo {
    bx(0.024 * HEX_R, 0.096 * HEX_R, 0.013 * HEX_R)
}
fn g_kh_seg() -> Geo {
    bx(0.024 * HEX_R, 0.064 * HEX_R, 0.013 * HEX_R)
}
fn g_hasta() -> Geo {
    bx(0.021 * HEX_R, 0.920 * HEX_R, 0.021 * HEX_R)
}
fn g_hasta_tip() -> Geo {
    cn(0.020 * HEX_R, 0.062 * HEX_R, 4)
}
fn g_scale_band() -> Geo {
    bx(0.186 * HEX_R, 0.026 * HEX_R, 0.106 * HEX_R)
}
fn g_belt_wide() -> Geo {
    bx(0.192 * HEX_R, 0.056 * HEX_R, 0.114 * HEX_R)
}
fn g_harness() -> Geo {
    bx(0.152 * HEX_R, 0.026 * HEX_R, 0.012 * HEX_R)
}
fn g_phalera() -> Geo {
    bx(0.038 * HEX_R, 0.038 * HEX_R, 0.012 * HEX_R)
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
fn g_thur_shell() -> Geo {
    oval_shell(
        0.092 * HEX_R,
        0.180 * HEX_R,
        0.030 * HEX_R,
        0.018 * HEX_R,
        10,
    )
}
fn g_thur_face() -> Geo {
    oval_face(0.077 * HEX_R, 0.151 * HEX_R, 0.021 * HEX_R, 10)
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

/// `z2Seg` (`:426-437`).
#[allow(clippy::too_many_arguments)]
fn z2_seg(
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

/// `z2BuildLeg` (`:438-453`).
#[allow(clippy::too_many_arguments)]
fn z2_build_leg(
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
    p = z2_seg(m, g, g_thigh(), m_thigh, p, th_u, Z2_THIGH_L, &nm("thigh"));
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = z2_seg(m, g, g_shin(), m_shin, p, th_l, Z2_SHIN_L, &nm("shin"));
    let foot = m.add_mesh_id(g, g_foot(), m_foot);
    m.node(foot).set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
    if !pf.is_empty() {
        m.node(foot).set_name(&nm("foot"));
    }
}

/// `z2BuildArm` (`:454-474`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn z2_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
    shld_y: f64,
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
    let mut p = v3(sx, shld_y, 0.0);
    p = z2_seg(m, g, g_up_arm(), m_up, p, th_u, Z2_UPARM_L, &nm("upper"));
    p.y += 0.010 * HEX_R;
    let wrist = z2_seg(
        m,
        g,
        g_forearm(),
        m_fore,
        p,
        th_f,
        Z2_FOREARM_L,
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

/// `z2Core` (`:476-504`): returns the skin material.
fn z2_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, eyes: bool, pf: &str) -> MatId {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-{part}")
        }
    };
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, Z2_TORSO_CTR, 0.0)
        .set_name(&nm("torso"));
    let m_skin = m.mat(Z2_SKIN, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, Z2_TORSO_TOP + Z2_NECK_H * 0.5, 0.0)
        .set_name(&nm("neck"));
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, Z2_HEAD_CTR, 0.0)
        .set_name(&nm("head"));
    if eyes {
        let m_eye = m.mat(Z2_EYE, 0.02, 0.95);
        for sx in [-1.0_f64, 1.0] {
            m.add_mesh(g, g_eye(), m_eye)
                .set_pos(
                    sx * 0.028 * HEX_R,
                    Z2_HEAD_CTR + 0.008 * HEX_R,
                    Z2_HEAD_S * 0.5 + 0.004 * HEX_R,
                )
                .set_name(&nm(&format!("eye-{}", lr(sx))));
        }
    }
    m_skin
}

/// `z2IronSword` (`:506-528`).
#[allow(clippy::too_many_arguments)]
fn z2_iron_sword(
    m: &mut UnitModel,
    g: NodeId,
    wrist: Vec3,
    axis: Vec3,
    th_f: f64,
    m_blade: MatId,
    m_guard: MatId,
    blade_geo: Geo,
    pf: &str,
) {
    let named = |s: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-sword-{s}")
        }
    };
    m.add_mesh(g, blade_geo, m_blade)
        .rot_x(PI - th_f)
        .set_pos_v(add_scaled(wrist, axis, 0.098 * HEX_R))
        .set_name(&named("blade"));
    m.add_mesh(g, g_blade_tip(), m_blade)
        .rot_x(PI - th_f)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist, axis, 0.1875 * HEX_R))
        .set_name(&named("tip"));
    m.add_mesh(g, g_guard(), m_guard)
        .rot_x(PI - th_f)
        .set_pos_v(add_scaled(wrist, axis, 0.030 * HEX_R))
        .set_name(&named("guard"));
}

/// `z2RoundShield` (`:530-545`): a detached group.
fn z2_round_shield(m: &mut UnitModel, m_face: MatId, m_rim: MatId, big: bool, pf: &str) -> NodeId {
    let sh = m.detached_group();
    let face = if big { g_sh_face_b() } else { g_sh_face() };
    let rim = if big { g_sh_rim_b() } else { g_sh_rim() };
    let f = m.add_mesh_id(sh, face, m_face);
    m.node(f).rot_x(PI / 2.0);
    if !pf.is_empty() {
        m.node(f).set_name(&format!("{pf}-shield-face"));
    }
    let r = m.add_mesh_id(sh, rim, m_rim);
    m.node(r).rot_x(PI / 2.0).set_pos(0.0, 0.0, -0.004 * HEX_R);
    if !pf.is_empty() {
        m.node(r).set_name(&format!("{pf}-shield-rim"));
    }
    sh
}

/// `z2MountShield` (`:547-555`).
fn z2_mount_shield(m: &mut UnitModel, g: NodeId, sh: NodeId, wrist: Vec3) {
    m.node(sh)
        .set_pos(
            wrist.x - 0.030 * HEX_R,
            wrist.y + 0.045 * HEX_R,
            wrist.z + 0.050 * HEX_R,
        )
        .rot_y(-0.20);
    m.attach(g, sh);
}

/// `z2Banner` (`:557-577`).
#[allow(clippy::too_many_arguments)]
fn z2_banner(
    m: &mut UnitModel,
    g: NodeId,
    m_pole: MatId,
    m_flag: MatId,
    m_gold: MatId,
    dy: f64,
    pf: &str,
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
        .set_pos(-0.052 * HEX_R, 0.340 * HEX_R + dy, -0.086 * HEX_R)
        .set_name(&nm("pole"));
    m.add_mesh(g, g_flag(), m_flag)
        .rot_x(-0.14)
        .set_pos(-0.100 * HEX_R, 0.548 * HEX_R + dy, -0.115 * HEX_R)
        .set_name(&nm("flag"));
    m.add_mesh(g, g_finial(), m_gold)
        .set_pos(-0.052 * HEX_R, 0.600 * HEX_R + dy, -0.122 * HEX_R)
        .set_name(&nm("finial"));
}

/// `buildTyrskiMiecznik(ownerColor)` (`jednostki-z2-srodziemne.ts:651-742`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_tyrski_miecznik(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_purple = m.mat(Z2_PURPLE, 0.06, 0.78);
    let m_cream = m.mat(Z2_CREAM, 0.06, 0.82);
    let m_bronze = m.mat(Z2_BRONZE, 0.35, 0.50);
    let m_steel = m.mat(Z2_STEEL, 0.60, 0.30);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_leath = m.mat(Z2_LEATHER, 0.06, 0.82);
    let m_dark = m.mat(Z2_DARK, 0.05, 0.88);

    let hip_y = Z2_HIP_Y - 0.012 * HEX_R;
    let thf = 1.50;

    let m_skin = z2_core(&mut m, g, m_purple, false, "tm");
    m.add_mesh(g, g_skirt(), m_purple)
        .set_pos(0.0, Z2_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("tm-skirt");
    m.add_mesh(g, g_hem(), m_cream)
        .set_pos(0.0, Z2_TORSO_BOT - 0.052 * HEX_R, 0.0)
        .set_name("tm-hem");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.256 * HEX_R, 0.0)
        .set_name("tm-belt");
    m.add_mesh(g, g_sash(), m_owner)
        .rot_z(0.45)
        .set_pos(
            0.012 * HEX_R,
            Z2_TORSO_CTR + 0.010 * HEX_R,
            Z2_TORSO_D * 0.5 + 0.008 * HEX_R,
        )
        .set_name("tm-sash");

    z2_build_leg(
        &mut m, g, Z2_HIP_X, 0.56, 0.32, m_purple, m_skin, m_leath, hip_y, "tm", "left",
    );
    z2_build_leg(
        &mut m, g, -Z2_HIP_X, -0.50, -0.18, m_purple, m_skin, m_leath, hip_y, "tm", "right",
    );

    m.add_mesh(g, g_bowl(), m_steel)
        .set_pos(0.0, Z2_HEAD_CTR + 0.038 * HEX_R, 0.0)
        .set_name("tm-helmet-bowl");
    m.add_mesh(g, g_bowl_top(), m_steel)
        .set_pos(0.0, Z2_HEAD_CTR + 0.088 * HEX_R, 0.0)
        .set_name("tm-helmet-dome");
    m.add_mesh(g, g_finial(), m_dark)
        .set_pos(0.0, Z2_HEAD_TOP + 0.052 * HEX_R, -0.008 * HEX_R)
        .set_name("tm-helmet-tuft");

    let (wrist_r, axis_r) = z2_build_arm(
        &mut m,
        g,
        -Z2_SHLD_X,
        0.95,
        thf,
        m_purple,
        m_skin,
        Some(m_leath),
        Z2_SHLD_Y,
        "tm",
        "right",
    );
    z2_iron_sword(
        &mut m,
        g,
        wrist_r,
        axis_r,
        thf,
        m_steel,
        m_bronze,
        g_blade(),
        "tm",
    );

    let (wrist_l, _) = z2_build_arm(
        &mut m, g, Z2_SHLD_X, 0.52, 1.05, m_purple, m_skin, None, Z2_SHLD_Y, "tm", "left",
    );
    let sh = z2_round_shield(&mut m, m_owner, m_bronze, false, "tm");
    for i in 0..3_u32 {
        let id = m.add_mesh_id(sh, g_petal(), m_cream);
        m.node(id).rot_z(f64::from(i) * PI / 3.0);
        m.node(id).position.z = 0.018 * HEX_R;
        m.node(id).set_name(&format!("tm-shield-petal-{i}"));
    }
    let hub = m.add_mesh_id(sh, g_sh_boss(), m_bronze);
    m.node(hub).position.z = 0.025 * HEX_R;
    m.node(hub).set_name("tm-shield-boss");
    z2_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildGwardiaTyrenska(ownerColor)` (`:806-921`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_gwardia_tyrenska(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_purple = m.mat(Z2_PURPLE, 0.06, 0.78);
    let m_gold = m.mat(Z2_GOLD, 0.55, 0.35);
    let m_steel = m.mat(Z2_STEEL, 0.60, 0.30);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_leath = m.mat(Z2_LEATHER, 0.06, 0.82);
    let m_crest = m.mat(Z2_DARK, 0.05, 0.85);

    let hip_y = Z2_HIP_Y - 0.012 * HEX_R;
    let thu = 3.40;
    let thf = 4.10;

    let m_skin = z2_core(&mut m, g, m_purple, false, "gt");
    m.add_mesh(g, g_skirt(), m_purple)
        .set_pos(0.0, Z2_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("gt-skirt");
    m.add_mesh(g, g_hem(), m_gold)
        .set_pos(0.0, Z2_TORSO_BOT - 0.052 * HEX_R, 0.0)
        .set_name("gt-hem");
    m.add_mesh(g, g_belt_wide(), m_leath)
        .set_pos(0.0, 0.258 * HEX_R, 0.0)
        .set_name("gt-belt");
    m.add_mesh(g, g_sash(), m_gold)
        .rot_z(0.45)
        .set_pos(
            0.012 * HEX_R,
            Z2_TORSO_CTR + 0.010 * HEX_R,
            Z2_TORSO_D * 0.5 + 0.008 * HEX_R,
        )
        .set_name("gt-sash");

    z2_build_leg(
        &mut m, g, Z2_HIP_X, 0.56, 0.32, m_purple, m_skin, m_leath, hip_y, "gt", "left",
    );
    z2_build_leg(
        &mut m, g, -Z2_HIP_X, -0.50, -0.18, m_purple, m_skin, m_leath, hip_y, "gt", "right",
    );
    m.add_mesh(g, g_greave(), m_gold)
        .rot_x(PI - 0.32)
        .set_pos(Z2_HIP_X, 0.072 * HEX_R, 0.066 * HEX_R)
        .set_name("gt-greave");

    m.add_mesh(g, g_bowl(), m_gold)
        .set_pos(0.0, Z2_HEAD_CTR + 0.038 * HEX_R, 0.0)
        .set_name("gt-helmet-bowl");
    m.add_mesh(g, g_bowl_top(), m_gold)
        .set_pos(0.0, Z2_HEAD_CTR + 0.088 * HEX_R, 0.0)
        .set_name("gt-helmet-dome");
    m.add_mesh(g, g_crest_base(), m_gold)
        .set_pos(0.0, Z2_HEAD_TOP + 0.048 * HEX_R, -0.004 * HEX_R)
        .set_name("gt-crest-base");
    m.add_mesh(g, g_crest_hair(), m_crest)
        .rot_x(0.10)
        .set_pos(0.0, Z2_HEAD_TOP + 0.090 * HEX_R, -0.008 * HEX_R)
        .set_name("gt-crest-hair");

    let (wrist_r, axis_r) = z2_build_arm(
        &mut m,
        g,
        -Z2_SHLD_X,
        thu,
        thf,
        m_purple,
        m_skin,
        Some(m_leath),
        Z2_SHLD_Y,
        "gt",
        "right",
    );
    z2_iron_sword(
        &mut m,
        g,
        wrist_r,
        axis_r,
        thf,
        m_steel,
        m_gold,
        g_blade(),
        "gt",
    );

    let (wrist_l, _) = z2_build_arm(
        &mut m, g, Z2_SHLD_X, 0.50, 1.02, m_purple, m_skin, None, Z2_SHLD_Y, "gt", "left",
    );
    let sh = z2_round_shield(&mut m, m_owner, m_gold, true, "gt");
    for i in 0..4_u32 {
        let id = m.add_mesh_id(sh, g_petal(), m_gold);
        m.node(id).rot_z(f64::from(i) * PI / 4.0);
        m.node(id).position.z = 0.019 * HEX_R;
        m.node(id).set_name(&format!("gt-shield-ray-{i}"));
    }
    let hub = m.add_mesh_id(sh, g_sh_boss(), m_gold);
    m.node(hub).position.z = 0.026 * HEX_R;
    m.node(hub).set_name("gt-shield-boss");
    z2_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildZelaznyKhopesh(ownerColor)` (`:1002-1126`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_zelazny_khopesh(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(Z2_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(Z2_BRONZE_LT, 0.52, 0.38);
    let m_steel = m.mat(Z2_STEEL, 0.62, 0.28);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_linen = m.mat(Z2_LINEN, 0.05, 0.86);
    let m_blue_d = m.mat(Z2_KHEP_DK, 0.06, 0.72);
    let m_gold = m.mat(Z2_GOLD, 0.55, 0.38);
    let m_leath = m.mat(Z2_LEATHER, 0.06, 0.82);

    let hip_y = Z2_HIP_Y - 0.012 * HEX_R;
    let thu = 3.30;
    let thf = 4.049;
    let kh_roll = -1.15;

    let m_skin = z2_core(&mut m, g, m_linen, false, "kh");
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, Z2_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("kh-skirt");
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("kh-belt");
    for i in 0..3_u32 {
        let mt = if i % 2 == 0 { m_bronz_l } else { m_bronze };
        m.add_mesh(g, g_scale_band(), mt)
            .set_pos(
                0.0,
                Z2_TORSO_CTR + (0.052 - f64::from(i) * 0.040) * HEX_R,
                0.004 * HEX_R,
            )
            .set_name(&format!("kh-scale-band-{i}"));
    }

    z2_build_leg(
        &mut m, g, Z2_HIP_X, 0.56, 0.32, m_skin, m_skin, m_leath, hip_y, "kh", "left",
    );
    z2_build_leg(
        &mut m, g, -Z2_HIP_X, -0.50, -0.18, m_skin, m_skin, m_leath, hip_y, "kh", "right",
    );

    m.add_mesh(g, g_khep(), m_blue_d)
        .rot_x(-0.10)
        .set_pos(0.0, Z2_HEAD_CTR + 0.034 * HEX_R, -0.006 * HEX_R)
        .set_name("kh-khepresh-crown");
    m.add_mesh(g, g_kh_band(), m_gold)
        .set_pos(0.0, Z2_HEAD_CTR + 0.016 * HEX_R, 0.0)
        .set_name("kh-khepresh-band");
    m.add_mesh(g, g_uraeus(), m_gold)
        .set_pos(0.0, Z2_HEAD_CTR + 0.075 * HEX_R, 0.060 * HEX_R)
        .set_name("kh-khepresh-uraeus");

    let (wrist_r, _) = z2_build_arm(
        &mut m,
        g,
        -Z2_SHLD_X,
        thu,
        thf,
        m_skin,
        m_skin,
        Some(m_leath),
        Z2_SHLD_Y,
        "kh",
        "right",
    );
    let kh = m.detached_group();
    m.node(kh).set_pos_v(wrist_r).rot_x(PI - thf).rot_y(kh_roll);
    m.add_mesh(kh, g_kh_str(), m_steel)
        .set_pos(0.0, 0.072 * HEX_R, 0.0)
        .set_name("kh-khopesh-straight");
    let mut py = 0.120 * HEX_R;
    let mut pz = 0.0;
    for (i, a) in [0.40_f64, 0.95, 1.55].into_iter().enumerate() {
        let dy = js_cos(a) * 0.062 * HEX_R;
        let dz = js_sin(a) * 0.062 * HEX_R;
        m.add_mesh(kh, g_kh_seg(), m_steel)
            .rot_x(a)
            .set_pos(0.0, py + dy * 0.5, pz + dz * 0.5)
            .set_name(&format!("kh-khopesh-seg-{i}"));
        py += dy;
        pz += dz;
    }
    m.add_mesh(kh, g_guard(), m_gold)
        .set_pos(0.0, 0.026 * HEX_R, 0.0)
        .set_name("kh-khopesh-guard");
    m.attach(g, kh);

    let (wrist_l, _) = z2_build_arm(
        &mut m, g, Z2_SHLD_X, 0.48, 1.06, m_skin, m_skin, None, Z2_SHLD_Y, "kh", "left",
    );
    let sh = m.detached_group();
    m.add_mesh(sh, g_rect_pl(), m_owner)
        .set_name("kh-shield-face");
    m.add_mesh(sh, g_rect_top(), m_owner)
        .set_pos(0.0, 0.112 * HEX_R, 0.0)
        .set_name("kh-shield-face-top");
    m.add_mesh(sh, g_rect_cap(), m_owner)
        .set_pos(0.0, 0.140 * HEX_R, 0.0)
        .set_name("kh-shield-face-cap");
    m.add_mesh(sh, g_sh_boss(), m_bronz_l)
        .set_pos(0.0, 0.012 * HEX_R, 0.014 * HEX_R)
        .set_name("kh-shield-boss");
    z2_mount_shield(&mut m, g, sh, wrist_l);
    m
}

/// `buildThorakites(ownerColor)` (`:1199-1332`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_thorakites(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_mail = m.mat(Z2_STEEL_DK, 0.42, 0.86);
    let m_gold_t = m.mat(Z2_GOLD, 0.55, 0.35);
    let m_crimson = m.mat(Z2_CRIMSON, 0.08, 0.74);
    let m_steel = m.mat(Z2_STEEL, 0.60, 0.30);
    let m_bronze = m.mat(Z2_BRONZE, 0.35, 0.50);
    let m_bronz_l = m.mat(Z2_BRONZE_LT, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.16, 0.62);
    let m_wood = m.mat(Z2_WOOD, 0.05, 0.85);
    let m_linen = m.mat(Z2_LINEN, 0.06, 0.82);
    let m_leath = m.mat(Z2_LEATHER, 0.06, 0.82);

    let hip_y = Z2_HIP_Y - 0.010 * HEX_R;
    let helm_y = Z2_HEAD_CTR + 0.068 * HEX_R;

    let m_skin = z2_core(&mut m, g, m_mail, true, "th");
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, Z2_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("th-skirt");
    m.add_mesh(g, g_hem(), m_mail)
        .set_pos(0.0, Z2_TORSO_BOT - 0.008 * HEX_R, 0.0)
        .set_name("th-mail-hem");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("th-belt");

    z2_build_leg(
        &mut m, g, Z2_HIP_X, 0.55, 0.30, m_linen, m_skin, m_leath, hip_y, "th", "left",
    );
    z2_build_leg(
        &mut m, g, -Z2_HIP_X, -0.50, -0.16, m_linen, m_skin, m_leath, hip_y, "th", "right",
    );

    m.add_mesh(g, g_att_bowl(), m_bronze)
        .set_pos(0.0, helm_y, 0.0)
        .set_name("th-helmet-bowl");
    m.add_mesh(g, g_att_brow(), m_gold_t)
        .set_pos(0.0, Z2_HEAD_CTR + 0.036 * HEX_R, 0.0)
        .set_name("th-helmet-brow");
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_cheek(), m_bronze)
            .set_pos(
                sx * (Z2_HEAD_S * 0.5 + 0.004 * HEX_R),
                Z2_HEAD_CTR - 0.014 * HEX_R,
                0.014 * HEX_R,
            )
            .set_name(&format!("th-helmet-cheek-{}", lr(sx)));
    }
    m.add_mesh(g, g_crest_base(), m_bronz_l)
        .set_pos(0.0, Z2_HEAD_TOP + 0.062 * HEX_R, -0.002 * HEX_R)
        .set_name("th-crest-base");
    m.add_mesh(g, g_crest_hair(), m_crimson)
        .rot_x(0.10)
        .set_pos(0.0, Z2_HEAD_TOP + 0.104 * HEX_R, -0.006 * HEX_R)
        .set_name("th-crest-hair");

    let (wrist_r, axis_r) = z2_build_arm(
        &mut m,
        g,
        -Z2_SHLD_X,
        -2.02,
        2.36,
        m_mail,
        m_skin,
        Some(m_leath),
        Z2_SHLD_Y,
        "th",
        "right",
    );
    let dec = 0.22;
    let dory_axis = v3(0.0, -js_sin(dec), js_cos(dec));
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_dory(), m_wood)
        .rot_x(PI / 2.0 + dec)
        .set_pos_v(add_scaled(grip, dory_axis, 0.070 * HEX_R))
        .set_name("th-spear-shaft");
    m.add_mesh(g, g_hasta_tip(), m_steel)
        .rot_x(PI / 2.0 + dec)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(grip, dory_axis, (0.070 + 0.350 + 0.028) * HEX_R))
        .set_name("th-spear-tip");
    m.add_mesh(g, g_finial(), m_bronz_l)
        .set_pos_v(add_scaled(grip, dory_axis, -(0.280 + 0.010) * HEX_R))
        .set_name("th-spear-butt");

    let (wrist_l, _) = z2_build_arm(
        &mut m, g, Z2_SHLD_X, 0.52, 1.08, m_mail, m_skin, None, Z2_SHLD_Y, "th", "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.028 * HEX_R,
            wrist_l.y + 0.040 * HEX_R,
            wrist_l.z + 0.048 * HEX_R,
        )
        .rot_y(-0.20);
    m.add_mesh(sh, g_thur_shell(), m_leath)
        .set_name("th-shield-shell");
    m.add_mesh(sh, g_thur_face(), m_owner)
        .set_pos(0.0, 0.0, 0.014 * HEX_R)
        .set_name("th-shield-face");
    m.add_mesh(sh, g_spine(), m_wood)
        .set_pos(0.0, 0.0, 0.021 * HEX_R)
        .set_name("th-shield-spine");
    m.add_mesh(sh, g_spine_umb(), m_steel)
        .set_pos(0.0, 0.0, 0.030 * HEX_R)
        .set_name("th-shield-umbo");
    m.attach(g, sh);
    m
}

/// `buildTriari(ownerColor)` (`:1400-1604`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_triari(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_gold = m.mat(Z2_GOLD, 0.58, 0.32);
    let m_silver = m.mat(Z2_STEEL, 0.62, 0.28);
    let m_bronz_l = m.mat(Z2_BRONZE_LT, 0.52, 0.38);
    let m_bronz_d = m.mat(Z2_BRONZE_DK, 0.45, 0.42);
    let m_red = m.mat(Z2_ROMAN_RED, 0.05, 0.80);
    let m_white = m.mat(Z2_WHITE, 0.06, 0.80);
    let m_grey = m.mat(Z2_GREY, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_leath = m.mat(Z2_LEATHER, 0.05, 0.82);
    let m_wood = m.mat(Z2_WOOD, 0.05, 0.85);
    let m_wood_d = m.mat(Z2_WOOD_DK, 0.05, 0.85);

    let dy_k = 0.060 * HEX_R;
    let hip_y = Z2_HIP_Y - dy_k;
    let shld_y = Z2_SHLD_Y - dy_k;
    let head_ctr = Z2_HEAD_CTR - dy_k;
    let head_top = Z2_HEAD_TOP - dy_k;

    let m_skin = m.mat(Z2_SKIN, 0.05, 0.80);
    m.add_mesh(g, g_torso(), m_red)
        .rot_x(0.08)
        .set_pos(0.0, Z2_TORSO_CTR - dy_k, 0.004 * HEX_R)
        .set_name("tr-torso");
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, Z2_TORSO_TOP + Z2_NECK_H * 0.5 - dy_k, 0.010 * HEX_R)
        .set_name("tr-neck");
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, head_ctr, 0.012 * HEX_R)
        .set_name("tr-head");
    m.add_mesh(g, g_skirt(), m_red)
        .set_pos(0.0, Z2_TORSO_BOT - 0.018 * HEX_R - dy_k, 0.0)
        .set_name("tr-tunic-hem");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R - dy_k, 0.0)
        .set_name("tr-belt");

    m.add_mesh(g, g_beard(), m_grey)
        .set_pos(0.0, head_ctr - 0.052 * HEX_R, 0.082 * HEX_R)
        .set_name("tr-beard");

    m.add_mesh(g, g_harness(), m_leath)
        .set_pos(
            0.0,
            Z2_TORSO_CTR + 0.034 * HEX_R - dy_k,
            Z2_TORSO_D * 0.5 + 0.008 * HEX_R,
        )
        .set_name("tr-harness");
    for (fi, dx) in [-0.052_f64, 0.0, 0.052].into_iter().enumerate() {
        let mt = if fi % 2 == 0 { m_gold } else { m_silver };
        m.add_mesh(g, g_phalera(), mt)
            .rot_z(PI / 4.0)
            .set_pos(
                dx * HEX_R,
                Z2_TORSO_CTR + 0.034 * HEX_R - dy_k,
                Z2_TORSO_D * 0.5 + 0.014 * HEX_R,
            )
            .set_name(&format!("tr-phalera-{fi}"));
    }

    // NOGA LEWA (+X) — wykroczna
    let mut p = v3(Z2_HIP_X, hip_y, 0.0);
    p = z2_seg(
        &mut m,
        g,
        g_thigh(),
        m_red,
        p,
        1.05,
        Z2_THIGH_L,
        "tr-leg-left-thigh",
    );
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = z2_seg(
        &mut m,
        g,
        g_shin(),
        m_skin,
        p,
        0.10,
        Z2_SHIN_L,
        "tr-leg-left-shin",
    );
    m.add_mesh(g, g_foot(), m_leath)
        .set_pos(Z2_HIP_X, 0.013 * HEX_R, p.z + 0.016 * HEX_R)
        .set_name("tr-leg-left-foot");
    m.add_mesh(g, g_greave(), m_gold)
        .rot_x(PI - 0.10)
        .set_pos(Z2_HIP_X, 0.058 * HEX_R, p.z - 0.006 * HEX_R)
        .set_name("tr-greave-left");

    // NOGA PRAWA (-X) — KLECZACA
    let knee = v3(
        -Z2_HIP_X,
        hip_y - Z2_THIGH_L * js_cos(0.30),
        -Z2_THIGH_L * js_sin(0.30),
    );
    m.add_mesh(g, g_thigh(), m_red)
        .rot_x(PI + 0.30)
        .set_pos(-Z2_HIP_X, (hip_y + knee.y) * 0.5, knee.z * 0.5)
        .set_name("tr-leg-right-thigh");
    m.add_mesh(g, g_shin(), m_skin)
        .rot_x(-PI / 2.0)
        .set_pos(-Z2_HIP_X, 0.030 * HEX_R, knee.z - 0.048 * HEX_R)
        .set_name("tr-leg-right-shin");
    m.add_mesh(g, g_foot(), m_leath)
        .rot_x(-PI / 2.0)
        .set_pos(-Z2_HIP_X, 0.039 * HEX_R, knee.z - 0.118 * HEX_R)
        .set_name("tr-leg-right-foot");

    m.add_mesh(g, g_mont_bowl(), m_bronz_d)
        .set_pos(0.0, head_ctr + 0.068 * HEX_R, 0.012 * HEX_R)
        .set_name("tr-helmet-bowl");
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_cheek(), m_gold)
            .set_pos(
                sx * (Z2_HEAD_S * 0.5 + 0.004 * HEX_R),
                head_ctr + 0.000 * HEX_R,
                0.030 * HEX_R,
            )
            .set_name(&format!("tr-helmet-cheek-{}", lr(sx)));
    }
    for (k, sx) in [-1.0_f64, 0.0, 1.0].into_iter().enumerate() {
        let dyf = if sx == 0.0 { 0.096 } else { 0.086 };
        m.add_mesh(g, g_feather(), m_white)
            .rot_z(-sx * 0.16)
            .set_pos(sx * 0.034 * HEX_R, head_top + dyf * HEX_R, 0.012 * HEX_R)
            .set_name(&format!("tr-plume-{k}"));
    }

    let (wrist_r, axis_r) = z2_build_arm(
        &mut m,
        g,
        -Z2_SHLD_X,
        0.60,
        1.20,
        m_red,
        m_skin,
        Some(m_leath),
        shld_y,
        "tr",
        "right",
    );
    let el = 0.30;
    let hasta_axis = v3(0.0, js_sin(el), js_cos(el));
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_hasta(), m_wood)
        .rot_x(PI / 2.0 - el)
        .set_pos_v(add_scaled(grip, hasta_axis, 0.140 * HEX_R))
        .set_name("tr-hasta-shaft");
    m.add_mesh(g, g_hasta_tip(), m_silver)
        .rot_x(PI / 2.0 - el)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(
            grip,
            hasta_axis,
            (0.140 + 0.460 + 0.028) * HEX_R,
        ))
        .set_name("tr-hasta-tip");

    let (wrist_l, _) = z2_build_arm(
        &mut m, g, Z2_SHLD_X, 0.55, 1.05, m_red, m_skin, None, shld_y, "tr", "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y - 0.030 * HEX_R,
            wrist_l.z + 0.050 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, g_scut_shell(), m_leath)
        .set_name("tr-shield-shell");
    m.add_mesh(sh, g_scut_face(), m_owner)
        .set_pos(0.0, 0.0, 0.016 * HEX_R)
        .set_name("tr-shield-face");
    m.add_mesh(sh, g_spina(), m_bronz_l)
        .set_pos(0.0, 0.0, 0.024 * HEX_R)
        .set_name("tr-shield-spina");
    m.add_mesh(sh, g_umbo(), m_gold)
        .set_pos(0.0, 0.0, 0.034 * HEX_R)
        .set_name("tr-shield-umbo");
    m.attach(g, sh);

    z2_banner(&mut m, g, m_wood_d, m_owner, m_gold, -dy_k, "tr");
    m
}
