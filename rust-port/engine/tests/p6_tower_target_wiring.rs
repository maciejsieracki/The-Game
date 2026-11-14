//! R-RUSTPORT-P6-WIEZE-MERGE-Q1 (etap 1): wiring wyboru celu wieży (`pick_tower_target`) do produkcyjnej pętli oblężenia.
//!
//! - Wektory: `p6_tower_target_wiring_vectors/vectors.json`, generowane przez `p6_tower_target_wiring_gen.mjs`, który
//!   WYKONUJE `pickTowerTarget` z pinu 07d2fbd72 (`gra/src/game/city-towers.ts`) i sprawdza SHA-256 pliku i wyciętego
//!   fragmentu. Test sprawdza te skróty i porównuje `pick_tower_target` z wykonaniem pinu na każdym przypadku.
//! - Liczniki niepustości: test wylicza je sam z wejść wektorów i porównuje z zapisanymi w pliku; każdy kluczowy licznik
//!   musi być > 0 (remis HP, martwy wróg, wróg poza zasięgiem, wróg na własnym kafelku, zasięg NaN i Infinity).
//! - Wiring: `SiegeEnv::fire_siege_towers` (produkcyjne wywołanie z `begin_turn`) wybiera cel przez `pick_tower_target`.
//!   Odroczenie 180 ms i strzał `_singleBlow` NIE są w tym etapie (etap 2).

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, SiegeEnv};
use civ_engine::domain::siege_tactics_tower::{pick_tower_target, TowerTarget};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const FILE_SHA256: &str = "cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4";
const FRAGMENT_SHA256: &str = "56a196fe638705e1883506e315b059116268e49b20b679a90db1448ebe3da333";

fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("liczba w wektorze"),
        },
        other => other.as_f64().expect("liczba w wektorze"),
    }
}

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_tower_target_wiring_vectors/vectors.json"))
        .expect("vectors")
}

fn manhattan(tq: i64, tr: i64, q: i64, r: i64) -> f64 {
    ((tq - q).abs() + (tr - r).abs()) as f64
}

#[derive(Default, Debug)]
struct Counters {
    cases: u64,
    hit: u64,
    none: u64,
    dead_matters: u64,
    range_matters: u64,
    own_tile_present: u64,
    tie_break: u64,
    nan_range: u64,
    inf_range: u64,
}

#[test]
fn vectors_match_pin_pick_tower_target() {
    let v = vectors();
    assert_eq!(v["pin"].as_str(), Some(PIN));
    assert_eq!(
        v["file_sha256"].as_str(),
        Some(FILE_SHA256),
        "skrot city-towers.ts"
    );
    assert_eq!(
        v["fragment_sha256"].as_str(),
        Some(FRAGMENT_SHA256),
        "skrot fragmentu pickTowerTarget"
    );

    let mut c = Counters::default();
    for case in v["cases"].as_array().expect("cases") {
        let tq = case["tower"]["q"].as_i64().expect("tower.q");
        let tr = case["tower"]["r"].as_i64().expect("tower.r");
        let range = num(&case["range"]);
        let enemies: Vec<TowerTarget> = case["enemies"]
            .as_array()
            .expect("enemies")
            .iter()
            .map(|e| TowerTarget {
                q: e["q"].as_i64().expect("q"),
                r: e["r"].as_i64().expect("r"),
                hp: num(&e["hp"]),
                dead: e["dead"].as_bool().expect("dead"),
            })
            .collect();
        let exp = case["expected"].as_i64().expect("expected");

        let got = pick_tower_target(tq, tr, range, &enemies);
        let got_i = got.map_or(-1, |i| i as i64);
        assert_eq!(got_i, exp, "przypadek {case}");

        c.cases += 1;
        if got.is_some() {
            c.hit += 1;
        } else {
            c.none += 1;
        }
        if range.is_nan() {
            c.nan_range += 1;
        }
        if range == f64::INFINITY {
            c.inf_range += 1;
        }
        if enemies.iter().any(|e| manhattan(tq, tr, e.q, e.r) < 1.0) {
            c.own_tile_present += 1;
        }
        let undead: Vec<TowerTarget> = enemies
            .iter()
            .map(|e| TowerTarget { dead: false, ..*e })
            .collect();
        if pick_tower_target(tq, tr, range, &undead) != got {
            c.dead_matters += 1;
        }
        if pick_tower_target(tq, tr, f64::INFINITY, &enemies) != got {
            c.range_matters += 1;
        }
        let in_range: Vec<(f64, f64)> = enemies
            .iter()
            .filter(|e| !e.dead)
            .map(|e| (manhattan(tq, tr, e.q, e.r), e.hp))
            .filter(|&(d, _)| d >= 1.0 && d <= range)
            .collect();
        if in_range
            .iter()
            .any(|a| in_range.iter().any(|b| a.0 == b.0 && a.1 != b.1))
        {
            c.tie_break += 1;
        }
    }

    let jc = &v["counters"];
    assert_eq!(jc["cases"].as_u64(), Some(c.cases), "liczba przypadkow");
    assert_eq!(jc["hit"].as_u64(), Some(c.hit));
    assert_eq!(jc["none"].as_u64(), Some(c.none));
    assert_eq!(jc["dead_matters"].as_u64(), Some(c.dead_matters));
    assert_eq!(jc["range_matters"].as_u64(), Some(c.range_matters));
    assert_eq!(jc["own_tile_present"].as_u64(), Some(c.own_tile_present));
    assert_eq!(jc["tie_break"].as_u64(), Some(c.tie_break));
    assert_eq!(jc["nan_range"].as_u64(), Some(c.nan_range));
    assert_eq!(jc["inf_range"].as_u64(), Some(c.inf_range));

    assert!(c.hit > 0, "brak trafien: {c:?}");
    assert!(
        c.dead_matters > 0,
        "martwy wrog nigdy nie zmienia wyboru: {c:?}"
    );
    assert!(c.range_matters > 0, "zasieg nie zmienia wyboru: {c:?}");
    assert!(c.own_tile_present > 0, "brak wroga na kafelku wiezy: {c:?}");
    assert!(c.tie_break > 0, "brak remisu odleglosci z roznym HP: {c:?}");
    assert!(c.nan_range > 0, "brak zasiegu NaN: {c:?}");
    assert!(c.inf_range > 0, "brak zasiegu Infinity: {c:?}");
}

