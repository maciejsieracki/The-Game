//! `render/miasto-kamien.ts` (web `edb8fb56`, 667 LOC): the stone-age city
//! of the live map path (era 1, `roblox` style), 10 levels in 3 phases,
//! optional Biskupin palisade (`wal`, also reused by the bronze cities
//! through [`build_palisada_wal`]).

use std::f64::consts::PI;

use super::kit::{az_xz, ku_srodkowi, ku_srodkowi_az, tang_rot_y};
use super::model::{CityMatId, CityModel, CityUserData, Rozmiar};
use crate::jsmath::{js_cos, js_hypot, js_sin};
use crate::models::unit_core::model::{NodeId, ROOT};
use crate::pick::hex::js_round;
use crate::pick::three::{js_max, js_min};
use crate::terrain::color::Color;

/// `MIASTO_KAMIEN_CITY_MODEL_SCALE` (`miasto-kamien.ts:88`).
pub const MIASTO_KAMIEN_CITY_MODEL_SCALE: f64 = 1.38;
/// `MIASTO_KAMIEN_DEFAULT_COLOR` (`miasto-kamien.ts:91`).
pub const MIASTO_KAMIEN_DEFAULT_COLOR: u32 = 0x00ff_d54a;

/// `MIASTO_KAMIEN_LAYOUT.triPoziomy` (`miasto-kamien.ts:651`).
pub const TRI_POZIOMY: [u32; 10] = [176, 296, 468, 528, 608, 784, 832, 892, 964, 1024];

/// `OS_WALU[rozmiar]` (`miasto-kamien.ts:598`).
#[must_use]
pub const fn os_walu(rz: Rozmiar) -> f64 {
    match rz {
        Rozmiar::Male => 0.37,
        Rozmiar::Srednie => 0.42,
        Rozmiar::Duze => 0.445,
    }
}

/// The `poziom` argument: a level number or a threshold name
/// (`RozmiarMiastaKamien | number`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Poziom {
    /// A level (any double; clamped and rounded).
    Level(f64),
    /// `'male'` → 3, `'srednie'` → 6, `'duze'` → 10.
    Size(Rozmiar),
}

impl From<f64> for Poziom {
    fn from(v: f64) -> Self {
        Self::Level(v)
    }
}

/// `Math.max(1, Math.min(10, Math.round(v)))`.
#[must_use]
pub fn clamp_level(v: f64) -> f64 {
    js_max(1.0, js_min(10.0, js_round(v)))
}

/// `poziomZArgumentu(a)` (`miasto-kamien.ts:592-595`, same in `miasto-braz.ts`).
#[must_use]
pub fn poziom_z_argumentu(a: Poziom) -> f64 {
    match a {
        Poziom::Level(v) => clamp_level(v),
        Poziom::Size(Rozmiar::Male) => 3.0,
        Poziom::Size(Rozmiar::Srednie) => 6.0,
        Poziom::Size(Rozmiar::Duze) => 10.0,
    }
}

/// `rozmiarDlaPoziomu(level)` (`miasto-kamien.ts:584-589`).
#[must_use]
pub fn rozmiar_dla_poziomu(level: f64) -> Rozmiar {
    rozmiar_of_clamped(clamp_level(level))
}

/// Phase of an already clamped level (NaN → `duze`, like the web comparisons).
pub(crate) fn rozmiar_of_clamped(l: f64) -> Rozmiar {
    if l <= 3.0 {
        Rozmiar::Male
    } else if l <= 6.0 {
        Rozmiar::Srednie
    } else {
        Rozmiar::Duze
    }
}

/// `MiastoKamienOpts` (`miasto-kamien.ts:80-85`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct MiastoKamienOpts {
    /// `mur`: Biskupin palisade.
    pub mur: bool,
    /// `color` (`None` = `MIASTO_KAMIEN_DEFAULT_COLOR`).
    pub color: Option<u32>,
}

/// Palette `P` (`miasto-kamien.ts:148-160`) as materials (`interface M`).
#[allow(missing_docs)]
#[derive(Debug, Clone, Copy)]
pub(crate) struct M {
    pub sciana: CityMatId,
    pub sciana_dk: CityMatId,
    pub glina: CityMatId,
    pub strzecha: CityMatId,
    pub strzecha_dk: CityMatId,
    pub strzecha_kal: CityMatId,
    pub drewno: CityMatId,
    pub drewno_dk: CityMatId,
    pub drewno_c: CityMatId,
    pub pal: CityMatId,
    pub wal_drewno: CityMatId,
    pub wal_drewno_dk: CityMatId,
    pub wal_drewno_hi: CityMatId,
    pub wal_ziemia: CityMatId,
    pub wal_ziemia_dk: CityMatId,
    pub kamien: CityMatId,
    pub kamien_dk: CityMatId,
    pub kamien_hi: CityMatId,
    pub skora: CityMatId,
    pub skora_dk: CityMatId,
    pub skora_hi: CityMatId,
    pub klepisko: CityMatId,
    pub sciezka: CityMatId,
    pub ogien: CityMatId,
    pub plomien: CityMatId,
    pub dym: CityMatId,
    pub dym_dk: CityMatId,
    pub zboze: CityMatId,
    pub czern: CityMatId,
    pub cien: CityMatId,
    pub frakcja: CityMatId,
    pub kalenica_wodza: CityMatId,
}

