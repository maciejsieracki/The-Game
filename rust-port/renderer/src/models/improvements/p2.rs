//! `render/ulepszenia-modele-p2.ts` (`edb8fb56`): farm (barn), mine,
//! quarry, sawmill and the pasture extras, roblox style (Lambert,
//! `flatShading`).

use std::f64::consts::PI;

use crate::models::unit_core::model::{NodeId, ROOT};

use super::kit::{az_xz, b, b0, cone, cyl, tang_rot_y};
use super::model::ImprovementExt;
use super::model::ImprovementModel;

/// `WariantFarmy` (`ulepszenia-modele-p2.ts:52`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum WariantFarmy {
    /// `'pastwisko'` (default of `buildFarma`).
    #[default]
    Pastwisko,
    /// `'solo'`.
    Solo,
}

/// Palette `P` (`:105-113`).
mod pal {
    pub const DREWNO: u32 = 0xc98a4b;
    pub const DREWNO_DK: u32 = 0x8a5a2e;
    pub const DREWNO_C: u32 = 0x6b4423;
    pub const BAL: u32 = 0xcd853f;
    pub const DACH_CZERW: u32 = 0xd93a2b;
    pub const DACH_CZERW_DK: u32 = 0xb02a1f;
    pub const SCIANA: u32 = 0xd9a05b;
    pub const BIALY: u32 = 0xf7f4ea;
    pub const CIEN: u32 = 0x4a2f16;
    pub const CIEMNE_DRZWI: u32 = 0x7a4a22;
    pub const KAMIEN: u32 = 0x9aa5b1;
    pub const KAMIEN_DK: u32 = 0x717d89;
    pub const KAMIEN_HI: u32 = 0xb7c0c8;
    pub const BLOK: u32 = 0xcdd5db;
    pub const CZERN: u32 = 0x14100b;
    pub const METAL: u32 = 0x545d66;
    pub const STAL: u32 = 0xd7dde2;
    pub const RUDA: u32 = 0xffa726;
    pub const SIANO: u32 = 0xf0c34e;
    pub const ZIEMIA: u32 = 0x8a6a45;
    pub const SCIEZKA: u32 = 0xc4a574;
    pub const ZBOZE: u32 = 0xe9c34e;
    pub const ZBOZE_DK: u32 = 0xc99f35;
    pub const WODA: u32 = 0x4ab6e8;
    pub const PLOMIEN: u32 = 0xffc02e;
}
use pal::*;

/// `ULEPSZENIA_P2_LAYOUT` (`:317-345`), the values the builders read.
pub mod layout {
    /// `farma.pastwisko.budynek.rotY`.
    pub const FARMA_PASTWISKO_ROT_Y: f64 = -1.15;
    /// `farma.solo.budynek.rotY`.
    pub const FARMA_SOLO_ROT_Y: f64 = -1.15;
    /// `farma.solo.poletka` (`az`, `r`).
    pub const FARMA_SOLO_POLETKA: [(f64, f64); 3] = [(85.0, 0.63), (205.0, 0.62), (287.0, 0.65)];
    /// `farma.solo.strach`.
    pub const FARMA_SOLO_STRACH: (f64, f64) = (57.0, 0.53);
    /// `farma.solo.sciezka`.
    pub const FARMA_SOLO_SCIEZKA: (f64, f64) = (156.0, 0.45);
    /// `zagrodaDodatki.sloty.plotek`.
    pub const ZAGRODA_PLOTEK: (f64, f64) = (303.0, 0.71);
    /// `zagrodaDodatki.sloty.poidlo` (`az`, `r`, `rotY`).
    pub const ZAGRODA_POIDLO: (f64, f64, f64) = (264.0, 0.58, 0.22);
    /// `zagrodaDodatki.sloty.stog`.
    pub const ZAGRODA_STOG: (f64, f64) = (310.0, 0.72);
    /// `kopalnia.budynek.rotY`.
    pub const KOPALNIA_ROT_Y: f64 = -0.95;
    /// `kamieniolom.budynek.rotY`.
    pub const KAMIENIOLOM_ROT_Y: f64 = 0.25;
    /// `tartak.budynek.rotY`.
    pub const TARTAK_ROT_Y: f64 = -0.2;
}

