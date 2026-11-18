//! `Math.sin` zgodny z V8 (fdlibm, `src/base/ieee754.cc`) dla generatora pola bitwy (`battle_setup`).
//!
//! `f64::sin` z Rust korzysta z libm systemu (glibc) i rozni sie od V8 o 1 ulp na ok. 3% argumentow z zakresu
//! uzywanego przez szeroka rzeke (`generateBattleTerrain`, galaz `riverMode === 'wide'`, `battle-terrain.ts:516-543`;
//! zmierzone w R-RUSTPORT-P6-BATTLE-SETUP-Q1: 6432 z 200000 argumentow z `[-60, 60]`), co zmienia kolumne srodka
//! koryta po `Math.round`. Ponizej port `ieee754::sin` (FreeBSD msun: `k_sin.c`, `k_cos.c`, `e_rem_pio2.c`) dla
//! `|x| <= 2^19 * pi/2` (ten sam zakres co `mapgen::prims::js_cos`, ktorego jadra sa prywatne). Wieksze argumenty
//! (poza uzyciem generatora: `|x| < 2 * pi * (156 / 24 + 1)`) wracaja do `f64::sin`; NaN/Inf daja NaN jak w JS.

const fn bits(value: u64) -> f64 {
    f64::from_bits(value)
}

const KC1: f64 = bits(0x3FA5_5555_5555_554C);
const KC2: f64 = bits(0xBF56_C16C_16C1_5177);
const KC3: f64 = bits(0x3EFA_01A0_19CB_1590);
const KC4: f64 = bits(0xBE92_7E4F_809C_52AD);
const KC5: f64 = bits(0x3E21_EE9E_BDB4_B1C4);
const KC6: f64 = bits(0xBDA8_FAE9_BE88_38D4);
const KS1: f64 = bits(0xBFC5_5555_5555_5549);
const KS2: f64 = bits(0x3F81_1111_1110_F8A6);
const KS3: f64 = bits(0xBF2A_01A0_19C1_61D5);
const KS4: f64 = bits(0x3EC7_1DE3_57B1_FE7D);
const KS5: f64 = bits(0xBE5A_E5E6_8A2B_9CEB);
const KS6: f64 = bits(0x3DE5_D93A_5ACF_D57C);
const INV_PIO2: f64 = bits(0x3FE4_5F30_6DC9_C883);
const PIO2_1: f64 = bits(0x3FF9_21FB_5440_0000);
const PIO2_1T: f64 = bits(0x3DD0_B461_1A62_6331);
const PIO2_2: f64 = bits(0x3DD0_B461_1A60_0000);
const PIO2_2T: f64 = bits(0x3BA3_198A_2E03_7073);
const PIO2_3: f64 = bits(0x3BA3_198A_2E00_0000);
const PIO2_3T: f64 = bits(0x397B_839A_2520_49C1);
const NPIO2_HW: [u32; 32] = [
    0x3FF9_21FB,
    0x4009_21FB,
    0x4012_D97C,
    0x4019_21FB,
    0x401F_6A7A,
    0x4022_D97C,
    0x4025_FDBB,
    0x4029_21FB,
    0x402C_463A,
    0x402F_6A7A,
    0x4031_475C,
    0x4032_D97C,
    0x4034_6B9C,
    0x4035_FDBB,
    0x4037_8FDB,
    0x4039_21FB,
    0x403A_B41B,
    0x403C_463A,
    0x403D_D85A,
    0x403F_6A7A,
    0x4040_7E4C,
    0x4041_47AC,
    0x4042_106C,
    0x4042_D97C,
    0x4043_A28C,
    0x4044_6B9C,
    0x4045_34AC,
    0x4045_FDBB,
    0x4046_C6CB,
    0x4047_8FDB,
    0x4048_58EB,
    0x4049_21FB,
];

#[allow(clippy::cast_possible_truncation)]
fn high_word(x: f64) -> u32 {
    (x.to_bits() >> 32) as u32
}

