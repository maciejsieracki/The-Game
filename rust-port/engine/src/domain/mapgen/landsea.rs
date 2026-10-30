//! P6.M06A - lad / morze / wybrzeze A. Temat wlasciciel: R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1.
//! Zakres web (P6-25 §6): gen-helpers.ts:3186-4374 (29 symboli).
//!
//! RUNDA 1 (ten plik): port 1:1 (pin web `edb8fb56`) podzbioru symboli zakresu, ktore nie wymagaja
//! generatora losowego ani tabel poza zakresem M06A:
//! `isLandTerrain` (:3234), `isLandOrCoast` (:3249), `defaultLandFractionForTyp` (:3254),
//! `countLandSeaHexes` (:3268), `erodeTerrainRank` (:3288), `countMorseNeighbors` (:3294),
//! `countLandNeighbors` (:3304), `isCoastalLandHex` (:3313), `isCoastalMorseHex` (:3319),
//! `isDryLandTerrain` (:3882), `applyCoastRing` (:3894), `applyDoubleCoastRing` (:3923),
//! `findDryLandTouchingSea` (:3949), `sanitizeCoastHexes` (:3975), `oceanConnectedWaterKeys` (:4026),
//! `oceanConnectedMorseKeys` (:4063, prywatna), `findInlandWaterHexes` (:4109),
//! `findInlandSeaHexes` (:4123).
//! Reuse (DANE-JUZ-W-RUST): `setHexToMorze` (:3325) = `terrain_class::set_hex_to_morze` (M04),
//! `parseHexKey` (:3202) = `terrain_class::parse_hex_key` (M04); `HEX_DIRECTIONS` i `hexKey`
//! z `prims` (M01).
//!
//! Pozostale symbole zakresu: RUNDA-2 (patrz dyspozycje/rust-port/p6/P6-M06A-LAD-MORZE-WYBRZEZE-A.md).
//!
//! ZALOZENIA (runda 1):
//! - Klucze heksow sa kanonicznymi napisami `"q,r"` z calkowitych `q`, `r` (tak buduje je generator).
//!   Klucz niekanoniczny jest pomijany przy iteracji po kluczach (web: `NaN` nie trafia w zadna
//!   krawedz; w pozostalych przypadkach wynik identyczny).
//! - Kolejnosc `Object.entries/keys` = kolejnosc wstawiania (`HexRecord`); klucze "q,r" nie sa
//!   liczbami calkowitymi JS, wiec V8 nie przestawia ich na poczatek.
//! - `Math.*` w tym podzbiorze: brak (sama arytmetyka calkowita i porownania).
//! - Literaly danych (udzialy lądu, kolejnosc erozji) w `data/derived/mapgen-landsea.json`.

use std::collections::{HashMap, HashSet};

use crate::data::derived::{
    mapgen_coast, mapgen_desert_purge, mapgen_jagged_coast, mapgen_landmass, mapgen_landsea,
    mapgen_landsea_fill, mapgen_landsea_pangea, MapgenJaggedCoastFile,
};
use crate::domain::improvements::js_round;
use crate::domain::map_generator::{ClimateBand, Terrain, WorldType};
use crate::domain::mapgen::cluster_mass::js_array_sort_by;
use crate::domain::mapgen::masks::v8math::{js_hypot, js_max, js_min};
use crate::domain::mapgen::masks::{nearest_continent_zone_index, ContinentCenter};
use crate::domain::mapgen::prims::{
    climate_band_at, earth_template_land_at, fbm, hex_key, latitudinal_ocean_buffer_rows,
    HEX_DIRECTIONS, PERM_TABLE_LEN,
};
use crate::domain::mapgen::terrain_class::{
    apply_marginal_land_zone_caps, enforce_map_border_ocean, hash_int3, hex_border_distance,
    is_in_map_border, map_border_width, map_center_distance_norm, map_margin_land_zone_hexes,
    parse_hex_key, set_hex_to_laka, set_hex_to_morze, HexRecord, MarginZoneHooks, Nakladka,
    TerrainHex,
};
use crate::domain::recruitment::manpower::locale_compare;

/// Web `isWaterTerrainLocal` (gen-helpers.ts:152): Morze lub Plytkie Morze (Wybrzeze).
#[inline]
pub fn is_water_terrain_local(t: Terrain) -> bool {
    t.is_water()
}

/// Klucz "q,r" -> (q, r). `None` dla kluczy niekanonicznych (patrz ZALOZENIA).
pub fn key_qr(key: &str) -> Option<(i64, i64)> {
    let (a, b) = key.split_once(',')?;
    Some((a.parse().ok()?, b.parse().ok()?))
}

/// Web `isLandTerrain` (:3234): Laka/Rownina/Wzgorza/Pustynia (bez Gor i Polarny).
pub fn is_land_terrain(t: Terrain) -> bool {
    matches!(
        t,
        Terrain::Grassland | Terrain::Plains | Terrain::Hills | Terrain::Desert
    )
}

/// Web `isLandOrCoast` (:3249): zgodnie z reklasyfikacja Q1=A jest to negacja wody.
pub fn is_land_or_coast(t: Terrain) -> bool {
    !is_water_terrain_local(t)
}

/// Web `isDryLandTerrain` (:3882): suchy lad = nie woda.
pub fn is_dry_land_terrain(t: Terrain) -> bool {
    !is_water_terrain_local(t)
}

/// Web `defaultLandFractionForTyp` (:3254); wartosci z `mapgen-landsea.json`.
pub fn default_land_fraction_for_typ(typ: WorldType) -> f64 {
    let t = &mapgen_landsea().udzial_ladu_domyslny;
    match typ {
        WorldType::Pangea => t.pangea,
        WorldType::Islands => t.wyspy,
        WorldType::Earth => t.ziemia,
        WorldType::Continents => t.kontynenty,
    }
}

/// Wynik web `countLandSeaHexes` (:3268).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LandSeaCount {
    pub land: usize,
    pub sea: usize,
    pub total: usize,
}

/// Web `countLandSeaHexes` (:3268). Wybrzeze liczy sie jako woda.
pub fn count_land_sea_hexes(hexes: &HexRecord) -> LandSeaCount {
    let mut land = 0usize;
    let mut sea = 0usize;
    for (_, h) in hexes.iter() {
        if is_water_terrain_local(h.terrain) {
            sea += 1;
        } else {
            land += 1;
        }
    }
    LandSeaCount {
        land,
        sea,
        total: land + sea,
    }
}

/// Web `ERODE_TERRAIN_ORDER` (:3279) z `mapgen-landsea.json`.
fn erode_order() -> &'static [Terrain] {
    &mapgen_landsea().kolejnosc_erozji
}

/// Web `erodeTerrainRank` (:3288): pozycja w `ERODE_TERRAIN_ORDER`, a dla innych - dlugosc listy.
pub fn erode_terrain_rank(t: Terrain) -> usize {
    let order = erode_order();
    order.iter().position(|&x| x == t).unwrap_or(order.len())
}

fn neighbor(
    hexes: &HexRecord,
    q: i64,
    r: i64,
    dq: i32,
    dr: i32,
) -> Option<&crate::domain::mapgen::terrain_class::TerrainHex> {
    hexes.get(&hex_key(q + i64::from(dq), r + i64::from(dr)))
}

/// Web `countMorseNeighbors` (:3294): sasiedzi bedacy woda.
pub fn count_morse_neighbors(hexes: &HexRecord, q: i64, r: i64) -> usize {
    HEX_DIRECTIONS
        .iter()
        .filter(|&&(dq, dr)| {
            neighbor(hexes, q, r, dq, dr).is_some_and(|nh| is_water_terrain_local(nh.terrain))
        })
        .count()
}

/// Web `countLandNeighbors` (:3304): sasiedzi bedacy suchym lądem.
pub fn count_land_neighbors(hexes: &HexRecord, q: i64, r: i64) -> usize {
    HEX_DIRECTIONS
        .iter()
        .filter(|&&(dq, dr)| {
            neighbor(hexes, q, r, dq, dr).is_some_and(|nh| !is_water_terrain_local(nh.terrain))
        })
        .count()
}

/// Web `isCoastalLandHex` (:3313).
pub fn is_coastal_land_hex(hexes: &HexRecord, q: i64, r: i64) -> bool {
    match hexes.get(&hex_key(q, r)) {
        Some(h) if !is_water_terrain_local(h.terrain) => count_morse_neighbors(hexes, q, r) > 0,
        _ => false,
    }
}

/// Web `isCoastalMorseHex` (:3319).
pub fn is_coastal_morse_hex(hexes: &HexRecord, q: i64, r: i64) -> bool {
    match hexes.get(&hex_key(q, r)) {
        Some(h) if is_water_terrain_local(h.terrain) => count_land_neighbors(hexes, q, r) > 0,
        _ => false,
    }
}

/// Web `applyCoastRing` (:3894). Zwraca liczbe zamienionych heksow Morze -> Wybrzeze.
pub fn apply_coast_ring(hexes: &mut HexRecord) -> usize {
    let mut to_coast: Vec<String> = Vec::new();
    for (key, hex) in hexes.iter() {
        if hex.terrain != Terrain::Sea {
            continue;
        }
        let Some((q, r)) = key_qr(key) else { continue };
        let touches_land = HEX_DIRECTIONS.iter().any(|&(dq, dr)| {
            neighbor(hexes, q, r, dq, dr).is_some_and(|nb| is_dry_land_terrain(nb.terrain))
        });
        if touches_land {
            to_coast.push(key.clone());
        }
    }
    for key in &to_coast {
        if let Some(h) = hexes.get_mut(key) {
            h.terrain = Terrain::ShallowSea;
            h.overlay = crate::domain::mapgen::terrain_class::Nakladka::Brak;
            h.has_deposit = false;
        }
    }
    to_coast.len()
}

/// Web `applyDoubleCoastRing` (:3923): pierwszy pierscien + Morze graniczace z (nowym) Wybrzezem.
pub fn apply_double_coast_ring(hexes: &mut HexRecord) -> usize {
    let n = apply_coast_ring(hexes);
    let mut to_coast: Vec<String> = Vec::new();
    for (key, hex) in hexes.iter() {
        if hex.terrain != Terrain::Sea {
            continue;
        }
        let Some((q, r)) = key_qr(key) else { continue };
        let touches_coast = HEX_DIRECTIONS.iter().any(|&(dq, dr)| {
            neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::ShallowSea)
        });
        if touches_coast {
            to_coast.push(key.clone());
        }
    }
    for key in &to_coast {
        if let Some(h) = hexes.get_mut(key) {
            h.terrain = Terrain::ShallowSea;
            h.overlay = crate::domain::mapgen::terrain_class::Nakladka::Brak;
            h.has_deposit = false;
        }
    }
    n + to_coast.len()
}

/// Web `findDryLandTouchingSea` (:3949): klucze suchego lądu stykajacego sie z Morzem.
pub fn find_dry_land_touching_sea(hexes: &HexRecord) -> Vec<String> {
    let mut bad = Vec::new();
    for (key, hex) in hexes.iter() {
        if !is_dry_land_terrain(hex.terrain) {
            continue;
        }
        let Some((q, r)) = key_qr(key) else { continue };
        let touches_sea = HEX_DIRECTIONS.iter().any(|&(dq, dr)| {
            neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::Sea)
        });
        if touches_sea {
            bad.push(key.clone());
        }
    }
    bad
}

/// Web `sanitizeCoastHexes` (:3975): sieroty Wybrzeza (bez lancucha do lądu) cofa do Morza.
/// Zwraca liczbe naprawionych heksow.
pub fn sanitize_coast_hexes(hexes: &mut HexRecord) -> usize {
    let mut valid: HashSet<String> = HashSet::new();
    let mut queue: Vec<String> = Vec::new();

    for (key, hex) in hexes.iter() {
        if hex.terrain != Terrain::ShallowSea {
            continue;
        }
        let Some((q, r)) = key_qr(key) else { continue };
        let touches_land = HEX_DIRECTIONS.iter().any(|&(dq, dr)| {
            neighbor(hexes, q, r, dq, dr).is_some_and(|nb| is_dry_land_terrain(nb.terrain))
        });
        if touches_land {
            valid.insert(key.clone());
            queue.push(key.clone());
        }
    }

    while let Some(key) = queue.pop() {
        let Some((q, r)) = key_qr(&key) else { continue };
        for &(dq, dr) in HEX_DIRECTIONS.iter() {
            let nk = hex_key(q + i64::from(dq), r + i64::from(dr));
            if valid.contains(&nk) {
                continue;
            }
            if hexes
                .get(&nk)
                .is_some_and(|nh| nh.terrain == Terrain::ShallowSea)
            {
                valid.insert(nk.clone());
                queue.push(nk);
            }
        }
    }

    let orphans: Vec<String> = hexes
        .iter()
        .filter(|(key, hex)| hex.terrain == Terrain::ShallowSea && !valid.contains(key.as_str()))
        .map(|(key, _)| key.clone())
        .collect();
    for key in &orphans {
        if let Some(h) = hexes.get_mut(key) {
            set_hex_to_morze(h);
        }
    }
    orphans.len()
}

