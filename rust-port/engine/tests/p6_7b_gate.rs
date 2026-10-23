//! P6.7B - `building-resource-gate.ts`, czesc bramek: etykiety surowcow, zloza, bramka budowy i runtime,
//! punkt staly aktywnych budynkow, prerekwizyty miasta, dostep wodny, Mennica (wejscie z `zloto-access.ts`).
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56); domkniecia wstrzykniete (resolver zlota, `isSuperseded`)
//! odtwarzaja zapisane wyniki i sprawdzaja argumenty wywolan. Oczekiwania wylacznie z `gate.json`.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::cell::RefCell;

use civ_engine::data::derived::BuildingGatePrereqValue;
use civ_engine::domain::building_costs::p6_7b::{
    access_only_resource_labels, building_required_active_labels, building_resource_gate_met,
    building_runtime_gate_met, city_building_prereq, city_building_prereq_met,
    deposit_runtime_gated_building_ids, empire_resource_label_satisfied,
    filter_runtime_active_built_ids, has_deposit_runtime_gate, is_access_only_resource_label,
    is_water_access_building, mennica_zloto_drain_per_turn, missing_runtime_resource_labels,
    owner_can_feed_mennica, PrereqBuilding,
};
use common::*;
use serde_json::{json, Value};

fn data() -> Value {
    load("gate.json")
}

fn prereq_value(v: &Value) -> Option<BuildingGatePrereqValue> {
    match v {
        Value::String(s) => Some(BuildingGatePrereqValue::One(s.clone())),
        Value::Array(a) => Some(BuildingGatePrereqValue::Many(a.iter().map(text).collect())),
        _ => None,
    }
}

#[test]
fn constants_match_running_web() {
    let d = data();
    let c = &d["constants"];
    assert_eq!(
        deposit_runtime_gated_building_ids()
            .into_iter()
            .map(str::to_string)
            .collect::<Vec<_>>(),
        strings(&c["depositIds"]),
        "DEPOSIT_RUNTIME_GATED_BUILDING_IDS"
    );
    for pair in arr(c, "prereq") {
        let id = text(&pair[0]);
        let want = prereq_value(&pair[1]).expect("prerekwizyt");
        assert_eq!(
            city_building_prereq(&id),
            Some(&want),
            "CITY_BUILDING_PREREQ[{id}]"
        );
    }
    let water = strings(&c["water"]);
    for id in &water {
        assert!(is_water_access_building(id), "WATER_ACCESS {id}");
    }
    assert!(!is_water_access_building("swiatynia"));
    assert_bits(
        "MENNICA_ZLOTO_DRAIN_PER_TURN",
        mennica_zloto_drain_per_turn(),
        num(&c["mennicaDrain"]),
    );
    assert_bits(
        "MENNICA re-eksport",
        mennica_zloto_drain_per_turn(),
        num(&c["mennicaDrainReexport"]),
    );
    assert_eq!(
        access_only_resource_labels().len() as u64,
        c["accessOnlySize"].as_u64().expect("size")
    );
}

#[test]
fn required_active_labels_match_running_web() {
    let d = data();
    let cases = arr(&d, "required");
    assert!(cases.len() > 1000, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let b = gate_building(&c["b"]);
        assert_eq!(
            building_required_active_labels(&b),
            strings(&c["out"]),
            "required #{i} {b:?}"
        );
    }
}

#[test]
fn label_satisfied_matches_running_web() {
    let d = data();
    let cases = arr(&d, "labelSatisfied");
    assert!(cases.len() > 3000, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let built = opt_strings(&c["built"]);
        let stock = opt_stock_rec(&c["stock"]);
        let active = opt_strings(&c["active"]);
        let bid = opt_text(&c["bid"]);
        assert_eq!(
            empire_resource_label_satisfied(
                &text(&c["label"]),
                active.as_deref(),
                built.as_deref(),
                stock.as_ref(),
                bid.as_deref(),
            ),
            c["out"].as_bool().expect("out"),
            "labelSatisfied #{i} {}",
            c["label"]
        );
    }
}

