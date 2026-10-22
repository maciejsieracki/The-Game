//! `buildCategoryModel` (20 `case` labels, `render/units.ts:3700-4768`),
//! `decorateChariot` (`:1389-1488`), `applyCultureOverrides` (`:5559-5683`)
//! and `attachEmbarkBoat` (`:5700-5752`).
//!
//! Cases whose geometry lives in another package delegate to it (MOD-05
//! [`crate::models::units_kamien`], MOD-07 [`crate::models::units_zelazo`]);
//! [`NotYetPorted`](super::registry::NotYetPorted) stays only in the
//! signature (see [`super::registry::pending`], empty since MOD-07).

use super::avatar::{
    add_boots, add_greaves, add_hands, add_hip_sword, add_owner_helm_stripe, add_pteruges,
    build_base_avatar, bx, cyl, part,
};
use super::consts::*;
use super::galera::{build_galera, GaleraPoza};
use super::horse::build_horse;
use super::jstrig::JsTrig;
use super::model::{set_celtic_retint, CelticRetint, Geo, Material, NodeId, Prim, UnitModel, ROOT};
use super::p1;
use super::parts::UnitPart;
use super::registry::{Base, NotYetPorted};
use super::routing::Culture;
use crate::geom::Vec3;
use std::f64::consts::PI;

/// Model category key (`categoryOf`, `units/setup.ts:239`) as understood by
/// `buildCategoryModel`. `legion`/`legionary`/`legionista` share one body,
/// unknown labels fall into `default` = [`UnitCategory::Domyslny`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[allow(missing_docs)]
pub enum UnitCategory {
    Falanga,
    Legion,
    Legionary,
    Legionista,
    Osadnik,
    Miecznik,
    Wlocznik,
    Lucznik,
    Procarz,
    Oszczepnik,
    Maczuga,
    Topor,
    Konnica,
    Rydwan,
    Super,
    Zwiadowca,
    Robotnik,
    Galera,
    Obleznicza,
    Domyslny,
}

impl UnitCategory {
    /// The 20 `case` labels in source order.
    pub const ALL: [Self; 20] = [
        Self::Falanga,
        Self::Legion,
        Self::Legionary,
        Self::Legionista,
        Self::Osadnik,
        Self::Miecznik,
        Self::Wlocznik,
        Self::Lucznik,
        Self::Procarz,
        Self::Oszczepnik,
        Self::Maczuga,
        Self::Topor,
        Self::Konnica,
        Self::Rydwan,
        Self::Super,
        Self::Zwiadowca,
        Self::Robotnik,
        Self::Galera,
        Self::Obleznicza,
        Self::Domyslny,
    ];

    /// The web label (`'falanga'`, ...).
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Falanga => "falanga",
            Self::Legion => "legion",
            Self::Legionary => "legionary",
            Self::Legionista => "legionista",
            Self::Osadnik => "osadnik",
            Self::Miecznik => "miecznik",
            Self::Wlocznik => "wlocznik",
            Self::Lucznik => "lucznik",
            Self::Procarz => "procarz",
            Self::Oszczepnik => "oszczepnik",
            Self::Maczuga => "maczuga",
            Self::Topor => "topor",
            Self::Konnica => "konnica",
            Self::Rydwan => "rydwan",
            Self::Super => "super",
            Self::Zwiadowca => "zwiadowca",
            Self::Robotnik => "robotnik",
            Self::Galera => "galera",
            Self::Obleznicza => "obleznicza",
            Self::Domyslny => "domyslny",
        }
    }

    /// `switch (category)` dispatch: exact label match, anything else is the
    /// `default` branch.
    #[must_use]
    pub fn from_label(s: &str) -> Self {
        Self::ALL
            .into_iter()
            .find(|c| c.label() == s)
            .unwrap_or(Self::Domyslny)
    }

    /// The builder this category resolves to (identical geometry ⇒ same
    /// [`Base`]): `legion`/`legionary` → legionista body, `falanga` →
    /// `buildFalangita`, `obleznicza` → `buildBatteringRam`, `domyslny` →
    /// `buildWojownikOpus5`, ...
    #[must_use]
    pub const fn base(self) -> Base {
        match self {
            Self::Falanga => Base::Falangita,
            Self::Legion | Self::Legionary | Self::Legionista => Base::CatLegionista,
            Self::Osadnik => Base::CatOsadnik,
            Self::Miecznik => Base::P1Miecznik,
            Self::Wlocznik => Base::P1Wlocznik,
            Self::Procarz => Base::P1Procarz,
            Self::Lucznik => Base::LucznikOpus5,
            Self::Oszczepnik => Base::OszczepnikOpus5,
            Self::Zwiadowca => Base::ZwiadowcaOpus5,
            Self::Maczuga => Base::CatMaczuga,
            Self::Topor => Base::CatTopor,
            Self::Konnica => Base::CatKonnica,
            Self::Rydwan => Base::CatRydwan,
            Self::Super => Base::CatSuper,
            Self::Robotnik => Base::CatRobotnik,
            Self::Galera => Base::Galera,
            Self::Obleznicza => Base::BatteringRam,
            Self::Domyslny => Base::WojownikOpus5,
        }
    }

    /// `applyCultureOverrides` returns early for this category
    /// (`units.ts:5566`, `NEW_BESPOKE_CATEGORIES` `:5573`).
    #[must_use]
    pub const fn skips_culture_overrides(self) -> bool {
        matches!(
            self,
            Self::Konnica
                | Self::Rydwan
                | Self::Galera
                | Self::Falanga
                | Self::Miecznik
                | Self::Wlocznik
                | Self::Lucznik
                | Self::Procarz
                | Self::Oszczepnik
                | Self::Zwiadowca
                | Self::Domyslny
        )
    }
}

/// `buildCategoryModel(category, ownerColor)`.
///
/// # Errors
/// [`NotYetPorted`] only if a delegated package lacked the builder (none
/// since MOD-07; kept for the public signature); `lucznik`, `oszczepnik`,
/// `zwiadowca`, `obleznicza`, `domyslny` build the MOD-05 Stone models,
/// `falanga` the MOD-07 Iron `buildFalangita`.
pub fn build_category_model(cat: UnitCategory, owner: u32) -> Result<UnitModel, NotYetPorted> {
    match cat {
        UnitCategory::Legion | UnitCategory::Legionary | UnitCategory::Legionista => {
            Ok(cat_legionista(owner))
        }
        UnitCategory::Osadnik => Ok(cat_osadnik(owner)),
        UnitCategory::Miecznik => Ok(p1::build_miecznik(owner)),
        UnitCategory::Wlocznik => Ok(p1::build_wlocznik(owner)),
        UnitCategory::Procarz => Ok(p1::build_procarz(owner)),
        UnitCategory::Maczuga => Ok(cat_maczuga(owner)),
        UnitCategory::Topor => Ok(cat_topor(owner)),
        UnitCategory::Konnica => Ok(cat_konnica(owner)),
        UnitCategory::Rydwan => Ok(cat_rydwan(owner)),
        UnitCategory::Super => Ok(cat_super(owner)),
        UnitCategory::Robotnik => Ok(cat_robotnik(owner)),
        UnitCategory::Galera => Ok(build_galera(owner, GaleraPoza::Plyniecie)),
        // MOD-05 Stone (`R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1`):
        // `kamien-bazowe-opus5` / `kamien-zulu-taran-opus5`.
        UnitCategory::Lucznik
        | UnitCategory::Oszczepnik
        | UnitCategory::Zwiadowca
        | UnitCategory::Obleznicza
        | UnitCategory::Domyslny => crate::models::units_kamien::build(cat.base(), owner)
            .ok_or(NotYetPorted::of(cat.base())),
        // MOD-07 Iron (`R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1`):
        // `case 'falanga'` → `buildFalangita` (`units.ts:3704-3707`).
        UnitCategory::Falanga => crate::models::units_zelazo::build(cat.base(), owner)
            .ok_or(NotYetPorted::of(cat.base())),
    }
}

