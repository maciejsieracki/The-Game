//! P6.6B - testy KSZTALTU edytowalnych tabel `data/derived/{cities-params,display-names-params}.json`
//! i ich zrodel danych. Brak pinow wartosci balansu: sprawdzana jest poprawnosc struktury, kompletnosc
//! kluczy, spojnosc wewnetrzna i zgodnosc z innymi danymi silnika (zmiana liczby balansu nie lamie testu,
//! o ile ksztalt zostaje poprawny).

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    cities_params, display_names_params, parse_cities_params, parse_display_names_params,
    parse_racje,
};
use civ_engine::data::economy_society::parse_miasto_params;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    budowa_typ_focus, default_budowa_focus, default_budowa_priorytet_typow, default_budowa_tryb,
    default_okolica_focus, default_okolica_tryb, default_podzial_handlu, default_podzial_pracy,
    default_ulepszenia_focus, default_ulepszenia_tryb, fresh_ulepszenia_empire_policy,
    max_procent_puli_imperium, min_city_distance, min_podzial_pracy_budynki_percent, BudowaFocus,
    BudowaTryb, OkolicaFocus, OkolicaTryb, UlepszeniaFocus, UlepszeniaTryb,
};
use civ_engine::domain::terrain::city_founding::p6_6b::empire_city_defaults::ai_default_budowa_tryb;

fn meta_has_source(meta: &serde_json::Value) {
    assert!(
        meta["zrodlo_web"]
            .as_str()
            .is_some_and(|s| s.contains(".ts")),
        "meta.zrodlo_web musi wskazywac plik weba"
    );
}

fn is_unique<T: Ord>(items: impl IntoIterator<Item = T>) -> bool {
    let v: Vec<T> = items.into_iter().collect();
    let set: BTreeSet<&T> = v.iter().collect();
    set.len() == v.len()
}

#[test]
fn cities_table_is_well_formed() {
    let c = parse_cities_params().expect("parse");
    assert_eq!(&c, cities_params());
    meta_has_source(&c.meta);
    let total = c.procent_calosc;
    assert!(total.is_finite() && total > 0.0);

    let p = &c.podzial_pracy;
    for v in [
        p.domyslnie_budynki,
        p.min_budynki,
        p.max_budynki,
        p.ai_stale_budynki,
        p.min_pula_zasada3_nadwyzka,
    ] {
        assert!(
            v.is_finite() && (0.0..=total).contains(&v),
            "podzial pracy: {v}"
        );
    }
    assert!(p.min_budynki <= p.domyslnie_budynki && p.domyslnie_budynki <= p.max_budynki);
    assert!(p.min_budynki <= p.ai_stale_budynki && p.ai_stale_budynki <= p.max_budynki);
    assert!(p.min_pula_zasada3_nadwyzka <= total - p.min_budynki);

    let h = &c.podzial_handlu;
    assert!(
        h.krok > 0.0 && (total / h.krok).fract() == 0.0,
        "krok dzieli calosc"
    );
    let d = &h.domyslnie;
    let sum = d.procent_nauka + d.procent_pieniadz + d.procent_luksus;
    assert_eq!(
        sum.to_bits(),
        total.to_bits(),
        "domyslny podzial sumuje sie do calosci"
    );
    for v in [d.procent_nauka, d.procent_pieniadz, d.procent_luksus] {
        assert!(v >= 0.0 && (v / h.krok).fract() == 0.0, "krok suwaka: {v}");
    }
    assert!(h.max_nauka >= d.procent_nauka && h.max_nauka <= total);

    let u = &c.ulepszenia;
    assert!(UlepszeniaFocus::from_web(&u.domyslny_focus).is_some());
    assert!(UlepszeniaTryb::from_web(&u.domyslny_tryb).is_some());
    for v in [u.domyslna_praca_procent, u.ai_major_praca_procent] {
        assert!((0.0..=u.max_auto_praca_procent).contains(&v));
    }
    assert!(u.max_auto_praca_procent <= total);
    assert!(!u.migracja_per_turn.is_empty());
    assert!(is_unique(
        u.migracja_per_turn.iter().map(|r| r.per_turn.to_bits())
    ));
    let mut rows = u.migracja_per_turn.clone();
    rows.sort_by(|a, b| a.per_turn.total_cmp(&b.per_turn));
    for w in rows.windows(2) {
        assert!(w[0].procent <= w[1].procent, "migracja rosnaca");
    }
    for r in &rows {
        assert!(r.per_turn.fract() == 0.0 && r.per_turn >= 1.0);
        assert!((0.0..=u.max_auto_praca_procent).contains(&r.procent));
    }

    let b = &c.budowa;
    let focus = |s: &String| BudowaFocus::from_web(s).unwrap_or_else(|| panic!("focus {s}"));
    assert!(BudowaTryb::from_web(&b.domyslny_tryb).is_some());
    assert!(BudowaTryb::from_web(&b.domyslny_tryb_ai).is_some());
    assert!(BudowaTryb::from_web(&b.domyslny_tryb_nowe_miasto).is_some());
    let bez_typu = focus(&b.focus_bez_typu);
    focus(&b.domyslny_focus);
    for list in [&b.domyslny_priorytet_typow, &b.typy_focus] {
        assert!(!list.is_empty());
        assert!(is_unique(list.iter().map(|s| s.as_str())));
        assert!(list.iter().all(|s| focus(s) != bez_typu));
    }
    assert!(!b.lista_slot_legacy.is_empty() && is_unique(b.lista_slot_legacy.iter()));
    assert!(!b.lista_domyslna_nazwa_prefiks.is_empty());
    assert!(!b.lista_szablon_id_prefiks.is_empty());
    assert!(!b.lista_nazwa_legacy_prefiks.is_empty());
    assert!(b.lista_limit_nazw >= 2.0 && b.lista_limit_nazw.fract() == 0.0);

    assert!(OkolicaFocus::from_web(&c.okolica.domyslny_focus).is_some());
    assert!(OkolicaTryb::from_web(&c.okolica.domyslny_tryb).is_some());

    let w = &c.wejscia_z_innych_modulow_weba;
    assert!(w.zrodlo.contains(".ts"));
    assert!(w.wyzywienie_max > 0.0 && (0.0..=w.wyzywienie_max).contains(&w.domyslny_poziom_racji));
    assert!(w.swiezy_wealth_poziom >= 0.0 && w.swiezy_wealth_pula >= 0.0);
    assert!(c.wyzywienie.domyslny_procent_rozwoj.is_finite());

    let f = &c.zakladanie;
    assert!(f.min_dystans_miasto_panstwo >= 1.0);
    assert!(f.limit_miast_baza_zapas > 0.0 && f.limit_miast_krok_epoka >= 0.0);
    assert!(f.min_epoka >= 0.0 && f.startowa_populacja >= 1.0 && f.wealth_immunitet_tur >= 0.0);
    assert!(!f.id_prefiks.is_empty());
    let reasons = [
        &f.powody.poza_mapa,
        &f.powody.morze,
        &f.powody.gory,
        &f.powody.za_blisko,
        &f.powody.poza_terytorium,
        &f.powody.limit_epoka,
        &f.powody.found_city_at_null,
    ];
    assert!(reasons.iter().all(|r| !r.is_empty()));
    assert!(
        is_unique(reasons.iter().map(|r| r.as_str())),
        "powody musza byc rozne"
    );

    assert!(!c.nazwy_miast.lista.is_empty());
    assert!(c
        .nazwy_miast
        .lista
        .iter()
        .all(|n| !n.is_empty() && n == n.trim()));
    assert!(is_unique(c.nazwy_miast.lista.iter()));
    assert!(!c.nazwy_miast.prefiks_generyczny.is_empty());
    let l = &c.etykiety_podzialu_pracy;
    assert!(!l.pula.is_empty() && !l.pula_pelna.is_empty() && !l.pula_tip.is_empty());
    assert_ne!(l.pula, l.pula_pelna);
}

