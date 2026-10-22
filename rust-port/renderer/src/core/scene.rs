//! Minimal CPU scene graph: the subset of `THREE.Object3D` / `Mesh` /
//! `Material` that the web helpers of MOD-01 read or write (`fogDim.ts`,
//! `mergeDecor.ts`), and that the model topics (MOD-02..MOD-13) will build.
//!
//! No GPU upload, no shaders: a model is a tree of [`SceneNode`]s whose
//! meshes carry CPU geometry ([`Geometry`] = [`crate::geom::Mesh`] + an
//! optional per-vertex `color` attribute) and material parameters as data
//! ([`Material`]). The type is added here (dispatch: "a MINIMAL type in your
//! own module, do not change `geom/**`") because `geom::Mesh` has no colour
//! attribute and there is no node/transform type in the crate yet.
//!
//! Transform semantics follow three r169: the local matrix is
//! `Matrix4.compose(position, quaternion, scale)` with the quaternion from
//! `Quaternion.setFromEuler(rotation)` (`Object3D.updateMatrix`).

use std::sync::Arc;

use crate::geom::{Euler, Mat4, Mesh, Quat, Vec3};
use crate::terrain::color::Color;

/// Material class, which matters because `fogDim.ts` dims by **exact
/// constructor** (`DIM_MAT_TYPES.has(mat.constructor)`, `fogDim.ts:9-14`):
/// subclasses such as `MeshPhysicalMaterial` are *not* dimmed.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum MaterialKind {
    /// `MeshLambertMaterial` (dimmed).
    Lambert,
    /// `MeshStandardMaterial` (dimmed).
    Standard,
    /// `MeshBasicMaterial` (dimmed).
    Basic,
    /// `MeshPhongMaterial` (dimmed).
    Phong,
    /// `MeshPhysicalMaterial` (subclass of Standard: not dimmed).
    Physical,
    /// `MeshToonMaterial` (not dimmed).
    Toon,
    /// `MeshNormalMaterial` (no `color`).
    Normal,
    /// `SpriteMaterial` (used on sprites, never on meshes).
    Sprite,
}

impl MaterialKind {
    /// `material.type` string of three r169.
    #[must_use]
    pub fn three_type(self) -> &'static str {
        match self {
            Self::Lambert => "MeshLambertMaterial",
            Self::Standard => "MeshStandardMaterial",
            Self::Basic => "MeshBasicMaterial",
            Self::Phong => "MeshPhongMaterial",
            Self::Physical => "MeshPhysicalMaterial",
            Self::Toon => "MeshToonMaterial",
            Self::Normal => "MeshNormalMaterial",
            Self::Sprite => "SpriteMaterial",
        }
    }

    /// Whether the class has a `color` property (all except `Normal`).
    #[must_use]
    pub fn has_color(self) -> bool {
        !matches!(self, Self::Normal)
    }
}

/// Material parameters as data.
#[derive(Clone, Debug, PartialEq)]
pub struct Material {
    /// Class.
    pub kind: MaterialKind,
    /// `material.color` in the working (linear sRGB) space; `None` for
    /// classes without colour.
    pub color: Option<Color>,
    /// `vertexColors`.
    pub vertex_colors: bool,
    /// `flatShading`.
    pub flat_shading: bool,
    /// `userData.fogBaseColor` written by `applyFogDimToObject3D`.
    pub fog_base_color: Option<Color>,
}

impl Material {
    /// `new <Kind>Material({ color })`; `color` is an sRGB hex like in the
    /// web (`Color.setHex`), white (`0xffffff`) when `None` — the three r169
    /// default for every class with a colour.
    #[must_use]
    pub fn new(kind: MaterialKind, color: Option<u32>) -> Self {
        let color = kind
            .has_color()
            .then(|| Color::from_hex(color.unwrap_or(0x00ff_ffff)));
        Self {
            kind,
            color,
            vertex_colors: false,
            flat_shading: false,
            fog_base_color: None,
        }
    }

    /// `new MeshLambertMaterial({ color })`.
    #[must_use]
    pub fn lambert(color: u32) -> Self {
        Self::new(MaterialKind::Lambert, Some(color))
    }
}

/// CPU geometry of a mesh: the `position` / `normal` / `uv` / `index` of
/// [`Mesh`] plus the optional `color` attribute (3 floats per vertex, like a
/// `Float32BufferAttribute`).
#[derive(Clone, Debug, PartialEq, Default)]
pub struct Geometry {
    /// Positions, normals, UVs, index and groups.
    pub mesh: Mesh,
    /// `geometry.getAttribute('color')`.
    pub colors: Option<Vec<f32>>,
}

