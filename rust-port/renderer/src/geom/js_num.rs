//! JavaScript number conversions shared by the renderer.
//!
//! [`to_int32`] was private to [`super::earcut`] (`z_order`, Earcut's
//! `x | 0`); it now lives here so that the view adapter
//! ([`crate::view`], `seed | 0` of `map.seed`, `terrain/mod.rs` input
//! `TerrainInput.seed`) uses the same function — one implementation, no
//! duplicate (topic R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE). Behaviour unchanged.

/// JavaScript `ToInt32` of a finite or non-finite double (`x | 0`,
/// ECMA-262 §7.1.6): `NaN`, `±Infinity` → `0`; otherwise `trunc(x)` modulo
/// `2^32`, read as a two's-complement `i32`. `-0` → `0`.
///
/// Unlike Rust `x as i32` this wraps instead of saturating
/// (`2147483648 | 0 === -2147483648`, `1e300 | 0 === 0`).
#[allow(clippy::cast_possible_truncation)]
pub(crate) fn to_int32(x: f64) -> i32 {
    if !x.is_finite() {
        return 0;
    }
    let t = x.trunc();
    let m = t.rem_euclid(4_294_967_296.0);
    let u = m as u64 as u32;
    u as i32
}

#[cfg(test)]
mod tests {
    use super::to_int32;

    #[test]
    fn wraps_like_js() {
        assert_eq!(to_int32(2_147_483_648.0), i32::MIN);
        assert_eq!(to_int32(-2_147_483_649.0), i32::MAX);
        assert_eq!(to_int32(4_294_967_297.0), 1);
        assert_eq!(to_int32(-0.0), 0);
        assert_eq!(to_int32(f64::NAN), 0);
        assert_eq!(to_int32(f64::INFINITY), 0);
        assert_eq!(to_int32(f64::NEG_INFINITY), 0);
        assert_eq!(to_int32(-1.9), -1);
    }
}
