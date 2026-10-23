//! `render/cityMapStatChip.ts` (pin `edb8fb56`, 1133 LOC): the city badge
//! ("pill") on the world map — `[shield?][medallion][crown?] NAME [growth%?]
//! [production?] (population)` and, on hover, a second row with the
//! production front and the resource warning.
//!
//! `:N` = line `N` of `cityMapStatChip.ts`. Every `ctx.*` call of
//! `paintCityMapBadgeOntoCanvas` (`:782-937`) and of its helpers is issued in
//! the same order with the same values; the geometry is computed with the
//! same `f64` expressions (same association order) as the web.
//!
//! **Images.** The web paints the badge synchronously (disc + ◆ glyph, no
//! production icon) and repaints the same canvas each time one of up to
//! three images (civ sigil, leader portrait, production icon) finishes
//! loading (`makeCityMapBadgeSprite`, `:1080-1109`). [`render_city_map_badge`]
//! returns both ends of that sequence: [`CityBadgeTexture::initial`] (no
//! image) and [`CityBadgeTexture::texture`] (every image that loads). An
//! image that fails to load never calls back in the web (`loadImageInto`,
//! `unitOwnerEmblem.ts:315-321`: no `onerror`), so it is simply absent.
//! The image caches and request queues of the web (`createImageRequestQueue`,
//! `:228-297`) only decide *when* an image arrives, not *what* is painted;
//! caching belongs to the caller (RR-T8d, [`crate::raster::atlas`]).

use crate::cities::overlay::{js_number_string, js_round, CanvasTexture, SpriteMaterial};
use crate::cities::overlay::{SpriteNode, TextureRef};
use crate::raster::atlas::keys::{js_floor_at_least_one, js_to_lower_case, js_trim};
use crate::raster::atlas::scale::badge_canvas_px;
use crate::raster::image::emoji::{self, TextStyle};
use crate::raster::image::jpeg::decode_jpeg;
use crate::raster::image::mip::{draw_bitmap, MippedImage};
use crate::raster::image::svg::{draw_svg, prepare_svg_for_canvas, SvgImage};
use crate::raster::text::{js_to_upper_case, truncate_hover_line, truncate_name};
use crate::raster::{Canvas2dLite, RasterError};

pub use crate::raster::atlas::keys::{
    city_badge_lod_segment, city_map_badge_key, city_map_badge_key_legacy, civ_sigil_cache_key,
    format_city_growth_percent_label, leader_portrait_cache_key, prod_icon_cache_key,
    CityMapBadgeInput,
};

const PI2: f64 = std::f64::consts::PI * 2.0;

/// `CityMapWallKind` (`:15`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CityMapWallKind {
    /// `'none'`.
    None,
    /// `'palisada'`.
    Palisada,
    /// `'stone'`.
    Stone,
}

impl CityMapWallKind {
    /// The web string.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            CityMapWallKind::None => "none",
            CityMapWallKind::Palisada => "palisada",
            CityMapWallKind::Stone => "stone",
        }
    }
}

/// `DEFENSE_COLORS` (`:80-83`): (fill, stroke) of tier 1 and 2.
pub const DEFENSE_COLORS: [(&str, &str); 2] = [("#9a9aa8", "#c8c8d4"), ("#e8d88a", "#fff4c8")];
/// `CIV_SIGIL_STROKE` (`:85`).
pub const CIV_SIGIL_STROKE: &str = "#e8d88a";
/// `CIV_MEDALLION_R` (`:86`).
pub const CIV_MEDALLION_R: f64 = 16.0;
/// `CIV_SLOT_W` (`:87`).
pub const CIV_SLOT_W: f64 = 38.0;
/// `PROD_SLOT_W` (`:88`).
pub const PROD_SLOT_W: f64 = 20.0;
/// `GROWTH_FONT` (`:94`).
pub const GROWTH_FONT: &str = "700 13px Arial, Helvetica, sans-serif";
/// `HOVER_ROW_H` (`:95`).
pub const HOVER_ROW_H: f64 = 22.0;
/// `CITY_NAME_BUDGET_BASE` (`:138`).
pub const CITY_NAME_BUDGET_BASE: f64 = 305.0;
/// `PILL_RING_LINE_W` (`:189`).
pub const PILL_RING_LINE_W: f64 = 2.0;
/// `CAPITAL_RING_LINE_W` (`:191`).
pub const CAPITAL_RING_LINE_W: f64 = 3.5;
/// `CAPITAL_RING_COLOR` (`:193`).
pub const CAPITAL_RING_COLOR: &str = "rgba(255, 233, 168, 0.98)";
/// `CAPITAL_INNER_RING_INSET` (`:195`).
pub const CAPITAL_INNER_RING_INSET: f64 = 6.0;
/// `CAPITAL_INNER_RING_LINE_W` (`:196`).
pub const CAPITAL_INNER_RING_LINE_W: f64 = 1.2;
/// `CAPITAL_INNER_RING_COLOR` (`:197`).
pub const CAPITAL_INNER_RING_COLOR: &str = "rgba(232, 216, 138, 0.42)";
/// `CAPITAL_CROWN_SLOT_W` (`:199`).
pub const CAPITAL_CROWN_SLOT_W: f64 = 19.0;
/// `CAPITAL_CROWN_W` (`:205`).
pub const CAPITAL_CROWN_W: f64 = 17.0;
/// `CAPITAL_CROWN_H` (`:206`).
pub const CAPITAL_CROWN_H: f64 = 13.0;
/// Name font (`:802`).
pub const NAME_FONT: &str = "700 22px Georgia, \"Times New Roman\", serif";
/// Population font (`:803`).
pub const POP_FONT: &str = "700 16px Arial, Helvetica, sans-serif";
/// Medallion fallback glyph font (`:577`).
pub const MEDALLION_GLYPH_FONT: &str =
    "bold 20px \"Segoe UI Symbol\", \"Segoe UI\", Arial, sans-serif";
