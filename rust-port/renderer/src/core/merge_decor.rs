//! `render/mergeDecor.ts` (web `9b019a7d8`): collapse a per-hex decor group
//! (dozens of small meshes) into ONE mesh with vertex colours and a white
//! `MeshLambertMaterial({ vertexColors, flatShading })`, so fog dimming
//! (`material.color × vertex colour`) keeps working.
//!
//! The merged buffers are reproduced bit for bit: positions are
//! `Vector3.fromBufferAttribute` (f32 → f64) `.applyMatrix4(m)` with `m` the
//! product of local matrices accumulated exactly like
//! `meshMatrixInGroupSpace` (`premultiply` from the mesh up to, but
//! excluding, the root), then stored as `Float32`. Since
//! R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1 the triangle soup is then indexed by
//! [`index_identical_vertices`]: vertices whose 6 `Float32` (xyz + rgb) are
//! identical bit for bit share one slot of the index buffer — the same
//! triangles in the same order, so the image is unchanged (flat shading
//! derives normals from positions) and the vertex buffer shrinks ~1.5-5x.
//!
//! `releaseMergedDecorCpuArraysAfterUpload` (drop the JS copy of the arrays
//! after the WebGL upload) has no counterpart here: the CPU [`Scene`] is the
//! source of truth for the CPU tests and the wgpu upload owns its own GPU
//! buffer; nothing in this crate keeps a second CPU copy per upload.

use std::sync::Arc;

use crate::geom::{Mat4, Mesh, Vec3};
use crate::scene::{Geometry, Material, MaterialKind, NodeId, NodeKind, Scene, UserValue, ROOT};
use crate::terrain::color::Color;

/// `MERGED_DECOR_FLAG = 'civMergedDecor'` (`mergeDecor.ts:17`), the
/// `userData` key (a [`UserValue::Bool`] in [`crate::scene::Node::user_data`]).
pub const MERGED_DECOR_FLAG: &str = "civMergedDecor";

/// `userData.civMergedDecor === true` of node `id`.
#[must_use]
pub fn is_merged_flag(scene: &Scene, id: NodeId) -> bool {
    scene.nodes[id].user_data.flag(MERGED_DECOR_FLAG)
}

/// `userData.civMergedDecor = true` on node `id`.
pub fn set_merged_flag(scene: &mut Scene, id: NodeId) {
    scene.nodes[id]
        .user_data
        .set(MERGED_DECOR_FLAG, UserValue::Bool(true));
}

/// `isAlreadyMergedDecor(group)` (`mergeDecor.ts:20-27`) of the scene root:
/// the flag is set, or the only child is a mesh whose first material has
/// `vertexColors`.
#[must_use]
pub fn is_already_merged_decor(group: &Scene) -> bool {
    if is_merged_flag(group, ROOT) {
        return true;
    }
    let [only] = group.nodes[ROOT].children.as_slice() else {
        return false;
    };
    let NodeKind::Mesh(md) = &group.nodes[*only].kind else {
        return false;
    };
    md.materials
        .first()
        .is_some_and(|&m| group.materials[m].vertex_colors)
}

/// `countMeshesInGroup(group)` (`mergeDecor.ts:99-103`), the root included.
#[must_use]
pub fn count_meshes_in_group(group: &Scene) -> usize {
    group.mesh_count()
}

/// `meshMatrixInGroupSpace` for a mesh whose local matrices from just below
/// the root down to the mesh are `chain` (`mergeDecor.ts:34-42`):
/// `out = I; out = M_mesh·out; out = M_parent·out; …`.
fn matrix_in_group_space(chain: &[Mat4]) -> Mat4 {
    let mut out = Mat4::IDENTITY;
    for m in chain.iter().rev() {
        out = m.mul(&out);
    }
    out
}

#[allow(clippy::cast_possible_truncation)] // Float32Array store
fn push_f32(dst: &mut Vec<f32>, v: f64) {
    dst.push(v as f32);
}

