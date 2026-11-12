//! P6-CRED-WOJNA-Q1 (runda 2, obrona r2 zarzut 1): hak P4 `note_war_entered` wpiety w deklaracje wojny
//! wymuszonej (`declare_forced_wars` / `declare_from_assignments` w `war_turn_declare.rs`).
//! Web: `chargeWarDeclarationCredibility` wolany przy wojnie wymuszonej (main.ts ok. 41931) zeruje licznik
//! "bez wojny" obu stron. Test sprawdza: zapis obu stron, brak zapisu dla barbarzyncy, wybor tylko
//! zadeklarowanych par i atomowosc (blad odczytu rejestru nie zostawia czesciowego stanu wymuszen).

use civ_engine::domain::credibility::{CredibilityRegistry, KEY_LAST_WAR};
use civ_engine::domain::war_forced_pairing::{ForcedWarEraTag, ForcedWarPairingAssignment};
use civ_engine::domain::war_forced_trigger::ForcedEra;
use civ_engine::domain::war_turn_declare::{declare_forced_wars, declare_from_assignments};
use civ_engine::domain::war_turn_state::WarTurnState;
use serde_json::Value;

fn last_war_of(st: &WarTurnState, owner: i64) -> Option<f64> {
    let reg = CredibilityRegistry::from_meta(&st.opaque).expect("rejestr czytelny");
    reg.last_war_turn
        .iter()
        .find(|(o, _)| *o == owner)
        .map(|(_, t)| *t)
}

#[test]
fn forced_war_charges_both_sides_of_the_pair() {
    let mut st = WarTurnState::default();
    let n = declare_forced_wars(&mut st, &[(ForcedEra::Stone, 3, 7)], 42.0).unwrap();
    assert_eq!(n, 1);
    assert_eq!(last_war_of(&st, 3), Some(42.0));
    assert_eq!(last_war_of(&st, 7), Some(42.0));
    // Stan wymuszen zapisany jak dotad (asercja z p6_wire_war_declare, tu tylko kontrola rownoleglosci).
    assert_eq!(st.forced[0].active_by_pair_key.len(), 1);
}

#[test]
fn forced_war_with_barbarian_does_not_touch_registry() {
    let mut st = WarTurnState::default();
    declare_forced_wars(&mut st, &[(ForcedEra::Bronze, -1, 2)], 9.0).unwrap();
    assert_eq!(last_war_of(&st, 2), None);
    assert_eq!(last_war_of(&st, -1), None);
    // Wojna wymuszona z barbarzyncą nadal wchodzi do stanu wymuszen (zachowanie sprzed haka).
    assert_eq!(st.forced[1].active_by_pair_key.len(), 1);
}

#[test]
fn declare_from_assignments_charges_only_declared_pairs() {
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
    let n = declare_from_assignments(&mut st, &assignments, 5.0, &|o, _t| o == 3).unwrap();
    assert_eq!(n, 1);
    assert_eq!(last_war_of(&st, 3), Some(5.0));
    assert_eq!(last_war_of(&st, 4), Some(5.0));
    assert_eq!(last_war_of(&st, 1), None);
    assert_eq!(last_war_of(&st, 2), None);
}

#[test]
fn registry_read_error_leaves_forced_state_untouched() {
    let mut st = WarTurnState::default();
    // Uszkodzony zapis: klucz ostatniej wojny jako tekst zamiast mapy.
    st.opaque
        .insert(KEY_LAST_WAR.into(), Value::String("zle".into()));
    let res = declare_forced_wars(&mut st, &[(ForcedEra::Stone, 3, 7)], 42.0);
    assert!(res.is_err(), "blad odczytu rejestru musi wrocic jako Err");
    assert!(
        st.forced[0].active_by_pair_key.is_empty(),
        "hak wykonany przed mutacja: brak czesciowego zapisu wymuszenia"
    );
    assert!(st.forced[0].cycle_owners.is_empty());
}
