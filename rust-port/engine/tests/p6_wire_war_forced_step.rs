//! P6-WIRE-WAR-FORCED-STEP (W3): testy `forced_war_step` (`domain/war_turn_forced.rs`).
//!
//! UWAGA (ZALOZENIE, NIE_ZMIERZONO wzgledem weba): blok Krok A / pula / parowanie w `gra/src/main.ts`
//! jest inline w `runAiPhase` (nieeksportowany), wiec wektorow z uruchomionego weba NIE generowano.
//! Oczekiwane wartosci ponizej wynikaja z reguł weba odczytanych z kodu (`main.ts` ~40080-40380)
//! i z portow modulow skladowych (`war_forced_*`, `war_era_pool`), a nie z uruchomienia weba.
//! Testy pokrywaja: sweep + odpoczynek, Krok A (braz/kamien), wylaczenia (poziom 1, flaga epoki),
//! R1 (multiwar), pule gracza (blokada aktywna wojna), kolejnosc ownerLoop (partner pary pierwszy)
//! i deterministycznosc.

use std::collections::HashMap;

use civ_engine::domain::playable::{PlayableCity, PlayableState};
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::war_forced_pairing::{
    ForcedWarEraTag, ForcedWarPairState, ForcedWarPairingSubject,
};
use civ_engine::domain::war_turn_forced::{
    forced_war_step, ForcedOwnerInput, ForcedWarStepInput, ForcedWarStepOutcome,
};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::war_world_view::{CityWarExtras, WarWorldView};
use civ_engine::domain::{CityId, PlayerId};

/// Miasta: wlasciciel 0 (gracz) na (0,0), AI 1 na (3,0), AI 2 na (6,0), AI 3 na (9,0). Kazdy stolica.
fn world_state() -> PlayableState {
    let mut state = PlayableState::empty();
    let spec: [(u64, u64, u16); 4] = [(1, 0, 0), (2, 1, 3), (3, 2, 6), (4, 3, 9)];
    state.cities = spec
        .iter()
        .map(|(id, owner, x)| PlayableCity {
            id: CityId::new(*id),
            owner_id: PlayerId::new(*owner),
            name: format!("c{id}"),
            position: PositionDto::new(*x, 0),
            is_capital: true,
        })
        .collect();
    state
}

fn pair(attacker: i64, target: i64) -> (String, ForcedWarPairState) {
    (
        format!("{}-{}", attacker.min(target), attacker.max(target)),
        ForcedWarPairState {
            attacker_id: attacker,
            target_id: target,
            captured_by_attacker: 0,
            captured_by_defender: 0,
            start_turn: Some(0.0),
        },
    )
}

fn owner(id: i64, epoch: i64, difficulty: i64) -> ForcedOwnerInput {
    ForcedOwnerInput {
        owner_id: id,
        difficulty_level: difficulty,
        epoch,
        already_at_war_any_role: false,
        krok_a_eligible: true,
    }
}

/// Wynik sweep + Krok A + pary: wspolne predykaty testowe.
struct Env {
    elim: fn(i64) -> bool,
    at_war: fn(i64, i64) -> bool,
    dist: fn(i32, i32, i32, i32) -> i64,
    blocked: fn(i64, i64) -> bool,
    counter_ok: fn(i64) -> bool,
    gate_extra: fn(i64) -> bool,
}

fn env() -> Env {
    Env {
        elim: |_| false,
        at_war: |_, _| true,
        dist: |aq, ar, bq, br| i64::from((aq - bq).abs() + (ar - br).abs()),
        blocked: |_, _| false,
        counter_ok: |_| true,
        gate_extra: |_| true,
    }
}

struct Flags {
    bronze: bool,
    iron: bool,
    multiwar: bool,
    inter_civ_open: bool,
    player_first: bool,
    player_epoch_war: bool,
    player_epoch: i64,
}

fn base_flags() -> Flags {
    Flags {
        bronze: true,
        iron: true,
        multiwar: false,
        inter_civ_open: true,
        player_first: false,
        player_epoch_war: false,
        player_epoch: 1,
    }
}

