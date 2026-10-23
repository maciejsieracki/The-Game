//! Rasterises a [`LabelLayout`] into a premultiplied RGBA8 texture on
//! `Canvas2dLite` (RR-T8a/b/c), in the CSS painting order of one element:
//! `box-shadow` (outer, clipped to outside the border box) → background →
//! border → `text-shadow` layers (last listed at the bottom) → text; then
//! the element `opacity`.
//!
//! The texture covers the border box plus a transparent margin
//! ([`super::style::shadow_margin`]) on every side, so the shadows fit; the
//! border box's top-left corner is at `(margin, margin)` CSS px. With a
//! device scale `dsf` the texture is `dsf ×` larger and every coordinate is
//! scaled (like a HiDPI page).
//!
//! Blink snaps the border box of backgrounds, borders and box shadows to
//! whole device pixels (`PixelSnappedIntRect`: `round(x)`,
//! `round(x + w) − round(x)`); text is placed at its layout position (the
//! glyph origin quantisation is the RR-T8b one).

use crate::jsmath::js_exp;
use crate::raster::image::emoji::{fill_text, TextStyle};
use crate::raster::{parse_css_color, Canvas2dLite};

use super::layout::{lu_px, LabelLayout};
use super::style::{shadow_margin, Shadow};

/// A rendered label.
#[derive(Clone, Debug, PartialEq)]
pub struct LabelTexture {
    /// Width in device pixels.
    pub width: u32,
    /// Height in device pixels.
    pub height: u32,
    /// Margin around the border box, CSS px.
    pub margin: u32,
    /// Device scale used.
    pub dsf: f64,
    /// Premultiplied RGBA8, row-major.
    pub rgba: Vec<u8>,
}

impl LabelTexture {
    /// Straight (non-premultiplied) RGBA8.
    #[must_use]
    pub fn to_straight(&self) -> Vec<u8> {
        let mut out = self.rgba.clone();
        for p in out.chunks_exact_mut(4) {
            let a = u32::from(p[3]);
            if a != 0 && a != 255 {
                for c in &mut p[..3] {
                    // Exact rounding division; result ≤ 255 because c ≤ a.
                    #[allow(clippy::cast_possible_truncation)]
                    let v = ((u32::from(*c) * 255 + a / 2) / a).min(255) as u8;
                    *c = v;
                }
            }
        }
        out
    }

    /// FNV-1a 64 of the premultiplied buffer (golden hashes).
    #[must_use]
    pub fn hash(&self) -> u64 {
        crate::raster::fnv1a64(&self.rgba)
    }
}

/// Texture size in CSS px for a layout: `ceil(border box) + 2 · margin`.
#[must_use]
pub fn texture_css_size(layout: &LabelLayout) -> (u32, u32, u32) {
    let shadows: Vec<Shadow> = layout
        .decoration
        .map(|d| vec![d.style.shadow])
        .unwrap_or_else(|| layout.text_shadows.clone());
    let m = shadow_margin(&shadows);
    // Label sizes are small positive numbers: exact casts.
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let w = lu_px(layout.width).ceil() as u32 + 2 * m;
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let h = lu_px(layout.height).ceil() as u32 + 2 * m;
    (w, h, m)
}

/// `round()` of Blink's pixel snapping (`std::round`, half away from zero).
fn snap(v: f64) -> f64 {
    v.round()
}

