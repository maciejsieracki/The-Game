//! Parametric primitives: ports of Three.js r169 `BoxGeometry`,
//! `PlaneGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`,
//! `TorusGeometry`, `CircleGeometry` and `RingGeometry`.
//!
//! Segment counts are `u32` (Three applies `Math.floor` to them; the web code
//! only passes integers). All other parameters are f64 like JavaScript
//! numbers; degenerate values (zero size, zero height) follow the same IEEE
//! arithmetic as Three.js, including NaN/∞ where Three produces them.

use super::math::Vec3;
use super::{Builder, Mesh};
use crate::jsmath::{js_cos, js_sin};
use std::f64::consts::PI;

/// One `buildPlane(u, v, w, udir, vdir, width, height, depth, gridX, gridY,
/// materialIndex)` call of `BoxGeometry` (axes as indices x = 0, y = 1, z = 2).
type BoxPlane = (usize, usize, usize, f64, f64, f64, f64, f64, u32, u32, u32);

/// `new THREE.BoxGeometry(width, height, depth, wSeg, hSeg, dSeg)`.
///
/// Six faces in the order +x, −x, +y, −y, +z, −z, each its own material
/// group (0..=5).
#[must_use]
pub fn box_geometry(
    width: f64,
    height: f64,
    depth: f64,
    width_segments: u32,
    height_segments: u32,
    depth_segments: u32,
) -> Mesh {
    let mut b = Builder::default();
    let mut number_of_vertices: u32 = 0;
    let mut group_start: u32 = 0;
    // (u, v, w) axis indices: x = 0, y = 1, z = 2.
    let planes: [BoxPlane; 6] = [
        (
            2,
            1,
            0,
            -1.0,
            -1.0,
            depth,
            height,
            width,
            depth_segments,
            height_segments,
            0,
        ),
        (
            2,
            1,
            0,
            1.0,
            -1.0,
            depth,
            height,
            -width,
            depth_segments,
            height_segments,
            1,
        ),
        (
            0,
            2,
            1,
            1.0,
            1.0,
            width,
            depth,
            height,
            width_segments,
            depth_segments,
            2,
        ),
        (
            0,
            2,
            1,
            1.0,
            -1.0,
            width,
            depth,
            -height,
            width_segments,
            depth_segments,
            3,
        ),
        (
            0,
            1,
            2,
            1.0,
            -1.0,
            width,
            height,
            depth,
            width_segments,
            height_segments,
            4,
        ),
        (
            0,
            1,
            2,
            -1.0,
            -1.0,
            width,
            height,
            -depth,
            width_segments,
            height_segments,
            5,
        ),
    ];
    for (u, v, w, udir, vdir, pw, ph, pd, grid_x, grid_y, mat) in planes {
        let segment_width = pw / f64::from(grid_x);
        let segment_height = ph / f64::from(grid_y);
        let width_half = pw / 2.0;
        let height_half = ph / 2.0;
        let depth_half = pd / 2.0;
        let grid_x1 = grid_x + 1;
        let grid_y1 = grid_y + 1;
        let mut vertex_counter: u32 = 0;
        let mut group_count: u32 = 0;
        for iy in 0..grid_y1 {
            let y = f64::from(iy) * segment_height - height_half;
            for ix in 0..grid_x1 {
                let x = f64::from(ix) * segment_width - width_half;
                let mut vector = [0.0_f64; 3];
                vector[u] = x * udir;
                vector[v] = y * vdir;
                vector[w] = depth_half;
                b.pos.extend_from_slice(&vector);
                let mut n = [0.0_f64; 3];
                n[w] = if pd > 0.0 { 1.0 } else { -1.0 };
                b.nor.extend_from_slice(&n);
                b.uv.push(f64::from(ix) / f64::from(grid_x));
                b.uv.push(1.0 - (f64::from(iy) / f64::from(grid_y)));
                vertex_counter += 1;
            }
        }
        for iy in 0..grid_y {
            for ix in 0..grid_x {
                let a = number_of_vertices + ix + grid_x1 * iy;
                let bb = number_of_vertices + ix + grid_x1 * (iy + 1);
                let c = number_of_vertices + (ix + 1) + grid_x1 * (iy + 1);
                let d = number_of_vertices + (ix + 1) + grid_x1 * iy;
                b.idx.extend_from_slice(&[a, bb, d, bb, c, d]);
                group_count += 6;
            }
        }
        b.add_group(group_start, group_count, mat);
        group_start += group_count;
        number_of_vertices += vertex_counter;
    }
    b.finish_indexed()
}

