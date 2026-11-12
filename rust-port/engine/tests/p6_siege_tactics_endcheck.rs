//! P6 SIEGE-TAKTYKA ENDCHECK (#217): testy zgodnosci `domain::siege_tactics_endcheck` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_endcheck_vectors/vectors.json`, generowane przez `p6_siege_tactics_endcheck_gen.mjs`
//! przez WYKONANIE tekstu pinu `gra/src/battle/battleScene.ts` (pin 07d2fbd72): `_updateStallWatch`, `_roundCapVerdict`,
//! `_checkEnd`, `_battleUnitsForMapExport`, stale i linia PAT (`battleScene.ts:10178-10182`).
//! Wartosci nieskonczone sa w JSON jako napisy "NaN", "Infinity", "-Infinity".

use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_endcheck::{
    end_check_order, stall_pat_loser, update_stall_watch, EndCheckInput, EndCheckOutcome,
    StallUnit, StallWatchState,
};

const VECTORS: &str = include_str!("p6_siege_tactics_endcheck_vectors/vectors.json");

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

fn nums(v: &serde_json::Value) -> Vec<f64> {
    v.as_array().expect("lista liczb").iter().map(num).collect()
}

fn outcome_name(o: EndCheckOutcome) -> &'static str {
    match o {
        EndCheckOutcome::Continue => "continue",
        EndCheckOutcome::Draw => "draw",
        EndCheckOutcome::Ended(BattleSide::Attacker) => "atakujacy",
        EndCheckOutcome::Ended(BattleSide::Defender) => "obronca",
    }
}

#[test]
fn wektory_stall_watch_zgodne_z_webem() {
    let v = load();
    let cases = v["stall"].as_array().expect("stall");
    assert!(cases.len() >= 400, "wektory stall: {}", cases.len());
    let mut stalled_seen = 0_usize;
    let mut nan_sig_seen = 0_usize;
    for (i, c) in cases.iter().enumerate() {
        let init = &c["initial"];
        let mut state = StallWatchState {
            sig: init["sig"].as_str().unwrap().to_string(),
            turns: init["turns"].as_u64().unwrap() as u32,
            stalled: init["stalled"].as_bool().unwrap(),
        };
        for (s_idx, step) in c["steps"].as_array().unwrap().iter().enumerate() {
            let units: Vec<StallUnit> = step["units"]
                .as_array()
                .unwrap()
                .iter()
                .map(|u| StallUnit {
                    hp: num(&u["hp"]),
                    morale: num(&u["morale"]),
                    out: u["out"].as_bool().unwrap(),
                })
                .collect();
            state = update_stall_watch(&state, step["isSiege"].as_bool().unwrap(), &units);
            let e = &step["expect"];
            assert_eq!(
                state.sig,
                e["sig"].as_str().unwrap(),
                "przypadek #{i} krok {s_idx}: sygnatura"
            );
            assert_eq!(
                state.turns as u64,
                e["turns"].as_u64().unwrap(),
                "przypadek #{i} krok {s_idx}: tury"
            );
            assert_eq!(
                state.stalled,
                e["stalled"].as_bool().unwrap(),
                "przypadek #{i} krok {s_idx}: stalled"
            );
            if state.stalled {
                stalled_seen += 1;
            }
            if state.sig.contains("NaN") {
                nan_sig_seen += 1;
            }
        }
    }
    assert!(stalled_seen > 0, "pokrycie: brak krokow ze stalled=true");
    assert!(nan_sig_seen > 0, "pokrycie: brak sygnatur NaN");
}

#[test]
fn wektory_stall_pat_loser_zgodne_z_webem() {
    let v = load();
    let cases = v["pat"].as_array().expect("pat");
    assert!(cases.len() >= 200, "wektory pat: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let ratio_a = num(&c["ratioA"]);
        let ratio_d = num(&c["ratioD"]);
        let got = match stall_pat_loser(ratio_a, ratio_d) {
            BattleSide::Attacker => "atakujacy",
            BattleSide::Defender => "obronca",
        };
        assert_eq!(
            got,
            c["expect"].as_str().unwrap(),
            "przypadek #{i}: ratioA={ratio_a} ratioD={ratio_d}"
        );
    }
}

