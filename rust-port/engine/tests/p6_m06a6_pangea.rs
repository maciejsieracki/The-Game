//! P6.M06A6 (partia 1, R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1) - testy portu rodziny Pangei
//! i kontynentow wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`):
//! `erodePangeaBboxLowScoreRim` (:3551, instrumentowana kopia), `carvePangeaLongSideGulfs` (:3606,
//! instrumentowana kopia), `applyLandFractionByContinent` (:3701).
//! Wektory: `tests/p6_m06a6_vectors/*.json` (generator `gen-m06a6-pangea-vectors.mjs`, seed 20261101).
//! Mapa: `[klucz, terrain(serde)]`; NaN w wektorach zapisany jako napis "NaN".
//! `rebalanceLandFractionPangea` (:3667) NIE jest tu testowana (RUNDA-2: brak portu
//! `fillPangeaAnnularSeaCorridors` :4595 i `ensurePangeaSingleContinent` :4375).

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::data::derived::{parse_mapgen_landsea_pangea, MapgenLandseaPangeaFile};
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    apply_land_fraction_by_continent, carve_pangea_long_side_gulfs, erode_pangea_bbox_low_score_rim,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const ERODE_VECTORS: &str = include_str!("p6_m06a6_vectors/erode-vectors.json");
const CARVE_VECTORS: &str = include_str!("p6_m06a6_vectors/carve-vectors.json");
const CONTFRAC_VECTORS: &str = include_str!("p6_m06a6_vectors/contfrac-vectors.json");

fn load(json: &'static str, name: &str) -> &'static Vec<Value> {
    // jeden plik na kategorie; parsowanie raz na proces
    static ERODE: OnceLock<Value> = OnceLock::new();
    static CARVE: OnceLock<Value> = OnceLock::new();
    static CONTFRAC: OnceLock<Value> = OnceLock::new();
    let cell = match name {
        "erode" => &ERODE,
        "carve" => &CARVE,
        "contfrac" => &CONTFRAC,
        other => panic!("nieznana kategoria {other}"),
    };
    let v = cell.get_or_init(|| serde_json::from_str(json).expect("wektory parsuja sie"));
    v["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn qr(key: &str) -> (i64, i64) {
    let (a, b) = key.split_once(',').expect("klucz q,r");
    (a.parse().expect("q"), b.parse().expect("r"))
}

fn build_map(rows: &Value) -> HexRecord {
    let mut hexes = HexRecord::new();
    for row in rows.as_array().expect("mapa") {
        let a = row.as_array().expect("wiersz mapy");
        let key = a[0].as_str().expect("klucz").to_owned();
        let terrain: Terrain = serde_json::from_value(a[1].clone()).expect("terrain");
        let (q, r) = qr(&key);
        hexes.insert(key, TerrainHex::new(q, r, terrain));
    }
    hexes
}

fn build_scores(pairs: &Value) -> HashMap<String, f64> {
    pairs
        .as_array()
        .expect("scores")
        .iter()
        .map(|p| {
            let a = p.as_array().expect("para");
            (
                a[0].as_str().expect("klucz").to_owned(),
                a[1].as_f64().expect("score"),
            )
        })
        .collect()
}

fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba"),
    }
}

fn dump_terrains(hexes: &HexRecord) -> Vec<(String, String)> {
    hexes
        .iter()
        .map(|(k, h)| {
            let name = serde_json::to_value(h.terrain).expect("terrain name");
            (k.clone(), name.as_str().expect("nazwa").to_owned())
        })
        .collect()
}

fn expected_terrains(v: &Value) -> Vec<(String, String)> {
    v.as_array()
        .expect("terrains")
        .iter()
        .map(|p| {
            let a = p.as_array().expect("para");
            (
                a[0].as_str().unwrap().to_owned(),
                a[1].as_str().unwrap().to_owned(),
            )
        })
        .collect()
}

fn data() -> MapgenLandseaPangeaFile {
    parse_mapgen_landsea_pangea().expect("mapgen-landsea-pangea.json")
}

#[test]
fn pangea_data_matches_web_constants() {
    // web: erode :3551 (0.74, 1200, pas 2, tolerancja 0.02); carve :3606 (80, 1.85, 900,
    // 0.28, min 3, 0.42, szum 0.08/40/3, waga 0.15)
    let p = data();
    assert_eq!(p.erode_docelowe_wypelnienie_bbox, 0.74);
    assert_eq!(p.erode_max, 1200);
    assert_eq!(p.erode_pas_brzegu, 2.0);
    assert_eq!(p.erode_tolerancja_score, 0.02);
    assert_eq!(p.carve_min_liczba_ladu, 80);
    assert_eq!(p.carve_max_aspect, 1.85);
    assert_eq!(p.carve_max_wyciec, 900);
    assert_eq!(p.carve_glebokosc_udzial, 0.28);
    assert_eq!(p.carve_glebokosc_min, 3.0);
    assert_eq!(p.carve_blisko_srodka_udzial, 0.42);
    assert_eq!(p.carve_szum_skala, 0.08);
    assert_eq!(p.carve_szum_przesuniecie, 40.0);
    assert_eq!(p.carve_szum_oktawy, 3);
    assert_eq!(p.carve_szum_waga, 0.15);
}

