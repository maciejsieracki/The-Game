//! Wspolne pomocniki testow P6.4 (wektory z URUCHOMIONEGO weba, pin edb8fb56).
//!
//! Kodowanie wektorow (generator `gen-p64-vectors.mjs`): liczby specjalne jako
//! `{"$n": "NaN" | "Infinity" | "-Infinity" | "-0"}`, niecalkowite jako `{"$f": "<String(x)>"}` (serde_json
//! bez `float_roundtrip` myli sie o 1 ulp, wiec czytamy `str::parse::<f64>()`); `undefined` = brak klucza; zbiory jako tablice
//! (kolejnosc wstawiania `Set` weba zachowana).
#![allow(dead_code)]

use civ_engine::domain::civ_bonuses::{BonusValue, CivBonusEntry};
use civ_engine::domain::pathfinding::ruch_jednostek::{
    embark_move_cost, move_cost_fn_for, BoxedCostFn, Klucz, OrderedHexSet, RuchHex, RuchJednostka,
    RuchMapa, TerenBazowy,
};
use serde_json::Value;
use std::collections::HashSet;

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

/// Liczba opcjonalna: brak klucza i `null` to `None`; napis / bool / tablica to tez `None`
/// (web: `typeof !== 'number'`).
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

/// Rowne liczbowo: `NaN == NaN`, `-0 == 0`.
pub fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

pub fn assert_same(label: &str, got: f64, want: f64) {
    assert!(same(got, want), "{label}: got {got:?}, web {want:?}");
}

