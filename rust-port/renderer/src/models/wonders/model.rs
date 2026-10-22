//! Object-graph types of a wonder model: the CPU equivalent of the
//! `THREE.Group` / `THREE.Mesh` tree that `buildWonderModel` returns.

use super::js_trig::{js_cos, js_sin};
use crate::geom::{
    box_geometry, cone_geometry, cylinder_geometry, Euler, EulerOrder, Mat4, Mesh, Quat, Vec3,
};
use crate::pick::three::{js_max, js_min};
use crate::terrain::color::Color;

/// Geometry of one mesh, with the Three.js constructor arguments the web
/// passes (all other arguments are the Three.js defaults).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Primitive {
    /// `new THREE.BoxGeometry(width, height, depth)`.
    Box {
        /// Width (x).
        width: f64,
        /// Height (y).
        height: f64,
        /// Depth (z).
        depth: f64,
    },
    /// `new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)`.
    Cylinder {
        /// Top radius.
        radius_top: f64,
        /// Bottom radius.
        radius_bottom: f64,
        /// Height.
        height: f64,
        /// Radial segments.
        radial_segments: u32,
    },
    /// `new THREE.ConeGeometry(radius, height, radialSegments)`.
    Cone {
        /// Base radius.
        radius: f64,
        /// Height.
        height: f64,
        /// Radial segments.
        radial_segments: u32,
    },
}

impl Primitive {
    /// Builds the CPU geometry (vertex-for-vertex Three.js r169, see [`crate::geom`]).
    #[must_use]
    pub fn geometry(&self) -> Mesh {
        match *self {
            Self::Box {
                width,
                height,
                depth,
            } => box_geometry(width, height, depth, 1, 1, 1),
            Self::Cylinder {
                radius_top,
                radius_bottom,
                height,
                radial_segments,
            } => cylinder_geometry(
                radius_top,
                radius_bottom,
                height,
                radial_segments,
                1,
                false,
                0.0,
                std::f64::consts::PI * 2.0,
            ),
            Self::Cone {
                radius,
                height,
                radial_segments,
            } => cone_geometry(
                radius,
                height,
                radial_segments,
                1,
                false,
                0.0,
                std::f64::consts::PI * 2.0,
            ),
        }
    }
}

/// `new THREE.MeshLambertMaterial({ color, flatShading: true })` as data
/// (`wonderModels.ts:28-30`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LambertMaterial {
    /// sRGB colour passed to the constructor (already greyed for ruins).
    pub color: u32,
    /// `flatShading` (always `true` for wonders).
    pub flat_shading: bool,
}

impl LambertMaterial {
    /// `material.color` in the linear working space (`Color.setHex`).
    #[must_use]
    pub fn linear_color(&self) -> Color {
        Color::from_hex(self.color)
    }
}

/// Index of a shared material in [`WonderModel::materials`], in the key
/// order of the web `mats` object (`wonderModels.ts:430-451`). The owner
/// banner material, when present, follows at index [`MaterialSlot::COUNT`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[allow(missing_docs)]
pub enum MaterialSlot {
    Sand,
    Stone,
    White,
    Gold,
    Brick,
    Leaf,
    Water,
    Bronze,
    Rock,
    Cave,
    Wood,
    Thatch,
    Mud,
    Clay,
    Earth,
    Red,
    Roof,
    Wall,
    Dark,
    Iron,
}

impl MaterialSlot {
    /// Number of shared materials (`Object.values(mats).length`).
    pub const COUNT: usize = 20;

    /// Index into [`WonderModel::materials`].
    #[must_use]
    pub const fn index(self) -> usize {
        self as usize
    }
}

/// Base colours of the shared materials, in [`MaterialSlot`] order
/// (`wonderModels.ts:431-450`).
pub const WONDER_MATERIAL_COLORS: [u32; MaterialSlot::COUNT] = [
    0x00d4_b878, // sand
    0x009a_9088, // stone
    0x00e8_e4dc, // white
    0x00c8_a040, // gold
    0x00a0_6848, // brick
    0x004a_8a40, // leaf
    0x005a_adbe, // water
    0x00b8_8850, // bronze
    0x00c8_7868, // rock
    0x003a_3028, // cave
    0x007a_5838, // wood
    0x00b8_a060, // thatch
    0x008a_7050, // mud
    0x00b0_7050, // clay
    0x006a_5038, // earth
    0x00a8_3838, // red
    0x002a_2828, // roof
    0x007a_7870, // wall
    0x004a_4038, // dark
    0x0055_5558, // iron
];

