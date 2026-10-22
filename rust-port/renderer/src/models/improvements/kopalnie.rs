//! `render/kopalnia-cyny-opus5.ts` and `render/kopalnia-zlota-opus5.ts`
//! (`edb8fb56`): the tin and gold mines (`MeshStandardMaterial`, module
//! singletons for materials and geometries, `strut` beams).
//!
//! Material singletons: the web caches one material per colour per module
//! (`MATS`), so meshes of one colour share one material object — also
//! across several mines of the same kind inside one tree. [`MineMats`]
//! reproduces that sharing per model and per module. Geometry singletons
//! (`GEOS`) only share buffers; the geometry data is the same either way.

// `0.318` etc. are literal web coordinates, not approximations of 1/π.
#![allow(clippy::too_many_arguments, clippy::approx_constant)]

use std::collections::HashMap;

use crate::geom::{Euler, EulerOrder, Quat, Vec3};
use crate::models::unit_core::model::{quat_from_euler, MatId, NodeId, Prim, ROOT};

use super::model::ImprovementExt;
use super::model::{hex_to_linear, set_user_data, ImprovementModel, UserData};

/// `HEX_R` (`hexutil.ts:24`).
const R: f64 = 1.0;

/// Which module's singleton cache a material belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Mine {
    /// `kopalnia-cyny-opus5.ts`.
    Cyna,
    /// `kopalnia-zlota-opus5.ts`.
    Zlota,
}

/// Per-model material caches (`MATS` of both modules).
#[derive(Debug, Default)]
pub struct MineMats(HashMap<(Mine, u32), MatId>);

/// Tin-mine palette `KC` (`kopalnia-cyny-opus5.ts:98-118`).
mod kc {
    pub const SKALA: u32 = 0x77706a;
    pub const SKALA_DK: u32 = 0x5c5751;
    pub const SKALA_HI: u32 = 0x8b847c;
    pub const KASYTERYT: u32 = 0x2a201a;
    pub const KASYT_HI: u32 = 0x4a3a2e;
    pub const GLINA: u32 = 0xb0663a;
    pub const GLINA_DK: u32 = 0x8a4a24;
    pub const DREWNO: u32 = 0xc98a4b;
    pub const DREWNO_DK: u32 = 0x8a5a2e;
    pub const SKORA: u32 = 0x9c7a4f;
    pub const WIKLINA: u32 = 0xb2823f;
    pub const WEGIEL: u32 = 0x1d1b19;
    pub const ZAR: u32 = 0xff8a1e;
    pub const ZAR_DK: u32 = 0xd44f10;
    pub const DYM: u32 = 0xb8b2a8;
    pub const WODA: u32 = 0x6b95a4;
    pub const CYNA: u32 = 0xdae2ec;
    pub const CYNA_DK: u32 = 0xa9b2bd;
    pub const CZERN: u32 = 0x14100b;
}

/// Gold-mine palette `KZ` (`kopalnia-zlota-opus5.ts`).
mod kz {
    pub const SKALA: u32 = 0xa39d8f;
    pub const SKALA_DK: u32 = 0x78735f;
    pub const KWARC: u32 = 0xcac2ae;
    pub const DREWNO: u32 = 0xc98a4b;
    pub const DREWNO_DK: u32 = 0x8a5a2e;
    pub const LINA: u32 = 0xb9a37c;
    pub const WIKLINA: u32 = 0xb2823f;
    pub const RUNO: u32 = 0xe4d7ba;
    pub const WODA: u32 = 0x6b95a4;
    pub const WODA_DK: u32 = 0x577c8b;
    pub const ZLOTO: u32 = 0xffd12a;
    pub const ZLOTO_DK: u32 = 0xe0a114;
    pub const CZERN: u32 = 0x14100b;
}

fn scaled(c: [f64; 3], s: f64) -> [f64; 3] {
    [c[0] * s, c[1] * s, c[2] * s]
}

