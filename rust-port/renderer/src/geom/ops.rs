//! Geometry assembly tools: ports of `BufferGeometry.applyMatrix4`,
//! `rotateX/Y/Z`, `translate`, `scale`, `computeVertexNormals`,
//! `normalizeNormals` (Three.js r169) and `BufferGeometryUtils
//! .mergeGeometries`.
//!
//! Attribute values are stored as f32 between operations, exactly like a
//! `Float32BufferAttribute`; every operation reads them back as f64, computes
//! in f64 and rounds the result to f32.

use super::math::{js_or_one, Mat3, Mat4, Vec3};
use super::{to_f32, Group, Mesh};
use std::fmt;

fn read3(buf: &[f32], i: usize) -> Vec3 {
    Vec3::new(
        f64::from(buf[i * 3]),
        f64::from(buf[i * 3 + 1]),
        f64::from(buf[i * 3 + 2]),
    )
}

#[allow(clippy::cast_possible_truncation)]
fn write3(buf: &mut [f32], i: usize, v: Vec3) {
    buf[i * 3] = v.x as f32;
    buf[i * 3 + 1] = v.y as f32;
    buf[i * 3 + 2] = v.z as f32;
}

impl Mesh {
    /// `BufferGeometry.applyMatrix4(m)`: positions by `m` (with projective
    /// divide), normals by the normal matrix (inverse transpose), then
    /// renormalized.
    pub fn apply_matrix4(&mut self, m: &Mat4) -> &mut Self {
        for i in 0..self.positions.len() / 3 {
            let v = read3(&self.positions, i).apply_mat4(m);
            write3(&mut self.positions, i, v);
        }
        if !self.normals.is_empty() {
            let nm = Mat3::normal_matrix(m);
            for i in 0..self.normals.len() / 3 {
                let n = read3(&self.normals, i).apply_mat3(&nm).normalize();
                write3(&mut self.normals, i, n);
            }
        }
        self
    }

    /// `BufferGeometry.rotateX(angle)`.
    pub fn rotate_x(&mut self, angle: f64) -> &mut Self {
        self.apply_matrix4(&Mat4::rotation_x(angle))
    }

    /// `BufferGeometry.rotateY(angle)`.
    pub fn rotate_y(&mut self, angle: f64) -> &mut Self {
        self.apply_matrix4(&Mat4::rotation_y(angle))
    }

    /// `BufferGeometry.rotateZ(angle)`.
    pub fn rotate_z(&mut self, angle: f64) -> &mut Self {
        self.apply_matrix4(&Mat4::rotation_z(angle))
    }

    /// `BufferGeometry.translate(x, y, z)`.
    pub fn translate(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.apply_matrix4(&Mat4::translation(x, y, z))
    }

    /// `BufferGeometry.scale(x, y, z)`.
    pub fn scale(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.apply_matrix4(&Mat4::scaling(x, y, z))
    }

    /// `BufferGeometry.normalizeNormals()`.
    pub fn normalize_normals(&mut self) -> &mut Self {
        for i in 0..self.normals.len() / 3 {
            let v = read3(&self.normals, i);
            let len = v.length();
            let n = v.scale(1.0 / js_or_one(len));
            write3(&mut self.normals, i, n);
        }
        self
    }

    /// `BufferGeometry.computeVertexNormals()`: area-weighted smooth normals
    /// for indexed meshes, flat face normals for non-indexed ones. Creates the
    /// normal buffer if it is missing.
    pub fn compute_vertex_normals(&mut self) -> &mut Self {
        let count = self.positions.len() / 3;
        self.normals.clear();
        self.normals.resize(count * 3, 0.0);
        let pos = &self.positions;
        let face = |a: usize, b: usize, c: usize| {
            let p_a = read3(pos, a);
            let p_b = read3(pos, b);
            let p_c = read3(pos, c);
            let cb = p_c.minus(p_b);
            let ab = p_a.minus(p_b);
            cb.cross(ab)
        };
        if let Some(index) = &self.indices {
            for tri in index.chunks_exact(3) {
                let (v_a, v_b, v_c) = (tri[0] as usize, tri[1] as usize, tri[2] as usize);
                let cb = face(v_a, v_b, v_c);
                // Read all three accumulators before writing (Three's order;
                // matters for degenerate triangles that repeat a vertex).
                let n_a = read3(&self.normals, v_a).plus(cb);
                let n_b = read3(&self.normals, v_b).plus(cb);
                let n_c = read3(&self.normals, v_c).plus(cb);
                write3(&mut self.normals, v_a, n_a);
                write3(&mut self.normals, v_b, n_b);
                write3(&mut self.normals, v_c, n_c);
            }
        } else {
            let mut i = 0;
            while i + 2 < count {
                let cb = face(i, i + 1, i + 2);
                write3(&mut self.normals, i, cb);
                write3(&mut self.normals, i + 1, cb);
                write3(&mut self.normals, i + 2, cb);
                i += 3;
            }
        }
        self.normalize_normals()
    }
}

