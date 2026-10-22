//! P6.M01 — maska Ziemi (`earth-land-mask.generated.ts`, `earth-land-mask.ts`): dane maski bit-w-bit
//! (288000 bitow) oraz funkcje probkowania/mapowania, porownywane BITOWO z wektorami z URUCHOMIONEGO
//! weba (`tests/p6_m01_vectors/web-vectors.json`, pin `edb8fb56`).

use std::sync::OnceLock;

use civ_engine::data::derived::parse_earth_land_mask;
use civ_engine::domain::mapgen::prims::{
    earth_hex_to_template_norm, earth_land_fraction_threshold, earth_land_map_rows,
    earth_mask_bbox, earth_mask_bit_at, earth_mask_height, earth_mask_width,
    earth_north_ocean_rows, earth_playable_border, earth_playable_inner_height,
    earth_playable_inner_width, earth_polar_ocean_ref_inner_h, earth_polar_ocean_ref_rows,
    earth_polar_ocean_rows, earth_south_ocean_rows, earth_subsample_grid, earth_template_land_at,
    latitudinal_ocean_buffer_rows, sample_earth_template_land,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m01_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn txt(value: &Value) -> f64 {
    value.as_str().expect("tekst liczby").parse().expect("f64")
}

fn u(value: &Value) -> u32 {
    u32::try_from(value.as_u64().expect("u64")).expect("u32")
}

#[test]
fn mask_dimensions_and_bbox_match_web_bit_for_bit() {
    let mask = &web()["earth_mask"];
    assert_eq!(earth_mask_width() as u64, mask["w"].as_u64().expect("w"));
    assert_eq!(earth_mask_height() as u64, mask["h"].as_u64().expect("h"));
    assert_eq!(
        mask["rowCount"].as_u64().expect("rows") as usize,
        earth_mask_height()
    );
    assert_eq!(mask["rowLengths"], serde_json::json!([earth_mask_width()]));
    assert_eq!(mask["onlyBits"], serde_json::json!(true));
    let bbox = mask["bbox"].as_array().expect("bbox");
    let (min_x, min_y, max_x, max_y) = earth_mask_bbox();
    for (actual, expected) in [min_x, min_y, max_x, max_y].into_iter().zip(bbox) {
        assert_eq!(actual.to_bits(), txt(expected).to_bits());
    }
}

#[test]
fn all_288000_mask_bits_match_the_web_rows() {
    let mask = &web()["earth_mask"];
    let toggles = mask["toggles"].as_array().expect("toggles");
    assert_eq!(toggles.len(), 400);
    let mut ones = 0_u64;
    for (y, row) in toggles.iter().enumerate() {
        // Web: wiersz zaczyna sie od 0; kazda pozycja z listy odwraca bit.
        let flips: Vec<usize> = row
            .as_array()
            .expect("row")
            .iter()
            .map(|v| v.as_u64().expect("x") as usize)
            .collect();
        let mut expected = 0_u8;
        let mut next_flip = 0;
        for x in 0..earth_mask_width() {
            while next_flip < flips.len() && flips[next_flip] == x {
                expected ^= 1;
                next_flip += 1;
            }
            let actual = earth_mask_bit_at(x as i64, y as i64);
            assert_eq!(actual, expected, "bit ({x}, {y})");
            ones += u64::from(actual);
        }
        assert_eq!(next_flip, flips.len(), "wiersz {y}: nieuzyte przelaczenia");
    }
    assert_eq!(ones, mask["ones"].as_u64().expect("ones"));
}

#[test]
fn bit_at_clamps_out_of_range_coordinates_like_web() {
    let rows = web()["bit_at"].as_array().expect("bit_at");
    assert!(rows.len() >= 400);
    for row in rows {
        let (x, y) = (row[0].as_i64().expect("x"), row[1].as_i64().expect("y"));
        assert_eq!(
            u64::from(earth_mask_bit_at(x, y)),
            row[2].as_u64().expect("bit"),
            "({x}, {y})"
        );
    }
}

#[test]
fn derived_mask_file_is_the_single_source_of_mask_data() {
    let file = parse_earth_land_mask().expect("earth-land-mask.json");
    assert_eq!(file.szerokosc, earth_mask_width());
    assert_eq!(file.wysokosc, earth_mask_height());
}

#[test]
fn polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600() {
    let rows = web()["earth_rows"].as_array().expect("earth_rows");
    assert_eq!(rows.len(), 601);
    for row in rows {
        let h = u(&row[0]);
        assert_eq!(earth_polar_ocean_rows(h), u(&row[1]), "polar h={h}");
        assert_eq!(earth_north_ocean_rows(h), u(&row[2]), "north h={h}");
        assert_eq!(earth_south_ocean_rows(h), u(&row[3]), "south h={h}");
        assert_eq!(earth_playable_inner_height(h), u(&row[4]), "innerH h={h}");
        assert_eq!(earth_playable_inner_width(h), u(&row[5]), "innerW w={h}");
        assert_eq!(earth_land_map_rows(h), u(&row[6]), "landRows h={h}");
        assert_eq!(
            latitudinal_ocean_buffer_rows(h, false),
            u(&row[7]),
            "buffer(false) h={h}"
        );
        assert_eq!(
            latitudinal_ocean_buffer_rows(h, true),
            u(&row[8]),
            "buffer(true) h={h}"
        );
    }
}

#[test]
fn named_constants_match_web_exports() {
    let consts = &web()["earth_consts"];
    assert_eq!(earth_polar_ocean_ref_rows(), u(&consts["ref_rows"]));
    assert_eq!(earth_polar_ocean_ref_inner_h(), u(&consts["ref_inner_h"]));
    assert_eq!(earth_playable_border(), u(&consts["border"]));
}

#[test]
fn sample_template_land_matches_web_on_thousands_of_points() {
    let rows = web()["sample_land"].as_array().expect("sample_land");
    assert!(rows.len() >= 4000);
    let (mut ones, mut zeros) = (0, 0);
    for row in rows {
        let (nq, nr) = (txt(&row[0]), txt(&row[1]));
        let expected = row[2].as_u64().expect("0/1");
        assert_eq!(
            sample_earth_template_land(nq, nr),
            expected as f64,
            "({nq}, {nr})"
        );
        if expected == 1 {
            ones += 1;
        } else {
            zeros += 1;
        }
    }
    assert!(
        ones > 100 && zeros > 100,
        "wektory musza obejmowac oba wyniki ({ones}/{zeros})"
    );
}

#[test]
fn sample_template_land_nan_is_sea() {
    assert_eq!(sample_earth_template_land(f64::NAN, 0.5), 0.0);
    assert_eq!(sample_earth_template_land(0.5, f64::NAN), 0.0);
}

#[test]
fn hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims() {
    let dims = web()["dims"].as_array().expect("dims");
    assert!(dims.len() >= 24);
    let mut subsample_seen = std::collections::BTreeSet::new();
    let mut thresholds_seen = Vec::new();
    let mut land_cells = 0_usize;
    let mut sea_cells = 0_usize;
    let mut none_cells = 0_usize;
    for dim in dims {
        let (w, h) = (u(&dim["w"]), u(&dim["h"]));
        assert_eq!(
            earth_subsample_grid(w, h),
            u(&dim["subsample"]),
            "subsample {w}x{h}"
        );
        let expected_threshold = txt(&dim["threshold"]);
        assert_eq!(
            earth_land_fraction_threshold(w, h).to_bits(),
            expected_threshold.to_bits(),
            "prog {w}x{h}"
        );
        subsample_seen.insert(u(&dim["subsample"]));
        if !thresholds_seen.contains(&expected_threshold.to_bits()) {
            thresholds_seen.push(expected_threshold.to_bits());
        }

        let qs_n = dim["qsN"].as_array().expect("qsN");
        let rs_n = dim["rsN"].as_array().expect("rsN");
        for (ri, r) in rs_n.iter().enumerate() {
            for (qi, q) in qs_n.iter().enumerate() {
                let (q, r) = (q.as_i64().expect("q"), r.as_i64().expect("r"));
                let cell = &dim["norm"][ri][qi];
                match earth_hex_to_template_norm(q, r, w, h) {
                    None => {
                        assert!(cell.is_null(), "{w}x{h} ({q},{r}): web daje wartosc");
                        none_cells += 1;
                    }
                    Some((nq, nr)) => {
                        assert!(!cell.is_null(), "{w}x{h} ({q},{r}): web daje null");
                        assert_eq!(
                            nq.to_bits(),
                            txt(&cell[0]).to_bits(),
                            "{w}x{h} ({q},{r}) nq"
                        );
                        assert_eq!(
                            nr.to_bits(),
                            txt(&cell[1]).to_bits(),
                            "{w}x{h} ({q},{r}) nr"
                        );
                    }
                }
            }
        }

        let qs_l = dim["qsL"].as_array().expect("qsL");
        let rs_l = dim["rsL"].as_array().expect("rsL");
        let land = dim["land"].as_array().expect("land");
        assert_eq!(land.len(), rs_l.len());
        for (ri, r) in rs_l.iter().enumerate() {
            let line = land[ri].as_str().expect("wiersz").as_bytes();
            assert_eq!(line.len(), qs_l.len());
            for (qi, q) in qs_l.iter().enumerate() {
                let (q, r) = (q.as_i64().expect("q"), r.as_i64().expect("r"));
                let expected = f64::from(line[qi] - b'0');
                assert_eq!(
                    earth_template_land_at(q, r, w, h),
                    expected,
                    "{w}x{h} ({q},{r})"
                );
                if expected == 1.0 {
                    land_cells += 1;
                } else {
                    sea_cells += 1;
                }
            }
        }
    }
    // Wektory musza pokrywac wszystkie progi podprobkowania (1/3/5/7) i progow ulamka (4 wartosci).
    assert_eq!(
        subsample_seen.into_iter().collect::<Vec<_>>(),
        vec![1, 3, 5, 7]
    );
    assert_eq!(thresholds_seen.len(), 4);
    assert!(land_cells > 1000 && sea_cells > 1000 && none_cells > 1000);
}

#[test]
fn hex_to_norm_edges_match_web() {
    let rows = web()["hex_to_norm_edges"].as_array().expect("edges");
    assert_eq!(rows.len(), 20);
    for row in rows {
        let (w, h) = (u(&row[0]), u(&row[1]));
        let (q, r) = (row[2].as_i64().expect("q"), row[3].as_i64().expect("r"));
        match earth_hex_to_template_norm(q, r, w, h) {
            None => assert!(row[4].is_null(), "{w}x{h} ({q},{r})"),
            Some((nq, nr)) => {
                assert_eq!(nq.to_bits(), txt(&row[4][0]).to_bits());
                assert_eq!(nr.to_bits(), txt(&row[4][1]).to_bits());
            }
        }
        assert_eq!(
            earth_template_land_at(q, r, w, h),
            row[5].as_u64().expect("0/1") as f64,
            "{w}x{h} ({q},{r})"
        );
    }
}
