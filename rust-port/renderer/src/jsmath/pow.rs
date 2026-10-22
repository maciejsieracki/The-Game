//! `Math.pow` as V8 computes it (moved here from `terrain/jsmath.rs`, P4.11 →
//! P4.16; `terrain::jsmath::js_pow` stays as a re-export): `base::ieee754::pow` of V8's
//! `src/base/ieee754.cc:2645-2906` (V8 12.4.254.21 = node v22.22.0, file SHA-256
//! `da01a549…433a67fc`), an fdlibm 5.3 `__ieee754_pow` derivative, ported
//! operation for operation — including V8's one deviation from fdlibm in the
//! final `2**z` step (see the comment at `r`).
//!
//! Rust's `f64::powf` calls the platform libm (glibc on Linux), which rounds
//! differently from fdlibm in the last bit for some inputs; the sRGB
//! transfer functions of `THREE.Color` call `Math.pow`, so bit-exact colours
//! need this port. Verified against node v22 `Math.pow` on the colour
//! fixture (`tests/terrain_web_parity.rs`) and on the `jsmath` vectors
//! (`tests/jsmath_v8_parity.rs`).
//!
//! Special cases follow the V8 source: NaN operands give NaN (also for
//! `x == 1`), `(±1) ** ±∞` is NaN.

#![allow(
    clippy::many_single_char_names,
    clippy::unreadable_literal,
    clippy::excessive_precision,
    clippy::approx_constant
)]

use super::words::{hi, lo, scalbn, with_hi, with_lo};

const BP: [f64; 2] = [1.0, 1.5];
const DP_H: [f64; 2] = [0.0, 5.849_624_872_207_641_601_56e-01];
const DP_L: [f64; 2] = [0.0, 1.350_039_202_129_748_971_28e-08];
const TWO53: f64 = 9_007_199_254_740_992.0;
const HUGE: f64 = 1.0e300;
const TINY: f64 = 1.0e-300;
const L1: f64 = 5.999_999_999_999_946_487_25e-01;
const L2: f64 = 4.285_714_285_785_501_842_52e-01;
const L3: f64 = 3.333_333_298_183_774_329_18e-01;
const L4: f64 = 2.727_281_238_085_340_064_89e-01;
const L5: f64 = 2.306_607_457_755_617_540_67e-01;
const L6: f64 = 2.069_750_178_003_384_177_84e-01;
const P1: f64 = 1.666_666_666_666_660_190_37e-01;
const P2: f64 = -2.777_777_777_701_559_338_42e-03;
const P3: f64 = 6.613_756_321_437_934_361_17e-05;
const P4: f64 = -1.653_390_220_546_525_153_90e-06;
const P5: f64 = 4.138_136_797_057_238_460_39e-08;
const LG2: f64 = 6.931_471_805_599_452_862_27e-01;
const LG2_H: f64 = 6.931_471_824_645_996_093_75e-01;
const LG2_L: f64 = -1.904_654_299_957_768_045_25e-09;
const OVT: f64 = 8.008_566_259_537_294_437_2e-17;
const CP: f64 = 9.617_966_939_259_755_543_29e-01;
const CP_H: f64 = 9.617_967_009_544_372_558_59e-01;
const CP_L: f64 = -7.028_461_650_952_758_265_16e-09;
const IVLN2: f64 = 1.442_695_040_888_963_387_00e+00;
const IVLN2_H: f64 = 1.442_695_021_629_333_496_09e+00;
const IVLN2_L: f64 = 1.925_962_991_126_617_468_87e-08;

