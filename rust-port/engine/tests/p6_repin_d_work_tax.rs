//! REPIN-EKONOMIA-D1 — testy portu `gra/src/game/work-tax.ts` (pin `91dc998a`).
//!
//! Wektory: `tests/p6_repin_d_work_tax_vectors/web-vectors.json`, generowane z URUCHOMIONEGO kodu
//! weba (`gra/src/game/work-tax.ts` z pinu `91dc998a`, node 22 `--experimental-strip-types`;
//! generator poza repo). NaN / Infinity / undefined zapisane jako tekst lub `null` (JSON).
//!
//! - `parity_*`: porownanie z wektorami weba (dryf pinu zaczerwieni test, celowo).
//! - `boundary_*` / `structural_*`: brzegi N-1 / N / N+1 i gałęzie logiki, wartosci wyprowadzone
//!   z kodu weba (bez wartosci z wektorow).

use std::collections::HashMap;

use civ_engine::domain::work_tax::{
    convert_work_pool_to_tax, execute_manual_work_tax_conversion, owner_can_convert_work_to_tax,
    restore_pending_work_tax, serialize_pending_work_tax, tax_for_work_amount, CityOwner,
    WorkTaxConversion, WorkTaxDeps,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_repin_d_work_tax_vectors/web-vectors.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("web vectors parse")
}

/// Dekodowanie wejscia z wektora: liczba JSON, albo tekst NaN/Infinity/-Infinity; reszta
/// (null, undefined, string "5") to nie-liczba, czyli NaN (JS `Number.isFinite` = false).
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("number"),
        Value::String(s) => match s.as_str() {
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "NaN" => f64::NAN,
            _ => f64::NAN,
        },
        _ => f64::NAN,
    }
}

fn out_num(v: &Value) -> f64 {
    v.as_f64().expect("expected finite output number")
}

fn rows(v: &Value) -> Vec<(f64, f64)> {
    v.as_array()
        .expect("array")
        .iter()
        .map(|r| {
            let p = r.as_array().expect("pair");
            (num(&p[0]), num(&p[1]))
        })
        .collect()
}

#[test]
fn parity_tax_for_work_amount() {
    let w = web();
    let cases = w["tax"].as_array().unwrap();
    assert_eq!(cases.len(), 529);
    for c in cases {
        let got = tax_for_work_amount(num(&c["w"]), num(&c["r"]));
        assert_eq!(got, out_num(&c["out"]), "w={} r={}", c["w"], c["r"]);
    }
}

#[test]
fn parity_convert_work_pool_to_tax() {
    let w = web();
    let cases = w["convert"].as_array().unwrap();
    assert_eq!(cases.len(), 1600);
    for c in cases {
        let got = convert_work_pool_to_tax(
            num(&c["pool"]),
            num(&c["req"]),
            num(&c["rate"]),
            c["enabled"].as_bool().unwrap(),
        );
        let exp = &c["out"];
        assert_eq!(got.work_remaining, out_num(&exp["workRemaining"]), "{c}");
        assert_eq!(got.work_spent, out_num(&exp["workSpent"]), "{c}");
        assert_eq!(got.tax_gained, out_num(&exp["taxGained"]), "{c}");
    }
}

#[test]
fn parity_owner_can_convert_work_to_tax() {
    let w = web();
    let cases = w["canConvert"].as_array().unwrap();
    assert_eq!(cases.len(), 90);
    for c in cases {
        let cities: Vec<CityOwner> = c["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(|city| CityOwner {
                id: city["id"].as_str().unwrap().to_string(),
                owner_id: city["ownerId"].as_f64().unwrap(),
            })
            .collect();
        let mut built: HashMap<String, Vec<String>> = HashMap::new();
        for entry in c["built"].as_array().unwrap() {
            let k = entry[0].as_str().unwrap().to_string();
            let v: Vec<String> = entry[1]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_string())
                .collect();
            built.insert(k, v);
        }
        let got = owner_can_convert_work_to_tax(
            c["owner"].as_f64().unwrap(),
            c["human"].as_bool().unwrap(),
            &cities,
            &built,
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
    }
}

