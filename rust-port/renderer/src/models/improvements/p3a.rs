//! `render/ulepszenia-modele-p3a.ts` (`edb8fb56`): woodcutting, hunting
//! camp, clay pit, salt works, fishing boats and the stud farm (with two
//! MOD-04 horses from `kon-nowy-model.ts`).

use std::f64::consts::PI;

use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::horse::build_horse;
use crate::models::unit_core::model::{MatId, NodeId, ROOT};

use super::kit::{az_xz, b, b0, cone, cyl, tang_rot_y};
use super::model::ImprovementExt;
use super::model::ImprovementModel;

/// Palette `P` (`:117-130`).
mod pal {
    pub const DREWNO: u32 = 0xc98a4b;
    pub const DREWNO_DK: u32 = 0x8a5a2e;
    pub const DREWNO_C: u32 = 0x6b4423;
    pub const BAL: u32 = 0xcd853f;
    pub const DREWNO_SWIEZE: u32 = 0xe8b46b;
    pub const SCIANA: u32 = 0xd9a05b;
    pub const BIALY: u32 = 0xf7f4ea;
    pub const CIEN: u32 = 0x4a2f16;
    pub const CIEMNE_DRZWI: u32 = 0x7a4a22;
    pub const KAMIEN: u32 = 0x9aa5b1;
    pub const KAMIEN_DK: u32 = 0x717d89;
    pub const CZERN: u32 = 0x14100b;
    pub const STAL: u32 = 0xd7dde2;
    pub const SIANO: u32 = 0xf0c34e;
    pub const ZIEMIA: u32 = 0x8a6a45;
    pub const WODA: u32 = 0x4ab6e8;
    pub const PLOMIEN: u32 = 0xffc02e;
    pub const OGIEN: u32 = 0xff6b2e;
    pub const DYM: u32 = 0xd8d8d4;
    pub const DYM_DK: u32 = 0xbdbdb8;
    pub const SKORA: u32 = 0xc98a4b;
    pub const SKORA_HI: u32 = 0xdba76b;
    pub const RYBA: u32 = 0x7fc4d8;
    pub const MIESO: u32 = 0xc4553a;
    pub const GLINA: u32 = 0xe07830;
    pub const GLINA_DK: u32 = 0xc9652a;
    pub const GLINA_HI: u32 = 0xf0924a;
    pub const CEGLA: u32 = 0xd96a3b;
    pub const SOL: u32 = 0xffffff;
    pub const SOL_SREDNIA: u32 = 0xf0ede2;
    pub const SOL_MOKRA: u32 = 0xdcd8c8;
    pub const SOLANKA: u32 = 0xbfe4f0;
    pub const WOREK: u32 = 0xe8d9b8;
    pub const ZAGIEL: u32 = 0xf7f4ea;
    pub const SIEC: u32 = 0x9a8a68;
    pub const DACH_DESKA: u32 = 0xa46a38;
    pub const KON_KASZTAN: u32 = 0x9a5230;
    pub const KON_KASZTAN_GRZYWA: u32 = 0xe8d9b8;
    pub const KON_SIWY: u32 = 0xd8d2c4;
    pub const KON_SIWY_GRZYWA: u32 = 0x8f8a7e;
}
use pal::*;

/// `ULEPSZENIA_P3A_LAYOUT` (`:490-510`), the `rotY` values the registry reads.
pub mod layout {
    /// `wyrab.budynek.rotY`.
    pub const WYRAB_ROT_Y: f64 = -0.35;
    /// `obozLowiecki.budynek.rotY`.
    pub const OBOZ_LOWIECKI_ROT_Y: f64 = -0.15;
    /// `glinianka.budynek.rotY`.
    pub const GLINIANKA_ROT_Y: f64 = 0.20;
    /// `warzelniaSoli.budynek.rotY`.
    pub const WARZELNIA_SOLI_ROT_Y: f64 = 0.0;
    /// `lodzieRybackie.budynek.rotY`.
    pub const LODZIE_RYBACKIE_ROT_Y: f64 = 0.15;
}

