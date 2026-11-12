//! P6-WIRE-WAR-POP (W8 r6 klocek 2): populacja i kultura miast w `PlayableCity`, producenci ludki / rekruci /
//! kultura / terytorium z tego stanu, wspolna granica `ownersShareLandBorderLive` (wektory z pinu 07d2fbd72).

use civ_engine::domain::brake_power::Component;
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayableMap, PlayableState, PlayableTerrain, PlayableTile,
    StartGameParams, FOUNDING_CITY_POPULATION,
};
use civ_engine::domain::turn_war_inputs::{
    build_war_inputs, power_raw_for_owner, production_config, shared_border_pairs,
    UNPRODUCED_POWER_COMPONENTS,
};
use civ_engine::domain::turn_war_pipeline::{run_war_turn, WarTurnContext, WarTurnError};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::{CityId, PlayerId, PositionDto};
use serde_json::Value;

fn plains_map(w: u16, h: u16) -> PlayableMap {
    let mut tiles = Vec::new();
    for y in 0..h {
        for x in 0..w {
            tiles.push(PlayableTile {
                position: PositionDto::new(x, y),
                terrain: PlayableTerrain::Plains,
                passable: true,
            });
        }
    }
    PlayableMap {
        width: w,
        height: h,
        tiles,
    }
}

fn city(id: u64, owner: u64, x: u16, y: u16, pop: u32, culture: u32) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("c{id}"),
        position: PositionDto::new(x, y),
        is_capital: false,
        population: pop,
        culture,
    }
}

/// Gracz 1 (czlowiek) + AI 2 na mapie 40x40 z rowniny; miasta podane przez wolajacego.
fn state_with(cities: Vec<PlayableCity>) -> PlayableState {
    let mut game = PlayableGame::new(StartGameParams {
        seed: 11,
        ..StartGameParams::default()
    })
    .expect("scenario");
    game.add_player(2, "AI".to_owned()).expect("ai");
    let mut state = game.state().clone();
    state.map = plains_map(40, 40);
    state.cities = cities;
    state
}

// --- (1) zgodnosc wsteczna zapisu -----------------------------------------------------------------------

#[test]
fn state_saved_before_population_fields_loads_with_defaults() {
    // Fixture = stan PlayableState z miastami BEZ pol `population`/`culture` (format sprzed W8 r6 klocek 2).
    let raw = include_str!("p6_wire_war_pop_vectors/old_state_pre_pop.json");
    assert!(
        !raw.contains("population") && !raw.contains("culture"),
        "fixture ma byc w formacie sprzed zmiany"
    );
    let state: PlayableState =
        serde_json::from_str(raw).expect("stary zapis ladowany przez serde(default)");
    assert_eq!(state.cities.len(), 2);
    for c in &state.cities {
        assert_eq!(
            c.population, FOUNDING_CITY_POPULATION,
            "domyslna populacja = zalozone miasto"
        );
        assert_eq!(c.culture, 0, "domyslna kultura");
    }
    // Zapis -> odczyt nowego formatu jest bezstratny.
    let again: PlayableState =
        serde_json::from_str(&serde_json::to_string(&state).expect("ser")).expect("de");
    assert_eq!(again, state);
    let json: Value = serde_json::to_value(&state).expect("value");
    assert_eq!(json["cities"][0]["population"], 1);
    assert_eq!(json["cities"][0]["culture"], 0);
}

#[test]
fn new_game_capital_starts_with_founding_population() {
    let game = PlayableGame::new(StartGameParams::default()).expect("scenario");
    let city = &game.state().cities[0];
    assert_eq!(city.population, FOUNDING_CITY_POPULATION);
    assert_eq!(city.culture, 0);
}

// --- (2) producenci z populacji / kultury -----------------------------------------------------------------

