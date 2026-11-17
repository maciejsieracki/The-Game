//! P6 SIEGE-TAKTYKA K5DOC-T4c (dispatch R-RUSTPORT-P6-K5DOC-T4C-DOMOVE): testy zgodnosci efektow stanu `_doMove`
//! z pinem `07d2fbd72` (`gra/src/battle/battleScene.ts`, `_doMove` `:8685-8776`) z `do_move_effects`.
//!
//! Wektory: `p6_k5doc_t4c_vectors/vectors.json`, generowane przez `p6_k5doc_t4c_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Kazdy wektor niesie pole `pin` (zakres linii pina) i `name` (przypadek nazwany albo losowy).
//! Porownanie jest bitowe dla pol `f64` (`to_bits`).
//!
//! Nazwane przypadki pokrywaja: zwykly krok, zajetosc (`occByKey`), clamp kosztu dolny/gorny/`Infinity`, brod na starcie,
//! brod na celu, brak brodu, `moveLeft` nie schodzi ponizej zera, odmowe, galezie planowania (`hold`/`attack`/clamp).

use std::collections::{HashMap, HashSet};

use civ_engine::domain::siege_tactics_autobatch::{cell_key, CellKey};
use civ_engine::domain::siege_tactics_autophase::{
    AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase, AutoBatchStep,
};
use civ_engine::domain::siege_tactics_move_effects::{
    do_move_effects, MoveOutcome, MoveUnit, MoveWorld,
};
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t4c_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    pin: String,
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct Case {
    name: String,
    pin: String,
    input: Input,
    expect: Expect,
}

#[derive(Deserialize)]
struct Input {
    unit: UnitIn,
    col: f64,
    row: f64,
    refused: bool,
    /// `null` w wektorze = `Infinity` (web `_moveCostForUnit` bez przejezdnosci).
    cost: Option<f64>,
    fords: Vec<[f64; 2]>,
    occupancy: Vec<(f64, f64, String)>,
    autobatch: Option<IntentIn>,
}

#[derive(Deserialize)]
struct UnitIn {
    id: String,
    q: f64,
    r: f64,
    move_left: f64,
}

#[derive(Deserialize)]
struct IntentIn {
    kind: String,
    steps: Vec<[f64; 2]>,
}

#[derive(Deserialize)]
struct Expect {
    q: f64,
    r: f64,
    move_left: f64,
    occupancy: Vec<(f64, f64, String)>,
    facing_calls: usize,
    done: bool,
    intent: Option<IntentOut>,
}

#[derive(Deserialize)]
struct IntentOut {
    kind: String,
    steps: Vec<[f64; 2]>,
}

fn vectors() -> Vec<Case> {
    let v: Vectors = serde_json::from_str(VECTORS).expect("vectors.json poprawny");
    assert_eq!(
        v.pin, "07d2fbd72f758705f8e1d59cc4968027ffbafe75",
        "wektory z innego pina"
    );
    v.cases
}

fn named(name: &str) -> Case {
    vectors()
        .into_iter()
        .find(|c| c.name == name)
        .unwrap_or_else(|| panic!("brak nazwanego wektora {name}"))
}

/// Swiat testowy: `occByKey` (web), koszt wejscia (web `_moveCostForUnit`), brody (web `isFordTile`) i licznik
/// wejscia facing (web `_updateFacing`, #107 zablokowany).
struct TestWorld {
    occ: HashMap<CellKey, String>,
    cost: f64,
    fords: HashSet<CellKey>,
    facing_calls: usize,
}

impl MoveWorld for TestWorld {
    fn occ_mut(&mut self) -> &mut HashMap<CellKey, String> {
        &mut self.occ
    }
    fn move_cost(&self, _col: f64, _row: f64) -> f64 {
        self.cost
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.fords.contains(&cell_key(col, row))
    }
    fn update_facing(&mut self, _unit_id: &str) {
        self.facing_calls += 1;
    }
}

fn kind_from(s: &str) -> AutoBatchIntentKind {
    match s {
        "hold" => AutoBatchIntentKind::Hold,
        "move" => AutoBatchIntentKind::Move,
        "attack" => AutoBatchIntentKind::Attack,
        other => panic!("nieznany rodzaj zamiaru {other}"),
    }
}

