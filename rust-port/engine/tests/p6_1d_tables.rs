//! P6.1D - test KSZTALTU tabel `data/derived/civ-bonus-*.json` (bez pinow wartosci balansowych):
//! zmiana liczby w tabeli nie wymaga zmiany testu, o ile ksztalt i spojnosc referencji sa poprawne.

use std::collections::HashSet;

use civ_engine::data::civilizations::parse_civ_matrix;
use civ_engine::data::derived::{
    civ_bonus_city_names, civ_bonus_diacritics, civ_bonus_matrix_specs, civ_bonus_rules,
};

const KNOWN_STATS: [&str; 6] = [
    "atk",
    "obrona",
    "pancerz",
    "uderzenie",
    "rangedAtk",
    "health",
];

fn matrix_param_ids() -> HashSet<String> {
    parse_civ_matrix()
        .expect("civ-matrix.json parses")
        .param_defs
        .keys()
        .cloned()
        .collect()
}

#[test]
fn matrix_specs_have_consistent_shape_and_known_param_ids() {
    let specs = civ_bonus_matrix_specs();
    let params = matrix_param_ids();
    assert!(!specs.spec_walka.is_empty());
    let mut seen = HashSet::new();
    for row in &specs.spec_walka {
        assert!(seen.insert(row.id.as_str()), "duplikat {}", row.id);
        assert!(params.contains(&row.id), "id spoza macierzy: {}", row.id);
        assert!(!row.typ.is_empty() && !row.cel.is_empty());
    }
    for excluded in &specs.wykluczone_g1 {
        assert!(
            seen.contains(excluded.as_str()),
            "wykluczenie spoza spec: {excluded}"
        );
    }
    for extra in &specs.parametry_dodatkowe {
        assert!(
            params.contains(&extra.id),
            "id spoza macierzy: {}",
            extra.id
        );
        assert!(!extra.cel_domyslne.is_empty());
        for w in &extra.wyjatki_civ {
            assert!(!w.civ_key.is_empty() && !w.cel.is_empty());
        }
    }
    assert!(params.contains(&specs.koszt_rekrutacji.id));
    assert!(!specs.etykiety.opis_prefiks.is_empty());
    assert!(!specs.etykiety.realizuje_walka.is_empty());
    assert!(!specs.etykiety.realizuje_ekonomia.is_empty());
    assert!(!specs.etykiety.typ_walka.is_empty());
}

#[test]
fn rules_have_known_stats_and_param_ids() {
    let rules = civ_bonus_rules();
    let params = matrix_param_ids();
    assert!(!rules.statystyki.is_empty());
    for rule in &rules.statystyki {
        assert!(
            KNOWN_STATS.contains(&rule.stat.as_str()),
            "nieznana statystyka {}",
            rule.stat
        );
        assert!(!rule.prefiks.is_empty());
    }
    for id in rules
        .pomijane
        .id
        .iter()
        .chain(&rules.warunki_kontekstu.terytorium_wlasne_id)
        .chain(&rules.grupy_mnoznikow.ruch)
        .chain(&rules.grupy_mnoznikow.zasieg)
        .chain(&rules.grupy_mnoznikow.oblezenie)
        .chain(&rules.grupy_mnoznikow.mur)
    {
        assert!(params.contains(id), "id spoza macierzy: {id}");
    }
    assert!(!rules.pomijane.prefiksy.is_empty());
    for fragment in [
        &rules.warunki_kontekstu.fragment_mur,
        &rules.warunki_kontekstu.fragment_las,
        &rules.warunki_kontekstu.fragment_plytkie_morze,
        &rules.warunki_kontekstu.fragment_runda_szarzy,
    ] {
        assert!(!fragment.is_empty());
    }
    let cost = &rules.koszt_budynkow;
    assert!(cost.max_znizka > 0.0 && cost.max_znizka <= 1.0);
    assert!(cost.min_koszt >= 0.0);
    assert!(!cost.typ.is_empty() && !cost.cel.is_empty() && !cost.realizuje.is_empty());
}

#[test]
fn city_name_constants_have_consistent_shape() {
    let c = civ_bonus_city_names();
    assert!(c.dlugosc_regularna > 0 && c.dlugosc_panstwa > 0);
    assert!(c.rzymskie.len() >= 3);
    assert!(c.rzymskie[0].is_empty() && c.rzymskie[1].is_empty());
    assert!(c.rzymskie[2..].iter().all(|r| !r.is_empty()));
    assert!(!c.fallback_stolica.is_empty() && !c.fallback_miasto.is_empty());
    assert!(!c.fallback_rywal_prefiks.is_empty());
}

#[test]
fn diacritics_table_maps_single_chars_outside_ascii() {
    let table = civ_bonus_diacritics();
    assert!(!table.mapa.is_empty());
    for (k, v) in &table.mapa {
        assert_eq!(k.chars().count(), 1, "klucz {k:?}");
        assert!(!k.is_ascii(), "klucz ASCII {k:?}");
        assert!(v != k, "wartosc {k:?} -> {v:?}");
        if v.is_empty() {
            // pusta wartosc dozwolona tylko dla samych znakow laczacych (NFD sprowadza je do znaku laczacego, ktory jest usuwany, np. U+0340)
            assert!(
                k.chars().all(|ch| ('\u{0300}'..='\u{036F}').contains(&ch)),
                "pusta wartosc dla {k:?}"
            );
        }
        assert!(
            !v.chars().any(|ch| ('\u{0300}'..='\u{036F}').contains(&ch)),
            "wartosc ze znakiem laczacym {k:?}"
        );
    }
    // znak, ktory NFD nie dekomponuje, nie moze byc w tabeli (zachowanie weba: ł zostaje ł)
    assert!(!table.mapa.contains_key("ł") && !table.mapa.contains_key("Ł"));
}
