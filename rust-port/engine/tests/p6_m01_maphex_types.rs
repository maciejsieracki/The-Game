//! P6.M01-R2 — model heksa `MapHex` (port `gra/src/types/hex.ts`, pin `07d2fbd72`).
//!
//! Testy:
//! - `web_values_*`: wartosci JSON enumow porownane z lista z pinu (hex.ts:12-64).
//! - `shape_*`: liczba wariantow 8/8/8/3 (przez wyczerpujace `match`, bez `_ =>`) i pola `MapHex`.
//! - `round_trip_*`: serde w obie strony dla kazdego typu.
//! - `visibility_*`: brak klucza = `Nieodkryty`.
//! - `reject_*`: brak wymaganego pola, nieznane pole i zla wartosc enuma sa bledami.
#![forbid(unsafe_code)]

use civ_engine::domain::mapgen::types::{
    MapHex, Nakladka, RzekaInfo, TerenBazowy, Ulepszenie, Widocznosc, Wioska,
};
use civ_engine::domain::{hex::HexCoord, PlayerId};
use serde::{de::DeserializeOwned, Serialize};
use serde_json::{json, Value};

/// Wartosci JSON z pinu (`gra/src/types/hex.ts`, wariant -> string), kolejnosc jak w pliku.
const WEB_TEREN: [&str; 8] = [
    "laka",
    "rownina",
    "wzgorza",
    "gory",
    "plytkie_morze", // hex.ts:19
    "morze",
    "pustynia",
    "polarny", // hex.ts:23
];
const WEB_NAKLADKA: [&str; 8] = [
    "brak",
    "las",
    "zloze_gliny",
    "zloze_rudy",
    "zloze_konia",
    "zloze_owiec",
    "zloze_bydla",
    "zloze_lamy", // hex.ts:38
];
const WEB_ULEPSZENIE: [&str; 8] = [
    "brak",
    "farma",
    "irygacja",
    "kopalnia",
    "droga",
    "droga_brukowana", // hex.ts:51
    "pastwisko",
    "tartak", // hex.ts:53
];
const WEB_WIDOCZNOSC: [&str; 3] = ["nieodkryty", "odkryty", "widoczny"]; // hex.ts:61-63

fn teren_all() -> [TerenBazowy; 8] {
    [
        TerenBazowy::Laka,
        TerenBazowy::Rownina,
        TerenBazowy::Wzgorza,
        TerenBazowy::Gory,
        TerenBazowy::PlytkieMorze,
        TerenBazowy::Morze,
        TerenBazowy::Pustynia,
        TerenBazowy::Polarny,
    ]
}

fn nakladka_all() -> [Nakladka; 8] {
    [
        Nakladka::Brak,
        Nakladka::Las,
        Nakladka::ZlozeGliny,
        Nakladka::ZlozeRudy,
        Nakladka::ZlozeKonia,
        Nakladka::ZlozeOwiec,
        Nakladka::ZlozeBydla,
        Nakladka::ZlozeLamy,
    ]
}

fn ulepszenie_all() -> [Ulepszenie; 8] {
    [
        Ulepszenie::Brak,
        Ulepszenie::Farma,
        Ulepszenie::Irygacja,
        Ulepszenie::Kopalnia,
        Ulepszenie::Droga,
        Ulepszenie::DrogaBrukowana,
        Ulepszenie::Pastwisko,
        Ulepszenie::Tartak,
    ]
}

fn widocznosc_all() -> [Widocznosc; 3] {
    [
        Widocznosc::Nieodkryty,
        Widocznosc::Odkryty,
        Widocznosc::Widoczny,
    ]
}

/// Wyczerpujace `match` (bez `_`): dodanie wariantu bez aktualizacji tego testu nie skompiluje sie.
fn teren_index(t: TerenBazowy) -> usize {
    match t {
        TerenBazowy::Laka => 0,
        TerenBazowy::Rownina => 1,
        TerenBazowy::Wzgorza => 2,
        TerenBazowy::Gory => 3,
        TerenBazowy::PlytkieMorze => 4,
        TerenBazowy::Morze => 5,
        TerenBazowy::Pustynia => 6,
        TerenBazowy::Polarny => 7,
    }
}

fn nakladka_index(n: Nakladka) -> usize {
    match n {
        Nakladka::Brak => 0,
        Nakladka::Las => 1,
        Nakladka::ZlozeGliny => 2,
        Nakladka::ZlozeRudy => 3,
        Nakladka::ZlozeKonia => 4,
        Nakladka::ZlozeOwiec => 5,
        Nakladka::ZlozeBydla => 6,
        Nakladka::ZlozeLamy => 7,
    }
}