/// The module `mat(color)` of either mine.
fn mat(m: &mut ImprovementModel, cache: &mut MineMats, mine: Mine, color: u32) -> MatId {
    if let Some(&id) = cache.0.get(&(mine, color)) {
        return id;
    }
    let (metalness, roughness, emissive) = match mine {
        Mine::Cyna => {
            let cynowy = color == kc::CYNA || color == kc::CYNA_DK;
            let zarowy = color == kc::ZAR || color == kc::ZAR_DK;
            (
                if cynowy { 0.72 } else { 0.04 },
                if cynowy { 0.30 } else { 0.88 },
                if zarowy {
                    scaled(hex_to_linear(color), 0.35)
                } else {
                    [0.0; 3]
                },
            )
        }
        Mine::Zlota => {
            let zloty = color == kz::ZLOTO || color == kz::ZLOTO_DK;
            (
                if zloty { 0.62 } else { 0.04 },
                if zloty { 0.28 } else { 0.88 },
                if zloty {
                    scaled(hex_to_linear(color), 0.22)
                } else {
                    [0.0; 3]
                },
            )
        }
    };
    let id = m.standard(color, true, metalness, roughness, emissive);
    cache.0.insert((mine, color), id);
    id
}

struct Ctx<'a> {
    m: &'a mut ImprovementModel,
    cache: &'a mut MineMats,
    mine: Mine,
}

impl Ctx<'_> {
    fn mat(&mut self, color: u32) -> MatId {
        mat(self.m, self.cache, self.mine, color)
    }

    /// `B(g, w, h, d, x, y, z, color, rx, ry, rz)`: box, position × R,
    /// cast + receive shadow.
    fn b(
        &mut self,
        g: NodeId,
        w: f64,
        h: f64,
        d: f64,
        x: f64,
        y: f64,
        z: f64,
        color: u32,
        rx: f64,
        ry: f64,
        rz: f64,
    ) -> NodeId {
        let mt = self.mat(color);
        let id = self.m.mesh(g, Prim::bx(w, h, d), mt);
        self.m.node(id).set_pos(x * R, y * R, z * R);
        if rx != 0.0 || ry != 0.0 || rz != 0.0 {
            self.m.set_rotation(id, rx, ry, rz);
        }
        self.m.shadows(id, true, true);
        id
    }

    fn b0(&mut self, g: NodeId, w: f64, h: f64, d: f64, x: f64, y: f64, z: f64, color: u32) {
        self.b(g, w, h, d, x, y, z, color, 0.0, 0.0, 0.0);
    }

    /// `C(g, rt, rb, h, x, y, z, color, seg, rx, ry, rz)`: closed cylinder,
    /// cast shadow only.
    fn c(
        &mut self,
        g: NodeId,
        rt: f64,
        rb: f64,
        h: f64,
        x: f64,
        y: f64,
        z: f64,
        color: u32,
        seg: u32,
        rx: f64,
        ry: f64,
        rz: f64,
    ) {
        let mt = self.mat(color);
        let id = self.m.mesh(g, Prim::cyl(rt, rb, h, seg), mt);
        self.m.node(id).set_pos(x * R, y * R, z * R);
        if rx != 0.0 || ry != 0.0 || rz != 0.0 {
            self.m.set_rotation(id, rx, ry, rz);
        }
        self.m.shadows(id, true, false);
    }

    fn c0(
        &mut self,
        g: NodeId,
        rt: f64,
        rb: f64,
        h: f64,
        x: f64,
        y: f64,
        z: f64,
        color: u32,
        seg: u32,
    ) {
        self.c(g, rt, rb, h, x, y, z, color, seg, 0.0, 0.0, 0.0);
    }

    /// `strut(g, color, r, ax, ay, az, bx, by, bz)`: unit cylinder scaled to
    /// the segment A→B, `quaternion.setFromUnitVectors(up, dir.normalize())`.
    fn strut(&mut self, g: NodeId, color: u32, r: f64, a: (f64, f64, f64), b: (f64, f64, f64)) {
        let va = Vec3::new(a.0 * R, a.1 * R, a.2 * R);
        let vb = Vec3::new(b.0 * R, b.1 * R, b.2 * R);
        let dir = vb.minus(va);
        let len = dir.length();
        let mt = self.mat(color);
        let id = self.m.mesh(g, Prim::cyl(1.0, 1.0, 1.0, 6), mt);
        let pos = Vec3::new(
            (va.x + vb.x) * 0.5,
            (va.y + vb.y) * 0.5,
            (va.z + vb.z) * 0.5,
        );
        self.m
            .node(id)
            .set_scale(r * R, len, r * R)
            .set_pos_v(pos)
            .quat_from_unit_vectors(Vec3::new(0.0, 1.0, 0.0), dir.normalize());
        self.m.shadows(id, true, false);
    }
}

