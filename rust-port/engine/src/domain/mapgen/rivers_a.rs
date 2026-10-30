//! P6.M07A (czesc A: sciezki i pola rzek) - port gen-helpers.ts:5121-6068 (pin `edb8fb56`).
//! Temat wlasciciel: R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1.
//! Partia 1 (ten plik): stale, ranking wysokosci, kwota rzek, czyszczenie maski Ziemi,
//! render sciezek (land / medium / coastal), sanityzacja i naprawa sciezek, bufor od morza,
//! pola odleglosci (morze / ocean otwarty) i `RiverFieldCache`.
//! Partie 2+ (trasowanie, meandry, pathEndsAtSea, ...) - patrz dossier P6-M07A (tabela statusu).
//! Profiler `CIV_RIVER_PROFILE` (web :5651-5752) NIE jest portowany: nie wplywa na wynik generatora.

use std::collections::{HashMap, HashSet};

use crate::domain::improvements::js_round;
use crate::domain::map_generator::{ClimateBand, Terrain};
use crate::domain::mapgen::landsea::{is_dry_land_terrain, key_qr, ocean_connected_water_keys};
use crate::domain::mapgen::params::{map_size_label_from_dims, DensityTier, MapSizeLabel};
use crate::domain::mapgen::prims::{
    climate_band_at, earth_template_land_at, hex_key, is_water_terrain_local, HEX_DIRECTIONS,
};
use crate::domain::mapgen::terrain_class::{set_hex_to_morze, HexRecord, Nakladka, TerrainHex};

/// Web `RiverCoord` (gen-helpers.ts:5844): `{ q, r }`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct RiverCoord {
    pub q: i64,
    pub r: i64,
}

impl RiverCoord {
    pub const fn new(q: i64, r: i64) -> Self {
        Self { q, r }
    }
}

// ---------------------------------------------------------------------------
// Stale (web :5512-5554, :5555-5612). Wartosci zakodowane jak w webie; zmiana = dryf wektorow.
// ---------------------------------------------------------------------------

/// Web `RIVER_MIN_INLAND_FROM_SEA` (:5512).
pub const RIVER_MIN_INLAND_FROM_SEA: i64 = 2;
/// Web `RIVER_MIN_MAIN_LEN` (:5518).
pub const RIVER_MIN_MAIN_LEN: usize = 3;
/// Web `RIVER_HARD_MEANDER_LEN` (:5523).
pub const RIVER_HARD_MEANDER_LEN: usize = 8;
/// Web `RIVER_MOUTH_TAIL_LEN` (:5526).
pub const RIVER_MOUTH_TAIL_LEN: usize = 5;
/// Web `MAIN_RIVER_MIN_PATH_SEP` (:5529).
pub const MAIN_RIVER_MIN_PATH_SEP: i64 = 3;
/// Web `MEDIUM_TRIBUTARY_SPACING_HEX` (:5532).
pub const MEDIUM_TRIBUTARY_SPACING_HEX: i64 = 4;
/// Web `MEDIUM_TRIBUTARY_MIN_NET_LEN` (:5538).
pub const MEDIUM_TRIBUTARY_MIN_NET_LEN: usize = 7;
/// Web `MAIN_RIVER_COAST_MOUTH_MAX_GAP` (:5550).
pub const MAIN_RIVER_COAST_MOUTH_MAX_GAP: i64 = 7;

/// Web `mediumTributarySpacingHex(_w, _h, _largeMapPerf)` (:5534): stale 4 hex na kazdej mapie.
pub const fn medium_tributary_spacing_hex(_width: i64, _height: i64) -> i64 {
    MEDIUM_TRIBUTARY_SPACING_HEX
}

/// Web `mediumTributaryMinNetLen(width, height)` (:5540).
pub fn medium_tributary_min_net_len(width: i64, height: i64) -> usize {
    let min_dim = width.min(height);
    if min_dim < 80 {
        return 4;
    }
    if min_dim < 120 {
        return 5;
    }
    MEDIUM_TRIBUTARY_MIN_NET_LEN
}

/// Web `mainRiverCoastMouthMaxGapForDims(w, h)` (:5551): Mala 5, reszta 7.
pub fn main_river_coast_mouth_max_gap_for_dims(w: i64, h: i64) -> i64 {
    match map_size_label_from_dims(w, h) {
        MapSizeLabel::Mala => 5,
        _ => MAIN_RIVER_COAST_MOUTH_MAX_GAP,
    }
}