/// `case 'legion' | 'legionary' | 'legionista'` (`units.ts:3710-3845`).
#[allow(clippy::too_many_lines)]
fn cat_legionista(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_RED_VIV, owner);
    let g = ROOT;
    let m_steel = m.mat(COLOR_STEEL, 0.52, 0.38);
    let m_dark = m.mat(COLOR_DARK_STEEL, 0.40, 0.55);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_gold = m.mat(COLOR_GOLD_BR, 0.55, 0.35);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);
    let m_red = m.mat(COLOR_RED_VIV, 0.08, 0.74);

    for dy in [-0.07, -0.025, 0.02, 0.065] {
        m.add_mesh(g, part(UnitPart::LoricaBand), m_steel).set_pos(
            0.0,
            AV_Y_TORSO_CTR + dy * HEX_R,
            0.0,
        );
    }
    for dy in [-0.048, -0.003, 0.043] {
        m.add_mesh(g, part(UnitPart::CuirassGap), m_dark).set_pos(
            0.0,
            AV_Y_TORSO_CTR + dy * HEX_R,
            0.001 * HEX_R,
        );
    }
    for sx in [-1.0_f64, 1.0] {
        for dy in [0.0, 0.03] {
            m.add_mesh(g, part(UnitPart::ShoulderPad), m_steel)
                .set_scale(1.0, 0.5, 1.0)
                .set_pos(
                    sx * (AV_ARM_OFFSET_X - 0.004 * HEX_R),
                    AV_Y_TORSO_TOP - 0.02 * HEX_R + dy * HEX_R,
                    0.0,
                );
        }
    }
    add_pteruges(&mut m, m_red);

    let m_galea = m.mat(COLOR_BRONZE, 0.45, 0.45);
    let m_galea_l = m.mat(COLOR_BRONZE_LT, 0.50, 0.40);
    m.add_mesh(g, part(UnitPart::GaleaBowl), m_galea).set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.022 * HEX_R,
        0.0,
    );
    m.add_mesh(g, part(UnitPart::GaleaCap), m_galea).set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.022 * HEX_R + 0.0525 * HEX_R,
        0.0,
    );
    m.add_mesh(
        g,
        bx(0.165 * HEX_R, 0.022 * HEX_R, 0.030 * HEX_R),
        m_galea_l,
    )
    .set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.010 * HEX_R,
        AV_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    m.add_mesh(g, bx(0.170 * HEX_R, 0.030 * HEX_R, 0.060 * HEX_R), m_galea)
        .rot_x(-0.55)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR - 0.028 * HEX_R,
            -(AV_HEAD_S * 0.5 + 0.024 * HEX_R),
        );
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, part(UnitPart::CheekGuard), m_galea).set_pos(
            sx * (AV_HEAD_S * 0.5 + 0.004 * HEX_R),
            AV_Y_HEAD_CTR - 0.010 * HEX_R,
            0.028 * HEX_R,
        );
    }
    m.add_mesh(g, part(UnitPart::TransverseCrest), m_galea_l)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.052 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.140 * HEX_R, 0.080 * HEX_R, 0.026 * HEX_R), m_red)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.100 * HEX_R, 0.0);
    add_owner_helm_stripe(&mut m, m_owner, 0.018);

    let pil_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
    m.add_mesh(g, part(UnitPart::PilumShaft), m_wood).set_pos(
        pil_x,
        AV_Y_LEG_BOT + 0.21 * HEX_R,
        0.01 * HEX_R,
    );
    m.add_mesh(g, part(UnitPart::PilumHead), m_dark).set_pos(
        pil_x,
        AV_Y_LEG_BOT + 0.42 * HEX_R + 0.05 * HEX_R,
        0.01 * HEX_R,
    );
    m.add_mesh(g, part(UnitPart::JavTip), m_steel).set_pos(
        pil_x,
        AV_Y_LEG_BOT + 0.42 * HEX_R + 0.10 * HEX_R + 0.02 * HEX_R,
        0.01 * HEX_R,
    );

    add_hip_sword(&mut m, m_leath, m_gold, 1.0);

    let sc_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R);
    m.add_mesh(g, part(UnitPart::ScutumBody), m_owner)
        .set_pos(sc_x, AV_Y_TORSO_CTR, 0.02 * HEX_R);
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, bx(0.040 * HEX_R, 0.230 * HEX_R, 0.018 * HEX_R), m_owner)
            .rot_y(sx * 0.5)
            .set_pos(sc_x + sx * 0.080 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    }
    m.add_mesh(g, part(UnitPart::ScutumBoss), m_steel)
        .set_pos(sc_x, AV_Y_TORSO_CTR, 0.034 * HEX_R);
    for dy in [0.06, -0.06] {
        m.add_mesh(g, bx(0.10 * HEX_R, 0.018 * HEX_R, 0.012 * HEX_R), m_gold)
            .set_pos(sc_x, AV_Y_TORSO_CTR + dy * HEX_R, 0.031 * HEX_R);
    }

    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `case 'osadnik'` (`units.ts:3848-3916`).
