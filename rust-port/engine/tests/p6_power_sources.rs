//! P6-POWER-SOURCES (Q1): tabela `COMPONENT_SOURCES` (brake_power_producers) zgodna z kodem.
//!
//! - Kazdy `RustProducer` jest wywolywany tutaj przez swoja funkcje (kompilacja = istnienie) i daje
//!   wartosc zgodna z wektorami z pinu 07d2fbd72 (armia, terytorium, infra, tech, religia; ludki,
//!   rekruci, kultura - wektory z p6_power_producers_vectors). Wyjatek: `miasta` nie ma wektora pinu
//!   (generator go nie emituje) - test reczny (`ownerCities.length`).
//! - Lista `RustProducer` jest zamknieta: nowy producent bez przypadku testowego w `check_key` panikuje.
//! - Kazdy `NoProducer` jest jawnie wymieniony (bitwy, zdobycze) i ma uzasadnienie z odwolaniem
//!   do pinu `plik.ts:linia`; zadna pozycja NoProducer nie jest wywolywana w tym tescie.
//! - Tabela `REST_COMPONENT_SOURCES` (brake_power_rest) musi byc zgodna z `COMPONENT_SOURCES` (ten sam rodzaj).

use std::collections::{BTreeMap, HashSet};

use civ_engine::domain::brake_power_army::{
    armia_for_owner, terytorium_for_owner, ArmyUnit, ArmyUnitDef, TerritoryCityInput,
};
use civ_engine::domain::brake_power_improvements::{
    improvement_count_for_hex, ulepszenia_for_owner,
};
use civ_engine::domain::brake_power_producers::{
    kultura_for_owner, ludki_for_owner, miasta_for_owner, no_producer_keys, rekruci_ekw_for_owner,
    ComponentSource, COMPONENT_SOURCES,
};
use civ_engine::domain::brake_power_rest::{
    count_buildings_for_owner, count_cities_with_dominant_state_religion, count_tech_for_owner,
    has_pin_file_line_ref, rest_no_producer_keys, set_size, ReligionCity, RestSource,
    REST_COMPONENT_SOURCES,
};
use civ_engine::domain::improvements::HexLike;
use civ_engine::domain::order_effects_culture::PressureCity;
use civ_engine::domain::recruitment::manpower::ManpowerCity;
use civ_engine::domain::terrain::{FortImprovementType, FortNode};
use civ_engine::domain::territory::ReligionState;
use civ_engine::domain::unit_power::UnitPowerInput;
use serde_json::Value;

const ARMY_VECTORS: &str = include_str!("p6_power_army_vectors/vectors.json");
const PRODUCERS_VECTORS: &str = include_str!("p6_power_producers_vectors/vectors.json");
const REST_VECTORS: &str = include_str!("p6_power_rest_vectors/vectors.json");
const IMPROVEMENTS_VECTORS: &str = include_str!("p6_power_improvements_vectors/vectors.json");

