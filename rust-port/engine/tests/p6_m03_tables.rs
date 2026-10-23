//! P6.M03 - testy KSZTALTU tabeli `data/derived/mapgen-masks.json` i jej parsera: bez pinow
//! wartosci balansowych (te zamraza porownanie z webem w `p6_m03_masks.rs` / `p6_m03_centers.rs`),
//! za to z kontrola struktury, niezmiennikow i dokladnosci parsowania liczb zmiennoprzecinkowych.

use civ_engine::data::derived::{mapgen_masks, parse_mapgen_masks, MAPGEN_MASKS_JSON};
use civ_engine::domain::map_generator::WorldType;
use civ_engine::domain::mapgen::masks::{
    continent_center_count, island_grid_divisions, kontynenty_zone_count, ziemia_land_centers,
};
use serde_json::Value;

#[test]
fn table_parses_and_is_cached() {
    let parsed = parse_mapgen_masks().expect("parse");
    assert_eq!(&parsed, mapgen_masks());
    assert!(!parsed.zrodlo.is_empty());
}

#[test]
fn table_has_no_unknown_or_missing_keys() {
    // `deny_unknown_fields` odrzuca nadmiarowe klucze; brakujace odrzuca serde. Dodatkowo kazdy
    // liść JSON musi byc liczba (poza `zrodlo`), co chroni przed liczbami zapisanymi tekstem.
    fn walk(value: &Value, path: &str, numbers: &mut usize) {
        match value {
            Value::Object(map) => {
                for (key, inner) in map {
                    if key == "zrodlo" {
                        continue;
                    }
                    walk(inner, &format!("{path}.{key}"), numbers);
                }
            }
            Value::Array(items) => {
                for (i, inner) in items.iter().enumerate() {
                    walk(inner, &format!("{path}[{i}]"), numbers);
                }
            }
            Value::Number(_) => *numbers += 1,
            other => panic!("{path}: oczekiwano liczby, jest {other}"),
        }
    }
    let root: Value = serde_json::from_str(MAPGEN_MASKS_JSON).expect("json");
    let mut numbers = 0;
    walk(&root, "", &mut numbers);
    assert!(numbers > 100, "tabela zawiera tylko {numbers} liczb");
}

/// Wszystkie liczby tabeli musza byc zparsowane do tego samego f64 co z surowego tekstu
/// (`serde_json` bez `float_roundtrip` moze przeklamac ulp).
#[test]
fn every_table_float_is_parsed_exactly_from_the_raw_text() {
    fn collect(value: &Value, out: &mut Vec<f64>) {
        match value {
            Value::Object(map) => map.values().for_each(|v| collect(v, out)),
            Value::Array(items) => items.iter().for_each(|v| collect(v, out)),
            Value::Number(n) => out.push(n.as_f64().expect("f64")),
            _ => {}
        }
    }
    let parsed: Value = serde_json::from_str(MAPGEN_MASKS_JSON).expect("json");
    let mut from_serde = Vec::new();
    collect(&parsed, &mut from_serde);

    // Niezalezny skaner tokenow liczbowych w surowym tekscie (poza lancuchami).
    let mut raw = Vec::new();
    let mut in_string = false;
    let mut token = String::new();
    for ch in MAPGEN_MASKS_JSON.chars() {
        if ch == '"' {
            in_string = !in_string;
            continue;
        }
        if in_string {
            continue;
        }
        if ch.is_ascii_digit() || matches!(ch, '.' | '-' | '+' | 'e' | 'E') {
            token.push(ch);
        } else if !token.is_empty() {
            raw.push(token.parse::<f64>().expect("token liczbowy"));
            token.clear();
        }
    }
    // `Value::Object` jest posortowany po kluczach, tekst ma kolejnosc pliku: porownanie multizbiorow.
    assert_eq!(from_serde.len(), raw.len());
    let mut serde_bits: Vec<u64> = from_serde.iter().map(|v| v.to_bits()).collect();
    let mut raw_bits: Vec<u64> = raw.iter().map(|v| v.to_bits()).collect();
    serde_bits.sort_unstable();
    raw_bits.sort_unstable();
    assert_eq!(serde_bits, raw_bits);
}