fn run(
    owners: &[ForcedOwnerInput],
    state: &mut WarTurnState,
    turn: f64,
    flags: &Flags,
    e: &Env,
) -> ForcedWarStepOutcome {
    let pstate = world_state();
    let extras: HashMap<String, CityWarExtras> = HashMap::new();
    let view = WarWorldView::new(&pstate, &extras);
    let input = ForcedWarStepInput {
        turn,
        owners,
        player_epoch: flags.player_epoch,
        bronze_enabled: flags.bronze,
        iron_enabled: flags.iron,
        war_rules_multiwar: flags.multiwar,
        inter_civ_war_open: flags.inter_civ_open,
        war_epoch_player_first: flags.player_first,
        player_epoch_war_enabled: flags.player_epoch_war,
        is_eliminated: &e.elim,
        is_at_war: &e.at_war,
        hex_distance: &e.dist,
        is_pair_blocked: &e.blocked,
        era_war_counter_ok: &e.counter_ok,
        player_gate_extra: &e.gate_extra,
    };
    forced_war_step(&view, state, &input)
}

fn has_subject(
    list: &[ForcedWarPairingSubject],
    owner_id: i64,
    era: Option<ForcedWarEraTag>,
) -> bool {
    list.iter().any(|s| s.owner_id == owner_id && s.era == era)
}

#[test]
fn sweep_removes_stale_pair_and_arms_attacker_rest() {
    let mut state = WarTurnState::default();
    // Kamien: para 1-2 juz nie w stanie wojny (stale), para 2-3 w stanie wojny (zostaje).
    state.forced[0].active_by_pair_key = vec![pair(1, 2), pair(2, 3)];
    let mut e = env();
    e.at_war = |a, b| !(a == 1 && b == 2) && !(a == 2 && b == 1);
    let out = run(&[], &mut state, 100.0, &base_flags(), &e);
    assert_eq!(out.sweep.removed.len(), 1);
    assert_eq!(out.sweep.waves_deleted, vec!["1-2".to_string()]);
    assert_eq!(state.forced[0].active_by_pair_key.len(), 1);
    assert_eq!(state.forced[0].active_by_pair_key[0].0, "2-3");
    // Odpoczynek napastnika = tura + 20 (WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR).
    assert_eq!(state.forced[0].rest_until_by_owner, vec![(1, 120.0)]);
}

#[test]
fn bronze_pending_owner_is_triggered_and_player_joins_pool() {
    let mut state = WarTurnState::default();
    state.forced[1].pending_owners = vec![1];
    state.bronze_era_enter_turn_by_owner = vec![(1, 0.0)];
    let owners = [owner(1, 2, 2)];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &env());
    assert!(has_subject(
        &out.triggered,
        1,
        Some(ForcedWarEraTag::Bronze)
    ));
    assert!(out.player_pool_eligible);
    assert!(has_subject(&out.triggered, 0, None));
    // Kolejnosc: braz (AI) przed graczem.
    assert_eq!(out.triggered.first().map(|s| s.owner_id), Some(1));
}

#[test]
fn stone_armed_this_turn_triggers_owner_in_epoch_one() {
    let mut state = WarTurnState::default();
    let owners = [owner(2, 1, 2)];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &env());
    assert!(has_subject(&out.triggered, 2, Some(ForcedWarEraTag::Stone)));
}

#[test]
fn difficulty_one_disables_stone_and_bronze_search() {
    let mut state = WarTurnState::default();
    state.forced[1].pending_owners = vec![1];
    state.bronze_era_enter_turn_by_owner = vec![(1, 0.0)];
    let owners = [owner(1, 2, 1), owner(2, 1, 1)];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &env());
    assert!(!out
        .triggered
        .iter()
        .any(|s| s.owner_id == 1 || s.owner_id == 2));
}

#[test]
fn disabled_bronze_flag_drops_bronze_subject_only() {
    let mut state = WarTurnState::default();
    state.forced[1].pending_owners = vec![1];
    state.bronze_era_enter_turn_by_owner = vec![(1, 0.0)];
    let owners = [owner(1, 2, 2), owner(2, 1, 2)];
    let mut flags = base_flags();
    flags.bronze = false;
    let out = run(&owners, &mut state, 1000.0, &flags, &env());
    assert!(!has_subject(
        &out.triggered,
        1,
        Some(ForcedWarEraTag::Bronze)
    ));
    assert!(has_subject(&out.triggered, 2, Some(ForcedWarEraTag::Stone)));
}

