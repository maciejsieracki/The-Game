//! P6.M07B-Q2 partia 2 - `rivers_b/coast_grow.rs` i `rivers_b/meander.rs` wzgledem wektorow z
//! URUCHOMIONEGO weba (pin `edb8fb56`). Wektory: `p6_m07b2_vectors/web-rivers-b-coast-grow.json`
//! (generator: `p6_m07b2_vectors/gen_coast_grow_vectors.mjs`). `rand()` = mulberry32 z ziarna
//! zapisanego w kazdym przypadku (ta sama sekwencja bitowa po obu stronach).

use std::collections::{HashMap, HashSet};

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::rivers_a::grow::RiverHexSpatialIndex;
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::rivers_b::coast_grow::{
    collect_coast_inland_grow_candidates, grow_river_from_coast_inland, CoastGrowParams,
    CoastInlandGrowOpts,
};
use civ_engine::domain::mapgen::rivers_b::meander::find_river_meander_step;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_COAST: &str = include_str!("p6_m07b2_vectors/web-rivers-b-coast-grow.json");

/// mulberry32 (web `mulberry(seed)`): bitowo zgodny z `Math.imul` / `>>>` po stronie JS.
fn mulberry(seed: u32) -> impl FnMut() -> f64 {
    let mut st = seed;
    move || {
        st = st.wrapping_add(0x6d2b_79f5);
        let mut t = st;
        t = (t ^ (t >> 15)).wrapping_mul(t | 1);
        t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61));
        f64::from(t ^ (t >> 14)) / 4_294_967_296.0
    }
}

fn terrain_of(key: &str) -> Terrain {
    match key {
        "morze" => Terrain::Sea,
        "plytkie_morze" => Terrain::ShallowSea,
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "pustynia" => Terrain::Desert,
        "wzgorza" => Terrain::Hills,
        "gory" => Terrain::Mountains,
        "polarny" => Terrain::Polar,
        other => panic!("nieznany teren {other}"),
    }
}

fn build_map(list: &Value) -> HexRecord {
    let mut rec = HexRecord::new();
    for h in list.as_array().expect("hexes") {
        let mut th = TerrainHex::new(
            h["q"].as_i64().unwrap(),
            h["r"].as_i64().unwrap(),
            terrain_of(h["t"].as_str().unwrap()),
        );
        th.overlay = Nakladka::from_key(h["n"].as_str().unwrap()).expect("nakladka");
        th.has_deposit = h["z"].as_bool().unwrap();
        if let Some(rz) = h["rz"].as_object() {
            th.river_present = rz["obecna"].as_bool().unwrap();
            th.river_edges = rz["krawedzie"]
                .as_array()
                .unwrap()
                .iter()
                .map(|e| e.as_u64().unwrap() as u8)
                .collect();
        }
        rec.insert(h["k"].as_str().unwrap().to_string(), th);
    }
    rec
}

fn dist_map(v: &Value) -> HashMap<String, i64> {
    v.as_object()
        .expect("mapa odleglosci")
        .iter()
        .map(|(k, d)| (k.clone(), d.as_i64().unwrap()))
        .collect()
}

fn pairs(v: &Value) -> Vec<RiverCoord> {
    let flat: Vec<i64> = v
        .as_array()
        .expect("lista")
        .iter()
        .map(|x| x.as_i64().unwrap())
        .collect();
    assert_eq!(flat.len() % 2, 0);
    flat.chunks(2)
        .map(|c| RiverCoord::new(c[0], c[1]))
        .collect()
}

fn flat_out(path: &[RiverCoord]) -> Value {
    Value::Array(
        path.iter()
            .flat_map(|p| [serde_json::json!(p.q), serde_json::json!(p.r)])
            .collect(),
    )
}

fn centroid_of(v: &Value) -> Option<(f64, f64)> {
    v.as_array()
        .map(|a| (a[0].as_f64().unwrap(), a[1].as_f64().unwrap()))
}

fn block_of(v: &Value) -> Option<HashSet<String>> {
    v.as_array()
        .map(|a| a.iter().map(|k| k.as_str().unwrap().to_string()).collect())
}

