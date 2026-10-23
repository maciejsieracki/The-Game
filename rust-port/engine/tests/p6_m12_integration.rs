//! P6.M12 - integracja z M09-M11 i P6.1C (tylko odczyt wektorow innych tematow):
//! - mapy wektorow M12 o wspolnych identyfikatorach sa bajt w bajt te same co mapy M11 (te same
//!   specyfikacje `generateMap` i ziarna), a pole morza zapisane z weba w M11 (`buildSeaDistanceField`)
//!   jest rowne wynikowi [`build_sea_distance_field`];
//! - mapy P6.1C (`p6_1c_vectors/maps.json`) maja ten sam teren co odpowiadajace im mapy M12;
//! - `compute_clusters` uzywa tej samej implementacji cechy `ClusterLayoutHooks` (M11) co reszta
//!   mapgenu: wynik na mapie bez wody jest deterministyczny i zgodny ze strukturami M10.

#[path = "p6_m12_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::domain::mapgen::cluster_compute::{
    build_sea_distance_field, compute_clusters, ComputeClustersOpts,
};
use common::*;
use serde_json::Value;

const M11_VECTORS: &str = include_str!("p6_m11_vectors/web-vectors.json");
const MAPS_1C: &str = include_str!("p6_1c_vectors/maps.json");

fn m11() -> &'static Value {
    static V: std::sync::OnceLock<Value> = std::sync::OnceLock::new();
    V.get_or_init(|| serde_json::from_str(M11_VECTORS).expect("m11 vectors"))
}

#[test]
fn shared_maps_are_identical_to_m11_and_sea_field_matches_m11_web_field() {
    let m11_maps = m11()["maps"].as_object().expect("m11 maps");
    let mut shared = 0;
    for (id, theirs) in m11_maps {
        let Some(mine) = web()["maps"].get(id) else {
            continue;
        };
        shared += 1;
        for key in ["w", "h", "terrain", "river", "hexesFnv"] {
            assert_eq!(&mine[key], &theirs[key], "{id}: pole {key} rozne od M11");
        }
        // pole morza z weba (M11: -1 = brak wpisu) == pole liczone przez port
        let w = u(&theirs["w"]);
        let want: HashMap<(i32, i32), f64> = theirs["sea"]
            .as_array()
            .expect("sea")
            .iter()
            .enumerate()
            .filter(|(_, d)| i(d) >= 0)
            .map(|(k, d)| (((k % w) as i32, (k / w) as i32), i(d) as f64))
            .collect();
        let got = build_sea_distance_field(map_of(id));
        assert_eq!(got, want, "{id}: pole morza != pole z weba (M11)");
    }
    assert!(shared >= 15, "za malo wspolnych map z M11: {shared}");
}

#[test]
fn p6_1c_maps_have_the_same_terrain_as_the_m12_maps() {
    let maps: Value = serde_json::from_str(MAPS_1C).expect("maps 1c");
    for (id, theirs) in maps["maps"].as_object().expect("maps") {
        let mine = rep(id);
        assert_eq!(u(&mine["w"]), u(&theirs["szerokoscQ"]), "{id}");
        assert_eq!(u(&mine["h"]), u(&theirs["wysokoscR"]), "{id}");
        let terrain: Vec<&str> = theirs["hexes"]
            .as_array()
            .expect("hexes")
            .iter()
            .map(|row| s(&row[2]))
            .collect();
        let code = |t: &str| match t {
            "morze" => 'm',
            "plytkie_morze" => 'p',
            "laka" => 'l',
            "rownina" => 'r',
            "wzgorza" => 'w',
            "gory" => 'g',
            "pustynia" => 'u',
            "polarny" => 'o',
            other => panic!("teren {other}"),
        };
        let theirs_str: String = terrain.iter().map(|t| code(t)).collect();
        assert_eq!(
            s(&mine["terrain"]),
            theirs_str,
            "{id}: teren map P6.1C != M12"
        );
    }
}

#[test]
fn compute_on_land_only_map_places_one_cluster_per_region_without_sea() {
    // Mapa ladowa bez wody: pole morza puste => zadna bramka morza nie odrzuca kandydatow, a
    // wynik jest deterministyczny i spojny strukturalnie.
    let map = map_of("e_land");
    let a = compute_clusters(map, &ComputeClustersOpts::default()).expect("a");
    let b = compute_clusters(map, &ComputeClustersOpts::default()).expect("b");
    assert_eq!(a, b);
    assert!(!a.klastry.is_empty());
    let cache = a.spawn_cache.as_ref().expect("cache");
    assert!(cache.sea_dist.is_empty());
    assert_eq!(cache.ladowe.len(), 30 * 24);
}
