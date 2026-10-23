//! Colour emoji and symbols in canvas text (RR-T8c, owner decision
//! D-TXT-3 = C; choice and evidence in `P4-30-IMAGES.md` §3).
//!
//! **Face.** `assets/emoji/NotoColorEmoji-civ-subset.ttf`: the 23 code
//! points of P4-25 §3.3 that Noto Color Emoji has (⚔ ☠ 👤 🔥 🍞 🔨 💰 and
//! the 16 R4 icons; ◆ is not in Noto), cut from Noto Color Emoji 2.047 with
//! `pyftsubset` (SIL OFL 1.1; licence, command and sha256 next to the file).
//! CBDT/CBLC: one strike, 109 ppem, PNG bitmaps 136×128.
//!
//! **Selection (per character, like a browser's font fallback).** The chain
//! is the CSS family stack mapped as in RR-T8b (`raster::text::map_family`)
//! plus `"Noto Color Emoji"` → this face, then the last-resort DejaVu Sans
//! (Z-29-2), then this face (standing in for the system emoji fallback). The
//! first face that has the character wins. Consequence (measured on the
//! repository screenshots, §3): ⚔ ☠ ◆ are monochrome DejaVu glyphs in the
//! fill colour (default text presentation), the Emoji_Presentation
//! characters 👤 🔥 🍞 🔨 💰 (and the R4 icons) are colour bitmaps.
//!
//! **Colour glyphs (measured in Chromium 141, `P4-30-IMAGES.md` §4).**
//! Advance = bitmap advance × size / ppem; the bitmap is scaled by
//! size / ppem (filter [`GLYPH_FILTER`]) at the glyph origin quantised to
//! 1/4 px horizontally and to whole pixels vertically (as outline glyphs,
//! P4-29 §3.5); the RGB of `fillStyle` is ignored, its **alpha multiplies**
//! the bitmap (ZAŁOŻENIE Z-7 of P4-25 confirmed); shadow and clip apply.
//!
//! **One text path (RR-T8f, `R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1`).**
//! `Canvas2dLite::fill_text` / `stroke_text` / `measure_text` (RR-T8b,
//! closed list `tests/text_api_closed.rs`) select glyphs themselves: a string
//! with a colour glyph is laid out here ([`draw_mixed`], [`mixed_width`] —
//! crate-private), every outline run through the RR-T8b pipeline. The
//! RR-T8c entry points [`fill_text`] / [`measure_text`] stay as thin
//! delegations to those methods (same pixels and widths, bit for bit —
//! `tests/textmix_unify.rs`). `strokeText` draws a colour glyph **filled**
//! with the stroke style's alpha (`lineWidth` and the fill style ignored —
//! measured in Chromium 141, `P4-35-TEXT-EMOJI-UNIFY.md` §3.2).

use std::sync::OnceLock;

use resvg::tiny_skia::{FilterQuality, Pixmap, PixmapPaint};
use rustybuzz::ttf_parser;

use crate::raster::text::{
    baseline_shift, face_has_glyph, map_family, paint_outline_run, parse_font, shape_text,
    BundledFace, FamilyName, FontSpec, TextAlign, TextBaseline, TextPaint, FALLBACK_FAMILY,
};
use crate::raster::{Affine, Canvas2dLite};

use super::mip::{axis_scale, level_of, mip_level};
use super::svg::composite_device_layer;

/// File name of the bundled emoji face inside `assets/emoji/`.
pub const EMOJI_FONT_FILE: &str = "NotoColorEmoji-civ-subset.ttf";

/// The bundled emoji face (compiled into the crate).
#[must_use]
pub fn emoji_font_data() -> &'static [u8] {
    include_bytes!("../../../assets/emoji/NotoColorEmoji-civ-subset.ttf")
}

/// Resampling filter for scaling a colour glyph bitmap (after the mip level
/// is chosen, [`super::mip`]) from its strike (109 ppem) to the font size.
/// Chosen by measurement against Chromium 141 (`P4-30-IMAGES.md` §4.3:
/// bicubic or bilinear without mips — SSIM down to 0.953; box mip
/// `floor(log2(1/scale))` + bilinear — ≥ 0.996).
pub const GLYPH_FILTER: FilterQuality = FilterQuality::Bilinear;

