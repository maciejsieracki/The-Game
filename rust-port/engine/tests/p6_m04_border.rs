//! P6.M04 - granice mapy (`gen-helpers.ts`:233-236, 1176-1406): bufor oceanu szerokosciowego,
//! limity ladu per pierscien, fade'y, narzedzia siatki brzegu, `applyMarginalLandZoneCaps`.
//! Wektory z URUCHOMIONEGO weba; f64 bitowo.
//!
//! `applyMarginalLandZoneCaps` wola `sortLandKeysForErosion` (poza zakresem M04, `gen-helpers.ts:3207`).
//! W testach ta zaleznosc to `ErosionHook` - przepisana z TS i sprawdzona BEZPOSREDNIO na wektorach
//! kategorii `erosionSort` (`erosion_hook_matches_web`), wiec blad hooka nie zaslania bledu M04.

#[path = "p6_m04_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::cluster_mass::js_array_sort_by;
use civ_engine::domain::mapgen::prims::{hex_key, is_water_terrain_local, HEX_DIRECTIONS};
use civ_engine::domain::mapgen::terrain_class::{
    apply_marginal_land_zone_caps, count_land_neighbors_in_set, count_map_border_hexes,
    enforce_map_border_ocean, find_land_in_map_border, hex_border_distance,
    is_in_latitudinal_ocean_buffer, is_in_map_border, is_in_map_margin_zone,
    is_relief_candidate_hex, keys_at_border_distance, land_mask_border_fade,
    map_border_ocean_hexes, map_center_distance_norm, map_center_radial_bias, map_edge_rect_fade,
    map_margin_land_zone_hexes, margin_land_cap_for_border_distance, margin_scatter_score,
    parse_hex_key, set_hex_to_laka, set_hex_to_morze, HexRecord, MarginZoneHooks,
};
use common::{assert_f64, assert_hexes, cases, fv, fv_opt, i, s, scores_map, spec_to_record, web};

