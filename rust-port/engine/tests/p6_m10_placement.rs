//! P6.M10 - wybor i rozmieszczenie srodkow klastrow (`clusters.ts:584-1344`; pin web `edb8fb56`).
//! Wektory z URUCHOMIONEGO weba; funkcje M11 (hooki) maja testowa implementacje
//! `common::WebHooks`, sprawdzona osobno na wektorach kategorii `hooks`. Licznik wywolan
//! `rand()` jest porownywany z webem (zuzycie strumienia musi byc identyczne).

#[path = "p6_m10_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::mapgen::cluster_mass::{
    assign_voronoi_regions, balance_cluster_spread, enforce_quarter_spread_on_centers,
    group_habitable_masses, mass_centroid, mass_land_cache_from_masses, pick_best_local_land_spawn,
    pick_center_in_mass, pick_center_in_mass_spread, pick_center_in_mass_with_land_gate,
    pick_center_on_land_pool_spread, pick_player_cluster_center, pick_tied_spawn_land_candidate,
    place_cluster_centers_across_landmasses, player_start_candidates_on_masses,
    sort_spawn_candidates_with_spread_bias, sort_spawn_land_candidates, ClusterLayoutHooks,
    ClusterSpreadOpts, LandBBox, MapBounds, MassLandCache, MassesOrCache, SeaDist,
    SpawnLandCandidate,
};
use civ_engine::domain::mapgen::cluster_rivals::PointF64;
use common::*;
use serde_json::Value;

fn cache_of(id: &str) -> (Vec<Vec<HexCoord>>, MassLandCache) {
    let masses = group_habitable_masses(&ladowe_of(id));
    let cache = mass_land_cache_from_masses(masses.clone());
    (masses, cache)
}

fn sea_opt(use_sea: bool, id: &str) -> Option<SeaDist> {
    use_sea.then(|| sea_of(id))
}

fn point(v: &Value) -> PointF64 {
    PointF64 {
        q: fv(&v[0]),
        r: fv(&v[1]),
    }
}

fn opt_i(v: &Value) -> Option<i64> {
    if v.is_null() {
        None
    } else {
        Some(i(v))
    }
}

fn check_rand(rc: &CountedRand, c: &Value, ctx: &str) {
    assert_eq!(rc.calls, u(&c["randCalls"]), "{ctx}: liczba wywolan rand()");
}

