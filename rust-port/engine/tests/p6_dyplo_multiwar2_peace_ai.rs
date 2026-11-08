//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 (runda 4, partia C): zgodnosc `diplomacy_ai_forced_peace` z URUCHOMIONYM
//! webem (origin/main 5dd53e60f, `gra/src/game/diplomacy-ai-forced-peace.ts`).
//! Wektory: `tests/p6_dyplo_multiwar2_peace_ai_data/peace_ai.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-forced-peace.mts`.
//! Pokrycie: rejestracja prosby (kolejnosc Map, brak nadpisania), tury od prosby (NaN), `isForcedPeaceDue` (N-1/N/N+1,
//! limit jawny/domyslny/NaN), kwalifikacja pary, udzial sily (granice 0.45/0.5), `decideAiPeaceRequest` (zaokraglenie
//! `Math.round`, tolerancja, bramka), pelny tick (dropy, cesja miast, guard 8, battlePending, kolejnosc, log, NaN).
//! Wycena `balanceFor`: dwie postacie (linear, kinked) - patrz naglowek modulu Rust.

use civ_engine::domain::diplomacy_ai_forced_peace::*;
use civ_engine::domain::diplomacy_multiwar_peace::{
    plan_peace_payment, PeaceAsset, PeaceAssetKind, PeacePaymentPlan,
};
use serde_json::Value;
use std::collections::HashSet;

const DATA: &str = include_str!("p6_dyplo_multiwar2_peace_ai_data/peace_ai.json");

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
        other => panic!("nieznany rodzaj aktywa {other}"),
    }
}

fn asset_kind_name(k: PeaceAssetKind) -> &'static str {
    match k {
        PeaceAssetKind::Zloto => "zloto",
        PeaceAssetKind::SurowiecIlosc => "surowiec_ilosc",
        PeaceAssetKind::Miasto => "miasto",
    }
}

fn asset_of(v: &Value) -> PeaceAsset {
    PeaceAsset {
        kind: asset_kind(v["kind"].as_str().unwrap()),
        id: v["id"].as_str().unwrap().to_string(),
        amount: num(&v["amount"]),
        pn: num(&v["pn"]),
        forbidden: v["forbidden"].as_bool().unwrap_or(false),
    }
}

