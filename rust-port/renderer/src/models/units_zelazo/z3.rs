//! Port of `render/jednostki-z3-plemiona.ts` (`edb8fb56`): `buildDruzynnik`,
//! `buildIButho`, `buildBerserker` (the Z3 Berserker of the record
//! "Berserker germański", imported in `units.ts` as `buildBerserkerZ3`),
//! `buildGermanSuper`, `buildMiecznikGalijski` (all five exports).
//!
//! The lazily created `getGTR*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, cy_open, dir_down, oval_face, oval_shell, v3};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── kolory serii (`jednostki-z3-plemiona.ts:93-119`)
const TR_SKIN: u32 = 0xe0ac69;
const TR_SKIN_ZULU: u32 = 0xb06030;
const TR_STEEL: u32 = 0xc2cad2;
const TR_IRON_DK: u32 = 0x5a5e66;
const TR_BRONZE: u32 = 0xcf9234;
const TR_GOLD: u32 = 0xd8b040;
const TR_WOOD: u32 = 0x7a5c3a;
const TR_LEATHER: u32 = 0x6b4a28;
const TR_LINEN: u32 = 0xe8e0c8;
const TR_WOOL_DK: u32 = 0x4a3a2e;
const TR_HAIR_SLAV: u32 = 0xa07840;
const TR_HAIR_CELT: u32 = 0xb8702a;
const TR_HAIR_GER: u32 = 0xb0562a;
const TR_FUR: u32 = 0x5a3c20;
const TR_FUR_LT: u32 = 0x7a5230;
const TR_PELT: u32 = 0x5a4630;
const TR_BURGUNDY: u32 = 0x7a3040;
const TR_BRACCAE: u32 = 0x8a4a2e;
const TR_OCHRE: u32 = 0xc89040;
const TR_WOAD: u32 = 0x2f5aa0;
const TR_HIDE_DK: u32 = 0x3a2a1e;
const TR_BLACK: u32 = 0x171310;
const TR_IVORY: u32 = 0xe8ddc4;
const TR_CRANE_WHT: u32 = 0xf0ece0;
const TR_EYE: u32 = 0x1a1008;
const TR_HAIR_BLOND: u32 = 0xd8b25a;