/// Metrics and PNG data of one colour glyph (CBDT image formats 17/18).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ColorGlyph {
    /// Strike size (pixels per em) the bitmap is drawn for.
    pub ppem: u8,
    /// Bitmap width / height in strike pixels.
    pub width: u8,
    /// Bitmap height in strike pixels.
    pub height: u8,
    /// Horizontal bearing (strike px) from the pen to the bitmap's left edge.
    pub bearing_x: i8,
    /// Vertical bearing (strike px) from the baseline up to the bitmap's top.
    pub bearing_y: i8,
    /// Horizontal advance in strike px.
    pub advance: u8,
}

struct EmojiFace {
    face: ttf_parser::Face<'static>,
    upem: f64,
    hhea_ascent: f64,
    hhea_descent: f64,
    typo: Option<(f64, f64)>,
    /// Glyph id → (metrics, PNG bytes).
    glyphs: Vec<Option<(ColorGlyph, &'static [u8])>>,
}

fn be_u16(d: &[u8], at: usize) -> Option<u16> {
    Some(u16::from_be_bytes([*d.get(at)?, *d.get(at + 1)?]))
}

fn be_u32(d: &[u8], at: usize) -> Option<u32> {
    Some(u32::from_be_bytes([
        *d.get(at)?,
        *d.get(at + 1)?,
        *d.get(at + 2)?,
        *d.get(at + 3)?,
    ]))
}

/// Minimal CBLC/CBDT reader (OpenType spec, "CBLC — Color Bitmap Location
/// Table"): first strike, index sub-table formats 1 and 3, image formats 17
/// (small metrics + PNG) and 18 (big metrics + PNG). `ttf-parser` returns
/// the bitmap and its offset but not the **advance**, which Chromium uses
/// for `measureText` (§4.1), hence this reader.
fn read_cbdt<'a>(
    cblc: &[u8],
    cbdt: &'a [u8],
    num_glyphs: u16,
) -> Vec<Option<(ColorGlyph, &'a [u8])>> {
    let mut out = vec![None; usize::from(num_glyphs)];
    let mut parse = || -> Option<()> {
        let num_sizes = be_u32(cblc, 4)?;
        if num_sizes == 0 {
            return None;
        }
        let rec = 8; // first BitmapSize record
        let array_off = be_u32(cblc, rec)? as usize;
        let n_sub = be_u32(cblc, rec + 8)? as usize;
        let ppem = *cblc.get(rec + 44)?;
        for i in 0..n_sub {
            let e = array_off + i * 8;
            let first = be_u16(cblc, e)?;
            let last = be_u16(cblc, e + 2)?;
            let sub = array_off + be_u32(cblc, e + 4)? as usize;
            let index_format = be_u16(cblc, sub)?;
            let image_format = be_u16(cblc, sub + 2)?;
            let image_data = be_u32(cblc, sub + 4)? as usize;
            for g in first..=last {
                let k = usize::from(g - first);
                let (o0, o1) = match index_format {
                    1 => (
                        be_u32(cblc, sub + 8 + k * 4)? as usize,
                        be_u32(cblc, sub + 8 + (k + 1) * 4)? as usize,
                    ),
                    3 => (
                        usize::from(be_u16(cblc, sub + 8 + k * 2)?),
                        usize::from(be_u16(cblc, sub + 8 + (k + 1) * 2)?),
                    ),
                    _ => continue,
                };
                if o1 <= o0 {
                    continue;
                }
                let at = image_data + o0;
                let d = cbdt.get(at..image_data + o1)?;
                let (metrics_len, adv_at) = match image_format {
                    17 => (5, 4),
                    18 => (8, 4),
                    _ => continue,
                };
                let len = be_u32(d, metrics_len)? as usize;
                let png = d.get(metrics_len + 4..metrics_len + 4 + len)?;
                let m = ColorGlyph {
                    ppem,
                    height: d[0],
                    width: d[1],
                    bearing_x: d[2] as i8,
                    bearing_y: d[3] as i8,
                    advance: d[adv_at],
                };
                if let Some(slot) = out.get_mut(usize::from(g)) {
                    *slot = Some((m, png));
                }
            }
        }
        Some(())
    };
    let _ = parse();
    out
}

