//! `render/oaza-pustynia.ts` (web `edb8fb56`): part A — the oasis model
//! `buildOaza()` (a `Group` of Lambert boxes and flat pond fans); part B —
//! desert micro-decor, 4 variants, with the presence/variant/rotation hash
//! (salts 1301/1307/1313) and the oasis rotation (salt 1319).
//!
//! Line references are to `gra/src/render/oaza-pustynia.ts`. `ostrze`,
//! `kamyk`, `okta`, `rot2` are the [`super::meadow`] ones (operation for
//! operation the same in both web files).

use std::sync::{Arc, OnceLock};

use crate::geom::{box_geometry, Euler, Mesh, Vec3};
use crate::pick::terrain::hash_heksa;
use crate::scene::{Geometry, Material, Scene, ROOT};

use super::js::{floor_index, js_cos, js_hypot, js_max, js_pow, js_sin, wrap_variant, PI};
use super::meadow::{kamyk, okta, ostrze, rot2, Ostrze};
use super::object::{add_leaf, DecorObject, Leaf};
use super::parts::{lambert, rgb, vertex_color_material, Parts, V3};

// ===========================================================================
// Part A — oasis (`:85-229`)

/// `mat(c)` (`:85-87`).
fn mat(c: u32) -> Material {
    lambert(c, true)
}

/// `B(g, w, h, d, cx, cy, cz, m, rx, ry, rz)` (`:90-101`).
#[allow(clippy::too_many_arguments)]
fn bx(g: &mut Scene, w: f64, h: f64, d: f64, c: [f64; 3], m: Material, rot: [f64; 3]) {
    let mut mesh = Leaf::mesh(Arc::new(box_geometry(w, h, d, 1, 1, 1).into()), m);
    mesh.position = Vec3::new(c[0], c[1], c[2]);
    let [rx, ry, rz] = rot;
    if rx != 0.0 || ry != 0.0 || rz != 0.0 {
        mesh.rotation = Euler::xyz(rx, ry, rz);
    }
    mesh.cast_shadow = true;
    add_leaf(g, ROOT, mesh, 0);
}

const WODA_GLEBIA: u32 = 0x1f_97b0;
const WODA_PLYCIZNA: u32 = 0x45_d4e0;
const MOKRY_PIASEK: u32 = 0xc4_a875;
const PIEN_A: u32 = 0x9a_6a3f;
const PIEN_B: u32 = 0x85_5832;
const LISC_J: u32 = 0x55_b84a;
const LISC_C: u32 = 0x3d_9440;
const KRZAK_J: u32 = 0x5c_ae45;
const KRZAK_C: u32 = 0x44_8c3a;
const GLAZ: u32 = 0xaa_a596;

/// `STAW_R` (`:118`).
const STAW_R: [f64; 8] = [0.36, 0.29, 0.40, 0.33, 0.26, 0.38, 0.30, 0.34];

/// `tafla(skala, y, kolor, jitterFaza)` (`:121-142`).
#[allow(clippy::cast_possible_truncation, clippy::cast_precision_loss)]
fn tafla(skala: f64, y: f64, kolor: u32, jitter_faza: f64) -> Leaf {
    let n = STAW_R.len();
    let pt = |i: usize| -> [f64; 2] {
        let a = jitter_faza + (i % n) as f64 * (PI * 2.0 / n as f64);
        let r = STAW_R[i % n] * skala;
        [js_sin(a) * r, js_cos(a) * r]
    };
    let mut pos: Vec<f64> = Vec::with_capacity(n * 9);
    for i in 0..n {
        let [ax, az] = pt(i);
        let [bx, bz] = pt(i + 1);
        pos.extend_from_slice(&[0.0, 0.0, 0.0, bx, 0.0, bz, ax, 0.0, az]);
    }
    let mut mesh = Mesh {
        positions: pos.iter().map(|&v| v as f32).collect(),
        ..Mesh::default()
    };
    mesh.compute_vertex_normals();
    let mut node = Leaf::mesh(Arc::new(mesh.into()), mat(kolor));
    node.position.y = y;
    node.receive_shadow = true;
    node
}

