//! A small block / inline / flex layout for the four label groups, in
//! Chromium's `LayoutUnit` (1/64 px) arithmetic.
//!
//! Not a CSS engine: it lays out exactly the structures the web builds
//! (`P4-34-ANCHORS-DOM.md` §3) and reproduces the Chromium 141 rules that
//! decide their geometry, each measured against the real DOM
//! (`tests/fixtures/labels/layout.tsv`, compared bit for bit in
//! `tests/labels_layout.rs`):
//!
//! - **text width** = `measureText` width (RR-T8b/c engine) rounded **up** to
//!   1/64 px (`LayoutUnit::FromFloatCeil`);
//! - **font metrics** of the primary face: hhea ascent / descent / line gap
//!   scaled in `f32` and rounded to whole px (Skia/FreeType on Linux);
//! - **`line-height: <number>`** = `LayoutUnit(round64(font-size) × k)`
//!   (font size rounded to 1/64, product in `f32`, truncated to 1/64);
//!   `normal` = ascent + descent + line gap;
//! - **leading**: `half = (line-height − (A + D)) / 2` truncated to 1/64,
//!   floored to whole px above the text, the rest below;
//! - **line box**: the block's strut plus every inline box on the line,
//!   aligned on the baseline (`vertical-align: baseline`);
//! - **centring** (`text-align: center`, `align-items: center`): free space
//!   halved in `LayoutUnit` (truncation).

use ab_glyph::{Font as _, FontRef};

use crate::raster::image::emoji::{emoji_font_data, glyph_source, source_chain, GlyphSource};
use crate::raster::text::{parse_font, FontSpec};

use super::shape::{dom_shape, effective_font_px};
use super::style::{
    BoxStyle, R15A_COLOR, R15A_FONT, R15B_FONT, R4_BORDER_INVALID, R4_BORDER_VALID, R4_BOX,
    R4_COLOR, R4_FONT_SIZE, R4_GAP, R4_ICON_LINE_HEIGHT, R4_ICON_SIZE, R4_LINE_HEIGHT,
    R4_REASON_COLOR, R4_REASON_MAX_WIDTH, R4_REASON_SIZE, R4_TEXT_INVALID, R4_TEXT_VALID,
    R5_BORDER, R5_BOX, R5_COLOR, R5_FONT_FAMILY, R5_FONT_SIZE, R5_FONT_WEIGHT, R5_ICON,
    R5_ICON_SIZE, R5_LINE_HEIGHT, R5_SMALLER_RATIO, R5_TITLE,
};

/// A length in Chromium `LayoutUnit` raw units (1/64 CSS px).
pub type Lu = i32;

/// `LayoutUnit` raw value → CSS px.
#[must_use]
pub fn lu_px(v: Lu) -> f64 {
    f64::from(v) / 64.0
}

/// `LayoutUnit(float)`: truncation toward zero (saturating cast).
#[must_use]
// The saturating float → int cast is the semantics being mirrored.
#[allow(clippy::cast_possible_truncation)]
pub fn lu_trunc(v: f32) -> Lu {
    (v * 64.0) as i32
}

/// `LayoutUnit::FromFloatRound` (half away from zero).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn lu_round(v: f32) -> Lu {
    (v * 64.0).round() as i32
}

/// `LayoutUnit::FromFloatCeil` of a text width.
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn lu_ceil(v: f64) -> Lu {
    (v * 64.0).ceil() as i32
}

/// Integer division of a `LayoutUnit` by 2 (C++ `int /`: toward zero).
fn half(v: Lu) -> Lu {
    v / 2
}

/// `LayoutUnit::Floor()` kept in raw units (whole px, toward −∞).
fn floor_px(v: Lu) -> Lu {
    v.div_euclid(64) * 64
}

fn px_lu(v: f64) -> Lu {
    // Constants of the label styles are whole or 1/64 values.
    #[allow(clippy::cast_possible_truncation)]
    let r = (v * 64.0).round() as i32;
    r
}

