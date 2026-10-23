//! `render/cityOkolicaOverlay.ts` (pin `edb8fb56`, 347 LOC): the overlay of
//! a city's surroundings shown while the city panel is open — the range,
//! centre and worked-field tints (MOD-13 `buildRangeOverlayGroup`,
//! [`crate::models::misc::range`]) and one yield label per workable hex
//! (🍞 🔨 💰 rows; a 👤 badge on worked fields).
//!
//! `:N` = line `N` of `cityOkolicaOverlay.ts`.
//!
//! **DTO boundary.** Game rules stay with the caller:
//! `hexHasCoveringTerrainImprovement` (`game/terrain-improvements.ts`) is an
//! input set ([`OkolicaMap::covering_improvement`]), yields come from the
//! `yield_of` callback (the web's `params.yieldOf`, `main.ts:5760`), the
//! worked keys and the owner id are parameters. `hexKeysWithinRadius`
//! (`game/okolica.ts:66-77`) and `hexDistance` (`units/setup.ts:354-359`)
//! are pure hex geometry and are ported here (private helpers), so the range
//! enumeration order is the web's.

use std::collections::HashSet;

use super::trace;
use super::worker_field::worker_owner_color_rgba;
use super::{js_number_string, js_round, CanvasTexture, SpriteMaterial, SpriteNode, TextureRef};
use crate::models::misc::range::{build_range_overlay_group_game, RangeOverlayStyle};
use crate::models::misc::{HexKey, HexKeySet, OverlayGroup, OverlayMap};
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;
use crate::raster::image::emoji::{self, TextStyle};
use crate::raster::{Canvas2dLite, RasterError};

/// `CITY_RANGE_OVERLAY_STYLE` (`:19-26`).
pub const CITY_RANGE_OVERLAY_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_color: 0x00c8_a840,
    tint_opacity: 0.12,
    border_color: 0x0066_aaff,
    border_opacity: 0.88,
    border_band_width: Some(0.0),
    y_offset: Some(0.06),
    hug_terrain_relief: false,
};

/// `CITY_CENTER_OVERLAY_STYLE` (`:29-36`).
pub const CITY_CENTER_OVERLAY_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_color: 0x0030_80e0,
    tint_opacity: 0.28,
    border_color: 0x0088_c4ff,
    border_opacity: 0.98,
    border_band_width: Some(0.0),
    y_offset: Some(0.11),
    hug_terrain_relief: false,
};

/// `CITY_WORKED_OVERLAY_STYLE` (`:38-45`).
pub const CITY_WORKED_OVERLAY_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_color: 0x0028_ff78,
    tint_opacity: 0.46,
    border_color: 0x0066_ffaa,
    border_opacity: 0.78,
    border_band_width: Some(0.0),
    y_offset: Some(0.09),
    hug_terrain_relief: false,
};

/// `YIELD_FONT_SCALE` (`:79`).
pub const YIELD_FONT_SCALE: f64 = 1.22;
/// `YIELD_WORLD_SCALE` (`:81`).
pub const YIELD_WORLD_SCALE: f64 = 1.35 * 1.04;
/// `YIELD_NUMBER_GOLD` (`:83`).
pub const YIELD_NUMBER_GOLD: &str = "#e0b24a";
/// `YIELD_NUMBER_DEFAULT` (`:84`).
pub const YIELD_NUMBER_DEFAULT: &str = "#fffef8";
/// `YIELD_WORKED_DIGIT_SCALE` (`:91`).
pub const YIELD_WORKED_DIGIT_SCALE: f64 = 1.28;
/// `YIELD_WORKED_EMOJI_SCALE` (`:92`).
pub const YIELD_WORKED_EMOJI_SCALE: f64 = 1.1;
/// `WORKER_BADGE_R` (`:104`).
pub const WORKER_BADGE_R: f64 = 9.0;
/// `WORKER_BADGE_CY` (`:105`).
pub const WORKER_BADGE_CY: f64 = 16.0;
/// `WORKER_BADGE_GLYPH_PX` (`:106`).
pub const WORKER_BADGE_GLYPH_PX: f64 = 13.0;
/// `WORKER_BADGE_RING_DR` (`:108`).
pub const WORKER_BADGE_RING_DR: f64 = 4.0;
/// `WORKER_BADGE_RING_LW` (`:109`).
pub const WORKER_BADGE_RING_LW: f64 = 3.5;
/// `WORKER_BADGE_RIM_DR` (`:110`).
pub const WORKER_BADGE_RIM_DR: f64 = 5.5;
/// Label canvas width (`:196`).
pub const LABEL_CANVAS_W: u32 = 128;
/// Label sprite `renderOrder` (`:221`).
pub const LABEL_RENDER_ORDER: i32 = 20;
/// `HUMAN_OWNER_PRIMARY` (`game/human-owners.ts:21`), the default owner.
pub const HUMAN_OWNER_PRIMARY: f64 = 0.0;