/// Web `oceanConnectedWaterKeys` (:4026): woda polaczona z krawedzia mapy (BFS po wodzie).
pub fn ocean_connected_water_keys(hexes: &HexRecord, width: i64, height: i64) -> HashSet<String> {
    ocean_connected_by(hexes, width, height, is_water_terrain_local)
}

/// Web `oceanConnectedMorseKeys` (:4063, prywatna): Morze (bez Wybrzeza) polaczone z krawedzia.
pub fn ocean_connected_morse_keys(hexes: &HexRecord, width: i64, height: i64) -> HashSet<String> {
    ocean_connected_by(hexes, width, height, |t| t == Terrain::Sea)
}

fn ocean_connected_by(
    hexes: &HexRecord,
    width: i64,
    height: i64,
    pred: impl Fn(Terrain) -> bool,
) -> HashSet<String> {
    let mut connected: HashSet<String> = HashSet::new();
    let mut queue: Vec<String> = Vec::new();

    for r in 0..height {
        for q in 0..width {
            if q != 0 && r != 0 && q != width - 1 && r != height - 1 {
                continue;
            }
            let key = hex_key(q, r);
            let Some(hex) = hexes.get(&key) else { continue };
            if !pred(hex.terrain) {
                continue;
            }
            connected.insert(key.clone());
            queue.push(key);
        }
    }

    while let Some(key) = queue.pop() {
        let Some((q, r)) = key_qr(&key) else { continue };
        for &(dq, dr) in HEX_DIRECTIONS.iter() {
            let nk = hex_key(q + i64::from(dq), r + i64::from(dr));
            let Some(nh) = hexes.get(&nk) else { continue };
            if !pred(nh.terrain) || connected.contains(&nk) {
                continue;
            }
            connected.insert(nk.clone());
            queue.push(nk);
        }
    }
    connected
}

/// Web `findInlandWaterHexes` (:4109): woda nie polaczona z oceanem.
pub fn find_inland_water_hexes(hexes: &HexRecord, width: i64, height: i64) -> Vec<String> {
    let ocean = ocean_connected_water_keys(hexes, width, height);
    hexes
        .iter()
        .filter(|(k, h)| is_water_terrain_local(h.terrain) && !ocean.contains(k.as_str()))
        .map(|(k, _)| k.clone())
        .collect()
}

/// Web `findInlandSeaHexes` (:4123): Morze nie polaczone z oceanem.
pub fn find_inland_sea_hexes(hexes: &HexRecord, width: i64, height: i64) -> Vec<String> {
    let ocean = ocean_connected_morse_keys(hexes, width, height);
    hexes
        .iter()
        .filter(|(k, h)| h.terrain == Terrain::Sea && !ocean.contains(k.as_str()))
        .map(|(k, _)| k.clone())
        .collect()
}

/// Web `removeInlandWaterPools` (:4137): woda bez polaczenia z oceanem -> Laka (`setHexToLaka`).
/// Zwraca liczbe zamienionych heksow (= liczba wykrytych heksow inlandowych).
pub fn remove_inland_water_pools(hexes: &mut HexRecord, width: i64, height: i64) -> usize {
    let inland = find_inland_water_hexes(hexes, width, height);
    for key in &inland {
        if let Some(h) = hexes.get_mut(key) {
            set_hex_to_laka(h);
        }
    }
    inland.len()
}

/// Web `fillEnclosedWaterByLandNeighbors` (:4189): woda z >= `min_land` suchymi sasiadami -> Laka.
/// Do 8 przebiegow po kluczach w kolejnosci wstawiania; kazdy odczyt sasiadow widzi zmiany
/// poprzednich heksow (jak w JS, gdzie `hexes[key]` jest czytany na biezaco).
/// Web `minLandNeighbors = 5` jest domyslnym argumentem wywolujacego (brak literalu tutaj).
pub fn fill_enclosed_water_by_land_neighbors(hexes: &mut HexRecord, min_land: usize) -> usize {
    let mut total = 0usize;
    for _pass in 0..FILL_ENCLOSED_MAX_PASSES {
        let keys: Vec<String> = hexes.iter().map(|(k, _)| k.clone()).collect();
        let mut n = 0usize;
        for key in &keys {
            let Some(hex) = hexes.get(key) else { continue };
            if !is_water_terrain_local(hex.terrain) {
                continue;
            }
            let Some((q, r)) = key_qr(key) else { continue };
            if count_land_neighbors(hexes, q, r) < min_land {
                continue;
            }
            // Web: `rzeka = { obecna: false, krawedzie: [] }` (:4204) - w odroznieniu od setHexToLaka.
            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_laka(h);
                h.river_present = false;
                h.river_edges.clear();
            }
            n += 1;
        }
        total += n;
        if n == 0 {
            break;
        }
    }
    total
}

/// Web `fill...` pętla `for (let pass = 0; pass < 8; pass++)` (:4194): limit przebiegów.
const FILL_ENCLOSED_MAX_PASSES: usize = 8;

/// Web `removeSmallInlandWaterPools` (:4276): spojne skladowe wody inlandowej o rozmiarze
/// `> max_pool_size` zostaja; mniejsze (`<= max_pool_size`) -> Laka. Laczenie 6-kierunkowe.
pub fn remove_small_inland_water_pools(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    max_pool_size: usize,
) -> usize {
    let inland: Vec<String> = find_inland_water_hexes(hexes, width, height);
    let inland_set: HashSet<String> = inland.iter().cloned().collect();
    let mut visited: HashSet<String> = HashSet::new();
    let mut converted = 0usize;

    for start in &inland {
        if visited.contains(start) {
            continue;
        }
        let mut comp: Vec<String> = Vec::new();
        let mut stack: Vec<String> = vec![start.clone()];
        visited.insert(start.clone());
        while let Some(key) = stack.pop() {
            let Some((q, r)) = key_qr(&key) else {
                comp.push(key);
                continue;
            };
            comp.push(key);
            for &(dq, dr) in HEX_DIRECTIONS.iter() {
                let nk = hex_key(q + i64::from(dq), r + i64::from(dr));
                if !inland_set.contains(&nk) || visited.contains(&nk) {
                    continue;
                }
                visited.insert(nk.clone());
                stack.push(nk);
            }
        }
        if comp.len() > max_pool_size {
            continue;
        }
        for key in &comp {
            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_laka(h);
                converted += 1;
            }
        }
    }
    converted
}

/// Web `removeInlandSeaPools` (:4320): alias `removeInlandWaterPools` (Morze + Wybrzeze).
pub fn remove_inland_sea_pools(hexes: &mut HexRecord, width: i64, height: i64) -> usize {
    remove_inland_water_pools(hexes, width, height)
}

// ---------------------------------------------------------------------------
// P6.M06A3 (runda 1, partia 1). Symbole: `enforceLatitudinalOceanBuffer` (web :3339),
// `climateBandBaseTerrain` (:3360, prywatna), `applyClimateBandsToHexes` (:3380),
// `enforceEarthTemplateOnHexes` (:3418). Wektory: tests/p6_m06a3_vectors (generator
// `gen-m06a3-vectors.mjs`, pin edb8fb56). Progi 0.5/0.7/0.85 sa literalami galezi z kodu webu.
// ---------------------------------------------------------------------------

/// Web `enforceLatitudinalOceanBuffer` (:3339): wiersze poza buforem `[buf, height-buf)` -> Morze
/// (`setHexToMorze`). Pomija Morze i brakujace klucze. Zwraca liczbe zmienionych heksow.
pub fn enforce_latitudinal_ocean_buffer(
    hexes: &mut HexRecord,
    width: u32,
    height: u32,
    is_earth: bool,
) -> usize {
    let buf = i64::from(latitudinal_ocean_buffer_rows(height, is_earth));
    let h = i64::from(height);
    let mut converted = 0usize;
    for r in 0..h {
        if r >= buf && r < h - buf {
            continue;
        }
        for q in 0..i64::from(width) {
            let key = hex_key(q, r);
            if let Some(hex) = hexes.get_mut(&key) {
                if hex.terrain == Terrain::Sea {
                    continue;
                }
                set_hex_to_morze(hex);
                converted += 1;
            }
        }
    }
    converted
}

/// Web `climateBandBaseTerrain(band, q, r, seed)` (:3360, prywatna): teren bazowy pasma,
/// losowany przez `hashInt3(q, r, seed)`. Pasma polarne -> `Polarny` bez hashowania.
pub fn climate_band_base_terrain(band: ClimateBand, q: i64, r: i64, seed: f64) -> Terrain {
    if band.is_polar() {
        return Terrain::Polar;
    }
    climate_base_from_hash(band, hash_int3(q as f64, r as f64, seed))
}

/// Galaz wyboru terenu z `climateBandBaseTerrain` dla gotowego hasha `h` (web :3360-3378).
/// Wydzielone, zeby progi (`h < 0.5 / 0.7 / 0.85`) dalo sie testowac na N-1/N/N+1 bez hashowania.
pub fn climate_base_from_hash(band: ClimateBand, h: f64) -> Terrain {
    match band {
        ClimateBand::PolarNorth | ClimateBand::PolarSouth => Terrain::Polar,
        ClimateBand::Desert => {
            if h < 0.5 {
                Terrain::Desert
            } else {
                Terrain::Plains
            }
        }
        ClimateBand::PlainsNorth | ClimateBand::PlainsSouth => {
            if h < 0.7 {
                Terrain::Plains
            } else {
                Terrain::Grassland
            }
        }
        ClimateBand::TemperateNorth | ClimateBand::TemperateSouth => {
            if h < 0.85 {
                Terrain::Grassland
            } else {
                Terrain::Plains
            }
        }
    }
}

/// Web `applyClimateBandsToHexes(hexes, height, seed, isEarth)` (:3380): na ladzie (bez wody,
/// Gor i Wzgorz) ustawia teren pasma. Zmiana na Polarny/Pustynie czysci nakladke i zloze;
/// heks juz Polarny z nakladka jest czyszczony w tej samej galezi. Zwraca liczbe zmian.
pub fn apply_climate_bands_to_hexes(
    hexes: &mut HexRecord,
    height: u32,
    seed: f64,
    is_earth: bool,
) -> usize {
    let mut n = 0usize;
    for (key, hex) in hexes.iter_mut() {
        let Some((q, r)) = key_qr(key) else {
            continue;
        };
        let tb = hex.terrain;
        if tb.is_water() || tb == Terrain::Mountains || tb == Terrain::Hills {
            continue;
        }
        let band = climate_band_at(r, height, is_earth);
        let want = climate_band_base_terrain(band, q, r, seed);
        if tb != want {
            hex.terrain = want;
            if want == Terrain::Polar || want == Terrain::Desert {
                hex.overlay = Nakladka::Brak;
                hex.has_deposit = false;
            }
            n += 1;
        } else if want == Terrain::Polar && hex.overlay != Nakladka::Brak {
            hex.overlay = Nakladka::Brak;
            hex.has_deposit = false;
            n += 1;
        }
    }
    n
}

/// Web `enforceEarthTemplateOnHexes(hexes, width, height)` (:3418): poza maska szablonu Ziemi
/// (`earthTemplateLandAt == 0`) kazdy nie-Morze heks -> Morze (`setHexToMorze`). Zwraca liczbe zmian.
pub fn enforce_earth_template_on_hexes(hexes: &mut HexRecord, width: u32, height: u32) -> usize {
    let mut fixed = 0usize;
    for (key, hex) in hexes.iter_mut() {
        let Some((q, r)) = key_qr(key) else {
            continue;
        };
        if earth_template_land_at(q, r, width, height) > 0.0 {
            continue;
        }
        if hex.terrain == Terrain::Sea {
            continue;
        }
        set_hex_to_morze(hex);
        fixed += 1;
    }
    fixed
}

// ---------------------------------------------------------------------------
// P6.M06A4 (runda 1, partia 2). Symbol: `purgeDesertEnclaveWater` (web :4156). Progi:
// `mapgen-desert-purge.json` (`prog_pustyni_min_liczba` = 2, `prog_pustyni_min_ulamek_suchych` = 0.4).
// Wektory: tests/p6_m06a4_vectors (generator `gen-m06a4-vectors.mjs`, pin edb8fb56).
// ---------------------------------------------------------------------------

