//! P6.M07B-Q2 partia 2: wzrost rzeki od ujscia na brzegu w glab ladu.
//! Web (pin `edb8fb56`, gen-helpers.ts): :6081-6097 (`CoastInlandGrowOpts`), :6098-6128
//! (`collectCoastInlandGrowCandidates`), :6181-6232 (`growRiverFromCoastInland`).
//! `openOceanDist` jest w webie przekazywane, ale nieuzywane (zachowane jako `_open_ocean_dist`).
//! Wektory: `tests/p6_m07b2_vectors/web-rivers-b-coast-grow.json` (`gen_coast_grow_vectors.mjs`).

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::relief::ContinentCenterSquare;
use crate::domain::mapgen::rivers_a::grow::{
    cmp_candidates_desc, is_river_window_turn_allowed, river_grow_step_passes_sep, GrowCandidate,
    RiverHexSpatialIndex,
};
use crate::domain::mapgen::rivers_a::walk::{
    estimate_land_centroid_from_seed, score_river_step_toward_land_center, CENTROID_VISIT_CAP,
};
use crate::domain::mapgen::rivers_a::{
    can_river_flow_through, RiverCoord, RIVER_MIN_INLAND_FROM_SEA,
};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `CoastInlandGrowOpts` (:6081). Pola `sepIndex`/`blockRiverKeys` opcjonalne jak w webie.
#[derive(Clone, Copy)]
pub struct CoastInlandGrowOpts<'a> {
    pub hexes: &'a HexRecord,
    pub path: &'a [RiverCoord],
    pub cur: RiverCoord,
    pub mouth_key: &'a str,
    pub sea_dist: &'a HashMap<String, i64>,
    pub land_centroid: Option<(f64, f64)>,
    pub land_center_square: Option<&'a ContinentCenterSquare>,
    pub block_river_keys: Option<&'a HashSet<String>>,
    pub sep_index: Option<&'a RiverHexSpatialIndex>,
    pub min_path_sep: i64,
    pub allow_relief_traversal: bool,
    pub hard_meander: bool,
    pub relax_hard_meander: bool,
}

/// Web `collectCoastInlandGrowCandidates(o)` (:6098). Kolejnosc filtrow i wywolan `rand()` jak w
/// webie: `rand()` tylko dla krokow, ktore przeszly wszystkie filtry.
pub fn collect_coast_inland_grow_candidates(
    o: &CoastInlandGrowOpts<'_>,
    rand: &mut dyn FnMut() -> f64,
) -> Vec<GrowCandidate> {
    let cur_key = hex_key(o.cur.q, o.cur.r);
    let cur_d = o.sea_dist.get(&cur_key).copied().unwrap_or(0);
    let mut out = Vec::new();
    for (dq, dr) in HEX_DIRECTIONS {
        let nq = o.cur.q + i64::from(dq);
        let nr = o.cur.r + i64::from(dr);
        let nk = hex_key(nq, nr);
        if !is_river_window_turn_allowed(o.path, nq, nr) {
            continue;
        }
        if !can_river_flow_through(
            o.hexes.get(&nk),
            &nk,
            o.mouth_key,
            true,
            None,
            o.allow_relief_traversal,
        ) {
            continue;
        }
        if !river_grow_step_passes_sep(nq, nr, o.block_river_keys, o.min_path_sep, o.sep_index) {
            continue;
        }
        let nd = o.sea_dist.get(&nk).copied().unwrap_or(0);
        if !o.path.is_empty() && nd < RIVER_MIN_INLAND_FROM_SEA {
            continue;
        }
        if o.hard_meander && !o.relax_hard_meander && nd < cur_d {
            continue;
        }
        let center_step = score_river_step_toward_land_center(
            o.cur.q,
            o.cur.r,
            nq,
            nr,
            o.land_center_square,
            o.land_centroid,
        );
        let mut score = (nd * 28) as f64;
        if nd > cur_d {
            score += 18.0;
        } else if nd == cur_d {
            score += if center_step > 8 {
                22.0
            } else if center_step < 0 {
                -36.0
            } else {
                2.0
            };
        }
        // FALA 188: silniejszy bias ku centrum 5x5 (web :6115-6117).
        score += center_step as f64 * 6.5;
        if center_step < 0 {
            score -= 18.0;
        }
        score += rand() * 0.35;
        out.push(GrowCandidate {
            q: nq,
            r: nr,
            score,
        });
    }
    out
}

