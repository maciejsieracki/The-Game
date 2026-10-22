//! `raster::text` — fonts and text on [`Canvas2dLite`] (RR-T8b,
//! `R-RUSTPORT-P4-29-TEXT-FONTS-Q1`; plan `P4-25-TEXT-RASTER-AUDIT.md` §6).
//!
//! The six text members of `CanvasRenderingContext2D` the web map code uses
//! (P4-25 §4.1): `font`, `textAlign`, `textBaseline`, `fillText`,
//! `strokeText`, `measureText` (only `.width`). Mapped on [`Canvas2dLite`] as
//! `set_font`, `set_text_align`, `set_text_baseline`, `fill_text`,
//! `stroke_text`, `measure_text`; the closed list is guarded by
//! `tests/text_api_closed.rs`. Not implemented on purpose (unused by the
//! web): the `maxWidth` argument, `direction`, `letterSpacing`,
//! `fontKerning`, `fontStretch`, `fontVariantCaps`, `textRendering`,
//! `wordSpacing`, and every `TextMetrics` field except `width`.
//!
//! Pipeline (owner decisions D-TXT-1 = A, D-TXT-2 = A, D-TXT-6 = A):
//! 1. `font` shorthand → [`FontSpec`] ([`parse_font`]);
//! 2. family stack → bundled faces ([`face_chain`]) and, **per character**,
//!    the first face that has a glyph (browser-like fallback);
//! 3. runs of equal face shaped by `rustybuzz` (GPOS kerning, GSUB), advances
//!    scaled by `size / unitsPerEm` (**not** `ab_glyph::PxScale`, which is
//!    the ascent−descent height; P4-25 §4.2);
//! 4. `textAlign` / `textBaseline` offsets with Chromium's metrics (§ below);
//! 5. glyph outlines from `ab_glyph` turned into one device-space path that
//!    `Canvas2dLite` fills or strokes (style, shadow, clip, CTM), grey-scale
//!    AA, no hinting (P4-25 Z-4).
//!
//! Emoji/colour glyphs (RR-T8c) and glyph atlases (RR-T8d) are out of scope:
//! a character no bundled face has is drawn with the `.notdef` glyph of the
//! first face of the chain (an empty box in these fonts).

mod font;
mod fonts;

use ab_glyph::{Font as _, GlyphId, OutlineCurve};
use tiny_skia::PathBuilder;

use super::{Affine, Canvas2dLite};

pub use font::{parse_font, FamilyName, FontSpec, FontStyle};
pub use fonts::{
    face_chain, face_has_glyph, map_family, BundledFace, BundledFamily, FALLBACK_FAMILY,
};

/// `textAlign`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum TextAlign {
    /// `start` (the default; `direction` is always `ltr` here).
    #[default]
    Start,
    /// `end`.
    End,
    /// `left`.
    Left,
    /// `right`.
    Right,
    /// `center`.
    Center,
}

/// `textBaseline`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum TextBaseline {
    /// `alphabetic` (the default).
    #[default]
    Alphabetic,
    /// `top` — top of the em box.
    Top,
    /// `hanging`.
    Hanging,
    /// `middle` — middle of the em box.
    Middle,
    /// `ideographic`.
    Ideographic,
    /// `bottom` — bottom of the em box.
    Bottom,
}

/// Text attributes of a canvas state (saved/restored with it).
#[derive(Clone, Debug, Default, PartialEq)]
pub struct TextState {
    font: FontSpec,
    align: TextAlign,
    baseline: TextBaseline,
}

/// The part of `TextMetrics` the web reads.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TextMetrics {
    /// `measureText(text).width` in CSS px (before the CTM).
    pub width: f64,
}

/// One shaped glyph, in CSS px relative to the alphabetic baseline origin.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PlacedGlyph {
    /// Face the glyph comes from.
    pub face: BundledFace,
    /// Glyph id in that face.
    pub glyph: u16,
    /// Pen x (px) of the glyph origin.
    pub x: f64,
    /// y offset (px, down positive) from GPOS.
    pub y: f64,
}

/// Shaped text: glyphs and total advance.
#[derive(Clone, Debug, PartialEq)]
pub struct ShapedText {
    /// Glyphs in visual (= logical, LTR) order.
    pub glyphs: Vec<PlacedGlyph>,
    /// Sum of advances in px — `measureText().width`.
    pub width: f64,
}

/// Canvas text preparation: U+0009, U+000A, U+000C, U+000D become U+0020
/// (HTML "replace all ASCII whitespace with spaces").
fn prepare(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '\t' | '\n' | '\u{0C}' | '\r' => ' ',
            c => c,
        })
        .collect()
}

