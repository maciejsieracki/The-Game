//! R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1 (#416, krok H3): `_performSiegeManualOrder(ru, ord, done)`
//! (`battleScene.ts:18435-18475`) i `_trySiegeTowerClimb(ru, done)` (`:8056-8084`) z pinu `07d2fbd72`.
//!
//! Wektory: `p6_k5loop_wiring_a_pin_vectors/siege_manual_order_step_vectors.json`, generowane przez
//! `p6_k5loop_wiring_a_gen.mjs` (`WIRING_A_SIEGE_MANUAL_STEPS=1`), który WYKONUJE cały tekst pinu (strażnik SHA-256):
//! scena pinu z murem i ustawionym stanem, jedno wywołanie funkcji pinu, ślad wywołań podfunkcji (głębokość 1) z
//! wynikami i pierwszymi efektami sceny.
//!
//! Port liczony NA PORTACH (nie na wynikach pinu) tam, gdzie port istnieje: klasyfikacja jednostki
//! (`siege_tactics_classify` z `stats.Typ` / `stats.Jednostka` / `nazwa` / `rangedBase` / `ammoLeft`), doktryna
//! (`is_unit_doctrine_auto` / `effective_doctrine`), `_siegeRamTowerStep`, `_trySiegeTowerClimb`,
//! `_siegeInfantryToTowerStep` (K3, `siege_tactics_tower.rs`) i `_siegeApproachRestricted` (K1) przez adapter
//! [`TowerSiegeEnv`]. Z pinu brane są wyłącznie wyniki `_rangedTargetInRange`, `_targetInRange` i `_siegeSafeApproach`
//! (ich port leży poza H3; argumenty wywołania `_siegeSafeApproach` są porównywane).

use std::collections::{BTreeSet, HashMap, HashSet, VecDeque};

