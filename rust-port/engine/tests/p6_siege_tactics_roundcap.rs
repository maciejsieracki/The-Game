//! P6 SIEGE-TAKTYKA ROUNDCAP (K5d): testy zgodnosci `domain::siege_tactics_roundcap` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_roundcap_vectors/vectors.json`, generowane przez `p6_siege_tactics_roundcap_gen.mjs`
//! przez WYKONANIE tekstu pinu `gra/src/battle/battleScene.ts` (pin 07d2fbd72): `FF_MAX_ROUNDS` (1125), `_beginTurn`
//! (5631-5636), `_roundCapVerdict` (9449-9464), `_ffRoundCapResult` (9485-9497), bramka sufitu z `_checkEnd` (10199-10206).
//! Wartosci nieskonczone sa w JSON jako napisy "NaN", "Infinity", "-Infinity".

use civ_engine::domain::siege_no_breach::RoundCapVerdict;
use civ_engine::domain::siege_tactics_roundcap::{
    begin_turn, cap_gate, ff_cap_step, RoundCapState, RoundCapStep,
};

const VECTORS: &str = include_str!("p6_siege_tactics_roundcap_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z JSON: zwykla liczba albo napis dla NaN/Infinity (generator).
fn num(v: &serde_json::Value) -> f64 {
    if let Some(x) = v.as_f64() {
        return x;
    }
    match v.as_str().expect("liczba lub napis") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        other => other.parse().expect("liczba w napisie"),
    }
}

fn state(v: &serde_json::Value) -> RoundCapState {
    RoundCapState {
        round_no: v["roundNo"].as_i64().expect("roundNo"),
        no_breach_cap: v["noBreachCap"].as_i64().expect("noBreachCap"),
        wall_present: v["wallPresent"].as_bool().expect("wallPresent"),
        wall_ever_breached: v["wallEverBreached"].as_bool().expect("wallEverBreached"),
    }
}

/// Nazwa wyniku w konwencji wektorow (jak `battleScene.ts`: `'remis' | 'obronca' | 'atakujacy'`).
fn step_name(s: RoundCapStep) -> &'static str {
    match s {
        RoundCapStep::Continue => "continue",
        RoundCapStep::Finish(RoundCapVerdict::Draw) => "remis",
        RoundCapStep::Finish(RoundCapVerdict::Defender) => "obronca",
        RoundCapStep::Finish(RoundCapVerdict::Attacker) => "atakujacy",
    }
}

#[test]
fn wektory_bramka_sufitu_zgodne_z_webem() {
    let v = load();
    let cases = v["gate"].as_array().expect("gate");
    assert!(cases.len() >= 300, "wektory gate: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let got = cap_gate(
            &state(&c["state"]),
            c["aliveA"].as_bool().unwrap(),
            c["aliveD"].as_bool().unwrap(),
            num(&c["ratioA"]),
            num(&c["ratioD"]),
        );
        assert_eq!(
            step_name(got),
            c["expect"].as_str().unwrap(),
            "gate #{i}: {c}"
        );
    }
}

#[test]
fn wektory_poczatek_tury_zgodne_z_webem() {
    let v = load();
    let cases = v["beginTurn"].as_array().expect("beginTurn");
    assert!(cases.len() >= 300, "wektory beginTurn: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let (next, got) = begin_turn(&state(&c["state"]), num(&c["ratioA"]), num(&c["ratioD"]));
        assert_eq!(
            step_name(got),
            c["expect"].as_str().unwrap(),
            "begin #{i}: {c}"
        );
        assert_eq!(
            next.round_no,
            c["roundNoAfter"].as_i64().unwrap(),
            "begin #{i} roundNo: {c}"
        );
    }
}

#[test]
fn wektory_przewijanie_sufit_zgodne_z_webem() {
    let v = load();
    let cases = v["ff"].as_array().expect("ff");
    assert!(cases.len() >= 300, "wektory ff: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let got = ff_cap_step(&state(&c["state"]), num(&c["ratioA"]), num(&c["ratioD"]));
        assert_eq!(
            step_name(got),
            c["expect"].as_str().unwrap(),
            "ff #{i}: {c}"
        );
    }
}

