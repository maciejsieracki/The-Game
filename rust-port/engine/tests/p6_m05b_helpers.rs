//! P6.M05B - funkcje pomocnicze pasm gorskich i odzysku ladu: `walkMountainRange`,
//! `walkMountainRangeAvoiding`, `mountainRangeSeedCandidates`, `bfsExpandExclusion`,
//! `isExcludedForRegrow`, `findSameTerrainClusters`, `connectedComponentsWithin`,
//! `capMountainRangeClusterSize`, `regrowLostMountainClusters` (gen-helpers.ts:2573-2965).
//! Wektory z URUCHOMIONEGO weba (generator `gen-m05b-vectors.mjs`).

#[path = "p6_m05b_vectors/common.rs"]
mod common;

use std::collections::HashSet;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::relief::{
    bfs_expand_exclusion, cap_mountain_range_cluster_size, connected_components_within,
    find_same_terrain_clusters, is_excluded_for_regrow, mountain_range_seed_candidates,
    regrow_lost_mountain_clusters, walk_mountain_range, walk_mountain_range_avoiding,
};
use common::{
    assert_f64, build_state, cases, dims, dump, fv, key_set, keys_of, make_rand, seed_of, stat,
    terrain_from, tier_from,
};
use serde_json::{json, Value};

#[test]
fn regrow_lost_mountain_clusters_matches_web() {
    let cs = cases("regrow");
    assert!(cs.len() >= 24, "za malo przypadkow regrow: {}", cs.len());
    let mut recovered_cases = 0;
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let (mut hexes, scratch) = build_state(&c["map"]);
        assert_eq!(dump(&hexes), c["input"], "{id}: stan wejsciowy");
        let tier = tier_from(c["tier"].as_str().expect("tier"));
        let _ = tier;
        let (w, h) = dims(c);
        let masses: Vec<Vec<String>> = c["masses"]
            .as_array()
            .expect("masses")
            .iter()
            .map(keys_of)
            .collect();
        let mut rand = make_rand(seed_of(c));
        let ret = regrow_lost_mountain_clusters(
            &mut hexes,
            &scratch,
            w,
            h,
            &mut rand,
            &masses,
            fv(&c["mtnTh"]),
            fv(&c["hiTh"]),
            c["deficit"].as_f64().expect("deficit"),
        );
        let out = &c["output"];
        assert_f64(ret, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hexes), out["state"], "{id}: stan");
        assert_f64(rand(), fv(&out["rngNext"]), &format!("{id}: rand"));
        if ret > 0.0 {
            recovered_cases += 1;
        }
    }
    assert!(
        recovered_cases >= 15,
        "odzysk: przypadki z ret>0 = {recovered_cases}"
    );
    assert!(stat("regrowRecovered") >= 15);
}

