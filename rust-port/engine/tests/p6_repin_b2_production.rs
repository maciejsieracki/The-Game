//! REPIN-EKONOMIA-B2 (pin webu 91dc998a), partia B2a + poprawka r1 (Obrona):
//! `buildingWorkCost` (production.ts:555), `unitMoneyCost` (577), `civRecruitmentDiscount` (626),
//! `civMatrixCostDiscount` (644), `civProductionCostBonusyForCivKey` (609),
//! `newestAvailableSameTypeUnit` i `epochNumber` (production.ts:190-226).
//!
//! Wektory: `tests/p6_repin_b2_vectors/*.json` z URUCHOMIONEGO weba @ 91dc998a
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/gen-repin-b2-vectors.mjs`).
//! Porownanie: liczby skonczone bitowo (z wyjatkiem zera, gdzie JSON gubi znak -0), NaN == NaN.
//! Markery (bonusy) sa przekazywane do funkcji Rust jako lista `CostMarker`: rabat z markera liczy
//! sam kod Rust (nie helper testowy).

use civ_engine::data::civilizations::parse_civ_matrix;
use civ_engine::domain::building_costs::p6_7b::PaceInput;
use civ_engine::domain::building_costs::repin_b2::{
    apply_cost_discount, apply_difficulty_cost_multiplier, building_work_cost_web,
    civ_matrix_cost_discount, civ_production_cost_markers, civ_recruitment_discount,
    cost_multiplier_for_owner, unit_money_cost_web, CostMarker, MarkerValue,
};
use civ_engine::domain::production_units::{
    epoch_number, newest_available_same_type_unit, UnitRow,
};
use civ_engine::domain::recruitment::army_merge::UnitCostPace;
use civ_engine::domain::types::Difficulty;
use serde_json::Value;

const BUILDING_VECTORS: &str = include_str!("p6_repin_b2_vectors/building_work_cost.json");
const UNIT_MONEY_VECTORS: &str = include_str!("p6_repin_b2_vectors/unit_money_cost.json");
const CIV_MARKER_VECTORS: &str = include_str!("p6_repin_b2_vectors/civ_cost_markers.json");
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

/// Wartosc `wartosc` markera z wektora: liczba; `{"js": "NaN"|"Infinity"|"-Infinity"}` = liczba
/// niefinite (web `typeof number`); napis / inne = nie-liczba (web `typeof !== 'number'`).
fn marker_value(v: &Value) -> MarkerValue {
    match v {
        Value::Number(n) => MarkerValue::Number(n.as_f64().expect("liczba")),
        Value::Object(o) => match o.get("js").and_then(Value::as_str) {
            Some(s) => MarkerValue::Number(num(&Value::String(s.to_owned()))),
            None => MarkerValue::NotNumber,
        },
        _ => MarkerValue::NotNumber,
    }
}

/// Lista markerow z wektora (`null` = `undefined` -> pusta lista; web `bonusy?.find` = `undefined`).
fn markers_of(set: &Value) -> Vec<CostMarker<'_>> {
    let Some(arr) = set.as_array() else {
        return Vec::new();
    };
    arr.iter()
        .map(|m| CostMarker {
            cel: m.get("cel").and_then(Value::as_str),
            wartosc: marker_value(&m["wartosc"]),
            realizuje: m.get("realizuje").and_then(Value::as_str),
            matrix_param_id: m.get("matrixParamId").and_then(Value::as_str),
        })
        .collect()
}

/// Tempo budynku z wektora: `{t:"undef"}` | `{t:"key",v}` | `{t:"num",v}`.
fn building_pace_of(p: &Value) -> Option<PaceInput<'_>> {
    match p["t"].as_str().expect("pace.t") {
        "undef" => None,
        "key" => Some(PaceInput::Key(p["v"].as_str().expect("pace.v"))),
        "num" => Some(PaceInput::Multiplier(num(&p["v"]))),
        other => panic!("nieznany typ tempa: {other}"),
    }
}

/// Tempo jednostki z wektora (ta sama koperta co dla budynku).
fn unit_pace_of(p: &Value) -> Option<UnitCostPace<'_>> {
    match p["t"].as_str().expect("pace.t") {
        "undef" => None,
        "key" => Some(UnitCostPace::Key(p["v"].as_str().expect("pace.v"))),
        "num" => Some(UnitCostPace::Multiplier(num(&p["v"]))),
        other => panic!("nieznany typ tempa: {other}"),
    }
}

#[test]
fn building_work_cost_matches_web_vectors() {
    let doc = parse_json(BUILDING_VECTORS);
    let variants = doc["bonusyVariants"].as_object().expect("bonusyVariants");
    let cases = doc["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 14580, "pelna siatka wektora budynkow");
    let mut mismatches = Vec::new();
    for case in cases {
        let base = num(&case["base"]);
        let bonusy_name = case["bonusy"].as_str().expect("bonusy");
        let markers = markers_of(&variants[bonusy_name]);
        let pace_json = &case["pace"];
        let pace = building_pace_of(pace_json);
        let owner = case["owner"].as_i64().expect("owner");
        let diff = difficulty_from_key(case["diff"].as_str().expect("diff"));
        let got = building_work_cost_web(base, &markers, pace, owner, diff);
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
fn unit_money_cost_matches_web_vectors() {
    let doc = parse_json(UNIT_MONEY_VECTORS);
    let sets = doc["markerSets"].as_object().expect("markerSets");
    let cases = doc["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 21464, "pelna siatka wektora kosztu jednostek");
    let mut mismatches = Vec::new();
    for case in cases {
        let base = num(&case["base"]);
        let set_name = case["markers"].as_str().expect("markers");
        let markers = markers_of(&sets[set_name]);
        let unit_name = case["unitName"].as_str();
        let pace = unit_pace_of(&case["pace"]);
        let owner = case["owner"].as_i64().expect("owner");
        let diff = difficulty_from_key(case["diff"].as_str().expect("diff"));
        let got = unit_money_cost_web(base, &markers, pace, owner, diff, unit_name);
        let expected = num(&case["out"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "base={base} markers={set_name} unit={unit_name:?} pace={} owner={owner} diff={diff:?}: got={got} expected={expected}",
                case["pace"]
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
fn civ_production_cost_markers_match_web_vectors() {
    let matrix = parse_civ_matrix().expect("civ-matrix.json (kopia Rust) musi sie parsowac");
    let doc = parse_json(CIV_MARKER_VECTORS);
    let cases = doc["cases"].as_array().expect("cases");
    assert!(cases.len() >= 50, "wektor macierzy: {}", cases.len());
    let mut mismatches = Vec::new();
    for case in cases {
        let key = case["civKey"].as_str().expect("civKey");
        let got = civ_production_cost_markers(&matrix, key);
        let expected = case["markers"].as_array().expect("markers");
        let same_len = got.len() == expected.len();
        let same = same_len
            && got.iter().zip(expected.iter()).all(|(g, e)| {
                g.cel == e["cel"].as_str()
                    && g.realizuje == e["realizuje"].as_str()
                    && g.matrix_param_id == e["matrixParamId"].as_str()
                    && match (g.wartosc, marker_value(&e["wartosc"])) {
                        (MarkerValue::Number(a), MarkerValue::Number(b)) => same_f64(a, b),
                        (a, b) => a == b,
                    }
            });
        if !same {
            mismatches.push(format!("civKey={key:?}: got={got:?} expected={expected:?}"));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci markerow macierzy ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(5)]
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
    assert_eq!(checked, 88, "liczba przypadkow wektora unit_newest.json");
}

#[test]
fn newest_same_type_unit_tie_keeps_first_in_units_order() {
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
fn newest_same_type_unit_trims_unicode_whitespace_like_js() {
    // JS String.prototype.trim: NBSP (U+00A0) i BOM (U+FEFF) sa przycinane (zweryfikowane na 91dc998a).
    let rows = [
        UnitRow {
            jednostka: "X",
            typ: Some("\u{00A0}Piechota\u{FEFF}"),
            epoka: Some("Kamien"),
        },
        UnitRow {
            jednostka: "Y",
            typ: Some("Piechota\u{00A0}"),
            epoka: Some("Braz"),
        },
    ];
    assert_eq!(
        newest_available_same_type_unit("X", &["Y"], &rows),
        Some(1),
        "NBSP/BOM przycinane jak JS trim"
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
fn civ_matrix_cost_discount_uses_first_marker_only() {
    let budynek = |w| CostMarker {
        cel: Some("budynki"),
        wartosc: w,
        realizuje: Some("miasto"),
        matrix_param_id: Some("prod_koszt_budynku_proc"),
    };
    let jednostka = CostMarker {
        cel: Some("jednostki"),
        wartosc: MarkerValue::Number(0.3),
        realizuje: Some("ekonomia"),
        matrix_param_id: Some("prod_koszt_jednostki_proc"),
    };
    let p = "prod_koszt_budynku_proc";
    // web: pierwszy marker NaN -> null, bez szukania kolejnego.
    assert_eq!(
        civ_matrix_cost_discount(
            &[
                budynek(MarkerValue::Number(f64::NAN)),
                budynek(MarkerValue::Number(0.25))
            ],
            p
        ),
        None
    );
    assert_eq!(
        civ_matrix_cost_discount(
            &[
                budynek(MarkerValue::Number(f64::INFINITY)),
                budynek(MarkerValue::Number(0.25))
            ],
            p
        ),
        None
    );
    // web: pierwszy marker nie-liczba -> null.
    assert_eq!(
        civ_matrix_cost_discount(
            &[
                budynek(MarkerValue::NotNumber),
                budynek(MarkerValue::Number(0.25))
            ],
            p
        ),
        None
    );
    // Pierwszy skonczony wygrywa z kolejnym.
    assert_eq!(
        civ_matrix_cost_discount(
            &[
                budynek(MarkerValue::Number(0.1)),
                budynek(MarkerValue::Number(0.5))
            ],
            p
        ),
        Some(0.1)
    );
    // Marker innego parametru jest pomijany.
    assert_eq!(
        civ_matrix_cost_discount(&[jednostka, budynek(MarkerValue::Number(0.25))], p),
        Some(0.25)
    );
    assert_eq!(civ_matrix_cost_discount(&[], p), None);
}

#[test]
fn civ_recruitment_discount_impi_rule_and_realizuje() {
    let rek = |w, cel: Option<&'static str>, realizuje: Option<&'static str>| CostMarker {
        cel,
        wartosc: MarkerValue::Number(w),
        realizuje,
        matrix_param_id: Some("walka_koszt_rekrutacji_proc"),
    };
    let markers = [
        rek(0.1, Some("impi"), Some("ekonomia")),
        rek(0.2, None, Some("ekonomia")),
        rek(0.4, Some("impi"), Some("miasto")),
    ];
    // Impi (po trim/lower): 0.1 + 0.2; inny typ: tylko 0.2 (cel=impi pomijany).
    assert_eq!(
        civ_recruitment_discount(&markers, Some(" IMPI ")),
        0.1 + 0.2
    );
    assert_eq!(civ_recruitment_discount(&markers, Some("Piechota")), 0.2);
    assert_eq!(civ_recruitment_discount(&markers, None), 0.2);
}

#[test]
fn pace_zero_nan_and_empty_key_are_falsy_like_web() {
    // web `pace ? ... : ...`: 0, NaN i '' to brak tempa.
    let base = building_work_cost_web(100.0, &[], None, 0, Difficulty::Normal);
    assert_eq!(
        building_work_cost_web(
            100.0,
            &[],
            Some(PaceInput::Multiplier(0.0)),
            0,
            Difficulty::Normal
        ),
        base
    );
    assert_eq!(
        building_work_cost_web(
            100.0,
            &[],
            Some(PaceInput::Multiplier(f64::NAN)),
            0,
            Difficulty::Normal
        ),
        base
    );
    assert_eq!(
        building_work_cost_web(100.0, &[], Some(PaceInput::Key("")), 0, Difficulty::Normal),
        base
    );
    let ubase = unit_money_cost_web(100.0, &[], None, 0, Difficulty::Normal, None);
    assert_eq!(
        unit_money_cost_web(
            100.0,
            &[],
            Some(UnitCostPace::Multiplier(0.0)),
            0,
            Difficulty::Normal,
            None
        ),
        ubase
    );
    assert_eq!(
        unit_money_cost_web(
            100.0,
            &[],
            Some(UnitCostPace::Multiplier(f64::NAN)),
            0,
            Difficulty::Normal,
            None
        ),
        ubase
    );
    assert_eq!(
        unit_money_cost_web(
            100.0,
            &[],
            Some(UnitCostPace::Key("")),
            0,
            Difficulty::Normal,
            None
        ),
        ubase
    );
    // Liczba niezerowa to mnoznik (nie jest falsy).
    assert_eq!(
        unit_money_cost_web(
            100.0,
            &[],
            Some(UnitCostPace::Multiplier(0.5)),
            0,
            Difficulty::Normal,
            None
        ),
        50.0
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
    let nan = building_work_cost_web(f64::NAN, &[], None, 0, Difficulty::Normal);
    assert!(nan.is_nan(), "NaN koszt zostaje NaN (web Math.max z NaN)");
    let inf = building_work_cost_web(f64::INFINITY, &[], None, 0, Difficulty::Normal);
    assert!(inf.is_infinite() && inf > 0.0);
}
