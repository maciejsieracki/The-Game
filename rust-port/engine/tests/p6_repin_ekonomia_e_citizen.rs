//! REPIN-EKONOMIA-E (pin weba 4bbef081d), czesc 1: stawka utrzymania obywateli per epoka
//! (`citizen-resource-upkeep.ts`: `citizenUpkeepRateForEra`, `resolveCitizenResourceCoverage(era, stock, population?)`,
//! `computeCitizenResourceDrain`, `citizenUpkeepDisplayLines` z `coverage.ratePerCitizen`).
//!
//! Wektory: `tests/p6_repin_ekonomia_e_vectors/citizen.json` z URUCHOMIONEGO weba @ 4bbef081d
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-E-SPICHLERZ-STAWKA-Q1/gen-repin-ekonomia-e-vectors.mjs`),
//! 8 wariantow tabeli (wariant `real` = niezmieniony plik z pinu, stawki 1/2/3). Porownanie BITOWE f64
//! (zero: `happ`/`growth` sa i64 w Rust, a w JS bywa `-0` - porownywane wartosciowo).

use std::collections::BTreeMap;

use civ_engine::data::economy_society::{
    parse_citizen_resource_upkeep, CitizenResourceUpkeep, CitizenResourceUpkeepEpoki,
};
use civ_engine::domain::resource_production::{
    citizen_required_resources_for_era, citizen_upkeep_display_lines, citizen_upkeep_rate_for_era,
    compute_citizen_resource_drain, resolve_citizen_resource_coverage, CitizenUpkeepCoverage,
    CITIZEN_UPKEEP_RATE_PER_CITIZEN,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekonomia_e_vectors/citizen.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory citizen.json")
}

/// Liczba z wektora: liczba JSON albo napis "NaN"/"Infinity"/"-Infinity"/"-0"/"~<zapis JS>".
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => other
                .strip_prefix('~')
                .unwrap_or_else(|| panic!("nieznany napis liczbowy {other}"))
                .parse::<f64>()
                .expect("ulamek"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("lista")
        .iter()
        .map(|x| x.as_str().expect("napis").to_owned())
        .collect()
}

/// Tabela wariantu: `rows == null` => realny plik; inaczej realny plik z podmienionymi wierszami.
/// Stawka wiersza: `{t:'n'}` => `Some(liczba)`, `{t:'x'}` (brak/null/napis/bool) => `None` (web: nie-liczba).
fn tables(v: &Value) -> Vec<CitizenResourceUpkeep> {
    v["variants"]
        .as_array()
        .expect("variants")
        .iter()
        .map(|variant| {
            let mut t = parse_citizen_resource_upkeep().expect("citizen-resource-upkeep.json");
            if let Some(rows) = variant["rows"].as_array() {
                t.epoki = rows
                    .iter()
                    .map(|r| CitizenResourceUpkeepEpoki {
                        epoka: r["epoka"].as_i64().expect("epoka"),
                        nazwa: r["nazwa"].as_str().expect("nazwa").to_owned(),
                        stawka_na_obywatela: match r["rate"]["t"].as_str().expect("t") {
                            "n" => Some(num(&r["rate"]["v"])),
                            _ => None,
                        },
                        surowce: strings(&r["surowce"]),
                    })
                    .collect();
            }
            t
        })
        .collect()
}

fn stock_of(v: &Value) -> Option<BTreeMap<String, f64>> {
    v.as_object()
        .map(|m| m.iter().map(|(k, x)| (k.clone(), num(x))).collect())
}

fn assert_cov(label: &str, got: &CitizenUpkeepCoverage, want: &Value) {
    assert_eq!(got.required, strings(&want["required"]), "{label} required");
    assert_eq!(
        got.available,
        strings(&want["available"]),
        "{label} available"
    );
    assert_eq!(got.missing, strings(&want["missing"]), "{label} missing");
    assert_eq!(
        got.happiness_delta as f64,
        num(&want["happ"]),
        "{label} happ"
    );
    assert_eq!(
        got.growth_pct_delta as f64,
        num(&want["growth"]),
        "{label} growth"
    );
    match (&want["rate"], got.rate_per_citizen) {
        (Value::Null, None) => {}
        (w, Some(g)) if !w.is_null() => assert_bits(&format!("{label} rate"), g, num(w)),
        (w, g) => panic!("{label} rate: rust={g:?} web={w}"),
    }
}

#[test]
fn real_file_has_no_row_rates_and_era_rate_is_m_of_e() {
    // REPIN-EKONOMIA-F (web 16c0509f6): pole `stawkaNaObywatela` USUNIETE z pliku; stawka = 1,0 x m(e).
    let v = vectors();
    let t = parse_citizen_resource_upkeep().expect("tabela");
    let want = v["realRates"].as_array().expect("realRates");
    assert_eq!(t.epoki.len(), want.len());
    for (row, w) in t.epoki.iter().zip(want) {
        assert_eq!(row.epoka, w["epoka"].as_i64().expect("epoka"));
        assert!(w["stawka"].is_null(), "web: brak pola w wierszu");
        assert_eq!(row.stawka_na_obywatela, None, "epoka {}", row.epoka);
    }
    let rates: Vec<f64> = t
        .epoki
        .iter()
        .map(|r| citizen_upkeep_rate_for_era(&t, r.epoka as f64))
        .collect();
    assert_eq!(rates, vec![1.0, 1.5, 2.0]);
    assert_eq!(CITIZEN_UPKEEP_RATE_PER_CITIZEN, 1.0);
}

#[test]
fn missing_rate_field_parses_as_none_and_round_trips() {
    // Stary format pliku (bez `stawkaNaObywatela`) nadal sie parsuje (web: `stawkaNaObywatela?`).
    let text = r#"{"_opis":"x","_kara":{"_opis":"k","szczescieZaDostepny":2,"szczescieZaBrakujacy":-2,"rozwojPctZaBrakujacy":-1},"epoki":[{"epoka":1,"nazwa":"K","surowce":["drewno"]}]}"#;
    let t: CitizenResourceUpkeep = serde_json::from_str(text).expect("stary format");
    assert_eq!(t.epoki[0].stawka_na_obywatela, None);
    assert_eq!(citizen_upkeep_rate_for_era(&t, 1.0), 1.0);
    let back = serde_json::to_string(&t).expect("ser");
    assert!(
        !back.contains("stawkaNaObywatela"),
        "None nie jest serializowane"
    );
    let with = text.replace(r#""nazwa":"K""#, r#""nazwa":"K","stawkaNaObywatela":2"#);
    let t2: CitizenResourceUpkeep = serde_json::from_str(&with).expect("nowy format");
    assert_eq!(t2.epoki[0].stawka_na_obywatela, Some(2.0));
    // REPIN-EKONOMIA-F: stawka wiersza jest IGNOROWANA (web liczy 1,0 x m(e)), era 1 => 1,0.
    assert_eq!(citizen_upkeep_rate_for_era(&t2, 1.0), 1.0);
    // round-trip zachowuje calkowitosc (data_compliance liczy int vs float): `2`, nie `2.0`.
    let back2 = serde_json::to_string(&t2).expect("ser");
    assert!(
        back2.contains(r#""stawkaNaObywatela":2,"#),
        "stawka calkowita serializowana jako int: {back2}"
    );
}

#[test]
fn rate_and_required_grid_match_web() {
    let v = vectors();
    let ts = tables(&v);
    let grid = v["rateGrid"].as_array().expect("rateGrid");
    assert!(grid.len() >= 100, "siatka {}", grid.len());
    for (i, c) in grid.iter().enumerate() {
        let t = &ts[c["v"].as_u64().expect("v") as usize];
        let era = num(&c["era"]);
        assert_bits(
            &format!("rateGrid #{i} era={era:?}"),
            citizen_upkeep_rate_for_era(t, era),
            num(&c["rate"]),
        );
        assert_eq!(
            citizen_required_resources_for_era(t, era),
            strings(&c["required"]).as_slice(),
            "rateGrid #{i} required"
        );
    }
}

#[test]
fn coverage_drain_lines_match_running_web() {
    let v = vectors();
    let ts = tables(&v);
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 2200, "przypadkow {}", cases.len());
    let (mut per_era, mut fallback, mut custom, mut gate_differs, mut deds, mut partial) =
        (0, 0, 0, 0, 0, 0);
    for (i, c) in cases.iter().enumerate() {
        let vi = c["v"].as_u64().expect("v") as usize;
        let t = &ts[vi];
        let era = num(&c["era"]);
        let pop = if c["pop"].is_null() {
            None
        } else {
            Some(num(&c["pop"]))
        };
        let st = stock_of(&c["stock"]);
        let label = format!("#{i} v={vi} era={era:?} pop={pop:?} kind={}", c["kind"]);

        let rate = citizen_upkeep_rate_for_era(t, era);
        assert_bits(&format!("{label} rate"), rate, num(&c["rate"]));
        assert_eq!(
            citizen_required_resources_for_era(t, era),
            strings(&c["required"]).as_slice(),
            "{label} required"
        );

        let legacy = resolve_citizen_resource_coverage(t, era, st.as_ref(), None);
        assert_cov(&format!("{label} legacy"), &legacy, &c["covLegacy"]);
        let with_pop = resolve_citizen_resource_coverage(t, era, st.as_ref(), pop);
        assert_cov(&format!("{label} covPop"), &with_pop, &c["covPop"]);
        gate_differs += usize::from(with_pop.available != legacy.available);

        let drain = compute_citizen_resource_drain(t, era, pop.unwrap_or(0.0), st.as_ref());
        assert_cov(&format!("{label} drain"), &drain.coverage, &c["drain"]);
        let want_ded = c["drain"]["ded"].as_object().expect("ded");
        assert_eq!(
            drain.deductions.len(),
            want_ded.len(),
            "{label} deductions keys"
        );
        for (k, w) in want_ded {
            let g = *drain
                .deductions
                .get(k)
                .unwrap_or_else(|| panic!("{label} brak {k}"));
            assert_bits(&format!("{label} deduction {k}"), g, num(w));
        }

        let city_pop = pop.unwrap_or(7.0);
        let got = citizen_upkeep_display_lines(&drain.coverage, city_pop);
        let want = c["lines"].as_array().expect("lines");
        assert_eq!(got.len(), want.len(), "{label} liczba wierszy");
        for (g, w) in got.iter().zip(want) {
            assert_eq!(g.key, w["key"].as_str().expect("key"), "{label} key");
            assert_bits(
                &format!("{label} line {}", g.key),
                g.value,
                num(&w["value"]),
            );
            assert_eq!(g.available, w["available"].as_bool().expect("available"));
        }

        // Spojnosc wewnetrzna: bramka z populacja == bramka drenazu dla tych samych wejsc
        // (web: komentarz `citizen-resource-upkeep.ts:240-245`), gdy populacja jest skonczona.
        if pop.is_some_and(f64::is_finite) {
            assert_eq!(with_pop.available, drain.coverage.available, "{label} gate");
            assert_eq!(with_pop.missing, drain.coverage.missing, "{label} gate");
        }

        if vi == 0 && [1.0, 2.0, 3.0].contains(&rate) {
            per_era += 1;
        } else if vi != 0 && rate == 1.0 {
            fallback += 1;
        } else if vi != 0 {
            custom += 1;
        }
        deds += usize::from(!want_ded.is_empty());
        partial +=
            usize::from(!drain.coverage.available.is_empty() && !drain.coverage.missing.is_empty());
    }
    // Pokrycie wektorow: rozne galezie sa realnie odwiedzone.
    assert!(
        per_era > 500,
        "za malo przypadkow ze stawka epoki: {per_era}"
    );
    assert!(fallback > 500, "za malo przypadkow fallback: {fallback}");
    assert!(custom > 300, "za malo przypadkow z wlasna stawka: {custom}");
    assert!(
        gate_differs > 100,
        "bramka z populacja rzadko rozni sie od legacy: {gate_differs}"
    );
    assert!(deds > 400, "za malo odjec: {deds}");
    assert!(partial > 200, "za malo pokryc czesciowych: {partial}");
}

#[test]
fn display_lines_use_rate_from_coverage_like_web() {
    let v = vectors();
    let cases = v["display"].as_array().expect("display");
    assert!(cases.len() >= 300, "display {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let rate = if c["rate"].is_null() {
            None
        } else {
            Some(num(&c["rate"]))
        };
        let cov = CitizenUpkeepCoverage {
            required: Vec::new(),
            rate_per_citizen: rate,
            available: strings(&c["available"]),
            missing: strings(&c["missing"]),
            happiness_delta: 0,
            growth_pct_delta: 0,
        };
        let city_pop = num(&c["cityPop"]);
        let got = citizen_upkeep_display_lines(&cov, city_pop);
        let want = c["lines"].as_array().expect("lines");
        assert_eq!(got.len(), want.len(), "display #{i}");
        for (g, w) in got.iter().zip(want) {
            assert_eq!(g.key, w["key"].as_str().expect("key"));
            assert_bits(
                &format!("display #{i} rate={rate:?} pop={city_pop:?} {}", g.key),
                g.value,
                num(&w["value"]),
            );
            assert_eq!(g.available, w["available"].as_bool().expect("available"));
        }
    }
}

/// Brzegi N-1 / N / N+1 dla progu `magazyn >= floor(pop * stawka)` na realnej tabeli (REPIN-EKONOMIA-F:
/// stawki 1,0 x m(e) = 1 / 1,5 / 2): Braz (stawka 1,5), 7 obywateli => N = floor(10,5) = 10.
#[test]
fn edge_n_minus_1_n_plus_1_real_table_bronze() {
    let t = parse_citizen_resource_upkeep().expect("tabela");
    let stock = |x: f64| -> BTreeMap<String, f64> {
        ["drewno", "glina", "kamien", "ceramika"]
            .iter()
            .map(|k| ((*k).to_owned(), x))
            .collect()
    };
    for (have, covered) in [(9.0, false), (10.0, true), (11.0, true)] {
        let st = stock(have);
        let d = compute_citizen_resource_drain(&t, 2.0, 7.0, Some(&st));
        assert_eq!(d.coverage.available.len(), if covered { 4 } else { 0 });
        assert_eq!(d.coverage.rate_per_citizen, Some(1.5));
        let p = resolve_citizen_resource_coverage(&t, 2.0, Some(&st), Some(7.0));
        assert_eq!(p.available, d.coverage.available, "have={have}");
        // bez populacji: stara bramka „magazyn > 0” (zgodnosc wsteczna)
        let l = resolve_citizen_resource_coverage(&t, 2.0, Some(&st), None);
        assert_eq!(l.available.len(), 4);
    }
    // Zelazo: stawka 2,0 => N = 14
    for (have, covered) in [(13.0, false), (14.0, true), (15.0, true)] {
        let mut st = stock(have);
        st.insert("cegla".to_owned(), have);
        let d = compute_citizen_resource_drain(&t, 3.0, 7.0, Some(&st));
        assert_eq!(d.coverage.available.len(), if covered { 5 } else { 0 });
        assert_eq!(d.coverage.rate_per_citizen, Some(2.0));
    }
    // era 4+ => lista surowcow z wiersza najwyzszej epoki, ale stawka dalej rosnie: m(4) = 2,5
    assert_eq!(citizen_upkeep_rate_for_era(&t, 4.0), 2.5);
    assert_eq!(
        citizen_upkeep_rate_for_era(&t, 1e9),
        1.0 + 0.5 * (1e9 - 1.0)
    );
    assert_eq!(citizen_upkeep_rate_for_era(&t, 0.0), 1.0);
    assert_eq!(citizen_upkeep_rate_for_era(&t, f64::NAN), 1.0);
    assert_eq!(citizen_upkeep_rate_for_era(&t, 1.9999), 1.0);
    assert_eq!(citizen_upkeep_rate_for_era(&t, 2.0), 1.5);
    assert_eq!(citizen_upkeep_rate_for_era(&t, 2.9999), 1.5);
    assert_eq!(citizen_upkeep_rate_for_era(&t, 3.0), 2.0);
}

/// REPIN-EKONOMIA-F: stawka wiersza (nawet NaN/Inf/ujemna/0) nie wplywa na stawke epoki - web liczy
/// 1,0 x m(e) i NIE czyta pola `stawkaNaObywatela`.
#[test]
fn row_rates_of_any_value_are_ignored() {
    let mut t = parse_citizen_resource_upkeep().expect("tabela");
    for bad in [
        f64::NAN,
        f64::INFINITY,
        f64::NEG_INFINITY,
        -1.0,
        -0.0001,
        0.0,
        7.0,
    ] {
        for row in &mut t.epoki {
            row.stawka_na_obywatela = Some(bad);
        }
        for (era, want) in [(1.0, 1.0), (2.0, 1.5), (3.0, 2.0)] {
            assert_eq!(citizen_upkeep_rate_for_era(&t, era), want, "bad={bad:?}");
        }
    }
    // zerowa stawka wiersza nie wylacza drenazu: need = floor(10 * 1,5) = 15 > 0
    let d = compute_citizen_resource_drain(&t, 2.0, 10.0, None);
    assert_eq!(
        d.coverage.available.len(),
        0,
        "brak magazynu => brak pokrycia"
    );
}