fn mark_shared(m: &mut ImprovementModel, g: NodeId) {
    set_user_data(
        m,
        g,
        UserData {
            mats: Some(0),
            per_token_geos: Some(0),
            deposit_display_scale: None,
        },
    );
}

/// `buildKopalniaCyny()` (`kopalnia-cyny-opus5.ts:227-344`) into `g`.
pub fn build_kopalnia_cyny_into(m: &mut ImprovementModel, cache: &mut MineMats, g: NodeId) {
    use kc::*;
    let mut c = Ctx {
        m,
        cache,
        mine: Mine::Cyna,
    };
    c.b(
        g, 0.86, 0.045, 0.70, 0.00, 0.022, 0.00, SKALA_DK, 0.0, 0.10, 0.0,
    );
    c.b(
        g, 0.50, 0.30, 0.22, -0.06, 0.150, -0.395, SKALA, 0.0, 0.10, 0.0,
    );
    c.b(
        g, 0.25, 0.20, 0.19, 0.27, 0.100, -0.325, SKALA_HI, 0.0, -0.30, 0.0,
    );
    c.b(
        g, 0.28, 0.11, 0.15, -0.14, 0.345, -0.400, SKALA_HI, 0.0, 0.24, 0.06,
    );
    c.b(
        g, 0.30, 0.050, 0.035, -0.12, 0.238, -0.288, KASYTERYT, 0.0, 0.10, 0.15,
    );
    c.b(
        g, 0.12, 0.038, 0.032, -0.28, 0.170, -0.286, KASYT_HI, 0.0, 0.10, -0.42,
    );
    c.b(
        g, 0.11, 0.036, 0.032, 0.16, 0.155, -0.240, KASYTERYT, 0.0, -0.30, 0.32,
    );
    c.b0(g, 0.080, 0.235, 0.055, -0.05, 0.118, -0.283, CZERN);
    c.b0(g, 0.032, 0.255, 0.038, -0.108, 0.128, -0.268, DREWNO_DK);
    c.b0(g, 0.032, 0.255, 0.038, 0.008, 0.128, -0.268, DREWNO_DK);
    c.b0(g, 0.170, 0.038, 0.042, -0.05, 0.272, -0.268, DREWNO_DK);
    for (mx, mz, rot) in [(0.150, -0.180, 0.55), (0.320, -0.110, -0.75)] {
        c.b(
            g, 0.120, 0.072, 0.078, mx, 0.036, mz, SKALA_DK, 0.0, rot, 0.0,
        );
        c.b(g, 0.026, 0.078, 0.084, mx, 0.039, mz, CZERN, 0.0, rot, 0.0);
        let s = crate::jsmath::js_sin(rot);
        let co = crate::jsmath::js_cos(rot);
        c.strut(
            g,
            DREWNO_DK,
            0.013,
            (mx - s * 0.075, 0.040, mz - co * 0.075),
            (mx - s * 0.200, 0.030, mz - co * 0.200),
        );
    }
    let (px, pz) = (-0.290, -0.010);
    c.c0(g, 0.238, 0.254, 0.052, px, 0.026, pz, GLINA_DK, 8);
    c.c0(g, 0.198, 0.230, 0.165, px, 0.134, pz, GLINA, 8);
    c.c0(g, 0.104, 0.194, 0.122, px, 0.278, pz, GLINA, 8);
    c.c0(g, 0.062, 0.086, 0.058, px, 0.368, pz, GLINA_DK, 8);
    c.c0(g, 0.196, 0.196, 0.026, px, 0.212, pz, GLINA_DK, 8);
    c.b(
        g,
        0.150,
        0.028,
        0.090,
        px + 0.020,
        0.014,
        pz + 0.268,
        WEGIEL,
        0.0,
        0.18,
        0.0,
    );
    c.b0(g, 0.145, 0.130, 0.055, px, 0.120, pz + 0.208, CZERN);
    c.b0(g, 0.110, 0.068, 0.030, px, 0.094, pz + 0.232, ZAR);
    c.b0(g, 0.078, 0.036, 0.026, px, 0.148, pz + 0.230, ZAR_DK);
    c.b(
        g,
        0.072,
        0.064,
        0.072,
        px + 0.014,
        0.436,
        pz + 0.058,
        DYM,
        0.20,
        0.5,
        0.15,
    );
    c.b(
        g,
        0.092,
        0.082,
        0.092,
        px + 0.040,
        0.522,
        pz + 0.104,
        DYM,
        -0.15,
        0.2,
        0.30,
    );
    c.b(
        g, 0.155, 0.075, 0.130, -0.435, 0.058, -0.215, SKORA, 0.0, -0.55, 0.0,
    );
    c.b(
        g, 0.150, 0.026, 0.125, -0.435, 0.108, -0.215, DREWNO, 0.0, -0.55, 0.0,
    );
    c.b(
        g, 0.020, 0.115, 0.020, -0.480, 0.150, -0.255, DREWNO_DK, 0.0, 0.0, 0.22,
    );
    c.strut(
        g,
        GLINA_DK,
        0.020,
        (-0.372, 0.075, -0.176),
        (px - 0.140, 0.085, pz - 0.060),
    );
    c.c0(g, 0.010, 0.115, 0.125, -0.395, 0.062, 0.205, WEGIEL, 7);
    c.b(
        g, 0.060, 0.052, 0.058, -0.268, 0.026, 0.238, WEGIEL, 0.0, 0.4, 0.0,
    );
    c.b(
        g, 0.048, 0.042, 0.046, -0.470, 0.021, 0.115, WEGIEL, 0.0, -0.3, 0.0,
    );
    {
        let pl = c.m.detached();
        c.b0(pl, 0.370, 0.042, 0.240, 0.0, 0.021, 0.0, DREWNO);
        for dz in [-0.108, 0.108] {
            c.b0(pl, 0.370, 0.070, 0.030, 0.0, 0.055, dz, DREWNO_DK);
        }
        for dx in [-0.185, 0.185] {
            c.b0(pl, 0.026, 0.070, 0.212, dx, 0.055, 0.0, DREWNO_DK);
        }
        c.b0(pl, 0.320, 0.026, 0.185, 0.010, 0.055, 0.0, KASYTERYT);
        c.b0(pl, 0.120, 0.020, 0.180, -0.115, 0.070, 0.0, WODA);
        c.b(
            pl, 0.070, 0.030, 0.062, 0.120, 0.076, -0.030, KASYT_HI, 0.0, 0.4, 0.0,
        );
        // PL_X = 0.235, PL_Z = 0.300, PL_YAW = -0.42
        c.m.node(pl).set_pos(0.235 * R, 0.0, 0.300 * R).rot_y(-0.42);
        c.m.attach(g, pl);
    }
    c.b(
        g, 0.190, 0.038, 0.075, 0.030, 0.040, 0.222, DREWNO_DK, 0.0, -0.42, 0.0,
    );
    c.b(
        g, 0.150, 0.016, 0.045, 0.030, 0.062, 0.222, WODA, 0.0, -0.42, 0.0,
    );
    c.b(
        g, 0.265, 0.032, 0.185, -0.085, 0.016, 0.318, DREWNO_DK, 0.0, 0.18, 0.0,
    );
    c.c0(g, 0.078, 0.094, 0.056, -0.170, 0.060, 0.306, CYNA, 8);
    c.c0(g, 0.078, 0.094, 0.056, -0.006, 0.060, 0.332, CYNA, 8);
    c.c0(g, 0.070, 0.086, 0.052, -0.088, 0.114, 0.318, CYNA_DK, 8);
    c.c0(g, 0.058, 0.072, 0.046, -0.088, 0.163, 0.318, CYNA, 8);
    c.c0(g, 0.088, 0.068, 0.105, 0.430, 0.052, 0.055, WIKLINA, 8);
    c.c0(g, 0.096, 0.096, 0.020, 0.430, 0.112, 0.055, DREWNO_DK, 8);
    c.b(
        g, 0.075, 0.055, 0.070, 0.430, 0.132, 0.055, KASYTERYT, 0.0, 0.45, 0.0,
    );
    c.b(
        g, 0.052, 0.040, 0.048, 0.398, 0.155, 0.020, KASYT_HI, 0.0, -0.35, 0.0,
    );
    c.b(
        g, 0.078, 0.060, 0.072, 0.300, 0.030, 0.185, KASYTERYT, 0.0, 0.30, 0.0,
    );
    c.b(
        g, 0.058, 0.046, 0.054, 0.135, 0.023, 0.075, KASYT_HI, 0.0, -0.50, 0.0,
    );
    mark_shared(c.m, g);
}

