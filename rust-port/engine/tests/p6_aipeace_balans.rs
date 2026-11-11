//! R-RUSTPORT-P6-AIPEACE-BALANS-Q1: zgodnosc wariantu V2 `diplomacy_ai_forced_peace` (regula nieujemnego bilansu
//! AI<->AI, bramka `peaceAllowed`, `loserBalanceFor`) z URUCHOMIONYM webem na pinie 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
//! Wektory: `tests/p6_aipeace_balans_vectors/vectors.json`; generator `tests/p6_aipeace_balans_gen.mjs` (esbuild bundle
//! `gra/src/game/diplomacy-ai-forced-peace.ts`).
//! Pokrycie: `decide` (kolejnosc bilans przed limitem, NaN, `minBalancePn`), `helpers` (`isAiAiPeaceBalanceAllowed`,
//! `aiAiPeaceRequiredPn`), `ticks` (wpisy `wait` bez planu, blokada bilansem, dwie pary, battlePending, dropy),
//! stala `AI_AI_PEACE_MIN_BALANCE` zgodna z plikiem danych.

use civ_engine::domain::diplomacy_ai_forced_peace::*;
use civ_engine::domain::diplomacy_multiwar_peace::{
    plan_peace_payment, PeaceAsset, PeaceAssetKind, PeacePaymentPlan,
};
use serde_json::Value;
use std::collections::HashSet;

const DATA: &str = include_str!("p6_aipeace_balans_vectors/vectors.json");
const PEACE_PARAMS: &str = include_str!("../data/derived/diplomacy-war-peace-params.json");

fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana, jest {v}"))
    {
        "NaN" => f64::NAN,
        s => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

fn same(actual: f64, expected: &Value, ctx: &str) {
    let e = num(expected);
    if e.is_nan() {
        assert!(actual.is_nan(), "{ctx}: oczekiwano NaN, jest {actual}");
    } else {
        assert!(
            actual == e || (actual - e).abs() <= 1e-12 * e.abs().max(1.0),
            "{ctx}: {actual} != {e}"
        );
    }
}

fn kind_of(s: &str) -> AiPeaceKind {
    match s {
        "pokoj" => AiPeaceKind::Pokoj,
        "rozejm" => AiPeaceKind::Rozejm,
        other => panic!("nieznany rodzaj {other}"),
    }
}

fn kind_of_opt(v: &Value) -> AiPeaceKind {
    v.as_str().map(kind_of).unwrap_or(AiPeaceKind::Pokoj)
}

fn asset_kind(s: &str) -> PeaceAssetKind {
    match s {
        "zloto" => PeaceAssetKind::Zloto,
        "surowiec_ilosc" => PeaceAssetKind::SurowiecIlosc,
        "miasto" => PeaceAssetKind::Miasto,
        other => panic!("nieznany rodzaj zasobu {other}"),
    }
}

fn gate_of(s: &str) -> GateVerdict {
    match s {
        "ok" => GateVerdict::Ok,
        "too_early" => GateVerdict::TooEarly,
        "stronger" => GateVerdict::Stronger,
        other => panic!("nieznany werdykt {other}"),
    }
}

fn asset_of(v: &Value) -> PeaceAsset {
    PeaceAsset {
        kind: asset_kind(v["kind"].as_str().unwrap()),
        id: v["id"].as_str().unwrap().to_string(),
        amount: num(&v["amount"]),
        pn: num(&v["pn"]),
        forbidden: false,
    }
}

fn shape_of(v: &Value) -> PeaceBalanceShape {
    match v["type"].as_str().unwrap() {
        "linear" => PeaceBalanceShape::Linear {
            balance0: num(&v["balance0"]),
            slope: num(&v["slope"]),
        },
        other => panic!("nieobslugiwany ksztalt {other}"),
    }
}

fn plan_check(actual: &PeacePaymentPlan, exp: &Value, ctx: &str) {
    same(
        actual.covered_pn,
        &exp["covered"],
        &format!("{ctx} covered"),
    );
    assert_eq!(actual.full, exp["full"].as_bool().unwrap(), "{ctx}: full");
    let items_exp = exp["items"].as_array().unwrap();
    assert_eq!(actual.items.len(), items_exp.len(), "{ctx}: liczba pozycji");
    for (i, (a, e)) in actual.items.iter().zip(items_exp).enumerate() {
        assert_eq!(
            a.kind,
            asset_kind(e["kind"].as_str().unwrap()),
            "{ctx} item{i} kind"
        );
        assert_eq!(a.id, e["id"].as_str().unwrap(), "{ctx} item{i} id");
        same(a.amount, &e["amount"], &format!("{ctx} item{i} amount"));
        same(a.pn, &e["pn"], &format!("{ctx} item{i} pn"));
    }
    let hist = exp["hist"].as_array().unwrap();
    assert_eq!(
        [
            actual.histogram.zloto,
            actual.histogram.surowiec_ilosc,
            actual.histogram.miasto
        ],
        [
            hist[0].as_i64().unwrap(),
            hist[1].as_i64().unwrap(),
            hist[2].as_i64().unwrap()
        ],
        "{ctx}: histogram"
    );
}

fn decision_check_v2(d: &AiPeaceDecisionV2, exp: &Value, ctx: &str) {
    assert_eq!(
        d.action.name(),
        exp["action"].as_str().unwrap(),
        "{ctx}: action"
    );
    assert_eq!(
        d.reason.code(),
        exp["reason"].as_str().unwrap(),
        "{ctx}: reason"
    );
    same(
        d.balance_before,
        &exp["balanceBefore"],
        &format!("{ctx} balanceBefore"),
    );
    same(
        d.balance_after,
        &exp["balanceAfter"],
        &format!("{ctx} balanceAfter"),
    );
    same(
        d.turns_since,
        &exp["turnsSince"],
        &format!("{ctx} turnsSince"),
    );
}

// --- stala z pliku danych -----------------------------------------------------

#[test]
fn min_balance_constant_matches_data_file() {
    let v: Value = serde_json::from_str(PEACE_PARAMS).unwrap();
    let from_json = num(&v["pokojAiAi"]["minBilansPW"]);
    assert_eq!(AI_AI_PEACE_MIN_BALANCE, from_json);
    let root: Value = serde_json::from_str(DATA).unwrap();
    same(
        AI_AI_PEACE_MIN_BALANCE,
        &root["minBalanceFromJson"],
        "min z web",
    );
}

// --- decide -------------------------------------------------------------------

#[test]
fn decide_v2_matches_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    let cases = root["decide"].as_array().unwrap();
    assert!(
        cases.len() >= 400,
        "za malo przypadkow decide: {}",
        cases.len()
    );
    for c in cases {
        let name = c["name"].as_str().unwrap();
        let i = &c["in"];
        let assets: Vec<PeaceAsset> = i["assets"]
            .as_array()
            .unwrap()
            .iter()
            .map(asset_of)
            .collect();
        let plan = plan_peace_payment(num(&i["requiredPn"]), &assets);
        plan_check(&plan, &c["plan"], name);
        let req = AiPeaceRequest {
            requester_id: 1,
            other_id: 2,
            since_turn: num(&i["sinceTurn"]),
            kind: kind_of_opt(&i["kind"]),
        };
        let inp = AiPeaceDecisionInputV2 {
            base: AiPeaceDecisionInput {
                req: &req,
                turn: num(&i["turn"]),
                plan: &plan,
                balance_before_pn: num(&i["balanceBeforePn"]),
                balance_after_pn: num(&i["balanceAfterPn"]),
                tolerance_pn: num(&i["tolerancePn"]),
                winner_gate_verdict: gate_of(i["gate"].as_str().unwrap()),
                limit: i.get("limit").map(num),
            },
            loser_balance_after_pn: i.get("loserBalanceAfterPn").map(num),
            min_balance_pn: i
                .get("minBalancePn")
                .map(num)
                .unwrap_or(AI_AI_PEACE_MIN_BALANCE),
        };
        let d = decide_ai_peace_request_v2(&inp);
        decision_check_v2(&d, &c["out"], name);
    }
}

// --- helpers ------------------------------------------------------------------

