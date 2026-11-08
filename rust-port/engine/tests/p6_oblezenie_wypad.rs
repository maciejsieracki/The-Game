//! R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1 (partia P2): testy `domain::siege_sortie` (wypad obleganej armii).
//!
//! Wektory: wynik web `gra/src/game/siege-last-stand.ts` (`a61337844`) uruchomiony pod Node 22.22
//! (`--experimental-strip-types`) na tych samych wejsciach (driver poza repo). Oczekiwania podane jawnie ponizej.
//! Granice progu 80% (10 : 8): dokladnie 80% atakuje, 79% nie; EPS 1e-9 jak web.

use std::collections::HashMap;

use civ_engine::domain::siege_sortie::{
    can_unit_sortie, is_last_turn_before_capitulation, plan_last_stand_sortie,
    should_last_stand_sortie, LastStandCity, LastStandDeps, LastStandPlan, SortieUnit,
};

fn hex_d(q1: i64, r1: i64, q2: i64, r2: i64) -> i64 {
    let dq = q1 - q2;
    let dr = r1 - r2;
    let ds = -dq - dr;
    dq.abs().max(dr.abs()).max(ds.abs())
}

fn su(id: &str, owner: i64, q: i64, r: i64) -> SortieUnit {
    SortieUnit {
        id: id.to_string(),
        owner_id: owner,
        q,
        r,
        ruch_left: 2.0,
        embarked: false,
        sentry: false,
        ufortyfikowany_w_polu: false,
        oblega_city_id: None,
    }
}

/// Miasto C1 wlasciciela 1 (obleganego), oblegajacy wlasciciel 2.
fn city(pending: bool) -> LastStandCity {
    LastStandCity {
        id: "C1".to_string(),
        q: 5,
        r: 5,
        owner_id: 1,
        oblegane: Some(true),
        siege_capitulation_pending: Some(pending),
    }
}

/// Uruchamia planer. `str_tab` = sila per id (web `strengthOf`); id zawierajace "civ" = cywil (web `isMilitary`).
fn run(
    c: &LastStandCity,
    besieger: Option<i64>,
    units: &[SortieUnit],
    str_tab: &[(&str, f64)],
    enemy: &dyn Fn(i64, i64) -> bool,
) -> LastStandPlan {
    let tab: HashMap<String, f64> = str_tab.iter().map(|(k, v)| (k.to_string(), *v)).collect();
    let strength = move |u: &SortieUnit| *tab.get(&u.id).unwrap_or(&0.0);
    let military = |u: &SortieUnit| !u.id.contains("civ");
    let deps = LastStandDeps {
        strength_of: &strength,
        is_military: &military,
        is_enemy: enemy,
        hex_distance: &hex_d,
    };
    plan_last_stand_sortie(c, besieger, units, &deps)
}

fn always_enemy(_a: i64, _b: i64) -> bool {
    true
}

const REASON_SORTIE: &str = "wypad obleganej armii (siła obleganych >= 80% oblegających)";
const REASON_BELOW: &str = "siła obleganych poniżej 80% oblegających -- zostaje w oblężeniu";

#[test]
fn threshold_exactly_80_percent_attacks() {
    // web: exact_80pct: bd 8, br 10 -> wypad, cmd d1->b1
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 8.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.besieged_strength, 8.0);
    assert_eq!(p.besieger_strength, 10.0);
    assert_eq!(p.reason, REASON_SORTIE);
    assert_eq!(p.commands.len(), 1);
    assert_eq!(p.commands[0].unit_id, "d1");
    assert_eq!(p.commands[0].target_unit_id, "b1");
}

#[test]
fn threshold_79_percent_stays() {
    // web: just_below_80: bd 7.99, br 10 -> zostaje
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 7.99), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, REASON_BELOW);
    assert!(p.commands.is_empty());
}

#[test]
fn stronger_defenders_attack() {
    // web: stronger_attacks: bd 12, br 10
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.commands[0].target_unit_id, "b1");
}

#[test]
fn no_besieger_at_walls_stays() {
    // web: no_besieger_adjacent: oblegajacy na dystansie 4 -> "brak oblegających przy murach", br 0
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 9, 9)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 1.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "brak oblegających przy murach");
    assert_eq!(p.besieger_strength, 0.0);
}

#[test]
fn no_defenders_stays() {
    // web: no_defenders: bd 0, br 10
    let units = vec![su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "brak obrońców");
    assert_eq!(p.besieged_strength, 0.0);
    assert_eq!(p.besieger_strength, 10.0);
}

#[test]
fn non_enemy_besieger_stays() {
    // web: not_enemy (isEnemy false)
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let never = |_a: i64, _b: i64| false;
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &never,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "oblegający nie jest wrogiem");
}

