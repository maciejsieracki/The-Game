//! CPU-only export view of a [`Scene`] for the GPU layer: one
//! [`GpuMesh`] per mesh / line node, in traverse order, with the vertex and
//! index buffers (as the GPU wants them: `f32` positions / normals / uvs /
//! colours, `u32` triangle or line-loop indices), the material colour and
//! flags, and the world transform as a column-major `f32` matrix.
//!
//! Nothing is uploaded here (no `wgpu`, D-RR-1 = A); the `gpu` layer turns
//! this list into buffers and draw calls. Geometry is not deduplicated here:
//! [`GpuMesh::geometry_key`] gives the identity the asset registry
//! (`crate::assets`, P4.3 §7.3 pt 2) can share buffers by.

use crate::geom::Mat4;

use super::geometry::{Geo, Prim};
use super::graph::Scene;
use super::material::Material;
use super::node::NodeId;

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
    /// Material (first slot) as data.
    pub material: Material,
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
    /// The export view: every mesh and line node reachable from the root,
    /// in traverse order, with the root under `root_parent`.
    #[must_use]
    pub fn export_gpu(&self, root_parent: Option<&Mat4>) -> Vec<GpuMesh> {
        self.world_meshes(root_parent)
            .into_iter()
            .map(|wm| {
                let mesh = wm.geo.mesh();
                let material = self.materials[wm.materials[0]];
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
                    material,
                    base_color: material.linear_color().to_f32(),
                    world: mat4_to_f32(&wm.world),
                    cast_shadow: wm.cast_shadow,
                    receive_shadow: wm.receive_shadow,
                    render_order: wm.render_order,
                    geometry_key: key_of(&wm.geo),
                }
            })
            .collect()
    }
}