/// `YIELD_EMOJI_FONT(px)` (`:85-86`).
#[must_use]
pub fn yield_emoji_font(px: f64) -> String {
    format!(
        "{}px \"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
        js_number_string(px)
    )
}

/// `YIELD_DIGIT_FONT(px)` (`:87-88`).
#[must_use]
pub fn yield_digit_font(px: f64) -> String {
    format!(
        "bold {}px Arial, Helvetica, sans-serif",
        js_number_string(px)
    )
}

/// `TileYield` (`game/okolica.ts:148`): optional numbers.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct TileYield {
    /// `zywnosc`.
    pub zywnosc: Option<f64>,
    /// `praca`.
    pub praca: Option<f64>,
    /// `handel`.
    pub handel: Option<f64>,
}

/// One row of a yield label (`YieldLine`, `:68`).
#[derive(Clone, Debug, PartialEq)]
pub struct YieldLine {
    /// `emoji`.
    pub emoji: &'static str,
    /// `value`.
    pub value: f64,
}

/// `yieldLabelLines(y)` (`:70-76`): 🍞 / 🔨 / 💰 for each value `> 0`
/// (`undefined`, `0`, negatives and `NaN` are skipped).
#[must_use]
pub fn yield_label_lines(y: &TileYield) -> Vec<YieldLine> {
    let mut lines = Vec::new();
    let pos = |v: Option<f64>| v.filter(|v| *v > 0.0);
    if let Some(v) = pos(y.zywnosc) {
        lines.push(YieldLine {
            emoji: "\u{1f35e}",
            value: v,
        });
    }
    if let Some(v) = pos(y.praca) {
        lines.push(YieldLine {
            emoji: "\u{1f528}",
            value: v,
        });
    }
    if let Some(v) = pos(y.handel) {
        lines.push(YieldLine {
            emoji: "\u{1f4b0}",
            value: v,
        });
    }
    lines
}

fn fill_text(
    ctx: &mut Canvas2dLite,
    font: &str,
    align: &str,
    baseline: &str,
    t: &str,
    x: f64,
    y: f64,
) {
    trace::fill_text_event(font, align, baseline, t, x, y);
    if let Some(style) = TextStyle::new(font, align, baseline) {
        emoji::fill_text(ctx, &style, t, x, y);
    }
}

fn measure(font: &str, t: &str) -> f64 {
    emoji::measure_text(font, t).unwrap_or(0.0)
}

/// `drawWorkerBadge(ctx, cx, ownerId)` (`:119-143`).
///
/// # Errors
/// Never in practice (positive radii).
pub fn draw_worker_badge(
    ctx: &mut Canvas2dLite,
    cx: f64,
    owner_id: f64,
) -> Result<(), RasterError> {
    let cy = WORKER_BADGE_CY;
    let pi2 = std::f64::consts::PI * 2.0;
    ctx.set_stroke_style(&worker_owner_color_rgba(owner_id, 1.0));
    ctx.set_line_width(WORKER_BADGE_RING_LW);
    ctx.begin_path();
    ctx.arc(
        cx,
        cy,
        WORKER_BADGE_R + WORKER_BADGE_RING_DR,
        0.0,
        pi2,
        false,
    )?;
    ctx.stroke();
    ctx.set_stroke_style("rgba(0,0,0,0.35)");
    ctx.set_line_width(1.0);
    ctx.begin_path();
    ctx.arc(
        cx,
        cy,
        WORKER_BADGE_R + WORKER_BADGE_RIM_DR,
        0.0,
        pi2,
        false,
    )?;
    ctx.stroke();

    trace::set_fill_style(ctx, &worker_owner_color_rgba(owner_id, 0.72));
    ctx.begin_path();
    ctx.arc(cx, cy, WORKER_BADGE_R, 0.0, pi2, false)?;
    ctx.fill();

    trace::set_fill_style(ctx, "rgba(255,255,255,0.92)");
    let font = format!(
        "bold {}px Segoe UI, Arial",
        js_number_string(WORKER_BADGE_GLYPH_PX)
    );
    fill_text(ctx, &font, "center", "middle", "\u{1f464}", cx, cy + 1.0);
    Ok(())
}