#[test]
fn besieger_equal_to_owner_stays() {
    // web: owner_is_besieger (besiegerOwnerId == ownerId 1)
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(1),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "oblegający nie jest wrogiem");
}

#[test]
fn not_besieged_city_stays() {
    // web: not_besieged (oblegane false)
    let mut c = city(false);
    c.oblegane = Some(false);
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &c,
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "miasto nie jest oblegane");
}

#[test]
fn missing_besieger_owner_stays() {
    // web: null_besieger
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        None,
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "brak oblegającego");
}

#[test]
fn zero_strength_defender_stays() {
    // web: zero_strength_def: bd 0 -> nie > 0 -> zostaje
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 0.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, REASON_BELOW);
    assert_eq!(p.besieged_strength, 0.0);
}

#[test]
fn nan_defender_strength_stays() {
    // web: nan_def: bd NaN -> zostaje (predykat: !(NaN > 0))
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", f64::NAN), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert!(p.besieged_strength.is_nan());
    assert_eq!(p.reason, REASON_BELOW);
}

#[test]
fn anchor_is_strongest_then_lowest_id() {
    // web: anchor_strongest: d2 i d3 po 9, d2 niższe id -> kotwica d2; bd 21
    let units = vec![
        su("d1", 1, 5, 5),
        su("d2", 1, 5, 5),
        su("d3", 1, 5, 5),
        su("b1", 2, 4, 5),
    ];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 3.0), ("d2", 9.0), ("d3", 9.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.besieged_strength, 21.0);
    assert_eq!(p.commands[0].unit_id, "d2");
}

#[test]
fn anchor_skips_immobile_and_embarked() {
    // web: anchor_skips_immobile: d1 bez ruchu, d2 zaokrętowana (9) -> kotwica d3 (6); bd 18
    let mut d1 = su("d1", 1, 5, 5);
    d1.ruch_left = 0.0;
    let mut d2 = su("d2", 1, 5, 5);
    d2.embarked = true;
    let units = vec![d1, d2, su("d3", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 3.0), ("d2", 9.0), ("d3", 6.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.besieged_strength, 18.0);
    assert_eq!(p.commands[0].unit_id, "d3");
}

#[test]
fn no_unit_can_move_stays() {
    // web: anchor_all_immobile: bd 12 >= 80% ale nikt nie moze ruszyc
    let mut d1 = su("d1", 1, 5, 5);
    d1.ruch_left = 0.0;
    let units = vec![d1, su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "żadna jednostka nie może się ruszyć -- zostaje");
    assert!(p.commands.is_empty());
}

#[test]
fn sentry_and_fortified_units_do_not_block() {
    // web: sentry_fort_garrison_ok: sen i fortyfikacja nie blokuja wypadu
    let mut d1 = su("d1", 1, 5, 5);
    d1.sentry = true;
    d1.ufortyfikowany_w_polu = true;
    let units = vec![d1, su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.commands[0].unit_id, "d1");
}

#[test]
fn civilian_defender_is_excluded_from_strength() {
    // web: civilian_def_excluded: cywil (50) nie liczy sie do bd -> bd 12
    let units = vec![su("d1", 1, 5, 5), su("dciv2", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("dciv2", 50.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.besieged_strength, 12.0);
    assert_eq!(p.commands[0].unit_id, "d1");
}

#[test]
fn target_is_besieger_with_most_neighbours() {
    // web: target_cover: b1(4,5) i b4(5,4) maja po 2 sasiadow w promieniu 1 -> remis -> nizsze id b1
    let units = vec![
        su("d1", 1, 5, 5),
        su("b1", 2, 4, 5),
        su("b2", 2, 3, 5),
        su("b3", 2, 3, 4),
        su("b4", 2, 5, 4),
    ];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[
            ("d1", 12.0),
            ("b1", 1.0),
            ("b2", 1.0),
            ("b3", 1.0),
            ("b4", 1.0),
        ],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.besieger_strength, 2.0);
    assert_eq!(p.commands[0].target_unit_id, "b1");
}

#[test]
fn target_with_most_neighbours_wins_over_lowest_id() {
    // web: target_most_neighbours_not_lowest_id: b2(6,4) i b3(6,5) sasiaduja ze soba (po 2), b1(4,5) sam (1) -> b2
    let units = vec![
        su("d1", 1, 5, 5),
        su("b1", 2, 4, 5),
        su("b2", 2, 6, 4),
        su("b3", 2, 6, 5),
    ];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 1.0), ("b2", 1.0), ("b3", 1.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.besieger_strength, 3.0);
    assert_eq!(p.commands[0].target_unit_id, "b2");
}

#[test]
fn target_tie_goes_to_first_by_id() {
    // web: target_tie_lowest_id: ba(6,4) i bz(4,5) po 1 sasiedzie -> ba (nizsze id)
    let units = vec![su("d1", 1, 5, 5), su("bz", 2, 4, 5), su("ba", 2, 6, 4)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("bz", 1.0), ("ba", 1.0)],
        &always_enemy,
    );
    assert!(p.sortie);
    assert_eq!(p.commands[0].target_unit_id, "ba");
}

