//! P6.M07B-Q2 partia 1: oznaczanie krawedzi rzek i geometria obwodu heksa.
//! Web (pin `edb8fb56`, gen-helpers.ts): :7122-7145 (`canReceiveRiverYieldMark`, `markRiverEdge`,
//! `markRiverEdgePair`), :7146-7165 (`riverHexCornerStep`, `walkRiverHexPerimeter`),
//! :7166-7201 (`riverCornersAlongHexEdges`, `riverEdgeBetweenCorners`, `riverTransitEdgeIndices`),
//! :7214-7249 (`simplifyRiverRenderPath`, `markRiverTransitEdgesOnPath`).
//! Wektory: `tests/p6_m07b2_vectors/web-rivers-b-edges.json` (generator `gen_edges_vectors.mjs`).

use crate::domain::map_generator::Terrain;
use crate::domain::mapgen::landsea::is_dry_land_terrain;
use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::grow::neighbor_dir_index;
use crate::domain::mapgen::rivers_a::RiverCoord;
use crate::domain::mapgen::terrain_class::{HexRecord, TerrainHex};

/// Web `canReceiveRiverYieldMark(hex)` (:7122): brak heksa lub morze -> false;
/// suchy lad albo PlytkieMorze -> true.
pub fn can_receive_river_yield_mark(hex: Option<&TerrainHex>) -> bool {
    let Some(h) = hex else { return false };
    if h.terrain == Terrain::Sea {
        return false;
    }
    is_dry_land_terrain(h.terrain) || h.terrain == Terrain::ShallowSea
}

/// Web `markRiverEdge(hexes, q, r, edgeIdx)` (:7127). `edgeIdx < 0` -> brak zmiany.
/// `rzeka.obecna` po zapisie zawsze = `krawedzie.length > 0` (web).
pub fn mark_river_edge(hexes: &mut HexRecord, q: i64, r: i64, edge_idx: i64) {
    if edge_idx < 0 {
        return;
    }
    let key = hex_key(q, r);
    let Some(hex) = hexes.get_mut(&key) else {
        return;
    };
    if !can_receive_river_yield_mark(Some(&*hex)) {
        return;
    }
    // Kontrakt: edge_idx w 0..=5 (kierunki heksa); wartosci spoza u8 nie wystepuja w wywolaniach.
    let Ok(e) = u8::try_from(edge_idx) else {
        return;
    };
    if !hex.river_edges.contains(&e) {
        hex.river_edges.push(e);
    }
    hex.river_present = !hex.river_edges.is_empty();
}

/// Web `markRiverEdgePair(hexes, q, r, edgeIdx)` (:7137): oznacza krawedz na heksie i na sasiedzie
/// po drugiej stronie krawedzi (`(edgeIdx + 3) % 6`). Dla `edgeIdx` spoza `HEX_DIRECTIONS`
/// (web: `dir` undefined) zostaje tylko pierwsze oznaczenie.
pub fn mark_river_edge_pair(hexes: &mut HexRecord, q: i64, r: i64, edge_idx: i64) {
    if edge_idx < 0 {
        return;
    }
    mark_river_edge(hexes, q, r, edge_idx);
    let Some(&(dq, dr)) = usize::try_from(edge_idx)
        .ok()
        .and_then(|i| HEX_DIRECTIONS.get(i))
    else {
        return;
    };
    mark_river_edge(
        hexes,
        q + i64::from(dq),
        r + i64::from(dr),
        (edge_idx + 3) % 6,
    );
}

/// Web `riverHexCornerStep(from, cw)` (:7146): nastepny naroznik obwodu (zgodnie / przeciw).
pub fn river_hex_corner_step(from: i64, cw: bool) -> i64 {
    if cw {
        (from + 1) % 6
    } else {
        (from + 5) % 6
    }
}

/// Web `walkRiverHexPerimeter(fromCorner, toCorner, cw)` (:7150): rogi od `from` do `to`
/// (wlacznie), najwyzej 7 wpisow.
pub fn walk_river_hex_perimeter(from_corner: i64, to_corner: i64, cw: bool) -> Vec<i64> {
    if from_corner == to_corner {
        return vec![from_corner];
    }
    let mut out = Vec::new();
    let mut c = from_corner;
    for _ in 0..7 {
        out.push(c);
        if c == to_corner {
            break;
        }
        c = river_hex_corner_step(c, cw);
    }
    out
}

