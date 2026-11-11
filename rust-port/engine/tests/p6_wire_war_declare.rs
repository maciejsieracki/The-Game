//! P6-WIRE-WAR-DECLARE-CLEANUP (W4): testy `domain/war_turn_declare.rs`.
//!
//! UWAGA (ZALOZENIE, NIE_ZMIERZONO wzgledem weba): bloki deklaracji, sprzatania i licznika miast sa inline
//! w `gra/src/main.ts` (nieeksportowane), wiec wektorow z uruchomionego weba NIE generowano. Oczekiwane
//! wartosci wynikaja z odczytanych regul (`main.ts` ok. 41559-41595, 11590-11619, 11690, 35620-35660, 42441)
//! i z portow modulow skladowych (`war_forced_*`), nie z uruchomienia weba.

use std::collections::BTreeMap;

use civ_engine::domain::ai_zakup_jednostki::{
    AiPurchaseDecline, AiPurchaseOutcome, AiPurchaseParams, AiPurchaseState,
};
use civ_engine::domain::recruitment::{ResourceStock, UnitRecruitment};
use civ_engine::domain::war_forced_pairing::{ForcedWarEraTag, ForcedWarPairingAssignment};
use civ_engine::domain::war_forced_trigger::ForcedEra;
use civ_engine::domain::war_turn_declare::{
    cleanup_forced_war_on_peace, declare_forced_wars, declare_from_assignments,
    is_era_peace_blocked, mark_era_enter_turn, register_regular_war_city_loss,
    run_ai_purchase_commands, set_era_peace_lock, AiPurchaseCommand, CityLossVerdict,
    KEY_REGULAR_WAR_CAPTURED,
};
use civ_engine::domain::war_turn_state::WarTurnState;

fn unit(stock: &[(&str, u32)]) -> UnitRecruitment {
    UnitRecruitment {
        unit_id: "u".into(),
        unit_type: "t".into(),
        gold_cost: 10,
        gold_upkeep: 1,
        stock_cost: stock
            .iter()
            .map(|(k, v)| ((*k).to_string(), *v))
            .collect::<ResourceStock>(),
        resource_upkeep: ResourceStock::new(),
        super_unit: false,
    }
}

fn params() -> AiPurchaseParams {
    AiPurchaseParams {
        manpower_cost: 1.0,
        reserve: None,
        net_income_per_turn: None,
        upkeep_per_turn: None,
        unit_upkeep_per_turn: None,
    }
}

#[test]
fn declare_inserts_active_pair_cycle_and_drops_pending() {
    let mut st = WarTurnState::default();
    st.forced[0].pending_owners = vec![3, 4];
    let n = declare_forced_wars(&mut st, &[(ForcedEra::Stone, 3, 7)], 42.0);
    assert_eq!(n, 1);
    let slot = &st.forced[0];
    assert_eq!(slot.active_by_pair_key.len(), 1);
    let (key, pair) = &slot.active_by_pair_key[0];
    assert_eq!(key, "3-7");
    assert_eq!(pair.attacker_id, 3);
    assert_eq!(pair.target_id, 7);
    assert_eq!(pair.start_turn, Some(42.0));
    assert_eq!(pair.captured_by_attacker, 0);
    assert_eq!(slot.cycle_owners, vec![3]);
    assert_eq!(slot.pending_owners, vec![4]);
}

#[test]
fn redeclare_same_pair_replaces_in_place_without_duplicating_cycle() {
    let mut st = WarTurnState::default();
    declare_forced_wars(
        &mut st,
        &[(ForcedEra::Bronze, 1, 2), (ForcedEra::Bronze, 5, 6)],
        10.0,
    );
    declare_forced_wars(&mut st, &[(ForcedEra::Bronze, 1, 2)], 30.0);
    let slot = &st.forced[1];
    assert_eq!(slot.active_by_pair_key.len(), 2);
    assert_eq!(slot.active_by_pair_key[0].0, "1-2");
    assert_eq!(slot.active_by_pair_key[0].1.start_turn, Some(30.0));
    assert_eq!(slot.cycle_owners, vec![1, 5]);
}

#[test]
fn declare_from_assignments_keeps_only_declared_pairs() {
    let mut st = WarTurnState::default();
    let assignments = [
        ForcedWarPairingAssignment {
            owner_id: 1,
            era: ForcedWarEraTag::Iron,
            target_id: 2,
        },
        ForcedWarPairingAssignment {
            owner_id: 3,
            era: ForcedWarEraTag::Stone,
            target_id: 4,
        },
    ];
    let n = declare_from_assignments(&mut st, &assignments, 5.0, &|o, _t| o == 3);
    assert_eq!(n, 1);
    assert!(st.forced[2].active_by_pair_key.is_empty());
    assert_eq!(st.forced[0].active_by_pair_key[0].0, "3-4");
}