/// Rounded font metrics of a face at a size, whole CSS px.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct FontBox {
    /// Ascent (`round(hhea.ascender · size / upem)`).
    pub ascent: i32,
    /// Descent (positive).
    pub descent: i32,
    /// Line gap.
    pub line_gap: i32,
}

/// Metrics of the **primary** face of `spec` (the first source of the
/// fallback chain): Blink sizes inline boxes with the primary font only when
/// `line-height` is not `normal`, and every label here uses the primary face
/// (Liberation Sans) for its line metrics.
#[must_use]
pub fn primary_metrics(spec: &FontSpec) -> FontBox {
    let data: &'static [u8] = match source_chain(spec)[0] {
        GlyphSource::Text(face) => face.data(),
        GlyphSource::Emoji => emoji_font_data(),
    };
    let font = FontRef::try_from_slice(data).expect("bundled font parses");
    let upem = font.units_per_em().unwrap_or(1000.0);
    // Skia (FreeType, scalable face): ascender / upem × size in float, then
    // SkScalarRoundToScalar = floor(x + 0.5).
    #[allow(clippy::cast_possible_truncation)]
    let size = spec.size_px as f32;
    let r = |u: f32| -> i32 {
        #[allow(clippy::cast_possible_truncation)]
        let v = (u / upem * size + 0.5).floor() as i32;
        v
    };
    FontBox {
        ascent: r(font.ascent_unscaled()),
        descent: r(-font.descent_unscaled()),
        line_gap: r(font.line_gap_unscaled()),
    }
}

/// CSS `line-height`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum LineHeight {
    /// `normal`: the primary font's line spacing.
    Normal,
    /// A unitless number (stored by Blink as a percentage of the font size).
    Number(f32),
}

/// The used line height of a box in `LayoutUnit`.
#[must_use]
pub fn computed_line_height(spec: &FontSpec, lh: LineHeight) -> Lu {
    match lh {
        LineHeight::Normal => {
            let m = primary_metrics(spec);
            (m.ascent + m.descent + m.line_gap) * 64
        }
        LineHeight::Number(k) => {
            #[allow(clippy::cast_possible_truncation)]
            let fs = lu_round(spec.size_px as f32) as f32 / 64.0;
            lu_trunc(fs * k)
        }
    }
}

/// Ascent / descent of an inline box including its half-leading.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct BoxMetrics {
    asc: Lu,
    desc: Lu,
}

fn inline_box(spec: &FontSpec, lh: LineHeight) -> BoxMetrics {
    let m = primary_metrics(spec);
    let content = (m.ascent + m.descent) * 64;
    let leading = computed_line_height(spec, lh) - content;
    let asc_lead = floor_px(half(leading));
    BoxMetrics {
        asc: m.ascent * 64 + asc_lead,
        desc: m.descent * 64 + leading - asc_lead,
    }
}

/// One positioned text fragment (what `Range.getClientRects()` reports for
/// a text node on one line), in CSS `LayoutUnit` relative to the border box.
#[derive(Clone, Debug, PartialEq)]
pub struct TextFragment {
    /// The text drawn.
    pub text: String,
    /// CSS `font` value used to draw it (family stack of the web; size =
    /// [`effective_font_px`] of the computed size).
    pub font: String,
    /// CSS colour.
    pub color: String,
    /// Left edge.
    pub x: Lu,
    /// Top of the content area (baseline − ascent).
    pub y: Lu,
    /// Width (text advance rounded up to 1/64).
    pub w: Lu,
    /// Height of the content area (ascent + descent).
    pub h: Lu,
    /// Alphabetic baseline.
    pub baseline: Lu,
    /// Words to draw (`font` above) and their pen offsets (px) from `x`:
    /// the DOM shapes the node as one run (kerning across spaces), the
    /// canvas text engine word by word — drawing word by word at the DOM
    /// pen positions reproduces the DOM placement.
    pub pieces: Vec<(String, f64)>,
}

/// Border, background and shadow of a laid-out label.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Decoration {
    /// Box style (padding, radius, background, box-shadow).
    pub style: BoxStyle,
    /// Border colour (R4 depends on validity).
    pub border_color: &'static str,
}

