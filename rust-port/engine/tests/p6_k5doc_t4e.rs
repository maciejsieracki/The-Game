//! P6 SIEGE-TAKTYKA K5DOC-T4e-0 (dispatch R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING, runda 4, Operator): wiring jednego
//! kroku ruchu w `ProdBody` (`ProdBody::move_step` -> `do_move_effects`), koszt per jednostka (`mounted`), zajetosc
//! `occ_by_key` (D3) i jawny blad `MissingTerrain` (D1).
//!
//! Wektory: `p6_k5doc_t4e_vectors/vectors.json`, generowane przez `p6_k5doc_t4e_gen.mjs`, ktory WYKONUJE tekst pina
//! (`_doMove` `:8685-8776` i `_moveCostForUnit` `:7436-7443`). Zakres: passable, koszt kawalerii, brod, zajetosc,
//! odmowa i galaz planowania. Porownanie `move_left` jest bitowe (`to_bits`).
//!
//! ZAKRES: tylko T4e-0. Pelny `_advanceStep` 1-10 i facing (#107) poza zakresem; `update_facing` w adapterze = no-op.

use std::cell::RefCell;
use std::collections::HashMap;

use civ_engine::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_autobatch::{cell_key, CellKey};
use civ_engine::domain::siege_tactics_autophase::{
    AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase, AutoBatchStep,
};
use civ_engine::domain::siege_tactics_blow::SequenceRolls;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{MissingTerrain, ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_move_effects::{
    do_move_effects, MoveTerrain, MoveUnit, MoveWorld,
};
use civ_engine::domain::siege_tactics_turnseq::UnitRef;
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t4e_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct Case {
    name: String,
    input: Input,
    expect: Expect,
}

#[derive(Deserialize)]
struct Input {
    unit: UnitIn,
    col: i64,
    row: i64,
    refused: bool,
    tiles: Vec<TileIn>,
    occupancy: Vec<(i64, i64, String)>,
    autobatch: Option<IntentIn>,
}

#[derive(Deserialize)]
struct UnitIn {
    q: i64,
    r: i64,
    move_left: f64,
    mounted: bool,
}

#[derive(Deserialize)]
struct TileIn {
    c: i64,
    r: i64,
    passable: bool,
    cost: f64,
    ford: bool,
    name: String,
}

#[derive(Deserialize)]
struct IntentIn {
    kind: String,
    steps: Vec<[i64; 2]>,
}

#[derive(Deserialize)]
struct Expect {
    /// `null` = `Infinity` (informacyjnie: wartość kosztu z pinu; sprawdzany jest efekt przez `move_left`).
    #[allow(dead_code)]
    cost: Option<f64>,
    q: i64,
    r: i64,
    move_left: f64,
    occupancy: Vec<(i64, i64, String)>,
    done: bool,
    intent: Option<IntentIn>,
}

/// Domyślny kafelek z generatora (`DEFAULT_TILE`).
const DEFAULT_TILE: (bool, f64, bool, &str) = (true, 1.0, false, "Rownina");

/// STUB `cavalryTerrainMultiplier` (combat.ts:756) wg komentarza pina; tabela `CAV_TABLE` z generatora.
fn cav_multiplier(name: &str) -> f64 {
    match name {
        "Las" => 2.0,
        "Gory" => f64::INFINITY,
        _ => 1.0,
    }
}

/// Teren z wektora: lookup kafelka po współrzędnych, poza listą = `DEFAULT_TILE`.
struct TileTerrain {
    tiles: HashMap<(i64, i64), (bool, f64, bool, String)>,
}

impl TileTerrain {
    fn new(tiles: &[TileIn]) -> Self {
        Self {
            tiles: tiles
                .iter()
                .map(|t| ((t.c, t.r), (t.passable, t.cost, t.ford, t.name.clone())))
                .collect(),
        }
    }

    fn tile(&self, col: f64, row: f64) -> (bool, f64, bool, String) {
        match self.tiles.get(&(col as i64, row as i64)) {
            Some(t) => t.clone(),
            None => {
                let (p, c, f, n) = DEFAULT_TILE;
                (p, c, f, n.to_string())
            }
        }
    }
}

impl MoveTerrain for TileTerrain {
    fn passable(&self, col: f64, row: f64) -> bool {
        self.tile(col, row).0
    }
    fn move_cost(&self, col: f64, row: f64) -> f64 {
        self.tile(col, row).1
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.tile(col, row).2
    }
    fn cavalry_multiplier(&self, col: f64, row: f64) -> f64 {
        cav_multiplier(&self.tile(col, row).3)
    }
}

fn kind_from(s: &str) -> AutoBatchIntentKind {
    match s {
        "hold" => AutoBatchIntentKind::Hold,
        "move" => AutoBatchIntentKind::Move,
        "attack" => AutoBatchIntentKind::Attack,
        other => panic!("nieznany rodzaj zamiaru: {other}"),
    }
}

fn kind_name(k: AutoBatchIntentKind) -> &'static str {
    match k {
        AutoBatchIntentKind::Hold => "hold",
        AutoBatchIntentKind::Move => "move",
        AutoBatchIntentKind::Attack => "attack",
    }
}

