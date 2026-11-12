//! P6-CRED-WOJNA-Q1: hak P4 "kazda wojna zeruje licznik bez wojny OBU stron" (web `main.ts:12223-12224`)
//! wpiety w produkcyjny pipeline wojny `run_war_turn` (wojny z hamulca, `BrakePhaseOutput::declarations`).
//!
//! Mini-swiat jak w `p6_wire_war_pipeline.rs`: gracz (1) + dwa AI (2, 3); para AI (2,3) z progiem 1000 i N = 2
//! wchodzi w wojne w turze 2. Asercje dotycza wylacznie stanu rejestru wiarygodnosci (`opaque`, klucz
//! `wiarygodnoscOstatniaWojnaTuraByOwner`), nie wartosci z pinu (te sa w `p6_credibility*`).

use std::collections::BTreeMap;

use civ_engine::domain::ai_diplomacy_turn::{PairKey, PairWarParams};
use civ_engine::domain::brake_inputs::{ForcedEraLock, OwnerFacts};
use civ_engine::domain::brake_power::{Component, ObjectivePowerRaw};
use civ_engine::domain::credibility::CredibilityRegistry;
use civ_engine::domain::turn_war_dipl_steps::note_war_declarations;
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PeaceLockFacts, WarTurnConfig, WarTurnContext, WarTurnError, WarTurnInputs,
    WarTurnReport,
};
use civ_engine::domain::war_turn_state::WarTurnState;

const HUMAN: i64 = 1;
const AI_A: i64 = 2;
const AI_B: i64 = 3;

#[allow(non_snake_case)]
fn P(v: f64) -> Component {
    Component::Provided(v)
}

fn power(owner_id: i64, miasta: f64, jednostki: f64) -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        owner_id,
        epoka: 1.0,
        jednostki: P(jednostki),
        wygrane_bitwy: P(0.0),
        bitwy_pkt_sum: Component::ExplicitZero,
        suma_ludkow: P(0.0),
        rekrut_ekw: P(0.0),
        miasta: P(miasta),
        heksy_terytorium: P(0.0),
        budynki: P(0.0),
        tech_zbadane: P(0.0),
        ulepszenia_terenu: P(0.0),
        kultura_imperium: Component::ExplicitZero,
        miasta_jednosc_religii: Component::ExplicitZero,
        zdobycze_power: Component::ExplicitZero,
    }
}

fn facts(city_count: f64) -> OwnerFacts {
    OwnerFacts {
        is_barbarian: false,
        is_city_copy: false,
        eliminated: false,
        city_count,
    }
}

fn world_inputs() -> WarTurnInputs {
    let mut inputs = WarTurnInputs {
        me_id: HUMAN,
        human_ids: vec![HUMAN],
        contacts: vec![AI_A, AI_B],
        city_owner_ids: vec![HUMAN, AI_A, AI_A, AI_B],
        ai_start_owner_ids: vec![AI_A, AI_B],
        ..WarTurnInputs::default()
    };
    inputs.owner_facts.insert(HUMAN, facts(1.0));
    inputs.owner_facts.insert(AI_A, facts(2.0));
    inputs.owner_facts.insert(AI_B, facts(1.0));
    for id in [HUMAN, AI_A, AI_B] {
        inputs.epochs.insert(id, 1.0);
    }
    inputs.power_raw.insert(HUMAN, power(HUMAN, 1.0, 1.0));
    inputs.power_raw.insert(AI_A, power(AI_A, 2.0, 3.0));
    inputs.power_raw.insert(AI_B, power(AI_B, 1.0, 1.0));
    inputs.peace_locks = Some(PeaceLockFacts::default());
    inputs
}

fn config() -> WarTurnConfig {
    let mut params: BTreeMap<PairKey, PairWarParams> = BTreeMap::new();
    params.insert(
        (AI_A, AI_B),
        PairWarParams {
            prog: 1000.0,
            n: 2.0,
        },
    );
    WarTurnConfig::new(params, false)
}