fn face() -> &'static EmojiFace {
    static FACE: OnceLock<EmojiFace> = OnceLock::new();
    FACE.get_or_init(|| {
        let data = emoji_font_data();
        let face = ttf_parser::Face::parse(data, 0).expect("bundled emoji font parses");
        let raw = face.raw_face();
        let cblc = raw
            .table(ttf_parser::Tag::from_bytes(b"CBLC"))
            .unwrap_or(&[]);
        let cbdt = raw
            .table(ttf_parser::Tag::from_bytes(b"CBDT"))
            .unwrap_or(&[]);
        let glyphs = read_cbdt(cblc, cbdt, face.number_of_glyphs());
        let typo = face.tables().os2.and_then(|os2| {
            let (a, d) = (
                f64::from(os2.typographic_ascender()),
                -f64::from(os2.typographic_descender()),
            );
            (a + d > 0.0).then_some((a, d))
        });
        EmojiFace {
            upem: f64::from(face.units_per_em()),
            hhea_ascent: f64::from(face.ascender()),
            hhea_descent: -f64::from(face.descender()),
            typo,
            glyphs,
            face,
        }
    })
}

/// The colour glyph of `c` in the bundled emoji face, if any.
#[must_use]
pub fn color_glyph(c: char) -> Option<ColorGlyph> {
    let f = face();
    let g = f.face.glyph_index(c)?;
    f.glyphs.get(usize::from(g.0))?.map(|(m, _)| m)
}

fn color_glyph_png(c: char) -> Option<(ColorGlyph, &'static [u8])> {
    let f = face();
    let g = f.face.glyph_index(c)?;
    *f.glyphs.get(usize::from(g.0))?
}

/// Where a character is drawn from.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GlyphSource {
    /// An outline face of RR-T8b (`raster::text`).
    Text(BundledFace),
    /// The bundled colour emoji face.
    Emoji,
}

fn is_noto_emoji(f: &FamilyName) -> bool {
    matches!(f, FamilyName::Named(n) if n.eq_ignore_ascii_case("noto color emoji"))
}

/// The per-character fallback chain for `spec` (see the module docs).
#[must_use]
pub fn source_chain(spec: &FontSpec) -> Vec<GlyphSource> {
    let mut out: Vec<GlyphSource> = Vec::new();
    let mut push = |s: GlyphSource| {
        if !out.contains(&s) {
            out.push(s);
        }
    };
    for fam in &spec.families {
        if is_noto_emoji(fam) {
            push(GlyphSource::Emoji);
        } else if let Some(b) = map_family(fam) {
            push(GlyphSource::Text(b.face(spec.weight)));
        }
    }
    push(GlyphSource::Text(FALLBACK_FAMILY.face(spec.weight)));
    push(GlyphSource::Emoji);
    out
}

fn has_glyph(src: GlyphSource, c: char) -> bool {
    match src {
        GlyphSource::Text(f) => face_has_glyph(f, c),
        GlyphSource::Emoji => color_glyph(c).is_some(),
    }
}

/// The source a character is drawn from: the first of [`source_chain`] that
/// has it; a character no face has goes to the text engine (which draws the
/// `.notdef` glyph of its primary face, RR-T8b).
#[must_use]
pub fn glyph_source(spec: &FontSpec, c: char) -> GlyphSource {
    pick_source(&source_chain(spec), spec, c)
}

/// [`glyph_source`] over an already built chain.
fn pick_source(chain: &[GlyphSource], spec: &FontSpec, c: char) -> GlyphSource {
    chain
        .iter()
        .copied()
        .find(|s| has_glyph(*s, c))
        .unwrap_or_else(|| {
            chain
                .iter()
                .copied()
                .find(|s| matches!(s, GlyphSource::Text(_)))
                .unwrap_or(GlyphSource::Text(FALLBACK_FAMILY.face(spec.weight)))
        })
}

