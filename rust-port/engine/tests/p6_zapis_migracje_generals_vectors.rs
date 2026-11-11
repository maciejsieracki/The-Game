//! P6-ZAPIS-MIGRACJE-FALA509 (runda 2): wektory z WEBU dla migracji nadmiaru wodzow.
//! Wektory: `tests/p6_zapis_migracje_vectors/generals-demotion.json`, wygenerowane uruchomionym webem
//! (Node v22.22.0, `planGeneralLimitDemotions` z origin/main `gra/src/game/generals.ts`) generatorem
//! `tests/p6_zapis_migracje_vectors/gen-demotion-vectors.mjs` (407 przypadkow, 151 z degradacjami).
//! Brak wpisu epoki w wektorze = epoka 1 (zalozenie generatora); wartosci NaN/Infinity zapisane tekstem.

use civ_engine::domain::save_migrations::{
    general_flag_from_raw, plan_general_limit_demotions, GeneralRosterEntry,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zapis_migracje_vectors/generals-demotion.json");

fn decode_era(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("finite json number"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("era string"),
        },
        other => panic!("unexpected era value {other}"),
    }
}

#[test]
fn p6_zapis_migracje_generals_match_web_vectors() {
    let doc: Value = serde_json::from_str(VECTORS).expect("vectors parse");
    let cases = doc["cases"].as_array().expect("cases array");
    assert_eq!(cases.len(), 407, "liczba przypadkow wektorow");
    let mut with_demotion = 0;
    for (index, case) in cases.iter().enumerate() {
        let roster: Vec<GeneralRosterEntry> = case["roster"]
            .as_array()
            .expect("roster")
            .iter()
            .map(|u| GeneralRosterEntry {
                id: u["id"].as_str().expect("id").to_string(),
                owner_id: u["ownerId"].as_f64().expect("ownerId"),
                // Web `unit.isGeneral === true`: brak klucza, null, "true", 1 => false.
                is_general: general_flag_from_raw(u.get("isGeneral")),
            })
            .collect();
        let eras = case["eras"].as_object().expect("eras");
        let era_for = |owner: f64| -> f64 {
            // Klucz JSON to tekst liczby; brak wpisu = 1 (jak w generatorze).
            let key = if owner == 0.0 {
                "0".to_string()
            } else {
                format!("{owner}")
            };
            eras.get(&key).map(decode_era).unwrap_or(1.0)
        };
        let got = plan_general_limit_demotions(&roster, era_for);
        let expected: Vec<String> = case["expectedDemote"]
            .as_array()
            .expect("expectedDemote")
            .iter()
            .map(|v| v.as_str().expect("id").to_string())
            .collect();
        if !expected.is_empty() {
            with_demotion += 1;
        }
        assert_eq!(got, expected, "przypadek #{index}: {case}");
    }
    assert_eq!(with_demotion, 151, "liczba przypadkow z degradacja");
}
