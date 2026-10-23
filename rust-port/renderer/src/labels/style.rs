//! The web's visual constants of the anchored labels, as data.
//!
//! Every value is transcribed from pin `edb8fb56` (`file:line`, paths
//! relative to `gra/src/`). The verbatim web CSS strings are kept next to the
//! typed values ([`R4_CSS_WEB`], [`R5_CSS_WEB`], [`R15A_STYLE_WEB`],
//! [`R15B_STYLE_WEB`]); `tests/labels_anchors.rs` checks that (a) the
//! verbatim strings equal what `tests/fixtures/labels/gen.mjs` extracted
//! from the pin and (b) every typed value below is what those strings say.
//! Nothing here is a balance value — these are presentation constants.

/// One CSS `box-shadow` / `text-shadow` layer (no spread, no `inset`: the
/// web uses neither on these labels).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Shadow {
    /// Horizontal offset, CSS px.
    pub offset_x: f64,
    /// Vertical offset, CSS px.
    pub offset_y: f64,
    /// Blur radius, CSS px (Gaussian σ = blur / 2, CSS Backgrounds 3 §7.1).
    pub blur: f64,
    /// CSS colour.
    pub color: &'static str,
}

/// Box decoration of a label (`padding`, `border`, `border-radius`,
/// `background`, `box-shadow`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct BoxStyle {
    /// Vertical padding (top = bottom), CSS px.
    pub padding_v: f64,
    /// Horizontal padding (left = right), CSS px.
    pub padding_h: f64,
    /// Border width (all sides), CSS px.
    pub border_width: f64,
    /// `border-radius` (all corners, outer edge), CSS px.
    pub radius: f64,
    /// `background` colour.
    pub background: &'static str,
    /// The single `box-shadow` layer.
    pub shadow: Shadow,
}

// ----- R4: build-mode ghost chip (main.ts:12851-12968) ---------------------

/// `ghostChip.style.cssText`, verbatim (`main.ts:12853-12859`).
pub const R4_CSS_WEB: &str = "position:fixed;z-index:400;display:none;pointer-events:none;align-items:center;gap:6px;padding:6px 10px;border-radius:6px;font:12px/1.2 Arial,sans-serif;color:#ffe8a0;background:rgba(30,34,50,0.92);border:1px solid rgba(255,212,121,0.75);box-shadow:0 4px 14px rgba(0,0,0,0.55)";
/// Chip `font` (`main.ts:12856`): size 12 px, `line-height` 1.2.
pub const R4_FONT: &str = "12px Arial,sans-serif";
/// Chip font size (CSS px).
pub const R4_FONT_SIZE: f64 = 12.0;
/// Chip `line-height` number.
pub const R4_LINE_HEIGHT: f32 = 1.2;
/// Chip text colour (`main.ts:12856`).
pub const R4_COLOR: &str = "#ffe8a0";
/// Chip box (`main.ts:12855-12858`).
pub const R4_BOX: BoxStyle = BoxStyle {
    padding_v: 6.0,
    padding_h: 10.0,
    border_width: 1.0,
    radius: 6.0,
    background: "rgba(30,34,50,0.92)",
    shadow: Shadow {
        offset_x: 0.0,
        offset_y: 4.0,
        blur: 14.0,
        color: "rgba(0,0,0,0.55)",
    },
};
/// Border colour of a valid hex (`main.ts:12857`, `:12965`).
pub const R4_BORDER_VALID: &str = "rgba(255,212,121,0.75)";
/// Border colour of an invalid hex (`main.ts:12965`).
pub const R4_BORDER_INVALID: &str = "rgba(255,102,85,0.85)";
/// Flex `gap` of the chip and of its inner row (`main.ts:12855`, `:12959`).
pub const R4_GAP: f64 = 6.0;
/// Icon span: `font-size:16px;line-height:1` (`main.ts:12960`).
pub const R4_ICON_SIZE: f64 = 16.0;
/// Icon span `line-height` number.
pub const R4_ICON_LINE_HEIGHT: f32 = 1.0;
/// Reason span: `color:#ffb199;font-size:11px;max-width:220px` (`main.ts:12963`).
pub const R4_REASON_COLOR: &str = "#ffb199";
/// Reason font size (CSS px).
pub const R4_REASON_SIZE: f64 = 11.0;
/// Reason `max-width` (CSS px).
pub const R4_REASON_MAX_WIDTH: f64 = 220.0;
/// Text of a valid hex (`main.ts:12961`).
pub const R4_TEXT_VALID: &str = "Kliknij hex";
/// Text of an invalid hex (`main.ts:12961`).
pub const R4_TEXT_INVALID: &str = "Niedozwolone";
/// The only reason the web shows (`main.ts:13075-13077`, improvement `droga`).
pub const R4_REASON_DROGA: &str = "Droga musi łączyć się z miastem lub już istniejącą drogą";
/// `IMPROVEMENT_CHIP` (`main.ts:12863-12867`).
pub const R4_IMPROVEMENT_CHIP: &[(&str, &str)] = &[
    ("farma", "🌾"),
    ("pastwisko", "🐑"),
    ("kopalnia_zelaza", "⛏"),
    ("kamieniolom", "🪨"),
    ("oboz_lowiecki", "🏹"),
    ("wyrab", "🪓"),
    ("tartak", "🪚"),
    ("lodzie_rybackie", "🎣"),
    ("droga", "🛤"),
    ("posterunek", "🏰"),
    ("irygacja", "💧"),
    ("pole_irygowane", "🌾"),
    ("glinianka", "🏺"),
    ("warzelnia_soli", "🧂"),
    ("tarasy", "🏔"),
    ("fort", "🛡"),
];
/// City founding / wonder icon (`main.ts:13049`, `:13052`, `:13061`).
pub const R4_ICON_CITY: &str = "🏛";
/// Icon of an improvement missing from [`R4_IMPROVEMENT_CHIP`] (`main.ts:13070`).
pub const R4_ICON_FALLBACK: &str = "🔨";
/// Placement: `left = Math.round(pos.x + 14)`, `top = Math.round(pos.y - 40)`
/// (`main.ts:12967-12968`).
pub const R4_OFFSET: (f64, f64) = (14.0, -40.0);
/// Anchor lift above the hex top (`hexCenterClientPx(q, r, liftY = 1.5)`,
/// `main.ts:12939`).
pub const R4_LIFT_Y: f64 = 1.5;

