//! P6.M12 - testy KSZTALTU tabeli `data/derived/mapgen-cluster-compute.json` (bez pinow wartosci:
//! zmiana liczby balansu nie wymaga zmiany tych testow; zgodnosc z webem pilnuja wektory w
//! `p6_m12_compute.rs` / `p6_m12_spawn.rs`). Sprawdzaja: parsowanie z `deny_unknown_fields`,
//! zrodlo (plik:linia) przy kazdej wartosci, sensowny ksztalt wartosci oraz to, ze zachowanie kodu
//! WYNIKA z pol tabeli (a nie z osobnych liczb w kodzie).

#[path = "p6_m12_vectors/common.rs"]
mod common;

use civ_engine::data::derived::{
    mapgen_cluster_compute, parse_mapgen_cluster_compute, MapgenClusterComputeFile,
    MAPGEN_CLUSTER_COMPUTE_JSON,
};
use civ_engine::domain::mapgen::cluster_compute::{compute_clusters, ComputeClustersOpts};
use civ_engine::domain::mapgen::cluster_layout::{
    capital_min_separation_for_map, cluster_center_placement_sep_for_map,
};
use civ_engine::domain::mapgen::params::MapSizeLabel;
use common::*;

#[test]
fn table_parses_with_deny_unknown_fields() {
    assert_eq!(
        &parse_mapgen_cluster_compute().expect("tabela"),
        mapgen_cluster_compute()
    );
    let base: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_COMPUTE_JSON).unwrap();
    let mut v = base.clone();
    v["nieznane_pole"] = serde_json::json!(1);
    assert!(serde_json::from_value::<MapgenClusterComputeFile>(v).is_err());
    for group in [
        "domyslne",
        "dystans_klastrow",
        "margines_brzegu",
        "region_dopelnienia",
    ] {
        let mut v = base.clone();
        v[group]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<MapgenClusterComputeFile>(v).is_err(),
            "{group}: nieznane pole przeszlo"
        );
    }
}

/// Zbiera wszystkie liscie `{wartosc, zrodlo_web}`.
fn leaves<'a>(
    v: &'a serde_json::Value,
    path: &str,
    out: &mut Vec<(String, &'a serde_json::Value)>,
) {
    if let serde_json::Value::Object(m) = v {
        if m.contains_key("zrodlo_web") {
            out.push((path.to_string(), v));
            return;
        }
        for (k, c) in m {
            if k == "meta" {
                continue;
            }
            leaves(c, &format!("{path}/{k}"), out);
        }
    }
}

#[test]
fn every_value_has_a_web_source_with_file_and_line() {
    let t: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_COMPUTE_JSON).unwrap();
    let mut found = Vec::new();
    leaves(&t, "", &mut found);
    assert!(
        found.len() >= 6,
        "za malo wartosci w tabeli: {}",
        found.len()
    );
    for (path, leaf) in &found {
        let src = leaf["zrodlo_web"].as_str().expect("zrodlo_web");
        assert!(
            src.starts_with("gra/src/map/clusters.ts:"),
            "{path}: zrodlo {src}"
        );
        let after = &src["gra/src/map/clusters.ts:".len()..];
        let n: u32 = after
            .chars()
            .take_while(char::is_ascii_digit)
            .collect::<String>()
            .parse()
            .unwrap_or_else(|_| panic!("{path}: brak numeru linii w {src}"));
        // numer linii miesci sie w zakresie tematu M12 (clusters.ts:3362-4250)
        assert!(
            (3362..=4250).contains(&n),
            "{path}: linia {n} poza zakresem M12"
        );
        assert!(
            leaf["uzycie"].as_str().is_some_and(|u| !u.is_empty()),
            "{path}: brak opisu uzycia"
        );
    }
}

#[test]
fn values_have_sane_shape() {
    let t = mapgen_cluster_compute();
    assert!(t.domyslne.rywale_na_klaster.wartosc >= 0);
    // dzielniki: > 0 (inaczej dzielenie przez zero), minima: >= 0
    assert!(t.dystans_klastrow.dzielnik_krotszego_boku.wartosc > 0);
    assert!(t.margines_brzegu.dzielnik_dystansu_klastrow.wartosc > 0);
    assert!(t.region_dopelnienia.dzielnik_dystansu_klastrow.wartosc > 0);
    assert!(t.dystans_klastrow.min_zapas_krotszy_bok.wartosc >= 0);
    assert!(t.margines_brzegu.minimum.wartosc >= 0);
    assert!(t.region_dopelnienia.minimum_promienia.wartosc >= 0);
    // margines od krawedzi jest mniejszy niz promien regionu dopelnienia (margines to ulamek, region to polowa)
    assert!(
        t.margines_brzegu.dzielnik_dystansu_klastrow.wartosc
            >= t.region_dopelnienia.dzielnik_dystansu_klastrow.wartosc
    );
}

#[test]
fn default_rivals_per_cluster_comes_from_the_table() {
    // Brak `rywale_na_klaster` w opts => wartosc z tabeli: wynik identyczny jak z jawnie podana.
    for id in ["k42", "s_c30", "w5"] {
        let map = map_of(id);
        let implicit = compute_clusters(
            map,
            &ComputeClustersOpts {
                seed: Some(11),
                ..ComputeClustersOpts::default()
            },
        )
        .expect("implicit");
        let explicit = compute_clusters(
            map,
            &ComputeClustersOpts {
                seed: Some(11),
                rywale_na_klaster: Some(
                    mapgen_cluster_compute().domyslne.rywale_na_klaster.wartosc,
                ),
                ..ComputeClustersOpts::default()
            },
        )
        .expect("explicit");
        assert_eq!(implicit, explicit, "{id}");
    }
}

#[test]
fn min_cluster_distance_fallback_uses_short_side_divisor_from_table() {
    // Mapa o krotszym boku < progu ForMap: separacje = 0, wiec `minDystansKlastrow` pochodzi z
    // tabeli (max(zapas, floor(krotszy bok / dzielnik))). Jawne `min_dystans_klastrow` rowne tej
    // wartosci musi dawac TEN SAM wynik co brak parametru.
    let t = mapgen_cluster_compute();
    for id in ["k42", "s_c30", "w5", "k3small"] {
        let map = map_of(id);
        let (w, h) = (i64::from(map.width), i64::from(map.height));
        let label = civ_engine::domain::mapgen::cluster_mass::map_size_label(w, h);
        assert_eq!(cluster_center_placement_sep_for_map(label, w, h), 0, "{id}");
        assert_eq!(capital_min_separation_for_map(label, w, h), 0, "{id}");
        let expected = t.dystans_klastrow.min_zapas_krotszy_bok.wartosc.max(
            w.min(h)
                .div_euclid(t.dystans_klastrow.dzielnik_krotszego_boku.wartosc),
        );
        let base = ComputeClustersOpts {
            seed: Some(3),
            rywale_na_klaster: Some(2),
            ..ComputeClustersOpts::default()
        };
        let implicit = compute_clusters(map, &base).expect("implicit");
        let explicit = compute_clusters(
            map,
            &ComputeClustersOpts {
                min_dystans_klastrow: Some(expected),
                ..base
            },
        )
        .expect("explicit");
        assert_eq!(implicit, explicit, "{id}: dystans klastrow z tabeli");
        let _ = MapSizeLabel::Mala;
    }
}