fn act(q: i64, r: i64, side_atk: bool, mounted: bool) -> ActivateUnit {
    ActivateUnit {
        side_atk,
        q,
        r,
        dead: false,
        fading_out: false,
        routed: false,
        never_rout: false,
        surround_applied: false,
        morale: 100.0,
        flee_morale: 0.0,
        terrain_defence_mult: 1.0,
        range: 1.0,
        on_wall_walkway: false,
        primary_ranged: false,
        mounted,
        phalanx: false,
        shooting_disabled: false,
        dry_col: 0.0,
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: false,
        is_siege_unit: false,
        is_siege_tower: false,
        is_ram: false,
        is_catapult: false,
        doctrine_auto: false,
        doctrine_manual: false,
    }
}

fn scene() -> ActivateScene {
    ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col: -1,
        gate_open: false,
        wall_tile_hp: Vec::new(),
        siege_machine_range: 0.0,
    }
}

fn pu(q: i64, r: i64, atk: bool, mounted: bool) -> ProdUnit {
    ProdUnit {
        activate: act(q, r, atk, mounted),
        melee_target: None,
        blow: None,
        counter_blows: Vec::new(),
        body_ms: 0.0,
        facing: 0.0,
    }
}

const ATK0: UnitRef = UnitRef {
    side: BattleSide::Attacker,
    idx: 0,
};

/// Buduje ciało: `atk0` na pozycji i z `mounted` z wektora; wrogowie `def<k>` na polach etykiet `o<k>`
/// z wektora (indeks w liście obrońców = kolejność wystąpienia). Zwraca ciało i mapę etykieta -> `def<idx>`.
fn body_for(inp: &Input) -> (ProdBody<SequenceRolls>, HashMap<String, String>) {
    let mut defs = Vec::new();
    let mut labels = HashMap::new();
    for (c, r, id) in &inp.occupancy {
        if id == "u" {
            continue;
        }
        labels.insert(id.clone(), format!("def{}", defs.len()));
        defs.push(pu(*c, *r, false, false));
    }
    let atk = pu(inp.unit.q, inp.unit.r, true, inp.unit.mounted);
    let body = ProdBody::new([vec![atk], defs], scene(), SequenceRolls::new(Vec::new()));
    (body, labels)
}

/// Mapa zajętości oczekiwanej z wektora (etykiety przełożone na identyfikatory ciała).
fn expected_occ(
    entries: &[(i64, i64, String)],
    labels: &HashMap<String, String>,
) -> HashMap<CellKey, String> {
    entries
        .iter()
        .map(|(c, r, id)| {
            let tag = if id == "u" {
                "atk0".to_string()
            } else {
                labels[id].clone()
            };
            (cell_key(*c as f64, *r as f64), tag)
        })
        .collect()
}

fn intent_of(a: &IntentIn) -> AutoBatchIntent {
    AutoBatchIntent {
        unit_id: "atk0".to_string(),
        side: AutoBatchPhase::Atk,
        kind: kind_from(&a.kind),
        steps: a
            .steps
            .iter()
            .map(|[c, r]| AutoBatchStep {
                col: *c as f64,
                row: *r as f64,
            })
            .collect(),
        target_id: None,
    }
}

