//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q4-Q1: testy skutkow Prawa po przejeciu i wojny rebeliantow
//! (`applyPostCaptureLawOnCapture`, `triggerRebelProtectionWarConsequence`) w galezi Transfer.
//! Zrodlo zachowania: pin webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (`gra/src/game/post-capture-law.ts:62`,
//! `gra/src/main.ts:13253`, sekwencja `main.ts:17693-17703`).
//!
//! DOWOD ZGODNOSCI Z PINEM: wektory `transfer` w `p6_siege_transfer.rs` (generator `p6_siege_transfer_gen.mjs`
//! WYKONUJE powyzsze funkcje z pinu, bez atrap; >= 10 odbic po buncie i >= 10 wojen w 160 wektorach).
//! Ponizsze testy sa testami SPECYFIKACJI przypadkow brzegowych (r2): nie sa dowodem zgodnosci same w sobie,
//! a ich liczby (5, 10 tur) pochodza ze stalych pina (`POST_CAPTURE_FRESH_TURNS`, `POST_CAPTURE_REBELLION_RECONQUEST_TURNS`).

use civ_engine::domain::order_effects_lane::PostCaptureLawFields;
use civ_engine::domain::siege_enter_city::EnterUnit;
use civ_engine::domain::siege_transfer::{
    apply_transfer_with_effects, EffectStatus, TransferCity, TransferExtras, TRANSFER_EFFECTS,
};
use civ_engine::domain::siege_transfer_effects::{
    apply_post_capture_law_on_capture, rebel_protection_war_request, was_protected_rebel,
    CapturePopLossInput, PostCaptureCityFields, RebelWarRequest, CAPTURE_POP_LOSS_PIN,
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

fn pop_loss(prev: i64, new: i64, snapshot: Option<i64>) -> CapturePopLossInput {
    CapturePopLossInput {
        prev_owner: prev,
        new_owner: new,
        rebel_prev_owner_snapshot: snapshot,
        captured_from_owner_id: None,
        founded_by: None,
        found_by_owner: None,
        capture_pop_loss: CAPTURE_POP_LOSS_PIN,
    }
}

#[test]
fn swiezy_podboj_daje_piec_tur_prawa_i_zeruje_grace() {
    let mut f = law(None, None, None);
    let mut grace = Some(3.0);
    let r = apply_post_capture_law_on_capture(&mut f, &mut grace, 1, 0);
    assert_eq!(r, Some(false));
    assert_eq!(f.post_capture_law_turns_remaining, Some(5.0));
    assert!(!f.was_rebellion_reconquest);
    // Web post-capture-law.ts:74: city.revoltGraceRemaining = null.
    assert_eq!(grace, None);
}

#[test]
fn odbicie_po_buncie_daje_dziesiec_tur_kasuje_ochrone_i_grace() {
    let mut f = law(None, Some(1), Some(20.0));
    let mut grace = Some(2.0);
    let r = apply_post_capture_law_on_capture(&mut f, &mut grace, 1, REBEL);
    assert_eq!(r, Some(true));
    assert_eq!(f.post_capture_law_turns_remaining, Some(10.0));
    assert!(f.was_rebellion_reconquest);
    assert_eq!(f.rebel_previous_owner_id, None);
    assert_eq!(f.rebel_protection_turns_remaining, None);
    assert_eq!(grace, None);
}

#[test]
fn ten_sam_wlasciciel_jest_no_op_bez_zapisu_grace() {
    let mut f = law(Some(3.0), Some(1), Some(20.0));
    let before = f;
    let mut grace = Some(2.5);
    assert_eq!(
        apply_post_capture_law_on_capture(&mut f, &mut grace, 2, 2),
        None
    );
    assert_eq!(f, before);
    assert_eq!(grace, Some(2.5));
}

#[test]
fn chroniony_bunt_przejety_przez_inna_civ_wywoluje_wojne() {
    // Miasto zbuntowane (rebelState) w oknie ochrony, poprzedni wlasciciel = 2, zdobywca = 3.
    let mut f = law(None, Some(2), Some(20.0));
    let mut grace = Some(1.0);
    let mut c = city(REBEL, Some(true));
    let mut units = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        3,
        false,
        &mut units,
        None,
        TransferExtras {
            post_capture_law: Some(PostCaptureCityFields {
                law: &mut f,
                revolt_grace_remaining: &mut grace,
            }),
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
    assert_eq!(grace, None);
    assert!(out.performed.contains(&"applyPostCaptureLawOnCapture"));
    assert!(out
        .performed
        .contains(&"triggerRebelProtectionWarConsequence"));
}

#[test]
fn odbicie_przez_bylego_wlasciciela_nie_wywoluje_wojny() {
    let mut f = law(None, Some(2), Some(20.0));
    let mut grace = None;
    let mut c = city(REBEL, Some(true));
    let mut units = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            post_capture_law: Some(PostCaptureCityFields {
                law: &mut f,
                revolt_grace_remaining: &mut grace,
            }),
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

/// Przypadek zgloszony w zarzucie 3 (r1): `post_capture_law: None` POMIJA po cichu prawo i wojne, a web
/// wykonuje je zawsze. Test dokumentuje te roznice (wolajacy produkcyjny MUSI podac `Some`) i pokazuje,
/// ze `Some` na tym samym wejsciu daje wojne.
#[test]
fn none_pomija_prawo_i_wojne_jawnie() {
    let mut c_none = city(REBEL, Some(true));
    let mut units: Vec<EnterUnit> = Vec::new();
    let out_none = apply_transfer_with_effects(
        &mut c_none,
        3,
        false,
        &mut units,
        None,
        TransferExtras::default(),
    );
    assert_eq!(
        out_none.rebel_war_request, None,
        "None: brak wojny (jawna roznica wzgledem weba)"
    );
    assert_eq!(out_none.post_capture_law_reconquest, None);

    let mut f = law(None, Some(2), Some(20.0));
    let mut grace = Some(4.0);
    let mut c_some = city(REBEL, Some(true));
    let out_some = apply_transfer_with_effects(
        &mut c_some,
        3,
        false,
        &mut units,
        None,
        TransferExtras {
            post_capture_law: Some(PostCaptureCityFields {
                law: &mut f,
                revolt_grace_remaining: &mut grace,
            }),
            ..Default::default()
        },
    );
    assert!(out_some.rebel_war_request.is_some());
    assert_eq!(grace, None);
}

/// Zarzut 5 (r1): `apply_capture_population_loss` MUSI dostac `rebelPrevOwnerSnapshot` odczytany PRZED
/// `applyPostCaptureLawOnCapture` (ktore kasuje `rebelPreviousOwnerId`). Odbicie przez byly wlasciciel
/// (snapshot = zdobywca) ma dac odzysk bez straty obywatela; bez snapshotu strata wynosi 1.
#[test]
fn snapshot_przed_kasowaniem_daje_odzysk_bez_straty() {
    // Z snapshotem: zdobywca 2 = byly wlasciciel sprzed buntu -> odzysk, brak straty.
    let mut f = law(None, Some(2), Some(20.0));
    let mut grace = None;
    let mut c = city(REBEL, Some(true));
    let mut units: Vec<EnterUnit> = Vec::new();
    let out = apply_transfer_with_effects(
        &mut c,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            pop_loss: Some(pop_loss(REBEL, 2, Some(2))),
            post_capture_law: Some(PostCaptureCityFields {
                law: &mut f,
                revolt_grace_remaining: &mut grace,
            }),
            ..Default::default()
        },
    );
    let cap = out
        .capture_loss
        .expect("applyCapturePopulationLoss wykonany");
    assert!(cap.reclaim, "snapshot == zdobywca: odzysk");
    assert_eq!(cap.loss, 0.0);
    assert_eq!(out.post_capture_law_reconquest, Some(true));
    assert_eq!(out.rebel_war_request, None);

    // Bez snapshotu (wolajacy odczytal pole PO kasowaniu): strata 1 - to jest blad, ktory test wykrywa.
    let mut f2 = law(None, None, Some(20.0));
    let mut grace2 = None;
    let mut c2 = city(REBEL, Some(true));
    let out2 = apply_transfer_with_effects(
        &mut c2,
        2,
        false,
        &mut units,
        None,
        TransferExtras {
            pop_loss: Some(pop_loss(REBEL, 2, None)),
            post_capture_law: Some(PostCaptureCityFields {
                law: &mut f2,
                revolt_grace_remaining: &mut grace2,
            }),
            ..Default::default()
        },
    );
    let cap2 = out2
        .capture_loss
        .expect("applyCapturePopulationLoss wykonany");
    assert!(!cap2.reclaim);
    assert_eq!(cap2.loss, 1.0);
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
        EffectStatus::Ported(_)
    ));
    assert!(matches!(
        status("triggerRebelProtectionWarConsequence"),
        EffectStatus::CallerSide(_)
    ));
    // Zarzut 4 (r1): zaleznosc force=true zapisana jawnie w tabeli (nie tylko w raporcie).
    match status("ownerDeclareWarOn") {
        EffectStatus::CallerSide(opis) => assert!(opis.contains("force"), "opis bez force: {opis}"),
        other => panic!("ownerDeclareWarOn: {other:?}"),
    }
}
