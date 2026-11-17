//! P6 SIEGE-TAKTYKA K5DOC-T7b (dispatch R-RUSTPORT-P6-K5DOC-T7B-ODWROT): testy zgodnosci odwrotu z pinem `07d2fbd72`
//! (`gra/src/battle/battleScene.ts`, `_bestFallBackStep` `:7186-7219`, `_fallBackStep` `:7228-7244`).
//!
//! Wektory: `p6_k5doc_t7b_vectors/vectors.json`, generowane przez `p6_k5doc_t7b_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Przypadki nazwane pokrywaja: brak sasiada, zajete pole, nieprzejezdne pole, `dMin <= 1`,
//! `dMin < dNow`, `homeBias` (atk i def), remis wg DIRS4, granice planszy (nc<0, nc>=BF_COLS, nr>=BF_ROWS, nr<0),
//! brak wrogow, `nearest == None`, zaklinowanie, krok z zaplanowaniem i bez, guardy (finished, dead, fading, moveLeft).
//! Reszta to wektory losowe (ziarno generatora) z wykonania pina.

use civ_engine::domain::siege_tactics_advance::AfterStep;
use civ_engine::domain::siege_tactics_fallback::{
    best_fall_back_step, fall_back_after_move, fall_back_step_decide, FallBackDecision,
    FallBackUnit, FallBackWorld,
};
use civ_engine::domain::siege_tactics_pathstep::Tile;
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t7b_vectors/vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";

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
    finished: bool,
    enemies: Vec<[f64; 2]>,
    nearest: Option<[f64; 2]>,
    occupied: Vec<[f64; 2]>,
    impassable: Vec<[f64; 2]>,
    move_left_after: f64,
}

#[derive(Deserialize)]
struct UnitIn {
    id: String,
    q: f64,
    r: f64,
    is_atk: bool,
    dead: bool,
    fading_out: bool,
    move_left: f64,
}

#[derive(Deserialize)]
struct Expect {
    best: Option<[f64; 2]>,
    step: StepIn,
}

#[derive(Deserialize)]
struct StepIn {
    moves: Vec<[f64; 2]>,
    scheduled_ms: Option<u32>,
    done_calls: u32,
}

/// Stan sceny z wektora (wejscia `FallBackWorld`).
struct VecWorld {
    enemies: Vec<Tile>,
    nearest: Option<Tile>,
    occupied: Vec<Tile>,
    impassable: Vec<Tile>,
}

impl FallBackWorld for VecWorld {
    fn enemies(&self, _unit_id: &str) -> Vec<Tile> {
        self.enemies.clone()
    }
    fn nearest_enemy(&self, _unit_id: &str) -> Option<Tile> {
        self.nearest
    }
    fn is_occupied(&self, col: f64, row: f64) -> bool {
        self.occupied.contains(&(col, row))
    }
    fn passable(&self, _unit_id: &str, col: f64, row: f64) -> bool {
        !self.impassable.contains(&(col, row))
    }
}

fn tile(t: [f64; 2]) -> Tile {
    (t[0], t[1])
}

fn world_of(input: &Input) -> VecWorld {
    VecWorld {
        enemies: input.enemies.iter().copied().map(tile).collect(),
        nearest: input.nearest.map(tile),
        occupied: input.occupied.iter().copied().map(tile).collect(),
        impassable: input.impassable.iter().copied().map(tile).collect(),
    }
}

fn unit_of(u: &UnitIn) -> FallBackUnit {
    FallBackUnit {
        id: u.id.clone(),
        q: u.q,
        r: u.r,
        is_atk: u.is_atk,
        dead: u.dead,
        fading_out: u.fading_out,
        move_left: u.move_left,
    }
}

#[test]
fn wektory_pina_sa_zgodne_z_best_i_krokiem() {
    let v: Vectors = serde_json::from_str(VECTORS).expect("vectors.json");
    assert_eq!(v.pin, PIN, "wektory musza pochodzic z pinu 07d2fbd72");
    assert!(
        v.cases.len() >= 400,
        "za malo przypadkow: {}",
        v.cases.len()
    );

    for c in &v.cases {
        let world = world_of(&c.input);
        let unit = unit_of(&c.input.unit);
        let ctx = format!("przypadek {} (pin {})", c.name, c.pin);

        // `_bestFallBackStep`.
        let best = best_fall_back_step(&world, &unit);
        assert_eq!(best, c.expect.best.map(tile), "best: {ctx}");

        // `_fallBackStep` (decyzja + callback po ruchu).
        let decision = fall_back_step_decide(&world, c.input.finished, &unit);
        match c.expect.step.moves.first() {
            None => {
                assert_eq!(
                    decision,
                    FallBackDecision::Done,
                    "brak ruchu w pinie: {ctx}"
                );
                assert_eq!(c.expect.step.done_calls, 1, "done w pinie: {ctx}");
                assert_eq!(
                    c.expect.step.scheduled_ms, None,
                    "brak schedule w pinie: {ctx}"
                );
            }
            Some(m) => {
                assert_eq!(
                    decision,
                    FallBackDecision::Move {
                        col: m[0],
                        row: m[1]
                    },
                    "krok: {ctx}"
                );
                let after = fall_back_after_move(c.input.finished, c.input.move_left_after);
                match c.expect.step.scheduled_ms {
                    Some(ms) => {
                        assert_eq!(
                            after,
                            AfterStep::Schedule { ms },
                            "schedule po ruchu: {ctx}"
                        );
                        assert_eq!(c.expect.step.done_calls, 0, "done przy schedule: {ctx}");
                    }
                    None => {
                        assert_eq!(after, AfterStep::Done, "koniec po ruchu: {ctx}");
                        assert_eq!(c.expect.step.done_calls, 1, "done bez schedule: {ctx}");
                    }
                }
            }
        }
    }
}

#[test]
fn pokrycie_wektorow_obejmuje_zaklinowanie_remis_i_schedule() {
    let v: Vectors = serde_json::from_str(VECTORS).expect("vectors.json");
    let none_best = v.cases.iter().filter(|c| c.expect.best.is_none()).count();
    let some_best = v.cases.iter().filter(|c| c.expect.best.is_some()).count();
    let scheduled = v
        .cases
        .iter()
        .filter(|c| c.expect.step.scheduled_ms.is_some())
        .count();
    assert!(none_best >= 10, "za malo zaklinowan: {none_best}");
    assert!(some_best >= 100, "za malo krokow: {some_best}");
    assert!(scheduled >= 50, "za malo schedule: {scheduled}");
    for name in [
        "brak_wolnego_sasiada",
        "zajete_pole_odrzucone",
        "nieprzejezdne_odrzucone",
        "dmin_le_1_odrzucone",
        "dmin_mniejsze_niz_dnow_odrzucone",
        "mutacja_a_dmin_rowne_dnow_przyjety",
        "mutacja_b_remis_pierwszy_w_dirs4",
        "mutacja_c_home_bias_atk",
        "mutacja_c_home_bias_def",
        "granica_nr_lt_0",
        "granica_nc_ge_BF_COLS",
        "granica_nr_ge_BF_ROWS",
        "brak_wrogow",
        "najblizszy_null_przy_niepustych_wrogach",
        "zaklinowany_pojedynczy",
        "krok_z_zaplanowaniem",
        "krok_koniec_ruchu",
        "guard_finished",
        "guard_dead",
        "guard_fading",
        "guard_moveleft_zero",
    ] {
        assert!(
            v.cases.iter().any(|c| c.name == name),
            "brak przypadku nazwanego {name}"
        );
    }
}