#[test]
fn coast_grow_vectors_match_web() {
    let root: Value = serde_json::from_str(WEB_COAST).expect("parse");
    let maps = root["maps"].as_array().unwrap();
    let mut counts = std::collections::BTreeMap::<String, usize>::new();
    for c in root["cases"].as_array().unwrap() {
        let f = c["fn"].as_str().unwrap();
        *counts.entry(f.to_string()).or_default() += 1;
        let mp = &maps[c["m"].as_u64().unwrap() as usize];
        let rec = build_map(&mp["hexes"]);
        let sea = dist_map(&mp["sea"]);
        let ocean = dist_map(&mp["ocean"]);
        match f {
            "collect" => {
                let path = pairs(&c["p"]);
                let cur = *path.last().unwrap();
                let mouth_key = c["mk"].as_str().unwrap().to_string();
                let lc = centroid_of(&c["lc"]);
                let block = block_of(&c["bl"]);
                let mut rand = mulberry(c["seed"].as_u64().unwrap() as u32);
                let opts = CoastInlandGrowOpts {
                    hexes: &rec,
                    path: &path,
                    cur,
                    mouth_key: &mouth_key,
                    sea_dist: &sea,
                    land_centroid: lc,
                    land_center_square: None,
                    block_river_keys: block.as_ref(),
                    sep_index: None,
                    min_path_sep: c["msep"].as_i64().unwrap(),
                    allow_relief_traversal: c["rel"].as_bool().unwrap(),
                    hard_meander: c["hard"].as_bool().unwrap(),
                    relax_hard_meander: c["rlx"].as_bool().unwrap(),
                };
                let got = collect_coast_inland_grow_candidates(&opts, &mut rand);
                let want = c["out"].as_array().expect("out");
                assert_eq!(got.len(), want.len(), "collect dlugosc {c}");
                for (g, w) in got.iter().zip(want) {
                    assert_eq!(g.q, w[0].as_i64().unwrap(), "collect q {c}");
                    assert_eq!(g.r, w[1].as_i64().unwrap(), "collect r {c}");
                    // ZAŁOŻENIE: serde_json bez `float_roundtrip` moze dac 1 ulp bledu przy parsowaniu
                    // dlugich dziesietnych z wektora (zob. dossier Q2); porownanie z tolerancja 1e-12.
                    let ws = w[2].as_f64().unwrap();
                    assert!(
                        (g.score - ws).abs() <= 1e-12 * ws.abs().max(1.0),
                        "collect score {g:?} vs {ws} {c}"
                    );
                }
            }
            "grow" => {
                let mouth = RiverCoord::new(c["mq"].as_i64().unwrap(), c["mr"].as_i64().unwrap());
                let lc = centroid_of(&c["lc"]);
                let block = block_of(&c["bl"]);
                let index = if c["ix"].as_bool().unwrap() {
                    block
                        .as_ref()
                        .map(|b| RiverHexSpatialIndex::from_keys(b.iter().map(String::as_str)))
                } else {
                    None
                };
                let params = CoastGrowParams {
                    step_cap: c["sc"].as_u64().unwrap() as usize,
                    hard_meander_len: c["hl"].as_u64().unwrap() as usize,
                    allow_relief_traversal: c["rel"].as_bool().unwrap(),
                    block_river_keys: block.as_ref(),
                    min_path_sep: c["msep"].as_i64().unwrap(),
                    land_centroid: lc,
                    land_center_square: None,
                    sep_index: index.as_ref(),
                };
                let mut rand = mulberry(c["seed"].as_u64().unwrap() as u32);
                let got =
                    grow_river_from_coast_inland(&rec, mouth, &sea, &ocean, &mut rand, &params);
                assert_eq!(flat_out(&got), c["out"], "grow {c}");
            }
            "meander" => {
                let cur = RiverCoord::new(c["c"][0].as_i64().unwrap(), c["c"][1].as_i64().unwrap());
                let target =
                    RiverCoord::new(c["t"][0].as_i64().unwrap(), c["t"][1].as_i64().unwrap());
                let used: HashSet<String> = c["used"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|k| k.as_str().unwrap().to_string())
                    .collect();
                let mut rand = mulberry(c["seed"].as_u64().unwrap() as u32);
                let got = find_river_meander_step(&rec, cur, target, &sea, &used, &mut rand);
                let got_json = match got {
                    Some(p) => serde_json::json!([p.q, p.r]),
                    None => Value::Null,
                };
                assert_eq!(got_json, c["out"], "meander {c}");
            }
            other => panic!("nieznany typ wektora {other}"),
        }
    }
    let total: usize = counts.values().sum();
    assert_eq!(total, root["cases"].as_array().unwrap().len());
}

#[test]
fn coast_grow_vectors_cover_outcomes() {
    let root: Value = serde_json::from_str(WEB_COAST).expect("parse");
    let cases = root["cases"].as_array().unwrap();
    let mut collect_nonempty = 0usize;
    let mut grow_ge3 = 0usize;
    let mut grow_index = 0usize;
    let mut meander_some = 0usize;
    let mut meander_none = 0usize;
    for c in cases {
        match c["fn"].as_str().unwrap() {
            "collect" if !c["out"].as_array().unwrap().is_empty() => collect_nonempty += 1,
            "grow" => {
                if c["out"].as_array().unwrap().len() >= 6 {
                    grow_ge3 += 1;
                }
                if c["ix"].as_bool().unwrap() {
                    grow_index += 1;
                }
            }
            "meander" if c["out"].is_null() => meander_none += 1,
            "meander" => meander_some += 1,
            _ => {}
        }
    }
    assert!(
        collect_nonempty >= 300,
        "collect niepusty: {collect_nonempty}"
    );
    assert!(grow_ge3 >= 200, "grow >=3: {grow_ge3}");
    assert!(grow_index >= 100, "grow z indeksem: {grow_index}");
    assert!(meander_some >= 300, "meander Some: {meander_some}");
    assert!(meander_none >= 300, "meander None: {meander_none}");
}