/// `Math.pow(x, y)` (V8 / fdlibm).
#[must_use]
#[allow(
    clippy::too_many_lines,
    clippy::cast_sign_loss,
    clippy::cast_possible_wrap,
    clippy::float_cmp
)]
pub fn js_pow(x: f64, y: f64) -> f64 {
    let hx = hi(x);
    let lx = lo(x);
    let hy = hi(y);
    let ly = lo(y);
    let ix = hx & 0x7fff_ffff;
    let iy = hy & 0x7fff_ffff;

    if iy == 0 && ly == 0 {
        return 1.0;
    }
    // ECMAScript: NaN exponent or base → NaN (also for x == 1).
    if x.is_nan() || y.is_nan() {
        return f64::NAN;
    }
    if hx == 0x3ff0_0000 && lx == 0 {
        // ECMAScript: 1 ** ±Infinity is NaN.
        return if y.is_infinite() { f64::NAN } else { 1.0 };
    }

    let mut yisint = 0;
    if hx < 0 {
        if iy >= 0x4340_0000 {
            yisint = 2;
        } else if iy >= 0x3ff0_0000 {
            let k = (iy >> 20) - 0x3ff;
            if k > 20 {
                let j = ly >> (52 - k);
                if (j << (52 - k)) == ly {
                    yisint = 2 - (j & 1) as i32;
                }
            } else if ly == 0 {
                let j = iy >> (20 - k);
                if (j << (20 - k)) == iy {
                    yisint = 2 - (j & 1);
                }
            }
        }
    }

    if ly == 0 {
        if iy == 0x7ff0_0000 {
            if ((ix - 0x3ff0_0000) | lx as i32) == 0 {
                return f64::NAN; // ECMAScript: (-1) ** ±Infinity is NaN
            } else if ix >= 0x3ff0_0000 {
                return if hy >= 0 { y } else { 0.0 };
            }
            return if hy < 0 { -y } else { 0.0 };
        }
        if iy == 0x3ff0_0000 {
            return if hy < 0 { 1.0 / x } else { x };
        }
        if hy == 0x4000_0000 {
            return x * x;
        }
        if hy == 0x3fe0_0000 && hx >= 0 {
            return x.sqrt();
        }
    }

    let mut ax = x.abs();
    if lx == 0 && (ix == 0x7ff0_0000 || ix == 0 || ix == 0x3ff0_0000) {
        let mut z = ax;
        if hy < 0 {
            z = 1.0 / z;
        }
        if hx < 0 {
            if ((ix - 0x3ff0_0000) | yisint) == 0 {
                z = f64::NAN; // V8: signaling_NaN() — (-1) ** non-integer
            } else if yisint == 1 {
                z = -z;
            }
        }
        return z;
    }

    let mut n: i32 = ((hx as u32) >> 31) as i32 - 1;
    if (n | yisint) == 0 {
        return f64::NAN; // V8: signaling_NaN() — (x < 0) ** non-integer
    }
    let mut s = 1.0;
    if (n | (yisint - 1)) == 0 {
        s = -1.0;
    }

    let t1: f64;
    let t2: f64;
    if iy > 0x41e0_0000 {
        if iy > 0x43f0_0000 {
            if ix <= 0x3fef_ffff {
                return if hy < 0 { HUGE * HUGE } else { TINY * TINY };
            }
            if ix >= 0x3ff0_0000 {
                return if hy > 0 { HUGE * HUGE } else { TINY * TINY };
            }
        }
        if ix < 0x3fef_ffff {
            return if hy < 0 {
                s * HUGE * HUGE
            } else {
                s * TINY * TINY
            };
        }
        if ix > 0x3ff0_0000 {
            return if hy > 0 {
                s * HUGE * HUGE
            } else {
                s * TINY * TINY
            };
        }
        let t = ax - 1.0;
        let w = (t * t) * (0.5 - t * (3.333_333_333_333_333_1e-01 - t * 0.25));
        let u = IVLN2_H * t;
        let v = t * IVLN2_L - w * IVLN2;
        let tt = with_lo(u + v, 0);
        t1 = tt;
        t2 = v - (tt - u);
    } else {
        let mut ix2 = ix;
        n = 0;
        if ix2 < 0x0010_0000 {
            ax *= TWO53;
            n -= 53;
            ix2 = hi(ax);
        }
        n += (ix2 >> 20) - 0x3ff;
        let j = ix2 & 0x000f_ffff;
        ix2 = j | 0x3ff0_0000;
        let k: usize;
        if j <= 0x3988e {
            k = 0;
        } else if j < 0xbb67a {
            k = 1;
        } else {
            k = 0;
            n += 1;
            ix2 -= 0x0010_0000;
        }
        ax = with_hi(ax, ix2);

        let u = ax - BP[k];
        let v = 1.0 / (ax + BP[k]);
        let ss = u * v;
        let s_h = with_lo(ss, 0);
        #[allow(clippy::cast_possible_truncation)]
        let kk = k as i32;
        let t_h0 = with_hi(0.0, ((ix2 >> 1) | 0x2000_0000) + 0x0008_0000 + (kk << 18));
        let t_l0 = ax - (t_h0 - BP[k]);
        let s_l = v * ((u - s_h * t_h0) - s_h * t_l0);
        let mut s2 = ss * ss;
        let mut r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
        r += s_l * (s_h + ss);
        s2 = s_h * s_h;
        let t_h = with_lo(3.0 + s2 + r, 0);
        let t_l = r - ((t_h - 3.0) - s2);
        let u = s_h * t_h;
        let v = s_l * t_h + t_l * ss;
        let p_h = with_lo(u + v, 0);
        let p_l = v - (p_h - u);
        let z_h = CP_H * p_h;
        let z_l = CP_L * p_h + p_l * CP + DP_L[k];
        let t = f64::from(n);
        let tt = with_lo(((z_h + z_l) + DP_H[k]) + t, 0);
        t1 = tt;
        t2 = z_l - (((tt - t) - DP_H[k]) - z_h);
    }

    let y1 = with_lo(y, 0);
    let p_l = (y - y1) * t1 + y * t2;
    let mut p_h = y1 * t1;
    let z = p_l + p_h;
    let j = hi(z);
    let i = lo(z) as i32;
    if j >= 0x4090_0000 {
        if ((j - 0x4090_0000) | i) != 0 || p_l + OVT > z - p_h {
            return s * HUGE * HUGE;
        }
    } else if (j & 0x7fff_ffff) >= 0x4090_cc00
        && ((j.wrapping_sub(0xc090_cc00_u32 as i32)) | i != 0 || p_l <= z - p_h)
    {
        return s * TINY * TINY;
    }

    let i = j & 0x7fff_ffff;
    let mut k = (i >> 20) - 0x3ff;
    let mut n = 0;
    if i > 0x3fe0_0000 {
        n = j + (0x0010_0000 >> (k + 1));
        k = ((n & 0x7fff_ffff) >> 20) - 0x3ff;
        let t = with_hi(0.0, n & !(0x000f_ffff >> k));
        n = ((n & 0x000f_ffff) | 0x0010_0000) >> (20 - k);
        if j < 0 {
            n = -n;
        }
        p_h -= t;
    }
    let t = with_lo(p_l + p_h, 0);
    let u = t * LG2_H;
    let v = (p_l - (t - p_h)) * LG2 + t * LG2_L;
    let mut z = u + v;
    let w = v - (z - u);
    let t = z * z;
    let t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
    // V8 deviates from fdlibm here: the whole `(t1 - two) - (w + z * w)` is
    // the divisor (`ieee754.cc`: `base::Divide(z * t1, (t1 - two) - (w + z * w))`).
    let r = (z * t1) / ((t1 - 2.0) - (w + z * w));
    z = 1.0 - (r - z);
    let mut jz = hi(z);
    jz += n << 20;
    if (jz >> 20) <= 0 {
        z = scalbn(z, n);
    } else {
        z = with_hi(z, jz);
    }
    s * z
}
