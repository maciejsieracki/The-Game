//! P6.M11 - stale i bramki odleglosci stolic, cwiartki bboxa ladu, hex spawnu z bramkami stolicy
//! (`clusters.ts:1351-1769`; pin web `edb8fb56`). Wektory z URUCHOMIONEGO weba
//! (`p6_m11_vectors/web-vectors.json`); f64 porownywane bit-w-bit; licznik `rand()` rowny webowi.

#[path = "p6_m11_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::mapgen::cluster_layout::{
    capital_max_sea_dist, capital_max_sea_dist_for_map, capital_min_sea_dist,
    capital_min_sea_dist_for_map, capital_min_separation, capital_min_separation_for_map,
    capital_sea_band_penalty, cluster_body_buffer_radius, cluster_body_separation,
    cluster_body_separation_for_map, cluster_center_placement_sep,
    cluster_center_placement_sep_for_map, cluster_center_quadrant_spread,
    cluster_city_state_radius, cluster_cohesion_max_hex, cluster_hub_chain_reach_hex,
    count_centers_per_quadrant, land_quadrant_index, min_capital_separation_distance,
    minimum_spread_quarters_required, passes_capital_sea_band_gate,
    passes_min_capital_separation_gate, passes_min_sea_dist_gate,
    pick_spawn_hex_with_capital_gates, preferred_quadrants_for_spread, sea_dist_at,
    sea_dist_rescue_ladder, PickSpawnHexOpts, HOOKS,
};
use civ_engine::domain::mapgen::cluster_mass::ClusterLayoutHooks;
use civ_engine::domain::mapgen::params::MapSizeLabel;
use common::*;

fn label(v: &serde_json::Value) -> MapSizeLabel {
    MapSizeLabel::from_key(s(v)).expect("etykieta rozmiaru")
}

#[test]
fn by_label_matches_web() {
    let cs = cases("byLabel");
    assert_eq!(cs.len(), 5);
    for c in cs {
        let l = label(&c["label"]);
        assert_eq!(capital_min_sea_dist(l), i(&c["minSea"]), "{l:?}");
        assert_eq!(capital_max_sea_dist(l), i(&c["maxSea"]), "{l:?}");
        assert_eq!(capital_min_separation(l), i(&c["minSep"]), "{l:?}");
        assert_eq!(cluster_body_separation(l), i(&c["bodySep"]), "{l:?}");
        assert_eq!(
            cluster_center_placement_sep(l),
            i(&c["placementSep"]),
            "{l:?}"
        );
    }
    assert_eq!(
        cluster_city_state_radius(),
        i(&web()["cases"]["radius"]["cityStateRadius"])
    );
}

#[test]
fn for_map_matches_web() {
    let cs = cases("forMap");
    assert!(cs.len() >= 300);
    let mut zero = 0;
    let mut nonzero = 0;
    for c in cs {
        let (l, w, h) = (label(&c["label"]), i(&c["w"]), i(&c["h"]));
        assert_eq!(
            capital_min_sea_dist_for_map(l, w, h),
            i(&c["minSea"]),
            "{c}"
        );
        assert_eq!(
            capital_max_sea_dist_for_map(l, w, h),
            i(&c["maxSea"]),
            "{c}"
        );
        assert_eq!(
            capital_min_separation_for_map(l, w, h),
            i(&c["minSep"]),
            "{c}"
        );
        assert_eq!(
            cluster_body_separation_for_map(l, w, h),
            i(&c["bodySep"]),
            "{c}"
        );
        assert_eq!(
            cluster_center_placement_sep_for_map(l, w, h),
            i(&c["placementSep"]),
            "{c}"
        );
        if i(&c["minSea"]) == 0 {
            zero += 1;
        } else {
            nonzero += 1;
        }
    }
    // Obie galezie `short < 80` (bramka wylaczona) i `>= 80` sa wykonane.
    assert!(zero > 50 && nonzero > 50, "zero {zero} nonzero {nonzero}");
}

