//! P6.M01 — rdzen generatora mapy: PRNG, permutacja, value noise, fBm, geometria heksow,
//! klimat (pasy szerokosci), maska Ziemi. Temat wlasciciel: R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1.
//! Port 1:1 z weba (pin `edb8fb56`):
//! `gen-helpers.ts`:33-232 i :237-251, `earth-land-mask.ts` (funkcje z zakresu M01 oraz
//! pomocnicze prywatne funkcje, od ktorych zalezy ich wynik).
//!
//! Zgodnosc z webem jest bitowa (f64) i zamrozona wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m01_vectors/web-vectors.json`, testy `tests/p6_m01_*.rs`). Wartosci kalibracyjne
//! leza w `data/derived/mapgen-core-params.json` i `data/derived/earth-land-mask.json`
//! (parser: `data/derived.rs`), nie w kodzie.
//!
//! Pomocnicze funkcje maski Ziemi, ktore plan P6-25 przypisuje tez do M03 (`earthPlayableInner*`,
//! `earthLandMapRows`, `bitAt`, `earthPolarOceanRows`), sa tu konieczne, bo `earthHexToTemplateNorm`
//! i `earthTemplateLandAt` (M01) od nich zaleza; M03 powinien z nich korzystac, nie dublowac.

use std::sync::OnceLock;

use crate::data::derived::{earth_land_mask_file, mapgen_core_params};
use crate::domain::map_generator::{ClimateBand, Terrain};

/// Web: domyslna wartosc argumentu `octaves = 4` w `fbm`.
pub const FBM_DEFAULT_OCTAVES: u32 = 4;
/// Web: dlugosc tablicy permutacji (`Uint8Array(256)`); maska indeksu to `& 255`.
pub const PERM_TABLE_LEN: usize = 256;
const PERM_MASK: i32 = 255;
/// Dzielnik zakresu `[0, 2^32)` w `mulberry32`.
pub const UNIT_SCALE: f64 = 4_294_967_296.0;
/// Stala kroku `mulberry32` (web: `s += 0x6d2b79f5`).
const MULBERRY_INCREMENT: u32 = 0x6d2b_79f5;

/// Web `HEX_DIRECTIONS` (gen-helpers.ts:125): szesc kierunkow aksjalnych (pointy-top).
pub const HEX_DIRECTIONS: [(i32, i32); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

// ---------------------------------------------------------------------------
// 1. PRNG — mulberry32 (gen-helpers.ts:57)
// ---------------------------------------------------------------------------

/// Jeden krok `mulberry32`: zwraca `(nowy_stan, wyjscie_u32)`. Wyjscie dzielone przez 2^32 daje
/// wartosc z `[0, 1)` zwracana przez web.
pub const fn mulberry32_step(state: u32) -> (u32, u32) {
    let s = state.wrapping_add(MULBERRY_INCREMENT);
    let mut t = (s ^ (s >> 15)).wrapping_mul(1 | s);
    t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t));
    (s, t ^ (t >> 14))
}

/// Wartosc `[0, 1)` z wyjscia kroku `mulberry32` (web: `(x >>> 0) / 4294967296`).
pub fn mulberry32_unit(output: u32) -> f64 {
    f64::from(output) / UNIT_SCALE
}

// ---------------------------------------------------------------------------
// 2. Value noise 2D — permutacja + interpolacja cosinusowa + fBm (gen-helpers.ts:72-122)
// ---------------------------------------------------------------------------

/// Web `buildPermTable(rand)`: tablica 0..255 mieszana Fisherem-Yatesem od `i = 255` w dol.
pub fn build_perm_table(mut rand: impl FnMut() -> f64) -> [u8; PERM_TABLE_LEN] {
    let mut p = [0_u8; PERM_TABLE_LEN];
    for (index, value) in p.iter_mut().enumerate() {
        *value = index as u8;
    }
    for i in (1..PERM_TABLE_LEN).rev() {
        let j = (rand() * (i + 1) as f64).floor() as usize;
        p.swap(i, j);
    }
    p
}

/// Web `cosLerp(a, b, t)`: interpolacja cosinusowa.
pub fn cos_lerp(a: f64, b: f64, t: f64) -> f64 {
    let f = (1.0 - js_cos(t * std::f64::consts::PI)) * 0.5;
    a * (1.0 - f) + b * f
}