#[test]
fn era_enter_turn_upserts_bronze_and_iron_only() {
    let mut st = WarTurnState::default();
    assert!(mark_era_enter_turn(&mut st, ForcedEra::Bronze, 2, 10.0));
    assert!(mark_era_enter_turn(&mut st, ForcedEra::Bronze, 2, 12.0));
    assert!(mark_era_enter_turn(&mut st, ForcedEra::Iron, 9, 50.0));
    assert!(!mark_era_enter_turn(&mut st, ForcedEra::Stone, 2, 1.0));
    assert_eq!(st.bronze_era_enter_turn_by_owner, vec![(2, 12.0)]);
    assert_eq!(st.iron_era_enter_turn_by_owner, vec![(9, 50.0)]);
}

#[test]
fn peace_cleanup_removes_entry_and_sets_rest_until() {
    let mut st = WarTurnState::default();
    declare_forced_wars(&mut st, &[(ForcedEra::Iron, 8, 2)], 100.0);
    let c =
        cleanup_forced_war_on_peace(&mut st, ForcedEra::Iron, 2, 8, 110.0).expect("wpis istnieje");
    assert_eq!(c.attacker_id, 8);
    assert_eq!(c.rest_until, 130.0);
    assert_eq!(c.waves_deleted_key, "2-8");
    assert!(st.forced[2].active_by_pair_key.is_empty());
    assert_eq!(st.forced[2].rest_until_by_owner, vec![(8, 130.0)]);
}

#[test]
fn peace_cleanup_is_noop_without_entry_or_for_other_era() {
    let mut st = WarTurnState::default();
    declare_forced_wars(&mut st, &[(ForcedEra::Stone, 1, 2)], 5.0);
    assert!(cleanup_forced_war_on_peace(&mut st, ForcedEra::Bronze, 1, 2, 6.0).is_none());
    assert!(cleanup_forced_war_on_peace(&mut st, ForcedEra::Stone, 3, 4, 6.0).is_none());
    assert_eq!(st.forced[0].active_by_pair_key.len(), 1);
    assert!(st.forced[0].rest_until_by_owner.is_empty());
}

#[test]
fn era_peace_lock_blocks_while_current_era_not_past_war_era() {
    let mut st = WarTurnState::default();
    declare_forced_wars(&mut st, &[(ForcedEra::Bronze, 4, 9)], 1.0);
    assert!(set_era_peace_lock(&mut st, 9, 4, &|o| if o == 4 {
        2
    } else {
        0
    }));
    assert!(is_era_peace_blocked(&st, 4, 9, 2));
    assert!(is_era_peace_blocked(&st, 4, 9, 1));
    assert!(!is_era_peace_blocked(&st, 4, 9, 3));
    assert!(!is_era_peace_blocked(&st, 4, 5, 2), "inna para bez blokady");
}

#[test]
fn era_peace_lock_not_set_without_active_forced_war() {
    let mut st = WarTurnState::default();
    assert!(!set_era_peace_lock(&mut st, 1, 2, &|_| 1));
    assert!(st.opaque.is_empty());
}

#[test]
fn city_loss_counts_then_ends_at_two_cities_by_peace() {
    let mut st = WarTurnState::default();
    assert_eq!(
        register_regular_war_city_loss(&mut st, 5, 9, false, true),
        CityLossVerdict::NotAtWar
    );
    assert!(st.opaque.get(KEY_REGULAR_WAR_CAPTURED).is_none());
    assert_eq!(
        register_regular_war_city_loss(&mut st, 5, 9, true, true),
        CityLossVerdict::Counted
    );
    let end = register_regular_war_city_loss(&mut st, 5, 9, true, true);
    match end {
        CityLossVerdict::EndByPeace(c) => {
            assert_eq!((c.owner_a, c.owner_b), (5, 9));
            assert_eq!((c.captured_by_a, c.captured_by_b), (0, 2));
        }
        other => panic!("oczekiwano EndByPeace, jest {other:?}"),
    }
    let arr = st.opaque[KEY_REGULAR_WAR_CAPTURED]
        .as_array()
        .expect("tablica");
    assert!(arr.is_empty(), "wpis usuniety po pokoju");
}

