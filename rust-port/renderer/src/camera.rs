//! `camera` — the map camera controller of the web (`CameraController`,
//! `render/camera.ts`, web `edb8fb56`) as a pure input → camera-parameter
//! state machine (topic RR-T2a, P4-11; P4-3 §3.2, §3.9).
//!
//! The controller owns `target = (x, 0, z)` and `dist`; the camera itself is
//! [`crate::pick::camera::PickCamera`] (elevation 52°, yaw 0, `lookAt`), so
//! the matrices are exactly those the picker already reproduces bit for bit
//! (P4-10). Nothing of the camera math is duplicated here.
//!
//! Units: client coordinates are CSS pixels (`MouseEvent.clientX/Y`,
//! `getBoundingClientRect`); `target`/`dist` are world units (`HEX_R = 1`);
//! [`CameraController::update`] takes the frame time in seconds.
//!
//! Every handler keeps the order of IEEE 754 operations of the TypeScript
//! source (`camera.ts:98-308`), so a controller fed the same events ends in
//! bit-identical state (`tests/camera_web_parity.rs`).
//!
//! Deliberate differences from the web (owner/orchestrator decisions, P4-11):
//! - **no rotation**: the web has none either (`yaw = 0`, `camera.ts:123`);
//!   orbit is out of scope (Q1);
//! - **time-scaled continuous pan** (Q2): the web moves the target by a fixed
//!   amount per rendered frame (`camera.ts:275-289`); here the WASD/edge-pan
//!   step is multiplied by `min(dt, MAX_FRAME_DT) * 60`. At `dt = 1/60` the
//!   factor is exactly `1.0`, so the result is bit-identical to one web frame.
//!
//! Input predicates (`blockPointerAt`, `blockWheelAt`, `edgePanActive`) are
//! supplied per call through [`InputGate`], mirroring the web callbacks that
//! read UI state at event time.

use crate::pick::camera::{max_zoom_dist, PickCamera, MIN_DIST};
use crate::pick::hex::{map_center, ClientRect, HEX_R};
use crate::pick::three::{js_max, js_min, Vec3};

/// Click/drag dead zone in CSS px (`camera.ts:25`), shared with the click
/// handler of `main.ts`.
pub const DRAG_THRESHOLD_PX: f64 = 6.0;

/// Longest frame time the continuous pan honours (seconds). Matches the
/// 100 ms clamp of the web frame loop (`main.ts:36248-36251`, P4-3 §3.9).
pub const MAX_FRAME_DT: f64 = 0.1;

/// Reference frame rate of the web per-frame pan (Q2: `dt × 60`).
pub const REFERENCE_FPS: f64 = 60.0;

/// `CameraControllerOptions` (`camera.ts:27-59`) without the callbacks.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CameraOptions {
    /// `minDist` (default 5).
    pub min_dist: f64,
    /// `maxDist` (default 200).
    pub max_dist: f64,
    /// `keyPanSpeed`, units per frame (default 0.25).
    pub key_pan_speed: f64,
    /// `mousePanFactor` (default 0.002).
    pub mouse_pan_factor: f64,
    /// `zoomFactor` per wheel notch (default 0.12).
    pub zoom_factor: f64,
    /// `edgePanZonePx` (default 32).
    pub edge_pan_zone_px: f64,
    /// `edgePanSpeed`; `None` = `key_pan_speed` (`camera.ts:118`).
    pub edge_pan_speed: Option<f64>,
}

impl Default for CameraOptions {
    /// Constructor defaults (`camera.ts:107-118`).
    fn default() -> Self {
        Self {
            min_dist: 5.0,
            max_dist: 200.0,
            key_pan_speed: 0.25,
            mouse_pan_factor: 0.002,
            zoom_factor: 0.12,
            edge_pan_zone_px: 32.0,
            edge_pan_speed: None,
        }
    }
}

impl CameraOptions {
    /// Options of the world map (`cameraControllerOpts`, `main.ts:1903-1909`):
    /// `minDist = 8/3`, `maxDist = max(320, max(W,H)·R·1.85·1.2)`,
    /// `keyPanSpeed = 0.3`, the rest default.
    #[must_use]
    pub fn world_map(map_w: u32, map_h: u32) -> Self {
        Self {
            min_dist: MIN_DIST,
            max_dist: max_zoom_dist(map_w, map_h),
            key_pan_speed: 0.3,
            ..Self::default()
        }
    }
}

