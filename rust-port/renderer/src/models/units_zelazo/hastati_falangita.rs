//! Port of `render/hastati-falangita.ts` (`edb8fb56`): `buildHastati`
//! (exported, but reachable from no record and no name rule — `units.ts:1665`
//! routes "hastati" to `buildHastatiOpus5`; kept so that no `Base` stays a
//! stub) and `buildFalangita` (record "Falanga", rule `units.ts:1526`, and the
//! category fallback `case 'falanga'`, `units.ts:3704`).
//!
//! The lazily created `getGNI*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{
    add_scaled, bx, cn, cy, cy_open, dir_down, oval_face, oval_shell, ring, rot3, seg, v3,
};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── kolory serii (`hastati-falangita.ts:65-77`)
const NI_SKIN: u32 = 0xe0ac69;
const NI_STEEL: u32 = 0xc2cad2;
const NI_BRONZE: u32 = 0xcf9234;
const NI_BRONZE_LT: u32 = 0xd0a050;
const NI_WOOD: u32 = 0x7a5c3a;
const NI_LEATHER: u32 = 0x6b4a28;
const NI_GOLD: u32 = 0xd8b040;
const NI_LINEN: u32 = 0xe8e0c8;
const NI_ROMAN_RED: u32 = 0xa42a22;
const NI_CRIMSON: u32 = 0xa01f2e;
const NI_WOAD: u32 = 0x2f5aa0;
const NI_PURPLE: u32 = 0x7a2c96;
const NI_BLACK: u32 = 0x171310;

