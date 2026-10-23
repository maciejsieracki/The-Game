//! P6.M04 - klasyfikacja terenu i granice mapy. Temat wlasciciel: R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1.
//! Zakres web (P6-25 §6): gen-helpers.ts:233-236, 825-1407.
//!
//! Port 1:1 (pin web `edb8fb56`) deklaracji `gra/src/map/gen-helpers.ts`: bufor oceanu
//! szerokosciowego (`isInLatitudinalOceanBuffer`), klasyfikacja terenu bazowego
//! (`classifyTerrain`, `classifyTerrainFlat`, przeplot Rownina/Laka `terrainCellBias`),
//! nakladka lasu (`reapplyForestOverlay`), ponowna klasyfikacja lądu po dopasowaniu
//! (`reapplyLandTerrain`), udzialy reliefu, strefa brzegu mapy (twardy ocean, limity ladu per
//! pierscien, `applyMarginalLandZoneCaps`, fade'y, bias radialny) i narzedzia granicy mapy.
//!
//! Zgodnosc z webem jest bitowa (f64) i zamrozona wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m04_vectors/web-vectors.json`, testy `tests/p6_m04_*.rs`).
//!
//! Zaleznosci spoza zakresu (WSTRZYKNIETE, bo naleza do innych tematow M*, rownoleglych):
//! - [`ForestOverlayHooks`] (8 metod): `FOREST_SHARE_OF_DRY_LAND`, `FOREST_OVERLAY_CAP_FRAC`,
//!   `forestCoverageCellSize`, `minLandHexesForFairPlayCell`, `isForestEligibleTerrain`,
//!   `buildSeaDistanceField`, `landPartitionKeysForDistribution`, `landHexesByCoverageCell`
//!   (gen-helpers.ts:1555-1605, :1838-1846, :5614, :8360);
//! - [`MarginZoneHooks`] (1 metoda): `sortLandKeysForErosion` (gen-helpers.ts:3207).
//!
//! Lokalne kopie malych prywatnych pomocnikow weba z innych zakresow, ktorych wynik zakres M04
//! wprost zawiera: `parseHexKey` (:3202), `setHexToMorze` (:3325), `setHexToLaka` (:3332).
//!
//! Sortowania: web `Array.prototype.sort` w V8 to TimSort; komparator marginesu brzegu jest
//! NIEprzechodni (`Math.abs(sb - sa) > 0.02`), wiec wynik zalezy od algorytmu - uzywany jest
//! `cluster_mass::js_array_sort_by` (odtworzenie TimSortu V8).
//!
//! Stale balansowe: `data/derived/mapgen-terrain-class.json` (edytowalne). W kodzie zostaja
//! tylko literaly strukturalne (`0`, `1`, `2` jako indeksy/polowa, srodek szumu `0.5`,
//! `d - 1` w pierscieniu brzegu, `maxSeaInPart = 1`, polowa piksela `+ 0.5` w normalizacji
//! srodka mapy) oraz stale ALGORYTMICZNE hasza (`374761393`, `668265263`, `2246822519`,
//! `1274126177`, przesuniecia `13`/`16`; `73856093`, `19349663`, maska `0xffff`).

use std::collections::{HashMap, HashSet};

use crate::data::derived::{mapgen_terrain_class, ReliefGateRow};
use crate::domain::map_generator::{ClimateBand, Terrain, WorldType};
use crate::domain::mapgen::cluster_mass::js_array_sort_by;
use crate::domain::mapgen::params::DensityTier;
use crate::domain::mapgen::prims::{
    climate_band_at, hex_key, is_water_terrain_local, js_to_int32, latitudinal_ocean_buffer_rows,
    HEX_DIRECTIONS,
};

/// Web `ReliefDensityTier` (`'low' | 'medium' | 'high'`) = ten sam zbior co `DensityTier`.
pub type ReliefDensityTier = DensityTier;

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

/// JS `Math.pow(x, y)` w zakresie uzywanym przez web (`y == 2`): V8 (fdlibm) zwraca `x * x`.
/// Inne wykladniki: `powf` (NIE_ZMIERZONO wzgledem V8 - web wola tylko `y == 2`).
fn js_pow(x: f64, y: f64) -> f64 {
    if y == 2.0 {
        x * x
    } else {
        x.powf(y)
    }
}

/// Liczba iteracji petli `for (i = 0; i < m; i++)` dla granicy `m` (f64; `NaN` -> 0).
fn loop_count(m: f64) -> usize {
    if m > 0.0 {
        m.ceil() as usize
    } else {
        0
    }
}

/// ECMAScript `WhiteSpace` + `LineTerminator` (obcinane przez `Number(string)`); wlasny zbior,
/// bo `char::is_whitespace` zawiera U+0085 (JS: nie), a pomija U+FEFF (JS: tak).
fn is_js_whitespace(c: char) -> bool {
    let en_quad_to_hair_space = ('\u{2000}'..='\u{200a}').contains(&c);
    en_quad_to_hair_space
        || matches!(
            c,
            '\u{0009}'
                | '\u{000a}'
                | '\u{000b}'
                | '\u{000c}'
                | '\u{000d}'
                | '\u{0020}'
                | '\u{00a0}'
                | '\u{1680}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202f}'
                | '\u{205f}'
                | '\u{3000}'
                | '\u{feff}'
        )
}