/// UI predicates the web passes as callbacks (`camera.ts:38-54`).
pub trait InputGate {
    /// `blockPointerAt(x, y)`: drag/pan and edge-pan suppressed (absent = never).
    fn block_pointer_at(&self, _client_x: f64, _client_y: f64) -> bool {
        false
    }
    /// `blockWheelAt(x, y)`; the web defaults it to `blockPointerAt`
    /// (`camera.ts:115`), and so does this default method.
    fn block_wheel_at(&self, client_x: f64, client_y: f64) -> bool {
        self.block_pointer_at(client_x, client_y)
    }
    /// `edgePanActive()` (absent = edge-pan off, `camera.ts:252`).
    fn edge_pan_active(&self) -> bool {
        false
    }
}

/// A gate that blocks nothing and keeps edge-pan off (web: no callbacks).
#[derive(Clone, Copy, Debug, Default)]
pub struct NoGate;

impl InputGate for NoGate {}

/// Camera state needed by the renderer: `getFocusState()` (`camera.ts:301-303`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct FocusState {
    /// `target.x`.
    pub x: f64,
    /// `target.z`.
    pub z: f64,
    /// `dist`.
    pub dist: f64,
}

/// The web `CameraController` as a state machine.
#[derive(Clone, Debug, PartialEq)]
pub struct CameraController {
    target_x: f64,
    target_z: f64,
    dist: f64,
    opts: CameraOptions,
    is_dragging: bool,
    last_mouse_x: f64,
    last_mouse_y: f64,
    press_x: f64,
    press_y: f64,
    drag_armed: bool,
    /// `keys` (lower-cased `KeyboardEvent.key`), insertion-ordered set.
    keys: Vec<String>,
    mouse_client: Option<(f64, f64)>,
    canvas_rect: ClientRect,
}

impl CameraController {
    /// `new CameraController(camera, canvas, initialTarget, opts)`
    /// (`camera.ts:98-127`): `dist = |camera.position − target|` with
    /// `target = (x, 0, z)`, **not clamped** (as in the web).
    #[must_use]
    pub fn new(
        camera_position: Vec3,
        initial_target: (f64, f64),
        opts: CameraOptions,
        canvas_rect: ClientRect,
    ) -> Self {
        let target = Vec3::new(initial_target.0, 0.0, initial_target.1);
        // new Vector3().subVectors(camera.position, target).length()
        let dist = camera_position.sub_vec(target).length();
        Self {
            target_x: target.x,
            target_z: target.z,
            dist,
            opts,
            is_dragging: false,
            last_mouse_x: 0.0,
            last_mouse_y: 0.0,
            press_x: 0.0,
            press_y: 0.0,
            drag_armed: false,
            keys: Vec::new(),
            mouse_client: None,
            canvas_rect,
        }
    }

    /// The world-map controller exactly as the game builds it: camera placed
    /// by `buildScene` at `(cx, d·0.9, cz + d·0.7)` with `d = max(W,H)·R·1.65`
    /// (`scene.ts:3084-3085`, roblox), target `mapCenter(W, H)`
    /// (`scene.ts:3065`), options [`CameraOptions::world_map`].
    #[must_use]
    pub fn for_world_map(map_w: u32, map_h: u32, canvas_rect: ClientRect) -> Self {
        let (cx, cz) = map_center(map_w, map_h, HEX_R);
        let cam_dist = f64::from(map_w.max(map_h)) * HEX_R * 1.65;
        let pos = Vec3::new(cx, cam_dist * 0.9, cz + cam_dist * 0.7);
        Self::new(
            pos,
            (cx, cz),
            CameraOptions::world_map(map_w, map_h),
            canvas_rect,
        )
    }

    /// Options in force.
    #[must_use]
    pub fn options(&self) -> &CameraOptions {
        &self.opts
    }

    /// The canvas rectangle (`canvas.getBoundingClientRect()`), CSS px.
    #[must_use]
    pub fn canvas_rect(&self) -> ClientRect {
        self.canvas_rect
    }

    /// Updates the canvas rectangle (resize / layout change). The web reads it
    /// on every edge-pan frame (`camera.ts:257`).
    pub fn set_canvas_rect(&mut self, rect: ClientRect) {
        self.canvas_rect = rect;
    }

    // ── state readers ─────────────────────────────────────────────────────

