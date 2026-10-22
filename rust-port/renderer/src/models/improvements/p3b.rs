//! `render/ulepszenia-modele-p3b.ts` (`edb8fb56`): irrigation, irrigated
//! field, fort, outpost and the mineral deposit overlays (`buildZloze*`).

use std::f64::consts::PI;

use crate::models::unit_core::model::{MatId, NodeId, ROOT};

use super::kit::{az_xz, b, b0, cone, cyl};
use super::model::ImprovementExt;
use super::model::ImprovementModel;

/// Palette `P3B` (`:137-159`).
pub mod pal {
    #![allow(missing_docs)]
    pub const DREWNO: u32 = 0xc98a4b;
    pub const DREWNO_DK: u32 = 0x8a5a2e;
    pub const DREWNO_C: u32 = 0x6b4423;
    pub const KAMIEN: u32 = 0x9aa5b1;
    pub const KAMIEN_DK: u32 = 0x717d89;
    pub const KAMIEN_HI: u32 = 0xb7c0c8;
    pub const DACH_CZERW: u32 = 0xd93a2b;
    pub const DACH_CZERW_DK: u32 = 0xb02a1f;
    pub const CZERN: u32 = 0x14100b;
    pub const WODA: u32 = 0x4ab6e8;
    pub const WODA_DK: u32 = 0x2f96cc;
    pub const ZIEMIA: u32 = 0x8a6a45;
    pub const ZIEMIA_DK: u32 = 0x6e5436;
    pub const KRZEW_MLODY: u32 = 0x5ec74a;
    pub const KRZEW_MLODY_DK: u32 = 0x4bb03a;
    pub const KRZEW_SREDNI: u32 = 0xa9c93f;
    pub const KRZEW_SREDNI_DK: u32 = 0x8fb32f;
    pub const ZBOZE: u32 = 0xe9c34e;
    pub const ZBOZE_DK: u32 = 0xc99f35;
    pub const DROGA_PAS: u32 = 0xd2b184;
    pub const DROGA_KOLEINA: u32 = 0xa8895e;
    pub const DROGA_POBOCZE: u32 = 0x8a6a45;
    pub const DROGA_PLAMA: u32 = 0xc3a173;
    pub const BRUK_BAZA: u32 = 0x7b8794;
    pub const BRUK_A: u32 = 0xb9c2ca;
    pub const BRUK_B: u32 = 0x939ea9;
    pub const BRUK_OBRZEZE: u32 = 0xd2d9df;
    pub const MIEDZ: u32 = 0xe07b2f;
    pub const MIEDZ_TURKUS: u32 = 0x39c6b2;
    pub const RDZA: u32 = 0x9a4f26;
    pub const RDZA_HI: u32 = 0xb46435;
    pub const METAL_POLYSK: u32 = 0xcdd3d9;
    pub const RDZA_DK: u32 = 0x6e3a1e;
    pub const WEGIEL: u32 = 0x17171b;
    pub const WEGIEL_HI: u32 = 0x40454d;
    pub const WEGIEL_BAZA: u32 = 0x2c2e33;
    pub const SOL: u32 = 0xf7fbff;
    pub const SOL_DK: u32 = 0xdfe9f2;
    pub const SOLANKA: u32 = 0xbfe4f2;
    pub const ZLOTO: u32 = 0xffc21a;
    pub const ZLOTO_HI: u32 = 0xffe86e;
    pub const ZLOTO_DK: u32 = 0xc98505;
    pub const ZLOTO_SKALA: u32 = 0x4b4453;
    pub const KASYTERYT: u32 = 0x2a201a;
    pub const KASYT_HI: u32 = 0x4a3a2e;
    pub const CYNA_OKRUCH: u32 = 0xc6ccd4;
    pub const CYNA_SKALA: u32 = 0x76797e;
    pub const GLINA_A: u32 = 0xb85c33;
    pub const GLINA_B: u32 = 0xd97742;
    pub const GLINA_C: u32 = 0xe8935a;
    pub const GLINA_MOKRA: u32 = 0xc44f22;
    pub const PLOMIEN: u32 = 0xffc02e;
    pub const PLOMIEN_DK: u32 = 0xff7a1a;
    pub const METAL: u32 = 0x545d66;
}
use pal::*;

/// `ZlozeTyp` (`:84`). [`ZlozeTyp::Inne`] stands for any other string,
/// which `buildZlozeKlaster` sends to its final `else` (clay strata).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ZlozeTyp {
    /// `'miedz'`.
    Miedz,
    /// `'zelazo'`.
    Zelazo,
    /// `'wegiel'`.
    Wegiel,
    /// `'sol'`.
    Sol,
    /// `'glina'`.
    Glina,
    /// `'zloto'`.
    Zloto,
    /// `'cyna'`.
    Cyna,
    /// Any other value (same branch as `'glina'`).
    Inne,
}

