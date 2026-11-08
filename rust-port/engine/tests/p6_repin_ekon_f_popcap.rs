//! REPIN-EKONOMIA-F partia 3 (R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1): limit ludnosci po
//! R-WEB-POPCAP-SPICHLERZ2-12-AKWEDUKT-20-Q1 - drabinka 4 stopni (Akwedukt 20 > Spichlerz II 12 >
//! Spichlerz I 8 > brak 5), clamp `akwedukt_max_ludnosci + 2`, fallbacki `loadEconParams` (12 / 20).
//! Wektory z URUCHOMIONEGO weba `origin/main` `16c0509f6`
//! (`gen-ekonf-popcap-vectors.mjs`, `tests/p6_repin_ekon_f_vectors/popcap.json`).

use civ_engine::domain::city_growth::p6_7a::{city_population_cap, PopCapParams};
use civ_engine::domain::city_growth::{
    city_population_cap_tiered, CityGrowthParams, DEFAULT_AQUEDUCT_POPULATION_CAP,
    DEFAULT_GRANARY_TIER_TWO_POPULATION_CAP,
};
use civ_engine::domain::economy_city_params::load_econ_params;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekon_f_vectors/popcap.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("popcap.json")
}

/// Liczba z wektora: napis ("NaN", "Infinity", "-Infinity", "-0", zapis JS) albo `null` = brak.
fn num(v: &Value) -> Option<f64> {
    match v {
        Value::Null => None,
        Value::String(s) => Some(match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => other.parse::<f64>().expect("liczba"),
        }),
        other => panic!("oczekiwano napisu/null, jest {other}"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

#[test]
fn city_population_cap_matches_running_web() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 880, "za malo wektorow: {}", cases.len());
    let (mut tier_ii, mut aqueduct, mut clamped, mut no_ii_param) = (0, 0, 0, 0);
    for (i, c) in cases.iter().enumerate() {
        let p = &c["p"];
        let params = PopCapParams {
            akwedukt_prog_ludnosci: num(&p["akwProg"]).expect("akwProg"),
            spichlerz_prog_ludnosci: num(&p["spProg"]).expect("spProg"),
            spichlerz_ii_prog_ludnosci: num(&p["sp2Prog"]),
            akwedukt_max_ludnosci: num(&p["akwMax"]).expect("akwMax"),
        };
        let got = city_population_cap(
            c["akw"].as_bool().unwrap(),
            c["sp"].as_bool().unwrap(),
            &params,
            num(&c["delta"]).expect("delta"),
            c["sp2"].as_bool().unwrap(),
        );
        let want = num(&c["out"]).expect("out");
        assert!(same(got, want), "#{i} {c}: rust={got:?} web={want:?}");
        tier_ii += usize::from(c["sp2"].as_bool().unwrap() && !c["akw"].as_bool().unwrap());
        aqueduct += usize::from(c["akw"].as_bool().unwrap());
        no_ii_param += usize::from(params.spichlerz_ii_prog_ludnosci.is_none());
        clamped += usize::from(
            got == params.akwedukt_max_ludnosci + 2.0 && params.akwedukt_max_ludnosci.is_finite(),
        );
    }
    // Pokrycie galezi: Spichlerz II, Akwedukt, brak parametru II (spadek do I), clamp gorny.
    assert!(
        tier_ii > 100 && aqueduct > 100 && no_ii_param > 100,
        "{tier_ii} {aqueduct} {no_ii_param}"
    );
    assert!(clamped > 5, "za malo przypadkow z clampem: {clamped}");
}

#[test]
fn canonical_ladder_5_8_12_20_and_boundaries() {
    let p = PopCapParams {
        akwedukt_prog_ludnosci: 5.0,
        spichlerz_prog_ludnosci: 8.0,
        spichlerz_ii_prog_ludnosci: Some(12.0),
        akwedukt_max_ludnosci: 20.0,
    };
    assert_eq!(city_population_cap(false, false, &p, 0.0, false), 5.0);
    assert_eq!(city_population_cap(false, true, &p, 0.0, false), 8.0);
    assert_eq!(city_population_cap(false, true, &p, 0.0, true), 12.0);
    assert_eq!(city_population_cap(false, false, &p, 0.0, true), 12.0);
    assert_eq!(city_population_cap(true, false, &p, 0.0, false), 20.0);
    assert_eq!(city_population_cap(true, true, &p, 0.0, true), 20.0);
    // delta macierzy (+2 maks): clamp akwedukt_max + 2 = 22; N-1 / N / N+1 wokol sufitu
    assert_eq!(city_population_cap(true, false, &p, 2.0, false), 22.0);
    assert_eq!(city_population_cap(true, false, &p, 1.0, false), 21.0);
    assert_eq!(city_population_cap(true, false, &p, 3.0, false), 20.0); // delta spoza dozwolonych = 0
                                                                        // brak parametru II -> spadek do Spichlerza I
    let no2 = PopCapParams {
        spichlerz_ii_prog_ludnosci: None,
        ..p
    };
    assert_eq!(city_population_cap(false, true, &no2, 0.0, true), 8.0);
    // niefinitowy akwedukt_max -> brak sufitu (NaN nie blokuje)
    let inf = PopCapParams {
        akwedukt_max_ludnosci: f64::NAN,
        ..p
    };
    assert_eq!(city_population_cap(false, true, &inf, 1.0, false), 9.0);
}

#[test]
fn load_econ_params_popcap_fields_match_web() {
    let v = vectors();
    for (i, c) in v["loadCases"]
        .as_array()
        .expect("loadCases")
        .iter()
        .enumerate()
    {
        let raw: Value = serde_json::from_str(c["raw"].as_str().unwrap()).expect("raw");
        let e = load_econ_params(&raw, c["diff"].as_str().unwrap());
        for (label, got, key) in [
            ("spProg", e.spichlerz_prog_ludnosci, "spProg"),
            ("sp2Prog", e.spichlerz_ii_prog_ludnosci, "sp2Prog"),
            ("akwMax", e.akwedukt_max_ludnosci, "akwMax"),
            ("akwProg", e.akwedukt_prog_ludnosci, "akwProg"),
        ] {
            let want = num(&c[key]).expect(key);
            assert!(
                same(got, want),
                "load #{i} {} {label}: rust={got:?} web={want:?}",
                c["name"]
            );
        }
    }
}

#[test]
fn simple_growth_module_four_step_defaults() {
    let p = CityGrowthParams::default();
    assert_eq!(DEFAULT_AQUEDUCT_POPULATION_CAP, 20);
    assert_eq!(DEFAULT_GRANARY_TIER_TWO_POPULATION_CAP, 12);
    assert_eq!(city_population_cap_tiered(false, false, false, &p), 5);
    assert_eq!(city_population_cap_tiered(false, true, false, &p), 8);
    assert_eq!(city_population_cap_tiered(false, true, true, &p), 12);
    assert_eq!(city_population_cap_tiered(true, true, true, &p), 20);
    assert_eq!(city_population_cap_tiered(true, false, false, &p), 20);
}
