//! R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 (#404, krok T3): rozkaz ruchu `_performPlayerOrder` (`hold` / `none` /
//! `move`, `battleScene.ts:18280-18353`) i `_firstStepTowardMoveDestination` (`:18478-18527`) z pinu `07d2fbd72`.
//!
//! Wektory: `p6_k5loop_wiring_a_pin_vectors/move_order_step_vectors.json`, generowane przez
//! `p6_k5loop_wiring_a_gen.mjs` (`WIRING_A_MOVE_ORDER_STEPS=1`), który WYKONUJE cały tekst pinu (strażnik SHA-256): scena
//! pinu z ustawionym stanem, jedno wywołanie metody, decyzja zapisana z opakowań `_doMove` / `_doAttack` /
//! `_executeGroupDoctrineStep` / `_firstStepTowardMoveDestination`. Wejścia predykatów spoza tego kroku (teren
//! `_passableForUnit`, `occByKey`, `_compactAttackAllowsStep`, `_destAllowedByBlockade`, `_adjacentEnemy`) są w wektorze;
//! `_shouldAvoidAutoBacktrack`, bramka `steady` BFS i `firingTiles` liczy port (porównanie z wartością pinu).

use std::collections::{HashMap, HashSet};

use civ_engine::domain::player_order_move::{
    firing_tiles, first_step_toward_move_destination, move_order_step, perform_player_order,
    FiringEnemy, FiringShooter, MoveGrid, MoveOrderGates, MoveOrderInput, MoveOrderStep, MoveRoute,
    OrderDoctrine, PerformOrder, PlayerOrder, BF_COLS, BF_ROWS, MOVE_ORDER_MAX_VISITED,
};
use civ_engine::domain::player_order_move_gate::{
    should_avoid_auto_backtrack, BacktrackUnit, GroupDoctrine as GateDoctrine, GroupMeta,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_step::{effective_doctrine, is_unit_doctrine_auto};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_wiring_a_pin_vectors/move_order_step_vectors.json");
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

fn doctrine(s: &str) -> GroupDoctrine {
    match s {
        "defensive" => GroupDoctrine::Defensive,
        "steady" => GroupDoctrine::Steady,
        "aggressive" => GroupDoctrine::Aggressive,
        "skirmish" => GroupDoctrine::Skirmish,
        "manual" => GroupDoctrine::Manual,
        d => panic!("doktryna {d}"),
    }
}

fn gate(d: GroupDoctrine) -> GateDoctrine {
    match d {
        GroupDoctrine::Defensive => GateDoctrine::Defensive,
        GroupDoctrine::Steady => GateDoctrine::Steady,
        GroupDoctrine::Aggressive => GateDoctrine::Aggressive,
        GroupDoctrine::Skirmish => GateDoctrine::Skirmish,
        GroupDoctrine::Manual => GateDoctrine::Manual,
    }
}

fn doctrine_name(d: GroupDoctrine) -> &'static str {
    match d {
        GroupDoctrine::Defensive => "defensive",
        GroupDoctrine::Steady => "steady",
        GroupDoctrine::Aggressive => "aggressive",
        GroupDoctrine::Skirmish => "skirmish",
        GroupDoctrine::Manual => "manual",
    }
}

/// Plansza z wektora: pola nieprzejezdne całej planszy (scena + rodzaj jednostki), poza planszą = Plains (przejezdne,
/// `battle-terrain.ts:781-783`), zajętość = klucze `occByKey`.
struct VecGrid<'a> {
    impassable: &'a HashSet<(i64, i64)>,
    occ: HashSet<(i64, i64)>,
}

impl MoveGrid for VecGrid<'_> {
    fn passable(&self, col: i64, row: i64) -> bool {
        !self.impassable.contains(&(col, row))
    }
    fn occupied(&self, col: i64, row: i64) -> bool {
        self.occ.contains(&(col, row))
    }
}

/// Bramki z wektora: wartości pinu dla kolumn `q-1..q+1` (krok rozkazu zawsze w tym oknie).
struct VecGates {
    q: i64,
    compact: [bool; 3],
    blockade: [bool; 3],
}

