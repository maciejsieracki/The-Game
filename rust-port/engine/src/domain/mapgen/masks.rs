//! P6.M03 — maski ladu (centra kontynentow, Voronoi, siatka wysp). Temat wlasciciel: R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1.
//! Zakres web (P6-25 §6): earth-land-mask.ts (reszta), gen-helpers.ts:252-824.
//!
//! Port 1:1 z weba (pin `edb8fb56`): parametry ksztaltu, maska eliptyczna, centra kontynentow
//! (kontynenty / pangea / wyspy / Ziemia), strefy Voronoi, siatka wysp i maski ladu czterech typow
//! swiata. Zgodnosc z webem jest bitowa (f64) i zamrozona wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m03_vectors/*.json`, testy `tests/p6_m03_*.rs`). Wartosci kalibracyjne leza w
//! `data/derived/mapgen-masks.json` (parser: `data/derived.rs`), nie w kodzie.
//!
//! Funkcje `Math.*` V8, ktorych wynik rozni sie od libm systemu (`pow`, `atan2`, `sin`, `hypot`),
//! sa odtworzone w podmodule [`v8math`] (fdlibm / algorytm V8), bo maski ich uzywaja
//! (zmierzone: `pow` 892/12000, `atan2` 1059/6000, `sin` 203/6000, `hypot` 2070/6000 roznic
//! wzgledem glibc na rozkladach argumentow masek).
//!
//! Zaleznosci spoza zakresu M03 (wlasciciel: M04, `gen-helpers.ts`:1177-1195, :1294-1300,
//! :1313-1325, :1334-1336) sa tu zaimplementowane lokalnie 1:1 i zweryfikowane tymi samymi
//! wektorami; po scaleniu M04 mozna je zastapic wywolaniami z jego modulu.

use crate::data::derived::{mapgen_masks, MasksAngleNoise, MasksNoiseWarp, MasksPangeaParams};
use crate::domain::map_generator::WorldType;
use crate::domain::mapgen::prims::{earth_template_land_at, fbm, hex_key, js_cos, PERM_TABLE_LEN};

/// Tablica permutacji szumu (`Uint8Array(256)` weba).
pub type PermTable = [u8; PERM_TABLE_LEN];

/// Srodek znormalizowanej mapy `[0, 1]` (geometria: `0.5` w `buildContinentCenters`, `normToIsotropic`).
const HALF: f64 = 0.5;

// ---------------------------------------------------------------------------
// `Math.*` V8
// ---------------------------------------------------------------------------

/// Odtworzenie `Math.sin`, `Math.atan2`, `Math.pow`, `Math.hypot` i `Math.max/min` z V8
/// (Node 22): fdlibm (FreeBSD msun) i algorytm Kahana dla `hypot`.
pub mod v8math {
    const fn bits(value: u64) -> f64 {
        f64::from_bits(value)
    }

    fn hi(x: f64) -> u32 {
        (x.to_bits() >> 32) as u32
    }

    fn lo(x: f64) -> u32 {
        x.to_bits() as u32
    }

    fn with_hi(x: f64, high: u32) -> f64 {
        f64::from_bits((u64::from(high) << 32) | (x.to_bits() & 0xffff_ffff))
    }

    fn with_lo(x: f64, low: u32) -> f64 {
        f64::from_bits((x.to_bits() & 0xffff_ffff_0000_0000) | u64::from(low))
    }

    fn from_hi(high: u32) -> f64 {
        f64::from_bits(u64::from(high) << 32)
    }

    /// `Math.max(a, b)` (NaN propaguje, `+0 > -0`).
    pub fn js_max(a: f64, b: f64) -> f64 {
        if a.is_nan() || b.is_nan() {
            return f64::NAN;
        }
        if a == 0.0 && b == 0.0 {
            return if a.is_sign_positive() { a } else { b };
        }
        if a > b {
            a
        } else {
            b
        }
    }

    /// `Math.min(a, b)` (NaN propaguje, `-0 < +0`).
    pub fn js_min(a: f64, b: f64) -> f64 {
        if a.is_nan() || b.is_nan() {
            return f64::NAN;
        }
        if a == 0.0 && b == 0.0 {
            return if a.is_sign_negative() { a } else { b };
        }
        if a < b {
            a
        } else {
            b
        }
    }

    /// `Math.hypot(a, b)` jak w V8 (skalowanie przez maksimum i sumowanie Kahana).
    pub fn js_hypot(a: f64, b: f64) -> f64 {
        let mut max = 0.0_f64;
        let mut nan = false;
        let mut abs = [0.0_f64; 2];
        for (slot, value) in abs.iter_mut().zip([a, b]) {
            if value.is_nan() {
                nan = true;
            } else {
                *slot = value.abs();
                if *slot > max {
                    max = *slot;
                }
            }
        }
        if max == f64::INFINITY {
            return f64::INFINITY;
        }
        if nan {
            return f64::NAN;
        }
        if max == 0.0 {
            return 0.0;
        }
        let mut sum = 0.0_f64;
        let mut compensation = 0.0_f64;
        for value in abs {
            let n = value / max;
            let summand = n * n - compensation;
            let preliminary = sum + summand;
            compensation = (preliminary - sum) - summand;
            sum = preliminary;
        }
        sum.sqrt() * max
    }

    // ----- sin (fdlibm: k_sin, k_cos, rem_pio2; jak `ieee754::sin` w V8) -----

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

