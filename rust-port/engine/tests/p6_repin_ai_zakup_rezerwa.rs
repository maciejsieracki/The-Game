//! R-RUSTPORT-REPIN-AI-ZAKUP-REZERWA-Q1: wektory z URUCHOMIONEGO weba (`gra/src/game/ai.ts`,
//! pin 679ab078a) dla `shouldAIPurchaseUnit` + `loadAiPurchaseReserveParams`.
//! Generator: tests/p6_repin_ai_zakup_vectors/gen-zakup-vectors.mjs (Node 22, --experimental-transform-types).
//! Granice N-1 / N / N+1 rezerwy i dochodu netto dla poziomow 1/2/3 (10/3/0 i 0/0/-2).

use civ_engine::data::economy_society_part2::parse_ai_params;
use civ_engine::domain::ai_zakup_jednostki::{
    load_ai_purchase_reserve_params, should_ai_purchase_unit, AiPurchaseInput,
    AiPurchaseReserveParams,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ai_zakup_vectors/zakup-vectors.json");

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn opt(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn reserve_of(v: &Value) -> Option<AiPurchaseReserveParams> {
    if v.is_null() {
        None
    } else {
        Some(AiPurchaseReserveParams {
            rezerwa_tur: num(&v["rezerwaTur"]),
            min_dochod_netto: num(&v["minDochodNetto"]),
        })
    }
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("zakup-vectors.json parses")
}

#[test]
fn ai_params_zakup_keys_match_web_values() {
    let params = parse_ai_params().expect("ai-params.json parses");
    let v = vectors();
    for lvl in [1u8, 2, 3] {
        let got = load_ai_purchase_reserve_params(&params, lvl);
        let exp = reserve_of(&v["params"][lvl.to_string()]).expect("params w wektorach");
        assert_eq!(got, exp, "poziom {lvl}: progi rezerwy rozne od weba");
    }
    // Jawne wartosci decyzji wlasciciela 2026-11-08 (10/3/0) i placeholdery netto (0/0/-2).
    assert_eq!(
        load_ai_purchase_reserve_params(&params, 1).rezerwa_tur,
        10.0
    );
    assert_eq!(load_ai_purchase_reserve_params(&params, 2).rezerwa_tur, 3.0);
    assert_eq!(load_ai_purchase_reserve_params(&params, 3).rezerwa_tur, 0.0);
    assert_eq!(
        load_ai_purchase_reserve_params(&params, 3).min_dochod_netto,
        -2.0
    );
}

#[test]
fn should_ai_purchase_unit_matches_web_vectors() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 39, "za malo wektorow: {}", cases.len());
    let mut failures = Vec::new();
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let i = &c["input"];
        let inp = AiPurchaseInput {
            treasury: num(&i["treasury"]),
            gold_cost: num(&i["goldCost"]),
            has_manpower: i["hasManpower"].as_bool().unwrap(),
            reserve: reserve_of(&i["reserve"]),
            net_income_per_turn: opt(&i["netIncomePerTurn"]),
            upkeep_per_turn: opt(&i["upkeepPerTurn"]),
            unit_upkeep_per_turn: opt(&i["unitUpkeepPerTurn"]),
        };
        let got = should_ai_purchase_unit(&inp);
        let exp = c["expected"].as_bool().unwrap();
        if got != exp {
            failures.push(format!("{id}: got {got}, web {exp}"));
        }
    }
    assert!(
        failures.is_empty(),
        "rozjazd z webem:\n{}",
        failures.join("\n")
    );
}

#[test]
fn reserve_boundary_n_minus_1_n_n_plus_1_per_level() {
    // Rezerwa: skarbiec po cenie = R * (utrzymanie 5 + jednostka 2) = R * 7; granice N-1/N/N+1.
    let params = parse_ai_params().expect("ai-params.json parses");
    for (lvl, r) in [(1u8, 10.0_f64), (2, 3.0), (3, 0.0)] {
        let res = load_ai_purchase_reserve_params(&params, lvl);
        assert_eq!(res.rezerwa_tur, r);
        let prog = r * 7.0;
        let mk = |treasury: f64| AiPurchaseInput {
            treasury,
            gold_cost: 40.0,
            has_manpower: true,
            reserve: Some(res),
            net_income_per_turn: Some(1000.0),
            upkeep_per_turn: Some(5.0),
            unit_upkeep_per_turn: Some(2.0),
        };
        // Dla r = 0 (poziom 3) N-1 = skarbiec 39 < cena 40: odrzucenie wynika z bramki ceny
        // (rezerwa 0 * utrzymanie = 0 redukuje sie do treasury >= cena), wiec granica jest testowana
        // takze dla poziomu 3 (poprzednia wersja pomijala ja guardem `if r > 0.0`).
        assert!(
            !should_ai_purchase_unit(&mk(40.0 + prog - 1.0)),
            "poziom {lvl}: N-1 powinno odrzucic"
        );
        assert!(
            should_ai_purchase_unit(&mk(40.0 + prog)),
            "poziom {lvl}: N powinno kupic"
        );
        assert!(
            should_ai_purchase_unit(&mk(40.0 + prog + 1.0)),
            "poziom {lvl}: N+1 powinno kupic"
        );
    }
}

#[test]
fn net_income_boundary_n_minus_1_n_n_plus_1_per_level() {
    // Dochod netto PO zakupie = net - jednostka(2) >= minDochodNetto; granice N-1/N/N+1.
    let params = parse_ai_params().expect("ai-params.json parses");
    for lvl in [1u8, 2, 3] {
        let res = load_ai_purchase_reserve_params(&params, lvl);
        let m = res.min_dochod_netto;
        let mk = |net: f64| AiPurchaseInput {
            treasury: 100_000.0,
            gold_cost: 40.0,
            has_manpower: true,
            reserve: Some(res),
            net_income_per_turn: Some(net),
            upkeep_per_turn: Some(5.0),
            unit_upkeep_per_turn: Some(2.0),
        };
        assert!(
            !should_ai_purchase_unit(&mk(m + 2.0 - 1.0)),
            "poziom {lvl}: netto N-1 powinno odrzucic"
        );
        assert!(
            should_ai_purchase_unit(&mk(m + 2.0)),
            "poziom {lvl}: netto N powinno kupic"
        );
        assert!(
            should_ai_purchase_unit(&mk(m + 2.0 + 1.0)),
            "poziom {lvl}: netto N+1 powinno kupic"
        );
    }
}

#[test]
fn legacy_gate_without_reserve_fields_is_price_and_manpower_only() {
    let base = AiPurchaseInput {
        treasury: 40.0,
        gold_cost: 40.0,
        has_manpower: true,
        reserve: None,
        net_income_per_turn: None,
        upkeep_per_turn: None,
        unit_upkeep_per_turn: None,
    };
    assert!(should_ai_purchase_unit(&base));
    assert!(!should_ai_purchase_unit(&AiPurchaseInput {
        has_manpower: false,
        ..base
    }));
    assert!(!should_ai_purchase_unit(&AiPurchaseInput {
        treasury: 39.0,
        ..base
    }));
}
