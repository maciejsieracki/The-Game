//! Port of `render/braz-procarz-opus5.ts` (`edb8fb56`):
//! `buildProcarzBrazOpus5` (Procarz / Slinger, Bronze).
//!
//! The lazily created `getPZ*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cy, dir_down, js_sign, octa, rot3, seg, stretch, v3, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::js_atan2;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`braz-procarz-opus5.ts:130-158`)
const PZ_SKIN: u32 = 0xe0ac69;
const PZ_SKIN_DK: u32 = 0xc89058;
const PZ_HIDE: u32 = 0xa89468;
const PZ_HIDE_DK: u32 = 0x7c6a46;
const PZ_FRINGE: u32 = 0x6b5a3c;
const PZ_LEATHER: u32 = 0x6b4a28;
const PZ_LEATHER_DK: u32 = 0x4a331b;
const PZ_HAIR: u32 = 0x40311e;
const PZ_CLAY: u32 = 0xb5643c;
const PZ_CLAY_LT: u32 = 0xc47a4e;
const PZ_BONE: u32 = 0xd8cdb4;
const PZ_WOOD: u32 = 0x6a4e30;
const PZ_GOURD: u32 = 0x8a7a42;
const PZ_GOURD_DK: u32 = 0x655a30;
const PZ_EYE: u32 = 0x14100c;
const PZ_CORD: u32 = 0x8c7a52;

