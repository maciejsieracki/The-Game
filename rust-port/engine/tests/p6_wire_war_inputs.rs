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
    build_war_inputs, build_war_inputs_with_epochs, epochs_from_state, pair_params_for,
    peace_locks_from_war, power_raw_for_owner, production_config, rust_owner_id,
    shared_border_pairs, start_epoch_number, web_owner_id, WarInputsError, EXPLICIT_ZERO_REASONS,
    KEY_ERA_PEACE_LOCK, KNOWN_GAPS, UNPRODUCED_POWER_COMPONENTS,
};
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PowerModel, WarTurnContext, WarTurnError, WarTurnInputs,
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

/// Zrodlo epok WSTRZYKNIETE przez test (PlayableState nie ma producenta epok; r5: brak podstawiania
/// epoki startu). Odpowiednik wektora z pinu / przyszlego producenta.
fn epochs(pairs: &[(i64, f64)]) -> BTreeMap<i64, f64> {
    pairs.iter().copied().collect()
}

/// TEST-ONLY ZERA (r5, zarzut Evaluatora pkt 2): uzupelnia skladniki `Missing` wejsc mocy wartoscia
/// `Provided(0.0)`, zeby wektory tick->brake i bramki mogly przejsc STRICT. Produkcja tego NIE robi
/// (`production_power_inputs_mark_unproduced_components_missing_not_zero` i testy STRICT ponizej).
/// Testy korzystajace z tej funkcji NIE dowodza zachowania pipeline'u z produkcyjnymi danymi
/// (kryterium r4 pkt 1 NIESPELNIONE, patrz 02a-obrona.md).
fn complete_power_test_only_zeros(inputs: &mut WarTurnInputs) {
    for raw in inputs.power_raw.values_mut() {
        for c in [
            &mut raw.suma_ludkow,
            &mut raw.rekrut_ekw,
            &mut raw.heksy_terytorium,
            &mut raw.budynki,
            &mut raw.tech_zbadane,
            &mut raw.kultura_imperium,
            &mut raw.miasta_jednosc_religii,
        ] {
            if *c == Component::Missing {
                *c = Component::Provided(0.0);
            }
        }
    }
}

