//! REPIN-EKONOMIA-F partia 3 (R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1): Magazyn +20% bazy pojemnosci panstwa
//! (web `economy-upkeep.ts` `ownerResourceCapacityPerType`, R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1), Magazyn bez
//! zywnosci (R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1), Spichlerz Krolewski (bramka `['Ceramika','Sól']`,
//! `building-resource-gate.ts:70`, R-WEB-GRANARY2-TECH-DATA-FIX-Q1). Oracle liczbowe: wektory
//! `p6_8e_vectors/economy_upkeep_p1.json` (regenerowane z web origin/main); tu progi N-1/N/N+1, NaN, brak kluczy.

use civ_engine::data::economy_society::parse_econ_params;
use civ_engine::domain::building_costs::p6_7b::{building_required_active_labels, GateBuilding};
use civ_engine::domain::city_growth::p6_7a::empire_food::build_empire_food_params;
use civ_engine::domain::city_growth::p6_7a::GameDifficulty;
use civ_engine::domain::turn_economy::economy_upkeep_p1 as eu;
use serde_json::json;

fn params() -> eu::OwnerStorageParams {
    eu::DEFAULT_OWNER_STORAGE_PARAMS
}

#[test]
fn defaults_are_base_50000_and_20_percent() {
    let p = params();
    assert_eq!(p.baza_surowce_panstwo, 50000.0);
    assert_eq!(p.bonus_proc_na_budynek, 0.2);
}

#[test]
fn capacity_scales_20_percent_of_base_per_magazyn_n_minus_1_n_n_plus_1() {
    let p = params();
    // era 1: baza * (1 + 0,2 * N)
    for (n, want) in [
        (0.0, 50000.0),
        (1.0, 60000.0),
        (2.0, 70000.0), // addytywnie: +40%, nie x1,44
        (3.0, 80000.0),
        (4.0, 90000.0),
    ] {
        assert_eq!(
            eu::owner_resource_capacity_per_type(n, &p, 1.0),
            want,
            "N={n}"
        );
    }
    // ulamek -> floor; ujemny / NaN / Inf -> 0 Magazynow
    assert_eq!(eu::owner_resource_capacity_per_type(3.7, &p, 1.0), 80000.0);
    assert_eq!(
        eu::owner_resource_capacity_per_type(0.999, &p, 1.0),
        50000.0
    );
    for bad in [-1.0, f64::NAN, f64::NEG_INFINITY] {
        assert_eq!(eu::owner_resource_capacity_per_type(bad, &p, 1.0), 50000.0);
    }
    // Inf: nieskonczony licznik -> 0 Magazynow (web: Number.isFinite)
    assert_eq!(
        eu::owner_resource_capacity_per_type(f64::INFINITY, &p, 1.0),
        50000.0
    );
}

#[test]
fn capacity_doubles_per_era_and_rounds_like_js() {
    let p = params();
    assert_eq!(eu::owner_resource_capacity_per_type(1.0, &p, 2.0), 120000.0);
    assert_eq!(eu::owner_resource_capacity_per_type(1.0, &p, 3.0), 240000.0);
    assert_eq!(eu::owner_resource_capacity_per_type(0.0, &p, 3.0), 200000.0);
    // era < 1 / NaN / Inf -> mnoznik 1
    for era in [0.0, -1.0, f64::NAN, f64::INFINITY] {
        assert_eq!(
            eu::owner_resource_capacity_per_type(1.0, &p, era),
            60000.0,
            "era={era}"
        );
    }
    // zaokraglenie JS (Math.round, polowki w gore): baza 5, proc 0,1, N=5 -> 5*1,5 = 7,5 -> 8
    let tiny = eu::OwnerStorageParams {
        baza_surowce_panstwo: 5.0,
        bonus_proc_na_budynek: 0.1,
    };
    assert_eq!(eu::owner_resource_capacity_per_type(5.0, &tiny, 1.0), 8.0);
    // 1,2 * 50000 dryf zmiennoprzecinkowy: wynik calkowity
    assert_eq!(
        eu::owner_resource_capacity_per_type(1.0, &params(), 1.0).fract(),
        0.0
    );
}

#[test]
fn era_breakdown_bonus_is_base_times_percent_times_multiplier() {
    let p = params();
    let b = eu::owner_storage_params_for_era(&p, 3.0);
    assert_eq!(b.baza_surowce_panstwo, 200000.0);
    assert_eq!(b.bonus_surowce_na_budynek, 40000.0); // 50000 * 0,2 * 4
                                                     // spojnosc z capacity: baza + N * bonus
    for n in 0..5 {
        let n = f64::from(n);
        assert_eq!(
            b.baza_surowce_panstwo + n * b.bonus_surowce_na_budynek,
            eu::owner_resource_capacity_per_type(n, &p, 3.0)
        );
    }
}

#[test]
fn magazyn_gives_no_food_cap_and_data_keys_are_updated() {
    // R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1: fallback `centralCapBonusMagazyn` = 0
    let raw = json!({"globalne": {}});
    let food = build_empire_food_params(&raw, GameDifficulty::Normal);
    assert_eq!(food.central_cap_bonus_magazyn, 0.0);
    // data/econ-params.json: nowy klucz procentowy, stary klucz usuniety
    let econ = parse_econ_params().expect("econ-params.json");
    assert_eq!(
        econ.globalne.magazyn_bonus_surowce_proc_na_budynek.normal,
        0.2
    );
    assert_eq!(
        econ.globalne
            .magazyn_centralny_bonus_zywnosc_na_budynek
            .normal,
        0
    );
    assert_eq!(econ.ekonomia_miasta.spichlerz_ii_prog_ludnosci.normal, 12);
    assert_eq!(econ.ekonomia_miasta.akwedukt_max_ludnosci.normal, 20);
    assert_eq!(econ.budynki.budynek_huta_przepustowosc.normal, 50);
}

#[test]
fn spichlerz_ii_gate_requires_ceramika_and_sol_others_unchanged() {
    let b = |id: &str| GateBuilding {
        id: id.to_owned(),
        epoka_wejscia: None,
        wymagany_surowiec: None,
    };
    assert_eq!(
        building_required_active_labels(&b("spichlerz_ii")),
        vec!["Ceramika".to_owned(), "Sól".to_owned()]
    );
    // pozostale bramki zloz bez zmian (przyklady z data/derived/building-cost-params.json)
    assert_eq!(
        building_required_active_labels(&b("garncarnia")),
        vec!["Glina".to_owned()]
    );
    assert_eq!(
        building_required_active_labels(&b("kuznia")),
        vec!["Ruda".to_owned()]
    );
    assert!(building_required_active_labels(&b("spichlerz")).is_empty());
}
