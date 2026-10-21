//! Port of Three.js r169 `PolyhedronGeometry` and its subclasses
//! `IcosahedronGeometry`, `DodecahedronGeometry`, `OctahedronGeometry` and
//! `TetrahedronGeometry`. The result is non-indexed (triangle soup) with flat
//! normals for `detail == 0` and smooth (normalized position) normals
//! otherwise; no material groups.

use super::math::Vec3;
use super::ops::soup_with_flat_normals;
use super::{to_f32, Mesh};
use std::f64::consts::PI;

/// `new THREE.PolyhedronGeometry(vertices, indices, radius, detail)`.
#[must_use]
#[allow(clippy::float_cmp)]
pub fn polyhedron_geometry(vertices: &[f64], indices: &[u32], radius: f64, detail: u32) -> Mesh {
    let mut vb: Vec<f64> = Vec::new();
    let mut uvb: Vec<f64> = Vec::new();

    let get = |i: u32| {
        let s = i as usize * 3;
        Vec3::new(vertices[s], vertices[s + 1], vertices[s + 2])
    };

    // subdivide
    for tri in indices.chunks_exact(3) {
        let a = get(tri[0]);
        let b = get(tri[1]);
        let c = get(tri[2]);
        subdivide_face(&mut vb, a, b, c, detail);
    }

    // applyRadius
    for p in vb.chunks_exact_mut(3) {
        let v = Vec3::new(p[0], p[1], p[2]).normalize().scale(radius);
        p[0] = v.x;
        p[1] = v.y;
        p[2] = v.z;
    }

    // generateUVs
    for p in vb.chunks_exact(3) {
        let v = Vec3::new(p[0], p[1], p[2]);
        let u = azimuth(v) / 2.0 / PI + 0.5;
        let w = inclination(v) / PI + 0.5;
        uvb.push(u);
        uvb.push(1.0 - w);
    }

    // correctUVs
    {
        let mut j = 0;
        for p in vb.chunks_exact(9) {
            let a = Vec3::new(p[0], p[1], p[2]);
            let b = Vec3::new(p[3], p[4], p[5]);
            let c = Vec3::new(p[6], p[7], p[8]);
            let uv_a = uvb[j];
            let uv_b = uvb[j + 2];
            let uv_c = uvb[j + 4];
            let centroid = a.plus(b).plus(c).scale(1.0 / 3.0);
            let azi = azimuth(centroid);
            correct_uv(&mut uvb, uv_a, j, a, azi);
            correct_uv(&mut uvb, uv_b, j + 2, b, azi);
            correct_uv(&mut uvb, uv_c, j + 4, c, azi);
            j += 6;
        }
    }

    // correctSeam
    for f in uvb.chunks_exact_mut(6) {
        let (x0, x1, x2) = (f[0], f[2], f[4]);
        let max = js_max3(x0, x1, x2);
        let min = js_min3(x0, x1, x2);
        if max > 0.9 && min < 0.1 {
            if x0 < 0.2 {
                f[0] += 1.0;
            }
            if x1 < 0.2 {
                f[2] += 1.0;
            }
            if x2 < 0.2 {
                f[4] += 1.0;
            }
        }
    }

    if detail == 0 {
        soup_with_flat_normals(&vb, &uvb)
    } else {
        let mut m = Mesh {
            positions: to_f32(&vb),
            normals: to_f32(&vb),
            uvs: to_f32(&uvb),
            indices: None,
            groups: Vec::new(),
        };
        m.normalize_normals();
        m
    }
}

fn subdivide_face(vb: &mut Vec<f64>, a: Vec3, b: Vec3, c: Vec3, detail: u32) {
    let cols = detail as usize + 1;
    let mut v: Vec<Vec<Vec3>> = Vec::with_capacity(cols + 1);
    for i in 0..=cols {
        let t = i as f64 / cols as f64;
        let aj = a.lerp(c, t);
        let bj = b.lerp(c, t);
        let rows = cols - i;
        let mut row = Vec::with_capacity(rows + 1);
        for j in 0..=rows {
            if j == 0 && i == cols {
                row.push(aj);
            } else {
                row.push(aj.lerp(bj, j as f64 / rows as f64));
            }
        }
        v.push(row);
    }
    let mut push = |p: Vec3| vb.extend_from_slice(&[p.x, p.y, p.z]);
    for i in 0..cols {
        for j in 0..(2 * (cols - i) - 1) {
            let k = j / 2;
            if j % 2 == 0 {
                push(v[i][k + 1]);
                push(v[i + 1][k]);
                push(v[i][k]);
            } else {
                push(v[i][k + 1]);
                push(v[i + 1][k + 1]);
                push(v[i + 1][k]);
            }
        }
    }
}