/// `makeMats(color)` (`miasto-kamien.ts:176-192`).
pub(crate) fn make_mats(c: &mut CityModel, color: u32) -> M {
    let kal = Color::from_hex(0x00db_a044).lerp(Color::from_hex(color & 0x00ff_ffff), 0.45);
    let mut mat = |hex: u32| c.lambert(hex, true);
    let sciana = mat(0x00d9_a05b);
    let sciana_dk = mat(0x00c0_8a4a);
    let glina = mat(0x00c4_9a62);
    let strzecha = mat(0x00f0_c34e);
    let strzecha_dk = mat(0x00c0_913a);
    let strzecha_kal = mat(0x00db_a044);
    let drewno = mat(0x00c9_8a4b);
    let drewno_dk = mat(0x008a_5a2e);
    let drewno_c = mat(0x006b_4423);
    let pal = mat(0x0077_502c);
    let wal_drewno = mat(0x007a_7268);
    let wal_drewno_dk = mat(0x005c_554e);
    let wal_drewno_hi = mat(0x008f_877c);
    let wal_ziemia = mat(0x006b_7a4a);
    let wal_ziemia_dk = mat(0x0055_6640);
    let kamien = mat(0x009a_a5b1);
    let kamien_dk = mat(0x0071_7d89);
    let kamien_hi = mat(0x00b7_c0c8);
    let skora = mat(0x009a_6b45);
    let skora_dk = mat(0x007d_5233);
    let skora_hi = mat(0x00b5_854f);
    let klepisko = mat(0x00a0_8a68);
    let sciezka = mat(0x00bb_9059);
    let ogien = mat(0x00ff_6b2e);
    let plomien = mat(0x00ff_c02e);
    let dym = mat(0x00d2_d2c8);
    let dym_dk = mat(0x00b0_b0a4);
    let zboze = mat(0x00e9_c34e);
    let czern = mat(0x0014_100b);
    let cien = mat(0x004a_2f16);
    let frakcja = mat(color & 0x00ff_ffff);
    let kalenica_wodza = c.lambert_color(kal, true);
    M {
        sciana,
        sciana_dk,
        glina,
        strzecha,
        strzecha_dk,
        strzecha_kal,
        drewno,
        drewno_dk,
        drewno_c,
        pal,
        wal_drewno,
        wal_drewno_dk,
        wal_drewno_hi,
        wal_ziemia,
        wal_ziemia_dk,
        kamien,
        kamien_dk,
        kamien_hi,
        skora,
        skora_dk,
        skora_hi,
        klepisko,
        sciezka,
        ogien,
        plomien,
        dym,
        dym_dk,
        zboze,
        czern,
        cien,
        frakcja,
        kalenica_wodza,
    }
}

const R0: [f64; 3] = [0.0; 3];

// ========================= buildings ===================================

/// `chataProsta(m, s, scianaM)` — 60 tri.
fn chata_prosta(c: &mut CityModel, m: &M, s: f64, sciana_m: Option<CityMatId>) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.20 * s, 0.145 * s, 0.165 * s],
        [0.0, 0.0725 * s, 0.0],
        sciana_m.unwrap_or(m.sciana),
    );
    c.br(
        g,
        [0.23 * s, 0.032 * s, 0.125 * s],
        [0.0, 0.168 * s, 0.052 * s],
        m.strzecha,
        [0.72, 0.0, 0.0],
    );
    c.br(
        g,
        [0.23 * s, 0.032 * s, 0.125 * s],
        [0.0, 0.168 * s, -0.052 * s],
        m.strzecha,
        [-0.72, 0.0, 0.0],
    );
    c.b(
        g,
        [0.225 * s, 0.032 * s, 0.055 * s],
        [0.0, 0.203 * s, 0.0],
        m.strzecha_kal,
    );
    c.b(
        g,
        [0.014 * s, 0.085 * s, 0.055 * s],
        [0.102 * s, 0.0425 * s, 0.0],
        m.cien,
    );
    g
}

