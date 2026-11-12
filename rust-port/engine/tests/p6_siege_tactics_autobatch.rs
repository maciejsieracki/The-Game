//! P6 SIEGE-TAKTYKA K5g (dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G-Q1, runda 1): fazy AUTO (`_beginAutoBatchPhase`,
//! `_snapshotAutoBatchIntents`, `_launchAutoBatchResolution`, `_resolveAutoBatchMovement`/`Attack`,
//! `_finishAutoBatchPhase`, `_haltAutoBattleTurn`, zegar) z wektorami wykonanymi z tekstu pinu `07d2fbd72`.
//!
//! Wektory: `p6_siege_tactics_autobatch_vectors/vectors.json`, generator `p6_siege_tactics_autobatch_gen.mjs`
//! (wykonanie tekstu pinu, strazowane SHA-256). Kazda sekwencja = stan poczatkowy + operacje (`begin`, `fromState`, `cb`,
//! `drain`, `advance`, `halt`, `finishTok`, `unitFlag`, `set`). Po kazdej operacji porownujemy slad efektow sceny i pelny
//! stan (jednostki, zajetosc, kolejka timerow, token, faza, rozstrzygniecia, flagi). Kolejnosc kontynuacji
//! asynchronicznych (`cb`) wybiera wektor -- tak odtwarzamy wyscigi tokenu.

use std::collections::{HashMap, HashSet};

use civ_engine::domain::siege_tactics_autobatch::*;
use civ_engine::domain::siege_tactics_autophase::{
    AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase, AutoBatchResolution,
};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_siege_tactics_autobatch_vectors/vectors.json");

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

fn side_of(s: &str) -> AutoBatchPhase {
    match s {
        "atk" => AutoBatchPhase::Atk,
        "def" => AutoBatchPhase::Def,
        other => panic!("nieznana strona {other}"),
    }
}

fn kind_str(k: AutoBatchIntentKind) -> &'static str {
    match k {
        AutoBatchIntentKind::Hold => "hold",
        AutoBatchIntentKind::Move => "move",
        AutoBatchIntentKind::Attack => "attack",
    }
}

/// `String(x)` z JS dla liczb uzywanych w wektorach.
fn js_num(x: f64) -> String {
    if x.is_nan() {
        "NaN".into()
    } else if x == f64::INFINITY {
        "Infinity".into()
    } else if x == f64::NEG_INFINITY {
        "-Infinity".into()
    } else if x == 0.0 {
        "0".into()
    } else {
        format!("{x}")
    }
}

fn key_str(k: CellKey) -> String {
    format!(
        "{},{}",
        js_num(f64::from_bits(k.0)),
        js_num(f64::from_bits(k.1))
    )
}

#[derive(Default, Clone)]
struct Plan {
    steps: Vec<(f64, f64)>,
    attack: Option<String>,
    special: Option<(f64, f64)>,
}

#[derive(Default)]
struct TestEnv {
    plans: HashMap<String, Plan>,
    blocked: HashSet<CellKey>,
    range: HashMap<String, f64>,
    dmg: HashMap<String, f64>,
    rout_on_hit: HashSet<String>,
    banner_flags: Vec<(String, String)>,
    end_script: Vec<bool>,
    end_idx: usize,
}

fn apply_flag(st: &mut BatchState, id: &str, flag_name: &str) {
    let key;
    {
        let Some(u) = st.board.find_mut(id) else {
            return;
        };
        match flag_name {
            "routed" => u.c.routed = true,
            "dead" => u.c.dead = true,
            "removed" => u.c.removed = true,
            "acted" => u.c.acted = true,
            other => panic!("flaga {other}"),
        }
        key = cell_key(u.q, u.r);
    }
    if flag_name == "dead" && st.board.occ.get(&key).map(String::as_str) == Some(id) {
        st.board.occ.remove(&key);
    }
}

impl AutoBatchEnv for TestEnv {
    fn update_battle_phase_banner(&mut self, st: &mut BatchState, _active: Option<&str>) {
        for (id, f) in std::mem::take(&mut self.banner_flags) {
            apply_flag(st, &id, &f);
        }
    }

