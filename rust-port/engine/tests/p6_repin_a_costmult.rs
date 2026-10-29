//! REPIN-EKONOMIA-A (pin 91dc998a) - testy zabijajace mutacje K04-K07 portu `manpower.ts`.
//!
//! Wektory z webu (`p6_5b_vectors/*.json`) przekazuja `costMult = maxMult` i nie podaja
//! `resolveOwnerMatrix`, wiec galaz `costMult != maxMult` oraz galaz `unitCost === 0` (leczenie
//! bez zuzycia Manpower) nie sa w nich objete. Ten plik pokrywa te galezie jawnymi asercjami.
//! Zrodlo oczekiwan: web `gra/src/game/manpower.ts` @ 91dc998a (`unitManpowerCostForType`
//! l.544-551, `tickManpowerUnitReplenishment` l.289-350, `civManpowerMatrixMults` l.447 ff.).

use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::recruitment::manpower::{
    civ_manpower_matrix_mults, tick_manpower_unit_replenishment, unit_manpower_cost,
    unit_manpower_cost_for_type, CivBonusPoborLite, ManpowerCity, ManpowerDifficulty,
    ManpowerHealUnit, ManpowerMatrixOverrides,
};

const TYPE_ID: &str = "test_piechota";
const EPOKI: [f64; 6] = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0];

/// Koszt typu wyliczany z `costMult`, a nie z `maxMult` (web l.544-551: `unitManpowerCost(epoka, costMult)`).
#[test]
fn unit_cost_for_type_uses_cost_mult_not_max_mult() {
    let mut differing = 0;
    for epoka in EPOKI {
        // max_mult = 2.0, cost_mult = 0.5: wynik MUSI odpowiadac cost_mult.
        let got = unit_manpower_cost_for_type(Some(TYPE_ID), epoka, 2.0, 0.5);
        assert_eq!(got, unit_manpower_cost(epoka, 0.5), "epoka {epoka}");
        if unit_manpower_cost(epoka, 2.0) != unit_manpower_cost(epoka, 0.5) {
            differing += 1;
            assert_ne!(got, unit_manpower_cost(epoka, 2.0), "epoka {epoka}");
        }
    }
    assert!(differing >= 3, "za malo epok z roznym kosztem: {differing}");
}

/// Domyslne `costMult = maxMult` w web (argument koncowy): bez jawnego costMult wynik = stary koszt.
#[test]
fn unit_cost_for_type_with_equal_mults_matches_single_mult() {
    for epoka in EPOKI {
        assert_eq!(
            unit_manpower_cost_for_type(Some(TYPE_ID), epoka, 1.5, 1.5),
            unit_manpower_cost(epoka, 1.5),
        );
    }
}

/// Zwiadowca jest zawsze darmowy, niezaleznie od costMult (web l.546 `isScoutTypeId -> 0`).
#[test]
fn scout_is_free_regardless_of_cost_mult() {
    let scout = civ_engine::data::derived::manpower_params()
        .scout_type_id
        .clone();
    for cost_mult in [0.0, 0.5, 2.0] {
        assert_eq!(
            unit_manpower_cost_for_type(Some(&scout), 3.0, 1.0, cost_mult),
            0.0
        );
    }
}

type OwnerMatrix = dyn Fn(i64) -> Option<ManpowerMatrixOverrides>;

fn zero_cost_overrides(_owner: i64) -> Option<ManpowerMatrixOverrides> {
    // mp_koszt_jednostki_proc = -1 => costMult = max(0, 1 + -1) = 0; max_mult = 1 (pole max = 0).
    Some(ManpowerMatrixOverrides {
        mp_regen_proc: None,
        mp_max_proc: Some(0.0),
        mp_koszt_jednostki_proc: Some(-1.0),
    })
}

fn damaged_unit() -> ManpowerHealUnit {
    ManpowerHealUnit {
        id: "u1".to_owned(),
        owner_id: 1,
        type_id: TYPE_ID.to_owned(),
        category: "wojsko".to_owned(),
        hp: Some(5.0),
        hp_max: Some(10.0),
        parametry_bonus_proc: None,
        battles_survived: None,
        q: None,
        r: None,
        in_garnizon: None,
    }
}