/// Web `purgeDesertEnclaveWater(hexes, width, height)` (:4156): kazdy heks inlandowej wody
/// (`findInlandWaterHexes`) staje sie Pustynia, gdy srodek lezy w pasmie `desert`
/// (`climateBandAt(q, r, height)`, isEarth=false) i `pustN >= prog_liczba` albo
/// `dryN > 0 && pustN >= dryN * prog_ulamek`; w pozostalych przypadkach Laka. Zawsze czysci
/// nakladke, rzeke i zloze (jak web). Liczniki sasiadow czytane na biezaco. Zwraca liczbe heksow
/// przetworzonych (= wykrytych inlandowych).
/// Klucz niekanoniczny (bez `q,r`) jest pomijany przy iteracji (Z-1 jak w M06A/M06A2/M06A3).
pub fn purge_desert_enclave_water(hexes: &mut HexRecord, width: i64, height: u32) -> usize {
    let progi = mapgen_desert_purge();
    let inland = find_inland_water_hexes(hexes, width, i64::from(height));
    let mut converted = 0usize;
    for key in &inland {
        let Some((q, r)) = key_qr(key) else {
            continue;
        };
        let mut pust_n: u64 = 0;
        let mut dry_n: u64 = 0;
        for &(dq, dr) in HEX_DIRECTIONS.iter() {
            let Some(nh) = neighbor(hexes, q, r, dq, dr) else {
                continue;
            };
            if is_water_terrain_local(nh.terrain) {
                continue;
            }
            dry_n += 1;
            if nh.terrain == Terrain::Desert {
                pust_n += 1;
            }
        }
        let in_desert = climate_band_at(r, height, false) == ClimateBand::Desert;
        let progowo = pust_n >= progi.prog_pustyni_min_liczba
            || (dry_n > 0
                && (pust_n as f64) >= (dry_n as f64) * progi.prog_pustyni_min_ulamek_suchych);
        let nowy = if in_desert && progowo {
            Terrain::Desert
        } else {
            Terrain::Grassland
        };
        if let Some(h) = hexes.get_mut(key) {
            h.terrain = nowy;
            h.overlay = Nakladka::Brak;
            h.river_present = false;
            h.river_edges.clear();
            h.has_deposit = false;
        }
        converted += 1;
    }
    converted
}

// ---------------------------------------------------------------------------
// P6.M06A4 (runda 3, partia 3). Symbole: `morseDepthFromMapBorder` (web :4659),
// `trimEnclosedOceanOnly` (:4701), `purgeInlandWaterForMultiLandTyp` (:4215).
// Wektory: tests/p6_m06a4_vectors/trim-vectors.json (generator `gen-m06a4-trim-vectors.mjs`,
// pin edb8fb56, seed 20261030). Zaleznosci (`fillEnclosedWaterByLandNeighbors`,
// `removeInlandWaterPools`) juz w tym pliku.
// ---------------------------------------------------------------------------

/// Progi wywolan `fillEnclosedWaterByLandNeighbors` w `purgeInlandWaterForMultiLandTyp` (web :4218, :4221):
/// argumenty `5` i `4` (nie dane z JSON). Stale galezi, jak progi M06A3.
const PURGE_INLAND_FILL_MIN_LAND_A: usize = 5;
const PURGE_INLAND_FILL_MIN_LAND_B: usize = 4;

/// Web `morseDepthFromMapBorder(hexes, width, height)` (:4659): BFS po Morzu (bez Wybrzeza) od
/// morskich heksow lezacych na krawedzi mapy. Zwraca odleglosc w krokach dla heksow osiagalnych;
/// heksy nieosiagalne z krawedzi NIE sa w wyniku (web: `undefined`). Sasiedzi z kluczem spoza mapy
/// (brak wpisu) sa pomijani. Klucze niekanoniczne nie sa osiagalne (web: `hexKey` nigdy ich nie buduje).
pub fn morse_depth_from_map_border(
    hexes: &HexRecord,
    width: i64,
    height: i64,
) -> HashMap<String, usize> {
    let mut dist: HashMap<String, usize> = HashMap::new();
    let mut queue: Vec<(i64, i64)> = Vec::new();

    for r in 0..height {
        for q in 0..width {
            let on_border = q == 0 || r == 0 || q == width - 1 || r == height - 1;
            if !on_border {
                continue;
            }
            let key = hex_key(q, r);
            if hexes.get(&key).is_some_and(|h| h.terrain == Terrain::Sea) {
                dist.insert(key, 0);
                queue.push((q, r));
            }
        }
    }

    let mut head = 0usize;
    while head < queue.len() {
        let (q, r) = queue[head];
        head += 1;
        let d = dist[&hex_key(q, r)];
        for &(dq, dr) in HEX_DIRECTIONS.iter() {
            let nq = q + i64::from(dq);
            let nr = r + i64::from(dr);
            let nk = hex_key(nq, nr);
            if dist.contains_key(&nk) {
                continue;
            }
            if !hexes.get(&nk).is_some_and(|nh| nh.terrain == Terrain::Sea) {
                continue;
            }
            dist.insert(nk, d + 1);
            queue.push((nq, nr));
        }
    }
    dist
}

/// Web `trimEnclosedOceanOnly(hexes, width, height)` (:4701): kazdy Morze, ktorego nie ma w wyniku
/// `morseDepthFromMapBorder`, -> Laka (nakladka, rzeka i zloze czyszczone jak w webie).
/// Iteracja po wszystkich wpisach (takze niekanonicznych, jak `Object.entries`). Zwraca liczbe zmian.
pub fn trim_enclosed_ocean_only(hexes: &mut HexRecord, width: i64, height: i64) -> usize {
    let depth = morse_depth_from_map_border(hexes, width, height);
    let mut converted = 0usize;
    for (key, hex) in hexes.iter_mut() {
        if hex.terrain != Terrain::Sea {
            continue;
        }
        if depth.contains_key(key.as_str()) {
            continue;
        }
        hex.terrain = Terrain::Grassland;
        hex.overlay = Nakladka::Brak;
        hex.river_present = false;
        hex.river_edges.clear();
        hex.has_deposit = false;
        converted += 1;
    }
    converted
}

/// Web `purgeInlandWaterForMultiLandTyp(hexes, width, height)` (:4215): agresywne czyszczenie wody
/// w lądzie (kontynenty/wyspy, nie pangea): fill(5) -> removeInland -> trimEnclosedOcean ->
/// fill(4) -> removeInland. Zwraca sume zmian wszystkich krokow (jak web).
pub fn purge_inland_water_for_multi_land_typ(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
) -> usize {
    let mut n = fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_A);
    n += remove_inland_water_pools(hexes, width, height);
    n += trim_enclosed_ocean_only(hexes, width, height);
    n += fill_enclosed_water_by_land_neighbors(hexes, PURGE_INLAND_FILL_MIN_LAND_B);
    n += remove_inland_water_pools(hexes, width, height);
    n
}

// ---------------------------------------------------------------------------
// P6.M06A4 (runda 3, partia 3b). Symbol: `applyJaggedCoastNoise` (web :4232). Parametry szumu i progi:
// `mapgen-jagged-coast.json`. Wektory: tests/p6_m06a4_vectors/jagged-vectors.json (generator
// `gen-m06a4-jagged-vectors.mjs`; perm = `buildPermTable(mulberry32(seed))` z weba).
// ---------------------------------------------------------------------------

/// Web `coast > prog` (:4247, prog erozji lądu przy morzu): decyzja porownania, wydzielona do testow
/// granicznych N-1/N/N+1.
#[inline]
pub fn jagged_erode_decision(coast: f64, prog: f64) -> bool {
    coast > prog
}

/// Web `coast < prog` (:4251, prog wypelnienia morza przy lądzie).
#[inline]
pub fn jagged_fill_decision(coast: f64, prog: f64) -> bool {
    coast < prog
}

/// Wartosc szumu `coast = coarse + fine` dla heksu `(q, r)` w przebiegu `pass` (web :4240-4243).
/// Kolejnosc dzialan jak w JS: `q * noiseScale * 2.1 + 200` = `((q * s) * m) + p`.
pub fn jagged_coast_value(
    perm: &[u8; PERM_TABLE_LEN],
    q: i64,
    r: i64,
    pass: u32,
    t: &MapgenJaggedCoastFile,
) -> f64 {
    let qf = q as f64;
    let rf = r as f64;
    let pass_f = f64::from(pass);
    let s = t.skala_szumu;
    let coarse = fbm(
        perm,
        qf * s + pass_f * t.przesuniecie_przebiegu_x,
        rf * s + pass_f * t.przesuniecie_przebiegu_y,
        t.oktawy_grubej_skali,
    );
    let fine = fbm(
        perm,
        qf * s * t.mnoznik_drobnej_skali + t.przesuniecie_drobnej_skali,
        rf * s * t.mnoznik_drobnej_skali + t.przesuniecie_drobnej_skali,
        t.oktawy_drobnej_skali,
    ) * t.waga_drobnej_skali;
    coarse + fine
}

/// Web `applyJaggedCoastNoise(hexes, perm, width, height, passes)` (:4232): `passes` przebiegow.
/// W kazdym przebiegu decyzje zbierane sa przed zmianami (jak web): heks ladu przy morzu z
/// `coast > prog_erozji` -> Morze, heks morza przy ladzie z `coast < prog_wypelnienia` -> Laka.
/// Heksy w buforze krawedzi (`isInMapBorder`, domyslny bufor) pomijane. Zwraca liczbe zmian.
pub fn apply_jagged_coast_noise(
    hexes: &mut HexRecord,
    perm: &[u8; PERM_TABLE_LEN],
    width: i64,
    height: i64,
    passes: u32,
) -> usize {
    let t = mapgen_jagged_coast();
    let mut changed = 0usize;
    for pass in 0..passes {
        let mut to_erode: Vec<String> = Vec::new();
        let mut to_fill: Vec<String> = Vec::new();
        for r in 0..height {
            for q in 0..width {
                if is_in_map_border(q as f64, r as f64, width as f64, height as f64, None) {
                    continue;
                }
                let key = hex_key(q, r);
                let Some(hex) = hexes.get(&key) else {
                    continue;
                };
                let coast = jagged_coast_value(perm, q, r, pass, t);
                if hex.terrain != Terrain::Sea && is_coastal_land_hex(hexes, q, r) {
                    if jagged_erode_decision(coast, t.prog_erozji_lad) {
                        to_erode.push(key);
                    }
                } else if hex.terrain == Terrain::Sea
                    && is_coastal_morse_hex(hexes, q, r)
                    && jagged_fill_decision(coast, t.prog_wypelnienia_morze)
                {
                    to_fill.push(key);
                }
            }
        }
        for key in &to_erode {
            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_morze(h);
                changed += 1;
            }
        }
        for key in &to_fill {
            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_laka(h);
                changed += 1;
            }
        }
    }
    changed
}

// ---------------------------------------------------------------------------------------------
// P6.M06A5 (R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1), partia 1: rodzina ulamka lądu.
// Progi i tolerancje z `data/derived/mapgen-landsea-fill.json`; sortowanie przez `js_array_sort_by`
// (TimSort V8), bo komparatory webu sa niekoherentne (tolerancje 0.015 / 0.04).
// ---------------------------------------------------------------------------------------------

/// Web `LandFractionFillBias` (:3435): `Center` = wypelnij od srodka; `Mask` = ranking maski.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LandFractionFillBias {
    Center,
    Mask,
}

/// Web `assignContinentIndices(width, height, centers)` (:3186). Pary `(klucz, indeks)` w kolejnosci
/// wstawiania (jak `Map` w webie).
pub fn assign_continent_indices(
    width: u32,
    height: u32,
    centers: &[ContinentCenter],
) -> Vec<(String, usize)> {
    let mut out = Vec::with_capacity(width as usize * height as usize);
    let dw = f64::from(width.saturating_sub(1).max(1));
    let dh = f64::from(height.saturating_sub(1).max(1));
    for r in 0..height {
        for q in 0..width {
            let nq = f64::from(q) / dw;
            let nr = f64::from(r) / dh;
            out.push((
                hex_key(i64::from(q), i64::from(r)),
                nearest_continent_zone_index(nq, nr, centers),
            ));
        }
    }
    out
}

/// Klucz "q,r" -> (q, r); niekanoniczny klucz = (0,0) (ZALOZENIA: klucze generatora sa kanoniczne).
fn key_qr_or_origin(key: &str) -> (i64, i64) {
    key_qr(key).unwrap_or((0, 0))
}