/// `buildWyrab()` (`:133-183`) into `g`.
pub fn build_wyrab_into(m: &mut ImprovementModel, g: NodeId) {
    let bal_m = m.lambert(BAL);
    let przekroj_m = m.lambert(DREWNO_SWIEZE);
    let kora_m = m.lambert(DREWNO_DK);
    let ciemny_m = m.lambert(DREWNO_C);
    let stal_m = m.lambert(STAL);
    let galaz_m = m.lambert(0x9a6a3a);

    for (px, pz, r, h) in [
        (-0.36, -0.20, 0.075, 0.10),
        (-0.10, -0.50, 0.062, 0.085),
        (-0.58, 0.16, 0.058, 0.075),
    ] {
        cyl(
            m,
            g,
            r,
            r * 1.12,
            h,
            px,
            h / 2.0,
            pz,
            kora_m,
            6,
            0.0,
            0.0,
            0.0,
        );
        cone(
            m,
            g,
            r * 0.95,
            0.014,
            px,
            h + 0.007,
            pz,
            przekroj_m,
            6,
            0.0,
            0.0,
            0.0,
        );
    }
    let pien = m.detached();
    cyl(
        m,
        pien,
        0.068,
        0.082,
        0.72,
        0.0,
        0.0,
        0.0,
        kora_m,
        6,
        0.0,
        0.0,
        PI / 2.0,
    );
    let odz = m.mesh(
        pien,
        crate::models::unit_core::model::Prim::cone(0.085, 0.016, 6),
        przekroj_m,
    );
    m.node(odz).set_pos(-0.368, 0.0, 0.0).rot_z(PI / 2.0);
    m.shadows(odz, true, false);
    b(
        m, pien, 0.16, 0.045, 0.045, 0.18, 0.07, 0.02, kora_m, 0.0, 0.0, 0.5,
    );
    m.node(pien).set_pos(-0.16, 0.078, -0.35).rot_y(0.62);
    m.attach(g, pien);
    let koziol = m.detached();
    for kx in [-0.14, 0.14] {
        b(
            m, koziol, 0.035, 0.26, 0.035, kx, 0.125, 0.055, ciemny_m, 0.5, 0.0, 0.0,
        );
        b(
            m, koziol, 0.035, 0.26, 0.035, kx, 0.125, -0.055, ciemny_m, -0.5, 0.0, 0.0,
        );
    }
    cyl(
        m,
        koziol,
        0.058,
        0.058,
        0.52,
        0.0,
        0.235,
        0.0,
        bal_m,
        6,
        0.0,
        0.0,
        PI / 2.0,
    );
    b(
        m, koziol, 0.014, 0.17, 0.05, 0.07, 0.29, 0.0, stal_m, 0.0, 0.0, 0.08,
    );
    b0(m, koziol, 0.11, 0.028, 0.028, 0.07, 0.385, 0.0, ciemny_m);
    m.node(koziol).set_pos(0.30, 0.0, 0.22).rot_y(0.55);
    m.attach(g, koziol);
    let sterta = m.detached();
    b(
        m, sterta, 0.42, 0.030, 0.030, 0.0, 0.018, 0.02, galaz_m, 0.0, 0.28, 0.0,
    );
    b(
        m, sterta, 0.38, 0.028, 0.028, 0.02, 0.042, -0.02, galaz_m, 0.0, -0.35, 0.0,
    );
    b(
        m, sterta, 0.40, 0.028, 0.028, -0.02, 0.068, 0.01, galaz_m, 0.0, 0.62, 0.0,
    );
    b(
        m, sterta, 0.32, 0.025, 0.025, 0.02, 0.092, 0.01, galaz_m, 0.0, 0.1, 0.0,
    );
    m.node(sterta).set_pos(-0.30, 0.0, 0.50).rot_y(-0.3);
    m.attach(g, sterta);
    cyl(
        m, g, 0.072, 0.080, 0.13, 0.54, 0.065, -0.22, kora_m, 6, 0.0, 0.0, 0.0,
    );
    b(
        m, g, 0.02, 0.18, 0.02, 0.58, 0.21, -0.18, ciemny_m, 0.25, 0.0, -0.5,
    );
    b(
        m, g, 0.055, 0.055, 0.016, 0.525, 0.155, -0.215, stal_m, 0.25, 0.0, 0.0,
    );
    b(
        m, g, 0.055, 0.045, 0.14, 0.40, 0.0225, -0.02, bal_m, 0.0, 0.4, 0.0,
    );
    b(
        m, g, 0.05, 0.04, 0.13, 0.48, 0.02, 0.06, bal_m, 0.0, -0.25, 0.0,
    );
}

