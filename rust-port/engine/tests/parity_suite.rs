//! Public RustReal parity vectors.
//!
//! These tests are the checked-in, dependency-free parity contract for the
//! public engine surface.  The expected values are intentionally written as
//! vectors instead of derived from the implementation under test: changing a
//! random-consumption order, wire name, terrain rule, or economy ordering must
//! make a test fail.  Private implementation modules are not included here;
//! this suite must exercise the same public API that an adapter can consume.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::improvements::TerrainType as ImprovementTerrainType;
use civ_engine::domain::pathfinding::{
    find_path, movement_cost, path_cost, HexCoord as PathHexCoord, Improvement, MovementCost,
    PathMap, TerrainType as PathTerrainType, Tile as PathTile, COST_SCALE,
};
use civ_engine::domain::recruitment::{recruitment_for, spend_recruitment};
use civ_engine::domain::resource_production::{stack_resource_production, ResourceKey};
use civ_engine::domain::trade::{
    create_trade_route, find_city_connection, trade_route_id, trade_route_pair_key,
    HexCoord as TradeHexCoord, TerrainType as TradeTerrainType, TradeCity, TradeMap,
    TradeRouteMedium,
};
use civ_engine::domain::turn_economy::{EconomyBalances, EconomyFlow};
use civ_engine::{
    advance_city_growth, building_cost_for, generate_map, production_for, qualifies, resolve_turn,
    BuildingCost, CityDto, CityGrowthParams, CityGrowthState, CityId, CivilizationDto, Deposit,
    GameStateDto, HexCoord, ImprovementKey, MapDto, PlayerId, PositionDto, Production, Rng,
    Terrain, TerrainDto, TerrainType, Tile, TileDto, TurnDto, UnitDto, UnitId, UnitKindDto,
    WorldType,
};

#[test]
fn lcg_golden_vector_matches_the_typescript_stream() {
    let expected = [
        (1_083_814_273, 0.2523451747838408),
        (378_494_188, 0.08812504541128874),
        (2_479_403_867, 0.5772811982315034),
        (955_863_294, 0.22255426598712802),
        (1_613_448_261, 0.37566019711084664),
    ];

    let mut states = Rng::from_seed(42);
    for (expected_state, _) in expected {
        assert_eq!(states.next_u32(), expected_state);
        assert_eq!(states.state(), expected_state);
    }

    let mut values = Rng::from_seed(42);
    for (_, expected_value) in expected {
        assert_eq!(values.next_f64(), expected_value);
    }

    assert_eq!(
        Rng::from_seed(42).fork(7).state(),
        Rng::from_seed(42).fork(7).state()
    );
    assert_ne!(
        Rng::from_seed(42).fork(7).state(),
        Rng::from_seed(42).fork(8).state()
    );
}

#[test]
fn map_generator_golden_vector_matches_the_public_wire_contract() {
    let map = generate_map(12, 10, 42, WorldType::Continents).expect("valid dimensions");

    assert_eq!((map.width, map.height, map.seed), (12, 10, 42));
    assert_eq!(map.tiles.len(), 120);
    assert_eq!(map.terrain_counts(), [82, 30, 0, 1, 5, 2, 0, 0]);

    let sample: Vec<_> = [(0, 0), (2, 2), (5, 4), (7, 5), (10, 7), (11, 9)]
        .into_iter()
        .map(|(q, r)| map.tile(q, r).map(|tile| tile.terrain))
        .collect();
    assert_eq!(
        sample,
        vec![
            Some(Terrain::Sea),
            Some(Terrain::Sea),
            Some(Terrain::Hills),
            Some(Terrain::ShallowSea),
            Some(Terrain::Sea),
            Some(Terrain::Sea),
        ]
    );

    let repeated = generate_map(12, 10, 42, WorldType::Continents).expect("same vector");
    assert_eq!(map, repeated);
}

