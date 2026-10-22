//! `render/lasy-modele.ts` (web `edb8fb56`): 5 forest-clump variants as
//! shared non-indexed vertex-colour geometries + one material.
//!
//! Line references are to `gra/src/render/lasy-modele.ts`.

use std::sync::{Arc, OnceLock};

use crate::pick::terrain::hash_heksa;
use crate::scene::{Geometry, Material, Scene};

use super::js::{floor_index, js_cos, js_sin, wrap_variant, PI};
use super::object::DecorObject;
use super::parts::{rgb, vertex_color_material, Parts, V3};

/// `LICZBA_WARIANTOW_LASU` (`:88`).
pub const LICZBA_WARIANTOW_LASU: usize = 5;
/// `LAS_MAX_Y` (`:91`).
pub const LAS_MAX_Y: f64 = 0.90;
/// `LAS_FOOTPRINT_R` (`:94`).
pub const LAS_FOOTPRINT_R: f64 = 0.84;
/// `SOL_WARIANT_LASU` (`:97`).
pub const SOL_WARIANT_LASU: i32 = 1301;
/// `SOL_ROTACJA_LASU` (`:98`).
pub const SOL_ROTACJA_LASU: i32 = 1307;

/// `wariantLasuDlaHeksa(q, r, liczbaWariantow = 5, seed = 0)` (`:117-124`).
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub fn wariant_lasu_dla_heksa(q: i32, r: i32, liczba_wariantow: usize, seed: i32) -> usize {
    floor_index(hash_heksa(q, r, seed, SOL_WARIANT_LASU) * liczba_wariantow as f64)
}

/// `rotacjaLasuDlaHeksa(q, r, seed = 0)` (`:127-129`).
#[must_use]
pub fn rotacja_lasu_dla_heksa(q: i32, r: i32, seed: i32) -> f64 {
    (hash_heksa(q, r, seed, SOL_ROTACJA_LASU) * 6.0).floor() * (PI / 3.0)
}

const Z0: u32 = 0x2d_4a32;
const Z1: u32 = 0x3d_6b45;
const Z2: u32 = 0x4a_7a52;
const Z3: u32 = 0x5a_8f5a;
const Z4: u32 = 0x6b_9f62;
const Z_BRZOZA: u32 = 0xa8_d4a0;
const PIEN_DAB: u32 = 0x7a_5a32;
const PIEN_SOSNA: u32 = 0x8b_5a2b;
const PIEN_CIEMNY: u32 = 0x5a_4028;
const PIEN_CHLODNY: u32 = 0x6a_5040;
const PIEN_BRZOZA: u32 = 0xc4_b498;
const KORA_WYREBU: u32 = 0x8a_5a2e;
const PRZEKROJ_PNIA: u32 = 0xe8_b46b;
const POSZYCIE_CIEMNE: u32 = 0x3d_6b45;
const KEPKA_TRAWY: u32 = 0x6b_9f62;

/// `ringN(n, cx, cz, r, yaw)` (`:182-189`): `a = yaw + i * (Math.PI * 2 / n)`.
#[allow(clippy::cast_precision_loss)]
pub(crate) fn ring_n(n: usize, cx: f64, cz: f64, r: f64, yaw: f64) -> Vec<[f64; 2]> {
    (0..n)
        .map(|i| {
            let a = yaw + i as f64 * (PI * 2.0 / n as f64);
            [cx + r * js_sin(a), cz + r * js_cos(a)]
        })
        .collect()
}