// ── wymiary sylwetki (`:122-140`)
const TR_HIP_Y: f64 = 0.208 * HEX_R;
const TR_TORSO_W: f64 = 0.180 * HEX_R;
const TR_TORSO_H: f64 = 0.205 * HEX_R;
const TR_TORSO_D: f64 = 0.100 * HEX_R;
const TR_TORSO_BOT: f64 = 0.240 * HEX_R;
const TR_TORSO_CTR: f64 = TR_TORSO_BOT + TR_TORSO_H * 0.5;
const TR_TORSO_TOP: f64 = TR_TORSO_BOT + TR_TORSO_H;
const TR_NECK_H: f64 = 0.028 * HEX_R;
const TR_HEAD_S: f64 = 0.128 * HEX_R;
const TR_HEAD_CTR: f64 = TR_TORSO_TOP + TR_NECK_H + TR_HEAD_S * 0.5;
const TR_HEAD_TOP: f64 = TR_TORSO_TOP + TR_NECK_H + TR_HEAD_S;
const TR_SHLD_X: f64 = TR_TORSO_W * 0.5 + 0.030 * HEX_R;
const TR_SHLD_Y: f64 = TR_TORSO_TOP - 0.024 * HEX_R;
const TR_HIP_X: f64 = 0.052 * HEX_R;
const TR_THIGH_L: f64 = 0.104 * HEX_R;
const TR_SHIN_L: f64 = 0.096 * HEX_R;
const TR_UPARM_L: f64 = 0.100 * HEX_R;
const TR_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie (`:224-302`, `:343-346`)
fn g_torso() -> Geo {
    bx(TR_TORSO_W, TR_TORSO_H, TR_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, TR_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(TR_HEAD_S, TR_HEAD_S, TR_HEAD_S)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, TR_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, TR_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, TR_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, TR_FOREARM_L, 0.040 * HEX_R)
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
fn g_wasy() -> Geo {
    bx(0.026 * HEX_R, 0.052 * HEX_R, 0.016 * HEX_R)
}
fn g_hair_bk() -> Geo {
    bx(0.120 * HEX_R, 0.110 * HEX_R, 0.030 * HEX_R)
}
fn g_kaftan() -> Geo {
    bx(0.192 * HEX_R, 0.150 * HEX_R, 0.114 * HEX_R)
}
fn g_cone_helm() -> Geo {
    cy(0.014 * HEX_R, 0.088 * HEX_R, 0.130 * HEX_R, 8)
}
fn g_nosal() -> Geo {
    bx(0.018 * HEX_R, 0.060 * HEX_R, 0.016 * HEX_R)
}
fn g_helm_rim() -> Geo {
    bx(0.150 * HEX_R, 0.018 * HEX_R, 0.150 * HEX_R)
}
fn g_rnd_face() -> Geo {
    cy(0.148 * HEX_R, 0.120 * HEX_R, 0.026 * HEX_R, 8)
}
fn g_rnd_rim() -> Geo {
    cy_open(0.158 * HEX_R, 0.158 * HEX_R, 0.018 * HEX_R, 8)
}
fn g_plank() -> Geo {
    bx(0.024 * HEX_R, 0.270 * HEX_R, 0.010 * HEX_R)
}
fn g_umbo() -> Geo {
    cn(0.040 * HEX_R, 0.034 * HEX_R, 6)
}
fn g_blade() -> Geo {
    bx(0.026 * HEX_R, 0.150 * HEX_R, 0.014 * HEX_R)
}
fn g_blade_tip() -> Geo {
    cn(0.016 * HEX_R, 0.042 * HEX_R, 4)
}
fn g_guard() -> Geo {
    bx(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)
}
fn g_pommel() -> Geo {
    bx(0.030 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)
}
fn g_shoba() -> Geo {
    bx(0.062 * HEX_R, 0.046 * HEX_R, 0.062 * HEX_R)
}
fn g_isicoco() -> Geo {
    cy_open(0.052 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R, 8)
}
fn g_feather() -> Geo {
    bx(0.018 * HEX_R, 0.170 * HEX_R, 0.010 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.044 * HEX_R, 0.052 * HEX_R, 0.014 * HEX_R)
}
fn g_neck_band() -> Geo {
    bx(0.150 * HEX_R, 0.020 * HEX_R, 0.085 * HEX_R)
}
fn g_tooth() -> Geo {
    cn(0.012 * HEX_R, 0.036 * HEX_R, 4)
}
fn g_patch_big() -> Geo {
    bx(0.052 * HEX_R, 0.088 * HEX_R, 0.010 * HEX_R)
}
fn g_patch_sm() -> Geo {
    bx(0.040 * HEX_R, 0.052 * HEX_R, 0.010 * HEX_R)
}
fn g_mgobo() -> Geo {
    bx(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)
}
fn g_mgobo_tuft() -> Geo {
    bx(0.026 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)
}
fn g_diamond() -> Geo {
    bx(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R)
}
fn g_iklwa_shaft() -> Geo {
    bx(0.018 * HEX_R, 0.240 * HEX_R, 0.018 * HEX_R)
}
fn g_iklwa_blade() -> Geo {
    bx(0.036 * HEX_R, 0.090 * HEX_R, 0.012 * HEX_R)
}
fn g_iklwa_tip() -> Geo {
    cn(0.016 * HEX_R, 0.044 * HEX_R, 4)
}
fn g_dome_helm() -> Geo {
    cy(0.052 * HEX_R, 0.090 * HEX_R, 0.096 * HEX_R, 8)
}
fn g_fur_band() -> Geo {
    cy_open(0.096 * HEX_R, 0.100 * HEX_R, 0.040 * HEX_R, 8)
}
fn g_fur_pad() -> Geo {
    bx(0.084 * HEX_R, 0.048 * HEX_R, 0.108 * HEX_R)
}
fn g_strap() -> Geo {
    bx(0.034 * HEX_R, 0.220 * HEX_R, 0.012 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.096 * HEX_R, 0.070 * HEX_R, 0.030 * HEX_R)
}
fn g_braid() -> Geo {
    bx(0.024 * HEX_R, 0.070 * HEX_R, 0.020 * HEX_R)
}
fn g_long_blade() -> Geo {
    bx(0.026 * HEX_R, 0.210 * HEX_R, 0.013 * HEX_R)
}
fn g_spiral_arm() -> Geo {
    bx(0.062 * HEX_R, 0.020 * HEX_R, 0.010 * HEX_R)
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
fn g_eye() -> Geo {
    bx(0.020 * HEX_R, 0.014 * HEX_R, 0.008 * HEX_R)
}
fn g_wolf_hood() -> Geo {
    bx(0.150 * HEX_R, 0.075 * HEX_R, 0.115 * HEX_R)
}
fn g_wolf_snout() -> Geo {
    bx(0.052 * HEX_R, 0.044 * HEX_R, 0.075 * HEX_R)
}
fn g_wolf_ear() -> Geo {
    bx(0.034 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R)
}
fn g_pelt_cape() -> Geo {
    bx(0.176 * HEX_R, 0.250 * HEX_R, 0.014 * HEX_R)
}
fn g_loin() -> Geo {
    bx(0.152 * HEX_R, 0.078 * HEX_R, 0.112 * HEX_R)
}
fn g_hair_loose() -> Geo {
    bx(0.126 * HEX_R, 0.108 * HEX_R, 0.032 * HEX_R)
}
fn g_axe_haft() -> Geo {
    bx(0.018 * HEX_R, 0.280 * HEX_R, 0.018 * HEX_R)
}
fn g_axe_head() -> Geo {
    bx(0.070 * HEX_R, 0.120 * HEX_R, 0.018 * HEX_R)
}
fn g_axe_poll() -> Geo {
    bx(0.030 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R)
}
fn g_war_paint() -> Geo {
    bx(0.100 * HEX_R, 0.022 * HEX_R, 0.010 * HEX_R)
}
fn g_framea_shaft() -> Geo {
    bx(0.016 * HEX_R, 0.340 * HEX_R, 0.016 * HEX_R)
}
fn g_framea_sock() -> Geo {
    bx(0.024 * HEX_R, 0.028 * HEX_R, 0.024 * HEX_R)
}
fn g_framea_head() -> Geo {
    bx(0.024 * HEX_R, 0.072 * HEX_R, 0.011 * HEX_R)
}
fn g_mont_bowl() -> Geo {
    cy(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8)
}
fn g_kita() -> Geo {
    bx(0.030 * HEX_R, 0.092 * HEX_R, 0.026 * HEX_R)
}
fn g_torc() -> Geo {
    cy_open(0.046 * HEX_R, 0.046 * HEX_R, 0.018 * HEX_R, 6)
}
fn g_band() -> Geo {
    bx(0.062 * HEX_R, 0.020 * HEX_R, 0.066 * HEX_R)
}
fn g_pion() -> Geo {
    bx(0.014 * HEX_R, 0.096 * HEX_R, 0.012 * HEX_R)
}
fn g_tri_arm() -> Geo {
    bx(0.056 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)
}
fn g_nguni_shell() -> Geo {
    oval_shell(
        0.088 * HEX_R,
        0.205 * HEX_R,
        0.030 * HEX_R,
        0.014 * HEX_R,
        10,
    )
}
fn g_nguni_face() -> Geo {
    oval_face(0.076 * HEX_R, 0.180 * HEX_R, 0.022 * HEX_R, 10)
}
fn g_oval_shell() -> Geo {
    oval_shell(
        0.098 * HEX_R,
        0.185 * HEX_R,
        0.040 * HEX_R,
        0.018 * HEX_R,
        10,
    )
}
fn g_oval_face() -> Geo {
    oval_face(0.082 * HEX_R, 0.156 * HEX_R, 0.028 * HEX_R, 10)
}

const fn lr(s: f64) -> &'static str {
    if s < 0.0 {
        "right"
    } else {
        "left"
    }
}

/// `trSeg` (`:357-368`).
#[allow(clippy::too_many_arguments)]
fn tr_seg(
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

/// Result of [`tr_build_leg`]: `{ knee, thighCtr }`.
#[derive(Debug, Clone, Copy)]
struct Leg {
    knee: Vec3,
    thigh_ctr: Vec3,
}

/// `trBuildLeg` (`:369-387`).
#[allow(clippy::too_many_arguments)]
fn tr_build_leg(
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
) -> Leg {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-leg-{side}-{part}")
        }
    };
    let mut p = v3(sx, hip_y, 0.0);
    let thigh_ctr = add_scaled(p, dir_down(th_u), TR_THIGH_L * 0.5);
    p = tr_seg(m, g, g_thigh(), m_thigh, p, th_u, TR_THIGH_L, &nm("thigh"));
    let knee = p;
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = tr_seg(m, g, g_shin(), m_shin, p, th_l, TR_SHIN_L, &nm("shin"));
    let foot = m.add_mesh_id(g, g_foot(), m_foot);
    m.node(foot).set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
    if !pf.is_empty() {
        m.node(foot).set_name(&nm("foot"));
    }
    Leg { knee, thigh_ctr }
}