/// Wartosc literalu calkowitego o podstawie potegi dwojki (`0x`/`0o`/`0b`), zaokraglona do
/// najblizszej liczby f64 (remis -> parzysta), jak `Number("0x...")`; dowolna dlugosc cyfr.
fn pow2_radix_digits_to_f64(digits: &str, radix: u32) -> f64 {
    let bits_per_digit = radix.trailing_zeros();
    let mut bits: Vec<bool> = Vec::with_capacity(digits.len() * bits_per_digit as usize);
    for ch in digits.chars() {
        let d = ch.to_digit(radix).expect("cyfra juz zwalidowana");
        for shift in (0..bits_per_digit).rev() {
            bits.push((d >> shift) & 1 == 1);
        }
    }
    let first_one = match bits.iter().position(|b| *b) {
        Some(p) => p,
        None => return 0.0,
    };
    let bits = &bits[first_one..];
    if bits.len() <= 64 {
        let v = bits.iter().fold(0u64, |acc, b| (acc << 1) | u64::from(*b));
        return v as f64; // `u64 as f64` zaokragla do najblizszej, remis do parzystej
    }
    let top = bits[..64]
        .iter()
        .fold(0u64, |acc, b| (acc << 1) | u64::from(*b));
    let sticky = bits[64..].iter().any(|b| *b);
    let mut mantissa = top >> 11;
    let rem = top & 0x7ff;
    let half = 0x400;
    if rem > half || (rem == half && (sticky || mantissa & 1 == 1)) {
        mantissa += 1;
    }
    // wartosc = mantissa * 2^(len - 64 + 11); powi(2, k) dla k > 1023 daje +inf (jak JS)
    let exp = i32::try_from(bits.len() - 64 + 11).unwrap_or(i32::MAX);
    (mantissa as f64) * 2f64.powi(exp)
}

/// ECMAScript `Number(string)` (StringToNumber): obcina biale znaki JS, pusty napis = 0,
/// `0x`/`0o`/`0b` (bez znaku), `Infinity` (wielkosc liter ma znaczenie), notacja dziesietna z
/// opcjonalnym znakiem i wykladnikiem; cokolwiek innego = `NaN` (m.in. `inf`, `1_0`, `-0x10`).
fn js_string_to_number(raw: &str) -> f64 {
    let s = raw.trim_matches(is_js_whitespace);
    if s.is_empty() {
        return 0.0;
    }
    for (prefix, radix) in [
        ("0x", 16),
        ("0X", 16),
        ("0o", 8),
        ("0O", 8),
        ("0b", 2),
        ("0B", 2),
    ] {
        if let Some(digits) = s.strip_prefix(prefix) {
            if digits.is_empty() || !digits.chars().all(|c| c.is_digit(radix)) {
                return f64::NAN;
            }
            return pow2_radix_digits_to_f64(digits, radix);
        }
    }
    let (negative, body) = match s.as_bytes()[0] {
        b'+' => (false, &s[1..]),
        b'-' => (true, &s[1..]),
        _ => (false, s),
    };
    let sign = if negative { -1.0 } else { 1.0 };
    if body == "Infinity" {
        return sign * f64::INFINITY;
    }
    let bytes = body.as_bytes();
    let mut i = 0;
    let mut int_digits = 0;
    while i < bytes.len() && bytes[i].is_ascii_digit() {
        i += 1;
        int_digits += 1;
    }
    let mut frac_digits = 0;
    if i < bytes.len() && bytes[i] == b'.' {
        i += 1;
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1;
            frac_digits += 1;
        }
    }
    if int_digits + frac_digits == 0 {
        return f64::NAN;
    }
    if i < bytes.len() && (bytes[i] == b'e' || bytes[i] == b'E') {
        i += 1;
        if i < bytes.len() && (bytes[i] == b'+' || bytes[i] == b'-') {
            i += 1;
        }
        let exp_start = i;
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1;
        }
        if i == exp_start {
            return f64::NAN;
        }
    }
    if i != bytes.len() {
        return f64::NAN;
    }
    match body.parse::<f64>() {
        Ok(value) => sign * value,
        Err(_) => f64::NAN,
    }
}

/// JS `Number(part)` dla elementu klucza `"q,r"` po `split(',')`: brak elementu
/// (`undefined`) = `NaN`, w pozostalych przypadkach `StringToNumber`.
fn js_number_of_key_part(part: Option<&str>) -> f64 {
    match part {
        None => f64::NAN,
        Some(s) => js_string_to_number(s),
    }
}

/// Web `parseHexKey(key)` (gen-helpers.ts:3202): `"q,r"` -> `(q, r)` jako liczby JS.
pub fn parse_hex_key(key: &str) -> (f64, f64) {
    let mut parts = key.split(',');
    let q = js_number_of_key_part(parts.next());
    let r = js_number_of_key_part(parts.next());
    (q, r)
}

// ---------------------------------------------------------------------------------------------
// Model heksa (wycinek `Hex` weba potrzebny w zakresie M04)
// ---------------------------------------------------------------------------------------------

/// Web `Nakladka` (types/hex.ts): las, zloze lub brak.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Nakladka {
    Brak,
    Las,
    ZlozeGliny,
    ZlozeRudy,
    ZlozeKonia,
    ZlozeOwiec,
    ZlozeBydla,
    ZlozeLamy,
}

impl Nakladka {
    /// Wartosc tekstowa weba (`'brak'`, `'las'`, `'zloze_gliny'`, ...).
    pub fn key(self) -> &'static str {
        match self {
            Self::Brak => "brak",
            Self::Las => "las",
            Self::ZlozeGliny => "zloze_gliny",
            Self::ZlozeRudy => "zloze_rudy",
            Self::ZlozeKonia => "zloze_konia",
            Self::ZlozeOwiec => "zloze_owiec",
            Self::ZlozeBydla => "zloze_bydla",
            Self::ZlozeLamy => "zloze_lamy",
        }
    }

    pub fn from_key(key: &str) -> Option<Self> {
        Some(match key {
            "brak" => Self::Brak,
            "las" => Self::Las,
            "zloze_gliny" => Self::ZlozeGliny,
            "zloze_rudy" => Self::ZlozeRudy,
            "zloze_konia" => Self::ZlozeKonia,
            "zloze_owiec" => Self::ZlozeOwiec,
            "zloze_bydla" => Self::ZlozeBydla,
            "zloze_lamy" => Self::ZlozeLamy,
            _ => return None,
        })
    }
}

/// Wycinek web `Hex`: pola czytane lub zapisywane przez zakres M04
/// (`coords`, `terenBazowy`, `nakladka`, `rzeka`, `zloze`).
#[derive(Debug, Clone, PartialEq)]
pub struct TerrainHex {
    pub q: i64,
    pub r: i64,
    pub terrain: Terrain,
    pub overlay: Nakladka,
    /// Web `rzeka.obecna`.
    pub river_present: bool,
    /// Web `rzeka.krawedzie`.
    pub river_edges: Vec<u8>,
    /// Web: obecnosc pola `zloze` (`(hex as HexWithZloze).zloze`).
    pub has_deposit: bool,
}