#[test]
fn hooks_match_web() {
    let h = WebHooks;
    let rows = cases("hooks");
    assert!(rows.len() > 1000);
    for c in rows {
        match s(&c["kind"]) {
            "quad" => assert_eq!(
                h.land_quadrant_index(
                    i(&c["q"]) as i32,
                    i(&c["r"]) as i32,
                    fv(&c["midQ"]),
                    fv(&c["midR"])
                ),
                u(&c["result"]),
                "{c}"
            ),
            "minQuarters" => assert_eq!(
                h.minimum_spread_quarters_required(i(&c["n"])),
                u(&c["result"]),
                "{c}"
            ),
            "bandPenalty" => assert_f64(
                h.capital_sea_band_penalty(fv(&c["sea"]), fv(&c["min"]), fv(&c["max"])),
                fv(&c["result"]),
                &c.to_string(),
            ),
            "countPerQuad" => {
                let got = h.count_centers_per_quadrant(
                    &hexes(&c["centers"]),
                    fv(&c["midQ"]),
                    fv(&c["midR"]),
                );
                let want: Vec<usize> = c["result"].as_array().expect("arr").iter().map(u).collect();
                assert_eq!(got.to_vec(), want, "{c}");
            }
            "preferred" => {
                let counts: Vec<usize> =
                    c["counts"].as_array().expect("arr").iter().map(u).collect();
                let arr = [counts[0], counts[1], counts[2], counts[3]];
                let got = h.preferred_quadrants_for_spread(&arr, i(&c["nNeeded"]));
                let want: Option<Vec<usize>> = if c["result"].is_null() {
                    None
                } else {
                    Some(c["result"].as_array().expect("arr").iter().map(u).collect())
                };
                let got_sorted = got.map(|mut g| {
                    g.sort_unstable();
                    g
                });
                assert_eq!(got_sorted, want, "{c}");
            }
            "spread" => {
                let got = h.cluster_center_quadrant_spread(
                    &hexes(&c["centers"]),
                    &bbox_of_json(&c["bbox"]),
                );
                assert_eq!(
                    got.occupied_quadrants,
                    u(&c["result"]["occupiedQuadrants"]),
                    "{c}"
                );
                assert_f64(got.q_span, fv(&c["result"]["qSpan"]), "qSpan");
                assert_f64(got.r_span, fv(&c["result"]["rSpan"]), "rSpan");
            }
            "minSep" => {
                let got = h.min_capital_separation_distance(hex(&c["c"]), &hexes(&c["others"]));
                match (got, c["result"].is_null()) {
                    (None, true) => {}
                    (Some(g), false) => assert_f64(g, fv(&c["result"]), &c.to_string()),
                    other => panic!("minSep {other:?} {c}"),
                }
            }
            "seaGate" => {
                let sea: SeaDist = c["sea"]
                    .as_array()
                    .expect("sea")
                    .iter()
                    .map(|e| ((i(&e[0]) as i32, i(&e[1]) as i32), i(&e[2]) as f64))
                    .collect();
                let (q, r) = (i(&c["q"]) as i32, i(&c["r"]) as i32);
                assert_f64(h.sea_dist_at(&sea, q, r), i(&c["at"]) as f64, "seaDistAt");
                assert_eq!(
                    h.passes_min_sea_dist_gate(&sea, q, r, i(&c["min"]) as f64),
                    c["result"].as_bool().expect("bool"),
                    "{c}"
                );
            }
            other => panic!("nieznany rodzaj hooka {other}"),
        }
    }
}

#[test]
fn sort_spawn_land_candidates_matches_web() {
    let h = WebHooks;
    for c in cases("sortSpawn") {
        let mut cands: Vec<SpawnLandCandidate> = c["cands"]
            .as_array()
            .expect("cands")
            .iter()
            .map(candidate_of)
            .collect();
        sort_spawn_land_candidates(
            &mut cands,
            point(&c["mapCenter"]),
            c["seaFirst"].as_bool().expect("bool"),
            i(&c["minSea"]) as f64,
            i(&c["maxSea"]) as f64,
            &h,
        );
        let got: Vec<HexCoord> = cands.iter().map(|x| x.h).collect();
        assert_eq!(got, hexes(&c["order"]), "{} {c}", s(&c["map"]));
    }
}

#[test]
fn sort_spawn_candidates_with_spread_bias_matches_web() {
    let h = WebHooks;
    for c in cases("sortSpread") {
        let mut cands: Vec<SpawnLandCandidate> = c["cands"]
            .as_array()
            .expect("cands")
            .iter()
            .map(candidate_of)
            .collect();
        sort_spawn_candidates_with_spread_bias(
            &mut cands,
            point(&c["mapCenter"]),
            &hexes(&c["prior"]),
            &bbox_of_json(&c["bbox"]),
            i(&c["spreadN"]),
            c["seaFirst"].as_bool().expect("bool"),
            i(&c["minSea"]) as f64,
            i(&c["maxSea"]) as f64,
            &h,
        );
        let got: Vec<HexCoord> = cands.iter().map(|x| x.h).collect();
        assert_eq!(got, hexes(&c["order"]), "{} {c}", s(&c["map"]));
    }
}

