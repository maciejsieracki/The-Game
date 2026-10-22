//! Port of `render/braz-wlocznik-opus5.ts` (`edb8fb56`):
//! `buildWlocznikBrazOpus5` (Włócznik / Spearman, Bronze).
//!
//! The lazily created `getWB*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::geo::BladeProfile;
use super::kit::{
    add_scaled, blade, bx, cn, cy, cy_open, dir_down, orient_y_to, rot3, seg, sph, v3,
};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`braz-wlocznik-opus5.ts:146-167`)
const WB_SKIN: u32 = 0xdba876;
const WB_SKIN_DK: u32 = 0xb9855a;
const WB_LINEN: u32 = 0xd7c9a0;
const WB_LINEN_DK: u32 = 0xac9a6e;
const WB_LINEN_TRIM: u32 = 0x8f7a52;
const WB_LEATHER: u32 = 0x6b4a28;
const WB_LEATHER_DK: u32 = 0x4a331b;
const WB_HIDE: u32 = 0x8a6a42;
const WB_HIDE_DK: u32 = 0x6a4f2e;
const WB_WOOD: u32 = 0x7a5c3a;
const WB_WOOD_DK: u32 = 0x5c452c;
const WB_BRONZE: u32 = 0xcf9234;
const WB_BRONZE_LT: u32 = 0xdaa84e;
const WB_HAIR: u32 = 0x2a1c10;
const WB_EYE: u32 = 0x14100c;
const WB_BEAD: u32 = 0xdccfa6;

// ── wymiary sylwetki (`:170-189`)
const WB_HIP_Y: f64 = 0.208 * HEX_R;
const WB_TORSO_W: f64 = 0.180 * HEX_R;
const WB_TORSO_H: f64 = 0.205 * HEX_R;
const WB_TORSO_D: f64 = 0.100 * HEX_R;
const WB_TORSO_BOT: f64 = 0.240 * HEX_R;
const WB_TORSO_CTR: f64 = WB_TORSO_BOT + WB_TORSO_H * 0.5;
const WB_TORSO_TOP: f64 = WB_TORSO_BOT + WB_TORSO_H;
const WB_NECK_H: f64 = 0.028 * HEX_R;
const WB_HEAD_S: f64 = 0.128 * HEX_R;
const WB_HEAD_CTR: f64 = WB_TORSO_TOP + WB_NECK_H + WB_HEAD_S * 0.5;
const WB_SHLD_X: f64 = WB_TORSO_W * 0.5 + 0.030 * HEX_R;
const WB_SHLD_Y: f64 = WB_TORSO_TOP - 0.024 * HEX_R;
const WB_HIP_X: f64 = 0.052 * HEX_R;
const WB_THIGH_L: f64 = 0.104 * HEX_R;
const WB_SHIN_L: f64 = 0.096 * HEX_R;
const WB_UPARM_L: f64 = 0.100 * HEX_R;
const WB_FOREARM_L: f64 = 0.092 * HEX_R;
const WB_FIGURE_SCALE: f64 = 1.163;
const WB_DOME_R: f64 = 0.072 * HEX_R;

