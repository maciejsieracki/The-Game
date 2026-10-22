//! Testy KSZTAŁTU, KOMPLETNOŚCI i SPÓJNOŚCI tabeli `counter-multipliers.json`
//! (P3-23 etap 3, grupa WALKA, wiersz 35g: macierz counter).
//!
//! Tabela jest EDYTOWALNYM źródłem prawdy: te testy NIE porównują mnożników z ustalonymi
//! stałymi ani z wartościami weba. Zgodność z webem jest dowodzona poza `cargo test` przez
//! `gen-counter-web.mjs` + `verify-counter-web.py`
//! (dowody w `dyspozycje/autobot/runs/R-RUSTPORT-P3-23-FLATTEN-STAGE3-Q1/`).

use std::collections::BTreeSet;

use civ_engine::data::derived::{counter_multiplier_value, parse_counter_multipliers};
use civ_engine::domain::combat::{counter_multiplier, CounterBonus};

#[test]
fn table_lists_each_type_pair_once_with_finite_positive_multiplier() {
    let file = parse_counter_multipliers().expect("counter-multipliers.json parses");
    let typy: BTreeSet<&str> = file.typy.iter().map(String::as_str).collect();
    assert_eq!(typy.len(), file.typy.len(), "typy bez duplikatów");
    assert_eq!(file.typy.len(), 8, "osiem typów jednostek");

    let expected: BTreeSet<(String, String)> = file
        .typy
        .iter()
        .flat_map(|a| file.typy.iter().map(move |c| (a.clone(), c.clone())))
        .collect();
    let actual: BTreeSet<(String, String)> = file
        .pary
        .iter()
        .map(|p| (p.atakujacy.clone(), p.cel.clone()))
        .collect();
    assert_eq!(file.pary.len(), expected.len(), "każda para raz");
    assert_eq!(actual, expected, "pełna macierz typ × typ");

    for pair in &file.pary {
        assert!(
            pair.mnoznik.is_finite() && pair.mnoznik > 0.0,
            "{} -> {}",
            pair.atakujacy,
            pair.cel
        );
    }
}

#[test]
fn table_type_keys_are_canonical() {
    let file = parse_counter_multipliers().expect("counter-multipliers.json parses");
    for typ in &file.typy {
        assert!(
            !typ.is_empty()
                && typ
                    .chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit()),
            "klucz kanoniczny: {typ}"
        );
    }
}

#[test]
fn table_is_readable_for_every_pair_and_misses_are_none() {
    let file = parse_counter_multipliers().expect("counter-multipliers.json parses");
    for pair in &file.pary {
        assert_eq!(
            counter_multiplier_value(&pair.atakujacy, &pair.cel),
            Some(pair.mnoznik),
            "{} -> {}",
            pair.atakujacy,
            pair.cel
        );
    }
    assert_eq!(counter_multiplier_value("kawalerzysta", "spearman"), None);
}

#[test]
fn domain_reads_table_and_unknown_types_give_no_bonus() {
    let file = parse_counter_multipliers().expect("counter-multipliers.json parses");
    for pair in &file.pary {
        assert_eq!(
            counter_multiplier(&pair.atakujacy, &pair.cel, &[]),
            pair.mnoznik,
            "{} -> {}",
            pair.atakujacy,
            pair.cel
        );
    }
    assert_eq!(counter_multiplier("Nieznany", "Spearman", &[]), 1.0);
}

#[test]
fn explicit_unit_bonus_overrides_table() {
    let bonuses = [CounterBonus::new("Mount", 2.0)];
    assert_eq!(counter_multiplier("Spearman", "Mount", &bonuses), 2.0);
}