/// Opcje `growRiverFromCoastInland` (web: argumenty pozycyjne 8..14, z domyslnymi wartosciami
/// webu podanymi jawnie przez wywolujacego).
pub struct CoastGrowParams<'a> {
    pub step_cap: usize,
    pub hard_meander_len: usize,
    pub allow_relief_traversal: bool,
    pub block_river_keys: Option<&'a HashSet<String>>,
    pub min_path_sep: i64,
    pub land_centroid: Option<(f64, f64)>,
    pub land_center_square: Option<&'a ContinentCenterSquare>,
    pub sep_index: Option<&'a RiverHexSpatialIndex>,
}

/// Web `growRiverFromCoastInland(hexes, mq, mr, seaDist, openOceanDist, rand, stepCap,
/// hardMeanderLen, allowReliefTraversal, blockRiverKeys, minPathSep, landCentroid,
/// landCenterSquare, sepIndex)` (:6181). Centroid: `landCentroid ?? square.centroid ??
/// estimateLandCentroidFromMouth(..., 6000)`. Wynik: path[0] = ujscie.
pub fn grow_river_from_coast_inland(
    hexes: &HexRecord,
    mouth: RiverCoord,
    sea_dist: &HashMap<String, i64>,
    _open_ocean_dist: &HashMap<String, i64>,
    rand: &mut dyn FnMut() -> f64,
    p: &CoastGrowParams<'_>,
) -> Vec<RiverCoord> {
    let mouth_key = hex_key(mouth.q, mouth.r);
    let mut path: Vec<RiverCoord> = vec![mouth];
    let mut visited: HashSet<String> = HashSet::new();
    visited.insert(mouth_key.clone());
    let centroid = p
        .land_centroid
        .or_else(|| p.land_center_square.map(|s| s.centroid))
        .or_else(|| {
            estimate_land_centroid_from_seed(
                hexes,
                mouth.q,
                mouth.r,
                p.allow_relief_traversal,
                CENTROID_VISIT_CAP,
            )
        });

    while path.len() < p.step_cap {
        let cur = *path.last().expect("sciezka niepusta");
        let hard_meander = path.len() < p.hard_meander_len;
        let base = CoastInlandGrowOpts {
            hexes,
            path: &path,
            cur,
            mouth_key: &mouth_key,
            sea_dist,
            land_centroid: centroid,
            land_center_square: p.land_center_square,
            block_river_keys: p.block_river_keys,
            sep_index: p.sep_index,
            min_path_sep: p.min_path_sep,
            allow_relief_traversal: p.allow_relief_traversal,
            hard_meander,
            relax_hard_meander: false,
        };

        let mut candidates: Vec<GrowCandidate> = collect_coast_inland_grow_candidates(&base, rand)
            .into_iter()
            .filter(|c| !visited.contains(&hex_key(c.q, c.r)))
            .collect();
        if candidates.is_empty() {
            let relaxed = CoastInlandGrowOpts {
                relax_hard_meander: true,
                ..base
            };
            candidates = collect_coast_inland_grow_candidates(&relaxed, rand)
                .into_iter()
                .filter(|c| !visited.contains(&hex_key(c.q, c.r)))
                .collect();
        }
        if candidates.is_empty() {
            break;
        }

        candidates.sort_by(cmp_candidates_desc);
        let bound = candidates.len().min(3) as f64;
        let idx_f = (rand() * bound).floor() as usize;
        let pick_idx = (candidates.len() - 1).min(idx_f);
        let pick = candidates[pick_idx];
        path.push(RiverCoord::new(pick.q, pick.r));
        visited.insert(hex_key(pick.q, pick.r));
    }
    path
}