impl TerrainHex {
    pub fn new(q: i64, r: i64, terrain: Terrain) -> Self {
        Self {
            q,
            r,
            terrain,
            overlay: Nakladka::Brak,
            river_present: false,
            river_edges: Vec::new(),
            has_deposit: false,
        }
    }
}

/// Web `Record<string, Hex>`: slownik z kolejnoscia wstawiania (`Object.keys/values/entries`).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct HexRecord {
    entries: Vec<(String, TerrainHex)>,
    index: HashMap<String, usize>,
}

impl HexRecord {
    pub fn new() -> Self {
        Self::default()
    }

    /// `hexes[key] = hex`: nowy klucz na koncu, istniejacy zachowuje pozycje (jak w JS).
    pub fn insert(&mut self, key: String, hex: TerrainHex) {
        if let Some(&i) = self.index.get(&key) {
            self.entries[i].1 = hex;
        } else {
            self.index.insert(key.clone(), self.entries.len());
            self.entries.push((key, hex));
        }
    }

    pub fn get(&self, key: &str) -> Option<&TerrainHex> {
        self.index.get(key).map(|&i| &self.entries[i].1)
    }

    pub fn get_mut(&mut self, key: &str) -> Option<&mut TerrainHex> {
        let i = *self.index.get(key)?;
        Some(&mut self.entries[i].1)
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Kolejnosc `Object.entries(hexes)`.
    pub fn iter(&self) -> impl Iterator<Item = (&String, &TerrainHex)> {
        self.entries.iter().map(|(k, h)| (k, h))
    }

    pub fn iter_mut(&mut self) -> impl Iterator<Item = (&String, &mut TerrainHex)> {
        self.entries.iter_mut().map(|(k, h)| (&*k, h))
    }

    pub fn keys(&self) -> impl Iterator<Item = &String> {
        self.entries.iter().map(|(k, _)| k)
    }
}

/// Web `TerrainResult`: teren bazowy + nakladka lesna.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TerrainResult {
    pub teren_bazowy: Terrain,
    pub nakladka: Nakladka,
}

/// Web `TerrainClassifyThresholds`; `None` = `undefined`/`null` (operator `??`).
/// `forest` jest `@deprecated` i nieuzywane w `classifyTerrain` (las: `reapplyForestOverlay`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct TerrainClassifyThresholds {
    pub desert: Option<f64>,
    pub forest: Option<f64>,
    pub mountain: Option<f64>,
    pub highland: Option<f64>,
}

/// Web `TerrainScratch`: dane szumu z pierwszego przebiegu.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TerrainScratch {
    pub elev_continental: f64,
    pub land_mask: f64,
    pub mtn_noise: f64,
    pub for_noise: f64,
    pub des_noise: f64,
}

/// Wynik web `reliefElevGates`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ReliefElevGates {
    pub mountain: f64,
    pub highland: f64,
    pub land_mask_hi: f64,
    pub land_mask_mtn: f64,
}

/// Wynik web `reliefLandFractions`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ReliefLandFractions {
    pub mountain: f64,
    pub highland: f64,
}

// ---------------------------------------------------------------------------------------------
// Wstrzykiwane zaleznosci
// ---------------------------------------------------------------------------------------------

/// Zaleznosci `reapplyForestOverlay` spoza zakresu M04 (kazda to deklaracja weba z innego tematu).
pub trait ForestOverlayHooks {
    /// Web `FOREST_SHARE_OF_DRY_LAND[tier]` (gen-helpers.ts:1590).
    fn forest_share_of_dry_land(&self, tier: DensityTier) -> f64;
    /// Web `FOREST_OVERLAY_CAP_FRAC` (:1605).
    fn forest_overlay_cap_frac(&self) -> f64;
    /// Web `forestCoverageCellSize(tier)` (:1838).
    fn forest_coverage_cell_size(&self, tier: DensityTier) -> f64;
    /// Web `minLandHexesForFairPlayCell(cellSize)` (:1844).
    fn min_land_hexes_for_fair_play_cell(&self, cell_size: f64) -> f64;
    /// Web `isForestEligibleTerrain(tb)` (:1555).
    fn is_forest_eligible_terrain(&self, terrain: Terrain) -> bool;
    /// Web `buildSeaDistanceField(hexes)` (:5614): klucz -> odleglosc od wody.
    fn build_sea_distance_field(&self, hexes: &HexRecord) -> HashMap<String, f64>;
    /// Web `landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents)` (:1565).
    fn land_partition_keys_for_distribution(
        &self,
        hexes: &HexRecord,
        typ: WorldType,
        continent_of: Option<&HashMap<String, f64>>,
        n_continents: f64,
    ) -> Vec<Vec<String>>;
    /// Web `landHexesByCoverageCell(massSet, cellSize)` (:8360): `Map` w kolejnosci wstawiania
    /// (`.values()` jest iterowane w tej kolejnosci).
    fn land_hexes_by_coverage_cell(
        &self,
        mass_set: &[String],
        cell_size: f64,
    ) -> Vec<(String, Vec<(i64, i64)>)>;
}

/// Zaleznosc `applyMarginalLandZoneCaps` spoza zakresu M04.
pub trait MarginZoneHooks {
    /// Web `sortLandKeysForErosion(keys, hexes, landScores, width, height)` (:3207).
    fn sort_land_keys_for_erosion(
        &self,
        keys: &[String],
        hexes: &HexRecord,
        land_scores: &HashMap<String, f64>,
        width: i64,
        height: i64,
    ) -> Vec<String>;
}

// ---------------------------------------------------------------------------------------------
// Bufor oceanu szerokosciowego (gen-helpers.ts:233-236)
// ---------------------------------------------------------------------------------------------