impl VecGates {
    fn ix(&self, col: i64) -> usize {
        let d = col - (self.q - 1);
        assert!(
            (0..3).contains(&d),
            "bramka dla kolumny {col} poza oknem q={}",
            self.q
        );
        usize::try_from(d).expect("indeks")
    }
}

impl MoveOrderGates for VecGates {
    fn compact_allows(&self, col: i64) -> bool {
        self.compact[self.ix(col)]
    }
    fn blockade_allows(&self, col: i64) -> bool {
        self.blockade[self.ix(col)]
    }
}

fn bools3(v: &Value) -> [bool; 3] {
    let a = v.as_array().expect("lista");
    assert_eq!(a.len(), 3);
    [0, 1, 2].map(|i| a[i].as_bool().expect("bool"))
}

/// Doktryna jednostki przypadku: `(unitDoctrine, groupId truthy, wpis _groupMeta grupy)`.
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

/// Port `_shouldAvoidAutoBacktrack` (K5EXEC-T2) i bramki `steady` BFS (`_isUnitDoctrineAuto && meta.doctrine ===
/// 'steady'`) z doktryny przypadku.
fn backtrack_inputs(od: OrderDoctrine) -> (bool, bool) {
    let avoid = should_avoid_auto_backtrack(BacktrackUnit {
        unit_doctrine: od.unit_doctrine.map(gate),
        has_group_id: od.has_group,
        group_meta: od.group.map(|(d, a)| GroupMeta {
            doctrine: gate(d),
            auto_play: a,
        }),
    });
    let meta = effective_doctrine(
        od.unit_doctrine,
        if od.has_group {
            od.group.map(|g| g.0)
        } else {
            None
        },
    );
    let steady = is_unit_doctrine_auto(od.unit_doctrine, od.has_group, od.group)
        && meta == GroupDoctrine::Steady;
    (avoid, steady)
}

fn firing_of(c: &Value) -> HashSet<(i64, i64)> {
    let enemies: Vec<FiringEnemy> = c["enemies"]
        .as_array()
        .expect("enemies")
        .iter()
        .map(|e| FiringEnemy {
            q: int(&e["q"]),
            r: int(&e["r"]),
            dead: e["dead"].as_bool().expect("dead"),
            fading_out: e["fadingOut"].as_bool().expect("fadingOut"),
            routed: e["routed"].as_bool().expect("routed"),
        })
        .collect();
    firing_tiles(
        &FiringShooter {
            ranged_base: c["rangedBase"].as_bool().expect("rangedBase"),
            can_shoot: c["canShoot"].as_bool().expect("canShoot"),
            shooting_enabled: c["shootingEnabled"].as_bool().expect("shootingEnabled"),
            range: c["range"].as_f64().expect("range"),
        },
        &enemies,
    )
}

struct Boards {
    impassable: HashMap<String, HashSet<(i64, i64)>>,
}

impl Boards {
    fn new(v: &Value) -> Self {
        let impassable = v["impassable"]
            .as_object()
            .expect("impassable")
            .iter()
            .map(|(k, list)| {
                (
                    k.clone(),
                    list.as_array().expect("lista").iter().map(pair).collect(),
                )
            })
            .collect();
        Self { impassable }
    }

    fn grid<'a>(&'a self, c: &Value) -> VecGrid<'a> {
        let key = format!(
            "{}|{}",
            c["base"].as_str().expect("base"),
            if c["mounted"].as_bool().expect("mounted") {
                1
            } else {
                0
            }
        );
        VecGrid {
            impassable: self.impassable.get(&key).expect("plansza sceny"),
            occ: c["occ"].as_array().expect("occ").iter().map(pair).collect(),
        }
    }
}

/// Klucz wroga z indeksu listy strony przeciwnej (`this.def` / `this.atk` sceny, kolejność pinu).
fn enemy_key(c: &Value, idx: usize) -> String {
    c["enemies"][idx]["id"]
        .as_str()
        .expect("id wroga")
        .to_owned()
}