/// `new THREE.PlaneGeometry(width, height, wSeg, hSeg)` in the XY plane,
/// normal +z.
#[must_use]
pub fn plane_geometry(width: f64, height: f64, width_segments: u32, height_segments: u32) -> Mesh {
    let mut b = Builder::default();
    let width_half = width / 2.0;
    let height_half = height / 2.0;
    let grid_x = width_segments;
    let grid_y = height_segments;
    let grid_x1 = grid_x + 1;
    let grid_y1 = grid_y + 1;
    let segment_width = width / f64::from(grid_x);
    let segment_height = height / f64::from(grid_y);
    for iy in 0..grid_y1 {
        let y = f64::from(iy) * segment_height - height_half;
        for ix in 0..grid_x1 {
            let x = f64::from(ix) * segment_width - width_half;
            b.pos.extend_from_slice(&[x, -y, 0.0]);
            b.nor.extend_from_slice(&[0.0, 0.0, 1.0]);
            b.uv.push(f64::from(ix) / f64::from(grid_x));
            b.uv.push(1.0 - (f64::from(iy) / f64::from(grid_y)));
        }
    }
    for iy in 0..grid_y {
        for ix in 0..grid_x {
            let a = ix + grid_x1 * iy;
            let bb = ix + grid_x1 * (iy + 1);
            let c = (ix + 1) + grid_x1 * (iy + 1);
            let d = (ix + 1) + grid_x1 * iy;
            b.idx.extend_from_slice(&[a, bb, d, bb, c, d]);
        }
    }
    b.finish_indexed()
}

/// `new THREE.CylinderGeometry(radiusTop, radiusBottom, height,
/// radialSegments, heightSegments, openEnded, thetaStart, thetaLength)`.
///
/// Groups: 0 = side, 1 = top cap (if `radius_top > 0`), 2 = bottom cap (if
/// `radius_bottom > 0`); caps are skipped when `open_ended`.
#[must_use]
#[allow(clippy::too_many_arguments, clippy::too_many_lines)]
pub fn cylinder_geometry(
    radius_top: f64,
    radius_bottom: f64,
    height: f64,
    radial_segments: u32,
    height_segments: u32,
    open_ended: bool,
    theta_start: f64,
    theta_length: f64,
) -> Mesh {
    let mut b = Builder::default();
    let mut index: u32 = 0;
    let mut index_array: Vec<Vec<u32>> = Vec::new();
    let half_height = height / 2.0;
    let mut group_start: u32 = 0;

    // generateTorso
    {
        let mut group_count: u32 = 0;
        let slope = (radius_bottom - radius_top) / height;
        for y in 0..=height_segments {
            let mut index_row = Vec::new();
            let v = f64::from(y) / f64::from(height_segments);
            let radius = v * (radius_bottom - radius_top) + radius_top;
            for x in 0..=radial_segments {
                let u = f64::from(x) / f64::from(radial_segments);
                let theta = u * theta_length + theta_start;
                let sin_theta = js_sin(theta);
                let cos_theta = js_cos(theta);
                b.pos.extend_from_slice(&[
                    radius * sin_theta,
                    -v * height + half_height,
                    radius * cos_theta,
                ]);
                let n = Vec3::new(sin_theta, slope, cos_theta).normalize();
                b.nor.extend_from_slice(&[n.x, n.y, n.z]);
                b.uv.extend_from_slice(&[u, 1.0 - v]);
                index_row.push(index);
                index += 1;
            }
            index_array.push(index_row);
        }
        for x in 0..radial_segments as usize {
            for y in 0..height_segments as usize {
                let a = index_array[y][x];
                let bb = index_array[y + 1][x];
                let c = index_array[y + 1][x + 1];
                let d = index_array[y][x + 1];
                if radius_top > 0.0 {
                    b.idx.extend_from_slice(&[a, bb, d]);
                    group_count += 3;
                }
                if radius_bottom > 0.0 {
                    b.idx.extend_from_slice(&[bb, c, d]);
                    group_count += 3;
                }
            }
        }
        b.add_group(group_start, group_count, 0);
        group_start += group_count;
    }

    let mut generate_cap = |b: &mut Builder, top: bool| {
        let center_index_start = index;
        let mut group_count: u32 = 0;
        let radius = if top { radius_top } else { radius_bottom };
        let sign = if top { 1.0 } else { -1.0 };
        for _ in 1..=radial_segments {
            b.pos.extend_from_slice(&[0.0, half_height * sign, 0.0]);
            b.nor.extend_from_slice(&[0.0, sign, 0.0]);
            b.uv.extend_from_slice(&[0.5, 0.5]);
            index += 1;
        }
        let center_index_end = index;
        for x in 0..=radial_segments {
            let u = f64::from(x) / f64::from(radial_segments);
            let theta = u * theta_length + theta_start;
            let cos_theta = js_cos(theta);
            let sin_theta = js_sin(theta);
            b.pos
                .extend_from_slice(&[radius * sin_theta, half_height * sign, radius * cos_theta]);
            b.nor.extend_from_slice(&[0.0, sign, 0.0]);
            b.uv.extend_from_slice(&[(cos_theta * 0.5) + 0.5, (sin_theta * 0.5 * sign) + 0.5]);
            index += 1;
        }
        for x in 0..radial_segments {
            let c = center_index_start + x;
            let i = center_index_end + x;
            if top {
                b.idx.extend_from_slice(&[i, i + 1, c]);
            } else {
                b.idx.extend_from_slice(&[i + 1, i, c]);
            }
            group_count += 3;
        }
        b.add_group(group_start, group_count, if top { 1 } else { 2 });
        group_start += group_count;
    };

    if !open_ended {
        if radius_top > 0.0 {
            generate_cap(&mut b, true);
        }
        if radius_bottom > 0.0 {
            generate_cap(&mut b, false);
        }
    }
    b.finish_indexed()
}

