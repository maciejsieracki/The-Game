//! Produkcja surowcow ulepszen terytorium: JEDNA wersja regul (R-RUSTPORT-REPIN-RESPROD-DUPLIKAT-Q1).
//! Wartosci z webu (`gra/src/game/terrain-improvements.ts`, origin/main 247f1ef2a; `gra/data/terrain-improvements.json`):
//! baza `surowiec_ilosc_tura` (tartak 50, kamieniolom 50, glinianka 50, warzelnia_soli 50, stadnina 25, kopalnia
//! miedzi/zelaza/cyny 20, kopalnia_zlota 1), mnoznik 1,5 za epoke (era 2 i 3; reszta = epoka 1), Math.round.

use std::collections::BTreeMap;

use civ_engine::domain::improvements::{
    resource_production_amount_for_era, territory_resource_yield_for_improvement,
};

/// Suma plonow terytorium po kluczu surowca (jedna regula: `territory_resource_yield_for_improvement`).
fn stack(keys: &[&str], era: f64) -> BTreeMap<String, f64> {
    let mut totals = BTreeMap::new();
    for key in keys {
        if let Some(row) = territory_resource_yield_for_improvement(Some(*key), None, Some(era)) {
            *totals.entry(row.resource_key).or_insert(0.0) += row.amount;
        }
    }
    totals
}

fn amount(key: &str, era: f64) -> f64 {
    territory_resource_yield_for_improvement(Some(key), None, Some(era))
        .expect("territory producer")
        .amount
}

#[test]
fn lumber_mill_and_quarry_follow_the_50_75_113_era_vector() {
    for (era, expected) in [(1.0, 50.0), (2.0, 75.0), (3.0, 113.0)] {
        assert_eq!(amount("tartak", era), expected, "tartak era {era}");
        assert_eq!(
            amount("kamieniolom", era),
            expected,
            "kamieniolom era {era}"
        );
    }
}

#[test]
fn invalid_or_missing_era_is_safe_and_era_one_is_the_base() {
    for era in [0.0, 4.0, 99.0] {
        assert_eq!(amount("tartak", era), 50.0, "tartak era {era}");
        assert_eq!(amount("kamieniolom", era), 50.0, "kamieniolom era {era}");
        assert_eq!(amount("glinianka", era), 50.0, "glinianka era {era}");
    }

    for (key, base) in [
        ("glinianka", 50.0),
        ("kopalnia_miedzi", 20.0),
        ("kopalnia_zelaza", 20.0),
        ("kopalnia_cyny", 20.0),
        ("warzelnia_soli", 50.0),
        ("stadnina", 25.0),
        ("kopalnia_zlota", 1.0),
    ] {
        assert_eq!(amount(key, 1.0), base, "base for {key}");
    }
}

#[test]
fn every_territory_producer_scales_per_era_on_the_web_vector() {
    for (key, era2, era3) in [
        ("tartak", 75.0, 113.0),
        ("kamieniolom", 75.0, 113.0),
        ("glinianka", 75.0, 113.0),
        ("warzelnia_soli", 75.0, 113.0),
        ("kopalnia_miedzi", 30.0, 45.0),
        ("kopalnia_zelaza", 30.0, 45.0),
        ("kopalnia_cyny", 30.0, 45.0),
        ("stadnina", 38.0, 56.0),
        ("kopalnia_zlota", 2.0, 2.0),
    ] {
        assert_eq!(amount(key, 2.0), era2, "era 2 for {key}");
        assert_eq!(amount(key, 3.0), era3, "era 3 for {key}");
    }
}

#[test]
fn territory_producers_map_to_the_canonical_resource_keys() {
    for (key, resource) in [
        ("tartak", "drewno"),
        ("kamieniolom", "kamien"),
        ("glinianka", "glina"),
        ("kopalnia_miedzi", "ruda"),
        ("kopalnia_zelaza", "ruda_zelaza"),
        ("kopalnia_cyny", "ruda_cyny"),
        ("warzelnia_soli", "sol"),
        ("stadnina", "kon"),
        ("kopalnia_zlota", "zloto"),
    ] {
        let row = territory_resource_yield_for_improvement(Some(key), None, Some(3.0))
            .expect("territory producer");
        assert_eq!(row.resource_key, resource, "resource for {key}");
    }
}

#[test]
fn multiple_layers_stack_additively_per_resource() {
    let totals = stack(&["tartak", "tartak", "kamieniolom", "glinianka"], 3.0);

    assert_eq!(totals.get("drewno").copied(), Some(226.0));
    assert_eq!(totals.get("kamien").copied(), Some(113.0));
    assert_eq!(totals.get("glina").copied(), Some(113.0));
    assert_eq!(totals.get("zloto").copied(), None);
}

#[test]
fn resolver_rejects_non_producers_and_english_legacy_names() {
    assert!(territory_resource_yield_for_improvement(Some("farma"), None, Some(1.0)).is_none());
    assert!(territory_resource_yield_for_improvement(Some("nieznane"), None, Some(1.0)).is_none());
    assert!(territory_resource_yield_for_improvement(None, None, Some(1.0)).is_none());

    // ZALOZENIE (R-RUSTPORT-REPIN-RESPROD-DUPLIKAT-Q1): angielskie nazwy (`lumber_mill`, `quarry`) byly aliasami
    // wylacznie starej migawki Rust; web i kanoniczna normalizacja (`aliasy_legacy`) ich nie znaja -> None.
    assert!(
        territory_resource_yield_for_improvement(Some("lumber_mill"), None, Some(2.0)).is_none()
    );
    assert!(territory_resource_yield_for_improvement(Some("quarry"), None, Some(2.0)).is_none());
    assert_eq!(amount("tartak", 2.0), 75.0);
    assert_eq!(amount("tartak", 1.0), 50.0);
    assert_eq!(amount("kamieniolom", 3.0), 113.0);
}

#[test]
fn era_scaling_rounds_like_the_web_math_round_and_keeps_non_producers_flat() {
    assert_eq!(
        resource_production_amount_for_era("tartak", 5.0, Some(2.0)),
        8.0
    );
    assert_eq!(
        resource_production_amount_for_era("tartak", 5.0, Some(3.0)),
        11.0
    );
    assert_eq!(
        resource_production_amount_for_era("tartak", 1.0e12, Some(3.0)),
        2.25e12
    );
    assert_eq!(
        resource_production_amount_for_era("tartak", 5.0, Some(4.0)),
        5.0
    );
    assert_eq!(
        resource_production_amount_for_era("tartak", 5.0, Some(f64::NAN)),
        5.0
    );
    assert_eq!(
        resource_production_amount_for_era("farma", 5.0, Some(3.0)),
        5.0
    );
}
