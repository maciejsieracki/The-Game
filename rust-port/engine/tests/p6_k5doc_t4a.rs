//! P6 SIEGE-TAKTYKA K5DOC-T4a (dispatch R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI): testy zgodnosci helperow sciezki
//! pieszego z pinem `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! * `_firstStepAlongPathToAttack` (`:8565-8622`) -> `first_step_along_path_to_attack`,
//! * `_stepToward` (`:8413-8427`) -> `step_toward`.
//!
//! Wektory: `p6_k5doc_t4a_vectors/vectors.json`, generowane przez `p6_k5doc_t4a_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Stubowane sa tylko `_makeCanAttackFromTest` (tu: `is_goal`) i `_passableForUnit`
//! (tu: `AutoBatchEnv::passable_for_unit`), oba jawnie opisane w wektorze.
//!
//! Nazwane przypadki (asercje wprost, z odniesieniem do linii pina) pokrywaja minimum dispatchu:
//! * prosta sciezka (`:8565-8622`),
//! * zajety heks `occByKey` (`:8594`),
//! * heks nieprzejezdny `_passableForUnit` (`:8605`),
//! * asymetria `allowFirstStep` (`:8593`): zakaz dla kroku z `cur != start` NIE ma wplywu, zakaz dla pierwszego kroku DA,
//! * brak sciezki i start-celem (`:8565-8622`),
//! * `_stepToward` (`:8413-8427`).

use std::collections::HashSet;

use civ_engine::domain::siege_tactics_autobatch::{
    cell_key, AutoBatchEnv, BatchBoard, BatchState, CellKey,
};
use civ_engine::domain::siege_tactics_autophase::AutoBatchIntent;
use civ_engine::domain::siege_tactics_pathstep::{
    first_step_along_path_to_attack, step_toward, Tile,
};
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t4a_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct Case {
    name: String,
    kind: String,
    pin: String,
    unit: [f64; 2],
    goal: Vec<[f64; 2]>,
    target: Option<[f64; 2]>,
    occupied: Vec<[f64; 2]>,
    impassable: Vec<[f64; 2]>,
    allow_forbid: Option<Vec<[f64; 2]>>,
    expect: Option<[f64; 2]>,
}

impl Case {
    fn expect_tile(&self) -> Option<Tile> {
        self.expect.map(|[c, r]| (c, r))
    }
}

fn vectors() -> Vec<Case> {
    serde_json::from_str::<Vectors>(VECTORS)
        .expect("vectors.json poprawny")
        .cases
}

fn named(name: &str) -> Case {
    vectors()
        .into_iter()
        .find(|c| c.name == name)
        .unwrap_or_else(|| panic!("brak nazwanego wektora {name}"))
}

/// Srodowisko testowe `AutoBatchEnv`: jedyna uzywana metoda to `passable_for_unit` (web `_passableForUnit`).
struct TileEnv {
    impassable: HashSet<CellKey>,
}

impl AutoBatchEnv for TileEnv {
    fn plan_unit(
        &mut self,
        _board: &mut BatchBoard,
        _unit_id: &str,
        _intent: &mut AutoBatchIntent,
    ) {
        panic!("plan_unit poza zakresem K5DOC-T4a");
    }
    fn check_end(&mut self, _st: &mut BatchState) -> bool {
        panic!("check_end poza zakresem K5DOC-T4a");
    }
    fn passable_for_unit(&mut self, _st: &BatchState, _unit_id: &str, col: f64, row: f64) -> bool {
        !self.impassable.contains(&cell_key(col, row))
    }
    fn do_move(&mut self, _st: &mut BatchState, _unit_id: &str, _col: f64, _row: f64) {
        panic!("do_move poza zakresem K5DOC-T4a");
    }
    fn apply_terrain_range(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("apply_terrain_range poza zakresem K5DOC-T4a");
    }
    fn do_attack(&mut self, _st: &mut BatchState, _attacker_id: &str, _target_id: &str) {
        panic!("do_attack poza zakresem K5DOC-T4a");
    }
    fn flee_step(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("flee_step poza zakresem K5DOC-T4a");
    }
    fn remove_unit_from_scene(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("remove_unit_from_scene poza zakresem K5DOC-T4a");
    }
    fn shake_allies_on_loss(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("shake_allies_on_loss poza zakresem K5DOC-T4a");
    }
    fn can_strike_target_from(
        &mut self,
        _st: &BatchState,
        _attacker_id: &str,
        _col: f64,
        _row: f64,
        _target_id: &str,
    ) -> bool {
        panic!("can_strike_target_from poza zakresem K5DOC-T4a");
    }
}

