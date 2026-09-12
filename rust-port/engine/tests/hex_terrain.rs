#[path = "../src/domain/hex.rs"]
#[allow(dead_code)]
mod hex;
#[path = "../src/domain/terrain.rs"]
#[allow(dead_code)]
mod terrain;

use hex::{CubeCoord, HexCoord, HexDirection};
use terrain::{
    can_found_city_on, is_passable_terrain, is_workable_terrain, TerrainType, TileQualification,
};

#[test]
fn axial_coordinates_keep_the_cube_invariant() {
    let coordinate = HexCoord::new(-3, 7);

    assert_eq!(coordinate.q(), -3);
    assert_eq!(coordinate.r(), 7);
    assert_eq!(coordinate.s(), -4);
    assert_eq!(coordinate.cube(), CubeCoord { q: -3, r: 7, s: -4 });
    assert!(coordinate.cube().is_valid());
    assert_eq!(HexCoord::from_cube(coordinate.cube()), coordinate);
    assert!(CubeCoord::new(1, 2, 3).is_none());
}

#[test]
fn distance_is_symmetric_and_uses_axial_cube_geometry() {
    let origin = HexCoord::new(0, 0);
    let target = HexCoord::new(-2, 5);

    assert_eq!(origin.distance(target), 5);
    assert_eq!(target.distance(origin), 5);
    assert!(origin.within_distance(target, 5));
    assert!(!origin.within_distance(target, 4));
    assert_eq!(origin.distance(origin), 0);
}

#[test]
fn every_coordinate_has_six_unique_reversible_neighbors() {
    let origin = HexCoord::new(4, -2);
    let neighbors = origin.neighbors();

    assert_eq!(neighbors.len(), 6);
    for (direction, neighbor) in HexDirection::ALL.into_iter().zip(neighbors) {
        assert_eq!(neighbor, origin.neighbor(direction));
        assert_eq!(origin.distance(neighbor), 1);
        assert!(neighbor.neighbors().contains(&origin));
    }

    for left in 0..neighbors.len() {
        for right in (left + 1)..neighbors.len() {
            assert_ne!(neighbors[left], neighbors[right]);
        }
    }
}

#[test]
fn coordinates_round_trip_through_the_canonical_map_key() {
    let coordinate = HexCoord::new(-12, 9);
    assert_eq!(coordinate.key(), "-12,9");
    assert_eq!(coordinate.to_string(), "-12,9");
    assert_eq!("-12,9".parse::<HexCoord>().unwrap(), coordinate);
    assert!("1,2,3".parse::<HexCoord>().is_err());
}

#[test]
fn terrain_qualification_matches_the_world_map_rules() {
    assert!(is_workable_terrain(TerrainType::ShallowWater));
    assert!(is_workable_terrain(TerrainType::Grassland));
    assert!(!is_workable_terrain(TerrainType::Ocean));
    assert!(!is_workable_terrain(TerrainType::Mountains));

    assert!(is_passable_terrain(TerrainType::Plains));
    assert!(is_passable_terrain(TerrainType::Hills));
    assert!(!is_passable_terrain(TerrainType::Tundra));
    assert!(!is_passable_terrain(TerrainType::ShallowWater));
    assert!(!is_passable_terrain(TerrainType::Ocean));
    assert!(!is_passable_terrain(TerrainType::Mountains));

    assert!(can_found_city_on(TerrainType::Plains));
    assert!(can_found_city_on(TerrainType::Tundra));
    assert!(!can_found_city_on(TerrainType::ShallowWater));
    assert!(!can_found_city_on(TerrainType::Ocean));
    assert!(!can_found_city_on(TerrainType::Mountains));
}

#[test]
fn terrain_movement_costs_are_explicit() {
    assert_eq!(TerrainType::Grassland.movement_cost(), Some(1));
    assert_eq!(TerrainType::Plains.movement_cost(), Some(1));
    assert_eq!(TerrainType::Hills.movement_cost(), Some(2));
    assert_eq!(TerrainType::Desert.movement_cost(), Some(1));
    assert_eq!(TerrainType::Tundra.movement_cost(), None);
    assert_eq!(TerrainType::Mountains.movement_cost(), None);
    assert_eq!(TerrainType::ShallowWater.movement_cost(), None);
    assert_eq!(TerrainType::Ocean.movement_cost(), None);
}

#[test]
fn terrain_aliases_describe_the_same_source_values() {
    assert_eq!(TerrainType::Laka, TerrainType::Grassland);
    assert_eq!(TerrainType::Rownina, TerrainType::Plains);
    assert_eq!(TerrainType::Wzgorza, TerrainType::Hills);
    assert_eq!(TerrainType::Gory, TerrainType::Mountains);
    assert_eq!(TerrainType::PlytkieMorze, TerrainType::ShallowWater);
    assert_eq!(TerrainType::Morze, TerrainType::Ocean);
    assert_eq!(TerrainType::Pustynia, TerrainType::Desert);
    assert_eq!(TerrainType::Polarny, TerrainType::Tundra);
}

#[test]
fn tile_qualification_is_a_pure_terrain_projection() {
    let shallow_water = TileQualification::for_terrain(TerrainType::ShallowWater);
    assert!(shallow_water.workable);
    assert!(!shallow_water.passable);
    assert!(!shallow_water.city_site);

    let hills = TileQualification::for_terrain(TerrainType::Hills);
    assert!(hills.workable);
    assert!(hills.passable);
    assert!(hills.city_site);
}

#[test]
fn coordinates_and_terrain_are_json_round_trip_safe() {
    let coordinate = HexCoord::new(2, -5);
    let terrain = TerrainType::ShallowWater;

    let coordinate_json = serde_json::to_string(&coordinate).unwrap();
    let terrain_json = serde_json::to_string(&terrain).unwrap();
    assert_eq!(
        serde_json::from_str::<HexCoord>(&coordinate_json).unwrap(),
        coordinate
    );
    assert_eq!(
        serde_json::from_str::<TerrainType>(&terrain_json).unwrap(),
        terrain
    );
}
