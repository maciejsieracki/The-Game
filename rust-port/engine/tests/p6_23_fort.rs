//! P6.3 - `fort-territory.ts` (+ zaleznosci `map/territory.ts`: `axialDistance`,
//! `cityTerritoryRadius`; `game/okolica.ts`: `cityRangeForPopulation`) z wektorami z URUCHOMIONEGO
//! weba (`tests/p6_23_vectors/fort.json`, generator `gen-p623-vectors.mjs`).

#[path = "p6_23_vectors/common.rs"]
mod common;

use std::collections::BTreeSet;

use civ_engine::data::derived::teren_ruch_reguly;
use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::terrain::{
    apply_fort_takeover_on_city_founded, axial_distance, city_range_for_population,
    city_territory_radius, find_evacuation_hex_outside_city, fort_node_as_city_node,
    founding_nodes_for_owner, is_hex_reserved_by_rival_fort, CityNode, FortImprovementType,
    FortNode, NewCityFoundingInfo,
};
use common::{assert_same, cases, num, opt_num, opt_str};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_23_vectors/fort.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("fort.json parse")
}

fn int(value: &Value) -> i32 {
    i32::try_from(value.as_i64().expect("liczba calkowita")).expect("i32")
}

fn kind(value: &Value) -> FortImprovementType {
    FortImprovementType::from_web_value(value.as_str().expect("typ fortu")).expect("typ fortu")
}

fn fort(value: &Value) -> FortNode {
    FortNode {
        q: int(&value["q"]),
        r: int(&value["r"]),
        owner_id: value["ownerId"].as_i64().expect("ownerId"),
        kind: kind(&value["type"]),
        contested_useless: value
            .get("contestedUseless")
            .map(|flag| flag.as_bool().expect("bool")),
    }
}

fn forts(value: &Value) -> Vec<FortNode> {
    value.as_array().expect("forts").iter().map(fort).collect()
}

fn node(value: &Value) -> CityNode {
    CityNode {
        q: int(&value["q"]),
        r: int(&value["r"]),
        is_outpost: value
            .get("isOutpost")
            .map(|flag| flag.as_bool().expect("bool")),
        is_fort: value
            .get("isFort")
            .map(|flag| flag.as_bool().expect("bool")),
        pop: num(&value["pop"]),
        level: num(&value["level"]),
        civ: opt_str(value.get("civ")).map(str::to_owned),
    }
}

fn assert_node(label: &str, got: &CityNode, want: &CityNode) {
    assert_eq!((got.q, got.r), (want.q, want.r), "{label}");
    assert_eq!(got.is_fort, want.is_fort, "{label} isFort");
    assert_eq!(got.is_outpost, want.is_outpost, "{label} isOutpost");
    assert_same(&format!("{label} pop"), got.pop, want.pop);
    assert_same(&format!("{label} level"), got.level, want.level);
    assert_eq!(got.civ, want.civ, "{label} civ");
}

#[test]
fn territory_dependencies_match_web() {
    let root = root();
    for case in cases(&root, "cityRangeForPopulation") {
        assert_same(
            &format!("cityRangeForPopulation {case}"),
            city_range_for_population(num(&case["pop"])),
            num(&case["out"]),
        );
    }
    for case in cases(&root, "cityTerritoryRadius") {
        assert_same(
            &format!("cityTerritoryRadius {case}"),
            city_territory_radius(&node(&case["node"])),
            num(&case["out"]),
        );
    }
    for case in cases(&root, "axialDistance") {
        let (a, b) = (&case["a"], &case["b"]);
        assert_same(
            &format!("axialDistance {case}"),
            axial_distance(int(&a[0]), int(&a[1]), int(&b[0]), int(&b[1])),
            num(&case["out"]),
        );
    }
}

#[test]
fn fort_node_conversion_and_reservation_match_web() {
    let root = root();
    for case in cases(&root, "fortNodeAsCityNode") {
        let source = &case["fort"];
        let got =
            fort_node_as_city_node(int(&source["q"]), int(&source["r"]), kind(&source["type"]));
        let want = &case["out"];
        assert_eq!((got.q, got.r), (int(&want["q"]), int(&want["r"])));
        assert_same("pop", got.pop, num(&want["pop"]));
        assert_same("level", got.level, num(&want["level"]));
        assert_eq!(got.is_fort, Some(want["isFort"].as_bool().expect("bool")));
        assert_eq!(
            got.is_outpost,
            Some(want["isOutpost"].as_bool().expect("bool"))
        );
        assert_eq!(got.civ, None);
    }
    let mut reserved = 0;
    for case in cases(&root, "isHexReservedByRivalFort") {
        let got = is_hex_reserved_by_rival_fort(
            int(&case["q"]),
            int(&case["r"]),
            case["builder"].as_i64().expect("builder"),
            &forts(&case["forts"]),
        );
        let want = case["out"].as_bool().expect("bool");
        assert_eq!(got, want, "isHexReservedByRivalFort {case}");
        reserved += usize::from(want);
    }
    assert!(
        reserved > 20,
        "wektory musza obejmowac rezerwacje ({reserved})"
    );
    for case in cases(&root, "foundingNodesForOwner") {
        let own: Vec<CityNode> = case["ownCityNodes"]
            .as_array()
            .expect("nodes")
            .iter()
            .map(node)
            .collect();
        let got = founding_nodes_for_owner(
            case["owner"].as_i64().expect("owner"),
            &own,
            &forts(&case["forts"]),
        );
        let want: Vec<CityNode> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(node)
            .collect();
        assert_eq!(got.len(), want.len(), "foundingNodesForOwner {case}");
        for (index, (g, w)) in got.iter().zip(&want).enumerate() {
            assert_node(&format!("foundingNodesForOwner[{index}]"), g, w);
        }
    }
}

