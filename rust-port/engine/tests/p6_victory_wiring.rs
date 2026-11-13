//! R-RUSTPORT-P6-ZWYCIESTWO-WIRING-Q1 (P6.19-C, r3): wpiecie konca gry do stanu i petli tury.
//!
//! Pin 07d2fbd72 (`gra/src/main.ts`), zakres r3:
//! - sprawdzenie zwyciestwa po turze tylko dla gracza 0 (main.ts:43441-43483, blok try/catch),
//! - odrzucenie konca tury po zakonczeniu gry (main.ts:37997, :38043),
//! - reset `gameOver` przy nowej grze i wczytaniu (main.ts:45160, :47333),
//! - flaga `graczKiedysMialMiasto` (`playerEverOwnedCityByOwner`): ustawiana przy starcie, odtwarzana przy
//!   wczytaniu ze miast (main.ts:45645-45646, :46368-46370); pin nie zapisuje jej w JSON.
//!
//! Wektory: `p6_victory_wiring_vectors/vectors.json`, generowane przez `p6_victory_wiring_gen.mjs`. Generator
//! WYKONUJE tekst pina (blok po turze, bramki EndTurn, reset, odtworzenie flagi) w sandboxie i zapisuje
//! SHA-256 kazdego fragmentu. Testy porownuja wyjscia Rust (decyzja wiringu, bramka, reset) z tymi wynikami.

use civ_engine::domain::playable::{victory_turn_decision, VictoryTurnInput};
use civ_engine::domain::victory::{
    check_defeat, check_victory, DefeatInput, VictoryInput, VictoryKind, VictoryMode, VictoryResult,
};
use civ_engine::{PlayableError, PlayableGame, PlayableState, StartGameParams};
use serde_json::Value;

const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const VICTORY_SHA256: &str = "2f22949ba00bbfb754410f66fc5e1856b67dc0621d31ea310c6df39e6517bb8a";

/// Fotel czlowieka w pinie to 0; w Rust `HUMAN_PLAYER_ID` = 1, a AI przesuniete o 1.
fn rust_owner(pin_owner: i64) -> i64 {
    if pin_owner == 0 {
        1
    } else {
        pin_owner + 1
    }
}

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

/// Wynik z wektora pinu (winner w numeracji pina).
fn expected_result(value: &Value) -> Option<VictoryResult> {
    if value.is_null() {
        return None;
    }
    Some(VictoryResult {
        winner: value["winner"].as_i64().expect("winner"),
        rodzaj: kind_from_pin(value["rodzaj"].as_str().expect("rodzaj")),
    })
}

/// Wynik z wektora pinu przeniesiony do numeracji Rust (zwyciezca = fotel czlowieka).
fn expected_rust_result(value: &Value) -> Option<VictoryResult> {
    expected_result(value).map(|result| VictoryResult {
        winner: rust_owner(result.winner),
        rodzaj: result.rodzaj,
    })
}

fn owners_of(value: &Value) -> Vec<i64> {
    value
        .as_array()
        .expect("lista wlascicieli")
        .iter()
        .map(|v| v.as_i64().expect("owner"))
        .collect()
}

fn finished_game() -> PlayableGame {
    let mut game = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
    game.advance_turn().expect("koniec tury");
    assert!(
        game.state().koniec_gry.is_some(),
        "scenariusz: gra zakonczona dominacja"
    );
    game
}

