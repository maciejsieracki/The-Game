//! P6.M07A (partia 1) - `rivers_a.rs` wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`,
//! gen-helpers.ts:5121-6068). Wektory: `p6_m07a_vectors/web-rivers-a.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-vectors.mjs`.

#[path = "p6_m07a_vectors/common.rs"]
mod common;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::rivers_a::{
    assert_river_path_adjacent, build_river_field_cache, build_sea_distance_field,
    coastal_river_render_path, count_medium_inland_land_hexes, elevation_rank,
    land_river_render_path, main_river_coast_mouth_max_gap_for_dims, medium_river_render_path,
    medium_tributary_min_net_len, medium_tributary_spacing_hex, purge_ocean_inside_earth_land_mask,
    purge_stray_land_outside_earth_mask, repair_river_path_adjacency, river_path_has_revisited_hex,
    river_path_respects_sea_buffer, rivers_quota_for_land_mass, sanitize_river_path,
    split_adjacent_river_chains, RiverCoord, MAIN_RIVER_COAST_MOUTH_MAX_GAP,
    MAIN_RIVER_MIN_PATH_SEP, MEDIUM_TRIBUTARY_MIN_NET_LEN, MEDIUM_TRIBUTARY_SPACING_HEX,
    RIVER_HARD_MEANDER_LEN, RIVER_MIN_INLAND_FROM_SEA, RIVER_MIN_MAIN_LEN, RIVER_MOUTH_TAIL_LEN,
};
use common::{build_map, cases, dump_map, load, map_dims, path_json, path_of};
use serde_json::Value;

fn root() -> Value {
    load()
}

fn tier(name: &Value) -> DensityTier {
    match name.as_str() {
        Some("low") => DensityTier::Low,
        Some("medium") | None => DensityTier::Medium,
        Some("high") => DensityTier::High,
        Some(other) => panic!("nieznany tier: {other}"),
    }
}

#[test]
fn constants_match_web() {
    let r = root();
    let c = &cases(&r, "constants")[0];
    assert_eq!(
        c["RIVER_MIN_INLAND_FROM_SEA"].as_i64(),
        Some(RIVER_MIN_INLAND_FROM_SEA)
    );
    assert_eq!(
        c["RIVER_MIN_MAIN_LEN"].as_u64(),
        Some(RIVER_MIN_MAIN_LEN as u64)
    );
    assert_eq!(
        c["RIVER_HARD_MEANDER_LEN"].as_u64(),
        Some(RIVER_HARD_MEANDER_LEN as u64)
    );
    assert_eq!(
        c["RIVER_MOUTH_TAIL_LEN"].as_u64(),
        Some(RIVER_MOUTH_TAIL_LEN as u64)
    );
    assert_eq!(
        c["MAIN_RIVER_MIN_PATH_SEP"].as_i64(),
        Some(MAIN_RIVER_MIN_PATH_SEP)
    );
    assert_eq!(
        c["MEDIUM_TRIBUTARY_SPACING_HEX"].as_i64(),
        Some(MEDIUM_TRIBUTARY_SPACING_HEX)
    );
    assert_eq!(
        c["MEDIUM_TRIBUTARY_MIN_NET_LEN"].as_u64(),
        Some(MEDIUM_TRIBUTARY_MIN_NET_LEN as u64)
    );
    assert_eq!(
        c["MAIN_RIVER_COAST_MOUTH_MAX_GAP"].as_i64(),
        Some(MAIN_RIVER_COAST_MOUTH_MAX_GAP)
    );
    assert_eq!(
        medium_tributary_spacing_hex(1, 1),
        MEDIUM_TRIBUTARY_SPACING_HEX
    );
    // Progi zalezne od rozmiaru (web mediumTributaryMinNetLen / mainRiverCoastMouthMaxGapForDims).
    assert_eq!(medium_tributary_min_net_len(79, 200), 4);
    assert_eq!(medium_tributary_min_net_len(80, 200), 5);
    assert_eq!(medium_tributary_min_net_len(119, 300), 5);
    assert_eq!(medium_tributary_min_net_len(120, 300), 7);
    assert_eq!(medium_tributary_min_net_len(300, 120), 7);
}

