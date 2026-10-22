//! Wspolne pomocniki testow P6.5A (wektory z URUCHOMIONEGO weba, pin edb8fb56).
//!
//! Kodowanie wektorow (generator `gen-p65a-vectors.mjs`): liczby specjalne jako
//! `{"$n": "NaN" | "Infinity" | "-Infinity" | "-0"}`, niecalkowite jako `{"$f": "<String(x)>"}`
//! (czytane przez `str::parse::<f64>()`); `undefined` = brak klucza.
#![allow(dead_code)]

use civ_engine::domain::recruitment::army_merge::StosJednostka;
use serde_json::Value;

/// Dekoduje liczbe wektora (zwykla albo specjalna).
pub fn num(value: &Value) -> f64 {
    match value {
        Value::Number(number) => number.as_f64().expect("liczba f64"),
        Value::Object(object) if object.contains_key("$f") => object["$f"]
            .as_str()
            .expect("$f jest napisem")
            .parse::<f64>()
            .expect("$f jest liczba"),
        Value::Object(object) if object.contains_key("$n") => {
            match object["$n"].as_str().expect("$n jest napisem") {
                "NaN" => f64::NAN,
                "Infinity" => f64::INFINITY,
                "-Infinity" => f64::NEG_INFINITY,
                "-0" => -0.0,
                other => panic!("nieznana liczba specjalna {other}"),
            }
        }
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

/// Liczba opcjonalna: brak klucza / `null` / nie-liczba to `None` (web: `typeof !== 'number'`).
pub fn opt_num(value: Option<&Value>) -> Option<f64> {
    match value {
        Some(number @ Value::Number(_)) => Some(num(number)),
        Some(special @ Value::Object(object))
            if object.contains_key("$n") || object.contains_key("$f") =>
        {
            Some(num(special))
        }
        _ => None,
    }
}

pub fn opt_string(value: Option<&Value>) -> Option<String> {
    match value {
        Some(Value::String(text)) => Some(text.clone()),
        _ => None,
    }
}

/// Bitowa rownosc `f64` z wyjatkiem: `NaN == NaN`; `-0` i `0` SA ROZROZNIANE (porownanie bitow).
pub fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

pub fn assert_same(label: &str, got: f64, want: f64) {
    assert!(
        same(got, want),
        "{label}: got {got:?} ({:#018x}), web {want:?} ({:#018x})",
        got.to_bits(),
        want.to_bits()
    );
}

pub fn assert_opt_same(label: &str, got: Option<f64>, want: Option<f64>) {
    match (got, want) {
        (None, None) => {}
        (Some(g), Some(w)) => assert_same(label, g, w),
        other => panic!("{label}: got/web {other:?}"),
    }
}

pub fn cases<'a>(root: &'a Value, name: &str) -> &'a Vec<Value> {
    root["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

pub fn load(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory parse")
}

fn int(value: &Value, what: &str) -> i32 {
    i32::try_from(value.as_i64().unwrap_or_else(|| panic!("{what}"))).expect("i32")
}

pub fn pair(value: &Value) -> (i32, i32) {
    let items = value.as_array().expect("para");
    (int(&items[0], "q"), int(&items[1], "r"))
}

pub fn pairs(value: &Value) -> Vec<(i32, i32)> {
    value
        .as_array()
        .expect("lista par")
        .iter()
        .map(pair)
        .collect()
}

pub fn unit(value: &Value) -> StosJednostka {
    let mut unit = StosJednostka::new(
        value["id"].as_str().expect("id"),
        value["ownerId"].as_i64().expect("ownerId"),
        value["typeId"].as_str().expect("typeId"),
        int(&value["q"], "q"),
        int(&value["r"], "r"),
    );
    unit.ruch = opt_num(value.get("ruch")).expect("ruch");
    unit.ruch_left = opt_num(value.get("ruchLeft")).expect("ruchLeft");
    unit.in_garnizon = value.get("inGarnizon").and_then(Value::as_bool);
    unit.fortify_ruch_snapshot = opt_num(value.get("fortifyRuchSnapshot"));
    unit.hp = opt_num(value.get("hp"));
    unit.oblega_city_id = opt_string(value.get("oblegaCityId"));
    unit.sentry = value.get("sentry").and_then(Value::as_bool);
    unit.auto_explore = value.get("autoExplore").and_then(Value::as_bool);
    unit.ufortyfikowany_w_polu = value.get("ufortyfikowanyWPolu").and_then(Value::as_bool);
    unit.stack_group_id = opt_string(value.get("stackGroupId"));
    unit
}

pub fn units(value: &Value) -> Vec<StosJednostka> {
    value
        .as_array()
        .expect("jednostki")
        .iter()
        .map(unit)
        .collect()
}

pub fn indices(value: &Value) -> Vec<usize> {
    value
        .as_array()
        .expect("indeksy")
        .iter()
        .map(|item| usize::try_from(item.as_u64().expect("indeks")).expect("usize"))
        .collect()
}

/// Indeksy wskazanych referencji w liscie `all` (porownanie wskaznikow).
pub fn positions(all: &[StosJednostka], picked: &[&StosJednostka]) -> Vec<usize> {
    picked
        .iter()
        .map(|item| {
            all.iter()
                .position(|candidate| std::ptr::eq(candidate, *item))
                .expect("referencja spoza listy")
        })
        .collect()
}

pub fn refs<'a>(all: &'a [StosJednostka], at: &[usize]) -> Vec<&'a StosJednostka> {
    at.iter().map(|&i| &all[i]).collect()
}

/// Rownosc jednostek pole po polu (`NaN == NaN`, bitowo dla `f64`).
pub fn assert_unit(label: &str, got: &StosJednostka, want: &StosJednostka) {
    assert_eq!(got.id, want.id, "{label} id");
    assert_eq!(got.owner_id, want.owner_id, "{label} owner_id");
    assert_eq!(got.type_id, want.type_id, "{label} type_id");
    assert_eq!((got.q, got.r), (want.q, want.r), "{label} q,r");
    assert_same(&format!("{label} ruch"), got.ruch, want.ruch);
    assert_same(&format!("{label} ruch_left"), got.ruch_left, want.ruch_left);
    assert_eq!(got.in_garnizon, want.in_garnizon, "{label} in_garnizon");
    assert_opt_same(
        &format!("{label} fortify_ruch_snapshot"),
        got.fortify_ruch_snapshot,
        want.fortify_ruch_snapshot,
    );
    assert_opt_same(&format!("{label} hp"), got.hp, want.hp);
    assert_eq!(
        got.oblega_city_id, want.oblega_city_id,
        "{label} oblega_city_id"
    );
    assert_eq!(got.sentry, want.sentry, "{label} sentry");
    assert_eq!(got.auto_explore, want.auto_explore, "{label} auto_explore");
    assert_eq!(
        got.ufortyfikowany_w_polu, want.ufortyfikowany_w_polu,
        "{label} ufortyfikowany_w_polu"
    );
    assert_eq!(
        got.stack_group_id, want.stack_group_id,
        "{label} stack_group_id"
    );
}

pub fn assert_units(label: &str, got: &[StosJednostka], want: &[StosJednostka]) {
    assert_eq!(got.len(), want.len(), "{label}: liczba jednostek");
    for (i, (g, w)) in got.iter().zip(want).enumerate() {
        assert_unit(&format!("{label}[{i}]"), g, w);
    }
}

/// Zbior zablokowanych heksow z wektora -> predykat przejezdnosci.
pub fn blocked_set(value: &Value) -> Option<std::collections::HashSet<(i32, i32)>> {
    value.as_array().map(|list| list.iter().map(pair).collect())
}