impl ZlozeTyp {
    /// Parses the web string.
    #[must_use]
    pub fn from_web(s: &str) -> Self {
        match s {
            "miedz" => Self::Miedz,
            "zelazo" => Self::Zelazo,
            "wegiel" => Self::Wegiel,
            "sol" => Self::Sol,
            "glina" => Self::Glina,
            "zloto" => Self::Zloto,
            "cyna" => Self::Cyna,
            _ => Self::Inne,
        }
    }
}

/// `ULEPSZENIA_P3B_LAYOUT` (`:534-571`).
pub mod layout {
    /// One deposit slot: azimuth (deg), ring radius, scale, `rotY`.
    pub type SlotZloza = (f64, f64, f64, f64);
    /// `fort.budynek.rotY`.
    pub const FORT_ROT_Y: f64 = -1.05;
    /// `posterunek.budynek.rotY`.
    pub const POSTERUNEK_ROT_Y: f64 = -1.15;
    /// `irygacja.budynek.rotY`.
    pub const IRYGACJA_ROT_Y: f64 = -0.30;
    /// `pole_irygowane.budynek.rotY`.
    pub const POLE_IRYGOWANE_ROT_Y: f64 = -0.18;
    /// `zloza.miedz`.
    pub const MIEDZ: [SlotZloza; 4] = [
        (15.0, 0.62, 1.0, 0.4),
        (105.0, 0.66, 0.85, 2.1),
        (190.0, 0.60, 0.92, -0.7),
        (295.0, 0.68, 0.78, 1.2),
    ];
    /// `zloza.zelazo`.
    pub const ZELAZO: [SlotZloza; 4] = [
        (40.0, 0.64, 1.0, -0.3),
        (130.0, 0.60, 0.88, 1.5),
        (235.0, 0.66, 0.95, 0.6),
        (320.0, 0.62, 0.8, -1.1),
    ];
    /// `zloza.wegiel`.
    pub const WEGIEL: [SlotZloza; 4] = [
        (10.0, 0.60, 1.0, 0.2),
        (120.0, 0.66, 0.9, -0.8),
        (205.0, 0.62, 0.85, 1.7),
        (300.0, 0.64, 0.95, 0.9),
    ];
    /// `zloza.sol`.
    pub const SOL: [SlotZloza; 4] = [
        (30.0, 0.62, 1.0, 0.5),
        (210.0, 0.64, 0.9, -0.4),
        (280.0, 0.60, 0.82, 1.3),
        (345.0, 0.68, 0.9, 2.2),
    ];
    /// `zloza.glina`.
    pub const GLINA: [SlotZloza; 4] = [
        (55.0, 0.62, 1.0, 0.3),
        (145.0, 0.64, 0.9, -1.2),
        (250.0, 0.62, 0.95, 0.8),
        (330.0, 0.60, 0.85, 1.9),
    ];
    /// `zloza.zloto`.
    pub const ZLOTO: [SlotZloza; 4] = [
        (25.0, 0.62, 1.0, 0.6),
        (115.0, 0.64, 0.9, -0.5),
        (215.0, 0.62, 0.95, 1.4),
        (310.0, 0.66, 0.82, 2.1),
    ];
    /// `zloza.cyna`.
    pub const CYNA: [SlotZloza; 4] = [
        (45.0, 0.62, 1.0, -0.6),
        (135.0, 0.66, 0.88, 1.1),
        (225.0, 0.62, 0.95, -1.5),
        (320.0, 0.64, 0.84, 0.7),
    ];
}