/// `pien(...)` (`:195-208`, default `n = 4`; `djungla-modele.ts:71-84` has
/// default `n = 5` and the same body).
#[allow(clippy::too_many_arguments)]
pub(crate) fn pien(
    p: &mut Parts,
    cx: f64,
    cz: f64,
    y0: f64,
    h: f64,
    rb: f64,
    rt: f64,
    col_hex: u32,
    yaw: f64,
    n: usize,
) {
    let col = rgb(col_hex);
    let bot = ring_n(n, cx, cz, rb, yaw);
    let top = ring_n(n, cx, cz, rt, yaw);
    for i in 0..n {
        let j = (i + 1) % n;
        let b0: V3 = [bot[i][0], y0, bot[i][1]];
        let b1: V3 = [bot[j][0], y0, bot[j][1]];
        let t0: V3 = [top[i][0], y0 + h, top[i][1]];
        let t1: V3 = [top[j][0], y0 + h, top[j][1]];
        let r: V3 = [(b0[0] + b1[0]) / 2.0 - cx, 0.0, (b0[2] + b1[2]) / 2.0 - cz];
        p.tri(b0, b1, t1, col, r);
        p.tri(b0, t1, t0, col, r);
    }
}

/// `BLOB_JIT` (`:211`).
const BLOB_JIT: [f64; 6] = [1.0, 0.86, 1.10, 0.92, 1.06, 0.88];

/// `blob(...)` (`:217-235`; identical in `djungla-modele.ts:101-119`).
#[allow(clippy::too_many_arguments)]
pub(crate) fn blob(
    p: &mut Parts,
    cx: f64,
    cy: f64,
    cz: f64,
    rx: f64,
    rz: f64,
    h_up: f64,
    h_dn: f64,
    col_hex: u32,
    yaw: f64,
    apex_ox: f64,
    apex_oz: f64,
) {
    let col = rgb(col_hex);
    let pts: Vec<[f64; 2]> = (0..6)
        .map(|i| {
            let a = yaw + f64::from(i) * PI / 3.0;
            let jit = BLOB_JIT[i as usize];
            [cx + rx * jit * js_sin(a), cz + rz * jit * js_cos(a)]
        })
        .collect();
    let t: V3 = [cx + apex_ox, cy + h_up, cz + apex_oz];
    let b: V3 = [cx - apex_ox * 0.5, cy - h_dn, cz - apex_oz * 0.5];
    for i in 0..6 {
        let j = (i + 1) % 6;
        let v0: V3 = [pts[i][0], cy, pts[i][1]];
        let v1: V3 = [pts[j][0], cy, pts[j][1]];
        let r: V3 = [(v0[0] + v1[0]) / 2.0 - cx, 0.0, (v0[2] + v1[2]) / 2.0 - cz];
        p.tri(v0, v1, t, col, r);
        p.tri(v1, v0, b, col, r);
    }
}

/// `cone(...)` (`:238-249`; identical in `djungla-modele.ts:86-97`).
#[allow(clippy::too_many_arguments)]
pub(crate) fn cone(
    p: &mut Parts,
    cx: f64,
    cz: f64,
    y0: f64,
    h: f64,
    r: f64,
    col_hex: u32,
    yaw: f64,
    apex_ox: f64,
    apex_oz: f64,
) {
    let col = rgb(col_hex);
    let bot = ring_n(6, cx, cz, r, yaw);
    let a: V3 = [cx + apex_ox, y0 + h, cz + apex_oz];
    for i in 0..6 {
        let j = (i + 1) % 6;
        let b0: V3 = [bot[i][0], y0, bot[i][1]];
        let b1: V3 = [bot[j][0], y0, bot[j][1]];
        let rf: V3 = [(b0[0] + b1[0]) / 2.0 - cx, 0.0, (b0[2] + b1[2]) / 2.0 - cz];
        p.tri(b0, b1, a, col, rf);
    }
}

/// `pieniek(...)` (`:255-272`).
fn pieniek(p: &mut Parts, cx: f64, cz: f64, r: f64, h: f64, yaw: f64) {
    let kora = rgb(KORA_WYREBU);
    let przekroj = rgb(PRZEKROJ_PNIA);
    let bot = ring_n(6, cx, cz, r * 1.12, yaw);
    let top = ring_n(6, cx, cz, r, yaw);
    for i in 0..6 {
        let j = (i + 1) % 6;
        let b0: V3 = [bot[i][0], 0.0, bot[i][1]];
        let b1: V3 = [bot[j][0], 0.0, bot[j][1]];
        let t0: V3 = [top[i][0], h, top[i][1]];
        let t1: V3 = [top[j][0], h, top[j][1]];
        let rf: V3 = [(b0[0] + b1[0]) / 2.0 - cx, 0.0, (b0[2] + b1[2]) / 2.0 - cz];
        p.tri(b0, b1, t1, kora, rf);
        p.tri(b0, t1, t0, kora, rf);
    }
    let c: V3 = [cx, h, cz];
    for i in 0..6 {
        let j = (i + 1) % 6;
        p.tri(
            c,
            [top[i][0], h, top[i][1]],
            [top[j][0], h, top[j][1]],
            przekroj,
            [0.0, 1.0, 0.0],
        );
    }
}

