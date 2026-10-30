//! P6.M07A partia 2 - `rivers_a/walk.rs` wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`,
//! gen-helpers.ts:5121-5168, :5580-5611, :5781-5900, :5974-6067). Wektory:
//! `p6_m07a_vectors/web-rivers-a-walk.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-walk.mjs`.
//! Wspolrzedne zmiennoprzecinkowe w wektorach jako STRING (pelna precyzja `f64`).

#[path = "p6_m07a_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::ocean_connected_water_keys;
use civ_engine::domain::mapgen::relief::continent_center_square;
use civ_engine::domain::mapgen::rivers_a::fields::build_open_ocean_distance_field;
use civ_engine::domain::mapgen::rivers_a::{
    audit_map_terrain_data, can_river_drain_step, estimate_land_centroid_from_mouth,
    estimate_land_centroid_from_seed, infer_map_dims_from_hexes, is_relief_river_source,
    is_river_drainage_goal, path_ends_at_sea, reconstruct_river_path, river_hex_dir_delta,
    river_step_dir, same_river_dir, score_river_step_toward_center_square,
    score_river_step_toward_centroid, score_river_step_toward_land_center, RiverCoord,
    CENTROID_VISIT_CAP,
};
use common::{build_map, path_json, path_of};
use serde_json::{json, Value};

const WALK: &str = include_str!("p6_m07a_vectors/web-rivers-a-walk.json");

fn root() -> Value {
    serde_json::from_str(WALK).expect("wektory walk parsuja sie")
}

fn cases<'a>(r: &'a Value, kind: &str) -> &'a Vec<Value> {
    r["cases"][kind]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {kind}"))
}

fn dims(r: &Value, idx: usize) -> (i64, i64) {
    (
        r["maps"][idx]["w"].as_i64().expect("w"),
        r["maps"][idx]["h"].as_i64().expect("h"),
    )
}

fn pair(v: &Value) -> (i64, i64) {
    (v[0].as_i64().expect("q"), v[1].as_i64().expect("r"))
}

/// Web `centroid` jako `[String, String]` lub `null` -> `Option<(f64, f64)>` (pelna precyzja).
fn centroid_of(v: &Value) -> Option<(f64, f64)> {
    if v.is_null() {
        return None;
    }
    let a = v[0]
        .as_str()
        .expect("cq str")
        .parse::<f64>()
        .expect("cq f64");
    let b = v[1]
        .as_str()
        .expect("cr str")
        .parse::<f64>()
        .expect("cr f64");
    Some((a, b))
}

fn centroid_json(c: Option<(f64, f64)>) -> Value {
    match c {
        None => Value::Null,
        Some((a, b)) => json!([a.to_string(), b.to_string()]),
    }
}

fn dirs_json(d: (i64, i64)) -> Value {
    json!([d.0, d.1])
}

#[test]
fn constants_match_web() {
    assert_eq!(CENTROID_VISIT_CAP, 6000);
}

#[test]
fn drain_step_matches_web() {
    let r = root();
    let mut n = 0usize;
    for c in cases(&r, "drainStep") {
        let idx = c["map"].as_u64().expect("map") as usize;
        let hexes = build_map(&r, idx);
        let (w, h) = dims(&r, idx);
        let oc = ocean_connected_water_keys(&hexes, w, h);
        let od: HashMap<String, i64> = build_open_ocean_distance_field(&hexes, w, h, Some(&oc));
        let got = can_river_drain_step(
            c["nk"].as_str().unwrap(),
            c["nd"].as_i64().unwrap(),
            &od,
            &oc,
            c["post"].as_bool().unwrap(),
        );
        assert_eq!(got, c["ret"].as_bool().unwrap(), "drainStep {c}");
        n += 1;
    }
    assert_eq!(n, 504);
}

#[test]
fn drainage_goal_matches_web() {
    let r = root();
    for c in cases(&r, "drainGoal") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let (w, h) = dims(&r, idx);
        let oc = ocean_connected_water_keys(&hexes, w, h);
        let got = is_river_drainage_goal(
            c["q"].as_i64().unwrap(),
            c["r"].as_i64().unwrap(),
            &hexes,
            c["src"].as_str().unwrap(),
            &oc,
        );
        assert_eq!(got, c["ret"].as_bool().unwrap(), "drainGoal {c}");
    }
}

