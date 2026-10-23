//! Text measurement of a DOM text node, as Chromium's LayoutNG does it —
//! which differs from Canvas `measureText` (RR-T8b) in two measured ways
//! (`P4-34-ANCHORS-DOM.md` §3.3; 1 984 labels of `sweep.tsv`):
//!
//! 1. **no word-by-word shaping**: a DOM text item is shaped as one run per
//!    face, so GPOS kerning applies across spaces (`Calleva Atrebatum`:
//!    the `space–A` pair, −0.34 px vs the canvas width);
//! 2. at a **fractional** font size the font is the one of the font cache
//!    key, whose size is truncated to 1/100 px ([`font_key_px`]); FreeType
//!    is set to that size truncated to 26.6 ([`effective_font_px`], glyph
//!    advances) and HarfBuzz scales GPOS adjustments by the key size.
//!
//! At integer sizes without spaces this is exactly the canvas width (same
//! arithmetic as `raster::text::shape_text`).

use rustybuzz::ttf_parser::GlyphId;

use crate::raster::image::emoji::{color_advance, color_glyph, glyph_source, GlyphSource};
use crate::raster::text::{parse_font, BundledFace};

/// The size of Blink's font cache key for a CSS font size: `(unsigned)(size
/// · 100) / 100` in `float` (`9.1666667` → `9.16`). Measured: the GPOS
/// kerning of `Ta` / `Av` at `9.1666667px` in Chromium 141 is exactly the
/// HarfBuzz scaling of −152 / −76 units at `x_scale = (int)(9.16f · 65536)`
/// (`P4-34-ANCHORS-DOM.md` §3.3).
#[must_use]
pub fn font_key_px(px: f64) -> f64 {
    // Font sizes are small positive numbers.
    #[allow(clippy::cast_possible_truncation)]
    let k = ((px as f32) * 100.0).trunc() / 100.0;
    f64::from(k)
}

/// The size FreeType rasterises and advances glyphs at: the font key size
/// ([`font_key_px`]) truncated to 26.6 fixed point (`SkScalarToFDot6`).
/// Measured with `measureText` at 11 sizes — the advance of `M` gives the
/// size back exactly: `9.1666667` → `9.15625`, `9.1` → `9.09375`,
/// `9.171875` → `9.15625`, `9.18` → `9.171875`, `12.3` → `12.296875`,
/// integers unchanged. Only R5 `<small>` (11 / 1.2 px) is fractional here.
#[must_use]
pub fn effective_font_px(px: f64) -> f64 {
    // Font sizes are small positive numbers.
    #[allow(clippy::cast_possible_truncation)]
    let k = font_key_px(px) as f32;
    f64::from((k * 64.0).trunc() / 64.0)
}

/// A shaped DOM text node: total advance and the pen position at the start
/// of every character (byte offset → px).
#[derive(Clone, Debug, PartialEq)]
pub struct DomShaped {
    /// Total advance, CSS px (before the `LayoutUnit` ceil).
    pub width: f64,
    /// `(byte offset of a cluster start, pen x)` in logical order.
    pub pens: Vec<(usize, f64)>,
}

impl DomShaped {
    /// Pen x at the cluster starting at byte `offset` (or the end).
    #[must_use]
    pub fn pen_at(&self, offset: usize) -> f64 {
        self.pens
            .iter()
            .find(|(o, _)| *o == offset)
            .map_or(self.width, |(_, x)| *x)
    }
}

/// FreeType's linear advance (16.16 px) of `units` at a 26.6 size `px`
/// (`FT_DivFix` x scale, `FT_MulDiv(advance, x_scale, 64)`, both rounded).
fn advance_16_16(units: u16, px: f64, upem: i32) -> i64 {
    // 26.6 size of a quantised (1/64) size: exact.
    #[allow(clippy::cast_possible_truncation)]
    let size_26_6 = (px * 64.0).round() as i64;
    let upem = i64::from(upem);
    let x_scale = ((size_26_6 << 16) + upem / 2) / upem;
    (i64::from(units) * x_scale + 32) / 64
}

