//! P6.M07A partia 3 - `rivers_a/grow.rs` i `rivers_a/profile.rs` wzgledem wektorow z URUCHOMIONEGO
//! weba (pin `edb8fb56`, gen-helpers.ts:5669-5752, :5819-5842, :5903-5974, :6070-6172, :6988-7036,
//! :8975-9056). Wektory: `p6_m07a_vectors/web-rivers-a-grow.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-grow.mjs`.
//! Mapy: `maps` (indeks w przypadku); ostatnia mapa 100x80 (cap 6000, `bigCap`).
//! Score kandydata: JS `String(x)` (`inf`/`-inf` dla nieskonczonosci).

#[path = "p6_m07a_vectors/common.rs"]
mod common;

use std::collections::{HashMap, HashSet};

use civ_engine::domain::mapgen::landsea::ocean_connected_water_keys;
use civ_engine::domain::mapgen::relief::continent_center_square;
use civ_engine::domain::mapgen::rivers_a::fields::{
    build_open_ocean_distance_field, build_sea_distance_field,
};
use civ_engine::domain::mapgen::rivers_a::grow::{
    collect_inland_drain_grow_candidates, grow_river_inland_before_drainage,
    is_river_window_turn_allowed, nearest_river_hex_distance, neighbor_dir_index,
    path_segment_dirs, path_signed_turn_deltas, river_grow_step_passes_sep, signed_river_dir_delta,
    GrowCandidate, InlandDrainGrowOpts, InlandGrowParams, RiverHexSpatialIndex,
};
use civ_engine::domain::mapgen::rivers_a::profile::{
    format_river_profile_text, js_to_fixed, river_profile_hook, RiverProfileStats,
};
use civ_engine::domain::mapgen::rivers_a::walk::{
    estimate_land_centroid_from_seed, CENTROID_VISIT_CAP,
};
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::terrain_class::HexRecord;
use civ_engine::domain::rng::Mulberry32;
use common::{build_map, path_json, path_of};
use serde_json::Value;

const GROW: &str = include_str!("p6_m07a_vectors/web-rivers-a-grow.json");

fn doc() -> Value {
    serde_json::from_str(GROW).expect("wektory grow parsuja sie")
}

fn cases<'a>(root: &'a Value, kind: &str) -> &'a Vec<Value> {
    root["cases"][kind]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {kind}"))
}

/// Liczba JS zapisana jako string (`String(x)`, `inf`, `-inf`).
fn num(s: &str) -> f64 {
    match s {
        "inf" => f64::INFINITY,
        "-inf" => f64::NEG_INFINITY,
        other => other.parse().unwrap_or_else(|_| panic!("liczba: {other}")),
    }
}

fn point(v: &Value) -> Option<(f64, f64)> {
    if v.is_null() {
        return None;
    }
    let a = v.as_array().expect("punkt");
    Some((
        num(a[0].as_str().expect("q")),
        num(a[1].as_str().expect("r")),
    ))
}

fn keys_of(root: &Value, idx: usize) -> Vec<String> {
    root["maps"][idx]["rows"]
        .as_array()
        .expect("rows")
        .iter()
        .map(|r| r[0].as_str().expect("klucz").to_string())
        .collect()
}

fn key_set(v: &Value) -> HashSet<String> {
    v.as_array()
        .map(|a| {
            a.iter()
                .map(|k| k.as_str().expect("klucz").to_string())
                .collect()
        })
        .unwrap_or_default()
}

/// Pola odleglosci dla mapy (web: buildSeaDistanceField, buildOpenOceanDistanceField).
fn fields_for(root: &Value, idx: usize) -> (HexRecord, HashMap<String, i64>, HashMap<String, i64>) {
    let hexes = build_map(root, idx);
    let (w, h) = (
        root["maps"][idx]["w"].as_i64().expect("w"),
        root["maps"][idx]["h"].as_i64().expect("h"),
    );
    let sea = build_sea_distance_field(&hexes);
    let oc = ocean_connected_water_keys(&hexes, w, h);
    let od = build_open_ocean_distance_field(&hexes, w, h, Some(&oc));
    (hexes, sea, od)
}

