//! P6-WIRE-WAR-MARCH-PLAN (W5): planer marszu wojennego per wlasciciel.
//!
//! Planer ZWRACA komendy (`MarchCommand`), niczego nie wykonuje i nie mutuje stanu. Kolejnosc
//! priorytetow zgodna z webem: kampania generala (`main.ts:7480`) -> obrona domu, S1 -> P1 -> S3 -> atak
//! (`planHomeWar`, `ai.ts:3498`) -> fala wymuszonej wojny (`planForcedWarWave`, `ai.ts:3840`).
//!
//! Dwie warstwy:
//! - `plan_war_march_core` (czysta, na danych): dostaje juz zbudowane wejscia modulow skladowych,
//!   testowalna na syntetycznych danych,
//! - `plan_war_march` (adapter): buduje wejscia z `WarWorldView` (`home_war_*`, `wave_*`) i `WarTurnState`
//!   (fale wymuszone z `opaque["forcedWarWavesByPairKey"]`), potem wola `plan_war_march_core`.
//!
//! ZALOZENIA (kazde jawne, nie BLOCK):
//! - Z1 wojna: zbior `enemy_owners` podaje wolajacy (stan wojny `DiplomacyState` nie jest czytany w W5).
//! - Z2 `is_own_territory` i sila jednostek (`strength_of`) podaje wolajacy (web: callbacki `isOwnTerritory`,
//!   `strengthOf`); W5 nie liczy ich sam.
//! - Z3 histereza obrony domu (`HomeWarMemoryStore`) w W5 jest swiezo tworzona na kazde wywolanie
//!   (`current_turn = Some(turn)`); trwala pamiec odtwarzana dopiero w W8 (dlug).
//! - Z4 kontakt dyplomatyczny (`hasContactWith`) zakladany (`None`), `isRelevantSiege` = `None`.
//! - Z5 plan wymuszonej fali dostaje jednostki bez tych juz rozdanych obronie domu i bez `locked_unit_ids`.
//! - Z6 NIE PORTOWANE w W5: `planWarAllInCapital` (`ai.ts:4570`): wymaga `WarAllInNav` z mapy ruchu, a
//!   `WarWorldView` nie eksponuje `RuchMapa` (dlug na W8).

use std::collections::{BTreeSet, HashSet};

use super::ai_general_war_campaign::{
    choose_ai_general_war_target, AiGeneralWarCampaign, WarTargetCandidate,
};
use super::playable::PlayableUnit;
use super::war_forced_waves::{
    hex_distance_for_forced_war, plan_forced_war_wave, restore_forced_war_waves, ForcedWarWave,
    ForcedWarWaveHistory, ForcedWarWavePlan, WaveCity, WaveUnit,
};
use super::war_home_defense::{HomeWarCity, HomeWarMemoryStore, HomeWarOrder, HomeWarUnit};
use super::war_home_defense_plan::{plan_home_war, HomeWarInput};
use super::war_turn_state::WarTurnState;
use super::war_world_view::WarWorldView;

/// Klucz `meta` (w `WarTurnState::opaque`) z falami wymuszonej wojny (web `forcedWarWavesByPairKey`).
pub const FORCED_WAR_WAVES_KEY: &str = "forcedWarWavesByPairKey";

/// Komenda planera marszu. Wolajacy wykonuje w zwroconej kolejnosci.
#[derive(Debug, Clone, PartialEq)]
pub enum MarchCommand {
    /// Wybor celu kampanii generala (`None` = brak osiagalnego celu).
    CampaignTarget(Option<i64>),
    /// Rozkaz obrony domu / odbicia / ataku (`planHomeWar`).
    Home(HomeWarOrder),
    /// Fala wymuszonej wojny (`planForcedWarWave`).
    ForcedWave(ForcedWarWavePlan),
}

/// Parametry podawane przez wolajacego (zalozenia Z1, Z2).
pub struct MarchParams<'a> {
    /// Wlasciciele, z ktorymi wlasciciel planu jest w wojnie (Z1).
    pub enemy_owners: &'a BTreeSet<i64>,
    /// Jednostki zajete w tej turze (web `lockedUnitIds`).
    pub locked_unit_ids: &'a HashSet<String>,
    /// Web `isOwnTerritory` (Z2).
    pub is_own_territory: &'a dyn Fn(i32, i32) -> bool,
    /// Web `strengthOf` (Z2).
    pub strength_of: &'a dyn Fn(&PlayableUnit) -> f64,
    /// Obecna kampania generala wlasciciela (web `aiGeneralWarCampaignByOwner`).
    pub campaign: Option<&'a AiGeneralWarCampaign>,
    /// Kandydaci na cel kampanii (web `{ ownerId, distance, reachable? }`).
    pub campaign_candidates: &'a [WarTargetCandidate],
}

/// Wejscie czystego rdzenia: juz zbudowane dane modulow skladowych.
pub struct MarchCoreInput<'a> {
    pub owner_id: i64,
    pub turn: i64,
    pub enemy_owners: &'a BTreeSet<i64>,
    pub locked_unit_ids: &'a HashSet<String>,
    pub is_own_territory: &'a dyn Fn(i32, i32) -> bool,
    /// Wszystkie miasta gry (kandydaci na utracone).
    pub all_home_cities: &'a [HomeWarCity],
    /// Wszystkie jednostki gry (z sila).
    pub all_home_units: &'a [HomeWarUnit],
    pub wave_cities: &'a [WaveCity],
    pub wave_units: &'a [WaveUnit],
    pub active_waves: &'a [ForcedWarWave],
    pub wave_history: &'a [ForcedWarWaveHistory],
    pub campaign: Option<&'a AiGeneralWarCampaign>,
    pub campaign_candidates: &'a [WarTargetCandidate],
}