/// `buildObozLowiecki()` (`:186-245`) into `g`.
pub fn build_oboz_lowiecki_into(m: &mut ImprovementModel, g: NodeId) {
    let skora_m = m.lambert(SKORA);
    let skora_hi_m = m.lambert(SKORA_HI);
    let drewno_m = m.lambert(DREWNO_DK);
    let ciemny_m = m.lambert(DREWNO_C);
    let czern_m = m.lambert(CZERN);
    let kamien_m = m.lambert(KAMIEN_DK);
    let ogien_m = m.lambert(OGIEN);
    let plomien_m = m.lambert(PLOMIEN);
    let dym_m = m.lambert(DYM);
    let dym_dk_m = m.lambert(DYM_DK);
    let ryba_m = m.lambert(RYBA);
    let mieso_m = m.lambert(MIESO);
    let bialy_m = m.lambert(BIALY);
    let cel_m = m.lambert(0xd93a2b);

    let tipi = m.detached();
    cone(
        m, tipi, 0.30, 0.46, 0.0, 0.23, 0.0, skora_m, 5, 0.0, 0.3, 0.0,
    );
    b(
        m, tipi, 0.10, 0.13, 0.09, 0.175, 0.075, 0.04, czern_m, 0.0, 0.32, 0.0,
    );
    b(
        m, tipi, 0.015, 0.20, 0.015, 0.045, 0.50, 0.02, drewno_m, 0.35, 0.0, 0.30,
    );
    b(
        m, tipi, 0.015, 0.20, 0.015, -0.02, 0.50, -0.045, drewno_m, -0.40, 0.0, -0.22,
    );
    b(
        m, tipi, 0.015, 0.19, 0.015, -0.03, 0.495, 0.045, drewno_m, 0.30, 0.0, -0.35,
    );
    b(
        m, tipi, 0.09, 0.11, 0.012, -0.10, 0.20, 0.155, skora_hi_m, 0.42, -0.55, 0.0,
    );
    m.node(tipi).set_pos(-0.30, 0.0, -0.28);
    m.attach(g, tipi);
    let wedz = m.detached();
    b0(m, wedz, 0.032, 0.32, 0.032, 0.0, 0.16, 0.15, drewno_m);
    b0(m, wedz, 0.032, 0.32, 0.032, 0.0, 0.16, -0.15, drewno_m);
    b0(m, wedz, 0.026, 0.026, 0.34, 0.0, 0.30, 0.0, ciemny_m);
    b0(m, wedz, 0.026, 0.026, 0.34, 0.0, 0.185, 0.0, ciemny_m);
    b(
        m, wedz, 0.022, 0.105, 0.05, 0.0, 0.245, 0.085, ryba_m, 0.0, 0.0, 0.14,
    );
    b(
        m, wedz, 0.022, 0.10, 0.048, 0.0, 0.248, -0.005, ryba_m, 0.0, 0.0, -0.10,
    );
    b(
        m, wedz, 0.055, 0.10, 0.038, 0.0, 0.132, -0.09, mieso_m, 0.0, 0.0, 0.06,
    );
    b(
        m, wedz, 0.07, 0.035, 0.10, 0.0, 0.0175, 0.01, ogien_m, 0.0, 0.4, 0.0,
    );
    b(
        m, wedz, 0.05, 0.03, 0.05, 0.045, 0.015, -0.075, kamien_m, 0.0, 0.5, 0.0,
    );
    m.node(wedz).set_pos(0.50, 0.0, -0.30).rot_y(0.55);
    m.attach(g, wedz);
    let cel = m.detached();
    b0(m, cel, 0.035, 0.16, 0.035, 0.0, 0.08, 0.0, drewno_m);
    cyl(
        m,
        cel,
        0.11,
        0.11,
        0.035,
        0.0,
        0.24,
        0.0,
        bialy_m,
        6,
        PI / 2.0,
        0.0,
        0.0,
    );
    b(
        m,
        cel,
        0.075,
        0.075,
        0.042,
        0.0,
        0.24,
        0.0,
        cel_m,
        0.0,
        0.0,
        PI / 4.0,
    );
    for (ax, ay, rx, rz) in [
        (-0.035, 0.275, 0.35, 0.3),
        (0.04, 0.215, -0.2, -0.35),
        (0.005, 0.25, 0.1, -0.6),
    ] {
        let strzala = m.lambert(DREWNO);
        b(
            m, cel, 0.016, 0.016, 0.17, ax, ay, 0.09, strzala, rx, 0.0, rz,
        );
    }
    m.node(cel).set_pos(-0.52, 0.0, 0.34).rot_y(2.65);
    m.attach(g, cel);
    let ogn = m.detached();
    for i in 0..5 {
        let a = (f64::from(i) / 5.0) * PI * 2.0 + 0.3;
        b(
            m,
            ogn,
            0.05,
            0.04,
            0.05,
            js_cos(a) * 0.10,
            0.02,
            js_sin(a) * 0.10,
            kamien_m,
            0.0,
            a,
            0.0,
        );
    }
    b(
        m, ogn, 0.16, 0.032, 0.032, 0.0, 0.03, 0.01, ciemny_m, 0.0, 0.5, 0.0,
    );
    b(
        m, ogn, 0.15, 0.030, 0.030, 0.0, 0.032, -0.01, ciemny_m, 0.0, -0.6, 0.0,
    );
    cone(
        m, ogn, 0.055, 0.11, 0.0, 0.095, 0.0, ogien_m, 4, 0.0, 0.2, 0.0,
    );
    cone(
        m, ogn, 0.03, 0.07, 0.0, 0.10, 0.0, plomien_m, 4, 0.0, 0.6, 0.0,
    );
    b(
        m, ogn, 0.055, 0.05, 0.055, 0.02, 0.185, 0.015, dym_dk_m, 0.2, 0.5, 0.15,
    );
    b(
        m, ogn, 0.075, 0.068, 0.075, 0.035, 0.275, 0.035, dym_m, -0.15, 0.2, 0.3,
    );
    b(
        m, ogn, 0.096, 0.086, 0.096, 0.05, 0.385, 0.05, dym_m, 0.25, 0.7, -0.2,
    );
    m.node(ogn).set_pos(0.20, 0.0, 0.40);
    m.attach(g, ogn);
}

