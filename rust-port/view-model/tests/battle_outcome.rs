//! P4-1I1 (`R-RUSTPORT-P4-1I1-BATTLE-OUTCOME`): `BattleOutcomeDto` — JSON
//! round-trip, strict keys, web literals of `winner` and the producer checks
//! of [`BattleOutcomeDto::validate`]. Keys: `json_keys.rs::battle_outcome_keys`.

mod common;

use civ_view_model::battle::{BattleOutcomeDto, BattleWinner};
use civ_view_model::ViewError;
use common::*;
use serde_json::{json, Value};

fn rt(value: &BattleOutcomeDto) {
    let text = serde_json::to_string(value).expect("serialize");
    let back: BattleOutcomeDto = serde_json::from_str(&text).expect("deserialize text");
    assert_eq!(&back, value, "text round-trip of {text}");
    assert_eq!(serde_json::to_string(&back).unwrap(), text, "stable output");
    let back2: BattleOutcomeDto =
        serde_json::from_value(serde_json::to_value(value).unwrap()).unwrap();
    assert_eq!(&back2, value);
}

#[test]
fn outcome_round_trips() {
    let full = sample_outcome();
    rt(&full);
    let mut none = full.clone();
    none.wall_breached = None;
    none.survivors.clear();
    none.attacker_unit_ids.clear();
    none.winner = BattleWinner::Atakujacy;
    rt(&none);
    let mut log = full;
    log.log = vec!["=== Koniec bitwy: REMIS ===".into()];
    log.winner = BattleWinner::Obronca;
    rt(&log);
}

/// `BattleResult.winner` literals (`battle/battleScene.ts:589` @ `07d2fbd72`).
#[test]
fn winner_literals_match_pin() {
    for (w, s) in [
        (BattleWinner::Atakujacy, "atakujacy"),
        (BattleWinner::Obronca, "obronca"),
        (BattleWinner::Remis, "remis"),
    ] {
        assert_eq!(serde_json::to_value(w).unwrap(), json!(s));
        assert_eq!(serde_json::from_value::<BattleWinner>(json!(s)).unwrap(), w);
    }
    assert!(serde_json::from_value::<BattleWinner>(json!("draw")).is_err());
    assert!(serde_json::from_value::<BattleWinner>(json!("Remis")).is_err());
}

#[test]
fn unknown_and_missing_keys_rejected() {
    let base = serde_json::to_value(sample_outcome()).unwrap();
    let paths: [&[&str]; 4] = [
        &[],
        &["survivors", "0"],
        &["endStats"],
        &["endStats", "atk"],
    ];
    for path in paths {
        let mut v = base.clone();
        let mut node = &mut v;
        for k in path {
            node = match k.parse::<usize>() {
                Ok(i) => &mut node[i],
                Err(_) => &mut node[*k],
            };
        }
        node.as_object_mut()
            .unwrap()
            .insert("extra".into(), json!(1));
        assert!(
            serde_json::from_value::<BattleOutcomeDto>(v).is_err(),
            "unknown key at {path:?} accepted"
        );
    }
    for key in [
        "winner",
        "survivors",
        "log",
        "attackerUnitIds",
        "defenderUnitIds",
        "endStats",
    ] {
        let mut v = base.clone();
        v.as_object_mut().unwrap().remove(key);
        assert!(
            serde_json::from_value::<BattleOutcomeDto>(v).is_err(),
            "missing {key} accepted"
        );
    }
    // snake_case is not an alias.
    let mut v: Value = base;
    let o = v.as_object_mut().unwrap();
    let ids = o.remove("attackerUnitIds").unwrap();
    o.insert("attacker_unit_ids".into(), ids);
    assert!(serde_json::from_value::<BattleOutcomeDto>(v).is_err());
}

#[test]
fn ids_above_max_safe_rejected_on_input() {
    let mut v = serde_json::to_value(sample_outcome()).unwrap();
    v["survivors"][0]["id"] = json!(civ_view_model::MAX_SAFE_ID + 1);
    assert!(serde_json::from_value::<BattleOutcomeDto>(v).is_err());
    let mut v = serde_json::to_value(sample_outcome()).unwrap();
    v["defenderUnitIds"][0] = json!(civ_view_model::MAX_SAFE_ID + 1);
    assert!(serde_json::from_value::<BattleOutcomeDto>(v).is_err());
}

#[test]
fn sample_outcome_is_valid() {
    sample_outcome().validate().unwrap();
}

#[test]
fn every_float_rejects_non_finite() {
    type Set = fn(&mut BattleOutcomeDto, f64);
    let rows: [(&str, Set); 5] = [
        ("survivors[1].hp", |o, v| o.survivors[1].hp = v),
        ("endStats.atk.hp", |o, v| o.end_stats.atk.hp = v),
        ("endStats.atk.hpMax", |o, v| o.end_stats.atk.hp_max = v),
        ("endStats.def.hp", |o, v| o.end_stats.def.hp = v),
        ("endStats.def.hpMax", |o, v| o.end_stats.def.hp_max = v),
    ];
    for (field, set) in rows {
        for bad in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            let mut o = sample_outcome();
            set(&mut o, bad);
            assert_eq!(
                o.validate(),
                Err(ViewError::NonFinite {
                    field: field.into()
                }),
                "{field} = {bad}"
            );
        }
    }
}

#[test]
fn lost_plus_remaining_must_equal_total() {
    let mut o = sample_outcome();
    o.end_stats.def.remaining = 1;
    assert_eq!(
        o.validate(),
        Err(ViewError::LengthMismatch {
            field: "endStats.def.lost+remaining".into(),
            expected: 2,
            actual: 3,
        })
    );
    let mut o = sample_outcome();
    o.end_stats.atk.total = 3;
    assert_eq!(
        o.validate(),
        Err(ViewError::LengthMismatch {
            field: "endStats.atk.lost+remaining".into(),
            expected: 3,
            actual: 2,
        })
    );
}

#[test]
fn event_log_ids_must_be_unique_per_side() {
    let mut o = sample_outcome();
    o.attacker_unit_ids.push(uid(100));
    assert_eq!(
        o.validate(),
        Err(ViewError::LengthMismatch {
            field: "attackerUnitIds (unique)".into(),
            expected: 2,
            actual: 3,
        })
    );
    // The same id on both sides is not a per-side duplicate.
    let mut o = sample_outcome();
    o.defender_unit_ids.push(uid(100));
    o.validate().unwrap();
    // Survivors are not deduplicated (web keeps duplicates of `_endSurvivors`).
    let mut o = sample_outcome();
    o.survivors.push(o.survivors[0]);
    o.validate().unwrap();
}
