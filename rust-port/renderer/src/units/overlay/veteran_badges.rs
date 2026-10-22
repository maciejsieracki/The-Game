//! `render/unitVeteranBadges.ts` (pin `edb8fb56`, 294 LOC): 1–3 gold
//! five-pointed stars (extruded solids) with a dark, 30 % larger outline
//! star behind each, in the middle of the badge row, tilted towards the
//! camera. No canvas here: geometry + material parameters as data.
//!
//! The star count comes from the caller (`veteranStarCount` of
//! `game/veteran.ts` in the web; DTO, no game logic).

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
