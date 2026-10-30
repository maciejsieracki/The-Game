//! P6.8D-P1 - `citizen-resource-upkeep.ts` (web pin 91dc998a): utrzymanie obywateli surowcami.
//! Wektory z URUCHOMIONEGO weba (`tests/p6_8d_vectors/citizen_upkeep.json`, generator
//! `gen-p6-8d-vectors.mjs` w runie R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1).
//! Kodowanie: liczba calkowita = JSON number; niecalkowita = `{"$f": String(x)}`;
//! NaN/Infinity/-Infinity/-0 = `{"$n": "..."}`.

use std::collections::BTreeMap;

use civ_engine::data::economy_society::{parse_citizen_resource_upkeep, CitizenResourceUpkeep};
use civ_engine::domain::resource_production::{
    citizen_required_resources_for_era, citizen_upkeep_display_lines,
    compute_citizen_resource_drain, resolve_citizen_resource_coverage, CitizenUpkeepCoverage,
    CITIZEN_UPKEEP_RATE_PER_CITIZEN,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8d_vectors/citizen_upkeep.json");

fn table() -> CitizenResourceUpkeep {
    parse_citizen_resource_upkeep().expect("citizen-resource-upkeep.json")
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory parse")
}

fn list<'a>(value: &'a Value, what: &str) -> &'a Vec<Value> {
    value
        .as_array()
        .unwrap_or_else(|| panic!("oczekiwano listy: {what}"))
}