/// The R4 icon of an improvement key (`IMPROVEMENT_CHIP[key] ?? '🔨'`).
#[must_use]
pub fn r4_icon_for(improvement: &str) -> &'static str {
    R4_IMPROVEMENT_CHIP
        .iter()
        .find(|(k, _)| *k == improvement)
        .map_or(R4_ICON_FALLBACK, |(_, v)| v)
}

// ----- R5: siege labels (main.ts:14560-14603) ------------------------------

/// `el.style.cssText`, verbatim (`main.ts:14570-14576`). Note the shorthand
/// `font:… 11px/1.3 …` comes after `line-height:1.25` and resets it to 1.3.
pub const R5_CSS_WEB: &str = "position:fixed;z-index:340;pointer-events:none;transform:translate(-50%,-100%);padding:4px 10px;border-radius:8px;text-align:center;line-height:1.25;font:bold 11px/1.3 Arial,sans-serif;color:#ffe8e8;background:rgba(140,20,20,0.88);border:2px solid #ff5252;box-shadow:0 0 12px rgba(255,60,60,0.65);white-space:nowrap";
/// Label font without size (`main.ts:14573`): `bold … Arial,sans-serif`.
pub const R5_FONT_FAMILY: &str = "Arial,sans-serif";
/// Font weight keyword.
pub const R5_FONT_WEIGHT: &str = "bold";
/// Font size (CSS px).
pub const R5_FONT_SIZE: f64 = 11.0;
/// Effective `line-height` number (the shorthand wins over `line-height:1.25`).
pub const R5_LINE_HEIGHT: f32 = 1.3;
/// Text colour.
pub const R5_COLOR: &str = "#ffe8e8";
/// Box (`main.ts:14572-14575`).
pub const R5_BOX: BoxStyle = BoxStyle {
    padding_v: 4.0,
    padding_h: 10.0,
    border_width: 2.0,
    radius: 8.0,
    background: "rgba(140,20,20,0.88)",
    shadow: Shadow {
        offset_x: 0.0,
        offset_y: 0.0,
        blur: 12.0,
        color: "rgba(255,60,60,0.65)",
    },
};
/// Border colour.
pub const R5_BORDER: &str = "#ff5252";
/// `innerHTML` (`main.ts:14569`): `<span style="font-size:18px">⚔</span>
/// OBŁĘŻENIE<br><small>{name}</small>`.
pub const R5_ICON: &str = "\u{2694}";
/// Icon span font size (CSS px).
pub const R5_ICON_SIZE: f64 = 18.0;
/// The text node after the icon span (leading space kept: it follows an
/// inline element).
pub const R5_TITLE: &str = " OB\u{0141}\u{0118}\u{017B}ENIE";
/// `<small>` = UA `font-size: smaller` = parent size / 1.2 (Chromium,
/// measured `9.16667px` for 11 px; `getComputedStyle`, gen probe).
pub const R5_SMALLER_RATIO: f32 = 1.2;
/// Anchor lift above the hex top (`main.ts:14566`).
pub const R5_LIFT_Y: f64 = 1.1;

