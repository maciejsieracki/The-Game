//! P6-WIRE-WAR-EPOKA (W8 r6, klocek 1): producent epoki wlasciciela (`domain/turn_war_epoch.rs`).
//!
//! Wektory z pinu 07d2fbd72 (generator `p6_wire_war_epoch_gen.mjs` wykonuje wyciety tekst
//! `empireEpochForOwner`/`gameStartEra` w node): 44 przypadki, w tym fallback `gameStartEra()`.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::playable::{PlayableCity, PlayablePlayer, PlayableState};
use civ_engine::domain::turn_war_epoch::{
    empire_epoch_for_owner, epochs_with_sources, era_number_from_epoch_id, game_start_era,
    EpochSource, OwnerEpochError, OwnerEraFacts,
};
use civ_engine::domain::turn_war_inputs::{
    build_war_inputs, epochs_from_state, production_config, shared_border_pairs, WarInputsError,
    UNPRODUCED_POWER_COMPONENTS,
};
use civ_engine::domain::turn_war_pipeline::{run_war_turn, WarTurnContext, WarTurnError};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::{CityId, PlayerId, PositionDto};
use serde_json::Value;

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_wire_war_epoch_vectors/vectors.json")).expect("vectors")
}

fn id_map(v: &Value) -> BTreeMap<i64, f64> {
    v.as_object()
        .expect("obiekt")
        .iter()
        .map(|(k, e)| (k.parse().expect("id"), e.as_f64().expect("era")))
        .collect()
}

#[test]
fn epoch_vectors_from_pin_match_the_decision_function() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 40,
        "min. 40 przypadkow, jest {}",
        cases.len()
    );
    let (mut fallback, mut throws, mut tracked_ai, mut tracked_human) = (0, 0, 0, 0);
    for (i, c) in cases.iter().enumerate() {
        let menu = c["menuEpochId"].as_str().expect("menu");
        let start = game_start_era(menu);
        assert_eq!(
            start,
            c["gameStartEra"].as_f64().unwrap(),
            "case {i} start {menu:?}"
        );
        let facts = OwnerEraFacts {
            human_ids: c["humanIds"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_i64().unwrap())
                .collect(),
            human_era: id_map(&c["humanEra"]),
            owner_era_by_owner: id_map(&c["ownerEra"]),
        };
        let owner = c["owner"].as_i64().unwrap();
        let got = empire_epoch_for_owner(owner, &facts, start);
        if c["throws"].as_bool().unwrap() {
            throws += 1;
            assert_eq!(
                got,
                Err(OwnerEpochError::HumanEraMissing(owner)),
                "case {i}"
            );
        } else {
            let (era, src) = got.unwrap_or_else(|e| panic!("case {i}: {e}"));
            assert_eq!(era, c["expected"].as_f64().unwrap(), "case {i} {menu:?}");
            match (src, facts.human_ids.contains(&owner)) {
                (EpochSource::FallbackGameStartEra, false) => fallback += 1,
                (EpochSource::Tracked, false) => tracked_ai += 1,
                (EpochSource::Tracked, true) => tracked_human += 1,
                other => panic!("case {i}: niespojne zrodlo {other:?}"),
            }
        }
    }
    // Pokrycie klas: fallback gameStartEra, wpis AI, czlowiek, wyjatek weba.
    assert!(fallback >= 8 && tracked_ai >= 8 && tracked_human >= 8 && throws >= 8);
}

#[test]
fn start_era_mapping_is_exact_like_web() {
    for (id, n) in [("kamien", 1.0), ("braz", 2.0), ("zelazo", 3.0)] {
        assert_eq!(era_number_from_epoch_id(id), n);
    }
    // Web: dokladny klucz, brak trim/lowercase => `?? 1`; pusty => `|| 'kamien'`.
    assert_eq!(era_number_from_epoch_id("BRAZ"), 1.0);
    assert_eq!(era_number_from_epoch_id("zelazo "), 1.0);
    assert_eq!(game_start_era(""), 1.0);
    assert_eq!(game_start_era("zelazo"), 3.0);
}

