//! Port of `render/galera-model.ts` (`edb8fb56`): the war galley (the only
//! naval unit), reached through `case 'galera'` of `buildCategoryModel`.

use super::consts::HEX_R;
use super::model::{Geo, MatId, Prim, UnitModel, ROOT};
use std::f64::consts::PI;

const COLOR_BRONZE: u32 = 0xcf9234;
const COLOR_SAIL: u32 = 0xe6ddc4;
const COLOR_SKIN: u32 = 0xe0ac69;
const WOOD_LIGHT: u32 = 0xa87f4a;
const WOOD_DARK: u32 = 0x7a5530;
const WOOD_TRIM: u32 = 0x4e341a;
const WOOD_DECK: u32 = 0xbb9258;
const WOOD_MAST: u32 = 0x6e4a24;
const EYE_WHITE: u32 = 0xf2eee6;
const EYE_DARK: u32 = 0x23262e;
const WATER_FOAM: u32 = 0xd8ecf4;

/// `GaleraPoza` (`galera-model.ts:56`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum GaleraPoza {
    /// `'plyniecie'` (default): oars mid-stroke, sail in the wind.
    #[default]
    Plyniecie,
    /// `'atak'`: oars in a full stroke toward the stern, fuller sail.
    Atak,
}

fn bx(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w * HEX_R, h * HEX_R, d * HEX_R))
}