/// `buildIrygacja()` (`:164-226`) into `g`.
pub fn build_irygacja_into(m: &mut ImprovementModel, g: NodeId) {
    let brzeg_m = m.lambert(KAMIEN);
    let brzeg_dk_m = m.lambert(KAMIEN_DK);
    let woda_m = m.lambert(WODA);
    let woda_dk_m = m.lambert(WODA_DK);
    let drewno_m = m.lambert(DREWNO_DK);
    let drewno_c_m = m.lambert(DREWNO_C);
    let deska_m = m.lambert(DREWNO);
    let ziemia_m = m.lambert(ZIEMIA);

    let kw = 0.105;
    b0(m, g, 1.56, 0.055, 0.13, 0.0, 0.0325, 0.0, woda_m);
    for sz in [-1.0, 1.0] {
        let (m1, m2) = if sz < 0.0 {
            (brzeg_m, brzeg_dk_m)
        } else {
            (brzeg_dk_m, brzeg_m)
        };
        b0(m, g, 1.10, 0.09, 0.055, -0.23, 0.045, sz * kw, m1);
        b0(m, g, 0.38, 0.09, 0.055, 0.59, 0.045, sz * kw, m2);
    }
    b0(m, g, 0.13, 0.05, 0.62, 0.30, 0.028, 0.36, woda_dk_m);
    for sx in [-1.0, 1.0] {
        let mat = if sx < 0.0 { brzeg_dk_m } else { brzeg_m };
        b0(m, g, 0.055, 0.085, 0.52, 0.30 + sx * kw, 0.0425, 0.40, mat);
    }
    b0(m, g, 0.15, 0.06, 0.15, 0.30, 0.033, 0.02, woda_m);
    let slz = -0.25;
    b0(m, g, 0.05, 0.26, 0.05, slz, 0.13, kw + 0.02, drewno_m);
    b0(m, g, 0.05, 0.26, 0.05, slz, 0.13, -kw - 0.02, drewno_m);
    b0(m, g, 0.055, 0.05, 0.34, slz, 0.285, 0.0, drewno_c_m);
    b0(m, g, 0.022, 0.13, 0.20, slz, 0.135, 0.0, deska_m);
    b(
        m, g, 0.03, 0.03, 0.10, slz, 0.325, 0.0, deska_m, 0.5, 0.0, 0.0,
    );
    b0(m, g, 0.30, 0.045, 0.15, 0.30, 0.115, 0.40, brzeg_m);
    b0(m, g, 0.34, 0.03, 0.04, 0.30, 0.155, 0.34, brzeg_dk_m);
    b0(m, g, 0.34, 0.03, 0.04, 0.30, 0.155, 0.46, brzeg_dk_m);
    let (kx, kyc) = (0.68, 0.135);
    cyl(
        m,
        g,
        0.045,
        0.045,
        0.055,
        kx,
        kyc,
        0.0,
        drewno_c_m,
        6,
        PI / 2.0,
        0.0,
        0.0,
    );
    cyl(
        m,
        g,
        0.016,
        0.016,
        0.30,
        kx,
        kyc,
        0.0,
        drewno_m,
        6,
        PI / 2.0,
        0.0,
        0.0,
    );
    for i in 0..4 {
        let a = (f64::from(i) / 4.0) * PI;
        b(
            m, g, 0.055, 0.235, 0.042, kx, kyc, 0.0, deska_m, 0.0, 0.0, a,
        );
    }
    b0(m, g, 0.05, 0.20, 0.05, kx, 0.10, 0.145, drewno_m);
    b0(m, g, 0.05, 0.20, 0.05, kx, 0.10, -0.145, drewno_m);
    let mlody_m = m.lambert(KRZEW_MLODY);
    let mlody_dk_m = m.lambert(KRZEW_MLODY_DK);
    let sredni_m = m.lambert(KRZEW_SREDNI);
    let poletka: [(f64, f64, f64, [MatId; 2]); 4] = [
        (-0.33, -0.42, 0.06, [mlody_m, mlody_dk_m]),
        (-0.33, 0.44, -0.08, [mlody_dk_m, sredni_m]),
        (0.60, -0.40, 0.12, [mlody_m, sredni_m]),
        (0.66, 0.44, -0.05, [sredni_m, mlody_m]),
    ];
    for (x, z, ry, c) in poletka {
        let p = m.detached();
        b0(m, p, 0.44, 0.032, 0.30, 0.0, 0.016, 0.0, ziemia_m);
        b0(m, p, 0.38, 0.085, 0.075, 0.0, 0.06, -0.065, c[0]);
        b0(m, p, 0.38, 0.085, 0.075, 0.0, 0.06, 0.065, c[1]);
        m.node(p).set_pos(x, 0.0, z).rot_y(ry);
        m.attach(g, p);
    }
}

