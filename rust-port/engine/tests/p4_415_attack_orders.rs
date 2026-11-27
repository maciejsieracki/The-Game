//! R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 (#415, krok T4): rozkazy gracza `attackMove` / `attack`
//! (`_performPlayerOrder`, `battleScene.ts:18353-18428`), `_attackMovePath` (`:18535-18566`) i
//! `_firstStepOnAttackMovePath` (`:18568-18572`) z pinu `07d2fbd72`.
//!
//! Wektory: `p6_k5loop_wiring_a_pin_vectors/attack_order_step_vectors.json`, generowane przez
//! `p6_k5loop_wiring_a_gen.mjs` (`WIRING_A_ATTACK_ORDER_STEPS=1`), który WYKONUJE cały tekst pinu (strażnik SHA-256):
//! scena pinu z ustawionym stanem, jedno wywołanie `_performPlayerOrder`, decyzja zapisana z opakowań `_doMove` /
//! `_doAttack`. Wejścia predykatów spoza kroku są w wektorze: teren `_passableForUnit`, `occByKey` z klasą zajmującego
//! (`_isPlayerSide`), `_destAllowedByBlockade` i `_compactAttackAllowsStep` każdej kolumny, `_priorityScore` każdego
//! wroga, `_shouldAvoidAutoBacktrack`; `_canStrikeTargetFrom` = dziennik zapytań pinu z tego wywołania (port pyta
//! wyłącznie o pola z dziennika, inaczej rozbieżność). `_firstStepAlongPathToAttack` liczy port
//! [`first_step_along_path_to_attack`] (T4a) na tej samej planszy; ślad wywołań porównany z pinem.

use std::cell::RefCell;
use std::collections::{HashMap, HashSet};

use civ_engine::domain::player_order_attack::{
    attack_move_order_step, attack_move_path, attack_move_threats, attack_order_step,
    first_step_on_attack_move_path, AttackEnemy, AttackOrderEnv, AttackOrderInput, AttackOrderStep,
    AttackPathGrid, AttackRoute, Occupant,
};
use civ_engine::domain::player_order_move::{
    perform_player_order, MoveGrid, MoveOrderGates, MoveOrderInput, OrderDoctrine, PerformOrder,
    PlayerOrder, BF_COLS, BF_ROWS,
};
use civ_engine::domain::siege_tactics_autobatch::{cell_key, AutoBatchEnv, BatchBoard, BatchState};
use civ_engine::domain::siege_tactics_autophase::AutoBatchIntent;
use civ_engine::domain::siege_tactics_pathstep::first_step_along_path_to_attack;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_wiring_a_pin_vectors/attack_order_step_vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const PIN_SHA256: &str = "3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d";

fn vectors() -> Value {
    let v: Value = serde_json::from_str(VECTORS).expect("json");
    assert_eq!(v["pin"], PIN);
    assert_eq!(v["pinSha256"], PIN_SHA256, "wektory z innego tekstu pinu");
    assert_eq!(v["bfCols"].as_i64(), Some(BF_COLS));
    assert_eq!(v["bfRows"].as_i64(), Some(BF_ROWS));
    v
}

fn int(v: &Value) -> i64 {
    v.as_i64()
        .unwrap_or_else(|| panic!("liczba całkowita: {v}"))
}

fn pair(v: &Value) -> (i64, i64) {
    (int(&v[0]), int(&v[1]))
}

fn opt_pair(v: &Value) -> Option<(i64, i64)> {
    (!v.is_null()).then(|| pair(v))
}

fn opt_path(v: &Value) -> Option<Vec<(i64, i64)>> {
    (!v.is_null()).then(|| v.as_array().expect("droga").iter().map(pair).collect())
}

/// `bu.id` (`'a0'`, `'d3'`, …) -> `u64` (atakujący 1000+n, obrońca 2000+n, inny napis = brak w rosterze).
fn unit_id(s: &str) -> u64 {
    let n = |t: &str| t.parse::<u64>().ok();
    match (s.chars().next(), n(&s[1.min(s.len())..])) {
        (Some('a'), Some(k)) => 1000 + k,
        (Some('d'), Some(k)) => 2000 + k,
        _ => u64::MAX,
    }
}