fn shape_of(v: &Value) -> PeaceBalanceShape {
    match v["type"].as_str().unwrap() {
        "linear" => PeaceBalanceShape::Linear {
            balance0: num(&v["balance0"]),
            slope: num(&v["slope"]),
        },
        "kinked" => PeaceBalanceShape::Kinked {
            balance0: num(&v["balance0"]),
            slope: num(&v["slope"]),
            knee: num(&v["knee"]),
            slope2: num(&v["slope2"]),
        },
        other => panic!("nieznany ksztalt {other}"),
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

/// Kod powodu zgodny z generatorem (`reasonCode`).
fn reason_code(r: AiPeaceReason) -> String {
    match r {
        AiPeaceReason::LimitReached => "limit".to_string(),
        AiPeaceReason::GateNotOk(v) => format!("gate:{}", v.name()),
        AiPeaceReason::BalanceInTolerance => "balance_in_tolerance".to_string(),
        AiPeaceReason::BalanceBelowTolerance => "balance_below_tolerance".to_string(),
    }
}

fn plan_check(p: &PeacePaymentPlan, exp: &Value, ctx: &str) {
    let items = exp["items"].as_array().unwrap();
    assert_eq!(p.items.len(), items.len(), "{ctx}: liczba pozycji planu");
    for (i, (a, e)) in p.items.iter().zip(items).enumerate() {
        assert_eq!(
            asset_kind_name(a.kind),
            e["kind"].as_str().unwrap(),
            "{ctx}: item{i}.kind"
        );
        assert_eq!(a.id, e["id"].as_str().unwrap(), "{ctx}: item{i}.id");
        same(a.amount, &e["amount"], &format!("{ctx}: item{i}.amount"));
        same(a.pn, &e["pn"], &format!("{ctx}: item{i}.pn"));
    }
    same(p.covered_pn, &exp["covered"], &format!("{ctx}: covered"));
    same(
        p.shortfall_pn,
        &exp["shortfall"],
        &format!("{ctx}: shortfall"),
    );
    assert_eq!(p.full, exp["full"].as_bool().unwrap(), "{ctx}: full");
    let h = exp["hist"].as_array().unwrap();
    assert_eq!(
        [
            p.histogram.zloto,
            p.histogram.surowiec_ilosc,
            p.histogram.miasto
        ],
        [
            h[0].as_i64().unwrap(),
            h[1].as_i64().unwrap(),
            h[2].as_i64().unwrap()
        ],
        "{ctx}: histogram"
    );
}

fn decision_check(d: &AiPeaceDecision, exp: &Value, ctx: &str) {
    assert_eq!(
        d.action.name(),
        exp["action"].as_str().unwrap(),
        "{ctx}: action"
    );
    assert_eq!(
        reason_code(d.reason),
        exp["reason"].as_str().unwrap(),
        "{ctx}: reason"
    );
    same(
        d.balance_before,
        &exp["balanceBefore"],
        &format!("{ctx}: balanceBefore"),
    );
    same(
        d.balance_after,
        &exp["balanceAfter"],
        &format!("{ctx}: balanceAfter"),
    );
    same(
        d.turns_since,
        &exp["turnsSince"],
        &format!("{ctx}: turnsSince"),
    );
}

fn store_check(s: &AiPeaceRequestStore, exp: &Value, ctx: &str) {
    let rows = exp.as_array().unwrap();
    assert_eq!(s.len(), rows.len(), "{ctx}: rozmiar store");
    for ((k, r), e) in s.entries().iter().zip(rows) {
        assert_eq!(k, e["key"].as_str().unwrap(), "{ctx}: klucz");
        assert_eq!(
            r.requester_id,
            e["requesterId"].as_i64().unwrap(),
            "{ctx}: requester"
        );
        assert_eq!(r.other_id, e["otherId"].as_i64().unwrap(), "{ctx}: other");
        same(r.since_turn, &e["sinceTurn"], &format!("{ctx}: sinceTurn"));
        assert_eq!(r.kind, kind_of(e["kind"].as_str().unwrap()), "{ctx}: kind");
    }
}

fn build_store(entries: &Value) -> AiPeaceRequestStore {
    let mut s = AiPeaceRequestStore::new();
    for e in entries.as_array().unwrap() {
        register_ai_peace_request(
            &mut s,
            e["key"].as_str().unwrap(),
            e["requesterId"].as_i64().unwrap(),
            e["otherId"].as_i64().unwrap(),
            num(&e["sinceTurn"]),
            kind_of_opt(&e["kind"]),
        );
    }
    s
}

fn req_of(since_turn: f64) -> AiPeaceRequest {
    AiPeaceRequest {
        requester_id: 1,
        other_id: 2,
        since_turn,
        kind: AiPeaceKind::Pokoj,
    }
}

fn str_list(v: &Value) -> Vec<String> {
    v.as_array()
        .map(|a| a.iter().map(|x| x.as_str().unwrap().to_string()).collect())
        .unwrap_or_default()
}

// --- jednostkowe ---------------------------------------------------------------

#[test]
fn register_keeps_first_request_and_map_order() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    let u = &root["unit"]["register"];
    let mut s = AiPeaceRequestStore::new();
    let r1 = register_ai_peace_request(&mut s, "1-2", 1, 2, 10.0, AiPeaceKind::Pokoj);
    let r2 = register_ai_peace_request(&mut s, "1-2", 1, 2, 12.0, AiPeaceKind::Rozejm);
    let r3 = register_ai_peace_request(&mut s, "3-4", 3, 4, 12.0, AiPeaceKind::Rozejm);
    let got = vec![r1, r2, r3];
    let exp: Vec<bool> = u["results"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_bool().unwrap())
        .collect();
    assert_eq!(got, exp, "wyniki rejestracji");
    store_check(&s, &u["store"], "register");
}

#[test]
fn turns_since_matches_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    for (i, c) in root["unit"]["turns"].as_array().unwrap().iter().enumerate() {
        let r = req_of(num(&c["in"]["sinceTurn"]));
        let got = turns_since_peace_request(&r, num(&c["in"]["turn"]));
        same(got, &c["out"], &format!("turns[{i}]"));
    }
}

