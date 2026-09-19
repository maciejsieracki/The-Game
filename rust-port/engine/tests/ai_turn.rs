#[path = "../src/domain/ai_turn.rs"]
pub mod ai_turn;

use std::collections::BTreeMap;

use ai_turn::{
    decide_ai_turn, AiCity, AiCommand, AiMap, AiTurnInput, AiTurnOptions, AiUnit, HexCoord,
    MapTile, ProductionItem, Terrain, UnitKind,
};

fn plain_map(coordinates: &[(i32, i32)]) -> AiMap {
    AiMap::from_tiles(
        coordinates
            .iter()
            .copied()
            .map(|(q, r)| (HexCoord::new(q, r), MapTile::new(Terrain::Grassland))),
    )
}

fn idle_city(id: u64, owner_id: u64, q: i32, r: i32) -> AiCity {
    AiCity::new(id, owner_id, q, r)
}

#[test]
fn planner_returns_production_then_actions_and_always_ends_the_turn() {
    let map = plain_map(&[(0, 0), (1, 0)]);
    let units = vec![
        AiUnit::new(1, 7, UnitKind::Warrior, 0, 0),
        AiUnit::new(9, 8, UnitKind::Warrior, 1, 0),
    ];
    let cities = vec![idle_city(3, 7, 0, 0).with_production("already-running")];
    let options = AiTurnOptions {
        production_items: vec![ProductionItem::unit("Wojownik", UnitKind::Warrior)],
        ..AiTurnOptions::default()
    };
    let input = AiTurnInput::new(7, units, cities, map).with_options(options);

    let commands = decide_ai_turn(&input);

    assert_eq!(
        commands,
        vec![
            AiCommand::Attack {
                unit_id: 1,
                target_unit_id: 9,
            },
            AiCommand::EndTurn,
        ]
    );
    assert!(matches!(commands.last(), Some(AiCommand::EndTurn)));
}

#[test]
fn planner_uses_deterministic_pathfinding_and_never_walks_through_mountains() {
    let mut map = plain_map(&[(0, 0), (1, 0), (0, 1), (1, 1), (2, 0)]);
    map.insert(HexCoord::new(1, 0), MapTile::new(Terrain::Mountains));
    let city = idle_city(1, 7, 0, 0).with_production("already-running");
    let enemy_city = idle_city(2, 8, 2, 0).with_production("already-running");
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(4, 7, UnitKind::Warrior, 0, 0)],
        vec![city, enemy_city],
        map,
    )
    .with_options(AiTurnOptions {
        production_items: vec![],
        ..AiTurnOptions::default()
    });

    let first = decide_ai_turn(&input);
    let second = decide_ai_turn(&input);

    assert_eq!(first, second);
    assert_eq!(
        first,
        vec![
            AiCommand::Move {
                unit_id: 4,
                to_q: 0,
                to_r: 1,
            },
            AiCommand::EndTurn,
        ]
    );
}

#[test]
fn planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking() {
    let mut map = plain_map(&[(0, 0), (1, 0), (2, 0), (3, 0), (0, 1), (1, 1), (2, 1)]);
    map.insert(HexCoord::new(1, 0), MapTile::new(Terrain::Hills));
    map.insert(HexCoord::new(2, 0), MapTile::new(Terrain::Hills));
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(4, 7, UnitKind::Warrior, 0, 0)],
        vec![
            idle_city(1, 7, 0, 0).with_production("already-running"),
            idle_city(2, 8, 3, 0).with_production("already-running"),
        ],
        map,
    )
    .with_options(AiTurnOptions {
        production_items: vec![],
        ..AiTurnOptions::default()
    });

    let first = decide_ai_turn(&input);
    let second = decide_ai_turn(&input);

    assert_eq!(first, second, "Dijkstra tie-breaking must be deterministic");
    assert_eq!(
        first,
        vec![
            AiCommand::Move {
                unit_id: 4,
                to_q: 0,
                to_r: 1,
            },
            AiCommand::EndTurn,
        ],
        "the longer four-Grassland route costs less than the shorter two-Hills route",
    );
}

#[test]
fn settler_founds_only_on_a_qualifying_village_and_respects_city_spacing() {
    let mut map = plain_map(&[(0, 0), (5, 0)]);
    map.tile_mut(HexCoord::new(0, 0))
        .expect("start tile")
        .village = true;
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(4, 7, UnitKind::Settler, 0, 0)],
        vec![idle_city(1, 7, 5, 0).with_production("already-running")],
        map,
    )
    .with_options(AiTurnOptions {
        require_village_for_founding: true,
        production_items: vec![],
        ..AiTurnOptions::default()
    });

    let commands = decide_ai_turn(&input);

    assert_eq!(
        commands,
        vec![AiCommand::FoundCity { unit_id: 4 }, AiCommand::EndTurn]
    );
}