/// Web `sortLandKeysForErosion(keys, hexes, landScores, width, height)` (:3207, prywatna).
/// Zwraca nowy wektor (web `[...keys].sort`).
pub fn sort_land_keys_for_erosion(
    keys: &[String],
    hexes: &HexRecord,
    land_scores: &HashMap<String, f64>,
    width: i64,
    height: i64,
) -> Vec<String> {
    let tol = mapgen_landsea_fill().tolerancja_odleglosci_centrum;
    let (wf, hf) = (width as f64, height as f64);
    let mut items: Vec<String> = keys.to_vec();
    js_array_sort_by(&mut items, |a, b| {
        let (qa, ra) = key_qr_or_origin(a);
        let (qb, rb) = key_qr_or_origin(b);
        let ba = hex_border_distance(qa as f64, ra as f64, wf, hf);
        let bb = hex_border_distance(qb as f64, rb as f64, wf, hf);
        if ba != bb {
            return ba - bb;
        }
        let ca = map_center_distance_norm(qa as f64, ra as f64, wf, hf);
        let cb = map_center_distance_norm(qb as f64, rb as f64, wf, hf);
        if (ca - cb).abs() > tol {
            return cb - ca;
        }
        let na = count_morse_neighbors(hexes, qa, ra) as f64;
        let nb = count_morse_neighbors(hexes, qb, rb) as f64;
        if na != nb {
            return nb - na;
        }
        let rka = hexes
            .get(a)
            .map_or(erode_order().len(), |h| erode_terrain_rank(h.terrain));
        let rkb = hexes
            .get(b)
            .map_or(erode_order().len(), |h| erode_terrain_rank(h.terrain));
        if rka != rkb {
            return rka as f64 - rkb as f64;
        }
        land_scores.get(a).copied().unwrap_or(0.0) - land_scores.get(b).copied().unwrap_or(0.0)
    });
    items
}

/// Hooki `applyMarginalLandZoneCaps` (terrain_class) -> `sort_land_keys_for_erosion` z tego modulu.
struct LandseaMarginHooks;

impl MarginZoneHooks for LandseaMarginHooks {
    fn sort_land_keys_for_erosion(
        &self,
        keys: &[String],
        hexes: &HexRecord,
        land_scores: &HashMap<String, f64>,
        width: i64,
        height: i64,
    ) -> Vec<String> {
        sort_land_keys_for_erosion(keys, hexes, land_scores, width, height)
    }
}

/// Web `applyLandFractionByScore(hexes, landScores, target, width?, height?, fillBias, minMaskFillScore)`
/// (:3444). `dims` = `(width, height)` albo `None` (web `undefined`); granica aktywna gdy oba > 0.
/// Zwraca liczbe zmian.
pub fn apply_land_fraction_by_score(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    target_land_fraction: f64,
    dims: Option<(i64, i64)>,
    fill_bias: LandFractionFillBias,
    min_mask_fill_score: f64,
) -> usize {
    let fill = mapgen_landsea_fill();
    let clamped = target_land_fraction.clamp(fill.clamp_udzialu_min, fill.clamp_udzialu_max);
    if clamped.is_nan() {
        return 0; // web: porownania z NaN sa falszywe, brak zmian
    }
    let keys: Vec<String> = hexes.keys().cloned().collect();
    let total = keys.len();
    let target_land = js_round(total as f64 * clamped) as i64;
    let mut land = count_land_sea_hexes(hexes).land as i64;
    let mut adjusted = 0usize;

    let has_border = dims.is_some_and(|(w, h)| w > 0 && h > 0);
    let (wf, hf) = dims.map_or((0.0, 0.0), |(w, h)| (w as f64, h as f64));
    // web: `width ?? 1` przy sortowaniu, takze gdy brak granicy
    let (sort_w, sort_h) = dims.unwrap_or((1, 1));
    let border_ok = |k: &str| {
        if !has_border {
            return true;
        }
        let (q, r) = key_qr_or_origin(k);
        !is_in_map_border(q as f64, r as f64, wf, hf, None)
    };
    let interior_ok = |k: &str| {
        if !has_border {
            return true;
        }
        let (q, r) = key_qr_or_origin(k);
        hex_border_distance(q as f64, r as f64, wf, hf) > map_margin_land_zone_hexes()
    };
    let score = |k: &str| land_scores.get(k).copied().unwrap_or(0.0);
    let is_sea =
        |hexes: &HexRecord, k: &str| hexes.get(k).is_some_and(|h| h.terrain == Terrain::Sea);
    let mask_ok =
        |k: &str| fill_bias != LandFractionFillBias::Mask || score(k) >= min_mask_fill_score;

    if land < target_land {
        // Wzrost lądu bierze WYLACZNIE z czystego Morza (nie z PlytkieMorze), jak web.
        let mut candidates: Vec<String> = keys
            .iter()
            .filter(|k| is_sea(hexes, k) && border_ok(k) && mask_ok(k))
            .cloned()
            .collect();
        js_array_sort_by(&mut candidates, |a, b| {
            let sa = score(a);
            let sb = score(b);
            if (sb - sa).abs() > fill.tolerancja_score_sortowanie {
                return sb - sa;
            }
            if fill_bias == LandFractionFillBias::Mask {
                return f64::from(locale_compare(a, b));
            }
            let (qa, ra) = key_qr_or_origin(a);
            let (qb, rb) = key_qr_or_origin(b);
            let da = if has_border {
                map_center_distance_norm(qa as f64, ra as f64, wf, hf)
            } else {
                0.0
            };
            let db = if has_border {
                map_center_distance_norm(qb as f64, rb as f64, wf, hf)
            } else {
                0.0
            };
            da - db
        });
        for k in &candidates {
            if land >= target_land {
                break;
            }
            if let Some(h) = hexes.get_mut(k) {
                set_hex_to_laka(h);
            }
            land += 1;
            adjusted += 1;
        }
        if land < target_land && has_border {
            // Drugi przebieg: morze wewnetrzne (poza strefa brzegowa), stan po pierwszym przebiegu.
            let mut interior: Vec<String> = keys
                .iter()
                .filter(|k| is_sea(hexes, k) && interior_ok(k) && mask_ok(k))
                .cloned()
                .collect();
            js_array_sort_by(&mut interior, |a, b| score(b) - score(a));
            for k in &interior {
                if land >= target_land {
                    break;
                }
                if let Some(h) = hexes.get_mut(k) {
                    set_hex_to_laka(h);
                }
                land += 1;
                adjusted += 1;
            }
        }
    } else if land > target_land {
        let dry: Vec<String> = keys
            .iter()
            .filter(|k| hexes.get(k).is_some_and(|h| is_dry_land_terrain(h.terrain)))
            .cloned()
            .collect();
        let cands = sort_land_keys_for_erosion(&dry, hexes, land_scores, sort_w, sort_h);
        for k in &cands {
            if land <= target_land {
                break;
            }
            if let Some(h) = hexes.get_mut(k) {
                set_hex_to_morze(h);
            }
            land -= 1;
            adjusted += 1;
        }
    }
    adjusted
}

/// Web `rebalanceLandFractionWithMargins(hexes, landScores, target, width, height)` (:3532):
/// dwa przebiegi: ulamek -> limity strefy brzegowej -> ocean przy krawedzi; na koncu
/// `applyDoubleCoastRing` (:3923, port M06A).
pub fn rebalance_land_fraction_with_margins(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    target_land_fraction: f64,
    width: i64,
    height: i64,
) {
    let fill_min = mapgen_landsea_fill().pangea_min_score_wypelnienia;
    let hooks = LandseaMarginHooks;
    for _ in 0..2 {
        apply_land_fraction_by_score(
            hexes,
            land_scores,
            target_land_fraction,
            Some((width, height)),
            LandFractionFillBias::Center,
            fill_min,
        );
        apply_marginal_land_zone_caps(hexes, land_scores, width, height, &hooks);
        enforce_map_border_ocean(hexes, width, height, None);
    }
    apply_double_coast_ring(hexes);
}

// ---------------------------------------------------------------------------------------------
// P6.M06A6 (R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1), partia 1: rodzina Pangei i kontynentow.
// Progi i szum z `data/derived/mapgen-landsea-pangea.json` (`mapgen_landsea_pangea()`).
// ---------------------------------------------------------------------------------------------

/// Suche heksy lądu (web `Object.keys(hexes).filter(isDryLandTerrain)`), w kolejnosci wstawiania.
fn dry_land_keys(hexes: &HexRecord) -> Vec<String> {
    hexes
        .iter()
        .filter(|(_, h)| is_dry_land_terrain(h.terrain))
        .map(|(k, _)| k.clone())
        .collect()
}

/// Web `erodePangeaBboxLowScoreRim(hexes, landScores, targetBboxFill, maxErode)` (:3551, prywatna).
/// Domyslne wartosci webu (0.74, 1200) podaje wywolujacy; `mapgen-landsea-pangea.json` ma je jako dane.
/// Zwraca liczbe zerodowanych heksow.
pub fn erode_pangea_bbox_low_score_rim(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    target_bbox_fill: f64,
    max_erode: usize,
) -> usize {
    let p = mapgen_landsea_pangea();
    let land_keys = dry_land_keys(hexes);
    if land_keys.is_empty() {
        return 0;
    }

    let (mut q_min, mut q_max) = (f64::INFINITY, f64::NEG_INFINITY);
    let (mut r_min, mut r_max) = (f64::INFINITY, f64::NEG_INFINITY);
    for k in &land_keys {
        let (q, r) = parse_hex_key(k);
        q_min = js_min(q_min, q);
        q_max = js_max(q_max, q);
        r_min = js_min(r_min, r);
        r_max = js_max(r_max, r);
    }
    let bbox_area = js_max(1.0, (q_max - q_min + 1.0) * (r_max - r_min + 1.0));
    let mut land_count = land_keys.len() as f64;
    let mut bbox_fill = land_count / bbox_area;
    if bbox_fill <= target_bbox_fill {
        return 0;
    }

    let mid_q = (q_min + q_max) / 2.0;
    let mid_r = (r_min + r_max) / 2.0;
    let band = p.erode_pas_brzegu;
    let tol = p.erode_tolerancja_score;
    let mut rim: Vec<String> = land_keys
        .iter()
        .filter(|k| {
            let (q, r) = parse_hex_key(k);
            q <= q_min + band || q >= q_max - band || r <= r_min + band || r >= r_max - band
        })
        .cloned()
        .collect();
    js_array_sort_by(&mut rim, |a, b| {
        let sa = land_scores.get(a).copied().unwrap_or(0.0);
        let sb = land_scores.get(b).copied().unwrap_or(0.0);
        if (sa - sb).abs() > tol {
            return sa - sb;
        }
        let (qa, ra) = parse_hex_key(a);
        let (qb, rb) = parse_hex_key(b);
        let da = js_hypot(qa - mid_q, ra - mid_r);
        let db = js_hypot(qb - mid_q, rb - mid_r);
        db - da
    });

    let mut eroded = 0usize;
    for k in &rim {
        if bbox_fill <= target_bbox_fill || eroded >= max_erode {
            break;
        }
        if let Some(h) = hexes.get_mut(k) {
            set_hex_to_morze(h);
        }
        land_count -= 1.0;
        bbox_fill = land_count / bbox_area;
        eroded += 1;
    }
    eroded
}