#[test]
fn grow_matches_web() {
    let root = doc();
    let cs = cases(&root, "grow");
    assert_eq!(cs.len(), 1296, "liczba przypadkow grow");
    let mut grown = 0usize;
    for c in cs {
        let idx = c["map"].as_u64().expect("map") as usize;
        let (hexes, sea, od) = fields_for(&root, idx);
        let keys = keys_of(&root, idx);
        let square = if c["square"].as_bool().expect("square") {
            continent_center_square(&hexes, &keys, None)
        } else {
            None
        };
        let block = c["block"].as_array().map(|_| key_set(&c["block"]));
        let mut rng = Mulberry32::new(c["seed"].as_u64().expect("seed") as u32);
        let mut rand = || rng.next_f64();
        let growth_max = c["growthMax"].as_u64().map(|v| v as usize);
        let params = InlandGrowParams {
            sq: c["sq"].as_i64().expect("sq"),
            sr: c["sr"].as_i64().expect("sr"),
            sea_dist: &sea,
            open_ocean_dist: &od,
            inland_target_len: c["target"].as_u64().expect("target") as usize,
            step_cap: c["cap"].as_u64().expect("cap") as usize,
            hard_meander_len: c["hard"].as_u64().expect("hard") as usize,
            allow_relief_traversal: c["allowRelief"].as_bool().expect("allowRelief"),
            relax_sea_buffer: c["relaxSea"].as_bool().expect("relaxSea"),
            inland_growth_max: growth_max,
            block_river_keys: block.as_ref(),
            min_path_sep: c["minSep"].as_i64().expect("minSep"),
            land_centroid: point(&c["centroid"]),
            land_center_square: square.as_ref(),
        };
        let got = grow_river_inland_before_drainage(&hexes, &params, &mut rand);
        assert_eq!(path_json(&got), c["ret"], "grow: {c}");
        if got.len() > 1 {
            grown += 1;
        }
    }
    // Pokrycie: znaczaca czesc przypadkow faktycznie rosnie (nie tylko pierwszy heks).
    assert!(grown > 400, "za malo przypadkow z wzrostem: {grown}");
}

#[test]
fn collect_candidates_match_web_scores() {
    let root = doc();
    let cs = cases(&root, "collect");
    assert_eq!(
        cs.len(),
        496,
        "400 losowych + 96 brzegowych (cur poza mapa)"
    );
    let mut with_candidates = 0usize;
    for c in cs {
        let idx = c["map"].as_u64().expect("map") as usize;
        let (hexes, sea, od) = fields_for(&root, idx);
        let keys = keys_of(&root, idx);
        let path: Vec<RiverCoord> = path_of(&c["path"]);
        let cur = *path.last().expect("sciezka");
        let src_key = c["srcKey"].as_str().expect("srcKey").to_string();
        let square = if c["square"].as_bool().expect("square") {
            continent_center_square(&hexes, &keys, None)
        } else {
            None
        };
        let block = c["block"].as_array().map(|_| key_set(&c["block"]));
        let mut rng = Mulberry32::new(c["seed"].as_u64().expect("seed") as u32);
        let mut rand = || rng.next_f64();
        let opts = InlandDrainGrowOpts {
            hexes: &hexes,
            path: &path,
            cur,
            src_key: &src_key,
            sea_dist: &sea,
            open_ocean_dist: &od,
            land_centroid: point(&c["centroid"]),
            land_center_square: square.as_ref(),
            block_river_keys: block.as_ref(),
            sep_index: None,
            min_path_sep: c["minSep"].as_i64().expect("minSep"),
            allow_relief_traversal: c["allowRelief"].as_bool().expect("allowRelief"),
            hard_meander: c["hardMeander"].as_bool().expect("hardMeander"),
            relax_hard_meander: c["relaxHard"].as_bool().expect("relaxHard"),
            relax_sea_buffer: c["relaxSea"].as_bool().expect("relaxSea"),
        };
        let got: Vec<GrowCandidate> = collect_inland_drain_grow_candidates(&opts, &mut rand);
        let want: Vec<(i64, i64, f64)> = c["ret"]
            .as_array()
            .expect("ret")
            .iter()
            .map(|t| {
                (
                    t[0].as_i64().expect("q"),
                    t[1].as_i64().expect("r"),
                    num(t[2].as_str().expect("score")),
                )
            })
            .collect();
        assert_eq!(got.len(), want.len(), "liczba kandydatow: {c}");
        for (g, w) in got.iter().zip(want.iter()) {
            assert_eq!((g.q, g.r), (w.0, w.1), "kandydat: {c}");
            // Dokladna rownosc bitowa: score liczony w tej samej kolejnosci dzialan co w webie.
            assert_eq!(g.score.to_bits(), w.2.to_bits(), "score: {c}");
        }
        if !got.is_empty() {
            with_candidates += 1;
        }
    }
    assert!(
        with_candidates > 100,
        "za malo przypadkow z kandydatami: {with_candidates}"
    );
}

