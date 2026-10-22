//! Port of `render/braz-rydwan-kapadokijski-opus5.ts` (`edb8fb56`):
//! `buildRydwanKapadokijskiOpus5` (Rydwan Kapadokijski / Cappadocian Chariot).
//!
//! The lazily created `getCK*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, cn, cy, cy_open, stretch, v3, Y_UP};
use crate::geom::Vec3;
use crate::jsmath::js_cos;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── PALETA (`braz-rydwan-kapadokijski-opus5.ts:133-148`)
const CK_WOOD: u32 = 0x7a5c3a;
const CK_WOOD_DK: u32 = 0x4a3018;
const CK_WICKER: u32 = 0x9a7a48;
const CK_BRONZE: u32 = 0xcf9234;
const CK_BRONZE_LT: u32 = 0xd0a050;
const CK_LEATHER: u32 = 0x6b4a28;
const CK_LEATHER_DK: u32 = 0x53381e;
const CK_LINEN: u32 = 0xe8e0c8;
const CK_SKIN: u32 = 0xe0ac69;
const CK_SKIN_DK: u32 = 0xb07f45;
const CK_DARK: u32 = 0x20180f;
const CK_EYE: u32 = 0x140f0a;
const CK_HORSE: u32 = 0xa06c40;
const CK_HORSE_DK: u32 = 0x2a1a0a;
const CK_HOOF: u32 = 0x3a2c1e;

// ── WYMIARY (`:152-204`)
const CK_WHEEL_R: f64 = 0.098 * HEX_R;
const CK_TYRE_R: f64 = CK_WHEEL_R + 0.006 * HEX_R;
const CK_WHEEL_X: f64 = 0.245 * HEX_R;
const CK_SPOKES: u32 = 6;
const CK_BOX_W: f64 = 0.440 * HEX_R;
const CK_BOX_LEN: f64 = 0.320 * HEX_R;
const CK_BOX_ZC: f64 = -0.040 * HEX_R;
const CK_AXLE_Z: f64 = CK_BOX_ZC;
const CK_BOX_FZ: f64 = CK_BOX_ZC + CK_BOX_LEN * 0.5;
const CK_YOKE_Z: f64 = 0.430 * HEX_R;
const CK_YOKE_Y: f64 = 0.305 * HEX_R;
const CK_H_X: f64 = 0.118 * HEX_R;
const CK_H_Z: f64 = 0.360 * HEX_R;
const CK_H_LEG: f64 = 0.180 * HEX_R;
const CK_H_TORSO_H: f64 = 0.120 * HEX_R;
const CK_H_TORSO_W: f64 = 0.086 * HEX_R;
const CK_H_TORSO_L: f64 = 0.210 * HEX_R;
const CK_H_CTR_Y: f64 = CK_H_LEG + CK_H_TORSO_H * 0.5;
const CK_H_HALF_L: f64 = CK_H_TORSO_L * 0.5;
const CK_CS: f64 = 0.86;
const CK_C_TOR_W: f64 = 0.180 * CK_CS * HEX_R;
const CK_C_TOR_H: f64 = 0.205 * CK_CS * HEX_R;
const CK_C_TOR_D: f64 = 0.100 * CK_CS * HEX_R;
const CK_C_NECK_H: f64 = 0.028 * CK_CS * HEX_R;
const CK_C_HEAD_S: f64 = 0.128 * CK_CS * HEX_R;
const CK_C_SHLD_X: f64 = CK_C_TOR_W * 0.5 + 0.026 * HEX_R;
const CK_POS_DRIVER: Vec3 = Vec3::new(0.000 * HEX_R, 0.0, -0.012 * HEX_R);
const CK_POS_SPEAR: Vec3 = Vec3::new(-0.140 * HEX_R, 0.0, -0.088 * HEX_R);
const CK_POS_SHIELD: Vec3 = Vec3::new(0.140 * HEX_R, 0.0, -0.078 * HEX_R);

