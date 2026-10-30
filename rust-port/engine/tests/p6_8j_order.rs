//! P6.8J-P2 - `society-breakdown.ts` (web pin 91dc998a), partia 2: PorPct (pasma, tiery, efekty),
//! `computePorPct`, `orderContributionPct`, `computeOrderPctBreakdown`, `evaluateOrderFromBreakdown`,
//! `applyCivMatrixHappinessModifier`, `updateRevoltGrace`, `revoltWarningMessage`.
//! Wektory: sekcja `order` w `tests/p6_8j_vectors/society.json` (ten sam generator co partia 1).
//! Testy jednostkowe na dole to kotwice dla mutacji galezi sterujacych (patrz 02-operator-r2.md).

use civ_engine::domain::society_breakdown::{
    apply_civ_matrix_happiness_modifier, compute_por_pct, evaluate_order_from_breakdown,
    fallback_revolt_params, js_num_str, order_contribution_pct, order_effects_from_por_pct,
    por_pct_band, revolt_warning_message, tier_from_por_pct, update_revolt_grace,
    HappinessBreakdownInput, LawBreakdownInput, OrderPctBreakdown, PorPctBand, RevoltParams,
    SocietyLine,
};
use civ_engine::domain::types::porzadek::{
    load_order_params, OrderEffects, OrderParams, OrderTier,
};
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

fn check_opt(actual: Option<f64>, expected: Option<f64>, ctx: &str) {
    match (actual, expected) {
        (None, None) => {}
        (Some(a), Some(e)) => check(a, e, ctx),
        (a, e) => panic!("{ctx}: rust={a:?} web={e:?}"),
    }
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
        return Some(civ_engine::domain::types::porzadek::society_params());
    }
    Some(v)
}

fn assert_lines(actual: &[SocietyLine], expected: &Value, ctx: &str) {
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

fn band_name(b: PorPctBand) -> &'static str {
    match b {
        PorPctBand::Lad => "lad",
        PorPctBand::Spokoj => "spokoj",
        PorPctBand::Napiecie => "napiecie",
        PorPctBand::Niepokoj => "niepokoj",
        PorPctBand::Bunt => "bunt",
        PorPctBand::BuntSkrajny => "bunt_skrajny",
    }
}

fn tier_name(t: OrderTier) -> &'static str {
    match t {
        OrderTier::Order => "order",
        OrderTier::Neutral => "neutral",
        OrderTier::Unrest => "unrest",
    }
}

fn effects_check(got: OrderEffects, e: &Value, ctx: &str) {
    check(
        got.production_mult,
        num(&e["productionMult"]),
        &format!("{ctx} productionMult"),
    );
    check(
        got.pieniadz_mult,
        num(&e["pieniadzMult"]),
        &format!("{ctx} pieniadzMult"),
    );
    check(
        got.nauka_mult,
        num(&e["naukaMult"]),
        &format!("{ctx} naukaMult"),
    );
    check(
        got.kultura_mult,
        num(&e["kulturaMult"]),
        &format!("{ctx} kulturaMult"),
    );
    check(
        got.growth_mult,
        num(&e["growthMult"]),
        &format!("{ctx} growthMult"),
    );
    check(
        got.trade_mult,
        num(&e["tradeMult"]),
        &format!("{ctx} tradeMult"),
    );
    check(
        got.revolt_risk,
        num(&e["revoltRisk"]),
        &format!("{ctx} revoltRisk"),
    );
}

fn order_check(got: &OrderPctBreakdown, e: &Value, ctx: &str) {
    check(got.por_pct, num(&e["porPct"]), &format!("{ctx} porPct"));
    assert_eq!(
        tier_name(got.tier),
        e["tier"].as_str().unwrap(),
        "{ctx}: tier"
    );
    assert_eq!(
        band_name(got.band),
        e["band"].as_str().unwrap(),
        "{ctx}: band"
    );
    assert_eq!(
        got.band_label,
        e["bandLabel"].as_str().unwrap(),
        "{ctx}: bandLabel"
    );
    check(got.waga_sz, num(&e["wagaSz"]), &format!("{ctx} wagaSz"));
    check(
        got.waga_praw,
        num(&e["wagaPraw"]),
        &format!("{ctx} wagaPraw"),
    );
    effects_check(got.effects, &e["effects"], ctx);
    check(got.sz.netto, num(&e["szNetto"]), &format!("{ctx} szNetto"));
    check(got.sz.sz_max, num(&e["szMax"]), &format!("{ctx} szMax"));
    check(got.sz.sz_pct, num(&e["szPct"]), &format!("{ctx} szPct"));
    assert_lines(&got.sz.lines, &e["szLines"], ctx);
    check(
        got.prawo.netto,
        num(&e["prawNetto"]),
        &format!("{ctx} prawNetto"),
    );
    check(
        got.prawo.praw_pct,
        num(&e["prawPct"]),
        &format!("{ctx} prawPct"),
    );
}

