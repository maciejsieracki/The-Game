//! P6 SIEGE-TAKTYKA K5LOOP-SIEGE-ATK-A (dispatch R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1, T2a, Operator r1): zgodność
//! `ProdBody` z pinem `07d2fbd72` dla ATAKUJĄCEGO przy murze w `_activateUnit` (`battleScene.ts:6048-6299`):
//! - `_trySiegeTowerClimb` (`:8056-8084`): wejście na koronę od wieży, pierwszy wyłom (`wallEverBreached`, wpis
//!   dziennika), `occByKey`, `onWallWalkway`, `moveLeft = 0`;
//! - `_siegeInfantryToTowerStep` (`:8087-8101`): marsz `_siegeWalkTo` pod wieżę;
//! - `_siegeRamTowerStep` (`:8022-8053`): taran (atak bramy = tag T2b, marsz BFS z `prefRow`, `_advanceToward`), wieża
//!   (dopisanie wiersza, marsz BFS z `arrive`, `_advanceToward` z `arrive`);
//! - `_advanceToward` (`:7892-7916`) katapulty (`:6214-6216`) i fallback taranu/wieży;
//! - `_siegeWalkTo`/`_bfsFirstStep`/`_doMove` (`:8006-8019`, `:7973-8003`, `:8685-8776`): kroki, koszt terenu, bród,
//!   `_updateFacing` z nowego pola, czas (`MOVE_STEP_MS` + `STEP_GAP_MS`).
//!
//! Pozostałe gałęzie atakującego przy murze mają jawne tagi (`oblezenie`, `atak-muru`, `atak-bramy`).
//!
//! Wektory: `p6_k5loop_siege_atk_a_vectors/vectors.json` (oraz `vectors_nan.json`: `moveLeft` NaN, koszt terenu NaN),
//! generowane przez `p6_k5loop_siege_atk_a_gen.mjs`, który WYKONUJE tekst pinu (strażnik SHA-256 wycinków).
//!
//! Porównanie na każdym wektorze: ślad aktywacji (zdarzenia maszyny i wywołania gałęzi), czas aktywacji, kroki `Move`
//! (pole i chwila), zmiany `facing` z chwilą, `ClimbWall` i dziennik, stan końcowy (pole, `moveLeft` bitowo, `facing`,
//! `onWallWalkway`, morale), `towerAtWallRows`, `wallEverBreached`, `occByKey`, tag nieportowanej gałęzi.

use std::collections::{BTreeMap, BTreeSet};
use std::sync::mpsc;
use std::time::Duration;

use civ_engine::domain::siege_tactics_actions::{actions_to_dto, ActionError, BattleAction};
use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_atk::WYLOM_LOG;
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::RollSource;
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_siege_atk_a_vectors/vectors.json");
const VECTORS_NAN: &str = include_str!("p6_k5loop_siege_atk_a_vectors/vectors_nan.json");
/// Obrona r1: `_advanceToward` przy krawędzi planszy (zarzut 1, mutant E04) i piechota pod wieżę z `moveLeft = 0`
/// (zarzut 2, gałąź `inf-walk-idle`).
const VECTORS_EDGE: &str = include_str!("p6_k5loop_siege_atk_a_vectors/vectors_edge.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5loop_siege_atk_a_gen.mjs`).
const PIN_SHA256: &str = "c3ec239034bcf0351fc4da09ce073e2e727e9e56805e878a2d54a03642b87325";
/// Lekcja NaN: strażnik czasu testu pętli marszu (`moveLeft = NaN` nie kończy marszu z braku ruchu).
const LOOP_GUARD: Duration = Duration::from_secs(90);

/// Gałęzie atakującego nie rzucają kośćmi: każdy rzut = panika (rzut, którego pin nie robi).
struct NoRolls;

impl RollSource for NoRolls {
    fn next_unit(&mut self) -> f64 {
        panic!("rzut w galezi atakujacego przy murze (pin nie wola _singleBlow)")
    }
}

fn b(v: &Value) -> bool {
    v.as_bool().expect("bool")
}
fn bo(v: &Value) -> bool {
    v.as_bool().unwrap_or(false)
}
fn num(v: &Value) -> f64 {
    match v.as_str() {
        Some("NaN") => f64::NAN,
        Some("Infinity") => f64::INFINITY,
        Some("-Infinity") => f64::NEG_INFINITY,
        _ => v.as_f64().expect("liczba"),
    }
}
fn int(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
}
fn num_or(v: &Value, d: f64) -> f64 {
    if v.is_null() {
        d
    } else {
        num(v)
    }
}
fn same_f64(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}

fn tag_of(u: UnitRef) -> String {
    match u.side {
        BattleSide::Attacker => format!("atk{}", u.idx),
        BattleSide::Defender => format!("def{}", u.idx),
    }
}

/// Teren z wektora: mur w `wallCol` nieprzechodni poza otwartą bramą (`gateRow - 1`, `gateRow`), kafle specjalne
/// (przechodniość, koszt, bród). Ta sama reguła co `terrainMapOf` generatora.
struct VecTerrain {
    wall_col: i64,
    gate_row: i64,
    gate_open: bool,
    tiles: BTreeMap<(i64, i64), (bool, f64, bool)>,
}

impl VecTerrain {
    fn from(t: &Value) -> Self {
        let mut tiles = BTreeMap::new();
        for x in t["tiles"].as_array().expect("tiles") {
            tiles.insert(
                (int(&x["c"]), int(&x["r"])),
                (b(&x["pass"]), num(&x["cost"]), b(&x["ford"])),
            );
        }
        VecTerrain {
            wall_col: int(&t["wallCol"]),
            gate_row: int(&t["gateRow"]),
            gate_open: b(&t["gateOpen"]),
            tiles,
        }
    }
    fn key(col: f64, row: f64) -> (i64, i64) {
        assert!(col.fract() == 0.0 && row.fract() == 0.0, "pole calkowite");
        (col as i64, row as i64)
    }
}

impl MoveTerrain for VecTerrain {
    fn passable(&self, col: f64, row: f64) -> bool {
        let (c, r) = Self::key(col, row);
        let wall = c == self.wall_col
            && !(self.gate_open && (r == self.gate_row - 1 || r == self.gate_row));
        !wall && self.tiles.get(&(c, r)).is_none_or(|t| t.0)
    }
    fn move_cost(&self, col: f64, row: f64) -> f64 {
        self.tiles.get(&Self::key(col, row)).map_or(1.0, |t| t.1)
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.tiles.get(&Self::key(col, row)).is_some_and(|t| t.2)
    }
    fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
        // `cavalryTerrainMultiplier('Plaskie (rownina/laka)')` = 1 (jedyny teren walki generatora).
        1.0
    }
}

