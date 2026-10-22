//! CPU side of the texture upload: alpha conversion, texture description
//! per web producer (T1–T15), mip chain, byte accounting. The `wgpu` calls
//! live in [`super::gpu`] (feature `gpu`).
//!
//! How Three r169 uploads a `CanvasTexture` (three@0.169.0, read in
//! `build/three.module.js` and `src/`; P4-31 §5):
//! - `premultiplyAlpha = false` by default (`src/textures/Texture.js:61`),
//!   set as `UNPACK_PREMULTIPLY_ALPHA_WEBGL` (three.module.js:24887): the
//!   browser UN-premultiplies the canvas, the texture holds STRAIGHT alpha;
//! - `SRGBColorSpace` → internal format `SRGB8_ALPHA8`, otherwise `RGBA8`
//!   (three.module.js:24337); `NoColorSpace` is the `Texture` default
//!   (`src/textures/Texture.js:22`) — T1–T6 and T15 never set it;
//! - mipmaps are generated when `generateMipmaps && minFilter` is neither
//!   `Nearest` nor `Linear` (three.module.js:24241-24245); the default
//!   `minFilter` is `LinearMipmapLinearFilter` (`Texture.js:22`);
//! - sprite / mesh materials have `premultipliedAlpha = false`
//!   (`src/materials/Material.js:70`), so `NormalBlending` is
//!   `blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA)`
//!   (three.module.js:23288-23289).
//!
//! The Rust raster ([`crate::raster::Canvas2dLite`], tiny-skia) holds
//! PREMULTIPLIED RGBA8. [`AlphaMode::Straight`] follows the web's pipeline:
//! un-premultiply on the CPU (Chromium's conversion, measured: ≤ 1 LSB,
//! 48 632 / 48 960 channels = 99.33 % exact), mip on straight alpha (the web's dark fringes included),
//! straight-alpha blending. [`AlphaMode::Premultiplied`] keeps the raster
//! bytes and blends with `ONE, ONE_MINUS_SRC_ALPHA` — no conversion loss and
//! no fringes, but NOT the web's pixels; offered for later decisions, not
//! the default.

use super::mip::{round_half_even_u8, MipChain, MipSpace};

/// Alpha representation of an uploaded texture.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum AlphaMode {
    /// Straight alpha (web parity, Three `premultiplyAlpha = false`).
    Straight,
    /// Premultiplied alpha (raster bytes as they are).
    Premultiplied,
}

/// Texture format of the upload.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum TexFormat {
    /// `Rgba8UnormSrgb` (Three `SRGBColorSpace` → `SRGB8_ALPHA8`).
    Rgba8UnormSrgb,
    /// `Rgba8Unorm` (Three `NoColorSpace` → `RGBA8`).
    Rgba8Unorm,
}

impl TexFormat {
    /// Colour space of the mip filter for this format.
    #[must_use]
    pub const fn mip_space(self) -> MipSpace {
        match self {
            Self::Rgba8UnormSrgb => MipSpace::Srgb,
            Self::Rgba8Unorm => MipSpace::Linear,
        }
    }
}

/// Minification filter (magnification is always linear in the web).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum MinFilter {
    /// `LinearFilter`: one level, no mipmaps.
    Linear,
    /// `LinearMipmapLinearFilter`: full mip chain, trilinear sampling.
    LinearMipmapLinear,
}

/// Upload settings of one texture.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct UploadOptions {
    /// Format (colour space).
    pub format: TexFormat,
    /// Minification filter (decides the mip chain).
    pub min_filter: MinFilter,
    /// Alpha representation.
    pub alpha: AlphaMode,
}

/// The canvas-texture producers of the web map (P4-25 §2.1).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Producer {
    /// T1 🔥 revolt (`cities.ts:718`).
    T1,
    /// T2 ⚔ siege (`siegeMarker.ts:46`).
    T2,
    /// T3 ☠ starving chip (`units.ts:6298`).
    T3,
    /// T4 gold-deficit chip (`units.ts:6356`).
    T4,
    /// T5 stack badge `×N` (`units.ts:6386`).
    T5,
    /// T6 path turn label (`units.ts:6598`).
    T6,
    /// T7 stat-plate background (`unitStatPlate.ts:437-443`).
    T7,
    /// T8 power frame (`unitStatPlate.ts:573-575`).
    T8,
    /// T9 power digit (`unitStatPlate.ts:618-621`).
    T9,
    /// T10 owner emblem (`unitOwnerEmblem.ts:349-351`).
    T10,
    /// T11 upgrade badge (`unitUpgradeBadges.ts:324-327`).
    T11,
    /// T12 worker icon (`workerFieldOverlay.ts:104-106`).
    T12,
    /// T13 city-area label (`cityOkolicaOverlay.ts:210-212`).
    T13,
    /// T14 city map badge (`cityMapStatChip.ts:1076-1078`).
    T14,
    /// T15 battle group number (`battleScene.ts:18662`).
    T15,
}

