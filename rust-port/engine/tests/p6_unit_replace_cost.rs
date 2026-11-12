//! P6-UNIT-REPLACE-L3-KOSZT (dlug L-3, etap 4): koszt Pieniadza i max_hp po zamianie = pin 07d2fbd72.
//!
//! Wektory: `p6_unit_replace_cost_vectors/unit-replace-cost-vectors.json`, generowane przez
//! `gen-unit-replace-cost-vectors.mjs` (node wykonuje tekst pinu: unitMoneyCost, applyUnitCostPace,
//! applyDifficultyCostMultiplier, effectiveMaxHp, veteranCombatBonusFrac, unitHealth).
//!
//! Testy:
//! 1. `koszt_pieniadza_lancuch_zgodny_z_pinem` - port `unit_money_cost_web` na wektorach pinu
//!    (rabat cywilizacji, tempo, trudnosc, wlasciciel).
//! 2. `max_hp_zgodne_z_pinem` - `unit_health_value` (klucz `health`) + `replace_max_hp` na wektorach.
//! 3. `tabela_produkcyjna_koszt_i_hp_z_danych_pinu` - raport rozbieznosci DANYCH (units.json Rust vs pin):
//!    koszt bazowy i zdrowie. Rozbieznosci nie sa rozstrzygane tutaj (decyzja gameplay, zadanie 27).

use std::collections::BTreeMap;

use civ_engine::domain::building_costs::repin_b2::{unit_money_cost_web, CostMarker, MarkerValue};
use civ_engine::domain::recruitment::army_merge::UnitCostPace;
use civ_engine::domain::types::Difficulty;
use civ_engine::domain::unit_health::unit_health_value;
use civ_engine::domain::unit_replace_cost::{replace_max_hp, ReplaceUnitProgress};
use civ_engine::domain::unit_replace_defs::production_replace_defs_for_civ;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_unit_replace_cost_vectors/unit-replace-cost-vectors.json");

fn parse_vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory kosztu i HP parsuja sie")
}

fn same_f64(got: f64, expected: f64) -> bool {
    if expected == 0.0 {
        return got == 0.0;
    }
    got.to_bits() == expected.to_bits() || (got - expected).abs() < 1e-12
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn difficulty_of(key: &str) -> Difficulty {
    match key {
        "normal" => Difficulty::Normal,
        "easy" => Difficulty::Easy,
        "hard" => Difficulty::Hard,
        other => panic!("nieznana trudnosc w wektorze: {other}"),
    }
}

/// Tempo jak w web: napis = klucz, liczba = mnoznik, null = brak (`undefined`).
fn pace_of(v: &Value) -> Option<UnitCostPace<'_>> {
    match v {
        Value::Null => None,
        Value::String(s) => Some(UnitCostPace::Key(s.as_str())),
        Value::Number(n) => Some(UnitCostPace::Multiplier(n.as_f64().expect("mnoznik"))),
        other => panic!("nieoczekiwane tempo w wektorze: {other}"),
    }
}

fn marker_value(v: &Value) -> MarkerValue {
    match v.as_f64() {
        Some(n) => MarkerValue::Number(n),
        None => MarkerValue::NotNumber,
    }
}

/// Zestaw markerow z wektora -> `CostMarker` (rabat liczy kod Rust, nie helper testowy).
fn markers_of(set: &Value) -> Vec<CostMarker<'_>> {
    set.as_array()
        .expect("zestaw markerow")
        .iter()
        .map(|m| CostMarker {
            cel: m["cel"].as_str(),
            wartosc: marker_value(&m["wartosc"]),
            realizuje: m["realizuje"].as_str(),
            matrix_param_id: m["matrixParamId"].as_str(),
        })
        .collect()
}

#[test]
fn koszt_pieniadza_lancuch_zgodny_z_pinem() {
    let doc = parse_vectors();
    let sets = doc["markerSets"].as_object().expect("markerSets");
    let cases = doc["money"].as_array().expect("money");
    assert!(cases.len() >= 200, "wektory kosztu: {}", cases.len());
    let mut mismatches = Vec::new();
    for case in cases {
        let set_name = case["markers"].as_str().expect("markers");
        let markers = markers_of(&sets[set_name]);
        let unit = case["unit"].as_str().expect("unit");
        let base = num(&case["base"]);
        let owner = case["owner"].as_i64().expect("owner");
        let diff = difficulty_of(case["diff"].as_str().expect("diff"));
        let got = unit_money_cost_web(
            base,
            &markers,
            pace_of(&case["pace"]),
            owner,
            diff,
            Some(unit),
        );
        let expected = num(&case["out"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "unit={unit} base={base} markers={set_name} pace={} owner={owner} diff={diff:?}: got={got} expected={expected}",
                case["pace"]
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci z pinem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}

#[test]
fn max_hp_zgodne_z_pinem() {
    let doc = parse_vectors();
    let cases = doc["hp"].as_array().expect("hp");
    assert!(cases.len() >= 200, "wektory HP: {}", cases.len());
    let mut mismatches = Vec::new();
    for case in cases {
        let def = &case["def"];
        // Zdrowie bazowe liczone jak web unitHealth(def): klucz `health` przed `Health`.
        let base = unit_health_value(Some(def));
        let expected_base = num(&case["baseHealth"]);
        if !same_f64(base, expected_base) {
            mismatches.push(format!(
                "unit={} baseHealth: got={base} expected={expected_base}",
                case["unit"]
            ));
            continue;
        }
        let progress = ReplaceUnitProgress {
            parametry_bonus_proc: case["parametryBonusProc"].as_f64(),
            battles_survived: case["battlesSurvived"].as_f64(),
        };
        let got = replace_max_hp(base, progress);
        let expected = num(&case["out"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "unit={} progress={progress:?}: got={got} expected={expected}",
                case["unit"]
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci HP z pinem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}

#[test]
fn tabela_produkcyjna_koszt_i_hp_z_danych_pinu() {
    let doc = parse_vectors();
    let pin: BTreeMap<String, (Option<f64>, f64)> = doc["pinData"]
        .as_array()
        .expect("pinData")
        .iter()
        .map(|row| {
            (
                row["unit"].as_str().expect("unit").to_owned(),
                (row["base"].as_f64(), num(&row["baseHealth"])),
            )
        })
        .collect();
    // Bez markerow, tempo `niski`, trudnosc Normal: koszt tabeli = koszt bazowy po skali epoki.
    let table = production_replace_defs_for_civ("", "niski", Difficulty::Normal);
    let mut data_diff = Vec::new();
    for (unit, (pin_base, pin_health)) in &pin {
        let Some(def) = table.get(unit) else {
            data_diff.push(format!("{unit}: brak w units.json Rust"));
            continue;
        };
        if let Some(base) = pin_base {
            if !same_f64(def.money_cost, *base) {
                data_diff.push(format!("{unit}: koszt Rust={} pin={base}", def.money_cost));
            }
        }
        if !same_f64(def.max_hp, *pin_health) {
            data_diff.push(format!(
                "{unit}: health Rust={} pin={pin_health}",
                def.max_hp
            ));
        }
    }
    // Rozbieznosci to DANE (units.json Rust vs pin), nie port: wypisane, nie rozstrzygane.
    eprintln!(
        "ROZBIEZNOSCI DANYCH (koszt/health, {} pozycji):\n{}",
        data_diff.len(),
        data_diff.join("\n")
    );
    assert!(
        table.len() >= 70,
        "tabela produkcyjna: {} jednostek",
        table.len()
    );
}