    fn plan_unit(&mut self, board: &mut BatchBoard, unit_id: &str, intent: &mut AutoBatchIntent) {
        let Some(plan) = self.plans.get(unit_id).cloned() else {
            return;
        };
        if let Some((c, r)) = plan.special {
            if let Some(u) = board.find_mut(unit_id) {
                u.q = c;
                u.r = r;
            }
            return;
        }
        for (c, r) in &plan.steps {
            planning_move(board, intent, unit_id, *c, *r);
        }
        if let Some(t) = &plan.attack {
            if board.find(t).is_some() {
                planning_attack(intent, t);
            }
        }
    }

    fn check_end(&mut self, st: &mut BatchState) -> bool {
        if st.finished() {
            return true;
        }
        let r = self.end_script.get(self.end_idx).copied() == Some(true);
        self.end_idx += 1;
        if r {
            st.clock.finished = true;
        }
        r
    }

    fn passable_for_unit(&mut self, _st: &BatchState, _id: &str, col: f64, row: f64) -> bool {
        !self.blocked.contains(&cell_key(col, row))
    }

    fn can_strike_target_from(
        &mut self,
        st: &BatchState,
        attacker_id: &str,
        col: f64,
        row: f64,
        target_id: &str,
    ) -> bool {
        let range = self.range.get(attacker_id).copied().unwrap_or(1.0);
        let t = st.board.find(target_id).expect("cel");
        (col - t.q).abs() + (row - t.r).abs() <= range
    }

    fn do_move(&mut self, st: &mut BatchState, unit_id: &str, col: f64, row: f64) {
        let old = {
            let u = st.board.find(unit_id).expect("jednostka");
            cell_key(u.q, u.r)
        };
        st.board.occ.remove(&old);
        st.board.occ.insert(cell_key(col, row), unit_id.to_string());
        let u = st.board.find_mut(unit_id).expect("jednostka");
        u.q = col;
        u.r = row;
    }

    fn apply_terrain_range(&mut self, _st: &mut BatchState, _unit_id: &str) {}

    fn do_attack(&mut self, st: &mut BatchState, attacker_id: &str, target_id: &str) {
        let dmg = self.dmg.get(attacker_id).copied().unwrap_or(10.0);
        let rout = self.rout_on_hit.contains(target_id);
        let key;
        let dead;
        {
            let t = st.board.find_mut(target_id).expect("cel");
            t.c.hp -= dmg;
            if rout {
                t.c.routed = true;
            }
            dead = t.c.hp <= 0.0;
            if dead {
                t.c.dead = true;
            }
            key = cell_key(t.q, t.r);
        }
        if dead && st.board.occ.get(&key).map(String::as_str) == Some(target_id) {
            st.board.occ.remove(&key);
        }
    }

    fn flee_step(&mut self, _st: &mut BatchState, _unit_id: &str) {}

    fn remove_unit_from_scene(&mut self, st: &mut BatchState, unit_id: &str) {
        let key = {
            let u = st.board.find_mut(unit_id).expect("jednostka");
            u.c.removed = true;
            cell_key(u.q, u.r)
        };
        if st.board.occ.get(&key).map(String::as_str) == Some(unit_id) {
            st.board.occ.remove(&key);
        }
    }

    fn shake_allies_on_loss(&mut self, _st: &mut BatchState, _unit_id: &str) {}
}

/// Odlozony callback asynchroniczny (web: closure przekazany do `_doMove` / `_doAttack` / `_fleeStep`).
enum Pend {
    MoveCont(LaunchCtx, usize),
    Complete(LaunchCtx),
}

