//! Wspolne pomocniki testow P6.7B (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gen-p67b-vectors.mjs`, pin edb8fb56).
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use civ_engine::domain::building_costs::p6_7b::{
    BuildingRuntimeGateOptions, EpochInput, GateBuilding, PrereqBuilding, StockCity, StockRecord,
};
use civ_engine::domain::recruitment::manpower::js_number_to_string;
use serde_json::{json, Map, Value};

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_7b_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

pub fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

/// Liczba JS z wektora: liczba JSON albo string "NaN" / "Infinity" / "-Infinity" / "-0" / "~ulamek".
/// `None` dla wszystkiego innego (null, inny napis, obiekt...) - odpowiednik `typeof x !== 'number'`.
pub fn js_num(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => match s.as_str() {
            "NaN" => Some(f64::NAN),
            "Infinity" => Some(f64::INFINITY),
            "-Infinity" => Some(f64::NEG_INFINITY),
            "-0" => Some(-0.0),
            other => other.strip_prefix('~').map(|repr| {
                repr.parse::<f64>()
                    .unwrap_or_else(|e| panic!("ulamek {other}: {e}"))
            }),
        },
        _ => None,
    }
}

pub fn num(v: &Value) -> f64 {
    js_num(v).unwrap_or_else(|| panic!("to nie liczba: {v}"))
}

/// Kodowanie liczby jak w generatorze (replacer): specjalne i niecalkowite jako napisy.
pub fn enc(x: f64) -> Value {
    if x.is_nan() {
        return json!("NaN");
    }
    if x == f64::INFINITY {
        return json!("Infinity");
    }
    if x == f64::NEG_INFINITY {
        return json!("-Infinity");
    }
    if x == 0.0 && x.is_sign_negative() {
        return json!("-0");
    }
    // bezpieczne calkowite (|x| <= 2^53 - 1) jako liczby JSON, reszta jako "~<zapis JS>" (jak w generatorze)
    if x.fract() != 0.0 || x.abs() > 9_007_199_254_740_991.0 {
        return Value::String(format!("~{}", js_number_to_string(x)));
    }
    Value::Number(serde_json::Number::from_f64(x).expect("finite"))
}

/// Rownosc BITOWA f64 (NaN == NaN niezaleznie od ladunku).
pub fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

/// Rownosc wartosci JSON z liczbami porownywanymi bitowo (PosInt == Float o tej samej wartosci).
pub fn values_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => {
            let (x, y) = (x.as_f64().expect("f64"), y.as_f64().expect("f64"));
            x.to_bits() == y.to_bits()
        }
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| values_eq(p, q))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).is_some_and(|w| values_eq(v, w)))
        }
        _ => a == b,
    }
}

pub fn assert_values(label: &str, got: &Value, want: &Value) {
    assert!(
        values_eq(got, want),
        "{label}:\n  rust={got}\n  web ={want}"
    );
}

pub fn text(v: &Value) -> String {
    v.as_str().expect("str").to_string()
}

pub fn opt_text(v: &Value) -> Option<String> {
    v.as_str().map(str::to_string)
}

pub fn strings(v: &Value) -> Vec<String> {
    v.as_array().expect("strings").iter().map(text).collect()
}

pub fn opt_strings(v: &Value) -> Option<Vec<String>> {
    v.as_array().map(|a| a.iter().map(text).collect::<Vec<_>>())
}

/// Rekord `Record<string, number>`; wartosci spoza liczby (np. napis) znaczą to samo co brak klucza.
pub fn stock_rec(v: &Value) -> StockRecord {
    v.as_object()
        .expect("rekord")
        .iter()
        .filter_map(|(k, x)| js_num(x).map(|n| (k.clone(), n)))
        .collect()
}

/// Opcjonalny rekord: brak pola albo `null` => `None`.
pub fn opt_stock_rec(v: &Value) -> Option<StockRecord> {
    if v.is_object() {
        Some(stock_rec(v))
    } else {
        None
    }
}

pub fn rec_value(m: &StockRecord) -> Value {
    let mut o = Map::new();
    for (k, x) in m {
        o.insert(k.clone(), enc(*x));
    }
    Value::Object(o)
}