/// `buildGalera(ownerColor, poza = 'plyniecie')` (`galera-model.ts:63-273`).
#[must_use]
// `approx_constant`: 0.318 is a web position literal, not 1/pi.
#[allow(clippy::too_many_lines, clippy::approx_constant)]
pub fn build_galera(owner: u32, poza: GaleraPoza) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_hull_hi = m.mat(WOOD_LIGHT, 0.05, 0.85);
    let m_hull_lo = m.mat(WOOD_DARK, 0.05, 0.88);
    let m_trim = m.mat(WOOD_TRIM, 0.05, 0.85);
    let m_deck = m.mat(WOOD_DECK, 0.05, 0.90);
    let m_mast = m.mat(WOOD_MAST, 0.05, 0.82);
    let m_bronze = m.mat(COLOR_BRONZE, 0.38, 0.52);
    let m_sail = m.mat(COLOR_SAIL, 0.04, 0.90);
    let m_owner = m.mat(owner, 0.10, 0.68);
    let m_eye_w = m.mat(EYE_WHITE, 0.02, 0.60);
    let m_eye_d = m.mat(EYE_DARK, 0.05, 0.55);
    let m_skin = m.mat(COLOR_SKIN, 0.05, 0.80);
    let m_foam = m.mat(WATER_FOAM, 0.02, 0.95);

    let hull_y = 0.10 * HEX_R;
    let atak = poza == GaleraPoza::Atak;

    // hull bottom in 3 facets
    m.add_mesh(g, bx(0.175, 0.06, 0.34), m_hull_lo)
        .set_pos(0.0, hull_y - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.15, 0.055, 0.19), m_hull_lo)
        .rot_x(0.30)
        .set_pos(0.0, hull_y - 0.004 * HEX_R, -0.245 * HEX_R);
    m.add_mesh(g, bx(0.15, 0.055, 0.19), m_hull_lo)
        .rot_x(-0.34)
        .set_pos(0.0, hull_y + 0.002 * HEX_R, 0.245 * HEX_R);

    // light planking, 3 facets per side
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, bx(0.024, 0.052, 0.34), m_hull_hi).set_pos(
            sx * 0.092 * HEX_R,
            hull_y + 0.028 * HEX_R,
            0.0,
        );
        m.add_mesh(g, bx(0.022, 0.052, 0.21), m_hull_hi)
            .rot_x(0.32)
            .rot_y(sx * 0.34)
            .set_pos(sx * 0.070 * HEX_R, hull_y + 0.050 * HEX_R, -0.245 * HEX_R);
        m.add_mesh(g, bx(0.022, 0.052, 0.20), m_hull_hi)
            .rot_x(-0.36)
            .rot_y(-sx * 0.36)
            .set_pos(sx * 0.070 * HEX_R, hull_y + 0.055 * HEX_R, 0.240 * HEX_R);
    }

    // deck
    m.add_mesh(g, bx(0.16, 0.018, 0.46), m_deck).set_pos(
        0.0,
        hull_y + 0.044 * HEX_R,
        -0.01 * HEX_R,
    );
    let deck_top = hull_y + 0.053 * HEX_R;

    // stem + apotropaic eye
    m.add_mesh(g, bx(0.045, 0.15, 0.05), m_hull_hi)
        .rot_x(0.34)
        .set_pos(0.0, hull_y + 0.055 * HEX_R, -0.315 * HEX_R);
    m.add_mesh(g, bx(0.052, 0.035, 0.06), m_trim)
        .rot_x(0.34)
        .set_pos(0.0, hull_y + 0.125 * HEX_R, -0.340 * HEX_R);
    for sx in [-1.0_f64, 1.0] {
        let eye_yaw = 0.70;
        let (ex, ey, ez) = (sx * 0.086 * HEX_R, hull_y + 0.058 * HEX_R, -0.268 * HEX_R);
        m.add_mesh(
            g,
            Geo::Prim(Prim::cone(0.055 * HEX_R, 0.020 * HEX_R, 4)),
            m_eye_w,
        )
        .rot_z(-sx * PI / 2.0)
        .rot_y(sx * eye_yaw)
        .set_scale(1.0, 1.0, 0.68)
        .set_pos(ex, ey, ez);
        m.add_mesh(
            g,
            Geo::Prim(Prim::cone(0.024 * HEX_R, 0.018 * HEX_R, 4)),
            m_eye_d,
        )
        .rot_z(-sx * PI / 2.0)
        .rot_y(sx * eye_yaw)
        .set_pos(ex + sx * 0.011 * HEX_R, ey, ez - 0.010 * HEX_R);
    }

    // trident ram
    m.add_mesh(g, bx(0.060, 0.042, 0.09), m_bronze).set_pos(
        0.0,
        hull_y - 0.040 * HEX_R,
        -0.340 * HEX_R,
    );
    for (px, py) in [(0.0, 0.014), (-0.030, -0.012), (0.030, -0.012)] {
        m.add_mesh(g, bx(0.016, 0.016, 0.13), m_bronze).set_pos(
            px * HEX_R,
            hull_y + (py - 0.038) * HEX_R,
            -0.435 * HEX_R,
        );
    }
    m.add_mesh(g, bx(0.105, 0.014, 0.04), m_foam).set_pos(
        0.0,
        hull_y - 0.052 * HEX_R,
        -0.372 * HEX_R,
    );

    // stern: quarterdeck, aplustre, steering oar
    m.add_mesh(g, bx(0.13, 0.05, 0.13), m_hull_hi).set_pos(
        0.0,
        hull_y + 0.075 * HEX_R,
        0.255 * HEX_R,
    );
    m.add_mesh(g, bx(0.035, 0.13, 0.035), m_trim)
        .rot_x(-0.42)
        .set_pos(0.0, hull_y + 0.155 * HEX_R, 0.330 * HEX_R);
    m.add_mesh(g, bx(0.030, 0.090, 0.030), m_trim)
        .rot_x(-1.15)
        .set_pos(0.0, hull_y + 0.235 * HEX_R, 0.318 * HEX_R);
    m.add_mesh(g, bx(0.026, 0.055, 0.026), m_owner)
        .rot_x(-1.85)
        .set_pos(0.0, hull_y + 0.262 * HEX_R, 0.272 * HEX_R);
    m.add_mesh(g, bx(0.016, 0.016, 0.20), m_mast)
        .rot_x(0.9)
        .rot_z(0.25)
        .set_pos(0.105 * HEX_R, hull_y + 0.005 * HEX_R, 0.315 * HEX_R);
    m.add_mesh(g, bx(0.014, 0.032, 0.075), m_mast)
        .rot_x(0.9)
        .set_pos(0.128 * HEX_R, hull_y - 0.065 * HEX_R, 0.372 * HEX_R);

    // mast + yard + bulging sail
    let mz = 0.03 * HEX_R;
    m.add_mesh(g, bx(0.024, 0.42, 0.024), m_mast)
        .set_pos(0.0, deck_top + 0.21 * HEX_R, mz);
    m.add_mesh(g, bx(0.40, 0.018, 0.018), m_mast)
        .set_pos(0.0, deck_top + 0.395 * HEX_R, mz);
    let sail_y = deck_top + 0.265 * HEX_R;
    let bulge = (if atak { 0.075 } else { 0.050 }) * HEX_R;
    let flare = if atak { 0.62 } else { 0.50 };
    m.add_mesh(g, bx(0.15, 0.235, 0.014), m_sail)
        .set_pos(0.0, sail_y, mz - bulge);
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, bx(0.13, 0.235, 0.014), m_sail)
            .rot_y(-sx * flare)
            .set_pos(sx * 0.128 * HEX_R, sail_y, mz - bulge + 0.038 * HEX_R);
    }
    m.add_mesh(g, bx(0.15, 0.052, 0.012), m_owner).set_pos(
        0.0,
        sail_y + 0.062 * HEX_R,
        mz - bulge - 0.004 * HEX_R,
    );
    m.add_mesh(g, bx(0.055, 0.055, 0.012), m_owner)
        .rot_z(PI / 4.0)
        .set_pos(0.0, sail_y - 0.045 * HEX_R, mz - bulge - 0.004 * HEX_R);

    // oars: 8 per side
    let oar_pitch = if atak { 0.78 } else { 0.30 };
    for sx in [-1.0_f64, 1.0] {
        for i in 0..8_u32 {
            let oz = (-0.21 + f64::from(i) * 0.058) * HEX_R;
            m.add_mesh(g, bx(0.012, 0.012, 0.24), m_mast)
                .rot_z(sx * 0.58)
                .rot_x(oar_pitch)
                .set_pos(sx * 0.150 * HEX_R, hull_y - 0.012 * HEX_R, oz);
        }
    }

    // shields along the gunwales (every other one in the owner colour)
    for sx in [-1.0_f64, 1.0] {
        for i in 0..4_u32 {
            let sz = (-0.155 + f64::from(i) * 0.105) * HEX_R;
            let mat: MatId = if i % 2 == 0 { m_owner } else { m_bronze };
            m.add_mesh(
                g,
                Geo::Prim(Prim::cone(0.046 * HEX_R, 0.020 * HEX_R, 6)),
                mat,
            )
            .rot_z(-sx * PI / 2.0)
            .set_pos(sx * 0.112 * HEX_R, hull_y + 0.075 * HEX_R, sz);
        }
    }

    // crew: bow lookout with a spear + helmsman
    let sailor_at = |m: &mut UnitModel, x: f64, y: f64, z: f64, yaw: f64, spear: bool| {
        m.add_mesh(g, bx(0.045, 0.085, 0.030), m_owner)
            .set_pos(x, y + 0.042 * HEX_R, z)
            .rot_y(yaw);
        m.add_mesh(g, bx(0.032, 0.032, 0.030), m_skin)
            .set_pos(x, y + 0.102 * HEX_R, z)
            .rot_y(yaw);
        if spear {
            m.add_mesh(g, bx(0.008, 0.20, 0.008), m_mast).set_pos(
                x + 0.032 * HEX_R,
                y + 0.085 * HEX_R,
                z,
            );
        }
    };
    sailor_at(
        &mut m,
        -0.015 * HEX_R,
        deck_top,
        -0.200 * HEX_R,
        if atak { 0.0 } else { 0.2 },
        true,
    );
    sailor_at(
        &mut m,
        0.0,
        hull_y + 0.10 * HEX_R,
        0.250 * HEX_R,
        0.0,
        false,
    );
    m
}
