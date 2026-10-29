//! Part 5 of MOD-14 "battle 3D" (camera half): the **battle camera
//! control** of `battle/battleScene.ts` (web `edb8fb56`, topic
//! R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5, document
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §39–§48).
//!
//! The web camera is a `PerspectiveCamera(48, aspect, 0.1, 4000)` that
//! always looks at `camTarget` along the fixed direction `camDir`
//! (`:2076-2085`): zoom is a dolly along `camDir` eased every frame
//! (`_setZoomTarget` `:9883`, `_tickZoom` `:9888`, wheel `_onWheel` `:9899`,
//! `+`/`-` keys `_onKeyZoom` `:9908`), pan moves `camTarget` on the ground
//! (`_setPanKey` `:9920`, `_tickCameraPanKeys` `:9953`, drag `_onPanMove`
//! `:11384-11396`) inside `_clampCamTarget` (`:9942`); there is **no orbit**
//! (`camDir` never changes — W-22). [`BattleView`] keeps, besides the
//! part-2 [`BattleCamera`], the matrices three r169 keeps on the camera
//! object, because the web reads them in different states:
//!
//! - `camera.matrixWorld` / `matrixWorldInverse` are refreshed by
//!   `updateMatrixWorld` (a render, `_raycastFromCanvas`, `_doBoxSelect`) and
//!   — **stale** — by `Object3D.lookAt` inside `_applyCamera`, which updates
//!   the world matrix from the new position with the *previous* quaternion
//!   before computing the new one (three r169 `Object3D.lookAt`, `Camera.
//!   updateWorldMatrix`); `worldToScreen` (`:19419`) projects with whatever
//!   is there (W-23);
//! - `projectionMatrix(Inverse)` change only in `_syncRendererSize`
//!   (`:8554-8564`) when the canvas client size differs from the renderer
//!   size (`WebGLRenderer.getSize`, initially the canvas bitmap size).
//!
//! Inputs are events as data (wheel `deltaY`, key / code strings, client
//! pixels) and the canvas size; DOM concerns (`preventDefault`,
//! `isEditableTarget`) are a returned flag / an input flag.

use super::field::{BattleCamera, BF_COLS, BF_ROWS, TILE_S};
use crate::jsmath::js_exp;
use crate::pick::hex::{client_rect_to_ndc, ClientRect};
use crate::pick::three::{Mat4, Ray, Vec3};

/// The canvas as the web code reads it: `clientWidth` / `clientHeight`
/// (`_syncRendererSize`, `_tickCameraPanKeys`, `worldToScreen`, the minimap
/// viewport, the drag pan) and `getBoundingClientRect()` (`_canvasNdc`,
/// `worldToClientPx`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Canvas {
    /// `canvas.clientWidth`.
    pub client_width: f64,
    /// `canvas.clientHeight`.
    pub client_height: f64,
    /// `canvas.getBoundingClientRect()`.
    pub rect: ClientRect,
}

impl Canvas {
    /// A canvas whose bounding rect has the client size at `(left, top)`.
    #[must_use]
    pub fn new(width: f64, height: f64, left: f64, top: f64) -> Self {
        Self {
            client_width: width,
            client_height: height,
            rect: ClientRect {
                left,
                top,
                width,
                height,
            },
        }
    }
}

/// `_camPanKeys` (`:2092`).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct PanKeys {
    /// `up` (ArrowUp / KeyW).
    pub up: bool,
    /// `down` (ArrowDown / KeyS).
    pub down: bool,
    /// `left` (ArrowLeft / KeyA).
    pub left: bool,
    /// `right` (ArrowRight / KeyD).
    pub right: bool,
}

/// `_onWheel` zoom step per `deltaY` unit (`Math.exp(deltaY * 0.0012)`, `:9903`).
pub const WHEEL_ZOOM_RATE: f64 = 0.0012;
/// `_onKeyZoom` step (`:9911`, `:9914`).
pub const KEY_ZOOM_STEP: f64 = 0.88;
/// `_tickZoom` easing factor (`:9894`).
pub const ZOOM_EASE: f64 = 0.18;
/// `_tickZoom` snap threshold (`:9890`).
pub const ZOOM_SNAP: f64 = 0.01;
/// `_tickCameraPanKeys` step in pixels (`:9964`).
pub const PAN_KEY_STEP_PX: f64 = 14.0;
/// World units per pixel per unit of `camDist` (`camDist * 1.2 / h`, `:9963`,
/// `:11052`, `:11392`).
pub const WORLD_PER_PX_K: f64 = 1.2;
/// `_clampCamTarget` margin factor and floor (`:9943`).
pub const CLAMP_MARGIN_K: f64 = 0.28;
/// `_clampCamTarget` minimal margin (`:9943`).
pub const CLAMP_MARGIN_MIN: f64 = 2.0;

