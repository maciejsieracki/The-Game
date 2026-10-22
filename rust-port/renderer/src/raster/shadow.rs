//! Canvas 2D shadows (`shadowColor`, `shadowBlur`, `shadowOffsetY`).
//!
//! The web sets shadows only around the yield numbers of the city-surroundings
//! overlay (`cityOkolicaOverlay.ts:175-180`, under `fillText`), but Canvas
//! applies the shadow state to every drawing operation, so RR-T8a implements
//! it for shapes and RR-T8b reuses it for text (P4-25 §6, RR-T8a scope).
//!
//! Algorithm (HTML Canvas "shadows"): take the alpha of the rendered source,
//! offset it, blur it with a Gaussian of σ = `shadowBlur / 2`, colour it with
//! `shadowColor` and composite it (source-over, inside the clip) *below* the
//! source. Chromium/Skia uses a different blur kernel internally; the
//! measured difference is reported in `P4-28-RASTER-SHAPES.md` §5.

use super::CssColor;
use crate::jsmath::js_exp;

/// Blurs the alpha channel of `layer` (premultiplied RGBA8, row-major) and
/// returns a premultiplied RGBA8 buffer of the same size filled with `color`
/// modulated by the blurred alpha.
pub(crate) fn shadow_from_layer(
    layer: &[u8],
    w: usize,
    h: usize,
    color: CssColor,
    blur: f64,
) -> Vec<u8> {
    let mut alpha: Vec<f32> = layer
        .chunks_exact(4)
        .map(|p| f32::from(p[3]) / 255.0)
        .collect();
    let sigma = (blur / 2.0) as f32;
    if sigma > 0.0 {
        let kernel = gaussian_kernel(sigma);
        alpha = blur_pass(&alpha, w, h, &kernel, true);
        alpha = blur_pass(&alpha, w, h, &kernel, false);
    }
    let (cr, cg, cb, ca) = (color.r, color.g, color.b, color.a);
    let mut out = vec![0u8; w * h * 4];
    for (o, a) in out.chunks_exact_mut(4).zip(alpha) {
        let aa = (a * ca).clamp(0.0, 1.0);
        let q = |v: f32| (v * aa * 255.0 + 0.5) as u8;
        o[0] = q(cr);
        o[1] = q(cg);
        o[2] = q(cb);
        o[3] = (aa * 255.0 + 0.5) as u8;
    }
    out
}

fn gaussian_kernel(sigma: f32) -> Vec<f32> {
    let radius = (3.0 * sigma).ceil() as i32;
    let mut k: Vec<f32> = (-radius..=radius)
        .map(|i| {
            let x = i as f32;
            js_exp(f64::from(-(x * x) / (2.0 * sigma * sigma))) as f32
        })
        .collect();
    let sum: f32 = k.iter().sum();
    for v in &mut k {
        *v /= sum;
    }
    k
}

fn blur_pass(src: &[f32], w: usize, h: usize, kernel: &[f32], horizontal: bool) -> Vec<f32> {
    let r = (kernel.len() / 2) as isize;
    let mut dst = vec![0.0f32; src.len()];
    for y in 0..h {
        for x in 0..w {
            let mut acc = 0.0f32;
            for (i, k) in kernel.iter().enumerate() {
                let o = i as isize - r;
                let (sx, sy) = if horizontal {
                    (x as isize + o, y as isize)
                } else {
                    (x as isize, y as isize + o)
                };
                // Outside the canvas the source is transparent.
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
        let k = gaussian_kernel(1.5);
        assert_eq!(k.len(), 11);
        let s: f32 = k.iter().sum();
        assert!((s - 1.0).abs() < 1e-6);
        assert_eq!(k[0], k[10]);
    }
}