/// Shapes `text` with `spec`: per-character face selection over
/// [`face_chain`], then one `rustybuzz` run per maximal span of equal face.
#[must_use]
pub fn shape_text(spec: &FontSpec, text: &str) -> ShapedText {
    let text = prepare(text);
    let chain = face_chain(spec);
    let primary = chain[0];
    // Face per char; characters no face has stay with the primary face
    // (drawn as its .notdef). Blink shapes word by word (`CachingWordShaper`):
    // every U+0020 is its own segment, so there is no kerning across a
    // space (measured: e.g. `GEBEL BARKAL` differs by 1.21 px otherwise,
    // `P4-29-TEXT-FONTS.md` §4.1).
    let mut runs: Vec<(BundledFace, String)> = Vec::new();
    let mut prev_space = false;
    for c in text.chars() {
        let face = chain
            .iter()
            .copied()
            .find(|f| fonts::loaded(*f).glyph(c).is_some())
            .unwrap_or(primary);
        let space = c == ' ';
        match runs.last_mut() {
            Some((f, s)) if *f == face && !space && !prev_space => s.push(c),
            _ => runs.push((face, c.to_string())),
        }
        prev_space = space;
    }
    let mut glyphs = Vec::new();
    let mut pen = 0.0_f64;
    for (face, s) in runs {
        let lf = fonts::loaded(face);
        let k = spec.size_px / lf.upem;
        let mut buf = rustybuzz::UnicodeBuffer::new();
        buf.push_str(&s);
        buf.set_direction(rustybuzz::Direction::LeftToRight);
        let out = rustybuzz::shape(&lf.hb, &[], buf);
        for (info, pos) in out.glyph_infos().iter().zip(out.glyph_positions()) {
            glyphs.push(PlacedGlyph {
                face,
                glyph: info.glyph_id as u16,
                x: pen + f64::from(pos.x_offset) * k,
                y: -f64::from(pos.y_offset) * k,
            });
            pen += f64::from(pos.x_advance) * k;
        }
    }
    ShapedText { glyphs, width: pen }
}

/// Chromium rounds the normalised em-box ascent to 1/64 px (26.6 fixed
/// point, half away from zero); measured in `tests/text_metrics.rs`.
fn round_64(v: f64) -> f64 {
    (v * 64.0).round() / 64.0
}

/// Downward offset (px) from the `y` given to `fillText` to the alphabetic
/// baseline, for the primary face of `spec` (Chromium 141 behaviour,
/// measured via `TextMetrics.alphabeticBaseline`, `tests/fixtures/text`):
/// - `top` = em-box ascent `round64(typoAsc / (typoAsc + typoDesc) · size)`
///   (OS/2 typo metrics; hhea when absent), `middle` = that − size/2,
///   `bottom` = that − size;
/// - `hanging` = 0.8 · round(hhea ascent · size / upem),
///   `ideographic` = −round(hhea descent · size / upem).
#[must_use]
pub fn baseline_shift(spec: &FontSpec, baseline: TextBaseline) -> f64 {
    let lf = fonts::loaded(face_chain(spec)[0]);
    let size = spec.size_px;
    let (ta, td) = lf.typo.unwrap_or((lf.hhea_ascent, lf.hhea_descent));
    let em_ascent = round_64(ta / (ta + td) * size);
    let ascent = (lf.hhea_ascent * size / lf.upem).round();
    let descent = (lf.hhea_descent * size / lf.upem).round();
    match baseline {
        TextBaseline::Alphabetic => 0.0,
        TextBaseline::Top => em_ascent,
        TextBaseline::Middle => em_ascent - size / 2.0,
        TextBaseline::Bottom => em_ascent - size,
        // Chromium stores `0.8 · ascent` as a float (measured).
        TextBaseline::Hanging => f64::from((0.8 * ascent) as f32),
        TextBaseline::Ideographic => -descent,
    }
}

/// Port of the web `truncateName` (`render/cityMapStatChip.ts:766-779`):
/// sets `font`, returns `name` when it fits `max_w`, otherwise removes
/// trailing **UTF-16 code units** (`s.slice(0, -1)`) while
/// `measureText(s + '…') > max_w` and `s.length > 1`, then appends `…`.
pub fn truncate_name(ctx: &mut Canvas2dLite, name: &str, max_w: f64, font: &str) -> String {
    ctx.set_font(font);
    if ctx.measure_text(name).width <= max_w {
        return name.to_owned();
    }
    let mut s: Vec<u16> = name.encode_utf16().collect();
    while s.len() > 1 && ctx.measure_text(&(utf16_lossy(&s) + "…")).width > max_w {
        s.pop();
    }
    utf16_lossy(&s) + "…"
}