/// Whether `text` (after canvas whitespace preparation) has a character
/// drawn from the colour emoji face with `spec` — the switch between the
/// RR-T8b outline pipeline and [`draw_mixed`] / [`mixed_width`] (RR-T8f).
/// Only characters the emoji face has can be colour glyphs, so the chain is
/// built only when one occurs.
pub(crate) fn has_color_glyph(spec: &FontSpec, text: &str) -> bool {
    let mut chain: Option<Vec<GlyphSource>> = None;
    prepare(text).chars().any(|c| {
        color_glyph(c).is_some()
            && pick_source(chain.get_or_insert_with(|| source_chain(spec)), spec, c)
                == GlyphSource::Emoji
    })
}

/// Canvas text preparation (HTML: ASCII whitespace → U+0020), as RR-T8b.
fn prepare(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '\t' | '\n' | '\u{0C}' | '\r' => ' ',
            c => c,
        })
        .collect()
}

/// Advance (CSS px) of a colour glyph at `size_px` — Chromium: the bitmap
/// advance times the single-precision strike scale `size / ppem`, then
/// **truncated** to the 16.16 fixed point of HarfBuzz positions (fitted on
/// `widths.tsv`, bit for bit at every integer size 6–128 px and 4 of 5
/// fractional ones; `P4-30-IMAGES.md` §4.1 — plain f32 or f64 scaling
/// differs in the last bits for 86 of 255 rows).
#[must_use]
pub fn color_advance(g: &ColorGlyph, size_px: f64) -> f64 {
    let scale = size_px as f32 / f32::from(g.ppem);
    let adv = f32::from(g.advance) * scale;
    (f64::from(adv) * 65536.0).trunc() / 65536.0
}

/// One run of equal kind.
enum Run {
    Text(String),
    Emoji(Vec<ColorGlyph>, Vec<char>),
}

fn runs(spec: &FontSpec, text: &str) -> Vec<Run> {
    let chain = source_chain(spec);
    let mut out: Vec<Run> = Vec::new();
    for c in prepare(text).chars() {
        match pick_source(&chain, spec, c) {
            GlyphSource::Emoji => {
                let g = color_glyph(c).expect("emoji source has the glyph");
                match out.last_mut() {
                    Some(Run::Emoji(gs, cs)) => {
                        gs.push(g);
                        cs.push(c);
                    }
                    _ => out.push(Run::Emoji(vec![g], vec![c])),
                }
            }
            GlyphSource::Text(_) => match out.last_mut() {
                Some(Run::Text(s)) => s.push(c),
                _ => out.push(Run::Text(c.to_string())),
            },
        }
    }
    out
}

/// A `font` / `textAlign` / `textBaseline` triple, as the web sets them
/// before `fillText` / `measureText`.
#[derive(Clone, Debug, PartialEq)]
pub struct TextStyle {
    font_css: String,
    spec: FontSpec,
    align_css: String,
    align: TextAlign,
    baseline_css: String,
    baseline: TextBaseline,
}

impl TextStyle {
    /// `None` when `font` does not parse or `align` / `baseline` are not
    /// Canvas keywords.
    #[must_use]
    pub fn new(font: &str, align: &str, baseline: &str) -> Option<Self> {
        let spec = parse_font(font)?;
        let a = match align {
            "start" => TextAlign::Start,
            "end" => TextAlign::End,
            "left" => TextAlign::Left,
            "right" => TextAlign::Right,
            "center" => TextAlign::Center,
            _ => return None,
        };
        let b = match baseline {
            "alphabetic" => TextBaseline::Alphabetic,
            "top" => TextBaseline::Top,
            "hanging" => TextBaseline::Hanging,
            "middle" => TextBaseline::Middle,
            "ideographic" => TextBaseline::Ideographic,
            "bottom" => TextBaseline::Bottom,
            _ => return None,
        };
        Some(TextStyle {
            font_css: font.to_owned(),
            spec,
            align_css: align.to_owned(),
            align: a,
            baseline_css: baseline.to_owned(),
            baseline: b,
        })
    }

    /// The parsed font.
    #[must_use]
    pub fn spec(&self) -> &FontSpec {
        &self.spec
    }
}

fn round_64(v: f64) -> f64 {
    (v * 64.0).round() / 64.0
}