#[test]
fn producers_read_population_and_culture_from_city_state() {
    // Gracz 2: miasta o populacji 3 i 5 (ludki = suma clampLudki = 8), kultura 7 + 4 = 11.
    let state = state_with(vec![
        city(1, 1, 5, 5, 1, 0),
        city(2, 2, 20, 20, 3, 7),
        city(3, 2, 30, 30, 5, 4),
    ]);
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert_eq!(raw.suma_ludkow, Component::Provided(8.0));
    assert_eq!(raw.kultura_imperium, Component::Provided(11.0));
    assert_eq!(raw.miasta, Component::Provided(2.0));
    assert!(matches!(raw.rekrut_ekw, Component::Provided(v) if v >= 0.0));
    // Wlasciciel 1 widzi tylko swoje miasto.
    let raw1 = power_raw_for_owner(&state, 1, 1.0).expect("raw1");
    assert_eq!(raw1.suma_ludkow, Component::Provided(1.0));
    assert_eq!(raw1.kultura_imperium, Component::Provided(0.0));
    // Rekruci rosna z populacja (web manpower z ludkow): 8 ludkow >= 1 ludek.
    let (Component::Provided(r2), Component::Provided(r1)) = (raw.rekrut_ekw, raw1.rekrut_ekw)
    else {
        panic!("rekruci Provided");
    };
    assert!(r2 >= r1);
}

#[test]
fn territory_counts_hexes_in_union_of_city_discs_clipped_to_the_map() {
    // Miasto pop 1 => promien 5 (cityRangeForPopulation: baza 5): pelny dysk hex = 3*5*6+1 = 91 heksow.
    let state = state_with(vec![city(1, 2, 20, 20, 1, 0)]);
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert_eq!(raw.heksy_terytorium, Component::Provided(91.0));
    // Wieksza populacja => wiekszy promien (pop 8 => promien 8: 3*8*9+1 = 217).
    let state = state_with(vec![city(1, 2, 20, 20, 8, 0)]);
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert_eq!(raw.heksy_terytorium, Component::Provided(217.0));
    // Dwa miasta tego samego wlasciciela w tym samym heksie: unia, nie suma.
    let state = state_with(vec![city(1, 2, 20, 20, 1, 0), city(2, 2, 20, 20, 1, 0)]);
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert_eq!(raw.heksy_terytorium, Component::Provided(91.0));
    // Miasto w rogu mapy: dysk przyciety do istniejacych heksow (mniej niz 91).
    let state = state_with(vec![city(1, 2, 0, 0, 1, 0)]);
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert!(matches!(raw.heksy_terytorium, Component::Provided(v) if v > 0.0 && v < 91.0));
    // Wlasciciel bez miast: 0 heksow z producenta (web: brak wezlow = 0), nie Missing.
    let raw3 = power_raw_for_owner(&state, 3, 1.0).expect("raw3");
    assert_eq!(raw3.heksy_terytorium, Component::Provided(0.0));
}

#[test]
fn components_without_state_data_stay_missing_not_zero() {
    let state = state_with(vec![city(1, 1, 5, 5, 1, 0), city(2, 2, 20, 20, 1, 0)]);
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert_eq!(raw.budynki, Component::Missing);
    assert_eq!(raw.tech_zbadane, Component::Missing);
    assert_eq!(raw.miasta_jednosc_religii, Component::Missing);
    let mut missing = vec!["infra", "tech", "religia"];
    missing.sort_unstable();
    let mut want = UNPRODUCED_POWER_COMPONENTS.to_vec();
    want.sort_unstable();
    assert_eq!(missing, want);
}

