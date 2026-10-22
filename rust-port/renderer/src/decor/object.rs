//! [`DecorObject`]: a decor model is a [`Scene`] (the renderer's one
//! scene-tree type, P4.27); `name` and `renderOrder` are ordinary node
//! fields there, so the side table of P4.17 (`NodeMeta`) is gone.
//!
//! The builders assemble leaf meshes as [`Leaf`] values (a standalone
//! [`Node`] with its own material, the shape of `new THREE.Mesh(geo, mat)`
//! before `g.add(mesh)`), then add them with [`add_leaf`]. A leaf's Euler
//! `rotation` may be written field by field before it is added; [`add_leaf`]
//! derives the quaternion from it (`onRotationChange`), so the result equals
//! three setting `rotation.x/y/z` on the object.

use std::ops::{Deref, DerefMut};
use std::sync::Arc;

use crate::geom::Quat;
use crate::scene::{Geo, Geometry, Material, MeshData, Node, NodeId, NodeKind, Scene, ROOT};

/// A decor model (alias of [`Scene`]).
pub type DecorObject = Scene;

/// `new THREE.Mesh(geometry, material)` before it is added to a group.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Leaf {
    pub(crate) node: Node,
    pub(crate) material: Material,
}

impl Leaf {
    /// A mesh leaf with the `Object3D` defaults.
    pub(crate) fn mesh(geometry: Arc<Geometry>, material: Material) -> Self {
        Self {
            node: Node::new(NodeKind::Mesh(MeshData::new(Geo::Buffer(geometry), 0))),
            material,
        }
    }

    /// The leaf as a one-node scene (the mesh is the root).
    pub(crate) fn into_scene(self) -> Scene {
        let mut s = Scene::with_root(NodeKind::Group);
        add_leaf_as_root(&mut s, self);
        s
    }
}

impl Deref for Leaf {
    type Target = Node;
    fn deref(&self) -> &Node {
        &self.node
    }
}

impl DerefMut for Leaf {
    fn deref_mut(&mut self) -> &mut Node {
        &mut self.node
    }
}

fn finish(leaf: Leaf, slot: usize) -> Node {
    let mut node = leaf.node;
    node.quaternion = Quat::from_euler(node.rotation);
    if let NodeKind::Mesh(md) = &mut node.kind {
        md.materials = vec![slot];
    }
    node
}

/// `parent.add(leaf)` with `leaf.renderOrder = render_order`; returns the
/// new node id.
pub(crate) fn add_leaf(scene: &mut Scene, parent: NodeId, leaf: Leaf, render_order: i32) -> NodeId {
    let slot = scene.add_material(leaf.material);
    let mut node = finish(leaf, slot);
    node.render_order = render_order;
    scene.nodes.push(node);
    let id = scene.nodes.len() - 1;
    scene.attach(parent, id);
    id
}

/// Replaces the (childless) root of `scene` by `leaf`.
fn add_leaf_as_root(scene: &mut Scene, leaf: Leaf) {
    let slot = scene.add_material(leaf.material);
    let children = std::mem::take(&mut scene.nodes[ROOT].children);
    debug_assert!(children.is_empty());
    scene.nodes[ROOT] = finish(leaf, slot);
}

/// Group children collector used by the builders (a `THREE.Group` root and
/// leaf meshes added in order).
#[derive(Debug, Default)]
pub(crate) struct GroupBuilder {
    pub(crate) scene: Scene,
}

impl GroupBuilder {
    pub(crate) fn new() -> Self {
        Self {
            scene: Scene::new(),
        }
    }

    /// `g.add(mesh)` for a leaf mesh with the given `renderOrder`.
    pub(crate) fn add_leaf(&mut self, leaf: Leaf, render_order: i32) -> NodeId {
        add_leaf(&mut self.scene, ROOT, leaf, render_order)
    }

    pub(crate) fn finish(self) -> DecorObject {
        self.scene
    }
}
