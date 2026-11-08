//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1 (partia G, hunk `evaluateInterCivWarGate`): zgodnosc
//! `evaluate_inter_civ_war_gate` z URUCHOMIONYM webem (origin/main, `gra/src/game/war-rules-multiwar.ts`).
//! Wektory: `tests/p6_dyplomacja_multiwar3_g_data/war-gate.json` (12288 wierszy), generator `gen-de.mts`
//! (Node 22, `--import reg2.mjs`; web wypakowany `git archive origin/main gra/src gra/data` poza repo).

use civ_engine::domain::diplomacy_multiwar_gate::{
    concurrent_war_limit_for_era, evaluate_inter_civ_war_gate, ForcedEraTag, InterCivWarGateInput,
    WarGateReason,
};
use serde_json::Value;

const WAR_GATE: &str = include_str!("p6_dyplomacja_multiwar3_g_data/war-gate.json");

fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana: {v}"))
    {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        s => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

fn tag(v: &Value) -> Option<ForcedEraTag> {
    match v.as_str() {
        Some("bronze") => Some(ForcedEraTag::Bronze),
        Some("iron") => Some(ForcedEraTag::Iron),
        Some("stone") => Some(ForcedEraTag::Stone),
        _ => None,
    }
}

fn input(v: &Value) -> InterCivWarGateInput {
    InterCivWarGateInput {
        turn: num(&v["turn"]),
        attacker_era: num(&v["attackerEra"]),
        attacker_war_count: v["attackerWarCount"].as_i64().unwrap(),
        target_is_player: v["targetIsPlayer"].as_bool().unwrap(),
        target_era: num(&v["targetEra"]),
        target_war_count: v["targetWarCount"].as_i64().unwrap(),
        era_tag: tag(&v["eraTag"]),
    }
}

#[test]
fn evaluate_inter_civ_war_gate_matches_web_vectors() {
    let rows: Vec<Value> = serde_json::from_str(WAR_GATE).expect("war-gate.json");
    assert_eq!(rows.len(), 12288);
    for (i, row) in rows.iter().enumerate() {
        let got = evaluate_inter_civ_war_gate(&input(&row["inp"]));
        assert_eq!(
            got.as_web_str(),
            row["out"].as_str().unwrap(),
            "wiersz {i}: {}",
            row["inp"]
        );
    }
}

fn base() -> InterCivWarGateInput {
    InterCivWarGateInput {
        turn: 40.0,
        attacker_era: 1.0,
        attacker_war_count: 0,
        target_is_player: false,
        target_era: 1.0,
        target_war_count: 0,
        era_tag: None,
    }
}

#[test]
fn r1_turn_boundary_n_minus_1_n_n_plus_1() {
    // Tura 40 = granica R1: 39 blokuje (bez tagu epoki), 40 i 41 przepuszczaja.
    let mut g = base();
    g.turn = 39.0;
    assert_eq!(evaluate_inter_civ_war_gate(&g), WarGateReason::DelayR1);
    g.turn = 40.0;
    assert_eq!(evaluate_inter_civ_war_gate(&g), WarGateReason::Ok);
    g.turn = 41.0;
    assert_eq!(evaluate_inter_civ_war_gate(&g), WarGateReason::Ok);
    // Wojna epoki Brazu omija R1 przed tura 40.
    g.turn = 39.0;
    g.era_tag = Some(ForcedEraTag::Bronze);
    assert_eq!(evaluate_inter_civ_war_gate(&g), WarGateReason::Ok);
}

#[test]
fn attacker_limit_boundary_n_minus_1_n_n_plus_1() {
    // Limit wojen napastnika w Kamieniu: N-1 przepuszcza, N blokuje (stone_limit_attacker_r2), N+1 nie przechodzi.
    let limit = concurrent_war_limit_for_era(1.0).expect("limit Kamienia");
    let mut g = base();
    g.attacker_war_count = limit - 1;
    assert_eq!(evaluate_inter_civ_war_gate(&g), WarGateReason::Ok);
    g.attacker_war_count = limit;
    assert_eq!(
        evaluate_inter_civ_war_gate(&g),
        WarGateReason::StoneLimitAttackerR2
    );
    g.attacker_war_count = limit + 1;
    assert_eq!(
        evaluate_inter_civ_war_gate(&g),
        WarGateReason::StoneLimitAttackerR2
    );
    // Cel-gracz nie ma limitu (jego wybor) -> limit celu pominiety.
    g.target_is_player = true;
    g.target_war_count = 99;
    assert_eq!(
        evaluate_inter_civ_war_gate(&g),
        WarGateReason::StoneLimitAttackerR2
    );
    g.attacker_war_count = 0;
    assert_eq!(evaluate_inter_civ_war_gate(&g), WarGateReason::Ok);
}
