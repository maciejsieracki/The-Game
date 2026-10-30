//! P6.8B-P1b-c2c (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba dla
//! `availableProduction` (production.ts ~923-1135).
//!
//! Wektory: `tests/p6_8b_vectors/p1b-c2c.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/gen-p6-8b-c2c-vectors.mjs`
//! (Node 22 + loader TS: PRAWDZIWE production.ts, units.json i buildings.json z pinu).
//!
//! Kodowanie liczb: calkowita = JSON number; niecalkowita = {"$f": "..."}; NaN/Infinity/-0 = {"$n": "..."}.
//! Nieobecne pole = {"absent": true}; null = null.

use civ_engine::domain::production_units::{
    available_production, AvailabilityContext, BuildingAvailRow, BuildingCostRow,
    ProductionAvailabilityCtx, ProductionItem, ProductionKind, UnitCostRow, UnitReplaceRow,
};
use serde_json::Value;
use std::collections::BTreeMap;

const C2C_JSON: &str = include_str!("p6_8b_vectors/p1b-c2c.json");

fn root() -> Value {
    serde_json::from_str(C2C_JSON).expect("wektor JSON p1b-c2c")
}

fn dec(v: &Value) -> f64 {
    if let Some(n) = v.as_f64() {
        return n;
    }
    if let Some(s) = v.get("$f").and_then(Value::as_str) {
        return s.parse::<f64>().expect("$f");
    }
    match v.get("$n").and_then(Value::as_str).expect("$n") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => panic!("nieznana liczba {other}"),
    }
}

fn same_num(actual: f64, expected: &Value) -> bool {
    let e = dec(expected);
    if e.is_nan() {
        return actual.is_nan();
    }
    if e == 0.0 && e.is_sign_negative() {
        return actual == 0.0 && actual.is_sign_negative();
    }
    actual == e
}

fn raw_str(v: Option<&Value>) -> Option<String> {
    v.and_then(Value::as_str).map(str::to_string)
}

fn raw_num(v: Option<&Value>) -> Option<f64> {
    v.and_then(Value::as_f64)
}

fn str_list(v: Option<&Value>) -> Option<Vec<String>> {
    v.and_then(Value::as_array).map(|a| {
        a.iter()
            .map(|x| x.as_str().expect("napis").to_string())
            .collect()
    })
}

fn unit_rows(root: &Value, key: &str) -> Vec<UnitReplaceRow> {
    root[key]
        .as_array()
        .expect("klucz unitsProj*")
        .iter()
        .map(|u| UnitReplaceRow {
            cost: UnitCostRow {
                jednostka: u["Jednostka"].as_str().expect("Jednostka").to_string(),
                epoka: raw_str(u.get("Epoka")),
                pieniadz_koszt: raw_num(u.get("Pieniądz (koszt)")),
                super_jednostka: raw_str(u.get("Super-jednostka")),
                rola: raw_str(u.get("Rola (linia)")),
                surowiec: raw_str(u.get("Surowiec")),
            },
            typ: raw_str(u.get("Typ")),
            nacja: raw_str(u.get("Nacja")),
            tech: raw_str(u.get("Tech")),
            w_zamian_za: raw_str(u.get("W zamian za")),
            zastap_specjalnie: raw_str(u.get("Zastąp specjalnie")),
        })
        .collect()
}

fn building_rows(root: &Value) -> Vec<BuildingAvailRow> {
    root["buildingsProj"]
        .as_array()
        .expect("buildingsProj")
        .iter()
        .map(|b| BuildingAvailRow {
            cost: BuildingCostRow {
                id: b["id"].as_str().expect("id").to_string(),
                nazwa: raw_str(b.get("nazwa")).unwrap_or_default(),
                koszt_budowy: raw_num(b.get("kosztBudowy")).unwrap_or(f64::NAN),
                przyrost_kosztu: raw_num(b.get("przyrostKosztu")).unwrap_or(f64::NAN),
                epoka_wejscia: raw_num(b.get("epokaWejscia")),
                lokalizacja: raw_str(b.get("lokalizacja")),
            },
            upgrade_from: raw_str(b.get("upgradeFrom")),
            suppressed: b.get("suppressed").and_then(Value::as_bool),
            tech_unlock: raw_str(b.get("techUnlock")),
            wymagany_surowiec: raw_str(b.get("wymaganySurowiec")),
            odblokowuje: raw_str(b.get("odblokowuje")),
        })
        .collect()
}