/// Web `ELEVATION_RANK` (:5175): nizszy = nizej nad poziomem morza.
pub const fn elevation_rank(t: Terrain) -> u8 {
    match t {
        Terrain::Sea => 0,
        Terrain::ShallowSea => 1,
        Terrain::Grassland => 2,
        Terrain::Desert => 3,
        Terrain::Plains => 4,
        Terrain::Hills => 5,
        Terrain::Mountains => 6,
        Terrain::Polar => 2,
    }
}

// ---------------------------------------------------------------------------
// Predykaty terenu (web: isRelief / isRiverLandTerrain :6854, isReliefTerrain :5847).
// ---------------------------------------------------------------------------

/// Web `isReliefTerrain` (:5847): gory i wzgorza.
const fn is_relief_terrain(t: Terrain) -> bool {
    matches!(t, Terrain::Mountains | Terrain::Hills)
}

/// Web `isRiverLandTerrain` (:6854): lad nadajacy sie na zrodlo / bieg rzeki.
const fn is_river_land_terrain(t: Terrain) -> bool {
    matches!(
        t,
        Terrain::Grassland
            | Terrain::Plains
            | Terrain::Hills
            | Terrain::Mountains
            | Terrain::Desert
            | Terrain::Polar
    )
}

/// Web `hexAxialDistance` (:5405): `(|dq| + |dr| + |dq + dr|) / 2` (zawsze parzysta suma).
fn hex_axial_distance(q1: i64, r1: i64, q2: i64, r2: i64) -> i64 {
    let dq = q1 - q2;
    let dr = r1 - r2;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2
}

fn neighbour(q: i64, r: i64, dir: (i32, i32)) -> (i64, i64) {
    (q + i64::from(dir.0), r + i64::from(dir.1))
}

// ---------------------------------------------------------------------------
// Maska Ziemi (web purgeOceanInsideEarthLandMask :5204, purgeStrayLandOutsideEarthMask :5244).
// ---------------------------------------------------------------------------

/// Web `purgeOceanInsideEarthLandMask(hexes, width, height)` (:5204).
/// Woda wewnatrz maski Ziemi -> Pustynia (klimat `desert` i >=2 suchych pustynnych sasiadow) albo Laka.
/// Zwraca liczbe zmienionych heksow. Iteracja w kolejnosci wstawiania; odczyty sasiadow widza
/// zmiany wykonane wczesniej w tej samej petli (jak w JS).
pub fn purge_ocean_inside_earth_land_mask(hexes: &mut HexRecord, width: u32, height: u32) -> usize {
    let keys: Vec<String> = hexes.keys().cloned().collect();
    let mut n = 0;
    for key in keys {
        let Some((q, r)) = key_qr(&key) else { continue };
        if earth_template_land_at(q, r, width, height) <= 0.0 {
            continue;
        }
        let Some(hex) = hexes.get(&key) else { continue };
        if !is_water_terrain_local(hex.terrain) {
            continue;
        }
        let mut pust_n = 0;
        for dir in HEX_DIRECTIONS {
            let (nq, nr) = neighbour(q, r, dir);
            let Some(nh) = hexes.get(&hex_key(nq, nr)) else {
                continue;
            };
            if is_water_terrain_local(nh.terrain) {
                continue;
            }
            if nh.terrain == Terrain::Desert {
                pust_n += 1;
            }
        }
        let desert_band = climate_band_at(r, height, false) == ClimateBand::Desert;
        let new_terrain = if desert_band && pust_n >= 2 {
            Terrain::Desert
        } else {
            Terrain::Grassland
        };
        let hex = hexes.get_mut(&key).expect("klucz istnieje");
        hex.terrain = new_terrain;
        hex.overlay = Nakladka::Brak;
        hex.river_present = false;
        hex.river_edges.clear();
        hex.has_deposit = false;
        n += 1;
    }
    n
}

