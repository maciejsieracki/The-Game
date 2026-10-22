//! P6.M01 — rdzen mapgen (PRNG, permutacja, cosLerp, valueNoise2D, fbm, geometria heksow):
//! porownanie BITOWE (f64::to_bits) z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m01_vectors/web-vectors.json`, generator `gen-m01-web.mjs`, pin `edb8fb56`).
//! Liczby zmiennoprzecinkowe sa w wektorach jako tekst (`String(x)` z JS), bo `serde_json` bez
//! `float_roundtrip` myli sie o 1 ulp.

use std::sync::OnceLock;

use civ_engine::domain::hex::HexCoord as DomainHex;
use civ_engine::domain::map_generator::{HexCoord, Mulberry32 as GeneratorMulberry32};
use civ_engine::domain::mapgen::prims::{
    build_perm_table, cos_lerp, fbm, hex_distance_axial, hex_key, js_cos, js_to_int32,
    mulberry32_step, mulberry32_unit, value_noise_2d, FBM_DEFAULT_OCTAVES, HEX_DIRECTIONS,
    PERM_TABLE_LEN,
};
use civ_engine::domain::rng::Mulberry32 as DomainMulberry32;
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m01_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn txt(value: &Value) -> f64 {
    value
        .as_str()
        .expect("tekst liczby")
        .parse()
        .expect("liczba f64 z tekstu JS")
}

fn same(actual: f64, expected: f64) -> bool {
    (actual.is_nan() && expected.is_nan()) || actual.to_bits() == expected.to_bits()
}

fn perm_for(seed: u32) -> [u8; PERM_TABLE_LEN] {
    let mut state = seed;
    build_perm_table(|| {
        let (next, output) = mulberry32_step(state);
        state = next;
        mulberry32_unit(output)
    })
}

#[test]
fn vectors_come_from_the_pinned_web_run() {
    let web = web();
    assert!(web["zrodlo"].as_str().expect("zrodlo").contains("edb8fb56"));
    for key in [
        "gen-helpers.ts:36-232",
        "gen-helpers.ts:237-251",
        "earth-land-mask.ts",
        "earth-land-mask.generated.ts",
    ] {
        let hash = web["sha256"][key].as_str().expect("sha256 wycinka");
        assert_eq!(hash.len(), 64, "{key}");
        assert!(hash.bytes().all(|b| b.is_ascii_hexdigit()), "{key}");
    }
}

#[test]
fn all_three_mulberry32_implementations_match_web_for_every_seed_and_step() {
    let rows = web()["mulberry"].as_array().expect("mulberry");
    assert_eq!(rows.len(), 40);
    for row in rows {
        let seed = u32::try_from(row["seed"].as_u64().expect("seed")).expect("u32");
        let values = row["valuesText"].as_array().expect("values");
        assert_eq!(values.len(), 64);
        let mut state = seed;
        let mut generator = GeneratorMulberry32::new(seed);
        let mut domain = DomainMulberry32::new(seed);
        for (step, text) in values.iter().enumerate() {
            let expected = txt(text);
            let (next, output) = mulberry32_step(state);
            state = next;
            assert!(
                same(mulberry32_unit(output), expected),
                "prims seed {seed} krok {step}"
            );
            assert!(
                same(generator.next_f64(), expected),
                "map_generator seed {seed} krok {step}"
            );
            assert!(
                same(domain.next_f64(), expected),
                "rng.rs seed {seed} krok {step}"
            );
        }
    }
}

#[test]
fn mulberry32_state_is_the_seed_until_first_draw() {
    // Web: `let s = seed >>> 0` — brak mieszania przed pierwszym losowaniem.
    for seed in [0_u32, 1, 42, u32::MAX] {
        assert_eq!(GeneratorMulberry32::new(seed).state(), seed);
    }
}

#[test]
fn perm_table_matches_web_for_all_256_entries() {
    let rows = web()["perm"].as_array().expect("perm");
    assert_eq!(rows.len(), 24);
    for row in rows {
        let seed = u32::try_from(row["seed"].as_u64().expect("seed")).expect("u32");
        let expected: Vec<u8> = row["table"]
            .as_array()
            .expect("table")
            .iter()
            .map(|v| u8::try_from(v.as_u64().expect("bajt")).expect("u8"))
            .collect();
        assert_eq!(expected.len(), PERM_TABLE_LEN);
        assert_eq!(perm_for(seed).to_vec(), expected, "perm seed {seed}");
        // Tablica jest permutacja 0..255.
        let mut sorted = expected.clone();
        sorted.sort_unstable();
        assert!(sorted.iter().enumerate().all(|(i, v)| usize::from(*v) == i));
    }
}

