//! SVG icons (brand book) → [`Canvas2dLite`] (T10 sigils, T11 badge icons,
//! T14 medallion sigil and production icon).
//!
//! 1. [`prepare_svg_for_canvas`] — port of the web `prepareSvgForCanvas`
//!    (`render/unitOwnerEmblem.ts:224-229`, pin `edb8fb56`): every
//!    `currentColor` becomes the stroke colour and every
//!    `stroke-width="<[0-9.]+>"` is multiplied by `strokeBoost` and printed
//!    with JS `Number.prototype.toFixed(2)`; results compared string-for-string
//!    with the JS function in `tests/image_svg.rs`.
//! 2. [`SvgImage::parse`] — `usvg` (resvg 0.48.1, default features off: no
//!    fonts / SVG text, no svgz, no embedded raster images — the icons have
//!    none). The intrinsic size is the `width`/`height` of the root element
//!    (`normalizeSvg` in `ui/icons/brandAssets.ts:50-61` sets them to 24 or
//!    40), like the `<img>` the web loads.
//! 3. [`draw_svg`] — `ctx.drawImage(svgImg, dx, dy, dw, dh)`: the vector
//!    picture is rasterised by `resvg` **at device resolution** through the
//!    current transform (Chromium draws an SVG image into a canvas as a
//!    vector picture, not as a bitmap of its intrinsic size — measured:
//!    `P4-30-IMAGES.md` §5, scene `x_svg_scaled_x3`), then composited with
//!    the current clip.

use resvg::tiny_skia::{Pixmap, Transform};
use resvg::usvg;

use super::{ImageError, RasterImage};
use crate::raster::{Affine, Canvas2dLite};

/// JS `parseFloat` restricted to what the web regex `[\d.]+` can capture:
/// the longest prefix `digits [ "." digits ]` (at least one digit), else NaN.
fn js_parse_float_digits_dots(s: &str) -> f64 {
    let mut end = 0;
    let mut seen_dot = false;
    let mut seen_digit = false;
    for (i, c) in s.char_indices() {
        if c.is_ascii_digit() {
            seen_digit = true;
            end = i + 1;
        } else if c == '.' && !seen_dot {
            seen_dot = true;
            // A trailing dot is part of a valid prefix only with digits
            // before it ("5." → 5); ".": NaN.
            if seen_digit {
                end = i + 1;
            }
        } else {
            break;
        }
    }
    if !seen_digit {
        return f64::NAN;
    }
    let prefix = s[..end].trim_end_matches('.');
    let prefix = if prefix.starts_with('.') {
        format!("0{prefix}")
    } else {
        prefix.to_owned()
    };
    prefix.parse().unwrap_or(f64::NAN)
}

/// JS `Number.prototype.toFixed(digits)` (ECMA-262 §21.1.3.3): the integer
/// `n` with `n / 10^f − x` closest to zero, the **larger** `n` on a tie —
/// i.e. round half up on the exact binary value (Rust's `{:.2}` rounds ties
/// of the exact value to even, which differs, e.g. for `1.125`).
#[must_use]
pub fn js_to_fixed(x: f64, digits: usize) -> String {
    if x.is_nan() {
        return "NaN".to_owned();
    }
    if x.abs() >= 1e21 {
        return js_number_to_string_exp(x);
    }
    if x < 0.0 {
        let s = js_to_fixed(-x, digits);
        // (-0.001).toFixed(2) is "-0.00" in JS: the sign is kept.
        return format!("-{s}");
    }
    // The exact decimal expansion of a finite double has at most 1074
    // fractional digits; Rust formats it exactly at any precision.
    let exact = format!("{x:.1100}");
    let (int_part, frac) = exact.split_once('.').expect("fixed notation has a dot");
    let mut digits_vec: Vec<u8> = int_part
        .bytes()
        .chain(frac.bytes().take(digits))
        .map(|b| b - b'0')
        .collect();
    let round_up = frac.as_bytes()[digits] >= b'5';
    if round_up {
        let mut i = digits_vec.len();
        loop {
            if i == 0 {
                digits_vec.insert(0, 1);
                break;
            }
            i -= 1;
            if digits_vec[i] == 9 {
                digits_vec[i] = 0;
            } else {
                digits_vec[i] += 1;
                break;
            }
        }
    }
    let n_int = digits_vec.len() - digits;
    let mut out: String = digits_vec[..n_int]
        .iter()
        .map(|d| char::from(b'0' + d))
        .collect();
    if digits > 0 {
        out.push('.');
        out.extend(digits_vec[n_int..].iter().map(|d| char::from(b'0' + d)));
    }
    out
}

