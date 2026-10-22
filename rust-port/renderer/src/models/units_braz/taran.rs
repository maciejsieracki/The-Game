//! Port of `render/braz-taran-opus5.ts` (`edb8fb56`):
//! `buildTaranOkutyOpus5` (Taran okuty / Bronze-Shod Ram).
//!
//! The lazily created `getBT*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{bx, cy, cy_open};
use crate::jsmath::js_cos;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`braz-taran-opus5.ts:98-108`)
const BT_WOOD: u32 = 0x7a5c3a;
const BT_WOOD_DK: u32 = 0x4a3018;
const BT_LOG: u32 = 0x6d5232;
const BT_LOG_DK: u32 = 0x513d24;
const BT_BRONZE: u32 = 0xbe8b3e;
const BT_BRONZE_DK: u32 = 0x8a5f28;
const BT_HIDE_A: u32 = 0x9a6a42;
const BT_HIDE_B: u32 = 0x7a5232;
const BT_LEATHER: u32 = 0x6b4a28;
const BT_ROPE: u32 = 0x9a8060;
const BT_LASH: u32 = 0xb09a72;

// ── wymiary wiodące (`:111-121`)
const BT_WHEEL_R: f64 = 0.058 * HEX_R;
const BT_TYRE_R: f64 = BT_WHEEL_R + 0.005 * HEX_R;
fn bt_axle_y() -> f64 {
    BT_TYRE_R * js_cos(PI / 10.0)
}
const BT_WHEEL_X: f64 = 0.130 * HEX_R;
const BT_AXLE_ZF: f64 = 0.152 * HEX_R;
const BT_AXLE_ZR: f64 = -0.164 * HEX_R;
const BT_LOG_Y: f64 = 0.268 * HEX_R;

// ── geometrie-singletony (`:162-198`)
fn g_wheel() -> Geo {
    cy(BT_WHEEL_R, BT_WHEEL_R, 0.026 * HEX_R, 10)
}
fn g_tyre() -> Geo {
    cy_open(BT_TYRE_R, BT_TYRE_R, 0.030 * HEX_R, 10)
}
fn g_nave() -> Geo {
    cy(0.016 * HEX_R, 0.021 * HEX_R, 0.030 * HEX_R, 6)
}
fn g_nave_ring() -> Geo {
    cy_open(0.023 * HEX_R, 0.023 * HEX_R, 0.010 * HEX_R, 6)
}
fn g_seam() -> Geo {
    bx(0.007 * HEX_R, 0.100 * HEX_R, 0.009 * HEX_R)
}
fn g_axle() -> Geo {
    cy(0.011 * HEX_R, 0.011 * HEX_R, 0.276 * HEX_R, 6)
}
fn g_rail() -> Geo {
    bx(0.036 * HEX_R, 0.032 * HEX_R, 0.396 * HEX_R)
}
fn g_cross() -> Geo {
    bx(0.296 * HEX_R, 0.024 * HEX_R, 0.030 * HEX_R)
}
fn g_bracket() -> Geo {
    bx(0.048 * HEX_R, 0.040 * HEX_R, 0.014 * HEX_R)
}
fn g_lash() -> Geo {
    cy_open(0.026 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R, 6)
}
fn g_lash_sm() -> Geo {
    cy_open(0.020 * HEX_R, 0.020 * HEX_R, 0.016 * HEX_R, 6)
}
fn g_collar() -> Geo {
    cy_open(0.030 * HEX_R, 0.030 * HEX_R, 0.014 * HEX_R, 6)
}
fn g_leg() -> Geo {
    bx(0.030 * HEX_R, 0.290 * HEX_R, 0.030 * HEX_R)
}
fn g_ridge() -> Geo {
    bx(0.036 * HEX_R, 0.034 * HEX_R, 0.340 * HEX_R)
}
fn g_brace() -> Geo {
    bx(0.020 * HEX_R, 0.020 * HEX_R, 0.290 * HEX_R)
}
fn g_log_a() -> Geo {
    cy(0.036 * HEX_R, 0.030 * HEX_R, 0.198 * HEX_R, 8)
}
fn g_log_b() -> Geo {
    cy(0.047 * HEX_R, 0.036 * HEX_R, 0.190 * HEX_R, 8)
}
fn g_band() -> Geo {
    cy_open(0.042 * HEX_R, 0.042 * HEX_R, 0.014 * HEX_R, 8)
}
fn g_head() -> Geo {
    cy(0.052 * HEX_R, 0.038 * HEX_R, 0.060 * HEX_R, 10)
}
fn g_head_ring() -> Geo {
    cy_open(0.049 * HEX_R, 0.049 * HEX_R, 0.016 * HEX_R, 10)
}
fn g_langet_h() -> Geo {
    bx(0.022 * HEX_R, 0.009 * HEX_R, 0.086 * HEX_R)
}
fn g_langet_v() -> Geo {
    bx(0.009 * HEX_R, 0.022 * HEX_R, 0.086 * HEX_R)
}
fn g_cradle() -> Geo {
    cy_open(0.044 * HEX_R, 0.044 * HEX_R, 0.022 * HEX_R, 8)
}
fn g_rope() -> Geo {
    bx(0.010 * HEX_R, 0.104 * HEX_R, 0.010 * HEX_R)
}
fn g_post() -> Geo {
    bx(0.024 * HEX_R, 0.286 * HEX_R, 0.024 * HEX_R)
}
fn g_roof() -> Geo {
    bx(0.196 * HEX_R, 0.014 * HEX_R, 0.176 * HEX_R)
}
fn g_roof_rdg() -> Geo {
    bx(0.034 * HEX_R, 0.028 * HEX_R, 0.356 * HEX_R)
}
fn g_batten() -> Geo {
    cy(0.008 * HEX_R, 0.008 * HEX_R, 0.190 * HEX_R, 5)
}
fn g_drape() -> Geo {
    bx(0.220 * HEX_R, 0.086 * HEX_R, 0.012 * HEX_R)
}
fn g_side_flap() -> Geo {
    bx(0.012 * HEX_R, 0.062 * HEX_R, 0.160 * HEX_R)
}
fn g_pole() -> Geo {
    bx(0.020 * HEX_R, 0.020 * HEX_R, 0.170 * HEX_R)
}
fn g_pole_bar() -> Geo {
    bx(0.130 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)
}
fn g_handle() -> Geo {
    cy(0.012 * HEX_R, 0.014 * HEX_R, 0.120 * HEX_R, 6)
}
fn g_mast() -> Geo {
    bx(0.013 * HEX_R, 0.104 * HEX_R, 0.013 * HEX_R)
}
fn g_banner() -> Geo {
    bx(0.088 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)
}
fn g_banner_bar() -> Geo {
    bx(0.098 * HEX_R, 0.010 * HEX_R, 0.010 * HEX_R)
}
fn g_panel() -> Geo {
    bx(0.010 * HEX_R, 0.086 * HEX_R, 0.150 * HEX_R)
}