use civ_engine::domain::player_order_move::{
    perform_player_order, MoveGrid, MoveOrderGates, MoveOrderInput, OrderDoctrine, PerformOrder,
    PlayerOrder,
};
use civ_engine::domain::player_order_siege_manual::{
    siege_manual_order_step, siege_manual_scene_of, siege_manual_unit_of, ApproachClear,
    NotHandledAt, SiegeEnemy, SiegeManualEnv, SiegeManualStep, SiegeTargets, TowerSiegeEnv,
};
use civ_engine::domain::siege_tactics_approach::Threat;
use civ_engine::domain::siege_tactics_classify::{
    can_shoot, is_ram, is_siege_tower, is_siege_unit, ClassifyUnit, ShootUnit,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_tower::{
    siege_tower_climb, TowerEvent, TowerScene, TowerUnit, WYLOM_LOG,
};
use civ_engine::domain::siege_tactics_walk::WalkUnit;
use serde_json::Value;

const VECTORS: &str =
    include_str!("p6_k5loop_wiring_a_pin_vectors/siege_manual_order_step_vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const PIN_SHA256: &str = "3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d";

fn vectors() -> Value {
    let v: Value = serde_json::from_str(VECTORS).expect("json");
    assert_eq!(v["pin"], PIN);
    assert_eq!(v["pinSha256"], PIN_SHA256, "wektory z innego tekstu pinu");
    v
}

fn int(v: &Value) -> i64 {
    v.as_i64()
        .unwrap_or_else(|| panic!("liczba całkowita: {v}"))
}

fn pair(v: &Value) -> (i64, i64) {
    (int(&v[0]), int(&v[1]))
}

/// `bu.id` pinu (`a<k>` / `d<k>`) -> identyfikator Rust (jak #415); inny napis = `u64::MAX` (brak w rosterze).
fn unit_id(s: &str) -> u64 {
    let n = |t: &str| t.parse::<u64>().ok();
    match (s.chars().next(), n(&s[1.min(s.len())..])) {
        (Some('a'), Some(k)) => 1000 + k,
        (Some('d'), Some(k)) => 2000 + k,
        _ => u64::MAX,
    }
}

fn opt_str(v: &Value) -> Option<String> {
    v.as_str().map(str::to_string)
}

fn doctrine(s: &str) -> GroupDoctrine {
    GroupDoctrine::parse(s).unwrap_or_else(|| panic!("doktryna {s}"))
}

fn order_doctrine(c: &Value) -> OrderDoctrine {
    let unit = c["unitDoctrine"].as_str().map(doctrine);
    let gid = c["groupId"].as_str().filter(|g| !g.is_empty());
    let group = gid.and_then(|g| {
        c["groupMeta"]
            .as_array()
            .expect("groupMeta")
            .iter()
            .find(|m| m[0] == g)
            .map(|m| {
                (
                    doctrine(m[1].as_str().expect("d")),
                    m[2].as_bool().expect("auto"),
                )
            })
    });
    OrderDoctrine {
        unit_doctrine: unit,
        has_group: gid.is_some(),
        group,
    }
}

fn order_of(c: &Value) -> PlayerOrder {
    match c["order"].as_str() {
        Some("none") => PlayerOrder::None,
        Some("hold") => PlayerOrder::Hold,
        Some("move") => {
            let (col, row) = pair(&c["target"]);
            PlayerOrder::Move { col, row }
        }
        Some("attackMove") => {
            let (col, row) = pair(&c["target"]);
            PlayerOrder::AttackMove { col, row }
        }
        Some("attack") => PlayerOrder::Attack {
            target_id: unit_id(c["targetId"].as_str().expect("targetId")),
        },
        o => panic!("rozkaz {o:?}"),
    }
}

fn order_name(o: PlayerOrder) -> &'static str {
    match o {
        PlayerOrder::None => "none",
        PlayerOrder::Hold => "hold",
        PlayerOrder::Move { .. } => "move",
        PlayerOrder::AttackMove { .. } => "attackMove",
        PlayerOrder::Attack { .. } => "attack",
    }
}

fn move_left(v: &Value) -> f64 {
    if v == "NaN" {
        f64::NAN
    } else {
        v.as_f64().expect("moveLeft")
    }
}

/// [`TowerUnit`] z pól przypadku: klasyfikacja i `canShoot` liczone portem `siege_tactics_classify`.
fn tower_unit(c: &Value) -> TowerUnit {
    let cls = ClassifyUnit {
        typ: opt_str(&c["typ"]),
        jednostka: opt_str(&c["jednostka"]),
        nazwa: opt_str(&c["nazwa"]),
    };
    let (q, r) = pair(&c["pos"]);
    TowerUnit {
        walk: WalkUnit {
            q,
            r,
            move_left: move_left(&c["moveLeft"]),
            dead: c["dead"] == true,
            fading_out: c["fadingOut"] == true,
        },
        side_atk: c["side"] == "atk",
        routed: c["routed"] == true,
        on_wall_walkway: c["onWallWalkway"] == true,
        mounted: c["mounted"] == true,
        primary_ranged: c["primaryRanged"] == true,
        can_shoot: can_shoot(&ShootUnit {
            ranged_base: c["rangedBase"] == true,
            ammo_left: c["ammoLeft"].as_f64().unwrap_or(f64::NAN),
        }),
        shooting_disabled: c["shootingEnabled"] == false,
        is_siege_unit: is_siege_unit(&cls),
        is_ram: is_ram(&cls),
        is_siege_tower: is_siege_tower(&cls),
    }
}

fn rows(v: &Value) -> BTreeSet<i64> {
    v.as_array().expect("rzędy").iter().map(int).collect()
}

fn cells(v: &Value) -> HashSet<(i64, i64)> {
    v.as_array().expect("pola").iter().map(pair).collect()
}

fn tower_scene(root: &Value, c: &Value) -> TowerScene {
    let s = &c["scene"];
    let imp = c["impassable"].as_str().expect("impassable");
    TowerScene {
        finished: s["finished"] == true,
        wall_col: int(&s["wallCol"]),
        gate_col: int(&s["gateCol"]),
        gate_row: int(&s["gateRow"]),
        gate_open: s["gateOpen"] == true,
        wall_ever_breached: s["wallEverBreached"] == true,
        wall_tiles_init: int(&s["wallTilesInit"]) as usize,
        wall_tile_rows: rows(&s["wallRows"]),
        tower_rows: rows(&s["towerRows"]),
        occupied: cells(&s["occ"]),
        blocked: cells(&root["impassable"][imp]),
        threats: c["threats"]
            .as_array()
            .map(|a| {
                a.iter()
                    .map(|t| Threat {
                        q: t[0].as_f64().expect("q"),
                        r: t[1].as_f64().expect("r"),
                        range: t[2].as_f64().expect("range"),
                    })
                    .collect()
            })
            .unwrap_or_default(),
        log: Vec::new(),
    }
}

fn enemies(c: &Value) -> Vec<SiegeEnemy> {
    c["enemies"]
        .as_array()
        .expect("enemies")
        .iter()
        .map(|e| SiegeEnemy {
            id: unit_id(e["id"].as_str().expect("id")),
            q: int(&e["q"]),
            r: int(&e["r"]),
            dead: e["dead"] == true,
            fading_out: e["fadingOut"] == true,
            routed: e["routed"] == true,
        })
        .collect()
}

/// Wywołanie podfunkcji zapisane w śladzie (pin albo port).
#[derive(Debug, Clone, PartialEq)]
struct Call {
    func: &'static str,
    /// Wynik: `bool` jako `"true"`/`"false"`, cel jako `bu.id`-identyfikator, brak celu = `"null"`.
    out: String,
    args: Vec<i64>,
    /// Efekty sceny do pierwszego kroku marszu włącznie (`move` / `attackGate` / `advance` / `done`).
    fx: Vec<String>,
}

fn func_name(s: &str) -> &'static str {
    match s {
        "_siegeRamTowerStep" => "ramTower",
        "_rangedTargetInRange" => "rangedTarget",
        "_targetInRange" => "target",
        "_trySiegeTowerClimb" => "climb",
        "_siegeInfantryToTowerStep" => "infantry",
        "_siegeApproachRestricted" => "restricted",
        "_siegeSafeApproach" => "safeApproach",
        o => panic!("podfunkcja {o}"),
    }
}

