//! REPIN-WOJNA-NOWE-C - `gra/src/game/diplomacy-tick-war-brake.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_c_vectors/diplomacy-tick-war-brake.json`).

use civ_engine::domain::diplomacy_tick_war_brake::{
    advance_crisis_counter, crisis_pair_key, crisis_step_for_pair, is_diplo_tick_war_brake_enabled,
    CrisisStep, WarBrakeP6Params, DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_c_vectors/diplomacy-tick-war-brake.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("diplomacy-tick-war-brake.json parse")
}

/// Liczba z wektora: tekst `String(x)` (`Infinity`, `-Infinity`, `NaN`, `-0`) albo liczba JSON.
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "NaN" => f64::NAN,
            "-0" => -0.0,
            other => other.parse::<f64>().expect("liczba"),
        },
        other => panic!("nieoczekiwany typ liczby: {other}"),
    }
}

fn p6_of(v: &Value) -> WarBrakeP6Params {
    WarBrakeP6Params {
        kryzys_prog_zaufania: num(&v["kryzysProgZaufania"]),
        kryzys_tur_do_wojny: num(&v["kryzysTurDoWojny"]),
        kryzys_ostrzezenie_tur_przed: num(&v["kryzysOstrzezenieTurPrzed"]),
    }
}

fn step_of(v: &Value) -> CrisisStep {
    CrisisStep {
        counter: num(&v["counter"]),
        warning_active: v["warningActive"].as_bool().expect("warningActive"),
        war_trigger_ready: v["warTriggerReady"].as_bool().expect("warTriggerReady"),
    }
}

/// Porownanie krokow: liczniki bit-w-bit (w tym -0 vs +0 nie wystepuje w wyjsciu).
fn assert_step(got: CrisisStep, want: CrisisStep, ctx: &str) {
    assert_eq!(
        got.counter.to_bits(),
        want.counter.to_bits(),
        "{ctx}: counter {got:?} vs {want:?}"
    );
    assert_eq!(got.warning_active, want.warning_active, "{ctx}: warning");
    assert_eq!(got.war_trigger_ready, want.war_trigger_ready, "{ctx}: war");
}

#[test]
fn default_and_flag_match_web() {
    assert_eq!(
        DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT,
        root()["defaultFlag"].as_bool().unwrap()
    );
    let root = root();
    let cases = root["flagCases"].as_array().expect("flagCases");
    assert_eq!(cases.len(), 3);
    for c in cases {
        let ov = c["override"].as_bool();
        assert_eq!(
            is_diplo_tick_war_brake_enabled(ov),
            c["enabled"].as_bool().unwrap(),
            "override {ov:?}"
        );
    }
}

#[test]
fn advance_crisis_counter_matches_web() {
    let root = root();
    let cases = root["advanceCases"].as_array().expect("advanceCases");
    assert!(cases.len() >= 900);
    for (i, c) in cases.iter().enumerate() {
        let got = advance_crisis_counter(num(&c["prev"]), num(&c["zaufanie"]), &p6_of(&c["p6"]));
        assert_step(got, step_of(&c["out"]), &format!("advanceCases[{i}]"));
    }
}

#[test]
fn crisis_step_for_pair_matches_web() {
    let root = root();
    let cases = root["stepCases"].as_array().expect("stepCases");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let got = crisis_step_for_pair(
            num(&c["prev"]),
            num(&c["zaufanie"]),
            c["atWar"].as_bool().unwrap(),
            &p6_of(&c["p6"]),
        );
        assert_step(got, step_of(&c["out"]), &format!("stepCases[{i}]"));
    }
}

#[test]
fn crisis_pair_key_matches_web() {
    let root = root();
    let cases = root["pairCases"].as_array().expect("pairCases");
    for (i, c) in cases.iter().enumerate() {
        let a = c["a"].as_i64().unwrap();
        let b = c["b"].as_i64().unwrap();
        assert_eq!(
            crisis_pair_key(a, b),
            c["out"].as_str().unwrap(),
            "pairCases[{i}]"
        );
        assert_eq!(crisis_pair_key(a, b), crisis_pair_key(b, a));
    }
}

// --- jawne przypadki brzegowe P6 ---

fn p6(prog: f64, tur: f64, ostrz: f64) -> WarBrakeP6Params {
    WarBrakeP6Params {
        kryzys_prog_zaufania: prog,
        kryzys_tur_do_wojny: tur,
        kryzys_ostrzezenie_tur_przed: ostrz,
    }
}

#[test]
fn crisis_counter_hysteresis_and_thresholds() {
    let p = p6(0.0, 5.0, 2.0);
    // Zaufanie rowne progowi liczy sie jako kryzys (<=).
    assert_eq!(advance_crisis_counter(0.0, 0.0, &p).counter, 1.0);
    // Zaufanie powyzej progu zeruje licznik.
    assert_eq!(advance_crisis_counter(4.0, 0.5, &p).counter, 0.0);
    // NaN Zaufania: porownanie falszywe -> brak kryzysu.
    assert_eq!(advance_crisis_counter(4.0, f64::NAN, &p).counter, 0.0);
    // Ostrzezenie od N - 2 = 3, wojna od N = 5.
    let s3 = advance_crisis_counter(2.0, -1.0, &p);
    assert!(s3.warning_active && !s3.war_trigger_ready);
    let s5 = advance_crisis_counter(4.0, -1.0, &p);
    assert!(s5.warning_active && s5.war_trigger_ready && s5.counter == 5.0);
    let s2 = advance_crisis_counter(1.0, -1.0, &p);
    assert!(!s2.warning_active && !s2.war_trigger_ready);
}

#[test]
fn crisis_counter_sanitizes_previous_value() {
    let p = p6(0.0, 5.0, 2.0);
    // Niefinite / ujemne / NaN poprzednie wartosci -> 0, ulamki obcinane w dol.
    assert_eq!(advance_crisis_counter(f64::NAN, -1.0, &p).counter, 1.0);
    assert_eq!(advance_crisis_counter(f64::INFINITY, -1.0, &p).counter, 1.0);
    assert_eq!(advance_crisis_counter(-7.0, -1.0, &p).counter, 1.0);
    assert_eq!(advance_crisis_counter(2.9, -1.0, &p).counter, 3.0);
}

#[test]
fn crisis_step_at_war_resets_counter() {
    let p = p6(0.0, 5.0, 2.0);
    let s = crisis_step_for_pair(4.0, -10.0, true, &p);
    assert_eq!(
        s,
        CrisisStep {
            counter: 0.0,
            warning_active: false,
            war_trigger_ready: false
        }
    );
}

#[test]
fn flag_override_wins_over_default() {
    assert!(is_diplo_tick_war_brake_enabled(None));
    assert!(!is_diplo_tick_war_brake_enabled(Some(false)));
    assert!(is_diplo_tick_war_brake_enabled(Some(true)));
}