/// Downward offset from `y` to the alphabetic baseline, from the primary
/// face of the chain (Chromium uses the primary font's metrics for the whole
/// string). For an outline face this is `raster::text::baseline_shift`; for
/// the emoji face the same formulas (P4-29 §3.3) on its OS/2 / hhea metrics.
#[must_use]
pub fn emoji_aware_baseline_shift(spec: &FontSpec, baseline: TextBaseline) -> f64 {
    match source_chain(spec)[0] {
        GlyphSource::Text(_) => baseline_shift(spec, baseline),
        GlyphSource::Emoji => {
            let f = face();
            let size = spec.size_px;
            let (ta, td) = f.typo.unwrap_or((f.hhea_ascent, f.hhea_descent));
            let em_ascent = round_64(ta / (ta + td) * size);
            let ascent = (f.hhea_ascent * size / f.upem).round();
            let descent = (f.hhea_descent * size / f.upem).round();
            match baseline {
                TextBaseline::Alphabetic => 0.0,
                TextBaseline::Top => em_ascent,
                TextBaseline::Middle => em_ascent - size / 2.0,
                TextBaseline::Bottom => em_ascent - size,
                TextBaseline::Hanging => f64::from((0.8 * ascent) as f32),
                TextBaseline::Ideographic => -descent,
            }
        }
    }
}

/// Width of each run: an outline run as `measureText` of RR-T8b
/// (`shape_text`), a colour run as the sum of its bitmap advances.
fn run_widths(spec: &FontSpec, runs: &[Run]) -> Vec<f64> {
    runs.iter()
        .map(|r| match r {
            Run::Text(s) => shape_text(spec, s).width,
            Run::Emoji(gs, _) => gs.iter().map(|g| color_advance(g, spec.size_px)).sum(),
        })
        .collect()
}

/// `measureText(text).width` of a string with colour glyphs (RR-T8f; used
/// by `Canvas2dLite::measure_text` when [`has_color_glyph`]).
///
/// Model (fitted on Chromium 141, `P4-35-TEXT-EMOJI-UNIFY.md` §4 —
/// ZAŁOŻENIE Z-35-3): the width of every run (outline run: `shape_text`;
/// colour run: its advances summed exactly) is rounded to **single
/// precision** and the runs are accumulated in single precision (Blink's
/// `float` text widths). Bit for bit on all 308 mixed rows of
/// `tests/fixtures/textmix/widths.tsv` and on 252/255 rows of RR-T8c
/// (`image/widths.tsv`, the same 3 documented deviations as before); a plain
/// `f64` sum of runs (the RR-T8c model) misses 20/308 mixed rows (each wider
/// than 256 px, where `f32` keeps only 15 fractional bits).
pub(crate) fn mixed_width(spec: &FontSpec, text: &str) -> f64 {
    f32_total(&run_widths(spec, &runs(spec, text)))
}

/// Single-precision accumulation of run widths (see [`mixed_width`]).
fn f32_total(widths: &[f64]) -> f64 {
    f64::from(widths.iter().fold(0.0_f32, |acc, w| acc + *w as f32))
}

/// `ctx.measureText(text).width` with emoji (font as CSS `font` value).
/// `None` for a `font` value that does not parse. Thin delegation to
/// `Canvas2dLite::measure_text` (RR-T8f), kept for the RR-T8c callers.
#[must_use]
pub fn measure_text(font: &str, text: &str) -> Option<f64> {
    let mut scratch = Canvas2dLite::new(1, 1).expect("1×1 canvas");
    if !scratch.set_font(font) {
        return None;
    }
    Some(scratch.measure_text(text).width)
}

/// `ctx.font = …; ctx.textAlign = …; ctx.textBaseline = …;
/// ctx.fillText(text, x, y)` with colour emoji. On return the canvas text
/// state is `style` (as after the web's three assignments). Thin delegation
/// to `Canvas2dLite::fill_text` (RR-T8f), kept for the RR-T8c callers.
pub fn fill_text(ctx: &mut Canvas2dLite, style: &TextStyle, text: &str, x: f64, y: f64) {
    ctx.set_font(&style.font_css);
    ctx.set_text_align(&style.align_css);
    ctx.set_text_baseline(&style.baseline_css);
    ctx.fill_text(text, x, y);
}

