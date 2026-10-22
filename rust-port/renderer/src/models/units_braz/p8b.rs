//! Port of `render/jednostki-p8b-rozni.ts` (`edb8fb56`):
//! `buildStraznikHarappy`, `buildPiechotaInduska`, `buildLegionRzymski`,
//! `buildGwardzistaChampi` (all four exports).
//!
//! The lazily created `getGP8*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, dir_down, oval_face, oval_shell, rot3, seg, v3};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`jednostki-p8b-rozni.ts:74-96`)
const P8_SKIN: u32 = 0xe0ac69;
const P8_SKIN_INDUS: u32 = 0xb8824e;
const P8_SKIN_DARK: u32 = 0xc89058;
const P8_COTTON: u32 = 0xefe9d6;
const P8_ECRU: u32 = 0xe6ddc4;
const P8_REED: u32 = 0xd8c07c;
const P8_REED_MID: u32 = 0xb89a58;
const P8_REED_DARK: u32 = 0xa07f42;
const P8_CARNELIAN: u32 = 0xc05528;
const P8_TEAL: u32 = 0x2a9d8f;
const P8_DARKRED: u32 = 0x7e211c;
const P8_OCHRE: u32 = 0xc8932e;
const P8_RED: u32 = 0xc0392b;
const P8_GOLD: u32 = 0xe0b53a;
const P8_BRONZE: u32 = 0xcf9234;
const P8_BRONZE_LT: u32 = 0xd0a050;
const P8_WOOD: u32 = 0x7a5c3a;
const P8_WOOD_DK: u32 = 0x5f4020;
const P8_LEATHER: u32 = 0x6b4a28;
const P8_STEEL: u32 = 0xc2cad2;
const P8_FEATHER: u32 = 0xf4f0e6;
const P8_EYE: u32 = 0x1a1008;

