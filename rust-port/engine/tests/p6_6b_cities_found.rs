//! P6.6B - `game/cities.ts`: zakladanie miast (`canFoundCity`, `foundCity`, `foundCityAt`,
//! `foundCityFromVillage`, `cityName`, predykaty limitu i proweniencji). Wektory z URUCHOMIONEGO weba
//! (pin edb8fb56); mapy to heksy `"q,r"` z terenem, domkniecie `withinTerritory` zapisuje wywolania.

#[path = "p6_6b_vectors/common.rs"]
mod common;

use std::cell::RefCell;
use std::collections::HashSet;

use civ_engine::domain::pathfinding::ruch_jednostek::RuchMapa;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    can_found_city, city_name, counts_toward_city_founding_limit, found_city, found_city_at,
    found_city_from_village, was_independent_city_state_before_capture, CanFoundCityOpts, City,
    FoundFromVillageResult, GameConfig, Settler,
};
use common::*;
use serde_json::Value;

fn maps(d: &Value) -> Vec<RuchMapa> {
    d["found"]["maps"]
        .as_array()
        .expect("maps")
        .iter()
        .map(ruch_map)
        .collect()
}

fn found_cities(v: &Value) -> Vec<City> {
    v.as_array()
        .expect("cities")
        .iter()
        .map(|c| City {
            id: text(&c["id"]),
            owner_id: c["ownerId"].as_i64().expect("owner"),
            q: num(&c["q"]),
            r: num(&c["r"]),
            start_city_state: opt_bool(&c["startCityState"]),
            founded_by_owner: opt_bool(&c["foundedByOwner"]),
            ..City::default()
        })
        .collect()
}

fn territory(v: &Value) -> Option<HashSet<String>> {
    (!v.is_null()).then(|| strings(v).into_iter().collect())
}

fn key(q: f64, r: f64) -> String {
    format!(
        "{},{}",
        civ_engine::domain::recruitment::manpower::js_number_to_string(q),
        civ_engine::domain::recruitment::manpower::js_number_to_string(r)
    )
}

fn check_calls(label: &str, got: &[(f64, f64)], want: &Value) {
    let want = want.as_array().expect("territoryCalls");
    assert_eq!(
        got.len(),
        want.len(),
        "{label}: liczba wywolan withinTerritory"
    );
    for (g, w) in got.iter().zip(want) {
        assert_bits(&format!("{label}.q"), g.0, num(&w[0]));
        assert_bits(&format!("{label}.r"), g.1, num(&w[1]));
    }
}

#[test]
fn can_found_city_matches_web() {
    let d = load("cities.json");
    let maps = maps(&d);
    let rows = arr(&d["found"], "can");
    assert!(rows.len() >= 1200, "{}", rows.len());
    let (mut oks, mut reasons) = (0, HashSet::new());
    for (i, row) in rows.iter().enumerate() {
        let map = &maps[row["mapIdx"].as_u64().expect("idx") as usize];
        let cities = found_cities(&row["cities"]);
        let (q, r) = (num(&row["q"]), num(&row["r"]));
        let calls: RefCell<Vec<(f64, f64)>> = RefCell::new(Vec::new());
        let o = &row["opts"];
        let allowed = if o.is_null() {
            None
        } else {
            territory(&o["territory"])
        };
        let within = |qq: f64, rr: f64| -> bool {
            calls.borrow_mut().push((qq, rr));
            allowed.as_ref().is_some_and(|s| s.contains(&key(qq, rr)))
        };
        let opts = (!o.is_null()).then(|| CanFoundCityOpts {
            within_territory: allowed
                .as_ref()
                .map(|_| &within as &dyn Fn(f64, f64) -> bool),
            founding_city_state: opt_bool(&o["foundingCityState"]),
            cluster_start_slot: opt_bool(&o["clusterStartSlot"]),
            owner_id: o["ownerId"].as_i64(),
            owner_era: js_num(&o["ownerEra"]),
            game_config: o.get("gameConfig").map(|g| GameConfig {
                city_limit_base: js_num(&g["cityLimitBase"]),
            }),
        });
        let got = can_found_city(q, r, &cities, map, opts.as_ref());
        let want = &row["out"];
        assert_eq!(got.ok, want["ok"].as_bool().expect("ok"), "can[{i}] ok");
        assert_eq!(got.reason, text(&want["reason"]), "can[{i}] reason");
        check_calls(
            &format!("can[{i}]"),
            &calls.borrow(),
            &row["territoryCalls"],
        );
        if got.ok {
            oks += 1;
        } else {
            reasons.insert(got.reason.clone());
        }
    }
    assert!(oks >= 50, "poprawne zalozenia: {oks}");
    assert_eq!(reasons.len(), 6, "wszystkie powody odmowy: {reasons:?}");
}

