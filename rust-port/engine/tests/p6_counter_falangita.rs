//! P6 COUNTER-FALANGITA (R-RUSTPORT-P6-COUNTER-FALANGITA-Q1) -- porownanie macierzy mnoznikow
//! kontrataku `data/derived/counter-multipliers.json` z PINEM 07d2fbd72 dla WSZYSTKICH 64 par typ x typ.
//!
//! Wektory: `p6_counter_falangita_vectors/vectors.json`, wygenerowane przez
//! `p6_counter_falangita_gen.mjs` z WYKONANIA tekstu pinu (`counterMultiplier` + `normCounters`
//! z gra/src/game/combat.ts i battleScene.ts). Test sprawdza straznik SHA-256 wycietego tekstu
//! pinu oraz zgodnosc Rust z wektorami pinu dla kazdej pary (odczyt tabeli i wejscie domeny).

use civ_engine::data::derived::counter_multiplier_value;
use civ_engine::domain::combat::counter_multiplier;
use serde_json::Value;

const VEC: &str = include_str!("p6_counter_falangita_vectors/vectors.json");

/// Straznik: SHA-256 wycietego tekstu pinu (normCounters + parseCounterBonusFrac + counterMultiplier).
const EXPECT_FRAGMENT_SHA256: &str =
    "c5a878dd5d944f1698ad19d55b131f92d7cb2dd5495d53bde516e415c4506c4a";
/// Straznik: SHA-256 gra/data/counters.json w pinie.
const EXPECT_COUNTERS_SHA256: &str =
    "ebb07f4e554ae416f2b5a9a8be8cc00876e94ec1a34eb94eb245205ac094d129";
/// Straznik: SHA-256 gra/data/combat-params.json w pinie.
const EXPECT_PARAMS_SHA256: &str =
    "5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e";

const TOLERANCE: f64 = 1e-12;

fn load() -> Value {
    serde_json::from_str(VEC).expect("vectors.json jest poprawnym JSON")
}

#[test]
fn counter_vectors_guard_hashes_match_pin() {
    let root = load();
    assert_eq!(
        root["source"]["fragmentSha256"].as_str(),
        Some(EXPECT_FRAGMENT_SHA256),
        "straznik: fragmenty pinu (counterMultiplier) zmienione wzgledem wektorow"
    );
    assert_eq!(
        root["source"]["countersSha256"].as_str(),
        Some(EXPECT_COUNTERS_SHA256),
        "straznik: counters.json zmieniony wzgledem wektorow"
    );
    assert_eq!(
        root["source"]["paramsSha256"].as_str(),
        Some(EXPECT_PARAMS_SHA256),
        "straznik: combat-params.json zmieniony wzgledem wektorow"
    );
}

#[test]
fn counter_vectors_cover_all_64_pairs() {
    let root = load();
    let cases = root["cases"].as_array().expect("cases jest tablica");
    assert_eq!(cases.len(), 64, "8 x 8 par typ x typ");
    assert_eq!(root["counts"]["cases"].as_u64(), Some(64), "counts.cases");
    let mut seen = std::collections::BTreeSet::new();
    for c in cases {
        let atk = c["atakujacy"].as_str().expect("atakujacy");
        let cel = c["cel"].as_str().expect("cel");
        assert!(
            seen.insert((atk.to_owned(), cel.to_owned())),
            "duplikat {atk} -> {cel}"
        );
    }
    assert_eq!(seen.len(), 64);
}

#[test]
fn all_64_pairs_match_pin_vectors() {
    let root = load();
    let mut checked = 0usize;
    for c in root["cases"].as_array().expect("cases") {
        let atk = c["atakujacy"].as_str().expect("atakujacy");
        let cel = c["cel"].as_str().expect("cel");
        let expected = c["mnoznik"].as_f64().expect("mnoznik");

        let table = counter_multiplier_value(atk, cel)
            .unwrap_or_else(|| panic!("brak wpisu w tabeli dla {atk} -> {cel}"));
        assert!(
            (table - expected).abs() < TOLERANCE,
            "tabela {atk} -> {cel}: rust {table}, pin {expected}"
        );

        let domain = counter_multiplier(atk, cel, &[]);
        assert!(
            (domain - expected).abs() < TOLERANCE,
            "domena {atk} -> {cel}: rust {domain}, pin {expected}"
        );
        checked += 1;
    }
    assert_eq!(checked, 64, "sprawdzone pary");
}

#[test]
fn falangite_to_spearman_is_plus_30_percent_per_pin() {
    // Pin: counters.json wiersz "Falangite" -> "Spearman" = "+30%" (Atak, potwierdzone) => 1.30.
    let got = counter_multiplier_value("falangite", "spearman").expect("wpis falangite->spearman");
    assert!(
        (got - 1.3).abs() < TOLERANCE,
        "falangite -> spearman: {got}"
    );
    assert!((counter_multiplier("falangite", "spearman", &[]) - 1.3).abs() < TOLERANCE);
}