/// Dimensions that depend on `CK_AXLE_Y = CK_TYRE_R * Math.cos(PI / 12)`.
#[derive(Clone, Copy)]
struct Dims {
    axle_y: f64,
    floor_y: f64,
    rail_top: f64,
    tor_bot: f64,
    tor_top: f64,
    head_ctr: f64,
    head_top: f64,
    shld_y: f64,
}

impl Dims {
    fn new() -> Self {
        let axle_y = CK_TYRE_R * js_cos(PI / 12.0);
        let floor_y = axle_y + 0.030 * HEX_R;
        let rail_top = floor_y + 0.160 * HEX_R;
        let tor_bot = floor_y + 0.240 * CK_CS * HEX_R;
        let tor_top = tor_bot + CK_C_TOR_H;
        Self {
            axle_y,
            floor_y,
            rail_top,
            tor_bot,
            tor_top,
            head_ctr: tor_top + CK_C_NECK_H + CK_C_HEAD_S * 0.5,
            head_top: tor_top + CK_C_NECK_H + CK_C_HEAD_S,
            shld_y: tor_top - 0.021 * HEX_R,
        }
    }
}

// ── GEOMETRIE-SINGLETONY (`:255-298`)
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_felloe() -> Geo {
    cy_open(CK_WHEEL_R, CK_WHEEL_R, 0.026 * HEX_R, 12)
}
fn g_tyre() -> Geo {
    cy_open(CK_TYRE_R, CK_TYRE_R, 0.038 * HEX_R, 12)
}
fn g_spoke() -> Geo {
    bx(0.014 * HEX_R, CK_WHEEL_R * 1.94, 0.014 * HEX_R)
}
fn g_hub() -> Geo {
    cy(0.020 * HEX_R, 0.024 * HEX_R, 0.040 * HEX_R, 8)
}
fn g_hub_ring() -> Geo {
    cy_open(0.026 * HEX_R, 0.026 * HEX_R, 0.010 * HEX_R, 8)
}
fn g_axle() -> Geo {
    cy(0.012 * HEX_R, 0.012 * HEX_R, CK_WHEEL_X * 2.0, 6)
}
fn g_floor() -> Geo {
    bx(CK_BOX_W, 0.016 * HEX_R, CK_BOX_LEN)
}
fn g_front_pan(d: &Dims) -> Geo {
    bx(CK_BOX_W, d.rail_top - d.floor_y, 0.018 * HEX_R)
}
fn g_front_band() -> Geo {
    bx(CK_BOX_W * 0.82, 0.042 * HEX_R, 0.008 * HEX_R)
}
fn g_front_rail() -> Geo {
    bx(CK_BOX_W + 0.010 * HEX_R, 0.016 * HEX_R, 0.028 * HEX_R)
}
fn g_side_pan(d: &Dims) -> Geo {
    bx(0.016 * HEX_R, d.rail_top - d.floor_y, CK_BOX_LEN * 0.78)
}
fn g_side_rail() -> Geo {
    bx(0.024 * HEX_R, 0.016 * HEX_R, CK_BOX_LEN * 0.80)
}
fn g_stud() -> Geo {
    bx(0.016 * HEX_R, 0.016 * HEX_R, 0.008 * HEX_R)
}
fn g_yoke_bar() -> Geo {
    bx(CK_H_X * 2.0 + 0.086 * HEX_R, 0.020 * HEX_R, 0.024 * HEX_R)
}
fn g_yoke_saddle() -> Geo {
    bx(0.048 * HEX_R, 0.026 * HEX_R, 0.052 * HEX_R)
}
fn g_pole_fit() -> Geo {
    cy_open(0.019 * HEX_R, 0.019 * HEX_R, 0.030 * HEX_R, 6)
}
fn g_h_torso() -> Geo {
    bx(CK_H_TORSO_W, CK_H_TORSO_H, CK_H_TORSO_L)
}
fn g_h_rump() -> Geo {
    bx(CK_H_TORSO_W * 1.06, CK_H_TORSO_H * 0.92, 0.060 * HEX_R)
}
fn g_h_skull() -> Geo {
    bx(0.062 * HEX_R, 0.072 * HEX_R, 0.084 * HEX_R)
}
fn g_h_muzzle() -> Geo {
    bx(0.050 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_h_ear() -> Geo {
    bx(0.013 * HEX_R, 0.036 * HEX_R, 0.013 * HEX_R)
}
fn g_h_hoof() -> Geo {
    bx(0.032 * HEX_R, 0.024 * HEX_R, 0.036 * HEX_R)
}
fn g_h_eye() -> Geo {
    bx(0.010 * HEX_R, 0.010 * HEX_R, 0.008 * HEX_R)
}
fn g_h_bit() -> Geo {
    cy_open(0.009 * HEX_R, 0.009 * HEX_R, 0.052 * HEX_R, 6)
}
fn g_torso() -> Geo {
    bx(CK_C_TOR_W, CK_C_TOR_H, CK_C_TOR_D)
}
fn g_skirt() -> Geo {
    bx(CK_C_TOR_W * 1.06, 0.070 * HEX_R, CK_C_TOR_D * 1.10)
}
fn g_belt() -> Geo {
    bx(CK_C_TOR_W * 1.09, 0.028 * HEX_R, CK_C_TOR_D * 1.12)
}
fn g_sash() -> Geo {
    bx(CK_C_TOR_W * 1.24, 0.034 * HEX_R, 0.010 * HEX_R)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, CK_C_NECK_H * 1.7, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(CK_C_HEAD_S, CK_C_HEAD_S, CK_C_HEAD_S)
}
fn g_eye() -> Geo {
    bx(0.016 * HEX_R, 0.009 * HEX_R, 0.008 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.040 * HEX_R, 0.040 * HEX_R, 0.042 * HEX_R)
}
fn g_helm() -> Geo {
    cy(0.006 * HEX_R, CK_C_HEAD_S * 0.60, 0.082 * HEX_R, 8)
}
fn g_helm_rim() -> Geo {
    cy_open(CK_C_HEAD_S * 0.62, CK_C_HEAD_S * 0.62, 0.016 * HEX_R, 8)
}
fn g_cheek() -> Geo {
    bx(0.012 * HEX_R, 0.048 * HEX_R, 0.052 * HEX_R)
}
fn g_plume_top() -> Geo {
    bx(0.020 * HEX_R, 0.030 * HEX_R, 0.030 * HEX_R)
}
fn g_plume_fall() -> Geo {
    bx(0.022 * HEX_R, 0.110 * HEX_R, 0.026 * HEX_R)
}
fn g_sp_shaft() -> Geo {
    cy(0.011 * HEX_R, 0.011 * HEX_R, 0.400 * HEX_R, 6)
}
fn g_sp_tip() -> Geo {
    cn(0.019 * HEX_R, 0.062 * HEX_R, 4)
}
fn g_sp_butt() -> Geo {
    cy(0.008 * HEX_R, 0.013 * HEX_R, 0.030 * HEX_R, 5)
}
fn g_sp_collar() -> Geo {
    cy_open(0.014 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R, 6)
}
fn g_fig8_shell() -> Geo {
    cy(0.092 * HEX_R, 0.092 * HEX_R, 0.024 * HEX_R, 10)
}
fn g_fig8_face() -> Geo {
    cy(0.076 * HEX_R, 0.076 * HEX_R, 0.012 * HEX_R, 10)
}

/// `CKMats` (`:305-312`).
#[derive(Clone, Copy)]
struct Mats {
    wood: MatId,
    wood_dk: MatId,
    wicker: MatId,
    bronze: MatId,
    bronze_lt: MatId,
    leather: MatId,
    leather_dk: MatId,
    linen: MatId,
    skin: MatId,
    skin_dk: MatId,
    dark: MatId,
    eye: MatId,
    horse: MatId,
    horse_dk: MatId,
    hoof: MatId,
    owner: MatId,
}

/// `ckStretch(parent, mtl, A, B, w, d)` (`:318-332`).
#[allow(clippy::too_many_arguments)]
fn ck_stretch(
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

/// `ckWheel` (`:339-376`).
fn ck_wheel(m: &mut UnitModel, g: NodeId, d: &Dims, sx: f64, mm: &Mats) {
    let x = sx * CK_WHEEL_X;
    m.add_mesh(g, g_felloe(), mm.wood)
        .rot_z(PI / 2.0)
        .set_pos(x, d.axle_y, CK_AXLE_Z);
    m.add_mesh(g, g_tyre(), mm.leather_dk)
        .rot_z(PI / 2.0)
        .set_pos(x, d.axle_y, CK_AXLE_Z);
    for i in 0..CK_SPOKES / 2 {
        m.add_mesh(g, g_spoke(), mm.wood)
            .rot_z(PI / 2.0)
            .rot_x((f64::from(i) * PI) / f64::from(CK_SPOKES / 2))
            .set_pos(x, d.axle_y, CK_AXLE_Z);
    }
    m.add_mesh(g, g_hub(), mm.wood)
        .rot_z(-sx * PI / 2.0)
        .set_pos(x + sx * 0.013 * HEX_R, d.axle_y, CK_AXLE_Z);
    m.add_mesh(g, g_hub_ring(), mm.bronze)
        .rot_z(PI / 2.0)
        .set_pos(x + sx * 0.020 * HEX_R, d.axle_y, CK_AXLE_Z);
}

/// `ckHorse` (`:385-480`): returns the bit point.
#[allow(clippy::too_many_lines)]
fn ck_horse(m: &mut UnitModel, g: NodeId, sx: f64, mm: &Mats) -> Vec3 {
    let x = sx * CK_H_X;
    let front_z = CK_H_Z + CK_H_HALF_L;
    let rear_z = CK_H_Z - CK_H_HALF_L;
    m.add_mesh(g, g_h_torso(), mm.horse)
        .set_pos(x, CK_H_CTR_Y, CK_H_Z);
    m.add_mesh(g, g_h_rump(), mm.horse).set_pos(
        x,
        CK_H_CTR_Y + 0.006 * HEX_R,
        rear_z - 0.018 * HEX_R,
    );
    let leg_top_y = CK_H_CTR_Y - CK_H_TORSO_H * 0.5;
    for (lz, tilt) in [
        (front_z - 0.036 * HEX_R, 0.030),
        (rear_z + 0.032 * HEX_R, -0.034),
    ] {
        for lx in [-0.026, 0.026] {
            let top = v3(x + lx * HEX_R, leg_top_y, lz);
            let bot = v3(x + lx * HEX_R, 0.016 * HEX_R, lz + tilt * HEX_R);
            ck_stretch(m, g, mm.horse, top, bot, 0.028 * HEX_R, Some(0.032 * HEX_R));
            m.add_mesh(g, g_h_hoof(), mm.hoof).set_pos(
                x + lx * HEX_R,
                0.014 * HEX_R,
                lz + tilt * HEX_R,
            );
        }
    }
    let neck_a = v3(x, CK_H_CTR_Y + CK_H_TORSO_H * 0.34, front_z - 0.012 * HEX_R);
    let neck_b = v3(x, CK_H_CTR_Y + 0.098 * HEX_R, front_z + 0.040 * HEX_R);
    let neck_c = v3(x, CK_H_CTR_Y + 0.128 * HEX_R, front_z + 0.070 * HEX_R);
    ck_stretch(
        m,
        g,
        mm.horse,
        neck_a,
        neck_b,
        0.046 * HEX_R,
        Some(0.052 * HEX_R),
    );
    ck_stretch(
        m,
        g,
        mm.horse,
        neck_b,
        neck_c,
        0.038 * HEX_R,
        Some(0.044 * HEX_R),
    );
    ck_stretch(
        m,
        g,
        mm.horse_dk,
        neck_a.plus(v3(0.0, 0.022 * HEX_R, -0.014 * HEX_R)),
        neck_c.plus(v3(0.0, 0.018 * HEX_R, -0.012 * HEX_R)),
        0.030 * HEX_R,
        Some(0.030 * HEX_R),
    );
    let head_c = neck_c.plus(v3(0.0, -0.022 * HEX_R, 0.048 * HEX_R));
    m.add_mesh(g, g_h_skull(), mm.horse)
        .rot_x(0.42)
        .set_pos_v(head_c);
    m.add_mesh(g, g_h_muzzle(), mm.horse_dk)
        .set_pos_v(head_c.plus(v3(0.0, -0.034 * HEX_R, 0.038 * HEX_R)));
    m.add_mesh(g, g_h_bit(), mm.leather_dk)
        .rot_z(PI / 2.0)
        .set_pos_v(head_c.plus(v3(0.0, -0.010 * HEX_R, 0.030 * HEX_R)));
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_h_ear(), mm.horse_dk)
            .rot_z(s * 0.28)
            .set_pos_v(head_c.plus(v3(s * 0.024 * HEX_R, 0.052 * HEX_R, -0.026 * HEX_R)));
        m.add_mesh(g, g_h_eye(), mm.eye).set_pos_v(head_c.plus(v3(
            s * 0.031 * HEX_R,
            0.006 * HEX_R,
            0.024 * HEX_R,
        )));
    }
    let bit_p = head_c.plus(v3(0.0, -0.030 * HEX_R, 0.032 * HEX_R));
    m.add_mesh(g, g_h_bit(), mm.bronze)
        .rot_z(PI / 2.0)
        .set_pos_v(bit_p);
    let tail_a = v3(x, CK_H_CTR_Y + CK_H_TORSO_H * 0.34, rear_z - 0.034 * HEX_R);
    ck_stretch(
        m,
        g,
        mm.horse_dk,
        tail_a,
        tail_a.plus(v3(0.0, -0.120 * HEX_R, -0.026 * HEX_R)),
        0.020 * HEX_R,
        None,
    );
    ck_stretch(
        m,
        g,
        mm.leather_dk,
        v3(
            x - CK_H_TORSO_W * 0.5,
            CK_H_CTR_Y + 0.010 * HEX_R,
            front_z - 0.004 * HEX_R,
        ),
        v3(
            x + CK_H_TORSO_W * 0.5,
            CK_H_CTR_Y + 0.010 * HEX_R,
            front_z - 0.004 * HEX_R,
        ),
        0.014 * HEX_R,
        Some(0.016 * HEX_R),
    );
    ck_stretch(
        m,
        g,
        mm.leather_dk,
        v3(x - CK_H_TORSO_W * 0.52, CK_H_CTR_Y, CK_H_Z + 0.010 * HEX_R),
        v3(x + CK_H_TORSO_W * 0.52, CK_H_CTR_Y, CK_H_Z + 0.010 * HEX_R),
        0.012 * HEX_R,
        Some(CK_H_TORSO_H * 0.92),
    );
    bit_p
}

/// `ckCrewman` (`:493-560`): returns `(shldL, shldR)`.
#[allow(clippy::too_many_lines)]
fn ck_crewman(
    m: &mut UnitModel,
    g: NodeId,
    d: &Dims,
    mm: &Mats,
    at: Vec3,
    plume: bool,
) -> (Vec3, Vec3) {
    let (xx, zz) = (at.x, at.z);
    m.add_mesh(g, g_torso(), mm.linen)
        .set_pos(xx, d.tor_bot + CK_C_TOR_H * 0.5, zz);
    m.add_mesh(g, g_skirt(), mm.linen)
        .set_pos(xx, d.tor_bot - 0.020 * HEX_R, zz);
    m.add_mesh(g, g_belt(), mm.leather_dk)
        .set_pos(xx, d.tor_bot + 0.016 * HEX_R, zz);
    m.add_mesh(g, g_sash(), mm.owner).rot_z(0.62).set_pos(
        xx,
        d.tor_bot + CK_C_TOR_H * 0.55,
        zz + CK_C_TOR_D * 0.5 + 0.004 * HEX_R,
    );
    m.add_mesh(g, g_neck(), mm.skin)
        .set_pos(xx, d.tor_top + CK_C_NECK_H * 0.5, zz);
    m.add_mesh(g, g_head(), mm.skin).set_pos(xx, d.head_ctr, zz);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), mm.eye).set_pos(
            xx + s * 0.024 * HEX_R,
            d.head_ctr + 0.006 * HEX_R,
            zz + CK_C_HEAD_S * 0.5 + 0.001 * HEX_R,
        );
    }
    m.add_mesh(g, g_helm(), mm.bronze)
        .set_pos(xx, d.head_top + 0.020 * HEX_R, zz);
    m.add_mesh(g, g_helm_rim(), mm.bronze_lt)
        .set_pos(xx, d.head_ctr + CK_C_HEAD_S * 0.34, zz);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_cheek(), mm.bronze).set_pos(
            xx + s * (CK_C_HEAD_S * 0.5 + 0.004 * HEX_R),
            d.head_ctr - 0.012 * HEX_R,
            zz + 0.010 * HEX_R,
        );
    }
    if plume {
        m.add_mesh(g, g_plume_top(), mm.dark).set_pos(
            xx,
            d.head_top + 0.070 * HEX_R,
            zz - 0.004 * HEX_R,
        );
        m.add_mesh(g, g_plume_fall(), mm.dark).rot_x(-2.30).set_pos(
            xx,
            d.head_top + 0.020 * HEX_R,
            zz - 0.064 * HEX_R,
        );
    }
    (
        v3(xx + CK_C_SHLD_X, d.shld_y, zz),
        v3(xx - CK_C_SHLD_X, d.shld_y, zz),
    )
}

