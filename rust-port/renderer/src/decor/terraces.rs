//! `render/tarasy-model.ts` (web `edb8fb56`): the "tarasy" improvement as an
//! overlay on hill variants W0 / W3 — 2 shared vertex-colour geometries.
//!
//! Line references are to `gra/src/render/tarasy-model.ts`.

use std::sync::{Arc, OnceLock};

use crate::core::scene::{Geometry, Material, SceneNode};
use crate::pick::terrain::hash_heksa;

use super::js::{js_cos, js_hypot, js_sin, PI};
use super::object::{DecorObject, GroupBuilder};
use super::parts::{rgb, vertex_color_material, Parts, V3};

const MUR_SCIANA: u32 = 0x9a_a5b1;
const MUR_KORONA: u32 = 0xa9_b3bf;
const MUR_CIEN: u32 = 0x71_7d89;
const GLEBA: u32 = 0x8a_6a45;
const UPRAWA_ZBOZE: [u32; 2] = [0xe9_c34e, 0xc9_9f35];
const UPRAWA_SREDNIA: [u32; 2] = [0xa9_c93f, 0x8f_b32f];
const UPRAWA_MLODA: [u32; 2] = [0x5e_c74a, 0x4b_b03a];

/// Hill variant carrying terraces (`0 | 3`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum TarasyWariant {
    /// `0` — mound with the ramp.
    W0,
    /// `3` — cone with the shelf.
    W3,
}

impl TarasyWariant {
    /// The web number (`0` or `3`).
    #[must_use]
    pub fn web(self) -> u8 {
        match self {
            Self::W0 => 0,
            Self::W3 => 3,
        }
    }
}

/// `tarasyWariantDlaHeksa(q, r, seed = 0)` (`:106-108`, salt 737).
#[must_use]
pub fn tarasy_wariant_dla_heksa(q: i32, r: i32, seed: i32) -> TarasyWariant {
    if hash_heksa(q, r, seed, 737) < 0.5 {
        TarasyWariant::W0
    } else {
        TarasyWariant::W3
    }
}

/// `punktLuku(r, aDeg)` (`:141-148`).
fn punkt_luku(r: f64, a_deg: f64) -> [f64; 2] {
    let k = (a_deg / 60.0).floor();
    let f = (a_deg - k * 60.0) / 60.0;
    let a0 = k * (PI / 3.0);
    let a1 = (k + 1.0) * (PI / 3.0);
    let x0 = r * js_sin(a0);
    let z0 = r * js_cos(a0);
    let x1 = r * js_sin(a1);
    let z1 = r * js_cos(a1);
    [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f]
}

/// `stacjeLuku(aOd, aDo)` (`:151-158`).
fn stacje_luku(a_od: f64, a_do: f64) -> Vec<f64> {
    let mut st = vec![a_od];
    let mut k = (a_od / 60.0).ceil() * 60.0;
    while k < a_do {
        if k > a_od + 0.001 {
            st.push(k);
        }
        k += 60.0;
    }
    st.push(a_do);
    st
}

/// `PolkaOpts` (`:160-173`).
struct Polka {
    a_od: f64,
    a_do: f64,
    y_pole: f64,
    y_bot: f64,
    r_in: f64,
    r_out: f64,
    t_mur: f64,
    h_mur: f64,
    h_rzad: f64,
    uprawa: [u32; 2],
    faza: usize,
}