fn act(u: &Value, side_atk: bool, doctrine_auto: bool) -> ActivateUnit {
    let ammo = num_or(&u["ammoLeft"], 0.0);
    let ranged_base = bo(&u["rangedBase"]);
    ActivateUnit {
        side_atk,
        q: int(&u["q"]),
        r: int(&u["r"]),
        dead: false,
        fading_out: false,
        routed: false,
        never_rout: bo(&u["neverRout"]),
        surround_applied: bo(&u["surroundApplied"]),
        morale: num_or(&u["morale"], 100.0),
        flee_morale: num_or(&u["fleeMorale"], 0.0),
        terrain_defence_mult: num_or(&u["tdm"], 1.0),
        range: num_or(&u["range"], 1.0),
        on_wall_walkway: bo(&u["onWall"]),
        primary_ranged: bo(&u["primaryRanged"]),
        mounted: bo(&u["mounted"]),
        phalanx: bo(&u["phalanx"]),
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        // Pin `canShoot(ru) = ru.rangedBase && ru.ammoLeft > 0` (`:1457-1459`).
        can_shoot: ranged_base && ammo > 0.0,
        is_siege_unit: bo(&u["siege"]),
        is_siege_tower: bo(&u["tower"]),
        is_ram: bo(&u["ram"]),
        is_catapult: bo(&u["cata"]),
        doctrine_auto,
        doctrine_manual: false,
    }
}

/// Wejście na mur: pole przed, pole korony, chwila.
type Climb = ((i64, i64), (i64, i64), f64);

struct Built {
    body: ProdBody<NoRolls>,
    st: TurnSeqState,
    acting: UnitRef,
}

/// Ciało i stan z wektora. `terrain = false` = ciało bez [`MoveTerrain`] (jawne tagi `*-brak-terenu`).
fn build(case: &Value, terrain: bool) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let acting = UnitRef {
        side: BattleSide::Attacker,
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    assert_eq!(case["acting"]["side"], "atk");
    let wall_col = int(&case["wallCol"]);
    let doctrine_auto = b(&case["expect"]["doctrineAuto"]);
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let dead = b(&u["dead"]);
            let me = ix == 0 && i == acting.idx;
            units[ix].push(ProdUnit {
                activate: act(u, ix == 0, me && doctrine_auto),
                melee_target: None,
                blow: None,
                counter_blows: Vec::new(),
                body_ms: 0.0,
                facing: num(&u["facing"]),
            });
            seq[ix].push(SeqUnit {
                id: (ix * 100 + seq[ix].len()) as u64,
                c: CombatUnit {
                    hp: num_or(&u["hp"], 100.0),
                    morale: num_or(&u["morale"], 100.0),
                    flee_morale: num_or(&u["fleeMorale"], 0.0),
                    move_left: num(&u["moveLeft"]),
                    never_rout: bo(&u["neverRout"]),
                    dead,
                    fading_out: b(&u["fadingOut"]),
                    routed: b(&u["routed"]),
                    removed: dead,
                    acted: false,
                },
            });
        }
    }
    let [atk_seq, def_seq] = seq;
    let st = TurnSeqState {
        atk: atk_seq,
        def: def_seq,
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 1,
        siege_wall_col: wall_col,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    let wall_tile_hp: Vec<(i64, f64)> = case["wallTiles"]
        .as_array()
        .expect("wallTiles")
        .iter()
        .map(|t| (int(&t[0]), num(&t[1])))
        .collect();
    let scene = ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col,
        gate_open: b(&case["gateOpen"]),
        wall_tile_hp,
        // Wartość sceny nieużywana: każda jednostka ma `siege_machine_range` (adapter, `_siegeMachineRange(ru)`).
        siege_machine_range: f64::NAN,
    };
    let mut body = ProdBody::new(units, scene, NoRolls);
    if terrain {
        body = body.with_terrain(Box::new(VecTerrain::from(&case["terrain"])));
    }
    body.wall_ever_breached = b(&case["wallEverBreached"]);
    body.siege_gate_col = int(&case["gateCol"]);
    body.siege_gate_row = int(&case["gateRow"]);
    body.siege_wall_tiles_init = case["wallTilesInit"].as_u64().expect("init") as usize;
    body.tower_at_wall_rows = case["towerRows"]
        .as_array()
        .expect("towerRows")
        .iter()
        .map(int)
        .collect();
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let ds = &mut body.doctrine[ix][i];
            ds.unit_doctrine = u["unitDoctrine"]
                .as_str()
                .map(|s| GroupDoctrine::parse(s).expect("doktryna"));
            assert!(u["groupId"].is_null(), "scenariusze bez grup");
            body.ranged_base[ix][i] = bo(&u["rangedBase"]);
            body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
            body.siege_machine_range[ix][i] = Some(num_or(&u["machRange"], 1.0));
        }
    }
    body.sync_occupancy(&st);
    Built { body, st, acting }
}

