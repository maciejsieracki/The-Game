//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 2): zgodnosc `diplomacy_multiwar.rs` i
//! `diplomacy_nap_trust.rs` z URUCHOMIONYM webem (pin `origin/main` a61337844).
//! Wektory: `tests/p6_dyplo_multiwar_gates_data/{weariness,era,nap}.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/gen-multiwar-vectors.cjs`
//! (typescript.transpileModule + prawdziwe funkcje weba; stuby: zob. komentarz w generatorze).
//! Liczby: `String(x)`; NaN porownywane jako NaN; `undefined` = brak klucza lub "undefined".

use civ_engine::domain::diplomacy_multiwar::*;
use civ_engine::domain::diplomacy_nap_trust::*;
use serde_json::Value;
use std::collections::HashMap;

const WEARINESS: &str = include_str!("p6_dyplo_multiwar_gates_data/weariness.json");
const ERA: &str = include_str!("p6_dyplo_multiwar_gates_data/era.json");
const NAP: &str = include_str!("p6_dyplo_multiwar_gates_data/nap.json");

fn load(s: &str) -> Vec<Value> {
    serde_json::from_str::<Vec<Value>>(s).expect("wektory musza sie parsowac")
}

/// Liczba jako JSON-number lub `String(x)`; "undefined" -> NaN (wywolujacy sprawdza brak osobno).
fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    let s = v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana, jest {v}"));
    match s {
        "NaN" | "undefined" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        _ => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

/// Opcjonalna liczba: brak klucza / null / "undefined" = None.
fn opt(v: Option<&Value>) -> Option<f64> {
    match v {
        None => None,
        Some(x) if x.is_null() => None,
        Some(x) if matches!(x.as_str(), Some("undefined") | Some("null")) => None,
        Some(x) => Some(num(x)),
    }
}

/// Porownanie bitowe z `String(x)`: NaN == NaN; -0 == 0 (String(-0) = "0").
fn same(actual: f64, expected: &Value, ctx: &str) {
    let e = num(expected);
    if e.is_nan() {
        assert!(actual.is_nan(), "{ctx}: oczekiwano NaN, jest {actual}");
    } else {
        assert!(actual == e, "{ctx}: oczekiwano {e}, jest {actual}");
    }
}

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key)
        .and_then(Value::as_str)
        .unwrap_or_else(|| panic!("brak pola {key}"))
}

fn f(v: &Value, key: &str) -> f64 {
    num(v.get(key).unwrap_or_else(|| panic!("brak pola {key}")))
}

fn tag_of(name: &str) -> Option<ForcedEraTag> {
    match name {
        "stone" => Some(ForcedEraTag::Stone),
        "bronze" => Some(ForcedEraTag::Bronze),
        "iron" => Some(ForcedEraTag::Iron),
        _ => None,
    }
}

fn tag_name(t: Option<ForcedEraTag>) -> &'static str {
    match t {
        None => "null",
        Some(ForcedEraTag::Stone) => "stone",
        Some(ForcedEraTag::Bronze) => "bronze",
        Some(ForcedEraTag::Iron) => "iron",
    }
}

fn verdict_name(v: EraWarGateVerdict) -> &'static str {
    match v {
        EraWarGateVerdict::Ok => "ok",
        EraWarGateVerdict::EraDisabled => "era-disabled",
        EraWarGateVerdict::EraCap => "era-cap",
        EraWarGateVerdict::CivCapAttacker => "civ-cap-attacker",
        EraWarGateVerdict::CivCapTarget => "civ-cap-target",
    }
}

