//! Port of `render/kamien-inka-opus5.ts` (`edb8fb56`):
//! `buildMaceWarriorOpus5` (Chaska) and `buildInkaJavelineerOpus5` (Estólica).
//!
//! The lazily created `getKI*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{dir_down, seg};
use crate::geom::Vec3;
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{
    quat_from_unit_vectors, Geo, MatId, NodeId, Prim, UnitModel, ROOT,
};
use std::f64::consts::PI;

const KI_SKIN: u32 = 0xe0ac69;
const KI_SKIN_DARK: u32 = 0xc89058;
const KI_SKIN_SHADE: u32 = 0xb07c46;
const KI_HAIR: u32 = 0x3c2c20;
const KI_COCHINEAL: u32 = 0xa8232c;
const KI_OCHRE: u32 = 0xc8932e;
const KI_CREAM: u32 = 0xe4d8bc;
const KI_BROWN_DK: u32 = 0x5e4632;
const KI_INDIGO: u32 = 0x2e4a6e;
const KI_TEAL: u32 = 0x2a9d8f;
const KI_STONE_HEAD: u32 = 0x77786a;
const KI_STONE_LT: u32 = 0x8f9084;
const KI_OBSIDIAN: u32 = 0x2a2430;
const KI_CHONTA: u32 = 0x3b2a1c;
const KI_WOOD: u32 = 0x7a5c3a;
const KI_WOOD_LT: u32 = 0x94724a;
const KI_LEATHER: u32 = 0x6b4a28;
const KI_LEATHER_DK: u32 = 0x4e351c;
const KI_BONE: u32 = 0xd8cdb4;
const KI_SPONDYLUS: u32 = 0xd85a2e;
const KI_FEATHER: u32 = 0xf4f0e6;
const KI_EYE: u32 = 0x1a1008;

const KI_HIP_Y: f64 = 0.208 * HEX_R;
const KI_TORSO_W: f64 = 0.180 * HEX_R;
const KI_TORSO_H: f64 = 0.205 * HEX_R;
const KI_TORSO_D: f64 = 0.100 * HEX_R;
const KI_TORSO_BOT: f64 = 0.240 * HEX_R;
const KI_TORSO_CTR: f64 = KI_TORSO_BOT + KI_TORSO_H * 0.5;
const KI_TORSO_TOP: f64 = KI_TORSO_BOT + KI_TORSO_H;
const KI_NECK_H: f64 = 0.028 * HEX_R;
const KI_HEAD_S: f64 = 0.128 * HEX_R;
const KI_HEAD_CTR: f64 = KI_TORSO_TOP + KI_NECK_H + KI_HEAD_S * 0.5;
const KI_HEAD_TOP: f64 = KI_TORSO_TOP + KI_NECK_H + KI_HEAD_S;
const KI_SHLD_X: f64 = KI_TORSO_W * 0.5 + 0.030 * HEX_R;
const KI_SHLD_Y: f64 = KI_TORSO_TOP - 0.024 * HEX_R;
const KI_HIP_X: f64 = 0.052 * HEX_R;
const KI_THIGH_L: f64 = 0.104 * HEX_R;
const KI_SHIN_L: f64 = 0.096 * HEX_R;
const KI_UPARM_L: f64 = 0.100 * HEX_R;
const KI_FOREARM_L: f64 = 0.092 * HEX_R;

fn bx(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w, h, d))
}
fn cy(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl(rt, rb, h, seg))
}
fn cn(r: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cone(r, h, seg))
}
fn v3(x: f64, y: f64, z: f64) -> Vec3 {
    Vec3::new(x, y, z)
}

