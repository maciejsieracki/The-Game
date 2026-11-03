//! Slodka woda (web `gra/src/map/freshwater.ts`, pin 23dd158e9, R-WEB-FRESHWATER-ACCESS-LAKE-Q1).
//!
//! "Dostep do wody" = wylacznie RZEKA albo JEZIORO. Jezioro = heks wodny (Morze / PlytkieMorze),
//! ktory NIE jest polaczony woda z zadnym heksem wodnym przy krawedzi mapy (freshwater.ts:70-110).
//! Web trzyma cache per referencja `map.hexes` (WeakMap); tu [`FreshwaterCtx`] liczy zbiory raz.

use std::cell::RefCell;
use std::collections::HashSet;

use crate::domain::improvement_build::BuildMap;
use crate::domain::improvements::TerrainType;

/// Web `NEIGHBORS` (`freshwater.ts:27`), kolejnosc weba.
const NEIGHBORS: [(i32, i32); 6] = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)];

fn is_water(t: TerrainType) -> bool {
    matches!(t, TerrainType::Ocean | TerrainType::ShallowWater)
}

/// Web `getLakeHexSet` (`freshwater.ts:60-110`): zbior heksow jeziora (woda niepolaczona z oceanem
/// przy krawedzi mapy). Kolejnosc iteracji `water` = kolejnosc wstawienia heksow do `map.hexes`.
pub fn lake_hex_set(map: &BuildMap) -> HashSet<(i32, i32)> {
    let water_list: Vec<(i32, i32)> = map
        .hexes()
        .iter()
        .filter(|h| is_water(h.terrain))
        .map(|h| (h.q, h.r))
        .collect();
    let water: HashSet<(i32, i32)> = water_list.iter().copied().collect();
    let exists: HashSet<(i32, i32)> = map.hexes().iter().map(|h| (h.q, h.r)).collect();

    let mut ocean: HashSet<(i32, i32)> = HashSet::new();
    let mut stack: Vec<(i32, i32)> = Vec::new();
    for &(q, r) in &water_list {
        for (dq, dr) in NEIGHBORS {
            if !exists.contains(&(q + dq, r + dr)) {
                if ocean.insert((q, r)) {
                    stack.push((q, r));
                }
                break;
            }
        }
    }
    while let Some((q, r)) = stack.pop() {
        for (dq, dr) in NEIGHBORS {
            let nk = (q + dq, r + dr);
            if water.contains(&nk) && !ocean.contains(&nk) {
                ocean.insert(nk);
                stack.push(nk);
            }
        }
    }

    // Zabezpieczenie (freshwater.ts:93-109): zadna woda nie dotyka krawedzi -> oceanem jest
    // NAJWIEKSZA skladowa wody (remis: pierwsza w kolejnosci wstawienia, jak `>` w webie).
    if ocean.is_empty() && !water.is_empty() {
        let mut seen: HashSet<(i32, i32)> = HashSet::new();
        let mut largest: Vec<(i32, i32)> = Vec::new();
        for &start in &water_list {
            if seen.contains(&start) {
                continue;
            }
            let mut comp = vec![start];
            seen.insert(start);
            let mut i = 0;
            while i < comp.len() {
                let (q, r) = comp[i];
                for (dq, dr) in NEIGHBORS {
                    let nk = (q + dq, r + dr);
                    if water.contains(&nk) && !seen.contains(&nk) {
                        seen.insert(nk);
                        comp.push(nk);
                    }
                }
                i += 1;
            }
            if comp.len() > largest.len() {
                largest = comp;
            }
        }
        ocean.extend(largest);
    }
    water.into_iter().filter(|k| !ocean.contains(k)).collect()
}

/// Zbior heksow na sciezkach rzek (web `getRiverPathHexSet`, `freshwater.ts:36`).
pub fn river_path_hex_set(map: &BuildMap) -> HashSet<(i32, i32)> {
    map.river_paths
        .iter()
        .flat_map(|p| p.iter().copied())
        .collect()
}

