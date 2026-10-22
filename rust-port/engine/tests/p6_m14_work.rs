//! P6.M14 - `map/territory-work.ts` (1-166): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Oczekiwania wylacznie z `tests/p6_m14_vectors/work.json`.

#[path = "p6_m14_vectors/common.rs"]
mod common;

use civ_engine::domain::territory::{
    build_territory_nodes_from_cities, city_center_keys, is_reczne_key_legal,
    is_territory_hex_owned_by, make_territory_workable_filter, reconcile_all_worked_tiles,
    reconcile_worked_tiles_for_owner, TerritoryNode,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("work.json")
}

#[test]
fn build_territory_nodes_matches_web() {
    let d = data();
    for (i, c) in arr(&d, "build").iter().enumerate() {
        let got = build_territory_nodes_from_cities(&work_cities(&c["cities"]));
        let want = territory_nodes(&c["out"]);
        assert_eq!(got.len(), want.len(), "build[{i}] dlugosc");
        for (j, (g, w)) in got.iter().zip(want.iter()).enumerate() {
            assert_eq!(g.owner_id, w.owner_id, "build[{i}][{j}] owner");
            assert_eq!(
                (g.node.q, g.node.r),
                (w.node.q, w.node.r),
                "build[{i}][{j}] q,r"
            );
            assert_bits(&format!("build[{i}][{j}] pop"), g.node.pop, w.node.pop);
            assert_bits(
                &format!("build[{i}][{j}] level"),
                g.node.level,
                w.node.level,
            );
            assert_eq!(g.node.is_fort, None);
            assert_eq!(g.node.is_outpost, None);
        }
    }
}

#[test]
fn is_territory_hex_owned_by_matches_web() {
    let d = data();
    let (mut yes, mut no) = (0, 0);
    for (i, c) in arr(&d, "owned_by").iter().enumerate() {
        let nodes = territory_nodes(&c["nodes"]);
        let got = is_territory_hex_owned_by(
            num(&c["q"]),
            num(&c["r"]),
            c["ownerId"].as_i64().unwrap(),
            &nodes,
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "owned_by[{i}]");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 0 && no > 0);
}

#[test]
fn workable_filter_matches_web() {
    let d = data();
    let mut with_base = 0;
    for (i, c) in arr(&d, "filter").iter().enumerate() {
        let nodes = territory_nodes(&c["nodes"]);
        let owner = c["ownerId"].as_i64().unwrap();
        let blocked: Option<Vec<(i32, i32)>> = c["blocked"]
            .as_array()
            .map(|a| a.iter().map(|p| (int(&p[0]), int(&p[1]))).collect());
        let base_fn = |q: i32, r: i32| {
            !blocked
                .as_ref()
                .unwrap()
                .iter()
                .any(|b| b.0 == q && b.1 == r)
        };
        let base: Option<&dyn Fn(i32, i32) -> bool> = if blocked.is_some() {
            with_base += 1;
            Some(&base_fn)
        } else {
            None
        };
        let f = make_territory_workable_filter(&nodes, owner, base);
        let want = arr(c, "out");
        for (k, p) in arr(c, "queries").iter().enumerate() {
            assert_eq!(
                f(int(&p[0]), int(&p[1])),
                want[k].as_bool().unwrap(),
                "filter[{i}] zapytanie {k}"
            );
        }
    }
    assert!(with_base > 0);
}

#[test]
fn city_center_keys_match_web() {
    let d = data();
    for (i, c) in arr(&d, "center_keys").iter().enumerate() {
        let got: Vec<String> = city_center_keys(&work_cities(&c["cities"]))
            .into_iter()
            .collect();
        // Web: `[...set].sort()` (porzadek UTF-16); klucze ASCII -> porzadek bajtowy jest tozsamy po sortowaniu.
        let mut want = strings(&c["out"]);
        want.sort();
        assert_eq!(got, want, "center_keys[{i}]");
    }
}

#[test]
fn reczne_key_legal_matches_web() {
    let d = data();
    let (mut yes, mut no) = (0, 0);
    for (i, c) in arr(&d, "reczne_legal").iter().enumerate() {
        let nodes: Vec<TerritoryNode> = territory_nodes(&c["nodes"]);
        let centers = string_set(&c["centers"]);
        let lost = c["lost"].as_array().map(|_| string_set(&c["lost"]));
        let got = is_reczne_key_legal(
            c["key"].as_str().unwrap(),
            c["ownerId"].as_i64().unwrap(),
            &centers,
            &nodes,
            lost.as_ref(),
        );
        assert_eq!(
            got,
            c["out"].as_bool().unwrap(),
            "reczne_legal[{i}] klucz {:?}",
            c["key"]
        );
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 100 && no > 100);
}

#[test]
fn reconcile_for_owner_matches_web() {
    let d = data();
    let mut changed_count = 0;
    for (i, c) in arr(&d, "reconcile_owner").iter().enumerate() {
        let mut cities = work_cities(&c["cities"]);
        let nodes = territory_nodes(&c["nodes"]);
        let lost = lost_map(&c["lost"]);
        let changed = reconcile_worked_tiles_for_owner(
            &mut cities,
            &nodes,
            c["ownerId"].as_i64().unwrap(),
            lost.as_ref(),
        );
        assert_eq!(
            changed,
            c["changed"].as_bool().unwrap(),
            "reconcile_owner[{i}] changed"
        );
        assert_eq!(
            cities,
            work_cities(&c["after"]),
            "reconcile_owner[{i}] stan po"
        );
        changed_count += usize::from(changed);
    }
    assert!(changed_count > 10);
}

#[test]
fn reconcile_all_matches_web() {
    let d = data();
    for (i, c) in arr(&d, "reconcile_all").iter().enumerate() {
        let mut cities = work_cities(&c["cities"]);
        let nodes = territory_nodes(&c["nodes"]);
        let lost = lost_map(&c["lost"]);
        reconcile_all_worked_tiles(&mut cities, &nodes, lost.as_ref());
        assert_eq!(cities, work_cities(&c["after"]), "reconcile_all[{i}]");
    }
}

#[test]
fn reconcile_without_reczne_is_noop() {
    // Test ksztaltu: miasto bez `okolicaReczne` nie jest zmieniane, wynik `false`.
    use civ_engine::domain::territory::WorkCity;
    let mut cities = vec![WorkCity {
        id: "a".into(),
        owner_id: 0,
        q: 0,
        r: 0,
        population: 3.0,
        okolica_reczne: None,
    }];
    let nodes = build_territory_nodes_from_cities(&cities);
    assert!(!reconcile_worked_tiles_for_owner(
        &mut cities,
        &nodes,
        0,
        None
    ));
    assert_eq!(cities[0].okolica_reczne, None);
}
