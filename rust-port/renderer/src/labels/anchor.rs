//! World anchor → screen position of the labels, and the shared "float
//! label" mechanism of R15a/R15b — ports of the web's per-frame code:
//!
//! - [`world_to_client_px`] — `input/picker.ts:101-117` (R4);
//! - [`siege_label_position`] — `main.ts:14582-14603` `updateSiegeHtmlLabels` (R5);
//! - [`battle_world_to_screen`] — `battle/battleScene.ts:19419-19432` (R15);
//! - [`FloatLabel::frame`] — `battle/battleScene.ts:8624-8642` `_tickFloatLabels`;
//! - [`anchored_rect`] — where Chromium puts the label box for a CSS
//!   `left/top` and the label's `transform` (none / `translate(-50%,-100%)` /
//!   `translate(-50%,-50%)`).
//!
//! `Vector3.project(camera)` (Three r169) is
//! `applyMatrix4(matrixWorldInverse).applyMatrix4(projectionMatrix)` with
//! `matrixWorldInverse = matrixWorld.invert()`; the matrices come from the
//! caller (any perspective camera, e.g. [`crate::pick::camera::CameraMatrices`]).
//! All arithmetic is in `f64` in the web's operation order (bit-exact vs
//! three@0.169.0, `tests/labels_anchors.rs`).

use crate::pick::three::{js_min, Mat4, Vec3};

use super::layout::{lu_px, lu_trunc, Lu};
use super::style::{FLOAT_DURATION_MS, FLOAT_RISE_RATE, R4_OFFSET};

/// A camera as the projection needs it.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ProjectionCamera {
    /// `camera.matrixWorld`.
    pub world: Mat4,
    /// `camera.projectionMatrix`.
    pub projection: Mat4,
}

impl ProjectionCamera {
    /// From the picking camera matrices.
    #[must_use]
    pub fn from_matrices(m: &crate::pick::camera::CameraMatrices) -> Self {
        ProjectionCamera {
            world: m.world,
            projection: m.projection,
        }
    }

    /// `new Vector3(x, y, z).project(camera)` → NDC (x, y, z).
    #[must_use]
    pub fn project(&self, p: Vec3) -> Vec3 {
        p.apply_matrix4(&self.world.invert())
            .apply_matrix4(&self.projection)
    }
}

/// `canvas.getBoundingClientRect()` / client size of the map canvas.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ScreenRect {
    /// `rect.left`.
    pub left: f64,
    /// `rect.top`.
    pub top: f64,
    /// `rect.width` (= `clientWidth` for the battle / siege variants).
    pub width: f64,
    /// `rect.height`.
    pub height: f64,
}

/// `worldToClientPx` (`input/picker.ts:101-117`): `None` behind the far
/// plane (`v.z > 1`) or for an empty rect.
#[must_use]
pub fn world_to_client_px(
    p: Vec3,
    cam: &ProjectionCamera,
    rect: &ScreenRect,
) -> Option<(f64, f64)> {
    let v = cam.project(p);
    if v.z > 1.0 {
        return None;
    }
    if rect.width <= 0.0 || rect.height <= 0.0 {
        return None;
    }
    Some((
        rect.left + (v.x * 0.5 + 0.5) * rect.width,
        rect.top + (-v.y * 0.5 + 0.5) * rect.height,
    ))
}

/// JavaScript `Math.round` (ties toward +∞).
#[must_use]
pub fn js_round(x: f64) -> f64 {
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// R4 placement: `left = Math.round(pos.x + 14)`, `top = Math.round(pos.y − 40)`
/// (`main.ts:12967-12968`), CSS px; no transform.
#[must_use]
pub fn build_chip_left_top(pos: (f64, f64)) -> (f64, f64) {
    (js_round(pos.0 + R4_OFFSET.0), js_round(pos.1 + R4_OFFSET.1))
}

/// R5 `updateSiegeHtmlLabels` for one anchor: `None` = `display: none`
/// (`wp.z > 1`), else `(left, top)` = `Math.round` of the client position.
/// `client_w`/`client_h` = `canvas.clientWidth || window.innerWidth` etc.
#[must_use]
pub fn siege_label_position(
    p: Vec3,
    cam: &ProjectionCamera,
    client_w: f64,
    client_h: f64,
) -> Option<(f64, f64)> {
    let wp = cam.project(p);
    if wp.z > 1.0 {
        return None;
    }
    let px = (wp.x * 0.5 + 0.5) * client_w;
    let py = (-wp.y * 0.5 + 0.5) * client_h;
    Some((js_round(px), js_round(py)))
}

/// Battle `worldToScreen` (`battleScene.ts:19419-19432`): no depth test;
/// `None` for a zero-size canvas.
#[must_use]
pub fn battle_world_to_screen(
    p: Vec3,
    cam: &ProjectionCamera,
    client_w: f64,
    client_h: f64,
) -> Option<(f64, f64)> {
    let v = cam.project(p);
    if client_w == 0.0 || client_h == 0.0 {
        return None;
    }
    Some((
        ((v.x + 1.0) / 2.0) * client_w,
        ((-v.y + 1.0) / 2.0) * client_h,
    ))
}

/// The CSS `transform` of a label group.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AnchorTransform {
    /// R4: none.
    None,
    /// R5: `translate(-50%,-100%)` (`main.ts:14571`).
    CenterBottom,
    /// R15a/b: `translate(-50%, -50%)` (`battleScene.ts:7483`, `:9103`).
    Center,
}

