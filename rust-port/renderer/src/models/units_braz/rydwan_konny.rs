//! Port of `render/braz-rydwan-konny-opus5.ts` (`edb8fb56`):
//! `buildRydwanKonnyBrazOpus5` (Rydwan konny / War Chariot).
//!
//! The lazily created `getRK*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, apply_axis_angle, bx, cn, cy, cy_open, ico, stretch, v3, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`braz-rydwan-konny-opus5.ts:109-128`)
const RK_WOOD: u32 = 0x8a6a42;
const RK_WOOD_DK: u32 = 0x553a1f;
const RK_HIDE: u32 = 0xc4ab7f;
const RK_HIDE_DK: u32 = 0x8e7444;
const RK_BRONZE: u32 = 0xc08f42;
const RK_BRONZE_DK: u32 = 0x8a5f28;
const RK_LEATHER: u32 = 0x6b4a28;
const RK_LEATHER_DK: u32 = 0x452f18;
const RK_SKIN: u32 = 0xb07c4e;
const RK_SKIN_DK: u32 = 0x7d5636;
const RK_LINEN: u32 = 0xcdbc94;
const RK_HAIR: u32 = 0x33200e;
const RK_EYE: u32 = 0x140f0a;
const RK_HORSE: u32 = 0x9c6b3e;
const RK_HORSE_DK: u32 = 0x6b4526;
const RK_MANE: u32 = 0x1d1108;
const RK_HOOF: u32 = 0x3a2c1e;
const RK_MUZZLE: u32 = 0x4e341c;

// ── wymiary wiodące (`:139-197`)
const RK_WHEEL_R: f64 = 0.124 * HEX_R;
const RK_TYRE_R: f64 = RK_WHEEL_R + 0.006 * HEX_R;
const RK_AXLE_Y: f64 = RK_TYRE_R;
const RK_WHEEL_X: f64 = 0.234 * HEX_R;
const RK_AXLE_Z: f64 = -0.196 * HEX_R;
const RK_FLOOR_Y: f64 = RK_AXLE_Y + 0.022 * HEX_R;
const RK_FLOOR_WID: f64 = 0.272 * HEX_R;
const RK_FLOOR_LEN: f64 = 0.190 * HEX_R;
const RK_FLOOR_FZ: f64 = -0.012 * HEX_R;
const RK_FLOOR_RZ: f64 = RK_FLOOR_FZ - RK_FLOOR_LEN;
const RK_FLOOR_ZC: f64 = (RK_FLOOR_FZ + RK_FLOOR_RZ) * 0.5;
const RK_SIDE_H: f64 = 0.140 * HEX_R;
const RK_RAIL_Y: f64 = RK_FLOOR_Y + RK_SIDE_H;
const RK_TORSO_W: f64 = 0.108 * HEX_R;
const RK_TORSO_H: f64 = 0.155 * HEX_R;
const RK_TORSO_D: f64 = 0.078 * HEX_R;
const RK_HIP_Y: f64 = RK_RAIL_Y + 0.030 * HEX_R;
const RK_TORSO_TOP: f64 = RK_HIP_Y + RK_TORSO_H;
const RK_NECK_H: f64 = 0.022 * HEX_R;
const RK_HEAD_S: f64 = 0.094 * HEX_R;
const RK_HEAD_CTR: f64 = RK_TORSO_TOP + RK_NECK_H + RK_HEAD_S * 0.5;
const RK_SHLD_X: f64 = RK_TORSO_W * 0.5 + 0.023 * HEX_R;
const RK_SHLD_Y: f64 = RK_TORSO_TOP - 0.018 * HEX_R;
const RK_CREW_Z: f64 = -0.086 * HEX_R;
const RK_DRIVER_X: f64 = 0.062 * HEX_R;
const RK_FIGHTER_X: f64 = -0.062 * HEX_R;
const RK_H_X: f64 = 0.094 * HEX_R;
const RK_H_Z: f64 = 0.292 * HEX_R;
const RK_H_BARREL_R: f64 = 0.058 * HEX_R;
const RK_H_BARREL_L: f64 = 0.196 * HEX_R;
const RK_HEAD_YAW: f64 = 0.42;
const RK_SKULL_TILT: f64 = 0.32;
const RK_H_HALF: f64 = RK_H_BARREL_L * 0.5;
const RK_H_LEG_TOP: f64 = 0.208 * HEX_R;
const RK_H_CTR_Y: f64 = RK_H_LEG_TOP + RK_H_BARREL_R;
const RK_H_BACK_Y: f64 = RK_H_CTR_Y + RK_H_BARREL_R;
const RK_YOKE_Y: f64 = RK_H_BACK_Y + 0.026 * HEX_R;
const RK_YOKE_Z: f64 = RK_H_Z + RK_H_HALF * 0.63;

