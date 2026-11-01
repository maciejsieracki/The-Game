//! P6.M07B-Q4 - `rivers_b/{trace,sources,quotas}.rs` wzgledem wektorow z URUCHOMIONEGO weba
//! (pin `4bbef081d`). Wektory: `p6_m07b4_vectors/web-rivers-b-q4.json` (generator:
//! `p6_m07b4_vectors/gen_q4_vectors.mjs`). `rand()` = mulberry32 z ziarna zapisanego w
//! przypadku (`null` = web `() => 0`). Symbole: traceRiver, traceRiverForGridFill,
//! collectFoothillRiverSources, collectPlainSpringSources, collectRiverSources, capRiverQuotas,
//! pickSpreadRiverSources.

use std::collections::{HashMap, HashSet};

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::relief::continent_center_square;
use civ_engine::domain::mapgen::rivers_a::grow::{RiverHexSpatialIndex, TraceRiverOpts};
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::rivers_b::quotas::cap_river_quotas;
use civ_engine::domain::mapgen::rivers_b::sources::{
    collect_foothill_river_sources, collect_plain_spring_sources, collect_river_sources,
    pick_spread_river_sources,
};
use civ_engine::domain::mapgen::rivers_b::trace::{trace_river, trace_river_for_grid_fill};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_Q4: &str = include_str!("p6_m07b4_vectors/web-rivers-b-q4.json");

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
}

/// Pole `seaDist` pomniejszone o klucze z `pt` (`null` = bez zmian) - jak `applyPert` w generatorze.
fn fields(mp: &Map, pt: &Value) -> Fields {
    // Generator: `applyPert` usuwa z seaDist klucze `srm` (zrodla Q4 nie uzywaja orm/ocrm).
    let srm: HashSet<String> = str_set(&pt["srm"]).unwrap_or_default();
    Fields {
        sea: mp
            .sea
            .iter()
            .filter(|(k, _)| !srm.contains(*k))
            .map(|(k, v)| (k.clone(), *v))
            .collect(),
    }
}

