//! Zgodnosc `v8_sort_by` z prawdziwym V8: wektor `tests/p6_8g_vectors/v8sort.json` wygenerowany w node
//! (`Array.prototype.sort` z komparatorem `(a, b) => a.k - b.k`, NaN -> 0 po stronie V8), n od 0 do 1000,
//! z remisami, NaN i wzorcami runow (galop). Generator: `gen-p6-8g-okolica-vectors.mjs`, sekcja 12.

use super::v8_sort_by;
use crate::domain::okolica::js_cmp_diff;
use serde_json::Value;

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