fn cat_osadnik(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, 0x2f_5aa0, owner);
    let g = ROOT;
    let m_straw = m.mat(COLOR_SAND, 0.03, 0.95);
    let m_pack = m.mat(COLOR_LEATHER, 0.05, 0.85);
    let m_vest = m.mat(0x27_4d8c, 0.05, 0.85);
    let m_green = m.mat(0x3f_6b3a, 0.05, 0.88);
    let m_boot_o = m.mat(0x4a_3526, 0.05, 0.88);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_roll = m.mat(0xb8_784a, 0.04, 0.90);
    let m_band2 = m.mat(owner, 0.08, 0.70);

    m.add_mesh(g, part(UnitPart::StrawBrim), m_straw).set_pos(
        0.0,
        AV_Y_HEAD_TOP + 0.006 * HEX_R,
        0.0,
    );
    m.add_mesh(g, part(UnitPart::StrawCrown), m_straw).set_pos(
        0.0,
        AV_Y_HEAD_TOP + 0.036 * HEX_R,
        0.0,
    );
    m.add_mesh(g, bx(0.118 * HEX_R, 0.016 * HEX_R, 0.118 * HEX_R), m_band2)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.012 * HEX_R, 0.0);
    m.add_mesh(g, part(UnitPart::Backpack), m_pack).set_pos(
        0.0,
        AV_Y_TORSO_CTR + 0.01 * HEX_R,
        -(AV_TORSO_D * 0.5 + 0.022 * HEX_R),
    );
    m.add_mesh(g, part(UnitPart::Bedroll), m_roll)
        .rot_z(PI / 2.0)
        .set_pos(
            0.0,
            AV_Y_TORSO_CTR + 0.075 * HEX_R,
            -(AV_TORSO_D * 0.5 + 0.030 * HEX_R),
        );
    let staff_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
    m.add_mesh(g, part(UnitPart::Staff), m_wood).set_pos(
        staff_x,
        AV_Y_LEG_BOT + 0.26 * HEX_R,
        0.02 * HEX_R,
    );
    m.add_mesh(g, bx(0.135 * HEX_R, 0.20 * HEX_R, 0.115 * HEX_R), m_vest)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.004 * HEX_R);
    m.add_mesh(g, bx(0.020 * HEX_R, 0.20 * HEX_R, 0.012 * HEX_R), m_band2)
        .set_pos(0.0, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.006 * HEX_R);
    for sx in [-(AV_LEG_SEP + AV_LEG_W * 0.5), AV_LEG_SEP + AV_LEG_W * 0.5] {
        m.add_mesh(
            g,
            bx(AV_LEG_W * 1.04, AV_LEG_H * 0.92, AV_LEG_W * 1.04),
            m_green,
        )
        .set_pos(sx, AV_Y_LEG_CTR + 0.01 * HEX_R, 0.0);
    }
    add_boots(&mut m, m_boot_o);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `case 'maczuga'` (`units.ts:3949-4030`).
fn cat_maczuga(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN_DARK, COLOR_SKIN_DARK, owner);
    let g = ROOT;
    let m_wood = m.mat(0x6b_4a26, 0.05, 0.85);
    let m_stone = m.mat(0x7a_756c, 0.10, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.68);
    let m_fur = m.mat(COLOR_OCHRE, 0.05, 0.88);
    let m_paint = m.mat(COLOR_RED_VIV, 0.05, 0.78);
    let m_feath = m.mat(COLOR_PAINT_WHT, 0.03, 0.92);

    m.add_mesh(g, part(UnitPart::Loincloth), m_fur).set_pos(
        0.0,
        AV_Y_TORSO_BOT + 0.02 * HEX_R,
        0.0,
    );
    m.add_mesh(g, bx(0.026 * HEX_R, 0.22 * HEX_R, 0.012 * HEX_R), m_paint)
        .rot_z(0.7)
        .set_pos(0.0, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.005 * HEX_R);
    let m_hide = m.mat(0x5a_3a22, 0.05, 0.86);
    m.add_mesh(g, part(UnitPart::SkullCap), m_hide).set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.028 * HEX_R,
        0.0,
    );
    m.add_mesh(g, part(UnitPart::GaleaCap), m_hide)
        .set_scale(0.92, 0.62, 0.92)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.028 * HEX_R + 0.032 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.150 * HEX_R, 0.024 * HEX_R, 0.150 * HEX_R), m_owner)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.020 * HEX_R, 0.0);
    for a in [-0.35_f64, 0.0, 0.35] {
        let mat = if a == 0.0 { m_owner } else { m_feath };
        m.add_mesh(g, bx(0.016 * HEX_R, 0.085 * HEX_R, 0.009 * HEX_R), mat)
            .rot_z(a)
            .set_pos(
                a.js_sin() * 0.03 * HEX_R,
                AV_Y_HEAD_TOP + 0.05 * HEX_R,
                -0.03 * HEX_R,
            );
    }
    let club_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
    m.add_mesh(g, part(UnitPart::ClubHandle), m_wood).set_pos(
        club_x,
        AV_Y_TORSO_TOP + 0.02 * HEX_R,
        0.01 * HEX_R,
    );
    m.add_mesh(g, part(UnitPart::ClubKnob), m_stone).set_pos(
        club_x,
        AV_Y_TORSO_TOP + 0.175 * HEX_R + 0.028 * HEX_R,
        0.01 * HEX_R,
    );
    for dz in [-0.022 * HEX_R, 0.022 * HEX_R] {
        m.add_mesh(g, bx(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R), m_owner)
            .set_pos(club_x + 0.028 * HEX_R, AV_Y_TORSO_TOP + 0.20 * HEX_R, dz);
    }
    let m_feet = m.mat(COLOR_SKIN_DARK, 0.05, 0.85);
    add_boots(&mut m, m_feet);
    let m_hand = m.mat(COLOR_SKIN_DARK, 0.05, 0.85);
    add_hands(&mut m, m_hand);
    m
}

