//! P6.2 - `order.ts` (Porzadek miasta) z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_23_vectors/order.json`, generator `gen-p623-vectors.mjs`, kod weba bez stubow).
//! Kazdy przypadek porownuje WSZYSTKIE pola wyniku Rust z wynikiem weba (rowne liczbowo).

#[path = "p6_23_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::domain::types::porzadek::{
    compute_order, evaluate_order, fallback_order_params, happiness_breakdown, load_order_params,
    order_effects, order_effects_to_yield_mults, order_tier, pick_revolt_migration_target,
    society_params, OrderEffects, OrderInputs, OrderParams, OrderTier, RevoltMigrationCity,
};
use civ_engine::domain::Difficulty;
use common::{assert_same, cases, num, opt_num};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_23_vectors/order.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("order.json parse")
}

fn difficulty(name: &str) -> Difficulty {
    match name {
        "easy" => Difficulty::Easy,
        "normal" => Difficulty::Normal,
        "hard" => Difficulty::Hard,
        other => panic!("nieznany poziom trudnosci {other}"),
    }
}

fn tier_from_web(name: &str) -> OrderTier {
    match name {
        "unrest" => OrderTier::Unrest,
        "order" => OrderTier::Order,
        // Web `orderEffects` ma galaz `default` -> neutral; enum Rust jest zamkniety, wiec
        // nieznana nazwa (wektor `bogus`) odwzorowuje sie na Neutral.
        _ => OrderTier::Neutral,
    }
}

fn tier_name(tier: OrderTier) -> &'static str {
    match tier {
        OrderTier::Unrest => "unrest",
        OrderTier::Neutral => "neutral",
        OrderTier::Order => "order",
    }
}

fn params_from(value: &Value) -> OrderParams {
    let field = |key: &str| num(&value[key]);
    OrderParams {
        waga_szczescie: field("wagaSzczescie"),
        waga_prawo: field("wagaPrawo"),
        prog_t1: field("progT1"),
        prog_t2: field("progT2"),
        kara_produkcja_t1: field("karaProdukcjaT1"),
        kara_pieniadz_t1: field("karaPieniadzT1"),
        kara_nauka_t1: field("karaNaukaT1"),
        kara_kultura_t1: field("karaKulturaT1"),
        kara_wzrost_t1: field("karaWzrostT1"),
        ryzyko_buntu_t1: field("ryzykoBuntuT1"),
        bonus_produkcja_t2: field("bonusProdukcjaT2"),
        bonus_handel_t2: field("bonusHandelT2"),
        por_pct_cap: opt_num(value.get("porPctCap")),
    }
}

fn assert_params(label: &str, got: &OrderParams, want: &OrderParams) {
    assert_same(
        &format!("{label}.waga_szczescie"),
        got.waga_szczescie,
        want.waga_szczescie,
    );
    assert_same(
        &format!("{label}.waga_prawo"),
        got.waga_prawo,
        want.waga_prawo,
    );
    assert_same(&format!("{label}.prog_t1"), got.prog_t1, want.prog_t1);
    assert_same(&format!("{label}.prog_t2"), got.prog_t2, want.prog_t2);
    assert_same(
        &format!("{label}.kara_produkcja_t1"),
        got.kara_produkcja_t1,
        want.kara_produkcja_t1,
    );
    assert_same(
        &format!("{label}.kara_pieniadz_t1"),
        got.kara_pieniadz_t1,
        want.kara_pieniadz_t1,
    );
    assert_same(
        &format!("{label}.kara_nauka_t1"),
        got.kara_nauka_t1,
        want.kara_nauka_t1,
    );
    assert_same(
        &format!("{label}.kara_kultura_t1"),
        got.kara_kultura_t1,
        want.kara_kultura_t1,
    );
    assert_same(
        &format!("{label}.kara_wzrost_t1"),
        got.kara_wzrost_t1,
        want.kara_wzrost_t1,
    );
    assert_same(
        &format!("{label}.ryzyko_buntu_t1"),
        got.ryzyko_buntu_t1,
        want.ryzyko_buntu_t1,
    );
    assert_same(
        &format!("{label}.bonus_produkcja_t2"),
        got.bonus_produkcja_t2,
        want.bonus_produkcja_t2,
    );
    assert_same(
        &format!("{label}.bonus_handel_t2"),
        got.bonus_handel_t2,
        want.bonus_handel_t2,
    );
    assert_eq!(
        got.por_pct_cap.is_some(),
        want.por_pct_cap.is_some(),
        "{label}.por_pct_cap obecnosc"
    );
    if let (Some(got_cap), Some(want_cap)) = (got.por_pct_cap, want.por_pct_cap) {
        assert_same(&format!("{label}.por_pct_cap"), got_cap, want_cap);
    }
}

