//! `render/unitStatPlate.ts` (pin `edb8fb56`, 936 LOC): the plate above a
//! unit token — dark rounded background with a gold border and two troughs,
//! movement (blue) and HP (green / amber / red) bars scaled in x, a gold
//! divider, the small owner icon on the left and the army-power box on the
//! right, with numbers composed from ten per-digit textures.
//!
//! All plate elements lie in ONE plane tilted by [`PLATE_TILT_RAD`] (the
//! web fix for bars drifting apart as billboards, `:245-268`).

use super::emblem::{owner_emblem_key, OwnerEmblemContext};
use super::{canvas, flat_material, Anchor, GeometryKind, OverlayNode, OverlayTexture};
use super::{js_number_string, OverlayTree, TextureFilter, TextureRef};
use crate::core::hexutil::HEX_R;
use crate::core::vitals::{
    VITALS_HP_FULL, VITALS_HP_LOW, VITALS_HP_LOW_FRAC, VITALS_HP_MID, VITALS_HP_MID_FRAC,
    VITALS_MOVE_FULL, VITALS_TROUGH_CSS,
};
use crate::pick::hex::js_round;
use crate::raster::{Canvas2dLite, RasterError};

/// `PLATE_BAR_W` (`:92`).
pub const PLATE_BAR_W: f64 = 0.55 * HEX_R;
/// `PLATE_BAR_H` (`:94`).
pub const PLATE_BAR_H: f64 = 0.056 * HEX_R;
/// `PLATE_BAR_GAP` (`:103`).
pub const PLATE_BAR_GAP: f64 = 0.042 * HEX_R;
/// `PLATE_DIVIDER_H` (`:126`).
pub const PLATE_DIVIDER_H: f64 = 0.020 * HEX_R;
/// `PLATE_HP_BAR_Y` (`:129`).
pub const PLATE_HP_BAR_Y: f64 = 0.820 * HEX_R;
/// `PLATE_MOVE_BAR_Y` (`:131`).
pub const PLATE_MOVE_BAR_Y: f64 = PLATE_HP_BAR_Y + PLATE_BAR_H + PLATE_BAR_GAP;
/// `PLATE_PAD` (`:134`).
pub const PLATE_PAD: f64 = 0.020 * HEX_R;
/// `PLATE_BG_W` (`:136`).
pub const PLATE_BG_W: f64 = PLATE_BAR_W + 2.0 * PLATE_PAD;
/// `PLATE_BG_H` (`:138`).
pub const PLATE_BG_H: f64 = 2.0 * PLATE_BAR_H + PLATE_BAR_GAP + 2.0 * PLATE_PAD;
/// `PLATE_BG_Y` (`:140`).
pub const PLATE_BG_Y: f64 = (PLATE_HP_BAR_Y + PLATE_MOVE_BAR_Y) / 2.0;
/// `PLATE_BAR_LEFT_X` (`:147`).
pub const PLATE_BAR_LEFT_X: f64 = -PLATE_BAR_W / 2.0;
/// `PLATE_OWNER_ICON_SIZE` (`:154`).
pub const PLATE_OWNER_ICON_SIZE: f64 = 0.20 * HEX_R;
/// `PLATE_OWNER_GAP` (`:160`).
pub const PLATE_OWNER_GAP: f64 = 0.006 * HEX_R;
/// `PLATE_OWNER_X` (`:162`).
pub const PLATE_OWNER_X: f64 = -(PLATE_BG_W / 2.0 + PLATE_OWNER_GAP + PLATE_OWNER_ICON_SIZE / 2.0);
/// `PLATE_BAR_DY` (`:164`).
pub const PLATE_BAR_DY: f64 = (PLATE_BAR_H + PLATE_BAR_GAP) / 2.0;
/// `BADGE_ROW_Y` (`:195`) — height of the badge row (used by the badge modules).
pub const BADGE_ROW_Y: f64 = 1.27 * HEX_R;
/// `GENERAL_SLOT_Y` (`:209`) — reserved, nothing is drawn there.
pub const GENERAL_SLOT_Y: f64 = 1.65 * HEX_R;
/// `GENERAL_SLOT_SIZE` (`:210`).
pub const GENERAL_SLOT_SIZE: f64 = 0.17 * HEX_R;
/// `PLATE_POWER_BOX_W` (`:219`).
pub const PLATE_POWER_BOX_W: f64 = 0.24 * HEX_R;
/// `PLATE_POWER_BOX_H` (`:220`).
pub const PLATE_POWER_BOX_H: f64 = 0.20 * HEX_R;
/// `PLATE_POWER_GAP` (`:222`).
pub const PLATE_POWER_GAP: f64 = 0.010 * HEX_R;
/// `PLATE_POWER_X` (`:224`).
pub const PLATE_POWER_X: f64 = PLATE_BG_W / 2.0 + PLATE_POWER_GAP + PLATE_POWER_BOX_W / 2.0;
/// `PLATE_MAX_HALF_WIDTH` (`:243`).
pub const PLATE_MAX_HALF_WIDTH: f64 = 0.545 * HEX_R;
/// `PLATE_TILT_RAD` = `THREE.MathUtils.degToRad(52)` (`:268`):
/// `52 * (Math.PI / 180)`.
pub const PLATE_TILT_RAD: f64 = 52.0 * (std::f64::consts::PI / 180.0);
/// `PLATE_BG_Z` (`:274`).
pub const PLATE_BG_Z: f64 = 0.000 * HEX_R;
/// `PLATE_FILL_Z` (`:275`).
pub const PLATE_FILL_Z: f64 = 0.004 * HEX_R;
/// `PLATE_DIVIDER_Z` (`:276`).
pub const PLATE_DIVIDER_Z: f64 = 0.006 * HEX_R;
/// `PLATE_OWNER_Z` (`:277`).
pub const PLATE_OWNER_Z: f64 = 0.008 * HEX_R;
/// `PLATE_BG_RENDER_ORDER` (`:284`).
pub const PLATE_BG_RENDER_ORDER: i32 = 11;
/// `PLATE_FILL_RENDER_ORDER` (`:285`).
pub const PLATE_FILL_RENDER_ORDER: i32 = 12;
/// `PLATE_OWNER_RENDER_ORDER` (`:286`).
pub const PLATE_OWNER_RENDER_ORDER: i32 = 14;
/// `PLATE_GOLD_HEX` (`:305`).
pub const PLATE_GOLD_HEX: u32 = 0x00d4_af5a;
/// `PLATE_BORDER_CSS` (`:306`).
pub const PLATE_BORDER_CSS: &str = "rgba(212,175,90,0.70)";
/// `PLATE_FILL_CSS` (`:308`).
pub const PLATE_FILL_CSS: &str = "rgba(9,13,20,0.88)";
/// `BG_CANVAS_W` (`:311`).
pub const BG_CANVAS_W: u32 = 512;
/// `POWER_DIGIT_H` (`:524`).
pub const POWER_DIGIT_H: f64 = 0.126 * HEX_R;
/// `POWER_DIGIT_W` (`:526`).
pub const POWER_DIGIT_W: f64 = 0.072 * HEX_R;
/// `POWER_DIGIT_ADVANCE` (`:528`).
pub const POWER_DIGIT_ADVANCE: f64 = 0.066 * HEX_R;
/// `POWER_BOX_INNER_W` (`:530`).
pub const POWER_BOX_INNER_W: f64 = PLATE_POWER_BOX_W - 0.036 * HEX_R;
/// `POWER_FRAME_Z` (`:532`).
pub const POWER_FRAME_Z: f64 = 0.008 * HEX_R;
/// `POWER_DIGIT_Z` (`:533`).
pub const POWER_DIGIT_Z: f64 = 0.012 * HEX_R;
/// `POWER_RENDER_ORDER` (`:534`).
pub const POWER_RENDER_ORDER: i32 = 14;
/// `POWER_FRAME_CANVAS_W` (`:537`).
pub const POWER_FRAME_CANVAS_W: u32 = 256;
/// `POWER_DIGIT_CANVAS_W` (`:539`).
pub const POWER_DIGIT_CANVAS_W: u32 = 72;

