//! CPU mip chains for the textures the web uploads with
//! `generateMipmaps = true` (T7, T9, T11 explicitly; T1–T6 and T15 by the
//! Three r169 defaults, P4-31 §4).
//!
//! wgpu has no `generateMipmap`, so the levels are built here and uploaded
//! as data. The filter reproduces what WebGL2 `generateMipmap` produced in
//! the only GL measurable in the container — Chromium 141 → ANGLE → Vulkan
//! → SwiftShader (`tests/fixtures/atlas/atlas_gl.json`, P4-31 §4.2):
//!
//! - every level is computed from the PREVIOUS level (not from level 0);
//! - each output texel samples the previous level bilinearly at its centre,
//!   `(i + ½)·W/w − ½` (clamped to the edge) — for an even size this is
//!   exactly the 2×2 box average, for an odd size it is the blit-style
//!   resample (a plain 2×2 box with a dropped row/column is off by up to
//!   128 there);
//! - [`MipSpace::Linear`] (RGBA8 / `NoColorSpace`): filtered on the stored
//!   bytes, rounded half to EVEN — bit-exact on every even level measured
//!   (119 232 texels), ≤ 1 LSB on odd ones (99.54 % exact);
//! - [`MipSpace::Srgb`] (`SRGB8_ALPHA8`): RGB decoded to linear light,
//!   filtered, re-encoded and rounded half UP; alpha filtered linearly —
//!   ≤ 1 LSB (99.40 % / 99.82 % exact, even / odd).
//!
//! The filter of the owner's GL (ANGLE → D3D11 on Windows) and of other
//! drivers is NOT measured (`NIE_ZMIERZONO`); GL leaves it
//! implementation-defined. Arithmetic is `f64` with the crate's `jsmath`
//! power function (no platform `libm`, `tests/jsmath_wiring.rs`).

use crate::jsmath::js_pow;

/// Colour space the mip filter averages in.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum MipSpace {
    /// Stored bytes averaged as they are (RGBA8, Three `NoColorSpace`).
    Linear,
    /// RGB averaged in linear light (sRGB texture, Three `SRGBColorSpace`).
    Srgb,
}

/// Number of levels of a full chain: `floor(log2(max(w, h))) + 1` — the
/// count Three allocates (`Math.log2(Math.max(w, h)) + 1`,
/// three.module.js:24401, truncated by WebGL to an integer) and the full
/// WebGPU chain. 0 for an empty size.
#[must_use]
pub fn mip_level_count(width: u32, height: u32) -> u32 {
    let m = width.max(height);
    if m == 0 {
        0
    } else {
        32 - m.leading_zeros()
    }
}

/// Size of level `level`: `max(1, size >> level)` per axis.
#[must_use]
pub fn mip_size(width: u32, height: u32, level: u32) -> (u32, u32) {
    let sh = |v: u32| if level >= 32 { 1 } else { (v >> level).max(1) };
    (sh(width), sh(height))
}

/// sRGB transfer → linear light (exact IEC 61966-2-1 formula).
#[must_use]
pub fn srgb_to_linear(v: u8) -> f64 {
    let c = f64::from(v) / 255.0;
    if c <= 0.040_45 {
        c / 12.92
    } else {
        js_pow((c + 0.055) / 1.055, 2.4)
    }
}

/// Linear light → sRGB transfer, scaled to `[0, 255]` (not rounded).
#[must_use]
pub fn linear_to_srgb_unit(v: f64) -> f64 {
    let v = v.clamp(0.0, 1.0);
    let s = if v <= 0.003_130_8 {
        v * 12.92
    } else {
        1.055 * js_pow(v, 1.0 / 2.4) - 0.055
    };
    s * 255.0
}

/// Round half to even, clamped to a byte.
#[must_use]
pub fn round_half_even_u8(v: f64) -> u8 {
    let f = v.floor();
    let d = v - f;
    let r = if d > 0.5 || (d == 0.5 && (f * 0.5).fract() != 0.0) {
        f + 1.0
    } else {
        f
    };
    clamp_u8(r)
}

/// Round half up (`floor(v + ½)` on the exact difference), clamped to a byte.
#[must_use]
pub fn round_half_up_u8(v: f64) -> u8 {
    let f = v.floor();
    clamp_u8(if v - f >= 0.5 { f + 1.0 } else { f })
}

fn clamp_u8(r: f64) -> u8 {
    if r.is_nan() || r <= 0.0 {
        0
    } else if r >= 255.0 {
        255
    } else {
        // Integral and in range.
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let b = r as u8;
        b
    }
}

/// Bilinear tap positions for one axis: for every output index the two
/// source indices and the weight of the second one. Single precision like
/// the GPU blit: `ratio = f32(src) / f32(dst)`, `p = (i + ½)·ratio − ½`.
fn taps(src: u32, dst: u32) -> Vec<(usize, usize, f32)> {
    // Mip sizes are far below 2^24: exact in f32.
    #[allow(clippy::cast_precision_loss)]
    let ratio = src as f32 / dst as f32;
    let last = src as usize - 1;
    (0..dst)
        .map(|i| {
            #[allow(clippy::cast_precision_loss)]
            let p = (i as f32 + 0.5) * ratio - 0.5;
            let f = p.floor();
            let t = p - f;
            let clamp = |v: f32| -> usize {
                if v <= 0.0 {
                    0
                } else {
                    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
                    let u = v as usize;
                    u.min(last)
                }
            };
            (clamp(f), clamp(f + 1.0), t)
        })
        .collect()
}