// ── geometrie-singletony (`:252-302`)
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_felloe() -> Geo {
    cy_open(RK_WHEEL_R, RK_WHEEL_R, 0.024 * HEX_R, 12)
}
fn g_tyre() -> Geo {
    cy_open(RK_TYRE_R, RK_TYRE_R, 0.030 * HEX_R, 12)
}
fn g_spoke() -> Geo {
    bx(0.018 * HEX_R, RK_WHEEL_R * 1.94, 0.019 * HEX_R)
}
fn g_nave() -> Geo {
    cy(0.020 * HEX_R, 0.026 * HEX_R, 0.044 * HEX_R, 6)
}
fn g_nave_ring() -> Geo {
    cy_open(0.028 * HEX_R, 0.028 * HEX_R, 0.011 * HEX_R, 6)
}
fn g_lynch() -> Geo {
    bx(0.010 * HEX_R, 0.034 * HEX_R, 0.010 * HEX_R)
}
fn g_axle() -> Geo {
    cy(
        0.013 * HEX_R,
        0.013 * HEX_R,
        RK_WHEEL_X * 2.0 + 0.020 * HEX_R,
        6,
    )
}
fn g_floor() -> Geo {
    bx(RK_FLOOR_WID, 0.016 * HEX_R, RK_FLOOR_LEN)
}
fn g_floor_bar() -> Geo {
    bx(RK_FLOOR_WID * 0.96, 0.010 * HEX_R, 0.013 * HEX_R)
}
fn g_front_pan() -> Geo {
    bx(RK_FLOOR_WID * 0.98, RK_SIDE_H * 0.90, 0.017 * HEX_R)
}
fn g_front_rail() -> Geo {
    bx(RK_FLOOR_WID + 0.016 * HEX_R, 0.019 * HEX_R, 0.026 * HEX_R)
}
fn g_side_pan() -> Geo {
    bx(0.016 * HEX_R, RK_SIDE_H * 0.84, RK_FLOOR_LEN * 0.72)
}
fn g_side_rail() -> Geo {
    bx(0.021 * HEX_R, 0.019 * HEX_R, RK_FLOOR_LEN * 0.80)
}
fn g_post() -> Geo {
    bx(0.020 * HEX_R, RK_SIDE_H + 0.014 * HEX_R, 0.020 * HEX_R)
}
fn g_pole_fit() -> Geo {
    cy_open(0.021 * HEX_R, 0.021 * HEX_R, 0.030 * HEX_R, 6)
}
fn g_yoke_bar() -> Geo {
    bx(RK_H_X * 2.0 + 0.086 * HEX_R, 0.022 * HEX_R, 0.024 * HEX_R)
}
fn g_yoke_sdl() -> Geo {
    bx(0.050 * HEX_R, 0.038 * HEX_R, 0.030 * HEX_R)
}
fn g_girth() -> Geo {
    cy_open(
        RK_H_BARREL_R + 0.004 * HEX_R,
        RK_H_BARREL_R + 0.004 * HEX_R,
        0.016 * HEX_R,
        7,
    )
}
fn g_case() -> Geo {
    bx(0.030 * HEX_R, 0.036 * HEX_R, 0.115 * HEX_R)
}
fn g_case_rim() -> Geo {
    bx(0.036 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)
}
fn g_spear_tip() -> Geo {
    cn(0.016 * HEX_R, 0.052 * HEX_R, 4)
}
fn g_spear_sft() -> Geo {
    cy(0.009 * HEX_R, 0.009 * HEX_R, 0.320 * HEX_R, 5)
}
fn g_shield() -> Geo {
    cy(0.076 * HEX_R, 0.076 * HEX_R, 0.016 * HEX_R, 12)
}
fn g_shield_bs() -> Geo {
    cy(0.021 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R, 8)
}
fn g_torso() -> Geo {
    bx(RK_TORSO_W, RK_TORSO_H, RK_TORSO_D)
}
fn g_kilt() -> Geo {
    bx(RK_TORSO_W * 1.06, 0.072 * HEX_R, RK_TORSO_D * 1.10)
}
fn g_sash() -> Geo {
    bx(RK_TORSO_W * 1.08, 0.048 * HEX_R, RK_TORSO_D * 1.08)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, RK_NECK_H * 1.7, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(RK_HEAD_S, RK_HEAD_S, RK_HEAD_S)
}
fn g_hair() -> Geo {
    bx(RK_HEAD_S * 1.04, RK_HEAD_S * 0.28, RK_HEAD_S * 1.04)
}
fn g_eye() -> Geo {
    bx(0.017 * HEX_R, 0.009 * HEX_R, 0.008 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.041 * HEX_R, 0.041 * HEX_R, 0.043 * HEX_R)
}
fn g_barrel() -> Geo {
    cy(RK_H_BARREL_R * 0.94, RK_H_BARREL_R, RK_H_BARREL_L, 7)
}
fn g_chest() -> Geo {
    ico(0.062 * HEX_R, 0)
}
fn g_rump() -> Geo {
    ico(0.060 * HEX_R, 0)
}
fn g_withers() -> Geo {
    bx(0.050 * HEX_R, 0.044 * HEX_R, 0.090 * HEX_R)
}
fn g_neck1() -> Geo {
    cy_open(0.043 * HEX_R, 0.053 * HEX_R, 0.060 * HEX_R, 6)
}
fn g_neck2() -> Geo {
    cy_open(0.036 * HEX_R, 0.043 * HEX_R, 0.054 * HEX_R, 6)
}
fn g_neck3() -> Geo {
    cy_open(0.031 * HEX_R, 0.036 * HEX_R, 0.046 * HEX_R, 6)
}
fn g_skull() -> Geo {
    bx(0.060 * HEX_R, 0.068 * HEX_R, 0.080 * HEX_R)
}
fn g_muzzle() -> Geo {
    cy(0.021 * HEX_R, 0.028 * HEX_R, 0.072 * HEX_R, 5)
}
fn g_ear() -> Geo {
    cn(0.015 * HEX_R, 0.048 * HEX_R, 3)
}
fn g_mane() -> Geo {
    bx(0.014 * HEX_R, 0.020 * HEX_R, 0.048 * HEX_R)
}
fn g_chrap() -> Geo {
    bx(0.026 * HEX_R, 0.018 * HEX_R, 0.014 * HEX_R)
}
fn g_forelock() -> Geo {
    bx(0.015 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R)
}
fn g_h_eye() -> Geo {
    bx(0.009 * HEX_R, 0.012 * HEX_R, 0.011 * HEX_R)
}
fn g_hoof() -> Geo {
    bx(0.028 * HEX_R, 0.022 * HEX_R, 0.032 * HEX_R)
}
fn g_bit() -> Geo {
    cy_open(0.011 * HEX_R, 0.011 * HEX_R, 0.007 * HEX_R, 6)
}