/// `fillText` / `strokeText` of a string with colour glyphs, with the
/// canvas's current font, `textAlign`, `textBaseline` and CTM (RR-T8f; the
/// RR-T8c algorithm): alignment by the total width of all runs, one
/// alphabetic baseline from the chain's primary face, outline runs through
/// the RR-T8b pipeline (filled or stroked), colour glyphs as bitmaps with the
/// alpha of the fill style (`fillText`) or of the stroke style
/// (`strokeText`) — measured in Chromium 141 (`P4-35-TEXT-EMOJI-UNIFY.md`
/// §3.2). `x`, `y` are finite (checked by the caller).
pub(crate) fn draw_mixed(ctx: &mut Canvas2dLite, text: &str, x: f64, y: f64, paint: TextPaint) {
    let st = ctx.text_state();
    let spec = st.font().clone();
    let (align, baseline) = (st.align(), st.baseline());
    let rs = runs(&spec, text);
    let widths = run_widths(&spec, &rs);
    // Aligned by `measureText().width` (Chromium aligns by its float width).
    let total = f32_total(&widths);
    let x0 = match align {
        TextAlign::Start | TextAlign::Left => x,
        TextAlign::Center => x - total / 2.0,
        TextAlign::End | TextAlign::Right => x - total,
    };
    let base_y = y + emoji_aware_baseline_shift(&spec, baseline);
    let alpha = match paint {
        TextPaint::Fill => ctx.fill_color_alpha(),
        TextPaint::Stroke => ctx.stroke_color_alpha(),
    }
    .unwrap_or(1.0);
    let mut pen = x0;
    for (r, w) in rs.iter().zip(&widths) {
        match r {
            // Same font; placed by the alphabetic baseline computed from the
            // primary face of the whole string.
            Run::Text(s) => paint_outline_run(ctx, s, pen, base_y, paint),
            Run::Emoji(_, cs) => {
                let mut gx = pen;
                for c in cs {
                    if let Some((g, png)) = color_glyph_png(*c) {
                        draw_color_glyph(ctx, &g, png, spec.size_px, gx, base_y, alpha);
                        gx += color_advance(&g, spec.size_px);
                    }
                }
            }
        }
        pen += w;
    }
}

/// Decoded (premultiplied) strike bitmap of a glyph, cached per process.
fn strike_pixmap(png: &'static [u8]) -> Option<Pixmap> {
    static CACHE: OnceLock<std::sync::Mutex<Vec<(usize, Pixmap)>>> = OnceLock::new();
    let key = png.as_ptr() as usize;
    let cache = CACHE.get_or_init(|| std::sync::Mutex::new(Vec::new()));
    let mut guard = cache.lock().ok()?;
    if let Some((_, p)) = guard.iter().find(|(k, _)| *k == key) {
        return Some(p.clone());
    }
    let p = Pixmap::decode_png(png).ok()?;
    guard.push((key, p.clone()));
    Some(p)
}