    fn kernel_cos(x: f64, y: f64) -> f64 {
        let ix = hi(x) & 0x7fff_ffff;
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
                from_hi(ix - 0x0020_0000)
            };
            let iz = 0.5 * z - qx;
            let a = 1.0 - qx;
            a - (iz - (z * r - x * y))
        }
    }

    fn kernel_sin(x: f64, y: f64, iy: i32) -> f64 {
        let ix = hi(x) & 0x7fff_ffff;
        if ix < 0x3e40_0000 && x as i32 == 0 {
            return x;
        }
        let z = x * x;
        let v = z * x;
        let r = KS2 + z * (KS3 + z * (KS4 + z * (KS5 + z * KS6)));
        if iy == 0 {
            x + v * (KS1 + z * r)
        } else {
            x - ((z * (0.5 * y - v * r) - y) - v * KS1)
        }
    }

    fn rem_pio2_medium(x: f64) -> (i32, f64, f64) {
        let hx = hi(x);
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
                let mut i = j - ((hi(y0) >> 20) & 0x7ff) as i32;
                if i > 16 {
                    let t2 = r;
                    w = fnn * PIO2_2;
                    r = t2 - w;
                    w = fnn * PIO2_2T - ((t2 - r) - w);
                    y0 = r - w;
                    i = j - ((hi(y0) >> 20) & 0x7ff) as i32;
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

    /// `Math.sin` jak w V8 (fdlibm). Dla `|x| > 2^19 * pi/2` (poza uzyciem generatora: kat z
    /// `atan2` lezy w `[-pi, pi]`) NIE jest odtwarzaniem V8 (brak redukcji Payne'a-Hanka): w buildzie
    /// z `debug_assertions` (testy, dev) wywolanie z takim argumentem PANIKUJE, zamiast po cichu
    /// zwrocic wynik `f64::sin` (libm); w release zwraca `f64::sin`. `NaN`/nieskonczonosc daja `NaN`.
    pub fn js_sin(x: f64) -> f64 {
        let ix = hi(x) & 0x7fff_ffff;
        if ix <= 0x3fe9_21fb {
            return kernel_sin(x, 0.0, 0);
        }
        if ix >= 0x7ff0_0000 {
            return f64::NAN;
        }
        if ix > 0x4139_21fb {
            if cfg!(debug_assertions) {
                panic!("js_sin({x:?}): |x| > 2^19*pi/2 poza zakresem odtworzenia V8 (brak Payne-Hanka)");
            }
            return x.sin();
        }
        let (n, y0, y1) = rem_pio2_medium(x);
        match n & 3 {
            0 => kernel_sin(y0, y1, 1),
            1 => kernel_cos(y0, y1),
            2 => -kernel_sin(y0, y1, 1),
            _ => -kernel_cos(y0, y1),
        }
    }

    // ----- atan / atan2 (fdlibm s_atan.c, e_atan2.c) -----

    const ATAN_HI: [f64; 4] = [
        bits(0x3FDD_AC67_0561_BB4F),
        bits(0x3FE9_21FB_5444_2D18),
        bits(0x3FEF_730B_D281_F69B),
        bits(0x3FF9_21FB_5444_2D18),
    ];
    const ATAN_LO: [f64; 4] = [
        bits(0x3C7A_2B7F_222F_65E2),
        bits(0x3C81_A626_3314_5C07),
        bits(0x3C70_0788_7AF0_CBBD),
        bits(0x3C91_A626_3314_5C07),
    ];
    const AT: [f64; 11] = [
        bits(0x3FD5_5555_5555_550D),
        bits(0xBFC9_9999_9998_EBC4),
        bits(0x3FC2_4924_9200_83FF),
        bits(0xBFBC_71C6_FE23_1671),
        bits(0x3FB7_45CD_C54C_206E),
        bits(0xBFB3_B0F2_AF74_9A6D),
        bits(0x3FB1_0D66_A0D0_3D51),
        bits(0xBFAD_DE2D_52DE_FD9A),
        bits(0x3FA9_7B4B_2476_0DEB),
        bits(0xBFA2_B444_2C6A_6C2F),
        bits(0x3F90_AD3A_E322_DA11),
    ];
    const PI_O_4: f64 = bits(0x3FE9_21FB_5444_2D18);
    const PI_O_2: f64 = bits(0x3FF9_21FB_5444_2D18);
    const PI: f64 = bits(0x4009_21FB_5444_2D18);
    const PI_LO: f64 = bits(0x3CA1_A626_3314_5C07);
    const TINY: f64 = 1.0e-300;
    const HUGE: f64 = 1.0e300;

    fn atan(x_in: f64) -> f64 {
        let mut x = x_in;
        let hx = hi(x);
        let ix = hx & 0x7fff_ffff;
        let negative = hx >> 31 != 0;
        let id: i32;
        if ix >= 0x4410_0000 {
            if ix > 0x7ff0_0000 || (ix == 0x7ff0_0000 && lo(x) != 0) {
                return x + x;
            }
            return if !negative {
                ATAN_HI[3] + ATAN_LO[3]
            } else {
                -ATAN_HI[3] - ATAN_LO[3]
            };
        }
        if ix < 0x3fdc_0000 {
            if ix < 0x3e40_0000 && HUGE + x > 1.0 {
                return x;
            }
            id = -1;
        } else {
            x = x.abs();
            if ix < 0x3ff3_0000 {
                if ix < 0x3fe6_0000 {
                    id = 0;
                    x = (2.0 * x - 1.0) / (2.0 + x);
                } else {
                    id = 1;
                    x = (x - 1.0) / (x + 1.0);
                }
            } else if ix < 0x4003_8000 {
                id = 2;
                x = (x - 1.5) / (1.0 + 1.5 * x);
            } else {
                id = 3;
                x = -1.0 / x;
            }
        }
        let z = x * x;
        let w = z * z;
        let s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
        let s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
        if id < 0 {
            x - x * (s1 + s2)
        } else {
            let idx = id as usize;
            let z2 = ATAN_HI[idx] - ((x * (s1 + s2) - ATAN_LO[idx]) - x);
            if negative {
                -z2
            } else {
                z2
            }
        }
    }

    /// `Math.atan2(y, x)` jak w V8 (fdlibm).
    pub fn js_atan2(y: f64, x: f64) -> f64 {
        let hx = hi(x) as i32;
        let lx = lo(x);
        let ix = hx & 0x7fff_ffff;
        let hy = hi(y) as i32;
        let ly = lo(y);
        let iy = hy & 0x7fff_ffff;
        if x.is_nan() || y.is_nan() {
            return x + y;
        }
        if (hx.wrapping_sub(0x3ff0_0000) as u32 | lx) == 0 {
            return atan(y);
        }
        let m = ((hy >> 31) & 1) | ((hx >> 30) & 2);
        if (iy as u32 | ly) == 0 {
            return match m {
                0 | 1 => y,
                2 => PI + TINY,
                _ => -PI - TINY,
            };
        }
        if (ix as u32 | lx) == 0 {
            return if hy < 0 {
                -PI_O_2 - TINY
            } else {
                PI_O_2 + TINY
            };
        }
        if ix == 0x7ff0_0000 {
            if iy == 0x7ff0_0000 {
                return match m {
                    0 => PI_O_4 + TINY,
                    1 => -PI_O_4 - TINY,
                    2 => 3.0 * PI_O_4 + TINY,
                    _ => -3.0 * PI_O_4 - TINY,
                };
            }
            return match m {
                0 => 0.0,
                1 => -0.0,
                2 => PI + TINY,
                _ => -PI - TINY,
            };
        }
        if iy == 0x7ff0_0000 {
            return if hy < 0 {
                -PI_O_2 - TINY
            } else {
                PI_O_2 + TINY
            };
        }
        let k = (iy - ix) >> 20;
        let mut m = m;
        let z = if k > 60 {
            m &= 1;
            PI_O_2 + 0.5 * PI_LO
        } else if hx < 0 && k < -60 {
            0.0
        } else {
            atan((y / x).abs())
        };
        match m {
            0 => z,
            1 => with_hi(z, hi(z) ^ 0x8000_0000),
            2 => PI - (z - PI_LO),
            _ => (z - PI_LO) - PI,
        }
    }

    // ----- pow (fdlibm e_pow.c; obejscia `Math.pow` wg ECMAScript) -----

    const DP_H: [f64; 2] = [0.0, bits(0x3FE2_B803_4000_0000)];
    const DP_L: [f64; 2] = [0.0, bits(0x3E4C_FDEB_43CF_D006)];
    const BP: [f64; 2] = [1.0, 1.5];
    const TWO53: f64 = 9_007_199_254_740_992.0;
    const L1: f64 = bits(0x3FE3_3333_3333_3303);
    const L2: f64 = bits(0x3FDB_6DB6_DB6F_ABFF);
    const L3: f64 = bits(0x3FD5_5555_518F_264D);
    const L4: f64 = bits(0x3FD1_7460_A91D_4101);
    const L5: f64 = bits(0x3FCD_864A_93C9_DB65);
    const L6: f64 = bits(0x3FCA_7E28_4A45_4EEF);
    const P1: f64 = bits(0x3FC5_5555_5555_553E);
    const P2: f64 = bits(0xBF66_C16C_16BE_BD93);
    const P3: f64 = bits(0x3F11_566A_AF25_DE2C);
    const P4: f64 = bits(0xBEBB_BD41_C5D2_6BF1);
    const P5: f64 = bits(0x3E66_3769_72BE_A4D0);
    const LG2: f64 = bits(0x3FE6_2E42_FEFA_39EF);
    const LG2_H: f64 = bits(0x3FE6_2E43_0000_0000);
    const LG2_L: f64 = bits(0xBE20_5C61_0CA8_6C39);
    const OVT: f64 = 8.008_566_259_537_294e-17;
    const CP: f64 = bits(0x3FEE_C709_DC3A_03FD);
    const CP_H: f64 = bits(0x3FEE_C709_E000_0000);
    const CP_L: f64 = bits(0xBE3E_2FE0_145B_01F5);
    const IVLN2: f64 = bits(0x3FF7_1547_652B_82FE);
    const IVLN2_H: f64 = bits(0x3FF7_1547_6000_0000);
    const IVLN2_L: f64 = bits(0x3E54_AE0B_F85D_DF44);

    /// `scalbn` (fdlibm s_scalbn.c) dla wyniku podnormalnego w `pow`.
    fn scalbn(x_in: f64, n_in: i32) -> f64 {
        let mut x = x_in;
        let mut n = n_in;
        let two54 = bits(0x4350_0000_0000_0000);
        let twom54 = bits(0x3C90_0000_0000_0000);
        let mut hx = hi(x) as i32;
        let lx = lo(x);
        let mut k = (hx & 0x7ff0_0000) >> 20;
        if k == 0 {
            if (lx | (hx & 0x7fff_ffff) as u32) == 0 {
                return x;
            }
            x *= two54;
            hx = hi(x) as i32;
            k = ((hx & 0x7ff0_0000) >> 20) - 54;
            if n < -50000 {
                return TINY * x;
            }
        }
        if k == 0x7ff {
            return x + x;
        }
        k += n;
        if k > 0x7fe {
            return HUGE * (HUGE).copysign(x);
        }
        if k > 0 {
            return with_hi(x, ((hx as u32) & 0x800f_ffff) | ((k as u32) << 20));
        }
        if k <= -54 {
            if n > 50000 {
                return HUGE * HUGE.copysign(x);
            }
            return TINY * TINY.copysign(x);
        }
        k += 54;
        n = 0;
        let _ = n;
        with_hi(x, ((hx as u32) & 0x800f_ffff) | ((k as u32) << 20)) * twom54
    }

    /// `Math.pow(x, y)`: reguly ECMAScript (NaN, `y == 0`, `|x| == 1` z nieskonczonym `y`),
    /// rdzen fdlibm `__ieee754_pow` jak w V8.
    pub fn js_pow(x: f64, y: f64) -> f64 {
        if y.is_nan() {
            return f64::NAN;
        }
        if y == 0.0 {
            return 1.0;
        }
        if y.is_infinite() && (x == 1.0 || x == -1.0) {
            return f64::NAN;
        }
        let hx = hi(x) as i32;
        let lx = lo(x);
        let hy = hi(y) as i32;
        let ly = lo(y);
        let mut ix = hx & 0x7fff_ffff;
        let iy = hy & 0x7fff_ffff;
        if x.is_nan() {
            return x + y;
        }
        let mut yisint = 0_i32;
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
                if ((ix - 0x3ff0_0000) as u32 | lx) == 0 {
                    return f64::NAN;
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
                    z = f64::NAN;
                } else if yisint == 1 {
                    z = -z;
                }
            }
            return z;
        }
        let neg = hx < 0;
        if neg && yisint == 0 {
            return f64::NAN;
        }
        let s = if neg && yisint == 1 { -1.0 } else { 1.0 };
        let t1;
        let t2;
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
            let w = (t * t) * (0.5 - t * (0.333_333_333_333_333_3 - t * 0.25));
            let u = IVLN2_H * t;
            let v = t * IVLN2_L - w * IVLN2;
            let t1v = with_lo(u + v, 0);
            t1 = t1v;
            t2 = v - (t1v - u);
        } else {
            let mut n = 0_i32;
            if ix < 0x0010_0000 {
                ax *= TWO53;
                n -= 53;
                ix = hi(ax) as i32;
            }
            n += (ix >> 20) - 0x3ff;
            let j = ix & 0x000f_ffff;
            ix = j | 0x3ff0_0000;
            let k: usize;
            if j <= 0x3988E {
                k = 0;
            } else if j < 0xBB67A {
                k = 1;
            } else {
                k = 0;
                n += 1;
                ix -= 0x0010_0000;
            }
            ax = with_hi(ax, ix as u32);
            let u = ax - BP[k];
            let v = 1.0 / (ax + BP[k]);
            let ss = u * v;
            let s_h = with_lo(ss, 0);
            let t_h0 =
                from_hi((((ix >> 1) | 0x2000_0000) + 0x0008_0000 + ((k as i32) << 18)) as u32);
            let t_l0 = ax - (t_h0 - BP[k]);
            let s_l = v * ((u - s_h * t_h0) - s_h * t_l0);
            let s2 = ss * ss;
            let mut r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
            r += s_l * (s_h + ss);
            let s2b = s_h * s_h;
            let t_h = with_lo(3.0 + s2b + r, 0);
            let t_l = r - ((t_h - 3.0) - s2b);
            let u2 = s_h * t_h;
            let v2 = s_l * t_h + t_l * ss;
            let p_h = with_lo(u2 + v2, 0);
            let p_l = v2 - (p_h - u2);
            let z_h = CP_H * p_h;
            let z_l = CP_L * p_h + p_l * CP + DP_L[k];
            let t = f64::from(n);
            let t1v = with_lo(((z_h + z_l) + DP_H[k]) + t, 0);
            t1 = t1v;
            t2 = z_l - (((t1v - t) - DP_H[k]) - z_h);
        }
        let y1 = with_lo(y, 0);
        let mut p_l = (y - y1) * t1 + y * t2;
        let mut p_h = y1 * t1;
        let mut z = p_l + p_h;
        let j = hi(z) as i32;
        let i = lo(z);
        if j >= 0x4090_0000 {
            if ((j - 0x4090_0000) as u32 | i) != 0 || p_l + OVT > z - p_h {
                return s * HUGE * HUGE;
            }
        } else if (j & 0x7fff_ffff) >= 0x4090_cc00
            && (((j as u32).wrapping_sub(0xc090_cc00) | i) != 0 || p_l <= z - p_h)
        {
            return s * TINY * TINY;
        }
        let ii = j & 0x7fff_ffff;
        let mut k = (ii >> 20) - 0x3ff;
        let mut n = 0_i32;
        if ii > 0x3fe0_0000 {
            n = j + (0x0010_0000 >> (k + 1));
            k = ((n & 0x7fff_ffff) >> 20) - 0x3ff;
            let t = from_hi((n & !(0x000f_ffff >> k)) as u32);
            n = ((n & 0x000f_ffff) | 0x0010_0000) >> (20 - k);
            if j < 0 {
                n = -n;
            }
            p_h -= t;
        }
        let t = with_lo(p_l + p_h, 0);
        let u = t * LG2_H;
        let v = (p_l - (t - p_h)) * LG2 + t * LG2_L;
        z = u + v;
        let w = v - (z - u);
        let t = z * z;
        let t1b = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
        let r = (z * t1b) / ((t1b - 2.0) - (w + z * w));
        z = 1.0 - (r - z);
        let jz = (hi(z) as i32).wrapping_add(n << 20);
        p_l = 0.0;
        let _ = p_l;
        if (jz >> 20) <= 0 {
            z = scalbn(z, n);
        } else {
            z = with_hi(z, jz as u32);
        }
        s * z
    }
}