#[test]
fn hub_reach_and_body_buffer_match_web() {
    for c in cases("hubReach") {
        let n = i(&c["n"]);
        assert_eq!(cluster_hub_chain_reach_hex(n), i(&c["reach"]), "n={n}");
        assert_eq!(cluster_cohesion_max_hex(n), i(&c["cohesion"]), "n={n}");
    }
    let cs = cases("bodyBuffer");
    assert!(cs.len() >= 15);
    for c in cs {
        assert_f64(
            cluster_body_buffer_radius(fv(&c["s"])),
            fv(&c["result"]),
            &format!("bufor S={}", c["s"]),
        );
    }
}

#[test]
fn sea_gates_match_web() {
    let cs = cases("seaGates");
    assert!(cs.len() >= 400);
    let (mut passed, mut failed) = (0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let sd = sea(id);
        let (q, r) = (i(&c["q"]) as i32, i(&c["r"]) as i32);
        let (mn, mx) = (fv(&c["min"]), fv(&c["max"]));
        assert_f64(
            sea_dist_at(sd, q, r),
            fv(&c["at"]),
            &format!("seaDistAt {c}"),
        );
        let gate = passes_min_sea_dist_gate(sd, q, r, mn);
        assert_eq!(gate, c["gate"].as_bool().unwrap(), "gate {c}");
        let band = passes_capital_sea_band_gate(sd, q, r, mn, mx);
        assert_eq!(band, c["band"].as_bool().unwrap(), "band {c}");
        if band {
            passed += 1;
        } else {
            failed += 1;
        }
    }
    assert!(passed > 40 && failed > 40, "band: {passed}/{failed}");
}

#[test]
fn band_penalty_matches_web() {
    let cs = cases("bandPenalty");
    assert!(cs.len() >= 800);
    let mut kinds = [0usize; 4];
    for c in cs {
        let got = capital_sea_band_penalty(fv(&c["sea"]), fv(&c["min"]), fv(&c["max"]));
        assert_f64(got, fv(&c["result"]), &format!("kara {c}"));
        let w = fv(&c["result"]);
        if w == 0.0 {
            kinds[0] += 1;
        } else if w >= 1000.0 {
            kinds[1] += 1;
        } else if w >= 100.0 {
            kinds[2] += 1;
        } else {
            kinds[3] += 1;
        }
    }
    // Zero (brak pasa / srodek), ponizej pasa (>= 1000), powyzej (>= 100), w pasie.
    assert!(kinds.iter().all(|k| *k > 20), "pokrycie kar: {kinds:?}");
}

#[test]
fn quadrant_helpers_match_web() {
    for c in cases("quadrant") {
        let got = land_quadrant_index(
            i(&c["q"]) as i32,
            i(&c["r"]) as i32,
            fv(&c["midQ"]),
            fv(&c["midR"]),
        );
        assert_eq!(got, u(&c["result"]), "{c}");
    }
    for c in cases("minQuarters") {
        assert_eq!(
            minimum_spread_quarters_required(i(&c["n"])),
            u(&c["result"]),
            "{c}"
        );
    }
    for c in cases("countPerQuad") {
        let got = count_centers_per_quadrant(&hexes(&c["centers"]), fv(&c["midQ"]), fv(&c["midR"]));
        let want: Vec<usize> = c["result"].as_array().unwrap().iter().map(u).collect();
        assert_eq!(got.to_vec(), want, "{c}");
    }
    let mut empty = 0;
    for c in cases("spreadQuad") {
        let centers = hexes(&c["centers"]);
        let sp = cluster_center_quadrant_spread(&centers, &bbox_of_json(&c["bbox"]));
        assert_eq!(sp.occupied_quadrants, u(&c["occupied"]), "{c}");
        assert_f64(sp.q_span, fv(&c["qSpan"]), "qSpan");
        assert_f64(sp.r_span, fv(&c["rSpan"]), "rSpan");
        if centers.is_empty() {
            empty += 1;
        }
    }
    assert!(empty > 0, "brak przypadku pustej listy srodkow");
}

