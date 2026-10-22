//! The eight MOD-06 builders that live in `render/units.ts` (`edb8fb56`):
//! `buildMedjay` (`:1928`), `buildSumerianChariot` (`:2197`),
//! `buildEgyptianChariot` (`:2421`), `buildChineseCavalry` (`:2504`),
//! `buildSumerianRoyalGuard` (`:4859`), `buildHuBenWei` (`:5004`),
//! `buildUThulwana` (`:5156`), `buildInkaRoyalGuard` (`:5343`).
//!
//! They are built on the unit-core avatar / category / horse helpers (one
//! implementation, P4.13). The per-token geometries of the web (`perGeo`)
//! are plain values here — the list only exists for GPU disposal.

use super::kit::{cy_open, sph_full};
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::avatar::{
    add_belt, add_boots, add_greaves, add_hands, add_pteruges, add_super_banner, add_tunic_hem,
    build_base_avatar, bx, cyl, part,
};
use crate::models::unit_core::category::{build_category_model, UnitCategory};
use crate::models::unit_core::consts::*;
use crate::models::unit_core::horse::build_horse;
use crate::models::unit_core::model::{UnitModel, ROOT};
use crate::models::unit_core::parts::UnitPart;
use std::f64::consts::PI;

/// `buildMedjay(ownerColor)` (`units.ts:1928-2128`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_medjay(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_LINEN, owner);
    let g = ROOT;
    let m_linen = m.mat(COLOR_LINEN, 0.05, 0.84);
    let m_gold = m.mat(COLOR_GOLD_BR, 0.55, 0.34);
    let m_blue = m.mat(COLOR_WOAD, 0.10, 0.68);
    let m_bronze = m.mat(COLOR_BRONZE, 0.42, 0.44);
    let m_bronz_l = m.mat(COLOR_BRONZE_LT, 0.52, 0.36);
    let m_hide = m.mat(COLOR_HIDE_RED, 0.06, 0.84);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);
    let m_leoprd = m.mat(0x3a_2808, 0.05, 0.88);

    m.add_mesh(
        g,
        bx(AV_TORSO_W * 1.12, 0.120 * HEX_R, AV_TORSO_D * 1.08),
        m_linen,
    )
    .set_pos(0.0, AV_Y_TORSO_BOT - 0.022 * HEX_R, 0.0);
    for (ldx, ldy) in [(-0.04, -0.01), (0.00, -0.04), (0.04, -0.02)] {
        m.add_mesh(g, bx(0.022 * HEX_R, 0.018 * HEX_R, 0.013 * HEX_R), m_leoprd)
            .set_pos(
                ldx * HEX_R,
                AV_Y_TORSO_BOT + ldy * HEX_R - 0.018 * HEX_R,
                AV_TORSO_D * 0.5 + 0.008 * HEX_R,
            );
    }
    add_belt(&mut m, m_gold, 0.018);

    m.add_mesh(
        g,
        bx(AV_TORSO_W * 1.06, 0.048 * HEX_R, AV_TORSO_D * 1.04),
        m_owner,
    )
    .set_pos(0.0, AV_Y_TORSO_TOP - 0.018 * HEX_R, 0.003 * HEX_R);
    m.add_mesh(
        g,
        bx(AV_TORSO_W * 1.10, 0.012 * HEX_R, AV_TORSO_D * 1.08),
        m_gold,
    )
    .set_pos(0.0, AV_Y_TORSO_TOP - 0.042 * HEX_R, 0.002 * HEX_R);

    let nem_y = AV_Y_HEAD_CTR + 0.055 * HEX_R;
    m.add_mesh(g, bx(0.158 * HEX_R, 0.072 * HEX_R, 0.162 * HEX_R), m_blue)
        .set_pos(0.0, nem_y, -0.004 * HEX_R);
    for ni in 0..2 {
        let mt = if ni == 0 { m_owner } else { m_gold };
        m.add_mesh(g, bx(0.158 * HEX_R, 0.015 * HEX_R, 0.012 * HEX_R), mt)
            .set_pos(
                0.0,
                nem_y + 0.018 * HEX_R - f64::from(ni) * 0.030 * HEX_R,
                0.082 * HEX_R,
            );
    }
    m.add_mesh(g, bx(0.150 * HEX_R, 0.016 * HEX_R, 0.020 * HEX_R), m_gold)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR + 0.040 * HEX_R,
            AV_HEAD_S * 0.5 + 0.006 * HEX_R,
        );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, bx(0.040 * HEX_R, 0.130 * HEX_R, 0.026 * HEX_R), m_blue)
            .set_pos(
                sx * (AV_HEAD_S * 0.5 + 0.019 * HEX_R),
                AV_Y_HEAD_CTR - 0.018 * HEX_R,
                0.040 * HEX_R,
            );
    }
    m.add_mesh(g, bx(0.072 * HEX_R, 0.115 * HEX_R, 0.030 * HEX_R), m_blue)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR - 0.010 * HEX_R,
            -(AV_HEAD_S * 0.5 + 0.022 * HEX_R),
        );
    m.add_mesh(g, bx(0.020 * HEX_R, 0.030 * HEX_R, 0.016 * HEX_R), m_gold)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR + 0.062 * HEX_R,
            AV_HEAD_S * 0.5 + 0.014 * HEX_R,
        );
    let m_white = m.mat(COLOR_PAINT_WHT, 0.03, 0.94);
    m.add_mesh(g, bx(0.024 * HEX_R, 0.150 * HEX_R, 0.013 * HEX_R), m_white)
        .rot_z(0.10)
        .set_pos(0.012 * HEX_R, nem_y + 0.108 * HEX_R, -0.016 * HEX_R);
    m.add_mesh(g, bx(0.030 * HEX_R, 0.022 * HEX_R, 0.018 * HEX_R), m_gold)
        .set_pos(0.006 * HEX_R, nem_y + 0.040 * HEX_R, -0.016 * HEX_R);

    let kh_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R;
    let kh_hand_y = AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.022 * HEX_R;
    let kh_y_base = kh_hand_y - 0.043 * HEX_R;
    m.add_mesh(g, part(UnitPart::SwordGrip), m_wood).set_pos(
        kh_x,
        kh_y_base + 0.050 * HEX_R,
        0.015 * HEX_R,
    );
    m.add_mesh(
        g,
        bx(0.050 * HEX_R, 0.013 * HEX_R, 0.015 * HEX_R),
        m_bronz_l,
    )
    .set_pos(kh_x, kh_y_base + 0.100 * HEX_R, 0.015 * HEX_R);
    m.add_mesh(g, bx(0.020 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R), m_bronze)
        .set_pos(kh_x, kh_y_base + 0.165 * HEX_R, 0.015 * HEX_R);
    for (dx, dy, rz, len) in [
        (0.022, 0.202, -0.50, 0.062),
        (0.050, 0.234, -1.05, 0.050),
        (0.070, 0.234, -1.65, 0.038),
    ] {
        m.add_mesh(g, bx(0.018 * HEX_R, len * HEX_R, 0.010 * HEX_R), m_bronze)
            .rot_z(rz)
            .set_pos(kh_x + dx * HEX_R, kh_y_base + dy * HEX_R, 0.015 * HEX_R);
    }

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R);
    let sh_z = 0.046 * HEX_R;
    m.add_mesh(g, part(UnitPart::OvalShield), m_hide)
        .rot_x(PI / 2.0)
        .set_scale(0.84, 1.0, 1.03)
        .set_pos(sh_x, AV_Y_TORSO_CTR + 0.072 * HEX_R, sh_z);
    m.add_mesh(g, part(UnitPart::OvalShield), m_hide)
        .rot_x(PI / 2.0)
        .set_scale(0.97, 1.0, 1.16)
        .set_pos(sh_x, AV_Y_TORSO_CTR - 0.055 * HEX_R, sh_z);
    m.add_mesh(g, part(UnitPart::ShieldBoss), m_bronz_l)
        .rot_x(PI / 2.0)
        .set_pos(sh_x, AV_Y_TORSO_CTR + 0.010 * HEX_R, sh_z + 0.012 * HEX_R);

    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `buildSumerianChariot(ownerColor)` (`units.ts:2197-2392`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_sumerian_chariot(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(0x6a_5020, 0.05, 0.85);
    let m_bronze = m.mat(COLOR_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(COLOR_BRONZE_LT, 0.50, 0.38);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_horse = m.mat(0x7a_5c30, 0.10, 0.80);
    let m_mane = m.mat(0x3a_2c1a, 0.05, 0.85);
    let m_skin = m.mat(COLOR_SKIN, 0.05, 0.80);
    let m_cloth = m.mat(COLOR_TEAL, 0.06, 0.80);
    let m_fleece = m.mat(0xd8_c8a0, 0.04, 0.96);
    let m_dark = m.mat(COLOR_TROUSERS, 0.05, 0.85);

    let wheel_r = 0.090 * HEX_R;
    let wheel_y = wheel_r;
    let axle_y = wheel_y;
    let car_floor_y = axle_y + wheel_r * 0.30;

    for (sx, sign) in [(0.190 * HEX_R, 1.0), (-0.190 * HEX_R, -1.0)] {
        m.add_mesh(g, cyl(wheel_r, wheel_r, 0.030 * HEX_R, 14), m_wood)
            .rot_z(PI / 2.0)
            .set_pos(sx, wheel_y, -0.005 * HEX_R);
        m.add_mesh(g, cy_open(wheel_r, wheel_r, 0.036 * HEX_R, 14), m_bronze)
            .rot_z(PI / 2.0)
            .set_pos(sx, wheel_y, -0.005 * HEX_R);
        m.add_mesh(
            g,
            cyl(0.025 * HEX_R, 0.025 * HEX_R, 0.040 * HEX_R, 8),
            m_bronz_l,
        )
        .rot_z(PI / 2.0)
        .set_pos(sx + sign * 0.012 * HEX_R, wheel_y, -0.005 * HEX_R);
    }

    m.add_mesh(g, bx(0.40 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R), m_bronze)
        .set_pos(0.0, axle_y, -0.005 * HEX_R);
    m.add_mesh(g, bx(0.30 * HEX_R, 0.022 * HEX_R, 0.28 * HEX_R), m_wood)
        .set_pos(0.0, car_floor_y, 0.07 * HEX_R);
    m.add_mesh(g, bx(0.30 * HEX_R, 0.12 * HEX_R, 0.022 * HEX_R), m_owner)
        .set_pos(0.0, car_floor_y + 0.06 * HEX_R, -0.055 * HEX_R);
    for sx in [0.140 * HEX_R, -0.140 * HEX_R] {
        m.add_mesh(g, bx(0.022 * HEX_R, 0.10 * HEX_R, 0.28 * HEX_R), m_wood)
            .set_pos(sx, car_floor_y + 0.05 * HEX_R, 0.07 * HEX_R);
    }
    m.add_mesh(g, bx(0.32 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R), m_bronze)
        .set_pos(0.0, car_floor_y + 0.118 * HEX_R, -0.055 * HEX_R);

    let pole_z_start = -0.066 * HEX_R;
    let pole_z_end = -0.32 * HEX_R;
    let pole_len = (pole_z_end - pole_z_start).abs();
    m.add_mesh(g, bx(0.022 * HEX_R, 0.022 * HEX_R, pole_len), m_wood)
        .set_pos(0.0, car_floor_y, (pole_z_start + pole_z_end) * 0.5);
    m.add_mesh(g, bx(0.28 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R), m_bronze)
        .set_pos(0.0, car_floor_y, pole_z_end);

    let horse_z = pole_z_end - 0.08 * HEX_R;
    for hx in [0.10 * HEX_R, -0.10 * HEX_R] {
        build_horse(&mut m, g, m_horse, m_mane, Some(m_dark), hx, horse_z);
    }

    let drv_scale = 0.82;
    let drv_leg_h = AV_LEG_H * drv_scale;
    let drv_trs_h = AV_TORSO_H * drv_scale;
    let drv_trs_w = AV_TORSO_W * drv_scale;
    let drv_trs_d = AV_TORSO_D * drv_scale;
    let drv_arm_w = AV_ARM_W * drv_scale;
    let drv_arm_h = AV_ARM_H * drv_scale;
    let drv_arm_d = AV_ARM_D * drv_scale;
    let drv_head_s = AV_HEAD_S * drv_scale;
    let drv_arm_ox = drv_trs_w * 0.5 + drv_arm_w * 0.5 + 0.002 * HEX_R;
    let drv_base = car_floor_y + 0.008 * HEX_R;
    let drv_leg_ctr = drv_base + drv_leg_h * 0.5;
    let drv_trs_bot = drv_base + drv_leg_h;
    let drv_trs_ctr = drv_trs_bot + drv_trs_h * 0.5;
    let drv_trs_top = drv_trs_bot + drv_trs_h;
    let drv_arm_ctr = drv_trs_bot + drv_trs_h * 0.55;
    let drv_head_ctr = drv_trs_top + AV_NECK_H * drv_scale + drv_head_s * 0.5;

    let d = m.add_group(g);
    m.node(d).rot_y(PI);

    m.add_mesh(
        d,
        bx(AV_LEG_W * drv_scale, drv_leg_h, AV_LEG_W * drv_scale),
        m_dark,
    )
    .set_pos(
        -(AV_LEG_SEP + AV_LEG_W * drv_scale * 0.5),
        drv_leg_ctr,
        0.03 * HEX_R,
    );
    m.add_mesh(
        d,
        bx(AV_LEG_W * drv_scale, drv_leg_h, AV_LEG_W * drv_scale),
        m_dark,
    )
    .set_pos(
        AV_LEG_SEP + AV_LEG_W * drv_scale * 0.5,
        drv_leg_ctr,
        0.03 * HEX_R,
    );
    m.add_mesh(d, bx(drv_trs_w, drv_trs_h, drv_trs_d), m_cloth)
        .set_pos(0.0, drv_trs_ctr, 0.03 * HEX_R);
    m.add_mesh(
        d,
        bx(drv_trs_w * 1.08, 0.026 * HEX_R, drv_trs_d * 1.05),
        m_fleece,
    )
    .set_pos(0.0, drv_trs_bot - 0.014 * HEX_R, 0.03 * HEX_R);
    m.add_mesh(
        d,
        bx(drv_trs_w * 0.85, drv_trs_h * 0.28, 0.012 * HEX_R),
        m_owner,
    )
    .set_pos(
        0.0,
        drv_trs_ctr,
        0.03 * HEX_R + drv_trs_d * 0.5 + 0.002 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(d, bx(drv_arm_w, drv_arm_h, drv_arm_d), m_cloth)
            .set_pos(sx * drv_arm_ox, drv_arm_ctr, 0.03 * HEX_R);
    }
    m.add_mesh(d, bx(drv_head_s, drv_head_s, drv_head_s), m_skin)
        .set_pos(0.0, drv_head_ctr, 0.03 * HEX_R);
    let d_eye_z = drv_head_s * 0.5 + 0.002 * HEX_R;
    for (ex, ey) in [(-0.024, 0.008), (0.024, 0.008)] {
        let m_eye = m.mat(COLOR_DARK_EYE, 0.02, 0.95);
        m.add_mesh(d, bx(0.015 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R), m_eye)
            .set_pos(
                ex * HEX_R,
                drv_head_ctr + ey * HEX_R,
                0.03 * HEX_R + d_eye_z,
            );
    }
    m.add_mesh(
        d,
        cyl(
            0.020 * HEX_R * drv_scale,
            0.072 * HEX_R * drv_scale,
            0.085 * HEX_R * drv_scale,
            8,
        ),
        m_bronze,
    )
    .set_pos(0.0, drv_head_ctr + drv_head_s * 0.52, 0.03 * HEX_R);
    m.add_mesh(d, bx(0.12 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R), m_dark)
        .rot_y(PI * 0.5)
        .set_pos(
            0.0,
            drv_arm_ctr,
            0.03 * HEX_R - drv_trs_d * 0.5 - 0.06 * HEX_R,
        );

    m.node(g).rot_y(PI);
    m
}

/// `buildEgyptianChariot(ownerColor)` (`units.ts:2421-2476`).
///
/// # Panics
/// Never: the `rydwan` category model is ported (P4.13).
#[must_use]
pub fn build_egyptian_chariot(owner: u32) -> UnitModel {
    let mut m =
        build_category_model(UnitCategory::Rydwan, owner).expect("category 'rydwan' is ported");
    let g = ROOT;
    let m_wood = m.mat(0x6e_4a24, 0.05, 0.82);
    let m_string = m.mat(0xe8_e0cc, 0.02, 0.95);
    let m_gold = m.mat(COLOR_GOLD, 0.55, 0.38);
    let m_blue = m.mat(COLOR_WOAD, 0.05, 0.75);

    let wheel_r = 0.085 * HEX_R;
    let wheel_y = wheel_r;
    let car_floor_y = wheel_y + wheel_r * 0.30;
    let bow_x = 0.10 * HEX_R;
    let bow_y_ctr = car_floor_y + 0.25 * HEX_R;

    for (h, dy, rot) in [(0.18, 0.0, 0.0), (0.14, 0.10, 0.30), (0.14, -0.10, 0.30)] {
        m.add_mesh(g, bx(0.015 * HEX_R, h * HEX_R, 0.015 * HEX_R), m_wood)
            .rot_x(rot)
            .set_pos(bow_x, bow_y_ctr + dy * HEX_R, 0.06 * HEX_R);
    }
    m.add_mesh(g, bx(0.005 * HEX_R, 0.36 * HEX_R, 0.005 * HEX_R), m_string)
        .set_pos(bow_x + 0.015 * HEX_R, bow_y_ctr, 0.08 * HEX_R);
    m.add_mesh(g, bx(0.30 * HEX_R, 0.014 * HEX_R, 0.024 * HEX_R), m_gold)
        .set_pos(0.0, car_floor_y + 0.115 * HEX_R, -0.050 * HEX_R);
    m.add_mesh(g, bx(0.28 * HEX_R, 0.016 * HEX_R, 0.022 * HEX_R), m_blue)
        .set_pos(0.0, car_floor_y + 0.068 * HEX_R, -0.050 * HEX_R);
    m
}

/// `buildChineseCavalry(ownerColor)` (`units.ts:2504-2585`).
///
/// # Panics
/// Never: the `konnica` category model is ported (P4.13).
#[must_use]
pub fn build_chinese_cavalry(owner: u32) -> UnitModel {
    let mut m =
        build_category_model(UnitCategory::Konnica, owner).expect("category 'konnica' is ported");
    let g = ROOT;
    let m_lac = m.mat(COLOR_LACQUER, 0.10, 0.55);
    let m_bronz = m.mat(COLOR_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(COLOR_BRONZE_LT, 0.50, 0.38);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let _m_owner = m.mat(owner, 0.10, 0.68);

    let horse_body_h = 0.12 * HEX_R;
    let horse_body_y = 0.14 * HEX_R + horse_body_h * 0.5;
    let rider_bot = horse_body_y + horse_body_h * 0.5;
    let r_trs_ctr = rider_bot + AV_TORSO_H * 0.5;
    let r_trs_top = rider_bot + AV_TORSO_H;
    let r_head_ctr = r_trs_top + AV_NECK_H + AV_HEAD_S * 0.5;
    let r_arm_ctr = rider_bot + AV_TORSO_H * 0.55;

    m.add_mesh(
        g,
        bx(AV_TORSO_W * 0.92, AV_TORSO_H * 0.78, AV_TORSO_D * 0.88),
        m_lac,
    )
    .set_pos(0.0, r_trs_ctr, 0.0);
    for dy in [0.04 * HEX_R, -0.04 * HEX_R] {
        m.add_mesh(
            g,
            bx(AV_TORSO_W * 0.94, 0.012 * HEX_R, AV_TORSO_D * 0.90),
            m_bronz_l,
        )
        .set_pos(0.0, r_trs_ctr + dy, 0.001 * HEX_R);
    }

    m.add_mesh(
        g,
        cyl(0.046 * HEX_R, 0.054 * HEX_R, 0.048 * HEX_R, 8),
        m_bronz,
    )
    .set_pos(
        0.0,
        r_head_ctr + AV_HEAD_S * 0.85 * 0.50 + 0.004 * HEX_R,
        0.0,
    );
    m.add_mesh(
        g,
        bx(0.012 * HEX_R, 0.040 * HEX_R, 0.012 * HEX_R),
        m_bronz_l,
    )
    .set_pos(
        0.0,
        r_head_ctr + AV_HEAD_S * 0.85 * 0.50 + 0.044 * HEX_R,
        0.0,
    );
    let m_flap = m.mat(COLOR_LACQUER, 0.08, 0.72);
    m.add_mesh(
        g,
        bx(AV_HEAD_S * 0.85 * 1.22, 0.034 * HEX_R, 0.026 * HEX_R),
        m_flap,
    )
    .set_pos(
        0.0,
        r_head_ctr - AV_HEAD_S * 0.85 * 0.36,
        -AV_HEAD_S * 0.85 * 0.5 - 0.005 * HEX_R,
    );

    let arm_ox = AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.012 * HEX_R;
    m.add_mesh(g, bx(0.014 * HEX_R, 0.40 * HEX_R, 0.014 * HEX_R), m_wood)
        .set_pos(arm_ox, r_arm_ctr + 0.15 * HEX_R, 0.02 * HEX_R);
    m.add_mesh(g, bx(0.016 * HEX_R, 0.028 * HEX_R, 0.10 * HEX_R), m_bronz_l)
        .set_pos(arm_ox, r_arm_ctr + 0.32 * HEX_R, 0.060 * HEX_R);
    m.add_mesh(g, part(UnitPart::SpearTip), m_bronz)
        .set_scale(0.7, 0.6, 0.7)
        .set_pos(
            arm_ox,
            r_arm_ctr + 0.15 * HEX_R + 0.20 * HEX_R + 0.018 * HEX_R,
            0.02 * HEX_R,
        );
    m
}

/// `buildSumerianRoyalGuard(ownerColor)` (`units.ts:4859-4992`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_sumerian_royal_guard(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, 0xb0_6a3a, owner);
    let g = ROOT;
    let m_copper = m.mat(0xb0_6a3a, 0.48, 0.38);
    let m_cop_l = m.mat(0xd0_9848, 0.58, 0.28);
    let m_dark = m.mat(0x5a_3010, 0.25, 0.65);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_steel = m.mat(COLOR_STEEL, 0.50, 0.40);

    m.add_mesh(g, bx(0.16 * HEX_R, 0.24 * HEX_R, 0.012 * HEX_R), m_owner)
        .set_pos(
            0.0,
            AV_Y_TORSO_CTR - 0.01 * HEX_R,
            -AV_TORSO_D * 0.5 - 0.008 * HEX_R,
        )
        .rot_x(0.14);
    for dy in [0.09, 0.03, -0.03, -0.09] {
        m.add_mesh(g, bx(0.16 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R), m_dark)
            .set_pos(
                0.0,
                AV_Y_TORSO_CTR + dy * HEX_R,
                -AV_TORSO_D * 0.5 - 0.009 * HEX_R,
            );
    }

    m.add_mesh(g, part(UnitPart::CuirassBox), m_copper)
        .set_scale(1.04, 1.02, 1.04)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    for dy in [0.07, 0.0, -0.07] {
        m.add_mesh(g, part(UnitPart::LoricaBand), m_dark).set_pos(
            0.0,
            AV_Y_TORSO_CTR + dy * HEX_R,
            0.004 * HEX_R,
        );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, part(UnitPart::ShoulderPad), m_cop_l).set_pos(
            sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R),
            AV_Y_TORSO_TOP - 0.015 * HEX_R,
            0.0,
        );
    }

    m.add_mesh(g, part(UnitPart::ConicalHelm), m_cop_l)
        .set_scale(0.94, 1.50, 0.94)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.100 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.164 * HEX_R, 0.022 * HEX_R, 0.144 * HEX_R), m_cop_l)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.042 * HEX_R, -0.004 * HEX_R);
    m.add_mesh(g, bx(0.072 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R), m_dark)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR - 0.040 * HEX_R,
            AV_HEAD_S * 0.5 + 0.004 * HEX_R,
        );

    let sp_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R;
    let sp_bot = AV_Y_LEG_BOT + 0.00 * HEX_R;
    m.add_mesh(g, bx(0.016 * HEX_R, 0.68 * HEX_R, 0.016 * HEX_R), m_wood)
        .set_pos(sp_x, sp_bot + 0.34 * HEX_R, 0.01 * HEX_R);
    m.add_mesh(g, part(UnitPart::SpearTip), m_cop_l)
        .set_scale(1.2, 1.5, 1.2)
        .set_pos(sp_x, sp_bot + 0.712 * HEX_R, 0.01 * HEX_R);
    m.add_mesh(g, bx(0.012 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R), m_copper)
        .set_pos(sp_x, sp_bot - 0.015 * HEX_R, 0.01 * HEX_R);

    let swx = AV_ARM_OFFSET_X * 0.3;
    m.add_mesh(g, bx(0.040 * HEX_R, 0.090 * HEX_R, 0.010 * HEX_R), m_steel)
        .rot_z(-0.45)
        .set_pos(
            swx,
            AV_Y_TORSO_BOT + 0.04 * HEX_R,
            AV_TORSO_D * 0.5 + 0.012 * HEX_R,
        );

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.022 * HEX_R);
    let sh_y = AV_Y_TORSO_CTR + 0.02 * HEX_R;
    let sh_z = 0.046 * HEX_R;
    m.add_mesh(g, bx(0.148 * HEX_R, 0.270 * HEX_R, 0.018 * HEX_R), m_owner)
        .set_pos(sh_x, sh_y, sh_z);
    for (w, h, ox, oy) in [
        (0.148, 0.018, 0.0, 0.126),
        (0.148, 0.018, 0.0, -0.126),
        (0.018, 0.270, 0.065, 0.0),
        (0.018, 0.270, -0.065, 0.0),
    ] {
        m.add_mesh(g, bx(w * HEX_R, h * HEX_R, 0.022 * HEX_R), m_cop_l)
            .set_pos(sh_x + ox * HEX_R, sh_y + oy * HEX_R, sh_z + 0.004 * HEX_R);
    }

    add_greaves(&mut m, m_cop_l);
    let m_pole = m.mat(COLOR_POLE_GREY, 0.35, 0.55);
    add_super_banner(&mut m, m_pole, m_owner, m_cop_l);
    let m_boot = m.mat(0x5a_3c22, 0.06, 0.82);
    add_boots(&mut m, m_boot);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `buildHuBenWei(ownerColor)` (`units.ts:5004-5145`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_hu_ben_wei(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_LACQUER, owner);
    let g = ROOT;
    let m_lac = m.mat(COLOR_LACQUER, 0.22, 0.42);
    let m_red = m.mat(COLOR_RED_VIV, 0.08, 0.76);
    let m_tig_or = m.mat(0xe0_7820, 0.15, 0.72);
    let m_black = m.mat(0x1c_1712, 0.16, 0.58);
    let m_brass = m.mat(0xc9_a23a, 0.55, 0.34);
    let m_steel = m.mat(COLOR_STEEL, 0.55, 0.34);
    let m_owner = m.mat(owner, 0.16, 0.62);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);

    m.add_mesh(g, part(UnitPart::CuirassBox), m_lac)
        .set_scale(1.04, 1.04, 1.04)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    for dy in [0.07, 0.0, -0.07] {
        m.add_mesh(g, part(UnitPart::LoricaBand), m_red).set_pos(
            0.0,
            AV_Y_TORSO_CTR + dy * HEX_R,
            0.005 * HEX_R,
        );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, part(UnitPart::ShoulderPad), m_owner).set_pos(
            sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R),
            AV_Y_TORSO_TOP - 0.015 * HEX_R,
            0.0,
        );
        for dt in [-0.012, 0.012] {
            m.add_mesh(g, bx(0.07 * HEX_R, 0.012 * HEX_R, 0.072 * HEX_R), m_black)
                .set_pos(
                    sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R),
                    AV_Y_TORSO_TOP - 0.015 * HEX_R + dt * HEX_R,
                    0.0,
                );
        }
    }
    add_pteruges(&mut m, m_red);

    m.add_mesh(
        g,
        cyl(0.062 * HEX_R, 0.080 * HEX_R, 0.082 * HEX_R, 10),
        m_brass,
    )
    .set_pos(0.0, AV_Y_HEAD_CTR + 0.062 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.170 * HEX_R, 0.018 * HEX_R, 0.140 * HEX_R), m_brass)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.041 * HEX_R, -0.004 * HEX_R);
    m.add_mesh(g, bx(0.020 * HEX_R, 0.038 * HEX_R, 0.020 * HEX_R), m_brass)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.122 * HEX_R, 0.0);
    for ax in [-0.30, 0.0, 0.30] {
        #[allow(clippy::float_cmp)]
        let col = if ax == 0.0 { m_owner } else { m_tig_or };
        m.add_mesh(g, bx(0.022 * HEX_R, 0.130 * HEX_R, 0.012 * HEX_R), col)
            .rot_z(ax)
            .set_pos(
                js_sin(ax) * 0.04 * HEX_R,
                AV_Y_HEAD_CTR + 0.190 * HEX_R,
                -0.006 * HEX_R,
            );
    }

    let sp_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R;
    m.add_mesh(g, bx(0.016 * HEX_R, 0.56 * HEX_R, 0.016 * HEX_R), m_wood)
        .set_pos(sp_x, AV_Y_LEG_BOT + 0.28 * HEX_R, 0.01 * HEX_R);
    m.add_mesh(g, bx(0.016 * HEX_R, 0.110 * HEX_R, 0.014 * HEX_R), m_steel)
        .set_pos(sp_x, AV_Y_LEG_BOT + 0.60 * HEX_R, 0.01 * HEX_R);
    m.add_mesh(g, bx(0.078 * HEX_R, 0.024 * HEX_R, 0.012 * HEX_R), m_steel)
        .set_pos(
            sp_x + 0.031 * HEX_R,
            AV_Y_LEG_BOT + 0.565 * HEX_R,
            0.01 * HEX_R,
        );
    m.add_mesh(g, bx(0.028 * HEX_R, 0.046 * HEX_R, 0.028 * HEX_R), m_red)
        .set_pos(sp_x, AV_Y_LEG_BOT + 0.52 * HEX_R, 0.01 * HEX_R);

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.020 * HEX_R);
    let sh_z = 0.046 * HEX_R;
    m.add_mesh(g, bx(0.146 * HEX_R, 0.226 * HEX_R, 0.014 * HEX_R), m_black)
        .set_pos(sh_x, AV_Y_TORSO_CTR, sh_z - 0.004 * HEX_R);
    m.add_mesh(g, bx(0.130 * HEX_R, 0.210 * HEX_R, 0.016 * HEX_R), m_owner)
        .set_pos(sh_x, AV_Y_TORSO_CTR, sh_z);
    m.add_mesh(g, bx(0.100 * HEX_R, 0.100 * HEX_R, 0.014 * HEX_R), m_tig_or)
        .set_pos(sh_x, AV_Y_TORSO_CTR + 0.01 * HEX_R, sh_z + 0.008 * HEX_R);
    for dy in [0.028, -0.028] {
        m.add_mesh(g, bx(0.100 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R), m_black)
            .set_pos(
                sh_x,
                AV_Y_TORSO_CTR + dy * HEX_R + 0.01 * HEX_R,
                sh_z + 0.012 * HEX_R,
            );
    }

    let m_pole = m.mat(COLOR_POLE_GREY, 0.35, 0.55);
    add_super_banner(&mut m, m_pole, m_owner, m_brass);
    add_boots(&mut m, m_black);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `buildUThulwana(ownerColor)` (`units.ts:5156-5330`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_u_thulwana(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN_DARK, COLOR_SKIN_DARK, owner);
    let g = ROOT;
    let m_ochre = m.mat(COLOR_HIDE_RED, 0.06, 0.84);
    let m_white = m.mat(COLOR_PAINT_WHT, 0.03, 0.94);
    let m_black = m.mat(0x1e_1610, 0.05, 0.86);
    let m_fur = m.mat(COLOR_FUR, 0.08, 0.82);
    let m_wood = m.mat(0x7a_5030, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.66);

    m.add_mesh(g, part(UnitPart::Loincloth), m_ochre).set_pos(
        0.0,
        AV_Y_TORSO_BOT + 0.02 * HEX_R,
        0.0,
    );
    m.add_mesh(g, bx(0.030 * HEX_R, 0.260 * HEX_R, 0.012 * HEX_R), m_owner)
        .rot_z(0.65)
        .set_pos(0.0, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.007 * HEX_R);

    for sx in [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X] {
        m.add_mesh(
            g,
            bx(AV_ARM_W * 1.4, 0.052 * HEX_R, AV_ARM_D * 1.4),
            m_white,
        )
        .set_pos(sx, AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.06 * HEX_R, 0.0);
        m.add_mesh(g, bx(AV_ARM_W * 1.2, 0.040 * HEX_R, AV_ARM_D * 1.2), m_fur)
            .set_pos(sx, AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.11 * HEX_R, 0.0);
    }
    for lx in [-AV_LEG_SEP - AV_LEG_W * 0.5, AV_LEG_SEP + AV_LEG_W * 0.5] {
        m.add_mesh(
            g,
            bx(AV_LEG_W * 1.3, 0.046 * HEX_R, AV_LEG_W * 1.3),
            m_white,
        )
        .set_pos(lx, AV_Y_LEG_BOT + 0.06 * HEX_R, 0.0);
    }

    m.add_mesh(g, bx(0.150 * HEX_R, 0.028 * HEX_R, 0.150 * HEX_R), m_black)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.044 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.104 * HEX_R, 0.016 * HEX_R, 0.104 * HEX_R), m_fur)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.004 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.016 * HEX_R, 0.130 * HEX_R, 0.010 * HEX_R), m_white)
        .rot_z(0.12)
        .set_pos(0.008 * HEX_R, AV_Y_HEAD_TOP + 0.090 * HEX_R, -0.018 * HEX_R);
    m.add_mesh(g, bx(0.014 * HEX_R, 0.040 * HEX_R, 0.008 * HEX_R), m_black)
        .rot_z(0.12)
        .set_pos(0.010 * HEX_R, AV_Y_HEAD_TOP + 0.175 * HEX_R, -0.018 * HEX_R);

    let sp_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R;
    m.add_mesh(g, bx(0.018 * HEX_R, 0.30 * HEX_R, 0.018 * HEX_R), m_wood)
        .set_pos(sp_x, AV_Y_TORSO_CTR + 0.02 * HEX_R, 0.01 * HEX_R);
    let m_steel = m.mat(COLOR_STEEL, 0.50, 0.40);
    m.add_mesh(g, bx(0.042 * HEX_R, 0.115 * HEX_R, 0.014 * HEX_R), m_steel)
        .set_pos(
            sp_x,
            AV_Y_TORSO_CTR + 0.02 * HEX_R + 0.152 * HEX_R + 0.058 * HEX_R,
            0.01 * HEX_R,
        );

    let kx = -(AV_ARM_OFFSET_X * 0.5);
    m.add_mesh(g, bx(0.014 * HEX_R, 0.120 * HEX_R, 0.014 * HEX_R), m_wood)
        .rot_z(0.30)
        .set_pos(kx, AV_Y_TORSO_BOT + 0.06 * HEX_R, 0.012 * HEX_R);
    m.add_mesh(g, sph_full(0.022 * HEX_R, 8, 6), m_owner)
        .set_pos(
            kx + 0.016 * HEX_R,
            AV_Y_TORSO_BOT + 0.12 * HEX_R,
            0.014 * HEX_R,
        );

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.022 * HEX_R);
    let sh_y = AV_Y_TORSO_CTR + 0.02 * HEX_R;
    let sh_z = 0.048 * HEX_R;
    m.add_mesh(g, part(UnitPart::OvalShield), m_white)
        .rot_x(PI / 2.0)
        .set_scale(1.16, 1.20, 2.10)
        .set_pos(sh_x, sh_y, sh_z);
    for dy in [0.095, 0.0, -0.095] {
        m.add_mesh(g, bx(0.030 * HEX_R, 0.070 * HEX_R, 0.016 * HEX_R), m_black)
            .set_pos(
                sh_x - 0.036 * HEX_R,
                sh_y + dy * HEX_R,
                sh_z + 0.010 * HEX_R,
            );
    }
    m.add_mesh(g, bx(0.018 * HEX_R, 0.320 * HEX_R, 0.016 * HEX_R), m_wood)
        .set_pos(sh_x + 0.012 * HEX_R, sh_y, sh_z + 0.010 * HEX_R);

    let m_pole = m.mat(0x6b_4a26, 0.10, 0.70);
    add_super_banner(&mut m, m_pole, m_owner, m_white);
    let m_boot = m.mat(COLOR_SKIN_DARK, 0.05, 0.85);
    add_boots(&mut m, m_boot);
    let m_hand = m.mat(COLOR_SKIN_DARK, 0.05, 0.85);
    add_hands(&mut m, m_hand);
    m
}