/// Wywołanie `_firstStepAlongPathToAttack`: (allow podany, cel, wynik).
type FsCall = (bool, usize, Option<(i64, i64)>);

/// Plansze nieprzejezdności (`_passableForUnit`) per scena i rodzaj jednostki.
struct Boards {
    impassable: HashMap<String, HashSet<(i64, i64)>>,
}

impl Boards {
    fn new(v: &Value) -> Self {
        let mut impassable = HashMap::new();
        for (k, list) in v["impassable"].as_object().expect("impassable") {
            let set = list.as_array().expect("lista").iter().map(pair).collect();
            impassable.insert(k.clone(), set);
        }
        Self { impassable }
    }
}

/// Scena jednego przypadku: wejścia predykatów pinu.
struct Scene<'a> {
    impassable: &'a HashSet<(i64, i64)>,
    occ: HashMap<(i64, i64), Occupant>,
    blockade: Vec<bool>,
    compact: Vec<bool>,
    priority: Vec<f64>,
    strike: HashMap<(i64, i64, usize), bool>,
    /// Zapytania `_canStrikeTargetFrom` portu spoza dziennika pinu (rozbieżność).
    missing: RefCell<Vec<(i64, i64, usize)>>,
    /// Ślad `_firstStepAlongPathToAttack` portu: (allow podany, cel, wynik).
    fs_calls: RefCell<Vec<FsCall>>,
}

impl<'a> Scene<'a> {
    fn new(boards: &'a Boards, c: &Value) -> Self {
        let key = format!(
            "{}|{}",
            c["base"].as_str().expect("base"),
            if c["mounted"] == true { 1 } else { 0 }
        );
        let impassable = boards
            .impassable
            .get(&key)
            .unwrap_or_else(|| panic!("plansza {key}"));
        let mut occ = HashMap::new();
        for o in c["occ"].as_array().expect("occ") {
            let k = match o[2].as_str().expect("klasa") {
                "self" => Occupant::SelfUnit,
                "player" => Occupant::PlayerSide,
                "other" => Occupant::OtherSide,
                x => panic!("klasa {x}"),
            };
            occ.insert((int(&o[0]), int(&o[1])), k);
        }
        let bools = |k: &str| -> Vec<bool> {
            c[k].as_array()
                .expect(k)
                .iter()
                .map(|b| b.as_bool().expect("bool"))
                .collect()
        };
        let mut strike = HashMap::new();
        if let Some(list) = c["strike"].as_array() {
            for s in list {
                #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
                let e = int(&s[2]) as usize;
                let val = s[3].as_bool().expect("wynik");
                let prev = strike.insert((int(&s[0]), int(&s[1]), e), val);
                assert!(prev.is_none_or(|p| p == val), "dziennik niespójny");
            }
        }
        Self {
            impassable,
            occ,
            blockade: bools("blockade"),
            compact: bools("compact"),
            priority: c["priority"]
                .as_array()
                .expect("priority")
                .iter()
                .map(|p| p.as_f64().expect("f64"))
                .collect(),
            strike,
            missing: RefCell::new(Vec::new()),
            fs_calls: RefCell::new(Vec::new()),
        }
    }

    fn col(&self, v: &[bool], col: i64) -> bool {
        let i = usize::try_from(col).unwrap_or_else(|_| panic!("kolumna {col}"));
        *v.get(i).unwrap_or_else(|| panic!("kolumna {col}"))
    }
}

impl AttackPathGrid for Scene<'_> {
    fn passable(&self, col: i64, row: i64) -> bool {
        // Poza planszą `terrainMap.at` = Plains (`battle-terrain.ts:781-783`); BFS sprawdza granice wcześniej.
        !self.impassable.contains(&(col, row))
    }
    fn occupant(&self, col: i64, row: i64) -> Occupant {
        self.occ
            .get(&(col, row))
            .copied()
            .unwrap_or(Occupant::Empty)
    }
    fn blockade_allows(&self, col: i64) -> bool {
        self.col(&self.blockade, col)
    }
}

/// Środowisko T4a (`_firstStepAlongPathToAttack`): `_passableForUnit` z planszy przypadku.
struct PathEnv<'a> {
    impassable: &'a HashSet<(i64, i64)>,
}