/// Web `carvePangeaLongSideGulfs(hexes, landScores, perm, maxAspect, maxCarve)` (:3606, prywatna).
/// Zwraca liczbe wyciętych heksów (morze).
pub fn carve_pangea_long_side_gulfs(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    perm: &[u8; PERM_TABLE_LEN],
    max_aspect: f64,
    max_carve: usize,
) -> usize {
    let p = mapgen_landsea_pangea();
    let land_keys = dry_land_keys(hexes);
    if land_keys.len() < p.carve_min_liczba_ladu {
        return 0;
    }

    let (mut q_min, mut q_max) = (f64::INFINITY, f64::NEG_INFINITY);
    let (mut r_min, mut r_max) = (f64::INFINITY, f64::NEG_INFINITY);
    for k in &land_keys {
        let (q, r) = parse_hex_key(k);
        q_min = js_min(q_min, q);
        q_max = js_max(q_max, q);
        r_min = js_min(r_min, r);
        r_max = js_max(r_max, r);
    }
    let span_q = q_max - q_min + 1.0;
    let span_r = r_max - r_min + 1.0;
    let long_span = js_max(span_q, span_r);
    let aspect = long_span / js_max(1.0, js_min(span_q, span_r));
    if aspect <= max_aspect {
        return 0;
    }

    let long_is_q = span_q >= span_r;
    let mid_long = if long_is_q {
        (q_min + q_max) / 2.0
    } else {
        (r_min + r_max) / 2.0
    };
    let short_min = if long_is_q { r_min } else { q_min };
    let short_max = if long_is_q { r_max } else { q_max };
    let short_span = short_max - short_min + 1.0;
    let carve_depth = js_max(
        p.carve_glebokosc_min,
        (short_span * p.carve_glebokosc_udzial).floor(),
    );

    struct GulfCandidate {
        key: String,
        score: f64,
        across: f64,
    }
    let mut scored: Vec<GulfCandidate> = land_keys
        .iter()
        .filter_map(|k| {
            let (q, r) = parse_hex_key(k);
            let along = if long_is_q { q } else { r };
            let across = if long_is_q { r } else { q };
            let on_long_side =
                across <= short_min + carve_depth || across >= short_max - carve_depth;
            let near_mid = (along - mid_long).abs() < long_span * p.carve_blisko_srodka_udzial;
            if !(on_long_side && near_mid) {
                return None;
            }
            let noise = fbm(
                perm,
                q * p.carve_szum_skala + p.carve_szum_przesuniecie,
                r * p.carve_szum_skala + p.carve_szum_przesuniecie,
                p.carve_szum_oktawy,
            );
            let base = land_scores.get(k).copied().unwrap_or(0.0);
            Some(GulfCandidate {
                key: k.clone(),
                score: base + noise * p.carve_szum_waga,
                across,
            })
        })
        .collect();
    js_array_sort_by(&mut scored, |a, b| a.score - b.score);

    let mut carved = 0usize;
    for x in &scored {
        if carved >= max_carve {
            break;
        }
        let dist_edge = js_min(x.across - short_min, short_max - x.across);
        if dist_edge > carve_depth {
            continue;
        }
        if let Some(h) = hexes.get_mut(&x.key) {
            set_hex_to_morze(h);
        }
        carved += 1;
    }
    carved
}

/// Web `applyLandFractionByContinent(hexes, landScores, continentOf, nContinents, target, width?, height?)`
/// (:3701). `continent_of` = web `Map` (brak wpisu = 0); `dims` = `Some((w, h))` gdy web podaje
/// oba wymiary (`!= null`), granica aktywna gdy oba > 0. Zwraca liczbe zmian.
/// ZALOZENIE Z-N0: `n_continents == 0` -> brak zmian (web rzuca TypeError przy niepustej mapie).
pub fn apply_land_fraction_by_continent(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    continent_of: &HashMap<String, i64>,
    n_continents: usize,
    target_land_fraction: f64,
    dims: Option<(i64, i64)>,
) -> usize {
    if n_continents == 0 {
        return 0;
    }
    let fill = mapgen_landsea_fill();
    let clamped = js_max(
        fill.clamp_udzialu_min,
        js_min(fill.clamp_udzialu_max, target_land_fraction),
    );
    let total = hexes.len();
    let target_land = js_round(total as f64 * clamped);
    let last = n_continents - 1;

    let mut zone_keys: Vec<Vec<String>> = vec![Vec::new(); n_continents];
    for (k, _) in hexes.iter() {
        let raw = continent_of.get(k).copied().unwrap_or(0);
        let ci = (last as i64).min(raw.max(0)) as usize;
        zone_keys[ci].push(k.clone());
    }
    let score = |k: &str| land_scores.get(k).copied().unwrap_or(0.0);
    let score_sums: Vec<f64> = zone_keys
        .iter()
        .map(|keys| keys.iter().fold(0.0_f64, |s, k| s + score(k)))
        .collect();
    let sum_all = score_sums.iter().fold(0.0_f64, |a, b| a + b);
    // web: `reduce(...) || 1` (0 i NaN -> 1)
    let total_score = if sum_all == 0.0 || sum_all.is_nan() {
        1.0
    } else {
        sum_all
    };

    let mut assigned = 0.0_f64;
    let mut adjusted = 0usize;
    let has_border = dims.is_some_and(|(w, h)| w > 0 && h > 0);
    let (wf, hf) = dims.map_or((0.0, 0.0), |(w, h)| (w as f64, h as f64));
    // web: `width ?? 1` w sortowaniu
    let (sort_w, sort_h) = dims.unwrap_or((1, 1));
    let border_ok = |k: &str| {
        if !has_border {
            return true;
        }
        let (q, r) = parse_hex_key(k);
        !is_in_map_border(q, r, wf, hf, None)
    };
    let center_norm = |k: &str| {
        if !has_border {
            return 0.0;
        }
        let (q, r) = parse_hex_key(k);
        map_center_distance_norm(q, r, wf, hf)
    };
    let is_dry =
        |hexes: &HexRecord, k: &str| hexes.get(k).is_some_and(|h| is_dry_land_terrain(h.terrain));

    for ci in 0..n_continents {
        let keys = &zone_keys[ci];
        let quota = if ci == last {
            target_land - assigned
        } else {
            js_round(target_land * (score_sums[ci] / total_score))
        };
        assigned += quota;
        let mut land = keys.iter().filter(|k| is_dry(hexes, k)).count() as f64;

        if land < quota {
            // Wzrost lądu wylacznie z czystego Morza (nie z PlytkieMorze), jak web.
            let mut morse: Vec<String> = keys
                .iter()
                .filter(|k| {
                    hexes
                        .get(k.as_str())
                        .is_some_and(|h| h.terrain == Terrain::Sea)
                        && border_ok(k)
                })
                .cloned()
                .collect();
            js_array_sort_by(&mut morse, |a, b| {
                let sa = score(a);
                let sb = score(b);
                if (sb - sa).abs() > fill.tolerancja_score_sortowanie {
                    return sb - sa;
                }
                center_norm(a) - center_norm(b)
            });
            for k in &morse {
                if land >= quota {
                    break;
                }
                if let Some(h) = hexes.get_mut(k) {
                    set_hex_to_laka(h);
                }
                land += 1.0;
                adjusted += 1;
            }
        } else if land > quota {
            let dry: Vec<String> = keys.iter().filter(|k| is_dry(hexes, k)).cloned().collect();
            let cands = sort_land_keys_for_erosion(&dry, hexes, land_scores, sort_w, sort_h);
            for k in &cands {
                if land <= quota {
                    break;
                }
                if let Some(h) = hexes.get_mut(k) {
                    set_hex_to_morze(h);
                }
                land -= 1.0;
                adjusted += 1;
            }
        }
    }

    let final_land = count_land_sea_hexes(hexes).land as f64;
    if final_land != target_land {
        if let Some((w, h)) = dims {
            adjusted += apply_land_fraction_by_score(
                hexes,
                land_scores,
                target_land_fraction,
                Some((w, h)),
                LandFractionFillBias::Center,
                fill.pangea_min_score_wypelnienia,
            );
            adjusted += apply_marginal_land_zone_caps(hexes, land_scores, w, h, &LandseaMarginHooks)
                as usize;
            enforce_map_border_ocean(hexes, w, h, None);
        }
    }
    adjusted
}

/// P6.M06A7 (partia 1). Web `pangeaAnnularMaxCorridorWidth` (gen-helpers.ts :4329):
/// `mapScale = Math.sqrt((w*h)/skala)`; wynik `Math.max(min, Math.min(max, Math.round(baza + mapScale*mnoznik)))`.
/// Literaly danych w `data/derived/mapgen-landsea-pangea-annular.json`.
pub fn pangea_annular_max_corridor_width(width: f64, height: f64) -> f64 {
    let t = crate::data::derived::mapgen_landsea_pangea_annular();
    let map_scale = ((width * height) / t.annular_skala_pola).sqrt();
    js_max(
        t.annular_min,
        js_min(
            t.annular_max,
            js_round(t.annular_baza + map_scale * t.annular_mnoznik),
        ),
    )
}

/// P6.M06A7 (partia 1). Web `isPangeaBridgeWater` (gen-helpers.ts :4371) =
/// `isWaterTerrainLocal(tb)`: most Pangei przez Morze i Wybrzeze.
#[inline]
pub fn is_pangea_bridge_water(t: Terrain) -> bool {
    is_water_terrain_local(t)
}

// ---------------------------------------------------------------------------------------------
// P6.M06A8 (R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1), partia 1: jednosc Pangei.
// Literaly danych w `data/derived/mapgen-landsea-pangea-bridge.json`.
// ---------------------------------------------------------------------------------------------

/// Web `groupDryLandMassKeys(hexes)` (gen-helpers.ts :4338, prywatna): masy suchego ladu
/// (bez Wybrzeza i Morza) jako listy kluczy, BFS po 6 sasiadach, w kolejnosci wstawiania.
/// Klucz niekanoniczny jest w masie, ale nie rozwija sasiedztwa (ZALOZENIA w naglowku pliku).
pub fn group_dry_land_mass_keys(hexes: &HexRecord) -> Vec<Vec<String>> {
    let mut visited: HashSet<String> = HashSet::new();
    let mut groups: Vec<Vec<String>> = Vec::new();
    for key in hexes.keys() {
        let Some(hex) = hexes.get(key) else { continue };
        if !is_dry_land_terrain(hex.terrain) || visited.contains(key) {
            continue;
        }
        let mut mass: Vec<String> = Vec::new();
        let mut stack: Vec<String> = vec![key.clone()];
        visited.insert(key.clone());
        while let Some(k) = stack.pop() {
            let neighbours = key_qr(&k);
            mass.push(k);
            let Some((q, r)) = neighbours else { continue };
            for &(dq, dr) in HEX_DIRECTIONS.iter() {
                let nk = hex_key(q + i64::from(dq), r + i64::from(dr));
                if visited.contains(&nk) {
                    continue;
                }
                let Some(nh) = hexes.get(&nk) else { continue };
                if !is_dry_land_terrain(nh.terrain) {
                    continue;
                }
                visited.insert(nk.clone());
                stack.push(nk);
            }
        }
        groups.push(mass);
    }
    groups
}

/// Web `ensurePangeaSingleContinent(hexes, width, height)` (gen-helpers.ts :4375, export).
/// Laczy obce masy ladu mostem wodnym (Morze/Wybrzeze) z glowna masa; gdy most jest poza zasiegiem
/// `maxBridge`, usuwa obce masy o rozmiarze <= max(60, floor(glowna*0.25)) -> Morze.
/// Koncowe wywolanie web `fillPangeaAnnularSeaCorridors` (:4595, RUNDA-2) przechodzi przez
/// `fill_annular`; wywolujacy bez tego kroku podaje `|_, _, _| 0` (zgodnie z kopia web uzyta do
/// wektorow, patrz `gen-m06a8-landsea-vectors.mjs`). Zwraca liczbe zmian (web `converted`).
pub fn ensure_pangea_single_continent(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    fill_annular: impl FnOnce(&mut HexRecord, i64, i64) -> usize,
) -> usize {
    let t = crate::data::derived::mapgen_landsea_pangea_bridge();
    let map_scale = ((width as f64) * (height as f64) / t.bridge_skala_pola).sqrt();
    let max_bridge = js_max(
        t.bridge_min,
        js_min(
            t.bridge_max,
            js_round(t.bridge_baza + map_scale * t.bridge_mnoznik),
        ),
    ) as i64;
    let mut converted = 0usize;

    for _iter in 0..t.bridge_iter_max {
        let mut masses = group_dry_land_mass_keys(hexes);
        js_array_sort_by(&mut masses, |a, b| b.len() as f64 - a.len() as f64);
        if masses.len() <= 1 {
            break;
        }
        let main = masses[0].clone();
        let main_set: HashSet<String> = main.iter().cloned().collect();

        // Multi-source BFS od brzegu glownej masy w wode mostowa - szukaj obcej masy.
        let mut dist: HashMap<String, i64> = HashMap::new();
        let mut parent: HashMap<String, String> = HashMap::new();
        let mut queue: Vec<(i64, i64)> = Vec::new();
        for k in &main {
            let Some((q, r)) = key_qr(k) else { continue };
            for &(dq, dr) in HEX_DIRECTIONS.iter() {
                let (nq, nr) = (q + i64::from(dq), r + i64::from(dr));
                let nk = hex_key(nq, nr);
                let Some(nh) = hexes.get(&nk) else { continue };
                if !is_pangea_bridge_water(nh.terrain) || dist.contains_key(&nk) {
                    continue;
                }
                dist.insert(nk.clone(), 1);
                parent.insert(nk, k.clone());
                queue.push((nq, nr));
            }
        }

        let mut hit_sea: Option<String> = None;
        let mut qi = 0usize;
        while qi < queue.len() {
            let (q, r) = queue[qi];
            qi += 1;
            let cur = hex_key(q, r);
            let d = dist[&cur];
            if d > max_bridge {
                continue;
            }
            let mut found_foreign = false;
            for &(dq, dr) in HEX_DIRECTIONS.iter() {
                let (nq, nr) = (q + i64::from(dq), r + i64::from(dr));
                let nk = hex_key(nq, nr);
                let Some(nh) = hexes.get(&nk) else { continue };
                if is_dry_land_terrain(nh.terrain) {
                    if !main_set.contains(&nk) {
                        hit_sea = Some(cur.clone());
                        found_foreign = true;
                        break;
                    }
                    continue;
                }
                if !is_pangea_bridge_water(nh.terrain) || dist.contains_key(&nk) {
                    continue;
                }
                dist.insert(nk.clone(), d + 1);
                parent.insert(nk, cur.clone());
                queue.push((nq, nr));
            }
            if found_foreign {
                break;
            }
        }

        let Some(hit) = hit_sea else {
            // Obce masy poza maxBridge: usun male obce masy (do max(60, floor(glowna*ulamek))).
            let limit = js_max(
                t.masa_obca_min,
                (main.len() as f64 * t.masa_obca_ulamek_glownej).floor(),
            );
            for other in masses.iter().skip(1) {
                if other.len() as f64 > limit {
                    continue;
                }
                for k in other {
                    if let Some(h) = hexes.get_mut(k) {
                        if is_dry_land_terrain(h.terrain) {
                            set_hex_to_morze(h);
                            converted += 1;
                        }
                    }
                }
            }
            break;
        };

        // Wypelnij sciezke wody od hitSea wstecz do lądu glownego.
        let mut cur: Option<String> = Some(hit);
        let mut path_len: i64 = 0;
        while let Some(c) = cur.clone() {
            if path_len > max_bridge + t.bridge_zapas_sciezki {
                break;
            }
            let Some(h) = hexes.get_mut(&c) else { break };
            if is_pangea_bridge_water(h.terrain) {
                set_hex_to_laka(h);
                converted += 1;
            }
            if main_set.contains(&c) {
                break;
            }
            cur = parent.get(&c).cloned();
            path_len += 1;
        }
    }

    converted += fill_annular(hexes, width, height);
    converted
}

