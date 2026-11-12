//! P6 SIEGE-TAKTYKA K5-LOOP (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1): test składania pętli
//! taktycznej oblężenia end-to-end na sekwencjach wykonanych przez TEKST pinu `07d2fbd72`.
//!
//! Wektory: `p6_siege_tactics_loop_vectors/vectors.json`, generowane przez `p6_siege_tactics_loop_gen.mjs`
//! (wycięte metody pinu: `_beginTurn`, `_activateNext`, `_schedule`, `_drainTimers`, `_runFastForward`,
//! `_roundCapVerdict`, `_ffRoundCapResult`, `_finishDraw`, `_checkEnd`, `_updateStallWatch`).
//!
//! Stuby zewnętrzne (jawne w generatorze i tu): ciało jednostki = timer o zadanym czasie + zadany efekt (nop / kill /
//! hurt), wieżyczka = zabicie jednej zadanej jednostki przy początku tury, `_armyMoraleRatio` = stosunek sum morale
//! (formuła stubowa), wycofanie dowódców pusta lista.
//!
//! Porównanie: ślad zdarzeń (kolejność aktywacji z czasem `vNow`, wyniki `_checkEnd`, tury, wieżyczki), zwycięzca,
//! liczba tur, `finished`, `vNow` i stan jednostek (zywy/martwy, `acted`, `hp`, `morale`).

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, LoopTimer, SiegeEnv, SiegeLoop};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_siege_tactics_loop_vectors/vectors.json");

#[derive(Debug, Clone, Copy, PartialEq)]
enum Eff {
    Nop,
    Kill,
    Hurt,
}

/// Ciało jednostki z wektora: czas trwania animacji i efekt w chwili zakończenia (stub zewnętrzny).
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
        move_left: 0.0,
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

#[test]
fn p6_siege_tactics_loop_matches_pin_text_on_all_vectors() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(
        seqs.len() >= 300,
        "wymagane >= 300 sekwencji, jest {}",
        seqs.len()
    );

    let mut failures: Vec<String> = Vec::new();
    for seq in seqs {
        let id = seq["id"].as_str().expect("id");
        let mut built = build(&seq["spec"]);
        let _stop = built.sl.run(&mut built.clock, 50_000_000);
        let exp = &seq["expect"];

        let mut diffs: Vec<String> = Vec::new();
        if built.sl.st.finished != exp["finished"].as_bool().expect("finished") {
            diffs.push("finished".into());
        }
        let want_winner: Option<&str> = exp["winner"].as_str();
        if built.sl.winner_label() != want_winner {
            diffs.push(format!(
                "winner rust={:?} pin={:?}",
                built.sl.winner_label(),
                want_winner
            ));
        }
        if built.sl.st.round_no != exp["roundNo"].as_i64().expect("roundNo") {
            diffs.push(format!(
                "roundNo rust={} pin={}",
                built.sl.st.round_no, exp["roundNo"]
            ));
        }
        if built.clock.v_now != num(&exp["vNow"]) {
            diffs.push(format!(
                "vNow rust={} pin={}",
                built.clock.v_now, exp["vNow"]
            ));
        }
        let want_trace: Vec<String> = exp["trace"]
            .as_array()
            .expect("trace")
            .iter()
            .map(|t| t.as_str().expect("trace str").to_string())
            .collect();
        if built.sl.trace != want_trace {
            let idx = built
                .sl
                .trace
                .iter()
                .zip(want_trace.iter())
                .position(|(a, b)| a != b)
                .unwrap_or(built.sl.trace.len().min(want_trace.len()));
            diffs.push(format!(
                "trace rozbieznosc @{idx}: rust={:?} pin={:?} (dlugosci {}/{})",
                built.sl.trace.get(idx),
                want_trace.get(idx),
                built.sl.trace.len(),
                want_trace.len()
            ));
        }
        let sides: [(&str, &Vec<SeqUnit>); 2] =
            [("atk", &built.sl.st.atk), ("def", &built.sl.st.def)];
        for (side, units) in sides {
            for (i, u) in units.iter().enumerate() {
                let want = exp["units"]
                    .as_array()
                    .expect("units")
                    .iter()
                    .find(|w| w["side"] == side && w["idx"].as_u64() == Some(i as u64))
                    .expect("jednostka w oczekiwaniach");
                let ok = u.c.dead == want["dead"].as_bool().expect("dead")
                    && u.c.acted == want["acted"].as_bool().expect("acted")
                    && u.c.hp == num(&want["hp"])
                    && u.c.morale == num(&want["morale"]);
                if !ok {
                    diffs.push(format!(
                        "{side}{i}: rust dead={} acted={} hp={} morale={} pin={}",
                        u.c.dead, u.c.acted, u.c.hp, u.c.morale, want
                    ));
                }
            }
        }
        if !diffs.is_empty() {
            failures.push(format!("{id}: {}", diffs.join("; ")));
        }
    }
    assert!(
        failures.is_empty(),
        "{} z {} sekwencji rozjechanych z pinem:\n{}",
        failures.len(),
        seqs.len(),
        failures
            .iter()
            .take(20)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn p6_siege_tactics_loop_vectors_cover_breach_towers_and_cap() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seqs = v["sequences"].as_array().expect("sequences");
    let count = |f: &dyn Fn(&Value) -> bool| seqs.iter().filter(|s| f(s)).count();
    assert!(
        count(&|s| s["spec"]["wallBreached"] == Value::Bool(true)) > 0,
        "brak wylomu"
    );
    assert!(
        count(&|s| s["spec"]["wallBreached"] == Value::Bool(false)) > 0,
        "brak muru bez wylomu"
    );
    assert!(count(&|s| !s["spec"]["tower"].is_null()) > 0, "brak wiezy");
    assert!(
        count(&|s| s["expect"]["winner"] == Value::String("remis".into())) > 0,
        "brak remisu sufitu"
    );
    assert!(
        count(&|s| s["expect"]["roundNo"].as_i64().unwrap_or(0) >= 400) > 0,
        "brak sufitu 400 tur"
    );
    assert!(
        count(&|s| s["expect"]["winner"] == Value::String("atk".into())) > 0,
        "brak zwyciestwa atakujacych"
    );
    assert!(
        count(&|s| s["expect"]["winner"] == Value::String("def".into())) > 0,
        "brak zwyciestwa obroncy"
    );
}

