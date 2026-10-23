//! Wspolne narzedzia testow P6.M05A (dolaczane przez `#[path]`; plik lezy w `p6_m05a_vectors/`, wiec
//! nie jest osobnym crate'm testowym). Wektory: `web-vectors.json` z URUCHOMIONEGO weba
//! (generator `gen-m05a-vectors.mjs` w runie). Liczby f64 w wektorach sa TEKSTEM i porownujemy je
//! bit-w-bit (`to_bits`; wszystkie NaN sa dla JS jednym NaN, wiec sprowadzane do kanonicznego).
#![allow(dead_code)]

use std::cell::Cell;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use civ_engine::domain::map_generator::{Terrain, WorldType};
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::prims::{mulberry32_step, mulberry32_unit};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex, TerrainScratch};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("web-vectors.json");

pub fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

pub fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

pub fn stat(name: &str) -> i64 {
    web()["stats"][name].as_i64().unwrap_or(0)
}

pub fn i(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| panic!("i64: {v}"))
}

pub fn u(v: &Value) -> usize {
    usize::try_from(i(v)).expect("usize")
}

pub fn s(v: &Value) -> &str {
    v.as_str().unwrap_or_else(|| panic!("str: {v}"))
}

/// f64 zapisany jako tekst (`Infinity`, `-Infinity`, `NaN`, `-0` tez).
pub fn fv(v: &Value) -> f64 {
    let t = s(v);
    match t {
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "NaN" => f64::NAN,
        "-0" => -0.0,
        _ => t.parse::<f64>().unwrap_or_else(|_| panic!("f64: {t}")),
    }
}

pub fn bits(x: f64) -> u64 {
    if x.is_nan() {
        f64::NAN.to_bits()
    } else {
        x.to_bits()
    }
}

pub fn same_f64(a: f64, b: f64) -> bool {
    bits(a) == bits(b)
}

pub fn assert_f64(actual: f64, expected: f64, what: &str) {
    assert!(
        same_f64(actual, expected),
        "{what}: rust={actual:?} (0x{:016x}) web={expected:?} (0x{:016x})",
        bits(actual),
        bits(expected)
    );
}

