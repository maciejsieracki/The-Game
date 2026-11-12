//! P6-WIRE-WAR-PIPELINE (W8 r3): testy `domain/turn_war_pipeline.rs` (faza Diplomacy).
//!
//! Mini-swiat: gracz (id 1, miasto stolicy) + dwa AI (id 2 i 3, po miescie kazdy z dwoma miastami dla 2).
//! Wejscia mocy/epok/blokad sa jawnymi producentami TESTU (PlayableState ich nie zawiera w r3).
//!
//! Wektory: krok hamulca i tick relacji sa juz pokryte wektorami z pinu w `p6_wire_war_diplo.rs`,
//! `p6_tickdiplo.rs` i `p6_brake_inputs_vectors.rs`; tu sprawdzamy skladanie w jedna ture i zachowanie
//! przez kilka tur. Roznice wzgledem web (kolejnosc faz) sa w raporcie, nie w asercjach na wartosciach web.

use std::collections::BTreeMap;

use civ_engine::domain::ai_diplomacy_turn::{PairKey, PairWarParams};
use civ_engine::domain::brake_inputs::{ForcedEraLock, OwnerFacts};
use civ_engine::domain::brake_power::{Component, ObjectivePowerRaw};
use civ_engine::domain::diplomacy::{shared_border_penalty_for_epochs, DiplomacyParams};
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PeaceLockFacts, WarTurnConfig, WarTurnContext, WarTurnError, WarTurnInputs,
    WarTurnReport,
};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::PlayerId;
use civ_engine::{PlayableGame, StartGameParams};

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

/// Pelne wejscia mini-swiata; `pair (AI_A, AI_B)` ma prog 1000 i N = 2 (kryzys od pierwszej tury).
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

#[test]
fn three_turns_bring_the_ai_pair_to_war_and_keep_it_there() {
    let inputs = world_inputs();
    let cfg = config();
    let mut war = WarTurnState::default();

    let t1 = run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn 1");
    assert!(t1.declarations.is_empty(), "N = 2: brak wojny w turze 1");
    assert_eq!(
        war.brake_phase.counters.get(&(AI_A, AI_B)).copied(),
        Some(1.0)
    );
    assert!(!war.brake_phase.at_war.contains(&(AI_A, AI_B)));

    let t2 = run_turn(&mut war, 2.0, &inputs, &cfg).expect("turn 2");
    assert_eq!(t2.declarations.len(), 1, "wojna z progu w turze 2");
    let decl = t2.declarations[0];
    assert!(
        (decl.declarer == AI_A && decl.victim == AI_B)
            || (decl.declarer == AI_B && decl.victim == AI_A),
        "deklaracja tylko miedzy AI"
    );
    assert!(war.brake_phase.at_war.contains(&(AI_A, AI_B)));
    assert!(!war.brake_phase.counters.contains_key(&(AI_A, AI_B)));

    // Po wojnie kolejna tura nie tworzy nowej deklaracji dla tej pary.
    let t3 = run_turn(&mut war, 3.0, &inputs, &cfg).expect("turn 3");
    assert!(t3.declarations.is_empty());
    assert!(war.brake_phase.at_war.contains(&(AI_A, AI_B)));
    // Mapowanie wlascicieli: PlayableState numeruje graczy od 1, wiec owner 0 nie wchodzi w pary.
    assert!(t1.tick_pairs.iter().all(|&(a, b)| a != 0 && b != 0));
    assert_eq!(
        t3.relation_after_tick.len(),
        t3.tick_pairs.len(),
        "kazda para ma relacje po ticku"
    );
    assert!(war
        .diplomacy
        .relation(PlayerId::new(AI_A as u64), PlayerId::new(AI_B as u64))
        .is_some());
}

#[test]
fn peace_lock_blocks_declaration_for_the_pair() {
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
    for turn in 1..=3 {
        let report = run_turn(&mut war, f64::from(turn), &inputs, &cfg).expect("turn");
        assert!(
            report.declarations.is_empty(),
            "blokada pokoju w turze {turn}"
        );
    }
    assert!(!war.brake_phase.at_war.contains(&(AI_A, AI_B)));
}

#[test]
fn missing_producers_fail_loudly_instead_of_zeroing() {
    let cfg = config();

    let mut no_power = world_inputs();
    no_power.power_raw.remove(&AI_A);
    assert_eq!(
        run_turn(&mut WarTurnState::default(), 1.0, &no_power, &cfg),
        Err(WarTurnError::MissingPower(AI_A))
    );

    let mut no_locks = world_inputs();
    no_locks.peace_locks = None;
    assert_eq!(
        run_turn(&mut WarTurnState::default(), 1.0, &no_locks, &cfg),
        Err(WarTurnError::MissingPeaceLocks)
    );

    let mut no_epoch = world_inputs();
    no_epoch.epochs.remove(&AI_B);
    assert_eq!(
        run_turn(&mut WarTurnState::default(), 1.0, &no_epoch, &cfg),
        Err(WarTurnError::MissingEpoch(AI_B))
    );

    let mut no_facts = world_inputs();
    no_facts.owner_facts.remove(&AI_B);
    assert_eq!(
        run_turn(&mut WarTurnState::default(), 1.0, &no_facts, &cfg),
        Err(WarTurnError::MissingOwnerFacts(AI_B))
    );
}