#[test]
fn preferred_quadrants_match_web() {
    let cs = cases("preferredQuads");
    assert_eq!(cs.len(), 256 * 5);
    let (mut nulls, mut sets) = (0, 0);
    for c in cs {
        let counts: Vec<usize> = c["counts"].as_array().unwrap().iter().map(u).collect();
        let arr = [counts[0], counts[1], counts[2], counts[3]];
        let got = preferred_quadrants_for_spread(&arr, i(&c["n"]));
        let want: Option<Vec<usize>> = if c["result"].is_null() {
            None
        } else {
            Some(c["result"].as_array().unwrap().iter().map(u).collect())
        };
        assert_eq!(got, want, "{c}");
        if got.is_none() {
            nulls += 1;
        } else {
            sets += 1;
        }
    }
    assert!(nulls > 100 && sets > 100);
}

#[test]
fn capital_separation_gate_and_distance_match_web() {
    let cs = cases("minSepGate");
    assert!(cs.len() >= 1000);
    let (mut t, mut f_) = (0, 0);
    for c in cs {
        let got =
            passes_min_capital_separation_gate(hex(&c["c"]), &hexes(&c["prior"]), fv(&c["minSep"]));
        assert_eq!(got, c["result"].as_bool().unwrap(), "{c}");
        if got {
            t += 1;
        } else {
            f_ += 1;
        }
    }
    assert!(t > 100 && f_ > 100, "{t}/{f_}");
    let mut none = 0;
    for c in cases("minSepDist") {
        let got = min_capital_separation_distance(hex(&c["c"]), &hexes(&c["others"]));
        match (&c["result"], got) {
            (v, None) => {
                assert!(v.is_null(), "{c}");
                none += 1;
            }
            (v, Some(d)) => assert_f64(d, fv(v), &format!("{c}")),
        }
    }
    assert!(none > 0);
}

#[test]
fn rescue_ladder_matches_web() {
    let cs = cases("ladder");
    assert!(cs.len() >= 20);
    for c in cs {
        let got = sea_dist_rescue_ladder(fv(&c["min"]));
        let want: Vec<f64> = c["result"].as_array().unwrap().iter().map(fv).collect();
        assert_eq!(got.len(), want.len(), "{c}");
        for (g, w) in got.iter().zip(&want) {
            assert_f64(*g, *w, &format!("drabinka {c}"));
        }
    }
}

/// Implementacja cechy `ClusterLayoutHooks` (domkniecia, ktorych wymagal M10) zwraca to samo co
/// funkcje weba na tych samych wektorach.
#[test]
fn hooks_impl_matches_web() {
    for c in cases("quadrant") {
        let (q, r) = (i(&c["q"]) as i32, i(&c["r"]) as i32);
        assert_eq!(
            HOOKS.land_quadrant_index(q, r, fv(&c["midQ"]), fv(&c["midR"])),
            u(&c["result"])
        );
    }
    for c in cases("bandPenalty") {
        assert_f64(
            HOOKS.capital_sea_band_penalty(fv(&c["sea"]), fv(&c["min"]), fv(&c["max"])),
            fv(&c["result"]),
            "hook kara",
        );
    }
    for c in cases("minQuarters") {
        assert_eq!(
            HOOKS.minimum_spread_quarters_required(i(&c["n"])),
            u(&c["result"])
        );
    }
    for c in cases("seaGates") {
        let sd = sea(s(&c["map"]));
        let (q, r) = (i(&c["q"]) as i32, i(&c["r"]) as i32);
        assert_f64(HOOKS.sea_dist_at(sd, q, r), fv(&c["at"]), "hook seaDistAt");
        assert_eq!(
            HOOKS.passes_min_sea_dist_gate(sd, q, r, fv(&c["min"])),
            c["gate"].as_bool().unwrap()
        );
    }
    for c in cases("spreadQuad") {
        let sp =
            HOOKS.cluster_center_quadrant_spread(&hexes(&c["centers"]), &bbox_of_json(&c["bbox"]));
        assert_eq!(sp.occupied_quadrants, u(&c["occupied"]));
    }
    for c in cases("minSepDist") {
        let got = HOOKS.min_capital_separation_distance(hex(&c["c"]), &hexes(&c["others"]));
        assert_eq!(got.is_none(), c["result"].is_null());
    }
    for c in cases("countPerQuad") {
        let got =
            HOOKS.count_centers_per_quadrant(&hexes(&c["centers"]), fv(&c["midQ"]), fv(&c["midR"]));
        assert_eq!(got.len(), 4);
    }
    for c in cases("preferredQuads") {
        let counts: Vec<usize> = c["counts"].as_array().unwrap().iter().map(u).collect();
        let arr = [counts[0], counts[1], counts[2], counts[3]];
        let got = HOOKS.preferred_quadrants_for_spread(&arr, i(&c["n"]));
        assert_eq!(got.is_none(), c["result"].is_null());
    }
}

