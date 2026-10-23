//! P6.M05A - relief A: masy ladu, partycje, rozmieszczanie gor/wzgorz i pokrycie siatki fair play.
//! Temat wlasciciel: R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1 oraz R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1 (sekwencyjnie, wspolny plik).
//! Zakres web (P6-25 §6): gen-helpers.ts:1408-3185; ten temat (M05A): gen-helpers.ts:1408-2365.
//!
//! Port 1:1 (pin web `edb8fb56`) deklaracji `gra/src/map/gen-helpers.ts`: grupy spojnych mas ladu
//! (`groupLandMassKeys`), centroid i kwadrat centrum kontynentu, partycje ladu do rozkladu
//! reliefu/lasu, `applyReliefByNoiseRank` (gory i wzgorza wg rankingu szumu z rozrzutem),
//! tabele minimow i rozmiarow komorek fair play, liczniki i wskazniki pokrycia siatki,
//! wymuszanie minimow (`pickReliefForceHex`, `forceReliefTypeInCell`), sufit przepelnienia
//! komorki (`capMountainOverflowInCell`, `capHighlandOverflowInCell`, `capIronCellReliefSpread`)
//! oraz domykanie pokrycia masy (`ensureMassIronGridCoverage`, `ensureMassCopperGridCoverage`).
//! `ensureReliefGridCoverage` (gen-helpers.ts:2371) i dalej naleza do M05B.
//!
//! Zgodnosc z webem jest bitowa (f64) i zamrozona wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m05a_vectors/web-vectors.json`, testy `tests/p6_m05a_*.rs`).
//!
//! Stale balansowe: `data/derived/mapgen-relief-a.json` (edytowalne), sufit przepelnienia
//! komorki: `data/map-gen-params.json` (`gestosc.relief_overflow_cap_frac`, jak web
//! `mapGenReliefOverflowCapFrac`), udzialy reliefu: M04 (`terrain_class::relief_land_fractions`).
//!
//! Wywolania `Math.*` w zakresie: `min`, `max`, `round`, `floor`, `ceil` (brak `sin`, `cos`, `pow`,
//! `atan2`, `hypot`; `abs` tylko w zaleznosciach spoza zakresu) - sa dokladne (IEEE) i odtwarzane
//! lokalnymi `js_*` (NaN, `-0`).
//! `Array.prototype.sort` to TimSort V8 (`cluster_mass::js_array_sort_by`).
//!
//! ZALOZENIE (jak w webie): klucze heksow sa kanonicznymi napisami `"q,r"` z calkowitych `q`, `r`
//! (tak buduje je generator); wspolrzedne komorek siatki sa przechowywane jako `i64`.

use std::collections::{HashMap, HashSet};
use std::sync::OnceLock;

use crate::data::derived::{mapgen_relief_a, StartValue, TierTriple};
use crate::data::terrain_map::{parse_map_gen_params, MapGenParamsFile};
use crate::domain::map_generator::{Terrain, WorldType};
use crate::domain::mapgen::cluster_mass::js_array_sort_by;
use crate::domain::mapgen::params::DensityTier;
use crate::domain::mapgen::prims::{hex_key, is_water_terrain_local, HEX_DIRECTIONS};
use crate::domain::mapgen::terrain_class::{
    hex_border_distance, is_relief_candidate_hex, parse_hex_key, relief_land_fractions, HexRecord,
    Nakladka, ReliefDensityTier, TerrainHex, TerrainScratch,
};

/// Generator `rand: () => number` weba.
pub type Rand<'a> = &'a mut dyn FnMut() -> f64;

/// Web `Array<[number, number]>`: heksy ladu jednej komorki siatki (`[q, r]`).
pub type LandCell = Vec<(i64, i64)>;

// ---------------------------------------------------------------------------------------------
// Narzedzia: semantyka liczb JS
// ---------------------------------------------------------------------------------------------

/// JS `Math.max(a, b)`: `NaN` propaguje, `+0` wygrywa z `-0`.
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() { b } else { a };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// JS `Math.min(a, b)`: `NaN` propaguje, `-0` wygrywa z `+0`.
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

/// JS `Math.round(x)`: zaokragla w kierunku `+inf` w polowie (`-2.5 -> -2`), zachowuje `-0`.
fn js_round(x: f64) -> f64 {
    if !x.is_finite() || x == 0.0 {
        return x;
    }
    let floor = x.floor();
    let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };
    if rounded == 0.0 && x < 0.0 {
        -0.0
    } else {
        rounded
    }
}

/// JS `String(x)` dla liczb uzywanych w kluczach (calkowite; `NaN`, `Infinity`, `-0` -> `"0"`).
/// Ulamki: najkrotsza reprezentacja Rust (rozni sie od JS tylko zapisem wykladniczym, ktory
/// nie wystepuje w kluczach generatora).
fn js_num_str(x: f64) -> String {
    if x.is_nan() {
        "NaN".to_string()
    } else if x == 0.0 {
        "0".to_string()
    } else if x.is_infinite() {
        if x > 0.0 { "Infinity" } else { "-Infinity" }.to_string()
    } else if x.fract() == 0.0 && x.abs() < 1e21 {
        format!("{x:.0}")
    } else {
        format!("{x}")
    }
}

/// Web `hexKey(q, r)` dla argumentow `number` (ten sam napis co `hex_key` dla calkowitych).
fn js_hex_key(q: f64, r: f64) -> String {
    format!("{},{}", js_num_str(q), js_num_str(r))
}

/// Pobiera wartosc tieru z tabeli `TierTriple`.
fn tier_value(t: &TierTriple<StartValue<f64>>, tier: DensityTier) -> f64 {
    match tier {
        DensityTier::Low => t.low.wartosc,
        DensityTier::Medium => t.medium.wartosc,
        DensityTier::High => t.high.wartosc,
    }
}

fn hex_at(hexes: &HexRecord, q: i64, r: i64) -> Option<&TerrainHex> {
    hexes.get(&hex_key(q, r))
}

fn is_mountain(hexes: &HexRecord, q: i64, r: i64) -> bool {
    hex_at(hexes, q, r).is_some_and(|h| h.terrain == Terrain::Mountains)
}

fn is_highland(hexes: &HexRecord, q: i64, r: i64) -> bool {
    hex_at(hexes, q, r).is_some_and(|h| h.terrain == Terrain::Hills)
}

fn mtn_noise(scratch: &HashMap<String, TerrainScratch>, key: &str) -> f64 {
    scratch.get(key).map_or(0.0, |s| s.mtn_noise)
}

