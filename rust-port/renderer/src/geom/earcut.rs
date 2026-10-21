//! Port of `three/src/extras/Earcut.js` (Three.js r169, itself a port of
//! mapbox/earcut v2.2.4). Same algorithm and the same traversal order, so the
//! output triangle list is identical to `Earcut.triangulate`.
//!
//! The doubly linked lists of the JavaScript version are stored in an arena
//! (`Vec<Node>` + indices). Removed nodes stay in the arena, which keeps the
//! JavaScript semantics where a removed node still points at its old
//! neighbours.

const NIL: usize = usize::MAX;

#[derive(Debug, Clone)]
struct Node {
    /// Vertex index in the coordinate array (times `dim`).
    i: usize,
    x: f64,
    y: f64,
    prev: usize,
    next: usize,
    z: i32,
    prev_z: usize,
    next_z: usize,
    steiner: bool,
}

struct Ctx {
    n: Vec<Node>,
}

impl Ctx {
    fn new_node(&mut self, i: usize, x: f64, y: f64) -> usize {
        self.n.push(Node {
            i,
            x,
            y,
            prev: NIL,
            next: NIL,
            z: 0,
            prev_z: NIL,
            next_z: NIL,
            steiner: false,
        });
        self.n.len() - 1
    }

    fn insert_node(&mut self, i: usize, x: f64, y: f64, last: usize) -> usize {
        let p = self.new_node(i, x, y);
        if last == NIL {
            self.n[p].prev = p;
            self.n[p].next = p;
        } else {
            let ln = self.n[last].next;
            self.n[p].next = ln;
            self.n[p].prev = last;
            self.n[ln].prev = p;
            self.n[last].next = p;
        }
        p
    }

    fn remove_node(&mut self, p: usize) {
        let (pn, pp) = (self.n[p].next, self.n[p].prev);
        self.n[pn].prev = pp;
        self.n[pp].next = pn;
        let (pz, nz) = (self.n[p].prev_z, self.n[p].next_z);
        if pz != NIL {
            self.n[pz].next_z = nz;
        }
        if nz != NIL {
            self.n[nz].prev_z = pz;
        }
    }

    fn area(&self, p: usize, q: usize, r: usize) -> f64 {
        let (p, q, r) = (&self.n[p], &self.n[q], &self.n[r]);
        (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)
    }

    #[allow(clippy::float_cmp)]
    fn equals(&self, a: usize, b: usize) -> bool {
        self.n[a].x == self.n[b].x && self.n[a].y == self.n[b].y
    }

    fn linked_list(
        &mut self,
        data: &[f64],
        start: usize,
        end: usize,
        dim: usize,
        clockwise: bool,
    ) -> usize {
        let mut last = NIL;
        if clockwise == (signed_area(data, start, end, dim) > 0.0) {
            let mut i = start;
            while i < end {
                last = self.insert_node(i, data[i], data[i + 1], last);
                i += dim;
            }
        } else if end >= dim {
            let mut i = end - dim;
            loop {
                if i < start {
                    break;
                }
                last = self.insert_node(i, data[i], data[i + 1], last);
                if i < dim {
                    break;
                }
                i -= dim;
            }
        }
        if last != NIL && self.equals(last, self.n[last].next) {
            self.remove_node(last);
            last = self.n[last].next;
        }
        last
    }

    fn filter_points(&mut self, start: usize, end: usize) -> usize {
        if start == NIL {
            return start;
        }
        let mut end = if end == NIL { start } else { end };
        let mut p = start;
        loop {
            let mut again = false;
            let nx = self.n[p].next;
            let pv = self.n[p].prev;
            #[allow(clippy::float_cmp)]
            if !self.n[p].steiner && (self.equals(p, nx) || self.area(pv, p, nx) == 0.0) {
                self.remove_node(p);
                p = self.n[p].prev;
                end = p;
                if p == self.n[p].next {
                    break;
                }
                again = true;
            } else {
                p = self.n[p].next;
            }
            if !(again || p != end) {
                break;
            }
        }
        end
    }

