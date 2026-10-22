//! `map/territory-border.ts` (web `edb8fb56`, 238 LOC): the boundary of a set
//! of hexes as closed loops in world XZ — the input of the territory border
//! band of `rangeOverlay.ts` (`buildTerritoryBorderGroup`).
//!
//! Vertex identity uses the web's string key `toFixed(5)` with the
//! `"-0.00000"` → `"0.00000"` fix (`borderVertexKey`, `:63-65`), so two
//! corners computed from different hex centres meet exactly as in the web.

use std::collections::HashMap;
use std::f64::consts::PI;

use super::overlay::{js_to_fixed, HexKey, HexKeySet};
use crate::jsmath::{js_cos, js_hypot, js_sin};
use crate::pick::hex::HEX_R;

/// `HEX_DIRS` (`territory-border.ts:9-16`, also `rangeOverlay.ts:14-21`).
pub const HEX_DIRS: [HexKey; 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// `BorderLoopPoint`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LoopPoint {
    /// `x`.
    pub x: f64,
    /// `z`.
    pub z: f64,
}

/// `BorderEdge` (`:23-31`).
#[derive(Debug, Clone, PartialEq)]
pub struct BorderEdge {
    /// `id`.
    pub id: usize,
    /// `v0Key`.
    pub v0_key: String,
    /// `v1Key`.
    pub v1_key: String,
    /// Start point.
    pub v0: LoopPoint,
    /// End point.
    pub v1: LoopPoint,
}

/// `borderVertexKey(x, z)` (`:63-65`).
#[must_use]
pub fn border_vertex_key(x: f64, z: f64) -> String {
    let fix = |s: String| {
        if s == "-0.00000" {
            "0.00000".to_owned()
        } else {
            s
        }
    };
    format!("{},{}", fix(js_to_fixed(x, 5)), fix(js_to_fixed(z, 5)))
}

/// `hexCornerWorld(cx, cz, i)` (`:67-73`).
#[must_use]
pub fn hex_corner_world(cx: f64, cz: f64, corner: u32) -> LoopPoint {
    let a = (PI / 3.0) * f64::from(corner);
    LoopPoint {
        x: cx + HEX_R * js_sin(a),
        z: cz + HEX_R * js_cos(a),
    }
}

/// `collectTerritoryBoundaryEdges(hexKeys, hexCenter)` (`:76-111`): the
/// edges `(dir+1) → (dir+2)` of every hex side whose neighbour is not in the
/// set. `hex_center` returns `None` for a key without a hex.
#[must_use]
pub fn collect_territory_boundary_edges(
    keys: &HexKeySet,
    hex_center: &dyn Fn(i32, i32) -> Option<(f64, f64)>,
) -> Vec<BorderEdge> {
    let mut edges = Vec::new();
    for (q, r) in keys.iter() {
        let Some((cx, cz)) = hex_center(q, r) else {
            continue;
        };
        for (i, &(dq, dr)) in (0u32..).zip(HEX_DIRS.iter()) {
            if keys.has((q + dq, r + dr)) {
                continue;
            }
            let va = hex_corner_world(cx, cz, (i + 1) % 6);
            let vb = hex_corner_world(cx, cz, (i + 2) % 6);
            edges.push(BorderEdge {
                id: edges.len(),
                v0_key: border_vertex_key(va.x, va.z),
                v1_key: border_vertex_key(vb.x, vb.z),
                v0: va,
                v1: vb,
            });
        }
    }
    edges
}

#[derive(Debug, Clone)]
struct AdjEntry {
    edge_id: usize,
    to_key: String,
    to: LoopPoint,
}

fn build_adjacency(edges: &[BorderEdge]) -> HashMap<String, Vec<AdjEntry>> {
    let mut adj: HashMap<String, Vec<AdjEntry>> = HashMap::new();
    for e in edges {
        adj.entry(e.v0_key.clone()).or_default().push(AdjEntry {
            edge_id: e.id,
            to_key: e.v1_key.clone(),
            to: e.v1,
        });
        adj.entry(e.v1_key.clone()).or_default().push(AdjEntry {
            edge_id: e.id,
            to_key: e.v0_key.clone(),
            to: e.v0,
        });
    }
    adj
}

/// `pickNextEdge` (`:133-177`).
fn pick_next_edge<'a>(
    adj: &'a HashMap<String, Vec<AdjEntry>>,
    at_key: &str,
    from_key: &str,
    v: LoopPoint,
    prev: LoopPoint,
    used: &[bool],
) -> Option<&'a AdjEntry> {
    let options: Vec<&AdjEntry> = adj
        .get(at_key)
        .map(|l| {
            l.iter()
                .filter(|o| !used[o.edge_id] && o.to_key != from_key)
                .collect()
        })
        .unwrap_or_default();
    if options.is_empty() {
        return None;
    }
    if options.len() == 1 {
        return Some(options[0]);
    }
    let inx = v.x - prev.x;
    let inz = v.z - prev.z;
    let mut best: Option<&AdjEntry> = None;
    let mut best_cross = f64::NEG_INFINITY;
    for &o in &options {
        let outx = o.to.x - v.x;
        let outz = o.to.z - v.z;
        let cross = inx * outz - inz * outx;
        if cross > 1e-8 && (best.is_none() || cross < best_cross || best_cross <= 1e-8) {
            best = Some(o);
            best_cross = cross;
        }
    }
    if best.is_some() {
        return best;
    }
    for &o in &options {
        let outx = o.to.x - v.x;
        let outz = o.to.z - v.z;
        let cross = inx * outz - inz * outx;
        if best.is_none() || cross > best_cross {
            best = Some(o);
            best_cross = cross;
        }
    }
    best
}

/// `traceTerritoryBoundaryLoops(edges)` (`:180-224`).
#[must_use]
pub fn trace_territory_boundary_loops(edges: &[BorderEdge]) -> Vec<Vec<LoopPoint>> {
    if edges.is_empty() {
        return Vec::new();
    }
    let adj = build_adjacency(edges);
    let mut used = vec![false; edges.len()];
    let mut loops = Vec::new();
    for start in edges {
        if used[start.id] {
            continue;
        }
        let mut lp = vec![start.v0];
        let mut from_key: &str = &start.v0_key;
        let mut prev = start.v0;
        let mut at_key: &str = &start.v1_key;
        let mut at = start.v1;
        used[start.id] = true;
        let max_steps = edges.len() + 2;
        for _ in 0..max_steps {
            lp.push(at);
            if at_key == start.v0_key && lp.len() > 2 {
                break;
            }
            let Some(next) = pick_next_edge(&adj, at_key, from_key, at, prev, &used) else {
                break;
            };
            used[next.edge_id] = true;
            from_key = at_key;
            prev = at;
            at_key = &next.to_key;
            at = next.to;
        }
        if lp.len() >= 4 {
            let last = lp[lp.len() - 1];
            let first = lp[0];
            if js_hypot(last.x - first.x, last.z - first.z) < 1e-4 {
                lp.pop();
            }
            if lp.len() >= 3 {
                loops.push(lp);
            }
        }
    }
    loops
}

/// `computeTerritoryBorderLoops(hexKeys, hexCenter)` (`:227-233`).
#[must_use]
pub fn compute_territory_border_loops(
    keys: &HexKeySet,
    hex_center: &dyn Fn(i32, i32) -> Option<(f64, f64)>,
) -> Vec<Vec<LoopPoint>> {
    trace_territory_boundary_loops(&collect_territory_boundary_edges(keys, hex_center))
}
