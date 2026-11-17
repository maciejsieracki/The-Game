//! R-RUSTPORT-P4-364-AWAITING-SEAT-R1 (#364, dlug DTO-BRIDGE, zarzut 5): stan „czeka na pierwsze
//! miasto” per fotel.
//!
//! Pin `07d2fbd72`:
//! - `gra/src/main.ts:3042` `let playerEverOwnedCityByOwner: Set<number> = new Set<number>();`
//! - `gra/src/main.ts:12882-12884` `isAwaitingFirstPlayerCity(ownerId = ME())` =
//!   `computeAwaitingFirstPlayerCity(playerEverOwnedCityByOwner.has(ownerId), cities, ownerId)`;
//! - zapis do zbioru: `:16508` (zalozenie, `ME()`), `:17816` (kapitulacja, `newOwner`), `:36218`
//!   (zdobycie, `atkOwner`), `:45645-45646` (nowa gra: `clear()` + `HUMAN_OWNER_PRIMARY`),
//!   `:46368-46370` (wczytanie: fotele ludzkie z miastem);
//! - `:13074-13080` `startRevealKeysForRiverFog()`: `!isAwaitingFirstPlayerCity() || meStartHex === null`
//!   -> `undefined`.
//!
//! Wektory: te same przypadki URUCHOMIONEGO pinu co `p4_364_dto_bridge_vectors/vectors.json`
//! (generator `p4_364_dto_bridge_gen.mjs`, pole `expected.awaiting`) - fotele 0 i 1, z miastem i bez,
//! z wpisem w zbiorze i bez. Tu zbior pochodzi ze STANU (`PlayableState`), nie z argumentu.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::dto_bridge::{build_fog_layers, is_awaiting_first_city};
use civ_engine::domain::overlays_view::reachable_overlay;
use civ_engine::domain::playable::{MovementPoints, PlayablePlayer};
use civ_engine::domain::playable_movement::klucz_of;
use civ_engine::domain::terrain::visibility::fog_view::{ExploredByHuman, FogViewInputs};
use civ_engine::{
    CityId, PlayableCity, PlayableGame, PlayableMap, PlayableState, PlayableTerrain, PlayableTile,
    PlayableUnit, PlayableUnitKind, PlayerId, PositionDto, StartGameParams, UnitId,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p4_364_dto_bridge_vectors/vectors.json");
const OLD_STATE_PRE_POP: &str = include_str!("p6_wire_war_pop_vectors/old_state_pre_pop.json");

/// Fotel glowny Rust (`HUMAN_PLAYER_ID`, web `HUMAN_OWNER_PRIMARY`).
const PRIMARY: u64 = 1;
/// Drugi fotel ludzki.
const SEAT2: u64 = 2;
const MOVER: u64 = 900;

fn n(v: &Value) -> u64 {
    v.as_u64().unwrap_or_else(|| panic!("liczba: {v}"))
}

fn base_state() -> PlayableState {
    PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone()
}

fn city(id: u64, owner: u64, x: u16) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("miasto-{id}"),
        position: PositionDto::new(x, 0),
        is_capital: false,
        population: 1,
        culture: 0,
    }
}

fn player(id: u64, human: bool) -> PlayablePlayer {
    PlayablePlayer {
        id: PlayerId::new(id),
        name: format!("gracz-{id}"),
        civilization: "rzym".to_owned(),
        is_human: human,
    }
}

/// Stan "nikt nigdy nie mial miasta" (pin: pusty `playerEverOwnedCityByOwner`).
fn clear_ever_owned(state: &mut PlayableState) {
    state.gracz_kiedys_mial_miasto = false;
    state.player_ever_owned_city.clear();
}

fn cases() -> Vec<Value> {
    let doc: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    assert_eq!(doc["pin"], "07d2fbd72");
    doc["cases"].as_array().expect("cases").clone()
}

