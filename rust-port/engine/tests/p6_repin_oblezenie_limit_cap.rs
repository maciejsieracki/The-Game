//! R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1 (a): sufit 150 tur oblezenia bez wylomu.
//!
//! Przypadki reczne (oczekiwania wyprowadzone z kodu weba `battleScene.ts` :1128, :9440-9456). Wektory generowane
//! z URUCHOMIONEGO weba sa w `p6_repin_oblezenie_limit_web.rs` (runda 2, ODPOWIEDZ NA ZARZUT 2).

use civ_engine::domain::siege_no_breach::{
    round_cap_verdict, siege_no_breach_cap, siege_no_breach_max_rounds_from_data, RoundCapVerdict,
    FF_MAX_ROUNDS,
};

#[test]
fn cap_wartosc_webowa_150_z_danych() {
    // ZARZUT 1: wartosc idzie z danych (`Oblezenie.bez_wylomu_max_tur`), nie ze stalej w kodzie.
    assert_eq!(siege_no_breach_max_rounds_from_data().unwrap(), 150);
    assert_eq!(siege_no_breach_cap(Some(150.0)), 150);
}

#[test]
fn cap_brak_lub_zero_lub_nan_daje_ff_400() {
    // web: Number(undefined) || FF -> FF
    assert_eq!(siege_no_breach_cap(None), FF_MAX_ROUNDS);
    assert_eq!(siege_no_breach_cap(Some(0.0)), FF_MAX_ROUNDS);
    assert_eq!(siege_no_breach_cap(Some(f64::NAN)), FF_MAX_ROUNDS);
}

#[test]
fn cap_zaokraglenie_js_i_granice() {
    // Math.round(149.5) = 150 (polowka w strone +inf)
    assert_eq!(siege_no_breach_cap(Some(149.5)), 150);
    assert_eq!(siege_no_breach_cap(Some(149.4)), 149);
    // Math.max(1, ...)
    assert_eq!(siege_no_breach_cap(Some(-7.0)), 1);
    // web: cap NIE jest tu ograniczany do 400 (ograniczenie = round_cap_verdict)
    assert_eq!(siege_no_breach_cap(Some(900.0)), 900);
}

#[test]
fn bez_wylomu_przed_sufitem_brak_werdyktu() {
    // N-1, bez muru, bez wylomu: tura 149 < 150 -> null
    assert_eq!(round_cap_verdict(149, true, false, 150, 1.0, 1.0), None);
    // brak muru (wall_present = false): sufit FF, tura 149 < 400 -> null
    assert_eq!(round_cap_verdict(149, false, false, 150, 1.0, 1.0), None);
}

#[test]
fn bez_wylomu_na_sufit_remis_niezaleznie_od_morale() {
    // N: tura 150 bez wylomu -> REMIS (odparty szturm)
    assert_eq!(
        round_cap_verdict(150, true, false, 150, 0.1, 0.9),
        Some(RoundCapVerdict::Draw)
    );
    // N+1
    assert_eq!(
        round_cap_verdict(151, true, false, 150, 0.9, 0.1),
        Some(RoundCapVerdict::Draw)
    );
}

#[test]
fn z_wylomem_sufit_ff_400_i_morale() {
    // wylom zdarzyl sie -> noBreach = false -> sufit FF 400
    assert_eq!(round_cap_verdict(149, true, true, 150, 1.0, 1.0), None);
    assert_eq!(round_cap_verdict(399, true, true, 150, 1.0, 1.0), None);
    // tura 400: remis morale (ratioA <= ratioD) -> obronca
    assert_eq!(
        round_cap_verdict(400, true, true, 150, 0.5, 0.5),
        Some(RoundCapVerdict::Defender)
    );
    // tura 400: atakujacy ma wieksze morale -> atakujacy
    assert_eq!(
        round_cap_verdict(400, true, true, 150, 0.8, 0.5),
        Some(RoundCapVerdict::Attacker)
    );
}

#[test]
fn bitwa_bez_muru_sufit_ff_400() {
    assert_eq!(round_cap_verdict(399, false, false, 150, 1.0, 1.0), None);
    assert_eq!(
        round_cap_verdict(400, false, false, 150, 0.3, 0.7),
        Some(RoundCapVerdict::Defender)
    );
}

#[test]
fn cap_podany_ponad_ff_jest_obcinany_do_400() {
    // web: Math.min(this.siegeNoBreachMaxRounds, FF) w _roundCapVerdict -> sufit 400, nie 900
    assert_eq!(round_cap_verdict(399, true, false, 900, 1.0, 1.0), None);
    assert_eq!(
        round_cap_verdict(400, true, false, 900, 1.0, 1.0),
        Some(RoundCapVerdict::Draw)
    );
}
