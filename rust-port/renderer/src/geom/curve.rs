//! Ports of Three.js r169 `Curve` (arc-length parametrisation, numeric
//! tangents, Frenet frames), `CatmullRomCurve3` and `TubeGeometry`.
//!
//! The web uses exactly one tube (`units.ts`, trade-route ribbon:
//! `new TubeGeometry(new CatmullRomCurve3(points), …)`), and Catmull-Rom
//! sampling in `scene.ts` (river estuaries, hand-built `BufferGeometry`).

use super::math::{Mat4, Vec3};
use super::{Builder, Mesh};
use crate::jsmath::{js_acos, js_cos, js_pow, js_sin};
use std::cell::RefCell;
use std::f64::consts::PI;

/// `CatmullRomCurve3.curveType`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CurveType {
    /// `'centripetal'` (Three default).
    #[default]
    Centripetal,
    /// `'chordal'`.
    Chordal,
    /// `'catmullrom'` (uses `tension`).
    CatmullRom,
}

/// `new THREE.CatmullRomCurve3(points, closed, curveType, tension)`.
#[derive(Debug, Clone)]
pub struct CatmullRomCurve3 {
    /// Control points.
    pub points: Vec<Vec3>,
    /// Closed loop.
    pub closed: bool,
    /// Parametrisation.
    pub curve_type: CurveType,
    /// Tension for [`CurveType::CatmullRom`] (default 0.5).
    pub tension: f64,
    /// `Curve.arcLengthDivisions` (default 200).
    pub arc_length_divisions: u32,
    cache: RefCell<Option<Vec<f64>>>,
}

/// Cubic polynomial of `CatmullRomCurve3.js` (`CubicPoly`).
#[derive(Clone, Copy)]
struct CubicPoly {
    c0: f64,
    c1: f64,
    c2: f64,
    c3: f64,
}

impl CubicPoly {
    fn init(x0: f64, x1: f64, t0: f64, t1: f64) -> Self {
        Self {
            c0: x0,
            c1: t0,
            c2: -3.0 * x0 + 3.0 * x1 - 2.0 * t0 - t1,
            c3: 2.0 * x0 - 2.0 * x1 + t0 + t1,
        }
    }

    fn catmull_rom(x0: f64, x1: f64, x2: f64, x3: f64, tension: f64) -> Self {
        Self::init(x1, x2, tension * (x2 - x0), tension * (x3 - x1))
    }

    #[allow(clippy::too_many_arguments)]
    fn nonuniform(x0: f64, x1: f64, x2: f64, x3: f64, dt0: f64, dt1: f64, dt2: f64) -> Self {
        let mut t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
        let mut t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
        t1 *= dt1;
        t2 *= dt1;
        Self::init(x1, x2, t1, t2)
    }

    fn calc(&self, t: f64) -> f64 {
        let t2 = t * t;
        let t3 = t2 * t;
        self.c0 + self.c1 * t + self.c2 * t2 + self.c3 * t3
    }
}

impl CatmullRomCurve3 {
    /// Curve with Three's defaults for the remaining parameters.
    #[must_use]
    pub fn new(points: Vec<Vec3>, closed: bool, curve_type: CurveType, tension: f64) -> Self {
        Self {
            points,
            closed,
            curve_type,
            tension,
            arc_length_divisions: 200,
            cache: RefCell::new(None),
        }
    }