/// Produkcyjne `build_war_inputs_with_epochs` + `complete_power` (test).
fn test_inputs(state: &PlayableState, war: &WarTurnState, e: &[(i64, f64)]) -> WarTurnInputs {
    let mut inputs = build_war_inputs_with_epochs(state, war, &epochs(e)).expect("inputs");
    complete_power_test_only_zeros(&mut inputs);
    inputs
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
                pair_params_for(&state_with(None, ai, "kamien")).unwrap()[&(1, 2)]
            }
            (Some(a), Some(b)) => {
                let mut state = state_with(None, a, "kamien");
                state.players.push(PlayablePlayer {
                    id: PlayerId::new(3),
                    name: "AI3".to_owned(),
                    civilization: b.to_owned(),
                    is_human: false,
                });
                pair_params_for(&state).unwrap()[&(2, 3)]
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
        // Epoki z wektora pinu wchodza przez produkcyjne `build_war_inputs_with_epochs` (nie ma
        // producenta epok); wspolna granica pary jest wstrzykniefta (po 1 miescie => strukturalnie false).
        let mut inputs = test_inputs(
            &state,
            &WarTurnState::default(),
            &[(1, num(&row["epochA"])), (2, num(&row["epochB"]))],
        );
        inputs.shared_border.insert((1, 2));
        let cfg = production_config(&state).expect("config");
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
fn production_power_inputs_mark_unproduced_components_missing_not_zero() {
    let state = state_with(None, "rzymianie", "kamien");
    let raw = power_raw_for_owner(&state, 2, 1.0).expect("raw");
    let p = civ_engine::data::units_combat::parse_power_params().expect("params");
    let coeffs = PowerCoeffs::from_params(&p);
    // Skladniki bez producenta: Missing (nie Provided(0), nie stala zalozenia).
    for c in [
        raw.suma_ludkow,
        raw.rekrut_ekw,
        raw.heksy_terytorium,
        raw.budynki,
        raw.tech_zbadane,
        raw.kultura_imperium,
        raw.miasta_jednosc_religii,
    ] {
        assert_eq!(c, Component::Missing);
    }
    // Skladniki z producenta / jawne zera.
    assert!(matches!(raw.miasta, Component::Provided(m) if m == 1.0));
    assert!(matches!(raw.jednostki, Component::Provided(_)));
    assert_eq!(raw.wygrane_bitwy, Component::ExplicitZero);
    assert_eq!(raw.bitwy_pkt_sum, Component::ExplicitZero);
    assert_eq!(raw.ulepszenia_terenu, Component::ExplicitZero);
    assert_eq!(raw.zdobycze_power, Component::ExplicitZero);
    for model in [BattlePowerModel::FlatCount, BattlePowerModel::EnemyMSum] {
        let err = objective_power_for_owner(&raw, &coeffs, model, &Default::default())
            .expect_err("STRICT: Missing => blad");
        // Egzekwowanie KNOWN_GAPS: lista kluczy = dokladnie to, czego brakuje w produkcji.
        let mut got = err.0.clone();
        let mut want: Vec<&str> = UNPRODUCED_POWER_COMPONENTS.to_vec();
        got.sort_unstable();
        want.sort_unstable();
        assert_eq!(got, want, "{model:?}");
    }
    for (key, reason) in EXPLICIT_ZERO_REASONS {
        assert!(has_pin_file_line_ref(reason), "{key}: brak plik:linia pinu");
    }
    let keys: Vec<&str> = EXPLICIT_ZERO_REASONS.iter().map(|(k, _)| *k).collect();
    assert_eq!(keys, ["bitwy", "ulepszenia", "zdobycze"]);
    // KNOWN_GAPS: kazdy brakujacy skladnik jest nazwany w liscie luk; luki epoki i granicy maja pin.
    assert_eq!(KNOWN_GAPS.len(), 5);
    for key in UNPRODUCED_POWER_COMPONENTS {
        assert!(
            KNOWN_GAPS.iter().any(|g| g.contains(key)),
            "skladnik {key} bez wpisu w KNOWN_GAPS"
        );
    }
    assert!(has_pin_file_line_ref(KNOWN_GAPS[0]) && has_pin_file_line_ref(KNOWN_GAPS[1]));
    let _ = battle_power_model(&p);
}

#[test]
fn completed_power_grows_with_city_count_producer() {
    // Producent `miasta` (z PlayableState) wchodzi do mocy; reszta uzupelniona testowo.
    let state = state_with(None, "rzymianie", "kamien");
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
        let inputs = test_inputs(s, &WarTurnState::default(), &[(1, 1.0), (2, 1.0)]);
        objective_power_for_owner(
            &inputs.power_raw[&2],
            &model.coeffs,
            model.battle,
            &model.military,
        )
        .unwrap()
    };
    assert!(pw(&bigger) > pw(&state));
}

#[test]
fn production_owner_epochs_come_from_the_epoch_producer_not_ad_hoc() {
    // W8 r6 (WIRE-WAR-EPOKA): producent `turn_war_epoch` (pin main.ts:2419). PlayableState nie niesie
    // badan, wiec AI = jawny fallback gameStartEra, czlowiek = epoka startu (patrz p6_wire_war_epoch).
    assert_eq!(start_epoch_number("kamien"), Ok(1.0));
    assert_eq!(start_epoch_number("zelazo"), Ok(3.0));
    assert!(matches!(
        start_epoch_number("atlantyda"),
        Err(WarInputsError::UnknownStartEpoch(_))
    ));
    let state = state_with(None, "rzymianie", "zelazo");
    assert_eq!(epochs_from_state(&state), Ok(epochs(&[(1, 3.0), (2, 3.0)])));
    let built = build_war_inputs(&state, &WarTurnState::default()).expect("epoki z producenta");
    assert_eq!(built.epochs, epochs(&[(1, 3.0), (2, 3.0)]));
    // Wstrzykniete epoki musza obejmowac KAZDEGO wlasciciela.
    assert_eq!(
        build_war_inputs_with_epochs(&state, &WarTurnState::default(), &epochs(&[(1, 3.0)])),
        Err(WarInputsError::OwnerEpochUnavailable(2))
    );
    let inputs = test_inputs(&state, &WarTurnState::default(), &[(1, 3.0), (2, 2.0)]);
    assert_eq!(inputs.epochs.get(&1), Some(&3.0));
    assert_eq!(inputs.epochs.get(&2), Some(&2.0));
    assert!(
        !inputs.epochs.contains_key(&0),
        "owner 0 nie istnieje w Rust"
    );
    // Pusty swiat / brak AI z miastami: faza bez par nie wymaga epok.
    assert_eq!(
        epochs_from_state(&PlayableState::empty()),
        Ok(BTreeMap::new())
    );
    assert!(build_war_inputs(&PlayableState::empty(), &WarTurnState::default()).is_ok());
}