/// `buildFarma({ wariant })` (`:116-177`) into group `g`.
pub fn build_farma_into(m: &mut ImprovementModel, g: NodeId, wariant: WariantFarmy) {
    // non-solo: the barn group IS the returned group
    let stodola = if wariant == WariantFarmy::Solo {
        m.detached()
    } else {
        g
    };
    let sciana_m = m.lambert(SCIANA);
    let cokol_m = m.lambert(KAMIEN);
    let dach_m = m.lambert(DACH_CZERW);
    let dach_dk_m = m.lambert(DACH_CZERW_DK);
    let bialy_m = m.lambert(BIALY);
    let drzwi_m = m.lambert(CIEMNE_DRZWI);
    let cien_m = m.lambert(CIEN);
    let siano_m = m.lambert(SIANO);

    b0(m, stodola, 0.56, 0.05, 0.44, 0.0, 0.025, 0.0, cokol_m);
    b0(m, stodola, 0.52, 0.24, 0.40, 0.0, 0.17, 0.0, sciana_m);
    b0(m, stodola, 0.52, 0.10, 0.30, 0.0, 0.34, 0.0, sciana_m);
    b0(m, stodola, 0.52, 0.09, 0.10, 0.0, 0.435, 0.0, sciana_m);
    b(
        m, stodola, 0.60, 0.045, 0.34, 0.0, 0.378, 0.135, dach_m, 0.647, 0.0, 0.0,
    );
    b(
        m, stodola, 0.60, 0.045, 0.34, 0.0, 0.378, -0.135, dach_m, -0.647, 0.0, 0.0,
    );
    b0(m, stodola, 0.62, 0.055, 0.115, 0.0, 0.482, 0.0, dach_dk_m);
    b0(m, stodola, 0.02, 0.17, 0.17, 0.262, 0.135, 0.0, drzwi_m);
    b(
        m, stodola, 0.016, 0.21, 0.042, 0.274, 0.135, 0.0, bialy_m, 0.66, 0.0, 0.0,
    );
    b(
        m, stodola, 0.016, 0.21, 0.042, 0.274, 0.135, 0.0, bialy_m, -0.66, 0.0, 0.0,
    );
    for (sx, sz) in [(1.0, 1.0), (1.0, -1.0), (-1.0, 1.0), (-1.0, -1.0)] {
        b0(
            m,
            stodola,
            0.035,
            0.25,
            0.035,
            sx * 0.255,
            0.175,
            sz * 0.195,
            bialy_m,
        );
    }
    for sz in [1.0, -1.0] {
        b0(
            m,
            stodola,
            0.11,
            0.10,
            0.02,
            -0.07,
            0.19,
            sz * 0.205,
            bialy_m,
        );
        b0(
            m,
            stodola,
            0.08,
            0.07,
            0.022,
            -0.07,
            0.19,
            sz * 0.212,
            cien_m,
        );
    }
    if wariant != WariantFarmy::Solo {
        b(
            m, stodola, 0.10, 0.09, 0.10, -0.315, 0.045, 0.10, siano_m, 0.0, 0.35, 0.0,
        );
        b(
            m, stodola, 0.08, 0.07, 0.08, -0.30, 0.035, -0.06, siano_m, 0.0, -0.2, 0.0,
        );
        return;
    }

    m.node(stodola).rot_y(layout::FARMA_SOLO_ROT_Y);
    m.attach(g, stodola);
    let ziemia_m = m.lambert(ZIEMIA);
    let zboze_m = m.lambert(ZBOZE);
    let zboze_dk_m = m.lambert(ZBOZE_DK);
    let pal_m = m.lambert(DREWNO_DK);
    let sciezka_m = m.lambert(SCIEZKA);
    for (az, r) in layout::FARMA_SOLO_POLETKA {
        let p = m.detached();
        b0(m, p, 0.38, 0.035, 0.30, 0.0, 0.0175, 0.0, ziemia_m);
        for i in 0..3 {
            let mat = if i % 2 == 1 { zboze_dk_m } else { zboze_m };
            b0(
                m,
                p,
                0.34,
                0.10,
                0.055,
                0.0,
                0.067,
                -0.09 + f64::from(i) * 0.09,
                mat,
            );
        }
        let (x, z) = az_xz(az, r);
        m.node(p).set_pos(x, 0.0, z).rot_y(tang_rot_y(az));
        m.attach(g, p);
    }
    let st = m.detached();
    b0(m, st, 0.025, 0.30, 0.025, 0.0, 0.15, 0.0, pal_m);
    b0(m, st, 0.025, 0.025, 0.26, 0.0, 0.235, 0.0, pal_m);
    b0(m, st, 0.07, 0.07, 0.065, 0.0, 0.315, 0.0, siano_m);
    let drewno_c = m.lambert(DREWNO_C);
    cone(
        m, st, 0.062, 0.06, 0.0, 0.38, 0.0, drewno_c, 4, 0.0, 0.4, 0.0,
    );
    let (sx, sz) = az_xz(layout::FARMA_SOLO_STRACH.0, layout::FARMA_SOLO_STRACH.1);
    m.node(st).set_pos(sx, 0.0, sz).rot_y(0.6);
    m.attach(g, st);
    let (px, pz) = az_xz(layout::FARMA_SOLO_SCIEZKA.0, layout::FARMA_SOLO_SCIEZKA.1);
    let path = b0(m, g, 0.26, 0.018, 0.15, px, 0.009, pz, sciezka_m);
    m.node(path)
        .rot_y(PI / 2.0 - (layout::FARMA_SOLO_SCIEZKA.0 * PI) / 180.0);
}