/// Port of the hover-row truncation (`render/cityMapStatChip.ts:711-716`):
/// with the current font, when `measureText(line) > max_w` and
/// `line.length > 1`, the same UTF-16 loop as [`truncate_name`].
pub fn truncate_hover_line(ctx: &Canvas2dLite, line: &str, max_w: f64) -> String {
    let units: Vec<u16> = line.encode_utf16().collect();
    if ctx.measure_text(line).width > max_w && units.len() > 1 {
        let mut s = units;
        while s.len() > 1 && ctx.measure_text(&(utf16_lossy(&s) + "…")).width > max_w {
            s.pop();
        }
        return utf16_lossy(&s) + "…";
    }
    line.to_owned()
}

/// A JS string held as UTF-16; a lone surrogate (left by `slice` cutting a
/// pair) becomes U+FFFD, as when such a string is drawn.
fn utf16_lossy(units: &[u16]) -> String {
    String::from_utf16_lossy(units)
}

/// JS `String.prototype.toUpperCase` (locale-independent full Unicode case
/// mapping, e.g. `ß` → `SS`). Rust's `str::to_uppercase` implements the same
/// Unicode `SpecialCasing` + `UnicodeData` mapping; parity with V8 is
/// measured in `tests/text_upper.rs`.
#[must_use]
pub fn js_to_upper_case(s: &str) -> String {
    s.to_uppercase()
}

/// Appends the outline of `shaped` placed at user-space `(x, y)` (glyph
/// origin of the first glyph, alphabetic baseline) through `ctm`.
fn build_path(
    shaped: &ShapedText,
    spec: &FontSpec,
    x: f64,
    y: f64,
    ctm: &Affine,
) -> Option<tiny_skia::Path> {
    let mut pb = PathBuilder::new();
    let snap = ctm.is_axis_aligned();
    for g in &shaped.glyphs {
        let lf = fonts::loaded(g.face);
        let k = spec.size_px / lf.upem;
        let Some(outline) = lf.ab.outline(GlyphId(g.glyph)) else {
            continue;
        };
        // Device-space glyph origin. Chromium draws glyphs from its glyph
        // cache with subpixel positioning: under an axis-aligned CTM the
        // origin is quantised to 1/4 px horizontally and to whole pixels
        // vertically (measured, `P4-29-TEXT-FONTS.md` §5.2: SSIM of every
        // scene improves, e.g. T9 0.950 → 0.996). Under rotation/skew the
        // unsnapped origin matches better (x_text_rotated_gradient).
        let o = ctm.map(x + g.x, y + g.y);
        let (mut odx, mut ody) = (f64::from(o.x), f64::from(o.y));
        if snap {
            odx = (odx * 4.0 + 0.5).floor() / 4.0;
            ody = (ody + 0.5).floor();
        }
        let map = |p: ab_glyph::Point| {
            let (ux, uy) = (f64::from(p.x) * k, -f64::from(p.y) * k);
            (
                (odx + ctm.a * ux + ctm.c * uy) as f32,
                (ody + ctm.b * ux + ctm.d * uy) as f32,
            )
        };
        // ab_glyph flattens contours into curves and closes each contour with
        // an explicit line back to its start; a new contour starts wherever
        // a curve does not continue from the previous end point.
        let mut start: Option<ab_glyph::Point> = None;
        let mut last: Option<ab_glyph::Point> = None;
        for curve in &outline.curves {
            let (p0, end) = match curve {
                OutlineCurve::Line(a, b)
                | OutlineCurve::Quad(a, _, b)
                | OutlineCurve::Cubic(a, _, _, b) => (*a, *b),
            };
            if last != Some(p0) {
                if start.is_some() {
                    pb.close();
                }
                let (mx, my) = map(p0);
                pb.move_to(mx, my);
                start = Some(p0);
            }
            match curve {
                OutlineCurve::Line(_, b) => {
                    let (bx, by) = map(*b);
                    pb.line_to(bx, by);
                }
                OutlineCurve::Quad(_, c, b) => {
                    let (cx, cy) = map(*c);
                    let (bx, by) = map(*b);
                    pb.quad_to(cx, cy, bx, by);
                }
                OutlineCurve::Cubic(_, c1, c2, b) => {
                    let (c1x, c1y) = map(*c1);
                    let (c2x, c2y) = map(*c2);
                    let (bx, by) = map(*b);
                    pb.cubic_to(c1x, c1y, c2x, c2y, bx, by);
                }
            }
            if Some(end) == start {
                // Explicit closing segment: the contour is complete.
                pb.close();
                start = None;
                last = None;
            } else {
                last = Some(end);
            }
        }
        if start.is_some() {
            pb.close();
        }
    }
    pb.finish()
}