impl AutoBatchEnv for PathEnv<'_> {
    fn plan_unit(&mut self, _b: &mut BatchBoard, _u: &str, _i: &mut AutoBatchIntent) {
        panic!("poza zakresem T4");
    }
    fn check_end(&mut self, _st: &mut BatchState) -> bool {
        panic!("poza zakresem T4");
    }
    #[allow(clippy::cast_possible_truncation)]
    fn passable_for_unit(&mut self, _st: &BatchState, _u: &str, col: f64, row: f64) -> bool {
        !self.impassable.contains(&(col as i64, row as i64))
    }
    fn do_move(&mut self, _st: &mut BatchState, _u: &str, _c: f64, _r: f64) {
        panic!("poza zakresem T4");
    }
    fn apply_terrain_range(&mut self, _st: &mut BatchState, _u: &str) {
        panic!("poza zakresem T4");
    }
    fn do_attack(&mut self, _st: &mut BatchState, _a: &str, _t: &str) {
        panic!("poza zakresem T4");
    }
    fn flee_step(&mut self, _st: &mut BatchState, _u: &str) {
        panic!("poza zakresem T4");
    }
    fn remove_unit_from_scene(&mut self, _st: &mut BatchState, _u: &str) {
        panic!("poza zakresem T4");
    }
    fn shake_allies_on_loss(&mut self, _st: &mut BatchState, _u: &str) {
        panic!("poza zakresem T4");
    }
    fn can_strike_target_from(
        &mut self,
        _st: &BatchState,
        _a: &str,
        _c: f64,
        _r: f64,
        _t: &str,
    ) -> bool {
        panic!("is_goal liczy wołający");
    }
}

impl AttackOrderEnv for Scene<'_> {
    fn compact_allows(&self, col: i64) -> bool {
        self.col(&self.compact, col)
    }
    fn can_strike_from(&self, col: i64, row: i64, enemy: usize) -> bool {
        if let Some(&v) = self.strike.get(&(col, row, enemy)) {
            v
        } else {
            self.missing.borrow_mut().push((col, row, enemy));
            false
        }
    }
    fn priority_score(&self, enemy: usize) -> f64 {
        self.priority[enemy]
    }
    #[allow(clippy::cast_precision_loss, clippy::cast_possible_truncation)]
    fn first_step_along_path_to_attack(
        &self,
        allow: Option<&dyn Fn(i64, i64) -> bool>,
        enemy: usize,
    ) -> Option<(i64, i64)> {
        // Pin `_firstStepAlongPathToAttack` (`:8565-8622`) = port T4a; `occByKey` z przypadku (z jednostką `ru`).
        let mut board = BatchBoard::default();
        for &(c, r) in self.occ.keys() {
            board
                .occ
                .insert(cell_key(c as f64, r as f64), format!("occ@{c},{r}"));
        }
        let st = BatchState::new(board);
        let start = self
            .occ
            .iter()
            .find(|(_, o)| **o == Occupant::SelfUnit)
            .map(|(p, _)| *p)
            .expect("ru w occByKey");
        let mut env = PathEnv {
            impassable: self.impassable,
        };
        let is_goal = |c: f64, r: f64| self.can_strike_from(c as i64, r as i64, enemy);
        let allow_f = allow.map(|a| move |c: f64, r: f64| a(c as i64, r as i64));
        let allow_dyn: Option<&dyn Fn(f64, f64) -> bool> =
            allow_f.as_ref().map(|f| f as &dyn Fn(f64, f64) -> bool);
        let out = first_step_along_path_to_attack(
            &mut env,
            &st,
            "ru",
            (start.0 as f64, start.1 as f64),
            &is_goal,
            allow_dyn,
        )
        .map(|(c, r)| (c as i64, r as i64));
        self.fs_calls
            .borrow_mut()
            .push((allow.is_some(), enemy, out));
        out
    }
}

/// Atrapy T3 (gałąź `move` nie jest wołana dla `attack` / `attackMove`).
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

fn no_doctrine() -> OrderDoctrine {
    OrderDoctrine {
        unit_doctrine: None,
        has_group: false,
        group: None,
    }
}

