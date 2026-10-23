//! P6.7B - `building-cost-tempo.ts` i koszty z `building-stock-cost.ts`: tempo kosztow, mnozniki epok,
//! koszt surowcowy budynku i jednostki, brak/dostepnosc/pobor z jednego magazynu, etykiety.
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z
//! `tests/p6_7b_vectors/cost.json`. Testy ksztaltu tabel (bez pinow wartosci) sa w `p6_7b_tables.rs`.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::domain::building_costs::p6_7b::{
    apply_building_cost_pace, building_cost_pace_multiplier, building_era_cost_multiplier,
    building_stock_cost, can_afford_building_stock, deduct_building_stock_cost,
    empire_stock_resource_keys, epoch_cost_multiplier, missing_stock_for, mount_horse_exempt_unit,
    mount_unit_horse_stock_cost, mount_unit_horse_stock_key, scale_cost_by_epoch,
    stock_resource_label, stock_resource_labels, unit_requires_mount_horse_stock, unit_stock_cost,
    BuildingStockSource, PaceInput, UnitStockCostSource,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("cost.json")
}

#[test]
fn constants_match_running_web() {
    let d = data();
    let c = &d["constants"];
    for pair in arr(c, "pace") {
        let key = text(&pair[0]);
        assert_bits(
            &format!("mnoznik tempa {key}"),
            building_cost_pace_multiplier(PaceInput::Key(&key)),
            num(&pair[1]),
        );
    }
    assert_bits(
        "koszt koni",
        mount_unit_horse_stock_cost(),
        num(&c["mountCost"]),
    );
    assert_eq!(mount_unit_horse_stock_key(), text(&c["mountKey"]));
    assert_eq!(mount_horse_exempt_unit(), text(&c["mountExempt"]));
    let labels: Vec<(String, String)> = stock_resource_labels()
        .into_iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();
    let want: Vec<(String, String)> = arr(c, "labels")
        .iter()
        .map(|p| (text(&p[0]), text(&p[1])))
        .collect();
    assert_eq!(labels, want, "STOCK_RESOURCE_LABEL (kolejnosc i tresc)");
    assert_eq!(
        empire_stock_resource_keys().to_vec(),
        strings(&c["empireKeys"]),
        "EMPIRE_STOCK_RESOURCE_KEYS"
    );
}

fn pace_input(v: &Value) -> PaceInputOwned {
    if let Some(k) = v["k"].as_str() {
        PaceInputOwned::Key(k.to_string())
    } else {
        PaceInputOwned::Num(num(&v["n"]))
    }
}

enum PaceInputOwned {
    Key(String),
    Num(f64),
}

#[test]
fn building_cost_pace_matches_running_web() {
    let d = data();
    let cases = arr(&d, "pace");
    assert!(cases.len() > 1500, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let pace = pace_input(&c["pace"]);
        let got = match &pace {
            PaceInputOwned::Key(k) => apply_building_cost_pace(num(&c["base"]), PaceInput::Key(k)),
            PaceInputOwned::Num(n) => {
                apply_building_cost_pace(num(&c["base"]), PaceInput::Multiplier(*n))
            }
        };
        assert_bits(&format!("pace #{i}"), got, num(&c["out"]));
    }
}

#[test]
fn epoch_cost_multiplier_matches_running_web() {
    let d = data();
    let cases = arr(&d, "epochMult");
    assert!(cases.len() > 90, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let epoch = epoch_from(&c["epoch"]);
        assert_bits(
            &format!("epochMult #{i} {epoch:?}"),
            epoch_cost_multiplier(&epoch),
            num(&c["out"]),
        );
    }
}

#[test]
fn scale_cost_by_epoch_matches_running_web() {
    let d = data();
    let cases = arr(&d, "scaleCost");
    assert!(cases.len() > 2000, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let epoch = epoch_from(&c["epoch"]);
        assert_bits(
            &format!("scaleCost #{i} {} {epoch:?}", c["cost"]),
            scale_cost_by_epoch(num(&c["cost"]), &epoch),
            num(&c["out"]),
        );
    }
}

#[test]
fn building_era_cost_multiplier_matches_running_web() {
    let d = data();
    for (i, c) in arr(&d, "eraMult").iter().enumerate() {
        let era = opt_number_from(&c["epoka"]);
        assert_bits(
            &format!("eraMult #{i} {era:?}"),
            building_era_cost_multiplier(era),
            num(&c["out"]),
        );
    }
}

fn building_source(v: &Value) -> Option<BuildingStockSource> {
    if v.get("absent").is_some() {
        return None;
    }
    let koszt = v.get("koszt").and_then(|k| {
        if k["t"] == "r" {
            Some(
                k["v"]
                    .as_object()
                    .expect("koszt")
                    .iter()
                    .map(|(key, x)| (key.clone(), opt_number_from(x)))
                    .collect::<BTreeMap<_, _>>(),
            )
        } else {
            None
        }
    });
    Some(BuildingStockSource {
        epoka_wejscia: v.get("epoka").and_then(opt_number_from),
        koszt_surowce: koszt,
    })
}

#[test]
fn building_stock_cost_matches_running_web() {
    let d = data();
    let cases = arr(&d, "buildingStock");
    assert!(cases.len() > 700, "za malo przypadkow: {}", cases.len());
    let mut real = 0;
    for c in cases {
        let id = text(&c["id"]);
        let source = building_source(&c["building"]);
        let got = building_stock_cost(source.as_ref());
        assert_values(&format!("buildingStock {id}"), &rec_value(&got), &c["out"]);
        if c["real"] == true {
            real += 1;
        }
    }
    assert_eq!(real, 42, "wszystkie budynki z buildings.json");
}

