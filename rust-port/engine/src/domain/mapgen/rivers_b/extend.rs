//! P6.M07B-Q3 partia 3c: meandry, wydluzanie trasy, ogon ujscia.
//! Web (pin `4bbef081d`, gen-helpers.ts): `injectRiverMeanders` (:6527),
//! `extendRiverToMinimumLength` (:6570), `extendRiverToWybrzeze` (:6603),
//! `finishRiverMouthAtSea` (:6648). Wektory: `tests/p6_m07b3_vectors/web-rivers-b-q3.json`.
//! Dwie ostatnie funkcje MUTUJA przekazana sciezke (web: `path.push` + `return path`) -
//! Rust: `&mut Vec<RiverCoord>`, ta sama semantyka (wynik = zmieniona sciezka wejsciowa).

use std::collections::{HashMap, HashSet};

use crate::domain::map_generator::Terrain;
use crate::domain::mapgen::prims::{hex_key, is_water_terrain_local, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::walk::{
    can_river_drain_step, is_river_drainage_goal, river_step_dir, same_river_dir,
};
use crate::domain::mapgen::rivers_a::{
    can_river_flow_through, is_relief_terrain, repair_river_path_adjacency, sanitize_river_path,
    RiverCoord, RIVER_MOUTH_TAIL_LEN,
};
use crate::domain::mapgen::rivers_b::meander::find_river_meander_step;
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `injectRiverMeanders(path, hexes, seaDist, rand, maxExtraSteps)` (:6527). Lagodne S na
/// dlugich prostych: po >= 4 krokach w tym samym kierunku, z szansa 0.34 (`rand() >= 0.34` ->
/// pomin), wstaw krok boczny z `findRiverMeanderStep`; maks. `max_extra_steps` wstawek.
/// Po wstawce `i += 2` (+1 z petli) i `straightRun = 0` (`lastDir` zostaje, jak w webie).
pub fn inject_river_meanders(
    path: &[RiverCoord],
    hexes: &HexRecord,
    sea_dist: &HashMap<String, i64>,
    rand: &mut dyn FnMut() -> f64,
    max_extra_steps: i64,
) -> Vec<RiverCoord> {
    if path.len() < 5 || max_extra_steps <= 0 {
        return path.to_vec();
    }
    let mut result: Vec<RiverCoord> = path.to_vec();
    let mut extra: i64 = 0;
    let mut straight_run: i64 = 0;
    let mut last_dir: Option<(i64, i64)> = None;

    let mut i = 0usize;
    while i + 2 < result.len() && extra < max_extra_steps {
        'body: {
            let d = river_step_dir(result[i], result[i + 1]);
            match last_dir {
                Some(ld) if same_river_dir(ld, d) => straight_run += 1,
                _ => {
                    straight_run = 1;
                    last_dir = Some(d);
                }
            }
            if straight_run < 4 {
                break 'body;
            }
            if rand() >= 0.34 {
                break 'body;
            }
            let used: HashSet<String> = result.iter().map(|p| hex_key(p.q, p.r)).collect();
            let Some(bend) =
                find_river_meander_step(hexes, result[i + 1], result[i + 2], sea_dist, &used, rand)
            else {
                break 'body;
            };
            result.insert(i + 2, bend);
            extra += 1;
            straight_run = 0;
            i += 2;
        }
        i += 1;
    }

    repair_river_path_adjacency(
        &sanitize_river_path(&result),
        hexes,
        &hex_key(path[0].q, path[0].r),
    )
}

/// Web `extendRiverToMinimumLength(path, hexes, seaDist, rand, minLen, stepCap)` (:6570).
/// Do 12 przebiegow: meandry (`need = min(minLen-len, stepCap-len, 6)`), a gdy nic nie przybylo -
/// pojedynczy meander w ~45% dlugosci; brak meandru -> koniec.
pub fn extend_river_to_minimum_length(
    path: &[RiverCoord],
    hexes: &HexRecord,
    sea_dist: &HashMap<String, i64>,
    rand: &mut dyn FnMut() -> f64,
    min_len: usize,
    step_cap: usize,
) -> Vec<RiverCoord> {
    if path.len() >= min_len || path.len() < 3 {
        return path.to_vec();
    }
    let src_key = hex_key(path[0].q, path[0].r);
    let mut out: Vec<RiverCoord> = path.to_vec();
    let mut pass = 0;
    while pass < 12 && out.len() < min_len && out.len() < step_cap {
        pass += 1;
        let need = (min_len - out.len()).min(step_cap - out.len()).min(6) as i64;
        let meandered = inject_river_meanders(&out, hexes, sea_dist, rand, need);
        if meandered.len() > out.len() {
            out = meandered;
            continue;
        }
        let mid = ((out.len() as f64 * 0.45).floor() as usize).max(1);
        let used: HashSet<String> = out.iter().map(|p| hex_key(p.q, p.r)).collect();
        let a = out[mid];
        let b = out[(out.len() - 1).min(mid + 1)];
        match find_river_meander_step(hexes, a, b, sea_dist, &used, rand) {
            Some(bend) => {
                let mut next: Vec<RiverCoord> = Vec::with_capacity(out.len() + 1);
                next.extend_from_slice(&out[..=mid]);
                next.push(bend);
                next.extend_from_slice(&out[mid + 1..]);
                out = repair_river_path_adjacency(&sanitize_river_path(&next), hexes, &src_key);
            }
            None => break,
        }
    }
    out
}