/// `case 'topor'` (`units.ts:4033-4122`).
fn cat_topor(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_BURGUNDY, owner);
    let g = ROOT;
    let m_steel = m.mat(COLOR_STEEL, 0.50, 0.40);
    let m_dark = m.mat(COLOR_DARK_STEEL, 0.40, 0.55);
    let m_wood = m.mat(0x6b_4a26, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_fur = m.mat(COLOR_FUR, 0.04, 0.92);
    let m_leath = m.mat(0x5a_3c22, 0.06, 0.82);

    m.add_mesh(g, bx(0.195 * HEX_R, 0.20 * HEX_R, 0.125 * HEX_R), m_leath)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    m.add_mesh(g, bx(0.26 * HEX_R, 0.06 * HEX_R, 0.16 * HEX_R), m_fur)
        .set_pos(0.0, AV_Y_TORSO_TOP - 0.01 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.20 * HEX_R, 0.026 * HEX_R, 0.13 * HEX_R), m_owner)
        .set_pos(0.0, AV_Y_TORSO_BOT + 0.03 * HEX_R, 0.0);

    let m_brnz = m.mat(COLOR_BRONZE, 0.35, 0.50);
    m.add_mesh(
        g,
        cyl(0.086 * HEX_R, 0.096 * HEX_R, 0.080 * HEX_R, 12),
        m_leath,
    )
    .set_pos(0.0, AV_Y_HEAD_CTR + 0.028 * HEX_R, 0.0);
    m.add_mesh(
        g,
        cyl(0.100 * HEX_R, 0.100 * HEX_R, 0.030 * HEX_R, 12),
        m_fur,
    )
    .set_pos(0.0, AV_Y_HEAD_CTR - 0.006 * HEX_R, 0.0);
    m.add_mesh(g, part(UnitPart::GaleaCap), m_leath)
        .set_scale(0.94, 0.66, 0.94)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.028 * HEX_R + 0.038 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.180 * HEX_R, 0.024 * HEX_R, 0.032 * HEX_R), m_brnz)
        .set_pos(
            0.0,
            AV_Y_HEAD_CTR + 0.006 * HEX_R,
            AV_HEAD_S * 0.5 + 0.004 * HEX_R,
        );

    let axe_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.015 * HEX_R;
    m.add_mesh(g, bx(0.018 * HEX_R, 0.24 * HEX_R, 0.018 * HEX_R), m_wood)
        .set_pos(axe_x, AV_Y_TORSO_CTR + 0.06 * HEX_R, 0.01 * HEX_R);
    m.add_mesh(g, bx(0.10 * HEX_R, 0.085 * HEX_R, 0.020 * HEX_R), m_steel)
        .set_pos(
            axe_x + 0.045 * HEX_R,
            AV_Y_TORSO_TOP + 0.06 * HEX_R,
            0.01 * HEX_R,
        );
    m.add_mesh(g, bx(0.07 * HEX_R, 0.055 * HEX_R, 0.018 * HEX_R), m_steel)
        .set_pos(
            axe_x + 0.060 * HEX_R,
            AV_Y_TORSO_TOP + 0.012 * HEX_R,
            0.01 * HEX_R,
        );
    let m_edge = m.mat(COLOR_STEEL, 0.6, 0.30);
    m.add_mesh(g, bx(0.014 * HEX_R, 0.135 * HEX_R, 0.022 * HEX_R), m_edge)
        .set_pos(
            axe_x + 0.092 * HEX_R,
            AV_Y_TORSO_TOP + 0.035 * HEX_R,
            0.01 * HEX_R,
        );
    m.add_mesh(g, bx(0.024 * HEX_R, 0.05 * HEX_R, 0.024 * HEX_R), m_dark)
        .set_pos(axe_x, AV_Y_TORSO_TOP + 0.06 * HEX_R, 0.01 * HEX_R);

    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `case 'konnica'` (`units.ts:4125-4255`).