#[test]
fn last_turn_flag_is_reported_and_sortie_still_by_rule() {
    // web: last_turn_flag: isLastTurn true; wypad wg tej samej reguly
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let c = city(true);
    assert!(is_last_turn_before_capitulation(&c));
    let p = run(
        &c,
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.is_last_turn);
    assert!(p.sortie);
}

#[test]
fn last_turn_predicate_needs_both_flags() {
    // web: isLastTurnBeforeCapitulation = oblegane && siegeCapitulationPending
    assert!(!is_last_turn_before_capitulation(&city(false)));
    let mut not_besieged = city(true);
    not_besieged.oblegane = Some(false);
    assert!(!is_last_turn_before_capitulation(&not_besieged));
    let mut undef = city(true);
    undef.oblegane = None;
    assert!(!is_last_turn_before_capitulation(&undef));
}

#[test]
fn embarked_besieger_is_not_counted() {
    // web: embarked_besieger_skipped -> brak oblegajacych przy murach
    let mut b1 = su("b1", 2, 4, 5);
    b1.embarked = true;
    let units = vec![su("d1", 1, 5, 5), b1];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "brak oblegających przy murach");
    assert_eq!(p.besieger_strength, 0.0);
}

#[test]
fn civilian_besieger_is_not_counted() {
    // web: besieger_civilian_skipped: cywil (10) pominiety, b9 (50) przy murach -> br 50
    let units = vec![su("d1", 1, 5, 5), su("bciv1", 2, 4, 5), su("b9", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("bciv1", 10.0), ("b9", 50.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.besieger_strength, 50.0);
    assert_eq!(p.reason, REASON_BELOW);
}

#[test]
fn besieger_inside_city_is_not_at_walls() {
    // web: besieger_in_city_only: oblegajacy na heksie miasta (dystans 0) nie liczy sie
    let units = vec![su("d1", 1, 5, 5), su("bq", 2, 5, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 12.0), ("bq", 10.0)],
        &always_enemy,
    );
    assert!(!p.sortie);
    assert_eq!(p.reason, "brak oblegających przy murach");
}

#[test]
fn rounding_epsilon_keeps_79_99999999999_percent_attacking() {
    // web: shouldSortie_eps: 79.99999999999 vs 10 -> wypad (EPS 1e-9)
    let units = vec![su("d1", 1, 5, 5), su("b1", 2, 4, 5)];
    let p = run(
        &city(false),
        Some(2),
        &units,
        &[("d1", 79.99999999999), ("b1", 10.0)],
        &always_enemy,
    );
    assert!(p.sortie);
}

#[test]
fn should_sortie_predicate_vectors() {
    // web shouldLastStandSortie: (8,10)=true, (7.99,10)=false, (79.99999999999,10)=true,
    // (0,5)=false, (5,0)=false, (NaN,5)=false, (1,1e-300)=true
    assert!(should_last_stand_sortie(8.0, 10.0));
    assert!(!should_last_stand_sortie(7.99, 10.0));
    assert!(should_last_stand_sortie(79.99999999999, 10.0));
    assert!(!should_last_stand_sortie(0.0, 5.0));
    assert!(!should_last_stand_sortie(5.0, 0.0));
    assert!(!should_last_stand_sortie(f64::NAN, 5.0));
    assert!(should_last_stand_sortie(1.0, 1e-300));
}

#[test]
fn can_unit_sortie_rules() {
    // web canUnitSortie: ruch > 0, nie zaokretowana, nie oblegajaca; sen/fortyfikacja nie blokuja
    let base = su("x", 1, 0, 0);
    assert!(can_unit_sortie(&base));
    let mut no_move = base.clone();
    no_move.ruch_left = 0.0;
    assert!(!can_unit_sortie(&no_move));
    let mut emb = base.clone();
    emb.embarked = true;
    assert!(!can_unit_sortie(&emb));
    let mut besieging = base.clone();
    besieging.oblega_city_id = Some("C9".to_string());
    assert!(!can_unit_sortie(&besieging));
    // NaN ruchu nie blokuje (JS: NaN <= 0 === false)
    let mut nan = base.clone();
    nan.ruch_left = f64::NAN;
    assert!(can_unit_sortie(&nan));
}
