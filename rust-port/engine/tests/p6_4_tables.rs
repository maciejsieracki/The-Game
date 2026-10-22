//! P6.4 - test KSZTALTU tabeli `data/derived/ruch-jednostek-params.json`: kompletnosc pol, spojnosc
//! (6 roznych sasiadow w odleglosci 1), niepuste teksty i zrodla. NIE pinuje wartosci balansowych
//! (zmiana liczby w tabeli nie wymaga zmiany testu); wartosci sprawdzaja wektory z uruchomionego
//! weba (`p6_4_core.rs::constants_read_from_running_web_match_tables`) oraz `verify-p64-vectors.py`.

use std::collections::BTreeSet;

use civ_engine::data::derived::{parse_ruch_jednostek_params, ruch_jednostek_params};
use civ_engine::domain::pathfinding::ruch_jednostek::hex_distance;

#[test]
fn table_parses_and_every_row_names_its_web_source() {
    let table = parse_ruch_jednostek_params().expect("ruch-jednostek-params.json parse");
    for source in [
        &table.embarkacja.zrodlo_web,
        &table.teren.zrodlo_web,
        &table.trasa.zrodlo_web,
        &table.marsz.zrodlo_web,
        &table.zwiad.zrodlo_web,
        &table.stos.zrodlo_web,
    ] {
        assert!(
            source.contains("gra/") || source.contains(".ts"),
            "zrodlo: {source}"
        );
    }
    assert_eq!(table, *ruch_jednostek_params());
}

#[test]
fn neighbour_table_is_six_distinct_adjacent_offsets() {
    let table = ruch_jednostek_params();
    assert_eq!(table.teren.sasiedzi.len(), 6);
    let unique: BTreeSet<[i32; 2]> = table.teren.sasiedzi.iter().copied().collect();
    assert_eq!(unique.len(), 6, "sasiedzi musza byc rozni");
    for offset in &table.teren.sasiedzi {
        assert_eq!(hex_distance(0, 0, offset[0], offset[1]), 1, "{offset:?}");
    }
}

#[test]
fn numeric_rows_have_sane_shape_without_pinning_values() {
    let table = ruch_jednostek_params();
    let finite_positive = |value: f64| value.is_finite() && value > 0.0;
    assert!(finite_positive(table.embarkacja.mnoznik_obrony));
    assert!(finite_positive(table.embarkacja.koszt_wody));
    assert!(finite_positive(table.embarkacja.min_mnoznik_ruchu));
    assert!(finite_positive(table.teren.koszt_rzeki));
    assert!(finite_positive(table.teren.prog_nieprzejezdny));
    assert!(table.trasa.mnoznik_promienia >= 1 && table.trasa.bufor_promienia >= 0);
    assert!(finite_positive(table.trasa.koszt_celu_nieprzejezdnego));
    assert!(finite_positive(table.marsz.min_budzet_kroku));
    assert!(finite_positive(table.marsz.min_tury_ruchu));
    assert!(table.zwiad.szum_losowania >= 0.0);
    assert!(table.zwiad.tolerancja_remisu >= 0.0);
    assert!(table.zwiad.limit_krokow >= 1);
    assert!(finite_positive(table.zwiad.min_ruch_do_kroku));
    assert!(table.zwiad.punkty_nieodkryty_w_zasiegu >= 0 && table.zwiad.punkty_sasiad_ukryty >= 0);
}

#[test]
fn text_rows_are_nonempty_and_distinct() {
    let table = ruch_jednostek_params();
    let texts = [
        &table.marsz.teksty.brak_ruchu,
        &table.marsz.teksty.brak_trasy,
        &table.marsz.teksty.zablokowany_heks,
        &table.marsz.teksty.obce_miasto,
        &table.marsz.teksty.mgla,
    ];
    let unique: BTreeSet<&&String> = texts.iter().collect();
    assert_eq!(unique.len(), texts.len(), "teksty powodow musza byc rozne");
    for text in texts {
        assert!(!text.is_empty());
    }
    for name in [
        &table.embarkacja.technologia,
        &table.embarkacja.kategoria_okretu,
        &table.teren.ulepszenie_droga,
        &table.teren.ulepszenie_droga_brukowana,
        &table.zwiad.typ_jednostki,
        &table.zwiad.kategoria,
        &table.stos.separator,
        &table.stos.przyrostek_garnizon,
    ] {
        assert!(!name.is_empty());
    }
    assert_ne!(
        table.teren.ulepszenie_droga, table.teren.ulepszenie_droga_brukowana,
        "droga i bruk to rozne ulepszenia"
    );
}
