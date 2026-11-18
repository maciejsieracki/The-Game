//! R-RUSTPORT-P4-364-FOG-SAVE-R1 (DLUG-364-FOG-SAVE): zapis i odczyt odkrytej mgly sesji
//! (`PlayableFogSession::explored_by_human`) w addytywnym kluczu zapisu `exploredByHuman`.
//!
//! Web (pin `07d2fbd72`): zapis `main.ts:37229-37239`, odczyt `:46385-46411`, typ
//! `game/save.ts:359-363`, normalizacja `:725` (brak/nie-tablica => `[]`), `addExplored` `:13480-13483`.
//! Decyzje orkiestratora D-FS-1..D-FS-4 (dispatch tematu). Wczytanie idzie produkcyjnym loaderem
//! `zapis_loader::load_save_snapshot`.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::dto_bridge::{session_render_layers, RenderLayersPayload};
use civ_engine::domain::save_load::{
    EventQueue, SaveSnapshot, SavedExploredSeat, TurnEvent, TurnPhase,
};
use civ_engine::domain::zapis_loader::load_save_snapshot;
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayableGame, PlayerId, PositionDto,
    Rng, StartGameParams, TerrainDto, TileDto, TurnDto, UnitDto, UnitId, UnitKindDto,
};
use civ_view_model::FogState;
use serde_json::{json, Value};

const HUMAN: u64 = 1;
const SEAT2: u64 = 2;

fn valid_state() -> GameStateDto {
    let map = MapDto::new(
        2,
        1,
        vec![
            TileDto::new(PositionDto::new(0, 0), TerrainDto::Plains),
            TileDto::new(PositionDto::new(1, 0), TerrainDto::Hills),
        ],
    )
    .expect("map is valid");
    let civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(8)],
    )
    .expect("civilization is valid");
    let city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city is valid");
    let unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit is valid");
    GameStateDto::new(
        map,
        vec![civilization],
        vec![city],
        vec![unit],
        TurnDto::new(3).expect("turn three is valid"),
    )
    .expect("state is valid")
}

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

fn layers(game: &mut PlayableGame, seat: Option<u64>) -> RenderLayersPayload {
    session_render_layers(game, seat).expect("warstwy renderera")
}

/// Gra po starcie, z odkryciem po pierwszym zapytaniu warstw i po ruchu jednostki (jak web: kazdy
/// `refreshFog` dopisuje widoczne heksy do eksploracji fotela).
fn explored_game() -> PlayableGame {
    let mut game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
    layers(&mut game, None);
    game.select_unit(1).expect("wybor jednostki");
    game.move_unit_with_attack(1, PositionDto::new(3, 1), None)
        .expect("ruch");
    layers(&mut game, None);
    game
}

/// Klucze heksow mapy, ktorych fotel `seat` NIE odkryl (do wstrzykniecia eksploracji z wczesniejszych
/// tur - np. jednostki, ktorej juz nie ma - i do sprawdzenia, ze restore ma znaczenie).
fn unexplored_keys(game: &PlayableGame, seat: u64, take: usize) -> Vec<(i32, i32)> {
    let explored = game
        .fog_session()
        .explored_by_human
        .get(&PlayerId::new(seat))
        .cloned()
        .unwrap_or_default();
    let mut keys: Vec<(i32, i32)> = game
        .state()
        .map
        .tiles
        .iter()
        .map(|t| (i32::from(t.position.x()), i32::from(t.position.y())))
        .filter(|k| !explored.contains(k))
        .collect();
    keys.sort_unstable();
    keys.dedup();
    keys.into_iter().rev().take(take).collect()
}

fn save_text(game: &PlayableGame) -> String {
    serde_json::to_string(&snapshot().with_playable_explored_by_human(game.fog_session()))
        .expect("zapis")
}