/// Renders a label at device scale `dsf` with element opacity `opacity`
/// (`1.0` = opaque; the float labels pass `1 − p²`).
///
/// # Panics
/// Only on an absurd `dsf` (texture size overflow).
#[must_use]
pub fn render_label(layout: &LabelLayout, dsf: f64, opacity: f32) -> LabelTexture {
    let (cw, ch, margin) = texture_css_size(layout);
    // Device sizes of a small texture: exact casts.
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let (w, h) = (
        (f64::from(cw) * dsf).round() as u32,
        (f64::from(ch) * dsf).round() as u32,
    );
    let n = (w as usize) * (h as usize) * 4;
    let mut out = vec![0u8; n];
    let m = f64::from(margin);

    if let Some(deco) = layout.decoration {
        let s = deco.style;
        let x0 = snap(m) * dsf;
        let y0 = snap(m) * dsf;
        let x1 = snap(m + lu_px(layout.width)) * dsf;
        let y1 = snap(m + lu_px(layout.height)) * dsf;
        let r = s.radius * dsf;
        // 1. box-shadow, clipped to outside the border box.
        let sh = s.shadow;
        let mut shape = Canvas2dLite::new(w, h).expect("texture size");
        shape.set_fill_style("#fff");
        shape.begin_path();
        let _ = shape.round_rect(
            x0 + sh.offset_x * dsf,
            y0 + sh.offset_y * dsf,
            x1 - x0,
            y1 - y0,
            r,
        );
        shape.fill();
        let mut inside = Canvas2dLite::new(w, h).expect("texture size");
        inside.set_fill_style("#fff");
        inside.begin_path();
        let _ = inside.round_rect(x0, y0, x1 - x0, y1 - y0, r);
        inside.fill();
        let layer = shadow_layer(
            shape.pixels_premultiplied(),
            w as usize,
            h as usize,
            sh.color,
            sh.blur * dsf,
            0,
            0,
            Some(inside.pixels_premultiplied()),
        );
        over(&mut out, &layer);
        // 2. background + 3. border.
        let mut c = Canvas2dLite::new(w, h).expect("texture size");
        c.set_fill_style(s.background);
        c.begin_path();
        let _ = c.round_rect(x0, y0, x1 - x0, y1 - y0, r);
        c.fill();
        let bw = s.border_width * dsf;
        c.set_fill_style(deco.border_color);
        c.begin_path();
        let _ = c.round_rect(x0, y0, x1 - x0, y1 - y0, r);
        ring_inner_ccw(
            &mut c,
            x0 + bw,
            y0 + bw,
            x1 - bw,
            y1 - bw,
            (r - bw).max(0.0),
        );
        c.fill();
        over(&mut out, c.pixels_premultiplied());
    }

    // 4. text (+ text shadows).
    let mut t = Canvas2dLite::new(w, h).expect("texture size");
    t.set_transform(dsf, 0.0, 0.0, dsf, 0.0, 0.0);
    for f in &layout.fragments {
        let style = TextStyle::new(&f.font, "left", "alphabetic").expect("label font parses");
        t.set_fill_style(&f.color);
        for (piece, dx) in &f.pieces {
            fill_text(
                &mut t,
                &style,
                piece,
                m + lu_px(f.x) + dx,
                snap(m + lu_px(f.baseline)),
            );
        }
    }
    let text = t.pixels_premultiplied();
    for s in layout.text_shadows.iter().rev() {
        // Offsets of the web's shadows are whole CSS px.
        #[allow(clippy::cast_possible_truncation)]
        let (dx, dy) = (
            (s.offset_x * dsf).round() as i64,
            (s.offset_y * dsf).round() as i64,
        );
        let layer = shadow_layer(
            text,
            w as usize,
            h as usize,
            s.color,
            s.blur * dsf,
            dx,
            dy,
            None,
        );
        over(&mut out, &layer);
    }
    over(&mut out, text);

    // 5. opacity.
    if opacity < 1.0 {
        let o = opacity.clamp(0.0, 1.0);
        for v in &mut out {
            // 0..=255 × 0..=1: in range.
            #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
            let s = (f32::from(*v) * o + 0.5) as u8;
            *v = s;
        }
    }
    LabelTexture {
        width: w,
        height: h,
        margin,
        dsf,
        rgba: out,
    }
}

/// Adds the inner contour of a border ring, counter-clockwise (so the
/// non-zero fill of outer + inner leaves only the ring).
fn ring_inner_ccw(c: &mut Canvas2dLite, x0: f64, y0: f64, x1: f64, y1: f64, r: f64) {
    use std::f64::consts::{FRAC_PI_2, PI};
    c.move_to(x0 + r, y0);
    let _ = c.arc(x0 + r, y0 + r, r, -FRAC_PI_2, -PI, true);
    c.line_to(x0, y1 - r);
    let _ = c.arc(x0 + r, y1 - r, r, PI, FRAC_PI_2, true);
    c.line_to(x1 - r, y1);
    let _ = c.arc(x1 - r, y1 - r, r, FRAC_PI_2, 0.0, true);
    c.line_to(x1, y0 + r);
    let _ = c.arc(x1 - r, y0 + r, r, 0.0, -FRAC_PI_2, true);
    c.close_path();
}

/// Source-over of premultiplied `src` onto premultiplied `dst` (same size).
fn over(dst: &mut [u8], src: &[u8]) {
    for (d, s) in dst.chunks_exact_mut(4).zip(src.chunks_exact(4)) {
        let sa = u32::from(s[3]);
        if sa == 0 {
            continue;
        }
        let inv = 255 - sa;
        for i in 0..4 {
            // s + d·(1 − sa), rounded; ≤ 255 for valid premultiplied input.
            #[allow(clippy::cast_possible_truncation)]
            let v = (u32::from(s[i]) + (u32::from(d[i]) * inv + 127) / 255).min(255) as u8;
            d[i] = v;
        }
    }
}

