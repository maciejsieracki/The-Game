//! P6.M07B-Q3 partia 3a: trasowanie rzeki od wybrzeza i zjazd zachlanny do morza.
//! Web (pin `4bbef081d`, gen-helpers.ts; linie z pinu `edb8fb56` w dossierze, +1 po zmianie
//! `estimateLandCentroidFromSeed` na indeks glowy kolejki - bez zmiany zachowania):
//! `traceRiverFromCoast` (:6233), `greedyRiverDrainToSea` (:6276).
//! Wektory: `tests/p6_m07b3_vectors/web-rivers-b-q3.json` (`gen_q3_vectors.mjs`).

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::landsea::ocean_connected_water_keys;
use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::grow::{
    is_river_window_turn_allowed, GrowCandidate, TraceRiverOpts,
};
use crate::domain::mapgen::rivers_a::walk::{
    can_river_drain_step, infer_map_dims_from_hexes, is_river_drainage_goal, path_ends_at_sea,
    river_step_dir, same_river_dir,
};
use crate::domain::mapgen::rivers_a::{
    build_open_ocean_distance_field, build_sea_distance_field, can_river_flow_through, RiverCoord,
    MAIN_RIVER_MIN_PATH_SEP, RIVER_HARD_MEANDER_LEN,
};
use crate::domain::mapgen::rivers_b::coast_grow::{grow_river_from_coast_inland, CoastGrowParams};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `traceRiverFromCoast(hexes, mq, mr, maxLen, traceOpts)` (:6233). Zwraca `path[0]` = zrodlo
/// w glebi ladu, `path[last]` = ujscie. `[]` gdy ujscie dalej niz 2 od morza (lub brak w polu),
/// wzrost krotszy niz 2 albo trasa nie konczy sie przy oceanie.
/// Domyslne pola (`seaDist`, wymiary, `oceanConnected`, `openOceanDist`) liczone jak w webie;
/// `rand` domyslnie `() => 0`. `max_len` = `growthCap` (limit kroku wzrostu).
pub fn trace_river_from_coast(
    hexes: &HexRecord,
    mq: i64,
    mr: i64,
    max_len: usize,
    mut opts: TraceRiverOpts<'_>,
) -> Vec<RiverCoord> {
    let sea_owned;
    let sea_dist: &HashMap<String, i64> = match opts.sea_dist {
        Some(s) => s,
        None => {
            sea_owned = build_sea_distance_field(hexes);
            &sea_owned
        }
    };
    let (width, height) = match (opts.map_width, opts.map_height) {
        (Some(w), Some(h)) => (w, h),
        _ => infer_map_dims_from_hexes(hexes),
    };
    let open_owned;
    let open_ocean_dist: &HashMap<String, i64> = match opts.open_ocean_dist {
        Some(o) => o,
        None => {
            open_owned =
                build_open_ocean_distance_field(hexes, width, height, opts.ocean_connected);
            &open_owned
        }
    };
    let ocean_owned;
    let ocean_connected: &HashSet<String> = match opts.ocean_connected {
        Some(o) => o,
        None => {
            ocean_owned = ocean_connected_water_keys(hexes, width, height);
            &ocean_owned
        }
    };
    let mut zero = || 0.0_f64;
    let rand: &mut dyn FnMut() -> f64 = match opts.rand.take() {
        Some(r) => r,
        None => &mut zero,
    };
    let mouth_key = hex_key(mq, mr);
    match sea_dist.get(&mouth_key) {
        None => return Vec::new(),
        Some(&d) if d > 2 => return Vec::new(),
        _ => {}
    }

    let params = CoastGrowParams {
        step_cap: max_len,
        hard_meander_len: opts.hard_meander_len.unwrap_or(RIVER_HARD_MEANDER_LEN),
        allow_relief_traversal: opts.allow_relief_traversal.unwrap_or(false),
        block_river_keys: opts.block_river_keys,
        min_path_sep: opts.min_path_sep.unwrap_or(MAIN_RIVER_MIN_PATH_SEP),
        land_centroid: opts.land_centroid,
        land_center_square: opts.land_center_square,
        sep_index: opts.river_sep_index,
    };
    let mouth_to_inland = grow_river_from_coast_inland(
        hexes,
        RiverCoord::new(mq, mr),
        sea_dist,
        open_ocean_dist,
        rand,
        &params,
    );
    if mouth_to_inland.len() < 2 {
        return Vec::new();
    }
    let mut reversed = mouth_to_inland;
    reversed.reverse();
    if !path_ends_at_sea(
        hexes,
        &reversed,
        Some((width, height)),
        Some(ocean_connected),
    ) {
        return Vec::new();
    }
    reversed
}

