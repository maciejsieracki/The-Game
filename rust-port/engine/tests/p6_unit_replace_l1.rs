//! P6-UNIT-REPLACE-L1 (R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1): awanse piechoty (pole `Zastąp specjalnie`).
//!
//! Zrodlo prawdy: `gra/data/units.json` z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (read-only).
//! Wektory: `tests/p6_unit_replace_l1_vectors/infantry-promotion.json`, generowane przez
//! `tests/p6_unit_replace_l1_gen.mjs` (nie edytowac recznie).
//!
//! Sprawdzenia:
//! 1. Dane Rust `data/units.json` maja to samo pole `Typ` i `Zastąp specjalnie` co pin dla wszystkich
//!    75 jednostek (w tym 23 zrodla piechoty / 53 krawedzie awansow).
//! 2. Dla kazdej krawedzi awansu piechoty `available_replacements_for` (logika Rust) zwraca cel
//!    z pinu, gdy wszystkie bramki sa otwarte (epoka 3, koszary, wszystkie technologie z pinu,
//!    nacja celu jako nacja cywilizacji, zapas imperium nieblokujacy).

use civ_engine::domain::production_units::{
    available_replacements_for, AvailabilityContext, ReplaceAvailabilityCtx, UnitCostRow,
    UnitReplaceRow,
};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