    /// `getFocusState()` (`camera.ts:301-303`).
    #[must_use]
    pub fn focus_state(&self) -> FocusState {
        FocusState {
            x: self.target_x,
            z: self.target_z,
            dist: self.dist,
        }
    }

    /// `getDistLimits()` (`camera.ts:306-308`): `(minDist, maxDist)`.
    #[must_use]
    pub fn dist_limits(&self) -> (f64, f64) {
        (self.opts.min_dist, self.opts.max_dist)
    }

    /// `true` while the left button is held (after an unblocked press).
    #[must_use]
    pub fn is_dragging(&self) -> bool {
        self.is_dragging
    }

    /// `true` once the drag passed [`DRAG_THRESHOLD_PX`].
    #[must_use]
    pub fn drag_armed(&self) -> bool {
        self.drag_armed
    }

    /// The camera described by this state, with far plane `far` (see
    /// [`crate::pick::camera::far_clip_roblox`]). Its `position()` is the
    /// `_syncCamera` result (`camera.ts:130-144`), its `matrices()` the
    /// Three matrices.
    #[must_use]
    pub fn pick_camera(&self, far: f64) -> PickCamera {
        PickCamera {
            target_x: self.target_x,
            target_z: self.target_z,
            dist: self.dist,
            far,
        }
    }

    /// Camera position after `_syncCamera` (`camera.ts:130-144`).
    #[must_use]
    pub fn position(&self) -> Vec3 {
        self.pick_camera(1.0).position()
    }

    // ── internal moves ────────────────────────────────────────────────────

    /// `_pan(dx, dz)` (`camera.ts:147-151`).
    fn pan(&mut self, dx: f64, dz: f64) {
        self.target_x += dx;
        self.target_z += dz;
    }

    /// `THREE.MathUtils.clamp(v, min, max)` = `Math.max(min, Math.min(max, v))`.
    fn clamp_dist(&self, v: f64) -> f64 {
        if v.is_nan() {
            return v; // Math.min/Math.max propagate NaN
        }
        js_max(self.opts.min_dist, js_min(self.opts.max_dist, v))
    }

    /// `_zoom(delta)` (`camera.ts:154-161`).
    fn zoom(&mut self, delta: f64) {
        self.dist = self.clamp_dist(self.dist * (1.0 + delta * self.opts.zoom_factor));
    }

    // ── events ────────────────────────────────────────────────────────────

    /// `mousedown` on the canvas (`camera.ts:164-173`). `button` is
    /// `MouseEvent.button` (0 = left).
    pub fn mouse_down(&mut self, button: i32, client_x: f64, client_y: f64, gate: &dyn InputGate) {
        if button != 0 {
            return;
        }
        if gate.block_pointer_at(client_x, client_y) {
            return;
        }
        self.is_dragging = true;
        self.drag_armed = false;
        self.press_x = client_x;
        self.press_y = client_y;
        self.last_mouse_x = client_x;
        self.last_mouse_y = client_y;
    }

    /// `mousemove` on the window (`camera.ts:175-206`).
    pub fn mouse_move(&mut self, client_x: f64, client_y: f64) {
        self.mouse_client = Some((client_x, client_y));
        if !self.is_dragging {
            return;
        }
        if !self.drag_armed {
            let px = client_x - self.press_x;
            let py = client_y - self.press_y;
            if px * px + py * py < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX {
                return;
            }
            self.drag_armed = true;
            self.last_mouse_x = client_x;
            self.last_mouse_y = client_y;
            return;
        }
        let ddx = client_x - self.last_mouse_x;
        let ddy = client_y - self.last_mouse_y;
        self.last_mouse_x = client_x;
        self.last_mouse_y = client_y;
        let speed = self.dist * self.opts.mouse_pan_factor;
        self.pan(-ddx * speed, -ddy * speed);
    }

    /// `mouseup` on the window, any button (`camera.ts:208`).
    pub fn mouse_up(&mut self) {
        self.is_dragging = false;
        self.drag_armed = false;
    }

    /// Window `blur` (`camera.ts:212`): cursor forgotten, edge-pan stops.
    pub fn blur(&mut self) {
        self.mouse_client = None;
    }

    /// Document `mouseleave` (`camera.ts:213`).
    pub fn mouse_leave(&mut self) {
        self.mouse_client = None;
    }