fn id_out(v: &Value) -> String {
    match v {
        Value::Null => "null".into(),
        Value::Bool(b) => b.to_string(),
        Value::String(s) => unit_id(s).to_string(),
        o => panic!("wynik {o}"),
    }
}

fn pin_trace(c: &Value) -> Vec<Call> {
    c["expect"]["trace"]
        .as_array()
        .expect("trace")
        .iter()
        .map(|s| Call {
            func: func_name(s["fn"].as_str().expect("fn")),
            out: id_out(&s["out"]),
            args: s["args"]
                .as_array()
                .expect("args")
                .iter()
                .map(int)
                .collect(),
            fx: s["fx"]
                .as_array()
                .expect("fx")
                .iter()
                .map(|f| {
                    let a = f.as_array().expect("fx");
                    let mut t = a[0].as_str().expect("fx").to_string();
                    for x in &a[1..] {
                        t.push_str(&format!(",{}", int(x)));
                    }
                    t
                })
                .collect(),
        })
        .collect()
}

/// Zdarzenia K3 -> efekty pinu ze stubem `_doMove` (marsz kończy się na pierwszym kroku; `Gate` bez odmowy pomijane).
fn fx_of(events: &[TowerEvent]) -> Vec<String> {
    let mut out = Vec::new();
    for ev in events {
        match *ev {
            TowerEvent::Gate { refused, col, row } => {
                if refused {
                    out.push(format!("refused,{col},{row}"));
                }
            }
            TowerEvent::Move { col, row } => {
                out.push(format!("move,{col},{row}"));
                return out;
            }
            TowerEvent::AttackGate => out.push("attackGate".into()),
            TowerEvent::AdvanceToward { col, row, .. } => out.push(format!("advance,{col},{row}")),
            TowerEvent::Done => out.push("done".into()),
            TowerEvent::Schedule { .. } | TowerEvent::AddRow { .. } => {}
        }
    }
    out
}

/// Wyniki pinu dla podfunkcji spoza H3 (kolejka wywołań z śladu pinu, w kolejności).
struct PinTargets {
    queue: VecDeque<Call>,
    log: Vec<Call>,
    fails: Vec<String>,
}

impl PinTargets {
    fn take(&mut self, func: &'static str, args: Vec<i64>) -> String {
        let pos = self.queue.iter().position(|c| c.func == func);
        // Wynik i efekty sceny z pinu (port tej podfunkcji poza H3); argumenty = wywołanie portu (ślad porównany
        // z pinem w `run_case`).
        let (out, fx) = match pos {
            Some(i) => {
                let c = self.queue.remove(i).expect("pozycja");
                (c.out, c.fx)
            }
            None => {
                self.fails
                    .push(format!("{func}: port woła, pin nie (brak w śladzie)"));
                ("null".into(), Vec::new())
            }
        };
        self.log.push(Call {
            func,
            out: out.clone(),
            args,
            fx,
        });
        out
    }

    fn target(&mut self, func: &'static str) -> Option<u64> {
        match self.take(func, Vec::new()).as_str() {
            "null" => None,
            s => Some(s.parse().expect("id")),
        }
    }
}

impl SiegeTargets for PinTargets {
    fn ranged_target_in_range(&mut self) -> Option<u64> {
        self.target("rangedTarget")
    }
    fn target_in_range(&mut self) -> Option<u64> {
        self.target("target")
    }
    fn safe_approach(&mut self, col: i64, row: i64) -> bool {
        self.take("safeApproach", vec![col, row]) == "true"
    }
}

/// Ślad portu: każde wywołanie [`SiegeManualEnv`] z wynikiem i efektami K3 tego wywołania.
struct TracingEnv<'a> {
    inner: TowerSiegeEnv<'a, PinTargets>,
    trace: Vec<Call>,
}

impl TracingEnv<'_> {
    fn real(
        &mut self,
        func: &'static str,
        f: impl FnOnce(&mut TowerSiegeEnv<'_, PinTargets>) -> bool,
    ) -> bool {
        let start = self.inner.events.len();
        let out = f(&mut self.inner);
        let fx = fx_of(&self.inner.events[start..]);
        self.trace.push(Call {
            func,
            out: out.to_string(),
            args: Vec::new(),
            fx,
        });
        out
    }

    fn pinned(&mut self) {
        let c = self.inner.targets.log.last().expect("wywołanie").clone();
        self.trace.push(c);
    }
}

