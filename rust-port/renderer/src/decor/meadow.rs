//! `render/dekor-laki-rowniny.ts` (web `edb8fb56`): micro-decor of meadow
//! (`Laka`) and plains (`Rownina`) hexes, 4 variants each, plus the
//! presence/variant/rotation hash (salts 1201/1207/1213).
//!
//! Line references are to `gra/src/render/dekor-laki-rowniny.ts`. The
//! primitives `ostrze`, `kamyk`, `rot2` also serve [`super::desert`] (same
//! operations in `oaza-pustynia.ts`, see there).

use std::sync::{Arc, OnceLock};

use crate::core::scene::{Geometry, Material, SceneNode};
use crate::pick::terrain::hash_heksa;

use super::js::{floor_index, js_cos, js_hypot, js_max, js_sin, wrap_variant, PI};
use super::object::DecorObject;
use super::parts::{rgb, vertex_color_material, Parts, V3};

/// `DEKOR_LICZBA_WARIANTOW` (`:85`).
pub const DEKOR_LICZBA_WARIANTOW: usize = 4;
/// `DEKOR_UDZIAL_PUSTYCH` (`:88`).
pub const DEKOR_UDZIAL_PUSTYCH: f64 = 0.45;
/// `DEKOR_MAX_WYSOKOSC` (`:91`).
pub const DEKOR_MAX_WYSOKOSC: f64 = 0.06;
/// `DEKOR_FOOTPRINT_R` (`:94`).
pub const DEKOR_FOOTPRINT_R: f64 = 0.75;
/// `DEKOR_LOD_MAX_POZIOM` (`:101`).
pub const DEKOR_LOD_MAX_POZIOM: u8 = 1;

const SALT_OBECNOSC: i32 = 1201;
const SALT_WARIANT: i32 = 1207;
const SALT_ROTACJA: i32 = 1213;

/// `dekorDlaHeksa(q, r, seed = 0)` (`:128-131`): `None` = empty hex.
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub fn dekor_dla_heksa(q: i32, r: i32, seed: i32) -> Option<usize> {
    if hash_heksa(q, r, seed, SALT_OBECNOSC) < DEKOR_UDZIAL_PUSTYCH {
        return None;
    }
    Some(floor_index(
        hash_heksa(q, r, seed, SALT_WARIANT) * DEKOR_LICZBA_WARIANTOW as f64,
    ))
}

/// `rotacjaDekoru(q, r, seed = 0)` (`:134-136`).
#[must_use]
pub fn rotacja_dekoru(q: i32, r: i32, seed: i32) -> f64 {
    (hash_heksa(q, r, seed, SALT_ROTACJA) * 6.0).floor() * (PI / 3.0)
}

const LAKA_TRAWA_C: u32 = 0x55_a041;
const LAKA_TRAWA_J: u32 = 0x7f_db55;
const LAKA_TRAWA_S: u32 = 0x68_bd4a;
const LAKA_LODYGA: u32 = 0x4c_913e;
const LAKA_KRZAK_C: u32 = 0x3f_8536;
const LAKA_KRZAK_J: u32 = 0x5c_ab47;
const KWIAT_BIALY: u32 = 0xf8_f8ee;
const KWIAT_ZOLTY: u32 = 0xf5_c94b;
const KWIAT_CZERWONY: u32 = 0xdb_5244;
const KAMYK_JASNY: u32 = 0xb4_bcc3;
const ROW_TRAWA_C: u32 = 0xb5_9d49;
const ROW_TRAWA_J: u32 = 0xe0_cd72;
const ROW_TRAWA_S: u32 = 0xcb_b45c;
const CIERN_KORPUS: u32 = 0x8a_8749;
const CIERN_KOLEC: u32 = 0x6b_663a;
const ZBOZE_ZDZBLO: u32 = 0xc0_a94f;
const ZBOZE_KLOS: u32 = 0xec_d97e;
const KAMYK_CIEPLY_A: u32 = 0xa8_9e8a;
const KAMYK_CIEPLY_B: u32 = 0x96_8c78;

/// `rot2(x, z, yaw)` (`:189-192`).
pub(crate) fn rot2(x: f64, z: f64, yaw: f64) -> [f64; 2] {
    let c = js_cos(yaw);
    let s = js_sin(yaw);
    [x * c + z * s, z * c - x * s]
}