#[test]
fn elevation_rank_matches_web_table() {
    let expected = [
        (Terrain::Sea, 0),
        (Terrain::ShallowSea, 1),
        (Terrain::Grassland, 2),
        (Terrain::Desert, 3),
        (Terrain::Plains, 4),
        (Terrain::Hills, 5),
        (Terrain::Mountains, 6),
        (Terrain::Polar, 2),
    ];
    for (t, rank) in expected {
        assert_eq!(elevation_rank(t), rank, "{t:?}");
    }
    let r = root();
    let c = &cases(&r, "constants")[0]["ELEVATION_RANK"];
    assert_eq!(c["morze"].as_u64(), Some(0));
    assert_eq!(c["plytkie_morze"].as_u64(), Some(1));
    assert_eq!(c["polarny"].as_u64(), Some(2));
    assert_eq!(c["gory"].as_u64(), Some(6));
}

#[test]
fn quota_matches_web_including_thresholds() {
    let r = root();
    let cs = cases(&r, "quota");
    assert!(cs.len() >= 150, "za malo przypadkow quota: {}", cs.len());
    for c in cs {
        let n = c["n"].as_u64().expect("n") as usize;
        let got = rivers_quota_for_land_mass(n, tier(&c["tier"]));
        assert_eq!(
            got,
            c["ret"].as_i64().expect("ret"),
            "n={n} tier={}",
            c["tier"]
        );
    }
}

#[test]
fn main_river_coast_mouth_gap_is_standard_outside_mala() {
    // mainRiverCoastMouthMaxGapForDims (web :5551): poza etykieta 'mala' zwraca stala 7.
    assert_eq!(
        main_river_coast_mouth_max_gap_for_dims(200, 200),
        MAIN_RIVER_COAST_MOUTH_MAX_GAP
    );
}

fn purge_check(
    r: &Value,
    kind: &str,
    f: fn(&mut civ_engine::domain::mapgen::terrain_class::HexRecord, u32, u32) -> usize,
) -> usize {
    let mut total_changed = 0;
    for c in cases(r, kind) {
        let idx = c["map"].as_u64().expect("map") as usize;
        let (w, h) = map_dims(r, idx);
        let w = c["dimsW"].as_i64().unwrap_or(w) as u32;
        let h = c["dimsH"].as_i64().unwrap_or(h) as u32;
        let mut rec = build_map(r, idx);
        let ret = f(&mut rec, w, h);
        assert_eq!(
            ret as i64,
            c["ret"].as_i64().expect("ret"),
            "{kind} map={idx} dims={w}x{h}"
        );
        assert_eq!(
            Value::Array(dump_map(&rec)),
            c["rows"],
            "{kind} map={idx} dims={w}x{h}"
        );
        if ret > 0 {
            total_changed += 1;
        }
    }
    total_changed
}

#[test]
fn purge_ocean_inside_earth_mask_matches_web() {
    let r = root();
    let changed = purge_check(&r, "purgeOcean", purge_ocean_inside_earth_land_mask);
    assert!(
        changed >= 40,
        "za malo przypadkow z realna zmiana: {changed}"
    );
}

#[test]
fn purge_stray_land_outside_earth_mask_matches_web() {
    let r = root();
    let changed = purge_check(&r, "purgeStray", purge_stray_land_outside_earth_mask);
    assert!(
        changed >= 40,
        "za malo przypadkow z realna zmiana: {changed}"
    );
}

fn render_check(
    r: &Value,
    kind: &str,
    f: fn(&civ_engine::domain::mapgen::terrain_class::HexRecord, &[RiverCoord]) -> Vec<RiverCoord>,
) -> (usize, usize) {
    let mut nonempty = 0;
    let mut shorter = 0;
    for c in cases(r, kind) {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(r, idx);
        let path = path_of(&c["path"]);
        let got = f(&rec, &path);
        assert_eq!(
            path_json(&got),
            c["ret"],
            "{kind} map={idx} path={:?}",
            c["path"]
        );
        if !got.is_empty() {
            nonempty += 1;
        }
        if got.len() < path.len() {
            shorter += 1;
        }
    }
    (nonempty, shorter)
}

