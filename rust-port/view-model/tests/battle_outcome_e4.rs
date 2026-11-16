//! P4-1I1B (`R-RUSTPORT-P4-1I1B-BATTLE-INSTANT`): `BattleOutcomeDto` for path E4
//! ("Pomiń", `_skipInstantFallback`, `battle/battleScene.ts:3715-3748` @ `07d2fbd72`).
//!
//! The literal below is the engine output for the pin vector `mur_machina_wylom`
//! (`engine/tests/p4_1i1b_battle_instant.rs`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT/dowody/`): a siege
//! with a live ram, so `wallBreached = true` (`:3720-3722`); `log` = `result.log`
//! (`:3744`) ending with the verdict line (`:20591`); survivors only from the
//! winning side, each with `hp > 0` (`:20574-20575`).

use civ_view_model::battle::{BattleOutcomeDto, BattleWinner};
use civ_view_model::ViewError;
use serde_json::{json, Value};

fn e4_json() -> Value {
    json!({
        "winner": "atakujacy",
        "survivors": [{ "id": 502, "hp": 54.0 }],
        "log": [
            "P Taran>Obronca muru Plaskie (rownina/laka) front 300 A30 D10",
            "P Legionista>Garnizon Plaskie (rownina/laka) front 300 A62 D2",
            "P Taran>Obronca muru Plaskie (rownina/laka) front 300 A0 D0",
            "P Legionista>Garnizon Plaskie (rownina/laka) front 300 A54 D0",
            "=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="
        ],
        "attackerUnitIds": [501, 502],
        "defenderUnitIds": [601, 602],
        "wallBreached": true,
        "endStats": {
            "atk": { "total": 2, "lost": 0, "remaining": 2, "hp": 150.0, "hpMax": 150.0 },
            "def": { "total": 2, "lost": 0, "remaining": 2, "hp": 70.0, "hpMax": 70.0 }
        }
    })
}

#[test]
fn e4_outcome_parses_validates_and_round_trips() {
    let dto: BattleOutcomeDto = serde_json::from_value(e4_json()).expect("e4 literal");
    dto.validate().expect("valid E4 outcome");
    assert_eq!(dto.winner, BattleWinner::Atakujacy);
    assert_eq!(dto.wall_breached, Some(true));
    assert_eq!(
        dto.log.last().map(String::as_str),
        Some("=== Natychmiastowy wynik: ATAKUJACY wygrywa ===")
    );
    let text = serde_json::to_string(&dto).expect("serialize");
    let back: BattleOutcomeDto = serde_json::from_str(&text).expect("deserialize");
    assert_eq!(back, dto);
    assert_eq!(serde_json::to_string(&back).expect("again"), text);
}

#[test]
fn e4_outcome_keys() {
    let dto: BattleOutcomeDto = serde_json::from_value(e4_json()).expect("e4 literal");
    let v = serde_json::to_value(&dto).expect("json");
    let mut keys: Vec<&str> = v
        .as_object()
        .expect("object")
        .keys()
        .map(String::as_str)
        .collect();
    keys.sort_unstable();
    assert_eq!(
        keys,
        [
            "attackerUnitIds",
            "defenderUnitIds",
            "endStats",
            "log",
            "survivors",
            "wallBreached",
            "winner"
        ]
    );
    assert_eq!(v["log"], e4_json()["log"]);
    assert_eq!(v["wallBreached"], json!(true));
}

/// E4 survivors come from `hp > 0` (`:20574-20575`); a zero-HP survivor is rejected.
#[test]
fn e4_zero_hp_survivor_rejected() {
    let mut j = e4_json();
    j["survivors"][0]["hp"] = json!(0.0);
    let dto: BattleOutcomeDto = serde_json::from_value(j).expect("parses");
    assert!(matches!(
        dto.validate(),
        Err(ViewError::OutOfRange { ref field, .. }) if field == "survivors[0].hp"
    ));
}

/// The log must be an array of strings (no numbers or objects).
#[test]
fn e4_log_must_be_strings() {
    let mut j = e4_json();
    j["log"] = json!([1, 2]);
    assert!(serde_json::from_value::<BattleOutcomeDto>(j).is_err());
}
