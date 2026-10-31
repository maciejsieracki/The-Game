//! P6.M07B-Q2 partia 1 - `rivers_b/edges.rs` i `rivers_b/window.rs` wzgledem wektorow z
//! URUCHOMIONEGO weba (pin `edb8fb56`). Wektory: `p6_m07b2_vectors/web-rivers-b-edges.json`
//! (generator w repo: `p6_m07b2_vectors/gen_edges_vectors.mjs`).

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::rivers_b::edges::{
    can_receive_river_yield_mark, mark_river_edge, mark_river_edge_pair,
    mark_river_transit_edges_on_path, river_corners_along_hex_edges, river_edge_between_corners,
    river_hex_corner_step, river_transit_edge_indices, simplify_river_render_path,
    walk_river_hex_perimeter,
};
use civ_engine::domain::mapgen::rivers_b::window::sanitize_river_turn_window;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_EDGES: &str = include_str!("p6_m07b2_vectors/web-rivers-b-edges.json");

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

/// Mapa z wektora: `hex` = {k,q,r,t,n,z,rz}; `rz` = null | {obecna, krawedzie}.
fn build_map(list: &[Value]) -> HexRecord {
    let mut rec = HexRecord::new();
    for h in list {
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

/// Stan rzeki (obecna, krawedzie) dla kluczy mapy wejsciowej, w tej samej kolejnosci co web.
fn snapshot(rec: &HexRecord, list: &[Value]) -> Vec<(String, i64, Vec<i64>)> {
    list.iter()
        .map(|h| {
            let k = h["k"].as_str().unwrap().to_string();
            match rec.get(&k) {
                Some(th) => (
                    k,
                    i64::from(th.river_present),
                    th.river_edges.iter().map(|&e| i64::from(e)).collect(),
                ),
                None => (k, 0, Vec::new()),
            }
        })
        .collect()
}

fn diff_json(before: &[(String, i64, Vec<i64>)], after: &[(String, i64, Vec<i64>)]) -> Value {
    let mut out = Vec::new();
    for (b, a) in before.iter().zip(after.iter()) {
        if b != a {
            out.push(serde_json::json!([a.0, a.1, a.2]));
        }
    }
    Value::Array(out)
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
    let mut v = Vec::new();
    for p in path {
        v.push(serde_json::json!(p.q));
        v.push(serde_json::json!(p.r));
    }
    Value::Array(v)
}

fn load() -> Value {
    serde_json::from_str(WEB_EDGES).expect("parse")
}

#[test]
fn edges_vectors_match_web() {
    let root = load();
    let maps: Vec<Vec<Value>> = root["maps"]
        .as_array()
        .unwrap()
        .iter()
        .map(|m| m.as_array().unwrap().clone())
        .collect();
    let mut counts = std::collections::BTreeMap::<String, usize>::new();
    for c in root["cases"].as_array().unwrap() {
        let f = c["fn"].as_str().unwrap().to_string();
        *counts.entry(f.clone()).or_default() += 1;
        match f.as_str() {
            "canreceive" => {
                let rec = build_map(&maps[c["m"].as_u64().unwrap() as usize]);
                let k = c["k"].as_str().unwrap();
                let got = can_receive_river_yield_mark(rec.get(k));
                assert_eq!(got, c["out"].as_bool().unwrap(), "canreceive {c}");
            }
            "mark_edge" | "mark_pair" => {
                let list = &maps[c["m"].as_u64().unwrap() as usize];
                let mut rec = build_map(list);
                let before = snapshot(&rec, list);
                let (q, r, e) = (
                    c["q"].as_i64().unwrap(),
                    c["r"].as_i64().unwrap(),
                    c["e"].as_i64().unwrap(),
                );
                if f == "mark_edge" {
                    mark_river_edge(&mut rec, q, r, e);
                } else {
                    mark_river_edge_pair(&mut rec, q, r, e);
                }
                let got = diff_json(&before, &snapshot(&rec, list));
                assert_eq!(got, c["d"], "{f} {c}");
            }
            "mark_transit" => {
                let list = &maps[c["m"].as_u64().unwrap() as usize];
                let mut rec = build_map(list);
                let before = snapshot(&rec, list);
                mark_river_transit_edges_on_path(&mut rec, &pairs(&c["p"]));
                let got = diff_json(&before, &snapshot(&rec, list));
                assert_eq!(got, c["d"], "mark_transit {c}");
            }
            "simplify" => {
                let got = simplify_river_render_path(&pairs(&c["p"]));
                assert_eq!(flat_out(&got), c["out"], "simplify {c}");
            }
            "sanitize_window" => {
                let list = &maps[c["m"].as_u64().unwrap() as usize];
                let rec = build_map(list);
                let got =
                    sanitize_river_turn_window(&pairs(&c["p"]), &rec, c["src"].as_str().unwrap());
                assert_eq!(flat_out(&got), c["out"], "sanitize {c}");
            }
            "corner_step" => {
                let got =
                    river_hex_corner_step(c["f"].as_i64().unwrap(), c["cw"].as_bool().unwrap());
                assert_eq!(got, c["out"].as_i64().unwrap(), "corner_step {c}");
            }
            "walk" => {
                let got = walk_river_hex_perimeter(
                    c["f"].as_i64().unwrap(),
                    c["t"].as_i64().unwrap(),
                    c["cw"].as_bool().unwrap(),
                );
                assert_eq!(serde_json::json!(got), c["out"], "walk {c}");
            }
            "edge_between" => {
                let got =
                    river_edge_between_corners(c["a"].as_i64().unwrap(), c["b"].as_i64().unwrap());
                assert_eq!(got, c["out"].as_i64().unwrap(), "edge_between {c}");
            }
            "corners" => {
                let got = river_corners_along_hex_edges(
                    c["i"].as_i64().unwrap(),
                    c["o"].as_i64().unwrap(),
                    c["par"].as_i64().unwrap(),
                );
                assert_eq!(serde_json::json!(got), c["out"], "corners {c}");
            }
            "transit_idx" => {
                let got = river_transit_edge_indices(
                    c["i"].as_i64().unwrap(),
                    c["o"].as_i64().unwrap(),
                    c["par"].as_i64().unwrap(),
                );
                assert_eq!(serde_json::json!(got), c["out"], "transit_idx {c}");
            }
            other => panic!("nieznany typ wektora {other}"),
        }
    }
    for (k, v) in root["stats"].as_object().unwrap() {
        assert_eq!(
            counts.get(k).copied().unwrap_or(0),
            v.as_u64().unwrap() as usize,
            "{k}"
        );
    }
}

#[test]
fn edges_vectors_cover_branches_and_overlays() {
    let root = load();
    let maps = root["maps"].as_array().unwrap();
    // lekcja (a): nakladki na heksach wodnych i ladowych
    let (mut water_ov, mut land_ov) = (0usize, 0usize);
    for m in maps {
        for h in m.as_array().unwrap() {
            let water = matches!(h["t"].as_str().unwrap(), "morze" | "plytkie_morze");
            let ov = h["n"].as_str().unwrap() != "brak" || h["z"].as_bool().unwrap();
            if ov && water {
                water_ov += 1;
            }
            if ov && !water {
                land_ov += 1;
            }
        }
    }
    assert!(
        water_ov > 0 && land_ov > 0,
        "brak nakladek na wodzie lub ladzie"
    );
    // galezie: zmiany stanu rzeki, obie wartosci canReceive, cięcie okna, uproszczenie
    let mut changed = std::collections::BTreeMap::<String, usize>::new();
    let (mut recv_true, mut recv_false) = (0usize, 0usize);
    let (mut sanitize_changed, mut simp_changed) = (0usize, 0usize);
    for c in root["cases"].as_array().unwrap() {
        match c["fn"].as_str().unwrap() {
            "mark_edge" | "mark_pair" | "mark_transit" => {
                if !c["d"].as_array().unwrap().is_empty() {
                    *changed
                        .entry(c["fn"].as_str().unwrap().to_string())
                        .or_default() += 1;
                }
            }
            "canreceive" => {
                if c["out"].as_bool().unwrap() {
                    recv_true += 1;
                } else {
                    recv_false += 1;
                }
            }
            "sanitize_window" => {
                if c["out"] != c["p"] {
                    sanitize_changed += 1;
                }
            }
            "simplify" => {
                if c["out"] != c["p"] {
                    simp_changed += 1;
                }
            }
            _ => {}
        }
    }
    for f in ["mark_edge", "mark_pair", "mark_transit"] {
        assert!(
            changed.get(f).copied().unwrap_or(0) > 0,
            "brak zmian dla {f}"
        );
    }
    assert!(recv_true > 0 && recv_false > 0, "canReceive jednostronne");
    assert!(
        sanitize_changed > 0,
        "sanityzacja nigdy nie zmienia sciezki"
    );
    assert!(simp_changed > 0, "uproszczenie nigdy nie zmienia sciezki");
}

#[test]
fn edges_point_cases_match_contract() {
    // jawne przypadki kontraktu (zgodne z webem; wartosci z wektorow w tym samym pliku)
    assert_eq!(river_hex_corner_step(5, true), 0);
    assert_eq!(river_hex_corner_step(0, false), 5);
    assert_eq!(walk_river_hex_perimeter(2, 2, true), vec![2]);
    assert_eq!(river_edge_between_corners(0, 3), -1);
    assert!(river_corners_along_hex_edges(1, 1, 0).is_empty());
}