/// `buildGlinianka()` (`:248-296`) into `g`.
pub fn build_glinianka_into(m: &mut ImprovementModel, g: NodeId) {
    let glina_m = m.lambert(GLINA);
    let glina_dk_m = m.lambert(GLINA_DK);
    let glina_hi_m = m.lambert(GLINA_HI);
    let ziemia_m = m.lambert(ZIEMIA);
    let woda_m = m.lambert(WODA);
    let drewno_m = m.lambert(DREWNO_DK);
    let cegla_m = m.lambert(CEGLA);
    let czern_m = m.lambert(CZERN);
    let kamien_m = m.lambert(KAMIEN);

    cyl(
        m, g, 0.54, 0.58, 0.045, -0.06, 0.0225, -0.04, ziemia_m, 6, 0.0, 0.0, 0.0,
    );
    cyl(
        m, g, 0.45, 0.45, 0.028, -0.06, 0.059, -0.02, glina_dk_m, 6, 0.0, 0.0, 0.0,
    );
    b(
        m, g, 0.64, 0.09, 0.19, -0.06, 0.105, -0.35, glina_dk_m, 0.0, 0.08, 0.0,
    );
    b(
        m, g, 0.52, 0.068, 0.15, -0.09, 0.086, -0.165, glina_m, 0.0, -0.05, 0.0,
    );
    b(
        m, g, 0.40, 0.044, 0.12, -0.04, 0.069, 0.0, glina_hi_m, 0.0, 0.10, 0.0,
    );
    cyl(
        m, g, 0.13, 0.13, 0.016, -0.02, 0.075, 0.185, woda_m, 6, 0.0, 0.0, 0.0,
    );
    b(
        m, g, 0.085, 0.05, 0.07, -0.33, 0.095, 0.10, glina_m, 0.0, 0.4, 0.0,
    );
    let taczka = m.detached();
    let tm = m.lambert(DREWNO);
    b0(m, taczka, 0.15, 0.075, 0.115, 0.0, 0.085, 0.0, tm);
    b(
        m, taczka, 0.11, 0.05, 0.085, 0.0, 0.135, 0.0, glina_m, 0.0, 0.3, 0.0,
    );
    let km = m.lambert(DREWNO_C);
    cyl(
        m,
        taczka,
        0.05,
        0.05,
        0.035,
        0.105,
        0.05,
        0.0,
        km,
        6,
        PI / 2.0,
        0.0,
        0.0,
    );
    b(
        m, taczka, 0.20, 0.022, 0.022, -0.115, 0.075, 0.045, drewno_m, 0.0, 0.0, -0.12,
    );
    b(
        m, taczka, 0.20, 0.022, 0.022, -0.115, 0.075, -0.045, drewno_m, 0.0, 0.0, -0.12,
    );
    b0(m, taczka, 0.022, 0.055, 0.022, -0.09, 0.028, 0.0, drewno_m);
    m.node(taczka).set_pos(0.42, 0.0, 0.34).rot_y(-2.35);
    m.attach(g, taczka);
    for (px, pz, ry) in [(0.47, -0.02, 0.30), (0.40, -0.23, 0.18)] {
        let paleta = m.detached();
        b0(m, paleta, 0.20, 0.022, 0.15, 0.0, 0.011, 0.0, drewno_m);
        for i in 0..4 {
            let mat = if i % 2 == 1 { cegla_m } else { glina_hi_m };
            b0(
                m,
                paleta,
                0.052,
                0.038,
                0.11,
                -0.069 + f64::from(i) * 0.046,
                0.041,
                0.0,
                mat,
            );
        }
        m.node(paleta).set_pos(px, 0.0, pz).rot_y(ry);
        m.attach(g, paleta);
    }
    let piec = m.detached();
    b0(m, piec, 0.17, 0.13, 0.15, 0.0, 0.065, 0.0, kamien_m);
    b(
        m, piec, 0.13, 0.075, 0.11, 0.0, 0.16, 0.0, cegla_m, 0.0, 0.25, 0.0,
    );
    b0(m, piec, 0.02, 0.075, 0.062, 0.082, 0.05, 0.0, czern_m);
    let zar = m.lambert(PLOMIEN);
    b0(m, piec, 0.014, 0.05, 0.04, 0.088, 0.048, 0.0, zar);
    b0(m, piec, 0.035, 0.10, 0.035, -0.03, 0.22, -0.02, kamien_m);
    let dym = m.lambert(DYM);
    b(
        m, piec, 0.055, 0.05, 0.055, -0.02, 0.30, -0.01, dym, 0.3, 0.5, 0.2,
    );
    m.node(piec).set_pos(-0.50, 0.0, 0.30).rot_y(-1.25);
    m.attach(g, piec);
}