/// Web `riverCornersAlongHexEdges(dirIn, dirOut, hexParity)` (:7166): lukowe rogi obwodu miedzy
/// krawedzia wejscia a wyjscia (ten sam łuk co render). Parzystosc heksa rozstrzyga remis
/// (`hexParity % 2 === 0`); JS `%` = Rust `%` (znak dzielnej), wiec wartosci ujemne sa zgodne.
pub fn river_corners_along_hex_edges(dir_in: i64, dir_out: i64, hex_parity: i64) -> Vec<i64> {
    // Web `((dirIn % 6) + 6) % 6` = `rem_euclid(6)` dla kazdej wartosci calkowitej.
    let a = dir_in.rem_euclid(6);
    let b = dir_out.rem_euclid(6);
    if a == b {
        return Vec::new();
    }
    let entry_opts = [(a + 1) % 6, (a + 2) % 6];
    let exit_opts = [(b + 1) % 6, (b + 2) % 6];
    const MIN_BOKI: usize = 1;
    let mut best: Vec<i64> = Vec::new();
    let mut best_score = f64::INFINITY;
    let mut fallback: Vec<i64> = Vec::new();
    let mut fallback_score = f64::INFINITY;
    for &entry in &entry_opts {
        for &exit in &exit_opts {
            for cw in [true, false] {
                let walked = walk_river_hex_perimeter(entry, exit, cw);
                if walked.is_empty() {
                    continue;
                }
                let mut score = walked.len() as f64;
                if score == best_score && hex_parity % 2 == 0 {
                    score += if cw { 0.0 } else { 0.01 };
                } else if score == best_score {
                    score += if cw { 0.01 } else { 0.0 };
                }
                if score < fallback_score {
                    fallback_score = score;
                    fallback = walked.clone();
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

/// Web `riverEdgeBetweenCorners(c1, c2)` (:7195): indeks krawedzi pointy-top miedzy sasiednimi
/// rogami; -1 gdy nie sa sasiednie.
pub fn river_edge_between_corners(c1: i64, c2: i64) -> i64 {
    if c2 == (c1 + 1) % 6 {
        return (c1 + 5) % 6;
    }
    if c2 == (c1 + 5) % 6 {
        return (c2 + 5) % 6;
    }
    -1
}

/// Web `riverTransitEdgeIndices(dirIn, dirOut, hexParity)` (:7202): unikalne krawedzie (0..5)
/// wzdluz luku rzeki, w kolejnosci wystepowania.
pub fn river_transit_edge_indices(dir_in: i64, dir_out: i64, hex_parity: i64) -> Vec<i64> {
    let corners = river_corners_along_hex_edges(dir_in, dir_out, hex_parity);
    if corners.len() < 2 {
        return Vec::new();
    }
    let mut edges: Vec<i64> = Vec::new();
    for i in 0..corners.len() - 1 {
        let ei = river_edge_between_corners(corners[i], corners[i + 1]);
        if ei >= 0 && !edges.contains(&ei) {
            edges.push(ei);
        }
    }
    edges
}

/// Web `simplifyRiverRenderPath(path)` (:7214): usuwa powroty (`a == c`) i zbedne heksy, gdy
/// poprzednik i nastepnik sa sasiadami. Limit 4000 iteracji petli zewnetrznej (web `guard`).
pub fn simplify_river_render_path(path: &[RiverCoord]) -> Vec<RiverCoord> {
    let mut p: Vec<RiverCoord> = path.to_vec();
    if p.len() < 3 {
        return p;
    }
    let mut changed = true;
    let mut guard = 0usize;
    while changed && guard < 4000 {
        guard += 1;
        changed = false;
        let mut i = 1usize;
        while i + 1 < p.len() {
            let a = p[i - 1];
            let c = p[i + 1];
            if a == c {
                p.drain(i..i + 2);
                changed = true;
                break;
            }
            if neighbor_dir_index(a.q, a.r, c.q, c.r) >= 0 {
                p.remove(i);
                changed = true;
                break;
            }
            i += 1;
        }
    }
    p
}

/// Web `markRiverTransitEdgesOnPath(hexes, path)` (:7232): dla kazdego heksa uproszczonej sciezki
/// oznacza krawedzie tranzytowe (obwod) przez `markRiverEdgePair`.
pub fn mark_river_transit_edges_on_path(hexes: &mut HexRecord, path: &[RiverCoord]) {
    let rp = simplify_river_render_path(path);
    if rp.len() < 2 {
        return;
    }
    for i in 0..rp.len() {
        let cur = rp[i];
        let dir_in = if i > 0 {
            neighbor_dir_index(cur.q, cur.r, rp[i - 1].q, rp[i - 1].r)
        } else {
            -1
        };
        let dir_out = if i < rp.len() - 1 {
            neighbor_dir_index(cur.q, cur.r, rp[i + 1].q, rp[i + 1].r)
        } else {
            -1
        };
        if dir_in < 0 || dir_out < 0 {
            continue;
        }
        for ei in river_transit_edge_indices(dir_in, dir_out, cur.q + cur.r) {
            mark_river_edge_pair(hexes, cur.q, cur.r, ei);
        }
    }
}