/// `PALMA_JIT` (`:145`).
const PALMA_JIT: [f64; 8] = [0.0, 0.22, -0.15, 0.3, -0.26, 0.12, -0.08, 0.18];

/// `PalmaOpts` (`:147-155`) with every field the three calls pass.
struct PalmaOpts {
    segmenty: u32,
    liscie: u32,
    lean: [f64; 2],
    lean_amp: f64,
    yaw: f64,
    skala: f64,
}

/// `palma(g, px, pz, o)` (`:158-189`) (`hSeg` default `0.145`).
#[allow(clippy::cast_precision_loss)]
fn palma(g: &mut Scene, px: f64, pz: f64, o: &PalmaOpts) {
    let seg = o.segmenty;
    let n_lisci = o.liscie;
    let s = o.skala;
    let h_seg = 0.145 * s;
    let amp = o.lean_amp * s;
    let [ldx0, ldz0] = o.lean;
    let ll = js_max(1e-6, js_hypot(ldx0, ldz0));
    let ux = ldx0 / ll;
    let uz = ldz0 / ll;
    let yaw = o.yaw;
    let mut top_x = px;
    let mut top_y = 0.0;
    let mut top_z = pz;
    for i in 0..seg {
        let fi = f64::from(i);
        let t = if seg == 1 {
            1.0
        } else {
            fi / f64::from(seg - 1)
        };
        let off = amp * js_pow(t, 1.4);
        let grubosc = (0.075 - 0.013 * fi) * s;
        let cy = (fi + 0.5) * h_seg * 0.94;
        let ang = 0.30 * amp / 0.16 * ((fi + 1.0) / f64::from(seg));
        bx(
            g,
            grubosc,
            h_seg,
            grubosc,
            [px + ux * off, cy, pz + uz * off],
            mat(if i % 2 == 0 { PIEN_A } else { PIEN_B }),
            [uz * ang, 0.0, -ux * ang],
        );
        top_x = px + ux * off;
        top_y = cy + h_seg * 0.5;
        top_z = pz + uz * off;
    }
    let lisc_m = [mat(LISC_J), mat(LISC_C)];
    for i in 0..n_lisci as usize {
        let fi = yaw + i as f64 * (PI * 2.0 / f64::from(n_lisci)) + PALMA_JIT[i % PALMA_JIT.len()];
        let opad = 0.55 + PALMA_JIT[(i + 3) % PALMA_JIT.len()] * 0.5;
        let dl = 0.30 * s;
        let szer = 0.10 * s;
        let cx = top_x + js_cos(fi) * dl * 0.48 * js_cos(opad);
        let cz = top_z - js_sin(fi) * dl * 0.48 * js_cos(opad);
        let cy = top_y + 0.022 - dl * 0.48 * js_sin(opad) * 0.50;
        bx(
            g,
            dl,
            0.016 * s,
            szer,
            [cx, cy, cz],
            lisc_m[i % 2],
            [0.0, fi, -opad * 0.8],
        );
    }
}

/// `krzak(g, cx, cz, sk, ciemny, ry)` (`:192-195`).
fn krzak(g: &mut Scene, cx: f64, cz: f64, sk: f64, ciemny: bool, ry: f64) {
    bx(
        g,
        0.16 * sk,
        0.055 * sk,
        0.13 * sk,
        [cx, 0.024 * sk, cz],
        mat(if ciemny { KRZAK_C } else { KRZAK_J }),
        [0.0, ry, 0.0],
    );
}

