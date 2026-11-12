//! P6-WIRE-WAR-R7K7-C: efekty umow na skarbce wlascicieli i pule Pracy w `PlayableState`.
//!
//! - Wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (`p6_r7k7c_gen.mjs`, straznik SHA-256 zrodla
//!   `diplomacy-economy.ts`): 203 przypadki `activeDealsToPaymentDeals` + `tickDiplomacyPayments` +
//!   `tributeBreakPairsFromDeals` (w tym losowe, deterministyczne, ziarno 20261112). Wejscie i wyjscie to wynik
//!   kodu weba; test Rust porownuje z nim pole po polu.
//! - Testy jednostkowe: zgodnosc wsteczna pol (`#[serde(default)]` + pomijanie gdy puste), setter odrzucajacy
//!   NaN/Inf i gracza ludzkiego, producent `dipl_steps_inputs`, atomowosc `apply_dipl_deltas_to_state`.
//! - BRAK wektorow pinu dla D3 (`tickCyclicResourceTradeDeals`): funkcja domknieta w `main.ts`, nie da sie jej
//!   zbundlowac bez przerobki pinu (patrz raport operatora). Pokrycie D3 zostaje w `p6_wire_war_dipl_steps.rs`.

use std::collections::BTreeMap;

use civ_engine::domain::diplomacy::ActiveDeal;
use civ_engine::domain::playable::StartGameParams;
use civ_engine::domain::playable::{PlayableGame, PlayableReplaceEconomy, PlayableState};
use civ_engine::domain::turn_war_dipl_steps::{
    active_deals_to_payment_deals, apply_dipl_deltas_to_state, tick_diplomacy_payments,
    tribute_break_pairs, Treasury,
};
use civ_engine::domain::turn_war_inputs::dipl_steps_inputs;
use civ_engine::domain::turn_war_pipeline::WarTurnError;
use civ_engine::domain::PlayerId;
use serde_json::Value;

const PAYMENTS: &str = include_str!("p6_r7k7c_vectors/payments.json");

struct MapTreasury(BTreeMap<i64, f64>);

impl Treasury for MapTreasury {
    fn balance(&self, owner: i64) -> Result<f64, WarTurnError> {
        // Web `getPieniadze`: brak wpisu = 0 (wektor podaje skarbce wszystkich stron).
        Ok(self.0.get(&owner).copied().unwrap_or(0.0))
    }
    fn add(&mut self, owner: i64, delta: f64) -> Result<(), WarTurnError> {
        *self.0.entry(owner).or_insert(0.0) += delta;
        Ok(())
    }
}

fn payment_vectors() -> Vec<Value> {
    let v: Value = serde_json::from_str(PAYMENTS).expect("payments.json");
    assert_eq!(
        v["pin"].as_str(),
        Some("07d2fbd72f758705f8e1d59cc4968027ffbafe75"),
        "pin"
    );
    v["payments"].as_array().expect("payments").clone()
}

