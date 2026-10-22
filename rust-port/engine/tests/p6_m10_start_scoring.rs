//! P6.M10 - punktacja i wybor hexu startu gracza (`startScoring.ts:1-142`; pin web `edb8fb56`).
//! Wektory z URUCHOMIONEGO weba (`tests/p6_m10_vectors/web-vectors.json`).

#[path = "p6_m10_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::cluster_mass::{
    find_best_player_start_hex, score_city_start_hex, start_reveal_radius,
    start_reveal_radius_for_difficulty, StartDifficulty,
};
use common::*;

#[test]
fn reveal_radius_matches_web() {
    assert_eq!(
        start_reveal_radius(),
        i(&web()["cases"]["consts"]["START_REVEAL_RADIUS"])
    );
    for c in cases("reveal") {
        let d = match s(&c["diff"]) {
            "easy" => StartDifficulty::Easy,
            "hard" => StartDifficulty::Hard,
            // web: kazda inna wartosc => galaz `default` (8)
            _ => StartDifficulty::Normal,
        };
        assert_eq!(
            start_reveal_radius_for_difficulty(d),
            i(&c["result"]),
            "{c}"
        );
    }
}

#[test]
fn score_city_start_hex_matches_web() {
    let rows = cases("scoreStart");
    assert!(rows.len() > 1000);
    let mut neg_inf = 0;
    let mut finite = 0;
    for c in rows {
        let id = s(&c["map"]);
        let got = score_city_start_hex(map_of(id), i(&c["q"]) as i32, i(&c["r"]) as i32);
        assert_f64(got, fv(&c["score"]), &format!("{id} {c}"));
        if got == f64::NEG_INFINITY {
            neg_inf += 1;
        } else {
            finite += 1;
        }
    }
    assert!(
        neg_inf > 50 && finite > 300,
        "pokrycie: -inf {neg_inf}, skonczone {finite}"
    );
}

#[test]
fn score_city_start_hex_over_whole_maps_matches_web() {
    let all = web()["cases"]["scoreStartAll"].as_object().expect("obj");
    assert!(all.len() >= 2);
    for (id, list) in all {
        let map = map_of(id);
        let list = list.as_array().expect("lista");
        assert_eq!(list.len(), map.tiles.len(), "{id}");
        for (t, want) in map.tiles.iter().zip(list) {
            let got = score_city_start_hex(map, t.coord.q, t.coord.r);
            assert_f64(
                got,
                fv(want),
                &format!("{id} ({},{})", t.coord.q, t.coord.r),
            );
        }
    }
}

#[test]
fn find_best_player_start_hex_matches_web() {
    let rows = cases("bestStart");
    assert!(rows.len() >= 17);
    let mut some = 0;
    for c in rows {
        let id = s(&c["map"]);
        let got = find_best_player_start_hex(map_of(id));
        assert_eq!(got, opt_hex(&c["result"]), "{id}");
        some += usize::from(got.is_some());
    }
    assert!(some >= 10, "za malo map z hexem startu: {some}");
}
