//! The Canvas 2D "current default path" (RR-T8a).
//!
//! Points are stored in **device space**: each path call is transformed by
//! the current transformation matrix *at the time of the call*, exactly as
//! HTML Canvas specifies (a later `setTransform` does not move an already
//! built path). Arcs are built as rational quadratic (conic) segments the way
//! Skia does it and converted to quadratic Béziers in device space with the
//! Skia tolerance of 0.25 px (tiny-skia does not expose conics publicly).
//!
//! Semantics follow the HTML Canvas specification; where Chromium/Skia is
//! the reference implementation the algorithm is named in the comment and is
//! marked `[zewn.]` in `P4-28-RASTER-SHAPES.md` §3 — it is checked
//! empirically against Chromium pixels in `tests/raster_scenes.rs`, not by
//! reading Chromium sources.

use super::Affine;
use crate::jsmath::{js_cos, js_sin};

/// A device-space point.
#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct Pt {
    pub x: f32,
    pub y: f32,
}

impl Pt {
    fn new(x: f32, y: f32) -> Pt {
        Pt { x, y }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) enum Seg {
    Move(Pt),
    Line(Pt),
    Quad(Pt, Pt),
    Close,
}

/// Conic → quads: Skia's tolerance and its upper bound on subdivisions.
const CONIC_TOLERANCE: f32 = 0.25;
const MAX_CONIC_TO_QUAD_POW2: u32 = 5;
/// `SK_ScalarNearlyZero` = 1 / 2^12.
const NEARLY_ZERO: f32 = 1.0 / 4096.0;
const TWO_PI_F32: f32 = std::f32::consts::TAU;

#[derive(Clone, Debug, Default)]
pub(crate) struct CanvasPath {
    segs: Vec<Seg>,
    /// Last point of the current subpath (device space); `None` = no subpath.
    current: Option<Pt>,
    /// First point of the current subpath (device space).
    start: Option<Pt>,
}

impl CanvasPath {
    pub fn clear(&mut self) {
        self.segs.clear();
        self.current = None;
        self.start = None;
    }

    pub fn segs(&self) -> &[Seg] {
        &self.segs
    }

    fn move_dev(&mut self, p: Pt) {
        // Consecutive moveTo's: only the last one starts the subpath.
        if let Some(Seg::Move(_)) = self.segs.last() {
            self.segs.pop();
        }
        self.segs.push(Seg::Move(p));
        self.current = Some(p);
        self.start = Some(p);
    }

    fn line_dev(&mut self, p: Pt) {
        if self.current.is_none() {
            self.move_dev(p);
            return;
        }
        self.segs.push(Seg::Line(p));
        self.current = Some(p);
    }

    fn quad_dev(&mut self, c: Pt, p: Pt) {
        if self.current.is_none() {
            self.move_dev(c);
        }
        self.segs.push(Seg::Quad(c, p));
        self.current = Some(p);
    }

    /// `ctx.moveTo(x, y)`.
    pub fn move_to(&mut self, ctm: &Affine, x: f64, y: f64) {
        if !(x.is_finite() && y.is_finite()) {
            return;
        }
        self.move_dev(ctm.map(x, y));
    }

    /// `ctx.lineTo(x, y)`; without a subpath it acts as `moveTo`.
    pub fn line_to(&mut self, ctm: &Affine, x: f64, y: f64) {
        if !(x.is_finite() && y.is_finite()) {
            return;
        }
        self.line_dev(ctm.map(x, y));
    }

    /// `ctx.quadraticCurveTo(cpx, cpy, x, y)`; without a subpath it first
    /// moves to the control point (spec: "ensure there is a subpath").
    pub fn quadratic_curve_to(&mut self, ctm: &Affine, cpx: f64, cpy: f64, x: f64, y: f64) {
        if ![cpx, cpy, x, y].iter().all(|v| v.is_finite()) {
            return;
        }
        self.quad_dev(ctm.map(cpx, cpy), ctm.map(x, y));
    }

