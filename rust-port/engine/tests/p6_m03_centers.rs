//! P6.M03 - parametry ksztaltu, maska eliptyczna, centra kontynentow (kontynenty / pangea / wyspy),
//! strefy Voronoi, uklad Pangea i siatka wysp: porownanie BITOWE z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m03_vectors/core.json`, pin `edb8fb56`).

use std::sync::OnceLock;

use civ_engine::domain::map_generator::WorldType;
use civ_engine::domain::mapgen::masks::{
    assign_island_grid_indices, build_continent_centers, build_five_zone_continent_centers,
    build_pangea_blob_centers, build_sixteen_grid_island_centers, continent_center_count,
    default_shape_params, island_grid_cell_index, island_grid_divisions, kontynenty_zone_count,
    land_mask_at, map_isotropic_from_center, nearest_continent_zone_index, norm_to_isotropic,
    pangea_land_layout_params, pangea_land_t, second_nearest_continent_dist, ziemia_land_centers,
    ContinentCenter, ContinentCenterOpts,
};
use civ_engine::domain::mapgen::prims::build_perm_table;
use serde_json::Value;

#[path = "p6_m03_vectors/common.rs"]
mod common;
use common::{assert_centers, centers, dim, int, num, rng, same};

const CORE: &str = include_str!("p6_m03_vectors/core.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(CORE).expect("core parse"))
}

fn list(name: &str) -> &'static Vec<Value> {
    web()[name].as_array().expect(name)
}

fn seed_of(value: &Value) -> u32 {
    u32::try_from(int(value)).expect("ziarno u32")
}

fn world_type(name: &str) -> WorldType {
    match name {
        "kontynenty" => WorldType::Continents,
        "pangea" => WorldType::Pangea,
        "wyspy" => WorldType::Islands,
        "ziemia" => WorldType::Earth,
        other => panic!("typ swiata {other}"),
    }
}

#[test]
fn named_constants_match_web_exports() {
    let consts = &web()["consts"];
    assert_eq!(
        u64::from(kontynenty_zone_count()),
        consts["kontynenty_zone_count"].as_u64().expect("count")
    );
    assert_eq!(
        u64::from(island_grid_divisions()),
        consts["island_grid_divisions"].as_u64().expect("grid")
    );
    assert_eq!(
        masks_border_ocean(),
        consts["map_border_ocean_hexes"].as_f64().expect("border")
    );
    assert_eq!(
        masks_margin_zone(),
        consts["map_margin_land_zone_hexes"].as_f64().expect("zone")
    );
    assert_centers(
        &ziemia_land_centers(),
        &centers(&consts["ziemia_land_centers"]),
        "ZIEMIA_LAND_CENTERS",
    );
}

fn masks_border_ocean() -> f64 {
    civ_engine::domain::mapgen::masks::map_border_ocean_hexes()
}

fn masks_margin_zone() -> f64 {
    civ_engine::domain::mapgen::masks::map_margin_land_zone_hexes()
}

#[test]
fn perm_tables_from_seed_match_web() {
    for row in list("perms") {
        let table = build_perm_table(rng(seed_of(&row["seed"])));
        let expected: Vec<u8> = row["table"]
            .as_array()
            .expect("table")
            .iter()
            .map(|v| u8::try_from(int(v)).expect("u8"))
            .collect();
        assert_eq!(table.to_vec(), expected, "ziarno {}", row["seed"]);
    }
}

#[test]
fn default_shape_params_match_web_and_consume_six_draws() {
    for row in list("shape_params") {
        let mut rand = rng(seed_of(&row["seed"]));
        let s = default_shape_params(&mut rand);
        let actual = [
            s.noise_scale,
            s.mountain_scale,
            s.forest_scale,
            s.desert_scale,
            s.off_mtn_x,
            s.off_mtn_y,
            s.off_for_x,
            s.off_for_y,
            s.off_des_x,
            s.off_des_y,
        ];
        let expected = row["values"].as_array().expect("values");
        assert_eq!(actual.len(), expected.len());
        for (i, (a, e)) in actual.iter().zip(expected).enumerate() {
            assert!(same(*a, num(e)), "ziarno {} pole {i}", row["seed"]);
        }
        // Dokladnie 6 wywolan rand(): nastepne dwie wartosci strumienia zgadzaja sie z webem.
        let after = row["after"].as_array().expect("after");
        assert!(same(rand(), num(&after[0])));
        assert!(same(rand(), num(&after[1])));
    }
}

