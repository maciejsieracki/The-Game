//! Object tree of an improvement / resource model.
//!
//! The tree itself is the MOD-04 type [`UnitModel`] (dispatch: "Typ drzewa
//! modelu = ten z `models::unit_core::model`"). The web improvement builders
//! need three things that `UnitModel` does not carry, so they live in
//! parallel side tables here (minimal types, no change to `unit_core`):
//!
//! - [`NodeExt`] per node: `castShadow` / `receiveShadow`, `userData` and the
//!   two geometries that `unit_core::model::Prim` cannot describe
//!   ([`ExtraGeo`]: `DodecahedronGeometry` and a `ConeGeometry` rotated with
//!   `BufferGeometry.rotateY`);
//! - [`MatExt`] per material: material model (`MeshLambertMaterial` /
//!   `MeshStandardMaterial`) and the linear `emissive` colour.
//!
//! `unit_core::model::Material` is reused for colour / `flatShading` /
//! `metalness` / `roughness`; a Lambert material stores `metalness = 0`,
//! `roughness = 1` there (Lambert has neither parameter, [`MatExt::kind`]
//! says which fields are meaningful).

use crate::geom::{self, Mat4, Vec3};
use crate::models::unit_core::model::{
    quat_from_euler, Geo, MatId, Material, Node, NodeId, Prim, UnitModel, ROOT,
};
use crate::pick::three::js_max;
use crate::terrain::color::srgb_to_linear;

/// Material model of a [`MatExt`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MatKind {
    /// `THREE.MeshLambertMaterial`.
    Lambert,
    /// `THREE.MeshStandardMaterial`.
    Standard,
}

/// Material data that `unit_core::model::Material` does not carry.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MatExt {
    /// Material model.
    pub kind: MatKind,
    /// `material.emissive` in the linear working colour space (`r, g, b`).
    pub emissive: [f64; 3],
}

/// Geometries outside `unit_core::model::Prim`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ExtraGeo {
    /// `new THREE.DodecahedronGeometry(r, detail)`.
    Dodecahedron {
        /// Radius.
        r: f64,
        /// Detail.
        detail: u32,
    },
    /// `new THREE.ConeGeometry(r, h, radial)` followed by
    /// `geometry.rotateY(twist)` (`swinia-trzoda.ts` `EAR`).
    TwistedCone {
        /// Radius.
        r: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
        /// `rotateY` angle.
        twist: f64,
    },
}

impl ExtraGeo {
    /// Builds the CPU geometry (vertex-for-vertex like Three r169).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        match *self {
            Self::Dodecahedron { r, detail } => geom::dodecahedron_geometry(r, detail),
            Self::TwistedCone {
                r,
                h,
                radial,
                twist,
            } => {
                let mut m =
                    geom::cone_geometry(r, h, radial, 1, false, 0.0, std::f64::consts::PI * 2.0);
                m.rotate_y(twist);
                m
            }
        }
    }
}

/// `object.userData` keys used by the MOD-11 builders.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct UserData {
    /// `userData['mats']` is set to an array of this length.
    pub mats: Option<usize>,
    /// `userData['perTokenGeos']` is set to an array of this length.
    pub per_token_geos: Option<usize>,
    /// `userData.depositDisplayScale`.
    pub deposit_display_scale: Option<f64>,
}

/// Per-node data that `unit_core::model::Node` does not carry.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct NodeExt {
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// Geometry override (the node's `Geo` is then a placeholder).
    pub extra: Option<ExtraGeo>,
    /// `userData` (only nodes where a builder writes it).
    pub user_data: Option<UserData>,
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

/// An improvement / resource model: [`UnitModel`] tree + side tables.
#[derive(Debug, Clone, PartialEq)]
pub struct ImprovementModel {
    /// The object tree; [`ROOT`] is the group the web builder returns.
    pub tree: UnitModel,
    /// One entry per `tree.materials` element.
    pub mat_ext: Vec<MatExt>,
    /// One entry per `tree.nodes` element.
    pub node_ext: Vec<NodeExt>,
}

impl Default for ImprovementModel {
    fn default() -> Self {
        Self::new()
    }
}

impl ImprovementModel {
    /// An empty root group.
    #[must_use]
    pub fn new() -> Self {
        Self {
            tree: UnitModel::new(),
            mat_ext: Vec::new(),
            node_ext: vec![NodeExt::default()],
        }
    }

    /// Extends the side tables after nodes were added through `tree`
    /// directly (e.g. `unit_core::horse::build_horse`).
    pub fn sync(&mut self) {
        self.node_ext
            .resize(self.tree.nodes.len(), NodeExt::default());
    }

    /// `new THREE.MeshLambertMaterial({ color, flatShading })`.
    pub fn lambert_mat(&mut self, color: u32, flat_shading: bool) -> MatId {
        let id = self.tree.untracked_mat(Material {
            color,
            metalness: 0.0,
            roughness: 1.0,
            transparent: false,
            opacity: 1.0,
            flat_shading,
        });
        self.mat_ext.push(MatExt {
            kind: MatKind::Lambert,
            emissive: [0.0; 3],
        });
        id
    }

    /// `new THREE.MeshLambertMaterial({ color, flatShading: true })` — the
    /// `mat(c)` of every roblox improvement file.
    pub fn lambert(&mut self, color: u32) -> MatId {
        self.lambert_mat(color, true)
    }

    /// `new THREE.MeshStandardMaterial({ color, flatShading, metalness,
    /// roughness, emissive })` with `emissive` already linear.
    pub fn standard(
        &mut self,
        color: u32,
        flat_shading: bool,
        metalness: f64,
        roughness: f64,
        emissive: [f64; 3],
    ) -> MatId {
        let id = self.tree.untracked_mat(Material {
            color,
            metalness,
            roughness,
            transparent: false,
            opacity: 1.0,
            flat_shading,
        });
        self.mat_ext.push(MatExt {
            kind: MatKind::Standard,
            emissive,
        });
        id
    }