#[test]
fn multiwar_r1_before_turn_forty_keeps_only_bronze_and_iron() {
    let mut state = WarTurnState::default();
    state.forced[1].pending_owners = vec![1];
    state.bronze_era_enter_turn_by_owner = vec![(1, 0.0)];
    let owners = [owner(1, 2, 2), owner(2, 1, 2)];
    let mut flags = base_flags();
    flags.multiwar = true;
    flags.inter_civ_open = false;
    let out = run(&owners, &mut state, 1000.0, &flags, &env());
    assert!(out
        .triggered
        .iter()
        .all(|s| matches!(s.era, Some(ForcedWarEraTag::Bronze | ForcedWarEraTag::Iron))));
    assert!(has_subject(
        &out.triggered,
        1,
        Some(ForcedWarEraTag::Bronze)
    ));
    assert!(!out.triggered.iter().any(|s| s.owner_id == 0));
}

#[test]
fn player_pool_blocked_by_active_war_of_player() {
    let mut state = WarTurnState::default();
    // Gracz (0) w aktywnej wojnie kamienia z 3 -> pula gracza zamknieta (kamien: brak jakiejkolwiek wojny).
    state.forced[0].active_by_pair_key = vec![pair(0, 3)];
    let owners: [ForcedOwnerInput; 0] = [];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &env());
    assert!(!out.player_pool_eligible);
    assert!(!out.triggered.iter().any(|s| s.owner_id == 0));
}

#[test]
fn owner_loop_order_is_permutation_and_leads_with_player_partner() {
    let mut state = WarTurnState::default();
    let owners = [owner(1, 1, 2), owner(2, 1, 2), owner(3, 1, 2)];
    let mut flags = base_flags();
    flags.player_first = true;
    flags.player_epoch_war = true;
    let out = run(&owners, &mut state, 1000.0, &flags, &env());
    let mut sorted = out.owner_loop_order.clone();
    sorted.sort_unstable();
    assert_eq!(sorted, vec![1, 2, 3]);
    if let Some(lead) = out.pairing.player_first_partner_id {
        assert_eq!(out.owner_loop_order.first().copied(), Some(lead));
    } else {
        assert_eq!(out.owner_loop_order, vec![1, 2, 3]);
    }
}

#[test]
fn owner_loop_order_without_player_first_is_owner_list_order() {
    let mut state = WarTurnState::default();
    let owners = [owner(3, 1, 2), owner(1, 1, 2), owner(2, 1, 2)];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &env());
    assert_eq!(out.owner_loop_order, vec![3, 1, 2]);
    assert!(out.pairing.player_first_partner_id.is_none());
}

#[test]
fn step_is_deterministic_for_identical_inputs() {
    let owners = [owner(1, 2, 2), owner(2, 1, 2), owner(3, 3, 2)];
    let mk = || {
        let mut s = WarTurnState::default();
        s.forced[1].pending_owners = vec![1];
        s.bronze_era_enter_turn_by_owner = vec![(1, 0.0)];
        s
    };
    let mut flags = base_flags();
    flags.player_first = true;
    flags.player_epoch_war = true;
    let mut a = mk();
    let mut b = mk();
    let out_a = run(&owners, &mut a, 1000.0, &flags, &env());
    let out_b = run(&owners, &mut b, 1000.0, &flags, &env());
    assert_eq!(out_a, out_b);
    assert_eq!(a, b);
}

#[test]
fn eliminated_owner_does_not_count_as_active_era_war() {
    // Para 1-2 (kamien) z wyeliminowanym 2: nie liczy sie do limitu gracza/wojny epoki.
    let mut state = WarTurnState::default();
    state.forced[0].active_by_pair_key = vec![pair(1, 2)];
    let mut e = env();
    e.elim = |id| id == 2;
    let owners: [ForcedOwnerInput; 0] = [];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &e);
    // Sweep nie usuwa (at_war=true), a gracz nie ma aktywnej wojny -> pula otwarta.
    assert!(out.sweep.removed.is_empty());
    assert!(out.player_pool_eligible);
}

#[test]
fn pairing_subjects_carry_reference_hex_of_capital() {
    let mut state = WarTurnState::default();
    state.forced[1].pending_owners = vec![2];
    state.bronze_era_enter_turn_by_owner = vec![(2, 0.0)];
    let owners = [owner(2, 2, 2)];
    let out = run(&owners, &mut state, 1000.0, &base_flags(), &env());
    let s = out
        .triggered
        .iter()
        .find(|s| s.owner_id == 2)
        .expect("owner 2 triggered");
    // Stolica AI 2 w (6,0).
    assert_eq!((s.q, s.r), (6, 0));
}
