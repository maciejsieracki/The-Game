//! P6.M07B partia 1 - `rivers_b/turn.rs` wzgledem wektorow z URUCHOMIONEGO weba
//! (pin `edb8fb56`, gen-helpers.ts:7051-7086). Wektory: `p6_m07b_vectors/web-rivers-b-turn.json`
//! (generator w repo: `p6_m07b_vectors/gen_turn_vectors.mjs`, uruchomiony pod
//! `node --experimental-strip-types` na kopii pinu; weryfikator: `verify_m07b_turn.py`).

use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::rivers_b::turn::{
    river_path_has_sharp_u_turn, river_path_violates_turn_window, river_segment_unit_vector,
};
use serde_json::Value;

const WEB_TURN: &str = include_str!("p6_m07b_vectors/web-rivers-b-turn.json");

/// Format v2: plaski, parzysty ciag `[q0, r0, q1, r1, ...]` w polu `p`.
fn path_of(v: &Value) -> Vec<RiverCoord> {
    let flat: Vec<i64> = v["p"]
        .as_array()
        .expect("path")
        .iter()
        .map(|x| x.as_i64().unwrap())
        .collect();
    assert_eq!(flat.len() % 2, 0, "nieparzysta liczba wspolrzednych");
    flat.chunks(2)
        .map(|c| RiverCoord::new(c[0], c[1]))
        .collect()
}

fn pair_of(v: &Value, key: &str) -> RiverCoord {
    let p = &v[key];
    RiverCoord::new(p[0].as_i64().unwrap(), p[1].as_i64().unwrap())
}

#[test]
fn turn_vectors_match_web() {
    let root: Value = serde_json::from_str(WEB_TURN).expect("parse");
    let vecs = root["vectors"].as_array().expect("vectors");
    let (mut n_unit, mut n_uturn, mut n_viol) = (0usize, 0usize, 0usize);
    for v in vecs {
        match v["fn"].as_str().unwrap() {
            "unit" => {
                n_unit += 1;
                let got = river_segment_unit_vector(pair_of(v, "a"), pair_of(v, "b"));
                let ex = v["x"].as_f64().unwrap();
                let ey = v["y"].as_f64().unwrap();
                assert!(
                    (got.x - ex).abs() <= 1e-12 && (got.y - ey).abs() <= 1e-12,
                    "unit {v} got {got:?}"
                );
            }
            "uturn" => {
                n_uturn += 1;
                let got = river_path_has_sharp_u_turn(&path_of(v));
                assert_eq!(got, v["out"].as_bool().unwrap(), "uturn {v}");
            }
            "viol" => {
                n_viol += 1;
                let path = path_of(v);
                let (wh, ms) = match (v.get("windowHex"), v.get("maxSum")) {
                    (Some(w), Some(m)) => (w.as_u64().unwrap() as usize, m.as_i64().unwrap()),
                    _ => (6usize, 1i64),
                };
                let got = river_path_violates_turn_window(&path, wh, ms);
                assert_eq!(got, v["out"].as_bool().unwrap(), "viol {v}");
            }
            other => panic!("nieznany typ wektora {other}"),
        }
    }
    assert_eq!(n_unit, root["stats"]["unit"].as_u64().unwrap() as usize);
    assert_eq!(n_uturn, root["stats"]["uturn"].as_u64().unwrap() as usize);
    assert_eq!(n_viol, root["stats"]["viol"].as_u64().unwrap() as usize);
}

#[test]
fn turn_vectors_cover_both_outcomes() {
    let root: Value = serde_json::from_str(WEB_TURN).expect("parse");
    assert!(root["stats"]["uturnTrue"].as_u64().unwrap() > 0);
    assert!(root["stats"]["violTrue"].as_u64().unwrap() > 0);
    let viol_false =
        root["stats"]["viol"].as_u64().unwrap() - root["stats"]["violTrue"].as_u64().unwrap();
    assert!(viol_false > 0);
}