#[test]
fn cos_lerp_matches_web_bit_for_bit() {
    let rows = web()["cos_lerp"].as_array().expect("cos_lerp");
    assert!(rows.len() >= 4000);
    let mut mismatches = Vec::new();
    for row in rows {
        let (a, b, t) = (txt(&row[0]), txt(&row[1]), txt(&row[2]));
        let expected = txt(&row[3]);
        let actual = cos_lerp(a, b, t);
        if !same(actual, expected) {
            mismatches.push((a, b, t, actual, expected));
        }
    }
    assert!(
        mismatches.is_empty(),
        "cosLerp roznice vs web ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(5)]
    );
}

#[test]
fn js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range() {
    let rows = web()["math_cos"].as_array().expect("math_cos");
    assert!(rows.len() >= 11_000);
    let mut std_cos_differs = 0;
    for row in rows {
        let (x, expected) = (txt(&row[0]), txt(&row[1]));
        assert!(same(js_cos(x), expected), "js_cos({x:e}) != Math.cos");
        if !same(x.cos(), expected) {
            std_cos_differs += 1;
        }
    }
    // Dowod, ze port fdlibm jest potrzebny: `f64::cos` (libm systemu) rozni sie od V8.
    assert!(
        std_cos_differs > 0,
        "f64::cos zgodny z V8 na tym hoscie; port fdlibm do przegladu"
    );
}

#[test]
fn js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values() {
    let rows = web()["math_cos_large"].as_array().expect("math_cos_large");
    for row in rows {
        let (x, expected) = (txt(&row[0]), txt(&row[1]));
        let actual = js_cos(x);
        if expected.is_nan() {
            assert!(actual.is_nan(), "js_cos({x}) powinno byc NaN");
        } else {
            let distance = actual.to_bits().abs_diff(expected.to_bits());
            assert!(distance <= 1, "js_cos({x:e}): {distance} ulp");
        }
    }
}

#[test]
fn value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates() {
    let sets = web()["noise"].as_array().expect("noise");
    assert_eq!(sets.len(), 4);
    let mut total = 0;
    for set in sets {
        let seed = u32::try_from(set["seed"].as_u64().expect("seed")).expect("u32");
        let perm = perm_for(seed);
        for row in set["pts"].as_array().expect("pts") {
            let (x, y) = (txt(&row[0]), txt(&row[1]));
            let expected = txt(&row[2]);
            let actual = value_noise_2d(&perm, x, y);
            assert!(
                same(actual, expected),
                "noise seed {seed} ({x}, {y}): {actual:e} != {expected:e}"
            );
            total += 1;
        }
    }
    assert!(total >= 2000);
}

#[test]
fn fbm_matches_web_bit_for_bit_for_all_octave_counts() {
    let sets = web()["fbm"].as_array().expect("fbm");
    let mut defaults = 0;
    let mut zero_octaves = 0;
    for set in sets {
        let seed = u32::try_from(set["seed"].as_u64().expect("seed")).expect("u32");
        let perm = perm_for(seed);
        for row in set["rows"].as_array().expect("rows") {
            let (x, y) = (txt(&row[0]), txt(&row[1]));
            let expected = txt(&row[3]);
            let octaves = if row[2].is_null() {
                defaults += 1;
                FBM_DEFAULT_OCTAVES
            } else {
                u32::try_from(row[2].as_u64().expect("oktawy")).expect("u32")
            };
            if octaves == 0 {
                zero_octaves += 1;
                assert!(expected.is_nan(), "web: fbm z 0 oktaw to NaN");
            }
            let actual = fbm(&perm, x, y, octaves);
            assert!(
                same(actual, expected),
                "fbm seed {seed} ({x}, {y}) oktawy {octaves}"
            );
        }
    }
    assert!(defaults >= 400 && zero_octaves >= 400);
    assert_eq!(
        FBM_DEFAULT_OCTAVES, 4,
        "web: octaves = 4 (kontrakt nazwy, nie balans)"
    );
}

