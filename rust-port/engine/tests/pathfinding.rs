use std::collections::BTreeSet;

use civ_engine::domain::pathfinding::{
    find_path, find_path_with_rules, movement_cost, path_cost, qualify_field, reachable, HexCoord,
    Improvement, MovementCost, PathMap, TerrainType, Tile, COST_SCALE,
};

fn line_map(coordinates: &[(i32, i32)]) -> PathMap {
    PathMap::from_tiles(
        coordinates
            .iter()
            .copied()
            .map(|(q, r)| (HexCoord::new(q, r), Tile::new(TerrainType::Grassland))),
    )
}

#[test]
fn terrain_qualification_keeps_workability_separate_from_movement() {
    let shallow_water = qualify_field(TerrainType::ShallowWater);
    assert!(shallow_water.workable);
    assert!(!shallow_water.passable);
    assert!(!shallow_water.city_site);

    let tundra = qualify_field(TerrainType::Tundra);
    assert!(tundra.workable);
    assert!(!tundra.passable);
    assert!(tundra.city_site);

    let mountains = qualify_field(TerrainType::Mountains);
    assert!(!mountains.workable);
    assert!(!mountains.passable);
    assert!(!mountains.city_site);
}

#[test]
fn movement_cost_applies_terrain_overlay_river_and_road_rules() {
    let plain = Tile::new(TerrainType::Plains);
    let forest = plain.clone().with_forest(true);
    let river_hill = Tile::new(TerrainType::Hills).with_river(true);
    let road = plain.clone().with_improvement(Improvement::Road);
    let paved = plain.with_improvement(Improvement::PavedRoad);

    assert_eq!(movement_cost(&forest), Some(MovementCost::from_whole(2)));
    assert_eq!(
        movement_cost(&river_hill),
        Some(MovementCost::from_whole(1))
    );
    assert_eq!(
        movement_cost(&road).expect("road is passable").raw(),
        COST_SCALE / 3
    );
    assert_eq!(
        movement_cost(&paved).expect("paved road is passable").raw(),
        COST_SCALE / 5
    );
    assert!(movement_cost(&Tile::new(TerrainType::Ocean)).is_none());
}

#[test]
fn dijkstra_chooses_the_same_least_cost_path_every_time() {
    let map = line_map(&[(0, 0), (0, 1), (1, 0), (1, 1)]);
    let occupied = BTreeSet::new();
    let expected = vec![HexCoord::new(0, 1), HexCoord::new(1, 1)];

    for _ in 0..20 {
        assert_eq!(
            find_path(&map, HexCoord::new(0, 0), HexCoord::new(1, 1), &occupied),
            Some(expected.clone())
        );
    }
    assert_eq!(
        path_cost(&map, &expected),
        Some(MovementCost::from_whole(2))
    );
}

#[test]
fn occupied_intermediate_tiles_block_but_occupied_destination_is_final_step() {
    let map = line_map(&[(0, 0), (1, 0), (0, 1), (1, 1), (2, 0)]);
    let mut occupied = BTreeSet::new();
    occupied.insert(HexCoord::new(1, 0));

    let detour = vec![
        HexCoord::new(0, 1),
        HexCoord::new(1, 1),
        HexCoord::new(2, 0),
    ];
    assert_eq!(
        find_path(&map, HexCoord::new(0, 0), HexCoord::new(2, 0), &occupied),
        Some(detour.clone())
    );

    occupied.insert(HexCoord::new(2, 0));
    assert_eq!(
        find_path(&map, HexCoord::new(0, 0), HexCoord::new(2, 0), &occupied),
        Some(detour)
    );
}

#[test]
fn unreachable_and_missing_fields_are_rejected() {
    let mut map = line_map(&[(0, 0), (1, 0), (2, 0)]);
    map.insert(HexCoord::new(1, 0), Tile::new(TerrainType::Mountains));
    let occupied = BTreeSet::new();

    assert!(find_path(&map, HexCoord::new(0, 0), HexCoord::new(2, 0), &occupied).is_none());
    assert!(find_path(&map, HexCoord::new(0, 0), HexCoord::new(3, 0), &occupied).is_none());
}

#[test]
fn impassable_destination_is_allowed_as_the_final_step() {
    let mut map = line_map(&[(0, 0), (1, 0)]);
    map.insert(HexCoord::new(1, 0), Tile::new(TerrainType::Mountains));

    let result = find_path_with_rules(
        &map,
        HexCoord::new(0, 0),
        HexCoord::new(1, 0),
        &BTreeSet::new(),
        &Default::default(),
    )
    .expect("an existing destination is reachable as the final step");

    assert_eq!(result.steps, vec![HexCoord::new(1, 0)]);
    assert_eq!(result.total_cost, MovementCost::from_whole(1));
}

#[test]
fn reachable_respects_fixed_point_budget_and_excludes_origin() {
    let map = line_map(&[(0, 0), (1, 0), (2, 0), (3, 0)]);
    let reachable = reachable(
        &map,
        HexCoord::new(0, 0),
        MovementCost::from_whole(2),
        &BTreeSet::new(),
    );

    assert!(!reachable.contains(&HexCoord::new(0, 0)));
    assert!(reachable.contains(&HexCoord::new(1, 0)));
    assert!(reachable.contains(&HexCoord::new(2, 0)));
    assert!(!reachable.contains(&HexCoord::new(3, 0)));
}

#[test]
fn reachable_applies_min_move_to_expensive_direct_neighbours() {
    let mut map = line_map(&[(0, 0), (1, 0)]);
    map.insert(HexCoord::new(1, 0), Tile::new(TerrainType::Hills));

    let reachable = reachable(
        &map,
        HexCoord::new(0, 0),
        MovementCost::from_whole(1),
        &BTreeSet::new(),
    );

    assert!(reachable.contains(&HexCoord::new(1, 0)));
}
