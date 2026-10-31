//! P6.M07A partia 3 (czesc A: sciezki i pola) - wzrost rzeki w glab ladu przed drenazem,
//! okno skretu, indeks przestrzenny heksow rzeki i opcje sladu (`TraceRiverOpts`).
//! Web (pin `edb8fb56`, gen-helpers.ts): :5819-5842 (`TraceRiverOpts`), :5903-5974
//! (`growRiverInlandBeforeDrainage`), :6070-6079 (`riverGrowStepPassesSep`), :6129-6179
//! (`InlandDrainGrowOpts`, `collectInlandDrainGrowCandidates`), :6988-7036 (kierunki i okno
//! skretu), :8975-9056 (`RiverHexSpatialIndex`, `nearestRiverHexDistance`).
//! Wektory: `tests/p6_m07a_vectors/web-rivers-a-grow.json` (generator `gen-m07a-grow.mjs`).

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::landsea::key_qr;
use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::relief::ContinentCenterSquare;
use crate::domain::mapgen::rivers_a::walk::{
    estimate_land_centroid_from_seed, river_hex_dir_delta, score_river_step_toward_land_center,
    CENTROID_VISIT_CAP,
};
use crate::domain::mapgen::rivers_a::{
    can_river_flow_through, RiverCoord, RIVER_MIN_INLAND_FROM_SEA,
};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `RIVER_TURN_WINDOW_HEX` (:6999): okno skretu w heksach.
pub const RIVER_TURN_WINDOW_HEX: usize = 6;
/// Web `RIVER_TURN_WINDOW_MAX_SUM` (:7000): |suma delt w oknie| <= 1 (netto <= 60 st.).
pub const RIVER_TURN_WINDOW_MAX_SUM: i64 = 1;
/// Web `RIVER_SPATIAL_CELL` (:8975): rozmiar komorki indeksu przestrzennego.
pub const RIVER_SPATIAL_CELL: i64 = 6;
/// Web `nearestDistance`: `const maxRing = 24` (:9000).
const RIVER_SPATIAL_MAX_RING: i64 = 24;

/// Odleglosc axialna (web `hexAxialDistance`, :5194; lokalna kopia - bez zmian w `rivers_a.rs`).
fn hex_axial_distance(q1: i64, r1: i64, q2: i64, r2: i64) -> i64 {
    let dq = q1 - q2;
    let dr = r1 - r2;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2
}

/// Web `neighborDirIndex(q, r, nq, nr)` (:6988): indeks krawedzi 0..5 albo -1.
pub fn neighbor_dir_index(q: i64, r: i64, nq: i64, nr: i64) -> i64 {
    let dq = nq - q;
    let dr = nr - r;
    for (i, (hdq, hdr)) in HEX_DIRECTIONS.iter().enumerate() {
        if i64::from(*hdq) == dq && i64::from(*hdr) == dr {
            return i as i64;
        }
    }
    -1
}

/// Web `signedRiverDirDelta(lastDir, newDir)` (:7003): skret ze znakiem -3..+3.
pub fn signed_river_dir_delta(last_dir: i64, new_dir: i64) -> i64 {
    let raw = river_hex_dir_delta(last_dir, new_dir);
    if raw <= 3 {
        raw
    } else {
        raw - 6
    }
}

/// Web `pathSegmentDirs(path)` (:7008): kierunki kolejnych segmentow trasy (pominiete nie-sasiady).
pub fn path_segment_dirs(path: &[RiverCoord]) -> Vec<i64> {
    let mut dirs = Vec::new();
    for w in path.windows(2) {
        let d = neighbor_dir_index(w[0].q, w[0].r, w[1].q, w[1].r);
        if d >= 0 {
            dirs.push(d);
        }
    }
    dirs
}

/// Web `pathSignedTurnDeltas(segmentDirs)` (:7017): skrety ze znakiem miedzy kolejnymi segmentami.
pub fn path_signed_turn_deltas(segment_dirs: &[i64]) -> Vec<i64> {
    segment_dirs
        .windows(2)
        .map(|w| signed_river_dir_delta(w[0], w[1]))
        .collect()
}

