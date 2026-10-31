//! Zgodnosc `v8_sort_by` z prawdziwym V8: wektor `tests/p6_8g_vectors/v8sort.json` wygenerowany w node
//! (`Array.prototype.sort` z komparatorem `(a, b) => a.k - b.k`, NaN -> 0 po stronie V8), n od 0 do 1000,
//! z remisami, NaN i wzorcami runow (galop). Generator: `gen-p6-8g-okolica-vectors.mjs`, sekcja 12.

use super::v8_sort_by;
use crate::domain::okolica::js_cmp_diff;
use serde_json::Value;
use std::cmp::Ordering;

const V8_SORT: &str = include_str!("../../../../tests/p6_8g_vectors/v8sort.json");

#[test]
fn v8_sort_matches_node_v8_on_nan_ties_and_runs() {
    let root: Value = serde_json::from_str(V8_SORT).expect("v8sort.json parsuje sie jako JSON");
    let cases = root["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 138);
    for case in cases {
        let keys: Vec<f64> = case["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|v| match v {
                Value::Number(n) => n.as_f64().expect("f64"),
                Value::String(s) if s == "NaN" => f64::NAN,
                other => panic!("nieoczekiwany klucz {other}"),
            })
            .collect();
        let want: Vec<usize> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|v| v.as_u64().expect("indeks") as usize)
            .collect();
        let items: Vec<(usize, f64)> = keys.iter().copied().enumerate().collect();
        let got: Vec<usize> = v8_sort_by(items, &|a, b| js_cmp_diff(a.1 - b.1))
            .into_iter()
            .map(|x| x.0)
            .collect();
        assert_eq!(got, want, "n={}", keys.len());
    }
}

/// P6.8G r5 (zarzut Evaluatora 1): mutant `NaN -> Greater` w `js_cmp_diff` musi byc zabity.
/// V8 `Compare`: wynik komparatora NaN -> `ToNumber` + `NumberIsNaN` -> 0 (remis), wiec `NaN -> Equal`.
#[test]
fn js_cmp_diff_nan_is_equal_like_v8_compare() {
    assert_eq!(js_cmp_diff(f64::NAN), Ordering::Equal);
    assert_eq!(js_cmp_diff(f64::INFINITY - f64::INFINITY), Ordering::Equal);
    assert_eq!(js_cmp_diff(-0.0), Ordering::Equal);
    assert_eq!(js_cmp_diff(-1.0), Ordering::Less);
    assert_eq!(js_cmp_diff(1.0), Ordering::Greater);
}

/// P6.8G r5: `compareScoredOkolicaTiles` z NaN w `s` - `b.s !== a.s` jest prawdziwe, wynik NaN -> remis
/// BEZ przejscia do zywnosci/potential/dist (to odroznia `NaN -> Equal` od innych wariantow).
#[test]
fn compare_scored_nan_score_is_tie_without_further_criteria() {
    use crate::domain::okolica::{compare_scored, OkolicaFocus, OkolicaTile, ScoredTile};
    let ta = OkolicaTile {
        q: 0,
        r: 0,
        key: "0,0".into(),
        dist: 1.0,
    };
    let tb = OkolicaTile {
        q: 1,
        r: 0,
        key: "1,0".into(),
        dist: 2.0,
    };
    let a = ScoredTile {
        t: &ta,
        s: f64::NAN,
        zywnosc: 1.0,
        potential: 1.0,
    };
    let b = ScoredTile {
        t: &tb,
        s: f64::NAN,
        zywnosc: 5.0,
        potential: 5.0,
    };
    assert_eq!(compare_scored(&a, &b, None), Ordering::Equal);
    assert_eq!(
        compare_scored(&a, &b, Some(OkolicaFocus::Zywnosc)),
        Ordering::Equal
    );
    // Kontrola: przy rownym `s` rozstrzyga dist (a.dist 1 < b.dist 2 -> Less).
    let c = ScoredTile {
        t: &ta,
        s: 3.0,
        zywnosc: 1.0,
        potential: 1.0,
    };
    let d = ScoredTile {
        t: &tb,
        s: 3.0,
        zywnosc: 1.0,
        potential: 1.0,
    };
    assert_eq!(compare_scored(&c, &d, None), Ordering::Less);
}