/// `tipi(m, s)` — 58 tri.
fn tipi(c: &mut CityModel, m: &M, s: f64) -> NodeId {
    let g = c.detached_group();
    c.cone(
        g,
        0.105 * s,
        0.27 * s,
        [0.0, 0.135 * s, 0.0],
        m.skora,
        5,
        [0.0, 0.3, 0.0],
    );
    c.b(
        g,
        [0.045 * s, 0.085 * s, 0.06 * s],
        [0.088 * s, 0.04 * s, 0.0],
        m.czern,
    );
    c.br(
        g,
        [0.013 * s, 0.15 * s, 0.013 * s],
        [0.02 * s, 0.245 * s, 0.015 * s],
        m.pal,
        [0.35, 0.0, 0.2],
    );
    c.br(
        g,
        [0.013 * s, 0.15 * s, 0.013 * s],
        [-0.02 * s, 0.245 * s, -0.01 * s],
        m.pal,
        [-0.3, 0.0, -0.25],
    );
    c.br(
        g,
        [0.07 * s, 0.085 * s, 0.012 * s],
        [-0.045 * s, 0.115 * s, 0.093 * s],
        m.skora_hi,
        [0.3, -0.35, 0.0],
    );
    g
}

/// `chataOkragla(m, s)` — 72 tri.
fn chata_okragla(c: &mut CityModel, m: &M, s: f64) -> NodeId {
    let g = c.detached_group();
    c.cyl(
        g,
        0.088 * s,
        0.096 * s,
        0.035 * s,
        [0.0, 0.0175 * s, 0.0],
        m.kamien_dk,
        6,
        R0,
    );
    c.cyl(
        g,
        0.082 * s,
        0.09 * s,
        0.085 * s,
        [0.0, 0.077 * s, 0.0],
        m.glina,
        6,
        R0,
    );
    c.cone(
        g,
        0.128 * s,
        0.125 * s,
        [0.0, 0.2245 * s, 0.0],
        m.strzecha,
        6,
        [0.0, 0.26, 0.0],
    );
    c.b(
        g,
        [0.013 * s, 0.075 * s, 0.05 * s],
        [0.088 * s, 0.0375 * s, 0.0],
        m.cien,
    );
    g
}

/// `chataWodza(m, s)` — 72 tri.
fn chata_wodza(c: &mut CityModel, m: &M, s: f64) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.30 * s, 0.155 * s, 0.155 * s],
        [0.0, 0.0775 * s, 0.0],
        m.sciana,
    );
    c.br(
        g,
        [0.335 * s, 0.034 * s, 0.12 * s],
        [0.0, 0.18 * s, 0.05 * s],
        m.strzecha_dk,
        [0.72, 0.0, 0.0],
    );
    c.br(
        g,
        [0.335 * s, 0.034 * s, 0.12 * s],
        [0.0, 0.18 * s, -0.05 * s],
        m.strzecha_dk,
        [-0.72, 0.0, 0.0],
    );
    c.b(
        g,
        [0.33 * s, 0.034 * s, 0.055 * s],
        [0.0, 0.216 * s, 0.0],
        m.kalenica_wodza,
    );
    c.b(
        g,
        [0.014 * s, 0.09 * s, 0.06 * s],
        [0.152 * s, 0.045 * s, 0.0],
        m.cien,
    );
    c.br(
        g,
        [0.016 * s, 0.10 * s, 0.016 * s],
        [0.10 * s, 0.235 * s, 0.0],
        m.pal,
        [0.0, 0.0, 0.1],
    );
    g
}

/// `ognisko(m, duze)` — 100/124 tri.
fn ognisko(c: &mut CityModel, m: &M, duze: bool) -> NodeId {
    let g = c.detached_group();
    let rr = if duze { 0.062 } else { 0.052 };
    for i in 0..4u32 {
        let a = (f64::from(i) / 4.0) * PI * 2.0 + 0.5;
        let mat = if i % 2 == 1 { m.kamien } else { m.kamien_dk };
        c.br(
            g,
            [0.038, 0.03, 0.036],
            [js_cos(a) * rr, 0.015, js_sin(a) * rr],
            mat,
            [0.0, a * 0.7, 0.0],
        );
    }
    c.br(
        g,
        [0.10, 0.024, 0.026],
        [0.005, 0.02, 0.01],
        m.drewno_c,
        [0.0, 0.55, 0.0],
    );
    c.cone(
        g,
        0.042,
        0.085,
        [0.0, 0.032, 0.0],
        m.ogien,
        4,
        [0.0, 0.2, 0.0],
    );
    c.cone(
        g,
        0.024,
        0.055,
        [0.005, 0.062, 0.005],
        m.plomien,
        4,
        [0.0, 0.6, 0.0],
    );
    c.br(
        g,
        [0.046, 0.042, 0.046],
        [0.012, 0.145, 0.004],
        m.dym_dk,
        [0.2, 0.5, 0.15],
    );
    c.br(
        g,
        [0.058, 0.052, 0.058],
        [0.032, 0.215, 0.022],
        m.dym,
        [-0.15, 0.2, 0.3],
    );
    if duze {
        c.br(
            g,
            [0.05, 0.046, 0.05],
            [0.05, 0.285, 0.04],
            m.dym,
            [0.1, 0.45, -0.2],
        );
        c.br(
            g,
            [0.09, 0.022, 0.024],
            [-0.01, 0.018, -0.015],
            m.drewno_dk,
            [0.0, -0.35, 0.0],
        );
    }
    g
}

