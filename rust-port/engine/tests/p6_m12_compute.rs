//! P6.M12 - `computeClusters` (`clusters.ts:3373-4250`) i `ClusterPlacement` (`:127-144`) z
//! WEKTORAMI z URUCHOMIONEGO weba (`p6_m12_vectors/web-vectors.json`, generator
//! `gen-m12-vectors.mjs`, pin `edb8fb56`). Wyniki sa liczbami calkowitymi i napisami - porownanie
//! jest dokladne (struktury `TypeCluster`, sygnatura `spawnCache`: pula `ladowe`, masy ladu i pole
//! morza). Dodatkowo: testy KSZTALTU (bez pinow wartosci balansu) i pokrycia sciezek.

#[path = "p6_m12_vectors/common.rs"]
mod common;

use std::collections::BTreeSet;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::mapgen::cluster_compute::{
    build_sea_distance_field, compute_clusters, ClusterComputeError, ComputeClustersOpts,
};
use civ_engine::domain::mapgen::cluster_layout::{
    capital_min_separation_for_map, passes_min_capital_separation_gate,
};
use common::*;

#[test]
fn sea_distance_field_matches_web() {
    let rows = cases("seaField");
    assert!(rows.len() >= 30, "za malo map: {}", rows.len());
    for c in rows {
        let id = s(&c["map"]);
        let map = map_of(id);
        let sea = build_sea_distance_field(map);
        let (n, f) = sea_signature(map, &sea);
        assert_eq!(n, u(&c["sea"]["n"]), "{id}: liczba wpisow pola morza");
        assert_eq!(f, s(&c["sea"]["fnv"]), "{id}: FNV pola morza");
    }
}

#[test]
fn sea_distance_field_basic_shape() {
    // Oceaniczna mapa: kazdy hex ma dystans 0; mapa ladowa bez wody: zadnego wpisu.
    let ocean = build_sea_distance_field(map_of("e_ocean"));
    assert_eq!(ocean.len(), 30 * 24);
    assert!(ocean.values().all(|d| *d == 0.0));
    let land = build_sea_distance_field(map_of("e_land"));
    assert!(land.is_empty());
    // Pojedynczy hex ladu otoczony morzem: dystans 1.
    let one = build_sea_distance_field(map_of("e_one"));
    assert_eq!(one.get(&(8, 6)).copied(), Some(1.0));
    let empty = build_sea_distance_field(map_of("e_empty"));
    assert!(empty.is_empty());
}

/// Niezmienniki strukturalne wyniku (bez pinow wartosci), sprawdzane na KAZDYM przypadku wektorow:
/// numeracja `typIndex`, najwyzej jedna stolica w klastrze, brak powtorzonych typow, `aktywne_typy` =
/// liczba klastrow z miastami, stolice roznych typow spelniaja separacje z tabeli rozmiaru mapy.
/// (Miasta ROZNYCH klastrow MOGA lezec na tym samym hexie - tak robi web na malych mapach, gdy
/// `rywaleNaKlaster` jest duze; w wektorach: ~49% przypadkow; rozwiazuje to pozniej cluster-start.)
fn assert_shape_invariants(
    id: &str,
    map: &civ_engine::domain::map_generator::GeneratedMap,
    spec: &Spec,
    got: &civ_engine::domain::mapgen::cluster_compute::ClusterPlacement,
) {
    assert_eq!(got.player_typ_index, 0, "{id}");
    for (idx, k) in got.klastry.iter().enumerate() {
        assert_eq!(k.typ_index, idx, "{id}: typIndex klastra {idx}");
        assert!(
            k.miasta.iter().filter(|m| m.is_capital).count() <= 1,
            "{id}: wiecej niz jedna stolica w klastrze {idx}"
        );
    }
    let typs: BTreeSet<&str> = got.klastry.iter().map(|k| k.typ.as_str()).collect();
    assert_eq!(typs.len(), got.klastry.len(), "{id}: dublet typu");
    let placed = got.klastry.iter().filter(|k| !k.miasta.is_empty()).count() as i64;
    assert_eq!(got.aktywne_typy, placed, "{id}");
    let (w, h) = (i64::from(map.width), i64::from(map.height));
    let min_sep = capital_min_separation_for_map(got.rozmiar_mapy, w, h) as f64;
    if min_sep > 0.0 && got.klastry.len() > 1 && spec.min_dyst_kl.is_none() {
        let caps: Vec<HexCoord> = got
            .klastry
            .iter()
            .filter_map(civ_engine::domain::mapgen::cluster_layout::cluster_capital_hex)
            .collect();
        for (a, cap) in caps.iter().enumerate() {
            let others: Vec<HexCoord> = caps
                .iter()
                .enumerate()
                .filter(|(b, _)| *b != a)
                .map(|(_, x)| *x)
                .collect();
            assert!(
                passes_min_capital_separation_gate(*cap, &others, min_sep),
                "{id}: stolice zbyt blisko (min {min_sep})"
            );
        }
    }
}