/// Web `isInLatitudinalOceanBuffer(r, height, isEarth)`.
pub fn is_in_latitudinal_ocean_buffer(r: i64, height: u32, is_earth: bool) -> bool {
    let buf = i64::from(latitudinal_ocean_buffer_rows(height, is_earth));
    r < buf || r >= i64::from(height) - buf
}

// ---------------------------------------------------------------------------------------------
// Klasyfikacja terenu (gen-helpers.ts:825-967)
// ---------------------------------------------------------------------------------------------

fn gate_row(row: &ReliefGateRow) -> ReliefElevGates {
    ReliefElevGates {
        mountain: row.mountain.wartosc,
        highland: row.highland.wartosc,
        land_mask_hi: row.land_mask_hi.wartosc,
        land_mask_mtn: row.land_mask_mtn.wartosc,
    }
}

/// Web `reliefElevGates(mtnTh)` (prywatna, :861): progi wysokosci bazowej dla gor/wzgorz.
pub fn relief_elev_gates(mtn_th: f64) -> ReliefElevGates {
    let g = &mapgen_terrain_class().bramki_wysokosci_reliefu;
    if mtn_th <= g.prog_niski_mtn_max_wlacznie.wartosc {
        return gate_row(&g.niski);
    }
    if mtn_th >= g.prog_wysoki_mtn_min_wlacznie.wartosc {
        return gate_row(&g.wysoki);
    }
    gate_row(&g.sredni)
}

/// Web `terenCoverageCellSize()` (:889).
pub fn teren_coverage_cell_size() -> f64 {
    mapgen_terrain_class()
        .przeplot_rownina_laka
        .rozmiar_komorki_hex
        .wartosc
}

/// Web `hashInt3(a, b, c)` (prywatna, :899): czysta funkcja `(a,b,c) -> [0,1)`.
/// Iloczyny licza sie w `f64` (jak w JS), potem `ToInt32`; `Math.imul` = mnozenie modulo 2^32.
pub fn hash_int3(a: f64, b: f64, c: f64) -> f64 {
    let mut h = js_to_int32(a * 374_761_393.0)
        ^ js_to_int32(b * 668_265_263.0)
        ^ js_to_int32(c * 2_246_822_519.0);
    h = (h ^ ((h as u32) >> 13) as i32).wrapping_mul(1_274_126_177);
    let u = ((h ^ ((h as u32) >> 16) as i32) as u32) as f64;
    u / 4_294_967_296.0
}

/// Web `terrainCellBias(q, r, seed, cellSize = terenCoverageCellSize())` (:911). Zakres `[-1, 1)`.
/// `cell_size: None` = domyslny argument weba.
pub fn terrain_cell_bias(q: f64, r: f64, seed: f64, cell_size: Option<f64>) -> f64 {
    let cell_size = cell_size.unwrap_or_else(teren_coverage_cell_size);
    let cx = (q / cell_size).floor();
    let cy = (r / cell_size).floor();
    (hash_int3(cx, cy, seed) - 0.5) * 2.0
}

/// Web `terrainRownLakaJitter(forNoise, desNoise, cellBias)` (prywatna, :917).
pub fn terrain_rown_laka_jitter(for_noise: f64, des_noise: f64, cell_bias: f64) -> f64 {
    let mix = &mapgen_terrain_class().przeplot_rownina_laka;
    let global = ((for_noise + des_noise) * 0.5 - 0.5) * mix.amplituda_globalna.wartosc;
    let local = cell_bias * mix.amplituda_komorkowa.wartosc;
    global + local
}

/// Web `classifyTerrain(...)` (:923): teren bazowy jednego heksa (bez lasu).
#[allow(clippy::too_many_arguments)]
pub fn classify_terrain(
    elev_continental: f64,
    land_mask: f64,
    mtn_noise: f64,
    for_noise: f64,
    des_noise: f64,
    thresholds: Option<&TerrainClassifyThresholds>,
    climate_band: Option<ClimateBand>,
    cell_bias: f64,
) -> TerrainResult {
    let c = &mapgen_terrain_class().klasyfikacja;
    let des_th = thresholds
        .and_then(|t| t.desert)
        .unwrap_or(c.prog_pustyni_domyslny.wartosc);
    let mtn_th = thresholds
        .and_then(|t| t.mountain)
        .unwrap_or(c.prog_gor_domyslny.wartosc);
    let hi_th = thresholds
        .and_then(|t| t.highland)
        .unwrap_or(c.prog_wzgorz_domyslny.wartosc);
    let elev_g = relief_elev_gates(mtn_th);
    let teren_bazowy;

    if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {
        // Ocean tylko przy niskiej masce ladu. Dolina miedzy gorami (landMask OK) -> Laka, nie Morze.
        teren_bazowy = if land_mask < c.landmask_ponizej_ktorego_morze.wartosc {
            Terrain::Sea
        } else {
            Terrain::Grassland
        };
    } else {
        let is_highlands = mtn_noise > hi_th && land_mask > elev_g.land_mask_hi;
        let is_mountain = mtn_noise > mtn_th && land_mask > elev_g.land_mask_mtn;

        if is_mountain && elev_continental > elev_g.mountain {
            teren_bazowy = Terrain::Mountains;
        } else if is_highlands && elev_continental > elev_g.highland {
            teren_bazowy = Terrain::Hills;
        } else if crate::domain::mapgen::prims::can_assign_climate_desert(climate_band)
            && des_noise > des_th
            && elev_continental > c.pustynia_elev_wiekszy_niz.wartosc
            && elev_continental < c.pustynia_elev_mniejszy_niz.wartosc
        {
            teren_bazowy = Terrain::Desert;
        } else if elev_continental + terrain_rown_laka_jitter(for_noise, des_noise, cell_bias)
            > c.rownina_prog_sumy.wartosc
        {
            teren_bazowy = Terrain::Plains;
        } else {
            teren_bazowy = Terrain::Grassland;
        }
    }

    TerrainResult {
        teren_bazowy,
        nakladka: Nakladka::Brak,
    }
}

