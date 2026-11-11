//! R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7): tik AI<->AI `run_ai_ai_peace_turn` na wektorach z weba,
//! pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (`runAiAiPeaceTick` z `peaceAllowed`, `gra/src/game/diplomacy-ai-forced-peace.ts`).
//! Wektory: `tests/p6_wire_war_siege_aiai_vectors/vectors.json` (sekcja `peace`), generator
//! `tests/p6_wire_war_siege_aiai_gen.mjs`. Pozostale testy W7: `p6_wire_war_siege_aiai.rs`.

use std::collections::{HashMap, HashSet};

use civ_engine::domain::diplomacy_ai_forced_peace::{
    register_ai_peace_request, AiPeaceKind, AiPeaceRequestStore, AiPeaceTickAction, AiPeaceTickEnv,
    GateVerdict, PeaceBalanceShape, PeacePriceQuote,
};
use civ_engine::domain::diplomacy_multiwar_peace::{PeaceAsset, PeaceAssetKind, PeacePaymentPlan};
use civ_engine::domain::war_turn_ai_ai::{
    peace_allowed_for_turns, peace_tick_should_run, run_ai_ai_peace_turn,
    PEACE_PROPOSAL_MIN_WAR_TURNS,
};
use serde_json::Value;

const DATA: &str = include_str!("p6_wire_war_siege_aiai_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(DATA).expect("wektory JSON")
}

fn opt_f64(v: &Value) -> Option<f64> {
    v.as_f64()
}

fn key(a: i64, b: i64) -> String {
    format!("{a},{b}")
}

// Sekcja 2: peace
// ---------------------------------------------------------------------------

fn asset_of(v: &Value) -> PeaceAsset {
    let kind = match v["kind"].as_str().unwrap() {
        "zloto" => PeaceAssetKind::Zloto,
        "surowiec_ilosc" => PeaceAssetKind::SurowiecIlosc,
        "miasto" => PeaceAssetKind::Miasto,
        other => panic!("nieznany rodzaj aktywa: {other}"),
    };
    PeaceAsset {
        kind,
        id: v["id"].as_str().unwrap().to_string(),
        amount: v["amount"].as_f64().unwrap(),
        pn: v["pn"].as_f64().unwrap(),
        forbidden: v["forbidden"].as_bool().unwrap_or(false),
    }
}

fn kind_of(s: &str) -> AiPeaceKind {
    match s {
        "pokoj" => AiPeaceKind::Pokoj,
        "rozejm" => AiPeaceKind::Rozejm,
        other => panic!("nieznany rodzaj: {other}"),
    }
}

fn gate_of(s: &str) -> GateVerdict {
    match s {
        "ok" => GateVerdict::Ok,
        "too_early" => GateVerdict::TooEarly,
        "stronger" => GateVerdict::Stronger,
        other => panic!("nieznana bramka: {other}"),
    }
}

#[derive(Debug, PartialEq)]
struct PayRec {
    loser: i64,
    winner: i64,
    covered_pn: f64,
    ids: Vec<String>,
}