/// Klasa decyzji (pokrycie).
fn class_of(step: &MoveOrderStep, inp: &MoveOrderInput) -> String {
    let dc = (inp.target.0 - inp.pos.0).signum();
    let dr = (inp.target.1 - inp.pos.1).signum();
    let route = |r: &MoveRoute| match r {
        MoveRoute::Greedy if dc != 0 && dr != 0 => "zachlanny-skosny",
        MoveRoute::Greedy => "zachlanny-prosty",
        MoveRoute::SideCol => "obejscie-kolumna",
        MoveRoute::SideRow => "obejscie-rzad",
        MoveRoute::Bfs => "bfs",
    };
    let base = match step {
        MoveOrderStep::ReachedTarget => "cel-pozycja".to_owned(),
        MoveOrderStep::Attack(_) => "sasiedni-wrog".to_owned(),
        MoveOrderStep::NoRoute => "bfs-brak-drogi".to_owned(),
        MoveOrderStep::CompactBlocked { route: r, .. } => format!("blokada-zwarcia/{}", route(r)),
        MoveOrderStep::BlockadeBlocked { route: r, .. } => format!("blokada-linii/{}", route(r)),
        MoveOrderStep::Move { route: r, .. } => format!("ruch/{}", route(r)),
    };
    if inp.avoid_auto_backtrack {
        format!("{base}+unik-cofania")
    } else {
        base
    }
}

/// Porównanie decyzji gałęzi `move` z zapisem pinu; zwraca listę różnic.
fn check_move(c: &Value, step: &MoveOrderStep, inp: &MoveOrderInput) -> Vec<String> {
    let e = &c["expect"];
    let mut d = Vec::new();
    if e["ret"] != true || e["doneCalls"] != 1 {
        d.push(format!("ret/done pinu {} {}", e["ret"], e["doneCalls"]));
    }
    let lamf_in = inp.last_auto_move_from;
    let (kind, st, attack, order_after, lamf): (&str, Option<(i64, i64)>, Option<String>, &str, _) =
        match *step {
            MoveOrderStep::ReachedTarget => ("done", None, None, "none", lamf_in),
            MoveOrderStep::Attack(i) => ("attack", None, Some(enemy_key(c, i)), "move", lamf_in),
            MoveOrderStep::NoRoute | MoveOrderStep::CompactBlocked { .. } => {
                ("done", None, None, "move", lamf_in)
            }
            MoveOrderStep::BlockadeBlocked { order_done, .. } => (
                "done",
                None,
                None,
                if order_done { "none" } else { "move" },
                lamf_in,
            ),
            MoveOrderStep::Move {
                col,
                row,
                order_done,
                prev,
                ..
            } => (
                "move",
                Some((col, row)),
                None,
                if order_done { "none" } else { "move" },
                prev.or(lamf_in),
            ),
        };
    if e["kind"] != kind {
        d.push(format!("rodzaj {kind} != {}", e["kind"]));
    }
    if opt_pair(&e["step"]) != st {
        d.push(format!("krok {st:?} != {}", e["step"]));
    }
    if e["attack"].as_str().map(str::to_owned) != attack {
        d.push(format!("cel {attack:?} != {}", e["attack"]));
    }
    if e["orderAfter"] != order_after {
        d.push(format!("rozkaz po {order_after} != {}", e["orderAfter"]));
    }
    if opt_pair(&e["lastAutoMoveFrom"]) != lamf {
        d.push(format!(
            "lastAutoMoveFrom {lamf:?} != {}",
            e["lastAutoMoveFrom"]
        ));
    }
    let want_route = e.get("route").map(opt_pair);
    if want_route != step.bfs_result() {
        d.push(format!("BFS {:?} != {want_route:?}", step.bfs_result()));
    }
    if want_route.is_some() {
        if e["routeMax"].as_f64() != Some(MOVE_ORDER_MAX_VISITED) {
            d.push(format!("limit BFS pinu {}", e["routeMax"]));
        }
        if e["routeAllow"].as_bool() != Some(inp.avoid_auto_backtrack) {
            d.push(format!("allowFirstStep pinu {}", e["routeAllow"]));
        }
    }
    d
}

