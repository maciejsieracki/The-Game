//! `Math.sin` / `Math.cos` as V8 computes them in node v22.22.0 (V8 12.4):
//! fdlibm 5.3 `__kernel_sin`, `__kernel_cos` and the small/medium branches
//! of `__ieee754_rem_pio2` (`src/base/ieee754.cc`), ported operation for
//! operation.
//!
//! Why: the platform `sin`/`cos` (glibc 2.39 here) round differently from
//! fdlibm in the last bit for some of the angles the wonder builders use —
//! measured: 912 scalar differences (all ≤ 1e-12) in `wyrocznia`,
//! `roquepertuse` and `osada_aschaffenburg` before this port
//! (`dyspozycje/rust-port/p4/P4-14-MOD12-WONDERS.md` §4).
//!
//! Scope: `|x| <= 2^19·π/2` (≈ 823 550) goes through the fdlibm reduction;
//! larger finite arguments (never produced by the wonder builders, whose
//! angles lie in `[-π, 2π]`) fall back to the platform function — the
//! `__kernel_rem_pio2` large-argument path is NOT ported. `±∞`/NaN give NaN.

#![allow(
    clippy::unreadable_literal,
    clippy::excessive_precision,
    clippy::many_single_char_names,
    clippy::approx_constant
)]

const S1: f64 = -1.66666666666666324348e-01;
const S2: f64 = 8.33333333332248946124e-03;
const S3: f64 = -1.98412698298579493134e-04;
const S4: f64 = 2.75573137070700676789e-06;
const S5: f64 = -2.50507602534068634195e-08;
const S6: f64 = 1.58969099521155010221e-10;

const C1: f64 = 4.16666666666666019037e-02;
const C2: f64 = -1.38888888888741095749e-03;
const C3: f64 = 2.48015872894767294178e-05;
const C4: f64 = -2.75573143513906633035e-07;
const C5: f64 = 2.08757232129817482790e-09;
const C6: f64 = -1.13596475577881948265e-11;

const HALF: f64 = 0.5;
const INVPIO2: f64 = 6.36619772367581382433e-01;
const PIO2_1: f64 = 1.57079632673412561417e+00;
const PIO2_1T: f64 = 6.07710050650619224932e-11;
const PIO2_2: f64 = 6.07710050630396597660e-11;
const PIO2_2T: f64 = 2.02226624879595063154e-21;
const PIO2_3: f64 = 2.02226624871116645580e-21;
const PIO2_3T: f64 = 8.47842766036889956997e-32;

const NPIO2_HW: [i32; 32] = [
    0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB,
    0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB,
    0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
    0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB,
];

/// High 32 bits as a signed word (`GET_HIGH_WORD`).
#[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
fn hi(x: f64) -> i32 {
    (x.to_bits() >> 32) as u32 as i32
}

/// `INSERT_WORDS(x, hi, 0)`.
#[allow(clippy::cast_sign_loss)]
fn from_hi(h: i32) -> f64 {
    f64::from_bits(u64::from(h as u32) << 32)
}

/// C `(int)x` truncation test used by the kernels for tiny `x`.
#[allow(clippy::cast_possible_truncation)]
fn trunc_is_zero(x: f64) -> bool {
    (x as i32) == 0
}