/// HarfBuzz `em_scale` of a GPOS adjustment (font units to 16.16 px) at the
/// font key size: `x_scale = (int)(size * 65536)` (float), `em_mult =
/// (x_scale << 16) / upem`, `(v * em_mult + 32768) >> 16`.
fn kern_16_16(v: i32, px: f64, upem: i32) -> i64 {
    #[allow(clippy::cast_possible_truncation)]
    let x_scale = ((px as f32) * 65536.0) as i64;
    let em_mult = (x_scale << 16) / i64::from(upem);
    (i64::from(v) * em_mult + 32768) >> 16
}

enum Run {
    Text(Vec<(BundledFace, usize, String)>),
    Emoji(Vec<(usize, char)>),
}

/// Shapes a DOM text node in the CSS `font` (computed size).
///
/// # Panics
/// When `font` does not parse (label fonts are constants).
#[must_use]
pub fn dom_shape(font: &str, text: &str) -> DomShaped {
    let spec = parse_font(font).expect("label font parses");
    let s_css = spec.size_px;
    let s_eff = effective_font_px(s_css);
    let s_key = font_key_px(s_css);
    // Runs of emoji / text; inside a text run, segments of equal face.
    let mut runs: Vec<Run> = Vec::new();
    for (i, c) in text.char_indices() {
        match glyph_source(&spec, c) {
            GlyphSource::Emoji => match runs.last_mut() {
                Some(Run::Emoji(v)) => v.push((i, c)),
                _ => runs.push(Run::Emoji(vec![(i, c)])),
            },
            GlyphSource::Text(face) => match runs.last_mut() {
                Some(Run::Text(segs)) => match segs.last_mut() {
                    Some((f, _, s)) if *f == face => s.push(c),
                    _ => segs.push((face, i, c.to_string())),
                },
                _ => runs.push(Run::Text(vec![(face, i, c.to_string())])),
            },
        }
    }
    let mut total = 0.0f64;
    let mut pens = Vec::new();
    for run in runs {
        let mut pen = 0.0f64;
        match run {
            Run::Emoji(v) => {
                for (i, c) in v {
                    pens.push((i, total + pen));
                    let g = color_glyph(c).expect("emoji source has the glyph");
                    pen += color_advance(&g, s_eff);
                }
            }
            Run::Text(segs) => {
                for (face, start, s) in segs {
                    let hb = rustybuzz::Face::from_slice(face.data(), 0).expect("bundled face");
                    let upem = f64::from(hb.units_per_em());
                    let mut buf = rustybuzz::UnicodeBuffer::new();
                    buf.push_str(&s);
                    buf.set_direction(rustybuzz::Direction::LeftToRight);
                    let out = rustybuzz::shape(&hb, &[], buf);
                    let mut last_cluster = usize::MAX;
                    for (info, pos) in out.glyph_infos().iter().zip(out.glyph_positions()) {
                        let cl = start + info.cluster as usize;
                        if cl != last_cluster {
                            pens.push((cl, total + pen));
                            last_cluster = cl;
                        }
                        let adv = f64::from(pos.x_advance);
                        if s_eff == s_css {
                            pen += adv * (s_css / upem);
                        } else {
                            // Glyph ids of the bundled faces fit in u16.
                            #[allow(clippy::cast_possible_truncation)]
                            let nominal = hb
                                .glyph_hor_advance(GlyphId(info.glyph_id as u16))
                                .unwrap_or(0);
                            let fixed = advance_16_16(nominal, s_eff, hb.units_per_em())
                                + kern_16_16(
                                    pos.x_advance - i32::from(nominal),
                                    s_key,
                                    hb.units_per_em(),
                                );
                            // 16.16 positions: exact in f64.
                            #[allow(clippy::cast_precision_loss)]
                            let px = fixed as f64 / 65536.0;
                            pen += px;
                        }
                    }
                }
            }
        }
        total += pen;
    }
    DomShaped { width: total, pens }
}
