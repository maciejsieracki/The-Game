//! 2D shapes and their triangulated geometries: ports of Three.js r169
//! `Path`/`Shape` (straight segments only), `ShapeUtils`, `ShapeGeometry` and
//! `ExtrudeGeometry` (straight extrusion along +z, optional bevel, default
//! `WorldUVGenerator`).
//!
//! Scope (P4.8 §2): every web call site builds its shapes with `moveTo`,
//! `lineTo` and `closePath` only (hex rings, wall rings, the veteran star), so
//! curve segments (`absarc`, `quadraticCurveTo`, `bezierCurveTo`,
//! `splineThru`) and `extrudePath` are not ported. For straight segments
//! Three's `curveSegments` has no effect (a `LineCurve` is always sampled at
//! its two end points), so it is not a parameter here.

use super::earcut;
use super::ops::soup_with_flat_normals;
use super::{Builder, Group, Mesh};
use std::f64::consts::PI;

/// 2D point (Three `Vector2`).
pub type P2 = (f64, f64);

/// A path of straight segments (Three `Path` restricted to `LineCurve`s).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Path2 {
    current: P2,
    /// Line segments `(from, to)` in creation order.
    segments: Vec<(P2, P2)>,
}

impl Path2 {
    /// Empty path; the current point starts at the origin, like Three.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// `Path.setFromPoints(points)`: `moveTo` the first, `lineTo` the rest.
    #[must_use]
    pub fn from_points(points: &[P2]) -> Self {
        let mut p = Self::new();
        if let Some(&(x, y)) = points.first() {
            p.move_to(x, y);
            for &(x, y) in &points[1..] {
                p.line_to(x, y);
            }
        }
        p
    }

    /// `Path.moveTo(x, y)`.
    pub fn move_to(&mut self, x: f64, y: f64) -> &mut Self {
        self.current = (x, y);
        self
    }

    /// `Path.lineTo(x, y)`.
    pub fn line_to(&mut self, x: f64, y: f64) -> &mut Self {
        self.segments.push((self.current, (x, y)));
        self.current = (x, y);
        self
    }

    /// `Path.closePath()`: adds a segment back to the first point when the
    /// path is not already closed. No-op on an empty path.
    #[allow(clippy::float_cmp)]
    pub fn close_path(&mut self) -> &mut Self {
        if let (Some(first), Some(last)) = (self.segments.first(), self.segments.last()) {
            let start = line_point(first.0, first.1, 0.0);
            let end = line_point(last.0, last.1, 1.0);
            if start != end {
                self.segments.push((end, start));
            }
        }
        self
    }

    /// `CurvePath.getPoints()` for straight segments: both end points of each
    /// segment, skipping consecutive duplicates.
    #[must_use]
    #[allow(clippy::float_cmp)]
    pub fn points(&self) -> Vec<P2> {
        let mut out: Vec<P2> = Vec::new();
        for &(a, b) in &self.segments {
            for t in [0.0, 1.0] {
                let p = line_point(a, b, t);
                if out.last() == Some(&p) {
                    continue;
                }
                out.push(p);
            }
        }
        out
    }
}

/// `LineCurve.getPoint(t)`.
#[allow(clippy::float_cmp)]
fn line_point(v1: P2, v2: P2, t: f64) -> P2 {
    if t == 1.0 {
        v2
    } else {
        ((v2.0 - v1.0) * t + v1.0, (v2.1 - v1.1) * t + v1.1)
    }
}

/// A closed outline with holes (Three `Shape`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Shape {
    /// Outline.
    pub outline: Path2,
    /// Holes (`shape.holes`).
    pub holes: Vec<Path2>,
}

impl Shape {
    /// `Shape.extractPoints()`.
    #[must_use]
    pub fn extract_points(&self) -> (Vec<P2>, Vec<Vec<P2>>) {
        (
            self.outline.points(),
            self.holes.iter().map(Path2::points).collect(),
        )
    }
}

/// `ShapeUtils.area(contour)`.
#[must_use]
pub fn area(contour: &[P2]) -> f64 {
    let n = contour.len();
    let mut a = 0.0;
    if n == 0 {
        return a * 0.5;
    }
    let mut p = n - 1;
    for q in 0..n {
        a += contour[p].0 * contour[q].1 - contour[q].0 * contour[p].1;
        p = q;
    }
    a * 0.5
}

