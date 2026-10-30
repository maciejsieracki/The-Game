//! P6.8B-P1b (pin webu 91dc998a), czesc 1: porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba.
//!
//! Wektory: `tests/p6_8b_vectors/p1b.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/gen-p6-8b-p1b-vectors.mjs`
//! (Node 22 + loader TS, kod wycinany z `production.ts` @91dc998a, bez builda gra/).
//!
//! Kodowanie liczb: calkowita = JSON number; niecalkowita = {"$f": "..."}; NaN/Infinity/-0 = {"$n": "..."}.
//! Nieobecne pole = {"absent": true}; null = null.

use civ_engine::domain::production_units::{
    population_cost_of, strip_diacritics, unit_stock_shortfall_label, ProductionItem,
    ProductionKind, UNIT_POPULATION_COST,
};
use serde_json::Value;
use std::collections::BTreeMap;

const P1B_JSON: &str = include_str!("p6_8b_vectors/p1b.json");

fn root() -> Value {
    serde_json::from_str(P1B_JSON).expect("wektor JSON p1b")
}

/// Liczba z wektora (patrz kodowanie wyzej).
fn dec(v: &Value) -> f64 {
    if let Some(n) = v.as_f64() {
        return n;
    }
    if let Some(s) = v.get("$f").and_then(Value::as_str) {
        return s.parse::<f64>().expect("$f");
    }
    match v.get("$n").and_then(Value::as_str).expect("$n") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => panic!("nieznana liczba {other}"),
    }
}

fn same_num(actual: f64, expected: &Value) -> bool {
    let e = dec(expected);
    if e.is_nan() {
        return actual.is_nan();
    }
    if e == 0.0 && e.is_sign_negative() {
        return actual == 0.0 && actual.is_sign_negative();
    }
    actual == e
}

/// Argument `Surowiec`: `{absent}` i `null` daja `None` (web: brak pola / null -> '').
fn surowiec_arg(v: &Value) -> Option<&str> {
    v.as_str()
}

/// Mapa zapasu: `{absent}` i `null` daja `None`; obiekt -> mapa klucz -> liczba.
fn stock_arg(v: &Value) -> Option<BTreeMap<String, f64>> {
    if v.get("absent").is_some() {
        return None;
    }
    let obj = v.as_object()?;
    Some(obj.iter().map(|(k, x)| (k.clone(), dec(x))).collect())
}

#[test]
fn stock_shortfall_label_matches_web_vectors() {
    let r = root();
    let cases = r["stockShortfall"].as_array().expect("stockShortfall");
    assert!(cases.len() >= 400, "za malo wektorow: {}", cases.len());
    for c in cases {
        let surowiec = surowiec_arg(&c["surowiec"]);
        let stock = stock_arg(&c["stock"]);
        let got = unit_stock_shortfall_label(surowiec, stock.as_ref());
        let expected = c["out"].as_str().map(str::to_string);
        assert_eq!(
            got, expected,
            "surowiec={} stock={}",
            c["surowiec"], c["stock"]
        );
    }
}

#[test]
fn stock_shortfall_label_thresholds_and_special_values() {
    // Web `(x ?? 0) > 0`: zapas 0, ujemny, -0 i NaN daje brak (Some = blokada); Infinity i dodatni przechodza.
    let mk = |v: f64| {
        let mut m = BTreeMap::new();
        m.insert("braz".to_string(), v);
        m
    };
    let blocked = |v: f64| unit_stock_shortfall_label(Some("Brąz"), Some(&mk(v))).is_some();
    assert!(blocked(0.0));
    assert!(blocked(-0.0));
    assert!(blocked(-1.0));
    assert!(blocked(f64::NAN));
    assert!(!blocked(0.0001));
    assert!(!blocked(f64::INFINITY));
    assert!(!blocked(1.0));
}

#[test]
fn stock_shortfall_label_text_is_exact() {
    assert_eq!(
        unit_stock_shortfall_label(Some("Żelazo"), None).as_deref(),
        Some("Brak w magazynie państwa: Żelazo")
    );
    assert_eq!(
        unit_stock_shortfall_label(Some("drewno"), None).as_deref(),
        Some("Brak w magazynie państwa: Drewno")
    );
    // Diakrytyki w Surowiec (NFD) sa zdejmowane przed lookupem; ł nie jest diakrytykiem.
    assert_eq!(
        unit_stock_shortfall_label(Some("Brąz\u{0301}"), None).as_deref(),
        Some("Brak w magazynie państwa: Brąz")
    );
    // Nieznany surowiec / brak -> None (web: brak wpisu w UNIT_STOCK_GATE_LABEL).
    assert_eq!(unit_stock_shortfall_label(Some("Kamień"), None), None);
    assert_eq!(unit_stock_shortfall_label(None, None), None);
    assert_eq!(unit_stock_shortfall_label(Some(""), None), None);
}

