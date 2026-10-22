//! Shared part catalogues ("singleton geometries"):
//! - [`UnitPart`]: the 88 `function getGeo*` of `render/units.ts`
//!   (`edb8fb56`, lines 487-740) — helmets, shields, weapons, avatar body
//!   parts, ship parts, overlay rings;
//! - [`HorsePart`]: the 20 `function getGeoNH*` of `render/kon-nowy-model.ts`
//!   (lines 63-82).
//!
//! Each variant maps to the exact constructor arguments of the web call
//! ([`Prim`], or the [`HexRing`] shape body); the name is the web function
//! name.

use super::consts::*;
use super::model::{Geo, HexRing, Prim};
use std::f64::consts::PI;

macro_rules! catalogue {
    ($(#[$m:meta])* $name:ident, $prefix:literal, { $($v:ident => $e:expr,)* }) => {
        $(#[$m])*
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
        #[allow(missing_docs)]
        pub enum $name { $($v,)* }

        impl $name {
            /// Every part, in web declaration order.
            pub const ALL: &'static [Self] = &[$(Self::$v,)*];

            /// Name of the web factory function (e.g. `getGeoAvLeg`).
            #[must_use]
            pub const fn web_name(self) -> &'static str {
                match self { $(Self::$v => concat!($prefix, stringify!($v)),)* }
            }

            /// The web geometry (constructor arguments as data).
            #[must_use]
            pub fn geo(self) -> Geo {
                match self { $(Self::$v => Geo::from($e),)* }
            }

            /// Alias of [`Self::geo`] (the P4.13 name).
            #[must_use]
            pub fn prim(self) -> Geo {
                self.geo()
            }
        }
    };
}

const fn bx(w: f64, h: f64, d: f64) -> Prim {
    Prim::bx(w, h, d)
}
const fn cyl(rt: f64, rb: f64, h: f64, radial: u32) -> Prim {
    Prim::cyl(rt, rb, h, radial)
}

catalogue!(
    /// The 88 `getGeo*` singletons of `units.ts`.
    UnitPart, "getGeo", {
    SelectionHexRing => Geo::body(HexRing { outer: SELECTION_HEX_OUTER, inner: SELECTION_HEX_INNER }),
    OwnerHexRing => Geo::body(HexRing { outer: OWNER_RING_OUTER, inner: OWNER_RING_INNER }),
    AvLeg => bx(AV_LEG_W, AV_LEG_H, AV_LEG_W),
    AvTorso => bx(AV_TORSO_W, AV_TORSO_H, AV_TORSO_D),
    AvArm => bx(AV_ARM_W, AV_ARM_H, AV_ARM_D),
    AvNeck => bx(AV_NECK_W, AV_NECK_H, AV_NECK_D),
    AvHead => bx(AV_HEAD_S, AV_HEAD_S, AV_HEAD_S),
    AvEye => bx(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R),
    Highlight => cyl(HIGHLIGHT_RADIUS, HIGHLIGHT_RADIUS, HIGHLIGHT_HEIGHT, 6),
    HatBrim => bx(0.22 * HEX_R, 0.025 * HEX_R, 0.22 * HEX_R),
    HatCrown => bx(0.13 * HEX_R, 0.08 * HEX_R, 0.13 * HEX_R),
    Backpack => bx(0.08 * HEX_R, 0.10 * HEX_R, 0.04 * HEX_R),
    Sash => bx(0.10 * HEX_R, 0.04 * HEX_R, 0.012 * HEX_R),
    CuirassBox => bx(0.21 * HEX_R, 0.24 * HEX_R, 0.13 * HEX_R),
    CuirassGap => bx(0.21 * HEX_R, 0.008 * HEX_R, 0.14 * HEX_R),
    ShoulderPad => bx(0.07 * HEX_R, 0.05 * HEX_R, 0.07 * HEX_R),
    HelmetDome => cyl(0.075 * HEX_R, 0.080 * HEX_R, 0.07 * HEX_R, 8),
    HelmetCrest => bx(0.015 * HEX_R, 0.03 * HEX_R, 0.09 * HEX_R),
    HelmetSimple => bx(0.14 * HEX_R, 0.07 * HEX_R, 0.14 * HEX_R),
    SwordBlade => bx(0.022 * HEX_R, 0.20 * HEX_R, 0.012 * HEX_R),
    SwordCross => bx(0.07 * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R),
    SwordGrip => bx(0.022 * HEX_R, 0.06 * HEX_R, 0.022 * HEX_R),
    ShieldRim => cyl(0.065 * HEX_R, 0.065 * HEX_R, 0.015 * HEX_R, 10),
    ShieldBoss => cyl(0.022 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R, 6),
    SmallShield => bx(0.07 * HEX_R, 0.09 * HEX_R, 0.014 * HEX_R),
    SpearShaft => bx(0.015 * HEX_R, 0.40 * HEX_R, 0.015 * HEX_R),
    SpearTip => bx(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R),
    JavShaft => bx(0.012 * HEX_R, 0.26 * HEX_R, 0.012 * HEX_R),
    JavTip => bx(0.018 * HEX_R, 0.040 * HEX_R, 0.018 * HEX_R),
    Quiver => bx(0.025 * HEX_R, 0.09 * HEX_R, 0.025 * HEX_R),
    SlingStone => bx(0.028 * HEX_R, 0.028 * HEX_R, 0.028 * HEX_R),
    ClubHandle => bx(0.030 * HEX_R, 0.16 * HEX_R, 0.030 * HEX_R),
    ClubKnob => bx(0.055 * HEX_R, 0.055 * HEX_R, 0.055 * HEX_R),
    AxeHandle => bx(0.016 * HEX_R, 0.18 * HEX_R, 0.016 * HEX_R),
    AxeBlade => bx(0.08 * HEX_R, 0.065 * HEX_R, 0.018 * HEX_R),
    CartBody => bx(0.25 * HEX_R, 0.08 * HEX_R, 0.14 * HEX_R),
    CartWheel => cyl(0.065 * HEX_R, 0.065 * HEX_R, 0.020 * HEX_R, 10),
    SuperCrestPlume => bx(0.015 * HEX_R, 0.10 * HEX_R, 0.08 * HEX_R),
    SuperCape => bx(0.15 * HEX_R, 0.22 * HEX_R, 0.010 * HEX_R),
    BannerPole => bx(0.014 * HEX_R, 0.30 * HEX_R, 0.014 * HEX_R),
    BannerFlag => bx(0.09 * HEX_R, 0.07 * HEX_R, 0.008 * HEX_R),
    GildedTrim => bx(0.22 * HEX_R, 0.018 * HEX_R, 0.14 * HEX_R),
    Greave => bx(0.055 * HEX_R, 0.13 * HEX_R, 0.060 * HEX_R),
    ConicalHelm => cyl(0.030 * HEX_R, 0.085 * HEX_R, 0.090 * HEX_R, 8),
    CorinthDome => cyl(0.078 * HEX_R, 0.086 * HEX_R, 0.115 * HEX_R, 10),
    NoseGuard => bx(0.018 * HEX_R, 0.060 * HEX_R, 0.018 * HEX_R),
    CheekGuard => bx(0.022 * HEX_R, 0.050 * HEX_R, 0.040 * HEX_R),
    TransverseCrest => bx(0.135 * HEX_R, 0.045 * HEX_R, 0.020 * HEX_R),
    GaleaBowl => cyl(0.082 * HEX_R, 0.090 * HEX_R, 0.105 * HEX_R, 12),
    GaleaCap => Prim::Sphere {
        r: 0.082 * HEX_R, ws: 12, hs: 8,
        phi_start: 0.0, phi_len: PI * 2.0, theta_start: 0.0, theta_len: PI * 0.5,
    },
    AspisRim => cyl(0.135 * HEX_R, 0.135 * HEX_R, 0.022 * HEX_R, 16),
    AspisFace => cyl(0.110 * HEX_R, 0.122 * HEX_R, 0.020 * HEX_R, 16),
    ScutumBody => bx(0.150 * HEX_R, 0.230 * HEX_R, 0.020 * HEX_R),
    ScutumBoss => bx(0.045 * HEX_R, 0.045 * HEX_R, 0.022 * HEX_R),
    LoricaBand => bx(0.215 * HEX_R, 0.030 * HEX_R, 0.135 * HEX_R),
    PilumShaft => bx(0.014 * HEX_R, 0.42 * HEX_R, 0.014 * HEX_R),
    PilumHead => bx(0.010 * HEX_R, 0.10 * HEX_R, 0.010 * HEX_R),
    DoryShaft => bx(0.016 * HEX_R, 0.62 * HEX_R, 0.016 * HEX_R),
    Sauroter => bx(0.020 * HEX_R, 0.045 * HEX_R, 0.020 * HEX_R),
    MailSkirt => bx(0.205 * HEX_R, 0.075 * HEX_R, 0.125 * HEX_R),
    Gladius => bx(0.026 * HEX_R, 0.135 * HEX_R, 0.012 * HEX_R),
    Scabbard => bx(0.026 * HEX_R, 0.140 * HEX_R, 0.020 * HEX_R),
    StrawBrim => cyl(0.125 * HEX_R, 0.125 * HEX_R, 0.014 * HEX_R, 14),
    StrawCrown => cyl(0.058 * HEX_R, 0.070 * HEX_R, 0.060 * HEX_R, 12),
    Staff => bx(0.016 * HEX_R, 0.52 * HEX_R, 0.016 * HEX_R),
    Bedroll => cyl(0.030 * HEX_R, 0.030 * HEX_R, 0.13 * HEX_R, 8),
    PickHandle => bx(0.016 * HEX_R, 0.30 * HEX_R, 0.016 * HEX_R),
    PickHead => bx(0.13 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R),
    Hood => bx(0.155 * HEX_R, 0.090 * HEX_R, 0.155 * HEX_R),
    Cloak => bx(0.175 * HEX_R, 0.26 * HEX_R, 0.014 * HEX_R),
    Loincloth => bx(0.165 * HEX_R, 0.080 * HEX_R, 0.115 * HEX_R),
    ArrowFletch => bx(0.010 * HEX_R, 0.055 * HEX_R, 0.010 * HEX_R),
    SlingPouch => bx(0.040 * HEX_R, 0.030 * HEX_R, 0.022 * HEX_R),
    CowhideShield => bx(0.115 * HEX_R, 0.230 * HEX_R, 0.016 * HEX_R),
    OvalShield => cyl(0.080 * HEX_R, 0.080 * HEX_R, 0.018 * HEX_R, 14),
    SaddleBlanket => bx(0.150 * HEX_R, 0.020 * HEX_R, 0.130 * HEX_R),
    ShipHull => bx(0.20 * HEX_R, 0.11 * HEX_R, 0.62 * HEX_R),
    ShipRam => bx(0.055 * HEX_R, 0.050 * HEX_R, 0.13 * HEX_R),
    ShipMast => bx(0.022 * HEX_R, 0.40 * HEX_R, 0.022 * HEX_R),
    ShipSail => bx(0.012 * HEX_R, 0.26 * HEX_R, 0.34 * HEX_R),
    Oar => bx(0.012 * HEX_R, 0.012 * HEX_R, 0.22 * HEX_R),
    Boot => bx(AV_LEG_W * 1.18, 0.045 * HEX_R, AV_LEG_W * 1.55),
    Hand => bx(AV_ARM_W * 1.05, 0.045 * HEX_R, AV_ARM_D * 1.05),
    BeltP => bx(AV_TORSO_W * 1.06, 0.030 * HEX_R, AV_TORSO_D * 1.10),
    TunicHem => bx(AV_TORSO_W * 1.08, 0.070 * HEX_R, AV_TORSO_D * 1.10),
    PlumeRidge => bx(0.022 * HEX_R, 0.150 * HEX_R, 0.110 * HEX_R),
    MeleeHelm => cyl(0.090 * HEX_R, 0.098 * HEX_R, 0.105 * HEX_R, 12),
    SkullCap => cyl(0.082 * HEX_R, 0.092 * HEX_R, 0.070 * HEX_R, 12),
});

catalogue!(
    /// The 20 `getGeoNH*` singletons of `kon-nowy-model.ts`.
    HorsePart, "getGeoNH", {
    Barrel => cyl(0.064 * HEX_R, 0.057 * HEX_R, 0.235 * HEX_R, 7),
    Chest => Prim::Icosahedron { r: 0.070 * HEX_R, detail: 0 },
    Rump => Prim::Icosahedron { r: 0.068 * HEX_R, detail: 0 },
    Withers => bx(0.054 * HEX_R, 0.056 * HEX_R, 0.106 * HEX_R),
    Neck1 => Prim::cyl_open(0.041 * HEX_R, 0.053 * HEX_R, 0.088 * HEX_R, 6),
    Neck2 => Prim::cyl_open(0.034 * HEX_R, 0.041 * HEX_R, 0.078 * HEX_R, 6),
    Neck3 => Prim::cyl_open(0.028 * HEX_R, 0.034 * HEX_R, 0.064 * HEX_R, 6),
    Skull => bx(0.060 * HEX_R, 0.070 * HEX_R, 0.088 * HEX_R),
    Muzzle => cyl(0.019 * HEX_R, 0.028 * HEX_R, 0.086 * HEX_R, 4),
    Ear => Prim::cone(0.013 * HEX_R, 0.042 * HEX_R, 3),
    Mane => bx(0.018 * HEX_R, 0.100 * HEX_R, 0.024 * HEX_R),
    Fore => bx(0.016 * HEX_R, 0.048 * HEX_R, 0.018 * HEX_R),
    UpFrnt => bx(0.036 * HEX_R, 0.104 * HEX_R, 0.046 * HEX_R),
    UpRear => bx(0.042 * HEX_R, 0.112 * HEX_R, 0.054 * HEX_R),
    Lower => bx(0.021 * HEX_R, 0.088 * HEX_R, 0.025 * HEX_R),
    Hoof => bx(0.031 * HEX_R, 0.024 * HEX_R, 0.038 * HEX_R),
    Tail1 => cyl(0.013 * HEX_R, 0.017 * HEX_R, 0.050 * HEX_R, 4),
    Tail2 => cyl(0.006 * HEX_R, 0.013 * HEX_R, 0.112 * HEX_R, 4),
    Girth => Prim::cyl_open(0.071 * HEX_R, 0.071 * HEX_R, 0.020 * HEX_R, 7),
    Breast => bx(0.100 * HEX_R, 0.018 * HEX_R, 0.014 * HEX_R),
});