    /// `new THREE.Group()`, not attached.
    pub fn detached(&mut self) -> NodeId {
        let id = self.tree.detached_group();
        self.sync();
        id
    }

    /// `parent.add(new THREE.Group())`.
    pub fn group(&mut self, parent: NodeId) -> NodeId {
        let id = self.tree.add_group(parent);
        self.sync();
        id
    }

    /// `parent.add(new THREE.Mesh(prim, material))` (no shadows).
    pub fn mesh(&mut self, parent: NodeId, prim: Prim, material: MatId) -> NodeId {
        let id = self.tree.add_mesh_id(parent, Geo::Prim(prim), material);
        self.sync();
        id
    }

    /// A mesh whose geometry is an [`ExtraGeo`] (`placeholder` is stored in
    /// the `unit_core` node and ignored by [`Self::geometry`]).
    pub fn mesh_extra(
        &mut self,
        parent: NodeId,
        extra: ExtraGeo,
        placeholder: Prim,
        material: MatId,
    ) -> NodeId {
        let id = self.mesh(parent, placeholder, material);
        self.node_ext[id].extra = Some(extra);
        id
    }

    /// `parent.add(child)`.
    pub fn attach(&mut self, parent: NodeId, child: NodeId) {
        self.tree.attach(parent, child);
    }

    /// Node access.
    pub fn node(&mut self, id: NodeId) -> &mut Node {
        &mut self.tree.nodes[id]
    }

    /// Side-table access.
    pub fn ext(&mut self, id: NodeId) -> &mut NodeExt {
        &mut self.node_ext[id]
    }

    /// `castShadow = true` (and optionally `receiveShadow = true`).
    pub fn shadows(&mut self, id: NodeId, cast: bool, receive: bool) {
        let e = &mut self.node_ext[id];
        e.cast_shadow = cast;
        e.receive_shadow = receive;
    }

    /// `rotation.set(x, y, z)` (Euler `XYZ`) and the quaternion update.
    pub fn set_rotation(&mut self, id: NodeId, x: f64, y: f64, z: f64) {
        let n = &mut self.tree.nodes[id];
        n.rotation.x = x;
        n.rotation.y = y;
        n.rotation.z = z;
        n.quaternion = quat_from_euler(n.rotation);
    }

    /// Copies the children of `other`'s root under `parent` (the root of
    /// `other` must be an untransformed group, as `buildZlozeKonie` returns).
    /// All materials of `other` are `MeshStandardMaterial` with black
    /// emissive (the only use is `kon-nowy-model.ts:323-342`).
    pub fn graft_standard(&mut self, parent: NodeId, other: &UnitModel) {
        let node_base = self.tree.nodes.len();
        let mat_base = self.tree.materials.len();
        for m in &other.materials {
            self.tree.materials.push(*m);
            self.mat_ext.push(MatExt {
                kind: MatKind::Standard,
                emissive: [0.0; 3],
            });
        }
        let map = |id: NodeId| -> NodeId {
            if id == ROOT {
                parent
            } else {
                node_base + id - 1
            }
        };
        for (old, n) in other.nodes.iter().enumerate().skip(1) {
            let mut c = n.clone();
            c.parent = n.parent.map(map);
            c.children = n.children.iter().map(|&k| map(k)).collect();
            if let Some(md) = c.mesh.as_mut() {
                md.material += mat_base;
            }
            debug_assert_eq!(self.tree.nodes.len(), map(old));
            self.tree.nodes.push(c);
        }
        for &k in &other.nodes[ROOT].children {
            self.tree.nodes[parent].children.push(map(k));
        }
        self.sync();
    }

    /// The CPU geometry of a mesh node.
    #[must_use]
    pub fn geometry(&self, id: NodeId) -> Option<geom::Mesh> {
        let md = self.tree.nodes[id].mesh?;
        Some(match self.node_ext[id].extra {
            Some(x) => x.build(),
            None => md.geo.build(),
        })
    }

    /// Pre-order traversal of the subtree of `root` (children in `add()`
    /// order) with the world matrices that `updateWorldMatrix` gives when
    /// `root` has no parent.
    #[must_use]
    pub fn subtree(&self, root: NodeId) -> Vec<(NodeId, Mat4)> {
        let mut out = Vec::new();
        let mut stack = vec![(root, None::<Mat4>)];
        while let Some((id, parent)) = stack.pop() {
            let local = self.tree.local_matrix(id);
            let world = match parent {
                Some(p) => p.mul(&local),
                None => local,
            };
            out.push((id, world));
            for &c in self.tree.nodes[id].children.iter().rev() {
                stack.push((c, Some(world)));
            }
        }
        out
    }

    /// `new THREE.Box3().setFromObject(node)` (non-precise: geometry
    /// bounding boxes transformed by the world matrix), with `node` treated
    /// as a parentless root, as at the call sites of
    /// `buildImprovementSectored`.
    #[must_use]
    pub fn box_from_object(&self, root: NodeId) -> Box3 {
        let mut b = Box3::empty();
        for (id, world) in self.subtree(root) {
            if let Some(g) = self.geometry(id) {
                b.union(&Box3::of_geometry(&g).apply_matrix4(&world));
            }
        }
        b
    }

    /// `new THREE.Box3().setFromObject(root, true)` (every vertex).
    #[must_use]
    pub fn box_precise(&self) -> Box3 {
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

    /// Mesh / vertex / triangle totals over the tree.
    #[must_use]
    pub fn totals(&self) -> (usize, usize, usize) {
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