#[test]
fn pick_spawn_hex_matches_web() {
    let cs = cases("pickSpawn")
        .iter()
        .chain(cases("pickSpawnExtra").iter())
        .collect::<Vec<_>>();
    assert!(cs.len() >= 600);
    let mut extra_pref_hits = 0;
    let (mut some, mut none) = (0, 0);
    let (mut preferred_hit, mut with_bias, mut progressive, mut rand_used) = (0, 0, 0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let pool: Vec<HexCoord> = if c["pool"].is_null() {
            lad(id).clone()
        } else {
            hexes(&c["pool"])
        };
        let sd = c["useSea"].as_bool().unwrap().then(|| sea(id));
        let prior = hexes(&c["prior"]);
        let preferred = opt_hex(&c["preferred"]);
        let bbox = opt_bbox(&c["bbox"]);
        let spread_n = if c["spreadN"].is_null() {
            None
        } else {
            Some(i(&c["spreadN"]))
        };
        let opts = PickSpawnHexOpts {
            sea_dist: sd,
            min_sea_dist: i(&c["minSea"]) as f64,
            max_sea_dist: if c["maxSea"].is_null() {
                None
            } else {
                Some(i(&c["maxSea"]) as f64)
            },
            prior_capitals: &prior,
            min_capital_sep: i(&c["minSep"]) as f64,
            require_player_mass_gate: c["reqPlayer"].as_bool().unwrap(),
            require_local_land: c["reqLocal"].as_bool().unwrap(),
            preferred,
            progressive_soft_sea: c["progressive"].as_bool().unwrap(),
            land_bbox: bbox,
            spread_n,
        };
        let mut rng = CountedRand::new(i(&c["seed"]));
        let mut rand = || rng.draw();
        let got = pick_spawn_hex_with_capital_gates(
            map_of(id),
            &pool,
            cache(id),
            center_of(id),
            &mut rand,
            &opts,
        );
        assert_eq!(got, opt_hex(&c["result"]), "{c}");
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        match got {
            Some(h) => {
                some += 1;
                if preferred == Some(h) {
                    preferred_hit += 1;
                    if c["maxSea"].as_i64().is_some_and(|m| m < i(&c["minSea"])) {
                        extra_pref_hits += 1;
                    }
                }
            }
            None => none += 1,
        }
        if bbox.is_some() && spread_n.is_some_and(|n| n >= 5) && !prior.is_empty() {
            with_bias += 1;
        }
        if opts.progressive_soft_sea && opts.min_sea_dist > 0.0 {
            progressive += 1;
        }
        if rng.calls > 0 {
            rand_used += 1;
        }
    }
    assert!(some > 250 && none > 20, "wyniki: {some}/{none}");
    assert!(
        preferred_hit > 5,
        "preferowany hex wybrany {preferred_hit}x"
    );
    assert!(with_bias > 20, "sortowanie z biasem cwiartek {with_bias}x");
    assert!(progressive > 60, "drabinka miekka {progressive}x");
    assert!(rand_used > 250, "losowanie {rand_used}x");
    // preferowany hex akceptowany na miekkim stopniu przy maxSea < minSea (galaz `seaMin < minSeaDist`)
    assert!(
        extra_pref_hits > 3,
        "preferowany na miekkim stopniu {extra_pref_hits}x"
    );
}