/// Web `extendRiverToWybrzeze(hexes, path, seaDist)` (:6603). Do `RIVER_MOUTH_TAIL_LEN` krokow:
/// konczy na pierwszym heksie wody (Wybrzeze lub Morze); inaczej dopisuje nieodwiedzonego
/// sasiada (bez Morza i reliefu) o najmniejszym `seaDist` (PlytkieMorze: -8, brak: 999).
/// Mutuje `path`.
pub fn extend_river_to_wybrzeze(
    hexes: &HexRecord,
    path: &mut Vec<RiverCoord>,
    sea_dist: &HashMap<String, i64>,
) {
    if path.is_empty() {
        return;
    }
    let mut visited: HashSet<String> = path.iter().map(|p| hex_key(p.q, p.r)).collect();
    let last = *path.last().expect("niepusta");
    let (mut cq, mut cr) = (last.q, last.r);

    for _extra in 0..RIVER_MOUTH_TAIL_LEN {
        let Some(end_hex) = hexes.get(&hex_key(cq, cr)) else {
            break;
        };
        if is_water_terrain_local(end_hex.terrain) {
            break;
        }
        let mut best: Option<(i64, i64)> = None;
        let mut best_score = f64::INFINITY;
        for (dq, dr) in HEX_DIRECTIONS {
            let nq = cq + i64::from(dq);
            let nr = cr + i64::from(dr);
            let nk = hex_key(nq, nr);
            if visited.contains(&nk) {
                continue;
            }
            let Some(nh) = hexes.get(&nk) else {
                continue;
            };
            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {
                continue;
            }
            let mut score = sea_dist.get(&nk).map_or(999.0, |&v| v as f64);
            if nh.terrain == Terrain::ShallowSea {
                score -= 8.0;
            }
            if score < best_score {
                best_score = score;
                best = Some((nq, nr));
            }
        }
        let Some((bq, br)) = best else {
            break;
        };
        path.push(RiverCoord::new(bq, br));
        visited.insert(hex_key(bq, br));
        cq = bq;
        cr = br;
    }
}

/// Web `finishRiverMouthAtSea(hexes, path, seaDist, openOceanDist, oceanConnected, sourceKey)`
/// (:6648). Domyka ujscie na pierwszym heksie wody: do `RIVER_MOUTH_TAIL_LEN + 2` krokow,
/// kandydat = sasiad nieodwiedzony, nie Morze/relief, (poza PlytkimMorzem) przechodni dla
/// `canRiverDrainStep` i `canRiverFlowThrough`; wynik `openOceanDist ?? nd` (PlytkieMorze: -15).
/// Mutuje `path`.
pub fn finish_river_mouth_at_sea(
    hexes: &HexRecord,
    path: &mut Vec<RiverCoord>,
    sea_dist: &HashMap<String, i64>,
    open_ocean_dist: &HashMap<String, i64>,
    ocean_connected: &HashSet<String>,
    source_key: &str,
) {
    if path.is_empty() {
        return;
    }
    let mouth_ready =
        |q: i64, r: i64| is_river_drainage_goal(q, r, hexes, source_key, ocean_connected);

    let last = *path.last().expect("niepusta");
    if mouth_ready(last.q, last.r) {
        return;
    }
    let mut visited: HashSet<String> = path.iter().map(|p| hex_key(p.q, p.r)).collect();
    let mut cur = last;

    for _step in 0..(RIVER_MOUTH_TAIL_LEN + 2) {
        if mouth_ready(cur.q, cur.r) {
            return;
        }
        let mut best: Option<RiverCoord> = None;
        let mut best_score = f64::INFINITY;
        for (dq, dr) in HEX_DIRECTIONS {
            let nq = cur.q + i64::from(dq);
            let nr = cur.r + i64::from(dr);
            let nk = hex_key(nq, nr);
            if visited.contains(&nk) {
                continue;
            }
            let Some(nh) = hexes.get(&nk) else {
                continue;
            };
            if nh.terrain == Terrain::Sea || is_relief_terrain(nh.terrain) {
                continue;
            }
            let nd_opt = sea_dist.get(&nk).copied();
            let nd = nd_opt.unwrap_or(i64::MAX);
            let shallow = nh.terrain == Terrain::ShallowSea;
            if !shallow && !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {
                continue;
            }
            if !can_river_flow_through(Some(nh), &nk, source_key, false, None, false) && !shallow {
                continue;
            }
            let mut score = open_ocean_dist
                .get(&nk)
                .map_or_else(|| nd_opt.map_or(f64::INFINITY, |v| v as f64), |&v| v as f64);
            if shallow {
                score -= 15.0;
            }
            if score < best_score {
                best_score = score;
                best = Some(RiverCoord::new(nq, nr));
            }
        }
        let Some(b) = best else {
            break;
        };
        path.push(b);
        visited.insert(hex_key(b.q, b.r));
        cur = b;
    }
}