/// `buildKopalnia()` (`:180-210`) into `g`.
pub fn build_kopalnia_into(m: &mut ImprovementModel, g: NodeId) {
    let skala_m = m.lambert(KAMIEN);
    let skala_dk_m = m.lambert(KAMIEN_DK);
    let skala_hi_m = m.lambert(KAMIEN_HI);
    let belka_m = m.lambert(DREWNO_DK);
    let belka_c_m = m.lambert(DREWNO_C);
    let czern_m = m.lambert(CZERN);
    let metal_m = m.lambert(METAL);
    let ruda_m = m.lambert(RUDA);
    let plomien_m = m.lambert(PLOMIEN);

    b(
        m, g, 0.52, 0.36, 0.46, -0.10, 0.18, 0.0, skala_m, 0.0, 0.12, 0.0,
    );
    b(
        m, g, 0.34, 0.26, 0.36, -0.02, 0.13, 0.24, skala_dk_m, 0.0, 0.55, 0.0,
    );
    b(
        m, g, 0.32, 0.24, 0.34, -0.08, 0.12, -0.26, skala_hi_m, 0.0, -0.4, 0.0,
    );
    b(
        m, g, 0.30, 0.20, 0.26, -0.14, 0.365, -0.02, skala_hi_m, 0.0, 0.3, 0.08,
    );
    b0(m, g, 0.055, 0.24, 0.055, 0.17, 0.12, 0.115, belka_m);
    b0(m, g, 0.055, 0.24, 0.055, 0.17, 0.12, -0.115, belka_m);
    b0(m, g, 0.06, 0.055, 0.31, 0.17, 0.262, 0.0, belka_c_m);
    b0(m, g, 0.02, 0.20, 0.17, 0.15, 0.10, 0.0, czern_m);
    for i in 0..4 {
        b0(
            m,
            g,
            0.055,
            0.022,
            0.17,
            0.26 + f64::from(i) * 0.13,
            0.011,
            0.0,
            belka_c_m,
        );
    }
    b0(m, g, 0.50, 0.022, 0.026, 0.45, 0.033, 0.055, metal_m);
    b0(m, g, 0.50, 0.022, 0.026, 0.45, 0.033, -0.055, metal_m);
    let wx = 0.56;
    cyl(
        m,
        g,
        0.045,
        0.045,
        0.155,
        wx - 0.052,
        0.045,
        0.0,
        metal_m,
        6,
        PI / 2.0,
        0.0,
        0.0,
    );
    cyl(
        m,
        g,
        0.045,
        0.045,
        0.155,
        wx + 0.052,
        0.045,
        0.0,
        metal_m,
        6,
        PI / 2.0,
        0.0,
        0.0,
    );
    b0(m, g, 0.17, 0.105, 0.135, wx, 0.14, 0.0, belka_m);
    b(
        m,
        g,
        0.06,
        0.05,
        0.055,
        wx - 0.03,
        0.20,
        0.02,
        ruda_m,
        0.0,
        0.3,
        0.0,
    );
    b(
        m,
        g,
        0.05,
        0.045,
        0.05,
        wx + 0.035,
        0.195,
        -0.025,
        ruda_m,
        0.0,
        -0.2,
        0.0,
    );
    b(
        m, g, 0.085, 0.075, 0.085, 0.30, 0.038, 0.20, ruda_m, 0.0, 0.5, 0.0,
    );
    b(
        m, g, 0.075, 0.065, 0.075, 0.24, 0.033, -0.21, skala_dk_m, 0.0, -0.3, 0.0,
    );
    b0(m, g, 0.02, 0.15, 0.02, 0.235, 0.075, 0.165, belka_c_m);
    b0(m, g, 0.038, 0.05, 0.038, 0.235, 0.155, 0.165, plomien_m);
}

