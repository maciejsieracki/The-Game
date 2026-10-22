//! P6.M17 - `buildGameMapFromSnapshot` (mapSnapshot.ts:301-352): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! `outcome: ok` -> mapa rowna 1:1 (kolejnosc `hexes`, kolejnosc `Object.keys` widocznosci, rzadkie kolumny);
//! `undefined`/`throws` (niepoprawne indeksy) -> Rust zwraca `Err` (Z-M17-3).

#[path = "p6_m17_vectors/common.rs"]
mod common;

use civ_engine::domain::map_snapshot::{
    build_game_map_from_snapshot, serialize_map_for_save, JsKeyedMap, MapSnapshotError,
    SerializedMapData,
};
use common::*;

#[test]
fn rebuild_matches_web() {
    let d = load("rebuild.json");
    let cs = cases(&d);
    assert!(cs.len() >= 60, "za malo wektorow: {}", cs.len());
    let (mut ok, mut err) = (0, 0);
    for c in cs {
        let label = c["label"].as_str().unwrap();
        let snap: SerializedMapData = serde_json::from_value(c["snapshot"].clone())
            .unwrap_or_else(|e| panic!("{label}: deserializacja: {e}"));
        let built = build_game_map_from_snapshot(&snap);
        match c["outcome"].as_str().unwrap() {
            "ok" => {
                let m = built.unwrap_or_else(|e| panic!("{label}: {e}"));
                if let Err(e) = json_eq(&map_to_value(&m), &c["map"]) {
                    panic!("{label}: {e}");
                }
                ok += 1;
            }
            other => {
                assert!(
                    built.is_err(),
                    "{label}: web={other}, Rust musi zwrocic Err"
                );
                err += 1;
            }
        }
    }
    assert!(ok >= 50 && err >= 10, "pokrycie: ok={ok} err={err}");
}

#[test]
fn rebuild_errors_name_the_failing_field() {
    let d = load("rebuild.json");
    let find = |label: &str| -> SerializedMapData {
        let c = cases(&d)
            .iter()
            .find(|c| c["label"] == label)
            .unwrap_or_else(|| panic!("brak {label}"));
        serde_json::from_value(c["snapshot"].clone()).unwrap()
    };
    let e = build_game_map_from_snapshot(&find("oob-terenIdx")).unwrap_err();
    assert!(
        matches!(
            e,
            MapSnapshotError::DictIndex {
                field: "terenIdx",
                ..
            }
        ),
        "{e}"
    );
    let e = build_game_map_from_snapshot(&find("oob-hexIdx-rzekaKrawedzie")).unwrap_err();
    assert!(
        matches!(
            e,
            MapSnapshotError::HexIndex {
                field: "rzekaKrawedzie",
                ..
            }
        ),
        "{e}"
    );
    let e = build_game_map_from_snapshot(&find("krotsza-kolumna-q")).unwrap_err();
    assert!(
        matches!(e, MapSnapshotError::ColumnLength { field: "q" }),
        "{e}"
    );
    assert!(!e.to_string().is_empty());
}

#[test]
fn serialize_rebuild_serialize_is_stable_without_duplicate_coords() {
    let d = load("serialize.json");
    let mut checked = 0;
    for c in cases(&d) {
        let label = c["label"].as_str().unwrap();
        if c["textExact"].as_bool() != Some(true) {
            continue; // liczby NaN/Infinity: `PartialEq` na f64 nie jest zwrotne
        }
        let map = map_from_json(&c["input"]);
        let mut coords: Vec<(i32, i32)> = map
            .hexes
            .iter()
            .map(|(_, h)| (h.coords.q, h.coords.r))
            .collect();
        coords.sort_unstable();
        let before = coords.len();
        coords.dedup();
        if coords.len() != before {
            continue;
        }
        let s1 = serialize_map_for_save(&map);
        let rebuilt = build_game_map_from_snapshot(&s1).unwrap_or_else(|e| panic!("{label}: {e}"));
        let s2 = serialize_map_for_save(&rebuilt);
        assert_eq!(s1, s2, "{label}");
        checked += 1;
    }
    assert!(checked >= 40);
}

/// Niezalezny od weba test modelu `Object.keys`: indeksy tablicy rosnaco, reszta w kolejnosci wstawienia.
#[test]
fn js_keyed_map_orders_array_index_keys_first() {
    let pool = [
        "p",
        "10",
        "ai",
        "2",
        "4294967295",
        "4294967294",
        "007",
        "0",
        "9",
        "-1",
        "1.5",
        "brak",
    ];
    let mut state: u64 = 0x9e37_79b9_7f4a_7c15;
    let mut next = || {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        state
    };
    let is_idx = |k: &str| {
        k.parse::<u64>()
            .is_ok_and(|v| v <= 4_294_967_294 && v.to_string() == k)
    };
    for _ in 0..300 {
        let mut m = JsKeyedMap::new();
        let mut inserted: Vec<&str> = Vec::new();
        for _ in 0..(next() % 12) {
            let k = pool[(next() % pool.len() as u64) as usize];
            m.set(k, "v");
            if !inserted.contains(&k) {
                inserted.push(k);
            }
        }
        let mut want: Vec<&str> = inserted.iter().copied().filter(|k| is_idx(k)).collect();
        want.sort_by_key(|k| k.parse::<u64>().unwrap());
        want.extend(inserted.iter().copied().filter(|k| !is_idx(k)));
        let got: Vec<&str> = m.entries().iter().map(|(k, _)| k.as_str()).collect();
        assert_eq!(got, want);
    }
    let mut m = JsKeyedMap::new();
    m.set("a", "1");
    m.set("b", "2");
    m.set("a", "3");
    assert_eq!(m.get("a"), Some("3"));
    assert_eq!(m.entries()[0].0, "a");
    assert!(!m.is_empty());
}
