// R-RUSTPORT-REPIN-DYPLOMACJA-DANE-2-Q1: zgodnosc dryfujacych danych dyplomacji z webem.
// Wartosci web (ZMIERZONO przez `git show origin/main:gra/data/diplomacy.json`):
//   progSojuszWillingnessMin         = 0.54  (decyzja ALLIANCE-WILLINGNESS-THRESHOLD-054)
//   progNapZaufanie                  = 30
//   progNapBezterminowyRelacja       = 151   (ai.ts:7064 napIndefinite)
//   ekspansjaGranicaBraz_zaufanie_perTura   = -3
//   ekspansjaGranicaZelazo_zaufanie_perTura = -4
//   ekspansjaGranica_zaufanie_perTura       = -2 (bez zmian)

#[path = "../src/data/civilizations.rs"]
#[allow(dead_code)]
mod civilizations;

use civ_engine::domain::diplomacy::*;
use civ_engine::domain::diplomacy_nap_trust::nap_zaufanie_z_danych;
use civ_engine::domain::diplomacy_truce_flow::TRUCE_BASE_PN;
use civ_engine::domain::PlayerId;
use civilizations::{parse_diplomacy, parse_diplomacy_acceptance_points};

/// Wektory z uruchomionego kodu weba (gen-dane2-web.mjs, gra/src/game/diplomacy.ts).
const WEB_VECTORS: &str = include_str!("p6_repin_dyplomacja_dane2_vectors/web-vectors.json");
/// Kopia `gra/data/diplomacy-war-peace-params.json` (sync DANE-2).
const WAR_PEACE_JSON: &str = include_str!("../data/derived/diplomacy-war-peace-params.json");

#[test]
fn diplomacy_json_willingness_i_nap_zgodne_z_web() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(f.params.prog_sojusz_willingness_min, 0.54);
    assert_eq!(f.params.prog_nap_zaufanie, 30);
    assert_eq!(f.params.prog_nap_bezterminowy_relacja, 151);
    assert_eq!(f.params.prog_nap_relacja, 110);
}

#[test]
fn diplomacy_json_ekspansja_granica_zgodna_z_web() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(f.params.ekspansja_granica_zaufanie_per_tura, -2);
    assert_eq!(f.params.ekspansja_granica_braz_zaufanie_per_tura, -3);
    assert_eq!(f.params.ekspansja_granica_zelazo_zaufanie_per_tura, -4);
}

#[test]
fn diplomacy_params_default_willingness_i_nap_zgodne_z_web() {
    let p = DiplomacyParams::default();
    assert_eq!(p.alliance_willingness_min, 0.54);
    assert_eq!(p.nap_indefinite_relation, 151.0);
    assert_eq!(p.nap_relation, 110.0);
    assert_eq!(p.minimum_relation, 30.0);
}

fn rel(trust: f64, respect: f64) -> Relation {
    Relation::new(trust, respect, RelationStatus::Neutral)
}

fn alliance_ctx(willingness: f64) -> ProposalEvalContext {
    let mut ctx = ProposalEvalContext::new(rel(100.0, 100.0), 10);
    ctx.military_ratio = 1.0;
    ctx.responder_willingness_ally = willingness;
    ctx
}

#[test]
fn acceptance_points_rozejm_zgodny_z_web() {
    let ap = parse_diplomacy_acceptance_points().expect("acceptance-points parse");
    assert_eq!(ap.traktaty.rozejm.punkty, 200);
    assert_eq!(ap.traktaty.rozejm.jednostka, "umowa");
    assert_eq!(ap.traktaty.pokoj.punkty, 500);
    // Kod uzywa stalej TRUCE_BASE_PN; musi byc zgodna z plikiem danych.
    assert_eq!(TRUCE_BASE_PN, ap.traktaty.rozejm.punkty as f64);
}

#[test]
fn war_peace_przewaga_i_pokoj_ai_ai_zsynchronizowane_z_web() {
    let v: serde_json::Value = serde_json::from_str(WAR_PEACE_JSON).expect("war-peace parse");
    assert_eq!(v["przewagaMilitarna"]["prog"].as_f64(), Some(0.2));
    assert_eq!(v["przewagaMilitarna"]["epsilon"].as_f64(), Some(1e-9));
    assert_eq!(v["pokojAiAi"]["minBilansPW"].as_f64(), Some(0.0));
}

#[test]
fn nap_zaufanie_domyslne_czyta_diplomacy_json() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(nap_zaufanie_z_danych(), f.params.prog_nap_zaufanie as f64);
    assert_eq!(nap_zaufanie_z_danych(), 30.0);
}

#[test]
fn web_vectors_wartosci_zgodne_z_rust() {
    let w: serde_json::Value = serde_json::from_str(WEB_VECTORS).expect("web-vectors parse");
    let num = |k: &str| w[k].as_str().expect("string").parse::<f64>().expect("f64");
    let p = DiplomacyParams::default();
    assert_eq!(num("progSojuszWillingnessMin"), p.alliance_willingness_min);
    assert_eq!(num("progNapBezterminowyRelacja"), p.nap_indefinite_relation);
    assert_eq!(num("progNapRelacja"), p.nap_relation);
    assert_eq!(num("progNapZaufanie"), nap_zaufanie_z_danych());
}

#[test]
fn gotowosc_sojuszu_0_55_przechodzi_prog_0_54_a_0_53_nie() {
    let alliance = DiplomaticProposal::new(
        ProposalAction::DefensiveAlliance,
        PlayerId::new(0),
        PlayerId::new(1),
        ProposalPayload::default(),
    );
    // Gotowość 0,55 >= 0,54: próg gotowości nie blokuje propozycji.
    let ok = evaluate_proposal(&alliance, &alliance_ctx(0.55));
    assert!(!ok.reason.contains("Brak gotowości"), "{}", ok.reason);
    // Gotowość 0,53 < 0,54 -> odrzucone jako brak gotowości (dawny próg 0,68 odrzuciłby też 0,55).
    let low = evaluate_proposal(&alliance, &alliance_ctx(0.53));
    assert!(!low.accepted);
    assert!(low.reason.contains("Brak gotowości"), "{}", low.reason);
}