/// `SL_Q = new Quaternion().setFromEuler(new Euler(SL_TILT, SL_YAW, 0, 'YXZ'))`.
fn sl_q() -> Quat {
    quat_from_euler(Euler {
        x: 0.40,
        y: 0.55,
        z: 0.0,
        order: EulerOrder::Yxz,
    })
}

/// `Vector3.applyQuaternion(q)` (three r169 `Vector3.js:252-271`).
fn apply_quat(v: Vec3, q: Quat) -> Vec3 {
    let (vx, vy, vz) = (v.x, v.y, v.z);
    let (qx, qy, qz, qw) = (q.x, q.y, q.z, q.w);
    let tx = 2.0 * (qy * vz - qz * vy);
    let ty = 2.0 * (qz * vx - qx * vz);
    let tz = 2.0 * (qx * vy - qy * vx);
    Vec3::new(
        vx + qw * tx + qy * tz - qz * ty,
        vy + qw * ty + qz * tx - qx * tz,
        vz + qw * tz + qx * ty - qy * tx,
    )
}

/// `sluice(lx, ly, lz)`: point of the sluice frame → model space.
fn sluice(lx: f64, ly: f64, lz: f64) -> (f64, f64, f64) {
    let v = apply_quat(Vec3::new(lx, ly, lz), sl_q());
    (0.250 + v.x, 0.250 + v.y, 0.095 + v.z)
}