fn any_unit(seq: &Value, f: &dyn Fn(&Value) -> bool) -> bool {
    seq["spec"]["atk"]
        .as_array()
        .into_iter()
        .chain(seq["spec"]["def"].as_array())
        .flatten()
        .any(f)
}

#[test]
fn p6_siege_tactics_loop_vectors_cover_fading_removed_routed_and_zero_mp() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(
        seqs.iter()
            .any(|s| any_unit(s, &|u| u["fadingOut"] == Value::Bool(true))),
        "brak jednostki fadingOut"
    );
    assert!(
        seqs.iter()
            .any(|s| any_unit(s, &|u| u["removed"] == Value::Bool(true))),
        "brak jednostki removed"
    );
    assert!(
        seqs.iter()
            .any(|s| any_unit(s, &|u| u["routed"] == Value::Bool(true))),
        "brak jednostki routed"
    );
    assert!(
        seqs.iter()
            .any(|s| any_unit(s, &|u| u["mp"].as_f64().unwrap_or(0.0) > 0.0)),
        "brak jednostki z moveLeft > 0"
    );
}

#[test]
fn p6_siege_tactics_loop_halts_without_siege_instead_of_panicking() {
    // Sciezka AUTO bez oblezenia (siegeWallCol < 0) jest poza zakresem sterownika: ma sie zatrzymac z powodem,
    // bez paniki i bez zwyciezcy. Brak wektora pinu: pin dla tej sciezki rzuca (stub `_beginAutoBatchPhase`).
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let mut spec = v["sequences"][0]["spec"].clone();
    spec["wallCol"] = Value::from(-1);
    let mut built = build(&spec);
    let _stop = built.sl.run(&mut built.clock, 50_000);
    assert!(
        built.sl.unsupported.is_some(),
        "brak zatrzymania poza zakresem"
    );
    assert!(built.sl.st.finished, "sterownik nie oznaczyl konca");
    assert_eq!(built.sl.winner_label(), None);
}