// ---------------------------------------------------------------------------------------------
// P6.M06A9 (R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1), partia 1: korytarze obwarzanka
// (`fillPangeaAnnularSeaCorridors` :4595 z pomocnikami), rebalance Pangei (:3667) i rebalance
// lad/morze (:3791). Literaly w `data/derived/mapgen-landsea-pangea-fill.json`.
// ---------------------------------------------------------------------------------------------

/// Web `pangeaLandCentroid(hexes)` (gen-helpers.ts :4473, prywatna): srodek ciezkosci suchego lądu.
/// `None` gdy suchego lądu jest mniej niz `fill_centroid_min_land`. Wspolrzedne z kluczy (`parseHexKey`).
fn pangea_land_centroid(hexes: &HexRecord) -> Option<(f64, f64)> {
    let t = crate::data::derived::mapgen_landsea_pangea_fill();
    let mut n = 0usize;
    let mut sum_q = 0.0f64;
    let mut sum_r = 0.0f64;
    for (key, h) in hexes.iter() {
        if !is_dry_land_terrain(h.terrain) {
            continue;
        }
        let (q, r) = parse_hex_key(key);
        sum_q += q;
        sum_r += r;
        n += 1;
    }
    if n < t.fill_centroid_min_land {
        return None;
    }
    Some((sum_q / n as f64, sum_r / n as f64))
}

/// Web `pangeaRadialDryLandSteps(hexes, q, r, cQ, cR, towardCenter, maxSteps)` (gen-helpers.ts :4484,
/// prywatna). Kroki wzdluz promienia do najblizszego suchego lądu przez Morze/Wybrzeze.
fn pangea_radial_dry_land_steps(
    hexes: &HexRecord,
    q: f64,
    r: f64,
    cq: f64,
    cr: f64,
    toward_center: bool,
    max_steps: f64,
) -> Option<i64> {
    let eps = crate::data::derived::mapgen_landsea_pangea_fill().fill_dist_epsilon;
    let dist_self = js_hypot(q - cq, r - cr);
    if dist_self < eps {
        return None;
    }
    let uq = (q - cq) / dist_self;
    let ur = (r - cr) / dist_self;
    let sign = if toward_center { -1.0 } else { 1.0 };
    let mut step = 1.0f64;
    while step <= max_steps {
        let nq = js_round(q + sign * uq * step) as i64;
        let nr = js_round(r + sign * ur * step) as i64;
        let nh = hexes.get(&hex_key(nq, nr))?;
        if is_dry_land_terrain(nh.terrain) {
            return Some(step as i64);
        }
        if !is_pangea_bridge_water(nh.terrain) {
            return None;
        }
        step += 1.0;
    }
    None
}

/// Web `pangeaSeaHexIsAnnularCorridor(hexes, q, r, cQ, cR, maxCorridorWidth)` (gen-helpers.ts :4512,
/// prywatna): heks wody lezy w cienkim pierscieniu rdzen-obwarzanek w obu kierunkach promienia.
fn pangea_sea_hex_is_annular_corridor(
    hexes: &HexRecord,
    q: f64,
    r: f64,
    cq: f64,
    cr: f64,
    max_w: f64,
) -> bool {
    let inward = pangea_radial_dry_land_steps(hexes, q, r, cq, cr, true, max_w);
    let outward = pangea_radial_dry_land_steps(hexes, q, r, cq, cr, false, max_w);
    match (inward, outward) {
        (Some(i), Some(o)) => (i as f64) <= max_w && (o as f64) <= max_w,
        _ => false,
    }
}

/// Web `fillPangeaAnnularSeaCorridors(hexes, width, height, maxCorridorWidth?)` (gen-helpers.ts :4595,
/// export). Wypelnia cienkie korytarze wody (Morze/Wybrzeze) miedzy rdzeniem a obreczą Pangei.
/// `max_corridor_width` = `None` (web `undefined`) -> `pangeaAnnularMaxCorridorWidth(w, h)`.
/// Zwraca liczbe zmian (web `converted`). Zrodlo granicy obwarzanka: `morse_depth_from_map_border`
/// liczone raz na poczatku wywolania (jak w webie).
pub fn fill_pangea_annular_sea_corridors(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    max_corridor_width: Option<f64>,
) -> usize {
    let t = crate::data::derived::mapgen_landsea_pangea_fill();
    let max_w = max_corridor_width
        .unwrap_or_else(|| pangea_annular_max_corridor_width(width as f64, height as f64));
    let border_depth = morse_depth_from_map_border(hexes, width, height);
    let zapas = t.fill_zapas_szerokosci;
    let eps = t.fill_dist_epsilon;
    let mut converted = 0usize;

    let mut pass = 0.0f64;
    while pass < max_w + zapas {
        let Some((cq, cr)) = pangea_land_centroid(hexes) else {
            break;
        };
        let mut pass_converted = 0usize;
        // Klucze w kolejnosci wstawiania; stan terenu czytany na zywo (jak `hex` z `Object.entries`).
        let keys: Vec<String> = hexes.iter().map(|(k, _)| k.clone()).collect();
        for key in &keys {
            let Some(hex) = hexes.get(key) else {
                continue;
            };
            if !is_pangea_bridge_water(hex.terrain) {
                continue;
            }
            let (q, r) = (hex.q, hex.r);
            if !pangea_sea_hex_is_annular_corridor(hexes, q as f64, r as f64, cq, cr, max_w) {
                continue;
            }

            // Nie wypelniaj szerokich zatok otwartych do oceanu - tylko cienki pierscien.
            if border_depth.contains_key(key) {
                let (qf, rf) = (q as f64, r as f64);
                let dist_self = js_hypot(qf - cq, rf - cr);
                let denom = js_max(eps, dist_self);
                let uq = (qf - cq) / denom;
                let ur = (rf - cr) / denom;
                let mut sea_band: i64 = 1;
                let limit = max_w + zapas;
                let mut step = 1.0f64;
                while step <= limit {
                    let oq = js_round(qf + uq * step) as i64;
                    let or = js_round(rf + ur * step) as i64;
                    match hexes.get(&hex_key(oq, or)) {
                        Some(oh) if is_pangea_bridge_water(oh.terrain) => sea_band += 1,
                        _ => break,
                    }
                    step += 1.0;
                }
                let mut step = 1.0f64;
                while step <= limit {
                    let iq = js_round(qf - uq * step) as i64;
                    let ir = js_round(rf - ur * step) as i64;
                    match hexes.get(&hex_key(iq, ir)) {
                        Some(ih) if is_pangea_bridge_water(ih.terrain) => sea_band += 1,
                        _ => break,
                    }
                    step += 1.0;
                }
                if sea_band as f64 > max_w + t.fill_prog_pasma_zapas {
                    continue;
                }
            }

            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_laka(h);
                pass_converted += 1;
            }
        }
        converted += pass_converted;
        if pass_converted == 0 {
            break;
        }
        pass += 1.0;
    }
    converted
}

/// Web `rebalanceLandFractionPangea(hexes, landScores, target, width, height, perm)` (gen-helpers.ts
/// :3667, export). Sekwencja przebiegow 1:1 z webem; hak `ensurePangeaSingleContinent` dostaje
/// prawdziwe `fillPangeaAnnularSeaCorridors` (RUNDA-2 z M06A8 zamknieta w tej partii).
pub fn rebalance_land_fraction_pangea(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    target_land_fraction: f64,
    width: i64,
    height: i64,
    perm: &[u8; PERM_TABLE_LEN],
) {
    let fill_min = crate::domain::mapgen::masks::pangea_land_layout_params(
        target_land_fraction,
        width as u32,
        height as u32,
    )
    .fill_min_score;
    let p = mapgen_landsea_pangea();
    let jagged_passes = crate::data::derived::mapgen_landsea_pangea_fill().rebalance_jagged_passes;
    let mask = LandFractionFillBias::Mask;
    let dims = Some((width, height));
    let fill_hook =
        |h: &mut HexRecord, w: i64, hh: i64| fill_pangea_annular_sea_corridors(h, w, hh, None);

    fill_pangea_annular_sea_corridors(hexes, width, height, None);
    apply_land_fraction_by_score(
        hexes,
        land_scores,
        target_land_fraction,
        dims,
        mask,
        fill_min,
    );
    enforce_map_border_ocean(hexes, width, height, None);
    erode_pangea_bbox_low_score_rim(
        hexes,
        land_scores,
        p.erode_docelowe_wypelnienie_bbox,
        p.erode_max,
    );
    carve_pangea_long_side_gulfs(
        hexes,
        land_scores,
        perm,
        p.carve_max_aspect,
        p.carve_max_wyciec,
    );
    fill_pangea_annular_sea_corridors(hexes, width, height, None);
    apply_land_fraction_by_score(
        hexes,
        land_scores,
        target_land_fraction,
        dims,
        mask,
        fill_min,
    );
    enforce_map_border_ocean(hexes, width, height, None);
    erode_pangea_bbox_low_score_rim(
        hexes,
        land_scores,
        p.erode_docelowe_wypelnienie_bbox,
        p.erode_max,
    );
    carve_pangea_long_side_gulfs(
        hexes,
        land_scores,
        perm,
        p.carve_max_aspect,
        p.carve_max_wyciec,
    );
    fill_pangea_annular_sea_corridors(hexes, width, height, None);
    ensure_pangea_single_continent(hexes, width, height, fill_hook);
    apply_land_fraction_by_score(
        hexes,
        land_scores,
        target_land_fraction,
        dims,
        mask,
        fill_min,
    );
    enforce_map_border_ocean(hexes, width, height, None);
    apply_jagged_coast_noise(hexes, perm, width, height, jagged_passes);
    fill_pangea_annular_sea_corridors(hexes, width, height, None);
    ensure_pangea_single_continent(hexes, width, height, fill_hook);
    enforce_map_border_ocean(hexes, width, height, None);
}