/// `drawYieldLine(ctx, cx, y, line, fontPx, worked)` (`:145-181`).
pub fn draw_yield_line(
    ctx: &mut Canvas2dLite,
    cx: f64,
    y: f64,
    line: &YieldLine,
    font_px: f64,
    worked: bool,
) {
    let num_str = js_number_string(line.value);
    let emoji_px = if worked {
        js_round(font_px * YIELD_WORKED_EMOJI_SCALE)
    } else {
        font_px
    };
    let digit_px = if worked {
        js_round(font_px * YIELD_WORKED_DIGIT_SCALE)
    } else {
        font_px
    };

    ctx.set_text_align("left");
    ctx.set_text_baseline("top");
    trace::set_shadow_color(ctx, "transparent");
    trace::set_shadow_blur(ctx, 0.0);

    let ef = yield_emoji_font(emoji_px);
    let df = yield_digit_font(digit_px);
    let emoji_w = measure(&ef, line.emoji);
    let num_w = measure(&df, &num_str);
    let mut x = cx - (emoji_w + num_w) / 2.0;

    trace::set_fill_style(ctx, "rgba(255,255,255,0.95)");
    fill_text(ctx, &ef, "left", "top", line.emoji, x, y);
    x += emoji_w;

    trace::set_fill_style(
        ctx,
        if worked {
            YIELD_NUMBER_GOLD
        } else {
            YIELD_NUMBER_DEFAULT
        },
    );
    trace::set_shadow_color(
        ctx,
        if worked {
            "rgba(0,0,0,0.75)"
        } else {
            "rgba(0,0,0,0.45)"
        },
    );
    trace::set_shadow_blur(ctx, if worked { 3.0 } else { 2.0 });
    trace::set_shadow_offset_y(ctx, 1.0);
    fill_text(
        ctx,
        &df,
        "left",
        "top",
        &num_str,
        x,
        y - if worked { 2.0 } else { 0.0 },
    );
    trace::set_shadow_color(ctx, "transparent");
    trace::set_shadow_blur(ctx, 0.0);
}

/// The canvas height of a label (`:184-194`).
#[must_use]
pub fn label_canvas_height(lines: usize, worker: bool) -> f64 {
    let s = YIELD_FONT_SCALE;
    let line_h = js_round(14.5 * s);
    let line_h_worked = js_round(16.5 * s);
    let pad_bottom = js_round(7.0 * s);
    let start_y = if worker {
        js_round(24.0 * s)
    } else {
        js_round(7.0 * s)
    };
    let row_h = if worker { line_h_worked } else { line_h };
    let mut sum = 0.0;
    for _ in 0..lines {
        sum += row_h;
    }
    js_round((if worker { 56.0 } else { 38.0 }) * s).max(start_y + sum + pad_bottom)
}

/// The label texture of `makeLabelSprite(lines, worker, ownerId)`
/// (`:183-212`).
///
/// # Errors
/// Never in practice (128 × ≥ 46 canvas).
pub fn render_yield_label(
    lines: &[YieldLine],
    worker: bool,
    owner_id: f64,
) -> Result<CanvasTexture, RasterError> {
    let s = YIELD_FONT_SCALE;
    let font_px = js_round(13.0 * s);
    let line_h = js_round(14.5 * s);
    let line_h_worked = js_round(16.5 * s);
    let start_y = if worker {
        js_round(24.0 * s)
    } else {
        js_round(7.0 * s)
    };
    let h = label_canvas_height(lines.len(), worker);
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let h_px = h as u32; // integral, 46..=a few hundred
    let mut ctx = Canvas2dLite::new(LABEL_CANVAS_W, h_px)?;
    trace::clear_rect(&mut ctx, 0.0, 0.0, f64::from(LABEL_CANVAS_W), h);
    if worker {
        draw_worker_badge(&mut ctx, 64.0, owner_id)?;
    }
    ctx.set_font(&yield_digit_font(font_px));
    let mut row_y = start_y;
    for line in lines {
        draw_yield_line(&mut ctx, 64.0, row_y, line, font_px, worker);
        row_y += if worker { line_h_worked } else { line_h };
    }
    Ok(CanvasTexture::from_canvas(&ctx, 1))
}