fn load_from(src: &str) -> Value {
    let v: Value = serde_json::from_str(src).expect("wektory");
    assert_eq!(v["pin"].as_str(), Some(PIN));
    assert_eq!(v["pinSha256"].as_str(), Some(PIN_SHA256));
    v
}

/// Ślad pinu w postaci porównywalnej ze zdarzeniami maszyny: wywołania `_trySiegeTowerClimb` /
/// `_siegeInfantryToTowerStep` / `_siegeRamTowerStep`, `_advanceToward` maszyny (katapulta; fallback taranu/wieży jest
/// wewnątrz `_siegeRamTowerStep`, nie zdarzeniem maszyny) i delegaty-znaczniki.
fn pin_trace(e: &Value) -> Vec<String> {
    let mut out = Vec::new();
    let raw: Vec<&str> = e["trace"]
        .as_array()
        .expect("trace")
        .iter()
        .map(|t| t.as_str().expect("str"))
        .collect();
    let mut in_ram = false;
    for t in raw {
        if t == "ramTower" {
            in_ram = true;
            out.push("ramTower".to_string());
        } else if t.starts_with("ramTower:") || t.starts_with("infToTower:") {
            in_ram = false;
        } else if let Some(rest) = t.strip_prefix("towerClimb:") {
            let _ = rest;
            out.push("towerClimb".to_string());
        } else if t.starts_with("advanceToward:") {
            if !in_ram {
                out.push(t.to_string());
            }
        } else if t == "attackGate" {
            // `_attackGate` wołany z `_siegeRamTowerStep` (`:8028`), nie z maszyny.
        } else if t == "attack" {
            let m = &e["marker"];
            out.push(format!("attack:{}", int(&m["target"])));
        } else if t == "attackWallTile" {
            let m = &e["marker"];
            out.push(format!("attackWallTile:{}", int(&m["row"])));
        } else {
            out.push(t.to_string());
        }
    }
    out
}

fn rust_trace(events: &[ActivateEvent]) -> Vec<String> {
    let mut out = Vec::new();
    for ev in events {
        let s = match ev {
            ActivateEvent::Done
            | ActivateEvent::ResetPlayerOrder
            | ActivateEvent::UpdateMoraleBar
            | ActivateEvent::StartRout
            | ActivateEvent::PerformPlayerOrder => continue,
            ActivateEvent::ApplyTerrainRange => "terrainRange".to_string(),
            ActivateEvent::UpdateFacing => "facing".to_string(),
            ActivateEvent::TowerClimb => "towerClimb".to_string(),
            ActivateEvent::InfantryToTower => "infToTower".to_string(),
            ActivateEvent::RamTowerStep => "ramTower".to_string(),
            ActivateEvent::AdvanceToward { col, row } => format!("advanceToward:{col},{row}"),
            ActivateEvent::DoctrineStep => "doctrine".to_string(),
            ActivateEvent::Attack { target } => format!("attack:{target}"),
            ActivateEvent::AttackWallTile { row } => format!("attackWallTile:{row}"),
            ActivateEvent::RangedAction => "rangedAction".to_string(),
            ActivateEvent::CavalryAction => "cavalryAction".to_string(),
            ActivateEvent::PhalanxAction => "phalanxAction".to_string(),
            ActivateEvent::AdvanceStep => "advanceStep".to_string(),
            ActivateEvent::FallBackStep => "fallBackStep".to_string(),
            ActivateEvent::Flee => "flee".to_string(),
        };
        out.push(s);
    }
    out
}