fn trace_of(events: &[BatchEvent], pending: &mut Vec<Pend>) -> Vec<String> {
    let mut t = Vec::new();
    for e in events {
        match e {
            BatchEvent::Banner { active } => {
                t.push(format!("banner:{}", active.as_deref().unwrap_or("none")))
            }
            BatchEvent::Move {
                ctx,
                step_idx,
                unit_id,
                col,
                row,
            } => {
                t.push(format!("move:{unit_id}:{}:{}", js_num(*col), js_num(*row)));
                pending.push(Pend::MoveCont(ctx.clone(), *step_idx));
            }
            BatchEvent::ApplyTerrainRange { unit_id } => t.push(format!("terrain:{unit_id}")),
            BatchEvent::Attack {
                ctx,
                attacker,
                target,
            } => {
                t.push(format!("attack:{attacker}:{target}"));
                pending.push(Pend::Complete(ctx.clone()));
            }
            BatchEvent::Flee { ctx, unit_id } => {
                t.push(format!("flee:{unit_id}"));
                pending.push(Pend::Complete(ctx.clone()));
            }
            BatchEvent::RemoveUnitFromScene { unit_id } => t.push(format!("remove:{unit_id}")),
            BatchEvent::ShakeAlliesOnLoss { unit_id } => t.push(format!("shake:{unit_id}")),
            BatchEvent::Schedule { ms, timer, queued } => {
                let kind = match timer {
                    BatchTimer::BeginTurn => "begin",
                    BatchTimer::FinishPhase { .. } => "finish",
                };
                t.push(format!("sched:{}:{kind}:{queued}", js_num(*ms)));
            }
            BatchEvent::EndCheck { ended } => t.push(format!("check:{ended}")),
            BatchEvent::BeginTurn => t.push("beginTurn".to_string()),
        }
    }
    t
}

fn run_pending(st: &mut BatchState, env: &mut TestEnv, p: Pend, out: &mut Vec<BatchEvent>) {
    match p {
        Pend::MoveCont(ctx, step_idx) => {
            resolve_auto_batch_movement(st, env, &ctx, step_idx + 1, out)
        }
        Pend::Complete(ctx) => complete_resolution(st, &ctx, out),
    }
}

fn build_state(init: &Value) -> (BatchState, TestEnv) {
    let mut board = BatchBoard::default();
    for u in init["units"].as_array().expect("units") {
        let side = side_of(u["side"].as_str().expect("side"));
        let unit = BatchUnit {
            id: u["id"].as_str().expect("id").to_string(),
            side,
            q: num(&u["q"]),
            r: num(&u["r"]),
            c: CombatUnit {
                hp: num(&u["hp"]),
                morale: 50.0,
                flee_morale: 20.0,
                move_left: 3.0,
                never_rout: false,
                dead: flag(&u["dead"]),
                fading_out: flag(&u["fadingOut"]),
                routed: flag(&u["routed"]),
                removed: flag(&u["removed"]),
                acted: flag(&u["acted"]),
            },
        };
        match side {
            AutoBatchPhase::Atk => board.atk.push(unit),
            AutoBatchPhase::Def => board.def.push(unit),
        }
    }
    for e in init["occ"].as_array().expect("occ") {
        board.occ.insert(
            cell_key(num(&e["col"]), num(&e["row"])),
            e["id"].as_str().expect("id").to_string(),
        );
    }
    let mut st = BatchState::new(board);
    st.manual_mode = flag(&init["manual"]);
    st.auto_battle_suspended = flag(&init["suspended"]);
    st.clock.finished = flag(&init["finished"]);
    st.battle_awaiting_orders = flag(&init["awaiting"]);
    st.siege_wall_col = init["siegeWallCol"].as_i64().expect("siegeWallCol");
    st.clock.v_now = num(&init["vNow"]);
    st.token = init["token"].as_u64().expect("token");

    let mut env = TestEnv::default();
    for (id, p) in init["plans"].as_object().expect("plans") {
        let plan = Plan {
            steps: p["steps"]
                .as_array()
                .expect("steps")
                .iter()
                .map(|s| (num(&s[0]), num(&s[1])))
                .collect(),
            attack: p["attack"].as_str().map(str::to_string),
            special: p["special"].as_array().map(|s| (num(&s[0]), num(&s[1]))),
        };
        env.plans.insert(id.clone(), plan);
    }
    for b in init["blocked"].as_array().expect("blocked") {
        env.blocked.insert(cell_key(num(&b[0]), num(&b[1])));
    }
    for (id, v) in init["range"].as_object().expect("range") {
        env.range.insert(id.clone(), num(v));
    }
    for (id, v) in init["dmg"].as_object().expect("dmg") {
        env.dmg.insert(id.clone(), num(v));
    }
    for id in init["routOnHit"].as_array().expect("routOnHit") {
        env.rout_on_hit.insert(id.as_str().expect("id").to_string());
    }
    for f in init["bannerFlags"].as_array().expect("bannerFlags") {
        env.banner_flags.push((
            f["id"].as_str().expect("id").to_string(),
            f["flag"].as_str().expect("flag").to_string(),
        ));
    }
    env.end_script = init["endScript"]
        .as_array()
        .expect("endScript")
        .iter()
        .map(flag)
        .collect();
    (st, env)
}