/// The surroundings map: terrain per hex (MOD-13 [`OverlayMap`]) and the
/// game's `hexHasCoveringTerrainImprovement` result per hex.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct OkolicaMap {
    /// `map.hexes[*].terenBazowy` (+ `seed`).
    pub map: OverlayMap,
    /// Hexes for which `hexHasCoveringTerrainImprovement(hex)` is `true`.
    pub covering_improvement: HashSet<HexKey>,
}

/// `CityOkolicaOverlayParams` (`:47-60`).
pub struct CityOkolicaOverlayParams<'a> {
    /// `cityQ`.
    pub city_q: i32,
    /// `cityR`.
    pub city_r: i32,
    /// `range` (a JS number).
    pub range: f64,
    /// `workedKeys` (insertion order kept).
    pub worked_keys: &'a HexKeySet,
    /// `yieldOf(q, r)`.
    pub yield_of: &'a dyn Fn(i32, i32) -> TileYield,
    /// `showYields` (`None` = `undefined` = shown).
    pub show_yields: Option<bool>,
    /// `ownerId` (`None` → [`HUMAN_OWNER_PRIMARY`]).
    pub owner_id: Option<f64>,
}

/// `hexDistance(aq, ar, bq, br)` (`units/setup.ts:354-359`).
fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// `hexKeysWithinRadius(cq, cr, rad, map)` (`game/okolica.ts:66-77`).
fn hex_keys_within_radius(cq: i32, cr: i32, rad: f64, map: &OverlayMap) -> Vec<HexKey> {
    let r = if rad.is_finite() && rad > 0.0 {
        rad.floor()
    } else {
        0.0
    };
    // Radii beyond i32 are not representable as hex coordinates anyway.
    #[allow(clippy::cast_possible_truncation)]
    let r = r.min(f64::from(i32::MAX / 4)) as i32;
    let mut out = Vec::new();
    for dq in -r..=r {
        let lo = (-r).max(-dq - r);
        let hi = r.min(-dq + r);
        for dr in lo..=hi {
            let key = (cq + dq, cr + dr);
            if map.hexes.contains_key(&key) {
                out.push(key);
            }
        }
    }
    out
}

/// `collectRangeKeys(map, cq, cr, range)` (`:239-249`).
#[must_use]
pub fn collect_range_keys(map: &OverlayMap, cq: i32, cr: i32, range: f64) -> HexKeySet {
    let keys: Vec<HexKey> = hex_keys_within_radius(cq, cr, range, map)
        .into_iter()
        .filter(|&(q, r)| {
            hex_distance(f64::from(cq), f64::from(cr), f64::from(q), f64::from(r)) <= range
        })
        .collect();
    HexKeySet::new(&keys)
}

/// One yield label of the overlay.
#[derive(Clone, Debug, PartialEq)]
pub struct YieldLabel {
    /// The hex.
    pub hex: HexKey,
    /// Its rows.
    pub lines: Vec<YieldLine>,
    /// `true` on a worked field (👤 badge, gold digits).
    pub worker: bool,
    /// The sprite (texture [`TextureRef::YieldLabel`]).
    pub sprite: SpriteNode,
    /// The label texture.
    pub texture: CanvasTexture,
}

/// The overlay group (`THREE.Group` `city-okolica-overlay`, `:252-307`).
#[derive(Clone, Debug, PartialEq)]
pub struct CityOkolicaOverlay {
    /// `group.name`.
    pub name: &'static str,
    /// `okolica-range` (a renamed `range-overlay` group).
    pub range: OverlayGroup,
    /// `okolica-city-center`.
    pub center: OverlayGroup,
    /// `okolica-worked` (only when there are worked keys).
    pub worked: Option<OverlayGroup>,
    /// `okolica-yields` (only when `showYields !== false`).
    pub yields: Option<Vec<YieldLabel>>,
}

impl CityOkolicaOverlay {
    /// Names of the children of the group, in order (`group.children`).
    #[must_use]
    pub fn child_names(&self) -> Vec<&str> {
        let mut v = vec![self.range.name.as_str(), self.center.name.as_str()];
        if let Some(w) = &self.worked {
            v.push(w.name.as_str());
        }
        if self.yields.is_some() {
            v.push("okolica-yields");
        }
        v
    }
}