/// The battle camera with the matrix state of the three r169 camera object.
#[derive(Debug, Clone, PartialEq)]
pub struct BattleView {
    /// Position, orientation, projection parameters and the dolly state.
    pub camera: BattleCamera,
    /// `camera.matrixWorld` as last updated.
    pub matrix_world: Mat4,
    /// `camera.matrixWorldInverse` as last updated.
    pub matrix_world_inverse: Mat4,
    /// `camera.projectionMatrix`.
    pub projection: Mat4,
    /// `camera.projectionMatrixInverse`.
    pub projection_inverse: Mat4,
    /// `renderer.getSize()` (`_width`, `_height`).
    pub renderer_size: (f64, f64),
    /// `_camPanKeys`.
    pub pan_keys: PanKeys,
}

impl BattleView {
    /// The camera right after `new BattleScene(...)`: `camera` is
    /// [`super::field::BattleField::camera`] (constructor `_applyCamera`,
    /// `:3336-3337`), so `matrixWorld` is the constructor's `lookAt` update —
    /// the new position with the identity quaternion the camera had before;
    /// the projection is the constructor's (`aspect` 1). `renderer_size` is
    /// the canvas bitmap size the `WebGLRenderer` starts with (300×150 for a
    /// canvas without attributes; ZAŁOŻENIE Z-36-20).
    #[must_use]
    pub fn new(camera: BattleCamera, renderer_size: (f64, f64)) -> Self {
        let matrix_world = Mat4::compose(
            camera.position,
            crate::pick::three::Quat::IDENTITY,
            Vec3::new(1.0, 1.0, 1.0),
        );
        let projection = camera.projection_matrix();
        Self {
            camera,
            matrix_world,
            matrix_world_inverse: matrix_world.invert(),
            projection,
            projection_inverse: projection.invert(),
            renderer_size,
            pan_keys: PanKeys::default(),
        }
    }

    /// `camera.updateMatrixWorld()` (`Camera.updateMatrixWorld`: matrix from
    /// position / quaternion, then the inverse) — what a render, `_raycastFromCanvas`
    /// and `_doBoxSelect` do.
    pub fn update_matrix_world(&mut self) {
        self.matrix_world = self.camera.world_matrix();
        self.matrix_world_inverse = self.matrix_world.invert();
    }

    /// The camera part of `renderer.render(scene, camera)`.
    pub fn render(&mut self) {
        self.update_matrix_world();
    }

    /// `_applyCamera()` (`:9872-9880`): dolly position (distance clamped),
    /// then `camera.lookAt(camTarget)` — whose `updateWorldMatrix` leaves
    /// `matrixWorld` = new position × previous quaternion.
    pub fn apply_camera(&mut self) {
        let previous = self.camera.quaternion;
        self.camera.apply();
        self.matrix_world = Mat4::compose(self.camera.position, previous, Vec3::new(1.0, 1.0, 1.0));
        self.matrix_world_inverse = self.matrix_world.invert();
    }

    /// `_syncRendererSize()` (`:8554-8564`): with a non-empty canvas whose
    /// client size differs from the renderer size (`Math.round` of it), the
    /// renderer takes the client size and the camera aspect `w / h`.
    /// Returns `true` when the projection changed.
    pub fn sync_renderer_size(&mut self, canvas: &Canvas) -> bool {
        let (w, h) = (canvas.client_width, canvas.client_height);
        if w == 0.0 || h == 0.0 {
            return false;
        }
        let (sx, sy) = self.renderer_size;
        if js_round(sx) != w || js_round(sy) != h {
            self.renderer_size = (w, h);
            self.camera.aspect = w / h;
            self.projection = self.camera.projection_matrix();
            self.projection_inverse = self.projection.invert();
            return true;
        }
        false
    }

    /// `_setZoomTarget(dist)` (`:9883-9885`).
    pub fn set_zoom_target(&mut self, dist: f64) {
        let c = &mut self.camera;
        c.dist_target = js_max(c.dist_min, js_min(c.dist_max, dist));
    }