/// `totemProporzec(m, s)` — 76 tri.
fn totem_proporzec(c: &mut CityModel, m: &M, s: f64) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.042 * s, 0.34 * s, 0.042 * s],
        [0.0, 0.17 * s, 0.0],
        m.pal,
    );
    c.b(
        g,
        [0.062 * s, 0.055 * s, 0.058 * s],
        [0.0, 0.365 * s, 0.0],
        m.drewno_dk,
    );
    c.b(
        g,
        [0.052 * s, 0.045 * s, 0.05 * s],
        [0.0, 0.30 * s, 0.0],
        m.drewno_c,
    );
    c.cone(
        g,
        0.02 * s,
        0.11 * s,
        [-0.075 * s, 0.415 * s, 0.0],
        m.drewno_c,
        4,
        [0.0, 0.0, 1.15],
    );
    c.cone(
        g,
        0.02 * s,
        0.11 * s,
        [0.075 * s, 0.415 * s, 0.0],
        m.drewno_c,
        4,
        [0.0, 0.0, -1.15],
    );
    c.b(
        g,
        [0.10 * s, 0.014 * s, 0.014 * s],
        [0.0, 0.255 * s, 0.02 * s],
        m.drewno,
    );
    c.b(
        g,
        [0.015 * s, 0.13 * s, 0.10 * s],
        [0.0, 0.20 * s, 0.03 * s],
        m.frakcja,
    );
    g
}

/// `menhirMaly(m)` — 24 tri.
fn menhir_maly(c: &mut CityModel, m: &M) -> NodeId {
    let g = c.detached_group();
    c.br(
        g,
        [0.055, 0.17, 0.045],
        [0.0, 0.085, 0.0],
        m.kamien,
        [0.06, 0.4, 0.1],
    );
    c.br(
        g,
        [0.04, 0.05, 0.038],
        [0.05, 0.025, 0.02],
        m.kamien_dk,
        [0.0, 0.8, 0.0],
    );
    g
}

/// `menhirDuzy(m)` — 108 tri.
fn menhir_duzy(c: &mut CityModel, m: &M) -> NodeId {
    let g = c.detached_group();
    c.br(
        g,
        [0.11, 0.28, 0.085],
        [0.0, 0.14, 0.0],
        m.kamien_hi,
        [0.03, 0.35, 0.05],
    );
    c.br(
        g,
        [0.055, 0.16, 0.05],
        [-0.09, 0.08, 0.03],
        m.kamien,
        [-0.05, 0.9, -0.06],
    );
    c.br(
        g,
        [0.05, 0.135, 0.046],
        [0.085, 0.0675, -0.045],
        m.kamien,
        [0.04, -0.5, 0.07],
    );
    c.br(
        g,
        [0.095, 0.042, 0.065],
        [0.02, 0.021, 0.085],
        m.kamien_dk,
        [0.0, 0.3, 0.0],
    );
    let ring_r = 0.15;
    for i in 0..5u32 {
        let a = (f64::from(i) / 5.0) * PI * 2.0 + 0.35;
        let odd = f64::from(i % 2);
        let mat = if i % 2 == 1 { m.kamien_dk } else { m.kamien };
        c.br(
            g,
            [0.034, 0.07 + odd * 0.028, 0.03],
            [js_cos(a) * ring_r, 0.038 + odd * 0.012, js_sin(a) * ring_r],
            mat,
            [0.0, a, 0.0],
        );
    }
    g
}

/// `suszarniaSkor(m)` — 60 tri.
fn suszarnia_skor(c: &mut CityModel, m: &M) -> NodeId {
    let g = c.detached_group();
    c.b(g, [0.022, 0.155, 0.022], [-0.075, 0.0775, 0.0], m.pal);
    c.b(g, [0.022, 0.155, 0.022], [0.075, 0.0775, 0.0], m.pal);
    c.b(g, [0.20, 0.018, 0.018], [0.0, 0.145, 0.0], m.drewno_dk);
    c.br(
        g,
        [0.062, 0.095, 0.012],
        [-0.032, 0.095, 0.004],
        m.skora_hi,
        [0.0, 0.05, 0.08],
    );
    c.br(
        g,
        [0.056, 0.082, 0.012],
        [0.042, 0.10, -0.004],
        m.skora,
        [0.0, -0.04, -0.06],
    );
    g
}

