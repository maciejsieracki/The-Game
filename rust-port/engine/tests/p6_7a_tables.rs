//! P6.7A - testy KSZTALTU i KOMPLETNOSCI tabel `data/derived/wzrost-ludnosci-params.json`,
//! `data/derived/era-diakrytyki.json` (+ zwiazek z `racje.json` i `cities-params.json`).
//! Bez pinow wartosci balansu: zmiana liczby w tabeli nie wymaga zmiany tego testu, o ile ksztalt
//! pozostaje poprawny (zgodnosc wartosci z webem sprawdzaja wektory `p6_7a_*`).

use civ_engine::data::derived::{
    cities_params, era_diakrytyki_map, parse_era_diakrytyki, parse_racje,
    parse_wzrost_ludnosci_params, wzrost_ludnosci_params,
};
use civ_engine::domain::city_growth::p6_7a::growth_v85::{
    default_poziom_racji, wyzywienie_levels, wyzywienie_max, wyzywienie_min, wyzywienie_step,
};

fn on_grid(x: f64) -> bool {
    wyzywienie_levels().contains(&x)
}

#[test]
fn params_file_parses_and_has_no_unknown_fields() {
    let parsed = parse_wzrost_ludnosci_params().expect("parse");
    assert_eq!(&parsed, wzrost_ludnosci_params());
    assert!(parsed.meta["pin_web"].is_string());
    assert!(parsed.meta["zrodlo_web"]
        .as_array()
        .is_some_and(|a| !a.is_empty()));
}

#[test]
fn ration_scale_is_a_well_formed_grid() {
    let (min, max, step) = (wyzywienie_min(), wyzywienie_max(), wyzywienie_step());
    assert!(min.is_finite() && max.is_finite() && step.is_finite());
    assert!(step > 0.0 && min < max);
    let levels = wyzywienie_levels();
    assert!(levels.len() >= 2);
    assert!(levels.windows(2).all(|w| w[0] < w[1]), "poziomy rosnace");
    assert_eq!(levels.first().copied(), Some(min));
    assert!(
        on_grid(default_poziom_racji()),
        "domyslny poziom racji lezy na siatce"
    );
}

#[test]
fn growth_table_covers_every_level_exactly_once() {
    let rows = &wzrost_ludnosci_params().wyzywienie.wzrost_proc;
    let levels = wyzywienie_levels();
    assert_eq!(rows.len(), levels.len(), "jeden wiersz na poziom");
    for l in &levels {
        assert_eq!(
            rows.iter().filter(|r| r.poziom == *l).count(),
            1,
            "poziom {l} musi miec dokladnie jeden wiersz"
        );
    }
    assert!(rows.iter().all(|r| r.proc.is_finite()));
}

#[test]
fn food_cost_table_covers_every_level() {
    // koszt zywnosci na mieszkanca bierze sie z `racje.json` (P3-19): kompletnosc wzgledem siatki
    let racje = parse_racje().expect("racje.json");
    for l in wyzywienie_levels() {
        assert_eq!(
            racje.wiersze.iter().filter(|r| r.poziom_racji == l).count(),
            1,
            "racje.json: poziom {l}"
        );
    }
    assert_eq!(racje.wiersze.len(), wyzywienie_levels().len());
}

#[test]
fn single_source_for_default_level_and_scale_max() {
    let c = &cities_params().wejscia_z_innych_modulow_weba;
    assert_eq!(default_poziom_racji(), c.domyslny_poziom_racji);
    assert_eq!(wyzywienie_max(), c.wyzywienie_max);
}

