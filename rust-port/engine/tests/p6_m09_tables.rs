//! P6.M09 - testy KSZTALTU tabeli `data/derived/mapgen-cluster-rivals.json` (bez pinow wartosci:
//! zmiana liczby balansu nie wymaga zmiany tych testow; zgodnosc z webem pilnuja wektory w
//! `p6_m09_rivals.rs`).

use civ_engine::data::derived::{
    mapgen_cluster_rivals, parse_mapgen_cluster_rivals, MAPGEN_CLUSTER_RIVALS_JSON,
};

#[test]
fn table_parses_with_deny_unknown_fields() {
    let parsed = parse_mapgen_cluster_rivals().expect("tabela musi sie sparsowac");
    assert_eq!(&parsed, mapgen_cluster_rivals());
    // Nieznane pole na kazdym poziomie jest odrzucane (literowka w tabeli nie przechodzi cicho).
    let mut v: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_RIVALS_JSON).unwrap();
    v["pakowanie"]["nieznane_pole"] = serde_json::json!(1);
    assert!(
        serde_json::from_value::<civ_engine::data::derived::MapgenClusterRivalsFile>(v).is_err()
    );
    let mut w: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_RIVALS_JSON).unwrap();
    w["nieznane_pole"] = serde_json::json!(1);
    assert!(
        serde_json::from_value::<civ_engine::data::derived::MapgenClusterRivalsFile>(w).is_err()
    );
}

#[test]
fn every_value_has_web_source_and_sane_shape() {
    let t = mapgen_cluster_rivals();
    let sources = [
        &t.promien_miasta_panstwa_min_hex.zrodlo_web,
        &t.promien_miasta_panstwa_max_hex.zrodlo_web,
        &t.min_dystans_obce_od_gracza.zrodlo_web,
        &t.rezerwa_wzrostu_klastra.zrodlo_web,
        &t.pakowanie.min_pierscieni.zrodlo_web,
        &t.pakowanie.wspolczynnik_pierscieni.zrodlo_web,
        &t.pakowanie.min_promien_w_odstepach.zrodlo_web,
        &t.pakowanie.rozszerzenie_max_krokow_w_odstepach.zrodlo_web,
        &t.pakowanie.pula_max_mnoznik.zrodlo_web,
        &t.pakowanie.rozszerzony_promien_mnoznik.zrodlo_web,
        &t.polplaszczyzna.margines.zrodlo_web,
        &t.polplaszczyzna.prog_dlugosci_kw.zrodlo_web,
    ];
    for s in sources {
        assert!(s.starts_with("gra/src/map/clusters.ts:"), "zrodlo: {s}");
    }
    // Ksztalt: odstepy/promienie dodatnie (petla rozszerzania w web nie konczy sie dla <= 0),
    // wspolczynnik dodatni i skonczony, prog dlugosci nieujemny, margines skonczony.
    assert!(t.promien_miasta_panstwa_min_hex.wartosc >= 1);
    assert!(t.promien_miasta_panstwa_max_hex.wartosc >= 1);
    assert!(t.min_dystans_obce_od_gracza.wartosc >= 1);
    assert!(t.rezerwa_wzrostu_klastra.wartosc >= 0);
    assert!(t.pakowanie.min_pierscieni.wartosc >= 1);
    assert!(t.pakowanie.wspolczynnik_pierscieni.wartosc.is_finite());
    assert!(t.pakowanie.wspolczynnik_pierscieni.wartosc > 0.0);
    assert!(t.pakowanie.min_promien_w_odstepach.wartosc >= 1);
    assert!(t.pakowanie.rozszerzenie_max_krokow_w_odstepach.wartosc >= 1);
    assert!(t.pakowanie.pula_max_mnoznik.wartosc >= 1);
    assert!(t.pakowanie.rozszerzony_promien_mnoznik.wartosc >= 1);
    assert!(t.polplaszczyzna.margines.wartosc.is_finite());
    assert!(t.polplaszczyzna.prog_dlugosci_kw.wartosc >= 0.0);
}

#[test]
fn start_city_state_distance_is_not_the_cities_ts_constant() {
    // `MIN_DIST_START_CITY_STATE` (clusters.ts:49) to INNA stala niz
    // `min_city_distance_start_city_state` (cities.ts:1122, start-cluster-params.json). Test
    // kontraktu rozdzielenia zrodel (bez pinu wartosci): obie czytane z roznych tabel.
    let rivals = mapgen_cluster_rivals()
        .promien_miasta_panstwa_min_hex
        .zrodlo_web
        .clone();
    let start = civ_engine::data::derived::start_cluster_params()
        .min_dystans_miast_start_miasto_panstwo
        .zrodlo_web
        .clone();
    assert!(rivals.contains("clusters.ts:42"));
    assert!(start.contains("cities.ts:1122"));
    assert_ne!(rivals, start);
}
