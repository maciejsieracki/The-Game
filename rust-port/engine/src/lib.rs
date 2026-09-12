//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::building_costs::{
    building_cost, building_cost_for, building_work_cost, canonical_building_costs,
    effective_work_cost, spend_building_cost, try_spend_building_cost,
    validate_building_expenditure, BuildingCost, BuildingSpendError, BuildingSpendResult,
    ResourceStock,
};
pub use domain::recruitment::{
    can_afford_recruitment, can_afford_unit_recruitment, canonical_recruitment_costs,
    recruitment_for, spend_recruitment, total_resource_upkeep, unit_recruitment,
    unit_resource_upkeep_for_turns, validate_recruitment, RecruitmentError, RecruitmentSpendResult,
    UnitRecruitment,
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