/// Wykonuje efekty ruchu Rust dla jednego wektora i zwraca (jednostka po ruchu, zamiar po ruchu, wynik, swiat).
fn run(case: &Case) -> (MoveUnit, Option<AutoBatchIntent>, MoveOutcome, TestWorld) {
    let inp = &case.input;
    let mut world = TestWorld {
        occ: HashMap::new(),
        cost: inp.cost.unwrap_or(f64::INFINITY),
        fords: inp.fords.iter().map(|[c, r]| cell_key(*c, *r)).collect(),
        facing_calls: 0,
    };
    for (c, r, id) in &inp.occupancy {
        world.occ.insert(cell_key(*c, *r), id.clone());
    }
    let mut unit = MoveUnit {
        id: inp.unit.id.clone(),
        q: inp.unit.q,
        r: inp.unit.r,
        move_left: inp.unit.move_left,
    };
    let mut intent = inp.autobatch.as_ref().map(|a| AutoBatchIntent {
        unit_id: inp.unit.id.clone(),
        side: AutoBatchPhase::Atk,
        kind: kind_from(&a.kind),
        steps: a
            .steps
            .iter()
            .map(|[c, r]| AutoBatchStep { col: *c, row: *r })
            .collect(),
        target_id: None,
    });
    let outcome = do_move_effects(
        &mut world,
        &mut unit,
        inp.col,
        inp.row,
        inp.refused,
        intent.as_mut(),
    );
    (unit, intent, outcome, world)
}

fn check(case: &Case) {
    let (unit, intent, outcome, world) = run(case);
    let e = &case.expect;
    let tag = format!("{} ({})", case.name, case.pin);
    assert_eq!(unit.q.to_bits(), e.q.to_bits(), "{tag}: q");
    assert_eq!(unit.r.to_bits(), e.r.to_bits(), "{tag}: r");
    assert_eq!(
        unit.move_left.to_bits(),
        e.move_left.to_bits(),
        "{tag}: moveLeft {} != {}",
        unit.move_left,
        e.move_left
    );
    // Zajetosc: kazdy oczekiwany wpis jest w `occByKey`, a liczba kluczy sie zgadza (brak starego klucza).
    assert_eq!(
        world.occ.len(),
        e.occupancy.len(),
        "{tag}: liczba kluczy occByKey"
    );
    for (c, r, id) in &e.occupancy {
        assert_eq!(
            world.occ.get(&cell_key(*c, *r)),
            Some(id),
            "{tag}: occByKey[{c},{r}]"
        );
    }
    assert_eq!(
        world.facing_calls, e.facing_calls,
        "{tag}: wywolania facing"
    );
    assert_eq!(outcome.done, e.done, "{tag}: done() synchronicznie");
    match (&intent, &e.intent) {
        (None, None) => {}
        (Some(got), Some(want)) => {
            assert_eq!(got.kind, kind_from(&want.kind), "{tag}: intent.kind");
            let got_steps: Vec<[f64; 2]> = got.steps.iter().map(|s| [s.col, s.row]).collect();
            assert_eq!(got_steps, want.steps, "{tag}: intent.steps");
        }
        _ => panic!("{tag}: intent Some/None rozni sie od wektora"),
    }
}

#[test]
fn vektory_pina_wszystkie_zgodne() {
    let cases = vectors();
    assert!(cases.len() >= 300, "za malo wektorow: {}", cases.len());
    for case in &cases {
        check(case);
    }
}

#[test]
fn zwykly_krok_bezposredni_zajetosc_i_moveleft() {
    check(&named("zwykly_krok_bezposredni"));
}

#[test]
fn zajetosc_sasiada_zachowana() {
    check(&named("zajetosc_sasiad_zachowany"));
}

#[test]
fn koszt_clamp_dolny_do_jednego() {
    // pin :8700 Math.max(1, Math.min(cost, 99)): koszt 0.4 -> 1.
    check(&named("koszt_clamp_dolny_1"));
}

#[test]
fn koszt_clamp_gorny_do_99() {
    check(&named("koszt_clamp_gorny_99"));
}

#[test]
fn koszt_nieskonczony_daje_99() {
    check(&named("koszt_infinity_daje_99"));
}

#[test]
fn brod_na_starcie_podwaja_koszt() {
    // pin :8701-8703: stepCost = enterCost / BROD_RUCH_MULT (0.5).
    check(&named("brod_na_starcie"));
}

#[test]
fn brod_na_celu_podwaja_koszt() {
    check(&named("brod_na_celu"));
}

#[test]
fn brak_brodu_koszt_pelny() {
    check(&named("brak_brodu_koszt_pelny"));
}

#[test]
fn move_left_nie_schodzi_ponizej_zera() {
    check(&named("moveLeft_nie_ponizej_zera"));
}

#[test]
fn odmowa_zeruje_moveleft_bez_zmian_zajetosci_i_facing() {
    // pin :8689-8692: moveLeft = 0; done(); return. Brak wejscia facing i brak ruchu.
    let c = named("odmowa_moveLeft_zero");
    check(&c);
    let d = named("odmowa_nie_rusza_zajetosci");
    check(&d);
}

#[test]
fn planowanie_hold_zamienia_sie_w_move() {
    // pin :8705: if (intent.kind !== 'attack') intent.kind = 'move'.
    check(&named("planowanie_hold_staje_sie_move"));
}

#[test]
fn planowanie_attack_zostaje_attack() {
    check(&named("planowanie_attack_zostaje"));
}

#[test]
fn planowanie_brod_i_clamp_razem() {
    check(&named("planowanie_brod_i_clamp"));
}