#[test]
fn parity_serialize_pending_work_tax() {
    let w = web();
    let cases = w["serialize"].as_array().unwrap();
    assert_eq!(cases.len(), 9);
    for c in cases {
        let got = serialize_pending_work_tax(&rows(&c["input"]));
        assert_eq!(got, rows(&c["out"]), "{c}");
    }
}

#[test]
fn parity_restore_pending_work_tax() {
    let w = web();
    let cases = w["restore"].as_array().unwrap();
    assert_eq!(cases.len(), 20);
    for c in cases {
        let got = restore_pending_work_tax(&c["input"]);
        assert_eq!(got, rows(&c["out"]), "{c}");
    }
}

#[derive(Default)]
struct Store {
    pool: HashMap<i64, f64>,
    calls: Vec<(String, f64, f64)>,
}

impl WorkTaxDeps for Store {
    fn get_work_pool(&self, owner_id: f64) -> f64 {
        *self.pool.get(&(owner_id as i64)).expect("pool")
    }
    fn set_work_pool(&mut self, owner_id: f64, value: f64) {
        self.pool.insert(owner_id as i64, value);
        self.calls.push(("set".to_string(), owner_id, value));
    }
    fn queue_tax(&mut self, owner_id: f64, tax: f64) {
        self.calls.push(("tax".to_string(), owner_id, tax));
    }
}

#[test]
fn parity_execute_manual_work_tax_conversion() {
    let w = web();
    let cases = w["exec"].as_array().unwrap();
    assert_eq!(cases.len(), 96);
    for c in cases {
        let mut store = Store::default();
        store.pool.insert(7, c["pool"].as_f64().unwrap());
        let got: WorkTaxConversion = execute_manual_work_tax_conversion(
            7.0,
            c["req"].as_f64().unwrap(),
            c["rate"].as_f64().unwrap(),
            c["en"].as_bool().unwrap(),
            &mut store,
        );
        let exp = &c["out"];
        assert_eq!(got.work_remaining, out_num(&exp["workRemaining"]), "{c}");
        assert_eq!(got.work_spent, out_num(&exp["workSpent"]), "{c}");
        assert_eq!(got.tax_gained, out_num(&exp["taxGained"]), "{c}");
        assert_eq!(store.pool[&7], out_num(&c["finalPool"]), "{c}");
        let exp_calls: Vec<(String, f64, f64)> = c["calls"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| {
                (
                    t[0].as_str().unwrap().to_string(),
                    t[1].as_f64().unwrap(),
                    t[2].as_f64().unwrap(),
                )
            })
            .collect();
        assert_eq!(store.calls, exp_calls, "{c}");
    }
}

// --- brzegi i galezie (wyprowadzone z kodu weba, nie z wektorow) ---

#[test]
fn boundary_tax_floor_and_rate_defaults() {
    // floor: N-1 / N / N+1 wokol calkowitego progu podatku
    assert_eq!(tax_for_work_amount(1.0, 0.99), 0.0);
    assert_eq!(tax_for_work_amount(1.0, 1.0), 1.0);
    assert_eq!(tax_for_work_amount(2.9999, 1.0), 2.0);
    assert_eq!(tax_for_work_amount(3.0, 1.0), 3.0);
    // niefinitne ilosc -> 0, ujemna -> 0
    assert_eq!(tax_for_work_amount(f64::NAN, 2.0), 0.0);
    assert_eq!(tax_for_work_amount(f64::INFINITY, 2.0), 0.0);
    assert_eq!(tax_for_work_amount(-5.0, 2.0), 0.0);
    // niefinitny kurs -> 1 (domyslny), ujemny kurs -> 0
    assert_eq!(tax_for_work_amount(5.0, f64::NAN), 5.0);
    assert_eq!(tax_for_work_amount(5.0, f64::INFINITY), 5.0);
    assert_eq!(tax_for_work_amount(5.0, -2.0), 0.0);
}

