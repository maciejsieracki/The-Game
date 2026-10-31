//! P6.M07B-Q2 runda 4 - wektory DODATKOWE z URUCHOMIONEGO weba (pin `edb8fb56`), zabijajace
//! mutanty K/L z FC r2 (G05, G06, G11, G12, G14, M11, W06, E28) i pokrywajace
//! `landCenterSquare != null`. Wektory: `p6_m07b2_vectors/web-rivers-b-q2r4.json`
//! (generator w repo: `p6_m07b2_vectors/gen_q2_r4_vectors.mjs`). Pole `kills` w przypadku =
//! warianty weba (jedna zmiana tekstowa = mutant Rust), ktore daly INNE wyjscie niz oryginal.

use std::collections::{BTreeMap, HashMap, HashSet};

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::relief::continent_center_square;
use civ_engine::domain::mapgen::rivers_a::grow::RiverHexSpatialIndex;
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::rivers_b::coast_grow::{
    grow_river_from_coast_inland, CoastGrowParams,
};
use civ_engine::domain::mapgen::rivers_b::edges::{
    river_corners_along_hex_edges, simplify_river_render_path,
};
use civ_engine::domain::mapgen::rivers_b::meander::find_river_meander_step;
use civ_engine::domain::mapgen::rivers_b::window::sanitize_river_turn_window;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_R4: &str = include_str!("p6_m07b2_vectors/web-rivers-b-q2r4.json");

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

/// Mapa zbudowana raz na indeks (duze mapy maja ~6500 heksow).
struct MapData {
    rec: HexRecord,
    sea: HashMap<String, i64>,
    ocean: HashMap<String, i64>,
    keys: Vec<String>,
}

fn load_maps(root: &Value) -> Vec<MapData> {
    root["maps"]
        .as_array()
        .unwrap()
        .iter()
        .map(|m| MapData {
            rec: build_map(&m["hexes"]),
            sea: dist_map(&m["sea"]),
            ocean: dist_map(&m["ocean"]),
            keys: m["hexes"]
                .as_array()
                .unwrap()
                .iter()
                .map(|h| h["k"].as_str().unwrap().to_string())
                .collect(),
        })
        .collect()
}

#[test]
fn q2r4_vectors_match_web() {
    let root: Value = serde_json::from_str(WEB_R4).expect("parse");
    let maps = load_maps(&root);
    let mut counts = BTreeMap::<String, usize>::new();
    for c in root["cases"].as_array().unwrap() {
        let f = c["fn"].as_str().unwrap();
        *counts.entry(f.to_string()).or_default() += 1;
        match f {
            "grow" => {
                let md = &maps[c["m"].as_u64().unwrap() as usize];
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
                let square = if c["sq"].as_bool().unwrap() {
                    continent_center_square(&md.rec, &md.keys, None)
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
                    land_center_square: square.as_ref(),
                    sep_index: index.as_ref(),
                };
                let mut rand = mulberry(c["seed"].as_u64().unwrap() as u32);
                let got = grow_river_from_coast_inland(
                    &md.rec, mouth, &md.sea, &md.ocean, &mut rand, &params,
                );
                assert_eq!(flat_out(&got), c["out"], "grow {c}");
            }
            "meander" => {
                let md = &maps[c["m"].as_u64().unwrap() as usize];
                let cur = RiverCoord::new(c["c"][0].as_i64().unwrap(), c["c"][1].as_i64().unwrap());
                let target =
                    RiverCoord::new(c["t"][0].as_i64().unwrap(), c["t"][1].as_i64().unwrap());
                let used: HashSet<String> = c["used"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|k| k.as_str().unwrap().to_string())
                    .collect();
                // `drop`: klucze usuniete z seaDist (web: Map bez klucza -> `?? 999` / pominiecie).
                let mut sea = md.sea.clone();
                for k in c["drop"].as_array().unwrap() {
                    sea.remove(k.as_str().unwrap());
                }
                let mut rand = mulberry(c["seed"].as_u64().unwrap() as u32);
                let got = find_river_meander_step(&md.rec, cur, target, &sea, &used, &mut rand);
                let got_json = match got {
                    Some(p) => serde_json::json!([p.q, p.r]),
                    None => Value::Null,
                };
                assert_eq!(got_json, c["out"], "meander {c}");
            }
            "sanitize_window" => {
                let md = &maps[c["m"].as_u64().unwrap() as usize];
                let got = sanitize_river_turn_window(
                    &pairs(&c["p"]),
                    &md.rec,
                    c["src"].as_str().unwrap(),
                );
                assert_eq!(flat_out(&got), c["out"], "sanitize_window");
            }
            "simplify" => {
                let got = simplify_river_render_path(&pairs(&c["p"]));
                assert_eq!(
                    flat_out(&got),
                    c["out"],
                    "simplify dlugosc {}",
                    c["p"].as_array().unwrap().len() / 2
                );
            }
            "corners" => {
                let got = river_corners_along_hex_edges(
                    c["i"].as_i64().unwrap(),
                    c["o"].as_i64().unwrap(),
                    c["par"].as_i64().unwrap(),
                );
                assert_eq!(serde_json::json!(got), c["out"], "corners {c}");
            }
            other => panic!("nieznany typ wektora {other}"),
        }
    }
    let total: usize = counts.values().sum();
    assert_eq!(total, root["cases"].as_array().unwrap().len());
}