fn move_input(c: &Value) -> MoveOrderInput {
    let od = order_doctrine(c);
    let (avoid, steady) = backtrack_inputs(od);
    MoveOrderInput {
        pos: pair(&c["pos"]),
        target: pair(&c["target"]),
        adjacent_enemy: c["adjacent"]
            .as_u64()
            .map(|i| usize::try_from(i).expect("idx")),
        avoid_auto_backtrack: avoid,
        last_auto_move_from: opt_pair(&c["lastAutoMoveFrom"]),
        bfs_steady: steady,
        firing: firing_of(c),
    }
}

fn gates_of(c: &Value) -> VecGates {
    VecGates {
        q: pair(&c["pos"]).0,
        compact: bools3(&c["compact"]),
        blockade: bools3(&c["blockade"]),
    }
}

/// Wejścia liczone portem = wartości pinu zapisane w przypadku.
fn check_inputs(c: &Value, inp: &MoveOrderInput) -> Vec<String> {
    let mut d = Vec::new();
    if c["avoidBacktrack"].as_bool() != Some(inp.avoid_auto_backtrack) {
        d.push(format!(
            "_shouldAvoidAutoBacktrack {} != {}",
            inp.avoid_auto_backtrack, c["avoidBacktrack"]
        ));
    }
    if c["bfsSteady"].as_bool() != Some(inp.bfs_steady) {
        d.push(format!(
            "bramka steady BFS {} != {}",
            inp.bfs_steady, c["bfsSteady"]
        ));
    }
    let od = order_doctrine(c);
    let auto = is_unit_doctrine_auto(od.unit_doctrine, od.has_group, od.group);
    if c["doctrineAuto"].as_bool() != Some(auto) {
        d.push(format!(
            "_isUnitDoctrineAuto {auto} != {}",
            c["doctrineAuto"]
        ));
    }
    let meta = effective_doctrine(
        od.unit_doctrine,
        if od.has_group {
            od.group.map(|g| g.0)
        } else {
            None
        },
    );
    if c["metaDoctrine"].as_str() != Some(doctrine_name(meta)) {
        d.push(format!(
            "meta.doctrine {} != {}",
            doctrine_name(meta),
            c["metaDoctrine"]
        ));
    }
    d
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

/// Gałąź `move` `_performPlayerOrder` (`:18297-18352`) bajt w bajt z pinem na każdym przypadku.
#[test]
fn rozkaz_ruchu_move_zgodny_z_pinem() {
    let v = vectors();
    let boards = Boards::new(&v);
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 900, "przypadków {}", cases.len());
    let mut fails = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    for (i, c) in cases.iter().enumerate() {
        assert_eq!(c["order"], "move");
        let inp = move_input(c);
        for x in check_inputs(c, &inp) {
            fails.push(format!("#{i} {}: {x}", c["unit"]));
        }
        let grid = boards.grid(c);
        let gates = gates_of(c);
        let step = move_order_step(&inp, &grid, &gates);
        for x in check_move(c, &step, &inp) {
            fails.push(format!(
                "#{i} {} {:?}->{:?}: {x}",
                c["unit"], inp.pos, inp.target
            ));
        }
        // Ta sama decyzja przez wejście `_performPlayerOrder` (gałąź `move` nie czyta `_performSiegeManualOrder`).
        let via = perform_player_order(
            PlayerOrder::Move {
                col: inp.target.0,
                row: inp.target.1,
            },
            false,
            order_doctrine(c),
            || inp.clone(),
            &grid,
            &gates,
            || unreachable!("gałąź attack/attackMove (T4) poza wektorami T3"),
        );
        if via != PerformOrder::Move(step) {
            fails.push(format!(
                "#{i}: perform_player_order {via:?} != Move({step:?})"
            ));
        }
        if !inp.firing.is_empty() {
            *cov.entry("pola-ostrzalu-niepuste".into()).or_default() += 1;
        }
        *cov.entry(class_of(&step, &inp)).or_default() += 1;
        // N-E1: przypadki przy krawędzi planszy (scena z zdjętym ogrodzeniem, test granic BFS `:18509`).
        if let Some(edge) = c.get("edge").and_then(Value::as_str) {
            *cov.entry(format!("brzeg-{edge}")).or_default() += 1;
            if c["expect"].get("route").is_some() {
                *cov.entry("brzeg-bfs".into()).or_default() += 1;
            }
        }
    }
    report("move", &fails);
    eprintln!("pokrycie move: {cov:?}");
    let sum = |pfx: &str| -> usize {
        cov.iter()
            .filter(|(k, _)| k.starts_with(pfx))
            .map(|(_, n)| *n)
            .sum()
    };
    for (k, n) in [
        ("cel-pozycja", 20),
        ("sasiedni-wrog", 100),
        ("ruch/zachlanny-prosty", 10),
        ("ruch/zachlanny-skosny", 100),
        ("ruch/obejscie-kolumna", 20),
        ("ruch/obejscie-rzad", 10),
        ("ruch/bfs", 15),
        ("bfs-brak-drogi", 15),
        ("blokada-zwarcia", 20),
        ("blokada-linii", 20),
    ] {
        assert!(sum(k) >= n, "pokrycie {k}: {} < {n}; {cov:?}", sum(k));
    }
    // Unik cofania (`_shouldAvoidAutoBacktrack`) w ruchu i blokadzie zwarcia.
    let avoid: usize = cov
        .iter()
        .filter(|(k, _)| k.starts_with("ruch/") && k.ends_with("+unik-cofania"))
        .map(|(_, n)| *n)
        .sum();
    assert!(avoid >= 30, "ruch z unikiem cofania {avoid} < 30");
    for k in ["brzeg-c0", "brzeg-cMax", "brzeg-r0", "brzeg-rMax"] {
        at_least(&cov, k, 50);
    }
    at_least(&cov, "brzeg-bfs", 30);
    at_least(&cov, "pola-ostrzalu-niepuste", 20);
}

