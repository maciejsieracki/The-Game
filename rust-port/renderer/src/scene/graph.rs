//! [`Scene`]: the ONE object-tree type of the renderer's model layer — an
//! arena of [`Node`]s (index [`ROOT`] = the object a web builder returns)
//! plus the [`Material`]s the meshes reference by slot (shared like three
//! material objects).
//!
//! Construction mirrors the web: `parent.add(new THREE.Mesh(geo, mat))` is
//! [`Scene::add_mesh`], `new THREE.Group()` not yet attached is
//! [`Scene::detached_group`] and `parent.add(child)` is [`Scene::attach`];
//! a sub-tree built as its own [`Scene`] is moved in with [`Scene::graft`].

use crate::geom::{Mat4, Vec3};
use crate::pick::three::{js_max, js_min};
use crate::terrain::color::Color;

use super::geometry::Geo;
use super::material::{Material, MaterialKind};
use super::node::{MatId, MeshData, Node, NodeId, NodeKind, UserData, UserValue, ROOT};

/// An object tree with its materials.
#[derive(Debug, Clone, PartialEq)]
pub struct Scene {
    /// All nodes; [`ROOT`] is the returned object.
    pub nodes: Vec<Node>,
    /// All materials referenced by meshes / sprites, in creation order.
    pub materials: Vec<Material>,
}

impl Default for Scene {
    fn default() -> Self {
        Self::new()
    }
}

/// A mesh or line of a scene in world space (input for instancing /
/// drawing, see [`super::export`]).
#[derive(Debug, Clone, PartialEq)]
pub struct WorldMesh {
    /// Node id.
    pub node: NodeId,
    /// `true` for a `THREE.LineLoop`.
    pub line_loop: bool,
    /// Geometry.
    pub geo: Geo,
    /// Material slots.
    pub materials: Vec<MatId>,
    /// `matrixWorld`.
    pub world: Mat4,
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// `renderOrder`.
    pub render_order: i32,
}

impl Scene {
    /// A scene whose root is an empty `THREE.Group`.
    #[must_use]
    pub fn new() -> Self {
        Self::with_root(NodeKind::Group)
    }

    /// A scene whose root is a node of `kind`.
    #[must_use]
    pub fn with_root(kind: NodeKind) -> Self {
        Self {
            nodes: vec![Node::new(kind)],
            materials: Vec::new(),
        }
    }

    /// A scene whose root is `new THREE.Mesh(geo, material)`.
    #[must_use]
    pub fn mesh_root(geo: impl Into<Geo>, material: Material) -> Self {
        let mut s = Self::with_root(NodeKind::Group);
        let m = s.add_material(material);
        s.nodes[ROOT].kind = NodeKind::Mesh(MeshData::new(geo.into(), m));
        s
    }

    /// Sets the root `name` (builder style).
    #[must_use]
    pub fn named(mut self, name: &str) -> Self {
        self.nodes[ROOT].name = name.to_owned();
        self
    }

    // ------------------------------------------------------------ materials

    /// Registers a material (not tracked in `userData.mats`).
    pub fn add_material(&mut self, m: Material) -> MatId {
        self.materials.push(m);
        self.materials.len() - 1
    }

    /// Alias of [`Self::add_material`] (unit-core name).
    pub fn untracked_mat(&mut self, m: Material) -> MatId {
        self.add_material(m)
    }

    /// Per-token material factory `mat(color, metalness, roughness)` of the
    /// unit builders (`makeMatFactory`, `units.ts:748-760`): a
    /// `MeshStandardMaterial`, pushed to the root `userData.mats`.
    pub fn mat(&mut self, color: u32, metalness: f64, roughness: f64) -> MatId {
        let id = self.add_material(Material::standard(color, metalness, roughness));
        self.track(id);
        id
    }

    /// Pushes `id` to the root `userData.mats` list.
    pub fn track(&mut self, id: MatId) {
        let ud = &mut self.nodes[ROOT].user_data;
        match ud.get_mut("mats") {
            Some(UserValue::Mats(v)) => v.push(id),
            _ => ud.set("mats", UserValue::Mats(vec![id])),
        }
    }