/// `polka(P, o)` (`:180-225`).
fn polka(p: &mut Parts, o: &Polka) {
    let st = stacje_luku(o.a_od, o.a_do);
    let r_mur_in = o.r_out - o.t_mur;
    let y_mur = o.y_pole + o.h_mur;
    let r_rz_a = o.r_in + 0.022;
    let r_rz_b = r_mur_in - 0.018;
    let r_rz_m = (r_rz_a + r_rz_b) / 2.0;
    let y_rz = o.y_pole + o.h_rzad;
    let c_mur = rgb(MUR_SCIANA);
    let c_kor = rgb(MUR_KORONA);
    let c_cien = rgb(MUR_CIEN);
    let c_gleba = rgb(GLEBA);
    let yp = o.y_pole;
    for i in 0..st.len() - 1 {
        let [xo0, zo0] = punkt_luku(o.r_out, st[i]);
        let [xo1, zo1] = punkt_luku(o.r_out, st[i + 1]);
        let [xm0, zm0] = punkt_luku(r_mur_in, st[i]);
        let [xm1, zm1] = punkt_luku(r_mur_in, st[i + 1]);
        let [xi0, zi0] = punkt_luku(o.r_in, st[i]);
        let [xi1, zi1] = punkt_luku(o.r_in, st[i + 1]);
        let [xa0, za0] = punkt_luku(r_rz_a, st[i]);
        let [xa1, za1] = punkt_luku(r_rz_a, st[i + 1]);
        let [xb0, zb0] = punkt_luku(r_rz_b, st[i]);
        let [xb1, zb1] = punkt_luku(r_rz_b, st[i + 1]);
        let [xc0, zc0] = punkt_luku(r_rz_m, st[i]);
        let [xc1, zc1] = punkt_luku(r_rz_m, st[i + 1]);
        let ref_out: V3 = [(xo0 + xo1) / 2.0, 0.0, (zo0 + zo1) / 2.0];
        let ref_in: V3 = [-ref_out[0], 0.0, -ref_out[2]];
        let up: V3 = [0.0, 1.0, 0.0];
        p.quad(
            [xo0, o.y_bot, zo0],
            [xo1, o.y_bot, zo1],
            [xo1, y_mur, zo1],
            [xo0, y_mur, zo0],
            c_mur,
            ref_out,
        );
        p.quad(
            [xo0, y_mur, zo0],
            [xo1, y_mur, zo1],
            [xm1, y_mur, zm1],
            [xm0, y_mur, zm0],
            c_kor,
            up,
        );
        p.quad(
            [xm0, y_mur, zm0],
            [xm1, y_mur, zm1],
            [xm1, yp, zm1],
            [xm0, yp, zm0],
            c_cien,
            ref_in,
        );
        p.quad(
            [xi0, yp, zi0],
            [xi1, yp, zi1],
            [xm1, yp, zm1],
            [xm0, yp, zm0],
            c_gleba,
            up,
        );
        let c_rz = rgb(o.uprawa[(i + o.faza) % 2]);
        p.quad(
            [xa0, yp, za0],
            [xa1, yp, za1],
            [xc1, y_rz, zc1],
            [xc0, y_rz, zc0],
            c_rz,
            up,
        );
        p.quad(
            [xc0, y_rz, zc0],
            [xc1, y_rz, zc1],
            [xb1, yp, zb1],
            [xb0, yp, zb0],
            c_rz,
            up,
        );
    }
    for koniec in [0, 1] {
        let a = if koniec == 0 { o.a_od } else { o.a_do };
        let a_ref = if koniec == 0 {
            o.a_od - 8.0
        } else {
            o.a_do + 8.0
        };
        let [xr, zr] = punkt_luku(1.0, a_ref);
        let [xs, zs] = punkt_luku(1.0, a);
        let rf: V3 = [xr - xs, 0.0, zr - zs];
        let [xo, zo] = punkt_luku(o.r_out, a);
        let [xi, zi] = punkt_luku(o.r_in, a);
        p.quad(
            [xi, o.y_bot, zi],
            [xo, o.y_bot, zo],
            [xo, y_mur, zo],
            [xi, y_mur, zi],
            rgb(MUR_SCIANA),
            rf,
        );
        let [xa, za] = punkt_luku(r_rz_a, a);
        let [xb, zb] = punkt_luku(r_rz_b, a);
        let [xc, zc] = punkt_luku(r_rz_m, a);
        p.tri(
            [xa, yp, za],
            [xb, yp, zb],
            [xc, y_rz, zc],
            rgb(o.uprawa[1]),
            rf,
        );
    }
}

/// `schodekRampy(P, x, ySurf, w)` (`:228-236`).
fn schodek_rampy(p: &mut Parts, x: f64, y_surf: f64, w: f64) {
    let half = 0.026;
    let y_t = y_surf + 0.024;
    let y_b = y_surf - 0.026;
    let c_t = rgb(MUR_KORONA);
    let c_f = rgb(MUR_SCIANA);
    let c_s = rgb(MUR_CIEN);
    let x0 = x - half;
    let x1 = x + half;
    p.quad(
        [x0, y_t, -w],
        [x1, y_t, -w],
        [x1, y_t, w],
        [x0, y_t, w],
        c_t,
        [0.0, 1.0, 0.0],
    );
    p.quad(
        [x1, y_t, -w],
        [x1, y_b, -w],
        [x1, y_b, w],
        [x1, y_t, w],
        c_f,
        [1.0, 0.0, 0.0],
    );
    p.quad(
        [x0, y_t, -w],
        [x1, y_t, -w],
        [x1, y_b, -w],
        [x0, y_b, -w],
        c_s,
        [0.0, 0.0, -1.0],
    );
    p.quad(
        [x0, y_t, w],
        [x1, y_t, w],
        [x1, y_b, w],
        [x0, y_b, w],
        c_s,
        [0.0, 0.0, 1.0],
    );
}