/// JS `Number::toString` for `|x| >= 1e21` (exponential form `1.5e+21`).
fn js_number_to_string_exp(x: f64) -> String {
    if x.is_infinite() {
        return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_owned();
    }
    // Rust `{:e}` prints the shortest round-trip digits, as JS does.
    let s = format!("{x:e}");
    let (m, e) = s.split_once('e').expect("exponent");
    if e.starts_with('-') {
        format!("{m}e{e}")
    } else {
        format!("{m}e+{e}")
    }
}

/// Port of `prepareSvgForCanvas(svg, strokeColor, strokeBoost = 1.6)`
/// (`render/unitOwnerEmblem.ts:224-229`):
/// ```js
/// svg.replace(/currentColor/g, strokeColor)
///    .replace(/stroke-width="([\d.]+)"/g,
///             (_m, w) => `stroke-width="${(parseFloat(w) * strokeBoost).toFixed(2)}"`);
/// ```
/// An empty input gives an empty output (`if (!svg) return ''`).
#[must_use]
pub fn prepare_svg_for_canvas(svg: &str, stroke_color: &str, stroke_boost: f64) -> String {
    if svg.is_empty() {
        return String::new();
    }
    let s = svg.replace("currentColor", stroke_color);
    const KEY: &str = "stroke-width=\"";
    let mut out = String::with_capacity(s.len());
    let mut rest = s.as_str();
    while let Some(at) = rest.find(KEY) {
        let after = &rest[at + KEY.len()..];
        let n = after
            .bytes()
            .take_while(|b| b.is_ascii_digit() || *b == b'.')
            .count();
        if n > 0 && after.as_bytes().get(n) == Some(&b'"') {
            let w = js_parse_float_digits_dots(&after[..n]);
            out.push_str(&rest[..at]);
            out.push_str(KEY);
            out.push_str(&js_to_fixed(w * stroke_boost, 2));
            out.push('"');
            rest = &after[n + 1..];
        } else {
            // No match here: the regex resumes one character later.
            let step = at + rest[at..].chars().next().map_or(1, char::len_utf8);
            out.push_str(&rest[..step]);
            rest = &rest[step..];
        }
    }
    out.push_str(rest);
    out
}

/// A parsed SVG document, ready to be drawn like an `<img>` of it.
#[derive(Clone, Debug)]
pub struct SvgImage {
    tree: usvg::Tree,
}

impl SvgImage {
    /// Parses an SVG document (UTF-8 text, as produced by
    /// [`prepare_svg_for_canvas`]).
    ///
    /// # Errors
    /// [`ImageError::Svg`] when `usvg` rejects the document.
    pub fn parse(svg: &str) -> Result<Self, ImageError> {
        let opt = usvg::Options::default();
        let tree = usvg::Tree::from_str(svg, &opt).map_err(|e| ImageError::Svg(e.to_string()))?;
        Ok(SvgImage { tree })
    }

    /// Intrinsic width (`img.width`) in CSS px.
    #[must_use]
    pub fn width(&self) -> f64 {
        f64::from(self.tree.size().width())
    }

    /// Intrinsic height (`img.height`) in CSS px.
    #[must_use]
    pub fn height(&self) -> f64 {
        f64::from(self.tree.size().height())
    }

    /// Rasterises the document to a `w × h` image (its intrinsic size
    /// stretched to the box), e.g. for a cache or a texture atlas.
    ///
    /// # Errors
    /// [`ImageError::InvalidSize`] for a zero side.
    pub fn rasterize(&self, w: u32, h: u32) -> Result<RasterImage, ImageError> {
        let mut pm = Pixmap::new(w, h).ok_or(ImageError::InvalidSize)?;
        let ts = Transform::from_scale(
            (f64::from(w) / self.width()) as f32,
            (f64::from(h) / self.height()) as f32,
        );
        resvg::render(&self.tree, ts, &mut pm.as_mut());
        Ok(RasterImage::from_pixmap(pm))
    }
}

