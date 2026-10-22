//! P6.1E - helpery zgodnosci z JS (`Math.round`, `Number#toString`, `Number#toFixed`,
//! `String#trim`, `Number.isInteger`) oraz formatery macierzy z `civ-matrix-semantic.ts`
//! (`civMatrixFormattedValue`, `civMatrixIntensityLabel`, `civMatrixParameterLabelPl`),
//! z wektorami z URUCHOMIONEGO weba (pin edb8fb56). Liczby jako tekst (`String(x)`, "-0").

use std::sync::OnceLock;

use civ_engine::domain::civ_matrix::js_compat::{
    js_clamp, js_is_integer, js_math_round, js_max, js_min, js_number_to_string, js_to_fixed,
    js_trim,
};
use civ_engine::domain::civ_matrix::semantic::{
    civ_matrix_formatted_value, civ_matrix_intensity_label, civ_matrix_parameter_label_pl,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1e_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn st(value: &Value) -> &str {
    value.as_str().unwrap_or_else(|| panic!("tekst: {value}"))
}

fn arr(value: &Value) -> &Vec<Value> {
    value
        .as_array()
        .unwrap_or_else(|| panic!("tablica: {value}"))
}

fn num(value: &Value) -> f64 {
    st(value)
        .parse::<f64>()
        .unwrap_or_else(|e| panic!("liczba {value}: {e}"))
}

fn numbers() -> Vec<f64> {
    arr(&web()["js"]["numbers"]).iter().map(num).collect()
}

#[test]
fn number_to_string_matches_js_for_every_vector() {
    let nums = numbers();
    assert!(nums.len() > 700);
    for (i, x) in nums.iter().enumerate() {
        let want = st(&web()["js"]["toString"][i]);
        assert_eq!(
            js_number_to_string(*x),
            want,
            "x={}",
            st(&web()["js"]["numbers"][i])
        );
    }
}

#[test]
fn math_round_matches_js_bit_for_bit() {
    for (i, x) in numbers().iter().enumerate() {
        let got = js_math_round(*x);
        let want = num(&web()["js"]["mathRound"][i]);
        assert!(
            got.to_bits() == want.to_bits() || (got.is_nan() && want.is_nan()),
            "round({}) = {got}, web {want}",
            st(&web()["js"]["numbers"][i])
        );
    }
}

#[test]
fn to_fixed_matches_js_for_every_digit_count() {
    let digits = &web()["js"]["toFixedDigits"];
    for (di, d) in arr(digits).iter().enumerate() {
        let d = d.as_u64().unwrap() as usize;
        for (i, x) in numbers().iter().enumerate() {
            let want = st(&web()["js"]["toFixed"][di][i]);
            assert_eq!(
                js_to_fixed(*x, d),
                want,
                "({}).toFixed({d})",
                st(&web()["js"]["numbers"][i])
            );
        }
    }
}

#[test]
fn is_integer_and_min_max_clamp_follow_js() {
    for (i, x) in numbers().iter().enumerate() {
        assert_eq!(
            js_is_integer(*x),
            web()["js"]["isInteger"][i].as_bool().unwrap(),
            "{x}"
        );
    }
    assert!(js_min(1.0, f64::NAN).is_nan());
    assert!(js_max(f64::NAN, 1.0).is_nan());
    assert!(js_clamp(0.0, 1.0, f64::NAN).is_nan());
    assert_eq!(js_clamp(0.0, 1.0, 5.0), 1.0);
    assert_eq!(js_clamp(0.0, 1.0, -5.0), 0.0);
    assert_eq!(js_clamp(0.0, 1.0, 0.25), 0.25);
}

#[test]
fn trim_matches_js_string_trim() {
    for case in arr(&web()["js"]["trim"]) {
        assert_eq!(
            js_trim(st(&case["in"])),
            st(&case["out"]),
            "{:?}",
            case["in"]
        );
    }
}

#[test]
fn formatted_value_matches_web() {
    let f = &web()["js"]["formatted"];
    let units: Vec<&str> = arr(&f["units"]).iter().map(st).collect();
    let values: Vec<Option<f64>> = arr(&f["values"])
        .iter()
        .map(|v| if v.is_null() { None } else { Some(num(v)) })
        .collect();
    for (ui, unit) in units.iter().enumerate() {
        for (vi, value) in values.iter().enumerate() {
            let got = civ_matrix_formatted_value(*value, unit);
            assert_eq!(
                got,
                st(&f["out"][ui][vi]),
                "unit={unit} value={:?}",
                f["values"][vi]
            );
        }
    }
}

#[test]
fn intensity_label_matches_web() {
    let f = &web()["js"]["intensity"];
    for (i, v) in arr(&f["values"]).iter().enumerate() {
        assert_eq!(civ_matrix_intensity_label(num(v)), st(&f["out"][i]), "{v}");
    }
}

#[test]
fn parameter_label_matches_web() {
    let f = &web()["js"]["paramLabel"];
    assert!(arr(&f["ids"]).len() > 100);
    for (i, id) in arr(&f["ids"]).iter().enumerate() {
        assert_eq!(
            civ_matrix_parameter_label_pl(st(id)),
            st(&f["out"][i]),
            "{id}"
        );
    }
}