/// Hover-row font (`:707`).
pub const HOVER_FONT: &str = "600 11px Arial, Helvetica, sans-serif";
/// Resource-warning glyph font (`:684`).
pub const WARNING_FONT: &str = "bold 11px Arial, Helvetica, sans-serif";
/// Production-icon stroke boost (`:650`).
pub const PROD_ICON_STROKE_BOOST: f64 = 1.2;
/// Sigil stroke boost (`prepareSvgForCanvas` default, `:600`).
pub const SIGIL_STROKE_BOOST: f64 = 1.6;
/// Sprite height in the world (`:1120`).
pub const BADGE_WORLD_H: f64 = 0.52;
/// Sprite position (`:1122`).
pub const BADGE_POSITION: [f64; 3] = [0.0, 0.92, 0.0];
/// Sprite `renderOrder` (`:1123`).
pub const BADGE_RENDER_ORDER: i32 = 12;

/// `CIV_INITIALS` (`:359-364`).
const CIV_INITIALS: [(&str, &str); 21] = [
    ("grecy", "G"),
    ("grecja", "G"),
    ("rzym", "R"),
    ("rzymianie", "R"),
    ("egipt", "E"),
    ("egipcjanie", "E"),
    ("chiny", "C"),
    ("chinczycy", "C"),
    ("persja", "P"),
    ("persowie", "P"),
    ("zulusi", "Z"),
    ("celtowie", "K"),
    ("germanie", "D"),
    ("hunowie", "H"),
    ("japonia", "J"),
    ("japonczycy", "J"),
    ("inkowie", "I"),
    ("majowie", "M"),
    ("mongolowie", "O"),
    ("arabowie", "A"),
    ("bizancjum", "B"),
];

/// `wallKindFromBuilt(builtBuildingIds)` (`:369-376`).
#[must_use]
pub fn wall_kind_from_built(built: Option<&[&str]>) -> CityMapWallKind {
    let built = built.unwrap_or(&[]);
    if built.contains(&"mury") || built.contains(&"fort") {
        return CityMapWallKind::Stone;
    }
    if built.contains(&"palisada") {
        return CityMapWallKind::Palisada;
    }
    CityMapWallKind::None
}

/// `defenseTierFromWallKind(kind)` (`:379-383`).
#[must_use]
pub fn defense_tier_from_wall_kind(kind: CityMapWallKind) -> u8 {
    match kind {
        CityMapWallKind::Stone => 2,
        CityMapWallKind::Palisada => 1,
        CityMapWallKind::None => 0,
    }
}

/// `defenseTierFromCity(builtBuildingIds, _maMur)` (`:390-395`; `maMur` is
/// ignored by the web).
#[must_use]
pub fn defense_tier_from_city(built: Option<&[&str]>) -> u8 {
    defense_tier_from_wall_kind(wall_kind_from_built(built))
}

/// `civInitialForIconId(ikonaId)` (`:397-403`): the table entry, else the
/// upper-cased first UTF-16 unit when it (still) contains a Latin / Polish
/// capital, else `?`.
#[must_use]
pub fn civ_initial_for_icon_id(ikona_id: &str) -> String {
    let key = js_to_lower_case(js_trim(ikona_id));
    if key.is_empty() {
        return "?".into();
    }
    if let Some((_, l)) = CIV_INITIALS.iter().find(|(k, _)| *k == key) {
        return (*l).into();
    }
    // `key.charAt(0)` = the first UTF-16 unit (a lone surrogate becomes
    // U+FFFD, which no case mapping touches).
    let first: Vec<u16> = key.encode_utf16().take(1).collect();
    let letter = js_to_upper_case(&String::from_utf16_lossy(&first));
    let capital = |c: char| c.is_ascii_uppercase() || "ĄĆĘŁŃÓŚŹŻ".contains(c);
    if letter.chars().any(capital) {
        letter
    } else {
        "?".into()
    }
}

/// `roundedRect(ctx, x, y, w, h, r)` (`:405-424`) — quadratic corners, the
/// radius is not clamped.
fn rounded_rect(ctx: &mut Canvas2dLite, x: f64, y: f64, w: f64, h: f64, r: f64) {
    ctx.begin_path();
    ctx.move_to(x + r, y);
    ctx.line_to(x + w - r, y);
    ctx.quadratic_curve_to(x + w, y, x + w, y + r);
    ctx.line_to(x + w, y + h - r);
    ctx.quadratic_curve_to(x + w, y + h, x + w - r, y + h);
    ctx.line_to(x + r, y + h);
    ctx.quadratic_curve_to(x, y + h, x, y + h - r);
    ctx.line_to(x, y + r);
    ctx.quadratic_curve_to(x, y, x + r, y);
    ctx.close_path();
}