#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // small positive integers
fn round_u32(x: f64) -> u32 {
    js_round(x) as u32
}

/// `BG_CANVAS_H` (`:312`): `Math.round((BG_CANVAS_W * PLATE_BG_H) / PLATE_BG_W)`.
#[must_use]
pub fn bg_canvas_h() -> u32 {
    round_u32((f64::from(BG_CANVAS_W) * PLATE_BG_H) / PLATE_BG_W)
}

/// `POWER_FRAME_CANVAS_H` (`:538`).
#[must_use]
pub fn power_frame_canvas_h() -> u32 {
    round_u32((f64::from(POWER_FRAME_CANVAS_W) * PLATE_POWER_BOX_H) / PLATE_POWER_BOX_W)
}

/// `POWER_DIGIT_CANVAS_H` (`:540`).
#[must_use]
pub fn power_digit_canvas_h() -> u32 {
    round_u32((f64::from(POWER_DIGIT_CANVAS_W) * POWER_DIGIT_H) / POWER_DIGIT_W)
}

/// `roundedRectPath(ctx, x, y, w, h, r)` of this module (`:314-326`,
/// radius clamped to half the side).
fn rounded_rect_path(
    ctx: &mut Canvas2dLite,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    r: f64,
) -> Result<(), RasterError> {
    let rr = r.min(w / 2.0).min(h / 2.0);
    ctx.begin_path();
    ctx.move_to(x + rr, y);
    ctx.arc_to(x + w, y, x + w, y + h, rr)?;
    ctx.arc_to(x + w, y + h, x, y + h, rr)?;
    ctx.arc_to(x, y + h, x, y, rr)?;
    ctx.arc_to(x, y, x + w, y, rr)?;
    ctx.close_path();
    Ok(())
}

