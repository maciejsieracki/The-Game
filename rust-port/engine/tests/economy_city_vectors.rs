//! Wektory z pinu `gra/` 91dc998a (esbuild bundle modulow economy.ts + production.ts,
//! uruchomiony w node) wobec portu `domain::economy_city_fns` (R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1).
//!
//! Plik wektorow: `tests/fixtures/economy_city_vectors_91dc998a.json`
//! (generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1/04-gen-economy-city-vectors.mjs`).
//! Liczby w JSON sa stringami (`"NaN"`, `"Infinity"`, `"-Infinity"`, `"-0"`, albo `String(x)`),
//! zeby nie tracic bitow. Surowe pola JS (`dajeSzczescie`, `baza.zadowolenie`, ...) sa
//! tagowane `{"kind": ...}`; adapter ponizej odwzorowuje je na typy Rust dokladnie tak,
//! jak robia to wywolania w webie (`=== true`, `typeof === 'number'`, brak pola = NaN).

use std::collections::{HashMap, HashSet};

use civ_engine::domain::city_growth::p6_7a::{city_population_cap, PopCapParams};
use civ_engine::domain::economy_city_fns::{
    city_building_entries_from_built_ids, corruption_building_reduction, corruption_rate,
    production_progress, sum_building_happiness, sum_building_happiness_from_built_ids,
    BuildingLevelCatalogEntry, CorruptionParams, HappinessCatalogEntry, HappinessEntryInput,
};
use serde_json::Value;

const FIXTURE: &str = include_str!("fixtures/economy_city_vectors_91dc998a.json");