#[allow(clippy::too_many_lines)]
fn cat_konnica(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_horse = m.mat(COLOR_HORSE_LT, 0.10, 0.78);
    let m_mane = m.mat(0x1a_0e06, 0.05, 0.85);
    let m_skin = m.mat(COLOR_SKIN, 0.05, 0.80);
    let m_cloth = m.mat(COLOR_CRIMSON, 0.06, 0.78);
    let m_owner = m.mat(owner, 0.12, 0.68);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_steel = m.mat(COLOR_STEEL, 0.40, 0.50);

    let horse_back_y = build_horse(&mut m, g, m_horse, m_mane, None, 0.0, 0.0);

    let rider_bot = horse_back_y;
    let r_torso_ctr = rider_bot + AV_TORSO_H * 0.5;
    let r_torso_top = rider_bot + AV_TORSO_H;
    let r_head_ctr = r_torso_top + AV_NECK_H + AV_HEAD_S * 0.5;
    let r_arm_ctr = rider_bot + AV_TORSO_H * 0.55;

    m.add_mesh(g, part(UnitPart::AvTorso), m_cloth)
        .set_scale(0.85, 0.75, 0.85)
        .set_pos(0.0, r_torso_ctr, 0.0);
    m.add_mesh(g, bx(0.09 * HEX_R, 0.035 * HEX_R, 0.012 * HEX_R), m_owner)
        .set_pos(0.0, r_torso_ctr, AV_TORSO_D * 0.43 + 0.003 * HEX_R);
    let arm = bx(AV_ARM_W * 0.8, AV_ARM_H * 0.75, AV_ARM_D * 0.8);
    m.add_mesh(g, arm.clone(), m_cloth)
        .set_pos(-AV_ARM_OFFSET_X * 0.85, r_arm_ctr, 0.0);
    m.add_mesh(g, arm, m_cloth)
        .set_pos(AV_ARM_OFFSET_X * 0.85, r_arm_ctr, 0.0);
    m.add_mesh(
        g,
        bx(AV_HEAD_S * 0.85, AV_HEAD_S * 0.85, AV_HEAD_S * 0.85),
        m_skin,
    )
    .set_pos(0.0, r_head_ctr, 0.0);
    let r_eye_z = -(AV_HEAD_S * 0.85 * 0.5 + 0.002 * HEX_R);
    let eye = bx(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
    let m_eye_l = m.mat(COLOR_DARK_EYE, 0.02, 0.95);
    m.add_mesh(g, eye.clone(), m_eye_l).set_pos(
        -0.025 * HEX_R,
        r_head_ctr + 0.008 * HEX_R,
        r_eye_z,
    );
    let m_eye_r = m.mat(COLOR_DARK_EYE, 0.02, 0.95);
    m.add_mesh(g, eye, m_eye_r)
        .set_pos(0.025 * HEX_R, r_head_ctr + 0.008 * HEX_R, r_eye_z);
    m.add_mesh(
        g,
        cyl(0.052 * HEX_R, 0.060 * HEX_R, 0.055 * HEX_R, 8),
        m_steel,
    )
    .set_pos(0.0, r_head_ctr + AV_HEAD_S * 0.45, 0.0);
    let m_crest = m.mat(COLOR_RED_VIV, 0.08, 0.74);
    m.add_mesh(g, bx(0.020 * HEX_R, 0.055 * HEX_R, 0.085 * HEX_R), m_crest)
        .set_pos(0.0, r_head_ctr + AV_HEAD_S * 0.45 + 0.050 * HEX_R, 0.0);
    m.add_mesh(g, part(UnitPart::SaddleBlanket), m_owner)
        .set_pos(0.0, rider_bot - 0.012 * HEX_R, 0.01 * HEX_R);

    let rspear_x = AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.012 * HEX_R;
    let lance_th = PI * 0.5 + 0.34;
    let lance_axis = Vec3::new(0.0, lance_th.js_cos(), lance_th.js_sin());
    let lance_ctr = Vec3::new(rspear_x, r_arm_ctr + 0.075 * HEX_R, -0.085 * HEX_R);
    m.add_mesh(g, bx(0.016 * HEX_R, 0.56 * HEX_R, 0.016 * HEX_R), m_wood)
        .rot_x(lance_th)
        .set_pos_v(lance_ctr);
    m.add_mesh(g, part(UnitPart::SpearTip), m_steel)
        .rot_x(lance_th)
        .set_pos_v(lance_ctr.plus(lance_axis.scale(-0.295 * HEX_R)));
    m.add_mesh(g, bx(0.012 * HEX_R, 0.045 * HEX_R, 0.06 * HEX_R), m_owner)
        .rot_x(lance_th)
        .set_pos_v(
            lance_ctr
                .plus(lance_axis.scale(-0.225 * HEX_R))
                .plus(Vec3::new(0.0, -0.028 * HEX_R, 0.0)),
        );

    let rshield_x = -(AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.010 * HEX_R);
    m.add_mesh(g, part(UnitPart::OvalShield), m_owner)
        .rot_z(PI / 2.0)
        .set_scale(1.0, 0.95, 0.95)
        .set_pos(rshield_x, r_torso_ctr, 0.03 * HEX_R);
    m.add_mesh(g, part(UnitPart::ShieldBoss), m_steel)
        .rot_z(PI / 2.0)
        .set_pos(rshield_x - 0.012 * HEX_R, r_torso_ctr, 0.03 * HEX_R);

    m.node(g).rot_y(PI);
    m
}

/// `case 'rydwan'` (`units.ts:4258-4552`).
#[allow(clippy::too_many_lines)]
fn cat_rydwan(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(COLOR_CHARIOT, 0.05, 0.82);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_steel = m.mat(COLOR_STEEL, 0.45, 0.45);
    let m_bronze = m.mat(COLOR_BRONZE, 0.32, 0.52);
    let m_horse = m.mat(COLOR_HORSE_LT, 0.10, 0.78);
    let m_mane = m.mat(0x1a_0e06, 0.05, 0.85);
    let m_skin = m.mat(COLOR_SKIN, 0.05, 0.80);
    let m_cloth = m.mat(COLOR_LACQUER, 0.06, 0.78);
    let m_dark = m.mat(COLOR_TROUSERS, 0.05, 0.85);

    let wheel_r = 0.085 * HEX_R;
    let wheel_y = wheel_r;
    let axle_y = wheel_y;
    let car_floor_y = axle_y + wheel_r * 0.30;

    let wheel = cyl(wheel_r, wheel_r, 0.022 * HEX_R, 12);
    let rim = Geo::Prim(Prim::cyl_open(wheel_r, wheel_r, 0.028 * HEX_R, 12));
    m.add_mesh(g, wheel.clone(), m_wood)
        .rot_z(PI / 2.0)
        .set_pos(0.185 * HEX_R, wheel_y, -0.005 * HEX_R);
    m.add_mesh(g, rim.clone(), m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(0.185 * HEX_R, wheel_y, -0.005 * HEX_R);
    m.add_mesh(g, wheel, m_wood)
        .rot_z(PI / 2.0)
        .set_pos(-0.185 * HEX_R, wheel_y, -0.005 * HEX_R);
    m.add_mesh(g, rim, m_bronze)
        .rot_z(PI / 2.0)
        .set_pos(-0.185 * HEX_R, wheel_y, -0.005 * HEX_R);
    let spoke = bx(0.018 * HEX_R, wheel_r * 2.0 * 0.92, 0.016 * HEX_R);
    for sx in [0.185, -0.185] {
        m.add_mesh(g, spoke.clone(), m_wood)
            .rot_z(PI / 2.0)
            .set_pos(sx * HEX_R, wheel_y, -0.005 * HEX_R);
        m.add_mesh(g, spoke.clone(), m_wood)
            .rot_z(PI / 2.0)
            .rot_y(PI / 2.0)
            .set_pos(sx * HEX_R, wheel_y, -0.005 * HEX_R);
    }
    m.add_mesh(g, bx(0.38 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R), m_bronze)
        .set_pos(0.0, axle_y, -0.005 * HEX_R);
    m.add_mesh(g, bx(0.28 * HEX_R, 0.016 * HEX_R, 0.22 * HEX_R), m_wood)
        .set_pos(0.0, car_floor_y, 0.06 * HEX_R);
    m.add_mesh(g, bx(0.28 * HEX_R, 0.10 * HEX_R, 0.018 * HEX_R), m_owner)
        .set_pos(0.0, car_floor_y + 0.05 * HEX_R, -0.045 * HEX_R);
    let side = bx(0.018 * HEX_R, 0.08 * HEX_R, 0.22 * HEX_R);
    m.add_mesh(g, side.clone(), m_wood).set_pos(
        0.135 * HEX_R,
        car_floor_y + 0.04 * HEX_R,
        0.06 * HEX_R,
    );
    m.add_mesh(g, side, m_wood)
        .set_pos(-0.135 * HEX_R, car_floor_y + 0.04 * HEX_R, 0.06 * HEX_R);
    m.add_mesh(g, bx(0.30 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R), m_bronze)
        .set_pos(0.0, car_floor_y + 0.098 * HEX_R, -0.045 * HEX_R);

    let pole_z_start = -0.054 * HEX_R;
    let pole_z_end = -0.32 * HEX_R;
    let pole_len = (pole_z_end - pole_z_start).abs();
    let pole_z_ctr = (pole_z_start + pole_z_end) * 0.5;
    m.add_mesh(g, bx(0.018 * HEX_R, 0.018 * HEX_R, pole_len), m_wood)
        .set_pos(0.0, car_floor_y - 0.005 * HEX_R, pole_z_ctr);
    m.add_mesh(g, bx(0.26 * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R), m_bronze)
        .set_pos(0.0, car_floor_y + 0.002 * HEX_R, pole_z_end);

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

    let dg: NodeId = m.add_group(g);
    m.node(dg).rot_y(PI);
    let leg = bx(AV_LEG_W * drv_scale, drv_leg_h, AV_LEG_W * drv_scale);
    m.add_mesh(dg, leg.clone(), m_dark).set_pos(
        -(AV_LEG_SEP + AV_LEG_W * drv_scale * 0.5),
        drv_leg_ctr,
        0.03 * HEX_R,
    );
    m.add_mesh(dg, leg, m_dark).set_pos(
        AV_LEG_SEP + AV_LEG_W * drv_scale * 0.5,
        drv_leg_ctr,
        0.03 * HEX_R,
    );
    m.add_mesh(dg, bx(drv_trs_w, drv_trs_h, drv_trs_d), m_cloth)
        .set_pos(0.0, drv_trs_ctr, 0.03 * HEX_R);
    m.add_mesh(
        dg,
        bx(drv_trs_w * 0.85, drv_trs_h * 0.30, 0.012 * HEX_R),
        m_owner,
    )
    .set_pos(
        0.0,
        drv_trs_ctr,
        0.03 * HEX_R + drv_trs_d * 0.5 + 0.002 * HEX_R,
    );
    let darm = bx(drv_arm_w, drv_arm_h, drv_arm_d);
    m.add_mesh(dg, darm.clone(), m_cloth)
        .set_pos(-drv_arm_ox, drv_arm_ctr, 0.03 * HEX_R);
    m.add_mesh(dg, darm, m_cloth)
        .set_pos(drv_arm_ox, drv_arm_ctr, 0.03 * HEX_R);
    m.add_mesh(dg, bx(drv_head_s, drv_head_s, drv_head_s), m_skin)
        .set_pos(0.0, drv_head_ctr, 0.03 * HEX_R);
    let d_eye_z = drv_head_s * 0.5 + 0.002 * HEX_R;
    let d_eye_y = drv_head_ctr + 0.008 * HEX_R;
    let eye = bx(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
    let m_eye_l = m.mat(COLOR_DARK_EYE, 0.02, 0.95);
    m.add_mesh(dg, eye.clone(), m_eye_l)
        .set_pos(-0.025 * HEX_R, d_eye_y, 0.03 * HEX_R + d_eye_z);
    let m_eye_r = m.mat(COLOR_DARK_EYE, 0.02, 0.95);
    m.add_mesh(dg, eye, m_eye_r)
        .set_pos(0.025 * HEX_R, d_eye_y, 0.03 * HEX_R + d_eye_z);
    m.add_mesh(
        dg,
        bx(drv_head_s * 1.15, drv_head_s * 0.65, drv_head_s * 1.10),
        m_bronze,
    )
    .set_pos(0.0, drv_head_ctr + drv_head_s * 0.55, 0.03 * HEX_R);
    let m_dcrest = m.mat(COLOR_RED_VIV, 0.08, 0.74);
    m.add_mesh(
        dg,
        bx(0.020 * HEX_R, 0.050 * HEX_R, 0.080 * HEX_R),
        m_dcrest,
    )
    .set_pos(
        0.0,
        drv_head_ctr + drv_head_s * 0.55 + 0.045 * HEX_R,
        0.03 * HEX_R,
    );
    m.add_mesh(dg, bx(0.12 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R), m_dark)
        .rot_y(PI * 0.5)
        .set_pos(
            0.0,
            drv_arm_ctr,
            0.03 * HEX_R - drv_trs_d * 0.5 - 0.06 * HEX_R,
        );

    let m_quiver_c = m.mat(COLOR_LEATHER, 0.05, 0.85);
    m.add_mesh(
        g,
        bx(0.030 * HEX_R, 0.16 * HEX_R, 0.030 * HEX_R),
        m_quiver_c,
    )
    .rot_z(0.42)
    .set_pos(0.150 * HEX_R, car_floor_y + 0.05 * HEX_R, 0.09 * HEX_R);
    for dz in [-0.010 * HEX_R, 0.010 * HEX_R] {
        m.add_mesh(g, bx(0.008 * HEX_R, 0.05 * HEX_R, 0.008 * HEX_R), m_owner)
            .rot_z(0.42)
            .set_pos(0.175 * HEX_R, car_floor_y + 0.13 * HEX_R, 0.09 * HEX_R + dz);
    }
    m.add_mesh(g, bx(0.012 * HEX_R, 0.22 * HEX_R, 0.012 * HEX_R), m_steel)
        .set_pos(-0.135 * HEX_R, car_floor_y + 0.11 * HEX_R, 0.15 * HEX_R);
    m.add_mesh(g, bx(0.07 * HEX_R, 0.055 * HEX_R, 0.008 * HEX_R), m_owner)
        .set_pos(
            -0.135 * HEX_R - 0.035 * HEX_R,
            car_floor_y + 0.19 * HEX_R,
            0.15 * HEX_R,
        );

    m.node(g).rot_y(PI);
    m
}

/// `case 'super'` (`units.ts:4556-4682`).
#[allow(clippy::too_many_lines)]
fn cat_super(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_CRIMSON, owner);
    let g = ROOT;
    let m_gold = m.mat(COLOR_GOLD_BR, 0.58, 0.32);
    let m_gold_lt = m.mat(COLOR_BRONZE_LT, 0.58, 0.32);
    let m_steel = m.mat(COLOR_STEEL, 0.50, 0.40);
    let m_cloak = m.mat(COLOR_CRIMSON, 0.08, 0.74);
    let m_owner = m.mat(owner, 0.20, 0.55);
    let m_pole_m = m.mat(COLOR_POLE_GREY, 0.35, 0.55);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_leath = m.mat(0x5a_3c22, 0.06, 0.82);

    m.add_mesh(g, part(UnitPart::SuperCape), m_cloak)
        .set_scale(1.15, 1.15, 1.0)
        .set_pos(
            0.0,
            AV_Y_TORSO_CTR - 0.01 * HEX_R,
            -AV_TORSO_D * 0.5 - 0.008 * HEX_R,
        )
        .rot_x(0.20);
    m.add_mesh(g, part(UnitPart::CuirassBox), m_gold)
        .set_scale(1.04, 1.04, 1.04)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    m.add_mesh(g, part(UnitPart::GildedTrim), m_gold_lt)
        .set_pos(0.0, AV_Y_TORSO_CTR + 0.03 * HEX_R, 0.001 * HEX_R);
    m.add_mesh(g, part(UnitPart::GildedTrim), m_gold_lt)
        .set_scale(1.0, 0.6, 1.0)
        .set_pos(0.0, AV_Y_TORSO_CTR - 0.04 * HEX_R, 0.001 * HEX_R);
    add_pteruges(&mut m, m_leath);
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, part(UnitPart::ShoulderPad), m_gold).set_pos(
            sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R),
            AV_Y_TORSO_TOP - 0.015 * HEX_R,
            0.0,
        );
    }
    m.add_mesh(g, part(UnitPart::ConicalHelm), m_steel).set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.030 * HEX_R,
        0.0,
    );
    m.add_mesh(g, bx(0.165 * HEX_R, 0.020 * HEX_R, 0.165 * HEX_R), m_gold)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.005 * HEX_R, 0.0);
    let m_white = m.mat(COLOR_FEATHER, 0.03, 0.92);
    m.add_mesh(g, part(UnitPart::PlumeRidge), m_white)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.090 * HEX_R, -0.004 * HEX_R)
        .rot_x(0.10);
    for dz in [-0.034 * HEX_R, 0.0, 0.034 * HEX_R] {
        m.add_mesh(
            g,
            bx(0.024 * HEX_R, 0.150 * HEX_R, 0.012 * HEX_R),
            m_gold_lt,
        )
        .rot_x(0.10)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.090 * HEX_R, -0.004 * HEX_R + dz);
    }
    let spear_x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
    m.add_mesh(g, bx(0.016 * HEX_R, 0.50 * HEX_R, 0.016 * HEX_R), m_wood)
        .set_pos(spear_x, AV_Y_LEG_BOT + 0.25 * HEX_R, 0.01 * HEX_R);
    m.add_mesh(g, part(UnitPart::SpearTip), m_gold_lt).set_pos(
        spear_x,
        AV_Y_LEG_BOT + 0.50 * HEX_R + 0.028 * HEX_R,
        0.01 * HEX_R,
    );
    let shield_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R);
    m.add_mesh(g, part(UnitPart::AspisFace), m_owner)
        .rot_z(PI / 2.0)
        .set_scale(1.0, 0.78, 0.78)
        .set_pos(shield_x, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    m.add_mesh(g, part(UnitPart::AspisRim), m_gold)
        .rot_z(PI / 2.0)
        .set_scale(0.9, 0.80, 0.80)
        .set_pos(shield_x - 0.006 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    m.add_mesh(g, part(UnitPart::ShieldBoss), m_gold)
        .rot_z(PI / 2.0)
        .set_pos(shield_x + 0.014 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
    add_greaves(&mut m, m_gold_lt);
    let pole_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.030 * HEX_R);
    let pole_ctr_y = AV_Y_LEG_BOT + 0.33 * HEX_R * 0.5;
    let pole_top_y = AV_Y_LEG_BOT + 0.33 * HEX_R;
    m.add_mesh(g, part(UnitPart::BannerPole), m_pole_m)
        .set_scale(1.0, 1.1, 1.0)
        .set_pos(pole_x, pole_ctr_y, -0.02 * HEX_R);
    m.add_mesh(g, part(UnitPart::BannerFlag), m_owner).set_pos(
        pole_x - 0.047 * HEX_R,
        pole_top_y - 0.036 * HEX_R,
        -0.02 * HEX_R,
    );
    m.add_mesh(g, bx(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R), m_gold)
        .set_pos(pole_x, pole_top_y + 0.012 * HEX_R, -0.02 * HEX_R);
    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// `case 'robotnik'` (`units.ts:4691-4743`).
fn cat_robotnik(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, 0xb4_6a30, owner);
    let g = ROOT;
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_steel = m.mat(COLOR_STEEL, 0.45, 0.45);
    let m_owner = m.mat(owner, 0.10, 0.68);
    let m_cap = m.mat(0x8a_6a40, 0.05, 0.88);
    let m_leath = m.mat(COLOR_LEATHER, 0.05, 0.85);

    m.add_mesh(g, bx(0.145 * HEX_R, 0.045 * HEX_R, 0.145 * HEX_R), m_cap)
        .set_pos(0.0, AV_Y_HEAD_TOP + 0.012 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.195 * HEX_R, 0.026 * HEX_R, 0.115 * HEX_R), m_leath)
        .set_pos(0.0, AV_Y_TORSO_BOT + 0.03 * HEX_R, 0.0);
    m.add_mesh(g, bx(0.03 * HEX_R, 0.03 * HEX_R, 0.014 * HEX_R), m_owner)
        .set_pos(
            0.0,
            AV_Y_TORSO_BOT + 0.03 * HEX_R,
            AV_TORSO_D * 0.5 + 0.006 * HEX_R,
        );
    let px = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.010 * HEX_R;
    m.add_mesh(g, part(UnitPart::PickHandle), m_wood)
        .rot_z(-0.55)
        .set_pos(
            px + 0.02 * HEX_R,
            AV_Y_TORSO_CTR + 0.10 * HEX_R,
            0.02 * HEX_R,
        );
    let head_x = px + 0.02 * HEX_R + 0.55_f64.js_sin() * 0.15 * HEX_R;
    let head_y = AV_Y_TORSO_CTR + 0.10 * HEX_R + 0.55_f64.js_cos() * 0.15 * HEX_R;
    m.add_mesh(g, part(UnitPart::PickHead), m_steel)
        .rot_z(-0.55 + PI / 2.0)
        .set_pos(head_x, head_y, 0.02 * HEX_R);
    add_boots(&mut m, m_leath);
    let m_hand = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hand);
    m
}

