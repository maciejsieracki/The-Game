//! fdlibm word access macros (`GET_HIGH_WORD`, `GET_LOW_WORD`,
//! `INSERT_WORDS`, `SET_LOW_WORD`, …) of V8 `src/base/ieee754.cc:54-105`,
//! plus the exact `scalbn` that fdlibm takes from the C library.

/// `GET_HIGH_WORD(i, x)` as a signed `int32_t`.
#[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
pub(crate) fn hi(x: f64) -> i32 {
    (x.to_bits() >> 32) as u32 as i32
}

/// `GET_LOW_WORD(i, x)` (`uint32_t`).
#[allow(clippy::cast_possible_truncation)]
pub(crate) fn lo(x: f64) -> u32 {
    x.to_bits() as u32
}

/// `INSERT_WORDS(d, ix0, ix1)`.
#[allow(clippy::cast_sign_loss)]
pub(crate) fn from_words(h: i32, l: u32) -> f64 {
    f64::from_bits((u64::from(h as u32) << 32) | u64::from(l))
}

/// `SET_LOW_WORD(d, v)`.
pub(crate) fn with_lo(x: f64, l: u32) -> f64 {
    f64::from_bits((x.to_bits() & 0xffff_ffff_0000_0000) | u64::from(l))
}

/// `SET_HIGH_WORD(d, v)`.
#[allow(clippy::cast_sign_loss)]
pub(crate) fn with_hi(x: f64, h: i32) -> f64 {
    f64::from_bits((x.to_bits() & 0xffff_ffff) | (u64::from(h as u32) << 32))
}

/// C `(int)x == 0` (truncation) used by the kernels for tiny arguments.
#[allow(clippy::cast_possible_truncation)]
pub(crate) fn trunc_is_zero(x: f64) -> bool {
    (x as i32) == 0
}

/// C99 `scalbn(x, n)` = `x · 2ⁿ`, correctly rounded (one rounding, as in
/// musl/glibc): exact whenever the result is normal.
#[allow(clippy::cast_sign_loss)]
pub(crate) fn scalbn(x: f64, n: i32) -> f64 {
    let two_p1023 = f64::from_bits(0x7fe0_0000_0000_0000);
    // 2^-1022 · 2^53 = 2^-969 (keeps the intermediate normal).
    let two_m969 = f64::from_bits(0x0360_0000_0000_0000);
    let mut y = x;
    let mut n = n;
    if n > 1023 {
        y *= two_p1023;
        n -= 1023;
        if n > 1023 {
            y *= two_p1023;
            n -= 1023;
            if n > 1023 {
                n = 1023;
            }
        }
    } else if n < -1022 {
        y *= two_m969;
        n += 1022 - 53;
        if n < -1022 {
            y *= two_m969;
            n += 1022 - 53;
            if n < -1022 {
                n = -1022;
            }
        }
    }
    y * f64::from_bits(((0x3ff + n) as u64) << 52)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scalbn_is_exact_power_of_two_scaling() {
        assert_eq!(scalbn(1.0, 0), 1.0);
        assert_eq!(scalbn(1.5, 10), 1536.0);
        assert_eq!(scalbn(1.0, -1074), f64::from_bits(1));
        assert_eq!(scalbn(1.0, 1023), f64::from_bits(0x7fe0_0000_0000_0000));
        assert_eq!(scalbn(1.0, 1024), f64::INFINITY);
        assert_eq!(scalbn(1.0, -1080), 0.0);
        assert_eq!(scalbn(f64::from_bits(1), 1074), 1.0);
    }

    #[test]
    fn words_round_trip() {
        let x = -1.234_567_890_123e-5_f64;
        assert_eq!(from_words(hi(x), lo(x)).to_bits(), x.to_bits());
        assert_eq!(with_lo(x, 0).to_bits(), x.to_bits() & 0xffff_ffff_0000_0000);
        assert_eq!(with_hi(x, 0).to_bits(), x.to_bits() & 0xffff_ffff);
        assert!(trunc_is_zero(0.9) && !trunc_is_zero(1.0));
    }
}