/// Web `purgeStrayLandOutsideEarthMask(hexes, width, height)` (:5244).
/// Suchy lad poza maska Ziemi -> morze. Zwraca liczbe zmienionych heksow.
pub fn purge_stray_land_outside_earth_mask(
    hexes: &mut HexRecord,
    width: u32,
    height: u32,
) -> usize {
    let keys: Vec<String> = hexes.keys().cloned().collect();
    let mut n = 0;
    for key in keys {
        let Some((q, r)) = key_qr(&key) else { continue };
        if earth_template_land_at(q, r, width, height) > 0.0 {
            continue;
        }
        let Some(hex) = hexes.get_mut(&key) else {
            continue;
        };
        if !is_dry_land_terrain(hex.terrain) {
            continue;
        }
        set_hex_to_morze(hex);
        n += 1;
    }
    n
}

// ---------------------------------------------------------------------------
// Sanityzacja i naprawa sciezek (web :5405-5475).
// ---------------------------------------------------------------------------

/// Web `assertRiverPathAdjacent(path)` (:5402): kazdy krok ma odleglosc heksowa 1.
pub fn assert_river_path_adjacent(path: &[RiverCoord]) -> bool {
    for i in 1..path.len() {
        let a = path[i - 1];
        let b = path[i];
        if hex_axial_distance(a.q, a.r, b.q, b.r) != 1 {
            return false;
        }
    }
    true
}

/// Web `splitAdjacentRiverChains(path)` (:5418): ciagle odcinki sasiednich heksow (min. 2 heksy).
pub fn split_adjacent_river_chains(path: &[RiverCoord]) -> Vec<Vec<RiverCoord>> {
    if path.len() < 2 {
        return Vec::new();
    }
    let mut chains: Vec<Vec<RiverCoord>> = Vec::new();
    let mut chain: Vec<RiverCoord> = vec![path[0]];
    for &cur in &path[1..] {
        let prev = *chain.last().expect("lancuch niepusty");
        if hex_axial_distance(prev.q, prev.r, cur.q, cur.r) == 1 {
            chain.push(cur);
        } else {
            if chain.len() >= 2 {
                chains.push(chain);
            }
            chain = vec![cur];
        }
    }
    if chain.len() >= 2 {
        chains.push(chain);
    }
    chains
}

/// Web `sanitizeRiverPath(path)` (:5434): usuwa petle i kroki niesasiednie.
pub fn sanitize_river_path(path: &[RiverCoord]) -> Vec<RiverCoord> {
    if path.len() < 2 {
        return path.to_vec();
    }
    let mut out: Vec<RiverCoord> = vec![path[0]];
    let mut seen: HashSet<(i64, i64)> = HashSet::new();
    seen.insert((path[0].q, path[0].r));
    for &p in &path[1..] {
        if seen.contains(&(p.q, p.r)) {
            continue;
        }
        let prev = *out.last().expect("wynik niepusty");
        if hex_axial_distance(prev.q, prev.r, p.q, p.r) != 1 {
            continue;
        }
        out.push(p);
        seen.insert((p.q, p.r));
    }
    out
}

/// Web `riverPathHasRevisitedHex(path)` (:5450): true gdy ten sam heks wystepuje dwa razy.
pub fn river_path_has_revisited_hex(path: &[RiverCoord]) -> bool {
    let mut seen: HashSet<(i64, i64)> = HashSet::new();
    for p in path {
        if !seen.insert((p.q, p.r)) {
            return true;
        }
    }
    false
}

/// Web `canRiverFlowThrough(hex, cellKey, sourceKey, blockExisting, allowKey, allowReliefTraversal)`
/// (gen-helpers.ts:5862). Morze nigdy; gory/wzgorza tylko dla zrodla (chyba ze `allow_relief`);
/// `block_existing` odrzuca heksy z juz ulozona rzeka poza `allow_key`.
pub fn can_river_flow_through(
    hex: Option<&TerrainHex>,
    cell_key: &str,
    source_key: &str,
    block_existing: bool,
    allow_key: Option<&str>,
    allow_relief_traversal: bool,
) -> bool {
    let Some(hex) = hex else { return false };
    if hex.terrain == Terrain::Sea {
        return false;
    }
    if is_relief_terrain(hex.terrain) && !allow_relief_traversal {
        return cell_key == source_key;
    }
    if block_existing && hex.river_present && allow_key != Some(cell_key) {
        return false;
    }
    true
}