/// `przelaz(P, aDeg, rZew, rWew, yTop, yBot, halfT)` (`:242-258`).
#[allow(clippy::too_many_arguments)]
fn przelaz(p: &mut Parts, a_deg: f64, r_zew: f64, r_wew: f64, y_top: f64, y_bot: f64, half_t: f64) {
    let [nx0, nz0] = punkt_luku(1.0, a_deg);
    let l = js_hypot(nx0, nz0);
    let nx = nx0 / l;
    let nz = nz0 / l;
    let tx = -nz;
    let tz = nx;
    let pt = |r: f64, t: f64| -> [f64; 2] {
        let [cx, cz] = punkt_luku(r, a_deg);
        [cx + tx * t, cz + tz * t]
    };
    let (ao0, ao1) = (pt(r_zew, -half_t), pt(r_zew, half_t));
    let (ai0, ai1) = (pt(r_wew, -half_t), pt(r_wew, half_t));
    let c_t = rgb(MUR_KORONA);
    let c_f = rgb(MUR_SCIANA);
    let c_s = rgb(MUR_CIEN);
    p.quad(
        [ai0[0], y_top, ai0[1]],
        [ao0[0], y_top, ao0[1]],
        [ao1[0], y_top, ao1[1]],
        [ai1[0], y_top, ai1[1]],
        c_t,
        [0.0, 1.0, 0.0],
    );
    p.quad(
        [ao0[0], y_top, ao0[1]],
        [ao0[0], y_bot, ao0[1]],
        [ao1[0], y_bot, ao1[1]],
        [ao1[0], y_top, ao1[1]],
        c_f,
        [nx, 0.0, nz],
    );
    p.quad(
        [ai0[0], y_top, ai0[1]],
        [ao0[0], y_top, ao0[1]],
        [ao0[0], y_bot, ao0[1]],
        [ai0[0], y_bot, ai0[1]],
        c_s,
        [-tx, 0.0, -tz], // `tx * -1` (same bits, incl. -0)
    );
    p.quad(
        [ai1[0], y_top, ai1[1]],
        [ao1[0], y_top, ao1[1]],
        [ao1[0], y_bot, ao1[1]],
        [ai1[0], y_bot, ai1[1]],
        c_s,
        [tx, 0.0, tz],
    );
}

/// `rzadekX(P, x0, x1, z, halfW, y0, h, colHex)` (`:261-268`).
#[allow(clippy::too_many_arguments)]
fn rzadek_x(p: &mut Parts, x0: f64, x1: f64, z: f64, half_w: f64, y0: f64, h: f64, col_hex: u32) {
    let c = rgb(col_hex);
    let z_a = z - half_w;
    let z_b = z + half_w;
    let y_t = y0 + h;
    p.quad(
        [x0, y0, z_a],
        [x1, y0, z_a],
        [x1, y_t, z],
        [x0, y_t, z],
        c,
        [0.0, 1.0, 0.0],
    );
    p.quad(
        [x0, y_t, z],
        [x1, y_t, z],
        [x1, y0, z_b],
        [x0, y0, z_b],
        c,
        [0.0, 1.0, 0.0],
    );
    p.tri(
        [x0, y0, z_a],
        [x0, y0, z_b],
        [x0, y_t, z],
        c,
        [-1.0, 0.0, 0.0],
    );
    p.tri(
        [x1, y0, z_a],
        [x1, y0, z_b],
        [x1, y_t, z],
        c,
        [1.0, 0.0, 0.0],
    );
}

#[allow(clippy::too_many_arguments)]
fn pk(
    a_od: f64,
    a_do: f64,
    y_pole: f64,
    y_bot: f64,
    r_in: f64,
    r_out: f64,
    t_mur: f64,
    h_mur: f64,
    h_rzad: f64,
    uprawa: [u32; 2],
    faza: usize,
) -> Polka {
    Polka {
        a_od,
        a_do,
        y_pole,
        y_bot,
        r_in,
        r_out,
        t_mur,
        h_mur,
        h_rzad,
        uprawa,
        faza,
    }
}

