//! P6 SIEGE-TAKTYKA K5j: testy zgodności `domain::siege_tactics_fastforward` (`_runFastForward`) z kodem weba.
//!
//! Wektory: `p6_siege_tactics_fastforward_vectors/vectors.json`, generowane przez
//! `p6_siege_tactics_fastforward_gen.mjs` przez WYKONANIE tekstu pinu `gra/src/battle/battleScene.ts`
//! (pin 07d2fbd72): `_raf`, `_runFastForward` (z podmianą budżetu 40 ms na limit kroków), `_roundCapVerdict`,
//! `_ffRoundCapResult`, `_scaledWallDelta`, `_schedule`, `_drainTimers`, stałe 2552/2553/1125.
//! Każdy przypadek to stan początkowy i jedno lub więcej wywołań przewijania (klatek). Każde wywołanie ma
//! oczekiwany powód zakończenia, liczbę kroków, sekwencję zdarzeń i stan po wywołaniu.
//! Wartości nieskończone są w JSON jako napisy "NaN", "Infinity", "-Infinity".

use civ_engine::domain::siege_no_breach::RoundCapVerdict;
use civ_engine::domain::siege_tactics_clock::{ScheduleOutcome, Timer, VirtualClock};
use civ_engine::domain::siege_tactics_fastforward::{
    ff_step_ms, round_cap_verdict_step, run_fast_forward, FfEvent, FfHost, FfLoopState, FfStop,
};
use civ_engine::domain::siege_tactics_roundcap::RoundCapState;
use std::collections::{HashMap, HashSet};

const VECTORS: &str = include_str!("p6_siege_tactics_fastforward_vectors/vectors.json");
const MODULE_SRC: &str = include_str!("../src/domain/siege_tactics_fastforward.rs");

/// Liczba z JSON: zwykła liczba albo napis dla NaN/Infinity (generator).
fn num(v: &serde_json::Value) -> f64 {
    if let Some(x) = v.as_f64() {
        return x;
    }
    parse_f(v.as_str().expect("liczba lub napis"))
}

fn parse_f(s: &str) -> f64 {
    match s {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        other => other.parse().expect("liczba w napisie"),
    }
}

/// Porównanie jak w JS dla wektorów: `NaN` równe `NaN`, `-0` równe `0`.
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

/// Zdarzenie efektu sceny w postaci wektora (ta sama kolejność co `ev` w generatorze).
#[derive(Debug, Clone, Copy)]
enum Ev {
    Enter,
    Tp(f64),
    Tf(f64),
    Fire(u64),
    Q(u64),
    Draw,
    End(&'static str),
}

fn ev_same(a: &Ev, b: &Ev) -> bool {
    match (a, b) {
        (Ev::Enter, Ev::Enter) | (Ev::Draw, Ev::Draw) => true,
        (Ev::Tp(x), Ev::Tp(y)) | (Ev::Tf(x), Ev::Tf(y)) => same(*x, *y),
        (Ev::Fire(x), Ev::Fire(y)) | (Ev::Q(x), Ev::Q(y)) => x == y,
        (Ev::End(x), Ev::End(y)) => x == y,
        _ => false,
    }
}

fn parse_ev(v: &serde_json::Value) -> Ev {
    let s = v.as_str().expect("zdarzenie");
    let leak = |x: &str| -> &'static str { Box::leak(x.to_string().into_boxed_str()) };
    if s == "enter" {
        Ev::Enter
    } else if s == "draw" {
        Ev::Draw
    } else if let Some(x) = s.strip_prefix("tp:") {
        Ev::Tp(parse_f(x))
    } else if let Some(x) = s.strip_prefix("tf:") {
        Ev::Tf(parse_f(x))
    } else if let Some(x) = s.strip_prefix("fire:") {
        Ev::Fire(x.parse().unwrap())
    } else if let Some(x) = s.strip_prefix("q:") {
        Ev::Q(x.parse().unwrap())
    } else if let Some(x) = s.strip_prefix("end:") {
        Ev::End(leak(x))
    } else {
        panic!("nieznane zdarzenie {s}");
    }
}

/// Liczniki pokrycia gałęzi (zliczane z wykonań, nie z instrumentacji).
#[derive(Default, Debug)]
struct Cov {
    enter: u32,
    enter_blocked_by_busy: u32,
    timer_fired: u32,
    queue_run: u32,
    native_raf: u32,
    tp_steps: u32,
    draw: u32,
    attacker: u32,
    defender: u32,
    stop_finished: u32,
    stop_roundcap: u32,
    stop_steplimit: u32,
    roundcap_mid_run: u32,
    finished_mid_run: u32,
    zero_budget: u32,
    nan_step: u32,
}

/// Host: stuby efektów sceny z generatora, z tą samą logiką dzieci (`_child`) i sufitu tur (`_roundCapVerdict`).
struct Host {
    ff_active: bool,
    busy: bool,
    enter_busy: bool,
    round_no: i64,
    wall_present: bool,
    wall_ever_breached: bool,
    no_breach_cap: i64,
    ratio_a: f64,
    ratio_d: f64,
    round_inc: HashSet<u64>,
    spawn: HashMap<u64, Vec<(String, f64, u64)>>,
    finish_on: Option<u64>,
    ev: Vec<Ev>,
    native: Vec<u64>,
    end_winner: Option<&'static str>,
    cov: Cov,
}

impl Host {
    /// Web `_child(tok, tag)` z generatora: licznik tur, `finished` i dzieci (`s` = `_schedule`, `r` = `_raf`).
    fn spawn_children(
        &mut self,
        clock: &mut VirtualClock<u64>,
        st: &mut FfLoopState<u64>,
        tok: u64,
    ) {
        if self.round_inc.contains(&tok) {
            self.round_no += 1;
        }
        if self.finish_on == Some(tok) {
            clock.finished = true;
        }
        let kids = self.spawn.get(&tok).cloned().unwrap_or_default();
        for (kind, ms, child) in kids {
            if kind == "s" {
                let _: ScheduleOutcome<u64> = clock.schedule(ms, child, false);
            } else if self.ff_active {
                st.queue.push(child);
            } else {
                self.native.push(child);
                self.cov.native_raf += 1;
            }
        }
    }
}

impl FfHost<u64, u64> for Host {
    fn round_cap(
        &mut self,
        _clock: &VirtualClock<u64>,
        _st: &FfLoopState<u64>,
    ) -> Option<RoundCapVerdict> {
        let state = RoundCapState {
            round_no: self.round_no,
            no_breach_cap: self.no_breach_cap,
            wall_present: self.wall_present,
            wall_ever_breached: self.wall_ever_breached,
        };
        round_cap_verdict_step(&state, self.ratio_a, self.ratio_d)
    }

