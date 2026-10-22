//! Object tree of the MOD-13 models: the shared unit tree
//! ([`crate::models::unit_core::model::UnitModel`], P4.13) plus the minimal
//! per-node / per-material data that tree does not carry.
//!
//! The unit tree models `MeshStandardMaterial` and the geometries of the
//! unit builders; the MOD-13 files use `MeshLambertMaterial`,
//! `MeshBasicMaterial`, `SpriteMaterial`, `CircleGeometry` and
//! `RingGeometry`, and set `castShadow` / `receiveShadow` / `renderOrder`.
//! Those are kept here, in parallel vectors indexed by the tree's own
//! [`NodeId`] / [`MatId`] (dispatch: "if the mesh/material type of
//! geom/assets is not enough, add a MINIMAL type in your own module"):
//! - every [`MiscMaterial`] is mirrored into `tree.materials` (same index;
//!   `metalness`/`roughness` there are placeholders, Lambert/Basic have none);
//! - [`Prim`] meshes are ordinary tree meshes (`Node::mesh`);
//! - circle / ring meshes and sprites are tree nodes with `mesh = None` and
//!   their geometry / sprite material in [`NodeInfo`].

use crate::geom::{self, Mat4, Vec3};
use crate::models::unit_core::model::{
    geo_hash, Fnv, Geo, MatId, Material, Node, NodeId, Prim, UnitModel, ROOT,
};
use crate::pick::three::{js_max, js_min};
use crate::terrain::color::Color;

/// Three.js material class of a [`MiscMaterial`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MatKind {
    /// `MeshLambertMaterial`.
    Lambert,
    /// `MeshBasicMaterial`.
    Basic,
    /// `SpriteMaterial`.
    Sprite,
    /// `LineBasicMaterial`.
    LineBasic,
}

impl MatKind {
    /// `material.type`.
    #[must_use]
    pub const fn three_type(self) -> &'static str {
        match self {
            Self::Lambert => "MeshLambertMaterial",
            Self::Basic => "MeshBasicMaterial",
            Self::Sprite => "SpriteMaterial",
            Self::LineBasic => "LineBasicMaterial",
        }
    }
}

/// `material.side`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    /// `THREE.FrontSide` (0, the default).
    Front,
    /// `THREE.DoubleSide` (2).
    Double,
}

impl Side {
    /// Numeric Three.js constant.
    #[must_use]
    pub const fn three_value(self) -> u32 {
        match self {
            Self::Front => 0,
            Self::Double => 2,
        }
    }
}

/// The canvas texture of the siege sprite as data
/// (`siegeSpriteTexture`, `siegeMarker.ts:35-49`). Rasterising it is the
/// text/SVG rasteriser's job (D-MOD-6); the draw calls are fixed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GlyphTexture {
    /// Canvas width and height (`128`).
    pub size: u32,
    /// `ctx.font`.
    pub font: &'static str,
    /// The glyph (`'⚔'`, crossed swords).
    pub glyph: char,
    /// `fillText` x (`64`), with `textAlign = 'center'`.
    pub x: u32,
    /// `fillText` y (`70`), with `textBaseline = 'middle'`.
    pub y: u32,
}

/// Material parameters as data (no shader / GPU state).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MiscMaterial {
    /// Material class.
    pub kind: MatKind,
    /// sRGB colour `0xRRGGBB` (`material.color.getHex()`; white for a
    /// `SpriteMaterial` without colour).
    pub color: u32,
    /// `flatShading`.
    pub flat_shading: bool,
    /// `transparent`.
    pub transparent: bool,
    /// `opacity`.
    pub opacity: f64,
    /// `depthWrite`.
    pub depth_write: bool,
    /// `depthTest`.
    pub depth_test: bool,
    /// `side`.
    pub side: Side,
    /// `polygonOffset` with (`polygonOffsetFactor`, `polygonOffsetUnits`).
    pub polygon_offset: Option<(f64, f64)>,
    /// `map` (only the siege sprite has one).
    pub map: Option<GlyphTexture>,
}

impl MiscMaterial {
    /// Three.js defaults of a material of `kind` with `color`.
    #[must_use]
    pub const fn new(kind: MatKind, color: u32) -> Self {
        Self {
            kind,
            color,
            flat_shading: false,
            transparent: false,
            opacity: 1.0,
            depth_write: true,
            depth_test: true,
            side: Side::Front,
            polygon_offset: None,
            map: None,
        }
    }

    /// `new MeshLambertMaterial({ color })`.
    #[must_use]
    pub const fn lambert(color: u32) -> Self {
        Self::new(MatKind::Lambert, color)
    }

    /// `new MeshLambertMaterial({ color, flatShading: true })`.
    #[must_use]
    pub const fn lambert_flat(color: u32) -> Self {
        let mut m = Self::new(MatKind::Lambert, color);
        m.flat_shading = true;
        m
    }

    /// `material.color` in the linear working space (`Color.setHex`).
    #[must_use]
    pub fn linear_color(&self) -> Color {
        Color::from_hex(self.color)
    }