/// `buildKamieniolom()` (`:213-242`) into `g`.
pub fn build_kamieniolom_into(m: &mut ImprovementModel, g: NodeId) {
    let kam_m = m.lambert(KAMIEN);
    let kam_dk_m = m.lambert(KAMIEN_DK);
    let kam_hi_m = m.lambert(KAMIEN_HI);
    let blok_m = m.lambert(BLOK);
    let drewno_m = m.lambert(DREWNO_DK);
    let lina_m = m.lambert(0x6b5334);

    cyl(
        m, g, 0.58, 0.62, 0.07, 0.0, 0.035, 0.0, kam_dk_m, 6, 0.0, 0.0, 0.0,
    );
    b0(m, g, 0.72, 0.13, 0.30, -0.02, 0.135, -0.30, kam_m);
    b(
        m, g, 0.58, 0.13, 0.26, -0.05, 0.265, -0.35, kam_hi_m, 0.0, 0.06, 0.0,
    );
    b(
        m, g, 0.42, 0.13, 0.22, -0.02, 0.395, -0.38, kam_m, 0.0, -0.05, 0.0,
    );
    b(
        m, g, 0.26, 0.11, 0.30, -0.36, 0.125, -0.12, kam_hi_m, 0.0, 0.25, 0.0,
    );
    b(
        m, g, 0.24, 0.10, 0.26, 0.32, 0.12, -0.18, kam_m, 0.0, -0.3, 0.0,
    );
    b0(m, g, 0.14, 0.12, 0.14, 0.30, 0.13, 0.24, blok_m);
    b(
        m, g, 0.13, 0.11, 0.13, 0.45, 0.125, 0.30, blok_m, 0.0, 0.4, 0.0,
    );
    b(
        m, g, 0.12, 0.10, 0.12, 0.36, 0.24, 0.265, blok_m, 0.0, 0.15, 0.0,
    );
    b0(m, g, 0.05, 0.50, 0.05, -0.16, 0.32, 0.30, drewno_m);
    b0(m, g, 0.46, 0.05, 0.05, 0.02, 0.545, 0.30, drewno_m);
    b(
        m, g, 0.035, 0.28, 0.035, -0.045, 0.435, 0.30, drewno_m, 0.0, 0.0, -0.72,
    );
    b0(m, g, 0.014, 0.17, 0.014, 0.21, 0.435, 0.30, lina_m);
    b(
        m, g, 0.11, 0.10, 0.11, 0.21, 0.30, 0.30, blok_m, 0.0, 0.25, 0.0,
    );
    let drab = m.detached();
    b0(m, drab, 0.024, 0.36, 0.02, -0.05, 0.18, 0.0, drewno_m);
    b0(m, drab, 0.024, 0.36, 0.02, 0.05, 0.18, 0.0, drewno_m);
    for i in 0..3 {
        b0(
            m,
            drab,
            0.115,
            0.022,
            0.018,
            0.0,
            0.08 + f64::from(i) * 0.09,
            0.0,
            drewno_m,
        );
    }
    m.node(drab).set_pos(0.10, 0.07, -0.115).rot_x(-0.42);
    m.attach(g, drab);
    b(
        m, g, 0.07, 0.05, 0.07, -0.28, 0.095, 0.22, kam_dk_m, 0.0, 0.4, 0.0,
    );
    b(
        m, g, 0.055, 0.045, 0.055, -0.19, 0.09, 0.30, kam_hi_m, 0.0, -0.3, 0.0,
    );
}

