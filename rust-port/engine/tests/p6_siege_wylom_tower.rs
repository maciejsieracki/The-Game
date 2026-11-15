//! R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1: stan zniszczenia wieży przy wyłomie w pętli taktycznej oblężenia.
//!
//! - Wektory: `p6_siege_wylom_vectors/vectors.json`, generowane przez `p6_siege_wylom_gen.mjs`, który WYKONUJE metody
//!   pinu `07d2fbd72` (`_destroyTowerAtRow`, `_fireSiegeTowers`, `_fireOneTower`, `_breachWallTile`, `_schedule`,
//!   `pickTowerTarget`) z SHA-256 pliku i fragmentów. Test porównuje każdy krok (planowanie, wyłom, odpalenie zegara)
//!   z pinem: odroczenia salwy, trafienia wieżą, stan muru i zburzenia wież.
//! - Wyłom: [`breach_wall_tile`] usuwa kafel i w tym samym wywołaniu zburza wieżę na wierszu
//!   (predykat: kafla nie ma w `wall_tile_hp`); [`SiegeEnv::sync_wall_state`] przenosi ten stan do pętli.
//! - Liczniki niepustości: każdy kluczowy scenariusz musi mieć trafienia, odroczenia i zburzenia (test sprawdza to
//!   sam z wektorów, nie z ręcznych liczb).
//! - Mutacja (ręczna, opisana w `01-operator-impl.md`): usunięcie `wall_tile_hp.remove` w `breach_wall_tile`
//!   musi dać FAIL w testach poniżej.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_blow_full::FullBlowInput;
use civ_engine::domain::siege_tactics_breach::{breach_wall_tile, WallState};
use civ_engine::domain::siege_tactics_clock::{ScheduleOutcome, VirtualClock};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    neutral_tower_shot_template, LoopBody, LoopTimer, SiegeEnv, SiegeLoop,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::{json, Value};

const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const BATTLE_SHA256: &str = "d784735e185c63f03d95c12a5de33855106b79432001dcc382c5ef335989d21d";
const TOWERS_SHA256: &str = "cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4";

const VECTORS: &str = include_str!("p6_siege_wylom_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors")
}

fn scenario<'a>(v: &'a Value, id: &str) -> &'a Value {
    v["scenarios"]
        .as_array()
        .expect("scenarios")
        .iter()
        .find(|s| s["id"] == id)
        .unwrap_or_else(|| panic!("brak scenariusza {id}"))
}

/// Ciało jednostek dla pętli: bez czasu trwania i efektów (ruch nie zmienia wyboru celu wieży w tych scenariuszach),
/// rejestruje cele trafień wieży w kolejności wywołań (web `_singleBlow(shooter, target, true)`).
struct RecBody {
    atk_cells: Vec<Option<(i64, i64)>>,
    blows: Vec<usize>,
}

