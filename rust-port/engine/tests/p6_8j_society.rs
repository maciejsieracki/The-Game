//! P6.8J-P1 - `society-breakdown.ts` (web pin 91dc998a), partia 1: skala % / mianowniki / capy,
//! odczyt wierszy JSON, progi buntu, rozpiski Szczescia i Prawa. Wektory z URUCHOMIONEGO weba
//! (`tests/p6_8j_vectors/society.json`, generator `gen-p6-8j-society-vectors.mjs` w runie
//! `R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1`).
//! Kodowanie: liczba = JSON number; niecalkowita = `{"$f": String(x)}`;
//! NaN/Infinity/-Infinity/-0 = `{"$n": "..."}`; undefined = `{"$undef": true}`; null = null.
//! Zestaw spoleczenstwa `"@society-params.json"` = `data::derived::SOCIETY_PARAMS_JSON` (pelny plik);
//! pozostale zestawy (z NaN zapisanym jako null przez JSON.stringify) sa w wektorze.

use civ_engine::domain::society_breakdown::{
    clamp_pct, compute_happiness_breakdown, compute_law_breakdown, fallback_society_scale,
    is_osiedle_revolt_immune, js_max, js_min, js_num_str, js_round, kult_relig_scale_for_era,
    load_revolt_params, load_society_scale_params, luksus_happiness_bonus, osiedle_pop_label,
    osiedle_pop_max, own_share_from_signal, pct_from_netto, pick_osiedle_pop_bonus,
    praw_garnizon_budynek_for_era, praw_max_for_city, praw_max_for_era, proporcjonalne_szczescie,
    sz_max_for_city, sz_max_for_era, HappinessBreakdownInput, LawBreakdownInput,
};
use civ_engine::domain::types::porzadek::society_params;
use civ_engine::domain::types::Difficulty;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8j_vectors/society.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("wektory parse")
}

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                return s.as_str().expect("$f").parse::<f64>().expect("$f parse");
            }
            match o.get("$n").and_then(Value::as_str).expect("$n") {
                "NaN" => f64::NAN,
                "Infinity" => f64::INFINITY,
                "-Infinity" => f64::NEG_INFINITY,
                "-0" => -0.0,
                other => panic!("nieznane $n: {other}"),
            }
        }
        other => panic!("nie liczba: {other}"),
    }
}

/// `null` / `{"$undef": true}` / brak pola => None; inaczej Some(liczba).
fn opt_num(v: Option<&Value>) -> Option<f64> {
    match v {
        None => None,
        Some(v) if v.is_null() => None,
        Some(v) if v.get("$undef").is_some() => None,
        Some(v) => Some(num(v)),
    }
}

/// Porownanie bit-w-bit (NaN == NaN, -0 != 0), zgodne z `Object.is`.
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn check(actual: f64, expected: f64, ctx: &str) {
    assert!(
        same(actual, expected),
        "{ctx}: rust={actual:?} web={expected:?}"
    );
}

fn difficulty_of(v: &Value) -> Difficulty {
    match v.as_str() {
        Some("easy") => Difficulty::Easy,
        Some("hard") => Difficulty::Hard,
        _ => Difficulty::Normal,
    }
}

/// Zestawy spoleczenstwa z wektora; `"@society-params.json"` = pelny plik z crate.
fn society_for<'a>(sets: &'a Value, name: &str) -> Option<&'a Value> {
    let v = sets.get(name).expect("zestaw");
    if v.is_null() {
        return None;
    }
    if v.as_str() == Some("@society-params.json") {
        return Some(society_params());
    }
    Some(v)
}

fn assert_lines(
    actual: &[civ_engine::domain::society_breakdown::SocietyLine],
    expected: &Value,
    ctx: &str,
) {
    let exp = expected.as_array().expect("lines");
    assert_eq!(actual.len(), exp.len(), "{ctx}: liczba linii");
    for (i, (a, e)) in actual.iter().zip(exp.iter()).enumerate() {
        assert_eq!(a.id, e["id"].as_str().unwrap(), "{ctx}: id linii {i}");
        assert_eq!(
            a.label,
            e["label"].as_str().unwrap(),
            "{ctx}: etykieta linii {i}"
        );
        check(
            a.value,
            num(&e["value"]),
            &format!("{ctx}: wartosc linii {i}"),
        );
    }
}

