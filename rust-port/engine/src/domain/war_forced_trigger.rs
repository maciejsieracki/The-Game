//! P6-FORCED-WAR-MODULES-Q1 (runda 4, partia G3b): decyzje timera/triggera wojny wymuszonej z
//! `gra/src/main.ts` (pin `origin/main`) wyniesione jako FUNKCJE CZYSTE:
//! - `should_search_bronze` / `should_search_stone` / `should_search_iron` = replika warunku
//!   "szukaj" per wlasciciel (ownerLoop, sekcja "Krok A", main.ts ~38870-38990). Skladaja juz
//!   portowane predykaty (`is_eligible_for_*`, `is_resting_from_*`); bez mutacji stanu.
//! - `sweep_stale_forced_war_entries` = `sweepStaleForcedWarEntries` (main.ts ~11245) + helpery
//!   `cleanup*ForcedWarOnPeace` (main.ts ~11206-11236): sprzatanie wojen wymuszonych po pokoju,
//!   uzbrojenie odpoczynku napastnika (turn + ODPOCZYNEK_TUR), usuniecie fal pary.
//!
//! NIE PORTOWANE w G3b (zostaje w main.ts; zglaszane jako BLOKADA): mutacje `*PendingOwners` /
//! `*EraEnterTurnByOwner` w ownerLoop, wpis fali i `pruneForcedWarWaves` w petli, podpiecie wyniku do
//! `assignForcedWarPairings` (juz w `war_forced_pairing.rs`, poza ta partia) oraz logika cooldownu
//! 20 tur przy pokoju (`lockTurnsOverride`, sciezka dyplomacji, nie trigger).
//!
//! Wektory: `tests/p6_forced_war_g3b_data/cases.json` (generator `gen_cases_g3b.mjs`, Node 22;
//! predykaty = prawdziwe `forced-war-*.ts`, replika ownerLoop/sweep = wyodrebniona kopia).

use std::collections::BTreeMap;

use crate::domain::war_forced_bronze::{
    is_eligible_for_bronze_forced_war, is_resting_from_bronze_forced_war,
    BronzeForcedWarEligibilityInput, WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
};
use crate::domain::war_forced_iron::{
    is_eligible_for_iron_forced_war, is_resting_from_iron_forced_war,
    IronForcedWarEligibilityInput, WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
};
use crate::domain::war_forced_stone::{
    is_eligible_for_stone_forced_war, is_resting_from_stone_forced_war,
    WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR, WOJNA_KAMIEN_WYMUSZONA_START_TURY,
};

/// Wejscie decyzji "szukaj" dla jednego wlasciciela (pola zamienione z closure'ow main.ts).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SearchInput {
    /// `aiDiffLevelForOwner(ownerId)`; poziom 1 wylacza szukanie (Brąz/Kamień).
    pub difficulty_level: i64,
    /// `xForceWarPendingOwners.has(ownerId)` (Kamień: bez uzbrojenia tej tury).
    pub pending: bool,
    /// `xForceWarCycleOwners.has(ownerId)`.
    pub cycle: bool,
    /// Napastnik ma juz aktywna wojne wymuszona tej epoki (`hasActiveForcedWarAsAttacker`).
    pub has_active_as_attacker: bool,
    /// `alreadyAtWarAnyRole` (`countActiveWarsForOwnerExcludingBarbarians > 0`).
    pub already_at_war_any_role: bool,
    /// `xForceWarRestUntilByOwner.get(ownerId)`.
    pub rest_until: Option<f64>,
    /// Biezaca tura (`turn`).
    pub current_turn: f64,
    /// `xEraEnterTurnByOwner.get(ownerId)` (Brąz/Żelazo); `None` = brak wpisu.
    pub era_enter_turn: Option<f64>,
    /// `empireEpochForOwner(ownerId)` (Kamień wymaga epoki 1).
    pub epoch: i64,
    /// `isForcedEraWarEnabled('bronze'|'iron')` (Kamień nie ma flagi w warunku "szukaj").
    pub era_flag_enabled: bool,
}

/// Web: Brąz `shouldSearch && isForcedEraWarEnabled('bronze')` (main.ts Krok A).
pub fn should_search_bronze(i: &SearchInput) -> bool {
    let searching_after_rest = !i.pending
        && i.cycle
        && !i.has_active_as_attacker
        && !i.already_at_war_any_role
        && !is_resting_from_bronze_forced_war(i.current_turn, i.rest_until);
    let should = i.difficulty_level != 1
        && if i.pending {
            is_eligible_for_bronze_forced_war(&BronzeForcedWarEligibilityInput {
                is_main_ai_civ: true,
                is_already_at_war_any_role: i.already_at_war_any_role,
                current_turn: Some(i.current_turn),
                era_enter_turn: i.era_enter_turn,
            })
        } else {
            searching_after_rest
        };
    should && i.era_flag_enabled
}

