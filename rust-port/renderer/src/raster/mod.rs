//! `raster` — CPU 2D rasteriser "mini-Canvas" (RR-T8a,
//! `R-RUSTPORT-P4-28-RASTER-SHAPES-Q1`, owner decision D-TXT-6 = A).
//!
//! [`Canvas2dLite`] is a drawing context over an RGBA8 buffer that mirrors the
//! subset of `CanvasRenderingContext2D` the web map code actually calls for
//! **shapes** (inventory: `P4-25-TEXT-RASTER-AUDIT.md` §4.1, re-measured in
//! `P4-28-RASTER-SHAPES.md` §2). Text (`font`, `fillText`, `measureText`, …)
//! is RR-T8b; image decoding (SVG/JPG/emoji) is RR-T8c — here
//! [`Canvas2dLite::draw_image`] only composites an already decoded
//! [`RasterImage`].
//!
//! Members the web does NOT use are not implemented on purpose (e.g.
//! `globalAlpha`, `globalCompositeOperation`, `setLineDash`, `bezierCurveTo`,
//! `ellipse`, `createRadialGradient`, `createPattern`, `scale`, `lineCap`,
//! `miterLimit`, `shadowOffsetX`, `getImageData`); the closed list is guarded
//! by `tests/raster_api_closed.rs`.
//!
//! Backend: `tiny-skia` 0.12.0 (premultiplied RGBA8, sRGB-encoded values
//! blended as-is, like a Chromium 2D canvas). The output is deterministic for
//! a given build of this crate (golden hashes in `tests/raster_scenes.rs`).

mod canvas;
mod color;
pub mod image;
pub mod metric;
mod path;
mod shadow;
pub mod text;

pub use canvas::{Canvas2dLite, CanvasGradient, LineJoin, RasterError, RasterImage};
pub use color::{parse_css_color, CssColor};

/// A 2D affine transform in Canvas notation `(a, b, c, d, e, f)`:
/// `x' = a·x + c·y + e`, `y' = b·x + d·y + f`.
///
/// Kept in `f64` like the JS numbers the web passes; points are rounded to
/// `f32` only when they enter the path.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Affine {
    /// Horizontal scale.
    pub a: f64,
    /// Vertical skew.
    pub b: f64,
    /// Horizontal skew.
    pub c: f64,
    /// Vertical scale.
    pub d: f64,
    /// Horizontal translation.
    pub e: f64,
    /// Vertical translation.
    pub f: f64,
}

impl Affine {
    /// The identity transform.
    pub const IDENTITY: Affine = Affine {
        a: 1.0,
        b: 0.0,
        c: 0.0,
        d: 1.0,
        e: 0.0,
        f: 0.0,
    };

    /// `self × other` (apply `other` first, then `self`).
    #[must_use]
    pub fn then_local(&self, o: &Affine) -> Affine {
        Affine {
            a: self.a * o.a + self.c * o.b,
            b: self.b * o.a + self.d * o.b,
            c: self.a * o.c + self.c * o.d,
            d: self.b * o.c + self.d * o.d,
            e: self.a * o.e + self.c * o.f + self.e,
            f: self.b * o.e + self.d * o.f + self.f,
        }
    }

    /// The inverse, or `None` when the matrix is singular or not finite.
    #[must_use]
    pub fn invert(&self) -> Option<Affine> {
        let det = self.a * self.d - self.b * self.c;
        if det == 0.0 || !det.is_finite() {
            return None;
        }
        let inv = 1.0 / det;
        Some(Affine {
            a: self.d * inv,
            b: -self.b * inv,
            c: -self.c * inv,
            d: self.a * inv,
            e: (self.c * self.f - self.d * self.e) * inv,
            f: (self.b * self.e - self.a * self.f) * inv,
        })
    }

    pub(crate) fn map(&self, x: f64, y: f64) -> path::Pt {
        path::Pt {
            x: (self.a * x + self.c * y + self.e) as f32,
            y: (self.b * x + self.d * y + self.f) as f32,
        }
    }

    pub(crate) fn to_skia(self) -> tiny_skia::Transform {
        tiny_skia::Transform::from_row(
            self.a as f32,
            self.b as f32,
            self.c as f32,
            self.d as f32,
            self.e as f32,
            self.f as f32,
        )
    }

    pub(crate) fn is_axis_aligned(&self) -> bool {
        self.b == 0.0 && self.c == 0.0
    }
}

/// FNV-1a 64-bit over a byte slice — the golden-hash function of
/// `tests/raster_scenes.rs` (same family as the P4-25 spike `rgba_fnv64`).
#[must_use]
pub fn fnv1a64(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in bytes {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    h
}