/// `trBuildArm` (`:388-407`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn tr_build_arm(
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
    let mut p = v3(sx, TR_SHLD_Y, 0.0);
    p = tr_seg(m, g, g_up_arm(), m_up, p, th_u, TR_UPARM_L, &nm("upper"));
    p.y += 0.010 * HEX_R;
    let wrist = tr_seg(
        m,
        g,
        g_forearm(),
        m_fore,
        p,
        th_f,
        TR_FOREARM_L,
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

/// `trCore` (`:409-437`): returns the skin material.
fn tr_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin: u32, eyes: bool, pf: &str) -> MatId {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-{part}")
        }
    };
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, TR_TORSO_CTR, 0.0)
        .set_name(&nm("torso"));
    let m_skin = m.mat(skin, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, TR_TORSO_TOP + TR_NECK_H * 0.5, 0.0)
        .set_name(&nm("neck"));
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, TR_HEAD_CTR, 0.0)
        .set_name(&nm("head"));
    if eyes {
        let m_eye = m.mat(TR_EYE, 0.02, 0.95);
        for sx in [-1.0_f64, 1.0] {
            m.add_mesh(g, g_eye(), m_eye)
                .set_pos(
                    sx * 0.028 * HEX_R,
                    TR_HEAD_CTR + 0.008 * HEX_R,
                    TR_HEAD_S * 0.5 + 0.004 * HEX_R,
                )
                .set_name(&nm(&format!("eye-{}", lr(sx))));
        }
    }
    m_skin
}

/// `trWasy` (`:439-446`).
fn tr_wasy(m: &mut UnitModel, g: NodeId, m_hair: MatId) {
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_wasy(), m_hair).rot_z(s * 0.35).set_pos(
            s * 0.028 * HEX_R,
            TR_HEAD_CTR - 0.038 * HEX_R,
            TR_HEAD_S * 0.5 + 0.006 * HEX_R,
        );
    }
}

/// `trSuperBanner` (`:457-478`).
fn tr_super_banner(
    m: &mut UnitModel,
    g: NodeId,
    m_pole: MatId,
    m_flag: MatId,
    m_gold: MatId,
    pf: &str,
    side: f64,
) {
    let nm = |part: &str| -> String {
        if pf.is_empty() {
            String::new()
        } else {
            format!("{pf}-banner-{part}")
        }
    };
    let s = if side < 0.0 { -1.0 } else { 1.0 };
    m.add_mesh(g, g_pole(), m_pole)
        .rot_x(-0.14)
        .set_pos(s * 0.052 * HEX_R, 0.340 * HEX_R, -0.086 * HEX_R)
        .set_name(&nm("pole"));
    m.add_mesh(g, g_flag(), m_flag)
        .rot_x(-0.14)
        .set_pos(s * 0.100 * HEX_R, 0.548 * HEX_R, -0.115 * HEX_R)
        .set_name(&nm("flag"));
    m.add_mesh(g, g_finial(), m_gold)
        .set_pos(s * 0.052 * HEX_R, 0.600 * HEX_R, -0.122 * HEX_R)
        .set_name(&nm("finial"));
}