fn check_state(st: &BatchState, pending: usize, exp: &Value, ctx: &str) {
    let units: Vec<&BatchUnit> = st.board.all().collect();
    let eu = exp["units"].as_array().expect("units");
    assert_eq!(units.len(), eu.len(), "{ctx}: liczba jednostek");
    for (u, e) in units.iter().zip(eu) {
        assert_eq!(u.id, e["id"].as_str().unwrap(), "{ctx}: id");
        assert!(
            same(u.q, num(&e["q"])),
            "{ctx}: q {} {:?} vs {}",
            u.id,
            u.q,
            e["q"]
        );
        assert!(same(u.r, num(&e["r"])), "{ctx}: r {}", u.id);
        assert!(
            same(u.c.hp, num(&e["hp"])),
            "{ctx}: hp {} {:?} vs {}",
            u.id,
            u.c.hp,
            e["hp"]
        );
        assert_eq!(u.c.dead, flag(&e["dead"]), "{ctx}: dead {}", u.id);
        assert_eq!(
            u.c.fading_out,
            flag(&e["fadingOut"]),
            "{ctx}: fadingOut {}",
            u.id
        );
        assert_eq!(u.c.routed, flag(&e["routed"]), "{ctx}: routed {}", u.id);
        assert_eq!(u.c.removed, flag(&e["removed"]), "{ctx}: removed {}", u.id);
        assert_eq!(u.c.acted, flag(&e["acted"]), "{ctx}: acted {}", u.id);
    }
    let mut occ: Vec<String> = st
        .board
        .occ
        .iter()
        .map(|(k, id)| format!("{}|{id}", key_str(*k)))
        .collect();
    occ.sort();
    let eocc: Vec<String> = exp["occ"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_string())
        .collect();
    assert_eq!(occ, eocc, "{ctx}: zajetosc");

    let mut timers: Vec<(f64, u64, &str)> = st
        .clock
        .timers
        .iter()
        .map(|t| {
            (
                t.due,
                t.id,
                if t.payload == BatchTimer::BeginTurn {
                    "begin"
                } else {
                    "finish"
                },
            )
        })
        .collect();
    timers.sort_by_key(|t| t.1);
    let et = exp["timers"].as_array().unwrap();
    assert_eq!(timers.len(), et.len(), "{ctx}: liczba timerow");
    for (t, e) in timers.iter().zip(et) {
        assert!(same(t.0, num(&e["due"])), "{ctx}: due");
        assert_eq!(t.1, e["id"].as_u64().unwrap(), "{ctx}: id timera");
        assert_eq!(t.2, e["kind"].as_str().unwrap(), "{ctx}: rodzaj timera");
    }
    assert!(same(st.clock.v_now, num(&exp["vNow"])), "{ctx}: vNow");
    assert_eq!(st.token, exp["token"].as_u64().unwrap(), "{ctx}: token");
    let phase = match st.phase {
        None => None,
        Some(AutoBatchPhase::Atk) => Some("atk"),
        Some(AutoBatchPhase::Def) => Some("def"),
    };
    assert_eq!(phase, exp["phase"].as_str(), "{ctx}: faza");
    assert_eq!(
        st.pending as u64,
        exp["pendingCount"].as_u64().unwrap(),
        "{ctx}: pending"
    );
    let er = exp["resolutions"].as_array().unwrap();
    assert_eq!(
        st.resolutions.len(),
        er.len(),
        "{ctx}: liczba rozstrzygniec"
    );
    for (r, e) in st.resolutions.iter().zip(er) {
        assert_eq!(r.unit_id, e["unitId"].as_str().unwrap(), "{ctx}: unitId");
        assert_eq!(r.side, side_of(e["side"].as_str().unwrap()), "{ctx}: side");
        assert_eq!(kind_str(r.kind), e["kind"].as_str().unwrap(), "{ctx}: kind");
        assert_eq!(
            r.target_id.as_deref(),
            e["targetId"].as_str(),
            "{ctx}: targetId"
        );
        assert_eq!(r.blocked, flag(&e["blocked"]), "{ctx}: blocked");
        let es = e["steps"].as_array().unwrap();
        assert_eq!(r.steps.len(), es.len(), "{ctx}: kroki");
        for (s, x) in r.steps.iter().zip(es) {
            assert!(
                same(s.col, num(&x["col"])) && same(s.row, num(&x["row"])),
                "{ctx}: krok"
            );
        }
    }
    assert_eq!(st.finished(), flag(&exp["finished"]), "{ctx}: finished");
    assert_eq!(st.manual_mode, flag(&exp["manual"]), "{ctx}: manual");
    assert_eq!(
        st.auto_battle_suspended,
        flag(&exp["suspended"]),
        "{ctx}: suspended"
    );
    assert_eq!(
        st.battle_awaiting_orders,
        flag(&exp["awaiting"]),
        "{ctx}: awaiting"
    );
    assert_eq!(st.busy, flag(&exp["busy"]), "{ctx}: busy");
    assert_eq!(
        pending as u64,
        exp["deferred"].as_u64().unwrap(),
        "{ctx}: odlozone callbacki"
    );
}