fn full_circle(ctx: &mut Canvas2dLite, cx: f64, cy: f64, r: f64) -> Result<(), RasterError> {
    ctx.begin_path();
    ctx.arc(cx, cy, r, 0.0, PI2, false)
}

/// `drawDefenseShield(ctx, cx, cy, tier)` (`:427-458`), tier 1 or 2.
pub fn draw_defense_shield(ctx: &mut Canvas2dLite, cx: f64, cy: f64, tier: u8) {
    let (fill, stroke) = DEFENSE_COLORS[usize::from(tier >= 2)];
    let w = 14.0;
    let h = 16.0;
    let x = cx - w * 0.5;
    let y = cy - h * 0.5;
    ctx.begin_path();
    ctx.move_to(cx, y);
    ctx.line_to(x + w, y + h * 0.22);
    ctx.line_to(x + w, y + h * 0.62);
    ctx.quadratic_curve_to(cx, y + h + 2.0, x, y + h * 0.62);
    ctx.line_to(x, y + h * 0.22);
    ctx.close_path();
    ctx.set_fill_style(fill);
    ctx.fill();
    ctx.set_stroke_style(stroke);
    ctx.set_line_width(1.5);
    ctx.stroke();
    if tier == 2 {
        ctx.begin_path();
        ctx.move_to(cx, y + 3.0);
        ctx.line_to(cx, y + h - 4.0);
        ctx.set_stroke_style("rgba(42, 34, 8, 0.45)");
        ctx.set_line_width(1.0);
        ctx.stroke();
    }
}

/// `drawCapitalCrown(ctx, cx, cy)` (`:467-517`) with the default size
/// [`CAPITAL_CROWN_W`] × [`CAPITAL_CROWN_H`].
///
/// # Errors
/// Never in practice (constant stops / radii); propagated from the canvas.
pub fn draw_capital_crown(ctx: &mut Canvas2dLite, cx: f64, cy: f64) -> Result<(), RasterError> {
    let w = CAPITAL_CROWN_W;
    let h = CAPITAL_CROWN_H;
    let x = cx - w * 0.5;
    let y = cy - h * 0.5;
    let band_h = h * 0.26;
    let band_y = y + h - band_h;

    let mut grad = ctx.create_linear_gradient(0.0, y, 0.0, y + h);
    grad.add_color_stop(0.0, "#fff6d2")?;
    grad.add_color_stop(0.55, "#f2df9a")?;
    grad.add_color_stop(1.0, "#d8c069")?;

    ctx.begin_path();
    ctx.move_to(x, band_y + 0.5);
    ctx.line_to(x, y + h * 0.16);
    ctx.line_to(x + w * 0.26, y + h * 0.62);
    ctx.line_to(cx, y);
    ctx.line_to(x + w * 0.74, y + h * 0.62);
    ctx.line_to(x + w, y + h * 0.16);
    ctx.line_to(x + w, band_y + 0.5);
    ctx.close_path();
    ctx.set_fill_style_gradient(&grad);
    ctx.fill();

    rounded_rect(ctx, x, band_y, w, band_h, band_h * 0.4);
    ctx.set_fill_style_gradient(&grad);
    ctx.fill();
    ctx.set_stroke_style("rgba(255, 244, 200, 0.85)");
    ctx.set_line_width(0.8);
    ctx.stroke();

    ctx.set_fill_style("rgba(42, 34, 8, 0.55)");
    for (gx, gy) in [
        (x + w * 0.10, y + h * 0.28),
        (cx, y + h * 0.16),
        (x + w * 0.90, y + h * 0.28),
    ] {
        ctx.begin_path();
        ctx.arc(gx, gy, 0.95, 0.0, PI2, false)?;
        ctx.fill();
    }
    Ok(())
}

/// `drawCivMedallionDisc(ctx, cx, cy, ownerColor)` (`:519-537`).
///
/// # Errors
/// Never in practice (positive radius).
pub fn draw_civ_medallion_disc(
    ctx: &mut Canvas2dLite,
    cx: f64,
    cy: f64,
    owner_color: Option<u32>,
) -> Result<(), RasterError> {
    let r = CIV_MEDALLION_R;
    let col = owner_color.unwrap_or(0x00ff_d54a);
    // JS `>>` works on ToInt32; bits 8..23 are the same as on the u32.
    let rr = f64::from((col >> 16) & 0xff);
    let gg = f64::from((col >> 8) & 0xff);
    let bb = f64::from(col & 0xff);
    full_circle(ctx, cx, cy, r)?;
    ctx.set_fill_style(&format!(
        "rgb({}, {}, {})",
        js_number_string(js_round(rr * 0.55)),
        js_number_string(js_round(gg * 0.55)),
        js_number_string(js_round(bb * 0.55))
    ));
    ctx.fill();
    ctx.set_stroke_style("#e8d88a");
    ctx.set_line_width(2.0);
    ctx.stroke();
    Ok(())
}

/// `CivMedallionContent` (`:539-543`): the images that have loaded.
#[derive(Clone, Copy, Debug, Default)]
pub struct CivMedallionContent<'a> {
    /// `sigilImg`.
    pub sigil: Option<&'a SvgImage>,
    /// `portraitImg`.
    pub portrait: Option<&'a MippedImage>,
    /// `isCityState`.
    pub is_city_state: bool,
}