/// Liczba hexow mapy z wektora.
fn hex_count(id: &str) -> usize {
    u(&rep(id)["w"]) * u(&rep(id)["h"])
}

/// Porownuje `compute_clusters` z webem na przypadkach, ktorych mapa ma `lo < hexy <= hi`
/// (podzial na grupy pozwala testom isc rownolegle). Zwraca liczbe sprawdzonych przypadkow.
fn check_compute_group(lo: usize, hi: usize) -> usize {
    let roster = RosterRows::new();
    let roster_rows = roster.rows();
    let mut checked = 0;
    for c in cases("compute") {
        let id = s(&c["map"]);
        let n = hex_count(id);
        if n <= lo || n > hi {
            continue;
        }
        let map = map_of(id);
        let spec = spec_of(&c["spec"]);
        let got = compute_clusters(map, &spec.opts(Some(&roster_rows)));
        checked += 1;
        if c["threw"].as_bool().expect("threw") {
            assert!(
                s(&c["error"]).contains("reading 'length'"),
                "{id}: nieoczekiwany blad weba {}",
                c["error"]
            );
            match got.as_ref().err() {
                Some(ClusterComputeError::DiagnosticRegionMissing { placement, .. }) => {
                    // wynik zbudowany przez web PRZED rzuceniem (kopia clusters.ts z jednym tokenem
                    // dziennika zmienionym, patrz generator) == wynik portu dolaczony do bledu
                    if let Some(d) = placement_diff(map, placement, &c["noDiagResult"]) {
                        panic!("{id} {}: wynik sprzed rzucenia: {d}", c["spec"]);
                    }
                }
                other => panic!(
                    "{id} {}: web rzuca (log diagnostyczny), port: {other:?}",
                    c["spec"]
                ),
            }
            continue;
        }
        let got = got.unwrap_or_else(|e| panic!("{id} {}: port rzuca ({e}), web nie", c["spec"]));
        if let Some(d) = placement_diff(map, &got, &c["result"]) {
            panic!("{id} {}: {d}", c["spec"]);
        }
        assert_shape_invariants(id, map, &spec, &got);
    }
    checked
}

#[test]
fn compute_clusters_matches_web_maps_up_to_500_hexes() {
    assert!(check_compute_group(0, 500) >= 50);
}

#[test]
fn compute_clusters_matches_web_maps_501_to_1100_hexes() {
    assert!(check_compute_group(500, 1100) >= 100);
}

#[test]
fn compute_clusters_matches_web_maps_1101_to_2500_hexes() {
    assert!(check_compute_group(1100, 2500) >= 100);
}

#[test]
fn compute_clusters_matches_web_maps_2501_to_5000_hexes() {
    assert!(check_compute_group(2500, 5000) >= 50);
}

#[test]
fn compute_clusters_matches_web_maps_over_5000_hexes() {
    assert!(check_compute_group(5000, usize::MAX) >= 40);
}

#[test]
fn compute_vectors_cover_the_edge_paths_of_computeclusters() {
    // Pokrycie liczone na DANYCH weba (bez ponownego liczenia): wektory musza dotykac sciezek
    // brzegowych, inaczej testy parytetu nie dowodza tych sciezek.
    let rows = cases("compute");
    assert!(rows.len() >= 500, "za malo przypadkow: {}", rows.len());
    let mut threw = 0;
    let mut fewer = 0;
    let mut no_land = 0;
    let mut full = 0;
    let mut real_maps = BTreeSet::new();
    let mut sizes = BTreeSet::new();
    let mut for_map_nonzero = 0;
    let mut epochs = BTreeSet::new();
    let mut preferred = 0;
    for c in rows {
        let id = s(&c["map"]);
        if rep(id)["source"] == "generateMap" {
            real_maps.insert(id.to_string());
        }
        if let Some(e) = c["spec"]["epoch"].as_str() {
            epochs.insert(e.to_string());
        }
        if c["spec"]["preferred"].is_array() {
            preferred += 1;
        }
        if c["threw"].as_bool() == Some(true) {
            threw += 1;
            continue;
        }
        let r = &c["result"];
        sizes.insert(s(&r["rozmiar"]).to_string());
        if r["cache"].is_null() {
            no_land += 1;
            continue;
        }
        full += 1;
        if i(&r["aktywne"]) < i(&r["requested"]) {
            fewer += 1;
        }
        if u(&rep(id)["w"]).min(u(&rep(id)["h"])) >= 80 {
            for_map_nonzero += 1;
        }
    }
    assert!(threw >= 15, "rzucenia weba: {threw}");
    assert!(fewer >= 3, "mniej klastrow niz zadano: {fewer}");
    assert!(no_land >= 5, "mapy bez ladu: {no_land}");
    assert!(full >= 400, "pelne wyniki: {full}");
    assert!(
        real_maps.len() >= 7,
        "prawdziwe mapy generateMap: {real_maps:?}"
    );
    assert!(sizes.len() >= 3, "rozmiary map: {sizes:?}");
    assert!(
        for_map_nonzero >= 30,
        "mapy z krotszym bokiem >= 80: {for_map_nonzero}"
    );
    assert!(epochs.len() >= 3, "epoki: {epochs:?}");
    assert!(preferred >= 50, "preferowane typy: {preferred}");
}