    #[allow(clippy::too_many_arguments)]
    fn earcut_linked(
        &mut self,
        ear: usize,
        tris: &mut Vec<u32>,
        dim: usize,
        min_x: f64,
        min_y: f64,
        inv_size: f64,
        pass: u8,
    ) {
        if ear == NIL {
            return;
        }
        let hashed = inv_size != 0.0 && !inv_size.is_nan();
        if pass == 0 && hashed {
            self.index_curve(ear, min_x, min_y, inv_size);
        }
        let mut ear = ear;
        let mut stop = ear;
        while self.n[ear].prev != self.n[ear].next {
            let prev = self.n[ear].prev;
            let next = self.n[ear].next;
            let is_ear = if hashed {
                self.is_ear_hashed(ear, min_x, min_y, inv_size)
            } else {
                self.is_ear(ear)
            };
            if is_ear {
                tris.push(idx(self.n[prev].i, dim));
                tris.push(idx(self.n[ear].i, dim));
                tris.push(idx(self.n[next].i, dim));
                self.remove_node(ear);
                ear = self.n[next].next;
                stop = self.n[next].next;
                continue;
            }
            ear = next;
            if ear == stop {
                if pass == 0 {
                    let f = self.filter_points(ear, NIL);
                    self.earcut_linked(f, tris, dim, min_x, min_y, inv_size, 1);
                } else if pass == 1 {
                    let f = self.filter_points(ear, NIL);
                    let e = self.cure_local_intersections(f, tris, dim);
                    self.earcut_linked(e, tris, dim, min_x, min_y, inv_size, 2);
                } else if pass == 2 {
                    self.split_earcut(ear, tris, dim, min_x, min_y, inv_size);
                }
                break;
            }
        }
    }

    fn bbox(&self, a: usize, b: usize, c: usize) -> (f64, f64, f64, f64) {
        let (ax, bx, cx) = (self.n[a].x, self.n[b].x, self.n[c].x);
        let (ay, by, cy) = (self.n[a].y, self.n[b].y, self.n[c].y);
        let x0 = if ax < bx {
            if ax < cx {
                ax
            } else {
                cx
            }
        } else if bx < cx {
            bx
        } else {
            cx
        };
        let y0 = if ay < by {
            if ay < cy {
                ay
            } else {
                cy
            }
        } else if by < cy {
            by
        } else {
            cy
        };
        let x1 = if ax > bx {
            if ax > cx {
                ax
            } else {
                cx
            }
        } else if bx > cx {
            bx
        } else {
            cx
        };
        let y1 = if ay > by {
            if ay > cy {
                ay
            } else {
                cy
            }
        } else if by > cy {
            by
        } else {
            cy
        };
        (x0, y0, x1, y1)
    }

    fn tri_contains(&self, a: usize, b: usize, c: usize, p: usize) -> bool {
        let (an, bn, cn, pn) = (&self.n[a], &self.n[b], &self.n[c], &self.n[p]);
        point_in_triangle(an.x, an.y, bn.x, bn.y, cn.x, cn.y, pn.x, pn.y)
    }

    fn is_ear(&self, ear: usize) -> bool {
        let a = self.n[ear].prev;
        let b = ear;
        let c = self.n[ear].next;
        if self.area(a, b, c) >= 0.0 {
            return false;
        }
        let (x0, y0, x1, y1) = self.bbox(a, b, c);
        let mut p = self.n[c].next;
        while p != a {
            let pn = &self.n[p];
            if pn.x >= x0
                && pn.x <= x1
                && pn.y >= y0
                && pn.y <= y1
                && self.tri_contains(a, b, c, p)
                && self.area(pn.prev, p, pn.next) >= 0.0
            {
                return false;
            }
            p = self.n[p].next;
        }
        true
    }

    fn hashed_hit(&self, p: usize, a: usize, b: usize, c: usize, bb: (f64, f64, f64, f64)) -> bool {
        let (x0, y0, x1, y1) = bb;
        let pn = &self.n[p];
        pn.x >= x0
            && pn.x <= x1
            && pn.y >= y0
            && pn.y <= y1
            && p != a
            && p != c
            && self.tri_contains(a, b, c, p)
            && self.area(pn.prev, p, pn.next) >= 0.0
    }

