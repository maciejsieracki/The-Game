//! P6.M06A4 (runda 3, partia 3) - testy portu `morseDepthFromMapBorder` (web :4659),
//! `trimEnclosedOceanOnly` (:4701), `purgeInlandWaterForMultiLandTyp` (:4215) wzgledem wektorow
//! z URUCHOMIONEGO weba (pin `edb8fb56`).
//! Wektory: `tests/p6_m06a4_vectors/trim-vectors.json` (generator `gen-m06a4-trim-vectors.mjs`,
//! seed 20261030). Stan mapy: `[klucz, terrain(serde), nakladka(key), zloze(0/1), rzeka(0/1), krawedzie(N)]`.
//! Porownanie BFS: pelny zbior `(klucz, odleglosc)`; porownanie purge/trim: liczba zmian + cala HexRecord.
//! Granice (N-1/N/N+1) dla progow `fill(5)` i `fill(4)`: rodzina "brzeg_*" z pokryciem w polu `coverage`.

use std::collections::HashMap;
use std::sync::{mpsc, OnceLock};
use std::time::Duration;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    morse_depth_from_map_border, purge_inland_water_for_multi_land_typ, trim_enclosed_ocean_only,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const TRIM_VECTORS: &str = include_str!("p6_m06a4_vectors/trim-vectors.json");

fn vectors() -> &'static Value {
    static V: OnceLock<Value> = OnceLock::new();
    V.get_or_init(|| serde_json::from_str(TRIM_VECTORS).expect("trim vectors parse"))
}

fn cases(name: &str) -> &'static Vec<Value> {
    vectors()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

/// Pierwsze dwie skladowe klucza (jak web `parseHexKey`). Klucz niekanoniczny (3 skladowe) daje
/// te same wspolrzedne co w webie; w wektorach sluzy tylko do wypelnienia pol `q`, `r`.
fn key_qr(key: &str) -> (i64, i64) {
    let mut it = key.split(',');
    let a = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    let b = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    (a, b)
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

/// Watchdog (dispatch: limit czasu w testach petli/BFS). Cialo testu biegnie w osobnym watku.
const WATCHDOG_SECS: u64 = 60;

fn with_watchdog<F: FnOnce() + Send + 'static>(name: &'static str, body: F) {
    let (tx, rx) = mpsc::channel::<()>();
    let handle = std::thread::Builder::new()
        .name(name.to_string())
        .spawn(move || {
            body();
            let _ = tx.send(());
        })
        .expect("spawn watchdog thread");
    match rx.recv_timeout(Duration::from_secs(WATCHDOG_SECS)) {
        Ok(()) => handle.join().expect("cialo testu"),
        Err(mpsc::RecvTimeoutError::Disconnected) => {
            std::panic::resume_unwind(handle.join().expect_err("panika w ciele testu"))
        }
        Err(mpsc::RecvTimeoutError::Timeout) => panic!(
            "watchdog: {name} nie zakonczyl sie w {WATCHDOG_SECS} s (petla bez limitu iteracji)"
        ),
    }
}

#[test]
fn vectors_meta_pin_counts_and_size() {
    let meta = &vectors()["meta"];
    assert_eq!(meta["pin"].as_str(), Some("edb8fb56"));
    assert_eq!(
        meta["gen_helpers_sha256"].as_str(),
        Some("ab934703990ba00e71a801eb0b6fcefeb0906c6bd4ded477c7162361307842de"),
        "wektory musza pochodzic z tego samego gen-helpers.ts co M06A"
    );
    assert_eq!(cases("morse_depth_from_map_border").len(), 101);
    assert_eq!(cases("trim_enclosed_ocean_only").len(), 101);
    assert_eq!(cases("purge_inland_water_for_multi_land_typ").len(), 100);
    assert!(
        TRIM_VECTORS.len() <= 8 * 1024 * 1024,
        "plik wektorow powyzej celu 8 MB"
    );
}

#[test]
fn morse_depth_from_map_border_matches_web() {
    with_watchdog("morse_depth_from_map_border_matches_web", || {
        for case in cases("morse_depth_from_map_border") {
            let w = case["w"].as_i64().expect("w");
            let h = case["h"].as_i64().expect("h");
            let hexes = load_map(&case["input"]);
            let got = morse_depth_from_map_border(&hexes, w, h);
            let expected: HashMap<String, usize> = case["dist"]
                .as_array()
                .expect("dist")
                .iter()
                .map(|p| {
                    (
                        p[0].as_str().expect("klucz").to_string(),
                        p[1].as_u64().expect("odleglosc") as usize,
                    )
                })
                .collect();
            assert_eq!(got, expected, "BFS {}", case["name"]);
        }
    });
}

#[test]
fn trim_enclosed_ocean_only_matches_web() {
    with_watchdog("trim_enclosed_ocean_only_matches_web", || {
        for case in cases("trim_enclosed_ocean_only") {
            let w = case["w"].as_i64().expect("w");
            let h = case["h"].as_i64().expect("h");
            let mut hexes = load_map(&case["input"]);
            let n = trim_enclosed_ocean_only(&mut hexes, w, h);
            assert_eq!(
                n as u64,
                case["out"].as_u64().unwrap(),
                "count {}",
                case["name"]
            );
            assert_eq!(hexes, load_map(&case["output"]), "mapa {}", case["name"]);
        }
    });
}

#[test]
fn purge_inland_water_for_multi_land_typ_matches_web() {
    with_watchdog("purge_inland_water_for_multi_land_typ_matches_web", || {
        for case in cases("purge_inland_water_for_multi_land_typ") {
            let w = case["w"].as_i64().expect("w");
            let h = case["h"].as_i64().expect("h");
            let mut hexes = load_map(&case["input"]);
            let n = purge_inland_water_for_multi_land_typ(&mut hexes, w, h);
            assert_eq!(
                n as u64,
                case["out"].as_u64().unwrap(),
                "count {}",
                case["name"]
            );
            assert_eq!(hexes, load_map(&case["output"]), "mapa {}", case["name"]);
        }
    });
}

/// Granice progow `fill(5)` i `fill(4)` (rodzina "in"/"near", srodek w pelnym otoczeniu, 6 sasiadow):
/// d = 5 i 6 sasiadow Laka -> srodek zamieniony juz przez fill(5) (`f5`); d = 0..3 -> srodek nie
/// zmieniony przez fill(5). Pokrycie generatora musi miec wpis dla kazdej pary (d, pozycja).
#[test]
fn coverage_has_both_sides_of_fill_thresholds() {
    let cov = vectors()["coverage"].as_object().expect("coverage");
    for pos in ["in", "near", "border"] {
        for d in 0..=6u64 {
            let any = ["f5", "later", "nop"]
                .iter()
                .any(|o| cov.contains_key(&format!("fill_d{d}_{pos}_{o}")));
            assert!(any, "brak pokrycia fill_d{d}_{pos}");
        }
    }
    for d in [5u64, 6] {
        assert!(
            cov.contains_key(&format!("fill_d{d}_in_f5")),
            "prog 5: srodek przy d={d} musi byc zamieniony przez fill(5)"
        );
    }
    for d in 0..=3u64 {
        assert!(
            !cov.contains_key(&format!("fill_d{d}_in_f5")),
            "prog 5: srodek przy d={d} nie moze byc zamieniony przez fill(5)"
        );
    }
}
