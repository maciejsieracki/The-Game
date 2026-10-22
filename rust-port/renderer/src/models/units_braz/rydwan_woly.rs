//! Port of `render/braz-rydwan-woly-opus5.ts` (`edb8fb56`):
//! `buildRydwanWolyBrazOpus5` (Rydwan (woły) / Ox Chariot).
//!
//! The lazily created `getRW*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, cy_open, stretch, v3, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::js_cos;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`braz-rydwan-woly-opus5.ts:113-131`)
const RW_WOOD: u32 = 0x7a5c3a;
const RW_WOOD_DK: u32 = 0x4a3018;
const RW_WICKER: u32 = 0x9a7a48;
const RW_WICKER_DK: u32 = 0x6d5230;
const RW_BRONZE: u32 = 0xbe8b3e;
const RW_BRONZE_DK: u32 = 0x8a5f28;
const RW_LEATHER: u32 = 0x6b4a28;
const RW_LEATHER_DK: u32 = 0x4a331b;
const RW_SKIN: u32 = 0xad7a4c;
const RW_SKIN_DK: u32 = 0x7a5636;
const RW_KAUNAKES: u32 = 0xd0c090;
const RW_KAUNAKES_DK: u32 = 0xab8f62;
const RW_EYE: u32 = 0x140f0a;
const RW_OX_BODY: u32 = 0x8a7458;
const RW_OX_DK: u32 = 0x5a4a38;
const RW_OX_HORN: u32 = 0xd6cbad;
const RW_OX_MUZZLE: u32 = 0x4a3a2c;

// ── wymiary wiodące (`:135-182`)
const RW_WHEEL_R: f64 = 0.062 * HEX_R;
const RW_TYRE_R: f64 = RW_WHEEL_R + 0.005 * HEX_R;
const RW_WHEEL_X: f64 = 0.150 * HEX_R;
const RW_AXLE_ZF: f64 = 0.100 * HEX_R;
const RW_AXLE_ZR: f64 = -0.140 * HEX_R;
const RW_FLOOR_ZC: f64 = -0.020 * HEX_R;
const RW_FLOOR_LEN: f64 = 0.320 * HEX_R;
const RW_FLOOR_WID: f64 = 0.260 * HEX_R;
const RW_FLOOR_FZ: f64 = RW_FLOOR_ZC + RW_FLOOR_LEN * 0.5;
const RW_FLOOR_RZ: f64 = RW_FLOOR_ZC - RW_FLOOR_LEN * 0.5;
const RW_FRONT_TOP: f64 = 0.260 * HEX_R;
const RW_TORSO_W: f64 = 0.170 * HEX_R;
const RW_TORSO_H: f64 = 0.195 * HEX_R;
const RW_TORSO_D: f64 = 0.095 * HEX_R;
const RW_NECK_H: f64 = 0.026 * HEX_R;
const RW_HEAD_S: f64 = 0.118 * HEX_R;
const RW_DRIVER_Z: f64 = 0.010 * HEX_R;
const RW_OX_LEG_L: f64 = 0.178 * HEX_R;
const RW_OX_TORSO_H: f64 = 0.135 * HEX_R;
const RW_OX_TORSO_W: f64 = 0.108 * HEX_R;
const RW_OX_TORSO_LEN: f64 = 0.192 * HEX_R;
const RW_OX_CTR_Y: f64 = RW_OX_LEG_L + RW_OX_TORSO_H * 0.5;
const RW_OX_X: f64 = 0.098 * HEX_R;
const RW_OX_Z: f64 = 0.360 * HEX_R;
const RW_OX_HALF_LEN: f64 = RW_OX_TORSO_LEN * 0.5;
const RW_YOKE_Y: f64 = RW_OX_CTR_Y + RW_OX_TORSO_H * 0.5 + 0.030 * HEX_R;
const RW_YOKE_Z: f64 = RW_OX_Z - RW_OX_HALF_LEN * 0.55;