fn queue_of(v: &Value) -> Vec<ProductionItem> {
    v.as_array()
        .map(|a| {
            a.iter()
                .map(|it| ProductionItem {
                    kind: match it["kind"].as_str().expect("kind") {
                        "budynek" => ProductionKind::Budynek,
                        "jednostka" => ProductionKind::Jednostka,
                        other => panic!("kind {other}"),
                    },
                    id: it["id"].as_str().expect("id").to_string(),
                    nazwa: it["nazwa"].as_str().expect("nazwa").to_string(),
                    koszt: dec(&it["koszt"]),
                    postep: None,
                    is_general: None,
                })
                .collect()
        })
        .unwrap_or_default()
}

#[test]
fn available_production_matches_web_vectors() {
    let r = root();
    let units_real = unit_rows(&r, "unitsProj");
    let units_synth = unit_rows(&r, "unitsProjSynth");
    let buildings = building_rows(&r);
    let all_techs = str_list(r.get("allTechs")).expect("allTechs");
    let half_techs = str_list(r.get("halfTechs")).expect("halfTechs");

    let cases = r["cases"].as_array().expect("cases");
    assert!(cases.len() >= 600, "za malo wektorow: {}", cases.len());
    let budynki: usize = cases
        .iter()
        .map(|c| {
            c["out"]
                .as_array()
                .map_or(0, |o| o.iter().filter(|x| x[0] == "budynek").count())
        })
        .sum();
    assert!(
        budynki >= 500,
        "za malo pozycji-budynkow w wektorach: {budynki}"
    );

    let ctxs = r["ctxs"].as_array().expect("ctxs");
    for case in cases {
        let name = case["ctx"].as_str().expect("ctx");
        let doc = ctxs
            .iter()
            .find(|d| d["name"].as_str() == Some(name))
            .expect("ctxs");
        let c = &doc["ctx"];

        let techs_owned: Vec<String> = match doc["techs"].as_str().expect("techs") {
            "ALL" => all_techs.clone(),
            "HALF" => half_techs.clone(),
            _ => Vec::new(),
        };
        let techs: Vec<&str> = techs_owned.iter().map(String::as_str).collect();
        let built_owned = str_list(
            c.get("builtBuildingIds")
                .filter(|v| v.get("absent").is_none()),
        )
        .unwrap_or_default();
        let built: Vec<&str> = built_owned.iter().map(String::as_str).collect();
        let alive_owned = str_list(
            c.get("aliveUnitTypeNames")
                .filter(|v| v.get("absent").is_none()),
        )
        .unwrap_or_default();
        let alive: Vec<&str> = alive_owned.iter().map(String::as_str).collect();
        let empire_built: Option<Vec<String>> = str_list(
            c.get("empireBuiltIds")
                .filter(|v| v.get("absent").is_none()),
        );
        let stock: Option<BTreeMap<String, f64>> = match c.get("empireResourceStock") {
            Some(v) if v.get("absent").is_none() => v
                .as_object()
                .map(|o| o.iter().map(|(k, x)| (k.clone(), dec(x))).collect()),
            _ => None,
        };
        let civ_key_owned: Option<String>;
        let civ_key: Option<Option<&str>> = match c.get("civKey") {
            None => None,
            Some(v) if v.get("absent").is_some() => None,
            Some(Value::Null) => Some(None),
            Some(v) => {
                civ_key_owned = Some(v.as_str().expect("civKey").to_string());
                Some(civ_key_owned.as_deref())
            }
        };
        let civ_nacja = raw_str(c.get("civUnitNacja").filter(|v| v.get("absent").is_none()));
        let queue = queue_of(&c["productionQueue"]);
        let epoch = match c.get("epoch") {
            Some(v) if v.get("absent").is_none() => dec(v),
            _ => f64::NAN,
        };
        let level = match c.get("buildingLevel") {
            Some(v) if v.get("absent").is_none() => dec(v),
            _ => f64::NAN,
        };

        let ctx = ProductionAvailabilityCtx {
            epoch,
            building_level: level,
            built_building_ids: &built,
            production_queue: &queue,
            unlocked_techs: &techs,
            civ_key,
            civ_unit_nacja: civ_nacja.as_deref(),
            city_has_coast_or_river: c["cityHasCoastOrRiver"].as_bool().unwrap_or(false),
            show_stock_gated_units: c["showStockGatedUnits"].as_bool().unwrap_or(false),
            show_resource_gated_buildings: c["showResourceGatedBuildings"]
                .as_bool()
                .unwrap_or(false),
            alive_unit_type_names: &alive,
            empire_built_ids: empire_built.as_deref(),
            cost: AvailabilityContext {
                is_capital: c.get("isCapital").and_then(Value::as_bool),
                empire_resource_stock: stock.as_ref(),
                ..Default::default()
            },
        };

        let units = match case["ds"].as_str().expect("ds") {
            "real" => &units_real,
            "synth" => &units_synth,
            other => panic!("nieznany zbior {other}"),
        };
        let got = available_production(&buildings, units, &ctx);
        let want = case["out"].as_array().expect("out");
        assert_eq!(
            got.len(),
            want.len(),
            "dlugosc ctx={name}: got={:?}",
            got.iter().map(|i| &i.id).collect::<Vec<_>>()
        );
        for (g, w) in got.iter().zip(want) {
            let kind = match w[0].as_str().expect("kind") {
                "budynek" => ProductionKind::Budynek,
                _ => ProductionKind::Jednostka,
            };
            let id = w[1].as_str().expect("id");
            let nazwa = match &w[2] {
                Value::Bool(true) => id.to_string(),
                other => other.as_str().expect("nazwa").to_string(),
            };
            assert_eq!(g.kind, kind, "kind {id} ctx={name}");
            assert_eq!(g.id, id, "id ctx={name}");
            assert_eq!(g.nazwa, nazwa, "nazwa {id} ctx={name}");
            assert!(
                same_num(g.koszt, &w[3]),
                "koszt {id} ctx={name}: rust={}",
                g.koszt
            );
        }
    }
}

