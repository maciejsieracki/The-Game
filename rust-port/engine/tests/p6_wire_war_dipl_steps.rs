//! P6-WIRE-WAR-R7K7: testy `domain/turn_war_dipl_steps.rs` (kroki D1-D7 w fazie Diplomacy).
//!
//! - Wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (`p6_wire_war_dipl_steps_gen.mjs`, straznik SHA-256):
//!   platnosci/danina (D6), dobra wola bez hamulca (D7), `expireTreaties` (D1).
//! - Testy behawioralne 3 tur przez `run_war_turn` na mini-swiecie: wygasanie NAP + sync statusu (D1/D7),
//!   handel cykliczny z dostawa i niedostarczeniem (D3), danina i jej zerwanie z `trybut_odmowa` (D6),
//!   wygasniecie rozejmu AI-AI (D5), flaga hamulca OFF (D7), jawne bledy wejsc i atomowosc.

use std::collections::BTreeMap;

use civ_engine::domain::ai_diplomacy_turn::{PairKey, PairWarParams};
use civ_engine::domain::brake_inputs::OwnerFacts;
use civ_engine::domain::brake_power::{Component, ObjectivePowerRaw};
use civ_engine::domain::diplomacy::{
    ActiveDeal, CityResourceState, CyclicResourceTransfer, PaymentKind, RelationStatus,
    TreatyEconomy, TreatyKind,
};
use civ_engine::domain::diplomacy_truce::{pair_meta_to_save, PairMetaWeb};
use civ_engine::domain::turn_war_dipl_steps::{
    active_deals_to_payment_deals, sync_relation_from_deals, tick_diplomacy_payments,
    tick_dobra_wola_on_relation, tribute_break_pairs, DiplStepsInputs, Treasury, KEY_PAIR_META,
};
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PeaceLockFacts, WarTurnConfig, WarTurnContext, WarTurnError, WarTurnInputs,
    WarTurnReport,
};
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_wire_war_dipl_steps_vectors/vectors.json");

const HUMAN: i64 = 1;
const AI_A: i64 = 2;
const AI_B: i64 = 3;

fn p(id: i64) -> PlayerId {
    PlayerId::new(id as u64)
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

// ---------------------------------------------------------------------------------------------
// Wektory z pinu
// ---------------------------------------------------------------------------------------------

struct MapTreasury(BTreeMap<i64, f64>);

impl Treasury for MapTreasury {
    fn balance(&self, owner: i64) -> Result<f64, WarTurnError> {
        // Web `ownerTreasury`: brak wpisu w scenariuszu wektora = 0 (wektor podaje skarbce wszystkich stron).
        Ok(self.0.get(&owner).copied().unwrap_or(0.0))
    }
    fn add(&mut self, owner: i64, delta: f64) -> Result<(), WarTurnError> {
        *self.0.entry(owner).or_insert(0.0) += delta;
        Ok(())
    }
}

#[test]
fn payments_match_pin_vectors() {
    let v = vectors();
    let rows = v["payments"].as_array().expect("payments");
    assert_eq!(rows.len(), 5);
    for row in rows {
        let name = row["name"].as_str().unwrap();
        let turn = row["turn"].as_f64().unwrap();
        let deals: Vec<ActiveDeal> = serde_json::from_value(row["deals"].clone()).expect("deals");
        let pay = active_deals_to_payment_deals(&deals, turn);
        let want_pay = row["payDeals"].as_array().unwrap();
        assert_eq!(pay.len(), want_pay.len(), "{name}: payDeals");
        for (got, want) in pay.iter().zip(want_pay) {
            assert_eq!(got.id, want["id"].as_str().unwrap(), "{name}");
            assert_eq!(got.payer as f64, want["payerOwnerId"].as_f64().unwrap());
            assert_eq!(
                got.receiver as f64,
                want["receiverOwnerId"].as_f64().unwrap()
            );
            assert_eq!(got.per_turn, want["pieniadzePerTura"].as_f64().unwrap());
            assert_eq!(got.until, want["doTury"].as_f64(), "{name}: doTury");
        }
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
        let want_bal: BTreeMap<i64, f64> = row["balances"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.parse().unwrap(), v.as_f64().unwrap()))
            .collect();
        assert_eq!(tr.0, want_bal, "{name}: salda");
        let breaks = tribute_break_pairs(&deals, &res.broken);
        let want_breaks = row["breaks"].as_array().unwrap();
        assert_eq!(breaks.len(), want_breaks.len(), "{name}: breaks");
        for (g, w) in breaks.iter().zip(want_breaks) {
            assert_eq!(g.0, w["dealId"].as_str().unwrap());
            assert_eq!(g.1 as f64, w["payerOwnerId"].as_f64().unwrap());
            assert_eq!(g.2 as f64, w["receiverOwnerId"].as_f64().unwrap());
        }
    }
}

