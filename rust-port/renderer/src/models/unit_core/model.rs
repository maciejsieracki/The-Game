//! CPU object tree of a unit model — the Rust counterpart of the
//! `THREE.Group` that the web builders return (no GPU, no upload).
//!
//! Since R-RUSTPORT-P4-27-SCENE-UNIFY-Q1 a [`UnitModel`] is the renderer's
//! one scene-tree type, [`crate::scene::Scene`] (an arena of [`Node`]s,
//! index [`ROOT`] = root group). Every node carries `position` / `rotation`
//! (Euler, XYZ) / `quaternion` / `scale` exactly like `THREE.Object3D`;
//! setting an Euler angle recomputes the quaternion
//! (`Quaternion.setFromEuler`, V8 trig), and
//! [`crate::scene::Scene::world_matrices`] reproduces
//! `Object3D.updateMatrixWorld(true)`
//! (`matrixWorld = parent.matrixWorld * compose(p, q, s)`).
//!
//! Mesh nodes reference a geometry ([`Geo`]: a parametric [`Prim`] or a
//! module body such as [`HexRing`] / [`LeafBlade`] or the bodies of the
//! Stone / Bronze / Iron packages) and a material slot ([`MatId`]).
//! Materials are plain data ([`Material`]); the ones created by the
//! per-token factory ([`crate::scene::Scene::mat`]) are "tracked" in
//! creation order in the root `userData.mats` list
//! ([`crate::scene::Scene::tracked`]), like the web (used by fog dimming and
//! disposal there).
//!
//! The P4.13 public paths are kept: the types are re-exported here, and
//! [`UnitModel`] is an alias of [`Scene`].

use crate::geom::{self, Euler, Quat};
pub use crate::scene::{
    geo_hash, quat_from_unit_vectors, Fnv, Geo, GeoBody, MatId, Material, MeshData, Node, NodeId,
    Prim, Scene, ROOT,
};
use crate::scene::{UserData, UserValue};

use super::jstrig::JsTrig;

/// A unit model (alias of [`Scene`]).
pub type UnitModel = Scene;

/// `ShapeGeometry` of a pointy-top hex ring (`appendPointyTopHex`,
/// `units.ts:475-486`): outer outline + reversed inner hole
/// (`getGeoSelectionHexRing` / `getGeoOwnerHexRing`, `units.ts:487-508`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HexRing {
    /// Outer radius.
    pub outer: f64,
    /// Inner radius.
    pub inner: f64,
}

impl GeoBody for HexRing {
    fn build(&self) -> geom::Mesh {
        hex_ring_geometry(self.outer, self.inner)
    }
    fn three_type(&self) -> &'static str {
        "ShapeGeometry"
    }
}

/// Leaf-shaped bronze blade (`makeLeafBladeGeo`,
/// `jednostki-p1-rdzen.ts:580-598`): a non-indexed `BufferGeometry`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LeafBlade {
    /// Length.
    pub len: f64,
    /// Maximum width.
    pub w_max: f64,
}

impl GeoBody for LeafBlade {
    fn build(&self) -> geom::Mesh {
        leaf_blade_geometry(self.len, self.w_max)
    }
    fn three_type(&self) -> &'static str {
        "BufferGeometry"
    }
}

/// `appendPointyTopHex(path, radius, reverse)` (`units.ts:475-486`).
fn pointy_top_hex(radius: f64, reverse: bool) -> geom::Path2 {
    use std::f64::consts::PI;
    let order: [u32; 6] = if reverse {
        [5, 4, 3, 2, 1, 0]
    } else {
        [0, 1, 2, 3, 4, 5]
    };
    let mut path = geom::Path2::new();
    for (j, &i) in order.iter().enumerate() {
        let angle = PI / 2.0 + (f64::from(i) * PI) / 3.0;
        let x = radius * angle.js_cos();
        let y = radius * angle.js_sin();
        if j == 0 {
            path.move_to(x, y);
        } else {
            path.line_to(x, y);
        }
    }
    path.close_path();
    path
}