fn parse_num(v: &Value) -> f64 {
    let s = v.as_str().expect("liczba musi byc stringiem");
    match s {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => other.parse::<f64>().expect("poprawna liczba"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_num(got: f64, want: &Value, ctx: &str) {
    let want = parse_num(want);
    assert!(same(got, want), "{ctx}: got {got:?} want {want:?}");
}

fn kind(v: &Value) -> &str {
    v["kind"].as_str().expect("kind")
}

/// Surowe `dajeSzczescie` -> `daje_szczescie` (web `buildingGivesHappiness`: `=== true`).
fn daje(raw: &Value) -> bool {
    kind(raw) == "true"
}

/// Surowe `baza.zadowolenie` -> `Option<f64>` (web: tylko `typeof === 'number'`).
fn baza_zad(raw: &Value) -> Option<f64> {
    match kind(raw) {
        "num" => Some(parse_num(&raw["v"])),
        _ => None,
    }
}

/// Surowe `przyrost.zadowolenie` -> f64 (brak pola = NaN, jak `undefined * n` w JS).
fn przyrost_zad(raw: &Value) -> f64 {
    match kind(raw) {
        "num" => parse_num(&raw["v"]),
        _ => f64::NAN,
    }
}

fn str_vec(v: &Value) -> Vec<&str> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_str().expect("string"))
        .collect()
}

#[test]
fn vectors_match_pinned_web_economy() {
    let root: Value = serde_json::from_str(FIXTURE).expect("fixture JSON");
    let vectors = root["vectors"].as_array().expect("vectors");
    assert_eq!(root["count"].as_u64(), Some(vectors.len() as u64));

    let mut counts: HashMap<&str, usize> = HashMap::new();
    for vec in vectors {
        let f = vec["fn"].as_str().expect("fn");
        *counts.entry(f).or_default() += 1;
        let input = &vec["in"];
        let out = &vec["out"];
        match f {
            "sumBuildingHappinessFromBuiltIds" => {
                let built = str_vec(&input["built"]);
                let catalog_raw = input["catalog"].as_array().unwrap();
                let catalog: Vec<HappinessCatalogEntry<'_>> = catalog_raw
                    .iter()
                    .map(|c| HappinessCatalogEntry {
                        id: c["id"].as_str().unwrap(),
                        daje_szczescie: daje(&c["dz"]),
                        baza_zadowolenie: baza_zad(&c["bz"]),
                        przyrost_zadowolenie: przyrost_zad(&c["pz"]),
                    })
                    .collect();
                let table: HashMap<&str, f64> = input["levelTable"]
                    .as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, v)| (k.as_str(), parse_num(v)))
                    .collect();
                let got = sum_building_happiness_from_built_ids(&built, &catalog, |e| {
                    // web levelFor(bdef): poziom po id znalezionego wpisu.
                    table[e.id]
                });
                assert_num(
                    got,
                    out,
                    &format!("sumBuildingHappinessFromBuiltIds {input}"),
                );
            }
            "sumBuildingHappiness" => {
                let entries: Vec<HappinessEntryInput> = input["entries"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|e| HappinessEntryInput {
                        daje_szczescie: daje(&e["dz"]),
                        baza_zadowolenie: baza_zad(&e["bz"]),
                        przyrost_zadowolenie: przyrost_zad(&e["pz"]),
                        level: parse_num(&e["level"]),
                    })
                    .collect();
                assert_num(
                    sum_building_happiness(&entries),
                    out,
                    &format!("sumBuildingHappiness {input}"),
                );
            }
            "cityBuildingEntriesFromBuiltIds" => {
                let catalog_raw = input["catalog"].as_array().unwrap();
                // Wlasciciele danych gate musza zyc dluzej niz katalog.
                let gates: Vec<Option<Vec<(String, String)>>> = catalog_raw
                    .iter()
                    .map(|c| match kind(&c["gate"]) {
                        "obj" => Some(
                            c["gate"]["entries"]
                                .as_array()
                                .unwrap()
                                .iter()
                                .map(|p| {
                                    (
                                        p[0].as_str().unwrap().to_string(),
                                        p[1].as_str().unwrap().to_string(),
                                    )
                                })
                                .collect(),
                        ),
                        _ => None,
                    })
                    .collect();
                let catalog: Vec<BuildingLevelCatalogEntry<'_>> = catalog_raw
                    .iter()
                    .zip(gates.iter())
                    .map(|(c, g)| BuildingLevelCatalogEntry {
                        id: c["id"].as_str().unwrap(),
                        epoka_wejscia: parse_num(&c["epokaWejscia"]),
                        maks_poziom: parse_num(&c["maksPoziom"]),
                        poziom_tech_gate: g.as_deref(),
                    })
                    .collect();
                let built = str_vec(&input["built"]);
                let unlocked: Option<HashSet<String>> = match kind(&input["unlocked"]) {
                    "set" => Some(
                        input["unlocked"]["items"]
                            .as_array()
                            .unwrap()
                            .iter()
                            .map(|x| x.as_str().unwrap().to_string())
                            .collect(),
                    ),
                    _ => None,
                };
                let got = city_building_entries_from_built_ids(
                    &built,
                    &catalog,
                    parse_num(&input["cityEpoch"]),
                    unlocked.as_ref(),
                );
                let want = out.as_array().unwrap();
                assert_eq!(got.len(), want.len(), "cityBuildingEntries dlugosc {input}");
                for (g, w) in got.iter().zip(want.iter()) {
                    assert_eq!(
                        g.catalog_index as u64,
                        w[0].as_u64().unwrap(),
                        "indeks {input}"
                    );
                    assert_num(g.level, &w[1], &format!("poziom {input}"));
                }
            }
            "productionProgress" => {
                let r = production_progress(
                    parse_num(&input["cost"]),
                    parse_num(&input["progress"]),
                    parse_num(&input["praca"]),
                );
                assert_eq!(
                    r.completed,
                    out["completed"].as_bool().unwrap(),
                    "completed {input}"
                );
                assert_num(
                    r.nowa_zebrana_praca,
                    &out["newZebranaPraca"],
                    &format!("nowa {input}"),
                );
                assert_num(
                    r.remainder,
                    &out["remainder"],
                    &format!("remainder {input}"),
                );
            }
            "corruptionRate" => {
                let p = CorruptionParams {
                    wspolczynnik_dystansu: parse_num(&input["wd"]),
                    wspolczynnik_miast: parse_num(&input["wm"]),
                    cap: parse_num(&input["cap"]),
                };
                let got =
                    corruption_rate(parse_num(&input["dystans"]), parse_num(&input["miasta"]), p);
                assert_num(got, out, &format!("corruptionRate {input}"));
            }
            "corruptionBuildingReduction" => {
                let built = str_vec(&input["built"]);
                assert_num(
                    corruption_building_reduction(&built),
                    out,
                    &format!("reduction {input}"),
                );
            }
            "cityPopulationCap" => {
                // Istniejacy port (nie kopiowany): city_growth::p6_7a (web cityPopulationCap, economy.ts:1048).
                let params = PopCapParams {
                    akwedukt_prog_ludnosci: parse_num(&input["akwProg"]),
                    spichlerz_prog_ludnosci: parse_num(&input["spProg"]),
                    akwedukt_max_ludnosci: parse_num(&input["akwMax"]),
                };
                let got = city_population_cap(
                    input["akw"].as_bool().unwrap(),
                    input["sp"].as_bool().unwrap(),
                    &params,
                    parse_num(&input["delta"]),
                );
                assert_num(got, out, &format!("cityPopulationCap {input}"));
            }
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }

    // Pokrycie: liczby wektorow sa czescia dowodu (nie mozna ich cicho skrocic).
    assert_eq!(counts["sumBuildingHappinessFromBuiltIds"], 400);
    assert_eq!(counts["sumBuildingHappiness"], 300);
    assert_eq!(counts["cityBuildingEntriesFromBuiltIds"], 400);
    assert_eq!(counts["productionProgress"], 400);
    assert_eq!(counts["corruptionRate"], 400);
    assert_eq!(counts["corruptionBuildingReduction"], 200);
    assert_eq!(counts["cityPopulationCap"], 400);
    assert_eq!(vectors.len(), 2500);
}