/// Wejscie "epoka": `{t:'n',v}` / `{t:'s',v}` / `{t:'o',d}`.
pub fn epoch_from(v: &Value) -> EpochInput {
    match v["t"].as_str().expect("t") {
        "n" => EpochInput::Number(num(&v["v"])),
        "s" => EpochInput::Text(text(&v["v"])),
        "o" => EpochInput::Other,
        other => panic!("nieznany typ epoki {other}"),
    }
}

/// Wejscie "liczba albo nie": `{t:'n',v}` => `Some`, reszta => `None`.
pub fn opt_number_from(v: &Value) -> Option<f64> {
    match v["t"].as_str() {
        Some("n") => Some(num(&v["v"])),
        _ => None,
    }
}

pub fn cities_from(v: &Value) -> Vec<StockCity> {
    v.as_array()
        .expect("miasta")
        .iter()
        .map(|c| StockCity {
            id: text(&c["id"]),
            owner_id: c["ownerId"].as_i64().expect("ownerId"),
            surowce: opt_stock_rec(&c["surowce"]),
        })
        .collect()
}

/// Postac z generatora (`view`): tylko `id`, `ownerId` i `surowce` gdy obecne.
pub fn cities_value(cities: &[StockCity]) -> Value {
    Value::Array(
        cities
            .iter()
            .map(|c| {
                let mut o = Map::new();
                o.insert("id".into(), json!(c.id));
                o.insert("ownerId".into(), json!(c.owner_id));
                if let Some(s) = &c.surowce {
                    o.insert("surowce".into(), rec_value(s));
                }
                Value::Object(o)
            })
            .collect(),
    )
}

pub fn gate_building(v: &Value) -> GateBuilding {
    GateBuilding {
        id: text(&v["id"]),
        epoka_wejscia: js_num(&v["epoka"]),
        wymagany_surowiec: opt_text(&v["wym"]),
    }
}

pub fn prereq_buildings(v: &Value) -> Vec<PrereqBuilding> {
    v.as_array()
        .expect("budynki")
        .iter()
        .map(|b| PrereqBuilding {
            id: text(&b["id"]),
            upgrade_from: opt_text(&b["upgradeFrom"]),
        })
        .collect()
}

/// Rodzaje opcji bramki runtime z generatora (`makeOptions`): (ownerId, czy jest resolver).
pub fn option_kind(kind: &str) -> (Option<i64>, bool) {
    match kind {
        "none" => panic!("brak opcji obslugiwany osobno"),
        "empty" => (None, false),
        "owner" => (Some(1), false),
        "resolver-only" => (None, true),
        "resolver-owner0" => (Some(0), true),
        "resolver-owner1" => (Some(1), true),
        "resolver-owner2" => (Some(2), true),
        "resolver-owner4" => (Some(4), true),
        other => panic!("nieznany rodzaj opcji {other}"),
    }
}

/// Uruchamia `body` z opcjami bramki zgodnymi z `kind`; domkniecie resolvera czyta wynik z tabeli
/// wektora (nieznany argument = panika) i zapisuje wywolania; po wyjsciu porownuje je z `calls`.
pub fn with_options<R>(
    vector: &Value,
    table: &Value,
    body: impl FnOnce(Option<&BuildingRuntimeGateOptions<'_>>) -> R,
) -> R {
    use std::cell::RefCell;
    let kind = vector["kind"].as_str().expect("kind");
    let expected: Vec<i64> = vector["calls"]
        .as_array()
        .expect("calls")
        .iter()
        .map(|x| x.as_i64().expect("owner"))
        .collect();
    let log = RefCell::new(Vec::<i64>::new());
    let resolver = |owner: i64| -> bool {
        log.borrow_mut().push(owner);
        table[owner.to_string()]
            .as_bool()
            .unwrap_or_else(|| panic!("resolver: brak wyniku dla ownerId={owner}"))
    };
    let result = if kind == "none" {
        body(None)
    } else {
        let (owner_id, has_resolver) = option_kind(kind);
        let options = BuildingRuntimeGateOptions {
            owner_id,
            resolve_owner_zloto_access: if has_resolver { Some(&resolver) } else { None },
        };
        body(Some(&options))
    };
    assert_eq!(*log.borrow(), expected, "wywolania resolvera ({kind})");
    result
}

pub fn map_of_f64(v: &Value) -> BTreeMap<String, f64> {
    stock_rec(v)
}