    fn is_ear_hashed(&self, ear: usize, min_x: f64, min_y: f64, inv_size: f64) -> bool {
        let a = self.n[ear].prev;
        let b = ear;
        let c = self.n[ear].next;
        if self.area(a, b, c) >= 0.0 {
            return false;
        }
        let bb = self.bbox(a, b, c);
        let min_z = z_order(bb.0, bb.1, min_x, min_y, inv_size);
        let max_z = z_order(bb.2, bb.3, min_x, min_y, inv_size);
        let mut p = self.n[ear].prev_z;
        let mut n = self.n[ear].next_z;
        while p != NIL && self.n[p].z >= min_z && n != NIL && self.n[n].z <= max_z {
            if self.hashed_hit(p, a, b, c, bb) {
                return false;
            }
            p = self.n[p].prev_z;
            if self.hashed_hit(n, a, b, c, bb) {
                return false;
            }
            n = self.n[n].next_z;
        }
        while p != NIL && self.n[p].z >= min_z {
            if self.hashed_hit(p, a, b, c, bb) {
                return false;
            }
            p = self.n[p].prev_z;
        }
        while n != NIL && self.n[n].z <= max_z {
            if self.hashed_hit(n, a, b, c, bb) {
                return false;
            }
            n = self.n[n].next_z;
        }
        true
    }

    fn cure_local_intersections(&mut self, start: usize, tris: &mut Vec<u32>, dim: usize) -> usize {
        let mut start = start;
        let mut p = start;
        loop {
            let a = self.n[p].prev;
            let pn = self.n[p].next;
            let b = self.n[pn].next;
            if !self.equals(a, b)
                && self.intersects(a, p, pn, b)
                && self.locally_inside(a, b)
                && self.locally_inside(b, a)
            {
                tris.push(idx(self.n[a].i, dim));
                tris.push(idx(self.n[p].i, dim));
                tris.push(idx(self.n[b].i, dim));
                self.remove_node(p);
                let pn2 = self.n[p].next;
                self.remove_node(pn2);
                p = b;
                start = b;
            }
            p = self.n[p].next;
            if p == start {
                break;
            }
        }
        self.filter_points(p, NIL)
    }

    fn split_earcut(
        &mut self,
        start: usize,
        tris: &mut Vec<u32>,
        dim: usize,
        min_x: f64,
        min_y: f64,
        inv_size: f64,
    ) {
        let mut a = start;
        loop {
            let mut b = self.n[self.n[a].next].next;
            while b != self.n[a].prev {
                if self.n[a].i != self.n[b].i && self.is_valid_diagonal(a, b) {
                    let mut c = self.split_polygon(a, b);
                    let an = self.n[a].next;
                    let a2 = self.filter_points(a, an);
                    let cn = self.n[c].next;
                    c = self.filter_points(c, cn);
                    self.earcut_linked(a2, tris, dim, min_x, min_y, inv_size, 0);
                    self.earcut_linked(c, tris, dim, min_x, min_y, inv_size, 0);
                    return;
                }
                b = self.n[b].next;
            }
            a = self.n[a].next;
            if a == start {
                break;
            }
        }
    }

    fn eliminate_holes(
        &mut self,
        data: &[f64],
        hole_indices: &[usize],
        outer: usize,
        dim: usize,
    ) -> usize {
        let mut queue = Vec::new();
        let len = hole_indices.len();
        for i in 0..len {
            let start = hole_indices[i] * dim;
            let end = if i < len - 1 {
                hole_indices[i + 1] * dim
            } else {
                data.len()
            };
            let list = self.linked_list(data, start, end, dim, false);
            if list == NIL {
                // JavaScript would throw on `list.next`; an empty hole is
                // simply skipped here.
                continue;
            }
            if list == self.n[list].next {
                self.n[list].steiner = true;
            }
            queue.push(self.get_leftmost(list));
        }
        // Array.prototype.sort is stable; compareX = a.x - b.x.
        queue.sort_by(|&a, &b| {
            let d = self.n[a].x - self.n[b].x;
            d.partial_cmp(&0.0).unwrap_or(std::cmp::Ordering::Equal)
        });
        let mut outer = outer;
        for h in queue {
            outer = self.eliminate_hole(h, outer);
        }
        outer
    }

    fn eliminate_hole(&mut self, hole: usize, outer: usize) -> usize {
        let bridge = self.find_hole_bridge(hole, outer);
        if bridge == NIL {
            return outer;
        }
        let bridge_reverse = self.split_polygon(bridge, hole);
        let brn = self.n[bridge_reverse].next;
        self.filter_points(bridge_reverse, brn);
        let bn = self.n[bridge].next;
        self.filter_points(bridge, bn)
    }

