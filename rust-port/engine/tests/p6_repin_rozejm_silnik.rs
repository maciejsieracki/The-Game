//! R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1 (runda 3): test integracyjny PRZEZ SILNIK
//! (`TruceDiplomacy` = zywa sciezka `evaluate_proposal_with_params` + stan `PairMetaWeb` + tick pary).
//! Wzorzec: web `finalizePeaceTreatyBetween`, `truceEndTickPair`, `chargeWarDeclarationCredibility`
//! (origin/main 638e90bea). Progi sily: 0.20, 0 vs 0 = odmowa.

use civ_engine::domain::diplomacy::{
    DiplomaticProposal, ProposalAction, ProposalPayload, Relation, RelationStatus,
};
use civ_engine::domain::diplomacy_truce::{pair_meta_from_save, pair_meta_to_save, PairMetaWeb};
use civ_engine::domain::diplomacy_truce_flow::{TruceDiplomacy, CREDIBILITY_EVENT_TRUCE_BREACH};
use civ_engine::domain::PlayerId;
use serde_json::json;

const HUMAN: PlayerId = PlayerId::new(0);
const AI1: PlayerId = PlayerId::new(1);
const AI2: PlayerId = PlayerId::new(2);

fn at_war(a: PlayerId, b: PlayerId) -> TruceDiplomacy {
    let mut s = TruceDiplomacy::new();
    s.diplomacy.set_relation(
        civ_engine::domain::diplomacy::CivilizationPair::new(a, b),
        Relation::new(40.0, 40.0, RelationStatus::War),
    );
    s
}

fn truce_proposal(from: PlayerId, to: PlayerId, turns: Option<f64>) -> DiplomaticProposal {
    DiplomaticProposal::new(
        ProposalAction::Truce,
        from,
        to,
        ProposalPayload {
            turns,
            ..Default::default()
        },
    )
}

fn peace_proposal(from: PlayerId, to: PlayerId) -> DiplomaticProposal {
    DiplomaticProposal::new(ProposalAction::Peace, from, to, ProposalPayload::default())
}

#[test]
fn rozejm_5_10_15_przez_propozycje_ustawia_okres_inicjatora_i_zero_zaufania() {
    for len in [5.0, 10.0, 15.0] {
        let mut s = at_war(AI1, AI2);
        let before = s.relation(AI1, AI2);
        let eval = s.propose(&truce_proposal(AI1, AI2, Some(len)), 20);
        assert!(eval.accepted, "len {len}: {}", eval.reason);
        assert_eq!(s.status(AI1, AI2), RelationStatus::Peace);
        // (C) rozejm = 0 Zaufania
        assert_eq!(s.relation(AI1, AI2).trust, before.trust);
        let m = s.pair_meta_of(AI1, AI2);
        assert_eq!(m.truce_until_turn, Some(20.0 + len));
        assert_eq!(m.truce_initiator_id, Some(1.0));
        assert_eq!(m.peace_until_turn, None);
        assert!(m.n3_window.is_none());
    }
}

#[test]
fn rozejm_bez_dlugosci_to_domyslne_10() {
    let mut s = at_war(AI1, AI2);
    assert!(s.propose(&truce_proposal(AI1, AI2, None), 3).accepted);
    assert_eq!(s.pair_meta_of(AI1, AI2).truce_until_turn, Some(13.0));
}

#[test]
fn z9_zla_dlugosc_to_odrzucenie_i_brak_zmian() {
    for bad in [7.0, 0.0, 5.5, -5.0, 20.0, f64::NAN, f64::INFINITY] {
        let mut s = at_war(AI1, AI2);
        let before = s.relation(AI1, AI2);
        let eval = s.propose(&truce_proposal(AI1, AI2, Some(bad)), 20);
        assert!(!eval.accepted, "bad {bad}");
        assert!(eval.reason.contains("5, 10 lub 15"));
        assert_eq!(s.status(AI1, AI2), RelationStatus::War);
        assert_eq!(s.relation(AI1, AI2), before);
        assert_eq!(s.pair_meta_of(AI1, AI2), PairMetaWeb::default());
    }
    // bezposrednio: zla dlugosc przy finalizacji = nic sie nie dzieje
    let mut s = at_war(AI1, AI2);
    assert!(!s.finalize_peace_between(AI1, AI2, 20.0, Some(7.0)));
    assert_eq!(s.status(AI1, AI2), RelationStatus::War);
}

