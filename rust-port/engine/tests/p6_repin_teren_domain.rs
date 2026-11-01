//! REPIN-TERYTORIUM-FORTY (R-RUSTPORT-REPIN-TERYTORIUM-FORTY-Q1): wektory z URUCHOMIONEGO weba (pin 4bbef081d),
//! generator `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-TERYTORIUM-FORTY-Q1/gen-repin-teren-vectors.mjs`.
//! Pokrycie: `cityTerritoryRadius` (promienie 5/3 + brzegi N-1/N/N+1), `territoryOwnerAt` (miasto przed
//! fortem, wczesniejszy fort wygrywa, remisy `turn`/`seq`), `fortTerritoryNodes`, `isHexInForeignFortTerritory`,
//! `nextFortSeq`/`backfillFortOrder`, `applyFortCaptureByOccupation`.

use std::collections::BTreeSet;

use civ_engine::domain::fort_territory::{
    apply_fort_capture_by_occupation, backfill_fort_order, fort_territory_nodes,
    is_hex_in_foreign_fort_territory, next_fort_seq, FortCaptureUnit, OrderedFortNode,
};
use civ_engine::domain::terrain::{city_territory_radius, CityNode, FortImprovementType, FortNode};
use civ_engine::domain::territory::{territory_owner_at, TerritoryNode, TerritoryOrder};
use serde_json::Value;

const VEC: &str = include_str!("p6_repin_teren_vectors/teren.json");

fn fixture() -> Value {
    let v: Value = serde_json::from_str(VEC).unwrap();
    assert_eq!(v["pin"].as_str(), Some("4bbef081d"));
    v
}

fn i(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| panic!("nie calkowita: {v}"))
}

fn city_node(v: &Value) -> CityNode {
    CityNode {
        q: i(&v["q"]) as i32,
        r: i(&v["r"]) as i32,
        is_outpost: v["isOutpost"].as_bool(),
        is_fort: v["isFort"].as_bool(),
        pop: v["pop"].as_f64().unwrap(),
        level: v["level"].as_f64().unwrap(),
        civ: None,
    }
}

fn order_of(v: &Value) -> Option<TerritoryOrder> {
    if v.is_null() {
        None
    } else {
        Some(TerritoryOrder {
            turn: i(&v["turn"]),
            seq: i(&v["seq"]),
        })
    }
}

fn t_node(v: &Value) -> TerritoryNode {
    TerritoryNode::with_order(city_node(v), i(&v["ownerId"]), order_of(&v["order"]))
}

fn t_nodes(v: &Value) -> Vec<TerritoryNode> {
    v.as_array().unwrap().iter().map(t_node).collect()
}

fn kind(v: &Value) -> FortImprovementType {
    FortImprovementType::from_web_value(v.as_str().unwrap()).unwrap()
}

fn ordered_fort(v: &Value) -> OrderedFortNode {
    OrderedFortNode::new(
        FortNode {
            q: i(&v["q"]) as i32,
            r: i(&v["r"]) as i32,
            owner_id: i(&v["ownerId"]),
            kind: kind(&v["type"]),
            contested_useless: v["contestedUseless"].as_bool(),
        },
        v["builtAtTurn"].as_i64(),
        v["seq"].as_i64(),
    )
}

fn forts(v: &Value) -> Vec<OrderedFortNode> {
    v.as_array().unwrap().iter().map(ordered_fort).collect()
}

fn owner(v: &Value) -> Option<i64> {
    if v.is_null() {
        None
    } else {
        Some(i(v))
    }
}

#[test]
fn radii_and_boundaries_match_web() {
    let d = fixture();
    let mut checked = 0;
    for c in d["radiusCases"].as_array().unwrap() {
        let node = city_node(&c["node"]);
        let want_r = c["radius"].as_f64().unwrap();
        assert_eq!(city_territory_radius(&node), want_r, "{}", c["node"]);
        let tn = TerritoryNode::new(node, i(&c["ownerId"]));
        for e in c["edge"].as_array().unwrap() {
            let (q, r) = (i(&e["q"]) as i32, i(&e["r"]) as i32);
            assert_eq!(
                territory_owner_at(q, r, std::slice::from_ref(&tn)),
                owner(&e["owner"]),
                "{} ({q},{r}) d={}",
                c["node"],
                e["d"]
            );
            checked += 1;
        }
    }
    assert!(checked >= 200, "{checked}");
    // Stale promienie 10/5 zastapione (decyzja wlasciciela 2026-10-31): fort 5, posterunek 3.
    let probe = |fort: bool| CityNode {
        q: 0,
        r: 0,
        is_outpost: Some(!fort),
        is_fort: Some(fort),
        pop: 0.0,
        level: 1.0,
        civ: None,
    };
    assert_eq!(city_territory_radius(&probe(true)), 5.0);
    assert_eq!(city_territory_radius(&probe(false)), 3.0);
}

