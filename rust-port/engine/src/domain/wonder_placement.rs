//! Temat wlasciciel: R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1.
//! P6.M14 (R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1): port 1:1 `gra/src/map/wonder-placement.ts`
//! (1-119, pin edb8fb56) - wybor heksa pod cud swiata w terytorium miasta.
//!
//! Mapa jest podawana jako lista heksow (`WonderMapHex`) = `Object.values(map.hexes)` z polami
//! `coords` i `terenBazowy` (web iteruje `Object.keys(map.hexes)` i czyta `hex.coords`, nie klucz).
//! Kolejnosc wejscia nie wplywa na wynik: kandydaci sa sortowani `dist, q, r`. Promien terytorium
//! to `terrain::city_territory_radius` (dane z JSON), zero liczb balansowych w tym pliku.

use std::collections::HashMap;

use super::hex::HexCoord;
use super::terrain::{axial_distance, city_territory_radius, CityNode, TerrainType};

/// Heks mapy widziany przez logike cudow: `coords` + `terenBazowy`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WonderMapHex {
    pub coords: HexCoord,
    pub terrain: TerrainType,
}

/// Web `WonderPlacementCity` (`wonder-placement.ts:11`).
#[derive(Debug, Clone, PartialEq)]
pub struct WonderPlacementCity {
    pub q: i32,
    pub r: i32,
    pub population: f64,
    pub is_outpost: Option<bool>,
    pub is_fort: Option<bool>,
}

/// Web `PickWonderHexInput` (`wonder-placement.ts:19`).
#[derive(Debug, Clone, Copy)]
pub struct PickWonderHexInput<'a> {
    pub map: &'a [WonderMapHex],
    pub city: &'a WonderPlacementCity,
    /// Heksy juz zajete przez inne cuda.
    pub occupied_wonder_hexes: &'a [HexCoord],
    /// Heksy miast - cuda nie stoja na centrum miasta.
    pub city_hexes: &'a [HexCoord],
}

/// Web `WonderMapPlacementInput` (`wonder-placement.ts:83`).
#[derive(Debug, Clone, Copy)]
pub struct WonderMapPlacementInput<'a> {
    pub map: &'a [WonderMapHex],
    pub player_cities: &'a [WonderPlacementCity],
    pub occupied_wonder_hexes: &'a [HexCoord],
    /// Heksy z cudami w budowie (nieukonczone).
    pub building_wonder_hexes: &'a [HexCoord],
    pub city_hexes: &'a [HexCoord],
}

/// Web `isLandBuildable` (`wonder-placement.ts:32`): nie woda i nie gory.
fn is_land_buildable(terrain: TerrainType) -> bool {
    !terrain.is_water() && terrain != TerrainType::Mountains
}

/// Web `isOccupied` (`wonder-placement.ts:37`).
fn is_occupied(q: i32, r: i32, wonders: &[HexCoord], city_hexes: &[HexCoord]) -> bool {
    wonders.iter().any(|w| w.q == q && w.r == r) || city_hexes.iter().any(|c| c.q == q && c.r == r)
}

/// Web `listQualifyingWonderHexesForCity` (`wonder-placement.ts:53`): wolne heksy ladowe w terytorium
/// miasta, posortowane `dist`, `q`, `r`.
pub fn list_qualifying_wonder_hexes_for_city(input: &PickWonderHexInput<'_>) -> Vec<HexCoord> {
    let city = input.city;
    let mut node = CityNode::city(city.q, city.r, city.population);
    node.is_outpost = city.is_outpost;
    node.is_fort = city.is_fort;
    let radius = city_territory_radius(&node);

    let mut candidates: Vec<(f64, i32, i32)> = Vec::new();
    for hex in input.map {
        let (q, r) = (hex.coords.q, hex.coords.r);
        let dist = axial_distance(q, r, city.q, city.r);
        if dist > radius || dist == 0.0 {
            continue;
        }
        if !is_land_buildable(hex.terrain) {
            continue;
        }
        if is_occupied(q, r, input.occupied_wonder_hexes, input.city_hexes) {
            continue;
        }
        candidates.push((dist, q, r));
    }

    // Web: `a.dist - b.dist || a.q - b.q || a.r - b.r` (sort stabilny; klucz jest unikalny).
    candidates.sort_by(|a, b| {
        a.0.partial_cmp(&b.0)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.1.cmp(&b.1))
            .then(a.2.cmp(&b.2))
    });
    candidates
        .into_iter()
        .map(|(_, q, r)| HexCoord::new(q, r))
        .collect()
}

/// Web `listQualifyingWonderHexesForOwner` (`wonder-placement.ts:93`): suma kandydatow ze wszystkich
/// miast gracza, deduplikacja po `"q,r"`; kolejnosc = pierwsze wystapienie (jak `Map` w JS).
pub fn list_qualifying_wonder_hexes_for_owner(
    input: &WonderMapPlacementInput<'_>,
) -> Vec<HexCoord> {
    let mut occupied: Vec<HexCoord> = input.occupied_wonder_hexes.to_vec();
    occupied.extend_from_slice(input.building_wonder_hexes);
    let mut order: Vec<HexCoord> = Vec::new();
    let mut index: HashMap<(i32, i32), usize> = HashMap::new();
    for city in input.player_cities {
        let hexes = list_qualifying_wonder_hexes_for_city(&PickWonderHexInput {
            map: input.map,
            city,
            occupied_wonder_hexes: &occupied,
            city_hexes: input.city_hexes,
        });
        for h in hexes {
            match index.get(&(h.q, h.r)) {
                Some(&i) => order[i] = h,
                None => {
                    index.insert((h.q, h.r), order.len());
                    order.push(h);
                }
            }
        }
    }
    order
}

/// Web `pickWonderHexForCity` (`wonder-placement.ts:116`): najblizszy wolny heks lub `None`.
pub fn pick_wonder_hex_for_city(input: &PickWonderHexInput<'_>) -> Option<HexCoord> {
    list_qualifying_wonder_hexes_for_city(input)
        .into_iter()
        .next()
}
