//! P6.M07A partia 2 (czesc A: sciezki i pola) - helpery trasowania rzek i audyt terenu.
//! Web: gen-helpers.ts:5121-5168 (`auditMapTerrainData`), :5580-5611 (`canRiverDrainStep`,
//! `isRiverDrainageGoal`), :5781-5817 (`inferMapDimsFromHexes`, `isReliefRiverSource`,
//! `pathEndsAtSea`), :5879-5900 (`riverStepDir`, `sameRiverDir`, `reconstructRiverPath`),
//! :5974-5977 (`riverHexDirDelta`), :5981-6067 (estymacja centroidu i scoring kroku).
//! Pin `edb8fb56`. Wektory: `tests/p6_m07a_vectors/web-rivers-a-walk.json`.

use std::collections::{BTreeMap, HashMap, HashSet, VecDeque};

use crate::domain::map_generator::Terrain;
use crate::domain::mapgen::landsea::{
    count_open_ocean_land_specks, find_inland_sea_hexes, key_qr, ocean_connected_water_keys,
};
use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::relief::{hex_distance_to_center_square, ContinentCenterSquare};
use crate::domain::mapgen::rivers_a::{
    can_river_flow_through, is_river_land_terrain, RiverCoord, RIVER_MIN_INLAND_FROM_SEA,
    RIVER_MOUTH_TAIL_LEN,
};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `visitCap` domyslnie w `estimateLandCentroidFromSeed` (:5988).
pub const CENTROID_VISIT_CAP: usize = 6000;

/// Web `canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, postInlandPhase)` (:5580).
/// Krok drenazu: do oceanu polaczonego, albo (faza ladowa) `nd >= RIVER_MIN_INLAND_FROM_SEA`;
/// po fazie ladowej takze z korytarza ujscia (`openOceanDist <= RIVER_MOUTH_TAIL_LEN`).
pub fn can_river_drain_step(
    nk: &str,
    nd: i64,
    open_ocean_dist: &HashMap<String, i64>,
    ocean_connected: &HashSet<String>,
    post_inland_phase: bool,
) -> bool {
    if ocean_connected.contains(nk) {
        return true;
    }
    let Some(&od) = open_ocean_dist.get(nk) else {
        return false;
    };
    if !post_inland_phase {
        return nd >= RIVER_MIN_INLAND_FROM_SEA;
    }
    if nd >= RIVER_MIN_INLAND_FROM_SEA {
        return true;
    }
    od <= RIVER_MOUTH_TAIL_LEN as i64
}

/// Web `isRiverDrainageGoal(q, r, _seaDist, hexes, sourceKey, oceanConnected)` (:5595).
/// Parametr `_seaDist` w webie jest nieuzywany - pominiety w porcie.
pub fn is_river_drainage_goal(
    q: i64,
    r: i64,
    hexes: &HexRecord,
    source_key: &str,
    ocean_connected: &HashSet<String>,
) -> bool {
    if ocean_connected.contains(&hex_key(q, r)) {
        return true;
    }
    for (dq, dr) in HEX_DIRECTIONS {
        let nk = hex_key(q + dq as i64, r + dr as i64);
        if !ocean_connected.contains(&nk) {
            continue;
        }
        if can_river_flow_through(hexes.get(&nk), &nk, source_key, false, None, false) {
            return true;
        }
    }
    false
}

/// Web `inferMapDimsFromHexes(hexes)` (:5781): `{ width: maxQ + 1, height: maxR + 1 }`,
/// maxima liczone od 0 (pusta mapa -> (1, 1)).
pub fn infer_map_dims_from_hexes(hexes: &HexRecord) -> (i64, i64) {
    let mut max_q = 0i64;
    let mut max_r = 0i64;
    for (key, _) in hexes.iter() {
        if let Some((q, r)) = key_qr(key) {
            if q > max_q {
                max_q = q;
            }
            if r > max_r {
                max_r = r;
            }
        }
    }
    (max_q + 1, max_r + 1)
}

/// Web `isReliefRiverSource(t)` (:5792): zrodlo rzeki z gor lub wzgorz.
pub fn is_relief_river_source(t: Terrain) -> bool {
    matches!(t, Terrain::Mountains | Terrain::Hills)
}