/// Tag ciała dla delegatu-znacznika pinu.
///
/// K5LOOP-SIEGE-ATK-B (T2b, D-INT-2): `_attackWallTile` i `_attackGate` są wykonywane przez ciało; ten wektor nie podaje
/// statystyk machiny (`ProdBody::siege_stats` = `None`), więc oczekiwany jest jawny tag wejścia adaptera
/// `atak-muru-bez-szablonu` / `atak-bramy-bez-szablonu` (dawniej `atak-muru` / `atak-bramy`), bez akcji i bez zmian stanu
/// (pozostałe porównania tego wektora bez zmian). Pozostałe znaczniki (krok doktryny, cios, strzelec, jazda, falanga,
/// krok, odwrót) są od T2b wykonywane (dawniej tag `oblezenie`): patrz [`marker_executed`].
fn expected_tag(e: &Value) -> Option<&'static str> {
    let m = &e["marker"];
    if m.is_null() {
        return None;
    }
    match m["kind"].as_str().expect("kind") {
        "attackWallTile" => Some("atak-muru-bez-szablonu"),
        "attackGate" => Some("atak-bramy-bez-szablonu"),
        "doctrine" | "attack" | "rangedAction" | "cavalryAction" | "phalanxAction"
        | "advanceStep" | "fallBackStep" => None,
        other => panic!("znacznik {other}"),
    }
}

/// K5LOOP-SIEGE-ATK-B (T2b, D-INT-2): znacznik gałęzi, którą ciało od T2b WYKONUJE (krok doktryny, cios, strzelec,
/// jazda, falanga, krok, odwrót). Generator T2a zatrzymuje pin na znaczniku (atrapa `done()`), więc wektor nie zawiera
/// oczekiwań dla skutków tej gałęzi (kroki, czas, stan końcowy); te skutki sprawdzają wektory `p6_k5loop_siege_atk_b`,
/// generowane z pełnego tekstu pinu tych gałęzi. Dla takich wektorów test porównuje ślad maszyny (bez zmian) i wymaga,
/// żeby jedyne tagi były jawnymi tagami wejścia adaptera (brak szablonu ciosu/strzału, rozkaz ruchu K5EXEC-T3), nigdy
/// tagiem oblężniczym.
fn marker_executed(e: &Value) -> bool {
    let m = &e["marker"];
    !m.is_null() && expected_tag(e).is_none()
}

