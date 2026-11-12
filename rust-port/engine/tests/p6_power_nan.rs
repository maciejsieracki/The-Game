//! P6-POWER-NAN-STRICT-Q1: `Component::Provided(v)` z `v` NaN / +Inf / -Inf w aktywnym skladniku
//! `computeObjectivePower` daje jawny blad `PowerInputError::NonFinite`, nie ciche zero (NaN) ani
//! propagacja do wyniku (+Inf). Roznica wzgledem webu (pin 07d2fbd72, `Math.max(0, x)`) jest
//! udokumentowana w `brake_power::compute_objective_power`.

use std::collections::BTreeSet;

use civ_engine::data::units_combat::parse_power_params;
use civ_engine::domain::brake_power::{
    compute_objective_power, military_component_keys, objective_power_for_owner, BattlePowerModel,
    Component, MissingComponents, NonFiniteComponents, ObjectivePowerRaw, PowerCoeffs,
    PowerInputError,
};

fn coeff() -> PowerCoeffs {
    PowerCoeffs::default_params()
}

fn military() -> BTreeSet<&'static str> {
    military_component_keys(&parse_power_params().expect("power-params.json"))
}

/// Pelne wejscie: wszystkie skladniki `Provided` o wartosciach skonczonych.
fn complete() -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        owner_id: 1,
        epoka: 2.0,
        jednostki: Component::Provided(3.0),
        wygrane_bitwy: Component::Provided(1.0),
        bitwy_pkt_sum: Component::Provided(4.0),
        suma_ludkow: Component::Provided(5.0),
        rekrut_ekw: Component::Provided(2.0),
        miasta: Component::Provided(2.0),
        heksy_terytorium: Component::Provided(6.0),
        budynki: Component::Provided(3.0),
        tech_zbadane: Component::Provided(2.0),
        ulepszenia_terenu: Component::Provided(1.0),
        kultura_imperium: Component::Provided(7.0),
        miasta_jednosc_religii: Component::Provided(2.0),
        zdobycze_power: Component::Provided(1.0),
    }
}

/// Ustawia pole wejscia po nazwie pola testowego (mapowanie na `ObjectivePowerRaw`).
fn set_field(raw: &mut ObjectivePowerRaw, field: &str, c: Component) {
    match field {
        "armia" => raw.jednostki = c,
        "wygraneBitwy" => raw.wygrane_bitwy = c,
        "bitwyPktSum" => raw.bitwy_pkt_sum = c,
        "ludki" => raw.suma_ludkow = c,
        "rekruci" => raw.rekrut_ekw = c,
        "miasta" => raw.miasta = c,
        "terytorium" => raw.heksy_terytorium = c,
        "infra" => raw.budynki = c,
        "tech" => raw.tech_zbadane = c,
        "ulepszenia" => raw.ulepszenia_terenu = c,
        "kultura" => raw.kultura_imperium = c,
        "religia" => raw.miasta_jednosc_religii = c,
        "zdobycze" => raw.zdobycze_power = c,
        other => panic!("nieznane pole {other}"),
    }
}

const NON_FINITE: [f64; 3] = [f64::NAN, f64::INFINITY, f64::NEG_INFINITY];

/// Pola wejscia i klucz skladnika wyniku; aktywnosc pol bitew zalezy od modelu (patrz test).
const POWER_FIELDS: [(&str, &str); 13] = [
    ("armia", "armia"),
    ("wygraneBitwy", "bitwy"),
    ("ludki", "ludki"),
    ("rekruci", "rekruci"),
    ("miasta", "miasta"),
    ("terytorium", "terytorium"),
    ("infra", "infra"),
    ("tech", "tech"),
    ("ulepszenia", "ulepszenia"),
    ("kultura", "kultura"),
    ("religia", "religia"),
    ("zdobycze", "zdobycze"),
    ("bitwyPktSum", "bitwy"), // nieaktywne we FlatCount
];

#[test]
fn finite_complete_input_unchanged_by_nan_policy() {
    let (c, m) = (coeff(), military());
    let raw = complete();
    let flat = compute_objective_power(&raw, &c, BattlePowerModel::FlatCount, &m)
        .expect("skonczone wejscie, FlatCount");
    let enemy = compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m)
        .expect("skonczone wejscie, EnemyMSum");
    // Wartosci jak w `complete()`: armia 3*jw, bitwy 1*coef (FlatCount) / 4*2 (EnemyMSum).
    assert_eq!(flat.components.len(), 12);
    assert_eq!(enemy.components.len(), 12);
    assert_eq!(
        objective_power_for_owner(&raw, &c, BattlePowerModel::EnemyMSum, &m),
        Ok(enemy.power)
    );
}