/// Pokrycie galezi: liczniki wg kategorii (wypisywane w raporcie). Kategorie licza sie z wejsc wektorow.
#[test]
fn pokrycie_galezi_wektorow() {
    let v = load();
    let mut c: std::collections::BTreeMap<&str, usize> = std::collections::BTreeMap::new();
    let mut bump = |k: &'static str| *c.entry(k).or_insert(0) += 1;
    for case in v["gate"].as_array().unwrap() {
        let s = state(&case["state"]);
        let (a, d) = (
            case["aliveA"].as_bool().unwrap(),
            case["aliveD"].as_bool().unwrap(),
        );
        if !(a && d) {
            bump("gate: bramka pominieta (zywe nie obie)");
            continue;
        }
        bump("gate: bramka aktywna");
        if s.wall_present && !s.wall_ever_breached {
            bump("gate: oblezenie bez wylomu");
        }
        match case["expect"].as_str().unwrap() {
            "continue" => bump("gate: kontynuacja"),
            "remis" => bump("gate: remis"),
            "obronca" => bump("gate: obronca"),
            "atakujacy" => bump("gate: atakujacy"),
            other => panic!("nieznany expect {other}"),
        }
    }
    for case in v["beginTurn"].as_array().unwrap() {
        match case["expect"].as_str().unwrap() {
            "continue" => bump("begin: roundNo++"),
            _ => bump("begin: werdykt (bez roundNo++)"),
        }
    }
    for case in v["ff"].as_array().unwrap() {
        let s = state(&case["state"]);
        if s.wall_present && !s.wall_ever_breached {
            bump("ff: oblezenie bez wylomu");
        }
        match case["expect"].as_str().unwrap() {
            "continue" => bump("ff: kontynuacja"),
            "remis" => bump("ff: remis"),
            "obronca" => bump("ff: obronca"),
            "atakujacy" => bump("ff: atakujacy"),
            other => panic!("nieznany expect {other}"),
        }
    }
    eprintln!("POKRYCIE roundcap: {c:?}");
    for k in [
        "gate: bramka aktywna",
        "gate: bramka pominieta (zywe nie obie)",
        "gate: oblezenie bez wylomu",
        "gate: kontynuacja",
        "gate: remis",
        "gate: obronca",
        "gate: atakujacy",
        "begin: roundNo++",
        "begin: werdykt (bez roundNo++)",
        "ff: kontynuacja",
        "ff: remis",
        "ff: obronca",
        "ff: atakujacy",
    ] {
        assert!(c.get(k).copied().unwrap_or(0) > 0, "brak pokrycia: {k}");
    }
}

#[test]
fn bramka_pominieta_gdy_martwa_strona() {
    let s = RoundCapState {
        round_no: 500,
        no_breach_cap: 150,
        wall_present: true,
        wall_ever_breached: false,
    };
    assert_eq!(cap_gate(&s, false, true, 1.0, 0.0), RoundCapStep::Continue);
    assert_eq!(cap_gate(&s, true, false, 1.0, 0.0), RoundCapStep::Continue);
    // Przewijanie nie zna bramki zywych: ten sam stan daje werdykt.
    assert!(matches!(ff_cap_step(&s, 1.0, 0.0), RoundCapStep::Finish(_)));
}

#[test]
fn poczatek_tury_nie_zwieksza_licznika_przy_werdykcie() {
    let s = RoundCapState {
        round_no: 150,
        no_breach_cap: 150,
        wall_present: true,
        wall_ever_breached: false,
    };
    let (next, step) = begin_turn(&s, 0.5, 0.5);
    assert_eq!(step, RoundCapStep::Finish(RoundCapVerdict::Draw));
    assert_eq!(next.round_no, 150);
    let s2 = RoundCapState { round_no: 149, ..s };
    let (next2, step2) = begin_turn(&s2, 0.5, 0.5);
    assert_eq!(step2, RoundCapStep::Continue);
    assert_eq!(next2.round_no, 150);
}

#[test]
fn limit_400_bez_oblezenia_i_clamp_cap_do_400() {
    // Bez oblezenia: sufit 400, morale NaN -> atakujacy (JS: NaN <= x jest false).
    let s = RoundCapState {
        round_no: 400,
        no_breach_cap: 150,
        wall_present: false,
        wall_ever_breached: false,
    };
    assert_eq!(
        ff_cap_step(&s, f64::NAN, 1.0),
        RoundCapStep::Finish(RoundCapVerdict::Attacker)
    );
    // Oblezenie bez wylomu z capem 1000: clamp do 400 w werdykcie.
    let s2 = RoundCapState {
        round_no: 400,
        no_breach_cap: 1000,
        wall_present: true,
        wall_ever_breached: false,
    };
    assert_eq!(
        ff_cap_step(&s2, 0.0, 0.0),
        RoundCapStep::Finish(RoundCapVerdict::Draw)
    );
}