/// `buildWarzelniaSoli()` (`:299-348`) into `g`.
pub fn build_warzelnia_soli_into(m: &mut ImprovementModel, g: NodeId) {
    let rama_m = m.lambert(DREWNO_C);
    let solanka_m = m.lambert(SOLANKA);
    let sol_mokra_m = m.lambert(SOL_MOKRA);
    let sol_sr_m = m.lambert(SOL_SREDNIA);
    let sol_m = m.lambert(SOL);
    let drewno_m = m.lambert(DREWNO_DK);
    let sciana_m = m.lambert(SCIANA);
    let dach_m = m.lambert(DACH_DESKA);
    let work_m = m.lambert(WOREK);
    let dym_m = m.lambert(DYM);
    let czern_m = m.lambert(CZERN);

    let panwie: [(f64, f64, MatId, f64); 3] = [
        (96.0, 0.52, solanka_m, 0.052),
        (148.0, 0.55, sol_mokra_m, 0.058),
        (197.0, 0.52, sol_m, 0.064),
    ];
    for (az, r, tresc, poziom) in panwie {
        let p = m.detached();
        b0(m, p, 0.30, 0.075, 0.24, 0.0, 0.0375, 0.0, rama_m);
        b0(m, p, 0.26, 0.03, 0.20, 0.0, poziom + 0.015, 0.0, tresc);
        let (x, z) = az_xz(az, r);
        m.node(p).set_pos(x, 0.0, z).rot_y(tang_rot_y(az));
        m.attach(g, p);
    }
    let chata = m.detached();
    let km = m.lambert(KAMIEN);
    b0(m, chata, 0.40, 0.05, 0.30, 0.0, 0.025, 0.0, km);
    b0(m, chata, 0.36, 0.20, 0.26, 0.0, 0.15, 0.0, sciana_m);
    b(
        m, chata, 0.42, 0.04, 0.19, 0.0, 0.305, 0.075, dach_m, 0.62, 0.0, 0.0,
    );
    b(
        m, chata, 0.42, 0.04, 0.19, 0.0, 0.305, -0.075, dach_m, -0.62, 0.0, 0.0,
    );
    let kal = m.lambert(DREWNO_C);
    b0(m, chata, 0.44, 0.045, 0.08, 0.0, 0.365, 0.0, kal);
    let drz = m.lambert(CIEMNE_DRZWI);
    b0(m, chata, 0.02, 0.13, 0.11, 0.185, 0.115, 0.0, drz);
    let kom = m.lambert(KAMIEN_DK);
    b0(m, chata, 0.06, 0.16, 0.06, -0.10, 0.40, -0.05, kom);
    b(
        m, chata, 0.075, 0.065, 0.075, -0.098, 0.515, -0.048, dym_m, 0.2, 0.4, 0.1,
    );
    b(
        m, chata, 0.092, 0.078, 0.092, -0.085, 0.60, -0.03, dym_m, -0.1, 0.9, 0.25,
    );
    b(
        m, chata, 0.022, 0.09, 0.09, 0.185, 0.13, 0.09, czern_m, 0.0, 0.0, 0.0,
    );
    m.node(chata).set_pos(-0.02, 0.0, -0.34).rot_y(-1.05);
    m.attach(g, chata);
    cone(
        m, g, 0.115, 0.19, 0.38, 0.095, -0.26, sol_m, 5, 0.0, 0.2, 0.0,
    );
    cone(
        m, g, 0.085, 0.13, 0.55, 0.065, -0.08, sol_sr_m, 5, 0.0, 0.5, 0.0,
    );
    for (wx, wz, ry) in [(-0.42, 0.16, 0.3), (-0.34, 0.26, -0.2), (-0.45, 0.33, 0.7)] {
        b(m, g, 0.09, 0.10, 0.09, wx, 0.05, wz, work_m, 0.0, ry, 0.0);
        let wm = m.lambert(0xd4c49a);
        b(
            m,
            g,
            0.05,
            0.03,
            0.05,
            wx,
            0.115,
            wz,
            wm,
            0.0,
            ry + 0.3,
            0.0,
        );
    }
    let st = m.lambert(KAMIEN_DK);
    cyl(
        m, g, 0.075, 0.085, 0.10, 0.42, 0.05, -0.52, st, 6, 0.0, 0.0, 0.0,
    );
    b(
        m, g, 0.34, 0.028, 0.05, 0.30, 0.115, -0.36, drewno_m, 0.12, 0.75, 0.0,
    );
    b0(m, g, 0.022, 0.10, 0.022, 0.175, 0.05, -0.24, drewno_m);
}

