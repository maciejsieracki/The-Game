//! P6 SIEGE-TAKTYKA K5e: testy zgodnosci `domain::siege_tactics_clock` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_siege_tactics_clock_vectors/vectors.json`, generowane przez
//! `p6_siege_tactics_siege_tactics_clock_gen.mjs` przez WYKONANIE tekstu pinu `gra/src/battle/battleScene.ts`
//! (pin 07d2fbd72): `_advanceVClock`, `_scaledWallDelta`, `_schedule`, `_drainTimers`, stala 2553.
//! Każdy przypadek to sekwencja operacji (`advance`, `schedule`, `drain`) z oczekiwanym stanem po każdej z nich:
//! `vNow`, `vLastWall`, `finished`, kolejność wykonanych callbackow (`fired`) i kolejka (`pending` = `[due, id, token]`).
//! Wartosci nieskonczone sa w JSON jako napisy "NaN", "Infinity", "-Infinity".

use civ_engine::domain::siege_tactics_clock::{ScheduleOutcome, VirtualClock};
use std::collections::HashMap;

const VECTORS: &str = include_str!("p6_siege_tactics_siege_tactics_clock_vectors/vectors.json");

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

/// Porownanie jak w JS dla wektorow: `NaN` rowne `NaN`, `-0` rowne `0`.
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

/// Kontekst przypadku: tabela potomkow (stub callbackow webu), token konca i zapis wykonanych callbackow.
struct Ctx {
    spawn: HashMap<u64, Vec<(f64, u64)>>,
    finish_on: Option<u64>,
    fired: Vec<u64>,
}

/// Odpowiednik stubu `fire(tok)` z generatora: zapis tokena, ewentualne `finished`, planowanie dzieci.
/// `planning` odzwierciedla `_autoBatchPlanning` ustawione w biezacej operacji (dzieci tez biegna synchronicznie).
fn fire(clock: &mut VirtualClock<u64>, tok: u64, ctx: &mut Ctx, planning: bool) {
    ctx.fired.push(tok);
    if ctx.finish_on == Some(tok) {
        clock.finished = true;
    }
    let kids = ctx.spawn.get(&tok).cloned().unwrap_or_default();
    for (ms, child) in kids {
        if let ScheduleOutcome::RunNow(t) = clock.schedule(ms, child, planning) {
            fire(clock, t, ctx, planning);
        }
    }
}

fn check_state(
    clock: &VirtualClock<u64>,
    ctx: &Ctx,
    expect: &serde_json::Value,
    fired_from: usize,
    label: &str,
) {
    let e_now = num(&expect["vNow"]);
    assert!(
        same(clock.v_now, e_now),
        "{label}: vNow {} != {}",
        clock.v_now,
        e_now
    );
    let e_last = num(&expect["vLastWall"]);
    assert!(
        same(clock.v_last_wall, e_last),
        "{label}: vLastWall {} != {}",
        clock.v_last_wall,
        e_last
    );
    assert_eq!(
        clock.finished,
        expect["finished"].as_bool().unwrap(),
        "{label}: finished"
    );
    let e_fired: Vec<u64> = expect["fired"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_u64().unwrap())
        .collect();
    assert_eq!(
        &ctx.fired[fired_from..],
        e_fired.as_slice(),
        "{label}: kolejnosc callbackow"
    );
    let e_pending = expect["pending"].as_array().unwrap();
    assert_eq!(
        clock.timers.len(),
        e_pending.len(),
        "{label}: liczba timerow w kolejce"
    );
    for (t, p) in clock.timers.iter().zip(e_pending.iter()) {
        let p = p.as_array().unwrap();
        assert!(
            same(t.due, num(&p[0])),
            "{label}: due {} != {}",
            t.due,
            num(&p[0])
        );
        assert_eq!(t.id, p[1].as_u64().unwrap(), "{label}: id");
        assert_eq!(t.payload, p[2].as_u64().unwrap(), "{label}: token");
    }
}

