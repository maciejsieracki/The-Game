//! P6.M05B - pokrycie reliefu i pasma gorskie na poziomie calego przebiegu:
//! `ensureReliefGridCoverage` (gen-helpers.ts:2371), `capReliefClusterSizeSafetyNet` (:2618),
//! `growMountainRanges` (:2965). Wektory z URUCHOMIONEGO weba: stan mapy przed i po (kolejnosc
//! wstawiania), zwrot i NASTEPNA wartosc strumienia rand (dowod identycznego zuzycia rand).

#[path = "p6_m05b_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::relief::{
    cap_relief_cluster_size_safety_net, ensure_relief_grid_coverage, grow_mountain_ranges,
};
use common::{assert_f64, build_state, cases, dims, dump, fv, make_rand, seed_of, stat, tier_from};
use serde_json::Value;

#[derive(Clone, Copy)]
enum Kind {
    Ensure,
    Grow,
    Safety,
}

fn run(kind: Kind, c: &Value) {
    let id = c["id"].as_str().unwrap_or("?");
    let (mut hexes, scratch) = build_state(&c["map"]);
    assert_eq!(dump(&hexes), c["input"], "{id}: stan wejsciowy != wektor");
    let tier = tier_from(c["tier"].as_str().expect("tier"));
    let (w, h) = dims(c);
    let mut rand = make_rand(seed_of(c));
    let ret = match kind {
        Kind::Ensure => ensure_relief_grid_coverage(&mut hexes, &scratch, tier, w, h, &mut rand),
        Kind::Grow => grow_mountain_ranges(&mut hexes, &scratch, tier, w, h, &mut rand),
        Kind::Safety => {
            cap_relief_cluster_size_safety_net(&mut hexes, &scratch);
            0.0
        }
    };
    let out = &c["output"];
    assert_f64(ret, fv(&out["ret"]), &format!("{id}: zwrot"));
    assert_eq!(dump(&hexes), out["state"], "{id}: stan po wywolaniu != web");
    assert_f64(
        rand(),
        fv(&out["rngNext"]),
        &format!("{id}: nastepne rand()"),
    );
}

#[test]
fn ensure_relief_grid_coverage_matches_web() {
    let cs = cases("ensure");
    assert!(cs.len() >= 40, "za malo przypadkow ensure: {}", cs.len());
    for c in cs {
        run(Kind::Ensure, c);
    }
    assert!(stat("ensureFixed") >= 20, "pokrycie: przypadki z naprawa");
}

#[test]
fn grow_mountain_ranges_matches_web() {
    let cs = cases("grow");
    assert!(cs.len() >= 40, "za malo przypadkow grow: {}", cs.len());
    for c in cs {
        run(Kind::Grow, c);
    }
    assert!(stat("growChanged") >= 30, "pasma: przypadki z dolozeniem");
}

#[test]
fn cap_relief_cluster_size_safety_net_matches_web() {
    let cs = cases("safety");
    assert!(cs.len() >= 16, "za malo przypadkow safety: {}", cs.len());
    for c in cs {
        run(Kind::Safety, c);
    }
}