use v8math::{js_atan2, js_hypot, js_max, js_min, js_pow, js_sin};

fn max3(a: f64, b: f64, c: f64) -> f64 {
    js_max(js_max(a, b), c)
}

// ---------------------------------------------------------------------------
// Zaleznosci z `gen-helpers.ts` poza zakresem M03 (wlasciciel M04), lokalne kopie 1:1.
// ---------------------------------------------------------------------------

/// Web `MAP_BORDER_OCEAN_HEXES` (`gen-helpers.ts`:1177).
pub fn map_border_ocean_hexes() -> f64 {
    f64::from(mapgen_masks().brzeg.ocean_heksy)
}

/// Web `MAP_MARGIN_LAND_ZONE_HEXES` (`gen-helpers.ts`:1180).
pub fn map_margin_land_zone_hexes() -> f64 {
    f64::from(mapgen_masks().brzeg.strefa_marginesu_heksy)
}

/// Web `mapBorderWidth(_width, _height)` (`gen-helpers.ts`:1183): twardy pas oceanu.
pub fn map_border_width(_width: u32, _height: u32) -> f64 {
    map_border_ocean_hexes()
}

/// Web `hexBorderDistance` (`gen-helpers.ts`:1334).
pub fn hex_border_distance(q: i64, r: i64, width: u32, height: u32) -> f64 {
    let w = i64::from(width);
    let h = i64::from(height);
    q.min(r).min(w - 1 - q).min(h - 1 - r) as f64
}