/// Dimensions that depend on `Math.cos` (`RW_AXLE_Y` and everything above
/// the floor), computed once per build with V8's `cos`.
#[derive(Clone, Copy)]
struct Dims {
    axle_y: f64,
    floor_y: f64,
    torso_bot: f64,
    torso_top: f64,
    head_ctr: f64,
    shld_x: f64,
    shld_y: f64,
}

impl Dims {
    fn new() -> Self {
        let axle_y = RW_TYRE_R * js_cos(PI / 10.0);
        let floor_y = axle_y + 0.036 * HEX_R;
        let torso_bot = floor_y + 0.240 * HEX_R;
        let torso_top = torso_bot + RW_TORSO_H;
        let head_ctr = torso_top + RW_NECK_H + RW_HEAD_S * 0.5;
        Self {
            axle_y,
            floor_y,
            torso_bot,
            torso_top,
            head_ctr,
            shld_x: RW_TORSO_W * 0.5 + 0.028 * HEX_R,
            shld_y: torso_top - 0.022 * HEX_R,
        }
    }
}

// ── geometrie-singletony (`:233-275`)
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_wheel() -> Geo {
    cy(RW_WHEEL_R, RW_WHEEL_R, 0.026 * HEX_R, 10)
}
fn g_tyre() -> Geo {
    cy_open(RW_TYRE_R, RW_TYRE_R, 0.030 * HEX_R, 10)
}
fn g_nave() -> Geo {
    cy(0.016 * HEX_R, 0.020 * HEX_R, 0.028 * HEX_R, 6)
}
fn g_nave_ring() -> Geo {
    cy_open(0.022 * HEX_R, 0.022 * HEX_R, 0.010 * HEX_R, 6)
}
fn g_seam() -> Geo {
    bx(0.007 * HEX_R, 0.100 * HEX_R, 0.009 * HEX_R)
}
fn g_axle() -> Geo {
    cy(0.011 * HEX_R, 0.011 * HEX_R, 0.330 * HEX_R, 6)
}
fn g_floor() -> Geo {
    bx(RW_FLOOR_WID, 0.018 * HEX_R, RW_FLOOR_LEN)
}
fn g_side_rail() -> Geo {
    bx(0.018 * HEX_R, 0.030 * HEX_R, RW_FLOOR_LEN)
}
fn g_rear_wall() -> Geo {
    bx(RW_FLOOR_WID, 0.100 * HEX_R, 0.018 * HEX_R)
}
fn g_front_pan(d: &Dims) -> Geo {
    bx(RW_FLOOR_WID * 0.94, RW_FRONT_TOP - d.floor_y, 0.020 * HEX_R)
}
fn g_front_cap() -> Geo {
    bx(RW_FLOOR_WID, 0.018 * HEX_R, 0.028 * HEX_R)
}
fn g_front_wng(d: &Dims) -> Geo {
    bx(
        0.020 * HEX_R,
        (RW_FRONT_TOP - d.floor_y) * 0.78,
        0.130 * HEX_R,
    )
}
fn g_lath() -> Geo {
    bx(RW_FLOOR_WID * 0.88, 0.014 * HEX_R, 0.012 * HEX_R)
}
fn g_quiver() -> Geo {
    bx(0.050 * HEX_R, 0.150 * HEX_R, 0.044 * HEX_R)
}
fn g_q_rim() -> Geo {
    bx(0.058 * HEX_R, 0.016 * HEX_R, 0.052 * HEX_R)
}
fn g_q_strap() -> Geo {
    bx(0.070 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)
}
fn g_jav_shaft() -> Geo {
    cy(0.008 * HEX_R, 0.008 * HEX_R, 0.150 * HEX_R, 5)
}
fn g_jav_tip() -> Geo {
    cn(0.013 * HEX_R, 0.042 * HEX_R, 4)
}
fn g_yoke_bar() -> Geo {
    bx(2.0 * RW_OX_X + 0.070 * HEX_R, 0.024 * HEX_R, 0.026 * HEX_R)
}
fn g_yoke_fit() -> Geo {
    cy_open(0.020 * HEX_R, 0.020 * HEX_R, 0.034 * HEX_R, 6)
}
fn g_lashing() -> Geo {
    cy_open(0.022 * HEX_R, 0.022 * HEX_R, 0.018 * HEX_R, 6)
}
fn g_mast() -> Geo {
    bx(0.013 * HEX_R, 0.340 * HEX_R, 0.013 * HEX_R)
}
fn g_mast_bar() -> Geo {
    bx(0.010 * HEX_R, 0.010 * HEX_R, 0.086 * HEX_R)
}
fn g_banner() -> Geo {
    bx(0.008 * HEX_R, 0.058 * HEX_R, 0.078 * HEX_R)
}
fn g_torso() -> Geo {
    bx(RW_TORSO_W, RW_TORSO_H, RW_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.044 * HEX_R, RW_NECK_H * 1.6, 0.044 * HEX_R)
}
fn g_head() -> Geo {
    bx(RW_HEAD_S, RW_HEAD_S, RW_HEAD_S)
}
fn g_jaw() -> Geo {
    bx(0.080 * HEX_R, 0.032 * HEX_R, 0.036 * HEX_R)
}
fn g_eye() -> Geo {
    bx(0.018 * HEX_R, 0.010 * HEX_R, 0.008 * HEX_R)
}
fn g_kaun_a() -> Geo {
    bx(RW_TORSO_W * 1.10, 0.060 * HEX_R, RW_TORSO_D * 1.15)
}
fn g_kaun_b() -> Geo {
    bx(RW_TORSO_W * 1.02, 0.058 * HEX_R, RW_TORSO_D * 1.08)
}
fn g_fist() -> Geo {
    bx(0.044 * HEX_R, 0.044 * HEX_R, 0.046 * HEX_R)
}
fn g_ox_torso() -> Geo {
    bx(RW_OX_TORSO_W, RW_OX_TORSO_H, RW_OX_TORSO_LEN)
}
fn g_ox_skull() -> Geo {
    bx(0.065 * HEX_R, 0.065 * HEX_R, 0.078 * HEX_R)
}
fn g_ox_muzzle() -> Geo {
    bx(0.055 * HEX_R, 0.045 * HEX_R, 0.043 * HEX_R)
}
fn g_ox_ear() -> Geo {
    bx(0.013 * HEX_R, 0.025 * HEX_R, 0.050 * HEX_R)
}
fn g_ox_horn() -> Geo {
    cn(0.018 * HEX_R, 0.070 * HEX_R, 5)
}
fn g_ox_hoof() -> Geo {
    bx(0.044 * HEX_R, 0.028 * HEX_R, 0.048 * HEX_R)
}
fn g_nose_ring() -> Geo {
    cy_open(0.010 * HEX_R, 0.010 * HEX_R, 0.008 * HEX_R, 6)
}

