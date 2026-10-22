//! `render/pastwisko-modele.ts` (cow, sheep, llama, pasture layouts) and
//! `render/swinia-trzoda.ts` (pig, herd) (`edb8fb56`).

// `0.318` etc. are literal web coordinates, not approximations of 1/π.
#![allow(clippy::too_many_arguments, clippy::approx_constant)]

use std::f64::consts::PI;

use crate::core::jsnum::js_to_fixed3;
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{MatId, NodeId, Prim, ROOT};

use super::kit::b;
use super::model::{ExtraGeo, ImprovementModel};

/// `PASTWISKO_S = (2.05 / 3) * 1.5` (`pastwisko-modele.ts`).
#[must_use]
pub fn pastwisko_s() -> f64 {
    (2.05 / 3.0) * 1.5
}

/// `PozaKrowy`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PozaKrowy {
    /// `'stojaca'` (default).
    #[default]
    Stojaca,
    /// `'pasaca'`.
    Pasaca,
}

/// `WariantKrowy`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum WariantKrowy {
    /// `'lacata'` (default).
    #[default]
    Lacata,
    /// `'brazowa'`.
    Brazowa,
}

/// `PozaOwcy`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PozaOwcy {
    /// `'stojaca'` (default).
    #[default]
    Stojaca,
    /// `'skubiaca'`.
    Skubiaca,
}

/// `WariantOwcy`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum WariantOwcy {
    /// `'biala'` (default).
    #[default]
    Biala,
    /// `'czarna'`.
    Czarna,
}

/// `PozaSwini`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PozaSwini {
    /// `'stojaca'` (default).
    #[default]
    Stojaca,
    /// `'ryjaca'`.
    Ryjaca,
}

/// `WariantSwini`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum WariantSwini {
    /// `'rozowa'` (default).
    #[default]
    Rozowa,
    /// `'laciata'`.
    Laciata,
}

/// `JakoscTrzody`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum JakoscTrzody {
    /// `'niska'`.
    Niska,
    /// `'normalna'`.
    Normalna,
    /// `'wysoka'` (default).
    #[default]
    Wysoka,
}

/// Head-local box `H(...)`: every size/position × `s`, rotation as given.
fn hb(
    m: &mut ImprovementModel,
    head: NodeId,
    s: f64,
    w: f64,
    h: f64,
    d: f64,
    cx: f64,
    cy: f64,
    cz: f64,
    mat: MatId,
    rx: f64,
    ry: f64,
    rz: f64,
) {
    b(
        m,
        head,
        w * s,
        h * s,
        d * s,
        cx * s,
        cy * s,
        cz * s,
        mat,
        rx,
        ry,
        rz,
    );
}

