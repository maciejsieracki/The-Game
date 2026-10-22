//! P6.M17 - `isValidMapSnapshot` (mapSnapshot.ts:365-404): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Mutacje poprawnych snapshotow (usuniecie/zmiana typu/dlugosci kazdego pola) + wejscia nie-obiektowe.

#[path = "p6_m17_vectors/common.rs"]
mod common;

use civ_engine::domain::map_snapshot::is_valid_map_snapshot;
use common::*;

#[test]
fn is_valid_matches_web_for_all_vectors() {
    let d = load("validate.json");
    let cs = cases(&d);
    assert!(cs.len() >= 600, "za malo wektorow: {}", cs.len());
    let (mut yes, mut no) = (0, 0);
    for c in cs {
        let label = c["label"].as_str().unwrap();
        let want = c["out"].as_bool().unwrap();
        assert_eq!(is_valid_map_snapshot(&c["input"]), want, "{label}");
        if want {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(
        yes >= 20 && no >= 400,
        "wektory musza pokrywac obie galezie: {yes}/{no}"
    );
}

/// Zarzut 3 (runda 2): oczekiwanie pochodzi z WEBA. `validate.json` zawiera wynik weba `isValidMapSnapshot` dla KAZDEGO snapshotu zwroconego przez webowe
/// `serializeMapForSave` (etykieta `serialize:<label>`), a snapshot w tescie pochodzi z `serialize.json` (to samo wejscie, ten sam bajt).
#[test]
fn every_serialize_vector_snapshot_has_a_web_validity_vector() {
    let ser = load("serialize.json");
    let val = load("validate.json");
    let mut checked = 0;
    for c in cases(&ser) {
        let label = c["label"].as_str().unwrap();
        let key = format!("serialize:{label}");
        let v = cases(&val)
            .iter()
            .find(|v| v["label"].as_str() == Some(key.as_str()))
            .unwrap_or_else(|| panic!("brak wektora weba {key}"));
        assert_eq!(
            v["input"], c["snapshot"],
            "{key}: wejscie rozne od serialize.json"
        );
        let want = v["out"].as_bool().unwrap();
        assert_eq!(is_valid_map_snapshot(&c["snapshot"]), want, "{key}");
        checked += 1;
    }
    assert_eq!(checked, cases(&ser).len());
    assert!(checked >= 49, "za malo snapshotow: {checked}");
}
