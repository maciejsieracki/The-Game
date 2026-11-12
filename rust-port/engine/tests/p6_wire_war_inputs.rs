//! P6-WIRE-WAR-PIPELINE (W8 r4): producenci wejsc fazy Diplomacy (`domain/turn_war_inputs.rs`).
//!
//! Wektory z pinu 07d2fbd72 (generator `p6_wire_war_inputs_gen.mjs`): `diploBrakeWarParams` per para
//! i skladanie tick -> brake dla pary ze wspolna granica (kara wg epok). Rozbieznosci wzgledem web sa
//! oznaczone `ROZNICA B` (asercja na wartosc Rust + komentarz kolejnosci web).

use std::collections::BTreeMap;

use civ_engine::domain::ai_diplomacy_turn::PairKey;
use civ_engine::domain::brake_power::{
    battle_power_model, objective_power_for_owner, BattlePowerModel, Component, PowerCoeffs,
};
use civ_engine::domain::brake_power_rest::has_pin_file_line_ref;
use civ_engine::domain::diplomacy::{Relation, RelationStatus};
use civ_engine::domain::playable::{PlayableCity, PlayablePlayer, PlayableState};
use civ_engine::domain::turn_war_inputs::{
    build_war_inputs, pair_params_for, peace_locks_from_war, power_raw_for_owner,
    production_config, rust_owner_id, start_epoch_number, web_owner_id, WarInputsError,
    EXPLICIT_ZERO_REASONS, KEY_ERA_PEACE_LOCK, KNOWN_GAPS,
};
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PowerModel, WarTurnContext, WarTurnError,
};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::{CityId, PlayerId, PositionDto};
use serde_json::Value;

fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) => s.parse().expect("liczba w wektorze"),
        other => other.as_f64().expect("liczba w wektorze"),
    }
}

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_wire_war_inputs_vectors/vectors.json")).expect("vectors")
}

/// Stan: gracz 1 (civ `civ_a`, None = web `undefined`) + AI 2 (`civ_b`), po jednym miescie.
fn state_with(civ_a: Option<&str>, civ_b: &str, epoch_id: &str) -> PlayableState {
    let mut state = PlayableState::empty();
    state.params.epoch_id = epoch_id.to_owned();
    state.players = vec![
        PlayablePlayer {
            id: PlayerId::new(1),
            name: "H".to_owned(),
            civilization: civ_a.unwrap_or("gracz").to_owned(),
            is_human: true,
        },
        PlayablePlayer {
            id: PlayerId::new(2),
            name: "AI".to_owned(),
            civilization: civ_b.to_owned(),
            is_human: false,
        },
    ];
    for (i, owner) in [1_u64, 2].into_iter().enumerate() {
        state.cities.push(PlayableCity {
            id: CityId::new(100 + owner),
            owner_id: PlayerId::new(owner),
            name: format!("c{owner}"),
            position: PositionDto::new(2 + 3 * i as u16, 2),
            is_capital: true,
        });
    }
    state
}

#[test]
fn owner_id_mapping_rust_one_is_web_zero() {
    assert_eq!(web_owner_id(1), 0, "gracz Rust 1 = web 0");
    assert_eq!(web_owner_id(2), 1);
    assert_eq!(rust_owner_id(0), 1);
    for id in 0..10 {
        assert_eq!(web_owner_id(rust_owner_id(id)), id);
    }
    // Para Rust (1,2) = para web (0,1): klucz hamulca znormalizowany tak samo po przesunieciu.
    let rust_pair: PairKey = (1, 2);
    assert_eq!(
        (web_owner_id(rust_pair.0), web_owner_id(rust_pair.1)),
        (0, 1)
    );
}

#[test]
fn pair_params_match_web_diplo_brake_war_params_vectors() {
    let v = vectors();
    let rows = v["pairParams"].as_array().expect("pairParams");
    assert!(rows.len() > 100);
    let mut compared = 0;
    for row in rows {
        let (civ_a, civ_b) = (row["civA"].as_str(), row["civB"].as_str());
        let (prog, n) = (num(&row["out"]["prog"]), num(&row["out"]["n"]));
        let got = match (civ_a, civ_b) {
            // Web gracz po obu stronach: w Rust nie ma pary gracz-gracz.
            (None, None) => continue,
            // Gracz (isMe) + AI: strona `higher` jest symetryczna, wiec kolejnosc nie ma znaczenia.
            (None, Some(ai)) | (Some(ai), None) => {
                pair_params_for(&state_with(None, ai, "kamien"))[&(1, 2)]
            }
            (Some(a), Some(b)) => {
                let mut state = state_with(None, a, "kamien");
                state.players.push(PlayablePlayer {
                    id: PlayerId::new(3),
                    name: "AI3".to_owned(),
                    civilization: b.to_owned(),
                    is_human: false,
                });
                pair_params_for(&state)[&(2, 3)]
            }
        };
        assert_eq!(got.prog, prog, "{row}");
        assert_eq!(got.n, n, "{row}");
        compared += 1;
    }
    assert!(compared > 100, "porownano {compared} par");
}