pub fn cases<'a>(root: &'a Value, name: &str) -> &'a Vec<Value> {
    root["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

pub fn load(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory parse")
}

pub fn pair(value: &Value) -> Klucz {
    let items = value.as_array().expect("para");
    (
        i32::try_from(items[0].as_i64().expect("q")).expect("i32"),
        i32::try_from(items[1].as_i64().expect("r")).expect("i32"),
    )
}

pub fn pairs(value: &Value) -> Vec<Klucz> {
    value
        .as_array()
        .expect("lista par")
        .iter()
        .map(pair)
        .collect()
}

/// Lista punktow `{q, r}` (wyniki `computePath`-podobne zwracane przez planner marszu).
pub fn points(value: &Value) -> Vec<Klucz> {
    value
        .as_array()
        .expect("lista punktow")
        .iter()
        .map(|point| {
            (
                i32::try_from(point["q"].as_i64().expect("q")).expect("i32"),
                i32::try_from(point["r"].as_i64().expect("r")).expect("i32"),
            )
        })
        .collect()
}

pub fn pair_f(value: &Value) -> (f64, f64) {
    let items = value.as_array().expect("para");
    (num(&items[0]), num(&items[1]))
}

pub fn key_set(value: &Value) -> HashSet<Klucz> {
    pairs(value).into_iter().collect()
}

pub fn ordered(value: &Value) -> OrderedHexSet {
    OrderedHexSet::from_keys(pairs(value))
}

/// Mapa z `maps.json` wraz z kolejnoscia heksow (`Object.keys` weba).
pub struct MapData {
    pub list: Vec<(Klucz, RuchHex)>,
    pub map: RuchMapa,
}

fn hex_from(row: &Value) -> (Klucz, RuchHex) {
    let items = row.as_array().expect("heks");
    let key = (
        i32::try_from(items[0].as_i64().expect("q")).expect("i32"),
        i32::try_from(items[1].as_i64().expect("r")).expect("i32"),
    );
    let mut hex = RuchHex::new(
        TerenBazowy::from_web(items[2].as_str().expect("teren")).expect("znany teren"),
    );
    hex.las = items[3].as_bool().expect("las");
    hex.rzeka = items[4].as_bool().expect("rzeka");
    hex.ulepszenie = items[5].as_str().map(str::to_owned);
    hex.ulepszenia = items[6].as_array().map(|layers| {
        layers
            .iter()
            .map(|layer| layer.as_str().expect("warstwa").to_owned())
            .collect()
    });
    hex.wioska = items[7].as_bool().expect("wioska");
    hex.ma_wlasciciela = items[8].as_bool().expect("wlasciciel");
    (key, hex)
}

pub fn load_maps() -> Vec<MapData> {
    let root = load(include_str!("maps.json"));
    root["maps"]
        .as_array()
        .expect("maps")
        .iter()
        .map(|rows| {
            let list: Vec<(Klucz, RuchHex)> = rows
                .as_array()
                .expect("mapa")
                .iter()
                .map(hex_from)
                .collect();
            let mut map = RuchMapa::new();
            for (key, hex) in &list {
                map.insert(*key, hex.clone());
            }
            MapData { list, map }
        })
        .collect()
}

pub fn unit(value: &Value) -> RuchJednostka {
    let mut unit = RuchJednostka::new(
        value["id"].as_str().expect("id"),
        value["ownerId"].as_i64().expect("ownerId"),
        value["category"].as_str().expect("category"),
        i32::try_from(value["q"].as_i64().expect("q")).expect("i32"),
        i32::try_from(value["r"].as_i64().expect("r")).expect("i32"),
    );
    unit.type_id = opt_string(value.get("typeId"));
    unit.ruch = opt_num(value.get("ruch")).unwrap_or(0.0);
    unit.ruch_left = opt_num(value.get("ruchLeft")).unwrap_or(0.0);
    unit.in_garnizon = value.get("inGarnizon").and_then(Value::as_bool) == Some(true);
    unit.embarked = value.get("embarked").and_then(Value::as_bool);
    unit.oblega_city_id = opt_string(value.get("oblegaCityId"));
    unit.auto_explore = value.get("autoExplore").and_then(Value::as_bool);
    unit.sentry = value.get("sentry").and_then(Value::as_bool);
    unit.stack_group_id = opt_string(value.get("stackGroupId"));
    unit
}

pub fn units(value: &Value) -> Vec<RuchJednostka> {
    value
        .as_array()
        .expect("jednostki")
        .iter()
        .map(unit)
        .collect()
}

/// Wpis bonusu cywilizacji (`wartosc`: liczba albo tekst).
pub fn bonus_entry(value: &Value) -> CivBonusEntry {
    let wartosc = match &value["wartosc"] {
        Value::String(text) => BonusValue::Text(text.clone()),
        other => BonusValue::Number(num(other)),
    };
    CivBonusEntry {
        typ: value["typ"].as_str().expect("typ").to_owned(),
        cel: value["cel"].as_str().expect("cel").to_owned(),
        wartosc,
        opis: value["opis"].as_str().map(str::to_owned),
        realizuje: value["realizuje"].as_str().map(str::to_owned),
        matrix_param_id: value["matrixParamId"].as_str().map(str::to_owned),
    }
}

pub fn bonusy(value: &Value) -> Vec<CivBonusEntry> {
    match value.as_array() {
        Some(list) => list.iter().map(bonus_entry).collect(),
        None => Vec::new(),
    }
}

/// Specyfikacja kosztu z wektora: `null` (domyslny `terrainMoveCost`), `"embark"` albo
/// `{kind: "unit", seafaring, bonusy}` (web `moveCostFnFor`).
pub fn cost_bonusy(spec: &Value) -> Vec<CivBonusEntry> {
    bonusy(&spec["bonusy"])
}

pub fn make_cost<'a>(
    spec: &Value,
    unit: &RuchJednostka,
    bonusy: &'a [CivBonusEntry],
) -> Option<BoxedCostFn<'a>> {
    match spec {
        Value::Null => None,
        Value::String(name) if name == "embark" => {
            Some(Box::new(|hex: &RuchHex| embark_move_cost(hex)))
        }
        Value::Object(_) => {
            assert_eq!(spec["kind"], "unit");
            move_cost_fn_for(
                unit,
                spec["seafaring"].as_bool().expect("seafaring"),
                bonusy,
            )
        }
        other => panic!("nieznana specyfikacja kosztu {other}"),
    }
}