/// Uruchamia helper Rust na jednym wektorze. `occupied` trafia do `BatchBoard::occ` (web `occByKey`).
fn run(case: &Case) -> Option<Tile> {
    let mut board = BatchBoard::default();
    for [c, r] in &case.occupied {
        board.occ.insert(cell_key(*c, *r), format!("occ@{c},{r}"));
    }
    let st = BatchState::new(board);
    let mut env = TileEnv {
        impassable: case
            .impassable
            .iter()
            .map(|[c, r]| cell_key(*c, *r))
            .collect(),
    };
    let start = (case.unit[0], case.unit[1]);
    match case.kind.as_str() {
        "first_step" => {
            let goal: HashSet<CellKey> = case.goal.iter().map(|[c, r]| cell_key(*c, *r)).collect();
            let is_goal = |c: f64, r: f64| goal.contains(&cell_key(c, r));
            let forbid: Option<HashSet<CellKey>> = case
                .allow_forbid
                .as_ref()
                .map(|v| v.iter().map(|[c, r]| cell_key(*c, *r)).collect());
            let allow_closure = forbid
                .as_ref()
                .map(|f| move |c: f64, r: f64| !f.contains(&cell_key(c, r)));
            let allow: Option<&dyn Fn(f64, f64) -> bool> = allow_closure
                .as_ref()
                .map(|f| f as &dyn Fn(f64, f64) -> bool);
            first_step_along_path_to_attack(&mut env, &st, "u", start, &is_goal, allow)
        }
        "step_toward" => {
            let target = case
                .target
                .map(|[c, r]| (c, r))
                .expect("step_toward ma target");
            step_toward(&mut env, &st, "u", start, target)
        }
        other => panic!("nieznany rodzaj wektora {other}"),
    }
}

#[test]
fn wektory_zgodne_z_wykonaniem_pina() {
    let all = vectors();
    let mut first = 0usize;
    let mut step = 0usize;
    let mut with_forbid = 0usize;
    let mut found_first = 0usize;
    let mut none_first = 0usize;
    for case in &all {
        let got = run(case);
        assert_eq!(
            got,
            case.expect_tile(),
            "rozjazd Rust vs pin: wektor {} ({}), pin {}",
            case.name,
            case.kind,
            case.pin
        );
        match case.kind.as_str() {
            "first_step" => {
                first += 1;
                if case.allow_forbid.is_some() {
                    with_forbid += 1;
                }
                if got.is_some() {
                    found_first += 1;
                } else {
                    none_first += 1;
                }
            }
            "step_toward" => step += 1,
            _ => unreachable!(),
        }
    }
    // Pokrycie: minimum dispatchu (wektory losowe + nazwane), obie galezie wyniku, zakaz allowFirstStep w czesci scen.
    assert!(first >= 300, "za malo wektorow first_step: {first}");
    assert!(step >= 150, "za malo wektorow step_toward: {step}");
    assert!(
        with_forbid >= 50,
        "za malo scen z allowFirstStep: {with_forbid}"
    );
    assert!(
        found_first >= 50,
        "za malo wynikow z krokiem: {found_first}"
    );
    assert!(none_first >= 5, "za malo wynikow bez kroku: {none_first}");
}

// --- Nazwane przypadki (pin 8565-8622 = _firstStepAlongPathToAttack) ---

/// pin `battleScene.ts:8565-8622`: prosta sciezka w dol, pierwszy krok (5,6).
#[test]
fn prosta_sciezka_pierwszy_krok_pin_8565_8622() {
    let c = named("prosta_sciezka_w_dol");
    assert_eq!(c.pin, "battleScene.ts:8565-8622");
    assert_eq!(run(&c), Some((5.0, 6.0)));
}

/// pin `battleScene.ts:8594` (`occByKey.has(nk)` -> sciana): zajety (5,6) nie moze byc krokiem.
#[test]
fn zajety_heks_occbykey_omijany_pin_8594() {
    let c = named("zajety_heks_occByKey_omijany");
    assert_eq!(c.pin, "battleScene.ts:8594");
    let got = run(&c);
    assert!(got.is_some(), "istnieje droga okrezna");
    assert_ne!(got, Some((5.0, 6.0)), "zajety heks nie moze byc krokiem");
    assert_eq!(got, c.expect_tile());
}

