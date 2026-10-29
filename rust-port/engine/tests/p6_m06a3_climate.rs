//! P6.M06A3 (runda 1, partia 1) - testy portu lad/morze/wybrzeze A3 wzgledem wektorow z URUCHOMIONEGO weba.
//! Symbole partii 1: `enforceLatitudinalOceanBuffer` (:3339), `climateBandBaseTerrain` (:3360, prywatna),
//! `applyClimateBandsToHexes` (:3380), `enforceEarthTemplateOnHexes` (:3418).
//! Wektory: `tests/p6_m06a3_vectors/web-vectors.json` (generator `gen-m06a3-vectors.mjs`, pin `edb8fb56`,
//! seed 20261029). `climateBandBaseTerrain` jest prywatna w pinie: generator uruchamia jej kopie z jednym
//! dopisanym `export` (logika bez zmian; sha oryginalu w meta).

use std::sync::OnceLock;

use civ_engine::domain::map_generator::{ClimateBand, Terrain};
use civ_engine::domain::mapgen::landsea::{
    apply_climate_bands_to_hexes, climate_band_base_terrain, climate_base_from_hash,
    enforce_earth_template_on_hexes, enforce_latitudinal_ocean_buffer,
};
use civ_engine::domain::mapgen::prims::latitudinal_ocean_buffer_rows;
use civ_engine::domain::mapgen::terrain_class::{hash_int3, HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m06a3_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn key_qr(key: &str) -> (i64, i64) {
    let (a, b) = key.split_once(',').expect("klucz q,r");
    (a.parse().expect("q"), b.parse().expect("r"))
}

/// Wczytuje mape z wektora w kolejnosci wstawiania (jak `Object.entries`).
fn load_map(entries: &Value) -> HexRecord {
    let mut rec = HexRecord::new();
    for e in entries.as_array().expect("mapa") {
        let a = e.as_array().expect("wpis");
        let key = a[0].as_str().expect("klucz").to_string();
        let (q, r) = key_qr(&key);
        let terrain: Terrain = serde_json::from_value(a[1].clone()).expect("terrain");
        let mut hex = TerrainHex::new(q, r, terrain);
        hex.overlay = Nakladka::from_key(a[2].as_str().expect("nakladka")).expect("nakladka key");
        hex.has_deposit = a[3].as_i64().expect("zloze") == 1;
        hex.river_present = a[4].as_i64().expect("rzeka") == 1;
        let n = a[5].as_u64().expect("krawedzie") as usize;
        hex.river_edges = vec![0; n];
        rec.insert(key, hex);
    }
    rec
}

fn u32_field(case: &Value, name: &str) -> u32 {
    u32::try_from(case[name].as_u64().unwrap_or_else(|| panic!("pole {name}"))).expect("u32")
}

#[test]
fn vectors_meta_pin_and_counts() {
    let meta = &web()["meta"];
    assert_eq!(meta["pin"].as_str(), Some("edb8fb56"));
    assert_eq!(
        meta["gen_helpers_sha256_original"].as_str(),
        Some("ab934703990ba00e71a801eb0b6fcefeb0906c6bd4ded477c7162361307842de"),
        "wektory musza pochodzic z tego samego gen-helpers.ts co M06A/M06A2"
    );
    for name in [
        "enforce_latitudinal_ocean_buffer",
        "climate_band_base_terrain",
        "apply_climate_bands_to_hexes",
        "enforce_earth_template_on_hexes",
    ] {
        assert!(!cases(name).is_empty(), "{name} puste");
    }
}

#[test]
fn enforce_latitudinal_ocean_buffer_matches_web_with_boundaries() {
    // Trafienia wierszy wzgledem granicy bufora: rel = r - buf (gorna granica) i r - (H - buf) (dolna).
    let mut hits_top = [0usize; 3]; // rel -1, 0, +1
    let mut hits_bottom = [0usize; 3];
    for case in cases("enforce_latitudinal_ocean_buffer") {
        let w = u32_field(case, "w");
        let h = u32_field(case, "h");
        let is_earth = case["is_earth"].as_bool().expect("is_earth");
        let buf = i64::from(u32_field(case, "buf"));
        assert_eq!(
            buf,
            i64::from(latitudinal_ocean_buffer_rows(h, is_earth)),
            "bufor {}",
            case["name"]
        );
        let mut hexes = load_map(&case["input"]);
        let n = enforce_latitudinal_ocean_buffer(&mut hexes, w, h, is_earth);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
        let hi = i64::from(h);
        for rel in -1..=1i64 {
            let row_top = buf + rel;
            if (0..hi).contains(&row_top) {
                hits_top[(rel + 1) as usize] += 1;
            }
            let row_bottom = hi - buf + rel;
            if (0..hi).contains(&row_bottom) {
                hits_bottom[(rel + 1) as usize] += 1;
            }
        }
    }
    assert!(
        hits_top.iter().all(|&c| c > 0),
        "granica gorna bez trafien N-1/N/N+1: {hits_top:?}"
    );
    assert!(
        hits_bottom.iter().all(|&c| c > 0),
        "granica dolna bez trafien N-1/N/N+1: {hits_bottom:?}"
    );
}

#[test]
fn climate_band_base_terrain_matches_web() {
    let mut checked = 0usize;
    for case in cases("climate_band_base_terrain") {
        let q = case["q"].as_i64().expect("q");
        let r = case["r"].as_i64().expect("r");
        let seed = case["seed"].as_i64().expect("seed") as f64;
        let hash_web = case["hash"].as_f64().expect("hash");
        // Hasz z weba to u/2^32 (dokladnie dyadyczny). serde_json bez `float_roundtrip` moze oddac
        // blad 1 ULP przy parsowaniu, wiec porownujemy calkowite u = hash * 2^32 (blad << 0.5).
        let u_web = (hash_web * 4_294_967_296.0).round() as u64;
        let u_rust = (hash_int3(q as f64, r as f64, seed) * 4_294_967_296.0).round() as u64;
        assert_eq!(u_rust, u_web, "hashInt3 ({q},{r},{seed})");
        let band_name = case["band"].as_str().expect("band");
        if band_name == "hash_only" {
            continue;
        }
        let band: ClimateBand =
            serde_json::from_value(Value::String(band_name.to_string())).expect("climate band");
        let want: Terrain = serde_json::from_value(Value::String(web_terrain_name(
            case["out"].as_str().expect("out"),
        )))
        .expect("terrain");
        assert_eq!(
            climate_band_base_terrain(band, q, r, seed),
            want,
            "{band_name} ({q},{r},{seed})"
        );
        checked += 1;
    }
    assert!(checked > 500, "za malo punktow: {checked}");
}

/// Wektory wpisuja terrain w nazwach weba (`laka`...) lub jako nazwy Rust; mapowanie do serde.
fn web_terrain_name(out: &str) -> String {
    match out {
        "Laka" | "Rownina" | "Wzgorza" | "Gory" | "PlytkieMorze" | "Morze" | "Pustynia"
        | "Polarny" => out.to_string(),
        other => panic!("nieznany teren wektora: {other}"),
    }
}

#[test]
fn climate_base_from_hash_threshold_boundaries() {
    // Oracle galezi: kod webu (:3360-3378), `h < prog` -> pierwsza galaz. Wartosci N-1 / N / N+1 to
    // nastepne po progu floaty (prog - eps*prog, prog, prog + eps*prog). Hasz nie jest wartoscia progowa
    // dla zadnego punktu, wiec granice sa sprawdzane przez te funkcje, a nie przez wektory z hashInt3.
    let cases_thr: [(ClimateBand, f64, Terrain, Terrain); 3] = [
        (ClimateBand::Desert, 0.5, Terrain::Desert, Terrain::Plains),
        (
            ClimateBand::PlainsNorth,
            0.7,
            Terrain::Plains,
            Terrain::Grassland,
        ),
        (
            ClimateBand::TemperateNorth,
            0.85,
            Terrain::Grassland,
            Terrain::Plains,
        ),
    ];
    for (band, t, below, at_or_above) in cases_thr {
        let eps = t * f64::EPSILON;
        assert_eq!(climate_base_from_hash(band, t - eps), below, "N-1 {band:?}");
        assert_eq!(climate_base_from_hash(band, t), at_or_above, "N {band:?}");
        assert_eq!(
            climate_base_from_hash(band, t + eps),
            at_or_above,
            "N+1 {band:?}"
        );
    }
    assert_eq!(
        climate_base_from_hash(ClimateBand::PolarNorth, 0.0),
        Terrain::Polar
    );
    assert_eq!(
        climate_base_from_hash(ClimateBand::PolarSouth, 0.99),
        Terrain::Polar
    );
}

#[test]
fn apply_climate_bands_to_hexes_matches_web() {
    for case in cases("apply_climate_bands_to_hexes") {
        let h = u32_field(case, "h");
        let seed = case["seed"].as_i64().expect("seed") as f64;
        let is_earth = case["is_earth"].as_bool().expect("is_earth");
        let mut hexes = load_map(&case["input"]);
        let n = apply_climate_bands_to_hexes(&mut hexes, h, seed, is_earth);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
    }
}

#[test]
fn enforce_earth_template_on_hexes_matches_web() {
    for case in cases("enforce_earth_template_on_hexes") {
        let w = u32_field(case, "w");
        let h = u32_field(case, "h");
        let mut hexes = load_map(&case["input"]);
        let n = enforce_earth_template_on_hexes(&mut hexes, w, h);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
    }
}

#[test]
fn climate_threshold_web_vectors_cover_n_minus_1_n_plus_1() {
    // Runda 2 (Q1): punkty z URUCHOMIONEGO weba, ktorych hasz to dokladnie u = ceil(prog*2^32) + d, d in {-1, 0, +1}.
    // Dla kazdego progu (0.5 / 0.7 / 0.85) musza istniec wszystkie trzy wartosci; hasz z weba i z Rust
    // musi byc rowny calkowitemu u (bez tolerancji), a galaz wyboru z weba == Rust.
    let mut seen: std::collections::BTreeSet<(u64, i64)> = std::collections::BTreeSet::new();
    for case in cases("climate_band_base_terrain") {
        let Some(u) = case.get("u").and_then(Value::as_u64) else {
            continue;
        };
        let t = case["threshold"].as_f64().expect("threshold");
        let ceil = (t * 4_294_967_296.0).ceil() as u64;
        let d = u as i64 - ceil as i64;
        let q = case["q"].as_i64().expect("q");
        let r = case["r"].as_i64().expect("r");
        let seed = case["seed"].as_i64().expect("seed") as f64;
        let u_web = (case["hash"].as_f64().expect("hash") * 4_294_967_296.0).round() as u64;
        assert_eq!(u_web, u, "hasz weba != u dla progu {t} ({q},{r})");
        let u_rust = (hash_int3(q as f64, r as f64, seed) * 4_294_967_296.0).round() as u64;
        assert_eq!(u_rust, u, "hasz Rust != u dla progu {t} ({q},{r})");
        let band: ClimateBand =
            serde_json::from_value(Value::String(case["band"].as_str().unwrap().to_string()))
                .expect("climate band");
        let want: Terrain = serde_json::from_value(Value::String(web_terrain_name(
            case["out"].as_str().expect("out"),
        )))
        .expect("terrain");
        assert_eq!(
            climate_band_base_terrain(band, q, r, seed),
            want,
            "galaz d={d} progu {t} {}",
            case["band"]
        );
        seen.insert((t.to_bits(), d));
    }
    for t in [0.5f64, 0.7, 0.85] {
        for d in [-1i64, 0, 1] {
            assert!(
                seen.contains(&(t.to_bits(), d)),
                "brak wektora weba dla progu {t} d={d}"
            );
        }
    }
}
