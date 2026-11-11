//! P6-WIRE-WAR-FORCED-STEP (W3): krok wojen wymuszonych tury (`forced_war_step`).
//!
//! Replika bloku `runAiPhase` przed petla `ownerLoop` (web `gra/src/main.ts`, pin `origin/main`,
//! ok. linii 40080-40380, numery linii ZMIERZONE grepem i moga dryfowac):
//! 1. sweep `sweepStaleForcedWarEntries` (ok. 11629) -> `war_forced_trigger::sweep_stale_forced_war_entries`,
//! 2. Krok A: per wlasciciel `shouldSearch` Brazu / Kamienia / Zelaza -> `war_forced_trigger::should_search_*`,
//! 3. Krok B/C: liczniki aktywnych wojen, pula gracza (`isPlayerEligibleForEraWarPool`), R1, player-first,
//! 4. Krok D/E: pary do dolaczenia i blokady -> `war_forced_pairing::assign_forced_war_pairings`,
//! 5. kolejnosc `ownerLoopList` (partner pary gracza pierwszy, D2 = B wewnatrz kroku zachowuje kolejnosc weba).
//!
//! Funkcja jest CZYSTA wzgledem RNG i czasu: deterministyczna dla tych samych wejsc.
//! Mutuje wylacznie `WarTurnState` w czesci sweep (aktywne pary i odpoczynek napastnika).
//! NIE mutuje: `*PendingOwners`, `*CycleOwners`, `*EraEnterTurnByOwner`, fal (`forcedWarWavesByPairKey`)
//! i cooldownow -- to mutacje ownerLoop / sciezki dyplomacji (kolejne partie). Usuniete pary zwracane
//! sa w `ForcedWarStepOutcome::sweep` (wraz z kluczami fal do usuniecia), zeby wolajacy je zastosowal.
//!
//! Wejscia spoza `WarWorldView` (poziom trudnosci, epoka, stan wojny pary, blokady pokoju, flagi)
//! podaje wolajacy w `ForcedWarStepInput` -- web czyta je z closure'ow i flag runtime.

use std::collections::BTreeMap;

use crate::domain::war_era_pool::{is_player_eligible_for_era_war_pool, PlayerEraWarPoolInput};
use crate::domain::war_forced_bronze::WOJNA_WYMUSZONA_ODPOCZYNEK_TUR;
use crate::domain::war_forced_common::count_active_forced_wars_for_owner;
use crate::domain::war_forced_iron::WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR;
use crate::domain::war_forced_pairing::{
    assign_forced_war_pairings, ForcedWarEraTag, ForcedWarPairingExistingPair,
    ForcedWarPairingOpts, ForcedWarPairingResult, ForcedWarPairingSubject, PlayerFirstOpts,
};
use crate::domain::war_forced_stone::{
    WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR, WOJNA_KAMIEN_WYMUSZONA_START_TURY,
};
use crate::domain::war_forced_trigger::{
    should_search_bronze, should_search_iron, should_search_stone, sweep_stale_forced_war_entries,
    ActivePair, ForcedEra, ForcedWarRegistries, SearchInput, SweepOutcome,
};
use crate::domain::war_target_select::WarTargetCity;
use crate::domain::war_turn_state::WarTurnState;
use crate::domain::war_world_view::WarWorldView;

/// Indeks w `WarTurnState::forced` (0 = kamien, 1 = braz, 2 = zelazo; patrz `war_turn_state`).
const IDX_STONE: usize = 0;
const IDX_BRONZE: usize = 1;
const IDX_IRON: usize = 2;

/// Wlasciciel AI w kolejnosci `aiOwnerList` (web) wraz z polami potrzebnymi do Kroku A i pary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ForcedOwnerInput {
    pub owner_id: i64,
    /// Web `aiDiffLevelForOwner(ownerId)`; poziom 1 wylacza szukanie (Braz/Kamien).
    pub difficulty_level: i64,
    /// Web `empireEpochForOwner(ownerId)`.
    pub epoch: i64,
    /// Web `countActiveWarsForOwnerExcludingBarbarians(ownerId) > 0`.
    pub already_at_war_any_role: bool,
    /// Web: wlasciciel przechodzi filtr Kroku A (ownerId > 0, nie typCityCopy, nie barbarzynca,
    /// nie wyeliminowany, nie klaster city-state). Ten sam zbior wykluczen dotyczy kandydatow pary.
    pub krok_a_eligible: bool,
}

