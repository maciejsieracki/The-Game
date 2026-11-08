//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 (runda 3, partia B): port 1:1 z webem funkcji
//! `runWarWearinessTick` (`gra/src/game/war-weariness.ts`, pin `origin/main` 5dd53e60f).
//!
//! Tick AI<->AI: dla kazdej pary w wojnie liczy poziom zmeczenia (szczyt pamietany w `WarWearinessStore`),
//! wyczerpanie (pokoj bez zaplaty), albo - dla wyraznie przegrywajacego - eskalowana oferte pokoju
//! (stopien, cooldown, odrzucenia, ochrona przed snowballem, wyjscie awaryjne).
//!
//! Zaleznosci webowe podawane przez `WearinessTickEnv` (closure'y jak `WearinessTickDeps` w TS):
//! - `price(winner, loser)` - w TS zwraca `balanceFor` jako closure. Tu modelowane liniowo:
//!   `balance_for(c) = balance0 + slope * c` (`PeacePriceQuote`). Logika ticka nie zalezy od postaci wyceny.
//! - `log` - w TS tekst z `toFixed`; tu callback otrzymuje dowolny tekst (testy licza wywolania).
//!
//! PARAMETRY: `WAR_WEARINESS_PARAMS` (diplomacy_multiwar.rs, pin a61337844 = origin/main, bez zmian w JSON)
//! oraz `OFFER_PARAMS` ponizej - literaly z `gra/data/war-weariness-params.json` (sekcja `przegrywajacy`,
//! `zmeczenie.progWzajemnyPokoj`). Pola `_LIVE_AUDIT_Q1` sa tu, bo nie maja odpowiednika w strukturze z a61337844.
//!
//! JS-SEMANTYKA: `Math.max/min` propaguja NaN (`js_max`, `js_min`); porownania z NaN sa fałszywe jak w JS.

use super::diplomacy_multiwar::{
    despair_stage, is_war_weary, js_max, js_min, loser_despair, offer_multiplier, stage_city_limit,
    war_weariness_level, WAR_WEARINESS_PARAMS,
};
use super::diplomacy_multiwar_peace::{
    plan_escalated_peace_payment, step_pair_state, PeaceAsset, PeaceAssetKind, PeacePaymentPlan,
    WarWearinessStore,
};
use std::collections::HashSet;

/// Pola `przegrywajacy` / `zmeczenie` z `war-weariness-params.json` nieobecne w `WarWearinessParams`.
#[derive(Debug, Clone, Copy)]
pub struct WearinessOfferParams {
    /// `zmeczenie.progWzajemnyPokoj`.
    pub prog_wzajemny_pokoj: f64,
    pub odrzucenia_do_kapitulacji: f64,
    pub cooldown_oferty_tur: f64,
    pub min_miast_po_oddaniu: f64,
    pub oferta_od_tury_wojny: f64,
    pub oferta_bez_strat_od_tur: f64,
    pub ochrona_max_miast: f64,
    pub ochrona_utraty_wojny: f64,
    /// `zwyciezcaMusiPrzyjac > 0`.
    pub zwyciezca_musi_przyjac: bool,
    pub tolerancja_zmeczenia: f64,
    pub karencja_po_pokoju_tur: f64,
    pub karencja_chronionego_tur: f64,
}

/// Literaly z `gra/data/war-weariness-params.json` (origin/main 5dd53e60f).
pub const OFFER_PARAMS: WearinessOfferParams = WearinessOfferParams {
    prog_wzajemny_pokoj: 0.8,
    odrzucenia_do_kapitulacji: 3.0,
    cooldown_oferty_tur: 3.0,
    min_miast_po_oddaniu: 3.0,
    oferta_od_tury_wojny: 8.0,
    oferta_bez_strat_od_tur: 25.0,
    ochrona_max_miast: 3.0,
    ochrona_utraty_wojny: 3.0,
    zwyciezca_musi_przyjac: true,
    tolerancja_zmeczenia: 0.5,
    karencja_po_pokoju_tur: 40.0,
    karencja_chronionego_tur: 100.0,
};

/// Web `WearinessWarInfo` (war-weariness.ts `warInfo`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WearinessWarInfo {
    pub war_start: f64,
    pub turns_at_war: f64,
    pub lost_a: f64,
    pub lost_b: f64,
    pub turns_since_city_change: f64,
}

/// Wycena wygranego (web `price(winner, loser)`): wymagane PW, tolerancja, bilans po pokryciu.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PeacePriceQuote {
    pub required_pn: f64,
    pub tolerance_pn: f64,
    pub balance0: f64,
    pub slope: f64,
}