    /// `getPoint(t)`, `t ∈ [0, 1]`. Needs at least 2 points.
    #[must_use]
    #[allow(
        clippy::float_cmp,
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        clippy::cast_possible_wrap
    )]
    pub fn get_point(&self, t: f64) -> Vec3 {
        let points = &self.points;
        let l = points.len() as i64;
        let p = (l - i64::from(!self.closed)) as f64 * t;
        let mut int_point = p.floor() as i64;
        let mut weight = p - p.floor();
        if self.closed {
            int_point += if int_point > 0 {
                0
            } else {
                (int_point.abs() / l + 1) * l
            };
        } else if weight == 0.0 && int_point == l - 1 {
            int_point = l - 2;
            weight = 1.0;
        }
        let at = |k: i64| points[k.rem_euclid(l) as usize];
        // Three stores both extrapolated end points in one shared temporary
        // vector (`tmp`), so when both are extrapolated (2-point open curve)
        // p0 ends up equal to p3. Reproduced deliberately.
        let mut p0_is_tmp = false;
        let mut tmp = Vec3::default();
        let mut p0 = if self.closed || int_point > 0 {
            at(int_point - 1)
        } else {
            tmp = points[0].minus(points[1]).plus(points[0]);
            p0_is_tmp = true;
            tmp
        };
        let p1 = at(int_point);
        let p2 = at(int_point + 1);
        let p3 = if self.closed || int_point + 2 < l {
            at(int_point + 2)
        } else {
            let lu = l as usize;
            tmp = points[lu - 1].minus(points[lu - 2]).plus(points[lu - 1]);
            tmp
        };
        if p0_is_tmp {
            p0 = tmp;
        }
        let (px, py, pz) = match self.curve_type {
            CurveType::Centripetal | CurveType::Chordal => {
                let pow = if self.curve_type == CurveType::Chordal {
                    0.5
                } else {
                    0.25
                };
                let mut dt0 = js_pow(p0.distance_to_squared(p1), pow);
                let mut dt1 = js_pow(p1.distance_to_squared(p2), pow);
                let mut dt2 = js_pow(p2.distance_to_squared(p3), pow);
                if dt1 < 1e-4 {
                    dt1 = 1.0;
                }
                if dt0 < 1e-4 {
                    dt0 = dt1;
                }
                if dt2 < 1e-4 {
                    dt2 = dt1;
                }
                (
                    CubicPoly::nonuniform(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2),
                    CubicPoly::nonuniform(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2),
                    CubicPoly::nonuniform(p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2),
                )
            }
            CurveType::CatmullRom => (
                CubicPoly::catmull_rom(p0.x, p1.x, p2.x, p3.x, self.tension),
                CubicPoly::catmull_rom(p0.y, p1.y, p2.y, p3.y, self.tension),
                CubicPoly::catmull_rom(p0.z, p1.z, p2.z, p3.z, self.tension),
            ),
        };
        Vec3::new(px.calc(weight), py.calc(weight), pz.calc(weight))
    }

    /// `Curve.getLengths()` (cached, `arcLengthDivisions + 1` entries).
    #[must_use]
    pub fn get_lengths(&self) -> Vec<f64> {
        if let Some(c) = self.cache.borrow().as_ref() {
            return c.clone();
        }
        let divisions = self.arc_length_divisions;
        let mut cache = Vec::with_capacity(divisions as usize + 1);
        let mut last = self.get_point(0.0);
        let mut sum = 0.0;
        cache.push(0.0);
        for p in 1..=divisions {
            let current = self.get_point(f64::from(p) / f64::from(divisions));
            sum += current.distance_to(last);
            cache.push(sum);
            last = current;
        }
        *self.cache.borrow_mut() = Some(cache.clone());
        cache
    }

    /// `Curve.getUtoTmapping(u)`.
    #[must_use]
    #[allow(clippy::float_cmp, clippy::cast_precision_loss)]
    pub fn get_u_to_t_mapping(&self, u: f64) -> f64 {
        let arc = self.get_lengths();
        let il = arc.len();
        let target = u * arc[il - 1];
        let mut low: i64 = 0;
        let mut high: i64 = il as i64 - 1;
        while low <= high {
            let i = low + (high - low) / 2;
            #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
            let comparison = arc[i as usize] - target;
            if comparison < 0.0 {
                low = i + 1;
            } else if comparison > 0.0 {
                high = i - 1;
            } else {
                high = i;
                break;
            }
        }
        #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
        let i = high.max(0) as usize;
        if arc[i] == target {
            return i as f64 / (il - 1) as f64;
        }
        let length_before = arc[i];
        let length_after = arc.get(i + 1).copied().unwrap_or(f64::NAN);
        let segment_length = length_after - length_before;
        let segment_fraction = (target - length_before) / segment_length;
        (i as f64 + segment_fraction) / (il - 1) as f64
    }

    /// `Curve.getPointAt(u)` (arc-length parameter).
    #[must_use]
    pub fn get_point_at(&self, u: f64) -> Vec3 {
        self.get_point(self.get_u_to_t_mapping(u))
    }

    /// `Curve.getTangent(t)` (numeric, Δ = 0.0001).
    #[must_use]
    pub fn get_tangent(&self, t: f64) -> Vec3 {
        let delta = 0.0001;
        let mut t1 = t - delta;
        let mut t2 = t + delta;
        if t1 < 0.0 {
            t1 = 0.0;
        }
        if t2 > 1.0 {
            t2 = 1.0;
        }
        let pt1 = self.get_point(t1);
        let pt2 = self.get_point(t2);
        pt2.minus(pt1).normalize()
    }

    /// `Curve.getTangentAt(u)`.
    #[must_use]
    pub fn get_tangent_at(&self, u: f64) -> Vec3 {
        self.get_tangent(self.get_u_to_t_mapping(u))
    }

    /// `Curve.computeFrenetFrames(segments, closed)` → (tangents, normals,
    /// binormals), each `segments + 1` long.
    #[must_use]
    pub fn compute_frenet_frames(&self, segments: u32, closed: bool) -> FrenetFrames {
        let mut tangents = Vec::with_capacity(segments as usize + 1);
        for i in 0..=segments {
            let u = f64::from(i) / f64::from(segments);
            tangents.push(self.get_tangent_at(u));
        }
        let t0 = tangents[0];
        let mut min = f64::MAX;
        let tx = t0.x.abs();
        let ty = t0.y.abs();
        let tz = t0.z.abs();
        let mut normal = Vec3::default();
        if tx <= min {
            min = tx;
            normal = Vec3::new(1.0, 0.0, 0.0);
        }
        if ty <= min {
            min = ty;
            normal = Vec3::new(0.0, 1.0, 0.0);
        }
        if tz <= min {
            normal = Vec3::new(0.0, 0.0, 1.0);
        }
        let mut vec = t0.cross(normal).normalize();
        let mut normals = vec![t0.cross(vec)];
        let mut binormals = vec![t0.cross(normals[0])];
        for i in 1..=segments as usize {
            let mut n = normals[i - 1];
            vec = tangents[i - 1].cross(tangents[i]);
            if vec.length() > f64::EPSILON {
                vec = vec.normalize();
                let theta = js_acos(clamp(tangents[i - 1].dot(tangents[i]), -1.0, 1.0));
                n = n.apply_mat4(&Mat4::rotation_axis(vec, theta));
            }
            normals.push(n);
            binormals.push(tangents[i].cross(n));
        }
        if closed {
            let seg = segments as usize;
            let mut theta = js_acos(clamp(normals[0].dot(normals[seg]), -1.0, 1.0));
            theta /= f64::from(segments);
            if tangents[0].dot(normals[0].cross(normals[seg])) > 0.0 {
                theta = -theta;
            }
            for i in 1..=seg {
                #[allow(clippy::cast_precision_loss)]
                let m = Mat4::rotation_axis(tangents[i], theta * i as f64);
                normals[i] = normals[i].apply_mat4(&m);
                binormals[i] = tangents[i].cross(normals[i]);
            }
        }
        FrenetFrames {
            tangents,
            normals,
            binormals,
        }
    }
}