#[allow(clippy::cast_possible_truncation)]
fn kernel_cos(x: f64, y: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && x as i32 == 0 {
        return 1.0;
    }
    let z = x * x;
    let r = z * (KC1 + z * (KC2 + z * (KC3 + z * (KC4 + z * (KC5 + z * KC6)))));
    if ix < 0x3FD3_3333 {
        1.0 - (0.5 * z - (z * r - x * y))
    } else {
        let qx = if ix > 0x3fe9_0000 {
            0.28125
        } else {
            f64::from_bits(u64::from(ix - 0x0020_0000) << 32)
        };
        let iz = 0.5 * z - qx;
        let a = 1.0 - qx;
        a - (iz - (z * r - x * y))
    }
}

/// `__kernel_sin(x, y, iy)`: `iy == 0` gdy `y` jest zerem (argument bez redukcji).
#[allow(clippy::cast_possible_truncation)]
fn kernel_sin(x: f64, y: f64, iy: bool) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && x as i32 == 0 {
        return x;
    }
    let z = x * x;
    let v = z * x;
    let r = KS2 + z * (KS3 + z * (KS4 + z * (KS5 + z * KS6)));
    if iy {
        x - ((z * (0.5 * y - v * r) - y) - v * KS1)
    } else {
        x + v * (KS1 + z * r)
    }
}

/// `__ieee754_rem_pio2` (zakres do ~2^19 * pi/2): zwraca `(n, y0, y1)`.
#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_possible_wrap,
    clippy::cast_sign_loss
)]
fn rem_pio2_medium(x: f64) -> (i32, f64, f64) {
    let hx = high_word(x);
    let ix = hx & 0x7fff_ffff;
    let negative = hx >> 31 != 0;
    if ix <= 0x3fe9_21fb {
        return (0, x, 0.0);
    }
    if ix < 0x4002_d97c {
        if !negative {
            let mut z = x - PIO2_1;
            if ix != 0x3ff9_21fb {
                let y0 = z - PIO2_1T;
                (1, y0, (z - y0) - PIO2_1T)
            } else {
                z -= PIO2_2;
                let y0 = z - PIO2_2T;
                (1, y0, (z - y0) - PIO2_2T)
            }
        } else {
            let mut z = x + PIO2_1;
            if ix != 0x3ff9_21fb {
                let y0 = z + PIO2_1T;
                (-1, y0, (z - y0) + PIO2_1T)
            } else {
                z += PIO2_2;
                let y0 = z + PIO2_2T;
                (-1, y0, (z - y0) + PIO2_2T)
            }
        }
    } else {
        let t = x.abs();
        let n = (t * INV_PIO2 + 0.5) as i32;
        let fnn = f64::from(n);
        let mut r = t - fnn * PIO2_1;
        let mut w = fnn * PIO2_1T;
        let mut y0;
        if n < 32 && ix != NPIO2_HW[(n - 1) as usize] {
            y0 = r - w;
        } else {
            let j = (ix >> 20) as i32;
            y0 = r - w;
            let mut i = j - ((high_word(y0) >> 20) & 0x7ff) as i32;
            if i > 16 {
                let t2 = r;
                w = fnn * PIO2_2;
                r = t2 - w;
                w = fnn * PIO2_2T - ((t2 - r) - w);
                y0 = r - w;
                i = j - ((high_word(y0) >> 20) & 0x7ff) as i32;
                if i > 49 {
                    let t3 = r;
                    w = fnn * PIO2_3;
                    r = t3 - w;
                    w = fnn * PIO2_3T - ((t3 - r) - w);
                    y0 = r - w;
                }
            }
        }
        let y1 = (r - y0) - w;
        if negative {
            (-n, -y0, -y1)
        } else {
            (n, y0, y1)
        }
    }
}

/// `Math.sin` jak w V8 (`ieee754::sin`, fdlibm).
#[must_use]
pub fn js_sin(x: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return kernel_sin(x, 0.0, false);
    }
    if ix >= 0x7ff0_0000 {
        return f64::NAN;
    }
    if ix > 0x4139_21fb {
        return x.sin();
    }
    let (n, y0, y1) = rem_pio2_medium(x);
    match n & 3 {
        0 => kernel_sin(y0, y1, true),
        1 => kernel_cos(y0, y1),
        2 => -kernel_sin(y0, y1, true),
        _ => -kernel_cos(y0, y1),
    }
}
