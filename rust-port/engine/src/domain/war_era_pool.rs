//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 558, ERAPOOL): pula celow wojny epoki GRACZA.
//!
//! Port 1:1 z `gra/src/game/war-rules-multiwar.ts` (pin `origin/main` 14f2af1b0):
//! - `forcedEraTagEpoch` (:255), `forcedEraTagForEpoch` (:263), `eraWarCounterEpoch` (:272),
//! - `isPlayerEligibleForEraWarPool` (:295), `isPlayerEraWarSlotFree` (:314).
//!
//! Progi `eraForcedWarStartTurnsFromEra` (bronze/iron = 40) i limit licznika per (cywilizacja, epoka)
//! (`maxEraForcedWarsPerCivPerEra` = 1) pochodza z juz zportowanych stalych (`diplomacy_multiwar*`).
//! Odstepstwo: web przyjmuje `params: WarRulesParams`; tu progi sa stalymi (jedyny wariant z JSON).

use std::collections::HashMap;

use crate::domain::diplomacy_multiwar::{
    can_civ_join_era_forced_war, ForcedEraTag, ERA_WAR_PARAMS,
};
use crate::domain::diplomacy_multiwar_gate::{
    ERA_FORCED_WAR_START_TURNS_BRONZE, ERA_FORCED_WAR_START_TURNS_IRON,
};

/// Web `forcedEraTagEpoch` (war-rules-multiwar.ts:255): stone=1, bronze=2, iron=3; brak = `None`.
pub fn forced_era_tag_epoch(tag: Option<ForcedEraTag>) -> Option<i64> {
    match tag {
        Some(ForcedEraTag::Stone) => Some(1),
        Some(ForcedEraTag::Bronze) => Some(2),
        Some(ForcedEraTag::Iron) => Some(3),
        None => None,
    }
}

/// Web `forcedEraTagForEpoch` (war-rules-multiwar.ts:263): 1 -> stone, 2 -> bronze, 3 -> iron, inaczej `None`.
pub fn forced_era_tag_for_epoch(epoch: i64) -> Option<ForcedEraTag> {
    match epoch {
        1 => Some(ForcedEraTag::Stone),
        2 => Some(ForcedEraTag::Bronze),
        3 => Some(ForcedEraTag::Iron),
        _ => None,
    }
}

/// Web `eraWarCounterEpoch` (war-rules-multiwar.ts:272): bez etykiety = epoka wlasciciela, inaczej `min`.
pub fn era_war_counter_epoch(tag_epoch: Option<i64>, owner_epoch: i64) -> i64 {
    match tag_epoch {
        None => owner_epoch,
        Some(t) => owner_epoch.min(t),
    }
}

/// Web `PlayerEraWarPoolInput` (war-rules-multiwar.ts:276).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PlayerEraWarPoolInput {
    pub current_turn: f64,
    /// Biezaca epoka gracza.
    pub player_epoch: i64,
    /// Aktywne wojny wymuszone gracza - wszystkie epoki.
    pub active_forced_wars_total: i64,
    /// Aktywne wojny wymuszone gracza TEJ SAMEJ epoki co biezaca.
    pub active_forced_wars_in_player_era: i64,
    /// Tura wejscia gracza w biezaca epoke; `None` (brak) = prog pominiety.
    pub era_enter_turn: Option<f64>,
    /// Najwczesniejsza tura puli gracza (WOJNA_KAMIEN_WYMUSZONA_START_TURY).
    pub pool_start_turn: f64,
}

/// Prog `eraForcedWarStartTurnsFromEra[tag]` dla bronze/iron (stone nie dochodzi do progu).
fn era_forced_war_start_turns(tag: ForcedEraTag) -> f64 {
    match tag {
        ForcedEraTag::Bronze => ERA_FORCED_WAR_START_TURNS_BRONZE,
        ForcedEraTag::Iron => ERA_FORCED_WAR_START_TURNS_IRON,
        ForcedEraTag::Stone => 0.0,
    }
}

/// Web `isPlayerEligibleForEraWarPool` (war-rules-multiwar.ts:295): czy gracz wchodzi do puli celow.
/// Kamien / epoki > 3: tylko gdy brak jakiejkolwiek wojny wymuszonej. Brąz/Zelazo: liczy sie tylko
/// wojna TEJ SAMEJ epoki oraz prog od wejscia gracza w epoke.
pub fn is_player_eligible_for_era_war_pool(inp: &PlayerEraWarPoolInput) -> bool {
    if inp.current_turn < inp.pool_start_turn {
        return false;
    }
    match forced_era_tag_for_epoch(inp.player_epoch) {
        None | Some(ForcedEraTag::Stone) => inp.active_forced_wars_total == 0,
        Some(tag) => {
            if inp.active_forced_wars_in_player_era != 0 {
                return false;
            }
            match inp.era_enter_turn {
                None => true,
                Some(enter) => inp.current_turn - enter >= era_forced_war_start_turns(tag),
            }
        }
    }
}

/// Web `isPlayerEraWarSlotFree` (war-rules-multiwar.ts:314): slot licznika gracza dla epoki wojny
/// tagu AI wolny (`eraWarCounterEpoch(epoka tagu, epoka gracza)`). AI bez tagu epoki -> `false`.
pub fn is_player_era_war_slot_free(
    counts: &HashMap<String, i64>,
    ai_epoch: i64,
    player_epoch: i64,
) -> bool {
    let Some(tag) = forced_era_tag_for_epoch(ai_epoch) else {
        return false;
    };
    let counter_epoch = era_war_counter_epoch(forced_era_tag_epoch(Some(tag)), player_epoch);
    can_civ_join_era_forced_war(
        counts,
        0,
        counter_epoch,
        ERA_WAR_PARAMS.max_era_forced_wars_per_civ_per_era,
    )
}
