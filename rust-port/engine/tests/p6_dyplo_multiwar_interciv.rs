//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 4): zgodnosc bramki R1/R2 wojny miedzy
//! cywilizacjami i `pickPlayerReferenceCity` z URUCHOMIONYM webem (pin a61337844).
//! Wektory: `tests/p6_dyplo_multiwar_gates_data/intercivgate.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/gen-multiwar-vectors.cjs` (sekcja 4).

use civ_engine::domain::diplomacy_multiwar_gate::*;
use serde_json::Value;

const INTERCIV: &str = include_str!("p6_dyplo_multiwar_gates_data/intercivgate.json");

#[derive(Debug, Clone)]
struct City {
    id: String,
    owner_id: i64,
}

fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v.as_str().expect("liczba jako string") {
        "NaN" | "undefined" => f64::NAN,
        s => s.parse::<f64>().expect("liczba"),
    }
}

fn int(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| num(v) as i64)
}

#[test]
fn intercivgate_vectors_match_web() {
    let cases: Vec<Value> = serde_json::from_str(INTERCIV).expect("wektory");
    for c in &cases {
        let input = &c["in"];
        let out = match &c["out"] {
            Value::String(s) => s.clone(),
            Value::Null => "null".to_string(),
            other => other.to_string(),
        };
        match c["fn"].as_str().expect("fn") {
            "isInterCivWarOpenAtTurn" => {
                let got = is_inter_civ_war_open_at_turn(num(&input["turn"]));
                assert_eq!(got.to_string(), out, "{input}");
            }
            "concurrentWarLimitForEra" => {
                let got = concurrent_war_limit_for_era(num(&input["era"]))
                    .map_or("null".to_string(), |v| v.to_string());
                assert_eq!(got, out, "{input}");
            }
            "evaluateInterCivWarGate" => {
                let inp = InterCivWarGateInput {
                    turn: num(&input["turn"]),
                    attacker_era: num(&input["attackerEra"]),
                    attacker_war_count: int(&input["attackerWarCount"]),
                    target_is_player: input["targetIsPlayer"].as_bool().expect("bool"),
                    target_era: num(&input["targetEra"]),
                    target_war_count: int(&input["targetWarCount"]),
                    era_tag: match input.get("eraTag").and_then(Value::as_str) {
                        Some("bronze") => Some(ForcedEraTag::Bronze),
                        Some("iron") => Some(ForcedEraTag::Iron),
                        Some("stone") => Some(ForcedEraTag::Stone),
                        _ => None,
                    },
                };
                assert_eq!(
                    evaluate_inter_civ_war_gate(&inp).as_web_str(),
                    out,
                    "{input}"
                );
            }
            "pickPlayerReferenceCity" => {
                // Wektory opisuja 4-miastowy zestaw (c1,c2 gracz; c3 AI; c4 gracz) albo jednoelementowe/puste listy.
                let cities: Vec<City> = match input["cities"].as_array().map(|a| a.len()) {
                    Some(0) => vec![],
                    Some(1) => vec![City {
                        id: "x".into(),
                        owner_id: 1,
                    }],
                    _ => vec![
                        City {
                            id: "c1".into(),
                            owner_id: 0,
                        },
                        City {
                            id: "c2".into(),
                            owner_id: 0,
                        },
                        City {
                            id: "c3".into(),
                            owner_id: 1,
                        },
                        City {
                            id: "c4".into(),
                            owner_id: 0,
                        },
                    ],
                };
                let cap: Option<&str> = match &input["capitalCityId"] {
                    Value::String(s) if s != "undefined" => Some(s.as_str()),
                    _ => None,
                };
                let got =
                    pick_player_reference_city(&cities, |c| c.id.as_str(), |c| c.owner_id, cap, 0)
                        .map_or("null".to_string(), |c| c.id.clone());
                assert_eq!(got, out, "{input}");
            }
            other => panic!("nieznana funkcja {other}"),
        }
    }
    // Dokladna liczba z generatora (intercivgate.json = 23 wpisy; r5 zarzut 2: nie >= 20).
    assert_eq!(cases.len(), 23, "liczba wektorow intercivgate");
}

#[test]
fn n_minus_1_n_n_plus_1_around_turn_40_and_stone_limit() {
    assert!(!is_inter_civ_war_open_at_turn(39.0));
    assert!(is_inter_civ_war_open_at_turn(40.0));
    assert!(is_inter_civ_war_open_at_turn(41.0));
    assert!(!is_inter_civ_war_open_at_turn(f64::NAN));
    let base = InterCivWarGateInput {
        turn: 40.0,
        attacker_era: 1.0,
        attacker_war_count: 0,
        target_is_player: false,
        target_era: 2.0,
        target_war_count: 0,
        era_tag: None,
    };
    assert_eq!(evaluate_inter_civ_war_gate(&base), WarGateReason::Ok);
    let at_limit = InterCivWarGateInput {
        attacker_war_count: 1,
        ..base
    };
    assert_eq!(
        evaluate_inter_civ_war_gate(&at_limit),
        WarGateReason::StoneLimitAttackerR2
    );
    let before_r1 = InterCivWarGateInput { turn: 39.0, ..base };
    assert_eq!(
        evaluate_inter_civ_war_gate(&before_r1),
        WarGateReason::DelayR1
    );
    // Limit napastnika w Brazie = brak limitu.
    let bronze = InterCivWarGateInput {
        attacker_era: 2.0,
        attacker_war_count: 9,
        ..base
    };
    assert_eq!(evaluate_inter_civ_war_gate(&bronze), WarGateReason::Ok);
    // Cel-gracz pomija limit celu.
    let player_t = InterCivWarGateInput {
        target_is_player: true,
        target_era: 1.0,
        target_war_count: 5,
        ..base
    };
    assert_eq!(evaluate_inter_civ_war_gate(&player_t), WarGateReason::Ok);
    // NaN w epoce: web `NaN === 1` jest false -> brak limitu.
    assert_eq!(concurrent_war_limit_for_era(f64::NAN), None);
}