/// `drawCivMedallion(ctx, cx, cy, _civIconId, ownerColor, content)`
/// (`:546-581`): the disc, then the portrait (major civ) or the sigil
/// clipped to the disc, or the ◆ glyph when no image has loaded.
///
/// # Errors
/// Never in practice (positive radii).
pub fn draw_civ_medallion(
    ctx: &mut Canvas2dLite,
    cx: f64,
    cy: f64,
    owner_color: Option<u32>,
    content: &CivMedallionContent<'_>,
) -> Result<(), RasterError> {
    draw_civ_medallion_disc(ctx, cx, cy, owner_color)?;
    let r = CIV_MEDALLION_R;
    let portrait = content.portrait.filter(|_| !content.is_city_state);
    if portrait.is_some() || content.sigil.is_some() {
        ctx.save();
        full_circle(ctx, cx, cy, r - 1.5)?;
        ctx.clip();
        if let Some(img) = portrait {
            let side = (r - 1.5) * 2.0;
            let (iw, ih) = (f64::from(img.width()), f64::from(img.height()));
            let scale = (side / iw).max(side / ih);
            let w = iw * scale;
            let h = ih * scale;
            draw_bitmap(ctx, img, cx - w / 2.0, cy - (r - 1.5), w, h);
        } else if let Some(img) = content.sigil {
            let side = r * 1.55;
            draw_svg(ctx, img, cx - side / 2.0, cy - side / 2.0, side, side);
        }
        ctx.restore();
        return Ok(());
    }
    ctx.set_fill_style(CIV_SIGIL_STROKE);
    fill_text(
        ctx,
        MEDALLION_GLYPH_FONT,
        "center",
        "middle",
        "\u{25c6}",
        cx,
        cy + 1.0,
    );
    Ok(())
}

/// `ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline;
/// ctx.fillText(text, x, y)` with the per-character face fallback of
/// RR-T8b/c (colour emoji included).
fn fill_text(
    ctx: &mut Canvas2dLite,
    font: &str,
    align: &str,
    baseline: &str,
    text: &str,
    x: f64,
    y: f64,
) {
    if let Some(style) = TextStyle::new(font, align, baseline) {
        emoji::fill_text(ctx, &style, text, x, y);
    }
}

/// `drawProdIcon(ctx, cx, cy, img)` (`:658-667`): a 16 px icon, nothing
/// without an image.
pub fn draw_prod_icon(ctx: &mut Canvas2dLite, cx: f64, cy: f64, img: Option<&SvgImage>) {
    let side = 16.0;
    let Some(img) = img else {
        return;
    };
    draw_svg(ctx, img, cx - side * 0.5, cy - side * 0.5, side, side);
}

/// `drawResourceWarningIcon(ctx, cx, cy)` (`:670-688`).
///
/// # Errors
/// Never in practice (positive radius).
pub fn draw_resource_warning_icon(
    ctx: &mut Canvas2dLite,
    cx: f64,
    cy: f64,
) -> Result<(), RasterError> {
    let r = 8.0;
    full_circle(ctx, cx, cy, r)?;
    ctx.set_fill_style("#8a4a10");
    ctx.fill();
    ctx.set_stroke_style("#e8a040");
    ctx.set_line_width(1.2);
    ctx.stroke();
    ctx.set_fill_style("#ffd090");
    fill_text(ctx, WARNING_FONT, "center", "middle", "!", cx, cy + 0.5);
    Ok(())
}

/// The text of the hover row (`:700-705`), before truncation.
#[must_use]
pub fn hover_row_line(input: &CityMapBadgeInput) -> String {
    let cat = js_trim(input.prod_category_label.as_deref().unwrap_or(""));
    let name = js_trim(input.prod_item_name.as_deref().unwrap_or(""));
    let mut line = if !cat.is_empty() && !name.is_empty() {
        format!("{cat} \u{b7} {name}")
    } else if !cat.is_empty() {
        cat.to_owned()
    } else {
        name.to_owned()
    };
    if input.prod_paused && !line.is_empty() {
        line.push_str(" \u{b7} wstrzymana");
    } else if input.prod_paused {
        line = "Produkcja wstrzymana".into();
    }
    if line.is_empty() && input.resource_warning {
        line = "Brak surowc\u{f3}w w magazynie".into();
    }
    line
}

/// `drawHoverProdRow(ctx, x, y, w, input)` (`:691-721`). `maxTextW` is
/// `w - x - warnW - 6` exactly as in the web (the caller already passes
/// `w = W - 2·padX`).
///
/// # Errors
/// Never in practice.
pub fn draw_hover_prod_row(
    ctx: &mut Canvas2dLite,
    x: f64,
    y: f64,
    w: f64,
    input: &CityMapBadgeInput,
) -> Result<(), RasterError> {
    let warn_w = if input.resource_warning { 20.0 } else { 0.0 };
    let max_text_w = w - x - warn_w - 6.0;
    let mut line = hover_row_line(input);
    ctx.set_font(HOVER_FONT);
    ctx.set_text_align("left");
    ctx.set_text_baseline("middle");
    line = truncate_hover_line(ctx, &line, max_text_w);
    ctx.set_fill_style("#c8b888");
    fill_text(ctx, HOVER_FONT, "left", "middle", &line, x, y);
    if input.resource_warning {
        draw_resource_warning_icon(ctx, x + max_text_w + warn_w * 0.5, y)?;
    }
    Ok(())
}