/// `wedzarnia(m)` — 92 tri.
fn wedzarnia(c: &mut CityModel, m: &M) -> NodeId {
    let g = c.detached_group();
    c.br(
        g,
        [0.024, 0.17, 0.024],
        [-0.07, 0.085, 0.0],
        m.pal,
        [0.0, 0.0, 0.08],
    );
    c.br(
        g,
        [0.024, 0.17, 0.024],
        [0.07, 0.085, 0.0],
        m.pal,
        [0.0, 0.0, -0.08],
    );
    c.b(g, [0.19, 0.02, 0.02], [0.0, 0.158, 0.0], m.drewno_dk);
    c.br(
        g,
        [0.03, 0.06, 0.018],
        [-0.035, 0.105, 0.0],
        m.skora_dk,
        [0.0, 0.0, 0.1],
    );
    c.br(
        g,
        [0.028, 0.055, 0.018],
        [0.03, 0.108, 0.004],
        m.skora_dk,
        [0.0, 0.2, -0.08],
    );
    c.br(
        g,
        [0.05, 0.022, 0.05],
        [0.0, 0.011, 0.0],
        m.kamien_dk,
        [0.0, 0.4, 0.0],
    );
    c.cone(
        g,
        0.02,
        0.05,
        [0.0, 0.022, 0.0],
        m.plomien,
        4,
        [0.0, 0.3, 0.0],
    );
    c.br(
        g,
        [0.042, 0.05, 0.042],
        [0.008, 0.20, 0.006],
        m.dym,
        [0.2, 0.4, 0.15],
    );
    g
}

/// `spichlerz(m)` — 56 tri.
fn spichlerz(c: &mut CityModel, m: &M) -> NodeId {
    let g = c.detached_group();
    c.cyl(g, 0.092, 0.10, 0.095, [0.0, 0.0475, 0.0], m.kamien, 8, R0);
    c.cone(
        g,
        0.13,
        0.105,
        [0.0, 0.20, 0.0],
        m.strzecha_dk,
        6,
        [0.0, 0.2, 0.0],
    );
    c.b(g, [0.013, 0.06, 0.045], [0.096, 0.03, 0.0], m.cien);
    g
}

/// `kosze(m)` — 24 tri.
fn kosze(c: &mut CityModel, m: &M) -> NodeId {
    let g = c.detached_group();
    c.br(
        g,
        [0.045, 0.04, 0.045],
        [0.0, 0.02, 0.0],
        m.drewno_dk,
        [0.0, 0.3, 0.0],
    );
    c.br(
        g,
        [0.036, 0.03, 0.036],
        [0.001, 0.052, 0.002],
        m.zboze,
        [0.0, 0.1, 0.0],
    );
    g
}

// ========================= wall ========================================

/// `naZewnatrz(azDeg, lean)` (`miasto-kamien.ts:345-348`).
fn na_zewnatrz(az_deg: f64, lean: f64) -> (f64, f64) {
    let rad = (az_deg * PI) / 180.0;
    (-lean * js_cos(rad), -lean * js_sin(rad))
}

/// JavaScript `%` on non-negative integers held in doubles.
fn modf(a: f64, b: f64) -> f64 {
    a % b
}