#[test]
fn production_path_fails_with_explicit_blockers_for_ai_with_cities() {
    // W8 r6: build_war_inputs przechodzi (epoki z producenta); NASTEPNY bloker to brakujace skladniki mocy
    // (STRICT w run_war_turn) zamiast cichych zer.
    let state = state_with(None, "rzymianie", "kamien");
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
        Err(WarTurnError::PowerComponentsMissing(owner, keys)) => {
            assert_eq!(owner, 1);
            let mut want: Vec<&str> = UNPRODUCED_POWER_COMPONENTS.to_vec();
            let mut got = keys;
            want.sort_unstable();
            got.sort_unstable();
            assert_eq!(got, want);
        }
        other => panic!("oczekiwano PowerComponentsMissing, jest {other:?}"),
    }
}

#[test]
fn shared_border_is_structurally_false_up_to_two_cities_and_an_error_above() {
    let mut state = state_with(None, "rzymianie", "kamien");
    assert_eq!(shared_border_pairs(&state), Ok(Default::default()));
    // Web main.ts:22876: `cities(a) > 2 && cities(b) > 2 && ownersShareLandBorderLive` - 2 miasta => false.
    for owner in [1_u64, 2] {
        state.cities.push(PlayableCity {
            id: CityId::new(700 + owner),
            owner_id: PlayerId::new(owner),
            name: "x".to_owned(),
            position: PositionDto::new(10 + owner as u16, 10),
            is_capital: false,
        });
    }
    assert_eq!(
        shared_border_pairs(&state),
        Ok(Default::default()),
        "po 2 miasta"
    );
    for owner in [1_u64, 2] {
        state.cities.push(PlayableCity {
            id: CityId::new(800 + owner),
            owner_id: PlayerId::new(owner),
            name: "y".to_owned(),
            position: PositionDto::new(20 + owner as u16, 20),
            is_capital: false,
        });
    }
    // Po 3 miasta: potrzebny producent granicy => jawny blad (nie ciche `false`).
    assert_eq!(
        shared_border_pairs(&state),
        Err(WarInputsError::SharedBorderUnavailable(1, 2))
    );
    assert_eq!(
        build_war_inputs_with_epochs(
            &state,
            &WarTurnState::default(),
            &epochs(&[(1, 1.0), (2, 1.0)])
        ),
        Err(WarInputsError::SharedBorderUnavailable(1, 2))
    );
}