/// Web `greedyRiverDrainToSea(hexes, sq, sr, seaDist, openOceanDist, oceanConnected, maxLen,
/// rand, sourceKey, allowReliefTraversal)` (:6276). Zjazd w dol `openOceanDist`; `[]` gdy ostatni
/// heks nie jest celem drenazu albo trasa ma 1 heks. `max_len` = limit krokow petli.
#[allow(clippy::too_many_arguments)]
pub fn greedy_river_drain_to_sea(
    hexes: &HexRecord,
    sq: i64,
    sr: i64,
    sea_dist: &HashMap<String, i64>,
    open_ocean_dist: &HashMap<String, i64>,
    ocean_connected: &HashSet<String>,
    max_len: usize,
    rand: &mut dyn FnMut() -> f64,
    source_key: &str,
    allow_relief_traversal: bool,
) -> Vec<RiverCoord> {
    let start = RiverCoord::new(sq, sr);
    let mut path: Vec<RiverCoord> = vec![start];
    let mut visited: HashSet<String> = HashSet::new();
    visited.insert(hex_key(sq, sr));

    for _step in 0..max_len {
        let cur = *path.last().expect("sciezka niepusta");
        let cur_key = hex_key(cur.q, cur.r);
        if is_river_drainage_goal(cur.q, cur.r, hexes, source_key, ocean_connected) {
            return path;
        }
        let Some(&cur_od) = open_ocean_dist.get(&cur_key) else {
            break;
        };

        let in_dir: Option<(i64, i64)> = if path.len() >= 2 {
            Some(river_step_dir(path[path.len() - 2], cur))
        } else {
            None
        };

        let mut candidates: Vec<GrowCandidate> = Vec::new();
        for (dq, dr) in HEX_DIRECTIONS {
            let (dq, dr) = (i64::from(dq), i64::from(dr));
            let nq = cur.q + dq;
            let nr = cur.r + dr;
            let nk = hex_key(nq, nr);
            if visited.contains(&nk) {
                continue;
            }
            if !is_river_window_turn_allowed(&path, nq, nr) {
                continue;
            }
            // blockExisting: nie wchodz na heks innej, juz ulozonej rzeki (web :6301).
            if !can_river_flow_through(
                hexes.get(&nk),
                &nk,
                source_key,
                true,
                None,
                allow_relief_traversal,
            ) {
                continue;
            }
            let nd = sea_dist.get(&nk).copied().unwrap_or(i64::MAX);
            if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {
                continue;
            }
            let od = open_ocean_dist
                .get(&nk)
                .map_or(f64::INFINITY, |&v| v as f64);
            if od > cur_od as f64 + 0.5 {
                continue;
            }
            let mut score = od * 12.0 + rand() * 0.35;
            if let Some(d) = in_dir {
                if same_river_dir(d, (dq, dr)) {
                    score -= 1.8;
                }
            }
            candidates.push(GrowCandidate {
                q: nq,
                r: nr,
                score,
            });
        }
        if candidates.is_empty() {
            break;
        }
        // Web: `sort((a, b) => a.score - b.score)` (stabilny, rosnaco); bierzemy pierwszy.
        candidates.sort_by(|a, b| {
            a.score
                .partial_cmp(&b.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        let pick = candidates[0];
        path.push(RiverCoord::new(pick.q, pick.r));
        visited.insert(hex_key(pick.q, pick.r));
    }
    let last = *path.last().expect("sciezka niepusta");
    if path.len() > 1 && is_river_drainage_goal(last.q, last.r, hexes, source_key, ocean_connected)
    {
        path
    } else {
        Vec::new()
    }
}
