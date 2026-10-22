//! P6.4 - `rally-point.ts` z wektorami z URUCHOMIONEGO weba (`tests/p6_4_vectors/rally.json`).

#[path = "p6_4_vectors/common.rs"]
mod common;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    clear_rally_point, js_number_from_str, rally_launch_leader_ids, rally_points_from_save,
    rally_points_to_save, set_rally_point, RallyPoint, RallyPoints, RawRallyPoint,
};
use common::{assert_same, cases, load, num, opt_num, units};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_4_vectors/rally.json");

fn root() -> Value {
    load(VECTORS)
}

fn assert_state(label: &str, got: &RallyPoints, want: &Value) {
    let want = want.as_array().expect("stan");
    assert_eq!(got.len(), want.len(), "{label} liczba punktow");
    for (index, (owner, point)) in got.iter().enumerate() {
        assert_eq!(owner, want[index][0].as_i64().expect("owner"), "{label}");
        assert_same(label, point.q, num(&want[index][1]["q"]));
        assert_same(label, point.r, num(&want[index][1]["r"]));
    }
}

#[test]
fn set_clear_and_save_sequences_match_web() {
    let root = root();
    let (mut saved, mut absent) = (0, 0);
    for case in cases(&root, "sequences") {
        let mut points = RallyPoints::new();
        for op in case["ops"].as_array().expect("ops") {
            let owner = num(&op["owner"]);
            if op["op"] == "clear" {
                // `Map.delete` z nieliczba calkowita nic nie usuwa
                if owner.fract() == 0.0 && owner.is_finite() {
                    clear_rally_point(&mut points, owner as i64);
                }
            } else {
                set_rally_point(
                    &mut points,
                    owner,
                    RallyPoint {
                        q: num(&op["q"]),
                        r: num(&op["r"]),
                    },
                );
            }
        }
        assert_state(&format!("stan {case}"), &points, &case["state"]);
        match (rally_points_to_save(&points), case["toSave"].as_object()) {
            (None, None) => absent += 1,
            (Some(got), Some(want)) => {
                saved += 1;
                assert_eq!(got.len(), want.len(), "{case}");
                for (owner, point) in &got {
                    assert_same("q", point.q, num(&want[owner]["q"]));
                    assert_same("r", point.r, num(&want[owner]["r"]));
                }
            }
            (got, want) => panic!("rallyPointsToSave: Rust {got:?} vs web {want:?}"),
        }
    }
    assert!(
        saved > 20 && absent > 3,
        "wektory musza obejmowac oba wyniki"
    );
}

#[test]
fn launch_leaders_one_per_stack_match_web() {
    let root = root();
    let mut multi = 0;
    for case in cases(&root, "leaders") {
        let got = rally_launch_leader_ids(
            &units(&case["units"]),
            case["owner"].as_i64().expect("owner"),
        );
        let want: Vec<String> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|id| id.as_str().expect("id").to_owned())
            .collect();
        assert_eq!(got, want, "rallyLaunchLeaderIds {case}");
        if got.len() > 1 {
            multi += 1;
        }
    }
    assert!(multi > 3);
}

fn raw_point(value: &Value) -> Option<RawRallyPoint> {
    match value {
        Value::Object(_) => Some(RawRallyPoint {
            q: opt_num(value.get("q")),
            r: opt_num(value.get("r")),
        }),
        Value::Array(_) => Some(RawRallyPoint { q: None, r: None }),
        _ => None,
    }
}

#[test]
fn load_from_save_and_number_parsing_match_web() {
    let root = root();
    let mut kept = 0;
    for case in cases(&root, "fromSave") {
        let saved: Vec<(String, Option<RawRallyPoint>)> = case["entries"]
            .as_array()
            .expect("entries")
            .iter()
            .map(|entry| {
                (
                    entry[0].as_str().expect("key").to_owned(),
                    raw_point(&entry[1]),
                )
            })
            .collect();
        let null_input = case["isNull"].as_bool() == Some(true);
        let not_object = case.get("notObject").is_some();
        let got = rally_points_from_save(if null_input || not_object {
            None
        } else {
            Some(&saved)
        });
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "rallyPointsFromSave {case}");
        for (index, (owner, point)) in got.iter().enumerate() {
            assert_eq!(owner, want[index][0].as_i64().expect("owner"), "{case}");
            assert_same("q", point.q, num(&want[index][1]["q"]));
            assert_same("r", point.r, num(&want[index][1]["r"]));
            kept += 1;
        }
    }
    assert!(kept > 30);

    for case in cases(&root, "numberQuirks") {
        let key = case["key"].as_str().expect("key");
        assert_same(
            &format!("Number({key:?})"),
            js_number_from_str(key),
            num(&case["number"]),
        );
        let got = rally_points_from_save(Some(&vec![(
            key.to_owned(),
            Some(RawRallyPoint {
                q: Some(4.0),
                r: Some(5.0),
            }),
        )]));
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "klucz {key:?}");
    }

    for case in cases(&root, "toSave") {
        // `Map` zbudowany bezposrednio (z pominieciem `setRallyPoint`): dopuszcza q/r nieskonczone
        let points =
            RallyPoints::from_entries(case["points"].as_array().expect("points").iter().map(
                |entry| {
                    (
                        entry[0].as_i64().expect("owner"),
                        RallyPoint {
                            q: num(&entry[1]["q"]),
                            r: num(&entry[1]["r"]),
                        },
                    )
                },
            ));
        match (rally_points_to_save(&points), case["out"].as_object()) {
            (None, None) => {}
            (Some(got), Some(want)) => {
                assert_eq!(got.len(), want.len(), "{case}");
                for (owner, point) in &got {
                    assert_same("q", point.q, num(&want[owner]["q"]));
                    assert_same("r", point.r, num(&want[owner]["r"]));
                }
            }
            (got, want) => panic!("rallyPointsToSave: Rust {got:?} vs web {want:?}"),
        }
    }
}