/// `buildOaza()` (`:201-229`): pond (3 fans in a sub-group at
/// `(-0.14, 0, 0.10)`), 3 leaning palms, 4 shrubs, 2 boulders.
#[must_use]
pub fn build_oaza() -> DecorObject {
    let mut g = Scene::new();
    let w = g.add_group(ROOT);
    g.nodes[w].position = Vec3::new(-0.14, 0.0, 0.10);
    add_leaf(&mut g, w, tafla(1.30, 0.006, MOKRY_PIASEK, 0.20), 0);
    add_leaf(&mut g, w, tafla(1.00, 0.016, WODA_GLEBIA, 0.0), 0);
    add_leaf(&mut g, w, tafla(0.60, 0.026, WODA_PLYCIZNA, 0.55), 0);

    palma(
        &mut g,
        0.34,
        -0.22,
        &PalmaOpts {
            segmenty: 3,
            liscie: 5,
            lean: [-0.8, 0.55],
            lean_amp: 0.17,
            yaw: 0.3,
            skala: 1.0,
        },
    );
    palma(
        &mut g,
        -0.52,
        -0.18,
        &PalmaOpts {
            segmenty: 3,
            liscie: 4,
            lean: [0.7, 0.75],
            lean_amp: 0.15,
            yaw: 1.4,
            skala: 0.92,
        },
    );
    palma(
        &mut g,
        0.06,
        0.58,
        &PalmaOpts {
            segmenty: 2,
            liscie: 4,
            lean: [-0.25, -1.0],
            lean_amp: 0.05,
            yaw: 2.2,
            skala: 0.88,
        },
    );

    krzak(&mut g, 0.28, 0.24, 1.0, false, 0.4);
    krzak(&mut g, 0.20, -0.34, 0.85, true, 1.2);
    krzak(&mut g, -0.50, 0.30, 0.9, false, 2.1);
    krzak(&mut g, -0.16, -0.40, 0.8, true, 2.9);

    bx(
        &mut g,
        0.11,
        0.085,
        0.13,
        [0.55, 0.026, 0.30],
        mat(GLAZ),
        [0.55, 0.6, 0.35],
    );
    bx(
        &mut g,
        0.075,
        0.06,
        0.08,
        [-0.30, 0.016, 0.62],
        mat(GLAZ),
        [0.45, 1.9, 0.4],
    );

    g.named("oaza")
}

// ===========================================================================
// Part B — desert micro-decor (`:241-578`)

/// `DEKOR_PUSTYNIA_LICZBA_WARIANTOW` (`:241`).
pub const DEKOR_PUSTYNIA_LICZBA_WARIANTOW: usize = 4;
/// `DEKOR_PUSTYNIA_UDZIAL_PUSTYCH` (`:244`).
pub const DEKOR_PUSTYNIA_UDZIAL_PUSTYCH: f64 = 0.45;
/// `DEKOR_PUSTYNIA_MAX_WYSOKOSC` (`:247`).
pub const DEKOR_PUSTYNIA_MAX_WYSOKOSC: f64 = 0.06;
/// `DEKOR_PUSTYNIA_FOOTPRINT_R` (`:250`).
pub const DEKOR_PUSTYNIA_FOOTPRINT_R: f64 = 0.75;
/// `DEKOR_PUSTYNIA_LOD_MAX_POZIOM` (`:253`).
pub const DEKOR_PUSTYNIA_LOD_MAX_POZIOM: u8 = 1;
/// `SALT_PUSTYNIA_OBECNOSC` (`:262`).
pub const SALT_PUSTYNIA_OBECNOSC: i32 = 1301;
/// `SALT_PUSTYNIA_WARIANT` (`:263`).
pub const SALT_PUSTYNIA_WARIANT: i32 = 1307;
/// `SALT_PUSTYNIA_ROTACJA` (`:264`).
pub const SALT_PUSTYNIA_ROTACJA: i32 = 1313;
/// `SALT_OAZA_ROTACJA` (`:265`).
pub const SALT_OAZA_ROTACJA: i32 = 1319;

/// `dekorPustyniDlaHeksa(q, r, seed = 0)` (`:282-285`).
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub fn dekor_pustyni_dla_heksa(q: i32, r: i32, seed: i32) -> Option<usize> {
    if hash_heksa(q, r, seed, SALT_PUSTYNIA_OBECNOSC) < DEKOR_PUSTYNIA_UDZIAL_PUSTYCH {
        return None;
    }
    Some(floor_index(
        hash_heksa(q, r, seed, SALT_PUSTYNIA_WARIANT) * DEKOR_PUSTYNIA_LICZBA_WARIANTOW as f64,
    ))
}

