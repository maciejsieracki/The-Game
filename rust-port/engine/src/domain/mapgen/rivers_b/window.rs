//! P6.M07B-Q2 partia 1: sanityzacja sciezki rzeki pod okno skretu.
//! Web (pin `edb8fb56`, gen-helpers.ts:7094-7121): `sanitizeRiverTurnWindow`.
//! Wektory: `tests/p6_m07b2_vectors/web-rivers-b-edges.json` (`fn = sanitize_window`).

use crate::domain::mapgen::rivers_a::grow::{
    path_segment_dirs, path_signed_turn_deltas, RIVER_TURN_WINDOW_HEX, RIVER_TURN_WINDOW_MAX_SUM,
};
use crate::domain::mapgen::rivers_a::{
    repair_river_path_adjacency, sanitize_river_path, RiverCoord,
};
use crate::domain::mapgen::rivers_b::turn::river_path_violates_turn_window;
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `sanitizeRiverTurnWindow(path, hexes, sourceKey)` (:7094). Do 48 obrotow: wycina heks
/// na pierwszym naruszeniu (|delta| > 1 albo |suma okna| > max), naprawia sasiedztwo.
/// Przerywa, gdy ciecie nie jest mozliwe (`cutAt <= 0` lub ostatni/pierwszy heks).
pub fn sanitize_river_turn_window(
    path: &[RiverCoord],
    hexes: &HexRecord,
    source_key: &str,
) -> Vec<RiverCoord> {
    let mut out = sanitize_river_path(path);
    let mut guard = 0usize;
    while guard < 48 && out.len() >= 3 {
        guard += 1;
        if !river_path_violates_turn_window(&out, RIVER_TURN_WINDOW_HEX, RIVER_TURN_WINDOW_MAX_SUM)
        {
            return out;
        }
        let deltas = path_signed_turn_deltas(&path_segment_dirs(&out));
        let mut cut_at: i64 = -1;
        for i in 0..deltas.len() {
            if deltas[i].abs() > 1 {
                cut_at = i as i64 + 1;
                break;
            }
            if i + 1 >= RIVER_TURN_WINDOW_HEX {
                let w = &deltas[i + 1 - RIVER_TURN_WINDOW_HEX..=i];
                let sum: i64 = w.iter().sum();
                if sum.abs() > RIVER_TURN_WINDOW_MAX_SUM {
                    cut_at = i as i64 + 1;
                    break;
                }
            }
        }
        if cut_at <= 0 || cut_at >= out.len() as i64 - 1 {
            break;
        }
        let cut = cut_at as usize;
        let mut next: Vec<RiverCoord> = out[..cut].to_vec();
        next.extend_from_slice(&out[cut + 1..]);
        out = sanitize_river_path(&next);
        out = repair_river_path_adjacency(&out, hexes, source_key);
    }
    out
}