/// What a [`Node`] is.
#[derive(Debug, Clone, PartialEq)]
pub enum NodeKind {
    /// `THREE.Group`.
    Group,
    /// `THREE.Mesh(geometry, material)`.
    Mesh {
        /// Geometry.
        primitive: Primitive,
        /// Index into [`WonderModel::materials`].
        material: usize,
    },
}

/// One `Object3D` of the model with its local transform and shadow flags.
#[derive(Debug, Clone, PartialEq)]
pub struct Node {
    /// Group or mesh.
    pub kind: NodeKind,
    /// `object.position`.
    pub position: Vec3,
    /// `object.rotation` (order `XYZ`).
    pub rotation: Euler,
    /// `object.scale`.
    pub scale: Vec3,
    /// `object.castShadow`.
    pub cast_shadow: bool,
    /// `object.receiveShadow`.
    pub receive_shadow: bool,
    /// `object.children`, in insertion order.
    pub children: Vec<Node>,
}

impl Node {
    /// A new `THREE.Group` (identity transform, no shadows).
    #[must_use]
    pub fn group() -> Self {
        Self::with_kind(NodeKind::Group)
    }

    /// A new `THREE.Mesh` (identity transform, no shadows).
    #[must_use]
    pub fn mesh(primitive: Primitive, material: usize) -> Self {
        Self::with_kind(NodeKind::Mesh {
            primitive,
            material,
        })
    }

    fn with_kind(kind: NodeKind) -> Self {
        Self {
            kind,
            position: Vec3::new(0.0, 0.0, 0.0),
            rotation: Euler::xyz(0.0, 0.0, 0.0),
            scale: Vec3::new(1.0, 1.0, 1.0),
            cast_shadow: false,
            receive_shadow: false,
            children: Vec::new(),
        }
    }

    /// `object.matrix` after `updateMatrix()`: `compose(position, quaternion, scale)`.
    #[must_use]
    pub fn local_matrix(&self) -> Mat4 {
        Mat4::compose(self.position, quat_from_euler_js(self.rotation), self.scale)
    }

    /// Pre-order traversal (`Object3D.traverse`): calls `f(node, parent
    /// index, world matrix)`; indices count nodes in visiting order and the
    /// root has parent `None`. `parent_world` is the world matrix of the
    /// parent of `self` (`None` = `self` is a scene-graph root, whose
    /// `matrixWorld` is a copy of its `matrix`).
    pub fn traverse<F: FnMut(&Node, Option<usize>, &Mat4)>(
        &self,
        parent_world: Option<&Mat4>,
        f: &mut F,
    ) {
        let mut counter = 0usize;
        self.traverse_inner(parent_world, None, &mut counter, f);
    }

    fn traverse_inner<F: FnMut(&Node, Option<usize>, &Mat4)>(
        &self,
        parent_world: Option<&Mat4>,
        parent: Option<usize>,
        counter: &mut usize,
        f: &mut F,
    ) {
        let local = self.local_matrix();
        let world = match parent_world {
            Some(p) => p.mul(&local),
            None => local,
        };
        let me = *counter;
        *counter += 1;
        f(self, parent, &world);
        for c in &self.children {
            c.traverse_inner(Some(&world), Some(me), counter, f);
        }
    }
}