/// `ShapeUtils.isClockWise(pts)`.
#[must_use]
pub fn is_clockwise(pts: &[P2]) -> bool {
    area(pts) < 0.0
}

#[allow(clippy::float_cmp)]
fn remove_dup_end_pts(points: &mut Vec<P2>) {
    let l = points.len();
    if l > 2 && points[l - 1] == points[0] {
        points.pop();
    }
}

/// `ShapeUtils.triangulateShape(contour, holes)`. Like Three it removes a
/// duplicated closing point from `contour` and each hole **in place**.
pub fn triangulate_shape(contour: &mut Vec<P2>, holes: &mut [Vec<P2>]) -> Vec<[u32; 3]> {
    let mut vertices: Vec<f64> = Vec::new();
    let mut hole_indices: Vec<usize> = Vec::new();
    remove_dup_end_pts(contour);
    for p in contour.iter() {
        vertices.push(p.0);
        vertices.push(p.1);
    }
    let mut hole_index = contour.len();
    for h in holes.iter_mut() {
        remove_dup_end_pts(h);
    }
    for h in holes.iter() {
        hole_indices.push(hole_index);
        hole_index += h.len();
        for p in h {
            vertices.push(p.0);
            vertices.push(p.1);
        }
    }
    let tris = earcut::triangulate(&vertices, &hole_indices);
    tris.chunks_exact(3).map(|t| [t[0], t[1], t[2]]).collect()
}

/// `new THREE.ShapeGeometry(shape)` for a single shape: flat in z = 0,
/// normal +z, world-space UVs, no groups.
#[must_use]
pub fn shape_geometry(shape: &Shape) -> Mesh {
    let mut b = Builder::default();
    let mut gc = 0;
    add_flat_shape(&mut b, shape, &mut gc);
    b.finish_indexed()
}

/// `new THREE.ShapeGeometry([shapes...])`: one material group per shape.
#[must_use]
pub fn shape_geometry_multi(shapes: &[Shape]) -> Mesh {
    let mut b = Builder::default();
    let mut group_start = 0;
    for (i, s) in shapes.iter().enumerate() {
        let mut group_count = 0;
        add_flat_shape(&mut b, s, &mut group_count);
        b.add_group(
            group_start,
            group_count,
            u32::try_from(i).unwrap_or(u32::MAX),
        );
        group_start += group_count;
    }
    b.finish_indexed()
}

fn add_flat_shape(b: &mut Builder, shape: &Shape, group_count: &mut u32) {
    let index_offset = u32::try_from(b.pos.len() / 3).unwrap_or(u32::MAX);
    let (mut shape_vertices, mut holes) = shape.extract_points();
    if !is_clockwise(&shape_vertices) {
        shape_vertices.reverse();
    }
    for h in &mut holes {
        if is_clockwise(h) {
            h.reverse();
        }
    }
    let faces = triangulate_shape(&mut shape_vertices, &mut holes);
    for h in &holes {
        shape_vertices.extend_from_slice(h);
    }
    for &(x, y) in &shape_vertices {
        b.pos.extend_from_slice(&[x, y, 0.0]);
        b.nor.extend_from_slice(&[0.0, 0.0, 1.0]);
        b.uv.extend_from_slice(&[x, y]);
    }
    for f in faces {
        b.idx.extend_from_slice(&[
            f[0] + index_offset,
            f[1] + index_offset,
            f[2] + index_offset,
        ]);
        *group_count += 3;
    }
}

/// Options of [`extrude_geometry`] (Three `ExtrudeGeometry` options; the
/// defaults are Three's defaults).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ExtrudeOptions {
    /// `steps` (default 1).
    pub steps: u32,
    /// `depth` (default 1).
    pub depth: f64,
    /// `bevelEnabled` (default true).
    pub bevel_enabled: bool,
    /// `bevelThickness` (default 0.2).
    pub bevel_thickness: f64,
    /// `bevelSize` (default `bevelThickness - 0.1`).
    pub bevel_size: f64,
    /// `bevelOffset` (default 0).
    pub bevel_offset: f64,
    /// `bevelSegments` (default 3).
    pub bevel_segments: u32,
}