#[test]
fn numeric_inputs_are_finite_and_structurally_valid() {
    let p = wzrost_ludnosci_params();
    for x in [
        p.skladniki_wzrostu.male_miasto_prog,
        p.skladniki_wzrostu.zdrowie_na_punkt,
        p.skladniki_wzrostu.szczescie_na_punkt,
        p.skladniki_wzrostu.cywilizacja_skala,
        p.trudnosc_mnoznik_macierzy.easy,
        p.trudnosc_mnoznik_macierzy.normal,
        p.trudnosc_mnoznik_macierzy.hard,
        p.limit_populacji.twardy_max,
        p.spichlerz.wzrost_proc_tier_i,
        p.spichlerz.wzrost_proc_tier_ii,
        p.spichlerz.wzrost_proc_brak,
        p.spichlerz.mnoznik_kosztu_racji_tier_i,
        p.spichlerz.mnoznik_kosztu_racji_tier_ii,
        p.spichlerz.mnoznik_kosztu_racji_brak,
        p.spichlerz.cap_imperium_tier_i,
        p.spichlerz.cap_imperium_tier_ii,
        p.magazyn_era.podstawa,
        p.magazyn_era.epoka_min,
        p.empire_food_domyslne.centralny_cap_baza,
        p.empire_food_domyslne.centralny_cap_bonus_magazyn,
        p.empire_food_domyslne.glod_hp_frac,
        p.empire_food_domyslne.glod_karencja_tur,
        p.empire_food_domyslne.glod_stat_mult,
        p.tempo_wzrostu.wysoki,
        p.tempo_wzrostu.normalny,
        p.tempo_wzrostu.wolny,
        p.tempo_wzrostu.prog_min,
        p.r_stawki.koszt_mult,
        p.r_stawki.fala2_mult,
        p.r_stawki.min_wartosc,
    ] {
        assert!(x.is_finite(), "wartosc nieskonczona/NaN w tabeli");
    }
    for x in p
        .racje_domyslne_deprecated
        .zywnosc
        .iter()
        .chain(&p.racje_domyslne_deprecated.wzrost_proc)
    {
        assert!(x.is_finite());
    }
    assert!(
        p.tempo_wzrostu.wysoki > 0.0
            && p.tempo_wzrostu.normalny > 0.0
            && p.tempo_wzrostu.wolny > 0.0
    );
    assert!(p.r_stawki.koszt_mult > 0.0 && p.r_stawki.fala2_mult > 0.0);
    assert!(p.magazyn_era.podstawa > 1.0 && p.magazyn_era.epoka_min >= 1.0);
    assert!(!p.limit_populacji.dozwolone_delta.is_empty());
    assert!(p
        .limit_populacji
        .dozwolone_delta
        .iter()
        .all(|d| d.is_finite()));
}

#[test]
fn spichlerz_ids_are_distinct_and_non_empty() {
    let s = &wzrost_ludnosci_params().spichlerz;
    let ids = [&s.id_i, &s.id_ii, &s.id_akwedukt, &s.id_magazyn];
    assert!(ids.iter().all(|i| !i.is_empty()));
    for (a, ia) in ids.iter().enumerate() {
        for ib in ids.iter().skip(a + 1) {
            assert_ne!(ia, ib);
        }
    }
}

#[test]
fn legacy_ration_migration_targets_lie_on_the_grid() {
    let rows = &wzrost_ludnosci_params().migracja_racji_legacy.wiersze;
    assert!(!rows.is_empty());
    for r in rows {
        assert!(
            r.stary.is_finite() && r.stary.fract() == 0.0,
            "stary baton jest calkowity"
        );
        assert!(on_grid(r.nowy), "cel migracji {} lezy na siatce", r.nowy);
    }
    let mut olds: Vec<f64> = rows.iter().map(|r| r.stary).collect();
    olds.sort_by(f64::total_cmp);
    olds.dedup();
    assert_eq!(olds.len(), rows.len(), "stare poziomy unikalne");
}

#[test]
fn research_era_aliases_are_consistent() {
    let e = &wzrost_ludnosci_params().epoki_badan;
    let kanony: Vec<&String> = e.aliasy.iter().map(|a| &a.kanon).collect();
    assert!(
        kanony.contains(&&e.domyslna),
        "epoka domyslna jest kanoniczna"
    );
    for a in &e.aliasy {
        assert!(
            a.warianty.contains(&a.kanon),
            "wariant kanoniczny na liscie wariantow"
        );
    }
    for x in &e.fala2_extra {
        assert!(kanony.contains(&x), "fala2_extra {x} jest kanoniczna");
    }
}

#[test]
fn diacritics_table_is_well_formed() {
    let file = parse_era_diakrytyki().expect("era-diakrytyki.json");
    assert!(!file.wiersze.is_empty());
    assert!(
        file.wiersze.windows(2).all(|w| w[0].0 < w[1].0),
        "klucze rosnace i unikalne"
    );
    for (cp, rep) in &file.wiersze {
        let ch = char::from_u32(*cp).unwrap_or_else(|| panic!("U+{cp:04X} nie jest znakiem"));
        assert!(
            !(0xAC00..=0xD7A3).contains(cp),
            "sylaby Hangul sa rozkladane algorytmicznie, nie tabela"
        );
        assert!(
            rep.chars().all(|c| !('\u{300}'..='\u{36f}').contains(&c)),
            "U+{cp:04X}: wynik nie moze zawierac znakow laczacych 0300-036F"
        );
        assert_ne!(rep, &ch.to_string(), "wiersz musi cos zmieniac");
    }
    assert_eq!(era_diakrytyki_map().len(), file.wiersze.len());
}