/// Jedna aktywacja atakującego przy murze wobec pinu. Zwraca gałąź pinu (licznik pokrycia).
fn check_case(case: &Value, failures: &mut Vec<String>) -> String {
    let name = case["name"].as_str().expect("name").to_string();
    let e = &case["expect"];
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, true);
    let mut fail = |what: &str, got: String, want: String| {
        failures.push(format!("{name}: {what}: rust={got} pin={want}"));
    };
    let dur = body.start(acting, &st);
    let actions = body.pending_actions().to_vec();
    body.complete(acting, &mut st);

    // Ślad maszyny.
    let got_trace = rust_trace(&body.trace[0].1);
    let want_trace = pin_trace(e);
    if got_trace != want_trace {
        fail("slad", format!("{got_trace:?}"), format!("{want_trace:?}"));
    }
    // Czas aktywacji (`done()` pinu względem startu).
    let want_dur = num(&e["duration"]);
    if !same_f64(dur, want_dur) && !marker_executed(e) {
        fail("czas", format!("{dur}"), format!("{want_dur}"));
    }
    // K5LOOP-SIEGE-ATK-B (T2b, D-INT-2): gałąź wykonywana od T2b, której skutków wektor T2a nie zawiera (atrapa pinu):
    // tylko ślad maszyny (wyżej) i jawne tagi wejścia adaptera; skutki porównują wektory `p6_k5loop_siege_atk_b`.
    if marker_executed(e) {
        for (u, t) in &body.unported {
            if *u != acting
                || t.starts_with("oblezenie")
                || !(t.ends_with("-bez-szablonu") || *t == "doktryna-rozkaz-ruchu")
            {
                fail(
                    "tag galezi T2b",
                    t.to_string(),
                    "tag wejscia adaptera".into(),
                );
            }
        }
        return e["branch"].as_str().expect("branch").to_string();
    }
    // Tag gałęzi (znacznik muru/bramy bez statystyk machiny = jawny tag wejścia adaptera).
    let want_tags: Vec<(UnitRef, &str)> =
        expected_tag(e).map(|t| (acting, t)).into_iter().collect();
    if body.unported != want_tags {
        fail(
            "unported",
            format!("{:?}", body.unported),
            format!("{want_tags:?}"),
        );
    }
    // Kroki `_doMove`: pole i chwila (`t0`), łańcuch `from`.
    let moves: Vec<(i64, i64, f64, (i64, i64))> = actions
        .iter()
        .filter_map(|a| match &a.action {
            BattleAction::Move {
                unit,
                from,
                to,
                arrive_at,
            } if *unit == acting => {
                assert!(same_f64(*arrive_at, a.t0 + 240.0), "{name}: arrive_at");
                Some((to.0, to.1, a.t0, *from))
            }
            _ => None,
        })
        .collect();
    let want_steps: Vec<(i64, i64, f64)> = e["steps"]
        .as_array()
        .expect("steps")
        .iter()
        .map(|s| (int(&s["col"]), int(&s["row"]), num(&s["t"])))
        .collect();
    let got_steps: Vec<(i64, i64, f64)> = moves.iter().map(|m| (m.0, m.1, m.2)).collect();
    if got_steps != want_steps {
        fail("kroki", format!("{got_steps:?}"), format!("{want_steps:?}"));
    }
    let mut prev = (
        int(&case["atk"][acting.idx]["q"]),
        int(&case["atk"][acting.idx]["r"]),
    );
    for m in &moves {
        if m.3 != prev {
            fail("from kroku", format!("{:?}", m.3), format!("{prev:?}"));
        }
        prev = (m.0, m.1);
    }
    // Zmiany `facing` jednostki z chwilą.
    let got_facing: Vec<(f64, f64)> = actions
        .iter()
        .filter_map(|a| match &a.action {
            BattleAction::Facing { unit, dir } if *unit == acting => Some((a.t0, *dir)),
            _ => None,
        })
        .collect();
    let want_facing: Vec<(f64, f64)> = e["facing"]
        .as_array()
        .expect("facing")
        .iter()
        .map(|f| (num(&f["t"]), num(&f["dir"])))
        .collect();
    if got_facing != want_facing {
        fail(
            "facing",
            format!("{got_facing:?}"),
            format!("{want_facing:?}"),
        );
    }
    // Wejście na mur i dziennik (kolejność: `Log` wyłomu przed `ClimbWall`).
    let got_climb: Vec<Climb> = actions
        .iter()
        .filter_map(|a| match &a.action {
            BattleAction::ClimbWall { unit, from, to } if *unit == acting => {
                Some((*from, *to, a.t0))
            }
            _ => None,
        })
        .collect();
    let want_climb: Vec<Climb> = if e["climb"].is_null() {
        Vec::new()
    } else {
        let c = &e["climb"];
        vec![(
            (int(&c["from"][0]), int(&c["from"][1])),
            (int(&c["to"][0]), int(&c["to"][1])),
            num(&c["t"]),
        )]
    };
    if got_climb != want_climb {
        fail("climb", format!("{got_climb:?}"), format!("{want_climb:?}"));
    }
    let got_log: Vec<String> = actions
        .iter()
        .filter_map(|a| match &a.action {
            BattleAction::Log { text } => Some(text.clone()),
            _ => None,
        })
        .collect();
    let want_log: Vec<String> = e["log"]
        .as_array()
        .expect("log")
        .iter()
        .map(|l| l.as_str().expect("log").to_string())
        .collect();
    if got_log != want_log {
        fail("log", format!("{got_log:?}"), format!("{want_log:?}"));
    }
    if let (Some(li), Some(ci)) = (
        actions
            .iter()
            .position(|a| matches!(a.action, BattleAction::Log { .. })),
        actions
            .iter()
            .position(|a| matches!(a.action, BattleAction::ClimbWall { .. })),
    ) {
        if li > ci {
            fail(
                "kolejnosc log/climb",
                format!("{li}>{ci}"),
                "log przed climb".into(),
            );
        }
    }
    // Ciało nie emituje innych akcji w tych gałęziach.
    for a in &actions {
        let ok = matches!(
            a.action,
            BattleAction::Move { .. }
                | BattleAction::Facing { .. }
                | BattleAction::ClimbWall { .. }
                | BattleAction::Log { .. }
        );
        if !ok {
            fail(
                "akcja spoza galezi",
                format!("{:?}", a.action),
                "brak".into(),
            );
        }
    }
    // Stan końcowy.
    let fin = &e["final"];
    let a = &body.units[0][acting.idx].activate;
    let c = st.unit(acting).c;
    if (a.q, a.r) != (int(&fin["q"]), int(&fin["r"])) {
        fail(
            "pole",
            format!("{:?}", (a.q, a.r)),
            format!("{},{}", fin["q"], fin["r"]),
        );
    }
    if !same_f64(c.move_left, num(&fin["moveLeft"])) {
        fail(
            "moveLeft",
            format!("{}", c.move_left),
            format!("{}", fin["moveLeft"]),
        );
    }
    if !same_f64(body.facing(acting), num(&fin["facing"])) {
        fail(
            "facing koncowe",
            format!("{}", body.facing(acting)),
            format!("{}", fin["facing"]),
        );
    }
    if a.on_wall_walkway != b(&fin["onWall"]) {
        fail(
            "onWall",
            format!("{}", a.on_wall_walkway),
            format!("{}", fin["onWall"]),
        );
    }
    if !same_f64(c.morale, num(&fin["morale"])) {
        fail(
            "morale",
            format!("{}", c.morale),
            format!("{}", fin["morale"]),
        );
    }
    let want_rows: BTreeSet<i64> = e["towerRows"]
        .as_array()
        .expect("rows")
        .iter()
        .map(int)
        .collect();
    if body.tower_at_wall_rows != want_rows {
        fail(
            "towerAtWallRows",
            format!("{:?}", body.tower_at_wall_rows),
            format!("{want_rows:?}"),
        );
    }
    if body.wall_ever_breached != b(&e["wallEverBreached"]) {
        fail(
            "wallEverBreached",
            format!("{}", body.wall_ever_breached),
            format!("{}", e["wallEverBreached"]),
        );
    }
    let mut got_occ: Vec<(String, String)> = body
        .occ_by_key()
        .iter()
        .map(|(k, v)| (format!("{k:?}"), v.clone()))
        .collect();
    got_occ.sort();
    let mut want_occ: Vec<(String, String)> = e["occ"]
        .as_array()
        .expect("occ")
        .iter()
        .map(|o| {
            (
                format!("{:?}", cell_key(num(&o[0]), num(&o[1]))),
                o[2].as_str().expect("tag").to_string(),
            )
        })
        .collect();
    want_occ.sort();
    if got_occ != want_occ {
        fail("occByKey", format!("{got_occ:?}"), format!("{want_occ:?}"));
    }
    let _ = tag_of;
    e["branch"].as_str().expect("branch").to_string()
}