    fn mirror(&self) -> Material {
        let kind = match self.kind {
            MatKind::Lambert => crate::scene::MaterialKind::Lambert,
            MatKind::Basic => crate::scene::MaterialKind::Basic,
            MatKind::Sprite => crate::scene::MaterialKind::Sprite,
            MatKind::LineBasic => crate::scene::MaterialKind::LineBasic,
        };
        let mut m = Material::new(kind, Some(self.color));
        m.transparent = self.transparent;
        m.opacity = self.opacity;
        m.flat_shading = self.flat_shading;
        m
    }
}

/// Geometry of a MOD-13 mesh.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MiscGeo {
    /// A primitive of the unit tree (box, cylinder, cone, sphere, icosahedron).
    Prim(Prim),
    /// `new THREE.CircleGeometry(radius, segments)`.
    Circle {
        /// Radius.
        radius: f64,
        /// Segments.
        segments: u32,
    },
    /// `new THREE.RingGeometry(inner, outer, thetaSegments)`.
    Ring {
        /// Inner radius.
        inner: f64,
        /// Outer radius.
        outer: f64,
        /// Theta segments (phi segments = 1).
        segments: u32,
    },
}

impl MiscGeo {
    /// Builds the CPU geometry (vertex-for-vertex Three.js r169).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        use std::f64::consts::PI;
        match *self {
            Self::Prim(p) => p.build(),
            Self::Circle { radius, segments } => {
                geom::circle_geometry(radius, segments, 0.0, PI * 2.0)
            }
            Self::Ring {
                inner,
                outer,
                segments,
            } => geom::ring_geometry(inner, outer, segments, 1, 0.0, PI * 2.0),
        }
    }
}

/// Kind of a node as `Object3D` (`isMesh` / `isSprite` / plain group).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NodeKind {
    /// `THREE.Group` (or the scene root).
    Group,
    /// `THREE.Mesh`.
    Mesh,
    /// `THREE.Sprite`.
    Sprite,
}

/// Per-node data the unit tree does not carry.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct NodeInfo {
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// `renderOrder`.
    pub render_order: i32,
    /// Circle / ring mesh (tree node has `mesh = None`).
    pub custom: Option<(MiscGeo, MatId)>,
    /// Sprite material (tree node has `mesh = None`).
    pub sprite: Option<MatId>,
}

/// A MOD-13 model: unit tree + parallel node / material data.
#[derive(Debug, Clone, PartialEq)]
pub struct MiscModel {
    /// The object tree (P4.13 type).
    pub tree: UnitModel,
    /// Materials, same indices as `tree.materials`.
    pub mats: Vec<MiscMaterial>,
    /// Per-node data, same indices as `tree.nodes`.
    pub info: Vec<NodeInfo>,
}

impl Default for MiscModel {
    fn default() -> Self {
        Self::new()
    }
}

/// Model summary (`signature` in `tests/fixtures/misc/gen.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MiscSignature {
    /// Number of meshes.
    pub meshes: u32,
    /// Number of triangles.
    pub tris: u32,
    /// FNV-1a over (geometry hash, colour, flatShading, transparent,
    /// opacity, world matrix) of every mesh in traverse order.
    pub sig: u32,
}

fn len_u32(n: usize) -> u32 {
    u32::try_from(n).unwrap_or(u32::MAX)
}

impl MiscModel {
    /// A model with an empty root group.
    #[must_use]
    pub fn new() -> Self {
        Self {
            tree: UnitModel::new(),
            mats: Vec::new(),
            info: vec![NodeInfo::default()],
        }
    }

    fn sync_info(&mut self) -> NodeId {
        let id = self.tree.nodes.len() - 1;
        self.info.resize(self.tree.nodes.len(), NodeInfo::default());
        id
    }

    /// Registers a material.
    pub fn mat(&mut self, m: MiscMaterial) -> MatId {
        let id = self.tree.untracked_mat(m.mirror());
        self.mats.push(m);
        debug_assert_eq!(id, self.mats.len() - 1);
        id
    }

    /// `parent.add(new THREE.Group())`.
    pub fn group(&mut self, parent: NodeId) -> NodeId {
        self.tree.add_group(parent);
        self.sync_info()
    }

    /// `new THREE.Group()`, not attached.
    pub fn detached_group(&mut self) -> NodeId {
        self.tree.detached_group();
        self.sync_info()
    }

    /// `parent.add(child)`.
    pub fn attach(&mut self, parent: NodeId, child: NodeId) {
        self.tree.attach(parent, child);
    }

    /// `parent.add(new THREE.Mesh(prim, material))`.
    pub fn mesh(&mut self, parent: NodeId, prim: Prim, material: MatId) -> NodeId {
        self.tree.add_mesh_id(parent, Geo::Prim(prim), material);
        self.sync_info()
    }

    /// `parent.add(new THREE.Mesh(circle-or-ring, material))`.
    pub fn custom_mesh(&mut self, parent: NodeId, geo: MiscGeo, material: MatId) -> NodeId {
        if let MiscGeo::Prim(p) = geo {
            return self.mesh(parent, p, material);
        }
        self.tree.add_group(parent);
        let id = self.sync_info();
        self.info[id].custom = Some((geo, material));
        id
    }