/// Web `repairRiverPathAdjacency(path, hexes, sourceKey)` (:5468): uzupelnia luki (A*-owe skoki >1).
pub fn repair_river_path_adjacency(
    path: &[RiverCoord],
    hexes: &HexRecord,
    source_key: &str,
) -> Vec<RiverCoord> {
    if path.len() < 2 {
        return path.to_vec();
    }
    let mut out: Vec<RiverCoord> = vec![path[0]];
    let mut visited: HashSet<String> = HashSet::new();
    visited.insert(hex_key(path[0].q, path[0].r));
    for &target in &path[1..] {
        let target_k = hex_key(target.q, target.r);
        let mut guard = 0;
        while guard < 64 {
            guard += 1;
            let cur = *out.last().expect("wynik niepusty");
            let d = hex_axial_distance(cur.q, cur.r, target.q, target.r);
            if d == 0 {
                break;
            }
            if d == 1 {
                out.push(target);
                visited.insert(target_k.clone());
                break;
            }
            let mut best: Option<RiverCoord> = None;
            let mut best_dist = i64::MAX;
            for dir in HEX_DIRECTIONS {
                let (nq, nr) = neighbour(cur.q, cur.r, dir);
                let nk = hex_key(nq, nr);
                if visited.contains(&nk) && nk != target_k {
                    continue;
                }
                if !can_river_flow_through(hexes.get(&nk), &nk, source_key, false, None, false) {
                    continue;
                }
                let nd = hex_axial_distance(nq, nr, target.q, target.r);
                if nd < best_dist {
                    best_dist = nd;
                    best = Some(RiverCoord::new(nq, nr));
                }
            }
            match best {
                Some(b) if best_dist < d => {
                    out.push(b);
                    visited.insert(hex_key(b.q, b.r));
                }
                _ => break,
            }
        }
    }
    sanitize_river_path(&out)
}

// ---------------------------------------------------------------------------
// Render sciezek (web :5261-5395).
// ---------------------------------------------------------------------------

/// Web `hasLandNeighborTouchingSea(hexes, q, r)` (:5335, prywatna).
fn has_land_neighbor_touching_sea(hexes: &HexRecord, q: i64, r: i64) -> bool {
    HEX_DIRECTIONS.iter().any(|&dir| {
        let (nq, nr) = neighbour(q, r, dir);
        hexes
            .get(&hex_key(nq, nr))
            .is_some_and(|nh| is_water_terrain_local(nh.terrain))
    })
}

/// Web `hasMorzeNeighborForRiverRender(hexes, q, r)` (:5343, prywatna): bezposredni sasiad Morze.
fn has_morze_neighbor_for_river_render(hexes: &HexRecord, q: i64, r: i64) -> bool {
    HEX_DIRECTIONS.iter().any(|&dir| {
        let (nq, nr) = neighbour(q, r, dir);
        hexes
            .get(&hex_key(nq, nr))
            .is_some_and(|nh| nh.terrain == Terrain::Sea)
    })
}

/// Web `landRiverRenderPath(hexes, path)` (:5261): trasa do renderu lądu (urywa na wodzie).
pub fn land_river_render_path(hexes: &HexRecord, path: &[RiverCoord]) -> Vec<RiverCoord> {
    let mut land: Vec<RiverCoord> = Vec::new();
    for &p in path {
        let Some(h) = hexes.get(&hex_key(p.q, p.r)) else {
            break;
        };
        if is_water_terrain_local(h.terrain) {
            break;
        }
        land.push(p);
    }
    finish_render_path(land, hexes)
}

/// Wspolna koncowka `landRiverRenderPath` / `mediumRiverRenderPath`: sanityzacja + naprawa.
fn finish_render_path(land: Vec<RiverCoord>, hexes: &HexRecord) -> Vec<RiverCoord> {
    if land.len() < 2 {
        return land;
    }
    let src = hex_key(land[0].q, land[0].r);
    let clean = sanitize_river_path(&land);
    if assert_river_path_adjacent(&clean) {
        return clean;
    }
    repair_river_path_adjacency(&clean, hexes, &src)
}

/// Web `countMediumInlandLandHexes(hexes, path)` (:5279): ile heksow trasy to suchy lad.
pub fn count_medium_inland_land_hexes(hexes: &HexRecord, path: &[RiverCoord]) -> usize {
    path.iter()
        .filter(|p| {
            hexes
                .get(&hex_key(p.q, p.r))
                .is_some_and(|h| is_river_land_terrain(h.terrain))
        })
        .count()
}

