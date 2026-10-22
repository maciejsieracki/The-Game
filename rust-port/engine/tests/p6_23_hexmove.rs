//! P6.3 - `city-hex-movement.ts` z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_23_vectors/hexmove.json`) oraz test podpiecia blokady obcych miast do
//! `find_path` / `reachable` (koszty ruchu z tabeli P3-23 dla drog dzialaja w tych samych wywolaniach).

#[path = "p6_23_vectors/common.rs"]
mod common;

use std::collections::BTreeSet;

use civ_engine::domain::pathfinding::{
    add_foreign_city_block_coords, add_foreign_city_blocks, can_ai_enter_empty_enemy_city,
    can_unit_occupy_city_hex, city_at_hex, find_path, foreign_city_hex_keys, path_cost, reachable,
    CityHexRef, HexCoord, Improvement, MovementCost, PathMap, TerrainType, Tile,
};
use common::{cases, string_list};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_23_vectors/hexmove.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("hexmove.json parse")
}

fn city(value: &Value) -> CityHexRef {
    CityHexRef {
        q: i32::try_from(value["q"].as_i64().expect("q")).expect("i32"),
        r: i32::try_from(value["r"].as_i64().expect("r")).expect("i32"),
        owner_id: value["ownerId"].as_i64().expect("ownerId"),
        ma_mur: value
            .get("maMur")
            .map(|flag| flag.as_bool().expect("maMur bool")),
    }
}

fn cities(value: &Value) -> Vec<CityHexRef> {
    value.as_array().expect("cities").iter().map(city).collect()
}

fn key_set(value: &Value) -> BTreeSet<String> {
    string_list(value).into_iter().collect()
}

#[test]
fn city_at_hex_and_occupancy_match_web() {
    let root = root();
    for case in cases(&root, "cityAtHex") {
        let list = cities(&case["cities"]);
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("i32");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("i32");
        let got = city_at_hex(q, r, &list).copied();
        let want = case.get("out").map(city);
        assert_eq!(got, want, "cityAtHex {case}");
    }
    for case in cases(&root, "canUnitOccupyCityHex") {
        let list = cities(&case["cities"]);
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("i32");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("i32");
        assert_eq!(
            can_unit_occupy_city_hex(case["owner"].as_i64().expect("owner"), q, r, &list),
            case["out"].as_bool().expect("bool"),
            "canUnitOccupyCityHex {case}"
        );
    }
}

#[test]
fn ai_entry_into_empty_enemy_city_matches_web() {
    let root = root();
    let all = cases(&root, "canAiEnterEmptyEnemyCity");
    let mut allowed = 0;
    for case in all {
        let want = case["out"].as_bool().expect("bool");
        let got = can_ai_enter_empty_enemy_city(
            case["owner"].as_i64().expect("owner"),
            i32::try_from(case["uq"].as_i64().expect("uq")).expect("i32"),
            i32::try_from(case["ur"].as_i64().expect("ur")).expect("i32"),
            &city(&case["city"]),
            &string_list(&case["built"]),
            case["hasDefenders"].as_bool().expect("hasDefenders"),
            case["civilian"].as_bool().expect("civilian"),
        );
        assert_eq!(got, want, "canAiEnterEmptyEnemyCity {case}");
        if want {
            allowed += 1;
        }
    }
    assert!(
        allowed > 10 && allowed < all.len(),
        "wektory musza obejmowac oba wyniki ({allowed})"
    );
}

#[test]
fn foreign_city_blocks_match_web() {
    let root = root();
    for case in cases(&root, "foreignCityHexKeys") {
        let got = foreign_city_hex_keys(
            case["owner"].as_i64().expect("owner"),
            &cities(&case["cities"]),
        );
        assert_eq!(got, key_set(&case["out"]), "foreignCityHexKeys {case}");
    }
    for case in cases(&root, "addForeignCityBlocks") {
        let got = add_foreign_city_blocks(
            &key_set(&case["occupied"]),
            case["owner"].as_i64().expect("owner"),
            &cities(&case["cities"]),
        );
        assert_eq!(got, key_set(&case["out"]), "addForeignCityBlocks {case}");
    }
}

/// Podpiecie minimalne (bez `bridge.rs` / `playable.rs`): obce miasto blokuje trase w `find_path`
/// i `reachable`, wlasne miasto nie; droga z tabeli P3-23 skraca koszt w tym samym wywolaniu.
#[test]
fn foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors() {
    let line: Vec<HexCoord> = (0..5).map(|q| HexCoord::new(q, 0)).collect();
    let map = PathMap::from_tiles(
        line.iter()
            .map(|hex| (*hex, Tile::new(TerrainType::Grassland))),
    );
    let foreign_city = CityHexRef {
        q: 2,
        r: 0,
        owner_id: 2,
        ma_mur: None,
    };
    let own_city = CityHexRef {
        owner_id: 1,
        ..foreign_city
    };
    let none = BTreeSet::new();
    let blocked = add_foreign_city_block_coords(&none, 1, &[foreign_city]);
    let open = add_foreign_city_block_coords(&none, 1, &[own_city]);
    assert!(blocked.contains(&HexCoord::new(2, 0)));
    assert!(open.is_empty());

    assert!(find_path(&map, line[0], line[4], &blocked).is_none());
    assert!(find_path(&map, line[0], line[4], &open).is_some());
    let budget = MovementCost::from_whole(10);
    assert!(!reachable(&map, line[0], budget, &blocked).contains(&line[4]));
    assert!(reachable(&map, line[0], budget, &open).contains(&line[4]));

    let road_map = PathMap::from_tiles(line.iter().map(|hex| {
        (
            *hex,
            Tile::new(TerrainType::Grassland).with_improvement(Improvement::Road),
        )
    }));
    let plain_path = find_path(&map, line[0], line[4], &open).expect("plain");
    let road_path = find_path(&road_map, line[0], line[4], &open).expect("road");
    let plain_cost = path_cost(&map, &plain_path).expect("plain cost");
    let road_cost = path_cost(&road_map, &road_path).expect("road cost");
    assert!(road_cost < plain_cost, "droga musi obnizac koszt ruchu");
}
