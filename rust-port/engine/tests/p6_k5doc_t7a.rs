//! P6 SIEGE-TAKTYKA K5DOC-T7a FALANGA (dispatch R-RUSTPORT-P6-K5DOC-T7A-FALANGA): testy zgodnosci z pinem `07d2fbd72`
//! (`gra/src/battle/battleScene.ts`) dla `is_phalanx`, `phalanx_line_front`, `phalanx_action_decide` i `phalanx_step_decide`
//! (`civ_engine::domain::siege_tactics_phalanx`).
//!
//! Wektory: `p6_k5doc_t7a_vectors/vectors.json`, generowane przez `p6_k5doc_t7a_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Kazdy przypadek ma pole `pin` z numerem linii (`battleScene.ts:NNNN`).
//!
//! Nazwane przypadki graniczne (asercje wprost, bez wektora) pokrywaja: tolerancje wyprzedzenia 2 i 3 (`:6563`),
//! filtr `primaryRanged` (`:6597-6599`) i `moveLeft <= 0` (`:6589`).

use std::collections::HashSet;

use civ_engine::domain::siege_tactics_approach::{BF_COLS, BF_ROWS};
use civ_engine::domain::siege_tactics_phalanx::{
    is_phalanx, phalanx_action_decide, phalanx_line_front, phalanx_step_decide, PhalanxDecision,
    PhalanxEnemy, PhalanxIdent, PhalanxUnit, PhalanxWorld, PHALANX_LEAD_TOLERANCE,
};
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t7a_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    constants: Constants,
    is_phalanx: Vec<IsCase>,
    line_front: Vec<LineCase>,
    action: Vec<ActionCase>,
}

#[derive(Deserialize)]
struct Constants {
    #[serde(rename = "PHALANX_LEAD_TOLERANCE")]
    lead_tolerance: f64,
    #[serde(rename = "BF_COLS")]
    bf_cols: i64,
    #[serde(rename = "BF_ROWS")]
    bf_rows: i64,
    #[serde(rename = "DIRS4")]
    dirs4: Vec<[f64; 2]>,
}

#[derive(Deserialize)]
struct StatsIn {
    #[serde(rename = "Jednostka")]
    jednostka: Option<String>,
}

#[derive(Deserialize)]
struct IsIn {
    kategoria: Option<String>,
    stats: Option<StatsIn>,
    nazwa: Option<String>,
}

#[derive(Deserialize)]
struct IsCase {
    name: String,
    pin: String,
    input: IsIn,
    expect: bool,
}

#[derive(Deserialize)]
struct UnitIn {
    id: String,
    q: f64,
    r: f64,
    side: String,
    dead: bool,
    fading_out: bool,
    routed: bool,
    phalanx: bool,
}

#[derive(Deserialize)]
struct LineCase {
    name: String,
    pin: String,
    #[allow(dead_code)]
    unit_id: Option<String>,
    #[allow(dead_code)]
    side: String,
    units: Vec<UnitIn>,
    expect: Option<f64>,
}

#[derive(Deserialize)]
struct EnemyIn {
    id: String,
    q: f64,
    r: f64,
    #[serde(default)]
    primary_ranged: bool,
}

#[derive(Deserialize)]
struct ActionIn {
    finished: bool,
    unit_id: String,
    move_left: f64,
    side_units: Vec<UnitIn>,
    enemies: Vec<EnemyIn>,
    adjacent: Option<EnemyIn>,
    occupied: Vec<[f64; 2]>,
    impassable: Vec<[f64; 2]>,
}

#[derive(Deserialize)]
struct Expect {
    kind: String,
    #[serde(default)]
    target: Option<String>,
    #[serde(default)]
    col: Option<f64>,
    #[serde(default)]
    row: Option<f64>,
}

#[derive(Deserialize)]
struct ActionCase {
    name: String,
    pin: String,
    input: ActionIn,
    expect: Expect,
}