#[test]
fn wektory_end_check_zgodne_z_webem() {
    let v = load();
    let cases = v["endCheck"].as_array().expect("endCheck");
    assert!(cases.len() >= 400, "wektory endCheck: {}", cases.len());
    let mut seen = std::collections::BTreeSet::new();
    for (i, c) in cases.iter().enumerate() {
        let hp_a = nums(&c["hpA"]);
        let hp_d = nums(&c["hpD"]);
        let input = EndCheckInput {
            stalled: c["stalled"].as_bool().unwrap(),
            alive_a: c["aliveA"].as_bool().unwrap(),
            alive_d: c["aliveD"].as_bool().unwrap(),
            is_siege: c["isSiege"].as_bool().unwrap(),
            wall_ever_breached: c["wallEverBreached"].as_bool().unwrap(),
            total_dead: c["totalDead"].as_u64().unwrap() as usize,
            ratio_a: num(&c["ratioA"]),
            ratio_d: num(&c["ratioD"]),
            ratio_a_at_cap: num(&c["ratioAAtCap"]),
            ratio_d_at_cap: num(&c["ratioDAtCap"]),
            round_no: c["roundNo"].as_i64().unwrap(),
            no_breach_cap: c["noBreachCap"].as_i64().unwrap(),
            hp_a: &hp_a,
            hp_d: &hp_d,
        };
        let got = outcome_name(end_check_order(&input));
        let expect = c["expect"].as_str().unwrap();
        assert_eq!(got, expect, "przypadek #{i}: {input:?}");
        seen.insert(expect);
    }
    for want in ["continue", "draw", "atakujacy", "obronca"] {
        assert!(seen.contains(want), "pokrycie wyniku: brak '{want}'");
    }
}

/// Dispatch kryterium (2): `siege_no_breach_repels_attack` tylko wewnatrz `_stalled && alive_a && alive_d`.
/// Oblezenie bez wylomu, sufit tur nieosiagniety, `stalled=false`: bitwa trwa (bez odparcia).
#[test]
fn oblezenie_bez_stall_nie_odpiera_szturmu() {
    let hp = [10.0_f64];
    let base = EndCheckInput {
        stalled: false,
        alive_a: true,
        alive_d: true,
        is_siege: true,
        wall_ever_breached: false,
        total_dead: 0,
        ratio_a: 1.0,
        ratio_d: 1.0,
        ratio_a_at_cap: 1.0,
        ratio_d_at_cap: 1.0,
        round_no: 1,
        no_breach_cap: 150,
        hp_a: &hp,
        hp_d: &hp,
    };
    assert_eq!(end_check_order(&base), EndCheckOutcome::Continue);
    // Te same dane z stalled=true: odparcie (aliveA=false), obronca wygrywa.
    let stalled = EndCheckInput {
        stalled: true,
        ..base
    };
    assert_eq!(
        end_check_order(&stalled),
        EndCheckOutcome::Ended(BattleSide::Defender)
    );
}

/// Oblezenie bez wylomu po sufitcie tur -> remis (web `winner: 'remis'`).
#[test]
fn oblezenie_bez_wylomu_po_suficie_remis() {
    let hp = [10.0_f64];
    let input = EndCheckInput {
        stalled: false,
        alive_a: true,
        alive_d: true,
        is_siege: true,
        wall_ever_breached: false,
        total_dead: 0,
        ratio_a: 1.0,
        ratio_d: 1.0,
        ratio_a_at_cap: 1.0,
        ratio_d_at_cap: 1.0,
        round_no: 150,
        no_breach_cap: 150,
        hp_a: &hp,
        hp_d: &hp,
    };
    assert_eq!(end_check_order(&input), EndCheckOutcome::Draw);
}