/// Plate background (`getPlateBgAsset`, `:403-447`): dark rounded plate,
/// gold border, two dark troughs where the bars go. One per game.
///
/// # Errors
/// [`RasterError`] from the canvas (never for these constants).
pub fn render_plate_background() -> Result<OverlayTexture, RasterError> {
    let (w, h) = (BG_CANVAS_W, bg_canvas_h());
    let mut ctx = canvas(w, h)?;
    let (wf, hf) = (f64::from(w), f64::from(h));
    let px_per_unit = wf / PLATE_BG_W;
    let border = 5.0;
    ctx.clear_rect(0.0, 0.0, wf, hf);
    rounded_rect_path(
        &mut ctx,
        border / 2.0,
        border / 2.0,
        wf - border,
        hf - border,
        16.0,
    )?;
    ctx.set_fill_style(PLATE_FILL_CSS);
    ctx.fill();
    ctx.set_stroke_style(PLATE_BORDER_CSS);
    ctx.set_line_width(border);
    ctx.stroke();
    let bar_w_px = PLATE_BAR_W * px_per_unit;
    let bar_h_px = PLATE_BAR_H * px_per_unit;
    let xpx = PLATE_PAD * px_per_unit;
    ctx.set_fill_style(VITALS_TROUGH_CSS);
    for bar_y in [PLATE_MOVE_BAR_Y, PLATE_HP_BAR_Y] {
        let top_world = PLATE_BG_Y + PLATE_BG_H / 2.0 - (bar_y + PLATE_BAR_H / 2.0);
        rounded_rect_path(
            &mut ctx,
            xpx,
            top_world * px_per_unit,
            bar_w_px,
            bar_h_px,
            bar_h_px * 0.32,
        )?;
        ctx.fill();
    }
    Ok(OverlayTexture::from_canvas(
        &ctx,
        TextureFilter::LinearMipmapLinear,
        Anchor::Center,
        [PLATE_BG_W, PLATE_BG_H],
    ))
}

/// White army-power frame (`getPowerFrameTexture`, `:556-577`), tinted by
/// the owner colour through the material. One per game.
///
/// # Errors
/// [`RasterError`] from the canvas (never for these constants).
pub fn render_power_frame() -> Result<OverlayTexture, RasterError> {
    let (w, h) = (POWER_FRAME_CANVAS_W, power_frame_canvas_h());
    let mut ctx = canvas(w, h)?;
    let (wf, hf) = (f64::from(w), f64::from(h));
    let b = 12.0;
    ctx.clear_rect(0.0, 0.0, wf, hf);
    rounded_rect_path(&mut ctx, b / 2.0, b / 2.0, wf - b, hf - b, 20.0)?;
    ctx.set_fill_style("rgba(6,9,14,0.90)");
    ctx.fill();
    ctx.set_stroke_style("#ffffff");
    ctx.set_line_width(b);
    ctx.stroke();
    Ok(OverlayTexture::from_canvas(
        &ctx,
        TextureFilter::Linear,
        Anchor::Center,
        [PLATE_POWER_BOX_W, PLATE_POWER_BOX_H],
    ))
}

/// The font of the power digits (`:609`).
#[must_use]
pub fn power_digit_font() -> String {
    let px = js_round(f64::from(power_digit_canvas_h()) * 0.94);
    format!(
        "900 {}px \"Segoe UI\", Arial, sans-serif",
        js_number_string(px)
    )
}