impl LoopBody for RecBody {
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
    fn tower_blow(&mut self, _tmpl: &FullBlowInput, target: usize, _st: &mut TurnSeqState) {
        self.blows.push(target);
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

fn state(atk_hps: &[f64], wall_col: i64) -> TurnSeqState {
    TurnSeqState {
        atk: atk_hps
            .iter()
            .enumerate()
            .map(|(i, &hp)| SeqUnit {
                id: i as u64,
                c: cu(hp),
            })
            .collect(),
        def: Vec::new(),
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

fn wall_from_rows(rows: &[i64], wall_col: i32) -> WallState {
    WallState {
        wall_col,
        gate_col: -1,
        gate_hp: 0.0,
        gate_open: false,
        wall_tile_hp: rows.iter().map(|&r| (r as i32, 100.0)).collect(),
        wall_tiles_init: rows.len(),
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    }
}

/// Pozycje atakujących z wektora (`atk: [{q, r, hp}]`); `None` nie występuje w tych scenariuszach.
fn atk_cells(sc: &Value) -> Vec<Option<(i64, i64)>> {
    sc["atk"]
        .as_array()
        .map(|a| {
            a.iter()
                .map(|u| Some((u["q"].as_i64().unwrap(), u["r"].as_i64().unwrap())))
                .collect()
        })
        .unwrap_or_default()
}

/// Wykonuje kroki scenariusza na produkcyjnej pętli (`SiegeEnv` + `SiegeLoop` + `VirtualClock`) i zwraca obserwacje
/// w TYM SAMYM kształcie co wektory (`op`, `row`, `planned`, `blows`, `snapshot`).
fn run_rust(sc: &Value) -> Vec<Value> {
    let wall_col = sc["wallCol"].as_i64().unwrap();
    let towers: Vec<i64> = sc["towers"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    let wall_rows: Vec<i64> = sc["wallRows"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    let range = sc["range"].as_f64().unwrap();
    let atk_hps: Vec<f64> = sc["atk"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| u["hp"].as_f64().unwrap())
        .collect();

    let mut wall = wall_from_rows(&wall_rows, wall_col as i32);
    let env = SiegeEnv {
        body: RecBody {
            atk_cells: atk_cells(sc),
            blows: Vec::new(),
        },
        tower_rows: towers.clone(),
        pending_tower_shots: Vec::new(),
        tower_range: range,
        tower_shot: Some(neutral_tower_shot_template()),
        wall_tile_rows: wall_rows.clone(),
        wall_ever_breached: false,
        // Sufit tur bez wyłomu wyłączony: wektory pinu nie modelują zakończenia bitwy przez sufit tur (scenariusze
        // obejmują jedną salwę i jej trafienia). Bez tego sufit kończy bitwę przed trafieniem, gdy nie było wyłomu.
        no_breach_cap: 1_000_000,
        move_points: [Vec::new(), Vec::new()],
        morale_max: [Vec::new(), Vec::new()],
    };
    let mut lp = SiegeLoop::new(state(&atk_hps, wall_col), env);
    let mut clock: VirtualClock<LoopTimer> = VirtualClock::new();
    let mut out = Vec::new();

    for step in sc["steps"].as_array().unwrap() {
        let op = step["op"].as_str().unwrap();
        let before = lp.env.body.blows.len();
        let mut obs = json!({ "op": op });
        match op {
            "fire" => {
                lp.env.fire_siege_towers(&mut lp.st);
                let planned: Vec<f64> = lp.env.pending_tower_shots.iter().map(|p| p.ms).collect();
                for p in std::mem::take(&mut lp.env.pending_tower_shots) {
                    let outcome = clock.schedule(p.ms, LoopTimer::TowerShot(p.tower), p.planning);
                    assert!(
                        !matches!(outcome, ScheduleOutcome::RunNow(_)),
                        "planowanie AUTO poza scenariuszem"
                    );
                }
                obs["planned"] = json!(planned);
            }
            "breach" => {
                let row = step["row"].as_i64().unwrap();
                wall = breach_wall_tile(&wall, row as i32, true);
                lp.env.sync_wall_state(&wall);
                obs["row"] = json!(row);
            }
            "drain" => {
                let _ = lp.resume(&mut clock, 10_000);
            }
            other => panic!("nieznany krok {other}"),
        }
        obs["blows"] = json!(lp.env.body.blows[before..].to_vec());
        let mut wall_rows_now: Vec<i64> = wall.wall_tile_hp.keys().map(|&r| i64::from(r)).collect();
        wall_rows_now.sort_unstable();
        // Stan zburzenia wież liczony dwiema drogami: czystą funkcją na WallState i obecnością w pętli.
        let destroyed: Vec<bool> = towers
            .iter()
            .map(|&r| {
                let pure = !wall.wall_tile_hp.contains_key(&(r as i32));
                let in_loop = !lp.env.wall_tile_rows.contains(&r);
                assert_eq!(
                    pure, in_loop,
                    "stan zburzenia wieży na wierszu {r} rozjechany"
                );
                pure
            })
            .collect();
        obs["snapshot"] = json!({
            "wallRows": wall_rows_now,
            "destroyed": destroyed,
            "wallEverBreached": wall.wall_ever_breached,
        });
        assert_eq!(lp.env.wall_ever_breached, wall.wall_ever_breached);
        out.push(obs);
    }
    out
}

/// Odroczenia salwy jako `f64` (JSON z pinu zapisuje `0`/`180` jako liczby całkowite).
fn planned_of(v: &Value) -> Option<Vec<f64>> {
    v.get("planned").map(|p| {
        p.as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_f64().unwrap())
            .collect()
    })
}

fn assert_matches_pin(id: &str) {
    let v = vectors();
    let expected = scenario(&v, id)["steps"].as_array().unwrap().clone();
    let observed = run_rust(scenario(&v, id));
    assert_eq!(observed.len(), expected.len(), "{id}: liczba kroków");
    for (i, (o, e)) in observed.iter().zip(expected.iter()).enumerate() {
        assert_eq!(o.get("op"), e.get("op"), "{id} krok {i}: op");
        assert_eq!(o.get("row"), e.get("row"), "{id} krok {i}: wiersz wyłomu");
        assert_eq!(
            planned_of(o),
            planned_of(e),
            "{id} krok {i}: odroczenia salwy"
        );
        assert_eq!(
            o.get("blows"),
            e.get("blows"),
            "{id} krok {i}: trafienia wieżą"
        );
        assert_eq!(
            o.get("snapshot"),
            e.get("snapshot"),
            "{id} krok {i}: stan muru i wież"
        );
    }
}

#[test]
fn wylom_po_zaplanowaniu_salwy_wieza_nie_strzela_przed_strzalem() {
    // Wieża na wierszu 2 zaplanowana (odroczenie 0), wyłom PRZED odpaleniem zegara: jej strzał się nie wykonuje.
    // Wieża na wierszu 4 (odroczenie 180) strzela normalnie.
    assert_matches_pin("wylom-po-planowaniu-przed-strzalem");
}

#[test]
fn brak_kafla_przy_planowaniu_zburzona_wieza_nie_jest_planowana() {
    // Wieża na wierszu 1 bez kafla: zburzona już przy planowaniu (web `_destroyTowerAtRow`), bez odroczenia i bez strzału.
    assert_matches_pin("brak-kafla-przy-planowaniu");
}

#[test]
fn wylom_przed_kolejna_salwa_pomija_zniszczona_wieze() {
    // Pierwsza salwa: obie wieże trafiają. Wyłom na wierszu 2. Druga salwa planuje tylko wieżę na wierszu 4.
    assert_matches_pin("wylom-przed-kolejna-salwa");
}

#[test]
fn breach_wall_tile_usuwa_kafel_i_zburza_wieze_w_tym_samym_wywolaniu() {
    // Czysta funkcja (web `_breachWallTile` :7645-7647): po jednym wywołaniu kafel znika, wieża na tym wierszu jest
    // zburzona, flaga wyłomu ustawiona; wieża na innym wierszu zostaje nienaruszona.
    let w0 = wall_from_rows(&[2, 4], 5);
    assert!(w0.wall_tile_hp.contains_key(&2));
    let w1 = breach_wall_tile(&w0, 2, true);
    assert!(
        !w1.wall_tile_hp.contains_key(&2),
        "wieża na wyłomie musi być zburzona"
    );
    assert!(
        w1.wall_tile_hp.contains_key(&4),
        "sąsiednia wieża nie może być zburzona"
    );
    assert!(w1.wall_ever_breached);
    // Brak tablicy terenu: web `return` przed wszystkim (`:7640`), stan bez zmian.
    let w2 = breach_wall_tile(&w0, 2, false);
    assert_eq!(w2, w0);
}

#[test]
fn wektory_zawieraja_trafienia_odroczenia_i_zburzenia() {
    // Licznik niepustości: wektory muszą faktycznie zawierać trafienia, odroczenia i zburzenia (nie ręczna liczba).
    let v = vectors();
    let mut blows = 0usize;
    let mut staggered = 0usize;
    let mut destroyed_at_plan = 0usize;
    let mut destroyed_after_breach = 0usize;
    for sc in v["scenarios"].as_array().unwrap() {
        for st in sc["steps"].as_array().unwrap() {
            blows += st["blows"].as_array().unwrap().len();
            if let Some(p) = st.get("planned").and_then(|p| p.as_array()) {
                staggered += p.iter().filter(|d| d.as_f64().unwrap() > 0.0).count();
                if st["op"] == "fire" && p.len() < sc["towers"].as_array().unwrap().len() {
                    destroyed_at_plan += 1;
                }
            }
            if st["op"] == "breach" {
                let d = st["snapshot"]["destroyed"].as_array().unwrap();
                destroyed_after_breach += d.iter().filter(|b| **b == json!(true)).count();
            }
        }
    }
    assert!(blows > 0, "brak trafień wieży w wektorach");
    assert!(staggered > 0, "brak odroczenia 180 ms w wektorach");
    assert!(
        destroyed_at_plan > 0,
        "brak wieży zburzonej przy planowaniu"
    );
    assert!(destroyed_after_breach > 0, "brak zburzenia po wyłomie");
}

#[test]
fn zrodla_pinu_zgodne_z_wektorami() {
    let v = vectors();
    assert_eq!(v["pin"], PIN);
    assert_eq!(v["sources"]["battleScene"]["sha256"], BATTLE_SHA256);
    assert_eq!(v["sources"]["cityTowers"]["sha256"], TOWERS_SHA256);
}