/// Web `isRiverWindowTurnAllowed(path, nq, nr)` (:7026) z domyslnymi `windowHex`/`maxSum`
/// (wszystkie wywolania w webie uzywaja domyslnych). Precondycja: `path` niepusta (web: TypeError).
pub fn is_river_window_turn_allowed(path: &[RiverCoord], nq: i64, nr: i64) -> bool {
    let cur = *path.last().expect("isRiverWindowTurnAllowed: pusta trasa");
    let step_dir = neighbor_dir_index(cur.q, cur.r, nq, nr);
    if step_dir < 0 {
        return false;
    }
    let mut dirs = path_segment_dirs(path);
    if dirs.is_empty() {
        return true;
    }
    let step_signed = signed_river_dir_delta(*dirs.last().expect("niepusta"), step_dir);
    if step_signed.abs() > 1 {
        return false;
    }
    dirs.push(step_dir);
    let deltas = path_signed_turn_deltas(&dirs);
    // Web `deltas.slice(-windowHex)`: ostatnie `windowHex` elementow (lub wszystkie, gdy krocej).
    let start = deltas.len().saturating_sub(RIVER_TURN_WINDOW_HEX);
    let sum: i64 = deltas[start..].iter().sum();
    sum.abs() <= RIVER_TURN_WINDOW_MAX_SUM
}

/// Web `RiverHexSpatialIndex` (:8981): siatka komorek 6x6 nad heksami rzeki.
/// Klucze w webie to `"q,r"`; tu przechowane sa wspolrzedne (dedup po wspolrzednych = dedup po
/// kluczu dla kluczy kanonicznych, jakie tworzy `hexKey`).
#[derive(Debug, Clone, Default)]
pub struct RiverHexSpatialIndex {
    buckets: HashMap<(i64, i64), Vec<(i64, i64)>>,
    count: usize,
}

impl RiverHexSpatialIndex {
    /// Web `RiverHexSpatialIndex.fromKeys(keys)`. Klucze niepoprawne (web: NaN) sa pomijane.
    pub fn from_keys<'a>(keys: impl IntoIterator<Item = &'a str>) -> Self {
        let mut idx = Self::default();
        for k in keys {
            idx.add_key(k);
        }
        idx
    }

    /// Web `size` (getter): liczba unikalnych heksow.
    pub fn size(&self) -> usize {
        self.count
    }

    fn cell_of(q: i64, r: i64) -> (i64, i64) {
        // Web `Math.floor(q / RIVER_SPATIAL_CELL)`: dla dodatniego dzielnika to div_euclid.
        (
            q.div_euclid(RIVER_SPATIAL_CELL),
            r.div_euclid(RIVER_SPATIAL_CELL),
        )
    }

    /// Web `add(key)`: dodaje heks, ignoruje duplikaty.
    pub fn add_key(&mut self, key: &str) {
        if let Some((q, r)) = key_qr(key) {
            self.add(q, r);
        }
    }

    /// Dodanie heksu po wspolrzednych (ta sama logika co `add`).
    pub fn add(&mut self, q: i64, r: i64) {
        let bucket = self.buckets.entry(Self::cell_of(q, r)).or_default();
        if bucket.contains(&(q, r)) {
            return;
        }
        bucket.push((q, r));
        self.count += 1;
    }

    /// Web `addPath(path)`.
    pub fn add_path(&mut self, path: &[RiverCoord]) {
        for p in path {
            self.add(p.q, p.r);
        }
    }

    /// Web `nearestDistance(sq, sr)` bez `earlyExitBelow` (wywolanie z `nearestRiverHexDistance`).
    /// Przeszukiwanie pierscieniami komorek, przerwanie gdy `best <= ring * CELL`, limit 24 pierscieni.
    pub fn nearest_distance(&self, sq: i64, sr: i64) -> f64 {
        if self.count == 0 {
            return f64::INFINITY;
        }
        let (cq0, cr0) = Self::cell_of(sq, sr);
        let mut best: Option<i64> = None;
        let mut ring = 0i64;
        while ring <= RIVER_SPATIAL_MAX_RING {
            for dq in -ring..=ring {
                for dr in -ring..=ring {
                    if ring > 0 && dq.abs() != ring && dr.abs() != ring {
                        continue;
                    }
                    let Some(bucket) = self.buckets.get(&(cq0 + dq, cr0 + dr)) else {
                        continue;
                    };
                    for &(q, r) in bucket {
                        let d = hex_axial_distance(sq, sr, q, r);
                        if best.is_none_or(|b| d < b) {
                            best = Some(d);
                        }
                    }
                }
            }
            if let Some(b) = best {
                if b <= ring * RIVER_SPATIAL_CELL {
                    break;
                }
            }
            ring += 1;
        }
        best.map_or(f64::INFINITY, |b| b as f64)
    }
}