/// `Quaternion.setFromEuler(euler)` (three r169, order `XYZ`) with V8's
/// `Math.sin`/`Math.cos` ([`js_sin`]/[`js_cos`]) instead of the platform
/// functions that [`Quat::from_euler`] uses. Wonder nodes only ever rotate
/// about Y in `XYZ` order (`wonderModels.ts:294,318`); other orders fall
/// back to [`Quat::from_euler`].
#[must_use]
fn quat_from_euler_js(eu: Euler) -> Quat {
    if eu.order != EulerOrder::Xyz {
        return Quat::from_euler(eu);
    }
    let c1 = js_cos(eu.x / 2.0);
    let c2 = js_cos(eu.y / 2.0);
    let c3 = js_cos(eu.z / 2.0);
    let s1 = js_sin(eu.x / 2.0);
    let s2 = js_sin(eu.y / 2.0);
    let s3 = js_sin(eu.z / 2.0);
    Quat {
        x: s1 * c2 * c3 + c1 * s2 * s3,
        y: c1 * s2 * c3 - s1 * c2 * s3,
        z: c1 * c2 * s3 + s1 * s2 * c3,
        w: c1 * c2 * c3 - s1 * s2 * s3,
    }
}

/// A mesh of a model in world space (input for instancing / drawing).
#[derive(Debug, Clone, PartialEq)]
pub struct WorldMesh {
    /// Geometry.
    pub primitive: Primitive,
    /// Material (resolved from the model's list).
    pub material: LambertMaterial,
    /// `mesh.matrixWorld`.
    pub world: Mat4,
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
}

/// A built wonder model: the root group plus its materials.
#[derive(Debug, Clone, PartialEq)]
pub struct WonderModel {
    /// Root `THREE.Group` (identity transform as built).
    pub root: Node,
    /// Materials: the 20 shared ones in [`MaterialSlot`] order (= the web
    /// `userData.mats`), then the banner material if the model has a banner.
    pub materials: Vec<LambertMaterial>,
}

impl WonderModel {
    /// Number of shared materials registered in `userData.mats` (always 20).
    #[must_use]
    pub fn user_data_material_count(&self) -> usize {
        MaterialSlot::COUNT
    }

    /// Banner material (`ownerBanner`), if the model has a banner.
    #[must_use]
    pub fn banner_material(&self) -> Option<&LambertMaterial> {
        self.materials.get(MaterialSlot::COUNT)
    }

    /// Every mesh in traversal order with its world matrix, the root placed
    /// with `root_parent` as its parent's world matrix (`None` = no parent).
    #[must_use]
    pub fn world_meshes(&self, root_parent: Option<&Mat4>) -> Vec<WorldMesh> {
        let mut out = Vec::new();
        self.root.traverse(root_parent, &mut |n, _, w| {
            if let NodeKind::Mesh {
                primitive,
                material,
            } = &n.kind
            {
                out.push(WorldMesh {
                    primitive: *primitive,
                    material: self.materials[*material],
                    world: *w,
                    cast_shadow: n.cast_shadow,
                    receive_shadow: n.receive_shadow,
                });
            }
        });
        out
    }

    /// `new THREE.Box3().setFromObject(root, true)` (precise: every vertex
    /// read from the `Float32` position attribute and transformed by the
    /// mesh `matrixWorld`). Returns `[min.x, min.y, min.z, max.x, max.y, max.z]`.
    #[must_use]
    pub fn bounding_box(&self, root_parent: Option<&Mat4>) -> [f64; 6] {
        let mut b = [
            f64::INFINITY,
            f64::INFINITY,
            f64::INFINITY,
            f64::NEG_INFINITY,
            f64::NEG_INFINITY,
            f64::NEG_INFINITY,
        ];
        for m in self.world_meshes(root_parent) {
            let g = m.primitive.geometry();
            for v in g.positions.chunks_exact(3) {
                let p = Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2]))
                    .apply_mat4(&m.world);
                b[0] = js_min(b[0], p.x);
                b[1] = js_min(b[1], p.y);
                b[2] = js_min(b[2], p.z);
                b[3] = js_max(b[3], p.x);
                b[4] = js_max(b[4], p.y);
                b[5] = js_max(b[5], p.z);
            }
        }
        b
    }

    /// Number of mesh nodes.
    #[must_use]
    pub fn mesh_count(&self) -> usize {
        let mut n = 0;
        self.root.traverse(None, &mut |node, _, _| {
            if matches!(node.kind, NodeKind::Mesh { .. }) {
                n += 1;
            }
        });
        n
    }

    /// Number of nodes (groups and meshes, root included).
    #[must_use]
    pub fn node_count(&self) -> usize {
        let mut n = 0;
        self.root.traverse(None, &mut |_, _, _| n += 1);
        n
    }
}