/// `buildTartak()` (`:245-280`) into `g`.
pub fn build_tartak_into(m: &mut ImprovementModel, g: NodeId) {
    let slup_m = m.lambert(DREWNO_DK);
    let dach_m = m.lambert(0xa46a38);
    let dach_dk_m = m.lambert(DREWNO_C);
    let bal_m = m.lambert(BAL);
    let stal_m = m.lambert(STAL);
    let uchwyt_m = m.lambert(DREWNO_C);
    let deska_m = m.lambert(DREWNO);

    let wiata = m.detached();
    for (sx, sz) in [(1.0, 1.0), (1.0, -1.0), (-1.0, 1.0), (-1.0, -1.0)] {
        b0(
            m,
            wiata,
            0.045,
            0.24,
            0.045,
            sx * 0.21,
            0.12,
            sz * 0.13,
            slup_m,
        );
    }
    b(
        m, wiata, 0.54, 0.038, 0.22, 0.0, 0.30, 0.085, dach_m, 0.5, 0.0, 0.0,
    );
    b(
        m, wiata, 0.54, 0.038, 0.22, 0.0, 0.30, -0.085, dach_m, -0.5, 0.0, 0.0,
    );
    b0(m, wiata, 0.56, 0.045, 0.06, 0.0, 0.355, 0.0, dach_dk_m);
    b0(m, wiata, 0.42, 0.045, 0.17, 0.0, 0.0225, 0.0, deska_m);
    b(
        m, wiata, 0.38, 0.045, 0.14, 0.01, 0.0675, 0.01, deska_m, 0.0, 0.05, 0.0,
    );
    b(
        m, wiata, 0.34, 0.045, 0.11, -0.01, 0.1125, 0.0, deska_m, 0.0, -0.04, 0.0,
    );
    m.node(wiata).set_pos(-0.06, 0.0, -0.30);
    m.attach(g, wiata);
    for kx in [-0.15, 0.15] {
        b(
            m,
            g,
            0.035,
            0.24,
            0.035,
            kx - 0.02,
            0.12,
            0.32,
            slup_m,
            0.45,
            0.0,
            0.0,
        );
        b(
            m,
            g,
            0.035,
            0.24,
            0.035,
            kx - 0.02,
            0.12,
            0.20,
            slup_m,
            -0.45,
            0.0,
            0.0,
        );
    }
    cyl(
        m,
        g,
        0.062,
        0.062,
        0.56,
        -0.02,
        0.235,
        0.26,
        bal_m,
        6,
        0.0,
        0.0,
        PI / 2.0,
    );
    b0(m, g, 0.014, 0.19, 0.06, 0.045, 0.315, 0.26, stal_m);
    b0(m, g, 0.13, 0.03, 0.03, 0.045, 0.415, 0.26, uchwyt_m);
    let sterta = m.detached();
    for (bz, by) in [
        (-0.066, 0.058),
        (0.0, 0.058),
        (0.066, 0.058),
        (-0.033, 0.152),
        (0.033, 0.152),
    ] {
        cyl(
            m,
            sterta,
            0.058,
            0.058,
            0.46,
            0.0,
            by,
            bz,
            bal_m,
            6,
            PI / 2.0,
            0.0,
            0.0,
        );
    }
    m.node(sterta).set_pos(0.44, 0.0, -0.10).rot_y(-0.18);
    m.attach(g, sterta);
    cyl(
        m, g, 0.07, 0.078, 0.13, -0.42, 0.065, 0.14, slup_m, 6, 0.0, 0.0, 0.0,
    );
    b(
        m, g, 0.02, 0.19, 0.02, -0.38, 0.155, 0.16, uchwyt_m, 0.0, 0.0, -0.6,
    );
    b0(m, g, 0.055, 0.06, 0.016, -0.445, 0.20, 0.15, stal_m);
}