/// Web `nearestRiverHexDistance(sq, sr, riverKeys, spatialIndex?)` (:9044).
/// Indeks uzywany tylko gdy `size > 0`; inaczej brute force po `river_keys`.
pub fn nearest_river_hex_distance(
    sq: i64,
    sr: i64,
    river_keys: &HashSet<String>,
    spatial_index: Option<&RiverHexSpatialIndex>,
) -> f64 {
    if let Some(idx) = spatial_index {
        if idx.size() > 0 {
            return idx.nearest_distance(sq, sr);
        }
    }
    let mut best = f64::INFINITY;
    for k in river_keys {
        if let Some((q, r)) = key_qr(k) {
            best = best.min(hex_axial_distance(sq, sr, q, r) as f64);
        }
    }
    best
}

/// Web `riverGrowStepPassesSep(nq, nr, blockRiverKeys, minPathSep, spatialIndex?)` (:6070):
/// krok na heks blizej niz `minPathSep` od rzek jest odrzucany.
pub fn river_grow_step_passes_sep(
    nq: i64,
    nr: i64,
    block_river_keys: Option<&HashSet<String>>,
    min_path_sep: i64,
    spatial_index: Option<&RiverHexSpatialIndex>,
) -> bool {
    let Some(block) = block_river_keys else {
        return true;
    };
    if block.is_empty() || min_path_sep <= 0 {
        return true;
    }
    nearest_river_hex_distance(nq, nr, block, spatial_index) >= min_path_sep as f64
}

/// Web `TraceRiverOpts` (:5819): opcje sladu rzeki (interfejs; sama struktura bez logiki).
/// `rand` to funkcja zwracajaca `[0,1)`; pola opcjonalne jak w webie (`undefined` = `None`).
#[derive(Default)]
pub struct TraceRiverOpts<'a> {
    pub sea_dist: Option<&'a HashMap<String, i64>>,
    pub open_ocean_dist: Option<&'a HashMap<String, i64>>,
    pub ocean_connected: Option<&'a HashSet<String>>,
    pub map_width: Option<i64>,
    pub map_height: Option<i64>,
    pub rand: Option<&'a mut dyn FnMut() -> f64>,
    pub min_len: Option<usize>,
    pub hard_meander_len: Option<usize>,
    pub mouth_tail_len: Option<usize>,
    pub allow_relief_traversal: Option<bool>,
    pub relax_sea_buffer: Option<bool>,
    pub block_river_keys: Option<&'a HashSet<String>>,
    pub river_sep_index: Option<&'a RiverHexSpatialIndex>,
    pub min_path_sep: Option<i64>,
    pub land_centroid: Option<(f64, f64)>,
    pub land_center_square: Option<&'a ContinentCenterSquare>,
}