/// One power digit 0–9 (`getPowerDigitMaterial`, `:600-626`): cream glyph
/// with a thick near-black outline. `None` for `digit > 9`.
///
/// # Errors
/// [`RasterError`] from the canvas (never for these constants).
pub fn render_power_digit(digit: u8) -> Result<Option<OverlayTexture>, RasterError> {
    if digit > 9 {
        return Ok(None);
    }
    let (w, h) = (POWER_DIGIT_CANVAS_W, power_digit_canvas_h());
    let mut ctx = canvas(w, h)?;
    let (wf, hf) = (f64::from(w), f64::from(h));
    ctx.clear_rect(0.0, 0.0, wf, hf);
    ctx.set_font(&power_digit_font());
    ctx.set_text_align("center");
    ctx.set_text_baseline("middle");
    ctx.set_line_join("round");
    ctx.set_line_width(js_round(hf * 0.22));
    ctx.set_stroke_style("#05070b");
    let text = digit.to_string();
    ctx.stroke_text(&text, wf / 2.0, hf / 2.0 + 1.0);
    ctx.set_fill_style("#fdf6e3");
    ctx.fill_text(&text, wf / 2.0, hf / 2.0 + 1.0);
    Ok(Some(OverlayTexture::from_canvas(
        &ctx,
        TextureFilter::LinearMipmapLinear,
        Anchor::Center,
        [POWER_DIGIT_W, POWER_DIGIT_H],
    )))
}

/// HP colour band (`HpBand`, `:454`): 0 green, 1 amber, 2 red.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HpBand {
    /// Healthy (> 60 %).
    Full = 0,
    /// 30–60 %.
    Mid = 1,
    /// ≤ 30 %.
    Low = 2,
}

impl HpBand {
    /// `hpBandFor(frac)` (`:456-460`).
    #[must_use]
    pub fn of(frac: f64) -> Self {
        if frac <= VITALS_HP_LOW_FRAC {
            HpBand::Low
        } else if frac <= VITALS_HP_MID_FRAC {
            HpBand::Mid
        } else {
            HpBand::Full
        }
    }

    /// `HP_BAND_COLOR[band]` (`:462-466`).
    #[must_use]
    pub const fn color(self) -> u32 {
        match self {
            HpBand::Full => VITALS_HP_FULL,
            HpBand::Mid => VITALS_HP_MID,
            HpBand::Low => VITALS_HP_LOW,
        }
    }
}

/// `UnitStatPlateVitals` (`:815-836`); `None` = JS `undefined`.
#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct StatPlateVitals {
    /// `ruchLeft`.
    pub ruch_left: Option<f64>,
    /// `ruchMax`.
    pub ruch_max: Option<f64>,
    /// `hp` (`undefined` = full).
    pub hp: Option<f64>,
    /// `hpMax`.
    pub hp_max: Option<f64>,
    /// `fieldPowerM` (0 / missing = no power box).
    pub field_power_m: Option<f64>,
    /// `ownerColor` (missing = `0xffffff`).
    pub owner_color: Option<u32>,
}

/// `barFraction(value, max)` (`:705-712`): missing / invalid data = FULL bar.
#[must_use]
pub fn bar_fraction(value: Option<f64>, max: Option<f64>) -> f64 {
    let m = max.filter(|x| x.is_finite()).unwrap_or(f64::NAN);
    if !m.is_finite() || m <= 0.0 {
        return 1.0;
    }
    let v = value.filter(|x| x.is_finite()).unwrap_or(f64::NAN);
    if !v.is_finite() {
        return 1.0;
    }
    if v <= 0.0 {
        return 0.0;
    }
    (v / m).min(1.0)
}

/// `powerText(power)` (`:640-645`): `''` = no power box.
#[must_use]
pub fn power_text(power: Option<f64>) -> String {
    let Some(p) = power.filter(|x| x.is_finite()) else {
        return String::new();
    };
    let n = js_round(p);
    if n <= 0.0 {
        return String::new();
    }
    js_number_string(n)
}

/// `packBars(moveFrac, hpFrac, band)` (`:737-741`).
#[must_use]
pub fn pack_bars(move_frac: f64, hp_frac: f64, band: HpBand) -> f64 {
    let m = js_round(move_frac * 1000.0);
    let h = js_round(hp_frac * 1000.0);
    m * 100_000.0 + h * 10.0 + f64::from(band as u8)
}

/// `"<power text>|<owner colour>"` (`:871-873`).
#[must_use]
pub fn power_key(vitals: &StatPlateVitals) -> String {
    let owner = vitals.owner_color.unwrap_or(0x00ff_ffff);
    format!("{}|{owner}", power_text(vitals.field_power_m))
}

