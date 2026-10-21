//! Regression tests for R-RUSTPORT-P1-TERRAIN-DESERT-TUNDRA-FIX-Q1.
//!
//! Reference values come from `gra/data/terrain-movement.json` on pin
//! `edb8fb56`: "Pustynia" (Desert) costs 2, "Polarny" (Tundra) is 99
//! (impassable). The assertions below run against
//! `civ_engine::domain::terrain::TerrainType::movement_cost` (terrain.rs:95,
//! `Desert => Some(2)`), which `MovementRules::default().desert` in
//! pathfinding.rs:246 corroborates with the same value.

#[path = "../src/data/economy_society_part2.rs"]
pub mod economy_society_part2;

/// Ścieżka `crate::data::economy_society_part2` używana przez `domain/ai_turn.rs` (jak w `lib.rs`).
#[allow(dead_code)]
pub mod data {
    pub use crate::economy_society_part2;
}

#[path = "../src/domain/ai_turn.rs"]
pub mod ai_turn;

use civ_engine::domain::barbarians::{
    spawn_camps, BarbParams, BarbarianMap, HexCoord as BarbHex, MapTile as BarbMapTile,
    Terrain as BarbTerrain,
};
use civ_engine::domain::terrain::TerrainType as PathTerrain;
use civ_engine::domain::trade::{
    find_city_connection, owners_have_shared_land_border, HexCoord as TradeHex,
    TerrainType as TradeTerrain, TerritoryNode, TradeCity, TradeMap, TradeRouteMedium,
};

#[test]
fn ai_turn_desert_movement_cost_matches_web_and_pathfinder() {
    // Web: "Pustynia": 2.
    assert_eq!(ai_turn::Terrain::Desert.movement_cost(), Some(2));
    // Pathfinder/terrain module is the reference implementation.
    assert_eq!(PathTerrain::Desert.movement_cost(), Some(2));
}

#[test]
fn ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains() {
    // Web: Laka 1, Rownina 1, Wzgorza 2; Gory/Morze/Wybrzeze/Polarny 99.
    let pairs = [
        (ai_turn::Terrain::Grassland, PathTerrain::Grassland),
        (ai_turn::Terrain::Plains, PathTerrain::Plains),
        (ai_turn::Terrain::Hills, PathTerrain::Hills),
        (ai_turn::Terrain::Mountains, PathTerrain::Mountains),
        (ai_turn::Terrain::ShallowWater, PathTerrain::ShallowWater),
        (ai_turn::Terrain::Ocean, PathTerrain::Ocean),
        (ai_turn::Terrain::Desert, PathTerrain::Desert),
        (ai_turn::Terrain::Tundra, PathTerrain::Tundra),
    ];
    for (ai, path) in pairs {
        assert_eq!(
            ai.movement_cost(),
            path.movement_cost().map(u32::from),
            "AI movement cost diverges from terrain module for {ai:?}"
        );
    }
}

#[test]
fn barbarians_treat_tundra_as_impassable_land() {
    // Web: "Polarny": 99 (impassable); pathfinding.rs: Tundra is not passable.
    assert!(!BarbTerrain::Tundra.is_passable_land());
    assert!(!BarbMapTile::new(BarbTerrain::Tundra)
        .terrain
        .is_passable_land());
    // Desert stays passable land (web: "Pustynia": 2, i.e. traversable).
    assert!(BarbTerrain::Desert.is_passable_land());
}

#[test]
fn trade_routes_do_not_cross_tundra() {
    // Web: "Polarny": 99; pathfinding.rs: Tundra is not passable.
    assert!(!TradeTerrain::Tundra.is_land_passable());
    assert!(!TradeTerrain::Tundra.is_water_passable());
    // Desert stays land-passable for trade routes.
    assert!(TradeTerrain::Desert.is_land_passable());
}

/// Hex disc of radius 3 around the origin, filled with `filler`, except for
/// the explicitly listed overrides.
fn barb_disc(filler: BarbTerrain, overrides: &[(BarbHex, BarbTerrain)]) -> BarbarianMap {
    let mut map = BarbarianMap::new();
    for q in -3..=3 {
        for r in -3..=3 {
            let coordinate = BarbHex::new(q, r);
            if coordinate.distance(BarbHex::new(0, 0)) > 3 {
                continue;
            }
            let terrain = overrides
                .iter()
                .find(|(at, _)| *at == coordinate)
                .map_or(filler, |(_, terrain)| *terrain);
            map.insert(coordinate, BarbMapTile::new(terrain));
        }
    }
    map
}