fn kernel_sin(x: f64, y: f64, iy: i32) -> f64 {
    let ix = hi(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && trunc_is_zero(x) {
        return x;
    }
    let z = x * x;
    let v = z * x;
    let r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
    if iy == 0 {
        x + v * (S1 + z * r)
    } else {
        x - ((z * (HALF * y - v * r) - y) - v * S1)
    }
}

fn kernel_cos(x: f64, y: f64) -> f64 {
    let ix = hi(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && trunc_is_zero(x) {
        return 1.0;
    }
    let z = x * x;
    let r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
    if ix < 0x3FD3_3333 {
        1.0 - (0.5 * z - (z * r - x * y))
    } else {
        let qx = if ix > 0x3fe9_0000 {
            0.28125
        } else {
            from_hi(ix - 0x0020_0000)
        };
        let hz = 0.5 * z - qx;
        let a = 1.0 - qx;
        a - (hz - (z * r - x * y))
    }
}

/// `__ieee754_rem_pio2` for `|x| <= 2^19·π/2`; `None` for larger arguments.
#[allow(clippy::cast_possible_truncation, clippy::float_cmp)]
fn rem_pio2(x: f64) -> Option<(i32, f64, f64)> {
    let hx = hi(x);
    let ix = hx & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return Some((0, x, 0.0));
    }
    if ix < 0x4002_d97c {
        if hx > 0 {
            let mut z = x - PIO2_1;
            let (y0, y1);
            if ix == 0x3ff9_21fb {
                z -= PIO2_2;
                y0 = z - PIO2_2T;
                y1 = (z - y0) - PIO2_2T;
            } else {
                y0 = z - PIO2_1T;
                y1 = (z - y0) - PIO2_1T;
            }
            return Some((1, y0, y1));
        }
        let mut z = x + PIO2_1;
        let (y0, y1);
        if ix == 0x3ff9_21fb {
            z += PIO2_2;
            y0 = z + PIO2_2T;
            y1 = (z - y0) + PIO2_2T;
        } else {
            y0 = z + PIO2_1T;
            y1 = (z - y0) + PIO2_1T;
        }
        return Some((-1, y0, y1));
    }
    if ix > 0x4139_21fb {
        return None;
    }
    let t = x.abs();
    let n = (t * INVPIO2 + HALF) as i32;
    let f_n = f64::from(n);
    let mut r = t - f_n * PIO2_1;
    let mut w = f_n * PIO2_1T;
    let mut y0;
    #[allow(clippy::cast_sign_loss)]
    let quick = n < 32 && ix != NPIO2_HW[(n - 1) as usize];
    if quick {
        y0 = r - w;
    } else {
        let j = ix >> 20;
        y0 = r - w;
        let mut i = j - ((hi(y0) >> 20) & 0x7ff);
        if i > 16 {
            let t2 = r;
            w = f_n * PIO2_2;
            r = t2 - w;
            w = f_n * PIO2_2T - ((t2 - r) - w);
            y0 = r - w;
            i = j - ((hi(y0) >> 20) & 0x7ff);
            if i > 49 {
                let t3 = r;
                w = f_n * PIO2_3;
                r = t3 - w;
                w = f_n * PIO2_3T - ((t3 - r) - w);
                y0 = r - w;
            }
        }
    }
    let y1 = (r - y0) - w;
    if hx < 0 {
        Some((-n, -y0, -y1))
    } else {
        Some((n, y0, y1))
    }
}

/// `Math.sin(x)` of V8 (fdlibm).
#[must_use]
pub fn js_sin(x: f64) -> f64 {
    let ix = hi(x) & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return kernel_sin(x, 0.0, 0);
    }
    if ix >= 0x7ff0_0000 {
        return f64::NAN; // fdlibm: x - x (Inf or NaN in, NaN out)
    }
    match rem_pio2(x) {
        Some((n, y0, y1)) => match n & 3 {
            0 => kernel_sin(y0, y1, 1),
            1 => kernel_cos(y0, y1),
            2 => -kernel_sin(y0, y1, 1),
            _ => -kernel_cos(y0, y1),
        },
        None => x.sin(),
    }
}

/// `Math.cos(x)` of V8 (fdlibm).
#[must_use]
pub fn js_cos(x: f64) -> f64 {
    let ix = hi(x) & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return kernel_cos(x, 0.0);
    }
    if ix >= 0x7ff0_0000 {
        return f64::NAN; // fdlibm: x - x (Inf or NaN in, NaN out)
    }
    match rem_pio2(x) {
        Some((n, y0, y1)) => match n & 3 {
            0 => kernel_cos(y0, y1),
            1 => -kernel_sin(y0, y1, 1),
            2 => -kernel_cos(y0, y1),
            _ => kernel_sin(y0, y1, 1),
        },
        None => x.cos(),
    }
}