// ── wymiary sylwetki (`:99-116`)
const P8_HIP_Y: f64 = 0.208 * HEX_R;
const P8_TORSO_W: f64 = 0.180 * HEX_R;
const P8_TORSO_H: f64 = 0.205 * HEX_R;
const P8_TORSO_D: f64 = 0.100 * HEX_R;
const P8_TORSO_BOT: f64 = 0.240 * HEX_R;
const P8_TORSO_CTR: f64 = P8_TORSO_BOT + P8_TORSO_H * 0.5;
const P8_TORSO_TOP: f64 = P8_TORSO_BOT + P8_TORSO_H;
const P8_NECK_H: f64 = 0.028 * HEX_R;
const P8_HEAD_S: f64 = 0.128 * HEX_R;
const P8_HEAD_CTR: f64 = P8_TORSO_TOP + P8_NECK_H + P8_HEAD_S * 0.5;
const P8_HEAD_TOP: f64 = P8_TORSO_TOP + P8_NECK_H + P8_HEAD_S;
const P8_SHLD_X: f64 = P8_TORSO_W * 0.5 + 0.030 * HEX_R;
const P8_SHLD_Y: f64 = P8_TORSO_TOP - 0.024 * HEX_R;
const P8_HIP_X: f64 = 0.052 * HEX_R;
const P8_THIGH_L: f64 = 0.104 * HEX_R;
const P8_SHIN_L: f64 = 0.096 * HEX_R;
const P8_UPARM_L: f64 = 0.100 * HEX_R;
const P8_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:175-224`, `:268-269`)
fn g_torso() -> Geo {
    bx(P8_TORSO_W, P8_TORSO_H, P8_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, P8_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(P8_HEAD_S, P8_HEAD_S, P8_HEAD_S)
}
fn g_eye() -> Geo {
    bx(0.020 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, P8_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, P8_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, P8_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, P8_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_hem_band() -> Geo {
    bx(0.200 * HEX_R, 0.022 * HEX_R, 0.122 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)
}
fn g_strap() -> Geo {
    bx(0.026 * HEX_R, 0.120 * HEX_R, 0.008 * HEX_R)
}
fn g_bead() -> Geo {
    bx(0.024 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)
}
fn g_turban() -> Geo {
    cy(0.072 * HEX_R, 0.086 * HEX_R, 0.056 * HEX_R, 8)
}
fn g_turb_wrap() -> Geo {
    bx(0.150 * HEX_R, 0.026 * HEX_R, 0.150 * HEX_R)
}
fn g_jewel() -> Geo {
    bx(0.026 * HEX_R, 0.034 * HEX_R, 0.012 * HEX_R)
}
fn g_wrap_s() -> Geo {
    cy(0.066 * HEX_R, 0.078 * HEX_R, 0.044 * HEX_R, 8)
}
fn g_knot() -> Geo {
    bx(0.030 * HEX_R, 0.036 * HEX_R, 0.030 * HEX_R)
}
fn g_gate_base() -> Geo {
    bx(0.210 * HEX_R, 0.340 * HEX_R, 0.014 * HEX_R)
}
fn g_gate_h() -> Geo {
    bx(0.222 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R)
}
fn g_gate_v() -> Geo {
    bx(0.034 * HEX_R, 0.352 * HEX_R, 0.026 * HEX_R)
}
fn g_gate_band() -> Geo {
    bx(0.222 * HEX_R, 0.044 * HEX_R, 0.024 * HEX_R)
}
fn g_round_sh() -> Geo {
    cy(0.078 * HEX_R, 0.070 * HEX_R, 0.030 * HEX_R, 8)
}
fn g_round_lat() -> Geo {
    bx(0.030 * HEX_R, 0.150 * HEX_R, 0.012 * HEX_R)
}
fn g_round_boss() -> Geo {
    bx(0.040 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R)
}
fn g_spear() -> Geo {
    bx(0.021 * HEX_R, 0.560 * HEX_R, 0.021 * HEX_R)
}
fn g_spear_tip() -> Geo {
    cn(0.020 * HEX_R, 0.058 * HEX_R, 4)
}
fn g_mont_bowl() -> Geo {
    cy(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8)
}
fn g_mont_knob() -> Geo {
    bx(0.028 * HEX_R, 0.032 * HEX_R, 0.028 * HEX_R)
}
fn g_mont_neck() -> Geo {
    bx(0.150 * HEX_R, 0.020 * HEX_R, 0.052 * HEX_R)
}
fn g_cheek() -> Geo {
    bx(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)
}
fn g_pect_s() -> Geo {
    bx(0.080 * HEX_R, 0.080 * HEX_R, 0.016 * HEX_R)
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
fn g_spina() -> Geo {
    bx(0.020 * HEX_R, 0.300 * HEX_R, 0.014 * HEX_R)
}
fn g_umbo() -> Geo {
    bx(0.052 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)
}
fn g_band() -> Geo {
    bx(0.142 * HEX_R, 0.026 * HEX_R, 0.142 * HEX_R)
}
fn g_feather() -> Geo {
    bx(0.026 * HEX_R, 0.108 * HEX_R, 0.012 * HEX_R)
}
fn g_check_sq() -> Geo {
    bx(0.036 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R)
}
fn g_ear_spool() -> Geo {
    bx(0.016 * HEX_R, 0.034 * HEX_R, 0.034 * HEX_R)
}
fn g_mace_haft() -> Geo {
    bx(0.022 * HEX_R, 0.300 * HEX_R, 0.022 * HEX_R)
}
fn g_mace_ray() -> Geo {
    bx(0.096 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)
}
fn g_axe_blade() -> Geo {
    bx(0.070 * HEX_R, 0.048 * HEX_R, 0.014 * HEX_R)
}
fn g_axe_edge() -> Geo {
    bx(0.014 * HEX_R, 0.056 * HEX_R, 0.010 * HEX_R)
}
fn g_rect_sh() -> Geo {
    bx(0.120 * HEX_R, 0.160 * HEX_R, 0.014 * HEX_R)
}
fn g_sh_trim() -> Geo {
    bx(0.128 * HEX_R, 0.022 * HEX_R, 0.018 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.032 * HEX_R, 0.052 * HEX_R, 0.009 * HEX_R)
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

/// `p8BuildLeg` (`:289-301`).
#[allow(clippy::too_many_arguments)]
fn p8_build_leg(
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
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, P8_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, P8_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
}

/// `p8BuildArm` (`:304-320`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn p8_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, P8_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, P8_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, P8_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `p8Core` (`:323-346`): returns the skin material.
fn p8_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin: u32, eyes: bool) -> MatId {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, P8_TORSO_CTR, 0.0);
    let m_skin = m.mat(skin, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, P8_TORSO_TOP + P8_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, P8_HEAD_CTR, 0.0);
    if eyes {
        let m_eye = m.mat(P8_EYE, 0.02, 0.95);
        for sx in [-1.0, 1.0] {
            m.add_mesh(g, g_eye(), m_eye).set_pos(
                sx * 0.028 * HEX_R,
                P8_HEAD_CTR + 0.008 * HEX_R,
                P8_HEAD_S * 0.5 + 0.004 * HEX_R,
            );
        }
    }
    m_skin
}

/// `buildStraznikHarappy(ownerColor)` (`jednostki-p8b-rozni.ts:358-455`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_straznik_harappy(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_cotton = m.mat(P8_COTTON, 0.04, 0.86);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_reed = m.mat(P8_REED, 0.04, 0.88);
    let m_reed_m = m.mat(P8_REED_MID, 0.04, 0.88);
    let m_reed_d = m.mat(P8_REED_DARK, 0.04, 0.88);
    let m_carn = m.mat(P8_CARNELIAN, 0.20, 0.45);
    let m_teal = m.mat(P8_TEAL, 0.18, 0.50);
    let m_leath = m.mat(P8_LEATHER, 0.06, 0.82);
    let m_wood = m.mat(P8_WOOD, 0.05, 0.85);
    let m_steel = m.mat(P8_STEEL, 0.50, 0.40);

    let hip_y = P8_HIP_Y - 0.008 * HEX_R;

    let m_skin = p8_core(&mut m, g, m_cotton, P8_SKIN_INDUS, true);
    m.add_mesh(g, g_skirt(), m_cotton)
        .set_pos(0.0, P8_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_hem_band(), m_reed_m)
        .set_pos(0.0, P8_TORSO_BOT - 0.050 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);

    for (bi, bx_) in [-0.045_f64, -0.015, 0.015, 0.045].into_iter().enumerate() {
        let mt = if bi % 2 == 0 { m_carn } else { m_teal };
        let arc = if bx_.abs() < 0.03 { -0.008 } else { 0.0 };
        m.add_mesh(g, g_bead(), mt).set_pos(
            bx_ * HEX_R,
            P8_TORSO_TOP - 0.014 * HEX_R + arc * HEX_R,
            P8_TORSO_D * 0.5 + 0.008 * HEX_R,
        );
    }

    p8_build_leg(
        &mut m, g, P8_HIP_X, 0.42, 0.24, m_cotton, m_skin, m_leath, hip_y,
    );
    p8_build_leg(
        &mut m, g, -P8_HIP_X, -0.38, -0.14, m_cotton, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_turban(), m_cotton)
        .set_pos(0.0, P8_HEAD_CTR + 0.038 * HEX_R, 0.0);
    m.add_mesh(g, g_turb_wrap(), m_reed_m)
        .rot_y(PI / 8.0)
        .set_pos(0.0, P8_HEAD_CTR + 0.016 * HEX_R, 0.0);
    m.add_mesh(g, g_jewel(), m_carn)
        .set_pos(0.0, P8_HEAD_CTR + 0.022 * HEX_R, 0.076 * HEX_R);

    let (wrist_r, axis_r) = p8_build_arm(
        &mut m,
        g,
        -P8_SHLD_X,
        0.85,
        1.52,
        m_cotton,
        m_skin,
        Some(m_skin),
    );
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_spear(), m_wood)
        .rot_x(PI - 1.52)
        .set_pos_v(add_scaled(grip, axis_r, 0.120 * HEX_R));
    m.add_mesh(g, g_spear_tip(), m_steel)
        .rot_x(PI - 1.52)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(grip, axis_r, (0.120 + 0.280 + 0.026) * HEX_R));

    let (wrist_l, _) = p8_build_arm(&mut m, g, P8_SHLD_X, 0.50, 1.10, m_cotton, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.030 * HEX_R,
            wrist_l.y + 0.052 * HEX_R,
            wrist_l.z + 0.050 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, g_gate_base(), m_reed);
    for vy in [-0.105, 0.105] {
        m.add_mesh(sh, g_gate_h(), m_reed_m)
            .set_pos(0.0, vy * HEX_R, 0.010 * HEX_R);
    }
    for vx in [-0.056, 0.056] {
        m.add_mesh(sh, g_gate_v(), m_reed_d)
            .set_pos(vx * HEX_R, 0.0, 0.016 * HEX_R);
    }
    m.add_mesh(sh, g_gate_band(), m_owner)
        .set_pos(0.0, 0.0, 0.020 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildPiechotaInduska(ownerColor)` (`jednostki-p8b-rozni.ts:465-561`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_piechota_induska(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin_t = m.mat(P8_SKIN_INDUS, 0.05, 0.80);
    let m_cotton = m.mat(P8_COTTON, 0.04, 0.86);
    let m_ecru = m.mat(P8_ECRU, 0.04, 0.86);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_reed = m.mat(P8_REED, 0.04, 0.88);
    let m_reed_d = m.mat(P8_REED_DARK, 0.04, 0.88);
    let m_carn = m.mat(P8_CARNELIAN, 0.20, 0.45);
    let m_teal = m.mat(P8_TEAL, 0.18, 0.50);
    let m_leath = m.mat(P8_LEATHER, 0.06, 0.82);
    let m_wood = m.mat(P8_WOOD, 0.05, 0.85);
    let m_steel = m.mat(P8_STEEL, 0.50, 0.40);

    let hip_y = P8_HIP_Y - 0.010 * HEX_R;

    let m_skin = p8_core(&mut m, g, m_skin_t, P8_SKIN_INDUS, true);
    {
        let sash = m.add_mesh_id(g, g_strap(), m_cotton);
        m.node(sash).set_scale(1.25, 1.85, 1.0);
        rot3(&mut m, sash, -0.16, 0.0, 0.60);
        m.node(sash).set_pos(
            -0.008 * HEX_R,
            P8_TORSO_CTR + 0.012 * HEX_R,
            P8_TORSO_D * 0.5 + 0.005 * HEX_R,
        );
    }
    m.add_mesh(g, g_skirt(), m_cotton)
        .set_pos(0.0, P8_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);

    for (bi, bx_) in [-0.018_f64, 0.018].into_iter().enumerate() {
        let mt = if bi % 2 == 0 { m_carn } else { m_teal };
        m.add_mesh(g, g_bead(), mt).set_pos(
            bx_ * HEX_R,
            P8_TORSO_TOP - 0.016 * HEX_R,
            P8_TORSO_D * 0.5 + 0.008 * HEX_R,
        );
    }

    p8_build_leg(
        &mut m, g, P8_HIP_X, 0.55, 0.30, m_skin, m_skin, m_leath, hip_y,
    );
    p8_build_leg(
        &mut m, g, -P8_HIP_X, -0.50, -0.16, m_skin, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_wrap_s(), m_ecru)
        .set_pos(0.0, P8_HEAD_CTR + 0.040 * HEX_R, 0.0);
    m.add_mesh(g, g_knot(), m_ecru).set_pos(
        -0.062 * HEX_R,
        P8_HEAD_CTR + 0.030 * HEX_R,
        -0.022 * HEX_R,
    );

    let (wrist_r, axis_r) = p8_build_arm(
        &mut m,
        g,
        -P8_SHLD_X,
        -2.55,
        1.32,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    let spear_th = PI * 0.5 + 0.20;
    let spear_axis = v3(0.0, -js_sin(0.20), js_cos(0.20));
    let grip = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    m.add_mesh(g, g_spear(), m_wood)
        .rot_x(spear_th)
        .set_pos_v(add_scaled(grip, spear_axis, 0.096 * HEX_R));
    m.add_mesh(g, g_spear_tip(), m_steel)
        .rot_x(spear_th)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(
            grip,
            spear_axis,
            (0.096 + 0.280 + 0.026) * HEX_R,
        ));

    let (wrist_l, _) = p8_build_arm(&mut m, g, P8_SHLD_X, 0.52, 1.05, m_skin, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.020 * HEX_R,
            wrist_l.y + 0.030 * HEX_R,
            wrist_l.z + 0.042 * HEX_R,
        )
        .rot_y(-0.20);
    m.add_mesh(sh, g_round_sh(), m_reed).rot_x(PI / 2.0);
    for rz in [0.0, PI / 2.0] {
        m.add_mesh(sh, g_round_lat(), m_reed_d)
            .rot_z(rz)
            .set_pos(0.0, 0.0, 0.014 * HEX_R);
    }
    m.add_mesh(sh, g_round_boss(), m_owner)
        .set_pos(0.0, 0.0, 0.020 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildLegionRzymski(ownerColor)` (`jednostki-p8b-rozni.ts:573-674`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_legion_rzymski(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_bronze = m.mat(P8_BRONZE, 0.42, 0.46);
    let m_bronz_l = m.mat(P8_BRONZE_LT, 0.52, 0.38);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_dk_red = m.mat(P8_DARKRED, 0.05, 0.82);
    let m_leath = m.mat(P8_LEATHER, 0.05, 0.82);
    let m_skin = m.mat(P8_SKIN, 0.05, 0.80);

    let hip_y = P8_HIP_Y - 0.012 * HEX_R;

    p8_core(&mut m, g, m_dk_red, P8_SKIN, false);
    m.add_mesh(g, g_skirt(), m_dk_red)
        .set_pos(0.0, P8_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);

    m.add_mesh(g, g_pect_s(), m_bronze).set_pos(
        0.0,
        0.386 * HEX_R,
        P8_TORSO_D * 0.5 + 0.010 * HEX_R,
    );
    for s in [-1.0, 1.0] {
        let strap = m.add_mesh_id(g, g_strap(), m_leath);
        rot3(&mut m, strap, -0.55, 0.0, s * 0.62);
        m.node(strap)
            .set_pos(s * 0.020 * HEX_R, 0.446 * HEX_R, 0.040 * HEX_R);
    }

    p8_build_leg(
        &mut m, g, P8_HIP_X, 0.58, 0.34, m_dk_red, m_skin, m_leath, hip_y,
    );
    p8_build_leg(
        &mut m, g, -P8_HIP_X, -0.52, -0.20, m_dk_red, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_mont_bowl(), m_bronze)
        .set_pos(0.0, P8_HEAD_CTR + 0.030 * HEX_R, 0.0);
    m.add_mesh(g, g_mont_neck(), m_bronze).rot_x(-0.35).set_pos(
        0.0,
        P8_HEAD_CTR - 0.014 * HEX_R,
        -(P8_HEAD_S * 0.5 + 0.020 * HEX_R),
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_cheek(), m_bronze).set_pos(
            sx * (P8_HEAD_S * 0.5 + 0.004 * HEX_R),
            P8_HEAD_CTR - 0.014 * HEX_R,
            0.018 * HEX_R,
        );
    }
    m.add_mesh(g, g_mont_knob(), m_bronz_l)
        .set_pos(0.0, P8_HEAD_TOP + 0.026 * HEX_R, 0.0);

    let (wrist_r, blade_dir) = p8_build_arm(
        &mut m,
        g,
        -P8_SHLD_X,
        0.95,
        1.50,
        m_dk_red,
        m_skin,
        Some(m_leath),
    );
    m.add_mesh(g, g_blade(), m_bronz_l)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, blade_dir, 0.098 * HEX_R));
    m.add_mesh(g, g_blade_tip(), m_bronz_l)
        .rot_x(PI - 1.50)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, blade_dir, 0.1875 * HEX_R));
    m.add_mesh(g, g_guard(), m_leath)
        .rot_x(PI - 1.50)
        .set_pos_v(add_scaled(wrist_r, blade_dir, 0.030 * HEX_R));

    let (wrist_l, _) = p8_build_arm(&mut m, g, P8_SHLD_X, 0.50, 1.10, m_dk_red, m_skin, None);
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
    m.add_mesh(sh, g_spina(), m_bronze)
        .set_pos(0.0, 0.0, 0.024 * HEX_R);
    m.add_mesh(sh, g_umbo(), m_bronze)
        .set_pos(0.0, 0.0, 0.034 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildGwardzistaChampi(ownerColor)` (`jednostki-p8b-rozni.ts:686-794`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_gwardzista_champi(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_ochre = m.mat(P8_OCHRE, 0.06, 0.80);
    let m_red = m.mat(P8_RED, 0.06, 0.78);
    let m_teal = m.mat(P8_TEAL, 0.06, 0.78);
    let m_gold = m.mat(P8_GOLD, 0.55, 0.35);
    let m_feath = m.mat(P8_FEATHER, 0.03, 0.92);
    let m_owner = m.mat(owner, 0.16, 0.62);
    let m_wood_d = m.mat(P8_WOOD_DK, 0.05, 0.85);
    let m_bronz = m.mat(P8_BRONZE, 0.45, 0.42);
    let m_bron_l = m.mat(P8_BRONZE_LT, 0.55, 0.35);
    let m_leath = m.mat(P8_LEATHER, 0.06, 0.82);

    let hip_y = P8_HIP_Y - 0.008 * HEX_R;

    let m_skin = p8_core(&mut m, g, m_ochre, P8_SKIN_DARK, true);
    m.add_mesh(g, g_skirt(), m_ochre)
        .set_pos(0.0, P8_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_hem_band(), m_red)
        .set_pos(0.0, P8_TORSO_BOT - 0.050 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_teal)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);

    for (ci, dx) in [-0.048, 0.0, 0.048].into_iter().enumerate() {
        let mt = if ci % 2 == 0 { m_red } else { m_teal };
        m.add_mesh(g, g_check_sq(), mt).set_pos(
            dx * HEX_R,
            P8_TORSO_CTR + 0.020 * HEX_R,
            P8_TORSO_D * 0.5 + 0.006 * HEX_R,
        );
    }

    p8_build_leg(
        &mut m, g, P8_HIP_X, 0.50, 0.28, m_ochre, m_skin, m_leath, hip_y,
    );
    p8_build_leg(
        &mut m, g, -P8_HIP_X, -0.45, -0.15, m_ochre, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_band(), m_gold)
        .set_pos(0.0, P8_HEAD_CTR + 0.034 * HEX_R, 0.0);
    for (fi, az) in [-0.26, 0.0, 0.26].into_iter().enumerate() {
        let mt = if fi == 1 { m_feath } else { m_teal };
        m.add_mesh(g, g_feather(), mt).rot_z(az).set_pos(
            js_sin(az) * 0.050 * HEX_R,
            P8_HEAD_TOP + 0.054 * HEX_R,
            -0.010 * HEX_R,
        );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_ear_spool(), m_gold).set_pos(
            sx * (P8_HEAD_S * 0.5 + 0.007 * HEX_R),
            P8_HEAD_CTR - 0.012 * HEX_R,
            0.006 * HEX_R,
        );
    }

    let (wrist_r, axis_r) = p8_build_arm(
        &mut m,
        g,
        -P8_SHLD_X,
        -2.45,
        2.60,
        m_ochre,
        m_skin,
        Some(m_skin),
    );
    let fist = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    let wg = m.detached_group();
    m.node(wg).set_pos_v(fist).rot_x(PI - 2.60);
    m.add_mesh(wg, g_mace_haft(), m_wood_d)
        .set_pos(0.0, 0.100 * HEX_R, 0.0);
    for az in [0.0, PI / 3.0, (2.0 * PI) / 3.0] {
        m.add_mesh(wg, g_mace_ray(), m_bronz)
            .rot_y(az)
            .set_pos(0.0, 0.210 * HEX_R, 0.0);
    }
    m.add_mesh(wg, g_axe_blade(), m_bronz)
        .set_pos(0.078 * HEX_R, 0.210 * HEX_R, 0.0);
    m.add_mesh(wg, g_axe_edge(), m_bron_l)
        .set_pos(0.116 * HEX_R, 0.210 * HEX_R, 0.0);
    m.attach(g, wg);

    let (wrist_l, _) = p8_build_arm(&mut m, g, P8_SHLD_X, 0.50, 1.10, m_ochre, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.020 * HEX_R,
            wrist_l.y + 0.030 * HEX_R,
            wrist_l.z + 0.040 * HEX_R,
        )
        .rot_y(-0.20);
    m.add_mesh(sh, g_rect_sh(), m_owner);
    m.add_mesh(sh, g_sh_trim(), m_gold)
        .set_pos(0.0, 0.082 * HEX_R, 0.004 * HEX_R);
    for (fx, col) in [(-0.032, m_teal), (0.032, m_red)] {
        m.add_mesh(sh, g_fringe(), col)
            .set_pos(fx * HEX_R, -0.108 * HEX_R, 0.002 * HEX_R);
    }
    m.attach(g, sh);
    m
}
