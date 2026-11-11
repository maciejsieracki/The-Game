//! R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7): tiki AI<->AI po fazie AI - prosba o pokoj i zmeczenie wojna.
//!
//! Port SKLADANIA z `gra/src/main.ts` (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75):
//! * `tickAiAiPeaceRequests(battlePending)` - bramka `size === 0` + `runAiAiPeaceTick` z `peaceAllowed`;
//! * `tickAiAiWarWeariness(battlePending)` - pary glownych AI w `wojna` (posortowane), bramka
//!   `pairs.length === 0 && store.size === 0`, potem `runWarWearinessTick`.
//!
//! Logika ticka (`diplomacy_ai_forced_peace.rs`, `diplomacy_war_weariness_tick.rs`) jest portowana osobno
//! i NIE jest tu zmieniana. Ten modul dodaje dwie rzeczy, ktorych brakuje w czystym porcie ticka:
//! * [`run_ai_ai_peace_turn`] egzekwuje web `peaceAllowed` (`turnsAtWar >= PEACE_PROPOSAL_MIN_WAR_TURNS`):
//!   wpis z zakazem zostaje w kolejce z akcja `wait` (web: `out.push({action:'wait'})` BEZ `delete`),
//!   a `pairEligible` / `isStillLosing` sa nadal sprawdzane PRZED `peaceAllowed` (web kolejnosc).
//! * [`ai_ai_war_pairs`] = web zbieranie par wojny glownych AI (sort rosnaco, pary `i<j`).
//!
//! Uwaga o zakresie: `runWarWearinessTick` w webie zapisuje zmeczenie i wywoluje `pay`/`finalize` przez
//! `main.ts`; tu te callbacki sa przekazywane z zewnatrz (W8 - podpiecie do petli tury).

use std::collections::HashSet;

use crate::domain::diplomacy_ai_forced_peace::{
    is_still_losing, register_ai_peace_request, run_ai_ai_peace_tick, AiPeaceKind,
    AiPeaceRequestStore, AiPeaceTickAction, AiPeaceTickEnv, AiPeaceTickOutcome, PeacePriceQuote,
};
use crate::domain::diplomacy_multiwar_peace::{
    plan_peace_payment, PeaceAsset, PeaceAssetKind, PeacePaymentPlan, WarWearinessStore,
};
use crate::domain::diplomacy_war_weariness_tick::{
    run_war_weariness_tick, WearinessOutcome, WearinessTickEnv,
};

/// Web `PEACE_PROPOSAL_MIN_WAR_TURNS` (`gra/src/game/diplomacy-peace-proposal-timing.ts:2`).
pub const PEACE_PROPOSAL_MIN_WAR_TURNS: f64 = 10.0;

/// Web `peaceAllowed(loser, winner)`: `diploWarStateFor(loser, winner).turnsAtWar >= PEACE_PROPOSAL_MIN_WAR_TURNS`.
pub fn peace_allowed_for_turns(turns_at_war: f64) -> bool {
    turns_at_war >= PEACE_PROPOSAL_MIN_WAR_TURNS
}

/// Web `if (aiAiPeaceRequestByPairKey.size === 0) return;`.
pub fn peace_tick_should_run(store_len: usize) -> bool {
    store_len > 0
}

/// Web `if (pairs.length === 0 && warWearinessByPairKey.size === 0) return;`.
pub fn weariness_tick_should_run(pairs_len: usize, store_len: usize) -> bool {
    !(pairs_len == 0 && store_len == 0)
}

/// Web `majors.sort((x, y) => x - y)` + pary `(majors[i], majors[j])`, `i < j`, dla ktorych
/// `getDiploRelation(a, b).status === 'wojna'`. `majors` wejsciowo juz przefiltrowane (`isMajorAiCivForForcedPeace`).
pub fn ai_ai_war_pairs(majors: &[i64], at_war: &dyn Fn(i64, i64) -> bool) -> Vec<(i64, i64)> {
    let mut sorted = majors.to_vec();
    sorted.sort_unstable();
    let mut pairs = Vec::new();
    for i in 0..sorted.len() {
        for j in (i + 1)..sorted.len() {
            let (a, b) = (sorted[i], sorted[j]);
            if at_war(a, b) {
                pairs.push((a, b));
            }
        }
    }
    pairs
}

