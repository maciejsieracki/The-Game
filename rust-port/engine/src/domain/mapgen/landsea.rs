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
    mapgen_desert_purge, mapgen_jagged_coast, mapgen_landsea, mapgen_landsea_fill,
    MapgenJaggedCoastFile,
};
use crate::domain::improvements::js_round;
use crate::domain::map_generator::{ClimateBand, Terrain, WorldType};
use crate::domain::mapgen::cluster_mass::js_array_sort_by;
use crate::domain::mapgen::masks::{nearest_continent_zone_index, ContinentCenter};
use crate::domain::mapgen::prims::{
    climate_band_at, earth_template_land_at, fbm, hex_key, latitudinal_ocean_buffer_rows,
    HEX_DIRECTIONS, PERM_TABLE_LEN,
};
use crate::domain::mapgen::terrain_class::{
    apply_marginal_land_zone_caps, enforce_map_border_ocean, hash_int3, hex_border_distance,
    is_in_map_border, map_center_distance_norm, map_margin_land_zone_hexes, set_hex_to_laka,
    set_hex_to_morze, HexRecord, MarginZoneHooks, Nakladka,
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