/// Wejscie kroku wojen wymuszonych (poza `WarWorldView` i `WarTurnState`).
pub struct ForcedWarStepInput<'a> {
    /// Web `turn`.
    pub turn: f64,
    /// Web `aiOwnerList` (kolejnosc zachowana; uzywana takze jako `ownerLoopList` bez partnera gracza).
    pub owners: &'a [ForcedOwnerInput],
    /// Web `empireEpochForOwner(0)`.
    pub player_epoch: i64,
    /// Web `isForcedEraWarEnabled('bronze')`.
    pub bronze_enabled: bool,
    /// Web `isForcedEraWarEnabled('iron')`.
    pub iron_enabled: bool,
    /// Web `isWarRulesMultiwarEnabled()`.
    pub war_rules_multiwar: bool,
    /// Web `isInterCivWarOpenAtTurn(turn)`.
    pub inter_civ_war_open: bool,
    /// Web `isWarEpochPlayerFirstEnabled()`.
    pub war_epoch_player_first: bool,
    /// Web `playerEpochWarEnabled` (opcja „Wojna epoki z udzialem gracza”).
    pub player_epoch_war_enabled: bool,
    /// Web `eliminatedOwners.has(id)`.
    pub is_eliminated: &'a dyn Fn(i64) -> bool,
    /// Web: status dyplomatyczny pary jest `wojna` (false = wpis nieaktualny -> sprzatanie).
    pub is_at_war: &'a dyn Fn(i64, i64) -> bool,
    /// Web `hexDistance`.
    pub hex_distance: &'a dyn Fn(i32, i32, i32, i32) -> i64,
    /// Web `isForcedWarPairBlocked` (blokada: NAP, pokoj, sojusz -> `isWarTreatyBlocked`).
    pub is_pair_blocked: &'a dyn Fn(i64, i64) -> bool,
    /// Web `canCivJoinEraForcedWar(...)` dla licznika wojen epoki (uzywane tylko przy `war_rules_multiwar`).
    pub era_war_counter_ok: &'a dyn Fn(i64) -> bool,
    /// Web czesc bramki player-first poza aktywna wojna epoki: `evaluateInterCivWarGate(...) === 'ok'`
    /// oraz (przy `war_rules_multiwar`) `isPlayerEraWarSlotFree(...)`.
    pub player_gate_extra: &'a dyn Fn(i64) -> bool,
    /// Web `aiOwnerListResumed` (main.ts ~40375): lista zapisana przed animacja bitwy. `Some` = wznowienie
    /// tury -- kolejnosc ownerLoop jest ta zapisana (bez przebudowy z partnerem gracza); `None` = swieza tura.
    pub owner_loop_resumed: Option<&'a [i64]>,
}

/// Wynik kroku. `triggered` i `pairing` odpowiadaja kolejno `triggeredSubjects` i `assignForcedWarPairings`.
#[derive(Debug, Clone, PartialEq)]
pub struct ForcedWarStepOutcome {
    /// Usuniete pary (kolejnosc wykonania sweep) i klucze fal do usuniecia.
    pub sweep: SweepOutcome,
    /// Web: gracz przeszedl `isPlayerEligibleForEraWarPool` (i ma miasto referencyjne).
    pub player_pool_eligible: bool,
    /// Podmioty wyzwolone tej tury po R1 / player-first (kolejnosc: braz, kamien, zelazo, gracz).
    pub triggered: Vec<ForcedWarPairingSubject>,
    pub pairing: ForcedWarPairingResult,
    /// Web `ownerLoopList`: partner pary gracza pierwszy, reszta w kolejnosci `owners`.
    pub owner_loop_order: Vec<i64>,
}

fn era_idx(era: ForcedEra) -> usize {
    match era {
        ForcedEra::Stone => IDX_STONE,
        ForcedEra::Bronze => IDX_BRONZE,
        ForcedEra::Iron => IDX_IRON,
    }
}

fn rest_turns(era: ForcedEra) -> f64 {
    match era {
        ForcedEra::Stone => WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR,
        ForcedEra::Bronze => WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
        ForcedEra::Iron => WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
    }
}

