//! CPU-only export view of a [`Scene`] for the GPU layer
//! ([`Scene::export_gpu`] → [`GpuExport`]):
//!
//! - [`GpuExport::meshes`]: one [`GpuMesh`] per mesh / line-loop node, in
//!   traverse order, with the vertex and index buffers (as the GPU wants
//!   them: `f32` positions / normals / uvs / colours, `u32` triangle or
//!   line-loop indices plus the `indexed` flag), the material(s) as data —
//!   the first slot, and for a material array (`Array.isArray(mesh.material)`)
//!   the geometry groups with the material of each group — the shadow flags,
//!   `renderOrder` and the world transform as a column-major `f32` matrix;
//! - [`GpuExport::sprites`]: one [`GpuSprite`] per `THREE.Sprite` node (e.g.
//!   the siege-camp sprite, `misc/siege.rs`), with its material, world
//!   transform and `renderOrder` (the quad itself is the GPU layer's).
//!
//! Like three's renderer (`WebGLRenderer.projectObject`: an object with
//! `visible === false` is skipped together with its sub-tree; three r169,
//! line not verified locally = NIE_ZMIERZONO), a node with
//! [`super::Node::visible`] `false` and everything under it is left out.
//!
//! Nothing is uploaded here (no `wgpu`, D-RR-1 = A); the `gpu` layer turns
//! this list into buffers and draw calls. Geometry is not deduplicated here:
//! [`GpuMesh::geometry_key`] gives the identity the asset registry
//! (`crate::assets`, P4.3 §7.3 pt 2) can share buffers by.
//!
//! Not covered (P4.27 Z15): `models::misc::overlay::OverlayGroup` (instanced
//! meshes / `Line` / `LineSegments` of the overlays) is not a [`Scene`].

use crate::geom::Mat4;

use super::geometry::{Geo, Prim};
use super::graph::Scene;
use super::material::Material;
use super::node::{MatId, NodeId, NodeKind, ROOT};

/// Primitive topology of an exported mesh.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Topology {
    /// Triangle list (`THREE.Mesh`).
    Triangles,
    /// Closed line strip (`THREE.LineLoop`): `indices` are the vertices in
    /// order; the GPU layer closes the loop.
    LineLoop,
}

/// How meshes with the same geometry can share one GPU buffer.
#[derive(Debug, Clone, PartialEq)]
pub enum GeometryKey {
    /// A parametric primitive: equal parameters = equal buffers.
    Prim(Prim),
    /// A shared CPU buffer: same pointer = same buffer.
    Buffer(usize),
    /// A module body: no sharing key (built per mesh).
    Body,
}

/// One drawable of a scene, ready for upload.
#[derive(Debug, Clone, PartialEq)]
pub struct GpuMesh {
    /// Node id in the scene.
    pub node: NodeId,
    /// Topology.
    pub topology: Topology,
    /// Positions, xyz per vertex.
    pub positions: Vec<f32>,
    /// Normals, xyz per vertex (empty when the geometry has none).
    pub normals: Vec<f32>,
    /// UVs, uv per vertex (empty when the geometry has none).
    pub uvs: Vec<f32>,
    /// Vertex colours, rgb per vertex (`color` attribute), if any.
    pub colors: Option<Vec<f32>>,
    /// Index buffer: the stored index, or `0..n` for a non-indexed geometry.
    pub indices: Vec<u32>,
    /// `geometry.index !== null` (`drawElements` vs `drawArrays`).
    pub indexed: bool,
    /// Material (first slot) as data.
    pub material: Material,
    /// `Array.isArray(mesh.material)`: draw per [`Self::groups`] (three
    /// draws nothing for a material array without groups).
    pub material_array: bool,
    /// Draw groups with their material (only for a material array; three
    /// ignores `geometry.groups` for a single material). A group whose
    /// `materialIndex` has no material is skipped, like three.
    pub groups: Vec<GpuGroup>,
    /// `material.color` (linear, `f32`), white for a class without colour.
    pub base_color: [f32; 3],
    /// `matrixWorld`, column-major, `f32`.
    pub world: [f32; 16],
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// `renderOrder`.
    pub render_order: i32,
    /// Buffer sharing key.
    pub geometry_key: GeometryKey,
}

/// One draw group of a multi-material mesh (`geometry.groups[i]` with
/// `mesh.material[group.materialIndex]`).
#[derive(Debug, Clone, PartialEq)]
pub struct GpuGroup {
    /// First index (or vertex, for a non-indexed geometry).
    pub start: u32,
    /// Number of indices (or vertices).
    pub count: u32,
    /// Material slot in [`Scene::materials`].
    pub slot: MatId,
    /// The material as data.
    pub material: Material,
}