#[test]
fn dobra_wola_without_brake_matches_pin_vectors() {
    let v = vectors();
    let rows = v["dobra"].as_array().expect("dobra");
    assert_eq!(rows.len(), 9);
    for r in rows {
        let (trust, rem, gained) = tick_dobra_wola_on_relation(
            r["zaufanie"].as_f64().unwrap(),
            r["rem"].as_f64().unwrap(),
        );
        assert_eq!(trust, r["outZaufanie"].as_f64().unwrap(), "{r}");
        assert_eq!(rem, r["outRemaining"].as_f64().unwrap(), "{r}");
        assert_eq!(gained, r["gained"].as_f64().unwrap(), "{r}");
    }
}

#[test]
fn expire_treaties_matches_pin_vectors() {
    let v = vectors();
    for r in v["expire"].as_array().expect("expire") {
        let turn = r["turn"].as_u64().unwrap() as u32;
        let mut st = civ_engine::domain::diplomacy::DiplomacyState::new();
        let mk = |id: &str, a: i64, b: i64, exp: Option<u32>| {
            let mut d = ActiveDeal::new(TreatyKind::Nap, p(a), p(b), 1, exp);
            d.id = id.to_owned();
            d
        };
        st.add_deal(mk("n", 1, 2, None));
        st.add_deal(mk("e4", 1, 2, Some(4)));
        st.add_deal(mk("e5", 1, 3, Some(5)));
        st.add_deal(mk("e6", 2, 3, Some(6)));
        st.expire_deals(turn);
        let got: Vec<&str> = st.deals.iter().map(|d| d.id.as_str()).collect();
        let want: Vec<&str> = r["kept"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap())
            .collect();
        assert_eq!(got, want, "tura {turn}");
    }
}

// ---------------------------------------------------------------------------------------------
// Mini-swiat
// ---------------------------------------------------------------------------------------------

#[allow(non_snake_case)]
fn P(v: f64) -> Component {
    Component::Provided(v)
}

fn power(owner_id: i64, miasta: f64, jednostki: f64) -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        owner_id,
        epoka: 1.0,
        jednostki: P(jednostki),
        wygrane_bitwy: P(0.0),
        bitwy_pkt_sum: Component::ExplicitZero,
        suma_ludkow: P(0.0),
        rekrut_ekw: P(0.0),
        miasta: P(miasta),
        heksy_terytorium: P(0.0),
        budynki: P(0.0),
        tech_zbadane: P(0.0),
        ulepszenia_terenu: P(0.0),
        kultura_imperium: Component::ExplicitZero,
        miasta_jednosc_religii: Component::ExplicitZero,
        zdobycze_power: Component::ExplicitZero,
    }
}

fn facts(city_count: f64) -> OwnerFacts {
    OwnerFacts {
        is_barbarian: false,
        is_city_copy: false,
        eliminated: false,
        city_count,
    }
}

fn city(id: &str, owner: i64, drewno: f64) -> CityResourceState {
    let mut c = CityResourceState::new(id, p(owner));
    c.resources.insert("drewno".to_owned(), drewno);
    c
}

fn world_inputs() -> WarTurnInputs {
    let mut inputs = WarTurnInputs {
        me_id: HUMAN,
        human_ids: vec![HUMAN],
        contacts: vec![AI_A, AI_B],
        city_owner_ids: vec![HUMAN, AI_A, AI_A, AI_B],
        ai_start_owner_ids: vec![AI_A, AI_B],
        ..WarTurnInputs::default()
    };
    inputs.owner_facts.insert(HUMAN, facts(1.0));
    inputs.owner_facts.insert(AI_A, facts(2.0));
    inputs.owner_facts.insert(AI_B, facts(1.0));
    for id in [HUMAN, AI_A, AI_B] {
        inputs.epochs.insert(id, 1.0);
    }
    inputs.power_raw.insert(HUMAN, power(HUMAN, 1.0, 1.0));
    inputs.power_raw.insert(AI_A, power(AI_A, 2.0, 3.0));
    inputs.power_raw.insert(AI_B, power(AI_B, 1.0, 1.0));
    inputs.peace_locks = Some(PeaceLockFacts::default());
    inputs.dipl = DiplStepsInputs {
        treasury: BTreeMap::from([(HUMAN, 100.0), (AI_A, 0.0), (AI_B, 50.0)]),
        praca_pool: BTreeMap::new(),
        cities: Some(vec![
            city("10", HUMAN, 0.0),
            city("20", AI_A, 25.0),
            city("21", AI_A, 0.0),
            city("30", AI_B, 0.0),
        ]),
        capital_city: BTreeMap::from([(HUMAN, "10".to_owned())]),
        army_m: BTreeMap::from([(AI_A, 3.0), (AI_B, 1.0), (HUMAN, 1.0)]),
        brake_flag_off: false,
    };
    inputs
}

