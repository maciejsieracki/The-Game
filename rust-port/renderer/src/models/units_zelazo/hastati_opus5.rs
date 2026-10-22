//! Port of `render/hastati-opus5.ts` (`edb8fb56`): `buildHastatiOpus5`
//! (record "Hastati", rule `units.ts:1665`).
//!
//! The lazily created `getHO*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::geo::RimArc;
use super::kit::{add_scaled, bx, cn, cy, dir_down, oval_face, oval_rim, oval_shell, rot3, v3};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`hastati-opus5.ts:162-176`)
const HO_SKIN: u32 = 0xe0ac69;
const HO_SKIN_DK: u32 = 0xc08f4e;
const HO_STEEL: u32 = 0xc2cad2;
const HO_IRON: u32 = 0x8e97a0;
const HO_BRONZE: u32 = 0xcf9234;
const HO_BRONZE_LT: u32 = 0xd0a050;
const HO_WOOD: u32 = 0x7a5c3a;
const HO_LEATHER: u32 = 0x6b4a28;
const HO_LEATHER_DK: u32 = 0x4e351c;
const HO_GOLD: u32 = 0xd8b040;
const HO_ROMAN_RED: u32 = 0xa42a22;
const HO_RED_DK: u32 = 0x7e1e18;
const HO_PURPLE: u32 = 0x7a2c96;
const HO_BLACK: u32 = 0x171310;

// ── wymiary sylwetki (`:179-197`)
const HO_HIP_Y: f64 = 0.208 * HEX_R;
const HO_TORSO_W: f64 = 0.180 * HEX_R;
const HO_TORSO_H: f64 = 0.205 * HEX_R;
const HO_TORSO_D: f64 = 0.100 * HEX_R;
const HO_TORSO_BOT: f64 = 0.240 * HEX_R;
const HO_TORSO_CTR: f64 = HO_TORSO_BOT + HO_TORSO_H * 0.5;
const HO_TORSO_TOP: f64 = HO_TORSO_BOT + HO_TORSO_H;
const HO_NECK_H: f64 = 0.028 * HEX_R;
const HO_HEAD_S: f64 = 0.128 * HEX_R;
const HO_HEAD_CTR: f64 = HO_TORSO_TOP + HO_NECK_H + HO_HEAD_S * 0.5;
const HO_HEAD_TOP: f64 = HO_TORSO_TOP + HO_NECK_H + HO_HEAD_S;
const HO_SHLD_X: f64 = HO_TORSO_W * 0.5 + 0.030 * HEX_R;
const HO_SHLD_Y: f64 = HO_TORSO_TOP - 0.024 * HEX_R;
const HO_HIP_X: f64 = 0.052 * HEX_R;
const HO_THIGH_L: f64 = 0.104 * HEX_R;
const HO_SHIN_L: f64 = 0.096 * HEX_R;
const HO_UPARM_L: f64 = 0.100 * HEX_R;
const HO_FOREARM_L: f64 = 0.092 * HEX_R;

// ── scutum (`:278`, `:384-410`)
const HO_SCUT_N: u32 = 14;
const HO_HELM_UP: f64 = 0.035 * HEX_R;
const HO_CHEEK_UP: f64 = 0.014 * HEX_R;
const SCUT_A: f64 = 0.104 * HEX_R;
const SCUT_B: f64 = 0.190 * HEX_R;
const SCUT_C: f64 = 0.052 * HEX_R;
const SCUT_T: f64 = 0.020 * HEX_R;

