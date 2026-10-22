//! `Math.hypot` of V8 12.4 (node v22.22.0): the Torque builtin `MathHypot`
//! (`src/builtins/math.tq:397-441`) — scale by the largest magnitude,
//! Kahan-compensated sum of squares, `sqrt(sum) * max`. Not fdlibm `hypot`.
//!
//! Moved here from `terrain/coast.rs` (P4.11), generalised to any number of
//! arguments (P4.16).

/// `Math.hypot(...values)` of V8.
#[must_use]
pub fn js_hypot_n(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let mut one_arg_is_nan = false;
    let mut max = 0.0f64;
    for &v in values {
        if v.is_nan() {
            one_arg_is_nan = true;
        } else {
            let a = v.abs();
            if a > max {
                max = a;
            }
        }
    }
    if max == f64::INFINITY {
        return f64::INFINITY;
    }
    if one_arg_is_nan {
        return f64::NAN;
    }
    if max == 0.0 {
        return 0.0;
    }
    let mut sum = 0.0f64;
    let mut compensation = 0.0f64;
    for &v in values {
        let n = v.abs() / max;
        let summand = n * n - compensation;
        let preliminary = sum + summand;
        compensation = (preliminary - sum) - summand;
        sum = preliminary;
    }
    sum.sqrt() * max
}

/// `Math.hypot(a, b)` of V8.
#[must_use]
pub fn js_hypot(a: f64, b: f64) -> f64 {
    js_hypot_n(&[a, b])
}