#[test]
fn autobatch_vectors_from_pin_text() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(
        seqs.len() >= 300,
        "wymagane >= 300 sekwencji, jest {}",
        seqs.len()
    );
    let mut hits: HashMap<&'static str, u64> = HashMap::new();
    let mut ops_total = 0usize;
    for (si, seq) in seqs.iter().enumerate() {
        let (mut st, mut env) = build_state(&seq["initial"]);
        let mut pending: Vec<Pend> = Vec::new();
        for (oi, op) in seq["ops"].as_array().unwrap().iter().enumerate() {
            ops_total += 1;
            let ctx = format!("seq {si} op {oi} ({})", op["op"]);
            let mut out: Vec<BatchEvent> = Vec::new();
            let mut drained: Option<Vec<String>> = None;
            if let Some(bf) = op.get("bannerFlags") {
                for f in bf.as_array().unwrap() {
                    env.banner_flags.push((
                        f["id"].as_str().unwrap().to_string(),
                        f["flag"].as_str().unwrap().to_string(),
                    ));
                }
            }
            match op["op"].as_str().unwrap() {
                "begin" => {
                    let units: Vec<String> = op["units"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|u| u.as_str().unwrap().to_string())
                        .collect();
                    begin_auto_batch_phase(
                        &mut st,
                        &mut env,
                        side_of(op["side"].as_str().unwrap()),
                        &units,
                        &mut out,
                    );
                }
                "fromState" => {
                    begin_auto_batch_turn_from_current_state(&mut st, &mut env, &mut out)
                }
                "cb" => {
                    let idx = op["index"].as_i64().unwrap();
                    if idx >= 0 {
                        let p = pending.remove(idx as usize);
                        run_pending(&mut st, &mut env, p, &mut out);
                    } else {
                        assert!(
                            pending.is_empty(),
                            "{ctx}: oczekiwano pustej kolejki callbackow"
                        );
                    }
                }
                "drain" => {
                    let mut all = Vec::new();
                    let mut guard = 0;
                    while !pending.is_empty() && guard < 300 {
                        guard += 1;
                        let p = pending.remove(0);
                        let mut sub = Vec::new();
                        run_pending(&mut st, &mut env, p, &mut sub);
                        all.extend(trace_of(&sub, &mut pending));
                    }
                    drained = Some(all);
                }
                "advance" => {
                    st.clock.v_now += num(&op["ms"]);
                    fire_timers(&mut st, &mut env, &mut out);
                }
                "halt" => halt_auto_battle_turn(&mut st, flag(&op["suspend"])),
                "finishTok" => {
                    let token = st.token.wrapping_add_signed(op["delta"].as_i64().unwrap());
                    finish_auto_batch_phase(&mut st, &mut env, token, &mut out);
                }
                "unitFlag" => apply_flag(
                    &mut st,
                    op["id"].as_str().unwrap(),
                    op["flag"].as_str().unwrap(),
                ),
                "set" => {
                    let val = flag(&op["value"]);
                    match op["key"].as_str().unwrap() {
                        "manual" => st.manual_mode = val,
                        "suspended" => st.auto_battle_suspended = val,
                        "finished" => st.clock.finished = val,
                        "awaiting" => st.battle_awaiting_orders = val,
                        other => panic!("klucz {other}"),
                    }
                }
                other => panic!("operacja {other}"),
            }
            let tr = match drained {
                Some(t) => t,
                None => trace_of(&out, &mut pending),
            };
            let expected: Vec<String> = op["trace"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_string())
                .collect();
            assert_eq!(tr, expected, "{ctx}: slad");
            check_state(&st, pending.len(), &op["state"], &ctx);
        }
        for (k, n) in &st.hits {
            *hits.entry(k).or_insert(0) += n;
        }
    }
    // `launch_no_target` i `complete_double` nie wystepuja na wyjsciu K5G0 (patrz test obronny nizej).
    let missing: Vec<&&str> = BRANCHES
        .iter()
        .filter(|b| {
            !hits.contains_key(*b) && !matches!(**b, "launch_no_target" | "complete_double")
        })
        .collect();
    eprintln!("operacji: {ops_total}; liczniki galezi: {:?}", {
        let mut h: Vec<_> = hits.iter().collect();
        h.sort();
        h
    });
    assert!(
        missing.is_empty(),
        "galezie bez pokrycia w wektorach: {missing:?}"
    );
}