/// `czesciTarasyW0()` (`:274-291`).
fn czesci_tarasy_w0() -> Parts {
    let mut parts = Parts::default();
    let p = &mut parts;
    polka(
        p,
        &pk(
            -30.0,
            60.0,
            0.144,
            0.065,
            0.63,
            0.78,
            0.034,
            0.030,
            0.050,
            UPRAWA_ZBOZE,
            0,
        ),
    );
    polka(
        p,
        &pk(
            120.0,
            198.0,
            0.144,
            0.065,
            0.63,
            0.78,
            0.034,
            0.030,
            0.050,
            UPRAWA_ZBOZE,
            1,
        ),
    );
    polka(
        p,
        &pk(
            2.0,
            60.0,
            0.244,
            0.162,
            0.435,
            0.60,
            0.034,
            0.030,
            0.046,
            UPRAWA_SREDNIA,
            1,
        ),
    );
    polka(
        p,
        &pk(
            120.0,
            178.0,
            0.244,
            0.162,
            0.435,
            0.60,
            0.034,
            0.030,
            0.046,
            UPRAWA_SREDNIA,
            0,
        ),
    );
    polka(
        p,
        &pk(
            6.0,
            58.0,
            0.334,
            0.242,
            0.285,
            0.44,
            0.030,
            0.026,
            0.042,
            UPRAWA_MLODA,
            0,
        ),
    );
    polka(
        p,
        &pk(
            123.0,
            176.0,
            0.334,
            0.242,
            0.285,
            0.44,
            0.030,
            0.026,
            0.042,
            UPRAWA_MLODA,
            1,
        ),
    );
    schodek_rampy(p, 0.720, 0.072, 0.130);
    schodek_rampy(p, 0.550, 0.190, 0.108);
    schodek_rampy(p, 0.395, 0.285, 0.088);
    schodek_rampy(p, 0.285, 0.361, 0.072);
    parts
}