#[test]
fn compute_clusters_default_opts_matches_web_defaults() {
    // Wywolanie bez opts (`computeClusters(map)`) = domyslne ziarno, rywale i liczba typow z rozmiaru
    // mapy; wynik rowny nagraniu z weba. Tylko mapy <= 1100 hexow (reszta w testach grup).
    let mut checked = 0;
    for c in cases("compute") {
        if c["spec"].as_object().is_some_and(|o| !o.is_empty())
            || c["threw"].as_bool() == Some(true)
        {
            continue;
        }
        let id = s(&c["map"]);
        if hex_count(id) > 1100 {
            continue;
        }
        let map = map_of(id);
        let got = compute_clusters(map, &ComputeClustersOpts::default()).expect("default");
        if let Some(d) = placement_diff(map, &got, &c["result"]) {
            panic!("{id}: {d}");
        }
        checked += 1;
    }
    assert!(checked >= 10, "za malo map z domyslnymi opts: {checked}");
}

#[test]
fn compute_clusters_is_deterministic() {
    for id in ["k42", "s_c50", "p123", "w5"] {
        let map = map_of(id);
        let opts = ComputeClustersOpts {
            seed: Some(9),
            rywale_na_klaster: Some(3),
            ..ComputeClustersOpts::default()
        };
        let a = compute_clusters(map, &opts).expect("a");
        let b = compute_clusters(map, &opts).expect("b");
        assert_eq!(a, b, "{id}: ten sam seed => ten sam wynik");
    }
}

#[test]
fn no_land_returns_empty_structure_without_cache() {
    for id in ["e_ocean", "e_shallow", "e_mount", "e_empty"] {
        let map = map_of(id);
        let p = compute_clusters(map, &ComputeClustersOpts::default()).expect(id);
        assert!(p.klastry.is_empty(), "{id}");
        assert_eq!(p.aktywne_typy, 0, "{id}");
        assert!(p.spawn_cache.is_none(), "{id}");
        assert_eq!(p.player_typ_index, 0, "{id}");
    }
}

#[test]
fn web_diagnostic_log_type_error_is_reproduced_on_every_thrown_vector() {
    // BLAD WEBA odtworzony 1:1: dziennik diagnostyczny na koncu `computeClusters`
    // (`clusters.ts:4228-4233`) czyta `regiony[ci]!.length` dla klastra bez regionu Voronoi i rzuca
    // `TypeError`, gdy klaster ma mniej niz `rywaleNaKlaster + 1` miast. Port zwraca
    // `DiagnosticRegionMissing`; wektory maja >= 20 takich przypadkow na prawdziwych i syntetycznych
    // mapach (nie tylko brzegowych).
    let thrown: Vec<&serde_json::Value> = cases("compute")
        .iter()
        .filter(|c| c["threw"].as_bool() == Some(true))
        .collect();
    assert!(
        thrown.len() >= 15,
        "wektory musza zawierac >= 15 przypadkow rzucenia: {}",
        thrown.len()
    );
    let maps: BTreeSet<&str> = thrown.iter().map(|c| s(&c["map"])).collect();
    assert!(
        maps.iter().any(|m| !m.starts_with("e_")),
        "rzucenie tylko na mapach brzegowych: {maps:?}"
    );
    for c in thrown {
        let id = s(&c["map"]);
        let spec = spec_of(&c["spec"]);
        let r = compute_clusters(map_of(id), &spec.opts(None));
        assert!(
            matches!(
                r.err(),
                Some(ClusterComputeError::DiagnosticRegionMissing { .. })
            ),
            "{id}"
        );
    }
    let first = cases("compute")
        .iter()
        .find(|c| c["threw"].as_bool() == Some(true))
        .expect("przypadek rzucenia");
    let err = compute_clusters(
        map_of(s(&first["map"])),
        &spec_of(&first["spec"]).opts(None),
    )
    .expect_err("rzuca");
    let msg = err.to_string();
    assert!(msg.contains("TypeError") && msg.contains("length"), "{msg}");
    let msg = ClusterComputeError::NoClusterCenters.to_string();
    assert!(msg.contains("TypeError"), "{msg}");
}