#[test]
fn found_city_matches_web() {
    let d = load("cities.json");
    let maps = maps(&d);
    let rows = arr(&d["found"], "foundCity");
    assert!(rows.len() >= 400);
    let (mut some, mut none) = (0, 0);
    for (i, row) in rows.iter().enumerate() {
        let map = &maps[row["mapIdx"].as_u64().expect("idx") as usize];
        let cities = found_cities(&row["cities"]);
        let s = &row["settler"];
        let settler = Settler {
            owner_id: s["ownerId"].as_i64().expect("owner"),
            q: num(&s["q"]),
            r: num(&s["r"]),
        };
        let calls: RefCell<Vec<(f64, f64)>> = RefCell::new(Vec::new());
        let allowed = territory(&row["territory"]);
        let within = |qq: f64, rr: f64| -> bool {
            calls.borrow_mut().push((qq, rr));
            allowed.as_ref().is_some_and(|s| s.contains(&key(qq, rr)))
        };
        let within_ref: Option<&dyn Fn(f64, f64) -> bool> = allowed
            .as_ref()
            .map(|_| &within as &dyn Fn(f64, f64) -> bool);
        let got = found_city(&settler, &cities, map, &text(&row["name"]), within_ref);
        check_calls(
            &format!("foundCity[{i}]"),
            &calls.borrow(),
            &row["territoryCalls"],
        );
        match (&got, row["out"].is_null()) {
            (None, true) => none += 1,
            (Some(c), false) => {
                some += 1;
                assert_values(&format!("foundCity[{i}]"), &city_value(c), &row["out"]);
            }
            other => panic!("foundCity[{i}]: {other:?}"),
        }
    }
    assert!(some >= 40 && none >= 40, "some={some} none={none}");
}

#[test]
fn found_city_at_matches_web() {
    let d = load("cities.json");
    let maps = maps(&d);
    let rows = arr(&d["found"], "foundCityAt");
    assert!(rows.len() >= 400);
    let (mut some, mut none, mut city_states) = (0, 0, 0);
    for (i, row) in rows.iter().enumerate() {
        let map = &maps[row["mapIdx"].as_u64().expect("idx") as usize];
        let cities = found_cities(&row["cities"]);
        let got = found_city_at(
            num(&row["q"]),
            num(&row["r"]),
            row["ownerId"].as_i64().expect("owner"),
            &cities,
            map,
            &text(&row["name"]),
            row["foundingCityState"].as_bool().expect("fcs"),
            row["clusterStartSlot"].as_bool().expect("slot"),
        );
        match (&got, row["out"].is_null()) {
            (None, true) => none += 1,
            (Some(c), false) => {
                some += 1;
                if c.start_city_state == Some(true) {
                    city_states += 1;
                }
                assert_values(&format!("foundCityAt[{i}]"), &city_value(c), &row["out"]);
            }
            other => panic!("foundCityAt[{i}]: {other:?}"),
        }
    }
    assert!(
        some >= 40 && none >= 40 && city_states >= 5,
        "{some}/{none}/{city_states}"
    );
}

#[test]
fn found_city_from_village_matches_web() {
    let d = load("cities.json");
    let maps = maps(&d);
    let rows = arr(&d["found"], "fromVillage");
    assert!(rows.len() >= 400);
    let (mut oks, mut errs) = (0, 0);
    for (i, row) in rows.iter().enumerate() {
        let map = &maps[row["mapIdx"].as_u64().expect("idx") as usize];
        let cities = found_cities(&row["cities"]);
        let calls: RefCell<Vec<(f64, f64)>> = RefCell::new(Vec::new());
        let allowed = territory(&row["territory"]);
        let within = |qq: f64, rr: f64| -> bool {
            calls.borrow_mut().push((qq, rr));
            allowed.as_ref().is_some_and(|s| s.contains(&key(qq, rr)))
        };
        let within_ref: Option<&dyn Fn(f64, f64) -> bool> = allowed
            .as_ref()
            .map(|_| &within as &dyn Fn(f64, f64) -> bool);
        let got = found_city_from_village(num(&row["q"]), num(&row["r"]), &cities, map, within_ref);
        check_calls(
            &format!("village[{i}]"),
            &calls.borrow(),
            &row["territoryCalls"],
        );
        let want = &row["out"];
        match got {
            FoundFromVillageResult::Ok(city) => {
                oks += 1;
                assert_eq!(want["ok"], Value::Bool(true), "village[{i}]");
                assert_values(&format!("village[{i}]"), &city_value(&city), &want["city"]);
            }
            FoundFromVillageResult::Err { reason } => {
                errs += 1;
                assert_eq!(want["ok"], Value::Bool(false), "village[{i}]");
                assert_eq!(reason, text(&want["reason"]), "village[{i}] reason");
            }
        }
    }
    assert!(oks >= 20 && errs >= 100, "ok={oks} err={errs}");
}

#[test]
fn city_name_and_predicates_match_web() {
    let d = load("cities.json");
    let f = &d["found"];
    let rows = arr(f, "cityName");
    assert!(rows.len() >= 15);
    for (i, row) in rows.iter().enumerate() {
        assert_eq!(
            city_name(num(&row["index"])),
            opt_text(&row["out"]),
            "cityName[{i}]"
        );
    }
    for (i, row) in arr(f, "counts").iter().enumerate() {
        assert_eq!(
            counts_toward_city_founding_limit(opt_bool(&row["f"])),
            row["out"].as_bool().expect("out"),
            "counts[{i}]"
        );
    }
    for (i, row) in arr(f, "independent").iter().enumerate() {
        assert_eq!(
            was_independent_city_state_before_capture(opt_bool(&row["f"])),
            row["out"].as_bool().expect("out"),
            "independent[{i}]"
        );
    }
}