#[test]
fn erode_pangea_bbox_low_score_rim_matches_web() {
    let cs = load(ERODE_VECTORS, "erode");
    assert!(cs.len() >= 200, "za malo przypadkow erozji: {}", cs.len());
    let mut nonzero = 0usize;
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let target = num(&c["target"]);
        let max = c["max"].as_u64().unwrap() as usize;
        let eroded = erode_pangea_bbox_low_score_rim(&mut hexes, &scores, target, max);
        assert_eq!(
            eroded,
            c["expect"]["eroded"].as_u64().unwrap() as usize,
            "liczba erozji, przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "mapa, przypadek {}",
            c["id"]
        );
        if eroded > 0 {
            nonzero += 1;
        }
    }
    assert!(nonzero >= 50, "zbyt malo przypadkow z erozja: {nonzero}");
}

#[test]
fn erode_bbox_threshold_n_minus_1_n_n_plus_1() {
    // bbox lądu 10x10 (pole 100): fill = L/100. Porownanie `bboxFill <= target` (web :3567):
    // L=73 i L=74 -> brak erozji (74/100 == 0.74 IEEE); L=75 -> dokladnie 1 erozja (75->74).
    let rim_land = |l: usize| -> HexRecord {
        let mut keys: Vec<(i64, i64)> = vec![(0, 0), (9, 9), (0, 9), (9, 0)];
        for r in 0..10 {
            for q in 0..10 {
                if !keys.contains(&(q, r)) {
                    keys.push((q, r));
                }
            }
        }
        let mut hexes = HexRecord::new();
        for q in 0..12 {
            for r in 0..12 {
                let inside = keys.iter().take(l).any(|&(a, b)| a == q && b == r);
                let terrain = if inside {
                    Terrain::Grassland
                } else {
                    Terrain::Sea
                };
                hexes.insert(format!("{q},{r}"), TerrainHex::new(q, r, terrain));
            }
        }
        hexes
    };
    let scores = HashMap::new();
    for (l, expect) in [(73usize, 0usize), (74, 0), (75, 1)] {
        let mut hexes = rim_land(l);
        let eroded = erode_pangea_bbox_low_score_rim(&mut hexes, &scores, 0.74, 1200);
        assert_eq!(eroded, expect, "L={l}");
    }
    // limit maxErode: 0 -> nic; 1 -> dokladnie 1 mimo zbyt wysokiej fill
    let mut hexes = rim_land(100);
    assert_eq!(
        erode_pangea_bbox_low_score_rim(&mut hexes, &scores, 0.74, 0),
        0
    );
    let mut hexes = rim_land(100);
    assert_eq!(
        erode_pangea_bbox_low_score_rim(&mut hexes, &scores, 0.74, 1),
        1
    );
}

#[test]
fn erode_empty_land_returns_zero() {
    let mut hexes = HexRecord::new();
    hexes.insert("0,0".into(), TerrainHex::new(0, 0, Terrain::Sea));
    assert_eq!(
        erode_pangea_bbox_low_score_rim(&mut hexes, &HashMap::new(), 0.74, 1200),
        0
    );
    let mut empty = HexRecord::new();
    assert_eq!(
        erode_pangea_bbox_low_score_rim(&mut empty, &HashMap::new(), 0.74, 1200),
        0
    );
}

#[test]
fn carve_pangea_long_side_gulfs_matches_web() {
    let cs = load(CARVE_VECTORS, "carve");
    assert!(cs.len() >= 200, "za malo przypadkow zatok: {}", cs.len());
    let mut nonzero = 0usize;
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let perm: [u8; 256] = {
            let arr = c["perm"].as_array().expect("perm");
            let mut out = [0u8; 256];
            for (i, v) in arr.iter().enumerate() {
                out[i] = v.as_u64().expect("bajt") as u8;
            }
            out
        };
        let max_aspect = num(&c["maxAspect"]);
        let max_carve = c["maxCarve"].as_u64().unwrap() as usize;
        let carved =
            carve_pangea_long_side_gulfs(&mut hexes, &scores, &perm, max_aspect, max_carve);
        assert_eq!(
            carved,
            c["expect"]["carved"].as_u64().unwrap() as usize,
            "liczba wyciec, przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "mapa, przypadek {}",
            c["id"]
        );
        if carved > 0 {
            nonzero += 1;
        }
    }
    assert!(nonzero >= 50, "zbyt malo przypadkow z wycieciem: {nonzero}");
}