/// `BSL(g, w, h, d, lx, ly, lz, color)`: box in the sluice frame
/// (`quaternion.copy(SL_Q)`), cast shadow only.
fn bsl(c: &mut Ctx<'_>, g: NodeId, w: f64, h: f64, d: f64, l: (f64, f64, f64), color: u32) {
    let (x, y, z) = sluice(l.0, l.1, l.2);
    let mt = c.mat(color);
    let id = c.m.mesh(g, Prim::bx(w, h, d), mt);
    let n = c.m.node(id);
    n.set_pos(x * R, y * R, z * R);
    n.quaternion = sl_q();
    c.m.shadows(id, true, false);
}

/// `buildKopalniaZlota()` (`kopalnia-zlota-opus5.ts`) into `g`.
pub fn build_kopalnia_zlota_into(m: &mut ImprovementModel, cache: &mut MineMats, g: NodeId) {
    use kz::*;
    let mut c = Ctx {
        m,
        cache,
        mine: Mine::Zlota,
    };
    c.b(
        g, 0.88, 0.05, 0.72, 0.00, 0.025, -0.02, SKALA, 0.0, 0.12, 0.0,
    );
    c.b(
        g, 0.50, 0.06, 0.40, -0.20, 0.080, -0.20, SKALA_DK, 0.0, -0.22, 0.0,
    );
    c.b(
        g, 0.44, 0.22, 0.16, -0.20, 0.110, -0.415, KWARC, 0.0, -0.14, 0.0,
    );
    c.b(
        g, 0.20, 0.13, 0.13, 0.05, 0.065, -0.430, KWARC, 0.0, 0.30, 0.0,
    );
    c.b(
        g, 0.34, 0.055, 0.040, -0.20, 0.150, -0.333, ZLOTO, 0.0, -0.14, 0.16,
    );
    c.b(
        g, 0.13, 0.040, 0.036, -0.30, 0.085, -0.331, ZLOTO_DK, 0.0, -0.14, -0.40,
    );
    c.b(
        g, 0.10, 0.036, 0.034, 0.04, 0.108, -0.362, ZLOTO, 0.0, 0.30, 0.30,
    );
    c.b0(g, 0.24, 0.10, 0.20, -0.20, 0.070, -0.16, CZERN);
    c.b0(g, 0.30, 0.040, 0.045, -0.20, 0.128, -0.055, DREWNO_DK);
    c.b0(g, 0.30, 0.040, 0.045, -0.20, 0.128, -0.265, DREWNO_DK);
    c.b0(g, 0.045, 0.040, 0.215, -0.325, 0.128, -0.160, DREWNO_DK);
    c.b0(g, 0.045, 0.040, 0.215, -0.075, 0.128, -0.160, DREWNO_DK);
    let (ax, ay, az) = (-0.20, 0.520, -0.16);
    c.strut(
        g,
        DREWNO,
        0.022,
        (ax - 0.235, 0.035, az + 0.135),
        (ax, ay, az),
    );
    c.strut(
        g,
        DREWNO,
        0.022,
        (ax + 0.235, 0.035, az + 0.135),
        (ax, ay, az),
    );
    c.strut(
        g,
        DREWNO,
        0.022,
        (ax + 0.010, 0.035, az - 0.255),
        (ax, ay, az),
    );
    c.c0(g, 0.044, 0.044, 0.05, ax, ay - 0.018, az, LINA, 6);
    let half_pi = std::f64::consts::PI / 2.0;
    c.c(
        g, 0.030, 0.030, 0.15, ax, 0.408, az, DREWNO, 6, 0.0, 0.0, half_pi,
    );
    for dx in [-0.040, 0.040] {
        c.c(
            g,
            0.036,
            0.036,
            0.020,
            ax + dx,
            0.408,
            az,
            LINA,
            6,
            0.0,
            0.0,
            half_pi,
        );
    }
    c.strut(
        g,
        LINA,
        0.008,
        (ax, 0.395, az + 0.03),
        (ax, 0.250, az + 0.03),
    );
    c.c0(g, 0.082, 0.062, 0.10, ax, 0.195, az + 0.03, WIKLINA, 8);
    c.c0(g, 0.090, 0.090, 0.020, ax, 0.250, az + 0.03, DREWNO_DK, 8);
    c.b(
        g,
        0.050,
        0.042,
        0.046,
        ax - 0.034,
        0.252,
        az + 0.040,
        KWARC,
        0.0,
        0.4,
        0.0,
    );
    c.b(
        g,
        0.062,
        0.052,
        0.058,
        ax + 0.014,
        0.264,
        az + 0.014,
        ZLOTO,
        0.0,
        0.6,
        0.0,
    );
    c.b(
        g,
        0.046,
        0.040,
        0.044,
        ax - 0.022,
        0.268,
        az - 0.026,
        ZLOTO_DK,
        0.0,
        -0.4,
        0.0,
    );

    let sl_len = 0.50;
    bsl(&mut c, g, 0.150, 0.035, sl_len, (0.0, 0.0, 0.0), DREWNO);
    for dx in [-0.0875, 0.0875] {
        bsl(&mut c, g, 0.025, 0.080, sl_len, (dx, 0.022, 0.0), DREWNO_DK);
    }
    bsl(
        &mut c,
        g,
        0.150,
        0.085,
        0.028,
        (0.0, 0.035, -sl_len / 2.0),
        DREWNO_DK,
    );
    bsl(&mut c, g, 0.122, 0.014, 0.42, (0.0, 0.016, 0.03), RUNO);
    bsl(&mut c, g, 0.120, 0.018, 0.15, (0.0, 0.030, -0.168), WODA);
    for (lx, lz) in [
        (-0.034, 0.010),
        (0.030, 0.062),
        (-0.024, 0.108),
        (0.032, 0.152),
        (-0.030, 0.196),
        (0.014, 0.226),
    ] {
        bsl(&mut c, g, 0.044, 0.020, 0.046, (lx, 0.030, lz), ZLOTO);
    }
    for lz in [-0.155, 0.165] {
        let (ux, uy, uz) = sluice(0.0, -0.020, lz);
        let (lxw, _, lzw) = sluice(-0.115, 0.0, lz);
        let (rxw, _, rzw) = sluice(0.115, 0.0, lz);
        c.strut(g, DREWNO_DK, 0.017, (lxw, 0.040, lzw), (ux, uy, uz));
        c.strut(g, DREWNO_DK, 0.017, (rxw, 0.040, rzw), (ux, uy, uz));
    }
    c.c0(g, 0.140, 0.155, 0.06, 0.350, 0.030, 0.395, SKALA_DK, 8);
    c.c0(g, 0.114, 0.114, 0.025, 0.350, 0.062, 0.395, WODA_DK, 8);
    {
        let misa = c.m.detached();
        c.c0(misa, 0.128, 0.098, 0.055, 0.0, 0.028, 0.0, DREWNO_DK, 8);
        c.c0(misa, 0.118, 0.118, 0.016, 0.0, 0.062, 0.0, DREWNO, 8);
        c.c0(misa, 0.104, 0.104, 0.026, 0.0, 0.076, 0.0, ZLOTO, 8);
        c.c0(misa, 0.030, 0.070, 0.036, 0.0, 0.100, 0.0, ZLOTO, 6);
        c.m.node(misa)
            .rot_x(0.42)
            .set_pos(-0.315 * R, 0.052 * R, 0.315 * R);
        c.m.attach(g, misa);
    }
    c.b(
        g, 0.230, 0.070, 0.190, 0.335, 0.085, -0.290, SKALA_DK, 0.0, 0.22, 0.0,
    );
    c.c0(g, 0.058, 0.070, 0.060, 0.335, 0.150, -0.290, SKALA, 6);
    c.b(
        g, 0.055, 0.038, 0.052, 0.215, 0.069, -0.200, KWARC, 0.0, 0.5, 0.0,
    );
    c.b(
        g, 0.048, 0.034, 0.046, 0.440, 0.067, -0.235, KWARC, 0.0, -0.4, 0.0,
    );
    c.b(
        g, 0.090, 0.024, 0.070, 0.335, 0.128, -0.290, ZLOTO, 0.0, 0.22, 0.0,
    );
    c.b(
        g, 0.200, 0.110, 0.190, -0.430, 0.095, 0.115, KWARC, 0.0, 0.28, 0.0,
    );
    c.b(
        g, 0.140, 0.085, 0.130, -0.395, 0.185, 0.150, KWARC, 0.0, -0.35, 0.0,
    );
    c.b(
        g, 0.100, 0.060, 0.090, -0.465, 0.170, 0.040, SKALA, 0.0, 0.50, 0.0,
    );
    c.b(
        g, 0.072, 0.058, 0.066, -0.393, 0.252, 0.150, ZLOTO, 0.0, 0.35, 0.0,
    );
    c.b(
        g, 0.050, 0.040, 0.048, -0.462, 0.218, 0.038, ZLOTO_DK, 0.0, -0.30, 0.0,
    );
    mark_shared(c.m, g);
}

/// `buildKopalniaCyny()` as a standalone model.
#[must_use]
pub fn build_kopalnia_cyny() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_kopalnia_cyny_into(&mut m, &mut MineMats::default(), ROOT);
    m
}

/// `buildKopalniaZlota()` as a standalone model.
#[must_use]
pub fn build_kopalnia_zlota() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_kopalnia_zlota_into(&mut m, &mut MineMats::default(), ROOT);
    m
}
