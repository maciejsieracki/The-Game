//! P6-BRAKE-INPUTS: testy behawioralne producentow wejsc `BrakePhaseInput` (W8 podzial 2/3).
//! Kazdy test opisuje zachowanie webu (pin 07d2fbd72) jako warunek na wyjsciu producenta.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::ai_diplomacy_turn::pair_key;
use civ_engine::domain::brake_inputs::{
    contacts_for, crisis_war_gate_blocked, gate_blocked_set, is_peace_locked_between,
    peace_locked_set, phase_owners, power_map, ForcedEraLock, GateFacts, OwnerFacts,
};
use civ_engine::domain::diplomacy_truce::PairMetaWeb;

fn meta_with_peace_until(until: f64) -> PairMetaWeb {
    PairMetaWeb {
        peace_until_turn: Some(until),
        ..PairMetaWeb::default()
    }
}

fn facts(era: f64, war_count: i64, is_player: bool) -> GateFacts {
    GateFacts {
        era,
        war_count,
        is_player,
    }
}

#[test]
fn peace_treaty_lock_holds_only_before_peace_until_turn() {
    let locks = BTreeMap::new();
    let epoch = |_: i64| 0;
    let meta = meta_with_peace_until(50.0);
    assert!(is_peace_locked_between(
        1,
        2,
        &locks,
        epoch,
        Some(&meta),
        10.0
    ));
    assert!(!is_peace_locked_between(
        1,
        2,
        &locks,
        epoch,
        Some(&meta),
        60.0
    ));
    assert!(!is_peace_locked_between(1, 2, &locks, epoch, None, 10.0));
}

#[test]
fn forced_era_lock_follows_owner_epoch_and_is_symmetric_in_pair_order() {
    let mut locks = BTreeMap::new();
    locks.insert(
        pair_key(1, 2),
        ForcedEraLock {
            owner_id: 1,
            era: 2,
        },
    );
    // web: isForcedEraPeaceLocked = currentEra <= warEra
    let still_locked = |_: i64| 2;
    let released = |_: i64| 3;
    assert!(is_peace_locked_between(
        1,
        2,
        &locks,
        still_locked,
        None,
        0.0
    ));
    assert!(is_peace_locked_between(
        2,
        1,
        &locks,
        still_locked,
        None,
        0.0
    ));
    assert!(!is_peace_locked_between(1, 2, &locks, released, None, 0.0));
}

#[test]
fn peace_locked_set_contains_only_locked_pairs() {
    let mut metas = BTreeMap::new();
    metas.insert((1, 2), meta_with_peace_until(100.0));
    let pairs = [(1, 2), (1, 3)];
    let set = peace_locked_set(&pairs, &BTreeMap::new(), |_| 0, &metas, 10.0);
    assert_eq!(set, BTreeSet::from([(1, 2)]));
}

#[test]
fn gate_disabled_never_blocks() {
    assert!(!crisis_war_gate_blocked(
        false,
        1.0,
        facts(0.0, 0, false),
        facts(0.0, 0, false)
    ));
}

#[test]
fn gate_r1_blocks_wars_before_turn_40_for_ordinary_declaration() {
    assert!(crisis_war_gate_blocked(
        true,
        1.0,
        facts(0.0, 0, false),
        facts(0.0, 0, false)
    ));
    assert!(!crisis_war_gate_blocked(
        true,
        100.0,
        facts(0.0, 0, false),
        facts(0.0, 0, false)
    ));
}

#[test]
fn gate_blocked_set_checks_both_declaration_orders() {
    let mut facts_map = BTreeMap::new();
    facts_map.insert(1, facts(0.0, 0, false));
    facts_map.insert(2, facts(0.0, 0, false));
    let blocked = gate_blocked_set(true, 1.0, &[(1, 2)], &facts_map);
    assert_eq!(blocked, BTreeSet::from([(1, 2), (2, 1)]));
    // Pominiete pary bez faktow wlasciciela.
    assert!(gate_blocked_set(true, 1.0, &[(1, 9)], &facts_map).is_empty());
}

#[test]
fn contacts_mirror_web_discovered_set_sorted_without_extra_filter() {
    // Web zwraca zbior bez filtra; wykluczenie gracza jest po stronie zrodla (computeDiplomaticContacts).
    let discovered = BTreeSet::from([3, 0, 2, 1]);
    assert_eq!(contacts_for(&discovered), vec![0, 1, 2, 3]);
}

#[test]
fn phase_owners_mark_player_and_fail_on_missing_facts() {
    let ids = [0, 1, 2, 3];
    let mut f = BTreeMap::new();
    let base = OwnerFacts {
        is_barbarian: false,
        is_city_copy: false,
        eliminated: false,
        city_count: 2.0,
    };
    f.insert(0, base);
    f.insert(1, base);
    f.insert(
        2,
        OwnerFacts {
            city_count: 0.0,
            ..base
        },
    );
    // Owner 3 nie ma faktow -> jawny blad (nie cicha utrata wlasciciela).
    let err = phase_owners(0, &ids, &f).expect_err("brak faktow musi byc bledem");
    assert_eq!(err.owner_id, 3);
    let owners = phase_owners(0, &[0, 1, 2], &f).expect("komplet faktow");
    let got: Vec<(i64, bool)> = owners.iter().map(|o| (o.id, o.info.is_player)).collect();
    assert_eq!(got, vec![(0, true), (1, false), (2, false)]);
    assert_eq!(owners[2].info.city_count, 0.0);
}

#[test]
fn power_map_collects_per_owner_power() {
    let map = power_map(&[0, 1], |id| id as f64 * 10.0);
    assert_eq!(map.get(&0), Some(&0.0));
    assert_eq!(map.get(&1), Some(&10.0));
}
