//! `render/unitVeteranBadges.ts` (pin `edb8fb56`, 294 LOC): 1–3 gold
//! five-pointed stars (extruded solids) with a dark, 30 % larger outline
//! star behind each, in the middle of the badge row, tilted towards the
//! camera. No canvas here: geometry + material parameters as data.
//!
//! The star count comes from the caller (`veteranStarCount` of
//! `game/veteran.ts` in the web; DTO, no game logic).
//!
//! REPIN-3D B3 (web `origin/main` @ `86d510c66`, `+33`): the separate, larger
//! commander star (`applyUnitCommanderStar`, `:270-301`) above the badge row;
//! whether a token shows it (`vitals ? vitals.hasCommander : unit.isGeneral
//! === true`, `units.ts:6147`) is decided by the caller (DTO).

use super::upgrade_badges::{
    BADGE_ROW_TILT_RAD, VETERAN_BADGE_RESERVED_Y, VETERAN_STAR_OUTLINE_SCALE, VETERAN_STAR_R,
    VETERAN_STAR_SPACING,
};
use super::{GeometryKind, MaterialKind, OverlayMaterial, OverlayNode, OverlayTree, Side};
use crate::core::hexutil::HEX_R;
use crate::geom::{extrude_geometry, ExtrudeOptions, Mesh, Path2, Shape};
use crate::jsmath::{js_cos, js_sin};
use crate::terrain::color::Color;

/// `STAR_INNER_FRAC` (`:123`).
pub const STAR_INNER_FRAC: f64 = 0.42;
/// `STAR_DEPTH` (`:125`).
pub const STAR_DEPTH: f64 = 0.020 * HEX_R;
/// `STAR_OUTLINE_OFFSET_Z` (`:136`).
pub const STAR_OUTLINE_OFFSET_Z: f64 = -0.012 * HEX_R;
/// `VETERAN_BADGE_COLOR` (`:139`).
pub const VETERAN_BADGE_COLOR: u32 = 0x00ff_d24a;
/// `VETERAN_BADGE_OUTLINE_COLOR` (`:141`).
pub const VETERAN_BADGE_OUTLINE_COLOR: u32 = 0x0024_1703;
/// `VETERAN_BADGE_HIT_UD` (`:205`).
pub const VETERAN_BADGE_HIT_UD: &str = "veteranBadgeHit";
/// `COMMANDER_STAR_HIT_UD` (`origin/main` `:213`).
pub const COMMANDER_STAR_HIT_UD: &str = "commanderStarBadgeHit";
/// `UD_COMMANDER_STAR` (`origin/main` `:212`): token `userData` key and the
/// name of the commander badge group.
pub const COMMANDER_STAR_BADGE: &str = "commanderStarBadge";
/// Scale of the commander star relative to a veteran star (`origin/main`
/// `:292`, `:296`: `1.6`).
pub const COMMANDER_STAR_SCALE: f64 = 1.6;
/// Lift of the commander star above the badge row (`origin/main` `:288`:
/// `VETERAN_BADGE_RESERVED_Y + 0.25 * HEX_R`).
pub const COMMANDER_STAR_LIFT: f64 = 0.25 * HEX_R;

/// The star outline (`:155-162`): 10 points, the first one up (90°).
#[must_use]
pub fn veteran_star_shape() -> Shape {
    let mut p = Path2::new();
    for i in 0..10 {
        let r = if i % 2 == 0 {
            VETERAN_STAR_R
        } else {
            VETERAN_STAR_R * STAR_INNER_FRAC
        };
        let a = std::f64::consts::PI / 2.0 + (f64::from(i) * std::f64::consts::PI) / 5.0;
        if i == 0 {
            p.move_to(r * js_cos(a), r * js_sin(a));
        } else {
            p.line_to(r * js_cos(a), r * js_sin(a));
        }
    }
    p.close_path();
    Shape {
        outline: p,
        holes: Vec::new(),
    }
}

/// `getGeoVeteranStar()` (`:153-169`): `ExtrudeGeometry(shape, { depth:
/// STAR_DEPTH, bevelEnabled: false, curveSegments: 1 })` — 36 triangles.
#[must_use]
pub fn veteran_star_geometry() -> Mesh {
    extrude_geometry(&[veteran_star_shape()], &ExtrudeOptions::flat(STAR_DEPTH))
}

/// `getMatVeteranStar()` (`:177-184`): gold, 45 % emissive, metallic.
#[must_use]
pub fn veteran_star_material() -> OverlayMaterial {
    let c = Color::from_hex(VETERAN_BADGE_COLOR);
    let e = Color::from_hex(VETERAN_BADGE_COLOR).scale(0.45);
    standard(c, e, 0.28, 0.85)
}

/// `getMatVeteranStarOutline()` (`:188-194`): matte, non-emissive.
#[must_use]
pub fn veteran_star_outline_material() -> OverlayMaterial {
    standard(
        Color::from_hex(VETERAN_BADGE_OUTLINE_COLOR),
        Color::from_hex(0),
        0.95,
        0.0,
    )
}

