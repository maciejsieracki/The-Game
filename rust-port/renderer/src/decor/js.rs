//! JavaScript number semantics and three r169 object maths that the decor
//! builders need.
//!
//! Every web `Math.sin` / `Math.cos` / `Math.pow` / `Math.hypot` /
//! `Math.atan2` goes through the ONE V8-exact implementation
//! [`crate::jsmath`] (P4.16, on `rust-port/parity-v2` since `9ef158d2`);
//! `Math.max` with the `-0`/`+0` rule is [`js_max`] (P4.10 `pick::three`).
//! No platform `libm` transcendental is called by `decor/**` (checked by the
//! source scan of `tests/decor_web_parity.rs`).
//!
//! `Object3D.updateMatrix()` is `core::scene::SceneNode::local_matrix`
//! (`geom::Quat::from_euler`, which uses `jsmath` since P4.16); this module
//! only adds the `updateMatrixWorld(true)` walk ([`world_matrices`]) and
//! `Box3.setFromObject(root, true)` ([`bounding_box`]), which `core::scene`
//! does not provide.

pub use crate::jsmath::{js_atan2, js_cos, js_hypot, js_pow, js_sin};
pub use crate::pick::three::js_max;

use crate::core::scene::SceneNode;
use crate::geom::{Mat4, Vec3};

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

/// `matrixWorld` of every node of `root` after `root.updateMatrixWorld(true)`
/// (root without a parent), in `traverse` (pre-)order.
#[must_use]
pub fn world_matrices(root: &SceneNode) -> Vec<Mat4> {
    fn go(n: &SceneNode, parent: Option<&Mat4>, out: &mut Vec<Mat4>) {
        let local = n.local_matrix();
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
    root.local_matrix()
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