/// Wczytanie produkcyjnym loaderem + odtworzenie mgly do nowej sesji z tego samego stanu gry.
fn load_into_new_game(text: &str, game: &PlayableGame) -> PlayableGame {
    let (loaded, _report) = load_save_snapshot(text).expect("loader");
    let mut fresh = PlayableGame::from_state(game.state().clone());
    let (_, fog) = fresh.fog_session_parts();
    loaded.restore_explored_by_human(fog);
    fresh
}

#[test]
fn a_runda_zapis_odczyt_zachowuje_mgle_z_get_render_layers() {
    let mut game = explored_game();
    // Eksploracja z wczesniejszych tur: heksy, ktorych biezaca widocznosc nie pokrywa.
    let extra = unexplored_keys(&game, HUMAN, 3);
    assert_eq!(extra.len(), 3, "mapa ma heksy poza zasiegiem wzroku");
    {
        let (_, fog) = game.fog_session_parts();
        fog.explored_by_human
            .get_mut(&PlayerId::new(HUMAN))
            .expect("wpis fotela glownego")
            .extend(extra.iter().copied());
    }
    let before = layers(&mut game, None);
    assert!(
        before.fog.state.contains(&FogState::Explored),
        "przed zapisem sa heksy odkryte, ale niewidoczne"
    );
    let explored_before = game.fog_session().explored_by_human.clone();

    let text = save_text(&game);
    let value: Value = serde_json::from_str(&text).expect("json");
    let saved = value
        .get("exploredByHuman")
        .expect("klucz exploredByHuman w zapisie");
    assert_eq!(saved[0][0], json!(HUMAN));
    let (q, r) = extra[0];
    assert!(
        saved[0][1]
            .as_array()
            .expect("klucze")
            .contains(&json!(format!("{q},{r}"))),
        "klucze w formacie web \"q,r\""
    );

    let mut loaded = load_into_new_game(&text, &game);
    assert_eq!(
        loaded.fog_session().explored_by_human,
        explored_before,
        "eksploracja po wczytaniu = przed zapisem"
    );
    let after = layers(&mut loaded, None);
    assert_eq!(
        after, before,
        "mgla GetRenderLayers identyczna po wczytaniu"
    );

    // Czulosc: bez restore mgla jest inna (restore ma znaczenie).
    let mut no_restore = PlayableGame::from_state(game.state().clone());
    assert_ne!(
        layers(&mut no_restore, None).fog,
        before.fog,
        "bez odtworzenia eksploracji mgla jest inna"
    );
}

#[test]
fn b_zapis_sprzed_zmiany_wczytuje_sie_z_pusta_mgla() {
    let game = explored_game();
    let old = serde_json::to_string(&snapshot()).expect("stary zapis");
    assert!(!old.contains("exploredByHuman"));
    let (loaded, _) = load_save_snapshot(&old).expect("stary zapis sie wczytuje");
    assert!(loaded.explored_by_human().is_empty());

    let mut restored = PlayableGame::from_state(game.state().clone());
    {
        let (_, fog) = restored.fog_session_parts();
        // Smieci przed wczytaniem (np. poprzednia sesja) - wczytanie je czysci jak web `clear()`.
        fog.explored_by_human
            .insert(PlayerId::new(SEAT2), BTreeSet::from([(0, 0)]));
        fog.explored_by_human
            .get_mut(&PlayerId::new(HUMAN))
            .expect("fotel glowny")
            .insert((0, 0));
        fog.reveal_all_land = true;
        loaded.restore_explored_by_human(fog);
    }
    let fog = restored.fog_session();
    assert_eq!(
        fog.explored_by_human,
        BTreeMap::from([(PlayerId::new(HUMAN), BTreeSet::new())]),
        "pusta mgla: tylko pusty wpis fotela glownego (web main.ts:46407-46410)"
    );
    assert!(
        !fog.reveal_all_land,
        "web: revealAllLand = false po wczytaniu"
    );

    let mut fresh = PlayableGame::from_state(game.state().clone());
    assert_eq!(layers(&mut restored, None), layers(&mut fresh, None));

    // Web normalize: `exploredByHuman` nie-tablica => [] (bez bledu).
    let mut value: Value = serde_json::from_str(&old).expect("json");
    value["exploredByHuman"] = json!({"0": ["1,1"]});
    let (loaded, _) = load_save_snapshot(&value.to_string()).expect("nie-tablica = []");
    assert!(loaded.explored_by_human().is_empty());
}