#[test]
fn rozejm_wymaga_trwajacej_wojny() {
    let mut s = TruceDiplomacy::new();
    s.set_status(AI1, AI2, RelationStatus::Neutral);
    let eval = s.propose(&truce_proposal(AI1, AI2, Some(5.0)), 10);
    assert!(!eval.accepted);
}

#[test]
fn pokoj_staly_przez_silnik_daje_zaufanie_i_blokade_bez_pol_rozejmu() {
    let mut s = at_war(AI1, AI2);
    let before = s.relation(AI1, AI2);
    let eval = s.propose(&peace_proposal(AI1, AI2), 20);
    assert!(eval.accepted, "{}", eval.reason);
    assert_eq!(s.status(AI1, AI2), RelationStatus::Peace);
    assert!(
        s.relation(AI1, AI2).trust > before.trust,
        "pokoj staly +Zaufanie"
    );
    let m = s.pair_meta_of(AI1, AI2);
    assert!(m.peace_until_turn.is_some());
    assert_eq!(m.truce_until_turn, None);
    assert_eq!(m.truce_initiator_id, None);
}

/// Rozejm AI1 -> AI2 na `len` tur w turze 1, tick w turze wygasniecia z armiami `(a1, a2)`.
fn truce_to_expiry_ai(len: f64, a1: f64, a2: f64) -> TruceDiplomacy {
    let mut s = at_war(AI1, AI2);
    s.army_m.insert(AI1, a1);
    s.army_m.insert(AI2, a2);
    assert!(s.propose(&truce_proposal(AI1, AI2, Some(len)), 1).accepted);
    // przed koncem: nic sie nie dzieje
    s.tick(len, &[AI1, AI2]);
    assert_eq!(s.status(AI1, AI2), RelationStatus::Peace);
    assert_eq!(s.pair_meta_of(AI1, AI2).truce_until_turn, Some(1.0 + len));
    s.tick(1.0 + len, &[AI1, AI2]);
    s
}

#[test]
fn po_koncu_rozejmu_5_10_15_slabszy_proponujacy_o_20_proc_dostaje_pokoj() {
    for len in [5.0, 10.0, 15.0] {
        // proponujacy 80 vs adresat 100 = dokladnie 20% slabszy -> zgoda
        let s = truce_to_expiry_ai(len, 80.0, 100.0);
        assert_eq!(s.status(AI1, AI2), RelationStatus::Peace, "len {len}");
        let m = s.pair_meta_of(AI1, AI2);
        assert_eq!(m.truce_until_turn, None);
        assert!(m.peace_until_turn.is_some(), "pokoj staly z blokada");
        assert!(m.truce_end_offer.is_none());
    }
}

#[test]
fn po_koncu_rozejmu_zbyt_silny_proponujacy_to_wojna() {
    for (a1, a2) in [(80.001, 100.0), (100.0, 100.0), (150.0, 100.0)] {
        let s = truce_to_expiry_ai(10.0, a1, a2);
        assert_eq!(s.status(AI1, AI2), RelationStatus::War, "{a1} vs {a2}");
        assert_eq!(s.pair_meta_of(AI1, AI2).truce_until_turn, None);
    }
}

#[test]
fn po_koncu_rozejmu_zero_vs_zero_to_odmowa_czyli_wojna() {
    let s = truce_to_expiry_ai(10.0, 0.0, 0.0);
    assert_eq!(s.status(AI1, AI2), RelationStatus::War);
    // adresat bez armii tez = wojna
    let s = truce_to_expiry_ai(10.0, 5.0, 0.0);
    assert_eq!(s.status(AI1, AI2), RelationStatus::War);
}