#[test]
fn weariness_vectors_match_web() {
    let cases = load(WEARINESS);
    assert_eq!(cases.len(), 66, "liczba wektorow zmeczenia");
    let p = &WAR_WEARINESS_PARAMS;
    for (i, c) in cases.iter().enumerate() {
        let inp = &c["in"];
        let ctx = format!("weariness[{i}] {}", s(c, "fn"));
        match s(c, "fn") {
            "warWearinessLevel" => {
                let got = war_weariness_level(
                    f(inp, "turnsAtWar"),
                    f(inp, "lostCitiesTotal"),
                    opt(inp.get("turnsSinceCityChange")),
                    p,
                );
                same(got, &c["out"], &ctx);
            }
            "wearinessPeacePriceFactor" => same(
                weariness_peace_price_factor(f(inp, "level"), p),
                &c["out"],
                &ctx,
            ),
            "isWarWeary" => {
                let got = is_war_weary(f(inp, "level"), p);
                assert_eq!(got.to_string(), s(c, "out"), "{ctx}");
            }
            "loserDespair" => same(
                loser_despair(f(inp, "level"), f(inp, "share"), f(inp, "lostCities"), p),
                &c["out"],
                &ctx,
            ),
            "despairStage" => {
                let got = despair_stage(f(inp, "despair"), p);
                assert_eq!(got.to_string(), s(c, "out"), "{ctx}");
            }
            "stageCityLimit" => {
                let got = stage_city_limit(f(inp, "stage") as i64, p);
                assert_eq!(got.to_string(), s(c, "out"), "{ctx}");
            }
            "offerMultiplier" => same(
                offer_multiplier(f(inp, "stage") as i64, f(inp, "rejectedOffers"), p),
                &c["out"],
                &ctx,
            ),
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }
}

#[test]
fn era_vectors_match_web() {
    let cases = load(ERA);
    assert_eq!(cases.len(), 63, "liczba wektorow epok");
    for (i, c) in cases.iter().enumerate() {
        let inp = &c["in"];
        let ctx = format!("era[{i}] {}", s(c, "fn"));
        match s(c, "fn") {
            "forcedEraTagFromPowod" => {
                let powod = s(inp, "powod");
                let got = if powod == "undefined" {
                    None
                } else {
                    forced_era_tag_from_powod(powod)
                };
                assert_eq!(tag_name(got), s(c, "out"), "{ctx}");
            }
            "isForcedEraWarEnabled" => {
                let en: Vec<ForcedEraTag> = inp["enabled"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| tag_of(x.as_str().unwrap()).unwrap())
                    .collect();
                let tag = tag_of(s(inp, "tag")).unwrap();
                let got = is_forced_era_war_enabled(tag, &en);
                assert_eq!(got.to_string(), s(c, "out"), "{ctx}");
            }
            "canDeclareEraForcedWar" => {
                let got = can_declare_era_forced_war(
                    f(inp, "declared") as i64,
                    opt(inp.get("cap")).map(|x| x as i64),
                );
                assert_eq!(got.to_string(), s(c, "out"), "{ctx}");
            }
            "canCivJoinEraForcedWar" => {
                let mut counts = HashMap::new();
                counts.insert("7:2".to_string(), f(inp, "count") as i64);
                let got = can_civ_join_era_forced_war(
                    &counts,
                    7,
                    2,
                    opt(inp.get("cap")).map(|x| x as i64),
                );
                assert_eq!(got.to_string(), s(c, "out"), "{ctx}");
            }
            "evaluateEraForcedWarGate" => {
                let enabled: Vec<ForcedEraTag> = inp["enabled"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| tag_of(x.as_str().unwrap()).unwrap())
                    .collect();
                let mut counts = HashMap::new();
                for pair in inp["counts"].as_array().unwrap() {
                    counts.insert(
                        pair[0].as_str().unwrap().to_string(),
                        pair[1].as_i64().unwrap(),
                    );
                }
                let params = EraWarParams {
                    enabled_forced_war_eras: &enabled,
                    max_era_forced_wars_per_era: opt(inp.get("cap")).map(|x| x as i64),
                    max_era_forced_wars_per_civ_per_era: opt(inp.get("civCap")).map(|x| x as i64),
                };
                let tag = inp.get("tag").and_then(Value::as_str).and_then(tag_of);
                let gi = EraWarGateInput {
                    multiwar_enabled: inp["multiwarEnabled"].as_bool().unwrap(),
                    tag,
                    declared_for_tag: f(inp, "declared") as i64,
                    counts: &counts,
                    attacker_id: f(inp, "att") as i64,
                    attacker_epoch: f(inp, "attE") as i64,
                    target_id: f(inp, "tgt") as i64,
                    target_epoch: f(inp, "tgtE") as i64,
                };
                assert_eq!(
                    verdict_name(evaluate_era_forced_war_gate(&gi, &params)),
                    s(c, "out"),
                    "{ctx}"
                );
            }
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }
}

#[test]
fn nap_vectors_match_web() {
    let cases = load(NAP);
    assert_eq!(cases.len(), 67, "liczba wektorow NAP");
    for (i, c) in cases.iter().enumerate() {
        let inp = &c["in"];
        let ctx = format!("nap[{i}] {}", s(c, "fn"));
        match s(c, "fn") {
            "napRelacjaProgEfektywny" => {
                let ease = opt(inp.get("ease")).unwrap_or(0.0);
                let got = nap_relacja_prog_efektywny(
                    f(inp, "prog"),
                    inp["kara"].as_bool().unwrap(),
                    inp["agr"].as_bool().unwrap(),
                    ease,
                );
                same(got, &c["out"], &ctx);
            }
            "resolveDiplomacyActionLock2" => {
                let ctxn = NapLockCtx {
                    at_war: inp["atWar"].as_bool().unwrap(),
                    has_nap: inp["hasNap"].as_bool().unwrap(),
                    rel_total: f(inp, "rel"),
                    zaufanie: f(inp, "zauf"),
                    prog_nap_relacja: f(inp, "progRel"),
                    prog_nap_zaufanie: opt(inp.get("progZauf")),
                    kara_wspolna_granica: inp["kara"].as_bool().unwrap(),
                    nap_agresor_aktywny: inp["agr"].as_bool().unwrap(),
                };
                let out = &c["out"];
                let (locked, active, note, req) = match resolve_nap_lock(&ctxn) {
                    NapLockOutcome::Open => (false, false, String::new(), None),
                    NapLockOutcome::Active { note } => (false, true, note, None),
                    NapLockOutcome::Locked { note, requirement } => {
                        (true, false, note, requirement)
                    }
                };
                assert_eq!(locked, out["locked"].as_bool().unwrap(), "{ctx} locked");
                assert_eq!(active, out["active"].as_bool().unwrap(), "{ctx} active");
                assert_eq!(note, s(out, "note"), "{ctx} note");
                match (&req, out.get("requirement")) {
                    (None, None) => {}
                    (None, Some(v)) if v.is_null() => {}
                    (Some(r), Some(v)) if !v.is_null() => {
                        assert_eq!(r.kind, s(v, "kind"), "{ctx} kind");
                        same(r.prog, &v["prog"], &format!("{ctx} prog"));
                        same(r.masz, &v["masz"], &format!("{ctx} masz"));
                    }
                    other => panic!("{ctx}: requirement rozny: {other:?}"),
                }
            }
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }
}

// ---- przypadki jawne (poza wektorami) ----

#[test]
fn forced_era_prefix_needs_full_marker() {
    assert_eq!(
        forced_era_tag_from_powod("R-EPOKA-ZELAZO-WYMUSZONA-WOJNA:x"),
        Some(ForcedEraTag::Iron)
    );
    assert_eq!(
        forced_era_tag_from_powod("R-EPOKA-KAMIEN-WYMUSZONA-WOJNA"),
        None,
        "brak dwukropka"
    );
    assert_eq!(
        forced_era_tag_from_powod("R-EPOKA-KAMIEN-WYMUSZONA-WOJNY:"),
        None
    );
    assert_eq!(
        forced_era_tag_from_powod("r-epoka-kamien-wymuszona-wojna:"),
        None,
        "wielkosc liter"
    );
}

#[test]
fn player_epoch_missing_field_is_true() {
    assert!(
        player_epoch_war_enabled(None),
        "brak pola w zapisie = true (main.ts:43049)"
    );
    assert!(player_epoch_war_enabled(Some(true)));
    assert!(!player_epoch_war_enabled(Some(false)));
}

#[test]
fn era_params_literal_is_stone_bronze_iron_cap_one_per_civ() {
    assert_eq!(
        ERA_WAR_PARAMS.enabled_forced_war_eras,
        &[ForcedEraTag::Stone, ForcedEraTag::Bronze, ForcedEraTag::Iron][..]
    );
    assert_eq!(ERA_WAR_PARAMS.max_era_forced_wars_per_era, None);
    assert_eq!(ERA_WAR_PARAMS.max_era_forced_wars_per_civ_per_era, Some(1));
}

#[test]
fn js_math_semantics_nan_and_signed_zero() {
    assert!(js_max(f64::NAN, 0.0).is_nan(), "Math.max propaguje NaN");
    assert!(js_clamp(f64::NAN, 0.0, 1.0).is_nan());
    assert!(js_max(-0.0, 0.0).is_sign_positive(), "Math.max(-0, 0) = +0");
    assert!(js_max(0.0, -0.0).is_sign_positive(), "Math.max(0, -0) = +0");
    assert!(js_min(0.0, -0.0).is_sign_negative(), "Math.min(0, -0) = -0");
    assert!(js_min(-0.0, 0.0).is_sign_negative(), "Math.min(-0, 0) = -0");
    assert!(js_max(1.0, f64::NAN).is_nan(), "Math.max(1, NaN) = NaN");
    assert!(js_min(f64::NAN, 1.0).is_nan(), "Math.min(NaN, 1) = NaN");
    assert!(js_clamp(0.5, f64::NAN, 1.0).is_nan(), "clamp z NaN dolnym = NaN");
}

/// Wartosci policzone w node 22 (ten sam silnik JS co web): `Number.isInteger(n) ? String(n) : n.toFixed(1)`.
#[test]
fn fmt_prog_matches_js_to_fixed_1() {
    let cases: [(f64, &str); 14] = [
        (0.1 + 0.2, "0.3"),
        (0.25, "0.3"),
        (29.5, "29.5"),
        (-0.25, "-0.3"),
        (29.25, "29.3"),
        (0.05, "0.1"),
        (0.35, "0.3"),
        (1.45, "1.4"),
        (-0.04, "-0.0"),
        (f64::NAN, "NaN"),
        (f64::INFINITY, "Infinity"),
        (f64::NEG_INFINITY, "-Infinity"),
        (29.0, "29"),
        (-0.0, "0"),
    ];
    for (n, want) in cases {
        assert_eq!(fmt_prog(n), want, "fmt_prog({n:?})");
    }
}

#[test]
fn nap_fallback_trust_is_fail_closed() {
    // progNapZaufanie nieobecne -> 30 (fail-closed), zaufanie 29 blokuje.
    let ctx = NapLockCtx {
        at_war: false,
        has_nap: false,
        rel_total: 100.0,
        zaufanie: 29.0,
        prog_nap_relacja: 30.0,
        prog_nap_zaufanie: None,
        kara_wspolna_granica: false,
        nap_agresor_aktywny: false,
    };
    assert!(matches!(
        resolve_nap_lock(&ctx),
        NapLockOutcome::Locked { .. }
    ));
    let ok = NapLockCtx {
        zaufanie: 30.0,
        ..ctx
    };
    assert_eq!(resolve_nap_lock(&ok), NapLockOutcome::Open);
}

#[test]
fn nap_threshold_n_minus_one_n_n_plus_one() {
    // progNapRelacja 30 + narzut 20 (wspolna granica): prog Relacji = 50.
    let mk = |rel: f64| NapLockCtx {
        at_war: false,
        has_nap: false,
        rel_total: rel,
        zaufanie: 100.0,
        prog_nap_relacja: 30.0,
        prog_nap_zaufanie: Some(30.0),
        kara_wspolna_granica: true,
        nap_agresor_aktywny: false,
    };
    assert!(matches!(
        resolve_nap_lock(&mk(49.0)),
        NapLockOutcome::Locked { .. }
    ));
    assert_eq!(resolve_nap_lock(&mk(50.0)), NapLockOutcome::Open);
    assert_eq!(resolve_nap_lock(&mk(51.0)), NapLockOutcome::Open);
}
