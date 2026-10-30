//! P6.8A-P1 (dokonczenie) i P6.8A-P2 (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO
//! weba (`tests/p6_8a_vectors/production_costs.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/gen-p6-8a-production-vectors.mjs`).
//!
//! Kodowanie liczb: liczba calkowita = JSON number; niecalkowita = {"$f": "..."};
//! NaN/Infinity/-0 = {"$n": "..."}. Pole nieobecne w wierszu danych (web `undefined`) = NaN dla pol
//! liczbowych i `None` dla napisowych. Widok typowany: `grupa`/`suppressed` itp. nie wystepuja tu.

use std::collections::{BTreeMap, HashSet};

use civ_engine::domain::building_costs::p6_7b::{building_cost_pace_multiplier, PaceInput};
use civ_engine::domain::building_costs::repin_b2::{
    CostMarker, MarkerValue, GLOBAL_BUILDING_PROD_MULT,
};
use civ_engine::domain::production_units::{
    building_level_for_epoch, building_location_allowed, building_production_item,
    default_unit_cost, empire_stock_has, item_cost, strip_diacritics, unit_production_item,
    unit_stock_shortfall_label, BuildingCostRow, ProductionData, ProductionKind, UnitCostRow,
    EPOCH_BY_NAME, RECRUIT_UNITS_PER_TURN,
};
use civ_engine::domain::recruitment::army_merge::UnitCostPace;
use civ_engine::domain::types::Difficulty;
use serde_json::Value;

const PROD_JSON: &str = include_str!("p6_8a_vectors/production_costs.json");

fn dec(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                s.as_str().expect("$f").parse::<f64>().expect("$f parse")
            } else {
                match o.get("$n").and_then(Value::as_str).expect("$n") {
                    "NaN" => f64::NAN,
                    "Infinity" => f64::INFINITY,
                    "-Infinity" => f64::NEG_INFINITY,
                    "-0" => -0.0,
                    other => panic!("nieznane $n: {other}"),
                }
            }
        }
        other => panic!("nie-liczba: {other:?}"),
    }
}

fn same_num(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn num_or_nan(row: &Value, key: &str) -> f64 {
    row.get(key).map_or(f64::NAN, dec)
}

/// Pole liczbowe: nieobecne / `null` / napis (web `typeof !== 'number'`) = `None`.
fn opt_num(row: &Value, key: &str) -> Option<f64> {
    match row.get(key) {
        Some(v @ Value::Number(_)) => Some(dec(v)),
        Some(v @ Value::Object(_)) => Some(dec(v)),
        _ => None,
    }
}

fn opt_str(row: &Value, key: &str) -> Option<String> {
    match row.get(key) {
        Some(Value::String(s)) => Some(s.clone()),
        _ => None,
    }
}

fn difficulty(s: &str) -> Difficulty {
    match s {
        "easy" => Difficulty::Easy,
        "normal" => Difficulty::Normal,
        "hard" => Difficulty::Hard,
        other => panic!("nieznana trudnosc {other}"),
    }
}

fn kind(s: &str) -> ProductionKind {
    match s {
        "budynek" => ProductionKind::Budynek,
        "jednostka" => ProductionKind::Jednostka,
        other => panic!("nieznany rodzaj {other}"),
    }
}

fn load_data(root: &Value) -> ProductionData {
    let buildings = root["data"]["buildings"]
        .as_array()
        .unwrap()
        .iter()
        .map(|b| BuildingCostRow {
            id: b["id"].as_str().unwrap().to_string(),
            nazwa: opt_str(b, "nazwa").unwrap_or_default(),
            koszt_budowy: num_or_nan(b, "kosztBudowy"),
            przyrost_kosztu: num_or_nan(b, "przyrostKosztu"),
            epoka_wejscia: opt_num(b, "epokaWejscia"),
            lokalizacja: opt_str(b, "lokalizacja"),
        })
        .collect();
    let units = root["data"]["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| UnitCostRow {
            jednostka: u["Jednostka"].as_str().unwrap().to_string(),
            epoka: opt_str(u, "Epoka"),
            pieniadz_koszt: opt_num(u, "Pieniądz (koszt)"),
            super_jednostka: opt_str(u, "Super-jednostka"),
            rola: opt_str(u, "Rola (linia)"),
            surowiec: opt_str(u, "Surowiec"),
        })
        .collect();
    ProductionData { buildings, units }
}