#[test]
fn barbarian_camps_never_spawn_on_tundra() {
    // Every candidate hex is Tundra: no camp may be placed (behavioural,
    // through the real spawn path that calls `is_passable_land`).
    let all_tundra = barb_disc(BarbTerrain::Tundra, &[]);
    let spawned = spawn_camps(&all_tundra, &[], &[], &BarbParams::default(), 7);
    assert!(spawned.is_empty(), "camps spawned on Tundra: {spawned:?}");
}

#[test]
fn barbarian_camps_spawn_on_passable_land_next_to_tundra() {
    // One Plains hex inside a Tundra field: the only legal camp site.
    let plains_hex = BarbHex::new(2, 0);
    let map = barb_disc(BarbTerrain::Tundra, &[(plains_hex, BarbTerrain::Plains)]);
    let spawned = spawn_camps(&map, &[], &[], &BarbParams::default(), 7);
    assert_eq!(
        spawned.len(),
        1,
        "expected exactly one camp, got {spawned:?}"
    );
    assert_eq!(spawned[0].position(), plains_hex);
}

fn trade_disc(filler: TradeTerrain) -> TradeMap {
    let mut tiles = Vec::new();
    for q in -3..=3 {
        for r in -3..=3 {
            let coordinate = TradeHex::new(q, r);
            if coordinate.distance(TradeHex::new(0, 0)) > 3 {
                continue;
            }
            tiles.push((coordinate, filler));
        }
    }
    let mut map = TradeMap::from_tiles(tiles);
    // Both cities sit on grassland; the field between them is `filler`.
    map.insert(TradeHex::new(0, 0), TradeTerrain::Grassland);
    map.insert(TradeHex::new(2, 0), TradeTerrain::Grassland);
    map
}

#[test]
fn land_route_bfs_is_blocked_by_tundra_field() {
    // Real land-connection BFS (`bfs_path` with `is_land_passable`):
    // cities two hexes apart, everything between them is Tundra.
    let map = trade_disc(TradeTerrain::Tundra);
    let from = TradeCity::new("a", 1, 0, 0);
    let to = TradeCity::new("b", 2, 2, 0);
    let result = find_city_connection(&from, &to, &map, TradeRouteMedium::Land);
    assert!(
        !result.connected,
        "land route crossed a Tundra field: {result:?}"
    );
}

#[test]
fn land_route_bfs_crosses_desert_field() {
    // Control for the test above: identical geometry with Desert (passable)
    // must connect, so the failure above is caused by Tundra alone.
    let map = trade_disc(TradeTerrain::Desert);
    let from = TradeCity::new("a", 1, 0, 0);
    let to = TradeCity::new("b", 2, 2, 0);
    let result = find_city_connection(&from, &to, &map, TradeRouteMedium::Land);
    assert!(result.connected, "Desert field blocked route: {result:?}");
}

#[test]
fn owners_land_border_ignores_tundra_neighbour() {
    // Owner 1 holds (0,0), owner 2 holds the adjacent (1,0).
    let nodes = [
        TerritoryNode::new(1, 0, 0, 0),
        TerritoryNode::new(2, 1, 0, 0),
    ];

    let mut tundra_border = TradeMap::new(0, 0);
    tundra_border.insert(TradeHex::new(0, 0), TradeTerrain::Grassland);
    tundra_border.insert(TradeHex::new(1, 0), TradeTerrain::Tundra);
    assert!(
        !owners_have_shared_land_border(1, 2, &nodes, &tundra_border),
        "Tundra must not count as a shared passable land border"
    );

    // Control: same owners, neighbour is Grassland -> border exists.
    let mut grass_border = TradeMap::new(0, 0);
    grass_border.insert(TradeHex::new(0, 0), TradeTerrain::Grassland);
    grass_border.insert(TradeHex::new(1, 0), TradeTerrain::Grassland);
    assert!(owners_have_shared_land_border(1, 2, &nodes, &grass_border));
}
