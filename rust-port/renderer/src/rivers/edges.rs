//! Hex-perimeter geometry of the river ribbons: corners, edge midpoints, the
//! walk along the hex walls and the render-only path regularisation.
//!
//! Pin `07d2fbd72`, `gra/src/render/scene.ts`: `hexCorners` (`:467-474`),
//! `HEX_NEIGHBORS` (`:477-479`), `neighborDirIndex` (`:956-964`),
//! `hexEdgeMidpointByDir` (`:967-974`), `sharedEdgeMidpoint` (`:988-994`),
//! `hexCornerStep` (`:997-999`), `walkHexPerimeter` (`:1002-1012`),
//! `riverCornersAlongHexEdges` (`:1028-1056`), `riverTransitCornersOnHex`
//! (`:1059-1068`), `RIVER_INSET_FRAC` (`:1072`), `simplifyRiverRenderPath`
//! (`:1085-1104`).
//!
//! These are the "edges per hex" of the ribbon: for every hex of the render
//! path the ribbon runs along that hex's walls (entry edge midpoint → wall
//! corners → exit edge midpoint). `Hex.rzeka.krawedzie` is **not** read by
//! the web renderer (`scene.ts:1263-1264`: "hex.rzeka.krawedzie zostaje dla
//! logiki gry; render idzie po pełnej ścieżce"), so it is not read here either.

use crate::jsmath::{js_cos, js_sin};
use crate::pick::hex::{axial_to_world, HexCoord};

/// `HEX_NEIGHBORS` (`scene.ts:477-479`): axial directions, pointy-top.
pub const HEX_NEIGHBORS: [(i32, i32); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// `RIVER_INSET_FRAC` (`scene.ts:1072`): wall corners are pulled this far
/// towards the centre of their own hex.
pub const RIVER_INSET_FRAC: f64 = 0.15;

/// `MIN_BOKI` of `riverCornersAlongHexEdges` (`scene.ts:1034`).
const MIN_BOKI: usize = 1;

/// A point of the XZ plane (`{ x, z }` of the web helpers).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Xz {
    /// World X.
    pub x: f64,
    /// World Z.
    pub z: f64,
}

/// `axialToWorld(q, r, R)` as an [`Xz`].
#[must_use]
pub fn hex_center(h: HexCoord, radius: f64) -> Xz {
    let (x, z) = axial_to_world(h, radius);
    Xz { x, z }
}

/// `hexCorners(cx, cz, R)` (`scene.ts:467-474`): six pointy-top corners,
/// corner 0 at `+Z` (`a = (Math.PI / 3) * k`, `x = cx + R sin a`,
/// `z = cz + R cos a`; V8 `sin`/`cos` through [`crate::jsmath`]).
#[must_use]
pub fn hex_corners(cx: f64, cz: f64, radius: f64) -> [Xz; 6] {
    let mut out = [Xz { x: 0.0, z: 0.0 }; 6];
    for (k, slot) in out.iter_mut().enumerate() {
        // k < 6: exact in f64.
        #[allow(clippy::cast_precision_loss)]
        let a = (std::f64::consts::PI / 3.0) * (k as f64);
        *slot = Xz {
            x: cx + radius * js_sin(a),
            z: cz + radius * js_cos(a),
        };
    }
    out
}

/// `neighborDirIndex(q, r, nq, nr)` (`scene.ts:956-964`): index into
/// [`HEX_NEIGHBORS`] of `(nq - q, nr - r)`, `None` (web `-1`) when the two
/// hexes are not neighbours.
#[must_use]
pub fn neighbor_dir_index(from: HexCoord, to: HexCoord) -> Option<usize> {
    let dq = i64::from(to.q) - i64::from(from.q);
    let dr = i64::from(to.r) - i64::from(from.r);
    HEX_NEIGHBORS
        .iter()
        .position(|&(nq, nr)| i64::from(nq) == dq && i64::from(nr) == dr)
}

/// `hexEdgeMidpointByDir(q, r, dir, R)` (`scene.ts:966-974`): midpoint of
/// the wall towards neighbour `dir` (corners `dir + 1` and `dir + 2`).
#[must_use]
pub fn hex_edge_midpoint_by_dir(h: HexCoord, dir: usize, radius: f64) -> Xz {
    let c = hex_center(h, radius);
    let cs = hex_corners(c.x, c.z, radius);
    let d = dir % 6;
    let p0 = cs[(d + 1) % 6];
    let p1 = cs[(d + 2) % 6];
    Xz {
        x: (p0.x + p1.x) * 0.5,
        z: (p0.z + p1.z) * 0.5,
    }
}

/// `sharedEdgeMidpoint(q1, r1, q2, r2, R)` (`scene.ts:988-994`).
#[must_use]
pub fn shared_edge_midpoint(a: HexCoord, b: HexCoord, radius: f64) -> Option<Xz> {
    neighbor_dir_index(a, b).map(|dir| hex_edge_midpoint_by_dir(a, dir, radius))
}

/// `hexCornerStep(from, cw)` (`scene.ts:997-999`).
#[must_use]
pub fn hex_corner_step(from: usize, cw: bool) -> usize {
    if cw {
        (from + 1) % 6
    } else {
        (from + 5) % 6
    }
}

