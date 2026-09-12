#![allow(dead_code)]

#[path = "../src/domain/map_generator.rs"]
mod map_generator;

use map_generator::{generate_map, MapGeneratorError, Terrain, WorldType};

#[test]
fn map_dimensions_and_seed_are_stable() {
    let map = generate_map(12, 10, 42, WorldType::Continents).expect("valid dimensions");
    assert_eq!((map.width, map.height, map.seed), (12, 10, 42));
    assert_eq!(map.tiles.len(), 120);
    assert_eq!(map.tile(0, 0).map(|tile| tile.coord.q), Some(0));
    assert_eq!(map.tile(11, 9).map(|tile| tile.coord.r), Some(9));
    assert!(map.tile(12, 0).is_none());
}

#[test]
fn invalid_dimensions_are_rejected_before_allocation() {
    assert_eq!(
        generate_map(0, 10, 42, WorldType::Continents),
        Err(MapGeneratorError::ZeroWidth)
    );
    assert_eq!(
        generate_map(10, 0, 42, WorldType::Continents),
        Err(MapGeneratorError::ZeroHeight)
    );
    assert_eq!(
        generate_map(u32::MAX, 2, 42, WorldType::Continents),
        Err(MapGeneratorError::TooManyTiles)
    );
}

#[test]
fn map_golden_vector_matches_typescript_core_contract() {
    let map = generate_map(12, 10, 42, WorldType::Continents).expect("valid dimensions");
    assert_eq!(map.terrain_counts(), [47, 28, 9, 4, 14, 18, 0, 0]);
    let sample: Vec<_> = [(0, 0), (2, 2), (5, 4), (7, 5), (10, 7), (11, 9)]
        .into_iter()
        .map(|(q, r)| map.tile(q, r).map(|tile| tile.terrain))
        .collect();
    assert_eq!(
        sample,
        vec![
            Some(Terrain::Sea),
            Some(Terrain::ShallowSea),
            Some(Terrain::Hills),
            Some(Terrain::Grassland),
            Some(Terrain::Sea),
            Some(Terrain::Sea),
        ]
    );
}

#[test]
fn repeated_generation_is_byte_for_byte_deterministic() {
    let left = generate_map(18, 14, 2026, WorldType::Pangea).expect("valid dimensions");
    let right = generate_map(18, 14, 2026, WorldType::Pangea).expect("valid dimensions");
    assert_eq!(left, right);
}

#[test]
fn world_types_and_default_seed_match_typescript_contract() {
    assert_eq!(
        serde_json::to_string(&WorldType::Continents).unwrap(),
        "\"kontynenty\""
    );
    assert_eq!(
        serde_json::to_string(&WorldType::Pangea).unwrap(),
        "\"pangea\""
    );
    assert_eq!(
        serde_json::to_string(&WorldType::Islands).unwrap(),
        "\"wyspy\""
    );
    assert_eq!(
        serde_json::to_string(&WorldType::Earth).unwrap(),
        "\"ziemia\""
    );
    let from_zero = generate_map(8, 8, 0, WorldType::Continents).expect("valid dimensions");
    let from_default = generate_map(8, 8, 42, WorldType::Continents).expect("valid dimensions");
    assert_eq!(from_zero, from_default);
}

#[test]
fn river_markers_are_land_and_reach_water() {
    let map = generate_map(36, 28, 777, WorldType::Continents).expect("valid dimensions");
    assert!(map.tiles.iter().any(|tile| tile.river));
    for tile in map.tiles.iter().filter(|tile| tile.river) {
        assert!(tile.terrain.is_land(), "river marker on {:?}", tile.coord);
        let mut frontier = vec![tile.coord];
        let mut visited = std::collections::HashSet::new();
        let mut reaches_water = false;
        while let Some(coord) = frontier.pop() {
            if !visited.insert(coord) {
                continue;
            }
            for neighbour in coord.neighbours() {
                let next = map.tile(neighbour.q as u32, neighbour.r as u32);
                match next {
                    None => {}
                    Some(next) if next.terrain.is_water() => reaches_water = true,
                    Some(next) if next.river => frontier.push(next.coord),
                    Some(_) => {}
                }
            }
        }
        assert!(reaches_water, "river at {:?} has no outlet", tile.coord);
    }
}