#[test]
fn hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs() {
    let origin = civ_engine::domain::hex::HexCoord::new(0, 0);
    let target = civ_engine::domain::hex::HexCoord::new(-2, 5);
    assert_eq!(origin.distance(target), 5);
    assert_eq!(
        origin.neighbors()[0],
        civ_engine::domain::hex::HexCoord::new(1, 0)
    );
    assert_eq!(
        origin.neighbors()[5],
        civ_engine::domain::hex::HexCoord::new(0, 1)
    );

    let plain = PathTile::new(PathTerrainType::Plains);
    let forest = plain.clone().with_forest(true);
    let road = plain.with_improvement(Improvement::Road);
    assert_eq!(movement_cost(&forest), Some(MovementCost::from_whole(2)));
    assert_eq!(
        movement_cost(&road).expect("road is passable").raw(),
        COST_SCALE / 3
    );
    assert!(movement_cost(&PathTile::new(PathTerrainType::Ocean)).is_none());

    let map = PathMap::from_tiles([
        (
            PathHexCoord::new(0, 0),
            PathTile::new(PathTerrainType::Grassland),
        ),
        (
            PathHexCoord::new(0, 1),
            PathTile::new(PathTerrainType::Grassland),
        ),
        (
            PathHexCoord::new(1, 1),
            PathTile::new(PathTerrainType::Grassland),
        ),
    ]);
    let path = find_path(
        &map,
        PathHexCoord::new(0, 0),
        PathHexCoord::new(1, 1),
        &BTreeSet::new(),
    )
    .expect("deterministic path exists");
    assert_eq!(path, vec![PathHexCoord::new(0, 1), PathHexCoord::new(1, 1)]);
    assert_eq!(path_cost(&map, &path), Some(MovementCost::from_whole(2)));
}

#[test]
fn improvements_and_resource_production_vectors_match_catalogue_rules() {
    let mut cattle = Tile::new(ImprovementTerrainType::Grassland);
    cattle.deposit = Some(Deposit::Cattle);
    assert!(qualifies(ImprovementKey::Trzoda, &cattle));

    let mut forest = Tile::new(ImprovementTerrainType::Grassland);
    forest.forest = true;
    assert!(!qualifies(ImprovementKey::Farm, &forest));
    assert!(qualifies(ImprovementKey::LumberMill, &forest));

    assert_eq!(
        production_for(ImprovementKey::Farm),
        Production {
            food: 3,
            work: 3,
            trade: 3,
            money: 0,
            clay: 0,
            stone: 0,
            resource: None,
            resource_amount: 0,
        }
    );

    let totals = stack_resource_production(["tartak", "tartak", "kamieniolom", "glinianka"], 3);
    assert_eq!(totals.amount_for(ResourceKey::Wood), 900);
    assert_eq!(totals.amount_for(ResourceKey::Stone), 450);
    assert_eq!(totals.amount_for(ResourceKey::Clay), 50);
    assert_eq!(totals.amount_for(ResourceKey::Gold), 0);
}

#[test]
fn building_and_recruitment_vectors_keep_purchase_and_work_costs_separate() {
    let canonical = building_cost_for("stolarnia").expect("canonical building");
    assert_eq!(
        (
            canonical.work_cost(1),
            canonical.work_cost(2),
            canonical.effective_work_cost(2)
        ),
        (20, 30, 15)
    );
    assert_eq!(canonical.resource_cost("drewno"), Some(25));

    let custom = BuildingCost::new("vector", 20, 10).with_resource_cost("drewno", 25);
    let mut work = 10;
    let mut stock = BTreeMap::from([(String::from("drewno"), 25)]);
    custom
        .try_spend(&mut work, &mut stock, 1)
        .expect("exact spend");
    assert_eq!(work, 0);
    assert_eq!(stock.get("drewno"), Some(&0));

    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    assert_eq!(warrior.gold_cost, 10);
    assert_eq!(warrior.gold_upkeep, 1);
    assert_eq!(warrior.stock_cost("drewno"), Some(50));
    assert_eq!(warrior.resource_upkeep("drewno"), Some(10));
    let remaining = spend_recruitment(&BTreeMap::from([(String::from("drewno"), 57)]), &warrior)
        .expect("purchase is affordable");
    assert_eq!(remaining.remaining_stock.get("drewno"), Some(&7));
}

#[test]
fn city_growth_vector_preserves_health_threshold_and_population_cap() {
    let city = CityGrowthState {
        population: 3,
        health: 10.0,
        food_store: 0,
        ..CityGrowthState::default()
    };
    let result = advance_city_growth(&city, 46.0, &CityGrowthParams::normal());

    assert_eq!(result.population, 4);
    assert_eq!(result.food_store, 0);
    assert!(result.grew);
    assert!(!result.growth_frozen);
    assert_eq!(result.population_cap, 5);
    assert_eq!(result.growth_threshold, 68);
}