/// Zbiory rzek i jezior policzone raz dla mapy (odpowiednik cache D6 weba).
#[derive(Debug, Clone)]
pub struct FreshwaterCtx {
    rivers: HashSet<(i32, i32)>,
    lakes: HashSet<(i32, i32)>,
}

impl FreshwaterCtx {
    pub fn new(map: &BuildMap) -> Self {
        Self {
            rivers: river_path_hex_set(map),
            lakes: lake_hex_set(map),
        }
    }

    /// Web `isLakeAdjacent` (`freshwater.ts:119`).
    pub fn is_lake_adjacent(&self, q: i32, r: i32) -> bool {
        if self.lakes.is_empty() {
            return false;
        }
        if self.lakes.contains(&(q, r)) {
            return true;
        }
        NEIGHBORS
            .iter()
            .any(|(dq, dr)| self.lakes.contains(&(q + dq, r + dr)))
    }

    /// Web `hasRiverWaterAccess` (`freshwater.ts:130`): `rzeka.obecna` na heksie LUB `riverPaths`
    /// na heksie / sasiedzie.
    pub fn has_river_water_access(&self, map: &BuildMap, q: i32, r: i32) -> bool {
        if map
            .hex(&crate::domain::improvement_build::hex_key(q, r))
            .is_some_and(|h| h.river_present)
        {
            return true;
        }
        if self.rivers.is_empty() {
            return false;
        }
        if self.rivers.contains(&(q, r)) {
            return true;
        }
        NEIGHBORS
            .iter()
            .any(|(dq, dr)| self.rivers.contains(&(q + dq, r + dr)))
    }

    /// Web `hasFreshwaterAccess` (`freshwater.ts:149`).
    pub fn has_freshwater_access(&self, map: &BuildMap, q: i32, r: i32) -> bool {
        self.has_river_water_access(map, q, r) || self.is_lake_adjacent(q, r)
    }

    /// Web `isFreshwaterReservedHex` (`freshwater.ts:165`): dostep do slodkiej wody LUB sasiad z
    /// samym `rzeka.obecna`.
    pub fn is_freshwater_reserved_hex(&self, map: &BuildMap, q: i32, r: i32) -> bool {
        if self.has_freshwater_access(map, q, r) {
            return true;
        }
        NEIGHBORS.iter().any(|(dq, dr)| {
            map.hex(&crate::domain::improvement_build::hex_key(q + dq, r + dr))
                .is_some_and(|h| h.river_present)
        })
    }
}

type CacheKey = (usize, usize, u64);

thread_local! {
    static LAKE_CACHE: RefCell<Option<(CacheKey, HashSet<(i32, i32)>)>> = const { RefCell::new(None) };
}

/// Odcisk ukladu wody mapy (liczba heksow + zmieszane (q,r,woda)) - klucz cache jezior; jezioro
/// zalezy wylacznie od zbioru istniejacych heksow i ich przynaleznosci do wody.
fn fingerprint(map: &BuildMap) -> CacheKey {
    let mut acc: u64 = 0xcbf2_9ce4_8422_2325;
    for h in map.hexes() {
        let mut x = (h.q as u32 as u64) << 33 | (h.r as u32 as u64) << 1 | u64::from(is_water(h.terrain));
        x = x.wrapping_mul(0x9e37_79b9_7f4a_7c15);
        x ^= x >> 29;
        acc = acc.wrapping_add(x);
    }
    (map.hexes().as_ptr() as usize, map.hexes().len(), acc)
}

/// Web `isLakeAdjacent(map, q, r)` z pamiecia podreczna jezior (jak `__lakeHexSetCache`).
pub fn is_lake_adjacent_cached(map: &BuildMap, q: i32, r: i32) -> bool {
    let key = fingerprint(map);
    LAKE_CACHE.with(|c| {
        let mut slot = c.borrow_mut();
        if slot.as_ref().is_none_or(|(k, _)| *k != key) {
            *slot = Some((key, lake_hex_set(map)));
        }
        let lakes = &slot.as_ref().expect("cache").1;
        if lakes.is_empty() {
            return false;
        }
        lakes.contains(&(q, r)) || NEIGHBORS.iter().any(|(dq, dr)| lakes.contains(&(q + dq, r + dr)))
    })
}