/// `wal(m, r)` (`miasto-kamien.ts:369-437`): Biskupin palisade.
#[allow(clippy::too_many_lines)]
pub(crate) fn wal(c: &mut CityModel, m: &M, r: f64) -> NodeId {
    let g = c.detached_group();
    let gap_od = 72.0;
    let gap_do = 108.0;
    let n = js_max(20.0, js_round(r * 64.0));
    let r_skarpy = r * 0.90;
    let r_sciany = r * 0.98;
    let y_stopa = 0.055;
    let y_korona = 0.24;

    // 1. SKARPA
    let mut i = 0.0;
    while i < n {
        let az = (i / n) * 360.0;
        if !(az > gap_od - 8.0 && az < gap_do + 8.0) {
            let (x, z) = az_xz(az, r_skarpy);
            let seg_w = ((2.0 * PI * r_skarpy) / n) * 1.15;
            let rozjazd = 0.10 * (modf(i * 13.0, 3.0) - 1.0);
            let mat = if modf(i, 2.0) != 0.0 {
                m.wal_ziemia
            } else {
                m.wal_ziemia_dk
            };
            c.br(
                g,
                [seg_w, y_stopa, 0.14],
                [x, y_stopa / 2.0, z],
                mat,
                [0.0, tang_rot_y(az) + rozjazd, 0.0],
            );
            let zerdz_h = 0.09 + 0.03 * modf(i * 17.0, 4.0) / 3.0;
            let (zx, zz) = az_xz(az, r_skarpy + 0.058);
            let (zrx, zrz) = na_zewnatrz(az, 0.28);
            c.br(
                g,
                [0.022, zerdz_h, 0.022],
                [zx, y_stopa * 0.7 + zerdz_h / 2.0, zz],
                m.wal_drewno_dk,
                [zrx, tang_rot_y(az), zrz],
            );
        }
        i += 1.0;
    }

    // 2. SCIANA
    let mut i = 0.0;
    while i < n {
        let az = (i / n) * 360.0;
        if az > gap_od - 5.0 && az < gap_do + 5.0 {
            i += 1.0;
            continue;
        }
        let (x, z) = az_xz(az, r_sciany);
        let pal_h = 0.19 + 0.04 * modf(i * 23.0, 5.0) / 4.0;
        let mat = if modf(i, 3.0) != 0.0 {
            m.wal_drewno
        } else {
            m.wal_drewno_dk
        };
        c.br(
            g,
            [0.028, pal_h, 0.028],
            [x, y_stopa + pal_h / 2.0, z],
            mat,
            [0.0, tang_rot_y(az), 0.0],
        );
        if modf(i, 2.0) != 0.0 {
            i += 1.0;
            continue;
        }
        let az_do = ((i + 1.0) / n) * 360.0;
        if az_do > gap_od - 5.0 && az_do < gap_do + 5.0 {
            i += 1.0;
            continue;
        }
        let (p2x, p2z) = az_xz(az_do, r_sciany);
        let dx = p2x - x;
        let dz = p2z - z;
        let len = js_hypot(dx, dz) * 1.02;
        let ang = crate::jsmath::js_atan2(dx, dz);
        for dy in [0.085, 0.135, 0.185] {
            c.br(
                g,
                [0.024, 0.022, len],
                [(x + p2x) / 2.0, y_stopa + dy, (z + p2z) / 2.0],
                m.wal_drewno_hi,
                [0.0, ang, 0.0],
            );
        }
        i += 1.0;
    }

    // 3. KORONA
    let mut i = 0.0;
    while i < n {
        let az = (i / n) * 360.0;
        if !(az > gap_od - 6.0 && az < gap_do + 6.0) {
            let (x, z) = az_xz(az, r_sciany);
            let ostrze_h = 0.12 + 0.10 * modf(i * 41.0, 7.0) / 6.0;
            let przechyl = 0.08 * (modf(i * 13.0, 3.0) - 1.0);
            let (krx, krz) = na_zewnatrz(az, przechyl);
            let mat = if modf(i, 2.0) != 0.0 {
                m.wal_drewno_hi
            } else {
                m.wal_drewno
            };
            c.br(
                g,
                [0.020, ostrze_h, 0.020],
                [x, y_korona + ostrze_h / 2.0, z],
                mat,
                [krx, tang_rot_y(az), krz],
            );
        }
        i += 1.0;
    }

    // 4. BRAMA
    let (b1x, b1z) = az_xz(gap_od, r_sciany);
    let (b2x, b2z) = az_xz(gap_do, r_sciany);
    c.b(
        g,
        [0.05, 0.26, 0.05],
        [b1x, y_stopa + 0.13, b1z],
        m.wal_drewno_dk,
    );
    c.b(
        g,
        [0.05, 0.26, 0.05],
        [b2x, y_stopa + 0.13, b2z],
        m.wal_drewno_dk,
    );
    let cieciwa = js_hypot(b2x - b1x, b2z - b1z);
    c.br(
        g,
        [0.05, 0.04, cieciwa + 0.06],
        [(b1x + b2x) / 2.0, y_stopa + 0.28, (b1z + b2z) / 2.0],
        m.wal_drewno_hi,
        [0.0, crate::jsmath::js_atan2(b2x - b1x, b2z - b1z), 0.0],
    );
    c.br(
        g,
        [0.055, 0.036, 0.05],
        [b1x + 0.008, 0.018, b1z + 0.05],
        m.kamien,
        [0.0, 0.5, 0.0],
    );
    c.br(
        g,
        [0.05, 0.032, 0.046],
        [b2x + 0.01, 0.016, b2z - 0.046],
        m.kamien_dk,
        [0.0, -0.4, 0.0],
    );
    g
}

// ========================= compositions ================================