/// One mip step: `src` (`sw × sh` RGBA8, rows top → bottom) resampled to
/// `dw × dh` with the measured GL filter (module docs).
///
/// # Panics
/// If `src.len() != sw·sh·4` or a size is 0.
#[must_use]
pub fn downsample(src: &[u8], sw: u32, sh: u32, dw: u32, dh: u32, space: MipSpace) -> Vec<u8> {
    assert!(sw > 0 && sh > 0 && dw > 0 && dh > 0, "empty mip size");
    assert_eq!(src.len(), sw as usize * sh as usize * 4, "RGBA8 size");
    #[allow(clippy::cast_possible_truncation)] // the GPU works in f32
    let lut: Vec<f32> = (0..=255u8).map(|v| srgb_to_linear(v) as f32).collect();
    let tx = taps(sw, dw);
    let ty = taps(sh, dh);
    let sw = sw as usize;
    let at = |x: usize, y: usize, c: usize| -> f32 {
        let b = src[(y * sw + x) * 4 + c];
        if space == MipSpace::Srgb && c < 3 {
            lut[usize::from(b)]
        } else {
            f32::from(b)
        }
    };
    let mut out = Vec::with_capacity(dw as usize * dh as usize * 4);
    for &(y0, y1, wy) in &ty {
        for &(x0, x1, wx) in &tx {
            for c in 0..4 {
                let top = at(x0, y0, c) * (1.0 - wx) + at(x1, y0, c) * wx;
                let bot = at(x0, y1, c) * (1.0 - wx) + at(x1, y1, c) * wx;
                let v = f64::from(top * (1.0 - wy) + bot * wy);
                out.push(match (space, c < 3) {
                    (MipSpace::Srgb, true) => round_half_up_u8(linear_to_srgb_unit(v)),
                    (MipSpace::Srgb, false) => round_half_up_u8(v),
                    (MipSpace::Linear, _) => round_half_even_u8(v),
                });
            }
        }
    }
    out
}

/// A full mip chain (level 0 first), RGBA8 straight alpha.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MipChain {
    /// Width of level 0.
    pub width: u32,
    /// Height of level 0.
    pub height: u32,
    /// Level data, `mip_size(width, height, i)` each.
    pub levels: Vec<Vec<u8>>,
}

impl MipChain {
    /// A chain with only level 0 (`LinearFilter`, no mipmaps).
    ///
    /// # Panics
    /// If `level0.len() != width·height·4`.
    #[must_use]
    pub fn single(level0: Vec<u8>, width: u32, height: u32) -> Self {
        assert_eq!(
            level0.len(),
            width as usize * height as usize * 4,
            "RGBA8 size"
        );
        Self {
            width,
            height,
            levels: vec![level0],
        }
    }

    /// Level 0 plus every level down to 1×1, each from the previous one.
    ///
    /// # Panics
    /// If a size is 0 or `level0.len() != width·height·4`.
    #[must_use]
    pub fn generate(level0: Vec<u8>, width: u32, height: u32, space: MipSpace) -> Self {
        let mut chain = Self::single(level0, width, height);
        for l in 1..mip_level_count(width, height) {
            let (pw, ph) = mip_size(width, height, l - 1);
            let (w, h) = mip_size(width, height, l);
            let next = downsample(&chain.levels[(l - 1) as usize], pw, ph, w, h, space);
            chain.levels.push(next);
        }
        chain
    }

    /// Total bytes of all levels.
    #[must_use]
    pub fn byte_len(&self) -> u64 {
        self.levels.iter().map(|l| l.len() as u64).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn level_counts() {
        assert_eq!(mip_level_count(512, 168), 10); // T7
        assert_eq!(mip_level_count(72, 126), 7); // T9
        assert_eq!(mip_level_count(128, 128), 8); // T11
        assert_eq!(mip_level_count(1, 1), 1);
        assert_eq!(mip_level_count(0, 0), 0);
        assert_eq!(mip_size(72, 126, 6), (1, 1));
        assert_eq!(mip_size(72, 126, 2), (18, 31));
    }

    #[test]
    fn rounding() {
        assert_eq!(round_half_even_u8(2.5), 2);
        assert_eq!(round_half_even_u8(3.5), 4);
        assert_eq!(round_half_up_u8(2.5), 3);
        assert_eq!(round_half_even_u8(-1.0), 0);
        assert_eq!(round_half_even_u8(300.0), 255);
    }

    #[test]
    fn srgb_roundtrip() {
        for v in 0..=255u8 {
            assert_eq!(round_half_up_u8(linear_to_srgb_unit(srgb_to_linear(v))), v);
        }
    }
}