fn load(json: &str, key: &str) -> Vec<Value> {
    let root: Value = serde_json::from_str(json).expect("vectors.json musi sie parsowac");
    root[key]
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

fn int(v: &Value) -> i64 {
    v.as_i64().expect("calkowita liczba w wektorze")
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

/// Definicja jednostki jak web `unitDefFor(u)` (wzorzec z p6_power_army.rs).
fn army_def(d: &Value) -> ArmyUnitDef {
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
        field_power_cache: d.get("fieldPower").map(f),
    }
}

fn parse_key(k: &str) -> (i32, i32) {
    let (q, r) = k.split_once(',').expect("klucz q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

fn religion_state(v: &Value) -> ReligionState {
    let counts: BTreeMap<String, f64> = v["counts"]
        .as_object()
        .expect("counts jako obiekt")
        .iter()
        .map(|(k, val)| (k.clone(), f(val)))
        .collect();
    ReligionState { counts }
}

/// Producent `armia` na wektorach `armia` (p6_power_army_vectors).
fn check_armia() -> usize {
    let cases = load(ARMY_VECTORS, "armia");
    for (idx, case) in cases.iter().enumerate() {
        let units: Vec<ArmyUnit> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(|u| ArmyUnit {
                owner_id: int(&u["ownerId"]),
                is_settler: u["category"].as_str() == Some("osadnik"),
                def: army_def(&u["def"]),
            })
            .collect();
        let owner = int(&case["owner"]);
        let count_settlers = case["countSettlers"].as_bool().expect("countSettlers");
        let got = armia_for_owner(&units, owner, count_settlers);
        assert_same(got, f(&case["expect"]), &format!("armia[{idx}]"));
    }
    cases.len()
}

/// Producent `ulepszenia` na wektorach `ulepszenia` (p6_power_improvements_vectors).
fn check_ulepszenia() -> usize {
    let cases = load(IMPROVEMENTS_VECTORS, "owner");
    for (idx, c) in cases.iter().enumerate() {
        let cities: Vec<TerritoryCityInput> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|city| TerritoryCityInput {
                q: city["q"].as_i64().expect("q") as i32,
                r: city["r"].as_i64().expect("r") as i32,
                population: city["population"].as_f64().expect("pop"),
                owner_id: city["ownerId"].as_i64().expect("ownerId"),
            })
            .collect();
        let forts: Vec<FortNode> = c["forts"]
            .as_array()
            .expect("forts")
            .iter()
            .map(|f| FortNode {
                q: f["q"].as_i64().expect("q") as i32,
                r: f["r"].as_i64().expect("r") as i32,
                owner_id: f["ownerId"].as_i64().expect("ownerId"),
                kind: if f["type"].as_str() == Some("fort") {
                    FortImprovementType::Fort
                } else {
                    FortImprovementType::Posterunek
                },
                contested_useless: f["contestedUseless"].as_bool(),
            })
            .collect();
        let hexes: BTreeMap<(i32, i32), usize> = c["hexes"]
            .as_object()
            .expect("hexes")
            .iter()
            .map(|(k, v)| {
                let (q, r) = k.split_once(',').expect("q,r");
                let hex = HexLike {
                    ulepszenie: v
                        .get("ulepszenie")
                        .and_then(Value::as_str)
                        .map(str::to_owned),
                    ulepszenia: v.get("ulepszenia").and_then(Value::as_array).map(|a| {
                        a.iter()
                            .filter_map(|x| x.as_str().map(str::to_owned))
                            .collect()
                    }),
                    ..HexLike::default()
                };
                (
                    (q.parse().expect("q"), r.parse().expect("r")),
                    improvement_count_for_hex(&hex),
                )
            })
            .collect();
        let owner = c["owner"].as_i64().expect("owner");
        let got = ulepszenia_for_owner(&cities, &forts, owner, &|q, r| hexes.get(&(q, r)).copied());
        let exp = c["expect"].as_f64().expect("expect");
        assert_eq!(got, exp, "ulepszenia[{idx}]");
    }
    cases.len()
}

/// Producent `terytorium` na wektorach `terytorium` (p6_power_army_vectors).
fn check_terytorium() -> usize {
    let cases = load(ARMY_VECTORS, "terytorium");
    for (idx, case) in cases.iter().enumerate() {
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
                q: int(&c["q"]) as i32,
                r: int(&c["r"]) as i32,
                population: f(&c["population"]),
                owner_id: int(&c["ownerId"]),
            })
            .collect();
        let forts: Vec<FortNode> = case["forts"]
            .as_array()
            .expect("forts")
            .iter()
            .map(|fo| FortNode {
                q: int(&fo["q"]) as i32,
                r: int(&fo["r"]) as i32,
                owner_id: int(&fo["ownerId"]),
                kind: if fo["type"].as_str() == Some("fort") {
                    FortImprovementType::Fort
                } else {
                    FortImprovementType::Posterunek
                },
                contested_useless: Some(fo["contestedUseless"].as_bool().unwrap_or(false)),
            })
            .collect();
        let owner = int(&case["owner"]);
        let got = terytorium_for_owner(&cities, &forts, owner, &exists);
        assert_same(got, f(&case["expect"]), &format!("terytorium[{idx}]"));
    }
    cases.len()
}

/// Producent `infra` (`count_buildings_for_owner`) na wektorach `infra` (p6_power_rest_vectors).
fn check_infra() -> usize {
    let cases = load(REST_VECTORS, "infra");
    for (idx, c) in cases.iter().enumerate() {
        let built: Vec<(i64, usize)> = c["cityBuilt"]
            .as_array()
            .expect("cityBuilt")
            .iter()
            .map(|e| (int(&e[0]), int(&e[1]) as usize))
            .collect();
        let owned: Vec<(i64, i64)> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|e| (int(&e[0]), int(&e[1])))
            .collect();
        let got = count_buildings_for_owner(&built, &owned, int(&c["owner"])) as f64;
        assert_same(got, f(&c["expect"]), &format!("infra[{idx}]"));
    }
    cases.len()
}