/// `ckArm` (`:563-572`).
fn ck_arm(m: &mut UnitModel, g: NodeId, mm: &Mats, shld: Vec3, hand: Vec3, bow: Vec3) {
    let elbow = shld.lerp(hand, 0.52).plus(bow);
    ck_stretch(m, g, mm.skin, shld, elbow, 0.046 * HEX_R, None);
    ck_stretch(m, g, mm.skin, elbow, hand, 0.036 * HEX_R, None);
    m.add_mesh(g, g_fist(), mm.skin_dk).set_pos_v(hand);
}

/// `buildRydwanKapadokijskiOpus5(ownerColor)` (`braz-rydwan-kapadokijski-opus5.ts:582-750`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_rydwan_kapadokijski_opus5(owner: u32) -> UnitModel {
    let d = Dims::new();
    let mut m = UnitModel::new();
    let g = ROOT;
    let mm = Mats {
        wood: m.mat(CK_WOOD, 0.06, 0.82),
        wood_dk: m.mat(CK_WOOD_DK, 0.04, 0.88),
        wicker: m.mat(CK_WICKER, 0.05, 0.86),
        bronze: m.mat(CK_BRONZE, 0.42, 0.46),
        bronze_lt: m.mat(CK_BRONZE_LT, 0.58, 0.34),
        leather: m.mat(CK_LEATHER, 0.05, 0.86),
        leather_dk: m.mat(CK_LEATHER_DK, 0.05, 0.88),
        linen: m.mat(CK_LINEN, 0.05, 0.84),
        skin: m.mat(CK_SKIN, 0.05, 0.80),
        skin_dk: m.mat(CK_SKIN_DK, 0.05, 0.84),
        dark: m.mat(CK_DARK, 0.05, 0.88),
        eye: m.mat(CK_EYE, 0.05, 0.86),
        horse: m.mat(CK_HORSE, 0.05, 0.84),
        horse_dk: m.mat(CK_HORSE_DK, 0.04, 0.90),
        hoof: m.mat(CK_HOOF, 0.10, 0.70),
        owner: m.mat(owner, 0.14, 0.64),
    };

    for sx in [-1.0, 1.0] {
        ck_wheel(&mut m, g, &d, sx, &mm);
    }
    m.add_mesh(g, g_axle(), mm.wood_dk)
        .rot_z(PI / 2.0)
        .set_pos(0.0, d.axle_y, CK_AXLE_Z);

    // PLATFORMA
    m.add_mesh(g, g_floor(), mm.wood)
        .set_pos(0.0, d.floor_y, CK_BOX_ZC);
    let pan_cy = d.floor_y + (d.rail_top - d.floor_y) * 0.5;
    m.add_mesh(g, g_front_pan(&d), mm.wicker)
        .set_pos(0.0, pan_cy, CK_BOX_FZ);
    m.add_mesh(g, g_front_band(), mm.owner).set_pos(
        0.0,
        d.floor_y + 0.062 * HEX_R,
        CK_BOX_FZ + 0.012 * HEX_R,
    );
    m.add_mesh(g, g_front_rail(), mm.bronze_lt)
        .set_pos(0.0, d.rail_top, CK_BOX_FZ);
    for dx in [-0.150, -0.050, 0.050, 0.150] {
        m.add_mesh(g, g_stud(), mm.bronze).set_pos(
            dx * HEX_R,
            d.floor_y + 0.122 * HEX_R,
            CK_BOX_FZ + 0.011 * HEX_R,
        );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_side_pan(&d), mm.wicker).set_pos(
            sx * CK_BOX_W * 0.5,
            pan_cy,
            CK_BOX_ZC + CK_BOX_LEN * 0.10,
        );
        m.add_mesh(g, g_side_rail(), mm.wood).set_pos(
            sx * CK_BOX_W * 0.5,
            d.rail_top,
            CK_BOX_ZC + CK_BOX_LEN * 0.09,
        );
    }

    // DYSZEL + JARZMO
    let pole_a = v3(0.0, d.floor_y + 0.012 * HEX_R, CK_BOX_FZ - 0.010 * HEX_R);
    let pole_b = v3(0.0, CK_YOKE_Y, CK_YOKE_Z);
    ck_stretch(&mut m, g, mm.wood, pole_a, pole_b, 0.022 * HEX_R, None);
    m.add_mesh(g, g_pole_fit(), mm.bronze)
        .rot_x(PI / 2.0)
        .set_pos_v(pole_b);
    m.add_mesh(g, g_yoke_bar(), mm.wood_dk)
        .set_pos(0.0, CK_YOKE_Y, CK_YOKE_Z);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_yoke_saddle(), mm.leather).set_pos(
            s * CK_H_X,
            CK_YOKE_Y - 0.018 * HEX_R,
            CK_YOKE_Z,
        );
    }

    // KONIE
    let bit_xneg = ck_horse(&mut m, g, -1.0, &mm);
    let bit_xpos = ck_horse(&mut m, g, 1.0, &mm);

    // (a) WOŹNICA
    let (drv_l, drv_r) = ck_crewman(&mut m, g, &d, &mm, CK_POS_DRIVER, false);
    let drv_hand_l = v3(
        CK_POS_DRIVER.x + 0.082 * HEX_R,
        d.shld_y - 0.100 * HEX_R,
        CK_POS_DRIVER.z + 0.100 * HEX_R,
    );
    let drv_hand_r = v3(
        CK_POS_DRIVER.x - 0.082 * HEX_R,
        d.shld_y - 0.100 * HEX_R,
        CK_POS_DRIVER.z + 0.100 * HEX_R,
    );
    ck_arm(
        &mut m,
        g,
        &mm,
        drv_l,
        drv_hand_l,
        v3(0.016 * HEX_R, -0.006 * HEX_R, 0.0),
    );
    ck_arm(
        &mut m,
        g,
        &mm,
        drv_r,
        drv_hand_r,
        v3(-0.016 * HEX_R, -0.006 * HEX_R, 0.0),
    );
    ck_stretch(
        &mut m,
        g,
        mm.leather_dk,
        drv_hand_l,
        bit_xpos,
        0.009 * HEX_R,
        None,
    );
    ck_stretch(
        &mut m,
        g,
        mm.leather_dk,
        drv_hand_r,
        bit_xneg,
        0.009 * HEX_R,
        None,
    );

    // (b) WOJOWNIK
    let (war_l, war_r) = ck_crewman(&mut m, g, &d, &mm, CK_POS_SPEAR, true);
    let grip_w = v3(
        CK_POS_SPEAR.x - 0.062 * HEX_R,
        d.shld_y - 0.060 * HEX_R,
        CK_POS_SPEAR.z + 0.030 * HEX_R,
    );
    ck_arm(
        &mut m,
        g,
        &mm,
        war_r,
        grip_w,
        v3(-0.024 * HEX_R, -0.014 * HEX_R, 0.0),
    );
    let brace_w = v3(
        CK_POS_SPEAR.x + 0.048 * HEX_R,
        d.rail_top + 0.012 * HEX_R,
        CK_BOX_FZ - 0.030 * HEX_R,
    );
    ck_arm(
        &mut m,
        g,
        &mm,
        war_l,
        brace_w,
        v3(0.026 * HEX_R, -0.030 * HEX_R, 0.0),
    );
    let sp_dir = v3(-0.300, 0.930, -0.200).normalize();
    m.add_mesh(g, g_sp_shaft(), mm.wood)
        .quat_from_unit_vectors(Y_UP, sp_dir)
        .set_pos_v(add_scaled(grip_w, sp_dir, 0.070 * HEX_R));
    m.add_mesh(g, g_sp_collar(), mm.bronze)
        .quat_from_unit_vectors(Y_UP, sp_dir)
        .set_pos_v(add_scaled(grip_w, sp_dir, 0.258 * HEX_R));
    m.add_mesh(g, g_sp_tip(), mm.bronze_lt)
        .quat_from_unit_vectors(Y_UP, sp_dir)
        .set_pos_v(add_scaled(grip_w, sp_dir, 0.300 * HEX_R));
    m.add_mesh(g, g_sp_butt(), mm.bronze)
        .quat_from_unit_vectors(Y_UP, sp_dir)
        .set_pos_v(add_scaled(grip_w, sp_dir, -0.142 * HEX_R));

    // (c) TARCZOWNIK
    let (shb_l, shb_r) = ck_crewman(&mut m, g, &d, &mm, CK_POS_SHIELD, true);
    let sh_x = 0.132 * HEX_R;
    let sh_y = d.floor_y + 0.300 * HEX_R;
    let sh_z = CK_BOX_FZ + 0.046 * HEX_R;
    let shield_g = m.add_group(g);
    m.node(shield_g).set_pos(sh_x, sh_y, sh_z).rot_y(-0.34);
    for dy in [0.086, -0.086] {
        m.add_mesh(shield_g, g_fig8_shell(), mm.leather)
            .rot_x(PI / 2.0)
            .set_pos(0.0, dy * HEX_R, 0.0);
        m.add_mesh(shield_g, g_fig8_face(), mm.owner)
            .rot_x(PI / 2.0)
            .set_pos(0.0, dy * HEX_R, 0.014 * HEX_R);
    }
    ck_stretch(
        &mut m,
        shield_g,
        mm.leather_dk,
        v3(0.0, -0.090 * HEX_R, 0.006 * HEX_R),
        v3(0.0, 0.090 * HEX_R, 0.006 * HEX_R),
        0.044 * HEX_R,
        Some(0.020 * HEX_R),
    );
    let grip_s = v3(
        sh_x + 0.020 * HEX_R,
        sh_y + 0.010 * HEX_R,
        sh_z - 0.048 * HEX_R,
    );
    ck_arm(
        &mut m,
        g,
        &mm,
        shb_l,
        grip_s,
        v3(0.028 * HEX_R, -0.026 * HEX_R, 0.010 * HEX_R),
    );
    let brace_s = v3(
        CK_POS_SHIELD.x - 0.030 * HEX_R,
        d.shld_y - 0.070 * HEX_R,
        CK_POS_SHIELD.z + 0.062 * HEX_R,
    );
    ck_arm(
        &mut m,
        g,
        &mm,
        shb_r,
        brace_s,
        v3(-0.022 * HEX_R, -0.014 * HEX_R, 0.0),
    );
    m
}