/// `buildPoleIrygowane()` (`:230-271`) into `g`.
pub fn build_pole_irygowane_into(m: &mut ImprovementModel, g: NodeId) {
    let brzeg_m = m.lambert(KAMIEN);
    let brzeg_dk_m = m.lambert(KAMIEN_DK);
    let woda_m = m.lambert(WODA);
    let woda_dk_m = m.lambert(WODA_DK);
    let ziemia_m = m.lambert(ZIEMIA);
    let drewno_m = m.lambert(DREWNO_DK);
    let deska_m = m.lambert(DREWNO);

    b0(m, g, 0.12, 0.05, 1.18, -0.70, 0.028, 0.0, woda_m);
    b0(m, g, 0.05, 0.085, 1.18, -0.795, 0.0425, 0.0, brzeg_m);
    b0(m, g, 0.05, 0.085, 1.18, -0.605, 0.0425, 0.0, brzeg_dk_m);
    b0(m, g, 0.045, 0.15, 0.045, -0.60, 0.075, -0.085, drewno_m);
    b0(m, g, 0.045, 0.15, 0.045, -0.60, 0.075, 0.085, drewno_m);
    b0(m, g, 0.02, 0.09, 0.13, -0.60, 0.10, 0.0, deska_m);
    b0(m, g, 1.26, 0.035, 1.24, 0.06, 0.0175, 0.0, ziemia_m);
    let mlody_m = m.lambert(KRZEW_MLODY);
    let mlody_dk_m = m.lambert(KRZEW_MLODY_DK);
    let sredni_m = m.lambert(KRZEW_SREDNI);
    let sredni_dk_m = m.lambert(KRZEW_SREDNI_DK);
    let zloty_m = m.lambert(ZBOZE);
    let zloty_dk_m = m.lambert(ZBOZE_DK);
    let kolory: [(MatId, MatId); 6] = [
        (mlody_m, mlody_dk_m),
        (zloty_m, zloty_dk_m),
        (sredni_m, sredni_dk_m),
        (mlody_dk_m, mlody_m),
        (sredni_dk_m, sredni_m),
        (zloty_dk_m, zloty_m),
    ];
    let row_z = [-0.545, -0.325, -0.105, 0.115, 0.335, 0.555];
    let seg_x = [-0.39, -0.09, 0.21, 0.51];
    let seg_h = [0.095, 0.115, 0.10, 0.12];
    for (ri, &rz) in row_z.iter().enumerate() {
        let (ca, cb) = kolory[ri];
        for (si, &sx) in seg_x.iter().enumerate() {
            let h = seg_h[(ri + si) % 4];
            let mat = if (ri + si) % 2 == 1 { cb } else { ca };
            b0(m, g, 0.27, h, 0.135, sx, 0.035 + h / 2.0, rz, mat);
        }
    }
    for (ax, az2) in [
        (-0.09, -0.325),
        (0.51, -0.325),
        (-0.39, 0.555),
        (0.21, 0.555),
        (0.51, 0.115),
        (-0.39, -0.105),
    ] {
        b(
            m,
            g,
            0.10,
            0.05,
            0.08,
            ax + 0.03,
            0.16,
            az2,
            zloty_m,
            0.0,
            0.3,
            0.0,
        );
    }
    for kz in [-0.435, 0.005, 0.445] {
        b0(m, g, 1.22, 0.045, 0.075, 0.03, 0.038, kz, woda_dk_m);
    }
}

/// `buildFort(ownerCol = 0xffd54a)` (`:279-314`) into `g`; `owner_col` is
/// masked with `& 0xffffff` like the web.
pub fn build_fort_into(m: &mut ImprovementModel, g: NodeId, owner_col: u32) {
    let owner_m = m.lambert(owner_col & 0x00ff_ffff);
    let mur_m = m.lambert(KAMIEN);
    let mur_dk_m = m.lambert(KAMIEN_DK);
    let mur_hi_m = m.lambert(KAMIEN_HI);
    let drewno_m = m.lambert(DREWNO_DK);
    let deska_m = m.lambert(DREWNO);
    let dach_m = m.lambert(DACH_CZERW);
    let dach_dk_m = m.lambert(DACH_CZERW_DK);

    let w = 0.40;
    b0(m, g, 0.96, 0.05, 0.96, 0.0, 0.025, 0.0, mur_dk_m);
    let wall_h = 0.20;
    let wall_y = 0.05 + wall_h / 2.0;
    b0(m, g, 0.07, wall_h, 2.0 * w - 0.10, -w, wall_y, 0.0, mur_m);
    b0(m, g, 2.0 * w - 0.10, wall_h, 0.07, 0.0, wall_y, -w, mur_m);
    b0(m, g, 2.0 * w - 0.10, wall_h, 0.07, 0.0, wall_y, w, mur_m);
    b0(m, g, 0.07, wall_h, 0.255, w, wall_y, -0.2725, mur_m);
    b0(m, g, 0.07, wall_h, 0.255, w, wall_y, 0.2725, mur_m);
    b0(m, g, 0.075, 0.07, 0.22, w, 0.285, 0.0, mur_hi_m);
    b0(m, g, 0.022, 0.15, 0.145, w - 0.006, 0.125, 0.0, deska_m);
    b0(m, g, 0.028, 0.028, 0.15, w - 0.002, 0.16, 0.0, drewno_m);
    for (bx, bz) in [
        (-w, -0.16),
        (-w, 0.16),
        (-0.16, -w),
        (0.16, -w),
        (-0.16, w),
        (0.16, w),
    ] {
        let on_x = f64::abs(bx) == w;
        let (bw, bd) = if on_x { (0.085, 0.07) } else { (0.07, 0.085) };
        b0(m, g, bw, 0.055, bd, bx, 0.2775, bz, mur_hi_m);
    }
    b0(m, g, 0.085, 0.05, 0.09, w, 0.345, 0.0, mur_hi_m);
    for sx in [-1.0, 1.0] {
        for sz in [-1.0, 1.0] {
            let wm = if sx * sz > 0.0 { mur_m } else { mur_hi_m };
            b0(m, g, 0.155, 0.34, 0.155, sx * w, 0.22, sz * w, wm);
            b0(m, g, 0.21, 0.06, 0.21, sx * w, 0.42, sz * w, mur_dk_m);
            let dm = if sz > 0.0 { dach_m } else { dach_dk_m };
            cone(
                m,
                g,
                0.135,
                0.135,
                sx * w,
                0.5175,
                sz * w,
                dm,
                4,
                0.0,
                PI / 4.0,
                0.0,
            );
        }
    }
    b0(m, g, 0.26, 0.14, 0.17, -0.09, 0.12, 0.04, deska_m);
    b(
        m, g, 0.29, 0.045, 0.115, -0.09, 0.205, 0.085, dach_m, 0.62, 0.0, 0.0,
    );
    b(
        m, g, 0.29, 0.045, 0.115, -0.09, 0.205, -0.005, dach_m, -0.62, 0.0, 0.0,
    );
    cyl(
        m, g, 0.014, 0.018, 0.34, 0.10, 0.42, -0.06, drewno_m, 6, 0.0, 0.0, 0.0,
    );
    b0(m, g, 0.02, 0.085, 0.17, 0.10, 0.555, 0.035, owner_m);
    b(
        m, g, 0.022, 0.045, 0.07, 0.10, 0.535, 0.135, owner_m, 0.0, 0.0, 0.35,
    );
    b0(m, g, 0.024, 0.11, 0.075, w + 0.02, 0.20, 0.0, owner_m);
}