/// Why [`merge_geometries`] refused its input (Three logs an error and
/// returns `null` in the same situations).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MergeError {
    /// The input list is empty.
    Empty,
    /// Geometry `i` is indexed while the first one is not, or vice versa.
    IndexMismatch(usize),
    /// Geometry `i` has a different attribute set (normal/uv present or not).
    AttributeMismatch(usize),
}

impl fmt::Display for MergeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => write!(f, "mergeGeometries: empty input"),
            Self::IndexMismatch(i) => write!(
                f,
                "mergeGeometries: geometry {i} indexed/non-indexed differs from geometry 0"
            ),
            Self::AttributeMismatch(i) => {
                write!(
                    f,
                    "mergeGeometries: geometry {i} has a different attribute set"
                )
            }
        }
    }
}

impl std::error::Error for MergeError {}

/// `BufferGeometryUtils.mergeGeometries(geometries, useGroups)`.
///
/// Attributes are concatenated, indices offset by the running vertex count.
/// Source groups are dropped; with `use_groups` one group per input geometry
/// is created (`start`/`count` in indices, or vertices when non-indexed;
/// `material_index` = input position).
///
/// # Errors
/// [`MergeError`] when the inputs are not compatible (see variants).
pub fn merge_geometries(geometries: &[&Mesh], use_groups: bool) -> Result<Mesh, MergeError> {
    let first = geometries.first().ok_or(MergeError::Empty)?;
    let is_indexed = first.indices.is_some();
    let has_normals = !first.normals.is_empty() || first.positions.is_empty();
    let has_uvs = !first.uvs.is_empty() || first.positions.is_empty();
    let mut out = Mesh {
        indices: if is_indexed { Some(Vec::new()) } else { None },
        ..Mesh::default()
    };
    let mut offset: u32 = 0;
    let mut index_offset: u32 = 0;
    for (i, g) in geometries.iter().enumerate() {
        if g.indices.is_some() != is_indexed {
            return Err(MergeError::IndexMismatch(i));
        }
        let empty = g.positions.is_empty();
        if (!empty && (g.normals.is_empty() == has_normals || g.uvs.is_empty() == has_uvs))
            || (empty && (!g.normals.is_empty() || !g.uvs.is_empty()))
        {
            return Err(MergeError::AttributeMismatch(i));
        }
        let vcount = u32::try_from(g.vertex_count()).unwrap_or(u32::MAX);
        if use_groups {
            let count = match &g.indices {
                Some(idx) => u32::try_from(idx.len()).unwrap_or(u32::MAX),
                None => vcount,
            };
            out.groups.push(Group {
                start: offset,
                count,
                material_index: u32::try_from(i).unwrap_or(u32::MAX),
            });
            offset += count;
        }
        if let (Some(dst), Some(src)) = (out.indices.as_mut(), g.indices.as_ref()) {
            dst.extend(src.iter().map(|&k| k + index_offset));
        }
        index_offset += vcount;
        out.positions.extend_from_slice(&g.positions);
        out.normals.extend_from_slice(&g.normals);
        out.uvs.extend_from_slice(&g.uvs);
    }
    Ok(out)
}

/// Builds a non-indexed mesh from f64 positions/uvs and computes flat
/// normals (used by `PolyhedronGeometry`/`ExtrudeGeometry`).
pub(crate) fn soup_with_flat_normals(pos: &[f64], uv: &[f64]) -> Mesh {
    let mut m = Mesh {
        positions: to_f32(pos),
        normals: Vec::new(),
        uvs: to_f32(uv),
        indices: None,
        groups: Vec::new(),
    };
    m.compute_vertex_normals();
    m
}