#[test]
fn city_loss_balance_block_keeps_counter_then_peace_on_ok() {
    let mut st = WarTurnState::default();
    // Zdobycie przez ownerA (min = 2): capturedByA rosnie.
    register_regular_war_city_loss(&mut st, 9, 2, true, true);
    let blocked = register_regular_war_city_loss(&mut st, 9, 2, true, false);
    assert!(matches!(blocked, CityLossVerdict::BalanceBlocked(c) if c.captured_by_a == 2));
    let after = register_regular_war_city_loss(&mut st, 9, 2, true, true);
    assert!(matches!(after, CityLossVerdict::EndByPeace(c) if c.captured_by_a == 3));
}

#[test]
fn city_loss_same_owner_is_ignored() {
    let mut st = WarTurnState::default();
    assert_eq!(
        register_regular_war_city_loss(&mut st, 4, 4, true, true),
        CityLossVerdict::NotAtWar
    );
}

#[test]
fn purchase_command_executes_on_real_state_in_order() {
    let mut states: BTreeMap<i64, AiPurchaseState> = BTreeMap::new();
    states.insert(
        1,
        AiPurchaseState {
            treasury: 100.0,
            stock: [("iron".to_string(), 5u32)].into_iter().collect(),
            manpower: 10.0,
        },
    );
    let cmds = vec![
        AiPurchaseCommand {
            owner_id: 1,
            city_id: "a".into(),
            unit: unit(&[("iron", 2)]),
            params: params(),
        },
        AiPurchaseCommand {
            owner_id: 2,
            city_id: "b".into(),
            unit: unit(&[]),
            params: params(),
        },
        AiPurchaseCommand {
            owner_id: 1,
            city_id: "c".into(),
            unit: unit(&[("iron", 2)]),
            params: params(),
        },
    ];
    let reports = run_ai_purchase_commands(&mut states, &cmds);
    assert_eq!(reports.len(), 2, "wlasciciel bez stanu pominiety");
    assert!(matches!(
        reports[0].outcome,
        AiPurchaseOutcome::Purchased { .. }
    ));
    assert!(matches!(
        reports[1].outcome,
        AiPurchaseOutcome::Purchased { .. }
    ));
    let s = &states[&1];
    assert_eq!(s.treasury, 80.0);
    assert_eq!(s.manpower, 8.0);
    assert_eq!(s.stock.get("iron").copied(), Some(1));
}

#[test]
fn purchase_declined_on_missing_stock_leaves_state_unchanged() {
    let mut states: BTreeMap<i64, AiPurchaseState> = BTreeMap::new();
    states.insert(
        1,
        AiPurchaseState {
            treasury: 100.0,
            stock: [("iron".to_string(), 1u32)].into_iter().collect(),
            manpower: 10.0,
        },
    );
    let before = states[&1].clone();
    let cmds = vec![AiPurchaseCommand {
        owner_id: 1,
        city_id: "a".into(),
        unit: unit(&[("iron", 3)]),
        params: params(),
    }];
    let reports = run_ai_purchase_commands(&mut states, &cmds);
    assert_eq!(
        reports[0].outcome,
        AiPurchaseOutcome::Declined(AiPurchaseDecline::MissingStock(
            [("iron".to_string(), 2u32)].into_iter().collect()
        ))
    );
    assert_eq!(states[&1], before);
}

#[test]
fn purchase_declined_by_treasury_gate() {
    let mut states: BTreeMap<i64, AiPurchaseState> = BTreeMap::new();
    states.insert(
        1,
        AiPurchaseState {
            treasury: 5.0,
            stock: ResourceStock::new(),
            manpower: 10.0,
        },
    );
    let cmds = vec![AiPurchaseCommand {
        owner_id: 1,
        city_id: "a".into(),
        unit: unit(&[]),
        params: params(),
    }];
    let reports = run_ai_purchase_commands(&mut states, &cmds);
    assert_eq!(
        reports[0].outcome,
        AiPurchaseOutcome::Declined(AiPurchaseDecline::Gate)
    );
    assert_eq!(states[&1].treasury, 5.0);
}

#[test]
fn state_round_trip_keeps_declared_wars_and_city_counter() {
    let mut st = WarTurnState::default();
    declare_forced_wars(&mut st, &[(ForcedEra::Stone, 1, 2)], 7.0);
    register_regular_war_city_loss(&mut st, 3, 4, true, true);
    let meta = st.to_meta_json();
    assert!(meta.contains_key(KEY_REGULAR_WAR_CAPTURED));
    let back = WarTurnState::from_meta_json(&meta);
    assert_eq!(back, st);
}