fn effects_from(value: &Value) -> OrderEffects {
    OrderEffects {
        production_mult: num(&value["productionMult"]),
        pieniadz_mult: num(&value["pieniadzMult"]),
        nauka_mult: num(&value["naukaMult"]),
        kultura_mult: num(&value["kulturaMult"]),
        growth_mult: num(&value["growthMult"]),
        trade_mult: num(&value["tradeMult"]),
        revolt_risk: num(&value["revoltRisk"]),
    }
}

fn assert_effects(label: &str, got: &OrderEffects, want: &OrderEffects) {
    assert_same(
        &format!("{label}.production_mult"),
        got.production_mult,
        want.production_mult,
    );
    assert_same(
        &format!("{label}.pieniadz_mult"),
        got.pieniadz_mult,
        want.pieniadz_mult,
    );
    assert_same(
        &format!("{label}.nauka_mult"),
        got.nauka_mult,
        want.nauka_mult,
    );
    assert_same(
        &format!("{label}.kultura_mult"),
        got.kultura_mult,
        want.kultura_mult,
    );
    assert_same(
        &format!("{label}.growth_mult"),
        got.growth_mult,
        want.growth_mult,
    );
    assert_same(
        &format!("{label}.trade_mult"),
        got.trade_mult,
        want.trade_mult,
    );
    assert_same(
        &format!("{label}.revolt_risk"),
        got.revolt_risk,
        want.revolt_risk,
    );
}

fn inputs_from(value: &Value) -> OrderInputs {
    OrderInputs {
        szczescie: num(&value["szczescie"]),
        prawo: num(&value["prawo"]),
    }
}

/// Zestaw parametrow wektora: nazwa z `paramSets`, wpis `paramsInline` albo domyslny (`null`).
fn case_params(root: &Value, case: &Value) -> OrderParams {
    if let Some(inline) = case.get("paramsInline") {
        return params_from(inline);
    }
    match case["params"].as_str() {
        Some(name) => params_from(&root["paramSets"][name]),
        None => fallback_order_params(),
    }
}

#[test]
fn fallback_params_equal_web_constant() {
    let root = root();
    assert_params(
        "FALLBACK_ORDER_PARAMS",
        &fallback_order_params(),
        &params_from(&root["fallback_order_params"]),
    );
}

#[test]
fn engine_society_params_match_web_subset_used_by_vectors() {
    let root = root();
    let society = society_params();
    assert_eq!(society["porzadek"], root["society_real_subset"]["porzadek"]);
    assert_eq!(
        society["szczescie"]["szczescie_pct_cap"],
        root["society_real_subset"]["szczescie"]["szczescie_pct_cap"]
    );
}

#[test]
fn load_order_params_matches_web() {
    let root = root();
    let mut checked = 0;
    for case in cases(&root, "loadOrderParams") {
        let name = case["society"].as_str().expect("society");
        let society: Option<&Value> = match name {
            "real" => Some(society_params()),
            "nullSociety" | "undefinedSociety" => None,
            other => Some(&root["societies"][other]),
        };
        let level = case["difficulty"]
            .as_str()
            .map_or(Difficulty::Normal, difficulty);
        let got = load_order_params(society, level);
        assert_params(
            &format!("loadOrderParams {name}/{level:?}"),
            &got,
            &params_from(&case["out"]),
        );
        checked += 1;
    }
    assert_eq!(checked, 44);
}

#[test]
fn compute_order_matches_web() {
    let root = root();
    let all = cases(&root, "computeOrder");
    assert!(all.len() > 3000);
    for case in all {
        let params = case_params(&root, case);
        let inputs = inputs_from(&case["inputs"]);
        assert_same(
            &format!("computeOrder {:?}", case["inputs"]),
            compute_order(inputs, &params),
            num(&case["out"]),
        );
    }
}

#[test]
fn order_tier_matches_web() {
    let root = root();
    for case in cases(&root, "orderTier") {
        let params = case_params(&root, case);
        let got = order_tier(num(&case["order"]), &params);
        assert_eq!(
            tier_name(got),
            case["out"].as_str().expect("tier"),
            "orderTier {:?} {:?}",
            case["params"],
            case["order"]
        );
    }
}

#[test]
fn order_effects_matches_web() {
    let root = root();
    for case in cases(&root, "orderEffects") {
        let params = case_params(&root, case);
        let tier = tier_from_web(case["tier"].as_str().expect("tier"));
        assert_effects(
            &format!("orderEffects {:?} {:?}", case["params"], case["tier"]),
            &order_effects(tier, &params),
            &effects_from(&case["out"]),
        );
    }
}