impl From<Mesh> for Geometry {
    fn from(mesh: Mesh) -> Self {
        Self { mesh, colors: None }
    }
}

/// What a node is (`isMesh`, `isSprite`, or a plain `Group`/`Object3D`).
#[derive(Clone, Debug, PartialEq)]
pub enum NodeKind {
    /// `THREE.Object3D`.
    Object3D,
    /// `THREE.Group`.
    Group,
    /// `THREE.Mesh`. Geometry is shared like in three (singleton geometries
    /// of decor models).
    Mesh {
        /// `mesh.geometry`.
        geometry: Arc<Geometry>,
        /// `mesh.material` as a list.
        materials: Vec<Material>,
        /// `Array.isArray(mesh.material)`; when `false`, `materials` holds
        /// exactly one entry.
        material_array: bool,
    },
    /// `THREE.Sprite` (not a mesh: skipped by fog and merge).
    Sprite {
        /// `sprite.material`.
        material: Material,
    },
}

/// One `Object3D` with its local transform and children.
#[derive(Clone, Debug, PartialEq)]
pub struct SceneNode {
    /// Kind and payload.
    pub kind: NodeKind,
    /// `position`.
    pub position: Vec3,
    /// `rotation` (Euler, with order).
    pub rotation: Euler,
    /// `scale`.
    pub scale: Vec3,
    /// `children`, in `add` order.
    pub children: Vec<SceneNode>,
    /// `userData.civMergedDecor === true` (`MERGED_DECOR_FLAG`).
    pub merged_decor: bool,
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// `matrixAutoUpdate`.
    pub matrix_auto_update: bool,
}

impl SceneNode {
    fn with_kind(kind: NodeKind) -> Self {
        Self {
            kind,
            position: Vec3::new(0.0, 0.0, 0.0),
            rotation: Euler::default(),
            scale: Vec3::new(1.0, 1.0, 1.0),
            children: Vec::new(),
            merged_decor: false,
            cast_shadow: false,
            receive_shadow: false,
            matrix_auto_update: true,
        }
    }

    /// `new THREE.Group()`.
    #[must_use]
    pub fn group() -> Self {
        Self::with_kind(NodeKind::Group)
    }

    /// `new THREE.Object3D()`.
    #[must_use]
    pub fn object3d() -> Self {
        Self::with_kind(NodeKind::Object3D)
    }

    /// `new THREE.Mesh(geometry, material)` with a single material.
    #[must_use]
    pub fn mesh(geometry: Arc<Geometry>, material: Material) -> Self {
        Self::with_kind(NodeKind::Mesh {
            geometry,
            materials: vec![material],
            material_array: false,
        })
    }

    /// `new THREE.Mesh(geometry, [materials...])`.
    #[must_use]
    pub fn mesh_multi(geometry: Arc<Geometry>, materials: Vec<Material>) -> Self {
        Self::with_kind(NodeKind::Mesh {
            geometry,
            materials,
            material_array: true,
        })
    }

    /// `new THREE.Sprite(material)`.
    #[must_use]
    pub fn sprite(material: Material) -> Self {
        Self::with_kind(NodeKind::Sprite { material })
    }

    /// `mesh.isMesh`.
    #[must_use]
    pub fn is_mesh(&self) -> bool {
        matches!(self.kind, NodeKind::Mesh { .. })
    }

    /// `add(child)`.
    pub fn add(&mut self, child: SceneNode) {
        self.children.push(child);
    }

    /// The local matrix of `Object3D.updateMatrix()`.
    #[must_use]
    pub fn local_matrix(&self) -> Mat4 {
        Mat4::compose(self.position, Quat::from_euler(self.rotation), self.scale)
    }

    /// `Object3D.traverse(cb)`: pre-order, the node itself first, children in
    /// `add` order.
    pub fn traverse<'a>(&'a self, f: &mut impl FnMut(&'a SceneNode)) {
        f(self);
        for c in &self.children {
            c.traverse(f);
        }
    }

    /// Mutable pre-order traversal (same order as [`Self::traverse`]).
    pub fn traverse_mut(&mut self, f: &mut impl FnMut(&mut SceneNode)) {
        f(self);
        for c in &mut self.children {
            c.traverse_mut(f);
        }
    }
}