const VECTORS: &str = include_str!("p6_unit_replace_l1_vectors/infantry-promotion.json");
const REAL_UNITS: &str = include_str!("../data/units.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const INFANTRY: [&str; 4] = ["Swordsman", "Spearman", "Falangite", "Offensive"];

fn opt_str(u: &Value, key: &str) -> Option<String> {
    u.get(key).and_then(Value::as_str).map(str::to_string)
}

fn to_row(u: &Value) -> UnitReplaceRow {
    UnitReplaceRow {
        cost: UnitCostRow {
            jednostka: u["Jednostka"].as_str().expect("Jednostka").to_string(),
            epoka: opt_str(u, "Epoka"),
            pieniadz_koszt: u.get("Pieniądz (koszt)").and_then(Value::as_f64),
            super_jednostka: opt_str(u, "Super-jednostka"),
            rola: opt_str(u, "Rola (linia)"),
            surowiec: opt_str(u, "Surowiec"),
        },
        typ: opt_str(u, "Typ"),
        nacja: opt_str(u, "Nacja"),
        tech: opt_str(u, "Tech"),
        w_zamian_za: opt_str(u, "W zamian za"),
        zastap_specjalnie: opt_str(u, "Zastąp specjalnie"),
    }
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory p6_unit_replace_l1")
}

fn pin_rows(v: &Value) -> Vec<Value> {
    v["rows"].as_array().expect("rows").clone()
}

fn is_infantry(typ: Option<&str>) -> bool {
    typ.is_some_and(|t| INFANTRY.contains(&t.trim()))
}

fn is_infantry_name(by_name: &BTreeMap<&str, &Value>, name: &str) -> bool {
    by_name
        .get(name)
        .is_some_and(|r| is_infantry(r["Typ"].as_str()))
}

#[test]
fn vectors_pin_header_and_counts() {
    let v = vectors();
    assert_eq!(v["pin"].as_str(), Some(PIN));
    let rows = pin_rows(&v);
    assert_eq!(rows.len(), 75, "liczba jednostek w pinie");
    let infantry = v["infantry"].as_array().expect("infantry");
    assert_eq!(infantry.len(), 23, "zrodla awansow piechoty");
    let edges: usize = infantry
        .iter()
        .map(|s| s["targets"].as_array().expect("targets").len())
        .sum();
    assert_eq!(edges, 53, "krawedzie awansow piechoty");
}

#[test]
fn rust_units_json_promotion_field_matches_pin() {
    let v = vectors();
    let real: Vec<Value> = serde_json::from_str(REAL_UNITS).expect("units.json");
    let pin = pin_rows(&v);
    assert_eq!(real.len(), pin.len(), "liczba jednostek Rust vs pin");

    for p in &pin {
        let name = p["Jednostka"].as_str().expect("Jednostka");
        let r = real
            .iter()
            .find(|r| r["Jednostka"].as_str() == Some(name))
            .unwrap_or_else(|| panic!("brak w Rust units.json: {name}"));
        assert_eq!(
            opt_str(r, "Typ"),
            opt_str(p, "Typ"),
            "Typ rozni sie od pinu: {name}"
        );
        assert_eq!(
            opt_str(r, "Zastąp specjalnie"),
            opt_str(p, "Zastąp specjalnie"),
            "Zastąp specjalnie rozni sie od pinu: {name}"
        );
    }
}

#[test]
fn infantry_promotion_targets_available_in_rust_logic() {
    let v = vectors();
    let pin = pin_rows(&v);
    let units: Vec<UnitReplaceRow> = pin.iter().map(to_row).collect();
    let techs: Vec<&str> = v["techs"]
        .as_array()
        .expect("techs")
        .iter()
        .map(|t| t.as_str().expect("tech"))
        .collect();
    let by_name: BTreeMap<&str, &Value> = pin
        .iter()
        .map(|u| (u["Jednostka"].as_str().expect("Jednostka"), u))
        .collect();
    let built: [&str; 1] = ["koszary"];

    let mut checked = 0usize;
    let mut cross_typ = 0usize;
    for src in v["infantry"].as_array().expect("infantry") {
        let source = src["source"].as_str().expect("source");
        let src_row = by_name[source];
        assert!(
            is_infantry(src_row["Typ"].as_str()),
            "zrodlo spoza piechoty: {source}"
        );

        for t in src["targets"].as_array().expect("targets") {
            let target = t.as_str().expect("target");
            let tgt_row = by_name
                .get(target)
                .unwrap_or_else(|| panic!("cel spoza pinu: {source} -> {target}"));
            assert!(
                is_infantry(tgt_row["Typ"].as_str()),
                "cel spoza piechoty: {target}"
            );
            if tgt_row["Typ"] != src_row["Typ"] {
                cross_typ += 1;
            }

            // Nacja celu jako nacja cywilizacji: bramka nacji przepuszcza cel bez blokady.
            let civ_nacja = opt_str(tgt_row, "Nacja").filter(|n| !n.trim().is_empty());
            let ctx = ReplaceAvailabilityCtx {
                epoch: 3.0,
                built_building_ids: &built,
                unlocked_techs: &techs,
                civ_key: None,
                civ_unit_nacja: civ_nacja.as_deref(),
                city_has_coast_or_river: true,
                show_stock_gated_units: true,
                alive_unit_type_names: &[],
                cost: AvailabilityContext::default(),
            };
            let got = available_replacements_for(source, &units, &[], &ctx);
            assert!(
                got.iter().any(|it| it.id == target),
                "cel z pinu nieosiagalny w available_replacements_for: {source} -> {target}; wynik={:?}",
                got.iter().map(|it| it.id.as_str()).collect::<Vec<_>>()
            );
            // Zbior wynikow piechoty: kazdy nadmiarowy wynik (nie-cel z pinu) musi pochodzic z
            // galezi A (ten sam Typ co zrodlo, web `availableReplacementsFor`); galezi B (pole
            // `Zastąp specjalnie`) nie wolno rozszerzac poza liste pinu.
            let expected: BTreeSet<&str> = src["targets"]
                .as_array()
                .expect("targets")
                .iter()
                .map(|x| x.as_str().expect("target"))
                .collect();
            for it in &got {
                let id = it.id.as_str();
                if expected.contains(id) || !is_infantry_name(&by_name, id) {
                    continue;
                }
                assert_eq!(
                    by_name[id]["Typ"].as_str(),
                    src_row["Typ"].as_str(),
                    "nadmiarowy cel {id} dla {source} spoza galezi A (inny Typ)"
                );
            }
            checked += 1;
        }
    }
    assert_eq!(checked, 53, "sprawdzone krawedzie");
    assert!(
        cross_typ > 0,
        "brak krawedzi miedzy Typ (test nie obejmuje galezi B)"
    );
}