/// `buildDruzynnik(ownerColor)` (`jednostki-z3-plemiona.ts:614-776`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_druzynnik(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let pf = "dr";
    let m_linen = m.mat(TR_LINEN, 0.05, 0.84);
    let m_leath = m.mat(TR_LEATHER, 0.06, 0.82);
    let m_wool = m.mat(TR_WOOL_DK, 0.05, 0.88);
    let m_steel = m.mat(TR_STEEL, 0.55, 0.35);
    let m_bronz = m.mat(TR_BRONZE, 0.45, 0.42);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_wood = m.mat(TR_WOOD, 0.05, 0.85);
    let m_hair = m.mat(TR_HAIR_SLAV, 0.04, 0.86);
    let m_skin = m.mat(TR_SKIN, 0.05, 0.80);

    let hip_y = TR_HIP_Y - 0.012 * HEX_R;

    tr_core(&mut m, g, m_linen, TR_SKIN, false, pf);
    m.add_mesh(g, g_kaftan(), m_leath)
        .set_pos(0.0, TR_TORSO_CTR - 0.016 * HEX_R, 0.0)
        .set_name("dr-kaftan");
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, TR_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("dr-skirt");
    m.add_mesh(g, g_belt(), m_bronz)
        .set_scale(1.10, 1.0, 1.16)
        .set_pos(0.0, 0.2540 * HEX_R, 0.0)
        .set_name("dr-belt");

    tr_build_leg(
        &mut m, g, TR_HIP_X, 0.58, 0.34, m_wool, m_wool, m_leath, hip_y, pf, "left",
    );
    tr_build_leg(
        &mut m, g, -TR_HIP_X, -0.52, -0.20, m_wool, m_wool, m_leath, hip_y, pf, "right",
    );

    let n_before = m.nodes[g].children.len();
    tr_wasy(&mut m, g, m_hair);
    let n_after = m.nodes[g].children.len();
    for i in n_before..n_after {
        let c = m.nodes[g].children[i];
        m.node(c)
            .set_name(&format!("dr-moustache-{}", i - n_before));
    }

    m.add_mesh(g, g_cone_helm(), m_steel)
        .set_pos(0.0, TR_HEAD_CTR + 0.052 * HEX_R, 0.0)
        .set_name("dr-helmet-cone");
    m.add_mesh(g, g_helm_rim(), m_bronz)
        .set_pos(0.0, TR_HEAD_CTR + 0.006 * HEX_R, 0.0)
        .set_name("dr-helmet-band");
    m.add_mesh(g, g_nosal(), m_steel)
        .set_pos(
            0.0,
            TR_HEAD_CTR - 0.006 * HEX_R,
            TR_HEAD_S * 0.5 + 0.008 * HEX_R,
        )
        .set_name("dr-helmet-nasal");

    let (wrist_r, ax) = tr_build_arm(
        &mut m,
        g,
        -TR_SHLD_X,
        0.95,
        1.50,
        m_linen,
        m_skin,
        Some(m_leath),
        pf,
        "right",
    );
    m.add_mesh(g, g_guard(), m_bronz)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, ax, 0.030 * HEX_R))
        .set_name("dr-sword-guard");
    m.add_mesh(g, g_blade(), m_steel)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, ax, 0.108 * HEX_R))
        .set_name("dr-sword-blade");
    m.add_mesh(g, g_blade_tip(), m_steel)
        .rot_x(PI - 1.50)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, ax, 0.204 * HEX_R))
        .set_name("dr-sword-tip");
    m.add_mesh(g, g_pommel(), m_bronz)
        .rot_x(PI - 1.50)
        .set_scale(2.10, 1.0, 2.40)
        .set_pos_v(add_scaled(wrist_r, ax, -0.020 * HEX_R))
        .set_name("dr-sword-pommel");

    let (wrist_l, _) = tr_build_arm(
        &mut m, g, TR_SHLD_X, 0.50, 1.10, m_linen, m_skin, None, pf, "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y + 0.034 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.22);
    m.add_mesh(sh, g_rnd_face(), m_owner)
        .rot_x(PI / 2.0)
        .set_name("dr-shield-face");
    m.add_mesh(sh, g_rnd_rim(), m_leath)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, -0.006 * HEX_R)
        .set_name("dr-shield-rim");
    for (pi, a) in [0.0, PI / 3.0, -PI / 3.0].into_iter().enumerate() {
        m.add_mesh(sh, g_plank(), m_wood)
            .rot_z(a)
            .set_pos(0.0, 0.0, 0.016 * HEX_R)
            .set_name(&format!("dr-shield-plank-{pi}"));
    }
    m.add_mesh(sh, g_umbo(), m_steel)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, 0.028 * HEX_R)
        .set_name("dr-shield-umbo");
    m.attach(g, sh);
    m
}