// ── akcesory geometrii (`:401-445`)
fn g_torso() -> Geo {
    bx(HO_TORSO_W, HO_TORSO_H, HO_TORSO_D)
}
fn g_chest() -> Geo {
    bx(HO_TORSO_W * 1.04, 0.070 * HEX_R, HO_TORSO_D * 1.06)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, HO_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(HO_HEAD_S, HO_HEAD_S, HO_HEAD_S)
}
fn g_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn g_nose() -> Geo {
    bx(0.020 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.020 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, HO_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, HO_SHIN_L, 0.042 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, HO_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, HO_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_fold() -> Geo {
    bx(0.030 * HEX_R, 0.062 * HEX_R, 0.014 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.190 * HEX_R, 0.030 * HEX_R, 0.112 * HEX_R)
}
fn g_buckle() -> Geo {
    bx(0.034 * HEX_R, 0.028 * HEX_R, 0.014 * HEX_R)
}
fn g_pect() -> Geo {
    bx(0.086 * HEX_R, 0.086 * HEX_R, 0.014 * HEX_R)
}
fn g_pect_rim() -> Geo {
    bx(0.100 * HEX_R, 0.100 * HEX_R, 0.008 * HEX_R)
}
fn g_pect_boss() -> Geo {
    cy(0.019 * HEX_R, 0.023 * HEX_R, 0.012 * HEX_R, 8)
}
fn g_strap() -> Geo {
    bx(0.024 * HEX_R, 0.126 * HEX_R, 0.008 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.046 * HEX_R, 0.014 * HEX_R, 0.082 * HEX_R)
}
fn g_toes() -> Geo {
    bx(0.042 * HEX_R, 0.016 * HEX_R, 0.026 * HEX_R)
}
fn g_cal_strap() -> Geo {
    bx(0.044 * HEX_R, 0.009 * HEX_R, 0.030 * HEX_R)
}
fn g_greave() -> Geo {
    bx(0.046 * HEX_R, 0.094 * HEX_R, 0.050 * HEX_R)
}
fn g_knee_cop() -> Geo {
    bx(0.048 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)
}
fn g_mont_bowl() -> Geo {
    cy(0.046 * HEX_R, 0.092 * HEX_R, 0.086 * HEX_R, 10)
}
fn g_mont_rib() -> Geo {
    cy(0.083 * HEX_R, 0.095 * HEX_R, 0.014 * HEX_R, 10)
}
fn g_mont_knob() -> Geo {
    cy(0.020 * HEX_R, 0.034 * HEX_R, 0.024 * HEX_R, 8)
}
fn g_mont_neck() -> Geo {
    bx(0.148 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R)
}
fn g_mont_brow() -> Geo {
    bx(0.128 * HEX_R, 0.016 * HEX_R, 0.030 * HEX_R)
}
fn g_cheek() -> Geo {
    bx(0.017 * HEX_R, 0.054 * HEX_R, 0.042 * HEX_R)
}
fn g_cheek_disc() -> Geo {
    cy(0.017 * HEX_R, 0.017 * HEX_R, 0.009 * HEX_R, 6)
}
fn g_kita_base() -> Geo {
    cy(0.013 * HEX_R, 0.017 * HEX_R, 0.020 * HEX_R, 6)
}
fn g_kita_hair() -> Geo {
    bx(0.028 * HEX_R, 0.052 * HEX_R, 0.030 * HEX_R)
}
fn g_feather() -> Geo {
    bx(0.022 * HEX_R, 0.104 * HEX_R, 0.010 * HEX_R)
}
fn g_feat_tip() -> Geo {
    bx(0.013 * HEX_R, 0.036 * HEX_R, 0.008 * HEX_R)
}
fn g_scut_shell() -> Geo {
    oval_shell(SCUT_A, SCUT_B, SCUT_C, SCUT_T, HO_SCUT_N)
}
fn g_scut_face() -> Geo {
    oval_face(SCUT_A * 0.92, SCUT_B * 0.92, SCUT_C * 0.80, HO_SCUT_N)
}
fn g_scut_rim(arc: RimArc) -> Geo {
    oval_rim(
        SCUT_A * 0.97,
        SCUT_B * 0.97,
        SCUT_C,
        SCUT_T * 1.5,
        HO_SCUT_N,
        arc,
        1.06,
    )
}
fn g_spina() -> Geo {
    bx(0.019 * HEX_R, 0.330 * HEX_R, 0.013 * HEX_R)
}
fn g_umbo() -> Geo {
    cy(0.006 * HEX_R, 0.030 * HEX_R, 0.026 * HEX_R, 6)
}
fn g_umbo_plate() -> Geo {
    cy(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R, 6)
}
fn g_wing() -> Geo {
    bx(0.066 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R)
}
fn g_porpax() -> Geo {
    bx(0.070 * HEX_R, 0.020 * HEX_R, 0.010 * HEX_R)
}
fn g_grip_bar() -> Geo {
    bx(0.052 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)
}
fn g_rivet() -> Geo {
    bx(0.011 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn g_blade_lo() -> Geo {
    bx(0.026 * HEX_R, 0.078 * HEX_R, 0.012 * HEX_R)
}
fn g_blade_hi() -> Geo {
    bx(0.032 * HEX_R, 0.062 * HEX_R, 0.013 * HEX_R)
}
fn g_blade_tip() -> Geo {
    cn(0.019 * HEX_R, 0.052 * HEX_R, 4)
}
fn g_guard() -> Geo {
    bx(0.054 * HEX_R, 0.016 * HEX_R, 0.026 * HEX_R)
}
fn g_grip() -> Geo {
    cy(0.014 * HEX_R, 0.014 * HEX_R, 0.044 * HEX_R, 6)
}
fn g_pommel() -> Geo {
    cy(0.024 * HEX_R, 0.016 * HEX_R, 0.020 * HEX_R, 6)
}
fn g_scabbard() -> Geo {
    bx(0.030 * HEX_R, 0.150 * HEX_R, 0.016 * HEX_R)
}
fn g_scab_band() -> Geo {
    bx(0.036 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)
}
fn g_chape() -> Geo {
    cn(0.018 * HEX_R, 0.030 * HEX_R, 4)
}
fn g_hanger() -> Geo {
    bx(0.010 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R)
}
fn g_pil_shaft() -> Geo {
    cy(0.011 * HEX_R, 0.013 * HEX_R, 0.330 * HEX_R, 6)
}
fn g_pil_collar() -> Geo {
    cy(0.015 * HEX_R, 0.017 * HEX_R, 0.026 * HEX_R, 6)
}
fn g_pil_shank() -> Geo {
    bx(0.009 * HEX_R, 0.290 * HEX_R, 0.009 * HEX_R)
}
fn g_pil_head() -> Geo {
    cn(0.016 * HEX_R, 0.044 * HEX_R, 4)
}
fn g_pil_ferr() -> Geo {
    cy(0.010 * HEX_R, 0.006 * HEX_R, 0.026 * HEX_R, 6)
}
fn g_pugio() -> Geo {
    bx(0.024 * HEX_R, 0.070 * HEX_R, 0.012 * HEX_R)
}
fn g_pugio_hlt() -> Geo {
    bx(0.028 * HEX_R, 0.020 * HEX_R, 0.014 * HEX_R)
}

/// `hoSeg(group, geo, mtl, P, theta, len, nm)` (`:456-467`).
#[allow(clippy::too_many_arguments)]
fn ho_seg(
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

/// `hoBuildLeg` (`:473-503`).
#[allow(clippy::too_many_arguments)]
fn ho_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_boot: MatId,
    m_strap: MatId,
    hip_y: f64,
    side: &str,
) -> Vec3 {
    let nm = |part: &str| -> String {
        if side.is_empty() {
            String::new()
        } else {
            format!("ha-leg-{side}-{part}")
        }
    };
    let mut p = v3(sx, hip_y, 0.0);
    p = ho_seg(m, g, g_thigh(), m_thigh, p, th_u, HO_THIGH_L, &nm("thigh"));
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = ho_seg(m, g, g_shin(), m_shin, p, th_l, HO_SHIN_L, &nm("shin"));

    let foot_z = p.z + 0.016 * HEX_R;
    let sole = m.add_mesh_id(g, g_sole(), m_boot);
    m.node(sole).set_pos(sx, 0.007 * HEX_R, foot_z);
    if !side.is_empty() {
        m.node(sole).set_name(&nm("sole"));
    }
    let toes = m.add_mesh_id(g, g_toes(), m_boot);
    m.node(toes)
        .set_pos(sx, 0.010 * HEX_R, foot_z + 0.040 * HEX_R);
    if !side.is_empty() {
        m.node(toes).set_name(&nm("toes"));
    }
    for (si, dz) in [-0.012_f64, 0.014].into_iter().enumerate() {
        let st = m.add_mesh_id(g, g_cal_strap(), m_strap);
        m.node(st).set_pos(sx, 0.020 * HEX_R, foot_z + dz * HEX_R);
        if !side.is_empty() {
            m.node(st).set_name(&nm(&format!("caliga-strap-{si}")));
        }
    }
    p
}

/// `hoBuildArm` (`:509-527`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn ho_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
    side: &str,
) -> (Vec3, Vec3) {
    let nm = |part: &str| -> String {
        if side.is_empty() {
            String::new()
        } else {
            format!("ha-arm-{side}-{part}")
        }
    };
    let mut p = v3(sx, HO_SHLD_Y, 0.0);
    p = ho_seg(m, g, g_up_arm(), m_up, p, th_u, HO_UPARM_L, &nm("upper"));
    p.y += 0.010 * HEX_R;
    let wrist = ho_seg(
        m,
        g,
        g_forearm(),
        m_fore,
        p,
        th_f,
        HO_FOREARM_L,
        &nm("fore"),
    );
    if let Some(mf) = m_fist {
        let fist = m.add_mesh_id(g, g_fist(), mf);
        m.node(fist)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
        if !side.is_empty() {
            m.node(fist).set_name(&nm("fist"));
        }
    }
    (wrist, dir_down(th_f))
}

const fn lr(s: f64) -> &'static str {
    if s < 0.0 {
        "right"
    } else {
        "left"
    }
}

/// `buildHastatiOpus5(ownerColor)` (`hastati-opus5.ts:535-960`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_hastati_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_gold = m.mat(HO_GOLD, 0.55, 0.35);
    let m_bronze = m.mat(HO_BRONZE, 0.50, 0.42);
    let m_bronz_l = m.mat(HO_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_red = m.mat(HO_ROMAN_RED, 0.05, 0.80);
    let m_red_dk = m.mat(HO_RED_DK, 0.05, 0.84);
    let m_steel = m.mat(HO_STEEL, 0.58, 0.30);
    let m_iron = m.mat(HO_IRON, 0.62, 0.42);
    let m_leath = m.mat(HO_LEATHER, 0.05, 0.82);
    let m_leath_dk = m.mat(HO_LEATHER_DK, 0.05, 0.86);
    let m_skin = m.mat(HO_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(HO_SKIN_DK, 0.05, 0.82);
    let m_purple = m.mat(HO_PURPLE, 0.08, 0.72);
    let m_black = m.mat(HO_BLACK, 0.05, 0.85);
    let m_wood = m.mat(HO_WOOD, 0.05, 0.85);

    let hip_y = HO_HIP_Y - 0.012 * HEX_R;

    // ═══ KORPUS
    m.add_mesh(g, g_torso(), m_red)
        .set_pos(0.0, HO_TORSO_CTR, 0.0)
        .set_name("ha-torso");
    m.add_mesh(g, g_chest(), m_red)
        .set_pos(0.0, HO_TORSO_TOP - 0.038 * HEX_R, 0.0)
        .set_name("ha-chest");
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, HO_TORSO_TOP + HO_NECK_H * 0.5, 0.0)
        .set_name("ha-neck");

    // ═══ GLOWA + TWARZ
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, HO_HEAD_CTR, 0.0)
        .set_name("ha-head");
    m.add_mesh(g, g_jaw(), m_skin_dk)
        .set_pos(0.0, HO_HEAD_CTR - HO_HEAD_S * 0.38, 0.048 * HEX_R)
        .set_name("ha-jaw");
    m.add_mesh(g, g_nose(), m_skin)
        .set_pos(
            0.0,
            HO_HEAD_CTR - 0.004 * HEX_R,
            HO_HEAD_S * 0.5 + 0.006 * HEX_R,
        )
        .set_name("ha-nose");
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_eye(), m_black)
            .set_pos(
                sx * 0.026 * HEX_R,
                HO_HEAD_CTR + 0.014 * HEX_R,
                HO_HEAD_S * 0.5 + 0.002 * HEX_R,
            )
            .set_name(&format!("ha-eye-{}", lr(sx)));
    }

    // ═══ TUNIKA
    m.add_mesh(g, g_skirt(), m_red)
        .set_pos(0.0, HO_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("ha-tunic-hem");
    for (k, sx) in [-1.0_f64, 0.0, 1.0].into_iter().enumerate() {
        m.add_mesh(g, g_fold(), m_red_dk)
            .set_pos(
                sx * 0.058 * HEX_R,
                HO_TORSO_BOT - 0.024 * HEX_R,
                HO_TORSO_D * 0.5 + 0.010 * HEX_R,
            )
            .set_name(&format!("ha-tunic-fold-{k}"));
    }
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("ha-belt");
    m.add_mesh(g, g_buckle(), m_bronz_l)
        .set_pos(0.0, 0.252 * HEX_R, HO_TORSO_D * 0.5 + 0.014 * HEX_R)
        .set_name("ha-belt-buckle");

    // ═══ PECTORALE
    let pect_z = HO_TORSO_D * 0.5 + 0.008 * HEX_R;
    m.add_mesh(g, g_pect_rim(), m_bronze)
        .set_pos(0.0, 0.386 * HEX_R, pect_z)
        .set_name("ha-pectorale-rim");
    m.add_mesh(g, g_pect(), m_gold)
        .set_pos(0.0, 0.386 * HEX_R, pect_z + 0.008 * HEX_R)
        .set_name("ha-pectorale");
    m.add_mesh(g, g_pect_boss(), m_bronz_l)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.386 * HEX_R, pect_z + 0.018 * HEX_R)
        .set_name("ha-pectorale-boss");
    for s in [-1.0_f64, 1.0] {
        let strap = m.add_mesh_id(g, g_strap(), m_leath);
        rot3(&mut m, strap, -0.55, 0.0, s * 0.62);
        m.node(strap)
            .set_pos(s * 0.020 * HEX_R, 0.448 * HEX_R, 0.038 * HEX_R)
            .set_name(&format!("ha-pectorale-strap-front-{}", lr(s)));
    }
    for s in [-1.0_f64, 1.0] {
        let strap_b = m.add_mesh_id(g, g_strap(), m_leath_dk);
        rot3(&mut m, strap_b, 0.42, 0.0, -s * 0.60);
        m.node(strap_b)
            .set_pos(
                s * 0.026 * HEX_R,
                0.430 * HEX_R,
                -(HO_TORSO_D * 0.5 + 0.006 * HEX_R),
            )
            .set_name(&format!("ha-pectorale-strap-back-{}", lr(s)));
    }

    // ═══ NOGI
    ho_build_leg(
        &mut m, g, HO_HIP_X, 0.58, 0.34, m_red, m_skin, m_leath, m_leath_dk, hip_y, "left",
    );
    ho_build_leg(
        &mut m, g, -HO_HIP_X, -0.52, -0.20, m_red, m_skin, m_leath, m_leath_dk, hip_y, "right",
    );
    m.add_mesh(g, g_greave(), m_bronze)
        .rot_x(PI - 0.34)
        .set_pos(HO_HIP_X, 0.070 * HEX_R, 0.069 * HEX_R)
        .set_name("ha-greave-left");
    m.add_mesh(g, g_knee_cop(), m_bronz_l)
        .rot_x(-0.30)
        .set_pos(HO_HIP_X, 0.122 * HEX_R, 0.052 * HEX_R)
        .set_name("ha-kneecop-left");

    // ═══ HELM MONTEFORTINO
    m.add_mesh(g, g_mont_bowl(), m_bronze)
        .set_pos(0.0, HO_HEAD_CTR + 0.030 * HEX_R + HO_HELM_UP, 0.0)
        .set_name("ha-helmet-bowl");
    m.add_mesh(g, g_mont_rib(), m_bronz_l)
        .set_pos(0.0, HO_HEAD_CTR - 0.002 * HEX_R + HO_HELM_UP, 0.0)
        .set_name("ha-helmet-rib");
    m.add_mesh(g, g_mont_brow(), m_bronz_l)
        .rot_x(0.16)
        .set_pos(
            0.0,
            HO_HEAD_CTR + 0.030 * HEX_R + HO_HELM_UP,
            HO_HEAD_S * 0.5 + 0.008 * HEX_R,
        )
        .set_name("ha-helmet-brow");
    m.add_mesh(g, g_mont_neck(), m_bronz_l)
        .rot_x(-0.42)
        .set_pos(
            0.0,
            HO_HEAD_CTR - 0.016 * HEX_R + HO_HELM_UP,
            -(HO_HEAD_S * 0.5 + 0.022 * HEX_R),
        )
        .set_name("ha-helmet-neck");
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_cheek(), m_bronze)
            .rot_z(sx * 0.10)
            .set_pos(
                sx * (HO_HEAD_S * 0.5 + 0.005 * HEX_R),
                HO_HEAD_CTR - 0.016 * HEX_R + HO_CHEEK_UP,
                0.016 * HEX_R,
            )
            .set_name(&format!("ha-helmet-cheek-{}", lr(sx)));
        m.add_mesh(g, g_cheek_disc(), m_bronz_l)
            .rot_z(PI / 2.0)
            .set_pos(
                sx * (HO_HEAD_S * 0.5 + 0.012 * HEX_R),
                HO_HEAD_CTR - 0.028 * HEX_R + HO_CHEEK_UP,
                0.018 * HEX_R,
            )
            .set_name(&format!("ha-helmet-cheekdisc-{}", lr(sx)));
    }
    m.add_mesh(g, g_mont_knob(), m_bronz_l)
        .set_pos(0.0, HO_HEAD_TOP + 0.012 * HEX_R + HO_HELM_UP, 0.0)
        .set_name("ha-helmet-knob");
    m.add_mesh(g, g_kita_base(), m_black)
        .set_pos(0.0, HO_HEAD_TOP + 0.032 * HEX_R + HO_HELM_UP, 0.0)
        .set_name("ha-kita-base");
    m.add_mesh(g, g_kita_hair(), m_black)
        .rot_x(0.14)
        .set_pos(
            0.0,
            HO_HEAD_TOP + 0.062 * HEX_R + HO_HELM_UP,
            -0.006 * HEX_R,
        )
        .set_name("ha-kita-hair");
    for (k, sx) in [-1.0_f64, 0.0, 1.0].into_iter().enumerate() {
        let dy = if sx == 0.0 { 0.100 } else { 0.090 };
        let base = HO_HEAD_TOP + dy * HEX_R + HO_HELM_UP;
        m.add_mesh(g, g_feather(), m_purple)
            .rot_z(-sx * 0.15)
            .set_pos(sx * 0.032 * HEX_R, base, 0.0)
            .set_name(&format!("ha-plume-{k}"));
        m.add_mesh(g, g_feat_tip(), m_purple)
            .rot_z(-sx * 0.15)
            .set_pos(sx * 0.042 * HEX_R, base + 0.068 * HEX_R, 0.0)
            .set_name(&format!("ha-plume-tip-{k}"));
    }

    // ═══ PRAWE (-X) RAMIE + GLADIUS
    let (wrist_r, ax) = ho_build_arm(
        &mut m,
        g,
        -HO_SHLD_X,
        0.95,
        1.50,
        m_red,
        m_skin,
        Some(m_skin_dk),
        "right",
    );
    let at = |d: f64| add_scaled(wrist_r, ax, d * HEX_R);
    let rot_blade = PI - 1.50;
    m.add_mesh(g, g_grip(), m_wood)
        .rot_x(rot_blade)
        .set_pos_v(at(-0.008))
        .set_name("ha-sword-grip");
    m.add_mesh(g, g_pommel(), m_wood)
        .rot_x(rot_blade)
        .set_pos_v(at(-0.038))
        .set_name("ha-sword-pommel");
    m.add_mesh(g, g_guard(), m_bronz_l)
        .rot_x(rot_blade)
        .set_pos_v(at(0.020))
        .set_name("ha-sword-guard");
    m.add_mesh(g, g_blade_lo(), m_steel)
        .rot_x(rot_blade)
        .set_pos_v(at(0.068))
        .set_name("ha-sword-blade-lo");
    m.add_mesh(g, g_blade_hi(), m_steel)
        .rot_x(rot_blade)
        .set_pos_v(at(0.138))
        .set_name("ha-sword-blade-hi");
    m.add_mesh(g, g_blade_tip(), m_steel)
        .rot_x(rot_blade)
        .rot_y(PI / 4.0)
        .set_pos_v(at(0.195))
        .set_name("ha-sword-tip");

    // ═══ POCHWA
    let scab_x = -(HO_TORSO_W * 0.5 + 0.026 * HEX_R);
    m.add_mesh(g, g_hanger(), m_leath_dk)
        .set_pos(scab_x, 0.246 * HEX_R, 0.012 * HEX_R)
        .set_name("ha-scabbard-hanger");
    m.add_mesh(g, g_scabbard(), m_leath)
        .rot_x(0.10)
        .rot_z(-0.12)
        .set_pos(scab_x - 0.008 * HEX_R, 0.156 * HEX_R, 0.006 * HEX_R)
        .set_name("ha-scabbard");
    for (bi, dy) in [0.052_f64, -0.030].into_iter().enumerate() {
        m.add_mesh(g, g_scab_band(), m_bronz_l)
            .rot_x(0.10)
            .rot_z(-0.12)
            .set_pos(
                scab_x - 0.008 * HEX_R + dy * 0.12 * HEX_R,
                (0.156 + dy) * HEX_R,
                0.006 * HEX_R,
            )
            .set_name(&format!("ha-scabbard-band-{bi}"));
    }
    m.add_mesh(g, g_chape(), m_bronz_l)
        .rot_x(PI + 0.10)
        .rot_z(-0.12)
        .set_pos(scab_x - 0.018 * HEX_R, 0.070 * HEX_R, -0.002 * HEX_R)
        .set_name("ha-scabbard-chape");

    // ═══ PUGIO
    let pug_x = HO_TORSO_W * 0.5 + 0.020 * HEX_R;
    m.add_mesh(g, g_pugio(), m_leath_dk)
        .rot_z(0.16)
        .set_pos(pug_x, 0.208 * HEX_R, -0.014 * HEX_R)
        .set_name("ha-pugio");
    m.add_mesh(g, g_pugio_hlt(), m_bronz_l)
        .rot_z(0.16)
        .set_pos(pug_x + 0.008 * HEX_R, 0.250 * HEX_R, -0.014 * HEX_R)
        .set_name("ha-pugio-hilt");

    // ═══ LEWE (+X) RAMIE + SCUTUM
    let (wrist_l, _) = ho_build_arm(
        &mut m, g, HO_SHLD_X, 0.50, 1.10, m_red, m_skin, None, "left",
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
        .set_name("ha-shield-shell");
    m.add_mesh(sh, g_scut_face(), m_owner)
        .set_pos(0.0, 0.0, 0.014 * HEX_R)
        .set_name("ha-shield-face");
    m.add_mesh(sh, g_scut_rim(RimArc::Top), m_iron)
        .set_name("ha-shield-rim-top");
    m.add_mesh(sh, g_scut_rim(RimArc::Bottom), m_iron)
        .set_name("ha-shield-rim-bottom");
    m.add_mesh(sh, g_spina(), m_wood)
        .set_pos(0.0, 0.0, 0.022 * HEX_R)
        .set_name("ha-shield-spina");
    m.add_mesh(sh, g_umbo_plate(), m_bronze)
        .rot_x(PI / 2.0)
        .set_scale(1.0, 1.0, 1.9)
        .set_pos(0.0, 0.0, 0.026 * HEX_R)
        .set_name("ha-shield-umbo-plate");
    m.add_mesh(sh, g_umbo(), m_iron)
        .rot_x(PI / 2.0)
        .set_scale(1.0, 1.0, 1.7)
        .set_pos(0.0, 0.0, 0.036 * HEX_R)
        .set_name("ha-shield-umbo");
    for s in [-1.0_f64, 1.0] {
        for dy in [0.084_f64, -0.084] {
            let rz = s * (if dy > 0.0 { 0.42 } else { -0.42 });
            m.add_mesh(sh, g_wing(), m_gold)
                .rot_z(rz)
                .set_pos(s * 0.040 * HEX_R, dy * HEX_R, 0.024 * HEX_R)
                .set_name(&format!(
                    "ha-shield-wing-{}{}",
                    if s < 0.0 { "r" } else { "l" },
                    if dy > 0.0 { "u" } else { "d" }
                ));
        }
    }
    for dy in [0.176_f64, -0.176] {
        m.add_mesh(sh, g_rivet(), m_iron)
            .set_pos(0.0, dy * HEX_R, 0.014 * HEX_R)
            .set_name(if dy > 0.0 {
                "ha-shield-rivet-top"
            } else {
                "ha-shield-rivet-bottom"
            });
    }
    m.add_mesh(sh, g_porpax(), m_leath_dk)
        .set_pos(0.0, 0.012 * HEX_R, -0.026 * HEX_R)
        .set_name("ha-shield-porpax");
    m.add_mesh(sh, g_grip_bar(), m_wood)
        .set_pos(0.0, -0.020 * HEX_R, -0.032 * HEX_R)
        .set_name("ha-shield-gripbar");
    m.attach(g, sh);

    // ═══ PILUM
    const PIL_TH_X: f64 = -0.14;
    const PIL_TH_Z: f64 = -0.10;
    const PIL_GRIP_H: f64 = 0.24 * HEX_R;
    let kx = js_sin(-PIL_TH_Z);
    let ky = js_cos(PIL_TH_Z) * js_cos(PIL_TH_X);
    let kz = js_cos(PIL_TH_Z) * js_sin(PIL_TH_X);
    let grip_pt = v3(
        wrist_l.x + 0.012 * HEX_R,
        wrist_l.y + 0.009 * HEX_R,
        wrist_l.z + 0.020 * HEX_R,
    );
    let pil = m.detached_group();
    m.node(pil)
        .set_pos(
            grip_pt.x - kx * PIL_GRIP_H,
            grip_pt.y - ky * PIL_GRIP_H,
            grip_pt.z - kz * PIL_GRIP_H,
        )
        .rot_x(PIL_TH_X)
        .rot_z(PIL_TH_Z);
    m.add_mesh(pil, g_pil_shaft(), m_wood)
        .set_pos(0.0, 0.185 * HEX_R, 0.0)
        .set_name("ha-pilum-shaft");
    m.add_mesh(pil, g_pil_ferr(), m_iron)
        .rot_x(PI)
        .set_pos(0.0, 0.008 * HEX_R, 0.0)
        .set_name("ha-pilum-ferrule");
    m.add_mesh(pil, g_pil_collar(), m_iron)
        .set_pos(0.0, 0.360 * HEX_R, 0.0)
        .set_name("ha-pilum-collar");
    for (pri, dy) in [0.330_f64, 0.386].into_iter().enumerate() {
        m.add_mesh(pil, g_rivet(), m_iron)
            .set_pos(0.0, dy * HEX_R, 0.013 * HEX_R)
            .set_name(&format!("ha-pilum-rivet-{pri}"));
    }
    m.add_mesh(pil, g_pil_shank(), m_iron)
        .set_pos(0.0, 0.520 * HEX_R, 0.0)
        .set_name("ha-pilum-shank");
    m.add_mesh(pil, g_pil_head(), m_iron)
        .rot_y(PI / 4.0)
        .set_pos(0.0, 0.687 * HEX_R, 0.0)
        .set_name("ha-pilum-head");
    m.attach(g, pil);
    m
}
