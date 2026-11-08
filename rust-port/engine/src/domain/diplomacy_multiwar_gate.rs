//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 4): port 1:1 z webem (pin `origin/main` a61337844)
//! bramki R1/R2 wojny miedzy cywilizacjami i `pickPlayerReferenceCity`:
//! - `gra/src/game/war-rules-multiwar.ts:82` `isInterCivWarOpenAtTurn`,
//! - `gra/src/game/war-rules-multiwar.ts:90` `concurrentWarLimitForEra`,
//! - `gra/src/game/war-rules-multiwar.ts:119` `evaluateInterCivWarGate`,
//! - `gra/src/game/war-rules-multiwar.ts:292` `pickPlayerReferenceCity`.
//!
//! Parametry sa literalami z `gra/data/war-rules-params.json` (pin a61337844):
//! delayInterCivWarsUntilTurn=40, maxConcurrentWarsStone=1, maxConcurrentWarsFromBronze=null.

/// Web `WAR_RULES_PARAMS.delayInterCivWarsUntilTurn` (R1).
pub const DELAY_INTER_CIV_WARS_UNTIL_TURN: f64 = 40.0;
/// Web `WAR_RULES_PARAMS.maxConcurrentWarsStone` (R2, epoka Kamienia).
pub const MAX_CONCURRENT_WARS_STONE: Option<i64> = Some(1);
/// Web `WAR_RULES_PARAMS.maxConcurrentWarsFromBronze` (R2, od Brazu; `None` = bez limitu).
pub const MAX_CONCURRENT_WARS_FROM_BRONZE: Option<i64> = None;

/// Web `isInterCivWarOpenAtTurn`: `turn >= delayInterCivWarsUntilTurn` (NaN -> false).
pub fn is_inter_civ_war_open_at_turn(turn: f64) -> bool {
    turn >= DELAY_INTER_CIV_WARS_UNTIL_TURN
}

/// Web `concurrentWarLimitForEra`: tylko epoka 1 (Kamien, `===`) ma limit; reszta `null`.
pub fn concurrent_war_limit_for_era(era: f64) -> Option<i64> {
    if era == 1.0 {
        MAX_CONCURRENT_WARS_STONE
    } else {
        MAX_CONCURRENT_WARS_FROM_BRONZE
    }
}

/// Web `WarGateReason`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WarGateReason {
    Ok,
    DelayR1,
    StoneLimitAttackerR2,
    StoneLimitTargetR2,
}

impl WarGateReason {
    /// Wartosc tekstowa z webu.
    pub fn as_web_str(self) -> &'static str {
        match self {
            WarGateReason::Ok => "ok",
            WarGateReason::DelayR1 => "delay_r1",
            WarGateReason::StoneLimitAttackerR2 => "stone_limit_attacker_r2",
            WarGateReason::StoneLimitTargetR2 => "stone_limit_target_r2",
        }
    }
}

/// Web `InterCivWarGateInput`.
#[derive(Debug, Clone, Copy)]
pub struct InterCivWarGateInput {
    pub turn: f64,
    pub attacker_era: f64,
    pub attacker_war_count: i64,
    pub target_is_player: bool,
    pub target_era: f64,
    pub target_war_count: i64,
}

/// Web `evaluateInterCivWarGate`: R1, potem limit napastnika, potem limit celu
/// (cel-gracz bez limitu; limit celu pomijany dla `target_is_player`).
pub fn evaluate_inter_civ_war_gate(inp: &InterCivWarGateInput) -> WarGateReason {
    if !is_inter_civ_war_open_at_turn(inp.turn) {
        return WarGateReason::DelayR1;
    }
    if let Some(limit) = concurrent_war_limit_for_era(inp.attacker_era) {
        if inp.attacker_war_count >= limit {
            return WarGateReason::StoneLimitAttackerR2;
        }
    }
    if !inp.target_is_player {
        if let Some(limit) = concurrent_war_limit_for_era(inp.target_era) {
            if inp.target_war_count >= limit {
                return WarGateReason::StoneLimitTargetR2;
            }
        }
    }
    WarGateReason::Ok
}

/// Web `pickPlayerReferenceCity`: stolica gracza (dopasowanie id i wlasciciela), a gdy brak,
/// pierwsze miasto gracza. `capital_city_id = None` (web: null/undefined) nie dopasowuje miasta.
pub fn pick_player_reference_city<'a, T>(
    cities: &'a [T],
    id_of: impl Fn(&T) -> &str,
    owner_of: impl Fn(&T) -> i64,
    capital_city_id: Option<&str>,
    player_owner_id: i64,
) -> Option<&'a T> {
    let by_capital = capital_city_id.and_then(|cap| {
        cities
            .iter()
            .find(|c| id_of(c) == cap && owner_of(c) == player_owner_id)
    });
    by_capital.or_else(|| cities.iter().find(|c| owner_of(c) == player_owner_id))
}