/// Web `InlandDrainGrowOpts` (:6129). Web `growBase` nie ustawia `sepIndex` -> w `grow` zawsze `None`.
#[derive(Clone, Copy)]
pub struct InlandDrainGrowOpts<'a> {
    pub hexes: &'a HexRecord,
    pub path: &'a [RiverCoord],
    pub cur: RiverCoord,
    pub src_key: &'a str,
    pub sea_dist: &'a HashMap<String, i64>,
    pub open_ocean_dist: &'a HashMap<String, i64>,
    pub land_centroid: Option<(f64, f64)>,
    pub land_center_square: Option<&'a ContinentCenterSquare>,
    pub block_river_keys: Option<&'a HashSet<String>>,
    pub sep_index: Option<&'a RiverHexSpatialIndex>,
    pub min_path_sep: i64,
    pub allow_relief_traversal: bool,
    pub hard_meander: bool,
    pub relax_hard_meander: bool,
    pub relax_sea_buffer: bool,
}

/// Kandydat kroku wzrostu: `{ q, r, score }` (web).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GrowCandidate {
    pub q: i64,
    pub r: i64,
    pub score: f64,
}

/// Porzadek kandydatow jak web `sort((a, b) => b.score - a.score)`: NaN traktowany jak
/// równość (V8), sortowanie stabilne (Rust `sort_by` jest stabilne).
fn cmp_candidates_desc(a: &GrowCandidate, b: &GrowCandidate) -> std::cmp::Ordering {
    use std::cmp::Ordering;
    let d = b.score - a.score;
    if d.is_nan() {
        Ordering::Equal
    } else if d < 0.0 {
        Ordering::Less
    } else if d > 0.0 {
        Ordering::Greater
    } else {
        Ordering::Equal
    }
}

/// Web `collectInlandDrainGrowCandidates(o)` (:6148). Kolejnosc filtrow i wywolan `rand()`
/// jak w webie: `rand()` tylko dla krokow, ktore przeszly wszystkie filtry.
pub fn collect_inland_drain_grow_candidates(
    o: &InlandDrainGrowOpts<'_>,
    rand: &mut dyn FnMut() -> f64,
) -> Vec<GrowCandidate> {
    let cur_key = hex_key(o.cur.q, o.cur.r);
    let cur_d = o.sea_dist.get(&cur_key).copied().unwrap_or(0);
    let cur_od = o
        .open_ocean_dist
        .get(&cur_key)
        .map_or(f64::INFINITY, |&v| v as f64);
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
            o.src_key,
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
        if !o.relax_sea_buffer && nd < RIVER_MIN_INLAND_FROM_SEA {
            continue;
        }
        let od = o
            .open_ocean_dist
            .get(&nk)
            .map_or(f64::INFINITY, |&v| v as f64);
        if o.hard_meander && !o.relax_hard_meander && od < cur_od {
            continue;
        }
        let mut score = 1200.0 - od * 30.0;
        if od > cur_od + 0.5 {
            score -= 18.0;
        }
        if nd > cur_d + 1 {
            score -= 10.0;
        }
        if nd == RIVER_MIN_INLAND_FROM_SEA && od < cur_od {
            score += 8.0;
        }
        score += score_river_step_toward_land_center(
            o.cur.q,
            o.cur.r,
            nq,
            nr,
            o.land_center_square,
            o.land_centroid,
        ) as f64;
        score += rand() * 0.35;
        out.push(GrowCandidate {
            q: nq,
            r: nr,
            score,
        });
    }
    out
}

/// Parametry `growRiverInlandBeforeDrainage` (web: argumenty pozycyjne; domyslne wartosci
/// webu musza byc podane jawnie przez wywolujacego).
pub struct InlandGrowParams<'a> {
    pub sq: i64,
    pub sr: i64,
    pub sea_dist: &'a HashMap<String, i64>,
    pub open_ocean_dist: &'a HashMap<String, i64>,
    pub inland_target_len: usize,
    pub step_cap: usize,
    pub hard_meander_len: usize,
    pub allow_relief_traversal: bool,
    pub relax_sea_buffer: bool,
    pub inland_growth_max: Option<usize>,
    pub block_river_keys: Option<&'a HashSet<String>>,
    pub min_path_sep: i64,
    pub land_centroid: Option<(f64, f64)>,
    pub land_center_square: Option<&'a ContinentCenterSquare>,
}