/// `buildIButho(ownerColor)` (`:932-1130`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_ibutho(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let pf = "ib";
    const ISI: f64 = 1.25;
    let m_skin = m.mat(TR_SKIN_ZULU, 0.05, 0.80);
    let m_fur = m.mat(TR_FUR, 0.04, 0.92);
    let m_fur_lt = m.mat(TR_FUR_LT, 0.04, 0.90);
    let m_hide = m.mat(TR_HIDE_DK, 0.04, 0.88);
    let m_black = m.mat(TR_BLACK, 0.04, 0.90);
    let m_leath = m.mat(TR_LEATHER, 0.05, 0.84);
    let m_owner = m.mat(owner, 0.10, 0.68);
    let m_wood = m.mat(0x007a_5c3a, 0.05, 0.85);
    let m_iron = m.mat(TR_STEEL, 0.52, 0.38);
    let m_ivory = m.mat(TR_IVORY, 0.06, 0.78);
    let m_crane = m.mat(TR_CRANE_WHT, 0.03, 0.88);

    let hip_y = TR_HIP_Y - 0.014 * HEX_R;

    tr_core(&mut m, g, m_skin, TR_SKIN_ZULU, true, pf);
    m.add_mesh(g, g_skirt(), m_fur)
        .set_pos(0.0, TR_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("ib-skirt");
    m.add_mesh(g, g_fringe(), m_owner)
        .set_scale(1.30, 1.35, 1.0)
        .set_pos(0.0, TR_TORSO_BOT - 0.046 * HEX_R, 0.062 * HEX_R)
        .set_name("ib-skirt-flap");

    m.add_mesh(g, g_neck_band(), m_leath)
        .set_pos(0.0, TR_TORSO_TOP - 0.006 * HEX_R, 0.014 * HEX_R)
        .set_name("ib-necklace-band");
    for (k, s) in [-1.0_f64, 0.0, 1.0].into_iter().enumerate() {
        m.add_mesh(g, g_tooth(), m_ivory)
            .rot_x(PI)
            .rot_y(PI / 4.0)
            .set_pos(
                (s * 0.032 - 0.034) * HEX_R,
                TR_TORSO_TOP - 0.036 * HEX_R,
                TR_TORSO_D * 0.5 + 0.012 * HEX_R,
            )
            .set_name(&format!("ib-necklace-tooth-{k}"));
    }

    tr_build_leg(
        &mut m, g, TR_HIP_X, 0.88, 0.54, m_skin, m_skin, m_skin, hip_y, pf, "left",
    );
    tr_build_leg(
        &mut m, g, -TR_HIP_X, -0.58, -0.24, m_skin, m_skin, m_skin, hip_y, pf, "right",
    );

    m.add_mesh(g, g_isicoco(), m_black)
        .set_scale(1.22, 1.35, 1.22)
        .set_pos(0.0, TR_HEAD_TOP + 0.012 * HEX_R, 0.0)
        .set_name("ib-isicoco");
    for (k, s) in [-1.0_f64, 0.0, 1.0].into_iter().enumerate() {
        let mt = if s == 0.0 { m_crane } else { m_black };
        let dy = if s == 0.0 { 0.118 } else { 0.104 };
        m.add_mesh(g, g_feather(), mt)
            .rot_z(s * 0.26)
            .rot_x(-0.10)
            .set_scale(1.0, 1.30, 1.0)
            .set_pos(s * 0.040 * HEX_R, TR_HEAD_TOP + dy * HEX_R, -0.024 * HEX_R)
            .set_name(&format!("ib-plume-{k}"));
    }

    let (wrist_r, ax) = tr_build_arm(
        &mut m,
        g,
        -TR_SHLD_X,
        1.22,
        1.62,
        m_skin,
        m_skin,
        Some(m_skin),
        pf,
        "right",
    );
    m.add_mesh(g, g_shoba(), m_fur_lt)
        .rot_x(PI - 1.22)
        .set_pos(-TR_SHLD_X, TR_SHLD_Y - 0.030 * HEX_R, 0.030 * HEX_R)
        .set_name("ib-amashoba-right");
    m.add_mesh(g, g_iklwa_shaft(), m_wood)
        .rot_x(PI - 1.62)
        .set_scale(1.0, 0.87, 1.0)
        .set_pos_v(add_scaled(wrist_r, ax, 0.040 * HEX_R))
        .set_name("ib-iklwa-shaft");
    m.add_mesh(g, g_iklwa_blade(), m_iron)
        .rot_x(PI - 1.62)
        .set_pos_v(add_scaled(wrist_r, ax, 0.183 * HEX_R))
        .set_name("ib-iklwa-blade");
    m.add_mesh(g, g_iklwa_tip(), m_iron)
        .rot_x(PI - 1.62)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, ax, 0.246 * HEX_R))
        .set_name("ib-iklwa-tip");

    let (wrist_l, _) = tr_build_arm(
        &mut m, g, TR_SHLD_X, 0.72, 1.28, m_skin, m_skin, None, pf, "left",
    );
    m.add_mesh(g, g_shoba(), m_fur_lt)
        .rot_x(PI - 0.72)
        .set_pos(
            TR_SHLD_X + 0.020 * HEX_R,
            TR_SHLD_Y - 0.014 * HEX_R,
            0.010 * HEX_R,
        )
        .set_name("ib-amashoba-left");
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.040 * HEX_R,
            wrist_l.y + 0.100 * HEX_R,
            wrist_l.z + 0.042 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, g_nguni_shell(), m_leath)
        .set_scale(ISI, ISI, 1.0)
        .set_name("ib-shield-shell");
    m.add_mesh(sh, g_nguni_face(), m_hide)
        .set_scale(ISI, ISI, 1.0)
        .set_pos(0.0, 0.0, 0.010 * HEX_R)
        .set_name("ib-shield-face");
    m.add_mesh(sh, g_patch_big(), m_black)
        .rot_z(0.30)
        .set_scale(ISI, ISI, 1.0)
        .set_pos(-0.030 * ISI * HEX_R, 0.088 * ISI * HEX_R, 0.016 * HEX_R)
        .set_name("ib-shield-patch-0");
    m.add_mesh(sh, g_patch_big(), m_black)
        .rot_z(-0.42)
        .set_scale(ISI, ISI, 1.0)
        .set_pos(0.026 * ISI * HEX_R, -0.086 * ISI * HEX_R, 0.016 * HEX_R)
        .set_name("ib-shield-patch-1");
    m.add_mesh(sh, g_patch_sm(), m_black)
        .rot_z(0.55)
        .set_scale(ISI, ISI, 1.0)
        .set_pos(0.040 * ISI * HEX_R, 0.020 * ISI * HEX_R, 0.016 * HEX_R)
        .set_name("ib-shield-patch-2");
    m.add_mesh(sh, g_diamond(), m_owner)
        .rot_z(PI / 4.0)
        .set_scale(1.25, 1.25, 1.0)
        .set_pos(0.0, 0.0, 0.022 * HEX_R)
        .set_name("ib-shield-diamond");
    m.add_mesh(sh, g_mgobo(), m_wood)
        .set_scale(1.0, ISI, 1.0)
        .set_pos(0.0, 0.010 * ISI * HEX_R, -0.014 * HEX_R)
        .set_name("ib-shield-mgobo");
    m.add_mesh(sh, g_mgobo_tuft(), m_fur_lt)
        .set_scale(1.45, 1.45, 1.45)
        .set_pos(0.0, 0.278 * ISI * HEX_R, -0.014 * HEX_R)
        .set_name("ib-shield-mgobo-tuft");
    m.attach(g, sh);
    m
}