#[test]
fn pair_params_for_unknown_city_owner_is_an_error_not_the_player_profile() {
    let mut state = state_with(None, "rzymianie", "kamien");
    assert!(pair_params_for(&state).is_ok());
    state.cities.push(PlayableCity {
        id: CityId::new(900),
        owner_id: PlayerId::new(9),
        name: "obcy".to_owned(),
        position: PositionDto::new(12, 12),
        is_capital: false,
    });
    assert_eq!(
        pair_params_for(&state),
        Err(WarInputsError::UnknownOwner(9))
    );
    assert!(production_config(&state).is_err());
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

fn is_pair_2_3(a: i64, b: i64) -> bool {
    (a, b) == (2, 3) || (a, b) == (3, 2)
}

type InputsFor = Box<dyn Fn(&WarTurnState) -> WarTurnInputs>;

/// Gracz 1 + AI 2 + AI 3 (po miescie), epoki 1; wejscia z produkcyjnego `build_war_inputs_with_epochs`.
fn three_owner_state() -> (PlayableState, InputsFor) {
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
    let st = state.clone();
    let f: InputsFor = Box::new(move |war| test_inputs(&st, war, &[(1, 1.0), (2, 1.0), (3, 1.0)]));
    (state, f)
}

/// Kryzys od pierwszej tury dla kazdej pary (prog nie do spelnienia, N = 1).
fn crisis_config(state: &PlayableState) -> civ_engine::domain::turn_war_pipeline::WarTurnConfig {
    let mut cfg = production_config(state).expect("config");
    for p in cfg.pair_params.values_mut() {
        p.prog = 1000.0;
        p.n = 1.0;
    }
    cfg
}

fn declared_2_3(multiwar: bool, lock: bool, turns: std::ops::RangeInclusive<u32>) -> bool {
    let (state, inputs_for) = three_owner_state();
    let mut war = WarTurnState::default();
    if lock {
        war.opaque.insert(
            KEY_ERA_PEACE_LOCK.to_owned(),
            serde_json::json!([["2-3", { "ownerId": 2, "era": 1 }]]),
        );
    }
    let inputs = inputs_for(&war);
    let mut cfg = crisis_config(&state);
    cfg.multiwar_enabled = multiwar;
    let mut any = false;
    for turn in turns {
        let mut ctx = WarTurnContext {
            war: &mut war,
            turn: f64::from(turn),
            inputs: &inputs,
            config: &cfg,
        };
        let report = run_war_turn(&mut ctx).expect("faza");
        any |= report
            .declarations
            .iter()
            .any(|d| is_pair_2_3(d.declarer, d.victim));
    }
    any
}

#[test]
fn peace_lock_from_state_blocks_declaration_in_isolation_from_the_gate() {
    // Bramka wylaczona (multiwar = false), tura 41 (R1 otwarta): jedyna roznica to blokada pokoju z `opaque`.
    assert!(
        declared_2_3(false, false, 41..=44),
        "kontrola: bez blokady jest deklaracja"
    );
    assert!(
        !declared_2_3(false, true, 41..=44),
        "blokada pokoju 2-3 z WarTurnState wstrzymuje deklaracje"
    );
}

#[test]
fn gate_r1_blocks_ai_ai_declaration_before_turn_40_in_isolation_from_peace_locks() {
    // ROZNICA B: web liczy bramke R1/R2 per deklaracja w kolejce wojny (po kroku kryzysu); Rust raz na
    // poczatku fazy z licznikiem wojen z `brake_phase.at_war`. Asercje na wartosc Rust; regula R1
    // (`DELAY_INTER_CIV_WARS_UNTIL_TURN` = 40, diplomacy_multiwar_gate.rs:12) wspolna z pinem.
    // Bez blokad pokoju i bez bramki para 2-3 deklaruje wojne w turach 1-3 ...
    assert!(
        declared_2_3(false, false, 1..=3),
        "kontrola: bez bramki deklaracja jest"
    );
    // ... z bramka ta sama sytuacja przed tura 40 NIE daje deklaracji (R1) ...
    assert!(
        !declared_2_3(true, false, 1..=3),
        "R1 blokuje przed tura 40"
    );
    // ... a od tury 40 bramka R1 sie otwiera.
    assert!(declared_2_3(true, false, 40..=43), "R1 otwarta od tury 40");
    // R2 (limit rownoczesnych wojen epoki 1) NIE_ZMIERZONO w izolacji: wymaga zywych wojen w
    // `brake_phase.at_war` bez efektow deklaracji (r6); pokryte jednostkowo w p6_brake_inputs.
}

#[test]
fn strict_missing_component_is_an_error_not_a_zero() {
    let state = state_with(None, "rzymianie", "kamien");
    let mut inputs = test_inputs(&state, &WarTurnState::default(), &[(1, 1.0), (2, 1.0)]);
    let mut raw = inputs.power_raw[&2].clone();
    raw.heksy_terytorium = Component::Missing;
    inputs.power_raw.insert(2, raw);
    let cfg = production_config(&state).expect("config");
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
    assert!(production_config(&state).unwrap().multiwar_enabled);
    let cfg: BTreeMap<PairKey, _> = production_config(&state).unwrap().pair_params;
    assert!(cfg.contains_key(&(1, 2)));
}