impl SiegeManualEnv for TracingEnv<'_> {
    fn ram_tower_step(&mut self) -> bool {
        self.real("ramTower", |e| e.ram_tower_step())
    }
    fn ranged_target_in_range(&mut self) -> Option<u64> {
        let out = self.inner.ranged_target_in_range();
        self.pinned();
        out
    }
    fn target_in_range(&mut self) -> Option<u64> {
        let out = self.inner.target_in_range();
        self.pinned();
        out
    }
    fn tower_climb(&mut self) -> bool {
        self.real("climb", |e| e.tower_climb())
    }
    fn infantry_to_tower_step(&mut self) -> bool {
        self.real("infantry", |e| e.infantry_to_tower_step())
    }
    fn approach_restricted(&mut self) -> bool {
        self.real("restricted", |e| e.approach_restricted())
    }
    fn safe_approach(&mut self, col: i64, row: i64) -> bool {
        let out = self.inner.safe_approach(col, row);
        self.pinned();
        out
    }
}

fn label(s: &SiegeManualStep) -> String {
    match *s {
        SiegeManualStep::NotHandled(at) => format!("NotHandled({at:?})"),
        SiegeManualStep::RamTower { handled } => format!("RamTower({handled})"),
        SiegeManualStep::Shoot { .. } => "Shoot".into(),
        SiegeManualStep::WalkwayStrike { target } => {
            format!(
                "WalkwayStrike({})",
                if target.is_some() { "cel" } else { "brak" }
            )
        }
        SiegeManualStep::Climb => "Climb".into(),
        SiegeManualStep::InfantryToTower => "InfantryToTower".into(),
        SiegeManualStep::ApproachStrike { .. } => "ApproachStrike".into(),
        SiegeManualStep::ApproachClear(w) => format!("ApproachClear({w:?})"),
        SiegeManualStep::ApproachSafe { stepped, .. } => format!("ApproachSafe({stepped})"),
    }
}

/// Wynik jednego przypadku: decyzja portu albo lista rozbieżności.
struct CaseRun {
    step: SiegeManualStep,
    fails: Vec<String>,
}

type StepFn = fn(
    &civ_engine::domain::player_order_siege_manual::SiegeManualUnit,
    civ_engine::domain::player_order_siege_manual::SiegeManualScene,
    PlayerOrder,
    OrderDoctrine,
    &[SiegeEnemy],
    &mut TracingEnv<'_>,
) -> SiegeManualStep;

fn run_case(root: &Value, c: &Value, step_fn: StepFn) -> CaseRun {
    let mut unit = tower_unit(c);
    let mut scene = tower_scene(root, c);
    let order = order_of(c);
    let doc = order_doctrine(c);
    let ens = enemies(c);
    let mu = siege_manual_unit_of(&unit);
    let ms = siege_manual_scene_of(&scene);
    let pin = pin_trace(c);
    let mut targets = PinTargets {
        queue: pin
            .iter()
            .filter(|x| matches!(x.func, "rangedTarget" | "target" | "safeApproach"))
            .cloned()
            .collect(),
        log: Vec::new(),
        fails: Vec::new(),
    };
    let (step, trace) = {
        let mut env = TracingEnv {
            inner: TowerSiegeEnv {
                scene: &mut scene,
                unit: &mut unit,
                targets: &mut targets,
                events: Vec::new(),
            },
            trace: Vec::new(),
        };
        let step = step_fn(&mu, ms, order, doc, &ens, &mut env);
        (step, env.trace)
    };
    let mut fails = std::mem::take(&mut targets.fails);
    let e = &c["expect"];
    let tag = format!("{}:{}:{}", c["base"], c["unit"], order_name(order));
    if trace != pin {
        fails.push(format!("{tag}: ślad port {trace:?} != pin {pin:?}"));
    }
    if step.handled() != (e["ret"] == true) {
        fails.push(format!(
            "{tag}: handled {} != pin {}",
            step.handled(),
            e["ret"]
        ));
    }
    if i64::from(step.direct_done_calls()) != int(&e["doneCalls"]) {
        fails.push(format!(
            "{tag}: done {} != pin {} ({})",
            step.direct_done_calls(),
            e["doneCalls"],
            label(&step)
        ));
    }
    let pin_attacks: Vec<u64> = e["attacks"]
        .as_array()
        .expect("attacks")
        .iter()
        .map(|a| unit_id(a.as_str().expect("id")))
        .collect();
    let port_attacks: Vec<u64> = step.attack_target().into_iter().collect();
    if port_attacks != pin_attacks {
        fails.push(format!(
            "{tag}: _doAttack {port_attacks:?} != pin {pin_attacks:?}"
        ));
    }
    if i64::from(u8::from(step.clears_order())) != int(&e["refresh"]) {
        fails.push(format!(
            "{tag}: _refreshQueuedOrderVisuals != pin {}",
            e["refresh"]
        ));
    }
    let after = if step.clears_order() {
        "none"
    } else {
        order_name(order)
    };
    if after != e["orderAfter"] {
        fails.push(format!(
            "{tag}: playerOrder po {after} != pin {}",
            e["orderAfter"]
        ));
    }
    // `towerAtWallRows` po wywołaniu: tylko gdy pin nie wykonał kroku marszu (port K3 maszeruje dalej niż stub).
    if !pin
        .iter()
        .any(|x| x.fx.iter().any(|f| f.starts_with("move")))
    {
        let after_rows: Vec<i64> = scene.tower_rows.iter().copied().collect();
        let pin_rows: Vec<i64> = e["towerRowsAfter"]
            .as_array()
            .expect("towerRowsAfter")
            .iter()
            .map(int)
            .collect();
        if after_rows != pin_rows {
            fails.push(format!(
                "{tag}: towerAtWallRows {after_rows:?} != pin {pin_rows:?}"
            ));
        }
    }
    CaseRun { step, fails }
}

