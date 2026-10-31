//! P6.8I-P2 - `pickAutoImprovements` (pin 91dc998a) vs. wektory z URUCHOMIONEGO weba.
//! Wektory: `tests/p6_8i2_vectors/pick.json`, generator:
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8I2-AUTO-ULEPSZENIA-PICK-Q1/gen-p6-8i2-pick-vectors.mjs`.
//! Wspolne parsery stanu mapy (`build_hex`, `terrain`, `overlay`) z wektorow M16 (`#[path]`).

#[path = "p6_m16_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet, HashMap};

use civ_engine::domain::auto_improvements::pick::{
    pick_auto_improvements, AutoImprovementCity, AutoImprovementPick, PickAutoImprovementsOpts,
};
use civ_engine::domain::auto_improvements::{
    fresh_surplus_report, AutoImprovementSurplusReport, UlepszeniaFocus,
};
use civ_engine::domain::improvement_build::{BuildMap, PlacedLayers};
use civ_engine::domain::terrain::CityNode;
use civ_engine::domain::territory::TerritoryNode;
use serde_json::Value;

use common::{build_hex, int, num, s, strs};

const PICK: &str = include_str!("p6_8i2_vectors/pick.json");

fn doc() -> Value {
    serde_json::from_str(PICK).expect("pick.json parses")
}

/// Liczba z wektora: `"NaN"` / `"Infinity"` jako stringi, reszta jako JSON number.
fn fnum(v: &Value) -> f64 {
    match v.as_str() {
        Some("NaN") => f64::NAN,
        Some("Infinity") => f64::INFINITY,
        Some(other) => panic!("nieznana liczba {other}"),
        None => num(v),
    }
}

fn opt_fnum(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(fnum(v))
    }
}

fn focus(v: &Value) -> Option<UlepszeniaFocus> {
    match v.as_str() {
        None => None,
        Some("zywnosc") => Some(UlepszeniaFocus::Zywnosc),
        Some("surowce") => Some(UlepszeniaFocus::Surowce),
        Some("infrastruktura") => Some(UlepszeniaFocus::Infrastruktura),
        Some("zrownowazone") => Some(UlepszeniaFocus::Zrownowazone),
        Some(other) => panic!("zly focus {other}"),
    }
}

fn city(v: &Value) -> AutoImprovementCity {
    AutoImprovementCity {
        id: s(&v["id"]).to_owned(),
        owner_id: v["ownerId"].as_i64().expect("ownerId"),
        q: int(&v["q"]),
        r: int(&v["r"]),
        population: fnum(&v["population"]),
        ulepszenia_focus: focus(&v["focus"]),
        ulepszenia_only_worked: v["onlyWorked"].as_bool(),
        surowce_kon: opt_fnum(&v["surowceKon"]),
    }
}

fn territory_node(v: &Value) -> TerritoryNode {
    let node = CityNode {
        q: int(&v["q"]),
        r: int(&v["r"]),
        is_outpost: v["isOutpost"].as_bool(),
        is_fort: v["isFort"].as_bool(),
        pop: fnum(&v["pop"]),
        level: 1.0,
        civ: None,
    };
    TerritoryNode::new(node, v["ownerId"].as_i64().expect("ownerId"))
}

/// Stan wejsciowy jednego wektora (wlasciciele Stringow trzymane w strukturze, zeby pozyczyc je w opts).
struct Input {
    map: BuildMap,
    cities: Vec<AutoImprovementCity>,
    territory: Option<Vec<TerritoryNode>>,
    placed: Option<BTreeMap<String, PlacedLayers>>,
    techs: BTreeSet<String>,
    civ: Option<String>,
    era: Option<f64>,
    deficit: Option<Vec<String>>,
    override_: Option<Vec<String>>,
    city_pct: Option<HashMap<String, f64>>,
    city_skip: Option<HashMap<String, bool>>,
    worked: Option<HashMap<String, BTreeSet<String>>>,
}