/// Web `marginLandCapForBorderDistance` (`gen-helpers.ts`:1191).
pub fn margin_land_cap_for_border_distance(d: f64) -> Option<f64> {
    let p = &mapgen_masks().brzeg;
    if d < map_border_ocean_hexes() {
        return Some(0.0);
    }
    if d <= map_margin_land_zone_hexes() {
        return Some(p.krok_limitu * (d - 1.0));
    }
    None
}

/// Web `landMaskBorderFade` (`gen-helpers.ts`:1294).
pub fn land_mask_border_fade(q: i64, r: i64, width: u32, height: u32) -> f64 {
    let d = hex_border_distance(q, r, width, height);
    match margin_land_cap_for_border_distance(d) {
        None => 1.0,
        Some(cap) if cap <= 0.0 => 0.0,
        Some(cap) => js_min(1.0, cap / mapgen_masks().brzeg.dzielnik_zaniku),
    }
}

/// Web `mapEdgeRectFade` (`gen-helpers.ts`:1313).
pub fn map_edge_rect_fade(q: i64, r: i64, width: u32, height: u32) -> f64 {
    let p = &mapgen_masks().brzeg;
    let b = map_border_width(width, height);
    let w1 = js_max(1.0, f64::from(width) - 1.0);
    let h1 = js_max(1.0, f64::from(height) - 1.0);
    let nq = q as f64 / w1;
    let nr = r as f64 / h1;
    let margin_q = b / w1;
    let margin_r = b / h1;
    js_min(
        js_min(
            js_min(nq, 1.0 - nq) / js_max(margin_q, p.min_margines),
            js_min(nr, 1.0 - nr) / js_max(margin_r, p.min_margines),
        ),
        1.0,
    )
}

// ---------------------------------------------------------------------------
// gen-helpers.ts:252-824
// ---------------------------------------------------------------------------

/// Web `ShapeParams` (`gen-helpers.ts`:253).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ShapeParams {
    pub noise_scale: f64,
    pub mountain_scale: f64,
    pub forest_scale: f64,
    pub desert_scale: f64,
    pub off_mtn_x: f64,
    pub off_mtn_y: f64,
    pub off_for_x: f64,
    pub off_for_y: f64,
    pub off_des_x: f64,
    pub off_des_y: f64,
}

/// Web `defaultShapeParams(rand)` (`gen-helpers.ts`:268): kolejnosc wywolan `rand()` ma znaczenie.
pub fn default_shape_params(mut rand: impl FnMut() -> f64) -> ShapeParams {
    let p = &mapgen_masks().ksztalt;
    ShapeParams {
        noise_scale: p.skala_szumu,
        mountain_scale: p.skala_gor,
        forest_scale: p.skala_lasu,
        desert_scale: p.skala_pustyni,
        off_mtn_x: rand() * p.zakres_przesuniec,
        off_mtn_y: rand() * p.zakres_przesuniec,
        off_for_x: rand() * p.zakres_przesuniec,
        off_for_y: rand() * p.zakres_przesuniec,
        off_des_x: rand() * p.zakres_przesuniec,
        off_des_y: rand() * p.zakres_przesuniec,
    }
}

/// Web `landMaskAt` (`gen-helpers.ts`:284): eliptyczna maska ladu, 1 w centrum, 0 przy krawedziach.
pub fn land_mask_at(q: i64, r: i64, width: u32, height: u32) -> f64 {
    let p = &mapgen_masks().eliptyczna;
    let cx = (f64::from(width) - 1.0) / 2.0;
    let cy = (f64::from(height) - 1.0) / 2.0;
    let dx = (q as f64 - cx) / (cx + p.dodatek_polowki);
    let dy = (r as f64 - cy) / (cy + p.dodatek_polowki);
    let dist = (dx * dx + dy * dy).sqrt();
    js_max(0.0, 1.0 - js_pow(dist / p.promien, p.wykladnik))
}

/// Web `ContinentCenter` (`gen-helpers.ts`:297).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ContinentCenter {
    pub nq: f64,
    pub nr: f64,
    pub radius: f64,
}

