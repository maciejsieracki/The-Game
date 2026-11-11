//! R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1 (runda 2, partia (a)): wektory z URUCHOMIONEGO weba
//! (`gra/src/game/ai-resource-needs.ts` `detectOwnerResourceNeeds`, origin/main f9c6300c6) dla
//! `ai_resource_needs::detect_owner_resource_needs`.
//! Generator: tests/p6_repin_ai_zakup_needs_vectors/gen-needs-vectors.mjs (Node 22,
//! --experimental-transform-types, register.mjs). Katalogi lookupow ponizej MUSZA byc zgodne z generatorem.

use civ_engine::domain::ai_resource_needs::{
    detect_owner_resource_needs, GoodsEntry, OwnerResourceNeedsInput,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ai_zakup_needs_vectors/needs-vectors.json");

/// Lustro `BUILDING_KOSZT` z generatora (surowe `koszt_surowce` w kolejnosci wstawiania JS;
/// `None` = brak budynku).
fn building_koszt(id: &str) -> Option<Vec<(String, Option<f64>)>> {
    let entries: &[(&str, f64)] = match id {
        "bud_a" => &[("ceramika", 3.0), ("drewno", 2.0)],
        "bud_b" => &[("kamien", 1.0)],
        "bud_c" => &[("zelazo", 4.0), ("miedz", 0.0)],
        "bud_d" => &[("wino", 0.4), ("sol", 7.0)],
        _ => return None,
    };
    Some(
        entries
            .iter()
            .map(|(k, v)| (k.to_string(), Some(*v)))
            .collect(),
    )
}

/// Lustro `UNIT_KOSZT` z generatora (kolejnosc wstawiania JS).
fn unit_koszt(id: &str) -> Option<Vec<(String, f64)>> {
    let entries: &[(&str, f64)] = match id {
        "u_a" => &[("zelazo", 5.0), ("wino", 2.0)],
        "u_b" => &[],
        "u_c" => &[("miedz", 9.0), ("ceramika", 1.0)],
        _ => return None,
    };
    Some(entries.iter().map(|(k, v)| (k.to_string(), *v)).collect())
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|s| s.as_str().expect("tekst").to_string())
        .collect()
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("needs-vectors.json parses")
}

#[test]
fn needs_vectors_match_web() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 248, "za malo wektorow: {}", cases.len());
    let mut failures = Vec::new();
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let i = &c["input"];
        let goods: Vec<GoodsEntry> = i["goods"]
            .as_array()
            .unwrap()
            .iter()
            .map(|g| GoodsEntry {
                key: g["key"].as_str().unwrap().to_string(),
                ilosc: g["ilosc"].as_f64(),
            })
            .collect();
        let priced = strings(&i["pricedKeys"]);
        let bids = strings(&i["queuedBuildingIds"]);
        let uids = strings(&i["queuedUnitTypeIds"]);
        let upkeep: Vec<(String, f64)> = i["upkeep"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_str().unwrap().to_string(), p[1].as_f64().unwrap()))
            .collect();
        let building_lookup = |bid: &str| building_koszt(bid);
        let unit_lookup = |uid: &str| unit_koszt(uid);
        let got = detect_owner_resource_needs(&OwnerResourceNeedsInput {
            goods: &goods,
            priced_keys: &priced,
            pakiet_wielkosc: i["pakiet"].as_f64().unwrap(),
            queued_building_ids: &bids,
            lookup_building_koszt_surowce: &building_lookup,
            queued_unit_type_ids: &uids,
            lookup_unit_stock_cost: &unit_lookup,
            food_reserve: i["foodReserve"].as_f64(),
            food_urgent_threshold: i["foodUrgentThreshold"].as_f64(),
            upkeep_demand: &upkeep,
        });
        let exp_deficit = strings(&c["expected"]["deficitKeys"]);
        let exp_urgent = strings(&c["expected"]["urgentKeys"]);
        let exp_needs = strings(&c["expected"]["needsResource"]);
        let got_needs: Vec<String> = got
            .needs_resource
            .iter()
            .filter(|(_, flag)| **flag)
            .map(|(k, _)| k.clone())
            .collect();
        let mut got_needs_sorted = got_needs.clone();
        got_needs_sorted.sort();
        let mut exp_needs_sorted = exp_needs.clone();
        exp_needs_sorted.sort();
        if got.deficit_keys != exp_deficit
            || got.urgent_keys != exp_urgent
            || got_needs_sorted != exp_needs_sorted
        {
            failures.push(format!(
                "{id}: deficit {:?} vs {:?}; urgent {:?} vs {:?}; needs {:?} vs {:?}",
                got.deficit_keys,
                exp_deficit,
                got.urgent_keys,
                exp_urgent,
                got_needs_sorted,
                exp_needs_sorted
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "rozjazd z webem ({}):\n{}",
        failures.len(),
        failures.join("\n")
    );
}

#[test]
fn zywnosc_pod_progiem_dodaje_klucz_i_urgent() {
    let goods: Vec<GoodsEntry> = Vec::new();
    let priced: Vec<String> = Vec::new();
    let bids: Vec<String> = Vec::new();
    let uids: Vec<String> = Vec::new();
    let upkeep: Vec<(String, f64)> = Vec::new();
    let b = |_: &str| None;
    let u = |_: &str| None;
    let got = detect_owner_resource_needs(&OwnerResourceNeedsInput {
        goods: &goods,
        priced_keys: &priced,
        pakiet_wielkosc: 10.0,
        queued_building_ids: &bids,
        lookup_building_koszt_surowce: &b,
        queued_unit_type_ids: &uids,
        lookup_unit_stock_cost: &u,
        food_reserve: Some(7.0),
        food_urgent_threshold: None,
        upkeep_demand: &upkeep,
    });
    assert_eq!(got.deficit_keys, vec!["zywnosc".to_string()]);
    assert_eq!(got.urgent_keys, vec!["zywnosc".to_string()]);
    assert_eq!(got.needs_resource.get("zywnosc"), Some(&true));
}
