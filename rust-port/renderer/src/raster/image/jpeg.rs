//! JPEG → [`RasterImage`] (leader portraits, T10 / T14).
//!
//! Decoder: `zune-jpeg =0.5.15` with default features off (no x86/neon SIMD
//! paths; the crate is then compiled under its own `forbid(unsafe_code)`),
//! output colour space RGB. Chromium decodes with libjpeg-turbo; the two
//! differ by a few levels at most (IDCT rounding, chroma upsampling) —
//! measured against Chromium 141 in `tests/image_scenes.rs` (scene
//! `x_jpeg_portrait_1to1`, `P4-30-IMAGES.md` §5).

use zune_jpeg::zune_core::bytestream::ZCursor;
use zune_jpeg::zune_core::colorspace::ColorSpace;
use zune_jpeg::zune_core::options::DecoderOptions;
use zune_jpeg::JpegDecoder;

use super::{ImageError, RasterImage};

/// Decodes a JPEG file (baseline or progressive, any chroma subsampling
/// `zune-jpeg` supports) into an opaque [`RasterImage`].
///
/// # Errors
/// [`ImageError::Jpeg`] when the stream does not decode,
/// [`ImageError::InvalidSize`] for a zero-sized image.
pub fn decode_jpeg(bytes: &[u8]) -> Result<RasterImage, ImageError> {
    let options = DecoderOptions::default().jpeg_set_out_colorspace(ColorSpace::RGB);
    let mut dec = JpegDecoder::new_with_options(ZCursor::new(bytes), options);
    let rgb = dec
        .decode()
        .map_err(|e| ImageError::Jpeg(format!("{e:?}")))?;
    let info = dec.info().ok_or(ImageError::InvalidSize)?;
    let (w, h) = (u32::from(info.width), u32::from(info.height));
    if rgb.len() as u64 != u64::from(w) * u64::from(h) * 3 {
        return Err(ImageError::InvalidSize);
    }
    let mut rgba = Vec::with_capacity(rgb.len() / 3 * 4);
    for p in rgb.chunks_exact(3) {
        rgba.extend_from_slice(&[p[0], p[1], p[2], 255]);
    }
    RasterImage::from_straight_rgba8(w, h, &rgba).map_err(|_| ImageError::InvalidSize)
}