/// `OstrzeOpts` (`:199-202`) with the web defaults (`yaw = 0`,
/// `splasz = 0.55`, tilts `0`).
#[derive(Clone, Copy)]
pub(crate) struct Ostrze {
    pub(crate) h: f64,
    pub(crate) r: f64,
    pub(crate) yaw: f64,
    pub(crate) splasz: f64,
    pub(crate) tilt_x: f64,
    pub(crate) tilt_z: f64,
    pub(crate) col: u32,
}

impl Ostrze {
    pub(crate) fn new(h: f64, r: f64, col: u32) -> Self {
        Self {
            h,
            r,
            yaw: 0.0,
            splasz: 0.55,
            tilt_x: 0.0,
            tilt_z: 0.0,
            col,
        }
    }
    pub(crate) fn yaw(mut self, y: f64) -> Self {
        self.yaw = y;
        self
    }
    pub(crate) fn sp(mut self, s: f64) -> Self {
        self.splasz = s;
        self
    }
    pub(crate) fn tilt(mut self, x: f64, z: f64) -> Self {
        self.tilt_x = x;
        self.tilt_z = z;
        self
    }
}

/// `ostrze(P, cx, cz, o)` (`:205-221`; identical `oaza-pustynia.ts:356-372`).
pub(crate) fn ostrze(p: &mut Parts, cx: f64, cz: f64, o: Ostrze) {
    let base: Vec<V3> = (0..3)
        .map(|i| {
            let a = f64::from(i) * (PI * 2.0 / 3.0);
            let [wx, wz] = rot2(js_sin(a) * o.r, js_cos(a) * o.r * o.splasz, o.yaw);
            [cx + wx, -0.004, cz + wz]
        })
        .collect();
    let a: V3 = [cx + o.tilt_x, o.h, cz + o.tilt_z];
    let col = rgb(o.col);
    for i in 0..3 {
        let j = (i + 1) % 3;
        let (b0, b1) = (base[i], base[j]);
        let rf: V3 = [(b0[0] + b1[0]) / 2.0 - cx, 0.2, (b0[2] + b1[2]) / 2.0 - cz];
        p.tri(b0, b1, a, col, rf);
    }
}

/// `kepka(P, cx, cz, o)` (`:226-244`): `n` = 2 or 3 blades.
fn kepka(p: &mut Parts, cx: f64, cz: f64, n: u8, yaw: f64, col_a: u32, col_b: u32) {
    let s = 1.0;
    let defs: &[[f64; 5]] = if n == 3 {
        &[
            [0.0, 0.0, 0.054, 0.068, 0.30],
            [-0.080, 0.044, 0.040, 0.054, 0.85],
            [0.070, -0.060, 0.034, 0.048, 0.85],
        ]
    } else {
        &[
            [0.0, 0.0, 0.048, 0.058, 0.35],
            [0.078, 0.040, 0.034, 0.048, 0.85],
        ]
    };
    let cols = [col_a, col_b, col_a];
    for (i, d) in defs.iter().enumerate() {
        let [dx, dz, h, r, tl] = *d;
        let [wx, wz] = rot2(dx * s, dz * s, yaw);
        let len = js_max(1e-6, js_hypot(wx, wz));
        let tx = if len < 0.01 {
            0.030
        } else {
            (wx / len) * r * tl * 1.2
        };
        let tz = if len < 0.01 {
            0.016
        } else {
            (wz / len) * r * tl * 1.2
        };
        #[allow(clippy::cast_precision_loss)]
        let blade_yaw = yaw + i as f64 * 1.9;
        ostrze(
            p,
            cx + wx,
            cz + wz,
            Ostrze::new(h * s, r * s, cols[i])
                .yaw(blade_yaw)
                .tilt(tx, tz),
        );
    }
}

/// `KAMYK_JIT` (`:246`; same in `oaza-pustynia.ts:374`).
const KAMYK_JIT: [f64; 5] = [1.0, 0.8, 1.12, 0.88, 1.06];