/// Chariot decoration variant (`decorateChariot` arguments).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ChariotDecor {
    /// Mycenaean: `(COLOR_BRONZE, COLOR_WOAD)` (`units.ts:1530`).
    Mycenaean,
    /// Shang: `(COLOR_LACQUER, COLOR_LACQUER)` (`units.ts:1542`).
    Shang,
    /// Celtic: `(COLOR_GOLD_BR, COLOR_FOREST, celtic = true)` (`units.ts:1501`).
    Celtic,
}

/// `decorateChariot(buildCategoryModel('rydwan', owner), owner, accent,
/// shieldColor, celtic)` (`units.ts:1389-1488`).
#[must_use]
pub fn build_decorated_chariot(owner: u32, decor: ChariotDecor) -> UnitModel {
    let mut m = cat_rydwan(owner);
    let (accent, shield_color, celtic) = match decor {
        ChariotDecor::Mycenaean => (COLOR_BRONZE, COLOR_WOAD, false),
        ChariotDecor::Shang => (COLOR_LACQUER, COLOR_LACQUER, false),
        ChariotDecor::Celtic => (COLOR_GOLD_BR, COLOR_FOREST, true),
    };
    decorate_chariot(&mut m, accent, shield_color, celtic);
    m
}

/// `decorateChariot` body on an already built chariot.
pub fn decorate_chariot(m: &mut UnitModel, accent: u32, shield_color: u32, celtic: bool) {
    let sub = m.add_group(ROOT);
    m.node(sub).rot_y(PI);
    let oval = part(UnitPart::OvalShield);
    let boss = part(UnitPart::ShieldBoss);

    if celtic {
        let iron = m.retint(COLOR_BRONZE, COLOR_MAIL);
        let tunic = m.retint(COLOR_LACQUER, COLOR_WOAD);
        let crest = m.retint(COLOR_RED_VIV, COLOR_TROUSERS);
        set_celtic_retint(m, CelticRetint { iron, tunic, crest });

        let m_face = m.mat(shield_color, 0.10, 0.72);
        let m_rim = m.mat(COLOR_LEATHER, 0.06, 0.84);
        let m_wood_c = m.mat(COLOR_CHARIOT, 0.05, 0.82);
        let m_boss_c = m.mat(accent, 0.30, 0.50);
        let (sh_x, sh_y, sh_z) = (0.078 * HEX_R, 0.185 * HEX_R, 0.0695 * HEX_R);
        m.add_mesh(sub, oval.clone(), m_rim)
            .rot_x(PI / 2.0)
            .set_scale(0.80, 0.80, 1.20)
            .set_pos(sh_x, sh_y, sh_z - 0.002 * HEX_R)
            .set_name("rc-shield-rim");
        m.add_mesh(sub, oval, m_face)
            .rot_x(PI / 2.0)
            .set_scale(0.72, 1.0, 1.10)
            .set_pos(sh_x, sh_y, sh_z)
            .set_name("rc-shield-face");
        m.add_mesh(
            sub,
            bx(0.016 * HEX_R, 0.170 * HEX_R, 0.010 * HEX_R),
            m_wood_c,
        )
        .set_pos(sh_x, sh_y, sh_z + 0.012 * HEX_R)
        .set_name("rc-shield-spina");
        m.add_mesh(sub, boss, m_boss_c)
            .rot_x(PI / 2.0)
            .set_pos(sh_x, sh_y, sh_z + 0.016 * HEX_R)
            .set_name("rc-shield-boss");
        let hoop = Geo::Prim(Prim::Torus {
            r: 0.090 * HEX_R,
            tube: 0.008 * HEX_R,
            radial: 4,
            tubular: 10,
            arc: PI,
        });
        for s in [1.0_f64, -1.0] {
            let name = if s > 0.0 {
                "rc-hoop-left"
            } else {
                "rc-hoop-right"
            };
            m.add_mesh(sub, hoop.clone(), m_wood_c)
                .rot_y(PI / 2.0)
                .set_pos(s * 0.135 * HEX_R, 0.1905 * HEX_R, -0.035 * HEX_R)
                .set_name(name);
        }
        return;
    }

    let m_sh = m.mat(shield_color, 0.10, 0.72);
    m.add_mesh(sub, oval, m_sh)
        .rot_z(PI / 2.0)
        .set_scale(1.0, 0.6, 1.0)
        .set_pos(0.150 * HEX_R, 0.20 * HEX_R, 0.12 * HEX_R);
    let m_b = m.mat(accent, 0.30, 0.5);
    m.add_mesh(sub, boss, m_b)
        .rot_z(PI / 2.0)
        .set_pos(0.162 * HEX_R, 0.20 * HEX_R, 0.12 * HEX_R);
}

