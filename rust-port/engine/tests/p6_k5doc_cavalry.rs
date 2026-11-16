//! P6 SIEGE-TAKTYKA K5DOC-T6 JAZDA (dispatch R-RUSTPORT-P6-K5DOC-T6-JAZDA, runda 1): testy zgodnosci decyzji
//! kawalerii z pinem `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! * `_cavalryAction` (`:6372-6412`) -> [`cavalry_action_decide`] (sekwencja krokow tury),
//! * `_bestChargeStepKey` (`:17736-17775`) -> [`best_charge_step`].
//!
//! Wektory: `p6_k5doc_cavalry_vectors/vectors.json`, generowane przez `p6_k5doc_cavalry_gen.mjs`, ktory WYKONUJE tekst
//! pina (transpilacja TypeScript). Stubowane sa wyłącznie zależności spoza wycinkow pina (przejezdnosc, ford,
//! `_canStrikeTargetFrom`, `_makeCanAttackFromTest`, `_doAttack`, minimalny `_doMove`); kazdy stub jest zapisany
//! w wektorze i w komentarzu generatora.
//!
//! Nazwane przypadki (asercje wprost, z odniesieniem do linii pina) pokrywaja wektory (a)-(e) dispatchu.

use std::collections::HashSet;

use civ_engine::domain::siege_tactics_cavalry::{
    best_charge_step, cavalry_action_decide, CavStep, CavTerrain, Tile,
};
use civ_engine::domain::siege_tactics_doctrine_target::{AttackDirection, Combatant};
use serde::Deserialize;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5doc_cavalry_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct UnitJson {
    q: i64,
    r: i64,
    facing: f64,
    #[serde(default)]
    mounted: bool,
    #[serde(default)]
    primary_ranged: bool,
    #[serde(default)]
    anti_cav_spear: bool,
    #[serde(default = "front")]
    attack_direction: String,
    #[serde(default)]
    dead: bool,
    #[serde(default)]
    fading_out: bool,
    #[serde(default)]
    routed: bool,
    hp: f64,
    #[serde(default)]
    moves_left: i64,
}

fn front() -> String {
    "front".to_string()
}