/// Producent `tech` (`count_tech_for_owner`) na wektorach `tech` (p6_power_rest_vectors).
fn check_tech() -> usize {
    let cases = load(REST_VECTORS, "tech");
    for (idx, c) in cases.iter().enumerate() {
        let human_len = set_size(
            c["humanTechs"]
                .as_array()
                .expect("humanTechs")
                .iter()
                .map(|v| v.as_str().expect("tech")),
        );
        let ai_len = match &c["aiTechs"] {
            Value::Null => None,
            v => Some(set_size(
                v.as_array()
                    .expect("aiTechs")
                    .iter()
                    .map(|x| x.as_str().expect("tech")),
            )),
        };
        let is_human = c["isHuman"].as_bool().expect("isHuman");
        let got = count_tech_for_owner(is_human, human_len, ai_len) as f64;
        assert_same(got, f(&c["expect"]), &format!("tech[{idx}]"));
    }
    cases.len()
}

/// Producent `religia` (`count_cities_with_dominant_state_religion`) na wektorach `religia`.
fn check_religia() -> usize {
    let cases = load(REST_VECTORS, "religia");
    for (idx, c) in cases.iter().enumerate() {
        let states: Vec<Option<ReligionState>> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|city| city.get("religionState").map(religion_state))
            .collect();
        let cities: Vec<ReligionCity<'_>> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .zip(states.iter())
            .map(|(city, st)| ReligionCity {
                owner_id: int(&city["ownerId"]),
                religion_state: st.as_ref(),
            })
            .collect();
        let got = count_cities_with_dominant_state_religion(
            &cities,
            int(&c["owner"]),
            c["state"].as_str(),
            f(&c["prog"]),
        );
        assert_same(got, f(&c["expect"]), &format!("religia[{idx}]"));
    }
    cases.len()
}

fn manpower_from(arr: &[Value]) -> Vec<ManpowerCity> {
    arr.iter()
        .enumerate()
        .map(|(idx, c)| {
            let mut m =
                ManpowerCity::new(format!("c{idx}"), int(&c["ownerId"]), f(&c["population"]));
            m.manpower = c.get("manpower").map(f);
            m
        })
        .collect()
}

fn pressure_from(arr: &[Value]) -> Vec<PressureCity> {
    arr.iter()
        .map(|c| PressureCity {
            owner_id: int(&c["ownerId"]),
            kultura_skumulowana: f(&c["kulturaSkumulowana"]),
            religion_state: ReligionState::default(),
        })
        .collect()
}

/// Producenci z `produce_for_owner` (ludki, rekruci, kultura): wektory z pinu z
/// p6_power_producers_vectors (te same, na ktorych testuje p6_power_producers.rs).
/// `miasta`: brak wektora pinu (generator nie emituje) - jawne wejscie, `ownerCities.length`.
fn check_legacy(key: &str) -> usize {
    let root: Value =
        serde_json::from_str(PRODUCERS_VECTORS).expect("vectors.json musi sie parsowac");
    let cases_of = |k: &str| -> Vec<Value> {
        root[k]
            .as_array()
            .unwrap_or_else(|| panic!("brak tablicy {k}"))
            .clone()
    };
    match key {
        "ludki" => {
            let cases = cases_of("ludki");
            for (idx, c) in cases.iter().enumerate() {
                let cities = manpower_from(c["cities"].as_array().expect("cities"));
                let got = ludki_for_owner(&cities, int(&c["owner"]));
                assert_same(got, f(&c["expect"]), &format!("ludki[{idx}]"));
            }
            cases.len()
        }
        "rekruci" => {
            let cases = cases_of("pobor");
            for (idx, c) in cases.iter().enumerate() {
                let cities = manpower_from(c["cities"].as_array().expect("cities"));
                let got = rekruci_ekw_for_owner(
                    &cities,
                    int(&c["owner"]),
                    f(&c["epoka"]),
                    f(&c["maxMult"]),
                    f(&c["costMult"]),
                );
                assert_same(
                    got,
                    f(&c["expect"]["rekrutEkw"]),
                    &format!("rekruci[{idx}]"),
                );
            }
            cases.len()
        }
        "kultura" => {
            let cases = cases_of("kultura");
            for (idx, c) in cases.iter().enumerate() {
                let cities = pressure_from(c["cities"].as_array().expect("cities"));
                let got = kultura_for_owner(&cities, int(&c["owner"]));
                assert_same(got, f(&c["expect"]), &format!("kultura[{idx}]"));
            }
            cases.len()
        }
        "miasta" => {
            let owners = [0_i64, 1, 0];
            assert_same(miasta_for_owner(&owners, 0), 2.0, "miasta");
            1
        }
        other => panic!("RustProducer `{other}` bez testu producenta"),
    }
}