/// `kamyk(P, cx, cz, { r, h, yaw, col })` (`:249-266`; identical
/// `oaza-pustynia.ts:377-394`).
pub(crate) fn kamyk(p: &mut Parts, cx: f64, cz: f64, r: f64, h: f64, yaw: f64, col: u32) {
    let col = rgb(col);
    let pts: Vec<[f64; 2]> = (0..5)
        .map(|i| {
            let a = yaw + f64::from(i) * (PI * 2.0 / 5.0);
            let rr = r * KAMYK_JIT[i as usize];
            [cx + rr * js_sin(a), cz + rr * js_cos(a)]
        })
        .collect();
    let a: V3 = [cx + r * 0.16, h, cz - r * 0.10];
    for i in 0..5 {
        let j = (i + 1) % 5;
        let b0: V3 = [pts[i][0], -0.008, pts[i][1]];
        let b1: V3 = [pts[j][0], -0.008, pts[j][1]];
        let rf: V3 = [(b0[0] + b1[0]) / 2.0 - cx, 0.25, (b0[2] + b1[2]) / 2.0 - cz];
        p.tri(b0, b1, a, col, rf);
    }
}

/// `okta(P, cx, cy, cz, { r, hGora, hDol, yaw, sx, col })` (`:269-288`;
/// `oaza-pustynia.ts:397-416` adds `sx`, default 1 — `r * sin(a) * 1` is the
/// same number as `r * sin(a)`).
#[allow(clippy::too_many_arguments)]
pub(crate) fn okta(
    p: &mut Parts,
    cx: f64,
    cy: f64,
    cz: f64,
    r: f64,
    h_gora: f64,
    h_dol: f64,
    yaw: f64,
    sx: f64,
    col: u32,
) {
    let col = rgb(col);
    let eq: Vec<V3> = (0..4)
        .map(|i| {
            let a = yaw + f64::from(i) * (PI / 2.0);
            [cx + r * js_sin(a) * sx, cy, cz + r * js_cos(a)]
        })
        .collect();
    let t: V3 = [cx, cy + h_gora, cz];
    let b: V3 = [cx, cy - h_dol, cz];
    for i in 0..4 {
        let j = (i + 1) % 4;
        let (e0, e1) = (eq[i], eq[j]);
        let rf: V3 = [(e0[0] + e1[0]) / 2.0 - cx, 0.30, (e0[2] + e1[2]) / 2.0 - cz];
        let rf_d: V3 = [rf[0], -0.30, rf[2]];
        p.tri(e0, e1, t, col, rf);
        p.tri(e0, e1, b, col, rf_d);
    }
}

/// `kwiatek(P, cx, cz, o)` (`:291-296`).
fn kwiatek(p: &mut Parts, cx: f64, cz: f64, h: f64, r_l: f64, yaw: f64, col_lepek: u32) {
    ostrze(
        p,
        cx,
        cz,
        Ostrze::new(h, 0.020, LAKA_LODYGA)
            .sp(0.7)
            .yaw(yaw)
            .tilt(0.006, 0.0),
    );
    okta(
        p,
        cx,
        h,
        cz,
        r_l,
        r_l * 0.75,
        r_l * 0.75,
        yaw + 0.4,
        1.0,
        col_lepek,
    );
}

/// `krzaczek(P, cx, cz, o)` (`:299-305`) with the default `r`, `h`.
fn krzaczek(p: &mut Parts, cx: f64, cz: f64, yaw: f64, col_c: u32, col_j: u32) {
    let (r, h) = (0.110, 0.056);
    okta(
        p,
        cx,
        h * 0.55,
        cz,
        r,
        h * 0.45,
        h * 0.55 + 0.006,
        yaw,
        1.0,
        col_c,
    );
    let [lx, lz] = rot2(r * 0.95, r * 0.30, yaw);
    ostrze(
        p,
        cx + lx,
        cz + lz,
        Ostrze::new(h * 0.55, r * 0.40, col_j)
            .sp(0.8)
            .yaw(yaw + 0.7),
    );
}

/// `ciernisko(P, cx, cz, { yaw })` (`:308-319`).
fn ciernisko(p: &mut Parts, cx: f64, cz: f64, yaw: f64) {
    okta(
        p,
        cx,
        0.020,
        cz,
        0.100,
        0.018,
        0.026,
        yaw,
        1.0,
        CIERN_KORPUS,
    );
    for i in 0..3 {
        let a = yaw + 0.5 + f64::from(i) * (PI * 2.0 / 3.0);
        let [dx, dz] = rot2(0.088 * js_sin(a), 0.088 * js_cos(a), 0.0);
        ostrze(
            p,
            cx + dx,
            cz + dz,
            Ostrze::new(0.044 + f64::from(i % 2) * 0.012, 0.020, CIERN_KOLEC)
                .sp(0.7)
                .yaw(a)
                .tilt(js_sin(a) * 0.060, js_cos(a) * 0.060),
        );
    }
}

