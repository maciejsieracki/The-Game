//! P6 EKONOMIA-BRAZ-ERA (R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1): przepustowosc brazu per epoka wlasciciela.
//!
//! Pin weba `07d2fbd72`: `gra/src/game/converters.ts` (`throughputEraParamKeys` na trzech recepturach brazu,
//! `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` = 3 wpisy bez brazu, `converterThroughputEraParamKey`) oraz dwie sciezki
//! budowania mapy przepustowosci w `gra/src/game/turn-economy.ts` (podglad ~1503, tick glowny ~2484).
//! Wektory: `p6_ekonomia_braz_era_vectors/braz.json`, generowane przez `p6_ekonomia_braz_era_gen.mjs`, ktory
//! WYKONUJE tekst pinu (nic recznie). Straznik: SHA-256 wycietych fragmentow pinu.
//!
//! Rozbieznosc JAWNIE RAPORTOWANA (nie ukrywana): gdy `raw` nie ma wierszy brazu epoka2/3 a nadpisuje
//! `budynek_huta_przepustowosc`, sciezka podgladu (fallback receptury = 50) i sciezka ticku (fallback = baza huty)
//! dają różne wartości. W produkcji wiersze brazu zawsze sa w econ-params, wiec rozbieznosc nie jest osiagalna.

use civ_engine::domain::turn_economy_resources::{
    converter_output_multiplier_for_era, converter_throughput_era_param_key,
    converter_throughput_for_era, converter_throughputs_for_era, ConverterRecipe,
    CONVERTER_FOUNDRY_ERA_RECIPE_IDS, DEFAULT_CONVERTER_RECIPES,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_ekonomia_braz_era_vectors/braz.json");
const ECON_PARAMS: &str = include_str!("../data/econ-params.json");

/// SHA-256 wycietych fragmentow pinu 07d2fbd72 (`converters.ts` + `citizen-consumption-era.ts` + 2 lambdy
/// `turn-economy.ts`); wyliczane przez `p6_ekonomia_braz_era_gen.mjs`.
const FRAGMENT_SHA256: &str = "f0e28920dedcd63f6b5b0207facd5b574a33e03087ab7f13b204257df69ef318";

const BRAZ_IDS: [&str; 3] = [
    "odlewnia_brazu",
    "odlewnia_zelaza__braz",
    "wielka_odlewnia__braz",
];

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("braz.json")
}

fn era_of(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("epoka"),
        },
        other => panic!("epoka nie-liczba: {other}"),
    }
}

fn recipe(id: &str) -> &'static ConverterRecipe {
    DEFAULT_CONVERTER_RECIPES
        .iter()
        .find(|r| r.id == id)
        .unwrap_or_else(|| panic!("brak receptury {id}"))
}

