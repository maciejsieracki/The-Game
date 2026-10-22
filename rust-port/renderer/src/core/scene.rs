//! Compatibility path of the P4.12 scene types.
//!
//! P4.12 introduced a recursive `SceneNode` tree here (used by `decor`,
//! `core::fog_dim` and `core::merge_decor`). Since
//! R-RUSTPORT-P4-27-SCENE-UNIFY-Q1 the renderer has ONE scene-tree type,
//! [`crate::scene::Scene`] (an arena of nodes with shared materials); this
//! module only re-exports it under the old paths. [`SceneNode`] is an alias
//! of [`Scene`]: a tree is now addressed by node ids from its root
//! ([`crate::scene::ROOT`]), not by nested values.
//!
//! Transform semantics are unchanged (three r169): the local matrix is
//! `Matrix4.compose(position, quaternion, scale)` with the quaternion from
//! `Quaternion.setFromEuler(rotation)` (`Object3D.updateMatrix`), kept in
//! sync by the node's Euler setters.

pub use crate::scene::{
    Geometry, Material, MaterialKind, MeshData, Node, NodeId, NodeKind, Scene, UserData, UserValue,
    ROOT,
};

/// The P4.12 name of [`Scene`].
pub type SceneNode = Scene;
