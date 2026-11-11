//! R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7): tiki AI<->AI po fazie AI - prosba o pokoj i zmeczenie wojna.
//!
//! Port SKLADANIA z `gra/src/main.ts` (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75):
//! * `tickAiAiPeaceRequests(battlePending)` - bramka `size === 0` + `runAiAiPeaceTick` z `peaceAllowed`;
//! * `tickAiAiWarWeariness(battlePending)` - pary glownych AI w `wojna` (posortowane), bramka
//!   `pairs.length === 0 && store.size === 0`, potem `runWarWearinessTick`.
//!
//! Logika ticka (`diplomacy_ai_forced_peace.rs`, `diplomacy_war_weariness_tick.rs`) jest portowana osobno
//! i NIE jest tu zmieniana. Ten modul dodaje dwie rzeczy, ktorych brakuje w czystym porcie ticka:
//! * [`run_ai_ai_peace_turn`] przekazuje wpisy do wariantu V2 ticka (`run_ai_ai_peace_tick_v2`), ktory
//!   egzekwuje web `peaceAllowed` (`turnsAtWar >= PEACE_PROPOSAL_MIN_WAR_TURNS`) i regule nieujemnego
//!   bilansu AI-AI. Wpis z zakazem zostaje w kolejce z akcja `wait` (web: `out.push({action:'wait'})`
//!   BEZ `delete`); `pairEligible` / `isStillLosing` sa sprawdzane PRZED `peaceAllowed` (web kolejnosc).
//! * [`ai_ai_war_pairs`] = web zbieranie par wojny glownych AI (sort rosnaco, pary `i<j`).
//!
//! Uwaga o zakresie: `runWarWearinessTick` w webie zapisuje zmeczenie i wywoluje `pay`/`finalize` przez
//! `main.ts`; tu te callbacki sa przekazywane z zewnatrz (W8 - podpiecie do petli tury).

use std::cell::RefCell;
use std::collections::HashSet;

use crate::domain::diplomacy_ai_forced_peace::{
    register_ai_peace_request, run_ai_ai_peace_tick_v2, AiPeaceKind, AiPeaceRequest,
    AiPeaceRequestStore, AiPeaceTickEnv, AiPeaceTickEnvV2, AiPeaceTickOutcomeV2,
};
use crate::domain::diplomacy_multiwar_peace::{PeaceAsset, PeacePaymentPlan, WarWearinessStore};
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

/// Web `tickAiAiPeaceRequests` z `peaceAllowed` i regula nieujemnego bilansu AI-AI.
///
/// Wpisy sa rozstrzygane SEKWENCYJNIE, jak web `runAiAiPeaceTick` w petli: kazdy wpis widzi stan
/// po zaplacie wpisow poprzednich (`pay` / `finalize` mutuja stan przez callbacki `env`).
/// Cala kolejnosc sprawdzen (wariant V2, `run_ai_ai_peace_tick_v2`) dla kazdego wpisu:
/// 1. `pair_eligible` fałsz -> tick usuwa (`DroppedIneligible`);
/// 2. `isStillLosing` fałsz -> tick usuwa (`DroppedNotLosing`);
/// 3. `peace_allowed` fałsz -> `wait` BEZ planu, wpis zostaje (web `out.push({action:'wait'})`);
/// 4. bilans PW zwyciezcy i przegranego po zaplacie `< min` -> `wait` Z planem (`BalanceBlocked`),
///    wpis zostaje, bez zaplaty (web: sprawdzane PRZED limitem tur, wiec wymuszenie tez czeka);
/// 5. reszta: bramka zwyciezcy, limit, zaplata, finalize.
///
/// Ten modul nie ma wlasnej logiki bilansu ani `peaceAllowed` - wszystko dzieje sie w V2.
/// Wywolania `env.assets` i `env.city_cession_ok` sa spamietywane na czas JEDNEGO wpisu (klucz: zbior
/// pominietych miast; id miasta), wiec gate i tick widza ten sam wynik bez powtornego wolania
/// callbackow. Pamiec nie przechodzi miedzy wpisami: po zaplacie stan sie zmienia.
///
/// Kolejnosc wynikow = kolejnosc wpisow magazynu (jak `Map`).
pub fn run_ai_ai_peace_turn(
    store: &mut AiPeaceRequestStore,
    env: &AiPeaceTickEnvV2,
    pay: &mut dyn FnMut(i64, i64, &PeacePaymentPlan),
    finalize: &mut dyn FnMut(i64, i64, AiPeaceKind),
    log: &mut dyn FnMut(&str),
) -> Vec<AiPeaceTickOutcomeV2> {
    if !peace_tick_should_run(store.len()) {
        return Vec::new();
    }
    let snapshot: Vec<(String, AiPeaceRequest)> = store.entries().to_vec();
    let mut out = Vec::with_capacity(snapshot.len());
    let base = &env.base;

    for (key, req) in &snapshot {
        // Pamiec callbackow tylko dla tego wpisu (stan moze sie zmienic po zaplacie poprzedniego).
        let asset_memo: RefCell<Vec<(Vec<String>, Vec<PeaceAsset>)>> = RefCell::new(Vec::new());
        let assets_fn = |l: i64, w: i64, skip: &HashSet<String>| -> Vec<PeaceAsset> {
            let mut k: Vec<String> = skip.iter().cloned().collect();
            k.sort();
            let hit = asset_memo
                .borrow()
                .iter()
                .find(|(kk, _)| *kk == k)
                .map(|(_, v)| v.clone());
            if let Some(v) = hit {
                return v;
            }
            let v = (base.assets)(l, w, skip);
            asset_memo.borrow_mut().push((k, v.clone()));
            v
        };
        let cco_memo: RefCell<Vec<(String, bool)>> = RefCell::new(Vec::new());
        let cco_fn = |id: &str, l: i64, w: i64| -> bool {
            let hit = cco_memo
                .borrow()
                .iter()
                .find(|(k, _)| k == id)
                .map(|(_, v)| *v);
            if let Some(v) = hit {
                return v;
            }
            let v = (base.city_cession_ok)(id, l, w);
            cco_memo.borrow_mut().push((id.to_string(), v));
            v
        };
        let entry_env = AiPeaceTickEnvV2 {
            base: AiPeaceTickEnv {
                turn: base.turn,
                limit: base.limit,
                pair_eligible: base.pair_eligible,
                requester_share_of: base.requester_share_of,
                gate_verdict: base.gate_verdict,
                price: base.price,
                assets: &assets_fn,
                city_cession_ok: &cco_fn,
                battle_pending: base.battle_pending,
            },
            peace_allowed: env.peace_allowed,
            loser_balance_for: env.loser_balance_for,
        };

        // Jednoelementowy magazyn: tick V2 rozstrzyga wpis (usuwa, czeka albo zaplaca i finalizuje).
        let mut one = AiPeaceRequestStore::new();
        register_ai_peace_request(
            &mut one,
            key,
            req.requester_id,
            req.other_id,
            req.since_turn,
            req.kind,
        );
        let mut tick_out = run_ai_ai_peace_tick_v2(&mut one, &entry_env, pay, finalize, log);
        if !one.has(key) {
            store.delete(key);
        }
        out.append(&mut tick_out);
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
