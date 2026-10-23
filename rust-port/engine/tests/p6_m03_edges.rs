//! P6.M03 - przypadki brzegowe z URUCHOMIONEGO weba (`tests/p6_m03_vectors/edges.json`, pin
//! `edb8fb56`, `gen-m03-edges.mjs`): argumenty `landFraction` rowne progom ukladu Pangei co do
//! bitu (+-40 ulp) oraz `mapEdgeRectFade` / `landMaskBorderFade` dla map szerszych niz 2000 heksow
//! (podloga `0.001` marginesu).

use std::sync::OnceLock;

use civ_engine::domain::mapgen::masks::{
    land_mask_border_fade, map_edge_rect_fade, pangea_land_layout_params, pangea_land_t,
};
use serde_json::Value;

#[path = "p6_m03_vectors/common.rs"]
mod common;
use common::{dim, int, num, same};

const EDGES: &str = include_str!("p6_m03_vectors/edges.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(EDGES).expect("edges parse"))
}

#[test]
fn pangea_layout_matches_web_at_exact_threshold_neighbourhoods() {
    let rows = web()["layout"].as_array().expect("layout");
    assert!(rows.len() >= 900);
    for row in rows {
        let lf = num(&row["lf"]);
        assert!(same(pangea_land_t(lf), num(&row["t"])), "lf {lf:?}");
        let l = pangea_land_layout_params(lf, dim(&row["w"]), dim(&row["h"]));
        let actual = [
            f64::from(l.n_blobs),
            l.blob_radius_min,
            l.blob_radius_max,
            l.ring_r_min,
            l.ring_r_max,
            l.cluster_radius,
            l.threshold,
            l.merge_sum,
            l.merge_max,
            l.global_warp,
            l.valley,
            l.fill_min_score,
        ];
        for (i, (a, e)) in actual
            .iter()
            .zip(row["values"].as_array().expect("values"))
            .enumerate()
        {
            assert!(same(*a, num(e)), "lf {lf:?} pole {i}");
        }
    }
}

#[test]
fn exact_threshold_arguments_exist_in_the_vectors() {
    // Test chroni wektory przed degeneracja: musi istniec `landFraction` z `t == prog_srednie`
    // co do bitu (dla `prog_male` nie istnieje zadna taka wartosc - zob. dokument).
    let t_equal = &web()["t_equal"];
    assert!(!t_equal["srednie"].as_array().expect("srednie").is_empty());
    assert!(!t_equal["zero"].as_array().expect("zero").is_empty());
    assert!(!t_equal["jeden"].as_array().expect("jeden").is_empty());
}

#[test]
fn edge_rect_floor_matches_web_for_maps_wider_than_2000_hexes() {
    for case in web()["edge_rect"].as_array().expect("edge_rect") {
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        for row in case["rows"].as_array().expect("rows") {
            let (q, r) = (int(&row[0]), int(&row[1]));
            assert!(
                same(map_edge_rect_fade(q, r, w, h), num(&row[2])),
                "{w}x{h} ({q},{r})"
            );
            assert!(
                same(land_mask_border_fade(q, r, w, h), num(&row[3])),
                "{w}x{h} ({q},{r})"
            );
        }
    }
}