/// Dla RustProducer: wolana funkcja daje wartosc na wektorach (lub jawnym wejsciu).
fn check_key(key: &str) -> usize {
    match key {
        "armia" => check_armia(),
        "terytorium" => check_terytorium(),
        "ulepszenia" => check_ulepszenia(),
        "infra" => check_infra(),
        "tech" => check_tech(),
        "religia" => check_religia(),
        "ludki" | "rekruci" | "miasta" | "kultura" => check_legacy(key),
        other => {
            panic!("RustProducer `{other}` bez testu producenta - dopisz przypadek w check_key")
        }
    }
}

#[test]
fn every_rust_producer_is_callable_and_matches_vector_input() {
    let mut rust_keys = Vec::new();
    for (key, source) in COMPONENT_SOURCES.iter() {
        if let ComponentSource::RustProducer(path) = source {
            assert!(!path.is_empty(), "pusty opis producenta dla {key}");
            let checked = check_key(key);
            assert!(checked > 0, "brak przypadkow dla {key}");
            rust_keys.push(*key);
        }
    }
    assert_eq!(
        rust_keys,
        vec![
            "armia",
            "ludki",
            "rekruci",
            "miasta",
            "terytorium",
            "infra",
            "tech",
            "ulepszenia",
            "kultura",
            "religia"
        ]
    );
}

#[test]
fn no_producer_entries_are_exactly_the_two_open_components() {
    let no_producer: Vec<&str> = COMPONENT_SOURCES
        .iter()
        .filter_map(|(k, s)| match s {
            ComponentSource::NoProducer(_) => Some(*k),
            ComponentSource::RustProducer(_) => None,
        })
        .collect();
    assert_eq!(no_producer, vec!["bitwy", "zdobycze"]);
    assert_eq!(no_producer_keys(), no_producer);
    // Zadna pozycja NoProducer nie jest tez RustProducer (tabela ma 12 unikalnych kluczy).
    let unique: HashSet<&str> = COMPONENT_SOURCES.iter().map(|(k, _)| *k).collect();
    assert_eq!(unique.len(), COMPONENT_SOURCES.len());
}

#[test]
fn no_producer_reasons_cite_pin_source() {
    for (key, source) in COMPONENT_SOURCES.iter() {
        if let ComponentSource::NoProducer(reason) = source {
            assert!(
                reason.starts_with("web "),
                "uzasadnienie NoProducer dla {key} musi zaczynac sie od zrodla web: {reason}"
            );
            assert!(
                has_pin_file_line_ref(reason),
                "uzasadnienie NoProducer dla {key} bez odwolania plik.ts:linia pinu: {reason}"
            );
        }
    }
}

#[test]
fn rest_table_kinds_match_component_sources() {
    // Kazdy wpis tabeli pozostalych 6 skladnikow ma ten sam rodzaj (Rust/NoProducer) w tabeli glownej.
    for (key, rest) in REST_COMPONENT_SOURCES.iter() {
        let main = COMPONENT_SOURCES
            .iter()
            .find(|(k, _)| *k == *key)
            .map(|(_, s)| *s)
            .unwrap_or_else(|| panic!("REST `{key}` brak w COMPONENT_SOURCES"));
        let same = matches!(
            (rest, main),
            (
                RestSource::RustProducer(_),
                ComponentSource::RustProducer(_)
            ) | (RestSource::NoProducer(_), ComponentSource::NoProducer(_))
        );
        assert!(
            same,
            "dryf: `{key}` REST={rest:?} vs COMPONENT_SOURCES={main:?}"
        );
    }
    // Otwarte (NoProducer) skladniki z tabeli pozostalych == NoProducer tabeli glownej na tych kluczach.
    let rest_keys: Vec<&str> = REST_COMPONENT_SOURCES.iter().map(|(k, _)| *k).collect();
    let main_open_in_rest: Vec<&str> = no_producer_keys()
        .into_iter()
        .filter(|k| rest_keys.contains(k))
        .collect();
    assert_eq!(rest_no_producer_keys(), main_open_in_rest);
}
