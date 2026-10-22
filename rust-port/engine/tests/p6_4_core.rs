//! P6.4 - zaleznosci ruchu z `units/setup.ts`, `game/visibility.ts`, `game/armyMerge.ts` i
//! `map/road-movement.ts` z wektorami z URUCHOMIONEGO weba (`tests/p6_4_vectors/core.json`).
//! Kolejnosc wstawiania zbiorow i remisy kopca binarnego musza byc identyczne z webem.

#[path = "p6_4_vectors/common.rs"]
mod common;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    add_explored, apply_road_movement_modifier, compute_path, compute_reachable,
    compute_visible_at, embark_defense_mult, embark_move_cost, embark_tech,
    embarked_water_move_cost, hex_distance, path_cost, stack_group_id_of, terrain_move_cost,
    RuchHex, TerenBazowy,
};
use common::{
    assert_same, cases, cost_bonusy, key_set, load, load_maps, make_cost, num, ordered, pair,
    pair_f, pairs, unit,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_4_vectors/core.json");

fn root() -> Value {
    load(VECTORS)
}

fn hex_from_combo(case: &Value) -> RuchHex {
    let mut hex = RuchHex::new(TerenBazowy::from_web(case["t"].as_str().expect("t")).expect("t"));
    hex.las = case["las"].as_bool().expect("las");
    hex.rzeka = case["rzeka"].as_bool().expect("rzeka");
    hex.ulepszenie = case["ul"].as_str().map(str::to_owned);
    hex.ulepszenia = case["uls"].as_array().map(|layers| {
        layers
            .iter()
            .map(|layer| layer.as_str().expect("warstwa").to_owned())
            .collect()
    });
    hex
}

#[test]
fn terrain_and_embark_costs_match_web_on_maps() {
    let root = root();
    let maps = load_maps();
    for (name, embark) in [("terrainMoveCost", false), ("embarkMoveCost", true)] {
        for case in cases(&root, name) {
            let map = &maps[case["map"].as_u64().expect("map") as usize];
            let want = case["out"].as_array().expect("out");
            assert_eq!(want.len(), map.list.len());
            for ((key, hex), want) in map.list.iter().zip(want) {
                let got = if embark {
                    embark_move_cost(hex)
                } else {
                    terrain_move_cost(hex)
                };
                assert_same(&format!("{name} {key:?}"), got, num(want));
            }
        }
    }
}

#[test]
fn terrain_cost_combinations_match_web() {
    let root = root();
    let all = cases(&root, "terrainCombos");
    let mut infinite = 0;
    let mut fractional = 0;
    for case in all {
        let hex = hex_from_combo(case);
        let got = terrain_move_cost(&hex);
        assert_same(&format!("terrainMoveCost {case}"), got, num(&case["out"]));
        assert_same(
            &format!("embarkMoveCost {case}"),
            embark_move_cost(&hex),
            num(&case["embark"]),
        );
        if got.is_infinite() {
            infinite += 1;
        } else if got.fract() != 0.0 {
            fractional += 1;
        }
    }
    assert!(
        infinite > 20 && fractional > 20,
        "wektory musza obejmowac koszty nieprzejezdne i ulamkowe ({infinite}/{fractional})"
    );
}

#[test]
fn road_modifier_matches_web_including_floor_and_special_costs() {
    let root = root();
    for case in cases(&root, "applyRoad") {
        let mut hex = RuchHex::new(TerenBazowy::Laka);
        hex.ulepszenie = case["ul"].as_str().map(str::to_owned);
        hex.ulepszenia = case["uls"].as_array().map(|layers| {
            layers
                .iter()
                .map(|layer| layer.as_str().expect("warstwa").to_owned())
                .collect()
        });
        assert_same(
            &format!("applyRoadMovementModifier {case}"),
            apply_road_movement_modifier(num(&case["cost"]), &hex),
            num(&case["out"]),
        );
    }
}

#[test]
fn hex_distance_matches_web() {
    let root = root();
    for case in cases(&root, "hexDistance") {
        let a = pair(&case["a"]);
        let b = pair(&case["b"]);
        assert_eq!(
            hex_distance(a.0, a.1, b.0, b.1),
            case["out"].as_i64().expect("out"),
            "hexDistance {case}"
        );
    }
}

#[test]
fn compute_path_matches_web_including_ties_and_edge_destinations() {
    let root = root();
    let maps = load_maps();
    let (mut empty, mut long) = (0, 0);
    for case in cases(&root, "computePath") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let (dq, dr) = pair_f(&case["dest"]);
        let occupied = key_set(&case["occupied"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        let got = compute_path(&unit, map, dq, dr, &occupied, cost.as_deref());
        assert_eq!(got, pairs(&case["out"]), "computePath {case}");
        if got.is_empty() {
            empty += 1;
        }
        if got.len() > 5 {
            long += 1;
        }
    }
    assert!(
        empty > 20 && long > 100,
        "wektory musza obejmowac puste i dlugie trasy ({empty}/{long})"
    );
}

#[test]
fn compute_reachable_matches_web_order_and_min_move() {
    let root = root();
    let maps = load_maps();
    for case in cases(&root, "computeReachable") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let occupied = key_set(&case["occupied"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        let got = compute_reachable(&unit, map, &occupied, cost.as_deref());
        assert_eq!(got.to_vec(), pairs(&case["out"]), "computeReachable {case}");
    }
}

#[test]
fn path_cost_matches_web() {
    let root = root();
    let maps = load_maps();
    for case in cases(&root, "pathCost") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        assert_same(
            &format!("pathCost {case}"),
            path_cost(&pairs(&case["path"]), map, cost.as_deref()),
            num(&case["out"]),
        );
    }
}

#[test]
fn visibility_helpers_match_web() {
    let root = root();
    let maps = load_maps();
    for case in cases(&root, "computeVisibleAt") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let got = compute_visible_at(
            i32::try_from(case["q"].as_i64().expect("q")).expect("i32"),
            i32::try_from(case["r"].as_i64().expect("r")).expect("i32"),
            map,
            num(&case["sight"]),
        );
        assert_eq!(got.to_vec(), pairs(&case["out"]), "computeVisibleAt {case}");
    }
    for case in cases(&root, "addExplored") {
        let mut explored = ordered(&case["explored"]);
        add_explored(&mut explored, &ordered(&case["visible"]));
        assert_eq!(explored.to_vec(), pairs(&case["out"]), "addExplored {case}");
    }
}

#[test]
fn stack_group_id_matches_web() {
    let root = root();
    for case in cases(&root, "stackGroupIdOf") {
        assert_eq!(
            stack_group_id_of(&unit(&case["unit"])),
            case["out"].as_str().expect("out"),
            "stackGroupIdOf {case}"
        );
    }
}

/// Stale z TS (odczyt z uruchomionego weba) = tabele Rust (`ruch-jednostek-params.json`,
/// `terrain-movement.json`, `road-movement-multipliers.json`).
#[test]
fn constants_read_from_running_web_match_tables() {
    let root = root();
    let constants = &root["cases"]["constants"];
    assert_eq!(
        embark_tech(),
        constants["EMBARK_TECH"].as_str().expect("tech")
    );
    assert_same(
        "EMBARK_DEFENSE_MULT",
        embark_defense_mult(),
        num(&constants["EMBARK_DEFENSE_MULT"]),
    );
    assert_same(
        "EMBARKED_WATER_MOVE_COST",
        embarked_water_move_cost(),
        num(&constants["EMBARKED_WATER_MOVE_COST"]),
    );
    for (id, key) in [
        ("ROAD_MOVE_SPEED_MULT", "ROAD_MOVE_SPEED_MULT"),
        ("ROAD_BRUK_MOVE_SPEED_MULT", "ROAD_BRUK_MOVE_SPEED_MULT"),
        ("ROAD_BRUK_MIN_MOVE_COST", "ROAD_BRUK_MIN_MOVE_COST"),
    ] {
        assert_same(
            id,
            civ_engine::data::derived::road_movement_value(id),
            num(&constants[key]),
        );
    }
    // koszty terenu z `terrain-movement.json` (te same, ktorymi web konfiguruje ruch)
    let table = civ_engine::data::terrain_map::parse_terrain_movement().expect("terrain-movement");
    let web = &constants["terrainMovement"];
    assert_eq!(
        table.forest_extra,
        web["forestExtra"].as_i64().expect("extra")
    );
    assert_eq!(
        table.costs.laka,
        web["costs"]["Laka"].as_i64().expect("laka")
    );
    assert_eq!(
        table.costs.pustynia,
        web["costs"]["Pustynia"].as_i64().expect("pustynia")
    );
    assert_eq!(
        table.costs.polarny,
        web["costs"]["Polarny"].as_i64().expect("polarny")
    );
}