// `getKI*` (`kamien-inka-opus5.ts:235-302`)
fn ki_torso() -> Geo {
    bx(KI_TORSO_W, KI_TORSO_H, KI_TORSO_D)
}
fn ki_chest() -> Geo {
    bx(KI_TORSO_W * 1.04, 0.070 * HEX_R, KI_TORSO_D * 1.06)
}
fn ki_neck() -> Geo {
    bx(0.042 * HEX_R, KI_NECK_H * 1.6, 0.042 * HEX_R)
}
fn ki_head() -> Geo {
    bx(KI_HEAD_S, KI_HEAD_S, KI_HEAD_S)
}
fn ki_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn ki_nose() -> Geo {
    bx(0.021 * HEX_R, 0.030 * HEX_R, 0.018 * HEX_R)
}
fn ki_eye() -> Geo {
    bx(0.020 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R)
}
fn ki_brow() -> Geo {
    bx(0.026 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R)
}
fn ki_hair_back() -> Geo {
    bx(KI_HEAD_S * 1.02, KI_HEAD_S * 0.80, 0.030 * HEX_R)
}
fn ki_hair_frng() -> Geo {
    bx(KI_HEAD_S * 0.90, 0.018 * HEX_R, KI_HEAD_S * 0.88)
}
fn ki_thigh() -> Geo {
    bx(0.056 * HEX_R, KI_THIGH_L, 0.060 * HEX_R)
}
fn ki_shin() -> Geo {
    bx(0.038 * HEX_R, KI_SHIN_L, 0.042 * HEX_R)
}
fn ki_up_arm() -> Geo {
    bx(0.054 * HEX_R, KI_UPARM_L, 0.054 * HEX_R)
}
fn ki_forearm() -> Geo {
    bx(0.040 * HEX_R, KI_FOREARM_L, 0.040 * HEX_R)
}
fn ki_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn ki_sole() -> Geo {
    bx(0.046 * HEX_R, 0.011 * HEX_R, 0.084 * HEX_R)
}
fn ki_toes() -> Geo {
    bx(0.042 * HEX_R, 0.014 * HEX_R, 0.026 * HEX_R)
}
fn ki_strap_f() -> Geo {
    bx(0.048 * HEX_R, 0.009 * HEX_R, 0.016 * HEX_R)
}
fn ki_strap_a() -> Geo {
    bx(0.040 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R)
}
fn ki_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn ki_hem_band() -> Geo {
    bx(0.204 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)
}
fn ki_belt() -> Geo {
    bx(0.190 * HEX_R, 0.030 * HEX_R, 0.112 * HEX_R)
}
fn ki_belt_pat() -> Geo {
    bx(0.022 * HEX_R, 0.022 * HEX_R, 0.010 * HEX_R)
}
fn ki_tocapu() -> Geo {
    bx(0.042 * HEX_R, 0.042 * HEX_R, 0.010 * HEX_R)
}
fn ki_yoke() -> Geo {
    bx(0.096 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)
}
fn ki_stripe() -> Geo {
    bx(0.184 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)
}
fn ki_step_motif() -> Geo {
    bx(0.026 * HEX_R, 0.014 * HEX_R, 0.009 * HEX_R)
}
fn ki_diamond() -> Geo {
    bx(0.030 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R)
}
fn ki_chuspa() -> Geo {
    bx(0.048 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)
}
fn ki_chuspa_fl() -> Geo {
    bx(0.050 * HEX_R, 0.018 * HEX_R, 0.026 * HEX_R)
}
fn ki_fringe() -> Geo {
    bx(0.009 * HEX_R, 0.028 * HEX_R, 0.007 * HEX_R)
}
fn ki_bead() -> Geo {
    bx(0.014 * HEX_R, 0.014 * HEX_R, 0.010 * HEX_R)
}
fn ki_arm_band() -> Geo {
    bx(0.046 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)
}
fn ki_llautu() -> Geo {
    bx(0.140 * HEX_R, 0.026 * HEX_R, 0.140 * HEX_R)
}
fn ki_llautu_p() -> Geo {
    bx(0.030 * HEX_R, 0.012 * HEX_R, 0.010 * HEX_R)
}
fn ki_chuku_bowl() -> Geo {
    cy(0.046 * HEX_R, 0.068 * HEX_R, 0.054 * HEX_R, 8)
}
fn ki_chuku_ring() -> Geo {
    cy(0.070 * HEX_R, 0.072 * HEX_R, 0.011 * HEX_R, 8)
}
fn ki_chuku_neck() -> Geo {
    bx(0.124 * HEX_R, 0.016 * HEX_R, 0.044 * HEX_R)
}
fn ki_chuku_tie() -> Geo {
    bx(0.012 * HEX_R, 0.062 * HEX_R, 0.010 * HEX_R)
}
fn ki_feather() -> Geo {
    bx(0.025 * HEX_R, 0.092 * HEX_R, 0.014 * HEX_R)
}
fn ki_feat_tip() -> Geo {
    bx(0.015 * HEX_R, 0.032 * HEX_R, 0.011 * HEX_R)
}
fn ki_plume() -> Geo {
    bx(0.015 * HEX_R, 0.078 * HEX_R, 0.024 * HEX_R)
}
fn ki_haft() -> Geo {
    cy(0.012 * HEX_R, 0.015 * HEX_R, 0.290 * HEX_R, 6)
}
fn ki_haft_wrap() -> Geo {
    cy(0.017 * HEX_R, 0.017 * HEX_R, 0.022 * HEX_R, 6)
}
fn ki_haft_knob() -> Geo {
    cy(0.019 * HEX_R, 0.014 * HEX_R, 0.018 * HEX_R, 6)
}
fn ki_mace_disc() -> Geo {
    cy(0.036 * HEX_R, 0.036 * HEX_R, 0.030 * HEX_R, 6)
}
fn ki_mace_hub() -> Geo {
    cy(0.021 * HEX_R, 0.021 * HEX_R, 0.052 * HEX_R, 6)
}
fn ki_mace_spike() -> Geo {
    cn(0.019 * HEX_R, 0.048 * HEX_R, 4)
}
fn ki_thong() -> Geo {
    bx(0.008 * HEX_R, 0.044 * HEX_R, 0.008 * HEX_R)
}
fn ki_sh_board() -> Geo {
    bx(0.100 * HEX_R, 0.126 * HEX_R, 0.013 * HEX_R)
}
fn ki_sh_face() -> Geo {
    bx(0.092 * HEX_R, 0.118 * HEX_R, 0.008 * HEX_R)
}
fn ki_sh_rail() -> Geo {
    bx(0.108 * HEX_R, 0.014 * HEX_R, 0.019 * HEX_R)
}
fn ki_sh_edge_v() -> Geo {
    bx(0.012 * HEX_R, 0.126 * HEX_R, 0.018 * HEX_R)
}
fn ki_sh_motif() -> Geo {
    bx(0.028 * HEX_R, 0.028 * HEX_R, 0.008 * HEX_R)
}
fn ki_sh_grip() -> Geo {
    bx(0.050 * HEX_R, 0.013 * HEX_R, 0.013 * HEX_R)
}
fn ki_sh_porpax() -> Geo {
    bx(0.066 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)
}
fn ki_atl_body() -> Geo {
    bx(0.038 * HEX_R, 0.236 * HEX_R, 0.016 * HEX_R)
}
fn ki_atl_rail() -> Geo {
    bx(0.009 * HEX_R, 0.212 * HEX_R, 0.015 * HEX_R)
}
fn ki_atl_hook() -> Geo {
    bx(0.014 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)
}
fn ki_atl_grip() -> Geo {
    bx(0.034 * HEX_R, 0.046 * HEX_R, 0.020 * HEX_R)
}
fn ki_atl_peg() -> Geo {
    cy(0.007 * HEX_R, 0.007 * HEX_R, 0.026 * HEX_R, 6)
}
fn ki_atl_loop() -> Geo {
    bx(0.030 * HEX_R, 0.010 * HEX_R, 0.024 * HEX_R)
}
fn ki_dart_shaft() -> Geo {
    cy(0.0075 * HEX_R, 0.0075 * HEX_R, 0.300 * HEX_R, 6)
}
fn ki_dart_fore() -> Geo {
    cy(0.0090 * HEX_R, 0.0090 * HEX_R, 0.048 * HEX_R, 6)
}
fn ki_dart_tip() -> Geo {
    cn(0.014 * HEX_R, 0.044 * HEX_R, 4)
}
fn ki_dart_lash() -> Geo {
    bx(0.017 * HEX_R, 0.013 * HEX_R, 0.017 * HEX_R)
}
fn ki_fletch() -> Geo {
    bx(0.020 * HEX_R, 0.036 * HEX_R, 0.005 * HEX_R)
}
fn ki_quiver_tie() -> Geo {
    bx(0.024 * HEX_R, 0.014 * HEX_R, 0.048 * HEX_R)
}