#[test]
fn peace_tick_with_allowed_gate_matches_web_vectors() {
    let v = vectors();
    let cases = v["peace"].as_array().expect("peace");
    assert!(
        cases.len() >= 300,
        "za mało przypadków peace: {}",
        cases.len()
    );
    let mut mismatches: Vec<String> = Vec::new();

    for (idx, c) in cases.iter().enumerate() {
        let pair_eligible: HashMap<String, bool> = c["pairEligible"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), x.as_bool().unwrap()))
            .collect();
        let share: HashMap<String, f64> = c["share"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), x.as_f64().unwrap()))
            .collect();
        let turns: HashMap<String, f64> = c["turnsAtWar"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), x.as_f64().unwrap()))
            .collect();
        let gate: HashMap<String, GateVerdict> = c["gate"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), gate_of(x.as_str().unwrap())))
            .collect();
        let price: HashMap<String, (f64, f64, f64, f64, f64, f64)> = c["price"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| {
                (
                    k.clone(),
                    (
                        x["requiredPn"].as_f64().unwrap(),
                        x["tolerancePn"].as_f64().unwrap(),
                        x["balance0"].as_f64().unwrap(),
                        x["slope"].as_f64().unwrap(),
                        x["lbalance0"].as_f64().unwrap(),
                        x["lslope"].as_f64().unwrap(),
                    ),
                )
            })
            .collect();
        let assets: HashMap<String, Vec<PeaceAsset>> = c["assets"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| {
                (
                    k.clone(),
                    x.as_array().unwrap().iter().map(asset_of).collect(),
                )
            })
            .collect();
        let city_ok: HashMap<String, bool> = c["cityOk"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), x.as_bool().unwrap()))
            .collect();
        let battle_pending = c["battlePending"].as_bool().unwrap();
        let turn = c["turn"].as_f64().unwrap();

        let mut store = AiPeaceRequestStore::new();
        for e in c["entries"].as_array().unwrap() {
            register_ai_peace_request(
                &mut store,
                e["pairKey"].as_str().unwrap(),
                e["requesterId"].as_i64().unwrap(),
                e["otherId"].as_i64().unwrap(),
                e["sinceTurn"].as_f64().unwrap(),
                kind_of(e["kind"].as_str().unwrap()),
            );
        }

        let pe = |a: i64, b: i64| *pair_eligible.get(&key(a, b)).expect("pairEligible");
        let sh = |a: i64, b: i64| *share.get(&key(a, b)).expect("share");
        let gt = |w: i64, l: i64| *gate.get(&key(w, l)).expect("gate");
        let pr = |w: i64, l: i64, _k: AiPeaceKind| -> PeacePriceQuote {
            let (req, tol, b0, slope, _, _) = *price.get(&key(w, l)).expect("price");
            PeacePriceQuote {
                required_pn: req,
                tolerance_pn: tol,
                balance: PeaceBalanceShape::Linear {
                    balance0: b0,
                    slope,
                },
            }
        };
        let asf = |loser: i64, winner: i64, skip: &HashSet<String>| -> Vec<PeaceAsset> {
            assets
                .get(&key(loser, winner))
                .expect("assets")
                .iter()
                .filter(|a| !(a.kind == PeaceAssetKind::Miasto && skip.contains(&a.id)))
                .cloned()
                .collect()
        };
        let cco = |cid: &str, loser: i64, winner: i64| -> bool {
            *city_ok
                .get(&format!("{cid}|{loser}|{winner}"))
                .unwrap_or(&false)
        };
        let loser_bal = |w: i64, l: i64, covered: f64| -> f64 {
            let (_, _, _, _, lb0, ls) = *price.get(&key(w, l)).expect("price");
            lb0 + ls * covered
        };
        let min_balance = c["minBalancePn"].as_f64().unwrap();
        let peace_allowed = |loser: i64, winner: i64| -> bool {
            peace_allowed_for_turns(*turns.get(&key(loser, winner)).expect("turnsAtWar"))
        };

        let env = AiPeaceTickEnv {
            turn,
            limit: None,
            pair_eligible: &pe,
            requester_share_of: &sh,
            gate_verdict: &gt,
            price: &pr,
            assets: &asf,
            city_cession_ok: &cco,
            battle_pending,
        };

        let mut pay_log: Vec<PayRec> = Vec::new();
        let mut fin_log: Vec<(i64, i64, String)> = Vec::new();
        let mut pay = |loser: i64, winner: i64, plan: &PeacePaymentPlan| {
            pay_log.push(PayRec {
                loser,
                winner,
                covered_pn: plan.covered_pn,
                ids: plan.items.iter().map(|i| i.id.clone()).collect(),
            });
        };
        let mut fin = |loser: i64, winner: i64, kind: AiPeaceKind| {
            fin_log.push((loser, winner, kind.name().to_string()));
        };
        let mut log = |_: &str| {};

        let outcomes = run_ai_ai_peace_turn(
            &mut store,
            &env,
            &peace_allowed,
            min_balance,
            &loser_bal,
            &mut pay,
            &mut fin,
            &mut log,
        );

        let e = &c["expected"];
        let exp_outcomes = e["outcomes"].as_array().unwrap();
        let mut got_rows: Vec<String> = Vec::new();
        let mut exp_rows: Vec<String> = Vec::new();
        for o in &outcomes {
            got_rows.push(format!(
                "{}|{}|{}|{:?}|{:?}",
                o.pair_key,
                o.action.name(),
                o.kind.name(),
                o.plan.as_ref().map(|p| p.covered_pn),
                o.plan
                    .as_ref()
                    .map(|p| p.items.iter().map(|i| i.id.clone()).collect::<Vec<_>>()),
            ));
        }
        for x in exp_outcomes {
            let cov = opt_f64(&x["coveredPn"]);
            let ids: Option<Vec<String>> = x["ids"]
                .as_array()
                .map(|a| a.iter().map(|s| s.as_str().unwrap().to_string()).collect());
            exp_rows.push(format!(
                "{}|{}|{}|{:?}|{:?}",
                x["pairKey"].as_str().unwrap(),
                x["action"].as_str().unwrap(),
                x["kind"].as_str().unwrap(),
                cov,
                ids,
            ));
        }
        let remaining: Vec<String> = store.entries().iter().map(|(k, _)| k.clone()).collect();
        let exp_remaining: Vec<String> = e["remainingKeys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect();
        let exp_pay: Vec<PayRec> = e["pay"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| PayRec {
                loser: p["loser"].as_i64().unwrap(),
                winner: p["winner"].as_i64().unwrap(),
                covered_pn: p["coveredPn"].as_f64().unwrap(),
                ids: p["ids"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|s| s.as_str().unwrap().to_string())
                    .collect(),
            })
            .collect();
        let exp_fin: Vec<(i64, i64, String)> = e["finalize"]
            .as_array()
            .unwrap()
            .iter()
            .map(|f| {
                (
                    f["loser"].as_i64().unwrap(),
                    f["winner"].as_i64().unwrap(),
                    f["kind"].as_str().unwrap().to_string(),
                )
            })
            .collect();

        // Akcja i rodzaj porownywane tekstowo; plan (pokrycie i identyfikatory) tylko gdy web go podaje.
        let got_actions: Vec<(String, String, String)> = outcomes
            .iter()
            .map(|o| {
                (
                    o.pair_key.clone(),
                    o.action.name().into(),
                    o.kind.name().into(),
                )
            })
            .collect();
        let exp_actions: Vec<(String, String, String)> = exp_outcomes
            .iter()
            .map(|x| {
                (
                    x["pairKey"].as_str().unwrap().into(),
                    x["action"].as_str().unwrap().into(),
                    x["kind"].as_str().unwrap().into(),
                )
            })
            .collect();
        let plan_ok = outcomes.iter().zip(exp_outcomes.iter()).all(|(o, x)| {
            match (&o.plan, opt_f64(&x["coveredPn"])) {
                (Some(p), Some(cov)) => {
                    p.covered_pn == cov
                        && x["ids"].as_array().map(|a| {
                            a.iter()
                                .map(|s| s.as_str().unwrap().to_string())
                                .collect::<Vec<_>>()
                        }) == Some(p.items.iter().map(|i| i.id.clone()).collect())
                }
                (None, None) => true,
                // Web podaje plan dla wait po cenie; Rust dla waitu pominietego przez bramke czasu nie.
                (None, Some(_)) => o.action == AiPeaceTickAction::Wait,
                _ => false,
            }
        });

        if got_actions != exp_actions
            || !plan_ok
            || remaining != exp_remaining
            || pay_log != exp_pay
            || fin_log != exp_fin
        {
            mismatches.push(format!(
                "przypadek {idx}:\n  got actions={got_actions:?}\n  exp actions={exp_actions:?}\n  got rows={got_rows:?}\n  exp rows={exp_rows:?}\n  remaining got={remaining:?} exp={exp_remaining:?}\n  pay got={pay_log:?}\n  pay exp={exp_pay:?}\n  fin got={fin_log:?} exp={exp_fin:?}"
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozjazdy peace ({}): {}",
        mismatches.len(),
        mismatches
            .iter()
            .take(2)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn peace_vectors_exercise_deferred_waits_and_real_ticks() {
    let v = vectors();
    let mut waits_by_time = 0usize;
    let mut forced_or_paid = 0usize;
    for c in v["peace"].as_array().unwrap() {
        for o in c["expected"]["outcomes"].as_array().unwrap() {
            match o["action"].as_str().unwrap() {
                "force" | "accept_paid" => forced_or_paid += 1,
                "wait" => waits_by_time += 1,
                _ => {}
            }
        }
    }
    assert!(forced_or_paid > 0, "wektory nie pokrywaja wykonania ticka");
    // Wait Z planem = wstrzymanie przez regule nieujemnego bilansu AI-AI (web: wait z plan + decision).
    let balance_blocked = v["peace"]
        .as_array()
        .unwrap()
        .iter()
        .flat_map(|c| c["expected"]["outcomes"].as_array().unwrap().iter())
        .filter(|o| o["action"] == "wait" && !o["coveredPn"].is_null())
        .count();
    assert!(
        balance_blocked > 0,
        "wektory nie pokrywaja wstrzymania bilansem"
    );
    assert!(waits_by_time > 0, "wektory nie pokrywaja oczekiwania");
}

#[test]
fn deferred_request_stays_queued_without_payment() {
    // Para kwalifikuje sie i nadal przegrywa, ale tura wojny < 10: wpis zostaje, bez zaplaty i bez finalize.
    let mut store = AiPeaceRequestStore::new();
    register_ai_peace_request(&mut store, "0-1:1", 1, 0, 5.0, AiPeaceKind::Pokoj);
    let pe = |_: i64, _: i64| true;
    let sh = |_: i64, _: i64| 0.2;
    let gt = |_: i64, _: i64| GateVerdict::Ok;
    let pr = |_: i64, _: i64, _: AiPeaceKind| PeacePriceQuote {
        required_pn: 100.0,
        tolerance_pn: 0.0,
        balance: PeaceBalanceShape::Linear {
            balance0: 0.0,
            slope: 1.0,
        },
    };
    let asf = |_: i64, _: i64, _: &HashSet<String>| -> Vec<PeaceAsset> {
        panic!("aktywa nie powinny byc liczone")
    };
    let cco = |_: &str, _: i64, _: i64| false;
    let env = AiPeaceTickEnv {
        turn: 9.0,
        limit: None,
        pair_eligible: &pe,
        requester_share_of: &sh,
        gate_verdict: &gt,
        price: &pr,
        assets: &asf,
        city_cession_ok: &cco,
        battle_pending: false,
    };
    let never_allowed =
        |_: i64, _: i64| peace_allowed_for_turns(PEACE_PROPOSAL_MIN_WAR_TURNS - 1.0);
    let mut pay = |_: i64, _: i64, _: &PeacePaymentPlan| panic!("zaplata niedozwolona");
    let mut fin = |_: i64, _: i64, _: AiPeaceKind| panic!("finalize niedozwolone");
    let mut log = |_: &str| {};
    let out = run_ai_ai_peace_turn(
        &mut store,
        &env,
        &never_allowed,
        0.0,
        &|_: i64, _: i64, _: f64| 100.0,
        &mut pay,
        &mut fin,
        &mut log,
    );
    assert_eq!(out.len(), 1);
    assert_eq!(out[0].action, AiPeaceTickAction::Wait);
    assert!(store.has("0-1:1"));
}

#[test]
fn peace_tick_gate_is_noop_on_empty_store() {
    assert!(!peace_tick_should_run(0));
    let mut store = AiPeaceRequestStore::new();
    let pe = |_: i64, _: i64| -> bool { panic!("nie wolano") };
    let sh = |_: i64, _: i64| -> f64 { panic!("nie wolano") };
    let gt = |_: i64, _: i64| GateVerdict::Ok;
    let pr = |_: i64, _: i64, _: AiPeaceKind| -> PeacePriceQuote { panic!("nie wolano") };
    let asf = |_: i64, _: i64, _: &HashSet<String>| -> Vec<PeaceAsset> { panic!("nie wolano") };
    let cco = |_: &str, _: i64, _: i64| false;
    let env = AiPeaceTickEnv {
        turn: 1.0,
        limit: None,
        pair_eligible: &pe,
        requester_share_of: &sh,
        gate_verdict: &gt,
        price: &pr,
        assets: &asf,
        city_cession_ok: &cco,
        battle_pending: false,
    };
    let allowed = |_: i64, _: i64| true;
    let mut pay = |_: i64, _: i64, _: &PeacePaymentPlan| {};
    let mut fin = |_: i64, _: i64, _: AiPeaceKind| {};
    let mut log = |_: &str| {};
    assert!(run_ai_ai_peace_turn(
        &mut store,
        &env,
        &allowed,
        0.0,
        &|_: i64, _: i64, _: f64| 0.0,
        &mut pay,
        &mut fin,
        &mut log
    )
    .is_empty());
}

// ---------------------------------------------------------------------------