/// Web `pathEndsAtSea(hexes, path, width?, height?, oceanConnected?)` (:5797).
/// `dims` = `Some((width, height))` gdy web dostal oba wymiary; `ocean` = gotowy zbior
/// oceanu polaczonego (inaczej liczony z wymiarow / inferowany z `hexes`).
pub fn path_ends_at_sea(
    hexes: &HexRecord,
    path: &[RiverCoord],
    dims: Option<(i64, i64)>,
    ocean: Option<&HashSet<String>>,
) -> bool {
    let Some(last) = path.last().copied() else {
        return false;
    };
    let owned;
    let ocean: &HashSet<String> = match ocean {
        Some(o) => o,
        None => {
            let (w, h) = dims.unwrap_or_else(|| infer_map_dims_from_hexes(hexes));
            owned = ocean_connected_water_keys(hexes, w, h);
            &owned
        }
    };
    if ocean.contains(&hex_key(last.q, last.r)) {
        return true;
    }
    for (dq, dr) in HEX_DIRECTIONS {
        if ocean.contains(&hex_key(last.q + dq as i64, last.r + dr as i64)) {
            return true;
        }
    }
    false
}

/// Web `riverStepDir(from, to)` (:5879): wektor kroku `[dq, dr]`.
pub fn river_step_dir(from: RiverCoord, to: RiverCoord) -> (i64, i64) {
    (to.q - from.q, to.r - from.r)
}

/// Web `sameRiverDir(a, b)` (:5883).
pub fn same_river_dir(a: (i64, i64), b: (i64, i64)) -> bool {
    a == b
}

/// Web `riverHexDirDelta(lastDir, newDir)` (:5975): `((newDir - lastDir) % 6 + 6) % 6`.
pub fn river_hex_dir_delta(last_dir: i64, new_dir: i64) -> i64 {
    ((new_dir - last_dir) % 6 + 6) % 6
}

/// Web `reconstructRiverPath(cameFrom, endK)` (:5887): odtwarza trase od konca przez `cameFrom`.
pub fn reconstruct_river_path(came_from: &HashMap<String, String>, end_k: &str) -> Vec<RiverCoord> {
    let mut path: Vec<RiverCoord> = Vec::new();
    let mut cur: Option<&str> = Some(end_k);
    while let Some(k) = cur {
        if let Some((q, r)) = key_qr(k) {
            path.push(RiverCoord::new(q, r));
        }
        cur = came_from.get(k).map(String::as_str);
    }
    path.reverse();
    path
}

/// Web `hexAxialDistance` dla wspolrzednych zmiennoprzecinkowych (centroid to ulamki).
fn hex_axial_distance_f(q1: f64, r1: f64, q2: f64, r2: f64) -> f64 {
    let dq = q1 - q2;
    let dr = r1 - r2;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0
}

/// Web `estimateLandCentroidFromSeed(hexes, mq, mr, allowReliefTraversal, visitCap)` (:5982).
/// BFS (kolejka FIFO, `seen.size < visitCap`) po heksach przechodnich dla rzeki; srednia
/// wspolrzednych heksow lądu (`isRiverLandTerrain`). `None` gdy brak lądu.
pub fn estimate_land_centroid_from_seed(
    hexes: &HexRecord,
    mq: i64,
    mr: i64,
    allow_relief_traversal: bool,
    visit_cap: usize,
) -> Option<(f64, f64)> {
    let mouth_key = hex_key(mq, mr);
    let mut sum_q = 0f64;
    let mut sum_r = 0f64;
    let mut count = 0u64;
    let mut queue: VecDeque<String> = VecDeque::from([mouth_key.clone()]);
    let mut seen: HashSet<String> = HashSet::from([mouth_key.clone()]);
    while !queue.is_empty() && seen.len() < visit_cap {
        let k = queue.pop_front().expect("kolejka niepusta");
        let Some((q, r)) = key_qr(&k) else {
            continue;
        };
        if let Some(h) = hexes.get(&k) {
            if is_river_land_terrain(h.terrain) {
                sum_q += q as f64;
                sum_r += r as f64;
                count += 1;
            }
        }
        for (dq, dr) in HEX_DIRECTIONS {
            let nk = hex_key(q + dq as i64, r + dr as i64);
            if seen.contains(&nk) {
                continue;
            }
            if !can_river_flow_through(
                hexes.get(&nk),
                &nk,
                &mouth_key,
                false,
                None,
                allow_relief_traversal,
            ) {
                continue;
            }
            seen.insert(nk.clone());
            queue.push_back(nk);
        }
    }
    if count == 0 {
        return None;
    }
    Some((sum_q / count as f64, sum_r / count as f64))
}

/// Web `estimateLandCentroidFromMouth(hexes, mq, mr, allowReliefTraversal, visitCap)` (:6016).
/// Identyczna z {@link estimate_land_centroid_from_seed} (web deleguje).
pub fn estimate_land_centroid_from_mouth(
    hexes: &HexRecord,
    mq: i64,
    mr: i64,
    allow_relief_traversal: bool,
    visit_cap: usize,
) -> Option<(f64, f64)> {
    estimate_land_centroid_from_seed(hexes, mq, mr, allow_relief_traversal, visit_cap)
}