fn happiness_input(inp: &Value) -> HappinessBreakdownInput {
    HappinessBreakdownInput {
        difficulty: inp.get("difficulty").map(difficulty_of),
        era: opt_num(inp.get("era")),
        population: num(&inp["population"]),
        building_zadowolenie: num(&inp["buildingZadowolenie"]),
        ha_rel: opt_num(inp.get("haRel")),
        own_religion_share: opt_num(inp.get("ownReligionShare")),
        ha_wealth: opt_num(inp.get("haWealth")),
        ha_cuda: opt_num(inp.get("haCuda")),
        podzial_procent_luksus: inp
            .get("podzialHandlu")
            .and_then(|p| opt_num(p.get("procentLuksus"))),
        at_war: inp.get("atWar").and_then(Value::as_bool).unwrap_or(false),
        own_culture_share: opt_num(inp.get("ownCultureShare")),
        stolica_easy_bonus: inp
            .get("stolicaEasyBonus")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        citizen_resource_happiness_delta: opt_num(inp.get("citizenResourceHappinessDelta")),
    }
}

fn law_input(inp: &Value) -> LawBreakdownInput {
    let flag = |k: &str| inp.get(k).and_then(Value::as_bool).unwrap_or(false);
    LawBreakdownInput {
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
    }
}

/// Wejscie szczescia / prawa po nazwie z sekcji `happiness` / `law` (wejscia nie zaleza od zestawu).
fn input_by_name<'a>(arr: &'a Value, name: &str) -> &'a Value {
    arr.as_array()
        .unwrap()
        .iter()
        .find(|c| c["name"].as_str() == Some(name))
        .map(|c| &c["input"])
        .unwrap_or_else(|| panic!("brak wejscia {name}"))
}

fn near(a: f64, b: f64) -> bool {
    (a - b).abs() < 1e-12
}

fn custom_params(f: impl FnOnce(&mut OrderParams)) -> OrderParams {
    let mut p = load_order_params(None, Difficulty::Normal);
    f(&mut p);
    p
}

// --- wektory z weba ---

#[test]
fn bands_match_web() {
    let r = root();
    for case in r["order"]["bands"].as_array().unwrap() {
        let p = num(&case["porPct"]);
        let c = num(&case["crit"]);
        let ctx = format!("band p={p:?} crit={c:?}");
        let got = por_pct_band(p, c);
        assert_eq!(band_name(got), case["band"].as_str().unwrap(), "{ctx}");
        assert_eq!(
            got.label(),
            case["bandLabel"].as_str().unwrap(),
            "{ctx} label"
        );
    }
}

#[test]
fn tiers_match_web() {
    let r = root();
    for case in r["order"]["tiers"].as_array().unwrap() {
        let p = num(&case["porPct"]);
        assert_eq!(
            tier_name(tier_from_por_pct(p)),
            case["tier"].as_str().unwrap(),
            "tier p={p:?}"
        );
    }
}

#[test]
fn effects_match_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["order"]["effects"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let params = load_order_params(society_for(sets, name), d);
        let p = num(&case["porPct"]);
        let c = num(&case["crit"]);
        let ctx = format!("effects {name}/{d:?} p={p:?} crit={c:?}");
        effects_check(
            order_effects_from_por_pct(p, &params, c),
            &case["effects"],
            &ctx,
        );
    }
}

#[test]
fn por_pct_match_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["order"]["porPct"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let params = load_order_params(society_for(sets, name), d);
        let got = compute_por_pct(num(&case["sz"]), num(&case["praw"]), &params);
        check(got, num(&case["porPct"]), &format!("porPct {name}/{d:?}"));
    }
}

#[test]
fn contribution_matches_web() {
    let r = root();
    for case in r["order"]["contribution"].as_array().unwrap() {
        let got = order_contribution_pct(
            num(&case["sz"]),
            num(&case["praw"]),
            num(&case["wSz"]),
            num(&case["wPraw"]),
        );
        let ctx = "contribution";
        check(got.sz_wklad_pct, num(&case["szWklad"]), ctx);
        check(got.praw_wklad_pct, num(&case["prawWklad"]), ctx);
    }
}