/// `drawGrowthLabel(ctx, x, cy, label)` (`:753-764`).
pub fn draw_growth_label(ctx: &mut Canvas2dLite, x: f64, cy: f64, label: &str) {
    ctx.set_fill_style("#d4c48a");
    fill_text(ctx, GROWTH_FONT, "left", "middle", label, x, cy);
}

/// The CSS-px layout of a badge (`:788-837`), before any drawing.
#[derive(Clone, Debug, PartialEq)]
pub struct BadgeLayout {
    /// `popStr`.
    pub pop_str: String,
    /// `name` (trimmed, upper-cased).
    pub name: String,
    /// `displayName` (possibly truncated with `…`).
    pub display_name: String,
    /// `nameW` = `measureText(displayName).width`.
    pub name_w: f64,
    /// `growthLabel` (`None` = no growth segment).
    pub growth_label: Option<String>,
    /// `growthW` = `Math.ceil(measureText(growthLabel).width)`.
    pub growth_w: f64,
    /// `maxNameW`.
    pub max_name_w: f64,
    /// `leftIconsW`.
    pub left_icons_w: f64,
    /// `W` (CSS px, integer).
    pub width: f64,
    /// `baseH`.
    pub base_h: f64,
    /// `H`.
    pub height: f64,
    /// `hasHoverDetail`.
    pub hover_detail: bool,
}

const PAD_X: f64 = 10.0;
const PAD_Y: f64 = 8.0;
const CIRCLE_D: f64 = 30.0;
const GAP: f64 = 8.0;

fn defense_w(input: &CityMapBadgeInput) -> f64 {
    if input.defense_tier != 0 {
        22.0
    } else {
        0.0
    }
}

fn prod_w(input: &CityMapBadgeInput) -> f64 {
    if input.prod_active {
        PROD_SLOT_W
    } else {
        0.0
    }
}

fn crown_w(input: &CityMapBadgeInput) -> f64 {
    if input.is_capital {
        CAPITAL_CROWN_SLOT_W
    } else {
        0.0
    }
}

/// `hasHoverDetail` (`:834-836`): JS truthiness of the untrimmed strings.
fn has_hover_detail(input: &CityMapBadgeInput) -> bool {
    let truthy = |s: &Option<String>| s.as_deref().is_some_and(|s| !s.is_empty());
    input.hover_expanded
        && (truthy(&input.prod_category_label)
            || truthy(&input.prod_item_name)
            || input.prod_paused
            || input.resource_warning)
}

/// The layout of `input` (`:788-837`; text measured on a fresh canvas like
/// the web's `document.createElement('canvas').getContext('2d')`).
///
/// # Errors
/// Never in practice (1×1 scratch canvas).
pub fn badge_layout(input: &CityMapBadgeInput) -> Result<BadgeLayout, RasterError> {
    let pop = js_floor_at_least_one(input.population);
    let raw_name = if input.city_name.is_empty() {
        "Miasto"
    } else {
        input.city_name.as_str()
    };
    let name = js_to_upper_case(js_trim(raw_name));
    let pop_str = js_number_string(pop);

    let has_defense = input.defense_tier != 0;
    let defense_w = defense_w(input);
    let civ_w = CIV_SLOT_W;
    let prod_w = prod_w(input);
    let crown_w = crown_w(input);

    let mut measure = Canvas2dLite::new(1, 1)?;
    let growth_label = input
        .growth_percent
        .map(|g| format_city_growth_percent_label(g, input.growth_starving));
    let mut growth_w = 0.0;
    if let Some(l) = &growth_label {
        measure.set_font(GROWTH_FONT);
        growth_w = measure.measure_text(l).width.ceil();
    }
    measure.set_font(NAME_FONT);
    let mut display_name = name.clone();
    let max_name_w = CITY_NAME_BUDGET_BASE - prod_w - growth_w - crown_w;
    if measure.measure_text(&name).width > max_name_w {
        display_name = truncate_name(&mut measure, &name, max_name_w, NAME_FONT);
    }
    let name_w = measure.measure_text(&display_name).width;

    let left_icons_w = (if has_defense { defense_w + GAP } else { 0.0 })
        + civ_w
        + GAP
        + (if crown_w != 0.0 { crown_w + GAP } else { 0.0 });
    let mid_extra_w = (if growth_w != 0.0 { GAP + growth_w } else { 0.0 })
        + (if prod_w != 0.0 { GAP + prod_w } else { 0.0 });
    let width = (PAD_X + left_icons_w + name_w + mid_extra_w + GAP + CIRCLE_D + PAD_X).ceil();
    let base_h = 48.0_f64.max(CIRCLE_D + PAD_Y * 2.0);
    let hover_detail = has_hover_detail(input);
    let height = base_h + if hover_detail { HOVER_ROW_H } else { 0.0 };
    Ok(BadgeLayout {
        pop_str,
        name,
        display_name,
        name_w,
        growth_label,
        growth_w,
        max_name_w,
        left_icons_w,
        width,
        base_h,
        height,
        hover_detail,
    })
}