/// `kiBuildLeg` (`:326-351`).
#[allow(clippy::too_many_arguments)]
fn ki_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_sole: MatId,
    m_strap: MatId,
    hip_y: f64,
) {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, ki_thigh(), m_thigh, p, th_u, KI_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, ki_shin(), m_shin, p, th_l, KI_SHIN_L);
    let fz = p.z + 0.016 * HEX_R;
    m.add_mesh(g, ki_sole(), m_sole)
        .set_pos(sx, 0.006 * HEX_R, fz);
    m.add_mesh(g, ki_toes(), m_sole)
        .set_pos(sx, 0.008 * HEX_R, fz + 0.042 * HEX_R);
    m.add_mesh(g, ki_strap_f(), m_strap)
        .rot_x(0.22)
        .set_pos(sx, 0.018 * HEX_R, fz + 0.014 * HEX_R);
    m.add_mesh(g, ki_strap_a(), m_strap)
        .set_pos(sx, 0.026 * HEX_R, fz - 0.024 * HEX_R);
}

/// `kiBuildArm` result.
#[derive(Clone, Copy)]
struct Arm {
    wrist: Vec3,
    axis: Vec3,
}

/// `kiBuildArm` (`:354-370`).
#[allow(clippy::too_many_arguments)]
fn ki_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> Arm {
    let mut p = v3(sx, KI_SHLD_Y, 0.0);
    p = seg(m, g, ki_up_arm(), m_up, p, th_u, KI_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, ki_forearm(), m_fore, p, th_f, KI_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, ki_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(wrist.plus(dir_down(th_f).scale(0.014 * HEX_R)));
    }
    Arm {
        wrist,
        axis: dir_down(th_f),
    }
}

/// `kiTorso` (`:373-384`).
fn ki_torso_set(m: &mut UnitModel, g: NodeId, m_tunic: MatId, m_skin: MatId) {
    m.add_mesh(g, ki_torso(), m_tunic)
        .set_pos(0.0, KI_TORSO_CTR, 0.0);
    m.add_mesh(g, ki_chest(), m_tunic)
        .set_pos(0.0, KI_TORSO_TOP - 0.038 * HEX_R, 0.0);
    m.add_mesh(g, ki_neck(), m_skin)
        .set_pos(0.0, KI_TORSO_TOP + KI_NECK_H * 0.5, 0.0);
}