impl Producer {
    /// Every producer, T1..T15.
    pub const ALL: [Self; 15] = [
        Self::T1,
        Self::T2,
        Self::T3,
        Self::T4,
        Self::T5,
        Self::T6,
        Self::T7,
        Self::T8,
        Self::T9,
        Self::T10,
        Self::T11,
        Self::T12,
        Self::T13,
        Self::T14,
        Self::T15,
    ];

    /// The web's texture settings (lines in the variant docs): explicit
    /// `minFilter`/`colorSpace` where the code sets them, the Three r169
    /// defaults (`LinearMipmapLinearFilter`, `NoColorSpace`) where it does
    /// not (T1–T6, T15). Alpha is straight everywhere (web parity).
    #[must_use]
    pub const fn options(self) -> UploadOptions {
        let (format, min_filter) = match self {
            Self::T1 | Self::T2 | Self::T3 | Self::T4 | Self::T5 | Self::T6 | Self::T15 => {
                (TexFormat::Rgba8Unorm, MinFilter::LinearMipmapLinear)
            }
            Self::T7 | Self::T9 | Self::T11 => {
                (TexFormat::Rgba8UnormSrgb, MinFilter::LinearMipmapLinear)
            }
            Self::T8 | Self::T10 | Self::T12 | Self::T13 | Self::T14 => {
                (TexFormat::Rgba8UnormSrgb, MinFilter::Linear)
            }
        };
        UploadOptions {
            format,
            min_filter,
            alpha: AlphaMode::Straight,
        }
    }
}

/// Un-premultiplies RGBA8 the way Chromium's canvas → WebGL upload does
/// (measured on a 256×64 canvas, P4-31 §5.2): `c' = round_half_even(c·255/a)`
/// in `f64`, clamped to 255; `a = 0` → `(0, 0, 0, 0)` (RGB zeroed even if
/// the input is not valid premultiplied data); alpha unchanged.
/// Of the 48 960 RGB channels with `a > 0`, 48 632 (99.33 %) are bit-exact,
/// the rest differ by 1 (`tests/atlas_mip.rs`; the exact Chromium/Skia
/// conversion is `NIE_ZMIERZONO`).
///
/// # Panics
/// If `premul.len()` is not a multiple of 4.
#[must_use]
pub fn unpremultiply(premul: &[u8]) -> Vec<u8> {
    assert_eq!(premul.len() % 4, 0, "RGBA8");
    let mut out = Vec::with_capacity(premul.len());
    for px in premul.chunks_exact(4) {
        let a = px[3];
        if a == 0 {
            out.extend_from_slice(&[0, 0, 0, 0]);
            continue;
        }
        let af = f64::from(a);
        for &c in &px[..3] {
            out.push(round_half_even_u8(f64::from(c) * 255.0 / af));
        }
        out.push(a);
    }
    out
}

/// Description of a texture ready for upload.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct TextureDesc {
    /// Width of level 0.
    pub width: u32,
    /// Height of level 0.
    pub height: u32,
    /// Number of mip levels (1 without mipmaps).
    pub mip_level_count: u32,
    /// Upload options.
    pub options: UploadOptions,
}

/// Texture data ready for upload: description + every level.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TextureData {
    /// Description.
    pub desc: TextureDesc,
    /// Level data (RGBA8 in the representation of `desc.options.alpha`).
    pub chain: MipChain,
}

impl TextureData {
    /// Bytes of all levels (the size declared to the asset registry).
    #[must_use]
    pub fn byte_len(&self) -> u64 {
        self.chain.byte_len()
    }
}

/// Prepares raster output (`width × height` PREMULTIPLIED RGBA8, e.g.
/// `Canvas2dLite::data()`) for upload with `options`: alpha conversion,
/// then the mip chain (from the converted level 0) when the filter needs
/// one.
///
/// # Panics
/// If `premul.len() != width·height·4` or a size is 0.
#[must_use]
pub fn prepare(premul: &[u8], width: u32, height: u32, options: UploadOptions) -> TextureData {
    assert!(width > 0 && height > 0, "empty texture");
    let level0 = match options.alpha {
        AlphaMode::Straight => unpremultiply(premul),
        AlphaMode::Premultiplied => premul.to_vec(),
    };
    let chain = match options.min_filter {
        MinFilter::Linear => MipChain::single(level0, width, height),
        MinFilter::LinearMipmapLinear => {
            MipChain::generate(level0, width, height, options.format.mip_space())
        }
    };
    TextureData {
        desc: TextureDesc {
            width,
            height,
            mip_level_count: u32::try_from(chain.levels.len()).unwrap_or(u32::MAX),
            options,
        },
        chain,
    }
}

/// Blend factor (subset used here; maps 1:1 onto `wgpu::BlendFactor`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum BlendFactor {
    /// `ONE`.
    One,
    /// `SRC_ALPHA`.
    SrcAlpha,
    /// `ONE_MINUS_SRC_ALPHA`.
    OneMinusSrcAlpha,
}

/// `(src, dst)` factors for colour and alpha (operation: add).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct BlendSpec {
    /// Colour `(src, dst)`.
    pub color: (BlendFactor, BlendFactor),
    /// Alpha `(src, dst)`.
    pub alpha: (BlendFactor, BlendFactor),
}