    /// `_tickZoom()` (`:9888-9896`): ease `camDist` toward the target (snap
    /// below 0.01).
    pub fn tick_zoom(&mut self) {
        let diff = self.camera.dist_target - self.camera.dist;
        if diff.abs() < ZOOM_SNAP {
            if self.camera.dist != self.camera.dist_target {
                self.camera.dist = self.camera.dist_target;
                self.apply_camera();
            }
            return;
        }
        self.camera.dist += diff * ZOOM_EASE;
        self.apply_camera();
    }

    /// `_onWheel(e)` (`:9899-9905`); always `preventDefault` (returns `true`).
    pub fn on_wheel(&mut self, delta_y: f64) -> bool {
        let factor = js_exp(delta_y * WHEEL_ZOOM_RATE);
        self.set_zoom_target(self.camera.dist_target * factor);
        true
    }

    /// `_onKeyZoom(e)` (`:9908-9917`): `+`/`=`/`Add` zoom in, `-`/`_`/`Subtract`
    /// out; returns whether the key was handled (`preventDefault`).
    pub fn on_key_zoom(&mut self, key: &str) -> bool {
        match key {
            "+" | "=" | "Add" => {
                self.set_zoom_target(self.camera.dist_target * KEY_ZOOM_STEP);
                true
            }
            "-" | "_" | "Subtract" => {
                self.set_zoom_target(self.camera.dist_target / KEY_ZOOM_STEP);
                true
            }
            _ => false,
        }
    }

    /// `_setPanKey(code, down, e)` (`:9920-9931`) — also `_onKeyPanDown` /
    /// `_onKeyPanUp` (`:9933-9939`). `editable` = `isEditableTarget(e.target)`
    /// (the key is then ignored). Returns `preventDefault`.
    pub fn set_pan_key(&mut self, code: &str, down: bool, editable: bool) -> bool {
        if editable {
            return false;
        }
        let k = &mut self.pan_keys;
        match code {
            "ArrowLeft" | "KeyA" => k.left = down,
            "ArrowRight" | "KeyD" => k.right = down,
            "ArrowUp" | "KeyW" => k.up = down,
            "ArrowDown" | "KeyS" => k.down = down,
            _ => return false,
        }
        true
    }

    /// `_clampCamTarget()` (`:9942-9950`): the target stays inside the big
    /// field minus a zoom-dependent margin (`max(2, camDist · 0.28)`).
    pub fn clamp_cam_target(&mut self) {
        let c = &mut self.camera;
        let margin = js_max(CLAMP_MARGIN_MIN, c.dist * CLAMP_MARGIN_K);
        let min_x = margin;
        let max_x = f64::from(BF_COLS - 1) * TILE_S - margin;
        let min_z = margin;
        let max_z = f64::from(BF_ROWS - 1) * TILE_S - margin;
        c.target.x = js_max(min_x, js_min(max_x, c.target.x));
        c.target.z = js_max(min_z, js_min(max_z, c.target.z));
    }

    /// `_tickCameraPanKeys()` (`:9953-9969`): 14 px per frame of held keys
    /// (left = +X… as in the web: `camTarget.x -= dx·…` with `left → dx = +1`).
    pub fn tick_camera_pan_keys(&mut self, canvas: &Canvas) {
        let k = self.pan_keys;
        let mut dx = 0.0;
        let mut dy = 0.0;
        if k.left {
            dx += 1.0;
        }
        if k.right {
            dx -= 1.0;
        }
        if k.up {
            dy -= 1.0;
        }
        if k.down {
            dy += 1.0;
        }
        if dx == 0.0 && dy == 0.0 {
            return;
        }
        let h = js_max(1.0, canvas.client_height);
        let world_per_px = (self.camera.dist * WORLD_PER_PX_K) / h;
        self.camera.target.x -= dx * world_per_px * PAN_KEY_STEP_PX;
        self.camera.target.z += dy * world_per_px * PAN_KEY_STEP_PX;
        self.clamp_cam_target();
        self.apply_camera();
    }

    /// The camera part of one frame of `_startLoop` (`:8518-8520`,
    /// `:8537-8539`): `_syncRendererSize`, `_tickZoom`, `_tickCameraPanKeys`
    /// (the render that follows is [`Self::render`]).
    pub fn frame(&mut self, canvas: &Canvas) {
        self.sync_renderer_size(canvas);
        self.tick_zoom();
        self.tick_camera_pan_keys(canvas);
    }