/// `czesciTarasyW3()` (`:297-351`).
fn czesci_tarasy_w3() -> Parts {
    let mut parts = Parts::default();
    let p = &mut parts;
    polka(
        p,
        &pk(
            -28.0,
            60.0,
            0.114,
            0.055,
            0.545,
            0.70,
            0.034,
            0.030,
            0.050,
            UPRAWA_ZBOZE,
            0,
        ),
    );
    polka(
        p,
        &pk(
            120.0,
            206.0,
            0.114,
            0.055,
            0.545,
            0.70,
            0.034,
            0.030,
            0.050,
            UPRAWA_ZBOZE,
            1,
        ),
    );
    polka(
        p,
        &pk(
            2.0,
            60.0,
            0.206,
            0.118,
            0.395,
            0.55,
            0.034,
            0.030,
            0.046,
            UPRAWA_SREDNIA,
            1,
        ),
    );
    polka(
        p,
        &pk(
            120.0,
            178.0,
            0.206,
            0.118,
            0.395,
            0.55,
            0.034,
            0.030,
            0.046,
            UPRAWA_SREDNIA,
            0,
        ),
    );
    polka(
        p,
        &pk(
            8.0,
            56.0,
            0.288,
            0.20,
            0.272,
            0.41,
            0.030,
            0.026,
            0.042,
            UPRAWA_MLODA,
            0,
        ),
    );
    polka(
        p,
        &pk(
            124.0,
            174.0,
            0.288,
            0.20,
            0.272,
            0.41,
            0.030,
            0.026,
            0.042,
            UPRAWA_MLODA,
            1,
        ),
    );
    przelaz(p, 30.0, 0.545, 0.48, 0.170, 0.106, 0.055);
    przelaz(p, 150.0, 0.545, 0.48, 0.170, 0.106, 0.055);

    let y_p = 0.221;
    let c_g = rgb(GLEBA);
    p.quad(
        [0.30, y_p, -0.14],
        [0.74, y_p, -0.14],
        [0.74, y_p, 0.14],
        [0.30, y_p, 0.14],
        c_g,
        [0.0, 1.0, 0.0],
    );
    rzadek_x(
        p,
        0.315,
        0.725,
        -0.093,
        0.040,
        y_p,
        0.040,
        UPRAWA_SREDNIA[0],
    );
    rzadek_x(p, 0.315, 0.725, 0.0, 0.042, y_p, 0.046, UPRAWA_ZBOZE[0]);
    rzadek_x(p, 0.315, 0.725, 0.093, 0.040, y_p, 0.038, UPRAWA_MLODA[0]);

    {
        let (cx, r_t, sz_t) = (0.52, 0.34, 0.72);
        let rogi: Vec<[f64; 2]> = (0..=3)
            .map(|k| {
                let a = f64::from(k) * (PI / 3.0);
                [cx + r_t * js_sin(a), r_t * sz_t * js_cos(a)]
            })
            .collect();
        let (y0, y1, t_w) = (0.215, 0.244, 0.941);
        let c_m = rgb(MUR_SCIANA);
        let c_k = rgb(MUR_KORONA);
        let c_c = rgb(MUR_CIEN);
        for k in 0..3 {
            let [x_a, z_a] = rogi[k];
            let [x_b, z_b] = rogi[k + 1];
            let x_ai = cx + (x_a - cx) * t_w;
            let z_ai = z_a * t_w;
            let x_bi = cx + (x_b - cx) * t_w;
            let z_bi = z_b * t_w;
            let rf: V3 = [(x_a + x_b) / 2.0 - cx, 0.0, (z_a + z_b) / 2.0];
            p.quad(
                [x_a, y0, z_a],
                [x_b, y0, z_b],
                [x_b, y1, z_b],
                [x_a, y1, z_a],
                c_m,
                rf,
            );
            p.quad(
                [x_a, y1, z_a],
                [x_b, y1, z_b],
                [x_bi, y1, z_bi],
                [x_ai, y1, z_ai],
                c_k,
                [0.0, 1.0, 0.0],
            );
            p.quad(
                [x_ai, y1, z_ai],
                [x_bi, y1, z_bi],
                [x_bi, y0, z_bi],
                [x_ai, y0, z_ai],
                c_c,
                [-rf[0], 0.0, -rf[2]],
            );
        }
        for k in [0usize, 3] {
            let [x_a, z_a] = rogi[k];
            let x_ai = cx + (x_a - cx) * t_w;
            let z_ai = z_a * t_w;
            let rf: V3 = [0.0, 0.0, if k == 0 { 1.0 } else { -1.0 }];
            p.quad(
                [x_a, y0, z_a],
                [x_ai, y0, z_ai],
                [x_ai, y1, z_ai],
                [x_a, y1, z_a],
                c_m,
                rf,
            );
        }
    }
    parts
}

/// `tarasyGeometria(wariantWzgorza)` (`:369-376`).
#[must_use]
pub fn tarasy_geometria(w: TarasyWariant) -> Arc<Geometry> {
    static W0: OnceLock<Arc<Geometry>> = OnceLock::new();
    static W3: OnceLock<Arc<Geometry>> = OnceLock::new();
    match w {
        TarasyWariant::W0 => {
            Arc::clone(W0.get_or_init(|| Arc::new(czesci_tarasy_w0().into_geometry())))
        }
        TarasyWariant::W3 => {
            Arc::clone(W3.get_or_init(|| Arc::new(czesci_tarasy_w3().into_geometry())))
        }
    }
}

/// `TARASY_MATERIAL` (`:379-382`).
#[must_use]
pub fn tarasy_material() -> Material {
    vertex_color_material()
}

/// `buildTarasy(wariantWzgorza)` (`:389-398`): a `Group` named like its
/// single mesh (`tarasy-w0` / `tarasy-w3`).
#[must_use]
pub fn build_tarasy(w: TarasyWariant) -> DecorObject {
    let name = match w {
        TarasyWariant::W0 => "tarasy-w0",
        TarasyWariant::W3 => "tarasy-w3",
    };
    let mut m = SceneNode::mesh(tarasy_geometria(w), tarasy_material());
    m.cast_shadow = true;
    m.receive_shadow = true;
    let mut g = GroupBuilder::new();
    g.add_leaf(m, 0);
    let mut o = g.finish();
    o.meta[1].name = name.to_owned();
    o.meta[0].name = name.to_owned();
    o
}

/// `trojkatyTarasow(wariantWzgorza)` (`:401-403`).
#[must_use]
pub fn trojkaty_tarasow(w: TarasyWariant) -> usize {
    tarasy_geometria(w).mesh.vertex_count() / 3
}