fn state_with(epoch_id: &str, cities: &[(u64, u16)]) -> PlayableState {
    let mut state = PlayableState::empty();
    state.params.epoch_id = epoch_id.to_owned();
    state.players = vec![
        PlayablePlayer {
            id: PlayerId::new(1),
            name: "H".to_owned(),
            civilization: "gracz".to_owned(),
            is_human: true,
        },
        PlayablePlayer {
            id: PlayerId::new(2),
            name: "AI".to_owned(),
            civilization: "rzymianie".to_owned(),
            is_human: false,
        },
    ];
    for (n, &(owner, x)) in cities.iter().enumerate() {
        state.cities.push(PlayableCity {
            id: CityId::new(100 + n as u64),
            owner_id: PlayerId::new(owner),
            name: format!("c{n}"),
            position: PositionDto::new(x, 2),
            is_capital: n < 2,
        });
    }
    state
}

#[test]
fn production_epochs_name_their_source_for_every_owner() {
    for (menu, want) in [("kamien", 1.0), ("braz", 2.0), ("zelazo", 3.0), ("", 1.0)] {
        let state = state_with(menu, &[(1, 2), (2, 5)]);
        let owners: BTreeSet<i64> = [1, 2].into();
        let got = epochs_with_sources(&state, &owners).expect("epoki");
        assert_eq!(
            got[&1],
            (want, EpochSource::Tracked),
            "czlowiek: epoka startu {menu:?}"
        );
        assert_eq!(
            got[&2],
            (want, EpochSource::FallbackGameStartEra),
            "AI bez wpisu: jawny fallback {menu:?}"
        );
        assert_eq!(
            epochs_from_state(&state),
            Ok([(1, want), (2, want)].into_iter().collect())
        );
    }
}

#[test]
fn build_war_inputs_no_longer_fails_on_the_epoch_producer() {
    let state = state_with("braz", &[(1, 2), (2, 5)]);
    let inputs = build_war_inputs(&state, &WarTurnState::default())
        .expect("blad 'brak producenta epoki' znika");
    assert_eq!(inputs.epochs.get(&1), Some(&2.0));
    assert_eq!(inputs.epochs.get(&2), Some(&2.0));
    assert_eq!(inputs.power_raw.len(), 2, "moc dla obu wlascicieli");
}

#[test]
fn next_blocker_is_power_components_missing_reported_explicitly() {
    // Po epokach NASTEPNY bloker: populacja/kultura/budynki/tech/religia = Missing (STRICT, nie zera).
    let state = state_with("kamien", &[(1, 2), (2, 5)]);
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
        Err(WarTurnError::PowerComponentsMissing(owner, mut keys)) => {
            assert_eq!(owner, 1);
            let mut want: Vec<&str> = UNPRODUCED_POWER_COMPONENTS.to_vec();
            want.sort_unstable();
            keys.sort_unstable();
            assert_eq!(keys, want);
        }
        other => panic!("oczekiwano PowerComponentsMissing, jest {other:?}"),
    }
}

#[test]
fn shared_border_producer_is_explicitly_unavailable_above_two_cities() {
    // Wejscia ownersHaveSharedLandBorder (trade-routes.ts:264): populacja miast (cityTerritoryRadius) i teren
    // heksow. PlayableCity nie ma populacji => BRAK producenta (nie ciche `false`), blad jawny.
    let state = state_with(
        "kamien",
        &[(1, 2), (2, 5), (1, 8), (2, 11), (1, 14), (2, 17)],
    );
    assert_eq!(
        shared_border_pairs(&state),
        Err(WarInputsError::SharedBorderUnavailable(1, 2))
    );
    assert_eq!(
        build_war_inputs(&state, &WarTurnState::default()),
        Err(WarInputsError::SharedBorderUnavailable(1, 2))
    );
}
