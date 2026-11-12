//! P6-UNIT-REPLACE-L3-KOSZT (dlug L-3, etap 4): parytet kosztu Pieniadza i max_hp po zamianie.
//!
//! Lancuch weba (pin 07d2fbd72):
//! - `replaceUnitMoneyCost(typeId)` (`gra/src/main.ts:7913`) =
//!   `unitProductionItem(typeId, data, civBonusyForOwnerId(0), kosztJednostekPace ?? 'niski', 0, _menuDifficulty).koszt`
//!   (`gra/src/game/production.ts:443`) -> `unitMoneyCost` (`production.ts:625`): rabat cywilizacji
//!   (`civRecruitmentDiscount` 674, `civMatrixCostDiscount` 644), tempo (`unit-cost-tempo.ts` `applyUnitCostPace`)
//!   i trudnosc (`difficulty-cost.ts` `applyDifficultyCostMultiplier`).
//!   Port: `building_costs::repin_b2::unit_money_cost_web` (wektory B2 z pinu 91dc998a; funkcje kosztu
//!   nie zmienione do 07d2fbd72 - potwierdzone `git diff` na hunkach production.ts).
//! - `newMaxHp(u, newTypeId)` (`main.ts:8138`, `main.ts:7548`) = `effectiveMaxHp(unitHealth(newDef),
//!   unitParametryBonusFrac(u), veteranCombatBonusFrac(u))` (`unit-card-stats.ts:79`, `main.ts:33093`).
//!   Port: `unit_health::effective_max_hp` + `unit_health_value` (klucz `health`) + `veteran_combat_bonus_frac`
//!   + `combat::unit_building_bonuses::unit_parametry_bonus_frac`.
//! - `oldMaxHp` (`main.ts:8137`) = `effectiveRuntimeUnitMaxHp(u, def)` (`main.ts:33101`): ta sama formula
//!   z bazowym HP starego typu i bonusami tej samej jednostki.
//!
//! Ten modul tylko sklada porty; nie dodaje nowej logiki liczbowej.

use crate::domain::building_costs::repin_b2::{unit_money_cost_web, CostMarker};
use crate::domain::combat::unit_building_bonuses::{
    unit_parametry_bonus_frac, UnitBuildingProgress,
};
use crate::domain::recruitment::army_merge::UnitCostPace;
use crate::domain::types::Difficulty;
use crate::domain::unit_health::{effective_max_hp, veteran_combat_bonus_frac};

/// Postep jednostki wplywajacy na max HP (web: `u.parametryBonusProc`, `u.battlesSurvived`).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct ReplaceUnitProgress {
    /// Web `parametryBonusProc` (`None` = pole nieobecne; liczone jak 0).
    pub parametry_bonus_proc: Option<f64>,
    /// Web `battlesSurvived` (`None` = pole nieobecne; liczone jak 0).
    pub battles_survived: Option<f64>,
}

/// Kontekst wlasciciela kosztu zamiany (web: `civBonusyForOwnerId(owner)`, `kosztJednostekPace`,
/// `_menuDifficulty`, `ownerId`).
#[derive(Debug, Clone, Copy)]
pub struct ReplaceCostContext<'a> {
    /// Markery macierzy cywilizacji wlasciciela (web `civBonusy`).
    pub markers: &'a [CostMarker<'a>],
    /// Tempo kosztu rekrutacji (web `kosztJednostekPace`); `None` = brak tempa.
    pub pace: Option<UnitCostPace<'a>>,
    /// Wlasciciel (web `ownerId`; zamiana gracza = 0).
    pub owner_id: i64,
    /// Trudnosc (web `_menuDifficulty`).
    pub difficulty: Difficulty,
}

/// Web `replaceUnitMoneyCost(typeId)` po podstawieniu bazy: `base_cost` = koszt bazowy nowego typu
/// po skali epoki (web `itemCost('jednostka', name, data, 1)`), `unit_name` = web `Jednostka`.
pub fn replace_money_cost(base_cost: f64, unit_name: &str, ctx: &ReplaceCostContext<'_>) -> f64 {
    unit_money_cost_web(
        base_cost,
        ctx.markers,
        ctx.pace,
        ctx.owner_id,
        ctx.difficulty,
        Some(unit_name),
    )
}

/// Web `effectiveMaxHp(unitHealth(def), unitParametryBonusFrac(u), veteranCombatBonusFrac(u))`.
/// `base_health` = `unit_health_value(def)` (klucz `health`, fallback 30).
pub fn replace_max_hp(base_health: f64, progress: ReplaceUnitProgress) -> f64 {
    let bonus = UnitBuildingProgress {
        pancerz_bonus_proc: None,
        parametry_bonus_proc: progress.parametry_bonus_proc,
    };
    effective_max_hp(
        base_health,
        unit_parametry_bonus_frac(Some(&bonus)),
        veteran_combat_bonus_frac(progress.battles_survived),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bez_postepu_max_hp_to_baza_zaokraglona() {
        assert_eq!(replace_max_hp(22.0, ReplaceUnitProgress::default()), 22.0);
    }

    #[test]
    fn weteran_i_parametry_dodawane_przed_jednym_mnozeniem() {
        // 22 * (1 + 0.20 + 0.20) = 30.8 (nie 22 * 1.2 * 1.2 = 31.68).
        let progress = ReplaceUnitProgress {
            parametry_bonus_proc: Some(20.0),
            battles_survived: Some(3.0),
        };
        assert_eq!(replace_max_hp(22.0, progress), 30.8);
    }
}