fn config() -> WarTurnConfig {
    let mut params: BTreeMap<PairKey, PairWarParams> = BTreeMap::new();
    params.insert(
        (AI_A, AI_B),
        PairWarParams {
            prog: 1000.0,
            n: 2.0,
        },
    );
    WarTurnConfig::new(params, false)
}

fn run_turn(
    war: &mut WarTurnState,
    turn: f64,
    inputs: &WarTurnInputs,
    cfg: &WarTurnConfig,
) -> Result<WarTurnReport, WarTurnError> {
    let mut ctx = WarTurnContext {
        war,
        turn,
        inputs,
        config: cfg,
    };
    run_war_turn(&mut ctx)
}

fn nap_expiring_at_2() -> ActiveDeal {
    ActiveDeal::new(TreatyKind::Nap, p(HUMAN), p(AI_A), 1, Some(2))
}

fn cyclic_deal() -> ActiveDeal {
    let mut d = ActiveDeal::new(TreatyKind::TradeRoute, p(HUMAN), p(AI_A), 1, None);
    d.id = "handel-cykl".to_owned();
    d.cyclic_resource_transfers = vec![CyclicResourceTransfer {
        resource_key: "drewno".to_owned(),
        units_per_turn: 10.0,
        seller_owner_id: p(AI_A),
        buyer_owner_id: p(HUMAN),
        payment: Some(PaymentKind::Gold),
        payment_per_turn: 3.0,
        seller_failed_turns: 0,
        buyer_failed_turns: 0,
    }];
    d
}

fn tribute_deal() -> ActiveDeal {
    let mut d = ActiveDeal::new(TreatyKind::Vassalization, p(AI_B), p(HUMAN), 1, None);
    d.id = "danina".to_owned();
    d.economy = Some(TreatyEconomy {
        payer_owner_id: p(AI_B),
        receiver_owner_id: p(HUMAN),
        money_per_turn: 40.0,
    });
    d
}

fn truce_meta_2_3(until: f64) -> Value {
    let meta = PairMetaWeb {
        truce_until_turn: Some(until),
        truce_initiator_id: Some(AI_A as f64),
        ..PairMetaWeb::default()
    };
    pair_meta_to_save(&[("2-3".to_owned(), meta)])
}

fn apply_effects(inputs: &mut WarTurnInputs, rep: &WarTurnReport) {
    for (o, d) in &rep.dipl.treasury_deltas {
        *inputs.dipl.treasury.get_mut(o).expect("skarbiec") += d;
    }
    if let Some(c) = &rep.dipl.city_resources {
        inputs.dipl.cities = Some(c.clone());
    }
}

fn drewno(inputs: &WarTurnInputs, id: &str) -> f64 {
    inputs
        .dipl
        .cities
        .as_ref()
        .unwrap()
        .iter()
        .find(|c| c.id == id)
        .unwrap()
        .resources["drewno"]
}