fn mk_unit(id: &str, side: AutoBatchPhase, q: f64, r: f64) -> BatchUnit {
    BatchUnit {
        id: id.to_string(),
        side,
        q,
        r,
        c: CombatUnit {
            hp: 30.0,
            morale: 50.0,
            flee_morale: 20.0,
            move_left: 3.0,
            never_rout: false,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
        },
    }
}

fn mk_board() -> BatchBoard {
    let mut b = BatchBoard::default();
    b.atk.push(mk_unit("a0", AutoBatchPhase::Atk, 0.0, 0.0));
    b.def.push(mk_unit("d0", AutoBatchPhase::Def, 3.0, 0.0));
    for u in b.all().cloned().collect::<Vec<_>>() {
        b.occ.insert(cell_key(u.q, u.r), u.id);
    }
    b
}

/// Planowanie dziala na klonach: zywa plansza nie zmienia sie, mimo ze plan przesuwa klon.
#[test]
fn planning_runs_on_clones_and_leaves_live_board_untouched() {
    let mut env = TestEnv::default();
    env.plans.insert(
        "a0".into(),
        Plan {
            steps: vec![(1.0, 0.0), (2.0, 0.0)],
            attack: Some("d0".into()),
            special: None,
        },
    );
    let mut st = BatchState::new(mk_board());
    let before = st.board.clone();
    let intents =
        snapshot_auto_batch_intents(&mut st, &mut env, AutoBatchPhase::Atk, &["a0".to_string()]);
    assert_eq!(st.board, before);
    assert_eq!(intents.len(), 1);
    assert_eq!(intents[0].kind, AutoBatchIntentKind::Attack);
    assert_eq!(intents[0].steps.len(), 2);
    assert_eq!(intents[0].target_id.as_deref(), Some("d0"));
}

