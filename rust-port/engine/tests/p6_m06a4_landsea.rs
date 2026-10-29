//! P6.M06A4 (runda 1, partia 2) - testy portu lad/morze/wybrzeze A4 wzgledem wektorow z URUCHOMIONEGO weba.
//! Symbol partii 2: `purgeDesertEnclaveWater` (web :4156).
//! Wektory: `tests/p6_m06a4_vectors/web-vectors.json` (generator `gen-m06a4-vectors.mjs`, pin `edb8fb56`,
//! seed 20261029). Stan mapy: `[klucz, terrain(serde), nakladka(key), zloze(0/1), rzeka(0/1), krawedzie(N)]`.
//! Porownanie: cala HexRecord (kolejnosc, pola) + liczba zmian.
//! Granice progow (N-1/N/N+1 dla `pustN >= 2` i `pustN >= dryN * 0.4`): pokrycie z pola `coverage`
//! generatora, sprawdzane tutaj wzgledem reguly.

use std::sync::{mpsc, OnceLock};
use std::time::Duration;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::purge_desert_enclave_water;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m06a4_vectors/web-vectors.json");

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
fn vectors_meta_pin_and_counts() {
    let meta = &web()["meta"];
    assert_eq!(meta["pin"].as_str(), Some("edb8fb56"));
    assert_eq!(
        meta["gen_helpers_sha256"].as_str(),
        Some("ab934703990ba00e71a801eb0b6fcefeb0906c6bd4ded477c7162361307842de"),
        "wektory musza pochodzic z tego samego gen-helpers.ts co M06A"
    );
    assert_eq!(meta["climate_is_earth"].as_bool(), Some(false));
    // Runda 2: po zmniejszeniu wektorow (4991 -> 707, wiersze wybierane deterministycznie).
    assert_eq!(cases("purge_desert_enclave_water").len(), 707);
}

#[test]
fn purge_desert_enclave_water_matches_web() {
    with_watchdog("purge_desert_enclave_water_matches_web", || {
        for case in cases("purge_desert_enclave_water") {
            let w = case["w"].as_i64().expect("w");
            let h = case["h"].as_u64().expect("h") as u32;
            let mut hexes = load_map(&case["input"]);
            let n = purge_desert_enclave_water(&mut hexes, w, h);
            let expected = load_map(&case["output"]);
            assert_eq!(
                n as u64,
                case["out"].as_u64().unwrap(),
                "count {}",
                case["name"]
            );
            assert_eq!(hexes, expected, "mapa {}", case["name"]);
        }
    });
}

/// Pokrycie progow (d, p, pasmo): dla kazdej pary liczby suchych sasiadow `d` (0..=6) i pustynnych
/// `p` (0..=d) generator zapisal wynik srodka w klucz `d{d}_p{p}_{D|N}_{des|lak|nop}`.
/// Regula weba: Pustynia wtedy i tylko wtedy, gdy srodek w pasmie D oraz
/// `pustN >= 2 || (dryN > 0 && pustN >= dryN * 0.4)`. Test wymaga zgodnosci tabeli pokrycia z ta regula
/// na obu stronach progu (N-1 / N / N+1 dla kazdego `d`), a w pasmie N nigdy nie ma Pustyni.
#[test]
fn coverage_matches_threshold_rule_on_both_sides() {
    let cov = web()["coverage"].as_object().expect("coverage");
    for d in 0..=6u64 {
        for p in 0..=d {
            for band in ["D", "N"] {
                let any = ["des", "lak", "nop"]
                    .iter()
                    .any(|o| cov.contains_key(&format!("d{d}_p{p}_{band}_{o}")));
                assert!(any, "brak pokrycia d{d}_p{p}_{band}");
            }
            let expected_des = p >= 2 || (d > 0 && (p as f64) >= (d as f64) * 0.4);
            let des = format!("d{d}_p{p}_D_des");
            let des_n = format!("d{d}_p{p}_N_des");
            if expected_des {
                assert!(
                    cov.contains_key(&des),
                    "oczekiwana pustynia {des} (granica progu)"
                );
            } else {
                assert!(!cov.contains_key(&des), "niespodziewana pustynia {des}");
            }
            assert!(
                !cov.contains_key(&des_n),
                "pustynia poza pasmem pustyni {des_n}"
            );
        }
    }
}

/// Runda 3 (zarzut Evaluatora M15): klucz niekanoniczny (`"1,4,5"`, trzy skladowe) nie jest
/// kluczem `hex_key` i nie moze byc przetworzony. Port (`key_qr` -> `None`) pomija go: bez zmiany
/// terenu i bez wliczenia do liczby zmian. Web przetworzylby taki klucz (parseHexKey bierze dwie
/// pierwsze skladowe) - to swiadoma rozbieznosc tylko dla kluczy spoza formatu generatora (Z-1).
/// Test zabija mutant M15 (`key_qr(key).unwrap_or((0, 0))`), ktory zmienia teren i zwieksza licznik.
#[test]
fn non_canonical_key_is_skipped_not_processed() {
    with_watchdog("non_canonical_key_is_skipped_not_processed", || {
        let mut hexes = HexRecord::new();
        hexes.insert("1,4,5".to_string(), TerrainHex::new(1, 4, Terrain::Sea));
        let n = purge_desert_enclave_water(&mut hexes, 3, 3);
        assert_eq!(n, 0, "klucz niekanoniczny nie moze byc policzony");
        assert_eq!(
            hexes.get("1,4,5").expect("wpis").terrain,
            Terrain::Sea,
            "klucz niekanoniczny nie moze zmienic terenu"
        );
    });
}
