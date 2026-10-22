//! `render/wioska-oboz.ts` (web `edb8fb56`, 342 LOC): the neutral village
//! ([`build_wioska`], 438 tri) and the barbarian camp
//! ([`build_oboz_barbarzyncow`], 444 tri) in the Roblox style
//! (`MeshLambertMaterial({ color, flatShading: true })`, castShadow on every
//! block, circle "plac" without shadow).

use std::f64::consts::PI;

use super::model::{MiscMaterial, MiscModel};
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{MatId, NodeId, Prim};

/// `BARB_FACTION_COLOR` (`wioska-oboz.ts:138`) = `WAR_RING_COLOR`.
pub const BARB_FACTION_COLOR: u32 = 0xff_4444;

/// `WIOSKA_OBOZ_LAYOUT` (`wioska-oboz.ts:140-146`): placement hints for the
/// integrator (hex radius, building offset/rotation, scale).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WioskaObozPlacement {
    /// `budynek.x`.
    pub x: f64,
    /// `budynek.z`.
    pub z: f64,
    /// `budynek.rotY`.
    pub rot_y: f64,
    /// `skala`.
    pub scale: f64,
}

/// `WIOSKA_OBOZ_LAYOUT.hexR`.
pub const WIOSKA_OBOZ_HEX_R: f64 = 1.0;
/// `WIOSKA_OBOZ_LAYOUT.wioska`.
pub const WIOSKA_LAYOUT: WioskaObozPlacement = WioskaObozPlacement {
    x: 0.0,
    z: 0.0,
    rot_y: 0.10,
    scale: 1.0,
};
/// `WIOSKA_OBOZ_LAYOUT.obozBarbarzyncow`.
pub const OBOZ_LAYOUT: WioskaObozPlacement = WioskaObozPlacement {
    x: 0.0,
    z: 0.0,
    rot_y: -0.15,
    scale: 1.0,
};

/// Palette `P` (`wioska-oboz.ts:122-135`).
mod p {
    pub const SCIANA: u32 = 0xd9_a05b;
    pub const SCIANA_HI: u32 = 0xe8_b877;
    pub const STRZECHA: u32 = 0xf0_c34e;
    pub const STRZECHA_DK: u32 = 0xc0_913a;
    pub const STRZECHA_KAL: u32 = 0xdb_a044;
    pub const DREWNO: u32 = 0xc9_8a4b;
    pub const DREWNO_DK: u32 = 0x8a_5a2e;
    pub const DREWNO_C: u32 = 0x6b_4423;
    pub const DRZWI: u32 = 0x7a_4a22;
    pub const CIEN: u32 = 0x4a_2f16;
    pub const KAMIEN: u32 = 0x9a_a5b1;
    pub const KAMIEN_DK: u32 = 0x71_7d89;
    pub const SCIEZKA: u32 = 0xbb_9059;
    pub const KLEPISKO: u32 = 0xa0_8a68;
    pub const PLACHTA: u32 = 0xd9_3a2b;
    pub const TOWAR_DYNIA: u32 = 0xff_a726;
    pub const TOWAR_WARZYWO: u32 = 0x94_bf78;
    pub const SKORA: u32 = 0x9a_6b45;
    pub const SKORA_DK: u32 = 0x7d_5233;
    pub const SKORA_LATA: u32 = 0xb5_854f;
    pub const CZERN: u32 = 0x14_100b;
    pub const KOSC: u32 = 0xed_e3cc;
    pub const PAL: u32 = 0x77_502c;
    pub const OGIEN: u32 = 0xff_6b2e;
    pub const PLOMIEN: u32 = 0xff_c02e;
    pub const DYM: u32 = 0xd2_d2c8;
    pub const DYM_DK: u32 = 0xb0_b0a4;
    pub const STAL: u32 = 0xd7_dde2;
}

fn mat(m: &mut MiscModel, c: u32) -> MatId {
    m.add_material(MiscMaterial::lambert_flat(c))
}

