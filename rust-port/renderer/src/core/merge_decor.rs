//! `render/mergeDecor.ts` (web `edb8fb56`, 175 LOC): collapse a per-hex decor
//! group (dozens of small meshes) into ONE non-indexed mesh with vertex
//! colours and a white `MeshLambertMaterial({ vertexColors, flatShading })`,
//! so fog dimming (`material.color × vertex colour`) keeps working.
//!
//! The merged buffers are reproduced bit for bit: positions are
//! `Vector3.fromBufferAttribute` (f32 → f64) `.applyMatrix4(m)` with `m` the
//! product of local matrices accumulated exactly like
//! `meshMatrixInGroupSpace` (`premultiply` from the mesh up to, but
//! excluding, the root), then stored as `Float32`.

use std::sync::Arc;

use super::scene::{Geometry, Material, MaterialKind, NodeKind, SceneNode};
use crate::geom::{Mat4, Mesh, Vec3};
use crate::terrain::color::Color;

/// `MERGED_DECOR_FLAG = 'civMergedDecor'` (`mergeDecor.ts:17`), the
/// `userData` key that [`SceneNode::merged_decor`] models.
pub const MERGED_DECOR_FLAG: &str = "civMergedDecor";

/// `isAlreadyMergedDecor(group)` (`mergeDecor.ts:20-27`): the flag is set,
/// or the only child is a mesh whose first material has `vertexColors`.
#[must_use]
pub fn is_already_merged_decor(group: &SceneNode) -> bool {
    if group.merged_decor {
        return true;
    }
    let [only] = group.children.as_slice() else {
        return false;
    };
    let NodeKind::Mesh { materials, .. } = &only.kind else {
        return false;
    };
    materials.first().is_some_and(|m| m.vertex_colors)
}

/// `countMeshesInGroup(group)` (`mergeDecor.ts:99-103`), the root included.
#[must_use]
pub fn count_meshes_in_group(group: &SceneNode) -> usize {
    let mut n = 0;
    group.traverse(&mut |o| {
        if o.is_mesh() {
            n += 1;
        }
    });
    n
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

fn collect(node: &SceneNode, chain: &mut Vec<Mat4>, pos: &mut Vec<f32>, col: &mut Vec<f32>) {
    if let NodeKind::Mesh {
        geometry,
        materials,
        ..
    } = &node.kind
    {
        let m = matrix_in_group_space(chain);
        // `_c.copy(mat0?.color ?? WHITE)`; WHITE = `new Color(1, 1, 1)` (no
        // colour-space conversion).
        let c = materials
            .first()
            .and_then(|m0| m0.color)
            .unwrap_or(Color::rgb(1.0, 1.0, 1.0));
        let mesh: &Mesh = &geometry.mesh;
        let colors = geometry.colors.as_deref();
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
    for child in &node.children {
        chain.push(child.local_matrix());
        collect(child, chain, pos, col);
        chain.pop();
    }
}

/// `buildMergedMesh(group)` (`mergeDecor.ts:44-91`): the merged mesh node
/// (identity transform, `castShadow`/`receiveShadow` on,
/// `matrixAutoUpdate = false`, not yet flagged).
#[must_use]
pub fn build_merged_mesh(group: &SceneNode) -> SceneNode {
    let mut positions = Vec::new();
    let mut colors = Vec::new();
    let mut chain = Vec::new();
    collect(group, &mut chain, &mut positions, &mut colors);
    let geometry = Geometry {
        mesh: Mesh {
            positions,
            ..Mesh::default()
        },
        colors: Some(colors),
    };
    let mut material = Material::new(MaterialKind::Lambert, None);
    material.vertex_colors = true;
    material.flat_shading = true;
    let mut merged = SceneNode::mesh(Arc::new(geometry), material);
    merged.cast_shadow = true;
    merged.receive_shadow = true;
    merged.matrix_auto_update = false;
    merged
}

/// `collapseToMergedMesh(group)` (`mergeDecor.ts:105-125`), in place.
/// Returns `true` when the group was collapsed; `false` for an empty group,
/// an already merged one, or when no vertex was collected (the group is then
/// left untouched and unflagged). The web `try/catch` fail-safe has no
/// counterpart: nothing in this CPU build can throw.
pub fn collapse_to_merged_mesh(group: &mut SceneNode) -> bool {
    if group.children.is_empty() {
        return false;
    }
    if is_already_merged_decor(group) {
        return false;
    }
    let mut merged = build_merged_mesh(group);
    let NodeKind::Mesh { geometry, .. } = &merged.kind else {
        unreachable!("build_merged_mesh returns a mesh")
    };
    if geometry.mesh.positions.is_empty() {
        return false;
    }
    merged.merged_decor = true;
    group.children.clear();
    group.children.push(merged);
    group.merged_decor = true;
    true
}

/// `disposeMergedDecor(group)` (`mergeDecor.ts:154-175`). There are no GPU
/// resources on the CPU side, so this returns what the web would dispose:
/// `(geometries, materials)` of the flagged children of a flagged group
/// (the tree itself is left as is, like in the web).
#[must_use]
pub fn dispose_merged_decor(group: &SceneNode) -> (usize, usize) {
    if !group.merged_decor {
        return (0, 0);
    }
    let mut geometries = 0;
    let mut materials_n = 0;
    for child in &group.children {
        if !child.merged_decor {
            continue;
        }
        let NodeKind::Mesh { materials, .. } = &child.kind else {
            continue;
        };
        geometries += 1;
        materials_n += materials.len();
    }
    (geometries, materials_n)
}
