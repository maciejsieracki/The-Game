//! Domain building blocks shared by future engine systems.

pub mod ai_era_unit_promotion;
pub mod ai_general_war_campaign;
pub mod ai_move_range;
pub mod ai_peace_city_offer;
pub mod ai_resource_needs;
pub mod ai_zakup_jednostki;
pub mod alliance_war_obligation;
pub mod army_consolidation;
pub mod army_follow_auto_merge;
pub mod army_leadership;
pub mod auto_improvements;
pub mod barbarians;
pub mod battle_mode;
pub mod building_costs;
pub mod city_growth;
pub mod city_names;
pub mod civ_bonuses;
pub mod civ_matrix;
pub mod civ_names;
pub mod combat;
pub mod diplomacy;
pub mod diplomacy_aggressor;
pub mod diplomacy_ai_forced_peace;
pub mod diplomacy_locks;
pub mod diplomacy_multiwar;
pub mod diplomacy_multiwar_gate;
pub mod diplomacy_multiwar_peace;
pub mod diplomacy_nap_trust;
pub mod diplomacy_rejection_cooldown;
pub mod diplomacy_siege_war_gate;
pub mod diplomacy_tick_war_brake;
pub mod diplomacy_truce;
pub mod diplomacy_truce_end;
pub mod diplomacy_truce_flow;
pub mod diplomacy_war_gates;
pub mod diplomacy_war_peace_profile;
pub mod diplomacy_war_weariness_tick;
pub mod economy_city_fns;
pub mod economy_city_params;
pub mod economy_city_terrain;
pub mod economy_yield;
mod error;
pub mod events;
pub mod formation_rules;
pub mod fort_territory;
pub mod freshwater;
pub mod general_quick_follow;
pub mod generals;
pub mod hex;
mod ids;
pub mod improvement_build;
pub mod improvements;
pub mod map_generator;
pub mod map_snapshot;
pub mod mapgen;
pub mod okolica;
pub mod order_effects_culture;
pub mod order_effects_lane;
pub mod pathfinding;
pub mod playable;
pub mod player;
pub mod production_queue;
pub mod production_units;
pub mod recruitment;
pub mod resource_access;
pub mod resource_production;
pub mod rng;
pub mod roads;
pub mod save_migrations;
mod session;
pub mod siege_engine_build;
pub mod siege_enter_city;
pub mod siege_nearby_lock;
pub mod siege_no_breach;
pub mod siege_sortie;
pub mod siege_starvation;
pub mod society_breakdown;
pub mod start_position;
mod state;
pub mod terrain;
pub mod territory;

pub mod trade;
pub mod trade_flow_apply;
pub mod turn_economy;
pub mod turn_economy_advance;
pub mod turn_economy_attrition;
pub mod turn_economy_empirefood;
pub mod turn_economy_health;
pub mod turn_economy_inputs_civ;
pub mod turn_economy_inputs_native;
pub mod turn_economy_inputs_podzial;
pub mod turn_economy_inputs_state;
pub mod turn_economy_inputs_trade;
pub mod turn_economy_inputs_wonders;
pub mod turn_economy_loop;
pub mod turn_economy_post;
pub mod turn_economy_preview;
pub mod turn_economy_resources;
pub mod turn_economy_territory;
pub mod turn_economy_tick;
pub mod turn_economy_upkeep;
pub mod turn_economy_wire;
pub mod types;
pub mod unit_epoch;
pub mod unit_health;
pub mod unit_power;
pub mod war_all_in_capital;
pub mod war_all_in_capital_nav;
pub mod war_all_in_capital_plan;
pub mod war_city_founder;
pub mod war_era_pool;
pub mod war_forced_bronze;
pub mod war_forced_common;
pub mod war_forced_iron;
pub mod war_forced_pairing;
pub mod war_forced_stone;
pub mod war_forced_trigger;
pub mod war_forced_waves;
pub mod war_home_defense;
pub mod war_home_defense_plan;
pub mod war_rules_multiwar;
pub mod war_target_select;
pub mod war_turn_declare;
pub mod war_turn_forced;
pub mod war_turn_state;
pub mod war_world_view;
pub mod wonder_placement;
pub mod work_tax;

pub use error::EngineError;
pub use events::{canonical_phase_order, phase_order, TurnEvent, TurnPhase, PHASE_COUNT};
pub use ids::{CampId, CityId, OwnerRef, PlayerId, UnitId};
pub use improvements::{
    can_build_improvement, improvement_production, production_for, qualifies,
    qualifies_improvement, Deposit, Improvement, ImprovementKey, Production, TerrainType, Tile,
};
pub use map_generator::{
    generate_map, ClimateBand, GeneratedMap, HexCoord, HexTile, MapGenerator, MapGeneratorError,
    Mulberry32, Terrain, WorldType,
};
pub use playable::{
    PlayableAdvancedParams, PlayableCity, PlayableError, PlayableGame, PlayableMap, PlayablePlayer,
    PlayableState, PlayableTerrain, PlayableTile, PlayableUnit, PlayableUnitKind,
    PlayableWorldDensity, StartGameParams, PLAYABLE_STATE_VERSION,
};
pub use player::Player;
pub use rng::{Rng, RngError};
pub use session::{GameState, Turn};
pub use state::{
    CanonicalState, CityState, CivilizationState, GameStateDto, MapState, TurnState, UnitState,
};
pub use types::{
    CityDto, CivilizationDto, Difficulty, MapDto, PositionDto, TerrainDto, TileDto, TurnDto,
    UnitDto, UnitKindDto, ValidationError,
};