#[test]
fn pick_tied_spawn_land_candidate_matches_web() {
    for c in cases("pickTied") {
        let cands: Vec<SpawnLandCandidate> = c["cands"]
            .as_array()
            .expect("cands")
            .iter()
            .map(candidate_of)
            .collect();
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            pick_tied_spawn_land_candidate(&cands, &mut f)
        };
        assert_eq!(got, opt_hex(&c["result"]), "{c}");
        check_rand(&rc, c, "pickTied");
    }
}

#[test]
fn player_start_candidates_match_web() {
    let h = WebHooks;
    for c in cases("playerCands") {
        let id = s(&c["map"]);
        let (_, cache) = cache_of(id);
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let got = player_start_candidates_on_masses(
            map_of(id),
            &cache,
            sea.as_ref(),
            i(&c["minSea"]) as f64,
            c["requireSeaGate"].as_bool().expect("bool"),
            &h,
        );
        assert_eq!(got.len(), u(&c["count"]), "{id} {c}");
        let line = |x: &SpawnLandCandidate| {
            format!(
                "{},{},{},{},{},{},{}",
                x.h.q, x.h.r, x.land.ratio, x.land.land_count, x.land.total_count, x.dev, x.sea
            )
        };
        let digest = fnv1a64(&got.iter().map(line).collect::<Vec<_>>().join(";"));
        assert_eq!(digest, s(&c["fnv"]), "{id} {c}");
    }
}

#[test]
fn pick_player_cluster_center_matches_web() {
    let h = WebHooks;
    let mut some = 0;
    for c in cases("pickPlayer") {
        let id = s(&c["map"]);
        let (masses, cache) = cache_of(id);
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            let arg = if s(&c["form"]) == "cache" {
                MassesOrCache::Cache(&cache)
            } else {
                MassesOrCache::Masses(&masses)
            };
            pick_player_cluster_center(
                map_of(id),
                arg,
                &ladowe_of(id),
                center_of(id),
                &mut f,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                &h,
            )
        };
        assert_eq!(got, opt_hex(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "pickPlayer");
        some += usize::from(got.is_some());
    }
    assert!(some > 40, "za malo niepustych wynikow: {some}");
}

#[test]
fn pick_best_local_land_spawn_matches_web() {
    let h = WebHooks;
    let mut some = 0;
    for c in cases("pickBestLocal") {
        let id = s(&c["map"]);
        let (_, cache) = cache_of(id);
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let with_rand = c["withRand"].as_bool().expect("bool");
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            let r: Option<&mut dyn FnMut() -> f64> = if with_rand { Some(&mut f) } else { None };
            pick_best_local_land_spawn(
                map_of(id),
                &hexes(&c["pool"]),
                &hexes(&c["existing"]),
                i(&c["minDist"]) as f64,
                &cache,
                r,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                &h,
            )
        };
        assert_eq!(got, opt_hex(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "pickBestLocal");
        some += usize::from(got.is_some());
    }
    assert!(some > 50, "za malo niepustych wynikow: {some}");
}

#[test]
fn voronoi_and_centroid_match_web() {
    for c in cases("voronoi") {
        let got = assign_voronoi_regions(&hexes(&c["ladowe"]), &hexes(&c["centers"]));
        if c["throws"].as_bool().expect("bool") {
            assert!(
                got.is_none(),
                "web rzuca TypeError => None: {}",
                s(&c["map"])
            );
        } else {
            let regs = got.expect("web nie rzuca");
            let sizes: Vec<usize> = regs.iter().map(Vec::len).collect();
            let want: Vec<usize> = c["sizes"]
                .as_array()
                .expect("sizes")
                .iter()
                .map(u)
                .collect();
            assert_eq!(sizes, want);
            let fnv = fnv1a64(
                &regs
                    .iter()
                    .map(|r| digest_hexes(r))
                    .collect::<Vec<_>>()
                    .join("|"),
            );
            assert_eq!(fnv, s(&c["fnv"]));
        }
    }
    for c in cases("centroid") {
        let mass = hexes(&c["mass"]);
        let got = mass_centroid(&mass);
        assert_f64(got.q, fv(&c["q"]), "centroid q");
        assert_f64(got.r, fv(&c["r"]), "centroid r");
    }
}