#[test]
fn c_zapis_bez_eksploracji_bajt_w_bajt_jak_dotad() {
    let game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
    // Nowa gra: pusty wpis fotela glownego (web `[[0, []]]`); pusty zbior nie zostawia klucza.
    assert_eq!(
        game.fog_session().explored_by_human[&PlayerId::new(HUMAN)].len(),
        0
    );
    let plain = serde_json::to_string(&snapshot()).expect("plain");
    let with_fog = save_text(&game);
    assert_eq!(with_fog, plain, "zapis bez eksploracji bajt w bajt");
    let pretty_plain = serde_json::to_string_pretty(&snapshot()).expect("pretty");
    let pretty_fog = serde_json::to_string_pretty(
        &snapshot().with_playable_explored_by_human(game.fog_session()),
    )
    .expect("pretty fog");
    assert_eq!(pretty_fog, pretty_plain);
    // Ponowny zapis wczytanego starego zapisu tez jest bajt w bajt.
    let (loaded, _) = load_save_snapshot(&plain).expect("loader");
    assert_eq!(serde_json::to_string(&loaded).expect("again"), plain);
}

fn with_explored(value: Value) -> String {
    let mut save: Value = serde_json::to_value(snapshot()).expect("json");
    save["exploredByHuman"] = value;
    save.to_string()
}

fn load_error(value: Value) -> String {
    match load_save_snapshot(&with_explored(value)) {
        Ok(_) => panic!("zly exploredByHuman musi byc bledem wczytania"),
        Err(error) => error.to_string(),
    }
}

#[test]
fn d_niepoprawny_klucz_jawny_blad_z_pozycja() {
    let message = load_error(json!([[1, ["0,0"]], [2, ["1,1", "x"]]]));
    assert!(
        message.contains("exploredByHuman[1][1][1]") && message.contains("\"x\""),
        "{message}"
    );
    for bad in [
        "1",
        "1,",
        ",1",
        "1,2,3",
        " 1,2",
        "1, 2",
        "+1,2",
        "01,2",
        "1.5,2",
        "99999999999,0",
    ] {
        let message = load_error(json!([[1, ["0,0", bad]]]));
        assert!(
            message.contains("exploredByHuman[0][1][1]"),
            "{bad}: {message}"
        );
    }
    let message = load_error(json!([[1, ["0,0", 7]]]));
    assert!(message.contains("exploredByHuman[0][1][1]"), "{message}");
    for bad_entry in [
        json!([[1, ["0,0"]], "x"]),
        json!([[1, ["0,0"]], [-1, []]]),
        json!([[1, ["0,0"]], [1.5, []]]),
        json!([[1, ["0,0"]], [1]]),
        json!([[1, ["0,0"]], [1, [], 3]]),
        json!([[1, ["0,0"]], [1, "0,0"]]),
    ] {
        let message = load_error(bad_entry.clone());
        assert!(
            message.contains("exploredByHuman[1]"),
            "{bad_entry}: {message}"
        );
    }
    // Poprawne klucze (w tym ujemne) sie wczytuja.
    let (loaded, _) =
        load_save_snapshot(&with_explored(json!([[1, ["-3,4", "0,-2"]]]))).expect("poprawne");
    assert_eq!(
        loaded.explored_by_human(),
        &[SavedExploredSeat {
            owner_id: 1,
            keys: vec![(-3, 4), (0, -2)],
        }]
    );
    // Obrona U4: `ownerId` jako liczba JS calkowita z czescia `.0` (np. `2.0`) jest przyjmowany jak
    // `placedWorldWonders.ownerId` (`js_owner_id`).
    let (loaded, _) =
        load_save_snapshot(&with_explored(json!([[2.0, ["1,1"]]]))).expect("ownerId 2.0");
    assert_eq!(
        loaded.explored_by_human(),
        &[SavedExploredSeat {
            owner_id: 2,
            keys: vec![(1, 1)],
        }]
    );
}