/// `buildKrowa({ poza, wariant })` (`pastwisko-modele.ts`) into `g`.
pub fn build_krowa_into(
    m: &mut ImprovementModel,
    g: NodeId,
    poza: PozaKrowy,
    wariant: WariantKrowy,
) {
    let s = pastwisko_s();
    let lacata = wariant == WariantKrowy::Lacata;
    let cialo = m.lambert(if lacata { 0xf5f2ec } else { 0x9a6238 });
    let lata = m.lambert(if lacata { 0x26221e } else { 0x59361b });
    let rog = m.lambert(0xf2ead0);
    let roz = m.lambert(0xe8a0a8);
    let ciemny = m.lambert(0x26221e);

    let leg_h = 0.075 * s;
    let leg_w = 0.032 * s;
    for (lx, lz) in [
        (-0.062, 0.042),
        (-0.062, -0.042),
        (0.058, 0.042),
        (0.058, -0.042),
    ] {
        b(
            m,
            g,
            leg_w,
            leg_h,
            leg_w,
            lx * s,
            leg_h / 2.0,
            lz * s,
            lata,
            0.0,
            0.0,
            0.0,
        );
    }
    b(
        m,
        g,
        0.21 * s,
        0.115 * s,
        0.13 * s,
        -0.015 * s,
        0.128 * s,
        0.0,
        cialo,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.062 * s,
        0.092 * s,
        0.138 * s,
        0.042 * s,
        0.138 * s,
        0.0,
        lata,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.052 * s,
        0.075 * s,
        0.138 * s,
        -0.038 * s,
        0.108 * s,
        0.0,
        lata,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.055 * s,
        0.1 * s,
        0.138 * s,
        -0.096 * s,
        0.132 * s,
        0.0,
        lata,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.055 * s,
        0.032 * s,
        0.05 * s,
        -0.055 * s,
        0.062 * s,
        0.0,
        roz,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.013 * s,
        0.075 * s,
        0.013 * s,
        -0.128 * s,
        0.135 * s,
        0.0,
        cialo,
        0.0,
        0.0,
        -0.35,
    );
    b(
        m,
        g,
        0.02 * s,
        0.028 * s,
        0.02 * s,
        -0.142 * s,
        0.092 * s,
        0.0,
        ciemny,
        0.0,
        0.0,
        -0.35,
    );

    let head = m.group(g);
    m.node(head).set_pos(0.085 * s, 0.155 * s, 0.0);
    hb(
        m, head, s, 0.055, 0.07, 0.085, 0.012, 0.0, 0.0, cialo, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.09, 0.088, 0.105, 0.068, 0.008, 0.0, cialo, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.048, 0.052, 0.082, 0.132, -0.008, 0.0, roz, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.05, 0.012, 0.05, 0.128, 0.02, 0.0, cialo, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.014, 0.02, 0.014, 0.098, 0.02, 0.055, ciemny, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.014, 0.02, 0.014, 0.098, 0.02, -0.055, ciemny, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.042, 0.018, 0.03, 0.048, 0.042, 0.062, lata, 0.5, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.042, 0.018, 0.03, 0.048, 0.042, -0.062, lata, -0.5, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.018, 0.048, 0.018, 0.062, 0.062, 0.034, rog, 0.55, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.018, 0.048, 0.018, 0.062, 0.062, -0.034, rog, -0.55, 0.0, 0.0,
    );
    if poza == PozaKrowy::Pasaca {
        m.node(head).rot_z(-1.05);
    }
}

/// `buildOwca({ poza, wariant })` into `g`.
pub fn build_owca_into(m: &mut ImprovementModel, g: NodeId, poza: PozaOwcy, wariant: WariantOwcy) {
    let s = pastwisko_s();
    let biala = wariant == WariantOwcy::Biala;
    let runo = m.lambert(if biala { 0xf4f1e6 } else { 0x2f2a25 });
    let skora = m.lambert(if biala { 0x332d27 } else { 0x241f1b });
    let pysk = m.lambert(if biala { 0x5a4f44 } else { 0xe3d8c4 });
    let oko = m.lambert(0xe9e2d2);

    let leg_h = 0.055 * s;
    let leg_w = 0.02 * s;
    for (lx, lz) in [
        (-0.042, 0.027),
        (-0.042, -0.027),
        (0.042, 0.027),
        (0.042, -0.027),
    ] {
        b(
            m,
            g,
            leg_w,
            leg_h,
            leg_w,
            lx * s,
            leg_h / 2.0,
            lz * s,
            skora,
            0.0,
            0.0,
            0.0,
        );
    }
    b(
        m,
        g,
        0.135 * s,
        0.082 * s,
        0.098 * s,
        0.0,
        0.093 * s,
        0.0,
        runo,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.15 * s,
        0.046 * s,
        0.112 * s,
        -0.004 * s,
        0.14 * s,
        0.0,
        runo,
        0.0,
        0.14,
        0.0,
    );
    b(
        m,
        g,
        0.052 * s,
        0.062 * s,
        0.104 * s,
        0.062 * s,
        0.108 * s,
        0.0,
        runo,
        0.0,
        -0.12,
        0.0,
    );
    b(
        m,
        g,
        0.054 * s,
        0.066 * s,
        0.106 * s,
        -0.062 * s,
        0.112 * s,
        0.0,
        runo,
        0.0,
        0.16,
        0.0,
    );
    b(
        m,
        g,
        0.028 * s,
        0.03 * s,
        0.03 * s,
        -0.088 * s,
        0.148 * s,
        0.0,
        runo,
        0.0,
        0.0,
        0.35,
    );

    let head = m.group(g);
    m.node(head).set_pos(0.065 * s, 0.125 * s, 0.0);
    hb(
        m, head, s, 0.052, 0.055, 0.05, 0.03, 0.008, 0.0, skora, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.026, 0.03, 0.036, 0.066, -0.004, 0.0, pysk, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.046, 0.022, 0.058, 0.02, 0.042, 0.0, runo, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.032, 0.013, 0.02, 0.026, 0.026, 0.036, skora, 0.6, 0.0, -0.15,
    );
    hb(
        m, head, s, 0.032, 0.013, 0.02, 0.026, 0.026, -0.036, skora, -0.6, 0.0, -0.15,
    );
    hb(
        m, head, s, 0.011, 0.014, 0.011, 0.05, 0.018, 0.027, oko, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.011, 0.014, 0.011, 0.05, 0.018, -0.027, oko, 0.0, 0.0, 0.0,
    );
    if poza == PozaOwcy::Skubiaca {
        m.node(head).rot_z(-1.35);
    }
}