    #[allow(clippy::float_cmp)]
    fn find_hole_bridge(&self, hole: usize, outer: usize) -> usize {
        let mut p = outer;
        let mut qx = f64::NEG_INFINITY;
        let mut m = NIL;
        let hx = self.n[hole].x;
        let hy = self.n[hole].y;
        loop {
            let pn = self.n[p].next;
            let (px, py) = (self.n[p].x, self.n[p].y);
            let (nx, ny) = (self.n[pn].x, self.n[pn].y);
            if hy <= py && hy >= ny && ny != py {
                let x = px + (hy - py) * (nx - px) / (ny - py);
                if x <= hx && x > qx {
                    qx = x;
                    m = if px < nx { p } else { pn };
                    if x == hx {
                        return m;
                    }
                }
            }
            p = pn;
            if p == outer {
                break;
            }
        }
        if m == NIL {
            return NIL;
        }
        let stop = m;
        let mx = self.n[m].x;
        let my = self.n[m].y;
        let mut tan_min = f64::INFINITY;
        p = m;
        loop {
            let (px, py) = (self.n[p].x, self.n[p].y);
            if hx >= px
                && px >= mx
                && hx != px
                && point_in_triangle(
                    if hy < my { hx } else { qx },
                    hy,
                    mx,
                    my,
                    if hy < my { qx } else { hx },
                    hy,
                    px,
                    py,
                )
            {
                let tan = (hy - py).abs() / (hx - px);
                if self.locally_inside(p, hole)
                    && (tan < tan_min
                        || (tan == tan_min
                            && (px > self.n[m].x
                                || (px == self.n[m].x && self.sector_contains_sector(m, p)))))
                {
                    m = p;
                    tan_min = tan;
                }
            }
            p = self.n[p].next;
            if p == stop {
                break;
            }
        }
        m
    }

    fn sector_contains_sector(&self, m: usize, p: usize) -> bool {
        self.area(self.n[m].prev, m, self.n[p].prev) < 0.0
            && self.area(self.n[p].next, m, self.n[m].next) < 0.0
    }

    fn index_curve(&mut self, start: usize, min_x: f64, min_y: f64, inv_size: f64) {
        let mut p = start;
        loop {
            if self.n[p].z == 0 {
                self.n[p].z = z_order(self.n[p].x, self.n[p].y, min_x, min_y, inv_size);
            }
            self.n[p].prev_z = self.n[p].prev;
            self.n[p].next_z = self.n[p].next;
            p = self.n[p].next;
            if p == start {
                break;
            }
        }
        let pz = self.n[p].prev_z;
        self.n[pz].next_z = NIL;
        self.n[p].prev_z = NIL;
        self.sort_linked(p);
    }

    fn sort_linked(&mut self, list: usize) {
        let mut list = list;
        let mut in_size = 1;
        loop {
            let mut p = list;
            list = NIL;
            let mut tail = NIL;
            let mut num_merges = 0;
            while p != NIL {
                num_merges += 1;
                let mut q = p;
                let mut p_size = 0;
                for _ in 0..in_size {
                    p_size += 1;
                    q = self.n[q].next_z;
                    if q == NIL {
                        break;
                    }
                }
                let mut q_size = in_size;
                while p_size > 0 || (q_size > 0 && q != NIL) {
                    let e;
                    if p_size != 0 && (q_size == 0 || q == NIL || self.n[p].z <= self.n[q].z) {
                        e = p;
                        p = self.n[p].next_z;
                        p_size -= 1;
                    } else {
                        e = q;
                        q = self.n[q].next_z;
                        q_size -= 1;
                    }
                    if tail != NIL {
                        self.n[tail].next_z = e;
                    } else {
                        list = e;
                    }
                    self.n[e].prev_z = tail;
                    tail = e;
                }
                p = q;
            }
            self.n[tail].next_z = NIL;
            in_size *= 2;
            if num_merges <= 1 {
                break;
            }
        }
    }

    fn get_leftmost(&self, start: usize) -> usize {
        let mut p = start;
        let mut leftmost = start;
        loop {
            let (pn, ln) = (&self.n[p], &self.n[leftmost]);
            #[allow(clippy::float_cmp)]
            if pn.x < ln.x || (pn.x == ln.x && pn.y < ln.y) {
                leftmost = p;
            }
            p = self.n[p].next;
            if p == start {
                break;
            }
        }
        leftmost
    }