#[test]
fn path_ends_at_sea_matches_web() {
    let r = root();
    for c in cases(&r, "pathSea") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let path: Vec<RiverCoord> = path_of(&c["path"]);
        let d = if c["dims"].is_null() {
            None
        } else {
            Some(pair(&c["dims"]))
        };
        let got = path_ends_at_sea(&hexes, &path, d, None);
        assert_eq!(got, c["ret"].as_bool().unwrap(), "pathSea {c}");
    }
}

#[test]
fn infer_dims_matches_web() {
    let r = root();
    for c in cases(&r, "dims") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let (w, h) = infer_map_dims_from_hexes(&hexes);
        assert_eq!(json!([w, h]), c["ret"], "dims map {idx}");
    }
}

#[test]
fn relief_river_source_matches_web() {
    let r = root();
    for c in cases(&r, "reliefSource") {
        let t = match c["terrain"].as_str().unwrap() {
            "laka" => Terrain::Grassland,
            "rownina" => Terrain::Plains,
            "wzgorza" => Terrain::Hills,
            "gory" => Terrain::Mountains,
            "plytkie_morze" => Terrain::ShallowSea,
            "morze" => Terrain::Sea,
            "pustynia" => Terrain::Desert,
            "polarny" => Terrain::Polar,
            other => panic!("teren {other}"),
        };
        assert_eq!(is_relief_river_source(t), c["ret"].as_bool().unwrap());
    }
}

#[test]
fn step_dirs_match_web() {
    let r = root();
    for c in cases(&r, "dirs") {
        let got = river_step_dir(
            RiverCoord::new(pair(&c["from"]).0, pair(&c["from"]).1),
            RiverCoord::new(pair(&c["to"]).0, pair(&c["to"]).1),
        );
        assert_eq!(dirs_json(got), c["ret"], "dirs {c}");
    }
    for c in cases(&r, "sameDir") {
        let a = pair(&c["a"]);
        let b = pair(&c["b"]);
        assert_eq!(
            same_river_dir(a, b),
            c["ret"].as_bool().unwrap(),
            "sameDir {c}"
        );
    }
    for c in cases(&r, "dirDelta") {
        let got = river_hex_dir_delta(c["last"].as_i64().unwrap(), c["next"].as_i64().unwrap());
        assert_eq!(got, c["ret"].as_i64().unwrap(), "dirDelta {c}");
    }
}

#[test]
fn reconstruct_matches_web() {
    let r = root();
    for c in cases(&r, "reconstruct") {
        let mut came_from: HashMap<String, String> = HashMap::new();
        for p in c["pairs"].as_array().unwrap() {
            came_from.insert(
                p[0].as_str().unwrap().to_string(),
                p[1].as_str().unwrap().to_string(),
            );
        }
        let got = reconstruct_river_path(&came_from, c["end"].as_str().unwrap());
        assert_eq!(path_json(&got), c["ret"], "reconstruct {c}");
    }
}

#[test]
fn centroid_seed_and_mouth_match_web() {
    let r = root();
    for c in cases(&r, "centroidSeed") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let got = estimate_land_centroid_from_seed(
            &hexes,
            c["mq"].as_i64().unwrap(),
            c["mr"].as_i64().unwrap(),
            c["allowRelief"].as_bool().unwrap(),
            c["cap"].as_u64().unwrap() as usize,
        );
        assert_eq!(centroid_json(got), c["ret"], "centroidSeed {c}");
    }
    for c in cases(&r, "centroidMouth") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let got = estimate_land_centroid_from_mouth(
            &hexes,
            c["mq"].as_i64().unwrap(),
            c["mr"].as_i64().unwrap(),
            c["allowRelief"].as_bool().unwrap(),
            c["cap"].as_u64().unwrap() as usize,
        );
        assert_eq!(centroid_json(got), c["ret"], "centroidMouth {c}");
    }
}