#[test]
fn pick_center_in_mass_matches_web() {
    for c in cases("pickCenterInMass") {
        let id = s(&c["map"]);
        let (masses, _) = cache_of(id);
        let mass = &masses[u(&c["massIndex"])];
        assert_eq!(digest_hexes(mass), s(&c["massFnv"]), "{id}: ta sama masa");
        let with_rand = c["withRand"].as_bool().expect("bool");
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            let r: Option<&mut dyn FnMut() -> f64> = if with_rand { Some(&mut f) } else { None };
            pick_center_in_mass(
                mass,
                &hexes(&c["existing"]),
                i(&c["minDist"]) as f64,
                opt_hex(&c["preferNear"]),
                r,
            )
        };
        assert_eq!(got, opt_hex(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "pickCenterInMass");
    }
}

#[test]
fn pick_center_in_mass_with_land_gate_matches_web() {
    let h = WebHooks;
    let mut some = 0;
    for c in cases("pickCenterGate") {
        let id = s(&c["map"]);
        let (masses, cache) = cache_of(id);
        let mass = &masses[u(&c["massIndex"])];
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let with_rand = c["withRand"].as_bool().expect("bool");
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            let r: Option<&mut dyn FnMut() -> f64> = if with_rand { Some(&mut f) } else { None };
            pick_center_in_mass_with_land_gate(
                map_of(id),
                mass,
                &hexes(&c["existing"]),
                i(&c["minDist"]) as f64,
                &cache,
                opt_hex(&c["preferNear"]),
                r,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                &h,
            )
        };
        assert_eq!(got, opt_hex(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "pickCenterGate");
        some += usize::from(got.is_some());
    }
    assert!(some > 40, "za malo niepustych wynikow: {some}");
}

#[test]
fn pick_center_in_mass_spread_matches_web() {
    let h = WebHooks;
    let mut some = 0;
    let mut random_comparator_paths = 0;
    for c in cases("pickCenterSpread") {
        let id = s(&c["map"]);
        let (masses, cache) = cache_of(id);
        let mass = &masses[u(&c["massIndex"])];
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let with_rand = c["withRand"].as_bool().expect("bool");
        let bbox = if c["bbox"].is_null() {
            None
        } else {
            Some(bbox_of_json(&c["bbox"]))
        };
        let spread = opt_i(&c["nNeeded"]).map(|n| ClusterSpreadOpts { n_needed: n });
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            let r: Option<&mut dyn FnMut() -> f64> = if with_rand { Some(&mut f) } else { None };
            pick_center_in_mass_spread(
                map_of(id),
                mass,
                &hexes(&c["existing"]),
                i(&c["minDist"]) as f64,
                &cache,
                r,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                bbox.as_ref(),
                spread,
                &h,
            )
        };
        assert_eq!(got, opt_hex(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "pickCenterSpread");
        some += usize::from(got.is_some());
        // komparator losuje => liczba wywolan rand() > 1 swiadczy o przejsciu przez sortowanie
        random_comparator_paths += usize::from(rc.calls > 1);
    }
    assert!(some > 100, "za malo niepustych wynikow: {some}");
    assert!(
        random_comparator_paths > 40,
        "za malo przypadkow z losowym komparatorem: {random_comparator_paths}"
    );
}

#[test]
fn pick_center_on_land_pool_spread_matches_web() {
    let h = WebHooks;
    let mut some = 0;
    for c in cases("pickCenterPool") {
        let id = s(&c["map"]);
        let (_, cache) = cache_of(id);
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let bbox = LandBBox::from_hexes(&ladowe_of(id));
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            pick_center_on_land_pool_spread(
                map_of(id),
                &hexes(&c["pool"]),
                &hexes(&c["existing"]),
                i(&c["minDist"]) as f64,
                &cache,
                &mut f,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                Some(&bbox),
                Some(ClusterSpreadOpts {
                    n_needed: i(&c["nNeeded"]),
                }),
                &h,
            )
        };
        assert_eq!(got, opt_hex(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "pickCenterPool");
        some += usize::from(got.is_some());
    }
    assert!(some > 40, "za malo niepustych wynikow: {some}");
}