/// Web: Kamień `shouldSearch` (z uzbrojeniem tej tury: `turn >= START && epoka 1 && !pending && !cycle`).
/// Brak flagi epoki w warunku (jak w main.ts).
pub fn should_search_stone(i: &SearchInput) -> bool {
    let is_stone_era = i.epoch == 1;
    let armed_this_turn = i.current_turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY
        && is_stone_era
        && !i.pending
        && !i.cycle;
    let was_pending = i.pending || armed_this_turn;
    let searching_after_rest = !was_pending
        && i.cycle
        && is_stone_era
        && !i.has_active_as_attacker
        && !i.already_at_war_any_role
        && !is_resting_from_stone_forced_war(i.current_turn, i.rest_until);
    i.difficulty_level != 1
        && if was_pending {
            // Sygnatura: (is_main_ai_civ, is_already_at_war_any_role, current_turn, is_stone_era).
            is_eligible_for_stone_forced_war(
                true,
                i.already_at_war_any_role,
                i.current_turn,
                is_stone_era,
            )
        } else {
            searching_after_rest
        }
}

/// Web: Żelazo `shouldSearch && isForcedEraWarEnabled('iron')` (bez progu poziomu trudnosci, jak w main.ts).
pub fn should_search_iron(i: &SearchInput) -> bool {
    let searching_after_rest = !i.pending
        && i.cycle
        && !i.has_active_as_attacker
        && !i.already_at_war_any_role
        && !is_resting_from_iron_forced_war(i.current_turn, i.rest_until);
    let should = if i.pending {
        is_eligible_for_iron_forced_war(&IronForcedWarEligibilityInput {
            is_main_ai_civ: true,
            is_already_at_war_any_role: i.already_at_war_any_role,
            current_turn: Some(i.current_turn),
            era_enter_turn: i.era_enter_turn,
        })
    } else {
        searching_after_rest
    };
    should && i.era_flag_enabled
}

/// Epoka wojny wymuszonej (kolejnosc sprzatania jak w `sweepStaleForcedWarEntries`: Kamien, Zelazo, Braz).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ForcedEra {
    Stone,
    Iron,
    Bronze,
}

impl ForcedEra {
    /// Web: nazwa epoki w wyjsciu wektorow (`stone` / `iron` / `bronze`).
    pub fn tag(self) -> &'static str {
        match self {
            ForcedEra::Stone => "stone",
            ForcedEra::Iron => "iron",
            ForcedEra::Bronze => "bronze",
        }
    }

    fn rest_turns(self) -> f64 {
        match self {
            ForcedEra::Stone => WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR,
            ForcedEra::Iron => WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
            ForcedEra::Bronze => WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
        }
    }
}

/// Aktywna para wojny wymuszonej (wpis rejestru `*ForceWarActiveByPairKey`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ActivePair {
    pub attacker_id: i64,
    pub target_id: i64,
    /// `getDiploRelation(attacker, target).status === 'wojna'` (false = stale -> sprzatanie).
    pub at_war: bool,
}

/// Stan rejestrow wojen wymuszonych (wszystkie epoki) + odpoczynek napastnikow per epoka.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ForcedWarRegistries {
    pub stone: Vec<ActivePair>,
    pub iron: Vec<ActivePair>,
    pub bronze: Vec<ActivePair>,
    pub rest_stone: BTreeMap<i64, f64>,
    pub rest_iron: BTreeMap<i64, f64>,
    pub rest_bronze: BTreeMap<i64, f64>,
}

/// Wynik sprzatania: usuniete wpisy (kolejnosc wykonania) i klucze fal usuniete razem z nimi.
#[derive(Debug, Clone, PartialEq)]
pub struct SweepOutcome {
    pub removed: Vec<(ForcedEra, i64, i64)>,
    /// Klucz pary `min-max` (`diploPairKey`) dla kazdego usuniecia fal, w tej samej kolejnosci.
    pub waves_deleted: Vec<String>,
}

fn pair_key(a: i64, b: i64) -> String {
    format!("{}-{}", a.min(b), a.max(b))
}

fn sweep_era(
    turn: f64,
    era: ForcedEra,
    registry: &mut Vec<ActivePair>,
    rest: &mut BTreeMap<i64, f64>,
    outcome: &mut SweepOutcome,
) {
    let mut kept = Vec::with_capacity(registry.len());
    for p in registry.iter().copied() {
        if p.at_war {
            kept.push(p);
            continue;
        }
        // Web cleanup*ForcedWarOnPeace: usun wpis, usun fale pary, uzbroj odpoczynek napastnika.
        outcome.removed.push((era, p.attacker_id, p.target_id));
        outcome
            .waves_deleted
            .push(pair_key(p.attacker_id, p.target_id));
        rest.insert(p.attacker_id, turn + era.rest_turns());
    }
    *registry = kept;
}

/// Web `sweepStaleForcedWarEntries` (main.ts): dla Kamienia, Zelaza, potem Brazu sprzata pary,
/// ktorych status dyplomatyczny nie jest 'wojna'. Bez zmian dla par w stanie wojny (no-op).
pub fn sweep_stale_forced_war_entries(turn: f64, regs: &mut ForcedWarRegistries) -> SweepOutcome {
    let mut outcome = SweepOutcome {
        removed: Vec::new(),
        waves_deleted: Vec::new(),
    };
    sweep_era(
        turn,
        ForcedEra::Stone,
        &mut regs.stone,
        &mut regs.rest_stone,
        &mut outcome,
    );
    sweep_era(
        turn,
        ForcedEra::Iron,
        &mut regs.iron,
        &mut regs.rest_iron,
        &mut outcome,
    );
    sweep_era(
        turn,
        ForcedEra::Bronze,
        &mut regs.bronze,
        &mut regs.rest_bronze,
        &mut outcome,
    );
    outcome
}