#[test]
fn payment_vectors_from_pin_match_rust() {
    let rows = payment_vectors();
    assert!(rows.len() >= 150, "wektory: {} < 150", rows.len());
    for row in &rows {
        let name = row["name"].as_str().unwrap();
        let turn = row["turn"].as_f64().unwrap();
        let deals: Vec<ActiveDeal> = serde_json::from_value(row["deals"].clone())
            .unwrap_or_else(|e| panic!("{name}: deals: {e}"));

        // activeDealsToPaymentDeals
        let pay = active_deals_to_payment_deals(&deals, turn);
        let want_pay = row["payDeals"].as_array().unwrap();
        assert_eq!(pay.len(), want_pay.len(), "{name}: payDeals");
        for (got, want) in pay.iter().zip(want_pay) {
            assert_eq!(got.id, want["id"].as_str().unwrap(), "{name}: id");
            assert_eq!(
                got.payer as f64,
                want["payerOwnerId"].as_f64().unwrap(),
                "{name}"
            );
            assert_eq!(
                got.receiver as f64,
                want["receiverOwnerId"].as_f64().unwrap(),
                "{name}"
            );
            assert_eq!(
                got.per_turn,
                want["pieniadzePerTura"].as_f64().unwrap(),
                "{name}"
            );
            assert_eq!(got.until, want["doTury"].as_f64(), "{name}: doTury");
        }

        // tickDiplomacyPayments
        let mut tr = MapTreasury(
            row["treasury"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.parse().unwrap(), v.as_f64().unwrap()))
                .collect(),
        );
        let res = tick_diplomacy_payments(&pay, &mut tr, turn).expect("payments");
        let strs = |k: &str| -> Vec<String> {
            row[k]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_owned())
                .collect()
        };
        assert_eq!(res.paid, strs("paid"), "{name}: paid");
        assert_eq!(res.broken, strs("broken"), "{name}: broken");
        assert_eq!(res.messages, strs("messages"), "{name}: messages");
        for (k, v) in row["balances"].as_object().unwrap() {
            let owner: i64 = k.parse().unwrap();
            assert_eq!(
                tr.0.get(&owner).copied().unwrap_or(0.0),
                v.as_f64().unwrap(),
                "{name}: saldo {owner}"
            );
        }

        // tributeBreakPairsFromDeals
        let got_breaks = tribute_break_pairs(&deals, &res.broken);
        let want_breaks = row["breaks"].as_array().unwrap();
        assert_eq!(got_breaks.len(), want_breaks.len(), "{name}: breaks");
        for ((id, payer, receiver), want) in got_breaks.iter().zip(want_breaks) {
            assert_eq!(id, want["dealId"].as_str().unwrap(), "{name}: dealId");
            assert_eq!(
                *payer as f64,
                want["payerOwnerId"].as_f64().unwrap(),
                "{name}"
            );
            assert_eq!(
                *receiver as f64,
                want["receiverOwnerId"].as_f64().unwrap(),
                "{name}"
            );
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Zgodnosc wsteczna i pomijanie pustych pol
// ---------------------------------------------------------------------------------------------

#[test]
fn default_economy_serializes_without_owner_pool_keys() {
    let v = serde_json::to_value(PlayableReplaceEconomy::default()).expect("json");
    assert_eq!(
        v,
        serde_json::json!({}),
        "pola pul musza byc pomijane gdy puste"
    );
}

#[test]
fn economy_without_owner_pool_keys_loads_with_empty_maps() {
    let e: PlayableReplaceEconomy =
        serde_json::from_str(r#"{"treasury": 5.0}"#).expect("zapis sprzed zmiany");
    assert_eq!(e.treasury, 5.0);
    assert!(e.ai_treasury_by_owner.is_empty());
    assert!(e.praca_pool_by_owner.is_empty());
}

#[test]
fn economy_owner_pools_round_trip() {
    let mut e = PlayableReplaceEconomy::default();
    e.ai_treasury_by_owner.insert(2, 12.5);
    e.praca_pool_by_owner.insert(1, 40.0);
    let text = serde_json::to_string(&e).expect("json");
    let back: PlayableReplaceEconomy = serde_json::from_str(&text).expect("back");
    assert_eq!(back, e);
}

// ---------------------------------------------------------------------------------------------
// Setter i producent wejsc
// ---------------------------------------------------------------------------------------------

fn fresh_game() -> PlayableGame {
    PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy")
}

fn human_id(state: &PlayableState) -> u64 {
    state
        .players
        .iter()
        .find(|p| p.is_human)
        .expect("gracz ludzki")
        .id
        .get()
}

/// Stan z jednym graczem AI (id 2), gdy scenariusz startowy go nie niesie: klon gracza ludzkiego.
fn with_ai(mut state: PlayableState) -> PlayableState {
    if !state.players.iter().any(|p| !p.is_human) {
        let mut ai = state
            .players
            .iter()
            .find(|p| p.is_human)
            .expect("gracz ludzki")
            .clone();
        ai.is_human = false;
        ai.id = PlayerId::new(2);
        state.players.push(ai);
    }
    state
}

fn ai_id(state: &PlayableState) -> u64 {
    state
        .players
        .iter()
        .find(|p| !p.is_human)
        .expect("AI")
        .id
        .get()
}

#[test]
fn setters_reject_non_finite_and_human_owner() {
    let mut game = fresh_game();
    let human = human_id(game.state());
    let ai = 2;
    assert!(game.set_owner_treasury(ai, f64::NAN).is_err());
    assert!(game.set_owner_treasury(ai, f64::INFINITY).is_err());
    assert!(game.set_owner_praca_pool(human, f64::NEG_INFINITY).is_err());
    assert!(
        game.set_owner_treasury(human, 5.0).is_err(),
        "gracz ma wlasny skarbiec"
    );
    assert!(
        game.state().economy.ai_treasury_by_owner.is_empty(),
        "blad = brak zmiany"
    );
    game.set_owner_treasury(ai, 33.0).expect("AI treasury");
    game.set_owner_praca_pool(human, 7.0).expect("praca");
    assert_eq!(
        game.state().economy.ai_treasury_by_owner.get(&ai),
        Some(&33.0)
    );
    assert_eq!(
        game.state().economy.praca_pool_by_owner.get(&human),
        Some(&7.0)
    );
}

#[test]
fn producer_exposes_ai_treasury_and_praca_only_when_present() {
    let game = fresh_game();
    let base = with_ai(game.state().clone());
    let ai = ai_id(&base) as i64;

    // Brak wpisow = producent nieobecny: mapy puste poza skarbcem gracza (BRAK CICHYCH ZER).
    let inp = dipl_steps_inputs(&base).expect("inputs");
    assert!(!inp.treasury.contains_key(&ai));
    assert!(inp.praca_pool.is_empty());

    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(ai as u64, 21.0);
    st.economy.praca_pool_by_owner.insert(ai as u64, 9.0);
    let inp = dipl_steps_inputs(&st).expect("inputs");
    assert_eq!(inp.treasury.get(&ai), Some(&21.0));
    assert_eq!(inp.praca_pool.get(&ai), Some(&9.0));
}

#[test]
fn apply_deltas_moves_human_and_ai_balances() {
    let base = with_ai(fresh_game().state().clone());
    let human = human_id(&base) as i64;
    let ai = ai_id(&base);
    let mut st = base.clone();
    st.economy.treasury = 50.0;
    st.economy.ai_treasury_by_owner.insert(ai, 30.0);
    st.economy.praca_pool_by_owner.insert(ai, 4.0);

    let treasury = BTreeMap::from([(human, -8.0), (ai as i64, 2.5)]);
    let praca = BTreeMap::from([(ai as i64, -1.5)]);
    apply_dipl_deltas_to_state(&mut st, &treasury, &praca).expect("apply");
    assert_eq!(st.economy.treasury, 42.0);
    assert_eq!(st.economy.ai_treasury_by_owner.get(&ai), Some(&32.5));
    assert_eq!(st.economy.praca_pool_by_owner.get(&ai), Some(&2.5));
}

#[test]
fn apply_deltas_is_atomic_on_missing_owner() {
    let base = with_ai(fresh_game().state().clone());
    let ai = ai_id(&base);
    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(ai, 30.0);
    let before = st.clone();

    // Wlasciciel 99 nie ma producenta: cala zmiana odrzucona, takze poprawna pozycja dla `ai`.
    let treasury = BTreeMap::from([(ai as i64, -5.0), (99, 1.0)]);
    let err = apply_dipl_deltas_to_state(&mut st, &treasury, &BTreeMap::new())
        .expect_err("brak producenta");
    assert!(matches!(err, WarTurnError::DiplStep(_)));
    assert_eq!(st, before, "blad = zadnej zmiany");
}

#[test]
fn apply_deltas_rejects_non_finite_values() {
    let base = with_ai(fresh_game().state().clone());
    let ai = ai_id(&base);
    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(ai, 30.0);
    let before = st.clone();
    let treasury = BTreeMap::from([(ai as i64, f64::NAN)]);
    assert!(apply_dipl_deltas_to_state(&mut st, &treasury, &BTreeMap::new()).is_err());
    assert_eq!(st, before);
}

// --- Poprawki po zarzutach 2, 6, 8 (runda obrony Operatora, 02a-obrona.md) ---

#[test]
fn apply_praca_pool_is_floored_at_zero_like_pin() {
    // Pin: setOwnerPracaPool(id, v) zapisuje Math.max(0, v). Strata wieksza niz pula -> 0, nie ujemna.
    let base = with_ai(fresh_game().state().clone());
    let human = human_id(&base) as i64;
    let ai = ai_id(&base);
    let mut st = base.clone();
    st.economy.praca_pool_by_owner.insert(ai, 4.0);
    st.economy.praca_pool_by_owner.insert(human as u64, 1.0);

    let praca = BTreeMap::from([(ai as i64, -10.0), (human, -1.0)]);
    apply_dipl_deltas_to_state(&mut st, &BTreeMap::new(), &praca).expect("apply");
    assert_eq!(st.economy.praca_pool_by_owner.get(&ai), Some(&0.0));
    assert_eq!(
        st.economy.praca_pool_by_owner.get(&(human as u64)),
        Some(&0.0)
    );
}

#[test]
fn apply_ai_treasury_has_no_floor_like_pin() {
    // Pin: skarbiec AI NIE jest podlogowany (dlug trwa, jak u gracza). Ujemny wynik zostaje.
    let base = with_ai(fresh_game().state().clone());
    let ai = ai_id(&base);
    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(ai, -5.0);
    let treasury = BTreeMap::from([(ai as i64, 2.0)]);
    apply_dipl_deltas_to_state(&mut st, &treasury, &BTreeMap::new()).expect("apply");
    assert_eq!(st.economy.ai_treasury_by_owner.get(&ai), Some(&-3.0));
}

#[test]
fn apply_fractional_and_large_balances_are_exact_sums() {
    // Zarzut 8: brzegi zaokragleń f64 (ulamki, duze wartosci). Sumy dokladnie reprezentowalne.
    let base = with_ai(fresh_game().state().clone());
    let ai = ai_id(&base);
    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(ai, 1e12);
    st.economy.praca_pool_by_owner.insert(ai, 0.5);
    let treasury = BTreeMap::from([(ai as i64, 0.25)]);
    let praca = BTreeMap::from([(ai as i64, 0.25)]);
    apply_dipl_deltas_to_state(&mut st, &treasury, &praca).expect("apply");
    assert_eq!(
        st.economy.ai_treasury_by_owner.get(&ai),
        Some(&(1e12 + 0.25))
    );
    assert_eq!(st.economy.praca_pool_by_owner.get(&ai), Some(&0.75));
}

#[test]
fn producer_rejects_human_entry_in_ai_treasury() {
    // Zarzut 6: wpis gracza ludzkiego w mapie AI (zapis omijajacy setter) nie moze byc cicho ignorowany.
    let base = with_ai(fresh_game().state().clone());
    let human = human_id(&base);
    let mut st = base.clone();
    st.economy.ai_treasury_by_owner.insert(human, 99.0);
    let err = dipl_steps_inputs(&st).expect_err("niespojny stan");
    assert!(matches!(
        err,
        civ_engine::domain::turn_war_inputs::WarInputsError::HumanOwnerInAiTreasury(id)
            if id == human as i64
    ));
}