#[test]
fn tick_then_brake_matches_web_for_border_pairs_by_epoch() {
    let v = vectors();
    let mut compared = 0;
    for row in v["tickBrake"].as_array().expect("tickBrake") {
        let civ_a = row["civA"].as_str();
        let civ_b = row["civB"].as_str().expect("AI civ");
        let mut state = state_with(civ_a, civ_b, "kamien");
        let mut inputs = build_war_inputs(&state, &WarTurnState::default()).expect("inputs");
        // Epoki z wektora (producent epok = epoka startu; tu wymuszamy pare epok z pinu).
        inputs.epochs.insert(1, num(&row["epochA"]));
        inputs.epochs.insert(2, num(&row["epochB"]));
        inputs.shared_border.insert((1, 2));
        let cfg = production_config(&state);
        assert_eq!(cfg.pair_params[&(1, 2)].prog, num(&row["brake"]["prog"]));
        assert_eq!(cfg.pair_params[&(1, 2)].n, num(&row["brake"]["n"]));
        let mut war = WarTurnState::default();
        war.diplomacy.set_relation(
            civ_engine::domain::diplomacy::CivilizationPair::new(
                PlayerId::new(1),
                PlayerId::new(2),
            ),
            Relation::new(num(&row["z0"]), num(&row["r0"]), RelationStatus::Neutral),
        );
        state.turn = 1;
        for t in row["turns"].as_array().expect("turns") {
            let turn = t["turn"].as_f64().expect("turn");
            let mut ctx = WarTurnContext {
                war: &mut war,
                turn,
                inputs: &inputs,
                config: &cfg,
            };
            let report = run_war_turn(&mut ctx).expect("faza");
            let rel = report.relation_after_tick[&(1, 2)];
            assert!(
                (rel - num(&t["rel"])).abs() < 1e-9,
                "relacja {rel} vs web {} ({row} tura {turn})",
                t["rel"]
            );
            if t["warTriggerReady"].as_bool() == Some(true) {
                // ROZNICA B: web przechodzi do kolejki wojny po kroku kryzysu, Rust robi to w tym samym
                // przebiegu fazy (hamulec po ticku); stan po deklaracji (licznik 0) nie jest porownywany.
                break;
            }
            let counter = war
                .brake_phase
                .counters
                .get(&(1, 2))
                .copied()
                .unwrap_or(0.0);
            assert_eq!(
                counter,
                t["counter"].as_f64().unwrap(),
                "licznik {row} tura {turn}"
            );
            compared += 1;
        }
    }
    assert!(compared > 100, "porownano {compared} tur");
}

#[test]
fn power_inputs_have_no_missing_components_and_explicit_zeros_are_justified() {
    let state = state_with(None, "rzymianie", "kamien");
    let raw = power_raw_for_owner(&state, 2, 1.0, false).expect("raw");
    let p = civ_engine::data::units_combat::parse_power_params().expect("params");
    let coeffs = PowerCoeffs::from_params(&p);
    for model in [BattlePowerModel::FlatCount, BattlePowerModel::EnemyMSum] {
        let r = objective_power_for_owner(&raw, &coeffs, model, &Default::default());
        assert!(r.is_ok(), "STRICT: brak skladnikow Missing: {r:?}");
    }
    assert!(matches!(raw.miasta, Component::Provided(m) if m == 1.0));
    assert!(matches!(raw.suma_ludkow, Component::Provided(l) if l > 0.0));
    assert_eq!(raw.wygrane_bitwy, Component::ExplicitZero);
    assert_eq!(raw.zdobycze_power, Component::ExplicitZero);
    for (key, reason) in EXPLICIT_ZERO_REASONS {
        assert!(has_pin_file_line_ref(reason), "{key}: brak plik:linia pinu");
    }
    let keys: Vec<&str> = EXPLICIT_ZERO_REASONS.iter().map(|(k, _)| *k).collect();
    assert_eq!(keys, ["bitwy", "ulepszenia", "zdobycze"]);
    assert!(!KNOWN_GAPS.is_empty(), "luki sa jawne, nie ukryte");
    // Moc rosnie z liczba miast (producent, nie stala).
    let mut bigger = state.clone();
    bigger.cities.push(PlayableCity {
        id: CityId::new(300),
        owner_id: PlayerId::new(2),
        name: "c3".to_owned(),
        position: PositionDto::new(8, 8),
        is_capital: false,
    });
    let model = PowerModel::web_params();
    let pw = |s: &PlayableState| {
        let raw = power_raw_for_owner(s, 2, 1.0, false).unwrap();
        objective_power_for_owner(&raw, &model.coeffs, model.battle, &model.military).unwrap()
    };
    assert!(pw(&bigger) > pw(&state));
    let _ = battle_power_model(&p);
}