/// Web `ContinentCenterOpts` (`gen-helpers.ts`:303); `None` = pole pominiete (`undefined`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct ContinentCenterOpts {
    pub radius_min: Option<f64>,
    pub radius_max: Option<f64>,
    pub min_center_dist: Option<f64>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    /// `anchorCenter === false` wylacza kotwice; `None`/`Some(true)` ja wlacza.
    pub anchor_center: Option<bool>,
    pub ring_radius_min: Option<f64>,
    pub ring_radius_max: Option<f64>,
}

/// Web `KONTYNENTY_ZONE_COUNT` (`gen-helpers.ts`:318).
pub fn kontynenty_zone_count() -> u32 {
    mapgen_masks().kontynenty.liczba_stref
}

/// Web `continentCenterCount` (`gen-helpers.ts`:324).
pub fn continent_center_count(width: u32, height: u32, typ: WorldType) -> u32 {
    let p = &mapgen_masks().kontynenty;
    if typ == WorldType::Continents {
        return p.liczba_stref;
    }
    let area = f64::from(width) * f64::from(height);
    if area < p.obszar_male {
        p.liczba_male
    } else if area < p.obszar_srednie {
        p.liczba_srednie
    } else {
        p.liczba_duze
    }
}

fn clamp01_with(border_margin: f64, v: f64) -> f64 {
    js_max(border_margin, js_min(1.0 - border_margin, v))
}

/// Web `buildContinentCenters` (`gen-helpers.ts`:334). `rand` jest wolane w kolejnosci weba.
pub fn build_continent_centers(
    mut rand: impl FnMut() -> f64,
    n: i64,
    opts: Option<&ContinentCenterOpts>,
) -> Vec<ContinentCenter> {
    let p = &mapgen_masks().centra;
    let o = opts.copied().unwrap_or_default();
    let radius_min = o.radius_min.unwrap_or(p.promien_min);
    let radius_max = o.radius_max.unwrap_or(p.promien_max);
    let min_dist = o.min_center_dist.unwrap_or(p.min_odleglosc);
    let w = o.width.unwrap_or(p.domyslna_szerokosc);
    let h = o.height.unwrap_or(p.domyslna_wysokosc);
    let border = map_border_ocean_hexes();
    let border_margin = max3(
        border / js_max(1.0, w - 1.0),
        border / js_max(1.0, h - 1.0),
        p.margines_min,
    );
    let mut centers: Vec<ContinentCenter> = Vec::new();

    let push_center = |centers: &mut Vec<ContinentCenter>,
                       rand: &mut dyn FnMut() -> f64,
                       nq: f64,
                       nr: f64,
                       radius: Option<f64>|
     -> bool {
        let cnq = clamp01_with(border_margin, nq);
        let cnr = clamp01_with(border_margin, nr);
        if min_dist > 0.0 {
            for c in centers.iter() {
                if js_hypot(cnq - c.nq, cnr - c.nr) < min_dist {
                    return false;
                }
            }
        }
        let radius = match radius {
            Some(value) => value,
            None => radius_min + rand() * (radius_max - radius_min),
        };
        centers.push(ContinentCenter {
            nq: cnq,
            nr: cnr,
            radius,
        });
        true
    };

    if o.anchor_center != Some(false) && n >= 1 {
        push_center(
            &mut centers,
            &mut rand,
            HALF,
            HALF,
            Some(radius_min + (radius_max - radius_min) * p.kotwica_udzial_promienia),
        );
    }

    let ring_r_min = o.ring_radius_min.unwrap_or(p.pierscien_min);
    let ring_r_max = o.ring_radius_max.unwrap_or(p.pierscien_max);
    let ring_slots = n - centers.len() as i64;
    for i in 0..ring_slots.max(0) {
        let mut placed = false;
        let mut attempt = 0;
        while attempt < p.proby && !placed {
            let angle = (2.0 * std::f64::consts::PI * i as f64) / js_max(1.0, ring_slots as f64)
                + (rand() - HALF) * p.jitter_kata;
            let ring_r = ring_r_min + rand() * (ring_r_max - ring_r_min);
            let nq = HALF + js_cos(angle) * ring_r;
            let nr = HALF + js_sin(angle) * ring_r;
            if push_center(&mut centers, &mut rand, nq, nr, None) {
                placed = true;
            }
            attempt += 1;
        }
        if !placed {
            let nq = border_margin + rand() * (1.0 - 2.0 * border_margin);
            let nr = border_margin + rand() * (1.0 - 2.0 * border_margin);
            push_center(&mut centers, &mut rand, nq, nr, None);
        }
    }
    centers
}

/// Web `buildFiveZoneContinentCenters` (`gen-helpers.ts`:399): 0=srodek, 1=NW, 2=NE, 3=SE, 4=SW.
/// Kolejnosc `rand()` jak w literale tablicy weba: dla kazdego centrum `jitter` (nq), `jitter`
/// (nr), potem `pickR`.
pub fn build_five_zone_continent_centers(
    mut rand: impl FnMut() -> f64,
    width: u32,
    height: u32,
    radius_min: f64,
    radius_max: f64,
) -> Vec<ContinentCenter> {
    let p = &mapgen_masks().kontynenty;
    let border = map_border_width(width, height);
    let border_margin = max3(
        border / js_max(1.0, f64::from(width) - 1.0),
        border / js_max(1.0, f64::from(height) - 1.0),
        p.piecio_margines_min,
    );
    let inset = border_margin + p.piecio_odsuniecie;
    let anchors: [(f64, f64); 5] = [
        (HALF, HALF),
        (inset, inset),
        (1.0 - inset, inset),
        (1.0 - inset, 1.0 - inset),
        (inset, 1.0 - inset),
    ];
    let mut centers = Vec::with_capacity(anchors.len());
    for (anchor_q, anchor_r) in anchors {
        let nq = clamp01_with(border_margin, anchor_q + (rand() - HALF) * p.piecio_jitter);
        let nr = clamp01_with(border_margin, anchor_r + (rand() - HALF) * p.piecio_jitter);
        let radius = radius_min + rand() * (radius_max - radius_min);
        centers.push(ContinentCenter { nq, nr, radius });
    }
    centers
}

/// Web `nearestContinentZoneIndex` (`gen-helpers.ts`:426): najblizsze centrum (pierwsze przy remisie).
pub fn nearest_continent_zone_index(nq: f64, nr: f64, centers: &[ContinentCenter]) -> usize {
    let mut best_i = 0;
    let mut best_d = f64::INFINITY;
    for (i, c) in centers.iter().enumerate() {
        let d = js_hypot(nq - c.nq, nr - c.nr);
        if d < best_d {
            best_d = d;
            best_i = i;
        }
    }
    best_i
}

/// Web `secondNearestContinentDist` (`gen-helpers.ts`:441, prywatna): druga najmniejsza odleglosc
/// albo `Infinity`.
pub fn second_nearest_continent_dist(nq: f64, nr: f64, centers: &[ContinentCenter]) -> f64 {
    let mut dists: Vec<f64> = centers
        .iter()
        .map(|c| js_hypot(nq - c.nq, nr - c.nr))
        .collect();
    dists.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    dists.get(1).copied().unwrap_or(f64::INFINITY)
}

