//! P6.1C - test KSZTALTU tabel `data/derived/start-*.json` (bez pinow wartosci balansowych):
//! parsowanie ze `deny_unknown_fields`, kompletnosc pol, sensownosc typow i zakresow, pochodzenie
//! w webie (`zrodlo_web` niepuste), spojnosc odwolan do innych danych. Zmiana liczby balansu w
//! tabeli nie wymaga zmiany tego testu.

use civ_engine::data::derived::{
    parse_start_braz_access, parse_start_cluster_params, parse_start_llama_params,
    start_braz_access, start_cluster_params, start_llama_params,
};
use civ_engine::domain::start_position::{
    min_city_distance, web_normalize_improvement_key, HumanDistanceMode,
};

#[test]
fn start_tables_parse_with_deny_unknown_fields() {
    parse_start_cluster_params().expect("start-cluster-params.json");
    parse_start_llama_params().expect("start-llama-params.json");
    parse_start_braz_access().expect("start-braz-access.json");
}

#[test]
fn cluster_table_has_sane_shape() {
    let table = start_cluster_params();
    assert!(table.min_dystans_miast_start_miasto_panstwo.wartosc >= 1);
    assert!(
        min_city_distance() >= table.min_dystans_miast_start_miasto_panstwo.wartosc,
        "prog miast-panstw nie moze przekraczac progu zwyklych miast"
    );
    assert!(HumanDistanceMode::parse(&table.drugi_czlowiek_tryb_domyslny.wartosc).is_some());
    let fraction = table.drugi_czlowiek_pula_blisko_daleko_ulamek.wartosc;
    assert!(fraction > 0.0 && fraction <= 1.0, "ulamek puli w (0, 1]");
    assert!(!table.nazwa_miasta_zastepcza.wartosc.is_empty());
    let range = &table.start_relacja.przedzial_zaufania;
    assert!(range.min <= range.max);
    for source in [
        &table.min_dystans_miast_start_miasto_panstwo.zrodlo_web,
        &table.drugi_czlowiek_tryb_domyslny.zrodlo_web,
        &table.drugi_czlowiek_pula_blisko_daleko_ulamek.zrodlo_web,
        &table.nazwa_miasta_zastepcza.zrodlo_web,
        &table.start_relacja.zrodlo_web,
    ] {
        assert!(
            source.contains("gra/"),
            "brak pochodzenia w webie: {source}"
        );
    }
}

#[test]
fn llama_table_has_sane_shape() {
    let table = start_llama_params();
    assert!(table.promien_regionu_startowego.wartosc >= 1);
    assert!(table.zloza_na_start.wartosc >= 1);
    for source in [
        &table.promien_regionu_startowego.zrodlo_web,
        &table.zloza_na_start.zrodlo_web,
    ] {
        assert!(
            source.contains("gra/"),
            "brak pochodzenia w webie: {source}"
        );
    }
}

#[test]
fn braz_table_has_sane_shape_and_consistent_references() {
    let table = start_braz_access();
    assert!(!table.budynek_odlewnia_brazu.wartosc.is_empty());
    assert!(!table.budynki_ulepszenia_odlewni.wartosc.is_empty());
    assert!(!table.klucz_magazynu_brazu.wartosc.is_empty());
    // zrodlo miedzi musi byc ulepszeniem znanym danym terenu (terrain-improvements.json)
    let copper = &table.ulepszenie_zrodlo_miedzi.wartosc;
    assert_eq!(
        web_normalize_improvement_key(copper).as_deref(),
        Some(copper.as_str()),
        "ulepszenie-zrodlo miedzi nieznane w terrain-improvements.json"
    );
    // kazdy alias musi wskazywac istniejace ulepszenie
    for (alias, target) in &table.aliasy_kluczy_ulepszen.wartosc {
        assert!(!alias.is_empty());
        assert_eq!(
            web_normalize_improvement_key(target).as_deref(),
            Some(target.as_str()),
            "alias {alias} wskazuje nieznane ulepszenie {target}"
        );
    }
    for source in [
        &table.budynek_odlewnia_brazu.zrodlo_web,
        &table.budynki_ulepszenia_odlewni.zrodlo_web,
        &table.ulepszenie_zrodlo_miedzi.zrodlo_web,
        &table.klucz_magazynu_brazu.zrodlo_web,
        &table.aliasy_kluczy_ulepszen.zrodlo_web,
    ] {
        assert!(
            source.contains("gra/"),
            "brak pochodzenia w webie: {source}"
        );
    }
}