/// `buildLodzieRybackie()` (`:351-408`) into `g`.
pub fn build_lodzie_rybackie_into(m: &mut ImprovementModel, g: NodeId) {
    let kadlub_m = m.lambert(DREWNO_DK);
    let kadlub_b_m = m.lambert(DREWNO_C);
    let wnetrze_m = m.lambert(CIEN);
    let maszt_m = m.lambert(DREWNO_C);
    let zagiel_m = m.lambert(ZAGIEL);
    let drewno_m = m.lambert(DREWNO);
    let pal_m = m.lambert(DREWNO_C);
    let siec_m = m.lambert(SIEC);
    let ryba_m = m.lambert(RYBA);
    let boja_m = m.lambert(0xd93a2b);

    let a = m.detached();
    b0(m, a, 0.34, 0.075, 0.15, 0.0, 0.052, 0.0, kadlub_m);
    b(
        m, a, 0.11, 0.07, 0.11, 0.185, 0.068, 0.0, kadlub_m, 0.0, 0.0, 0.38,
    );
    b(
        m, a, 0.07, 0.065, 0.12, -0.185, 0.058, 0.0, kadlub_m, 0.0, 0.0, -0.35,
    );
    b0(m, a, 0.26, 0.02, 0.10, 0.0, 0.095, 0.0, wnetrze_m);
    b0(m, a, 0.025, 0.34, 0.025, 0.04, 0.26, 0.0, maszt_m);
    b(
        m, a, 0.30, 0.05, 0.045, 0.02, 0.36, 0.0, zagiel_m, 0.0, 0.0, 0.06,
    );
    b0(m, a, 0.34, 0.022, 0.022, 0.02, 0.325, 0.0, drewno_m);
    m.node(a).set_pos(0.10, 0.015, 0.30).rot_y(0.35);
    m.attach(g, a);
    let bb = m.detached();
    b0(m, bb, 0.26, 0.065, 0.12, 0.0, 0.045, 0.0, kadlub_b_m);
    b(
        m, bb, 0.09, 0.06, 0.09, 0.145, 0.056, 0.0, kadlub_b_m, 0.0, 0.0, 0.34,
    );
    b0(m, bb, 0.20, 0.018, 0.08, 0.0, 0.082, 0.0, wnetrze_m);
    b0(m, bb, 0.02, 0.26, 0.02, -0.02, 0.20, 0.0, maszt_m);
    b(
        m, bb, 0.22, 0.04, 0.038, -0.03, 0.28, 0.0, zagiel_m, 0.0, 0.0, -0.05,
    );
    b(
        m, bb, 0.24, 0.016, 0.05, 0.06, 0.05, 0.09, drewno_m, 0.0, 0.3, 0.55,
    );
    m.node(bb).set_pos(-0.38, 0.015, 0.42).rot_y(-0.65);
    m.attach(g, bb);
    let pomost = m.detached();
    for (px, pz) in [
        (-0.075, 0.16),
        (0.075, 0.16),
        (-0.075, -0.07),
        (0.075, -0.07),
        (-0.075, -0.30),
        (0.075, -0.30),
    ] {
        b0(m, pomost, 0.034, 0.13, 0.034, px, 0.065, pz, pal_m);
    }
    b0(m, pomost, 0.15, 0.024, 0.60, 0.0, 0.095, -0.07, drewno_m);
    b0(m, pomost, 0.17, 0.013, 0.055, 0.0, 0.113, 0.10, kadlub_b_m);
    m.node(pomost).set_pos(-0.02, 0.0, -0.16).rot_y(0.22);
    m.attach(g, pomost);
    let sieci = m.detached();
    b0(m, sieci, 0.035, 0.30, 0.035, -0.16, 0.15, 0.0, pal_m);
    b0(m, sieci, 0.035, 0.30, 0.035, 0.16, 0.15, 0.0, pal_m);
    b0(m, sieci, 0.36, 0.022, 0.022, 0.0, 0.285, 0.0, drewno_m);
    b(
        m, sieci, 0.30, 0.16, 0.014, 0.0, 0.195, 0.012, siec_m, 0.16, 0.0, 0.05,
    );
    b(
        m, sieci, 0.13, 0.10, 0.012, -0.075, 0.07, 0.015, siec_m, -0.1, 0.0, -0.14,
    );
    b(
        m, sieci, 0.09, 0.08, 0.012, 0.09, 0.065, -0.01, siec_m, 0.12, 0.0, 0.1,
    );
    m.node(sieci).set_pos(0.34, 0.02, -0.40).rot_y(-0.55);
    m.attach(g, sieci);
    b(
        m, g, 0.11, 0.05, 0.08, -0.095, 0.132, -0.32, kadlub_b_m, 0.0, 0.25, 0.0,
    );
    b(
        m, g, 0.032, 0.028, 0.02, -0.11, 0.167, -0.325, ryba_m, 0.0, 0.5, 0.0,
    );
    b(
        m, g, 0.03, 0.026, 0.018, -0.08, 0.164, -0.305, ryba_m, 0.0, -0.3, 0.0,
    );
    b(
        m, g, 0.06, 0.055, 0.06, 0.52, 0.03, 0.52, boja_m, 0.0, 0.4, 0.0,
    );
    b0(m, g, 0.014, 0.07, 0.014, 0.52, 0.09, 0.52, maszt_m);
}