/// Stan sceny dla `_targetInRange`, `_enemiesOf`, `_passableForUnit` i `occByKey`.
struct TestWorld {
    adjacent: Option<String>,
    enemies: Vec<PhalanxEnemy>,
    occupied: HashSet<(i64, i64)>,
    impassable: HashSet<(i64, i64)>,
}

impl PhalanxWorld for TestWorld {
    fn target_in_range(&self, _unit_id: &str) -> Option<String> {
        self.adjacent.clone()
    }
    fn enemies_of(&self, _unit_id: &str) -> Vec<PhalanxEnemy> {
        self.enemies.clone()
    }
    fn passable_for_unit(&self, _unit_id: &str, col: f64, row: f64) -> bool {
        !self.impassable.contains(&(col as i64, row as i64))
    }
    fn occupied(&self, col: f64, row: f64) -> bool {
        self.occupied.contains(&(col as i64, row as i64))
    }
}

fn to_unit(u: &UnitIn) -> PhalanxUnit {
    PhalanxUnit {
        id: u.id.clone(),
        atk: u.side == "atk",
        q: u.q,
        r: u.r,
        dead: u.dead,
        fading_out: u.fading_out,
        routed: u.routed,
        phalanx: u.phalanx,
        move_left: 0.0,
    }
}

fn pairs(v: &[[f64; 2]]) -> HashSet<(i64, i64)> {
    v.iter().map(|p| (p[0] as i64, p[1] as i64)).collect()
}

/// Wykonuje decyzje Rust i zwraca postac porownywalna z `Expect` z wektora.
fn decision_kind(d: &PhalanxDecision) -> (&'static str, Option<String>, Option<f64>, Option<f64>) {
    match d {
        PhalanxDecision::Done => ("done", None, None, None),
        PhalanxDecision::Attack { target_id } => ("attack", Some(target_id.clone()), None, None),
        PhalanxDecision::AdvanceStep => ("advance_step", None, None, None),
        PhalanxDecision::Move { col, row } => ("move", None, Some(*col), Some(*row)),
    }
}

fn run_action(input: &ActionIn) -> PhalanxDecision {
    let side_units: Vec<PhalanxUnit> = input.side_units.iter().map(to_unit).collect();
    let unit = {
        let base = side_units
            .iter()
            .find(|u| u.id == input.unit_id)
            .expect("jednostka decydujaca jest w side_units");
        PhalanxUnit {
            move_left: input.move_left,
            ..base.clone()
        }
    };
    let world = TestWorld {
        adjacent: input.adjacent.as_ref().map(|a| a.id.clone()),
        enemies: input
            .enemies
            .iter()
            .map(|e| PhalanxEnemy {
                id: e.id.clone(),
                q: e.q,
                r: e.r,
                primary_ranged: e.primary_ranged,
            })
            .collect(),
        occupied: pairs(&input.occupied),
        impassable: pairs(&input.impassable),
    };
    phalanx_action_decide(&world, input.finished, &unit, &side_units)
}

#[test]
fn constants_match_pin() {
    let c: Vectors = serde_json::from_str(VECTORS).expect("wektory: poprawny JSON");
    assert_eq!(
        c.constants.lead_tolerance, PHALANX_LEAD_TOLERANCE,
        "PHALANX_LEAD_TOLERANCE = 2 (battleScene.ts:1168)"
    );
    assert_eq!(c.constants.bf_cols, BF_COLS, "BF_COLS (battleScene.ts:661)");
    assert_eq!(c.constants.bf_rows, BF_ROWS, "BF_ROWS (battleScene.ts:662)");
    assert_eq!(
        c.constants.dirs4,
        vec![[0.0, -1.0], [1.0, 0.0], [0.0, 1.0], [-1.0, 0.0]],
        "DIRS4 = N,E,S,W (battleScene.ts:326-337)"
    );
}