/// `kloda(...)` (`:275-299`).
fn kloda(p: &mut Parts, cx: f64, cz: f64, dl: f64, r: f64, yaw: f64) {
    let kora = rgb(KORA_WYREBU);
    let przekroj = rgb(PRZEKROJ_PNIA);
    let ux = js_sin(yaw);
    let uz = js_cos(yaw);
    let ends: [[f64; 2]; 2] = [
        [cx - ux * dl / 2.0, cz - uz * dl / 2.0],
        [cx + ux * dl / 2.0, cz + uz * dl / 2.0],
    ];
    let prof: Vec<V3> = (0..6)
        .map(|i| {
            let a = f64::from(i) * PI / 3.0 + 0.26;
            [js_cos(a) * r, js_sin(a) * r + r * 0.92, 0.0]
        })
        .collect();
    let ring = |e: usize| -> Vec<V3> {
        prof.iter()
            .map(|q| [ends[e][0] + q[0] * uz, q[1], ends[e][1] - q[0] * ux])
            .collect()
    };
    let r0 = ring(0);
    let r1 = ring(1);
    for i in 0..6 {
        let j = (i + 1) % 6;
        let mid: V3 = [
            (r0[i][0] + r0[j][0]) / 2.0 - cx,
            r0[i][1] + r0[j][1] - r * 1.84,
            (r0[i][2] + r0[j][2]) / 2.0 - cz,
        ];
        p.tri(r0[i], r0[j], r1[j], kora, mid);
        p.tri(r0[i], r1[j], r1[i], kora, mid);
    }
    for i in 1..5 {
        p.tri(r0[0], r0[i], r0[i + 1], przekroj, [-ux, 0.0, -uz]);
        p.tri(r1[0], r1[i], r1[i + 1], przekroj, [ux, 0.0, uz]);
    }
}

/// `drzewoLisciaste(...)` (`:309-320`); `lisc2 = 0` means a single crown.
#[allow(clippy::too_many_arguments)]
fn drzewo_lisciaste(
    p: &mut Parts,
    x: f64,
    z: f64,
    hh: f64,
    yaw: f64,
    pien_hex: u32,
    lisc1: u32,
    lisc2: u32,
    pien_boki: usize,
) {
    pien(
        p,
        x,
        z,
        0.0,
        0.46 * hh,
        0.024 + 0.042 * hh,
        0.018 + 0.030 * hh,
        pien_hex,
        yaw,
        pien_boki,
    );
    if lisc2 != 0 {
        blob(
            p,
            x,
            0.64 * hh,
            z,
            0.30 * hh,
            0.30 * hh,
            0.36 * hh,
            0.30 * hh,
            lisc1,
            yaw,
            0.05 * hh,
            -0.03 * hh,
        );
        let bx = x + js_sin(yaw + 1.25) * 0.16 * hh;
        let bz = z + js_cos(yaw + 1.25) * 0.16 * hh;
        blob(
            p,
            bx,
            0.48 * hh,
            bz,
            0.18 * hh,
            0.18 * hh,
            0.22 * hh,
            0.20 * hh,
            lisc2,
            yaw + 0.5,
            -0.03 * hh,
            0.02 * hh,
        );
    } else {
        blob(
            p,
            x,
            0.62 * hh,
            z,
            0.28 * hh,
            0.28 * hh,
            0.38 * hh,
            0.28 * hh,
            lisc1,
            yaw,
            0.04 * hh,
            0.03 * hh,
        );
    }
}