pub fn fnv1a64(text: &str) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in text.as_bytes() {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

pub fn idx_hash(arr: &[usize]) -> String {
    let joined: Vec<String> = arr.iter().map(ToString::to_string).collect();
    fnv1a64(&joined.join(","))
}

pub fn cell_hash(cell: &[(i64, i64)]) -> String {
    let joined: Vec<String> = cell.iter().map(|(q, r)| format!("{q},{r}")).collect();
    fnv1a64(&joined.join(";"))
}

// ---------------------------------------------------------------------------------------------
// Slowniki enumow weba
// ---------------------------------------------------------------------------------------------

pub fn terrain_from_web(key: &str) -> Terrain {
    match key {
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "wzgorza" => Terrain::Hills,
        "gory" => Terrain::Mountains,
        "plytkie_morze" => Terrain::ShallowSea,
        "morze" => Terrain::Sea,
        "pustynia" => Terrain::Desert,
        "polarny" => Terrain::Polar,
        other => panic!("nieznany teren weba {other}"),
    }
}

pub fn terrain_from_code(code: i64) -> Terrain {
    let list = web()["enums"]["tb"].as_array().expect("enums.tb");
    terrain_from_web(s(&list[usize::try_from(code).expect("kod tb")]))
}

pub fn terrain_code(t: Terrain) -> usize {
    static TABLE: OnceLock<Vec<(Terrain, usize)>> = OnceLock::new();
    let table = TABLE.get_or_init(|| {
        let list = web()["enums"]["tb"].as_array().expect("enums.tb");
        list.iter()
            .enumerate()
            .map(|(n, v)| (terrain_from_web(s(v)), n))
            .collect()
    });
    table
        .iter()
        .find(|(x, _)| *x == t)
        .map(|(_, n)| *n)
        .expect("kod terenu")
}

pub fn nakladka_from_code(code: i64) -> Nakladka {
    let list = web()["enums"]["nak"].as_array().expect("enums.nak");
    Nakladka::from_key(s(&list[usize::try_from(code).expect("kod nak")])).expect("nakladka")
}

pub fn nakladka_code(n: Nakladka) -> usize {
    static TABLE: OnceLock<Vec<(Nakladka, usize)>> = OnceLock::new();
    let table = TABLE.get_or_init(|| {
        let list = web()["enums"]["nak"].as_array().expect("enums.nak");
        list.iter()
            .enumerate()
            .map(|(k, v)| (Nakladka::from_key(s(v)).expect("nakladka"), k))
            .collect()
    });
    table
        .iter()
        .find(|(x, _)| *x == n)
        .map(|(_, k)| *k)
        .expect("kod nakladki")
}

pub fn typ_from_web(key: &str) -> WorldType {
    match key {
        "kontynenty" => WorldType::Continents,
        "pangea" => WorldType::Pangea,
        "wyspy" => WorldType::Islands,
        "ziemia" => WorldType::Earth,
        other => panic!("nieznany typ swiata {other}"),
    }
}

pub fn tier_from_web(key: &str) -> DensityTier {
    DensityTier::from_key(key).unwrap_or_else(|| panic!("nieznany tier {key}"))
}

// ---------------------------------------------------------------------------------------------
// Pula map
// ---------------------------------------------------------------------------------------------

pub fn key_of(q: i64, r: i64) -> String {
    format!("{q},{r}")
}

/// Mapa z puli: `HexRecord` + wpisy `scratch` (tylko `mtn_noise` ma znaczenie w zakresie M05A).
#[derive(Clone)]
pub struct PoolMap {
    pub id: usize,
    pub w: f64,
    pub h: f64,
    pub hexes: HexRecord,
    pub scratch: HashMap<String, TerrainScratch>,
    /// Klucze w kolejnosci wstawiania (indeks wektorow = indeks tutaj).
    pub keys: Vec<String>,
    /// Stan poczatkowy (`dump_state`) - baza dla list zmian.
    pub base: (String, String, String),
}

/// Mapa z puli (budowana raz, potem klonowana).
pub fn pool_map(id: usize) -> PoolMap {
    static CACHE: OnceLock<Mutex<HashMap<usize, PoolMap>>> = OnceLock::new();
    let mut guard = CACHE
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .expect("cache map");
    guard
        .entry(id)
        .or_insert_with(|| build_pool_map(id))
        .clone()
}

fn build_pool_map(id: usize) -> PoolMap {
    let m = &web()["maps"][id];
    assert_eq!(u(&m["id"]), id);
    let qs = m["q"].as_array().expect("q");
    let rs = m["r"].as_array().expect("r");
    let tb = s(&m["tb"]).as_bytes();
    let nak = s(&m["nak"]).as_bytes();
    let riv = s(&m["riv"]).as_bytes();
    let zl = s(&m["zl"]).as_bytes();
    let noise = m["noise"].as_array().expect("noise");
    let mut hexes = HexRecord::new();
    let mut scratch = HashMap::new();
    let mut keys = Vec::new();
    for n in 0..qs.len() {
        let (q, r) = (i(&qs[n]), i(&rs[n]));
        let mut hex = TerrainHex::new(q, r, terrain_from_code(i64::from(tb[n] - b'0')));
        hex.overlay = nakladka_from_code(i64::from(nak[n] - b'0'));
        hex.river_present = riv[n] == b'1';
        if hex.river_present {
            hex.river_edges = vec![0, 3];
        }
        hex.has_deposit = zl[n] == b'1';
        let key = key_of(q, r);
        hexes.insert(key.clone(), hex);
        keys.push(key.clone());
        if !noise[n].is_null() {
            scratch.insert(
                key,
                TerrainScratch {
                    elev_continental: 0.0,
                    land_mask: 0.0,
                    mtn_noise: fv(&noise[n]),
                    for_noise: 0.0,
                    des_noise: 0.0,
                },
            );
        }
    }
    let base = dump_state(&hexes);
    PoolMap {
        id,
        w: f64::from(u32::try_from(i(&m["w"])).expect("w")),
        h: f64::from(u32::try_from(i(&m["h"])).expect("h")),
        hexes,
        scratch,
        keys,
        base,
    }
}

/// Stan terenu / nakladki / zloza jako trzy napisy (jak `dump` w generatorze).
pub fn dump_state(hexes: &HexRecord) -> (String, String, String) {
    let (mut tb, mut nak, mut zl) = (String::new(), String::new(), String::new());
    for (key, h) in hexes.iter() {
        assert_eq!(key, &key_of(h.q, h.r), "klucz != coords");
        tb.push_str(&terrain_code(h.terrain).to_string());
        nak.push_str(&nakladka_code(h.overlay).to_string());
        zl.push(if h.has_deposit { '1' } else { '0' });
    }
    (tb, nak, zl)
}

pub fn state_hash(hexes: &HexRecord) -> String {
    let (tb, nak, zl) = dump_state(hexes);
    fnv1a64(&format!("{tb}|{nak}|{zl}"))
}

/// Zmiany wzgledem stanu wejsciowego: `[indeks, tb, nak, zl]` (znaki).
pub fn diff_of(
    base: &(String, String, String),
    hexes: &HexRecord,
) -> Vec<(usize, char, char, char)> {
    let a = dump_state(hexes);
    let (bt, bn, bz) = (base.0.as_bytes(), base.1.as_bytes(), base.2.as_bytes());
    let (at, an, az) = (a.0.as_bytes(), a.1.as_bytes(), a.2.as_bytes());
    let mut d = Vec::new();
    for n in 0..bt.len() {
        if bt[n] != at[n] || bn[n] != an[n] || bz[n] != az[n] {
            d.push((n, char::from(at[n]), char::from(an[n]), char::from(az[n])));
        }
    }
    d
}

pub fn expected_diff(v: &Value) -> Vec<(usize, char, char, char)> {
    v.as_array()
        .expect("diff")
        .iter()
        .map(|row| {
            let ch = |x: &Value| s(x).chars().next().expect("znak");
            (u(&row[0]), ch(&row[1]), ch(&row[2]), ch(&row[3]))
        })
        .collect()
}

/// Sprawdza stan po operacji: lista zmian i skrot calego stanu.
pub fn assert_state(base: &(String, String, String), hexes: &HexRecord, case: &Value, what: &str) {
    assert_eq!(
        diff_of(base, hexes),
        expected_diff(&case["diff"]),
        "{what}: zmiany stanu"
    );
    assert_eq!(state_hash(hexes), s(&case["hash"]), "{what}: skrot stanu");
}

/// `continentOf` z formuly generatora (wejscie, nie logika).
pub fn cont_map(pm: &PoolMap, n: i64, variant: i64) -> HashMap<String, f64> {
    let mut cont = HashMap::new();
    for (idx, key) in pm.keys.iter().enumerate() {
        let hex = pm.hexes.get(key).expect("hex");
        if hex.terrain.is_water() {
            continue;
        }
        let i = i64::try_from(idx).expect("idx");
        if i % 19 == 5 {
            continue;
        }
        let mut v = (i * 7 + i / 5) % n;
        if variant == 2 {
            if i % 23 == 0 {
                v = n + 5;
            } else if i % 29 == 0 {
                v = -3;
            } else if i % 31 == 0 {
                v = n;
            }
        }
        cont.insert(key.clone(), v as f64);
    }
    cont
}

/// Generator `mulberry32(seed)` jak w webie; zlicza wywolania.
pub struct SeedRand {
    state: Cell<u32>,
    calls: Cell<usize>,
}

impl SeedRand {
    pub fn new(seed: i64) -> Self {
        Self {
            state: Cell::new(u32::try_from(seed).expect("ziarno u32")),
            calls: Cell::new(0),
        }
    }

    pub fn draw(&self) -> f64 {
        let (next, out) = mulberry32_step(self.state.get());
        self.state.set(next);
        self.calls.set(self.calls.get() + 1);
        mulberry32_unit(out)
    }

    pub fn calls(&self) -> usize {
        self.calls.get()
    }
}

/// Masy ladu mapy z puli (liczone przez Rust raz; zgodnosc z webem sprawdza test `masses`).
pub type MassList = Arc<Vec<Vec<String>>>;

pub fn masses(id: usize) -> MassList {
    use civ_engine::domain::mapgen::relief::group_land_mass_keys;
    static CACHE: OnceLock<Mutex<HashMap<usize, MassList>>> = OnceLock::new();
    let mut guard = CACHE
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .expect("cache masy");
    Arc::clone(
        guard
            .entry(id)
            .or_insert_with(|| Arc::new(group_land_mass_keys(&pool_map(id).hexes))),
    )
}

type CellList = Arc<Vec<(String, Vec<(i64, i64)>)>>;
type CellKey = (usize, usize, u64);

/// Komorki masy dla rozmiaru siatki (cache).
fn mass_cells(id: usize, mass_idx: usize, size: f64) -> CellList {
    use civ_engine::domain::mapgen::relief::land_hexes_by_coverage_cell;
    static CACHE: OnceLock<Mutex<HashMap<CellKey, CellList>>> = OnceLock::new();
    let mut guard = CACHE
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .expect("cache komorki");
    Arc::clone(
        guard
            .entry((id, mass_idx, size.to_bits()))
            .or_insert_with(|| Arc::new(land_hexes_by_coverage_cell(&masses(id)[mass_idx], size))),
    )
}

/// Komorka z odwolania `{map, massIdx, size, cellIdx, len, cellHash}`: liczona przez Rust
/// (`group_land_mass_keys`, `land_hexes_by_coverage_cell`), a zgodnosc z webem sprawdzana skrotem.
pub fn cell_from_ref(pm: &PoolMap, case: &Value) -> Vec<(i64, i64)> {
    let cells = mass_cells(pm.id, u(&case["massIdx"]), fv_num(&case["size"]));
    let cell = cells[u(&case["cellIdx"])].1.clone();
    assert_eq!(cell.len(), u(&case["len"]), "dlugosc komorki");
    assert_eq!(
        cell_hash(&cell),
        s(&case["cellHash"]),
        "skrot komorki: mapa {} masa {} rozmiar {} komorka {}",
        pm.id,
        case["massIdx"],
        case["size"],
        case["cellIdx"]
    );
    cell
}

/// Liczba JSON (nie tekst) jako f64.
pub fn fv_num(v: &Value) -> f64 {
    v.as_f64().unwrap_or_else(|| panic!("liczba: {v}"))
}