/// `applyCultureOverrides(group, category, culture, owner)`
/// (`units.ts:5559-5683`).
pub fn apply_culture_overrides(m: &mut UnitModel, cat: UnitCategory, culture: Culture) {
    if culture == Culture::Neutral || cat.skips_culture_overrides() {
        return;
    }
    let house = culture.house_color();
    if house != 0x00_0000 {
        let m_em = m.mat(house, 0.10, 0.70);
        m.add_mesh(ROOT, bx(0.05 * HEX_R, 0.05 * HEX_R, 0.010 * HEX_R), m_em)
            .set_pos(
                0.045 * HEX_R,
                AV_Y_TORSO_CTR - 0.05 * HEX_R,
                AV_TORSO_D * 0.5 + 0.012 * HEX_R,
            );
    }
    match culture {
        Culture::Egipt => {
            let m_blue = m.mat(COLOR_WOAD, 0.10, 0.66);
            let m_gold = m.mat(COLOR_GOLD_BR, 0.55, 0.34);
            m.add_mesh(
                ROOT,
                bx(0.150 * HEX_R, 0.040 * HEX_R, 0.150 * HEX_R),
                m_blue,
            )
            .set_pos(0.0, AV_Y_HEAD_CTR + 0.052 * HEX_R, 0.0);
            for dx in [-0.04, 0.0, 0.04] {
                m.add_mesh(
                    ROOT,
                    bx(0.014 * HEX_R, 0.040 * HEX_R, 0.012 * HEX_R),
                    m_gold,
                )
                .set_pos(
                    dx * HEX_R,
                    AV_Y_HEAD_CTR + 0.052 * HEX_R,
                    AV_HEAD_S * 0.5 + 0.004 * HEX_R,
                );
            }
        }
        Culture::Zulu => {
            let m_white = m.mat(COLOR_PAINT_WHT, 0.03, 0.92);
            m.add_mesh(
                ROOT,
                bx(0.018 * HEX_R, 0.075 * HEX_R, 0.010 * HEX_R),
                m_white,
            )
            .set_pos(0.0, AV_Y_HEAD_TOP + 0.050 * HEX_R, -0.01 * HEX_R);
        }
        Culture::Chiny => {
            let m_lac = m.mat(COLOR_LACQUER, 0.20, 0.45);
            m.add_mesh(ROOT, bx(0.026 * HEX_R, 0.060 * HEX_R, 0.026 * HEX_R), m_lac)
                .set_pos(0.0, AV_Y_HEAD_TOP + 0.060 * HEX_R, 0.0);
        }
        Culture::Inka => {
            let m_red = m.mat(COLOR_RED_VIV, 0.06, 0.78);
            let m_teal = m.mat(COLOR_TEAL, 0.06, 0.78);
            for (ax, mat) in [(-0.25_f64, m_red), (0.25, m_teal)] {
                m.add_mesh(ROOT, bx(0.016 * HEX_R, 0.075 * HEX_R, 0.010 * HEX_R), mat)
                    .rot_z(ax)
                    .set_pos(
                        ax.js_sin() * 0.03 * HEX_R,
                        AV_Y_HEAD_TOP + 0.050 * HEX_R,
                        -0.01 * HEX_R,
                    );
            }
        }
        Culture::Grecja => {
            let m_cr = m.mat(COLOR_CRIMSON, 0.08, 0.74);
            m.add_mesh(ROOT, bx(0.020 * HEX_R, 0.060 * HEX_R, 0.080 * HEX_R), m_cr)
                .set_pos(0.0, AV_Y_HEAD_TOP + 0.060 * HEX_R, 0.0);
        }
        Culture::Rzym => {
            let m_cr = m.mat(COLOR_RED_VIV, 0.08, 0.74);
            m.add_mesh(ROOT, bx(0.110 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R), m_cr)
                .set_pos(0.0, AV_Y_HEAD_TOP + 0.058 * HEX_R, 0.0);
        }
        Culture::Sumer => {
            let m_cop = m.mat(0xc8_843e, 0.55, 0.32);
            m.add_mesh(ROOT, bx(0.150 * HEX_R, 0.020 * HEX_R, 0.150 * HEX_R), m_cop)
                .set_pos(0.0, AV_Y_HEAD_CTR + 0.048 * HEX_R, 0.0);
        }
        Culture::Germanie | Culture::Neutral => {}
    }
}