/// `buildPosterunek(ownerCol = 0xffd54a)` (`:322-365`) into `g`.
pub fn build_posterunek_into(m: &mut ImprovementModel, g: NodeId, owner_col: u32) {
    let owner_m = m.lambert(owner_col & 0x00ff_ffff);
    let pal_m = m.lambert(DREWNO_DK);
    let deska_m = m.lambert(DREWNO);
    let belka_m = m.lambert(DREWNO_C);
    let metal_m = m.lambert(METAL);
    let plomien_m = m.lambert(PLOMIEN);
    let plomien_dk_m = m.lambert(PLOMIEN_DK);

    let corners = [(1.0, 1.0), (1.0, -1.0), (-1.0, 1.0), (-1.0, -1.0)];
    for (sx, sz) in corners {
        b(
            m,
            g,
            0.045,
            0.36,
            0.045,
            sx * 0.145,
            0.18,
            sz * 0.145,
            pal_m,
            sz * -0.10,
            0.0,
            sx * 0.10,
        );
    }
    b0(m, g, 0.34, 0.035, 0.045, 0.0, 0.155, 0.0, belka_m);
    b0(m, g, 0.045, 0.035, 0.34, 0.0, 0.235, 0.0, belka_m);
    b0(m, g, 0.36, 0.04, 0.36, 0.0, 0.38, 0.0, deska_m);
    b0(m, g, 0.30, 0.045, 0.30, 0.0, 0.345, 0.0, belka_m);
    for (sx, sz) in corners {
        b0(m, g, 0.03, 0.12, 0.03, sx * 0.165, 0.46, sz * 0.165, pal_m);
    }
    b0(m, g, 0.36, 0.028, 0.024, 0.0, 0.505, -0.165, deska_m);
    b0(m, g, 0.36, 0.028, 0.024, 0.0, 0.505, 0.165, deska_m);
    b0(m, g, 0.024, 0.028, 0.36, -0.165, 0.505, 0.0, deska_m);
    b0(m, g, 0.024, 0.028, 0.30, 0.165, 0.505, -0.04, deska_m);
    for (sx, sz) in corners {
        b0(
            m,
            g,
            0.032,
            0.20,
            0.032,
            sx * 0.125,
            0.50,
            sz * 0.125,
            pal_m,
        );
    }
    let dach = m.lambert(DACH_CZERW);
    cone(
        m,
        g,
        0.24,
        0.15,
        0.0,
        0.675,
        0.0,
        dach,
        4,
        0.0,
        PI / 4.0,
        0.0,
    );
    b0(m, g, 0.30, 0.028, 0.30, 0.0, 0.588, 0.0, belka_m);
    let drab = m.detached();
    b0(m, drab, 0.026, 0.44, 0.026, 0.0, 0.22, -0.055, pal_m);
    b0(m, drab, 0.026, 0.44, 0.026, 0.0, 0.22, 0.055, pal_m);
    for i in 0..4 {
        b0(
            m,
            drab,
            0.022,
            0.024,
            0.13,
            0.0,
            0.09 + f64::from(i) * 0.10,
            0.0,
            deska_m,
        );
    }
    m.node(drab).set_pos(0.21, 0.0, 0.0).rot_z(-0.24);
    m.attach(g, drab);
    let ko = m.detached();
    b0(m, ko, 0.05, 0.16, 0.05, 0.0, 0.08, 0.0, pal_m);
    b0(m, ko, 0.115, 0.075, 0.115, 0.0, 0.20, 0.0, metal_m);
    b(
        m,
        ko,
        0.085,
        0.055,
        0.085,
        0.0,
        0.26,
        0.0,
        plomien_dk_m,
        0.0,
        0.5,
        0.0,
    );
    b(
        m, ko, 0.05, 0.06, 0.05, 0.0, 0.30, 0.0, plomien_m, 0.0, 0.2, 0.0,
    );
    m.node(ko).set_pos(0.42, 0.0, 0.30);
    m.attach(g, ko);
    cyl(
        m, g, 0.011, 0.014, 0.20, 0.0, 0.83, 0.0, pal_m, 6, 0.0, 0.0, 0.0,
    );
    b0(m, g, 0.018, 0.075, 0.15, 0.0, 0.885, 0.09, owner_m);
    b(
        m, g, 0.02, 0.04, 0.06, 0.0, 0.868, 0.175, owner_m, 0.0, 0.0, 0.3,
    );
}

