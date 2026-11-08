//! P6-FORCED-WAR-MODULES-Q1 (runda 2, partia G2b): wojna wymuszona Brazu z
//! `gra/src/game/forced-war-bronze.ts` (pin `origin/main`), funkcje czyste 1:1:
//! - stale `WOJNA_WYMUSZONA_*` (progi z `war-rules-params.json`: start tury od epoki = 20 ->
//!   `ERA_FORCED_WAR_START_TURNS_BRONZE`),
//! - `isEligibleForBronzeForcedWar` (:~143), `pickBronzeForcedWarTargetId` (:~190),
//!   `isRestingFromBronzeForcedWar` (:~215),
//! - save/load: `serializeBronzeForcedWarState` / `restoreBronzeForcedWarState` (deleguja do
//!   `war_forced_pairing`, identyczna logika w webie: `serializeForcedWarState` / `restoreForcedWarState`).
//!
//! Wektory: `tests/p6_forced_war_g2_data/cases.json`. Odleglosc heksowa wstrzykiwana.

use std::collections::HashSet;

use crate::domain::diplomacy_multiwar_gate::ERA_FORCED_WAR_START_TURNS_BRONZE;
use crate::domain::war_forced_common::{
    is_resting_from_forced_war, pick_forced_war_target_id, ForcedWarNeighborCandidate,
};
use crate::domain::war_forced_pairing::{
    restore_forced_war_state, serialize_forced_war_state, ForcedWarSavePartial, ForcedWarSaveState,
};

/// Web `WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE` (forced-war-bronze.ts).
pub const WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE: i64 = 2;
/// Web `WOJNA_WYMUSZONA_ODPOCZYNEK_TUR`.
pub const WOJNA_WYMUSZONA_ODPOCZYNEK_TUR: f64 = 20.0;
/// Web `WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR` (ROBOCZE ZALOZENIE w webie).
pub const WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR: f64 = 20.0;
/// Web `WOJNA_WYMUSZONA_START_TURY_OD_EPOKI` = `WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.bronze` (JSON).
pub const WOJNA_WYMUSZONA_START_TURY_OD_EPOKI: f64 = ERA_FORCED_WAR_START_TURNS_BRONZE;
/// Web `WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` -- NIEUZYWANA w runtime (zachowana jak w webie dla testow).
pub const WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR: f64 = 20.0;

/// Web `BronzeForcedWarEligibilityInput`. `current_turn` / `era_enter_turn` = `undefined` -> `None`
/// (wtedy prog tury pomijany CALKOWICIE, jak w webie).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BronzeForcedWarEligibilityInput {
    pub is_main_ai_civ: bool,
    pub is_already_at_war_any_role: bool,
    pub current_turn: Option<f64>,
    pub era_enter_turn: Option<f64>,
}

/// Web `isEligibleForBronzeForcedWar` (forced-war-bronze.ts).
pub fn is_eligible_for_bronze_forced_war(inp: &BronzeForcedWarEligibilityInput) -> bool {
    let turn_threshold_met = match (inp.current_turn, inp.era_enter_turn) {
        (Some(cur), Some(enter)) => cur - enter >= WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
        _ => true,
    };
    inp.is_main_ai_civ && !inp.is_already_at_war_any_role && turn_threshold_met
}

/// Web `pickBronzeForcedWarTargetId` (forced-war-bronze.ts): najblizszy niezablokowany kandydat.
pub fn pick_bronze_forced_war_target_id(
    candidates: &[ForcedWarNeighborCandidate],
    reference_hex: Option<(i32, i32)>,
    hex_distance: impl Fn(i32, i32, i32, i32) -> i64,
    blocked_owner_ids: &HashSet<i64>,
) -> Option<i64> {
    pick_forced_war_target_id(candidates, reference_hex, hex_distance, blocked_owner_ids)
}

/// Web `isRestingFromBronzeForcedWar` (forced-war-bronze.ts).
pub fn is_resting_from_bronze_forced_war(current_turn: f64, rest_until_turn: Option<f64>) -> bool {
    is_resting_from_forced_war(current_turn, rest_until_turn)
}

/// Web `serializeBronzeForcedWarState` (forced-war-bronze.ts) -> ta sama logika co wspolna serializacja.
pub fn serialize_bronze_forced_war_state(state: &ForcedWarSaveState) -> ForcedWarSaveState {
    serialize_forced_war_state(state)
}

/// Web `restoreBronzeForcedWarState` (forced-war-bronze.ts) -> ta sama logika co wspolna restauracja.
pub fn restore_bronze_forced_war_state(saved: Option<&ForcedWarSavePartial>) -> ForcedWarSaveState {
    restore_forced_war_state(saved)
}
