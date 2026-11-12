//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q1 (SIEGE-SURRENDER Q2) + Q3-Q1 (r2): galaz Transfer `resolveSiegeSurrender`
//! na wektorach z pinu 07d2fbd72.
//!
//! Wektory: `tests/p6_siege_transfer_vectors/vectors.json`, generator `tests/p6_siege_transfer_gen.mjs`.
//! Generator WYKONUJE `resolveSiegeSurrender` (galaz newOwner, do `enterCityAfterSurrender`) z pinu na Proxy, wraz z
//! realnymi `applyCapturePopulationLoss`, `sanitizeBuildQueue`, `sanitizeProductionQueue`, `filterQueue`.
//! Oczekiwany stan miasta, jednostek, kolejki, Pracy w puli i log wolan pochodza z tego wykonania.
//! Test sprawdza: (1) stan po `apply_transfer_with_effects` = stan z pinu (populacja po utracie obywatela, flagi,
//! jednostki, kolejka, Praca zwrocona staremu i zdobywcy), (2) kazde wolanie z pinu jest wpisane w
//! `TRANSFER_EFFECTS`, (3) wykonane skutki nie pojawiaja sie w logu wolan atrap.

use civ_engine::domain::order_effects_lane::PostCaptureLawFields;
use civ_engine::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use civ_engine::domain::siege_enter_city::EnterUnit;
use civ_engine::domain::siege_transfer::{
    apply_transfer_with_effects, EffectStatus, TransferCity, TransferExtras, TransferProduction,
    TRANSFER_EFFECTS,
};
use civ_engine::domain::siege_transfer_effects::{
    CapturePopLossInput, PostCaptureCityFields, CAPTURE_POP_LOSS_PIN,
};
use serde_json::Value;

const DATA: &str = include_str!("p6_siege_transfer_vectors/vectors.json");

/// Kroki, ktore generator wykonuje realnie (nie atrapa); nie moga pojawic sie w logu wolan.
const EXECUTED_IN_PIN: [&str; 7] = [
    "applyCapturePopulationLoss",
    "sanitizeBuildQueue",
    "sanitizeProductionQueue",
    "filterQueue",
    "clearCityStateFlagOnCapture",
    "applyPostCaptureLawOnCapture",
    "triggerRebelProtectionWarConsequence",
];

fn parse_num(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba"),
    }
}

fn opt_i64(v: &Value) -> Option<i64> {
    match v {
        Value::Null => None,
        other => Some(other.as_i64().expect("calkowita")),
    }
}

fn opt_bool(v: &Value) -> Option<bool> {
    match v {
        Value::Null => None,
        Value::Bool(b) => Some(*b),
        other => panic!("nieoczekiwana wartosc flagi {other}"),
    }
}

fn opt_f64(v: &Value) -> Option<f64> {
    match v {
        Value::Null => None,
        other => Some(parse_num(other)),
    }
}

fn status_of(name: &str) -> Option<EffectStatus> {
    TRANSFER_EFFECTS
        .iter()
        .find(|(n, _)| *n == name)
        .map(|(_, s)| *s)
}

fn prod_from(v: &Value) -> Option<CityProduction> {
    if v.is_null() {
        return None;
    }
    let kolejka = v["kolejka"]
        .as_array()
        .expect("kolejka[]")
        .iter()
        .map(|i| {
            let kind = match i["kind"].as_str().unwrap() {
                "budynek" => ProductionKind::Budynek,
                "jednostka" => ProductionKind::Jednostka,
                other => panic!("nieznany rodzaj {other}"),
            };
            ProductionItem {
                kind,
                id: i["id"].as_str().unwrap().to_owned(),
                nazwa: i["id"].as_str().unwrap().to_owned(),
                koszt: 10.0,
                postep: opt_f64(&i["postep"]),
                is_general: None,
            }
        })
        .collect();
    Some(CityProduction {
        kolejka,
        postep: parse_num(&v["postep"]),
        wstrzymana: None,
        rekrutacja: None,
    })
}