/// Web `classifyTerrainFlat(...)` (:973): lad bez gor/wzgorz (relief nadaje inny etap).
/// Argument `_mtnNoise` weba jest nieuzywany - zachowany dla zgodnosci sygnatury.
#[allow(clippy::too_many_arguments)]
pub fn classify_terrain_flat(
    elev_continental: f64,
    _land_mask: f64,
    _mtn_noise: f64,
    for_noise: f64,
    des_noise: f64,
    thresholds: Option<&TerrainClassifyThresholds>,
    climate_band: Option<ClimateBand>,
    cell_bias: f64,
) -> TerrainResult {
    let c = &mapgen_terrain_class().klasyfikacja;
    let des_th = thresholds
        .and_then(|t| t.desert)
        .unwrap_or(c.prog_pustyni_domyslny.wartosc);
    let teren_bazowy;

    if elev_continental < c.elev_ponizej_ktorego_woda_lub_laka.wartosc {
        teren_bazowy = Terrain::Grassland;
    } else if crate::domain::mapgen::prims::can_assign_climate_desert(climate_band)
        && des_noise > des_th
        && elev_continental > c.pustynia_elev_wiekszy_niz.wartosc
        && elev_continental < c.pustynia_elev_mniejszy_niz.wartosc
    {
        teren_bazowy = Terrain::Desert;
    } else if elev_continental + terrain_rown_laka_jitter(for_noise, des_noise, cell_bias)
        > c.rownina_prog_sumy.wartosc
    {
        teren_bazowy = Terrain::Plains;
    } else {
        teren_bazowy = Terrain::Grassland;
    }

    TerrainResult {
        teren_bazowy,
        nakladka: Nakladka::Brak,
    }
}

// ---------------------------------------------------------------------------------------------
// Nakladka lasu (gen-helpers.ts:1012-1075)
// ---------------------------------------------------------------------------------------------

struct ForestCandidate {
    key: String,
    n: f64,
}

/// Web `reapplyForestOverlay(...)` (:1012): jedyny etap nakladania lasu. Zwraca liczbe
/// przypisanych heksow lasu. `map_height: Some(0)` = falsz w JS (`mapHeight &&`).
#[allow(clippy::too_many_arguments)]
pub fn reapply_forest_overlay(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    _thresholds: Option<&TerrainClassifyThresholds>,
    typ: WorldType,
    forest_tier: DensityTier,
    continent_of: Option<&HashMap<String, f64>>,
    n_continents: f64,
    map_height: Option<u32>,
    hooks: &dyn ForestOverlayHooks,
) -> i64 {
    let forest = &mapgen_terrain_class().nakladka_lasu;
    let map_height = map_height.filter(|h| *h != 0);
    let share = hooks.forest_share_of_dry_land(forest_tier);
    let cell_size = hooks.forest_coverage_cell_size(forest_tier);
    let min_land = hooks.min_land_hexes_for_fair_play_cell(cell_size);
    let sea_dist = hooks.build_sea_distance_field(hexes);

    for (_, hex) in hexes.iter_mut() {
        if hex.overlay == Nakladka::Las {
            hex.overlay = Nakladka::Brak;
        }
    }

    let mut assigned: i64 = 0;
    let partitions =
        hooks.land_partition_keys_for_distribution(hexes, typ, continent_of, n_continents);

    for part in &partitions {
        // `new Set(part.filter(...))`: unikalne klucze w kolejnosci wstawiania; brak heksa = lad.
        let mut seen: HashSet<&str> = HashSet::new();
        let mut mass_set: Vec<String> = Vec::new();
        for k in part {
            let keep = match hexes.get(k) {
                Some(hx) => !is_water_terrain_local(hx.terrain),
                None => true,
            };
            if keep && seen.insert(k.as_str()) {
                mass_set.push(k.clone());
            }
        }
        let mut max_sea_in_part = 1.0_f64;
        for k in &mass_set {
            let d = sea_dist.get(k).copied().unwrap_or(0.0);
            if d > max_sea_in_part {
                max_sea_in_part = d;
            }
        }
        for (_, land) in hooks.land_hexes_by_coverage_cell(&mass_set, cell_size) {
            if (land.len() as f64) < min_land {
                continue;
            }

            let mut eligible: Vec<ForestCandidate> = Vec::new();
            for &(q, r) in &land {
                let key = hex_key(q, r);
                let ok = match hexes.get(&key) {
                    Some(h) => {
                        hooks.is_forest_eligible_terrain(h.terrain)
                            && h.overlay == Nakladka::Brak
                            && !map_height.is_some_and(|mh| {
                                climate_band_at(r, mh, false) == ClimateBand::Desert
                            })
                    }
                    None => false,
                };
                if !ok {
                    continue;
                }
                let sd = sea_dist.get(&key).copied().unwrap_or(0.0);
                let inland_boost = if max_sea_in_part > 1.0 {
                    (sd / max_sea_in_part) * forest.bonus_wnetrza_ladu_max.wartosc
                } else {
                    0.0
                };
                let for_noise = scratch.get(&key).map_or(0.0, |s| s.for_noise);
                eligible.push(ForestCandidate {
                    key,
                    n: for_noise + inland_boost,
                });
            }
            js_array_sort_by(&mut eligible, |a, b| b.n - a.n);

            if eligible.is_empty() {
                continue;
            }

            let mid = land[land.len() / 2];
            let cell_band = match map_height {
                Some(mh) => climate_band_at(mid.1, mh, false),
                None => ClimateBand::TemperateNorth,
            };
            let zone_share_mul = if matches!(
                cell_band,
                ClimateBand::TemperateNorth | ClimateBand::TemperateSouth
            ) {
                forest.mnoznik_strefy_umiarkowanej.wartosc
            } else {
                forest.mnoznik_poza_strefa_umiarkowana.wartosc
            };

            let min_forest = if typ == WorldType::Pangea {
                forest.minimum_lasu_pangea.wartosc
            } else {
                forest.minimum_lasu_poza_pangea.wartosc
            };
            let len = eligible.len() as f64;
            let target = js_max(min_forest, js_round(len * share * zone_share_mul));
            let cap = js_min(
                target,
                js_max(
                    forest.minimum_sufitu_komorki.wartosc,
                    (len * hooks.forest_overlay_cap_frac()).ceil(),
                ),
            );

            for cand in eligible.iter().take(loop_count(js_min(cap, len))) {
                if let Some(h) = hexes.get_mut(&cand.key) {
                    h.overlay = Nakladka::Las;
                }
                assigned += 1;
            }
        }
    }
    assigned
}