/// Wektory pinu `isAwaitingFirstPlayerCity(ME())` dla foteli 0 i 1: zbior `everOwned` zapisany w
/// STANIE (`record_ever_owned_city`), odczyt per fotel z `PlayableState::is_awaiting_first_city`
/// (ta sama funkcja, ktora czyta `overlays_view`).
#[test]
fn awaiting_per_seat_matches_pinned_web_vectors() {
    let all = cases();
    assert_eq!(all.len(), 12);
    let mut seen: BTreeSet<(u64, bool, bool, bool)> = BTreeSet::new();
    for case in &all {
        let name = case["name"].as_str().expect("name");
        let sc = &case["scenario"];
        let me = PlayerId::new(n(&sc["me"]));
        let mut state = base_state();
        state.players = sc["players"]
            .as_array()
            .expect("players")
            .iter()
            .map(|p| player(n(&p["id"]), p["human"].as_bool().expect("human")))
            .collect();
        state.cities = sc["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|c| city(n(&c["id"]), n(&c["owner"]), 0))
            .collect();
        clear_ever_owned(&mut state);
        let ever: BTreeSet<PlayerId> = sc["everOwned"]
            .as_array()
            .expect("everOwned")
            .iter()
            .map(|o| PlayerId::new(n(o)))
            .collect();
        for &owner in &ever {
            state.record_ever_owned_city(owner);
        }
        assert_eq!(
            state.player_ever_owned_city_by_owner(),
            ever,
            "{name}: zbior w stanie"
        );
        let want = case["expected"]["awaiting"].as_bool().expect("awaiting");
        assert_eq!(state.is_awaiting_first_city(me), want, "{name}: stan");
        assert_eq!(
            is_awaiting_first_city(&state, me, &state.player_ever_owned_city_by_owner()),
            want,
            "{name}: dto_bridge na zbiorze ze stanu"
        );
        let has_city = state.cities.iter().any(|c| c.owner_id == me);
        seen.insert((me.get(), ever.contains(&me), has_city, want));
    }
    // Pokrycie: oba fotele czekaja (bez wpisu, bez miasta) i oba nie czekaja; fotel 0 z wpisem bez miasta.
    assert!(seen.contains(&(0, false, false, true)), "{seen:?}");
    assert!(seen.contains(&(1, false, false, true)), "{seen:?}");
    assert!(seen.contains(&(0, true, false, false)), "{seen:?}");
    assert!(seen.contains(&(0, true, true, false)), "{seen:?}");
    assert!(seen.contains(&(1, true, true, false)), "{seen:?}");
}

/// Korytarz rownin `x = 0..6`; jednostka fotela `seat` zaznaczona; aktywny fotel `ME()` = `seat`
/// (pierwszy `is_human` w `players`, `overlays_view::human_seats`); drugi fotel ludzki obok.
fn corridor_for(seat: u64, other: u64) -> PlayableState {
    let mut state = base_state();
    state.map = PlayableMap {
        width: 6,
        height: 1,
        tiles: (0..6)
            .map(|x| PlayableTile {
                position: PositionDto::new(x, 0),
                terrain: PlayableTerrain::Plains,
                passable: true,
            })
            .collect(),
        improvements: Vec::new(),
    };
    state.players = vec![player(seat, true), player(other, true)];
    state.cities.clear();
    state.units = vec![PlayableUnit {
        id: UnitId::new(MOVER),
        owner_id: PlayerId::new(seat),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(0, 0),
        movement: MovementPoints::from(3u8),
        movement_max: MovementPoints::from(3u8),
        selected: false,
    }];
    state.planned_marches.clear();
    state.economy = Default::default();
    state.selected_unit_id = Some(MOVER);
    clear_ever_owned(&mut state);
    state
}

/// `overlays.reachable` (web `syncPlayerUnitSelectionOnMap`, `main.ts:7123-7125`: `!isAwaitingFirstPlayerCity()`)
/// dla AKTYWNEGO fotela 1 i 2: kazdy fotel czyta WLASNY wpis, nie wpis fotela glownego.
#[test]
fn reachable_reads_awaiting_of_active_seat() {
    for (seat, other) in [(PRIMARY, SEAT2), (SEAT2, PRIMARY)] {
        // Nikt nie mial miasta: fotel czeka -> brak zasiegu.
        let empty = corridor_for(seat, other);
        assert!(empty.is_awaiting_first_city(PlayerId::new(seat)));
        assert!(reachable_overlay(&empty).is_empty(), "fotel {seat}");

        // Wpis INNEGO fotela nie zdejmuje oczekiwania aktywnego.
        let mut other_only = corridor_for(seat, other);
        other_only.record_ever_owned_city(PlayerId::new(other));
        assert!(other_only.is_awaiting_first_city(PlayerId::new(seat)));
        assert!(reachable_overlay(&other_only).is_empty(), "fotel {seat}");

        // Wlasny wpis (miasto utracone): nie czeka.
        let mut own = corridor_for(seat, other);
        own.record_ever_owned_city(PlayerId::new(seat));
        assert!(own.ever_owned_city(PlayerId::new(seat)));
        assert!(!own.ever_owned_city(PlayerId::new(other)));
        assert!(!own.is_awaiting_first_city(PlayerId::new(seat)));
        assert!(!reachable_overlay(&own).is_empty(), "fotel {seat}");

        // Wlasne miasto bez wpisu: nie czeka (`first-player-city.ts:16`).
        let mut with_city = corridor_for(seat, other);
        with_city.cities.push(city(79, seat, 5));
        assert!(!with_city.is_awaiting_first_city(PlayerId::new(seat)));
        assert!(!reachable_overlay(&with_city).is_empty(), "fotel {seat}");
    }
}

/// Nowa gra (pin `main.ts:45645-45646`): tylko fotel glowny w zbiorze.
#[test]
fn new_game_records_only_primary_seat() {
    let state = base_state();
    assert!(state.gracz_kiedys_mial_miasto);
    assert!(state.player_ever_owned_city.is_empty());
    assert_eq!(
        state.player_ever_owned_city_by_owner(),
        BTreeSet::from([PlayerId::new(PRIMARY)])
    );
}

/// Pierwsze miasto drugiego fotela zapisuje jego wpis (punkt synchronizacji: faza Victory, ten sam co flaga
/// fotela glownego); utrata miasta potem NIE przywraca oczekiwania (web `Set.add` jest trwaly).
#[test]
fn first_city_of_second_seat_is_recorded_on_turn() {
    let mut state = game_with_seat2().state().clone();
    state.cities.push(city(77, SEAT2, 4));
    state
        .economy
        .city_stock
        .insert(77, [("drewno".to_owned(), 100.0)].into_iter().collect());
    assert!(!state.ever_owned_city(PlayerId::new(SEAT2)));
    let mut game = PlayableGame::from_state(state);
    game.advance_turn().expect("koniec tury");
    let mut after = game.state().clone();
    assert!(
        after.player_ever_owned_city.contains(&PlayerId::new(SEAT2)),
        "{:?}",
        after.player_ever_owned_city
    );
    after.cities.retain(|c| c.owner_id != PlayerId::new(SEAT2));
    assert!(!after.is_awaiting_first_city(PlayerId::new(SEAT2)));

    // Kontrola: bez miasta przez cala ture fotel 2 nadal czeka.
    let mut game = game_with_seat2();
    game.advance_turn().expect("koniec tury");
    assert!(game.state().is_awaiting_first_city(PlayerId::new(SEAT2)));
}

/// Nowa gra z drugim wlascicielem (`add_player`). Pin zapisuje wpis dla KAZDEGO wlasciciela, ktory
/// zdobywa miasto (`:17816` `newOwner`, `:36218` `atkOwner` - takze AI), wiec punkt synchronizacji nie
/// filtruje foteli ludzkich; `is_human` drugiego wlasciciela nie wplywa na zapis (faza wojny `advance_turn`
/// wymaga wejsc mocy tylko dla wlascicieli AI, dlatego wlasciciel 2 zostaje AI).
fn game_with_seat2() -> PlayableGame {
    let mut game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
    game.add_player(SEAT2, "wlasciciel-2".to_owned())
        .expect("wlasciciel 2");
    game
}

/// Zapis i stan JSON bez zmian (pin nie zapisuje zbioru); stary zapis bez pola laduje sie z pustym zbiorem.
#[test]
fn old_save_without_field_loads_and_json_has_no_new_key() {
    let mut state = base_state();
    state.record_ever_owned_city(PlayerId::new(SEAT2));
    let json = serde_json::to_value(&state).expect("serialize");
    assert!(
        json.get("playerEverOwnedCity").is_none(),
        "nowy klucz w JSON"
    );
    let back: PlayableState = serde_json::from_value(json).expect("wczytanie bez pola");
    assert!(back.player_ever_owned_city.is_empty());

    let legacy: PlayableState = serde_json::from_str(OLD_STATE_PRE_POP).expect("stary zapis");
    assert!(legacy.player_ever_owned_city.is_empty());

    // Jawny klucz (np. przyszly zapis) tez jest przyjmowany (`default`).
    let mut with_key = serde_json::to_value(base_state()).expect("serialize");
    with_key["playerEverOwnedCity"] = serde_json::json!([2]);
    let loaded: PlayableState = serde_json::from_value(with_key).expect("z kluczem");
    assert!(loaded.ever_owned_city(PlayerId::new(SEAT2)));
}

/// `startRevealKeysForRiverFog` (`main.ts:13074-13080`) ze zbiorem ze STANU, fotel 2 aktywny: mgla ON i
/// fotel czeka -> klucze; mgla OFF (`setFog(ALL_KEYS, ALL_KEYS)` bez opcji, `:13505-13506`) -> brak kluczy,
/// choc fotel czeka; wpis fotela 2 -> brak kluczy.
#[test]
fn fog_off_no_reveal_awaiting() {
    let mut state = base_state();
    state.players = vec![player(SEAT2, true), player(PRIMARY, true)];
    state.cities.retain(|c| c.owner_id != PlayerId::new(SEAT2));
    clear_ever_owned(&mut state);
    state.record_ever_owned_city(PlayerId::new(PRIMARY));
    let start: BTreeMap<PlayerId, (i32, i32)> =
        BTreeMap::from([(PlayerId::new(SEAT2), klucz_of(state.map.tiles[0].position))]);
    let layers = |state: &PlayableState, fog_on: bool| {
        let inputs = FogViewInputs {
            active_seat: PlayerId::new(SEAT2),
            fog_on,
            reveal_all_land: false,
            player_start_hex_by_owner: &start,
            start_reveal_radius: 2.0,
        };
        let mut explored: ExploredByHuman = BTreeMap::from([
            (PlayerId::new(SEAT2), BTreeSet::new()),
            (PlayerId::new(PRIMARY), BTreeSet::new()),
        ]);
        build_fog_layers(
            state,
            &inputs,
            &state.player_ever_owned_city_by_owner(),
            &mut explored,
        )
        .expect("mgla")
    };
    assert!(state.is_awaiting_first_city(PlayerId::new(SEAT2)));
    let on = layers(&state, true);
    assert!(on.fog_active);
    assert!(on
        .reveal
        .river_reveal_keys
        .as_ref()
        .is_some_and(|k| !k.is_empty()));
    let off = layers(&state, false);
    assert!(!off.fog_active);
    assert_eq!(off.reveal.river_reveal_keys, None);
    assert!(!off.reveal.reveal_all_land);

    let mut owned = state.clone();
    owned.record_ever_owned_city(PlayerId::new(SEAT2));
    assert_eq!(layers(&owned, true).reveal.river_reveal_keys, None);
}