/// Gałąź PAT: `stalled`, bez oblezenia, z martwymi -> przegrywa wg morale (atakujacy przy ratioA <= ratioD).
#[test]
fn pat_bez_oblezenia_rozstrzyga_morale() {
    let hp = [10.0_f64];
    let mut input = EndCheckInput {
        stalled: true,
        alive_a: true,
        alive_d: true,
        is_siege: false,
        wall_ever_breached: false,
        total_dead: 1,
        ratio_a: 0.5,
        ratio_d: 0.8,
        ratio_a_at_cap: 0.5,
        ratio_d_at_cap: 0.8,
        round_no: 1,
        no_breach_cap: 150,
        hp_a: &hp,
        hp_d: &hp,
    };
    assert_eq!(
        end_check_order(&input),
        EndCheckOutcome::Ended(BattleSide::Defender)
    );
    input.ratio_a = 0.9;
    assert_eq!(
        end_check_order(&input),
        EndCheckOutcome::Ended(BattleSide::Attacker)
    );
    // Bez martwych: PAT nie stosowany, bitwa trwa.
    input.total_dead = 0;
    assert_eq!(end_check_order(&input), EndCheckOutcome::Continue);
}

/// Morale zalamane (ratio < 0.25) rozstrzyga przed sufitem tur, tez gdy obie strony zyja.
#[test]
fn morale_zalamane_przed_sufitem_tur() {
    let hp = [10.0_f64];
    let input = EndCheckInput {
        stalled: false,
        alive_a: true,
        alive_d: true,
        is_siege: false,
        wall_ever_breached: false,
        total_dead: 0,
        ratio_a: 0.1,
        ratio_d: 0.9,
        ratio_a_at_cap: 0.1,
        ratio_d_at_cap: 0.9,
        round_no: 500,
        no_breach_cap: 150,
        hp_a: &hp,
        hp_d: &hp,
    };
    assert_eq!(
        end_check_order(&input),
        EndCheckOutcome::Ended(BattleSide::Defender)
    );
}

/// NaN w ratio: `NaN < 0.25` = false (brak zalamania), PAT: `NaN <= x` = false -> obronca przegrywa (aliveD=false).
#[test]
fn nan_ratio_jak_web() {
    assert_eq!(stall_pat_loser(f64::NAN, 0.5), BattleSide::Defender);
    assert_eq!(stall_pat_loser(0.5, f64::NAN), BattleSide::Defender);
    let hp = [10.0_f64];
    let input = EndCheckInput {
        stalled: false,
        alive_a: true,
        alive_d: true,
        is_siege: false,
        wall_ever_breached: false,
        total_dead: 0,
        ratio_a: f64::NAN,
        ratio_d: f64::NAN,
        ratio_a_at_cap: f64::NAN,
        ratio_d_at_cap: f64::NAN,
        round_no: 400,
        no_breach_cap: 150,
        hp_a: &hp,
        hp_d: &hp,
    };
    // Sufit 400: NaN <= NaN = false -> aliveD=false -> atakujacy.
    assert_eq!(
        end_check_order(&input),
        EndCheckOutcome::Ended(BattleSide::Attacker)
    );
}

#[test]
fn watchdog_zlicza_i_ustawia_stalled_po_progu() {
    let units = [StallUnit {
        hp: 10.0,
        morale: 5.0,
        out: false,
    }];
    let mut st = StallWatchState::default();
    for _ in 0..6 {
        st = update_stall_watch(&st, false, &units);
    }
    // Pierwszy krok ustawia sygnature (turns=0), kolejne 5 zwieksza do 5 -> jeszcze nie stalled.
    assert_eq!(st.turns, 5);
    assert!(!st.stalled);
    st = update_stall_watch(&st, false, &units);
    assert!(st.stalled);
    // Tryb oblezenia: stan bez zmian.
    let before = st.clone();
    assert_eq!(update_stall_watch(&st, true, &[]), before);
}