/// One `THREE.Sprite` of a scene, ready for drawing.
#[derive(Debug, Clone, PartialEq)]
pub struct GpuSprite {
    /// Node id in the scene.
    pub node: NodeId,
    /// Material as data.
    pub material: Material,
    /// `material.color` (linear, `f32`).
    pub base_color: [f32; 3],
    /// `matrixWorld`, column-major, `f32`.
    pub world: [f32; 16],
    /// `renderOrder`.
    pub render_order: i32,
}

/// The whole export of a scene.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct GpuExport {
    /// Meshes and line loops, in traverse order.
    pub meshes: Vec<GpuMesh>,
    /// Sprites, in traverse order.
    pub sprites: Vec<GpuSprite>,
}

/// Column-major `f32` copy of a matrix (three's `Matrix4.elements` order).
#[must_use]
#[allow(clippy::cast_possible_truncation)] // GPU uniforms are f32
pub fn mat4_to_f32(m: &Mat4) -> [f32; 16] {
    let mut out = [0.0f32; 16];
    for (o, e) in out.iter_mut().zip(m.e.iter()) {
        *o = *e as f32;
    }
    out
}

fn key_of(geo: &Geo) -> GeometryKey {
    match geo {
        Geo::Prim(p) => GeometryKey::Prim(*p),
        Geo::Buffer(b) => GeometryKey::Buffer(std::sync::Arc::as_ptr(b) as usize),
        Geo::Body(_) => GeometryKey::Body,
    }
}

impl Scene {
    /// `true` for every node drawn by three: reachable from the root with
    /// itself and every ancestor `visible`.
    #[must_use]
    pub fn rendered_mask(&self) -> Vec<bool> {
        let mut out = vec![false; self.nodes.len()];
        let mut stack = vec![ROOT];
        while let Some(n) = stack.pop() {
            if !self.nodes[n].visible {
                continue;
            }
            out[n] = true;
            stack.extend(self.nodes[n].children.iter().copied());
        }
        out
    }

    /// The export view: every rendered mesh, line loop and sprite reachable
    /// from the root, in traverse order, with the root under `root_parent`.
    #[must_use]
    pub fn export_gpu(&self, root_parent: Option<&Mat4>) -> GpuExport {
        let rendered = self.rendered_mask();
        let meshes = self
            .world_meshes(root_parent)
            .into_iter()
            .filter(|wm| rendered[wm.node])
            .map(|wm| {
                let mesh = wm.geo.mesh();
                let material = self.materials[wm.materials[0]];
                let material_array = self.nodes[wm.node].mesh().is_some_and(|m| m.material_array);
                let groups = if material_array {
                    mesh.groups
                        .iter()
                        .filter_map(|g| {
                            let slot = *wm.materials.get(g.material_index as usize)?;
                            Some(GpuGroup {
                                start: g.start,
                                count: g.count,
                                slot,
                                material: self.materials[slot],
                            })
                        })
                        .collect()
                } else {
                    Vec::new()
                };
                GpuMesh {
                    node: wm.node,
                    topology: if wm.line_loop {
                        Topology::LineLoop
                    } else {
                        Topology::Triangles
                    },
                    positions: mesh.positions.clone(),
                    normals: mesh.normals.clone(),
                    uvs: mesh.uvs.clone(),
                    colors: wm.geo.colors().map(<[f32]>::to_vec),
                    indices: mesh.index_buffer(),
                    indexed: mesh.indices.is_some(),
                    material,
                    material_array,
                    groups,
                    base_color: material.linear_color().to_f32(),
                    world: mat4_to_f32(&wm.world),
                    cast_shadow: wm.cast_shadow,
                    receive_shadow: wm.receive_shadow,
                    render_order: wm.render_order,
                    geometry_key: key_of(&wm.geo),
                }
            })
            .collect();
        let world = self.world_matrices(root_parent);
        let sprites = self
            .traverse()
            .into_iter()
            .filter(|&id| rendered[id])
            .filter_map(|id| {
                let n = &self.nodes[id];
                let NodeKind::Sprite(slot) = n.kind else {
                    return None;
                };
                let material = self.materials[slot];
                Some(GpuSprite {
                    node: id,
                    material,
                    base_color: material.linear_color().to_f32(),
                    world: mat4_to_f32(&world[id]),
                    render_order: n.render_order,
                })
            })
            .collect();
        GpuExport { meshes, sprites }
    }
}
