//! `render/djungla-modele.ts` (web `edb8fb56`): 5 tropical-jungle clump
//! variants (shared vertex-colour geometries + one material).
//!
//! Line references are to `gra/src/render/djungla-modele.ts`. `pien`,
//! `cone`, `blob`, `ringN` are the same operations as in `lasy-modele.ts`
//! (only the default `n` of `pien` differs: 5 here, always passed
//! explicitly below), so the [`super::forest`] emitters are reused.

use std::sync::{Arc, OnceLock};

use crate::pick::terrain::hash_heksa;
use crate::scene::{Geometry, Material};

use super::forest::{blob, cone, pien, ring_n};
use super::js::{floor_index, js_cos, js_sin, wrap_variant, PI};
use super::parts::{rgb, vertex_color_material, Parts, V3};

/// `LICZBA_WARIANTOW_DJUNGLI` (`:8`).
pub const LICZBA_WARIANTOW_DJUNGLI: usize = 5;
/// `SOL_WARIANT_DJUNGLI` (`:10`).
pub const SOL_WARIANT_DJUNGLI: i32 = 1319;
/// `SOL_ROTACJA_DJUNGLI` (`:11`).
pub const SOL_ROTACJA_DJUNGLI: i32 = 1321;

/// `wariantDjungliDlaHeksa(q, r, liczbaWariantow = 5, seed = 0)` (`:24-31`).
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub fn wariant_djungli_dla_heksa(q: i32, r: i32, liczba_wariantow: usize, seed: i32) -> usize {
    floor_index(hash_heksa(q, r, seed, SOL_WARIANT_DJUNGLI) * liczba_wariantow as f64)
}

/// `rotacjaDjungliDlaHeksa(q, r, seed = 0)` (`:33-35`).
#[must_use]
pub fn rotacja_djungli_dla_heksa(q: i32, r: i32, seed: i32) -> f64 {
    (hash_heksa(q, r, seed, SOL_ROTACJA_DJUNGLI) * 6.0).floor() * (PI / 3.0)
}

const Z_D1: u32 = 0x2d_5a35;
const Z_D2: u32 = 0x3d_6b45;
const Z_D3: u32 = 0x4a_7a52;
const Z_D4: u32 = 0x5a_8f5a;
const Z_JASNY: u32 = 0x6b_9f62;
const PIEN_PALMA: u32 = 0x6a_4a28;
const PIEN_CIENKI: u32 = 0x5a_4028;

/// `palma(P, x, z, yaw)` (`:121-131`).
fn palma(p: &mut Parts, x: f64, z: f64, yaw: f64) {
    pien(p, x, z, 0.0, 0.48, 0.05, 0.035, PIEN_PALMA, yaw, 5);
    let fy = 0.50;
    let frond_cols = [Z_D2, Z_D3, Z_D4];
    for fi in 0..4 {
        let fa = yaw + (f64::from(fi) / 4.0) * PI * 2.0;
        let fx = x + js_cos(fa) * 0.16;
        let fz = z + js_sin(fa) * 0.16;
        cone(
            p,
            fx,
            fz,
            fy - 0.04,
            0.24,
            0.14,
            frond_cols[(fi % 3) as usize],
            fa,
            js_cos(fa) * 0.04,
            js_sin(fa) * 0.04,
        );
    }
}

/// `parasol(P, x, z, yaw)` (`:133-147`).
fn parasol(p: &mut Parts, x: f64, z: f64, yaw: f64) {
    pien(p, x, z, 0.0, 0.38, 0.04, 0.055, PIEN_CIENKI, yaw, 5);
    let cap_y = 0.42;
    let col = rgb(Z_D3);
    let bot = ring_n(6, x, z, 0.32, yaw);
    let top = ring_n(6, x, z, 0.28, yaw);
    for i in 0..6 {
        let j = (i + 1) % 6;
        let b0: V3 = [bot[i][0], cap_y, bot[i][1]];
        let b1: V3 = [bot[j][0], cap_y, bot[j][1]];
        let t0: V3 = [top[i][0], cap_y + 0.06, top[i][1]];
        let t1: V3 = [top[j][0], cap_y + 0.06, top[j][1]];
        let r: V3 = [0.0, 1.0, 0.0];
        p.tri(b0, b1, t1, col, r);
        p.tri(b0, t1, t0, col, r);
    }
}