/// `rotacjaDekoruPustyni(q, r, seed = 0)` (`:288-290`).
#[must_use]
pub fn rotacja_dekoru_pustyni(q: i32, r: i32, seed: i32) -> f64 {
    (hash_heksa(q, r, seed, SALT_PUSTYNIA_ROTACJA) * 6.0).floor() * (PI / 3.0)
}

/// `rotacjaOazy(q, r, seed = 0)` (`:293-295`).
#[must_use]
pub fn rotacja_oazy(q: i32, r: i32, seed: i32) -> f64 {
    (hash_heksa(q, r, seed, SALT_OAZA_ROTACJA) * 6.0).floor() * (PI / 3.0)
}

const WYDMA_JASNA: u32 = 0xdc_bf7c;
const WYDMA_CIEN: u32 = 0xa9_8851;
const KAKTUS_KORPUS: u32 = 0x3f_8a3e;
const KAKTUS_TOP: u32 = 0x54_a74c;
const KAKTUS_KOLEC: u32 = 0xf5_eecb;
const PIASKOWIEC_C: u32 = 0xb8_7c46;
const PIASKOWIEC_S: u32 = 0xcf_9257;
const PIASKOWIEC_J: u32 = 0xd4_9a5c;
const KOSC_BIAL: u32 = 0xf2_ecdc;
const KOSC_CIEN: u32 = 0xd8_cfba;
const KAMYK_PUST_A: u32 = 0xb5_a687;
const KAMYK_PUST_B: u32 = 0x9c_8d72;
const TRAWA_SUCHA_C: u32 = 0xb8_9c52;

/// `wydmka(P, cx, cz, { dl, sz, h, yaw })` (`:422-441`).
fn wydmka(p: &mut Parts, cx: f64, cz: f64, dl: f64, sz: f64, h: f64, yaw: f64) {
    let c_j = rgb(WYDMA_JASNA);
    let c_c = rgb(WYDMA_CIEN);
    let pt = |dx: f64, dz: f64, y: f64| -> V3 {
        let [wx, wz] = rot2(dx, dz, yaw);
        [cx + wx, y, cz + wz]
    };
    let r1 = pt(-dl, sz, -0.004);
    let r2 = pt(dl, sz, -0.004);
    let r3 = pt(dl, -sz, -0.004);
    let r4 = pt(-dl, -sz, -0.004);
    let k1 = pt(-dl * 0.55, -sz * 0.40, h);
    let k2 = pt(dl * 0.58, -sz * 0.34, h * 0.62);
    let ref_g: V3 = [0.0, 1.0, 0.0];
    p.tri(r1, r2, k2, c_j, ref_g);
    p.tri(r1, k2, k1, c_j, ref_g);
    p.tri(r4, k1, k2, c_c, ref_g);
    p.tri(r4, k2, r3, c_c, ref_g);
    p.tri(r1, k1, r4, c_c, ref_g);
    p.tri(r2, r3, k2, c_j, ref_g);
}

/// `slupek4(P, cx, cz, o)` (`:444-464`).
#[allow(clippy::too_many_arguments)]
fn slupek4(
    p: &mut Parts,
    cx: f64,
    cz: f64,
    r_dol: f64,
    r_gora: f64,
    h: f64,
    y0: f64,
    yaw: f64,
    sx: f64,
    col_bok: u32,
    col_top: u32,
) {
    let c_b = rgb(col_bok);
    let c_t = rgb(col_top);
    let pt = |r: f64, y: f64, i: usize| -> V3 {
        #[allow(clippy::cast_precision_loss)]
        let a = yaw + PI / 4.0 + i as f64 * (PI / 2.0);
        [cx + r * js_sin(a) * sx, y, cz + r * js_cos(a)]
    };
    let dol: Vec<V3> = (0..4).map(|i| pt(r_dol, y0, i)).collect();
    let gora: Vec<V3> = (0..4).map(|i| pt(r_gora, h, i)).collect();
    for i in 0..4 {
        let j = (i + 1) % 4;
        let rf: V3 = [
            (dol[i][0] + dol[j][0]) / 2.0 - cx,
            0.15,
            (dol[i][2] + dol[j][2]) / 2.0 - cz,
        ];
        p.tri(dol[i], dol[j], gora[j], c_b, rf);
        p.tri(dol[i], gora[j], gora[i], c_b, rf);
    }
    let ref_t: V3 = [0.0, 1.0, 0.0];
    p.tri(gora[0], gora[1], gora[2], c_t, ref_t);
    p.tri(gora[0], gora[2], gora[3], c_t, ref_t);
}