/// `rkStretch(parent, mtl, A, B, w, d)` (`:308-322`).
#[allow(clippy::too_many_arguments)]
fn rk_stretch(
    m: &mut UnitModel,
    parent: NodeId,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    w: f64,
    d: Option<f64>,
) {
    stretch(m, parent, g_unit(), mtl, a, b, w, d);
}

/// `rkWheel` (`:330-375`).
fn rk_wheel(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    m_wood: MatId,
    m_tyre: MatId,
    m_bronze: MatId,
    m_bronze_dk: MatId,
) {
    let x = sx * RK_WHEEL_X;
    m.add_mesh(g, g_felloe(), m_wood)
        .rot_z(PI / 2.0)
        .set_pos(x, RK_AXLE_Y, RK_AXLE_Z);
    m.add_mesh(g, g_tyre(), m_tyre)
        .rot_z(PI / 2.0)
        .set_pos(x, RK_AXLE_Y, RK_AXLE_Z);
    for rot in [0.0, PI / 2.0] {
        m.add_mesh(g, g_spoke(), m_wood)
            .rot_x(rot)
            .set_pos(x, RK_AXLE_Y, RK_AXLE_Z);
    }
    m.add_mesh(g, g_nave(), m_wood)
        .rot_z(-sx * PI / 2.0)
        .set_pos(x + sx * 0.016 * HEX_R, RK_AXLE_Y, RK_AXLE_Z);
    m.add_mesh(g, g_nave_ring(), m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(x + sx * 0.006 * HEX_R, RK_AXLE_Y, RK_AXLE_Z);
    m.add_mesh(g, g_lynch(), m_bronze_dk).set_pos(
        x + sx * 0.034 * HEX_R,
        RK_AXLE_Y + 0.006 * HEX_R,
        RK_AXLE_Z,
    );
}

/// `RKHorseMats` (`:378-389`).
#[derive(Clone, Copy)]
struct HorseMats {
    body: MatId,
    dark: MatId,
    mane: MatId,
    hoof: MatId,
    muzzle: MatId,
    eye: MatId,
    leather: MatId,
    leather_dk: MatId,
    bronze: MatId,
    wood: MatId,
}

/// `rkLeg` (`:392-405`).
#[allow(clippy::too_many_arguments)]
fn rk_leg(
    m: &mut UnitModel,
    g: NodeId,
    hm: &HorseMats,
    x: f64,
    top_y: f64,
    top_z: f64,
    mid_y: f64,
    mid_z: f64,
    hoof_y: f64,
    hoof_z: f64,
) {
    let top = v3(x, top_y, top_z);
    let mid = v3(x, mid_y, mid_z);
    let low = v3(x, hoof_y + 0.012 * HEX_R, hoof_z);
    rk_stretch(m, g, hm.body, top, mid, 0.032 * HEX_R, Some(0.038 * HEX_R));
    rk_stretch(m, g, hm.dark, mid, low, 0.019 * HEX_R, Some(0.022 * HEX_R));
    m.add_mesh(g, g_hoof(), hm.hoof).set_pos(x, hoof_y, hoof_z);
}

/// `rkHorse(group, sx, lift, m)` (`:415-532`): returns the bit point.
#[allow(clippy::too_many_lines)]
fn rk_horse(m: &mut UnitModel, g: NodeId, sx: f64, lift: bool, hm: &HorseMats) -> Vec3 {
    let x = sx * RK_H_X;
    m.add_mesh(g, g_barrel(), hm.body)
        .rot_x(PI / 2.0)
        .set_pos(x, RK_H_CTR_Y, RK_H_Z);
    m.add_mesh(g, g_chest(), hm.body).set_pos(
        x,
        RK_H_CTR_Y - 0.004 * HEX_R,
        RK_H_Z + RK_H_HALF * 0.86,
    );
    m.add_mesh(g, g_rump(), hm.body).set_pos(
        x,
        RK_H_CTR_Y + 0.006 * HEX_R,
        RK_H_Z - RK_H_HALF * 0.88,
    );
    m.add_mesh(g, g_withers(), hm.body).set_pos(
        x,
        RK_H_BACK_Y - 0.014 * HEX_R,
        RK_H_Z + RK_H_HALF * 0.52,
    );

    let leg_x = 0.030 * HEX_R;
    let front_z = RK_H_Z + RK_H_HALF * 0.66;
    let rear_z = RK_H_Z - RK_H_HALF * 0.72;
    let shoulder_y = RK_H_CTR_Y - 0.010 * HEX_R;
    for s in [-1.0, 1.0] {
        let lx = x + s * leg_x;
        #[allow(clippy::float_cmp)]
        let raise = lift && s == -sx;
        if raise {
            rk_leg(
                m,
                g,
                hm,
                lx,
                shoulder_y,
                front_z,
                0.140 * HEX_R,
                front_z + 0.040 * HEX_R,
                0.086 * HEX_R,
                front_z + 0.086 * HEX_R,
            );
        } else {
            rk_leg(
                m,
                g,
                hm,
                lx,
                shoulder_y,
                front_z,
                0.108 * HEX_R,
                front_z + 0.012 * HEX_R,
                0.013 * HEX_R,
                front_z + 0.018 * HEX_R,
            );
        }
        rk_leg(
            m,
            g,
            hm,
            lx,
            RK_H_CTR_Y + 0.006 * HEX_R,
            rear_z,
            0.116 * HEX_R,
            rear_z - 0.030 * HEX_R,
            0.013 * HEX_R,
            rear_z - 0.006 * HEX_R,
        );
    }

    let mut p = v3(x, RK_H_BACK_Y - 0.026 * HEX_R, RK_H_Z + RK_H_HALF * 0.94);
    let segs = [
        (g_neck1(), 0.70, 0.060 * HEX_R),
        (g_neck2(), 0.54, 0.054 * HEX_R),
        (g_neck3(), 0.36, 0.046 * HEX_R),
    ];
    for (geo, ang, len) in segs {
        let dir = v3(0.0, js_cos(ang), js_sin(ang));
        let nrm = v3(0.0, js_sin(ang), -js_cos(ang));
        let ctr = add_scaled(p, dir, len * 0.5);
        m.add_mesh(g, geo, hm.body).rot_x(ang).set_pos_v(ctr);
        m.add_mesh(g, g_mane(), hm.mane)
            .rot_x(ang)
            .set_pos_v(add_scaled(ctr, nrm, 0.023 * HEX_R));
        p = add_scaled(p, dir, len);
    }

    let head_c = p.plus(v3(0.0, -0.004 * HEX_R, 0.024 * HEX_R));
    let head_g = m.add_group(g);
    m.node(head_g).set_pos_v(head_c).rot_y(-sx * RK_HEAD_YAW);

    m.add_mesh(head_g, g_skull(), hm.body).rot_x(-RK_SKULL_TILT);
    let muz_dir = v3(0.0, -js_sin(RK_SKULL_TILT), js_cos(RK_SKULL_TILT));
    let muz_c = muz_dir.scale(0.054 * HEX_R);
    m.add_mesh(head_g, g_muzzle(), hm.body)
        .quat_from_unit_vectors(Y_UP, muz_dir)
        .set_pos_v(muz_c);
    m.add_mesh(head_g, g_chrap(), hm.muzzle)
        .quat_from_unit_vectors(Y_UP, muz_dir)
        .set_pos_v(muz_dir.scale(0.086 * HEX_R));
    m.add_mesh(head_g, g_forelock(), hm.mane)
        .set_pos(0.0, 0.034 * HEX_R, 0.014 * HEX_R);
    for s in [-1.0, 1.0] {
        m.add_mesh(head_g, g_ear(), hm.body)
            .rot_z(s * 0.26)
            .rot_x(0.06)
            .set_pos(s * 0.022 * HEX_R, 0.058 * HEX_R, 0.000);
        m.add_mesh(head_g, g_h_eye(), hm.eye).set_pos(
            s * 0.030 * HEX_R,
            0.012 * HEX_R,
            0.020 * HEX_R,
        );
    }

    let tail_a = v3(x, RK_H_CTR_Y + 0.030 * HEX_R, RK_H_Z - RK_H_HALF * 1.02);
    let tail_b = tail_a.plus(v3(0.0, 0.004 * HEX_R, -0.040 * HEX_R));
    let tail_c = tail_b.plus(v3(0.0, -0.130 * HEX_R, -0.026 * HEX_R));
    rk_stretch(m, g, hm.mane, tail_a, tail_b, 0.021 * HEX_R, None);
    rk_stretch(
        m,
        g,
        hm.mane,
        tail_b,
        tail_c,
        0.024 * HEX_R,
        Some(0.018 * HEX_R),
    );

    m.add_mesh(g, g_yoke_sdl(), hm.wood)
        .set_pos(x, RK_YOKE_Y - 0.024 * HEX_R, RK_YOKE_Z);
    m.add_mesh(g, g_girth(), hm.leather_dk)
        .rot_x(PI / 2.0)
        .set_pos(x, RK_H_CTR_Y, RK_H_Z + RK_H_HALF * 0.30);
    let breast_a = v3(
        x - 0.040 * HEX_R,
        RK_H_CTR_Y + 0.010 * HEX_R,
        RK_H_Z + RK_H_HALF * 0.82,
    );
    let breast_b = v3(
        x + 0.040 * HEX_R,
        RK_H_CTR_Y + 0.010 * HEX_R,
        RK_H_Z + RK_H_HALF * 0.82,
    );
    rk_stretch(
        m,
        g,
        hm.leather,
        breast_a,
        breast_b,
        0.017 * HEX_R,
        Some(0.030 * HEX_R),
    );
    rk_stretch(
        m,
        g,
        hm.leather_dk,
        v3(x, RK_YOKE_Y - 0.030 * HEX_R, RK_YOKE_Z),
        v3(x, RK_H_CTR_Y - 0.010 * HEX_R, RK_H_Z + RK_H_HALF * 0.34),
        0.014 * HEX_R,
        None,
    );

    let bit_local = muz_dir.scale(0.086 * HEX_R);
    rk_stretch(
        m,
        head_g,
        hm.leather,
        v3(0.0, 0.026 * HEX_R, 0.0),
        bit_local,
        0.010 * HEX_R,
        None,
    );
    m.add_mesh(head_g, g_bit(), hm.bronze)
        .rot_z(PI / 2.0)
        .set_pos_v(bit_local);

    let yaw = m.nodes[head_g].rotation.y;
    apply_axis_angle(bit_local, Y_UP, yaw).plus(head_c)
}

/// `rkCrewBody` (`:539-571`).
#[allow(clippy::too_many_arguments)]
fn rk_crew_body(
    m: &mut UnitModel,
    g: NodeId,
    x: f64,
    m_skin: MatId,
    m_linen: MatId,
    m_hair: MatId,
    m_eye: MatId,
    m_sash: Option<MatId>,
) {
    m.add_mesh(g, g_kilt(), m_linen)
        .set_pos(x, RK_HIP_Y - 0.014 * HEX_R, RK_CREW_Z);
    m.add_mesh(g, g_torso(), m_skin)
        .set_pos(x, RK_HIP_Y + RK_TORSO_H * 0.5, RK_CREW_Z);
    if let Some(ms) = m_sash {
        m.add_mesh(g, g_sash(), ms)
            .set_pos(x, RK_HIP_Y + RK_TORSO_H * 0.62, RK_CREW_Z);
    }
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(x, RK_TORSO_TOP + RK_NECK_H * 0.5, RK_CREW_Z);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(x, RK_HEAD_CTR, RK_CREW_Z);
    m.add_mesh(g, g_hair(), m_hair).set_pos(
        x,
        RK_HEAD_CTR + RK_HEAD_S * 0.36,
        RK_CREW_Z - 0.004 * HEX_R,
    );
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            x + s * 0.023 * HEX_R,
            RK_HEAD_CTR + 0.010 * HEX_R,
            RK_CREW_Z + RK_HEAD_S * 0.5 + 0.001 * HEX_R,
        );
    }
}