/// Rotation applied when any component is non-zero (`if (rx || ry || rz)`).
fn rotate(m: &mut MiscModel, id: NodeId, r: [f64; 3]) {
    if r[0] != 0.0 || r[1] != 0.0 || r[2] != 0.0 {
        m.node(id).rot_x(r[0]).rot_y(r[1]).rot_z(r[2]);
    }
}

/// `B(g, w, h, d, cx, cy, cz, m, rx, ry, rz)` (`wioska-oboz.ts:76-87`).
#[allow(clippy::too_many_arguments)]
fn b(m: &mut MiscModel, g: NodeId, size: [f64; 3], c: [f64; 3], mt: MatId, r: [f64; 3]) -> NodeId {
    let id = m.mesh(g, Prim::bx(size[0], size[1], size[2]), mt);
    m.node(id).set_pos(c[0], c[1], c[2]);
    rotate(m, id, r);
    m.cast_shadow(id);
    id
}

/// `CYL(g, rt, rb, h, cx, cy, cz, m, seg = 6)` (`:90-101`).
fn cyl(m: &mut MiscModel, g: NodeId, rt: f64, rb: f64, h: f64, c: [f64; 3], mt: MatId) -> NodeId {
    let id = m.mesh(g, Prim::cyl(rt, rb, h, 6), mt);
    m.node(id).set_pos(c[0], c[1], c[2]);
    m.cast_shadow(id);
    id
}

/// `CONE(g, r, h, cx, cy, cz, m, seg, rx, ry, rz)` (`:103-114`).
#[allow(clippy::too_many_arguments)]
fn cone(
    m: &mut MiscModel,
    g: NodeId,
    r: f64,
    h: f64,
    c: [f64; 3],
    mt: MatId,
    seg: u32,
    rot: [f64; 3],
) -> NodeId {
    let id = m.mesh(g, Prim::cone(r, h, seg), mt);
    m.node(id).set_pos(c[0], c[1], c[2]);
    rotate(m, id, rot);
    m.cast_shadow(id);
    id
}

/// `azXZ(deg, r)` (`:116-119`): `x = r·sin(deg°)`, `z = −r·cos(deg°)`.
#[must_use]
pub fn az_xz(deg: f64, r: f64) -> (f64, f64) {
    (
        r * js_sin((deg * PI) / 180.0),
        -r * js_cos((deg * PI) / 180.0),
    )
}

const Z3: [f64; 3] = [0.0, 0.0, 0.0];