#[test]
fn lat_buffer_matches_web() {
    let rows = cases("latBuffer");
    assert!(rows.len() > 10_000);
    let (mut yes, mut no, mut earth) = (0, 0, 0);
    for row in rows {
        let (r, h, e, want) = (
            i(&row[0]),
            u32::try_from(i(&row[1])).unwrap(),
            i(&row[2]) == 1,
            i(&row[3]) == 1,
        );
        assert_eq!(
            is_in_latitudinal_ocean_buffer(r, h, e),
            want,
            "isInLatitudinalOceanBuffer{row}"
        );
        earth += usize::from(e);
        if want {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(
        yes > 3000 && no > 3000 && earth > 3000,
        "{yes} {no} {earth}"
    );
}

#[test]
fn border_consts_match_web() {
    let c = &web()["cases"]["consts"];
    assert_f64(
        map_border_ocean_hexes(),
        fv(&c["MAP_BORDER_OCEAN_HEXES"]),
        "MAP_BORDER_OCEAN_HEXES",
    );
    assert_f64(
        map_margin_land_zone_hexes(),
        fv(&c["MAP_MARGIN_LAND_ZONE_HEXES"]),
        "MAP_MARGIN_LAND_ZONE_HEXES",
    );
}

#[test]
fn margin_cap_matches_web() {
    let rows = cases("marginCap");
    let (mut some, mut none) = (0, 0);
    for row in rows {
        let got = margin_land_cap_for_border_distance(fv(&row[0]));
        match (&got, &row[1]) {
            (None, v) if v.is_null() => none += 1,
            (Some(g), v) if !v.is_null() => {
                assert_f64(*g, fv(v), &format!("marginLandCap{row}"));
                some += 1;
            }
            _ => panic!("marginLandCapForBorderDistance{row}: rust={got:?}"),
        }
    }
    assert!(some > 20 && none > 20, "{some} {none}");
}

#[test]
fn fades_and_distances_match_web() {
    let rows = cases("fades");
    assert!(rows.len() > 4500);
    let (mut zero_fade, mut full_fade, mut partial_fade, mut in_border, mut in_margin) =
        (0, 0, 0, 0, 0);
    for row in rows {
        let (q, r, w, h) = (fv(&row[0]), fv(&row[1]), fv(&row[2]), fv(&row[3]));
        let fade = land_mask_border_fade(q, r, w, h);
        assert_f64(fade, fv(&row[4]), &format!("landMaskBorderFade{row}"));
        assert_f64(
            map_center_radial_bias(q, r, w, h),
            fv(&row[5]),
            &format!("mapCenterRadialBias{row}"),
        );
        assert_f64(
            map_edge_rect_fade(q, r, w, h),
            fv(&row[6]),
            &format!("mapEdgeRectFade{row}"),
        );
        assert_f64(
            map_center_distance_norm(q, r, w, h),
            fv(&row[7]),
            &format!("mapCenterDistanceNorm{row}"),
        );
        assert_f64(
            hex_border_distance(q, r, w, h),
            fv(&row[8]),
            &format!("hexBorderDistance{row}"),
        );
        assert_eq!(
            is_in_map_border(q, r, w, h, None),
            i(&row[9]) == 1,
            "isInMapBorder{row}"
        );
        assert_eq!(
            is_in_map_margin_zone(q, r, w, h),
            i(&row[10]) == 1,
            "isInMapMarginZone{row}"
        );
        if fade == 0.0 {
            zero_fade += 1;
        } else if fade == 1.0 {
            full_fade += 1;
        } else if fade > 0.0 {
            partial_fade += 1;
        }
        in_border += i(&row[9]);
        in_margin += i(&row[10]);
    }
    assert!(
        zero_fade > 200 && full_fade > 200 && partial_fade > 200,
        "{zero_fade} {full_fade} {partial_fade}"
    );
    assert!(
        in_border > 200 && in_margin > 500,
        "{in_border} {in_margin}"
    );
}

#[test]
fn is_in_map_border_with_buffer_matches_web() {
    let rows = cases("inBorderBuf");
    assert!(rows.len() >= 1500);
    for row in rows {
        let got = is_in_map_border(
            fv(&row[0]),
            fv(&row[1]),
            fv(&row[2]),
            fv(&row[3]),
            fv_opt(&row[4]),
        );
        assert_eq!(got, i(&row[5]) == 1, "isInMapBorder{row}");
    }
}

#[test]
fn margin_scatter_score_matches_web() {
    let rows = cases("scatter");
    assert!(rows.len() >= 2500);
    for row in rows {
        let (q, r) = (i(&row[0]), i(&row[1]));
        let mut scores = HashMap::new();
        if !row[2].is_null() {
            scores.insert(hex_key(q, r), fv(&row[2]));
        }
        assert_f64(
            margin_scatter_score(q, r, &scores),
            fv(&row[3]),
            &format!("marginScatterScore{row}"),
        );
    }
}

#[test]
fn parse_hex_key_matches_js_number_for_hexkey_strings() {
    for (key, q, r) in [
        ("3,4", 3.0, 4.0),
        ("-2,7", -2.0, 7.0),
        ("0,0", 0.0, 0.0),
        ("12,-9", 12.0, -9.0),
    ] {
        let (pq, pr) = parse_hex_key(key);
        assert_f64(pq, q, key);
        assert_f64(pr, r, key);
    }
    // brakujaca druga czesc = NaN, pusta = 0 (JS Number(undefined) i Number(''))
    assert!(parse_hex_key("5").1.is_nan());
    assert_eq!(parse_hex_key(",3"), (0.0, 3.0));
}

/// RUNDA 2 (zarzut 4): klucze BRZEGOWE sprawdzane WEKTORAMI z uruchomionego weba
/// (`Number(parts[0])`, `Number(parts[1])` dla `key.split(',')`), nie recznymi pinami.
#[test]
fn parse_hex_key_edge_keys_match_web() {
    let rows = cases("parseHexKey");
    assert!(rows.len() >= 700, "za malo kluczy: {}", rows.len());
    let (mut nan_q, mut nan_r, mut inf, mut neg_zero, mut empty_part) = (0, 0, 0, 0, 0);
    let (mut prefixed, mut ws_trim, mut missing_second, mut exp_form) = (0, 0, 0, 0);
    for row in rows {
        let key = s(&row[0]);
        let (q, r) = parse_hex_key(key);
        assert_f64(q, fv(&row[1]), &format!("parseHexKey q {key:?}"));
        assert_f64(r, fv(&row[2]), &format!("parseHexKey r {key:?}"));
        nan_q += usize::from(q.is_nan());
        nan_r += usize::from(r.is_nan());
        inf += usize::from(q.is_infinite() || r.is_infinite());
        neg_zero +=
            usize::from((q == 0.0 && q.is_sign_negative()) || (r == 0.0 && r.is_sign_negative()));
        empty_part += usize::from(key.starts_with(',') || key.is_empty());
        prefixed += usize::from(
            key.contains("0x") || key.contains("0X") || key.contains("0b") || key.contains("0o"),
        );
        ws_trim += usize::from(key.starts_with(char::is_whitespace) || key.contains(" ,"));
        missing_second += usize::from(!key.contains(','));
        exp_form += usize::from(key.contains('e') || key.contains('E'));
    }
    // pokrycie wymuszone: kazda klasa kluczy brzegowych wystepuje (nie tylko "q,r" z cyframi)
    assert!(nan_q >= 100 && nan_r >= 100, "NaN: {nan_q}/{nan_r}");
    assert!(inf >= 8, "Infinity: {inf}");
    assert!(neg_zero >= 4, "-0: {neg_zero}");
    assert!(empty_part >= 10, "pusta czesc: {empty_part}");
    assert!(prefixed >= 10, "prefiksy 0x/0o/0b: {prefixed}");
    assert!(ws_trim >= 8, "biale znaki: {ws_trim}");
    assert!(
        missing_second >= 10,
        "brak drugiej czesci: {missing_second}"
    );
    assert!(exp_form >= 10, "notacja wykladnicza: {exp_form}");
}

#[test]
fn set_hex_to_morze_and_laka_match_web() {
    let rows = cases("setHex");
    assert!(rows.len() >= 48);
    for (n, c) in rows.iter().enumerate() {
        let mut m = spec_to_record(&c["spec"]);
        let mut l = spec_to_record(&c["spec"]);
        for (_, h) in m.iter_mut() {
            set_hex_to_morze(h);
        }
        for (_, h) in l.iter_mut() {
            set_hex_to_laka(h);
        }
        assert_hexes(&m, &c["morze"], &format!("setHexToMorze #{n}"));
        assert_hexes(&l, &c["laka"], &format!("setHexToLaka #{n}"));
    }
}

#[test]
fn border_grid_tools_match_web() {
    let rows = cases("borderGrid");
    assert!(rows.len() >= 56);
    let (mut found_nonempty, mut converted_total, mut relief_true, mut relief_false) = (0, 0, 0, 0);
    for (n, c) in rows.iter().enumerate() {
        let (w, h) = (i(&c["w"]), i(&c["h"]));
        let spec = &c["spec"];
        let hexes = spec_to_record(spec);
        for (b, expect) in c["buffers"]
            .as_array()
            .unwrap()
            .iter()
            .zip(c["counts"].as_array().unwrap())
        {
            assert_eq!(
                count_map_border_hexes(w, h, fv_opt(b)),
                i(expect),
                "countMapBorderHexes #{n} buf={b}"
            );
        }
        let found = find_land_in_map_border(&hexes, w, h);
        let want: Vec<String> = c["found"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| s(k).to_string())
            .collect();
        assert_eq!(found, want, "findLandInMapBorder #{n}");
        found_nonempty += usize::from(!found.is_empty());

        let mut enforced = spec_to_record(spec);
        let converted = enforce_map_border_ocean(&mut enforced, w, h, fv_opt(&c["enforceBuffer"]));
        assert_eq!(converted, i(&c["converted"]), "enforceMapBorderOcean #{n}");
        assert_hexes(
            &enforced,
            &c["enforceOut"],
            &format!("enforceMapBorderOcean #{n}"),
        );
        converted_total += converted;

        for (d, expect) in c["keysAt"].as_array().unwrap().iter().enumerate() {
            let dd = if d == 13 { 0.5 } else { d as f64 };
            let got = keys_at_border_distance(&hexes, w, h, dd);
            let want: Vec<String> = expect
                .as_array()
                .unwrap()
                .iter()
                .map(|k| s(k).to_string())
                .collect();
            assert_eq!(got, want, "keysAtBorderDistance #{n} d={dd}");
        }
        for ((key, hex), pair) in hexes.iter().zip(c["perHex"].as_array().unwrap()) {
            assert_eq!(
                count_land_neighbors_in_set(&hexes, hex.q, hex.r),
                i(&pair[0]),
                "countLandNeighborsInSet {key}"
            );
            let rel = is_relief_candidate_hex(hex, hex.q as f64, hex.r as f64, w as f64, h as f64);
            assert_eq!(rel, i(&pair[1]) == 1, "isReliefCandidateHex {key}");
            if rel {
                relief_true += 1;
            } else {
                relief_false += 1;
            }
        }
    }
    assert!(
        found_nonempty >= 30 && converted_total > 300,
        "{found_nonempty} {converted_total}"
    );
    assert!(
        relief_true > 1000 && relief_false > 1000,
        "{relief_true} {relief_false}"
    );
}

// ---------------------------------------------------------------------------------------------
// Hook testowy: `sortLandKeysForErosion` (gen-helpers.ts:3207-3231) - przepisany z TS
// ---------------------------------------------------------------------------------------------

struct ErosionHook;

fn count_morse_neighbors(hexes: &HexRecord, q: i64, r: i64) -> i64 {
    let mut n = 0;
    for (dq, dr) in HEX_DIRECTIONS {
        if let Some(nh) = hexes.get(&hex_key(q + i64::from(dq), r + i64::from(dr))) {
            if is_water_terrain_local(nh.terrain) {
                n += 1;
            }
        }
    }
    n
}

fn erode_terrain_rank(tb: Terrain) -> i64 {
    // ERODE_TERRAIN_ORDER (gen-helpers.ts:3279)
    let order = [
        Terrain::ShallowSea,
        Terrain::Grassland,
        Terrain::Desert,
        Terrain::Plains,
        Terrain::Hills,
        Terrain::Mountains,
    ];
    order
        .iter()
        .position(|t| *t == tb)
        .map_or(order.len() as i64, |p| p as i64)
}

impl MarginZoneHooks for ErosionHook {
    fn sort_land_keys_for_erosion(
        &self,
        keys: &[String],
        hexes: &HexRecord,
        land_scores: &HashMap<String, f64>,
        width: i64,
        height: i64,
    ) -> Vec<String> {
        let mut out: Vec<String> = keys.to_vec();
        js_array_sort_by(&mut out, |a, b| {
            let (aq, ar) = parse_hex_key(a);
            let (bq, br) = parse_hex_key(b);
            let ba = hex_border_distance(aq, ar, width as f64, height as f64);
            let bb = hex_border_distance(bq, br, width as f64, height as f64);
            if ba != bb {
                return ba - bb;
            }
            let ca = map_center_distance_norm(aq, ar, width as f64, height as f64);
            let cb = map_center_distance_norm(bq, br, width as f64, height as f64);
            if (ca - cb).abs() > 0.015 {
                return cb - ca;
            }
            let na = count_morse_neighbors(hexes, aq as i64, ar as i64);
            let nb = count_morse_neighbors(hexes, bq as i64, br as i64);
            if na != nb {
                return (nb - na) as f64;
            }
            let ra = erode_terrain_rank(hexes.get(a).unwrap().terrain);
            let rb = erode_terrain_rank(hexes.get(b).unwrap().terrain);
            if ra != rb {
                return (ra - rb) as f64;
            }
            land_scores.get(a).copied().unwrap_or(0.0) - land_scores.get(b).copied().unwrap_or(0.0)
        });
        out
    }
}

#[test]
fn erosion_hook_matches_web() {
    let rows = cases("erosionSort");
    assert!(rows.len() >= 42);
    let mut nontrivial = 0;
    for (n, c) in rows.iter().enumerate() {
        let hexes = spec_to_record(&c["spec"]);
        let scores = scores_map(&c["scores"]);
        let keys: Vec<String> = c["keys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| s(k).to_string())
            .collect();
        let got =
            ErosionHook.sort_land_keys_for_erosion(&keys, &hexes, &scores, i(&c["w"]), i(&c["h"]));
        let want: Vec<String> = c["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| s(k).to_string())
            .collect();
        assert_eq!(got, want, "sortLandKeysForErosion #{n}");
        nontrivial += usize::from(keys.len() > 20);
    }
    assert!(nontrivial >= 20, "za malo duzych zbiorow: {nontrivial}");
}

#[test]
fn apply_marginal_land_zone_caps_matches_web() {
    let rows = cases("marginZone");
    assert!(rows.len() >= 42);
    let (mut adj_cases, mut to_sea_cases, mut to_land_cases, mut total_adjusted) = (0, 0, 0, 0);
    for (n, c) in rows.iter().enumerate() {
        let mut hexes = spec_to_record(&c["spec"]);
        let before = hexes.clone();
        let scores = scores_map(&c["scores"]);
        let adjusted = apply_marginal_land_zone_caps(
            &mut hexes,
            &scores,
            i(&c["w"]),
            i(&c["h"]),
            &ErosionHook,
        );
        assert_eq!(adjusted, i(&c["adjusted"]), "adjusted #{n}");
        assert_hexes(
            &hexes,
            &c["out"],
            &format!("applyMarginalLandZoneCaps #{n}"),
        );
        let (mut to_sea, mut to_land) = (false, false);
        for ((_, a), (_, b)) in before.iter().zip(hexes.iter()) {
            let (wa, wb) = (
                is_water_terrain_local(a.terrain),
                is_water_terrain_local(b.terrain),
            );
            to_sea |= !wa && wb;
            to_land |= wa && !wb;
        }
        adj_cases += usize::from(adjusted > 0);
        to_sea_cases += usize::from(to_sea);
        to_land_cases += usize::from(to_land);
        total_adjusted += adjusted;
    }
    assert!(adj_cases >= 30, "adjusted>0: {adj_cases}");
    assert!(
        to_sea_cases >= 15 && to_land_cases >= 15,
        "galezie: sea={to_sea_cases} land={to_land_cases}"
    );
    assert!(total_adjusted > 1000, "{total_adjusted}");
}