fn ulepszenie_index(u: Ulepszenie) -> usize {
    match u {
        Ulepszenie::Brak => 0,
        Ulepszenie::Farma => 1,
        Ulepszenie::Irygacja => 2,
        Ulepszenie::Kopalnia => 3,
        Ulepszenie::Droga => 4,
        Ulepszenie::DrogaBrukowana => 5,
        Ulepszenie::Pastwisko => 6,
        Ulepszenie::Tartak => 7,
    }
}

fn widocznosc_index(w: Widocznosc) -> usize {
    match w {
        Widocznosc::Nieodkryty => 0,
        Widocznosc::Odkryty => 1,
        Widocznosc::Widoczny => 2,
    }
}

fn to_json_string<T: Serialize>(value: &T) -> String {
    match serde_json::to_value(value).expect("serialize") {
        Value::String(s) => s,
        other => panic!("oczekiwano stringa JSON, jest {other:?}"),
    }
}

fn round_trip<T: Serialize + DeserializeOwned + PartialEq + std::fmt::Debug>(value: &T) {
    let text = serde_json::to_string(value).expect("serialize");
    let back: T = serde_json::from_str(&text).expect("deserialize");
    assert_eq!(&back, value, "round-trip zmienil wartosc: {text}");
}

fn sample_hex() -> MapHex {
    let mut widocznosc = std::collections::BTreeMap::new();
    widocznosc.insert(PlayerId::new(1), Widocznosc::Widoczny);
    widocznosc.insert(PlayerId::new(2), Widocznosc::Odkryty);
    MapHex {
        coords: HexCoord::new(3, -5),
        teren_bazowy: TerenBazowy::PlytkieMorze,
        nakladka: Nakladka::ZlozeLamy,
        ulepszenie: Ulepszenie::DrogaBrukowana,
        wlasciciel: Some(PlayerId::new(2)),
        wioska: Wioska {
            istnieje: true,
            ludnosc: 4,
        },
        widocznosc,
        rzeka: RzekaInfo {
            obecna: true,
            krawedzie: vec![0, 3, 5],
        },
    }
}

fn sample_hex_json() -> Value {
    json!({
        "coords": { "q": 3, "r": -5 },
        "terenBazowy": "plytkie_morze",
        "nakladka": "zloze_lamy",
        "ulepszenie": "droga_brukowana",
        "wlasciciel": 2,
        "wioska": { "istnieje": true, "ludnosc": 4 },
        "widocznosc": { "1": "widoczny", "2": "odkryty" },
        "rzeka": { "obecna": true, "krawedzie": [0, 3, 5] }
    })
}

// ---------------------------------------------------------------------------
// web_values_*: wartosci JSON zgodne z pinem
// ---------------------------------------------------------------------------

#[test]
fn web_values_terenbazowy_match_pin() {
    let got: Vec<String> = teren_all().iter().map(|&t| to_json_string(&t)).collect();
    assert_eq!(got, WEB_TEREN.to_vec());
}

#[test]
fn web_values_nakladka_match_pin() {
    let got: Vec<String> = nakladka_all().iter().map(|&n| to_json_string(&n)).collect();
    assert_eq!(got, WEB_NAKLADKA.to_vec());
}

#[test]
fn web_values_ulepszenie_match_pin() {
    let got: Vec<String> = ulepszenie_all()
        .iter()
        .map(|&u| to_json_string(&u))
        .collect();
    assert_eq!(got, WEB_ULEPSZENIE.to_vec());
}

#[test]
fn web_values_widocznosc_match_pin() {
    let got: Vec<String> = widocznosc_all()
        .iter()
        .map(|&w| to_json_string(&w))
        .collect();
    assert_eq!(got, WEB_WIDOCZNOSC.to_vec());
}

// ---------------------------------------------------------------------------
// shape_*: liczby wariantow i pola
// ---------------------------------------------------------------------------

#[test]
fn shape_variant_counts_are_8_8_8_3() {
    assert_eq!(teren_all().len(), 8);
    assert_eq!(nakladka_all().len(), 8);
    assert_eq!(ulepszenie_all().len(), 8);
    assert_eq!(widocznosc_all().len(), 3);
    // Indeksy musza byc gesto 0..n-1, bez duplikatow (kazdy wariant w tablicy dokladnie raz).
    for (i, t) in teren_all().into_iter().enumerate() {
        assert_eq!(teren_index(t), i);
    }
    for (i, n) in nakladka_all().into_iter().enumerate() {
        assert_eq!(nakladka_index(n), i);
    }
    for (i, u) in ulepszenie_all().into_iter().enumerate() {
        assert_eq!(ulepszenie_index(u), i);
    }
    for (i, w) in widocznosc_all().into_iter().enumerate() {
        assert_eq!(widocznosc_index(w), i);
    }
}