/// `buildWioska()` (`wioska-oboz.ts:153-239`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_wioska() -> MiscModel {
    let mut m = MiscModel::new();
    let g = m.root();
    let sciana = mat(&mut m, p::SCIANA);
    let sciana_hi = mat(&mut m, p::SCIANA_HI);
    let strzecha = mat(&mut m, p::STRZECHA);
    let strzecha_dk = mat(&mut m, p::STRZECHA_DK);
    let drewno = mat(&mut m, p::DREWNO);
    let drewno_dk = mat(&mut m, p::DREWNO_DK);
    let belka = mat(&mut m, p::DREWNO_C);
    let drzwi = mat(&mut m, p::DRZWI);
    let okno = mat(&mut m, p::CIEN);
    let kamien = mat(&mut m, p::KAMIEN);
    let sciezka = mat(&mut m, p::SCIEZKA);
    let plachta = mat(&mut m, p::PLACHTA);

    // KLEPISKO
    let plac = m.mesh(
        g,
        Prim::Circle {
            r: 0.165,
            segments: 6,
        },
        sciezka,
    );
    m.node(plac).rot_x(-PI / 2.0);
    m.node(plac).set_pos(0.02, 0.012, 0.05);
    b(
        &mut m,
        g,
        [0.32, 0.011, 0.11],
        [-0.20, 0.0055, -0.10],
        sciezka,
        [0.0, 0.75, 0.0],
    );
    b(
        &mut m,
        g,
        [0.28, 0.011, 0.10],
        [0.21, 0.0055, -0.04],
        sciezka,
        [0.0, -0.25, 0.0],
    );

    // CHATA A
    let ch_a = m.detached_group();
    b(
        &mut m,
        ch_a,
        [0.30, 0.19, 0.23],
        [0.0, 0.095, 0.0],
        sciana,
        Z3,
    );
    b(
        &mut m,
        ch_a,
        [0.34, 0.038, 0.155],
        [0.0, 0.225, 0.066],
        strzecha,
        [0.63, 0.0, 0.0],
    );
    b(
        &mut m,
        ch_a,
        [0.34, 0.038, 0.155],
        [0.0, 0.225, -0.066],
        strzecha,
        [-0.63, 0.0, 0.0],
    );
    let kal = mat(&mut m, p::STRZECHA_KAL);
    b(
        &mut m,
        ch_a,
        [0.33, 0.038, 0.075],
        [0.0, 0.267, 0.0],
        kal,
        Z3,
    );
    b(
        &mut m,
        ch_a,
        [0.016, 0.105, 0.075],
        [0.152, 0.0525, 0.02],
        drzwi,
        Z3,
    );
    m.node(ch_a).set_pos(-0.36, 0.0, -0.30);
    m.node(ch_a).rot_y(-0.85);
    m.attach(g, ch_a);

    // CHATA B
    let ch_b = m.detached_group();
    b(
        &mut m,
        ch_b,
        [0.26, 0.165, 0.20],
        [0.0, 0.0825, 0.0],
        sciana_hi,
        Z3,
    );
    b(
        &mut m,
        ch_b,
        [0.30, 0.036, 0.135],
        [0.0, 0.196, 0.058],
        strzecha_dk,
        [0.63, 0.0, 0.0],
    );
    b(
        &mut m,
        ch_b,
        [0.30, 0.036, 0.135],
        [0.0, 0.196, -0.058],
        strzecha_dk,
        [-0.63, 0.0, 0.0],
    );
    b(
        &mut m,
        ch_b,
        [0.32, 0.042, 0.075],
        [0.0, 0.238, 0.0],
        strzecha,
        Z3,
    );
    b(
        &mut m,
        ch_b,
        [0.015, 0.095, 0.07],
        [0.132, 0.0475, 0.0],
        drzwi,
        Z3,
    );
    b(
        &mut m,
        ch_b,
        [0.05, 0.045, 0.014],
        [-0.055, 0.075, 0.103],
        okno,
        Z3,
    );
    m.node(ch_b).set_pos(0.37, 0.0, -0.08);
    m.node(ch_b).rot_y(-2.05);
    m.attach(g, ch_b);

    // CHATA C
    let ch_c = m.detached_group();
    cyl(&mut m, ch_c, 0.105, 0.115, 0.13, [0.0, 0.065, 0.0], sciana);
    cone(
        &mut m,
        ch_c,
        0.155,
        0.15,
        [0.0, 0.205, 0.0],
        strzecha,
        6,
        [0.0, 0.26, 0.0],
    );
    b(
        &mut m,
        ch_c,
        [0.015, 0.09, 0.065],
        [0.108, 0.045, 0.0],
        drzwi,
        Z3,
    );
    m.node(ch_c).set_pos(-0.02, 0.0, 0.42);
    m.node(ch_c).rot_y(-1.55);
    m.attach(g, ch_c);

    // STUDNIA Z ZURAWIEM
    let st = m.detached_group();
    cyl(&mut m, st, 0.075, 0.085, 0.075, [0.0, 0.0375, 0.0], kamien);
    b(
        &mut m,
        st,
        [0.032, 0.24, 0.032],
        [0.14, 0.12, 0.02],
        drewno_dk,
        Z3,
    );
    b(
        &mut m,
        st,
        [0.25, 0.024, 0.024],
        [0.05, 0.25, 0.02],
        drewno,
        [0.0, 0.0, 0.42],
    );
    b(
        &mut m,
        st,
        [0.048, 0.05, 0.048],
        [0.15, 0.295, 0.02],
        drewno_dk,
        Z3,
    );
    b(
        &mut m,
        st,
        [0.012, 0.10, 0.012],
        [-0.045, 0.145, 0.02],
        belka,
        Z3,
    );
    b(
        &mut m,
        st,
        [0.046, 0.04, 0.046],
        [-0.045, 0.078, 0.02],
        drewno_dk,
        Z3,
    );
    m.node(st).set_pos(0.11, 0.0, 0.15);
    m.node(st).rot_y(2.9);
    m.attach(g, st);

    // PLOTKI
    let plot = |m: &mut MiscModel, x: f64, z: f64, ry: f64| {
        let pg = m.detached_group();
        b(
            m,
            pg,
            [0.028, 0.10, 0.028],
            [-0.10, 0.05, 0.0],
            drewno_dk,
            Z3,
        );
        b(
            m,
            pg,
            [0.028, 0.10, 0.028],
            [0.10, 0.05, 0.0],
            drewno_dk,
            Z3,
        );
        b(m, pg, [0.28, 0.026, 0.02], [0.0, 0.082, 0.0], drewno, Z3);
        m.node(pg).set_pos(x, 0.0, z);
        m.node(pg).rot_y(ry);
        m.attach(g, pg);
    };
    plot(&mut m, 0.34, 0.28, 0.90);
    plot(&mut m, -0.42, 0.14, 0.35);

    // STRAGAN
    let str_g = m.detached_group();
    b(
        &mut m,
        str_g,
        [0.032, 0.19, 0.032],
        [0.095, 0.095, -0.085],
        drewno_dk,
        Z3,
    );
    b(
        &mut m,
        str_g,
        [0.032, 0.19, 0.032],
        [0.095, 0.095, 0.085],
        drewno_dk,
        Z3,
    );
    b(
        &mut m,
        str_g,
        [0.19, 0.015, 0.21],
        [0.015, 0.208, 0.0],
        plachta,
        [0.0, 0.0, -0.30],
    );
    b(
        &mut m,
        str_g,
        [0.15, 0.055, 0.17],
        [0.045, 0.0825, 0.0],
        drewno,
        Z3,
    );
    let dynia = mat(&mut m, p::TOWAR_DYNIA);
    b(
        &mut m,
        str_g,
        [0.05, 0.048, 0.05],
        [0.05, 0.134, -0.042],
        dynia,
        Z3,
    );
    let warzywo = mat(&mut m, p::TOWAR_WARZYWO);
    b(
        &mut m,
        str_g,
        [0.055, 0.04, 0.05],
        [0.045, 0.130, 0.046],
        warzywo,
        Z3,
    );
    m.node(str_g).set_pos(0.15, 0.0, -0.36);
    m.node(str_g).rot_y(0.95);
    m.attach(g, str_g);

    m
}