#[test]
fn war_turn_with_ai_cities_is_blocked_only_by_infra_tech_religia() {
    // (3) Po klocku 2 run_war_turn (STRICT) blokuja WYLACZNIE infra/tech/religia (brak magazynow w stanie);
    // ludki, rekruci, terytorium i kultura nie. Wspolna granica nie jest blokerem (build_war_inputs przechodzi).
    // `advance_turn` produkcyjny: patrz test w `playable.rs` (komunikat zawiera "infra").
    let state = state_with(vec![
        city(1, 1, 10, 10, 1, 0),
        city(2, 1, 12, 10, 1, 0),
        city(3, 1, 14, 10, 1, 0),
        city(4, 2, 16, 10, 1, 0),
        city(5, 2, 18, 10, 1, 0),
        city(6, 2, 20, 10, 1, 0),
    ]);
    let inputs = build_war_inputs(&state, &WarTurnState::default()).expect("inputs");
    let cfg = production_config(&state).expect("config");
    let mut war = WarTurnState::default();
    let mut ctx = WarTurnContext {
        war: &mut war,
        turn: 1.0,
        inputs: &inputs,
        config: &cfg,
    };
    match run_war_turn(&mut ctx) {
        Err(WarTurnError::PowerComponentsMissing(_, mut keys)) => {
            keys.sort_unstable();
            let mut want = UNPRODUCED_POWER_COMPONENTS.to_vec();
            want.sort_unstable();
            assert_eq!(keys, want);
        }
        other => panic!("oczekiwano PowerComponentsMissing, jest {other:?}"),
    }
}

// --- (4) wspolna granica: wektory z pinu --------------------------------------------------------------------

#[test]
fn shared_border_matches_pin_vectors() {
    let v: Value = serde_json::from_str(include_str!("p6_wire_war_pop_vectors/shared_border.json"))
        .expect("vectors");
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 60);
    let (mut yes, mut no) = (0, 0);
    for (i, c) in cases.iter().enumerate() {
        let (w, h) = (
            c["w"].as_u64().unwrap() as u16,
            c["h"].as_u64().unwrap() as u16,
        );
        let tiles: Vec<char> = c["tiles"].as_str().unwrap().chars().collect();
        assert_eq!(tiles.len(), usize::from(w) * usize::from(h));
        let mut map = plains_map(w, h);
        for (n, t) in map.tiles.iter_mut().enumerate() {
            t.terrain = match tiles[n] {
                'W' => PlayableTerrain::Water,
                'H' => PlayableTerrain::Hills,
                _ => PlayableTerrain::Plains,
            };
            t.passable = t.terrain.is_passable();
        }
        let cities: Vec<PlayableCity> = c["cities"]
            .as_array()
            .unwrap()
            .iter()
            .enumerate()
            .map(|(n, k)| {
                city(
                    100 + n as u64,
                    k["owner"].as_u64().unwrap(),
                    k["x"].as_u64().unwrap() as u16,
                    k["y"].as_u64().unwrap() as u16,
                    k["pop"].as_u64().unwrap() as u32,
                    0,
                )
            })
            .collect();
        let mut state = state_with(cities);
        state.map = map;
        let got = shared_border_pairs(&state).expect("granica");
        let expected = c["expected"].as_bool().unwrap();
        assert_eq!(got.contains(&(1, 2)), expected, "przypadek {i}");
        assert_eq!(
            c["expectedRev"].as_bool().unwrap(),
            expected,
            "symetria weba {i}"
        );
        if expected {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(
        yes >= 8 && no >= 8,
        "wektory musza pokrywac obie klasy: {yes}/{no}"
    );
}

#[test]
fn shared_border_needs_more_than_two_cities_on_both_sides() {
    // Web: `cities(a) > 2 && cities(b) > 2 && ownersShareLandBorderLive` - 2 miasta sasiadujace => false.
    let state = state_with(vec![
        city(1, 1, 10, 10, 1, 0),
        city(2, 1, 11, 10, 1, 0),
        city(3, 2, 12, 10, 1, 0),
        city(4, 2, 13, 10, 1, 0),
    ]);
    assert_eq!(shared_border_pairs(&state), Ok(Default::default()));
}

#[test]
fn build_war_inputs_carries_shared_border_and_full_power_for_every_owner() {
    let state = state_with(vec![
        city(1, 1, 10, 10, 1, 0),
        city(2, 1, 12, 10, 1, 0),
        city(3, 1, 14, 10, 1, 0),
        city(4, 2, 16, 10, 1, 0),
        city(5, 2, 18, 10, 1, 0),
        city(6, 2, 20, 10, 1, 0),
    ]);
    let inputs = build_war_inputs(&state, &WarTurnState::default()).expect("inputs");
    assert!(inputs.shared_border.contains(&(1, 2)));
    assert_eq!(inputs.power_raw.len(), 2);
}
