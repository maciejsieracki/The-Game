//! P6.M03 - maski ladu czterech typow swiata (kontynenty, pangea, wyspy, ziemia) oraz zaleznosci
//! brzegowe (`hexBorderDistance`, `marginLandCapForBorderDistance`, `landMaskBorderFade`,
//! `mapEdgeRectFade`): porownanie BITOWE z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m03_vectors/masks.json` i `core.json`, pin `edb8fb56`).

use std::sync::OnceLock;

use civ_engine::domain::mapgen::masks::{
    build_five_zone_continent_centers, build_pangea_blob_centers,
    build_sixteen_grid_island_centers, default_shape_params, hex_border_distance,
    land_mask_border_fade, land_mask_kontynenty, land_mask_pangea, land_mask_wyspy,
    land_mask_ziemia, map_border_width, map_edge_rect_fade, margin_land_cap_for_border_distance,
    pangea_blob_score, ContinentCenter, PermTable,
};
use civ_engine::domain::mapgen::prims::build_perm_table;
use serde_json::Value;

#[path = "p6_m03_vectors/common.rs"]
mod common;
use common::{centers, dim, fnv_bits, int, num, rng, same};

const MASKS: &str = include_str!("p6_m03_vectors/masks.json");
const CORE: &str = include_str!("p6_m03_vectors/core.json");

fn masks() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(MASKS).expect("masks parse"))
}

fn core() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(CORE).expect("core parse"))
}

fn seed_of(value: &Value) -> u32 {
    u32::try_from(int(value)).expect("ziarno u32")
}

#[allow(clippy::too_many_arguments)]
fn evaluate(
    typ: &str,
    q: i64,
    r: i64,
    w: u32,
    h: u32,
    cs: &[ContinentCenter],
    perm: &PermTable,
    noise: f64,
    lf: f64,
) -> f64 {
    match typ {
        "kontynenty" => land_mask_kontynenty(q, r, w, h, cs, perm, noise),
        "pangea" => land_mask_pangea(q, r, w, h, cs, perm, noise, lf),
        "wyspy" => land_mask_wyspy(q, r, w, h, cs, perm, noise),
        "ziemia" => land_mask_ziemia(q, r, w, h, perm, noise),
        other => panic!("typ {other}"),
    }
}

/// Zakres `(q0, q1, r0, r1)` wlacznie, jak w generatorze wektorow.
fn range_of(case: &Value) -> (i64, i64, i64, i64) {
    let r = case["range"].as_array().expect("range");
    (int(&r[0]), int(&r[1]), int(&r[2]), int(&r[3]))
}

/// Maski liczone z centrow i permutacji WEKTORA-weba... lancuch ziarna odtwarzany w Rust: perm,
/// parametry ksztaltu i centra pochodza z `mulberry32(seed)` jak w webie (`chain` w generatorze).
fn rust_chain(case: &Value) -> (PermTable, f64, Vec<ContinentCenter>) {
    let typ = case["type"].as_str().expect("typ");
    let (w, h) = (dim(&case["w"]), dim(&case["h"]));
    let lf = num(&case["lf"]);
    let mut rand = rng(seed_of(&case["seed"]));
    let perm = build_perm_table(&mut rand);
    let shape = default_shape_params(&mut rand);
    let cs = match typ {
        "kontynenty" => build_five_zone_continent_centers(&mut rand, w, h, 0.17, 0.26),
        "pangea" => build_pangea_blob_centers(&mut rand, w, h, lf),
        "wyspy" => build_sixteen_grid_island_centers(&mut rand, w, h),
        _ => Vec::new(),
    };
    assert!(
        same(rand(), num(&case["rest_after_chain"])),
        "zuzycie rand() w lancuchu: {}",
        case["type"]
    );
    (perm, shape.noise_scale, cs)
}

#[test]
fn land_masks_match_web_for_every_type_size_and_seed() {
    let cases = masks()["cases"].as_array().expect("cases");
    assert!(cases.len() >= 90, "przypadkow: {}", cases.len());
    let mut hexes = 0_usize;
    let mut types = std::collections::BTreeSet::new();
    for case in cases {
        let typ = case["type"].as_str().expect("typ");
        types.insert(typ.to_string());
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        let lf = num(&case["lf"]);
        let (perm, noise, _chain_centers) = rust_chain(case);
        assert!(same(noise, num(&case["noise_scale"])));
        // Centra z WEKTORA (niezaleznie od portu budowania centrow) + permutacja z ziarna.
        let cs = centers(&case["centers"]);
        let (q0, q1, r0, r1) = range_of(case);
        let mut values = Vec::new();
        for r in r0..=r1 {
            for q in q0..=q1 {
                values.push(evaluate(typ, q, r, w, h, &cs, &perm, noise, lf));
            }
        }
        assert_eq!(values.len() as i64, int(&case["count"]));
        assert_eq!(
            fnv_bits(&values),
            case["fnv"].as_str().expect("fnv"),
            "{typ} {w}x{h} ziarno {} lf {lf}",
            case["seed"]
        );
        if let Some(expected) = case.get("values") {
            for (i, (a, e)) in values
                .iter()
                .zip(expected.as_array().expect("values"))
                .enumerate()
            {
                assert!(
                    same(*a, num(e)),
                    "{typ} {w}x{h} ziarno {} wartosc {i}: rust {a:?} web {e}",
                    case["seed"]
                );
            }
        } else {
            for pair in case["sample"].as_array().expect("sample") {
                let i = usize::try_from(int(&pair[0])).expect("indeks");
                assert!(same(values[i], num(&pair[1])), "{typ} {w}x{h} probka {i}");
            }
        }
        hexes += values.len();
    }
    assert_eq!(
        types.iter().map(String::as_str).collect::<Vec<_>>(),
        ["kontynenty", "pangea", "wyspy", "ziemia"]
    );
    assert!(hexes > 1_000_000, "heksow: {hexes}");
}