/// `buildObozBarbarzyncow(color = BARB_FACTION_COLOR)`
/// (`wioska-oboz.ts:249-342`). `color & 0xffffff` tints the gate banner and
/// the totem cloth.
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_oboz_barbarzyncow(color: u32) -> MiscModel {
    let mut m = MiscModel::new();
    let g = m.root();
    let frakcja = mat(&mut m, color & 0x00ff_ffff);
    let pal = mat(&mut m, p::PAL);
    let belka = mat(&mut m, p::DREWNO_DK);
    let skora = mat(&mut m, p::SKORA);
    let skora_dk = mat(&mut m, p::SKORA_DK);
    let lata = mat(&mut m, p::SKORA_LATA);
    let czern = mat(&mut m, p::CZERN);
    let kosc = mat(&mut m, p::KOSC);
    let kamien = mat(&mut m, p::KAMIEN_DK);
    let ogien = mat(&mut m, p::OGIEN);
    let plomien = mat(&mut m, p::PLOMIEN);
    let dym = mat(&mut m, p::DYM);
    let dym_dk = mat(&mut m, p::DYM_DK);
    let stal = mat(&mut m, p::STAL);

    // KLEPISKO
    let klepisko = mat(&mut m, p::KLEPISKO);
    b(
        &mut m,
        g,
        [0.54, 0.011, 0.46],
        [-0.02, 0.0055, 0.02],
        klepisko,
        [0.0, 0.35, 0.0],
    );

    // PALISADA: 10 pali
    for i in 0..10_i32 {
        let az = 110.0 + f64::from(i) * (320.0 / 9.0);
        let (x, z) = az_xz(az, 0.50);
        let h = 0.34 + 0.06 * f64::from((i * 37) % 3) / 2.0;
        let lean = 0.06;
        cone(
            &mut m,
            g,
            0.062,
            h,
            [x, h / 2.0, z],
            pal,
            4,
            [
                -lean * js_cos((az * PI) / 180.0),
                f64::from(i % 3) * 0.4,
                lean * js_sin((az * PI) / 180.0),
            ],
        );
    }
    {
        let (nx, nz) = az_xz(250.0, 0.475);
        b(
            &mut m,
            g,
            [0.032, 0.032, 0.50],
            [nx, 0.14, nz],
            belka,
            [0.0, (-250.0 * PI) / 180.0 + PI / 2.0, 0.0],
        );
    }

    // BRAMA
    let (b1x, b1z) = az_xz(70.0, 0.50);
    let (b2x, b2z) = az_xz(110.0, 0.50);
    b(&mut m, g, [0.065, 0.32, 0.065], [b1x, 0.16, b1z], belka, Z3);
    b(&mut m, g, [0.065, 0.32, 0.065], [b2x, 0.16, b2z], belka, Z3);
    b(
        &mut m,
        g,
        [0.055, 0.055, 0.45],
        [b1x, 0.345, 0.0],
        belka,
        Z3,
    );

    // PROPORZEC
    b(
        &mut m,
        g,
        [0.016, 0.15, 0.11],
        [b1x + 0.02, 0.26, 0.0],
        frakcja,
        Z3,
    );

    // NAMIOT WODZA
    let nam1 = m.detached_group();
    cone(
        &mut m,
        nam1,
        0.21,
        0.30,
        [0.0, 0.15, 0.0],
        skora,
        5,
        [0.0, 0.3, 0.0],
    );
    b(
        &mut m,
        nam1,
        [0.05, 0.10, 0.075],
        [0.135, 0.045, 0.0],
        czern,
        Z3,
    );
    b(
        &mut m,
        nam1,
        [0.015, 0.18, 0.015],
        [0.03, 0.32, 0.02],
        pal,
        [0.4, 0.0, 0.25],
    );
    b(
        &mut m,
        nam1,
        [0.085, 0.10, 0.013],
        [-0.09, 0.13, 0.155],
        lata,
        [0.35, -0.5, 0.0],
    );
    m.node(nam1).set_pos(-0.18, 0.0, -0.18);
    m.node(nam1).rot_y(0.55);
    m.attach(g, nam1);

    // NAMIOT 2
    let nam2 = m.detached_group();
    cone(
        &mut m,
        nam2,
        0.165,
        0.24,
        [0.0, 0.12, 0.0],
        skora_dk,
        5,
        [0.0, 1.1, 0.0],
    );
    b(
        &mut m,
        nam2,
        [0.045, 0.085, 0.065],
        [0.105, 0.04, 0.0],
        czern,
        Z3,
    );
    b(
        &mut m,
        nam2,
        [0.014, 0.15, 0.014],
        [0.01, 0.255, 0.015],
        pal,
        [0.3, 0.0, -0.35],
    );
    m.node(nam2).set_pos(-0.06, 0.0, 0.30);
    m.node(nam2).rot_y(-0.35);
    m.attach(g, nam2);

    // OGNISKO
    let ogn = m.detached_group();
    b(
        &mut m,
        ogn,
        [0.05, 0.04, 0.05],
        [0.09, 0.02, 0.03],
        kamien,
        [0.0, 0.4, 0.0],
    );
    b(
        &mut m,
        ogn,
        [0.048, 0.038, 0.048],
        [-0.05, 0.019, -0.06],
        kamien,
        [0.0, 1.1, 0.0],
    );
    b(
        &mut m,
        ogn,
        [0.16, 0.03, 0.03],
        [0.0, 0.03, 0.01],
        czern,
        [0.0, 0.55, 0.0],
    );
    cone(
        &mut m,
        ogn,
        0.055,
        0.11,
        [0.0, 0.095, 0.0],
        ogien,
        4,
        [0.0, 0.2, 0.0],
    );
    cone(
        &mut m,
        ogn,
        0.03,
        0.07,
        [0.0, 0.10, 0.0],
        plomien,
        4,
        [0.0, 0.6, 0.0],
    );
    b(
        &mut m,
        ogn,
        [0.068, 0.058, 0.068],
        [0.005, 0.285, 0.005],
        dym_dk,
        [0.2, 0.5, 0.15],
    );
    b(
        &mut m,
        ogn,
        [0.092, 0.08, 0.092],
        [0.025, 0.415, 0.025],
        dym,
        [-0.15, 0.2, 0.3],
    );
    m.node(ogn).set_pos(0.20, 0.0, 0.02);
    m.attach(g, ogn);

    // TOTEM
    let tot = m.detached_group();
    b(&mut m, tot, [0.048, 0.40, 0.048], [0.0, 0.20, 0.0], pal, Z3);
    b(
        &mut m,
        tot,
        [0.10, 0.082, 0.105],
        [0.0, 0.435, 0.005],
        kosc,
        Z3,
    );
    b(
        &mut m,
        tot,
        [0.062, 0.042, 0.05],
        [0.0, 0.402, 0.078],
        kosc,
        Z3,
    );
    cone(
        &mut m,
        tot,
        0.024,
        0.14,
        [-0.098, 0.462, 0.0],
        kosc,
        4,
        [0.0, 0.0, 1.25],
    );
    cone(
        &mut m,
        tot,
        0.024,
        0.14,
        [0.098, 0.462, 0.0],
        kosc,
        4,
        [0.0, 0.0, -1.25],
    );
    b(
        &mut m,
        tot,
        [0.016, 0.13, 0.09],
        [0.0, 0.315, 0.005],
        frakcja,
        Z3,
    );
    m.node(tot).set_pos(0.20, 0.0, -0.38);
    m.node(tot).rot_y(1.35);
    m.attach(g, tot);

    // STOJAK Z BRONIA
    let stj = m.detached_group();
    b(
        &mut m,
        stj,
        [0.03, 0.20, 0.03],
        [0.0, 0.10, -0.11],
        pal,
        [0.12, 0.0, 0.0],
    );
    b(
        &mut m,
        stj,
        [0.03, 0.20, 0.03],
        [0.0, 0.10, 0.11],
        pal,
        [-0.12, 0.0, 0.0],
    );
    b(
        &mut m,
        stj,
        [0.026, 0.026, 0.30],
        [0.0, 0.185, 0.0],
        belka,
        Z3,
    );
    b(
        &mut m,
        stj,
        [0.02, 0.30, 0.02],
        [0.055, 0.145, -0.05],
        belka,
        [0.15, 0.0, 0.30],
    );
    b(
        &mut m,
        stj,
        [0.022, 0.24, 0.022],
        [0.05, 0.115, 0.055],
        belka,
        [-0.1, 0.0, 0.26],
    );
    b(
        &mut m,
        stj,
        [0.075, 0.058, 0.022],
        [0.08, 0.228, 0.065],
        stal,
        [0.0, 0.0, 0.26],
    );
    m.node(stj).set_pos(0.24, 0.0, 0.27);
    m.node(stj).rot_y(0.55);
    m.attach(g, stj);

    m
}