fn noise_warp(perm: &PermTable, q: i64, r: i64, noise_scale: f64, layer: &MasksNoiseWarp) -> f64 {
    fbm(
        perm,
        q as f64 * noise_scale * layer.mnoznik_skali + layer.przesuniecie,
        r as f64 * noise_scale * layer.mnoznik_skali + layer.przesuniecie,
        layer.oktawy,
    ) * layer.amplituda
}

fn angle_noise(perm: &PermTable, angle: f64, zone_idx: usize, layer: &MasksAngleNoise) -> f64 {
    fbm(
        perm,
        js_cos(angle) * layer.mnoznik_kata + zone_idx as f64 * layer.mnoznik_strefy,
        js_sin(angle) * layer.mnoznik_kata + layer.przesuniecie,
        layer.oktawy,
    ) * layer.amplituda
}

/// Web `landMaskKontynenty` (`gen-helpers.ts`:460): 5 stref Voronoi, lad tylko w swojej strefie.
/// `centers` nie moze byc puste (web: `centers[zoneIdx]!`).
pub fn land_mask_kontynenty(
    q: i64,
    r: i64,
    width: u32,
    height: u32,
    centers: &[ContinentCenter],
    perm: &PermTable,
    noise_scale: f64,
) -> f64 {
    let p = &mapgen_masks().kontynenty;
    let nq = q as f64 / (f64::from(width) - 1.0);
    let nr = r as f64 / (f64::from(height) - 1.0);

    let border_fade = land_mask_border_fade(q, r, width, height);
    let edge_rect = map_edge_rect_fade(q, r, width, height);
    if border_fade <= 0.0 || edge_rect <= 0.0 {
        return 0.0;
    }

    let zone_idx = nearest_continent_zone_index(nq, nr, centers);
    let c = centers[zone_idx];
    let dist_c = js_hypot(nq - c.nq, nr - c.nr);
    let dist2 = second_nearest_continent_dist(nq, nr, centers);

    if dist2 - dist_c < p.ciesnina {
        return 0.0;
    }

    let radial = js_max(0.0, 1.0 - js_pow(dist_c / c.radius, p.wykladnik_radialny));
    let warp_coarse = noise_warp(perm, q, r, noise_scale, &p.szum_gruby);
    let warp_fine = noise_warp(perm, q, r, noise_scale, &p.szum_drobny);
    let angle = js_atan2(nr - c.nr, nq - c.nq);
    let angle_n = angle_noise(perm, angle, zone_idx, &p.szum_kata);
    js_min(
        1.0,
        js_max(
            0.0,
            (radial + warp_coarse + warp_fine + angle_n - p.odjemnik) * border_fade * edge_rect,
        ),
    )
}

/// Web `mapIsotropicFromCenter` (`gen-helpers.ts`:499): wspolrzedne izotropowe od srodka mapy.
pub fn map_isotropic_from_center(q: i64, r: i64, width: u32, height: u32) -> (f64, f64) {
    let max_dim = max3(1.0, f64::from(width) - 1.0, f64::from(height) - 1.0);
    (
        (q as f64 - (f64::from(width) - 1.0) / 2.0) / max_dim,
        (r as f64 - (f64::from(height) - 1.0) / 2.0) / max_dim,
    )
}

/// Web `normToIsotropic` (`gen-helpers.ts`:512, prywatna): norma 0-1 na uklad izotropowy.
pub fn norm_to_isotropic(nq: f64, nr: f64, width: u32, height: u32) -> (f64, f64) {
    let max_dim = max3(1.0, f64::from(width) - 1.0, f64::from(height) - 1.0);
    (
        (nq - HALF) * (f64::from(width) - 1.0) / max_dim,
        (nr - HALF) * (f64::from(height) - 1.0) / max_dim,
    )
}

/// Web `PangeaLandLayoutParams` (`gen-helpers.ts`:527).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PangeaLandLayoutParams {
    pub n_blobs: u32,
    pub blob_radius_min: f64,
    pub blob_radius_max: f64,
    pub ring_r_min: f64,
    pub ring_r_max: f64,
    pub cluster_radius: f64,
    pub threshold: f64,
    pub merge_sum: f64,
    pub merge_max: f64,
    pub global_warp: f64,
    pub valley: f64,
    pub fill_min_score: f64,
}

/// Web `pangeaLandT` (`gen-helpers.ts`:542, prywatna): interpolacja 0-1 po `landFraction`.
pub fn pangea_land_t(land_fraction: f64) -> f64 {
    let p: &MasksPangeaParams = &mapgen_masks().pangea;
    js_max(0.0, js_min(1.0, (land_fraction - p.t_dolny) / p.t_zakres))
}

/// Web `pangeaLandLayoutParams` (`gen-helpers.ts`:553): uklad blobow zalezny od % ladu i rozmiaru.
pub fn pangea_land_layout_params(
    land_fraction: f64,
    width: u32,
    height: u32,
) -> PangeaLandLayoutParams {
    let p = &mapgen_masks().pangea;
    let t = pangea_land_t(land_fraction);
    let map_scale = ((f64::from(width) * f64::from(height)) / p.powierzchnia_odniesienia).sqrt();
    let size_boost = js_min(p.boost_max, js_max(0.0, (map_scale - 1.0) * p.boost_wsp));
    let high_land = js_max(0.0, (t - p.wysoki_prog) / p.wysoki_zakres);
    let low_land = js_max(0.0, 1.0 - t / p.niski_zakres);
    let ring_pull = p.sciagniecie.baza
        + size_boost * p.sciagniecie.rozmiar
        + high_land * p.sciagniecie.wysoki
        + low_land * p.sciagniecie.niski;

    PangeaLandLayoutParams {
        n_blobs: if t < p.prog_male {
            p.liczba_male
        } else if t < p.prog_srednie {
            p.liczba_srednie
        } else {
            p.liczba_duze
        },
        blob_radius_min: p.promien_blobu_min.baza
            + t * p.promien_blobu_min.t
            + size_boost * p.promien_blobu_min.rozmiar,
        blob_radius_max: p.promien_blobu_max.baza
            + t * p.promien_blobu_max.t
            + size_boost * p.promien_blobu_max.rozmiar,
        ring_r_min: js_max(
            p.pierscien_min.dolna_granica,
            p.pierscien_min.baza + t * p.pierscien_min.t + size_boost * p.pierscien_min.rozmiar
                - ring_pull,
        ),
        ring_r_max: js_max(
            p.pierscien_max.dolna_granica,
            p.pierscien_max.baza + t * p.pierscien_max.t + size_boost * p.pierscien_max.rozmiar
                - ring_pull * p.pierscien_max.sciagniecie,
        ),
        cluster_radius: p.promien_klastra.baza + t * p.promien_klastra.t + size_boost,
        threshold: p.prog.baza - t * p.prog.t,
        merge_sum: p.scalanie_suma.baza
            + t * p.scalanie_suma.t
            + size_boost * p.scalanie_suma.rozmiar
            + high_land * p.scalanie_suma.wysoki,
        merge_max: p.scalanie_max.baza
            + t * p.scalanie_max.t
            + size_boost * p.scalanie_max.rozmiar
            + high_land * p.scalanie_max.wysoki,
        global_warp: p.warp_globalny_wsp.baza + t * p.warp_globalny_wsp.t,
        valley: js_max(
            p.dolina_wsp.dolna_granica,
            p.dolina_wsp.baza + t * p.dolina_wsp.t - low_land * p.dolina_wsp.niski,
        ),
        fill_min_score: p.wypelnienie_min.baza + t * p.wypelnienie_min.t,
    }
}