#[test]
fn carve_threshold_79_and_80_land_hexes() {
    // web :3614 `landKeys.length < 80` -> 79 lądu: 0; 80 lądu w bboxie 40x10 (aspekt 4): ruch.
    let make = |l: usize| -> HexRecord {
        // blok lądu q 1..=40, r 1..=10 (40x10); cztery rogi zawsze lad (bbox = blok),
        // reszta bloku w kolejnosci wierszowej az do l lądu.
        let corners = [(1i64, 1i64), (40, 1), (1, 10), (40, 10)];
        let mut land: Vec<(i64, i64)> = corners.to_vec();
        for r in 1..=10 {
            for q in 1..=40 {
                if !corners.contains(&(q, r)) && land.len() < l {
                    land.push((q, r));
                }
            }
        }
        let mut hexes = HexRecord::new();
        for q in 0..42 {
            for r in 0..12 {
                let terrain = if land.contains(&(q, r)) {
                    Terrain::Grassland
                } else {
                    Terrain::Sea
                };
                hexes.insert(format!("{q},{r}"), TerrainHex::new(q, r, terrain));
            }
        }
        hexes
    };
    let perm = civ_engine::domain::mapgen::prims::build_perm_table({
        let mut s = 7u32;
        move || {
            s = s.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
            f64::from(s) / 4_294_967_296.0
        }
    });
    let mut h79 = make(79);
    let n79 = h79
        .iter()
        .filter(|(_, h)| h.terrain != Terrain::Sea)
        .count();
    let mut h80 = make(80);
    let n80 = h80
        .iter()
        .filter(|(_, h)| h.terrain != Terrain::Sea)
        .count();
    assert_eq!(n79, 79);
    assert_eq!(n80, 80);
    assert_eq!(
        carve_pangea_long_side_gulfs(&mut h79, &HashMap::new(), &perm, 1.85, 900),
        0
    );
    assert!(carve_pangea_long_side_gulfs(&mut h80, &HashMap::new(), &perm, 1.85, 900) > 0);
}

#[test]
fn carve_aspect_exactly_1_85_does_not_carve() {
    // web :3620 `aspect <= maxAspect` -> return 0. Bbox 37x20: 37/20 == 1.85 (IEEE).
    let mut hexes = HexRecord::new();
    for q in 0..37 {
        for r in 0..20 {
            // pelny prostokat lądu: 740 hexow >= 80
            hexes.insert(
                format!("{q},{r}"),
                TerrainHex::new(q, r, Terrain::Grassland),
            );
        }
    }
    let perm = civ_engine::domain::mapgen::prims::build_perm_table(|| 0.5);
    assert_eq!(
        carve_pangea_long_side_gulfs(&mut hexes, &HashMap::new(), &perm, 1.85, 900),
        0
    );
}

#[test]
fn apply_land_fraction_by_continent_matches_web() {
    let cs = load(CONTFRAC_VECTORS, "contfrac");
    assert!(
        cs.len() >= 200,
        "za malo przypadkow kontynentow: {}",
        cs.len()
    );
    let mut nonzero = 0usize;
    let mut nan_cases = 0usize;
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let mut cont: HashMap<String, i64> = HashMap::new();
        for p in c["continentOf"].as_array().expect("continentOf") {
            let a = p.as_array().expect("para");
            cont.insert(a[0].as_str().unwrap().to_owned(), a[1].as_i64().unwrap());
        }
        let n = c["nContinents"].as_u64().unwrap() as usize;
        let target = num(&c["target"]);
        if target.is_nan() {
            nan_cases += 1;
        }
        let dims = match &c["dims"] {
            Value::Null => None,
            d => Some((d[0].as_i64().unwrap(), d[1].as_i64().unwrap())),
        };
        let adjusted =
            apply_land_fraction_by_continent(&mut hexes, &scores, &cont, n, target, dims);
        assert_eq!(
            adjusted,
            c["expect"]["adjusted"].as_u64().unwrap() as usize,
            "zmiany, przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "mapa, przypadek {}",
            c["id"]
        );
        if adjusted > 0 {
            nonzero += 1;
        }
    }
    assert!(
        nonzero >= 100,
        "zbyt malo przypadkow ze zmianami: {nonzero}"
    );
    assert!(nan_cases >= 10, "za malo przypadkow NaN: {nan_cases}");
}

#[test]
fn apply_land_fraction_by_continent_zero_continents_is_noop() {
    // ZALOZENIE Z-N0: web rzuca TypeError; Rust nie zmienia mapy.
    let mut hexes = HexRecord::new();
    hexes.insert("0,0".into(), TerrainHex::new(0, 0, Terrain::Sea));
    let before = dump_terrains(&hexes);
    let adjusted = apply_land_fraction_by_continent(
        &mut hexes,
        &HashMap::new(),
        &HashMap::new(),
        0,
        0.5,
        None,
    );
    assert_eq!(adjusted, 0);
    assert_eq!(dump_terrains(&hexes), before);
}