/// A laid-out label: border box size, decoration and text fragments.
#[derive(Clone, Debug, PartialEq)]
pub struct LabelLayout {
    /// Border-box width.
    pub width: Lu,
    /// Border-box height.
    pub height: Lu,
    /// `None` for the bare-text battle labels.
    pub decoration: Option<Decoration>,
    /// Text fragments in DOM order.
    pub fragments: Vec<TextFragment>,
    /// `text-shadow` layers (first = top), empty for R4/R5.
    pub text_shadows: Vec<super::style::Shadow>,
}

/// An inline piece of a line: a text node in the font of its element.
#[derive(Clone, Debug)]
struct Item {
    text: String,
    /// The CSS font (computed size: line height and metrics).
    font: String,
    /// The font text is shaped and drawn with ([`effective_font_px`]).
    draw_font: String,
    spec: FontSpec,
    lh: LineHeight,
    color: String,
}

impl Item {
    fn new(text: &str, font: String, lh: LineHeight, color: &str) -> Item {
        let spec = parse_font(&font).expect("label font parses");
        let size = spec.size_px;
        let draw_font = font.replace(
            &format!("{size}px"),
            &format!("{}px", effective_font_px(size)),
        );
        Item {
            text: text.to_owned(),
            font,
            draw_font,
            spec,
            lh,
            color: color.to_owned(),
        }
    }

    fn width(&self) -> Lu {
        text_width(&self.font, &self.text)
    }

    /// Non-space pieces with their pen offset (px) from the item start.
    fn pieces(&self) -> Vec<(String, f64)> {
        let shaped = dom_shape(&self.font, &self.text);
        let mut out = Vec::new();
        let mut start: Option<usize> = None;
        for (i, c) in self
            .text
            .char_indices()
            .chain(std::iter::once((self.text.len(), ' ')))
        {
            match (c == ' ', start) {
                (true, Some(b)) => {
                    out.push((self.text[b..i].to_owned(), shaped.pen_at(b)));
                    start = None;
                }
                (false, None) => start = Some(i),
                _ => {}
            }
        }
        out
    }
}

/// Width of the DOM text node `text` in the CSS `font` (computed size) as
/// Chromium lays it out: [`dom_shape`] advance rounded up to 1/64 px.
#[must_use]
pub fn text_width(font: &str, text: &str) -> Lu {
    lu_ceil(dom_shape(font, text).width)
}

/// Lays out one line (strut + items) at `top`, starting at `x0`; returns the
/// fragments and the line height.
fn line(
    strut: (&FontSpec, LineHeight),
    items: &[Item],
    x0: Lu,
    top: Lu,
) -> (Vec<TextFragment>, Lu) {
    let s = inline_box(strut.0, strut.1);
    let (mut asc, mut desc) = (s.asc, s.desc);
    for it in items {
        let b = inline_box(&it.spec, it.lh);
        asc = asc.max(b.asc);
        desc = desc.max(b.desc);
    }
    let baseline = top + asc;
    let mut x = x0;
    let mut out = Vec::with_capacity(items.len());
    for it in items {
        let m = primary_metrics(&it.spec);
        let w = it.width();
        out.push(TextFragment {
            text: it.text.clone(),
            font: it.draw_font.clone(),
            color: it.color.clone(),
            x,
            y: baseline - m.ascent * 64,
            w,
            h: (m.ascent + m.descent) * 64,
            baseline,
            pieces: it.pieces(),
        });
        x += w;
    }
    (out, asc + desc)
}

fn line_width(items: &[Item]) -> Lu {
    items.iter().map(Item::width).sum()
}

/// Greedy line breaking at spaces (CSS `white-space: normal`, collapsible
/// single spaces; a line keeps at least one word). Widths are compared in
/// `LayoutUnit` against `avail`.
#[must_use]
pub fn wrap_words(font: &str, text: &str, avail: Lu) -> Vec<String> {
    let mut lines: Vec<String> = Vec::new();
    let mut cur = String::new();
    for word in text.split(' ').filter(|w| !w.is_empty()) {
        if cur.is_empty() {
            cur.push_str(word);
            continue;
        }
        let candidate = format!("{cur} {word}");
        if text_width(font, &candidate) <= avail {
            cur = candidate;
        } else {
            lines.push(std::mem::take(&mut cur));
            cur.push_str(word);
        }
    }
    if !cur.is_empty() {
        lines.push(cur);
    }
    lines
}