#[test]
fn scale_params_match_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["scale"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let got = load_society_scale_params(society_for(sets, name), d);
        let e = &case["expected"];
        let ctx = format!("scale {name}/{d:?}");
        let arr = |v: &Value| -> Vec<f64> { v.as_array().unwrap().iter().map(num).collect() };
        assert_eq!(
            got.sz_max_by_era.len(),
            arr(&e["szMaxByEra"]).len(),
            "{ctx} szMaxByEra len"
        );
        for (a, b) in got.sz_max_by_era.iter().zip(arr(&e["szMaxByEra"])) {
            check(*a, b, &format!("{ctx} szMaxByEra"));
        }
        for (a, b) in got.praw_max_by_era.iter().zip(arr(&e["prawMaxByEra"])) {
            check(*a, b, &format!("{ctx} prawMaxByEra"));
        }
        for (a, b) in got
            .praw_garnizon_budynek_by_era
            .iter()
            .zip(arr(&e["prawGarnizonBudynekByEra"]))
        {
            check(*a, b, &format!("{ctx} prawGarnizonBudynekByEra"));
        }
        for (a, b) in got.kult_relig_by_era.iter().zip(arr(&e["kultReligByEra"])) {
            check(*a, b, &format!("{ctx} kultReligByEra"));
        }
        check(
            got.sz_pct_cap,
            num(&e["szPctCap"]),
            &format!("{ctx} szPctCap"),
        );
        check(
            got.praw_pct_cap,
            num(&e["prawPctCap"]),
            &format!("{ctx} prawPctCap"),
        );
        check(
            got.sz_max_pop_wsp,
            num(&e["szMaxPopWsp"]),
            &format!("{ctx} szMaxPopWsp"),
        );
        check(
            got.praw_max_pop_wsp,
            num(&e["prawMaxPopWsp"]),
            &format!("{ctx} prawMaxPopWsp"),
        );
        check(
            got.sz_max_pop_odniesienia,
            num(&e["szMaxPopOdniesienia"]),
            &format!("{ctx} szMaxPopOdniesienia"),
        );
        check(
            got.praw_max_pop_odniesienia,
            num(&e["prawMaxPopOdniesienia"]),
            &format!("{ctx} prawMaxPopOdniesienia"),
        );
    }
}

#[test]
fn scalar_functions_match_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["fns"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let s = society_for(sets, name);
        let scale = load_society_scale_params(s, d);
        let ctx = format!("fn {name}/{d:?}");

        if let Some(era) = case.get("era") {
            let era = num(era);
            if case.get("szMaxForEra").is_some() {
                check(
                    sz_max_for_era(era, &scale),
                    num(&case["szMaxForEra"]),
                    &format!("{ctx} szMaxForEra({era})"),
                );
                check(
                    praw_max_for_era(era, &scale),
                    num(&case["prawMaxForEra"]),
                    &format!("{ctx} prawMaxForEra({era})"),
                );
                check(
                    praw_garnizon_budynek_for_era(era, &scale),
                    num(&case["prawGarnizonBudynekForEra"]),
                    &format!("{ctx} prawGarnizonBudynekForEra({era})"),
                );
                check(
                    kult_relig_scale_for_era(era, &scale),
                    num(&case["kultReligScaleForEra"]),
                    &format!("{ctx} kultReligScaleForEra({era})"),
                );
            }
        }
        if let Some(pop) = case.get("population") {
            let pop = num(pop);
            check(
                sz_max_for_city(2.0, pop, &scale),
                num(&case["szMaxForCity"]),
                &format!("{ctx} szMaxForCity({pop})"),
            );
            check(
                praw_max_for_city(2.0, pop, &scale),
                num(&case["prawMaxForCity"]),
                &format!("{ctx} prawMaxForCity({pop})"),
            );
            check(
                sz_max_for_city(1.0, pop, &scale),
                num(&case["szMaxForCityEra1"]),
                &format!("{ctx} szMaxForCity era1({pop})"),
            );
            check(
                praw_max_for_city(3.0, pop, &scale),
                num(&case["prawMaxForCityEra3"]),
                &format!("{ctx} prawMaxForCity era3({pop})"),
            );
            assert_eq!(
                osiedle_pop_label(pop),
                case["osiedlePopLabel"].as_str().unwrap(),
                "{ctx} label({pop})"
            );
            check(
                osiedle_pop_max(s, d),
                num(&case["osiedlePopMax"]),
                &format!("{ctx} osiedlePopMax"),
            );
            assert_eq!(
                is_osiedle_revolt_immune(pop, s, d),
                case["isOsiedleRevoltImmune"].as_bool().unwrap(),
                "{ctx} isOsiedleRevoltImmune({pop})"
            );
            check(
                luksus_happiness_bonus(pop, s, d),
                num(&case["luksus"]),
                &format!("{ctx} luksus({pop})"),
            );
        }
        if let Some(n) = case.get("netto") {
            let n = num(n);
            check(
                clamp_pct(n, 100.0),
                num(&case["clampPct100"]),
                &format!("{ctx} clampPct100({n})"),
            );
            check(
                clamp_pct(n, 120.0),
                num(&case["clampPct120"]),
                &format!("{ctx} clampPct120({n})"),
            );
            check(
                pct_from_netto(n, 50.0, 120.0),
                num(&case["pctFromNetto50"]),
                &format!("{ctx} pctFromNetto50({n})"),
            );
            check(
                pct_from_netto(n, 0.0, 120.0),
                num(&case["pctFromNettoMax0"]),
                &format!("{ctx} pctFromNettoMax0({n})"),
            );
            check(
                pct_from_netto(n, -4.0, 170.0),
                num(&case["pctFromNettoMaxNeg"]),
                &format!("{ctx} pctFromNettoMaxNeg({n})"),
            );
            check(
                proporcjonalne_szczescie(n, 0.75),
                num(&case["proporcjonalne"]),
                &format!("{ctx} proporcjonalne({n})"),
            );
            check(
                proporcjonalne_szczescie(16.0, n),
                num(&case["proporcjonalneNaN"]),
                &format!("{ctx} proporcjonalneNaN({n})"),
            );
            check(
                own_share_from_signal(Some(n)),
                num(&case["ownShare"]),
                &format!("{ctx} ownShare({n})"),
            );
            check(
                luksus_happiness_bonus(n, s, d),
                num(&case["luksus"]),
                &format!("{ctx} luksus-netto({n})"),
            );
        }
    }
}