#[test]
fn elliptical_mask_matches_web_inside_and_outside_the_map() {
    let mut count = 0;
    for case in list("land_mask_at") {
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        let values = case["values"].as_array().expect("values");
        let mut i = 0;
        for r in -1..=i64::from(h) {
            for q in -1..=i64::from(w) {
                let actual = land_mask_at(q, r, w, h);
                assert!(same(actual, num(&values[i])), "{w}x{h} ({q},{r})");
                i += 1;
                count += 1;
            }
        }
        assert_eq!(i, values.len());
    }
    assert!(count > 3_000);
}

#[test]
fn continent_center_count_matches_web_for_all_world_types() {
    for row in list("center_count") {
        let typ = world_type(row["typ"].as_str().expect("typ"));
        assert_eq!(
            u64::from(continent_center_count(dim(&row["w"]), dim(&row["h"]), typ)),
            row["n"].as_u64().expect("n"),
            "{row}"
        );
    }
}

fn opts_from(value: &Value) -> Option<ContinentCenterOpts> {
    if value.is_null() {
        return None;
    }
    let get = |key: &str| value.get(key).and_then(Value::as_f64);
    Some(ContinentCenterOpts {
        radius_min: get("radiusMin"),
        radius_max: get("radiusMax"),
        min_center_dist: get("minCenterDist"),
        width: get("width"),
        height: get("height"),
        anchor_center: value.get("anchorCenter").and_then(Value::as_bool),
        ring_radius_min: get("ringRadiusMin"),
        ring_radius_max: get("ringRadiusMax"),
    })
}

#[test]
fn build_continent_centers_matches_web_including_rng_consumption() {
    let rows = list("build_continent_centers");
    assert!(rows.len() >= 40);
    for row in rows {
        let mut rand = rng(seed_of(&row["seed"]));
        let opts = opts_from(&row["opts"]);
        let actual = build_continent_centers(&mut rand, int(&row["n"]), opts.as_ref());
        assert_centers(&actual, &centers(&row["centers"]), &format!("{row}"));
        let after = row["after"].as_array().expect("after");
        for expected in after {
            assert!(same(rand(), num(expected)), "zuzycie rand(): {row}");
        }
    }
}

#[test]
fn five_zone_centers_match_web_including_rng_consumption() {
    let rows = list("five_zone");
    assert!(rows.len() >= 90);
    for row in rows {
        let mut rand = rng(seed_of(&row["seed"]));
        let actual = build_five_zone_continent_centers(
            &mut rand,
            dim(&row["w"]),
            dim(&row["h"]),
            num(&row["rmin"]),
            num(&row["rmax"]),
        );
        assert_centers(&actual, &centers(&row["centers"]), &format!("{row}"));
        for expected in row["after"].as_array().expect("after") {
            assert!(same(rand(), num(expected)), "zuzycie rand(): {row}");
        }
    }
}

#[test]
fn voronoi_zone_index_and_second_distance_match_web_with_ties() {
    let mut points = 0;
    for set in list("voronoi") {
        let cs: Vec<ContinentCenter> = centers(&set["centers"]);
        for p in set["points"].as_array().expect("points") {
            let (nq, nr) = (num(&p[0]), num(&p[1]));
            assert_eq!(
                nearest_continent_zone_index(nq, nr, &cs) as i64,
                int(&p[2]),
                "{} ({nq}, {nr})",
                set["name"]
            );
            assert!(
                same(second_nearest_continent_dist(nq, nr, &cs), num(&p[3])),
                "{} ({nq}, {nr})",
                set["name"]
            );
            points += 1;
        }
    }
    assert!(points > 10_000);
}