/// `paintCityMapBadgeOntoCanvas(canvas, input, medallion, prodIconImg)`
/// (`:782-937`). `device_pixel_ratio` is `window.devicePixelRatio`
/// (`None` = no `window`); the canvas gets
/// `round(W·scale) × round(H·scale)` device pixels
/// ([`badge_canvas_px`], which equals the web for every reachable badge —
/// ZAŁOŻENIE Z-31-2 of P4-31 for the 2048 px guard).
///
/// # Errors
/// [`RasterError`] for a zero-sized canvas (unreachable: `W, H ≥ 48`).
pub fn paint_city_map_badge(
    input: &CityMapBadgeInput,
    medallion: &CivMedallionContent<'_>,
    prod_icon: Option<&SvgImage>,
    device_pixel_ratio: Option<f64>,
) -> Result<Canvas2dLite, RasterError> {
    let l = badge_layout(input)?;
    let (w_css, h_css) = (l.width, l.height);
    let has_defense = input.defense_tier != 0;
    let defense_w = defense_w(input);
    let prod_w = prod_w(input);
    let crown_w = crown_w(input);
    let is_capital = input.is_capital;

    let px = badge_canvas_px(w_css, h_css, device_pixel_ratio, input.lod_level);
    let dpr = px.scale;
    let mut ctx = Canvas2dLite::new(px.width, px.height)?;
    ctx.set_transform(dpr, 0.0, 0.0, dpr, 0.0, 0.0);

    ctx.clear_rect(0.0, 0.0, w_css, h_css);
    let pill_r = (h_css * 0.45).min(l.base_h * 0.45);
    rounded_rect(&mut ctx, 2.0, 2.0, w_css - 4.0, h_css - 4.0, pill_r);
    let mut grad = ctx.create_linear_gradient(0.0, 0.0, 0.0, h_css);
    grad.add_color_stop(0.0, "rgba(16, 22, 34, 0.96)")?;
    grad.add_color_stop(1.0, "rgba(8, 10, 16, 0.94)")?;
    ctx.set_fill_style_gradient(&grad);
    ctx.fill();
    ctx.set_stroke_style(if is_capital {
        CAPITAL_RING_COLOR
    } else {
        "rgba(232, 216, 138, 0.72)"
    });
    ctx.set_line_width(if is_capital {
        CAPITAL_RING_LINE_W
    } else {
        PILL_RING_LINE_W
    });
    ctx.stroke();
    if is_capital {
        let inner_r = 2.0_f64.max(pill_r - CAPITAL_INNER_RING_INSET + 2.0);
        rounded_rect(
            &mut ctx,
            CAPITAL_INNER_RING_INSET,
            CAPITAL_INNER_RING_INSET,
            w_css - CAPITAL_INNER_RING_INSET * 2.0,
            h_css - CAPITAL_INNER_RING_INSET * 2.0,
            inner_r,
        );
        ctx.set_stroke_style(CAPITAL_INNER_RING_COLOR);
        ctx.set_line_width(CAPITAL_INNER_RING_LINE_W);
        ctx.stroke();
    }

    let cy = l.base_h * 0.5;
    let civ_cx = PAD_X + (if has_defense { defense_w + GAP } else { 0.0 }) + CIV_SLOT_W * 0.5;
    if has_defense {
        let shield_cx = PAD_X + defense_w * 0.5;
        draw_defense_shield(&mut ctx, shield_cx, cy, input.defense_tier);
    }
    let content = CivMedallionContent {
        sigil: medallion.sigil,
        portrait: medallion.portrait,
        is_city_state: input.is_city_state,
    };
    draw_civ_medallion(&mut ctx, civ_cx, cy, input.owner_color, &content)?;
    if crown_w != 0.0 {
        let crown_cx = PAD_X
            + (if has_defense { defense_w + GAP } else { 0.0 })
            + CIV_SLOT_W
            + GAP
            + crown_w * 0.5;
        draw_capital_crown(&mut ctx, crown_cx, cy)?;
    }

    let name_x = PAD_X + l.left_icons_w;
    ctx.set_fill_style("#f4f0e8");
    fill_text(
        &mut ctx,
        NAME_FONT,
        "left",
        "middle",
        &l.display_name,
        name_x,
        cy,
    );

    let mut after_name_x = name_x + l.name_w;
    if let Some(label) = &l.growth_label {
        draw_growth_label(&mut ctx, after_name_x + GAP, cy, label);
        after_name_x += GAP + l.growth_w;
    }
    if input.prod_active {
        let prod_cx = after_name_x + GAP + prod_w * 0.5;
        draw_prod_icon(&mut ctx, prod_cx, cy, prod_icon);
    }

    let cx = w_css - PAD_X - CIRCLE_D * 0.5;
    full_circle(&mut ctx, cx, cy, CIRCLE_D * 0.5)?;
    ctx.set_fill_style("#e8d88a");
    ctx.fill();

    ctx.set_fill_style("#2a2208");
    fill_text(
        &mut ctx,
        POP_FONT,
        "center",
        "middle",
        &l.pop_str,
        cx,
        cy + 1.0,
    );

    if l.hover_detail {
        let sep_y = l.base_h - 1.0;
        ctx.begin_path();
        ctx.move_to(PAD_X, sep_y);
        ctx.line_to(w_css - PAD_X, sep_y);
        ctx.set_stroke_style("rgba(232, 216, 138, 0.28)");
        ctx.set_line_width(1.0);
        ctx.stroke();
        draw_hover_prod_row(
            &mut ctx,
            PAD_X,
            l.base_h + HOVER_ROW_H * 0.5,
            w_css - PAD_X * 2.0,
            input,
        )?;
    }
    Ok(ctx)
}