#[test]
fn structural_work_not_spent_when_tax_rounds_to_zero() {
    // podatek 0 -> praca nietknieta, brak podatku (gałąź `candidateTax > 0`)
    let r = convert_work_pool_to_tax(10.0, 1.0, 0.5, true);
    assert_eq!(
        r,
        WorkTaxConversion {
            work_remaining: 10.0,
            work_spent: 0.0,
            tax_gained: 0.0
        }
    );
    // dokladnie prog: 2 pracy * 0.5 = 1 podatku -> praca zuzyta
    let r = convert_work_pool_to_tax(10.0, 2.0, 0.5, true);
    assert_eq!(
        r,
        WorkTaxConversion {
            work_remaining: 8.0,
            work_spent: 2.0,
            tax_gained: 1.0
        }
    );
}

#[test]
fn structural_disabled_or_empty_request_spends_nothing() {
    let r = convert_work_pool_to_tax(10.0, 5.0, 1.0, false);
    assert_eq!(
        r,
        WorkTaxConversion {
            work_remaining: 10.0,
            work_spent: 0.0,
            tax_gained: 0.0
        }
    );
    let r = convert_work_pool_to_tax(10.0, 0.0, 1.0, true);
    assert_eq!(r.work_spent, 0.0);
    assert_eq!(r.work_remaining, 10.0);
}

#[test]
fn boundary_pool_and_request_are_sanitized() {
    // pula ujemna / NaN -> 0; zadanie wieksze niz pula -> zuzyta cala pula
    let r = convert_work_pool_to_tax(-3.0, 5.0, 1.0, true);
    assert_eq!(
        r,
        WorkTaxConversion {
            work_remaining: 0.0,
            work_spent: 0.0,
            tax_gained: 0.0
        }
    );
    let r = convert_work_pool_to_tax(f64::NAN, 5.0, 1.0, true);
    assert_eq!(r.work_remaining, 0.0);
    let r = convert_work_pool_to_tax(4.9, 100.0, 1.0, true);
    assert_eq!(
        r,
        WorkTaxConversion {
            work_remaining: 0.0,
            work_spent: 4.0,
            tax_gained: 4.0
        }
    );
}

#[test]
fn structural_restore_rejects_bad_rows_and_overwrites_in_place() {
    let saved = serde_json::json!([
        [1, 5],
        [1, 9],
        [2, 0],
        [3, "7"],
        [4],
        [5, 1, 2],
        "x",
        [6, -1]
    ]);
    assert_eq!(restore_pending_work_tax(&saved), vec![(1.0, 9.0)]);
    assert!(restore_pending_work_tax(&Value::Null).is_empty());
    let saved = serde_json::json!([[2, 4], [1, 3], [2, 9]]);
    assert_eq!(
        restore_pending_work_tax(&saved),
        vec![(2.0, 9.0), (1.0, 3.0)]
    );
}

#[test]
fn structural_serialize_then_restore_roundtrip() {
    let pending = vec![(1.0, 2.5), (2.0, 0.0), (3.0, 7.0), (f64::NAN, 4.0)];
    let ser = serialize_pending_work_tax(&pending);
    assert_eq!(ser, vec![(1.0, 2.5), (3.0, 7.0)]);
    let json = serde_json::to_value(&ser).unwrap();
    assert_eq!(restore_pending_work_tax(&json), ser);
}

#[test]
fn structural_can_convert_requires_human_and_targowisko() {
    let cities = vec![CityOwner {
        id: "a".into(),
        owner_id: 1.0,
    }];
    let mut built = HashMap::new();
    built.insert("a".to_string(), vec!["kuznia".to_string()]);
    assert!(!owner_can_convert_work_to_tax(1.0, true, &cities, &built));
    built.insert("a".to_string(), vec!["targowisko".to_string()]);
    assert!(owner_can_convert_work_to_tax(1.0, true, &cities, &built));
    assert!(!owner_can_convert_work_to_tax(1.0, false, &cities, &built));
    assert!(!owner_can_convert_work_to_tax(2.0, true, &cities, &built));
}