#[test]
fn three_turns_change_treaties_cyclic_trade_tribute_and_truce() {
    let mut inputs = world_inputs();
    let cfg = config();
    let mut war = WarTurnState::default();
    war.diplomacy.add_deal(nap_expiring_at_2());
    war.diplomacy.add_deal(cyclic_deal());
    war.diplomacy.add_deal(tribute_deal());
    war.diplomacy.set_relation(
        civ_engine::domain::diplomacy::CivilizationPair::new(p(AI_A), p(AI_B)),
        civ_engine::domain::diplomacy::Relation::new(50.0, 0.0, RelationStatus::Peace),
    );
    war.opaque
        .insert(KEY_PAIR_META.to_owned(), truce_meta_2_3(3.0));
    // --- Tura 1: NAP aktywny (sync statusu), dostawa cykliczna, danina zaplacona, rozejm jeszcze trwa.
    let t1 = run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn 1");
    assert!(t1.dipl.expired_deals.is_empty());
    assert_eq!(
        war.diplomacy.relation(p(HUMAN), p(AI_A)).unwrap().status,
        RelationStatus::Peace,
        "D7: syncRelationFromDeals ustawia pokoj z NAP"
    );
    assert!(t1.dipl.synced_status.contains(&(HUMAN, AI_A)));
    assert_eq!(t1.dipl.cyclic.len(), 1);
    assert!(t1.dipl.cyclic[0].delivered, "D3: dostawa 10 drewna");
    let cities = t1.dipl.city_resources.as_ref().expect("zapasy po D3");
    let get = |id: &str| cities.iter().find(|c| c.id == id).unwrap().resources["drewno"];
    assert_eq!(get("20"), 15.0, "sprzedawca oddal 10");
    assert_eq!(get("10"), 10.0, "kupujacy dostal 10 do STOLICY");
    assert_eq!(t1.dipl.payments.paid, vec!["danina".to_owned()]);
    assert_eq!(t1.dipl.treasury_deltas[&HUMAN], -3.0 + 40.0);
    assert_eq!(t1.dipl.treasury_deltas[&AI_A], 3.0);
    assert_eq!(t1.dipl.treasury_deltas[&AI_B], -40.0);
    assert!(t1.dipl.truce_pairs_changed.is_empty(), "rozejm do tury 3");
    apply_effects(&mut inputs, &t1);
    let trust_3_1_before = war.diplomacy.relation(p(AI_B), p(HUMAN)).unwrap().trust;

    // --- Tura 2: NAP wygasa (D1/D2), druga dostawa, danina zerwana (brak srodkow) -> trybut_odmowa.
    let t2 = run_turn(&mut war, 2.0, &inputs, &cfg).expect("turn 2");
    assert!(
        war.diplomacy
            .deals
            .iter()
            .all(|d| d.kind != TreatyKind::Nap),
        "NAP usuniety"
    );
    assert_eq!(t2.dipl.expired_deals.len(), 1);
    let kinds: Vec<_> = t2
        .dipl
        .credibility_requests
        .iter()
        .map(|r| (r.owner, r.kind))
        .collect();
    assert!(kinds.contains(&(HUMAN, "dotrwanie_nap")) && kinds.contains(&(AI_A, "dotrwanie_nap")));
    assert!(t2.dipl.cyclic[0].delivered);
    assert_eq!(t2.dipl.payments.broken, vec!["danina".to_owned()]);
    assert_eq!(t2.dipl.tribute_breaks, vec![(AI_B, HUMAN)]);
    assert!(
        war.diplomacy.deals.iter().all(|d| d.id != "danina"),
        "danina usunieta"
    );
    let trust_after = war.diplomacy.relation(p(AI_B), p(HUMAN)).unwrap().trust;
    assert!(
        trust_after < trust_3_1_before,
        "trybut_odmowa obniza zaufanie platnika wobec odbiorcy ({trust_3_1_before} -> {trust_after})"
    );
    apply_effects(&mut inputs, &t2);
    assert_eq!(drewno(&inputs, "20"), 5.0);

    // --- Tura 3: brak zapasu (5 < 10) = niedostarczenie, licznik winy sprzedawcy; rozejm AI-AI wygasa.
    let t3 = run_turn(&mut war, 3.0, &inputs, &cfg).expect("turn 3");
    assert!(!t3.dipl.cyclic[0].delivered);
    let deal = war
        .diplomacy
        .deals
        .iter()
        .find(|d| d.id == "handel-cykl")
        .unwrap();
    assert!(
        deal.cyclic_ever_failed,
        "handelCyklicznyKiedykolwiekNiedostarczono"
    );
    assert_eq!(deal.cyclic_resource_transfers[0].seller_failed_turns, 1);
    assert_eq!(deal.cyclic_resource_transfers[0].buyer_failed_turns, 0);
    assert_eq!(
        t3.dipl.truce_pairs_changed,
        vec![(AI_A, AI_B)],
        "D5: rozejm AI-AI wygasl"
    );
    let metas: Value = war.opaque[KEY_PAIR_META].clone();
    let row = &metas.as_array().unwrap()[0];
    assert_eq!(row[0], "2-3");
    assert!(
        row[1].get("truceUntilTurn").is_none(),
        "meta rozejmu wyczyszczona"
    );
    // Armia 3 vs 1 (inicjator silniejszy) => AI akceptuje pokoj staly albo wojna; w kazdym razie status jest jawny.
    let st = war.diplomacy.relation(p(AI_A), p(AI_B)).unwrap().status;
    assert!(matches!(st, RelationStatus::Peace | RelationStatus::War));
}

