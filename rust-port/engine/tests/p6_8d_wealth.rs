//! P6.8D-P2 - `wealth.ts` (web pin 91dc998a) bez `wealthParamsWith*` (te pokrywa B3 w
//! `city_growth`, testy `p6_repin_b3_wealth`). Wektory z URUCHOMIONEGO weba
//! (`tests/p6_8d_vectors/wealth.json`, generator `gen-p6-8d-wealth-vectors.mjs`).
//! Kodowanie: liczba = JSON number; niecalkowita = `{"$f": String(x)}`;
//! NaN/Infinity/-Infinity/-0 = `{"$n": "..."}`; undefined = `{"$undef": true}`; null = null.

use std::collections::BTreeMap;

use civ_engine::domain::turn_economy::gold_deficit::Difficulty;
use civ_engine::domain::turn_economy::wealth::{
    advance_wealth, fresh_wealth_state, load_wealth_params, wealth_cap, wealth_mnoznik,
    wealth_prog, wealth_rownowaga, wealth_zadowolenie, RawWealthParamsJson, RawWealthRow,
    WealthParams, WealthState, FALLBACK_WEALTH_PARAMS,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8d_vectors/wealth.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("wektory parse")
}

fn arr<'a>(v: &'a Value, what: &str) -> &'a Vec<Value> {
    v.as_array()
        .unwrap_or_else(|| panic!("oczekiwano tablicy: {what}"))
}

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                return s.as_str().expect("$f").parse::<f64>().expect("$f parse");
            }
            match o.get("$n").and_then(Value::as_str).expect("$n") {
                "NaN" => f64::NAN,
                "Infinity" => f64::INFINITY,
                "-Infinity" => f64::NEG_INFINITY,
                "-0" => -0.0,
                other => panic!("nieznane $n: {other}"),
            }
        }
        other => panic!("nie liczba: {other}"),
    }
}

/// `null` / `{"$undef": true}` => None; inaczej Some(liczba).
fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        return None;
    }
    if let Some(o) = v.as_object() {
        if o.get("$undef").is_some() {
            return None;
        }
    }
    Some(num(v))
}

/// Porownanie bit-w-bit (NaN == NaN, -0 != 0), zgodne z `Object.is`.
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn check(actual: f64, expected: f64, ctx: &str) {
    assert!(
        same(actual, expected),
        "{ctx}: rust={actual:?} web={expected:?}"
    );
}

fn params_from(v: &Value) -> WealthParams {
    WealthParams {
        cap_na_epoke: num(&v["capNaEpoke"]),
        prog_na_poziom: num(&v["progNaPoziom"]),
        mnoznik_na_poziom: num(&v["mnoznikNaPoziom"]),
        utrzymanie_baza: num(&v["utrzymanieBaza"]),
        utrzymanie_przy_cap: num(&v["utrzymaniePrzyCap"]),
        zachowanie_po_awansie: num(&v["zachowaniePoAwansie"]),
        zadowolenie_max: num(&v["zadowolenieMax"]),
        kara_zero: num(&v["karaZero"]),
        immunitet_tur: num(&v["immunitetTur"]),
    }
}

fn param_sets(r: &Value) -> BTreeMap<String, WealthParams> {
    r["paramSets"]
        .as_object()
        .expect("paramSets")
        .iter()
        .map(|(k, v)| (k.clone(), params_from(v)))
        .collect()
}

fn parse_difficulty(v: &Value) -> Difficulty {
    match v.as_str() {
        Some("easy") => Difficulty::Easy,
        Some("hard") => Difficulty::Hard,
        Some("normal") | None => Difficulty::Normal,
        Some(other) => panic!("trudnosc: {other}"),
    }
}

fn raw_row(v: &Value) -> RawWealthRow {
    let f = |k: &str| v.get(k).and_then(Value::as_f64);
    RawWealthRow {
        easy: f("easy"),
        normal: f("normal"),
        hard: f("hard"),
    }
}

fn raw_json(v: &Value) -> RawWealthParamsJson {
    let wealth = v
        .get("wealth")
        .and_then(Value::as_object)
        .map(|m| m.iter().map(|(k, row)| (k.clone(), raw_row(row))).collect())
        .unwrap_or_default();
    RawWealthParamsJson { wealth }
}

#[test]
fn fallback_and_fresh_match_web() {
    let r = root();
    let f = params_from(&r["fallback"]);
    assert_eq!(f, FALLBACK_WEALTH_PARAMS);
    let fresh = fresh_wealth_state();
    check(fresh.poziom, num(&r["fresh"]["poziom"]), "fresh poziom");
    check(fresh.pula, num(&r["fresh"]["pula"]), "fresh pula");
}