// ---------------------------------------------------------------------------------------------
// Ponowna klasyfikacja lądu (gen-helpers.ts:1109-1161)
// ---------------------------------------------------------------------------------------------

struct ReliefCandidate {
    key: String,
    n: f64,
    want: Terrain,
}

/// Web `reapplyLandTerrain(hexes, scratch, seed, thresholds, mapHeight, reliefTier)` (:1109).
pub fn reapply_land_terrain(
    hexes: &mut HexRecord,
    scratch: &HashMap<String, TerrainScratch>,
    seed: f64,
    thresholds: Option<&TerrainClassifyThresholds>,
    map_height: Option<u32>,
    relief_tier: ReliefDensityTier,
) {
    let map_height = map_height.filter(|h| *h != 0);
    let mut relief_candidates: Vec<ReliefCandidate> = Vec::new();
    let mut land_count: f64 = 0.0;

    for (key, hex) in hexes.iter_mut() {
        if is_water_terrain_local(hex.terrain) {
            continue;
        }
        let Some(s) = scratch.get(key) else {
            continue;
        };
        land_count += 1.0;
        let (q, r) = (hex.q, hex.r);
        let climate_band = map_height.map(|mh| climate_band_at(r, mh, false));
        let cell_bias = terrain_cell_bias(q as f64, r as f64, seed, None);
        let full = classify_terrain(
            s.elev_continental,
            s.land_mask,
            s.mtn_noise,
            s.for_noise,
            s.des_noise,
            thresholds,
            climate_band,
            cell_bias,
        );
        if full.teren_bazowy == Terrain::Mountains || full.teren_bazowy == Terrain::Hills {
            // Tymczasowo plasko - przywrocimy TOP-budzet kandydatow po mtnNoise (skupiska).
            let flat = classify_terrain_flat(
                s.elev_continental,
                s.land_mask,
                s.mtn_noise,
                s.for_noise,
                s.des_noise,
                thresholds,
                climate_band,
                cell_bias,
            );
            hex.terrain = flat.teren_bazowy;
            hex.overlay = flat.nakladka;
            relief_candidates.push(ReliefCandidate {
                key: key.clone(),
                n: s.mtn_noise,
                want: full.teren_bazowy,
            });
        } else {
            // Ten heks JEST ladem (skip wody powyzej) - classifyTerrain nie cofa tej decyzji.
            hex.terrain = if full.teren_bazowy == Terrain::Sea {
                Terrain::Grassland
            } else {
                full.teren_bazowy
            };
            hex.overlay = full.nakladka;
        }
    }

    if relief_candidates.is_empty() {
        return;
    }
    js_array_sort_by(&mut relief_candidates, |a, b| b.n - a.n);
    let budgets = &mapgen_terrain_class()
        .relief_po_dopasowaniu_ladu
        .budzet_ulamek_ladu;
    let budget_frac = match relief_tier {
        DensityTier::Low => budgets.low.wartosc,
        DensityTier::Medium => budgets.medium.wartosc,
        DensityTier::High => budgets.high.wartosc,
    };
    let budget = (land_count * budget_frac).floor();
    let bound = js_min(budget, relief_candidates.len() as f64);
    for c in relief_candidates.iter().take(loop_count(bound)) {
        let Some(hex) = hexes.get_mut(&c.key) else {
            continue;
        };
        hex.terrain = c.want;
        hex.overlay = Nakladka::Brak;
    }
}

/// Web `reliefLandFractions(tier)` (:1172): docelowy udzial gor/wzgorz na ladzie.
pub fn relief_land_fractions(tier: ReliefDensityTier) -> ReliefLandFractions {
    let t = &mapgen_terrain_class().relief_po_dopasowaniu_ladu;
    match tier {
        DensityTier::Low => ReliefLandFractions {
            mountain: t.docelowy_udzial_gor.low.wartosc,
            highland: t.docelowy_udzial_wzgorz.low.wartosc,
        },
        DensityTier::Medium => ReliefLandFractions {
            mountain: t.docelowy_udzial_gor.medium.wartosc,
            highland: t.docelowy_udzial_wzgorz.medium.wartosc,
        },
        DensityTier::High => ReliefLandFractions {
            mountain: t.docelowy_udzial_gor.high.wartosc,
            highland: t.docelowy_udzial_wzgorz.high.wartosc,
        },
    }
}

// ---------------------------------------------------------------------------------------------
// Granica mapy (gen-helpers.ts:1176-1406)
// ---------------------------------------------------------------------------------------------

/// Web `MAP_BORDER_OCEAN_HEXES` (:1177).
pub fn map_border_ocean_hexes() -> f64 {
    mapgen_terrain_class().brzeg_mapy.twardy_ocean_hex.wartosc
}

/// Web `MAP_MARGIN_LAND_ZONE_HEXES` (:1180).
pub fn map_margin_land_zone_hexes() -> f64 {
    mapgen_terrain_class()
        .brzeg_mapy
        .strefa_stopniowanego_ladu_hex
        .wartosc
}

/// Web `mapBorderWidth(_width, _height)` (:1183).
pub fn map_border_width(_width: f64, _height: f64) -> f64 {
    map_border_ocean_hexes()
}

/// Web `marginLandCapForBorderDistance(d)` (:1191): `None` = `null` (bez limitu pierscienia).
pub fn margin_land_cap_for_border_distance(d: f64) -> Option<f64> {
    if d < map_border_ocean_hexes() {
        return Some(0.0);
    }
    if d <= map_margin_land_zone_hexes() {
        return Some(
            mapgen_terrain_class()
                .brzeg_mapy
                .przyrost_limitu_ladu_na_pierscien
                .wartosc
                * (d - 1.0),
        );
    }
    None
}