#[test]
fn territory_owner_at_matches_web() {
    let d = fixture();
    let mut n = 0;
    let mut some = 0;
    for c in d["ownerCases"].as_array().unwrap() {
        let nodes = t_nodes(&c["nodes"]);
        for q in c["queries"].as_array().unwrap() {
            let (x, y) = (i(&q["q"]) as i32, i(&q["r"]) as i32);
            let want = owner(&q["owner"]);
            assert_eq!(
                territory_owner_at(x, y, &nodes),
                want,
                "nodes={} q=({x},{y})",
                c["nodes"]
            );
            n += 1;
            some += usize::from(want.is_some());
        }
    }
    assert!(n >= 20_000, "{n}");
    assert!(some >= 8_000, "{some}");
}

#[test]
fn fort_territory_nodes_match_web() {
    let d = fixture();
    let mut total = 0;
    for c in d["ftnCases"].as_array().unwrap() {
        let got = fort_territory_nodes(&forts(&c["forts"]));
        let want = t_nodes(&c["nodes"]);
        assert_eq!(got, want, "{}", c["forts"]);
        total += got.len();
    }
    assert!(total >= 300, "{total}");
}

#[test]
fn foreign_fort_territory_matches_web() {
    let d = fixture();
    let (mut n, mut yes) = (0, 0);
    for c in d["foreignCases"].as_array().unwrap() {
        let fs = forts(&c["forts"]);
        let mut all = t_nodes(&c["cities"]);
        all.extend(fort_territory_nodes(&fs));
        for q in c["queries"].as_array().unwrap() {
            let got = is_hex_in_foreign_fort_territory(
                i(&q["q"]) as i32,
                i(&q["r"]) as i32,
                i(&q["ownerId"]),
                &fs,
                &all,
            );
            assert_eq!(
                got,
                q["result"].as_bool().unwrap(),
                "{q} forts={}",
                c["forts"]
            );
            n += 1;
            yes += usize::from(got);
        }
    }
    assert!(n >= 6_000 && yes >= 1_500, "{n} {yes}");
}

#[test]
fn next_seq_and_backfill_match_web() {
    let d = fixture();
    let mut filled_total = 0;
    for c in d["seqCases"].as_array().unwrap() {
        let mut fs = forts(&c["forts"]);
        assert_eq!(next_fort_seq(&fs), i(&c["next"]), "{}", c["forts"]);
        let filled = backfill_fort_order(&mut fs);
        assert_eq!(filled as i64, i(&c["filled"]), "{}", c["forts"]);
        assert_eq!(fs, forts(&c["after"]), "{}", c["forts"]);
        filled_total += filled;
    }
    assert!(filled_total >= 150, "{filled_total}");
}

#[test]
fn capture_by_occupation_matches_web() {
    let d = fixture();
    let mut events_total = 0;
    for c in d["captureCases"].as_array().unwrap() {
        let mut fs = forts(&c["forts"]);
        let units: Vec<FortCaptureUnit> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| FortCaptureUnit {
                owner_id: i(&u["ownerId"]),
                q: i(&u["q"]) as i32,
                r: i(&u["r"]) as i32,
                military: u["military"].as_bool().unwrap(),
            })
            .collect();
        let war: BTreeSet<String> = c["war"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_owned())
            .collect();
        let barb = i(&c["barbarian"]);
        let self_enemy = c["selfEnemy"].as_bool().unwrap();
        let is_enemy = |a: i64, b: i64| {
            if a == b {
                self_enemy
            } else {
                war.contains(&format!("{},{}", a.min(b), a.max(b)))
            }
        };
        let events = apply_fort_capture_by_occupation(&mut fs, &units, &is_enemy, &|o| o == barb);
        let want = c["events"].as_array().unwrap();
        assert_eq!(events.len(), want.len(), "{c}");
        for (g, w) in events.iter().zip(want) {
            assert_eq!(
                (
                    g.q as i64,
                    g.r as i64,
                    g.kind,
                    g.prev_owner_id,
                    g.new_owner_id
                ),
                (
                    i(&w["q"]),
                    i(&w["r"]),
                    kind(&w["type"]),
                    i(&w["prevOwnerId"]),
                    i(&w["newOwnerId"])
                ),
                "{c}"
            );
        }
        assert_eq!(fs, forts(&c["after"]), "{c}");
        events_total += events.len();
    }
    assert!(events_total >= 100, "{events_total}");
}