/// Web `scoreRiverStepTowardCentroid(q, r, nq, nr, centroid)` (:6026).
/// `+22` zblizenie, `-12` oddalenie, `+3` bez zmiany odleglosci, `0` bez centroidu.
pub fn score_river_step_toward_centroid(
    q: i64,
    r: i64,
    nq: i64,
    nr: i64,
    centroid: Option<(f64, f64)>,
) -> i64 {
    let Some((cq, cr)) = centroid else {
        return 0;
    };
    let cur_d = hex_axial_distance_f(q as f64, r as f64, cq, cr);
    let next_d = hex_axial_distance_f(nq as f64, nr as f64, cq, cr);
    if next_d < cur_d {
        return 22;
    }
    if next_d > cur_d {
        return -12;
    }
    3
}

/// Web `scoreRiverStepTowardCenterSquare(q, r, nq, nr, square)` (:6041).
/// Krok NA heks kwadratu: `+40`; zblizenie `+32`; oddalenie `-22`; bez zmiany `+4`; brak kwadratu `0`.
pub fn score_river_step_toward_center_square(
    q: i64,
    r: i64,
    nq: i64,
    nr: i64,
    square: Option<&ContinentCenterSquare>,
) -> i64 {
    let Some(sq) = square else {
        return 0;
    };
    let cur_d = hex_distance_to_center_square(q as f64, r as f64, Some(sq));
    let next_d = hex_distance_to_center_square(nq as f64, nr as f64, Some(sq));
    if sq.has(&hex_key(nq, nr)) {
        return 40;
    }
    if next_d < cur_d {
        return 32;
    }
    if next_d > cur_d {
        return -22;
    }
    4
}

/// Web `scoreRiverStepTowardLandCenter(q, r, nq, nr, square, centroid)` (:6057).
/// Kwadrat centrum ma pierwszenstwo; bez niego - centroid.
pub fn score_river_step_toward_land_center(
    q: i64,
    r: i64,
    nq: i64,
    nr: i64,
    square: Option<&ContinentCenterSquare>,
    centroid: Option<(f64, f64)>,
) -> i64 {
    if square.is_some() {
        return score_river_step_toward_center_square(q, r, nq, nr, square);
    }
    score_river_step_toward_centroid(q, r, nq, nr, centroid)
}

/// Nazwa `terenBazowy` z weba dla terenu (klucze `byTeren` w {@link audit_map_terrain_data}).
pub fn teren_bazowy_name(t: Terrain) -> &'static str {
    match t {
        Terrain::Grassland => "laka",
        Terrain::Plains => "rownina",
        Terrain::Hills => "wzgorza",
        Terrain::Mountains => "gory",
        Terrain::ShallowSea => "plytkie_morze",
        Terrain::Sea => "morze",
        Terrain::Desert => "pustynia",
        Terrain::Polar => "polarny",
    }
}

/// Wynik web `auditMapTerrainData` (:5121).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MapTerrainAudit {
    pub total_hexes: usize,
    /// Web `byTeren` (liczba heksow na nazwe terenu).
    pub by_teren: BTreeMap<&'static str, usize>,
    pub open_ocean_land_specks: usize,
    pub enclosed_inland_morze_hexes: usize,
    pub enclosed_inland_morze_components: usize,
}

/// Web `auditMapTerrainData(hexes, width, height)` (:5121): liczniki terenu, ladu "na pelnym
/// oceanie" i spojne skladowe wewnetrznego morza (BFS po 6 sasiadach).
pub fn audit_map_terrain_data(hexes: &HexRecord, width: i64, height: i64) -> MapTerrainAudit {
    let mut by_teren: BTreeMap<&'static str, usize> = BTreeMap::new();
    for (_, h) in hexes.iter() {
        *by_teren.entry(teren_bazowy_name(h.terrain)).or_insert(0) += 1;
    }
    let inland = find_inland_sea_hexes(hexes, width, height);
    let inland_set: HashSet<&str> = inland.iter().map(String::as_str).collect();
    let mut visited: HashSet<String> = HashSet::new();
    let mut components = 0usize;
    for start in &inland {
        if visited.contains(start) {
            continue;
        }
        components += 1;
        let mut stack = vec![start.clone()];
        visited.insert(start.clone());
        while let Some(cur) = stack.pop() {
            let Some((q, r)) = key_qr(&cur) else {
                continue;
            };
            for (dq, dr) in HEX_DIRECTIONS {
                let nk = hex_key(q + dq as i64, r + dr as i64);
                if visited.contains(&nk) || !inland_set.contains(nk.as_str()) {
                    continue;
                }
                visited.insert(nk.clone());
                stack.push(nk);
            }
        }
    }
    MapTerrainAudit {
        total_hexes: hexes.len(),
        by_teren,
        open_ocean_land_specks: count_open_ocean_land_specks(hexes),
        enclosed_inland_morze_hexes: inland.len(),
        enclosed_inland_morze_components: components,
    }
}