// ---------------------------------------------------------------------------------------------------------------------
// Wiring produkcyjnej pętli: `SiegeEnv::fire_siege_towers` (wywoływane przez `begin_turn`).

struct CellBody {
    atk_cells: Vec<Option<(i64, i64)>>,
}

impl LoopBody for CellBody {
    fn start(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> f64 {
        0.0
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        match unit.side {
            BattleSide::Attacker => self.atk_cells.get(unit.idx).copied().flatten(),
            BattleSide::Defender => None,
        }
    }
}

fn cu(hp: f64) -> CombatUnit {
    CombatUnit {
        hp,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

fn state(atk: &[f64], def: &[f64], wall_col: i64) -> TurnSeqState {
    let units = |hps: &[f64]| -> Vec<SeqUnit> {
        hps.iter()
            .enumerate()
            .map(|(i, &hp)| SeqUnit {
                id: i as u64,
                c: cu(hp),
            })
            .collect()
    };
    TurnSeqState {
        atk: units(atk),
        def: units(def),
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: wall_col,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    }
}

fn env(
    atk_cells: Vec<Option<(i64, i64)>>,
    tower: Option<UnitRef>,
    tower_rows: Vec<i64>,
    wall_tile_rows: Vec<i64>,
    tower_range: f64,
) -> SiegeEnv<CellBody> {
    SiegeEnv {
        body: CellBody { atk_cells },
        tower,
        tower_rows,
        tower_range,
        wall_tile_rows,
        wall_ever_breached: false,
        no_breach_cap: 0,
        move_points: [Vec::new(), Vec::new()],
        morale_max: [Vec::new(), Vec::new()],
    }
}

fn atk_dead(st: &TurnSeqState) -> Vec<bool> {
    st.atk.iter().map(|u| u.c.dead).collect()
}

#[test]
fn tower_fires_at_nearest_in_range_attacker_with_hp_tie_break() {
    // Wieza (5,3), zasieg 2. A0 (7,3) d=2 hp 10; A1 (6,4) d=2 hp 4 (remis, mniejsze HP); A2 (9,9) poza zasiegiem.
    let mut st = state(&[10.0, 4.0, 3.0], &[], 5);
    let mut e = env(
        vec![Some((7, 3)), Some((6, 4)), Some((9, 9))],
        None,
        vec![3],
        vec![3],
        2.0,
    );
    e.fire_siege_towers(&mut st);
    assert_eq!(atk_dead(&st), vec![false, true, false]);
}

#[test]
fn tower_without_wall_tile_does_not_fire() {
    // Brak kafla muru na wierszu wieży: web `_destroyTowerAtRow` (etap 2), tu brak strzału.
    let mut st = state(&[10.0], &[], 5);
    let mut e = env(vec![Some((7, 3))], None, vec![3], Vec::new(), 2.0);
    e.fire_siege_towers(&mut st);
    assert_eq!(atk_dead(&st), vec![false]);
}

#[test]
fn unit_without_cell_is_not_targeted() {
    // A0 najbliżej (6,3), ale bez pozycji: wieża musi wybrać A1 (7,3).
    let mut st = state(&[1.0, 10.0], &[], 5);
    let mut e = env(vec![None, Some((7, 3))], None, vec![3], vec![3], 2.0);
    e.fire_siege_towers(&mut st);
    assert_eq!(atk_dead(&st), vec![false, true]);
}

#[test]
fn picks_are_taken_before_placeholder_hits_land() {
    // Wieże na wierszach 3 i 4 (kolumna 5), zasieg 2. A0 (6,4): d=2 od wieży 3, d=1 od wieży 4 -> obie wieże
    // wybierają A0 (wybory przed trafieniami, jak w pinie: trafienie przychodzi po `_schedule`). A1 (5,6) przeżywa.
    let mut st = state(&[10.0, 5.0], &[], 5);
    let mut e = env(
        vec![Some((6, 4)), Some((5, 6))],
        None,
        vec![3, 4],
        vec![3, 4],
        2.0,
    );
    e.fire_siege_towers(&mut st);
    assert_eq!(atk_dead(&st), vec![true, false]);
}

#[test]
fn placeholder_still_used_when_no_tower_rows() {
    // Etap 1: bez `tower_rows` działa stary placeholder na wskazanej jednostce obrońcy.
    let mut st = state(&[10.0], &[5.0], 5);
    let tower = Some(UnitRef {
        side: BattleSide::Defender,
        idx: 0,
    });
    let mut e = env(vec![Some((7, 3))], tower, Vec::new(), Vec::new(), 2.0);
    e.fire_siege_towers(&mut st);
    assert!(st.def[0].c.dead);
    assert_eq!(atk_dead(&st), vec![false]);
}