#[test]
fn wektory_pinu_checkvictory_i_checkdefeat_zgodne_z_wejsciem_wiringu() {
    let doc = vectors();
    assert_eq!(doc["pin"].as_str(), Some(PIN));
    assert_eq!(doc["victorySha256"].as_str(), Some(VICTORY_SHA256));
    assert_eq!(doc["anchors"].as_u64(), Some(10), "kotwice main.ts");
    let cases = doc["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 90, "liczba scenariuszy wiringu");
    for case in cases {
        let input = &case["input"];
        let owners = owners_of(&input["cityOwners"]);
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
        assert_eq!(
            check_victory(&victory_input),
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
fn blok_po_turze_pina_zgodny_z_decyzja_wiringu() {
    // Wyjscia wykonanego bloku pina (try/catch, main.ts:43441-43483): gameOver, wynik, flaga i lista mocy.
    let doc = vectors();
    let cases = doc["cases"].as_array().expect("cases");
    let mut dominacje = 0;
    let mut przegrane = 0;
    for case in cases {
        let input = &case["input"];
        let post = &case["postTurn"];
        let potegi: Vec<f64> = post["potegiWszystkich"]
            .as_array()
            .expect("pin wykonal checkVictory")
            .iter()
            .map(|v| v.as_f64().expect("moc"))
            .collect();
        let decision_input = VictoryTurnInput {
            city_owner_ids: owners_of(&input["cityOwners"])
                .into_iter()
                .map(rust_owner)
                .collect(),
            gracz: rust_owner(0),
            flaga_zapisana: input["zapamietana"].as_bool().expect("zapamietana"),
            potega_gracza: input["potegaGracza"].as_f64().expect("potega"),
            potegi_wszystkich: potegi,
            gracz_era: input["graczEra"].as_i64().expect("era"),
            ostatnia_epoka: input["ostatniaEpoka"].as_i64().expect("epoka"),
        };
        let (flag, result) = victory_turn_decision(&decision_input);
        let expected = expected_rust_result(&post["vResult"]);
        assert_eq!(
            flag,
            post["flagaPinuPo"].as_bool().expect("flagaPinuPo"),
            "flaga po turze: {input}"
        );
        assert_eq!(result, expected, "wynik po turze: {input}");
        assert_eq!(
            result.is_some(),
            post["gameOver"].as_bool().expect("gameOver"),
            "gameOver po bloku pina: {input}"
        );
        match result.map(|r| r.rodzaj) {
            Some(VictoryKind::Dominacja) => dominacje += 1,
            Some(VictoryKind::Przegrana) => przegrane += 1,
            _ => {}
        }
    }
    assert!(dominacje > 0, "wektory musza zawierac dominacje");
    assert!(
        przegrane > 0,
        "wektory musza zawierac przegrana po eliminacji"
    );
}

#[test]
fn nowa_gra_ma_flage_bo_stolica_jest_zalozona_jak_w_pinie() {
    let game = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
    let state = game.state();
    assert_eq!(state.koniec_gry, None);
    assert!(
        state.gracz_kiedys_mial_miasto,
        "stolica startowa = zbior miast gracza po starcie (pin main.ts:45645-45646 preset)"
    );
    let vectors = vectors();
    let preset = vectors["resetCases"]
        .as_array()
        .expect("resetCases")
        .iter()
        .find(|c| c["reset"] == "flagPreset")
        .expect("wektor flagPreset");
    assert_eq!(
        preset["flagaPinuPo"].as_bool(),
        Some(state.gracz_kiedys_mial_miasto)
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
    assert_eq!(result.winner, rust_owner(0), "gracz czlowieka (PlayerId 1)");
}

#[test]
fn bramka_konca_tury_zgodna_z_pinem() {
    // Pin: `if (gameOver) { console.warn('[EndTurn] blocked: gameOver'); return false; }` (main.ts:37997)
    // oraz podpowiedz `Gra zakonczona` (main.ts:38043). Rust: koniec tury odrzucony przed zmiana stanu.
    let vectors = vectors();
    let gates = vectors["gateCases"].as_array().expect("gateCases");
    assert_eq!(gates.len(), 4, "dwie bramki x dwa stany gry");
    for gate in gates {
        let game_over = gate["gameOver"].as_bool().expect("gameOver");
        let pin_rejected = gate
            .get("returned")
            .is_none_or(|v| v.as_str() != Some("PASS"));
        let mut game = if game_over {
            finished_game()
        } else {
            PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra")
        };
        let before: PlayableState = game.state().clone();
        let result = game.advance_turn();
        assert_eq!(
            result.is_err(),
            pin_rejected,
            "bramka {} przy gameOver={game_over}",
            gate["gate"]
        );
        if pin_rejected {
            assert!(matches!(result, Err(PlayableError::GameAlreadyOver(_))));
            assert_eq!(
                game.state(),
                &before,
                "odrzucony koniec tury nie zmienia stanu"
            );
        }
    }
}

#[test]
fn reset_nowej_gry_i_wczytania_zgodny_z_pinem() {
    let vectors = vectors();
    let resets = vectors["resetCases"].as_array().expect("resetCases");
    for reset in resets {
        match reset["reset"].as_str().expect("reset") {
            "resetNewGame" => {
                // Pin main.ts:45160 (gameOver=false). Rust: nowa gra = brak konca gry.
                let fresh = PlayableGame::new(params_with_epoch("zelazo")).expect("nowa gra");
                assert_eq!(
                    fresh.state().koniec_gry.is_none(),
                    reset["gameOver"] == false
                );
            }
            "resetLoadGameOver" => {
                // Pin main.ts:47333 (gameOver=false przy wczytaniu). Rust: koniec_gry #[serde(skip)].
                let game = finished_game();
                let json = serde_json::to_string(game.state()).expect("zapis");
                let loaded: PlayableState = serde_json::from_str(&json).expect("wczytanie");
                assert_eq!(loaded.koniec_gry.is_none(), reset["gameOver"] == false);
            }
            "flagPreset" => {
                // Pin main.ts:45645-45646: clear + add(HUMAN_OWNER_PRIMARY) => flaga = true.
                let fresh = PlayableGame::new(params_with_epoch("kamien")).expect("nowa gra");
                assert_eq!(
                    fresh.state().gracz_kiedys_mial_miasto,
                    reset["flagaPinuPo"].as_bool().expect("flaga")
                );
            }
            "flagLoadRebuild" => {
                // Pin main.ts:46368-46370: flaga po wczytaniu = fotel gracza z miastem. Rust: zapisana flaga
                // jest false po wczytaniu (serde skip), wiec efektywna flaga = posiadanie miasta.
                let owners: Vec<i64> = owners_of(&reset["cityOwners"])
                    .into_iter()
                    .map(rust_owner)
                    .collect();
                let (flag, _) = victory_turn_decision(&VictoryTurnInput {
                    city_owner_ids: owners,
                    gracz: rust_owner(0),
                    flaga_zapisana: false,
                    potega_gracza: 0.0,
                    potegi_wszystkich: vec![0.0],
                    gracz_era: 1,
                    ostatnia_epoka: 3,
                });
                assert_eq!(
                    flag,
                    reset["flagaPinuPo"].as_bool().expect("flaga"),
                    "odtworzenie flagi ze miast: {reset}"
                );
            }
            other => panic!("nieznany wektor resetu: {other}"),
        }
    }
}

#[test]
fn wczytany_zapis_bez_pola_flagi_laduje_sie_z_domyslami() {
    // Pole flagi nie jest w JSON (pin go nie zapisuje), wiec zapis sprzed tematu laduje sie bez zmian.
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

#[test]
fn fragmenty_pinu_maja_zapisane_sha() {
    // SHA-256 fragmentow main.ts wycietych przez generator z tekstu pina 07d2fbd72. Zmiana = inny tekst pina.
    let doc = vectors();
    let fragments = &doc["fragments"];
    let expected = [
        (
            "postTurn",
            "7706b858a36ffe7ae2ed56594e2b937ba7acfd921f0ae753e6634ba3b1063ad0",
        ),
        (
            "gateEndTurn",
            "6e6fddfac3413c201ade287f03f21eccc2666306775b6b87db11a174453600cf",
        ),
        (
            "gateHint",
            "2f6dcf52a50bfeacec584059e4848ac60ab06102ea888fba6235f445622e3de4",
        ),
        (
            "resetNewGame",
            "6736ea832e17a0f6a27f321a03136e3aef5eb27bb59c7b932fd6010485ae6ea2",
        ),
        (
            "resetLoadGameOver",
            "8e97988b94b41444cd71579badca0bea3ee90c091053dd2101731bc97a7d0e36",
        ),
        (
            "flagPreset",
            "7905ab5aab1fae1632424158a8b166922613c4e11043b376eb6f66059b96266a",
        ),
        (
            "flagLoadRebuild",
            "07fd63e0e925e47e6b59cdf139c37e65221d7144b16559db588b2c7fbdfde96c",
        ),
    ];
    for (label, sha) in expected {
        assert_eq!(
            fragments[label]["sha256"].as_str(),
            Some(sha),
            "SHA fragmentu {label}"
        );
    }
}

#[test]
fn zapis_po_zakonczonej_grze_nie_zawiera_konca_gry() {
    let game = finished_game();
    let json = serde_json::to_string(game.state()).expect("zapis");
    assert!(
        !json.contains("koniecGry"),
        "koniec gry nie trafia do zapisu"
    );
}