/// Web `buildPangeaBlobCenters` (`gen-helpers.ts`:584): centra blobow Pangea w ciasnej chmurze.
pub fn build_pangea_blob_centers(
    mut rand: impl FnMut() -> f64,
    width: u32,
    height: u32,
    land_fraction: f64,
) -> Vec<ContinentCenter> {
    let p = &mapgen_masks().pangea.centra;
    let layout = pangea_land_layout_params(land_fraction, width, height);
    let border = map_border_width(width, height);
    let border_margin = max3(
        border / js_max(1.0, f64::from(width) - 1.0),
        border / js_max(1.0, f64::from(height) - 1.0),
        p.margines_min,
    );
    let max_dim = max3(1.0, f64::from(width) - 1.0, f64::from(height) - 1.0);

    let n_blobs = layout.n_blobs;
    let mut centers = Vec::new();
    let nq = clamp01_with(border_margin, HALF + (rand() - HALF) * p.jitter);
    let nr = clamp01_with(border_margin, HALF + (rand() - HALF) * p.jitter);
    let radius =
        layout.blob_radius_min + rand() * (layout.blob_radius_max - layout.blob_radius_min);
    centers.push(ContinentCenter { nq, nr, radius });

    let ring_slots = i64::from(n_blobs) - 1;
    for i in 0..ring_slots.max(0) {
        let angle = (2.0 * std::f64::consts::PI * i as f64) / ring_slots as f64
            + (rand() - HALF) * p.jitter_kata;
        let ring_r = layout.ring_r_min + rand() * (layout.ring_r_max - layout.ring_r_min);
        let ix = js_cos(angle) * ring_r;
        let iy = js_sin(angle) * ring_r;
        let nq = clamp01_with(
            border_margin,
            HALF + ix * max_dim / (f64::from(width) - 1.0) + (rand() - HALF) * p.jitter,
        );
        let nr = clamp01_with(
            border_margin,
            HALF + iy * max_dim / (f64::from(height) - 1.0) + (rand() - HALF) * p.jitter,
        );
        let span = layout.blob_radius_max - layout.blob_radius_min;
        let radius = layout.blob_radius_min * p.pierscien_promien_mnoznik
            + rand() * span * p.pierscien_rozrzut;
        centers.push(ContinentCenter { nq, nr, radius });
    }
    centers
}

/// Web `pangeaBlobScore` (`gen-helpers.ts`:629, prywatna): wynik jednego blobu (jak kontynenty,
/// bez Voronoi).
#[allow(clippy::too_many_arguments)]
pub fn pangea_blob_score(
    q: i64,
    r: i64,
    width: u32,
    height: u32,
    c: &ContinentCenter,
    zone_idx: usize,
    perm: &PermTable,
    noise_scale: f64,
) -> f64 {
    let p = &mapgen_masks().pangea.blob;
    let (px, py) = map_isotropic_from_center(q, r, width, height);
    let (cx, cy) = norm_to_isotropic(c.nq, c.nr, width, height);
    let dist_c = js_hypot(px - cx, py - cy);
    let radial = js_max(0.0, 1.0 - js_pow(dist_c / c.radius, p.wykladnik_radialny));
    let zone = zone_idx as f64;
    let coarse = &p.szum_gruby;
    let warp_coarse = fbm(
        perm,
        q as f64 * noise_scale * coarse.mnoznik_skali
            + coarse.przesuniecie
            + zone * p.przesuniecie_strefy_gruby,
        r as f64 * noise_scale * coarse.mnoznik_skali + coarse.przesuniecie,
        coarse.oktawy,
    ) * coarse.amplituda;
    let fine = &p.szum_drobny;
    let warp_fine = fbm(
        perm,
        q as f64 * noise_scale * fine.mnoznik_skali
            + fine.przesuniecie
            + zone * p.przesuniecie_strefy_drobny,
        r as f64 * noise_scale * fine.mnoznik_skali + fine.przesuniecie,
        fine.oktawy,
    ) * fine.amplituda;
    let angle = js_atan2(py - cy, px - cx);
    let angle_n = angle_noise(perm, angle, zone_idx, &p.szum_kata);
    radial + warp_coarse + warp_fine + angle_n - p.odjemnik
}

/// Web `landMaskPangea` (`gen-helpers.ts`:656): `max()` blobow zamiast Voronoi, jedna masa.
#[allow(clippy::too_many_arguments)]
pub fn land_mask_pangea(
    q: i64,
    r: i64,
    width: u32,
    height: u32,
    centers: &[ContinentCenter],
    perm: &PermTable,
    noise_scale: f64,
    land_fraction: f64,
) -> f64 {
    let p = &mapgen_masks().pangea.maska;
    let layout = pangea_land_layout_params(land_fraction, width, height);
    let border_fade = land_mask_border_fade(q, r, width, height);
    if border_fade <= 0.0 {
        return 0.0;
    }

    let mut blob_max = 0.0_f64;
    let mut blob_sum = 0.0_f64;
    for (zone_idx, c) in centers.iter().enumerate() {
        let s = pangea_blob_score(q, r, width, height, c, zone_idx, perm, noise_scale);
        blob_max = js_max(blob_max, s);
        blob_sum += js_max(0.0, s);
    }
    let merged = js_min(
        1.0,
        blob_sum * layout.merge_sum + blob_max * layout.merge_max,
    );

    let (ix, iy) = map_isotropic_from_center(q, r, width, height);
    let cluster_dist = js_hypot(ix, iy);
    let cluster_fade = js_max(
        0.0,
        1.0 - js_pow(cluster_dist / layout.cluster_radius, p.wykladnik_klastra),
    );
    let valley = fbm(
        perm,
        q as f64 * noise_scale * p.dolina.mnoznik_skali + p.dolina.przesuniecie,
        r as f64 * noise_scale * p.dolina.mnoznik_skali + p.dolina.przesuniecie,
        p.dolina.oktawy,
    ) * layout.valley;
    let global_warp = fbm(
        perm,
        q as f64 * noise_scale * p.warp_globalny.mnoznik_skali + p.warp_globalny.przesuniecie,
        r as f64 * noise_scale * p.warp_globalny.mnoznik_skali + p.warp_globalny.przesuniecie,
        p.warp_globalny.oktawy,
    ) * layout.global_warp;
    js_min(
        1.0,
        js_max(
            0.0,
            (merged + global_warp - valley - layout.threshold) * cluster_fade * border_fade,
        ),
    )
}