    /// The root `userData.mats` list (empty when unset).
    #[must_use]
    pub fn tracked(&self) -> &[MatId] {
        self.nodes[ROOT].user_data.mats("mats").unwrap_or(&[])
    }

    /// `new MeshLambertMaterial({ color, flatShading })` (hex colour).
    pub fn lambert_mat(&mut self, color: u32, flat_shading: bool) -> MatId {
        let mut m = Material::lambert(color);
        m.flat_shading = flat_shading;
        self.add_material(m)
    }

    /// `new MeshLambertMaterial({ color: <THREE.Color>, flatShading })`.
    pub fn lambert_color(&mut self, color: Color, flat_shading: bool) -> MatId {
        let mut m = Material::with_color(MaterialKind::Lambert, Some(color));
        m.flat_shading = flat_shading;
        self.add_material(m)
    }

    /// Re-tints every tracked material whose colour is `from` to `to`;
    /// returns how many changed (`retint`, `units.ts:1410-1417`).
    pub fn retint(&mut self, from: u32, to: u32) -> u32 {
        let mut n = 0;
        let tracked = self.tracked().to_vec();
        for m in tracked {
            if self.materials[m].hex() == from {
                self.materials[m].set_hex(to);
                n += 1;
            }
        }
        n
    }

    // ---------------------------------------------------------------- nodes

    /// Node access.
    pub fn node(&mut self, id: NodeId) -> &mut Node {
        &mut self.nodes[id]
    }

    /// The root node.
    pub fn root_mut(&mut self) -> &mut Node {
        &mut self.nodes[ROOT]
    }

    /// The root id ([`ROOT`]).
    #[must_use]
    pub const fn root(&self) -> NodeId {
        ROOT
    }

    /// Adds a node of `kind`, attached to `parent` when given.
    pub fn push(&mut self, parent: Option<NodeId>, kind: NodeKind) -> NodeId {
        self.nodes.push(Node::new(kind));
        let id = self.nodes.len() - 1;
        if let Some(p) = parent {
            self.attach(p, id);
        }
        id
    }

    /// `parent.add(new THREE.Mesh(geo, material))`.
    pub fn add_mesh(&mut self, parent: NodeId, geo: impl Into<Geo>, material: MatId) -> &mut Node {
        let id = self.add_mesh_id(parent, geo, material);
        &mut self.nodes[id]
    }

    /// Like [`Self::add_mesh`], returning the id.
    pub fn add_mesh_id(&mut self, parent: NodeId, geo: impl Into<Geo>, material: MatId) -> NodeId {
        self.push(
            Some(parent),
            NodeKind::Mesh(MeshData::new(geo.into(), material)),
        )
    }

    /// Alias of [`Self::add_mesh_id`].
    pub fn mesh(&mut self, parent: NodeId, geo: impl Into<Geo>, material: MatId) -> NodeId {
        self.add_mesh_id(parent, geo, material)
    }

    /// `new THREE.Mesh(geo, material)`, not attached.
    pub fn detached_mesh(&mut self, geo: impl Into<Geo>, material: MatId) -> NodeId {
        self.push(None, NodeKind::Mesh(MeshData::new(geo.into(), material)))
    }

    /// `parent.add(new THREE.Mesh(geo, [materials...]))`.
    pub fn add_mesh_multi(
        &mut self,
        parent: NodeId,
        geo: impl Into<Geo>,
        materials: Vec<MatId>,
    ) -> NodeId {
        self.push(
            Some(parent),
            NodeKind::Mesh(MeshData {
                geo: geo.into(),
                materials,
                material_array: true,
            }),
        )
    }

    /// `parent.add(new THREE.LineLoop(geo, material))`.
    pub fn add_line_loop(
        &mut self,
        parent: NodeId,
        geo: impl Into<Geo>,
        material: MatId,
    ) -> NodeId {
        self.push(
            Some(parent),
            NodeKind::LineLoop(MeshData::new(geo.into(), material)),
        )
    }

    /// `parent.add(new THREE.Sprite(material))`.
    pub fn sprite(&mut self, parent: NodeId, material: MatId) -> NodeId {
        self.push(Some(parent), NodeKind::Sprite(material))
    }