fn ported(
    u: &civ_engine::domain::player_order_siege_manual::SiegeManualUnit,
    s: civ_engine::domain::player_order_siege_manual::SiegeManualScene,
    o: PlayerOrder,
    d: OrderDoctrine,
    e: &[SiegeEnemy],
    env: &mut TracingEnv<'_>,
) -> SiegeManualStep {
    siege_manual_order_step(u, s, o, d, e, env)
}

fn report(label: &str, fails: &[String]) {
    assert!(
        fails.is_empty(),
        "{label}: {} rozbieżności, pierwsze: {:#?}",
        fails.len(),
        &fails[..fails.len().min(6)]
    );
}

#[test]
fn siege_manual_order_matches_pin_step_vectors() {
    let v = vectors();
    let orders = v["orders"].as_array().expect("orders");
    assert!(orders.len() >= 1500, "za mało przypadków: {}", orders.len());
    let mut fails = Vec::new();
    let mut hist: HashMap<String, usize> = HashMap::new();
    for c in orders {
        let run = run_case(&v, c, ported);
        *hist.entry(label(&run.step)).or_default() += 1;
        fails.extend(run.fails);
    }
    report("_performSiegeManualOrder", &fails);
    let mut h: Vec<_> = hist.iter().collect();
    h.sort();
    eprintln!("przypadki {}, histogram gałęzi: {h:?}", orders.len());
    // Pokrycie gałęzi (kryterium końca 1): każda gałąź pinu w wektorach.
    let need: [(&str, usize); 16] = [
        ("NotHandled(Gate)", 100),
        ("NotHandled(OtherSiegeUnit)", 20),
        ("NotHandled(IdleNoShot)", 30),
        ("NotHandled(Fallthrough)", 50),
        ("RamTower(true)", 50),
        ("Shoot", 5),
        ("WalkwayStrike(cel)", 1),
        ("WalkwayStrike(brak)", 20),
        ("Climb", 20),
        ("InfantryToTower", 50),
        ("ApproachStrike", 5),
        ("ApproachClear(TargetGone)", 5),
        ("ApproachClear(AtTarget)", 3),
        ("ApproachSafe(true)", 10),
        ("ApproachSafe(false)", 5),
        ("NotHandled(Fallthrough)", 1),
    ];
    for (k, n) in need {
        let got = hist.get(k).copied().unwrap_or(0);
        assert!(got >= n, "pokrycie {k}: {got} < {n}; histogram {hist:?}");
    }
}

/// Bramka wstępna `:18438` rozbita na trzy warunki (kryterium 1): `siegeWallCol < 0`, strona obrońcy, `move`.
#[test]
fn siege_manual_gate_conditions_covered_by_vectors() {
    let v = vectors();
    let mut wall = 0;
    let mut def = 0;
    let mut mv = 0;
    for c in v["orders"].as_array().expect("orders") {
        if c["expect"]["trace"].as_array().expect("trace").is_empty() && c["expect"]["ret"] == false
        {
            if int(&c["scene"]["wallCol"]) < 0 {
                wall += 1;
            } else if c["side"] != "atk" {
                def += 1;
            } else if c["order"] == "move" {
                mv += 1;
            }
        }
    }
    assert!(
        wall >= 20 && def >= 20 && mv >= 20,
        "bramka: mur {wall}, obrońca {def}, move {mv}"
    );
}