// ── wymiary sylwetki (`:161-180`)
const PZ_HIP_Y: f64 = 0.208 * HEX_R;
const PZ_TORSO_W: f64 = 0.180 * HEX_R;
const PZ_TORSO_H: f64 = 0.205 * HEX_R;
const PZ_TORSO_D: f64 = 0.100 * HEX_R;
const PZ_TORSO_BOT: f64 = 0.240 * HEX_R;
const PZ_TORSO_CTR: f64 = PZ_TORSO_BOT + PZ_TORSO_H * 0.5;
const PZ_TORSO_TOP: f64 = PZ_TORSO_BOT + PZ_TORSO_H;
const PZ_NECK_H: f64 = 0.028 * HEX_R;
const PZ_HEAD_S: f64 = 0.128 * HEX_R;
const PZ_HEAD_CTR: f64 = PZ_TORSO_TOP + PZ_NECK_H + PZ_HEAD_S * 0.5;
const PZ_HEAD_TOP: f64 = PZ_TORSO_TOP + PZ_NECK_H + PZ_HEAD_S;
const PZ_SHLD_X: f64 = PZ_TORSO_W * 0.5 + 0.030 * HEX_R;
const PZ_SHLD_Y: f64 = PZ_TORSO_TOP - 0.024 * HEX_R;
const PZ_HIP_X: f64 = 0.052 * HEX_R;
const PZ_THIGH_L: f64 = 0.104 * HEX_R;
const PZ_SHIN_L: f64 = 0.096 * HEX_R;
const PZ_UPARM_L: f64 = 0.100 * HEX_R;
const PZ_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:227-262`)
fn g_torso() -> Geo {
    bx(PZ_TORSO_W, PZ_TORSO_H, PZ_TORSO_D)
}
fn g_chest() -> Geo {
    bx(PZ_TORSO_W * 1.02, 0.066 * HEX_R, PZ_TORSO_D * 1.04)
}
fn g_collar() -> Geo {
    bx(0.070 * HEX_R, 0.020 * HEX_R, PZ_TORSO_D * 0.9)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, PZ_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(PZ_HEAD_S, PZ_HEAD_S, PZ_HEAD_S)
}
fn g_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn g_nose() -> Geo {
    bx(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)
}
fn g_ear() -> Geo {
    bx(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn g_brow() -> Geo {
    bx(0.024 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R)
}
fn g_tuft() -> Geo {
    octa(0.030 * HEX_R, 0)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, PZ_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, PZ_SHIN_L, 0.042 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R)
}
fn g_toes() -> Geo {
    bx(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, PZ_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, PZ_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_wrap() -> Geo {
    bx(0.198 * HEX_R, 0.082 * HEX_R, 0.122 * HEX_R)
}
fn g_hem() -> Geo {
    bx(0.206 * HEX_R, 0.020 * HEX_R, 0.128 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.015 * HEX_R, 0.052 * HEX_R, 0.009 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.192 * HEX_R, 0.018 * HEX_R, 0.116 * HEX_R)
}
fn g_knot() -> Geo {
    bx(0.032 * HEX_R, 0.028 * HEX_R, 0.017 * HEX_R)
}
fn g_bag() -> Geo {
    bx(0.068 * HEX_R, 0.078 * HEX_R, 0.040 * HEX_R)
}
fn g_bag_flap() -> Geo {
    bx(0.072 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R)
}
fn g_toggle() -> Geo {
    cy(0.007 * HEX_R, 0.007 * HEX_R, 0.024 * HEX_R, 6)
}
fn g_pellet() -> Geo {
    octa(0.019 * HEX_R, 0)
}
fn g_gourd() -> Geo {
    bx(0.056 * HEX_R, 0.072 * HEX_R, 0.048 * HEX_R)
}
fn g_gourd_nk() -> Geo {
    bx(0.026 * HEX_R, 0.024 * HEX_R, 0.026 * HEX_R)
}
fn g_whistle() -> Geo {
    cy(0.009 * HEX_R, 0.009 * HEX_R, 0.052 * HEX_R, 6)
}
fn g_loop() -> Geo {
    bx(0.020 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R)
}
fn g_pouch() -> Geo {
    bx(0.040 * HEX_R, 0.024 * HEX_R, 0.052 * HEX_R)
}
fn g_scapula() -> Geo {
    bx(0.060 * HEX_R, 0.070 * HEX_R, 0.020 * HEX_R)
}
fn g_ankle_wrap() -> Geo {
    bx(0.042 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)
}
fn g_heel() -> Geo {
    bx(0.030 * HEX_R, 0.016 * HEX_R, 0.024 * HEX_R)
}

/// `pzStretch(parent, mtl, A, B, w, d)` (`:288-302`).
#[allow(clippy::too_many_arguments)]
fn pz_stretch(m: &mut UnitModel, g: NodeId, mtl: MatId, a: Vec3, b: Vec3, w: f64, d: Option<f64>) {
    stretch(m, g, g_unit(), mtl, a, b, w, d);
}

/// `pzBuildLeg` (`:305-331`).
#[allow(clippy::too_many_arguments)]
fn pz_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_skin: MatId,
    m_skin_dk: MatId,
    hip_y: f64,
) -> Vec3 {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_skin, p, th_u, PZ_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    let ankle = seg(m, g, g_shin(), m_skin, p, th_l, PZ_SHIN_L);
    m.add_mesh(g, g_ankle_wrap(), m_skin_dk).set_pos(
        sx,
        ankle.y + 0.006 * HEX_R,
        ankle.z - 0.002 * HEX_R,
    );
    let p = ankle;
    let foot_z = p.z + 0.012 * HEX_R;
    m.add_mesh(g, g_sole(), m_skin_dk)
        .set_pos(sx, 0.009 * HEX_R, foot_z);
    m.add_mesh(g, g_heel(), m_skin_dk)
        .set_pos(sx, 0.009 * HEX_R, foot_z - 0.024 * HEX_R);
    m.add_mesh(g, g_toes(), m_skin_dk)
        .set_pos(sx, 0.007 * HEX_R, foot_z + 0.038 * HEX_R);
    let sgn = js_sign(if sx == 0.0 || sx.is_nan() { 1.0 } else { sx });
    m.add_mesh(g, g_toes(), m_skin_dk)
        .set_scale(0.42, 1.05, 1.1)
        .set_pos(
            sx - sgn * 0.017 * HEX_R,
            0.008 * HEX_R,
            foot_z + 0.040 * HEX_R,
        );
    p
}

/// Result of `pzBuildArm`.
struct Arm {
    wrist: Vec3,
    axis: Vec3,
}

/// `pzBuildArm` (`:334-350`).
#[allow(clippy::too_many_arguments)]
fn pz_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> Arm {
    let mut p = v3(sx, PZ_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, PZ_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, PZ_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    Arm {
        wrist,
        axis: dir_down(th_f),
    }
}

/// `pzBuildCore` (`:353-395`).
fn pz_build_core(
    m: &mut UnitModel,
    g: NodeId,
    m_skin: MatId,
    m_skin_dk: MatId,
    m_eye: MatId,
    m_hair: MatId,
) {
    m.add_mesh(g, g_torso(), m_skin)
        .set_pos(0.0, PZ_TORSO_CTR, 0.0);
    m.add_mesh(g, g_chest(), m_skin)
        .set_pos(0.0, PZ_TORSO_TOP - 0.036 * HEX_R, 0.0);
    m.add_mesh(g, g_collar(), m_skin_dk)
        .set_pos(0.0, PZ_TORSO_TOP - 0.006 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_scapula(), m_skin_dk).set_pos(
            sx * 0.042 * HEX_R,
            PZ_TORSO_TOP - 0.052 * HEX_R,
            -(PZ_TORSO_D * 0.5 + 0.006 * HEX_R),
        );
    }
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, PZ_TORSO_TOP + PZ_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, PZ_HEAD_CTR, 0.0);
    m.add_mesh(g, g_jaw(), m_skin_dk)
        .set_pos(0.0, PZ_HEAD_CTR - PZ_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, g_nose(), m_skin).set_pos(
        0.0,
        PZ_HEAD_CTR - 0.004 * HEX_R,
        PZ_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_ear(), m_skin_dk).set_pos(
            sx * (PZ_HEAD_S * 0.5 + 0.004 * HEX_R),
            PZ_HEAD_CTR - 0.006 * HEX_R,
            0.0,
        );
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            sx * 0.026 * HEX_R,
            PZ_HEAD_CTR + 0.014 * HEX_R,
            PZ_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
        m.add_mesh(g, g_brow(), m_hair).set_pos(
            sx * 0.026 * HEX_R,
            PZ_HEAD_CTR + 0.026 * HEX_R,
            PZ_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
    }
}

/// `pzHair` (`:400-451`).
fn pz_hair(m: &mut UnitModel, g: NodeId, m_hair: MatId, m_cord: MatId) {
    const TUFTS: [[f64; 6]; 8] = [
        [-0.032, -0.006, 0.000, 0.48, -0.30, 0.35],
        [-0.010, -0.026, 0.006, 0.55, 0.10, -0.28],
        [0.014, -0.016, -0.004, 0.50, 0.26, 0.30],
        [0.032, 0.004, 0.002, 0.44, -0.18, -0.32],
        [-0.020, 0.022, -0.006, 0.42, -0.08, 0.34],
        [0.006, 0.026, 0.004, 0.46, 0.20, -0.26],
        [0.000, -0.002, 0.008, 0.52, 0.05, 0.40],
        [-0.014, 0.008, 0.002, 0.40, 0.34, -0.20],
    ];
    for [dx, dz, dy, sy, rz, rx] in TUFTS {
        let id = m.add_mesh_id(g, g_tuft(), m_hair);
        rot3(m, id, rx, 0.0, rz);
        m.node(id).set_scale(0.95, sy, 0.95).set_pos(
            dx * HEX_R,
            PZ_HEAD_TOP - 0.020 * HEX_R + dy * HEX_R,
            dz * HEX_R,
        );
    }
    for [dx, dy, rz] in [
        [-0.028, 0.006, 0.16],
        [0.024, 0.002, -0.20],
        [-0.002, -0.014, 0.05],
    ] {
        let id = m.add_mesh_id(g, g_tuft(), m_hair);
        rot3(m, id, 0.32, rz, rz * 0.5);
        m.node(id).set_scale(0.80, 0.50, 0.65).set_pos(
            dx * HEX_R,
            PZ_HEAD_CTR + dy * HEX_R,
            -(PZ_HEAD_S * 0.5 + 0.004 * HEX_R),
        );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_tuft(), m_hair)
            .rot_x(sx * 0.3)
            .set_scale(0.55, 0.42, 0.55)
            .set_pos(
                sx * (PZ_HEAD_S * 0.5 - 0.006 * HEX_R),
                PZ_HEAD_CTR + 0.032 * HEX_R,
                -0.014 * HEX_R,
            );
    }
    let tie_l = v3(
        -0.030 * HEX_R,
        PZ_HEAD_CTR + 0.014 * HEX_R,
        -(PZ_HEAD_S * 0.5 + 0.006 * HEX_R),
    );
    let tie_r = v3(
        0.030 * HEX_R,
        PZ_HEAD_CTR + 0.014 * HEX_R,
        -(PZ_HEAD_S * 0.5 + 0.006 * HEX_R),
    );
    let tie_back = v3(
        0.0,
        PZ_HEAD_CTR + 0.006 * HEX_R,
        -(PZ_HEAD_S * 0.5 + 0.020 * HEX_R),
    );
    pz_stretch(m, g, m_cord, tie_l, tie_back, 0.007 * HEX_R, None);
    pz_stretch(m, g, m_cord, tie_r, tie_back, 0.007 * HEX_R, None);
}

/// `((dx * k) % 1 + 1) % 1` — JS `%` is the truncated remainder, as Rust's.
fn frac01(x: f64) -> f64 {
    (x % 1.0 + 1.0) % 1.0
}

/// `pzSkirtSet` (`:454-498`).
fn pz_skirt_set(
    m: &mut UnitModel,
    g: NodeId,
    m_hide: MatId,
    m_hide_dk: MatId,
    m_fringe: MatId,
    m_owner: MatId,
) {
    m.add_mesh(g, g_wrap(), m_hide)
        .set_pos(0.0, PZ_TORSO_BOT - 0.026 * HEX_R, 0.0);
    m.add_mesh(g, g_hem(), m_hide_dk)
        .set_pos(0.0, PZ_TORSO_BOT - 0.062 * HEX_R, 0.0);
    for dx in [-0.084, -0.052, -0.020, 0.012, 0.044, 0.076] {
        m.add_mesh(g, g_fringe(), m_fringe)
            .set_scale_scalar(0.82 + frac01(dx * 37.0) * 0.32)
            .set_pos(
                dx * HEX_R,
                PZ_TORSO_BOT - 0.086 * HEX_R,
                PZ_TORSO_D * 0.5 + 0.008 * HEX_R,
            );
    }
    for dx in [-0.068, -0.036, -0.004, 0.028, 0.060] {
        m.add_mesh(g, g_fringe(), m_fringe)
            .set_scale_scalar(0.70 + frac01(dx * 53.0) * 0.28)
            .set_pos(
                dx * HEX_R,
                PZ_TORSO_BOT - 0.084 * HEX_R,
                -(PZ_TORSO_D * 0.5 + 0.006 * HEX_R),
            );
    }
    for dx in [-0.098, 0.096] {
        m.add_mesh(g, g_fringe(), m_fringe)
            .set_scale_scalar(0.76 + frac01(dx * 61.0) * 0.30)
            .rot_y(PI / 2.0)
            .set_pos(dx * HEX_R, PZ_TORSO_BOT - 0.080 * HEX_R, 0.0);
    }
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, PZ_TORSO_BOT + 0.010 * HEX_R, 0.0);
    m.add_mesh(g, g_knot(), m_owner).set_pos(
        0.028 * HEX_R,
        PZ_TORSO_BOT + 0.006 * HEX_R,
        PZ_TORSO_D * 0.5 + 0.010 * HEX_R,
    );
    m.add_mesh(g, g_fringe(), m_owner)
        .rot_x(0.18)
        .set_scale(0.7, 1.3, 0.7)
        .set_pos(
            0.028 * HEX_R,
            PZ_TORSO_BOT - 0.030 * HEX_R,
            PZ_TORSO_D * 0.5 + 0.016 * HEX_R,
        );
}

/// `pzBag` (`:503-547`).
#[allow(clippy::too_many_arguments)]
fn pz_bag(
    m: &mut UnitModel,
    g: NodeId,
    m_leath: MatId,
    m_leath_dk: MatId,
    m_owner: MatId,
    m_bone: MatId,
    m_clay: MatId,
    m_clay_lt: MatId,
) {
    let bxx = PZ_TORSO_W * 0.5 + 0.024 * HEX_R;
    let byy = PZ_TORSO_BOT + 0.030 * HEX_R;
    let bzz = 0.022 * HEX_R;
    m.add_mesh(g, g_bag(), m_leath)
        .rot_z(-0.10)
        .set_pos(bxx, byy, bzz);
    m.add_mesh(g, g_bag_flap(), m_owner).rot_z(-0.10).set_pos(
        bxx,
        byy + 0.042 * HEX_R,
        bzz + 0.006 * HEX_R,
    );
    m.add_mesh(g, g_toggle(), m_bone)
        .rot_z(PI / 2.0 + 0.2)
        .set_pos(
            bxx + 0.010 * HEX_R,
            byy + 0.020 * HEX_R,
            bzz + 0.022 * HEX_R,
        );
    let strap_top = v3(
        -PZ_SHLD_X * 0.62,
        PZ_TORSO_TOP - 0.008 * HEX_R,
        PZ_TORSO_D * 0.5 + 0.002 * HEX_R,
    );
    let strap_bot = v3(
        bxx - 0.012 * HEX_R,
        byy + 0.052 * HEX_R,
        bzz + 0.006 * HEX_R,
    );
    pz_stretch(
        m,
        g,
        m_leath_dk,
        strap_top,
        strap_bot,
        0.020 * HEX_R,
        Some(0.010 * HEX_R),
    );
    m.add_mesh(g, g_fringe(), m_leath)
        .rot_x(0.3)
        .set_scale(1.0, 0.6, 1.0)
        .set_pos(
            bxx - 0.006 * HEX_R,
            byy + 0.046 * HEX_R,
            bzz + 0.012 * HEX_R,
        );
    for [dx, dy] in [
        [-0.010, 0.010],
        [0.008, 0.016],
        [0.000, 0.000],
        [-0.020, -0.004],
        [0.018, -0.006],
    ] {
        #[allow(clippy::float_cmp)]
        let mt = if dy == 0.000 { m_clay_lt } else { m_clay };
        let id = m.add_mesh_id(g, g_pellet(), mt);
        m.node(id).set_scale(1.0, 0.62, 1.0);
        rot3(m, id, 0.3, 0.6, 0.2);
        m.node(id).set_pos(
            bxx + dx * HEX_R,
            byy + (0.026 + dy) * HEX_R,
            bzz + 0.020 * HEX_R,
        );
    }
    let id = m.add_mesh_id(g, g_pellet(), m_clay);
    m.node(id).set_scale(1.0, 0.62, 1.0);
    rot3(m, id, 0.5, 0.2, 0.4);
    m.node(id).set_pos(
        bxx - 0.018 * HEX_R,
        byy + 0.040 * HEX_R,
        bzz + 0.014 * HEX_R,
    );
}

/// `pzGourd` (`:551-572`).
fn pz_gourd(m: &mut UnitModel, g: NodeId, m_gourd: MatId, m_gourd_dk: MatId, m_cord: MatId) {
    let gx = -(PZ_TORSO_W * 0.5 + 0.022 * HEX_R);
    let gy = PZ_TORSO_BOT + 0.014 * HEX_R;
    let gz = 0.012 * HEX_R;
    m.add_mesh(g, g_gourd(), m_gourd)
        .rot_z(0.14)
        .set_pos(gx, gy, gz);
    m.add_mesh(g, g_gourd_nk(), m_gourd_dk).rot_z(0.14).set_pos(
        gx - 0.006 * HEX_R,
        gy + 0.046 * HEX_R,
        gz,
    );
    let cord_top = v3(
        PZ_SHLD_X * -0.5,
        PZ_TORSO_TOP - 0.006 * HEX_R,
        -(PZ_TORSO_D * 0.5 + 0.004 * HEX_R),
    );
    let cord_bot = v3(gx + 0.004 * HEX_R, gy + 0.044 * HEX_R, gz - 0.004 * HEX_R);
    pz_stretch(m, g, m_cord, cord_top, cord_bot, 0.010 * HEX_R, None);
    m.add_mesh(g, g_loop(), m_gourd_dk)
        .set_scale(0.7, 0.5, 0.7)
        .set_pos(gx - 0.002 * HEX_R, gy + 0.058 * HEX_R, gz - 0.002 * HEX_R);
}

/// `pzWhistle` (`:576-589`).
fn pz_whistle(m: &mut UnitModel, g: NodeId, m_wood: MatId, m_cord: MatId) {
    let w_y = PZ_TORSO_TOP + 0.010 * HEX_R;
    let cord_l = v3(
        -0.030 * HEX_R,
        PZ_TORSO_TOP + 0.018 * HEX_R,
        PZ_TORSO_D * 0.5 + 0.006 * HEX_R,
    );
    let cord_r = v3(
        0.030 * HEX_R,
        PZ_TORSO_TOP + 0.018 * HEX_R,
        PZ_TORSO_D * 0.5 + 0.006 * HEX_R,
    );
    let tip = v3(0.0, w_y - 0.030 * HEX_R, PZ_TORSO_D * 0.5 + 0.026 * HEX_R);
    pz_stretch(m, g, m_cord, cord_l, tip, 0.007 * HEX_R, None);
    pz_stretch(m, g, m_cord, cord_r, tip, 0.007 * HEX_R, None);
    m.add_mesh(g, g_whistle(), m_wood)
        .rot_z(PI / 2.0)
        .set_pos_v(tip);
}

/// `pzSling` (`:617-670`).
fn pz_sling(
    m: &mut UnitModel,
    g: NodeId,
    wrist: Vec3,
    axis: Vec3,
    m_cord: MatId,
    m_leath_dk: MatId,
    m_clay: MatId,
) {
    let fist = add_scaled(wrist, axis, 0.014 * HEX_R);
    m.add_mesh(g, g_loop(), m_leath_dk)
        .quat_from_unit_vectors(Y_UP, axis)
        .set_pos_v(add_scaled(wrist, axis, -0.006 * HEX_R));
    m.add_mesh(g, g_loop(), m_leath_dk)
        .quat_from_unit_vectors(Y_UP, axis)
        .set_scale(0.9, 0.6, 0.9)
        .set_pos_v(add_scaled(wrist, axis, 0.006 * HEX_R));

    let d = v3(0.50, 0.80, 0.33).normalize();
    let p = v3(d.y, -d.x, 0.0).normalize();
    let loop_len = 0.220 * HEX_R;
    let half_w = 0.078 * HEX_R;
    let cord_w = 0.020 * HEX_R;
    let apex = add_scaled(fist, d, loop_len);
    let mid = add_scaled(fist, d, loop_len * 0.52);
    let mid_l = add_scaled(mid, p, half_w);
    let mid_r = add_scaled(mid, p, -half_w);
    pz_stretch(m, g, m_cord, fist, mid_l, cord_w, None);
    pz_stretch(m, g, m_cord, mid_l, apex, cord_w, None);
    pz_stretch(m, g, m_cord, fist, mid_r, cord_w, None);
    pz_stretch(m, g, m_cord, mid_r, apex, cord_w, None);

    let id = m.add_mesh_id(g, g_pouch(), m_leath_dk);
    m.node(id).set_scale(1.25, 1.15, 1.2);
    let yaw = js_atan2(d.x, d.z);
    rot3(m, id, -0.50, yaw, 0.0);
    m.node(id).set_pos_v(apex);
    let id = m.add_mesh_id(g, g_pellet(), m_clay);
    m.node(id).set_scale(1.3, 0.80, 1.3);
    rot3(m, id, -0.50, yaw, 0.3);
    m.node(id)
        .set_pos_v(apex.plus(v3(0.0, 0.008 * HEX_R, -0.010 * HEX_R)));
}

/// `pzHandPellets` (`:673-687`).
fn pz_hand_pellets(
    m: &mut UnitModel,
    g: NodeId,
    wrist: Vec3,
    axis: Vec3,
    m_clay: MatId,
    m_clay_lt: MatId,
) {
    let palm = add_scaled(wrist, axis, 0.020 * HEX_R);
    for (dx, dy, dz, lt) in [
        (-0.014, 0.006, 0.004, false),
        (0.012, 0.004, -0.006, false),
        (0.000, 0.014, -0.002, true),
        (-0.006, 0.018, 0.008, false),
        (0.016, 0.016, 0.002, true),
        (0.004, 0.024, -0.004, false),
    ] {
        let id = m.add_mesh_id(g, g_pellet(), if lt { m_clay_lt } else { m_clay });
        m.node(id).set_scale(1.0, 0.62, 1.0);
        rot3(m, id, dx * 9.0, dy * 7.0, dz * 5.0);
        m.node(id).set_pos(
            palm.x + dx * HEX_R,
            palm.y + dy * HEX_R,
            palm.z + dz * HEX_R,
        );
    }
}

/// `buildProcarzBrazOpus5(ownerColor)` (`braz-procarz-opus5.ts:698-745`).
#[must_use]
pub fn build_procarz_braz_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(PZ_SKIN, 0.04, 0.82);
    let m_skin_dk = m.mat(PZ_SKIN_DK, 0.04, 0.85);
    let m_hide = m.mat(PZ_HIDE, 0.06, 0.90);
    let m_hide_dk = m.mat(PZ_HIDE_DK, 0.06, 0.92);
    let m_fringe = m.mat(PZ_FRINGE, 0.06, 0.92);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_leath = m.mat(PZ_LEATHER, 0.05, 0.86);
    let m_leath_dk = m.mat(PZ_LEATHER_DK, 0.05, 0.88);
    let m_hair = m.mat(PZ_HAIR, 0.04, 0.90);
    let m_clay = m.mat(PZ_CLAY, 0.05, 0.68);
    let m_clay_lt = m.mat(PZ_CLAY_LT, 0.05, 0.64);
    let m_bone = m.mat(PZ_BONE, 0.04, 0.72);
    let m_wood = m.mat(PZ_WOOD, 0.05, 0.86);
    let m_gourd = m.mat(PZ_GOURD, 0.05, 0.88);
    let m_gourd_dk = m.mat(PZ_GOURD_DK, 0.05, 0.90);
    let m_eye = m.mat(PZ_EYE, 0.05, 0.86);
    let m_cord = m.mat(PZ_CORD, 0.04, 0.88);

    let hip_y = PZ_HIP_Y - 0.010 * HEX_R;

    pz_build_core(&mut m, g, m_skin, m_skin_dk, m_eye, m_hair);
    pz_hair(&mut m, g, m_hair, m_cord);

    pz_build_leg(&mut m, g, PZ_HIP_X, 0.46, 0.22, m_skin, m_skin_dk, hip_y);
    pz_build_leg(&mut m, g, -PZ_HIP_X, -0.42, -0.16, m_skin, m_skin_dk, hip_y);

    pz_skirt_set(&mut m, g, m_hide, m_hide_dk, m_fringe, m_owner);

    pz_bag(
        &mut m, g, m_leath, m_leath_dk, m_owner, m_bone, m_clay, m_clay_lt,
    );
    pz_gourd(&mut m, g, m_gourd, m_gourd_dk, m_cord);
    pz_whistle(&mut m, g, m_wood, m_cord);

    let arm_r = pz_build_arm(
        &mut m,
        g,
        -PZ_SHLD_X,
        -2.72,
        -3.02,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    pz_sling(
        &mut m,
        g,
        arm_r.wrist,
        arm_r.axis,
        m_cord,
        m_leath_dk,
        m_clay,
    );

    let arm_l = pz_build_arm(
        &mut m,
        g,
        PZ_SHLD_X,
        0.62,
        0.95,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    pz_hand_pellets(&mut m, g, arm_l.wrist, arm_l.axis, m_clay, m_clay_lt);
    m
}