/// `buildZlozeKlaster(typ, du = 0)` (`:379-442`) into `g`.
pub fn build_zloze_klaster_into(m: &mut ImprovementModel, g: NodeId, typ: ZlozeTyp, du: f64) {
    match typ {
        ZlozeTyp::Miedz => {
            let skala_m = m.lambert(KAMIEN_DK);
            let m1 = m.lambert(MIEDZ_TURKUS);
            let m2 = m.lambert(MIEDZ);
            b(
                m,
                g,
                0.16,
                0.095,
                0.14,
                0.0,
                0.048,
                0.0,
                skala_m,
                0.0,
                0.35 + du,
                0.05,
            );
            b(
                m,
                g,
                0.065,
                0.21,
                0.065,
                0.015,
                0.135,
                -0.015,
                m1,
                -0.12,
                0.5 + du,
                0.14,
            );
            b(
                m, g, 0.05, 0.13, 0.05, -0.055, 0.10, 0.045, m2, 0.1, du, -0.32,
            );
            b(
                m,
                g,
                0.048,
                0.045,
                0.048,
                0.095,
                0.022,
                0.06,
                m2,
                0.0,
                0.4 + du,
                0.0,
            );
            if du == 0.0 {
                cone(
                    m, g, 0.042, 0.06, 0.015, 0.267, -0.015, m1, 4, -0.12, 0.5, 0.14,
                );
            }
        }
        ZlozeTyp::Zelazo => {
            let b1 = m.lambert(RDZA);
            let b2 = m.lambert(RDZA_HI);
            let hi_m = m.lambert(METAL_POLYSK);
            let dk_m = m.lambert(RDZA_DK);
            b(
                m,
                g,
                0.155,
                0.115,
                0.135,
                0.0,
                0.058,
                0.0,
                b1,
                0.0,
                0.3 + du,
                0.07,
            );
            b(
                m,
                g,
                0.10,
                0.085,
                0.10,
                0.075,
                0.042,
                -0.06,
                b2,
                0.0,
                -0.25 + du,
                -0.05,
            );
            b(
                m,
                g,
                0.052,
                0.045,
                0.052,
                -0.01,
                0.135,
                0.01,
                hi_m,
                0.2,
                0.55 + du,
                0.2,
            );
            b(
                m, g, 0.05, 0.045, 0.05, -0.085, 0.022, 0.055, dk_m, 0.0, du, 0.3,
            );
        }
        ZlozeTyp::Wegiel => {
            let cz_m = m.lambert(WEGIEL);
            let hi_m = m.lambert(WEGIEL_HI);
            let baza_m = m.lambert(WEGIEL_BAZA);
            b(
                m,
                g,
                0.15,
                0.05,
                0.13,
                0.0,
                0.025,
                0.0,
                baza_m,
                0.0,
                0.25 + du,
                0.0,
            );
            b(
                m,
                g,
                0.105,
                0.10,
                0.105,
                -0.01,
                0.095,
                0.01,
                cz_m,
                0.0,
                0.62 + du,
                0.08,
            );
            b(
                m,
                g,
                0.075,
                0.075,
                0.075,
                0.06,
                0.155,
                -0.03,
                cz_m,
                0.3,
                0.3 + du,
                0.25,
            );
            b(
                m, g, 0.045, 0.045, 0.045, -0.065, 0.13, -0.045, hi_m, 0.25, du, 0.45,
            );
        }
        ZlozeTyp::Sol => {
            let sol_m = m.lambert(SOL);
            let sol_dk_m = m.lambert(SOL_DK);
            b(
                m,
                g,
                0.13,
                0.022,
                0.11,
                0.0,
                0.011,
                0.0,
                sol_dk_m,
                0.0,
                0.3 + du,
                0.0,
            );
            b(
                m,
                g,
                0.06,
                0.17,
                0.06,
                -0.01,
                0.095,
                0.01,
                sol_m,
                0.06,
                0.45 + du,
                -0.10,
            );
            b(
                m, g, 0.048, 0.095, 0.048, 0.055, 0.048, -0.04, sol_dk_m, -0.1, du, 0.22,
            );
            cone(
                m,
                g,
                0.043,
                0.075,
                -0.014,
                0.213,
                0.017,
                sol_m,
                4,
                0.06,
                0.45 + du,
                -0.10,
            );
        }
        ZlozeTyp::Zloto => {
            let skala_m = m.lambert(ZLOTO_SKALA);
            let zl_m = m.lambert(ZLOTO);
            let zl_hi_m = m.lambert(ZLOTO_HI);
            let zl_dk_m = m.lambert(ZLOTO_DK);
            b(
                m,
                g,
                0.20,
                0.115,
                0.165,
                0.0,
                0.055,
                0.0,
                skala_m,
                0.05,
                0.3 + du,
                0.09,
            );
            b(
                m,
                g,
                0.185,
                0.055,
                0.065,
                -0.01,
                0.135,
                0.02,
                zl_m,
                0.12,
                0.3 + du,
                0.30,
            );
            b(
                m,
                g,
                0.105,
                0.09,
                0.095,
                0.055,
                0.19,
                -0.035,
                zl_m,
                0.32,
                0.6 + du,
                -0.26,
            );
            b(
                m, g, 0.065, 0.06, 0.065, -0.055, 0.235, 0.04, zl_hi_m, 0.38, du, 0.5,
            );
            b(
                m,
                g,
                0.065,
                0.05,
                0.06,
                0.105,
                0.026,
                0.085,
                zl_dk_m,
                0.0,
                0.4 + du,
                0.14,
            );
        }
        ZlozeTyp::Cyna => {
            let skala_m = m.lambert(CYNA_SKALA);
            let ks_m = m.lambert(KASYTERYT);
            let ks_hi_m = m.lambert(KASYT_HI);
            let cyn_m = m.lambert(CYNA_OKRUCH);
            b(
                m,
                g,
                0.215,
                0.105,
                0.185,
                0.0,
                0.052,
                0.0,
                skala_m,
                0.0,
                0.25 + du,
                0.06,
            );
            b(
                m,
                g,
                0.125,
                0.150,
                0.115,
                -0.005,
                0.175,
                0.005,
                ks_m,
                0.10,
                0.5 + du,
                0.14,
            );
            b(
                m, g, 0.090, 0.100, 0.085, 0.080, 0.130, -0.055, ks_m, -0.15, du, -0.30,
            );
            b(
                m,
                g,
                0.058,
                0.052,
                0.055,
                -0.080,
                0.112,
                0.058,
                ks_hi_m,
                0.0,
                0.4 + du,
                0.20,
            );
            b(
                m,
                g,
                0.044,
                0.038,
                0.042,
                0.030,
                0.262,
                0.018,
                cyn_m,
                0.2,
                0.6 + du,
                0.25,
            );
        }
        ZlozeTyp::Glina | ZlozeTyp::Inne => {
            let ga = m.lambert(GLINA_A);
            let gb = m.lambert(GLINA_B);
            let gc = m.lambert(GLINA_C);
            let mokra_m = m.lambert(GLINA_MOKRA);
            b(
                m,
                g,
                0.175,
                0.05,
                0.15,
                0.0,
                0.025,
                0.0,
                ga,
                0.0,
                0.2 + du,
                0.0,
            );
            b(
                m,
                g,
                0.14,
                0.05,
                0.115,
                0.015,
                0.073,
                -0.012,
                gb,
                0.0,
                0.45 + du,
                0.0,
            );
            b(
                m,
                g,
                0.10,
                0.045,
                0.08,
                -0.012,
                0.118,
                0.012,
                gc,
                0.0,
                0.05 + du,
                0.0,
            );
            b(
                m,
                g,
                0.055,
                0.016,
                0.045,
                0.01,
                0.146,
                0.005,
                mokra_m,
                0.0,
                0.3 + du,
                0.0,
            );
        }
    }
}

