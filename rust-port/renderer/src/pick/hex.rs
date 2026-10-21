//! Hex-grid math of the web picker: axial ↔ world, both `worldToAxial`
//! variants, `clientRectToNdc` and the JS `Math.round` emulation.
//!
//! Sources (web `edb8fb56`): `gra/src/render/hexutil.ts:24-71`,
//! `gra/src/input/picker.ts:27-98`.

/// External hex radius `HEX_R` (`hexutil.ts:24`).
pub const HEX_R: f64 = 1.0;

/// Axial hex coordinate `(q, r)`; pointy-top, `s = -q - r`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HexCoord {
    /// Axial `q`.
    pub q: i32,
    /// Axial `r`.
    pub r: i32,
}

impl HexCoord {
    /// Builds a coordinate.
    #[must_use]
    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }
}

/// `Math.sqrt(3)` (`hexutil.ts:26`, `picker.ts:27`); `sqrt` is correctly
/// rounded in both IEEE 754 environments.
#[must_use]
pub fn sqrt3() -> f64 {
    3.0f64.sqrt()
}

/// JavaScript `Math.round`: nearest integer, exact halves towards +∞.
///
/// Recipe verified in P4-3 §3.4: `x - floor(x)` is exact for every finite
/// double, so comparing it with `0.5` decides halves without the
/// `(x + 0.5).floor()` double-rounding bug (`0.49999999999999994 → 1`).
/// Differs from `Math.round` only by the sign of a zero result
/// (`Math.round(-0.4) == -0`, here `floor(-0.4) + 1.0 == +0.0`), which is
/// irrelevant after conversion to an integer.
#[must_use]
pub fn js_round(x: f64) -> f64 {
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// `axialToWorld(q, r, R)` (`hexutil.ts:32-36`) for fractional `(q, r)`.
#[must_use]
pub fn axial_to_world_f(q: f64, r: f64, radius: f64) -> (f64, f64) {
    let x = radius * sqrt3() * (q + r * 0.5);
    let z = radius * 1.5 * r;
    (x, z)
}

/// `axialToWorld(q, r, R)` for an integer hex.
#[must_use]
pub fn axial_to_world(h: HexCoord, radius: f64) -> (f64, f64) {
    axial_to_world_f(f64::from(h.q), f64::from(h.r), radius)
}

/// `mapCenter(width, height, R)` (`hexutil.ts:41-45`).
#[must_use]
pub fn map_center(width: u32, height: u32, radius: f64) -> (f64, f64) {
    let cx = (f64::from(width) - 1.0) / 2.0;
    let cy = (f64::from(height) - 1.0) / 2.0;
    axial_to_world_f(cx, cy, radius)
}

// Rounded cube coordinates are integral doubles well inside i32 for any
// world point a map can produce; `as` saturates outside that range.
#[allow(clippy::cast_possible_truncation)]
fn to_i32(v: f64) -> i32 {
    v as i32
}

/// `worldToAxial` from `input/picker.ts:49-81` — **the variant used by map
/// clicks**. Tie rule: fix `q` only when its residual is strictly the
/// largest; else fix `s` when `ds > dr`; else (also `ds == dr`) fix `r`.
#[must_use]
pub fn world_to_axial_picker(x: f64, z: f64, radius: f64) -> HexCoord {
    let rf = z / (radius * 1.5);
    let qf = x / (radius * sqrt3()) - rf * 0.5;
    let xc = qf;
    let zc = rf;
    let yc = -xc - zc;
    let mut rx = js_round(xc);
    let ry = js_round(yc);
    let mut rz = js_round(zc);
    let dx = (rx - xc).abs();
    let dy = (ry - yc).abs();
    let dz = (rz - zc).abs();
    if dx > dy && dx > dz {
        rx = -ry - rz;
    } else if dy > dz {
        // ry = -rx - rz; (only `rx`, `rz` are returned)
    } else {
        rz = -rx - ry;
    }
    HexCoord::new(to_i32(rx), to_i32(rz))
}

/// `worldToAxial` from `render/hexutil.ts:53-71` (gallery / token seating).
/// Differs from [`world_to_axial_picker`] only on the exact tie `dr == ds`:
/// here `s` is the corrected coordinate, so `q` and `r` stay as rounded.
#[must_use]
pub fn world_to_axial_hexutil(x: f64, z: f64, radius: f64) -> HexCoord {
    let rf = z / (radius * 1.5);
    let qf = x / (radius * sqrt3()) - rf * 0.5;
    let sf = -qf - rf;
    let mut rq = js_round(qf);
    let mut rr = js_round(rf);
    let rs = js_round(sf);
    let dq = (rq - qf).abs();
    let dr = (rr - rf).abs();
    let ds = (rs - sf).abs();
    if dq > dr && dq > ds {
        rq = -rr - rs;
    } else if dr > ds {
        rr = -rq - rs;
    }
    HexCoord::new(to_i32(rq), to_i32(rr))
}

/// `getBoundingClientRect()` of the map canvas, in CSS pixels.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ClientRect {
    /// `rect.left`.
    pub left: f64,
    /// `rect.top`.
    pub top: f64,
    /// `rect.width`.
    pub width: f64,
    /// `rect.height`.
    pub height: f64,
}

/// `clientRectToNdc` (`picker.ts:87-98`): `None` for an empty rect.
#[must_use]
pub fn client_rect_to_ndc(client_x: f64, client_y: f64, rect: &ClientRect) -> Option<(f64, f64)> {
    if rect.width <= 0.0 || rect.height <= 0.0 {
        return None;
    }
    Some((
        ((client_x - rect.left) / rect.width) * 2.0 - 1.0,
        -((client_y - rect.top) / rect.height) * 2.0 + 1.0,
    ))
}