#[test]
fn flag_off_ticks_good_will_and_missing_inputs_are_explicit_errors() {
    let cfg = config();
    // D7 galaz bez hamulca: dobra wola kontaktu 1-2 = 2 tury -> +1 zaufania i licznik 1.
    let mut inputs = world_inputs();
    inputs.dipl.brake_flag_off = true;
    let mut war = WarTurnState::default();
    let meta = PairMetaWeb {
        dobra_wola_remaining_tur: 2.0,
        ..PairMetaWeb::default()
    };
    war.opaque.insert(
        KEY_PAIR_META.to_owned(),
        pair_meta_to_save(&[("1-2".to_owned(), meta)]),
    );
    let before = war
        .diplomacy
        .relation(p(HUMAN), p(AI_A))
        .map(|r| r.trust)
        .unwrap_or_else(|| civ_engine::domain::diplomacy::Relation::starting().trust);
    let rep = run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn");
    assert_eq!(rep.dipl.dobra_wola_off_ticked, vec![(HUMAN, AI_A)]);
    let after = war.diplomacy.relation(p(HUMAN), p(AI_A)).unwrap().trust;
    assert!(after > before, "+1 dobrej woli ({before} -> {after})");
    let row = &war.opaque[KEY_PAIR_META].as_array().unwrap()[0];
    assert_eq!(row[1]["dobraWolaRemainingTur"], 1.0);
    // Flaga ON (domyslna): galaz nie dziala (hamulec liczy dobra wole we wlasnym magazynie).
    let mut war_on = WarTurnState::default();
    war_on
        .opaque
        .insert(KEY_PAIR_META.to_owned(), war.opaque[KEY_PAIR_META].clone());
    let on = run_turn(&mut war_on, 1.0, &world_inputs(), &cfg).expect("turn on");
    assert!(on.dipl.dobra_wola_off_ticked.is_empty());

    // Brak skarbca platnika (AI) = jawny blad, stan nietkniety (atomowosc).
    let mut inputs = world_inputs();
    inputs.dipl.treasury.remove(&AI_B);
    let mut war = WarTurnState::default();
    war.diplomacy.add_deal(tribute_deal());
    let snapshot = war.clone();
    let err = run_turn(&mut war, 1.0, &inputs, &cfg).expect_err("brak skarbca");
    assert!(
        matches!(&err, WarTurnError::DiplStep(m) if m.contains("skarbca") && m.contains('3')),
        "{err}"
    );
    assert_eq!(war, snapshot, "blad = brak zmian stanu");

    // Brak puli Pracy przy platnosci Praca = jawny blad.
    let mut inputs = world_inputs();
    inputs.dipl.praca_pool.clear();
    let mut d = cyclic_deal();
    d.cyclic_resource_transfers[0].payment = Some(PaymentKind::Work);
    let mut war = WarTurnState::default();
    war.diplomacy.add_deal(d);
    let err = run_turn(&mut war, 1.0, &inputs, &cfg).expect_err("brak Pracy");
    assert!(
        matches!(&err, WarTurnError::DiplStep(m) if m.contains("Pracy")),
        "{err}"
    );

    // Brak zapasow miast przy handlu cyklicznym = jawny blad.
    let mut inputs = world_inputs();
    inputs.dipl.cities = None;
    let mut war = WarTurnState::default();
    war.diplomacy.add_deal(cyclic_deal());
    let err = run_turn(&mut war, 1.0, &inputs, &cfg).expect_err("brak zapasow");
    assert!(
        matches!(&err, WarTurnError::DiplStep(m) if m.contains("zapasow")),
        "{err}"
    );

    // Brak mocy armii przy wygasajacym rozejmie AI-AI = jawny blad.
    let mut inputs = world_inputs();
    inputs.dipl.army_m.clear();
    let mut war = WarTurnState::default();
    war.diplomacy.set_relation(
        civ_engine::domain::diplomacy::CivilizationPair::new(p(AI_A), p(AI_B)),
        civ_engine::domain::diplomacy::Relation::new(50.0, 0.0, RelationStatus::Peace),
    );
    war.opaque
        .insert(KEY_PAIR_META.to_owned(), truce_meta_2_3(1.0));
    let err = run_turn(&mut war, 1.0, &inputs, &cfg).expect_err("brak armii");
    assert!(
        matches!(&err, WarTurnError::DiplStep(m) if m.contains("armii")),
        "{err}"
    );
}