/// Wpięcie (D-416-1): wynik H3 jako `siege_manual_handled` w `perform_player_order` (`:18286`).
#[test]
fn siege_manual_handled_wires_into_perform_player_order() {
    struct NoMove;
    impl MoveGrid for NoMove {
        fn passable(&self, _c: i64, _r: i64) -> bool {
            unreachable!("gałąź move")
        }
        fn occupied(&self, _c: i64, _r: i64) -> bool {
            unreachable!("gałąź move")
        }
    }
    impl MoveOrderGates for NoMove {
        fn compact_allows(&self, _c: i64) -> bool {
            unreachable!("gałąź move")
        }
        fn blockade_allows(&self, _c: i64) -> bool {
            unreachable!("gałąź move")
        }
    }
    let v = vectors();
    let mut checked = 0;
    let mut fails = Vec::new();
    for c in v["orders"].as_array().expect("orders") {
        let order = order_of(c);
        if matches!(order, PlayerOrder::Move { .. }) {
            continue;
        }
        let run = run_case(&v, c, ported);
        let doc = order_doctrine(c);
        let mut attack_called = false;
        let out = perform_player_order(
            order,
            run.step.handled(),
            doc,
            || -> MoveOrderInput { unreachable!("gałąź move") },
            &NoMove,
            &NoMove,
            || {
                attack_called = true;
                civ_engine::domain::player_order_attack::AttackOrderStep::NoStep
            },
        );
        let ok = match order {
            PlayerOrder::Hold => out == PerformOrder::Hold,
            _ if run.step.handled() => out == PerformOrder::SiegeManual && !attack_called,
            PlayerOrder::None => matches!(out, PerformOrder::Doctrine(_) | PerformOrder::NoneDone),
            _ => matches!(out, PerformOrder::Attack(_)) && attack_called,
        };
        if !ok {
            fails.push(format!(
                "{}:{}: {out:?} przy {}",
                c["base"],
                c["unit"],
                label(&run.step)
            ));
        }
        checked += 1;
    }
    report("perform_player_order(siege_manual_handled)", &fails);
    assert!(checked >= 1300, "sprawdzono {checked}");
}

/// `_trySiegeTowerClimb` (`:8056-8084`, kryterium 2): port K3 `siege_tower_climb` na wektorach kroku #416.
#[test]
fn siege_tower_climb_matches_pin_step_vectors() {
    let v = vectors();
    let climbs = v["climbs"].as_array().expect("climbs");
    assert!(climbs.len() >= 450, "za mało: {}", climbs.len());
    let mut fails = Vec::new();
    let (mut yes, mut no, mut breach, mut nan) = (0, 0, 0, 0);
    for c in climbs {
        let mut unit = tower_unit(c);
        let mut scene = tower_scene(&v, c);
        if unit.walk.move_left.is_nan() {
            nan += 1;
        }
        let out = siege_tower_climb(&mut scene, &mut unit);
        let e = &c["expect"];
        let tag = format!("{}:{}", c["base"], c["unit"]);
        if out.handled != (e["ret"] == true) {
            fails.push(format!("{tag}: ret {} != pin {}", out.handled, e["ret"]));
        }
        let done = out
            .events
            .iter()
            .filter(|x| **x == TowerEvent::Done)
            .count() as i64;
        if done != int(&e["done"]) {
            fails.push(format!("{tag}: done {done} != pin {}", e["done"]));
        }
        if (unit.walk.q, unit.walk.r) != pair(&e["pos"]) {
            fails.push(format!(
                "{tag}: pozycja {:?} != pin {}",
                (unit.walk.q, unit.walk.r),
                e["pos"]
            ));
        }
        if unit.on_wall_walkway != (e["onWallWalkway"] == true) {
            fails.push(format!("{tag}: onWallWalkway != pin"));
        }
        let ml = move_left(&e["moveLeft"]);
        if !(unit.walk.move_left == ml || (ml.is_nan() && unit.walk.move_left.is_nan())) {
            fails.push(format!(
                "{tag}: moveLeft {} != pin {ml}",
                unit.walk.move_left
            ));
        }
        if scene.wall_ever_breached != (e["wallEverBreached"] == true) {
            fails.push(format!("{tag}: wallEverBreached != pin"));
        }
        let pin_log: Vec<String> = e["log"]
            .as_array()
            .expect("log")
            .iter()
            .map(|l| l.as_str().expect("log").to_string())
            .collect();
        if scene.log != pin_log {
            fails.push(format!("{tag}: log {:?} != pin {pin_log:?}", scene.log));
        }
        if !pin_log.is_empty() {
            assert_eq!(pin_log, vec![WYLOM_LOG.to_string()]);
            breach += 1;
        }
        let mut occ: Vec<(i64, i64)> = scene.occupied.iter().copied().collect();
        occ.sort_unstable();
        let pin_occ: Vec<(i64, i64)> = e["occ"].as_array().expect("occ").iter().map(pair).collect();
        if occ != pin_occ {
            fails.push(format!("{tag}: occByKey != pin"));
        }
        if out.handled {
            yes += 1;
        } else {
            no += 1;
        }
    }
    report("_trySiegeTowerClimb", &fails);
    assert!(
        yes >= 30 && no >= 200 && breach >= 20 && nan >= 5,
        "pokrycie: tak {yes}, nie {no}, wyłom {breach}, NaN {nan}"
    );
}