/// Web `growRiverInlandBeforeDrainage(hexes, sq, sr, seaDist, openOceanDist, rand, inlandTargetLen,
/// stepCap, hardMeanderLen, allowReliefTraversal, relaxSeaBuffer, inlandGrowthMax, blockRiverKeys,
/// minPathSep, landCentroid, landCenterSquare)` (:5903). Centroid: `landCentroid ?? square.centroid
/// ?? estimateLandCentroidFromSeed(..., 6000)`.
pub fn grow_river_inland_before_drainage(
    hexes: &HexRecord,
    p: &InlandGrowParams<'_>,
    rand: &mut dyn FnMut() -> f64,
) -> Vec<RiverCoord> {
    let src_key = hex_key(p.sq, p.sr);
    let mut path = vec![RiverCoord::new(p.sq, p.sr)];
    let mut visited: HashSet<String> = HashSet::from([src_key.clone()]);
    let centroid = p
        .land_centroid
        .or_else(|| p.land_center_square.map(|s| s.centroid))
        .or_else(|| {
            estimate_land_centroid_from_seed(
                hexes,
                p.sq,
                p.sr,
                p.allow_relief_traversal,
                CENTROID_VISIT_CAP,
            )
        });
    let growth_target = p.step_cap.min(match p.inland_growth_max {
        Some(g) => p.inland_target_len.max(g),
        None => p.inland_target_len,
    });

    while path.len() < growth_target && path.len() < p.step_cap {
        let cur = *path.last().expect("grow: trasa niepusta");
        let hard = path.len() < p.hard_meander_len;
        let base = InlandDrainGrowOpts {
            hexes,
            path: &path,
            cur,
            src_key: &src_key,
            sea_dist: p.sea_dist,
            open_ocean_dist: p.open_ocean_dist,
            land_centroid: centroid,
            land_center_square: p.land_center_square,
            block_river_keys: p.block_river_keys,
            sep_index: None,
            min_path_sep: p.min_path_sep,
            allow_relief_traversal: p.allow_relief_traversal,
            hard_meander: hard,
            relax_hard_meander: false,
            relax_sea_buffer: p.relax_sea_buffer,
        };
        let not_visited = |c: &GrowCandidate| !visited.contains(&hex_key(c.q, c.r));

        let mut candidates: Vec<GrowCandidate> = collect_inland_drain_grow_candidates(&base, rand)
            .into_iter()
            .filter(not_visited)
            .collect();

        if candidates.is_empty() {
            let relaxed = InlandDrainGrowOpts {
                relax_hard_meander: true,
                ..base
            };
            candidates = collect_inland_drain_grow_candidates(&relaxed, rand)
                .into_iter()
                .filter(not_visited)
                .collect();
        }

        if candidates.is_empty() {
            if hard && path.len() < p.hard_meander_len {
                let soft_opts = InlandDrainGrowOpts {
                    relax_hard_meander: true,
                    relax_sea_buffer: p.relax_sea_buffer,
                    ..base
                };
                let mut soft: Vec<GrowCandidate> =
                    collect_inland_drain_grow_candidates(&soft_opts, rand)
                        .into_iter()
                        .filter(not_visited)
                        .collect();
                if soft.is_empty() {
                    break;
                }
                soft.sort_by(cmp_candidates_desc);
                let pick = soft[0];
                path.push(RiverCoord::new(pick.q, pick.r));
                visited.insert(hex_key(pick.q, pick.r));
                continue;
            }
            break;
        }

        candidates.sort_by(cmp_candidates_desc);
        // Web: Math.min(len - 1, Math.floor(rand() * Math.min(3, len))); pick = cand[idx] ?? cand[0].
        let span = candidates.len().min(3) as f64;
        let pick_idx = (candidates.len() - 1).min((rand() * span).floor() as usize);
        let pick = candidates[pick_idx];
        path.push(RiverCoord::new(pick.q, pick.r));
        visited.insert(hex_key(pick.q, pick.r));
    }
    path
}