/// Lashing axis of `btLashing` (`'x'` is never passed in this file).
#[derive(Clone, Copy)]
#[allow(dead_code)]
enum Axis {
    X,
    Y,
    Z,
}

/// `btLashing(group, m, x, y, z, axis, small)` (`:201-210`).
#[allow(clippy::too_many_arguments)]
fn bt_lashing(
    m: &mut UnitModel,
    g: NodeId,
    mt: MatId,
    x: f64,
    y: f64,
    z: f64,
    axis: Axis,
    small: bool,
) {
    let n = m.add_mesh(g, if small { g_lash_sm() } else { g_lash() }, mt);
    match axis {
        Axis::X => {
            n.rot_z(PI / 2.0);
        }
        Axis::Z => {
            n.rot_x(PI / 2.0);
        }
        Axis::Y => {}
    }
    n.set_pos(x * HEX_R, y * HEX_R, z * HEX_R);
}

/// `btWheel(group, sx, z, mWood, mSeam, mTyre, mBronze)` (`:217-247`).
#[allow(clippy::too_many_arguments)]
fn bt_wheel(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    z: f64,
    m_wood: MatId,
    m_seam: MatId,
    m_tyre: MatId,
    m_bronze: MatId,
) {
    let axle_y = bt_axle_y();
    let x = sx * BT_WHEEL_X;
    m.add_mesh(g, g_wheel(), m_wood)
        .rot_z(PI / 2.0)
        .set_pos(x, axle_y, z);
    m.add_mesh(g, g_tyre(), m_tyre)
        .rot_z(PI / 2.0)
        .set_pos(x, axle_y, z);
    for dz in [-0.026, 0.026] {
        m.add_mesh(g, g_seam(), m_seam)
            .set_pos(x + sx * 0.016 * HEX_R, axle_y, z + dz * HEX_R);
    }
    m.add_mesh(g, g_nave(), m_wood)
        .rot_z(-sx * PI / 2.0)
        .set_pos(x + sx * 0.026 * HEX_R, axle_y, z);
    m.add_mesh(g, g_nave_ring(), m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(x + sx * 0.017 * HEX_R, axle_y, z);
}

/// `buildTaranOkutyOpus5(ownerColor)` (`braz-taran-opus5.ts:257-475`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_taran_okuty_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(BT_WOOD, 0.06, 0.82);
    let m_dk_wood = m.mat(BT_WOOD_DK, 0.04, 0.88);
    let m_log = m.mat(BT_LOG, 0.05, 0.86);
    let m_log_dk = m.mat(BT_LOG_DK, 0.04, 0.90);
    let m_bronze = m.mat(BT_BRONZE, 0.62, 0.38);
    let m_bronz_d = m.mat(BT_BRONZE_DK, 0.55, 0.46);
    let m_hide_a = m.mat(BT_HIDE_A, 0.04, 0.92);
    let m_hide_b = m.mat(BT_HIDE_B, 0.04, 0.92);
    let m_leath = m.mat(BT_LEATHER, 0.05, 0.88);
    let m_rope = m.mat(BT_ROPE, 0.04, 0.90);
    let m_lash = m.mat(BT_LASH, 0.03, 0.92);
    let m_owner = m.mat(owner, 0.12, 0.70);
    let axle_y = bt_axle_y();

    // ZESPÓŁ JEZDNY
    for z in [BT_AXLE_ZF, BT_AXLE_ZR] {
        for sx in [-1.0, 1.0] {
            bt_wheel(&mut m, g, sx, z, m_wood, m_dk_wood, m_leath, m_bronze);
        }
        m.add_mesh(g, g_axle(), m_dk_wood)
            .rot_z(PI / 2.0)
            .set_pos(0.0, axle_y, z);
    }

    // RAMA
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_rail(), m_wood)
            .set_pos(sx * 0.126 * HEX_R, 0.086 * HEX_R, -0.006 * HEX_R);
    }
    for cz in [-0.176, -0.012, 0.146] {
        m.add_mesh(g, g_cross(), m_wood)
            .set_pos(0.0, 0.114 * HEX_R, cz * HEX_R);
    }
    for sx in [-1.0, 1.0] {
        bt_lashing(&mut m, g, m_lash, sx * 0.126, 0.108, -0.012, Axis::Y, true);
        for cz in [-0.176, 0.146] {
            m.add_mesh(g, g_bracket(), m_bronze).set_pos(
                sx * 0.126 * HEX_R,
                0.098 * HEX_R,
                cz * HEX_R,
            );
        }
    }

    // KOZIOŁ
    for sz in [-0.126, 0.110] {
        for s in [-1.0, 1.0] {
            m.add_mesh(g, g_leg(), m_wood).rot_z(-s * 0.44).set_pos(
                s * 0.062 * HEX_R,
                0.258 * HEX_R,
                sz * HEX_R,
            );
            bt_lashing(&mut m, g, m_lash, s * 0.124, 0.134, sz, Axis::Y, true);
        }
        bt_lashing(&mut m, g, m_lash, 0.0, 0.390, sz, Axis::Z, false);
        m.add_mesh(g, g_collar(), m_bronz_d)
            .rot_x(PI / 2.0)
            .set_pos(0.0, 0.390 * HEX_R, sz * HEX_R);
    }
    m.add_mesh(g, g_ridge(), m_dk_wood)
        .set_pos(0.0, 0.404 * HEX_R, -0.008 * HEX_R);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_brace(), m_wood).rot_x(0.52).set_pos(
            s * 0.096 * HEX_R,
            0.252 * HEX_R,
            -0.010 * HEX_R,
        );
    }

    // KŁODA OCIOSANA
    m.add_mesh(g, g_log_a(), m_log)
        .rot_x(PI / 2.0)
        .set_pos(0.0, BT_LOG_Y, -0.072 * HEX_R);
    m.add_mesh(g, g_log_b(), m_log)
        .rot_x(PI / 2.0)
        .set_pos(0.0, BT_LOG_Y, 0.122 * HEX_R);
    m.add_mesh(g, g_log_a(), m_log_dk)
        .rot_x(PI / 2.0)
        .set_scale(0.98, 1.0, 0.42)
        .set_pos(0.0, BT_LOG_Y - 0.020 * HEX_R, -0.072 * HEX_R);
    for (dz, sc) in [(-0.030, 0.92), (0.078, 1.06)] {
        m.add_mesh(g, g_band(), m_bronz_d)
            .rot_x(PI / 2.0)
            .set_scale(sc, 1.0, sc)
            .set_pos(0.0, BT_LOG_Y, dz * HEX_R);
    }

    // GŁOWICA OKUTA BRĄZEM
    m.add_mesh(g, g_head(), m_bronze)
        .rot_x(-PI / 2.0)
        .set_pos(0.0, BT_LOG_Y, 0.232 * HEX_R);
    m.add_mesh(g, g_head_ring(), m_bronz_d)
        .rot_x(PI / 2.0)
        .set_pos(0.0, BT_LOG_Y, 0.196 * HEX_R);
    for sy in [-1.0, 1.0] {
        m.add_mesh(g, g_langet_h(), m_bronze).set_pos(
            0.0,
            BT_LOG_Y + sy * 0.042 * HEX_R,
            0.152 * HEX_R,
        );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_langet_v(), m_bronze)
            .set_pos(sx * 0.042 * HEX_R, BT_LOG_Y, 0.152 * HEX_R);
    }

    // ZAWIESIE
    for cz in [-0.080, 0.094] {
        m.add_mesh(g, g_cradle(), m_leath)
            .rot_x(PI / 2.0)
            .set_pos(0.0, BT_LOG_Y, cz * HEX_R);
    }
    for (rz, tilt) in [(-0.092, 0.30), (0.006, 0.38), (0.104, 0.46)] {
        for s in [-1.0, 1.0] {
            m.add_mesh(g, g_rope(), m_rope)
                .rot_x(tilt)
                .rot_z(s * 0.10)
                .set_pos(s * 0.014 * HEX_R, 0.348 * HEX_R, (rz + 0.014) * HEX_R);
        }
    }
    for dz in [-0.130, 0.030] {
        m.add_mesh(g, g_band(), m_owner)
            .rot_x(PI / 2.0)
            .set_scale(0.94, 1.0, 0.94)
            .set_pos(0.0, BT_LOG_Y, dz * HEX_R);
    }

    // PRZENOŚNY DASZEK ZE SKÓR
    for sx in [-0.146, 0.146] {
        for sz in [-0.144, 0.138] {
            m.add_mesh(g, g_post(), m_wood)
                .set_pos(sx * HEX_R, 0.270 * HEX_R, sz * HEX_R);
            bt_lashing(&mut m, g, m_lash, sx, 0.418, sz, Axis::Y, true);
        }
    }
    for s in [-1.0, 1.0] {
        for sz in [-0.084, 0.084] {
            let hide = if s * sz > 0.0 { m_hide_a } else { m_hide_b };
            m.add_mesh(g, g_roof(), hide).rot_z(-s * 0.520).set_pos(
                s * 0.086 * HEX_R,
                0.470 * HEX_R,
                sz * HEX_R,
            );
        }
        m.add_mesh(g, g_batten(), m_log_dk)
            .rot_z(PI / 2.0 - s * 0.520)
            .set_pos(s * 0.086 * HEX_R, 0.478 * HEX_R, 0.0);
    }
    m.add_mesh(g, g_roof_rdg(), m_dk_wood)
        .set_pos(0.0, 0.522 * HEX_R, 0.0);
    m.add_mesh(g, g_drape(), m_hide_b)
        .rot_x(0.16)
        .set_pos(0.0, 0.394 * HEX_R, -0.170 * HEX_R);
    m.add_mesh(g, g_drape(), m_hide_a)
        .rot_x(-0.16)
        .set_scale(0.92, 0.52, 1.0)
        .set_pos(0.0, 0.414 * HEX_R, 0.176 * HEX_R);
    m.add_mesh(g, g_side_flap(), m_hide_b)
        .set_pos(-0.152 * HEX_R, 0.390 * HEX_R, -0.012 * HEX_R);

    // DYSZEL + DRĄGI
    m.add_mesh(g, g_pole(), m_wood)
        .rot_x(0.24)
        .set_pos(0.0, 0.098 * HEX_R, 0.244 * HEX_R);
    // 0.318 is the web literal (`braz-taran-opus5.ts`), not 1/π.
    #[allow(clippy::approx_constant)]
    m.add_mesh(g, g_pole_bar(), m_wood)
        .set_pos(0.0, 0.078 * HEX_R, 0.318 * HEX_R);
    bt_lashing(&mut m, g, m_lash, 0.0, 0.114, 0.166, Axis::Y, true);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_handle(), m_wood).rot_x(-0.50).set_pos(
            s * 0.100 * HEX_R,
            0.180 * HEX_R,
            -0.204 * HEX_R,
        );
        bt_lashing(&mut m, g, m_lash, s * 0.100, 0.132, -0.182, Axis::Y, true);
    }

    // KOLOR GRACZA
    m.add_mesh(g, g_mast(), m_wood)
        .set_pos(0.0, 0.588 * HEX_R, -0.156 * HEX_R);
    m.add_mesh(g, g_banner_bar(), m_wood)
        .set_pos(0.044 * HEX_R, 0.636 * HEX_R, -0.156 * HEX_R);
    m.add_mesh(g, g_banner(), m_owner)
        .set_pos(0.046 * HEX_R, 0.600 * HEX_R, -0.156 * HEX_R);
    m.add_mesh(g, g_panel(), m_owner)
        .set_pos(0.152 * HEX_R, 0.382 * HEX_R, -0.012 * HEX_R);
    m
}
