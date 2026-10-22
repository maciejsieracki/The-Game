//! Object tree of an improvement / resource model.
//!
//! Since R-RUSTPORT-P4-27-SCENE-UNIFY-Q1 the model is the renderer's one
//! scene-tree type, [`crate::scene::Scene`] ([`ImprovementModel`] is an
//! alias). What P4.20 kept in side tables is carried by the scene itself:
//!
//! - `castShadow` / `receiveShadow` and `userData` are node fields (the
//!   typed view of the `userData` keys the MOD-11 builders write is
//!   [`UserData`], read and written with [`user_data`] / [`set_user_data`]);
//! - the material class (`MeshLambertMaterial` / `MeshStandardMaterial`,
//!   [`MatKind`]) and the linear `emissive` colour are material fields;
//! - `DodecahedronGeometry` is a parametric [`Prim::Dodecahedron`], the
//!   `ConeGeometry` rotated with `BufferGeometry.rotateY` is the module body
//!   [`TwistedCone`].
//!
//! The builder conveniences of P4.20 (`lambert`, `standard`, the box and
//! geometry readers) are the extension trait [`ImprovementExt`] on
//! [`Scene`].

use crate::geom::{self, Mat4, Vec3};
use crate::pick::three::js_max;
pub use crate::scene::MaterialKind as MatKind;
use crate::scene::{Geo, GeoBody, MatId, Material, NodeId, Prim, Scene, UserValue, ROOT};
use crate::terrain::color::{srgb_to_linear, Color};

/// An improvement / resource model (alias of [`Scene`]).
pub type ImprovementModel = Scene;

/// `new THREE.ConeGeometry(r, h, radial)` followed by
/// `geometry.rotateY(twist)` (`swinia-trzoda.ts` `EAR`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TwistedCone {
    /// Radius.
    pub r: f64,
    /// Height.
    pub h: f64,
    /// Radial segments.
    pub radial: u32,
    /// `rotateY` angle.
    pub twist: f64,
}

impl GeoBody for TwistedCone {
    fn build(&self) -> geom::Mesh {
        let mut m = geom::cone_geometry(
            self.r,
            self.h,
            self.radial,
            1,
            false,
            0.0,
            std::f64::consts::PI * 2.0,
        );
        m.rotate_y(self.twist);
        m
    }
    fn three_type(&self) -> &'static str {
        "ConeGeometry"
    }
}

/// `object.userData` keys written by the MOD-11 builders (typed view of
/// [`crate::scene::Node::user_data`]).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct UserData {
    /// `userData['mats']` is set to an array of this length.
    pub mats: Option<usize>,
    /// `userData['perTokenGeos']` is set to an array of this length.
    pub per_token_geos: Option<usize>,
    /// `userData.depositDisplayScale`.
    pub deposit_display_scale: Option<f64>,
}

/// Writes the keys of `d` into the `userData` of node `id`.
pub fn set_user_data(m: &mut Scene, id: NodeId, d: UserData) {
    let ud = &mut m.nodes[id].user_data;
    if let Some(n) = d.mats {
        ud.set("mats", UserValue::Len(n));
    }
    if let Some(n) = d.per_token_geos {
        ud.set("perTokenGeos", UserValue::Len(n));
    }
    if let Some(v) = d.deposit_display_scale {
        ud.set("depositDisplayScale", UserValue::Num(v));
    }
}

/// The MOD-11 `userData` keys of node `id` (`None` when the builders wrote
/// none).
#[must_use]
pub fn user_data(m: &Scene, id: NodeId) -> Option<UserData> {
    let ud = &m.nodes[id].user_data;
    if ud.is_empty() {
        return None;
    }
    Some(UserData {
        mats: ud.array_len("mats"),
        per_token_geos: ud.array_len("perTokenGeos"),
        deposit_display_scale: ud.num("depositDisplayScale"),
    })
}

/// Axis-aligned box (`THREE.Box3`), empty = `+inf / -inf`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Box3 {
    /// `min`.
    pub min: Vec3,
    /// `max`.
    pub max: Vec3,
}

/// `Math.min` including NaN propagation and `-0 < +0`.
#[must_use]
pub fn js_min_nan(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// `Math.max` including NaN propagation and `+0 > -0`.
#[must_use]
pub fn js_max_nan(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        js_max(a, b)
    }
}

fn vmin(a: Vec3, b: Vec3) -> Vec3 {
    Vec3::new(
        js_min_nan(a.x, b.x),
        js_min_nan(a.y, b.y),
        js_min_nan(a.z, b.z),
    )
}

fn vmax(a: Vec3, b: Vec3) -> Vec3 {
    Vec3::new(
        js_max_nan(a.x, b.x),
        js_max_nan(a.y, b.y),
        js_max_nan(a.z, b.z),
    )
}

impl Default for Box3 {
    fn default() -> Self {
        Self::empty()
    }
}