/// `drzewoTrop(P, x, z, H, yaw)` (`:149-152`).
fn drzewo_trop(p: &mut Parts, x: f64, z: f64, hh: f64, yaw: f64) {
    pien(
        p,
        x,
        z,
        0.0,
        0.22 * hh,
        0.024 + 0.042 * hh,
        0.018 + 0.030 * hh,
        PIEN_CIENKI,
        yaw,
        4,
    );
    blob(
        p,
        x,
        0.62 * hh,
        z,
        0.28 * hh,
        0.28 * hh,
        0.38 * hh,
        0.28 * hh,
        Z_D4,
        yaw,
        0.04 * hh,
        0.03 * hh,
    );
}

/// `czesciDjungli(w)` (`:154-196`).
fn czesci_djungli(w: usize) -> Parts {
    let mut parts = Parts::default();
    let p = &mut parts;
    match w {
        0 => {
            palma(p, 0.44, 0.28, 0.3);
            parasol(p, -0.38, 0.35, 1.8);
            drzewo_trop(p, -0.28, -0.48, 0.88, 3.5);
            palma(p, 0.18, -0.52, 2.1);
            parasol(p, -0.55, -0.22, 4.6);
            drzewo_trop(p, 0.08, 0.06, 0.72, 5.2);
        }
        1 => {
            palma(p, 0.50, 0.20, 0.5);
            palma(p, -0.42, 0.40, 2.4);
            parasol(p, 0.30, -0.45, 1.2);
            drzewo_trop(p, -0.50, -0.35, 0.82, 3.8);
            palma(p, 0.62, -0.10, 4.0);
            parasol(p, -0.08, -0.08, 5.5);
            drzewo_trop(p, 0.22, 0.55, 0.68, 2.0);
        }
        2 => {
            parasol(p, 0.46, 0.32, 0.7);
            palma(p, -0.48, 0.25, 2.0);
            palma(p, 0.10, -0.55, 3.3);
            drzewo_trop(p, -0.35, -0.50, 0.90, 4.5);
            parasol(p, 0.55, -0.28, 1.5);
            drzewo_trop(p, -0.12, 0.10, 0.76, 5.8);
        }
        3 => {
            palma(p, 0.40, 0.38, 0.2);
            drzewo_trop(p, -0.52, 0.18, 0.86, 2.6);
            parasol(p, 0.28, -0.52, 4.1);
            palma(p, -0.20, -0.42, 3.0);
            parasol(p, 0.58, -0.12, 1.7);
            drzewo_trop(p, 0.05, 0.02, 0.70, 5.0);
            cone(p, -0.35, 0.55, 0.0, 0.10, 0.08, Z_JASNY, 1.4, 0.0, 0.0);
        }
        _ => {
            palma(p, 0.35, 0.30, 0.9);
            parasol(p, -0.45, -0.30, 2.8);
            palma(p, 0.55, -0.35, 4.2);
            drzewo_trop(p, -0.15, 0.45, 0.80, 1.1);
            parasol(p, 0.20, -0.55, 3.6);
            drzewo_trop(p, -0.40, 0.08, 0.74, 5.3);
            cone(p, 0.10, 0.08, 0.0, 0.09, 0.07, Z_D1, 0.5, 0.0, 0.0);
        }
    }
    parts
}

/// `djunglaGeometria(wariant)` (`:209-213`).
#[must_use]
pub fn djungla_geometria(wariant: i32) -> Arc<Geometry> {
    static CACHE: OnceLock<Vec<Arc<Geometry>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| {
        (0..LICZBA_WARIANTOW_DJUNGLI)
            .map(|w| Arc::new(czesci_djungli(w).into_geometry()))
            .collect()
    });
    Arc::clone(&cache[wrap_variant(wariant, 5)])
}

/// `DJUNGLA_MATERIAL` (`:215-218`).
#[must_use]
pub fn djungla_material() -> Material {
    vertex_color_material()
}