    /// `parent.add(new THREE.Group())`.
    pub fn add_group(&mut self, parent: NodeId) -> NodeId {
        self.push(Some(parent), NodeKind::Group)
    }

    /// Alias of [`Self::add_group`].
    pub fn group(&mut self, parent: NodeId) -> NodeId {
        self.add_group(parent)
    }

    /// `parent.add(new THREE.Object3D())`.
    pub fn add_object3d(&mut self, parent: NodeId) -> NodeId {
        self.push(Some(parent), NodeKind::Object3D)
    }

    /// `new THREE.Group()` not yet attached anywhere.
    pub fn detached_group(&mut self) -> NodeId {
        self.push(None, NodeKind::Group)
    }

    /// Alias of [`Self::detached_group`].
    pub fn detached(&mut self) -> NodeId {
        self.detached_group()
    }

    /// `parent.add(child)` (child must be detached).
    pub fn attach(&mut self, parent: NodeId, child: NodeId) {
        debug_assert!(self.nodes[child].parent.is_none());
        self.nodes[child].parent = Some(parent);
        self.nodes[parent].children.push(child);
    }

    /// Moves every node and material of `other` into `self` and attaches
    /// `other`'s root under `parent` (`parent.add(otherRoot)`). Material
    /// slots and node ids of `other` are shifted; returns the new id of
    /// `other`'s root.
    pub fn graft(&mut self, parent: NodeId, other: Self) -> NodeId {
        let root = self.graft_detached(other);
        self.attach(parent, root);
        root
    }

    /// Like [`Self::graft`] without attaching (the root stays detached).
    pub fn graft_detached(&mut self, other: Self) -> NodeId {
        let node_base = self.nodes.len();
        let mat_base = self.materials.len();
        self.materials.extend(other.materials);
        for mut n in other.nodes {
            n.parent = n.parent.map(|p| p + node_base);
            for c in &mut n.children {
                *c += node_base;
            }
            shift_materials(&mut n, mat_base);
            self.nodes.push(n);
        }
        node_base
    }

    /// Moves the children of `other`'s root (with their sub-trees and every
    /// material of `other`) under `parent`; `other`'s root itself is
    /// dropped (it must be an untransformed group). Used where the web
    /// re-parents the content of a built group.
    pub fn graft_children(&mut self, parent: NodeId, other: &Self) {
        let node_base = self.nodes.len();
        let mat_base = self.materials.len();
        self.materials.extend(other.materials.iter().copied());
        let map = |id: NodeId| -> NodeId {
            if id == ROOT {
                parent
            } else {
                node_base + id - 1
            }
        };
        for n in other.nodes.iter().skip(1) {
            let mut c = n.clone();
            c.parent = n.parent.map(map);
            c.children = n.children.iter().map(|&k| map(k)).collect();
            shift_materials(&mut c, mat_base);
            self.nodes.push(c);
        }
        for &k in &other.nodes[ROOT].children {
            self.nodes[parent].children.push(map(k));
        }
    }

    /// Drops every node with id `>= nodes` and every material with id
    /// `>= mats`, and detaches dropped nodes from their parents (removes
    /// sub-trees that were added last).
    pub fn truncate(&mut self, nodes: usize, mats: usize) {
        self.nodes.truncate(nodes);
        for n in &mut self.nodes {
            n.children.retain(|&c| c < nodes);
        }
        self.materials.truncate(mats);
    }

    // -------------------------------------------------- transform shortcuts

    /// `object.position.set(x, y, z)`.
    pub fn set_pos(&mut self, id: NodeId, x: f64, y: f64, z: f64) {
        self.nodes[id].set_pos(x, y, z);
    }

    /// `object.rotation.set(x, y, z)`.
    pub fn set_rot(&mut self, id: NodeId, x: f64, y: f64, z: f64) {
        self.nodes[id].set_rot(x, y, z);
    }

    /// Alias of [`Self::set_rot`].
    pub fn set_rotation(&mut self, id: NodeId, x: f64, y: f64, z: f64) {
        self.set_rot(id, x, y, z);
    }