#[test]
fn breakdown_matches_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["order"]["breakdown"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let hin = happiness_input(input_by_name(
            &r["happiness"],
            case["happy"].as_str().unwrap(),
        ));
        let lin = law_input(input_by_name(&r["law"], case["law"].as_str().unwrap()));
        let got = evaluate_order_from_breakdown(&hin, &lin, society_for(sets, name), d);
        let ctx = format!(
            "breakdown {} / {} / {name} / {d:?}",
            case["happy"], case["law"]
        );
        order_check(&got, &case["expected"], &ctx);
    }
}

#[test]
fn matrix_matches_web() {
    let r = root();
    let sets = &r["societies"];
    for case in r["order"]["matrix"].as_array().unwrap() {
        let name = case["society"].as_str().unwrap();
        let d = difficulty_of(&case["difficulty"]);
        let hin = happiness_input(input_by_name(
            &r["happiness"],
            case["happy"].as_str().unwrap(),
        ));
        let lin = LawBreakdownInput {
            garnizon_count: 2.0,
            ..Default::default()
        };
        let s = society_for(sets, name);
        let base = evaluate_order_from_breakdown(&hin, &lin, s, d);
        let got = apply_civ_matrix_happiness_modifier(&base, num(&case["raw"]), s, d);
        let ctx = format!(
            "matrix {} / {name} / {d:?} / raw={:?}",
            case["happy"], case["raw"]
        );
        order_check(&got, &case["expected"], &ctx);
    }
}

#[test]
fn grace_matches_web() {
    let r = root();
    for case in r["order"]["grace"].as_array().unwrap() {
        let rv = &case["revolt"];
        let revolt = RevoltParams {
            critical_por_pct: num(&rv["criticalPorPct"]),
            grace_turns: num(&rv["graceTurns"]),
        };
        let cur = opt_num(case.get("currentGrace"));
        let p = num(&case["porPct"]);
        let got = update_revolt_grace(cur, p, revolt);
        let e = &case["expected"];
        let ctx = format!(
            "grace cur={cur:?} p={p:?} crit={:?} turns={:?}",
            revolt.critical_por_pct, revolt.grace_turns
        );
        check_opt(
            got.revolt_grace_remaining,
            opt_num(e.get("revoltGraceRemaining")),
            &ctx,
        );
        assert_eq!(
            got.revolt_warning,
            e["revoltWarning"].as_bool().unwrap(),
            "{ctx} warn"
        );
        assert_eq!(
            got.should_trigger_rebellion,
            e["shouldTriggerRebellion"].as_bool().unwrap(),
            "{ctx} trigger"
        );
        check_opt(got.grace_turns_left, opt_num(e.get("graceTurnsLeft")), &ctx);
    }
}

#[test]
fn messages_match_web() {
    let r = root();
    for case in r["order"]["messages"].as_array().unwrap() {
        let left = opt_num(case.get("left"));
        assert_eq!(
            revolt_warning_message("Kraków", left),
            case["msg"].as_str().unwrap(),
            "message left={left:?}"
        );
    }
}

// --- testy jednostkowe galezi (kotwice dla mutacji) ---

#[test]
fn band_boundaries_unit() {
    let c = 12.0;
    assert_eq!(por_pct_band(90.0, c), PorPctBand::Lad);
    assert_eq!(por_pct_band(89.99, c), PorPctBand::Spokoj);
    assert_eq!(por_pct_band(70.0, c), PorPctBand::Spokoj);
    assert_eq!(por_pct_band(69.99, c), PorPctBand::Napiecie);
    assert_eq!(por_pct_band(50.0, c), PorPctBand::Napiecie);
    assert_eq!(por_pct_band(49.99, c), PorPctBand::Niepokoj);
    assert_eq!(por_pct_band(30.0, c), PorPctBand::Niepokoj);
    assert_eq!(por_pct_band(29.99, c), PorPctBand::Bunt);
    assert_eq!(por_pct_band(12.0, c), PorPctBand::Bunt);
    assert_eq!(por_pct_band(11.99, c), PorPctBand::BuntSkrajny);
    assert_eq!(por_pct_band(5.0, 5.0), PorPctBand::Bunt);
    assert_eq!(por_pct_band(f64::NAN, c), PorPctBand::BuntSkrajny);
    assert_eq!(por_pct_band(f64::INFINITY, c), PorPctBand::BuntSkrajny);
    assert_eq!(por_pct_band(0.0, f64::NAN), PorPctBand::BuntSkrajny);
    assert_eq!(por_pct_band(12.0, f64::NAN), PorPctBand::Bunt);
}