// ---------------------------------------------------------------------------
// `Math.cos` zgodny z V8 (fdlibm). `f64::cos` z Rust korzysta z libm systemu (glibc) i rozni sie od
// V8 o 1 ulp na ~2% argumentow (zmierzone w P6.M01: 91/4500 wartosci `cosLerp`), co zmienia
// ostatnie bity szumu. Poniej port `ieee754::cos` z V8 (FreeBSD msun: k_cos.c, k_sin.c,
// e_rem_pio2.c) dla |x| <= 2^19 * pi/2; wieksze argumenty (poza zakresem uzycia generatora:
// `cosLerp` dostaje t * pi z t w [0, 1)) wracaja do `f64::cos`.
// ---------------------------------------------------------------------------

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

fn high_word(x: f64) -> u32 {
    (x.to_bits() >> 32) as u32
}

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

fn kernel_sin(x: f64, y: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix < 0x3e40_0000 && x as i32 == 0 {
        return x;
    }
    let z = x * x;
    let v = z * x;
    let r = KS2 + z * (KS3 + z * (KS4 + z * (KS5 + z * KS6)));
    x - ((z * (0.5 * y - v * r) - y) - v * KS1)
}

/// `__ieee754_rem_pio2` (zakres do ~2^19 * pi/2): zwraca `(n, y0, y1)`.
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

/// `Math.cos` jak w V8 (fdlibm). Dla |x| > 2^19 * pi/2 (poza uzyciem generatora) i NaN/inf
/// zwraca wynik `f64::cos` (NaN dla nieskonczonosci jak w JS).
pub fn js_cos(x: f64) -> f64 {
    let ix = high_word(x) & 0x7fff_ffff;
    if ix <= 0x3fe9_21fb {
        return kernel_cos(x, 0.0);
    }
    if ix >= 0x7ff0_0000 {
        // Nieskonczonosc i NaN: wynik NaN (fdlibm: `x - x`).
        return f64::NAN;
    }
    if ix > 0x4139_21fb {
        return x.cos();
    }
    let (n, y0, y1) = rem_pio2_medium(x);
    match n & 3 {
        0 => kernel_cos(y0, y1),
        1 => -kernel_sin(y0, y1),
        2 => -kernel_cos(y0, y1),
        _ => kernel_sin(y0, y1),
    }
}

/// Odpowiednik JS `ToInt32` (uzywany przez operator `&` na liczbach zmiennoprzecinkowych).
pub fn js_to_int32(x: f64) -> i32 {
    if !x.is_finite() {
        return 0;
    }
    let wrapped = x.trunc().rem_euclid(UNIT_SCALE);
    (wrapped as u64 as u32) as i32
}

/// Web `valueNoise2D(p, x, y)`: zwraca `[0, 1]`.
pub fn value_noise_2d(p: &[u8; PERM_TABLE_LEN], x: f64, y: f64) -> f64 {
    let x_floor = x.floor();
    let y_floor = y.floor();
    let xi = js_to_int32(x_floor) & PERM_MASK;
    let yi = js_to_int32(y_floor) & PERM_MASK;
    let xf = x - x_floor;
    let yf = y - y_floor;
    let hash = |ix: i32, iy: i32| {
        let inner = i32::from(p[(ix & PERM_MASK) as usize]);
        f64::from(p[((inner + iy) & PERM_MASK) as usize]) / f64::from(PERM_MASK)
    };
    let v00 = hash(xi, yi);
    let v10 = hash(xi + 1, yi);
    let v01 = hash(xi, yi + 1);
    let v11 = hash(xi + 1, yi + 1);
    let top = cos_lerp(v00, v10, xf);
    let bottom = cos_lerp(v01, v11, xf);
    cos_lerp(top, bottom, yf)
}