/// `rkArm` (`:574-585`).
#[allow(clippy::too_many_arguments)]
fn rk_arm(
    m: &mut UnitModel,
    g: NodeId,
    m_skin: MatId,
    m_skin_dk: MatId,
    shoulder: Vec3,
    hand: Vec3,
    elbow_off: Vec3,
) -> Vec3 {
    let elbow = shoulder.lerp(hand, 0.52).plus(elbow_off);
    rk_stretch(m, g, m_skin, shoulder, elbow, 0.047 * HEX_R, None);
    rk_stretch(m, g, m_skin, elbow, hand, 0.036 * HEX_R, None);
    m.add_mesh(g, g_fist(), m_skin_dk).set_pos_v(hand);
    hand
}

/// `buildRydwanKonnyBrazOpus5(ownerColor)` (`braz-rydwan-konny-opus5.ts:597-758`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_rydwan_konny_braz_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(RK_WOOD, 0.06, 0.80);
    let m_wood_dk = m.mat(RK_WOOD_DK, 0.05, 0.86);
    let m_hide = m.mat(RK_HIDE, 0.04, 0.88);
    let m_hide_dk = m.mat(RK_HIDE_DK, 0.04, 0.90);
    let m_bronze = m.mat(RK_BRONZE, 0.62, 0.36);
    let m_bronze_dk = m.mat(RK_BRONZE_DK, 0.55, 0.46);
    let m_leather = m.mat(RK_LEATHER, 0.05, 0.86);
    let m_leather_d = m.mat(RK_LEATHER_DK, 0.05, 0.88);
    let m_skin = m.mat(RK_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(RK_SKIN_DK, 0.05, 0.85);
    let m_linen = m.mat(RK_LINEN, 0.03, 0.92);
    let m_hair = m.mat(RK_HAIR, 0.05, 0.88);
    let m_eye = m.mat(RK_EYE, 0.05, 0.86);
    let m_horse = m.mat(RK_HORSE, 0.05, 0.84);
    let m_horse_dk = m.mat(RK_HORSE_DK, 0.05, 0.88);
    let m_mane = m.mat(RK_MANE, 0.05, 0.90);
    let m_hoof = m.mat(RK_HOOF, 0.10, 0.70);
    let m_chrap = m.mat(RK_MUZZLE, 0.05, 0.88);
    let m_owner = m.mat(owner, 0.12, 0.70);

    for sx in [-1.0, 1.0] {
        rk_wheel(&mut m, g, sx, m_wood, m_leather, m_bronze, m_bronze_dk);
    }
    m.add_mesh(g, g_axle(), m_wood_dk)
        .rot_z(PI / 2.0)
        .set_pos(0.0, RK_AXLE_Y, RK_AXLE_Z);

    // SKRZYNIA
    m.add_mesh(g, g_floor(), m_hide_dk)
        .set_pos(0.0, RK_FLOOR_Y, RK_FLOOR_ZC);
    for dz in [-0.048, 0.020] {
        m.add_mesh(g, g_floor_bar(), m_wood).set_pos(
            0.0,
            RK_FLOOR_Y + 0.011 * HEX_R,
            RK_FLOOR_ZC + dz * HEX_R,
        );
    }
    m.add_mesh(g, g_front_pan(), m_owner)
        .set_pos(0.0, RK_FLOOR_Y + RK_SIDE_H * 0.48, RK_FLOOR_FZ);
    m.add_mesh(g, g_front_rail(), m_wood)
        .set_pos(0.0, RK_RAIL_Y, RK_FLOOR_FZ);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_side_pan(), m_hide).set_pos(
            sx * RK_FLOOR_WID * 0.5,
            RK_FLOOR_Y + RK_SIDE_H * 0.45,
            RK_FLOOR_ZC + RK_FLOOR_LEN * 0.10,
        );
        m.add_mesh(g, g_side_rail(), m_wood).set_pos(
            sx * RK_FLOOR_WID * 0.5,
            RK_RAIL_Y,
            RK_FLOOR_ZC + RK_FLOOR_LEN * 0.08,
        );
        m.add_mesh(g, g_post(), m_wood).set_pos(
            sx * RK_FLOOR_WID * 0.5,
            RK_FLOOR_Y + RK_SIDE_H * 0.5,
            RK_FLOOR_FZ,
        );
    }

    // FUTERAŁ
    let cx = RK_FLOOR_WID * 0.5 + 0.018 * HEX_R;
    let cyy = RK_FLOOR_Y + RK_SIDE_H * 0.62;
    let cz = RK_FLOOR_ZC + 0.010 * HEX_R;
    m.add_mesh(g, g_case(), m_leather)
        .rot_x(0.10)
        .set_pos(cx, cyy, cz);
    m.add_mesh(g, g_case_rim(), m_leather_d)
        .set_pos(cx, cyy + 0.010 * HEX_R, cz + 0.052 * HEX_R);
    for dx in [-0.008, 0.008] {
        let a = v3(cx + dx * HEX_R, cyy + 0.020 * HEX_R, cz + 0.050 * HEX_R);
        let b = a.plus(v3(dx * 0.9 * HEX_R, 0.086 * HEX_R, 0.052 * HEX_R));
        rk_stretch(&mut m, g, m_wood_dk, a, b, 0.010 * HEX_R, None);
        let dir = b.minus(a).normalize();
        m.add_mesh(g, g_spear_tip(), m_bronze)
            .set_scale(0.62, 0.62, 0.62)
            .quat_from_unit_vectors(Y_UP, dir)
            .set_pos_v(add_scaled(b, dir, 0.016 * HEX_R));
    }

    // DYSZEL
    let pole_a = v3(0.0, RK_AXLE_Y + 0.006 * HEX_R, RK_AXLE_Z);
    let pole_b = v3(0.0, RK_FLOOR_Y - 0.012 * HEX_R, RK_FLOOR_FZ + 0.030 * HEX_R);
    let pole_c = v3(0.0, RK_YOKE_Y, RK_YOKE_Z);
    rk_stretch(&mut m, g, m_wood_dk, pole_a, pole_b, 0.024 * HEX_R, None);
    rk_stretch(&mut m, g, m_wood_dk, pole_b, pole_c, 0.023 * HEX_R, None);
    m.add_mesh(g, g_pole_fit(), m_bronze_dk)
        .rot_x(PI / 2.0)
        .set_pos_v(pole_c);

    // JARZMO
    m.add_mesh(g, g_yoke_bar(), m_wood_dk)
        .set_pos(0.0, RK_YOKE_Y, RK_YOKE_Z);

    // KONIE
    let hm = HorseMats {
        body: m_horse,
        dark: m_horse_dk,
        mane: m_mane,
        hoof: m_hoof,
        muzzle: m_chrap,
        eye: m_eye,
        leather: m_leather,
        leather_dk: m_leather_d,
        bronze: m_bronze,
        wood: m_wood,
    };
    let bit_l = rk_horse(&mut m, g, -1.0, true, &hm);
    let bit_r = rk_horse(&mut m, g, 1.0, false, &hm);

    // ZAŁOGA
    rk_crew_body(
        &mut m,
        g,
        RK_DRIVER_X,
        m_skin,
        m_linen,
        m_hair,
        m_eye,
        Some(m_owner),
    );
    rk_crew_body(
        &mut m,
        g,
        RK_FIGHTER_X,
        m_skin,
        m_linen,
        m_hair,
        m_eye,
        None,
    );

    for s in [-1.0, 1.0] {
        let shoulder = v3(RK_DRIVER_X + s * RK_SHLD_X, RK_SHLD_Y, RK_CREW_Z);
        let hand = v3(
            RK_DRIVER_X + s * 0.048 * HEX_R,
            RK_SHLD_Y - 0.086 * HEX_R,
            RK_CREW_Z + 0.104 * HEX_R,
        );
        rk_arm(
            &mut m,
            g,
            m_skin,
            m_skin_dk,
            shoulder,
            hand,
            v3(s * 0.014 * HEX_R, 0.0, 0.0),
        );
        rk_stretch(
            &mut m,
            g,
            m_leather,
            hand,
            if s < 0.0 { bit_l } else { bit_r },
            0.009 * HEX_R,
            None,
        );
    }

    let sh_r = v3(RK_FIGHTER_X + RK_SHLD_X, RK_SHLD_Y, RK_CREW_Z);
    let hand_r = sh_r.plus(v3(0.010 * HEX_R, 0.078 * HEX_R, 0.026 * HEX_R));
    rk_arm(
        &mut m,
        g,
        m_skin,
        m_skin_dk,
        sh_r,
        hand_r,
        v3(0.014 * HEX_R, -0.018 * HEX_R, 0.0),
    );
    let spear_dir = v3(0.10, 0.90, 0.42).normalize();
    let spear_tail = add_scaled(hand_r, spear_dir, -0.120 * HEX_R);
    m.add_mesh(g, g_spear_sft(), m_wood_dk)
        .quat_from_unit_vectors(Y_UP, spear_dir)
        .set_pos_v(add_scaled(spear_tail, spear_dir, 0.160 * HEX_R));
    m.add_mesh(g, g_spear_tip(), m_bronze)
        .quat_from_unit_vectors(Y_UP, spear_dir)
        .set_pos_v(add_scaled(
            spear_tail,
            spear_dir,
            0.320 * HEX_R + 0.026 * HEX_R,
        ));

    let sh_l = v3(RK_FIGHTER_X - RK_SHLD_X, RK_SHLD_Y, RK_CREW_Z);
    let hand_l = sh_l.plus(v3(-0.020 * HEX_R, -0.072 * HEX_R, 0.046 * HEX_R));
    rk_arm(
        &mut m,
        g,
        m_skin,
        m_skin_dk,
        sh_l,
        hand_l,
        v3(-0.016 * HEX_R, 0.0, 0.0),
    );
    let shield_c = hand_l.plus(v3(-0.008 * HEX_R, 0.020 * HEX_R, 0.028 * HEX_R));
    m.add_mesh(g, g_shield(), m_owner)
        .rot_x(PI / 2.0)
        .rot_z(0.16)
        .set_pos_v(shield_c);
    m.add_mesh(g, g_shield_bs(), m_bronze)
        .rot_x(PI / 2.0)
        .set_pos_v(shield_c.plus(v3(0.0, 0.0, 0.012 * HEX_R)));
    m
}