/// `_firstStepTowardMoveDestination` (`:18478-18527`) wołane wprost: limit odwiedzin (`1..1024`), `allowFirstStep`,
/// `firingTiles` strzelca, bramka `steady` (`lastAutoMoveFrom`).
#[test]
fn pierwszy_krok_bfs_zgodny_z_pinem() {
    let v = vectors();
    let boards = Boards::new(&v);
    let cases = v["firstStep"].as_array().expect("firstStep");
    assert!(cases.len() >= 400, "przypadków {}", cases.len());
    let mut fails = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    let mut bump = |k: &str| *cov.entry(k.to_owned()).or_default() += 1;
    for (i, c) in cases.iter().enumerate() {
        let od = order_doctrine(c);
        let (_, steady) = backtrack_inputs(od);
        if c["bfsSteady"].as_bool() != Some(steady) {
            fails.push(format!(
                "#{i}: bramka steady {steady} != {}",
                c["bfsSteady"]
            ));
        }
        let grid = boards.grid(c);
        let banned: Option<HashSet<(i64, i64)>> =
            c["banned"].as_array().map(|a| a.iter().map(pair).collect());
        let allow = |col: i64, row: i64| banned.as_ref().is_none_or(|b| !b.contains(&(col, row)));
        let allow_dyn: &dyn Fn(i64, i64) -> bool = &allow;
        let firing = firing_of(c);
        let lamf = opt_pair(&c["lastAutoMoveFrom"]);
        let got = first_step_toward_move_destination(
            &grid,
            pair(&c["pos"]),
            pair(&c["target"]),
            c["maxVisited"].as_f64().expect("maxVisited"),
            banned.as_ref().map(|_| allow_dyn),
            if steady { lamf } else { None },
            &firing,
        );
        let want = opt_pair(&c["expect"]);
        if got != want {
            fails.push(format!(
                "#{i} {:?}->{:?} limit {} zakaz {}: {got:?} != {want:?}",
                pair(&c["pos"]),
                pair(&c["target"]),
                c["maxVisited"],
                c["banned"]
            ));
        }
        let lim = c["maxVisited"].as_f64().expect("max") < MOVE_ORDER_MAX_VISITED;
        bump(if want.is_some() {
            "droga"
        } else {
            "brak-drogi"
        });
        if lim {
            bump("limit<1024");
        }
        if banned.is_some() {
            bump("allowFirstStep");
        }
        if !firing.is_empty() {
            bump("firingTiles");
            if want.is_some() {
                bump("firingTiles+droga");
            }
        }
        if let Some(edge) = c.get("edge").and_then(Value::as_str) {
            bump(&format!("brzeg-{edge}"));
            if want.is_some() {
                bump("brzeg-droga");
            }
        }
        if steady && lamf.is_some() {
            bump("steady-lastAutoMoveFrom");
        }
    }
    report("firstStep", &fails);
    eprintln!("pokrycie BFS: {cov:?}");
    for (k, n) in [
        ("droga", 80),
        ("brak-drogi", 80),
        ("limit<1024", 100),
        ("allowFirstStep", 100),
        ("firingTiles", 30),
        ("firingTiles+droga", 20),
        ("steady-lastAutoMoveFrom", 20),
        ("brzeg-c0", 50),
        ("brzeg-cMax", 50),
        ("brzeg-r0", 50),
        ("brzeg-rMax", 50),
        ("brzeg-droga", 60),
    ] {
        at_least(&cov, k, n);
    }
}