/// Web `fbm(p, x, y, octaves)`: suma `octaves` oktaw value-noise; `octaves == 0` daje NaN (0/0)
/// jak w JS.
pub fn fbm(p: &[u8; PERM_TABLE_LEN], x: f64, y: f64, octaves: u32) -> f64 {
    let mut value = 0.0;
    let mut amplitude = 0.5;
    let mut frequency = 1.0;
    let mut max_value = 0.0;
    for _ in 0..octaves {
        value += value_noise_2d(p, x * frequency, y * frequency) * amplitude;
        max_value += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    value / max_value
}

// ---------------------------------------------------------------------------
// 3. Geometria heksow (gen-helpers.ts:135-160)
// ---------------------------------------------------------------------------

/// Web `hexDistanceAxial(aq, ar, bq, br)`: `max(|dq|, |dr|, |ds|)` z `s = -q - r`.
pub const fn hex_distance_axial(aq: i64, ar: i64, bq: i64, br: i64) -> u64 {
    let dq = (aq - bq).unsigned_abs();
    let dr = (ar - br).unsigned_abs();
    let ds = ((-aq - ar) - (-bq - br)).unsigned_abs();
    let max_qr = if dq > dr { dq } else { dr };
    if max_qr > ds {
        max_qr
    } else {
        ds
    }
}

/// Web `hexKey(q, r)`: `"q,r"`.
pub fn hex_key(q: i64, r: i64) -> String {
    format!("{q},{r}")
}

// ---------------------------------------------------------------------------
// 4. Klimat (gen-helpers.ts:168-246)
// ---------------------------------------------------------------------------

/// Web `isPolarClimateBand`.
pub const fn is_polar_climate_band(band: ClimateBand) -> bool {
    band.is_polar()
}

/// Web `isWaterTerrainLocal` (gen-helpers.ts:~152): woda to `Morze` i `PlytkieMorze`.
pub const fn is_water_terrain_local(terrain: Terrain) -> bool {
    terrain.is_water()
}

/// Web `latitudinalOceanBufferRows(height, isEarth)`.
pub fn latitudinal_ocean_buffer_rows(height: u32, is_earth: bool) -> u32 {
    if is_earth {
        return earth_polar_ocean_rows(height);
    }
    let climate = &mapgen_core_params().klimat;
    let scaled = (f64::from(height) * climate.bufor_proceduralny_proc).round() as u32;
    climate.bufor_proceduralny_min_wiersze.max(scaled)
}

/// Web `climateBandAt(_q, r, height, isEarth)`. `r` moze wypadac poza mapa (web nie waliduje).
pub fn climate_band_at(r: i64, height: u32, is_earth: bool) -> ClimateBand {
    let climate = &mapgen_core_params().klimat;
    let buf = i64::from(latitudinal_ocean_buffer_rows(height, is_earth));
    let inner_h = (i64::from(height) - 2 * buf).max(1);
    let rel_r = (r - buf) as f64 / (inner_h - 1).max(1) as f64;
    if !(0.0..=1.0).contains(&rel_r) {
        return if (r as f64) < f64::from(height) / 2.0 {
            ClimateBand::PolarNorth
        } else {
            ClimateBand::PolarSouth
        };
    }
    let desert_half_frac = climate.pustynia_pol_wiersze / inner_h as f64;
    let center = 0.5;
    let desert_lo = center - desert_half_frac;
    let desert_hi = center + desert_half_frac;
    let plains_north_lo = desert_lo - climate.rowniny_pol_proc;
    let plains_south_hi = desert_hi + climate.rowniny_pol_proc;
    if rel_r < climate.polarny_proc {
        ClimateBand::PolarNorth
    } else if rel_r < plains_north_lo {
        ClimateBand::TemperateNorth
    } else if rel_r < desert_lo {
        ClimateBand::PlainsNorth
    } else if rel_r < desert_hi {
        ClimateBand::Desert
    } else if rel_r < plains_south_hi {
        ClimateBand::PlainsSouth
    } else if rel_r < 1.0 - climate.polarny_proc {
        ClimateBand::TemperateSouth
    } else {
        ClimateBand::PolarSouth
    }
}

/// Web `climateForestThreshold(band, baseForTh)` (prywatna w webie): `None` = `undefined`.
pub fn climate_forest_threshold(band: Option<ClimateBand>, base_for_th: f64) -> f64 {
    let climate = &mapgen_core_params().klimat;
    match band {
        None | Some(ClimateBand::Desert) => climate.las_prog_wrogi,
        Some(b) if is_polar_climate_band(b) => climate.las_prog_wrogi,
        Some(ClimateBand::TemperateNorth | ClimateBand::TemperateSouth) => {
            base_for_th + climate.las_umiarkowany_delta
        }
        Some(_) => base_for_th,
    }
}

/// Web `canAssignClimateDesert(band)` (prywatna w webie): `None` = `undefined`.
pub const fn can_assign_climate_desert(band: Option<ClimateBand>) -> bool {
    matches!(band, None | Some(ClimateBand::Desert))
}

// ---------------------------------------------------------------------------
// 5. Maska Ziemi (earth-land-mask.ts)
// ---------------------------------------------------------------------------

/// Web `EARTH_POLAR_OCEAN_REF_ROWS`.
pub fn earth_polar_ocean_ref_rows() -> u32 {
    mapgen_core_params().earth.polarny_ocean_wiersze_ref
}

/// Web `EARTH_POLAR_OCEAN_REF_INNER_H`.
pub fn earth_polar_ocean_ref_inner_h() -> u32 {
    mapgen_core_params().earth.polarny_ocean_wysokosc_ref
}

/// Web `EARTH_PLAYABLE_BORDER`.
pub fn earth_playable_border() -> u32 {
    mapgen_core_params().earth.granica_grywalna
}

/// Web `earthPlayableInnerHeight` (prywatna).
pub fn earth_playable_inner_height(height: u32) -> u32 {
    let b = i64::from(earth_playable_border());
    (i64::from(height) - 1 - 2 * b).max(1) as u32
}

/// Web `earthPlayableInnerWidth` (prywatna).
pub fn earth_playable_inner_width(width: u32) -> u32 {
    let b = i64::from(earth_playable_border());
    (i64::from(width) - 1 - 2 * b).max(1) as u32
}

/// Web `earthPolarOceanRows(height)`: wiersze oceanu u gory i u dolu dla Ziemi.
pub fn earth_polar_ocean_rows(height: u32) -> u32 {
    let earth = &mapgen_core_params().earth;
    let inner_h = f64::from(earth_playable_inner_height(height));
    let scaled = (f64::from(earth.polarny_ocean_wiersze_ref) * inner_h
        / f64::from(earth.polarny_ocean_wysokosc_ref))
    .round() as u32;
    let cap = earth
        .polarny_ocean_wiersze_ref
        .max((inner_h * earth.polarny_ocean_limit_proc).round() as u32);
    earth.polarny_ocean_min_wiersze.max(scaled.min(cap))
}

/// Web `earthNorthOceanRows`.
pub fn earth_north_ocean_rows(height: u32) -> u32 {
    earth_polar_ocean_rows(height)
}

/// Web `earthSouthOceanRows`.
pub fn earth_south_ocean_rows(height: u32) -> u32 {
    earth_polar_ocean_rows(height)
}

/// Web `earthLandMapRows(height)` (prywatna): wiersze, na ktore mapowany jest szablon lądu.
pub fn earth_land_map_rows(height: u32) -> u32 {
    let inner_h = i64::from(earth_playable_inner_height(height));
    let polar = i64::from(earth_polar_ocean_rows(height));
    (inner_h - polar * 2).max(1) as u32
}

struct EarthMaskBits {
    width: usize,
    height: usize,
    bits: Vec<u8>,
}

fn earth_mask_bits() -> &'static EarthMaskBits {
    static BITS: OnceLock<EarthMaskBits> = OnceLock::new();
    BITS.get_or_init(|| {
        let file = earth_land_mask_file();
        let mut bits = Vec::with_capacity(file.szerokosc * file.wysokosc);
        for run in file.rle.split(';') {
            let (value, count) = run.split_at(1);
            let value = value.as_bytes()[0] - b'0';
            let count: usize = count
                .parse()
                .expect("earth-land-mask.json: dlugosc przebiegu");
            bits.extend(std::iter::repeat_n(value, count));
        }
        assert_eq!(
            bits.len(),
            file.szerokosc * file.wysokosc,
            "earth-land-mask.json: liczba bitow != szerokosc * wysokosc"
        );
        EarthMaskBits {
            width: file.szerokosc,
            height: file.wysokosc,
            bits,
        }
    })
}