/// Web `rebalanceLandSeaRatio(hexes, width, height, targetLandFraction)` (gen-helpers.ts :3791, export).
/// Zwraca liczbe zmian (`adjusted`). Warstwy: maxLayers = ceil(sqrt(w*h)).
pub fn rebalance_land_sea_ratio(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    target_land_fraction: f64,
) -> usize {
    let fill = mapgen_landsea_fill();
    let clamped = js_max(
        fill.clamp_udzialu_min,
        js_min(fill.clamp_udzialu_max, target_land_fraction),
    );
    let total = (width as f64) * (height as f64);
    let target_land = js_round(total * clamped) as i64;
    let mut adjusted = 0usize;
    let max_layers = total.sqrt().ceil() as i64;

    let mut layer = 0i64;
    while layer < max_layers {
        layer += 1;
        let mut land = count_land_sea_hexes(hexes).land as i64;
        if land == target_land {
            break;
        }

        if land < target_land {
            let mut to_fill: Vec<String> = Vec::new();
            for r in 0..height {
                for q in 0..width {
                    if is_coastal_morse_hex(hexes, q, r) {
                        to_fill.push(hex_key(q, r));
                    }
                }
            }
            if to_fill.is_empty() {
                break;
            }
            for key in &to_fill {
                if let Some(h) = hexes.get_mut(key) {
                    set_hex_to_laka(h);
                    adjusted += 1;
                }
            }
            land += to_fill.len() as i64;
            if land >= target_land {
                // Cofnij nadmiar - erozja najnizszego priorytetu na brzegu (wynik skanu wiersz po wierszu).
                while land > target_land {
                    let mut best_key: Option<String> = None;
                    let mut best_score: Option<i64> = None;
                    for r in 0..height {
                        for q in 0..width {
                            if !is_coastal_land_hex(hexes, q, r) {
                                continue;
                            }
                            let Some(hex) = hexes.get(&hex_key(q, r)) else {
                                continue;
                            };
                            let score = erode_terrain_rank(hex.terrain) as i64 * 10
                                - count_morse_neighbors(hexes, q, r) as i64;
                            if best_score.is_none_or(|b| score < b) {
                                best_score = Some(score);
                                best_key = Some(hex_key(q, r));
                            }
                        }
                    }
                    let Some(bk) = best_key else {
                        break;
                    };
                    if let Some(h) = hexes.get_mut(&bk) {
                        set_hex_to_morze(h);
                        land -= 1;
                        adjusted += 1;
                    }
                }
                break;
            }
            continue;
        }

        // land > targetLand - jedna warstwa erozji (najpierw brzeg niskiego rzedu).
        let mut to_erode: Vec<String> = Vec::new();
        for r in 0..height {
            for q in 0..width {
                if !is_coastal_land_hex(hexes, q, r) {
                    continue;
                }
                let Some(hex) = hexes.get(&hex_key(q, r)) else {
                    continue;
                };
                if erode_terrain_rank(hex.terrain) <= 1 {
                    to_erode.push(hex_key(q, r));
                }
            }
        }
        if to_erode.is_empty() {
            for r in 0..height {
                for q in 0..width {
                    if is_coastal_land_hex(hexes, q, r) {
                        to_erode.push(hex_key(q, r));
                    }
                }
            }
        }
        if to_erode.is_empty() {
            break;
        }
        for key in &to_erode {
            if land <= target_land {
                break;
            }
            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_morze(h);
                land -= 1;
                adjusted += 1;
            }
        }
    }
    adjusted
}

// ---------------------------------------------------------------------------
// P6.M06B1 (R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1), partia 1 z M06B: finalizacja wybrzeza
// i wod srodladowych (gen-helpers.ts:4649-4939). Symbole: `maxOceanBayDepth` :4649,
// `purgeReliefValleyWater` :4724, `trimDeepOceanBays` :4761, `finalizeCoastAndInlandWater` :4787,
// `thickenCoastAndSmoothInlets` :4840, `flattenFalseCoastalRiverNotches` :4915.
// Progi i mnozniki: `data/derived/mapgen-coast.json` (`mapgen_coast()`), bez literalow w kodzie.
// Kolejnosc iteracji = kolejnosc wstawiania `HexRecord` (jak `Object.entries`). Sekwencyjne
// mutacje (purge, thicken) czytaja stan na biezaco, jak w JS.
// ---------------------------------------------------------------------------

/// Web `setHexToLaka` z czyszczeniem rzeki (kopia lokalna `trimEnclosedOceanOnly` / `purgeReliefValleyWater`):
/// Laka, Brak, rzeka wylaczona, zloze usuniete.
fn clear_hex_to_laka_with_river(hex: &mut TerrainHex) {
    hex.terrain = Terrain::Grassland;
    hex.overlay = Nakladka::Brak;
    hex.river_present = false;
    hex.river_edges.clear();
    hex.has_deposit = false;
}

/// Web `maxOceanBayDepth(width, height)` (:4649): `max(bufor+dolny, min(bufor+gorny, floor(min(w,h)/dzielnik)))`.
/// Bufor brzegu = `map_border_width` (terrain_class; dla kazdego rozmiaru = twardy pas oceanu).
pub fn max_ocean_bay_depth(width: i64, height: i64) -> f64 {
    let p = &mapgen_coast().zatoki_oceanu;
    let border = map_border_width(width as f64, height as f64);
    let scaled = js_min(width as f64, height as f64);
    let scaled = (scaled / p.dzielnik_skali.wartosc).floor();
    js_max(
        border + p.bufor_min_dodatek.wartosc,
        js_min(border + p.bufor_gorny_dodatek.wartosc, scaled),
    )
}

/// Web `purgeReliefValleyWater(hexes, width, height)` (:4724): woda (Morze/Plytkie) poza zasiegiem
/// BFS z krawedzi, z >= `min_sasiadow_rzezby` sasiadami Gory/Wzgorza ORAZ >= `min_sasiadow_suchych`
/// sasiadami suchego lądu -> Laka. Sasiedzi czytani na biezaco (zmiany wczesniejszych heksow widoczne).
/// Zwraca liczbe zamienionych heksow.
pub fn purge_relief_valley_water(hexes: &mut HexRecord, width: i64, height: i64) -> usize {
    let p = &mapgen_coast().dolina_rzezby;
    let depth = morse_depth_from_map_border(hexes, width, height);
    let keys: Vec<String> = hexes.keys().cloned().collect();
    let mut converted = 0usize;
    for key in &keys {
        let Some(hex) = hexes.get(key) else { continue };
        if !is_water_terrain_local(hex.terrain) {
            continue;
        }
        let (q, r) = (hex.q, hex.r);
        if depth.contains_key(&hex_key(q, r)) {
            continue;
        }
        let mut relief_neighbors = 0usize;
        let mut dry_land_neighbors = 0usize;
        for &(dq, dr) in HEX_DIRECTIONS.iter() {
            let Some(nh) = hexes.get(&hex_key(q + i64::from(dq), r + i64::from(dr))) else {
                continue;
            };
            if is_water_terrain_local(nh.terrain) {
                continue;
            }
            dry_land_neighbors += 1;
            if matches!(nh.terrain, Terrain::Mountains | Terrain::Hills) {
                relief_neighbors += 1;
            }
        }
        if relief_neighbors >= p.min_sasiadow_rzezby.wartosc
            && dry_land_neighbors >= p.min_sasiadow_suchych.wartosc
        {
            if let Some(h) = hexes.get_mut(key) {
                clear_hex_to_laka_with_river(h);
            }
            converted += 1;
        }
    }
    converted
}

/// Web `trimDeepOceanBays(hexes, width, height, _maxDepth?)` (:4761). Parametr `_maxDepth` nie jest
/// czytany w ciele funkcji (NIE-DOTYCZY w porcie). Logika web jest identyczna z `trimEnclosedOceanOnly`
/// (:4701): Morze spoza wyniku `morseDepthFromMapBorder` -> Laka z czyszczeniem rzeki i zloza.
pub fn trim_deep_ocean_bays(hexes: &mut HexRecord, width: i64, height: i64) -> usize {
    trim_enclosed_ocean_only(hexes, width, height)
}

/// Web `finalizeCoastAndInlandWater(hexes, width, height, maxPasses = 3, opts?)` (:4787).
/// `max_inland_pool_size = None` = brak `opts.maxInlandPoolSize` (`removeInlandWaterPools`).
/// Przebieg: usun wode srodladowa -> pierscien podwojny -> sanity -> usun wode srodladowa; stop gdy
/// brak wody srodladowej i brak lądu stykajacego morze, albo przebieg nic nie zmienil.
pub fn finalize_coast_and_inland_water(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    max_passes: usize,
    max_inland_pool_size: Option<usize>,
) {
    for _pass in 0..max_passes {
        let mut changed = 0usize;
        changed += remove_inland_pools_opt(hexes, width, height, max_inland_pool_size);
        changed += apply_double_coast_ring(hexes);
        changed += sanitize_coast_hexes(hexes);
        changed += remove_inland_pools_opt(hexes, width, height, max_inland_pool_size);
        if find_inland_water_hexes(hexes, width, height).is_empty()
            && find_dry_land_touching_sea(hexes).is_empty()
        {
            break;
        }
        if changed == 0 {
            break;
        }
    }
}

/// Wariant domyslny (web: `maxPasses` z domyslnej wartosci, `opts` nieobecne) z tabeli JSON.
pub fn finalize_coast_and_inland_water_default(hexes: &mut HexRecord, width: i64, height: i64) {
    let max_passes = mapgen_coast().finalizacja.max_przebiegow_domyslne.wartosc;
    finalize_coast_and_inland_water(hexes, width, height, max_passes, None);
}

fn remove_inland_pools_opt(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    max_inland_pool_size: Option<usize>,
) -> usize {
    match max_inland_pool_size {
        Some(max) => remove_small_inland_water_pools(hexes, width, height, max),
        None => remove_inland_water_pools(hexes, width, height),
    }
}

/// Web `thickenCoastAndSmoothInlets(hexes, width, height, coastWidth = 2)` (:4840). Zwraca `changed`.
///  (a) Morze poza krawedzia z >= `prog_sasiadow_ladu` sasiadami lądu -> Laka; zbieznie, max
///      `przebiegi_wygladzania` przebiegow; potem `remove_inland_water_pools`.
///  (b) Plytkie -> Morze; potem `coast_width` pierscieni Plytkiego Morza od lądu/Plytkiego (bez
///      `sanitize_coast_hexes`).
pub fn thicken_coast_and_smooth_inlets(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    coast_width: usize,
) -> usize {
    let passes = mapgen_coast().wciecia.przebiegi_wygladzania.wartosc;
    thicken_coast_and_smooth_inlets_with_passes(hexes, width, height, coast_width, passes)
}

/// Jak `thicken_coast_and_smooth_inlets`, ale limit przebiegow czesci (a) podany jawnie (`passes`).
/// Wariant z JSON = `passes` z `przebiegi_wygladzania` (12 wg weba :4852). Jawny limit pozwala testom
/// porownac zachowanie kodu z kopiami weba o limicie 11 i 13 (runda 3, zarzut FC 4).
pub fn thicken_coast_and_smooth_inlets_with_passes(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    coast_width: usize,
    passes: usize,
) -> usize {
    let p = &mapgen_coast().wciecia;
    let mut changed = 0usize;

    for _pass in 0..passes {
        let mut to_fill: Vec<String> = Vec::new();
        for (key, hex) in hexes.iter() {
            if hex.terrain != Terrain::Sea {
                continue;
            }
            let Some((q, r)) = key_qr(key) else { continue };
            if is_in_map_border(q as f64, r as f64, width as f64, height as f64, None) {
                continue;
            }
            if count_land_neighbors(hexes, q, r) >= p.prog_sasiadow_ladu.wartosc {
                to_fill.push(key.clone());
            }
        }
        if to_fill.is_empty() {
            break;
        }
        for key in &to_fill {
            if let Some(h) = hexes.get_mut(key) {
                set_hex_to_laka(h);
                changed += 1;
            }
        }
    }
    changed += remove_inland_water_pools(hexes, width, height);

    let shallow_keys: Vec<String> = hexes
        .iter()
        .filter(|(_, h)| h.terrain == Terrain::ShallowSea)
        .map(|(k, _)| k.clone())
        .collect();
    for key in &shallow_keys {
        if let Some(h) = hexes.get_mut(key) {
            set_hex_to_morze(h);
            changed += 1;
        }
    }
    for _ring in 0..coast_width {
        let mut to_coast: Vec<String> = Vec::new();
        for (key, hex) in hexes.iter() {
            if hex.terrain != Terrain::Sea {
                continue;
            }
            let Some((q, r)) = key_qr(key) else { continue };
            let touches = HEX_DIRECTIONS.iter().any(|&(dq, dr)| {
                hexes
                    .get(&hex_key(q + i64::from(dq), r + i64::from(dr)))
                    .is_some_and(|nb| {
                        is_dry_land_terrain(nb.terrain) || nb.terrain == Terrain::ShallowSea
                    })
            });
            if touches {
                to_coast.push(key.clone());
            }
        }
        if to_coast.is_empty() {
            break;
        }
        for key in &to_coast {
            if let Some(h) = hexes.get_mut(key) {
                h.terrain = Terrain::ShallowSea;
                h.overlay = Nakladka::Brak;
                h.has_deposit = false;
                changed += 1;
            }
        }
    }
    changed
}

