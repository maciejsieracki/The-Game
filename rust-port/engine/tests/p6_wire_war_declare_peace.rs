//! P6-WIRE-WAR-DECLARE-CLEANUP (W4), czesc 2: bezpiecznik wojny wymuszonej przy liczeniu miast, sprzatanie
//! wojny zwyklej przy KAZDYM pokoju pary oraz kolejnosc blokady pokoju epoki (poprawki po zarzutach r1).
//!
//! Wektory: web `recordRegularWarCityLoss` (main.ts ok. 35614-35620, bezpiecznik `*ForceWarActiveByPairKey.has`),
//! `cleanupRegularWarOnPeace` (ok. 11648-11653), `finalizePeaceTreatyBetween` (ok. 11690, 11739-11742).
//! Inline w main.ts (nieeksportowane): oczekiwania z odczytanych regul, NIE z uruchomienia weba (ZAŁOŻENIE jak W3).

use civ_engine::domain::war_forced_trigger::ForcedEra;
use civ_engine::domain::war_turn_declare::{
    cleanup_forced_war_on_peace, cleanup_regular_war_on_peace, declare_forced_wars,
    finalize_peace_between, is_era_peace_blocked, register_regular_war_city_loss,
    set_era_peace_lock, CityLossVerdict, KEY_AI_AI_PEACE_REQUEST, KEY_REGULAR_WAR_CAPTURED,
    KEY_WAR_WEARINESS,
};
use civ_engine::domain::war_turn_state::WarTurnState;
use serde_json::json;

fn forced_stone_war(state: &mut WarTurnState, attacker: i64, target: i64, turn: f64) {
    declare_forced_wars(state, &[(ForcedEra::Stone, attacker, target)], turn);
}

#[test]
fn forced_war_pair_is_not_counted_as_regular_city_loss() {
    let mut state = WarTurnState::default();
    forced_stone_war(&mut state, 1, 2, 10.0);
    for _ in 0..3 {
        assert_eq!(
            register_regular_war_city_loss(&mut state, 1, 2, true, true),
            CityLossVerdict::ForcedWarPair
        );
    }
    // Bezpiecznik nic nie zapisuje: brak licznika zwyklej wojny dla tej pary.
    assert!(!state.opaque.contains_key(KEY_REGULAR_WAR_CAPTURED));
}

#[test]
fn forced_war_pair_guard_is_era_independent() {
    let mut state = WarTurnState::default();
    declare_forced_wars(&mut state, &[(ForcedEra::Iron, 3, 4)], 50.0);
    assert_eq!(
        register_regular_war_city_loss(&mut state, 4, 3, true, true),
        CityLossVerdict::ForcedWarPair
    );
    assert!(!state.opaque.contains_key(KEY_REGULAR_WAR_CAPTURED));
}

#[test]
fn negotiated_peace_clears_regular_counter_so_next_war_starts_at_zero() {
    let mut state = WarTurnState::default();
    assert_eq!(
        register_regular_war_city_loss(&mut state, 1, 2, true, true),
        CityLossVerdict::Counted
    );
    // Pokoj z negocjacji (bez wojny wymuszonej): licznik musi zniknac.
    let report = finalize_peace_between(&mut state, 1, 2, 20.0, &|_| 1);
    assert_eq!(report.regular_cleaned, 1);
    assert!(!report.era_lock_set);
    // Nowa wojna tej pary: pierwsze miasto to znow 1, nie 2 (bez przecieku, bez EndByPeace).
    assert_eq!(
        register_regular_war_city_loss(&mut state, 1, 2, true, true),
        CityLossVerdict::Counted
    );
}

#[test]
fn cleanup_regular_war_removes_all_three_maps_only_for_its_pair() {
    let mut state = WarTurnState::default();
    state.opaque.insert(
        KEY_REGULAR_WAR_CAPTURED.into(),
        json!([["1-2", {"ownerA": 1, "ownerB": 2, "capturedByA": 1, "capturedByB": 0}],
               ["3-4", {"ownerA": 3, "ownerB": 4, "capturedByA": 0, "capturedByB": 1}]]),
    );
    state.opaque.insert(
        KEY_AI_AI_PEACE_REQUEST.into(),
        json!([["1-2", {"kind": "x"}]]),
    );
    state
        .opaque
        .insert(KEY_WAR_WEARINESS.into(), json!([["1-2", {"turns": 5}]]));
    // Klucz pary jest normalizowany (min-max): wywolanie (2, 1) czysci wpisy pary 1-2.
    assert_eq!(cleanup_regular_war_on_peace(&mut state, 2, 1), 3);
    assert_eq!(
        state.opaque.get(KEY_REGULAR_WAR_CAPTURED).unwrap(),
        &json!([["3-4", {"ownerA": 3, "ownerB": 4, "capturedByA": 0, "capturedByB": 1}]])
    );
    assert_eq!(
        state.opaque.get(KEY_AI_AI_PEACE_REQUEST).unwrap(),
        &json!([])
    );
    assert_eq!(state.opaque.get(KEY_WAR_WEARINESS).unwrap(), &json!([]));
}

#[test]
fn cleanup_regular_war_without_keys_leaves_meta_untouched() {
    let mut state = WarTurnState::default();
    assert_eq!(cleanup_regular_war_on_peace(&mut state, 1, 2), 0);
    assert!(state.opaque.is_empty());
}

#[test]
fn finalize_peace_sets_era_lock_then_cleans_forced_war() {
    let mut state = WarTurnState::default();
    forced_stone_war(&mut state, 1, 2, 10.0);
    let report = finalize_peace_between(&mut state, 1, 2, 30.0, &|_| 2);
    assert!(report.era_lock_set);
    assert_eq!(report.forced_cleaned.len(), 1);
    assert_eq!(report.forced_cleaned[0].attacker_id, 1);
    assert_eq!(report.forced_cleaned[0].rest_until, 30.0 + 20.0);
    // Blokada zapisana z epoka napastnika 2: blokuje, dopoki obecna epoka <= 2.
    assert!(is_era_peace_blocked(&state, 1, 2, 2));
    assert!(!is_era_peace_blocked(&state, 1, 2, 3));
    // Wpis aktywny usuniety: kolejny pokoj nie sprzata niczego w wojnie wymuszonej.
    let again = finalize_peace_between(&mut state, 1, 2, 31.0, &|_| 2);
    assert!(again.forced_cleaned.is_empty());
}

#[test]
fn peace_lock_requires_cleanup_after() {
    // KONTRAKT: blokada czyta wpis aktywny, wiec wywolana PO cleanup nie zapisuje nic (cicha utrata).
    // Dlatego wolajacy pokoj ma uzywac `finalize_peace_between`.
    let mut state = WarTurnState::default();
    forced_stone_war(&mut state, 1, 2, 10.0);
    cleanup_forced_war_on_peace(&mut state, ForcedEra::Stone, 1, 2, 30.0);
    assert!(!set_era_peace_lock(&mut state, 1, 2, &|_| 2));
    assert!(!is_era_peace_blocked(&state, 1, 2, 2));
}