#[test]
fn js_to_int32_follows_ecmascript_to_int32() {
    // Fakty ze specyfikacji ECMAScript (ToInt32), pokryte tez wektorami noise z weba.
    assert_eq!(js_to_int32(4_294_967_303.5), 7);
    assert_eq!(js_to_int32(-2_147_483_649.0), 2_147_483_647);
    assert_eq!(js_to_int32(2_147_483_648.0), i32::MIN);
    assert_eq!(js_to_int32(-0.5), 0);
    assert_eq!(js_to_int32(f64::NAN), 0);
    assert_eq!(js_to_int32(f64::INFINITY), 0);
    // Wartosci z `node -e` (V8): 1e21|0, 1e15|0, -1e10|0.
    assert_eq!(js_to_int32(1e21), -559_939_584);
    assert_eq!(js_to_int32(1e15), -1_530_494_976);
    assert_eq!(js_to_int32(-1e10), -1_410_065_408);
}

#[test]
fn hex_directions_match_web_in_every_implementation() {
    let web_dirs: Vec<(i32, i32)> = web()["hex_directions"]
        .as_array()
        .expect("dirs")
        .iter()
        .map(|d| {
            (
                i32::try_from(d[0].as_i64().expect("q")).expect("i32"),
                i32::try_from(d[1].as_i64().expect("r")).expect("i32"),
            )
        })
        .collect();
    assert_eq!(web_dirs.len(), 6);
    assert_eq!(HEX_DIRECTIONS.to_vec(), web_dirs);
    let generator: Vec<(i32, i32)> = HexCoord::DIRECTIONS.iter().map(|d| (d.q, d.r)).collect();
    assert_eq!(generator, web_dirs);
    let domain: Vec<(i32, i32)> = DomainHex::new(0, 0)
        .neighbors()
        .iter()
        .map(|d| (d.q, d.r))
        .collect();
    assert_eq!(domain, web_dirs);
}

#[test]
fn hex_distance_matches_web_on_the_full_grid_in_every_implementation() {
    let grid = &web()["hex_distance_grid"];
    let (min, max) = (
        grid["min"].as_i64().expect("min"),
        grid["max"].as_i64().expect("max"),
    );
    let values = grid["values"].as_array().expect("values");
    let side = (max - min + 1) as usize;
    assert_eq!(values.len(), side.pow(4));
    let mut index = 0;
    for aq in min..=max {
        for ar in min..=max {
            for bq in min..=max {
                for br in min..=max {
                    let expected = values[index].as_u64().expect("dist");
                    index += 1;
                    assert_eq!(hex_distance_axial(aq, ar, bq, br), expected);
                    let (a, b) = ((aq as i32, ar as i32), (bq as i32, br as i32));
                    assert_eq!(
                        u64::from(HexCoord::new(a.0, a.1).distance(HexCoord::new(b.0, b.1))),
                        expected
                    );
                    assert_eq!(
                        u64::from(DomainHex::new(a.0, a.1).distance(DomainHex::new(b.0, b.1))),
                        expected
                    );
                }
            }
        }
    }
}

#[test]
fn hex_distance_matches_web_for_large_coordinates() {
    let rows = web()["hex_distance_extra"].as_array().expect("extra");
    assert_eq!(rows.len(), 2000);
    for row in rows {
        let n: Vec<i64> = row
            .as_array()
            .expect("row")
            .iter()
            .map(|v| v.as_i64().expect("int"))
            .collect();
        let expected = u64::try_from(n[4]).expect("dist >= 0");
        assert_eq!(hex_distance_axial(n[0], n[1], n[2], n[3]), expected);
        let (a, b) = (
            HexCoord::new(n[0] as i32, n[1] as i32),
            HexCoord::new(n[2] as i32, n[3] as i32),
        );
        assert_eq!(u64::from(a.distance(b)), expected);
    }
}

#[test]
fn hex_key_matches_web_format() {
    for row in web()["hex_key"].as_array().expect("hex_key") {
        let (q, r) = (row[0].as_i64().expect("q"), row[1].as_i64().expect("r"));
        let expected = row[2].as_str().expect("key");
        assert_eq!(hex_key(q, r), expected);
        let domain = DomainHex::new(q as i32, r as i32);
        assert_eq!(domain.key(), expected);
        assert_eq!(domain.to_string(), expected);
    }
}