#[test]
fn helper_functions_match_web() {
    let cs = cases("helpers");
    assert!(cs.len() >= 60, "za malo przypadkow helpers: {}", cs.len());
    let mut seen = std::collections::BTreeMap::<String, usize>::new();
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let fname = c["fn"].as_str().expect("fn");
        *seen.entry(fname.to_string()).or_default() += 1;
        let (mut hexes, scratch) = build_state(&c["map"]);
        assert_eq!(dump(&hexes), c["input"], "{id}: stan wejsciowy");
        let tier = tier_from(c["tier"].as_str().expect("tier"));
        let _ = tier;
        let (w, h) = dims(c);
        let mut rand = make_rand(seed_of(c));
        let args = &c["args"];
        let out = &c["output"];
        match fname {
            "walk" => {
                let start = args["start"].as_str().expect("start");
                let steps = args["steps"].as_u64().expect("steps") as usize;
                let path = walk_mountain_range(&hexes, &scratch, w, h, &mut rand, start, steps);
                assert_eq!(keys_of(&out["path"]), path, "{id}: sciezka");
                assert_f64(rand(), fv(&out["rngNext"]), &format!("{id}: rand"));
            }
            "walkAvoid" => {
                let start = args["start"].as_str().expect("start");
                let steps = args["steps"].as_u64().expect("steps") as usize;
                let ex_g = key_set(&args["exG"]);
                let ex_w = key_set(&args["exW"]);
                let path = walk_mountain_range_avoiding(
                    &hexes,
                    &scratch,
                    w,
                    h,
                    &mut rand,
                    start,
                    steps,
                    fv(&args["mtnTh"]),
                    fv(&args["hiTh"]),
                    &ex_g,
                    &ex_w,
                );
                assert_eq!(keys_of(&out["path"]), path, "{id}: sciezka (omijanie)");
                assert_f64(rand(), fv(&out["rngNext"]), &format!("{id}: rand"));
            }
            "seeds" => {
                let mass = keys_of(&args["mass"]);
                let cands =
                    mountain_range_seed_candidates(&mass, &hexes, &scratch, w, h, &mut rand);
                let expected: Vec<Vec<String>> = out["cands"]
                    .as_array()
                    .expect("cands")
                    .iter()
                    .map(|p| vec![p[0].as_str().unwrap().to_string()])
                    .collect();
                let got: Vec<Vec<String>> = cands.iter().map(|(k, _)| vec![k.clone()]).collect();
                assert_eq!(got, expected, "{id}: kolejnosc kandydatow");
                for (i, (_, n)) in cands.iter().enumerate() {
                    assert_f64(
                        *n,
                        fv(&out["cands"][i][1]),
                        &format!("{id}: szum kandydata {i}"),
                    );
                }
                assert_f64(rand(), fv(&out["rngNext"]), &format!("{id}: rand"));
            }
            "bfs" => {
                let mut ex_g: HashSet<String> = HashSet::new();
                let mut ex_w: HashSet<String> = HashSet::new();
                let src = keys_of(&args["sources"]);
                bfs_expand_exclusion(&hexes, &mut ex_g, &src, args["minDist"].as_f64().unwrap());
                let src_w = keys_of(&args["sourcesW"]);
                bfs_expand_exclusion(
                    &hexes,
                    &mut ex_w,
                    &src_w,
                    args["minDistW"].as_f64().unwrap(),
                );
                let mut got_g: Vec<String> = ex_g.into_iter().collect();
                got_g.sort();
                let mut got_w: Vec<String> = ex_w.into_iter().collect();
                got_w.sort();
                assert_eq!(got_g, keys_of(&out["excludedG"]), "{id}: wykluczone (Gory)");
                assert_eq!(
                    got_w,
                    keys_of(&out["excludedW"]),
                    "{id}: wykluczone (Wzgorza)"
                );
            }
            "clusters" => {
                let ter: Terrain = terrain_from(args["terrain"].as_str().expect("terrain"));
                let clusters = find_same_terrain_clusters(&hexes, ter);
                let got: Value = Value::Array(clusters.iter().map(|c| json!(c)).collect());
                assert_eq!(got, out["clusters"], "{id}: skupiska (kolejnosc DFS)");
                if let Some(first) = clusters.first() {
                    let set: HashSet<String> = first.iter().cloned().collect();
                    let comps = connected_components_within(&set);
                    let comps_json = Value::Array(comps.iter().map(|c| json!(c)).collect());
                    assert_eq!(comps_json, out["comps"], "{id}: skladowe");
                }
            }
            "capCluster" => {
                let ter = terrain_from(args["terrain"].as_str().expect("terrain"));
                let max = args["maxSize"].as_f64().expect("maxSize");
                let rev = cap_mountain_range_cluster_size(
                    &mut hexes,
                    &scratch,
                    ter,
                    Terrain::Plains,
                    max,
                );
                assert_f64(rev, fv(&out["ret"]), &format!("{id}: liczba cofnietych"));
                assert_eq!(dump(&hexes), out["state"], "{id}: stan po przycieciu");
            }
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }
    for name in [
        "walk",
        "walkAvoid",
        "seeds",
        "bfs",
        "clusters",
        "capCluster",
    ] {
        assert!(
            seen.get(name).copied().unwrap_or(0) >= 5,
            "pokrycie: {name}"
        );
    }
}

#[test]
fn is_excluded_for_regrow_follows_per_type_zones() {
    // Strefa zakazana wg PROSPEKTYWNEGO typu (web isExcludedForRegrow, :2727).
    let gory: HashSet<String> = HashSet::from(["1,1".to_string()]);
    let wz: HashSet<String> = HashSet::from(["2,2".to_string()]);
    // n > mtn (0.5): typ Gory -> sprawdza tylko strefe Gor.
    assert!(is_excluded_for_regrow("1,1", 0.9, 0.5, 0.3, &gory, &wz));
    assert!(!is_excluded_for_regrow("2,2", 0.9, 0.5, 0.3, &gory, &wz));
    // hi < n <= mtn: typ Wzgorza -> sprawdza tylko strefe Wzgorz.
    assert!(is_excluded_for_regrow("2,2", 0.4, 0.5, 0.3, &gory, &wz));
    assert!(!is_excluded_for_regrow("1,1", 0.4, 0.5, 0.3, &gory, &wz));
    // n <= hi: brak wykluczenia.
    assert!(!is_excluded_for_regrow("1,1", 0.2, 0.5, 0.3, &gory, &wz));
}