#[test]
fn barter_is_atomic_and_alliance_sync_overrides_peace() {
    let cfg = config();
    // Barter drewno za drewno miedzy 1 a 2: sprzedawca B nie ma zapasu => zadna strona nie dostaje towaru.
    let mut inputs = world_inputs();
    inputs.dipl.cities = Some(vec![
        city("10", HUMAN, 0.0), // gracz nie ma drewna: strona B barteru nie dostarczy
        city("20", AI_A, 25.0),
        city("30", AI_B, 0.0),
    ]);
    let mut d = ActiveDeal::new(TreatyKind::Exchange, p(HUMAN), p(AI_A), 1, None);
    d.id = "barter".to_owned();
    let item = |seller: i64, buyer: i64| CyclicResourceTransfer {
        resource_key: "drewno".to_owned(),
        units_per_turn: 10.0,
        seller_owner_id: p(seller),
        buyer_owner_id: p(buyer),
        payment: None,
        payment_per_turn: 0.0,
        seller_failed_turns: 0,
        buyer_failed_turns: 0,
    };
    d.cyclic_resource_transfers = vec![item(AI_A, HUMAN), item(HUMAN, AI_A)];
    let mut war = WarTurnState::default();
    war.diplomacy.add_deal(d);
    // Sojusz ma pierwszenstwo nad NAP przy synchronizacji statusu.
    war.diplomacy.add_deal(ActiveDeal::new(
        TreatyKind::FullAlliance,
        p(HUMAN),
        p(AI_A),
        1,
        None,
    ));
    war.diplomacy
        .add_deal(ActiveDeal::new(TreatyKind::Nap, p(HUMAN), p(AI_A), 1, None));
    let rep = run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn");
    assert!(
        rep.dipl.cyclic.iter().all(|o| !o.delivered),
        "barter atomowy"
    );
    let cities = rep.dipl.city_resources.as_ref().unwrap();
    assert_eq!(
        cities.iter().find(|c| c.id == "20").unwrap().resources["drewno"],
        25.0,
        "zero dostaw czesciowych"
    );
    assert_eq!(
        war.diplomacy.relation(p(HUMAN), p(AI_A)).unwrap().status,
        RelationStatus::Alliance
    );
    let deal = war
        .diplomacy
        .deals
        .iter()
        .find(|d| d.id == "barter")
        .unwrap();
    assert!(deal.cyclic_ever_failed);
    // Strona A byla gotowa (nie winna): licznik 0; strona B winna: 1.
    assert_eq!(deal.cyclic_resource_transfers[0].seller_failed_turns, 0);
    assert_eq!(deal.cyclic_resource_transfers[1].seller_failed_turns, 1);

    // sync nie rusza wojny.
    let mut st = civ_engine::domain::diplomacy::DiplomacyState::new();
    st.set_relation(
        civ_engine::domain::diplomacy::CivilizationPair::new(p(1), p(2)),
        civ_engine::domain::diplomacy::Relation::new(10.0, 0.0, RelationStatus::War),
    );
    st.add_deal(ActiveDeal::new(TreatyKind::Nap, p(1), p(2), 1, None));
    assert!(!sync_relation_from_deals(&mut st, p(1), p(2)));
    assert_eq!(st.relation(p(1), p(2)).unwrap().status, RelationStatus::War);
}

#[test]
fn empty_state_needs_no_inputs_and_keeps_pipeline_behaviour() {
    // Brak umow/rozejmow: kroki D1-D7 sa no-op bez wymagania skarbcow, zapasow ani armii.
    let mut inputs = world_inputs();
    inputs.dipl = DiplStepsInputs::default();
    let cfg = config();
    let mut war = WarTurnState::default();
    let rep = run_turn(&mut war, 1.0, &inputs, &cfg).expect("turn");
    assert_eq!(rep.dipl, Default::default());
    assert_eq!(
        war.brake_phase.counters.get(&(AI_A, AI_B)).copied(),
        Some(1.0),
        "hamulec (D8) dziala jak przed K7"
    );
}