/// `ctx.drawImage(svgImg, dx, dy, dw, dh)` for an SVG image: the document is
/// rendered by `resvg` straight into device space (CTM × destination box ×
/// intrinsic-size scale), into a transparent layer the size of the canvas,
/// which is then composited 1:1 with the current clip (and shadow state,
/// as `drawImage` would; the web never draws images with a shadow).
pub fn draw_svg(ctx: &mut Canvas2dLite, img: &SvgImage, dx: f64, dy: f64, dw: f64, dh: f64) {
    if ![dx, dy, dw, dh].iter().all(|v| v.is_finite()) || dw == 0.0 || dh == 0.0 {
        return;
    }
    let (dx, dw) = if dw < 0.0 { (dx + dw, -dw) } else { (dx, dw) };
    let (dy, dh) = if dh < 0.0 { (dy + dh, -dh) } else { (dy, dh) };
    let local = Affine {
        a: dw / img.width(),
        b: 0.0,
        c: 0.0,
        d: dh / img.height(),
        e: dx,
        f: dy,
    };
    let to_device = ctx.ctm().then_local(&local);
    let (w, h) = (ctx.width(), ctx.height());
    let Some(mut layer) = Pixmap::new(w, h) else {
        return;
    };
    resvg::render(&img.tree, to_device.to_skia(), &mut layer.as_mut());
    composite_device_layer(ctx, layer);
}

/// Composites a canvas-sized premultiplied layer onto `ctx` pixel for pixel
/// (identity transform; the clip and the rest of the state stay as they
/// are).
pub(crate) fn composite_device_layer(ctx: &mut Canvas2dLite, layer: Pixmap) {
    let (w, h) = (f64::from(layer.width()), f64::from(layer.height()));
    let image = RasterImage::from_pixmap(layer);
    let ctm = ctx.ctm();
    ctx.set_transform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
    ctx.draw_image(&image, 0.0, 0.0, w, h);
    ctx.set_transform(ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn to_fixed_rounds_ties_up_like_js() {
        // Values checked in node v22 (`(x).toFixed(2)`).
        assert_eq!(js_to_fixed(1.125, 2), "1.13"); // exact tie → up (Rust {:.2}: 1.12)
        assert_eq!(js_to_fixed(2.4000000000000004, 2), "2.40");
        assert_eq!(js_to_fixed(1.7999999999999998, 2), "1.80");
        assert_eq!(js_to_fixed(1.005, 2), "1.00"); // 1.00499999999999989…
        assert_eq!(js_to_fixed(9.995, 2), "9.99"); // 9.99499999999999957…
        assert_eq!(js_to_fixed(99.995, 2), "100.00"); // 99.9950000000000045…
        assert_eq!(js_to_fixed(0.0, 2), "0.00");
        assert_eq!(js_to_fixed(f64::NAN, 2), "NaN");
        assert_eq!(js_to_fixed(1e21, 2), "1e+21");
    }

    #[test]
    fn parse_float_prefix() {
        assert_eq!(js_parse_float_digits_dots("1.5"), 1.5);
        assert_eq!(js_parse_float_digits_dots("1.5.2"), 1.5);
        assert_eq!(js_parse_float_digits_dots(".5"), 0.5);
        assert_eq!(js_parse_float_digits_dots("5."), 5.0);
        assert!(js_parse_float_digits_dots(".").is_nan());
        assert!(js_parse_float_digits_dots("..5").is_nan());
    }

    #[test]
    fn prepare_replaces_colour_and_width() {
        let s = r#"<svg stroke="currentColor" stroke-width="1.5"><path stroke-width="2"/><g stroke-width='3'/><x stroke-width="a"/></svg>"#;
        assert_eq!(
            prepare_svg_for_canvas(s, "#e8d88a", 1.6),
            r##"<svg stroke="#e8d88a" stroke-width="2.40"><path stroke-width="3.20"/><g stroke-width='3'/><x stroke-width="a"/></svg>"##
        );
        assert_eq!(prepare_svg_for_canvas("", "#fff", 1.6), "");
    }
}