/// `buildBerserker(ownerColor)` of the Z3 file (`:1169-1298`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_berserker(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let pf = "bs";
    let m_skin = m.mat(TR_SKIN, 0.05, 0.80);
    let m_pelt = m.mat(TR_PELT, 0.04, 0.94);
    let m_pelt_l = m.mat(TR_FUR_LT, 0.04, 0.92);
    let m_leath = m.mat(TR_LEATHER, 0.06, 0.82);
    let m_hair = m.mat(TR_HAIR_BLOND, 0.04, 0.86);
    let m_wood = m.mat(TR_WOOD, 0.05, 0.85);
    let m_iron = m.mat(TR_STEEL, 0.55, 0.38);
    let m_owner = m.mat(owner, 0.12, 0.66);

    let hip_y = TR_HIP_Y - 0.016 * HEX_R;

    tr_core(&mut m, g, m_skin, TR_SKIN, true, pf);
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_war_paint(), m_owner)
            .rot_z(s * 0.42)
            .set_pos(
                s * 0.024 * HEX_R,
                TR_TORSO_CTR + 0.018 * HEX_R,
                TR_TORSO_D * 0.5 + 0.005 * HEX_R,
            )
            .set_name(&format!("bs-warpaint-{}", lr(s)));
    }
    m.add_mesh(g, g_pelt_cape(), m_pelt)
        .rot_x(0.14)
        .set_pos(
            0.0,
            TR_TORSO_CTR - 0.010 * HEX_R,
            -(TR_TORSO_D * 0.5 + 0.010 * HEX_R),
        )
        .set_name("bs-pelt-cape");
    m.add_mesh(g, g_loin(), m_leath)
        .set_pos(0.0, TR_TORSO_BOT - 0.020 * HEX_R, 0.0)
        .set_name("bs-loincloth");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.248 * HEX_R, 0.0)
        .set_name("bs-belt");

    tr_build_leg(
        &mut m, g, TR_HIP_X, 0.80, 0.44, m_skin, m_skin, m_leath, hip_y, pf, "left",
    );
    tr_build_leg(
        &mut m, g, -TR_HIP_X, -0.72, -0.30, m_skin, m_skin, m_leath, hip_y, pf, "right",
    );

    m.add_mesh(g, g_hair_loose(), m_hair)
        .set_pos(
            0.0,
            TR_HEAD_CTR - 0.017 * HEX_R,
            -(TR_HEAD_S * 0.5 + 0.016 * HEX_R),
        )
        .set_name("bs-hair");
    m.add_mesh(g, g_wolf_hood(), m_pelt)
        .set_pos(0.0, TR_HEAD_TOP, 0.0)
        .set_name("bs-wolf-hood");
    m.add_mesh(g, g_wolf_snout(), m_pelt_l)
        .set_pos(0.0, TR_HEAD_TOP + 0.017 * HEX_R, 0.062 * HEX_R)
        .set_name("bs-wolf-snout");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_wolf_ear(), m_pelt_l)
            .set_pos(
                s * 0.052 * HEX_R,
                TR_HEAD_TOP + 0.066 * HEX_R,
                -0.012 * HEX_R,
            )
            .set_name(&format!("bs-wolf-ear-{}", lr(s)));
    }

    const TH_R: f64 = -2.58;
    let (wrist_r, ax) = tr_build_arm(
        &mut m,
        g,
        -TR_SHLD_X,
        -2.05,
        TH_R,
        m_skin,
        m_skin,
        Some(m_skin),
        pf,
        "right",
    );
    m.add_mesh(g, g_axe_haft(), m_wood)
        .rot_x(PI - TH_R)
        .set_pos_v(add_scaled(wrist_r, ax, 0.095 * HEX_R))
        .set_name("bs-axe-haft");
    let bit = m.add_mesh_id(g, g_axe_head(), m_iron);
    m.node(bit)
        .rot_x(PI - TH_R)
        .set_pos_v(add_scaled(wrist_r, ax, 0.170 * HEX_R));
    m.node(bit).position.x -= 0.030 * HEX_R;
    m.node(bit).set_name("bs-axe-head");
    let poll = m.add_mesh_id(g, g_axe_poll(), m_iron);
    m.node(poll)
        .rot_x(PI - TH_R)
        .set_pos_v(add_scaled(wrist_r, ax, 0.170 * HEX_R));
    m.node(poll).position.x += 0.018 * HEX_R;
    m.node(poll).set_name("bs-axe-poll");

    tr_build_arm(
        &mut m,
        g,
        TR_SHLD_X,
        1.05,
        0.55,
        m_skin,
        m_skin,
        Some(m_skin),
        pf,
        "left",
    );
    m
}

