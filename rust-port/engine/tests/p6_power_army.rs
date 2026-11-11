//! P6-POWER-ARMIA-TERYTORIUM (Q1): testy producentow skladnikow `armia` i `terytorium` vs wektory z PINU
//! web (07d2fbd72f758705f8e1d59cc4968027ffbafe75), generowane przez tests/p6_power_army_gen.mjs
//! (wykonanie wycietych funkcji weba, nie reczne asercje).

use civ_engine::domain::brake_power_army::{
    armia_for_owner, army_field_power, count_territory_hexes, sum_army_m_for_owner,
    territory_hexes_for_owner, terytorium_for_owner, ArmyUnit, ArmyUnitDef, TerritoryCityInput,
};
use civ_engine::domain::terrain::{CityNode, FortImprovementType, FortNode};
use civ_engine::domain::territory::{collect_territory_hex_keys_by_owner, TerritoryNode};
use civ_engine::domain::unit_power::{UnitPowerCoeffs, UnitPowerInput};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet, HashSet};

const VECTORS: &str = include_str!("p6_power_army_vectors/vectors.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json musi sie parsowac")
}

fn cases(key: &str) -> Vec<Value> {
    root()[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
        .clone()
}

/// Liczba z wektora; NaN / +-Infinity zakodowane jako napisy (generator, JSON nie ma tych wartosci).
fn f(v: &Value) -> f64 {
    match v {
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy w wektorze: {other}"),
        },
        _ => v.as_f64().expect("liczba w wektorze"),
    }
}

fn assert_same(got: f64, exp: f64, msg: &str) {
    if exp.is_nan() {
        assert!(got.is_nan(), "{msg}: oczekiwano NaN, otrzymano {got}");
    } else {
        assert_eq!(got, exp, "{msg}");
    }
}

fn num_field(d: &Value, key: &str) -> f64 {
    d.get(key).map(f).unwrap_or(0.0)
}

fn str_field(d: &Value, key: &str) -> Option<String> {
    d.get(key).and_then(Value::as_str).map(str::to_owned)
}

/// Definicja jak web `unitDefFor(u)`: brak pola = 0 (web `num()`), cache tylko gdy jest liczba.
fn def_from(d: &Value) -> ArmyUnitDef {
    ArmyUnitDef {
        power: UnitPowerInput {
            melee_attack: num_field(d, "meleeAttack"),
            melee_defence: num_field(d, "meleeDefence"),
            weapon_damage: num_field(d, "weaponDamage"),
            piercing: num_field(d, "piercing"),
            armor: num_field(d, "armor"),
            charge_bonus: num_field(d, "chargeBonus"),
            health: num_field(d, "health"),
            missile_attack: num_field(d, "missileAttack"),
            typ: str_field(d, "Typ"),
            jednostka: str_field(d, "Jednostka"),
        },
        rola_linia: str_field(d, "Rola (linia)"),
        field_power_cache: d.get("fieldPower").and_then(Value::as_f64),
    }
}

fn coeffs() -> UnitPowerCoeffs {
    UnitPowerCoeffs::from_params()
}

#[test]
fn army_field_power_matches_web_pin() {
    let c = coeffs();
    let all = cases("armyField");
    assert!(all.len() >= 80, "za malo przypadkow armyField");
    for (idx, case) in all.iter().enumerate() {
        let got = army_field_power(&def_from(&case["def"]), &c);
        assert_same(got, f(&case["expect"]), &format!("armyField[{idx}]"));
    }
}

#[test]
fn sum_army_m_matches_web_pin() {
    let c = coeffs();
    let all = cases("armia");
    assert!(all.len() >= 60, "za malo przypadkow armia");
    for (idx, case) in all.iter().enumerate() {
        let units: Vec<ArmyUnit> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(|u| ArmyUnit {
                owner_id: u["ownerId"].as_i64().expect("ownerId"),
                is_settler: u["category"].as_str() == Some("osadnik"),
                def: def_from(&u["def"]),
            })
            .collect();
        let owner = case["owner"].as_i64().expect("owner");
        let count_settlers = case["countSettlers"].as_bool().expect("countSettlers");
        let got = sum_army_m_for_owner(&units, owner, count_settlers, &c);
        assert_same(got, f(&case["expect"]), &format!("armia[{idx}]"));
        // Wrapper produkcyjny (wspolczynniki z combat-params.json) == wersja z jawnymi wspolczynnikami.
        let prod = armia_for_owner(&units, owner, count_settlers);
        assert_same(prod, f(&case["expect"]), &format!("armia[{idx}] producent"));
    }
}

