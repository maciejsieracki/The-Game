//! [`DecorObject`]: a [`crate::core::scene::SceneNode`] tree (the crate's
//! scene type from P4.12 — no third tree type, per dispatch) plus the two
//! `Object3D` fields the decor builders set and `SceneNode` does not carry:
//! `name` and `renderOrder`. They are kept in a side table in `traverse`
//! (pre-)order, so the tree itself stays a plain `SceneNode` usable by
//! `core::fog_dim` / `core::merge_decor`.

use crate::core::scene::SceneNode;

/// `Object3D.name` / `Object3D.renderOrder` of one node.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct NodeMeta {
    /// `name` (`''` by default).
    pub name: String,
    /// `renderOrder` (`0` by default).
    pub render_order: i32,
}

/// A decor model: the scene tree and its per-node metadata.
#[derive(Clone, Debug, PartialEq)]
pub struct DecorObject {
    /// Root (`THREE.Group` or `THREE.Mesh`).
    pub root: SceneNode,
    /// Metadata of every node in `root.traverse` order (`meta[0]` = root).
    pub meta: Vec<NodeMeta>,
}

impl DecorObject {
    /// Wraps a tree with default metadata (`name = ''`, `renderOrder = 0`).
    #[must_use]
    pub fn new(root: SceneNode) -> Self {
        let mut n = 0;
        root.traverse(&mut |_| n += 1);
        Self {
            root,
            meta: vec![NodeMeta::default(); n],
        }
    }

    /// Sets the root `name`.
    #[must_use]
    pub fn named(mut self, name: &str) -> Self {
        self.meta[0].name = name.to_owned();
        self
    }

    /// Number of nodes.
    #[must_use]
    pub fn node_count(&self) -> usize {
        self.meta.len()
    }

    /// Number of meshes.
    #[must_use]
    pub fn mesh_count(&self) -> usize {
        let mut n = 0;
        self.root.traverse(&mut |x| {
            if x.is_mesh() {
                n += 1;
            }
        });
        n
    }

    /// Total triangle count of all meshes.
    #[must_use]
    pub fn triangle_count(&self) -> usize {
        let mut n = 0;
        self.root.traverse(&mut |x| {
            if let crate::core::scene::NodeKind::Mesh { geometry, .. } = &x.kind {
                n += geometry.mesh.triangle_count();
            }
        });
        n
    }
}

/// Group children collector that tracks per-child metadata (used by the
/// builders: children are leaf meshes, so the traverse index of child `i`
/// is `1 + i`).
#[derive(Debug, Default)]
pub(crate) struct GroupBuilder {
    pub(crate) root: Option<SceneNode>,
    pub(crate) child_meta: Vec<NodeMeta>,
}

impl GroupBuilder {
    pub(crate) fn new() -> Self {
        Self {
            root: Some(SceneNode::group()),
            child_meta: Vec::new(),
        }
    }

    pub(crate) fn group_mut(&mut self) -> &mut SceneNode {
        self.root.as_mut().expect("group")
    }

    /// `g.add(mesh)` for a leaf mesh with the given `renderOrder`.
    pub(crate) fn add_leaf(&mut self, node: SceneNode, render_order: i32) -> &mut SceneNode {
        debug_assert!(node.children.is_empty());
        self.child_meta.push(NodeMeta {
            name: String::new(),
            render_order,
        });
        let g = self.group_mut();
        g.add(node);
        g.children.last_mut().expect("just added")
    }

    pub(crate) fn finish(mut self) -> DecorObject {
        let root = self.root.take().expect("group");
        let mut meta = vec![NodeMeta::default()];
        meta.extend(self.child_meta);
        DecorObject { root, meta }
    }
}