/// Web `EARTH_MASK_W`.
pub fn earth_mask_width() -> usize {
    earth_mask_bits().width
}

/// Web `EARTH_MASK_H`.
pub fn earth_mask_height() -> usize {
    earth_mask_bits().height
}

/// Web `EARTH_MASK_BBOX` jako `(minX, minY, maxX, maxY)`.
pub fn earth_mask_bbox() -> (f64, f64, f64, f64) {
    let b = earth_land_mask_file().bbox;
    (b.min_x, b.min_y, b.max_x, b.max_y)
}

/// Web `bitAt(x, y)` (prywatna): wspolrzedne sa przycinane do rozmiaru maski.
pub fn earth_mask_bit_at(x: i64, y: i64) -> u8 {
    let mask = earth_mask_bits();
    let xi = x.clamp(0, mask.width as i64 - 1) as usize;
    let yi = y.clamp(0, mask.height as i64 - 1) as usize;
    mask.bits[yi * mask.width + xi]
}

/// Web `sampleEarthTemplateLand(nq, nr)`: probka dwuliniowa progowana (zwraca 0.0 albo 1.0).
pub fn sample_earth_template_land(nq: f64, nr: f64) -> f64 {
    if nq.is_nan() || nr.is_nan() || !(0.0..=1.0).contains(&nq) || !(0.0..=1.0).contains(&nr) {
        return 0.0;
    }
    let mask = earth_mask_bits();
    let fx = nq * (mask.width - 1) as f64;
    let fy = nr * (mask.height - 1) as f64;
    let x0 = fx.floor();
    let y0 = fy.floor();
    let x1 = (x0 + 1.0).min((mask.width - 1) as f64);
    let y1 = (y0 + 1.0).min((mask.height - 1) as f64);
    let tx = fx - x0;
    let ty = fy - y0;
    let bit = |x: f64, y: f64| f64::from(earth_mask_bit_at(x as i64, y as i64));
    let v = (1.0 - tx) * (1.0 - ty) * bit(x0, y0)
        + tx * (1.0 - ty) * bit(x1, y0)
        + (1.0 - tx) * ty * bit(x0, y1)
        + tx * ty * bit(x1, y1);
    if v >= mapgen_core_params().earth.prog_szablonu_ladu {
        1.0
    } else {
        0.0
    }
}