// ── geometrie-singletony (`:251-310`, `:346-348`)
fn g_torso() -> Geo {
    bx(WB_TORSO_W, WB_TORSO_H, WB_TORSO_D)
}
fn g_chest() -> Geo {
    bx(WB_TORSO_W * 1.05, 0.072 * HEX_R, WB_TORSO_D * 1.06)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, WB_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(WB_HEAD_S, WB_HEAD_S, WB_HEAD_S)
}
fn g_jaw() -> Geo {
    bx(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)
}
fn g_nose() -> Geo {
    bx(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)
}
fn g_brow() -> Geo {
    bx(0.100 * HEX_R, 0.013 * HEX_R, 0.015 * HEX_R)
}
fn g_ear() -> Geo {
    bx(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, WB_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, WB_SHIN_L, 0.042 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, WB_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, WB_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.046 * HEX_R, 0.014 * HEX_R, 0.086 * HEX_R)
}
fn g_toes() -> Geo {
    bx(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)
}
fn g_ank_strap() -> Geo {
    bx(0.050 * HEX_R, 0.010 * HEX_R, 0.014 * HEX_R)
}
fn g_toe_strap() -> Geo {
    bx(0.014 * HEX_R, 0.009 * HEX_R, 0.040 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.066 * HEX_R, 0.118 * HEX_R)
}
fn g_fold() -> Geo {
    bx(0.026 * HEX_R, 0.058 * HEX_R, 0.012 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.016 * HEX_R, 0.038 * HEX_R, 0.010 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.192 * HEX_R, 0.026 * HEX_R, 0.114 * HEX_R)
}
fn g_buckle() -> Geo {
    bx(0.030 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)
}
fn g_strap() -> Geo {
    bx(0.024 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R)
}
fn g_sash() -> Geo {
    bx(0.196 * HEX_R, 0.030 * HEX_R, 0.108 * HEX_R)
}
fn g_leg_wrap() -> Geo {
    bx(0.042 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)
}
fn g_dome() -> Geo {
    sph(WB_DOME_R, 10, 6, 0.0, PI * 2.0, 0.0, PI / 2.0)
}
fn g_brim() -> Geo {
    cy(0.088 * HEX_R, 0.092 * HEX_R, 0.020 * HEX_R, 10)
}
fn g_finial() -> Geo {
    cy(0.012 * HEX_R, 0.018 * HEX_R, 0.016 * HEX_R, 6)
}
fn g_nape() -> Geo {
    bx(0.096 * HEX_R, 0.044 * HEX_R, 0.020 * HEX_R)
}
fn g_hair_tuft() -> Geo {
    bx(0.018 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)
}
fn g_cord() -> Geo {
    bx(0.150 * HEX_R, 0.010 * HEX_R, 0.092 * HEX_R)
}
fn g_bead() -> Geo {
    bx(0.016 * HEX_R, 0.016 * HEX_R, 0.012 * HEX_R)
}
fn g_sheath() -> Geo {
    bx(0.022 * HEX_R, 0.078 * HEX_R, 0.014 * HEX_R)
}
fn g_knife_hlt() -> Geo {
    bx(0.024 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)
}
fn g_shaft() -> Geo {
    cy(0.012 * HEX_R, 0.014 * HEX_R, 0.549 * HEX_R, 8)
}
fn g_socket() -> Geo {
    cy(0.016 * HEX_R, 0.019 * HEX_R, 0.044 * HEX_R, 8)
}
fn g_bind() -> Geo {
    bx(0.019 * HEX_R, 0.017 * HEX_R, 0.019 * HEX_R)
}
fn g_grip_wrap() -> Geo {
    bx(0.017 * HEX_R, 0.040 * HEX_R, 0.017 * HEX_R)
}
fn g_butt() -> Geo {
    cn(0.014 * HEX_R, 0.050 * HEX_R, 6)
}
fn g_sh_face() -> Geo {
    cy(0.100 * HEX_R, 0.100 * HEX_R, 0.020 * HEX_R, 12)
}
fn g_sh_rim() -> Geo {
    cy_open(0.108 * HEX_R, 0.108 * HEX_R, 0.014 * HEX_R, 12)
}
fn g_sh_boss() -> Geo {
    cy(0.018 * HEX_R, 0.024 * HEX_R, 0.020 * HEX_R, 8)
}
fn g_sh_round() -> Geo {
    cy(0.052 * HEX_R, 0.052 * HEX_R, 0.006 * HEX_R, 12)
}
fn g_sh_grip() -> Geo {
    bx(0.052 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)
}
fn g_sh_pad() -> Geo {
    bx(0.070 * HEX_R, 0.020 * HEX_R, 0.010 * HEX_R)
}
fn g_sh_lace() -> Geo {
    bx(0.010 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)
}
fn g_sh_rivet() -> Geo {
    bx(0.011 * HEX_R, 0.011 * HEX_R, 0.007 * HEX_R)
}
fn g_head2() -> Geo {
    blade(
        BladeProfile::LeafHead,
        0.115 * HEX_R,
        0.040 * HEX_R,
        0.016 * HEX_R,
    )
}