    /// `wheel` on the canvas (`camera.ts:215-220`). Returns `true` when the
    /// web would call `preventDefault()` (the wheel was consumed). Note the
    /// web quirk kept here: `deltaY == 0` zooms **in** (`dir = -1`).
    pub fn wheel(
        &mut self,
        client_x: f64,
        client_y: f64,
        delta_y: f64,
        gate: &dyn InputGate,
    ) -> bool {
        if gate.block_wheel_at(client_x, client_y) {
            return false;
        }
        let dir = if delta_y > 0.0 { 1.0 } else { -1.0 };
        self.zoom(dir);
        true
    }

    /// `keydown` (`camera.ts:222`): `KeyboardEvent.key`, lower-cased.
    pub fn key_down(&mut self, key: &str) {
        let k = key.to_lowercase();
        if !self.keys.contains(&k) {
            self.keys.push(k);
        }
    }

    /// `keyup` (`camera.ts:223`).
    pub fn key_up(&mut self, key: &str) {
        let k = key.to_lowercase();
        self.keys.retain(|x| *x != k);
    }

    fn has_key(&self, k: &str) -> bool {
        self.keys.iter().any(|x| x == k)
    }

    /// `_edgePanDelta()` (`camera.ts:251-272`) with the step multiplied by
    /// `factor` (1.0 = one web frame).
    fn edge_pan_delta(&self, gate: &dyn InputGate, factor: f64) -> Option<(f64, f64)> {
        if !gate.edge_pan_active() {
            return None;
        }
        let (cx, cy) = self.mouse_client?;
        if self.is_dragging {
            return None;
        }
        if gate.block_pointer_at(cx, cy) {
            return None;
        }
        let rect = self.canvas_rect;
        let mx = cx - rect.left;
        let my = cy - rect.top;
        if mx < 0.0 || my < 0.0 || mx > rect.width || my > rect.height {
            return None;
        }
        let zone = self.opts.edge_pan_zone_px;
        let speed = self.opts.edge_pan_speed.unwrap_or(self.opts.key_pan_speed)
            * (self.dist / 30.0)
            * factor;
        let mut dx = 0.0;
        let mut dz = 0.0;
        if mx < zone {
            dx -= speed * ((zone - mx) / zone);
        }
        if mx > rect.width - zone {
            dx += speed * ((zone - (rect.width - mx)) / zone);
        }
        if my < zone {
            dz -= speed * ((zone - my) / zone);
        }
        if my > rect.height - zone {
            dz += speed * ((zone - (rect.height - my)) / zone);
        }
        if dx == 0.0 && dz == 0.0 {
            return None;
        }
        Some((dx, dz))
    }

    /// Continuous pan factor for a frame of `dt` seconds (Q2):
    /// `min(dt, MAX_FRAME_DT) · 60`, 0 for non-positive or NaN `dt`.
    #[must_use]
    pub fn frame_factor(dt: f64) -> f64 {
        if dt.is_nan() || dt <= 0.0 {
            return 0.0;
        }
        dt.min(MAX_FRAME_DT) * REFERENCE_FPS
    }

    /// One frame of `update()` (`camera.ts:275-289`: WASD/arrows + edge-pan)
    /// lasting `dt` seconds. At `dt = 1/60` this is bit-identical to one web
    /// frame; other `dt` scale the step linearly (Q2).
    pub fn update(&mut self, dt: f64, gate: &dyn InputGate) {
        let factor = Self::frame_factor(dt);
        let speed = self.opts.key_pan_speed * (self.dist / 30.0) * factor;
        let mut dx = 0.0;
        let mut dz = 0.0;
        if self.has_key("w") || self.has_key("arrowup") {
            dz -= speed;
        }
        if self.has_key("s") || self.has_key("arrowdown") {
            dz += speed;
        }
        if self.has_key("a") || self.has_key("arrowleft") {
            dx -= speed;
        }
        if self.has_key("d") || self.has_key("arrowright") {
            dx += speed;
        }
        if let Some((ex, ez)) = self.edge_pan_delta(gate, factor) {
            dx += ex;
            dz += ez;
        }
        if dx != 0.0 || dz != 0.0 {
            self.pan(dx, dz);
        }
    }

    /// `focusAt(x, z, dist?)` (`camera.ts:292-298`): the distance is clamped
    /// only when given.
    pub fn focus_at(&mut self, x: f64, z: f64, dist: Option<f64>) {
        self.target_x = x;
        self.target_z = z;
        if let Some(d) = dist {
            self.dist = self.clamp_dist(d);
        }
    }
}
