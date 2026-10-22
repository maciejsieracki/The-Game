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

/// `Number.prototype.toFixed(3)` (the height audit of P4.12). The same
/// function as [`js_to_fixed`] with `digits = 3`; kept for its callers.
#[must_use]
pub fn js_to_fixed3(x: f64) -> String {
    js_to_fixed(x, 3)
}

/// `Number.prototype.toFixed(digits)` (ECMA-262 §21.1.3.3) for every `f64`
/// and `digits` in `0..=100` — the single `toFixed` implementation of the
/// crate (P4.24; `models::misc::overlay::js_to_fixed` re-exports it).
///
/// - `NaN`, `±∞` and `|x| ≥ 10²¹` give `Number::toString(x)` (`"NaN"`,
///   `"Infinity"`, `"-1e+21"`, …).
/// - Otherwise the sign is split off first (`x < 0` → `"-"`, so `-0` prints
///   without a sign while a tiny negative keeps it: `(-1e-9).toFixed(3)` is
///   `"-0.000"`), then the integer `n` closest to `|x| · 10^digits` is taken
///   on the EXACT binary value, the larger `n` on an exact tie (ties away
///   from zero). Rust's `{:.N}` formatting is exact too but breaks ties to
///   even, so ties are handled explicitly: an exact tie at `d` decimals means
///   `|x| · 2^(d+1)` is an odd integer; `|x|` then has exactly `d + 1`
///   decimals, the last one `5`, which are printed exactly and rounded up as
///   a decimal string (no integer overflow at any magnitude).
///
/// # Panics
///
/// If `digits > 100` (JavaScript throws a `RangeError`).
#[must_use]
pub fn js_to_fixed(x: f64, digits: u32) -> String {
    assert!(
        digits <= 100,
        "toFixed() digits argument must be between 0 and 100"
    );
    if !x.is_finite() || x.abs() >= 1e21 {
        return js_number_to_string_big(x);
    }
    let neg = x < 0.0;
    let a = x.abs();
    let d = digits as usize;
    // `2^(digits+1)` built from its exponent bits (`digits + 1 <= 101`, no
    // libm), and `a · 2^(digits+1)` (< 1e21 · 2^101) are exact.
    let pow2 = f64::from_bits((1023 + u64::from(digits) + 1) << 52);
    let scaled = a * pow2;
    let body = if scaled.fract() == 0.0 && scaled % 2.0 == 1.0 {
        let mut s = format!("{a:.prec$}", prec = d + 1);
        debug_assert!(s.ends_with('5'), "tie without a trailing 5: {s}");
        s.pop();
        if d == 0 {
            s.pop(); // the '.'
        }
        round_up_decimal(&s)
    } else {
        format!("{a:.d$}")
    };
    if neg {
        format!("-{body}")
    } else {
        body
    }
}

/// Adds one unit in the last place to a non-negative decimal string
/// (`"1.99"` → `"2.00"`, `"9"` → `"10"`).
fn round_up_decimal(s: &str) -> String {
    let mut b = s.as_bytes().to_vec();
    let mut i = b.len();
    loop {
        if i == 0 {
            b.insert(0, b'1');
            break;
        }
        i -= 1;
        match b[i] {
            b'.' => {}
            b'9' => b[i] = b'0',
            c => {
                b[i] = c + 1;
                break;
            }
        }
    }
    String::from_utf8(b).unwrap_or_default()
}

/// `Number::toString(x)` for the values `toFixed` hands to it: `NaN`, `±∞`
/// and `|x| ≥ 10²¹` (always the exponential form `d[.ddd]e+n` with the
/// shortest round-trip digits, the digits of Rust's `{:e}`).
fn js_number_to_string_big(x: f64) -> String {
    if x.is_nan() {
        return "NaN".to_owned();
    }
    if x.is_infinite() {
        return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_owned();
    }
    format!("{x:e}").replacen('e', "e+", 1)
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