#[test]
fn access_only_labels_match_running_web() {
    let d = data();
    for c in arr(&d, "accessOnly") {
        assert_eq!(
            is_access_only_resource_label(&text(&c["label"])),
            c["out"].as_bool().expect("out")
        );
    }
}

#[test]
fn resource_gate_matches_running_web() {
    let d = data();
    let cases = arr(&d, "resourceGate");
    assert!(cases.len() >= 2000);
    let mut passed = 0;
    for (i, c) in cases.iter().enumerate() {
        let b = gate_building(&c["b"]);
        let built = opt_strings(&c["built"]);
        let stock = opt_stock_rec(&c["stock"]);
        let active = opt_strings(&c["active"]);
        let got =
            building_resource_gate_met(&b, active.as_deref(), built.as_deref(), stock.as_ref());
        assert_eq!(got, c["out"].as_bool().expect("out"), "resourceGate #{i}");
        passed += usize::from(got);
    }
    assert!(
        passed > 300 && passed < cases.len(),
        "zbyt jednostronne dane"
    );
}

#[test]
fn has_deposit_runtime_gate_matches_running_web() {
    let d = data();
    let mut gated = 0;
    for c in arr(&d, "hasRuntimeGate") {
        let id = text(&c["id"]);
        let want = c["out"].as_bool().expect("out");
        assert_eq!(has_deposit_runtime_gate(&id), want, "hasRuntimeGate {id}");
        gated += usize::from(want);
    }
    assert!(gated >= 5, "za malo budynkow z bramka runtime");
}

#[test]
fn runtime_gate_matches_running_web() {
    let d = data();
    let table = &d["resolverTable"];
    let cases = arr(&d, "runtimeGate");
    assert!(cases.len() >= 1800);
    for (i, c) in cases.iter().enumerate() {
        let b = gate_building(&c["b"]);
        let rt = strings(&c["rtBuilt"]);
        let stock = opt_stock_rec(&c["stock"]);
        let active = opt_strings(&c["active"]);
        let got = with_options(&c["opt"], table, |options| {
            building_runtime_gate_met(&b, active.as_deref(), &rt, stock.as_ref(), options)
        });
        assert_eq!(got, c["out"].as_bool().expect("out"), "runtimeGate #{i}");
    }
}

#[test]
fn missing_runtime_labels_match_running_web() {
    let d = data();
    let table = &d["resolverTable"];
    let cases = arr(&d, "missingLabels");
    assert!(cases.len() >= 1200);
    for (i, c) in cases.iter().enumerate() {
        let b = gate_building(&c["b"]);
        let rt = strings(&c["rtBuilt"]);
        let stock = opt_stock_rec(&c["stock"]);
        let got = with_options(&c["opt"], table, |options| {
            missing_runtime_resource_labels(&b, &rt, stock.as_ref(), options)
        });
        assert_eq!(got, strings(&c["out"]), "missingLabels #{i}");
    }
}

#[test]
fn filter_runtime_active_built_ids_matches_running_web() {
    let d = data();
    let table = &d["resolverTable"];
    let cases = arr(&d, "filter");
    assert!(cases.len() >= 900);
    let mut shrunk = 0;
    for (i, c) in cases.iter().enumerate() {
        let built = strings(&c["built"]);
        let stock = opt_stock_rec(&c["stock"]);
        let got = with_options(&c["opt"], table, |options| {
            filter_runtime_active_built_ids(
                &built,
                &["Drewno".to_string()],
                stock.as_ref(),
                options,
            )
        });
        let want = strings(&c["out"]);
        assert_eq!(got, want, "filter #{i}");
        shrunk += usize::from(want.len() < built.len());
    }
    assert!(shrunk > 100, "za malo przypadkow odfiltrowania: {shrunk}");
}

