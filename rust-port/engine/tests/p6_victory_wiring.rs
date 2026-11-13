//! R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (P6.19-C): wpiecie konca gry do stanu i petli tury.
//!
//! Pin 07d2fbd72 (`gra/src/main.ts`):
//! - sprawdzenie zwyciestwa po turze tylko dla gracza 0 (main.ts:43441-43483, faza `Victory`),
//! - odrzucenie konca tury po zakonczeniu gry (main.ts:37997, :43827),
//! - reset `gameOver` przy nowej grze i wczytaniu (main.ts:45160 i pokrewne),
//! - flaga `graczKiedysMialMiasto` (main.ts:43472) z odtwarzaniem ze miast dla starych zapisow (main.ts:46368).

use civ_engine::domain::victory::{VictoryKind, VictoryResult};
use civ_engine::{PlayableError, PlayableGame, PlayableState, StartGameParams};

fn params_with_epoch(epoch_id: &str) -> StartGameParams {
    StartGameParams {
        epoch_id: epoch_id.to_owned(),
        ..StartGameParams::default()
    }
}

#[test]
fn nowa_gra_ma_flage_bez_konca_gry() {
    let game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    let state = game.state();
    assert_eq!(state.koniec_gry, None);
    assert_eq!(state.gracz_kiedys_mial_miasto, Some(false));
}

#[test]
fn kamien_nie_daje_dominacji_po_turze_a_flaga_miasta_sie_ustawia() {
    let mut game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    game.advance_turn().expect("koniec tury");
    let state = game.state();
    assert_eq!(
        state.koniec_gry, None,
        "era kamienia < ostatnia epoka: brak dominacji"
    );
    assert_eq!(state.gracz_kiedys_mial_miasto, Some(true));
}

#[test]
fn dominacja_w_epoce_zelaza_konczy_gre_po_turze() {
    let mut game = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
    game.advance_turn().expect("koniec tury");
    let result = game.state().koniec_gry.expect("dominacja po turze");
    assert_eq!(result.rodzaj, VictoryKind::Dominacja);
    assert_eq!(result.winner, 1, "gracz czlowieka (PlayerId 1)");
}

#[test]
fn po_koncu_gry_koniec_tury_jest_odrzucany_bez_zmiany_stanu() {
    let mut game = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
    game.advance_turn().expect("koniec tury");
    let turn_before = game.state().turn;
    let queue_before = game.pending_phase_count();
    let state_before: PlayableState = game.state().clone();
    let error = game
        .advance_turn()
        .expect_err("koniec tury po zakonczeniu gry");
    assert!(matches!(
        error,
        PlayableError::GameAlreadyOver(VictoryResult {
            rodzaj: VictoryKind::Dominacja,
            ..
        })
    ));
    assert_eq!(game.state().turn, turn_before);
    assert_eq!(game.pending_phase_count(), queue_before);
    assert_eq!(game.state(), &state_before);
}

#[test]
fn nowa_gra_po_zakonczonej_resetuje_koniec_gry() {
    let mut finished = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
    finished.advance_turn().expect("koniec tury");
    assert!(finished.state().koniec_gry.is_some());
    let fresh = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
    assert_eq!(fresh.state().koniec_gry, None);
    assert_eq!(fresh.state().gracz_kiedys_mial_miasto, Some(false));
}

#[test]
fn zapis_bez_pol_zwyciestwa_laduje_sie_z_domyslami() {
    let game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    let mut value = serde_json::to_value(game.state()).expect("serializacja");
    let object = value.as_object_mut().expect("obiekt");
    assert!(
        !object.contains_key("koniecGry"),
        "pole pomijane gdy brak konca"
    );
    object.remove("graczKiedysMialMiasto");
    let loaded: PlayableState = serde_json::from_value(value).expect("zapis sprzed pola");
    assert_eq!(loaded.gracz_kiedys_mial_miasto, Some(false));
    assert_eq!(loaded.koniec_gry, None);
}