/// `new THREE.ConeGeometry(radius, height, radialSegments, heightSegments,
/// openEnded, thetaStart, thetaLength)` — a cylinder with `radiusTop = 0`.
#[must_use]
pub fn cone_geometry(
    radius: f64,
    height: f64,
    radial_segments: u32,
    height_segments: u32,
    open_ended: bool,
    theta_start: f64,
    theta_length: f64,
) -> Mesh {
    cylinder_geometry(
        0.0,
        radius,
        height,
        radial_segments,
        height_segments,
        open_ended,
        theta_start,
        theta_length,
    )
}

/// `new THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart,
/// phiLength, thetaStart, thetaLength)`; segment minimums 3 and 2 apply.
#[must_use]
#[allow(clippy::float_cmp)]
pub fn sphere_geometry(
    radius: f64,
    width_segments: u32,
    height_segments: u32,
    phi_start: f64,
    phi_length: f64,
    theta_start: f64,
    theta_length: f64,
) -> Mesh {
    let width_segments = width_segments.max(3);
    let height_segments = height_segments.max(2);
    let theta_end = (theta_start + theta_length).min(PI);
    let mut b = Builder::default();
    let mut index: u32 = 0;
    let mut grid: Vec<Vec<u32>> = Vec::new();
    for iy in 0..=height_segments {
        let mut row = Vec::new();
        let v = f64::from(iy) / f64::from(height_segments);
        let mut u_offset = 0.0;
        if iy == 0 && theta_start == 0.0 {
            u_offset = 0.5 / f64::from(width_segments);
        } else if iy == height_segments && theta_end == PI {
            u_offset = -0.5 / f64::from(width_segments);
        }
        for ix in 0..=width_segments {
            let u = f64::from(ix) / f64::from(width_segments);
            let vx = -radius
                * js_cos(phi_start + u * phi_length)
                * js_sin(theta_start + v * theta_length);
            let vy = radius * js_cos(theta_start + v * theta_length);
            let vz = radius
                * js_sin(phi_start + u * phi_length)
                * js_sin(theta_start + v * theta_length);
            b.pos.extend_from_slice(&[vx, vy, vz]);
            let n = Vec3::new(vx, vy, vz).normalize();
            b.nor.extend_from_slice(&[n.x, n.y, n.z]);
            b.uv.extend_from_slice(&[u + u_offset, 1.0 - v]);
            row.push(index);
            index += 1;
        }
        grid.push(row);
    }
    for iy in 0..height_segments as usize {
        for ix in 0..width_segments as usize {
            let a = grid[iy][ix + 1];
            let bb = grid[iy][ix];
            let c = grid[iy + 1][ix];
            let d = grid[iy + 1][ix + 1];
            if iy != 0 || theta_start > 0.0 {
                b.idx.extend_from_slice(&[a, bb, d]);
            }
            if iy != height_segments as usize - 1 || theta_end < PI {
                b.idx.extend_from_slice(&[bb, c, d]);
            }
        }
    }
    b.finish_indexed()
}

