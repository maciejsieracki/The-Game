//! JavaScript number semantics and three r169 object maths that the decor
//! builders need, computed with V8's `Math.*` where the platform libm can
//! round differently.
//!
//! - `Math.sin` / `Math.cos`: [`js_sin`] / [`js_cos`] (fdlibm port of V8,
//!   P4.14 `models::wonders::js_trig`; P4.16 `jsmath` is not on
//!   `rust-port/parity-v2` at base `d925acb3`, so it cannot be used yet);
//! - `Math.pow`: [`js_pow`] (P4.11 `terrain::jsmath`);
//! - `Math.hypot` (two arguments): [`js_hypot`] (P4.11 `terrain::coast`);
//! - `Math.max` with the `-0`/`+0` rule: [`js_max`] (P4.10 `pick::three`).
//!
//! `Math.atan2` is the platform `f64::atan2` (as in `terrain::coast`, P4.11):
//! the decor builders only call it on the 6 unit axial directions, where
//! glibc and V8 agree (verified by the coast vectors of this topic); this is
//! an explicitly noted residual risk for other platforms.
//!
//! [`quat_from_euler`] / [`local_matrix`] / [`world_matrix`] reproduce
//! `Quaternion.setFromEuler` (order `XYZ`), `Object3D.updateMatrix()` and
//! `updateMatrixWorld()` with [`js_sin`] / [`js_cos`] — `geom::Quat::from_euler`
//! and `core::scene::SceneNode::local_matrix` use the platform `sin`/`cos`
//! and `geom/**`, `core/**` are outside this topic's allowlist.

pub use crate::models::wonders::{js_cos, js_sin};
pub use crate::pick::three::js_max;
pub use crate::terrain::coast::js_hypot;
pub use crate::terrain::jsmath::js_pow;

use crate::core::scene::SceneNode;
use crate::geom::{Euler, EulerOrder, Mat4, Quat, Vec3};

/// `Math.PI`.
pub const PI: f64 = std::f64::consts::PI;

/// `Math.floor(x)` of a finite non-negative number, as an index.
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
pub(crate) fn floor_index(x: f64) -> usize {
    x.floor() as usize
}

/// `((w | 0) % n + n) % n` for an integer `w` (the variant wrap of every
/// `*Geometria(wariant)` of the decor files).
#[must_use]
#[allow(clippy::cast_sign_loss, clippy::cast_possible_wrap)]
pub fn wrap_variant(w: i32, n: usize) -> usize {
    let n = n as i32;
    ((w % n + n) % n) as usize
}

/// `Quaternion.setFromEuler(euler)` of three r169 with V8 `Math.sin/cos`.
#[must_use]
pub fn quat_from_euler(eu: Euler) -> Quat {
    let c1 = js_cos(eu.x / 2.0);
    let c2 = js_cos(eu.y / 2.0);
    let c3 = js_cos(eu.z / 2.0);
    let s1 = js_sin(eu.x / 2.0);
    let s2 = js_sin(eu.y / 2.0);
    let s3 = js_sin(eu.z / 2.0);
    let (x, y, z, w) = match eu.order {
        EulerOrder::Xyz => (
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3,
        ),
        EulerOrder::Yxz => (
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 - s1 * s2 * c3,
            c1 * c2 * c3 + s1 * s2 * s3,
        ),
        EulerOrder::Zxy => (
            s1 * c2 * c3 - c1 * s2 * s3,
            c1 * s2 * c3 + s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3,
        ),
        EulerOrder::Zyx => (
            s1 * c2 * c3 - c1 * s2 * s3,
            c1 * s2 * c3 + s1 * c2 * s3,
            c1 * c2 * s3 - s1 * s2 * c3,
            c1 * c2 * c3 + s1 * s2 * s3,
        ),
        EulerOrder::Yzx => (
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 + s1 * c2 * s3,
            c1 * c2 * s3 - s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3,
        ),
        EulerOrder::Xzy => (
            s1 * c2 * c3 - c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 + s1 * s2 * s3,
        ),
    };
    Quat { x, y, z, w }
}

/// `Object3D.updateMatrix()` of a node: `compose(position, quaternion, scale)`.
#[must_use]
pub fn local_matrix(n: &SceneNode) -> Mat4 {
    Mat4::compose(n.position, quat_from_euler(n.rotation), n.scale)
}

/// `matrixWorld` of every node of `root` after `root.updateMatrixWorld(true)`
/// (root without a parent), in `traverse` (pre-)order.
#[must_use]
pub fn world_matrices(root: &SceneNode) -> Vec<Mat4> {
    fn go(n: &SceneNode, parent: Option<&Mat4>, out: &mut Vec<Mat4>) {
        let local = local_matrix(n);
        let world = match parent {
            None => local,
            Some(p) => p.mul(&local),
        };
        out.push(world);
        for c in &n.children {
            go(c, Some(&world), out);
        }
    }
    let mut out = Vec::new();
    go(root, None, &mut out);
    out
}

/// `matrixWorld` of the root alone.
#[must_use]
pub fn world_matrix(root: &SceneNode) -> Mat4 {
    local_matrix(root)
}

/// Axis-aligned box (`THREE.Box3`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Box3 {
    /// `min`.
    pub min: Vec3,
    /// `max`.
    pub max: Vec3,
}

impl Box3 {
    /// `new Box3()` (empty: `+∞` / `−∞`).
    #[must_use]
    pub fn empty() -> Self {
        Self {
            min: Vec3::new(f64::INFINITY, f64::INFINITY, f64::INFINITY),
            max: Vec3::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY),
        }
    }

    /// `expandByPoint(p)` (`min.min(p)`, `max.max(p)` = `Math.min/max`).
    pub fn expand(&mut self, p: Vec3) {
        self.min = Vec3::new(
            crate::pick::three::js_min(self.min.x, p.x),
            crate::pick::three::js_min(self.min.y, p.y),
            crate::pick::three::js_min(self.min.z, p.z),
        );
        self.max = Vec3::new(
            js_max(self.max.x, p.x),
            js_max(self.max.y, p.y),
            js_max(self.max.z, p.z),
        );
    }

    /// `isEmpty()`.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.max.x < self.min.x || self.max.y < self.min.y || self.max.z < self.min.z
    }
}

/// `new Box3().setFromObject(root, true)` (precise: every vertex of every
/// mesh through its `matrixWorld`, `Vector3.applyMatrix4` with the projective
/// divide).
#[must_use]
pub fn bounding_box(root: &SceneNode) -> Box3 {
    let worlds = world_matrices(root);
    let mut b = Box3::empty();
    let mut i = 0;
    root.traverse(&mut |n| {
        if let crate::core::scene::NodeKind::Mesh { geometry, .. } = &n.kind {
            let m = &worlds[i];
            let p = &geometry.mesh.positions;
            for k in 0..p.len() / 3 {
                let v = Vec3::new(
                    f64::from(p[3 * k]),
                    f64::from(p[3 * k + 1]),
                    f64::from(p[3 * k + 2]),
                )
                .apply_mat4(m);
                b.expand(v);
            }
        }
        i += 1;
    });
    b
}