/// Bufor markerow (wlasnosc danych) -> `CostMarker` z pozyczkami.
struct OwnedMarker {
    cel: Option<String>,
    wartosc: MarkerValue,
    realizuje: Option<String>,
    matrix_param_id: Option<String>,
}

fn owned_markers(list: &Value) -> Vec<OwnedMarker> {
    list.as_array()
        .map(|items| {
            items
                .iter()
                .map(|m| OwnedMarker {
                    cel: opt_str(m, "cel"),
                    wartosc: match m.get("wartosc") {
                        Some(v @ Value::Number(_)) | Some(v @ Value::Object(_)) => {
                            MarkerValue::Number(dec(v))
                        }
                        _ => MarkerValue::NotNumber,
                    },
                    realizuje: opt_str(m, "realizuje"),
                    matrix_param_id: opt_str(m, "matrixParamId"),
                })
                .collect()
        })
        .unwrap_or_default()
}

fn as_markers(owned: &[OwnedMarker]) -> Vec<CostMarker<'_>> {
    owned
        .iter()
        .map(|m| CostMarker {
            cel: m.cel.as_deref(),
            wartosc: m.wartosc,
            realizuje: m.realizuje.as_deref(),
            matrix_param_id: m.matrix_param_id.as_deref(),
        })
        .collect()
}

#[test]
fn vectors_constants_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let c = &root["constants"];
    let epochs: Vec<(String, u32)> = c["EPOCH_BY_NAME"]
        .as_object()
        .map(|m| {
            m.iter()
                .map(|(k, v)| (k.clone(), v.as_u64().unwrap() as u32))
                .collect()
        })
        .unwrap();
    let mut rust_epochs: Vec<(String, u32)> = EPOCH_BY_NAME
        .iter()
        .map(|(k, v)| (k.to_string(), *v))
        .collect();
    let mut want = epochs.clone();
    rust_epochs.sort();
    want.sort();
    assert_eq!(rust_epochs, want, "EPOCH_BY_NAME");
    assert_eq!(
        RECRUIT_UNITS_PER_TURN as u64,
        c["RECRUIT_UNITS_PER_TURN"].as_u64().unwrap()
    );
    assert!(
        same_num(default_unit_cost(), dec(&c["DEFAULT_UNIT_COST"])),
        "DEFAULT_UNIT_COST"
    );
    assert!(
        same_num(
            GLOBAL_BUILDING_PROD_MULT,
            dec(&c["GLOBAL_BUILDING_PROD_MULT"])
        ),
        "GLOBAL_BUILDING_PROD_MULT"
    );
    for (key, value) in c["KOSZT_BUDYNKOW_PACE"].as_object().unwrap() {
        let got = building_cost_pace_multiplier(PaceInput::Key(key));
        assert!(same_num(got, dec(value)), "KOSZT_BUDYNKOW_PACE[{key}]");
    }
}

#[test]
fn vectors_item_cost_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let data = load_data(&root);
    let cases = root["itemCost"].as_array().unwrap();
    assert!(
        cases.len() >= 900,
        "za malo przypadkow itemCost: {}",
        cases.len()
    );
    for c in cases {
        let got = item_cost(
            kind(c["kind"].as_str().unwrap()),
            c["id"].as_str().unwrap(),
            &data,
            dec(&c["level"]),
        );
        let want = dec(&c["cost"]);
        assert!(
            same_num(got, want),
            "itemCost {} {} level={}: {got} != {want}",
            c["kind"],
            c["id"],
            c["level"]
        );
    }
}

