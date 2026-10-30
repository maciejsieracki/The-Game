//! REPIN-WOJNA-2 R3 - `planned-march.ts` @ dc8a3adc: `generalTargetId` w `PlannedMarchDest`
//! oraz zapis/odczyt `plannedMarches` (web `planned-march.ts:446-490`).
//! Wektory: `tests/p6_repin_wojna_2_r3_vectors/planned-march-general.json`, wygenerowane z
//! URUCHOMIONEGO kodu weba dc8a3adc (generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/`).

#[path = "p6_4_vectors/common.rs"]
mod common;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    planned_marches_from_save, planned_marches_to_save, AutoMarchSave, PlannedMarchDest,
    PlannedMarchSaved,
};
use common::{assert_same, load, num, opt_num, opt_string, units};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_2_r3_vectors/planned-march-general.json");

fn root() -> Value {
    load(VECTORS)
}

fn auto_march(value: &Value) -> Option<AutoMarchSave> {
    if value.is_null() {
        return None;
    }
    Some(AutoMarchSave {
        leader_id: opt_string(value.get("leaderId")),
        dest_q: opt_num(value.get("destQ")),
        dest_r: opt_num(value.get("destR")),
    })
}

fn saved_dest(value: &Value) -> Option<PlannedMarchSaved> {
    if value.is_null() {
        return None;
    }
    Some(PlannedMarchSaved {
        dest_q: opt_num(value.get("destQ")),
        dest_r: opt_num(value.get("destR")),
        attack_unit_id: opt_string(value.get("attackUnitId")),
        general_target_id: opt_string(value.get("generalTargetId")),
    })
}

fn dest_from(value: &Value) -> PlannedMarchDest {
    PlannedMarchDest {
        dest_q: num(&value["destQ"]),
        dest_r: num(&value["destR"]),
        attack_unit_id: opt_string(value.get("attackUnitId")),
        general_target_id: opt_string(value.get("generalTargetId")),
    }
}

fn planned_from_case(value: &Value) -> Option<Vec<(String, Option<PlannedMarchSaved>)>> {
    value.as_array().map(|entries| {
        entries
            .iter()
            .map(|entry| {
                (
                    entry[0].as_str().expect("uid").to_owned(),
                    saved_dest(&entry[1]),
                )
            })
            .collect()
    })
}

#[test]
fn planned_marches_from_save_with_general_target_matches_web() {
    let root = root();
    let cases = root["fromSave"].as_array().expect("fromSave");
    let (mut kept_general, mut stale_kept, mut total_entries) = (0usize, 0usize, 0usize);
    for case in cases {
        let saved = auto_march(&case["saved"]);
        let list = units(&case["units"]);
        let owner = case["owner"].as_i64().expect("owner");
        let planned = planned_from_case(&case["planned"]);
        let got = planned_marches_from_save(saved.as_ref(), planned.as_deref(), &list, owner);
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "fromSave dlugosc {case}");
        for ((uid, dest), want) in got.iter().zip(want) {
            assert_eq!(uid, want[0].as_str().expect("uid"), "{case}");
            assert_eq!(*dest, dest_from(&want[1]), "{case}");
            total_entries += 1;
            if dest.general_target_id.is_some() {
                kept_general += 1;
                let unit = list.iter().find(|u| &u.id == uid).expect("unit");
                if f64::from(unit.q) == dest.dest_q && f64::from(unit.r) == dest.dest_r {
                    stale_kept += 1;
                }
            }
        }
    }
    // pokrycie: wpisy z generalTargetId, w tym zachowane mimo zgodnej pozycji (web :455)
    assert!(total_entries > 500, "za malo wpisow: {total_entries}");
    assert!(
        kept_general > 300,
        "za malo wpisow z generalTargetId: {kept_general}"
    );
    assert!(
        stale_kept > 100,
        "za malo wpisow z zgodna pozycja: {stale_kept}"
    );
}