/// Wyscig tokenu: callback ruchu z fazy sprzed `halt` nie otwiera fazy ani nie liczy sie do `pending`.
#[test]
fn halt_invalidates_in_flight_callbacks() {
    let mut env = TestEnv::default();
    env.plans.insert(
        "a0".into(),
        Plan {
            steps: vec![(1.0, 0.0)],
            attack: None,
            special: None,
        },
    );
    let mut st = BatchState::new(mk_board());
    let mut out = Vec::new();
    begin_auto_batch_phase(
        &mut st,
        &mut env,
        AutoBatchPhase::Atk,
        &["a0".to_string()],
        &mut out,
    );
    let token_before = st.token;
    let (ctx, step_idx) = out
        .iter()
        .find_map(|e| match e {
            BatchEvent::Move { ctx, step_idx, .. } => Some((ctx.clone(), *step_idx)),
            _ => None,
        })
        .expect("ruch");
    halt_auto_battle_turn(&mut st, true);
    assert_eq!(st.token, token_before + 1);
    assert!(
        st.auto_battle_suspended
            && st.battle_awaiting_orders
            && st.phase.is_none()
            && st.pending == 0
    );
    let mut late = Vec::new();
    // Spozniona kontynuacja: guard `suspended` w ruchu nie wola `done`, a `complete` ze starym tokenem jest odrzucony.
    resolve_auto_batch_movement(&mut st, &mut env, &ctx, step_idx + 1, &mut late);
    complete_resolution(&mut st, &ctx, &mut late);
    assert!(late.is_empty());
    assert!(!st.board.find("a0").unwrap().c.acted);
    // Stary FinishPhase z poprzedniego tokenu tez jest odrzucany.
    finish_auto_batch_phase(&mut st, &mut env, token_before, &mut late);
    assert!(late.is_empty());
}

/// Pelna fala: faza atk -> przerwa -> faza def -> przerwa tury -> `BeginTurn`; K5F `begin_turn` zasila faze.
#[test]
fn full_turn_from_k5f_begin_turn_event() {
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_endcheck::EndCheckOutcome;
    use civ_engine::domain::siege_tactics_turnseq::{
        begin_turn, CheckSite, EndCheckSnapshot, SeqEvent, SeqUnit, TurnSeqEnv, TurnSeqState,
        UnitRef,
    };

    struct SeqEnv;
    impl TurnSeqEnv for SeqEnv {
        fn end_check_snapshot(&mut self, _site: CheckSite, st: &TurnSeqState) -> EndCheckSnapshot {
            EndCheckSnapshot {
                stalled: false,
                alive_a: true,
                alive_d: true,
                is_siege: false,
                wall_ever_breached: false,
                total_dead: 0,
                ratio_a: 1.0,
                ratio_d: 1.0,
                ratio_a_at_cap: 1.0,
                ratio_d_at_cap: 1.0,
                round_no: st.round_no,
                no_breach_cap: 150,
                hp_a: vec![30.0],
                hp_d: vec![30.0],
            }
        }
        fn movement_points(&mut self, _u: UnitRef, _st: &TurnSeqState) -> f64 {
            3.0
        }
        fn fire_siege_towers(&mut self, _st: &mut TurnSeqState) {}
        fn player_unit_idle(&mut self, _u: UnitRef, _st: &TurnSeqState) -> bool {
            false
        }
    }
    let su = |id: u64| SeqUnit {
        id,
        c: CombatUnit {
            hp: 30.0,
            morale: 50.0,
            flee_morale: 20.0,
            move_left: 3.0,
            never_rout: false,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: true,
        },
    };
    let mut seq = TurnSeqState {
        atk: vec![su(1)],
        def: vec![su(2)],
        turn_order: vec![],
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: -1,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: Default::default(),
    };
    let mut seq_out = Vec::new();
    begin_turn(&mut seq, &mut SeqEnv, &mut seq_out);
    assert!(matches!(
        seq_out
            .iter()
            .find(|e| matches!(e, SeqEvent::EndCheck { .. })),
        Some(SeqEvent::EndCheck {
            outcome: EndCheckOutcome::Continue,
            ..
        })
    ));
    let (side, refs) = seq_out
        .iter()
        .find_map(|e| match e {
            SeqEvent::BeginAutoBatchPhase { side, units } => Some((*side, units.clone())),
            _ => None,
        })
        .expect("K5F zlecil faze AUTO");
    assert_eq!(side, BattleSide::Attacker);
    let ids = units_from_seq_refs(&seq, &refs);
    assert_eq!(ids, vec!["1".to_string()]);

    // Plansza AUTO z tymi samymi identyfikatorami; jednostki nie wykonaly jeszcze akcji (K5F zerowal `acted`).
    let mut board = BatchBoard::default();
    let mut a = mk_unit("1", AutoBatchPhase::Atk, 0.0, 0.0);
    a.c.acted = false;
    let mut d = mk_unit("2", AutoBatchPhase::Def, 3.0, 0.0);
    d.c.acted = false;
    board.occ.insert(cell_key(0.0, 0.0), "1".into());
    board.occ.insert(cell_key(3.0, 0.0), "2".into());
    board.atk.push(a);
    board.def.push(d);
    let mut st = BatchState::new(board);
    let mut env = TestEnv::default();
    let mut out = Vec::new();
    begin_auto_batch_phase(&mut st, &mut env, AutoBatchPhase::Atk, &ids, &mut out);
    assert_eq!(st.phase, Some(AutoBatchPhase::Atk));
    assert_eq!(st.resolutions.len(), 1);
    // Hold: kompletuje sie od razu (pending 0), zostaje tylko timer ACT_GAP.
    assert_eq!(st.pending, 0);
    assert_eq!(st.clock.timers.len(), 1);
    st.clock.v_now += 160.0;
    fire_timers(&mut st, &mut env, &mut out);
    assert_eq!(st.phase, Some(AutoBatchPhase::Def));
    st.clock.v_now += 160.0;
    fire_timers(&mut st, &mut env, &mut out);
    assert_eq!(st.phase, None);
    st.clock.v_now += 240.0;
    fire_timers(&mut st, &mut env, &mut out);
    assert!(out.iter().any(|e| matches!(e, BatchEvent::BeginTurn)));
    assert!(st.board.all().all(|u| u.c.acted));
}