fn collect(
    scene: &Scene,
    id: NodeId,
    chain: &mut Vec<Mat4>,
    pos: &mut Vec<f32>,
    col: &mut Vec<f32>,
) {
    let node = &scene.nodes[id];
    if let NodeKind::Mesh(md) = &node.kind {
        let m = matrix_in_group_space(chain);
        let c = md
            .materials
            .first()
            .and_then(|&m0| scene.materials[m0].color)
            .unwrap_or(Color::rgb(1.0, 1.0, 1.0));
        let mesh = md.geo.mesh();
        let mesh: &Mesh = &mesh;
        let colors = md.geo.colors();
        let mut push = |i: usize| {
            let p = &mesh.positions[i * 3..i * 3 + 3];
            let v = Vec3::new(f64::from(p[0]), f64::from(p[1]), f64::from(p[2])).apply_mat4(&m);
            push_f32(pos, v.x);
            push_f32(pos, v.y);
            push_f32(pos, v.z);
            if let Some(ca) = colors {
                col.extend_from_slice(&ca[i * 3..i * 3 + 3]);
            } else {
                push_f32(col, c.r);
                push_f32(col, c.g);
                push_f32(col, c.b);
            }
        };
        match &mesh.indices {
            Some(idx) => {
                for &i in idx {
                    push(i as usize);
                }
            }
            None => {
                for i in 0..mesh.vertex_count() {
                    push(i);
                }
            }
        }
    }
    for &child in &node.children {
        chain.push(scene.nodes[child].local_matrix());
        collect(scene, child, chain, pos, col);
        chain.pop();
    }
}

/// Output of [`index_identical_vertices`]: `index` is `None` when no vertex
/// repeats (the inputs are then returned unchanged, like the web returning
/// the same `Float32Array`s).
#[derive(Debug, Clone, PartialEq)]
pub struct IndexedVertices {
    /// Unique positions, xyz per vertex, in first-occurrence order.
    pub positions: Vec<f32>,
    /// Unique colours, rgb per vertex, aligned with `positions`.
    pub colors: Vec<f32>,
    /// `index[i]` = unique slot of the i-th input vertex, or `None`.
    pub index: Option<Vec<u32>>,
}

/// Element type the web picks for the index buffer
/// (`unique <= 65535 ? Uint16Array : Uint32Array`, `mergeDecor.ts:89`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IndexWidth {
    /// `Uint16Array` (`wgpu::IndexFormat::Uint16`).
    U16,
    /// `Uint32Array` (`wgpu::IndexFormat::Uint32`).
    U32,
}

impl IndexWidth {
    /// The web class name (`Uint16Array` / `Uint32Array`).
    #[must_use]
    pub const fn web_name(self) -> &'static str {
        match self {
            Self::U16 => "Uint16Array",
            Self::U32 => "Uint32Array",
        }
    }
}

/// Index element width for `unique` distinct vertices (`mergeDecor.ts:89`).
#[must_use]
pub const fn index_width(unique: usize) -> IndexWidth {
    if unique <= 65535 {
        IndexWidth::U16
    } else {
        IndexWidth::U32
    }
}

/// `indexIdenticalVertices(positions, colors)` (`mergeDecor.ts:52-92`, web
/// `9b019a7d8`): dedupe vertices whose 6 `Float32` (xyz + rgb) are identical
/// BIT FOR BIT (no tolerance: `0.0` and `-0.0` differ, equal `NaN` bit
/// patterns match). Unique vertices keep first-occurrence order; the triangle
/// order is kept (`index[i]` for input vertex `i`). Empty input, mismatched
/// lengths or no repeat → inputs unchanged and `index = None`.
///
/// The open-addressing hash (`Math.imul` mixing, linear probing, capacity the
/// least power of two `>= max(16, 2n)`) is ported 1:1; the output does not
/// depend on it (slots only find the first occurrence), it is kept for the
/// same cost profile.
#[must_use]
pub fn index_identical_vertices(positions: Vec<f32>, colors: Vec<f32>) -> IndexedVertices {
    let n = positions.len() / 3;
    if n == 0 || colors.len() != positions.len() {
        return IndexedVertices {
            positions,
            colors,
            index: None,
        };
    }
    let key = |i: usize| -> [u32; 6] {
        let o = i * 3;
        [
            positions[o].to_bits(),
            positions[o + 1].to_bits(),
            positions[o + 2].to_bits(),
            colors[o].to_bits(),
            colors[o + 1].to_bits(),
            colors[o + 2].to_bits(),
        ]
    };
    let mut cap: usize = 16;
    while cap < n * 2 {
        cap <<= 1;
    }
    let mask = cap - 1;
    let mut table: Vec<Option<u32>> = vec![None; cap];
    let mut first_src: Vec<usize> = Vec::with_capacity(n);
    let mut remap: Vec<u32> = Vec::with_capacity(n);
    for i in 0..n {
        let k = key(i);
        let mut h = (k[0] ^ 0x9e37_79b9).wrapping_mul(0x85eb_ca6b);
        h = (h ^ k[1]).wrapping_mul(0xc2b2_ae35);
        h = (h ^ k[2]).wrapping_mul(0x85eb_ca6b);
        h = (h ^ k[3]).wrapping_mul(0xc2b2_ae35);
        h = (h ^ k[4]).wrapping_mul(0x85eb_ca6b);
        h = (h ^ k[5]).wrapping_mul(0xc2b2_ae35);
        h ^= h >> 15;
        let mut s = h as usize & mask;
        loop {
            match table[s] {
                None => {
                    let u = u32::try_from(first_src.len()).expect("vertex count fits u32");
                    table[s] = Some(u);
                    first_src.push(i);
                    remap.push(u);
                    break;
                }
                Some(u) if key(first_src[u as usize]) == k => {
                    remap.push(u);
                    break;
                }
                Some(_) => s = (s + 1) & mask,
            }
        }
    }
    let unique = first_src.len();
    if unique == n {
        return IndexedVertices {
            positions,
            colors,
            index: None,
        };
    }
    let mut out_p = Vec::with_capacity(unique * 3);
    let mut out_c = Vec::with_capacity(unique * 3);
    for &src in &first_src {
        out_p.extend_from_slice(&positions[src * 3..src * 3 + 3]);
        out_c.extend_from_slice(&colors[src * 3..src * 3 + 3]);
    }
    IndexedVertices {
        positions: out_p,
        colors: out_c,
        index: Some(remap),
    }
}