/// `drawCityMapBadgeCanvasLegacy(cityName, population)` (`:951-958`): the
/// input of the legacy overloads (`defenseTier: 0`, `civIconId: 'grecy'`).
#[must_use]
pub fn legacy_input(city_name: &str, population: f64) -> CityMapBadgeInput {
    CityMapBadgeInput {
        city_name: city_name.to_owned(),
        population,
        defense_tier: 0,
        civ_icon_id: "grecy".into(),
        ..CityMapBadgeInput::default()
    }
}

/// The image sources injected by `main.ts:8531-8535`
/// (`setCityMapBadgeCivSigil`, `setCityMapBadgeLeaderPortrait`,
/// `setCityMapBadgeProdIcon`). `None` (or an empty result) = nothing to
/// load: the setter was never called, the source returned `''` / `null`.
pub trait CityMapBadgeAssets {
    /// `civSigilSvgFn(civIconId)` — the raw SVG (before
    /// `prepareSvgForCanvas`).
    fn civ_sigil_svg(&self, civ_icon_id: &str) -> Option<String>;
    /// `leaderPortraitUrlFn(civIconId, era)` — the bytes of the JPG the URL
    /// points at.
    fn leader_portrait_jpeg(&self, civ_icon_id: &str, era: f64) -> Option<Vec<u8>>;
    /// `prodIconSvgFn(kind, id)` — the raw SVG.
    fn prod_icon_svg(&self, kind: &str, id: &str) -> Option<String>;
}

/// The images a badge loads (`makeCityMapBadgeSprite`, `:1093-1109`).
#[derive(Debug, Default)]
pub struct BadgeImages {
    /// The civ sigil (`prepareSvgForCanvas(svg, CIV_SIGIL_STROKE)`).
    pub sigil: Option<SvgImage>,
    /// The leader portrait (only requested for a non-city-state).
    pub portrait: Option<MippedImage>,
    /// The production icon (`prepareSvgForCanvas(svg, '#e8d88a', 1.2)`),
    /// only requested when `prodActive && prodKind && prodId`.
    pub prod_icon: Option<SvgImage>,
}

impl BadgeImages {
    /// How many images loaded (= repaints, = `texture.version - 1`).
    #[must_use]
    pub fn count(&self) -> u32 {
        u32::from(self.sigil.is_some())
            + u32::from(self.portrait.is_some())
            + u32::from(self.prod_icon.is_some())
    }
}

fn load_svg(raw: Option<String>, stroke: &str, boost: f64) -> Option<SvgImage> {
    let svg = prepare_svg_for_canvas(&raw?, stroke, boost);
    if svg.is_empty() {
        return None;
    }
    // An unparsable document never fires `onload`.
    SvgImage::parse(&svg).ok()
}

/// Resolves the images of `input` the way `makeCityMapBadgeSprite` requests
/// them: sigil always, portrait unless city-state (`era ?? 1`), production
/// icon when `prodActive && prodKind && prodId` (JS truthiness). A JPG
/// that does not decode is the `onerror` path (absent).
#[must_use]
pub fn load_badge_images(
    input: &CityMapBadgeInput,
    assets: Option<&dyn CityMapBadgeAssets>,
) -> BadgeImages {
    let Some(a) = assets else {
        return BadgeImages::default();
    };
    let sigil = load_svg(
        a.civ_sigil_svg(&input.civ_icon_id),
        CIV_SIGIL_STROKE,
        SIGIL_STROKE_BOOST,
    );
    let portrait = if input.is_city_state {
        None
    } else {
        a.leader_portrait_jpeg(&input.civ_icon_id, input.era.unwrap_or(1.0))
            .filter(|b| !b.is_empty())
            .and_then(|b| decode_jpeg(&b).ok())
            .map(MippedImage::new)
    };
    let kind = input.prod_kind.as_deref().filter(|k| !k.is_empty());
    let id = input.prod_id.as_deref().filter(|k| !k.is_empty());
    let prod_icon = match (input.prod_active, kind, id) {
        (true, Some(k), Some(i)) => {
            load_svg(a.prod_icon_svg(k, i), "#e8d88a", PROD_ICON_STROKE_BOOST)
        }
        _ => None,
    };
    BadgeImages {
        sigil,
        portrait,
        prod_icon,
    }
}

/// A rendered badge: both ends of the web's asynchronous repaint sequence.
#[derive(Clone, Debug, PartialEq)]
pub struct CityBadgeTexture {
    /// `cityMapBadgeKey(input)`.
    pub key: String,
    /// The synchronous first paint (no image, `version` 1).
    pub initial: CanvasTexture,
    /// After every image that loads (`version` 1 + loaded images).
    pub texture: CanvasTexture,
}