#[test]
fn tier_boundaries_unit() {
    assert_eq!(tier_from_por_pct(90.0), OrderTier::Order);
    assert_eq!(tier_from_por_pct(89.99), OrderTier::Neutral);
    assert_eq!(tier_from_por_pct(30.0), OrderTier::Neutral);
    assert_eq!(tier_from_por_pct(29.99), OrderTier::Unrest);
    assert_eq!(tier_from_por_pct(f64::NAN), OrderTier::Unrest);
    assert_eq!(tier_from_por_pct(f64::INFINITY), OrderTier::Unrest);
}

#[test]
fn effects_branches_unit() {
    let base = load_order_params(None, Difficulty::Normal);
    let napiecie = order_effects_from_por_pct(60.0, &base, 12.0);
    assert!(near(napiecie.production_mult, 0.95));
    assert_eq!(napiecie.pieniadz_mult, 1.0);
    assert_eq!(napiecie.revolt_risk, 0.0);
    // Bunt: ryzyko bierze sie z parametru BEZ przycinania do [0,1] (web: `revoltRisk: params.ryzykoBuntuT1`).
    let high = custom_params(|p| p.ryzyko_buntu_t1 = 1.5);
    assert_eq!(
        order_effects_from_por_pct(20.0, &high, 12.0).revolt_risk,
        1.5
    );
    // Bunt skrajny: ryzyko = min(1, ryzyko + 0.03); mnozniki = max(0, base - 0.15).
    let sk = order_effects_from_por_pct(5.0, &high, 12.0);
    assert_eq!(sk.revolt_risk, 1.0);
    assert_eq!(sk.trade_mult, 1.0);
    let neg = custom_params(|p| {
        p.kara_produkcja_t1 = -2.0;
        p.ryzyko_buntu_t1 = 0.1;
    });
    let sk_neg = order_effects_from_por_pct(5.0, &neg, 12.0);
    assert_eq!(sk_neg.production_mult, 0.0, "max(0, base-0.15) z base<0");
    assert!(near(sk_neg.revolt_risk, 0.13));
    let zero = custom_params(|p| {
        p.kara_produkcja_t1 = 0.0;
        p.kara_wzrost_t1 = 0.0;
    });
    let sk0 = order_effects_from_por_pct(5.0, &zero, 12.0);
    assert!(near(sk0.production_mult, 0.85));
    assert!(near(sk0.growth_mult, 1.0));
}

#[test]
fn por_pct_cap_unit() {
    let mut p = custom_params(|p| {
        p.waga_szczescie = 1.0;
        p.waga_prawo = 0.0;
        p.por_pct_cap = None;
    });
    assert_eq!(
        compute_por_pct(200.0, 0.0, &p),
        120.0,
        "brak capu -> SZ_PCT_CAP"
    );
    p.por_pct_cap = Some(f64::NAN);
    assert_eq!(
        compute_por_pct(200.0, 0.0, &p),
        120.0,
        "NaN cap -> SZ_PCT_CAP"
    );
    p.por_pct_cap = Some(150.0);
    assert_eq!(compute_por_pct(200.0, 0.0, &p), 150.0);
    assert_eq!(compute_por_pct(f64::NAN, 0.0, &p), 0.0, "NaN wejscie -> 0");
}

#[test]
fn contribution_unit() {
    let a = order_contribution_pct(50.0, 50.0, 1.0, 1.0);
    assert_eq!((a.sz_wklad_pct, a.praw_wklad_pct), (50.0, 50.0));
    let b = order_contribution_pct(80.0, 20.0, 1.0, 1.0);
    assert_eq!((b.sz_wklad_pct, b.praw_wklad_pct), (80.0, 20.0));
    let c = order_contribution_pct(0.0, 0.0, 1.0, 3.0);
    assert_eq!(
        (c.sz_wklad_pct, c.praw_wklad_pct),
        (25.0, 75.0),
        "suma 0 -> wagi"
    );
    let d = order_contribution_pct(0.0, 0.0, 0.0, 0.0);
    assert_eq!(
        (d.sz_wklad_pct, d.praw_wklad_pct),
        (50.0, 50.0),
        "wagi 0 -> 50/50"
    );
    let e = order_contribution_pct(100.0, 0.0, 1.0, 0.0);
    assert_eq!((e.sz_wklad_pct, e.praw_wklad_pct), (100.0, 0.0));
    let f = order_contribution_pct(33.0, 66.0, 1.0, 1.0);
    assert_eq!(f.sz_wklad_pct + f.praw_wklad_pct, 100.0);
}

