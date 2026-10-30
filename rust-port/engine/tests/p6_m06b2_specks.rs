//! P6.M06B2 - `countOpenOceanLandSpecks` (gen-helpers.ts:5006) i `purgeOpenOceanLandSpecks` (:5027)
//! wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`). Wektory: `p6_m06b2_vectors/web-specks.json`.
//! Wlasnosci: po purge liczba specks = 0 (usuniecie izolowanego lądu nie tworzy nowych izolowanych).

#[path = "p6_m06b2_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::landsea::{
    count_open_ocean_land_specks, purge_open_ocean_land_specks,
};
use common::{
    build_map, cases, check_input, dump, expected_state, load, map_index, WEB_CASES_SPECKS,
};
use serde_json::Value;

fn root() -> Value {
    load(WEB_CASES_SPECKS)
}

#[test]
fn count_open_ocean_land_specks_matches_web() {
    let r = root();
    let cs = cases(&r, "specks");
    assert!(cs.len() >= 20, "za malo przypadkow specks: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(&r, idx, id);
        let expected: usize = c["out"].as_str().expect("out").parse().expect("usize");
        assert_eq!(
            count_open_ocean_land_specks(&build_map(&r, idx)),
            expected,
            "{id}: countOpenOceanLandSpecks"
        );
    }
}

#[test]
fn purge_open_ocean_land_specks_matches_web() {
    let r = root();
    let cs = cases(&r, "purge");
    assert!(cs.len() >= 20, "za malo przypadkow purge: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(&r, idx, id);
        let mut hx = build_map(&r, idx);
        let ret = purge_open_ocean_land_specks(&mut hx);
        let out = &c["out"];
        assert_eq!(ret as u64, out["ret"].as_u64().expect("ret"), "{id}: zwrot");
        assert_eq!(
            dump(&hx),
            expected_state(&r, idx, &out["diff"]),
            "{id}: stan"
        );
        assert_eq!(
            count_open_ocean_land_specks(&hx),
            0,
            "{id}: po purge nie ma specks"
        );
    }
}

/// Coverage: w wektorach sa mapy, na ktorych purge faktycznie cos usuwa (ret > 0).
#[test]
fn specks_vectors_include_removals() {
    let r = root();
    let purge = cases(&r, "purge");
    let with_removal = purge
        .iter()
        .filter(|c| c["out"]["ret"].as_u64().unwrap_or(0) > 0)
        .count();
    assert!(
        with_removal >= 5,
        "za malo map z usunieciem: {with_removal}"
    );
}