/// `attachEmbarkBoat(group)` (`units.ts:5700-5752`): shrinks/raises the
/// current root children and adds a plank landing boat. The boat materials
/// are tracked (`mats.push`).
pub fn attach_embark_boat(m: &mut UnitModel) {
    let riders = m.nodes[ROOT].children.clone();
    for c in riders {
        let n = m.node(c);
        n.scale = n.scale.scale(0.78);
        n.position.y += 0.10 * HEX_R;
    }
    let mk_mat = |m: &mut UnitModel, color: u32| {
        let id = m.untracked_mat(Material::standard(color, 0.05, 0.85));
        m.track(id);
        id
    };
    let mk_box = |w: f64, h: f64, d: f64| bx(w * HEX_R, h * HEX_R, d * HEX_R);
    let wood_light = mk_mat(m, 0xa8_7f4a);
    let wood_dark = mk_mat(m, 0x7a_5530);
    let boat = m.detached_group();
    let y = 0.06 * HEX_R;
    m.add_mesh(boat, mk_box(0.34, 0.05, 0.62), wood_dark)
        .set_pos(0.0, y, 0.0);
    m.add_mesh(boat, mk_box(0.06, 0.12, 0.62), wood_light)
        .set_pos(-0.17 * HEX_R, y + 0.06 * HEX_R, 0.0);
    m.add_mesh(boat, mk_box(0.06, 0.12, 0.62), wood_light)
        .set_pos(0.17 * HEX_R, y + 0.06 * HEX_R, 0.0);
    m.add_mesh(boat, mk_box(0.30, 0.14, 0.10), wood_light)
        .set_pos(0.0, y + 0.05 * HEX_R, -0.33 * HEX_R)
        .rot_x(-0.35);
    m.add_mesh(boat, mk_box(0.30, 0.12, 0.10), wood_light)
        .set_pos(0.0, y + 0.04 * HEX_R, 0.33 * HEX_R)
        .rot_x(0.3);
    m.attach(ROOT, boat);
}