#[test]
fn takeover_on_city_founded_matches_web() {
    let root = root();
    let (mut with_events, mut with_removal) = (0, 0);
    for case in cases(&root, "applyFortTakeoverOnCityFounded") {
        let city = &case["newCity"];
        let info = NewCityFoundingInfo {
            q: int(&city["q"]),
            r: int(&city["r"]),
            owner_id: city["ownerId"].as_i64().expect("ownerId"),
            population: num(&city["population"]),
        };
        let mut list = forts(&case["forts"]);
        let before = list.len();
        let events = apply_fort_takeover_on_city_founded(&info, &mut list);
        let want_events = case["out_events"].as_array().expect("events");
        assert_eq!(events.len(), want_events.len(), "zdarzenia {case}");
        for (got, want) in events.iter().zip(want_events) {
            assert_eq!((got.q, got.r), (int(&want["q"]), int(&want["r"])));
            assert_eq!(got.kind, kind(&want["type"]));
            assert_eq!(
                got.prev_owner_id,
                want["prevOwnerId"].as_i64().expect("prev")
            );
            assert_eq!(got.new_owner_id, want["newOwnerId"].as_i64().expect("new"));
        }
        assert_eq!(
            list,
            forts(&case["out_forts"]),
            "rejestr fortow po zalozeniu {case}"
        );
        with_events += usize::from(!events.is_empty());
        with_removal += usize::from(list.len() < before);
    }
    assert!(
        with_events > 30 && with_removal > 30,
        "{with_events}/{with_removal}"
    );
}

#[test]
fn evacuation_hex_matches_web() {
    let root = root();
    let (mut found, mut missing) = (0, 0);
    for case in cases(&root, "findEvacuationHexOutsideCity") {
        let hex_set: BTreeSet<HexCoord> = case["hexes"]
            .as_array()
            .expect("hexes")
            .iter()
            .map(|key| {
                let key = key.as_str().expect("klucz");
                let (q, r) = key.split_once(',').expect("q,r");
                HexCoord::new(q.parse().expect("q"), r.parse().expect("r"))
            })
            .collect();
        let blocked: BTreeSet<HexCoord> = case["blocked"]
            .as_array()
            .expect("blocked")
            .iter()
            .map(|key| {
                let key = key.as_str().expect("klucz");
                let (q, r) = key.split_once(',').expect("q,r");
                HexCoord::new(q.parse().expect("q"), r.parse().expect("r"))
            })
            .collect();
        let max_ring = opt_num(case.get("maxRing")).map(|ring| ring as u32);
        let got = find_evacuation_hex_outside_city(
            int(&case["fortQ"]),
            int(&case["fortR"]),
            &node(&case["node"]),
            &|hex| hex_set.contains(&hex),
            &|q, r| !blocked.contains(&HexCoord::new(q, r)),
            max_ring,
        );
        let want = case
            .get("out")
            .filter(|out| !out.is_null())
            .map(|out| HexCoord::new(int(&out["q"]), int(&out["r"])));
        assert_eq!(got, want, "findEvacuationHexOutsideCity {case}");
        if want.is_some() {
            found += 1;
        } else {
            missing += 1;
        }
    }
    assert!(
        found > 20 && missing > 5,
        "wektory musza obejmowac oba wyniki ({found}/{missing})"
    );
}

#[test]
fn fort_rules_table_references_known_improvements() {
    let rules = &teren_ruch_reguly().fort;
    for name in [&rules.ulepszenie_fort, &rules.ulepszenie_posterunek] {
        assert!(
            civ_engine::domain::improvements::improvement_catalog()
                .row(name)
                .is_some(),
            "tabela fortow wskazuje nieznane ulepszenie {name}"
        );
    }
    assert!(rules.ewakuacja_maks_pierscien >= 1);
    // zasieg fortu / posterunku pochodzi z terrain-improvements.json, nie z kodu
    let fort_radius =
        city_territory_radius(&fort_node_as_city_node(0, 0, FortImprovementType::Fort));
    let outpost_radius = city_territory_radius(&fort_node_as_city_node(
        0,
        0,
        FortImprovementType::Posterunek,
    ));
    assert!(fort_radius > 0.0 && outpost_radius > 0.0);
}