#[test]
fn grace_unit() {
    let rv = fallback_revolt_params();
    let s = update_revolt_grace(None, 5.0, rv);
    assert_eq!(
        (
            s.revolt_grace_remaining,
            s.revolt_warning,
            s.should_trigger_rebellion
        ),
        (Some(3.0), true, false)
    );
    let s = update_revolt_grace(Some(3.0), 5.0, rv);
    assert_eq!(s.revolt_grace_remaining, Some(2.0));
    let s = update_revolt_grace(Some(1.0), 5.0, rv);
    assert_eq!(
        (s.revolt_grace_remaining, s.should_trigger_rebellion),
        (Some(0.0), false)
    );
    let s = update_revolt_grace(Some(0.0), 5.0, rv);
    assert_eq!(
        (s.revolt_grace_remaining, s.should_trigger_rebellion),
        (Some(0.0), true)
    );
    let s = update_revolt_grace(Some(f64::NAN), 5.0, rv);
    assert!(s.should_trigger_rebellion);
    let s = update_revolt_grace(Some(0.0), 12.0, rv);
    assert_eq!(s.revolt_grace_remaining, None);
    assert!(!s.revolt_warning);
    let frac = update_revolt_grace(
        None,
        5.0,
        RevoltParams {
            critical_por_pct: 12.0,
            grace_turns: 2.7,
        },
    );
    assert_eq!(frac.grace_turns_left, Some(2.0), "floor(2.7)");
}

#[test]
fn message_unit() {
    assert!(revolt_warning_message("X", None).contains("ostatnia szansa w X"));
    assert!(revolt_warning_message("X", Some(0.0)).contains("ostatnia szansa w X"));
    assert!(revolt_warning_message("X", Some(-1.0)).contains("ostatnia szansa w X"));
    assert!(revolt_warning_message("X", Some(1.0)).contains("Ostatnia tura"));
    assert_eq!(
        revolt_warning_message("X", Some(2.0)),
        "KRYTYCZNE — grozi bunt w X! Masz 2 tury na reakcję (podatki/Wealth lub garnizon)."
    );
    assert!(revolt_warning_message("X", Some(f64::NAN)).contains("Masz NaN tury"));
    assert_eq!(js_num_str(2.5), "2.5");
}

#[test]
fn matrix_unit() {
    let hin = HappinessBreakdownInput {
        era: Some(2.0),
        population: 5.0,
        building_zadowolenie: 12.0,
        ..Default::default()
    };
    let base = evaluate_order_from_breakdown(
        &hin,
        &LawBreakdownInput::default(),
        None,
        Difficulty::Normal,
    );
    assert_ne!(base.sz.netto, 0.0, "przypadek testowy musi miec netto != 0");
    let same_raw0 = apply_civ_matrix_happiness_modifier(&base, 0.0, None, Difficulty::Normal);
    assert_eq!(same_raw0, base);
    let same_nan = apply_civ_matrix_happiness_modifier(&base, f64::NAN, None, Difficulty::Normal);
    assert_eq!(same_nan, base);
    let up = apply_civ_matrix_happiness_modifier(&base, 0.25, None, Difficulty::Normal);
    assert!(near(up.sz.netto, base.sz.netto * 1.25));
    assert_eq!(up.sz.lines.last().unwrap().id, "matryca_eko_zadowolenie");
    let down = apply_civ_matrix_happiness_modifier(&base, -1.0, None, Difficulty::Normal);
    assert_eq!(down.sz.netto, 0.0);
    assert_eq!(down.sz.sz_pct, 0.0);
    assert_eq!(down.sz.lines.len(), base.sz.lines.len() + 1);
    assert_eq!(down.sz.lines.last().unwrap().value, -base.sz.netto);
    let _: &[SocietyLine] = &up.sz.lines;
}

#[test]
fn order_struct_is_clone_eq() {
    let hin = HappinessBreakdownInput::default();
    let a = evaluate_order_from_breakdown(
        &hin,
        &LawBreakdownInput::default(),
        None,
        Difficulty::Normal,
    );
    let b: OrderPctBreakdown = a.clone();
    assert_eq!(a, b);
}
