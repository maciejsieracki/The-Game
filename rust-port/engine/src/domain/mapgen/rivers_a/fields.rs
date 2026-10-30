//! P6.M07A (czesc A) - pola odleglosci i bufor od morza (web gen-helpers.ts:5561-5660, :5755-5793)
//! oraz kwota rzek (web :5187). Wydzielone z `rivers_a.rs` (limit partii 600 LOC).
//! Re-eksportowane z `rivers_a` (sciezka publiczna bez zmian).

use std::collections::{HashMap, HashSet};

use crate::domain::improvements::js_round;
use crate::domain::mapgen::landsea::{key_qr, ocean_connected_water_keys};
use crate::domain::mapgen::params::DensityTier;
use crate::domain::mapgen::prims::{hex_key, is_water_terrain_local, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::{neighbour, RiverCoord};
use crate::domain::mapgen::terrain_class::HexRecord;

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