fn truce_to_expiry_human(len: f64) -> TruceDiplomacy {
    let mut s = at_war(AI1, HUMAN);
    s.humans.insert(HUMAN);
    s.army_m.insert(AI1, 1.0);
    s.army_m.insert(HUMAN, 1000.0);
    assert!(
        s.propose(&truce_proposal(AI1, HUMAN, Some(len)), 1)
            .accepted
    );
    s.tick(1.0 + len, &[HUMAN, AI1]);
    s
}

#[test]
fn oferta_pokoju_dla_gracza_zgoda_to_pokoj_staly() {
    for len in [5.0, 10.0, 15.0] {
        let mut s = truce_to_expiry_human(len);
        let m = s.pair_meta_of(AI1, HUMAN);
        let offer = m.truce_end_offer.clone().expect("oferta");
        assert_eq!(offer.to_owner_id, 0.0);
        assert_eq!(offer.from_owner_id, 1.0);
        assert_eq!(s.offers_for(AI1).len(), 1);
        assert_eq!(s.status(AI1, HUMAN), RelationStatus::Peace);
        // drugi tick tej samej tury nie duplikuje oferty
        s.tick(1.0 + len, &[HUMAN, AI1]);
        assert_eq!(s.offers_for(AI1).len(), 1);
        assert!(s.respond_to_truce_end_offer(HUMAN, AI1, true, 1.0 + len));
        assert_eq!(s.status(AI1, HUMAN), RelationStatus::Peace);
        let m = s.pair_meta_of(AI1, HUMAN);
        assert!(m.truce_end_offer.is_none() && m.peace_until_turn.is_some());
        assert!(s.inbox.is_empty());
    }
}

#[test]
fn oferta_pokoju_dla_gracza_odmowa_to_wojna_bez_kary() {
    let mut s = truce_to_expiry_human(10.0);
    assert!(s.respond_to_truce_end_offer(HUMAN, AI1, false, 11.0));
    assert_eq!(s.status(AI1, HUMAN), RelationStatus::War);
    assert!(s.pair_meta_of(AI1, HUMAN).truce_end_offer.is_none());
    assert!(s.inbox.is_empty());
    assert!(s.credibility_events.is_empty());
}

#[test]
fn oferta_pokoju_bez_odpowiedzi_do_nastepnej_tury_to_wojna() {
    let mut s = truce_to_expiry_human(10.0);
    s.tick(11.0, &[HUMAN, AI1]); // ta sama tura oferty: nadal czeka
    assert_eq!(s.status(AI1, HUMAN), RelationStatus::Peace);
    s.tick(12.0, &[HUMAN, AI1]); // kolejna tura: timeout
    assert_eq!(s.status(AI1, HUMAN), RelationStatus::War);
    assert!(s.inbox.is_empty());
    assert!(s.pair_meta_of(AI1, HUMAN).truce_end_offer.is_none());
}

#[test]
fn odpowiedz_od_niewlasciwej_strony_lub_bez_oferty_jest_ignorowana() {
    let mut s = truce_to_expiry_human(10.0);
    assert!(!s.respond_to_truce_end_offer(AI1, HUMAN, true, 11.0));
    let mut s2 = at_war(AI1, AI2);
    assert!(!s2.respond_to_truce_end_offer(AI2, AI1, true, 5.0));
}

#[test]
fn z8_wypowiedzenie_wojny_w_aktywnym_rozejmie_to_zlamanie() {
    let mut s = at_war(AI1, AI2);
    assert!(s.propose(&truce_proposal(AI1, AI2, Some(10.0)), 1).accepted);
    assert!(s.declare_war(AI2, AI1, 5.0));
    assert_eq!(
        s.credibility_events,
        vec![(AI2, CREDIBILITY_EVENT_TRUCE_BREACH)]
    );
    assert_eq!(s.status(AI1, AI2), RelationStatus::War);
    let m = s.pair_meta_of(AI1, AI2);
    assert_eq!(m.truce_until_turn, None);
    assert_eq!(m.truce_initiator_id, None);
    assert_eq!(m.wojna_od_tury, Some(5.0));
}