/// Web `marginScatterScore(q, r, landScores)` (prywatna, :1198).
pub fn margin_scatter_score(q: i64, r: i64, land_scores: &HashMap<String, f64>) -> f64 {
    let base = land_scores.get(&hex_key(q, r)).copied().unwrap_or(0.0);
    let n = (js_to_int32(q as f64 * 73_856_093.0) ^ js_to_int32(r as f64 * 19_349_663.0)) & 0xffff;
    base + (f64::from(n) / f64::from(0xffff_u32))
        * mapgen_terrain_class()
            .brzeg_mapy
            .waga_rozproszenia_brzegu
            .wartosc
}

/// Web `countLandNeighborsInSet(hexes, q, r)` (prywatna, :1204).
pub fn count_land_neighbors_in_set(hexes: &HexRecord, q: i64, r: i64) -> i64 {
    let mut n = 0;
    for (dq, dr) in HEX_DIRECTIONS {
        if let Some(nh) = hexes.get(&hex_key(q + i64::from(dq), r + i64::from(dr))) {
            if !is_water_terrain_local(nh.terrain) {
                n += 1;
            }
        }
    }
    n
}

/// Web `keysAtBorderDistance(hexes, width, height, d)` (prywatna, :1213). Argument `hexes` weba
/// jest nieuzywany.
pub fn keys_at_border_distance(_hexes: &HexRecord, width: i64, height: i64, d: f64) -> Vec<String> {
    let mut out = Vec::new();
    for r in 0..height {
        for q in 0..width {
            if hex_border_distance(q as f64, r as f64, width as f64, height as f64) != d {
                continue;
            }
            out.push(hex_key(q, r));
        }
    }
    out
}

/// Web `setHexToMorze(hex)` (prywatna, :3325; lokalna kopia).
pub fn set_hex_to_morze(hex: &mut TerrainHex) {
    hex.terrain = Terrain::Sea;
    hex.overlay = Nakladka::Brak;
    hex.river_present = false;
    hex.river_edges.clear();
    hex.has_deposit = false;
}

/// Web `setHexToLaka(hex)` (prywatna, :3332; lokalna kopia).
pub fn set_hex_to_laka(hex: &mut TerrainHex) {
    hex.terrain = Terrain::Grassland;
    hex.overlay = Nakladka::Brak;
    hex.has_deposit = false;
}

/// Web `applyMarginalLandZoneCaps(hexes, landScores, width, height)` (:1233): limit ladu per
/// pierscien strefy brzegowej + poszczepiony uklad. Zwraca liczbe zmian.
pub fn apply_marginal_land_zone_caps(
    hexes: &mut HexRecord,
    land_scores: &HashMap<String, f64>,
    width: i64,
    height: i64,
    hooks: &dyn MarginZoneHooks,
) -> i64 {
    let params = &mapgen_terrain_class().brzeg_mapy;
    let mut adjusted: i64 = 0;
    let mut d = 0.0_f64;
    while d <= map_margin_land_zone_hexes() {
        let this_d = d;
        d += 1.0;
        let Some(cap) = margin_land_cap_for_border_distance(this_d) else {
            continue;
        };
        let ring = keys_at_border_distance(hexes, width, height, this_d);
        if ring.is_empty() {
            continue;
        }

        let is_water = |hexes: &HexRecord, k: &String| {
            is_water_terrain_local(
                hexes
                    .get(k)
                    .expect("web: hexes[k] undefined (TypeError)")
                    .terrain,
            )
        };
        let mut land: i64 = 0;
        for k in &ring {
            if !is_water(hexes, k) {
                land += 1;
            }
        }
        let target_land = js_round(ring.len() as f64 * cap);

        if (land as f64) > target_land {
            let land_keys: Vec<String> = ring
                .iter()
                .filter(|k| !is_water(hexes, k))
                .cloned()
                .collect();
            let sorted =
                hooks.sort_land_keys_for_erosion(&land_keys, hexes, land_scores, width, height);
            for k in &sorted {
                if (land as f64) <= target_land {
                    break;
                }
                set_hex_to_morze(
                    hexes
                        .get_mut(k)
                        .expect("web: hexes[k] undefined (TypeError)"),
                );
                land -= 1;
                adjusted += 1;
            }
        } else if (land as f64) < target_land {
            let mut morse_keys: Vec<String> = ring
                .iter()
                .filter(|k| is_water(hexes, k))
                .cloned()
                .collect();
            {
                let view: &HexRecord = hexes;
                js_array_sort_by(&mut morse_keys, |a, b| {
                    let (pq_a, pr_a) = parse_hex_key(a);
                    let (pq_b, pr_b) = parse_hex_key(b);
                    let sa = margin_scatter_score(pq_a as i64, pr_a as i64, land_scores);
                    let sb = margin_scatter_score(pq_b as i64, pr_b as i64, land_scores);
                    if (sb - sa).abs() > params.tolerancja_remisu_rozproszenia.wartosc {
                        return sb - sa;
                    }
                    let na = count_land_neighbors_in_set(view, pq_a as i64, pr_a as i64);
                    let nb = count_land_neighbors_in_set(view, pq_b as i64, pr_b as i64);
                    (na - nb) as f64
                });
            }
            for k in &morse_keys {
                if (land as f64) >= target_land {
                    break;
                }
                let (q, r) = parse_hex_key(k);
                if (count_land_neighbors_in_set(hexes, q as i64, r as i64) as f64)
                    >= params.max_sasiadow_ladu_przy_dosypywaniu.wartosc
                {
                    continue;
                }
                set_hex_to_laka(
                    hexes
                        .get_mut(k)
                        .expect("web: hexes[k] undefined (TypeError)"),
                );
                land += 1;
                adjusted += 1;
            }
        }
    }
    adjusted
}

/// Web `isInMapMarginZone(q, r, width, height)` (:1287).
pub fn is_in_map_margin_zone(q: f64, r: f64, width: f64, height: f64) -> bool {
    hex_border_distance(q, r, width, height) <= map_margin_land_zone_hexes()
}