/// pin `battleScene.ts:8605` (`_passableForUnit` -> nieprzejezdny): (5,6) nieprzejezdny nie moze byc krokiem.
#[test]
fn heks_nieprzejezdny_passable_for_unit_omijany_pin_8605() {
    let c = named("heks_nieprzejezdny_passable_omijany");
    assert_eq!(c.pin, "battleScene.ts:8605");
    let got = run(&c);
    assert!(got.is_some(), "istnieje droga okrezna");
    assert_ne!(
        got,
        Some((5.0, 6.0)),
        "nieprzejezdny heks nie moze byc krokiem"
    );
    assert_eq!(got, c.expect_tile());
}

/// pin `battleScene.ts:8593` (asymetria `allowFirstStep`): (4,6) zakazany przez `allowFirstStep`, ale lezy DALEJ niz
/// pierwszy krok (cur != start). Filtr go nie dotyczy, wiec jedyna droga (5,5)->(4,5)->(4,6)->(4,7) zostaje, a pierwszy
/// krok to (4,5). Mutacja "filtr dla wszystkich krokow" daje None i ten test musi wtedy paść.
#[test]
fn asymetria_allow_first_step_dalszy_krok_nie_jest_filtrowany_pin_8593() {
    let c = named("asymetria_allowFirst_dalszy_krok_dozwolony");
    assert_eq!(c.pin, "battleScene.ts:8593");
    assert_eq!(run(&c), Some((4.0, 5.0)));
}

/// pin `battleScene.ts:8593`: zakaz `allowFirstStep` dla JEDYNEGO pierwszego kroku (4,5) -> brak kroku.
#[test]
fn allow_first_step_zakazuje_pierwszego_kroku_pin_8593() {
    let c = named("allowFirst_zakazuje_jedynego_pierwszego_kroku");
    assert_eq!(c.pin, "battleScene.ts:8593");
    assert_eq!(run(&c), None);
}

/// pin `battleScene.ts:8565-8622`: brak sciezki do celu -> brak kroku (`goalKey` pusty).
#[test]
fn brak_sciezki_brak_kroku_pin_8565_8622() {
    let c = named("brak_sciezki_brak_kroku");
    assert_eq!(c.pin, "battleScene.ts:8565-8622");
    assert_eq!(run(&c), None);
}

/// pin `battleScene.ts:8565-8622`: start jest juz celem -> `return null` przed BFS.
#[test]
fn start_jest_celem_brak_kroku_pin_8565_8622() {
    let c = named("start_jest_celem_brak_kroku");
    assert_eq!(c.pin, "battleScene.ts:8565-8622");
    assert_eq!(run(&c), None);
}

// --- Nazwane przypadki (pin 8413-8427 = _stepToward) ---

/// pin `battleScene.ts:8413-8427`: greedy krok w dol do celu (5,9).
#[test]
fn step_toward_prosty_pin_8413_8427() {
    let c = named("greedy_prosty_w_dol");
    assert_eq!(c.pin, "battleScene.ts:8413-8427");
    assert_eq!(run(&c), Some((5.0, 6.0)));
}

/// pin `battleScene.ts:8413-8427`: zajety (5,6) i brak poprawy odleglosci -> brak kroku.
#[test]
fn step_toward_zajety_brak_poprawy_pin_8413_8427() {
    let c = named("greedy_zajety_brak_poprawy");
    assert_eq!(c.pin, "battleScene.ts:8413-8427");
    assert_eq!(run(&c), None);
}

/// pin `battleScene.ts:8413-8427`: nieprzejezdny (6,5) pomijany; zadna sasiednia kratka nie poprawia dystansu.
#[test]
fn step_toward_nieprzejezdny_brak_poprawy_pin_8413_8427() {
    let c = named("greedy_nieprzejezdny_brak_poprawy");
    assert_eq!(c.pin, "battleScene.ts:8413-8427");
    assert_eq!(run(&c), None);
}

/// pin `battleScene.ts:8413-8427`: cel na wschodzie -> krok E (6,5).
#[test]
fn step_toward_na_wschod_pin_8413_8427() {
    let c = named("greedy_w_prawo_gdy_cel_na_wschod");
    assert_eq!(c.pin, "battleScene.ts:8413-8427");
    assert_eq!(run(&c), Some((6.0, 5.0)));
}