/// Nadpisania seaDist `sov` = lista `[klucz, wartosc]` (`null` = brak) - jak `seaWithSov` w generatorze.
fn fields_sov(mp: &Map, c: &Value) -> Fields {
    let mut fl = fields(mp, &c["pt"]);
    if let Some(list) = c["sov"].as_array() {
        for e in list {
            fl.sea
                .insert(e[0].as_str().unwrap().to_string(), e[1].as_i64().unwrap());
        }
    }
    fl
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

fn flat_pairs(v: &[(i64, i64)]) -> Value {
    Value::Array(
        v.iter()
            .flat_map(|p| [serde_json::json!(p.0), serde_json::json!(p.1)])
            .collect(),
    )
}

fn pairs_t(v: &Value) -> Vec<(i64, i64)> {
    pairs(v).into_iter().map(|c| (c.q, c.r)).collect()
}

fn str_set(v: &Value) -> Option<HashSet<String>> {
    v.as_array()
        .map(|a| a.iter().map(|k| k.as_str().unwrap().to_string()).collect())
}

/// Buduje opcje jak `buildOpts` w generatorze i uruchamia `f` (zycie pozyczek lokalne).
fn with_opts<R>(mp: &Map, c: &Value, f: impl FnOnce(&mut TraceRiverOpts<'_>) -> R) -> R {
    let mode = c["mode"].as_i64().unwrap();
    let oc2: HashSet<String> = if mode == 2 {
        let rm = str_set(&c["ocrm"]).unwrap();
        mp.oc_list
            .iter()
            .filter(|k| !rm.contains(*k))
            .cloned()
            .collect()
    } else {
        HashSet::new()
    };
    let block = str_set(&c["bl"]);
    let index = if c["ix"].as_bool().unwrap() {
        let list: Vec<String> = c["bl"]
            .as_array()
            .map(|a| a.iter().map(|k| k.as_str().unwrap().to_string()).collect())
            .unwrap_or_default();
        Some(RiverHexSpatialIndex::from_keys(
            list.iter().map(String::as_str),
        ))
    } else {
        None
    };
    let sd_sea: Option<HashMap<String, i64>> = if c["sd"].is_null() {
        None
    } else {
        let mut m = mp.sea.clone();
        let k = c["sd"]["k"].as_str().unwrap().to_string();
        match c["sd"]["v"].as_i64() {
            Some(v) => {
                m.insert(k, v);
            }
            None => {
                m.remove(&k);
            }
        }
        Some(m)
    };
    let square = c["sqr"]
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
    if let Some(m) = &sd_sea {
        o.sea_dist = Some(m);
    }
    if !c["seed"].is_null() {
        o.rand = Some(&mut *rand);
    }
    o.hard_meander_len = c["hl"].as_u64().map(|v| v as usize);
    o.allow_relief_traversal = c["rel"].as_bool();
    o.relax_sea_buffer = c["relax"].as_bool();
    o.min_len = c["minLen"].as_u64().map(|v| v as usize);
    o.mouth_tail_len = c["tail"].as_u64().map(|v| v as usize);
    o.block_river_keys = block.as_ref();
    o.min_path_sep = c["msep"].as_i64();
    o.land_centroid = c["lc"]
        .as_array()
        .map(|a| (a[0].as_f64().unwrap(), a[1].as_f64().unwrap()));
    o.land_center_square = square.as_ref();
    o.river_sep_index = index.as_ref();
    f(&mut o)
}

fn run_trace(mp: &Map, c: &Value) -> Vec<RiverCoord> {
    let (sq, sr) = (c["sq"].as_i64().unwrap(), c["sr"].as_i64().unwrap());
    let ml = c["ml"].as_u64().unwrap() as usize;
    with_opts(mp, c, |o| trace_river(&mp.rec, sq, sr, ml, o))
}

fn run_grid(mp: &Map, c: &Value) -> Vec<RiverCoord> {
    let (sq, sr) = (c["sq"].as_i64().unwrap(), c["sr"].as_i64().unwrap());
    let ml = c["ml"].as_u64().unwrap() as usize;
    let cat = c["cat"].as_u64().unwrap() as usize;
    let acc = c["acc"].as_u64().unwrap() as usize;
    let (rb, fast) = (c["rb"].as_bool().unwrap(), c["fast"].as_bool().unwrap());
    with_opts(mp, c, |o| {
        trace_river_for_grid_fill(&mp.rec, sq, sr, ml, cat, acc, o, rb, fast)
    })
}

fn with_field(c: &Value, key: &str, v: i64) -> Value {
    let mut c2 = c.clone();
    c2[key] = serde_json::json!(v);
    c2
}

fn tier_of(s: &str) -> DensityTier {
    match s {
        "low" => DensityTier::Low,
        "medium" => DensityTier::Medium,
        "high" => DensityTier::High,
        other => panic!("tier {other}"),
    }
}

fn run_pick(mp: &Map, c: &Value) -> Vec<(i64, i64)> {
    let fl = fields_sov(mp, c);
    let srcs = pairs_t(&c["srcs"]);
    let used = str_set(&c["used"]).unwrap_or_default();
    let mut rand = rand_for(&c["seed"]);
    pick_spread_river_sources(
        &srcs,
        c["count"].as_i64().unwrap(),
        c["ms"].as_i64().unwrap(),
        &fl.sea,
        &used,
        &mut *rand,
    )
}

#[test]
fn q4_vectors_match_web() {
    let root: Value = serde_json::from_str(WEB_Q4).expect("parse");
    let maps: Vec<Map> = root["maps"]
        .as_array()
        .unwrap()
        .iter()
        .map(build_map)
        .collect();
    let mut cnt = std::collections::BTreeMap::<String, usize>::new();
    let mut add = |k: &str| *cnt.entry(k.to_string()).or_default() += 1;
    for c in root["cases"].as_array().unwrap() {
        let f = c["fn"].as_str().unwrap();
        let mp = c["m"].as_u64().map(|m| &maps[m as usize]);
        match f {
            "trace" => {
                let got = run_trace(mp.unwrap(), c);
                assert_eq!(flat_out(&got), c["out"], "trace {c}");
                add(if got.is_empty() {
                    "trace_empty"
                } else {
                    "trace_path"
                });
                if got.len() >= 6 {
                    add("trace_ge6");
                }
                if c["relax"].as_bool() == Some(true) && !got.is_empty() {
                    add("trace_relax_path");
                }
                if !c["sqr"].is_null() && !got.is_empty() {
                    add("trace_square_path");
                }
            }
            "grid" => {
                let got = run_grid(mp.unwrap(), c);
                assert_eq!(flat_out(&got), c["out"], "grid {c}");
                add(if got.is_empty() {
                    "grid_empty"
                } else {
                    "grid_path"
                });
                if c["rb"].as_bool() == Some(true) && !got.is_empty() {
                    add("grid_relax_path");
                }
                if c["fast"].as_bool() == Some(true) && !got.is_empty() {
                    add("grid_fast_path");
                }
            }
            "foothill" => {
                let mp = mp.unwrap();
                let fl = fields_sov(mp, c);
                let got = collect_foothill_river_sources(
                    &mp.rec,
                    c["w"].as_i64().unwrap(),
                    c["h"].as_i64().unwrap(),
                    c["margin"].as_i64().unwrap(),
                    &fl.sea,
                );
                assert_eq!(flat_pairs(&got), c["out"], "foothill {c}");
                add(if got.is_empty() {
                    "foothill_empty"
                } else {
                    "foothill_nonempty"
                });
            }
            "spring" => {
                let mp = mp.unwrap();
                let fl = fields_sov(mp, c);
                let mut rand = rand_for(&c["seed"]);
                let got = collect_plain_spring_sources(
                    &mp.rec,
                    c["w"].as_i64().unwrap(),
                    c["h"].as_i64().unwrap(),
                    c["margin"].as_i64().unwrap(),
                    &fl.sea,
                    &mut *rand,
                    tier_of(c["tier"].as_str().unwrap()),
                );
                assert_eq!(flat_pairs(&got), c["out"], "spring {c}");
                add(if got.is_empty() {
                    "spring_empty"
                } else {
                    "spring_nonempty"
                });
            }
            "sources" => {
                let mp = mp.unwrap();
                let got = collect_river_sources(
                    &mp.rec,
                    c["w"].as_i64().unwrap(),
                    c["h"].as_i64().unwrap(),
                    c["margin"].as_i64().unwrap(),
                );
                assert_eq!(flat_pairs(&got), c["out"], "sources {c}");
                add(if got.is_empty() {
                    "sources_empty"
                } else {
                    "sources_nonempty"
                });
            }
            "pick" => {
                let got = run_pick(mp.unwrap(), c);
                assert_eq!(flat_pairs(&got), c["out"], "pick {c}");
                if got.len() >= 3 {
                    add("pick_ge3");
                }
                if got.is_empty() {
                    add("pick_empty");
                }
            }
            "cap" => {
                let quotas: Vec<i64> = c["quotas"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_i64().unwrap())
                    .collect();
                let got = cap_river_quotas(&quotas, c["mt"].as_i64().unwrap());
                assert_eq!(serde_json::json!(got), c["out"], "cap {c}");
                let sum: i64 = quotas.iter().map(|&n| n.max(0)).sum();
                if c["mt"].as_i64().unwrap() < sum {
                    add("cap_reduced");
                }
                if !quotas.is_empty()
                    && c["mt"].as_i64().unwrap() >= 0
                    && got.iter().sum::<i64>() > c["mt"].as_i64().unwrap()
                {
                    add("cap_floor_break");
                }
            }
            "sweep" => {
                let kind = c["kind"].as_str().unwrap();
                let lo = c["lo"].as_i64().unwrap();
                let outs = c["outs"].as_array().unwrap();
                for (i, want) in outs.iter().enumerate() {
                    let n = lo + i as i64;
                    let got: Value = match kind {
                        "cap" => {
                            let quotas: Vec<i64> = c["quotas"]
                                .as_array()
                                .unwrap()
                                .iter()
                                .map(|v| v.as_i64().unwrap())
                                .collect();
                            serde_json::json!(cap_river_quotas(&quotas, n))
                        }
                        "pick_count" => {
                            let c2 = with_field(c, "count", n);
                            flat_pairs(&run_pick(&maps[c["m"].as_u64().unwrap() as usize], &c2))
                        }
                        "pick_minsep" => {
                            let c2 = with_field(c, "ms", n);
                            flat_pairs(&run_pick(&maps[c["m"].as_u64().unwrap() as usize], &c2))
                        }
                        "trace_maxlen" => {
                            flat_out(&run_trace(mp.unwrap(), &with_field(c, "ml", n)))
                        }
                        "trace_minlen" => {
                            flat_out(&run_trace(mp.unwrap(), &with_field(c, "minLen", n)))
                        }
                        "trace_tail" => {
                            flat_out(&run_trace(mp.unwrap(), &with_field(c, "tail", n)))
                        }
                        "grid_accept" => flat_out(&run_grid(mp.unwrap(), &with_field(c, "acc", n))),
                        "grid_catalog" => {
                            flat_out(&run_grid(mp.unwrap(), &with_field(c, "cat", n)))
                        }
                        other => panic!("sweep {other}"),
                    };
                    assert_eq!(&got, want, "sweep {kind} N={n} {c}");
                }
                add("sweep");
                if outs.windows(2).any(|w| w[0] != w[1]) {
                    add("sweep_with_transition");
                }
                add(&format!("sweep_{kind}"));
            }
            other => panic!("typ {other}"),
        }
    }
    let g = |k: &str| cnt.get(k).copied().unwrap_or(0);
    assert!(
        g("trace_empty") >= 800
            && g("trace_path") >= 1200
            && g("trace_ge6") >= 600
            && g("trace_relax_path") >= 200
            && g("trace_square_path") >= 300,
        "{cnt:?}"
    );
    assert!(
        g("grid_empty") >= 500
            && g("grid_path") >= 400
            && g("grid_relax_path") >= 150
            && g("grid_fast_path") >= 150,
        "{cnt:?}"
    );
    assert!(
        g("foothill_nonempty") >= 200
            && g("spring_nonempty") >= 80
            && g("sources_nonempty") >= 200
            && g("foothill_empty") >= 10
            && g("spring_empty") >= 10,
        "{cnt:?}"
    );
    assert!(g("pick_ge3") >= 150 && g("pick_empty") >= 50, "{cnt:?}");
    assert!(
        g("cap_reduced") >= 300 && g("cap_floor_break") >= 100,
        "{cnt:?}"
    );
    assert!(
        g("sweep") >= 700 && g("sweep_with_transition") >= 650,
        "{cnt:?}"
    );
    for k in [
        "cap",
        "pick_count",
        "pick_minsep",
        "trace_maxlen",
        "trace_minlen",
        "trace_tail",
        "grid_accept",
        "grid_catalog",
    ] {
        assert!(g(&format!("sweep_{k}")) >= 60, "{k} {cnt:?}");
    }

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

/// `cap_river_quotas`: przypadki reczne wprost z definicji webu (pusta lista, ujemne, progi 0/1).
#[test]
fn cap_quotas_hand_cases() {
    assert_eq!(cap_river_quotas(&[], -1), Vec::<i64>::new());
    assert_eq!(cap_river_quotas(&[3, -2, 1], 10), vec![3, 0, 1]);
    assert_eq!(cap_river_quotas(&[3, 3, 1], 6), vec![2, 3, 1]);
    assert_eq!(cap_river_quotas(&[1, 1, 1], 0), vec![1, 1, 1]);
    assert_eq!(cap_river_quotas(&[2, 5, 5], 7), vec![2, 2, 3]);
}
