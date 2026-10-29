//! P6.M06A4 (runda 3, partia 3b) - testy portu `applyJaggedCoastNoise` (web gen-helpers.ts :4232)
//! wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`).
//! Wektory: `tests/p6_m06a4_vectors/jagged-vectors.json` (generator `gen-m06a4-jagged-vectors.mjs`,
//! seed 20261031). Permutacja szumu: `buildPermTable(mulberry32(seed))` z weba (256 bajtow w wektorze).
//! Granice progow (N-1/N/N+1 dla `coast > 0.68` i `coast < 0.32`): testy na funkcjach decyzji
//! `jagged_erode_decision` / `jagged_fill_decision` z ulepszeniem o 1 ulp po obu stronach progu.

use std::sync::{mpsc, OnceLock};
use std::time::Duration;

use civ_engine::data::derived::mapgen_jagged_coast;
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    apply_jagged_coast_noise, jagged_erode_decision, jagged_fill_decision,
};
use civ_engine::domain::mapgen::prims::PERM_TABLE_LEN;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const JAGGED_VECTORS: &str = include_str!("p6_m06a4_vectors/jagged-vectors.json");

fn vectors() -> &'static Value {
    static V: OnceLock<Value> = OnceLock::new();
    V.get_or_init(|| serde_json::from_str(JAGGED_VECTORS).expect("jagged vectors parse"))
}

fn cases() -> &'static Vec<Value> {
    vectors()["cases"]["apply_jagged_coast_noise"]
        .as_array()
        .expect("przypadki apply_jagged_coast_noise")
}

/// Pierwsze dwie skladowe klucza (jak web `parseHexKey`).
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

fn load_perm(v: &Value) -> [u8; PERM_TABLE_LEN] {
    let arr = v.as_array().expect("perm");
    assert_eq!(arr.len(), PERM_TABLE_LEN, "permutacja: 256 wpisow");
    let mut p = [0_u8; PERM_TABLE_LEN];
    for (i, x) in arr.iter().enumerate() {
        p[i] = x.as_u64().expect("bajt perm") as u8;
    }
    p
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

/// Nastepna liczba f64 w gore (dodatnia, bez NaN) - 1 ulp.
fn next_up(x: f64) -> f64 {
    f64::from_bits(x.to_bits() + 1)
}

/// Poprzednia liczba f64 w dol (dodatnia, bez NaN) - 1 ulp.
fn next_down(x: f64) -> f64 {
    f64::from_bits(x.to_bits() - 1)
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
    assert_eq!(cases().len(), 55);
    assert!(
        JAGGED_VECTORS.len() <= 8 * 1024 * 1024,
        "plik wektorow powyzej celu 8 MB"
    );
    // Progi z generatora (meta) musza byc zgodne z tabela danych portu.
    let t = mapgen_jagged_coast();
    assert_eq!(
        meta["thresholds"]["erode_gt"].as_f64(),
        Some(t.prog_erozji_lad)
    );
    assert_eq!(
        meta["thresholds"]["fill_lt"].as_f64(),
        Some(t.prog_wypelnienia_morze)
    );
    assert_eq!(
        meta["thresholds"]["noise_scale"].as_f64(),
        Some(t.skala_szumu)
    );
    // Pomiar: wektory leza blisko progow (sens testu granicznego).
    let near = vectors()["stats"]["near_threshold"].as_u64().expect("near");
    assert!(near > 0, "brak ocen szumu blisko progow");
}

#[test]
fn apply_jagged_coast_noise_matches_web() {
    with_watchdog("apply_jagged_coast_noise_matches_web", || {
        for case in cases() {
            let w = case["w"].as_i64().expect("w");
            let h = case["h"].as_i64().expect("h");
            let passes = case["passes"].as_u64().expect("passes") as u32;
            let perm = load_perm(&case["perm"]);
            let mut hexes = load_map(&case["input"]);
            let n = apply_jagged_coast_noise(&mut hexes, &perm, w, h, passes);
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

/// Granica erozji `coast > 0.68`: przy dokladnie progu decyzja NEGATYWNA; 1 ulp wyzej - POZYTYWNA;
/// 1 ulp nizej - NEGATYWNA. (N-1 / N / N+1 dla porownania `>`.)
#[test]
fn erode_threshold_n_minus_1_n_n_plus_1() {
    let prog = mapgen_jagged_coast().prog_erozji_lad;
    assert_eq!(prog, 0.68);
    assert!(!jagged_erode_decision(next_down(prog), prog), "N-1");
    assert!(!jagged_erode_decision(prog, prog), "N");
    assert!(jagged_erode_decision(next_up(prog), prog), "N+1");
}

/// Granica wypelnienia `coast < 0.32`: przy dokladnie progu decyzja NEGATYWNA; 1 ulp nizej - POZYTYWNA;
/// 1 ulp wyzej - NEGATYWNA. (N-1 / N / N+1 dla porownania `<`.)
#[test]
fn fill_threshold_n_minus_1_n_n_plus_1() {
    let prog = mapgen_jagged_coast().prog_wypelnienia_morze;
    assert_eq!(prog, 0.32);
    assert!(jagged_fill_decision(next_down(prog), prog), "N-1");
    assert!(!jagged_fill_decision(prog, prog), "N");
    assert!(!jagged_fill_decision(next_up(prog), prog), "N+1");
}
