//! Wspolne pomocniki testow P6.5B (wektory z URUCHOMIONEGO weba, pin edb8fb56).
//!
//! Kodowanie wektorow (generator `gen-p65b-vectors.mjs`): liczby specjalne jako
//! `{"$n": "NaN" | "Infinity" | "-Infinity" | "-0"}`, niecalkowite jako `{"$f": "<String(x)>"}`
//! (czytane przez `str::parse::<f64>()`); `undefined` = brak klucza.
#![allow(dead_code)]

use civ_engine::domain::recruitment::manpower::{
    CivBonusPoborLite, ManpowerCity, ManpowerHealUnit, MiastoManpowerRaw, ReplenishRaw,
};
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

/// Czy wartosc wektora jest liczba (web: `typeof === 'number'`), w tym liczba specjalna.
pub fn is_num(value: &Value) -> bool {
    match value {
        Value::Number(_) => true,
        Value::Object(object) => object.contains_key("$f") || object.contains_key("$n"),
        _ => false,
    }
}

/// Liczba opcjonalna: brak klucza / `null` / nie-liczba to `None` (web: `typeof !== 'number'`).
pub fn opt_num(value: Option<&Value>) -> Option<f64> {
    value.filter(|v| is_num(v)).map(num)
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

pub fn load(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory parse")
}

pub fn list<'a>(value: &'a Value, what: &str) -> &'a Vec<Value> {
    value
        .as_array()
        .unwrap_or_else(|| panic!("oczekiwano listy: {what}"))
}

fn int(value: &Value, what: &str) -> i32 {
    i32::try_from(value.as_i64().unwrap_or_else(|| panic!("{what}"))).expect("i32")
}

pub fn city(value: &Value) -> ManpowerCity {
    ManpowerCity {
        id: value["id"].as_str().expect("id miasta").to_owned(),
        owner_id: value["ownerId"].as_i64().expect("ownerId"),
        population: num(&value["population"]),
        manpower: opt_num(value.get("manpower")),
        q: int(&value["q"], "q"),
        r: int(&value["r"], "r"),
        oblegane: value.get("oblegane").and_then(Value::as_bool),
    }
}

pub fn cities(value: &Value) -> Vec<ManpowerCity> {
    list(value, "miasta").iter().map(city).collect()
}

pub fn assert_city(label: &str, got: &ManpowerCity, want: &ManpowerCity) {
    assert_eq!(got.id, want.id, "{label} id");
    assert_eq!(got.owner_id, want.owner_id, "{label} owner_id");
    assert_same(
        &format!("{label} population"),
        got.population,
        want.population,
    );
    assert_opt_same(&format!("{label} manpower"), got.manpower, want.manpower);
    assert_eq!((got.q, got.r), (want.q, want.r), "{label} q,r");
    assert_eq!(got.oblegane, want.oblegane, "{label} oblegane");
}

pub fn assert_cities(label: &str, got: &[ManpowerCity], want: &[ManpowerCity]) {
    assert_eq!(got.len(), want.len(), "{label}: liczba miast");
    for (i, (g, w)) in got.iter().zip(want).enumerate() {
        assert_city(&format!("{label}[{i}]"), g, w);
    }
}

pub fn heal_unit(value: &Value) -> ManpowerHealUnit {
    ManpowerHealUnit {
        id: value["id"].as_str().expect("id jednostki").to_owned(),
        owner_id: value["ownerId"].as_i64().expect("ownerId"),
        type_id: value["typeId"].as_str().expect("typeId").to_owned(),
        category: value["category"].as_str().expect("category").to_owned(),
        hp: opt_num(value.get("hp")),
        hp_max: opt_num(value.get("hpMax")),
        parametry_bonus_proc: opt_num(value.get("parametryBonusProc")),
        battles_survived: opt_num(value.get("battlesSurvived")),
        q: value
            .get("q")
            .and_then(Value::as_i64)
            .map(|q| i32::try_from(q).expect("q i32")),
        r: value
            .get("r")
            .and_then(Value::as_i64)
            .map(|r| i32::try_from(r).expect("r i32")),
        in_garnizon: value.get("inGarnizon").and_then(Value::as_bool),
    }
}

pub fn heal_units(value: &Value) -> Vec<ManpowerHealUnit> {
    list(value, "jednostki").iter().map(heal_unit).collect()
}

pub fn assert_heal_unit(label: &str, got: &ManpowerHealUnit, want: &ManpowerHealUnit) {
    assert_eq!(got.id, want.id, "{label} id");
    assert_eq!(got.owner_id, want.owner_id, "{label} owner_id");
    assert_eq!(got.type_id, want.type_id, "{label} type_id");
    assert_eq!(got.category, want.category, "{label} category");
    assert_opt_same(&format!("{label} hp"), got.hp, want.hp);
    assert_opt_same(&format!("{label} hp_max"), got.hp_max, want.hp_max);
    assert_opt_same(
        &format!("{label} parametry"),
        got.parametry_bonus_proc,
        want.parametry_bonus_proc,
    );
    assert_opt_same(
        &format!("{label} battles"),
        got.battles_survived,
        want.battles_survived,
    );
    assert_eq!((got.q, got.r), (want.q, want.r), "{label} q,r");
    assert_eq!(got.in_garnizon, want.in_garnizon, "{label} in_garnizon");
}

pub fn assert_heal_units(label: &str, got: &[ManpowerHealUnit], want: &[ManpowerHealUnit]) {
    assert_eq!(got.len(), want.len(), "{label}: liczba jednostek");
    for (i, (g, w)) in got.iter().zip(want).enumerate() {
        assert_heal_unit(&format!("{label}[{i}]"), g, w);
    }
}

/// Lista bonusow cywilizacji: tylko liczby sa czytane (`typeof wartosc === 'number'`).
pub fn bonusy(value: Option<&Value>) -> Option<Vec<CivBonusPoborLite>> {
    match value {
        Some(Value::Array(items)) => Some(
            items
                .iter()
                .map(|b| CivBonusPoborLite {
                    typ: opt_string(b.get("typ")),
                    wartosc: opt_num(b.get("wartosc")),
                })
                .collect(),
        ),
        _ => None,
    }
}

/// Surowy obiekt `miasto-params` z wektora (`raw`): wiersze nie-liczbowe to `None`.
pub fn raw_miasto(value: &Value) -> MiastoManpowerRaw {
    let replenish = value
        .get("manpower_uzupelnienie_hp_proc_max_tura")
        .filter(|row| row.is_object())
        .map(|row| ReplenishRaw {
            easy: opt_num(row.get("easy")),
            normal: opt_num(row.get("normal")),
            hard: opt_num(row.get("hard")),
        });
    MiastoManpowerRaw {
        replenish,
        regen_pct: opt_num(
            value
                .get("manpower_regen_proc_max_tura")
                .and_then(|row| row.get("wartosc")),
        ),
        regen_block: value
            .get("manpower_regen_blok_oblezenie")
            .and_then(|row| row.get("wartosc"))
            .map(|w| if is_num(w) { num(w) } else { f64::NAN }),
    }
}