/// Web `forcedEraTagForEpoch`-podobne mapowanie epoki na mechanizm (1 kamien, 2 braz, 3 zelazo).
fn tag_for_epoch(epoch: i64) -> Option<ForcedWarEraTag> {
    match epoch {
        1 => Some(ForcedWarEraTag::Stone),
        2 => Some(ForcedWarEraTag::Bronze),
        3 => Some(ForcedWarEraTag::Iron),
        _ => None,
    }
}

fn lookup_f64(list: &[(i64, f64)], owner: i64) -> Option<f64> {
    list.iter().find(|(k, _)| *k == owner).map(|(_, v)| *v)
}

fn pairs_of(state: &WarTurnState, idx: usize) -> Vec<(i64, i64)> {
    state.forced[idx]
        .active_by_pair_key
        .iter()
        .map(|(_, p)| (p.attacker_id, p.target_id))
        .collect()
}

/// Web `sweepStaleForcedWarEntries`: rejestry -> `war_forced_trigger::sweep_stale_forced_war_entries`,
/// potem zastosowanie wyniku do `WarTurnState` (usuniecie stale wpisow, odpoczynek napastnika).
fn sweep_step(state: &mut WarTurnState, input: &ForcedWarStepInput<'_>) -> SweepOutcome {
    let to_regs = |idx: usize| -> Vec<ActivePair> {
        state.forced[idx]
            .active_by_pair_key
            .iter()
            .map(|(_, p)| ActivePair {
                attacker_id: p.attacker_id,
                target_id: p.target_id,
                at_war: (input.is_at_war)(p.attacker_id, p.target_id),
            })
            .collect()
    };
    let mut regs = ForcedWarRegistries {
        stone: to_regs(IDX_STONE),
        iron: to_regs(IDX_IRON),
        bronze: to_regs(IDX_BRONZE),
        rest_stone: BTreeMap::new(),
        rest_iron: BTreeMap::new(),
        rest_bronze: BTreeMap::new(),
    };
    let outcome = sweep_stale_forced_war_entries(input.turn, &mut regs);
    for idx in [IDX_STONE, IDX_BRONZE, IDX_IRON] {
        state.forced[idx]
            .active_by_pair_key
            .retain(|(_, p)| (input.is_at_war)(p.attacker_id, p.target_id));
    }
    for (era, attacker, _target) in &outcome.removed {
        let rest_until = input.turn + rest_turns(*era);
        let list = &mut state.forced[era_idx(*era)].rest_until_by_owner;
        match list.iter_mut().find(|(k, _)| *k == *attacker) {
            Some(slot) => slot.1 = rest_until,
            None => list.push((*attacker, rest_until)),
        }
    }
    outcome
}

/// Krok A dla jednego mechanizmu: parametry `SearchInput` z `WarTurnState` (stan po sweep).
fn search_input(
    state: &WarTurnState,
    idx: usize,
    owner: &ForcedOwnerInput,
    turn: f64,
    era_enter_turn: Option<f64>,
    era_flag_enabled: bool,
) -> SearchInput {
    let fs = &state.forced[idx];
    SearchInput {
        difficulty_level: owner.difficulty_level,
        pending: fs.pending_owners.contains(&owner.owner_id),
        cycle: fs.cycle_owners.contains(&owner.owner_id),
        has_active_as_attacker: fs
            .active_by_pair_key
            .iter()
            .any(|(_, p)| p.attacker_id == owner.owner_id),
        already_at_war_any_role: owner.already_at_war_any_role,
        rest_until: lookup_f64(&fs.rest_until_by_owner, owner.owner_id),
        current_turn: turn,
        era_enter_turn,
        epoch: owner.epoch,
        era_flag_enabled,
    }
}

/// Miasto referencyjne wlasciciela: stolica, a gdy brak -- pierwsze miasto (web `pickPlayerReferenceCity`
/// oraz `cities.find(c => c.id === capId) ?? cities.find(c => c.ownerId === oid)`).
fn capital_or_first<'c>(
    world: &WarWorldView<'_>,
    cities: &'c [WarTargetCity],
    owner: i64,
) -> Option<&'c WarTargetCity> {
    world
        .capital_city_id(owner)
        .and_then(|id| cities.iter().find(|c| c.id == id && c.owner_id == owner))
        .or_else(|| cities.iter().find(|c| c.owner_id == owner))
}