/// Lekcja FC (b): cap N-1 / N / N+1 musi ROZROZNIAC wynik. Szukamy mapy i ujscia (pierwszy
/// heks lądu), dla ktorej caps 1..=40 daja >= 3 rozne centroidy (BFS rosnie z kazdym capem).
#[test]
fn centroid_cap_discriminates() {
    let r = root();
    let n_maps = r["maps"].as_array().unwrap().len();
    let mut best = 0usize;
    for idx in 0..n_maps {
        let hexes = build_map(&r, idx);
        let mouth = hexes
            .iter()
            .find(|(_, h)| matches!(h.terrain, Terrain::Grassland | Terrain::Plains))
            .map(|(k, _)| k.clone());
        let Some(mouth) = mouth else { continue };
        let (mq, mr) = mouth
            .split_once(',')
            .map(|(a, b)| (a.parse::<i64>().unwrap(), b.parse::<i64>().unwrap()))
            .unwrap();
        let mut distinct: Vec<String> = Vec::new();
        for cap in 1..=40usize {
            let got = centroid_json(estimate_land_centroid_from_seed(&hexes, mq, mr, false, cap))
                .to_string();
            if !distinct.contains(&got) {
                distinct.push(got);
            }
        }
        best = best.max(distinct.len());
    }
    assert!(
        best >= 3,
        "zaden przypadek nie rozroznia capa (max {best} wynikow)"
    );
}

#[test]
fn score_centroid_matches_web() {
    let r = root();
    for c in cases(&r, "scoreCentroid") {
        let got = score_river_step_toward_centroid(
            c["q"].as_i64().unwrap(),
            c["r"].as_i64().unwrap(),
            c["nq"].as_i64().unwrap(),
            c["nr"].as_i64().unwrap(),
            centroid_of(&c["centroid"]),
        );
        assert_eq!(got, c["ret"].as_i64().unwrap(), "scoreCentroid {c}");
    }
}

#[test]
fn score_center_square_matches_web() {
    let r = root();
    for c in cases(&r, "scoreSquare") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let keys: Vec<String> = hexes.keys().cloned().collect();
        let sq = continent_center_square(&hexes, &keys, None);
        let use_sq = c["square"].as_bool().unwrap();
        let got = score_river_step_toward_center_square(
            c["q"].as_i64().unwrap(),
            c["r"].as_i64().unwrap(),
            c["nq"].as_i64().unwrap(),
            c["nr"].as_i64().unwrap(),
            if use_sq { sq.as_ref() } else { None },
        );
        assert_eq!(got, c["ret"].as_i64().unwrap(), "scoreSquare {c}");
    }
}

#[test]
fn score_land_center_matches_web() {
    let r = root();
    for c in cases(&r, "scoreLandCenter") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let keys: Vec<String> = hexes.keys().cloned().collect();
        let sq = continent_center_square(&hexes, &keys, None);
        let use_sq = c["square"].as_bool().unwrap();
        let got = score_river_step_toward_land_center(
            c["q"].as_i64().unwrap(),
            c["r"].as_i64().unwrap(),
            c["nq"].as_i64().unwrap(),
            c["nr"].as_i64().unwrap(),
            if use_sq { sq.as_ref() } else { None },
            centroid_of(&c["centroid"]),
        );
        assert_eq!(got, c["ret"].as_i64().unwrap(), "scoreLandCenter {c}");
    }
}

#[test]
fn audit_matches_web() {
    let r = root();
    for c in cases(&r, "audit") {
        let idx = c["map"].as_u64().unwrap() as usize;
        let hexes = build_map(&r, idx);
        let (w, h) = dims(&r, idx);
        let a = audit_map_terrain_data(&hexes, w, h);
        let got = json!({
            "totalHexes": a.total_hexes,
            "byTeren": a.by_teren,
            "openOceanLandSpecks": a.open_ocean_land_specks,
            "enclosedInlandMorzeHexes": a.enclosed_inland_morze_hexes,
            "enclosedInlandMorzeComponents": a.enclosed_inland_morze_components,
        });
        assert_eq!(got, c["ret"], "audit map {idx}");
    }
}