#[test]
fn stock_shortfall_prototype_keys_deviation_is_pinned() {
    // Web: UNIT_STOCK_GATE_LABEL to zwykly obiekt, wiec `['constructor']` itd. zwraca wartosc
    // dziedziczona (truthy) i web zwraca napis z jej reprezentacja. Rust nie ma takich wpisow: None.
    // Odstepstwo swiadome (nie wystepuje w danych gry); wektory `stockShortfallProto` przypinaja wynik webu.
    let r = root();
    for c in r["stockShortfallProto"].as_array().expect("proto") {
        let surowiec = c["surowiec"].as_str().expect("surowiec");
        assert!(
            c["outIsString"].as_bool() == Some(true),
            "web musi zwracac napis dla {surowiec}"
        );
        assert_eq!(
            unit_stock_shortfall_label(Some(surowiec), None),
            None,
            "{surowiec}"
        );
    }
}

#[test]
fn strip_diacritics_bmp_matches_web() {
    // Pelna plaszczyzna BMP (bez surogatow): oczekiwany wynik = wpis z listy webu (`stripDiacriticsChanged`),
    // a dla pozostalych znakow toLowerCase(znak) (web: NFD, usuniecie U+0300-U+036F, toLowerCase).
    let r = root();
    let mut expected: BTreeMap<u32, String> = BTreeMap::new();
    for c in r["stripDiacriticsChanged"]
        .as_array()
        .expect("stripDiacriticsChanged")
    {
        let cp = c["c"].as_u64().expect("c") as u32;
        expected.insert(cp, c["out"].as_str().expect("out").to_string());
    }
    // Znana, PRZYPIETA granica (nie blad testu): (a) sylaby Hangul AC00-D7A3 (11 172 znakow) nie sa
    // rozkladane algorytmicznie; (b) 173 pozostalych znakow BMP, dla ktorych web zostawia znaki spoza
    // U+0300-U+036F albo ma kilka baz, nie jest w tablicy NFD_BASE -> Rust zwraca znak bez zmian.
    // Zmiana liczby rozbieznosci (np. po rozszerzeniu tablicy) wymaga swiadomej aktualizacji tych liczb.
    const HANGUL_FIRST: u32 = 0xAC00;
    const HANGUL_LAST: u32 = 0xD7A3;
    const PINNED_HANGUL_MISMATCHES: usize = 11_172;
    const PINNED_OTHER_MISMATCHES: usize = 173;
    let mut hangul = 0usize;
    let mut other: Vec<(u32, String, String)> = Vec::new();
    for cp in 0u32..=0xFFFF {
        let Some(ch) = char::from_u32(cp) else {
            continue;
        };
        let lower = ch.to_lowercase().collect::<String>();
        let want = expected.get(&cp).cloned().unwrap_or_else(|| lower.clone());
        let got = strip_diacritics(&ch.to_string());
        if got == want {
            continue;
        }
        if (HANGUL_FIRST..=HANGUL_LAST).contains(&cp) {
            hangul += 1;
        } else {
            // Pozostale rozbieznosci: Rust zwraca znak bez zmian (poza tablica NFD_BASE).
            assert_eq!(got, lower, "U+{cp:04X}: oczekiwany pass-through");
            other.push((cp, want, got));
        }
    }
    assert_eq!(hangul, PINNED_HANGUL_MISMATCHES, "rozbieznosci Hangul");
    assert_eq!(
        other.len(),
        PINNED_OTHER_MISMATCHES,
        "pozostale rozbieznosci strip_diacritics: {:?}",
        &other[..other.len().min(10)]
    );
}

#[test]
fn unit_population_cost_matches_web() {
    let r = root();
    assert!(
        same_num(UNIT_POPULATION_COST, &r["unitPopulationCost"]),
        "UNIT_POPULATION_COST != web"
    );
}

#[test]
fn population_cost_of_matches_web_vectors() {
    let r = root();
    for c in r["populationCost"].as_array().expect("populationCost") {
        let it = &c["item"];
        let kind = match it["kind"].as_str().expect("kind") {
            "jednostka" => ProductionKind::Jednostka,
            "budynek" => ProductionKind::Budynek,
            other => panic!("kind {other}"),
        };
        let item = ProductionItem {
            kind,
            id: it["id"].as_str().expect("id").to_string(),
            nazwa: it["nazwa"].as_str().expect("nazwa").to_string(),
            koszt: dec(&it["koszt"]),
            postep: None,
            is_general: None,
        };
        assert!(same_num(population_cost_of(&item), &c["out"]), "{:?}", item);
    }
}