#[allow(clippy::float_cmp)]
fn correct_uv(uvb: &mut [f64], uv_x: f64, stride: usize, vector: Vec3, azimuth: f64) {
    if azimuth < 0.0 && uv_x == 1.0 {
        uvb[stride] = uv_x - 1.0;
    }
    if vector.x == 0.0 && vector.z == 0.0 {
        uvb[stride] = azimuth / 2.0 / PI + 0.5;
    }
}

fn azimuth(v: Vec3) -> f64 {
    v.z.atan2(-v.x)
}

fn inclination(v: Vec3) -> f64 {
    (-v.y).atan2((v.x * v.x + v.z * v.z).sqrt())
}

/// `Math.max(a, b, c)` (NaN-propagating, unlike `f64::max`).
fn js_max3(a: f64, b: f64, c: f64) -> f64 {
    if a.is_nan() || b.is_nan() || c.is_nan() {
        f64::NAN
    } else {
        a.max(b).max(c)
    }
}

/// `Math.min(a, b, c)` (NaN-propagating).
fn js_min3(a: f64, b: f64, c: f64) -> f64 {
    if a.is_nan() || b.is_nan() || c.is_nan() {
        f64::NAN
    } else {
        a.min(b).min(c)
    }
}

/// `new THREE.IcosahedronGeometry(radius, detail)`.
#[must_use]
pub fn icosahedron_geometry(radius: f64, detail: u32) -> Mesh {
    let t = (1.0 + 5.0_f64.sqrt()) / 2.0;
    let vertices = [
        -1.0, t, 0.0, 1.0, t, 0.0, -1.0, -t, 0.0, 1.0, -t, 0.0, 0.0, -1.0, t, 0.0, 1.0, t, 0.0,
        -1.0, -t, 0.0, 1.0, -t, t, 0.0, -1.0, t, 0.0, 1.0, -t, 0.0, -1.0, -t, 0.0, 1.0,
    ];
    let indices = [
        0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7,
        1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9,
        8, 1,
    ];
    polyhedron_geometry(&vertices, &indices, radius, detail)
}

/// `new THREE.DodecahedronGeometry(radius, detail)`.
#[must_use]
pub fn dodecahedron_geometry(radius: f64, detail: u32) -> Mesh {
    let t = (1.0 + 5.0_f64.sqrt()) / 2.0;
    let r = 1.0 / t;
    let vertices = [
        // (±1, ±1, ±1)
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, // (0, ±1/φ, ±φ)
        0.0, -r, -t, 0.0, -r, t, 0.0, r, -t, 0.0, r, t, // (±1/φ, ±φ, 0)
        -r, -t, 0.0, -r, t, 0.0, r, -t, 0.0, r, t, 0.0, // (±φ, 0, ±1/φ)
        -t, 0.0, -r, t, 0.0, -r, -t, 0.0, r, t, 0.0, r,
    ];
    let indices = [
        3, 11, 7, 3, 7, 15, 3, 15, 13, 7, 19, 17, 7, 17, 6, 7, 6, 15, 17, 4, 8, 17, 8, 10, 17, 10,
        6, 8, 0, 16, 8, 16, 2, 8, 2, 10, 0, 12, 1, 0, 1, 18, 0, 18, 16, 6, 10, 2, 6, 2, 13, 6, 13,
        15, 2, 16, 18, 2, 18, 3, 2, 3, 13, 18, 1, 9, 18, 9, 11, 18, 11, 3, 4, 14, 12, 4, 12, 0, 4,
        0, 8, 11, 9, 5, 11, 5, 19, 11, 19, 7, 19, 5, 14, 19, 14, 4, 19, 4, 17, 1, 12, 14, 1, 14, 5,
        1, 5, 9,
    ];
    polyhedron_geometry(&vertices, &indices, radius, detail)
}

/// `new THREE.OctahedronGeometry(radius, detail)`.
#[must_use]
pub fn octahedron_geometry(radius: f64, detail: u32) -> Mesh {
    let vertices = [
        1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0,
    ];
    let indices = [
        0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2,
    ];
    polyhedron_geometry(&vertices, &indices, radius, detail)
}

/// `new THREE.TetrahedronGeometry(radius, detail)`.
#[must_use]
pub fn tetrahedron_geometry(radius: f64, detail: u32) -> Mesh {
    let vertices = [
        1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
    ];
    let indices = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];
    polyhedron_geometry(&vertices, &indices, radius, detail)
}
