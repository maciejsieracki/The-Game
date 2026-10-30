//! REPIN-EKONOMIA-B2 (pin webu 91dc998a), partia B2a: `buildingWorkCost` (production.ts:555) z rabatem
//! markera `prod_koszt_budynku_proc`, `newestAvailableSameTypeUnit` i `epochNumber` (production.ts:190-226).
//!
//! Wektory: `tests/p6_repin_b2_vectors/*.json` z URUCHOMIONEGO weba @ 91dc998a
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/gen-repin-b2-vectors.mjs`).
//! Porownanie: liczby skonczone bitowo (z wyjatkiem zera, gdzie JSON gubi znak -0), NaN == NaN.

use civ_engine::domain::building_costs::p6_7b::PaceInput;
use civ_engine::domain::building_costs::repin_b2::{
    apply_cost_discount, apply_difficulty_cost_multiplier, building_work_cost_web,
    cost_multiplier_for_owner,
};
use civ_engine::domain::production_units::{
    epoch_number, newest_available_same_type_unit, UnitRow,
};
use civ_engine::domain::types::Difficulty;
use serde_json::Value;

const BUILDING_VECTORS: &str = include_str!("p6_repin_b2_vectors/building_work_cost.json");
const UNIT_VECTORS: &str = include_str!("p6_repin_b2_vectors/unit_newest.json");

fn parse_json(text: &str) -> Value {
    serde_json::from_str(text).expect("wektor musi byc poprawnym JSON-em")
}

/// Liczba z wektora: JSON number albo napis `NaN` / `Infinity` / `-Infinity` (koder z generatora).
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba w wektorze"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy w wektorze: {other}"),
        },
        other => panic!("oczekiwano liczby, jest: {other}"),
    }
}

fn same_f64(got: f64, expected: f64) -> bool {
    if expected.is_nan() {
        return got.is_nan();
    }
    if expected == 0.0 {
        return got == 0.0;
    }
    got.to_bits() == expected.to_bits()
}

fn difficulty_from_key(key: &str) -> Difficulty {
    match key {
        "easy" => Difficulty::Easy,
        "normal" => Difficulty::Normal,
        "hard" => Difficulty::Hard,
        other => panic!("nieznana trudnosc w wektorze: {other}"),
    }
}

/// web `civMatrixCostDiscount`: pierwszy marker o `matrixParamId`; niefinite / nie-liczba = brak (`None`).
fn matrix_discount_for(bonusy: &Value, parameter_id: &str) -> Option<f64> {
    let marker = bonusy
        .as_array()?
        .iter()
        .find(|b| b.get("matrixParamId").and_then(Value::as_str) == Some(parameter_id))?;
    let v = marker.get("wartosc")?.as_f64()?;
    v.is_finite().then_some(v)
}

#[test]
fn building_work_cost_matches_web_vectors() {
    let doc = parse_json(BUILDING_VECTORS);
    let variants = doc["bonusyVariants"].as_object().expect("bonusyVariants");
    let cases = doc["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 9000,
        "wektor musi miec pelna siatke (jest {})",
        cases.len()
    );
    let mut mismatches = Vec::new();
    for case in cases {
        let base = num(&case["base"]);
        let bonusy_name = case["bonusy"].as_str().expect("bonusy");
        let bonusy = &variants[bonusy_name];
        let matrix = matrix_discount_for(bonusy, "prod_koszt_budynku_proc");
        let pace_json = &case["pace"];
        let pace_key;
        let pace = match pace_json {
            Value::Null => None,
            Value::String(s) => {
                pace_key = s.clone();
                Some(PaceInput::Key(pace_key.as_str()))
            }
            Value::Number(n) => Some(PaceInput::Multiplier(n.as_f64().expect("pace"))),
            other => panic!("nieobslugiwany pace: {other}"),
        };
        let owner = case["owner"].as_i64().expect("owner");
        let diff = difficulty_from_key(case["diff"].as_str().expect("diff"));
        let got = building_work_cost_web(base, matrix, pace, owner, diff);
        let expected = num(&case["out"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "base={base} bonusy={bonusy_name} pace={pace_json} owner={owner} diff={diff:?}: got={got} expected={expected}"
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci z webem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}

#[test]
fn epoch_number_matches_web_vectors() {
    let doc = parse_json(UNIT_VECTORS);
    for case in doc["epochCases"].as_array().expect("epochCases") {
        let epoka = case["epoka"].as_str();
        let expected = case["out"].as_u64().expect("out") as u32;
        assert_eq!(epoch_number(epoka), expected, "epoka={:?}", epoka);
    }
}

#[test]
fn epoch_number_missing_and_unknown_default_to_stone() {
    assert_eq!(epoch_number(None), 1);
    assert_eq!(epoch_number(Some("")), 1);
    assert_eq!(epoch_number(Some("constructor")), 1);
    assert_eq!(
        epoch_number(Some("kamien")),
        1,
        "klucze sa dokladne (web EPOCH_BY_NAME)"
    );
    assert_eq!(epoch_number(Some("Brąz")), 2);
    assert_eq!(epoch_number(Some("Żelazo")), 3);
}

#[test]
fn newest_same_type_unit_matches_web_vectors() {
    let doc = parse_json(UNIT_VECTORS);
    let units_json = doc["units"].as_array().expect("units");
    // Wlasciciel napisow (UnitRow pozycjonuje &str).
    let owned: Vec<(String, Option<String>, Option<String>)> = units_json
        .iter()
        .map(|u| {
            (
                u["Jednostka"].as_str().expect("Jednostka").to_owned(),
                u.get("Typ").and_then(Value::as_str).map(str::to_owned),
                u.get("Epoka").and_then(Value::as_str).map(str::to_owned),
            )
        })
        .collect();
    let rows: Vec<UnitRow<'_>> = owned
        .iter()
        .map(|(j, t, e)| UnitRow {
            jednostka: j.as_str(),
            typ: t.as_deref(),
            epoka: e.as_deref(),
        })
        .collect();
    let mut checked = 0usize;
    for case in doc["cases"].as_array().expect("cases") {
        let current = case["current"].as_str().expect("current");
        let cands_owned: Vec<&str> = case["candidates"]
            .as_array()
            .expect("candidates")
            .iter()
            .map(|c| c.as_str().expect("candidate"))
            .collect();
        let got = newest_available_same_type_unit(current, &cands_owned, &rows);
        let expected = case["outIndex"].as_u64().map(|i| i as usize);
        assert_eq!(
            got, expected,
            "current={current} candidates={cands_owned:?}"
        );
        checked += 1;
    }
    assert_eq!(checked, 70, "liczba przypadkow wektora unit_newest.json");
}

#[test]
fn newest_same_type_unit_tie_keeps_first_in_units_order() {
    // A2 (Braz) i A4 (Zelazo) - inna epoka; E1/E2 (Braz) - remis, ale ponizej bieżącej epoki.
    // Remis wyzej epoki: dwie jednostki Zelazo w tym samym Typ - wygrywa pierwsza w units.
    let rows = [
        UnitRow {
            jednostka: "K1",
            typ: Some("Piechota"),
            epoka: Some("Kamien"),
        },
        UnitRow {
            jednostka: "Z1",
            typ: Some("Piechota"),
            epoka: Some("Zelazo"),
        },
        UnitRow {
            jednostka: "Z2",
            typ: Some("Piechota"),
            epoka: Some("Żelazo"),
        },
    ];
    assert_eq!(
        newest_available_same_type_unit("K1", &["Z1", "Z2"], &rows),
        Some(1),
        "remis epok: pierwsza w kolejnosci units"
    );
}

#[test]
fn newest_same_type_unit_trims_current_typ_like_web() {
    // web production.ts (newestAvailableSameTypeUnit): `currentTyp = (current?.Typ ?? '').trim()`.
    // Wektor unit_newest.json nie ma bieżącej jednostki z białymi znakami w Typ - ten test to domyka
    // (zweryfikowane na URUCHOMIONYM webie 91dc998a: wynik = "Y").
    let rows = [
        UnitRow {
            jednostka: "X",
            typ: Some(" Piechota "),
            epoka: Some("Kamien"),
        },
        UnitRow {
            jednostka: "Y",
            typ: Some("Piechota"),
            epoka: Some("Braz"),
        },
    ];
    assert_eq!(
        newest_available_same_type_unit("X", &["Y"], &rows),
        Some(1),
        "bieząca Typ z białymi znakami musi być przycięta jak w webie"
    );
}

#[test]
fn newest_same_type_unit_missing_keys_and_empty_typ_yield_none() {
    let rows = [
        UnitRow {
            jednostka: "A",
            typ: None,
            epoka: Some("Kamien"),
        },
        UnitRow {
            jednostka: "B",
            typ: Some("   "),
            epoka: Some("Braz"),
        },
        UnitRow {
            jednostka: "C",
            typ: Some("Piechota"),
            epoka: None,
        },
        UnitRow {
            jednostka: "D",
            typ: Some("Piechota"),
            epoka: Some("Zelazo"),
        },
    ];
    // Bieżąca bez Typ -> brak wyniku.
    assert_eq!(newest_available_same_type_unit("A", &["D"], &rows), None);
    // Bieżąca z pustym Typ (po trim) -> brak wyniku.
    assert_eq!(newest_available_same_type_unit("B", &["D"], &rows), None);
    // Nieistniejaca bieżąca -> brak wyniku.
    assert_eq!(newest_available_same_type_unit("NIE", &["D"], &rows), None);
    // Bieżąca z brakującą epoką traktowana jak Kamień (1): D (Zelazo, 3) jest nowsza.
    assert_eq!(newest_available_same_type_unit("C", &["D"], &rows), Some(3));
    // Kandydat spoza listy nie jest brany pod uwagę.
    assert_eq!(newest_available_same_type_unit("C", &[], &rows), None);
}

#[test]
fn newest_same_type_unit_only_strictly_newer_epoch() {
    let rows = [
        UnitRow {
            jednostka: "C",
            typ: Some("Piechota"),
            epoka: Some("Braz"),
        },
        UnitRow {
            jednostka: "S",
            typ: Some("Piechota"),
            epoka: Some("Braz"),
        },
        UnitRow {
            jednostka: "O",
            typ: Some("Piechota"),
            epoka: Some("Kamien"),
        },
    ];
    assert_eq!(
        newest_available_same_type_unit("C", &["S", "O"], &rows),
        None
    );
}

#[test]
fn matrix_discount_floor_and_minimum_one() {
    assert_eq!(apply_cost_discount(10.0, 0.25), 7.0, "floor(7.5)");
    assert_eq!(apply_cost_discount(10.0, 0.99), 1.0, "min 1");
    assert_eq!(apply_cost_discount(10.0, 0.0), 10.0, "rabat 0 = bez zmian");
    assert_eq!(
        apply_cost_discount(10.0, -0.3),
        10.0,
        "rabat ujemny ignorowany"
    );
    assert_eq!(apply_cost_discount(0.0, 0.5), 0.0, "koszt <= 0 bez zmian");
    assert!(apply_cost_discount(f64::NAN, 0.5).is_nan(), "NaN bez zmian");
}

#[test]
fn difficulty_multiplier_thresholds_exact() {
    assert_eq!(cost_multiplier_for_owner(0, Difficulty::Normal), 1.0);
    assert_eq!(cost_multiplier_for_owner(7, Difficulty::Normal), 1.0);
    assert_eq!(cost_multiplier_for_owner(0, Difficulty::Easy), 1.0);
    assert_eq!(cost_multiplier_for_owner(1, Difficulty::Easy), 2.0);
    assert_eq!(cost_multiplier_for_owner(0, Difficulty::Hard), 2.0);
    assert_eq!(cost_multiplier_for_owner(-1, Difficulty::Hard), 1.0);
    // Math.max(1, Math.round(x)): 0.4 -> 1 (round 0, min 1); 2.5 -> 3 (half up).
    assert_eq!(
        apply_difficulty_cost_multiplier(0.4, 1, Difficulty::Normal),
        1.0
    );
    assert_eq!(
        apply_difficulty_cost_multiplier(2.5, 0, Difficulty::Hard),
        5.0
    );
}

#[test]
fn building_work_cost_nan_and_infinity_propagate_like_web() {
    let nan = building_work_cost_web(f64::NAN, None, None, 0, Difficulty::Normal);
    assert!(nan.is_nan(), "NaN koszt zostaje NaN (web Math.max z NaN)");
    let inf = building_work_cost_web(f64::INFINITY, None, None, 0, Difficulty::Normal);
    assert!(inf.is_infinite() && inf > 0.0);
}