/// Draws one colour glyph with its pen at user-space `(x, baseline_y)`.
fn draw_color_glyph(
    ctx: &mut Canvas2dLite,
    g: &ColorGlyph,
    png: &'static [u8],
    size_px: f64,
    x: f64,
    baseline_y: f64,
    alpha: f32,
) {
    let Some(bitmap) = strike_pixmap(png) else {
        return;
    };
    let ctm = ctx.ctm();
    let s = size_px / f64::from(g.ppem);
    // Glyph origin in device space; quantised like outline glyphs (P4-29
    // §3.5): 1/4 px horizontally, whole px vertically, axis-aligned CTM only.
    let o = ctm.map(x, baseline_y);
    let (mut ox, mut oy) = (f64::from(o.x), f64::from(o.y));
    if ctm.is_axis_aligned() {
        ox = (ox * 4.0 + 0.5).floor() / 4.0;
        oy = (oy + 0.5).floor();
    }
    // bitmap px → device: origin + CTM-linear(scale(s) · translate(bx, −by)).
    let lin = Affine {
        a: ctm.a,
        b: ctm.b,
        c: ctm.c,
        d: ctm.d,
        e: ox,
        f: oy,
    };
    let to_device = lin.then_local(&Affine {
        a: s,
        b: 0.0,
        c: 0.0,
        d: s,
        e: f64::from(g.bearing_x) * s,
        f: -f64::from(g.bearing_y) * s,
    });
    let (w, h) = (ctx.width(), ctx.height());
    let Some(mut layer) = Pixmap::new(w, h) else {
        return;
    };
    // Chromium picks a box-filtered mip level of the strike bitmap, then
    // samples it bilinearly (measured, `P4-30-IMAGES.md` §4.3).
    let level = mip_level(s * device_scale(&ctm));
    let src = level_of(&bitmap, level);
    let up = f64::from(1u32 << level);
    let to_device = to_device.then_local(&Affine {
        a: up,
        b: 0.0,
        c: 0.0,
        d: up,
        e: 0.0,
        f: 0.0,
    });
    let paint = PixmapPaint {
        opacity: alpha,
        quality: GLYPH_FILTER,
        ..PixmapPaint::default()
    };
    layer.draw_pixmap(0, 0, src.as_ref(), &paint, to_device.to_skia(), None);
    composite_device_layer(ctx, layer);
}

/// The larger axis scale of a transform's linear part (mip selection).
pub(crate) fn device_scale(m: &Affine) -> f64 {
    let sx = axis_scale(m.a, m.b);
    let sy = axis_scale(m.c, m.d);
    sx.max(sy)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn subset_has_the_23_code_points_with_png_bitmaps() {
        let cps = "⚔☠👤🔥🍞🔨💰⛏🌾🎣🏔🏛🏰🏹🏺🐑💧🛡🛤🧂🪓🪚🪨";
        assert_eq!(cps.chars().count(), 23);
        for c in cps.chars() {
            let (g, png) = color_glyph_png(c).unwrap_or_else(|| panic!("{c} missing"));
            assert_eq!((g.ppem, g.width, g.height), (109, 136, 128), "{c}");
            assert_eq!((g.bearing_x, g.bearing_y, g.advance), (0, 101, 136), "{c}");
            assert_eq!(&png[..8], b"\x89PNG\r\n\x1a\n", "{c}");
            assert!(strike_pixmap(png).is_some(), "{c} decodes");
        }
        assert!(color_glyph('◆').is_none(), "Noto has no U+25C6");
        assert!(color_glyph('A').is_none());
    }

    #[test]
    fn cbdt_reader_agrees_with_ttf_parser() {
        let f = face();
        for c in "👤🔥⚔".chars() {
            let gid = f.face.glyph_index(c).expect("cmap");
            let img = f.face.glyph_raster_image(gid, 109).expect("raster");
            let (m, png) = color_glyph_png(c).expect("ours");
            assert_eq!(img.data, png);
            assert_eq!(img.x, i16::from(m.bearing_x));
            assert_eq!(img.y, i16::from(m.bearing_y) - i16::from(m.height));
            assert_eq!((img.width, img.height), (136, 128));
        }
    }

    #[test]
    fn selection_is_per_character() {
        let s = parse_font("bold 16px Segoe UI, Arial").expect("font");
        assert_eq!(glyph_source(&s, '👤'), GlyphSource::Emoji);
        assert_eq!(
            glyph_source(&s, 'A'),
            GlyphSource::Text(BundledFace::LiberationSansBold)
        );
        // Default text presentation: monochrome DejaVu before the emoji face.
        assert_eq!(
            glyph_source(&s, '⚔'),
            GlyphSource::Text(BundledFace::DejaVuSansBold)
        );
        // Explicit "Noto Color Emoji" before sans-serif (T13 emoji font).
        let t13 = parse_font(
            r#"16px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif"#,
        )
        .expect("font");
        assert_eq!(source_chain(&t13)[0], GlyphSource::Emoji);
        assert_eq!(glyph_source(&t13, '⚔'), GlyphSource::Emoji);
        assert_eq!(
            glyph_source(&t13, '7'),
            GlyphSource::Text(BundledFace::LiberationSansRegular)
        );
    }
}