#[test]
fn missing_can_afford_and_deduct_match_running_web() {
    let d = data();
    let cases = arr(&d, "stock");
    assert!(cases.len() >= 1500, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let have = opt_stock_rec(&c["have"]);
        let cost = stock_rec(&c["cost"]);
        assert_values(
            &format!("missing #{i}"),
            &rec_value(&missing_stock_for(have.as_ref(), &cost)),
            &c["missing"],
        );
        assert_eq!(
            can_afford_building_stock(have.as_ref(), &cost),
            c["can"].as_bool().expect("can"),
            "can #{i}"
        );
        assert_values(
            &format!("deduct #{i}"),
            &rec_value(&deduct_building_stock_cost(have.as_ref(), &cost)),
            &c["deduct"],
        );
    }
}

#[test]
fn deduct_does_not_mutate_inputs() {
    let have = BTreeMap::from([("drewno".to_string(), 5.0)]);
    let cost = BTreeMap::from([("drewno".to_string(), 3.0)]);
    let next = deduct_building_stock_cost(Some(&have), &cost);
    assert_eq!(next["drewno"], 2.0);
    assert_eq!(have["drewno"], 5.0);
    assert_eq!(cost["drewno"], 3.0);
}

#[test]
fn stock_resource_label_matches_running_web() {
    let d = data();
    for c in arr(&d, "labels") {
        let key = text(&c["key"]);
        assert_eq!(
            stock_resource_label(&key),
            text(&c["out"]),
            "etykieta {key}"
        );
    }
}

fn unit_source(v: &Value) -> Option<UnitStockCostSource> {
    if v.get("absent").is_some() {
        return None;
    }
    Some(UnitStockCostSource {
        jednostka: opt_text(&v["j"]),
        typ: opt_text(&v["typ"]),
        epoka: v.get("epoka").map_or(
            civ_engine::domain::building_costs::p6_7b::EpochInput::Other,
            epoch_from,
        ),
        surowiec: opt_text(&v["surowiec"]),
        surowiec_ilosc: v.get("ilosc").and_then(opt_number_from),
    })
}

#[test]
fn unit_stock_cost_matches_running_web() {
    let d = data();
    let cases = arr(&d, "units");
    assert!(cases.len() > 2500, "za malo przypadkow: {}", cases.len());
    let mut real = 0;
    let mut with_mount = 0;
    for c in cases {
        let id = text(&c["id"]);
        let unit = unit_source(&c["unit"]);
        assert_eq!(
            unit_requires_mount_horse_stock(unit.as_ref()),
            c["mount"].as_bool().expect("mount"),
            "mount {id}"
        );
        assert_values(
            &format!("unitStockCost {id}"),
            &rec_value(&unit_stock_cost(unit.as_ref())),
            &c["out"],
        );
        if c["real"] == true {
            real += 1;
        }
        if c["mount"] == true {
            with_mount += 1;
        }
    }
    assert_eq!(real, 75, "wszystkie jednostki z units.json");
    assert!(with_mount > 100, "za malo jednostek jezdnych: {with_mount}");
}

/// Jawnie NIE portowane (ZALOZENIE w dokumencie §4): web szuka w zwyklych obiektach JS, wiec klucz
/// z lancucha prototypow (`constructor`, `__proto__`, `toString`) trafia w metode `Object`. Wektor
/// zapisuje, co web robi; test utrwala zachowanie Rust (klucz spoza tabeli = brak wpisu).
#[test]
fn prototype_key_lookups_are_a_documented_divergence() {
    use civ_engine::domain::building_costs::p6_7b::{
        building_required_active_labels, city_building_prereq, has_deposit_runtime_gate,
        GateBuilding,
    };
    let d = data();
    let probes = arr(&d, "protoQuirk");
    assert_eq!(probes.len(), 8);
    for p in probes {
        let name = text(&p["name"]);
        let web = text(&p["web"]);
        match name.as_str() {
            "stockResourceLabel(constructor)" => {
                assert_eq!(web, "function");
                assert_eq!(stock_resource_label("constructor"), "constructor");
            }
            "stockResourceLabel(__proto__)" => {
                assert_eq!(web, "object");
                assert_eq!(stock_resource_label("__proto__"), "__proto__");
            }
            "stockResourceLabel(toString)" => {
                assert_eq!(web, "function");
                assert_eq!(stock_resource_label("toString"), "toString");
            }
            "applyBuildingCostPace(10,constructor)" => {
                // brak rozbieznosci: funkcja * liczba = NaN, jak nieznany klucz
                assert_eq!(web, "NaN");
                assert!(apply_building_cost_pace(10.0, PaceInput::Key("constructor")).is_nan());
            }
            "buildingRequiredActiveLabels(wym=constructor)" => {
                assert_eq!(web, "array:function");
                let b = GateBuilding {
                    id: "x".into(),
                    epoka_wejscia: Some(1.0),
                    wymagany_surowiec: Some("constructor".into()),
                };
                assert!(building_required_active_labels(&b).is_empty());
            }
            "buildingRequiredActiveLabels(id=constructor)" => {
                assert_eq!(web, "throws:TypeError");
                let b = GateBuilding {
                    id: "constructor".into(),
                    epoka_wejscia: Some(1.0),
                    wymagany_surowiec: None,
                };
                assert!(building_required_active_labels(&b).is_empty());
            }
            "CITY_BUILDING_PREREQ[constructor]" => {
                assert_eq!(web, "function");
                assert!(city_building_prereq("constructor").is_none());
            }
            "hasDepositRuntimeGate(constructor)" => {
                // brak rozbieznosci: web uzywa hasOwnProperty
                assert_eq!(web, "boolean");
                assert!(!has_deposit_runtime_gate("constructor"));
            }
            other => panic!("nieznana sonda {other}"),
        }
    }
}