fn run_all(src: &str) -> (usize, BTreeMap<String, usize>, Vec<String>) {
    let v = load_from(src);
    let mut failures = Vec::new();
    let mut by_branch: BTreeMap<String, usize> = BTreeMap::new();
    let mut n = 0;
    for case in v["cases"].as_array().expect("cases") {
        let br = check_case(case, &mut failures);
        *by_branch.entry(br).or_default() += 1;
        n += 1;
    }
    (n, by_branch, failures)
}

/// Uruchomienie ze strażnikiem czasu (lekcja NaN: pętla marszu z `moveLeft = NaN` musi się kończyć u celu).
fn guarded<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> T {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let _ = tx.send(f());
    });
    rx.recv_timeout(LOOP_GUARD)
        .expect("strażnik czasu 90 s: pętla marszu nie zakończyła się")
}

#[test]
fn zgodnosc_z_pinem_atakujacy_przy_murze() {
    let (n, by_branch, failures) = guarded(|| run_all(VECTORS));
    assert!(
        failures.is_empty(),
        "{} rozbieżności, pierwsze:\n{}",
        failures.len(),
        failures
            .iter()
            .take(20)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
    assert_eq!(n, 1240);
    eprintln!("pokrycie galezi: {by_branch:?}");
    let at = |k: &str| by_branch.get(k).copied().unwrap_or(0);
    // Liczniki pokrycia: gałąź pinu, którą wykonał wektor (klasyfikacja generatora z przebiegu pinu, a Rust przeszedł
    // pełne porównanie dla każdego wektora).
    assert!(at("climb") >= 60, "wejscie na mur: {}", at("climb"));
    assert!(
        at("inf-walk") >= 100,
        "marsz piechoty pod wieze: {}",
        at("inf-walk")
    );
    assert!(
        at("ramtower-walk") >= 100,
        "marsz BFS taranu/wiezy: {}",
        at("ramtower-walk")
    );
    assert!(
        at("ramtower-walk-idle") >= 20,
        "marsz BFS taranu/wiezy bez kroku (moveLeft <= 0): {}",
        at("ramtower-walk-idle")
    );
    assert!(
        at("tower-atwall") >= 20,
        "wieza pod murem (dopisanie wiersza): {}",
        at("tower-atwall")
    );
    assert!(
        at("ramtower-toward-step") >= 20,
        "_advanceToward taranu/wiezy z krokiem: {}",
        at("ramtower-toward-step")
    );
    assert!(
        at("ramtower-toward-idle") >= 10,
        "_advanceToward taranu/wiezy bez kroku: {}",
        at("ramtower-toward-idle")
    );
    assert!(
        at("cata-toward-step") >= 30,
        "marsz katapulty z krokiem: {}",
        at("cata-toward-step")
    );
    assert!(
        at("cata-toward-idle") >= 10,
        "marsz katapulty bez kroku: {}",
        at("cata-toward-idle")
    );
    assert!(
        at("tag-attackGate") >= 5,
        "atak bramy (tag): {}",
        at("tag-attackGate")
    );
    assert!(
        at("tag-attackWallTile") >= 20,
        "ostrzal muru (tag): {}",
        at("tag-attackWallTile")
    );
    assert!(
        at("tag-doctrine") >= 50,
        "krok doktryny (tag): {}",
        at("tag-doctrine")
    );
    assert!(
        at("tag-attack") >= 20,
        "cios atakujacego (tag): {}",
        at("tag-attack")
    );
    assert!(at("hold") >= 5, "trzymanie (bez akcji): {}", at("hold"));
}

#[test]
fn zgodnosc_z_pinem_nan() {
    let (n, by_branch, failures) = guarded(|| run_all(VECTORS_NAN));
    assert!(
        failures.is_empty(),
        "{} rozbieżności, pierwsze:\n{}",
        failures.len(),
        failures
            .iter()
            .take(20)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
    assert_eq!(n, 460);
    eprintln!("pokrycie galezi NaN: {by_branch:?}");
    let v = load_from(VECTORS_NAN);
    let cases = v["cases"].as_array().expect("cases");
    let move_left_nan_multi = cases
        .iter()
        .filter(|c| c["name"].as_str().expect("n").contains("moveLeft-nan"))
        .filter(|c| c["expect"]["steps"].as_array().expect("s").len() >= 2)
        .count();
    assert!(
        move_left_nan_multi >= 50,
        "marsz wielokrokowy z moveLeft NaN: {move_left_nan_multi}"
    );
    let cost_nan_step = cases
        .iter()
        .filter(|c| {
            let tiles = c["terrain"]["tiles"].as_array().expect("t");
            c["expect"]["steps"].as_array().expect("s").iter().any(|s| {
                tiles
                    .iter()
                    .any(|t| num(&t["cost"]).is_nan() && t["c"] == s["col"] && t["r"] == s["row"])
            })
        })
        .count();
    assert!(
        cost_nan_step >= 5,
        "krok _advanceToward na pole z kosztem NaN: {cost_nan_step}"
    );
}

/// Obrona r1 (zarzuty 1 i 2 Evaluatora). Krawędzie planszy w `_advanceToward` (`battleScene.ts:7902`: `nc < 0 || nr < 0
/// || nc >= BF_COLS || nr >= BF_ROWS`): katapulta na wierszu 0 / 155 i kolumnie 0 / 67; w wariancie `boxed` trzy pola
/// sąsiednie na planszy są zajęte, więc jedynym kandydatem bez warunku granicy byłby kierunek POZA planszą
/// ([`VecTerrain`] zwraca tam „przechodnie, koszt 1”) — pin kończy bez kroku. Każdy z czterech członów warunku ma
/// osobny wektor rozstrzygający. Piechota pod wieżę z `moveLeft = 0`: BFS ma krok, `_siegeWalkTo` kończy od razu
/// (`:8010`), licznik `inf-walk-idle`.
#[test]
fn zgodnosc_z_pinem_krawedzie_i_bez_ruchu() {
    let (n, by_branch, failures) = guarded(|| run_all(VECTORS_EDGE));
    assert!(
        failures.is_empty(),
        "{} rozbieżności, pierwsze:\n{}",
        failures.len(),
        failures
            .iter()
            .take(20)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
    assert_eq!(n, 88);
    eprintln!("pokrycie galezi krawedzi: {by_branch:?}");
    let v = load_from(VECTORS_EDGE);
    let cases = v["cases"].as_array().expect("cases");
    for edge in ["N", "S", "W", "E"] {
        let boxed = cases
            .iter()
            .find(|c| c["name"] == format!("siege-atk-edge-{edge}-boxed").as_str())
            .expect("wektor boxed");
        assert_eq!(
            boxed["expect"]["branch"], "cata-toward-idle",
            "{edge}: pin bez kroku"
        );
        assert!(
            boxed["expect"]["steps"].as_array().expect("s").is_empty(),
            "{edge}: brak kroku poza planszę"
        );
        let free = cases
            .iter()
            .find(|c| c["name"] == format!("siege-atk-edge-{edge}-free").as_str())
            .expect("wektor free");
        assert_eq!(
            free["expect"]["branch"], "cata-toward-step",
            "{edge}: krok na planszy"
        );
    }
    let at = |k: &str| by_branch.get(k).copied().unwrap_or(0);
    assert!(
        at("inf-walk-idle") >= 20,
        "marsz piechoty pod wieze bez ruchu (moveLeft = 0, BFS ma krok): {}",
        at("inf-walk-idle")
    );
}

/// Kryterium końca T2a: dla atakującego przy murze ciało nigdy nie zapisuje tagów `wieza-wejscie`, `piechota-do-wiezy`,
/// `taran-wieza`, `marsz`. K5LOOP-SIEGE-ATK-B (T2b, D-INT-2): z danymi terenu jedyne tagi to jawne tagi wejścia
/// adaptera (brak statystyk machiny lub szablonu ciosu/strzału: `*-bez-szablonu`; rozkaz ruchu kroku doktryny
/// `doktryna-rozkaz-ruchu`, K5EXEC-T3); dawne tagi gałęzi `oblezenie`, `atak-muru`, `atak-bramy` zdjęte.
#[test]
fn brak_tagow_t2a_dla_atakujacego() {
    for src in [VECTORS, VECTORS_NAN, VECTORS_EDGE] {
        let v = load_from(src);
        for case in v["cases"].as_array().expect("cases") {
            let Built {
                mut body,
                mut st,
                acting,
            } = build(case, true);
            let _ = body.start(acting, &st);
            body.complete(acting, &mut st);
            for (_, tag) in &body.unported {
                assert!(
                    tag.ends_with("-bez-szablonu") || *tag == "doktryna-rozkaz-ruchu",
                    "{}: tag {tag}",
                    case["name"]
                );
            }
        }
    }
}

/// Bez danych terenu (D1 K5DOC-T4e-0) gałęzie ruchowe T2a mają jawne tagi `*-brak-terenu` i nic nie robią; wejście na
/// mur i wieża pod murem nie czytają terenu, więc działają jak w pinie.
#[test]
fn bez_terenu_jawne_tagi_ruchu() {
    let v = load_from(VECTORS);
    let mut seen: BTreeMap<&str, usize> = BTreeMap::new();
    for case in v["cases"].as_array().expect("cases") {
        let e = &case["expect"];
        let br = e["branch"].as_str().expect("branch");
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, false);
        let _ = body.start(acting, &st);
        let actions = body.pending_actions().to_vec();
        body.complete(acting, &mut st);
        let moved = actions
            .iter()
            .any(|a| matches!(a.action, BattleAction::Move { .. }));
        assert!(!moved, "{}: ruch bez terenu", case["name"]);
        let tags: Vec<&str> = body.unported.iter().map(|(_, t)| *t).collect();
        match br {
            "climb" | "tower-atwall" => assert!(tags.is_empty(), "{}: {tags:?}", case["name"]),
            // K5LOOP-SIEGE-ATK-B (D-INT-2): `_attackGate` wykonywany; bez statystyk machiny jawny tag wejścia adaptera.
            "tag-attackGate" => assert_eq!(tags, ["atak-bramy-bez-szablonu"], "{}", case["name"]),
            "inf-walk" => assert_eq!(tags, ["piechota-do-wiezy-brak-terenu"], "{}", case["name"]),
            "cata-toward-step" => assert_eq!(tags, ["marsz-brak-terenu"], "{}", case["name"]),
            // `_advanceToward` po BFS bez celu: BFS czyta teren tylko dla pól wolnych; gdy wszystkie sąsiednie pola są
            // zajęte, decyzja nie czyta terenu, a `_advanceToward` czyta koszt (`=== Infinity`) dopiero przy
            // `moveLeft > 0` (wtedy `marsz-brak-terenu`).
            "ramtower-toward-step" | "ramtower-toward-idle" => assert!(
                tags.is_empty()
                    || tags == ["taran-wieza-brak-terenu"]
                    || tags == ["marsz-brak-terenu"],
                "{}: {tags:?}",
                case["name"]
            ),
            "ramtower-walk" | "ramtower-walk-idle" => {
                assert_eq!(tags, ["taran-wieza-brak-terenu"], "{}", case["name"])
            }
            _ => continue,
        }
        *seen.entry(br).or_default() += 1;
    }
    for k in [
        "climb",
        "tower-atwall",
        "tag-attackGate",
        "inf-walk",
        "cata-toward-step",
        "ramtower-walk",
        "ramtower-walk-idle",
        "ramtower-toward-step",
        "ramtower-toward-idle",
    ] {
        assert!(
            seen.get(k).copied().unwrap_or(0) >= 5,
            "pokrycie bez terenu {k}: {seen:?}"
        );
    }
}

/// `ClimbWall` nie ma jeszcze wariantu DTO (I5b #370): konwersja to jawny błąd, nie ciche pominięcie.
#[test]
fn wejscie_na_mur_bez_dto_jawny_blad() {
    let v = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["expect"]["branch"] == "climb")
        .expect("climb");
    let Built {
        mut body,
        st,
        acting,
    } = build(case, true);
    let _ = body.start(acting, &st);
    let actions: Vec<_> = body
        .pending_actions()
        .iter()
        .filter(|a| matches!(a.action, BattleAction::ClimbWall { .. }))
        .cloned()
        .collect();
    assert_eq!(actions.len(), 1);
    assert_eq!(
        actions_to_dto(&actions, &st),
        Err(ActionError::ClimbWallWithoutDto(acting))
    );
}

/// Pierwszy wyłom przez wieżę: wpis dziennika dokładnie raz (`!this.wallEverBreached`, `:8071`), tekst z pinu.
#[test]
fn wylom_przez_wieze_raz() {
    let v = load_from(VECTORS);
    let mut with_log = 0;
    let mut already = 0;
    for case in v["cases"].as_array().expect("cases") {
        if case["expect"]["branch"] != "climb" {
            continue;
        }
        let Built {
            mut body,
            st,
            acting,
        } = build(case, true);
        let before = body.wall_ever_breached;
        let _ = body.start(acting, &st);
        let logs = body
            .pending_actions()
            .iter()
            .filter(|a| matches!(&a.action, BattleAction::Log { text } if text == WYLOM_LOG))
            .count();
        assert!(body.wall_ever_breached);
        if before {
            assert_eq!(logs, 0, "{}", case["name"]);
            already += 1;
        } else {
            assert_eq!(logs, 1, "{}", case["name"]);
            with_log += 1;
        }
    }
    assert!(
        with_log >= 30 && already >= 5,
        "pokrycie wyłomu: {with_log}/{already}"
    );
}
