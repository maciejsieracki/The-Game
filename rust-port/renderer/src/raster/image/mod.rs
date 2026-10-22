//! `raster::image` — images on [`Canvas2dLite`] (RR-T8c,
//! `R-RUSTPORT-P4-30-IMAGES-Q1`; plan `P4-25-TEXT-RASTER-AUDIT.md` §6, row
//! RR-T8c; owner decisions D-TXT-3 = C, D-TXT-6 = A).
//!
//! What the web map code draws with `ctx.drawImage` / emoji `fillText`
//! (P4-25 §2.1, T1–T3, T10–T14), ported on top of the RR-T8a rasteriser and
//! the RR-T8b text engine:
//!
//! - [`jpeg`]: leader portraits (baseline JPEG 256×256, `gra/src/assets/
//!   portrety/*.jpg`) decoded with `zune-jpeg` (scalar, no SIMD) into a
//!   [`RasterImage`] for [`Canvas2dLite::draw_image`] (bilinear, clip-aware;
//!   T10 `unitOwnerEmblem.ts:283-297`, T14 `cityMapStatChip.ts:555-572`);
//! - [`svg`]: brand-book icons — the port of `prepareSvgForCanvas`
//!   (`render/unitOwnerEmblem.ts:224-229`: `currentColor` → stroke colour,
//!   `stroke-width` × boost with JS `toFixed(2)`) and rasterisation through
//!   `resvg`/`usvg` **at device resolution** under the current transform and
//!   clip (T10 sigils, T11 `unitUpgradeBadges.ts:295-298`, T14 medallion and
//!   production icon);
//! - [`emoji`]: colour emoji and symbols (⚔ ☠ ◆ 👤 🔥 🍞 🔨 💰 + the 16 R4
//!   icons, P4-25 §3.3) — a bundled 23-glyph subset of Noto Color Emoji
//!   (CBDT/PNG bitmaps), a browser-like per-character fallback over the
//!   RR-T8b faces + the emoji face, and the Chromium rules for colour glyphs
//!   measured in `P4-30-IMAGES.md` §4 (advance from the bitmap metrics,
//!   origin quantised to 1/4 px horizontally and whole px vertically, RGB of
//!   `fillStyle` ignored, its alpha applied).
//!
//! `#![forbid(unsafe_code)]` of the crate applies here as everywhere.

pub mod emoji;
pub mod jpeg;
pub mod mip;
pub mod svg;

pub use super::RasterImage;

/// Errors of the image decoders.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ImageError {
    /// The JPEG stream could not be decoded (message from `zune-jpeg`).
    Jpeg(String),
    /// The SVG document could not be parsed (message from `usvg`).
    Svg(String),
    /// The decoded image has a zero or unsupported size.
    InvalidSize,
}

impl std::fmt::Display for ImageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ImageError::Jpeg(m) => write!(f, "JPEG: {m}"),
            ImageError::Svg(m) => write!(f, "SVG: {m}"),
            ImageError::InvalidSize => f.write_str("invalid image size"),
        }
    }
}

impl std::error::Error for ImageError {}