/// Krok wojen wymuszonych tury. Patrz dokumentacja modulu.
pub fn forced_war_step(
    world: &WarWorldView<'_>,
    state: &mut WarTurnState,
    input: &ForcedWarStepInput<'_>,
) -> ForcedWarStepOutcome {
    let turn = input.turn;
    let elim = input.is_eliminated;
    let cities = world.war_target_cities();

    // 1. Sweep (przed Krokiem A, jak w webie).
    let sweep = sweep_step(state, input);

    // Krok B: aktywne pary wszystkich epok (bez wyeliminowanych), kolejnosc: braz, kamien, zelazo.
    let all_pairs: Vec<(i64, i64)> = [IDX_BRONZE, IDX_STONE, IDX_IRON]
        .into_iter()
        .flat_map(|idx| pairs_of(state, idx))
        .filter(|(a, t)| !elim(*a) && !elim(*t))
        .collect();
    let in_era_war = |oid: i64| all_pairs.iter().any(|(a, t)| *a == oid || *t == oid);

    // Krok A: podmioty wyzwolone per epoka (osobne wektory, potem konkatenacja braz, kamien, zelazo).
    let mut bronze_t: Vec<ForcedWarPairingSubject> = Vec::new();
    let mut stone_t: Vec<ForcedWarPairingSubject> = Vec::new();
    let mut iron_t: Vec<ForcedWarPairingSubject> = Vec::new();
    for owner in input.owners.iter().filter(|o| o.krok_a_eligible) {
        let Some(city) = cities.iter().find(|c| c.owner_id == owner.owner_id) else {
            continue;
        };
        let subject = |era: ForcedWarEraTag| ForcedWarPairingSubject {
            owner_id: owner.owner_id,
            q: city.q,
            r: city.r,
            era: Some(era),
        };
        let si_bronze = search_input(
            state,
            IDX_BRONZE,
            owner,
            turn,
            lookup_f64(&state.bronze_era_enter_turn_by_owner, owner.owner_id),
            input.bronze_enabled,
        );
        if should_search_bronze(&si_bronze) {
            bronze_t.push(subject(ForcedWarEraTag::Bronze));
        }
        let si_stone = search_input(state, IDX_STONE, owner, turn, None, true);
        if should_search_stone(&si_stone) {
            stone_t.push(subject(ForcedWarEraTag::Stone));
        }
        let si_iron = search_input(
            state,
            IDX_IRON,
            owner,
            turn,
            lookup_f64(&state.iron_era_enter_turn_by_owner, owner.owner_id),
            input.iron_enabled,
        );
        if should_search_iron(&si_iron) {
            iron_t.push(subject(ForcedWarEraTag::Iron));
        }
    }

    // Krok C: gracz (owner 0), pula wg `isPlayerEligibleForEraWarPool`.
    let player_tag = tag_for_epoch(input.player_epoch);
    let total0 = count_active_forced_wars_for_owner(0, &all_pairs);
    let player_pairs_in = |idx: usize| -> i64 {
        pairs_of(state, idx)
            .into_iter()
            .filter(|(a, t)| !elim(*a) && !elim(*t) && (*a == 0 || *t == 0))
            .count() as i64
    };
    let in_era0 = match player_tag {
        Some(ForcedWarEraTag::Bronze) => player_pairs_in(IDX_BRONZE),
        Some(ForcedWarEraTag::Iron) => player_pairs_in(IDX_IRON),
        Some(ForcedWarEraTag::Stone) => player_pairs_in(IDX_STONE),
        None => total0,
    };
    let era_enter_for_pool = if player_tag == Some(ForcedWarEraTag::Iron) {
        lookup_f64(&state.iron_era_enter_turn_by_owner, 0)
    } else {
        lookup_f64(&state.bronze_era_enter_turn_by_owner, 0)
    };
    let player_city = capital_or_first(world, &cities, 0);
    let player_pool_eligible = player_city.is_some()
        && is_player_eligible_for_era_war_pool(&PlayerEraWarPoolInput {
            current_turn: turn,
            player_epoch: input.player_epoch,
            active_forced_wars_total: total0,
            active_forced_wars_in_player_era: in_era0,
            era_enter_turn: era_enter_for_pool,
            pool_start_turn: WOJNA_KAMIEN_WYMUSZONA_START_TURY,
        });

    let mut triggered: Vec<ForcedWarPairingSubject> =
        bronze_t.into_iter().chain(stone_t).chain(iron_t).collect();
    if let (true, Some(city)) = (player_pool_eligible, player_city) {
        triggered.push(ForcedWarPairingSubject {
            owner_id: 0,
            q: city.q,
            r: city.r,
            era: None,
        });
    }
    // R1 (flaga multiwar): przed tura 40 wypadaja podmioty bez ignorowania R1 (Kamien, gracz).
    if input.war_rules_multiwar && !input.inter_civ_war_open {
        triggered
            .retain(|s| matches!(s.era, Some(ForcedWarEraTag::Bronze | ForcedWarEraTag::Iron)));
    }
    // Opcja „Wojna epoki z udzialem gracza” (OFF = gracz wypada z puli).
    if input.war_epoch_player_first && !input.player_epoch_war_enabled {
        triggered.retain(|s| s.owner_id != 0);
    }

    // Krok D: pary aktywne (target != 0) do dolaczenia jako trzeci.
    let mut existing: Vec<ForcedWarPairingExistingPair> = Vec::new();
    for (idx, era) in [
        (IDX_BRONZE, ForcedWarEraTag::Bronze),
        (IDX_STONE, ForcedWarEraTag::Stone),
        (IDX_IRON, ForcedWarEraTag::Iron),
    ] {
        for (_, p) in &state.forced[idx].active_by_pair_key {
            if p.target_id != 0 && !elim(p.attacker_id) && !elim(p.target_id) {
                existing.push(ForcedWarPairingExistingPair {
                    attacker_id: p.attacker_id,
                    target_id: p.target_id,
                    era,
                });
            }
        }
    }

    // Krok E: bramki i opcje parowania (kolejnosc i predykaty jak w webie).
    let exhausted = |oid: i64| in_era_war(oid) || !(input.era_war_counter_ok)(oid);
    let exhausted_dyn: &dyn Fn(i64) -> bool = &exhausted;
    let gate = |oid: i64| !in_era_war(oid) && !in_era_war(0) && (input.player_gate_extra)(oid);
    let gate_dyn: &dyn Fn(i64) -> bool = &gate;
    let total_by_owner = |oid: i64| -> i64 {
        if oid == 0
            && matches!(
                player_tag,
                Some(ForcedWarEraTag::Bronze | ForcedWarEraTag::Iron)
            )
        {
            in_era0
        } else {
            count_active_forced_wars_for_owner(oid, &all_pairs)
        }
    };
    let candidates: Vec<ForcedWarPairingSubject> = input
        .owners
        .iter()
        .filter(|o| o.krok_a_eligible)
        .filter_map(|o| {
            let tag = tag_for_epoch(o.epoch)?;
            let city = capital_or_first(world, &cities, o.owner_id)?;
            Some(ForcedWarPairingSubject {
                owner_id: o.owner_id,
                q: city.q,
                r: city.r,
                era: Some(tag),
            })
        })
        .collect();
    let player_first = if input.war_epoch_player_first {
        Some(PlayerFirstOpts {
            player_owner_id: 0,
            is_player_pair_gate_open: gate_dyn,
            candidates: Some(&candidates),
        })
    } else {
        None
    };
    let opts = ForcedWarPairingOpts {
        pair_relation_score: None,
        is_pair_blocked: input.is_pair_blocked,
        is_era_war_exhausted: if input.war_rules_multiwar {
            Some(exhausted_dyn)
        } else {
            None
        },
        hex_distance: input.hex_distance,
        total_active_forced_wars_by_owner: &total_by_owner,
        player_first,
    };
    let pairing = assign_forced_war_pairings(&triggered, &existing, &opts);

    // Kolejnosc ownerLoop: partner pary gracza pierwszy (jesli jest w aiOwnerList), reszta bez zmian.
    // Web: `ownerLoopList = aiOwnerListResumed ?? (...)` -- wznowienie zachowuje zapisana kolejnosc.
    let raw_ids: Vec<i64> = input.owners.iter().map(|o| o.owner_id).collect();
    let owner_loop_order = match (input.owner_loop_resumed, pairing.player_first_partner_id) {
        (Some(resumed), _) => resumed.to_vec(),
        (None, Some(lead)) if raw_ids.contains(&lead) => {
            let mut order = vec![lead];
            order.extend(raw_ids.iter().copied().filter(|x| *x != lead));
            order
        }
        (None, _) => raw_ids,
    };

    ForcedWarStepOutcome {
        sweep,
        player_pool_eligible,
        triggered,
        pairing,
        owner_loop_order,
    }
}