/// `new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments,
/// arc)` in the XY plane.
#[must_use]
pub fn torus_geometry(
    radius: f64,
    tube: f64,
    radial_segments: u32,
    tubular_segments: u32,
    arc: f64,
) -> Mesh {
    let mut b = Builder::default();
    for j in 0..=radial_segments {
        for i in 0..=tubular_segments {
            let u = f64::from(i) / f64::from(tubular_segments) * arc;
            let v = f64::from(j) / f64::from(radial_segments) * PI * 2.0;
            let vertex = Vec3::new(
                (radius + tube * js_cos(v)) * js_cos(u),
                (radius + tube * js_cos(v)) * js_sin(u),
                tube * js_sin(v),
            );
            b.pos.extend_from_slice(&[vertex.x, vertex.y, vertex.z]);
            // `center.z` is never written in Three (stays 0).
            let center = Vec3::new(radius * js_cos(u), radius * js_sin(u), 0.0);
            let n = vertex.minus(center).normalize();
            b.nor.extend_from_slice(&[n.x, n.y, n.z]);
            b.uv.push(f64::from(i) / f64::from(tubular_segments));
            b.uv.push(f64::from(j) / f64::from(radial_segments));
        }
    }
    for j in 1..=radial_segments {
        for i in 1..=tubular_segments {
            let a = (tubular_segments + 1) * j + i - 1;
            let bb = (tubular_segments + 1) * (j - 1) + i - 1;
            let c = (tubular_segments + 1) * (j - 1) + i;
            let d = (tubular_segments + 1) * j + i;
            b.idx.extend_from_slice(&[a, bb, d, bb, c, d]);
        }
    }
    b.finish_indexed()
}

/// `new THREE.CircleGeometry(radius, segments, thetaStart, thetaLength)` in
/// the XY plane; minimum 3 segments.
#[must_use]
pub fn circle_geometry(radius: f64, segments: u32, theta_start: f64, theta_length: f64) -> Mesh {
    let segments = segments.max(3);
    let mut b = Builder::default();
    b.pos.extend_from_slice(&[0.0, 0.0, 0.0]);
    b.nor.extend_from_slice(&[0.0, 0.0, 1.0]);
    b.uv.extend_from_slice(&[0.5, 0.5]);
    for s in 0..=segments {
        let segment = theta_start + f64::from(s) / f64::from(segments) * theta_length;
        let x = radius * js_cos(segment);
        let y = radius * js_sin(segment);
        b.pos.extend_from_slice(&[x, y, 0.0]);
        b.nor.extend_from_slice(&[0.0, 0.0, 1.0]);
        b.uv.extend_from_slice(&[(x / radius + 1.0) / 2.0, (y / radius + 1.0) / 2.0]);
    }
    for i in 1..=segments {
        b.idx.extend_from_slice(&[i, i + 1, 0]);
    }
    b.finish_indexed()
}

/// `new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments,
/// phiSegments, thetaStart, thetaLength)` in the XY plane; minimums 3 and 1.
#[must_use]
pub fn ring_geometry(
    inner_radius: f64,
    outer_radius: f64,
    theta_segments: u32,
    phi_segments: u32,
    theta_start: f64,
    theta_length: f64,
) -> Mesh {
    let theta_segments = theta_segments.max(3);
    let phi_segments = phi_segments.max(1);
    let mut b = Builder::default();
    let mut radius = inner_radius;
    let radius_step = (outer_radius - inner_radius) / f64::from(phi_segments);
    for _ in 0..=phi_segments {
        for i in 0..=theta_segments {
            let segment = theta_start + f64::from(i) / f64::from(theta_segments) * theta_length;
            let x = radius * js_cos(segment);
            let y = radius * js_sin(segment);
            b.pos.extend_from_slice(&[x, y, 0.0]);
            b.nor.extend_from_slice(&[0.0, 0.0, 1.0]);
            b.uv.extend_from_slice(&[
                (x / outer_radius + 1.0) / 2.0,
                (y / outer_radius + 1.0) / 2.0,
            ]);
        }
        radius += radius_step;
    }
    for j in 0..phi_segments {
        let level = j * (theta_segments + 1);
        for i in 0..theta_segments {
            let segment = i + level;
            let a = segment;
            let bb = segment + theta_segments + 1;
            let c = segment + theta_segments + 2;
            let d = segment + 1;
            b.idx.extend_from_slice(&[a, bb, d, bb, c, d]);
        }
    }
    b.finish_indexed()
}