fn shift(frags: &mut [TextFragment], dx: Lu, dy: Lu) {
    for f in frags {
        f.x += dx;
        f.y += dy;
        f.baseline += dy;
    }
}

fn sized_font(weight: &str, size: f64, family: &str) -> String {
    if weight.is_empty() {
        format!("{size}px {family}")
    } else {
        format!("{weight} {size}px {family}")
    }
}

/// R4 — the build-mode chip (`main.ts:12940-12968`): flex row `[icon, text]`
/// in a flex chip; when invalid with a reason, the chip turns into a column
/// (`align-items: flex-start`) with the wrapped reason (`max-width: 220px`).
#[must_use]
pub fn layout_r4(icon: &str, valid: bool, reason: &str) -> LabelLayout {
    let family = "Arial,sans-serif";
    let base_font = sized_font("", R4_FONT_SIZE, family);
    let base_spec = parse_font(&base_font).expect("R4 font");
    let lh = LineHeight::Number(R4_LINE_HEIGHT);
    let b = R4_BOX;
    let (pad_v, pad_h, bw, gap) = (
        px_lu(b.padding_v),
        px_lu(b.padding_h),
        px_lu(b.border_width),
        px_lu(R4_GAP),
    );
    // Inner row: two blockified flex items, each one line.
    let icon_font = sized_font("", R4_ICON_SIZE, family);
    let icon_spec = parse_font(&icon_font).expect("R4 icon font");
    let icon_lh = LineHeight::Number(R4_ICON_LINE_HEIGHT);
    let icon_item = Item::new(icon, icon_font, icon_lh, R4_COLOR);
    let (mut icon_frags, icon_h) = line(
        (&icon_spec, icon_lh),
        std::slice::from_ref(&icon_item),
        0,
        0,
    );
    let icon_w = icon_item.width();
    let text = if valid {
        R4_TEXT_VALID
    } else {
        R4_TEXT_INVALID
    };
    let text_item = Item::new(text, base_font.clone(), lh, R4_COLOR);
    let (mut text_frags, text_h) = line((&base_spec, lh), std::slice::from_ref(&text_item), 0, 0);
    let text_w = text_item.width();
    let row_h = icon_h.max(text_h);
    let row_w = icon_w + gap + text_w;
    shift(&mut icon_frags, 0, half(row_h - icon_h));
    shift(&mut text_frags, icon_w + gap, half(row_h - text_h));
    let mut frags: Vec<TextFragment> = icon_frags.into_iter().chain(text_frags).collect();

    let show_reason = !valid && !reason.is_empty(); // main.ts:12957, :12962
    let (content_w, content_h) = if show_reason {
        let rfont = sized_font("", R4_REASON_SIZE, family);
        let rspec = parse_font(&rfont).expect("R4 reason font");
        let max_w = px_lu(R4_REASON_MAX_WIDTH);
        let max_content = text_width(&rfont, reason);
        let rw = max_content.min(max_w);
        let mut top = row_h + gap;
        for l in wrap_words(&rfont, reason, rw) {
            let it = Item::new(&l, rfont.clone(), lh, R4_REASON_COLOR);
            let (fr, h) = line((&rspec, lh), &[it], 0, top);
            frags.extend(fr);
            top += h;
        }
        (row_w.max(rw), top)
    } else {
        (row_w, row_h)
    };
    // Row direction: the single item is centred on the cross axis (no free
    // space: the chip is as tall as the row).
    shift(&mut frags, bw + pad_h, bw + pad_v);
    LabelLayout {
        width: content_w + 2 * (pad_h + bw),
        height: content_h + 2 * (pad_v + bw),
        decoration: Some(Decoration {
            style: R4_BOX,
            border_color: if valid {
                R4_BORDER_VALID
            } else {
                R4_BORDER_INVALID
            },
        }),
        fragments: frags,
        text_shadows: Vec::new(),
    }
}