/// `zlozeZeSkupisk(typ, sloty, extra)` (`:446-459`) into `g`.
fn zloze_ze_skupisk(
    m: &mut ImprovementModel,
    g: NodeId,
    typ: ZlozeTyp,
    sloty: &[layout::SlotZloza],
    extra: impl FnOnce(&mut ImprovementModel, NodeId),
) {
    for (i, &(az, r, s, rot_y)) in sloty.iter().enumerate() {
        let k = m.detached();
        build_zloze_klaster_into(m, k, typ, if i % 2 == 1 { 0.9 } else { 0.0 });
        let (x, z) = az_xz(az, r);
        m.node(k)
            .set_pos(x, 0.0, z)
            .rot_y(rot_y)
            .set_scale_scalar(s);
        m.attach(g, k);
    }
    extra(m, g);
}

/// Two loose pieces of an ore deposit (`extra` of the `buildZloze*`
/// functions): `B(g, w, h, d, c.x, y, c.z, mat(color), 0, ry, 0)`.
fn loose(m: &mut ImprovementModel, g: NodeId, piece: (f64, f64, f64, f64, f64, f64, u32, f64)) {
    let (az, r, w, h, d, y, color, ry) = piece;
    let (cx, cz) = az_xz(az, r);
    let mat = m.lambert(color);
    b(m, g, w, h, d, cx, y, cz, mat, 0.0, ry, 0.0);
}