/// `buildGermanSuper(ownerColor)` (`:1330-1528`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_german_super(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let pf = "gw";
    let m_skin = m.mat(TR_SKIN, 0.05, 0.80);
    let m_fur = m.mat(TR_PELT, 0.04, 0.94);
    let m_fur_lt = m.mat(TR_FUR_LT, 0.04, 0.90);
    let m_leath = m.mat(TR_LEATHER, 0.06, 0.82);
    let m_wool = m.mat(0x005a_5040, 0.05, 0.88);
    let m_iron = m.mat(TR_STEEL, 0.55, 0.35);
    let m_iron_d = m.mat(TR_IRON_DK, 0.45, 0.50);
    let m_wood = m.mat(TR_WOOD, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_beard = m.mat(TR_HAIR_GER, 0.04, 0.86);
    let m_gold = m.mat(TR_GOLD, 0.55, 0.35);
    let m_pole = m.mat(0x005f_4020, 0.05, 0.85);

    let hip_y = TR_HIP_Y - 0.014 * HEX_R;

    tr_core(&mut m, g, m_skin, TR_SKIN, false, pf);
    {
        let strap = m.add_mesh_id(g, g_strap(), m_leath);
        super::kit::rot3(&mut m, strap, -0.35, 0.0, 0.66);
        m.node(strap)
            .set_pos(
                -0.012 * HEX_R,
                TR_TORSO_CTR + 0.020 * HEX_R,
                TR_TORSO_D * 0.5 - 0.014 * HEX_R,
            )
            .set_name("gw-strap");
    }
    m.add_mesh(g, g_skirt(), m_wool)
        .set_pos(0.0, TR_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("gw-skirt");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("gw-belt");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_fur_pad(), m_fur)
            .set_pos(
                s * (TR_SHLD_X - 0.004 * HEX_R),
                TR_TORSO_TOP + 0.008 * HEX_R,
                0.0,
            )
            .set_name(&format!("gw-fur-pad-{}", lr(s)));
    }

    tr_build_leg(
        &mut m, g, TR_HIP_X, 0.62, 0.36, m_wool, m_wool, m_leath, hip_y, pf, "left",
    );
    tr_build_leg(
        &mut m, g, -TR_HIP_X, -0.56, -0.22, m_wool, m_wool, m_leath, hip_y, pf, "right",
    );

    m.add_mesh(g, g_beard(), m_beard)
        .set_pos(
            0.0,
            TR_HEAD_CTR - 0.052 * HEX_R,
            TR_HEAD_S * 0.5 - 0.004 * HEX_R,
        )
        .set_name("gw-beard");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_braid(), m_beard)
            .rot_z(s * 0.10)
            .set_pos(
                s * 0.026 * HEX_R,
                TR_HEAD_CTR - 0.112 * HEX_R,
                TR_HEAD_S * 0.5 + 0.002 * HEX_R,
            )
            .set_name(&format!("gw-beard-braid-{}", lr(s)));
    }

    m.add_mesh(g, g_dome_helm(), m_iron)
        .set_pos(0.0, TR_HEAD_CTR + 0.044 * HEX_R, 0.0)
        .set_name("gw-helmet-dome");
    m.add_mesh(g, g_fur_band(), m_fur_lt)
        .set_pos(0.0, TR_HEAD_CTR + 0.012 * HEX_R, 0.0)
        .set_name("gw-helmet-furband");

    const TH_ARM: f64 = 1.42;
    let (wrist_r, axis_r) = tr_build_arm(
        &mut m,
        g,
        -TR_SHLD_X,
        -2.55,
        TH_ARM,
        m_skin,
        m_skin,
        Some(m_leath),
        pf,
        "right",
    );
    const TH_W: f64 = -2.763;
    let wx = dir_down(TH_W);
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_framea_shaft(), m_wood)
        .rot_x(PI - TH_W)
        .set_pos_v(add_scaled(grip, wx, 0.055 * HEX_R))
        .set_name("gw-framea-shaft");
    m.add_mesh(g, g_framea_sock(), m_iron_d)
        .rot_x(PI - TH_W)
        .set_pos_v(add_scaled(grip, wx, 0.239 * HEX_R))
        .set_name("gw-framea-socket");
    m.add_mesh(g, g_framea_head(), m_iron)
        .rot_x(PI - TH_W)
        .set_pos_v(add_scaled(grip, wx, 0.289 * HEX_R))
        .set_name("gw-framea-head");

    let (wrist_l, _) = tr_build_arm(
        &mut m, g, TR_SHLD_X, 0.52, 1.08, m_skin, m_skin, None, pf, "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.028 * HEX_R,
            wrist_l.y + 0.036 * HEX_R,
            wrist_l.z + 0.046 * HEX_R,
        )
        .rot_y(-0.20);
    m.add_mesh(sh, g_rnd_face(), m_owner)
        .rot_x(PI / 2.0)
        .set_name("gw-shield-face");
    m.add_mesh(sh, g_rnd_rim(), m_wood)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, -0.006 * HEX_R)
        .set_name("gw-shield-rim");
    for k in 0..4_u32 {
        let fk = f64::from(k);
        let a = 0.55 + fk * 1.05;
        let r = 0.052 + fk * 0.017;
        m.add_mesh(sh, g_spiral_arm(), m_iron_d)
            .rot_z(a + PI / 2.0)
            .set_pos(js_cos(a) * r * HEX_R, js_sin(a) * r * HEX_R, 0.018 * HEX_R)
            .set_name(&format!("gw-shield-spiral-{k}"));
    }
    m.add_mesh(sh, g_umbo(), m_iron)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, 0.028 * HEX_R)
        .set_name("gw-shield-boss");
    m.attach(g, sh);

    tr_super_banner(&mut m, g, m_pole, m_owner, m_gold, pf, 1.0);
    m
}

/// `trFront(th)` (`:1794-1795`): front-wall normal of a limb.
fn tr_front(th: f64) -> Vec3 {
    v3(0.0, js_sin(th), js_cos(th))
}