/// Kolejnosc wstawiania bez duplikatow (`new Set(keys)` -> iteracja).
fn unique_in_order(keys: &[String]) -> Vec<String> {
    let mut seen: HashSet<&str> = HashSet::new();
    let mut out = Vec::new();
    for k in keys {
        if seen.insert(k.as_str()) {
            out.push(k.clone());
        }
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Geometria (lokalne kopie prywatnych pomocnikow weba z innych zakresow)
// ---------------------------------------------------------------------------------------------

/// Web `hexDistanceAxial(aq, ar, bq, br)` (:135): `max(|dq|, |dr|, |ds|)`.
fn hex_distance_axial_f64(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    js_max(js_max(dq, dr), ds)
}

/// Web `hexAxialDistance(q1, r1, q2, r2)` (prywatna, :5194).
fn hex_axial_distance(q1: f64, r1: f64, q2: f64, r2: f64) -> f64 {
    let dq = q1 - q2;
    let dr = r1 - r2;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0
}

/// Web `isRiverLandTerrain(t)` (prywatna, :6854): lad nadajacy sie na zrodlo / bieg rzeki.
fn is_river_land_terrain(t: Terrain) -> bool {
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

/// Web `landHexesByCoverageCell(massSet, cellSize)` (:8360): `Map` komorek w kolejnosci wstawiania
/// (`.values()` iterowane w tej kolejnosci); wartosc = heksy ladu `[q, r]` w kolejnosci zbioru.
pub fn land_hexes_by_coverage_cell(mass_set: &[String], cell_size: f64) -> Vec<(String, LandCell)> {
    let mut cells: Vec<(String, LandCell)> = Vec::new();
    let mut index: HashMap<String, usize> = HashMap::new();
    for key in mass_set {
        let (q, r) = parse_hex_key(key);
        let ck = format!(
            "{},{}",
            js_num_str((q / cell_size).floor()),
            js_num_str((r / cell_size).floor())
        );
        let slot = match index.get(&ck) {
            Some(&i) => i,
            None => {
                index.insert(ck.clone(), cells.len());
                cells.push((ck, Vec::new()));
                cells.len() - 1
            }
        };
        cells[slot].1.push((q as i64, r as i64));
    }
    cells
}

// ---------------------------------------------------------------------------------------------
// Masy ladu, centroid, kwadrat centrum (gen-helpers.ts:1408-1553)
// ---------------------------------------------------------------------------------------------

/// Web `groupLandMassKeys(hexes)` (:1411): grupy spojnych mas ladu (flood-fill, stos).
pub fn group_land_mass_keys(hexes: &HexRecord) -> Vec<Vec<String>> {
    let mut visited: HashSet<String> = HashSet::new();
    let mut groups: Vec<Vec<String>> = Vec::new();
    for key in hexes.keys() {
        let Some(hex) = hexes.get(key) else {
            continue;
        };
        if is_water_terrain_local(hex.terrain) {
            continue;
        }
        if visited.contains(key) {
            continue;
        }
        let mut mass: Vec<String> = Vec::new();
        let mut stack: Vec<String> = vec![key.clone()];
        visited.insert(key.clone());
        while let Some(k) = stack.pop() {
            mass.push(k.clone());
            let (q, r) = parse_hex_key(&k);
            for (dq, dr) in HEX_DIRECTIONS {
                let nk = js_hex_key(q + f64::from(dq), r + f64::from(dr));
                if visited.contains(&nk) {
                    continue;
                }
                let Some(nh) = hexes.get(&nk) else {
                    continue;
                };
                if is_water_terrain_local(nh.terrain) {
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

/// Web `computeLandMassCentroid(hexes, massKeys)` (:1440): srodek masy ladu (`None` = `null`).
pub fn compute_land_mass_centroid(hexes: &HexRecord, mass_keys: &[String]) -> Option<(f64, f64)> {
    let mut sum_q = 0.0_f64;
    let mut sum_r = 0.0_f64;
    let mut count = 0.0_f64;
    for k in mass_keys {
        let Some(h) = hexes.get(k) else {
            continue;
        };
        if !is_river_land_terrain(h.terrain) {
            continue;
        }
        let (q, r) = parse_hex_key(k);
        sum_q += q;
        sum_r += r;
        count += 1.0;
    }
    if count == 0.0 {
        return None;
    }
    Some((sum_q / count, sum_r / count))
}

/// Web `CONTINENT_CENTER_SQUARE_SIZE` (:1460) - wartosc z `mapgen-relief-a.json`.
pub fn continent_center_square_size() -> f64 {
    mapgen_relief_a().kwadrat_centrum.rozmiar_boku.wartosc
}

/// Web `ContinentCenterSquare.bbox`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CenterBBox {
    pub q_min: f64,
    pub q_max: f64,
    pub r_min: f64,
    pub r_max: f64,
}

/// Web `ContinentCenterSquare` (`keys` to `Set` - tu lista bez duplikatow w kolejnosci wstawiania).
#[derive(Debug, Clone, PartialEq)]
pub struct ContinentCenterSquare {
    keys: Vec<String>,
    key_set: HashSet<String>,
    pub bbox: CenterBBox,
    pub centroid: (f64, f64),
}

impl ContinentCenterSquare {
    /// Klucze kwadratu w kolejnosci wstawiania do `Set`.
    pub fn keys(&self) -> &[String] {
        &self.keys
    }

    /// Web `square.keys.has(key)`.
    pub fn has(&self, key: &str) -> bool {
        self.key_set.contains(key)
    }
}

/// Web `continentCenterSquare(hexes, massKeys, size)` (:1472); `size: None` = domyslny bok.
pub fn continent_center_square(
    hexes: &HexRecord,
    mass_keys: &[String],
    size: Option<f64>,
) -> Option<ContinentCenterSquare> {
    let size = size.unwrap_or_else(continent_center_square_size);
    let mut land_keys: Vec<String> = Vec::new();
    for k in mass_keys {
        let Some(h) = hexes.get(k) else {
            continue;
        };
        if !is_river_land_terrain(h.terrain) {
            continue;
        }
        land_keys.push(k.clone());
    }
    if land_keys.is_empty() {
        return None;
    }

    let centroid = compute_land_mass_centroid(hexes, &land_keys)?;

    let mut q_min = f64::INFINITY;
    let mut q_max = f64::NEG_INFINITY;
    let mut r_min = f64::INFINITY;
    let mut r_max = f64::NEG_INFINITY;
    for k in &land_keys {
        let (q, r) = parse_hex_key(k);
        q_min = js_min(q_min, q);
        q_max = js_max(q_max, q);
        r_min = js_min(r_min, r);
        r_max = js_max(r_max, r);
    }
    let span_q = q_max - q_min + 1.0;
    let span_r = r_max - r_min + 1.0;

    let bbox = if span_q <= size && span_r <= size {
        CenterBBox {
            q_min,
            q_max,
            r_min,
            r_max,
        }
    } else {
        let cq = js_round(centroid.0);
        let cr = js_round(centroid.1);
        let half = (size / 2.0).floor();
        CenterBBox {
            q_min: cq - half,
            q_max: cq + half,
            r_min: cr - half,
            r_max: cr + half,
        }
    };

    let mut keys: Vec<String> = Vec::new();
    let mut key_set: HashSet<String> = HashSet::new();
    for k in &land_keys {
        let (q, r) = parse_hex_key(k);
        if q >= bbox.q_min
            && q <= bbox.q_max
            && r >= bbox.r_min
            && r <= bbox.r_max
            && key_set.insert(k.clone())
        {
            keys.push(k.clone());
        }
    }
    if keys.is_empty() {
        for k in &land_keys {
            if key_set.insert(k.clone()) {
                keys.push(k.clone());
            }
        }
    }

    Some(ContinentCenterSquare {
        keys,
        key_set,
        bbox,
        centroid,
    })
}

/// Web `hexDistanceToCenterSquare(q, r, square)` (:1540): odleglosc do najblizszego heksa
/// kwadratu (0 = wewnatrz lub brak kwadratu).
pub fn hex_distance_to_center_square(
    q: f64,
    r: f64,
    square: Option<&ContinentCenterSquare>,
) -> f64 {
    let Some(square) = square else {
        return 0.0;
    };
    if square.keys.is_empty() {
        return 0.0;
    }
    if square.has(&js_hex_key(q, r)) {
        return 0.0;
    }
    let mut min_d = f64::INFINITY;
    for hk in &square.keys {
        let (cq, cr) = parse_hex_key(hk);
        min_d = js_min(min_d, hex_axial_distance(q, r, cq, cr));
    }
    min_d
}

// ---------------------------------------------------------------------------------------------
// Las i partycje ladu (gen-helpers.ts:1555-1605)
// ---------------------------------------------------------------------------------------------

/// Web `isForestEligibleTerrain(tb)` (prywatna, :1555).
pub fn is_forest_eligible_terrain(tb: Terrain) -> bool {
    !is_water_terrain_local(tb)
        && tb != Terrain::Mountains
        && tb != Terrain::Desert
        && tb != Terrain::Polar
}

/// Web `landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents)` (:1565).
///
/// ZALOZENIE: wartosci `continentOf` sa indeksami calkowitymi, a `nContinents` liczba calkowita
/// (tak je daje generator); dla wartosci ulamkowych web rzuca `TypeError` (`zones[ci]` jest
/// `undefined`), tu indeks jest obcinany.
pub fn land_partition_keys_for_distribution(
    hexes: &HexRecord,
    typ: WorldType,
    continent_of: Option<&HashMap<String, f64>>,
    n_continents: f64,
) -> Vec<Vec<String>> {
    if let Some(continent_of) = continent_of {
        if (typ == WorldType::Continents || typ == WorldType::Islands) && n_continents > 0.0 {
            let len = n_continents.floor() as usize;
            let mut zones: Vec<Vec<String>> = vec![Vec::new(); len];
            for key in hexes.keys() {
                let Some(hex) = hexes.get(key) else {
                    continue;
                };
                if is_water_terrain_local(hex.terrain) {
                    continue;
                }
                let raw = continent_of.get(key).copied().unwrap_or(0.0);
                let ci = js_min(n_continents - 1.0, js_max(0.0, raw));
                zones[ci as usize].push(key.clone());
            }
            return zones.into_iter().filter(|z| !z.is_empty()).collect();
        }
    }
    group_land_mass_keys(hexes)
}

/// Web `FOREST_SHARE_OF_DRY_LAND[tier]` (:1590).
pub fn forest_share_of_dry_land(tier: DensityTier) -> f64 {
    tier_value(&mapgen_relief_a().las.udzial_suchego_ladu, tier)
}

/// Web `FOREST_OVERLAY_CAP_FRAC` (:1605).
pub fn forest_overlay_cap_frac() -> f64 {
    mapgen_relief_a().las.sufit_nakladki_ulamek.wartosc
}

// ---------------------------------------------------------------------------------------------
// Limity bonusu / rozrzutu (gen-helpers.ts:1620-1645)
// ---------------------------------------------------------------------------------------------

/// Web `reliefBonusCapMountain(tier, landCount)` (prywatna, :1620).
pub fn relief_bonus_cap_mountain(tier: ReliefDensityTier, land_count: f64) -> f64 {
    let frac = tier_value(&mapgen_relief_a().limit_bonusu_reliefu.gory, tier);
    js_max(0.0, (land_count * frac).ceil())
}

/// Web `reliefBonusCapHighland(tier, landCount)` (prywatna, :1625).
pub fn relief_bonus_cap_highland(tier: ReliefDensityTier, land_count: f64) -> f64 {
    let frac = tier_value(&mapgen_relief_a().limit_bonusu_reliefu.wzgorza, tier);
    js_max(0.0, (land_count * frac).ceil())
}

/// Web `mapGenReliefOverflowCapFrac(tier)` rozstrzygniecie wartosci (map-gen-params-loader.ts:154):
/// wartosc z JSON gdy liczba `> 0`, inaczej fallback z kodu (`mapgen-relief-a.json`).
/// Zwraca `(mountain, highland)`.
pub fn resolve_overflow_cap_frac(
    mountain: Option<f64>,
    highland: Option<f64>,
    tier: DensityTier,
) -> (f64, f64) {
    let t = &mapgen_relief_a().sufit_przepelnienia;
    let fb_m = tier_value(&t.fallback_gory, tier);
    let fb_h = tier_value(&t.fallback_wzgorza, tier);
    let m = mountain.filter(|v| *v > 0.0).unwrap_or(fb_m);
    let h = highland.filter(|v| *v > 0.0).unwrap_or(fb_h);
    (m, h)
}

fn map_gen_params() -> &'static MapGenParamsFile {
    static PARAMS: OnceLock<MapGenParamsFile> = OnceLock::new();
    PARAMS.get_or_init(|| parse_map_gen_params().expect("map-gen-params.json must parse"))
}

/// Web `mapGenReliefOverflowCapFrac(tier)` (map-gen-params-loader.ts:154) z `data/map-gen-params.json`.
/// Zwraca `(mountain, highland)`.
pub fn map_gen_relief_overflow_cap_frac(tier: DensityTier) -> (f64, f64) {
    let cap = &map_gen_params().gestosc.relief_overflow_cap_frac;
    let row = match tier {
        DensityTier::Low => &cap.low,
        DensityTier::Medium => &cap.medium,
        DensityTier::High => &cap.high,
    };
    resolve_overflow_cap_frac(Some(row.mountain), Some(row.highland), tier)
}

/// Web `reliefSpreadCapMountain(tier, landCount)` (prywatna, :1636).
pub fn relief_spread_cap_mountain(tier: ReliefDensityTier, land_count: f64) -> f64 {
    let frac = map_gen_relief_overflow_cap_frac(tier).0;
    js_max(min_mountains_iron_cell(tier), (land_count * frac).ceil())
}

/// Web `reliefSpreadCapHighland(tier, landCount)` (prywatna, :1641).
pub fn relief_spread_cap_highland(tier: ReliefDensityTier, land_count: f64) -> f64 {
    let frac = map_gen_relief_overflow_cap_frac(tier).1;
    js_max(min_highlands_copper_cell(tier), (land_count * frac).ceil())
}

// ---------------------------------------------------------------------------------------------
// Rozmieszczanie gor i wzgorz wg rankingu szumu (gen-helpers.ts:1607-1772)
// ---------------------------------------------------------------------------------------------

/// Web `applyReliefToLandKeys(hexes, scratch, tier, keys, width, height)` (prywatna, :1607).
pub fn apply_relief_to_land_keys(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    keys: &[String],
    width: f64,
    height: f64,
) {
    if keys.is_empty() {
        return;
    }
    apply_iron_mountains_to_land_keys(hexes, scratch, tier, keys, width, height);
    apply_copper_highlands_to_land_keys(hexes, scratch, tier, keys, width, height);
}

/// Kandydaci komorki: heksy ladu ze zbioru, ktore moga stac sie reliefem, z szumem gor,
/// malejaco wg szumu (stabilny TimSort V8). `skip` = teren, ktory juz jest docelowy.
fn relief_candidates(
    land: &[(i64, i64)],
    hexes: &HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    skip: Terrain,
    width: f64,
    height: f64,
) -> Vec<(String, f64)> {
    let mut candidates: Vec<(String, f64)> = land
        .iter()
        .filter(|&&(q, r)| match hex_at(hexes, q, r) {
            None => false,
            Some(hex) => {
                if hex.terrain == skip {
                    return false;
                }
                is_relief_candidate_hex(hex, q as f64, r as f64, width, height)
            }
        })
        .map(|&(q, r)| {
            let k = hex_key(q, r);
            let n = mtn_noise(scratch, &k);
            (k, n)
        })
        .collect();
    js_array_sort_by(&mut candidates, |a, b| b.1 - a.1);
    candidates
}

/// Web `applyIronMountainsToLandKeys` (prywatna, :1646).
pub fn apply_iron_mountains_to_land_keys(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    keys: &[String],
    width: f64,
    height: f64,
) {
    let fr = relief_land_fractions(tier);
    let cell_size = iron_coverage_cell_size(tier);
    let min_land = min_land_hexes_for_relief_cell(cell_size);
    let mass_set = unique_in_order(keys);
    let min_dist = mapgen_relief_a().rozrzut_reliefu.min_odleglosc_gor.wartosc;

    for (_, land) in land_hexes_by_coverage_cell(&mass_set, cell_size) {
        if (land.len() as f64) < min_land {
            continue;
        }
        let candidates =
            relief_candidates(&land, hexes, scratch, Terrain::Mountains, width, height);
        if candidates.is_empty() {
            continue;
        }

        let bonus = js_round(candidates.len() as f64 * fr.mountain);
        let n_mtn = js_min(
            bonus,
            relief_bonus_cap_mountain(tier, candidates.len() as f64),
        );
        if n_mtn <= 0.0 {
            continue;
        }

        for k in pick_spread_relief_keys(&candidates, n_mtn, min_dist) {
            if let Some(h) = hexes.get_mut(&k) {
                h.terrain = Terrain::Mountains;
                h.overlay = Nakladka::Brak;
            }
        }
    }
}

/// Web `applyCopperHighlandsToLandKeys` (prywatna, :1685).
pub fn apply_copper_highlands_to_land_keys(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    keys: &[String],
    width: f64,
    height: f64,
) {
    let fr = relief_land_fractions(tier);
    let cell_size = copper_coverage_cell_size(tier);
    let min_land = min_land_hexes_for_relief_cell(cell_size);
    let mass_set = unique_in_order(keys);
    let min_dist = mapgen_relief_a()
        .rozrzut_reliefu
        .min_odleglosc_wzgorz
        .wartosc;

    for (_, land) in land_hexes_by_coverage_cell(&mass_set, cell_size) {
        if (land.len() as f64) < min_land {
            continue;
        }
        let candidates = relief_candidates(&land, hexes, scratch, Terrain::Hills, width, height);
        if candidates.is_empty() {
            continue;
        }

        let bonus = js_round(candidates.len() as f64 * fr.highland);
        let n_hi = js_min(
            bonus,
            relief_bonus_cap_highland(tier, candidates.len() as f64),
        );
        if n_hi <= 0.0 {
            continue;
        }

        for k in pick_spread_relief_keys(&candidates, n_hi, min_dist) {
            if let Some(h) = hexes.get_mut(&k) {
                h.terrain = Terrain::Hills;
                h.overlay = Nakladka::Brak;
            }
        }
    }
}

/// Web `pickSpreadReliefKeys(candidates, count, minDist)` (prywatna, :1724): najpierw kandydaci
/// z zachowaniem minimalnego odstepu, potem uzupelnienie dowolnymi (kolejnosc rankingu).
pub fn pick_spread_relief_keys(
    candidates: &[(String, f64)],
    count: f64,
    min_dist: f64,
) -> Vec<String> {
    if count <= 0.0 || candidates.is_empty() {
        return Vec::new();
    }
    let mut picked: Vec<String> = Vec::new();
    for c in candidates {
        if picked.len() as f64 >= count {
            break;
        }
        let (q, r) = parse_hex_key(&c.0);
        let spaced = picked.iter().all(|pk| {
            let (pq, pr) = parse_hex_key(pk);
            hex_distance_axial_f64(q, r, pq, pr) >= min_dist
        });
        if spaced {
            picked.push(c.0.clone());
        }
    }
    for c in candidates {
        if picked.len() as f64 >= count {
            break;
        }
        if !picked.contains(&c.0) {
            picked.push(c.0.clone());
        }
    }
    picked
}

/// Web `applyReliefByNoiseRank(hexes, scratch, tier, width, height, typ, continentOf, nContinents)`
/// (:1750). Web domyslne: `typ = 'pangea'`, `continentOf = null`, `nContinents = 0`.
#[allow(clippy::too_many_arguments)]
pub fn apply_relief_by_noise_rank(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    width: f64,
    height: f64,
    typ: WorldType,
    continent_of: Option<&HashMap<String, f64>>,
    n_continents: f64,
) {
    let partitions = land_partition_keys_for_distribution(hexes, typ, continent_of, n_continents);
    for part in partitions {
        let keys: Vec<String> = part
            .into_iter()
            .filter(|key| {
                let Some(hex) = hexes.get(key) else {
                    return false;
                };
                let (q, r) = parse_hex_key(key);
                is_relief_candidate_hex(hex, q, r, width, height)
            })
            .collect();
        apply_relief_to_land_keys(hexes, scratch, tier, &keys, width, height);
    }
}

// ---------------------------------------------------------------------------------------------
// Minima i rozmiary komorek (gen-helpers.ts:1774-1851)
// ---------------------------------------------------------------------------------------------

/// Web `MIN_RIVER_SOURCES_PER_WATER_CELL` (:1777).
pub fn min_river_sources_per_water_cell() -> f64 {
    mapgen_relief_a()
        .pokrycie
        .min_zrodel_rzek_na_komorke_wody
        .wartosc
}

/// Web `minMountainsIronCell(tier)` (:1782).
pub fn min_mountains_iron_cell(tier: ReliefDensityTier) -> f64 {
    tier_value(&mapgen_relief_a().minima_komorki.gory, tier)
}

/// Web `minHighlandsCopperCell(tier)` (:1786).
pub fn min_highlands_copper_cell(tier: ReliefDensityTier) -> f64 {
    tier_value(&mapgen_relief_a().minima_komorki.wzgorza, tier)
}

/// Web `MIN_MOUNTAINS_IRON_CELL` (:1791, deprecated) = `RELIEF_MIN_MOUNTAINS.medium`.
pub fn deprecated_min_mountains_iron_cell() -> f64 {
    min_mountains_iron_cell(DensityTier::Medium)
}

/// Web `MIN_HIGHLANDS_COPPER_CELL` (:1793, deprecated) = `RELIEF_MIN_HIGHLANDS.medium`.
pub fn deprecated_min_highlands_copper_cell() -> f64 {
    min_highlands_copper_cell(DensityTier::Medium)
}

/// Web `waterCoverageCellSize(tier)` (:1799).
pub fn water_coverage_cell_size(tier: DensityTier) -> f64 {
    tier_value(&mapgen_relief_a().rozmiary_komorek.woda, tier)
}

/// Web `ironCoverageCellSize(tier)` (:1809).
pub fn iron_coverage_cell_size(tier: ReliefDensityTier) -> f64 {
    tier_value(&mapgen_relief_a().rozmiary_komorek.zelazo, tier)
}

/// Web `copperCoverageCellSize(tier)` (:1819).
pub fn copper_coverage_cell_size(tier: DensityTier) -> f64 {
    tier_value(&mapgen_relief_a().rozmiary_komorek.miedz, tier)
}

/// Web `reliefCoverageCellSize(tier)` (:1828, deprecated) = `ironCoverageCellSize`.
pub fn relief_coverage_cell_size(tier: ReliefDensityTier) -> f64 {
    iron_coverage_cell_size(tier)
}

/// Web `fairPlayResourceCellSize(tier)` (:1833) = `ironCoverageCellSize`.
pub fn fair_play_resource_cell_size(tier: DensityTier) -> f64 {
    iron_coverage_cell_size(tier)
}

/// Web `forestCoverageCellSize(tier)` (:1838).
pub fn forest_coverage_cell_size(tier: DensityTier) -> f64 {
    tier_value(&mapgen_relief_a().rozmiary_komorek.las, tier)
}

/// Web `minLandHexesForFairPlayCell(cellSize)` (:1844) = `minLandHexesForReliefCell`.
pub fn min_land_hexes_for_fair_play_cell(cell_size: f64) -> f64 {
    min_land_hexes_for_relief_cell(cell_size)
}

/// Web `minLandHexesForReliefCell(cellSize)` (:1848): `max(8, floor(cellSize * 0.32))`.
pub fn min_land_hexes_for_relief_cell(cell_size: f64) -> f64 {
    let p = &mapgen_relief_a().min_ladu_w_komorce;
    js_max(
        p.dolna_granica.wartosc,
        (cell_size * p.ulamek_rozmiaru_komorki.wartosc).floor(),
    )
}

// ---------------------------------------------------------------------------------------------
// Liczniki i pakiety komorki (gen-helpers.ts:1852-1960)
// ---------------------------------------------------------------------------------------------

/// Web `countMountainsInCell(cellLand, hexes)` (prywatna, :1852).
pub fn count_mountains_in_cell(cell_land: &[(i64, i64)], hexes: &HexRecord) -> f64 {
    cell_land
        .iter()
        .filter(|&&(q, r)| is_mountain(hexes, q, r))
        .count() as f64
}

/// Web `countHighlandsInCell(cellLand, hexes)` (prywatna, :1863).
pub fn count_highlands_in_cell(cell_land: &[(i64, i64)], hexes: &HexRecord) -> f64 {
    cell_land
        .iter()
        .filter(|&&(q, r)| is_highland(hexes, q, r))
        .count() as f64
}

/// Web `cellHasMountain` (prywatna, :1874).
pub fn cell_has_mountain(cell_land: &[(i64, i64)], hexes: &HexRecord) -> bool {
    count_mountains_in_cell(cell_land, hexes) > 0.0
}

/// Web `cellHasHighland` (prywatna, :1881).
pub fn cell_has_highland(cell_land: &[(i64, i64)], hexes: &HexRecord) -> bool {
    count_highlands_in_cell(cell_land, hexes) > 0.0
}

/// Web `cellHasIronPackage(cellLand, hexes, tier)` (:1889): min. N x Gory.
pub fn cell_has_iron_package(
    cell_land: &[(i64, i64)],
    hexes: &HexRecord,
    tier: ReliefDensityTier,
) -> bool {
    count_mountains_in_cell(cell_land, hexes) >= min_mountains_iron_cell(tier)
}

/// Web `cellHasCopperPackage(cellLand, hexes, tier)` (:1898): min. N x Wzgorza.
pub fn cell_has_copper_package(
    cell_land: &[(i64, i64)],
    hexes: &HexRecord,
    tier: ReliefDensityTier,
) -> bool {
    count_highlands_in_cell(cell_land, hexes) >= min_highlands_copper_cell(tier)
}

/// Web `cellHasReliefPackage(cellLand, hexes)` (:1907, deprecated).
pub fn cell_has_relief_package(cell_land: &[(i64, i64)], hexes: &HexRecord) -> bool {
    cell_has_mountain(cell_land, hexes) && cell_has_highland(cell_land, hexes)
}

/// Web `eligibleReliefLandCount(land, hexes)` (prywatna, :1920): heksy, ktore moga stac sie
/// reliefem (istnieja i nie sa woda).
pub fn eligible_relief_land_count(land: &[(i64, i64)], hexes: &HexRecord) -> f64 {
    land.iter()
        .filter(|&&(q, r)| hex_at(hexes, q, r).is_some_and(|h| !is_water_terrain_local(h.terrain)))
        .count() as f64
}

/// Web `eligibleDepositLandCount(land, hexes)` (prywatna, :1930).
pub fn eligible_deposit_land_count(land: &[(i64, i64)], hexes: &HexRecord) -> f64 {
    eligible_relief_land_count(land, hexes)
}

/// Web `cellCanHostDepositPackage(land, hexes, minLand)` (prywatna, :1938).
pub fn cell_can_host_deposit_package(
    land: &[(i64, i64)],
    hexes: &HexRecord,
    min_land: f64,
) -> bool {
    if eligible_deposit_land_count(land, hexes) < min_land {
        return false;
    }
    land.iter()
        .any(|&(q, r)| hex_at(hexes, q, r).is_some_and(|h| h.river_present))
}

/// Web `eligibleForestLandCount(land, hexes)` (prywatna, :1950).
pub fn eligible_forest_land_count(land: &[(i64, i64)], hexes: &HexRecord) -> f64 {
    land.iter()
        .filter(|&&(q, r)| {
            hex_at(hexes, q, r).is_some_and(|h| is_forest_eligible_terrain(h.terrain))
        })
        .count() as f64
}

// ---------------------------------------------------------------------------------------------
// Wskazniki pokrycia siatki (gen-helpers.ts:1962-2022)
// ---------------------------------------------------------------------------------------------

fn grid_coverage_ratio(
    mass_land_keys: &[String],
    hexes: &HexRecord,
    cell_size: f64,
    has_package: impl Fn(&[(i64, i64)]) -> bool,
) -> f64 {
    let mass_set = unique_in_order(mass_land_keys);
    let min_land = min_land_hexes_for_relief_cell(cell_size);
    let mut need = 0.0_f64;
    let mut hit = 0.0_f64;
    for (_, land) in land_hexes_by_coverage_cell(&mass_set, cell_size) {
        if eligible_relief_land_count(&land, hexes) < min_land {
            continue;
        }
        need += 1.0;
        if has_package(&land) {
            hit += 1.0;
        }
    }
    if need > 0.0 {
        hit / need
    } else {
        1.0
    }
}

/// Web `ironGridCoverageRatio(massLandKeys, hexes, cellSize, tier)` (:1962).
pub fn iron_grid_coverage_ratio(
    mass_land_keys: &[String],
    hexes: &HexRecord,
    cell_size: f64,
    tier: ReliefDensityTier,
) -> f64 {
    grid_coverage_ratio(mass_land_keys, hexes, cell_size, |land| {
        cell_has_iron_package(land, hexes, tier)
    })
}

/// Web `copperGridCoverageRatio(massLandKeys, hexes, cellSize, tier)` (:1980).
pub fn copper_grid_coverage_ratio(
    mass_land_keys: &[String],
    hexes: &HexRecord,
    cell_size: f64,
    tier: ReliefDensityTier,
) -> f64 {
    grid_coverage_ratio(mass_land_keys, hexes, cell_size, |land| {
        cell_has_copper_package(land, hexes, tier)
    })
}

/// Web `reliefGridCoverageRatio(massLandKeys, hexes, ironCellSize, copperCellSize?)` (:1999,
/// deprecated). Pakiety liczone dla tieru domyslnego `medium` (web nie przekazuje tieru).
pub fn relief_grid_coverage_ratio(
    mass_land_keys: &[String],
    hexes: &HexRecord,
    iron_cell_size: f64,
    copper_cell_size: Option<f64>,
) -> f64 {
    let copper_size = copper_cell_size.unwrap_or_else(|| {
        js_round(
            iron_cell_size
                * mapgen_relief_a()
                    .pokrycie
                    .mnoznik_miedzi_wzgledem_zelaza
                    .wartosc,
        )
    });
    let iron = iron_grid_coverage_ratio(mass_land_keys, hexes, iron_cell_size, DensityTier::Medium);
    let copper =
        copper_grid_coverage_ratio(mass_land_keys, hexes, copper_size, DensityTier::Medium);
    (iron + copper) / 2.0
}

/// Web `assertReliefGridCoverage(massLandKeys, hexes, tier)` (:2011).
pub fn assert_relief_grid_coverage(
    mass_land_keys: &[String],
    hexes: &HexRecord,
    tier: ReliefDensityTier,
) -> bool {
    relief_grid_coverage_ratio(
        mass_land_keys,
        hexes,
        iron_coverage_cell_size(tier),
        Some(copper_coverage_cell_size(tier)),
    ) >= mapgen_relief_a().pokrycie.prog_pokrycia_siatki.wartosc
}

// ---------------------------------------------------------------------------------------------
// Wymuszanie minimow w komorce (gen-helpers.ts:2024-2178)
// ---------------------------------------------------------------------------------------------

/// Web `want: 'mountain' | 'highland'`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReliefWant {
    Mountain,
    Highland,
}

impl ReliefWant {
    /// Teren docelowy (`Gory` / `Wzgorza`).
    fn terrain(self) -> Terrain {
        match self {
            Self::Mountain => Terrain::Mountains,
            Self::Highland => Terrain::Hills,
        }
    }
}

/// Web `pickReliefForceHex(...)` (prywatna, :2024): najlepszy heks do wymuszenia reliefu
/// (`None` = `null`). Woła `rand` raz na kazdego kandydata, w kolejnosci komorki.
#[allow(clippy::too_many_arguments)]
pub fn pick_relief_force_hex(
    land: &[(i64, i64)],
    hexes: &HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    width: f64,
    height: f64,
    want: ReliefWant,
    avoid: &HashSet<String>,
    rand: Rand<'_>,
    protect_highland: bool,
    protect_mountain: bool,
) -> Option<(i64, i64)> {
    let p = &mapgen_relief_a().wymuszanie;
    let filtered: Vec<(i64, i64)> = land
        .iter()
        .copied()
        .filter(|&(q, r)| {
            let k = hex_key(q, r);
            if avoid.contains(&k) {
                return false;
            }
            let Some(hex) = hexes.get(&k) else {
                return false;
            };
            if is_water_terrain_local(hex.terrain) {
                return false;
            }
            if want == ReliefWant::Mountain && hex.terrain == Terrain::Mountains {
                return false;
            }
            if want == ReliefWant::Highland && hex.terrain == Terrain::Hills {
                return false;
            }
            if want == ReliefWant::Mountain && protect_highland && hex.terrain == Terrain::Hills {
                return false;
            }
            if want == ReliefWant::Highland && protect_mountain && hex.terrain == Terrain::Mountains
            {
                return false;
            }
            true
        })
        .collect();
    let mut ranked: Vec<(i64, i64, f64)> = Vec::with_capacity(filtered.len());
    for (q, r) in filtered {
        let k = hex_key(q, r);
        let mut score = mtn_noise(scratch, &k);
        if want == ReliefWant::Highland {
            score *= p.mnoznik_wyniku_wzgorza.wartosc;
        }
        score += js_min(
            p.limit_odleglosci_od_brzegu.wartosc,
            hex_border_distance(q as f64, r as f64, width, height),
        ) * p.waga_odleglosci_od_brzegu.wartosc;
        if hexes
            .get(&k)
            .is_some_and(|h| h.terrain == Terrain::ShallowSea)
        {
            score -= p.kara_plytkie_morze.wartosc;
        }
        score += rand() * p.waga_losowa.wartosc;
        ranked.push((q, r, score));
    }
    js_array_sort_by(&mut ranked, |a, b| b.2 - a.2);
    ranked.first().map(|&(q, r, _)| (q, r))
}

/// Web `forceReliefTypeInCell(...)` (prywatna, :2066): dokleja gory/wzgorza do `minCount`.
/// Zwraca `true`, gdy cos zmieniono.
#[allow(clippy::too_many_arguments)]
pub fn force_relief_type_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    width: f64,
    height: f64,
    rand: Rand<'_>,
    want: ReliefWant,
    min_count: f64,
    tier: ReliefDensityTier,
) -> bool {
    let count = |hexes: &HexRecord| match want {
        ReliefWant::Mountain => count_mountains_in_cell(land, hexes),
        ReliefWant::Highland => count_highlands_in_cell(land, hexes),
    };
    if count(hexes) >= min_count {
        return false;
    }

    let guard_extra = mapgen_relief_a()
        .wymuszanie
        .dodatek_do_straznika_petli
        .wartosc;
    let mut changed = false;
    let mut placed: HashSet<String> = HashSet::new();
    let mut guard = 0.0_f64;
    loop {
        if count(hexes) >= min_count {
            break;
        }
        let guard_now = guard;
        guard += 1.0;
        if guard_now >= land.len() as f64 + guard_extra {
            break;
        }
        let protect_highland = want == ReliefWant::Mountain
            && count_highlands_in_cell(land, hexes) <= min_highlands_copper_cell(tier);
        let protect_mountain = want == ReliefWant::Highland
            && count_mountains_in_cell(land, hexes) <= min_mountains_iron_cell(tier);
        let mut spot = pick_relief_force_hex(
            land,
            hexes,
            scratch,
            width,
            height,
            want,
            &placed,
            &mut *rand,
            protect_highland,
            protect_mountain,
        );
        if spot.is_none() {
            spot = pick_relief_force_hex(
                land, hexes, scratch, width, height, want, &placed, &mut *rand, false, false,
            );
        }
        if spot.is_none() {
            let mut ranked: Vec<(i64, i64, f64)> = land
                .iter()
                .copied()
                .filter(|&(q, r)| {
                    let k = hex_key(q, r);
                    if placed.contains(&k) {
                        return false;
                    }
                    let Some(hex) = hexes.get(&k) else {
                        return false;
                    };
                    if is_water_terrain_local(hex.terrain) {
                        return false;
                    }
                    hex.terrain != want.terrain()
                })
                .map(|(q, r)| (q, r, mtn_noise(scratch, &hex_key(q, r))))
                .collect();
            js_array_sort_by(&mut ranked, |a, b| b.2 - a.2);
            match ranked.first() {
                None => break,
                Some(&(q, r, _)) => spot = Some((q, r)),
            }
        }
        let Some((sq, sr)) = spot else {
            break;
        };
        let k = hex_key(sq, sr);
        if let Some(forced) = hexes.get_mut(&k) {
            forced.terrain = want.terrain();
            forced.overlay = Nakladka::Brak;
            forced.has_deposit = false;
        }
        placed.insert(k);
        changed = true;
    }
    changed
}

/// Web `forceIronMountainsInCell(...)` (prywatna, :2122).
pub fn force_iron_mountains_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    width: f64,
    height: f64,
    rand: Rand<'_>,
    tier: ReliefDensityTier,
) -> bool {
    force_relief_type_in_cell(
        land,
        hexes,
        scratch,
        width,
        height,
        rand,
        ReliefWant::Mountain,
        min_mountains_iron_cell(tier),
        tier,
    )
}

/// Web `forceCopperHighlandsInCell(...)` (prywatna, :2136).
pub fn force_copper_highlands_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    width: f64,
    height: f64,
    rand: Rand<'_>,
    tier: ReliefDensityTier,
) -> bool {
    force_relief_type_in_cell(
        land,
        hexes,
        scratch,
        width,
        height,
        rand,
        ReliefWant::Highland,
        min_highlands_copper_cell(tier),
        tier,
    )
}

/// Web `forceReliefInCell(...)` (prywatna, :2151, deprecated): oba wywolania zawsze wykonane.
pub fn force_relief_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    width: f64,
    height: f64,
    rand: Rand<'_>,
) -> bool {
    let a = force_iron_mountains_in_cell(
        land,
        hexes,
        scratch,
        width,
        height,
        &mut *rand,
        DensityTier::Medium,
    );
    let b = force_copper_highlands_in_cell(
        land,
        hexes,
        scratch,
        width,
        height,
        &mut *rand,
        DensityTier::Medium,
    );
    a || b
}

// ---------------------------------------------------------------------------------------------
// Sufit przepelnienia komorki (gen-helpers.ts:2181-2294)
// ---------------------------------------------------------------------------------------------

/// Web `RELIEF_OVERFLOW_CAP_MULT` (prywatna, :2181).
pub fn relief_overflow_cap_mult() -> f64 {
    mapgen_relief_a().sufit_przepelnienia.mnoznik.wartosc
}

/// Web `isDepositProtectedFromOverflowCap(hex)` (prywatna, :2192): heks ze zlozem.
pub fn is_deposit_protected_from_overflow_cap(hex: Option<&TerrainHex>) -> bool {
    hex.is_some_and(|h| h.has_deposit)
}

/// Kandydat do przyciecia: `(q, r, szum, chroniony)`.
type CapCandidate = (i64, i64, f64, bool);

fn cap_candidates(
    land: &[(i64, i64)],
    hexes: &HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    terrain: Terrain,
) -> Vec<CapCandidate> {
    let mut list: Vec<CapCandidate> = land
        .iter()
        .copied()
        .filter(|&(q, r)| hex_at(hexes, q, r).is_some_and(|h| h.terrain == terrain))
        .map(|(q, r)| {
            (
                q,
                r,
                mtn_noise(scratch, &hex_key(q, r)),
                is_deposit_protected_from_overflow_cap(hex_at(hexes, q, r)),
            )
        })
        .collect();
    js_array_sort_by(&mut list, |a, b| a.2 - b.2);
    list
}

/// Wspolna petla przycinania nadmiaru: od najslabszego szumu, z pominieciem chronionych,
/// dopoki `total > max` i `total > min`.
fn cap_overflow_loop(
    hexes: &mut HexRecord,
    mut list: Vec<CapCandidate>,
    max: f64,
    min: f64,
    drop_to: Terrain,
) -> bool {
    let mut changed = false;
    let mut total = list.len() as f64;
    let mut i = 0_usize;
    while total > max && total > min && i < list.len() {
        let cand = list[i];
        if cand.3 {
            i += 1;
            continue;
        }
        if let Some(drop_hex) = hexes.get_mut(&hex_key(cand.0, cand.1)) {
            drop_hex.terrain = drop_to;
            drop_hex.overlay = Nakladka::Brak;
            drop_hex.has_deposit = false;
        }
        changed = true;
        total -= 1.0;
        list.remove(i);
    }
    changed
}

/// Web `capMountainOverflowInCell(land, hexes, scratch, tier, spreadOnly)` (prywatna, :2196):
/// nadmiar Gor -> Wzgorza (od najslabszego szumu, bez heksow ze zlozem).
pub fn cap_mountain_overflow_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    spread_only: bool,
) -> bool {
    let min_mtn = min_mountains_iron_cell(tier);
    let base_max_mtn = if spread_only {
        relief_spread_cap_mountain(tier, land.len() as f64)
    } else {
        js_max(
            min_mtn,
            relief_bonus_cap_mountain(tier, land.len() as f64) + min_mtn,
        )
    };
    let max_mtn = base_max_mtn * relief_overflow_cap_mult();
    let list = cap_candidates(land, hexes, scratch, Terrain::Mountains);
    cap_overflow_loop(hexes, list, max_mtn, min_mtn, Terrain::Hills)
}