fn run_case(case: &serde_json::Value, idx: usize) -> usize {
    let init = &case["init"];
    let mut clock: VirtualClock<u64> = VirtualClock::new();
    clock.v_now = num(&init["vNow"]);
    clock.v_last_wall = num(&init["vLastWall"]);
    clock.speed_mul = num(&init["speedMul"]);
    clock.paused = init["paused"].as_bool().unwrap();
    clock.finished = init["finished"].as_bool().unwrap();
    let spawn: HashMap<u64, Vec<(f64, u64)>> = case["spawn"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| {
            let kids = v
                .as_array()
                .unwrap()
                .iter()
                .map(|p| (num(&p[0]), p[1].as_u64().unwrap()))
                .collect();
            (k.parse::<u64>().unwrap(), kids)
        })
        .collect();
    let finish_on = init["finishOn"].as_u64();
    let mut ctx = Ctx {
        spawn,
        finish_on,
        fired: Vec::new(),
    };

    let ops = case["ops"].as_array().unwrap();
    let expects = case["expect"].as_array().unwrap();
    assert_eq!(ops.len(), expects.len(), "przypadek #{idx}: ops/expect");
    for (i, (op, expect)) in ops.iter().zip(expects.iter()).enumerate() {
        let label = format!("przypadek #{idx} op {i}");
        let fired_from = ctx.fired.len();
        match op["op"].as_str().unwrap() {
            "advance" => {
                clock.paused = op["paused"].as_bool().unwrap();
                clock.speed_mul = num(&op["speedMul"]);
                clock.advance_v_clock(num(&op["wall"]));
            }
            "schedule" => {
                let planning = op["planning"].as_bool().unwrap();
                let tok = op["tok"].as_u64().unwrap();
                match clock.schedule(num(&op["ms"]), tok, planning) {
                    ScheduleOutcome::RunNow(t) => fire(&mut clock, t, &mut ctx, true),
                    ScheduleOutcome::Queued | ScheduleOutcome::Dropped => {}
                }
            }
            "drain" => {
                clock.drain_timers(|c, t| fire(c, t, &mut ctx, false));
            }
            other => panic!("nieznana operacja {other}"),
        }
        check_state(&clock, &ctx, expect, fired_from, &label);
    }
    ops.len()
}

#[test]
fn wektory_zegar_i_kolejka_zgodne_z_webem() {
    let v: serde_json::Value =
        serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em");
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 400, "wektory zegara: {}", cases.len());
    let mut ops_total = 0_usize;
    for (idx, case) in cases.iter().enumerate() {
        ops_total += run_case(case, idx);
    }
    assert!(ops_total >= 5000, "operacje: {ops_total}");
}

#[test]
fn wektory_pokrycie_scenariuszy_wpisane_przez_generator() {
    let v: serde_json::Value =
        serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em");
    let cov = v["coverageScenarios"]
        .as_object()
        .expect("coverageScenarios");
    for (name, count) in cov {
        assert!(
            count.as_u64().unwrap() > 0,
            "scenariusz bez pokrycia: {name}"
        );
    }
}

#[test]
fn advance_pierwsze_wywolanie_tylko_ustawia_referencje() {
    let mut c: VirtualClock<u64> = VirtualClock::new();
    c.advance_v_clock(500.0);
    assert_eq!(c.v_now, 0.0);
    assert_eq!(c.v_last_wall, 500.0);
    c.advance_v_clock(550.0);
    assert_eq!(c.v_now, 50.0);
}

#[test]
fn advance_clamp_delty_i_predkosc() {
    let mut c: VirtualClock<u64> = VirtualClock::new();
    c.v_last_wall = 1.0;
    c.speed_mul = 4.0;
    c.advance_v_clock(10_000.0);
    assert_eq!(c.v_now, 400.0, "delta ograniczona do 100 ms, razy 4");
    c.advance_v_clock(0.0);
    assert_eq!(c.v_now, 400.0, "ujemna delta -> 0");
}

#[test]
fn advance_na_pauzie_odswieza_referencje_bez_ruchu() {
    let mut c: VirtualClock<u64> = VirtualClock::new();
    c.v_last_wall = 1.0;
    c.paused = true;
    c.advance_v_clock(90.0);
    assert_eq!(c.v_now, 0.0);
    assert_eq!(c.v_last_wall, 90.0);
}

#[test]
fn schedule_kolejnosc_planowania_i_odrzucenie_po_finished() {
    let mut c: VirtualClock<&str> = VirtualClock::new();
    assert_eq!(c.schedule(-5.0, "a", false), ScheduleOutcome::Queued);
    assert_eq!(c.timers[0].due, 0.0, "ms ujemne -> due = vNow");
    assert_eq!(c.schedule(0.0, "b", true), ScheduleOutcome::RunNow("b"));
    c.finished = true;
    assert_eq!(c.schedule(10.0, "c", false), ScheduleOutcome::Dropped);
    assert_eq!(c.timers.len(), 1);
}

#[test]
fn drain_remis_due_rozstrzygany_po_id_i_finished_czysci() {
    let mut c: VirtualClock<u32> = VirtualClock::new();
    c.schedule(16.0, 1, false);
    c.schedule(16.0, 2, false);
    c.v_now = 16.0;
    let mut order = Vec::new();
    c.drain_timers(|_, t| order.push(t));
    assert_eq!(order, vec![1, 2]);

    c.schedule(0.0, 7, false);
    c.finished = true;
    let mut fired = 0;
    let n = c.drain_timers(|_, _| fired += 1);
    assert_eq!((n, fired, c.timers.len()), (0, 0, 0));
}
