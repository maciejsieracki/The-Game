//! `render/unitUpgradeBadges.ts` (pin `edb8fb56`, 459 LOC): the two
//! building-upgrade badges of a token — Barracks (path B, "Parametry",
//! LEFT of the row) and Forge (path A, "Pancerz", RIGHT) — drawn as the
//! brand-book building icons on a dark rounded tile whose border and icon
//! stroke are bronze / silver / gold by level.
//!
//! Levels and the star count come from the caller (the web computes them in
//! `game/unit-building-bonuses.ts` / `game/veteran.ts`; DTO, no game logic).

use super::stat_plate::{BADGE_ROW_Y, PLATE_TILT_RAD};
use super::{canvas, flat_material, Anchor, GeometryKind, OverlayNode, OverlayTexture};
use super::{OverlayTree, TextureFilter, TextureRef};
use crate::core::hexutil::HEX_R;
use crate::raster::image::svg::{draw_svg, prepare_svg_for_canvas, SvgImage};
use crate::raster::{Canvas2dLite, RasterError};

/// `PATH_BADGE_COLOR` (`:115-119`), index = level − 1.
pub const PATH_BADGE_COLOR: [u32; 3] = [0x00b9_762e, 0x00d6_e2ee, 0x00f2_a81c];

/// `PATH_BADGE_LABEL` (`:127-131`), index = level − 1.
pub const PATH_BADGE_LABEL: [&str; 3] = [
    "Ulepszenie I (brąz)",
    "Ulepszenie II (srebro)",
    "Ulepszenie III (złoto)",
];

/// `VETERAN_BADGE_RESERVED_Y` (`:156`) = [`BADGE_ROW_Y`].
pub const VETERAN_BADGE_RESERVED_Y: f64 = BADGE_ROW_Y;
/// `VETERAN_STAR_R` (`:159`).
pub const VETERAN_STAR_R: f64 = 0.072 * HEX_R;
/// `VETERAN_STAR_SPACING` (`:161`).
pub const VETERAN_STAR_SPACING: f64 = 0.158 * HEX_R;
/// `VETERAN_STAR_OUTLINE_SCALE` (`:163`).
pub const VETERAN_STAR_OUTLINE_SCALE: f64 = 1.30;
/// `BADGE_ROW_TILT_RAD` (`:180`) = [`PLATE_TILT_RAD`].
pub const BADGE_ROW_TILT_RAD: f64 = PLATE_TILT_RAD;
/// `ICON_SPRITE_SIZE` (`:183`).
pub const ICON_SPRITE_SIZE: f64 = 0.24 * HEX_R;
/// `ICON_HALF_W` (`:185`).
pub const ICON_HALF_W: f64 = ICON_SPRITE_SIZE / 2.0;
/// `ICON_GAP` (`:187`).
pub const ICON_GAP: f64 = 0.050 * HEX_R;
/// `ICON_Z` (`:189`).
pub const ICON_Z: f64 = 0.030 * HEX_R;
/// `ICON_RENDER_ORDER` (`:194`).
pub const ICON_RENDER_ORDER: i32 = 13;
/// `CANVAS_PX` (`:197`).
pub const CANVAS_PX: u32 = 128;
/// `ICON_STROKE_BOOST` (`:204`).
pub const ICON_STROKE_BOOST: f64 = 1.6;
/// `ICON_DRAW_PX` (`:206`).
pub const ICON_DRAW_PX: f64 = 92.0;
/// `PLATE_FILL` (`:268`).
pub const PLATE_FILL: &str = "rgba(10,14,22,0.90)";

/// `pathBadgeLabel(level)` (`:133-135`); level 0 (or > 3) = `''`.
#[must_use]
pub fn path_badge_label(level: u8) -> &'static str {
    match level {
        1..=3 => PATH_BADGE_LABEL[usize::from(level) - 1],
        _ => "",
    }
}

/// `badgeColorCss(level)` (`:122-124`); `None` outside 1–3.
#[must_use]
pub fn badge_color_css(level: u8) -> Option<String> {
    match level {
        1..=3 => Some(format!("#{:06x}", PATH_BADGE_COLOR[usize::from(level) - 1])),
        _ => None,
    }
}

/// `BadgePath` (`:240`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum BadgePath {
    /// `'armor'` — path A (Pancerz), Forge icon, right.
    Armor,
    /// `'soft'` — path B (Parametry), Barracks icon, left.
    Soft,
}

/// `UnitUpgradeBadgeAssets` (`:242-247`), injected like `main.ts:8539-8542`.
pub trait UpgradeBadgeAssets {
    /// `brandIconSvg('bld-koszary', 40)`.
    fn barracks_svg(&self) -> String;
    /// `brandIconSvg('bld-kuznia', 40)`.
    fn forge_svg(&self) -> String;
}

/// `starsHalfSpan(starCount)` (`:213-216`).
#[must_use]
pub fn stars_half_span(star_count: u32) -> f64 {
    if star_count == 0 {
        return 0.0;
    }
    ((f64::from(star_count) - 1.0) / 2.0) * VETERAN_STAR_SPACING
        + VETERAN_STAR_R * VETERAN_STAR_OUTLINE_SCALE
}

/// `iconCenterX(starCount)` (`:231-233`).
#[must_use]
pub fn icon_center_x(star_count: u32) -> f64 {
    stars_half_span(star_count) + ICON_GAP + ICON_HALF_W
}

/// `packRowState(armor, soft, stars)` (`:358-360`).
#[must_use]
pub fn pack_row_state(armor: u8, soft: u8, stars: u32) -> u32 {
    u32::from(armor) * 100 + u32::from(soft) * 10 + stars.min(9)
}