/// `buildLama()` into `g`.
pub fn build_lama_into(m: &mut ImprovementModel, g: NodeId) {
    let s = pastwisko_s() * 0.9;
    let bez = m.lambert(0xd9b98c);
    let puch = m.lambert(0xeedcb6);
    let ciemnybez = m.lambert(0xb08a58);
    let ciemny = m.lambert(0x2a2622);
    let leg_h = 0.082 * s;
    let leg_w = 0.024 * s;
    for (lx, lz) in [
        (-0.046, 0.03),
        (-0.046, -0.03),
        (0.046, 0.03),
        (0.046, -0.03),
    ] {
        b(
            m,
            g,
            leg_w,
            leg_h,
            leg_w,
            lx * s,
            leg_h / 2.0,
            lz * s,
            ciemnybez,
            0.0,
            0.0,
            0.0,
        );
    }
    let z = 0.0;
    b(
        m,
        g,
        0.135 * s,
        0.09 * s,
        0.095 * s,
        0.0,
        0.122 * s,
        z,
        bez,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.148 * s,
        0.048 * s,
        0.108 * s,
        0.0,
        0.158 * s,
        z,
        puch,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.055 * s,
        0.075 * s,
        0.102 * s,
        -0.055 * s,
        0.132 * s,
        z,
        puch,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.032 * s,
        0.038 * s,
        0.032 * s,
        -0.082 * s,
        0.155 * s,
        z,
        puch,
        0.0,
        0.0,
        0.5,
    );
    b(
        m,
        g,
        0.046 * s,
        0.135 * s,
        0.052 * s,
        0.055 * s,
        0.24 * s,
        z,
        bez,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.062 * s,
        0.05 * s,
        0.068 * s,
        0.055 * s,
        0.182 * s,
        z,
        puch,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.052 * s,
        0.056 * s,
        0.056 * s,
        0.062 * s,
        0.325 * s,
        z,
        bez,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.03 * s,
        0.032 * s,
        0.036 * s,
        0.096 * s,
        0.318 * s,
        z,
        ciemnybez,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.034 * s,
        0.016 * s,
        0.042 * s,
        0.06 * s,
        0.358 * s,
        z,
        puch,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.012 * s,
        0.02 * s,
        0.012 * s,
        0.08 * s,
        0.334 * s,
        0.03 * s,
        ciemny,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.012 * s,
        0.02 * s,
        0.012 * s,
        0.08 * s,
        0.334 * s,
        -0.03 * s,
        ciemny,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.015 * s,
        0.052 * s,
        0.017 * s,
        0.052 * s,
        0.388 * s,
        0.021 * s,
        bez,
        -0.14,
        0.0,
        -0.1,
    );
    b(
        m,
        g,
        0.015 * s,
        0.052 * s,
        0.017 * s,
        0.052 * s,
        0.388 * s,
        -0.021 * s,
        bez,
        0.14,
        0.0,
        -0.1,
    );
}