#[test]
fn full_seed_pipeline_reproduces_the_web_land_masks() {
    // Cala sciezka w Rust: ziarno -> perm -> ksztalt -> centra -> maska (bez wektorow posrednich).
    for case in masks()["cases"].as_array().expect("cases") {
        let typ = case["type"].as_str().expect("typ");
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        let lf = num(&case["lf"]);
        let (perm, noise, cs) = rust_chain(case);
        assert_eq!(
            cs.len(),
            case["centers"].as_array().expect("centers").len(),
            "{typ}"
        );
        let (q0, q1, r0, r1) = range_of(case);
        let mut values = Vec::new();
        for r in r0..=r1 {
            for q in q0..=q1 {
                values.push(evaluate(typ, q, r, w, h, &cs, &perm, noise, lf));
            }
        }
        assert_eq!(
            fnv_bits(&values),
            case["fnv"].as_str().expect("fnv"),
            "{typ} {w}x{h} ziarno {}",
            case["seed"]
        );
    }
}

#[test]
fn masks_are_bounded_and_zero_in_the_hard_ocean_border() {
    // Test ksztaltu bez pinow wartosci: wartosc w [0, 1], 0 w pasie d < 2 od krawedzi.
    for case in masks()["cases"].as_array().expect("cases") {
        let Some(values) = case.get("values") else {
            continue;
        };
        let typ = case["type"].as_str().expect("typ");
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        let (q0, q1, r0, _) = range_of(case);
        for (idx, v) in values.as_array().expect("values").iter().enumerate() {
            let value = num(v);
            assert!((0.0..=1.0).contains(&value), "{typ}: {value}");
            let q = q0 + (idx as i64) % (q1 - q0 + 1);
            let r = r0 + (idx as i64) / (q1 - q0 + 1);
            if hex_border_distance(q, r, w, h) < map_border_width(w, h) && typ != "ziemia" {
                assert_eq!(value, 0.0, "{typ} {w}x{h} ({q},{r}) w twardym oceanie");
            }
        }
    }
}

#[test]
fn pangea_blob_score_matches_web_on_fixed_centers() {
    let meta = &masks()["blob_score_meta"];
    let perm = build_perm_table(rng(seed_of(&meta["seed_perm"])));
    let cs = build_pangea_blob_centers(
        rng(seed_of(&meta["seed_centers"])),
        dim(&meta["w"]),
        dim(&meta["h"]),
        num(&meta["lf"]),
    );
    common::assert_centers(&cs, &centers(&meta["centers"]), "centra blob_score");
    for row in masks()["blob_score"].as_array().expect("blob_score") {
        let zone = usize::try_from(int(&row[2])).expect("strefa");
        let actual = pangea_blob_score(
            int(&row[0]),
            int(&row[1]),
            dim(&meta["w"]),
            dim(&meta["h"]),
            &cs[zone],
            zone,
            &perm,
            num(&meta["noise_scale"]),
        );
        assert!(same(actual, num(&row[3])), "{row}");
    }
}

#[test]
fn border_dependencies_match_web() {
    let border = &core()["border"];
    for row in border["margin_cap"].as_array().expect("cap") {
        let actual = margin_land_cap_for_border_distance(num(&row[0]));
        match (&row[1], actual) {
            (Value::Null, None) => {}
            (expected, Some(value)) => assert!(same(value, num(expected)), "d {}", row[0]),
            (expected, None) => panic!("d {}: web {expected}, rust None", row[0]),
        }
    }
    for case in border["fields"].as_array().expect("fields") {
        let (w, h) = (dim(&case["w"]), dim(&case["h"]));
        assert!(same(map_border_width(w, h), num(&case["border_width"])));
        let rows = case["rows"].as_array().expect("rows");
        let mut i = 0;
        for r in -1..=i64::from(h) {
            for q in -1..=i64::from(w) {
                let row = &rows[i];
                assert!(
                    same(hex_border_distance(q, r, w, h), num(&row[0])),
                    "{w}x{h} ({q},{r})"
                );
                assert!(
                    same(land_mask_border_fade(q, r, w, h), num(&row[1])),
                    "{w}x{h} ({q},{r})"
                );
                assert!(
                    same(map_edge_rect_fade(q, r, w, h), num(&row[2])),
                    "{w}x{h} ({q},{r})"
                );
                i += 1;
            }
        }
        assert_eq!(i, rows.len());
    }
}