/// Owner key of the plate: `ownerEmblemKey(octx)` or `'none'` (`:856`).
#[must_use]
pub fn plate_owner_key(octx: Option<&OwnerEmblemContext>) -> String {
    octx.map_or_else(|| "none".to_owned(), owner_emblem_key)
}

/// Which parts of a plate an `applyUnitStatPlate` call rebuilds
/// (`:851-908`, the idempotent `sync()` semantics).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub struct StatPlateUpdate {
    /// Owner variant changed (or first call): the whole plate is rebuilt.
    pub rebuild_plate: bool,
    /// Power text or owner colour changed: only the power box is rebuilt.
    pub rebuild_power: bool,
    /// The packed bar state changed: the two fill scales / HP material.
    pub update_bars: bool,
}

/// The `userData` of a token the web keeps for the plate
/// (`statPlateOwnerKey`, `statPlatePowerKey`, `statPlateBars`).
#[derive(Clone, Debug, PartialEq, Default)]
pub struct StatPlateSyncState {
    /// `statPlateOwnerKey`.
    pub owner_key: Option<String>,
    /// `statPlatePowerKey`.
    pub power_key: Option<String>,
    /// `statPlateBars` (`-1` right after a rebuild, then the packed value).
    pub bars: Option<f64>,
}

impl StatPlateSyncState {
    /// The bookkeeping of one `applyUnitStatPlate(group, octx, vitals)`.
    pub fn apply(
        &mut self,
        octx: Option<&OwnerEmblemContext>,
        vitals: &StatPlateVitals,
    ) -> StatPlateUpdate {
        let mut u = StatPlateUpdate::default();
        let key = plate_owner_key(octx);
        if self.owner_key.as_deref() != Some(key.as_str()) {
            u.rebuild_plate = true;
            self.owner_key = Some(key);
            self.bars = Some(-1.0);
            self.power_key = None;
        }
        let pk = power_key(vitals);
        if self.power_key.as_deref() != Some(pk.as_str()) {
            u.rebuild_power = true;
            self.power_key = Some(pk);
        }
        let move_frac = bar_fraction(vitals.ruch_left, vitals.ruch_max);
        let hp_frac = bar_fraction(vitals.hp, vitals.hp_max);
        let packed = pack_bars(move_frac, hp_frac, HpBand::of(hp_frac));
        #[allow(clippy::float_cmp)] // `===` of the web
        if self.bars != Some(packed) {
            u.update_bars = true;
            self.bars = Some(packed);
        }
        u
    }
}

fn flat(color: u32, map: Option<TextureRef>) -> super::OverlayMaterial {
    flat_material(color, map)
}

/// The fill bar (`makeFillMesh`, `:748-754`), already sized to `frac`
/// (`:895-907`).
fn fill_node(parent: usize, color: u32, dy: f64, frac: f64) -> OverlayNode {
    let mut n = OverlayNode::mesh(
        parent,
        GeometryKind::QuadLeft,
        flat(color, None),
        [PLATE_BAR_LEFT_X, dy, PLATE_FILL_Z],
        [PLATE_BAR_W, PLATE_BAR_H, 1.0],
        PLATE_FILL_RENDER_ORDER,
    );
    n.visible = frac > 0.002;
    n.scale[0] = PLATE_BAR_W * frac;
    n
}

/// `buildPowerGroup(text, ownerColor)` (`:652-686`) appended to `t` under
/// `parent`; nothing for an empty text.
fn push_power_group(t: &mut OverlayTree, parent: usize, text: &str, owner_color: u32) {
    if text.is_empty() {
        return;
    }
    let g = t.push(OverlayNode::group("unitStatPlatePower", Some(parent)));
    t.push(OverlayNode::mesh(
        g,
        GeometryKind::QuadCenter,
        flat(owner_color, Some(TextureRef::PowerFrame)),
        [PLATE_POWER_X, 0.0, POWER_FRAME_Z],
        [PLATE_POWER_BOX_W, PLATE_POWER_BOX_H, 1.0],
        POWER_RENDER_ORDER,
    ));
    let units: Vec<u16> = text.encode_utf16().collect();
    let n = units.len();
    let advance = if n <= 1 {
        0.0
    } else {
        #[allow(clippy::cast_precision_loss)] // n is a few characters
        let gaps = (n - 1) as f64;
        POWER_DIGIT_ADVANCE.min((POWER_BOX_INNER_W - POWER_DIGIT_W) / gaps)
    };
    #[allow(clippy::cast_precision_loss)]
    let start_x = PLATE_POWER_X - ((n as f64 - 1.0) / 2.0) * advance;
    for (i, &cu) in units.iter().enumerate() {
        let d = i32::from(cu) - 48;
        if !(0..=9).contains(&d) {
            continue;
        }
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // 0..=9
        let digit = d as u8;
        #[allow(clippy::cast_precision_loss)]
        let x = start_x + i as f64 * advance;
        t.push(OverlayNode::mesh(
            g,
            GeometryKind::QuadCenter,
            flat(0x00ff_ffff, Some(TextureRef::PowerDigit(digit))),
            [x, 0.0, POWER_DIGIT_Z],
            [POWER_DIGIT_W, POWER_DIGIT_H, 1.0],
            POWER_RENDER_ORDER + 1,
        ));
    }
}