#[derive(Deserialize)]
struct Case {
    name: String,
    kind: String,
    pin: String,
    me: UnitJson,
    enemies: Vec<UnitJson>,
    occupied: Vec<[i64; 2]>,
    impassable: Vec<[i64; 2]>,
    ford: Vec<[i64; 2]>,
    strike: Vec<[i64; 3]>,
    attack_from: Vec<[i64; 2]>,
    tgt: Option<usize>,
    expect: Value,
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

fn direction(s: &str) -> AttackDirection {
    match s {
        "front" => AttackDirection::Front,
        "bok" => AttackDirection::Bok,
        "tyl" => AttackDirection::Tyl,
        other => panic!("nieznany kierunek natarcia {other}"),
    }
}

fn combatant(u: &UnitJson) -> Combatant {
    Combatant {
        q: u.q,
        r: u.r,
        hp: u.hp,
        range: 1,
        mounted: u.mounted,
        primary_ranged: u.primary_ranged,
        ranged_base: false,
        ammo_left: 0.0,
        shooting_enabled: true,
        anti_cav_spear: u.anti_cav_spear,
        facing: u.facing,
        on_wall_walkway: false,
        is_siege_unit: false,
        attack_direction: direction(&u.attack_direction),
        dead: u.dead,
        fading_out: u.fading_out,
        routed: u.routed,
        use_unit_priorities: false,
        unit_target_priorities: None,
    }
}

/// Wynik w postaci porownywalnej z `expect` z wektora: `["move",c,r]` / `["attack",i]`.
fn steps_as_json(steps: &[CavStep]) -> Vec<Value> {
    steps
        .iter()
        .map(|s| match *s {
            CavStep::Move((c, r)) => serde_json::json!(["move", c, r]),
            CavStep::Attack(i) => serde_json::json!(["attack", i]),
        })
        .collect()
}

/// Uruchamia jeden przypadek i zwraca wynik w formacie `expect` z wektora.
fn run(case: &Case) -> Value {
    let me = combatant(&case.me);
    let enemies: Vec<Combatant> = case.enemies.iter().map(combatant).collect();
    let occupied: HashSet<Tile> = case.occupied.iter().map(|t| (t[0], t[1])).collect();
    let impassable: HashSet<Tile> = case.impassable.iter().map(|t| (t[0], t[1])).collect();
    let ford: HashSet<Tile> = case.ford.iter().map(|t| (t[0], t[1])).collect();
    let strike: HashSet<(i64, i64, usize)> = case
        .strike
        .iter()
        .map(|t| (t[0], t[1], t[2] as usize))
        .collect();
    let attack_from: HashSet<Tile> = case.attack_from.iter().map(|t| (t[0], t[1])).collect();

    let passable = move |c: i64, r: i64| !impassable.contains(&(c, r));
    let is_ford = move |c: i64, r: i64| ford.contains(&(c, r));
    let can_strike_from = move |c: i64, r: i64, ti: usize| strike.contains(&(c, r, ti));
    let can_attack_from = move |c: i64, r: i64| attack_from.contains(&(c, r));
    let terrain = CavTerrain {
        passable: &passable,
        is_ford: &is_ford,
        can_strike_from: &can_strike_from,
        can_attack_from: &can_attack_from,
    };

    match case.kind.as_str() {
        "action" => {
            let steps =
                cavalry_action_decide(&me, &enemies, &occupied, case.me.moves_left, &terrain);
            Value::Array(steps_as_json(&steps))
        }
        "charge" => {
            let tgt = case.tgt.expect("przypadek szarży ma cel");
            match best_charge_step(&me, &enemies, tgt, &occupied, &terrain) {
                Some((c, r)) => serde_json::json!([c, r]),
                None => Value::Null,
            }
        }
        other => panic!("nieznany rodzaj {other}"),
    }
}

#[test]
fn wektory_zgodne_z_wykonaniem_pina() {
    let cases = vectors();
    assert!(cases.len() >= 700, "zbyt malo wektorow: {}", cases.len());
    let mut failures = Vec::new();
    for case in &cases {
        let got = run(case);
        if got != case.expect {
            failures.push(format!(
                "{} ({}): rust={} pin={}",
                case.name, case.pin, got, case.expect
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "rozbieznosci z pinem: {}\n{}",
        failures.len(),
        failures
            .iter()
            .take(20)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

fn assert_named(name: &str) {
    let case = named(name);
    assert_eq!(run(&case), case.expect, "przypadek {name} ({})", case.pin);
}

/// (a) sasiad nie-wlocznik -> natychmiastowy cios (pin `:6372`, krok 1).
#[test]
fn a_sasiad_nie_wlocznik_cios_pin_6372() {
    let case = named("a_sasiad_nie_wlocznik_cios");
    assert_eq!(run(&case), serde_json::json!([["attack", 0]]));
}

/// (a2)/(d) wlocznik przy zablokowanym otoczeniu: forsowany atak na wlocznika (pin `:6372-6412`, krok 3).
#[test]
fn d_forsowany_atak_na_wlocznika_pin_6372() {
    assert_named("d_forsowany_atak_na_wlocznika");
    assert_named("a2_sasiad_wlocznik_nie_jest_ciosem_krok1");
}

/// (b) kara `spearAdj` (pin `:6457-6501`): krok bez sasiedztwa wlocznika (+5) wygrywa z krokiem przy wlocznii (+0).
#[test]
fn b_kara_spear_adj_pin_6457() {
    let case = named("b_kara_spearAdj_wybiera_krok_bez_wlocznika");
    assert_eq!(run(&case), serde_json::json!([["move", 5, 6]]));
}

/// (c) manewr `bok` z `desiredHitForDirection` (pin `:1956`, `:6351-6370`): luk flank wybiera sasiada flank.
#[test]
fn c_bok_flank_pin_1956_6351() {
    let case = named("c_bok_preferuje_flank_nad_nizszym_hp");
    assert_eq!(run(&case), serde_json::json!([["attack", 0]]));
}

/// (c2) manewr `tyl`: luk rear wybiera sasiada rear.
#[test]
fn c2_tyl_rear_pin_1956_6351() {
    let case = named("c2_tyl_preferuje_rear");
    assert_eq!(run(&case), serde_json::json!([["attack", 1]]));
}

/// (e) szarza `_bestChargeStepKey` (pin `:17736-17775`): BFS omija zajety kafelek.
#[test]
fn e_szarza_bfs_pin_17736() {
    let case = named("e_szarza_bfs_omija_zajety");
    assert_eq!(run(&case), serde_json::json!([6, 5]));
}

/// (f) kara `spearAdj` w szarzy jazdy (pin `:17753-17757`, `(spearAdj ? 0 : 4)`) bez BFS: E=(6,5) przylega do
/// wlocznika -> 9; S=(5,6) bez wlocznika -> 13. Mutant `CHARGE_NO_SPEAR_BONUS` = 0 albo zamiana galezi daje (6,5).
#[test]
fn f_kara_spear_adj_szarza_pin_17757() {
    let case = named("f_szarza_kara_spearAdj_bez_bfs");
    assert_eq!(run(&case), serde_json::json!([5, 6]));
    assert_eq!(run(&case), case.expect);
}

/// Dwa rozne kierunki natarcia daja rozne wyniki na tej samej geometrii (czulosc na luk flank/rear).
#[test]
fn bok_i_tyl_daja_rozne_ciosy() {
    assert_ne!(
        run(&named("c_bok_preferuje_flank_nad_nizszym_hp")),
        run(&named("c2_tyl_preferuje_rear"))
    );
}

/// Dodatkowa kontrola: ruch zawsze konczy sie w obrebie `moves_left` (pin: `ru.moveLeft > 0`).
#[test]
fn ruch_nie_przekracza_moves_left() {
    for case in vectors().iter().filter(|c| c.kind == "action") {
        let moves = run(case)
            .as_array()
            .expect("tablica krokow")
            .iter()
            .filter(|s| s[0] == "move")
            .count() as i64;
        assert!(moves <= case.me.moves_left, "{} przekracza ruch", case.name);
    }
}