#[test]
fn load_wealth_params_matches_web() {
    let r = root();
    let cases = arr(&r["load"], "load");
    assert_eq!(cases.len(), 16);
    for (i, c) in cases.iter().enumerate() {
        let ctx = format!("load[{i}] {} {}", c["name"], c["difficulty"]);
        let got = load_wealth_params(&raw_json(&c["raw"]), parse_difficulty(&c["difficulty"]));
        let exp = params_from(&c["expected"]);
        check(got.cap_na_epoke, exp.cap_na_epoke, &format!("{ctx} cap"));
        check(
            got.prog_na_poziom,
            exp.prog_na_poziom,
            &format!("{ctx} prog"),
        );
        check(
            got.mnoznik_na_poziom,
            exp.mnoznik_na_poziom,
            &format!("{ctx} mnoznik"),
        );
        check(
            got.utrzymanie_baza,
            exp.utrzymanie_baza,
            &format!("{ctx} baza"),
        );
        check(
            got.utrzymanie_przy_cap,
            exp.utrzymanie_przy_cap,
            &format!("{ctx} przyCap"),
        );
        check(
            got.zachowanie_po_awansie,
            exp.zachowanie_po_awansie,
            &format!("{ctx} zachowanie"),
        );
        check(
            got.zadowolenie_max,
            exp.zadowolenie_max,
            &format!("{ctx} zadowolenieMax"),
        );
        check(got.kara_zero, exp.kara_zero, &format!("{ctx} kara"));
        check(
            got.immunitet_tur,
            exp.immunitet_tur,
            &format!("{ctx} immunitet"),
        );
    }
}

#[test]
fn pure_functions_match_web_vectors() {
    let r = root();
    let sets = param_sets(&r);
    let cases = arr(&r["fn"], "fn");
    assert_eq!(cases.len(), 1344);
    let mut full = 0;
    for (i, c) in cases.iter().enumerate() {
        let p = sets[c["params"].as_str().unwrap()];
        let epoka = num(&c["epoka"]);
        let ctx = format!("fn[{i}] {} epoka={}", c["params"], c["epoka"]);
        if c.get("cap").is_some() {
            check(wealth_cap(epoka, p), num(&c["cap"]), &format!("{ctx} cap"));
            continue;
        }
        full += 1;
        let poz = num(&c["poziom"]);
        check(
            wealth_mnoznik(poz, p),
            num(&c["mnoznik"]),
            &format!("{ctx} mnoznik"),
        );
        check(
            wealth_zadowolenie(poz, p, epoka),
            num(&c["zadowolenie"]),
            &format!("{ctx} zadowolenie"),
        );
        check(
            wealth_rownowaga(poz, epoka, p),
            num(&c["rownowaga"]),
            &format!("{ctx} rownowaga"),
        );
        check(
            wealth_prog(poz, epoka, p),
            num(&c["prog"]),
            &format!("{ctx} prog"),
        );
    }
    assert_eq!(
        full,
        15 * 14 * 6,
        "liczba pelnych przypadkow poziom x epoka x params"
    );
}

#[test]
fn advance_sequences_match_web_vectors() {
    let r = root();
    let sets = param_sets(&r);
    let cases = arr(&r["advance"], "advance");
    assert_eq!(cases.len(), 6 * 7 + 1);
    let mut steps_total = 0;
    for (ci, case) in cases.iter().enumerate() {
        let p = sets[case["params"].as_str().unwrap()];
        for (si, step) in arr(&case["steps"], "steps").iter().enumerate() {
            steps_total += 1;
            let ctx = format!(
                "advance[{ci}] {} start{} krok{si}",
                case["params"], case["startIndex"]
            );
            let state = WealthState {
                poziom: num(&step["inState"]["poziom"]),
                pula: num(&step["inState"]["pula"]),
            };
            let opts = opt_num(&step["minPoziom"]);
            let res = advance_wealth(
                state,
                num(&step["spol"]),
                num(&step["miasto"]),
                num(&step["epoka"]),
                p,
                opts,
            );
            let out = &step["out"];
            check(res.poziom, num(&out["poziom"]), &format!("{ctx} poziom"));
            check(res.pula, num(&out["pula"]), &format!("{ctx} pula"));
            check(res.mnoznik, num(&out["mnoznik"]), &format!("{ctx} mnoznik"));
            check(
                res.zadowolenie,
                num(&out["zadowolenie"]),
                &format!("{ctx} zadowolenie"),
            );
            check(
                res.awans as f64,
                num(&out["awans"]),
                &format!("{ctx} awans"),
            );
            check(
                res.spadek as f64,
                num(&out["spadek"]),
                &format!("{ctx} spadek"),
            );
        }
    }
    assert_eq!(steps_total, 6 * 7 * 14 + 4, "liczba krokow");
}

#[test]
fn advance_drops_and_grows_as_expected() {
    // Wzrost: duza pula ponad prog => awans; brak puli => spadek przy minPoziom 0.
    let p = FALLBACK_WEALTH_PARAMS;
    let grow = advance_wealth(
        WealthState {
            poziom: 1.0,
            pula: 100.0,
        },
        0.0,
        0.0,
        1.0,
        p,
        None,
    );
    assert!(
        grow.awans >= 1 && grow.poziom > 1.0,
        "awans przy duzej puli: {grow:?}"
    );
    let drop = advance_wealth(
        WealthState {
            poziom: 3.0,
            pula: 0.0,
        },
        0.0,
        100.0,
        1.0,
        p,
        None,
    );
    assert_eq!(drop.spadek, 1);
    assert_eq!(drop.poziom, 2.0);
    // minPoziom blokuje spadek ponizej progu.
    let held = advance_wealth(
        WealthState {
            poziom: 1.0,
            pula: 0.0,
        },
        0.0,
        100.0,
        1.0,
        p,
        Some(1.0),
    );
    assert_eq!(held.spadek, 0);
    assert_eq!(held.poziom, 1.0);
}

#[test]
fn state_type_is_copy_compatible() {
    let s = fresh_wealth_state();
    let t = s;
    assert_eq!(s, t);
}
