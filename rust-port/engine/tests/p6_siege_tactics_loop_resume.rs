//! P6 SIEGE-TAKTYKA K5-LOOP-RESUME (dispatch R-RUSTPORT-P6-K5-LOOP-RESUME-Q1): wznowienie przewijania
//! `SiegeLoop::resume` z malym `max_steps` daje bit-w-bit ten sam stan koncowy i slad aktywacji co jedno `run`
//! z duzym limitem (test niezaleznosci od podzialu na kroki). Zegar scienny (40 ms na pin, 10 ms na odczyt) nie jest
//! modelowany: budzet to jawny `max_steps`.
//!
//! Wektory: `p6_siege_tactics_loop_vectors/vectors.json` (generator pinu `p6_siege_tactics_loop_gen.mjs`), te same
//! co w `p6_siege_tactics_loop.rs`; uzywane sa pierwsze 60 sekwencji. Helpery (cialo skryptowe, budowa stanu) sa
//! powielone z tamtego pliku, bo testy integracyjne Cargo nie wspoldziela modulow.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_fastforward::FfStop;
use civ_engine::domain::siege_tactics_loop::{LoopBody, LoopTimer, SiegeEnv, SiegeLoop};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_siege_tactics_loop_vectors/vectors.json");

/// Liczba sekwencji z pinu uzytych w tescie wznowien (wymog dispatchu: >= 50).
const RESUME_SEQS: usize = 60;
/// Budzety krokow na wywolanie `resume` (dispatch: 1, 7, 50).
const BUDGETS: [u32; 3] = [1, 7, 50];

#[derive(Debug, Clone, Copy, PartialEq)]
enum Eff {
    Nop,
    Kill,
    Hurt,
}

/// Cialo jednostki z wektora: czas trwania animacji i efekt w chwili zakonczenia (stub zewnetrzny).
struct ScriptedBody {
    /// [strona][jednostka] -> (czas ms, efekt)
    specs: [Vec<(f64, Eff)>; 2],
}

fn side_ix(side: BattleSide) -> usize {
    match side {
        BattleSide::Attacker => 0,
        BattleSide::Defender => 1,
    }
}

impl LoopBody for ScriptedBody {
    fn start(&mut self, unit: UnitRef, _st: &TurnSeqState) -> f64 {
        self.specs[side_ix(unit.side)][unit.idx].0
    }

    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState) {
        let eff = self.specs[side_ix(unit.side)][unit.idx].1;
        let c: &mut CombatUnit = match unit.side {
            BattleSide::Attacker => &mut st.atk[unit.idx].c,
            BattleSide::Defender => &mut st.def[unit.idx].c,
        };
        match eff {
            Eff::Nop => {}
            Eff::Kill => {
                c.dead = true;
                c.hp = 0.0;
            }
            Eff::Hurt => {
                c.hp = (c.hp - 30.0).max(0.0);
                c.morale = (c.morale - 40.0).max(0.0);
            }
        }
    }
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn eff_of(s: &str) -> Eff {
    match s {
        "nop" => Eff::Nop,
        "kill" => Eff::Kill,
        "hurt" => Eff::Hurt,
        other => panic!("nieznany efekt {other}"),
    }
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("nieznana strona {other}"),
    }
}

fn unit_of(u: &Value) -> (SeqUnit, (f64, Eff), f64) {
    let hp = num(&u["hp"]);
    let c = CombatUnit {
        hp,
        morale: num(&u["morale"]),
        flee_morale: 0.0,
        move_left: num(&u["ml"]),
        never_rout: false,
        dead: false,
        fading_out: u["fadingOut"].as_bool().unwrap_or(false),
        routed: u["routed"].as_bool().unwrap_or(false),
        removed: u["removed"].as_bool().unwrap_or(false),
        acted: false,
    };
    let spec = (num(&u["dur"]), eff_of(u["eff"].as_str().expect("eff")));
    (SeqUnit { id: 0, c }, spec, num(&u["moraleMax"]))
}

struct Built {
    sl: SiegeLoop<ScriptedBody>,
    clock: VirtualClock<LoopTimer>,
}