#[test]
fn evaluate_order_matches_web() {
    let root = root();
    for case in cases(&root, "evaluateOrder") {
        let params = case_params(&root, case);
        let got = evaluate_order(inputs_from(&case["inputs"]), &params);
        let label = format!("evaluateOrder {:?} {:?}", case["params"], case["inputs"]);
        assert_same(&label, got.order, num(&case["out"]["order"]));
        assert_eq!(
            tier_name(got.tier),
            case["out"]["tier"].as_str().expect("tier"),
            "{label}"
        );
        assert_effects(&label, &got.effects, &effects_from(&case["out"]["effects"]));
    }
}

#[test]
fn order_effects_to_yield_mults_matches_web() {
    let root = root();
    for case in cases(&root, "orderEffectsToYieldMults") {
        let tier = tier_from_web(case["tier"].as_str().expect("tier"));
        let got = order_effects_to_yield_mults(tier, &effects_from(&case["effects"]));
        let want = &case["out"];
        let label = format!("orderEffectsToYieldMults {:?}", case["tier"]);
        assert_same(&label, got.production_mult, num(&want["productionMult"]));
        assert_same(&label, got.pieniadz_mult, num(&want["pieniadzMult"]));
        assert_same(&label, got.nauka_mult, num(&want["naukaMult"]));
        assert_same(&label, got.kultura_mult, num(&want["kulturaMult"]));
    }
}

#[test]
fn pick_revolt_migration_target_matches_web() {
    let root = root();
    let mut with_target = 0;
    for case in cases(&root, "pickRevoltMigrationTarget") {
        let cities: Vec<RevoltMigrationCity> = case["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|city| RevoltMigrationCity {
                id: city["id"].as_str().expect("id").to_owned(),
                owner_id: city["ownerId"].as_i64().expect("ownerId"),
                population: num(&city["population"]),
            })
            .collect();
        let orders: BTreeMap<String, f64> = case["orders"]
            .as_array()
            .expect("orders")
            .iter()
            .map(|pair| (pair[0].as_str().expect("id").to_owned(), num(&pair[1])))
            .collect();
        let got = pick_revolt_migration_target(
            case["sourceId"].as_str().expect("sourceId"),
            case["ownerId"].as_i64().expect("ownerId"),
            &cities,
            &orders,
        );
        let want = case["out"].as_str().map(str::to_owned);
        assert_eq!(got, want, "pickRevoltMigrationTarget {case}");
        if want.is_some() {
            with_target += 1;
        }
    }
    assert!(
        with_target > 50,
        "wektory musza obejmowac trafienia ({with_target})"
    );
}

#[test]
fn happiness_breakdown_matches_web() {
    let root = root();
    for case in cases(&root, "happinessBreakdown") {
        let got = happiness_breakdown(num(&case["population"]), num(&case["szczescie"]));
        let label = format!(
            "happinessBreakdown {} {}",
            case["population"], case["szczescie"]
        );
        assert_same(&label, got.zadowoleni, num(&case["out"]["zadowoleni"]));
        assert_same(&label, got.kontentni, num(&case["out"]["kontentni"]));
        assert_same(
            &label,
            got.niezadowoleni,
            num(&case["out"]["niezadowoleni"]),
        );
    }
}

/// Test KSZTALTU bez pinow wartosci: niezmienniki, ktore musza zachodzic dla DOWOLNYCH liczb
/// z tabel (zmiana balansu nie wymaga zmiany testu).
#[test]
fn order_shape_invariants_hold_for_any_table_values() {
    let params = load_order_params(Some(society_params()), Difficulty::Normal);
    for szczescie in [-40.0, -3.0, 0.0, 2.0, 9.0, 60.0] {
        for prawo in [-10.0, 0.0, 5.0, 30.0] {
            let result = evaluate_order(OrderInputs { szczescie, prawo }, &params);
            assert_eq!(result.tier, order_tier(result.order, &params));
            assert!(result.effects.revolt_risk >= 0.0 && result.effects.revolt_risk <= 1.0);
            assert!(result.effects.production_mult >= 0.0);
            let yields = order_effects_to_yield_mults(result.tier, &result.effects);
            assert_eq!(yields.production_mult, result.effects.production_mult);
        }
    }
    for szczescie in [-50.0, -1.0, 0.0, 1.0, 50.0] {
        for population in [0.0, 1.0, 7.0, 31.0] {
            let b = happiness_breakdown(population, szczescie);
            assert_eq!(b.zadowoleni + b.kontentni + b.niezadowoleni, population);
        }
    }
}
