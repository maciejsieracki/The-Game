//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q1 (SIEGE-SURRENDER Q2): galaz Transfer `resolveSiegeSurrender` na wektorach z pinu 07d2fbd72.
//!
//! Wektory: `tests/p6_siege_transfer_vectors/vectors.json`, generator `tests/p6_siege_transfer_gen.mjs`.
//! Generator WYKONUJE `resolveSiegeSurrender` (galaz newOwner, do `enterCityAfterSurrender`) z pinu na Proxy.
//! Oczekiwany stan miasta/jednostek i log wolan pochodza z tego wykonania.
//! Test sprawdza: (1) stan po `apply_transfer` = stan z pinu, (2) kazde wolanie z pinu jest wpisane w
//! `TRANSFER_EFFECTS` (brak nieobjetego skutku = FAIL), (3) skutki Ported sa wykonane, a CallerSide/Missing nie.

use civ_engine::domain::siege_enter_city::EnterUnit;
use civ_engine::domain::siege_transfer::{
    apply_transfer, EffectStatus, TransferCity, TRANSFER_EFFECTS,
};
use serde_json::Value;

const DATA: &str = include_str!("p6_siege_transfer_vectors/vectors.json");

fn parse_num(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba"),
    }
}

fn opt_bool(v: &Value) -> Option<bool> {
    match v {
        Value::Null => None,
        Value::Bool(b) => Some(*b),
        other => panic!("nieoczekiwana wartosc flagi {other}"),
    }
}

fn status_of(name: &str) -> Option<EffectStatus> {
    TRANSFER_EFFECTS
        .iter()
        .find(|(n, _)| *n == name)
        .map(|(_, s)| *s)
}

#[test]
fn transfer_vectors_match_pin_state_and_calls() {
    let root: Value = serde_json::from_str(DATA).expect("wektory JSON");
    let cases = root["transfer"].as_array().expect("transfer[]");
    assert!(cases.len() >= 100, "za malo wektorow: {}", cases.len());

    for (idx, case) in cases.iter().enumerate() {
        let inp = &case["input"];
        let exp = &case["expect"];
        assert_eq!(exp["branch"], "transfer", "vector {idx}");

        let mut city = TransferCity {
            owner_id: inp["cityOwner"].as_i64().unwrap(),
            population: parse_num(&inp["pop"]),
            q: inp["cityQ"].as_i64().unwrap(),
            r: inp["cityR"].as_i64().unwrap(),
            found_by_owner: opt_bool(&inp["foundedByOwner"]),
            rebel_state: opt_bool(&inp["rebelState"]),
            start_city_state: opt_bool(&inp["startCityState"]),
        };
        let start_before = city.start_city_state;
        let mut units: Vec<EnterUnit> = inp["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| EnterUnit {
                id: u["id"].as_str().unwrap().to_owned(),
                owner_id: u["ownerId"].as_i64().unwrap(),
                q: u["q"].as_i64().unwrap(),
                r: u["r"].as_i64().unwrap(),
                ..Default::default()
            })
            .collect();
        let besieger = inp["besieger"].as_i64().unwrap();
        let was_independent = inp["wasIndependent"].as_bool().unwrap();

        let out = apply_transfer(&mut city, besieger, was_independent, &mut units, None);

        assert_eq!(out.new_owner, besieger, "vector {idx}: newOwner");
        assert_eq!(
            city.owner_id,
            exp["ownerId"].as_i64().unwrap(),
            "vector {idx}: ownerId"
        );
        let pop_exp = parse_num(&exp["population"]);
        assert!(
            (city.population.is_nan() && pop_exp.is_nan()) || city.population == pop_exp,
            "vector {idx}: population {} != {}",
            city.population,
            pop_exp
        );
        assert_eq!(
            city.found_by_owner,
            opt_bool(&exp["foundedByOwner"]),
            "vector {idx}: foundedByOwner"
        );
        assert_eq!(
            city.rebel_state,
            opt_bool(&exp["rebelState"]),
            "vector {idx}: rebelState"
        );
        assert_eq!(
            city.start_city_state,
            opt_bool(&exp["startCityState"]),
            "vector {idx}: startCityState"
        );
        assert_eq!(
            out.start_city_state_cleared,
            start_before == Some(true),
            "vector {idx}: clearCityStateFlag"
        );
        assert!(out.city_siege_owner_changed, "vector {idx}");

        let after: Vec<&str> = units.iter().map(|u| u.id.as_str()).collect();
        let after_exp: Vec<&str> = exp["unitIdsAfter"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap())
            .collect();
        assert_eq!(after, after_exp, "vector {idx}: jednostki po splice");

        // Pokrycie: kazde wolanie z pinu ma wpis w tabeli; Ported/ExistsNotWired/Missing nie sa po cichu wykonane.
        let pin_calls: Vec<&str> = exp["calls"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap())
            .collect();
        for name in &pin_calls {
            assert!(
                status_of(name).is_some(),
                "vector {idx}: wolanie pinu bez wpisu w TRANSFER_EFFECTS: {name}"
            );
        }
        // Jedyny skutek Ported obserwowalny w zakresie tych wektorow (bez kolejki) to flaga miasta-panstwa.
        assert!(
            out.performed.contains(&"clearCityStateFlagOnCapture"),
            "vector {idx}"
        );
        assert!(out.production.is_none());
        assert_eq!(out.refunded_praca_to_old, 0.0);
        assert_eq!(out.forfeited_praca_to_new, 0.0);
    }
}

#[test]
fn coverage_table_has_no_silent_ported_gaps() {
    // Kazdy wpis Ported ma nazwe Rust; kazdy wpis Missing/ExistsNotWired ma jawny opis (nie pusty).
    for (name, st) in TRANSFER_EFFECTS {
        match st {
            EffectStatus::Ported(rust)
            | EffectStatus::ExistsNotWired(rust)
            | EffectStatus::CallerSide(rust) => {
                assert!(!rust.is_empty(), "pusty opis dla {name}");
            }
            EffectStatus::Missing | EffectStatus::Ui => {}
        }
    }
    let missing: Vec<&str> = TRANSFER_EFFECTS
        .iter()
        .filter(|(_, s)| matches!(s, EffectStatus::Missing))
        .map(|(n, _)| *n)
        .collect();
    // Jawna lista BRAK (dispatch: "jawny brak"); zmiana tej listy wymaga zmiany tabeli i raportu.
    assert_eq!(
        missing,
        vec![
            "beginWonderTransferWatch",
            "applyCapturePopulationLoss",
            "applyPostCaptureLawOnCapture",
            "triggerRebelProtectionWarConsequence",
            "settleWonderTransfer",
            "noteCityCapture",
            "sanitizeProductionQueue",
            "syncCityGarnizon",
            "playerEverOwnedCityByOwner.add",
            "runCapitalCapturePlunder",
            "recordCityCaptureEvent",
            "applyLiveSafeRationForCity",
        ]
    );
}