/// Web `isAiAiPeaceBalanceAllowed(winner, loser, minBalancePn)` (`diplomacy-ai-forced-peace.ts:42-50`):
/// bilans PW obu AI po zaplacie musi byc `>= minBalancePn` (regula wlasciciela 2026-11-09).
pub fn ai_ai_peace_balance_allowed(
    winner_after: f64,
    loser_after: f64,
    min_balance_pn: f64,
) -> bool {
    winner_after >= min_balance_pn && loser_after >= min_balance_pn
}

/// Cena i plan zaplaty dokladnie tak jak petla `runAiAiPeaceTick` (skip miast z petla `cityCessionOk`, max 8 prob).
fn quote_and_plan(
    env: &AiPeaceTickEnv,
    loser: i64,
    winner: i64,
    kind: AiPeaceKind,
) -> (PeacePriceQuote, PeacePaymentPlan) {
    let price = (env.price)(winner, loser, kind);
    let build = |skip: &HashSet<String>| -> PeacePaymentPlan {
        let assets: Vec<PeaceAsset> = (env.assets)(loser, winner, skip)
            .into_iter()
            .map(|a| {
                if env.battle_pending && a.kind == PeaceAssetKind::Miasto {
                    PeaceAsset {
                        forbidden: true,
                        ..a
                    }
                } else {
                    a
                }
            })
            .collect();
        plan_peace_payment(price.required_pn, &assets)
    };
    let mut skip: HashSet<String> = HashSet::new();
    let mut plan = build(&skip);
    for _guard in 0..8 {
        let city_id = match plan.items.iter().find(|i| i.kind == PeaceAssetKind::Miasto) {
            Some(item) => item.id.clone(),
            None => break,
        };
        if (env.city_cession_ok)(&city_id, loser, winner) {
            break;
        }
        skip.insert(city_id);
        plan = build(&skip);
    }
    (price, plan)
}

/// Web `tickAiAiPeaceRequests` z `peaceAllowed` i regula nieujemnego bilansu AI-AI.
///
/// Kolejnosc sprawdzen dla kazdego wpisu (jak web `runAiAiPeaceTick`):
/// 1. `pair_eligible` fałsz -> tick usuwa (`dropped_ineligible`);
/// 2. `isStillLosing` fałsz -> tick usuwa (`dropped_not_losing`);
/// 3. `peace_allowed` fałsz -> `wait` BEZ planu, wpis zostaje;
/// 4. bilans PW obu AI po zaplacie `< min_balance_pn` -> `wait` Z planem, wpis zostaje, bez zaplaty
///    (web: sprawdzane PRZED limitem tur, wiec wymuszenie tez czeka);
/// 5. reszta idzie przez [`run_ai_ai_peace_tick`] (bramka zwyciezcy, limit, zaplata, finalize).
///
/// Punkty 3-4 sa realizowane tutaj, bo `AiPeaceTickEnv` nie niesie bilansu przegranego ani minimum.
/// Kolejnosc wynikow = kolejnosc wpisow magazynu (jak `Map`).
#[allow(clippy::too_many_arguments)]
pub fn run_ai_ai_peace_turn(
    store: &mut AiPeaceRequestStore,
    env: &AiPeaceTickEnv,
    peace_allowed: &dyn Fn(i64, i64) -> bool,
    min_balance_pn: f64,
    loser_balance_for: &dyn Fn(i64, i64, f64) -> f64,
    pay: &mut dyn FnMut(i64, i64, &PeacePaymentPlan),
    finalize: &mut dyn FnMut(i64, i64, AiPeaceKind),
    log: &mut dyn FnMut(&str),
) -> Vec<AiPeaceTickOutcome> {
    if !peace_tick_should_run(store.len()) {
        return Vec::new();
    }
    let snapshot: Vec<(String, _)> = store.entries().to_vec();

    // Wpis -> `Some(plan)` gdy wstrzymany przez bramke (punkt 3 bez planu: `None` w mapie `held`).
    let mut held: Vec<(String, Option<PeacePaymentPlan>)> = Vec::new();
    let mut filtered = AiPeaceRequestStore::new();
    for (key, req) in &snapshot {
        let (loser, winner) = (req.requester_id, req.other_id);
        let eligible = (env.pair_eligible)(loser, winner);
        let losing = eligible && is_still_losing((env.requester_share_of)(loser, winner));
        if !losing {
            // Tick sam usunie (dropped_ineligible / dropped_not_losing).
            register_ai_peace_request(&mut filtered, key, loser, winner, req.since_turn, req.kind);
            continue;
        }
        if !peace_allowed(loser, winner) {
            held.push((key.clone(), None));
            continue;
        }
        let (price, plan) = quote_and_plan(env, loser, winner, req.kind);
        let winner_after = price.balance.balance_for(plan.covered_pn);
        let loser_after = loser_balance_for(winner, loser, plan.covered_pn);
        if !ai_ai_peace_balance_allowed(winner_after, loser_after, min_balance_pn) {
            held.push((key.clone(), Some(plan)));
            continue;
        }
        register_ai_peace_request(&mut filtered, key, loser, winner, req.since_turn, req.kind);
    }

    let inner_env = AiPeaceTickEnv {
        turn: env.turn,
        limit: env.limit,
        pair_eligible: env.pair_eligible,
        requester_share_of: env.requester_share_of,
        gate_verdict: env.gate_verdict,
        price: env.price,
        assets: env.assets,
        city_cession_ok: env.city_cession_ok,
        battle_pending: env.battle_pending,
    };
    let inner_out = run_ai_ai_peace_tick(&mut filtered, &inner_env, pay, finalize, log);

    // Uzgodnienie magazynu: wpisy przepuszczone do ticka, ktorych tick nie zostawil, zostaly usuniete.
    let held_keys: HashSet<&str> = held.iter().map(|(k, _)| k.as_str()).collect();
    for (key, _) in &snapshot {
        if !held_keys.contains(key.as_str()) && !filtered.has(key) {
            store.delete(key);
        }
    }

    // Zlozenie wynikow w kolejnosci magazynu.
    let mut inner_iter = inner_out.into_iter().peekable();
    let mut out = Vec::with_capacity(snapshot.len());
    for (key, req) in &snapshot {
        if let Some((_, plan)) = held.iter().find(|(k, _)| k == key) {
            out.push(AiPeaceTickOutcome {
                pair_key: key.clone(),
                action: AiPeaceTickAction::Wait,
                kind: req.kind,
                plan: plan.clone(),
                decision: None,
            });
        } else if let Some(o) = inner_iter.next_if(|o| o.pair_key == *key) {
            out.push(o);
        }
    }
    out
}