#[test]
fn territory_hexes_match_web_pin() {
    let all = cases("terytorium");
    assert!(all.len() >= 50, "za malo przypadkow terytorium");
    for (idx, case) in all.iter().enumerate() {
        let hex_set: HashSet<(i32, i32)> = case["hexKeys"]
            .as_array()
            .expect("hexKeys")
            .iter()
            .map(|k| parse_key(k.as_str().expect("klucz")))
            .collect();
        let exists = |q: i32, r: i32| hex_set.contains(&(q, r));
        let cities: Vec<TerritoryCityInput> = case["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|c| TerritoryCityInput {
                q: c["q"].as_i64().expect("q") as i32,
                r: c["r"].as_i64().expect("r") as i32,
                population: f(&c["population"]),
                owner_id: c["ownerId"].as_i64().expect("ownerId"),
            })
            .collect();
        let forts: Vec<FortNode> = case["forts"]
            .as_array()
            .expect("forts")
            .iter()
            .map(|fo| FortNode {
                q: fo["q"].as_i64().expect("q") as i32,
                r: fo["r"].as_i64().expect("r") as i32,
                owner_id: fo["ownerId"].as_i64().expect("ownerId"),
                kind: if fo["type"].as_str() == Some("fort") {
                    FortImprovementType::Fort
                } else {
                    FortImprovementType::Posterunek
                },
                contested_useless: Some(fo["contestedUseless"].as_bool().unwrap_or(false)),
            })
            .collect();
        let owner = case["owner"].as_i64().expect("owner");
        let exp = f(&case["expect"]);
        let got = territory_hexes_for_owner(owner, &cities, &forts, &exists) as f64;
        assert_same(got, exp, &format!("terytorium[{idx}]"));
        assert_same(
            terytorium_for_owner(&cities, &forts, owner, &exists),
            exp,
            &format!("terytorium[{idx}] producent"),
        );
    }
}

fn parse_key(k: &str) -> (i32, i32) {
    let (q, r) = k.split_once(',').expect("klucz q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

#[test]
fn siege_units_contribute_zero_even_with_cache() {
    let c = coeffs();
    let def = ArmyUnitDef {
        power: UnitPowerInput {
            melee_attack: 10.0,
            ..UnitPowerInput::default()
        },
        rola_linia: Some("Oblężnicza".to_owned()),
        field_power_cache: Some(55.0),
    };
    assert_eq!(army_field_power(&def, &c), 0.0);
    // Dokladne dopasowanie roli: wariant malymi literami nie jest oblezniczy (web `===`).
    let not_siege = ArmyUnitDef {
        rola_linia: Some("oblężnicza".to_owned()),
        ..def
    };
    assert_eq!(army_field_power(&not_siege, &c), 55.0);
}

#[test]
fn cache_is_ignored_when_ranged_mult_differs_from_one() {
    let c = coeffs();
    // Procarz (Slinger): mnoznik pocisku != 1 -> cache (liczony bez mnoznika) nie jest uzywany.
    let slinger = ArmyUnitDef {
        power: UnitPowerInput {
            missile_attack: 4.0,
            typ: Some("Slinger".to_owned()),
            jednostka: Some("Procarz".to_owned()),
            ..UnitPowerInput::default()
        },
        rola_linia: Some("Piesza".to_owned()),
        field_power_cache: Some(1.0),
    };
    let live = civ_engine::domain::unit_power::field_power(&slinger.power, &c).total;
    assert_eq!(army_field_power(&slinger, &c), live);
    assert_ne!(live, 1.0);
}

#[test]
fn territory_candidate_differs_from_web_union_count() {
    // Dowod (nie tylko opis): kandydat territory.rs::collect_territory_hex_keys_by_owner przypisuje
    // kazdy heks JEDNEMU wlascicielowi (rozstrzyganie sporu), a web heksyTerytorium liczy unie dyskow
    // wlasnych wezlow. Dwa miasta roznych wlascicieli o nakladajacych sie zasiegach -> rozne liczby.
    let keys: Vec<String> = (-12..=12)
        .flat_map(|q| (-12..=12).map(move |r| format!("{q},{r}")))
        .collect();
    let exists_set: HashSet<(i32, i32)> = keys.iter().map(|k| parse_key(k)).collect();
    let exists = |q: i32, r: i32| exists_set.contains(&(q, r));
    let cities = vec![
        TerritoryCityInput {
            q: 0,
            r: 0,
            population: 5.0,
            owner_id: 1,
        },
        TerritoryCityInput {
            q: 2,
            r: 0,
            population: 5.0,
            owner_id: 2,
        },
    ];
    let union_owner1 = territory_hexes_for_owner(1, &cities, &[], &exists);
    let nodes = vec![
        TerritoryNode::new(CityNode::city(0, 0, 5.0), 1),
        TerritoryNode::new(CityNode::city(2, 0, 5.0), 2),
    ];
    let by_owner: BTreeMap<i64, BTreeSet<String>> =
        collect_territory_hex_keys_by_owner(&keys, &nodes, None);
    let candidate_owner1 = by_owner.get(&1).map_or(0, BTreeSet::len);
    assert_eq!(
        union_owner1,
        count_territory_hexes(&[CityNode::city(0, 0, 5.0)], &exists)
    );
    assert!(
        candidate_owner1 < union_owner1,
        "kandydat {candidate_owner1} powinien byc mniejszy od unii {union_owner1}"
    );
    assert_eq!(
        terytorium_for_owner(&cities, &[], 1, &exists),
        union_owner1 as f64
    );
}
