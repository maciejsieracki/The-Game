//! P6-FORCED-WAR-MODULES-Q1 (runda 2, partia G2b): wojna wymuszona Zelaza z
//! `gra/src/game/forced-war-iron.ts` (pin `origin/main`), funkcje czyste 1:1:
//! - stale `WOJNA_ZELAZO_WYMUSZONA_*` i `EPOKA_ZELAZO_NUMER` (3); start tury od epoki = 20 z JSON
//!   (`ERA_FORCED_WAR_START_TURNS_IRON`),
//! - `isEligibleForIronForcedWar`, `isIronEraEntry` (`prev < 3 && next >= 3`),
//!   `pickIronForcedWarTargetId`, `isRestingFromIronForcedWar`,
//! - save/load: deleguje do `war_forced_pairing` (ta sama logika co web `restoreForcedWarState`).
//!
//! Wektory: `tests/p6_forced_war_g2_data/cases.json`.

use std::collections::HashSet;

use crate::domain::diplomacy_multiwar_gate::ERA_FORCED_WAR_START_TURNS_IRON;
use crate::domain::war_forced_common::{
    is_resting_from_forced_war, pick_forced_war_target_id, ForcedWarNeighborCandidate,
};
use crate::domain::war_forced_pairing::{
    restore_forced_war_state, serialize_forced_war_state, ForcedWarSavePartial, ForcedWarSaveState,
};

/// Web `EPOKA_ZELAZO_NUMER` (`kamien:1, braz:2, zelazo:3`).
pub const EPOKA_ZELAZO_NUMER: i64 = 3;
/// Web `WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE`.
pub const WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE: i64 = 2;
/// Web `WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` -- NIEUZYWANA w runtime (zachowana dla testow).
pub const WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR: f64 = 20.0;
/// Web `WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR`.
pub const WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR: f64 = 20.0;
/// Web `WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR`.
pub const WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR: f64 = 20.0;
/// Web `WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI` = `WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.iron` (JSON).
pub const WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI: f64 = ERA_FORCED_WAR_START_TURNS_IRON;

/// Web `IronForcedWarEligibilityInput` (pola opcjonalne jak w webie).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct IronForcedWarEligibilityInput {
    pub is_main_ai_civ: bool,
    pub is_already_at_war_any_role: bool,
    pub current_turn: Option<f64>,
    pub era_enter_turn: Option<f64>,
}

/// Web `isEligibleForIronForcedWar` (forced-war-iron.ts).
pub fn is_eligible_for_iron_forced_war(inp: &IronForcedWarEligibilityInput) -> bool {
    let turn_threshold_met = match (inp.current_turn, inp.era_enter_turn) {
        (Some(cur), Some(enter)) => cur - enter >= WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI,
        _ => true,
    };
    inp.is_main_ai_civ && !inp.is_already_at_war_any_role && turn_threshold_met
}

/// Web `isIronEraEntry` (forced-war-iron.ts): wejscie do Zelaza = `prev < 3 && next >= 3`.
pub fn is_iron_era_entry(prev_era: i64, next_era: i64) -> bool {
    prev_era < EPOKA_ZELAZO_NUMER && next_era >= EPOKA_ZELAZO_NUMER
}

/// Web `pickIronForcedWarTargetId` (forced-war-iron.ts).
pub fn pick_iron_forced_war_target_id(
    candidates: &[ForcedWarNeighborCandidate],
    reference_hex: Option<(i32, i32)>,
    hex_distance: impl Fn(i32, i32, i32, i32) -> i64,
    blocked_owner_ids: &HashSet<i64>,
) -> Option<i64> {
    pick_forced_war_target_id(candidates, reference_hex, hex_distance, blocked_owner_ids)
}

/// Web `isRestingFromIronForcedWar` (forced-war-iron.ts).
pub fn is_resting_from_iron_forced_war(current_turn: f64, rest_until_turn: Option<f64>) -> bool {
    is_resting_from_forced_war(current_turn, rest_until_turn)
}

/// Web `serializeIronForcedWarState` (forced-war-iron.ts).
pub fn serialize_iron_forced_war_state(state: &ForcedWarSaveState) -> ForcedWarSaveState {
    serialize_forced_war_state(state)
}

/// Web `restoreIronForcedWarState` (forced-war-iron.ts).
pub fn restore_iron_forced_war_state(saved: Option<&ForcedWarSavePartial>) -> ForcedWarSaveState {
    restore_forced_war_state(saved)
}