/// `buildMiecznikGalijski(ownerColor)` (`:1774-1994`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_miecznik_galijski(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let pf = "mg";
    let m_tunic = m.mat(TR_BURGUNDY, 0.05, 0.84);
    let m_brac = m.mat(TR_BRACCAE, 0.05, 0.86);
    let m_ochre = m.mat(TR_OCHRE, 0.05, 0.84);
    let m_woad = m.mat(TR_WOAD, 0.05, 0.84);
    let m_leath = m.mat(TR_LEATHER, 0.06, 0.82);
    let m_iron = m.mat(TR_STEEL, 0.55, 0.35);
    let m_bronz = m.mat(TR_BRONZE, 0.45, 0.42);
    let m_gold = m.mat(TR_GOLD, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_hair = m.mat(TR_HAIR_CELT, 0.04, 0.86);
    let m_skin = m.mat(TR_SKIN, 0.05, 0.80);
    let m_black = m.mat(TR_BLACK, 0.05, 0.85);

    let hip_y = TR_HIP_Y - 0.012 * HEX_R;

    tr_core(&mut m, g, m_tunic, TR_SKIN, true, pf);
    m.add_mesh(g, g_skirt(), m_tunic)
        .set_pos(0.0, TR_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("mg-skirt");
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("mg-belt");
    m.add_mesh(g, g_torc(), m_gold)
        .set_scale(1.15, 1.0, 1.15)
        .set_pos(0.0, TR_TORSO_TOP + 0.002 * HEX_R, 0.012 * HEX_R)
        .set_name("mg-torc");

    let leg_l = tr_build_leg(
        &mut m, g, TR_HIP_X, 0.58, 0.34, m_brac, m_brac, m_leath, hip_y, pf, "left",
    );
    let leg_r = tr_build_leg(
        &mut m, g, -TR_HIP_X, -0.52, -0.20, m_brac, m_brac, m_leath, hip_y, pf, "right",
    );
    for (leg, th_u, th_l, side) in [
        (leg_l, 0.58_f64, 0.34_f64, "left"),
        (leg_r, -0.52, -0.20, "right"),
    ] {
        let d_u = dir_down(th_u);
        let n_u = tr_front(th_u);
        let d_l = dir_down(th_l);
        let n_l = tr_front(th_l);
        let shin_top = leg.knee.plus(v3(0.0, 0.008 * HEX_R, -0.004 * HEX_R));
        let shin_ctr = add_scaled(shin_top, d_l, TR_SHIN_L * 0.5);

        m.add_mesh(g, g_band(), m_ochre)
            .rot_x(PI - th_l)
            .set_scale(0.78, 0.90, 0.78)
            .set_pos_v(add_scaled(shin_top, d_l, TR_SHIN_L * 0.45))
            .set_name(&format!("mg-braccae-band-shin-{side}"));
        m.add_mesh(g, g_band(), m_ochre)
            .rot_x(PI - th_u)
            .set_pos_v(add_scaled(
                v3(leg.thigh_ctr.x, hip_y, 0.0),
                d_u,
                TR_THIGH_L * 0.74,
            ))
            .set_name(&format!("mg-braccae-band-thigh-{side}"));
        m.add_mesh(g, g_pion(), m_woad)
            .rot_x(PI - th_l)
            .set_scale(1.0, 0.86, 1.0)
            .set_pos_v(add_scaled(shin_ctr, n_l, 0.024 * HEX_R))
            .set_name(&format!("mg-braccae-stripe-shin-{side}"));
        m.add_mesh(g, g_pion(), m_woad)
            .rot_x(PI - th_u)
            .set_scale(1.0, 0.60, 1.0)
            .set_pos_v(add_scaled(
                add_scaled(v3(leg.thigh_ctr.x, hip_y, 0.0), d_u, TR_THIGH_L * 0.70),
                n_u,
                0.033 * HEX_R,
            ))
            .set_name(&format!("mg-braccae-stripe-thigh-{side}"));
    }

    m.add_mesh(g, g_hair_bk(), m_hair)
        .set_pos(
            0.0,
            TR_HEAD_CTR - 0.010 * HEX_R,
            -(TR_HEAD_S * 0.5 + 0.010 * HEX_R),
        )
        .set_name("mg-hair");
    let n_before = m.nodes[g].children.len();
    tr_wasy(&mut m, g, m_hair);
    let n_after = m.nodes[g].children.len();
    for i in n_before..n_after {
        let c = m.nodes[g].children[i];
        let side = if i == n_before { "right" } else { "left" };
        m.node(c).set_name(&format!("mg-moustache-{side}"));
    }

    m.add_mesh(g, g_mont_bowl(), m_iron)
        .set_scale(0.78, 1.0, 0.78)
        .set_pos(0.0, TR_HEAD_CTR + 0.030 * HEX_R, 0.0)
        .set_name("mg-helmet-bowl");
    let bowl_top = TR_HEAD_CTR + 0.030 * HEX_R + 0.046 * HEX_R;
    m.add_mesh(g, g_umbo(), m_iron)
        .set_scale(0.42, 0.72, 0.42)
        .set_pos(0.0, bowl_top + 0.010 * HEX_R, 0.0)
        .set_name("mg-helmet-knob");
    m.add_mesh(g, g_kita(), m_black)
        .set_pos(0.0, bowl_top + 0.020 * HEX_R + 0.046 * HEX_R, 0.0)
        .set_name("mg-helmet-crest");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_wasy(), m_iron)
            .set_scale(0.72, 1.30, 2.70)
            .rot_z(s * 0.10)
            .set_pos(
                s * 0.070 * HEX_R,
                TR_HEAD_CTR - 0.014 * HEX_R,
                0.006 * HEX_R,
            )
            .set_name(&format!("mg-helmet-cheek-{}", lr(s)));
    }

    const TH_ARM: f64 = -1.85;
    const TH_SWORD: f64 = -2.35;
    let (wrist_r, ax) = tr_build_arm(
        &mut m,
        g,
        -TR_SHLD_X,
        TH_ARM,
        TH_SWORD,
        m_tunic,
        m_skin,
        Some(m_leath),
        pf,
        "right",
    );
    m.add_mesh(g, g_guard(), m_bronz)
        .rot_x(PI - TH_SWORD)
        .set_pos_v(add_scaled(wrist_r, ax, 0.030 * HEX_R))
        .set_name("mg-sword-guard");
    m.add_mesh(g, g_long_blade(), m_iron)
        .rot_x(PI - TH_SWORD)
        .set_pos_v(add_scaled(wrist_r, ax, 0.140 * HEX_R))
        .set_name("mg-sword-blade");
    m.add_mesh(g, g_blade_tip(), m_iron)
        .rot_x(PI - TH_SWORD)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, ax, 0.266 * HEX_R))
        .set_name("mg-sword-tip");

    let (wrist_l, _) = tr_build_arm(
        &mut m, g, TR_SHLD_X, 0.50, 1.10, m_tunic, m_skin, None, pf, "left",
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y + 0.034 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.22);
    m.add_mesh(sh, g_oval_shell(), m_leath)
        .set_name("mg-shield-shell");
    m.add_mesh(sh, g_oval_face(), m_owner)
        .set_pos(0.0, 0.0, 0.014 * HEX_R)
        .set_name("mg-shield-face");
    for k in 0..3_u32 {
        let a = f64::from(k) * (PI * 2.0 / 3.0) + PI / 2.0;
        m.add_mesh(sh, g_tri_arm(), m_gold)
            .rot_z(a + 0.85)
            .set_pos(
                js_cos(a) * 0.040 * HEX_R,
                js_sin(a) * 0.040 * HEX_R,
                0.026 * HEX_R,
            )
            .set_name(&format!("mg-shield-triskelion-{k}"));
    }
    m.add_mesh(sh, g_umbo(), m_iron)
        .rot_x(PI / 2.0)
        .set_scale(0.7, 0.8, 0.7)
        .set_pos(0.0, 0.0, 0.030 * HEX_R)
        .set_name("mg-shield-umbo");
    m.attach(g, sh);
    m
}