/// `az(deg, r)` of both files: `+(r * sin).toFixed(3)`, `+(-r * cos).toFixed(3)`.
#[must_use]
pub fn az_fixed(deg: f64, r: f64) -> (f64, f64) {
    let a = (deg * PI) / 180.0;
    let parse = |v: f64| js_to_fixed3(v).parse::<f64>().unwrap_or(f64::NAN);
    (parse(r * js_sin(a)), parse(-r * js_cos(a)))
}

/// A layout slot: normalised `x`, `z` and `rotY`.
pub type Slot = (f64, f64, f64);

/// `PASTWISKO_LAYOUT.sloty` (`krowaA`, `krowaB`, `lama`, `owcaA`, `owcaB`).
#[must_use]
pub fn pastwisko_sloty() -> [Slot; 5] {
    let s = |deg: f64, r: f64, rot: f64| {
        let (x, z) = az_fixed(deg, r);
        (x, z, rot)
    };
    [
        s(8.0, 0.60, 2.25),
        s(47.0, 0.67, -0.55),
        s(94.0, 0.63, 0.35),
        s(196.0, 0.62, -1.95),
        s(233.0, 0.58, 2.75),
    ]
}

/// `TRZODA_LAYOUT.sloty` (`krowa`, `swinia`).
#[must_use]
pub fn trzoda_sloty() -> [Slot; 2] {
    let (kx, kz) = az_fixed(6.0, 0.63);
    let (sx, sz) = az_fixed(52.0, 0.60);
    [(kx, kz, 2.25), (sx, sz, -0.95)]
}

/// `put(fig, slot)`: `position.set(x · hexR, 0, z · hexR)`, `rotation.y`.
fn put(m: &mut ImprovementModel, g: NodeId, fig: NodeId, slot: Slot, hex_r: f64) {
    m.node(fig)
        .set_pos(slot.0 * hex_r, 0.0, slot.1 * hex_r)
        .rot_y(slot.2);
    m.attach(g, fig);
}

/// `buildPastwiskoZwierzeta(hexR)` into `g` (exported by the web, used by
/// no builder since `robloxImprovements.ts:9`).
pub fn build_pastwisko_zwierzeta_into(m: &mut ImprovementModel, g: NodeId, hex_r: f64) {
    let sl = pastwisko_sloty();
    let k = m.detached();
    build_krowa_into(m, k, PozaKrowy::Pasaca, WariantKrowy::Lacata);
    put(m, g, k, sl[0], hex_r);
    let k = m.detached();
    build_krowa_into(m, k, PozaKrowy::Stojaca, WariantKrowy::Brazowa);
    put(m, g, k, sl[1], hex_r);
    let l = m.detached();
    build_lama_into(m, l);
    put(m, g, l, sl[2], hex_r);
    let o = m.detached();
    build_owca_into(m, o, PozaOwcy::Stojaca, WariantOwcy::Biala);
    put(m, g, o, sl[3], hex_r);
    let o = m.detached();
    build_owca_into(m, o, PozaOwcy::Skubiaca, WariantOwcy::Czarna);
    put(m, g, o, sl[4], hex_r);
}

/// `buildZlozeKrowy(hexR)` into `g`.
pub fn build_zloze_krowy_into(m: &mut ImprovementModel, g: NodeId, hex_r: f64) {
    let sl = pastwisko_sloty();
    let k = m.detached();
    build_krowa_into(m, k, PozaKrowy::Pasaca, WariantKrowy::Lacata);
    put(m, g, k, sl[0], hex_r);
    let k = m.detached();
    build_krowa_into(m, k, PozaKrowy::Stojaca, WariantKrowy::Brazowa);
    put(m, g, k, sl[1], hex_r);
}

/// `buildZlozeOwce(hexR)` into `g`.
pub fn build_zloze_owce_into(m: &mut ImprovementModel, g: NodeId, hex_r: f64) {
    let sl = pastwisko_sloty();
    let o = m.detached();
    build_owca_into(m, o, PozaOwcy::Stojaca, WariantOwcy::Biala);
    put(m, g, o, sl[3], hex_r);
    let o = m.detached();
    build_owca_into(m, o, PozaOwcy::Skubiaca, WariantOwcy::Czarna);
    put(m, g, o, sl[4], hex_r);
}

