//! P6.M07B-Q3 - `rivers_b/{trace_coast,astar,extend}.rs` wzgledem wektorow z URUCHOMIONEGO weba
//! (pin `4bbef081d`). Wektory: `p6_m07b3_vectors/web-rivers-b-q3.json` (generator:
//! `p6_m07b3_vectors/gen_q3_vectors.mjs`). `rand()` = mulberry32 z ziarna zapisanego w
//! przypadku (`null` = web `() => 0`).

use std::collections::{HashMap, HashSet};

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::relief::continent_center_square;
use civ_engine::domain::mapgen::rivers_a::grow::{RiverHexSpatialIndex, TraceRiverOpts};
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::rivers_b::astar::{a_star_river_to_sea, RiverAStarOpenHeap};
use civ_engine::domain::mapgen::rivers_b::extend::{
    extend_river_to_minimum_length, extend_river_to_wybrzeze, finish_river_mouth_at_sea,
    inject_river_meanders,
};
use civ_engine::domain::mapgen::rivers_b::trace_coast::{
    greedy_river_drain_to_sea, trace_river_from_coast,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_Q3: &str = include_str!("p6_m07b3_vectors/web-rivers-b-q3.json");

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

/// `seed == null` -> web `() => 0`.
fn rand_for(seed: &Value) -> Box<dyn FnMut() -> f64> {
    match seed.as_u64() {
        Some(s) => Box::new(mulberry(s as u32)),
        None => Box::new(|| 0.0),
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

struct Map {
    w: i64,
    h: i64,
    rec: HexRecord,
    keys: Vec<String>,
    sea: HashMap<String, i64>,
    open: HashMap<String, i64>,
    oc: HashSet<String>,
    oc_list: Vec<String>,
}

fn dist_map(v: &Value) -> HashMap<String, i64> {
    v.as_object()
        .expect("mapa odleglosci")
        .iter()
        .map(|(k, d)| (k.clone(), d.as_i64().unwrap()))
        .collect()
}

fn build_map(m: &Value) -> Map {
    let mut rec = HexRecord::new();
    let mut keys = Vec::new();
    for h in m["hexes"].as_array().expect("hexes") {
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
        let k = h["k"].as_str().unwrap().to_string();
        keys.push(k.clone());
        rec.insert(k, th);
    }
    let oc_list: Vec<String> = m["oc"]
        .as_array()
        .unwrap()
        .iter()
        .map(|k| k.as_str().unwrap().to_string())
        .collect();
    Map {
        w: m["w"].as_i64().unwrap(),
        h: m["h"].as_i64().unwrap(),
        rec,
        keys,
        sea: dist_map(&m["sea"]),
        open: dist_map(&m["open"]),
        oc: oc_list.iter().cloned().collect(),
        oc_list,
    }
}

struct Fields {
    sea: HashMap<String, i64>,
    open: HashMap<String, i64>,
    oc: HashSet<String>,
}

/// Pola mapy pomniejszone o klucze z `pt` (`null` = bez zmian) - jak `applyPert` w generatorze.
fn fields(mp: &Map, pt: &Value) -> Fields {
    let rm = |key: &str| -> HashSet<String> {
        pt[key]
            .as_array()
            .map(|a| a.iter().map(|k| k.as_str().unwrap().to_string()).collect())
            .unwrap_or_default()
    };
    let (orm, srm, ocrm) = (rm("orm"), rm("srm"), rm("ocrm"));
    Fields {
        sea: mp
            .sea
            .iter()
            .filter(|(k, _)| !srm.contains(*k))
            .map(|(k, v)| (k.clone(), *v))
            .collect(),
        open: mp
            .open
            .iter()
            .filter(|(k, _)| !orm.contains(*k))
            .map(|(k, v)| (k.clone(), *v))
            .collect(),
        oc: mp
            .oc
            .iter()
            .filter(|k| !ocrm.contains(*k))
            .cloned()
            .collect(),
    }
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

fn coord(v: &Value) -> (i64, i64) {
    (v[0].as_i64().unwrap(), v[1].as_i64().unwrap())
}

fn f_of(v: &Value) -> f64 {
    match v.as_str() {
        Some("inf") => f64::INFINITY,
        Some(other) => panic!("nieznana wartosc f {other}"),
        None => v.as_f64().unwrap(),
    }
}

fn trace_run(mp: &Map, c: &Value, ml: usize) -> Vec<RiverCoord> {
    let mode = c["mode"].as_i64().unwrap();
    let (mq, mr) = (c["mq"].as_i64().unwrap(), c["mr"].as_i64().unwrap());
    let oc2: HashSet<String> = if mode == 2 {
        let rm: HashSet<String> = c["ocrm"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k.as_str().unwrap().to_string())
            .collect();
        mp.oc_list
            .iter()
            .filter(|k| !rm.contains(*k))
            .cloned()
            .collect()
    } else {
        HashSet::new()
    };
    let block: Option<HashSet<String>> = c["bl"]
        .as_array()
        .map(|a| a.iter().map(|k| k.as_str().unwrap().to_string()).collect());
    let index = if c["ix"].as_bool().unwrap() {
        let empty: Vec<String> = Vec::new();
        let list: Vec<String> = match &block {
            Some(b) => c["bl"]
                .as_array()
                .unwrap()
                .iter()
                .map(|k| k.as_str().unwrap().to_string())
                .filter(|k| b.contains(k))
                .collect(),
            None => empty,
        };
        Some(RiverHexSpatialIndex::from_keys(
            list.iter().map(String::as_str),
        ))
    } else {
        None
    };
    let square = c["sq"]
        .as_u64()
        .and_then(|s| continent_center_square(&mp.rec, &mp.keys, Some(s as f64)));
    let mut rand = rand_for(&c["seed"]);
    let mut o = TraceRiverOpts::default();
    if mode >= 1 {
        o.sea_dist = Some(&mp.sea);
        o.map_width = Some(mp.w);
        o.map_height = Some(mp.h);
    }
    if mode == 1 {
        o.open_ocean_dist = Some(&mp.open);
        o.ocean_connected = Some(&mp.oc);
    }
    if mode == 2 {
        o.ocean_connected = Some(&oc2);
    }
    if mode == 3 {
        o.map_height = None;
    }
    if mode == 4 {
        o.sea_dist = None;
        o.map_width = Some(mp.w + c["dw"].as_i64().unwrap());
        o.map_height = Some(mp.h + c["dh"].as_i64().unwrap());
    }
    if !c["seed"].is_null() {
        o.rand = Some(&mut *rand);
    }
    o.hard_meander_len = c["hl"].as_u64().map(|v| v as usize);
    o.allow_relief_traversal = c["rel"].as_bool();
    o.block_river_keys = block.as_ref();
    o.min_path_sep = c["msep"].as_i64();
    o.land_centroid = c["lc"]
        .as_array()
        .map(|a| (a[0].as_f64().unwrap(), a[1].as_f64().unwrap()));
    o.land_center_square = square.as_ref();
    o.river_sep_index = index.as_ref();
    trace_river_from_coast(&mp.rec, mq, mr, ml, o)
}

#[test]
fn q3_vectors_match_web() {
    let root: Value = serde_json::from_str(WEB_Q3).expect("parse");
    let maps: Vec<Map> = root["maps"]
        .as_array()
        .unwrap()
        .iter()
        .map(build_map)
        .collect();
    let mut n_by_fn = std::collections::BTreeMap::<String, usize>::new();
    for c in root["cases"].as_array().unwrap() {
        let f = c["fn"].as_str().unwrap();
        *n_by_fn.entry(f.to_string()).or_default() += 1;
        match f {
            "heap" => {
                let mut heap = RiverAStarOpenHeap::new();
                let mut outs: Vec<Value> = Vec::new();
                for op in c["ops"].as_array().unwrap() {
                    match op[0].as_str().unwrap() {
                        "push" => heap.push(
                            f_of(&op[1]),
                            op[2].as_u64().unwrap(),
                            op[3].as_str().unwrap().to_string(),
                        ),
                        "pop" => {
                            let e = heap.pop().expect("web pop zwrocil wpis");
                            outs.push(serde_json::json!([e.0, e.1, e.2]));
                        }
                        other => panic!("op {other}"),
                    }
                }
                let want_outs = c["outs"].as_array().unwrap();
                assert_eq!(outs.len(), want_outs.len(), "heap liczba pop {c}");
                for (g, w) in outs.iter().zip(want_outs) {
                    assert_eq!(
                        g[0].as_f64()
                            .map(f64::to_bits)
                            .unwrap_or(f64::INFINITY.to_bits()),
                        f_of(&w[0]).to_bits(),
                        "heap f {c}"
                    );
                    assert_eq!(g[1], w[1], "heap seq {c}");
                    assert_eq!(g[2], w[2], "heap key {c}");
                }
                let snap: Vec<(u64, u64, String)> = heap
                    .as_slice()
                    .iter()
                    .map(|e| (e.0.to_bits(), e.1, e.2.clone()))
                    .collect();
                let want: Vec<(u64, u64, String)> = c["snap"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|e| {
                        (
                            f_of(&e[0]).to_bits(),
                            e[1].as_u64().unwrap(),
                            e[2].as_str().unwrap().to_string(),
                        )
                    })
                    .collect();
                assert_eq!(snap, want, "heap uklad tablicy {c}");
            }
            "astar" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let fl = fields(mp, &c["pt"]);
                let (sq, sr) = coord(&c["s"]);
                let mut rand = rand_for(&c["seed"]);
                let got = a_star_river_to_sea(
                    &mp.rec,
                    sq,
                    sr,
                    &fl.sea,
                    &fl.open,
                    &fl.oc,
                    c["ml"].as_u64().unwrap() as usize,
                    &mut *rand,
                    c["rel"].as_bool().unwrap(),
                );
                assert_eq!(flat_out(&got), c["out"], "astar {c}");
            }
            "greedy" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let fl = fields(mp, &c["pt"]);
                let (sq, sr) = coord(&c["s"]);
                let mut rand = rand_for(&c["seed"]);
                let got = greedy_river_drain_to_sea(
                    &mp.rec,
                    sq,
                    sr,
                    &fl.sea,
                    &fl.open,
                    &fl.oc,
                    c["ml"].as_u64().unwrap() as usize,
                    &mut *rand,
                    c["sk"].as_str().unwrap(),
                    c["rel"].as_bool().unwrap(),
                );
                assert_eq!(flat_out(&got), c["out"], "greedy {c}");
            }
            "trace" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let got = trace_run(mp, c, c["ml"].as_u64().unwrap() as usize);
                assert_eq!(flat_out(&got), c["out"], "trace {c}");
            }
            "inject" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let fl = fields(mp, &c["pt"]);
                let mut rand = rand_for(&c["seed"]);
                let got = inject_river_meanders(
                    &pairs(&c["p"]),
                    &mp.rec,
                    &fl.sea,
                    &mut *rand,
                    c["mx"].as_i64().unwrap(),
                );
                assert_eq!(flat_out(&got), c["out"], "inject {c}");
            }
            "extmin" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let fl = fields(mp, &c["pt"]);
                let mut rand = rand_for(&c["seed"]);
                let got = extend_river_to_minimum_length(
                    &pairs(&c["p"]),
                    &mp.rec,
                    &fl.sea,
                    &mut *rand,
                    c["min"].as_u64().unwrap() as usize,
                    c["cap"].as_u64().unwrap() as usize,
                );
                assert_eq!(flat_out(&got), c["out"], "extmin {c}");
            }
            "wyb" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let fl = fields(mp, &c["pt"]);
                let mut p = pairs(&c["p"]);
                extend_river_to_wybrzeze(&mp.rec, &mut p, &fl.sea);
                assert_eq!(flat_out(&p), c["out"], "wyb {c}");
            }
            "fin" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let fl = fields(mp, &c["pt"]);
                let mut p = pairs(&c["p"]);
                finish_river_mouth_at_sea(
                    &mp.rec,
                    &mut p,
                    &fl.sea,
                    &fl.open,
                    &fl.oc,
                    c["sk"].as_str().unwrap(),
                );
                assert_eq!(flat_out(&p), c["out"], "fin {c}");
            }
            "sweep" => {
                let mp = &maps[c["m"].as_u64().unwrap() as usize];
                let kind = c["kind"].as_str().unwrap();
                for (i, want) in c["outs"].as_array().unwrap().iter().enumerate() {
                    let n = c["lo"].as_u64().unwrap() as usize + i;
                    let got = match kind {
                        "astar" => {
                            let (sq, sr) = coord(&c["s"]);
                            let mut rand = rand_for(&c["seed"]);
                            a_star_river_to_sea(
                                &mp.rec, sq, sr, &mp.sea, &mp.open, &mp.oc, n, &mut *rand, false,
                            )
                        }
                        "greedy" => {
                            let (sq, sr) = coord(&c["s"]);
                            let mut rand = rand_for(&c["seed"]);
                            greedy_river_drain_to_sea(
                                &mp.rec,
                                sq,
                                sr,
                                &mp.sea,
                                &mp.open,
                                &mp.oc,
                                n,
                                &mut *rand,
                                c["sk"].as_str().unwrap(),
                                false,
                            )
                        }
                        "trace" => trace_run(mp, c, n),
                        "inject" => {
                            let mut rand = rand_for(&c["seed"]);
                            inject_river_meanders(
                                &pairs(&c["p"]),
                                &mp.rec,
                                &mp.sea,
                                &mut *rand,
                                n as i64,
                            )
                        }
                        "extmin" => {
                            let mut rand = rand_for(&c["seed"]);
                            extend_river_to_minimum_length(
                                &pairs(&c["p"]),
                                &mp.rec,
                                &mp.sea,
                                &mut *rand,
                                n,
                                c["cap"].as_u64().unwrap() as usize,
                            )
                        }
                        "extcap" => {
                            let mut rand = rand_for(&c["seed"]);
                            extend_river_to_minimum_length(
                                &pairs(&c["p"]),
                                &mp.rec,
                                &mp.sea,
                                &mut *rand,
                                c["min"].as_u64().unwrap() as usize,
                                n,
                            )
                        }
                        other => panic!("sweep {other}"),
                    };
                    assert_eq!(flat_out(&got), *want, "sweep {kind} N={n} {c}");
                }
            }
            other => panic!("nieznany typ wektora {other}"),
        }
    }
    let total: usize = n_by_fn.values().sum();
    assert_eq!(total, root["cases"].as_array().unwrap().len());
}