fn enemies(c: &Value) -> Vec<AttackEnemy> {
    c["enemies"]
        .as_array()
        .expect("enemies")
        .iter()
        .map(|e| AttackEnemy {
            id: unit_id(e["id"].as_str().expect("id")),
            q: int(&e["q"]),
            r: int(&e["r"]),
            dead: e["dead"] == true,
            fading_out: e["fadingOut"] == true,
            routed: e["routed"] == true,
            removed: e["removed"] == true,
        })
        .collect()
}

fn order_of(c: &Value) -> PlayerOrder {
    match c["order"].as_str() {
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

fn report(label: &str, fails: &[String]) {
    assert!(
        fails.is_empty(),
        "{label}: {} rozbieżności, pierwsze: {:#?}",
        fails.len(),
        &fails[..fails.len().min(12)]
    );
}

fn at_least(cov: &HashMap<String, usize>, key: &str, n: usize) {
    let got = cov.get(key).copied().unwrap_or(0);
    assert!(got >= n, "pokrycie {key}: {got} < {n}; {cov:?}");
}

/// Porównanie decyzji portu z zapisem pinu (`expect`); zwraca listę rozbieżności.
fn check_step(c: &Value, step: &AttackOrderStep, last_before: Option<(i64, i64)>) -> Vec<String> {
    let e = &c["expect"];
    let order = c["order"].as_str().expect("order");
    let mut out = Vec::new();
    let (kind, st, atk, after, last_after) = match *step {
        AttackOrderStep::Attack(i) => ("attack", None, Some(i), order, last_before),
        AttackOrderStep::OrderCleared => ("done", None, None, "none", last_before),
        AttackOrderStep::NoStep | AttackOrderStep::BlockadeBlocked { .. } => {
            ("done", None, None, order, last_before)
        }
        AttackOrderStep::Move { col, row, prev, .. } => {
            ("move", Some((col, row)), None, order, prev.or(last_before))
        }
    };
    if e["kind"] != kind {
        out.push(format!("kind {step:?} != {}", e["kind"]));
    }
    if opt_pair(&e["step"]) != st {
        out.push(format!("krok {st:?} != {}", e["step"]));
    }
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let pin_atk = e["attack"].as_i64().map(|x| x as usize);
    if pin_atk != atk {
        out.push(format!("cel {atk:?} != {pin_atk:?}"));
    }
    if e["orderAfter"] != after {
        out.push(format!("rozkaz po {after} != {}", e["orderAfter"]));
    }
    if opt_pair(&e["lastAutoMoveFrom"]) != last_after {
        out.push(format!(
            "lastAutoMoveFrom {last_after:?} != {}",
            e["lastAutoMoveFrom"]
        ));
    }
    if e["ret"] != true || e["doneCalls"] != 1 {
        out.push(format!("ret/done {} {}", e["ret"], e["doneCalls"]));
    }
    out
}

/// Gałęzie `attackMove` i `attack` `_performPlayerOrder` (`:18353-18428`) bajt w bajt z pinem na każdym przypadku,
/// z dziennikiem `_canStrikeTargetFrom`, śladem `_attackMovePath` i `_firstStepAlongPathToAttack`.
#[test]
fn rozkazy_attack_i_attack_move_zgodne_z_pinem() {
    let v = vectors();
    let boards = Boards::new(&v);
    let cases = v["orders"].as_array().expect("orders");
    assert!(cases.len() >= 1000, "przypadków {}", cases.len());
    let mut fails = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    let mut bump = |k: String| *cov.entry(k).or_default() += 1;
    for (i, c) in cases.iter().enumerate() {
        let order = order_of(c);
        let e = &c["expect"];
        let siege = e["siegeManual"] == true;
        let scene = Scene::new(&boards, c);
        let ens = enemies(c);
        let last_before = opt_pair(&c["lastAutoMoveFrom"]);
        let inp = AttackOrderInput {
            pos: pair(&c["pos"]),
            enemies: &ens,
            avoid_auto_backtrack: c["avoidBacktrack"] == true,
            last_auto_move_from: last_before,
        };
        let compute = || match order {
            PlayerOrder::AttackMove { col, row } => {
                attack_move_order_step(&inp, (col, row), &scene)
            }
            PlayerOrder::Attack { target_id } => attack_order_step(&inp, target_id, &scene),
            _ => unreachable!(),
        };
        let via = perform_player_order(
            order,
            siege,
            no_doctrine(),
            || -> MoveOrderInput { unreachable!("gałąź move") },
            &NoMove,
            &NoMove,
            compute,
        );
        if siege {
            // `_performSiegeManualOrder` obsłużył rozkaz (H3): `_performPlayerOrder` kończy na `:18286`.
            if via != PerformOrder::SiegeManual || e["ret"] != true {
                fails.push(format!("#{i}: oblężenie ręczne {via:?}"));
            }
            bump(format!(
                "{}/oblezenie-reczne",
                c["order"].as_str().expect("o")
            ));
            continue;
        }
        let PerformOrder::Attack(step) = via else {
            fails.push(format!("#{i}: {via:?} nie jest gałęzią ataku"));
            continue;
        };
        for x in check_step(c, &step, last_before) {
            fails.push(format!("#{i} {} {}: {x}", c["unit"], c["order"]));
        }
        let missing = scene.missing.borrow();
        if !missing.is_empty() {
            fails.push(format!(
                "#{i}: _canStrikeTargetFrom spoza dziennika pinu {:?}",
                &missing[..missing.len().min(4)]
            ));
        }
        // Ślad `_firstStepAlongPathToAttack`: (allow podany, cel, wynik) w kolejności wywołań.
        let pin_fs: Vec<FsCall> = e["fsCalls"]
            .as_array()
            .expect("fsCalls")
            .iter()
            .map(|f| {
                #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
                let t = int(&f["target"]) as usize;
                (f["allow"] == true, t, opt_pair(&f["out"]))
            })
            .collect();
        if *scene.fs_calls.borrow() != pin_fs {
            fails.push(format!(
                "#{i}: ślad _firstStepAlongPathToAttack {:?} != {pin_fs:?}",
                scene.fs_calls.borrow()
            ));
        }
        // Ślad `_attackMovePath` (`attackMove`: trasa `true`, potem ewentualnie krok `false`).
        let pin_am = e["amPath"].as_array().expect("amPath");
        if let PlayerOrder::AttackMove { col, row } = order {
            let route = attack_move_path(&scene, inp.pos, (col, row), true);
            if pin_am.first().map(|p| opt_path(&p["out"])) != Some(route.clone())
                || pin_am[0]["allow"] != true
            {
                fails.push(format!("#{i}: trasa attackMove != pin"));
            }
            let waypoint = matches!(
                step,
                AttackOrderStep::NoStep
                    | AttackOrderStep::BlockadeBlocked {
                        route: AttackRoute::Waypoint,
                        ..
                    }
                    | AttackOrderStep::Move {
                        route: AttackRoute::Waypoint,
                        ..
                    }
            );
            if pin_am.len() != 1 + usize::from(waypoint)
                || (waypoint
                    && (pin_am[1]["allow"] != false
                        || opt_path(&pin_am[1]["out"])
                            != attack_move_path(&scene, inp.pos, (col, row), false)))
            {
                fails.push(format!(
                    "#{i}: ślad _attackMovePath ({} wywołań)",
                    pin_am.len()
                ));
            }
            let threats = attack_move_threats(&inp, route.as_deref(), &scene);
            if threats.len() > 1 {
                bump("attackMove/wiele-zagrozen".into());
                let (a, b) = (threats[0], threats[1]);
                if scene.priority[a].to_bits() == scene.priority[b].to_bits() {
                    bump("attackMove/remis-priorytetu".into());
                }
            }
            if ens
                .iter()
                .any(|x| x.removed && !x.dead && !x.fading_out && !x.routed)
                && !threats.is_empty()
            {
                bump("attackMove/removed-w-rosterze".into());
            }
            let fs_out = pin_fs.first().map(|f| f.2);
            if !pin_fs.is_empty()
                && !matches!(
                    step,
                    AttackOrderStep::Move {
                        route: AttackRoute::Threat,
                        ..
                    }
                )
            {
                bump(format!(
                    "attackMove/zagrozenie-bez-kroku-{}",
                    if fs_out.flatten().is_some() {
                        "blokada"
                    } else {
                        "brak"
                    }
                ));
            }
        } else if !pin_am.is_empty() {
            fails.push(format!("#{i}: attack wołał _attackMovePath"));
        }
        let kind = match step {
            AttackOrderStep::Attack(_) => "atak".to_string(),
            AttackOrderStep::OrderCleared => "rozkaz-none".to_string(),
            AttackOrderStep::NoStep => "brak-kroku".to_string(),
            AttackOrderStep::BlockadeBlocked { route, .. } => format!("blokada-{route:?}"),
            AttackOrderStep::Move { route, prev, .. } => {
                format!(
                    "ruch-{route:?}{}",
                    if prev.is_some() { "-prev" } else { "" }
                )
            }
        };
        bump(format!("{}/{kind}", c["order"].as_str().expect("o")));
        if let PlayerOrder::Attack { target_id } = order {
            if step == AttackOrderStep::OrderCleared {
                let why = match ens.iter().find(|x| x.id == target_id) {
                    None => "brak-w-rosterze",
                    Some(x) if x.dead => "dead",
                    Some(x) if x.fading_out => "fadingOut",
                    Some(x) if x.routed => "routed",
                    Some(_) => "inne",
                };
                bump(format!("attack/none-{why}"));
            }
            if let Some(Some(_)) = pin_fs.first().map(|f| f.2) {
                if let Some(l) = last_before {
                    if inp.avoid_auto_backtrack
                        && (l.0 - inp.pos.0).abs() + (l.1 - inp.pos.1).abs() == 1
                    {
                        bump("attack/unik-cofania-sasiad".into());
                    }
                }
            }
            if !pin_fs.is_empty() {
                let (q, r) = inp.pos;
                if [(q, r - 1), (q + 1, r), (q, r + 1), (q - 1, r)]
                    .iter()
                    .any(|&(c2, _)| (0..BF_COLS).contains(&c2) && !scene.compact[c2 as usize])
                {
                    bump("attack/compact-odmawia-sasiada".into());
                }
            }
        }
    }
    report("attack/attackMove", &fails);
    // `_destAllowedByBlockade` po `_firstStepOnAttackMovePath` (`:18392`) jest nieosiągalne jako odmowa: BFS
    // `_attackMovePath` odrzuca już każde pole z kolumną spoza blokady (`:18554`), więc krok trasy zawsze ją spełnia.
    assert_eq!(cov.get("attackMove/blokada-Waypoint"), None, "{cov:?}");
    eprintln!("pokrycie: {cov:?}");
    for k in [
        "attackMove/atak",
        "attackMove/ruch-Threat",
        "attackMove/ruch-Waypoint",
        "attackMove/brak-kroku",
        "attackMove/rozkaz-none",
        "attackMove/wiele-zagrozen",
        "attack/atak",
        "attack/ruch-Target",
        "attack/ruch-Target-prev",
        "attack/brak-kroku",
        "attack/rozkaz-none",
        "attack/none-dead",
        "attack/none-brak-w-rosterze",
        "attack/unik-cofania-sasiad",
        "attack/compact-odmawia-sasiada",
        "attack/oblezenie-reczne",
        "attackMove/oblezenie-reczne",
        "attack/blokada-Target",
        "attack/none-fadingOut",
        "attack/none-routed",
        "attackMove/remis-priorytetu",
        "attackMove/removed-w-rosterze",
        "attackMove/zagrozenie-bez-kroku-blokada",
    ] {
        at_least(&cov, k, 3);
    }
}

/// `_attackMovePath` (`:18535-18566`) i `_firstStepOnAttackMovePath` (`:18568-18572`) wprost: obie wartości
/// `allowEnemyCells`, zajętość z klasą strony, blokada, teren; scena otwarta = limit `queue.length < BF_COLS*BF_ROWS`.
#[test]
fn droga_attack_move_zgodna_z_pinem() {
    let v = vectors();
    let boards = Boards::new(&v);
    let cases = v["paths"].as_array().expect("paths");
    assert!(cases.len() >= 400, "przypadków {}", cases.len());
    let mut fails = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    for (i, c) in cases.iter().enumerate() {
        let scene = Scene::new(&boards, c);
        let pos = pair(&c["pos"]);
        let target = pair(&c["target"]);
        let allow = c["allow"] == true;
        let got = attack_move_path(&scene, pos, target, allow);
        let want = opt_path(&c["expect"]);
        if got != want {
            fails.push(format!(
                "#{i} {pos:?}->{target:?} allow={allow}: {:?} != {:?}",
                got.as_ref().map(Vec::len),
                want.as_ref().map(Vec::len)
            ));
        }
        let fs = first_step_on_attack_move_path(&scene, pos, target);
        if fs != opt_pair(&c["firstStep"]) {
            fails.push(format!("#{i}: pierwszy krok {fs:?} != {}", c["firstStep"]));
        }
        let open = c["open"] == true;
        let k = format!(
            "{}{}/{}",
            if open { "otwarta-" } else { "" },
            if allow { "wrogowie" } else { "zajete" },
            if want.is_some() { "droga" } else { "brak" }
        );
        *cov.entry(k).or_default() += 1;
        if pos == target {
            *cov.entry("cel=start".into()).or_default() += 1;
        }
        if want.as_ref().is_some_and(|p| {
            p.iter()
                .any(|t| scene.occupant(t.0, t.1) == Occupant::OtherSide)
        }) {
            *cov.entry("droga-przez-wroga".into()).or_default() += 1;
        }
    }
    report("_attackMovePath", &fails);
    eprintln!("pokrycie drogi: {cov:?}");
    for k in [
        "wrogowie/droga",
        "wrogowie/brak",
        "zajete/droga",
        "zajete/brak",
        "otwarta-wrogowie/droga",
        "otwarta-zajete/droga",
        "droga-przez-wroga",
    ] {
        at_least(&cov, k, 3);
    }
}

/// Kolejność zagrożeń `attackMove` (`:18365-18366`): `_priorityScore`, przy remisie (także `NaN`) odległość Manhattan,
/// stabilnie. Przypadki syntetyczne poza sceną pinu (kontrakt komparatora `a - b || m`).
#[test]
fn kolejnosc_zagrozen_priorytet_potem_manhattan() {
    struct S {
        prio: Vec<f64>,
    }
    impl AttackPathGrid for S {
        fn passable(&self, _c: i64, _r: i64) -> bool {
            true
        }
        fn occupant(&self, _c: i64, _r: i64) -> Occupant {
            Occupant::Empty
        }
        fn blockade_allows(&self, _c: i64) -> bool {
            true
        }
    }
    impl AttackOrderEnv for S {
        fn compact_allows(&self, _c: i64) -> bool {
            true
        }
        fn can_strike_from(&self, _c: i64, _r: i64, _e: usize) -> bool {
            true
        }
        fn priority_score(&self, e: usize) -> f64 {
            self.prio[e]
        }
        fn first_step_along_path_to_attack(
            &self,
            _a: Option<&dyn Fn(i64, i64) -> bool>,
            _e: usize,
        ) -> Option<(i64, i64)> {
            None
        }
    }
    let mk = |q: i64, r: i64| AttackEnemy {
        id: 1,
        q,
        r,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
    };
    let ens = [mk(15, 10), mk(11, 10), mk(12, 10), mk(11, 10)];
    let inp = AttackOrderInput {
        pos: (10, 10),
        enemies: &ens,
        avoid_auto_backtrack: false,
        last_auto_move_from: None,
    };
    let route = [(10, 10)];
    let s = S {
        prio: vec![0.0, 1.0, 1.0, 1.0],
    };
    assert_eq!(
        attack_move_threats(&inp, Some(&route), &s),
        vec![0, 1, 3, 2]
    );
    let s = S {
        prio: vec![1.45, 1.0, f64::NAN, 1.0],
    };
    // NaN: komparator wraca do Manhattan (`NaN || m`); wynik jak w V8 dla tej tablicy (sortowanie wstawianiem).
    assert_eq!(
        attack_move_threats(&inp, Some(&route), &s),
        vec![1, 3, 2, 0]
    );
    assert!(attack_move_threats(&inp, None, &s).is_empty());
}