/// `EAR_TWIST = Math.PI / 3` (`swinia-trzoda.ts`).
const EAR_TWIST: f64 = PI / 3.0;

/// `EAR(g, r, h, ax, ay, az, dx, dy, dz, m, flat, twist)`: 3-sided cone
/// (optionally `rotateY(twist)`), axis along `dir`, base at `a`, `scale.z =
/// flat`, cast shadow.
fn ear(
    m: &mut ImprovementModel,
    g: NodeId,
    r: f64,
    h: f64,
    a: (f64, f64, f64),
    d: (f64, f64, f64),
    mat: MatId,
    flat: f64,
    twist: f64,
) {
    let id = if twist != 0.0 {
        m.mesh_extra(
            g,
            ExtraGeo::TwistedCone {
                r,
                h,
                radial: 3,
                twist,
            },
            Prim::cone(r, h, 3),
            mat,
        )
    } else {
        m.mesh(g, Prim::cone(r, h, 3), mat)
    };
    let dir = Vec3::new(d.0, d.1, d.2).normalize();
    let n = m.node(id);
    n.quat_from_unit_vectors(Vec3::new(0.0, 1.0, 0.0), dir);
    n.set_pos(
        a.0 + dir.x * h / 2.0,
        a.1 + dir.y * h / 2.0,
        a.2 + dir.z * h / 2.0,
    );
    n.scale.z = flat;
    m.shadows(id, true, false);
}

/// `buildSwinia({ poza, wariant })` into `g`.
pub fn build_swinia_into(
    m: &mut ImprovementModel,
    g: NodeId,
    poza: PozaSwini,
    wariant: WariantSwini,
) {
    let s = pastwisko_s();
    let roz = m.lambert(0xf2a7b3);
    let roz2 = m.lambert(0xd9808f);
    let noz = m.lambert(0xb3596b);
    let oko = m.lambert(0x2a2226);
    let lata = m.lambert(0x503a3e);

    let leg_h = 0.036 * s;
    let leg_w = 0.026 * s;
    for (lx, lz) in [
        (-0.066, 0.036),
        (-0.066, -0.036),
        (0.062, 0.036),
        (0.062, -0.036),
    ] {
        b(
            m,
            g,
            leg_w,
            leg_h,
            leg_w,
            lx * s,
            leg_h / 2.0,
            lz * s,
            roz2,
            0.0,
            0.0,
            0.0,
        );
    }
    b(
        m,
        g,
        0.205 * s,
        0.096 * s,
        0.108 * s,
        -0.008 * s,
        0.082 * s,
        0.0,
        roz,
        0.0,
        0.0,
        0.0,
    );
    b(
        m,
        g,
        0.195 * s,
        0.086 * s,
        0.086 * s,
        -0.008 * s,
        0.082 * s,
        0.0,
        roz,
        PI / 4.0,
        0.0,
        0.0,
    );
    if wariant == WariantSwini::Laciata {
        b(
            m,
            g,
            0.058 * s,
            0.100 * s,
            0.114 * s,
            -0.062 * s,
            0.086 * s,
            0.0,
            lata,
            0.0,
            0.0,
            0.0,
        );
        b(
            m,
            g,
            0.044 * s,
            0.088 * s,
            0.112 * s,
            0.026 * s,
            0.076 * s,
            0.0,
            lata,
            0.0,
            0.0,
            0.0,
        );
    }
    b(
        m,
        g,
        0.017 * s,
        0.038 * s,
        0.017 * s,
        -0.114 * s,
        0.120 * s,
        0.004 * s,
        roz2,
        0.0,
        0.0,
        0.60,
    );
    b(
        m,
        g,
        0.016 * s,
        0.034 * s,
        0.016 * s,
        -0.130 * s,
        0.128 * s,
        0.009 * s,
        roz2,
        0.0,
        0.0,
        1.75,
    );
    b(
        m,
        g,
        0.015 * s,
        0.030 * s,
        0.015 * s,
        -0.136 * s,
        0.113 * s,
        0.014 * s,
        roz2,
        0.0,
        0.0,
        2.85,
    );

    let head = m.group(g);
    m.node(head).set_pos(0.098 * s, 0.082 * s, 0.0);
    hb(
        m, head, s, 0.075, 0.068, 0.088, 0.016, 0.004, 0.0, roz, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.046, 0.050, 0.064, 0.070, -0.006, 0.0, roz2, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.010, 0.017, 0.015, 0.0925, -0.004, 0.015, noz, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.010, 0.017, 0.015, 0.0925, -0.004, -0.015, noz, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.013, 0.016, 0.013, 0.046, 0.020, 0.0405, oko, 0.0, 0.0, 0.0,
    );
    hb(
        m, head, s, 0.013, 0.016, 0.013, 0.046, 0.020, -0.0405, oko, 0.0, 0.0, 0.0,
    );
    ear(
        m,
        head,
        0.028 * s,
        0.060 * s,
        (0.034 * s, 0.038 * s, 0.026 * s),
        (0.45, -0.35, 0.82),
        roz2,
        0.45,
        EAR_TWIST,
    );
    ear(
        m,
        head,
        0.028 * s,
        0.060 * s,
        (0.034 * s, 0.038 * s, -0.026 * s),
        (0.45, -0.35, -0.82),
        roz2,
        0.45,
        -EAR_TWIST,
    );
    if poza == PozaSwini::Ryjaca {
        m.node(head).set_pos(0.112 * s, 0.072 * s, 0.0).rot_z(-0.80);
    }
}