/// `hold` (`:18282-18285`) i `none` (`:18287-18296`): `done()` albo `_executeGroupDoctrineStep(ru, meta, done)`.
#[test]
fn rozkaz_hold_none_zgodny_z_pinem() {
    let v = vectors();
    let boards = Boards::new(&v);
    let cases = v["doctrineCases"].as_array().expect("doctrineCases");
    assert!(cases.len() >= 100, "przypadków {}", cases.len());
    let mut fails = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    for (i, c) in cases.iter().enumerate() {
        let order = match c["order"].as_str() {
            Some("hold") => PlayerOrder::Hold,
            Some("none") => PlayerOrder::None,
            o => panic!("rozkaz {o:?}"),
        };
        // Generator pomija `none` atakującego przy murze (bramka `_performSiegeManualOrder` `:18436`, H3), więc
        // w tych przypadkach oblężenie ręczne nie obsługuje rozkazu (`siege_manual_handled` = false).
        let siege_manual =
            int(&c["wallCol"]) >= 0 && c["side"] == "atk" && order == PlayerOrder::None;
        assert!(
            !siege_manual,
            "#{i}: przypadek z bramką oblężenia ręcznego (H3)"
        );
        let grid = boards.grid(c);
        let gates = gates_of(c);
        let got = perform_player_order(
            order,
            siege_manual,
            order_doctrine(c),
            || unreachable!("gałąź move"),
            &grid,
            &gates,
            || unreachable!("gałąź attack/attackMove (T4) poza wektorami T3"),
        );
        let e = &c["expect"];
        let (kind, meta) = match got {
            PerformOrder::Hold | PerformOrder::NoneDone => ("done", None),
            PerformOrder::Doctrine(d) => ("doctrine", Some(doctrine_name(d))),
            other => panic!("#{i}: nieoczekiwane {other:?}"),
        };
        if e["kind"] != kind
            || e["meta"].as_str() != meta
            || e["ret"] != true
            || e["doneCalls"] != 1
        {
            fails.push(format!("#{i} {}: {got:?} != {e}", c["order"]));
        }
        *cov.entry(format!("{}/{kind}", c["order"].as_str().expect("o")))
            .or_default() += 1;
    }
    report("hold/none", &fails);
    eprintln!("pokrycie hold/none: {cov:?}");
    at_least(&cov, "hold/done", 30);
    at_least(&cov, "none/doctrine", 30);
    at_least(&cov, "none/done", 8);
}

