//! P6.2 / P6.3 - test KSZTALTU tabel `data/derived/{porzadek-params,ulepszenia-reguly,
//! teren-ruch-reguly}.json`: kompletnosc, unikalnosc identyfikatorow, brak wartosci
//! niedozwolonych. Test NIE pinuje wartosci balansowych (zmiana liczby w tabeli nie wymaga
//! zmiany testu).

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    parse_porzadek_params, parse_teren_ruch_reguly, parse_ulepszenia_reguly, porzadek_param,
};
use civ_engine::domain::improvements::improvement_keys;

/// Identyfikatory wierszy czytane przez kod (`domain/types.rs::porzadek`).
const REQUIRED_PORZADEK_IDS: [&str; 14] = [
    "waga_szczescie",
    "waga_prawo",
    "prog_t1",
    "prog_t2",
    "kara_produkcja_t1",
    "kara_pieniadz_t1",
    "kara_nauka_t1",
    "kara_kultura_t1",
    "kara_wzrost_t1",
    "ryzyko_buntu_t1",
    "bonus_produkcja_t2",
    "bonus_handel_t2",
    "por_pct_cap",
    "szczescie_skala_max",
];

#[test]
fn porzadek_params_table_is_complete_and_finite() {
    let table = parse_porzadek_params().expect("porzadek-params.json parse");
    let ids: Vec<&str> = table.wiersze.iter().map(|row| row.id.as_str()).collect();
    let unique: BTreeSet<&str> = ids.iter().copied().collect();
    assert_eq!(ids.len(), unique.len(), "identyfikatory musza byc unikalne");
    for id in REQUIRED_PORZADEK_IDS {
        assert!(unique.contains(id), "brak wiersza {id}");
        assert!(
            porzadek_param(id).is_finite(),
            "{id} musi byc skonczona liczba"
        );
    }
    assert_eq!(
        unique.len(),
        REQUIRED_PORZADEK_IDS.len(),
        "tabela nie ma wierszy nieuzywanych"
    );
    for row in &table.wiersze {
        assert!(
            row.definicja_web.contains("order.ts"),
            "{} bez zrodla weba",
            row.id
        );
        assert!(!row.opis.is_empty());
    }
    // kierunek znaku wynika z modelu (kara <= 0, bonus >= 0, wagi i ryzyko w [0,1]); nie z wartosci
    for id in [
        "kara_produkcja_t1",
        "kara_pieniadz_t1",
        "kara_nauka_t1",
        "kara_kultura_t1",
        "kara_wzrost_t1",
    ] {
        assert!(
            porzadek_param(id) <= 0.0,
            "{id} musi byc ulamkiem niedodatnim"
        );
    }
    assert!(porzadek_param("bonus_produkcja_t2") >= 0.0);
    assert!(porzadek_param("bonus_handel_t2") >= 0.0);
    assert!((0.0..=1.0).contains(&porzadek_param("ryzyko_buntu_t1")));
    assert!(porzadek_param("szczescie_skala_max") > 0.0);
}

#[test]
fn ulepszenia_reguly_table_references_existing_improvements_only() {
    let rules = parse_ulepszenia_reguly().expect("ulepszenia-reguly.json parse");
    let keys: BTreeSet<String> = improvement_keys().into_iter().collect();
    let mut referenced: Vec<&String> = Vec::new();
    referenced.extend(rules.produkcja_epoka.ulepszenia_skalowane.iter());
    referenced.extend(
        rules
            .terytorium
            .ulepszenia
            .iter()
            .map(|row| &row.ulepszenie),
    );
    referenced.extend(rules.ruda.kopalnie.iter().map(|row| &row.ulepszenie));
    referenced.extend(rules.zywnosc.ulepszenia.iter());
    referenced.extend(rules.drogi.ulepszenia.iter());
    referenced.extend(
        rules
            .ukrywanie_zloza
            .wiersze
            .iter()
            .map(|row| &row.ulepszenie),
    );
    referenced.extend(
        rules
            .zloze_zwierzece
            .wiersze
            .iter()
            .map(|row| &row.ulepszenie),
    );
    referenced.push(&rules.zywnosc.ulepszenie_farmy);
    referenced.push(&rules.migracja_kopalni.zloze_zelazo.ulepszenie);
    referenced.push(&rules.migracja_kopalni.ulepszenie_miedzi);
    for alias in &rules.aliasy_legacy.aliasy {
        referenced.push(&alias.nowy);
        assert!(
            !keys.contains(&alias.stary),
            "alias {} nie moze byc kluczem katalogu",
            alias.stary
        );
    }
    for key in referenced {
        assert!(
            keys.contains(key),
            "tabela regul wskazuje nieznane ulepszenie {key}"
        );
    }
    let unique_territory: BTreeSet<&String> = rules
        .terytorium
        .ulepszenia
        .iter()
        .map(|row| &row.ulepszenie)
        .collect();
    assert_eq!(unique_territory.len(), rules.terytorium.ulepszenia.len());
    assert!(rules.skala_pracy.fala2_mnoznik > 0.0);
    assert!(rules.skala_pracy.podstawa_podwajania >= 1.0);
    assert!(rules.produkcja_epoka.epoka_min <= rules.produkcja_epoka.epoka_max);
    assert!(rules.produkcja_epoka.mnoznik_za_epoke > 0.0);
    assert!(rules.terytorium.domyslna_ilosc > 0.0);
    assert!(rules.ruda.na_kopalnie >= 0.0);
    assert!(rules.zywnosc.kara_las <= 0.0);
    for key in rules.skala_pracy.mnozniki_epoki.keys() {
        assert!(*key >= 1);
    }
    assert!(rules
        .skala_pracy
        .mnozniki_epoki
        .contains_key(&(rules.skala_pracy.epoka_domyslna as i64)));
    assert!(rules.meta["pin_web"].as_str().is_some());
}

#[test]
fn teren_ruch_reguly_table_has_nonempty_lists() {
    let rules = parse_teren_ruch_reguly().expect("teren-ruch-reguly.json parse");
    assert!(!rules.miasto_obce.budynki_obronne.is_empty());
    let unique: BTreeSet<&String> = rules.miasto_obce.budynki_obronne.iter().collect();
    assert_eq!(unique.len(), rules.miasto_obce.budynki_obronne.len());
    assert!(rules.fort.ewakuacja_maks_pierscien >= 1);
    assert_ne!(rules.fort.ulepszenie_fort, rules.fort.ulepszenie_posterunek);
}