// --- mutanty (kryterium 3): każdy mutant musi dać rozbieżność na wektorach -------------------------------------------

/// Mutanty `_performSiegeManualOrder`: kopia funkcji portu z jedną zmianą (indeks `m`), uruchamiana na tych samych
/// wektorach; test wymaga, by każdy mutant miał co najmniej jedną rozbieżność z pinem.
fn mutant(
    m: u8,
    unit: &civ_engine::domain::player_order_siege_manual::SiegeManualUnit,
    scene: civ_engine::domain::player_order_siege_manual::SiegeManualScene,
    order: PlayerOrder,
    doctrine: OrderDoctrine,
    enemies: &[SiegeEnemy],
    env: &mut TracingEnv<'_>,
) -> SiegeManualStep {
    use civ_engine::domain::player_order_siege_manual::siege_manual_doctrine_auto;
    // M1: odwrócony warunek strony w bramce; M2: `move` przepuszczony przez bramkę.
    let gate_side = if m == 1 {
        unit.side_atk
    } else {
        !unit.side_atk
    };
    let gate_move = m != 2 && matches!(order, PlayerOrder::Move { .. });
    if !scene.wall_col_ge0 || gate_side || gate_move {
        return SiegeManualStep::NotHandled(NotHandledAt::Gate);
    }
    if unit.is_siege_unit {
        // M3: taran także przy otwartej bramie.
        let ram = if m == 3 {
            unit.is_ram
        } else {
            unit.is_ram && !scene.gate_open
        };
        if ram || unit.is_siege_tower {
            return SiegeManualStep::RamTower {
                handled: env.ram_tower_step(),
            };
        }
        return SiegeManualStep::NotHandled(NotHandledAt::OtherSiegeUnit);
    }
    // M4: odwrócone `doctrineAuto`.
    let auto = siege_manual_doctrine_auto(order, doctrine) != (m == 4);
    if order == PlayerOrder::None && !auto {
        // M5: pominięty `shootingEnabled`.
        let shoot = unit.can_shoot && (m == 5 || !unit.shooting_disabled);
        if shoot {
            if let Some(target) = env.ranged_target_in_range() {
                return SiegeManualStep::Shoot { target };
            }
        }
        return SiegeManualStep::NotHandled(NotHandledAt::IdleNoShot);
    }
    // M6: brak gałęzi `onWallWalkway`.
    if unit.on_wall_walkway && m != 6 {
        return SiegeManualStep::WalkwayStrike {
            target: env.target_in_range(),
        };
    }
    // M7: wieża (piechota) przed wspinaczką.
    if m == 7 {
        if env.infantry_to_tower_step() {
            return SiegeManualStep::InfantryToTower;
        }
        if env.tower_climb() {
            return SiegeManualStep::Climb;
        }
    } else {
        if env.tower_climb() {
            return SiegeManualStep::Climb;
        }
        if env.infantry_to_tower_step() {
            return SiegeManualStep::InfantryToTower;
        }
    }
    // M8: podejście ograniczone także dla `none` / `hold`.
    let attack = m == 8
        || matches!(
            order,
            PlayerOrder::Attack { .. } | PlayerOrder::AttackMove { .. }
        );
    if attack && env.approach_restricted() {
        if let Some(target) = env.target_in_range() {
            return SiegeManualStep::ApproachStrike { target };
        }
        let (tc, tr) = match order {
            PlayerOrder::AttackMove { col, row } => (col, row),
            PlayerOrder::Attack { target_id } => {
                // M9: cel uciekający (`routed`) uznany za żywy (brak filtra `_enemiesOf`).
                let t = enemies.iter().find(|u| {
                    !u.dead && !u.fading_out && (m == 9 || !u.routed) && u.id == target_id
                });
                match t {
                    Some(t) => (t.q, t.r),
                    None => return SiegeManualStep::ApproachClear(ApproachClear::TargetGone),
                }
            }
            _ => (unit.q, unit.r),
        };
        // M10: cel = pozycja bez wyczyszczenia rozkazu (przechodzi do `_siegeSafeApproach`).
        if m != 10 && unit.q == tc && unit.r == tr {
            return SiegeManualStep::ApproachClear(ApproachClear::AtTarget);
        }
        let stepped = env.safe_approach(tc, tr);
        // M11: zły `return` w podejściu ograniczonym (`false` zamiast `true` po nieudanym kroku).
        if m == 11 && !stepped {
            return SiegeManualStep::NotHandled(NotHandledAt::Fallthrough);
        }
        return SiegeManualStep::ApproachSafe {
            col: tc,
            row: tr,
            stepped,
        };
    }
    // M12: koniec funkcji zwraca `true`.
    if m == 12 {
        return SiegeManualStep::WalkwayStrike { target: None };
    }
    SiegeManualStep::NotHandled(NotHandledAt::Fallthrough)
}

