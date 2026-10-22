//! `core::jsnum::js_to_fixed` against V8 `Number.prototype.toFixed`
//! (R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1).
//!
//! `tests/fixtures/jsnum/to_fixed.txt` is written by `gen_to_fixed.mjs`
//! (node v22.22.0, V8 12.4.254.21-node.33): one case per line, `<binary64
//! bits as 16 hex digits> <digits> <x.toFixed(digits)>`. Covers NaN, ±∞,
//! ±0, |x| ≥ 1e21 (`Number::toString`), subnormals, `Number.MAX_VALUE`,
//! exact binary ties at `digits` decimals (both signs), decimal-looking
//! values of every magnitude and random bit patterns, `digits` 0..=100.
//! Every string must be identical. The P4.22 / P4.12 entry points
//! (`models::misc::overlay::js_to_fixed`, `core::jsnum::js_to_fixed3`) are
//! checked to be the same function.

use std::path::PathBuf;

use civ_renderer::core::jsnum::{js_to_fixed, js_to_fixed3};

fn cases() -> Vec<(f64, u32, String)> {
    let p: PathBuf = [
        env!("CARGO_MANIFEST_DIR"),
        "tests",
        "fixtures",
        "jsnum",
        "to_fixed.txt",
    ]
    .iter()
    .collect();
    let text = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("read {}: {e}", p.display()));
    let mut lines = text.lines();
    let header = lines.next().expect("header");
    assert!(
        header.starts_with("# node v22.22.0 v8 12.4.254.21-node.33 cases "),
        "{header}"
    );
    let declared: usize = header.rsplit(' ').next().expect("n").parse().expect("n");
    let out: Vec<(f64, u32, String)> = lines
        .map(|l| {
            let mut it = l.splitn(3, ' ');
            let bits = u64::from_str_radix(it.next().expect("bits"), 16).expect("hex");
            let d: u32 = it.next().expect("digits").parse().expect("digits");
            let s = it.next().expect("string").to_owned();
            (f64::from_bits(bits), d, s)
        })
        .collect();
    assert_eq!(out.len(), declared, "case count");
    out
}

#[test]
fn to_fixed_matches_v8() {
    let cases = cases();
    assert!(cases.len() >= 20_000, "only {} cases", cases.len());
    let mut errors = Vec::new();
    let (mut neg, mut big, mut nonfinite, mut ties, mut wide) = (0, 0, 0, 0, 0);
    for (x, d, want) in &cases {
        if x.is_sign_negative() {
            neg += 1;
        }
        if !x.is_finite() {
            nonfinite += 1;
        } else if x.abs() >= 1e21 {
            big += 1;
        } else {
            let scaled = x.abs() * 2f64.powi(i32::try_from(*d).expect("d") + 1);
            if scaled.fract() == 0.0 && scaled % 2.0 == 1.0 {
                ties += 1;
            }
        }
        if *d > 20 {
            wide += 1;
        }
        let got = js_to_fixed(*x, *d);
        if &got != want && errors.len() < 40 {
            errors.push(format!(
                "({x:e} [{:#018x}]).toFixed({d}): rust {got} v8 {want}",
                x.to_bits()
            ));
        }
    }
    assert!(
        errors.is_empty(),
        "{} differences:\n{}",
        errors.len(),
        errors.join("\n")
    );
    // The categories the topic requires are really in the data.
    assert!(neg >= 5_000, "negatives {neg}");
    assert!(big >= 1_000, "|x| >= 1e21: {big}");
    assert!(nonfinite >= 300, "NaN/Inf {nonfinite}");
    assert!(ties >= 4_000, "exact ties {ties}");
    assert!(wide >= 3_000, "digits > 20: {wide}");
    println!(
        "toFixed vs V8: {} cases identical (negative {neg}, |x|>=1e21 {big}, NaN/Inf {nonfinite}, exact ties {ties}, digits>20 {wide})",
        cases.len()
    );
}

/// One implementation: the P4.12 and P4.22 entry points are the core function.
#[test]
fn to_fixed_entry_points_are_one_function() {
    for (x, d, want) in cases() {
        if d == 3 {
            assert_eq!(js_to_fixed3(x), want, "{x:e}");
        }
        assert_eq!(
            civ_renderer::models::misc::overlay::js_to_fixed(x, d),
            want,
            "{x:e} {d}"
        );
    }
}

#[test]
#[should_panic(expected = "between 0 and 100")]
fn to_fixed_rejects_digits_above_100() {
    let _ = js_to_fixed(1.0, 101);
}
