//! R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (P6.19-C, r2): wpiecie konca gry do stanu i petli tury.
//!
//! Pin 07d2fbd72 (`gra/src/main.ts`):
//! - sprawdzenie zwyciestwa po turze tylko dla gracza 0 (main.ts:43441-43483, faza `Victory`),
//! - odrzucenie konca tury po zakonczeniu gry (main.ts:37997, :43827),
//! - reset `gameOver` przy nowej grze i wczytaniu (main.ts:47333),
//! - flaga `graczKiedysMialMiasto` (main.ts:43472) nie jest zapisywana (gra/src/game/save.ts), po wczytaniu
//!   odtwarzana ze miast (main.ts:46368-46370).
//!
//! Wektory: `p6_victory_wiring_vectors/vectors.json`, generowane przez `p6_victory_wiring_gen.mjs`, ktory
//! WYKONUJE `victory.ts` z pina i sprawdza kotwice w `main.ts` (SHA pliku `victory.ts` w generatorze).

use civ_engine::domain::victory::{
    check_defeat, check_victory, DefeatInput, VictoryInput, VictoryKind, VictoryMode, VictoryResult,
};
use civ_engine::{PlayableError, PlayableGame, PlayableState, StartGameParams};
use serde_json::Value;

fn params_with_epoch(epoch_id: &str) -> StartGameParams {
    StartGameParams {
        epoch_id: epoch_id.to_owned(),
        ..StartGameParams::default()
    }
}

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_victory_wiring_vectors/vectors.json")).expect("wektory")
}

fn kind_from_pin(name: &str) -> VictoryKind {
    match name {
        "dominacja" => VictoryKind::Dominacja,
        "nauka" => VictoryKind::Nauka,
        "przegrana" => VictoryKind::Przegrana,
        other => panic!("nieznany rodzaj zwyciestwa w wektorze: {other}"),
    }
}

fn expected_result(value: &Value) -> Option<VictoryResult> {
    if value.is_null() {
        return None;
    }
    Some(VictoryResult {
        winner: value["winner"].as_i64().expect("winner"),
        rodzaj: kind_from_pin(value["rodzaj"].as_str().expect("rodzaj")),
    })
}

#[test]
fn wektory_pinu_wiringu_zgodne_z_check_victory_i_check_defeat() {
    let doc = vectors();
    assert_eq!(
        doc["pin"].as_str(),
        Some("07d2fbd72f758705f8e1d59cc4968027ffbafe75")
    );
    assert_eq!(doc["anchors"].as_u64(), Some(10), "kotwice main.ts");
    let cases = doc["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 90, "liczba scenariuszy wiringu");
    for case in cases {
        let input = &case["input"];
        let owners: Vec<i64> = input["cityOwners"]
            .as_array()
            .expect("cityOwners")
            .iter()
            .map(|v| v.as_i64().expect("owner"))
            .collect();
        let flag = input["flagaPinu"].as_bool().expect("flagaPinu");
        let potegi: Vec<f64> = input["potegiWszystkich"]
            .as_array()
            .expect("potegi")
            .iter()
            .map(|v| v.as_f64().expect("moc"))
            .collect();
        let victory_input = VictoryInput {
            city_owner_ids: owners.clone(),
            gracz: 0,
            victory_mode: Some(VictoryMode::MocIDominacja),
            potega_gracza: input["potegaGracza"].as_f64(),
            potegi_wszystkich: Some(potegi),
            gracz_era: input["graczEra"].as_i64(),
            ostatnia_epoka: input["ostatniaEpoka"].as_i64(),
            wszystkie_tech_zbadane: Some(false),
            rakieta_wystrzelona: Some(false),
            epoka_koncowa: None,
            nauka_ukonczona: None,
            gracz_kiedys_mial_miasto: Some(flag),
        };
        let got = check_victory(&victory_input);
        assert_eq!(
            got,
            expected_result(&case["victory"]),
            "checkVictory: miasta {owners:?}, flaga {flag}"
        );
        let defeat = check_defeat(&DefeatInput {
            city_owner_ids: owners.clone(),
            gracz: 0,
            gracz_kiedys_mial_miasto: Some(flag),
        });
        assert_eq!(
            defeat,
            expected_result(&case["defeat"]),
            "checkDefeat: miasta {owners:?}, flaga {flag}"
        );
    }
}

#[test]
fn nowa_gra_ma_flage_bez_konca_gry_bo_stolica_jest_zalozona() {
    let game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    let state = game.state();
    assert_eq!(state.koniec_gry, None);
    assert!(
        state.gracz_kiedys_mial_miasto,
        "stolica startowa = pin main.ts:16508 (ME() dodane do zbioru miast)"
    );
}

#[test]
fn kamien_nie_daje_dominacji_po_turze() {
    let mut game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    game.advance_turn().expect("koniec tury");
    assert_eq!(
        game.state().koniec_gry,
        None,
        "era kamienia < ostatnia epoka: brak dominacji"
    );
    assert!(game.state().gracz_kiedys_mial_miasto);
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
fn wczytanie_zapisu_po_zakonczonej_grze_resetuje_koniec_gry() {
    // Pin main.ts:47333 ustawia gameOver=false przy wczytaniu; Rust: koniec_gry jest #[serde(skip)],
    // wiec zapis go nie zawiera i wczytanie zawsze daje brak konca gry (test na prawdziwej sciezce serde).
    let mut finished = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
    finished.advance_turn().expect("koniec tury");
    assert!(finished.state().koniec_gry.is_some());
    let json = serde_json::to_string(finished.state()).expect("zapis");
    assert!(
        !json.contains("koniecGry"),
        "koniec gry nie trafia do zapisu"
    );
    let loaded: PlayableState = serde_json::from_str(&json).expect("wczytanie");
    assert_eq!(loaded.koniec_gry, None, "po wczytaniu gra trwa");
}

#[test]
fn zapis_bez_pol_zwyciestwa_laduje_sie_z_domyslami() {
    // Pola zwyciestwa nie trafiaja do JSON (pin ich nie zapisuje), wiec zapis sprzed tematu laduje sie
    // bez zmian. Flaga po wczytaniu = false; efektywna wartosc przy ocenie = flaga || miasto gracza.
    let game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    let mut value = serde_json::to_value(game.state()).expect("serializacja");
    let object = value.as_object_mut().expect("obiekt");
    assert!(
        !object.contains_key("koniecGry"),
        "pole pomijane gdy brak konca"
    );
    assert!(
        !object.contains_key("graczKiedysMialMiasto"),
        "flaga nie jest w zapisie (zgodnie z pinem)"
    );
    let loaded: PlayableState = serde_json::from_value(value).expect("zapis sprzed pola");
    assert!(!loaded.gracz_kiedys_mial_miasto);
    assert_eq!(loaded.koniec_gry, None);
}
