//! P6.M02 - test KSZTALTU tabeli `data/derived/mapgen-nowa-gra.json` (bez pinow wartosci balansowych):
//! parsowanie ze `deny_unknown_fields`, kompletnosc, spojnosc odwolan i zakresow, pochodzenie w
//! webie (`zrodlo_web`). Zmiana liczby balansu w tabeli nie wymaga zmiany tego testu.

use civ_engine::data::derived::{mapgen_nowa_gra, parse_mapgen_nowa_gra};
use civ_engine::domain::mapgen::params::{MapSizeLabel, RozmiarSwiata};

#[test]
fn table_parses_with_deny_unknown_fields() {
    parse_mapgen_nowa_gra().expect("mapgen-nowa-gra.json");
}

#[test]
fn every_section_names_its_web_source() {
    let t = mapgen_nowa_gra();
    for (name, source) in [
        ("rozmiary", &t.rozmiary.zrodlo_web),
        ("etykieta_mapy", &t.etykieta_mapy.zrodlo_web),
        ("typ_swiata", &t.typ_swiata.zrodlo_web),
        ("jakosc", &t.jakosc.zrodlo_web),
        ("gestosc", &t.gestosc.zrodlo_web),
        ("rzeki", &t.rzeki.zrodlo_web),
        ("progi_szumu", &t.progi_szumu.zrodlo_web),
        ("udzial_ladu", &t.udzial_ladu.zrodlo_web),
        ("miasta_panstwa", &t.miasta_panstwa.zrodlo_web),
        ("typy_cywilizacji", &t.typy_cywilizacji.zrodlo_web),
        ("rywale_menu", &t.rywale_menu.zrodlo_web),
        ("zloza_epoka", &t.zloza_epoka.zrodlo_web),
        ("rzeki_przelacznik", &t.rzeki_przelacznik.zrodlo_web),
    ] {
        assert!(
            source.contains("gra/src/map/"),
            "{name}: brak pochodzenia: {source}"
        );
    }
    assert!(!t.meta.pin_web.is_empty());
}

#[test]
fn size_tables_are_consistent() {
    let t = mapgen_nowa_gra();
    let order = &t.rozmiary.kolejnosc;
    assert!(!order.is_empty());
    for key in order {
        assert!(
            RozmiarSwiata::from_key(key).is_some(),
            "nieznany rozmiar {key}"
        );
    }
    let mut unique = order.clone();
    unique.sort();
    unique.dedup();
    assert_eq!(unique.len(), order.len(), "rozmiary musza byc unikalne");
    assert!(order.contains(&t.rozmiary.domyslny));
    assert_eq!(t.rozmiary.etykiety_menu.len(), order.len());
    for rule in &t.rozmiary.rozpoznawanie {
        assert!(
            order.contains(&rule.rozmiar),
            "regula wskazuje nieznany rozmiar"
        );
        assert!(!rule.prefiksy.is_empty() || !rule.rowne.is_empty());
    }
    // sciezka wyboru wymiarow: kazdy rozmiar ma wymiary > 0 w danych Panel-A
    for key in order {
        let size = RozmiarSwiata::from_key(key).expect("rozmiar");
        let [w, h] = civ_engine::domain::mapgen::params::rozmiar_dims(size);
        assert!(w > 0 && h > 0, "wymiary {key}");
    }
}

#[test]
fn map_label_thresholds_are_ascending_and_known() {
    let t = &mapgen_nowa_gra().etykieta_mapy;
    let mut previous = f64::MIN;
    for step in &t.progi_pola {
        assert!(step.ponizej > previous, "progi musza rosnac");
        previous = step.ponizej;
        assert!(MapSizeLabel::from_key(&step.etykieta).is_some());
    }
    assert!(MapSizeLabel::from_key(&t.w_przeciwnym_razie).is_some());
}

#[test]
fn per_size_menus_cover_every_size() {
    let t = mapgen_nowa_gra();
    let sizes = t.rozmiary.kolejnosc.len();
    assert_eq!(t.miasta_panstwa.menu_wg_rozmiaru.len(), sizes);
    for row in &t.miasta_panstwa.menu_wg_rozmiaru {
        assert!(row.min >= t.miasta_panstwa.dolna_granica);
        assert!(row.min <= row.default && row.default <= row.max);
        assert!(row.max <= t.miasta_panstwa.sufit);
    }
    let fallback = &t.typy_cywilizacji.domyslne_wg_rozmiaru_fallback;
    for row in [&fallback.kamien, &fallback.braz, &fallback.zelazo] {
        assert_eq!(row.len(), sizes);
        assert!(row.iter().all(|n| *n >= 1));
    }
    let pool = &t.typy_cywilizacji.pula_wg_epoki;
    for n in [pool.kamien, pool.braz, pool.zelazo] {
        assert!(n >= 1 && n <= t.typy_cywilizacji.sufit_menu);
    }
}

#[test]
fn river_rules_have_sane_ranges() {
    let r = &mapgen_nowa_gra().rzeki;
    for tier in [
        &r.min_dlugosc_tier,
        &r.komorka_siatki_tier,
        &r.limit_akceptacji_tier,
    ] {
        assert!(tier.low >= 1 && tier.medium >= 1 && tier.high >= 1);
    }
    for clamp in [
        &r.twarde_meandry,
        &r.ogon_ujscia,
        &r.promien_rozszerzenia_zrodla,
        &r.szukanie_reliefu.max,
    ] {
        assert!(clamp.baza > 0.0);
        assert!(clamp.min <= clamp.max);
    }
    for rule in [
        &r.przebiegi_doplywow.duza,
        &r.przebiegi_doplywow.mala,
        &r.przebiegi_dopelnienia.duza,
        &r.przebiegi_dopelnienia.mala,
    ] {
        assert!(rule.min <= rule.max);
    }
    assert!(r.powierzchnia_referencyjna.szerokosc > 0.0);
    assert!(r.powierzchnia_referencyjna.wysokosc > 0.0);
    assert!(r.duza_mapa_prog_skali > 0.0);
    assert!(r.min_w_glab_ladu.gdy_duza >= r.min_w_glab_ladu.gdy_mala);
    assert!(r.limity_trasy_legacy.min_len_duza >= r.limity_trasy_legacy.min_len_mala);
}

#[test]
fn land_and_toggle_tables_are_consistent() {
    let t = mapgen_nowa_gra();
    let land = &t.udzial_ladu;
    assert!(!land.opcje_procent.is_empty());
    assert!(land.min > 0.0 && land.min < land.max && land.max < 1.0);
    for f in [
        t.typ_swiata.udzial_ladu.pangea,
        t.typ_swiata.udzial_ladu.kontynenty,
        t.typ_swiata.udzial_ladu.wyspy,
        t.typ_swiata.udzial_ladu.ziemia,
    ] {
        assert!(f > 0.0 && f < 1.0, "udzial ladu poza (0, 1)");
    }
    let s = &t.rzeki_przelacznik;
    assert!(s.fazy.contains(&s.faza_domyslna));
    assert!(s.fazy.contains(&s.faza_tylko_glowne));
    assert!(s.fazy.contains(&s.faza_pelna));
    for on in &s.tokeny_wlaczone {
        assert!(!s.tokeny_wylaczone.contains(on), "token {on} w obu listach");
    }
    assert!(!t.gestosc.etykiety_menu.is_empty());
    for hint in [
        &t.rywale_menu.podpowiedzi.domyslna,
        &t.miasta_panstwa.podpowiedzi.domyslna,
        &t.typy_cywilizacji.podpowiedzi.domyslna,
    ] {
        assert!(!hint.is_empty());
    }
}
