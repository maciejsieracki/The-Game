//! One `THREE.Object3D` of a [`super::Scene`]: transform, payload (group /
//! mesh / line loop / sprite), name, shadows, `renderOrder`,
//! `matrixAutoUpdate` and `userData`.
//!
//! Transform semantics follow three r169: `rotation` (Euler) and
//! `quaternion` are kept in sync by the setters (`onRotationChange` →
//! `Quaternion.setFromEuler`, V8 `Math.sin/cos` through
//! [`Quat::from_euler`]), and the local matrix is
//! `Matrix4.compose(position, quaternion, scale)` (`Object3D.updateMatrix`).

use crate::geom::{Euler, Mat4, Quat, Vec3};

use super::geometry::Geo;

/// Index of a node inside [`super::Scene::nodes`].
pub type NodeId = usize;
/// Index of a material inside [`super::Scene::materials`].
pub type MatId = usize;

/// The root node of every scene.
pub const ROOT: NodeId = 0;

/// The drawable of a mesh or line node: geometry + material slot(s).
#[derive(Debug, Clone, PartialEq)]
pub struct MeshData {
    /// `object.geometry`.
    pub geo: Geo,
    /// `object.material` as a list of slots (one entry unless
    /// `material_array`).
    pub materials: Vec<MatId>,
    /// `Array.isArray(object.material)`.
    pub material_array: bool,
}

impl MeshData {
    /// A single-material drawable.
    #[must_use]
    pub fn new(geo: Geo, material: MatId) -> Self {
        Self {
            geo,
            materials: vec![material],
            material_array: false,
        }
    }

    /// The (first) material slot.
    #[must_use]
    pub fn material(&self) -> MatId {
        self.materials[0]
    }
}

/// What a node is (`isMesh`, `isLineLoop`, `isSprite`, or a plain
/// `Group` / `Object3D`).
#[derive(Debug, Clone, PartialEq)]
pub enum NodeKind {
    /// `THREE.Group`.
    Group,
    /// `THREE.Object3D`.
    Object3D,
    /// `THREE.Mesh` (triangles).
    Mesh(MeshData),
    /// `THREE.LineLoop`.
    LineLoop(MeshData),
    /// `THREE.Sprite` with its material slot.
    Sprite(MatId),
}

/// One value of `object.userData`.
#[derive(Debug, Clone, PartialEq)]
pub enum UserValue {
    /// A boolean.
    Bool(bool),
    /// A number.
    Num(f64),
    /// A string.
    Str(String),
    /// An array of materials of this scene (e.g. `userData.mats`).
    Mats(Vec<MatId>),
    /// An array of opaque objects of which only the length is modelled
    /// (e.g. `userData.perTokenGeos`).
    Len(usize),
    /// A nested object.
    Map(UserData),
}

/// `object.userData`: keys in insertion order (like a JS object with string
/// keys).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct UserData {
    entries: Vec<(String, UserValue)>,
}

impl UserData {
    /// `userData[key]`.
    #[must_use]
    pub fn get(&self, key: &str) -> Option<&UserValue> {
        self.entries.iter().find(|(k, _)| k == key).map(|(_, v)| v)
    }