    /// `ctx.closePath()`.
    pub fn close_path(&mut self) {
        let Some(start) = self.start else { return };
        if !matches!(self.segs.last(), Some(Seg::Close) | None) {
            self.segs.push(Seg::Close);
        }
        // The spec starts a new subpath at the first point of the closed one.
        self.current = Some(start);
    }

    /// A conic from the current point, all points in device space
    /// (affine maps keep conics conics with the same weight).
    fn conic_dev(&mut self, p1: Pt, p2: Pt, w: f32) {
        let p0 = self.current.expect("conic_dev requires a current point");
        if w.is_nan() || w <= 0.0 || !w.is_finite() {
            self.line_dev(p2);
            return;
        }
        let pow2 = conic_quad_pow2(p0, p1, p2, w);
        let mut out = Vec::with_capacity(2 << pow2);
        subdivide_conic([p0, p1, p2], w, pow2, &mut out);
        for q in out.chunks_exact(2) {
            self.quad_dev(q[0], q[1]);
        }
    }

    /// `ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise)`.
    ///
    /// Blink: degenerate arcs become a line to the start point; angles are
    /// canonicalised to `0 <= start < 2π`; a sweep of `>= 2π` is the whole
    /// circle, built as two 180° Skia `arcTo(oval, …)` calls so that the
    /// subpath stays open (no join at the seam) — `[zewn.]`.
    ///
    /// Returns `false` for a negative radius (Canvas: `IndexSizeError`); the
    /// path is then unchanged.
    #[allow(clippy::too_many_arguments)]
    pub fn arc(
        &mut self,
        ctm: &Affine,
        x: f64,
        y: f64,
        radius: f64,
        start: f64,
        end: f64,
        anticlockwise: bool,
    ) -> bool {
        if ![x, y, radius, start, end].iter().all(|v| v.is_finite()) {
            return true;
        }
        if radius < 0.0 {
            return false;
        }
        let (xf, yf, rf) = (x as f32, y as f32, radius as f32);
        let (mut s, mut e) = (start as f32, end as f32);
        if rf == 0.0 || s == e {
            let px = xf + rf * cos32(s);
            let py = yf + rf * sin32(s);
            self.line_dev(ctm.map(f64::from(px), f64::from(py)));
            return true;
        }
        // CanonicalizeAngle.
        let mut ns = s % TWO_PI_F32;
        if ns < 0.0 {
            ns += TWO_PI_F32;
            if ns >= TWO_PI_F32 {
                ns -= TWO_PI_F32;
            }
        }
        let delta = ns - s;
        s = ns;
        e += delta;
        // AdjustEndAngle.
        if !anticlockwise && e - s >= TWO_PI_F32 {
            e = s + TWO_PI_F32;
        } else if anticlockwise && s - e >= TWO_PI_F32 {
            e = s - TWO_PI_F32;
        } else if !anticlockwise && s > e {
            e = s + (TWO_PI_F32 - (s - e) % TWO_PI_F32);
        } else if anticlockwise && s < e {
            e = s - (TWO_PI_F32 - (e - s) % TWO_PI_F32);
        }
        let start_deg = s.to_degrees();
        let sweep_deg = (e - s).to_degrees();
        if nearly_equal(sweep_deg, 360.0) {
            self.oval_arc(ctm, xf, yf, rf, start_deg, 180.0);
            self.oval_arc(ctm, xf, yf, rf, start_deg + 180.0, 180.0);
        } else if nearly_equal(sweep_deg, -360.0) {
            self.oval_arc(ctm, xf, yf, rf, start_deg, -180.0);
            self.oval_arc(ctm, xf, yf, rf, start_deg - 180.0, -180.0);
        } else {
            self.oval_arc(ctm, xf, yf, rf, start_deg, sweep_deg);
        }
        true
    }