fn run_tick(
    cities: &mut [ManpowerCity],
    units: &mut [ManpowerHealUnit],
    matrix: Option<&OwnerMatrix>,
) -> (usize, f64) {
    let era = |_: i64| 1.0;
    let bon = |_: i64| -> Option<Vec<CivBonusPoborLite>> { None };
    let max_hp = |_: &str, _: &ManpowerHealUnit| 10.0;
    let got = tick_manpower_unit_replenishment(
        cities,
        units,
        ManpowerDifficulty::Normal,
        &era,
        &bon,
        matrix,
        &max_hp,
        None,
        None,
    );
    (got.healed_count, got.total_mp_spent)
}

/// Galaz `unitCost === 0` (web l.342-347): jednostka leczy sie BEZ zuzycia Manpower, nawet gdy
/// pula miasta jest pusta. Kontrola (costMult = 1, pusta pula): brak leczenia.
#[test]
fn zero_cost_branch_heals_without_spending_manpower() {
    // Kontrola: koszt > 0, pula 0 => nic nie jest leczone.
    let mut cities = vec![ManpowerCity::new("c1", 1, 10.0)];
    cities[0].manpower = Some(0.0);
    let mut units = vec![damaged_unit()];
    let (healed, spent) = run_tick(&mut cities, &mut units, None);
    assert_eq!(
        (healed, spent),
        (0, 0.0),
        "kontrola: koszt > 0 przy pustej puli"
    );
    assert_eq!(units[0].hp, Some(5.0), "kontrola: hp bez zmian");

    // Galaz zerowego kosztu: hp rosnie, healed_count = 1, MP nie zuzyte, pula bez zmian.
    let mut cities = vec![ManpowerCity::new("c1", 1, 10.0)];
    cities[0].manpower = Some(0.0);
    let cities_before = cities.clone();
    let mut units = vec![damaged_unit()];
    let zero: &OwnerMatrix = &zero_cost_overrides;
    let (healed, spent) = run_tick(&mut cities, &mut units, Some(zero));
    assert_eq!(healed, 1, "zerowy koszt: healed_count");
    assert_eq!(spent, 0.0, "zerowy koszt: total_mp_spent");
    assert_eq!(cities, cities_before, "zerowy koszt: pula miasta bez zmian");
    let hp = units[0].hp.expect("hp");
    assert!(
        hp > 5.0 && hp <= 10.0,
        "zerowy koszt: hp po leczeniu = {hp}"
    );
}

/// costMult != maxMult w odnowie: max_mult = 1 (pole max = 0), cost_mult = 0.
/// Mutacja K05 (koszt z maxMult) dalaby koszt > 0 i brak leczenia przy pustej puli.
#[test]
fn replenish_cost_uses_cost_mult_not_max_mult() {
    let mut cities = vec![ManpowerCity::new("c1", 1, 10.0)];
    cities[0].manpower = Some(0.0);
    let mut units = vec![damaged_unit()];
    let zero: &OwnerMatrix = &zero_cost_overrides;
    let (healed, _) = run_tick(&mut cities, &mut units, Some(zero));
    assert_eq!(
        healed, 1,
        "costMult = 0 przy max_mult = 1 musi leczyc bez MP"
    );
}

/// Macierz cywilizacji (galaz `civMatrixParam`, web `civKey` != undefined): wartosci z
/// `civ-matrix.json` (Grecy: mp_regen_proc = -0.15; Rzymianie: 0.35), brak klucza = neutralne.
#[test]
fn civ_matrix_path_reads_matrix_fields() {
    let matrix = load_civ_matrix();
    let greek = civ_manpower_matrix_mults(None, Some((&matrix.file, "grecy")));
    assert!(
        (greek.regen_mult - 0.85).abs() < 1e-12,
        "grecy regen {}",
        greek.regen_mult
    );
    assert_eq!((greek.max_mult, greek.cost_mult), (1.0, 1.0));

    let roman = civ_manpower_matrix_mults(None, Some((&matrix.file, "Rzymianie")));
    assert!(
        (roman.regen_mult - 1.35).abs() < 1e-12,
        "rzymianie regen {}",
        roman.regen_mult
    );

    let unknown = civ_manpower_matrix_mults(None, Some((&matrix.file, "nieistniejaca")));
    assert_eq!(
        (unknown.regen_mult, unknown.max_mult, unknown.cost_mult),
        (1.0, 1.0, 1.0)
    );

    // Override ma pierwszenstwo nad macierza.
    let ov = ManpowerMatrixOverrides {
        mp_regen_proc: Some(0.0),
        ..Default::default()
    };
    let over = civ_manpower_matrix_mults(Some(&ov), Some((&matrix.file, "grecy")));
    assert_eq!(over.regen_mult, 1.0);
}
