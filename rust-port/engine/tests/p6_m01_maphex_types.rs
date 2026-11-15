//! P6.M01-R2 — model heksa `MapHex` (port `gra/src/types/hex.ts`, pin `07d2fbd72`).
//!
//! Zrodlo prawdy dla nazw i wartosci: migawka pinu `p6_m01_maphex_pin_snapshot.rs`
//! (tresc `hex.ts` bajt w bajt, 4141 B, SHA-256 07eb0ee9...). Testy NIE maja przepisanych z reki list:
//! wartosci enumow i nazwy pol interfejsow sa parsowane z tej migawki.
//!
//! Testy:
//! - `web_values_*`: nazwy wariantow i wartosci JSON enumow == lista z pinu (hex.ts:12-64).
//! - `shape_*`: liczba wariantow 8/8/8/3 z pinu i pola struktur == pola interfejsow z pinu.
//! - `round_trip_*`: serde w obie strony dla kazdego typu.
//! - `visibility_*`: brak klucza = `Nieodkryty`; kolejnosc kluczy w JSON.
//! - `reject_*`: brak wymaganego pola, nieznane pole (na kazdym poziomie), zla wartosc enuma sa bledami.
//! - `web_parity_*`: swiadomie nie walidowane zakresy (parytet z webem, decyzja Z3b).
#![forbid(unsafe_code)]

#[path = "p6_m01_maphex_pin_snapshot.rs"]
mod pin_snapshot;

use std::collections::BTreeMap;
use std::fmt::Debug;

use civ_engine::domain::mapgen::types::{
    MapHex, Nakladka, RzekaInfo, TerenBazowy, Ulepszenie, Widocznosc, Wioska,
};
use civ_engine::domain::{hex::HexCoord, PlayerId};
use pin_snapshot::HEX_TS_PIN_07D2FBD72 as PIN;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::{json, Value};

/// Wpisy `(Nazwa, wartosc)` enuma `name` z pinu, w kolejnosci deklaracji. Linie postaci `Nazwa = 'wartosc',`.
fn pin_enum_entries(name: &str) -> Vec<(String, String)> {
    let header = format!("export enum {name} {{");
    let start = PIN
        .find(&header)
        .unwrap_or_else(|| panic!("brak `{header}` w pinie"))
        + header.len();
    let body = &PIN[start..];
    let body = &body[..body.find('}').expect("koniec enuma")];
    let entries: Vec<(String, String)> = body
        .lines()
        .filter_map(|line| {
            let (lhs, rhs) = line.trim().split_once('=')?;
            let lhs = lhs.trim();
            if lhs.is_empty() || !lhs.chars().all(|c| c.is_ascii_alphanumeric()) {
                return None;
            }
            let rhs = rhs.trim().strip_prefix('\'')?;
            let value = rhs.split('\'').next()?;
            Some((lhs.to_string(), value.to_string()))
        })
        .collect();
    assert!(!entries.is_empty(), "enum {name} z pinu bez wariantow");
    entries
}

/// Nazwy pol interfejsu `name` z pinu. Linie postaci `pole: Typ;` (opcjonalnie `readonly`).
fn pin_interface_fields(name: &str) -> Vec<String> {
    let header = format!("export interface {name} {{");
    let start = PIN
        .find(&header)
        .unwrap_or_else(|| panic!("brak `{header}` w pinie"))
        + header.len();
    let body = &PIN[start..];
    let body = &body[..body.find('}').expect("koniec interfejsu")];
    let fields: Vec<String> = body
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            let line = line.strip_prefix("readonly ").unwrap_or(line);
            let (lhs, _) = line.split_once(':')?;
            let lhs = lhs.trim();
            if lhs.is_empty() || !lhs.chars().all(|c| c.is_ascii_alphanumeric()) {
                return None;
            }
            Some(lhs.to_string())
        })
        .collect();
    assert!(!fields.is_empty(), "interfejs {name} z pinu bez pol");
    fields
}

fn sorted(mut v: Vec<String>) -> Vec<String> {
    v.sort();
    v
}

fn json_keys(value: &Value) -> Vec<String> {
    let mut keys: Vec<String> = value
        .as_object()
        .expect("obiekt JSON")
        .keys()
        .cloned()
        .collect();
    keys.sort();
    keys
}

fn to_json_string<T: Serialize>(value: &T) -> String {
    match serde_json::to_value(value).expect("serialize") {
        Value::String(s) => s,
        other => panic!("oczekiwano stringa JSON, jest {other:?}"),
    }
}

/// Porownanie enuma z pinem: (nazwa wariantu w Rust == nazwa TS, wartosc JSON == wartosc TS), ta sama kolejnosc.
fn check_enum<T: Serialize + Debug>(name: &str, all: &[T]) {
    let got: Vec<(String, String)> = all
        .iter()
        .map(|v| (format!("{v:?}"), to_json_string(v)))
        .collect();
    assert_eq!(got, pin_enum_entries(name), "enum {name} rozni sie od pinu");
}

fn round_trip<T: Serialize + DeserializeOwned + PartialEq + Debug>(value: &T) {
    let text = serde_json::to_string(value).expect("serialize");
    let back: T = serde_json::from_str(&text).expect("deserialize");
    assert_eq!(&back, value, "round-trip zmienil wartosc: {text}");
}

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