/// `wbAlong(group, geo, mtl, P, D)` (`:372-383`).
fn wb_along(m: &mut UnitModel, g: NodeId, geo: Geo, mtl: MatId, p: Vec3, d: Vec3) -> NodeId {
    let id = m.add_mesh_id(g, geo, mtl);
    orient_y_to(m, id, d);
    m.node(id).set_pos_v(p);
    id
}

/// `wbBuildLeg` (`:386-416`).
#[allow(clippy::too_many_arguments)]
fn wb_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_skin: MatId,
    m_sandal: MatId,
    hip_y: f64,
) -> Vec3 {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_skin, p, th_u, WB_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_skin, p, th_l, WB_SHIN_L);
    let foot_z = p.z + 0.014 * HEX_R;
    m.add_mesh(g, g_sole(), m_sandal)
        .set_pos(sx, 0.007 * HEX_R, foot_z);
    m.add_mesh(g, g_toes(), m_skin)
        .set_pos(sx, 0.010 * HEX_R, foot_z + 0.040 * HEX_R);
    m.add_mesh(g, g_ank_strap(), m_sandal)
        .set_pos(sx, 0.034 * HEX_R, foot_z - 0.010 * HEX_R);
    m.add_mesh(g, g_toe_strap(), m_sandal)
        .set_pos(sx, 0.020 * HEX_R, foot_z + 0.024 * HEX_R);
    m.add_mesh(g, g_leg_wrap(), m_sandal)
        .set_pos(sx, 0.070 * HEX_R, p.z - 0.002 * HEX_R);
    p
}

/// Result of `wbBuildArm`.
struct Arm {
    wrist: Vec3,
    axis: Vec3,
}

/// `wbBuildArm` (`:419-436`).
#[allow(clippy::too_many_arguments)]
fn wb_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> Arm {
    let mut p = v3(sx, WB_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, WB_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, WB_FOREARM_L);
    let axis = dir_down(th_f);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, axis, 0.014 * HEX_R));
    }
    Arm { wrist, axis }
}

/// `wbBuildCore` (`:439-474`).
fn wb_build_core(
    m: &mut UnitModel,
    g: NodeId,
    m_tunic: MatId,
    m_skin: MatId,
    m_skin_dk: MatId,
    m_eye: MatId,
) {
    m.add_mesh(g, g_torso(), m_tunic)
        .set_pos(0.0, WB_TORSO_CTR, 0.0);
    m.add_mesh(g, g_chest(), m_tunic)
        .set_pos(0.0, WB_TORSO_TOP - 0.038 * HEX_R, 0.0);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, WB_TORSO_TOP + WB_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, WB_HEAD_CTR, 0.0);
    m.add_mesh(g, g_jaw(), m_skin_dk)
        .set_pos(0.0, WB_HEAD_CTR - WB_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, g_nose(), m_skin).set_pos(
        0.0,
        WB_HEAD_CTR - 0.004 * HEX_R,
        WB_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    m.add_mesh(g, g_brow(), m_skin_dk).rot_x(0.12).set_pos(
        0.0,
        WB_HEAD_CTR + 0.032 * HEX_R,
        WB_HEAD_S * 0.5 + 0.003 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            sx * 0.026 * HEX_R,
            WB_HEAD_CTR + 0.014 * HEX_R,
            WB_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
        m.add_mesh(g, g_ear(), m_skin_dk).set_pos(
            sx * (WB_HEAD_S * 0.5 + 0.004 * HEX_R),
            WB_HEAD_CTR - 0.006 * HEX_R,
            0.0,
        );
    }
}

