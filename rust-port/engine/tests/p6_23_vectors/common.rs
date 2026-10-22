//! Wspolne pomocniki testow P6.23 (wektory z URUCHOMIONEGO weba, pin edb8fb56).
//!
//! Kodowanie wektorow (generator `gen-p623-vectors.mjs`): liczby specjalne jako
//! `{"$n": "NaN" | "Infinity" | "-Infinity" | "-0"}`; `undefined` = brak klucza; zbiory jako tablice.
#![allow(dead_code)]

use serde_json::Value;

/// Dekoduje liczbe wektora (zwykla albo specjalna).
pub fn num(value: &Value) -> f64 {
    match value {
        Value::Number(number) => number.as_f64().expect("liczba f64"),
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

/// Liczba opcjonalna: brak klucza, `null` i znacznik `"$omit"` to `None`.
pub fn opt_num(value: Option<&Value>) -> Option<f64> {
    match value {
        None | Some(Value::Null) => None,
        Some(Value::String(marker)) if marker == "$omit" => None,
        Some(other) => Some(num(other)),
    }
}

/// Napis opcjonalny: brak klucza i `null` to `None`.
pub fn opt_str(value: Option<&Value>) -> Option<&str> {
    match value {
        None | Some(Value::Null) => None,
        Some(other) => Some(other.as_str().expect("napis")),
    }
}

/// Rowne liczbowo: `NaN == NaN`, `-0 == 0`.
pub fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

pub fn assert_same(label: &str, got: f64, want: f64) {
    assert!(same(got, want), "{label}: got {got:?}, web {want:?}");
}

pub fn string_list(value: &Value) -> Vec<String> {
    value
        .as_array()
        .expect("tablica")
        .iter()
        .map(|item| item.as_str().expect("napis").to_owned())
        .collect()
}

pub fn cases<'a>(root: &'a Value, name: &str) -> &'a Vec<Value> {
    root["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}