impl Default for ExtrudeOptions {
    fn default() -> Self {
        Self {
            steps: 1,
            depth: 1.0,
            bevel_enabled: true,
            bevel_thickness: 0.2,
            bevel_size: 0.2 - 0.1,
            bevel_offset: 0.0,
            bevel_segments: 3,
        }
    }
}

impl ExtrudeOptions {
    /// `{ depth, bevelEnabled: false }` — the form every web call site uses.
    #[must_use]
    pub fn flat(depth: f64) -> Self {
        Self {
            depth,
            bevel_enabled: false,
            ..Self::default()
        }
    }
}

/// `new THREE.ExtrudeGeometry(shapes, options)` (no `extrudePath`).
///
/// Non-indexed; per shape two groups: 0 = caps (front and back), 1 = side
/// walls. Normals from `computeVertexNormals()` (flat).
#[must_use]
pub fn extrude_geometry(shapes: &[Shape], options: &ExtrudeOptions) -> Mesh {
    let mut verts: Vec<f64> = Vec::new();
    let mut uvs: Vec<f64> = Vec::new();
    let mut groups: Vec<Group> = Vec::new();
    for s in shapes {
        add_extruded_shape(&mut verts, &mut uvs, &mut groups, s, options);
    }
    let mut m = soup_with_flat_normals(&verts, &uvs);
    m.groups = groups;
    m
}

/// `getBevelVec(inPt, inPrev, inNext)` of `ExtrudeGeometry`.
#[allow(clippy::similar_names)]
fn get_bevel_vec(in_pt: P2, in_prev: P2, in_next: P2) -> P2 {
    let (v_trans_x, v_trans_y, shrink_by);
    let v_prev_x = in_pt.0 - in_prev.0;
    let v_prev_y = in_pt.1 - in_prev.1;
    let v_next_x = in_next.0 - in_pt.0;
    let v_next_y = in_next.1 - in_pt.1;
    let v_prev_lensq = v_prev_x * v_prev_x + v_prev_y * v_prev_y;
    let collinear0 = v_prev_x * v_next_y - v_prev_y * v_next_x;
    if collinear0.abs() > f64::EPSILON {
        let v_prev_len = v_prev_lensq.sqrt();
        let v_next_len = (v_next_x * v_next_x + v_next_y * v_next_y).sqrt();
        let pt_prev_shift_x = in_prev.0 - v_prev_y / v_prev_len;
        let pt_prev_shift_y = in_prev.1 + v_prev_x / v_prev_len;
        let pt_next_shift_x = in_next.0 - v_next_y / v_next_len;
        let pt_next_shift_y = in_next.1 + v_next_x / v_next_len;
        let sf = ((pt_next_shift_x - pt_prev_shift_x) * v_next_y
            - (pt_next_shift_y - pt_prev_shift_y) * v_next_x)
            / (v_prev_x * v_next_y - v_prev_y * v_next_x);
        let tx = pt_prev_shift_x + v_prev_x * sf - in_pt.0;
        let ty = pt_prev_shift_y + v_prev_y * sf - in_pt.1;
        let v_trans_lensq = tx * tx + ty * ty;
        if v_trans_lensq <= 2.0 {
            return (tx, ty);
        }
        v_trans_x = tx;
        v_trans_y = ty;
        shrink_by = (v_trans_lensq / 2.0).sqrt();
    } else {
        let mut direction_eq = false;
        if v_prev_x > f64::EPSILON {
            if v_next_x > f64::EPSILON {
                direction_eq = true;
            }
        } else if v_prev_x < -f64::EPSILON {
            if v_next_x < -f64::EPSILON {
                direction_eq = true;
            }
        } else if js_sign_eq(v_prev_y, v_next_y) {
            direction_eq = true;
        }
        if direction_eq {
            v_trans_x = -v_prev_y;
            v_trans_y = v_prev_x;
            shrink_by = v_prev_lensq.sqrt();
        } else {
            v_trans_x = v_prev_x;
            v_trans_y = v_prev_y;
            shrink_by = (v_prev_lensq / 2.0).sqrt();
        }
    }
    (v_trans_x / shrink_by, v_trans_y / shrink_by)
}

