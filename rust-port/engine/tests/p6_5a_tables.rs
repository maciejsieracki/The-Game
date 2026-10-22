//! P6.5A - test KSZTALTU tabel `data/derived/unit-cost-tempo.json` i `army-merge-params.json`:
//! kompletnosc pol, spojnosc, niepuste teksty i zrodla. NIE pinuje wartosci balansowych (zmiana liczby
//! w tabeli nie wymaga zmiany testu); wartosci sprawdzaja wektory z uruchomionego weba
//! (`p6_5a_cost.rs`, `p6_5a_stack.rs`, `p6_5a_ruch.rs`) oraz `verify-p65a-vectors.py`.

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    army_merge_params, parse_army_merge_params, parse_unit_cost_tempo, unit_cost_tempo,
};

#[test]
fn tempo_table_parses_and_has_distinct_keys_with_positive_multipliers() {
    let table = parse_unit_cost_tempo().expect("unit-cost-tempo.json parse");
    assert_eq!(table, *unit_cost_tempo());
    assert!(table.zrodlo_web.contains("gra/") && table.zrodlo_web.contains(".ts"));
    assert!(table.min_koszt.is_finite() && table.min_koszt >= 0.0);
    assert!(!table.tempa.is_empty());
    let keys: BTreeSet<&str> = table.tempa.iter().map(|row| row.klucz.as_str()).collect();
    assert_eq!(
        keys.len(),
        table.tempa.len(),
        "klucze tempa musza byc rozne"
    );
    for row in &table.tempa {
        assert!(!row.klucz.is_empty());
        assert!(row.mnoznik.is_finite() && row.mnoznik > 0.0, "{row:?}");
        assert_eq!(table.mnoznik(&row.klucz), Some(row.mnoznik));
    }
    assert_eq!(table.mnoznik("brak-takiego-klucza"), None);
}

#[test]
fn army_params_parse_and_have_sane_shape() {
    let table = parse_army_merge_params().expect("army-merge-params.json parse");
    assert_eq!(table, *army_merge_params());
    for source in [
        &table.id_stosu.zrodlo_web,
        &table.podzial.zrodlo_web,
        &table.stan_stosu.zrodlo_web,
    ] {
        assert!(source.contains("armyMerge.ts"), "zrodlo: {source}");
    }
    assert!(!table.id_stosu.prefiks.is_empty() && !table.id_stosu.separator.is_empty());
    assert!(
        (2..=36).contains(&table.id_stosu.podstawa),
        "podstawa 2..=36 (radix)"
    );
    assert!(table.podzial.min_stos_rozdzielenia >= 1);
    let texts = [
        &table.podzial.etykieta_ten_heks,
        &table.podzial.akcja_rozdziel.id,
        &table.podzial.akcja_rozdziel.etykieta,
        &table.podzial.akcja_polacz.id,
        &table.podzial.akcja_polacz.etykieta,
    ];
    for text in texts {
        assert!(!text.is_empty());
    }
    assert_ne!(
        table.podzial.akcja_rozdziel.id,
        table.podzial.akcja_polacz.id
    );
    assert_ne!(
        table.podzial.akcja_rozdziel.etykieta,
        table.podzial.akcja_polacz.etykieta
    );
}