#[test]
fn land_river_render_path_matches_web() {
    let r = root();
    let (nonempty, shorter) = render_check(&r, "landRender", land_river_render_path);
    assert!(
        nonempty >= 100 && shorter >= 100,
        "pokrycie: nonempty={nonempty} shorter={shorter}"
    );
}

#[test]
fn medium_river_render_path_matches_web() {
    let r = root();
    let (nonempty, _) = render_check(&r, "mediumRender", medium_river_render_path);
    assert!(nonempty >= 100, "pokrycie: nonempty={nonempty}");
}

#[test]
fn coastal_river_render_path_matches_web() {
    let r = root();
    let (nonempty, _) = render_check(&r, "coastalRender", coastal_river_render_path);
    assert!(nonempty >= 150, "pokrycie: nonempty={nonempty}");
}

#[test]
fn count_medium_inland_land_hexes_matches_web() {
    let r = root();
    for c in cases(&r, "countMediumInland") {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(&r, idx);
        let path = path_of(&c["path"]);
        assert_eq!(
            count_medium_inland_land_hexes(&rec, &path) as i64,
            c["ret"].as_i64().expect("ret"),
            "map={idx} path={:?}",
            c["path"]
        );
    }
}

#[test]
fn repair_river_path_adjacency_matches_web() {
    let r = root();
    let cs = cases(&r, "repair");
    let mut repaired = 0;
    for c in cs {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(&r, idx);
        let path = path_of(&c["path"]);
        let src = c["sourceKey"].as_str().expect("src");
        let got = repair_river_path_adjacency(&path, &rec, src);
        assert_eq!(
            path_json(&got),
            c["ret"],
            "map={idx} src={src} path={:?}",
            c["path"]
        );
        if path_json(&got) != c["path"] {
            repaired += 1;
        }
    }
    assert!(repaired >= 100, "za malo przypadkow z naprawa: {repaired}");
}

#[test]
fn river_path_respects_sea_buffer_matches_web() {
    let r = root();
    let mut seen_true = 0;
    let mut seen_false = 0;
    for c in cases(&r, "seaBuffer") {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(&r, idx);
        let path = path_of(&c["path"]);
        let sea = build_sea_distance_field(&rec);
        let min_inland = c["minInland"].as_i64().expect("min");
        let tail = c["mouthTail"].as_u64().expect("tail") as usize;
        let got = river_path_respects_sea_buffer(&rec, &path, &sea, min_inland, tail);
        assert_eq!(
            got,
            c["ret"].as_bool().expect("ret"),
            "map={idx} path={:?}",
            c["path"]
        );
        if got {
            seen_true += 1;
        } else {
            seen_false += 1;
        }
    }
    assert!(
        seen_true >= 50 && seen_false >= 50,
        "pokrycie: true={seen_true} false={seen_false}"
    );
}

#[test]
fn pure_path_helpers_match_web() {
    let r = root();
    for c in cases(&r, "sanitize") {
        let path = path_of(&c["path"]);
        assert_eq!(
            path_json(&sanitize_river_path(&path)),
            c["ret"],
            "sanitize {:?}",
            c["path"]
        );
    }
    for c in cases(&r, "revisited") {
        let path = path_of(&c["path"]);
        assert_eq!(
            river_path_has_revisited_hex(&path),
            c["ret"].as_bool().expect("ret")
        );
    }
    for c in cases(&r, "adjacent") {
        let path = path_of(&c["path"]);
        assert_eq!(
            assert_river_path_adjacent(&path),
            c["ret"].as_bool().expect("ret")
        );
    }
    for c in cases(&r, "split") {
        let path = path_of(&c["path"]);
        let chains: Vec<Value> = split_adjacent_river_chains(&path)
            .iter()
            .map(|ch| path_json(ch))
            .collect();
        assert_eq!(Value::Array(chains), c["ret"], "split {:?}", c["path"]);
    }
}

