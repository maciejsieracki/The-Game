//! R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1: testy części rozejmu po wygaśnięciu (port REPIN web FALA 605).
//! Wektory: wyprowadzone z formuły weba `truceEndAiAccepts` / `truceEndOfferTarget` / `truceEndOfferExpired` /
//! `isTruceWindowBreach` (origin/main 638e90bea, gra/src/game/diplomacy-peace-lock.ts). Uruchomienie weba pod Node
//! NIE_ZMIERZONO (import bez rozszerzeń .ts w pliku weba wymaga bundlera).
//! Długości rozejmu 5/10/15 i błędna długość (Z9) są pokryte przez `diplomacy_truce::normalize_truce_duration`.

use civ_engine::domain::diplomacy_truce::{
    normalize_truce_duration, truce_until_turn, TRUCE_DURATION_OPTIONS,
};
use civ_engine::domain::diplomacy_truce_end::{
    is_truce_window_breach, truce_end_ai_accepts, truce_end_ai_accepts_default,
    truce_end_offer_expired, truce_end_offer_target, PRZEWAGA_PROG,
};

#[test]
fn progu_przewagi_jak_w_webie() {
    assert_eq!(PRZEWAGA_PROG, 0.20);
}

#[test]
fn zero_vs_zero_to_odmowa() {
    assert!(!truce_end_ai_accepts_default(0.0, 0.0));
}

#[test]
fn adresat_bez_armii_to_odmowa() {
    assert!(!truce_end_ai_accepts_default(5.0, 0.0));
    assert!(!truce_end_ai_accepts_default(5.0, -1.0));
}

#[test]
fn granica_dokladnie_20_procent_jest_przyjeciem() {
    // proponujacy = 80% adresata -> <= (1-0.2+eps)*adresat -> przyjecie
    assert!(truce_end_ai_accepts_default(80.0, 100.0));
    // ponad granice -> odmowa
    assert!(!truce_end_ai_accepts_default(80.001, 100.0));
    assert!(!truce_end_ai_accepts_default(100.0, 100.0));
}

#[test]
fn wartosci_niefinite_i_ujemne_odrzucone() {
    assert!(!truce_end_ai_accepts(f64::NAN, 100.0, 0.2));
    assert!(!truce_end_ai_accepts(10.0, f64::INFINITY, 0.2));
    assert!(!truce_end_ai_accepts(-1.0, 100.0, 0.2));
}

#[test]
fn offer_target_adresatem_jest_druga_strona() {
    assert_eq!(truce_end_offer_target(Some(1u32), 1, 2), Some(2));
    assert_eq!(truce_end_offer_target(Some(2u32), 1, 2), Some(1));
    assert_eq!(truce_end_offer_target(None::<u32>, 1, 2), None);
    assert_eq!(truce_end_offer_target(Some(9u32), 1, 2), None);
}

#[test]
fn oferta_wygasa_dopiero_w_kolejnej_turze() {
    assert!(!truce_end_offer_expired(10.0, 10.0));
    assert!(truce_end_offer_expired(10.0, 11.0));
    assert!(!truce_end_offer_expired(f64::NAN, 11.0));
}

#[test]
fn okno_zlamania_rozejm_lub_oferta() {
    assert!(is_truce_window_breach(Some(15.0), false, 14.0));
    assert!(!is_truce_window_breach(Some(15.0), false, 15.0));
    assert!(is_truce_window_breach(Some(15.0), true, 15.0));
    assert!(!is_truce_window_breach(None, false, 15.0));
}

#[test]
fn dlugosci_rozejmu_5_10_15_i_zla_dlugosc() {
    assert_eq!(TRUCE_DURATION_OPTIONS, [5.0, 10.0, 15.0]);
    assert_eq!(normalize_truce_duration(Some(5.0)), Some(5.0));
    assert_eq!(normalize_truce_duration(Some(10.0)), Some(10.0));
    assert_eq!(normalize_truce_duration(Some(15.0)), Some(15.0));
    assert_eq!(normalize_truce_duration(Some(7.0)), None);
    assert_eq!(truce_until_turn(100.0, 15.0), Some(115.0));
    assert_eq!(truce_until_turn(100.0, 7.0), None);
}