/// Czysty rdzen planera marszu (kolejnosc: kampania -> obrona domu -> fala).
pub fn plan_war_march_core(inp: &MarchCoreInput<'_>) -> Vec<MarchCommand> {
    let mut out = Vec::new();
    let owner = inp.owner_id;
    let enemies = inp.enemy_owners;

    if let Some(target) = choose_ai_general_war_target(inp.campaign, inp.campaign_candidates) {
        out.push(MarchCommand::CampaignTarget(Some(target)));
    } else if !inp.campaign_candidates.is_empty() || inp.campaign.is_some() {
        out.push(MarchCommand::CampaignTarget(None));
    }

    // Obrona domu / atak (planHomeWar). Pamiec swiezo tworzona (Z3).
    let can_engage = |o: i64| enemies.contains(&o);
    let my_units = owned_units(inp.all_home_units, owner);
    let my_cities = owned_cities(inp.all_home_cities, owner);
    let enemy = enemy_units(inp.all_home_units, enemies);
    let home_inp = HomeWarInput {
        owner_id: owner,
        current_turn: Some(inp.turn),
        all_units: inp.all_home_units,
        my_units: &my_units,
        my_cities: &my_cities,
        all_cities: inp.all_home_cities,
        enemy_units: &enemy,
        can_engage_owner: &can_engage,
        has_contact_with: None,
        locked_unit_ids: inp.locked_unit_ids,
        is_own_territory: inp.is_own_territory,
        is_relevant_siege: None,
    };
    let mut store = HomeWarMemoryStore::new();
    let home_plan = plan_home_war(&home_inp, &mut store);
    let mut used: HashSet<String> = HashSet::new();
    for order in home_plan.orders {
        used.insert(order_unit_id(&order).to_owned());
        out.push(MarchCommand::Home(order));
    }

    // Fala wymuszonej wojny (planForcedWarWave) na jednostkach nieprzydzielonych wyzej (Z5).
    let mut excluded: HashSet<String> = inp.locked_unit_ids.clone();
    excluded.extend(used);
    let wave_units: Vec<WaveUnit> = inp
        .wave_units
        .iter()
        .filter(|u| u.owner_id == owner && !excluded.contains(&u.id))
        .cloned()
        .collect();
    let target_cities: Vec<WaveCity> = inp
        .wave_cities
        .iter()
        .filter(|c| enemies.contains(&c.owner_id))
        .cloned()
        .collect();
    if let Some(wave) = plan_forced_war_wave(
        &wave_units,
        &target_cities,
        inp.active_waves,
        &excluded,
        &hex_distance_for_forced_war,
        inp.turn as f64,
        inp.wave_history,
    ) {
        out.push(MarchCommand::ForcedWave(wave));
    }
    out
}

fn order_unit_id(order: &HomeWarOrder) -> &str {
    match order {
        HomeWarOrder::Attack { unit_id, .. }
        | HomeWarOrder::Approach { unit_id, .. }
        | HomeWarOrder::Hold { unit_id, .. } => unit_id,
    }
}

fn owned_units(units: &[HomeWarUnit], owner: i64) -> Vec<HomeWarUnit> {
    units
        .iter()
        .filter(|u| u.owner_id == owner)
        .cloned()
        .collect()
}

fn enemy_units(units: &[HomeWarUnit], enemies: &BTreeSet<i64>) -> Vec<HomeWarUnit> {
    units
        .iter()
        .filter(|u| enemies.contains(&u.owner_id))
        .cloned()
        .collect()
}

fn owned_cities(cities: &[HomeWarCity], owner: i64) -> Vec<HomeWarCity> {
    cities
        .iter()
        .filter(|c| c.owner_id == owner)
        .cloned()
        .collect()
}

/// Fale z `WarTurnState` (wszystkie pary; kolejnosc jak w zapisie).
pub fn waves_from_state(state: &WarTurnState) -> (Vec<ForcedWarWave>, Vec<ForcedWarWaveHistory>) {
    let raw = state
        .opaque
        .get(FORCED_WAR_WAVES_KEY)
        .cloned()
        .unwrap_or(serde_json::Value::Null);
    let mut waves = Vec::new();
    let mut history = Vec::new();
    for (_, st) in restore_forced_war_waves(&raw) {
        waves.extend(st.waves);
        history.extend(st.history);
    }
    (waves, history)
}

/// Adapter: `WarWorldView` + `WarTurnState` -> `plan_war_march_core`.
pub fn plan_war_march(
    world: &WarWorldView<'_>,
    state: &WarTurnState,
    owner: i64,
    turn: i64,
    params: &MarchParams<'_>,
) -> Vec<MarchCommand> {
    let home_cities = world.home_war_cities();
    let home_units = world.home_war_units(params.strength_of);
    let wave_cities = world.wave_cities();
    let wave_units = world.wave_units();
    let (active_waves, wave_history) = waves_from_state(state);
    plan_war_march_core(&MarchCoreInput {
        owner_id: owner,
        turn,
        enemy_owners: params.enemy_owners,
        locked_unit_ids: params.locked_unit_ids,
        is_own_territory: params.is_own_territory,
        all_home_cities: &home_cities,
        all_home_units: &home_units,
        wave_cities: &wave_cities,
        wave_units: &wave_units,
        active_waves: &active_waves,
        wave_history: &wave_history,
        campaign: params.campaign,
        campaign_candidates: params.campaign_candidates,
    })
}
