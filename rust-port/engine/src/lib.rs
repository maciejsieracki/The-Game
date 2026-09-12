//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::building_costs::{
    building_cost, building_cost_for, building_work_cost, canonical_building_costs,
    effective_work_cost, spend_building_cost, try_spend_building_cost,
    validate_building_expenditure, BuildingCost, BuildingSpendError, BuildingSpendResult,
    ResourceStock,
};
pub use domain::{
    can_build_improvement, generate_map, improvement_production, production_for, qualifies,
    qualifies_improvement, resource_production, CanonicalState, CityDto, CityId, CityState,
    CivilizationDto, CivilizationState, ClimateBand, Deposit, EngineError, GameState, GameStateDto,
    GeneratedMap, HexCoord, HexTile, Improvement, ImprovementKey, MapDto, MapGenerator,
    MapGeneratorError, MapState, Mulberry32, Player, PlayerId, PositionDto, Production, Rng,
    RngError, Terrain, TerrainDto, TerrainType, Tile, TileDto, Turn, TurnDto, TurnState, UnitDto,
    UnitId, UnitKindDto, UnitState, ValidationError, WorldType,
};