/// The screen rectangle (x, y, w, h) of a label box of `width × height`
/// (`LayoutUnit`) placed at CSS `left`/`top`: the position is a
/// `LayoutUnit` (`LayoutUnit(float)` of the CSS value), the percentage
/// translate is exact in `f32` (measured: `getBoundingClientRect`,
/// `anchors.tsv`).
#[must_use]
pub fn anchored_rect(
    t: AnchorTransform,
    left: f64,
    top: f64,
    width: Lu,
    height: Lu,
) -> (f32, f32, f32, f32) {
    // CSS lengths are floats in Blink.
    #[allow(clippy::cast_possible_truncation)]
    let (l, tp) = (lu_trunc(left as f32), lu_trunc(top as f32));
    #[allow(clippy::cast_possible_truncation)]
    let (x, y, w, h) = (
        lu_px(l) as f32,
        lu_px(tp) as f32,
        lu_px(width) as f32,
        lu_px(height) as f32,
    );
    match t {
        AnchorTransform::None => (x, y, w, h),
        AnchorTransform::CenterBottom => (x - w * 0.5, y - h, w, h),
        AnchorTransform::Center => (x - w * 0.5, y - h * 0.5, w, h),
    }
}

/// One float label (`FloatLabel` of `battleScene.ts:2031-2037`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct FloatLabel {
    /// `startTime` (ms, the battle's wall clock `vLastWall`).
    pub start_time: f64,
    /// `duration` (ms).
    pub duration: f64,
    /// `worldPos` at spawn.
    pub world: Vec3,
    /// `riseRate` (world units per ms).
    pub rise_rate: f64,
}

/// The state of a float label in one frame.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct FloatFrame {
    /// Risen world position (`wp.y += age · riseRate`).
    pub world: Vec3,
    /// Progress `p = min(1, age / duration)`.
    pub progress: f64,
    /// Element opacity `1 − p²`.
    pub opacity: f64,
}

impl FloatLabel {
    /// A label spawned at `start_time` with the web's duration and rise rate.
    #[must_use]
    pub fn spawn(start_time: f64, world: Vec3) -> Self {
        FloatLabel {
            start_time,
            duration: FLOAT_DURATION_MS,
            world,
            rise_rate: FLOAT_RISE_RATE,
        }
    }

    /// `_tickFloatLabels(t)` for this label: `None` once `p >= 1` (the web
    /// removes the element).
    #[must_use]
    pub fn frame(&self, t: f64) -> Option<FloatFrame> {
        let age = t - self.start_time;
        let p = js_min(1.0, age / self.duration);
        if p >= 1.0 {
            return None;
        }
        let mut wp = self.world;
        wp.y += age * self.rise_rate;
        Some(FloatFrame {
            world: wp,
            progress: p,
            opacity: 1.0 - p * p,
        })
    }

    /// Frame + battle projection: `(left, top, opacity)` as the web writes
    /// them into the element style (`None` = removed; the position is
    /// `None` inside when the canvas has no size and the style is untouched).
    #[must_use]
    pub fn screen(
        &self,
        t: f64,
        cam: &ProjectionCamera,
        client_w: f64,
        client_h: f64,
    ) -> Option<Option<(f64, f64, f64)>> {
        let f = self.frame(t)?;
        Some(
            battle_world_to_screen(f.world, cam, client_w, client_h)
                .map(|(x, y)| (x, y, f.opacity)),
        )
    }
}