/// `slupek3(P, cx, cz, o)` (`:467-484`).
#[allow(clippy::too_many_arguments)]
fn slupek3(
    p: &mut Parts,
    cx: f64,
    cz: f64,
    r: f64,
    h: f64,
    y0: f64,
    yaw: f64,
    col_bok: u32,
    col_top: u32,
) {
    let c_b = rgb(col_bok);
    let c_t = rgb(col_top);
    let pt = |y: f64, i: usize, r: f64| -> V3 {
        #[allow(clippy::cast_precision_loss)]
        let a = yaw + i as f64 * (PI * 2.0 / 3.0);
        [cx + r * js_sin(a), y, cz + r * js_cos(a)]
    };
    let dol: Vec<V3> = (0..3).map(|i| pt(y0, i, r)).collect();
    let gora: Vec<V3> = (0..3).map(|i| pt(h, i, r * 0.8)).collect();
    for i in 0..3 {
        let j = (i + 1) % 3;
        let rf: V3 = [
            (dol[i][0] + dol[j][0]) / 2.0 - cx,
            0.15,
            (dol[i][2] + dol[j][2]) / 2.0 - cz,
        ];
        p.tri(dol[i], dol[j], gora[j], c_b, rf);
        p.tri(dol[i], gora[j], gora[i], c_b, rf);
    }
    p.tri(gora[0], gora[1], gora[2], c_t, [0.0, 1.0, 0.0]);
}

/// `czaszka(P, cx, cz, { yaw })` (`:487-498`).
fn czaszka(p: &mut Parts, cx: f64, cz: f64, yaw: f64) {
    okta(p, cx, 0.022, cz, 0.082, 0.026, 0.026, yaw, 1.3, KOSC_BIAL);
    for strona in [-1.0f64, 1.0] {
        let [rx, rz] = rot2(strona * 0.092, 0.016, yaw);
        ostrze(
            p,
            cx + rx,
            cz + rz,
            Ostrze::new(0.042, 0.023, KOSC_CIEN)
                .sp(0.7)
                .yaw(yaw + strona * 0.5)
                .tilt(js_cos(yaw) * strona * 0.052, -js_sin(yaw) * strona * 0.052),
        );
    }
}