#[test]
fn osiedle_and_revolt_match_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["osiedle"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let s = society_for(sets, name);
        if let Some(rev) = case.get("revolt") {
            let got = load_revolt_params(s, d);
            check(
                got.critical_por_pct,
                num(&rev["criticalPorPct"]),
                &format!("revolt {name}/{d:?} crit"),
            );
            check(
                got.grace_turns,
                num(&rev["graceTurns"]),
                &format!("revolt {name}/{d:?} grace"),
            );
            continue;
        }
        let pop = num(&case["population"]);
        let block_sz = s.and_then(|v| v.get("szczescie"));
        let block_pr = s.and_then(|v| v.get("prawo"));
        check(
            pick_osiedle_pop_bonus(block_sz, "szczescie_bonus_osiedle_pop", pop, d, 7.0),
            num(&case["szOsiedle"]),
            &format!("osiedle sz {name}/{d:?}({pop})"),
        );
        check(
            pick_osiedle_pop_bonus(block_pr, "prawo_bonus_osiedle_pop", pop, d, 0.0),
            num(&case["prOsiedle"]),
            &format!("osiedle pr {name}/{d:?}({pop})"),
        );
    }
}

#[test]
fn happiness_breakdown_matches_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["happiness"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let inp = &case["input"];
        let ctx = format!("happiness {} / {name}", case["name"].as_str().unwrap());
        let podzial = inp
            .get("podzialHandlu")
            .and_then(|p| opt_num(p.get("procentLuksus")));
        let input = HappinessBreakdownInput {
            difficulty: inp.get("difficulty").map(difficulty_of),
            era: opt_num(inp.get("era")),
            population: num(&inp["population"]),
            building_zadowolenie: num(&inp["buildingZadowolenie"]),
            ha_rel: opt_num(inp.get("haRel")),
            own_religion_share: opt_num(inp.get("ownReligionShare")),
            ha_wealth: opt_num(inp.get("haWealth")),
            ha_cuda: opt_num(inp.get("haCuda")),
            podzial_procent_luksus: podzial,
            at_war: inp.get("atWar").and_then(Value::as_bool).unwrap_or(false),
            own_culture_share: opt_num(inp.get("ownCultureShare")),
            stolica_easy_bonus: inp
                .get("stolicaEasyBonus")
                .and_then(Value::as_bool)
                .unwrap_or(false),
            citizen_resource_happiness_delta: opt_num(inp.get("citizenResourceHappinessDelta")),
        };
        let got = compute_happiness_breakdown(&input, society_for(sets, name));
        let e = &case["expected"];
        assert_lines(&got.lines, &e["lines"], &ctx);
        check(got.netto, num(&e["netto"]), &format!("{ctx} netto"));
        check(got.sz_max, num(&e["szMax"]), &format!("{ctx} szMax"));
        check(got.sz_pct, num(&e["szPct"]), &format!("{ctx} szPct"));
    }
}

