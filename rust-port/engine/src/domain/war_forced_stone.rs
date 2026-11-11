//! P6-FORCED-WAR-MODULES-Q1 (runda 1, partia G1): wojna wymuszona Kamienia z
//! `gra/src/game/forced-war-stone.ts` (pin `origin/main`), 1:1:
//! - stale `WOJNA_KAMIEN_WYMUSZONA_*` (:18-31; `..._CZAS_TRWANIA_TUR` nieuzywana w runtime, pominieta),
//! - `isEligibleForStoneForcedWar` (:44), `pickStoneForcedWarTargetId` (:61),
//! - `isRestingFromStoneForcedWar` (:75) -> deleguje do `is_resting_from_forced_war`.
//!
//! Wektory: `tests/p6_forced_war_g1_data/cases.json` (ta sama partia co `war_forced_common.rs`).

use std::collections::HashSet;

use crate::domain::war_forced_common::{
    is_resting_from_forced_war, pick_forced_war_target_id, ForcedWarNeighborCandidate,
};

/// Web `WOJNA_KAMIEN_WYMUSZONA_START_TURY` (forced-war-stone.ts:18).
pub const WOJNA_KAMIEN_WYMUSZONA_START_TURY: f64 = 40.0;
/// Web `WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE` (forced-war-stone.ts:19).
pub const WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE: i64 = 2;
/// Web `WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR` (forced-war-stone.ts:20).
pub const WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR: f64 = 20.0;
/// Web `WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR` (forced-war-stone.ts:21).
pub const WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR: f64 = 20.0;

/// Web `isEligibleForStoneForcedWar` (forced-war-stone.ts:44): wylacznie glowna cywilizacja AI,
/// w Kamieniu, od tury 25, bez wojny w dowolnej roli.
pub fn is_eligible_for_stone_forced_war(
    is_main_ai_civ: bool,
    is_already_at_war_any_role: bool,
    current_turn: f64,
    is_stone_era: bool,
) -> bool {
    is_main_ai_civ
        && is_stone_era
        && current_turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY
        && !is_already_at_war_any_role
}

/// Web `pickStoneForcedWarTargetId` (forced-war-stone.ts:61): deleguje do wspolnego wyboru celu.
pub fn pick_stone_forced_war_target_id(
    candidates: &[ForcedWarNeighborCandidate],
    reference_hex: Option<(i32, i32)>,
    hex_distance: impl Fn(i32, i32, i32, i32) -> i64,
    blocked_owner_ids: &HashSet<i64>,
) -> Option<i64> {
    pick_forced_war_target_id(candidates, reference_hex, hex_distance, blocked_owner_ids)
}

/// Web `isRestingFromStoneForcedWar` (forced-war-stone.ts:75).
pub fn is_resting_from_stone_forced_war(current_turn: f64, rest_until_turn: Option<f64>) -> bool {
    is_resting_from_forced_war(current_turn, rest_until_turn)
}