/// Web `mediumRiverRenderPath(hexes, path)` (:5295): tylko suchy lad (pomija wybrzeze w srodku).
pub fn medium_river_render_path(hexes: &HexRecord, path: &[RiverCoord]) -> Vec<RiverCoord> {
    let land: Vec<RiverCoord> = path
        .iter()
        .copied()
        .filter(|p| {
            hexes
                .get(&hex_key(p.q, p.r))
                .is_some_and(|h| is_river_land_terrain(h.terrain))
        })
        .collect();
    finish_render_path(land, hexes)
}

/// Web `coastalRiverRenderPath(hexes, path)` (:5312): odcinek ujscia wybrzeze -> morze (render-only).
pub fn coastal_river_render_path(hexes: &HexRecord, path: &[RiverCoord]) -> Vec<RiverCoord> {
    if path.len() < 2 {
        return Vec::new();
    }
    let mut start = path.len() - 1;
    for i in (0..path.len()).rev() {
        let p = path[i];
        let Some(h) = hexes.get(&hex_key(p.q, p.r)) else {
            continue;
        };
        if h.terrain == Terrain::ShallowSea {
            start = i;
            break;
        }
        if h.terrain != Terrain::Sea && has_land_neighbor_touching_sea(hexes, p.q, p.r) {
            start = i;
            break;
        }
    }
    let mut out: Vec<RiverCoord> = Vec::new();
    for &p in &path[start..] {
        let Some(h) = hexes.get(&hex_key(p.q, p.r)) else {
            continue;
        };
        if h.terrain == Terrain::Sea {
            continue;
        }
        out.push(p);
    }
    // Dociaganie wstegi przez pas Wybrzeza (max 4 kroki) az do heksu styczacego z Morzem.
    if !out.is_empty() {
        let mut lp = *out.last().expect("out niepusty");
        let mut lh_shallow = hexes
            .get(&hex_key(lp.q, lp.r))
            .is_some_and(|h| h.terrain == Terrain::ShallowSea);
        for _guard in 0..4 {
            if lh_shallow && has_morze_neighbor_for_river_render(hexes, lp.q, lp.r) {
                break;
            }
            let mut next: Option<RiverCoord> = None;
            let mut best_score: i32 = -1;
            for dir in HEX_DIRECTIONS {
                let (nq, nr) = neighbour(lp.q, lp.r, dir);
                if out.iter().any(|o| o.q == nq && o.r == nr) {
                    continue;
                }
                let nk = hex_key(nq, nr);
                let Some(nh) = hexes.get(&nk) else { continue };
                if nh.terrain != Terrain::ShallowSea {
                    continue;
                }
                let score = i32::from(has_morze_neighbor_for_river_render(hexes, nq, nr));
                if score > best_score {
                    best_score = score;
                    next = Some(RiverCoord::new(nq, nr));
                }
            }
            let Some(nx) = next else { break };
            out.push(nx);
            lp = nx;
            lh_shallow = hexes
                .get(&hex_key(nx.q, nx.r))
                .is_some_and(|h| h.terrain == Terrain::ShallowSea);
        }
    }
    if out.len() < 2 {
        return out;
    }
    if start > 0 {
        let prev = path[start - 1];
        if hexes
            .get(&hex_key(prev.q, prev.r))
            .is_some_and(|ph| !is_water_terrain_local(ph.terrain))
        {
            out.insert(0, prev);
        }
    }
    let src = hex_key(out[0].q, out[0].r);
    repair_river_path_adjacency(&out, hexes, &src)
}

// ---------------------------------------------------------------------------
// Bufor od morza i pola odleglosci (web :5561-5660, :5755-5793).
// ---------------------------------------------------------------------------

/// Web `riverPathRespectsSeaBuffer(hexes, path, seaDist, minInland, mouthTail)` (:5561).
/// Ciało trasy (bez ostatnich `mouth_tail` heksow) musi byc lądem o `seaDist >= min_inland`.
pub fn river_path_respects_sea_buffer(
    hexes: &HexRecord,
    path: &[RiverCoord],
    sea_dist: &HashMap<String, i64>,
    min_inland: i64,
    mouth_tail: usize,
) -> bool {
    if path.is_empty() {
        return false;
    }
    let body_end = path.len().saturating_sub(mouth_tail);
    for p in &path[..body_end] {
        let k = hex_key(p.q, p.r);
        let Some(h) = hexes.get(&k) else { return false };
        if is_water_terrain_local(h.terrain) {
            return false;
        }
        if sea_dist.get(&k).copied().unwrap_or(0) < min_inland {
            return false;
        }
    }
    true
}