#[test]
fn shared_border_uses_epoch_penalty_in_the_tick() {
    // Wspolna granica: kara wg wyzszej epoki pary (web sharedBorderPenaltyForEpochs), nie stala -2.
    let params = DiplomacyParams::default();
    let iron = shared_border_penalty_for_epochs(3.0, 1.0, &params);
    let base = shared_border_penalty_for_epochs(1.0, 1.0, &params);
    assert!(iron < base, "zelazo karze mocniej niz epoka 1");

    let run_with_epoch = |epoch: f64| {
        let mut inputs = world_inputs();
        inputs.epochs.insert(AI_A, epoch);
        inputs.epochs.insert(AI_B, epoch);
        inputs.shared_border.insert((AI_A, AI_B));
        let cfg = config();
        let mut war = WarTurnState::default();
        run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn");
        war.diplomacy
            .relation(PlayerId::new(AI_A as u64), PlayerId::new(AI_B as u64))
            .expect("relacja po ticku")
            .trust
    };
    let trust_iron = run_with_epoch(3.0);
    let trust_base = run_with_epoch(1.0);
    assert!(
        trust_iron < trust_base,
        "tick z epoka 3 obniza zaufanie mocniej: {trust_iron} vs {trust_base}"
    );
}

#[test]
fn border_flag_and_epoch_penalty_are_wired_into_the_tick() {
    // Bez wspolnej granicy kara wg epoki NIE dziala: ta sama epoka 3, tick z granica obniza zaufanie.
    let trust_for = |shared: bool, epoch: f64| {
        let mut inputs = world_inputs();
        inputs.epochs.insert(AI_A, epoch);
        inputs.epochs.insert(AI_B, epoch);
        if shared {
            inputs.shared_border.insert((AI_A, AI_B));
        }
        let cfg = config();
        let mut war = WarTurnState::default();
        run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn");
        war.diplomacy
            .relation(PlayerId::new(AI_A as u64), PlayerId::new(AI_B as u64))
            .expect("relacja po ticku")
            .trust
    };
    let params = DiplomacyParams::default();
    let penalty_iron = shared_border_penalty_for_epochs(3.0, 3.0, &params);
    let penalty_base = shared_border_penalty_for_epochs(1.0, 1.0, &params);
    assert_eq!(penalty_iron, params.common_border_trust_per_turn_iron);
    assert_eq!(penalty_base, params.common_border_trust_per_turn);

    let with_border_iron = trust_for(true, 3.0);
    let without_border_iron = trust_for(false, 3.0);
    assert!(
        with_border_iron < without_border_iron,
        "granica wlaczona: kara; brak granicy: brak kary ({with_border_iron} vs {without_border_iron})"
    );
    // Roznica miedzy epoka 3 a 1 (obie ze wspolna granica) = roznica kar z tabeli, bez innych skladnikow epoki.
    let with_border_base = trust_for(true, 1.0);
    let diff_actual = with_border_iron - with_border_base;
    let diff_expected = penalty_iron - penalty_base;
    assert!(
        (diff_actual - diff_expected).abs() < 1e-9,
        "delta zaufania {diff_actual} != delta kary {diff_expected}"
    );
}

#[test]
fn playable_advance_turn_runs_the_diplomacy_phase_without_ai_owners() {
    let mut game = PlayableGame::new(StartGameParams {
        civ_id: "rzymianie".to_owned(),
        civ_name: "Rzymianie".to_owned(),
        seed: 42,
        ..StartGameParams::default()
    })
    .expect("scenario");
    for _ in 0..3 {
        game.advance_turn().expect("tura przechodzi z faza wojny");
    }
    assert_eq!(game.state().turn, 4);
    assert!(
        game.state().war.is_default(),
        "bez par AI stan wojny pozostaje pusty"
    );
}

#[test]
fn from_playable_reads_contacts_from_the_raw_war_key() {
    let game = PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenario");
    let mut war = WarTurnState::default();
    war.opaque.insert(
        "diplomaticallyDiscoveredOwners".to_owned(),
        serde_json::json!([AI_A, AI_B]),
    );
    let inputs = WarTurnInputs::from_playable(game.state(), &war);
    assert_eq!(inputs.contacts, vec![AI_A, AI_B]);
    assert_eq!(inputs.me_id, HUMAN);
    assert!(
        inputs.peace_locks.is_none(),
        "producent blokad nieobecny w r3"
    );
    assert!(inputs.power_raw.is_empty(), "producent mocy nieobecny w r3");
}