fn rounded_rect_path(
    ctx: &mut Canvas2dLite,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    r: f64,
) -> Result<(), RasterError> {
    // `roundedRectPath` of this module (`:270-278`): no radius clamp.
    ctx.begin_path();
    ctx.move_to(x + r, y);
    ctx.arc_to(x + w, y, x + w, y + h, r)?;
    ctx.arc_to(x + w, y + h, x, y + h, r)?;
    ctx.arc_to(x, y + h, x, y, r)?;
    ctx.arc_to(x, y, x + w, y, r)?;
    ctx.close_path();
    Ok(())
}

/// `drawPlate(ctx, level)` (`:285-293`).
///
/// # Errors
/// Only for a negative radius (never with these constants).
pub fn draw_plate(ctx: &mut Canvas2dLite, level_css: &str) -> Result<(), RasterError> {
    let px = f64::from(CANVAS_PX);
    ctx.clear_rect(0.0, 0.0, px, px);
    rounded_rect_path(ctx, 7.0, 7.0, px - 14.0, px - 14.0, 24.0)?;
    ctx.set_fill_style(PLATE_FILL);
    ctx.fill();
    ctx.set_stroke_style(level_css);
    ctx.set_line_width(9.0);
    ctx.stroke();
    Ok(())
}

/// `drawIcon(ctx, img)` (`:295-298`).
pub fn draw_icon(ctx: &mut Canvas2dLite, img: &SvgImage) {
    let off = (f64::from(CANVAS_PX) - ICON_DRAW_PX) / 2.0;
    draw_svg(ctx, img, off, off, ICON_DRAW_PX, ICON_DRAW_PX);
}

/// A badge texture, both phases (see the module docs of `overlay`).
#[derive(Clone, Debug, PartialEq)]
pub struct UpgradeBadgeTexture {
    /// Path.
    pub path: BadgePath,
    /// Level 1–3.
    pub level: u8,
    /// Tile only (`:322`).
    pub initial: OverlayTexture,
    /// Tile + icon after the SVG has loaded (= `initial` without assets).
    pub texture: OverlayTexture,
}

fn badge_texture(c: &Canvas2dLite) -> OverlayTexture {
    OverlayTexture::from_canvas(
        c,
        TextureFilter::LinearMipmapLinear,
        Anchor::Center,
        [ICON_SPRITE_SIZE, ICON_SPRITE_SIZE],
    )
}

/// `getBadgeAsset(path, level)` (`:311-342`) without the cache (one texture
/// per (path, level) per game). `None` for a level outside 1–3.
///
/// # Errors
/// [`RasterError`] from the canvas (never for these constants).
pub fn render_upgrade_badge(
    path: BadgePath,
    level: u8,
    assets: Option<&dyn UpgradeBadgeAssets>,
) -> Result<Option<UpgradeBadgeTexture>, RasterError> {
    let Some(css) = badge_color_css(level) else {
        return Ok(None);
    };
    let mut ctx = canvas(CANVAS_PX, CANVAS_PX)?;
    draw_plate(&mut ctx, &css)?;
    let initial = badge_texture(&ctx);
    let icon = assets.and_then(|a| {
        let raw = match path {
            BadgePath::Soft => a.barracks_svg(),
            BadgePath::Armor => a.forge_svg(),
        };
        let svg = prepare_svg_for_canvas(&raw, &css, ICON_STROKE_BOOST);
        if svg.is_empty() {
            return None;
        }
        SvgImage::parse(&svg).ok()
    });
    let texture = match icon {
        None => initial.clone(),
        Some(img) => {
            draw_plate(&mut ctx, &css)?;
            draw_icon(&mut ctx, &img);
            OverlayTexture {
                redrawn_after_load: true,
                ..badge_texture(&ctx)
            }
        }
    };
    Ok(Some(UpgradeBadgeTexture {
        path,
        level,
        initial,
        texture,
    }))
}

fn icon_node(parent: usize, path: BadgePath, level: u8, x: f64) -> OverlayNode {
    OverlayNode::mesh(
        parent,
        GeometryKind::QuadCenter,
        flat_material(0x00ff_ffff, Some(TextureRef::UpgradeBadge(path, level))),
        [x, 0.0, ICON_Z],
        [ICON_SPRITE_SIZE, ICON_SPRITE_SIZE, 1.0],
        ICON_RENDER_ORDER,
    )
}

/// `applyUnitUpgradeBadgeRow(group, armorLevel, softLevel, starCount)`
/// (`:411-429`) on a fresh token: the `upgradeBadgeRow` sub-group
/// (`buildBadgeRowGroup`, `:379-398`), `None` when both levels are 0.
/// Levels above 3 are outside the web type (`UnitPathBadgeLevel` 0–3) and
/// give no icon here.
#[must_use]
pub fn build_upgrade_badge_row(
    armor_level: u8,
    soft_level: u8,
    star_count: u32,
) -> Option<OverlayTree> {
    if armor_level == 0 && soft_level == 0 {
        return None;
    }
    let mut t = OverlayTree::default();
    let mut root = OverlayNode::group("upgradeBadgeRow", None);
    root.position[1] = VETERAN_BADGE_RESERVED_Y;
    root.rotation[0] = -BADGE_ROW_TILT_RAD;
    let r = t.push(root);
    let x = icon_center_x(star_count);
    if (1..=3).contains(&soft_level) {
        t.push(icon_node(r, BadgePath::Soft, soft_level, -x));
    }
    if (1..=3).contains(&armor_level) {
        t.push(icon_node(r, BadgePath::Armor, armor_level, x));
    }
    Some(t)
}