/// A coloured, blurred, offset copy of the alpha of `src`; with `clip_out`
/// the result is multiplied by `1 − coverage(clip_out)` (outer box shadow).
#[allow(clippy::too_many_arguments)]
fn shadow_layer(
    src: &[u8],
    w: usize,
    h: usize,
    color: &str,
    blur: f64,
    dx: i64,
    dy: i64,
    clip_out: Option<&[u8]>,
) -> Vec<u8> {
    let c = parse_css_color(color).expect("shadow colour parses");
    let mut alpha = vec![0.0f32; w * h];
    for y in 0..h {
        for x in 0..w {
            // Offsets are tiny; the texture is small: no overflow.
            #[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
            let (sx, sy) = (x as i64 - dx, y as i64 - dy);
            if sx >= 0 && sy >= 0 && (sx as usize) < w && (sy as usize) < h {
                #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
                let i = (sy as usize) * w + sx as usize;
                alpha[y * w + x] = f32::from(src[i * 4 + 3]) / 255.0;
            }
        }
    }
    let sigma = blur * 0.5;
    if sigma > 0.0 {
        let k = gaussian_kernel(sigma);
        alpha = blur_pass(&alpha, w, h, &k, true);
        alpha = blur_pass(&alpha, w, h, &k, false);
    }
    let mut out = vec![0u8; w * h * 4];
    for (i, a) in alpha.into_iter().enumerate() {
        let mut aa = (a * c.a).clamp(0.0, 1.0);
        if let Some(clip) = clip_out {
            aa *= 1.0 - f32::from(clip[i * 4 + 3]) / 255.0;
        }
        // Values in 0..=255.
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let q = |v: f32| (v * aa * 255.0 + 0.5) as u8;
        out[i * 4] = q(c.r);
        out[i * 4 + 1] = q(c.g);
        out[i * 4 + 2] = q(c.b);
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let av = (aa * 255.0 + 0.5) as u8;
        out[i * 4 + 3] = av;
    }
    out
}

/// Normalised Gaussian kernel of standard deviation `sigma`, radius `⌈3σ⌉`.
fn gaussian_kernel(sigma: f64) -> Vec<f32> {
    // Radius of a small blur: exact cast.
    #[allow(clippy::cast_possible_truncation)]
    let radius = (3.0 * sigma).ceil() as i32;
    let mut k: Vec<f32> = (-radius..=radius)
        .map(|i| {
            let x = f64::from(i);
            #[allow(clippy::cast_possible_truncation)]
            let v = js_exp(-(x * x) / (2.0 * sigma * sigma)) as f32;
            v
        })
        .collect();
    let sum: f32 = k.iter().sum();
    for v in &mut k {
        *v /= sum;
    }
    k
}

fn blur_pass(src: &[f32], w: usize, h: usize, kernel: &[f32], horizontal: bool) -> Vec<f32> {
    // Kernel and texture sizes are small.
    #[allow(clippy::cast_possible_wrap)]
    let r = (kernel.len() / 2) as isize;
    let mut dst = vec![0.0f32; src.len()];
    for y in 0..h {
        for x in 0..w {
            let mut acc = 0.0f32;
            for (i, k) in kernel.iter().enumerate() {
                #[allow(clippy::cast_possible_wrap)]
                let o = i as isize - r;
                #[allow(clippy::cast_possible_wrap)]
                let (sx, sy) = if horizontal {
                    (x as isize + o, y as isize)
                } else {
                    (x as isize, y as isize + o)
                };
                #[allow(clippy::cast_sign_loss)]
                if sx >= 0 && sy >= 0 && (sx as usize) < w && (sy as usize) < h {
                    acc += k * src[sy as usize * w + sx as usize];
                }
            }
            dst[y * w + x] = acc;
        }
    }
    dst
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kernel_is_normalised_and_symmetric() {
        let k = gaussian_kernel(3.0);
        assert_eq!(k.len(), 19);
        let s: f32 = k.iter().sum();
        assert!((s - 1.0).abs() < 1e-6);
        assert_eq!(k[0], k[18]);
    }

    #[test]
    fn over_is_source_over() {
        let mut d = vec![0, 0, 255, 255];
        over(&mut d, &[128, 0, 0, 128]);
        assert_eq!(d, vec![128, 0, 127, 255]);
    }

    /// CSS Text Decoration 3 §4: the first `text-shadow` is painted on top.
    /// (The web's two layers are both black, so their order is invisible in
    /// the Chromium scenes — mutation M20 of `08-mutations.log`.)
    #[test]
    fn first_text_shadow_is_on_top() {
        use crate::labels::style::Shadow;
        let mut l = crate::labels::layout_r15a(7);
        let layer = |color| Shadow {
            offset_x: 4.0,
            offset_y: 0.0,
            blur: 0.0,
            color,
        };
        l.text_shadows = vec![layer("#ff0000"), layer("#0000ff")];
        let t = render_label(&l, 1.0, 1.0);
        let (mut red, mut blue) = (0usize, 0usize);
        for p in t.rgba.chunks_exact(4) {
            if p[3] == 255 && p[0] == 255 && p[2] == 0 {
                red += 1;
            }
            if p[3] == 255 && p[2] == 255 && p[0] == 0 {
                blue += 1;
            }
        }
        assert!(
            red > 10,
            "red (first layer) must cover the blue one: {red} / {blue}"
        );
        assert_eq!(blue, 0);
    }
}