#[test]
fn filter_runtime_active_built_ids_varied_labels_matches_running_web() {
    // Drugi parametr (activeLabels) bywa rozny; web go nie czyta - wektor to potwierdza z uruchomionego weba.
    let d = data();
    let table = &d["resolverTable"];
    let cases = arr(&d, "filterLabels");
    assert!(cases.len() >= 500);
    let mut distinct_labels = std::collections::BTreeSet::new();
    for (i, c) in cases.iter().enumerate() {
        let built = strings(&c["built"]);
        let labels = strings(&c["labels"]);
        distinct_labels.insert(labels.clone());
        let stock = opt_stock_rec(&c["stock"]);
        let got = with_options(&c["opt"], table, |options| {
            filter_runtime_active_built_ids(&built, &labels, stock.as_ref(), options)
        });
        assert_eq!(got, strings(&c["out"]), "filterLabels #{i}");
    }
    assert!(distinct_labels.len() > 20, "za malo roznych list etykiet");
}

#[test]
fn city_building_prereq_met_matches_running_web() {
    let d = data();
    let cases = arr(&d, "prereq");
    assert!(cases.len() >= 1500);
    let mut real = 0;
    let mut met = 0;
    for (i, c) in cases.iter().enumerate() {
        let prereq = prereq_value(&c["prereq"]);
        let built = strings(&c["built"]);
        let buildings = prereq_buildings(&c["buildings"]);
        let expected_calls = arr(c, "calls");
        let cursor = RefCell::new(0usize);
        let is_superseded = |id: &str, bl: &[String], bs: &[PrereqBuilding]| -> bool {
            let mut pos = cursor.borrow_mut();
            let call = expected_calls
                .get(*pos)
                .unwrap_or_else(|| panic!("prereq #{i}: nadmiarowe wywolanie isSuperseded({id})"));
            *pos += 1;
            assert_eq!(id, text(&call["id"]), "prereq #{i}: id");
            assert_eq!(bl.to_vec(), strings(&call["built"]), "prereq #{i}: built");
            assert_eq!(
                bs.to_vec(),
                prereq_buildings(&call["buildings"]),
                "prereq #{i}: buildings"
            );
            call["out"].as_bool().expect("out")
        };
        let got = city_building_prereq_met(prereq.as_ref(), &built, &buildings, &is_superseded);
        assert_eq!(
            *cursor.borrow(),
            expected_calls.len(),
            "prereq #{i}: liczba wywolan"
        );
        let want = c["out"].as_bool().expect("out");
        assert_eq!(got, want, "prereq #{i}");
        real += usize::from(c.get("real").is_some());
        met += usize::from(want);
    }
    // Wektor obejmuje budynki z bramka zloza; kazdy ma te sama liczbe wariantow prereq i istnieje w buildings.json.
    let mut per_id: std::collections::BTreeMap<String, usize> = std::collections::BTreeMap::new();
    for c in cases {
        if let Some(id) = c.get("real") {
            *per_id.entry(text(id)).or_default() += 1;
        }
    }
    let p = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("data")
        .join("buildings.json");
    let v: Value =
        serde_json::from_str(&std::fs::read_to_string(&p).expect("buildings.json")).expect("JSON");
    let data_ids: std::collections::BTreeSet<String> = v
        .as_array()
        .expect("tablica")
        .iter()
        .map(|b| b["id"].as_str().expect("id").to_string())
        .collect();
    assert_eq!(real, per_id.values().sum::<usize>());
    assert!(!per_id.is_empty());
    for id in per_id.keys() {
        assert!(data_ids.contains(id), "budynek {id} spoza buildings.json");
    }
    let counts: std::collections::BTreeSet<usize> = per_id.values().copied().collect();
    assert_eq!(
        counts.len(),
        1,
        "rowna liczba wariantow na budynek: {per_id:?}"
    );
    assert!(met > 100 && met < cases.len(), "zbyt jednostronne dane");
}

#[test]
fn owner_can_feed_mennica_matches_running_web() {
    let d = data();
    let cases = arr(&d, "mennica");
    assert!(cases.len() >= 30);
    for (i, c) in cases.iter().enumerate() {
        let stock = opt_stock_rec(&c["stock"]);
        let grace = c["grace"].as_bool();
        assert_eq!(
            owner_can_feed_mennica(stock.as_ref(), grace.unwrap_or(false)),
            c["out"].as_bool().expect("out"),
            "mennica #{i} {}",
            json!(c["stock"])
        );
    }
}