/// Galezie nieosiagalne z wyjscia K5G0 (atak zawsze ma niepusty cel; kazdy `complete` jest wolany raz): kontrakt obronny
/// weryfikowany bezposrednio na sztucznym rozstrzygnieciu (web ma identyczne gałęzie `!resolution.targetId` / `completed`).
#[test]
fn defensive_branches_launch_no_target_and_double_complete() {
    let mut env = TestEnv::default();
    let mut st = BatchState::new(mk_board());
    st.phase = Some(AutoBatchPhase::Atk);
    st.token = 7;
    st.pending = 2;
    st.completed = vec![false, false];
    let res = |target: Option<&str>| AutoBatchResolution {
        unit_id: "a0".into(),
        side: AutoBatchPhase::Atk,
        kind: AutoBatchIntentKind::Attack,
        steps: vec![],
        target_id: target.map(str::to_string),
        blocked: false,
    };
    let mut out = Vec::new();
    for (i, target) in [None, Some("")].into_iter().enumerate() {
        let ctx = LaunchCtx {
            token: 7,
            idx: i,
            resolution: res(target),
        };
        launch_auto_batch_resolution(&mut st, &mut env, &ctx, &mut out);
    }
    assert_eq!(st.hits.get("launch_no_target"), Some(&2));
    assert_eq!(st.pending, 0);
    // Drugie `complete` tego samego rozstrzygniecia jest ignorowane.
    let ctx = LaunchCtx {
        token: 7,
        idx: 0,
        resolution: res(None),
    };
    complete_resolution(&mut st, &ctx, &mut out);
    assert_eq!(st.hits.get("complete_double"), Some(&1));
    assert_eq!(st.pending, 0);
}

/// Zbior etykiet galezi nie ma duplikatow.
#[test]
fn branch_labels_unique() {
    let set: HashSet<_> = BRANCHES.iter().collect();
    assert_eq!(set.len(), BRANCHES.len());
    let _ = AutoBatchResolution {
        unit_id: String::new(),
        side: AutoBatchPhase::Atk,
        kind: AutoBatchIntentKind::Hold,
        steps: vec![],
        target_id: None,
        blocked: false,
    };
}
