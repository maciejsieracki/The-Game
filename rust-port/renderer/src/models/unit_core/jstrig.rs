//! `Math.sin` / `Math.cos` as V8 computes them: the fdlibm 5.3 algorithms
//! `__kernel_sin`, `__kernel_cos` and `__ieee754_rem_pio2` that V8 ships as
//! `base::ieee754::sin/cos` (`src/base/ieee754.cc`), ported operation for
//! operation.
//!
//! Why: Rust's `f64::sin/cos` call the platform libm (glibc 2.39 here),
//! which differs from V8 in the last bit for some inputs (measured on the
//! unit models: quaternions and positions 1 ulp off, see the P4.13
//! document). Bit parity of the unit models needs V8's results.
//!
//! Range: exact port for `|x| <= 2^19 * pi/2` (the medium reduction path);
//! beyond that (the `__kernel_rem_pio2` path, never used by model angles)
//! this falls back to the platform libm — documented deviation.

#![allow(
    clippy::unreadable_literal,
    clippy::excessive_precision,
    clippy::many_single_char_names,
    // fdlibm constants are kept literally (INVPIO2 = 2/pi) and `x - x` is
    // the fdlibm idiom that returns NaN for +-inf and NaN.
    clippy::approx_constant,
    clippy::eq_op
)]

const C1: f64 = 4.16666666666666019037e-02;
const C2: f64 = -1.38888888888741095749e-03;
const C3: f64 = 2.48015872894767294178e-05;
const C4: f64 = -2.75573143513906633035e-07;
const C5: f64 = 2.08757232129817482790e-09;
const C6: f64 = -1.13596475577881948265e-11;

const S1: f64 = -1.66666666666666324348e-01;
const S2: f64 = 8.33333333332248946124e-03;
const S3: f64 = -1.98412698298579493134e-04;
const S4: f64 = 2.75573137070700676789e-06;
const S5: f64 = -2.50507602534068634195e-08;
const S6: f64 = 1.58969099521155010221e-10;

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

#[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
fn high_word(x: f64) -> i32 {
    (x.to_bits() >> 32) as u32 as i32
}

#[allow(clippy::cast_sign_loss)]
fn with_high_word_low_zero(hi: i32) -> f64 {
    f64::from_bits(u64::from(hi as u32) << 32)
}

/// `__kernel_cos(x, y)`.
#[allow(clippy::cast_possible_truncation)]
fn kernel_cos(x: f64, y: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && (x as i32) == 0 {
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
            with_high_word_low_zero(ix - 0x0020_0000)
        };
        let iz = 0.5 * z - qx;
        let a = 1.0 - qx;
        a - (iz - (z * r - x * y))
    }
}

/// `__kernel_sin(x, y, iy)`.
#[allow(clippy::cast_possible_truncation)]
fn kernel_sin(x: f64, y: f64, iy: bool) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && (x as i32) == 0 {
        return x;
    }
    let z = x * x;
    let v = z * x;
    let r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
    if iy {
        x - ((z * (0.5 * y - v * r) - y) - v * S1)
    } else {
        x + v * (S1 + z * r)
    }
}

/// `__ieee754_rem_pio2(x, y)` for `|x| <= 2^19 * pi/2`; `None` beyond.
#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_sign_loss,
    clippy::float_cmp
)]
fn rem_pio2(x: f64) -> Option<(i32, f64, f64)> {
    let hx = high_word(x);
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
    let n = (t * INVPIO2 + 0.5) as i32;
    let fn_ = f64::from(n);
    let mut r = t - fn_ * PIO2_1;
    let mut w = fn_ * PIO2_1T;
    let mut y0;
    if n < 32 && ix != NPIO2_HW[(n - 1) as usize] {
        y0 = r - w;
    } else {
        let j = ix >> 20;
        y0 = r - w;
        let mut i = j - ((high_word(y0) >> 20) & 0x7ff);
        if i > 16 {
            let t2 = r;
            w = fn_ * PIO2_2;
            r = t2 - w;
            w = fn_ * PIO2_2T - ((t2 - r) - w);
            y0 = r - w;
            i = j - ((high_word(y0) >> 20) & 0x7ff);
            if i > 49 {
                let t3 = r;
                w = fn_ * PIO2_3;
                r = t3 - w;
                w = fn_ * PIO2_3T - ((t3 - r) - w);
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

/// `Math.cos(x)` (V8 / fdlibm).
#[must_use]
pub fn js_cos(x: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return kernel_cos(x, 0.0);
    }
    if ix >= 0x7ff0_0000 {
        return x - x;
    }
    let Some((n, y0, y1)) = rem_pio2(x) else {
        return x.cos();
    };
    match n & 3 {
        0 => kernel_cos(y0, y1),
        1 => -kernel_sin(y0, y1, true),
        2 => -kernel_cos(y0, y1),
        _ => kernel_sin(y0, y1, true),
    }
}

/// Method syntax for [`js_sin`] / [`js_cos`] (`x.js_sin()`), so ported
/// expressions keep the shape of the JavaScript source.
pub trait JsTrig {
    /// `Math.sin(self)`.
    fn js_sin(self) -> f64;
    /// `Math.cos(self)`.
    fn js_cos(self) -> f64;
}

impl JsTrig for f64 {
    fn js_sin(self) -> f64 {
        js_sin(self)
    }
    fn js_cos(self) -> f64 {
        js_cos(self)
    }
}

/// `Math.sin(x)` (V8 / fdlibm).
#[must_use]
pub fn js_sin(x: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return kernel_sin(x, 0.0, false);
    }
    if ix >= 0x7ff0_0000 {
        return x - x;
    }
    let Some((n, y0, y1)) = rem_pio2(x) else {
        return x.sin();
    };
    match n & 3 {
        0 => kernel_sin(y0, y1, true),
        1 => kernel_cos(y0, y1),
        2 => -kernel_sin(y0, y1, true),
        _ => -kernel_cos(y0, y1),
    }
}