#[test]
fn helpers_match_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    for c in root["helpers"].as_array().unwrap() {
        let ctx = c["fn"].as_str().unwrap();
        match ctx {
            "isAiAiPeaceBalanceAllowed" => {
                let loser = if c["loser"].is_null() {
                    None
                } else {
                    Some(num(&c["loser"]))
                };
                let got = is_ai_ai_peace_balance_allowed(num(&c["winner"]), loser, num(&c["min"]));
                assert_eq!(got, c["out"].as_bool().unwrap(), "{ctx} {c}");
            }
            "aiAiPeaceRequiredPn" => {
                let got = ai_ai_peace_required_pn(
                    num(&c["base"]),
                    num(&c["winnerAtZero"]),
                    num(&c["min"]),
                );
                same(got, &c["out"], &format!("{ctx} {c}"));
            }
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }
}

// --- ticks --------------------------------------------------------------------

#[test]
fn ticks_v2_match_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    let mut total_ticks = 0usize;
    for sc in root["ticks"].as_array().unwrap() {
        let name = sc["name"].as_str().unwrap();
        let env_in = &sc["env"];
        let limit = env_in.get("limit").map(num);
        let eligible_not: Vec<String> = env_in
            .get("eligibleNot")
            .and_then(|v| v.as_array())
            .map(|a| a.iter().map(|s| s.as_str().unwrap().to_string()).collect())
            .unwrap_or_default();
        let share: Vec<(String, f64)> = env_in
            .get("share")
            .and_then(|v| v.as_object())
            .map(|m| m.iter().map(|(k, v)| (k.clone(), num(v))).collect())
            .unwrap_or_default();
        let gate: Vec<(String, GateVerdict)> = env_in
            .get("gate")
            .and_then(|v| v.as_object())
            .map(|m| {
                m.iter()
                    .map(|(k, v)| (k.clone(), gate_of(v.as_str().unwrap())))
                    .collect()
            })
            .unwrap_or_default();
        let peace_allowed_map: Option<Vec<(String, bool)>> = env_in
            .get("peaceAllowed")
            .and_then(|v| v.as_object())
            .map(|m| {
                m.iter()
                    .map(|(k, v)| (k.clone(), v.as_bool().unwrap()))
                    .collect()
            });
        let prices: Vec<(String, PeacePriceQuote)> = env_in["price"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| {
                (
                    k.clone(),
                    PeacePriceQuote {
                        required_pn: num(&v["requiredPn"]),
                        tolerance_pn: num(&v["tolerancePn"]),
                        balance: shape_of(&v["shape"]),
                    },
                )
            })
            .collect();
        let loser_shapes: Vec<(String, PeaceBalanceShape)> = env_in
            .get("loserShape")
            .and_then(|v| v.as_object())
            .map(|m| m.iter().map(|(k, v)| (k.clone(), shape_of(v))).collect())
            .unwrap_or_default();
        let assets_map: Vec<(String, Vec<PeaceAsset>)> = env_in
            .get("assets")
            .and_then(|v| v.as_object())
            .map(|m| {
                m.iter()
                    .map(|(k, v)| {
                        (
                            k.clone(),
                            v.as_array().unwrap().iter().map(asset_of).collect(),
                        )
                    })
                    .collect()
            })
            .unwrap_or_default();
        let city_fail: Vec<String> = env_in
            .get("cityFail")
            .and_then(|v| v.as_array())
            .map(|a| a.iter().map(|s| s.as_str().unwrap().to_string()).collect())
            .unwrap_or_default();
        let battle_pending = env_in
            .get("battlePending")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let pair_eligible = |a: i64, b: i64| !eligible_not.iter().any(|k| *k == format!("{a}-{b}"));
        let share_of = |r: i64, o: i64| {
            let k = format!("{r}-{o}");
            share
                .iter()
                .find(|(kk, _)| *kk == k)
                .map(|(_, v)| *v)
                .unwrap_or(0.5)
        };
        let gate_v = |w: i64, l: i64| {
            let k = format!("{w}-{l}");
            gate.iter()
                .find(|(kk, _)| *kk == k)
                .map(|(_, v)| *v)
                .unwrap_or(GateVerdict::Ok)
        };
        let price = |w: i64, l: i64, kind: AiPeaceKind| -> PeacePriceQuote {
            let k = format!("{w}-{l}-{}", kind.name());
            prices
                .iter()
                .find(|(kk, _)| *kk == k)
                .map(|(_, q)| *q)
                .unwrap_or_else(|| panic!("brak wyceny {k}"))
        };
        let get_assets = |l: i64, w: i64, skip: &HashSet<String>| -> Vec<PeaceAsset> {
            let k = format!("{l}-{w}");
            assets_map
                .iter()
                .find(|(kk, _)| *kk == k)
                .map(|(_, v)| v.clone())
                .unwrap_or_default()
                .into_iter()
                .filter(|a| !skip.contains(&a.id))
                .collect()
        };
        let city_ok = |cid: &str, _l: i64, _w: i64| -> bool { !city_fail.iter().any(|c| c == cid) };
        let peace_allowed_fn = |l: i64, w: i64| -> bool {
            let k = format!("{l}-{w}");
            peace_allowed_map
                .as_ref()
                .and_then(|m| m.iter().find(|(kk, _)| *kk == k).map(|(_, v)| *v))
                .unwrap_or(true)
        };
        let loser_fn = |w: i64, l: i64, kind: AiPeaceKind, covered: f64| -> Option<f64> {
            // NIE_ZMIERZONO: wektory generatora maja jeden rodzaj na pare (klucz `w-l`), wiec ta domkniecie
            // ignoruje `kind`; zaleznosc bilansu od rodzaju (basePn) nie jest pokryta wektorami.
            let _ = kind;
            let k = format!("{w}-{l}");
            loser_shapes
                .iter()
                .find(|(kk, _)| *kk == k)
                .map(|(_, s)| s.balance_for(covered))
        };

        let mut store = AiPeaceRequestStore::new();
        for e in sc["env"]["store0"].as_array().unwrap() {
            let key = e["key"].as_str().unwrap();
            register_ai_peace_request(
                &mut store,
                key,
                e["requesterId"].as_i64().unwrap(),
                e["otherId"].as_i64().unwrap(),
                num(&e["sinceTurn"]),
                kind_of_opt(&e["kind"]),
            );
        }
        let ticks_exp = sc["ticks"].as_array().unwrap();
        let ticks_in = env_in["ticks"].as_array().unwrap();
        assert_eq!(ticks_in.len(), ticks_exp.len(), "{name}: liczba tur");
        for (ti, (turn_v, exp)) in ticks_in.iter().zip(ticks_exp).enumerate() {
            let ctx = format!("{name}[tura {ti}]");
            total_ticks += 1;
            let base = AiPeaceTickEnv {
                turn: num(turn_v),
                limit,
                pair_eligible: &pair_eligible,
                requester_share_of: &share_of,
                gate_verdict: &gate_v,
                price: &price,
                assets: &get_assets,
                city_cession_ok: &city_ok,
                battle_pending,
            };
            let tenv = AiPeaceTickEnvV2 {
                base,
                peace_allowed: if peace_allowed_map.is_some() {
                    Some(&peace_allowed_fn as &dyn Fn(i64, i64) -> bool)
                } else {
                    None
                },
                loser_balance_for: if loser_shapes.is_empty() {
                    None
                } else {
                    Some(&loser_fn as &dyn Fn(i64, i64, AiPeaceKind, f64) -> Option<f64>)
                },
            };
            let mut pays: Vec<(i64, i64, f64)> = Vec::new();
            let mut finalizes: Vec<(i64, i64, AiPeaceKind)> = Vec::new();
            let mut logs: Vec<String> = Vec::new();
            let outs = run_ai_ai_peace_tick_v2(
                &mut store,
                &tenv,
                &mut |l, w, p: &PeacePaymentPlan| pays.push((l, w, p.covered_pn)),
                &mut |l, w, k| finalizes.push((l, w, k)),
                &mut |m: &str| logs.push(m.to_string()),
            );

            let outs_exp = exp["outcomes"].as_array().unwrap();
            assert_eq!(outs.len(), outs_exp.len(), "{ctx}: liczba wynikow");
            for (oi, (o, e)) in outs.iter().zip(outs_exp).enumerate() {
                let octx = format!("{ctx} out{oi}");
                assert_eq!(
                    o.pair_key,
                    e["pairKey"].as_str().unwrap(),
                    "{octx}: pairKey"
                );
                assert_eq!(
                    o.action.name(),
                    e["action"].as_str().unwrap(),
                    "{octx}: action"
                );
                assert_eq!(o.kind.name(), e["kind"].as_str().unwrap(), "{octx}: kind");
                match (&o.plan, e["plan"].is_null()) {
                    (None, true) => {}
                    (Some(p), false) => plan_check(p, &e["plan"], &octx),
                    _ => panic!("{octx}: plan obecnosc"),
                }
                match (&o.decision, e["decision"].is_null()) {
                    (None, true) => {}
                    (Some(d), false) => decision_check_v2(d, &e["decision"], &octx),
                    _ => panic!("{octx}: decision obecnosc"),
                }
            }

            let pays_exp = exp["pays"].as_array().unwrap();
            assert_eq!(pays.len(), pays_exp.len(), "{ctx}: liczba zaplat");
            for (pi, ((l, w, c), e)) in pays.iter().zip(pays_exp).enumerate() {
                let e = e.as_array().unwrap();
                assert_eq!(
                    (*l, *w),
                    (e[0].as_i64().unwrap(), e[1].as_i64().unwrap()),
                    "{ctx}: pay{pi} strony"
                );
                same(*c, &e[2], &format!("{ctx}: pay{pi} covered"));
            }
            let fin_exp = exp["finalizes"].as_array().unwrap();
            assert_eq!(finalizes.len(), fin_exp.len(), "{ctx}: liczba finalize");
            for (fi, ((l, w, k), e)) in finalizes.iter().zip(fin_exp).enumerate() {
                let e = e.as_array().unwrap();
                assert_eq!(
                    (*l, *w, k.name()),
                    (
                        e[0].as_i64().unwrap(),
                        e[1].as_i64().unwrap(),
                        e[2].as_str().unwrap()
                    ),
                    "{ctx}: finalize{fi}"
                );
            }
            let logs_exp = exp["logs"].as_array().unwrap();
            assert_eq!(logs.len(), logs_exp.len(), "{ctx}: liczba logow");
            for (li, (a, e)) in logs.iter().zip(logs_exp).enumerate() {
                assert_eq!(a, e.as_str().unwrap(), "{ctx}: log{li}");
            }
        }
        let store_end: Vec<String> = store.entries().iter().map(|(k, _)| k.clone()).collect();
        let store_end_exp: Vec<String> = sc["storeEnd"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect();
        assert_eq!(store_end, store_end_exp, "{name}: magazyn po tickach");
    }
    assert!(total_ticks >= 9, "za malo tur: {total_ticks}");
}