#[test]
fn is_phalanx_matches_pinned_vectors() {
    let v: Vectors = serde_json::from_str(VECTORS).expect("wektory: poprawny JSON");
    assert!(!v.is_phalanx.is_empty());
    for c in &v.is_phalanx {
        let ident = PhalanxIdent {
            kategoria: c.input.kategoria.clone(),
            jednostka: c.input.stats.as_ref().and_then(|s| s.jednostka.clone()),
            nazwa: c.input.nazwa.clone(),
        };
        assert_eq!(is_phalanx(&ident), c.expect, "{} ({})", c.name, c.pin);
    }
}

#[test]
fn line_front_matches_pinned_vectors() {
    let v: Vectors = serde_json::from_str(VECTORS).expect("wektory: poprawny JSON");
    assert!(!v.line_front.is_empty());
    for c in &v.line_front {
        let units: Vec<PhalanxUnit> = c.units.iter().map(to_unit).collect();
        assert_eq!(
            phalanx_line_front(&units),
            c.expect,
            "{} ({})",
            c.name,
            c.pin
        );
    }
}

#[test]
fn action_matches_pinned_vectors() {
    let v: Vectors = serde_json::from_str(VECTORS).expect("wektory: poprawny JSON");
    assert!(!v.action.is_empty());
    for c in &v.action {
        let got = decision_kind(&run_action(&c.input));
        let want = (
            c.expect.kind.as_str(),
            c.expect.target.clone(),
            c.expect.col,
            c.expect.row,
        );
        assert_eq!(got.0, want.0, "{} ({}): rodzaj", c.name, c.pin);
        assert_eq!(got.1, want.1, "{} ({}): cel", c.name, c.pin);
        assert_eq!(got.2, want.2, "{} ({}): col", c.name, c.pin);
        assert_eq!(got.3, want.3, "{} ({}): row", c.name, c.pin);
    }
}

fn unit(id: &str, q: f64, r: f64, atk: bool) -> PhalanxUnit {
    PhalanxUnit {
        id: id.to_string(),
        atk,
        q,
        r,
        dead: false,
        fading_out: false,
        routed: false,
        phalanx: true,
        move_left: 2.0,
    }
}

fn enemy(id: &str, q: f64, r: f64, primary_ranged: bool) -> PhalanxEnemy {
    PhalanxEnemy {
        id: id.to_string(),
        q,
        r,
        primary_ranged,
    }
}

fn world(enemies: Vec<PhalanxEnemy>, occupied: &[(i64, i64)]) -> TestWorld {
    TestWorld {
        adjacent: None,
        enemies,
        occupied: occupied.iter().copied().collect(),
        impassable: HashSet::new(),
    }
}

/// Pin `:6563-6566`: roznica wyprzedzenia 2 (rowna tolerancji) wykonuje krok; roznica 3 wstrzymuje ture.
/// Atakujaca falanga na q=7 przy laggardzie q=5: krok N (7,9) jest dozwolony, bo stepAdv=7 <= 5+2.
#[test]
fn tolerance_boundary_two_moves_three_holds() {
    let side = vec![unit("ally", 5.0, 10.0, true), unit("ru", 7.0, 10.0, true)];
    let w = world(vec![enemy("e", 12.0, 8.0, false)], &[]);
    let d = phalanx_action_decide(&w, false, &side[1], &side);
    assert_eq!(
        d,
        PhalanxDecision::Move { col: 7.0, row: 9.0 },
        "roznica 2 = w pasie (pin :6563)"
    );

    let side3 = vec![unit("ally", 5.0, 10.0, true), unit("ru", 8.0, 10.0, true)];
    let d3 = phalanx_action_decide(&w, false, &side3[1], &side3);
    assert_eq!(
        d3,
        PhalanxDecision::Done,
        "roznica 3 > tolerancja 2: hold (pin :6563-6566)"
    );
}

