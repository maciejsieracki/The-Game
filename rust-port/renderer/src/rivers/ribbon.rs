//! `buildRibbonGeometry(points, halfWidth, segmentsPerSpan, sharp = true)`
//! (pin `07d2fbd72`, `gra/src/render/scene.ts:385-460`): a flat ribbon along
//! a 3D polyline, one cross-section (2 vertices) per input point.
//!
//! Only the `sharp` branch is ported: every river call site passes
//! `sharp = true` (`scene.ts:844, 859, 869` for the mouths, `:1435` in
//! `pushRiverMesh`, always called with `true`, `:1348, 1358-1360`). The
//! CatmullRom branch (`:439-452`) is reached by no river ribbon, so
//! `segmentsPerSpan` (used only there) has no counterpart here.
//!
//! Numbers: computed in f64 in the web order, stored as f32
//! (`Float32BufferAttribute`).

use crate::geom::{Mesh, Vec3};

/// `halfWidth: number | number[]` of `buildRibbonGeometry`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum HalfWidth<'a> {
    /// One half width for every point.
    Scalar(f64),
    /// One half width per input point (`hwAt(i)`, `scene.ts:403-406`).
    PerPoint(&'a [f64]),
}

impl HalfWidth<'_> {
    /// `hwAt(i)` (`scene.ts:402-406`): `halfWidth[i] ?? halfWidth[last] ??
    /// scalarHalfWidth`, where `scalarHalfWidth = halfWidth[0] ?? 0`.
    #[must_use]
    pub fn at(&self, i: usize) -> f64 {
        match self {
            Self::Scalar(v) => *v,
            Self::PerPoint(a) => a.get(i).or_else(|| a.last()).copied().unwrap_or(0.0),
        }
    }
}

/// Number of vertices of the ribbon of `n` points (2 per point).
#[must_use]
pub fn ribbon_vertex_count(n: usize) -> usize {
    if n < 2 {
        0
    } else {
        2 * n
    }
}

#[allow(clippy::cast_possible_truncation)]
fn f32_of(v: f64) -> f32 {
    v as f32
}

/// `buildRibbonGeometry(points, halfWidth, _, true)` (`scene.ts:385-460`).
///
/// Fewer than two points give an empty geometry (`new BufferGeometry()`,
/// `:391`). Point `i` gives vertices `2i` (left) and `2i + 1` (right); quad
/// `j` joins points `j` and `j + 1` with the triangles
/// `(2j, 2j+2, 2j+1)` and `(2j+1, 2j+2, 2j+3)` (`:413-418`).
#[must_use]
pub fn build_ribbon_geometry(points: &[Vec3], half_width: HalfWidth<'_>) -> Mesh {
    let mut mesh = Mesh::default();
    if points.len() < 2 {
        return mesh;
    }
    let mut indices: Vec<u32> = Vec::with_capacity(6 * (points.len() - 1));
    let mut vertex_count: u32 = 0;
    let mut u_accum = 0.0f64;
    let last = points.len() - 1;
    for (i, &pt) in points.iter().enumerate() {
        // scene.ts:426-437: tangent flattened to XZ, normalised.
        let t_flat = if i == 0 {
            let n = points[1];
            Vec3::new(n.x - pt.x, 0.0, n.z - pt.z).normalize()
        } else if i == last {
            let p = points[i - 1];
            Vec3::new(pt.x - p.x, 0.0, pt.z - p.z).normalize()
        } else {
            let p = points[i - 1];
            let n = points[i + 1];
            Vec3::new(n.x - p.x, 0.0, n.z - p.z).normalize()
        };
        if i > 0 {
            u_accum += pt.distance_to(points[i - 1]);
        }
        // emitCrossSection (scene.ts:407-419).
        let hw = half_width.at(i);
        let right = Vec3::new(-t_flat.z, 0.0, t_flat.x);
        let left = Vec3::new(pt.x - right.x * hw, pt.y, pt.z - right.z * hw);
        let right_v = Vec3::new(pt.x + right.x * hw, pt.y, pt.z + right.z * hw);
        for v in [left, right_v] {
            mesh.positions
                .extend_from_slice(&[f32_of(v.x), f32_of(v.y), f32_of(v.z)]);
            mesh.normals.extend_from_slice(&[0.0, 1.0, 0.0]);
        }
        let u = f32_of(u_accum);
        mesh.uvs.extend_from_slice(&[0.0, u, 1.0, u]);
        if vertex_count > 0 {
            let base = vertex_count;
            indices.extend_from_slice(&[base - 2, base, base - 1, base - 1, base, base + 1]);
        }
        vertex_count += 2;
    }
    mesh.indices = Some(indices);
    mesh
}
