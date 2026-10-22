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

#[test]
fn snapshots_from_serialize_vectors_are_valid_iff_web_says_so() {
    let d = load("serialize.json");
    let v = load("validate.json");
    // Web-wynik walidatora dla snapshotow z serialize jest w validate.json (base*-valid) tylko dla 2 baz;
    // tu pelny przeglad: snapshot z niepusta mapa i dodatnimi wymiarami jest poprawny, reszta nie.
    assert!(!cases(&v).is_empty());
    for c in cases(&d) {
        let label = c["label"].as_str().unwrap();
        let has_hexes = !c["input"]["hexes"].as_array().unwrap().is_empty();
        let w = num(&c["input"]["szerokoscQ"]);
        let h = num(&c["input"]["wysokoscR"]);
        let want = has_hexes && w > 0.0 && h > 0.0;
        assert_eq!(is_valid_map_snapshot(&c["snapshot"]), want, "{label}");
    }
}