#[test]
fn balance_and_enforce_match_web() {
    let h = WebHooks;
    let mut moved = 0;
    for c in cases("balance") {
        let id = s(&c["map"]);
        let (_, cache) = cache_of(id);
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let lad = ladowe_of(id);
        let bbox = LandBBox::from_hexes(&lad);
        let centers = hexes(&c["centers"]);
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            balance_cluster_spread(
                map_of(id),
                &centers,
                &lad,
                &cache,
                i(&c["minDist"]) as f64,
                &mut f,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                &bbox,
                opt_i(&c["maxIterations"]),
                Some(ClusterSpreadOpts {
                    n_needed: i(&c["nNeeded"]),
                }),
                &h,
            )
        };
        assert_eq!(got, hexes(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "balance");
        moved += usize::from(got != centers);
    }
    assert!(
        moved > 10,
        "balance powinien przesuwac srodki w czesci przypadkow: {moved}"
    );
    let mut moved = 0;
    for c in cases("enforce") {
        let id = s(&c["map"]);
        let (_, cache) = cache_of(id);
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let lad = ladowe_of(id);
        let bbox = LandBBox::from_hexes(&lad);
        let centers = hexes(&c["centers"]);
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            enforce_quarter_spread_on_centers(
                map_of(id),
                &centers,
                &lad,
                &cache,
                i(&c["minDist"]) as f64,
                &mut f,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                &bbox,
                i(&c["nNeeded"]),
                &h,
            )
        };
        assert_eq!(got, hexes(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "enforce");
        moved += usize::from(got != centers);
    }
    assert!(
        moved > 5,
        "enforce powinien przesuwac srodki w czesci przypadkow: {moved}"
    );
}

#[test]
fn place_cluster_centers_across_landmasses_matches_web() {
    let h = WebHooks;
    let rows = cases("place");
    assert!(rows.len() > 100);
    let mut full = 0;
    let mut short = 0;
    for c in rows {
        let id = s(&c["map"]);
        let rp = rep(id);
        let (_, cache) = if c.get("empty").is_some() {
            (Vec::new(), mass_land_cache_from_masses(Vec::new()))
        } else {
            cache_of(id)
        };
        let lad = if c.get("empty").is_some() {
            Vec::new()
        } else {
            ladowe_of(id)
        };
        let sea = sea_opt(c["useSea"].as_bool().expect("bool"), id);
        let bounds = MapBounds {
            min_q: 0,
            max_q: i(&rp["w"]) as i32 - 1,
            min_r: 0,
            max_r: i(&rp["h"]) as i32 - 1,
        };
        let mut rc = CountedRand::new(i(&c["seed"]));
        let got = {
            let mut f = || rc.draw();
            place_cluster_centers_across_landmasses(
                map_of(id),
                &lad,
                &cache,
                i(&c["nNeeded"]),
                i(&c["minDistBase"]) as f64,
                center_of(id),
                &mut f,
                i(&c["margin"]) as f64,
                bounds,
                sea.as_ref(),
                i(&c["minSea"]) as f64,
                &h,
            )
        };
        assert_eq!(got, hexes(&c["result"]), "{id} {c}");
        check_rand(&rc, c, "place");
        if (got.len() as i64) >= i(&c["nNeeded"]) {
            full += 1;
        } else {
            short += 1;
        }
    }
    assert!(full > 20, "za malo pelnych rozmieszczen: {full}");
    assert!(
        short > 5,
        "za malo przypadkow niepelnych (sciezki awaryjne): {short}"
    );
}