#[test]
fn pure_path_vectors_cover_revisits_gaps_and_multichain() {
    let r = root();
    let sanitize_changed = cases(&r, "sanitize")
        .iter()
        .filter(|c| c["ret"].as_array().map(|a| a.len()) != c["path"].as_array().map(|a| a.len()))
        .count();
    let multichain = cases(&r, "split")
        .iter()
        .filter(|c| c["ret"].as_array().is_some_and(|a| a.len() > 1))
        .count();
    let revisited = cases(&r, "revisited")
        .iter()
        .filter(|c| c["ret"].as_bool() == Some(true))
        .count();
    assert!(
        sanitize_changed >= 100,
        "sanitize bez zmian: {sanitize_changed}"
    );
    assert!(multichain >= 100, "split bez wielu lancuchow: {multichain}");
    assert!(revisited >= 100, "bez petli: {revisited}");
}

#[test]
fn field_caches_match_web() {
    let r = root();
    for c in cases(&r, "fields") {
        let idx = c["map"].as_u64().expect("map") as usize;
        let (w, h) = map_dims(&r, idx);
        let rec = build_map(&r, idx);
        let fc = build_river_field_cache(&rec, w, h);

        let mut sea: Vec<(String, i64)> =
            fc.sea_dist.iter().map(|(k, v)| (k.clone(), *v)).collect();
        sea.sort();
        let exp_sea: Vec<(String, i64)> = c["seaDist"]
            .as_array()
            .expect("sea")
            .iter()
            .map(|e| {
                (
                    e[0].as_str().expect("k").to_string(),
                    e[1].as_i64().expect("d"),
                )
            })
            .collect();
        assert_eq!(sea, exp_sea, "seaDist map={idx}");

        let mut oc: Vec<String> = fc.ocean_connected.iter().cloned().collect();
        oc.sort();
        let exp_oc: Vec<String> = c["oceanConnected"]
            .as_array()
            .expect("oc")
            .iter()
            .map(|e| e.as_str().expect("k").to_string())
            .collect();
        assert_eq!(oc, exp_oc, "oceanConnected map={idx}");

        let mut od: Vec<(String, i64)> = fc
            .open_ocean_dist
            .iter()
            .map(|(k, v)| (k.clone(), *v))
            .collect();
        od.sort();
        let exp_od: Vec<(String, i64)> = c["openOceanDist"]
            .as_array()
            .expect("od")
            .iter()
            .map(|e| {
                (
                    e[0].as_str().expect("k").to_string(),
                    e[1].as_i64().expect("d"),
                )
            })
            .collect();
        assert_eq!(od, exp_od, "openOceanDist map={idx}");
    }
}

#[test]
fn render_vectors_exercise_water_and_land_overlays() {
    // Pokrycie (wymog M06B1 (a)): w mapach wektorow sa nakladki lasu na wodzie i na lądzie,
    // zloza i rzeki na obu rodzajach heksow.
    let r = root();
    let mut las_water = 0;
    let mut las_land = 0;
    let mut dep_water = 0;
    let mut dep_land = 0;
    let mut riv_water = 0;
    let mut riv_land = 0;
    for m in r["maps"].as_array().expect("maps") {
        for row in m["rows"].as_array().expect("rows") {
            let is_w = matches!(row[1].as_str(), Some("morze") | Some("plytkie_morze"));
            if row[2] == "las" {
                if is_w {
                    las_water += 1
                } else {
                    las_land += 1
                }
            }
            if row[3] == 1 {
                if is_w {
                    dep_water += 1
                } else {
                    dep_land += 1
                }
            }
            if row[4] == 1 {
                if is_w {
                    riv_water += 1
                } else {
                    riv_land += 1
                }
            }
        }
    }
    assert!(
        las_water > 0 && las_land > 0,
        "las: woda={las_water} lad={las_land}"
    );
    assert!(
        dep_water > 0 && dep_land > 0,
        "zloze: woda={dep_water} lad={dep_land}"
    );
    assert!(
        riv_water > 0 && riv_land > 0,
        "rzeka: woda={riv_water} lad={riv_land}"
    );
}

#[test]
fn vectors_respect_size_limit() {
    let len = common::WEB_CASES_RIVERS_A.len();
    assert!(len <= 6 * 1024 * 1024, "plik wektorow > 6 MB: {len}");
}
