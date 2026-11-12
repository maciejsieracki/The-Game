//! P6-WIRE-WAR-R7K7-C (wiring): `apply_dipl_deltas_to_state` jest wpiete w faze Diplomacy
//! (`run_diplomacy_war_phase` wywolywane przez `advance_turn`).
//! Zakres tego pliku (granica swiadoma): tura bez umow przechodzi z wpietym krokiem i nie tworzy spurious wpisow skarbca/puli Pracy
//!   (parytet "brak wpisu = 0" nie moze zapisywac zer, ktorych pin nie zapisuje w tej sciezce),
//! oraz zgodnosc wsteczna: stan bez kluczy pul wlascicieli (sprzed R7K7-C) laduje sie z pustymi mapami.
//! Sciezka z niezerowymi deltami przez `advance_turn` jest pokryta w `src/domain/playable.rs`
//! (`r7k7c_wiring_behaviour_tests`: danina AI 40 ¤/tura, saldo 100 -> 60; test pada bez wywolania apply).

use civ_engine::domain::playable::{PlayableGame, PlayableState, StartGameParams};

fn game() -> PlayableGame {
    PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy")
}

#[test]
fn advance_turn_without_deals_creates_no_owner_entries() {
    let mut g = game();
    let before_ai = g.state().economy.ai_treasury_by_owner.clone();
    let before_praca = g.state().economy.praca_pool_by_owner.clone();
    let before_treasury = g.state().economy.treasury;
    g.advance_turn().expect("tura z wpietym krokiem dyplomacji");
    let st = g.state();
    assert_eq!(st.economy.ai_treasury_by_owner, before_ai);
    assert_eq!(st.economy.praca_pool_by_owner, before_praca);
    assert_eq!(st.economy.treasury, before_treasury);
}

#[test]
fn advance_turn_twice_still_advances_without_deals() {
    let mut g = game();
    g.advance_turn().expect("tura 1");
    g.advance_turn().expect("tura 2");
    assert!(g.state().economy.ai_treasury_by_owner.is_empty());
    assert!(g.state().economy.praca_pool_by_owner.is_empty());
}

#[test]
fn state_without_owner_pool_keys_loads_with_empty_maps() {
    // Zgodnosc wsteczna: JSON bez kluczy pul wlascicieli (format sprzed R7K7-C) -> puste mapy.
    let g = game();
    let mut value: serde_json::Value = serde_json::to_value(g.state()).expect("to_value");
    if let Some(econ) = value.get_mut("economy").and_then(|e| e.as_object_mut()) {
        econ.remove("aiTreasuryByOwner");
        econ.remove("pracaPoolByOwner");
    }
    let legacy: PlayableState = serde_json::from_value(value).expect("legacy load");
    assert!(legacy.economy.ai_treasury_by_owner.is_empty());
    assert!(legacy.economy.praca_pool_by_owner.is_empty());
}