#[test]
fn start_epoch_comes_from_game_params_and_unknown_epoch_is_an_error() {
    assert_eq!(start_epoch_number("kamien"), Ok(1.0));
    assert_eq!(start_epoch_number("braz"), Ok(2.0));
    assert_eq!(start_epoch_number("zelazo"), Ok(3.0));
    assert!(matches!(
        start_epoch_number("atlantyda"),
        Err(WarInputsError::UnknownStartEpoch(_))
    ));
    let state = state_with(None, "rzymianie", "zelazo");
    let inputs = build_war_inputs(&state, &WarTurnState::default()).unwrap();
    assert_eq!(inputs.epochs.get(&1), Some(&3.0));
    assert_eq!(inputs.epochs.get(&2), Some(&3.0));
    assert!(
        !inputs.epochs.contains_key(&0),
        "owner 0 nie istnieje w Rust"
    );
}

#[test]
fn peace_locks_are_read_from_the_war_state_and_malformed_data_is_an_error() {
    let mut war = WarTurnState::default();
    assert_eq!(peace_locks_from_war(&war).unwrap(), Default::default());
    war.opaque.insert(
        KEY_ERA_PEACE_LOCK.to_owned(),
        serde_json::json!([["1-2", { "ownerId": 2, "era": 1 }]]),
    );
    war.opaque.insert(
        "diplomacyPairMeta".to_owned(),
        serde_json::json!([["1-2", { "peaceUntilTurn": 9 }]]),
    );
    let facts = peace_locks_from_war(&war).unwrap();
    assert_eq!(facts.forced_era_locks[&(1, 2)].owner_id, 2);
    assert_eq!(facts.meta_by_pair[&(1, 2)].peace_until_turn, Some(9.0));
    war.opaque.insert(
        KEY_ERA_PEACE_LOCK.to_owned(),
        serde_json::json!([["x", {}]]),
    );
    assert!(peace_locks_from_war(&war).is_err());
}

#[test]
fn peace_lock_from_state_blocks_declaration_and_gate_r1_is_applied_in_rust_order() {
    // Para AI-AI z progiem relacji nie do spelnienia -> kryzys od 1. tury; blokada pokoju z `opaque`.
    let mut state = state_with(None, "rzymianie", "kamien");
    state.players.push(PlayablePlayer {
        id: PlayerId::new(3),
        name: "AI3".to_owned(),
        civilization: "grecy".to_owned(),
        is_human: false,
    });
    state.cities.push(PlayableCity {
        id: CityId::new(500),
        owner_id: PlayerId::new(3),
        name: "c3".to_owned(),
        position: PositionDto::new(9, 9),
        is_capital: true,
    });
    let mut war = WarTurnState::default();
    war.opaque.insert(
        KEY_ERA_PEACE_LOCK.to_owned(),
        serde_json::json!([["2-3", { "ownerId": 2, "era": 1 }]]),
    );
    let inputs = build_war_inputs(&state, &war).expect("inputs");
    let mut cfg = production_config(&state);
    for p in cfg.pair_params.values_mut() {
        p.prog = 1000.0;
        p.n = 1.0;
    }
    for turn in 1..=3 {
        let mut ctx = WarTurnContext {
            war: &mut war,
            turn: f64::from(turn),
            inputs: &inputs,
            config: &cfg,
        };
        let report = run_war_turn(&mut ctx).expect("faza");
        // ROZNICA B: web liczy bramke R1/R2 per deklaracja w kolejce wojny; Rust raz na poczatku
        // fazy (licznik wojen z `brake_phase.at_war`). Wartosc Rust: pary AI-AI z blokada pokoju
        // nigdy nie sa deklarowane, niezaleznie od bramki.
        assert!(
            report
                .declarations
                .iter()
                .all(|d| !((d.declarer, d.victim) == (2, 3) || (d.declarer, d.victim) == (3, 2))),
            "blokada pokoju 2-3 (tura {turn})"
        );
    }
    assert!(!war.brake_phase.at_war.contains(&(2, 3)));
}

#[test]
fn strict_missing_component_is_an_error_not_a_zero() {
    let state = state_with(None, "rzymianie", "kamien");
    let mut inputs = build_war_inputs(&state, &WarTurnState::default()).unwrap();
    let mut raw = inputs.power_raw[&2].clone();
    raw.heksy_terytorium = Component::Missing;
    inputs.power_raw.insert(2, raw);
    let cfg = production_config(&state);
    let mut war = WarTurnState::default();
    let mut ctx = WarTurnContext {
        war: &mut war,
        turn: 1.0,
        inputs: &inputs,
        config: &cfg,
    };
    assert_eq!(
        run_war_turn(&mut ctx),
        Err(WarTurnError::PowerComponentsMissing(2, vec!["terytorium"]))
    );
}

#[test]
fn production_config_enables_multiwar_like_the_pin() {
    let state = state_with(None, "rzymianie", "kamien");
    assert!(production_config(&state).multiwar_enabled);
    let cfg: BTreeMap<PairKey, _> = production_config(&state).pair_params;
    assert!(cfg.contains_key(&(1, 2)));
}