#[test]
fn due_matches_web_including_default_and_nan_limit() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    assert_eq!(AI_PEACE_TURNS_AFTER_REQUEST, num(&root["unit"]["limit"]));
    for (i, c) in root["unit"]["due"].as_array().unwrap().iter().enumerate() {
        let r = req_of(num(&c["in"]["sinceTurn"]));
        let turn = num(&c["in"]["turn"]);
        let got = match c["in"].get("limit") {
            Some(l) => is_forced_peace_due(&r, turn, num(l)),
            None => is_forced_peace_due_default(&r, turn),
        };
        assert_eq!(got, c["out"].as_bool().unwrap(), "due[{i}]");
    }
}

#[test]
fn eligibility_matches_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    for (i, c) in root["unit"]["eligible"]
        .as_array()
        .unwrap()
        .iter()
        .enumerate()
    {
        let b = |k: &str| c["in"][k].as_bool().unwrap();
        let p = ForcedPeacePairInput {
            a_is_human: b("aIsHuman"),
            b_is_human: b("bIsHuman"),
            a_is_major_ai: b("aIsMajorAi"),
            b_is_major_ai: b("bIsMajorAi"),
            eliminated: b("eliminated"),
            forced_epoch_war: b("forcedEpochWar"),
            at_war: b("atWar"),
        };
        assert_eq!(
            is_forced_peace_eligible_pair(&p),
            c["out"].as_bool().unwrap(),
            "eligible[{i}]"
        );
    }
}

#[test]
fn share_thresholds_match_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    for (i, c) in root["unit"]["share"].as_array().unwrap().iter().enumerate() {
        let s = requester_share(num(&c["in"]["rp"]), num(&c["in"]["op"]));
        let ctx = format!("share[{i}]");
        same(s, &c["out"]["share"], &ctx);
        assert_eq!(
            is_clearly_losing(s),
            c["out"]["clearly"].as_bool().unwrap(),
            "{ctx}: clearly"
        );
        assert_eq!(
            is_still_losing(s),
            c["out"]["still"].as_bool().unwrap(),
            "{ctx}: still"
        );
    }
}

#[test]
fn decide_matches_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    for c in root["unit"]["decide"].as_array().unwrap() {
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
        let req = req_of(num(&i["sinceTurn"]));
        let inp = AiPeaceDecisionInput {
            req: &req,
            turn: num(&i["turn"]),
            plan: &plan,
            balance_before_pn: num(&i["balanceBeforePn"]),
            balance_after_pn: num(&i["balanceAfterPn"]),
            tolerance_pn: num(&i["tolerancePn"]),
            winner_gate_verdict: gate_of(i["gate"].as_str().unwrap()),
            limit: i.get("limit").map(num),
        };
        let d = decide_ai_peace_request(&inp);
        decision_check(&d, &c["out"], name);
    }
}

// --- tick --------------------------------------------------------------------

