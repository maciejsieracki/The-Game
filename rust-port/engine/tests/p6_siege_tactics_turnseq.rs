//! P6 SIEGE-TAKTYKA K5F (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5F-Q1): port `_beginTurn` i `_activateNext`
//! (sekwencja tury) z wektorami wykonanymi z tekstu pinu `07d2fbd72`.
//!
//! Wektory: `p6_siege_tactics_turnseq_vectors/vectors.json`, generowane przez `p6_siege_tactics_turnseq_gen.mjs`.
//! Kazda sekwencja to stan poczatkowy + lista operacji (`begin` = `_beginTurn`, `activate` = `_activateNext`,
//! `done` = callback `_activateUnit`). Dla kazdej operacji porownujemy slad zdarzen z pinu (w tym wywolania `_checkEnd`
//! z ich miejscem i wynikiem, liczonym przez `end_check_order`) oraz stan jednostek, kolejki i flag.

use std::collections::{BTreeMap, BTreeSet, VecDeque};

use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_endcheck::EndCheckOutcome;
use civ_engine::domain::siege_tactics_turnseq::{
    activate_next, activation_done, begin_turn, CheckSite, EndCheckSnapshot, SeqEvent, SeqStep,
    SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef,
};
use civ_engine::domain::siege_tactics_unit::{side_alive_end, CombatUnit};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_siege_tactics_turnseq_vectors/vectors.json");

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("niepoprawna liczba {s}")),
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn flag(v: &Value) -> bool {
    v.as_bool().expect("wartosc logiczna")
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("nieznana strona {other}"),
    }
}

fn side_str(s: BattleSide) -> &'static str {
    match s {
        BattleSide::Attacker => "atk",
        BattleSide::Defender => "def",
    }
}

fn side_ix(s: BattleSide) -> usize {
    match s {
        BattleSide::Attacker => 0,
        BattleSide::Defender => 1,
    }
}

/// Znacznik jednostki z wektorow, np. `atk#2`.
fn parse_ref(tag: &str) -> UnitRef {
    let (s, i) = tag.split_once('#').expect("znacznik jednostki");
    UnitRef {
        side: side_of(s),
        idx: i.parse().expect("indeks"),
    }
}

fn tag_of(r: UnitRef) -> String {
    format!("{}#{}", side_str(r.side), r.idx)
}

fn unit_from(v: &Value) -> SeqUnit {
    SeqUnit {
        id: v["id"].as_u64().expect("id"),
        c: CombatUnit {
            hp: num(&v["hp"]),
            morale: num(&v["morale"]),
            flee_morale: num(&v["fleeMorale"]),
            move_left: num(&v["moveLeft"]),
            never_rout: flag(&v["neverRout"]),
            dead: flag(&v["dead"]),
            fading_out: flag(&v["fadingOut"]),
            routed: flag(&v["routed"]),
            removed: flag(&v["removed"]),
            acted: flag(&v["acted"]),
        },
    }
}

fn units_of(v: &Value) -> Vec<&Value> {
    v.as_array().expect("tablica jednostek").iter().collect()
}

/// Srodowisko sekwencji: odczyty ze sceny odtwarzane z wektorow (mp, flagi gracza, wejscia `_checkEnd` i wieze per operacja).
struct SeqEnv {
    mp: [Vec<f64>; 2],
    idle: [Vec<bool>; 2],
    snaps: VecDeque<Value>,
    tower: Option<UnitRef>,
}

impl SeqEnv {
    fn from_init(init: &Value) -> Self {
        let atk = units_of(&init["atk"]);
        let def = units_of(&init["def"]);
        let per_side = |us: &[&Value]| -> (Vec<f64>, Vec<bool>) {
            let mp = us.iter().map(|u| num(&u["mp"])).collect();
            let idle = us
                .iter()
                .map(|u| flag(&u["playerNone"]) && !flag(&u["doctrine"]))
                .collect();
            (mp, idle)
        };
        let (mp_a, idle_a) = per_side(&atk);
        let (mp_d, idle_d) = per_side(&def);
        SeqEnv {
            mp: [mp_a, mp_d],
            idle: [idle_a, idle_d],
            snaps: VecDeque::new(),
            tower: None,
        }
    }
}