/// The full deposit overlay `buildZloze<Typ>()` (`:464-525`) into `g`.
/// [`ZlozeTyp::Inne`] has no full overlay in the web; it is treated like
/// `Glina` here (not reachable from the web code).
pub fn build_zloze_into(m: &mut ImprovementModel, g: NodeId, typ: ZlozeTyp) {
    match typ {
        ZlozeTyp::Miedz => zloze_ze_skupisk(m, g, typ, &layout::MIEDZ, |_, _| {}),
        ZlozeTyp::Zelazo => zloze_ze_skupisk(m, g, typ, &layout::ZELAZO, |m, g| {
            loose(m, g, (155.0, 0.56, 0.05, 0.045, 0.05, 0.022, RDZA_HI, 0.4));
            loose(m, g, (330.0, 0.52, 0.045, 0.04, 0.045, 0.02, RDZA_DK, -0.3));
        }),
        ZlozeTyp::Wegiel => zloze_ze_skupisk(m, g, typ, &layout::WEGIEL, |m, g| {
            loose(m, g, (80.0, 0.54, 0.055, 0.05, 0.055, 0.025, WEGIEL, 0.5));
            loose(
                m,
                g,
                (228.0, 0.55, 0.045, 0.042, 0.045, 0.021, WEGIEL_HI, -0.2),
            );
        }),
        ZlozeTyp::Sol => zloze_ze_skupisk(m, g, typ, &layout::SOL, |m, g| {
            let (cx, cz) = az_xz(140.0, 0.60);
            let a = m.lambert(KAMIEN_DK);
            b(m, g, 0.17, 0.035, 0.14, cx, 0.018, cz, a, 0.0, 0.25, 0.0);
            let s = m.lambert(SOLANKA);
            b(m, g, 0.13, 0.014, 0.10, cx, 0.042, cz, s, 0.0, 0.25, 0.0);
        }),
        ZlozeTyp::Zloto => zloze_ze_skupisk(m, g, typ, &layout::ZLOTO, |m, g| {
            loose(m, g, (70.0, 0.55, 0.065, 0.055, 0.06, 0.028, ZLOTO, 0.5));
            loose(
                m,
                g,
                (250.0, 0.58, 0.05, 0.045, 0.05, 0.023, ZLOTO_HI, -0.3),
            );
        }),
        ZlozeTyp::Cyna => zloze_ze_skupisk(m, g, typ, &layout::CYNA, |m, g| {
            loose(
                m,
                g,
                (95.0, 0.56, 0.062, 0.052, 0.058, 0.026, KASYTERYT, 0.5),
            );
            loose(
                m,
                g,
                (265.0, 0.55, 0.046, 0.040, 0.044, 0.020, KASYT_HI, -0.3),
            );
        }),
        ZlozeTyp::Glina | ZlozeTyp::Inne => {
            zloze_ze_skupisk(m, g, ZlozeTyp::Glina, &layout::GLINA, |m, g| {
                loose(m, g, (20.0, 0.54, 0.06, 0.04, 0.055, 0.02, GLINA_B, 0.7));
                loose(m, g, (200.0, 0.56, 0.05, 0.035, 0.05, 0.017, GLINA_C, -0.4));
            });
        }
    }
}

/// `buildIrygacja()`.
#[must_use]
pub fn build_irygacja() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_irygacja_into(&mut m, ROOT);
    m
}

/// `buildPoleIrygowane()`.
#[must_use]
pub fn build_pole_irygowane() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_pole_irygowane_into(&mut m, ROOT);
    m
}

/// `buildFort(ownerCol)`.
#[must_use]
pub fn build_fort(owner_col: u32) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_fort_into(&mut m, ROOT, owner_col);
    m
}

/// `buildPosterunek(ownerCol)`.
#[must_use]
pub fn build_posterunek(owner_col: u32) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_posterunek_into(&mut m, ROOT, owner_col);
    m
}

/// `buildZlozeKlaster(typ, du)`.
#[must_use]
pub fn build_zloze_klaster(typ: ZlozeTyp, du: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_zloze_klaster_into(&mut m, ROOT, typ, du);
    m
}

/// `buildZlozeMiedz()` … `buildZlozeGlina()`.
#[must_use]
pub fn build_zloze(typ: ZlozeTyp) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_zloze_into(&mut m, ROOT, typ);
    m
}