#[test]
fn vectors_building_level_for_epoch_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let cases = root["buildingLevel"].as_array().unwrap();
    assert!(cases.len() >= 1000);
    for c in cases {
        let gate_owned: Option<Vec<(String, String)>> = if c["gateAbsent"].as_bool() == Some(true) {
            None
        } else {
            c["gate"].as_array().map(|pairs| {
                pairs
                    .iter()
                    .map(|p| {
                        (
                            p[0].as_str().unwrap().to_string(),
                            p[1].as_str().unwrap().to_string(),
                        )
                    })
                    .collect()
            })
        };
        let unlocked: Option<HashSet<String>> = c["unlocked"]
            .as_array()
            .map(|xs| xs.iter().map(|x| x.as_str().unwrap().to_string()).collect());
        let got = building_level_for_epoch(
            dec(&c["epoka"]),
            dec(&c["city"]),
            dec(&c["maks"]),
            gate_owned.as_deref(),
            unlocked.as_ref(),
        );
        let want = dec(&c["level"]);
        assert!(
            same_num(got, want),
            "buildingLevelForEpoch {c}: {got} != {want}"
        );
    }
}

#[test]
fn vectors_building_production_items_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let data = load_data(&root);
    let cases = root["buildingItems"].as_array().unwrap();
    assert!(cases.len() >= 300);
    for c in cases {
        let owned = owned_markers(&c["markers"]);
        let markers = as_markers(&owned);
        let pace_owned: Option<PaceInput<'_>> = match &c["pace"] {
            Value::Null => None,
            v if v.get("key").is_some() => Some(PaceInput::Key(v["key"].as_str().unwrap())),
            v => Some(PaceInput::Multiplier(dec(&v["mult"]))),
        };
        let got = building_production_item(
            c["id"].as_str().unwrap(),
            &data,
            dec(&c["level"]),
            &markers,
            pace_owned,
            c["owner"].as_i64().unwrap(),
            difficulty(c["difficulty"].as_str().unwrap()),
        );
        match (&c["item"], got) {
            (Value::Null, None) => {}
            (want, Some(item)) => {
                assert_eq!(item.kind, ProductionKind::Budynek, "{c}");
                assert_eq!(item.id, want["id"].as_str().unwrap(), "{c}");
                assert_eq!(
                    item.nazwa,
                    want["nazwa"].as_str().unwrap_or(&item.nazwa),
                    "{c}"
                );
                assert!(
                    same_num(item.koszt, dec(&want["koszt"])),
                    "buildingProductionItem {c}: {} != {}",
                    item.koszt,
                    dec(&want["koszt"])
                );
            }
            (want, got) => panic!("buildingProductionItem {c}: web={want} rust={got:?}"),
        }
    }
}

#[test]
fn vectors_unit_production_items_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let data = load_data(&root);
    let cases = root["unitItems"].as_array().unwrap();
    assert!(cases.len() >= 500);
    for c in cases {
        let owned = owned_markers(&c["markers"]);
        let markers = as_markers(&owned);
        let pace_owned: Option<UnitCostPace<'_>> = match &c["pace"] {
            Value::Null => None,
            v if v.get("key").is_some() => Some(UnitCostPace::Key(v["key"].as_str().unwrap())),
            v => Some(UnitCostPace::Multiplier(dec(&v["mult"]))),
        };
        let got = unit_production_item(
            c["id"].as_str().unwrap(),
            &data,
            &markers,
            pace_owned,
            c["owner"].as_i64().unwrap(),
            difficulty(c["difficulty"].as_str().unwrap()),
        );
        match (&c["item"], got) {
            (Value::Null, None) => {}
            (want, Some(item)) => {
                assert_eq!(item.kind, ProductionKind::Jednostka, "{c}");
                assert_eq!(item.id, want["id"].as_str().unwrap(), "{c}");
                assert!(
                    same_num(item.koszt, dec(&want["koszt"])),
                    "unitProductionItem {c}: {} != {}",
                    item.koszt,
                    dec(&want["koszt"])
                );
            }
            (want, got) => panic!("unitProductionItem {c}: web={want} rust={got:?}"),
        }
    }
}

#[test]
fn vectors_location_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    for c in root["location"].as_array().unwrap() {
        let lok = c["lokalizacja"].as_str();
        let cap = c["isCapital"].as_bool();
        assert_eq!(
            building_location_allowed(lok, cap),
            c["allowed"].as_bool().unwrap(),
            "{c}"
        );
    }
}