impl TurnSeqEnv for SeqEnv {
    fn end_check_snapshot(&mut self, site: CheckSite, st: &TurnSeqState) -> EndCheckSnapshot {
        let v = self
            .snaps
            .pop_front()
            .expect("zabraklo wejsc _checkEnd z pinu");
        let want_site = match site {
            CheckSite::BeginTurn => "begin",
            CheckSite::ActivateNext => "activate",
        };
        assert_eq!(
            v["site"].as_str().expect("site"),
            want_site,
            "miejsce wywolania _checkEnd"
        );

        // Flagi zycia i totalDead liczone z jednostek jak w webie (przed blokiem stall) musza zgadzac sie z pinem.
        let atk: Vec<CombatUnit> = st.atk.iter().map(|u| u.c).collect();
        let def: Vec<CombatUnit> = st.def.iter().map(|u| u.c).collect();
        let alive_a = side_alive_end(&atk);
        let alive_d = side_alive_end(&def);
        assert_eq!(alive_a, flag(&v["aliveA"]), "aliveA z jednostek");
        assert_eq!(alive_d, flag(&v["aliveD"]), "aliveD z jednostek");
        let total_dead = atk.iter().chain(def.iter()).filter(|u| u.dead).count();
        assert_eq!(
            total_dead as u64,
            v["totalDead"].as_u64().expect("totalDead"),
            "totalDead"
        );
        let is_siege = st.siege_wall_col >= 0;
        assert_eq!(is_siege, flag(&v["isSiege"]), "isSiege");
        // roundNo przekazany do _checkEnd musi byc tym, ktory sekwencja trzyma w stanie w tym miejscu.
        let round_in_check = v["roundNo"].as_i64().expect("roundNo");
        assert_eq!(
            st.round_no, round_in_check,
            "roundNo w _checkEnd: stan != wektor"
        );

        EndCheckSnapshot {
            stalled: flag(&v["stalled"]),
            alive_a,
            alive_d,
            is_siege,
            wall_ever_breached: flag(&v["wallEverBreached"]),
            total_dead,
            ratio_a: num(&v["ratioA"]),
            ratio_d: num(&v["ratioD"]),
            ratio_a_at_cap: num(&v["ratioAAtCap"]),
            ratio_d_at_cap: num(&v["ratioDAtCap"]),
            round_no: v["roundNo"].as_i64().expect("roundNo"),
            no_breach_cap: v["noBreachCap"].as_i64().expect("noBreachCap"),
            hp_a: v["hpA"].as_array().expect("hpA").iter().map(num).collect(),
            hp_d: v["hpD"].as_array().expect("hpD").iter().map(num).collect(),
        }
    }

    fn movement_points(&mut self, unit: UnitRef, _st: &TurnSeqState) -> f64 {
        self.mp[side_ix(unit.side)][unit.idx]
    }

    fn fire_siege_towers(&mut self, st: &mut TurnSeqState) {
        if let Some(r) = self.tower {
            match r.side {
                BattleSide::Attacker => st.atk[r.idx].c.dead = true,
                BattleSide::Defender => st.def[r.idx].c.dead = true,
            }
        }
    }

    fn player_unit_idle(&mut self, unit: UnitRef, _st: &TurnSeqState) -> bool {
        self.idle[side_ix(unit.side)][unit.idx]
    }
}

fn build_state(init: &Value) -> TurnSeqState {
    let queued: BTreeSet<u64> = init["queued"]
        .as_array()
        .expect("queued")
        .iter()
        .map(|x| x.as_u64().expect("id kolejki"))
        .collect();
    TurnSeqState {
        atk: units_of(&init["atk"]).into_iter().map(unit_from).collect(),
        def: units_of(&init["def"]).into_iter().map(unit_from).collect(),
        turn_order: init["turnOrder"]
            .as_array()
            .expect("turnOrder")
            .iter()
            .map(|t| parse_ref(t.as_str().expect("znacznik")))
            .collect(),
        turn_idx: init["turnIdx"].as_u64().expect("turnIdx") as usize,
        round_no: init["roundNo"].as_i64().expect("roundNo"),
        siege_wall_col: init["siegeWallCol"].as_i64().expect("siegeWallCol"),
        manual_mode: flag(&init["manual"]),
        player_side: side_of(init["player"].as_str().expect("player")),
        finished: flag(&init["finished"]),
        awaiting_orders: flag(&init["awaiting"]),
        auto_battle_suspended: flag(&init["suspended"]),
        busy: flag(&init["busy"]),
        auto_batch_planning: flag(&init["planning"]),
        queued_order_ids: queued,
    }
}

fn outcome_str(o: EndCheckOutcome) -> &'static str {
    match o {
        EndCheckOutcome::Continue => "continue",
        EndCheckOutcome::Draw => "draw",
        EndCheckOutcome::Ended(BattleSide::Attacker) => "ended:atk",
        EndCheckOutcome::Ended(BattleSide::Defender) => "ended:def",
    }
}