macro_rules! mutant_fn {
    ($name:ident, $m:expr) => {
        fn $name(
            u: &civ_engine::domain::player_order_siege_manual::SiegeManualUnit,
            s: civ_engine::domain::player_order_siege_manual::SiegeManualScene,
            o: PlayerOrder,
            d: OrderDoctrine,
            e: &[SiegeEnemy],
            env: &mut TracingEnv<'_>,
        ) -> SiegeManualStep {
            mutant($m, u, s, o, d, e, env)
        }
    };
}
mutant_fn!(m0, 0);
mutant_fn!(m1, 1);
mutant_fn!(m2, 2);
mutant_fn!(m3, 3);
mutant_fn!(m4, 4);
mutant_fn!(m5, 5);
mutant_fn!(m6, 6);
mutant_fn!(m7, 7);
mutant_fn!(m8, 8);
mutant_fn!(m9, 9);
mutant_fn!(m10, 10);
mutant_fn!(m11, 11);
mutant_fn!(m12, 12);

#[test]
fn siege_manual_order_mutants_are_killed_by_vectors() {
    let v = vectors();
    let orders = v["orders"].as_array().expect("orders");
    let count = |f: StepFn| -> usize {
        orders
            .iter()
            .map(|c| usize::from(!run_case(&v, c, f).fails.is_empty()))
            .sum()
    };
    // M0 = kopia bez zmiany: zero rozbieżności (kontrola, że harness mutantów odtwarza port).
    assert_eq!(count(m0), 0, "mutant kontrolny M0 ma rozbieżności");
    let muts: [(u8, StepFn); 12] = [
        (1, m1),
        (2, m2),
        (3, m3),
        (4, m4),
        (5, m5),
        (6, m6),
        (7, m7),
        (8, m8),
        (9, m9),
        (10, m10),
        (11, m11),
        (12, m12),
    ];
    let mut alive = Vec::new();
    for (m, f) in muts {
        let k = count(f);
        eprintln!("mutant M{m}: rozbieżne przypadki {k}");
        if k == 0 {
            alive.push(m);
        }
    }
    assert!(alive.is_empty(), "mutanty żywe: {alive:?}");
}

/// Mutanty `_trySiegeTowerClimb` (port K3) na wektorach `climbs`: kopia z jedną zmianą.
#[test]
fn siege_tower_climb_mutants_are_killed_by_vectors() {
    let v = vectors();
    let climbs = v["climbs"].as_array().expect("climbs");
    const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];
    let climb_m = |m: u8, scene: &mut TowerScene, u: &mut TowerUnit| -> bool {
        if (m != 1 && u.on_wall_walkway)
            || !u.side_atk
            || scene.wall_col < 0
            || u.is_siege_unit
            || (m != 2 && u.mounted)
        {
            return false;
        }
        if scene.tower_rows.is_empty() {
            return false;
        }
        let wb = scene.wall_col - 1;
        let (q, r) = (u.walk.q, u.walk.r);
        let can = DIRS4.iter().any(|&(dc, dr)| {
            if m == 3 {
                q + dc == wb && scene.tower_rows.contains(&r)
            } else {
                q + dc == wb && scene.tower_rows.contains(&(r + dr))
            }
        });
        if !can {
            return false;
        }
        let wc = scene.wall_col;
        if (m != 4 && !scene.wall_tile_rows.contains(&r))
            || (m != 5 && scene.occupied.contains(&(wc, r)))
        {
            return false;
        }
        scene.occupied.remove(&(q, r));
        u.walk.q = wc;
        u.on_wall_walkway = true;
        if m != 6 && !scene.wall_ever_breached {
            scene.wall_ever_breached = true;
            scene.log.push(WYLOM_LOG.to_string());
        }
        scene.occupied.insert((wc, r));
        if m != 7 {
            u.walk.move_left = 0.0;
        }
        true
    };
    for m in 0..=7u8 {
        let mut diff = 0;
        for c in climbs {
            let mut unit = tower_unit(c);
            let mut scene = tower_scene(&v, c);
            let ret = climb_m(m, &mut scene, &mut unit);
            let e = &c["expect"];
            let ml = move_left(&e["moveLeft"]);
            let same = ret == (e["ret"] == true)
                && (unit.walk.q, unit.walk.r) == pair(&e["pos"])
                && unit.on_wall_walkway == (e["onWallWalkway"] == true)
                && (unit.walk.move_left == ml || (ml.is_nan() && unit.walk.move_left.is_nan()))
                && scene.wall_ever_breached == (e["wallEverBreached"] == true)
                && scene.log.len() == e["log"].as_array().expect("log").len();
            if !same {
                diff += 1;
            }
        }
        if m == 0 {
            assert_eq!(diff, 0, "mutant kontrolny wspinaczki ma rozbieżności");
        } else {
            assert!(diff > 0, "mutant wspinaczki M{m} żywy");
        }
    }
}