#[test]
fn cities_defaults_are_consistent_with_each_other() {
    // spojnosc wartosci wyliczanych z tabeli (bez pinowania liczb)
    let p = default_podzial_pracy();
    assert!(p.procent_budynki >= min_podzial_pracy_budynki_percent());
    assert!(max_procent_puli_imperium() >= 0.0);
    let h = default_podzial_handlu();
    assert_eq!(
        (h.procent_nauka + h.procent_pieniadz + h.procent_luksus).to_bits(),
        cities_params().procent_calosc.to_bits()
    );
    let pol = fresh_ulepszenia_empire_policy();
    assert_eq!(pol.focus, default_ulepszenia_focus());
    assert_eq!(pol.tryb, default_ulepszenia_tryb());
    assert_eq!(
        default_okolica_focus().web_value(),
        cities_params().okolica.domyslny_focus
    );
    assert_eq!(
        default_okolica_tryb().web_value(),
        cities_params().okolica.domyslny_tryb
    );
    assert_eq!(
        default_budowa_focus().web_value(),
        cities_params().budowa.domyslny_focus
    );
    assert_eq!(
        default_budowa_tryb().web_value(),
        cities_params().budowa.domyslny_tryb
    );
    assert!(!default_budowa_priorytet_typow().is_empty());
    assert!(!budowa_typ_focus().is_empty());
    assert_ne!(ai_default_budowa_tryb(), BudowaTryb::Auto);
}

#[test]
fn cities_foreign_inputs_agree_with_engine_data() {
    // Kopie stalych z population-growth-v85.ts musza byc spojne z tabela racji silnika (racje.json).
    let racje = parse_racje().expect("racje.json");
    let levels: Vec<f64> = racje.wiersze.iter().map(|r| r.poziom_racji).collect();
    let w = &cities_params().wejscia_z_innych_modulow_weba;
    assert!(
        levels.contains(&w.domyslny_poziom_racji),
        "domyslny poziom racji w tabeli racji"
    );
    let max = levels.iter().copied().fold(f64::NEG_INFINITY, f64::max);
    assert_eq!(
        max.to_bits(),
        w.wyzywienie_max.to_bits(),
        "wyzywienie_max = najwyzszy poziom racji"
    );
}

#[test]
fn min_city_distance_comes_from_miasto_params() {
    let m = parse_miasto_params().expect("miasto-params");
    assert_eq!(
        min_city_distance().to_bits(),
        (m.min_dystans_miast.wartosc as f64).to_bits()
    );
    assert!(min_city_distance() >= cities_params().zakladanie.min_dystans_miasto_panstwo);
}

#[test]
fn display_names_table_is_well_formed() {
    let t = parse_display_names_params().expect("parse");
    assert_eq!(&t, display_names_params());
    meta_has_source(&t.meta);
    assert!(!t.etykieta_miasto_panstwo.is_empty());
    assert!(!t.separator.is_empty());
    assert!(!t.wzorce_techniczne.is_empty());
    assert!(is_unique(
        t.wzorce_techniczne.iter().map(|p| p.prefiks.as_str())
    ));
    for p in &t.wzorce_techniczne {
        assert!(!p.prefiks.is_empty());
        if p.ignoruj_wielkosc {
            assert!(
                p.prefiks.is_ascii(),
                "ignoruj_wielkosc dziala dla ASCII: {}",
                p.prefiks
            );
        }
    }
}