    /// The pan branch of `_onPanMove` (`:11384-11396`): screen right → +X,
    /// screen down → +Z, `camDist · 1.2 / clientHeight` world units per pixel.
    pub fn drag_pan(&mut self, dx: f64, dy: f64, canvas: &Canvas) {
        let h = js_max(1.0, canvas.client_height);
        let world_per_px = (self.camera.dist * WORLD_PER_PX_K) / h;
        self.camera.target.x -= dx * world_per_px;
        self.camera.target.z -= dy * world_per_px;
        self.clamp_cam_target();
        self.apply_camera();
    }

    /// `_computeMinimapViewport()` (`:11049-11065`): the tile rectangle the
    /// minimap frames.
    #[must_use]
    pub fn minimap_viewport(&self, canvas: &Canvas) -> MinimapViewport {
        let h = js_max(1.0, canvas.client_height);
        let w = js_max(1.0, canvas.client_width);
        let world_per_px = (self.camera.dist * WORLD_PER_PX_K) / h;
        let visible_w = w * world_per_px;
        let visible_h = h * world_per_px;
        let col_center = self.camera.target.x / TILE_S;
        let row_center = self.camera.target.z / TILE_S;
        let col_half = visible_w / TILE_S / 2.0;
        let row_half = visible_h / TILE_S / 2.0;
        MinimapViewport {
            col_min: js_max(0.0, (col_center - col_half).floor()),
            row_min: js_max(0.0, (row_center - row_half).floor()),
            col_max: js_min(f64::from(BF_COLS - 1), (col_center + col_half).ceil()),
            row_max: js_min(f64::from(BF_ROWS - 1), (row_center + row_half).ceil()),
        }
    }

    /// `_raycastFromCanvas(clientX, clientY)` (`:8575-8582`): `_canvasNdc`
    /// (`clientRectToNdc` of the bounding rect, `None` when empty), then
    /// `camera.updateMatrixWorld(true)` and `Raycaster.setFromCamera` (origin
    /// = camera position, direction = `unproject(ndc.x, ndc.y, 0.5) − origin`
    /// normalised).
    pub fn ray_from_canvas(
        &mut self,
        client_x: f64,
        client_y: f64,
        canvas: &Canvas,
    ) -> Option<Ray> {
        let (nx, ny) = client_rect_to_ndc(client_x, client_y, &canvas.rect)?;
        self.update_matrix_world();
        let origin = self.matrix_world.position();
        let direction = Vec3::new(nx, ny, 0.5)
            .apply_matrix4(&self.projection_inverse)
            .apply_matrix4(&self.matrix_world)
            .sub_vec(origin)
            .normalize();
        Some(Ray { origin, direction })
    }

    /// `Vector3.project(camera)`: `applyMatrix4(matrixWorldInverse)` then
    /// `applyMatrix4(projectionMatrix)` (current, possibly stale, matrices).
    #[must_use]
    pub fn project(&self, p: Vec3) -> Vec3 {
        p.apply_matrix4(&self.matrix_world_inverse)
            .apply_matrix4(&self.projection)
    }

    /// `worldToScreen(worldPos, camera, canvas)` (`:19419-19432`): canvas
    /// pixels (no depth test), `None` for an empty canvas.
    #[must_use]
    pub fn world_to_screen(&self, p: Vec3, canvas: &Canvas) -> Option<(f64, f64)> {
        let v = self.project(p);
        let (w, h) = (canvas.client_width, canvas.client_height);
        if w == 0.0 || h == 0.0 {
            return None;
        }
        Some((((v.x + 1.0) / 2.0) * w, ((-v.y + 1.0) / 2.0) * h))
    }

    /// `worldToClientPx(x, y, z, camera, canvas)` (`input/picker.ts:101-117`):
    /// client pixels of the bounding rect; `None` behind the far plane
    /// (`v.z > 1`) or for an empty rect.
    #[must_use]
    pub fn world_to_client_px(&self, p: Vec3, canvas: &Canvas) -> Option<(f64, f64)> {
        let v = self.project(p);
        if v.z > 1.0 {
            return None;
        }
        let r = &canvas.rect;
        if r.width <= 0.0 || r.height <= 0.0 {
            return None;
        }
        Some((
            r.left + (v.x * 0.5 + 0.5) * r.width,
            r.top + (-v.y * 0.5 + 0.5) * r.height,
        ))
    }
}

