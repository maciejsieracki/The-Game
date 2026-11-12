//! P6-WIRE-WAR-STORES (W8 r6 klocek 3): magazyny `PlayableStores` (budynki per miasto, badania per
//! wlasciciel, religia per miasto) i producenci infra / tech / religia w `power_raw_for_owner`
//! (zrodla logiki: pin 07d2fbd72, main.ts:2629 / :2638 / :2773 / :5535 / :5539).
//! Test 3 tur `advance_turn` z AI z miastami: `domain::playable::war_pipeline_advance_tests`.

use civ_engine::domain::brake_power::Component;
use civ_engine::domain::playable::{PlayableGame, PlayableState, StartGameParams};
use civ_engine::domain::turn_war_inputs::{
    build_war_inputs, power_raw_for_owner, production_config, UNPRODUCED_POWER_COMPONENTS,
};
use civ_engine::domain::turn_war_pipeline::{run_war_turn, WarTurnContext};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::{CityId, PlayableCity, PlayerId, PositionDto};

/// Zapis sprzed WIRE-WAR-STORES: stan sesji bez pola `stores` (fixture z kodu bazy d11c995e6).
const SAVE_PRE_STORES: &str = include_str!("p6_wire_war_stores_vectors/save_pre_stores.json");

fn state_with_ai() -> PlayableState {
    let mut game = PlayableGame::new(StartGameParams {
        seed: 11,
        ..StartGameParams::default()
    })
    .expect("scenario");
    game.add_player(2, "AI".to_owned()).expect("ai");
    let mut state = game.state().clone();
    state.cities.push(PlayableCity {
        id: CityId::new(900),
        owner_id: PlayerId::new(2),
        name: "AI-city".to_owned(),
        position: PositionDto::new(5, 5),
        is_capital: true,
        population: 1,
        culture: 0,
    });
    state
}

fn provided(c: Component) -> f64 {
    match c {
        Component::Provided(v) => v,
        other => panic!("oczekiwano Provided, jest {other:?}"),
    }
}

#[test]
fn pre_stores_save_loads_with_default_stores() {
    // (1) kompatybilnosc wsteczna: zapis bez `stores` laduje sie przez #[serde(default)].
    assert!(!SAVE_PRE_STORES.contains("\"stores\""));
    let state: PlayableState = serde_json::from_str(SAVE_PRE_STORES).expect("stary zapis");
    assert!(state.stores.is_default());
    // Pusty magazyn nie trafia do zapisu: format zapisu bez zmian dla starych stanow.
    let again = serde_json::to_value(&state).expect("serialize");
    assert!(again.get("stores").is_none());
    let old: serde_json::Value = serde_json::from_str(SAVE_PRE_STORES).expect("json");
    assert_eq!(again, old);
}

#[test]
fn stores_roundtrip_when_populated() {
    let mut state = state_with_ai();
    state
        .stores
        .buildings_by_city
        .insert(900, vec!["swiatynia".into()]);
    state
        .stores
        .researched_techs_by_owner
        .insert(2, ["a".to_owned()].into());
    state
        .stores
        .religion_by_city
        .insert(900, [("X".to_owned(), 3)].into());
    let json = serde_json::to_string(&state).expect("serialize");
    assert!(json.contains("\"stores\""));
    let back: PlayableState = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(back.stores, state.stores);
}

#[test]
fn empty_stores_are_a_real_empty_state_not_missing() {
    // (2) puste magazyny budynkow/badan = Provided(0) (stan nie symuluje budowy ani badan), nie Missing.
    let state = state_with_ai();
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    assert_eq!(raw.budynki, Component::Provided(0.0));
    assert_eq!(raw.tech_zbadane, Component::Provided(0.0));
    let unity = provided(raw.miasta_jednosc_religii);
    assert!(unity == 0.0 || unity == 1.0, "{unity}");
    assert!(UNPRODUCED_POWER_COMPONENTS.is_empty());
}

#[test]
fn buildings_count_only_cities_of_owner() {
    // web countBuildingsForOwner: suma blt.length miast o tym id i wlascicielu; wpis bez miasta nie liczy sie.
    let mut state = state_with_ai();
    state
        .stores
        .buildings_by_city
        .insert(900, vec!["a".into(), "b".into(), "a".into()]);
    state.stores.buildings_by_city.insert(1, vec!["c".into()]);
    state
        .stores
        .buildings_by_city
        .insert(777, vec!["x".into(), "y".into()]);
    let ai = power_raw_for_owner(&state, 2, 1.0).expect("ai");
    let human = power_raw_for_owner(&state, 1, 1.0).expect("human");
    assert_eq!(ai.budynki, Component::Provided(3.0));
    assert_eq!(human.budynki, Component::Provided(1.0));
}

#[test]
fn tech_counts_set_size_per_owner() {
    // web countTechForOwner: czlowiek = rozmiar zbioru zbadanych, AI = rozmiar aiResearchDone (brak = 0).
    let mut state = state_with_ai();
    state
        .stores
        .researched_techs_by_owner
        .insert(1, ["a", "b"].map(String::from).into());
    state
        .stores
        .researched_techs_by_owner
        .insert(2, ["a", "b", "c"].map(String::from).into());
    let human = power_raw_for_owner(&state, 1, 1.0).expect("human");
    let ai = power_raw_for_owner(&state, 2, 1.0).expect("ai");
    assert_eq!(human.tech_zbadane, Component::Provided(2.0));
    assert_eq!(ai.tech_zbadane, Component::Provided(3.0));
}

#[test]
fn religion_unity_follows_stored_city_religion() {
    // web countCitiesWithDominantStateReligion: miasto liczy sie, gdy dominuje religia panstwowa wlasciciela.
    let mut state = state_with_ai();
    let default_unity = provided(
        power_raw_for_owner(&state, 2, 1.0)
            .expect("ai")
            .miasta_jednosc_religii,
    );
    // Zapisany stan obcej religii (100% wyznawcow) zastepuje stan domyslny => miasto sie nie liczy.
    state
        .stores
        .religion_by_city
        .insert(900, [("ObcaReligia".to_owned(), 10)].into());
    let foreign = power_raw_for_owner(&state, 2, 1.0).expect("ai");
    assert_eq!(foreign.miasta_jednosc_religii, Component::Provided(0.0));
    assert!(default_unity == 0.0 || default_unity == 1.0);
}

#[test]
fn three_war_turns_with_ai_cities_pass_strict() {
    // (3) run_war_turn (STRICT) z AI z miastami przechodzi 3 tury z rzedu na tym samym stanie wojny.
    let state = state_with_ai();
    let inputs = build_war_inputs(&state, &WarTurnState::default()).expect("inputs");
    let cfg = production_config(&state).expect("config");
    let mut war = WarTurnState::default();
    for turn in 1..=3 {
        let mut ctx = WarTurnContext {
            war: &mut war,
            turn: f64::from(turn),
            inputs: &inputs,
            config: &cfg,
        };
        run_war_turn(&mut ctx).expect("faza wojny bez blokerow");
    }
}