/// `Math.sign(a) === Math.sign(b)`: NaN never equals anything, `+0`/`-0`
/// compare equal.
fn js_sign_eq(a: f64, b: f64) -> bool {
    let sign = |x: f64| -> Option<i8> {
        if x.is_nan() {
            None
        } else if x > 0.0 {
            Some(1)
        } else if x < 0.0 {
            Some(-1)
        } else {
            Some(0)
        }
    };
    match (sign(a), sign(b)) {
        (Some(x), Some(y)) => x == y,
        _ => false,
    }
}

fn scale_pt2(pt: P2, vec: P2, size: f64) -> P2 {
    (pt.0 + vec.0 * size, pt.1 + vec.1 * size)
}

#[allow(clippy::too_many_lines, clippy::cast_possible_truncation)]
fn add_extruded_shape(
    verts: &mut Vec<f64>,
    uvs: &mut Vec<f64>,
    groups: &mut Vec<Group>,
    shape: &Shape,
    o: &ExtrudeOptions,
) {
    let steps = o.steps;
    let depth = o.depth;
    let bevel_enabled = o.bevel_enabled;
    let (mut bevel_thickness, mut bevel_size, mut bevel_offset, mut bevel_segments) = (
        o.bevel_thickness,
        o.bevel_size,
        o.bevel_offset,
        o.bevel_segments,
    );
    if !bevel_enabled {
        bevel_segments = 0;
        bevel_thickness = 0.0;
        bevel_size = 0.0;
        bevel_offset = 0.0;
    }

    let (mut vertices, mut holes) = shape.extract_points();
    let reverse = !is_clockwise(&vertices);
    if reverse {
        vertices.reverse();
        for h in &mut holes {
            if is_clockwise(h) {
                h.reverse();
            }
        }
    }
    let faces = triangulate_shape(&mut vertices, &mut holes);
    let contour = vertices.clone();
    for h in &holes {
        vertices.extend_from_slice(h);
    }
    let vlen = vertices.len();

    let movements = |pts: &[P2]| -> Vec<P2> {
        let il = pts.len();
        (0..il)
            .map(|i| {
                let j = if i == 0 { il - 1 } else { i - 1 };
                let k = if i + 1 == il { 0 } else { i + 1 };
                get_bevel_vec(pts[i], pts[j], pts[k])
            })
            .collect()
    };
    let contour_movements = movements(&contour);
    let holes_movements: Vec<Vec<P2>> = holes.iter().map(|h| movements(h)).collect();
    let mut vertices_movements = contour_movements.clone();
    for hm in &holes_movements {
        vertices_movements.extend_from_slice(hm);
    }

    let mut placeholder: Vec<f64> = Vec::new();
    let mut v = |x: f64, y: f64, z: f64| placeholder.extend_from_slice(&[x, y, z]);

    let push_layer = |v: &mut dyn FnMut(f64, f64, f64), bs: f64, z: f64| {
        for (i, &c) in contour.iter().enumerate() {
            let vert = scale_pt2(c, contour_movements[i], bs);
            v(vert.0, vert.1, z);
        }
        for (h, ahole) in holes.iter().enumerate() {
            for (i, &p) in ahole.iter().enumerate() {
                let vert = scale_pt2(p, holes_movements[h][i], bs);
                v(vert.0, vert.1, z);
            }
        }
    };

    let bs_full = bevel_size + bevel_offset;
    for b in 0..bevel_segments {
        let t = f64::from(b) / f64::from(bevel_segments);
        let z = bevel_thickness * (t * PI / 2.0).cos();
        let bs = bevel_size * (t * PI / 2.0).sin() + bevel_offset;
        push_layer(&mut v, bs, -z);
    }
    for i in 0..vlen {
        let vert = if bevel_enabled {
            scale_pt2(vertices[i], vertices_movements[i], bs_full)
        } else {
            vertices[i]
        };
        v(vert.0, vert.1, 0.0);
    }
    for s in 1..=steps {
        for i in 0..vlen {
            let vert = if bevel_enabled {
                scale_pt2(vertices[i], vertices_movements[i], bs_full)
            } else {
                vertices[i]
            };
            v(vert.0, vert.1, depth / f64::from(steps) * f64::from(s));
        }
    }
    for b in (0..bevel_segments).rev() {
        let t = f64::from(b) / f64::from(bevel_segments);
        let z = bevel_thickness * (t * PI / 2.0).cos();
        let bs = bevel_size * (t * PI / 2.0).sin() + bevel_offset;
        push_layer(&mut v, bs, depth + z);
    }

    let add_vertex = |verts: &mut Vec<f64>, index: usize| {
        verts.extend_from_slice(&placeholder[index * 3..index * 3 + 3]);
    };
    let vlen32 = vlen;

    // buildLidFaces
    let start = verts.len() / 3;
    let f3 = |verts: &mut Vec<f64>, uvs: &mut Vec<f64>, a: usize, b: usize, c: usize| {
        add_vertex(verts, a);
        add_vertex(verts, b);
        add_vertex(verts, c);
        let n = verts.len() / 3;
        for k in [n - 3, n - 2, n - 1] {
            uvs.push(verts[k * 3]);
            uvs.push(verts[k * 3 + 1]);
        }
    };
    let fu = |x: u32| x as usize;
    if bevel_enabled {
        // layer 0: bottom faces
        for f in &faces {
            f3(verts, uvs, fu(f[2]), fu(f[1]), fu(f[0]));
        }
        let layer = steps as usize + bevel_segments as usize * 2;
        let offset = vlen32 * layer;
        for f in &faces {
            f3(
                verts,
                uvs,
                fu(f[0]) + offset,
                fu(f[1]) + offset,
                fu(f[2]) + offset,
            );
        }
    } else {
        for f in &faces {
            f3(verts, uvs, fu(f[2]), fu(f[1]), fu(f[0]));
        }
        let off = vlen32 * steps as usize;
        for f in &faces {
            f3(verts, uvs, fu(f[0]) + off, fu(f[1]) + off, fu(f[2]) + off);
        }
    }
    groups.push(Group {
        start: start as u32,
        count: (verts.len() / 3 - start) as u32,
        material_index: 0,
    });

    // buildSideFaces
    let start = verts.len() / 3;
    let mut layeroffset = 0;
    let layers = steps as usize + bevel_segments as usize * 2;
    let sidewalls = |verts: &mut Vec<f64>, uvs: &mut Vec<f64>, cl: usize, layeroffset: usize| {
        let mut i = cl;
        while i > 0 {
            i -= 1;
            let j = i;
            let k = if i == 0 { cl - 1 } else { i - 1 };
            for s in 0..layers {
                let slen1 = vlen32 * s;
                let slen2 = vlen32 * (s + 1);
                let a = layeroffset + j + slen1;
                let b = layeroffset + k + slen1;
                let c = layeroffset + k + slen2;
                let d = layeroffset + j + slen2;
                // f4(a, b, c, d)
                add_vertex(verts, a);
                add_vertex(verts, b);
                add_vertex(verts, d);
                add_vertex(verts, b);
                add_vertex(verts, c);
                add_vertex(verts, d);
                let n = verts.len() / 3;
                let q = side_wall_uv(verts, n - 6, n - 3, n - 2, n - 1);
                for &u in &[q[0], q[1], q[3], q[1], q[2], q[3]] {
                    uvs.push(u.0);
                    uvs.push(u.1);
                }
            }
        }
    };
    sidewalls(verts, uvs, contour.len(), layeroffset);
    layeroffset += contour.len();
    for h in &holes {
        sidewalls(verts, uvs, h.len(), layeroffset);
        layeroffset += h.len();
    }
    groups.push(Group {
        start: start as u32,
        count: (verts.len() / 3 - start) as u32,
        material_index: 1,
    });
}

/// `WorldUVGenerator.generateSideWallUV`.
fn side_wall_uv(v: &[f64], ia: usize, ib: usize, ic: usize, id: usize) -> [P2; 4] {
    let g = |i: usize| (v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
    let (a, b, c, d) = (g(ia), g(ib), g(ic), g(id));
    if (a.1 - b.1).abs() < (a.0 - b.0).abs() {
        [
            (a.0, 1.0 - a.2),
            (b.0, 1.0 - b.2),
            (c.0, 1.0 - c.2),
            (d.0, 1.0 - d.2),
        ]
    } else {
        [
            (a.1, 1.0 - a.2),
            (b.1, 1.0 - b.2),
            (c.1, 1.0 - c.2),
            (d.1, 1.0 - d.2),
        ]
    }
}
