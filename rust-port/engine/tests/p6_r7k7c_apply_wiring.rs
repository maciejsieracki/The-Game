//! P6-WIRE-WAR-R7K7-C (R7K7C-WIRING): `apply_dipl_deltas_to_state` w `advance_turn` (parytet "brak wpisu = 0").
//!
//! - Brak wpisu wlasciciela w mapie DELT = zadna zmiana jego skarbca/puli Pracy (jak pin: przyrost 0).
//!   Dotyczy to wlascicieli z producentem w stanie; producent nieobecny przy wpisie delty pozostaje bledem
//!   (`WarTurnError::DiplStep`), zgodnie z OTWARTYM odchyleniem opisanym w `turn_war_dipl_steps.rs`.
//! - Bez umow i bez delt `advance_turn` nie rusza skarbcow (brak regresji produkcyjnej sciezki).
//! - Test end-to-end daniny AI -> gracz przez `advance_turn` znajduje sie w `src/domain/playable.rs`
//!   (`advance_turn_moves_tribute_from_ai_treasury_to_human_treasury`), bo wymaga dostepu do stanu gry.

use std::collections::BTreeMap;

use civ_engine::domain::playable::{PlayableGame, PlayableState, StartGameParams};
use civ_engine::domain::turn_war_dipl_steps::apply_dipl_deltas_to_state;
use civ_engine::domain::turn_war_pipeline::WarTurnError;

fn fresh_game() -> PlayableGame {
    PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy")
}

fn with_ai(mut state: PlayableState) -> PlayableState {
    if !state.players.iter().any(|p| !p.is_human) {
        let mut ai = state
            .players
            .iter()
            .find(|p| p.is_human)
            .expect("gracz ludzki")
            .clone();
        ai.is_human = false;
        ai.id = civ_engine::domain::PlayerId::new(2);
        state.players.push(ai);
    }
    state
}

fn human_id(state: &PlayableState) -> i64 {
    state
        .players
        .iter()
        .find(|p| p.is_human)
        .expect("gracz ludzki")
        .id
        .get() as i64
}

#[test]
fn owner_absent_from_delta_maps_keeps_balances_unchanged() {
    // Brak wpisu = 0: delta tylko dla gracza ludzkiego; producent AI i jego pula Pracy bez zmian.
    let base = with_ai(fresh_game().state().clone());
    let human = human_id(&base);
    let mut st = base.clone();
    st.economy.treasury = 50.0;
    st.economy.ai_treasury_by_owner.insert(2, 30.0);
    st.economy.praca_pool_by_owner.insert(2, 4.0);

    let treasury = BTreeMap::from([(human, 6.0)]);
    apply_dipl_deltas_to_state(&mut st, &treasury, &BTreeMap::new()).expect("apply");

    assert_eq!(st.economy.treasury, 56.0);
    assert_eq!(st.economy.ai_treasury_by_owner.get(&2), Some(&30.0));
    assert_eq!(st.economy.praca_pool_by_owner.get(&2), Some(&4.0));
}

#[test]
fn empty_delta_maps_leave_state_identical() {
    // Brak umow/delt (typowa tura bez dyplomacji): stan ekonomii niezmieniony co do bitu.
    let base = with_ai(fresh_game().state().clone());
    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(2, 30.0);
    let before = st.clone();
    apply_dipl_deltas_to_state(&mut st, &BTreeMap::new(), &BTreeMap::new()).expect("apply");
    assert_eq!(st, before);
}

#[test]
fn delta_for_owner_without_producer_is_explicit_error_not_zero() {
    // Wpis delty bez producenta NIE jest traktowany jak zero (BRAK CICHYCH ZER); stan bez zmian.
    let base = with_ai(fresh_game().state().clone());
    let mut st = base.clone();
    let before = st.clone();
    let praca = BTreeMap::from([(2_i64, 1.0)]);
    let err = apply_dipl_deltas_to_state(&mut st, &BTreeMap::new(), &praca)
        .expect_err("brak puli Pracy przy wpisie delty");
    assert!(matches!(err, WarTurnError::DiplStep(_)));
    assert_eq!(st, before);
}

#[test]
fn advance_turn_without_dipl_deltas_does_not_touch_owner_pools() {
    // Produkcyjna sciezka bez umow: `advance_turn` przechodzi, a skarbiec gracza i pule AI sa te same.
    let mut game = fresh_game();
    let before_treasury = game.state().economy.treasury;
    game.advance_turn().expect("advance_turn bez delt");
    assert_eq!(game.state().economy.treasury, before_treasury);
    assert!(game.state().economy.ai_treasury_by_owner.is_empty());
    assert!(game.state().economy.praca_pool_by_owner.is_empty());
}