/// `buildWlocznikBrazOpus5(ownerColor)` (`braz-wlocznik-opus5.ts:485-689`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_wlocznik_braz_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(WB_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(WB_SKIN_DK, 0.05, 0.82);
    let m_linen = m.mat(WB_LINEN, 0.03, 0.88);
    let m_linen_dk = m.mat(WB_LINEN_DK, 0.03, 0.90);
    let m_linen_trim = m.mat(WB_LINEN_TRIM, 0.04, 0.86);
    let m_leather = m.mat(WB_LEATHER, 0.05, 0.85);
    let m_leather_dk = m.mat(WB_LEATHER_DK, 0.05, 0.88);
    let m_hide = m.mat(WB_HIDE, 0.05, 0.86);
    let m_hide_dk = m.mat(WB_HIDE_DK, 0.05, 0.88);
    let m_wood = m.mat(WB_WOOD, 0.05, 0.84);
    let _m_wood_dk = m.mat(WB_WOOD_DK, 0.05, 0.86);
    let m_bronze = m.mat(WB_BRONZE, 0.50, 0.42);
    let m_bronze_lt = m.mat(WB_BRONZE_LT, 0.55, 0.36);
    let m_hair = m.mat(WB_HAIR, 0.04, 0.90);
    let m_eye = m.mat(WB_EYE, 0.05, 0.86);
    let m_bead = m.mat(WB_BEAD, 0.05, 0.70);
    let m_owner = m.mat(owner, 0.10, 0.70);

    let hip_y = WB_HIP_Y - 0.010 * HEX_R;

    wb_build_core(&mut m, g, m_linen, m_skin, m_skin_dk, m_eye);

    wb_build_leg(&mut m, g, WB_HIP_X, 0.56, 0.32, m_skin, m_leather, hip_y);
    wb_build_leg(&mut m, g, -WB_HIP_X, -0.50, -0.18, m_skin, m_leather, hip_y);

    // TUNIKA
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, WB_TORSO_BOT - 0.020 * HEX_R, 0.0);
    for sx in [-1.0, 0.0, 1.0] {
        m.add_mesh(g, g_fold(), m_linen_dk).set_pos(
            sx * 0.056 * HEX_R,
            WB_TORSO_BOT - 0.026 * HEX_R,
            WB_TORSO_D * 0.5 + 0.008 * HEX_R,
        );
    }
    for sx in [-1.5, -0.5, 0.5, 1.5] {
        m.add_mesh(g, g_fringe(), m_linen_dk).set_pos(
            sx * 0.040 * HEX_R,
            WB_TORSO_BOT - 0.050 * HEX_R,
            WB_TORSO_D * 0.5 + 0.004 * HEX_R,
        );
    }
    for s in [-1.0, 1.0] {
        let id = m.add_mesh_id(g, g_strap(), m_linen_trim);
        rot3(&mut m, id, -0.30, 0.0, s * 0.10);
        m.node(id)
            .set_pos(s * 0.052 * HEX_R, WB_SHLD_Y + 0.036 * HEX_R, 0.006 * HEX_R);
    }
    m.add_mesh(g, g_belt(), m_leather)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
    m.add_mesh(g, g_buckle(), m_bronze_lt).set_pos(
        0.0,
        0.252 * HEX_R,
        WB_TORSO_D * 0.5 + 0.013 * HEX_R,
    );
    m.add_mesh(g, g_sash(), m_owner)
        .set_pos(0.0, WB_TORSO_CTR - 0.016 * HEX_R, 0.0);

    // NASZYJNIK
    m.add_mesh(g, g_cord(), m_leather_dk)
        .set_pos(0.0, WB_TORSO_TOP - 0.010 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_bead(), m_bead).set_pos(
            sx * 0.044 * HEX_R,
            WB_TORSO_TOP - 0.020 * HEX_R,
            WB_TORSO_D * 0.5 + 0.011 * HEX_R,
        );
    }

    // NÓŻ
    let knife_x = -(WB_TORSO_W * 0.5 + 0.020 * HEX_R);
    m.add_mesh(g, g_sheath(), m_leather)
        .rot_z(0.10)
        .set_pos(knife_x, 0.198 * HEX_R, 0.012 * HEX_R);
    m.add_mesh(g, g_knife_hlt(), m_bronze_lt)
        .rot_z(0.10)
        .set_pos(knife_x - 0.006 * HEX_R, 0.244 * HEX_R, 0.012 * HEX_R);

    // HEŁM
    let dome_eq_y = WB_HEAD_CTR + 0.020 * HEX_R;
    m.add_mesh(g, g_dome(), m_bronze)
        .set_pos(0.0, dome_eq_y, 0.0);
    m.add_mesh(g, g_brim(), m_bronze_lt)
        .set_pos(0.0, WB_HEAD_CTR + 0.026 * HEX_R, 0.0);
    m.add_mesh(g, g_finial(), m_bronze_lt)
        .set_pos(0.0, dome_eq_y + WB_DOME_R + 0.008 * HEX_R, 0.0);
    m.add_mesh(g, g_nape(), m_hair).set_pos(
        0.0,
        WB_HEAD_CTR + 0.006 * HEX_R,
        -(WB_HEAD_S * 0.5 + 0.006 * HEX_R),
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_hair_tuft(), m_hair).set_pos(
            sx * (WB_HEAD_S * 0.5 + 0.006 * HEX_R),
            WB_HEAD_CTR - 0.008 * HEX_R,
            -0.014 * HEX_R,
        );
    }

    // PRAWE RAMIĘ + WŁÓCZNIA
    let arm_r = wb_build_arm(
        &mut m,
        g,
        -WB_SHLD_X,
        0.10,
        0.05,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    let wb_up = v3(0.0, 1.0, 0.0);
    let spear_x = arm_r.wrist.x - 0.014 * HEX_R;
    let spear_z = arm_r.wrist.z + 0.008 * HEX_R;
    let at_v = |y: f64| v3(spear_x, y * HEX_R, spear_z);
    wb_along(
        &mut m,
        g,
        g_grip_wrap(),
        m_leather_dk,
        at_v(arm_r.wrist.y / HEX_R),
        wb_up,
    );
    wb_along(&mut m, g, g_shaft(), m_wood, at_v(0.3245), wb_up);
    wb_along(&mut m, g, g_socket(), m_bronze, at_v(0.621), wb_up);
    wb_along(&mut m, g, g_bind(), m_leather_dk, at_v(0.595), wb_up);
    wb_along(&mut m, g, g_bind(), m_leather_dk, at_v(0.637), wb_up);
    m.add_mesh(g, g_head2(), m_bronze_lt).set_pos_v(at_v(0.633));
    m.add_mesh(g, g_butt(), m_bronze)
        .set_pos_v(at_v(0.025))
        .rot_x(PI);

    // LEWE RAMIĘ + TARCZA
    let arm_l = wb_build_arm(&mut m, g, WB_SHLD_X, 0.28, 2.00, m_skin, m_skin, None);
    let sh_anchor = add_scaled(arm_l.wrist, arm_l.axis, -WB_FOREARM_L * 0.5);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            sh_anchor.x - 0.030 * HEX_R,
            sh_anchor.y + 0.036 * HEX_R,
            sh_anchor.z + 0.038 * HEX_R,
        )
        .rot_y(-0.20);
    let shield_r = 0.100 * HEX_R;
    m.add_mesh(sh, g_sh_face(), m_hide).rot_x(PI / 2.0);
    m.add_mesh(sh, g_sh_rim(), m_wood)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, -0.005 * HEX_R);
    m.add_mesh(sh, g_sh_round(), m_owner)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, 0.011 * HEX_R);
    m.add_mesh(sh, g_sh_boss(), m_bronze)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, 0.017 * HEX_R);
    m.add_mesh(sh, g_sh_grip(), m_wood)
        .set_pos(0.0, 0.0, -0.022 * HEX_R);
    m.add_mesh(sh, g_sh_pad(), m_leather_dk)
        .set_pos(0.0, 0.020 * HEX_R, -0.016 * HEX_R);
    for k in 0..6 {
        let ang = (f64::from(k) / 6.0) * PI * 2.0;
        m.add_mesh(sh, g_sh_lace(), m_hide_dk)
            .set_pos(
                js_cos(ang) * shield_r * 1.00,
                js_sin(ang) * shield_r * 1.00,
                0.006 * HEX_R,
            )
            .rot_z(ang);
    }
    for k in 0..4 {
        let ang = (f64::from(k) / 4.0) * PI * 2.0 + PI / 4.0;
        m.add_mesh(sh, g_sh_rivet(), m_bronze_lt).set_pos(
            js_cos(ang) * shield_r * 0.92,
            js_sin(ang) * shield_r * 0.92,
            0.012 * HEX_R,
        );
    }
    m.attach(g, sh);

    m.node(g).set_scale_scalar(WB_FIGURE_SCALE);
    m
}