fn input(v: &Value) -> Input {
    let hexes = v["hexes"]
        .as_array()
        .expect("hexes")
        .iter()
        .map(build_hex)
        .collect();
    let paths: Vec<Vec<(i32, i32)>> = v["riverPaths"]
        .as_array()
        .expect("riverPaths")
        .iter()
        .map(|p| {
            p.as_array()
                .unwrap()
                .iter()
                .map(|pt| (int(&pt[0]), int(&pt[1])))
                .collect()
        })
        .collect();
    Input {
        map: BuildMap::new(hexes, paths),
        cities: v["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(city)
            .collect(),
        territory: v["territoryNodes"]
            .as_array()
            .map(|list| list.iter().map(territory_node).collect()),
        placed: v["placedImprovements"].as_object().map(|o| {
            o.iter()
                .map(|(k, val)| {
                    let layers = match val {
                        Value::String(x) => PlacedLayers::One(x.clone()),
                        Value::Array(_) => PlacedLayers::Many(strs(val)),
                        other => panic!("zla warstwa {other}"),
                    };
                    (k.clone(), layers)
                })
                .collect()
        }),
        techs: strs(&v["researchedTechs"]).into_iter().collect(),
        civ: v["civArchetype"].as_str().map(str::to_owned),
        era: opt_fnum(&v["playerEra"]),
        deficit: v["resourceDeficitKeys"]
            .as_array()
            .map(|_| strs(&v["resourceDeficitKeys"])),
        override_: v["priorityOverride"]
            .as_array()
            .map(|_| strs(&v["priorityOverride"])),
        city_pct: v["cityPracaBudgetPercent"].as_object().map(|o| {
            o.iter()
                .filter(|(_, val)| !val.is_null())
                .map(|(k, val)| (k.clone(), fnum(val)))
                .collect()
        }),
        city_skip: v["citySkipWyrab"].as_object().map(|o| {
            o.iter()
                .map(|(k, val)| (k.clone(), val.as_bool().expect("bool")))
                .collect()
        }),
        worked: v["workedHexKeys"].as_object().map(|o| {
            o.iter()
                .map(|(k, val)| {
                    (
                        k.clone(),
                        val.as_array()
                            .unwrap()
                            .iter()
                            .map(|x| s(x).to_owned())
                            .collect::<BTreeSet<String>>(),
                    )
                })
                .collect()
        }),
    }
}

fn run_case(
    case_input: &Value,
) -> (
    Vec<AutoImprovementPick>,
    Option<AutoImprovementSurplusReport>,
) {
    let inp = input(case_input);
    let mut report = fresh_surplus_report();
    let want_report = case_input["surplusReport"].as_bool().unwrap_or(false);
    let deficit_slice: Option<&[String]> = inp.deficit.as_deref();
    let picks = pick_auto_improvements(PickAutoImprovementsOpts {
        cities: &inp.cities,
        owner_id: 0,
        map: &inp.map,
        territory_nodes: inp.territory.as_deref(),
        placed_improvements: inp.placed.as_ref(),
        praca_available: fnum(&case_input["pracaAvailable"]),
        unlocked_techs: &inp.techs,
        praca_budget_percent: opt_fnum(&case_input["pracaBudgetPercent"]),
        city_praca_budget_percent: inp.city_pct.as_ref(),
        improvement_budget_cap: opt_fnum(&case_input["improvementBudgetCap"]),
        max_items_per_city: opt_fnum(&case_input["maxItemsPerCity"]),
        praca_surplus_threshold: opt_fnum(&case_input["pracaSurplusThreshold"]),
        skip_wyrab: case_input["skipWyrab"].as_bool(),
        city_skip_wyrab: inp.city_skip.as_ref(),
        demand_driven: case_input["demandDriven"].as_bool(),
        resource_deficit_keys: deficit_slice,
        surplus_report: if want_report { Some(&mut report) } else { None },
        civ_archetype: inp.civ.clone(),
        player_era: inp.era,
        priority_override: inp.override_.clone(),
        worked_hex_keys: inp.worked.as_ref(),
    });
    (picks, want_report.then_some(report))
}

fn assert_picks(label: &str, got: &[AutoImprovementPick], want: &[Value]) {
    assert_eq!(got.len(), want.len(), "{label}: liczba pickow");
    for (i, (g, w)) in got.iter().zip(want).enumerate() {
        assert_eq!(
            g.owner_id,
            w["ownerId"].as_i64().unwrap(),
            "{label}[{i}] owner"
        );
        assert_eq!(g.city_id, s(&w["cityId"]), "{label}[{i}] city");
        assert_eq!(g.q, int(&w["q"]), "{label}[{i}] q");
        assert_eq!(g.r, int(&w["r"]), "{label}[{i}] r");
        assert_eq!(g.key, s(&w["key"]), "{label}[{i}] key");
        let want_cost = fnum(&w["kosztPraca"]);
        assert!(
            g.koszt_praca.to_bits() == want_cost.to_bits(),
            "{label}[{i}] koszt rust={:?} web={want_cost:?}",
            g.koszt_praca
        );
    }
}

fn assert_surplus(label: &str, got: Option<AutoImprovementSurplusReport>, want: &Value) {
    if want.is_null() {
        assert!(got.is_none(), "{label}: brak raportu po stronie weba");
        return;
    }
    let g = got.expect("raport po stronie Rust");
    assert_eq!(
        g.demand_active,
        want["demandActive"].as_bool().unwrap(),
        "{label} demandActive"
    );
    assert_eq!(
        g.deficit_active,
        want["deficitActive"].as_bool().unwrap(),
        "{label} deficitActive"
    );
    assert_eq!(
        g.any_candidate,
        want["anyCandidate"].as_bool().unwrap(),
        "{label} anyCandidate"
    );
    assert_eq!(
        g.surplus,
        want["surplus"].as_bool().unwrap(),
        "{label} surplus"
    );
}

#[test]
fn vectors_pin_is_91dc998a() {
    assert_eq!(doc()["pin"].as_str(), Some("91dc998a"));
}

#[test]
fn pick_matches_pinned_web_on_all_cases() {
    let d = doc();
    let cases = d["cases"].as_array().expect("cases");
    assert!(cases.len() >= 600, "za malo wektorow: {}", cases.len());
    for c in cases {
        let id = c["id"].as_i64().unwrap();
        let (picks, report) = run_case(&c["input"]);
        let label = format!("case {id}");
        assert_picks(&label, &picks, c["expected"]["picks"].as_array().unwrap());
        assert_surplus(&label, report, &c["expected"]["surplus"]);
    }
}

#[test]
fn pick_matches_pinned_web_on_edge_cases() {
    let d = doc();
    for c in d["edge"].as_array().expect("edge") {
        let id = s(&c["id"]);
        let (picks, report) = run_case(&c["input"]);
        assert_picks(id, &picks, c["expected"]["picks"].as_array().unwrap());
        assert_surplus(id, report, &c["expected"]["surplus"]);
    }
}

#[test]
fn vectors_cover_every_build_key_family() {
    // Pokrycie: wektory musza wywolywac kazdy typ kroku picker (FAZA 0/1/2, KROK 0 wyrab, sonda).
    let d = doc();
    let mut keys: BTreeSet<String> = BTreeSet::new();
    let mut surplus_true = 0usize;
    let mut with_override = 0usize;
    for c in d["cases"].as_array().unwrap() {
        for p in c["expected"]["picks"].as_array().unwrap() {
            keys.insert(s(&p["key"]).to_owned());
        }
        if c["expected"]["surplus"]["surplus"].as_bool() == Some(true) {
            surplus_true += 1;
        }
        if !c["input"]["priorityOverride"].is_null() {
            with_override += 1;
        }
    }
    for k in [
        "farma",
        "tartak",
        "wyrab",
        "posterunek",
        "fort",
        "oboz_lowiecki",
        "stadnina",
        "droga",
    ] {
        assert!(keys.contains(k), "brak pokrycia klucza {k}");
    }
    assert!(surplus_true >= 1, "brak wektora z nadwyzka");
    assert!(with_override >= 1, "brak wektora z priorityOverride");
}