const NAN_SORT_C2C_JSON: &str = include_str!("p6_8b_vectors/p1b-c2c-nan-sort.json");

fn sort_item(kind: ProductionKind, id: &str, nazwa: &str, koszt: f64) -> ProductionItem {
    ProductionItem {
        kind,
        id: id.to_string(),
        nazwa: nazwa.to_string(),
        koszt,
        postep: None,
        is_general: None,
    }
}

/// P6.8B-P1b-c2c (r4 obrona, zarzut 2 / mutant B16): kolejnosc wejscia nie wplywa na wynik.
/// Web wstawia budynki przed jednostkami, wiec wejscie "jednostka przed budynkiem" nigdy nie
/// wystepuje w grze -- test wymusza ja jawnie; komparator asymetryczny daje wtedy zly porzadek.
#[test]
fn production_item_order_is_input_order_independent() {
    use civ_engine::domain::production_units::{js_array_sort_by, production_item_order};
    let unit = sort_item(ProductionKind::Jednostka, "lucznik", "Łucznik", 1.0);
    let building = sort_item(ProductionKind::Budynek, "mury", "Mury", 5.0);
    for input in [
        vec![unit.clone(), building.clone()],
        vec![building.clone(), unit.clone()],
    ] {
        let mut v = input;
        js_array_sort_by(&mut v, production_item_order);
        assert_eq!(
            v[0].kind,
            ProductionKind::Budynek,
            "budynek przed jednostka"
        );
        assert_eq!(v[1].kind, ProductionKind::Jednostka);
    }
}

/// Sortowanie `availableProduction` z kosztami NaN/Infinity, typami i duplikatami nazw:
/// wynik = V8 `Array.prototype.sort` z komparatorem 1:1 z production.ts (400 przypadkow, n = 2..63).
#[test]
fn available_production_sort_matches_v8_with_nan_costs() {
    use civ_engine::domain::production_units::{js_array_sort_by, production_item_order};
    let cases: Value = serde_json::from_str(NAN_SORT_C2C_JSON).expect("p1b-c2c-nan-sort");
    let cases = cases.as_array().expect("tablica przypadkow");
    assert_eq!(cases.len(), 400);
    for (ci, case) in cases.iter().enumerate() {
        let mut items: Vec<ProductionItem> = case["items"]
            .as_array()
            .expect("items")
            .iter()
            .map(|it| {
                let kind = match it["kind"].as_str().expect("kind") {
                    "budynek" => ProductionKind::Budynek,
                    _ => ProductionKind::Jednostka,
                };
                sort_item(
                    kind,
                    it["id"].as_str().expect("id"),
                    it["nazwa"].as_str().expect("nazwa"),
                    dec(&it["koszt"]),
                )
            })
            .collect();
        js_array_sort_by(&mut items, production_item_order);
        let got: Vec<&str> = items.iter().map(|it| it.id.as_str()).collect();
        let want: Vec<&str> = case["order"]
            .as_array()
            .expect("order")
            .iter()
            .map(|v| v.as_str().expect("id"))
            .collect();
        assert_eq!(got, want, "przypadek {ci}");
    }
}