/// `rwStretch(parent, mtl, A, B, w, d)` (`:281-295`).
#[allow(clippy::too_many_arguments)]
fn rw_stretch(
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

/// `rwWheel` (`:302-334`).
#[allow(clippy::too_many_arguments)]
fn rw_wheel(
    m: &mut UnitModel,
    g: NodeId,
    d: &Dims,
    sx: f64,
    z: f64,
    m_wood: MatId,
    m_seam: MatId,
    m_tyre: MatId,
    m_bronze: MatId,
) {
    let x = sx * RW_WHEEL_X;
    m.add_mesh(g, g_wheel(), m_wood)
        .rot_z(PI / 2.0)
        .set_pos(x, d.axle_y, z);
    m.add_mesh(g, g_tyre(), m_tyre)
        .rot_z(PI / 2.0)
        .set_pos(x, d.axle_y, z);
    for dz in [-0.026, 0.026] {
        m.add_mesh(g, g_seam(), m_seam)
            .set_pos(x + sx * 0.015 * HEX_R, d.axle_y, z + dz * HEX_R);
    }
    m.add_mesh(g, g_nave(), m_wood)
        .rot_z(-sx * PI / 2.0)
        .set_pos(x + sx * 0.025 * HEX_R, d.axle_y, z);
    m.add_mesh(g, g_nave_ring(), m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(x + sx * 0.016 * HEX_R, d.axle_y, z);
}

/// `rwOx` (`:342-392`): returns the nose-ring point.
#[allow(clippy::too_many_arguments)]
fn rw_ox(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    m_body: MatId,
    m_dk: MatId,
    m_horn: MatId,
    m_muzzle: MatId,
    m_bronze: MatId,
) -> Vec3 {
    let x = sx * RW_OX_X;
    m.add_mesh(g, g_ox_torso(), m_body)
        .set_pos(x, RW_OX_CTR_Y, RW_OX_Z);
    let leg_top_y = RW_OX_CTR_Y - RW_OX_TORSO_H * 0.5;
    for lz in [
        RW_OX_Z + RW_OX_HALF_LEN * 0.62,
        RW_OX_Z - RW_OX_HALF_LEN * 0.62,
    ] {
        for lx in [-0.036, 0.036] {
            rw_stretch(
                m,
                g,
                m_body,
                v3(x + lx * HEX_R, leg_top_y, lz),
                v3(x + lx * HEX_R, 0.015 * HEX_R, lz),
                0.036 * HEX_R,
                Some(0.040 * HEX_R),
            );
            m.add_mesh(g, g_ox_hoof(), m_dk)
                .set_pos(x + lx * HEX_R, 0.014 * HEX_R, lz);
        }
    }
    let neck_a = v3(
        x,
        RW_OX_CTR_Y + RW_OX_TORSO_H * 0.30,
        RW_OX_Z + RW_OX_HALF_LEN,
    );
    let neck_b = v3(x, RW_YOKE_Y - 0.007 * HEX_R, RW_YOKE_Z);
    rw_stretch(m, g, m_body, neck_a, neck_b, 0.056 * HEX_R, None);
    let head_c = neck_b.plus(v3(0.0, -0.021 * HEX_R, 0.060 * HEX_R));
    m.add_mesh(g, g_ox_skull(), m_body).set_pos_v(head_c);
    m.add_mesh(g, g_ox_muzzle(), m_muzzle)
        .set_pos_v(head_c.plus(v3(0.0, -0.012 * HEX_R, 0.054 * HEX_R)));
    let nose_p = head_c.plus(v3(0.0, -0.019 * HEX_R, 0.074 * HEX_R));
    m.add_mesh(g, g_nose_ring(), m_bronze)
        .rot_x(PI / 2.0)
        .set_pos_v(nose_p);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_ox_horn(), m_horn)
            .rot_z(s * 0.62)
            .rot_x(-0.30)
            .set_pos_v(head_c.plus(v3(s * 0.034 * HEX_R, 0.036 * HEX_R, -0.012 * HEX_R)));
        m.add_mesh(g, g_ox_ear(), m_dk)
            .rot_z(s * 1.30)
            .set_pos_v(head_c.plus(v3(s * 0.038 * HEX_R, 0.007 * HEX_R, -0.017 * HEX_R)));
    }
    let tail_a = v3(
        x,
        RW_OX_CTR_Y + RW_OX_TORSO_H * 0.30,
        RW_OX_Z - RW_OX_HALF_LEN,
    );
    let tail_b = tail_a.plus(v3(0.0, -0.100 * HEX_R, -0.028 * HEX_R));
    rw_stretch(m, g, m_dk, tail_a, tail_b, 0.019 * HEX_R, None);
    nose_p
}