fn standard(color: Color, emissive: Color, roughness: f64, metalness: f64) -> OverlayMaterial {
    OverlayMaterial {
        kind: MaterialKind::Standard,
        color: [color.r, color.g, color.b],
        emissive: Some([emissive.r, emissive.g, emissive.b]),
        map: None,
        emissive_map: None,
        transparent: false,
        depth_test: true,
        depth_write: true,
        tone_mapped: true,
        side: Side::Front,
        opacity: 1.0,
        roughness: Some(roughness),
        metalness: Some(metalness),
    }
}

/// `starOffsetsX(count)` (`:213-218`).
#[must_use]
pub fn star_offsets_x(count: u32) -> Vec<f64> {
    let start = -((f64::from(count) - 1.0) / 2.0) * VETERAN_STAR_SPACING;
    (0..count)
        .map(|i| start + f64::from(i) * VETERAN_STAR_SPACING)
        .collect()
}

/// `applyUnitVeteranBadgeStarCount(group, starCount)` (`:253-265`) on a
/// fresh token: the `veteranBadge` sub-group (`buildVeteranBadgeGroup`,
/// `:224-248`), `None` for 0 stars.
#[must_use]
pub fn build_veteran_badge(star_count: u32) -> Option<OverlayTree> {
    if star_count == 0 {
        return None;
    }
    let mut t = OverlayTree::default();
    let mut root = OverlayNode::group("veteranBadge", None);
    root.position[1] = VETERAN_BADGE_RESERVED_Y;
    root.rotation[0] = -BADGE_ROW_TILT_RAD;
    let r = t.push(root);
    for x in star_offsets_x(star_count) {
        let mut outline = OverlayNode::mesh(
            r,
            GeometryKind::VeteranStar,
            veteran_star_outline_material(),
            [x, 0.0, STAR_OUTLINE_OFFSET_Z],
            [VETERAN_STAR_OUTLINE_SCALE, VETERAN_STAR_OUTLINE_SCALE, 1.0],
            0,
        );
        outline.veteran_badge_hit = true;
        t.push(outline);
        let mut star = OverlayNode::mesh(
            r,
            GeometryKind::VeteranStar,
            veteran_star_material(),
            [x, 0.0, 0.0],
            [1.0, 1.0, 1.0],
            0,
        );
        star.veteran_badge_hit = true;
        t.push(star);
    }
    Some(t)
}

/// `applyUnitCommanderStar(group, true)` on a token without the badge
/// (`origin/main` `:275-301`): the `commanderStarBadge` sub-group — outline
/// star (scale `VETERAN_STAR_OUTLINE_SCALE × 1,6`) behind a gold star (scale
/// 1,6), both tagged [`COMMANDER_STAR_HIT_UD`], centred above the badge row and
/// tilted like it. Same shared geometry / materials as the veteran stars.
#[must_use]
pub fn build_commander_star() -> OverlayTree {
    let mut t = OverlayTree::default();
    let mut root = OverlayNode::group(COMMANDER_STAR_BADGE, None);
    root.position[1] = VETERAN_BADGE_RESERVED_Y + COMMANDER_STAR_LIFT;
    root.rotation[0] = -BADGE_ROW_TILT_RAD;
    let r = t.push(root);
    let os = VETERAN_STAR_OUTLINE_SCALE * COMMANDER_STAR_SCALE;
    let mut outline = OverlayNode::mesh(
        r,
        GeometryKind::VeteranStar,
        veteran_star_outline_material(),
        [0.0, 0.0, STAR_OUTLINE_OFFSET_Z],
        [os, os, 1.0],
        0,
    );
    outline.commander_star_hit = true;
    t.push(outline);
    let mut star = OverlayNode::mesh(
        r,
        GeometryKind::VeteranStar,
        veteran_star_material(),
        [0.0; 3],
        [COMMANDER_STAR_SCALE, COMMANDER_STAR_SCALE, 1.0],
        0,
    );
    star.commander_star_hit = true;
    t.push(star);
    t
}

/// What one `applyUnitCommanderStar(group, hasCommander)` call does to a
/// token (`origin/main` `:275-301`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CommanderStarUpdate {
    /// Nothing: no badge and none wanted, or the badge is already there
    /// (`if (old) return` — the SAME object stays, never rebuilt).
    Keep,
    /// Add a fresh [`build_commander_star`] sub-group.
    Add,
    /// Remove the badge (and its `userData` entry).
    Remove,
}

/// The idempotent sync rule of `applyUnitCommanderStar`: `present` = the
/// token already holds the badge, `has_commander` = the wanted state.
#[must_use]
pub const fn commander_star_update(present: bool, has_commander: bool) -> CommanderStarUpdate {
    match (present, has_commander) {
        (true, false) => CommanderStarUpdate::Remove,
        (false, true) => CommanderStarUpdate::Add,
        _ => CommanderStarUpdate::Keep,
    }
}

/// Deprecated `applyUnitVeteranBadgeLevel(group, level)` (`:268-271`):
/// level ≥ 3 → 3 stars, 2 → 2, otherwise 0.
#[must_use]
pub fn stars_for_level(level: u8) -> u32 {
    if level >= 3 {
        3
    } else if level >= 2 {
        2
    } else {
        0
    }
}