/// Web `ISLAND_GRID_DIVISIONS` (`gen-helpers.ts`:688).
pub fn island_grid_divisions() -> u32 {
    mapgen_masks().wyspy.siatka
}

/// Web `buildSixteenGridIslandCenters` (`gen-helpers.ts`:693): 16 centrow wysp (siatka 4x4).
pub fn build_sixteen_grid_island_centers(
    mut rand: impl FnMut() -> f64,
    width: u32,
    height: u32,
) -> Vec<ContinentCenter> {
    let p = &mapgen_masks().wyspy;
    let grid = island_grid_divisions();
    let border = map_border_width(width, height);
    let border_margin = max3(
        border / js_max(1.0, f64::from(width) - 1.0),
        border / js_max(1.0, f64::from(height) - 1.0),
        p.margines_min,
    );

    let cell_frac = 1.0 / f64::from(grid);
    let map_scale = ((f64::from(width) * f64::from(height)) / p.powierzchnia_odniesienia).sqrt();
    let size_mul = js_min(
        p.rozmiar.max,
        js_max(p.rozmiar.min, p.rozmiar.baza + map_scale * p.rozmiar.wsp),
    );
    let base_r = cell_frac * p.promien_komorki * size_mul;

    let mut centers = Vec::new();
    for row in 0..grid {
        for col in 0..grid {
            let nq = clamp01_with(
                border_margin,
                (f64::from(col) + HALF) * cell_frac + (rand() - HALF) * cell_frac * p.jitter,
            );
            let nr = clamp01_with(
                border_margin,
                (f64::from(row) + HALF) * cell_frac + (rand() - HALF) * cell_frac * p.jitter,
            );
            let radius = base_r * (p.promien_zakres.baza + rand() * p.promien_zakres.rozrzut);
            centers.push(ContinentCenter { nq, nr, radius });
        }
    }
    centers
}

fn island_cell(coord: i64, size: u32, grid: u32) -> i64 {
    let scaled = (coord as f64 * f64::from(grid)) / js_max(1.0, f64::from(size));
    js_min(f64::from(grid) - 1.0, scaled.floor()) as i64
}

/// Web `islandGridCellIndex` (`gen-helpers.ts`:727): indeks komorki siatki (twardy podzial).
pub fn island_grid_cell_index(q: i64, r: i64, width: u32, height: u32) -> i64 {
    let grid = island_grid_divisions();
    let col = island_cell(q, width, grid);
    let row = island_cell(r, height, grid);
    row * i64::from(grid) + col
}

/// Web `assignIslandGridIndices` (`gen-helpers.ts`:735): `Map<hexKey, indeks>` w kolejnosci
/// wstawiania weba (`r` zewnetrzna petla, `q` wewnetrzna).
pub fn assign_island_grid_indices(width: u32, height: u32) -> Vec<(String, i64)> {
    let mut map = Vec::with_capacity(width as usize * height as usize);
    for r in 0..i64::from(height) {
        for q in 0..i64::from(width) {
            map.push((hex_key(q, r), island_grid_cell_index(q, r, width, height)));
        }
    }
    map
}

/// Web `landMaskWyspy` (`gen-helpers.ts`:753): twarda siatka 4x4, wyspa w komorce, morze na liniach.
/// `centers` musi miec `siatka^2` elementow (web: `centers[zoneIdx]!`).
pub fn land_mask_wyspy(
    q: i64,
    r: i64,
    width: u32,
    height: u32,
    centers: &[ContinentCenter],
    perm: &PermTable,
    noise_scale: f64,
) -> f64 {
    let p = &mapgen_masks().wyspy;
    let grid = p.siatka;
    let nq = q as f64 / js_max(1.0, f64::from(width) - 1.0);
    let nr = r as f64 / js_max(1.0, f64::from(height) - 1.0);

    let border_fade = land_mask_border_fade(q, r, width, height);
    let edge_rect = map_edge_rect_fade(q, r, width, height);
    if border_fade <= 0.0 || edge_rect <= 0.0 {
        return 0.0;
    }

    let col = island_cell(q, width, grid);
    let row = island_cell(r, height, grid);
    let zone_idx = (row * i64::from(grid) + col) as usize;
    let c = centers[zone_idx];

    let cell_w = 1.0 / f64::from(grid);
    let cell_left = col as f64 * cell_w;
    let cell_right = (col + 1) as f64 * cell_w;
    let cell_top = row as f64 * cell_w;
    let cell_bottom = (row + 1) as f64 * cell_w;
    let dist_to_edge = js_min(
        js_min(js_min(nq - cell_left, cell_right - nq), nr - cell_top),
        cell_bottom - nr,
    );
    let cell_lane_fade = js_min(1.0, js_max(0.0, dist_to_edge / p.pas_morski));
    if cell_lane_fade <= 0.0 {
        return 0.0;
    }

    let dist_c = js_hypot(nq - c.nq, nr - c.nr);
    let radial = js_max(0.0, 1.0 - js_pow(dist_c / c.radius, p.wykladnik_radialny));
    let warp_coarse = noise_warp(perm, q, r, noise_scale, &p.szum_gruby);
    let warp_fine = noise_warp(perm, q, r, noise_scale, &p.szum_drobny);
    let angle = js_atan2(nr - c.nr, nq - c.nq);
    let angle_n = angle_noise(perm, angle, zone_idx, &p.szum_kata);
    js_min(
        1.0,
        js_max(
            0.0,
            (radial + warp_coarse + warp_fine + angle_n - p.odjemnik)
                * border_fade
                * edge_rect
                * cell_lane_fade,
        ),
    )
}

/// Web `ZIEMIA_LAND_CENTERS` (`gen-helpers.ts`:801): stale centra mas ladowych presetu Ziemia.
pub fn ziemia_land_centers() -> Vec<ContinentCenter> {
    mapgen_masks()
        .ziemia
        .centra
        .iter()
        .map(|row| ContinentCenter {
            nq: row.nq,
            nr: row.nr,
            radius: row.radius,
        })
        .collect()
}

/// Web `landMaskZiemia` (`gen-helpers.ts`:812): twardy szablon kontynentow + lekki szum brzegu.
pub fn land_mask_ziemia(
    q: i64,
    r: i64,
    width: u32,
    height: u32,
    perm: &PermTable,
    noise_scale: f64,
) -> f64 {
    let p = &mapgen_masks().ziemia;
    let template = earth_template_land_at(q, r, width, height);
    if template <= 0.0 {
        return 0.0;
    }
    let coast_noise = noise_warp(perm, q, r, noise_scale, &p.szum_brzegu);
    js_min(1.0, js_max(0.0, p.poziom_ladu + coast_noise - p.odjemnik))
}
