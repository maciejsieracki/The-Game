//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q4-Q1: testy behawioralne skutkow Prawa po przejeciu i wojny rebeliantow
//! (`applyPostCaptureLawOnCapture`, `triggerRebelProtectionWarConsequence`) w galezi Transfer.
//! Zrodlo zachowania: pin webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (`gra/src/game/post-capture-law.ts:62`,
//! `gra/src/main.ts:13253`). Bez atrap: wykonuje sie prawdziwa funkcja `apply_transfer_with_effects`.

use civ_engine::domain::order_effects_lane::PostCaptureLawFields;
use civ_engine::domain::siege_transfer::{
    apply_transfer_with_effects, TransferCity, TransferExtras, TRANSFER_EFFECTS,
};
use civ_engine::domain::siege_transfer_effects::{
    apply_post_capture_law_on_capture, rebel_protection_war_request, was_protected_rebel,
    RebelWarRequest,
};

const REBEL: i64 = -99;

fn law(
    turns: Option<f64>,
    prev_rebel: Option<i64>,
    protection: Option<f64>,
) -> PostCaptureLawFields {
    PostCaptureLawFields {
        post_capture_law_turns_remaining: turns,
        was_rebellion_reconquest: false,
        rebel_previous_owner_id: prev_rebel,
        rebel_protection_turns_remaining: protection,
    }
}

fn city(owner: i64, rebel_state: Option<bool>) -> TransferCity {
    TransferCity {
        owner_id: owner,
        population: 5.0,
        q: 0,
        r: 0,
        found_by_owner: None,
        rebel_state,
        start_city_state: None,
    }
}

#[test]
fn swiezy_podboj_daje_piec_tur_prawa() {
    let mut f = law(None, None, None);
    let r = apply_post_capture_law_on_capture(&mut f, 1, 0);
    assert_eq!(r, Some(false));
    assert_eq!(f.post_capture_law_turns_remaining, Some(5.0));
    assert!(!f.was_rebellion_reconquest);
}

#[test]
fn odbicie_po_buncie_daje_dziesiec_tur_i_kasuje_ochrone() {
    let mut f = law(None, Some(1), Some(20.0));
    let r = apply_post_capture_law_on_capture(&mut f, 1, REBEL);
    assert_eq!(r, Some(true));
    assert_eq!(f.post_capture_law_turns_remaining, Some(10.0));
    assert!(f.was_rebellion_reconquest);
    assert_eq!(f.rebel_previous_owner_id, None);
    assert_eq!(f.rebel_protection_turns_remaining, None);
}

#[test]
fn ten_sam_wlasciciel_jest_no_op() {
    let mut f = law(Some(3.0), Some(1), Some(20.0));
    let before = f;
    assert_eq!(apply_post_capture_law_on_capture(&mut f, 2, 2), None);
    assert_eq!(f, before);
}

#[test]
fn chroniony_bunt_przejety_przez_inna_civ_wywoluje_wojne() {
    // Miasto zbuntowane (rebelState) w oknie ochrony, poprzedni wlasciciel = 2, zdobywca = 3.
    let mut f = law(None, Some(2), Some(20.0));
    let mut c = city(REBEL, Some(true));
    let mut units = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        3,
        false,
        &mut units,
        None,
        TransferExtras {
            post_capture_law: Some(&mut f),
            ..Default::default()
        },
    );
    assert_eq!(
        out.rebel_war_request,
        Some(RebelWarRequest {
            declarer: 3,
            target: 2
        })
    );
    assert_eq!(out.post_capture_law_reconquest, Some(false));
    assert_eq!(c.owner_id, 3);
    assert_eq!(c.rebel_state, Some(false));
    assert_eq!(f.rebel_protection_turns_remaining, None);
    assert_eq!(f.post_capture_law_turns_remaining, Some(5.0));
    assert!(out.performed.contains(&"applyPostCaptureLawOnCapture"));
    assert!(out
        .performed
        .contains(&"triggerRebelProtectionWarConsequence"));
}

#[test]
fn odbicie_przez_bylego_wlasciciela_nie_wywoluje_wojny() {
    let mut f = law(None, Some(2), Some(20.0));
    let mut c = city(REBEL, Some(true));
    let mut units = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            post_capture_law: Some(&mut f),
            ..Default::default()
        },
    );
    assert_eq!(out.rebel_war_request, None);
    assert_eq!(out.post_capture_law_reconquest, Some(true));
}

#[test]
fn bez_flagi_buntu_nie_ma_wojny() {
    // rebelState = false: wasProtectedRebel = false mimo aktywnego okna.
    assert!(!was_protected_rebel(
        Some(false),
        &law(None, Some(2), Some(20.0))
    ));
    assert_eq!(rebel_protection_war_request(false, Some(2), 3), None);
}

#[test]
fn wygasle_okno_ochrony_nie_jest_chronione() {
    assert!(!was_protected_rebel(
        Some(true),
        &law(None, Some(2), Some(0.0))
    ));
    assert!(!was_protected_rebel(Some(true), &law(None, Some(2), None)));
    assert!(was_protected_rebel(
        Some(true),
        &law(None, Some(2), Some(0.5))
    ));
}

#[test]
fn zdobywca_bedacy_bylym_wlascicielem_ani_barbarzynca_nie_wywoluja_wojny() {
    assert_eq!(rebel_protection_war_request(true, Some(2), 2), None);
    assert_eq!(rebel_protection_war_request(true, Some(2), -1), None);
    assert_eq!(rebel_protection_war_request(true, None, 3), None);
    assert_eq!(
        rebel_protection_war_request(true, Some(2), 3),
        Some(RebelWarRequest {
            declarer: 3,
            target: 2
        })
    );
}

#[test]
fn legacy_bez_extras_nie_rusza_prawa_ani_wojny() {
    let mut c = city(0, Some(true));
    let mut units = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        1,
        false,
        &mut units,
        None,
        TransferExtras::default(),
    );
    assert_eq!(out.post_capture_law_reconquest, None);
    assert_eq!(out.rebel_war_request, None);
    assert!(!out.performed.contains(&"applyPostCaptureLawOnCapture"));
}

#[test]
fn tabela_oznacza_nowe_skutki() {
    let status = |name: &str| {
        TRANSFER_EFFECTS
            .iter()
            .find(|(n, _)| *n == name)
            .map(|(_, s)| *s)
            .unwrap_or_else(|| panic!("brak wpisu {name}"))
    };
    assert!(matches!(
        status("applyPostCaptureLawOnCapture"),
        civ_engine::domain::siege_transfer::EffectStatus::Ported(_)
    ));
    assert!(matches!(
        status("triggerRebelProtectionWarConsequence"),
        civ_engine::domain::siege_transfer::EffectStatus::CallerSide(_)
    ));
}