    fn is_valid_diagonal(&self, a: usize, b: usize) -> bool {
        let an = &self.n[a];
        let bn = &self.n[b];
        let opp = {
            let x = self.area(an.prev, a, bn.prev);
            let y = self.area(a, bn.prev, b);
            js_truthy(x) || js_truthy(y)
        };
        self.n[an.next].i != bn.i
            && self.n[an.prev].i != bn.i
            && !self.intersects_polygon(a, b)
            && ((self.locally_inside(a, b)
                && self.locally_inside(b, a)
                && self.middle_inside(a, b)
                && opp)
                || (self.equals(a, b)
                    && self.area(an.prev, a, an.next) > 0.0
                    && self.area(bn.prev, b, bn.next) > 0.0))
    }

    fn intersects(&self, p1: usize, q1: usize, p2: usize, q2: usize) -> bool {
        let o1 = sign(self.area(p1, q1, p2));
        let o2 = sign(self.area(p1, q1, q2));
        let o3 = sign(self.area(p2, q2, p1));
        let o4 = sign(self.area(p2, q2, q1));
        if o1 != o2 && o3 != o4 {
            return true;
        }
        if o1 == 0 && self.on_segment(p1, p2, q1) {
            return true;
        }
        if o2 == 0 && self.on_segment(p1, q2, q1) {
            return true;
        }
        if o3 == 0 && self.on_segment(p2, p1, q2) {
            return true;
        }
        if o4 == 0 && self.on_segment(p2, q1, q2) {
            return true;
        }
        false
    }

    fn on_segment(&self, p: usize, q: usize, r: usize) -> bool {
        let (p, q, r) = (&self.n[p], &self.n[q], &self.n[r]);
        q.x <= js_max(p.x, r.x)
            && q.x >= js_min(p.x, r.x)
            && q.y <= js_max(p.y, r.y)
            && q.y >= js_min(p.y, r.y)
    }

    fn intersects_polygon(&self, a: usize, b: usize) -> bool {
        let ai = self.n[a].i;
        let bi = self.n[b].i;
        let mut p = a;
        loop {
            let pn = self.n[p].next;
            if self.n[p].i != ai
                && self.n[pn].i != ai
                && self.n[p].i != bi
                && self.n[pn].i != bi
                && self.intersects(p, pn, a, b)
            {
                return true;
            }
            p = pn;
            if p == a {
                break;
            }
        }
        false
    }

    fn locally_inside(&self, a: usize, b: usize) -> bool {
        let an = &self.n[a];
        if self.area(an.prev, a, an.next) < 0.0 {
            self.area(a, b, an.next) >= 0.0 && self.area(a, an.prev, b) >= 0.0
        } else {
            self.area(a, b, an.prev) < 0.0 || self.area(a, an.next, b) < 0.0
        }
    }

    #[allow(clippy::float_cmp)]
    fn middle_inside(&self, a: usize, b: usize) -> bool {
        let mut p = a;
        let mut inside = false;
        let px = (self.n[a].x + self.n[b].x) / 2.0;
        let py = (self.n[a].y + self.n[b].y) / 2.0;
        loop {
            let pn = self.n[p].next;
            let (x, y) = (self.n[p].x, self.n[p].y);
            let (nx, ny) = (self.n[pn].x, self.n[pn].y);
            if ((y > py) != (ny > py)) && ny != y && (px < (nx - x) * (py - y) / (ny - y) + x) {
                inside = !inside;
            }
            p = pn;
            if p == a {
                break;
            }
        }
        inside
    }

    fn split_polygon(&mut self, a: usize, b: usize) -> usize {
        let a2 = self.new_node(self.n[a].i, self.n[a].x, self.n[a].y);
        let b2 = self.new_node(self.n[b].i, self.n[b].x, self.n[b].y);
        let an = self.n[a].next;
        let bp = self.n[b].prev;
        self.n[a].next = b;
        self.n[b].prev = a;
        self.n[a2].next = an;
        self.n[an].prev = a2;
        self.n[b2].next = a2;
        self.n[a2].prev = b2;
        self.n[bp].next = b2;
        self.n[b2].prev = bp;
        b2
    }
}