/// `kiHead` (`:390-418`).
fn ki_head_set(
    m: &mut UnitModel,
    g: NodeId,
    m_skin: MatId,
    m_skin_dk: MatId,
    m_hair: MatId,
    m_eye: MatId,
) {
    m.add_mesh(g, ki_head(), m_skin)
        .set_pos(0.0, KI_HEAD_CTR, 0.0);
    m.add_mesh(g, ki_jaw(), m_skin_dk)
        .set_pos(0.0, KI_HEAD_CTR - KI_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, ki_nose(), m_skin).set_pos(
        0.0,
        KI_HEAD_CTR - 0.002 * HEX_R,
        KI_HEAD_S * 0.5 + 0.007 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, ki_eye(), m_eye).set_pos(
            sx * 0.026 * HEX_R,
            KI_HEAD_CTR + 0.014 * HEX_R,
            KI_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
        m.add_mesh(g, ki_brow(), m_hair).set_pos(
            sx * 0.026 * HEX_R,
            KI_HEAD_CTR + 0.026 * HEX_R,
            KI_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
    }
    m.add_mesh(g, ki_hair_back(), m_hair).set_pos(
        0.0,
        KI_HEAD_CTR - 0.006 * HEX_R,
        -(KI_HEAD_S * 0.5 + 0.011 * HEX_R),
    );
    m.add_mesh(g, ki_hair_frng(), m_hair).set_pos(
        0.0,
        KI_HEAD_CTR + KI_HEAD_S * 0.46,
        0.002 * HEX_R,
    );
}

/// `kiSkirtSet` (`:421-434`).
fn ki_skirt_set(m: &mut UnitModel, g: NodeId, m_skirt: MatId, m_border: MatId, m_belt: MatId) {
    m.add_mesh(g, ki_skirt(), m_skirt)
        .set_pos(0.0, KI_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, ki_hem_band(), m_border)
        .set_pos(0.0, KI_TORSO_BOT - 0.050 * HEX_R, 0.0);
    m.add_mesh(g, ki_belt(), m_belt)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
}

/// `kiChuspa` (`:437-454`).
fn ki_chuspa_set(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    m_bag: MatId,
    m_flap: MatId,
    m_fringe: MatId,
) {
    let x = sx * (KI_TORSO_W * 0.5 + 0.020 * HEX_R);
    m.add_mesh(g, ki_chuspa(), m_bag)
        .set_pos(x, KI_TORSO_BOT - 0.044 * HEX_R, 0.024 * HEX_R);
    m.add_mesh(g, ki_chuspa_fl(), m_flap)
        .set_pos(x, KI_TORSO_BOT - 0.012 * HEX_R, 0.024 * HEX_R);
    for dx in [-0.014, 0.014] {
        m.add_mesh(g, ki_fringe(), m_fringe)
            .set_scale(1.0, 0.7, 1.0)
            .set_pos(x + dx * HEX_R, KI_TORSO_BOT - 0.080 * HEX_R, 0.024 * HEX_R);
    }
}

/// `kiSpondylus` (`:457-467`).
fn ki_spondylus(m: &mut UnitModel, g: NodeId, m_shell: MatId) {
    for (i, dx) in [-0.042_f64, -0.021, 0.0, 0.021, 0.042]
        .into_iter()
        .enumerate()
    {
        let dip = if dx == 0.0 {
            0.0
        } else if dx.abs() < 0.03 {
            0.005
        } else {
            0.012
        };
        #[allow(clippy::cast_precision_loss)]
        let fi = i as f64;
        m.add_mesh(g, ki_bead(), m_shell)
            .rot_z((fi - 2.0) * 0.22)
            .set_pos(
                dx * HEX_R,
                KI_TORSO_TOP - 0.016 * HEX_R + dip * HEX_R,
                KI_TORSO_D * 0.5 + 0.012 * HEX_R,
            );
    }
}

/// `kiMacana` (`:476-522`).
#[allow(clippy::too_many_arguments)]
fn ki_macana(
    m: &mut UnitModel,
    g: NodeId,
    fist: Vec3,
    th_f: f64,
    m_wood: MatId,
    m_wrap: MatId,
    m_stone: MatId,
    m_stone_lt: MatId,
) {
    let wg = m.detached_group();
    m.node(wg).set_pos_v(fist).rot_x(PI - th_f);

    m.add_mesh(wg, ki_haft(), m_wood)
        .set_pos(0.0, 0.098 * HEX_R, 0.0);
    for dy in [-0.014, 0.030] {
        m.add_mesh(wg, ki_haft_wrap(), m_wrap)
            .set_pos(0.0, dy * HEX_R, 0.0);
    }
    m.add_mesh(wg, ki_haft_knob(), m_wood)
        .rot_x(PI)
        .set_pos(0.0, -0.050 * HEX_R, 0.0);
    for (dx, rz) in [(-0.010, 0.55), (0.010, -0.55)] {
        m.add_mesh(wg, ki_thong(), m_wrap).rot_z(rz).set_pos(
            dx * HEX_R,
            -0.070 * HEX_R,
            0.008 * HEX_R,
        );
    }
    let head_y = 0.222 * HEX_R;
    m.add_mesh(wg, ki_mace_hub(), m_stone)
        .set_pos(0.0, head_y, 0.0);
    m.add_mesh(wg, ki_mace_disc(), m_stone)
        .set_pos(0.0, head_y, 0.0);
    let yup = v3(0.0, 1.0, 0.0);
    for i in 0..6u32 {
        let az = (f64::from(i) / 6.0) * PI * 2.0;
        let dir = v3(js_cos(az), 0.0, js_sin(az));
        let mtl = if i % 2 == 0 { m_stone } else { m_stone_lt };
        let n = m.add_mesh(wg, ki_mace_spike(), mtl);
        n.quaternion = quat_from_unit_vectors(yup, dir);
        n.set_pos(dir.x * 0.054 * HEX_R, head_y, dir.z * 0.054 * HEX_R);
    }
    m.attach(g, wg);
}

/// `buildMaceWarriorOpus5` (`kamien-inka-opus5.ts:534-702`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_mace_warrior_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KI_SKIN_DARK, 0.05, 0.80);
    let m_skin_dk = m.mat(KI_SKIN_SHADE, 0.05, 0.82);
    let m_hair = m.mat(KI_HAIR, 0.04, 0.88);
    let m_eye = m.mat(KI_EYE, 0.02, 0.95);
    let m_cream = m.mat(KI_CREAM, 0.04, 0.86);
    let m_brown = m.mat(KI_BROWN_DK, 0.04, 0.88);
    let m_red = m.mat(KI_COCHINEAL, 0.05, 0.78);
    let m_ochre = m.mat(KI_OCHRE, 0.05, 0.82);
    let m_teal = m.mat(KI_TEAL, 0.06, 0.78);
    let m_indigo = m.mat(KI_INDIGO, 0.05, 0.80);
    let m_stone = m.mat(KI_STONE_HEAD, 0.06, 0.88);
    let m_stone_lt = m.mat(KI_STONE_LT, 0.06, 0.84);
    let m_chonta = m.mat(KI_CHONTA, 0.05, 0.82);
    let m_wood = m.mat(KI_WOOD, 0.05, 0.86);
    let m_leath = m.mat(KI_LEATHER, 0.05, 0.84);
    let m_leath_dk = m.mat(KI_LEATHER_DK, 0.05, 0.88);
    let m_shell = m.mat(KI_SPONDYLUS, 0.08, 0.66);
    let m_feath = m.mat(KI_FEATHER, 0.03, 0.92);
    let m_owner = m.mat(owner, 0.12, 0.68);

    let hip_y = KI_HIP_Y - 0.010 * HEX_R;

    ki_torso_set(&mut m, g, m_cream, m_skin);
    ki_head_set(&mut m, g, m_skin, m_skin_dk, m_hair, m_eye);

    for (ri, dy) in [0.056, 0.008, -0.040].into_iter().enumerate() {
        for (cj, dx) in [-0.043, 0.043].into_iter().enumerate() {
            let mtl = if (ri + cj) % 2 == 0 { m_brown } else { m_cream };
            m.add_mesh(g, ki_tocapu(), mtl).set_pos(
                dx * HEX_R,
                KI_TORSO_CTR + dy * HEX_R,
                KI_TORSO_D * 0.5 + 0.006 * HEX_R,
            );
        }
    }
    for (ri, dy) in [0.040, -0.012].into_iter().enumerate() {
        for (cj, dx) in [-0.043, 0.043].into_iter().enumerate() {
            let mtl = if (ri + cj) % 2 == 0 { m_cream } else { m_brown };
            m.add_mesh(g, ki_tocapu(), mtl).set_pos(
                dx * HEX_R,
                KI_TORSO_CTR + dy * HEX_R,
                -(KI_TORSO_D * 0.5 + 0.006 * HEX_R),
            );
        }
    }
    m.add_mesh(g, ki_yoke(), m_red).set_pos(
        0.0,
        KI_TORSO_TOP - 0.020 * HEX_R,
        KI_TORSO_D * 0.5 + 0.008 * HEX_R,
    );
    m.add_mesh(g, ki_yoke(), m_red).set_pos(
        0.0,
        KI_TORSO_TOP - 0.020 * HEX_R,
        -(KI_TORSO_D * 0.5 + 0.008 * HEX_R),
    );

    ki_skirt_set(&mut m, g, m_brown, m_red, m_ochre);
    for dx in [-0.048, 0.0, 0.048] {
        m.add_mesh(g, ki_belt_pat(), m_indigo)
            .rot_z(PI / 4.0)
            .set_pos(dx * HEX_R, 0.252 * HEX_R, KI_TORSO_D * 0.5 + 0.014 * HEX_R);
    }
    ki_chuspa_set(&mut m, g, -1.0, m_teal, m_red, m_ochre);
    ki_spondylus(&mut m, g, m_shell);

    ki_build_leg(
        &mut m, g, KI_HIP_X, 0.55, 0.30, m_brown, m_skin, m_leath, m_leath_dk, hip_y,
    );
    ki_build_leg(
        &mut m, g, -KI_HIP_X, -0.50, -0.18, m_brown, m_skin, m_leath, m_leath_dk, hip_y,
    );

    m.add_mesh(g, ki_llautu(), m_red)
        .set_pos(0.0, KI_HEAD_CTR + 0.034 * HEX_R, 0.0);
    for dx in [-0.034, 0.034] {
        m.add_mesh(g, ki_llautu_p(), m_ochre).set_pos(
            dx * HEX_R,
            KI_HEAD_CTR + 0.034 * HEX_R,
            KI_HEAD_S * 0.5 + 0.008 * HEX_R,
        );
    }
    m.add_mesh(g, ki_chuku_bowl(), m_wood)
        .set_pos(0.0, KI_HEAD_TOP + 0.026 * HEX_R, 0.0);
    for dy in [0.000, 0.030] {
        m.add_mesh(g, ki_chuku_ring(), m_leath)
            .set_scale(1.0 - dy * 4.4, 1.0, 1.0 - dy * 4.4)
            .set_pos(0.0, KI_HEAD_TOP + (0.006 + dy) * HEX_R, 0.0);
    }
    m.add_mesh(g, ki_chuku_neck(), m_wood).rot_x(-0.40).set_pos(
        0.0,
        KI_HEAD_TOP - 0.012 * HEX_R,
        -(KI_HEAD_S * 0.5 + 0.026 * HEX_R),
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, ki_chuku_tie(), m_leath_dk)
            .rot_z(sx * 0.10)
            .set_pos(
                sx * (KI_HEAD_S * 0.5 + 0.005 * HEX_R),
                KI_HEAD_CTR - 0.018 * HEX_R,
                0.008 * HEX_R,
            );
    }
    for (fx, rz, col) in [
        (-0.046, 0.28, m_owner),
        (0.0, 0.0, m_feath),
        (0.046, -0.28, m_owner),
    ] {
        m.add_mesh(g, ki_feather(), col).rot_z(rz).set_pos(
            fx * HEX_R + js_sin(rz) * 0.020 * HEX_R,
            KI_HEAD_TOP + 0.092 * HEX_R,
            -0.006 * HEX_R,
        );
        m.add_mesh(g, ki_feat_tip(), col).rot_z(rz).set_pos(
            fx * HEX_R + js_sin(rz) * 0.062 * HEX_R,
            KI_HEAD_TOP + 0.150 * HEX_R,
            -0.006 * HEX_R,
        );
    }

    let thf_r = 2.75;
    let arm_r = ki_build_arm(
        &mut m,
        g,
        -KI_SHLD_X,
        -2.60,
        thf_r,
        m_cream,
        m_skin,
        Some(m_skin_dk),
    );
    let fist_r = arm_r.wrist.plus(arm_r.axis.scale(0.014 * HEX_R));
    ki_macana(
        &mut m, g, fist_r, thf_r, m_chonta, m_leath_dk, m_stone, m_stone_lt,
    );
    m.add_mesh(g, ki_arm_band(), m_ochre).set_pos(
        -KI_SHLD_X,
        KI_SHLD_Y - 0.062 * HEX_R,
        0.008 * HEX_R,
    );

    let arm_l = ki_build_arm(&mut m, g, KI_SHLD_X, 0.50, 1.10, m_cream, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            arm_l.wrist.x - 0.014 * HEX_R,
            arm_l.wrist.y + 0.028 * HEX_R,
            arm_l.wrist.z + 0.036 * HEX_R,
        )
        .rot_y(-0.20);
    m.add_mesh(sh, ki_sh_board(), m_wood);
    m.add_mesh(sh, ki_sh_face(), m_owner)
        .set_pos(0.0, 0.0, 0.010 * HEX_R);
    for dy in [0.064, -0.064] {
        m.add_mesh(sh, ki_sh_rail(), m_leath)
            .set_pos(0.0, dy * HEX_R, 0.002 * HEX_R);
    }
    for dx in [-0.052, 0.052] {
        m.add_mesh(sh, ki_sh_edge_v(), m_wood)
            .set_pos(dx * HEX_R, 0.0, 0.002 * HEX_R);
    }
    for (dy, col) in [(0.030, m_red), (-0.010, m_indigo)] {
        m.add_mesh(sh, ki_sh_motif(), col)
            .rot_z(PI / 4.0)
            .set_pos(0.0, dy * HEX_R, 0.016 * HEX_R);
    }
    for dx in [-0.030_f64, -0.010, 0.010, 0.030] {
        let col = if dx < 0.0 { m_red } else { m_ochre };
        m.add_mesh(sh, ki_fringe(), col)
            .set_pos(dx * HEX_R, -0.082 * HEX_R, 0.004 * HEX_R);
    }
    m.add_mesh(sh, ki_sh_porpax(), m_leath_dk)
        .set_pos(0.0, 0.010 * HEX_R, -0.020 * HEX_R);
    m.add_mesh(sh, ki_sh_grip(), m_wood)
        .set_pos(0.0, -0.022 * HEX_R, -0.026 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildInkaJavelineerOpus5` (`kamien-inka-opus5.ts:715-894`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_inka_javelineer_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KI_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(KI_SKIN_SHADE, 0.05, 0.82);
    let m_hair = m.mat(KI_HAIR, 0.04, 0.88);
    let m_eye = m.mat(KI_EYE, 0.02, 0.95);
    let m_ochre = m.mat(KI_OCHRE, 0.05, 0.86);
    let m_cream = m.mat(KI_CREAM, 0.04, 0.86);
    let m_red = m.mat(KI_COCHINEAL, 0.05, 0.78);
    let m_teal = m.mat(KI_TEAL, 0.06, 0.78);
    let m_indigo = m.mat(KI_INDIGO, 0.05, 0.80);
    let m_wood = m.mat(KI_WOOD, 0.05, 0.86);
    let m_wood_lt = m.mat(KI_WOOD_LT, 0.05, 0.84);
    let m_bone = m.mat(KI_BONE, 0.10, 0.70);
    let m_obsid = m.mat(KI_OBSIDIAN, 0.30, 0.28);
    let m_leath = m.mat(KI_LEATHER, 0.05, 0.84);
    let m_leath_dk = m.mat(KI_LEATHER_DK, 0.05, 0.88);
    let m_shell = m.mat(KI_SPONDYLUS, 0.08, 0.66);
    let m_feath = m.mat(KI_FEATHER, 0.03, 0.92);
    let m_owner = m.mat(owner, 0.10, 0.68);

    let hip_y = KI_HIP_Y - 0.012 * HEX_R;

    ki_torso_set(&mut m, g, m_ochre, m_skin);
    ki_head_set(&mut m, g, m_skin, m_skin_dk, m_hair, m_eye);

    for (dy, col) in [(0.060, m_red), (-0.048, m_indigo)] {
        for zs in [1.0, -1.0] {
            m.add_mesh(g, ki_stripe(), col).set_pos(
                0.0,
                KI_TORSO_CTR + dy * HEX_R,
                zs * (KI_TORSO_D * 0.5 + 0.006 * HEX_R),
            );
        }
    }
    for dx in [-0.048_f64, 0.0, 0.048] {
        let col = if dx == 0.0 { m_red } else { m_teal };
        m.add_mesh(g, ki_diamond(), col).rot_z(PI / 4.0).set_pos(
            dx * HEX_R,
            KI_TORSO_CTR + 0.008 * HEX_R,
            KI_TORSO_D * 0.5 + 0.006 * HEX_R,
        );
    }
    for dx in [-0.032, 0.032] {
        m.add_mesh(g, ki_step_motif(), m_cream).set_pos(
            dx * HEX_R,
            KI_TORSO_CTR - 0.028 * HEX_R,
            KI_TORSO_D * 0.5 + 0.006 * HEX_R,
        );
    }
    ki_skirt_set(&mut m, g, m_ochre, m_owner, m_leath);
    ki_chuspa_set(&mut m, g, 1.0, m_indigo, m_cream, m_red);
    ki_spondylus(&mut m, g, m_shell);

    ki_build_leg(
        &mut m, g, KI_HIP_X, 0.62, 0.36, m_ochre, m_skin, m_leath, m_leath_dk, hip_y,
    );
    ki_build_leg(
        &mut m, g, -KI_HIP_X, -0.55, -0.22, m_ochre, m_skin, m_leath, m_leath_dk, hip_y,
    );

    m.add_mesh(g, ki_llautu(), m_red)
        .set_pos(0.0, KI_HEAD_CTR + 0.034 * HEX_R, 0.0);
    for dx in [-0.034_f64, 0.0, 0.034] {
        let col = if dx == 0.0 { m_cream } else { m_indigo };
        m.add_mesh(g, ki_llautu_p(), col).set_pos(
            dx * HEX_R,
            KI_HEAD_CTR + 0.034 * HEX_R,
            KI_HEAD_S * 0.5 + 0.008 * HEX_R,
        );
    }
    m.add_mesh(g, ki_plume(), m_owner).rot_x(-0.12).set_pos(
        0.0,
        KI_HEAD_TOP + 0.042 * HEX_R,
        -0.006 * HEX_R,
    );
    m.add_mesh(g, ki_feat_tip(), m_feath).rot_x(-0.12).set_pos(
        0.0,
        KI_HEAD_TOP + 0.098 * HEX_R,
        -0.012 * HEX_R,
    );

    // right (-X): estólica (atlatl) in the swing
    let thf_r = 1.95;
    let arm_r = ki_build_arm(
        &mut m,
        g,
        -KI_SHLD_X,
        -2.35,
        thf_r,
        m_ochre,
        m_skin,
        Some(m_skin_dk),
    );
    let fist_r = arm_r.wrist.plus(arm_r.axis.scale(0.014 * HEX_R));
    let wg = m.detached_group();
    m.node(wg).set_pos_v(fist_r).rot_x(PI - thf_r);
    m.add_mesh(wg, ki_atl_body(), m_wood_lt)
        .set_pos(0.0, 0.062 * HEX_R, 0.008 * HEX_R);
    for dx in [-0.014, 0.014] {
        m.add_mesh(wg, ki_atl_rail(), m_wood)
            .set_pos(dx * HEX_R, 0.066 * HEX_R, 0.017 * HEX_R);
    }
    m.add_mesh(wg, ki_atl_hook(), m_bone)
        .set_pos(0.0, 0.170 * HEX_R, 0.020 * HEX_R);
    m.add_mesh(wg, ki_atl_grip(), m_wood_lt)
        .set_pos(0.0, -0.024 * HEX_R, 0.006 * HEX_R);
    for dx in [-0.017, 0.017] {
        m.add_mesh(wg, ki_atl_peg(), m_bone)
            .rot_z(PI / 2.0)
            .set_pos(dx * HEX_R, -0.030 * HEX_R, 0.008 * HEX_R);
    }
    m.add_mesh(wg, ki_atl_loop(), m_leath_dk)
        .set_pos(0.0, -0.052 * HEX_R, 0.006 * HEX_R);
    m.attach(g, wg);

    let dart_a = 1.00;
    let dart_dir = v3(0.0, js_sin(dart_a), js_cos(dart_a));
    let mut tail = fist_r.plus(arm_r.axis.scale(0.168 * HEX_R));
    tail.z += 0.022 * HEX_R;
    let dart_rot = js_atan2(dart_dir.z, dart_dir.y);
    let at = |d: f64| tail.plus(dart_dir.scale(d * HEX_R));

    m.add_mesh(g, ki_dart_shaft(), m_wood)
        .rot_x(dart_rot)
        .set_pos_v(at(0.150));
    m.add_mesh(g, ki_dart_fore(), m_wood_lt)
        .rot_x(dart_rot)
        .set_pos_v(at(0.302));
    m.add_mesh(g, ki_dart_lash(), m_leath_dk)
        .rot_x(dart_rot)
        .set_pos_v(at(0.322));
    m.add_mesh(g, ki_dart_tip(), m_obsid)
        .rot_x(dart_rot)
        .rot_y(PI / 4.0)
        .set_pos_v(at(0.352));
    for (ang, col) in [(0.0, m_feath), (2.09, m_feath), (4.19, m_feath)] {
        m.add_mesh(g, ki_fletch(), col)
            .rot_x(dart_rot)
            .rot_z(ang)
            .set_pos_v(at(0.028));
    }

    // left (+X): 3 spare darts in the hand
    let arm_l = ki_build_arm(
        &mut m,
        g,
        KI_SHLD_X,
        0.30,
        0.85,
        m_ochre,
        m_skin,
        Some(m_skin_dk),
    );
    let fist_l = arm_l.wrist.plus(arm_l.axis.scale(0.014 * HEX_R));
    for (dx, dz) in [(-0.014, -0.004), (0.0, 0.010), (0.014, -0.004)] {
        m.add_mesh(g, ki_dart_shaft(), m_wood).rot_x(-0.12).set_pos(
            fist_l.x + dx * HEX_R,
            fist_l.y + 0.046 * HEX_R,
            fist_l.z + dz * HEX_R,
        );
        m.add_mesh(g, ki_dart_tip(), m_obsid)
            .rot_x(-0.12)
            .rot_y(PI / 4.0)
            .set_pos(
                fist_l.x + dx * HEX_R,
                fist_l.y + 0.217 * HEX_R,
                fist_l.z + (dz - 0.021) * HEX_R,
            );
        m.add_mesh(g, ki_fletch(), m_feath).rot_x(-0.12).set_pos(
            fist_l.x + dx * HEX_R,
            fist_l.y - 0.093 * HEX_R,
            fist_l.z + (dz + 0.017) * HEX_R,
        );
    }
    m.add_mesh(g, ki_arm_band(), m_indigo).set_pos(
        KI_SHLD_X + 0.006 * HEX_R,
        KI_SHLD_Y - 0.118 * HEX_R,
        0.052 * HEX_R,
    );

    m.add_mesh(g, ki_quiver_tie(), m_leath).rot_x(0.30).set_pos(
        -0.034 * HEX_R,
        0.360 * HEX_R,
        -(KI_TORSO_D * 0.5 + 0.018 * HEX_R),
    );
    for dx in [-0.046, -0.024] {
        m.add_mesh(g, ki_dart_shaft(), m_wood_lt)
            .rot_x(0.30)
            .set_scale(1.0, 0.86, 1.0)
            .set_pos(
                dx * HEX_R,
                0.372 * HEX_R,
                -(KI_TORSO_D * 0.5 + 0.030 * HEX_R),
            );
    }
    m
}