/// `buildTrzoda({ jakosc, hexR })` into `g`.
pub fn build_trzoda_into(m: &mut ImprovementModel, g: NodeId, jakosc: JakoscTrzody, hex_r: f64) {
    let sl = trzoda_sloty();
    let k = m.detached();
    build_krowa_into(m, k, PozaKrowy::Pasaca, WariantKrowy::Lacata);
    put(m, g, k, sl[0], hex_r);
    if jakosc == JakoscTrzody::Wysoka {
        let p = m.detached();
        build_swinia_into(m, p, PozaSwini::Stojaca, WariantSwini::Rozowa);
        put(m, g, p, sl[1], hex_r);
    }
}

/// `buildKrowa(opts)` as a standalone model.
#[must_use]
pub fn build_krowa(poza: PozaKrowy, wariant: WariantKrowy) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_krowa_into(&mut m, ROOT, poza, wariant);
    m
}

/// `buildOwca(opts)`.
#[must_use]
pub fn build_owca(poza: PozaOwcy, wariant: WariantOwcy) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_owca_into(&mut m, ROOT, poza, wariant);
    m
}

/// `buildLama()`.
#[must_use]
pub fn build_lama() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_lama_into(&mut m, ROOT);
    m
}

/// `buildPastwiskoZwierzeta(hexR)`.
#[must_use]
pub fn build_pastwisko_zwierzeta(hex_r: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_pastwisko_zwierzeta_into(&mut m, ROOT, hex_r);
    m
}

/// `buildZlozeKrowy(hexR)`.
#[must_use]
pub fn build_zloze_krowy(hex_r: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_zloze_krowy_into(&mut m, ROOT, hex_r);
    m
}

/// `buildZlozeOwce(hexR)`.
#[must_use]
pub fn build_zloze_owce(hex_r: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_zloze_owce_into(&mut m, ROOT, hex_r);
    m
}

/// `buildSwinia(opts)`.
#[must_use]
pub fn build_swinia(poza: PozaSwini, wariant: WariantSwini) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_swinia_into(&mut m, ROOT, poza, wariant);
    m
}

/// `buildTrzoda({ jakosc, hexR })`.
#[must_use]
pub fn build_trzoda(jakosc: JakoscTrzody, hex_r: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_trzoda_into(&mut m, ROOT, jakosc, hex_r);
    m
}