fn run_turn(
    war: &mut WarTurnState,
    turn: f64,
    inputs: &WarTurnInputs,
    cfg: &WarTurnConfig,
) -> Result<WarTurnReport, WarTurnError> {
    let mut ctx = WarTurnContext {
        war,
        turn,
        inputs,
        config: cfg,
    };
    run_war_turn(&mut ctx)
}

fn last_war_of(war: &WarTurnState) -> Vec<(i64, f64)> {
    CredibilityRegistry::from_meta(&war.opaque)
        .expect("rejestr wiarygodnosci czytelny")
        .last_war_turn
}

#[test]
fn war_from_brake_resets_p4_counter_for_both_sides() {
    let inputs = world_inputs();
    let cfg = config();
    let mut war = WarTurnState::default();

    run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn 1");
    assert!(
        last_war_of(&war).is_empty(),
        "tura 1: brak wojny, licznik P4 bez zmian"
    );

    let t2 = run_turn(&mut war, 2.0, &inputs, &cfg).expect("turn 2");
    assert_eq!(t2.declarations.len(), 1, "wojna z progu w turze 2");

    let last = last_war_of(&war);
    assert!(
        last.contains(&(AI_A, 2.0)) && last.contains(&(AI_B, 2.0)),
        "obie strony wojny maja zerowany licznik od tury 2, bylo: {last:?}"
    );
    assert!(
        !last.iter().any(|(id, _)| *id == HUMAN),
        "gracz nie uczestniczyl w wojnie: {last:?}"
    );
}

#[test]
fn ongoing_war_does_not_reenter_and_keeps_the_turn_of_declaration() {
    let inputs = world_inputs();
    let cfg = config();
    let mut war = WarTurnState::default();

    run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn 1");
    run_turn(&mut war, 2.0, &inputs, &cfg).expect("turn 2");
    let t3 = run_turn(&mut war, 3.0, &inputs, &cfg).expect("turn 3");

    assert!(
        t3.declarations.is_empty(),
        "po wojnie brak nowej deklaracji"
    );
    let last = last_war_of(&war);
    assert!(
        last.contains(&(AI_A, 2.0)) && last.contains(&(AI_B, 2.0)),
        "tura 3 nie przesuwa zapisu wojny: {last:?}"
    );
}

#[test]
fn peace_lock_blocks_war_and_the_p4_hook() {
    let mut inputs = world_inputs();
    let mut locks = PeaceLockFacts::default();
    locks.forced_era_locks.insert(
        (AI_A, AI_B),
        ForcedEraLock {
            owner_id: AI_A,
            era: 1,
        },
    );
    inputs.peace_locks = Some(locks);
    let cfg = config();
    let mut war = WarTurnState::default();

    run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn 1");
    let t2 = run_turn(&mut war, 2.0, &inputs, &cfg).expect("turn 2");
    assert!(t2.declarations.is_empty(), "blokada pokoju: brak wojny");
    assert!(
        last_war_of(&war).is_empty(),
        "bez wojny hak P4 nie zeruje licznika"
    );
}

#[test]
fn note_war_declarations_empty_list_leaves_state_untouched() {
    let mut war = WarTurnState::default();
    let before = war.opaque.clone();
    note_war_declarations(&mut war, &[], 5.0).expect("pusta lista");
    assert_eq!(war.opaque, before, "brak wojny = brak zmiany opaque");
}

#[test]
fn note_war_declarations_writes_both_sides_and_is_idempotent_per_turn() {
    let mut war = WarTurnState::default();
    note_war_declarations(&mut war, &[(AI_A, AI_B)], 7.0).expect("wojna");
    let once = war.opaque.clone();
    assert!(last_war_of(&war).contains(&(AI_A, 7.0)));
    assert!(last_war_of(&war).contains(&(AI_B, 7.0)));

    note_war_declarations(&mut war, &[(AI_A, AI_B)], 7.0).expect("powtorka");
    assert_eq!(
        war.opaque, once,
        "powtorzenie tej samej tury nie zmienia zapisu"
    );
}