/// Wariant domyslny `thickenCoastAndSmoothInlets` (bez `coastWidth`): szerokosc z tabeli JSON.
pub fn thicken_coast_and_smooth_inlets_default(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
) -> usize {
    let coast_width = mapgen_coast().wciecia.szerokosc_wybrzeza_domyslna.wartosc;
    thicken_coast_and_smooth_inlets(hexes, width, height, coast_width)
}

/// Web `flattenFalseCoastalRiverNotches(hexes, width, height)` (:4915): pojedynczy przebieg; Plytkie
/// bez rzeki, poza krawedzia, z >= `prog_sasiadow_morza` sasiadami Morze -> Morze (rzeka wylaczona,
/// zloze usuniete). Zwraca liczbe zamienionych heksow.
pub fn flatten_false_coastal_river_notches(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
) -> usize {
    let prog = mapgen_coast().cypel_ujscia.prog_sasiadow_morza.wartosc;
    let mut to_flatten: Vec<String> = Vec::new();
    for (key, hex) in hexes.iter() {
        if hex.terrain != Terrain::ShallowSea {
            continue;
        }
        if hex.river_present {
            continue;
        }
        let Some((q, r)) = key_qr(key) else { continue };
        if is_in_map_border(q as f64, r as f64, width as f64, height as f64, None) {
            continue;
        }
        let morze_n = HEX_DIRECTIONS
            .iter()
            .filter(|&&(dq, dr)| {
                hexes
                    .get(&hex_key(q + i64::from(dq), r + i64::from(dr)))
                    .is_some_and(|nh| nh.terrain == Terrain::Sea)
            })
            .count();
        if morze_n >= prog {
            to_flatten.push(key.clone());
        }
    }
    for key in &to_flatten {
        if let Some(h) = hexes.get_mut(key) {
            h.terrain = Terrain::Sea;
            h.overlay = Nakladka::Brak;
            h.river_present = false;
            h.river_edges.clear();
            h.has_deposit = false;
        }
    }
    to_flatten.len()
}

/// Web `enforceTargetDryLandFraction(hexes, landScores, target, width, height, coastOpts?, tolerancePctPoints,
/// fillBias, minMaskFillScore)` (:5079). Cel klamp do [klamp_min, klamp_max] (JSON); tolerancja w heksach
/// `max(1, round(total * tol / 100))`. Sekwencja: wypelnienie wg wynikow -> granica -> wybrzeze(1 przebieg)
/// -> granica; jesli poza tolerancja: wypelnienie + pierscien wybrzeza, a jesli nadal poza tolerancja,
/// jeszcze jedno wypelnienie. Zwraca sume zmian z `applyLandFractionByScore`.
// Sygnatura 1:1 z web (9 parametrow, z domyslnymi wartosciami jako argumenty): stad allow.
#[allow(clippy::too_many_arguments)]
pub fn enforce_target_dry_land_fraction(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    target_land_fraction: f64,
    width: i64,
    height: i64,
    max_inland_pool_size: Option<usize>,
    tolerance_pct_points: f64,
    fill_bias: LandFractionFillBias,
    min_mask_fill_score: f64,
) -> usize {
    let susza = &mapgen_landmass().susza;
    let clamped = js_max(
        susza.klamp_min.wartosc,
        js_min(susza.klamp_max.wartosc, target_land_fraction),
    );
    let total = hexes.len() as f64;
    let target_land = js_round(total * clamped);
    let tolerance_hexes = js_max(1.0, js_round(total * tolerance_pct_points / 100.0));
    let dims = Some((width, height));
    let mut adjusted = 0usize;

    adjusted += apply_land_fraction_by_score(
        hexes,
        land_scores,
        clamped,
        dims,
        fill_bias,
        min_mask_fill_score,
    );
    enforce_map_border_ocean(hexes, width, height, None);

    finalize_coast_and_inland_water(hexes, width, height, 1, max_inland_pool_size);
    enforce_map_border_ocean(hexes, width, height, None);

    let mut land = count_land_sea_hexes(hexes).land as f64;
    if (land - target_land).abs() > tolerance_hexes {
        adjusted += apply_land_fraction_by_score(
            hexes,
            land_scores,
            clamped,
            dims,
            fill_bias,
            min_mask_fill_score,
        );
        enforce_map_border_ocean(hexes, width, height, None);
        apply_coast_ring(hexes);
        land = count_land_sea_hexes(hexes).land as f64;
        if (land - target_land).abs() > tolerance_hexes {
            adjusted += apply_land_fraction_by_score(
                hexes,
                land_scores,
                clamped,
                dims,
                fill_bias,
                min_mask_fill_score,
            );
            enforce_map_border_ocean(hexes, width, height, None);
        }
    }
    adjusted
}

/// Wariant domyslny `enforceTargetDryLandFraction` (web: tolerancja 3 pp z JSON, `fillBias = 'center'`,
/// `minMaskFillScore = PANGEA_LAND_FILL_MIN_SCORE`, bez `coastOpts`).
pub fn enforce_target_dry_land_fraction_default(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    target_land_fraction: f64,
    width: i64,
    height: i64,
) -> usize {
    let tol = mapgen_landmass().susza.tolerancja_pp.wartosc;
    let min_score = mapgen_landsea_fill().pangea_min_score_wypelnienia;
    enforce_target_dry_land_fraction(
        hexes,
        land_scores,
        target_land_fraction,
        width,
        height,
        None,
        tol,
        LandFractionFillBias::Center,
        min_score,
    )
}

// ---------------------------------------------------------------------------
// P6.M06B2 (R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1), partia 2 z M06B: wyspy i sprzatanie masy lądu
// (gen-helpers.ts:4946-5100). Symbole: `removeTinyLandIslands` :4946, `minTinyIslandHexesForTyp` :4992,
// `countOpenOceanLandSpecks` :5006, `purgeOpenOceanLandSpecks` :5027, `finalizeLandMassAfterCoast` :5050,
// `enforceTargetDryLandFraction` :5079. Progi: `data/derived/mapgen-landmass.json` (`mapgen_landmass()`).
// Kolejnosc iteracji = kolejnosc wstawiania `HexRecord` (jak `Object.keys`); mutacje sekwencyjne.
// ---------------------------------------------------------------------------

/// Web `minTinyIslandHexesForTyp(typ)` (:4992): minimalna wielkosc wyspy (heksy) dla typu swiata.
pub fn min_tiny_island_hexes_for_typ(typ: WorldType) -> usize {
    let t = &mapgen_landmass().male_wyspy;
    match typ {
        WorldType::Pangea => t.pangea.wartosc,
        WorldType::Continents => t.kontynenty.wartosc,
        WorldType::Islands => t.wyspy.wartosc,
        WorldType::Earth => t.ziemia.wartosc,
    }
}

/// Web `removeTinyLandIslands(hexes, minHexes)` (:4946): spojne skladowe lądu/wybrzeza
/// (`isLandOrCoast` = suchy ląd, czyli nie Morze/Plytkie) mniejsze niz `min_hexes` -> Morze
/// (nakladka Brak, rzeka wylaczona, zloze usuniete). Zwraca liczbe zamienionych heksow.
/// Skladowe liczone na stanie przed zmianami tej skladowej (kolejne skladowe nie graniczą z wczesniejszymi).
pub fn remove_tiny_land_islands(hexes: &mut HexRecord, min_hexes: usize) -> usize {
    let keys: Vec<String> = hexes.keys().cloned().collect();
    let mut visited: HashSet<String> = HashSet::new();
    let mut removed = 0usize;

    for key in &keys {
        if visited.contains(key) {
            continue;
        }
        let Some(h) = hexes.get(key) else { continue };
        if is_water_terrain_local(h.terrain) {
            continue;
        }

        let mut stack: Vec<String> = vec![key.clone()];
        let mut comp: Vec<String> = Vec::new();
        visited.insert(key.clone());

        while let Some(cur) = stack.pop() {
            // Web: `Number(parts[0])`; klucz niekanoniczny nie ma sasiadow (NaN nie trafia w krawedzie).
            let Some((q, r)) = key_qr(&cur) else {
                comp.push(cur);
                continue;
            };
            comp.push(cur);
            for &(dq, dr) in HEX_DIRECTIONS.iter() {
                let nk = hex_key(q + i64::from(dq), r + i64::from(dr));
                if visited.contains(&nk) {
                    continue;
                }
                let Some(nh) = hexes.get(&nk) else { continue };
                if is_water_terrain_local(nh.terrain) {
                    continue;
                }
                visited.insert(nk.clone());
                stack.push(nk);
            }
        }

        if comp.len() >= min_hexes {
            continue;
        }
        for k in &comp {
            if let Some(hx) = hexes.get_mut(k) {
                set_hex_to_morze(hx);
                removed += 1;
            }
        }
    }
    removed
}

/// Liczba sasiadow (w `hexes`) bedacych suchym lądem (nie Morze/Plytkie), web `dryLandNeighbors`
/// w `countOpenOceanLandSpecks` / `purgeOpenOceanLandSpecks` (:5006, :5027). Brak sasiada = pominiety.
fn dry_land_neighbor_count(hexes: &HexRecord, q: i64, r: i64) -> usize {
    HEX_DIRECTIONS
        .iter()
        .filter(|&&(dq, dr)| {
            hexes
                .get(&hex_key(q + i64::from(dq), r + i64::from(dr)))
                .is_some_and(|nh| !is_water_terrain_local(nh.terrain))
        })
        .count()
}

/// Web `countOpenOceanLandSpecks(hexes)` (:5006): suchy ląd bez sasiada-lądu (tylko woda/brzeg mapy).
/// Brzeg `Plytkie` jest woda (`isWaterTerrainLocal`), wiec nie jest liczony jako ląd.
pub fn count_open_ocean_land_specks(hexes: &HexRecord) -> usize {
    hexes
        .iter()
        .filter(|(_, h)| !is_water_terrain_local(h.terrain))
        .filter(|(_, h)| dry_land_neighbor_count(hexes, h.q, h.r) == 0)
        .count()
}

/// Web `finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts?, coastPasses = 2)` (:5050).
/// Petla (limit `przebiegi_maks` z JSON, web `pass < 3`): `removeTinyLandIslands` z progiem typu +
/// `purgeOpenOceanLandSpecks`; przerwanie gdy purge nic nie usunal po pierwszym przebiegu. Potem
/// `finalizeCoastAndInlandWater(coast_passes, max_inland_pool_size)` i `enforceMapBorderOcean`.
/// Zwraca sume zamienionych heksow (tiny + purge).
pub fn finalize_land_mass_after_coast(
    hexes: &mut HexRecord,
    typ: WorldType,
    width: i64,
    height: i64,
    max_inland_pool_size: Option<usize>,
    coast_passes: usize,
) -> usize {
    let min_hexes = min_tiny_island_hexes_for_typ(typ);
    let max_passes = mapgen_landmass().sprzatanie.przebiegi_maks.wartosc;
    let mut total = 0usize;
    for pass in 0..max_passes {
        total += remove_tiny_land_islands(hexes, min_hexes);
        let purged = purge_open_ocean_land_specks(hexes);
        total += purged;
        if purged == 0 && pass > 0 {
            break;
        }
    }
    finalize_coast_and_inland_water(hexes, width, height, coast_passes, max_inland_pool_size);
    enforce_map_border_ocean(hexes, width, height, None);
    total
}

/// Wariant domyslny `finalizeLandMassAfterCoast` (bez `coastOpts`, `coastPasses` z JSON = 2).
pub fn finalize_land_mass_after_coast_default(
    hexes: &mut HexRecord,
    typ: WorldType,
    width: i64,
    height: i64,
) -> usize {
    let coast_passes = mapgen_landmass()
        .sprzatanie
        .wybrzeze_przebiegi_domyslne
        .wartosc;
    finalize_land_mass_after_coast(hexes, typ, width, height, None, coast_passes)
}

/// Web `purgeOpenOceanLandSpecks(hexes)` (:5027): suchy ląd bez sasiada-lądu -> `setHexToMorze`.
/// Sekwencyjnie: stan sasiadow czytany na biezaco (jak w JS). Zwraca liczbe usunietych heksow.
pub fn purge_open_ocean_land_specks(hexes: &mut HexRecord) -> usize {
    let keys: Vec<String> = hexes.keys().cloned().collect();
    let mut removed = 0usize;
    for key in &keys {
        let Some(h) = hexes.get(key) else { continue };
        if is_water_terrain_local(h.terrain) {
            continue;
        }
        let (q, r) = (h.q, h.r);
        if dry_land_neighbor_count(hexes, q, r) > 0 {
            continue;
        }
        if let Some(hx) = hexes.get_mut(key) {
            set_hex_to_morze(hx);
            removed += 1;
        }
    }
    removed
}