    /// `object.rotation.y = v`.
    pub fn set_rot_y(&mut self, id: NodeId, v: f64) {
        self.nodes[id].rot_y(v);
    }

    /// `object.scale.setScalar(s)`.
    pub fn set_scale_scalar(&mut self, id: NodeId, s: f64) {
        self.nodes[id].set_scale_scalar(s);
    }

    /// `castShadow` / `receiveShadow`.
    pub fn shadows(&mut self, id: NodeId, cast: bool, receive: bool) {
        self.nodes[id].shadows(cast, receive);
    }

    /// `castShadow = true`.
    pub fn cast_shadow(&mut self, id: NodeId) {
        self.nodes[id].cast_shadow = true;
    }

    /// `receiveShadow = true`.
    pub fn receive_shadow(&mut self, id: NodeId) {
        self.nodes[id].receive_shadow = true;
    }

    /// `renderOrder = v`.
    pub fn render_order(&mut self, id: NodeId, v: i32) {
        self.nodes[id].render_order = v;
    }

    /// `object.userData`.
    pub fn user_data(&mut self, id: NodeId) -> &mut UserData {
        &mut self.nodes[id].user_data
    }

    // ------------------------------------------------------------ traversal

    /// `Object3D.traverse` order from [`ROOT`] (pre-order, children in
    /// `add()` order).
    #[must_use]
    pub fn traverse(&self) -> Vec<NodeId> {
        self.traverse_from(ROOT)
    }

    /// `Object3D.traverse` order from `root`.
    #[must_use]
    pub fn traverse_from(&self, root: NodeId) -> Vec<NodeId> {
        let mut out = Vec::with_capacity(self.nodes.len());
        let mut stack = vec![root];
        while let Some(n) = stack.pop() {
            out.push(n);
            for &c in self.nodes[n].children.iter().rev() {
                stack.push(c);
            }
        }
        out
    }

    /// `traverse` order with the parent's position in that order
    /// (`None` for the root), like the dumps of the web generators.
    #[must_use]
    pub fn traverse_with_parent(&self) -> Vec<(NodeId, Option<usize>)> {
        let order = self.traverse();
        let mut pos = vec![usize::MAX; self.nodes.len()];
        for (i, &id) in order.iter().enumerate() {
            pos[id] = i;
        }
        order
            .iter()
            .map(|&id| {
                let parent = if id == ROOT {
                    None
                } else {
                    self.nodes[id].parent.map(|p| pos[p])
                };
                (id, parent)
            })
            .collect()
    }

    /// Mesh nodes (`isMesh`) in traverse order.
    #[must_use]
    pub fn meshes(&self) -> Vec<NodeId> {
        self.traverse()
            .into_iter()
            .filter(|&n| self.nodes[n].is_mesh())
            .collect()
    }

    /// Mesh and line nodes in traverse order.
    #[must_use]
    pub fn drawables(&self) -> Vec<NodeId> {
        self.traverse()
            .into_iter()
            .filter(|&n| self.nodes[n].mesh().is_some())
            .collect()
    }

    /// Number of mesh nodes reachable from the root.
    #[must_use]
    pub fn mesh_count(&self) -> usize {
        self.meshes().len()
    }

    /// Number of nodes reachable from the root (root included).
    #[must_use]
    pub fn node_count(&self) -> usize {
        self.traverse().len()
    }

    /// Number of triangles over every mesh (lines excluded).
    #[must_use]
    pub fn triangle_count(&self) -> usize {
        self.meshes()
            .into_iter()
            .filter_map(|n| self.nodes[n].mesh())
            .map(|m| m.geo.mesh().triangle_count())
            .sum()
    }

    // ------------------------------------------------------------- matrices

    /// Local matrix `compose(position, quaternion, scale)`.
    #[must_use]
    pub fn local_matrix(&self, id: NodeId) -> Mat4 {
        self.nodes[id].local_matrix()
    }