#[test]
fn pangea_land_t_matches_web_including_clamps_and_non_finite() {
    for row in list("pangea_land_t") {
        assert!(
            same(pangea_land_t(num(&row[0])), num(&row[1])),
            "landFraction {}",
            row[0]
        );
    }
}

#[test]
fn pangea_layout_params_match_web_for_every_field() {
    let rows = list("pangea_layout");
    assert!(rows.len() >= 390);
    for row in rows {
        let l = pangea_land_layout_params(num(&row["lf"]), dim(&row["w"]), dim(&row["h"]));
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
        let expected = row["values"].as_array().expect("values");
        for (i, (a, e)) in actual.iter().zip(expected).enumerate() {
            assert!(
                same(*a, num(e)),
                "{}x{} lf {} pole {i}: rust {a:?} web {e}",
                row["w"],
                row["h"],
                row["lf"]
            );
        }
    }
}

#[test]
fn pangea_blob_centers_match_web_including_rng_consumption() {
    let rows = list("pangea_centers");
    assert!(rows.len() >= 100);
    for row in rows {
        let mut rand = rng(seed_of(&row["seed"]));
        let actual =
            build_pangea_blob_centers(&mut rand, dim(&row["w"]), dim(&row["h"]), num(&row["lf"]));
        assert_centers(&actual, &centers(&row["centers"]), &format!("{row}"));
        for expected in row["after"].as_array().expect("after") {
            assert!(same(rand(), num(expected)), "zuzycie rand(): {row}");
        }
    }
}

#[test]
fn island_centers_match_web_including_rng_consumption() {
    let rows = list("island_centers");
    assert!(rows.len() >= 24);
    for row in rows {
        let mut rand = rng(seed_of(&row["seed"]));
        let actual = build_sixteen_grid_island_centers(&mut rand, dim(&row["w"]), dim(&row["h"]));
        assert_eq!(actual.len(), 16);
        assert_centers(&actual, &centers(&row["centers"]), &format!("{row}"));
        for expected in row["after"].as_array().expect("after") {
            assert!(same(rand(), num(expected)), "zuzycie rand(): {row}");
        }
    }
}

#[test]
fn island_grid_cell_index_matches_web_including_out_of_range_cells() {
    for case in list("island_cell") {
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        let expected = case["indices"].as_array().expect("indices");
        let mut i = 0;
        for r in -2..=i64::from(h) + 1 {
            for q in -2..=i64::from(w) + 1 {
                assert_eq!(
                    island_grid_cell_index(q, r, w, h),
                    int(&expected[i]),
                    "{w}x{h} ({q},{r})"
                );
                i += 1;
            }
        }
        assert_eq!(i, expected.len());
    }
}

#[test]
fn assign_island_grid_indices_keeps_web_map_insertion_order() {
    for case in list("island_assign") {
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        let actual = assign_island_grid_indices(w, h);
        let expected = case["entries"].as_array().expect("entries");
        assert_eq!(actual.len(), expected.len(), "{w}x{h}");
        for (i, ((key, index), row)) in actual.iter().zip(expected).enumerate() {
            assert_eq!(key, row[0].as_str().expect("key"), "{w}x{h} wpis {i}");
            assert_eq!(*index, int(&row[1]), "{w}x{h} wpis {i}");
        }
    }
}

#[test]
fn isotropic_helpers_match_web() {
    for case in list("isotropic") {
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        for p in case["points"].as_array().expect("points") {
            let (x, y) = map_isotropic_from_center(int(&p[0]), int(&p[1]), w, h);
            assert!(same(x, num(&p[2])) && same(y, num(&p[3])), "{w}x{h} {p}");
            let (ix, iy) = norm_to_isotropic(num(&p[4]), num(&p[5]), w, h);
            assert!(same(ix, num(&p[6])) && same(iy, num(&p[7])), "{w}x{h} {p}");
        }
    }
}