fn build(spec: &Value) -> Built {
    let mut atk = Vec::new();
    let mut def = Vec::new();
    let mut atk_spec = Vec::new();
    let mut def_spec = Vec::new();
    let mut atk_max = Vec::new();
    let mut def_max = Vec::new();
    let mut atk_mp = Vec::new();
    let mut def_mp = Vec::new();
    for (i, u) in spec["atk"].as_array().expect("atk").iter().enumerate() {
        let (mut su, sp, mx) = unit_of(u);
        su.id = i as u64;
        atk.push(su);
        atk_spec.push(sp);
        atk_max.push(mx);
        atk_mp.push(num(&u["mp"]));
    }
    for (i, u) in spec["def"].as_array().expect("def").iter().enumerate() {
        let (mut su, sp, mx) = unit_of(u);
        su.id = 100 + i as u64;
        def.push(su);
        def_spec.push(sp);
        def_max.push(mx);
        def_mp.push(num(&u["mp"]));
    }
    let tower = match &spec["tower"] {
        Value::Null => None,
        t => Some(UnitRef {
            side: side_of(t["side"].as_str().expect("side")),
            idx: t["idx"].as_u64().expect("idx") as usize,
        }),
    };
    let st = TurnSeqState {
        atk,
        def,
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: spec["wallCol"].as_i64().expect("wallCol"),
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    let env = SiegeEnv {
        body: ScriptedBody {
            specs: [atk_spec, def_spec],
        },
        tower,
        wall_ever_breached: spec["wallBreached"].as_bool().expect("wallBreached"),
        no_breach_cap: spec["noBreachCap"].as_i64().expect("noBreachCap"),
        move_points: [atk_mp, def_mp],
        morale_max: [atk_max, def_max],
    };
    let mut clock = VirtualClock::<LoopTimer>::new();
    clock.speed_mul = num(&spec["speed"]);
    Built {
        sl: SiegeLoop::new(st, env),
        clock,
    }
}

/// Pelny stan obserwowalny bitwy po zakonczeniu: slad, zwyciezca, tury, czas wirtualny i jednostki.
#[derive(Debug, PartialEq)]
struct Fingerprint {
    trace: Vec<String>,
    winner: Option<&'static str>,
    finished: bool,
    round_no: i64,
    v_now: f64,
    unsupported: Option<&'static str>,
    units: Vec<(bool, bool, f64, f64)>,
    /// Stan przewijania zachowany między wywołaniami `resume` (`ffVirtualMs`, `ffPendingAuto`, długość kolejki).
    ff_virtual_ms: f64,
    ff_pending_auto: bool,
    ff_queue_len: usize,
}

fn fingerprint(b: &Built) -> Fingerprint {
    let all: Vec<&SeqUnit> = b.sl.st.atk.iter().chain(b.sl.st.def.iter()).collect();
    let units: Vec<(bool, bool, f64, f64)> = all
        .iter()
        .map(|u| (u.c.dead, u.c.acted, u.c.hp, u.c.morale))
        .collect();
    Fingerprint {
        trace: b.sl.trace.clone(),
        winner: b.sl.winner_label(),
        finished: b.sl.st.finished,
        round_no: b.sl.st.round_no,
        v_now: b.clock.v_now,
        unsupported: b.sl.unsupported,
        units,
        ff_virtual_ms: b.sl.ff_state().ff_virtual_ms,
        ff_pending_auto: b.sl.ff_state().pending_auto,
        ff_queue_len: b.sl.ff_state().queue.len(),
    }
}

#[test]
fn p6_siege_tactics_loop_resume_matches_single_run_for_any_step_split() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(
        seqs.len() >= RESUME_SEQS,
        "wymagane >= {RESUME_SEQS} sekwencji, jest {}",
        seqs.len()
    );

    let mut multi_call_runs = 0usize;
    for budget in BUDGETS {
        for seq in seqs.iter().take(RESUME_SEQS) {
            let id = seq["id"].as_str().expect("id");

            let mut one = build(&seq["spec"]);
            let stop_one = one.sl.run(&mut one.clock, 50_000_000);

            let mut split = build(&seq["spec"]);
            split.sl.start(&mut split.clock);
            let mut calls: u64 = 0;
            let stop_split = loop {
                let stop = split.sl.resume(&mut split.clock, budget);
                calls += 1;
                if stop != FfStop::StepLimit {
                    break stop;
                }
                assert!(
                    calls < 100_000_000,
                    "{id}: brak postepu przy max_steps={budget}"
                );
            };

            assert_eq!(
                stop_split, stop_one,
                "{id}: powod zatrzymania przy max_steps={budget}"
            );
            assert_eq!(
                fingerprint(&split),
                fingerprint(&one),
                "{id}: stan rozjechany przy max_steps={budget} ({calls} wywolan resume)"
            );
            if calls > 1 {
                multi_call_runs += 1;
            }
        }
    }
    assert!(
        multi_call_runs > 0,
        "zadna sekwencja nie wymagala wielu wywolan resume: test nie sprawdza wznowienia"
    );
}

#[test]
fn p6_siege_tactics_loop_resume_budget_one_on_tower_or_breach_sequence_matches_run() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seqs = v["sequences"].as_array().expect("sequences");
    let seq = seqs
        .iter()
        .find(|s| !s["spec"]["tower"].is_null() || s["spec"]["wallBreached"] == Value::Bool(true))
        .expect("sekwencja z wieza lub wylomem");

    let mut one = build(&seq["spec"]);
    let _ = one.sl.run(&mut one.clock, 50_000_000);

    let mut split = build(&seq["spec"]);
    split.sl.start(&mut split.clock);
    while split.sl.resume(&mut split.clock, 1) == FfStop::StepLimit {}
    assert_eq!(fingerprint(&split), fingerprint(&one));
}

#[test]
fn p6_siege_tactics_loop_resume_after_finish_is_a_no_op() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seq = &v["sequences"][0];
    let mut b = build(&seq["spec"]);
    let _ = b.sl.run(&mut b.clock, 50_000_000);
    let before = fingerprint(&b);
    assert_eq!(b.sl.resume(&mut b.clock, 50), FfStop::Finished);
    assert_eq!(fingerprint(&b), before);
}