/// Web `buildSeaDistanceField(hexes)` (:5614): BFS od wody (Morze + PlytkieMorze) po heksach mapy.
pub fn build_sea_distance_field(hexes: &HexRecord) -> HashMap<String, i64> {
    let mut dist: HashMap<String, i64> = HashMap::new();
    let mut queue: Vec<String> = Vec::new();
    for (key, hex) in hexes.iter() {
        if is_water_terrain_local(hex.terrain) {
            dist.insert(key.clone(), 0);
            queue.push(key.clone());
        }
    }
    bfs_extend(&mut dist, queue, hexes);
    dist
}

/// Web `buildOpenOceanDistanceField(hexes, width, height, oceanConnected?)` (:5640).
/// Zrodla = woda polaczona z krawedzia mapy (nie jeziora w ladzie).
pub fn build_open_ocean_distance_field(
    hexes: &HexRecord,
    width: i64,
    height: i64,
    ocean_connected: Option<&HashSet<String>>,
) -> HashMap<String, i64> {
    let computed;
    let ocean = match ocean_connected {
        Some(o) => o,
        None => {
            computed = ocean_connected_water_keys(hexes, width, height);
            &computed
        }
    };
    let mut dist: HashMap<String, i64> = HashMap::new();
    let mut queue: Vec<String> = Vec::new();
    for key in ocean {
        dist.insert(key.clone(), 0);
        queue.push(key.clone());
    }
    bfs_extend(&mut dist, queue, hexes);
    dist
}

/// Wspolne rozszerzenie BFS: sasiedzi istniejacy w `hexes` dostaja `d + 1` (pierwsze odkrycie).
fn bfs_extend(dist: &mut HashMap<String, i64>, mut queue: Vec<String>, hexes: &HexRecord) {
    let mut qi = 0;
    while qi < queue.len() {
        let key = queue[qi].clone();
        qi += 1;
        let d = dist[&key];
        let Some((q, r)) = key_qr(&key) else { continue };
        for dir in HEX_DIRECTIONS {
            let (nq, nr) = neighbour(q, r, dir);
            let nk = hex_key(nq, nr);
            if dist.contains_key(&nk) {
                continue;
            }
            if hexes.get(&nk).is_none() {
                continue;
            }
            dist.insert(nk.clone(), d + 1);
            queue.push(nk);
        }
    }
}

/// Web `RiverFieldCache` (:5755): pola morza liczone raz na blok rzek.
#[derive(Debug, Clone, Default)]
pub struct RiverFieldCache {
    pub sea_dist: HashMap<String, i64>,
    pub ocean_connected: HashSet<String>,
    pub open_ocean_dist: HashMap<String, i64>,
}

/// Web `buildRiverFieldCache(hexes, width, height)` (:5761).
pub fn build_river_field_cache(hexes: &HexRecord, width: i64, height: i64) -> RiverFieldCache {
    let ocean_connected = ocean_connected_water_keys(hexes, width, height);
    RiverFieldCache {
        sea_dist: build_sea_distance_field(hexes),
        open_ocean_dist: build_open_ocean_distance_field(
            hexes,
            width,
            height,
            Some(&ocean_connected),
        ),
        ocean_connected,
    }
}

/// Web `riversQuotaForLandMass(landHexCount, tier)` (:5187; legacy, nieuzywany przez generateRivers).
pub fn rivers_quota_for_land_mass(land_hex_count: usize, tier: DensityTier) -> i64 {
    if land_hex_count < 8 {
        return 0;
    }
    if land_hex_count < 14 {
        return 3;
    }
    let hex_per_river = match tier {
        DensityTier::High => 1.0,
        DensityTier::Low => 5.0,
        DensityTier::Medium => 2.0,
    };
    let rounded = js_round(land_hex_count as f64 / hex_per_river) as i64;
    rounded.max(3)
}

/// Pomocniczo dla testow: klucz heksa z wspolrzednych (zgodny z web `hexKey`).
pub fn river_hex_key(c: RiverCoord) -> String {
    hex_key(c.q, c.r)
}