/// Web `tickAiAiWarWeariness`: zbiera pary, sprawdza bramke i wola `runWarWearinessTick`.
/// `majors` = glowne AI po filtrze web `isMajorAiCivForForcedPeace`.
#[allow(clippy::too_many_arguments)]
pub fn run_ai_ai_weariness_turn<P, F, L>(
    store: &mut WarWearinessStore,
    turn: f64,
    majors: &[i64],
    at_war: &dyn Fn(i64, i64) -> bool,
    env: &WearinessTickEnv<'_>,
    pay: P,
    finalize: F,
    log: L,
) -> Vec<WearinessOutcome>
where
    P: FnMut(i64, i64, &PeacePaymentPlan),
    F: FnMut(i64, i64, f64),
    L: FnMut(&str),
{
    let pairs = ai_ai_war_pairs(majors, at_war);
    if !weariness_tick_should_run(pairs.len(), store.len()) {
        return Vec::new();
    }
    run_war_weariness_tick(store, turn, &pairs, env, pay, finalize, log)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn peace_gate_threshold_is_ten_turns() {
        assert!(!peace_allowed_for_turns(9.999));
        assert!(peace_allowed_for_turns(10.0));
        assert!(peace_allowed_for_turns(25.0));
    }

    #[test]
    fn gates_match_web_early_returns() {
        assert!(!peace_tick_should_run(0));
        assert!(peace_tick_should_run(1));
        assert!(!weariness_tick_should_run(0, 0));
        assert!(weariness_tick_should_run(0, 2));
        assert!(weariness_tick_should_run(1, 0));
    }

    #[test]
    fn war_pairs_sorted_and_upper_triangular() {
        let at_war = |a: i64, b: i64| (a + b) % 2 == 1;
        // majors niesortowane; sort -> [1,2,3,4]; pary (1,2),(1,4),(2,3),(3,4) maja nieparzysta sume.
        let pairs = ai_ai_war_pairs(&[4, 1, 3, 2], &at_war);
        assert_eq!(pairs, vec![(1, 2), (1, 4), (2, 3), (3, 4)]);
    }
}