    /// `updateMatrixWorld(true)` with the root under `root_parent` (`None`
    /// = the root is a scene-graph root, whose `matrixWorld` is its
    /// `matrix`): one matrix per node id, `matrixWorld =
    /// parent.matrixWorld * matrix`. Nodes not reachable from the root
    /// (detached) keep the identity.
    #[must_use]
    pub fn world_matrices(&self, root_parent: Option<&Mat4>) -> Vec<Mat4> {
        let mut world = vec![Mat4::IDENTITY; self.nodes.len()];
        for id in self.traverse() {
            let local = self.local_matrix(id);
            world[id] = match self.nodes[id].parent {
                Some(p) if id != ROOT => world[p].mul(&local),
                _ => match root_parent {
                    Some(m) if id == ROOT => m.mul(&local),
                    _ => local,
                },
            };
        }
        world
    }

    /// Pre-order traversal of the sub-tree of `root` (children in `add()`
    /// order) with the world matrices `updateWorldMatrix` gives when `root`
    /// has no parent.
    #[must_use]
    pub fn subtree(&self, root: NodeId) -> Vec<(NodeId, Mat4)> {
        let mut out = Vec::new();
        let mut stack = vec![(root, None::<Mat4>)];
        while let Some((id, parent)) = stack.pop() {
            let local = self.local_matrix(id);
            let world = match parent {
                Some(p) => p.mul(&local),
                None => local,
            };
            out.push((id, world));
            for &c in self.nodes[id].children.iter().rev() {
                stack.push((c, Some(world)));
            }
        }
        out
    }

    /// Every mesh and line in traverse order with its world matrix.
    #[must_use]
    pub fn world_meshes(&self, root_parent: Option<&Mat4>) -> Vec<WorldMesh> {
        let world = self.world_matrices(root_parent);
        self.drawables()
            .into_iter()
            .filter_map(|id| {
                let n = &self.nodes[id];
                let md = n.mesh()?;
                Some(WorldMesh {
                    node: id,
                    line_loop: n.is_line_loop(),
                    geo: md.geo.clone(),
                    materials: md.materials.clone(),
                    world: world[id],
                    cast_shadow: n.cast_shadow,
                    receive_shadow: n.receive_shadow,
                    render_order: n.render_order,
                })
            })
            .collect()
    }

    /// `new THREE.Box3().setFromObject(root, true)` (precise: every vertex
    /// of every mesh and line, read from the `Float32` position attribute
    /// and transformed by `matrixWorld`, `Math.min` / `Math.max`), as
    /// `[min.x, min.y, min.z, max.x, max.y, max.z]`.
    #[must_use]
    pub fn bounding_box(&self, root_parent: Option<&Mat4>) -> [f64; 6] {
        let world = self.world_matrices(root_parent);
        let mut b = [
            f64::INFINITY,
            f64::INFINITY,
            f64::INFINITY,
            f64::NEG_INFINITY,
            f64::NEG_INFINITY,
            f64::NEG_INFINITY,
        ];
        for id in self.drawables() {
            let Some(md) = self.nodes[id].mesh() else {
                continue;
            };
            let g = md.geo.mesh();
            for v in g.positions.chunks_exact(3) {
                let p = Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2]))
                    .apply_mat4(&world[id]);
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

    /// [`Self::bounding_box`] of a root without parent as `[min, max]`.
    #[must_use]
    pub fn bbox(&self) -> [Vec3; 2] {
        let b = self.bounding_box(None);
        [Vec3::new(b[0], b[1], b[2]), Vec3::new(b[3], b[4], b[5])]
    }

    /// Material of a mesh / line (first slot) or sprite node.
    #[must_use]
    pub fn material_of(&self, id: NodeId) -> Option<&Material> {
        let n = &self.nodes[id];
        n.mesh()
            .map(MeshData::material)
            .or_else(|| n.sprite_material())
            .map(|m| &self.materials[m])
    }
}

fn shift_materials(n: &mut Node, base: MatId) {
    match &mut n.kind {
        NodeKind::Mesh(m) | NodeKind::LineLoop(m) => {
            for s in &mut m.materials {
                *s += base;
            }
        }
        NodeKind::Sprite(s) => *s += base,
        NodeKind::Group | NodeKind::Object3D => {}
    }
    if let Some(UserValue::Mats(v)) = n.user_data.get_mut("mats") {
        for s in v {
            *s += base;
        }
    }
}