/// Blending of a transparent textured material (Three `NormalBlending`).
/// Straight: `SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA`
/// (three.module.js:23288-23289, `premultipliedAlpha = false`);
/// premultiplied: `ONE, ONE_MINUS_SRC_ALPHA` for both
/// (three.module.js:23262-23263).
#[must_use]
pub const fn blend_for(alpha: AlphaMode) -> BlendSpec {
    match alpha {
        AlphaMode::Straight => BlendSpec {
            color: (BlendFactor::SrcAlpha, BlendFactor::OneMinusSrcAlpha),
            alpha: (BlendFactor::One, BlendFactor::OneMinusSrcAlpha),
        },
        AlphaMode::Premultiplied => BlendSpec {
            color: (BlendFactor::One, BlendFactor::OneMinusSrcAlpha),
            alpha: (BlendFactor::One, BlendFactor::OneMinusSrcAlpha),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unpremultiply_edges() {
        assert_eq!(unpremultiply(&[0, 0, 0, 0]), vec![0, 0, 0, 0]);
        // `a = 0` zeroes RGB even for non-premultiplied input (doc contract;
        // round 2, zarzut 5): an "RGB kept" variant fails here.
        assert_eq!(unpremultiply(&[200, 100, 50, 0]), vec![0, 0, 0, 0]);
        assert_eq!(
            unpremultiply(&[255, 255, 255, 0, 7, 7, 7, 7]),
            vec![0, 0, 0, 0, 255, 255, 255, 7]
        );
        assert_eq!(unpremultiply(&[10, 20, 30, 255]), vec![10, 20, 30, 255]);
        assert_eq!(unpremultiply(&[1, 0, 0, 2]), vec![128, 0, 0, 2]); // 127.5 → even 128
        assert_eq!(unpremultiply(&[5, 0, 0, 6]), vec![212, 0, 0, 6]); // 212.5 → even 212
        assert_eq!(unpremultiply(&[9, 0, 0, 8]), vec![255, 0, 0, 8]); // clamp
    }

    #[test]
    fn presets() {
        assert_eq!(
            Producer::T9.options().min_filter,
            MinFilter::LinearMipmapLinear
        );
        assert_eq!(Producer::T14.options().min_filter, MinFilter::Linear);
        assert_eq!(Producer::T1.options().format, TexFormat::Rgba8Unorm);
        let d = prepare(&[0u8; 72 * 126 * 4], 72, 126, Producer::T9.options());
        assert_eq!(d.desc.mip_level_count, 7);
        let d = prepare(&[0u8; 30 * 20 * 4], 30, 20, Producer::T14.options());
        assert_eq!(d.desc.mip_level_count, 1);
        assert_eq!(d.chain.levels.len(), 1);
        // Table of P4-31 §5.1: explicit settings vs Three defaults.
        let mipped: Vec<Producer> = Producer::ALL
            .into_iter()
            .filter(|p| p.options().min_filter == MinFilter::LinearMipmapLinear)
            .collect();
        assert_eq!(
            mipped,
            [
                Producer::T1,
                Producer::T2,
                Producer::T3,
                Producer::T4,
                Producer::T5,
                Producer::T6,
                Producer::T7,
                Producer::T9,
                Producer::T11,
                Producer::T15
            ]
        );
        let linear_space: Vec<Producer> = Producer::ALL
            .into_iter()
            .filter(|p| p.options().format == TexFormat::Rgba8Unorm)
            .collect();
        assert_eq!(
            linear_space,
            [
                Producer::T1,
                Producer::T2,
                Producer::T3,
                Producer::T4,
                Producer::T5,
                Producer::T6,
                Producer::T15
            ]
        );
        assert!(Producer::ALL
            .iter()
            .all(|p| p.options().alpha == AlphaMode::Straight));
    }

    #[test]
    fn blend_matches_three_normal_blending() {
        let s = blend_for(AlphaMode::Straight);
        assert_eq!(
            s.color,
            (BlendFactor::SrcAlpha, BlendFactor::OneMinusSrcAlpha)
        );
        assert_eq!(s.alpha, (BlendFactor::One, BlendFactor::OneMinusSrcAlpha));
        let p = blend_for(AlphaMode::Premultiplied);
        assert_eq!(p.color, (BlendFactor::One, BlendFactor::OneMinusSrcAlpha));
        assert_eq!(p.alpha, (BlendFactor::One, BlendFactor::OneMinusSrcAlpha));
    }

    #[test]
    fn premultiplied_mode_keeps_raster_bytes() {
        let px = [10u8, 20, 30, 40, 0, 0, 0, 0];
        let d = prepare(
            &px,
            2,
            1,
            UploadOptions {
                format: TexFormat::Rgba8UnormSrgb,
                min_filter: MinFilter::Linear,
                alpha: AlphaMode::Premultiplied,
            },
        );
        assert_eq!(d.chain.levels[0], px);
        let s = prepare(&px, 2, 1, Producer::T14.options());
        assert_eq!(s.chain.levels[0], [64, 128, 191, 40, 0, 0, 0, 0]);
    }
}
