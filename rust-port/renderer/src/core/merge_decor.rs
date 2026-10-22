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

/// `buildMergedMesh(group)` (`mergeDecor.ts:44-91`): the merged mesh as a
/// scene whose root is that mesh (identity transform,
/// `castShadow`/`receiveShadow` on, `matrixAutoUpdate = false`, not yet
/// flagged).
#[must_use]
pub fn build_merged_mesh(group: &Scene) -> Scene {
    let mut positions = Vec::new();
    let mut colors = Vec::new();
    let mut chain = Vec::new();
    collect(group, ROOT, &mut chain, &mut positions, &mut colors);
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
    let mut merged = Scene::mesh_root(Arc::new(geometry), material);
    let root = merged.root_mut();
    root.cast_shadow = true;
    root.receive_shadow = true;
    root.matrix_auto_update = false;
    merged
}

/// `collapseToMergedMesh(group)` (`mergeDecor.ts:105-125`), in place on the
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

/// `disposeMergedDecor(group)` (`mergeDecor.ts:154-175`) of the scene root.
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
