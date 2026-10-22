//! Visual-agreement metric between two RGBA8 images (RR-T8a; proposal for
//! the owner decision D-TXT-4, `P4-28-RASTER-SHAPES.md` §5).
//!
//! Bit-exact agreement with Chromium is impossible (different anti-aliasing
//! scan converters), so three numbers are reported per image pair, all on
//! **premultiplied** channels (a transparent pixel is `0,0,0,0` regardless of
//! its hidden colour):
//! - `max_abs` — largest absolute channel difference (0–255);
//! - `mean_abs` — mean absolute channel difference over all channels;
//! - `frac_px_over_16` — fraction of pixels with any channel differing by
//!   more than 16 (≈ 6 %): "visibly different" pixels;
//! - `ssim` — mean SSIM over the four channels, 7×7 uniform window, stride 1,
//!   constants `C1 = (0.01·255)²`, `C2 = (0.03·255)²` (Wang et al. 2004;
//!   window as in scikit-image's default).

/// Result of [`compare_premultiplied`].
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ImageDiff {
    /// Largest absolute channel difference.
    pub max_abs: u8,
    /// Mean absolute channel difference.
    pub mean_abs: f64,
    /// Fraction (0..=1) of pixels whose largest channel difference is > 16.
    pub frac_px_over_16: f64,
    /// Mean SSIM over the R, G, B, A planes (1.0 = identical).
    pub ssim: f64,
}

/// Converts straight RGBA8 (e.g. `getImageData`) to premultiplied RGBA8 with
/// round-to-nearest.
#[must_use]
pub fn premultiply_straight(straight: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(straight.len());
    for p in straight.chunks_exact(4) {
        let a = u32::from(p[3]);
        let m = |c: u8| ((u32::from(c) * a + 127) / 255) as u8;
        out.extend_from_slice(&[m(p[0]), m(p[1]), m(p[2]), p[3]]);
    }
    out
}

/// Compares two premultiplied RGBA8 images of `w × h` pixels.
///
/// # Panics
/// When a buffer is not `w × h × 4` bytes long.
#[must_use]
pub fn compare_premultiplied(a: &[u8], b: &[u8], w: usize, h: usize) -> ImageDiff {
    assert_eq!(a.len(), w * h * 4, "image a size");
    assert_eq!(b.len(), w * h * 4, "image b size");
    let mut max_abs = 0u8;
    let mut sum = 0u64;
    let mut over = 0usize;
    for (pa, pb) in a.chunks_exact(4).zip(b.chunks_exact(4)) {
        let mut px_max = 0u8;
        for c in 0..4 {
            let d = pa[c].abs_diff(pb[c]);
            sum += u64::from(d);
            px_max = px_max.max(d);
        }
        max_abs = max_abs.max(px_max);
        if px_max > 16 {
            over += 1;
        }
    }
    let n = (w * h) as f64;
    let ssim = (0..4).map(|c| ssim_plane(a, b, w, h, c)).sum::<f64>() / 4.0;
    ImageDiff {
        max_abs,
        mean_abs: sum as f64 / (n * 4.0),
        frac_px_over_16: over as f64 / n,
        ssim,
    }
}

fn ssim_plane(a: &[u8], b: &[u8], w: usize, h: usize, c: usize) -> f64 {
    const WIN: usize = 7;
    let c1 = (0.01f64 * 255.0) * (0.01 * 255.0);
    let c2 = (0.03f64 * 255.0) * (0.03 * 255.0);
    let (ww, wh) = (WIN.min(w), WIN.min(h));
    let mut total = 0.0;
    let mut count = 0usize;
    for y0 in 0..=(h - wh) {
        for x0 in 0..=(w - ww) {
            let (mut sa, mut sb, mut saa, mut sbb, mut sab) = (0.0, 0.0, 0.0, 0.0, 0.0);
            for y in y0..y0 + wh {
                for x in x0..x0 + ww {
                    let i = (y * w + x) * 4 + c;
                    let va = f64::from(a[i]);
                    let vb = f64::from(b[i]);
                    sa += va;
                    sb += vb;
                    saa += va * va;
                    sbb += vb * vb;
                    sab += va * vb;
                }
            }
            let np = (ww * wh) as f64;
            let (ma, mb) = (sa / np, sb / np);
            // Sample (co)variances, as scikit-image (`use_sample_covariance`).
            let k = if np > 1.0 { np / (np - 1.0) } else { 1.0 };
            let va = (saa / np - ma * ma) * k;
            let vb = (sbb / np - mb * mb) * k;
            let cov = (sab / np - ma * mb) * k;
            total += ((2.0 * ma * mb + c1) * (2.0 * cov + c2))
                / ((ma * ma + mb * mb + c1) * (va + vb + c2));
            count += 1;
        }
    }
    total / count as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identical_images() {
        let img: Vec<u8> = (0..8 * 8 * 4).map(|i| (i * 7 % 256) as u8).collect();
        let d = compare_premultiplied(&img, &img, 8, 8);
        assert_eq!(d.max_abs, 0);
        assert_eq!(d.mean_abs, 0.0);
        assert!((d.ssim - 1.0).abs() < 1e-12);
    }

    #[test]
    fn premultiply_rounds() {
        assert_eq!(
            premultiply_straight(&[255, 128, 0, 128]),
            vec![128, 64, 0, 128]
        );
    }
}