fn sample_hex() -> MapHex {
    let mut widocznosc = BTreeMap::new();
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
// web_values_*: nazwy i wartosci enumow == pin (hex.ts:12-64)
// ---------------------------------------------------------------------------

#[test]
fn web_values_terenbazowy_match_pin() {
    check_enum("TerenBazowy", &teren_all());
}

#[test]
fn web_values_nakladka_match_pin() {
    check_enum("Nakladka", &nakladka_all());
}

#[test]
fn web_values_ulepszenie_match_pin() {
    check_enum("Ulepszenie", &ulepszenie_all());
}

#[test]
fn web_values_widocznosc_match_pin() {
    check_enum("Widocznosc", &widocznosc_all());
}

// ---------------------------------------------------------------------------
// shape_*: liczby wariantow i pola wzgledem pinu
// ---------------------------------------------------------------------------

#[test]
fn shape_variant_counts_are_8_8_8_3() {
    assert_eq!(pin_enum_entries("TerenBazowy").len(), 8);
    assert_eq!(pin_enum_entries("Nakladka").len(), 8);
    assert_eq!(pin_enum_entries("Ulepszenie").len(), 8);
    assert_eq!(pin_enum_entries("Widocznosc").len(), 3);
    // Tablice `*_all()` (dlugosc wymuszona typem) musza byc permutacja wariantow: pozycja i == indeks i.
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
fn shape_fields_match_pin_interfaces() {
    let hex = serde_json::to_value(sample_hex()).expect("serialize");
    assert_eq!(json_keys(&hex), sorted(pin_interface_fields("Hex")));
    assert_eq!(
        json_keys(&hex["wioska"]),
        sorted(pin_interface_fields("Wioska"))
    );
    assert_eq!(
        json_keys(&hex["rzeka"]),
        sorted(pin_interface_fields("RzekaInfo"))
    );
    assert_eq!(
        json_keys(&hex["coords"]),
        sorted(pin_interface_fields("HexCoords"))
    );
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

/// Surowy JSON mapy (nie `serde_json::Value`, ktory sortuje klucze leksykograficznie).
/// Wstawiamy 10 przed 2: numeryczny porzadek BTreeMap<PlayerId,_> daje "2" przed "10".
#[test]
fn visibility_map_keys_serialize_in_numeric_player_order() {
    let mut widocznosc = BTreeMap::new();
    widocznosc.insert(PlayerId::new(10), Widocznosc::Odkryty);
    widocznosc.insert(PlayerId::new(2), Widocznosc::Widoczny);
    assert_eq!(
        serde_json::to_string(&widocznosc).expect("serialize"),
        r#"{"2":"widoczny","10":"odkryty"}"#
    );
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
fn reject_unknown_field_in_wioska() {
    let mut value = sample_hex_json();
    value["wioska"]["dodatkowe"] = json!(1);
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_unknown_field_in_rzeka() {
    let mut value = sample_hex_json();
    value["rzeka"]["dodatkowe"] = json!(1);
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_unknown_field_in_coords() {
    let mut value = sample_hex_json();
    value["coords"]["s"] = json!(2);
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_missing_coords_field() {
    let mut value = sample_hex_json();
    value["coords"].as_object_mut().unwrap().remove("r");
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

#[test]
fn reject_negative_ludnosc() {
    let mut value = sample_hex_json();
    value["wioska"]["ludnosc"] = json!(-1);
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_missing_rzeka_krawedzie() {
    let mut value = sample_hex_json();
    value["rzeka"] = json!({ "obecna": true });
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_krawedzie_above_u8() {
    let mut value = sample_hex_json();
    value["rzeka"]["krawedzie"] = json!([256]);
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_string_owner_like_web_player_id() {
    let mut value = sample_hex_json();
    value["wlasciciel"] = json!("player_0");
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

#[test]
fn reject_string_visibility_key_like_web_player_id() {
    let mut value = sample_hex_json();
    value["widocznosc"] = json!({ "player_0": "widoczny" });
    assert!(serde_json::from_value::<MapHex>(value).is_err());
}

// ---------------------------------------------------------------------------
// web_parity_*: zakresy nie sa walidowane, jak w webie (decyzja Z3b, 02a-obrona.md).
// Web: hex.ts:84 ("0 gdy brak"), hex.ts:97-99 ("indeksy 0-5", "pusta gdy obecna = false") to komentarze,
// nie kod walidujacy. Ten test dokumentuje, ze typ przyjmuje te wartosci; nie jest to rekomendacja danych.
// ---------------------------------------------------------------------------

#[test]
fn web_parity_does_not_validate_ranges() {
    let mut value = sample_hex_json();
    value["wioska"] = json!({ "istnieje": false, "ludnosc": 7 });
    value["rzeka"] = json!({ "obecna": false, "krawedzie": [9, 7] });
    let hex: MapHex =
        serde_json::from_value(value).expect("parytet z webem: bez walidacji zakresu");
    assert_eq!(hex.wioska.ludnosc, 7);
    assert_eq!(hex.rzeka.krawedzie, vec![9, 7]);
}