#[test]
fn table_invariants_hold() {
    let t = mapgen_masks();
    // Zakresy promieni i pierscieni: dolna granica nie przekracza gornej.
    assert!(t.centra.promien_min <= t.centra.promien_max);
    assert!(t.centra.pierscien_min <= t.centra.pierscien_max);
    assert!(t.centra.proby >= 1);
    assert!(t.wyspy.rozmiar.min <= t.wyspy.rozmiar.max);
    assert!(t.wyspy.siatka >= 1);
    assert!(t.brzeg.ocean_heksy <= t.brzeg.strefa_marginesu_heksy);
    assert!(t.brzeg.dzielnik_zaniku > 0.0 && t.brzeg.min_margines > 0.0);
    assert!(t.pangea.t_zakres > 0.0);
    assert!(t.pangea.liczba_male <= t.pangea.liczba_srednie);
    assert!(t.pangea.liczba_srednie <= t.pangea.liczba_duze);
    assert!(t.pangea.prog_male <= t.pangea.prog_srednie);
    assert!(t.kontynenty.liczba_male <= t.kontynenty.liczba_srednie);
    assert!(t.kontynenty.liczba_srednie <= t.kontynenty.liczba_duze);
    assert!(t.kontynenty.obszar_male <= t.kontynenty.obszar_srednie);
    // Oktawy szumu >= 1; amplitudy dodatnie.
    for layer in [
        &t.kontynenty.szum_gruby,
        &t.kontynenty.szum_drobny,
        &t.pangea.blob.szum_gruby,
        &t.pangea.blob.szum_drobny,
        &t.wyspy.szum_gruby,
        &t.wyspy.szum_drobny,
        &t.ziemia.szum_brzegu,
    ] {
        assert!(layer.oktawy >= 1 && layer.amplituda > 0.0 && layer.mnoznik_skali > 0.0);
    }
    for layer in [
        &t.kontynenty.szum_kata,
        &t.pangea.blob.szum_kata,
        &t.wyspy.szum_kata,
    ] {
        assert!(layer.oktawy >= 1 && layer.amplituda > 0.0);
    }
    // Centra Ziemi leza w kwadracie jednostkowym i maja dodatni promien.
    assert!(!t.ziemia.centra.is_empty());
    for c in &t.ziemia.centra {
        assert!((0.0..=1.0).contains(&c.nq) && (0.0..=1.0).contains(&c.nr) && c.radius > 0.0);
    }
}

#[test]
fn accessors_are_driven_by_the_table_not_by_literals() {
    let t = mapgen_masks();
    assert_eq!(kontynenty_zone_count(), t.kontynenty.liczba_stref);
    assert_eq!(island_grid_divisions(), t.wyspy.siatka);
    assert_eq!(ziemia_land_centers().len(), t.ziemia.centra.len());
    assert_eq!(
        continent_center_count(10, 10, WorldType::Continents),
        t.kontynenty.liczba_stref
    );
    // Progi liczby centrow wynikaja z tabeli: dla powierzchni tuz ponizej/powyzej progu.
    let small = (t.kontynenty.obszar_male as u32).saturating_sub(1);
    assert_eq!(
        continent_center_count(small, 1, WorldType::Earth),
        t.kontynenty.liczba_male
    );
    assert_eq!(
        continent_center_count(t.kontynenty.obszar_male as u32, 1, WorldType::Earth),
        t.kontynenty.liczba_srednie
    );
    assert_eq!(
        continent_center_count(t.kontynenty.obszar_srednie as u32, 1, WorldType::Earth),
        t.kontynenty.liczba_duze
    );
}