/// `firingTiles` (`:18484-18498`): granice planszy, zasięg niecałkowity i ujemny, wróg nieżywy.
/// N-E2: `siege_manual_handled` = WYNIK `_performSiegeManualOrder` (`:18286`). Gdy `true`, rozkaz `none` kończy się
/// na oblężeniu ręcznym (H3); gdy `false` (także po przejściu bramki `:18436`), `none` idzie do gałęzi `:18287-18296`.
/// `hold` jest sprawdzany przed oblężeniem ręcznym (`:18282`), a `move` jest z niego wyłączony (`ord.type !== 'move'`).
#[test]
fn oblezenie_reczne_tylko_gdy_obsluzone() {
    let v = vectors();
    let boards = Boards::new(&v);
    let cases = v["doctrineCases"].as_array().expect("doctrineCases");
    let c = cases
        .iter()
        .find(|c| c["order"] == "none" && c["expect"]["kind"] == "doctrine")
        .expect("przypadek none z doktryną");
    let grid = boards.grid(c);
    let gates = gates_of(c);
    let run = |order: PlayerOrder, handled: bool| {
        perform_player_order(
            order,
            handled,
            order_doctrine(c),
            || move_input(c),
            &grid,
            &gates,
            || unreachable!("gałąź attack/attackMove (T4) poza wektorami T3"),
        )
    };
    assert_eq!(run(PlayerOrder::None, true), PerformOrder::SiegeManual);
    assert!(matches!(
        run(PlayerOrder::None, false),
        PerformOrder::Doctrine(_)
    ));
    assert_eq!(run(PlayerOrder::Hold, true), PerformOrder::Hold);
    let mv = v["cases"].as_array().expect("cases")[0].clone();
    let mgrid = boards.grid(&mv);
    let mgates = gates_of(&mv);
    let inp = move_input(&mv);
    let target = PlayerOrder::Move {
        col: inp.target.0,
        row: inp.target.1,
    };
    let a = perform_player_order(
        target,
        true,
        order_doctrine(&mv),
        || inp.clone(),
        &mgrid,
        &mgates,
        || unreachable!("gałąź attack/attackMove (T4) poza wektorami T3"),
    );
    let b = perform_player_order(
        target,
        false,
        order_doctrine(&mv),
        || inp.clone(),
        &mgrid,
        &mgates,
        || unreachable!("gałąź attack/attackMove (T4) poza wektorami T3"),
    );
    assert_eq!(a, b);
    assert!(matches!(a, PerformOrder::Move(_)));
}

#[test]
fn pola_ostrzalu_brzegi() {
    let sh = |range: f64| FiringShooter {
        ranged_base: true,
        can_shoot: true,
        shooting_enabled: true,
        range,
    };
    let e = |q, r| FiringEnemy {
        q,
        r,
        dead: false,
        fading_out: false,
        routed: false,
    };
    // Zasięg 2 wokół (0, 0): romb 13 pól bez środka, przycięty do planszy (ćwiartka: 5 pól).
    let t = firing_tiles(&sh(2.0), &[e(0, 0)]);
    let want: HashSet<(i64, i64)> = [(0, 1), (0, 2), (1, 0), (2, 0), (1, 1)]
        .into_iter()
        .collect();
    assert_eq!(t, want);
    // Zasięg niecałkowity: klucze `q + 2.5` nie trafiają w pola całkowite; ujemny i NaN: pętla pusta.
    for r in [2.5, -1.0, f64::NAN] {
        assert!(firing_tiles(&sh(r), &[e(10, 10)]).is_empty(), "zasięg {r}");
    }
    // Wróg martwy / znikający / uciekający pominięty; strzelec bez amunicji albo bez strzelania: brak pól.
    let mut dead = e(10, 10);
    dead.dead = true;
    assert!(firing_tiles(&sh(3.0), &[dead]).is_empty());
    let mut no = sh(3.0);
    no.can_shoot = false;
    assert!(firing_tiles(&no, &[e(10, 10)]).is_empty());
    no = sh(3.0);
    no.shooting_enabled = false;
    assert!(firing_tiles(&no, &[e(10, 10)]).is_empty());
    // Krawędź dolna/prawa planszy.
    let t = firing_tiles(&sh(1.0), &[e(BF_COLS - 1, BF_ROWS - 1)]);
    assert_eq!(t.len(), 2);
}