#[test]
fn pin_vectors_match_move_step() {
    let v: Vectors = serde_json::from_str(VECTORS).expect("wektory t4e");
    assert!(v.cases.len() >= 300, "za malo wektorow: {}", v.cases.len());
    let mut n_mounted = 0;
    let mut n_refused = 0;
    let mut n_plan = 0;
    for case in &v.cases {
        let inp = &case.input;
        let exp = &case.expect;
        if inp.unit.mounted {
            n_mounted += 1;
        }
        if inp.refused {
            n_refused += 1;
        }
        if inp.autobatch.is_some() {
            n_plan += 1;
        }
        let (mut body, labels) = body_for(inp);
        body = body.with_terrain(Box::new(TileTerrain::new(&inp.tiles)));
        let mut intent = inp.autobatch.as_ref().map(intent_of);
        let res = body
            .move_step(
                ATK0,
                inp.col,
                inp.row,
                inp.refused,
                inp.unit.move_left,
                intent.as_mut(),
            )
            .unwrap_or_else(|e| panic!("{}: nieoczekiwany {e:?}", case.name));

        assert_eq!(
            res.move_left.to_bits(),
            exp.move_left.to_bits(),
            "{}: move_left",
            case.name
        );
        assert_eq!(res.outcome.done, exp.done, "{}: done", case.name);
        let pu0 = &body.units[0][0].activate;
        assert_eq!((pu0.q, pu0.r), (exp.q, exp.r), "{}: pozycja", case.name);
        assert_eq!(
            body.occ_by_key(),
            &expected_occ(&exp.occupancy, &labels),
            "{}: zajetosc occ_by_key",
            case.name
        );
        match (&intent, &exp.intent) {
            (None, None) => {}
            (Some(got), Some(want)) => {
                assert_eq!(
                    kind_name(got.kind),
                    want.kind,
                    "{}: rodzaj zamiaru",
                    case.name
                );
                let steps: Vec<[i64; 2]> = got
                    .steps
                    .iter()
                    .map(|s| [s.col as i64, s.row as i64])
                    .collect();
                assert_eq!(steps, want.steps, "{}: kroki zamiaru", case.name);
            }
            _ => panic!("{}: zamiar niezgodny z wektorem", case.name),
        }
    }
    assert!(
        n_mounted > 0 && n_refused > 0 && n_plan > 0,
        "pokrycie wektorow"
    );
}

#[test]
fn missing_terrain_is_explicit_error_without_mutation() {
    let inp = Input {
        unit: UnitIn {
            q: 5,
            r: 5,
            move_left: 6.0,
            mounted: false,
        },
        col: 5,
        row: 6,
        refused: false,
        tiles: Vec::new(),
        occupancy: vec![(5, 5, "u".to_string())],
        autobatch: None,
    };
    let (mut body, _) = body_for(&inp);
    let before = body.occ_by_key().clone();
    assert_eq!(
        body.move_step(ATK0, 5, 6, false, 6.0, None),
        Err(MissingTerrain),
        "brak terenu musi dać MissingTerrain (bez domyślnej wartości)"
    );
    assert_eq!(body.occ_by_key(), &before, "brak mutacji zajetosci");
    assert_eq!(
        (body.units[0][0].activate.q, body.units[0][0].activate.r),
        (5, 5)
    );
    assert_eq!(
        body.move_step(ATK0, 5, 6, true, 6.0, None),
        Err(MissingTerrain),
        "odmowa tez wymaga adaptera terenu"
    );
}

#[test]
fn cavalry_and_foot_pay_different_cost_on_forest() {
    // Las: koszt bazowy 2, mnożnik kawalerii x2. Piechota 2, kawaleria 4 (pin `_moveCostForUnit`).
    let tiles = vec![TileIn {
        c: 5,
        r: 6,
        passable: true,
        cost: 2.0,
        ford: false,
        name: "Las".to_string(),
    }];
    let run = |mounted: bool| {
        let inp = Input {
            unit: UnitIn {
                q: 5,
                r: 5,
                move_left: 10.0,
                mounted,
            },
            col: 5,
            row: 6,
            refused: false,
            tiles: Vec::new(),
            occupancy: vec![(5, 5, "u".to_string())],
            autobatch: None,
        };
        let (body, _) = body_for(&inp);
        let mut body = body.with_terrain(Box::new(TileTerrain::new(&tiles)));
        body.move_step(ATK0, 5, 6, false, 10.0, None)
            .unwrap()
            .move_left
    };
    assert_eq!(run(false), 8.0, "piechota: 10 - 2");
    assert_eq!(run(true), 6.0, "kawaleria: 10 - 4");
}