fn trace_of(e: &SeqEvent) -> String {
    match e {
        SeqEvent::CounterBudgetBeginTurn => "counter".to_string(),
        SeqEvent::FireSiegeTowers => "towers".to_string(),
        SeqEvent::SetHint { round_no } => format!("hint:{round_no}"),
        SeqEvent::Banner { active: None } => "banner:none".to_string(),
        SeqEvent::Banner { active: Some(r) } => format!("banner:{}", tag_of(*r)),
        SeqEvent::BeginAutoBatchPhase { side, units } => format!(
            "auto:{}:{}",
            side_str(*side),
            units
                .iter()
                .map(|r| tag_of(*r))
                .collect::<Vec<_>>()
                .join(",")
        ),
        SeqEvent::EndCheck { site, outcome } => {
            let s = match site {
                CheckSite::BeginTurn => "begin",
                CheckSite::ActivateNext => "activate",
            };
            format!("check:{s}:{}", outcome_str(*outcome))
        }
        SeqEvent::ActivateUnit(r) => format!("activate:{}", tag_of(*r)),
        SeqEvent::RefreshQueuedVisuals => "refreshQ".to_string(),
        SeqEvent::Schedule { ms, step, planning } => {
            let st = match step {
                SeqStep::BeginTurn => "begin",
                SeqStep::ActivateNext => "act",
            };
            format!("sched:{ms}:{st}:{}", if *planning { "plan" } else { "q" })
        }
    }
}

/// Tryb planowania AUTO: `_schedule` wykonuje callback od razu (web `_autoBatchPlanning`). Zdarzenie `Schedule` jest zawsze
/// ostatnim zdarzeniem swojej funkcji, wiec zagniezdone zdarzenia dopisujemy na koncu.
fn run_planning(st: &mut TurnSeqState, env: &mut SeqEnv, events: &mut Vec<SeqEvent>) {
    let mut i = 0;
    while i < events.len() {
        let planned = match &events[i] {
            SeqEvent::Schedule {
                step,
                planning: true,
                ..
            } => Some(*step),
            _ => None,
        };
        if let Some(step) = planned {
            let mut nested = Vec::new();
            match step {
                SeqStep::BeginTurn => begin_turn(st, env, &mut nested),
                SeqStep::ActivateNext => activate_next(st, env, &mut nested),
            }
            events.extend(nested);
        }
        i += 1;
    }
}

fn assert_units(got: &[SeqUnit], want: &Value, side: &str, ctx: &str) {
    let want = units_of(want);
    assert_eq!(got.len(), want.len(), "{ctx}: liczba jednostek {side}");
    for (i, (g, w)) in got.iter().zip(want.iter()).enumerate() {
        assert_eq!(g.id, w["id"].as_u64().expect("id"), "{ctx}: id {side}#{i}");
        assert_eq!(g.c.acted, flag(&w["acted"]), "{ctx}: acted {side}#{i}");
        assert_eq!(g.c.dead, flag(&w["dead"]), "{ctx}: dead {side}#{i}");
        assert_eq!(
            g.c.fading_out,
            flag(&w["fadingOut"]),
            "{ctx}: fadingOut {side}#{i}"
        );
        assert_eq!(g.c.routed, flag(&w["routed"]), "{ctx}: routed {side}#{i}");
        assert_eq!(
            g.c.removed,
            flag(&w["removed"]),
            "{ctx}: removed {side}#{i}"
        );
        assert!(
            same(g.c.hp, num(&w["hp"])),
            "{ctx}: hp {side}#{i}: {} != {}",
            g.c.hp,
            num(&w["hp"])
        );
        assert!(
            same(g.c.move_left, num(&w["moveLeft"])),
            "{ctx}: moveLeft {side}#{i}: {} != {}",
            g.c.move_left,
            num(&w["moveLeft"])
        );
    }
}

