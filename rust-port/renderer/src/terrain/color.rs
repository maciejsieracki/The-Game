//! `THREE.Color` of three r169 with `ColorManagement.enabled = true` and the
//! linear-sRGB working colour space (the defaults the web runs with), limited
//! to the operations the terrain build uses (`math/Color.js`,
//! `math/ColorManagement.js`, `math/MathUtils.js` of three@0.169.0).
//!
//! Every method keeps the order of double-precision operations of the
//! JavaScript source. `Math.pow` (`SRGBToLinear`/`LinearToSRGB`) is the
//! fdlibm port [`super::jsmath::js_pow`], because the platform `powf`
//! differs from V8 in the last bit for some inputs (P4-11 §3).

use super::jsmath::js_pow;
use crate::pick::hex::js_round;
use crate::pick::three::{js_max, js_min};

/// A colour in the working colour space (linear sRGB), double precision.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Color {
    /// Red.
    pub r: f64,
    /// Green.
    pub g: f64,
    /// Blue.
    pub b: f64,
}

/// `SRGBToLinear(c)` (`ColorManagement.js`).
#[must_use]
pub fn srgb_to_linear(c: f64) -> f64 {
    if c < 0.04045 {
        c * 0.077_399_380_8
    } else {
        js_pow(c * 0.947_867_298_6 + 0.052_132_701_4, 2.4)
    }
}

/// `LinearToSRGB(c)` (`ColorManagement.js`, exponent `0.41666` as in r169).
#[must_use]
pub fn linear_to_srgb(c: f64) -> f64 {
    if c < 0.003_130_8 {
        c * 12.92
    } else {
        1.055 * (js_pow(c, 0.41666)) - 0.055
    }
}

/// `MathUtils.clamp(v, min, max)` = `Math.max(min, Math.min(max, v))`.
fn clamp(v: f64, min: f64, max: f64) -> f64 {
    if v.is_nan() {
        return v;
    }
    js_max(min, js_min(max, v))
}

/// `MathUtils.euclideanModulo(n, m)` = `((n % m) + m) % m` (JS `%` = fmod).
fn euclidean_modulo(n: f64, m: f64) -> f64 {
    ((n % m) + m) % m
}

/// `hue2rgb(p, q, t)` (`Color.js:33-42`).
fn hue2rgb(p: f64, q: f64, mut t: f64) -> f64 {
    if t < 0.0 {
        t += 1.0;
    }
    if t > 1.0 {
        t -= 1.0;
    }
    if t < 1.0 / 6.0 {
        return p + (q - p) * 6.0 * t;
    }
    if t < 1.0 / 2.0 {
        return q;
    }
    if t < 2.0 / 3.0 {
        return p + (q - p) * 6.0 * (2.0 / 3.0 - t);
    }
    p
}

/// `{ h, s, l }` of `Color.getHSL`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Hsl {
    /// Hue in `[0, 1)`.
    pub h: f64,
    /// Saturation.
    pub s: f64,
    /// Lightness.
    pub l: f64,
}

impl Color {
    /// `new Color(r, g, b)` / `setRGB` in the working space (no conversion).
    #[must_use]
    pub const fn rgb(r: f64, g: f64, b: f64) -> Self {
        Self { r, g, b }
    }

    /// `new Color(hex)` = `setHex(hex)` (sRGB → linear, `Color.js:100-112`).
    #[must_use]
    pub fn from_hex(hex: u32) -> Self {
        let r = f64::from((hex >> 16) & 255) / 255.0;
        let g = f64::from((hex >> 8) & 255) / 255.0;
        let b = f64::from(hex & 255) / 255.0;
        Self {
            r: srgb_to_linear(r),
            g: srgb_to_linear(g),
            b: srgb_to_linear(b),
        }
    }

    /// `getHex()` (linear → sRGB, `Color.js:353-358`).
    #[must_use]
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // 0..=255 after clamp
    pub fn to_hex(self) -> u32 {
        let ch = |c: f64| js_round(clamp(linear_to_srgb(c) * 255.0, 0.0, 255.0)) as u32;
        ch(self.r) * 65536 + ch(self.g) * 256 + ch(self.b)
    }

    /// `getHSL(target)` in the working space (`Color.js:367-410`).
    #[must_use]
    #[allow(clippy::float_cmp)] // `switch (max)` / `min === max` are exact comparisons
    pub fn hsl(self) -> Hsl {
        let (r, g, b) = (self.r, self.g, self.b);
        let max = js_max(js_max(r, g), b);
        let min = js_min(js_min(r, g), b);
        let lightness = (min + max) / 2.0;
        if min == max {
            return Hsl {
                h: 0.0,
                s: 0.0,
                l: lightness,
            };
        }
        let delta = max - min;
        let saturation = if lightness <= 0.5 {
            delta / (max + min)
        } else {
            delta / (2.0 - max - min)
        };
        let hue = if max == r {
            (g - b) / delta + if g < b { 6.0 } else { 0.0 }
        } else if max == g {
            (b - r) / delta + 2.0
        } else {
            (r - g) / delta + 4.0
        };
        Hsl {
            h: hue / 6.0,
            s: saturation,
            l: lightness,
        }
    }

    /// `setHSL(h, s, l)` in the working space (`Color.js:126-148`).
    #[must_use]
    #[allow(clippy::float_cmp)] // `s === 0` is exact in the source
    pub fn from_hsl(h: f64, s: f64, l: f64) -> Self {
        let h = euclidean_modulo(h, 1.0);
        let s = clamp(s, 0.0, 1.0);
        let l = clamp(l, 0.0, 1.0);
        if s == 0.0 {
            return Self { r: l, g: l, b: l };
        }
        let p = if l <= 0.5 {
            l * (1.0 + s)
        } else {
            l + s - (l * s)
        };
        let q = (2.0 * l) - p;
        Self {
            r: hue2rgb(q, p, h + 1.0 / 3.0),
            g: hue2rgb(q, p, h),
            b: hue2rgb(q, p, h - 1.0 / 3.0),
        }
    }

    /// `add(color)`.
    #[must_use]
    pub fn plus(self, o: Self) -> Self {
        Self {
            r: self.r + o.r,
            g: self.g + o.g,
            b: self.b + o.b,
        }
    }

    /// `multiplyScalar(s)`.
    #[must_use]
    pub fn scale(self, s: f64) -> Self {
        Self {
            r: self.r * s,
            g: self.g * s,
            b: self.b * s,
        }
    }

    /// `lerp(color, alpha)` (`Color.js:509-517`).
    #[must_use]
    pub fn lerp(self, o: Self, alpha: f64) -> Self {
        Self {
            r: self.r + (o.r - self.r) * alpha,
            g: self.g + (o.g - self.g) * alpha,
            b: self.b + (o.b - self.b) * alpha,
        }
    }

    /// `toArray()` into a `Float32Array` (`InstancedMesh.setColorAt`).
    #[must_use]
    #[allow(clippy::cast_possible_truncation)] // Float32Array store
    pub fn to_f32(self) -> [f32; 3] {
        [self.r as f32, self.g as f32, self.b as f32]
    }

    /// The three components as an array.
    #[must_use]
    pub fn to_array(self) -> [f64; 3] {
        [self.r, self.g, self.b]
    }
}