/// `getGeoSelectionHexRing` / `getGeoOwnerHexRing` body (`units.ts:487-508`).
fn hex_ring_geometry(outer: f64, inner: f64) -> geom::Mesh {
    let shape = geom::Shape {
        outline: pointy_top_hex(outer, false),
        holes: vec![pointy_top_hex(inner, true)],
    };
    geom::shape_geometry(&shape)
}

/// `makeLeafBladeGeo(len, wMax)` (`jednostki-p1-rdzen.ts:580-598`): a flat
/// two-layer ribbon, non-indexed, `computeVertexNormals()`, no UVs.
fn leaf_blade_geometry(len: f64, w_max: f64) -> geom::Mesh {
    const PROF: [(f64, f64); 6] = [
        (0.00, 0.28),
        (0.16, 0.34),
        (0.42, 0.50),
        (0.62, 0.42),
        (0.84, 0.24),
        (1.00, 0.0),
    ];
    let prof: Vec<(f64, f64)> = PROF.iter().map(|&(t, w)| (t * len, w * w_max)).collect();
    let mut pos: Vec<f64> = Vec::new();
    let mut quad = |x1: f64, y1: f64, x2: f64, y2: f64, z: f64, flip: bool| {
        if flip {
            pos.extend_from_slice(&[
                -x1, y1, z, x2, y2, z, x1, y1, z, -x1, y1, z, -x2, y2, z, x2, y2, z,
            ]);
        } else {
            pos.extend_from_slice(&[
                -x1, y1, z, x1, y1, z, x2, y2, z, -x1, y1, z, x2, y2, z, -x2, y2, z,
            ]);
        }
    };
    for i in 0..prof.len() - 1 {
        let (y1, w1) = prof[i];
        let (y2, w2) = prof[i + 1];
        quad(w1, y1, w2, y2, 0.006, false);
        quad(w1, y1, w2, y2, -0.006, true);
    }
    #[allow(clippy::cast_possible_truncation)]
    let positions: Vec<f32> = pos.iter().map(|&v| v as f32).collect();
    let mut m = geom::Mesh {
        positions,
        normals: Vec::new(),
        uvs: Vec::new(),
        indices: None,
        groups: Vec::new(),
    };
    m.compute_vertex_normals();
    m
}

/// `Quaternion.setFromEuler(euler)` with V8's `Math.sin/cos` — the one
/// implementation is [`Quat::from_euler`] (`geom`, through `jsmath`), whose
/// formulas for all six orders are those of three r169; this wrapper keeps
/// the P4.13 path.
#[must_use]
pub fn quat_from_euler(eu: Euler) -> Quat {
    Quat::from_euler(eu)
}

/// Counters written by `decorateChariot(…, celtic = true)` into
/// `group.userData['celticRetint']` (`units.ts:1418-1423`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CelticRetint {
    /// Materials re-tinted bronze → iron.
    pub iron: u32,
    /// Materials re-tinted lacquer → woad.
    pub tunic: u32,
    /// Materials re-tinted red → trousers.
    pub crest: u32,
}

/// `group.userData['celticRetint']`, if set.
#[must_use]
pub fn celtic_retint(m: &Scene) -> Option<CelticRetint> {
    let ud = m.nodes[ROOT].user_data.map("celticRetint")?;
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // counters
    let n = |k: &str| ud.num(k).map_or(0, |v| v as u32);
    Some(CelticRetint {
        iron: n("iron"),
        tunic: n("tunic"),
        crest: n("crest"),
    })
}

/// `group.userData['celticRetint'] = { iron, tunic, crest }`.
pub fn set_celtic_retint(m: &mut Scene, r: CelticRetint) {
    let mut ud = UserData::default();
    ud.set("iron", UserValue::Num(f64::from(r.iron)));
    ud.set("tunic", UserValue::Num(f64::from(r.tunic)));
    ud.set("crest", UserValue::Num(f64::from(r.crest)));
    m.nodes[ROOT]
        .user_data
        .set("celticRetint", UserValue::Map(ud));
}

pub use crate::scene::hash::{signature, Signature};