/// `swierk(...)` (`:323-334`).
#[allow(clippy::too_many_arguments)]
fn swierk(p: &mut Parts, x: f64, z: f64, hh: f64, yaw: f64, pien_hex: u32, tiery3: bool) {
    pien(
        p,
        x,
        z,
        0.0,
        0.20 * hh,
        0.020 + 0.030 * hh,
        0.016 + 0.020 * hh,
        pien_hex,
        yaw,
        4,
    );
    if tiery3 {
        cone(
            p,
            x,
            z,
            0.10 * hh,
            0.38 * hh,
            0.30 * hh,
            Z0,
            yaw,
            0.02 * hh,
            0.01 * hh,
        );
        cone(
            p,
            x,
            z,
            0.34 * hh,
            0.36 * hh,
            0.22 * hh,
            Z1,
            yaw + 0.35,
            0.015 * hh,
            -0.01 * hh,
        );
        cone(
            p,
            x,
            z,
            0.58 * hh,
            0.42 * hh,
            0.15 * hh,
            Z2,
            yaw + 0.7,
            0.01 * hh,
            0.01 * hh,
        );
    } else {
        cone(
            p,
            x,
            z,
            0.08 * hh,
            0.46 * hh,
            0.27 * hh,
            Z0,
            yaw,
            0.02 * hh,
            -0.01 * hh,
        );
        cone(
            p,
            x,
            z,
            0.42 * hh,
            0.58 * hh,
            0.18 * hh,
            Z1,
            yaw + 0.4,
            0.015 * hh,
            0.01 * hh,
        );
    }
}

/// `kepka(...)` (`:337-339`).
fn kepka(p: &mut Parts, x: f64, z: f64, r: f64, h: f64, col_hex: u32, yaw: f64) {
    cone(p, x, z, 0.0, h, r, col_hex, yaw, 0.15 * r, 0.1 * r);
}