    fn busy(&self) -> bool {
        self.busy
    }

    fn event(
        &mut self,
        clock: &mut VirtualClock<u64>,
        st: &mut FfLoopState<u64>,
        ev: FfEvent<u64, u64>,
    ) {
        match ev {
            FfEvent::EnterAuto => {
                self.ev.push(Ev::Enter);
                self.cov.enter += 1;
                self.busy = self.enter_busy;
            }
            FfEvent::TimerFired(tok) => {
                self.ev.push(Ev::Fire(tok));
                self.cov.timer_fired += 1;
                self.spawn_children(clock, st, tok);
            }
            FfEvent::TickProjectiles(t) => {
                self.ev.push(Ev::Tp(t));
                self.cov.tp_steps += 1;
            }
            FfEvent::TickFades(t) => self.ev.push(Ev::Tf(t)),
            FfEvent::RunQueued(tok) => {
                self.ev.push(Ev::Q(tok));
                self.cov.queue_run += 1;
                self.spawn_children(clock, st, tok);
            }
            FfEvent::RoundCapResult(v) => {
                // Web `_ffRoundCapResult` (`battleScene.ts:9485-9497`): remis -> `_finishDraw`, inaczej koniec z zwycięzcą.
                match v {
                    RoundCapVerdict::Draw => {
                        self.ev.push(Ev::Draw);
                        self.cov.draw += 1;
                        self.end_winner = Some("remis");
                    }
                    RoundCapVerdict::Attacker => {
                        self.ev.push(Ev::End("atakujacy"));
                        self.cov.attacker += 1;
                        self.end_winner = Some("atakujacy");
                    }
                    RoundCapVerdict::Defender => {
                        self.ev.push(Ev::End("obronca"));
                        self.cov.defender += 1;
                        self.end_winner = Some("obronca");
                    }
                }
                clock.finished = true;
                self.ff_active = false;
                st.queue.clear();
            }
        }
    }
}

fn build_spawn(v: &serde_json::Value) -> HashMap<u64, Vec<(String, f64, u64)>> {
    let mut out = HashMap::new();
    for (k, arr) in v.as_object().expect("spawn") {
        let kids = arr
            .as_array()
            .unwrap()
            .iter()
            .map(|item| {
                (
                    item[0].as_str().unwrap().to_string(),
                    num(&item[1]),
                    item[2].as_u64().unwrap(),
                )
            })
            .collect();
        out.insert(k.parse().unwrap(), kids);
    }
    out
}

#[test]
fn fast_forward_matches_pin_vectors() {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cases = root["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 300,
        "wymagane >= 300 sekwencji, jest {}",
        cases.len()
    );

    let mut cov = Cov::default();
    let mut n_calls = 0usize;
    for (ci, case) in cases.iter().enumerate() {
        let init = &case["init"];
        let mut clock: VirtualClock<u64> = VirtualClock::new();
        clock.v_now = num(&init["vNow"]);
        clock.speed_mul = num(&init["speedMul"]);
        clock.finished = init["finished"].as_bool().unwrap();
        clock.timers = init["initTimers"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| Timer {
                due: num(&t[0]),
                id: t[1].as_u64().unwrap(),
                payload: t[2].as_u64().unwrap(),
            })
            .collect();
        clock.timer_seq = clock.timers.len() as u64;

        let mut st: FfLoopState<u64> = FfLoopState::new();
        st.ff_virtual_ms = num(&init["ffVirtualMs"]);
        st.queue = init["initQueue"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_u64().unwrap())
            .collect();

        let mut host = Host {
            ff_active: init["ffActive"].as_bool().unwrap(),
            busy: init["busy"].as_bool().unwrap(),
            enter_busy: init["enterBusy"].as_bool().unwrap(),
            round_no: init["roundNo"].as_i64().unwrap(),
            wall_present: init["wallCol"].as_i64().unwrap() >= 0,
            wall_ever_breached: init["wallEverBreached"].as_bool().unwrap(),
            no_breach_cap: init["noBreachCap"].as_i64().unwrap(),
            ratio_a: num(&init["ratioA"]),
            ratio_d: num(&init["ratioD"]),
            round_inc: init["roundInc"]
                .as_object()
                .unwrap()
                .keys()
                .map(|k| k.parse().unwrap())
                .collect(),
            spawn: build_spawn(&init["spawn"]),
            finish_on: init["finishOn"].as_u64(),
            ev: Vec::new(),
            native: Vec::new(),
            end_winner: None,
            cov: Cov::default(),
        };

        for call in case["calls"].as_array().unwrap() {
            n_calls += 1;
            let before = &call["before"];
            // Stan przed wywołaniem (zmiany między klatkami z generatora).
            clock.finished = before["finished"].as_bool().unwrap();
            st.pending_auto = before["pendingAuto"].as_bool().unwrap();
            host.busy = before["busy"].as_bool().unwrap();
            clock.speed_mul = num(&before["speed"]);

            if st.pending_auto && host.busy {
                host.cov.enter_blocked_by_busy += 1;
            }
            if clock.speed_mul.is_nan() {
                host.cov.nan_step += 1;
            }
            let max_steps = call["maxSteps"].as_u64().unwrap() as u32;
            if max_steps == 0 {
                host.cov.zero_budget += 1;
            }
            host.ev.clear();
            host.native.clear();

            let stop = run_fast_forward(&mut clock, &mut st, &mut host, max_steps);

            let label = format!("case {ci} call max={max_steps}");
            let stop_s = match stop {
                FfStop::Finished => "finished",
                FfStop::RoundCap(_) => "roundcap",
                FfStop::StepLimit => "steplimit",
            };
            assert_eq!(
                stop_s,
                call["stop"].as_str().unwrap(),
                "{label}: powód zakończenia"
            );
            let steps = host.ev.iter().filter(|e| matches!(e, Ev::Tp(_))).count();
            assert_eq!(
                steps as u64,
                call["steps"].as_u64().unwrap(),
                "{label}: liczba kroków"
            );

            let exp_ev: Vec<Ev> = call["events"]
                .as_array()
                .unwrap()
                .iter()
                .map(parse_ev)
                .collect();
            assert_eq!(host.ev.len(), exp_ev.len(), "{label}: liczba zdarzeń");
            for (i, (a, b)) in host.ev.iter().zip(exp_ev.iter()).enumerate() {
                assert!(ev_same(a, b), "{label}: zdarzenie {i}: {a:?} != {b:?}");
            }

            let e = &call["expect"];
            assert!(
                same(clock.v_now, num(&e["vNow"])),
                "{label}: vNow {} != {}",
                clock.v_now,
                num(&e["vNow"])
            );
            assert_eq!(
                clock.finished,
                e["finished"].as_bool().unwrap(),
                "{label}: finished"
            );
            assert!(
                same(st.ff_virtual_ms, num(&e["ffVirtualMs"])),
                "{label}: ffVirtualMs {} != {}",
                st.ff_virtual_ms,
                num(&e["ffVirtualMs"])
            );
            assert_eq!(
                st.pending_auto,
                e["pendingAuto"].as_bool().unwrap(),
                "{label}: pendingAuto"
            );
            assert_eq!(host.busy, e["busy"].as_bool().unwrap(), "{label}: busy");
            assert_eq!(
                host.round_no,
                e["roundNo"].as_i64().unwrap(),
                "{label}: roundNo"
            );
            assert_eq!(
                host.end_winner,
                e["endWinner"].as_str(),
                "{label}: endWinner"
            );
            let exp_q: Vec<u64> = e["queue"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_u64().unwrap())
                .collect();
            assert_eq!(st.queue, exp_q, "{label}: kolejka");
            let exp_p = e["pending"].as_array().unwrap();
            assert_eq!(clock.timers.len(), exp_p.len(), "{label}: liczba timerów");
            for (t, p) in clock.timers.iter().zip(exp_p.iter()) {
                assert!(
                    same(t.due, num(&p[0])),
                    "{label}: due {} != {}",
                    t.due,
                    num(&p[0])
                );
                assert_eq!(t.id, p[1].as_u64().unwrap(), "{label}: id");
                assert_eq!(t.payload, p[2].as_u64().unwrap(), "{label}: token");
            }
            let exp_n: Vec<u64> = e["nativeRaf"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_u64().unwrap())
                .collect();
            assert_eq!(host.native, exp_n, "{label}: nativeRaf");

            match stop {
                FfStop::Finished => cov.stop_finished += 1,
                FfStop::RoundCap(_) => cov.stop_roundcap += 1,
                FfStop::StepLimit => cov.stop_steplimit += 1,
            }
            if matches!(stop, FfStop::RoundCap(_)) && steps > 0 {
                cov.roundcap_mid_run += 1;
            }
            if matches!(stop, FfStop::Finished) && steps > 0 {
                cov.finished_mid_run += 1;
            }
            cov.enter += host.cov.enter;
            cov.enter_blocked_by_busy += host.cov.enter_blocked_by_busy;
            cov.timer_fired += host.cov.timer_fired;
            cov.queue_run += host.cov.queue_run;
            cov.native_raf += host.cov.native_raf;
            cov.tp_steps += host.cov.tp_steps;
            cov.draw += host.cov.draw;
            cov.attacker += host.cov.attacker;
            cov.defender += host.cov.defender;
            cov.zero_budget += host.cov.zero_budget;
            cov.nan_step += host.cov.nan_step;
            host.cov = Cov::default();
        }
    }

    eprintln!(
        "K5j pokrycie: sekwencje={} wywolania={} {:?}",
        cases.len(),
        n_calls,
        cov
    );
    assert!(
        cov.enter > 0 && cov.enter_blocked_by_busy > 0,
        "galaz EnterAuto / busy"
    );
    assert!(
        cov.timer_fired > 0 && cov.queue_run > 0 && cov.native_raf > 0,
        "galezie timerow, kolejki i natywnego rAF"
    );
    assert!(cov.tp_steps > 0, "krokow brak");
    assert!(
        cov.draw > 0 && cov.attacker > 0 && cov.defender > 0,
        "werdykty sufitu: remis/atakujacy/obronca"
    );
    assert!(
        cov.stop_finished > 0 && cov.stop_roundcap > 0 && cov.stop_steplimit > 0,
        "powody zakonczenia"
    );
    assert!(cov.roundcap_mid_run > 0, "sufit tur w trakcie przewijania");
    assert!(
        cov.finished_mid_run > 0,
        "koniec bitwy w trakcie przewijania"
    );
    assert!(cov.zero_budget > 0, "limit 0 krokow");
    assert!(cov.nan_step > 0, "NaN w kroku");
}

/// Kryterium (2): w module nie ma czasu ściennego ani zegara systemowego.
#[test]
fn module_has_no_wall_clock() {
    for forbidden in [
        "std::time",
        "Instant",
        "SystemTime",
        ".elapsed(",
        "Date.now",
    ] {
        assert!(
            !MODULE_SRC.contains(forbidden),
            "moduł zawiera zakazany element czasu: {forbidden}"
        );
    }
}

/// Krok wirtualny = `_scaledWallDelta(BATTLE_FRAME_WALL_MS)` = 16 * speedMul (web `FF_STEP_MS`, `battleScene.ts:9419`).
#[test]
fn step_is_scaled_frame() {
    let mut c: VirtualClock<u64> = VirtualClock::new();
    assert_eq!(ff_step_ms(&c), 16.0);
    c.speed_mul = 4.0;
    assert_eq!(ff_step_ms(&c), 64.0);
}