/// `buildInkaRoyalGuard(ownerColor)` (`units.ts:5343-5546`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_inka_royal_guard(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN_DARK, COLOR_OCHRE, owner);
    let g = ROOT;
    let m_ochre = m.mat(COLOR_OCHRE, 0.06, 0.80);
    let m_gold = m.mat(COLOR_GOLD_BR, 0.62, 0.28);
    let m_red = m.mat(COLOR_RED_VIV, 0.06, 0.78);
    let m_teal = m.mat(COLOR_TEAL, 0.06, 0.78);
    let m_green = m.mat(COLOR_FOREST, 0.06, 0.78);
    let m_feath = m.mat(COLOR_FEATHER, 0.03, 0.92);
    let m_owner = m.mat(owner, 0.16, 0.62);
    let m_wood = m.mat(0x6b_4a26, 0.05, 0.85);
    let m_steel = m.mat(COLOR_STEEL, 0.50, 0.40);

    m.add_mesh(g, part(UnitPart::CuirassBox), m_ochre)
        .set_scale(1.02, 1.04, 1.02)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    for (dy, m_band) in [(0.07, m_gold), (0.0, m_red), (-0.07, m_gold)] {
        m.add_mesh(g, bx(0.190 * HEX_R, 0.020 * HEX_R, 0.135 * HEX_R), m_band)
            .set_pos(0.0, AV_Y_TORSO_CTR + dy * HEX_R, 0.003 * HEX_R);
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, part(UnitPart::ShoulderPad), m_gold).set_pos(
            sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R),
            AV_Y_TORSO_TOP - 0.015 * HEX_R,
            0.0,
        );
    }

    let pun_z = AV_TORSO_D * 0.5 + 0.026 * HEX_R;
    let pun_y = AV_Y_TORSO_CTR + 0.060 * HEX_R;
    m.add_mesh(g, bx(0.150 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R), m_red)
        .set_pos(0.0, pun_y, pun_z);
    m.add_mesh(
        g,
        cyl(0.044 * HEX_R, 0.044 * HEX_R, 0.014 * HEX_R, 14),
        m_gold,
    )
    .rot_x(PI / 2.0)
    .set_pos(0.0, pun_y, pun_z + 0.008 * HEX_R);
    for i in 0..8 {
        let ang = (f64::from(i) * PI * 2.0) / 8.0;
        m.add_mesh(g, bx(0.013 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R), m_gold)
            .rot_z(ang)
            .set_pos(
                js_sin(ang) * 0.056 * HEX_R,
                pun_y + js_cos(ang) * 0.056 * HEX_R,
                pun_z + 0.006 * HEX_R,
            );
    }
    add_tunic_hem(&mut m, m_gold);

    m.add_mesh(g, bx(0.148 * HEX_R, 0.032 * HEX_R, 0.148 * HEX_R), m_red)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.029 * HEX_R, 0.0);
    for px in [-0.048, -0.016, 0.016, 0.048] {
        m.add_mesh(g, bx(0.022 * HEX_R, 0.034 * HEX_R, 0.018 * HEX_R), m_gold)
            .set_pos(px * HEX_R, AV_Y_HEAD_TOP + 0.012 * HEX_R, 0.0);
    }
    let feat_colors = [
        m_red, m_teal, m_green, m_feath, m_owner, m_red, m_teal, m_green,
    ];
    for (fi, col) in (0..8).zip(feat_colors) {
        let ax = (f64::from(fi) - 3.5) * 0.16;
        m.add_mesh(g, bx(0.016 * HEX_R, 0.140 * HEX_R, 0.010 * HEX_R), col)
            .rot_z(ax)
            .set_pos(
                js_sin(ax) * 0.050 * HEX_R,
                AV_Y_HEAD_TOP + 0.100 * HEX_R,
                -0.006 * HEX_R,
            );
    }

    let m_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
    let m_hand_y = AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.022 * HEX_R;
    let m_haft_len = 0.340 * HEX_R;
    let m_haft_bot = m_hand_y - 0.063 * HEX_R;
    let m_haft_top = m_haft_bot + m_haft_len;
    m.add_mesh(g, bx(0.030 * HEX_R, m_haft_len, 0.030 * HEX_R), m_wood)
        .set_pos(m_x, m_haft_bot + m_haft_len * 0.5, 0.01 * HEX_R);
    let hub_y = m_haft_top + 0.025 * HEX_R;
    m.add_mesh(g, bx(0.050 * HEX_R, 0.050 * HEX_R, 0.050 * HEX_R), m_gold)
        .set_pos(m_x, hub_y, 0.01 * HEX_R);
    for ang in [
        0.0,
        PI / 3.0,
        (2.0 * PI) / 3.0,
        PI,
        (4.0 * PI) / 3.0,
        (5.0 * PI) / 3.0,
    ] {
        m.add_mesh(g, bx(0.054 * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R), m_gold)
            .rot_z(ang)
            .set_pos(
                m_x + js_cos(ang) * 0.032 * HEX_R,
                hub_y + js_sin(ang) * 0.032 * HEX_R,
                0.01 * HEX_R,
            );
    }

    let tux = AV_ARM_OFFSET_X * 0.25;
    m.add_mesh(g, bx(0.050 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R), m_gold)
        .rot_z(0.25)
        .set_pos(
            -tux,
            AV_Y_TORSO_BOT + 0.03 * HEX_R,
            AV_TORSO_D * 0.5 + 0.012 * HEX_R,
        );
    m.add_mesh(g, bx(0.042 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R), m_steel)
        .rot_z(0.25)
        .set_pos(
            -tux + 0.002 * HEX_R,
            AV_Y_TORSO_BOT + 0.060 * HEX_R,
            AV_TORSO_D * 0.5 + 0.012 * HEX_R,
        );

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R);
    let sh_z = 0.046 * HEX_R;
    m.add_mesh(g, bx(0.135 * HEX_R, 0.210 * HEX_R, 0.018 * HEX_R), m_owner)
        .set_pos(sh_x, AV_Y_TORSO_CTR, sh_z);
    for dy in [0.045, -0.045] {
        m.add_mesh(g, bx(0.135 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R), m_gold)
            .set_pos(sh_x, AV_Y_TORSO_CTR + dy * HEX_R, sh_z + 0.004 * HEX_R);
    }
    for dy in [0.100, -0.100] {
        m.add_mesh(g, bx(0.135 * HEX_R, 0.012 * HEX_R, 0.022 * HEX_R), m_gold)
            .set_pos(sh_x, AV_Y_TORSO_CTR + dy * HEX_R, sh_z + 0.004 * HEX_R);
    }

    let m_pole = m.mat(0x6b_4a26, 0.10, 0.70);
    add_super_banner(&mut m, m_pole, m_owner, m_gold);
    let m_boot = m.mat(COLOR_SKIN_DARK, 0.05, 0.85);
    add_boots(&mut m, m_boot);
    let m_hand = m.mat(COLOR_SKIN_DARK, 0.05, 0.85);
    add_hands(&mut m, m_hand);
    m
}