// ── wymiary sylwetki (`:80-99`)
const NI_HIP_Y: f64 = 0.208 * HEX_R;
const NI_TORSO_W: f64 = 0.180 * HEX_R;
const NI_TORSO_H: f64 = 0.205 * HEX_R;
const NI_TORSO_D: f64 = 0.100 * HEX_R;
const NI_TORSO_BOT: f64 = 0.240 * HEX_R;
const NI_TORSO_CTR: f64 = NI_TORSO_BOT + NI_TORSO_H * 0.5;
const NI_TORSO_TOP: f64 = NI_TORSO_BOT + NI_TORSO_H;
const NI_NECK_H: f64 = 0.028 * HEX_R;
const NI_HEAD_S: f64 = 0.128 * HEX_R;
const NI_HEAD_CTR: f64 = NI_TORSO_TOP + NI_NECK_H + NI_HEAD_S * 0.5;
const NI_HEAD_TOP: f64 = NI_TORSO_TOP + NI_NECK_H + NI_HEAD_S;
const NI_SHLD_X: f64 = NI_TORSO_W * 0.5 + 0.030 * HEX_R;
const NI_SHLD_Y: f64 = NI_TORSO_TOP - 0.024 * HEX_R;
const NI_HIP_X: f64 = 0.052 * HEX_R;
const NI_THIGH_L: f64 = 0.104 * HEX_R;
const NI_SHIN_L: f64 = 0.096 * HEX_R;
const NI_UPARM_L: f64 = 0.100 * HEX_R;
const NI_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:190-232`)
fn g_torso() -> Geo {
    bx(NI_TORSO_W, NI_TORSO_H, NI_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, NI_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(NI_HEAD_S, NI_HEAD_S, NI_HEAD_S)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, NI_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, NI_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, NI_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, NI_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_greave() -> Geo {
    bx(0.046 * HEX_R, 0.098 * HEX_R, 0.050 * HEX_R)
}
fn g_mont_bowl() -> Geo {
    cy(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8)
}
fn g_mont_neck() -> Geo {
    bx(0.150 * HEX_R, 0.020 * HEX_R, 0.052 * HEX_R)
}
fn g_cheek() -> Geo {
    bx(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)
}
fn g_kita() -> Geo {
    bx(0.032 * HEX_R, 0.056 * HEX_R, 0.028 * HEX_R)
}
fn g_feather() -> Geo {
    bx(0.026 * HEX_R, 0.108 * HEX_R, 0.012 * HEX_R)
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
fn g_spina() -> Geo {
    bx(0.020 * HEX_R, 0.300 * HEX_R, 0.014 * HEX_R)
}
fn g_umbo() -> Geo {
    bx(0.052 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)
}
fn g_pect() -> Geo {
    bx(0.096 * HEX_R, 0.096 * HEX_R, 0.018 * HEX_R)
}
fn g_strap() -> Geo {
    bx(0.026 * HEX_R, 0.120 * HEX_R, 0.008 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)
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
fn g_cor_dome() -> Geo {
    cy(0.066 * HEX_R, 0.084 * HEX_R, 0.128 * HEX_R, 9)
}
fn g_slit() -> Geo {
    bx(0.052 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)
}
fn g_crest_base() -> Geo {
    bx(0.022 * HEX_R, 0.030 * HEX_R, 0.128 * HEX_R)
}
fn g_crest_hair() -> Geo {
    bx(0.028 * HEX_R, 0.080 * HEX_R, 0.170 * HEX_R)
}
fn g_yoke() -> Geo {
    bx(0.070 * HEX_R, 0.024 * HEX_R, 0.120 * HEX_R)
}
fn g_aspis_face() -> Geo {
    cy(0.128 * HEX_R, 0.100 * HEX_R, 0.034 * HEX_R, 12)
}
fn g_aspis_rim() -> Geo {
    cy_open(0.140 * HEX_R, 0.140 * HEX_R, 0.020 * HEX_R, 12)
}
fn g_episema() -> Geo {
    ring(0.058 * HEX_R, 0.082 * HEX_R, 12, 1)
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

/// `niBuildLeg` (`:261-273`).
#[allow(clippy::too_many_arguments)]
fn ni_build_leg(
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
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, NI_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, NI_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
}

/// `niBuildArm` (`:280-296`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn ni_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, NI_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, NI_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, NI_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `niBuildCore` (`:303-316`).
fn ni_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId) {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, NI_TORSO_CTR, 0.0);
    let m_skin = m.mat(NI_SKIN, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, NI_TORSO_TOP + NI_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, NI_HEAD_CTR, 0.0);
}

/// `buildHastati(ownerColor)` (`hastati-falangita.ts:327-439`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_hastati(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_gold = m.mat(NI_GOLD, 0.55, 0.35);
    let m_bronz_l = m.mat(NI_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_red = m.mat(NI_ROMAN_RED, 0.05, 0.80);
    let m_steel = m.mat(NI_STEEL, 0.55, 0.35);
    let m_leath = m.mat(NI_LEATHER, 0.05, 0.82);
    let m_skin = m.mat(NI_SKIN, 0.05, 0.80);
    let m_purple = m.mat(NI_PURPLE, 0.08, 0.72);
    let m_black = m.mat(NI_BLACK, 0.05, 0.85);

    let hip_y = NI_HIP_Y - 0.012 * HEX_R;

    ni_build_core(&mut m, g, m_red);
    m.add_mesh(g, g_skirt(), m_red)
        .set_pos(0.0, NI_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);

    m.add_mesh(g, g_pect(), m_gold)
        .set_pos(0.0, 0.386 * HEX_R, NI_TORSO_D * 0.5 + 0.010 * HEX_R);
    for s in [-1.0_f64, 1.0] {
        let strap = m.add_mesh_id(g, g_strap(), m_leath);
        rot3(&mut m, strap, -0.55, 0.0, s * 0.62);
        m.node(strap)
            .set_pos(s * 0.020 * HEX_R, 0.446 * HEX_R, 0.040 * HEX_R);
    }

    ni_build_leg(
        &mut m, g, NI_HIP_X, 0.58, 0.34, m_red, m_skin, m_leath, hip_y,
    );
    ni_build_leg(
        &mut m, g, -NI_HIP_X, -0.52, -0.20, m_red, m_skin, m_leath, hip_y,
    );
    m.add_mesh(g, g_greave(), m_gold).rot_x(PI - 0.34).set_pos(
        NI_HIP_X,
        0.072 * HEX_R,
        0.069 * HEX_R,
    );

    m.add_mesh(g, g_mont_bowl(), m_gold)
        .set_pos(0.0, NI_HEAD_CTR + 0.030 * HEX_R, 0.0);
    m.add_mesh(g, g_mont_neck(), m_bronz_l)
        .rot_x(-0.35)
        .set_pos(
            0.0,
            NI_HEAD_CTR - 0.014 * HEX_R,
            -(NI_HEAD_S * 0.5 + 0.020 * HEX_R),
        );
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_cheek(), m_gold).set_pos(
            sx * (NI_HEAD_S * 0.5 + 0.004 * HEX_R),
            NI_HEAD_CTR - 0.014 * HEX_R,
            0.018 * HEX_R,
        );
    }
    m.add_mesh(g, g_kita(), m_black)
        .set_pos(0.0, NI_HEAD_TOP + 0.030 * HEX_R, 0.0);
    for sx in [-1.0_f64, 0.0, 1.0] {
        let dy = if sx == 0.0 { 0.098 } else { 0.088 };
        m.add_mesh(g, g_feather(), m_purple)
            .rot_z(-sx * 0.16)
            .set_pos(sx * 0.034 * HEX_R, NI_HEAD_TOP + dy * HEX_R, 0.0);
    }

    let (wrist_r, axis_r) = ni_build_arm(
        &mut m,
        g,
        -NI_SHLD_X,
        0.95,
        1.50,
        m_red,
        m_skin,
        Some(m_leath),
    );
    let blade_dir = axis_r;
    m.add_mesh(g, g_blade(), m_steel)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, blade_dir, 0.098 * HEX_R));
    m.add_mesh(g, g_blade_tip(), m_steel)
        .rot_x(PI - 1.50)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, blade_dir, 0.1875 * HEX_R));
    m.add_mesh(g, g_guard(), m_gold)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, blade_dir, 0.030 * HEX_R));

    let (wrist_l, _) = ni_build_arm(&mut m, g, NI_SHLD_X, 0.50, 1.10, m_red, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y + 0.034 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.22);
    m.add_mesh(sh, g_scut_shell(), m_leath);
    m.add_mesh(sh, g_scut_face(), m_owner)
        .set_pos(0.0, 0.0, 0.016 * HEX_R);
    m.add_mesh(sh, g_spina(), m_bronz_l)
        .set_pos(0.0, 0.0, 0.024 * HEX_R);
    m.add_mesh(sh, g_umbo(), m_gold)
        .set_pos(0.0, 0.0, 0.034 * HEX_R);
    m.attach(g, sh);
    m
}

/// `tag(from, ...labels)` (`:552-557`): names the children added by a helper.
fn tag(m: &mut UnitModel, g: NodeId, from: usize, labels: &[&str]) {
    for (i, l) in labels.iter().enumerate() {
        if let Some(&c) = m.nodes[g].children.get(from + i) {
            m.node(c).set_name(&format!("falangita-{l}"));
        }
    }
}

/// `buildFalangita(ownerColor)` (`hastati-falangita.ts:527-694`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_falangita(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_linen = m.mat(NI_LINEN, 0.06, 0.82);
    let m_bronze = m.mat(NI_BRONZE, 0.35, 0.50);
    let m_bronz_l = m.mat(NI_BRONZE_LT, 0.55, 0.35);
    let m_steel = m.mat(NI_STEEL, 0.50, 0.40);
    let m_owner = m.mat(owner, 0.16, 0.62);
    let m_wood = m.mat(NI_WOOD, 0.05, 0.85);
    let m_crest = m.mat(NI_CRIMSON, 0.08, 0.74);
    let m_leath = m.mat(NI_LEATHER, 0.06, 0.82);
    let m_woad = m.mat(NI_WOAD, 0.05, 0.85);
    let m_skin = m.mat(NI_SKIN, 0.05, 0.80);
    let m_dark = m.mat(0x0020_180f, 0.05, 0.90);

    let hip_y = NI_HIP_Y - 0.010 * HEX_R;

    let mut k = m.nodes[g].children.len();
    ni_build_core(&mut m, g, m_linen);
    tag(&mut m, g, k, &["torso", "neck", "head"]);
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, g_yoke(), m_linen)
            .set_pos(sx * 0.056 * HEX_R, NI_TORSO_TOP - 0.006 * HEX_R, 0.0)
            .set_name(if sx < 0.0 {
                "falangita-yoke-right"
            } else {
                "falangita-yoke-left"
            });
    }
    m.add_mesh(g, g_skirt(), m_leath)
        .set_pos(0.0, NI_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("falangita-pteruges");

    k = m.nodes[g].children.len();
    ni_build_leg(
        &mut m, g, NI_HIP_X, 0.55, 0.30, m_woad, m_bronz_l, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        k,
        &["leg-left-thigh", "leg-left-greave", "leg-left-foot"],
    );
    k = m.nodes[g].children.len();
    ni_build_leg(
        &mut m, g, -NI_HIP_X, -0.50, -0.16, m_woad, m_bronz_l, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        k,
        &["leg-right-thigh", "leg-right-greave", "leg-right-foot"],
    );

    m.add_mesh(g, g_cor_dome(), m_bronze)
        .set_pos(0.0, NI_HEAD_CTR + 0.014 * HEX_R, 0.0)
        .set_name("falangita-helmet-dome");
    m.add_mesh(g, g_slit(), m_dark)
        .set_pos(0.0, NI_HEAD_CTR + 0.002 * HEX_R, 0.062 * HEX_R)
        .set_name("falangita-helmet-slit");
    m.add_mesh(g, g_crest_base(), m_bronz_l)
        .set_pos(0.0, NI_HEAD_TOP + 0.026 * HEX_R, -0.004 * HEX_R)
        .set_name("falangita-crest-base");
    m.add_mesh(g, g_crest_hair(), m_crest)
        .rot_x(0.12)
        .set_pos(0.0, NI_HEAD_TOP + 0.076 * HEX_R, -0.008 * HEX_R)
        .set_name("falangita-crest-hair");

    k = m.nodes[g].children.len();
    let (wrist_r, axis_r) = ni_build_arm(
        &mut m,
        g,
        -NI_SHLD_X,
        -2.55,
        1.85,
        m_woad,
        m_skin,
        Some(m_leath),
    );
    tag(
        &mut m,
        g,
        k,
        &["arm-right-upper", "arm-right-fore", "arm-right-fist"],
    );
    let spear_th = PI * 0.5 + 0.20;
    let spear_axis = v3(0.0, -js_sin(0.20), js_cos(0.20));
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_dory_shaft(), m_wood)
        .rot_x(spear_th)
        .set_pos_v(add_scaled(grip, spear_axis, 0.130 * HEX_R))
        .set_name("falangita-dory-shaft");
    m.add_mesh(g, g_dory_tip(), m_steel)
        .rot_x(spear_th)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(
            grip,
            spear_axis,
            (0.130 + 0.370 + 0.028) * HEX_R,
        ))
        .set_name("falangita-dory-tip");
    m.add_mesh(g, g_sauroter(), m_bronze)
        .rot_x(spear_th)
        .set_pos_v(add_scaled(
            grip,
            spear_axis,
            (0.130 - 0.370 - 0.024) * HEX_R,
        ))
        .set_name("falangita-sauroter");

    k = m.nodes[g].children.len();
    let (wrist_l, _) = ni_build_arm(&mut m, g, NI_SHLD_X, 0.52, 1.05, m_woad, m_skin, None);
    tag(&mut m, g, k, &["arm-left-upper", "arm-left-fore"]);
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
        .set_name("falangita-aspis-face");
    m.add_mesh(sh, g_aspis_rim(), m_bronz_l)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, -0.004 * HEX_R)
        .set_name("falangita-aspis-rim");
    m.add_mesh(sh, g_episema(), m_linen)
        .set_pos(0.0, 0.0, 0.022 * HEX_R)
        .set_name("falangita-aspis-episema");
    m.attach(g, sh);
    m
}