/// `czesciLasu(w)` (`:345-398`).
fn czesci_lasu(w: usize) -> Parts {
    let mut p = Parts::default();
    let p = &mut p;
    match w {
        0 => {
            drzewo_lisciaste(p, 0.44, 0.25, 0.90, 0.3, PIEN_DAB, Z3, Z4, 4);
            drzewo_lisciaste(p, -0.41, 0.33, 0.84, 2.1, PIEN_DAB, Z2, Z3, 4);
            drzewo_lisciaste(p, -0.52, -0.24, 0.70, 4.0, PIEN_CIEMNY, Z3, 0, 4);
            drzewo_lisciaste(p, 0.15, -0.55, 0.74, 1.2, PIEN_BRZOZA, Z_BRZOZA, 0, 4);
            drzewo_lisciaste(p, 0.57, -0.25, 0.58, 5.1, PIEN_DAB, Z2, 0, 4);
            drzewo_lisciaste(p, -0.12, 0.06, 0.52, 2.8, PIEN_CIEMNY, Z4, 0, 4);
        }
        1 => {
            drzewo_lisciaste(p, 0.40, 0.34, 0.88, 1.0, PIEN_CIEMNY, Z1, Z2, 4);
            drzewo_lisciaste(p, 0.62, -0.08, 0.64, 2.6, PIEN_CIEMNY, Z2, 0, 4);
            drzewo_lisciaste(p, -0.58, 0.18, 0.60, 4.4, PIEN_CIEMNY, Z1, 0, 4);
            drzewo_lisciaste(p, -0.24, -0.54, 0.66, 0.7, PIEN_CHLODNY, Z2, 0, 4);
            drzewo_lisciaste(p, 0.06, 0.60, 0.58, 3.4, PIEN_CIEMNY, Z1, 0, 3);
            drzewo_lisciaste(p, -0.46, 0.48, 0.54, 5.6, PIEN_CIEMNY, Z0, 0, 3);
            drzewo_lisciaste(p, 0.30, -0.52, 0.56, 1.9, PIEN_CHLODNY, Z1, 0, 3);
            drzewo_lisciaste(p, -0.05, -0.06, 0.50, 4.9, PIEN_CIEMNY, Z2, 0, 3);
            kepka(p, 0.20, 0.10, 0.09, 0.11, POSZYCIE_CIEMNE, 0.8);
            kepka(p, -0.35, -0.28, 0.08, 0.10, POSZYCIE_CIEMNE, 2.2);
        }
        2 => {
            swierk(p, 0.48, 0.30, 0.86, 0.4, PIEN_SOSNA, true);
            swierk(p, -0.50, 0.30, 0.80, 2.3, PIEN_CHLODNY, true);
            swierk(p, -0.30, -0.49, 0.84, 4.1, PIEN_SOSNA, true);
            swierk(p, 0.26, -0.53, 0.76, 1.5, PIEN_CHLODNY, true);
            swierk(p, 0.66, -0.14, 0.56, 3.0, PIEN_SOSNA, false);
            swierk(p, -0.68, -0.06, 0.52, 5.2, PIEN_CHLODNY, false);
            swierk(p, 0.02, 0.04, 0.55, 2.0, PIEN_SOSNA, false);
        }
        3 => {
            drzewo_lisciaste(p, 0.48, 0.32, 0.86, 0.9, PIEN_DAB, Z3, Z4, 4);
            drzewo_lisciaste(p, 0.58, -0.32, 0.60, 2.7, PIEN_DAB, Z4, 0, 4);
            drzewo_lisciaste(p, -0.10, 0.04, 0.52, 4.6, PIEN_CIEMNY, Z3, 0, 4);
            swierk(p, -0.50, 0.28, 0.82, 1.1, PIEN_CHLODNY, true);
            swierk(p, 0.04, -0.58, 0.78, 3.8, PIEN_SOSNA, true);
            swierk(p, -0.56, -0.40, 0.56, 5.5, PIEN_CHLODNY, false);
            kepka(p, -0.30, 0.55, 0.08, 0.10, POSZYCIE_CIEMNE, 1.4);
        }
        _ => {
            drzewo_lisciaste(p, 0.48, 0.29, 0.78, 0.6, PIEN_DAB, Z3, Z4, 4);
            swierk(p, -0.50, -0.32, 0.74, 2.9, PIEN_SOSNA, true);
            drzewo_lisciaste(p, -0.42, 0.50, 0.56, 4.3, PIEN_CIEMNY, Z4, 0, 4);
            pieniek(p, 0.12, -0.06, 0.070, 0.100, 0.5);
            pieniek(p, -0.12, -0.52, 0.060, 0.085, 2.4);
            pieniek(p, 0.52, -0.42, 0.065, 0.090, 4.0);
            kloda(p, 0.24, -0.30, 0.46, 0.055, 0.95);
            kepka(p, 0.02, 0.42, 0.075, 0.09, KEPKA_TRAWY, 3.1);
        }
    }
    std::mem::take(p)
}

/// `lasGeometria(wariant)` (`:416-420`): shared, built once per variant.
#[must_use]
pub fn las_geometria(wariant: i32) -> Arc<Geometry> {
    static CACHE: OnceLock<Vec<Arc<Geometry>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| {
        (0..LICZBA_WARIANTOW_LASU)
            .map(|w| Arc::new(czesci_lasu(w).into_geometry()))
            .collect()
    });
    Arc::clone(&cache[wrap_variant(wariant, 5)])
}

/// `LAS_MATERIAL` (`:423-426`).
#[must_use]
pub fn las_material() -> Material {
    vertex_color_material()
}

/// `buildLas(wariant)` (`:429-435`): mesh, `castShadow`/`receiveShadow`,
/// `name = "las-l<w>"`.
#[must_use]
pub fn build_las(wariant: i32) -> DecorObject {
    let mut m = Scene::mesh_root(las_geometria(wariant), las_material());
    m.root_mut().shadows(true, true);
    m.named(&format!("las-l{}", wrap_variant(wariant, 5)))
}

/// `trojkatyLasu(wariant)` (`:438-440`).
#[must_use]
pub fn trojkaty_lasu(wariant: i32) -> usize {
    las_geometria(wariant).mesh.vertex_count() / 3
}