#[test]
fn turn_economy_vector_credits_before_spending_and_resets_work() {
    let balances = EconomyBalances {
        treasury: 10,
        science: 1,
        culture: 2,
        food: 3,
        work: 4,
        resources: BTreeMap::from([(String::from("wood"), 5)]),
    };
    let income = EconomyFlow {
        treasury: 20,
        science: 4,
        culture: 3,
        food: 10,
        work: 6,
        resources: BTreeMap::from([(String::from("wood"), 4)]),
    };
    let expenses = EconomyFlow {
        treasury: 25,
        science: 4,
        culture: 3,
        food: 10,
        work: 7,
        resources: BTreeMap::from([(String::from("wood"), 6), (String::from("stone"), 1)]),
    };

    let settlement = resolve_turn(4, &balances, income, &expenses).expect("valid turn");
    assert_eq!((settlement.turn, settlement.next_turn), (4, 5));
    assert_eq!(settlement.work_reset, 3);
    assert_eq!(settlement.paid.work, 7);
    assert_eq!(settlement.unpaid.resources.get("stone"), Some(&1));
    assert_eq!(settlement.after.treasury, 5);
    assert_eq!(settlement.after.science, 1);
    assert_eq!(settlement.after.culture, 2);
    assert_eq!(settlement.after.food, 3);
    assert_eq!(settlement.after.work, 0);
    assert_eq!(settlement.after.resource("wood"), 3);
}

#[test]
fn trade_route_vector_uses_stable_hex_path_and_wire_identity() {
    let mut map = TradeMap::new(5, 1);
    for q in 0..5 {
        map.insert(TradeHexCoord::new(q, 0), TradeTerrainType::Plains);
    }
    let from = TradeCity::new("from", 1, 0, 0);
    let to = TradeCity::new("to", 2, 4, 0);

    let connection = find_city_connection(&from, &to, &map, TradeRouteMedium::Land);
    assert!(connection.connected);
    assert_eq!(connection.distance, 4);
    assert_eq!(connection.path_hexes.first(), Some(&String::from("0,0")));
    assert_eq!(connection.path_hexes.last(), Some(&String::from("4,0")));

    let route = create_trade_route(&from, &to, &map, TradeRouteMedium::Land);
    assert_eq!(route.id, "from->to:lad");
    assert!(route.is_connected());
    assert_eq!(
        trade_route_id("from", "to", TradeRouteMedium::Land),
        "from->to:lad"
    );
    assert_eq!(trade_route_pair_key("to", "from"), "from~to");
}

#[test]
fn canonical_state_dto_vector_round_trips_through_json() {
    let map = MapDto::new(
        2,
        1,
        vec![
            TileDto::new(PositionDto::new(0, 0), TerrainDto::Plains),
            TileDto::new(PositionDto::new(1, 0), TerrainDto::Hills),
        ],
    )
    .expect("map is valid");
    let civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(8)],
    )
    .expect("civilization is valid");
    let city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city is valid");
    let unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit is valid");
    let state = GameStateDto::new(
        map,
        vec![civilization],
        vec![city],
        vec![unit],
        TurnDto::new(3).expect("turn is valid"),
    )
    .expect("state is valid");

    let encoded = serde_json::to_string(&state).expect("state serializes");
    let decoded: GameStateDto = serde_json::from_str(&encoded).expect("state deserializes");
    assert_eq!(decoded, state);
}

#[test]
fn public_engine_wire_aliases_are_stable() {
    assert_eq!(
        serde_json::to_string(&WorldType::Continents).unwrap(),
        "\"kontynenty\""
    );
    assert_eq!(
        serde_json::to_string(&TerrainType::ShallowWater).unwrap(),
        "\"plytkie_morze\""
    );
    assert_eq!(
        serde_json::to_string(&PathTerrainType::ShallowWater).unwrap(),
        "\"shallow_water\""
    );
}

// Keep this small compile-time use of the map-generator coordinate type in the
// suite: adapters must not accidentally substitute the pathfinding coordinate.
#[test]
fn map_generator_coordinate_vector_is_distinct_and_serializable() {
    let coordinate = HexCoord::new(2, -5);
    assert_eq!(
        serde_json::to_string(&coordinate).unwrap(),
        r#"{"q":2,"r":-5}"#
    );
}