/// Web `capHighlandOverflowInCell(land, hexes, scratch, tier, spreadOnly)` (prywatna, :2233):
/// nadmiar Wzgorz -> Rownina.
pub fn cap_highland_overflow_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    spread_only: bool,
) -> bool {
    let min_hi = min_highlands_copper_cell(tier);
    let base_max_hi = if spread_only {
        relief_spread_cap_highland(tier, land.len() as f64)
    } else {
        js_max(
            min_hi,
            relief_bonus_cap_highland(tier, land.len() as f64) + min_hi,
        )
    };
    let max_hi = base_max_hi * relief_overflow_cap_mult();
    let list = cap_candidates(land, hexes, scratch, Terrain::Hills);
    cap_overflow_loop(hexes, list, max_hi, min_hi, Terrain::Plains)
}

/// Web `capIronCellReliefSpread(hexes, scratch, tier, massSet)` (prywatna, :2270).
pub fn cap_iron_cell_relief_spread(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    mass_set: &[String],
) {
    let iron_size = iron_coverage_cell_size(tier);
    let min_iron_land = min_land_hexes_for_relief_cell(iron_size);
    let mass_set = unique_in_order(mass_set);
    for (_, land) in land_hexes_by_coverage_cell(&mass_set, iron_size) {
        if (land.len() as f64) < min_iron_land {
            continue;
        }
        cap_mountain_overflow_in_cell(&land, hexes, scratch, tier, true);
        cap_highland_overflow_in_cell(&land, hexes, scratch, tier, true);
    }
}