#[test]
fn ford_halves_step_cost_in_wiring() {
    // Brod na celu, piechota: koszt 3 / BROD_RUCH_MULT 0.5 = 6, 10 - 6 = 4.
    let tiles = vec![TileIn {
        c: 5,
        r: 6,
        passable: true,
        cost: 3.0,
        ford: true,
        name: "Rownina".to_string(),
    }];
    let inp = Input {
        unit: UnitIn {
            q: 5,
            r: 5,
            move_left: 10.0,
            mounted: false,
        },
        col: 5,
        row: 6,
        refused: false,
        tiles: Vec::new(),
        occupancy: vec![(5, 5, "u".to_string())],
        autobatch: None,
    };
    let (body, _) = body_for(&inp);
    let mut body = body.with_terrain(Box::new(TileTerrain::new(&tiles)));
    assert_eq!(
        body.move_step(ATK0, 5, 6, false, 10.0, None)
            .unwrap()
            .move_left,
        4.0
    );
}

#[test]
fn occupancy_is_seeded_from_unit_positions() {
    let atk = pu(2, 2, true, false);
    let d = pu(3, 3, false, false);
    let body = ProdBody::new(
        [vec![atk], vec![d]],
        scene(),
        SequenceRolls::new(Vec::new()),
    );
    let occ = body.occ_by_key();
    assert_eq!(occ.len(), 2);
    assert_eq!(
        occ.get(&cell_key(2.0, 2.0)).map(String::as_str),
        Some("atk0")
    );
    assert_eq!(
        occ.get(&cell_key(3.0, 3.0)).map(String::as_str),
        Some("def0")
    );
}

/// Rejestrator wywołań `MoveWorld` (kolejność efektów: zajetosc przed facingiem, pin `:8694-8704`).
struct Rec {
    occ: HashMap<CellKey, String>,
    log: RefCell<Vec<&'static str>>,
}

impl MoveWorld for Rec {
    fn occ_mut(&mut self) -> &mut HashMap<CellKey, String> {
        self.log.borrow_mut().push("occ");
        &mut self.occ
    }
    fn move_cost(&self, _col: f64, _row: f64) -> f64 {
        self.log.borrow_mut().push("cost");
        1.0
    }
    fn is_ford(&self, _col: f64, _row: f64) -> bool {
        self.log.borrow_mut().push("ford");
        false
    }
    fn update_facing(&mut self, _unit_id: &str) {
        self.log.borrow_mut().push("facing");
    }
}

#[test]
fn facing_is_called_last_after_occupancy_update() {
    let mut world = Rec {
        occ: HashMap::from([(cell_key(5.0, 5.0), "atk0".to_string())]),
        log: RefCell::new(Vec::new()),
    };
    let mut unit = MoveUnit {
        id: "atk0".to_string(),
        q: 5.0,
        r: 5.0,
        move_left: 6.0,
    };
    let out = do_move_effects(&mut world, &mut unit, 5.0, 6.0, false, None);
    assert!(!out.done);
    let log = world.log.borrow();
    assert_eq!(
        log.iter().filter(|e| **e == "facing").count(),
        1,
        "facing raz"
    );
    assert_eq!(log.last(), Some(&"facing"), "facing jako ostatni: {log:?}");
    let first_facing = log.iter().position(|e| *e == "facing").unwrap();
    assert!(
        log[..first_facing].contains(&"occ"),
        "zajetosc przed facingiem: {log:?}"
    );
    assert!(world.occ.contains_key(&cell_key(5.0, 6.0)));
    assert!(!world.occ.contains_key(&cell_key(5.0, 5.0)));
}