/// Web `landMaskBorderFade(q, r, width, height)` (:1294): 0 w twardym oceanie, potem stopniowo.
pub fn land_mask_border_fade(q: f64, r: f64, width: f64, height: f64) -> f64 {
    let d = hex_border_distance(q, r, width, height);
    let Some(cap) = margin_land_cap_for_border_distance(d) else {
        return 1.0;
    };
    if cap <= 0.0 {
        return 0.0;
    }
    js_min(
        1.0,
        cap / mapgen_terrain_class()
            .brzeg_mapy
            .limit_pelnego_ladu_w_fade
            .wartosc,
    )
}

/// Web `mapCenterRadialBias(q, r, width, height)` (:1303): silniejszy lad blizej srodka mapy.
pub fn map_center_radial_bias(q: f64, r: f64, width: f64, height: f64) -> f64 {
    let c = &mapgen_terrain_class().srodek_mapy;
    let cx = (width - 1.0) / 2.0;
    let cy = (height - 1.0) / 2.0;
    let dx = (q - cx) / (cx + 0.5);
    let dy = (r - cy) / (cy + 0.5);
    let dist = (dx * dx + dy * dy).sqrt();
    js_max(
        c.minimum_biasu_radialnego.wartosc,
        1.0 - js_pow(
            dist / c.promien_biasu_radialnego.wartosc,
            c.wykladnik_biasu_radialnego.wartosc,
        ),
    )
}

/// Web `mapEdgeRectFade(q, r, width, height)` (:1313): prostokatny fade od krawedzi mapy.
pub fn map_edge_rect_fade(q: f64, r: f64, width: f64, height: f64) -> f64 {
    let min_margin = mapgen_terrain_class()
        .brzeg_mapy
        .minimum_marginesu_krawedzi_rect
        .wartosc;
    let b = map_border_width(width, height);
    let nq = q / js_max(1.0, width - 1.0);
    let nr = r / js_max(1.0, height - 1.0);
    let margin_q = b / js_max(1.0, width - 1.0);
    let margin_r = b / js_max(1.0, height - 1.0);
    js_min(
        js_min(
            js_min(nq, 1.0 - nq) / js_max(margin_q, min_margin),
            js_min(nr, 1.0 - nr) / js_max(margin_r, min_margin),
        ),
        1.0,
    )
}

/// Web `mapCenterDistanceNorm(q, r, width, height)` (prywatna, :1326).
pub fn map_center_distance_norm(q: f64, r: f64, width: f64, height: f64) -> f64 {
    let cx = (width - 1.0) / 2.0;
    let cy = (height - 1.0) / 2.0;
    let dx = (q - cx) / (cx + 0.5);
    let dy = (r - cy) / (cy + 0.5);
    (dx * dx + dy * dy).sqrt()
}

/// Web `hexBorderDistance(q, r, width, height)` (:1334).
pub fn hex_border_distance(q: f64, r: f64, width: f64, height: f64) -> f64 {
    js_min(js_min(js_min(q, r), width - 1.0 - q), height - 1.0 - r)
}

/// Web `isInMapBorder(q, r, width, height, buffer?)` (:1338); `buffer: None` = `undefined`.
pub fn is_in_map_border(q: f64, r: f64, width: f64, height: f64, buffer: Option<f64>) -> bool {
    let b = buffer.unwrap_or_else(|| map_border_width(width, height));
    hex_border_distance(q, r, width, height) < b
}

/// Web `isReliefCandidateHex(hex, q, r, width, height)` (prywatna, :1344).
pub fn is_relief_candidate_hex(hex: &TerrainHex, q: f64, r: f64, width: f64, height: f64) -> bool {
    if is_water_terrain_local(hex.terrain) {
        return false;
    }
    !is_in_map_border(q, r, width, height, None)
}

/// Web `countMapBorderHexes(width, height, buffer?)` (:1357).
pub fn count_map_border_hexes(width: i64, height: i64, buffer: Option<f64>) -> i64 {
    let b = buffer.unwrap_or_else(|| map_border_width(width as f64, height as f64));
    let mut n = 0;
    for r in 0..height {
        for q in 0..width {
            if is_in_map_border(q as f64, r as f64, width as f64, height as f64, Some(b)) {
                n += 1;
            }
        }
    }
    n
}

/// Web `findLandInMapBorder(hexes, width, height)` (:1369): lad/wybrzeze w buforze brzegu.
/// Uwaga (1:1): omija TYLKO `Morze` - `PlytkieMorze` w buforze tez jest zglaszane.
pub fn find_land_in_map_border(hexes: &HexRecord, width: i64, height: i64) -> Vec<String> {
    let b = map_border_width(width as f64, height as f64);
    let mut bad = Vec::new();
    for r in 0..height {
        for q in 0..width {
            if hex_border_distance(q as f64, r as f64, width as f64, height as f64) >= b {
                continue;
            }
            let key = hex_key(q, r);
            match hexes.get(&key) {
                Some(hex) if hex.terrain != Terrain::Sea => bad.push(key),
                _ => {}
            }
        }
    }
    bad
}

/// Web `enforceMapBorderOcean(hexes, width, height, buffer?)` (:1388): wymusza `Morze` w buforze.
/// Uwaga (1:1): `PlytkieMorze` tez jest konwertowane (i liczone).
pub fn enforce_map_border_ocean(
    hexes: &mut HexRecord,
    width: i64,
    height: i64,
    buffer: Option<f64>,
) -> i64 {
    let b = buffer.unwrap_or_else(|| map_border_width(width as f64, height as f64));
    let mut converted = 0;
    for r in 0..height {
        for q in 0..width {
            if !is_in_map_border(q as f64, r as f64, width as f64, height as f64, Some(b)) {
                continue;
            }
            let Some(hex) = hexes.get_mut(&hex_key(q, r)) else {
                continue;
            };
            if hex.terrain == Terrain::Sea {
                continue;
            }
            set_hex_to_morze(hex);
            converted += 1;
        }
    }
    converted
}