/// Web `capReliefOverflowInCell(land, hexes, scratch, _tier)` (prywatna, :2286, deprecated):
/// `||` w webie skraca - wzgorza tylko gdy gory nic nie zmienily.
pub fn cap_relief_overflow_in_cell(
    land: &[(i64, i64)],
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
) -> bool {
    cap_mountain_overflow_in_cell(land, hexes, scratch, tier, false)
        || cap_highland_overflow_in_cell(land, hexes, scratch, tier, false)
}

// ---------------------------------------------------------------------------------------------
// Domykanie pokrycia masy (gen-helpers.ts:2296-2362)
// ---------------------------------------------------------------------------------------------

/// Wspolna czesc `ensureMassIronGridCoverage` / `ensureMassCopperGridCoverage`.
#[allow(clippy::too_many_arguments)]
fn ensure_mass_grid_coverage(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    width: f64,
    height: f64,
    mass_set: &[String],
    rand: Rand<'_>,
    skip_cap: bool,
    want: ReliefWant,
) -> f64 {
    let size = match want {
        ReliefWant::Mountain => iron_coverage_cell_size(tier),
        ReliefWant::Highland => copper_coverage_cell_size(tier),
    };
    let min_land = min_land_hexes_for_relief_cell(size);
    let mass_set = unique_in_order(mass_set);
    let eligible_cells: Vec<LandCell> = land_hexes_by_coverage_cell(&mass_set, size)
        .into_iter()
        .map(|(_, land)| land)
        .filter(|land| eligible_relief_land_count(land, hexes) >= min_land)
        .collect();
    let max_passes = mapgen_relief_a()
        .wymuszanie
        .max_przebiegow_domykania_komorek
        .wartosc;
    let mut fixed = 0.0_f64;

    let has_package = |land: &[(i64, i64)], hexes: &HexRecord| match want {
        ReliefWant::Mountain => cell_has_iron_package(land, hexes, tier),
        ReliefWant::Highland => cell_has_copper_package(land, hexes, tier),
    };

    if !skip_cap {
        for land in &eligible_cells {
            match want {
                ReliefWant::Mountain => {
                    cap_mountain_overflow_in_cell(land, hexes, scratch, tier, false);
                }
                ReliefWant::Highland => {
                    cap_highland_overflow_in_cell(land, hexes, scratch, tier, false);
                }
            }
        }
    }
    let mut pass = 0.0_f64;
    while pass < max_passes {
        let mut inner = 0.0_f64;
        let mut cells: Vec<LandCell> = eligible_cells.clone();
        {
            let hexes_ref: &HexRecord = hexes;
            js_array_sort_by(&mut cells, |a, b| {
                f64::from(u8::from(has_package(a, hexes_ref)))
                    - f64::from(u8::from(has_package(b, hexes_ref)))
            });
        }
        for land in &cells {
            if has_package(land, hexes) {
                continue;
            }
            let forced = match want {
                ReliefWant::Mountain => force_iron_mountains_in_cell(
                    land, hexes, scratch, width, height, &mut *rand, tier,
                ),
                ReliefWant::Highland => force_copper_highlands_in_cell(
                    land, hexes, scratch, width, height, &mut *rand, tier,
                ),
            };
            if forced {
                inner += 1.0;
            }
        }
        fixed += inner;
        if inner == 0.0 {
            break;
        }
        pass += 1.0;
    }
    fixed
}

/// Web `ensureMassIronGridCoverage(...)` (prywatna, :2296): zwraca liczbe napraw.
#[allow(clippy::too_many_arguments)]
pub fn ensure_mass_iron_grid_coverage(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    width: f64,
    height: f64,
    mass_set: &[String],
    rand: Rand<'_>,
    skip_cap: bool,
) -> f64 {
    ensure_mass_grid_coverage(
        hexes,
        scratch,
        tier,
        width,
        height,
        mass_set,
        rand,
        skip_cap,
        ReliefWant::Mountain,
    )
}

/// Web `ensureMassCopperGridCoverage(...)` (prywatna, :2331): zwraca liczbe napraw.
#[allow(clippy::too_many_arguments)]
pub fn ensure_mass_copper_grid_coverage(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    tier: ReliefDensityTier,
    width: f64,
    height: f64,
    mass_set: &[String],
    rand: Rand<'_>,
    skip_cap: bool,
) -> f64 {
    ensure_mass_grid_coverage(
        hexes,
        scratch,
        tier,
        width,
        height,
        mass_set,
        rand,
        skip_cap,
        ReliefWant::Highland,
    )
}