/// `buildZagrodaDodatki(hexR = 1.0)` (`:284-308`) into `g`.
pub fn build_zagroda_dodatki_into(m: &mut ImprovementModel, g: NodeId, hex_r: f64) {
    let pal_m = m.lambert(DREWNO_DK);
    let rygl_m = m.lambert(DREWNO);
    let koryto_m = m.lambert(DREWNO_C);
    let woda_m = m.lambert(WODA);
    let siano_m = m.lambert(SIANO);
    let plot = m.detached();
    b0(m, plot, 0.035, 0.17, 0.035, -0.145, 0.085, 0.0, pal_m);
    b0(m, plot, 0.035, 0.17, 0.035, 0.145, 0.085, 0.0, pal_m);
    b0(m, plot, 0.34, 0.028, 0.024, 0.0, 0.078, 0.0, rygl_m);
    b0(m, plot, 0.34, 0.028, 0.024, 0.0, 0.138, 0.0, rygl_m);
    let (ppx, ppz) = az_xz(layout::ZAGRODA_PLOTEK.0, layout::ZAGRODA_PLOTEK.1);
    m.node(plot)
        .set_pos(ppx * hex_r, 0.0, ppz * hex_r)
        .rot_y(tang_rot_y(layout::ZAGRODA_PLOTEK.0));
    m.attach(g, plot);
    let poj = m.detached();
    b0(m, poj, 0.19, 0.065, 0.105, 0.0, 0.0325, 0.0, koryto_m);
    b0(m, poj, 0.16, 0.016, 0.078, 0.0, 0.058, 0.0, woda_m);
    let (wpx, wpz) = az_xz(layout::ZAGRODA_POIDLO.0, layout::ZAGRODA_POIDLO.1);
    m.node(poj)
        .set_pos(wpx * hex_r, 0.0, wpz * hex_r)
        .rot_y(layout::ZAGRODA_POIDLO.2);
    m.attach(g, poj);
    let (spx, spz) = az_xz(layout::ZAGRODA_STOG.0, layout::ZAGRODA_STOG.1);
    cone(
        m,
        g,
        0.115,
        0.18,
        spx * hex_r,
        0.09,
        spz * hex_r,
        siano_m,
        4,
        0.0,
        0.3,
        0.0,
    );
}

/// `buildFarma({ wariant })` as a standalone model.
#[must_use]
pub fn build_farma(wariant: WariantFarmy) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_farma_into(&mut m, ROOT, wariant);
    m
}

/// `buildKopalnia()`.
#[must_use]
pub fn build_kopalnia() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_kopalnia_into(&mut m, ROOT);
    m
}

/// `buildKamieniolom()`.
#[must_use]
pub fn build_kamieniolom() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_kamieniolom_into(&mut m, ROOT);
    m
}

/// `buildTartak()`.
#[must_use]
pub fn build_tartak() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_tartak_into(&mut m, ROOT);
    m
}

/// `buildZagrodaDodatki(hexR)`.
#[must_use]
pub fn build_zagroda_dodatki(hex_r: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_zagroda_dodatki_into(&mut m, ROOT, hex_r);
    m
}