#[test]
fn planned_marches_to_save_with_general_target_matches_web() {
    let root = root();
    let cases = root["toSave"].as_array().expect("toSave");
    let (mut non_empty, mut with_general) = (0usize, 0usize);
    for case in cases {
        let marches: Vec<(String, PlannedMarchDest)> = case["marches"]
            .as_array()
            .expect("marches")
            .iter()
            .map(|entry| {
                (
                    entry[0].as_str().expect("uid").to_owned(),
                    dest_from(&entry[1]),
                )
            })
            .collect();
        let got = planned_marches_to_save(&marches);
        let out = &case["out"];
        match (&got.auto_march, out.get("autoMarch")) {
            (None, None) => {}
            (Some((leader, dest_q, dest_r)), Some(want)) => {
                assert_eq!(leader, want["leaderId"].as_str().expect("leader"));
                assert_same("destQ", *dest_q, num(&want["destQ"]));
                assert_same("destR", *dest_r, num(&want["destR"]));
            }
            _ => panic!("autoMarch rozbieznosc {case}"),
        }
        match (&got.planned_marches, out.get("plannedMarches")) {
            (None, None) => {}
            (Some(entries), Some(want)) => {
                non_empty += 1;
                let want = want.as_object().expect("plannedMarches");
                assert_eq!(entries.len(), want.len(), "{case}");
                for (uid, dest) in entries {
                    assert_eq!(*dest, dest_from(&want[uid]), "{case}");
                    assert_eq!(
                        want[uid].get("generalTargetId").is_some(),
                        dest.general_target_id.is_some(),
                        "{case}"
                    );
                    if dest.general_target_id.is_some() {
                        with_general += 1;
                    }
                }
            }
            _ => panic!("plannedMarches rozbieznosc {case}"),
        }
    }
    assert!(non_empty > 150, "za malo niepustych zapisow: {non_empty}");
    assert!(
        with_general > 100,
        "za malo zapisow z generalTargetId: {with_general}"
    );
}

/// Jawne przypadki brzegowe (zgodne z kodem weba `planned-march.ts:455`, `:460-462`, `:481-485`).
#[test]
fn general_target_edge_cases_are_explicit() {
    let list = {
        units(&serde_json::json!([
            {"id": "L", "ownerId": 0, "category": "piechota", "q": 2, "r": 2},
            {"id": "F", "ownerId": 0, "category": "piechota", "q": 0, "r": 0}
        ]))
    };
    let at_own_pos = |gen: Option<&str>| {
        let mut d = serde_json::json!({"destQ": 0, "destR": 0});
        if let Some(g) = gen {
            d["generalTargetId"] = Value::String(g.to_owned());
        }
        Some(vec![
            ("F".to_owned(), saved_dest(&d)),
            ("L".to_owned(), None),
        ])
    };
    // zgodna pozycja (cel = wlasna pozycja F = (0,0)) + niepusty generalTargetId -> zachowany
    let kept = planned_marches_from_save(None, at_own_pos(Some("L")).as_deref(), &list, 0);
    assert_eq!(kept.len(), 1);
    assert_eq!(kept[0].0, "F");
    assert_eq!(kept[0].1.general_target_id.as_deref(), Some("L"));
    // zgodna pozycja + pusty napis -> odrzucony (jak bez pola)
    assert!(planned_marches_from_save(None, at_own_pos(Some("")).as_deref(), &list, 0).is_empty());
    // zgodna pozycja + brak pola -> odrzucony
    assert!(planned_marches_from_save(None, at_own_pos(None).as_deref(), &list, 0).is_empty());
    // pusty generalTargetId nie trafia do wyniku nawet gdy wpis jest inny
    let other = serde_json::json!({"destQ": 1, "destR": 1, "generalTargetId": ""});
    let planned = Some(vec![("F".to_owned(), saved_dest(&other))]);
    let got = planned_marches_from_save(None, planned.as_deref(), &list, 0);
    assert_eq!(got.len(), 1);
    assert_eq!(got[0].1.general_target_id, None);
    // zapis: pusty napis pomijany, niepusty zachowany
    let marches = vec![
        (
            "F".to_owned(),
            PlannedMarchDest {
                dest_q: 2.0,
                dest_r: 2.0,
                attack_unit_id: None,
                general_target_id: Some("L".to_owned()),
            },
        ),
        (
            "L".to_owned(),
            PlannedMarchDest {
                dest_q: 2.0,
                dest_r: 2.0,
                attack_unit_id: None,
                general_target_id: Some(String::new()),
            },
        ),
    ];
    let saved = planned_marches_to_save(&marches);
    let entries = saved.planned_marches.expect("plannedMarches");
    assert_eq!(entries[0].1.general_target_id.as_deref(), Some("L"));
    assert_eq!(entries[1].1.general_target_id, None);
}