/// `buildRydwanWolyBrazOpus5(ownerColor)` (`braz-rydwan-woly-opus5.ts:398-597`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_rydwan_woly_braz_opus5(owner: u32) -> UnitModel {
    let d = Dims::new();
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(RW_WOOD, 0.06, 0.82);
    let m_wood_dk = m.mat(RW_WOOD_DK, 0.04, 0.88);
    let m_wicker = m.mat(RW_WICKER, 0.05, 0.86);
    let m_wicker_dk = m.mat(RW_WICKER_DK, 0.05, 0.88);
    let m_bronze = m.mat(RW_BRONZE, 0.60, 0.38);
    let m_bronze_dk = m.mat(RW_BRONZE_DK, 0.55, 0.46);
    let m_leather = m.mat(RW_LEATHER, 0.05, 0.86);
    let m_leather_d = m.mat(RW_LEATHER_DK, 0.05, 0.88);
    let m_skin = m.mat(RW_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(RW_SKIN_DK, 0.05, 0.85);
    let m_kaun_a = m.mat(RW_KAUNAKES, 0.04, 0.92);
    let m_kaun_b = m.mat(RW_KAUNAKES_DK, 0.04, 0.92);
    let m_eye = m.mat(RW_EYE, 0.05, 0.86);
    let m_ox_body = m.mat(RW_OX_BODY, 0.04, 0.90);
    let m_ox_dk = m.mat(RW_OX_DK, 0.04, 0.92);
    let m_ox_horn = m.mat(RW_OX_HORN, 0.10, 0.60);
    let m_ox_muzzle = m.mat(RW_OX_MUZZLE, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.70);

    // ZESPÓŁ JEZDNY
    for z in [RW_AXLE_ZF, RW_AXLE_ZR] {
        for sx in [-1.0, 1.0] {
            rw_wheel(&mut m, g, &d, sx, z, m_wood, m_wood_dk, m_leather, m_bronze);
        }
        m.add_mesh(g, g_axle(), m_wood_dk)
            .rot_z(PI / 2.0)
            .set_pos(0.0, d.axle_y, z);
    }

    // SKRZYNIA
    m.add_mesh(g, g_floor(), m_wood)
        .set_pos(0.0, d.floor_y, RW_FLOOR_ZC);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_side_rail(), m_wood).set_pos(
            sx * RW_FLOOR_WID * 0.5,
            d.floor_y + 0.024 * HEX_R,
            RW_FLOOR_ZC,
        );
    }
    m.add_mesh(g, g_rear_wall(), m_wood)
        .set_pos(0.0, d.floor_y + 0.050 * HEX_R, RW_FLOOR_RZ);

    // PRZEDNI PANEL
    m.add_mesh(g, g_front_pan(&d), m_wicker).set_pos(
        0.0,
        d.floor_y + (RW_FRONT_TOP - d.floor_y) * 0.5,
        RW_FLOOR_FZ,
    );
    m.add_mesh(g, g_front_cap(), m_wood_dk)
        .set_pos(0.0, RW_FRONT_TOP, RW_FLOOR_FZ);
    for dy in [-0.055, 0.015] {
        m.add_mesh(g, g_lath(), m_wicker_dk).set_pos(
            0.0,
            RW_FRONT_TOP + dy * HEX_R,
            RW_FLOOR_FZ + 0.011 * HEX_R,
        );
    }
    m.add_mesh(g, g_front_wng(&d), m_wicker)
        .rot_y(0.30)
        .set_pos(
            -RW_FLOOR_WID * 0.48,
            d.floor_y + (RW_FRONT_TOP - d.floor_y) * 0.42,
            RW_FLOOR_FZ - 0.040 * HEX_R,
        );
    m.add_mesh(g, g_front_wng(&d), m_owner)
        .rot_y(-0.30)
        .set_pos(
            RW_FLOOR_WID * 0.48,
            d.floor_y + (RW_FRONT_TOP - d.floor_y) * 0.42,
            RW_FLOOR_FZ - 0.040 * HEX_R,
        );

    // KOŁCZAN Z OSZCZEPAMI
    let qx = -0.078 * HEX_R;
    let qy = d.floor_y + (RW_FRONT_TOP - d.floor_y) * 0.66;
    let qz = RW_FLOOR_FZ + 0.026 * HEX_R;
    m.add_mesh(g, g_quiver(), m_leather)
        .rot_x(-0.16)
        .set_pos(qx, qy, qz);
    m.add_mesh(g, g_q_rim(), m_leather_d).rot_x(-0.16).set_pos(
        qx,
        qy + 0.080 * HEX_R,
        qz - 0.012 * HEX_R,
    );
    m.add_mesh(g, g_q_strap(), m_leather_d)
        .rot_z(PI / 2.0)
        .set_pos(qx, qy - 0.010 * HEX_R, RW_FLOOR_FZ + 0.001 * HEX_R);
    for [dx, dz] in [[-0.014, 0.0], [0.006, -0.006], [0.020, -0.012]] {
        let a = v3(qx + dx * HEX_R, qy + 0.050 * HEX_R, qz + dz * HEX_R);
        let b = a.plus(v3(dx * 0.35 * HEX_R, 0.150 * HEX_R, -dz * 0.4 * HEX_R));
        rw_stretch(&mut m, g, m_leather_d, a, b, 0.014 * HEX_R, None);
        let dir = b.minus(a).normalize();
        m.add_mesh(g, g_jav_tip(), m_bronze)
            .quat_from_unit_vectors(Y_UP, dir)
            .set_pos_v(add_scaled(b, dir, 0.021 * HEX_R));
    }

    // DYSZEL + JARZMO
    let pole_a = v3(0.0, d.floor_y + 0.014 * HEX_R, RW_FLOOR_FZ);
    let pole_b = v3(0.0, RW_YOKE_Y, RW_YOKE_Z);
    rw_stretch(&mut m, g, m_wood, pole_a, pole_b, 0.026 * HEX_R, None);
    m.add_mesh(g, g_yoke_fit(), m_bronze_dk)
        .rot_x(PI / 2.0)
        .set_pos_v(pole_b);
    m.add_mesh(g, g_yoke_bar(), m_wood_dk)
        .set_pos(0.0, RW_YOKE_Y, RW_YOKE_Z);
    m.add_mesh(g, g_lashing(), m_leather_d)
        .rot_x(PI / 2.0)
        .set_pos(0.0, RW_YOKE_Y, RW_YOKE_Z);

    // WOŁY
    let nose_l = rw_ox(
        &mut m,
        g,
        -1.0,
        m_ox_body,
        m_ox_dk,
        m_ox_horn,
        m_ox_muzzle,
        m_bronze,
    );
    let nose_r = rw_ox(
        &mut m,
        g,
        1.0,
        m_ox_body,
        m_ox_dk,
        m_ox_horn,
        m_ox_muzzle,
        m_bronze,
    );
    for sx in [-1.0, 1.0] {
        let strap_a = v3(sx * RW_OX_X, RW_YOKE_Y, RW_YOKE_Z + 0.006 * HEX_R);
        let strap_b = strap_a.plus(v3(0.0, -0.048 * HEX_R, 0.014 * HEX_R));
        rw_stretch(
            &mut m,
            g,
            m_leather_d,
            strap_a,
            strap_b,
            0.020 * HEX_R,
            None,
        );
    }

    // WOŹNICA
    m.add_mesh(g, g_torso(), m_kaun_a)
        .set_pos(0.0, d.torso_bot + RW_TORSO_H * 0.5, RW_DRIVER_Z);
    m.add_mesh(g, g_kaun_b(), m_kaun_b)
        .set_pos(0.0, d.torso_bot - 0.010 * HEX_R, RW_DRIVER_Z);
    m.add_mesh(g, g_kaun_a(), m_owner)
        .set_pos(0.0, d.torso_bot + 0.026 * HEX_R, RW_DRIVER_Z);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, d.torso_top + RW_NECK_H * 0.5, RW_DRIVER_Z);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, d.head_ctr, RW_DRIVER_Z);
    m.add_mesh(g, g_jaw(), m_skin_dk).set_pos(
        0.0,
        d.head_ctr - RW_HEAD_S * 0.36,
        RW_DRIVER_Z + RW_HEAD_S * 0.5 - 0.006 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            sx * 0.024 * HEX_R,
            d.head_ctr + 0.012 * HEX_R,
            RW_DRIVER_Z + RW_HEAD_S * 0.5 + 0.001 * HEX_R,
        );
    }

    // LEWA ręka: lejce
    let shld_l = v3(d.shld_x, d.shld_y, RW_DRIVER_Z);
    let hand_l = shld_l.plus(v3(0.030 * HEX_R, -0.150 * HEX_R, 0.110 * HEX_R));
    let elbow_l = shld_l.lerp(hand_l, 0.52).plus(v3(0.014 * HEX_R, 0.0, 0.0));
    rw_stretch(&mut m, g, m_skin, shld_l, elbow_l, 0.050 * HEX_R, None);
    rw_stretch(&mut m, g, m_skin, elbow_l, hand_l, 0.038 * HEX_R, None);
    m.add_mesh(g, g_fist(), m_skin_dk).set_pos_v(hand_l);
    rw_stretch(&mut m, g, m_leather, hand_l, nose_l, 0.010 * HEX_R, None);
    rw_stretch(&mut m, g, m_leather, hand_l, nose_r, 0.010 * HEX_R, None);

    // PRAWA ręka: oszczep
    let shld_r = v3(-d.shld_x, d.shld_y, RW_DRIVER_Z);
    let hand_r = shld_r.plus(v3(0.028 * HEX_R, 0.130 * HEX_R, 0.090 * HEX_R));
    let elbow_r = shld_r
        .lerp(hand_r, 0.50)
        .plus(v3(-0.020 * HEX_R, 0.0, 0.010 * HEX_R));
    rw_stretch(&mut m, g, m_skin, shld_r, elbow_r, 0.050 * HEX_R, None);
    rw_stretch(&mut m, g, m_skin, elbow_r, hand_r, 0.038 * HEX_R, None);
    m.add_mesh(g, g_fist(), m_skin_dk).set_pos_v(hand_r);
    let jav_dir = v3(0.10, 0.86, 0.50).normalize();
    let jav_tail = add_scaled(hand_r, jav_dir, -0.030 * HEX_R);
    m.add_mesh(g, g_jav_shaft(), m_leather)
        .quat_from_unit_vectors(Y_UP, jav_dir)
        .set_pos_v(add_scaled(jav_tail, jav_dir, 0.075 * HEX_R));
    m.add_mesh(g, g_jav_tip(), m_bronze)
        .quat_from_unit_vectors(Y_UP, jav_dir)
        .set_pos_v(add_scaled(jav_tail, jav_dir, 0.150 * HEX_R + 0.021 * HEX_R));

    // PROPORZEC
    let mast_base = d.floor_y + 0.100 * HEX_R;
    m.add_mesh(g, g_mast(), m_wood).set_pos(
        0.0,
        mast_base + 0.170 * HEX_R,
        RW_FLOOR_RZ - 0.006 * HEX_R,
    );
    m.add_mesh(g, g_mast_bar(), m_wood).set_pos(
        0.0,
        mast_base + 0.350 * HEX_R,
        RW_FLOOR_RZ - 0.006 * HEX_R,
    );
    m.add_mesh(g, g_banner(), m_owner).set_pos(
        0.004 * HEX_R,
        mast_base + 0.312 * HEX_R,
        RW_FLOOR_RZ - 0.006 * HEX_R - 0.039 * HEX_R,
    );
    m
}