impl Box3 {
    /// `makeEmpty()`.
    #[must_use]
    pub const fn empty() -> Self {
        Self {
            min: Vec3::new(f64::INFINITY, f64::INFINITY, f64::INFINITY),
            max: Vec3::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY),
        }
    }

    /// `isEmpty()`.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.max.x < self.min.x || self.max.y < self.min.y || self.max.z < self.min.z
    }

    /// `expandByPoint(p)`.
    pub fn expand_by_point(&mut self, p: Vec3) {
        self.min = vmin(self.min, p);
        self.max = vmax(self.max, p);
    }

    /// `union(b)`.
    pub fn union(&mut self, b: &Self) {
        self.min = vmin(self.min, b.min);
        self.max = vmax(self.max, b.max);
    }

    /// `getCenter(target)`.
    #[must_use]
    pub fn center(&self) -> Vec3 {
        if self.is_empty() {
            Vec3::new(0.0, 0.0, 0.0)
        } else {
            Vec3::new(
                (self.min.x + self.max.x) * 0.5,
                (self.min.y + self.max.y) * 0.5,
                (self.min.z + self.max.z) * 0.5,
            )
        }
    }

    /// `applyMatrix4(m)` (8 corners in Three's binary order, then
    /// `setFromPoints`).
    #[must_use]
    pub fn apply_matrix4(&self, m: &Mat4) -> Self {
        if self.is_empty() {
            return *self;
        }
        let (a, b) = (self.min, self.max);
        let pts = [
            Vec3::new(a.x, a.y, a.z),
            Vec3::new(a.x, a.y, b.z),
            Vec3::new(a.x, b.y, a.z),
            Vec3::new(a.x, b.y, b.z),
            Vec3::new(b.x, a.y, a.z),
            Vec3::new(b.x, a.y, b.z),
            Vec3::new(b.x, b.y, a.z),
            Vec3::new(b.x, b.y, b.z),
        ];
        let mut out = Self::empty();
        for p in pts {
            out.expand_by_point(p.apply_mat4(m));
        }
        out
    }

    /// `geometry.computeBoundingBox()` (`setFromBufferAttribute(position)`).
    #[must_use]
    pub fn of_geometry(g: &geom::Mesh) -> Self {
        let mut b = Self::empty();
        for v in g.positions.chunks_exact(3) {
            b.expand_by_point(Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2])));
        }
        b
    }
}

/// `new THREE.Color(hex)` in the linear working colour space
/// (`setHex` + `SRGBToLinear`, three r169 `Color.js`).
#[must_use]
pub fn hex_to_linear(hex: u32) -> [f64; 3] {
    let c = |shift: u32| srgb_to_linear(f64::from((hex >> shift) & 255) / 255.0);
    [c(16), c(8), c(0)]
}

/// The builder conveniences of the MOD-11 files on the one scene type.
pub trait ImprovementExt {
    /// `new THREE.MeshLambertMaterial({ color, flatShading: true })` — the
    /// `mat(c)` of every roblox improvement file.
    fn lambert(&mut self, color: u32) -> MatId;

    /// `new THREE.MeshStandardMaterial({ color, flatShading, metalness,
    /// roughness, emissive })` with `emissive` already linear.
    fn standard(
        &mut self,
        color: u32,
        flat_shading: bool,
        metalness: f64,
        roughness: f64,
        emissive: [f64; 3],
    ) -> MatId;

    /// The CPU geometry of a mesh node.
    fn geometry(&self, id: NodeId) -> Option<geom::Mesh>;

    /// `new THREE.Box3().setFromObject(node)` (non-precise: geometry
    /// bounding boxes transformed by the world matrix), with `node` treated
    /// as a parentless root, as at the call sites of
    /// `buildImprovementSectored`.
    fn box_from_object(&self, root: NodeId) -> Box3;

    /// `new THREE.Box3().setFromObject(root, true)` (every vertex).
    fn box_precise(&self) -> Box3;

    /// Mesh / vertex / triangle totals over the tree.
    fn totals(&self) -> (usize, usize, usize);
}

impl ImprovementExt for Scene {
    fn lambert(&mut self, color: u32) -> MatId {
        self.lambert_mat(color, true)
    }

    fn standard(
        &mut self,
        color: u32,
        flat_shading: bool,
        metalness: f64,
        roughness: f64,
        emissive: [f64; 3],
    ) -> MatId {
        let mut mt = Material::standard(color, metalness, roughness);
        mt.flat_shading = flat_shading;
        mt.emissive = Color::rgb(emissive[0], emissive[1], emissive[2]);
        self.add_material(mt)
    }

    fn geometry(&self, id: NodeId) -> Option<geom::Mesh> {
        self.nodes[id].mesh().map(|md| md.geo.build())
    }

    fn box_from_object(&self, root: NodeId) -> Box3 {
        let mut b = Box3::empty();
        for (id, world) in self.subtree(root) {
            if let Some(g) = self.geometry(id) {
                b.union(&Box3::of_geometry(&g).apply_matrix4(&world));
            }
        }
        b
    }

    fn box_precise(&self) -> Box3 {
        let mut b = Box3::empty();
        for (id, world) in self.subtree(ROOT) {
            if let Some(g) = self.geometry(id) {
                for v in g.positions.chunks_exact(3) {
                    b.expand_by_point(
                        Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2]))
                            .apply_mat4(&world),
                    );
                }
            }
        }
        b
    }

    fn totals(&self) -> (usize, usize, usize) {
        let mut t = (0, 0, 0);
        for (id, _) in self.subtree(ROOT) {
            if let Some(g) = self.geometry(id) {
                t.0 += 1;
                t.1 += g.vertex_count();
                t.2 += g.triangle_count();
            }
        }
        t
    }
}

/// `Geo` of a `DodecahedronGeometry(r, detail)`.
#[must_use]
pub const fn dodecahedron(r: f64, detail: u32) -> Prim {
    Prim::Dodecahedron { r, detail }
}

/// `Geo` of the twisted ear cone.
#[must_use]
pub fn twisted_cone(r: f64, h: f64, radial: u32, twist: f64) -> Geo {
    Geo::body(TwistedCone {
        r,
        h,
        radial,
        twist,
    })
}