    /// Mutable `userData[key]`.
    pub fn get_mut(&mut self, key: &str) -> Option<&mut UserValue> {
        self.entries
            .iter_mut()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v)
    }

    /// `userData[key] = value` (keeps the position of an existing key).
    pub fn set(&mut self, key: &str, value: UserValue) {
        match self.get_mut(key) {
            Some(v) => *v = value,
            None => self.entries.push((key.to_owned(), value)),
        }
    }

    /// `key in userData`.
    #[must_use]
    pub fn contains(&self, key: &str) -> bool {
        self.get(key).is_some()
    }

    /// `userData[key] === true`.
    #[must_use]
    pub fn flag(&self, key: &str) -> bool {
        matches!(self.get(key), Some(UserValue::Bool(true)))
    }

    /// A numeric entry.
    #[must_use]
    pub fn num(&self, key: &str) -> Option<f64> {
        match self.get(key) {
            Some(UserValue::Num(v)) => Some(*v),
            _ => None,
        }
    }

    /// A string entry.
    #[must_use]
    pub fn str(&self, key: &str) -> Option<&str> {
        match self.get(key) {
            Some(UserValue::Str(v)) => Some(v),
            _ => None,
        }
    }

    /// A material-list entry.
    #[must_use]
    pub fn mats(&self, key: &str) -> Option<&[MatId]> {
        match self.get(key) {
            Some(UserValue::Mats(v)) => Some(v),
            _ => None,
        }
    }

    /// The length of an array entry (`Mats` or `Len`).
    #[must_use]
    pub fn array_len(&self, key: &str) -> Option<usize> {
        match self.get(key) {
            Some(UserValue::Mats(v)) => Some(v.len()),
            Some(UserValue::Len(n)) => Some(*n),
            _ => None,
        }
    }

    /// A nested-object entry.
    #[must_use]
    pub fn map(&self, key: &str) -> Option<&Self> {
        match self.get(key) {
            Some(UserValue::Map(v)) => Some(v),
            _ => None,
        }
    }

    /// Entries in insertion order.
    pub fn iter(&self) -> impl Iterator<Item = (&str, &UserValue)> {
        self.entries.iter().map(|(k, v)| (k.as_str(), v))
    }

    /// `true` when no key is set.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

/// One `Object3D`.
#[derive(Debug, Clone, PartialEq)]
pub struct Node {
    /// `object.name`.
    pub name: String,
    /// Parent node (`None` = root or not yet attached).
    pub parent: Option<NodeId>,
    /// Children in `add()` order.
    pub children: Vec<NodeId>,
    /// `position`.
    pub position: Vec3,
    /// `rotation` (kept in sync with `quaternion` by the Euler setters).
    pub rotation: Euler,
    /// `quaternion` — what `updateMatrix()` composes.
    pub quaternion: Quat,
    /// `scale`.
    pub scale: Vec3,
    /// Payload.
    pub kind: NodeKind,
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// `renderOrder`.
    pub render_order: i32,
    /// `matrixAutoUpdate`.
    pub matrix_auto_update: bool,
    /// `userData`.
    pub user_data: UserData,
}

impl Node {
    /// A new node of `kind` with the `Object3D` defaults.
    #[must_use]
    pub fn new(kind: NodeKind) -> Self {
        Self {
            name: String::new(),
            parent: None,
            children: Vec::new(),
            position: Vec3::new(0.0, 0.0, 0.0),
            rotation: Euler::default(),
            quaternion: Quat::default(),
            scale: Vec3::new(1.0, 1.0, 1.0),
            kind,
            cast_shadow: false,
            receive_shadow: false,
            render_order: 0,
            matrix_auto_update: true,
            user_data: UserData::default(),
        }
    }

    /// `position.set(x, y, z)`.
    pub fn set_pos(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.position = Vec3::new(x, y, z);
        self
    }

    /// `position.copy(v)`.
    pub fn set_pos_v(&mut self, v: Vec3) -> &mut Self {
        self.position = v;
        self
    }

    /// `rotation.x = v` (recomputes the quaternion like `onRotationChange`).
    pub fn rot_x(&mut self, v: f64) -> &mut Self {
        self.rotation.x = v;
        self.quaternion = Quat::from_euler(self.rotation);
        self
    }

    /// `rotation.y = v`.
    pub fn rot_y(&mut self, v: f64) -> &mut Self {
        self.rotation.y = v;
        self.quaternion = Quat::from_euler(self.rotation);
        self
    }

    /// `rotation.z = v`.
    pub fn rot_z(&mut self, v: f64) -> &mut Self {
        self.rotation.z = v;
        self.quaternion = Quat::from_euler(self.rotation);
        self
    }

    /// `rotation.set(x, y, z)` (keeps the order).
    pub fn set_rot(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.rotation.x = x;
        self.rotation.y = y;
        self.rotation.z = z;
        self.quaternion = Quat::from_euler(self.rotation);
        self
    }

    /// `rotation.copy(e)` (order included).
    pub fn set_rotation(&mut self, e: Euler) -> &mut Self {
        self.rotation = e;
        self.quaternion = Quat::from_euler(self.rotation);
        self
    }

