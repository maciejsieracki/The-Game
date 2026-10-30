//! P6.M06B1 - `maxOceanBayDepth` (gen-helpers.ts:4649) wzgledem wektorow z URUCHOMIONEGO weba
//! (pin `edb8fb56`). Wektory: `tests/p6_m06b1_vectors/web-vectors.json`, kategoria `ocean`.
//! Przypadki graniczne: `floor(min(w,h)/6)` rowne 3, 4, 5 (dolny limit = 4) oraz 15, 16, 17
//! (gorny limit = 16); rozmiary 1..110 pokrywaja oba progi.

#[path = "p6_m06b1_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::landsea::max_ocean_bay_depth;
use common::{cases, stat};

#[test]
fn max_ocean_bay_depth_matches_web() {
    let cs = cases("ocean");
    assert!(cs.len() >= 300, "za malo przypadkow ocean: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let expected: f64 = c["out"].as_str().expect("out").parse().expect("f64");
        common::assert_f64(
            max_ocean_bay_depth(w, h),
            expected,
            &format!("{id}: maxOceanBayDepth({w},{h})"),
        );
    }
}

#[test]
fn max_ocean_bay_depth_both_limits_are_exercised() {
    // Dolny limit (bufor + 2 = 4) aktywny dla min(w,h) < 30; gorny (bufor + 14 = 16) dla min(w,h) >= 96.
    // Wektory musza zawierac wartosci skali tuz przy obu progach (N-1, N, N+1).
    for name in [
        "ocean_scaled_3",
        "ocean_scaled_4",
        "ocean_scaled_5",
        "ocean_scaled_15",
        "ocean_scaled_16",
        "ocean_scaled_17",
    ] {
        assert!(stat(name) > 0, "brak trafien granicy {name}");
    }
    assert_eq!(
        max_ocean_bay_depth(23, 23),
        4.0,
        "floor(23/6)=3 -> dolny limit 4"
    );
    assert_eq!(
        max_ocean_bay_depth(24, 24),
        4.0,
        "floor(24/6)=4 -> 4 (rowne progowi)"
    );
    assert_eq!(
        max_ocean_bay_depth(30, 30),
        5.0,
        "floor(30/6)=5 -> 5 (ponad dolnym)"
    );
    assert_eq!(max_ocean_bay_depth(95, 95), 15.0, "floor(95/6)=15 -> 15");
    assert_eq!(
        max_ocean_bay_depth(96, 96),
        16.0,
        "floor(96/6)=16 -> gorny limit 16"
    );
    assert_eq!(
        max_ocean_bay_depth(200, 200),
        16.0,
        "gorny limit obowiazuje"
    );
    assert_eq!(max_ocean_bay_depth(90, 1), 4.0, "min(w,h)=1 -> dolny limit");
}