/// The used font size of `<small>` in a parent of `parent_px`
/// (`font-size: smaller` = parent / 1.2 in `f32`).
#[must_use]
pub fn smaller_font_size(parent_px: f64) -> f64 {
    #[allow(clippy::cast_possible_truncation)]
    let p = parent_px as f32;
    f64::from(p / R5_SMALLER_RATIO)
}

/// R5 — siege label (`main.ts:14569-14576`): two centred lines
/// `[⚔ 18px][ OBŁĘŻENIE]` / `[<small>name</small>]`, shrink-to-fit width.
#[must_use]
pub fn layout_r5(city_name: &str) -> LabelLayout {
    let block_font = sized_font(R5_FONT_WEIGHT, R5_FONT_SIZE, R5_FONT_FAMILY);
    let block_spec = parse_font(&block_font).expect("R5 font");
    let lh = LineHeight::Number(R5_LINE_HEIGHT);
    let l1 = vec![
        Item::new(
            R5_ICON,
            sized_font(R5_FONT_WEIGHT, R5_ICON_SIZE, R5_FONT_FAMILY),
            lh,
            R5_COLOR,
        ),
        Item::new(R5_TITLE, block_font.clone(), lh, R5_COLOR),
    ];
    let l2 = vec![Item::new(
        city_name,
        sized_font(
            R5_FONT_WEIGHT,
            smaller_font_size(R5_FONT_SIZE),
            R5_FONT_FAMILY,
        ),
        lh,
        R5_COLOR,
    )];
    let (w1, w2) = (line_width(&l1), line_width(&l2));
    let content_w = w1.max(w2);
    let (mut f1, h1) = line((&block_spec, lh), &l1, half(content_w - w1), 0);
    let (f2, h2) = line((&block_spec, lh), &l2, half(content_w - w2), h1);
    f1.extend(f2);
    let b = R5_BOX;
    let (pad_v, pad_h, bw) = (
        px_lu(b.padding_v),
        px_lu(b.padding_h),
        px_lu(b.border_width),
    );
    shift(&mut f1, bw + pad_h, bw + pad_v);
    LabelLayout {
        width: content_w + 2 * (pad_h + bw),
        height: h1 + h2 + 2 * (pad_v + bw),
        decoration: Some(Decoration {
            style: R5_BOX,
            border_color: R5_BORDER,
        }),
        fragments: f1,
        text_shadows: Vec::new(),
    }
}

fn layout_float(text: &str, font: &str, color: &str) -> LabelLayout {
    let spec = parse_font(font).expect("R15 font");
    let it = Item::new(text, font.to_owned(), LineHeight::Normal, color);
    let w = it.width();
    let (frags, h) = line((&spec, LineHeight::Normal), &[it], 0, 0);
    LabelLayout {
        width: w,
        height: h,
        decoration: None,
        fragments: frags,
        text_shadows: super::style::R15_TEXT_SHADOWS.to_vec(),
    }
}

/// R15a — damage number `'-' + dmg` (`battleScene.ts:9093`).
#[must_use]
pub fn layout_r15a(dmg: i64) -> LabelLayout {
    layout_float(&format!("-{dmg}"), R15A_FONT, R15A_COLOR)
}

/// R15b — wall label (`battleScene.ts:7477-7493`) with the caller's text and
/// colour (`:7225` damage, `:7311` breach).
#[must_use]
pub fn layout_r15b(text: &str, color: &str) -> LabelLayout {
    layout_float(text, R15B_FONT, color)
}

/// `true` when every character of `text` is drawn from a face of the
/// bundled chain (no `.notdef`) — a guard for label content.
#[must_use]
pub fn all_glyphs_available(font: &str, text: &str) -> bool {
    let Some(spec) = parse_font(font) else {
        return false;
    };
    text.chars().all(|c| match glyph_source(&spec, c) {
        GlyphSource::Emoji => true,
        GlyphSource::Text(f) => crate::raster::text::face_has_glyph(f, c),
    })
}