/// `czesciDekoruPustyni(w)` (`:504-535`).
fn czesci_dekoru_pustyni(w: usize) -> Parts {
    let mut parts = Parts::default();
    let p = &mut parts;
    match w {
        0 => {
            wydmka(p, 0.10, 0.42, 0.36, 0.10, 0.030, 0.45);
            wydmka(p, -0.40, -0.14, 0.29, 0.088, 0.025, 0.60);
            wydmka(p, 0.30, -0.38, 0.22, 0.072, 0.020, 0.35);
            kamyk(p, -0.12, 0.20, 0.045, 0.018, 1.3, KAMYK_PUST_B);
        }
        1 => {
            slupek4(
                p,
                0.32,
                -0.26,
                0.095,
                0.078,
                0.058,
                -0.006,
                0.3,
                1.1,
                KAKTUS_KORPUS,
                KAKTUS_TOP,
            );
            slupek3(
                p,
                0.45,
                -0.12,
                0.052,
                0.044,
                0.006,
                1.1,
                KAKTUS_KORPUS,
                KAKTUS_TOP,
            );
            ostrze(
                p,
                0.24,
                -0.34,
                Ostrze::new(0.034, 0.012, KAKTUS_KOLEC)
                    .sp(0.8)
                    .yaw(0.2)
                    .tilt(-0.020, -0.014),
            );
            ostrze(
                p,
                0.39,
                -0.32,
                Ostrze::new(0.032, 0.012, KAKTUS_KOLEC)
                    .sp(0.8)
                    .yaw(2.1)
                    .tilt(0.018, -0.012),
            );
            slupek3(
                p,
                -0.40,
                0.30,
                0.058,
                0.040,
                -0.006,
                0.8,
                KAKTUS_KORPUS,
                KAKTUS_TOP,
            );
            kamyk(p, -0.10, -0.44, 0.072, 0.026, 3.1, KAMYK_PUST_A);
        }
        2 => {
            slupek4(
                p,
                -0.30,
                -0.28,
                0.150,
                0.126,
                0.034,
                -0.006,
                0.5,
                1.35,
                PIASKOWIEC_C,
                PIASKOWIEC_S,
            );
            slupek4(
                p,
                -0.28,
                -0.26,
                0.088,
                0.062,
                0.024,
                0.032,
                0.75,
                1.3,
                PIASKOWIEC_S,
                PIASKOWIEC_J,
            );
            slupek4(
                p,
                0.42,
                0.24,
                0.092,
                0.072,
                0.030,
                -0.006,
                1.6,
                1.25,
                PIASKOWIEC_C,
                PIASKOWIEC_J,
            );
            ostrze(
                p,
                -0.14,
                0.40,
                Ostrze::new(0.040, 0.038, TRAWA_SUCHA_C)
                    .yaw(0.9)
                    .tilt(0.024, 0.0),
            );
        }
        _ => {
            czaszka(p, 0.30, 0.34, 0.7);
            ostrze(
                p,
                -0.32,
                -0.16,
                Ostrze::new(0.048, 0.028, KOSC_BIAL)
                    .sp(0.5)
                    .yaw(0.4)
                    .tilt(0.046, 0.024),
            );
            ostrze(
                p,
                -0.42,
                -0.28,
                Ostrze::new(0.040, 0.024, KOSC_CIEN)
                    .sp(0.5)
                    .yaw(0.5)
                    .tilt(0.040, 0.020),
            );
            ostrze(
                p,
                -0.24,
                -0.04,
                Ostrze::new(0.035, 0.021, KOSC_BIAL)
                    .sp(0.5)
                    .yaw(0.3)
                    .tilt(0.035, 0.018),
            );
            kamyk(p, 0.06, -0.44, 0.066, 0.024, 2.4, KAMYK_PUST_B);
        }
    }
    parts
}

/// `dekorPustyniaGeometria(wariant)` (`:553-557`).
#[must_use]
pub fn dekor_pustynia_geometria(wariant: i32) -> Arc<Geometry> {
    static CACHE: OnceLock<Vec<Arc<Geometry>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| {
        (0..DEKOR_PUSTYNIA_LICZBA_WARIANTOW)
            .map(|w| Arc::new(czesci_dekoru_pustyni(w).into_geometry()))
            .collect()
    });
    Arc::clone(&cache[wrap_variant(wariant, 4)])
}

/// `DEKOR_PUSTYNIA_MATERIAL` (`:561-564`).
#[must_use]
pub fn dekor_pustynia_material() -> Material {
    vertex_color_material()
}

/// `buildDekorPustynia(wariant)` (`:567-573`).
#[must_use]
pub fn build_dekor_pustynia(wariant: i32) -> DecorObject {
    let mut m = Scene::mesh_root(dekor_pustynia_geometria(wariant), dekor_pustynia_material());
    m.root_mut().shadows(false, true);
    m.named(&format!("dekor-pustynia-p{}", wrap_variant(wariant, 4)))
}

/// `trojkatyDekoruPustyni(wariant)` (`:576-578`).
#[must_use]
pub fn trojkaty_dekoru_pustyni(wariant: i32) -> usize {
    dekor_pustynia_geometria(wariant).mesh.vertex_count() / 3
}