/// `buildMergedMesh(group)` (`mergeDecor.ts:94-147`): the merged mesh as a
/// scene whose root is that mesh (identity transform,
/// `castShadow`/`receiveShadow` on, `matrixAutoUpdate = false`, not yet
/// flagged).
#[must_use]
pub fn build_merged_mesh(group: &Scene) -> Scene {
    let mut positions = Vec::new();
    let mut colors = Vec::new();
    let mut chain = Vec::new();
    collect(group, ROOT, &mut chain, &mut positions, &mut colors);
    let ix = index_identical_vertices(positions, colors);
    let geometry = Geometry {
        mesh: Mesh {
            positions: ix.positions,
            indices: ix.index,
            ..Mesh::default()
        },
        colors: Some(ix.colors),
    };
    let mut material = Material::new(MaterialKind::Lambert, None);
    material.vertex_colors = true;
    material.flat_shading = true;
    let mut merged = Scene::mesh_root(Arc::new(geometry), material);
    let root = merged.root_mut();
    root.cast_shadow = true;
    root.receive_shadow = true;
    root.matrix_auto_update = false;
    merged
}

/// `collapseToMergedMesh(group)` (`mergeDecor.ts:160-181`), in place on the
/// scene root. Returns `true` when the group was collapsed; `false` for an
/// empty group, an already merged one, or when no vertex was collected (the
/// group is then left untouched and unflagged). The web `try/catch`
/// fail-safe has no counterpart: nothing in this CPU build can throw.
/// The removed children stay in the arena, unreachable from the root (like
/// objects the web removed from the group and only disposes).
pub fn collapse_to_merged_mesh(group: &mut Scene) -> bool {
    if group.nodes[ROOT].children.is_empty() {
        return false;
    }
    if is_already_merged_decor(group) {
        return false;
    }
    let mut merged = build_merged_mesh(group);
    let empty = merged.nodes[ROOT]
        .mesh()
        .is_none_or(|md| md.geo.mesh().positions.is_empty());
    if empty {
        return false;
    }
    set_merged_flag(&mut merged, ROOT);
    let old = std::mem::take(&mut group.nodes[ROOT].children);
    for c in old {
        group.nodes[c].parent = None;
    }
    group.graft(ROOT, merged);
    set_merged_flag(group, ROOT);
    true
}

/// `disposeMergedDecor(group)` (`mergeDecor.ts:209-230`) of the scene root.
/// There are no GPU resources on the CPU side, so this returns what the web
/// would dispose: `(geometries, materials)` of the flagged children of a
/// flagged group (the tree itself is left as is, like in the web).
#[must_use]
pub fn dispose_merged_decor(group: &Scene) -> (usize, usize) {
    if !is_merged_flag(group, ROOT) {
        return (0, 0);
    }
    let mut geometries = 0;
    let mut materials_n = 0;
    for &child in &group.nodes[ROOT].children {
        if !is_merged_flag(group, child) {
            continue;
        }
        let NodeKind::Mesh(md) = &group.nodes[child].kind else {
            continue;
        };
        geometries += 1;
        materials_n += md.materials.len();
    }
    (geometries, materials_n)
}