/// `applyUnitStatPlate(group, octx, vitals)` (`:851-908`) on a fresh token,
/// as data: the `unitStatPlate` sub-group (`buildPlateGroup`, `:770-812`,
/// plus the power box) with the bars already sized. Repeated calls on one token
/// converge to this same tree ([`StatPlateSyncState`] says what the web
/// rebuilds on the way).
#[must_use]
pub fn build_stat_plate(
    octx: Option<&OwnerEmblemContext>,
    vitals: &StatPlateVitals,
) -> OverlayTree {
    let mut t = OverlayTree::default();
    let mut root = OverlayNode::group("unitStatPlate", None);
    root.position[1] = PLATE_BG_Y;
    root.rotation[0] = -PLATE_TILT_RAD;
    let r = t.push(root);

    t.push(OverlayNode::mesh(
        r,
        GeometryKind::QuadCenter,
        flat(0x00ff_ffff, Some(TextureRef::PlateBackground)),
        [0.0, 0.0, PLATE_BG_Z],
        [PLATE_BG_W, PLATE_BG_H, 1.0],
        PLATE_BG_RENDER_ORDER,
    ));

    let move_frac = bar_fraction(vitals.ruch_left, vitals.ruch_max);
    let hp_frac = bar_fraction(vitals.hp, vitals.hp_max);
    let band = HpBand::of(hp_frac);
    t.push(fill_node(r, VITALS_MOVE_FULL, PLATE_BAR_DY, move_frac));
    t.push(fill_node(r, band.color(), -PLATE_BAR_DY, hp_frac));

    t.push(OverlayNode::mesh(
        r,
        GeometryKind::QuadCenter,
        flat(PLATE_GOLD_HEX, None),
        [0.0, 0.0, PLATE_DIVIDER_Z],
        [PLATE_BAR_W, PLATE_DIVIDER_H, 1.0],
        PLATE_FILL_RENDER_ORDER + 1,
    ));

    if let Some(o) = octx {
        t.push(OverlayNode::mesh(
            r,
            GeometryKind::QuadCenter,
            flat(
                0x00ff_ffff,
                Some(TextureRef::OwnerEmblem(owner_emblem_key(o))),
            ),
            [PLATE_OWNER_X, 0.0, PLATE_OWNER_Z],
            [PLATE_OWNER_ICON_SIZE, PLATE_OWNER_ICON_SIZE, 1.0],
            PLATE_OWNER_RENDER_ORDER,
        ));
    }

    let owner_color = vitals.owner_color.unwrap_or(0x00ff_ffff);
    push_power_group(&mut t, r, &power_text(vitals.field_power_m), owner_color);
    t
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canvas_sizes() {
        assert_eq!(bg_canvas_h(), 168);
        assert_eq!(power_frame_canvas_h(), 213);
        assert_eq!(power_digit_canvas_h(), 126);
        assert_eq!(
            power_digit_font(),
            "900 118px \"Segoe UI\", Arial, sans-serif"
        );
    }

    #[test]
    fn fractions_and_power_text() {
        assert_eq!(bar_fraction(None, Some(2.0)), 1.0);
        assert_eq!(bar_fraction(Some(-1.0), Some(2.0)), 0.0);
        assert_eq!(bar_fraction(Some(5.0), Some(2.0)), 1.0);
        assert_eq!(bar_fraction(Some(1.0), Some(0.0)), 1.0);
        assert_eq!(power_text(Some(0.4)), "");
        assert_eq!(power_text(Some(0.5)), "1");
        assert_eq!(power_text(Some(1e21)), "1e+21");
        assert_eq!(power_text(Some(f64::INFINITY)), "");
    }
}