    /// `quaternion.setFromUnitVectors(from, to)` (Three r169
    /// `Quaternion.js:352-392`, then `normalize()`); `rotation` is left as
    /// is, like the unit builders that never read it back.
    pub fn quat_from_unit_vectors(&mut self, from: Vec3, to: Vec3) -> &mut Self {
        self.quaternion = quat_from_unit_vectors(from, to);
        self
    }

    /// `scale.set(x, y, z)`.
    pub fn set_scale(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.scale = Vec3::new(x, y, z);
        self
    }

    /// `scale.setScalar(s)`.
    pub fn set_scale_scalar(&mut self, s: f64) -> &mut Self {
        self.scale = Vec3::new(s, s, s);
        self
    }

    /// `object.name = name`.
    pub fn set_name(&mut self, name: &str) -> &mut Self {
        self.name = name.to_owned();
        self
    }

    /// `castShadow` / `receiveShadow`.
    pub fn shadows(&mut self, cast: bool, receive: bool) -> &mut Self {
        self.cast_shadow = cast;
        self.receive_shadow = receive;
        self
    }

    /// The local matrix of `Object3D.updateMatrix()`.
    #[must_use]
    pub fn local_matrix(&self) -> Mat4 {
        Mat4::compose(self.position, self.quaternion, self.scale)
    }

    /// The drawable of a mesh or line node.
    #[must_use]
    pub const fn mesh(&self) -> Option<&MeshData> {
        match &self.kind {
            NodeKind::Mesh(m) | NodeKind::LineLoop(m) => Some(m),
            _ => None,
        }
    }

    /// Mutable drawable.
    pub fn mesh_mut(&mut self) -> Option<&mut MeshData> {
        match &mut self.kind {
            NodeKind::Mesh(m) | NodeKind::LineLoop(m) => Some(m),
            _ => None,
        }
    }

    /// `object.isMesh`.
    #[must_use]
    pub const fn is_mesh(&self) -> bool {
        matches!(self.kind, NodeKind::Mesh(_))
    }

    /// `object.isLineLoop`.
    #[must_use]
    pub const fn is_line_loop(&self) -> bool {
        matches!(self.kind, NodeKind::LineLoop(_))
    }

    /// `object.isSprite`.
    #[must_use]
    pub const fn is_sprite(&self) -> bool {
        matches!(self.kind, NodeKind::Sprite(_))
    }

    /// Material slot of a sprite.
    #[must_use]
    pub const fn sprite_material(&self) -> Option<MatId> {
        match self.kind {
            NodeKind::Sprite(m) => Some(m),
            _ => None,
        }
    }

    /// `object.type` of three r169.
    #[must_use]
    pub const fn three_type(&self) -> &'static str {
        match self.kind {
            NodeKind::Group => "Group",
            NodeKind::Object3D => "Object3D",
            NodeKind::Mesh(_) => "Mesh",
            NodeKind::LineLoop(_) => "LineLoop",
            NodeKind::Sprite(_) => "Sprite",
        }
    }
}

/// `Quaternion.setFromUnitVectors(vFrom, vTo)` + `normalize()`.
#[must_use]
pub fn quat_from_unit_vectors(v_from: Vec3, v_to: Vec3) -> Quat {
    let mut r = v_from.dot(v_to) + 1.0;
    let (x, y, z, w);
    if r < f64::EPSILON {
        r = 0.0;
        if v_from.x.abs() > v_from.z.abs() {
            x = -v_from.y;
            y = v_from.x;
            z = 0.0;
            w = r;
        } else {
            x = 0.0;
            y = -v_from.z;
            z = v_from.y;
            w = r;
        }
    } else {
        x = v_from.y * v_to.z - v_from.z * v_to.y;
        y = v_from.z * v_to.x - v_from.x * v_to.z;
        z = v_from.x * v_to.y - v_from.y * v_to.x;
        w = r;
    }
    let l = (x * x + y * y + z * z + w * w).sqrt();
    if l == 0.0 {
        Quat::default()
    } else {
        let l = 1.0 / l;
        Quat {
            x: x * l,
            y: y * l,
            z: z * l,
            w: w * l,
        }
    }
}