#[test]
fn shape_map_hex_has_exactly_web_fields() {
    let value = serde_json::to_value(sample_hex()).expect("serialize");
    let object = value.as_object().expect("obiekt");
    let mut keys: Vec<&str> = object.keys().map(String::as_str).collect();
    keys.sort_unstable();
    assert_eq!(
        keys,
        vec![
            "coords",
            "nakladka",
            "rzeka",
            "terenBazowy",
            "ulepszenie",
            "widocznosc",
            "wioska",
            "wlasciciel",
        ]
    );
    assert_eq!(object["wioska"].as_object().unwrap().len(), 2);
    assert_eq!(object["rzeka"].as_object().unwrap().len(), 2);
    assert_eq!(object["coords"].as_object().unwrap().len(), 2);
}

#[test]
fn shape_serialized_json_matches_web_sample() {
    let value = serde_json::to_value(sample_hex()).expect("serialize");
    assert_eq!(value, sample_hex_json());
}

// ---------------------------------------------------------------------------
// round_trip_*
// ---------------------------------------------------------------------------

#[test]
fn round_trip_all_enums() {
    for t in teren_all() {
        round_trip(&t);
    }
    for n in nakladka_all() {
        round_trip(&n);
    }
    for u in ulepszenie_all() {
        round_trip(&u);
    }
    for w in widocznosc_all() {
        round_trip(&w);
    }
}

#[test]
fn round_trip_structs() {
    round_trip(&Wioska {
        istnieje: false,
        ludnosc: 0,
    });
    round_trip(&RzekaInfo {
        obecna: false,
        krawedzie: Vec::new(),
    });
    round_trip(&HexCoord::new(-7, 2));
    round_trip(&sample_hex());
}

#[test]
fn round_trip_map_hex_from_web_json() {
    let back: MapHex = serde_json::from_value(sample_hex_json()).expect("web JSON");
    assert_eq!(back, sample_hex());
}

#[test]
fn round_trip_owner_null_is_kept_null() {
    let mut hex = sample_hex();
    hex.wlasciciel = None;
    let value = serde_json::to_value(&hex).expect("serialize");
    assert!(value["wlasciciel"].is_null());
    round_trip(&hex);
}

// ---------------------------------------------------------------------------
// visibility_*
// ---------------------------------------------------------------------------

#[test]
fn visibility_absent_key_is_nieodkryty() {
    let hex = sample_hex();
    assert_eq!(hex.visibility_for(PlayerId::new(1)), Widocznosc::Widoczny);
    assert_eq!(hex.visibility_for(PlayerId::new(2)), Widocznosc::Odkryty);
    assert_eq!(hex.visibility_for(PlayerId::new(9)), Widocznosc::Nieodkryty);
}

#[test]
fn visibility_empty_map_is_nieodkryty_for_everyone() {
    let mut hex = sample_hex();
    hex.widocznosc.clear();
    for p in 0..4 {
        assert_eq!(hex.visibility_for(PlayerId::new(p)), Widocznosc::Nieodkryty);
    }
}

#[test]
fn visibility_map_keys_are_player_ids_in_order() {
    let hex = sample_hex();
    let value = serde_json::to_value(&hex).expect("serialize");
    let keys: Vec<&str> = value["widocznosc"]
        .as_object()
        .unwrap()
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(keys, vec!["1", "2"]);
}

// ---------------------------------------------------------------------------
// reject_*
// ---------------------------------------------------------------------------

#[test]
fn reject_missing_owner_key() {
    let mut value = sample_hex_json();
    value.as_object_mut().unwrap().remove("wlasciciel");
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_unknown_field() {
    let mut value = sample_hex_json();
    value["dodatkowe"] = json!(1);
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_pascal_case_enum_value() {
    let mut value = sample_hex_json();
    value["terenBazowy"] = json!("PlytkieMorze");
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_unknown_enum_value() {
    assert!(serde_json::from_str::<Widocznosc>("\"ukryty\"").is_err());
    assert!(serde_json::from_str::<Ulepszenie>("\"kopalnia_zlota\"").is_err());
}

#[test]
fn reject_missing_wioska_field() {
    let mut value = sample_hex_json();
    value["wioska"] = json!({ "istnieje": true });
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}