impl Canvas2dLite {
    /// `ctx.font = css`; returns `false` (and keeps the previous font) for
    /// an invalid value, like Canvas.
    pub fn set_font(&mut self, css: &str) -> bool {
        match parse_font(css) {
            Some(spec) => {
                self.text_state_mut().font = spec;
                true
            }
            None => false,
        }
    }

    /// `ctx.textAlign = v`; unknown values are ignored (`false`).
    pub fn set_text_align(&mut self, v: &str) -> bool {
        let a = match v {
            "start" => TextAlign::Start,
            "end" => TextAlign::End,
            "left" => TextAlign::Left,
            "right" => TextAlign::Right,
            "center" => TextAlign::Center,
            _ => return false,
        };
        self.text_state_mut().align = a;
        true
    }

    /// `ctx.textBaseline = v`; unknown values are ignored (`false`).
    pub fn set_text_baseline(&mut self, v: &str) -> bool {
        let b = match v {
            "alphabetic" => TextBaseline::Alphabetic,
            "top" => TextBaseline::Top,
            "hanging" => TextBaseline::Hanging,
            "middle" => TextBaseline::Middle,
            "ideographic" => TextBaseline::Ideographic,
            "bottom" => TextBaseline::Bottom,
            _ => return false,
        };
        self.text_state_mut().baseline = b;
        true
    }

    /// `ctx.measureText(text)` (only `.width` is provided).
    #[must_use]
    pub fn measure_text(&self, text: &str) -> TextMetrics {
        TextMetrics {
            width: shape_text(&self.text_state().font, text).width,
        }
    }

    /// `ctx.fillText(text, x, y)` (no `maxWidth`, unused by the web).
    pub fn fill_text(&mut self, text: &str, x: f64, y: f64) {
        if let Some(p) = self.text_path(text, x, y) {
            self.fill_device_path(p);
        }
    }

    /// `ctx.strokeText(text, x, y)` with `lineWidth` / `lineJoin` /
    /// `strokeStyle` (no `maxWidth`, unused by the web).
    pub fn stroke_text(&mut self, text: &str, x: f64, y: f64) {
        if let Some(p) = self.text_path(text, x, y) {
            self.stroke_device_path(p);
        }
    }

    /// Device-space outline of `text` drawn at `(x, y)` with the current
    /// font, alignment, baseline and CTM. `None` = nothing to draw.
    fn text_path(&self, text: &str, x: f64, y: f64) -> Option<tiny_skia::Path> {
        if !(x.is_finite() && y.is_finite()) {
            return None;
        }
        let st = self.text_state();
        let shaped = shape_text(&st.font, text);
        let dx = match st.align {
            TextAlign::Start | TextAlign::Left => 0.0,
            TextAlign::Center => -shaped.width / 2.0,
            TextAlign::End | TextAlign::Right => -shaped.width,
        };
        let dy = baseline_shift(&st.font, st.baseline);
        build_path(&shaped, &st.font, x + dx, y + dy, &self.ctm())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn px_scale_is_not_the_css_em() {
        // P4-25 §4.2: ab_glyph PxScale(13) ≠ CSS 13px. Width must use
        // advance · size / upem — `−99,9%` Liberation Sans Bold 13px is
        // 44.45263671875 in Chromium (`cityMapStatChip.ts:113-114` → 45).
        let spec = parse_font("700 13px Arial").unwrap();
        let w = shape_text(&spec, "\u{2212}99,9%").width;
        assert_eq!(w, 44.452_636_718_75);
        let lf = fonts::loaded(BundledFace::LiberationSansBold);
        let height = (lf.hhea_ascent + lf.hhea_descent) / lf.upem;
        assert!(
            height > 1.05,
            "ascent−descent is larger than the em: {height}"
        );
    }

    #[test]
    fn per_glyph_fallback_switches_face() {
        let spec =
            parse_font("bold 58px \"Segoe UI Symbol\", \"Segoe UI\", Arial, sans-serif").unwrap();
        let s = shape_text(&spec, "A\u{2620}B");
        let faces: Vec<BundledFace> = s.glyphs.iter().map(|g| g.face).collect();
        assert_eq!(
            faces,
            vec![
                BundledFace::LiberationSansBold,
                BundledFace::DejaVuSansBold,
                BundledFace::LiberationSansBold
            ]
        );
    }

    #[test]
    fn whitespace_is_replaced_by_space() {
        let spec = FontSpec::default();
        assert_eq!(
            shape_text(&spec, "a\tb").width,
            shape_text(&spec, "a b").width
        );
    }

    #[test]
    fn round_64_is_26_6() {
        assert_eq!(round_64(10.0843), 10.078_125);
        assert_eq!(round_64(75.976_562_5), 75.984_375);
    }
}