/// `BattleMinimapViewport` (tile bounds, JS numbers).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MinimapViewport {
    /// `colMin`.
    pub col_min: f64,
    /// `rowMin`.
    pub row_min: f64,
    /// `colMax`.
    pub col_max: f64,
    /// `rowMax`.
    pub row_max: f64,
}

/// The camera-drag state of `_onPanDown` / `_onPanMove` / `_onPanUp`
/// (`panning`, `panLastX`, `panLastY`, `:2087-2089`).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct DragPan {
    /// `panning`.
    pub panning: bool,
    /// `panLastX`.
    pub last_x: f64,
    /// `panLastY`.
    pub last_y: f64,
}

impl DragPan {
    /// Whether `_onPanDown` (`:11274-11320`) starts a camera drag: never for
    /// the left button in the deploy phase or in manual mode of a running
    /// battle (those select — routing → P5 / P6.13), never for buttons other
    /// than 0 / 1 / 2.
    #[must_use]
    pub fn pointer_down_pans(
        button: i32,
        deploy_phase: bool,
        manual_mode: bool,
        started: bool,
        finished: bool,
    ) -> bool {
        if button == 0 && deploy_phase {
            return false;
        }
        if button == 0 && manual_mode && !deploy_phase && started && !finished {
            return false;
        }
        matches!(button, 0..=2)
    }

    /// `_onPanDown` for a pointer that pans: start at `(x, y)`.
    pub fn down(&mut self, x: f64, y: f64) {
        self.panning = true;
        self.last_x = x;
        self.last_y = y;
    }

    /// The pan branch of `_onPanMove`: moves the camera by the pointer delta.
    pub fn move_to(&mut self, view: &mut BattleView, x: f64, y: f64, canvas: &Canvas) {
        if !self.panning {
            return;
        }
        let dx = x - self.last_x;
        let dy = y - self.last_y;
        self.last_x = x;
        self.last_y = y;
        view.drag_pan(dx, dy, canvas);
    }

    /// `_onPanUp` (the camera part: `panning = false`, `:11464`).
    pub fn up(&mut self) {
        self.panning = false;
    }
}

/// `Math.round` (ties toward +∞).
fn js_round(x: f64) -> f64 {
    super::siege_wall::js_round(x)
}

/// `Math.max(a, b)` (NaN propagates; `+0 > -0`).
pub(crate) fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a > b || (a == b && a.is_sign_positive()) {
        a
    } else {
        b
    }
}

/// `Math.min(a, b)` (NaN propagates; `-0 < +0`).
pub(crate) fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pan_buttons_follow_on_pan_down() {
        // `:11276`, `:11306`, `:11312`
        assert!(!DragPan::pointer_down_pans(0, true, false, false, false));
        assert!(DragPan::pointer_down_pans(2, true, false, false, false));
        assert!(!DragPan::pointer_down_pans(0, false, true, true, false));
        assert!(DragPan::pointer_down_pans(0, false, true, true, true));
        assert!(DragPan::pointer_down_pans(0, false, true, false, false));
        assert!(DragPan::pointer_down_pans(1, false, false, false, false));
        assert!(!DragPan::pointer_down_pans(3, false, false, false, false));
        assert!(!DragPan::pointer_down_pans(-1, false, false, false, false));
    }

    #[test]
    fn constants_equal_web_literals() {
        // `:9903`, `:9911`, `:9894`, `:9890`, `:9964`, `:9963`, `:9943`
        assert_eq!(WHEEL_ZOOM_RATE.to_bits(), 0.0012f64.to_bits());
        assert_eq!(KEY_ZOOM_STEP.to_bits(), 0.88f64.to_bits());
        assert_eq!(ZOOM_EASE.to_bits(), 0.18f64.to_bits());
        assert_eq!(ZOOM_SNAP.to_bits(), 0.01f64.to_bits());
        assert_eq!(PAN_KEY_STEP_PX.to_bits(), 14f64.to_bits());
        assert_eq!(WORLD_PER_PX_K.to_bits(), 1.2f64.to_bits());
        assert_eq!(CLAMP_MARGIN_K.to_bits(), 0.28f64.to_bits());
        assert_eq!(CLAMP_MARGIN_MIN.to_bits(), 2f64.to_bits());
    }
}