// ----- R15a / R15b: battle float labels -------------------------------------

/// `_spawnDamageLabel` style object, verbatim as JSON (`battleScene.ts:9094-9105`).
pub const R15A_STYLE_WEB: &str = r##"{"position":"absolute","pointerEvents":"none","color":"#ff4444","fontFamily":"sans-serif","fontSize":"15px","fontWeight":"bold","textShadow":"0 0 6px #000, 1px 1px 2px #000","whiteSpace":"nowrap","transform":"translate(-50%, -50%)","zIndex":"10010"}"##;
/// `_spawnWallLabel` style object, verbatim as JSON with `color` = `COLOR`
/// (`battleScene.ts:7480-7485`).
pub const R15B_STYLE_WEB: &str = r##"{"position":"absolute","pointerEvents":"none","color":"COLOR","fontFamily":"sans-serif","fontSize":"13px","fontWeight":"bold","textShadow":"0 0 6px #000, 1px 1px 2px #000","whiteSpace":"nowrap","transform":"translate(-50%, -50%)","zIndex":"10010"}"##;
/// R15a font (`line-height` normal, inherited).
pub const R15A_FONT: &str = "bold 15px sans-serif";
/// R15a colour.
pub const R15A_COLOR: &str = "#ff4444";
/// R15b font.
pub const R15B_FONT: &str = "bold 13px sans-serif";
/// R15b colour of the damage label (`battleScene.ts:7225`).
pub const R15B_DMG_COLOR: &str = "#ff8800";
/// R15b breach text and colour (`battleScene.ts:7311`).
pub const R15B_BREACH_TEXT: &str = "MUR WYBURZONY!";
/// R15b breach colour.
pub const R15B_BREACH_COLOR: &str = "#ff4400";
/// `textShadow: '0 0 6px #000, 1px 1px 2px #000'` (both groups). The first
/// layer is painted on top.
pub const R15_TEXT_SHADOWS: [Shadow; 2] = [
    Shadow {
        offset_x: 0.0,
        offset_y: 0.0,
        blur: 6.0,
        color: "#000",
    },
    Shadow {
        offset_x: 1.0,
        offset_y: 1.0,
        blur: 2.0,
        color: "#000",
    },
];
/// Float duration, ms (`battleScene.ts:7489`, `:9114`).
pub const FLOAT_DURATION_MS: f64 = 2000.0;
/// Rise rate, world units per ms (`battleScene.ts:7491`, `:9116`).
pub const FLOAT_RISE_RATE: f64 = 0.000_12;
/// World height of a wall label (`battleScene.ts:7490`).
pub const R15B_WORLD_Y: f64 = 3.2;
/// `HPBAR_Y` (`battleScene.ts:978`): the HP bar height above the tile top.
pub const R15A_HPBAR_Y: f64 = 0.72;
/// Extra lift of a damage number above the HP bar (`battleScene.ts:9115`,
/// `worldPos.y = wpTopY + HPBAR_Y + 0.20`).
pub const R15A_LIFT: f64 = 0.20;

// ----- texture margin -------------------------------------------------------

/// Transparent margin (CSS px) around the border box in a label texture:
/// `ceil(1.5 · blur + |offset|) + 1` of the largest shadow (a Gaussian of
/// σ = blur / 2 is negligible beyond 3σ). The same rule is in `gen.mjs`.
#[must_use]
pub fn shadow_margin(shadows: &[Shadow]) -> u32 {
    let m = shadows
        .iter()
        .map(|s| 1.5 * s.blur + s.offset_x.abs().max(s.offset_y.abs()))
        .fold(0.0f64, f64::max);
    // Small non-negative values: the cast is exact.
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let c = m.ceil() as u32;
    c + 1
}