/// Liczba wektora (zwykla albo zakodowana specjalnie).
fn num(value: &Value) -> f64 {
    match value {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::Object(o) if o.contains_key("$f") => o["$f"]
            .as_str()
            .expect("$f")
            .parse::<f64>()
            .expect("$f liczba"),
        Value::Object(o) if o.contains_key("$n") => match o["$n"].as_str().expect("$n") {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznana liczba specjalna {other}"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_same(label: &str, got: f64, want: f64) {
    assert!(
        same(got, want),
        "{label}: got {got:?} ({:#018x}), web {want:?} ({:#018x})",
        got.to_bits(),
        want.to_bits()
    );
}

fn strings(value: &Value) -> Vec<String> {
    list(value, "lista napisow")
        .iter()
        .map(|v| v.as_str().expect("napis").to_owned())
        .collect()
}

/// Magazyn z wektora: `null` -> `None`; obiekt -> mapa liczb (klucze nie-liczbowe nie wystepuja).
fn stock(value: &Value) -> Option<BTreeMap<String, f64>> {
    match value {
        Value::Null => None,
        Value::Object(map) => Some(map.iter().map(|(k, v)| (k.clone(), num(v))).collect()),
        other => panic!("magazyn: {other}"),
    }
}

fn assert_cov(label: &str, got: &CitizenUpkeepCoverage, case: &Value) {
    assert_eq!(got.required, strings(&case["required"]), "{label} required");
    assert_eq!(
        got.available,
        strings(&case["available"]),
        "{label} available"
    );
    assert_eq!(got.missing, strings(&case["missing"]), "{label} missing");
    assert_eq!(
        got.happiness_delta as f64,
        num(&case["happinessDelta"]),
        "{label} happinessDelta"
    );
    assert_eq!(
        got.growth_pct_delta as f64,
        num(&case["growthPctDelta"]),
        "{label} growthPctDelta"
    );
}

#[test]
fn constants_match_web() {
    let t = table();
    let v = vectors();
    let c = &v["constants"];
    assert_same(
        "happy/available",
        t.kara.szczescie_za_dostepny as f64,
        num(&c["happinessPerAvailable"]),
    );
    assert_same(
        "happy/missing",
        t.kara.szczescie_za_brakujacy as f64,
        num(&c["happinessPerMissing"]),
    );
    assert_same(
        "growth/missing",
        t.kara.rozwoj_pct_za_brakujacy as f64,
        num(&c["growthPctPerMissing"]),
    );
    assert_same(
        "rate",
        CITIZEN_UPKEEP_RATE_PER_CITIZEN,
        num(&c["ratePerCitizen"]),
    );
}

#[test]
fn era_required_lists_match_web() {
    let t = table();
    let v = vectors();
    let cases = list(&v["cases"]["eras"], "eras");
    assert_eq!(cases.len(), 14);
    for case in cases {
        let era = num(&case["era"]);
        assert_eq!(
            citizen_required_resources_for_era(&t, era),
            strings(&case["required"]).as_slice(),
            "era {era:?}"
        );
    }
}

#[test]
fn coverage_preview_matches_web() {
    let t = table();
    let v = vectors();
    let cases = list(&v["cases"]["coverage"], "coverage");
    assert_eq!(cases.len(), 140);
    for case in cases {
        let era = num(&case["era"]);
        let st = stock(&case["stock"]);
        let got = resolve_citizen_resource_coverage(&t, era, st.as_ref());
        assert_cov(
            &format!("coverage era={era:?} stock={}", case["stockName"]),
            &got,
            case,
        );
    }
}

#[test]
fn drain_matches_web() {
    let t = table();
    let v = vectors();
    let cases = list(&v["cases"]["drain"], "drain");
    assert_eq!(cases.len(), 1820);
    let mut with_deductions = 0usize;
    let mut partial = 0usize;
    for case in cases {
        let era = num(&case["era"]);
        let pop = num(&case["population"]);
        let st = stock(&case["stock"]);
        let got = compute_citizen_resource_drain(&t, era, pop, st.as_ref());
        let label = format!("drain era={era:?} pop={pop:?} stock={}", case["stockName"]);
        assert_cov(&label, &got.coverage, case);
        let want_ded = case["deductions"].as_object().expect("deductions");
        assert_eq!(
            got.deductions.len(),
            want_ded.len(),
            "{label} deductions keys"
        );
        for (k, w) in want_ded {
            let g = *got
                .deductions
                .get(k)
                .unwrap_or_else(|| panic!("{label} brak {k}"));
            assert_same(&format!("{label} deduction {k}"), g, num(w));
        }
        with_deductions += usize::from(!want_ded.is_empty());
        partial +=
            usize::from(!got.coverage.missing.is_empty() && !got.coverage.available.is_empty());
    }
    // Pokrycie wektorow: wystepuja przypadki z odjeciem i z czesciowym pokryciem.
    assert!(
        with_deductions > 300,
        "za malo przypadkow z odjeciem: {with_deductions}"
    );
    assert!(partial > 100, "za malo przypadkow czesciowych: {partial}");
}

#[test]
fn display_lines_match_web() {
    let t = table();
    let v = vectors();
    let cases = list(&v["cases"]["display"], "display");
    assert_eq!(cases.len(), 520);
    for case in cases {
        let era = case["era"].as_f64().expect("era");
        let st = stock(&case["stock"]);
        let cov = resolve_citizen_resource_coverage(&t, era, st.as_ref());
        assert_eq!(cov.available, strings(&case["available"]));
        assert_eq!(cov.missing, strings(&case["missing"]));
        let pop = num(&case["population"]);
        let got = citizen_upkeep_display_lines(&cov, pop);
        let want = list(&case["lines"], "lines");
        assert_eq!(got.len(), want.len(), "liczba wierszy pop={pop:?}");
        for (g, w) in got.iter().zip(want) {
            assert_eq!(g.key, w["key"].as_str().expect("key"));
            assert_same(&format!("value {}", g.key), g.value, num(&w["value"]));
            assert_eq!(g.available, w["available"].as_bool().expect("available"));
        }
    }
}

// ---------------------------------------------------------------------------
// Testy wlasciwosci i galezi sterujacych (poza wektorami): pokrywaja jawnie reguly z JSDoc.
// ---------------------------------------------------------------------------

fn stock_of(pairs: &[(&str, f64)]) -> BTreeMap<String, f64> {
    pairs.iter().map(|(k, v)| ((*k).to_owned(), *v)).collect()
}

#[test]
fn era_fallback_branches() {
    let t = table();
    // Brak wpisu > epoka 3 -> najblizsza <= (Zelazo); niefinite lub < 1 -> Kamien.
    assert_eq!(
        citizen_required_resources_for_era(&t, 9.0),
        citizen_required_resources_for_era(&t, 3.0)
    );
    assert_eq!(
        citizen_required_resources_for_era(&t, 2.999),
        citizen_required_resources_for_era(&t, 2.0)
    );
    assert_eq!(
        citizen_required_resources_for_era(&t, 0.0),
        citizen_required_resources_for_era(&t, 1.0)
    );
    assert_eq!(
        citizen_required_resources_for_era(&t, f64::NAN),
        citizen_required_resources_for_era(&t, 1.0)
    );
    assert_eq!(
        citizen_required_resources_for_era(&t, f64::NEG_INFINITY),
        citizen_required_resources_for_era(&t, 1.0)
    );
}

#[test]
fn drain_is_floor_and_never_negative_and_binary_penalty() {
    let t = table();
    // pop 3.7 -> required = floor(3.7) = 3; magazyn 2 -> drained 2 < 3 -> brakujacy.
    let st = stock_of(&[("drewno", 2.0), ("glina", 5.0)]);
    let d = compute_citizen_resource_drain(&t, 1.0, 3.7, Some(&st));
    assert_eq!(d.coverage.missing, vec!["drewno".to_owned()]);
    assert_eq!(d.coverage.available, vec!["glina".to_owned()]);
    assert_eq!(d.deductions.get("drewno"), Some(&2.0));
    assert_eq!(d.deductions.get("glina"), Some(&3.0));
    // Kara binarna: niedobor 1 sztuki = ten sam wynik co niedobor 2 (nieskalowana).
    assert_eq!(d.coverage.happiness_delta, 2 - 2);
    assert_eq!(d.coverage.growth_pct_delta, -1);
    // Magazyn ujemny / zerowy / NaN nie daje odjecia i nie schodzi ponizej zera.
    let bad = stock_of(&[("drewno", -4.0), ("glina", f64::NAN)]);
    let d2 = compute_citizen_resource_drain(&t, 1.0, 10.0, Some(&bad));
    assert!(d2.deductions.is_empty());
    assert_eq!(d2.coverage.missing.len(), 2);
    // Pozytywny stan >= zapotrzebowania: pelne pokrycie, bez wpisu ujemnego.
    let full = stock_of(&[("drewno", 1000.0), ("glina", 1000.0)]);
    let d3 = compute_citizen_resource_drain(&t, 1.0, 53.0, Some(&full));
    assert_eq!(d3.deductions.get("drewno"), Some(&53.0));
    assert_eq!(d3.coverage.happiness_delta, 4);
    assert_eq!(d3.coverage.growth_pct_delta, 0);
}

#[test]
fn population_nonfinite_or_nonpositive_means_zero_demand() {
    let t = table();
    for pop in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY, 0.0, -7.0] {
        let d = compute_citizen_resource_drain(&t, 1.0, pop, None);
        assert!(d.deductions.is_empty(), "pop={pop:?}");
        // need = 0 -> drained(0) >= need(0): kazdy surowiec "dostepny".
        assert_eq!(d.coverage.available.len(), 2, "pop={pop:?}");
        assert_eq!(d.coverage.happiness_delta, 4);
    }
}

#[test]
fn display_negative_zero_for_missing_zero_quantity() {
    let t = table();
    let cov = resolve_citizen_resource_coverage(&t, 1.0, None);
    let lines = citizen_upkeep_display_lines(&cov, 0.0);
    assert_eq!(lines.len(), 2);
    for line in lines {
        assert!(!line.available);
        assert!(
            same(line.value, -0.0),
            "oczekiwano -0, jest {:?}",
            line.value
        );
    }
}

#[test]
fn multi_city_drain_is_single_owner_pool() {
    // Dwa miasta po 4 obywateli: wolajacy sumuje populacje (8) i wola RAZ. Magazyn 5 -> brak
    // pelnego pokrycia (need 8), odjecie 5 (nie 8, nie 10) - brak wielokrotnego zuzycia magazynu.
    let t = table();
    let st = stock_of(&[("drewno", 5.0), ("glina", 5.0)]);
    let d = compute_citizen_resource_drain(&t, 1.0, 4.0 + 4.0, Some(&st));
    assert_eq!(d.deductions.get("drewno"), Some(&5.0));
    assert_eq!(d.deductions.get("glina"), Some(&5.0));
    assert!(d.coverage.available.is_empty());
}