    /// Skia `SkPath::arcTo(oval, startDeg, sweepDeg, forceMoveTo = false)`
    /// for a circle of radius `r` centred at `(cx, cy)` (user space).
    fn oval_arc(&mut self, ctm: &Affine, cx: f32, cy: f32, r: f32, start_deg: f32, sweep_deg: f32) {
        let start_rad = start_deg.to_radians();
        let stop_rad = (start_deg + sweep_deg).to_radians();
        let u_start = Pt::new(cos_snap(start_rad), sin_snap(start_rad));
        let mut u_stop = Pt::new(cos_snap(stop_rad), sin_snap(stop_rad));
        let cw = sweep_deg > 0.0;
        if u_start == u_stop {
            // Skia nudges a nearly-full sweep so it is not mistaken for zero.
            let sw = sweep_deg.abs();
            if sw < 360.0 && sw > 359.0 {
                let delta = if cw { 1.0f32 / 512.0 } else { -1.0 / 512.0 };
                let mut stop = stop_rad;
                loop {
                    stop -= delta;
                    u_stop = Pt::new(cos_snap(stop), sin_snap(stop));
                    if u_stop != u_start {
                        break;
                    }
                }
            }
        }
        let user = |p: Pt| ctm.map(f64::from(cx + p.x * r), f64::from(cy + p.y * r));
        match build_unit_arc(u_start, u_stop, cw) {
            Some(conics) if !conics.is_empty() => {
                let first = user(conics[0].0[0]);
                match self.current {
                    None => self.move_dev(first),
                    Some(cur) if cur == first => {}
                    Some(_) => self.line_dev(first),
                }
                for (pts, w) in conics {
                    self.conic_dev(user(pts[1]), user(pts[2]), w);
                }
            }
            _ => {
                // Single point arc (zero sweep after snapping).
                let p = user(u_stop);
                if self.current.is_none() {
                    self.move_dev(p);
                } else {
                    self.line_dev(p);
                }
            }
        }
    }

    /// `ctx.arcTo(x1, y1, x2, y2, radius)` — Skia `SkPath::arcTo(x1, y1, x2,
    /// y2, r)`: a line to the first tangent point plus one conic whose control
    /// point is `(x1, y1)`.
    ///
    /// Returns `false` for a negative radius (Canvas: `IndexSizeError`).
    pub fn arc_to(
        &mut self,
        ctm: &Affine,
        x1: f64,
        y1: f64,
        x2: f64,
        y2: f64,
        radius: f64,
    ) -> bool {
        if ![x1, y1, x2, y2, radius].iter().all(|v| v.is_finite()) {
            return true;
        }
        if radius < 0.0 {
            return false;
        }
        if self.current.is_none() {
            self.move_dev(ctm.map(x1, y1));
        }
        // The spec works in user space: map the last point back.
        let Some(inv) = ctm.invert() else {
            return true;
        };
        let cur = self.current.expect("ensured above");
        let p0 = inv.map(f64::from(cur.x), f64::from(cur.y));
        let (x1f, y1f, x2f, y2f, r) = (x1 as f32, y1 as f32, x2 as f32, y2 as f32, radius as f32);
        if r == 0.0 {
            self.line_dev(ctm.map(x1, y1));
            return true;
        }
        let before = normalize(x1f - p0.x, y1f - p0.y);
        let after = normalize(x2f - x1f, y2f - y1f);
        let (Some(b), Some(a)) = (before, after) else {
            self.line_dev(ctm.map(x1, y1));
            return true;
        };
        let cosh = b.x * a.x + b.y * a.y;
        let sinh = b.x * a.y - b.y * a.x;
        if !sinh.is_finite() || sinh.abs() <= NEARLY_ZERO {
            self.line_dev(ctm.map(x1, y1));
            return true;
        }
        let dist = (r * (1.0 - cosh) / sinh).abs();
        let xx = x1f - dist * b.x;
        let yy = y1f - dist * b.y;
        self.line_dev(ctm.map(f64::from(xx), f64::from(yy)));
        let weight = (0.5 + cosh * 0.5).sqrt();
        let end = Pt::new(x1f + a.x * dist, y1f + a.y * dist);
        self.conic_dev(
            ctm.map(x1, y1),
            ctm.map(f64::from(end.x), f64::from(end.y)),
            weight,
        );
        true
    }