/// The badge texture of `input` (the `if (!tex)` branch of
/// `makeCityMapBadgeSprite`, `:1073-1110`).
///
/// # Errors
/// See [`paint_city_map_badge`].
pub fn render_city_map_badge(
    input: &CityMapBadgeInput,
    assets: Option<&dyn CityMapBadgeAssets>,
    device_pixel_ratio: Option<f64>,
) -> Result<CityBadgeTexture, RasterError> {
    let none = CivMedallionContent::default();
    let first = paint_city_map_badge(input, &none, None, device_pixel_ratio)?;
    let initial = CanvasTexture::from_canvas(&first, 1);
    let imgs = load_badge_images(input, assets);
    let n = imgs.count();
    let texture = if n == 0 {
        initial.clone()
    } else {
        let content = CivMedallionContent {
            sigil: imgs.sigil.as_ref(),
            portrait: imgs.portrait.as_ref(),
            is_city_state: input.is_city_state,
        };
        let c = paint_city_map_badge(input, &content, imgs.prod_icon.as_ref(), device_pixel_ratio)?;
        CanvasTexture::from_canvas(&c, 1 + n)
    };
    Ok(CityBadgeTexture {
        key: city_map_badge_key(input),
        initial,
        texture,
    })
}

/// The sprite `makeCityMapBadgeSprite` returns for a badge texture of
/// `width × height` device px (`:1111-1124`): world height 0.52, width
/// `0.52 · width / height`, at (0, 0.92, 0), `renderOrder` 12.
#[must_use]
pub fn city_map_badge_sprite(key: &str, width: u32, height: u32) -> SpriteNode {
    let mut s = SpriteNode::new(SpriteMaterial::overlay(TextureRef::CityBadge(
        key.to_owned(),
    )));
    let aspect = f64::from(width) / f64::from(height);
    s.scale = [BADGE_WORLD_H * aspect, BADGE_WORLD_H, 1.0];
    s.position = BADGE_POSITION;
    s.render_order = BADGE_RENDER_ORDER;
    s
}

/// `disposeCityMapBadgeTexturesForOtherLod(cache, lodLevel)`
/// (`:1034-1047`) on a list of cache keys (insertion order): the keys that
/// would be disposed — every key not ending in `|l<segment>`.
#[must_use]
pub fn badge_keys_for_other_lod<'a>(keys: &[&'a str], lod_level: Option<f64>) -> Vec<&'a str> {
    let keep = format!("|l{}", city_badge_lod_segment(lod_level));
    keys.iter()
        .copied()
        .filter(|k| !k.ends_with(&keep))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initials_follow_the_web_rules() {
        assert_eq!(civ_initial_for_icon_id(" Grecy "), "G");
        assert_eq!(civ_initial_for_icon_id(""), "?");
        assert_eq!(civ_initial_for_icon_id("łotysze"), "Ł");
        assert_eq!(civ_initial_for_icon_id("9x"), "?");
        // `'ß'.toUpperCase()` = "SS", which the regex still matches.
        assert_eq!(civ_initial_for_icon_id("ßab"), "SS");
    }

    #[test]
    fn walls_and_tiers() {
        assert_eq!(wall_kind_from_built(None), CityMapWallKind::None);
        assert_eq!(
            wall_kind_from_built(Some(&["palisada", "fort"])),
            CityMapWallKind::Stone
        );
        assert_eq!(defense_tier_from_city(Some(&["palisada"])), 1);
    }

    #[test]
    fn hover_line_rules() {
        let mut i = legacy_input("A", 1.0);
        i.prod_paused = true;
        assert_eq!(hover_row_line(&i), "Produkcja wstrzymana");
        i.prod_item_name = Some(" Koszary ".into());
        assert_eq!(hover_row_line(&i), "Koszary \u{b7} wstrzymana");
        i.prod_paused = false;
        i.prod_item_name = None;
        i.resource_warning = true;
        assert_eq!(hover_row_line(&i), "Brak surowc\u{f3}w w magazynie");
    }

    /// `drawCivMedallion` (`:556`): a portrait handed to a city-state badge
    /// is ignored (the web also never requests one, `:1097`), a major civ
    /// draws it.
    #[test]
    fn portrait_is_ignored_for_a_city_state() {
        use crate::raster::RasterImage;
        let img =
            RasterImage::from_straight_rgba8(2, 2, &[200, 30, 30, 255].repeat(4)).expect("2x2");
        let portrait = MippedImage::new(img);
        let paint = |cs: bool, with: bool| {
            let mut i = legacy_input("Delfy", 4.0);
            i.is_city_state = cs;
            let content = CivMedallionContent {
                sigil: None,
                portrait: with.then_some(&portrait),
                is_city_state: cs,
            };
            paint_city_map_badge(&i, &content, None, Some(1.0))
                .expect("paint")
                .rgba_hash()
        };
        assert_eq!(paint(true, true), paint(true, false));
        assert_ne!(paint(false, true), paint(false, false));
    }

    #[test]
    fn layout_of_the_legacy_badge() {
        let l = badge_layout(&legacy_input("  ", 0.0)).expect("layout");
        // `('  ' || 'Miasto').trim()` is empty: no fallback to "Miasto".
        assert_eq!(l.name, "");
        assert_eq!(l.pop_str, "1");
        assert_eq!(l.width, 10.0 + 38.0 + 8.0 + 8.0 + 30.0 + 10.0);
        assert_eq!(l.height, 48.0);
    }
}