#[test]
fn turnseq_matches_pin_sequences() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em");
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(
        seqs.len() >= 300,
        "wymagane >= 300 sekwencji, jest {}",
        seqs.len()
    );

    let mut coverage: BTreeMap<String, usize> = BTreeMap::new();
    let mut nonfinite_inputs = 0usize;
    let mut total_ops = 0usize;

    for (si, seq) in seqs.iter().enumerate() {
        let init = &seq["initial"];
        for u in units_of(&init["atk"])
            .into_iter()
            .chain(units_of(&init["def"]))
        {
            if u["hp"].is_string() || u["mp"].is_string() {
                nonfinite_inputs += 1;
            }
        }
        let mut st = build_state(init);
        let mut env = SeqEnv::from_init(init);
        let mut pending: Option<UnitRef> = None;

        for (oi, op) in seq["ops"].as_array().expect("ops").iter().enumerate() {
            total_ops += 1;
            let name = op["op"].as_str().expect("op");
            let ctx = format!("seq {si} op {oi} ({name})");
            env.snaps = op["checks"]
                .as_array()
                .expect("checks")
                .iter()
                .cloned()
                .collect();
            env.tower = op["towerKill"].as_str().map(parse_ref);

            let mut events: Vec<SeqEvent> = Vec::new();
            match name {
                "begin" => begin_turn(&mut st, &mut env, &mut events),
                "activate" => activate_next(&mut st, &mut env, &mut events),
                "done" => {
                    let r = pending.take().expect("callback _activateUnit musi czekac");
                    activation_done(&mut st, &mut env, r, &mut events);
                }
                other => panic!("nieznana operacja {other}"),
            }
            run_planning(&mut st, &mut env, &mut events);
            assert!(
                env.snaps.is_empty(),
                "{ctx}: nie wszystkie wejscia _checkEnd zuzyte"
            );
            pending = events.iter().rev().find_map(|e| match e {
                SeqEvent::ActivateUnit(r) => Some(*r),
                _ => None,
            });

            let got: Vec<String> = events.iter().map(trace_of).collect();
            let want: Vec<String> = op["trace"]
                .as_array()
                .expect("trace")
                .iter()
                .map(|t| t.as_str().expect("token").to_string())
                .collect();
            assert_eq!(got, want, "{ctx}: slad zdarzen");

            for t in &want {
                let key =
                    if t.starts_with("check:") || t.starts_with("sched:") || t.starts_with("auto:")
                    {
                        t.clone()
                    } else {
                        t.split(':').next().unwrap_or("").to_string()
                    };
                *coverage.entry(key).or_insert(0) += 1;
            }

            let want_state = &op["state"];
            assert_units(&st.atk, &want_state["atk"], "atk", &ctx);
            assert_units(&st.def, &want_state["def"], "def", &ctx);
            let got_order: Vec<String> = st.turn_order.iter().map(|r| tag_of(*r)).collect();
            let want_order: Vec<String> = want_state["turnOrder"]
                .as_array()
                .expect("turnOrder")
                .iter()
                .map(|t| t.as_str().expect("znacznik").to_string())
                .collect();
            assert_eq!(got_order, want_order, "{ctx}: turnOrder");
            assert_eq!(
                st.turn_idx as u64,
                want_state["turnIdx"].as_u64().expect("turnIdx"),
                "{ctx}: turnIdx"
            );
            assert_eq!(
                st.round_no,
                want_state["roundNo"].as_i64().expect("roundNo"),
                "{ctx}: roundNo"
            );
            assert_eq!(
                st.finished,
                flag(&want_state["finished"]),
                "{ctx}: finished"
            );
            assert_eq!(st.busy, flag(&want_state["busy"]), "{ctx}: busy");
            let got_queued: Vec<u64> = st.queued_order_ids.iter().copied().collect();
            let want_queued: Vec<u64> = want_state["queued"]
                .as_array()
                .expect("queued")
                .iter()
                .map(|x| x.as_u64().expect("id"))
                .collect();
            assert_eq!(got_queued, want_queued, "{ctx}: queued");
        }
    }

    // Pokrycie galezi: kazda istotna galez sekwencji wystepuje w wektorach.
    let required = [
        "counter",
        "towers",
        "auto:atk:",
        "refreshQ",
        "banner",
        "activate",
        "hint",
        "sched:240:begin:q",
        "sched:160:act:q",
        "check:begin:continue",
        "check:activate:continue",
        "check:begin:draw",
        "check:activate:draw",
        "check:begin:ended:atk",
        "check:begin:ended:def",
        "check:activate:ended:atk",
        "check:activate:ended:def",
    ];
    for key in required {
        let hits: usize = coverage
            .iter()
            .filter(|(k, _)| k.as_str() == key || (key.ends_with(':') && k.starts_with(key)))
            .map(|(_, n)| *n)
            .sum();
        assert!(hits > 0, "brak pokrycia galezi: {key}");
    }
    let planning_hits: usize = coverage
        .iter()
        .filter(|(k, _)| k.ends_with(":plan"))
        .map(|(_, n)| *n)
        .sum();
    assert!(planning_hits > 0, "brak pokrycia galezi planowania AUTO");
    assert!(nonfinite_inputs > 0, "brak wartosci NaN/Inf w wejsciach");
    assert!(total_ops >= 3000, "za malo operacji: {total_ops}");
}