/// `walkHexPerimeter(fromCorner, toCorner, cw)` (`scene.ts:1002-1012`):
/// corners from `from` to `to` along the perimeter (at most 7 steps).
#[must_use]
pub fn walk_hex_perimeter(from: usize, to: usize, cw: bool) -> Vec<usize> {
    if from == to {
        return vec![from];
    }
    let mut out = Vec::new();
    let mut c = from;
    for _ in 0..7 {
        out.push(c);
        if c == to {
            break;
        }
        c = hex_corner_step(c, cw);
    }
    out
}

/// `riverCornersAlongHexEdges(dirIn, dirOut, hexParity)` (`scene.ts:1028-1056`):
/// the shortest wall walk between the entry and exit edges with at least one
/// full wall (`MIN_BOKI`), ties broken by `hexParity` (`q + r`); the
/// shortest walk at all as a fallback.
#[must_use]
pub fn river_corners_along_hex_edges(dir_in: usize, dir_out: usize, hex_parity: i64) -> Vec<usize> {
    let a = dir_in % 6;
    let b = dir_out % 6;
    if a == b {
        return Vec::new();
    }
    let entry_opts = [(a + 1) % 6, (a + 2) % 6];
    let exit_opts = [(b + 1) % 6, (b + 2) % 6];
    let mut best: Vec<usize> = Vec::new();
    let mut best_score = f64::INFINITY;
    let mut fallback: Vec<usize> = Vec::new();
    let mut fallback_score = f64::INFINITY;
    for &entry in &entry_opts {
        for &exit in &exit_opts {
            for cw in [true, false] {
                let walked = walk_hex_perimeter(entry, exit, cw);
                if walked.is_empty() {
                    continue;
                }
                // walked.len() <= 7: exact in f64.
                #[allow(clippy::cast_precision_loss)]
                let mut score = walked.len() as f64;
                // JS `%` keeps the sign of the dividend, like Rust's `%`.
                #[allow(clippy::float_cmp)]
                let tie = score == best_score;
                if tie && hex_parity % 2 == 0 {
                    score += if cw { 0.0 } else { 0.01 };
                } else if tie {
                    score += if cw { 0.01 } else { 0.0 };
                }
                if score < fallback_score {
                    fallback_score = score;
                    fallback.clone_from(&walked);
                }
                if walked.len() - 1 < MIN_BOKI {
                    continue;
                }
                if score < best_score {
                    best_score = score;
                    best = walked;
                }
            }
        }
    }
    if best.is_empty() {
        fallback
    } else {
        best
    }
}

/// `riverTransitCornersOnHex(q, r, qPrev, rPrev, qNext, rNext, R)`
/// (`scene.ts:1059-1068`): world corners of `cur` on the route
/// `prev → cur → next`; empty when either step is not a neighbour step.
#[must_use]
pub fn river_transit_corners_on_hex(
    cur: HexCoord,
    prev: HexCoord,
    next: HexCoord,
    radius: f64,
) -> Vec<Xz> {
    let (Some(dir_in), Some(dir_out)) =
        (neighbor_dir_index(cur, prev), neighbor_dir_index(cur, next))
    else {
        return Vec::new();
    };
    let wc = hex_center(cur, radius);
    let cs = hex_corners(wc.x, wc.z, radius);
    river_corners_along_hex_edges(dir_in, dir_out, i64::from(cur.q) + i64::from(cur.r))
        .into_iter()
        .map(|ci| cs[ci])
        .collect()
}

/// `simplifyRiverRenderPath(path)` (`scene.ts:1085-1104`): removes 180°
/// turns (`H[i-1] == H[i+1]`: drop `H[i]` and `H[i+1]`) and ≥120° bends
/// (`H[i-1]` neighbours `H[i+1]`: drop `H[i]`) until a fixed point (at most
/// 4000 passes); first and last hex are never removed.
#[must_use]
pub fn simplify_river_render_path(path: &[HexCoord]) -> Vec<HexCoord> {
    let mut p = path.to_vec();
    if p.len() < 3 {
        return p;
    }
    let mut changed = true;
    let mut guard = 0;
    while changed && guard < 4000 {
        guard += 1;
        changed = false;
        let mut i = 1;
        while i + 1 < p.len() {
            let a = p[i - 1];
            let c = p[i + 1];
            if a == c {
                p.drain(i..i + 2);
                changed = true;
                break;
            }
            if neighbor_dir_index(a, c).is_some() {
                p.remove(i);
                changed = true;
                break;
            }
            i += 1;
        }
    }
    p
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn straight_run_walks_three_walls_and_bends_two() {
        // scene.ts:1019-1021: straight (opposite edges) → 3 corners, gentle bend → 2.
        assert_eq!(river_corners_along_hex_edges(3, 0, 0).len(), 3);
        assert_eq!(river_corners_along_hex_edges(3, 1, 0).len(), 2);
        assert!(river_corners_along_hex_edges(2, 2, 0).is_empty());
    }

    #[test]
    fn simplify_cuts_u_turns_and_sharp_bends() {
        let h = HexCoord::new;
        let p = [h(1, 1), h(2, 1), h(1, 1), h(1, 2), h(1, 3)];
        assert_eq!(
            simplify_river_render_path(&p),
            vec![h(1, 1), h(1, 2), h(1, 3)]
        );
        let p = [h(1, 1), h(2, 1), h(2, 0), h(3, 0)];
        assert_eq!(
            simplify_river_render_path(&p),
            vec![h(1, 1), h(2, 0), h(3, 0)]
        );
    }
}
