//! Bit-for-bit parity of `civ_renderer::jsmath` with V8 12.4 (node v22.22.0)
//! `Math.*` (R-RUSTPORT-P4-16-JSMATH-Q1).
//!
//! The vectors in `tests/fixtures/jsmath/*.bin` were produced by RUNNING
//! node v22.22.0 (`gen.mjs`, see `README.md` there): little-endian f64 rows
//! `arguments..., result`. A result matches when `to_bits` is equal, or when
//! both values are NaN (a NaN payload is not observable through a JS
//! `Number`). The platform `libm` is measured alongside, for information only.

use civ_renderer::jsmath::{
    js_acos, js_asin, js_atan, js_atan2, js_cos, js_exp, js_hypot, js_hypot_n, js_log, js_pow,
    js_sin, js_tan, PLATFORM_FALLBACK,
};

const MIN_CASES: usize = 20_000;

fn rows(name: &str, arity: usize) -> Vec<Vec<f64>> {
    let path = format!(
        "{}/tests/fixtures/jsmath/{name}.bin",
        env!("CARGO_MANIFEST_DIR")
    );
    let bytes = std::fs::read(&path).unwrap_or_else(|e| panic!("{path}: {e}"));
    let width = 8 * (arity + 1);
    assert_eq!(bytes.len() % width, 0, "{path}: truncated row");
    bytes
        .chunks_exact(width)
        .map(|row| {
            row.chunks_exact(8)
                .map(|b| f64::from_le_bytes(b.try_into().expect("8 bytes")))
                .collect()
        })
        .collect()
}

fn same(got: f64, want: f64) -> bool {
    if want.is_nan() {
        got.is_nan()
    } else {
        got.to_bits() == want.to_bits()
    }
}

/// Compares `port` (and, for information, `libm`) with the V8 vectors of
/// `name`; returns `(cases, port mismatches)`.
fn check(
    name: &str,
    arity: usize,
    port: &dyn Fn(&[f64]) -> f64,
    libm: &dyn Fn(&[f64]) -> f64,
) -> (usize, usize) {
    let data = rows(name, arity);
    let mut bad = 0usize;
    let mut libm_bad = 0usize;
    let mut first = Vec::new();
    for r in &data {
        let (args, want) = (&r[..arity], r[arity]);
        let got = port(args);
        if !same(got, want) {
            bad += 1;
            if first.len() < 5 {
                first.push(format!(
                    "{name}({args:?}) = {got:e} [{:#018x}], V8 {want:e} [{:#018x}]",
                    got.to_bits(),
                    want.to_bits()
                ));
            }
        }
        if !same(libm(args), want) {
            libm_bad += 1;
        }
    }
    println!(
        "{name}: cases={} port_mismatches={bad} libm_mismatches={libm_bad}",
        data.len()
    );
    for f in &first {
        println!("  {f}");
    }
    (data.len(), bad)
}

macro_rules! unary {
    ($test:ident, $name:literal, $port:path, $libm:expr) => {
        #[test]
        fn $test() {
            let (n, bad) = check($name, 1, &|a| $port(a[0]), &|a| $libm(a[0]));
            assert!(n >= MIN_CASES, "{}: only {n} cases", $name);
            assert_eq!(bad, 0, "{}: {bad}/{n} results differ from V8", $name);
        }
    };
}

macro_rules! binary {
    ($test:ident, $name:literal, $port:path, $libm:expr) => {
        #[test]
        fn $test() {
            let (n, bad) = check($name, 2, &|a| $port(a[0], a[1]), &|a| $libm(a[0], a[1]));
            assert!(n >= MIN_CASES, "{}: only {n} cases", $name);
            assert_eq!(bad, 0, "{}: {bad}/{n} results differ from V8", $name);
        }
    };
}

unary!(sin_matches_v8, "sin", js_sin, f64::sin);
unary!(cos_matches_v8, "cos", js_cos, f64::cos);
unary!(tan_matches_v8, "tan", js_tan, f64::tan);
unary!(atan_matches_v8, "atan", js_atan, f64::atan);
unary!(acos_matches_v8, "acos", js_acos, f64::acos);
// R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1: `js_asin` moved into `jsmath`.
unary!(asin_matches_v8, "asin", js_asin, f64::asin);
unary!(exp_matches_v8, "exp", js_exp, f64::exp);
unary!(log_matches_v8, "log", js_log, f64::ln);
binary!(atan2_matches_v8, "atan2", js_atan2, f64::atan2);
binary!(pow_matches_v8, "pow", js_pow, f64::powf);
binary!(hypot_matches_v8, "hypot", js_hypot, f64::hypot);

#[test]
fn hypot_three_arguments_matches_v8() {
    let (n, bad) = check("hypot3", 3, &js_hypot_n, &|a| a[0].hypot(a[1]).hypot(a[2]));
    assert!(n >= 3_000);
    assert_eq!(bad, 0, "hypot3: {bad}/{n} results differ from V8");
}

#[test]
fn whole_domain_without_platform_fallback() {
    const { assert!(!PLATFORM_FALLBACK) };
    // Values computed by node v22.22.0 (`node -p "Math.sin(1e300)"` etc.),
    // also contained in the vectors; here as readable anchors.
    assert_eq!(js_sin(1e22), -0.852_200_849_767_188_8);
    assert_eq!(js_cos(1e22), 0.523_214_785_395_139);
    assert!(js_sin(f64::INFINITY).is_nan());
    assert_eq!(js_exp(1.0), std::f64::consts::E);
    assert_eq!(js_log(0.0), f64::NEG_INFINITY);
    assert!(js_log(-1.0).is_nan());
    assert_eq!(js_atan2(0.0, -0.0), std::f64::consts::PI);
    assert_eq!(js_atan2(-0.0, 1.0).to_bits(), (-0.0f64).to_bits());
    assert_eq!(js_acos(-1.0), std::f64::consts::PI);
    assert_eq!(js_asin(1.0), std::f64::consts::FRAC_PI_2);
    assert_eq!(js_asin(-0.0).to_bits(), (-0.0f64).to_bits());
    assert!(js_asin(1.5).is_nan());
    assert_eq!(js_hypot(3.0, 4.0), 5.0);
    assert_eq!(js_hypot(f64::NAN, f64::NEG_INFINITY), f64::INFINITY);
    assert_eq!(js_hypot_n(&[]), 0.0);
}

#[test]
fn compatibility_paths_are_the_same_functions() {
    use civ_renderer::models::units_kamien::kit as kamien_kit;
    use civ_renderer::models::wonders;
    use civ_renderer::terrain::{coast, jsmath as terrain_jsmath};
    for x in [0.3, 1.0, 2.5, -7.25, 1e5, 123_456.789] {
        assert_eq!(wonders::js_sin(x).to_bits(), js_sin(x).to_bits());
        assert_eq!(wonders::js_cos(x).to_bits(), js_cos(x).to_bits());
        let a = js_sin(x);
        assert_eq!(kamien_kit::js_asin(a).to_bits(), js_asin(a).to_bits());
        assert_eq!(
            terrain_jsmath::js_pow(x.abs(), 2.4).to_bits(),
            js_pow(x.abs(), 2.4).to_bits()
        );
        assert_eq!(
            coast::js_hypot(x, 0.5).to_bits(),
            js_hypot(x, 0.5).to_bits()
        );
    }
}
