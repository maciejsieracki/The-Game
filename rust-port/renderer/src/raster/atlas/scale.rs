//! Texture density: screen DPI × camera LOD with the 2048 px ceiling
//! (T14 city badge, `cityMapStatChip.ts:147-185`, `:847-849`).
//!
//! The layout stays in CSS px; only the rasterisation density grows (the
//! canvas gets `round(W·scale) × round(H·scale)` device pixels and a
//! `setTransform(scale, 0, 0, scale, 0, 0)`), so the sprite keeps its world
//! size. The pure functions here are bit-exact ports (vectors:
//! `tests/atlas_keys.rs`); the LOD level itself comes from
//! [`crate::core::zoom_lod`] (`zoomLod.ts`, ported in P4-17 — reused, not
//! duplicated).

use crate::core::zoom_lod::city_badge_lod_texture_scale;
use crate::pick::hex::js_round;

/// `BADGE_MAX_DPR` (`cityMapStatChip.ts:147`): the DPI factor is capped at 3.
pub const BADGE_MAX_DPR: f64 = 3.0;

/// `BADGE_MAX_TOTAL_SCALE` (`cityMapStatChip.ts:173`): DPI × LOD is capped
/// at 4.
pub const BADGE_MAX_TOTAL_SCALE: f64 = 4.0;

/// The texture-size ceiling: `MAX_TEXTURE_SIZE = 2048`, the minimum WebGL2
/// guarantees (the web sizes its caps against it, `cityMapStatChip.ts:122-128`,
/// `:163-166`) and wgpu's `Limits::downlevel_defaults().max_texture_dimension_2d`.
pub const MAX_TEXTURE_SIZE: u32 = 2048;

/// The widest REACHABLE badge in CSS px (`cityMapStatChip.ts:124-128`,
/// `:156-161`: `CITY_NAME_BUDGET_BASE + 158 = 463`).
pub const BADGE_MAX_CSS_WIDTH: u32 = 463;

/// `badgePixelRatio()` (`cityMapStatChip.ts:149-152`): `devicePixelRatio`
/// when finite and > 0, else 1; then clamped to `[1, 3]`. `None` = no
/// `window` (`typeof window === 'undefined'`) → 1.
#[must_use]
pub fn badge_pixel_ratio(device_pixel_ratio: Option<f64>) -> f64 {
    let dpr = device_pixel_ratio.unwrap_or(1.0);
    let dpr = if dpr.is_finite() && dpr > 0.0 {
        dpr
    } else {
        1.0
    };
    // `dpr` is finite here, so `clamp` = `Math.min(Math.max(dpr, 1), 3)`.
    dpr.clamp(1.0, BADGE_MAX_DPR)
}

/// `badgeCanvasScale(lodLevel)` (`cityMapStatChip.ts:183-185`):
/// `min(badgePixelRatio() · cityBadgeLodTextureScale(lodLevel ?? 0), 4)`.
#[must_use]
pub fn badge_canvas_scale(device_pixel_ratio: Option<f64>, lod_level: Option<f64>) -> f64 {
    (badge_pixel_ratio(device_pixel_ratio) * city_badge_lod_texture_scale(lod_level.unwrap_or(0.0)))
        .min(BADGE_MAX_TOTAL_SCALE)
}

/// Device-pixel size of a canvas whose layout is `width_css × height_css`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CanvasPx {
    /// `canvas.width`.
    pub width: u32,
    /// `canvas.height`.
    pub height: u32,
    /// The context scale (`setTransform(scale, …)`).
    pub scale: f64,
    /// `true` when [`MAX_TEXTURE_SIZE`] forced a smaller scale than the
    /// web's (never for a reachable badge, see [`badge_canvas_px`]).
    pub clamped: bool,
}

/// `Math.round(v)` of a non-negative finite size → `u32` (saturating).
fn round_px(v: f64) -> u32 {
    let r = js_round(v);
    if r.is_nan() || r <= 0.0 {
        0
    } else if r >= f64::from(u32::MAX) {
        u32::MAX
    } else {
        // In range and integral: exact conversion.
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let px = r as u32;
        px
    }
}

/// Canvas size for a CSS layout under a scale, web formula
/// `canvas.width = Math.round(W · dpr)`, `canvas.height = Math.round(H · dpr)`
/// (`cityMapStatChip.ts:848-849`), followed by the [`MAX_TEXTURE_SIZE`]
/// guard (Rust only, ZAŁOŻENIE Z-31-2): when the larger side would exceed
/// `limit`, the scale is lowered to `limit / max(W, H)` (both sides keep
/// the same factor, so the sprite aspect is unchanged) and `clamped` is set.
#[must_use]
pub fn canvas_px_with_limit(width_css: f64, height_css: f64, scale: f64, limit: u32) -> CanvasPx {
    let w = round_px(width_css * scale);
    let h = round_px(height_css * scale);
    if w <= limit && h <= limit {
        return CanvasPx {
            width: w,
            height: h,
            scale,
            clamped: false,
        };
    }
    let fit = f64::from(limit) / width_css.max(height_css);
    let s = scale.min(fit);
    CanvasPx {
        width: round_px(width_css * s).min(limit),
        height: round_px(height_css * s).min(limit),
        scale: s,
        clamped: true,
    }
}

/// T14 canvas size: [`badge_canvas_scale`] then [`canvas_px_with_limit`]
/// with [`MAX_TEXTURE_SIZE`]. For every reachable badge
/// (`W ≤ 463`, `H ≤ 70` CSS px) the result equals the web's and `clamped`
/// is `false` (`463 · 4 = 1852 ≤ 2048`; test `atlas_scale`).
#[must_use]
pub fn badge_canvas_px(
    width_css: f64,
    height_css: f64,
    device_pixel_ratio: Option<f64>,
    lod_level: Option<f64>,
) -> CanvasPx {
    canvas_px_with_limit(
        width_css,
        height_css,
        badge_canvas_scale(device_pixel_ratio, lod_level),
        MAX_TEXTURE_SIZE,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn widest_badge_fits() {
        let px = badge_canvas_px(f64::from(BADGE_MAX_CSS_WIDTH), 70.0, Some(3.0), Some(2.0));
        assert_eq!((px.width, px.height, px.clamped), (1852, 280, false));
    }

    #[test]
    fn unreachable_badge_is_clamped() {
        let px = badge_canvas_px(1000.0, 48.0, Some(3.0), Some(2.0));
        assert!(px.clamped);
        assert_eq!(px.width, 2048);
        assert!(px.height <= 2048);
    }
}