#[test]
fn law_breakdown_matches_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["law"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let inp = &case["input"];
        let ctx = format!("law {} / {name}", case["name"].as_str().unwrap());
        let flag = |k: &str| inp.get(k).and_then(Value::as_bool).unwrap_or(false);
        let input = LawBreakdownInput {
            difficulty: inp.get("difficulty").map(difficulty_of),
            era: opt_num(inp.get("era")),
            population: opt_num(inp.get("population")),
            garnizon_count: num(&inp["garnizonCount"]),
            has_dom_starszyzny: flag("hasDomStarszyzny"),
            has_dwor_zarzadcy: flag("hasDworZarzadcy"),
            has_pretorium: flag("hasPretorium"),
            has_sad: flag("hasSad"),
            has_trybunal: flag("hasTrybunal"),
            has_palac: flag("hasPalac"),
            palac_tier: opt_num(inp.get("palacTier")).map(|t| t as u8),
            stolica_easy_bonus: flag("stolicaEasyBonus"),
            has_garnizon_budynek: flag("hasGarnizonBudynek"),
        };
        let got = compute_law_breakdown(&input, society_for(sets, name));
        let e = &case["expected"];
        assert_lines(&got.lines, &e["lines"], &ctx);
        check(got.netto, num(&e["netto"]), &format!("{ctx} netto"));
        check(got.praw_max, num(&e["prawMax"]), &format!("{ctx} prawMax"));
        check(got.praw_pct, num(&e["prawPct"]), &format!("{ctx} prawPct"));
    }
}

// --- testy jednostkowe semantyki JS (kotwice dla mutacji) ---

#[test]
fn js_math_semantics() {
    // Math.round: polowki w strone +inf; ujemne zaokraglajace do zera daja -0.
    assert!(same(js_round(-0.5), -0.0));
    assert!(same(js_round(-0.4), -0.0));
    assert!(same(js_round(0.5), 1.0));
    assert!(same(js_round(-1.5), -1.0));
    assert!(same(js_round(2.4999), 2.0));
    // Math.max/min: +0 wygrywa z -0 w max, -0 w min; NaN propaguje.
    assert!(same(js_max(0.0, -0.0), 0.0));
    assert!(same(js_min(0.0, -0.0), -0.0));
    assert!(js_max(0.0, f64::NAN).is_nan());
    assert!(js_min(f64::NAN, 1.0).is_nan());
    assert_eq!(js_num_str(-0.0), "0");
    assert_eq!(js_num_str(f64::NAN), "NaN");
    assert_eq!(js_num_str(7.0), "7");
}

#[test]
fn fallback_scale_is_normal_column() {
    // Fallback = kolumna `normal` z danych (konwencja R4 w komentarzach web).
    let f = fallback_society_scale();
    assert_eq!(f.sz_max_by_era, vec![30.0, 50.0, 70.0]);
    assert_eq!(f.praw_max_by_era, vec![40.0, 65.0, 85.0]);
    assert_eq!(f.kult_relig_by_era, vec![10.0, 16.0, 23.0]);
    assert_eq!(f.sz_max_pop_wsp, 0.04);
    assert_eq!(f.praw_max_pop_odniesienia, 2.0);
}

#[test]
fn era_table_edge_cases_match_web() {
    // Web maxFromEraTable: pusta tablica -> 24; era NaN/Inf -> epoka 1; era > len -> ostatni
    // wpis; era <= 0 -> epoka 1; niefinitny wpis -> 24.
    let mut s = fallback_society_scale();
    s.sz_max_by_era = vec![];
    assert_eq!(sz_max_for_era(1.0, &s), 24.0, "empty table fallback");
    assert_eq!(sz_max_for_era(f64::NAN, &s), 24.0, "empty table, NaN era");

    let mut t = fallback_society_scale();
    t.sz_max_by_era = vec![11.0, 22.0, 33.0];
    assert_eq!(sz_max_for_era(f64::NAN, &t), 11.0, "NaN era -> epoka 1");
    assert_eq!(
        sz_max_for_era(f64::INFINITY, &t),
        11.0,
        "Inf era -> epoka 1"
    );
    assert_eq!(sz_max_for_era(0.0, &t), 11.0, "era 0 -> epoka 1");
    assert_eq!(sz_max_for_era(2.9, &t), 22.0, "era floor");
    assert_eq!(
        sz_max_for_era(9.0, &t),
        33.0,
        "era above length -> last entry"
    );

    t.sz_max_by_era = vec![f64::NAN, 22.0];
    assert_eq!(sz_max_for_era(1.0, &t), 24.0, "non-finite entry -> 24");
}