    /// `ctx.roundRect(x, y, w, h, radius)` with a single non-negative radius
    /// (the only form the web uses, `units.ts:6590`). Corners are quarter
    /// conics (as `SkPath::addRRect`); radii larger than half a side are
    /// scaled down per the spec; a new subpath at `(x, y)` follows.
    ///
    /// Returns `false` for a negative radius (Canvas: `RangeError`).
    pub fn round_rect(
        &mut self,
        ctm: &Affine,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        radius: f64,
    ) -> bool {
        if ![x, y, w, h, radius].iter().all(|v| v.is_finite()) {
            return true;
        }
        if radius < 0.0 {
            return false;
        }
        let mut r = radius;
        // Spec: scale = min(|w| / (2r), |h| / (2r)) when a corner overlaps.
        if r > 0.0 {
            let scale = (w.abs() / (2.0 * r)).min(h.abs() / (2.0 * r));
            if scale < 1.0 {
                r *= scale;
            }
        }
        let rx = r * w.signum();
        let ry = r * h.signum();
        let corner = std::f32::consts::FRAC_1_SQRT_2;
        let m = |px: f64, py: f64| ctm.map(px, py);
        self.move_dev(m(x + rx, y));
        self.line_dev(m(x + w - rx, y));
        if r > 0.0 {
            self.conic_dev(m(x + w, y), m(x + w, y + ry), corner);
        }
        self.line_dev(m(x + w, y + h - ry));
        if r > 0.0 {
            self.conic_dev(m(x + w, y + h), m(x + w - rx, y + h), corner);
        }
        self.line_dev(m(x + rx, y + h));
        if r > 0.0 {
            self.conic_dev(m(x, y + h), m(x, y + h - ry), corner);
        }
        self.line_dev(m(x, y + ry));
        if r > 0.0 {
            self.conic_dev(m(x, y), m(x + rx, y), corner);
        }
        self.close_path();
        self.move_dev(m(x, y));
        true
    }

