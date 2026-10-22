//! P6.M17 - `serializeMapForSave` (mapSnapshot.ts:204-298): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Kazdy wektor: rownosc strukturalna (liczby bitowo) ORAZ - dla przypadkow `textExact` - rownosc TEKSTU JSON
//! (kolejnosc kluczy i zapis liczb == `JSON.stringify` weba). Oczekiwania wylacznie z `serialize.json`.

#[path = "p6_m17_vectors/common.rs"]
mod common;

use civ_engine::domain::map_snapshot::{serialize_map_for_save, JsNum, SerializedMapData};
use common::*;

#[test]
fn serialize_matches_web_structurally() {
    let d = load("serialize.json");
    let cs = cases(&d);
    assert!(cs.len() >= 40, "za malo wektorow: {}", cs.len());
    for c in cs {
        let label = c["label"].as_str().unwrap();
        let map = map_from_json(&c["input"]);
        let snap = serialize_map_for_save(&map);
        let got = serde_json::to_value(&snap).expect("to_value");
        if let Err(e) = json_eq(&got, &c["snapshot"]) {
            panic!("{label}: {e}");
        }
    }
}

#[test]
fn serialize_text_is_byte_identical_to_web_json_stringify() {
    let d = load("serialize.json");
    let mut exact = 0;
    for c in cases(&d) {
        if c["textExact"].as_bool() != Some(true) {
            continue;
        }
        let label = c["label"].as_str().unwrap();
        let snap = serialize_map_for_save(&map_from_json(&c["input"]));
        let got = serde_json::to_string(&snap).expect("to_string");
        assert_eq!(got, c["text"].as_str().unwrap(), "{label}");
        exact += 1;
    }
    assert!(exact >= 40, "za malo przypadkow tekstowych: {exact}");
}

#[test]
fn serialize_vectors_touch_every_branch() {
    // Nie piny wartosci: sprawdza, ze wektory faktycznie dotykaja kazdej galezi (anty-pusty wektor).
    let d = load("serialize.json");
    let (mut sparse, mut wid, mut zero_era, mut empty_arr, mut null_owner, mut owner) =
        (0, 0, 0, 0, 0, 0);
    for c in cases(&d) {
        let sn = &c["snapshot"];
        for f in [
            "rzekaKrawedzie",
            "zloze",
            "zlozeMinEra",
            "ulepszenia",
            "improvementKey",
        ] {
            sparse += sn[f]["hexIdx"].as_array().unwrap().len();
        }
        wid += sn["widocznosc"]["hexIdx"].as_array().unwrap().len();
        zero_era += sn["zlozeMinEra"]["val"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|v| v.as_f64() == Some(0.0))
            .count();
        empty_arr += sn["ulepszenia"]["val"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|v| v.as_array().unwrap().is_empty())
            .count();
        for v in sn["wlascicielIdx"].as_array().unwrap() {
            if v.as_i64() == Some(-1) {
                null_owner += 1;
            } else {
                owner += 1;
            }
        }
    }
    assert!(sparse > 50 && wid > 50, "{sparse}/{wid}");
    assert!(zero_era > 0 && empty_arr > 0 && null_owner > 0 && owner > 0);
}

#[test]
fn snapshot_shape_invariants_hold_for_every_vector() {
    let d = load("serialize.json");
    for c in cases(&d) {
        let label = c["label"].as_str().unwrap();
        let map = map_from_json(&c["input"]);
        let snap: SerializedMapData = serialize_map_for_save(&map);
        let n = map.hexes.len();
        assert_eq!(snap.n, n, "{label}");
        for len in [
            snap.q.len(),
            snap.r.len(),
            snap.teren_idx.len(),
            snap.nakladka_idx.len(),
            snap.ulepszenie_idx.len(),
            snap.wlasciciel_idx.len(),
            snap.wioska_istnieje.len(),
            snap.wioska_ludnosc.len(),
            snap.rzeka_obecna.len(),
        ] {
            assert_eq!(len, n, "{label}: kolumna gesta");
        }
        // slownik bez duplikatow, wszystkie indeksy w zakresie
        let mut sorted = snap.dict.clone();
        sorted.sort();
        sorted.dedup();
        assert_eq!(sorted.len(), snap.dict.len(), "{label}: duplikaty w dict");
        let dict_len = snap.dict.len() as i64;
        let dense_idx = snap
            .teren_idx
            .iter()
            .chain(&snap.nakladka_idx)
            .chain(&snap.ulepszenie_idx)
            .chain(&snap.wlasciciel_idx);
        for &i in dense_idx {
            assert!((-1..dict_len).contains(&i), "{label}: indeks {i}");
        }
        for col in [&snap.zloze.val, &snap.improvement_key.val] {
            assert!(col.iter().all(|&i| (0..dict_len).contains(&i)), "{label}");
        }
        assert_eq!(
            snap.rzeka_krawedzie.hex_idx.len(),
            snap.rzeka_krawedzie.val.len()
        );
        assert_eq!(
            snap.widocznosc.hex_idx.len(),
            snap.widocznosc.player_idx.len()
        );
        assert_eq!(snap.widocznosc.hex_idx.len(), snap.widocznosc.val_idx.len());
        let all_hex_idx = snap
            .rzeka_krawedzie
            .hex_idx
            .iter()
            .chain(&snap.zloze.hex_idx)
            .chain(&snap.zloze_min_era.hex_idx)
            .chain(&snap.ulepszenia.hex_idx)
            .chain(&snap.improvement_key.hex_idx)
            .chain(&snap.widocznosc.hex_idx);
        for &i in all_hex_idx {
            assert!((0..n as i64).contains(&i), "{label}: hexIdx {i}");
        }
        // zapis -> odczyt typu zachowuje snapshot (NaN/Infinity zapisuja sie jako `null`, jak w webie - bez powrotu)
        if c["textExact"].as_bool() != Some(true) {
            continue;
        }
        let text = serde_json::to_string(&snap).unwrap();
        let back: SerializedMapData = serde_json::from_str(&text).unwrap();
        assert_eq!(back, snap, "{label}: roundtrip serde");
    }
}

#[test]
fn js_num_writes_integers_without_fraction_and_non_finite_as_null() {
    let t = |v: f64| serde_json::to_string(&JsNum(v)).unwrap();
    assert_eq!(t(3.0), "3");
    assert_eq!(t(-0.0), "0");
    assert_eq!(t(0.5), "0.5");
    assert_eq!(t(f64::NAN), "null");
    assert_eq!(t(f64::INFINITY), "null");
}