/// `makeLabelSprite` + `placeYieldLabelSprite` (`:183-237`): the sprite
/// of a `h`-px-high label on hex `(q, r)`.
#[must_use]
pub fn yield_label_sprite(map: &OverlayMap, (q, r): HexKey, h: f64) -> SpriteNode {
    let mut m = SpriteMaterial::overlay(TextureRef::YieldLabel((q, r)));
    m.depth_write = false;
    let mut s = SpriteNode::new(m);
    s.render_order = LABEL_RENDER_ORDER;
    s.center = [0.5, 0.5];
    let world_scale = YIELD_WORLD_SCALE;
    let world_h = (h / f64::from(LABEL_CANVAS_W)) * world_scale;
    s.scale = [world_scale, world_h, 1.0];
    s.label_world_height = Some(world_h);
    let (x, z) = axial_to_world(HexCoord { q, r }, HEX_R);
    let surface_y = map.hex_top_y((q, r), 0.05);
    s.position = [x, surface_y + world_h * 0.38, z];
    s
}

/// `buildCityOkolicaOverlayGroup(map, params)` (`:252-307`).
///
/// # Errors
/// Never in practice (label canvases are 128 × ≥ 46).
pub fn build_city_okolica_overlay(
    map: &OkolicaMap,
    params: &CityOkolicaOverlayParams<'_>,
) -> Result<CityOkolicaOverlay, RasterError> {
    let range_keys = collect_range_keys(&map.map, params.city_q, params.city_r, params.range);
    let mut range =
        build_range_overlay_group_game(&map.map, &range_keys, &CITY_RANGE_OVERLAY_STYLE);
    range.name = "okolica-range".into();

    let city_key = (params.city_q, params.city_r);
    let mut center = build_range_overlay_group_game(
        &map.map,
        &HexKeySet::new(&[city_key]),
        &CITY_CENTER_OVERLAY_STYLE,
    );
    center.name = "okolica-city-center".into();

    let worked = if params.worked_keys.is_empty() {
        None
    } else {
        let mut w = build_range_overlay_group_game(
            &map.map,
            params.worked_keys,
            &CITY_WORKED_OVERLAY_STYLE,
        );
        w.name = "okolica-worked".into();
        Some(w)
    };

    let yields = if params.show_yields == Some(false) {
        None
    } else {
        let mut labels = Vec::new();
        for key in range_keys.iter() {
            let Some(t) = map.map.terrain(key) else {
                continue;
            };
            if t == Terrain::Morze || t == Terrain::Gory {
                continue;
            }
            if key != city_key && map.covering_improvement.contains(&key) {
                continue;
            }
            let yld = (params.yield_of)(key.0, key.1);
            let parts = yield_label_lines(&yld);
            if parts.is_empty() {
                continue;
            }
            let worker = params.worked_keys.has(key);
            let owner = params.owner_id.unwrap_or(HUMAN_OWNER_PRIMARY);
            let texture = render_yield_label(&parts, worker, owner)?;
            let sprite = yield_label_sprite(&map.map, key, f64::from(texture.height));
            labels.push(YieldLabel {
                hex: key,
                lines: parts,
                worker,
                sprite,
                texture,
            });
        }
        Some(labels)
    };

    Ok(CityOkolicaOverlay {
        name: "city-okolica-overlay",
        range,
        center,
        worked,
        yields,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn label_heights() {
        assert_eq!(label_canvas_height(1, false), 46.0);
        assert_eq!(label_canvas_height(3, false), 9.0 + 54.0 + 9.0);
        assert_eq!(label_canvas_height(1, true), 68.0);
        assert_eq!(label_canvas_height(3, true), 29.0 + 60.0 + 9.0);
    }

    #[test]
    fn yield_rows_skip_non_positive() {
        let y = TileYield {
            zywnosc: Some(0.0),
            praca: Some(f64::NAN),
            handel: Some(1.5),
        };
        let l = yield_label_lines(&y);
        assert_eq!(l.len(), 1);
        assert_eq!(l[0].emoji, "\u{1f4b0}");
    }

    #[test]
    fn range_enumeration_order() {
        let mut m = OverlayMap::default();
        for q in -2..=2 {
            for r in -2..=2 {
                m.hexes.insert((q, r), Terrain::Laka);
            }
        }
        let k: Vec<HexKey> = collect_range_keys(&m, 0, 0, 1.0).iter().collect();
        assert_eq!(
            k,
            vec![(-1, 0), (-1, 1), (0, -1), (0, 0), (0, 1), (1, -1), (1, 0)]
        );
        assert!(collect_range_keys(&m, 0, 0, f64::NAN).is_empty());
    }
}