#[test]
fn vectors_stock_shortfall_label_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let cases = root["stock"].as_array().unwrap();
    assert!(cases.len() >= 100);
    for c in cases {
        let stock_owned: Option<BTreeMap<String, f64>> = c["stock"]
            .as_object()
            .map(|m| m.iter().map(|(k, v)| (k.clone(), dec(v))).collect());
        let surowiec = c["surowiec"].as_str();
        let got = unit_stock_shortfall_label(surowiec, stock_owned.as_ref());
        match &c["label"] {
            Value::Null => assert_eq!(got, None, "{c}"),
            v => assert_eq!(got.as_deref(), v.as_str(), "{c}"),
        }
        // empire_stock_has dla klucza ASCII (zgodnosc z web `empireStockHas`).
        if let Some(stock) = stock_owned.as_ref() {
            for key in ["braz", "zelazo", "drewno"] {
                let want = stock.get(key).copied().unwrap_or(0.0) > 0.0;
                assert_eq!(empire_stock_has(Some(stock), key), want);
            }
        }
    }
}

#[test]
fn vectors_strip_diacritics_match_web() {
    let root: Value = serde_json::from_str(PROD_JSON).unwrap();
    let cases = root["strip"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for c in cases {
        let input = c["input"].as_str().unwrap();
        assert_eq!(
            strip_diacritics(input),
            c["output"].as_str().unwrap(),
            "stripDiacritics({input:?})"
        );
    }
}

// ---------------------------------------------------------------------------
// unitCostFromDef / DEFAULT_UNIT_COST / DEFAULT_COST_BY_ROLE dla trzech wariantow miasto-params:
// realny, brak kluczy (literalne fallbacki web), inne wartosci (w tym 0 i null).
// ---------------------------------------------------------------------------

const DEFAULTS_REALNY: &str = include_str!("p6_8a_vectors/defaults-realny.json");
const DEFAULTS_BRAK_ROL: &str = include_str!("p6_8a_vectors/defaults-brak-rol.json");
const DEFAULTS_INNE: &str = include_str!("p6_8a_vectors/defaults-inne-wartosci.json");

fn unit_row_from(v: &Value) -> UnitCostRow {
    UnitCostRow {
        jednostka: v["Jednostka"].as_str().unwrap().to_string(),
        epoka: opt_str(v, "Epoka"),
        pieniadz_koszt: opt_num(v, "Pieniądz (koszt)"),
        super_jednostka: opt_str(v, "Super-jednostka"),
        rola: opt_str(v, "Rola (linia)"),
        surowiec: opt_str(v, "Surowiec"),
    }
}

#[test]
fn vectors_unit_cost_defaults_match_web_for_all_variants() {
    use civ_engine::domain::production_units::{
        default_cost_by_role_in, default_unit_cost_in, unit_cost_from_def_in,
    };
    let mut total = 0usize;
    for (name, text) in [
        ("realny", DEFAULTS_REALNY),
        ("brak-rol", DEFAULTS_BRAK_ROL),
        ("inne-wartosci", DEFAULTS_INNE),
    ] {
        let root = parse_value(text);
        let params = root["miasto"].clone();
        assert!(
            same_num(default_unit_cost_in(&params), dec(&root["defaultUnitCost"])),
            "{name}: DEFAULT_UNIT_COST"
        );
        for c in root["cases"].as_array().unwrap() {
            let row = unit_row_from(&c["unit"]);
            let got = unit_cost_from_def_in(&row, &params);
            let want = dec(&c["cost"]);
            assert!(
                same_num(got, want),
                "{name}: unitCostFromDef {} = {got} != {want}",
                row.jednostka
            );
            total += 1;
        }
        // Mapowanie rol (klucz wrecz obejmuje obie pisownie; Nieznana = brak wpisu).
        assert_eq!(
            default_cost_by_role_in(&params, "Wręcz"),
            default_cost_by_role_in(&params, "Wrecz"),
            "{name}: alias"
        );
        assert_eq!(
            default_cost_by_role_in(&params, "Nieznana"),
            None,
            "{name}: rola nieznana"
        );
    }
    assert!(total >= 250, "za malo przypadkow defaults: {total}");
}

fn parse_value(s: &str) -> Value {
    serde_json::from_str(s).expect("wektor JSON")
}