/// Pokrycie: kazdy mutant ma wektory, ktore go rozrozniaja (liczone po stronie weba w `kills`).
#[test]
fn q2r4_vectors_cover_mutant_kills() {
    let root: Value = serde_json::from_str(WEB_R4).expect("parse");
    let cases = root["cases"].as_array().unwrap();
    let mut kills = BTreeMap::<String, usize>::new();
    let mut meander_nocur_some = 0usize;
    let mut meander_nocur_none = 0usize;
    let mut simplify_long = 0usize;
    let mut grow_square = 0usize;
    let mut corners_par = std::collections::BTreeSet::new();
    for c in cases {
        if let Some(ks) = c.get("kills").and_then(Value::as_array) {
            for k in ks {
                *kills.entry(k.as_str().unwrap().to_string()).or_default() += 1;
            }
        }
        match c["fn"].as_str().unwrap() {
            "grow" if c["sq"].as_bool().unwrap() => grow_square += 1,
            "meander" if c["drop"].as_array().unwrap().len() >= 1 => {
                if c["out"].is_null() {
                    meander_nocur_none += 1;
                } else {
                    meander_nocur_some += 1;
                }
            }
            "simplify" if c["p"].as_array().unwrap().len() >= 15_000 => simplify_long += 1,
            "corners" => {
                corners_par.insert(c["par"].as_i64().unwrap());
            }
            _ => {}
        }
    }
    let need = [
        ("G05", 30usize),
        ("G06", 30),
        ("G11", 30),
        ("G12", 1),
        ("G17", 30),
        ("CAP3000", 10),
        ("CAP5999", 5),
        ("CAP6001", 5),
    ];
    for (id, min) in need {
        let got = kills.get(id).copied().unwrap_or(0);
        assert!(
            got >= min,
            "mutant {id}: wektorow rozrozniajacych {got} < {min}"
        );
    }
    // sanitize: ten sam start rozroznia cap 47 / 48 / 49 (N-1/N/N+1) - wszystkie warianty zywe
    for cap in [46, 47, 49, 50, 51] {
        let key = format!("CAP{cap}");
        assert!(kills.get(&key).copied().unwrap_or(0) >= 5, "sanitize {key}");
    }
    assert!(
        meander_nocur_some >= 100,
        "M11 (cur poza seaDist, Some): {meander_nocur_some}"
    );
    assert!(
        meander_nocur_none >= 100,
        "cur poza seaDist, None: {meander_nocur_none}"
    );
    assert!(simplify_long >= 10, "E28 dlugie sciezki: {simplify_long}");
    assert!(grow_square >= 50, "grow z kwadratem centrum: {grow_square}");
    assert_eq!(corners_par.len(), 7, "parzystosci -3..3");
}