#[test]
fn production_matches_spec_priority_and_skips_already_built_buildings() {
    let map = plain_map(&[(0, 0)]);
    let city = idle_city(1, 7, 0, 0).with_built_buildings(["Spichlerz"]);
    let options = AiTurnOptions {
        production_items: vec![
            ProductionItem::building("Spichlerz"),
            ProductionItem::unit("Osadnik", UnitKind::Settler),
            ProductionItem::unit("Wojownik", UnitKind::Warrior),
        ],
        city_buildings: BTreeMap::from([(1, ["Spichlerz".to_owned()].into_iter().collect())]),
        ..AiTurnOptions::default()
    };
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(2, 7, UnitKind::Warrior, 0, 0)],
        vec![city],
        map,
    )
    .with_options(options);

    let commands = decide_ai_turn(&input);

    assert_eq!(
        commands,
        vec![
            AiCommand::Build {
                city_id: 1,
                building_id: "Wojownik".to_owned(),
            },
            AiCommand::EndTurn,
        ]
    );
}

#[test]
fn wounded_units_retreat_before_attacking() {
    let map = plain_map(&[(0, 0), (1, 0)]);
    let wounded = AiUnit::new(1, 7, UnitKind::Warrior, 1, 0).with_health_fraction(0.2);
    let home = idle_city(1, 7, 0, 0).with_production("already-running");
    let enemy = AiUnit::new(9, 8, UnitKind::Warrior, 2, 0);
    let input =
        AiTurnInput::new(7, vec![wounded, enemy], vec![home], map).with_options(AiTurnOptions {
            production_items: vec![],
            ..AiTurnOptions::default()
        });

    let commands = decide_ai_turn(&input);

    assert_eq!(
        commands,
        vec![
            AiCommand::Move {
                unit_id: 1,
                to_q: 0,
                to_r: 0,
            },
            AiCommand::EndTurn,
        ]
    );
}

#[test]
fn civilian_units_do_not_receive_combat_orders() {
    let map = plain_map(&[(0, 0), (1, 0)]);
    let home = idle_city(1, 7, 0, 0).with_production("already-running");
    let input = AiTurnInput::new(
        7,
        vec![
            AiUnit::new(1, 7, UnitKind::Scout, 0, 0),
            AiUnit::new(2, 7, UnitKind::Worker, 0, 0),
            AiUnit::new(9, 8, UnitKind::Warrior, 1, 0),
        ],
        vec![home],
        map,
    )
    .with_options(AiTurnOptions {
        production_items: vec![],
        ..AiTurnOptions::default()
    });

    assert_eq!(
        decide_ai_turn(&input),
        vec![AiCommand::EndTurn],
        "scouts/workers must not attack adjacent enemies",
    );
}

#[test]
fn ranged_units_hold_back_when_an_enemy_city_is_close() {
    let map = plain_map(&[(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0)]);
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(2, 7, UnitKind::Archer, 4, 0)],
        vec![
            idle_city(1, 7, 0, 0).with_production("already-running"),
            idle_city(9, 8, 6, 0).with_production("already-running"),
        ],
        map,
    )
    .with_options(AiTurnOptions {
        production_items: vec![],
        ..AiTurnOptions::default()
    });

    assert_eq!(
        decide_ai_turn(&input),
        vec![
            AiCommand::Move {
                unit_id: 2,
                to_q: 3,
                to_r: 0,
            },
            AiCommand::EndTurn,
        ],
    );
}

#[test]
fn nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target() {
    let mut map = plain_map(&[(0, 0), (1, 0), (2, 0), (0, 1), (0, 2), (0, 3)]);
    map.insert(HexCoord::new(1, 0), MapTile::new(Terrain::Mountains));
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(4, 7, UnitKind::Warrior, 0, 0)],
        vec![
            idle_city(1, 7, 0, 0).with_production("already-running"),
            idle_city(2, 8, 2, 0).with_production("already-running"),
            idle_city(3, 8, 0, 3).with_production("already-running"),
        ],
        map,
    )
    .with_options(AiTurnOptions {
        production_items: vec![],
        ..AiTurnOptions::default()
    });

    assert_eq!(
        decide_ai_turn(&input),
        vec![
            AiCommand::Move {
                unit_id: 4,
                to_q: 0,
                to_r: 1,
            },
            AiCommand::EndTurn,
        ],
    );
}

#[test]
fn command_wire_shape_is_stable_for_engine_integration() {
    let command = AiCommand::Move {
        unit_id: 4,
        to_q: 2,
        to_r: -1,
    };
    let json = serde_json::to_value(command).expect("command serializes");

    assert_eq!(json["type"], "move");
    assert_eq!(json["unitId"], 4);
    assert_eq!(json["toQ"], 2);
    assert_eq!(json["toR"], -1);
}

#[test]
fn ai_turn_input_serde_round_trip_uses_json_map_entries() {
    let input = AiTurnInput::new(
        7,
        vec![AiUnit::new(4, 7, UnitKind::Warrior, 0, 0)],
        vec![idle_city(1, 7, 0, 0)],
        plain_map(&[(0, 0), (1, 0)]),
    );

    let value = serde_json::to_value(&input).expect("AI turn input serializes to JSON");
    let tiles = value["map"]["tiles"]
        .as_array()
        .expect("map tiles use a JSON array representation");
    assert_eq!(tiles.len(), 2);

    let decoded: AiTurnInput = serde_json::from_value(value).expect("AI turn input round-trips");
    assert_eq!(decoded, input);
}