/// `MathUtils.clamp(v, min, max)` = `Math.max(min, Math.min(max, v))`.
fn clamp(v: f64, min: f64, max: f64) -> f64 {
    if v.is_nan() {
        return f64::NAN;
    }
    min.max(max.min(v))
}

/// Result of [`CatmullRomCurve3::compute_frenet_frames`].
#[derive(Debug, Clone)]
pub struct FrenetFrames {
    /// Unit tangents.
    pub tangents: Vec<Vec3>,
    /// Normals.
    pub normals: Vec<Vec3>,
    /// Binormals.
    pub binormals: Vec<Vec3>,
}

/// `new THREE.TubeGeometry(path, tubularSegments, radius, radialSegments,
/// closed)`.
#[must_use]
pub fn tube_geometry(
    path: &CatmullRomCurve3,
    tubular_segments: u32,
    radius: f64,
    radial_segments: u32,
    closed: bool,
) -> Mesh {
    let frames = path.compute_frenet_frames(tubular_segments, closed);
    let mut b = Builder::default();
    let gen_segment = |b: &mut Builder, i: u32| {
        let p = path.get_point_at(f64::from(i) / f64::from(tubular_segments));
        let n = frames.normals[i as usize];
        let bn = frames.binormals[i as usize];
        for j in 0..=radial_segments {
            let v = f64::from(j) / f64::from(radial_segments) * PI * 2.0;
            let sin = js_sin(v);
            let cos = -js_cos(v);
            let normal = Vec3::new(
                cos * n.x + sin * bn.x,
                cos * n.y + sin * bn.y,
                cos * n.z + sin * bn.z,
            )
            .normalize();
            b.nor.extend_from_slice(&[normal.x, normal.y, normal.z]);
            b.pos.extend_from_slice(&[
                p.x + radius * normal.x,
                p.y + radius * normal.y,
                p.z + radius * normal.z,
            ]);
        }
    };
    for i in 0..tubular_segments {
        gen_segment(&mut b, i);
    }
    gen_segment(&mut b, if closed { 0 } else { tubular_segments });
    for i in 0..=tubular_segments {
        for j in 0..=radial_segments {
            b.uv.push(f64::from(i) / f64::from(tubular_segments));
            b.uv.push(f64::from(j) / f64::from(radial_segments));
        }
    }
    for j in 1..=tubular_segments {
        for i in 1..=radial_segments {
            let a = (radial_segments + 1) * (j - 1) + (i - 1);
            let bb = (radial_segments + 1) * j + (i - 1);
            let c = (radial_segments + 1) * j + i;
            let d = (radial_segments + 1) * (j - 1) + i;
            b.idx.extend_from_slice(&[a, bb, d, bb, c, d]);
        }
    }
    b.finish_indexed()
}