/// `buildStadnina(liczbaKoni = 2)` (`:411-480`) into `g`.
pub fn build_stadnina_into(m: &mut ImprovementModel, g: NodeId, liczba_koni: i32) {
    let sciana_m = m.lambert(SCIANA);
    let dach_m = m.lambert(DACH_DESKA);
    let ciemny_m = m.lambert(DREWNO_C);
    let bialy_m = m.lambert(BIALY);
    let drzwi_m = m.lambert(CIEMNE_DRZWI);
    let siano_m = m.lambert(SIANO);
    let pal_m = m.lambert(DREWNO_DK);
    let rygl_m = m.lambert(DREWNO);
    let woda_m = m.lambert(WODA);

    let stajnia = m.detached();
    let pod = m.lambert(KAMIEN);
    b0(m, stajnia, 0.46, 0.05, 0.34, 0.0, 0.025, 0.0, pod);
    b0(m, stajnia, 0.42, 0.21, 0.30, 0.0, 0.155, 0.0, sciana_m);
    b(
        m, stajnia, 0.48, 0.042, 0.21, 0.0, 0.315, 0.083, dach_m, 0.60, 0.0, 0.0,
    );
    b(
        m, stajnia, 0.48, 0.042, 0.21, 0.0, 0.315, -0.083, dach_m, -0.60, 0.0, 0.0,
    );
    b0(m, stajnia, 0.50, 0.048, 0.09, 0.0, 0.378, 0.0, ciemny_m);
    b0(m, stajnia, 0.02, 0.15, 0.15, 0.212, 0.125, 0.0, drzwi_m);
    b0(m, stajnia, 0.016, 0.045, 0.17, 0.222, 0.175, 0.0, bialy_m);
    let okno = m.lambert(CIEN);
    b0(m, stajnia, 0.10, 0.085, 0.02, -0.08, 0.20, 0.155, okno);
    b(
        m, stajnia, 0.11, 0.095, 0.10, -0.26, 0.048, -0.05, siano_m, 0.0, 0.3, 0.0,
    );
    m.node(stajnia).rot_y(-1.15);
    m.attach(g, stajnia);
    for az in [82.0, 108.0, 134.0, 160.0, 186.0] {
        let seg = m.detached();
        b0(m, seg, 0.035, 0.17, 0.035, -0.165, 0.085, 0.0, pal_m);
        b0(m, seg, 0.035, 0.17, 0.035, 0.165, 0.085, 0.0, pal_m);
        b0(m, seg, 0.38, 0.028, 0.026, 0.0, 0.075, 0.0, rygl_m);
        b0(m, seg, 0.38, 0.028, 0.026, 0.0, 0.135, 0.0, rygl_m);
        let (x, z) = az_xz(az, 0.66);
        m.node(seg).set_pos(x, 0.0, z).rot_y(tang_rot_y(az));
        m.attach(g, seg);
    }
    let brama = m.detached();
    b0(m, brama, 0.045, 0.24, 0.045, -0.10, 0.12, 0.0, pal_m);
    b0(m, brama, 0.045, 0.24, 0.045, 0.10, 0.12, 0.0, pal_m);
    b0(m, brama, 0.26, 0.035, 0.035, 0.0, 0.255, 0.0, ciemny_m);
    let (bcx, bcz) = az_xz(213.0, 0.63);
    m.node(brama)
        .set_pos(bcx, 0.0, bcz)
        .rot_y(tang_rot_y(213.0));
    m.attach(g, brama);
    let kon = |m: &mut ImprovementModel, cialo: u32, grzywa: u32, az: f64, r: f64, rot_y: f64| {
        let k = m.detached();
        let mb = m.lambert(cialo);
        let mm = m.lambert(grzywa);
        build_horse(m, k, mb, mm, None, 0.0, 0.0);
        let (x, z) = az_xz(az, r);
        m.node(k)
            .set_scale_scalar(0.56)
            .set_pos(x, 0.0, z)
            .rot_y(rot_y);
        m.attach(g, k);
    };
    kon(m, KON_KASZTAN, KON_KASZTAN_GRZYWA, 90.0, 0.40, 2.90);
    if liczba_koni >= 2 {
        kon(m, KON_SIWY, KON_SIWY_GRZYWA, 152.0, 0.53, 2.0);
    }
    let poidlo = m.detached();
    b0(m, poidlo, 0.19, 0.065, 0.105, 0.0, 0.0325, 0.0, ciemny_m);
    b0(m, poidlo, 0.16, 0.016, 0.078, 0.0, 0.058, 0.0, woda_m);
    let (pcx, pcz) = az_xz(137.0, 0.38);
    m.node(poidlo)
        .set_pos(pcx, 0.0, pcz)
        .rot_y(tang_rot_y(137.0) + 0.35);
    m.attach(g, poidlo);
    let (sx, sz) = az_xz(46.0, 0.47);
    cone(m, g, 0.10, 0.16, sx, 0.08, sz, siano_m, 4, 0.0, 0.4, 0.0);
}

/// `buildWyrab()`.
#[must_use]
pub fn build_wyrab() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_wyrab_into(&mut m, ROOT);
    m
}

/// `buildObozLowiecki()`.
#[must_use]
pub fn build_oboz_lowiecki() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_oboz_lowiecki_into(&mut m, ROOT);
    m
}

/// `buildGlinianka()`.
#[must_use]
pub fn build_glinianka() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_glinianka_into(&mut m, ROOT);
    m
}

/// `buildWarzelniaSoli()`.
#[must_use]
pub fn build_warzelnia_soli() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_warzelnia_soli_into(&mut m, ROOT);
    m
}

/// `buildLodzieRybackie()`.
#[must_use]
pub fn build_lodzie_rybackie() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_lodzie_rybackie_into(&mut m, ROOT);
    m
}

/// `buildStadnina(liczbaKoni)` (the web default is 2).
#[must_use]
pub fn build_stadnina(liczba_koni: i32) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_stadnina_into(&mut m, ROOT, liczba_koni);
    m
}
