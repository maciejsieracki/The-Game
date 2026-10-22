//! The named models of `render/units.ts` that no `units.json` record reaches
//! (P4-7 §4.1 #1–4, #7; D-MOD-3 = B "port all existing models"):
//! `buildHierosLochos` (`:1811`), `buildCrossbowman` (`:2595`),
//! `buildCeltWarrior` (`:2724`), `buildGermanWarrior` (`:3037`) and the dead
//! `buildBerserker` (`:3098`). Gallery-only: they have a [`Base`] but no row
//! in the D-MOD-9 rule table.
//!
//! [`Base`]: super::registry::Base

use super::avatar::{
    add_belt, add_boots, add_greaves, add_hands, add_long_hair, add_long_sword_right, add_mustache,
    add_pteruges, add_spear_right, add_tall_oval_shield, add_torc, add_tunic_hem,
    build_base_avatar, bx, part,
};
use super::consts::*;
use super::model::{UnitModel, ROOT};
use super::parts::UnitPart;
use std::f64::consts::PI;

/// `buildHierosLochos(ownerColor)` (`units.ts:1811-1914`).
#[must_use]
pub fn build_hieros_lochos(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_CRIMSON, owner);
    let g = ROOT;
    let m_bronze = m.mat(COLOR_BRONZE, 0.42, 0.42);
    let m_bronz_l = m.mat(COLOR_BRONZE_LT, 0.56, 0.32);
    let m_steel = m.mat(COLOR_STEEL, 0.52, 0.38);
    let m_crimson = m.mat(COLOR_CRIMSON, 0.08, 0.74);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);

    m.add_mesh(g, part(UnitPart::SuperCape), m_crimson)
        .set_scale(1.08, 1.05, 1.0)
        .set_pos(
            0.0,
            AV_Y_TORSO_CTR - 0.008 * HEX_R,
            -AV_TORSO_D * 0.5 - 0.007 * HEX_R,
        )
        .rot_x(0.15);
    m.add_mesh(g, part(UnitPart::CuirassBox), m_bronze)
        .set_scale(1.0, 1.0, 1.0)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    m.add_mesh(g, part(UnitPart::GildedTrim), m_bronz_l)
        .set_pos(0.0, AV_Y_TORSO_CTR + 0.032 * HEX_R, 0.001 * HEX_R);
    add_pteruges(&mut m, m_leath);

    m.add_mesh(g, part(UnitPart::CorinthDome), m_bronze)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.012 * HEX_R, 0.0);
    let m_slit = m.mat(0x1a_100a, 0.05, 0.92);
    m.add_mesh(g, bx(0.018 * HEX_R, 0.048 * HEX_R, 0.012 * HEX_R), m_slit)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR - 0.010 * HEX_R,
            AV_HEAD_S * 0.5 + 0.006 * HEX_R,
        );
    m.add_mesh(g, part(UnitPart::TransverseCrest), m_bronz_l)
        .rot_y(PI / 2.0)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.030 * HEX_R, 0.0);
    m.add_mesh(
        g,
        bx(0.028 * HEX_R, 0.105 * HEX_R, 0.140 * HEX_R),
        m_crimson,
    )
    .set_pos(0.0, AV_Y_HEAD_TOP + 0.090 * HEX_R, 0.0);

    let sp_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
    m.add_mesh(g, part(UnitPart::DoryShaft), m_wood).set_pos(
        sp_x,
        AV_Y_TORSO_CTR + 0.10 * HEX_R,
        0.010 * HEX_R,
    );
    m.add_mesh(g, part(UnitPart::SpearTip), m_steel).set_pos(
        sp_x,
        AV_Y_TORSO_CTR + 0.10 * HEX_R + 0.31 * HEX_R + 0.028 * HEX_R,
        0.010 * HEX_R,
    );
    m.add_mesh(g, part(UnitPart::Sauroter), m_bronz_l).set_pos(
        sp_x,
        AV_Y_TORSO_CTR + 0.10 * HEX_R - 0.31 * HEX_R - 0.022 * HEX_R,
        0.010 * HEX_R,
    );

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R);
    m.add_mesh(g, part(UnitPart::AspisRim), m_bronz_l)
        .rot_z(PI / 2.0)
        .set_scale(0.55, 1.0, 1.0)
        .set_pos(sh_x - 0.006 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    m.add_mesh(g, part(UnitPart::AspisFace), m_owner)
        .rot_z(PI / 2.0)
        .set_scale(0.55, 1.0, 1.0)
        .set_pos(sh_x, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    m.add_mesh(g, bx(0.100 * HEX_R, 0.014 * HEX_R, 0.012 * HEX_R), m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(sh_x, AV_Y_TORSO_CTR, 0.024 * HEX_R);
    m.add_mesh(g, bx(0.014 * HEX_R, 0.100 * HEX_R, 0.012 * HEX_R), m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(sh_x, AV_Y_TORSO_CTR, 0.024 * HEX_R);

    add_greaves(&mut m, m_bronz_l);
    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `buildCrossbowman(ownerColor)` (`units.ts:2595-2715`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_crossbowman(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_LACQUER, owner);
    let g = ROOT;
    let m_lac = m.mat(COLOR_LACQUER, 0.10, 0.55);
    let m_bronze = m.mat(COLOR_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(COLOR_BRONZE_LT, 0.52, 0.38);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.10, 0.68);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);
    let m_str = m.mat(0xe8_e0cc, 0.02, 0.95);

    m.add_mesh(g, part(UnitPart::CuirassBox), m_lac)
        .set_scale(1.0, 1.04, 1.0)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    for dy in [0.06, 0.0, -0.06] {
        m.add_mesh(
            g,
            bx(0.215 * HEX_R, 0.016 * HEX_R, 0.135 * HEX_R),
            m_bronz_l,
        )
        .set_pos(0.0, AV_Y_TORSO_CTR + dy * HEX_R, 0.002 * HEX_R);
    }
    let m_hem = m.mat(COLOR_LACQUER, 0.06, 0.6);
    add_tunic_hem(&mut m, m_hem);

    m.add_mesh(g, part(UnitPart::MeleeHelm), m_bronze).set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.026 * HEX_R,
        0.0,
    );
    m.add_mesh(
        g,
        bx(0.016 * HEX_R, 0.062 * HEX_R, 0.016 * HEX_R),
        m_bronz_l,
    )
    .set_pos(0.0, AV_Y_HEAD_TOP + 0.060 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.155 * HEX_R, 0.042 * HEX_R, 0.032 * HEX_R), m_owner)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR - 0.030 * HEX_R,
            -AV_HEAD_S * 0.5 - 0.005 * HEX_R,
        );

    let cb_x = 0.0;
    let cb_y = AV_Y_TORSO_CTR + 0.02 * HEX_R;
    let cb_z = AV_TORSO_D * 0.5 + 0.05 * HEX_R;
    m.add_mesh(g, bx(0.028 * HEX_R, 0.024 * HEX_R, 0.28 * HEX_R), m_wood)
        .set_pos(cb_x, cb_y, cb_z + 0.04 * HEX_R);
    m.add_mesh(g, bx(0.040 * HEX_R, 0.036 * HEX_R, 0.040 * HEX_R), m_bronze)
        .set_pos(cb_x, cb_y, cb_z + 0.02 * HEX_R);
    m.add_mesh(g, bx(0.26 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R), m_wood)
        .set_pos(cb_x, cb_y + 0.004 * HEX_R, cb_z - 0.09 * HEX_R);
    m.add_mesh(g, bx(0.25 * HEX_R, 0.006 * HEX_R, 0.006 * HEX_R), m_str)
        .set_pos(cb_x, cb_y + 0.014 * HEX_R, cb_z - 0.09 * HEX_R);
    for px in [-0.120 * HEX_R, 0.120 * HEX_R] {
        m.add_mesh(
            g,
            bx(0.016 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R),
            m_bronz_l,
        )
        .set_pos(px, cb_y + 0.004 * HEX_R, cb_z - 0.09 * HEX_R);
    }
    m.add_mesh(g, bx(0.012 * HEX_R, 0.012 * HEX_R, 0.14 * HEX_R), m_wood)
        .set_pos(cb_x, cb_y + 0.018 * HEX_R, cb_z - 0.02 * HEX_R);
    m.add_mesh(
        g,
        bx(0.014 * HEX_R, 0.014 * HEX_R, 0.030 * HEX_R),
        m_bronz_l,
    )
    .set_pos(cb_x, cb_y + 0.018 * HEX_R, cb_z - 0.09 * HEX_R);
    let m_fl = m.mat(COLOR_FEATHER, 0.03, 0.92);
    m.add_mesh(g, bx(0.030 * HEX_R, 0.016 * HEX_R, 0.020 * HEX_R), m_fl)
        .set_pos(cb_x, cb_y + 0.020 * HEX_R, cb_z + 0.10 * HEX_R);

    m.add_mesh(g, bx(0.050 * HEX_R, 0.080 * HEX_R, 0.040 * HEX_R), m_leath)
        .set_pos(
            0.04 * HEX_R,
            AV_Y_TORSO_CTR + 0.04 * HEX_R,
            -AV_TORSO_D * 0.5 - 0.024 * HEX_R,
        );
    for bxo in [-0.014 * HEX_R, 0.014 * HEX_R] {
        m.add_mesh(g, bx(0.010 * HEX_R, 0.010 * HEX_R, 0.030 * HEX_R), m_owner)
            .set_pos(
                0.04 * HEX_R + bxo,
                AV_Y_TORSO_CTR + 0.06 * HEX_R,
                -AV_TORSO_D * 0.5 - 0.040 * HEX_R,
            );
    }
    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `buildCeltWarrior(ownerColor)` (`units.ts:2724-2760`).
#[must_use]
pub fn build_celt_warrior(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_BURGUNDY, owner);
    let g = ROOT;
    let m_iron = m.mat(COLOR_STEEL, 0.55, 0.40);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_bronz = m.mat(COLOR_BRONZE, 0.45, 0.42);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_hair = m.mat(0xb8_702a, 0.04, 0.86);
    let m_plank = m.mat(0x6e_4a26, 0.05, 0.85);

    let m_hem = m.mat(COLOR_OCHRE, 0.05, 0.86);
    add_tunic_hem(&mut m, m_hem);
    let m_belt = m.mat(COLOR_LEATHER, 0.06, 0.82);
    add_belt(&mut m, m_belt, 0.025);
    m.add_mesh(
        g,
        bx(0.030 * HEX_R, AV_TORSO_H * 0.9, 0.010 * HEX_R),
        m_owner,
    )
    .set_pos(
        0.04 * HEX_R,
        AV_Y_TORSO_CTR,
        AV_TORSO_D * 0.5 + 0.004 * HEX_R,
    );

    add_torc(&mut m, m_bronz);
    add_mustache(&mut m, m_hair);
    add_long_hair(&mut m, m_hair);
    add_long_sword_right(&mut m, m_iron, m_wood, 0.32, "");
    add_tall_oval_shield(&mut m, m_owner, m_plank, m_iron, 1.85, "");

    let m_boot = m.mat(COLOR_LEATHER, 0.05, 0.86);
    add_boots(&mut m, m_boot);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `buildGermanWarrior(ownerColor)` (`units.ts:3037-3092`).
#[must_use]
pub fn build_german_warrior(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_FUR, owner);
    let g = ROOT;
    let m_fur = m.mat(COLOR_FUR, 0.04, 0.92);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_steel = m.mat(COLOR_STEEL, 0.50, 0.42);
    let m_hide = m.mat(0x7a_5a34, 0.05, 0.86);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_hair = m.mat(0xd8_b25a, 0.04, 0.86);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);

    m.add_mesh(g, part(UnitPart::Cloak), m_fur)
        .set_scale(0.95, 0.85, 1.0)
        .set_pos(
            0.0,
            AV_Y_TORSO_CTR - 0.01 * HEX_R,
            -AV_TORSO_D * 0.5 - 0.010 * HEX_R,
        )
        .rot_x(0.12);
    m.add_mesh(g, bx(0.22 * HEX_R, 0.06 * HEX_R, 0.14 * HEX_R), m_fur)
        .set_pos(0.0, AV_Y_TORSO_TOP - 0.02 * HEX_R, 0.0);
    add_belt(&mut m, m_leath, 0.025);
    add_long_hair(&mut m, m_hair);
    add_mustache(&mut m, m_hair);
    add_spear_right(&mut m, m_wood, m_steel, 0.40, "");

    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R);
    m.add_mesh(g, part(UnitPart::OvalShield), m_hide)
        .rot_z(PI / 2.0)
        .set_scale(1.0, 1.35, 1.35)
        .set_pos(sh_x, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    m.add_mesh(g, part(UnitPart::OvalShield), m_owner)
        .rot_z(PI / 2.0)
        .set_scale(0.9, 1.45, 1.45)
        .set_pos(sh_x - 0.006 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    m.add_mesh(g, part(UnitPart::ShieldBoss), m_steel)
        .rot_z(PI / 2.0)
        .set_pos(sh_x + 0.014 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// Dead `buildBerserker(ownerColor)` (`units.ts:3098-3160`; the record uses
/// `buildBerserker` of `jednostki-z3-plemiona.ts`).
#[must_use]
pub fn build_berserker_old(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_SKIN, owner);
    let g = ROOT;
    let m_pelt = m.mat(0x5a_4630, 0.04, 0.94);
    let m_pelt_l = m.mat(0x7a_6446, 0.04, 0.92);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_iron = m.mat(COLOR_STEEL, 0.55, 0.40);
    let _m_owner = m.mat(owner, 0.12, 0.66);
    let m_hair = m.mat(0xd8_b25a, 0.04, 0.86);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);

    m.add_mesh(g, part(UnitPart::Cloak), m_pelt)
        .set_scale(1.0, 1.05, 1.0)
        .set_pos(
            0.0,
            AV_Y_TORSO_CTR - 0.02 * HEX_R,
            -AV_TORSO_D * 0.5 - 0.012 * HEX_R,
        )
        .rot_x(0.16);
    m.add_mesh(g, part(UnitPart::Loincloth), m_leath)
        .set_scale(0.85, 0.6, 0.95)
        .set_pos(0.0, AV_Y_TORSO_BOT - 0.01 * HEX_R, 0.0);
    add_long_hair(&mut m, m_hair);
    m.add_mesh(g, part(UnitPart::Hood), m_pelt)
        .set_scale(1.05, 1.1, 1.15)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.020 * HEX_R, -0.004 * HEX_R);
    m.add_mesh(g, bx(0.060 * HEX_R, 0.050 * HEX_R, 0.075 * HEX_R), m_pelt_l)
        .set_pos(
            0.0,
            AV_Y_HEAD_TOP + 0.020 * HEX_R,
            AV_HEAD_S * 0.5 + 0.010 * HEX_R,
        );
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, bx(0.028 * HEX_R, 0.045 * HEX_R, 0.022 * HEX_R), m_pelt_l)
            .set_pos(
                sx * 0.055 * HEX_R,
                AV_Y_HEAD_TOP + 0.075 * HEX_R,
                -0.01 * HEX_R,
            );
    }
    let ax_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R;
    m.add_mesh(g, bx(0.018 * HEX_R, 0.30 * HEX_R, 0.018 * HEX_R), m_wood)
        .set_pos(ax_x, AV_Y_TORSO_CTR + 0.10 * HEX_R, 0.02 * HEX_R);
    m.add_mesh(g, bx(0.10 * HEX_R, 0.085 * HEX_R, 0.020 * HEX_R), m_iron)
        .set_pos(
            ax_x + 0.04 * HEX_R,
            AV_Y_TORSO_CTR + 0.22 * HEX_R,
            0.02 * HEX_R,
        );
    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}