#[test]
fn negative_finite_is_still_clamped_to_zero_as_before() {
    let (c, m) = (coeff(), military());
    let mut raw = complete();
    raw.jednostki = Component::Provided(-5.0);
    let res = compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m)
        .expect("ujemne skonczone nie jest bledem wejscia");
    let armia = res.components.iter().find(|x| x.key == "armia").unwrap();
    assert_eq!(armia.raw_count, 0.0);
    assert_eq!(armia.points, 0.0);
}

#[test]
fn nan_inf_and_neg_inf_in_each_active_component_is_error() {
    let (c, m) = (coeff(), military());
    for model in [BattlePowerModel::FlatCount, BattlePowerModel::EnemyMSum] {
        for (field, key) in POWER_FIELDS {
            // Pole bitew: aktywne tylko w odpowiednim modelu.
            let active = match (field, model) {
                ("wygraneBitwy", BattlePowerModel::FlatCount) => true,
                ("bitwyPktSum", BattlePowerModel::EnemyMSum) => true,
                ("wygraneBitwy", BattlePowerModel::EnemyMSum) => false,
                ("bitwyPktSum", BattlePowerModel::FlatCount) => false,
                _ => true,
            };
            if !active {
                continue;
            }
            for v in NON_FINITE {
                let mut raw = complete();
                set_field(&mut raw, field, Component::Provided(v));
                let err = compute_objective_power(&raw, &c, model, &m)
                    .expect_err("NaN/Inf w aktywnym skladniku musi byc bledem");
                assert_eq!(
                    err,
                    PowerInputError::NonFinite(NonFiniteComponents(vec![key])),
                    "pole {field}, wartosc {v}, model {model:?}"
                );
            }
        }
    }
}

#[test]
fn nan_is_not_silently_zeroed_by_max() {
    // Regresja: `f64::NAN.max(0.0) == 0.0` dawaloby ciche zero.
    let (c, m) = (coeff(), military());
    let mut raw = complete();
    raw.budynki = Component::Provided(f64::NAN);
    assert!(compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m).is_err());
    assert!(objective_power_for_owner(&raw, &c, BattlePowerModel::EnemyMSum, &m).is_err());
}

#[test]
fn adapter_propagates_non_finite_error() {
    let (c, m) = (coeff(), military());
    let mut raw = complete();
    raw.heksy_terytorium = Component::Provided(f64::INFINITY);
    assert_eq!(
        objective_power_for_owner(&raw, &c, BattlePowerModel::FlatCount, &m),
        Err(PowerInputError::NonFinite(NonFiniteComponents(vec![
            "terytorium"
        ])))
    );
}

#[test]
fn several_non_finite_components_listed_in_component_order() {
    let (c, m) = (coeff(), military());
    let mut raw = complete();
    raw.kultura_imperium = Component::Provided(f64::NAN);
    raw.jednostki = Component::Provided(f64::NEG_INFINITY);
    raw.zdobycze_power = Component::Provided(f64::INFINITY);
    assert_eq!(
        compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m).unwrap_err(),
        PowerInputError::NonFinite(NonFiniteComponents(vec!["armia", "kultura", "zdobycze"]))
    );
}

#[test]
fn missing_takes_precedence_over_non_finite() {
    let (c, m) = (coeff(), military());
    let mut raw = complete();
    raw.budynki = Component::Missing;
    raw.jednostki = Component::Provided(f64::NAN);
    assert_eq!(
        compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m).unwrap_err(),
        PowerInputError::Missing(MissingComponents(vec!["infra"]))
    );
}

#[test]
fn inactive_battle_field_non_finite_is_not_read() {
    // Pole drugiego modelu bitew nie jest czytane (jak w webie): NaN tam nie blokuje.
    let (c, m) = (coeff(), military());
    let mut flat = complete();
    flat.bitwy_pkt_sum = Component::Provided(f64::NAN);
    assert!(compute_objective_power(&flat, &c, BattlePowerModel::FlatCount, &m).is_ok());
    let mut enemy = complete();
    enemy.wygrane_bitwy = Component::Provided(f64::INFINITY);
    assert!(compute_objective_power(&enemy, &c, BattlePowerModel::EnemyMSum, &m).is_ok());
}

#[test]
fn explicit_zero_and_provided_zero_still_accepted() {
    let (c, m) = (coeff(), military());
    let mut raw = complete();
    raw.zdobycze_power = Component::ExplicitZero;
    assert!(compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m).is_ok());
    raw.zdobycze_power = Component::Provided(0.0);
    assert!(compute_objective_power(&raw, &c, BattlePowerModel::EnemyMSum, &m).is_ok());
}
