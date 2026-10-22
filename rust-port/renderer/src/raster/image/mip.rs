//! Down-scaling of bitmaps the way Chromium 141's software canvas does it
//! (measured, `P4-30-IMAGES.md` §4.3 and §5.2): a box-filtered mip chain
//! (each level = 2×2 average of the previous one), the level
//! `floor(log2(1 / scale))` — the smallest level that is still at least as
//! large as the destination — then bilinear sampling to the destination.
//! Plain bilinear from full size (RR-T8a `draw_image`) aliases at the
//! scales the web uses (portraits 256 → 29…116 px, emoji 109 ppem → 13…48 px).

use resvg::tiny_skia::Pixmap;

use super::RasterImage;
use crate::raster::Canvas2dLite;

/// Mip level for a down-scale factor `scale` (destination / source pixels;
/// ≥ 1 or non-finite → level 0): `floor(log2(1 / scale))`.
#[must_use]
pub fn mip_level(scale: f64) -> u32 {
    if !(scale.is_finite() && scale > 0.0) || scale >= 1.0 {
        return 0;
    }
    // floor(log2(1/scale)) by exact doublings (no platform `log2`, crate
    // rule `tests/jsmath_wiring.rs`); clamp: 1×1 is reached long before 30.
    let mut s = scale;
    let mut level = 0;
    while s <= 0.5 && level < 30 {
        s *= 2.0;
        level += 1;
    }
    level
}

/// Length of the column `(x, y)` of a linear map, `sqrt(x² + y²)` (no
/// platform `hypot`, crate rule `tests/jsmath_wiring.rs`).
#[must_use]
pub fn axis_scale(x: f64, y: f64) -> f64 {
    (x * x + y * y).sqrt()
}

/// One mip step: 2×2 box average of premultiplied RGBA8 with round-half-up
/// (`(a + b + c + d + 2) >> 2`). An odd last row/column is dropped (the
/// web's images have even sizes down to the levels used: 136×128 emoji
/// strike → 17×16, 256×256 portraits → 16×16).
#[must_use]
pub fn half(p: &Pixmap) -> Pixmap {
    let (w, h) = ((p.width() / 2).max(1), (p.height() / 2).max(1));
    let mut out = Pixmap::new(w, h).expect("non-zero mip size");
    let sw = p.width() as usize;
    let sh = p.height() as usize;
    let d = p.data();
    let o = out.data_mut();
    for y in 0..h as usize {
        for x in 0..w as usize {
            let (x0, y0) = ((2 * x).min(sw - 1), (2 * y).min(sh - 1));
            let (x1, y1) = ((2 * x + 1).min(sw - 1), (2 * y + 1).min(sh - 1));
            for c in 0..4 {
                let at = |xx: usize, yy: usize| u32::from(d[(yy * sw + xx) * 4 + c]);
                let v = at(x0, y0) + at(x1, y0) + at(x0, y1) + at(x1, y1);
                o[(y * w as usize + x) * 4 + c] = ((v + 2) >> 2) as u8;
            }
        }
    }
    out
}

/// `p` halved `level` times.
#[must_use]
pub fn level_of(p: &Pixmap, level: u32) -> Pixmap {
    let mut cur = p.clone();
    for _ in 0..level {
        if cur.width() == 1 && cur.height() == 1 {
            break;
        }
        cur = half(&cur);
    }
    cur
}

/// A bitmap with its box-filtered mip chain (level 0 = the image itself),
/// for `ctx.drawImage(bitmap, dx, dy, dw, dh)` at any scale.
#[derive(Clone, Debug)]
pub struct MippedImage {
    levels: Vec<RasterImage>,
}

impl MippedImage {
    /// Builds every level down to 1×1.
    #[must_use]
    pub fn new(image: RasterImage) -> Self {
        let mut levels = vec![image];
        loop {
            let last = levels.last().expect("level 0").pixmap();
            if last.width() == 1 && last.height() == 1 {
                break;
            }
            let next = half(last);
            levels.push(RasterImage::from_pixmap(next));
        }
        MippedImage { levels }
    }

    /// Level 0 (the full-size image).
    #[must_use]
    pub fn image(&self) -> &RasterImage {
        &self.levels[0]
    }

    /// Width of level 0 (`img.width`).
    #[must_use]
    pub fn width(&self) -> u32 {
        self.levels[0].width()
    }

    /// Height of level 0 (`img.height`).
    #[must_use]
    pub fn height(&self) -> u32 {
        self.levels[0].height()
    }

    /// Number of levels.
    #[must_use]
    pub fn level_count(&self) -> usize {
        self.levels.len()
    }
}

/// `ctx.drawImage(img, dx, dy, dw, dh)` for a decoded bitmap (JPG
/// portraits): the mip level for the device scale (CTM × destination box /
/// image size, larger axis), then [`Canvas2dLite::draw_image`] (bilinear,
/// non-anti-aliased destination edges, clip) with that level stretched over
/// the same destination box.
pub fn draw_bitmap(ctx: &mut Canvas2dLite, img: &MippedImage, dx: f64, dy: f64, dw: f64, dh: f64) {
    let ctm = ctx.ctm();
    let sx = (dw / f64::from(img.width())).abs() * axis_scale(ctm.a, ctm.b);
    let sy = (dh / f64::from(img.height())).abs() * axis_scale(ctm.c, ctm.d);
    let level = (mip_level(sx.max(sy)) as usize).min(img.levels.len() - 1);
    ctx.draw_image(&img.levels[level], dx, dy, dw, dh);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn levels() {
        assert_eq!(mip_level(1.0), 0);
        assert_eq!(mip_level(2.0), 0);
        assert_eq!(mip_level(0.6), 0);
        assert_eq!(mip_level(0.5), 1);
        assert_eq!(mip_level(0.375), 1); // 256 → 96 (T10 portrait)
        assert_eq!(mip_level(29.0 / 256.0), 3); // T14 ×1 medallion
        assert_eq!(mip_level(48.0 / 109.0), 1); // T1 🔥 48 px
        assert_eq!(mip_level(16.0 / 109.0), 2); // T12 👤 16 px
        assert_eq!(mip_level(f64::NAN), 0);
        assert_eq!(mip_level(0.0), 0);
        assert_eq!(mip_level(0.25), 2);
        assert_eq!(mip_level(0.2500001), 1);
        assert_eq!(mip_level(1e-300), 30);
    }

    #[test]
    fn half_averages_with_rounding() {
        let mut p = Pixmap::new(2, 2).expect("2x2");
        p.data_mut()
            .copy_from_slice(&[1, 0, 0, 255, 2, 0, 0, 255, 2, 0, 0, 255, 2, 0, 0, 255]);
        let h = half(&p);
        assert_eq!((h.width(), h.height()), (1, 1));
        assert_eq!(h.data(), &[2, 0, 0, 255]); // (7 + 2) >> 2 = 2
    }
}