/// Pin `:6597-6600`: wrog z `primaryRanged` jest pomijany, celem jest najblizszy NIE-dystansowy.
#[test]
fn primary_ranged_enemy_is_skipped() {
    let side = vec![unit("ally", 7.0, 0.0, true), unit("ru", 7.0, 10.0, true)];
    // Strzelec stoi tuz obok (dystans 1) i zajmuje (7,11); zwykly wrog jest dalej.
    let w = world(
        vec![enemy("r", 7.0, 11.0, true), enemy("n", 12.0, 8.0, false)],
        &[(7, 11)],
    );
    let d = phalanx_action_decide(&w, false, &side[1], &side);
    assert_eq!(
        d,
        PhalanxDecision::Move { col: 7.0, row: 9.0 },
        "cel = wrog NIE-dystansowy (pin :6597-6599)"
    );

    // Tylko strzelcy -> trzymaj linie (pin :6600).
    let w_only = world(vec![enemy("r", 7.0, 11.0, true)], &[(7, 11)]);
    let d_only = phalanx_action_decide(&w_only, false, &side[1], &side);
    assert_eq!(
        d_only,
        PhalanxDecision::Done,
        "sami strzelcy: done (pin :6600)"
    );
}

/// Pin `:6589`: `moveLeft <= 0` konczy krok przed szukaniem celu.
#[test]
fn move_left_zero_is_done_without_adjacency() {
    let side = vec![
        unit("ally", 5.0, 10.0, true),
        PhalanxUnit {
            move_left: 0.0,
            ..unit("ru", 7.0, 10.0, true)
        },
    ];
    let w = world(vec![enemy("e", 12.0, 8.0, false)], &[]);
    assert_eq!(
        phalanx_step_decide(&w, &side[1], &side, 5.0),
        PhalanxDecision::Done
    );
}

/// Pin `:6609-6610`: zajety kafelek nie jest kandydatem; wybor pada na kolejny kierunek.
#[test]
fn occupied_tile_skipped_in_favour_of_next_direction() {
    let side = vec![unit("ally", 7.0, 0.0, true), unit("ru", 7.0, 10.0, true)];
    let w = world(vec![enemy("e", 12.0, 8.0, false)], &[(7, 9)]);
    let d = phalanx_step_decide(&w, &side[1], &side, 7.0);
    assert_eq!(
        d,
        PhalanxDecision::Move {
            col: 8.0,
            row: 10.0
        },
        "N zajety -> E (pin :6609)"
    );
}

/// Pin `:6622-6625`: strona obrony liczy postep jako `-nc` (stepAdv). Ru (7,10) i sojusznik (9,10): lineFront = -9,
/// wiec krok N (7,9) ma stepAdv = -7 = lineFront + 2 (dozwolony), a krok W (6,10) ma stepAdv = -6 (odrzucony).
#[test]
fn defender_advance_uses_negative_column() {
    let side = vec![unit("ru", 7.0, 10.0, false), unit("ally", 9.0, 10.0, false)];
    let w = world(vec![enemy("e", 2.0, 8.0, false)], &[]);
    let d = phalanx_step_decide(&w, &side[0], &side, -9.0);
    assert_eq!(
        d,
        PhalanxDecision::Move { col: 7.0, row: 9.0 },
        "obrona: stepAdv = -nc (pin :6622-6625)"
    );
}

#[test]
fn line_front_none_for_single_living_phalanx() {
    let mut dead = unit("b", 9.0, 0.0, true);
    dead.dead = true;
    let mut routed = unit("c", 1.0, 0.0, true);
    routed.routed = true;
    let mut not_phalanx = unit("d", 0.0, 0.0, true);
    not_phalanx.phalanx = false;
    let side = vec![unit("a", 3.0, 0.0, true), dead, routed, not_phalanx];
    assert_eq!(phalanx_line_front(&side), None);
    assert_eq!(phalanx_line_front(&[]), None);
    assert_eq!(phalanx_line_front(&side[..1]), None);
}
