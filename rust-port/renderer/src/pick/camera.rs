//! Picking camera: the web `PerspectiveCamera` driven by `CameraController`
//! and the pixel → ray conversion of `Raycaster.setFromCamera`.
//!
//! Sources (web `edb8fb56`): `render/scene.ts:2997-2999, 3074-3085, 3104-3106`
//! (fov 50°, near 0.5, `farClip`, aspect), `render/camera.ts:130-144`
//! (`_syncCamera`: elevation 52°, yaw 0, `lookAt(target)`),
//! `main.ts:1904-1908` (`minDist = 8/3`, `maxDist`), Three r169
//! `PerspectiveCamera.updateProjectionMatrix`, `Object3D.lookAt`,
//! `Raycaster.setFromCamera`.
//!
//! This is a self-contained copy for picking only; the shared camera state
//! and continuous input belong to module `camera` (RR-T2/RR-T12). When that
//! lands, it must produce exactly these matrices (see the bit-exact test in
//! `tests/pick_golden.rs`).

use super::hex::{client_rect_to_ndc, ClientRect, HEX_R};
use super::three::{Mat4, Quat, Ray, Vec3};

/// Vertical field of view in degrees (`scene.ts:3079`).
pub const FOV_DEG: f64 = 50.0;
/// Near plane (`scene.ts:3081`).
pub const NEAR: f64 = 0.5;
/// Camera elevation in degrees (`camera.ts:132`).
pub const ELEVATION_DEG: f64 = 52.0;
/// Minimal camera distance (`main.ts:1906`, `minDist: 8 / 3`).
pub const MIN_DIST: f64 = 8.0 / 3.0;

/// `THREE.MathUtils.DEG2RAD` = `Math.PI / 180`.
#[must_use]
pub fn deg2rad() -> f64 {
    std::f64::consts::PI / 180.0
}

/// `maxZoomDist` for a map (`scene.ts:2997-2999`, same formula as
/// `main.ts:1904-1908`).
#[must_use]
pub fn max_zoom_dist(map_w: u32, map_h: u32) -> f64 {
    let map_max_dim = f64::from(map_w.max(map_h));
    let map_span_for_cam = map_max_dim * HEX_R * 1.85;
    320.0f64.max(map_span_for_cam * 1.2)
}

/// `farClip` of the `roblox` style (`scene.ts:3075-3076`).
#[must_use]
pub fn far_clip_roblox(map_w: u32, map_h: u32) -> f64 {
    let map_max_dim = f64::from(map_w.max(map_h));
    1200.0f64
        .max(max_zoom_dist(map_w, map_h) * 5.0)
        .max(map_max_dim * HEX_R * 6.0)
}

/// Camera state relevant to picking.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PickCamera {
    /// `CameraController.target.x` (target `y` is always 0).
    pub target_x: f64,
    /// `CameraController.target.z`.
    pub target_z: f64,
    /// `CameraController.dist`.
    pub dist: f64,
    /// Far plane (`farClip`, see [`far_clip_roblox`]).
    pub far: f64,
}

/// Matrices of the camera exactly as Three.js holds them after
/// `updateMatrixWorld` / `updateProjectionMatrix`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CameraMatrices {
    /// `camera.matrixWorld`.
    pub world: Mat4,
    /// `camera.projectionMatrix`.
    pub projection: Mat4,
    /// `camera.projectionMatrixInverse`.
    pub projection_inverse: Mat4,
}

impl PickCamera {
    /// Camera position after `_syncCamera` (`camera.ts:135-142`).
    #[must_use]
    pub fn position(&self) -> Vec3 {
        let elevation = ELEVATION_DEG * deg2rad();
        let azimut = 0.0f64;
        let cos_el = elevation.cos();
        let sin_el = elevation.sin();
        Vec3::new(
            self.target_x + self.dist * cos_el * azimut.sin(),
            0.0 + self.dist * sin_el,
            self.target_z + self.dist * cos_el * azimut.cos(),
        )
    }

    /// World and projection matrices for a viewport of `width × height`
    /// CSS pixels (`camera.aspect = w / h`).
    #[must_use]
    pub fn matrices(&self, width: f64, height: f64) -> CameraMatrices {
        let position = self.position();
        let target = Vec3::new(self.target_x, 0.0, self.target_z);
        // Object3D.lookAt for cameras: _m1.lookAt(position, target, up).
        let rot = Mat4::look_at(position, target, Vec3::new(0.0, 1.0, 0.0));
        let quaternion = Quat::from_rotation_matrix(&rot);
        let world = Mat4::compose(position, quaternion, Vec3::new(1.0, 1.0, 1.0));
        // PerspectiveCamera.updateProjectionMatrix (zoom 1, no view, no skew).
        let aspect = width / height;
        let top = NEAR * (deg2rad() * 0.5 * FOV_DEG).tan() / 1.0;
        let h = 2.0 * top;
        let w = aspect * h;
        let left = -0.5 * w;
        let projection = Mat4::make_perspective(left, left + w, top, top - h, NEAR, self.far);
        let projection_inverse = projection.invert();
        CameraMatrices {
            world,
            projection,
            projection_inverse,
        }
    }
}

impl CameraMatrices {
    /// `Raycaster.setFromCamera(ndc, camera)` for a perspective camera.
    #[must_use]
    pub fn ray_from_ndc(&self, nx: f64, ny: f64) -> Ray {
        let origin = self.world.position();
        let direction = Vec3::new(nx, ny, 0.5)
            .apply_matrix4(&self.projection_inverse)
            .apply_matrix4(&self.world)
            .sub_vec(origin)
            .normalize();
        Ray { origin, direction }
    }

    /// Client pixel → ray (`clientRectToNdc` + `setFromCamera`); `None` for
    /// an empty canvas rect (the web returns `null` there).
    #[must_use]
    pub fn ray_from_client(&self, client_x: f64, client_y: f64, rect: &ClientRect) -> Option<Ray> {
        client_rect_to_ndc(client_x, client_y, rect).map(|(nx, ny)| self.ray_from_ndc(nx, ny))
    }
}
