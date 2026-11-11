//! R-RUSTPORT-P6-UNIT-REPLACE-L2-Q1 (dlug L-2): klucz `ai_zamiana_jednostek_limit_udzial`
//! z `data/ai-params.json` (pin web gra/data/ai-params.json @07d2fbd72, wartosc 0,1, sekcja §9).
//! Test: wczytany parametr = wartosc z pinu i jest uzywany przez `load_ai_unit_replace_max_fraction`
//! oraz `ai_unit_replace_cap` (zamiast wartosci domyslnej przy podanej wartosci).

use civ_engine::data::economy_society_part2::parse_ai_params;
use civ_engine::domain::unit_replace::{
    ai_unit_replace_cap, ai_unit_replace_max_fraction_from_json,
    ai_unit_replace_max_fraction_from_params, load_ai_unit_replace_max_fraction,
    AI_UNIT_REPLACE_MAX_FRACTION,
};

const PIN_VALUE: f64 = 0.1;

#[test]
fn klucz_obecny_w_danych_z_wartoscia_z_pinu() {
    let params = parse_ai_params().expect("ai-params.json musi sie parsowac");
    let p = &params.ai_zamiana_jednostek_limit_udzial;
    assert_eq!(p.wartosc, PIN_VALUE);
    assert_eq!(p.sekcja, "§9 Armia AI");
    assert!(p.opis.contains("0,1 = 10%"));
}

#[test]
fn parametr_wczytany_z_danych_rowny_pinowi() {
    assert_eq!(ai_unit_replace_max_fraction_from_params(), PIN_VALUE);
}

#[test]
fn loader_uzywa_wartosci_z_parametru_zamiast_domyslnej() {
    // Wartosc inna niz domyslna: loader musi zwrocic podana, nie 10%.
    assert_ne!(0.25, AI_UNIT_REPLACE_MAX_FRACTION);
    assert_eq!(load_ai_unit_replace_max_fraction(Some(0.25)), 0.25);
    // Brak wpisu -> wartosc domyslna (web: zachowuje 10%).
    assert_eq!(
        load_ai_unit_replace_max_fraction(None),
        AI_UNIT_REPLACE_MAX_FRACTION
    );
    assert_eq!(
        load_ai_unit_replace_max_fraction(Some(f64::NAN)),
        AI_UNIT_REPLACE_MAX_FRACTION
    );
}

#[test]
fn limit_zamiany_dla_pinu_0_1_rowny_10_proc() {
    // Pin 0,1 jest zgodny z domyslna 10% (osobno: test z 0,25 dowodzi, ze dane sa zrodlem).
    let fraction = ai_unit_replace_max_fraction_from_params();
    assert_eq!(ai_unit_replace_cap(100.0, fraction), 10.0);
    // Min. 1 gdy armia niepusta, 0 dla pustej.
    assert_eq!(ai_unit_replace_cap(3.0, fraction), 1.0);
    assert_eq!(ai_unit_replace_cap(0.0, fraction), 0.0);
}

#[test]
fn wartosc_z_danych_rozna_od_domyslnej_steruje_limitem() {
    // Podmiana wartosci w realnym pliku danych (pierwszy wpis `wartosc: 0.1` = klucz zamiany).
    let original = include_str!("../data/ai-params.json");
    let patched = original.replacen("\"wartosc\": 0.1,", "\"wartosc\": 0.25,", 1);
    assert_ne!(patched, original, "podmiana musi zmienic dane");
    let fraction = ai_unit_replace_max_fraction_from_json(&patched);
    assert_eq!(fraction, 0.25);
    assert_ne!(fraction, AI_UNIT_REPLACE_MAX_FRACTION);
    assert_eq!(ai_unit_replace_cap(100.0, fraction), 25.0);
}

#[test]
fn blad_parsowania_daje_wartosc_domyslna() {
    // Sciezka bledu: niepoprawny JSON nie moze cicho dac innej wartosci niz domyslna.
    assert_eq!(
        ai_unit_replace_max_fraction_from_json("{ nie json"),
        AI_UNIT_REPLACE_MAX_FRACTION
    );
    assert_eq!(
        ai_unit_replace_max_fraction_from_json("{}"),
        AI_UNIT_REPLACE_MAX_FRACTION
    );
}