impl PeacePriceQuote {
    /// Web `balanceFor(coveredPn)`; model liniowy (patrz nagłówek).
    pub fn balance_for(&self, covered_pn: f64) -> f64 {
        self.balance0 + self.slope * covered_pn
    }
}

/// Web `assets(loser, winner, skip)`: aktywa bez pominiętych miast.
pub type AssetsFn<'a> = dyn Fn(i64, i64, &HashSet<String>) -> Vec<PeaceAsset> + 'a;

/// Zależności ticka (odpowiednik `WearinessTickDeps` bez stanu i callbacków zapisu).
pub struct WearinessTickEnv<'a> {
    pub pair_key: &'a dyn Fn(i64, i64) -> String,
    pub war_info: &'a dyn Fn(i64, i64) -> WearinessWarInfo,
    /// Udział siły `x` w parze `(x, y)`.
    pub share_of: &'a dyn Fn(i64, i64) -> f64,
    pub city_count_of: &'a dyn Fn(i64) -> f64,
    pub price: &'a dyn Fn(i64, i64) -> PeacePriceQuote,
    /// Web `assets(loser, winner, skipCityIds)` - zwraca aktywa bez pominiętych miast (`skip`).
    pub assets: &'a AssetsFn<'a>,
    pub city_cession_ok: &'a dyn Fn(&str, i64, i64) -> bool,
    pub battle_pending: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WearinessAction {
    None,
    MutualPeace,
    OfferAccepted,
    OfferRejected,
}

#[derive(Debug, Clone, PartialEq)]
pub struct WearinessOutcome {
    pub pair_key: String,
    pub action: WearinessAction,
    pub level: f64,
    pub stage: i64,
    pub plan: Option<PeacePaymentPlan>,
}

fn outcome(
    key: &str,
    action: WearinessAction,
    level: f64,
    stage: i64,
    plan: Option<PeacePaymentPlan>,
) -> WearinessOutcome {
    WearinessOutcome {
        pair_key: key.to_string(),
        action,
        level,
        stage,
        plan,
    }
}