    /// `parent.add(new THREE.Sprite(material))`.
    pub fn sprite(&mut self, parent: NodeId, material: MatId) -> NodeId {
        self.tree.add_group(parent);
        let id = self.sync_info();
        self.info[id].sprite = Some(material);
        id
    }

    /// Transform access.
    pub fn node(&mut self, id: NodeId) -> &mut Node {
        self.tree.node(id)
    }

    /// `castShadow = true`.
    pub fn cast_shadow(&mut self, id: NodeId) {
        self.info[id].cast_shadow = true;
    }

    /// `receiveShadow = true`.
    pub fn receive_shadow(&mut self, id: NodeId) {
        self.info[id].receive_shadow = true;
    }

    /// `renderOrder = v`.
    pub fn render_order(&mut self, id: NodeId, v: i32) {
        self.info[id].render_order = v;
    }

    /// Kind of node `id`.
    #[must_use]
    pub fn kind(&self, id: NodeId) -> NodeKind {
        if self.tree.nodes[id].mesh().is_some() || self.info[id].custom.is_some() {
            NodeKind::Mesh
        } else if self.info[id].sprite.is_some() {
            NodeKind::Sprite
        } else {
            NodeKind::Group
        }
    }

    /// Geometry and material of mesh node `id`.
    #[must_use]
    pub fn mesh_of(&self, id: NodeId) -> Option<(MiscGeo, MatId)> {
        match self.tree.nodes[id].mesh() {
            Some(md) => Some((
                MiscGeo::Prim(md.geo.prim().expect("misc tree meshes are primitives")),
                md.material(),
            )),
            None => self.info[id].custom,
        }
    }

    /// Material of node `id` (mesh or sprite).
    #[must_use]
    pub fn material_of(&self, id: NodeId) -> Option<&MiscMaterial> {
        self.mesh_of(id)
            .map(|(_, m)| m)
            .or(self.info[id].sprite)
            .map(|m| &self.mats[m])
    }

    /// Pre-order traversal from the root (`Object3D.traverse`).
    #[must_use]
    pub fn traverse(&self) -> Vec<NodeId> {
        self.tree.traverse()
    }

    /// Mesh nodes in traverse order.
    #[must_use]
    pub fn meshes(&self) -> Vec<NodeId> {
        self.traverse()
            .into_iter()
            .filter(|&n| self.kind(n) == NodeKind::Mesh)
            .collect()
    }

    /// `updateMatrixWorld(true)`.
    #[must_use]
    pub fn world_matrices(&self) -> Vec<Mat4> {
        self.tree.world_matrices(None)
    }

    /// World bounding box `[min, max]` over every mesh vertex.
    #[must_use]
    pub fn bbox(&self) -> [Vec3; 2] {
        let world = self.world_matrices();
        let mut lo = Vec3::new(f64::INFINITY, f64::INFINITY, f64::INFINITY);
        let mut hi = Vec3::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY);
        for id in self.meshes() {
            let Some((geo, _)) = self.mesh_of(id) else {
                continue;
            };
            let g = geo.build();
            for v in g.positions.chunks_exact(3) {
                let p = Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2]))
                    .apply_mat4(&world[id]);
                lo = Vec3::new(js_min(lo.x, p.x), js_min(lo.y, p.y), js_min(lo.z, p.z));
                hi = Vec3::new(js_max(hi.x, p.x), js_max(hi.y, p.y), js_max(hi.z, p.z));
            }
        }
        [lo, hi]
    }

    /// Signature: same byte stream as `treeRecord` in `gen.ts`.
    #[must_use]
    pub fn signature(&self) -> MiscSignature {
        let world = self.world_matrices();
        let mut f = Fnv::default();
        let mut meshes = 0u32;
        let mut tris = 0u32;
        for id in self.meshes() {
            let Some((geo, m)) = self.mesh_of(id) else {
                continue;
            };
            let g = geo.build();
            meshes += 1;
            tris += len_u32(g.triangle_count());
            f.u32(geo_hash(&g));
            let mt = &self.mats[m];
            f.u32(mt.color);
            f.byte(u8::from(mt.flat_shading));
            f.byte(u8::from(mt.transparent));
            f.f64(mt.opacity);
            for e in world[id].e {
                f.f64(e);
            }
        }
        f.u32(meshes);
        MiscSignature {
            meshes,
            tris,
            sig: f.finish(),
        }
    }

    /// Drops every node with id `>= nodes` and every material with id
    /// `>= mats`, and detaches dropped nodes from their parents. Used to
    /// remove sub-trees that were added last (the siege camps of a marker).
    pub fn truncate(&mut self, nodes: usize, mats: usize) {
        self.tree.nodes.truncate(nodes);
        for n in &mut self.tree.nodes {
            n.children.retain(|&c| c < nodes);
        }
        self.info.truncate(nodes);
        self.tree.materials.truncate(mats);
        self.mats.truncate(mats);
    }

    /// The root id.
    #[must_use]
    pub const fn root(&self) -> NodeId {
        ROOT
    }
}