/// `placIsciezki(g, m, rozmiar)` (`miasto-kamien.ts:458-483`).
fn plac_i_sciezki(c: &mut CityModel, g: NodeId, m: &M, rz: Rozmiar) {
    match rz {
        Rozmiar::Male => {
            c.plac(g, 0.145, 6, [0.015, 0.011, 0.02], m.klepisko);
            c.br(
                g,
                [0.17, 0.01, 0.07],
                [0.24, 0.005, 0.05],
                m.sciezka,
                [0.0, 0.25, 0.0],
            );
        }
        Rozmiar::Srednie => {
            c.plac(g, 0.17, 6, [0.02, 0.011, 0.03], m.klepisko);
            c.br(
                g,
                [0.20, 0.01, 0.075],
                [0.27, 0.005, 0.05],
                m.sciezka,
                [0.0, 0.22, 0.0],
            );
            c.br(
                g,
                [0.18, 0.01, 0.065],
                [-0.25, 0.005, -0.13],
                m.sciezka,
                [0.0, -0.5, 0.0],
            );
        }
        Rozmiar::Duze => {
            c.plac(g, 0.155, 6, [0.12, 0.011, 0.10], m.klepisko);
            c.b(g, [0.76, 0.01, 0.085], [0.03, 0.005, 0.02], m.sciezka);
            c.b(g, [0.075, 0.01, 0.60], [0.05, 0.0052, -0.04], m.sciezka);
        }
    }
}

/// `skladFazaMala(g, m, L)` (`miasto-kamien.ts:487-505`).
fn sklad_faza_mala(c: &mut CityModel, g: NodeId, m: &M, l: f64) {
    let ogn = ognisko(c, m, false);
    c.set_pos(ogn, 0.015, 0.012, 0.02);
    c.attach(g, ogn);
    let o = tipi(c, m, 1.0);
    c.put(g, o, 213.0, 0.22, ku_srodkowi_az(213.0, 0.22) + 0.15);
    if l >= 2.0 {
        let o = chata_prosta(c, m, 0.95, None);
        c.put(g, o, 318.0, 0.235, ku_srodkowi_az(318.0, 0.235) - 0.1);
        let o = suszarnia_skor(c, m);
        c.put(g, o, 152.0, 0.26, tang_rot_y(152.0));
    }
    if l >= 3.0 {
        let o = chata_okragla(c, m, 0.9);
        c.put(g, o, 96.0, 0.23, ku_srodkowi_az(96.0, 0.23));
        let o = totem_proporzec(c, m, 0.92);
        c.put(g, o, 48.0, 0.20, -1.2);
        let o = menhir_maly(c, m);
        c.put(g, o, 263.0, 0.285, 0.4);
    }
}

/// `skladFazaSrednia(g, m, L)` (`miasto-kamien.ts:510-534`).
fn sklad_faza_srednia(c: &mut CityModel, g: NodeId, m: &M, l: f64) {
    let ogn = ognisko(c, m, false);
    c.set_pos(ogn, 0.02, 0.012, 0.03);
    c.attach(g, ogn);
    let o = chata_wodza(c, m, 1.0);
    c.put(g, o, 285.0, 0.235, tang_rot_y(285.0) + 0.08);
    let o = tipi(c, m, 0.9);
    c.put(g, o, 207.0, 0.26, ku_srodkowi_az(207.0, 0.26) + 0.2);
    let o = chata_prosta(c, m, 0.95, None);
    c.put(g, o, 338.0, 0.27, ku_srodkowi_az(338.0, 0.27) - 0.12);
    let o = chata_okragla(c, m, 0.95);
    c.put(g, o, 63.0, 0.26, ku_srodkowi_az(63.0, 0.26));
    let o = totem_proporzec(c, m, 1.0);
    c.put(g, o, 99.0, 0.235, -1.3);
    let o = suszarnia_skor(c, m);
    c.put(g, o, 20.0, 0.28, tang_rot_y(20.0));
    if l >= 5.0 {
        let o = spichlerz(c, m);
        let (x, z) = az_xz(310.0, 0.27);
        c.put(g, o, 310.0, 0.27, ku_srodkowi(x, z));
        let o = kosze(c, m);
        c.put(g, o, 322.0, 0.19, 0.5);
    }
    if l >= 6.0 {
        let o = chata_prosta(c, m, 0.9, Some(m.sciana_dk));
        c.put(g, o, 163.0, 0.27, ku_srodkowi_az(163.0, 0.27) + 0.15);
        let o = wedzarnia(c, m);
        c.put(g, o, 243.0, 0.27, tang_rot_y(243.0));
        let o = menhir_maly(c, m);
        c.put(g, o, 132.0, 0.30, 1.2);
    }
}