/// `klos(P, cx, cz, { yaw, tiltX, tiltZ })` (`:322-342`).
fn klos(p: &mut Parts, cx: f64, cz: f64, yaw: f64, tx: f64, tz: f64) {
    ostrze(
        p,
        cx,
        cz,
        Ostrze::new(0.036, 0.018, ZBOZE_ZDZBLO)
            .sp(0.7)
            .yaw(yaw)
            .tilt(tx * 0.7, tz * 0.7),
    );
    let col = rgb(ZBOZE_KLOS);
    let ex = cx + tx;
    let ez = cz + tz;
    let eq: Vec<V3> = (0..3)
        .map(|i| {
            let a = yaw + f64::from(i) * (PI * 2.0 / 3.0);
            [ex + 0.030 * js_sin(a), 0.042, ez + 0.030 * js_cos(a)]
        })
        .collect();
    let t: V3 = [ex + tx * 0.25, 0.058, ez + tz * 0.25];
    let b: V3 = [ex - tx * 0.2, 0.024, ez - tz * 0.2];
    for i in 0..3 {
        let j = (i + 1) % 3;
        let (e0, e1) = (eq[i], eq[j]);
        let rf: V3 = [(e0[0] + e1[0]) / 2.0 - ex, 0.25, (e0[2] + e1[2]) / 2.0 - ez];
        let rf_d: V3 = [rf[0], -0.25, rf[2]];
        p.tri(e0, e1, t, col, rf);
        p.tri(e0, e1, b, col, rf_d);
    }
}

/// `czesciDekoruLaki(w)` (`:348-372`).
fn czesci_dekoru_laki(w: usize) -> Parts {
    let mut parts = Parts::default();
    let p = &mut parts;
    match w {
        0 => {
            kepka(p, 0.42, 0.18, 3, 0.4, LAKA_TRAWA_C, LAKA_TRAWA_J);
            kepka(p, -0.38, -0.30, 2, 2.3, LAKA_TRAWA_S, LAKA_TRAWA_C);
            ostrze(
                p,
                -0.12,
                0.52,
                Ostrze::new(0.040, 0.055, LAKA_TRAWA_J)
                    .yaw(1.1)
                    .tilt(0.035, 0.0),
            );
        }
        1 => {
            kwiatek(p, 0.30, -0.44, 0.030, 0.036, 0.2, KWIAT_BIALY);
            kwiatek(p, 0.45, -0.26, 0.026, 0.032, 2.4, KWIAT_ZOLTY);
            kepka(p, -0.44, 0.28, 3, 3.6, LAKA_TRAWA_C, LAKA_TRAWA_S);
        }
        2 => {
            krzaczek(p, -0.36, 0.40, 0.9, LAKA_KRZAK_C, LAKA_KRZAK_J);
            kwiatek(p, 0.50, -0.12, 0.028, 0.034, 4.1, KWIAT_CZERWONY);
            kepka(p, 0.06, -0.52, 2, 5.2, LAKA_TRAWA_J, LAKA_TRAWA_C);
        }
        _ => {
            kepka(p, 0.40, 0.30, 3, 1.7, LAKA_TRAWA_S, LAKA_TRAWA_J);
            kamyk(p, -0.32, -0.44, 0.080, 0.034, 0.7, KAMYK_JASNY);
            kepka(p, -0.52, 0.12, 2, 4.4, LAKA_TRAWA_C, LAKA_TRAWA_S);
        }
    }
    parts
}