/// Web `earthHexToTemplateNorm(q, r, width, height)`: `None` = `null` (bufor/poza mapa).
pub fn earth_hex_to_template_norm(q: i64, r: i64, width: u32, height: u32) -> Option<(f64, f64)> {
    let b = i64::from(earth_playable_border());
    if q < b || r < b || q >= i64::from(width) - b || r >= i64::from(height) - b {
        return None;
    }
    let inner_w = f64::from(earth_playable_inner_width(width));
    let inner_h = i64::from(earth_playable_inner_height(height));
    let north = i64::from(earth_north_ocean_rows(height));
    let south = i64::from(earth_south_ocean_rows(height));
    let rel_r = r - b;
    if rel_r < north || rel_r >= inner_h - south {
        return None;
    }
    let land_rows = i64::from(earth_land_map_rows(height));
    let pr = (rel_r - north) as f64 / (land_rows - 1).max(1) as f64;
    let pq = (q - b) as f64 / inner_w;
    let (min_x, min_y, max_x, max_y) = earth_mask_bbox();
    Some((min_x + pq * (max_x - min_x), min_y + pr * (max_y - min_y)))
}

/// Web `earthSubsampleGrid(width, height)` (prywatna): liczba probek na bok komorki.
pub fn earth_subsample_grid(width: u32, height: u32) -> u32 {
    let earth = &mapgen_core_params().earth;
    let inner = inner_extent(width, height);
    earth
        .podprobkowanie_progi
        .iter()
        .find(|tier| inner >= i64::from(tier.min_wewn))
        .map_or(earth.podprobkowanie_domyslne, |tier| tier.kroki)
}

/// Web `earthLandFractionThreshold(width, height)` (prywatna).
pub fn earth_land_fraction_threshold(width: u32, height: u32) -> f64 {
    let earth = &mapgen_core_params().earth;
    let inner = inner_extent(width, height);
    earth
        .prog_ulamka_ladu_progi
        .iter()
        .find(|tier| inner >= i64::from(tier.min_wewn))
        .map_or(earth.prog_ulamka_ladu_domyslny, |tier| tier.prog)
}

fn inner_extent(width: u32, height: u32) -> i64 {
    i64::from(width.min(height)) - 2 * i64::from(earth_playable_border())
}

/// Web `earthTemplateLandAt(q, r, width, height)`: 1.0 dla ladu, 0.0 dla morza.
pub fn earth_template_land_at(q: i64, r: i64, width: u32, height: u32) -> f64 {
    let Some((nq, nr)) = earth_hex_to_template_norm(q, r, width, height) else {
        return 0.0;
    };
    let inner_w = f64::from(earth_playable_inner_width(width));
    let (min_x, min_y, max_x, max_y) = earth_mask_bbox();
    let cell_w = (max_x - min_x) / inner_w;
    let cell_h = (max_y - min_y) / f64::from(earth_land_map_rows(height)).max(1.0);
    let steps = earth_subsample_grid(width, height);
    if steps <= 1 {
        return sample_earth_template_land(nq, nr);
    }
    let mut land_hits = 0_u32;
    let total = steps * steps;
    for sy in 0..steps {
        for sx in 0..steps {
            let sample_q = nq - cell_w * 0.5 + ((f64::from(sx) + 0.5) / f64::from(steps)) * cell_w;
            let sample_r = nr - cell_h * 0.5 + ((f64::from(sy) + 0.5) / f64::from(steps)) * cell_h;
            if sample_earth_template_land(sample_q, sample_r) != 0.0 {
                land_hits += 1;
            }
        }
    }
    if f64::from(land_hits) / f64::from(total) >= earth_land_fraction_threshold(width, height) {
        1.0
    } else {
        0.0
    }
}