#[test]
fn vectors_are_bound_to_pin_fragment_sha() {
    let d = vectors();
    assert_eq!(d["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    assert_eq!(d["fragmentSha256"].as_str(), Some(FRAGMENT_SHA256));
    assert_eq!(d["brazIds"], serde_json::json!(BRAZ_IDS));
}

#[test]
fn recipes_carry_pin_era_rows_and_brazu_is_not_foundry() {
    for id in BRAZ_IDS {
        let r = recipe(id);
        assert_eq!(
            r.throughput_era_param_keys,
            &[
                (2, "budynek_huta_braz_epoka2_przepustowosc"),
                (3, "budynek_huta_braz_epoka3_przepustowosc"),
            ][..],
            "wiersze epok {id}"
        );
        assert!(
            !CONVERTER_FOUNDRY_ERA_RECIPE_IDS.contains(&id),
            "{id} poza zbiorem foundry"
        );
    }
    assert_eq!(
        CONVERTER_FOUNDRY_ERA_RECIPE_IDS,
        [
            "odlewnia_zelaza__zelazo",
            "wielka_odlewnia__zelazo",
            "wielka_odlewnia__stal"
        ]
    );
    for r in DEFAULT_CONVERTER_RECIPES
        .iter()
        .filter(|r| !BRAZ_IDS.contains(&r.id))
    {
        assert!(
            r.throughput_era_param_keys.is_empty(),
            "bez wierszy epok {}",
            r.id
        );
    }
    // Brąz nie mnozy przepustowosci przez m(e) (pin: converterThroughputForEra zwraca baze).
    for era in [1.0, 2.0, 3.0, 5.0] {
        for id in BRAZ_IDS {
            assert_eq!(
                converter_throughput_for_era(id, 50.0, era),
                50.0,
                "{id}@{era}"
            );
        }
    }
}

#[test]
fn era_param_key_matches_pin_for_every_case() {
    let d = vectors();
    let mut checked = 0;
    for c in d["cases"].as_array().unwrap() {
        let era = era_of(&c["era"]);
        for r in DEFAULT_CONVERTER_RECIPES.iter() {
            let want = c["eraParamKey"][r.id].as_str();
            let got = converter_throughput_era_param_key(r, era);
            assert_eq!(got, want, "klucz {} @{era}", r.id);
            checked += 1;
        }
    }
    assert_eq!(
        checked,
        d["cases"].as_array().unwrap().len() * DEFAULT_CONVERTER_RECIPES.len()
    );
}

#[test]
fn era_thresholds_brazu_n_minus_1_n_n_plus_1() {
    let key = |era: f64| converter_throughput_era_param_key(recipe("odlewnia_brazu"), era);
    let val = |era: f64| {
        let raw = serde_json::from_str::<Value>(ECON_PARAMS).unwrap();
        converter_throughputs_for_era(&raw, "normal", era)["odlewnia_brazu"]
    };
    // epoka 1 / <=1 / NaN / +-Inf -> wiersz epoki 2 (configured[0]) = 50
    for e in [
        f64::NAN,
        f64::INFINITY,
        f64::NEG_INFINITY,
        -3.0,
        0.0,
        0.5,
        1.0,
        1.0001,
    ] {
        assert_eq!(
            key(e),
            Some("budynek_huta_braz_epoka2_przepustowosc"),
            "klucz @{e}"
        );
        assert_eq!(val(e), 50.0, "wartosc @{e}");
    }
    // epoka 2 i ulamki < 3 -> 50; 3.0 dokladnie -> 75
    for e in [2.0, 2.001, 2.999] {
        assert_eq!(val(e), 50.0, "@{e}");
    }
    assert_eq!(val(3.0), 75.0);
    assert_eq!(val(3.0001), 75.0);
    assert_eq!(val(4.0), 75.0);
    assert_eq!(val(10.0), 75.0);
    assert_eq!(key(3.0), Some("budynek_huta_braz_epoka3_przepustowosc"));
}

#[test]
fn era_rows_come_from_econ_params_data() {
    let raw: Value = serde_json::from_str(ECON_PARAMS).unwrap();
    let b = &raw["budynki"];
    assert_eq!(b["budynek_huta_braz_epoka2_przepustowosc"]["normal"], 50);
    assert_eq!(b["budynek_huta_braz_epoka2_przepustowosc"]["easy"], 50);
    assert_eq!(b["budynek_huta_braz_epoka2_przepustowosc"]["hard"], 50);
    assert_eq!(b["budynek_huta_braz_epoka3_przepustowosc"]["normal"], 75);
    assert_eq!(b["budynek_huta_braz_epoka3_przepustowosc"]["easy"], 75);
    assert_eq!(b["budynek_huta_braz_epoka3_przepustowosc"]["hard"], 75);
}

#[test]
fn throughputs_match_pin_path1_for_every_case() {
    // Sciezka podgladu (turn-economy.ts:1503). Rust = sciezka ticku; rozni sie tylko huta_only (patrz nizej).
    let d = vectors();
    let raws = &d["rawCases"];
    for c in d["cases"].as_array().unwrap() {
        let era = era_of(&c["era"]);
        let raw_name = c["raw"].as_str().unwrap();
        if raw_name == "huta_only" {
            continue;
        }
        let raw = if raw_name == "econ" {
            serde_json::from_str::<Value>(ECON_PARAMS).unwrap()
        } else {
            raws[raw_name].clone()
        };
        let got = converter_throughputs_for_era(&raw, "normal", era);
        let want = c["path1"].as_object().unwrap();
        assert_eq!(
            got.len(),
            want.len(),
            "liczba kluczy {raw_name} @{era} (sciezka 1)"
        );
        for (k, v) in want {
            assert_eq!(
                got.get(k).copied(),
                v.as_f64(),
                "{k} {raw_name} @{era} (sciezka 1)"
            );
        }
    }
}

#[test]
fn throughputs_match_pin_path2_for_every_case() {
    // Sciezka ticku (turn-economy.ts:2484) == Rust dla WSZYSTKICH wektorow, takze huta_only.
    let d = vectors();
    let raws = &d["rawCases"];
    let mut checked = 0;
    for c in d["cases"].as_array().unwrap() {
        let era = era_of(&c["era"]);
        let raw_name = c["raw"].as_str().unwrap();
        let raw = if raw_name == "econ" {
            serde_json::from_str::<Value>(ECON_PARAMS).unwrap()
        } else {
            raws[raw_name].clone()
        };
        let got = converter_throughputs_for_era(&raw, "normal", era);
        let want = c["path2"].as_object().unwrap();
        assert_eq!(
            got.len(),
            want.len(),
            "liczba kluczy {raw_name} @{era} (sciezka 2)"
        );
        for (k, v) in want {
            assert_eq!(
                got.get(k).copied(),
                v.as_f64(),
                "{k} {raw_name} @{era} (sciezka 2)"
            );
        }
        checked += 1;
    }
    assert_eq!(checked, d["cases"].as_array().unwrap().len());
}

#[test]
fn known_divergence_huta_only_is_reported_not_hidden() {
    // ROZBIEZNOSC Z PINEM (jawna, nieosiagalna w produkcji: econ-params ma wiersze brazu):
    // raw z nadpisana huta=30 i BEZ wierszy brazu. Sciezka ticku (= Rust) -> baza huty 30;
    // sciezka podgladu -> fallback receptury 50.
    let d = vectors();
    let raw = d["rawCases"]["huta_only"].clone();
    let era = 2.0;
    let c = d["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["raw"] == "huta_only" && era_of(&c["era"]) == era)
        .unwrap();
    let got = converter_throughputs_for_era(&raw, "normal", era);
    assert_eq!(got["odlewnia_brazu"], 30.0);
    assert_eq!(c["path2"]["odlewnia_brazu"].as_f64(), Some(30.0));
    assert_eq!(c["path1"]["odlewnia_brazu"].as_f64(), Some(50.0));
    assert_eq!(got["huta"], 30.0);
}

#[test]
fn foundry_and_output_multiplier_unchanged_for_other_recipes() {
    assert_eq!(converter_output_multiplier_for_era("cegielnia", 3.0), 2.0);
    assert_eq!(
        converter_output_multiplier_for_era("odlewnia_brazu", 3.0),
        1.0
    );
    assert_eq!(
        converter_throughput_for_era("odlewnia_zelaza__zelazo", 50.0, 3.0),
        100.0
    );
    assert_eq!(
        converter_throughput_for_era("wielka_odlewnia__stal", 50.0, 2.0),
        75.0
    );
    assert_eq!(converter_throughput_for_era("huta", 50.0, 3.0), 50.0);
}