/// Web `runWarWearinessTick(d)`. `pay(loser, winner, plan)` i `finalize(loser, winner, lockTurns)` to
/// efekty uboczne gry; `log` - komunikaty diagnostyczne.
pub fn run_war_weariness_tick<P, F, L>(
    store: &mut WarWearinessStore,
    turn: f64,
    pairs: &[(i64, i64)],
    env: &WearinessTickEnv<'_>,
    mut pay: P,
    mut finalize: F,
    mut log: L,
) -> Vec<WearinessOutcome>
where
    P: FnMut(i64, i64, &PeacePaymentPlan),
    F: FnMut(i64, i64, f64),
    L: FnMut(&str),
{
    let p = &WAR_WEARINESS_PARAMS;
    let o = &OFFER_PARAMS;
    let mut out: Vec<WearinessOutcome> = Vec::new();
    let mut live: HashSet<String> = HashSet::new();

    for &(a, b) in pairs {
        let key = (env.pair_key)(a, b);
        live.insert(key.clone());
        let w = (env.war_info)(a, b);
        let level = war_weariness_level(
            w.turns_at_war,
            w.lost_a + w.lost_b,
            Some(w.turns_since_city_change),
            p,
        );
        step_pair_state(store, &key, w.war_start, level);
        let lvl = store[&key].peak;

        let share_a = (env.share_of)(a, b);
        let loser = if share_a <= 0.5 { a } else { b };
        let winner = if loser == a { b } else { a };
        let loser_share = if loser == a { share_a } else { 1.0 - share_a };
        let lost_loser = if loser == a { w.lost_a } else { w.lost_b };
        let clearly_losing = loser_share <= p.udzial_wyraznie;

        if !clearly_losing {
            if !is_war_weary(lvl, p) {
                out.push(outcome(
                    &key,
                    WearinessAction::None,
                    lvl,
                    store[&key].stage,
                    None,
                ));
                continue;
            }
            // Równowaga sił: wzajemne wyczerpanie - pokój bez zapłaty.
            if lvl >= o.prog_wzajemny_pokoj {
                log(&format!(
                    "pokój z wyczerpania {a}-{b} (zmęczenie {lvl}, tury wojny {})",
                    w.turns_at_war
                ));
                let stage_now = store[&key].stage;
                finalize(loser, winner, o.karencja_po_pokoju_tur);
                store.remove(&key);
                out.push(outcome(
                    &key,
                    WearinessAction::MutualPeace,
                    lvl,
                    stage_now,
                    None,
                ));
            } else {
                out.push(outcome(
                    &key,
                    WearinessAction::None,
                    lvl,
                    store[&key].stage,
                    None,
                ));
            }
            continue;
        }

        // Wyraźnie przegrywający: oferta bez czekania na zmęczenie pary (LIVE-AUDIT-Q1).
        let own_cities = (env.city_count_of)(loser);
        if w.turns_at_war < o.oferta_od_tury_wojny {
            out.push(outcome(
                &key,
                WearinessAction::None,
                lvl,
                store[&key].stage,
                None,
            ));
            continue;
        }
        if lost_loser <= 0.0 && w.turns_at_war < o.oferta_bez_strat_od_tur && !is_war_weary(lvl, p)
        {
            out.push(outcome(
                &key,
                WearinessAction::None,
                lvl,
                store[&key].stage,
                None,
            ));
            continue;
        }
        // Ochrona przed snowballem.
        let protected_loser = (own_cities <= o.ochrona_max_miast && lost_loser >= 1.0)
            || lost_loser >= o.ochrona_utraty_wojny;

        let despair = loser_despair(lvl, loser_share, lost_loser, p);
        let protected_stage = if protected_loser { 1 } else { 0 };
        let new_stage = store[&key]
            .stage
            .max(despair_stage(despair, p))
            .max(protected_stage);
        store.get_mut(&key).expect("para po step_pair_state").stage = new_stage;
        if new_stage <= 0 {
            out.push(outcome(&key, WearinessAction::None, lvl, new_stage, None));
            continue;
        }
        let last_offer = store[&key].last_offer_turn;
        if last_offer >= 0.0 && turn - last_offer < o.cooldown_oferty_tur {
            out.push(outcome(&key, WearinessAction::None, lvl, new_stage, None));
            continue;
        }

        let quote = (env.price)(winner, loser);
        let rejected = store[&key].rejected_offers;
        let required = quote.required_pn * offer_multiplier(new_stage, rejected as f64, p);
        let max_cities = if env.battle_pending {
            0.0
        } else {
            js_max(
                0.0,
                js_min(
                    stage_city_limit(new_stage, p) as f64,
                    own_cities - o.min_miast_po_oddaniu,
                ),
            )
        };
        let mut skip: HashSet<String> = HashSet::new();
        let mut plan =
            plan_escalated_peace_payment(required, &(env.assets)(loser, winner, &skip), max_cities);
        for _guard in 0..8 {
            let bad_id = plan
                .items
                .iter()
                .find(|i| {
                    i.kind == PeaceAssetKind::Miasto && !(env.city_cession_ok)(&i.id, loser, winner)
                })
                .map(|i| i.id.clone());
            let Some(bad_id) = bad_id else { break };
            skip.insert(bad_id);
            plan = plan_escalated_peace_payment(
                required,
                &(env.assets)(loser, winner, &skip),
                max_cities,
            );
        }
        store
            .get_mut(&key)
            .expect("para po step_pair_state")
            .last_offer_turn = turn;

        // Wyjście awaryjne: wyczerpany wygrywający po serii odrzuceń bierze, co przegrywający może dać.
        let exhausted =
            lvl >= o.prog_wzajemny_pokoj && (rejected as f64) >= o.odrzucenia_do_kapitulacji;
        let must_accept = protected_loser && o.zwyciezca_musi_przyjac;
        // Symetria: zmęczenie obniża wymagania zwycięzcy.
        let tol =
            quote.tolerance_pn + js_max(0.0, o.tolerancja_zmeczenia) * lvl * js_max(0.0, required);
        if must_accept || exhausted || quote.balance_for(plan.covered_pn) >= -tol {
            pay(loser, winner, &plan);
            log(&format!(
                "pokój AI{loser}↔AI{winner} za cenę (stopień {new_stage}); {}/{} PW",
                plan.covered_pn,
                required.round()
            ));
            let lock = if protected_loser {
                o.karencja_chronionego_tur
            } else {
                o.karencja_po_pokoju_tur
            };
            finalize(loser, winner, lock);
            store.remove(&key);
            out.push(outcome(
                &key,
                WearinessAction::OfferAccepted,
                lvl,
                new_stage,
                Some(plan),
            ));
        } else {
            store
                .get_mut(&key)
                .expect("para po step_pair_state")
                .rejected_offers += 1;
            out.push(outcome(
                &key,
                WearinessAction::OfferRejected,
                lvl,
                new_stage,
                Some(plan),
            ));
        }
    }

    // Sprzątanie stanu par, które nie są już w wojnie.
    store.retain(|k, _| live.contains(k));
    out
}