/// `x / dim | 0` for non-negative indices.
#[allow(clippy::cast_possible_truncation)]
fn idx(i: usize, dim: usize) -> u32 {
    (i / dim) as u32
}

/// JavaScript truthiness of a number (`0`, `-0`, `NaN` are falsy).
fn js_truthy(x: f64) -> bool {
    x != 0.0 && !x.is_nan()
}

fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}

fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.min(b)
    }
}

fn sign(x: f64) -> i8 {
    if x > 0.0 {
        1
    } else if x < 0.0 {
        -1
    } else {
        0
    }
}

#[allow(clippy::too_many_arguments)]
fn point_in_triangle(
    ax: f64,
    ay: f64,
    bx: f64,
    by: f64,
    cx: f64,
    cy: f64,
    px: f64,
    py: f64,
) -> bool {
    (cx - px) * (ay - py) >= (ax - px) * (cy - py)
        && (ax - px) * (by - py) >= (bx - px) * (ay - py)
        && (bx - px) * (cy - py) >= (cx - px) * (by - py)
}

fn signed_area(data: &[f64], start: usize, end: usize, dim: usize) -> f64 {
    let mut sum = 0.0;
    if end < dim + start {
        return sum;
    }
    let mut j = end - dim;
    let mut i = start;
    while i < end {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
        i += dim;
    }
    sum
}

/// JavaScript `ToInt32` of a finite or non-finite double (`x | 0`).
#[allow(clippy::cast_possible_truncation)]
fn to_int32(x: f64) -> i32 {
    if !x.is_finite() {
        return 0;
    }
    let t = x.trunc();
    let m = t.rem_euclid(4_294_967_296.0);
    let u = m as u64 as u32;
    u as i32
}

fn z_order(x: f64, y: f64, min_x: f64, min_y: f64, inv_size: f64) -> i32 {
    let mut x = to_int32((x - min_x) * inv_size);
    let mut y = to_int32((y - min_y) * inv_size);
    x = (x | (x << 8)) & 0x00FF_00FF;
    x = (x | (x << 4)) & 0x0F0F_0F0F;
    x = (x | (x << 2)) & 0x3333_3333;
    x = (x | (x << 1)) & 0x5555_5555;
    y = (y | (y << 8)) & 0x00FF_00FF;
    y = (y | (y << 4)) & 0x0F0F_0F0F;
    y = (y | (y << 2)) & 0x3333_3333;
    y = (y | (y << 1)) & 0x5555_5555;
    x | (y << 1)
}

/// `Earcut.triangulate(data, holeIndices, 2)`: triangulates a polygon given as
/// flat `[x0, y0, x1, y1, ...]` with holes starting at the given vertex
/// indices. Returns vertex indices, three per triangle.
#[must_use]
pub fn triangulate(data: &[f64], hole_indices: &[usize]) -> Vec<u32> {
    let dim = 2;
    let has_holes = !hole_indices.is_empty();
    let outer_len = if has_holes {
        hole_indices[0] * dim
    } else {
        data.len()
    };
    let mut ctx = Ctx { n: Vec::new() };
    let mut outer = ctx.linked_list(data, 0, outer_len, dim, true);
    let mut tris = Vec::new();
    if outer == NIL || ctx.n[outer].next == ctx.n[outer].prev {
        return tris;
    }
    if has_holes {
        outer = ctx.eliminate_holes(data, hole_indices, outer, dim);
    }
    let (mut min_x, mut min_y, mut inv_size) = (0.0, 0.0, 0.0);
    if data.len() > 80 * dim {
        min_x = data[0];
        let mut max_x = data[0];
        min_y = data[1];
        let mut max_y = data[1];
        let mut i = dim;
        while i < outer_len {
            let x = data[i];
            let y = data[i + 1];
            if x < min_x {
                min_x = x;
            }
            if y < min_y {
                min_y = y;
            }
            if x > max_x {
                max_x = x;
            }
            if y > max_y {
                max_y = y;
            }
            i += dim;
        }
        inv_size = js_max(max_x - min_x, max_y - min_y);
        inv_size = if inv_size != 0.0 {
            32767.0 / inv_size
        } else {
            0.0
        };
    }
    ctx.earcut_linked(outer, &mut tris, dim, min_x, min_y, inv_size, 0);
    tris
}