#[test]
fn transfer_vectors_match_pin_state_calls_and_praca() {
    let root: Value = serde_json::from_str(DATA).expect("wektory JSON");
    let cases = root["transfer"].as_array().expect("transfer[]");
    assert!(cases.len() >= 100, "za malo wektorow: {}", cases.len());
    let capital: Vec<&str> = root["capitalBuildings"]
        .as_array()
        .expect("capitalBuildings[]")
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    let prefix = root["wonderPrefix"].as_str().expect("wonderPrefix");
    assert_eq!(
        root["capturePopLoss"].as_u64().unwrap(),
        u64::from(CAPTURE_POP_LOSS_PIN)
    );

    let mut war_count = 0usize;
    let mut reconquest_count = 0usize;
    for (idx, case) in cases.iter().enumerate() {
        let inp = &case["input"];
        let exp = &case["expect"];
        assert_eq!(exp["branch"], "transfer", "vector {idx}");

        let besieger = inp["besieger"].as_i64().unwrap();
        let city_owner = inp["cityOwner"].as_i64().unwrap();
        let mut city = TransferCity {
            owner_id: city_owner,
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
        let was_independent = inp["wasIndependent"].as_bool().unwrap();
        let pop_input = CapturePopLossInput {
            prev_owner: city_owner,
            new_owner: besieger,
            rebel_prev_owner_snapshot: opt_i64(&inp["rebelPreviousOwnerId"]),
            captured_from_owner_id: opt_i64(&inp["capturedFromOwnerId"]),
            founded_by: opt_i64(&inp["foundedBy"]),
            found_by_owner: city.found_by_owner,
            capture_pop_loss: CAPTURE_POP_LOSS_PIN,
        };

        let prod_opt = prod_from(&inp["prod"]);
        let is_new_capital = inp["isNewCapital"].as_bool().unwrap();
        let wonder_table = &inp["wonderOk"];
        let is_cap = |i: &ProductionItem| {
            matches!(i.kind, ProductionKind::Budynek) && capital.contains(&i.id.as_str())
        };
        // web parseWonderProdId: pusty wid (`if (!wid) return true`) przechodzi bramke.
        let gate = |i: &ProductionItem| match i.id.strip_prefix(prefix) {
            Some("") => true,
            Some(wid) => wonder_table[wid].as_bool() == Some(true),
            None => true,
        };
        let production = prod_opt.as_ref().map(|p| TransferProduction {
            prod: p,
            is_new_capital,
            is_capital_only_building: &is_cap,
        });

        // Q4-Q1 r2: pola Prawa i revoltGraceRemaining z wejscia pinu (web czyta je w galezi Transfer ZAWSZE).
        let mut law = PostCaptureLawFields {
            post_capture_law_turns_remaining: opt_f64(&inp["postCaptureLawTurnsRemaining"]),
            was_rebellion_reconquest: opt_bool(&inp["wasRebellionReconquest"]).unwrap_or(false),
            rebel_previous_owner_id: opt_i64(&inp["rebelPreviousOwnerId"]),
            rebel_protection_turns_remaining: opt_f64(&inp["rebelProtectionTurnsRemaining"]),
        };
        let mut grace = opt_f64(&inp["revoltGraceRemaining"]);

        let out = apply_transfer_with_effects(
            &mut city,
            besieger,
            was_independent,
            &mut units,
            production,
            TransferExtras {
                pop_loss: Some(pop_input),
                wonder_gate_ok: Some(&gate),
                post_capture_law: Some(PostCaptureCityFields {
                    law: &mut law,
                    revolt_grace_remaining: &mut grace,
                }),
            },
        );

        // Prawo po przejeciu + wojna rebeliantow (pin main.ts:17693-17703).
        assert!(
            out.performed.contains(&"applyPostCaptureLawOnCapture"),
            "vector {idx}: applyPostCaptureLawOnCapture"
        );
        assert!(
            out.performed
                .contains(&"triggerRebelProtectionWarConsequence"),
            "vector {idx}: triggerRebelProtectionWarConsequence"
        );
        assert_eq!(
            law.post_capture_law_turns_remaining,
            opt_f64(&exp["postCaptureLawTurnsRemaining"]),
            "vector {idx}: postCaptureLawTurnsRemaining"
        );
        assert_eq!(
            law.was_rebellion_reconquest,
            opt_bool(&exp["wasRebellionReconquest"]).unwrap_or(false),
            "vector {idx}: wasRebellionReconquest"
        );
        assert_eq!(
            out.post_capture_law_reconquest,
            Some(law.was_rebellion_reconquest),
            "vector {idx}: wynik reconquest"
        );
        assert_eq!(
            law.rebel_previous_owner_id,
            opt_i64(&exp["rebelPreviousOwnerId"]),
            "vector {idx}: rebelPreviousOwnerId po kasowaniu"
        );
        assert_eq!(
            law.rebel_protection_turns_remaining,
            opt_f64(&exp["rebelProtectionTurnsRemaining"]),
            "vector {idx}: rebelProtectionTurnsRemaining po kasowaniu"
        );
        assert_eq!(
            grace,
            opt_f64(&exp["revoltGraceRemaining"]),
            "vector {idx}: revoltGraceRemaining"
        );
        // Wojna: web ownerDeclareWarOn(newOwner, rebelPrev, true, 'wymuszona_inna') albo brak wywolania.
        let war_exp = exp["declareWar"].as_array().expect("declareWar[]");
        assert!(
            war_exp.len() <= 1,
            "vector {idx}: co najwyzej jedno wywolanie wojny"
        );
        match (war_exp.first(), &out.rebel_war_request) {
            (None, None) => {}
            (Some(w), Some(req)) => {
                assert_eq!(
                    w["attacker"].as_i64(),
                    Some(req.declarer),
                    "vector {idx}: declarer"
                );
                assert_eq!(
                    w["defender"].as_i64(),
                    Some(req.target),
                    "vector {idx}: target"
                );
                assert_eq!(w["force"], Value::Bool(true), "vector {idx}: force=true");
                assert_eq!(w["cause"], "wymuszona_inna", "vector {idx}: powod");
                war_count += 1;
            }
            (w, req) => panic!("vector {idx}: wojna pin {w:?} vs Rust {req:?}"),
        }
        if law.was_rebellion_reconquest {
            reconquest_count += 1;
        }

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
        let capture = out
            .capture_loss
            .as_ref()
            .expect("applyCapturePopulationLoss wykonany");
        assert_eq!(
            Some(capture.captured_from_owner_id),
            opt_i64(&exp["capturedFromOwnerId"]),
            "vector {idx}: capturedFromOwnerId"
        );
        assert_eq!(
            capture.founded_by,
            opt_i64(&exp["foundedBy"]),
            "vector {idx}: foundedBy"
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

        // Praca w puli: zwrot staremu (sanitizeBuildQueue) i zdobywcy (bramka cudow + filtr stolic + zbankowany postep).
        let pool = &exp["praca"];
        let old_pool = pool[city_owner.to_string()].as_f64().unwrap_or(0.0);
        let new_pool = pool[besieger.to_string()].as_f64().unwrap_or(0.0);
        assert_eq!(
            out.refunded_praca_to_old, old_pool,
            "vector {idx}: zwrot Pracy staremu"
        );
        assert_eq!(
            out.forfeited_praca_to_new, new_pool,
            "vector {idx}: Praca zdobywcy"
        );

        // Kolejka po przejeciu = kolejka z pinu (ids, rodzaj, postep frontu i pozostalych).
        match (&out.production, exp["production"].is_null()) {
            (None, true) => {}
            (Some(got), false) => {
                let exp_items = exp["production"]["kolejka"].as_array().unwrap();
                let ids: Vec<&str> = got.kolejka.iter().map(|i| i.id.as_str()).collect();
                let ids_exp: Vec<&str> = exp_items
                    .iter()
                    .map(|i| i["id"].as_str().unwrap())
                    .collect();
                assert_eq!(ids, ids_exp, "vector {idx}: kolejka po przejeciu");
                for (g, e) in got.kolejka.iter().zip(exp_items) {
                    assert_eq!(
                        g.postep,
                        opt_f64(&e["postep"]),
                        "vector {idx}: postep {}",
                        g.id
                    );
                }
                assert_eq!(
                    got.postep,
                    parse_num(&exp["production"]["postep"]),
                    "vector {idx}: postep kolejki"
                );
            }
            (got, exp_null) => panic!(
                "vector {idx}: kolejka {:?} vs null={exp_null}",
                got.is_some()
            ),
        }

        // Pokrycie: kazde wolanie z pinu ma wpis w tabeli; wykonane skutki nie sa w logu atrap.
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
            assert!(
                !EXECUTED_IN_PIN.contains(name),
                "vector {idx}: skutek {name} wykonany realnie, a pojawil sie w logu atrap"
            );
        }
        assert!(
            out.performed.contains(&"applyCapturePopulationLoss"),
            "vector {idx}"
        );
        assert!(
            out.performed.contains(&"clearCityStateFlagOnCapture"),
            "vector {idx}"
        );
    }
    // Pokrycie galezi: odbicia po buncie i wojny rebeliantow musza wystapic w wektorach z pinu.
    assert!(
        reconquest_count >= 10,
        "za malo odbic po buncie: {reconquest_count}"
    );
    assert!(
        war_count >= 10,
        "za malo wojen z triggerRebelProtectionWarConsequence: {war_count}"
    );
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
    // R-RUSTPORT-P6-SIEGE-TRANSFER-Q5-Q1: noteCityCapture, syncCityGarnizon, playerEverOwnedCityByOwner.add,
    // applyLiveSafeRationForCity przeszly na Ported (wektory: tests/p6_siege_transfer_q5.rs).
    // R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1: runCapitalCapturePlunder przeszedl na Ported (wektory: tests/p6_siege_capital_plunder.rs).
    assert_eq!(
        missing,
        vec![
            "beginWonderTransferWatch",
            "settleWonderTransfer",
            "recordCityCaptureEvent",
        ]
    );
}