#[test]
fn z8_wypowiedzenie_wojny_w_oknie_oferty_kasuje_oferte_i_karze() {
    let mut s = truce_to_expiry_human(10.0);
    assert_eq!(s.offers_for(AI1).len(), 1);
    assert!(s.declare_war(HUMAN, AI1, 11.0));
    assert_eq!(s.credibility_events.len(), 1);
    assert!(s.inbox.is_empty(), "wpis w skrzynce skasowany");
    assert!(s.pair_meta_of(AI1, HUMAN).truce_end_offer.is_none());
    // pozna zgoda nie przywraca pokoju w wojnie
    assert!(!s.respond_to_truce_end_offer(HUMAN, AI1, true, 11.0));
    assert_eq!(s.status(AI1, HUMAN), RelationStatus::War);
}

#[test]
fn z8_wypowiedzenie_po_pokoju_stalym_lub_po_rozejmie_nie_jest_zlamaniem_okna() {
    let mut s = at_war(AI1, AI2);
    assert!(s.propose(&peace_proposal(AI1, AI2), 1).accepted);
    assert!(!s.declare_war(AI1, AI2, 3.0));
    assert!(s.credibility_events.is_empty());
    // rozejm po wygasnieciu (wojna po odmowie AI) i ponowne wypowiedzenie
    let mut s = truce_to_expiry_ai(5.0, 100.0, 100.0);
    assert_eq!(s.status(AI1, AI2), RelationStatus::War);
    assert!(!s.declare_war(AI1, AI2, 7.0));
}

#[test]
fn stary_zapis_pary_bez_pol_rozejmu_wczytuje_sie_bez_zmian() {
    let raw = json!([["1_2", {
        "trustPnGainedThisTurn": 1.0,
        "dobraWolaRemainingTur": 2.0,
        "peaceUntilTurn": 30,
        "ostatniePrzewinienieWobecNas": { "turn": 3 }
    }]]);
    let parsed = pair_meta_from_save(&raw);
    assert_eq!(parsed.len(), 1);
    let m = &parsed[0].1;
    assert_eq!(m.truce_initiator_id, None);
    assert!(m.truce_end_offer.is_none());
    assert_eq!(m.peace_until_turn, Some(30.0));
    // zapis ponowny nie dodaje pol rozejmu i zachowuje przechodnie
    let back = pair_meta_to_save(&parsed);
    assert_eq!(back[0][1].get("truceInitiatorId"), None);
    assert_eq!(back[0][1].get("truceEndOffer"), None);
    assert!(back[0][1].get("ostatniePrzewinienieWobecNas").is_some());
}

#[test]
fn zapis_pary_z_rozejmem_ma_pola_jak_web_i_round_trip() {
    let mut s = at_war(AI1, HUMAN);
    s.humans.insert(HUMAN);
    assert!(
        s.propose(&truce_proposal(AI1, HUMAN, Some(5.0)), 1)
            .accepted
    );
    s.tick(6.0, &[HUMAN, AI1]);
    let m = s.pair_meta_of(AI1, HUMAN);
    let saved = pair_meta_to_save(&[("0_1".to_owned(), m.clone())]);
    let obj = &saved[0][1];
    assert_eq!(obj["truceInitiatorId"], json!(1.0));
    assert_eq!(obj["truceEndOffer"]["turn"], json!(6.0));
    assert_eq!(obj["truceEndOffer"]["fromOwnerId"], json!(1.0));
    assert_eq!(obj["truceEndOffer"]["toOwnerId"], json!(0.0));
    let again = pair_meta_from_save(&saved);
    assert_eq!(again[0].1, m);
}

#[test]
fn nazwa_akcji_rozejm_w_serde() {
    assert_eq!(ProposalAction::Truce.wire_name(), "rozejm");
    let a: ProposalAction = serde_json::from_str("\"rozejm\"").unwrap();
    assert_eq!(a, ProposalAction::Truce);
    let a: ProposalAction = serde_json::from_str("\"truce\"").unwrap();
    assert_eq!(a, ProposalAction::Truce);
}