    /// Builds a tiny-skia path (device space). `None` when nothing fillable.
    pub fn to_skia(&self) -> Option<tiny_skia::Path> {
        segs_to_skia(&self.segs)
    }
}

pub(crate) fn segs_to_skia(segs: &[Seg]) -> Option<tiny_skia::Path> {
    let mut pb = tiny_skia::PathBuilder::new();
    for s in segs {
        match *s {
            Seg::Move(p) => pb.move_to(p.x, p.y),
            Seg::Line(p) => pb.line_to(p.x, p.y),
            Seg::Quad(c, p) => pb.quad_to(c.x, c.y, p.x, p.y),
            Seg::Close => pb.close(),
        }
    }
    pb.finish()
}

fn nearly_equal(a: f32, b: f32) -> bool {
    (a - b).abs() <= NEARLY_ZERO
}

fn sin_snap(rad: f32) -> f32 {
    let v = sin32(rad);
    if v.abs() <= NEARLY_ZERO {
        0.0
    } else {
        v
    }
}

fn cos_snap(rad: f32) -> f32 {
    let v = cos32(rad);
    if v.abs() <= NEARLY_ZERO {
        0.0
    } else {
        v
    }
}

/// `f32` sine/cosine through the crate's V8-parity `jsmath` (deterministic on
/// every platform; the crate forbids libm transcendentals, see
/// `tests/jsmath_wiring.rs`). Skia uses `sinf`/`cosf`; the difference is at
/// most a few ULP of `f32`.
fn sin32(x: f32) -> f32 {
    js_sin(f64::from(x)) as f32
}

fn cos32(x: f32) -> f32 {
    js_cos(f64::from(x)) as f32
}

fn normalize(x: f32, y: f32) -> Option<Pt> {
    let len = (x * x + y * y).sqrt();
    if len.is_nan() || len <= 0.0 || !len.is_finite() {
        return None;
    }
    Some(Pt::new(x / len, y / len))
}

/// Skia `SkConic::BuildUnitArc`: unit-circle conics from `u_start` to
/// `u_stop`, one per full quadrant plus a remainder. `None` = coincident
/// vectors (no arc).
#[allow(clippy::type_complexity)]
fn build_unit_arc(u_start: Pt, u_stop: Pt, cw: bool) -> Option<Vec<([Pt; 3], f32)>> {
    let x = u_start.x * u_stop.x + u_start.y * u_stop.y;
    let mut y = u_start.x * u_stop.y - u_start.y * u_stop.x;
    let abs_y = y.abs();
    if abs_y <= NEARLY_ZERO && x > 0.0 && ((y >= 0.0 && cw) || (y <= 0.0 && !cw)) {
        return None;
    }
    if !cw {
        y = -y;
    }
    let quadrant: usize = if y == 0.0 {
        2
    } else if x == 0.0 {
        if y > 0.0 {
            1
        } else {
            3
        }
    } else {
        let mut q = 0;
        if y < 0.0 {
            q += 2;
        }
        if (x < 0.0) != (y < 0.0) {
            q += 1;
        }
        q
    };
    const Q: [Pt; 8] = [
        Pt { x: 1.0, y: 0.0 },
        Pt { x: 1.0, y: 1.0 },
        Pt { x: 0.0, y: 1.0 },
        Pt { x: -1.0, y: 1.0 },
        Pt { x: -1.0, y: 0.0 },
        Pt { x: -1.0, y: -1.0 },
        Pt { x: 0.0, y: -1.0 },
        Pt { x: 1.0, y: -1.0 },
    ];
    let w = std::f32::consts::FRAC_1_SQRT_2;
    let mut out: Vec<([Pt; 3], f32)> = Vec::with_capacity(5);
    for i in 0..quadrant {
        out.push(([Q[i * 2], Q[i * 2 + 1], Q[(i * 2 + 2) % 8]], w));
    }
    let last_q = Q[(quadrant * 2) % 8];
    let dot = last_q.x * x + last_q.y * y;
    if dot < 1.0 {
        let off = Pt::new(last_q.x + x, last_q.y + y);
        let cos_half = ((1.0 + dot) / 2.0).sqrt();
        let len = (off.x * off.x + off.y * off.y).sqrt();
        if len > 0.0 {
            let k = (1.0 / cos_half) / len;
            let off = Pt::new(off.x * k, off.y * k);
            let tol = NEARLY_ZERO;
            if (last_q.x - off.x).abs() > tol || (last_q.y - off.y).abs() > tol {
                out.push(([last_q, off, Pt::new(x, y)], cos_half));
            }
        }
    }
    // Skia: `setSinCos(uStart)` then `preScale(1, dir)`: mirror y for CCW in
    // the unit frame first, then rotate (1, 0) onto `u_start`.
    let (sin, cos) = (u_start.y, u_start.x);
    let dir = if cw { 1.0 } else { -1.0 };
    let map = |p: Pt| {
        let py = p.y * dir;
        Pt::new(p.x * cos - py * sin, p.x * sin + py * cos)
    };
    Some(
        out.into_iter()
            .map(|(pts, w)| ([map(pts[0]), map(pts[1]), map(pts[2])], w))
            .collect(),
    )
}

/// Skia `SkConic::computeQuadPOW2` (Floater 1993 error bound).
fn conic_quad_pow2(p0: Pt, p1: Pt, p2: Pt, w: f32) -> u32 {
    let a = w - 1.0;
    let k = a / (4.0 * (2.0 + a));
    let x = k * (p0.x - 2.0 * p1.x + p2.x);
    let y = k * (p0.y - 2.0 * p1.y + p2.y);
    let mut error = (x * x + y * y).sqrt();
    let mut pow2 = 0;
    while pow2 < MAX_CONIC_TO_QUAD_POW2 {
        if error <= CONIC_TOLERANCE {
            break;
        }
        error *= 0.25;
        pow2 += 1;
    }
    pow2
}

fn between(a: f32, b: f32, c: f32) -> bool {
    (a - b) * (c - b) <= 0.0
}

/// Skia `SkConic::chop` + `subdivide` (with its y-monotonicity fix-up).
/// Appends `(control, end)` pairs.
fn subdivide_conic(p: [Pt; 3], w: f32, level: u32, out: &mut Vec<Pt>) {
    if level == 0 {
        out.push(p[1]);
        out.push(p[2]);
        return;
    }
    let scale = 1.0 / (1.0 + w);
    let new_w = (0.5 + w * 0.5).sqrt();
    let wp1 = Pt::new(w * p[1].x, w * p[1].y);
    let m = Pt::new(
        (p[0].x + 2.0 * wp1.x + p[2].x) * scale * 0.5,
        (p[0].y + 2.0 * wp1.y + p[2].y) * scale * 0.5,
    );
    let mut a = [
        p[0],
        Pt::new((p[0].x + wp1.x) * scale, (p[0].y + wp1.y) * scale),
        m,
    ];
    let mut b = [
        m,
        Pt::new((wp1.x + p[2].x) * scale, (wp1.y + p[2].y) * scale),
        p[2],
    ];
    let (start_y, end_y) = (p[0].y, p[2].y);
    if between(start_y, p[1].y, end_y) {
        let mid_y = a[2].y;
        if !between(start_y, mid_y, end_y) {
            let closer = if (mid_y - start_y).abs() < (mid_y - end_y).abs() {
                start_y
            } else {
                end_y
            };
            a[2].y = closer;
            b[0].y = closer;
        }
        if !between(start_y, a[1].y, a[2].y) {
            a[1].y = start_y;
        }
        if !between(b[0].y, b[1].y, end_y) {
            b[1].y = end_y;
        }
    }
    subdivide_conic(a, new_w, level - 1, out);
    subdivide_conic(b, new_w, level - 1, out);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn full_circle_is_four_quadrants_open() {
        let mut p = CanvasPath::default();
        assert!(p.arc(
            &Affine::IDENTITY,
            10.0,
            10.0,
            2.0,
            0.0,
            std::f64::consts::TAU,
            false
        ));
        // r = 2: error < 0.25 → one quad per quadrant; no Close (open subpath).
        assert_eq!(p.segs().len(), 5);
        assert_eq!(p.segs()[0], Seg::Move(Pt::new(12.0, 10.0)));
        assert!(!p.segs().contains(&Seg::Close));
        // Clockwise in y-down: right → bottom → left → top → right.
        let ends: Vec<Pt> = p
            .segs()
            .iter()
            .filter_map(|s| match s {
                Seg::Quad(_, e) => Some(*e),
                _ => None,
            })
            .collect();
        assert_eq!(ends[0], Pt::new(10.0, 12.0));
        assert_eq!(ends[1], Pt::new(8.0, 10.0));
        assert_eq!(ends[2], Pt::new(10.0, 8.0));
        assert_eq!(ends[3], Pt::new(12.0, 10.0));
    }

    #[test]
    fn big_circle_subdivides() {
        let mut p = CanvasPath::default();
        p.arc(
            &Affine::IDENTITY,
            64.0,
            64.0,
            50.0,
            0.0,
            std::f64::consts::TAU,
            false,
        );
        // error(50) = 0.0607 * 50 = 3.03 → pow2 = 2 → 4 quads per quadrant.
        assert_eq!(p.segs().len(), 1 + 16);
    }

    #[test]
    fn half_arc_ccw_goes_through_top() {
        let mut p = CanvasPath::default();
        p.arc(
            &Affine::IDENTITY,
            0.0,
            0.0,
            1.0,
            0.0,
            std::f64::consts::PI,
            true,
        );
        let ends: Vec<Pt> = p
            .segs()
            .iter()
            .filter_map(|s| match s {
                Seg::Quad(_, e) => Some(*e),
                _ => None,
            })
            .collect();
        assert_eq!(ends.len(), 2);
        assert_eq!(ends[0], Pt::new(0.0, -1.0));
        assert_eq!(ends[1], Pt::new(-1.0, 0.0));
    }

    #[test]
    fn arc_to_rounded_corner() {
        let mut p = CanvasPath::default();
        let id = Affine::IDENTITY;
        p.move_to(&id, 0.0, 0.0);
        p.arc_to(&id, 10.0, 0.0, 10.0, 10.0, 4.0);
        assert_eq!(p.segs()[1], Seg::Line(Pt::new(6.0, 0.0)));
        // End of the corner = tangent point on the second line.
        assert_eq!(p.current, Some(Pt::new(10.0, 4.0)));
    }
}
