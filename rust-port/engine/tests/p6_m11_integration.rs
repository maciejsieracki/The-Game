//! P6.M11 - integracja z M10: PRAWDZIWA implementacja cechy `ClusterLayoutHooks`
//! (`cluster_layout::HOOKS`) zastepuje testowa `WebHooks` z M10 i daje te same wyniki na
//! WEKTORACH M10 z uruchomionego weba (`p6_m10_vectors/web-vectors.json`, tylko odczyt):
//! 1221 wektorow kategorii `hooks`, sortowania kandydatow oraz pelne rozmieszczenie srodkow
//! (`place`, wszystkie fazy). Zero zmian w plikach M10.

#[path = "p6_m10_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::mapgen::cluster_layout::HOOKS;
use civ_engine::domain::mapgen::cluster_mass::{
    group_habitable_masses, mass_land_cache_from_masses, place_cluster_centers_across_landmasses,
    sort_spawn_candidates_with_spread_bias, sort_spawn_land_candidates, ClusterLayoutHooks,
    MapBounds, SeaDist, SpawnLandCandidate,
};
use civ_engine::domain::mapgen::cluster_rivals::PointF64;
use common::*;
use serde_json::Value;

fn point(v: &Value) -> PointF64 {
    PointF64 {
        q: fv(&v[0]),
        r: fv(&v[1]),
    }
}

#[test]
fn m11_hooks_match_m10_web_hook_vectors() {
    let rows = cases("hooks");
    assert!(rows.len() > 1000);
    let mut kinds = std::collections::BTreeSet::new();
    for c in rows {
        kinds.insert(s(&c["kind"]).to_string());
        match s(&c["kind"]) {
            "quad" => assert_eq!(
                HOOKS.land_quadrant_index(
                    i(&c["q"]) as i32,
                    i(&c["r"]) as i32,
                    fv(&c["midQ"]),
                    fv(&c["midR"])
                ),
                u(&c["result"]),
                "{c}"
            ),
            "minQuarters" => assert_eq!(
                HOOKS.minimum_spread_quarters_required(i(&c["n"])),
                u(&c["result"]),
                "{c}"
            ),
            "bandPenalty" => assert_f64(
                HOOKS.capital_sea_band_penalty(fv(&c["sea"]), fv(&c["min"]), fv(&c["max"])),
                fv(&c["result"]),
                &c.to_string(),
            ),
            "countPerQuad" => {
                let got = HOOKS.count_centers_per_quadrant(
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
                let got = HOOKS.preferred_quadrants_for_spread(&arr, i(&c["nNeeded"]));
                let want: Option<Vec<usize>> = if c["result"].is_null() {
                    None
                } else {
                    Some(c["result"].as_array().expect("arr").iter().map(u).collect())
                };
                assert_eq!(got, want, "{c}");
            }
            "spread" => {
                let got = HOOKS.cluster_center_quadrant_spread(
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
                let got = HOOKS.min_capital_separation_distance(hex(&c["c"]), &hexes(&c["others"]));
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
                assert_f64(
                    HOOKS.sea_dist_at(&sea, q, r),
                    i(&c["at"]) as f64,
                    "seaDistAt",
                );
                assert_eq!(
                    HOOKS.passes_min_sea_dist_gate(&sea, q, r, i(&c["min"]) as f64),
                    c["result"].as_bool().expect("bool"),
                    "{c}"
                );
            }
            other => panic!("nieznany rodzaj hooka {other}"),
        }
    }
    assert_eq!(kinds.len(), 8, "rodzaje hookow: {kinds:?}");
}

#[test]
fn m11_hooks_reproduce_m10_candidate_sorting() {
    let spawn = cases("sortSpawn");
    let spread = cases("sortSpread");
    assert!(spawn.len() >= 100 && spread.len() >= 50);
    for c in spawn {
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
            &HOOKS,
        );
        let got: Vec<HexCoord> = cands.iter().map(|x| x.h).collect();
        assert_eq!(got, hexes(&c["order"]), "{} {c}", s(&c["map"]));
    }
    for c in spread {
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
            &HOOKS,
        );
        let got: Vec<HexCoord> = cands.iter().map(|x| x.h).collect();
        assert_eq!(got, hexes(&c["order"]), "{} {c}", s(&c["map"]));
    }
}

#[test]
fn m11_hooks_reproduce_m10_center_placement() {
    let rows = cases("place");
    assert!(rows.len() > 100);
    let (mut full, mut short) = (0, 0);
    for c in rows {
        let id = s(&c["map"]);
        let rp = rep(id);
        let empty = c.get("empty").is_some();
        let lad = if empty { Vec::new() } else { ladowe_of(id) };
        let cache = mass_land_cache_from_masses(if empty {
            Vec::new()
        } else {
            group_habitable_masses(&lad)
        });
        let sea = c["useSea"].as_bool().expect("bool").then(|| sea_of(id));
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
                &HOOKS,
            )
        };
        assert_eq!(got, hexes(&c["result"]), "{id} {c}");
        assert_eq!(rc.calls, u(&c["randCalls"]), "licznik rand {c}");
        if (got.len() as i64) >= i(&c["nNeeded"]) {
            full += 1;
        } else {
            short += 1;
        }
    }
    assert!(full > 20 && short > 5, "{full}/{short}");
}

/// Mapy wektorow M11 i M10 to te same swiaty (te same specyfikacje `generateMap` i ziarna).
#[test]
fn m11_and_m10_vector_maps_are_identical() {
    let m10: Value =
        serde_json::from_str(include_str!("p6_m10_vectors/web-vectors.json")).expect("m10");
    let m11: Value =
        serde_json::from_str(include_str!("p6_m11_vectors/web-vectors.json")).expect("m11");
    let (a, b) = (
        m10["maps"].as_object().unwrap(),
        m11["maps"].as_object().unwrap(),
    );
    assert_eq!(a.len(), b.len());
    for (k, va) in a {
        let vb = &b[k];
        for f in ["w", "h", "terrain", "river", "hexesFnv", "sea"] {
            assert_eq!(va[f], vb[f], "mapa {k} pole {f}");
        }
    }
}