#[test]
fn q3_vectors_cover_branches_and_overlays() {
    let root: Value = serde_json::from_str(WEB_Q3).expect("parse");
    let cases = root["cases"].as_array().unwrap();
    let mut cnt = std::collections::BTreeMap::<&str, usize>::new();
    let mut add = |k: &'static str| *cnt.entry(k).or_default() += 1;
    for c in cases {
        let f = c["fn"].as_str().unwrap();
        let out_len = c["out"].as_array().map_or(0, Vec::len) / 2;
        if !c["pt"].is_null() && c.get("pt").is_some() {
            add("perturbed");
        }
        if f == "trace" && c["mode"].as_i64() == Some(4) {
            add("trace_mode4");
            if out_len > 0 {
                add("trace_mode4_path");
            }
        }
        match f {
            "heap" => {
                add("heap");
                if c["outs"].as_array().unwrap().len() >= 3 {
                    add("heap_pops_ge3");
                }
            }
            "astar" if out_len == 1 => add("astar_single"),
            "astar" => {
                add("astar_path");
                if out_len >= 6 {
                    add("astar_ge6");
                }
                if c["seed"].is_null() {
                    add("astar_rand0");
                }
            }
            "greedy" if out_len == 0 => add("greedy_empty"),
            "greedy" => add("greedy_path"),
            "trace" if out_len == 0 => add("trace_empty"),
            "trace" => {
                add("trace_path");
                if !c["sq"].is_null() {
                    add("trace_square_path");
                }
                if c["mode"].as_i64() == Some(2) {
                    add("trace_pert_path");
                }
            }
            "inject" if out_len * 2 > c["p"].as_array().unwrap().len() => add("inject_grew"),
            "inject" => add("inject_same"),
            "extmin" if out_len * 2 > c["p"].as_array().unwrap().len() => add("extmin_grew"),
            "extmin" => add("extmin_same"),
            "wyb" if out_len * 2 > c["p"].as_array().unwrap().len() => add("wyb_grew"),
            "wyb" => add("wyb_same"),
            "fin" if out_len * 2 > c["p"].as_array().unwrap().len() => add("fin_grew"),
            "fin" => add("fin_same"),
            "sweep" => {
                let outs = c["outs"].as_array().unwrap();
                if outs.windows(2).any(|w| w[0] != w[1]) {
                    add("sweep_with_transition");
                }
                add("sweep");
            }
            other => panic!("typ {other}"),
        }
    }
    let g = |k: &str| cnt.get(k).copied().unwrap_or(0);
    assert!(
        g("perturbed") >= 1500 && g("trace_mode4") >= 400 && g("trace_mode4_path") >= 30,
        "{cnt:?}"
    );
    assert!(g("heap") >= 600 && g("heap_pops_ge3") >= 500, "{cnt:?}");
    assert!(
        g("astar_single") >= 500
            && g("astar_path") >= 1000
            && g("astar_ge6") >= 40
            && g("astar_rand0") >= 300,
        "{cnt:?}"
    );
    assert!(
        g("greedy_empty") >= 500 && g("greedy_path") >= 1000,
        "{cnt:?}"
    );
    assert!(
        g("trace_empty") >= 500
            && g("trace_path") >= 300
            && g("trace_square_path") >= 80
            && g("trace_pert_path") >= 50,
        "{cnt:?}"
    );
    assert!(
        g("inject_grew") >= 200 && g("inject_same") >= 500,
        "{cnt:?}"
    );
    assert!(g("extmin_grew") >= 70 && g("extmin_same") >= 500, "{cnt:?}");
    assert!(g("wyb_grew") >= 1000 && g("wyb_same") >= 100, "{cnt:?}");
    assert!(g("fin_grew") >= 1000 && g("fin_same") >= 500, "{cnt:?}");
    assert!(
        g("sweep") >= 400 && g("sweep") == g("sweep_with_transition"),
        "{cnt:?}"
    );

    // Lekcja (a): nakladki (las / zloze / rzeka) na heksach wodnych i ladowych.
    let (mut water_overlay, mut land_overlay, mut water_deposit, mut land_river) = (0, 0, 0, 0);
    for m in root["maps"].as_array().unwrap() {
        for h in m["hexes"].as_array().unwrap() {
            let t = h["t"].as_str().unwrap();
            let water = t == "morze" || t == "plytkie_morze";
            let n = h["n"].as_str().unwrap();
            if water && n != "brak" {
                water_overlay += 1;
            }
            if !water && n != "brak" {
                land_overlay += 1;
            }
            if water && h["z"].as_bool().unwrap() {
                water_deposit += 1;
            }
            if !water && h["rz"]["obecna"].as_bool() == Some(true) {
                land_river += 1;
            }
        }
    }
    assert!(water_overlay > 100 && land_overlay > 100 && water_deposit > 20 && land_river > 20);
}