// --- wlasnosci (bez wektorow) ---------------------------------------------------

#[test]
fn balance_blocked_is_checked_before_limit_even_at_limit() {
    let req = AiPeaceRequest {
        requester_id: 1,
        other_id: 2,
        since_turn: 0.0,
        kind: AiPeaceKind::Pokoj,
    };
    let plan = plan_peace_payment(0.0, &[]);
    let inp = AiPeaceDecisionInputV2 {
        base: AiPeaceDecisionInput {
            req: &req,
            turn: 10.0,
            plan: &plan,
            balance_before_pn: 0.0,
            balance_after_pn: -0.25,
            tolerance_pn: 0.0,
            winner_gate_verdict: GateVerdict::Ok,
            limit: Some(2.0),
        },
        loser_balance_after_pn: None,
        min_balance_pn: AI_AI_PEACE_MIN_BALANCE,
    };
    let d = decide_ai_peace_request_v2(&inp);
    assert_eq!(d.action, AiPeaceAction::Wait);
    assert_eq!(d.reason, AiPeaceReasonV2::BalanceBlocked);
    assert_eq!(d.reason.code(), "balance_blocked");
}

#[test]
fn none_loser_balance_is_not_checked() {
    assert!(is_ai_ai_peace_balance_allowed(0.0, None, 0.0));
    assert!(!is_ai_ai_peace_balance_allowed(0.0, Some(f64::NAN), 0.0));
    assert!(!is_ai_ai_peace_balance_allowed(f64::NAN, None, 0.0));
}