#[test]
fn e_dwa_fotele_odtwarzane_osobno() {
    let mut game = explored_game();
    game.add_player(SEAT2, "Drugi".to_owned()).expect("fotel 2");
    let seat2_keys: Vec<(i32, i32)> = unexplored_keys(&game, HUMAN, 4);
    assert_eq!(seat2_keys.len(), 4);
    {
        let (_, fog) = game.fog_session_parts();
        fog.explored_by_human
            .insert(PlayerId::new(SEAT2), seat2_keys.iter().copied().collect());
    }
    let main_before = layers(&mut game, None);
    let seat2_before = layers(&mut game, Some(SEAT2));
    assert_ne!(main_before.fog, seat2_before.fog, "mgla zalezy od fotela");
    let explored_before = game.fog_session().explored_by_human.clone();

    let text = save_text(&game);
    let value: Value = serde_json::from_str(&text).expect("json");
    let owners: Vec<Value> = value["exploredByHuman"]
        .as_array()
        .expect("tablica")
        .iter()
        .map(|e| e[0].clone())
        .collect();
    assert_eq!(owners, vec![json!(HUMAN), json!(SEAT2)]);

    // Stan gry (z fotelem 2 w `players`) wczytany bez zmian; mgla tylko z `exploredByHuman`.
    let mut loaded = load_into_new_game(&text, &game);
    assert_eq!(loaded.fog_session().explored_by_human, explored_before);
    assert_eq!(
        loaded.fog_session().explored_by_human[&PlayerId::new(SEAT2)],
        seat2_keys.iter().copied().collect::<BTreeSet<_>>(),
        "fotel 2 odtworzony ze swoich kluczy"
    );
    assert_eq!(layers(&mut loaded, None), main_before);
    assert_eq!(layers(&mut loaded, Some(SEAT2)), seat2_before);

    // Powtorzony fotel w zapisie: wygrywa ostatni wpis (web `Map.set`).
    let (dup, _) =
        load_save_snapshot(&with_explored(json!([[2, ["0,0"]], [2, ["1,1"]]]))).expect("dup");
    let mut fresh = PlayableGame::from_state(game.state().clone());
    let (_, fog) = fresh.fog_session_parts();
    dup.restore_explored_by_human(fog);
    assert_eq!(
        fog.explored_by_human,
        BTreeMap::from([
            (PlayerId::new(HUMAN), BTreeSet::new()),
            (PlayerId::new(SEAT2), BTreeSet::from([(1, 1)])),
        ])
    );
}

#[test]
fn f_engine_state_i_snapshot_bez_zmian() {
    let game = explored_game();
    let text = save_text(&game);
    let (loaded, _) = load_save_snapshot(&text).expect("loader");
    let reference = snapshot();
    assert_eq!(loaded.state(), reference.state(), "GameStateDto bez zmian");
    assert_eq!(loaded.event_queue(), reference.event_queue());
    assert_eq!(
        serde_json::to_value(loaded.state()).expect("state"),
        serde_json::to_value(reference.state()).expect("state")
    );

    let mut restored = PlayableGame::from_state(game.state().clone());
    let state_before = restored.state().clone();
    let (_, fog) = restored.fog_session_parts();
    loaded.restore_explored_by_human(fog);
    assert_eq!(restored.state(), &state_before, "PlayableState bez zmian");
    let state_json = serde_json::to_string(restored.state()).expect("state json");
    assert!(
        !state_json.contains("exploredByHuman") && !state_json.contains("explored_by_human"),
        "eksploracja nie wchodzi do stanu gry (EngineState)"
    );
    // Ponowny zapis wczytanego zapisu jest stabilny bajt w bajt.
    assert_eq!(serde_json::to_string(&loaded).expect("again"), text);
}