#[test]
fn nearest_distance_and_index_match_web() {
    let root = doc();
    for c in cases(&root, "nearest") {
        let list: Vec<String> = c["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|k| k.as_str().expect("k").to_string())
            .collect();
        let set: HashSet<String> = list.iter().cloned().collect();
        let idx = RiverHexSpatialIndex::from_keys(list.iter().map(String::as_str));
        let sq = c["sq"].as_i64().expect("sq");
        let sr = c["sr"].as_i64().expect("sr");
        assert_eq!(
            idx.size() as u64,
            c["indexSize"].as_u64().expect("indexSize"),
            "rozmiar: {c}"
        );
        let brute = nearest_river_hex_distance(sq, sr, &set, None);
        let indexed = nearest_river_hex_distance(sq, sr, &set, Some(&idx));
        assert_eq!(
            brute,
            num(c["brute"].as_str().expect("brute")),
            "brute: {c}"
        );
        assert_eq!(
            indexed,
            num(c["indexed"].as_str().expect("indexed")),
            "indexed: {c}"
        );
    }
}

#[test]
fn river_sep_matches_web() {
    let root = doc();
    for c in cases(&root, "sep") {
        let list: Vec<String> = c["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|k| k.as_str().expect("k").to_string())
            .collect();
        let set: HashSet<String> = list.iter().cloned().collect();
        let idx = RiverHexSpatialIndex::from_keys(list.iter().map(String::as_str));
        let nq = c["nq"].as_i64().expect("nq");
        let nr = c["nr"].as_i64().expect("nr");
        let min_sep = c["minSep"].as_i64().expect("minSep");
        assert_eq!(
            river_grow_step_passes_sep(nq, nr, Some(&set), min_sep, None),
            c["ret"].as_bool().expect("ret"),
            "sep: {c}"
        );
        assert_eq!(
            river_grow_step_passes_sep(nq, nr, Some(&set), min_sep, Some(&idx)),
            c["retIndexed"].as_bool().expect("retIndexed"),
            "sep indexed: {c}"
        );
    }
    for c in cases(&root, "indexAdd") {
        let list: Vec<String> = c["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|k| k.as_str().expect("k").to_string())
            .collect();
        let mut idx = RiverHexSpatialIndex::default();
        for k in &list {
            idx.add_key(k);
        }
        assert_eq!(
            idx.size() as u64,
            c["size"].as_u64().expect("size"),
            "add: {c}"
        );
    }
}

#[test]
fn window_and_directions_match_web() {
    let root = doc();
    for c in cases(&root, "window") {
        let path: Vec<RiverCoord> = path_of(&c["path"]);
        for s in c["steps"].as_array().expect("steps") {
            let nq = s["nq"].as_i64().expect("nq");
            let nr = s["nr"].as_i64().expect("nr");
            assert_eq!(
                is_river_window_turn_allowed(&path, nq, nr),
                s["ret"].as_bool().expect("ret"),
                "okno: {c}"
            );
        }
        let seg = path_segment_dirs(&path);
        let want_seg: Vec<i64> = c["segDirs"]
            .as_array()
            .expect("segDirs")
            .iter()
            .map(|v| v.as_i64().expect("d"))
            .collect();
        assert_eq!(seg, want_seg, "segDirs: {c}");
        let want_turn: Vec<i64> = c["turnDeltas"]
            .as_array()
            .expect("turnDeltas")
            .iter()
            .map(|v| v.as_i64().expect("d"))
            .collect();
        assert_eq!(path_signed_turn_deltas(&seg), want_turn, "turnDeltas: {c}");
    }
    for c in cases(&root, "dirs") {
        let a = c["a"].as_i64().expect("a");
        let b = c["b"].as_i64().expect("b");
        let ret = c["ret"].as_i64().expect("ret");
        match c["kind"].as_str().expect("kind") {
            "neighbor" => assert_eq!(neighbor_dir_index(0, 0, a, b), ret, "neighbor: {c}"),
            "signed" => assert_eq!(signed_river_dir_delta(a, b), ret, "signed: {c}"),
            other => panic!("nieznany rodzaj {other}"),
        }
    }
}

#[test]
fn big_map_cap_6000_discriminates_and_matches_web() {
    // Web `visitCap = 6000` (gen-helpers.ts:5988); stala uzywana przez grow (domyslny cap centroidu).
    assert_eq!(CENTROID_VISIT_CAP, 6000);
    let root = doc();
    let big = root["meta"]["bigMapIndex"].as_u64().expect("bigMapIndex") as usize;
    let hexes = build_map(&root, big);
    assert_eq!(hexes.iter().count(), 8000, "mapa 100x80");
    type CapRow = (u64, Option<(f64, f64)>);
    let mut seen_pairs: HashMap<(i64, i64), Vec<CapRow>> = HashMap::new();
    for c in cases(&root, "bigCap") {
        let sq = c["sq"].as_i64().expect("sq");
        let sr = c["sr"].as_i64().expect("sr");
        let cap = c["cap"].as_u64().expect("cap") as usize;
        let got = estimate_land_centroid_from_seed(&hexes, sq, sr, false, cap);
        assert_eq!(got, point(&c["ret"]), "cap {cap} start {sq},{sr}");
        seen_pairs
            .entry((sq, sr))
            .or_default()
            .push((cap as u64, got));
    }
    // Granica 6000 (N-1/N/N+1 = 5999/6000/6001): na starcie (50,40) wszystkie trzy daja rozne wyniki.
    let v = &seen_pairs[&(50, 40)];
    let at = |cap: u64| v.iter().find(|(c, _)| *c == cap).expect("cap").1;
    assert_ne!(at(5999), at(6000), "cap 5999 vs 6000 musi sie roznic");
    assert_ne!(at(6000), at(6001), "cap 6000 vs 6001 musi sie roznic");
}

#[test]
fn profile_format_and_to_fixed_match_web() {
    let root = doc();
    for c in cases(&root, "toFixed") {
        let x = num(c["x"].as_str().expect("x"));
        let d = c["d"].as_u64().expect("d") as usize;
        assert_eq!(
            js_to_fixed(x, d),
            c["ret"].as_str().expect("ret"),
            "toFixed: {c}"
        );
    }
    for c in cases(&root, "profile") {
        let total = c["total"].as_f64();
        let stats = if c["stats"].is_null() {
            None
        } else {
            Some(stats_from(&c["stats"]))
        };
        assert_eq!(
            format_river_profile_text(stats.as_ref(), total),
            c["ret"].as_str().expect("ret"),
            "profil: {c}"
        );
    }
}

/// Flaga: tylko wartosc "1" wlacza profiler (web `process.env.CIV_RIVER_PROFILE === '1'`).
/// Wylaczony hook nic nie zapisuje (wynik generatora nietkniety). Jedyny test czytajacy/ustawiajacy env.
#[test]
fn profile_flag_is_exact_one_and_hook_is_gated() {
    use civ_engine::domain::mapgen::rivers_a::profile::{
        get_river_profile_stats, reset_river_profile_stats, river_profile_on,
    };
    std::env::set_var("CIV_RIVER_PROFILE", "0");
    assert!(!river_profile_on());
    river_profile_hook(|s| s.trace_river_calls += 1);
    assert!(
        get_river_profile_stats().is_none(),
        "wylaczony hook nic nie zapisuje"
    );
    std::env::set_var("CIV_RIVER_PROFILE", "true");
    assert!(!river_profile_on(), "'true' != '1'");
    std::env::set_var("CIV_RIVER_PROFILE", "1");
    assert!(river_profile_on());
    river_profile_hook(|s| s.trace_river_calls += 2);
    assert_eq!(
        get_river_profile_stats().map(|s| s.trace_river_calls),
        Some(2)
    );
    reset_river_profile_stats();
    std::env::remove_var("CIV_RIVER_PROFILE");
}

fn stats_from(s: &Value) -> RiverProfileStats {
    let f = |k: &str| s[k].as_f64().expect(k);
    let u = |k: &str| s[k].as_u64().expect(k);
    RiverProfileStats {
        field_cache_ms: f("fieldCacheMs"),
        field_cache_calls: u("fieldCacheCalls"),
        generate_rivers_ms: f("generateRiversMs"),
        gen_stage1_ms: f("genStage1Ms"),
        gen_stage2_ms: f("genStage2Ms"),
        gen_stage3_ms: f("genStage3Ms"),
        gen_decor_ms: f("genDecorMs"),
        gen_dry_patch_ms: f("genDryPatchMs"),
        gen_stage2_rounds: u("genStage2Rounds"),
        top_up_ms: f("topUpMs"),
        top_up_pass_ms: s["topUpPassMs"]
            .as_array()
            .expect("pass")
            .iter()
            .map(|v| v.as_f64().expect("ms"))
            .collect(),
        top_up_hard_starts_ms: f("topUpHardStartsMs"),
        top_up_dry_patch_ms: f("topUpDryPatchMs"),
        top_up_grid_prox_ms: f("topUpGridProxMs"),
        trace_river_calls: u("traceRiverCalls"),
        trace_river_ms: f("traceRiverMs"),
        a_star_calls: u("aStarCalls"),
        a_star_ms: f("aStarMs"),
        force_fill_calls: u("forceFillCalls"),
    }
}