#[test]
fn tick_scenarios_match_web() {
    let root: Value = serde_json::from_str(DATA).unwrap();
    let mut total_ticks = 0usize;
    for sc in root["ticks"].as_array().unwrap() {
        let name = sc["name"].as_str().unwrap();
        let env_in = &sc["env"];
        let eligible_not = str_list(&env_in["eligibleNot"]);
        let share: Vec<(String, f64)> = env_in["share"]
            .as_object()
            .map(|m| m.iter().map(|(k, v)| (k.clone(), num(v))).collect())
            .unwrap_or_default();
        let gate: Vec<(String, GateVerdict)> = env_in["gate"]
            .as_object()
            .map(|m| {
                m.iter()
                    .map(|(k, v)| (k.clone(), gate_of(v.as_str().unwrap())))
                    .collect()
            })
            .unwrap_or_default();
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
        let assets: Vec<(String, Vec<PeaceAsset>)> = env_in["assets"]
            .as_object()
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
        let city_fail = str_list(&env_in["cityFail"]);
        let battle_pending = env_in["battlePending"].as_bool().unwrap_or(false);
        let limit = env_in.get("limit").map(num);

        let lookup_share = |r: i64, o: i64| -> f64 {
            let k = format!("{r}-{o}");
            share
                .iter()
                .find(|(x, _)| *x == k)
                .map(|(_, v)| *v)
                .unwrap_or(0.5)
        };
        let lookup_gate = |w: i64, l: i64| -> GateVerdict {
            let k = format!("{w}-{l}");
            gate.iter()
                .find(|(x, _)| *x == k)
                .map(|(_, v)| *v)
                .unwrap_or(GateVerdict::Ok)
        };
        let pair_eligible = |a: i64, b: i64| !eligible_not.contains(&format!("{a}-{b}"));
        let price = |w: i64, l: i64, k: AiPeaceKind| -> PeacePriceQuote {
            let key = format!("{w}-{l}-{}", k.name());
            prices
                .iter()
                .find(|(x, _)| *x == key)
                .map(|(_, v)| *v)
                .unwrap_or_else(|| panic!("brak wyceny {key}"))
        };
        let get_assets = |l: i64, w: i64, skip: &HashSet<String>| -> Vec<PeaceAsset> {
            let key = format!("{l}-{w}");
            assets
                .iter()
                .find(|(x, _)| *x == key)
                .map(|(_, v)| v.clone())
                .unwrap_or_default()
                .into_iter()
                .filter(|a| !skip.contains(&a.id))
                .collect()
        };
        let city_ok = |cid: &str, _l: i64, _w: i64| -> bool { !city_fail.iter().any(|c| c == cid) };
        let share_of = |r: i64, o: i64| lookup_share(r, o);
        let gate_v = |w: i64, l: i64| lookup_gate(w, l);

        let mut store = build_store(&env_in["store0"]);
        let ticks_exp = sc["out"]["ticks"].as_array().unwrap();
        assert_eq!(
            env_in["ticks"].as_array().unwrap().len(),
            ticks_exp.len(),
            "{name}: liczba tur"
        );
        for (ti, (turn_v, exp)) in env_in["ticks"]
            .as_array()
            .unwrap()
            .iter()
            .zip(ticks_exp)
            .enumerate()
        {
            let ctx = format!("{name}[tura {ti}]");
            total_ticks += 1;
            let turn = num(turn_v);
            let tenv = AiPeaceTickEnv {
                turn,
                limit,
                pair_eligible: &pair_eligible,
                requester_share_of: &share_of,
                gate_verdict: &gate_v,
                price: &price,
                assets: &get_assets,
                city_cession_ok: &city_ok,
                battle_pending,
            };
            let mut pays: Vec<(i64, i64, f64)> = Vec::new();
            let mut finalizes: Vec<(i64, i64, AiPeaceKind)> = Vec::new();
            let mut logs: Vec<String> = Vec::new();
            let outs = run_ai_ai_peace_tick(
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
                    (Some(d), false) => decision_check(d, &e["decision"], &octx),
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
                    (*l, *w),
                    (e[0].as_i64().unwrap(), e[1].as_i64().unwrap()),
                    "{ctx}: fin{fi}"
                );
                assert_eq!(k.name(), e[2].as_str().unwrap(), "{ctx}: fin{fi} kind");
            }

            let logs_exp = str_list(&exp["logs"]);
            assert_eq!(logs, logs_exp, "{ctx}: logi (tekst)");

            store_check(&store, &exp["store"], &format!("{ctx} store"));
        }
    }
    assert!(total_ticks >= 20, "za malo tur w wektorach: {total_ticks}");
}

#[test]
fn js_round_and_num_helpers() {
    assert_eq!(js_round(-50.5), -50.0);
    assert_eq!(js_round(-49.5), -49.0);
    assert_eq!(js_round(2.5), 3.0);
    assert!(js_round(f64::NAN).is_nan());
    assert_eq!(js_num(0.0), "0");
    assert_eq!(js_num(-0.0), "0");
    assert_eq!(js_num(f64::NAN), "NaN");
    assert_eq!(js_num(-500.0), "-500");
}