/// `skladFazaDuza(g, m, L)` (`miasto-kamien.ts:539-578`).
fn sklad_faza_duza(c: &mut CityModel, g: NodeId, m: &M, l: f64) {
    let men = menhir_duzy(c, m);
    c.set_pos(men, -0.05, 0.0, -0.05);
    c.set_rot_y(men, 0.3);
    c.attach(g, men);

    let ogn = ognisko(c, m, true);
    c.set_pos(ogn, 0.17, 0.012, 0.13);
    c.attach(g, ogn);

    let o = chata_wodza(c, m, 0.95);
    c.put(g, o, 232.0, 0.245, tang_rot_y(232.0) + 0.06);
    let o = spichlerz(c, m);
    c.put(g, o, 197.0, 0.295, ku_srodkowi_az(197.0, 0.295));
    let o = kosze(c, m);
    c.put(g, o, 207.0, 0.20, 0.9);
    let o = chata_prosta(c, m, 0.95, None);
    c.put(g, o, 300.0, 0.29, ku_srodkowi_az(300.0, 0.29) - 0.1);
    let o = chata_okragla(c, m, 0.9);
    c.put(g, o, 138.0, 0.29, ku_srodkowi_az(138.0, 0.29));
    let o = tipi(c, m, 0.85);
    c.put(g, o, 167.0, 0.295, ku_srodkowi_az(167.0, 0.295) - 0.2);
    let o = wedzarnia(c, m);
    c.put(g, o, 126.0, 0.30, tang_rot_y(126.0));
    let o = totem_proporzec(c, m, 1.05);
    c.put(g, o, 107.0, 0.30, -1.25);
    let o = suszarnia_skor(c, m);
    c.put(g, o, 55.0, 0.31, tang_rot_y(55.0) + 0.2);
    if l >= 8.0 {
        let o = chata_prosta(c, m, 0.9, None);
        c.put(g, o, 30.0, 0.295, ku_srodkowi_az(30.0, 0.295) + 0.1);
    }
    if l >= 9.0 {
        let o = chata_okragla(c, m, 0.9);
        c.put(g, o, 2.0, 0.285, ku_srodkowi_az(2.0, 0.285));
    }
    if l >= 10.0 {
        let o = chata_prosta(c, m, 0.9, Some(m.sciana_dk));
        c.put(g, o, 332.0, 0.295, ku_srodkowi_az(332.0, 0.295) + 0.12);
    }
}

// ========================= API =========================================

/// `buildMiastoKamien(poziom = 10, opts = {})` (`miasto-kamien.ts:610-633`):
/// root group with one child scaled `1 / 1.38` holding the composition (and
/// the wall when `opts.mur`).
#[must_use]
pub fn build_miasto_kamien(poziom: Poziom, opts: MiastoKamienOpts) -> CityModel {
    let l = poziom_z_argumentu(poziom);
    let rz = rozmiar_of_clamped(l);
    let mut c = CityModel::new();
    let m = make_mats(&mut c, opts.color.unwrap_or(MIASTO_KAMIEN_DEFAULT_COLOR));

    let inner = c.detached_group();
    plac_i_sciezki(&mut c, inner, &m, rz);
    match rz {
        Rozmiar::Male => sklad_faza_mala(&mut c, inner, &m, l),
        Rozmiar::Srednie => sklad_faza_srednia(&mut c, inner, &m, l),
        Rozmiar::Duze => sklad_faza_duza(&mut c, inner, &m, l),
    }
    if opts.mur {
        let w = wal(&mut c, &m, os_walu(rz));
        c.attach(inner, w);
    }
    c.set_scale_scalar(inner, 1.0 / MIASTO_KAMIEN_CITY_MODEL_SCALE);
    c.attach(ROOT, inner);
    c.user_data = CityUserData {
        model: Some("miasto-kamien"),
        poziom: Some(l),
        rozmiar: Some(rz),
    };
    c
}

/// `buildPalisadaWal(rozmiar, color)` (`miasto-kamien.ts:636-642`): a fresh
/// stone-age palette (`makeMats(color ?? default)`) and the Biskupin wall,
/// returned as a detached group of `c`.
pub fn build_palisada_wal(c: &mut CityModel, rozmiar: Rozmiar, color: Option<u32>) -> NodeId {
    let m = make_mats(c, color.unwrap_or(MIASTO_KAMIEN_DEFAULT_COLOR));
    wal(c, &m, os_walu(rozmiar))
}

/// The wall alone in its own model (root → wall group), for tests and
/// previews.
#[must_use]
pub fn build_palisada_wal_model(rozmiar: Rozmiar, color: Option<u32>) -> CityModel {
    let mut c = CityModel::new();
    let w = build_palisada_wal(&mut c, rozmiar, color);
    c.attach(ROOT, w);
    c
}