/// `czesciDekoruRowniny(w)` (`:378-403`).
fn czesci_dekoru_rowniny(w: usize) -> Parts {
    let mut parts = Parts::default();
    let p = &mut parts;
    match w {
        0 => {
            kepka(p, 0.44, -0.22, 3, 5.0, ROW_TRAWA_C, ROW_TRAWA_J);
            kepka(p, -0.36, 0.42, 2, 1.3, ROW_TRAWA_S, ROW_TRAWA_C);
            ostrze(
                p,
                -0.26,
                -0.48,
                Ostrze::new(0.038, 0.050, ROW_TRAWA_J)
                    .yaw(2.6)
                    .tilt(0.0, -0.032),
            );
        }
        1 => {
            ciernisko(p, -0.06, 0.46, 0.3);
            kepka(p, 0.42, -0.36, 2, 3.9, ROW_TRAWA_C, ROW_TRAWA_S);
        }
        2 => {
            kamyk(p, 0.38, 0.28, 0.085, 0.032, 0.2, KAMYK_CIEPLY_A);
            kamyk(p, -0.44, -0.20, 0.065, 0.026, 2.2, KAMYK_CIEPLY_B);
            kamyk(p, 0.10, -0.50, 0.055, 0.020, 4.0, KAMYK_CIEPLY_A);
            kepka(p, -0.16, 0.42, 2, 5.6, ROW_TRAWA_S, ROW_TRAWA_J);
        }
        _ => {
            klos(p, -0.37, -0.22, 0.5, -0.035, -0.020);
            klos(p, -0.47, -0.05, 2.6, -0.030, 0.024);
            klos(p, -0.27, -0.04, 4.4, 0.038, 0.016);
            kamyk(p, 0.44, 0.30, 0.070, 0.028, 1.5, KAMYK_CIEPLY_B);
        }
    }
    parts
}

/// Meadow or plains decor.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum DekorTyp {
    /// `'laka'`.
    Laka,
    /// `'rownina'`.
    Rownina,
}

fn cache(t: DekorTyp) -> &'static [Arc<Geometry>] {
    static LA: OnceLock<Vec<Arc<Geometry>>> = OnceLock::new();
    static RO: OnceLock<Vec<Arc<Geometry>>> = OnceLock::new();
    match t {
        DekorTyp::Laka => LA.get_or_init(|| {
            (0..4)
                .map(|w| Arc::new(czesci_dekoru_laki(w).into_geometry()))
                .collect()
        }),
        DekorTyp::Rownina => RO.get_or_init(|| {
            (0..4)
                .map(|w| Arc::new(czesci_dekoru_rowniny(w).into_geometry()))
                .collect()
        }),
    }
}

/// `dekorLakaGeometria(wariant)` (`:422-426`).
#[must_use]
pub fn dekor_laka_geometria(wariant: i32) -> Arc<Geometry> {
    Arc::clone(&cache(DekorTyp::Laka)[wrap_variant(wariant, 4)])
}

/// `dekorRowninaGeometria(wariant)` (`:429-433`).
#[must_use]
pub fn dekor_rownina_geometria(wariant: i32) -> Arc<Geometry> {
    Arc::clone(&cache(DekorTyp::Rownina)[wrap_variant(wariant, 4)])
}

/// `DEKOR_MATERIAL` (`:436-439`).
#[must_use]
pub fn dekor_material() -> Material {
    vertex_color_material()
}

fn build(t: DekorTyp, wariant: i32) -> DecorObject {
    let geo = match t {
        DekorTyp::Laka => dekor_laka_geometria(wariant),
        DekorTyp::Rownina => dekor_rownina_geometria(wariant),
    };
    let mut m = SceneNode::mesh(geo, dekor_material());
    m.cast_shadow = false;
    m.receive_shadow = true;
    let prefix = match t {
        DekorTyp::Laka => "dekor-laka-l",
        DekorTyp::Rownina => "dekor-rownina-r",
    };
    DecorObject::new(m).named(&format!("{prefix}{}", wrap_variant(wariant, 4)))
}

/// `buildDekorLaka(wariant)` (`:442-448`).
#[must_use]
pub fn build_dekor_laka(wariant: i32) -> DecorObject {
    build(DekorTyp::Laka, wariant)
}

/// `buildDekorRownina(wariant)` (`:451-457`).
#[must_use]
pub fn build_dekor_rownina(wariant: i32) -> DecorObject {
    build(DekorTyp::Rownina, wariant)
}

/// `trojkatyDekoru(typ, wariant)` (`:460-463`).
#[must_use]
pub fn trojkaty_dekoru(t: DekorTyp, wariant: i32) -> usize {
    match t {
        DekorTyp::Laka => dekor_laka_geometria(wariant),
        DekorTyp::Rownina => dekor_rownina_geometria(wariant),
    }
    .mesh
    .vertex_count()
        / 3
}
