//! JavaScript number semantics that the core modules need on top of the
//! helpers already in the crate ([`crate::pick::three::js_min`] /
//! [`crate::pick::three::js_max`] are reused, extended here to `NaN`).

use crate::pick::three::{js_max, js_min};

/// `Math.min(a, b)` including `NaN` propagation (`Math.min(NaN, x)` is
/// `NaN` in either position) and `Math.min(-0, +0) == -0`.
#[must_use]
pub fn js_min_nan(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        js_min(a, b)
    }
}

/// `Math.max(a, b)` including `NaN` propagation and
/// `Math.max(-0, +0) == +0`.
#[must_use]
pub fn js_max_nan(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        js_max(a, b)
    }
}

/// ECMAScript `ToInt32(x)` as a `u32` bit pattern (`ToUint32`): `NaN` and
/// `±∞` give 0, otherwise the integer part modulo 2³². `f64 %` is exact
/// (IEEE `fmod`), so this works for every magnitude, including values above
/// 2⁵³ where the double is already an integer.
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // value is in [0, 2^32)
pub fn js_to_uint32(x: f64) -> u32 {
    if !x.is_finite() {
        return 0;
    }
    let t = x.trunc();
    let m = t % 4_294_967_296.0;
    let m = if m < 0.0 { m + 4_294_967_296.0 } else { m };
    m as u32
}

/// `Number.prototype.toFixed(3)` for the finite values the height audit
/// prints. JavaScript picks the larger candidate on an exact decimal tie
/// (ties away from zero after the sign is split off), while Rust formatting
/// rounds ties to even; an exact tie at 3 decimals means `|x| · 16` is an odd
/// integer, which is handled explicitly. `-0` prints as `0.000`.
#[must_use]
pub fn js_to_fixed3(x: f64) -> String {
    if x == 0.0 {
        return "0.000".to_owned();
    }
    let neg = x < 0.0;
    let a = x.abs();
    let sixteen = a * 16.0;
    let body = if sixteen.fract() == 0.0 && sixteen % 2.0 == 1.0 && a < 1e15 {
        // Exact tie: a · 1000 = odd · 62.5 is exactly representable.
        let k = (a * 1000.0).round(); // half away from zero = the larger candidate
        let int = (k / 1000.0).trunc();
        let frac = k - int * 1000.0;
        format!("{int:.0}.{frac:03.0}")
    } else {
        format!("{a:.3}")
    };
    if neg {
        format!("-{body}")
    } else {
        body
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn to_uint32_matches_ecmascript() {
        assert_eq!(js_to_uint32(-1.0), 0xffff_ffff);
        assert_eq!(js_to_uint32(4_294_967_296.0 + 5.0), 5);
        assert_eq!(js_to_uint32(-2.5), 0xffff_fffe);
        assert_eq!(js_to_uint32(f64::NAN), 0);
        assert_eq!(js_to_uint32(1e20), (1e20f64 % 4_294_967_296.0) as u32);
    }

    /// Expected strings printed by node v22.22.0:
    /// `[0.0625,-0.0625,0.1875,2.5625,1.5,-0,0.21,0.0005,1e-7].map(x=>x.toFixed(3))`
    /// → `0.063 -0.063 0.188 2.563 1.500 0.000 0.210 0.001 0.000`.
    #[test]
    fn to_fixed3_matches_node() {
        let cases = [
            (0.0625, "0.063"),
            (-0.0625, "-0.063"),
            (0.1875, "0.188"),
            (2.5625, "2.563"),
            (1.5, "1.500"),
            (-0.0, "0.000"),
            (0.21, "0.210"),
            (0.0005, "0.001"),
            (1e-7, "0.000"),
        ];
        for (x, want) in cases {
            assert_eq!(js_to_fixed3(x), want, "{x}");
        }
    }
}
