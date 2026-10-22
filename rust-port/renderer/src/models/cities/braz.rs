//! `render/miasto-braz.ts` (web `edb8fb56`, 905 LOC): the bronze-age cities
//! of the live map path (era ≥ 2, `roblox` style): Greece (Mycenaean) and
//! Rome (Villanovan), 10 levels each, Cyclopean wall / agger, or the shared
//! Biskupin palisade. Every other civilisation gets the Greek set
//! (`buildMiastoBraz`, `:866-873`; D-MOD-4 = C → new sets are topic P4.7).

use std::f64::consts::PI;

use super::kamien::{build_palisada_wal, poziom_z_argumentu, rozmiar_of_clamped, Poziom};
use super::kit::{az_xz, ku_srodkowi_az, tang_rot_y};
use super::model::{CityMatId, CityModel, CityUserData, Rozmiar};
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{NodeId, ROOT};
use crate::terrain::color::Color;

/// `MIASTO_BRAZ_CITY_MODEL_SCALE` (`miasto-braz.ts:99`).
pub const MIASTO_BRAZ_CITY_MODEL_SCALE: f64 = 1.38;
/// `MIASTO_BRAZ_DEFAULT_COLOR` (`miasto-braz.ts:101`).
pub const MIASTO_BRAZ_DEFAULT_COLOR: u32 = 0x00ff_d54a;

/// `MIASTO_BRAZ_LAYOUT.triPoziomy.grecja` (`miasto-braz.ts:882`).
pub const TRI_POZIOMY_GRECJA: [u32; 10] = [190, 258, 418, 474, 602, 710, 746, 850, 886, 922];
/// `MIASTO_BRAZ_LAYOUT.triPoziomy.rzym` (`miasto-braz.ts:883`).
pub const TRI_POZIOMY_RZYM: [u32; 10] = [196, 298, 522, 622, 682, 778, 838, 898, 922, 1018];

/// `MiastoBrazOpts` (`miasto-braz.ts:89-96`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct MiastoBrazOpts {
    /// Stone wall (Greece: Cyclopean; Rome: agger). Wins over `palisada`.
    pub mur: bool,
    /// Biskupin palisade (used only when `mur` is false).
    pub palisada: bool,
    /// Owner colour (`None` = `MIASTO_BRAZ_DEFAULT_COLOR`).
    pub color: Option<u32>,
}

/// `CywBrazu` (`miasto-braz.ts:860`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CywBrazu {
    /// `'grecja'` (also every civ without its own set).
    Grecja,
    /// `'rzym'`.
    Rzym,
}

/// `OS_MURU[rozmiar]` (`miasto-braz.ts:809`).
const fn os_muru(rz: Rozmiar) -> f64 {
    match rz {
        Rozmiar::Male => 0.37,
        Rozmiar::Srednie => 0.42,
        Rozmiar::Duze => 0.445,
    }
}

const R0: [f64; 3] = [0.0; 3];

impl CityModel {
    /// `PRISM_X(g, r, len, cx, cy, cz, m)`: `CYL(…, 3, -π/2, 0, π/2)`.
    fn prism_x(&mut self, g: NodeId, r: f64, len: f64, c: [f64; 3], m: CityMatId) -> NodeId {
        self.cyl(g, r, r, len, c, m, 3, [-PI / 2.0, 0.0, PI / 2.0])
    }

    /// `PRISM_Z(g, r, len, cx, cy, cz, m)`: `CYL(…, 3, -π/2, 0, 0)`.
    fn prism_z(&mut self, g: NodeId, r: f64, len: f64, c: [f64; 3], m: CityMatId) -> NodeId {
        self.cyl(g, r, r, len, c, m, 3, [-PI / 2.0, 0.0, 0.0])
    }
}

// ========================= GRECJA ======================================

/// Greek palette `PG` as materials (`interface MG`, `miasto-braz.ts:199-227`;
/// `terakDk` and `cien` are created but never drawn).
#[derive(Debug, Clone, Copy)]
struct Mg {
    biel: CityMatId,
    biel_dk: CityMatId,
    marmur: CityMatId,
    terak: CityMatId,
    terak_jasna: CityMatId,
    kamien: CityMatId,
    kamien_dk: CityMatId,
    kamien_hi: CityMatId,
    minoan: CityMatId,
    morze: CityMatId,
    oliwa: CityMatId,
    oliwa_dk: CityMatId,
    pien: CityMatId,
    glina: CityMatId,
    glina_dk: CityMatId,
    drewno: CityMatId,
    drewno_dk: CityMatId,
    klepisko: CityMatId,
    sciezka: CityMatId,
    plomien: CityMatId,
    czern: CityMatId,
    frakcja: CityMatId,
    kalenica: CityMatId,
}

/// `makeMatsG(color)`.
fn make_mats_g(c: &mut CityModel, color: u32) -> Mg {
    let kal = Color::from_hex(0x00a8_583a).lerp(Color::from_hex(color & 0x00ff_ffff), 0.40);
    let mut mat = |hex: u32| c.lambert(hex, true);
    let biel = mat(0x00f6_f1e4);
    let biel_dk = mat(0x00e4_dcc8);
    let marmur = mat(0x00ef_e7d2);
    let terak = mat(0x00c9_6f45);
    let _terak_dk = mat(0x00a8_583a);
    let terak_jasna = mat(0x00d8_a06a);
    let kamien = mat(0x009a_a5b1);
    let kamien_dk = mat(0x0071_7d89);
    let kamien_hi = mat(0x00b7_c0c8);
    let minoan = mat(0x00b0_4a35);
    let morze = mat(0x003f_7fae);
    let oliwa = mat(0x009f_b886);
    let oliwa_dk = mat(0x007f_9a6a);
    let pien = mat(0x008a_6a42);
    let glina = mat(0x00cc_8050);
    let glina_dk = mat(0x00a5_643c);
    let drewno = mat(0x00a9_7b4a);
    let drewno_dk = mat(0x007c_5530);
    let klepisko = mat(0x00bf_a678);
    let sciezka = mat(0x00cf_b078);
    let plomien = mat(0x00ff_c02e);
    let czern = mat(0x0014_100b);
    let _cien = mat(0x004a_3a26);
    let frakcja = mat(color & 0x00ff_ffff);
    let kalenica = c.lambert_color(kal, true);
    Mg {
        biel,
        biel_dk,
        marmur,
        terak,
        terak_jasna,
        kamien,
        kamien_dk,
        kamien_hi,
        minoan,
        morze,
        oliwa,
        oliwa_dk,
        pien,
        glina,
        glina_dk,
        drewno,
        drewno_dk,
        klepisko,
        sciezka,
        plomien,
        czern,
        frakcja,
        kalenica,
    }
}

/// `domGrecki(m, s, pietro, scianaM)` — 36/72 tri.
fn dom_grecki(
    c: &mut CityModel,
    m: &Mg,
    s: f64,
    pietro: bool,
    sciana_m: Option<CityMatId>,
) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.155 * s, 0.115 * s, 0.135 * s],
        [0.0, 0.0575 * s, 0.0],
        sciana_m.unwrap_or(m.biel),
    );
    c.b(
        g,
        [0.132 * s, 0.022 * s, 0.112 * s],
        [0.0, 0.124 * s, 0.0],
        m.terak_jasna,
    );
    c.b(
        g,
        [0.013 * s, 0.068 * s, 0.046 * s],
        [0.0785 * s, 0.034 * s, 0.0],
        m.morze,
    );
    if pietro {
        c.b(
            g,
            [0.098 * s, 0.078 * s, 0.092 * s],
            [-0.022 * s, 0.178 * s, 0.012 * s],
            m.biel,
        );
        c.b(
            g,
            [0.082 * s, 0.018 * s, 0.076 * s],
            [-0.022 * s, 0.224 * s, 0.012 * s],
            m.terak_jasna,
        );
        c.b(
            g,
            [0.011 * s, 0.032 * s, 0.028 * s],
            [0.028 * s, 0.19 * s, 0.012 * s],
            m.morze,
        );
    }
    g
}

/// `megaron(m, s, kolumny)` — 172/212 tri.
fn megaron(c: &mut CityModel, m: &Mg, s: f64, kolumny4: bool) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.30 * s, 0.03 * s, 0.21 * s],
        [0.0, 0.015 * s, 0.0],
        m.kamien,
    );
    c.b(
        g,
        [0.20 * s, 0.135 * s, 0.175 * s],
        [-0.035 * s, 0.0975 * s, 0.0],
        m.biel,
    );
    c.b(
        g,
        [0.10 * s, 0.10 * s, 0.018 * s],
        [0.065 * s, 0.08 * s, 0.078 * s],
        m.biel,
    );
    c.b(
        g,
        [0.10 * s, 0.10 * s, 0.018 * s],
        [0.065 * s, 0.08 * s, -0.078 * s],
        m.biel,
    );
    let zs: &[f64] = if kolumny4 {
        &[-0.075, -0.026, 0.026, 0.075]
    } else {
        &[-0.05, 0.05]
    };
    for &z in zs {
        c.cyl(
            g,
            0.0155 * s,
            0.019 * s,
            0.095 * s,
            [0.105 * s, 0.0775 * s, z * s],
            m.minoan,
            5,
            R0,
        );
    }
    c.b(
        g,
        [0.06 * s, 0.022 * s, 0.19 * s],
        [0.105 * s, 0.136 * s, 0.0],
        m.drewno,
    );
    c.br(
        g,
        [0.27 * s, 0.026 * s, 0.108 * s],
        [-0.02 * s, 0.192 * s, 0.048 * s],
        m.terak,
        [0.60, 0.0, 0.0],
    );
    c.br(
        g,
        [0.27 * s, 0.026 * s, 0.108 * s],
        [-0.02 * s, 0.192 * s, -0.048 * s],
        m.terak,
        [-0.60, 0.0, 0.0],
    );
    c.b(
        g,
        [0.27 * s, 0.026 * s, 0.048 * s],
        [-0.02 * s, 0.216 * s, 0.0],
        m.kalenica,
    );
    c.b(
        g,
        [0.013 * s, 0.075 * s, 0.05 * s],
        [0.066 * s, 0.0675 * s, 0.0],
        m.czern,
    );
    c.b(
        g,
        [0.013 * s, 0.14 * s, 0.013 * s],
        [-0.09 * s, 0.27 * s, 0.0],
        m.drewno_dk,
    );
    c.b(
        g,
        [0.011 * s, 0.085 * s, 0.065 * s],
        [-0.09 * s, 0.285 * s, 0.038 * s],
        m.frakcja,
    );
    g
}

/// `swiatyniaMykenska(m, s)` — 200 tri.
fn swiatynia_mykenska(c: &mut CityModel, m: &Mg, s: f64) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.345 * s, 0.026 * s, 0.245 * s],
        [-0.03 * s, 0.013 * s, 0.0],
        m.kamien_hi,
    );
    c.b(
        g,
        [0.315 * s, 0.026 * s, 0.22 * s],
        [-0.03 * s, 0.039 * s, 0.0],
        m.marmur,
    );
    c.b(
        g,
        [0.19 * s, 0.13 * s, 0.165 * s],
        [-0.075 * s, 0.117 * s, 0.0],
        m.biel,
    );
    for z in [-0.075, -0.026, 0.026, 0.075] {
        c.cyl(
            g,
            0.016 * s,
            0.0195 * s,
            0.108 * s,
            [0.075 * s, 0.106 * s, z * s],
            m.marmur,
            5,
            R0,
        );
    }
    c.b(
        g,
        [0.075 * s, 0.024 * s, 0.205 * s],
        [0.075 * s, 0.172 * s, 0.0],
        m.marmur,
    );
    c.prism_x(g, 0.098 * s, 0.37 * s, [-0.03 * s, 0.231 * s, 0.0], m.terak);
    c.b(
        g,
        [0.37 * s, 0.02 * s, 0.045 * s],
        [-0.03 * s, 0.332 * s, 0.0],
        m.kalenica,
    );
    c.prism_x(
        g,
        0.080 * s,
        0.026 * s,
        [0.168 * s, 0.231 * s, 0.0],
        m.marmur,
    );
    c.b(
        g,
        [0.013 * s, 0.078 * s, 0.05 * s],
        [0.021 * s, 0.091 * s, 0.0],
        m.czern,
    );
    c.b(
        g,
        [0.013 * s, 0.15 * s, 0.013 * s],
        [-0.155 * s, 0.39 * s, 0.0],
        m.drewno_dk,
    );
    c.b(
        g,
        [0.011 * s, 0.09 * s, 0.068 * s],
        [-0.155 * s, 0.405 * s, 0.04 * s],
        m.frakcja,
    );
    g
}

/// `stoa(m, s)` — 84 tri.
fn stoa(c: &mut CityModel, m: &Mg, s: f64) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.26 * s, 0.02 * s, 0.095 * s],
        [0.0, 0.01 * s, 0.0],
        m.kamien,
    );
    c.b(
        g,
        [0.26 * s, 0.088 * s, 0.02 * s],
        [0.0, 0.064 * s, -0.036 * s],
        m.biel,
    );
    for x in [-0.10, 0.0, 0.10] {
        c.cyl(
            g,
            0.011 * s,
            0.013 * s,
            0.078 * s,
            [x * s, 0.059 * s, 0.03 * s],
            m.marmur,
            4,
            R0,
        );
    }
    c.br(
        g,
        [0.28 * s, 0.02 * s, 0.115 * s],
        [0.0, 0.112 * s, 0.002 * s],
        m.terak,
        [0.12, 0.0, 0.0],
    );
    g
}

/// `amfora(m, s, ciemna)` — 32 tri.
fn amfora(c: &mut CityModel, m: &Mg, s: f64, ciemna: bool) -> NodeId {
    let g = c.detached_group();
    let (a, b) = if ciemna {
        (m.glina_dk, m.glina)
    } else {
        (m.glina, m.glina_dk)
    };
    c.cyl(
        g,
        0.011 * s,
        0.0195 * s,
        0.052 * s,
        [0.0, 0.026 * s, 0.0],
        a,
        5,
        R0,
    );
    c.b(
        g,
        [0.015 * s, 0.017 * s, 0.015 * s],
        [0.0, 0.06 * s, 0.0],
        b,
    );
    g
}

/// `oliwka(m, s)` — 36 tri.
fn oliwka(c: &mut CityModel, m: &Mg, s: f64) -> NodeId {
    let g = c.detached_group();
    c.br(
        g,
        [0.017 * s, 0.075 * s, 0.017 * s],
        [0.0, 0.0375 * s, 0.0],
        m.pien,
        [0.0, 0.0, 0.15],
    );
    c.br(
        g,
        [0.075 * s, 0.05 * s, 0.07 * s],
        [0.008 * s, 0.092 * s, 0.0],
        m.oliwa,
        [0.0, 0.5, 0.1],
    );
    c.br(
        g,
        [0.05 * s, 0.04 * s, 0.048 * s],
        [-0.012 * s, 0.124 * s, 0.008 * s],
        m.oliwa_dk,
        [0.2, 0.2, 0.0],
    );
    g
}

/// `studniaGr(m)` — 60 tri.
fn studnia_gr(c: &mut CityModel, m: &Mg) -> NodeId {
    let g = c.detached_group();
    c.cyl(g, 0.032, 0.036, 0.04, [0.0, 0.02, 0.0], m.kamien, 6, R0);
    c.b(g, [0.011, 0.085, 0.011], [-0.03, 0.0425, 0.0], m.drewno);
    c.b(g, [0.011, 0.085, 0.011], [0.03, 0.0425, 0.0], m.drewno);
    c.b(g, [0.085, 0.014, 0.06], [0.0, 0.092, 0.0], m.terak);
    g
}

/// `oltarz(m)` — 20 tri.
fn oltarz(c: &mut CityModel, m: &Mg) -> NodeId {
    let g = c.detached_group();
    c.b(g, [0.05, 0.035, 0.042], [0.0, 0.0175, 0.0], m.kamien_hi);
    c.cone(g, 0.014, 0.035, [0.0, 0.052, 0.0], m.plomien, 4, R0);
    g
}

/// `gates(az)` of the bronze walls: `az > 58 && az < 122`.
fn gates(az: f64) -> bool {
    az > 58.0 && az < 122.0
}

/// `murCyklopowy(m, r)` (`miasto-braz.ts:334-359`) — 324 tri.
fn mur_cyklopowy(c: &mut CityModel, m: &Mg, r: f64) -> NodeId {
    let g = c.detached_group();
    let picks = [m.kamien, m.kamien_dk, m.kamien_hi];
    for i in 0..20u32 {
        let fi = f64::from(i);
        let az = fi * 18.0 + 4.0;
        if gates(az % 360.0) {
            continue;
        }
        let (x, z) = az_xz(az, r);
        let h = 0.09 + 0.035 * f64::from((i * 31) % 3) / 2.0;
        c.br(
            g,
            [0.112, h, 0.070],
            [x, h / 2.0, z],
            picks[(i % 3) as usize],
            [
                (f64::from((i * 13) % 5) - 2.0) * 0.025,
                tang_rot_y(az),
                (f64::from((i * 7) % 3) - 1.0) * 0.03,
            ],
        );
    }
    for i in 0..8u32 {
        let az = f64::from(i) * 45.0 + 22.5;
        if gates(az) {
            continue;
        }
        let (x, z) = az_xz(az, r * 0.995);
        c.br(
            g,
            [0.082, 0.06, 0.062],
            [x, 0.128, z],
            picks[((i + 1) % 3) as usize],
            [0.0, tang_rot_y(az), f64::from(i % 2) * 0.05 - 0.025],
        );
    }
    let (b1x, b1z) = az_xz(70.0, r);
    let (b2x, b2z) = az_xz(110.0, r);
    c.br(
        g,
        [0.052, 0.16, 0.066],
        [b1x, 0.08, b1z],
        m.kamien_dk,
        [0.0, tang_rot_y(70.0), 0.0],
    );
    c.br(
        g,
        [0.052, 0.16, 0.066],
        [b2x, 0.08, b2z],
        m.kamien_dk,
        [0.0, tang_rot_y(110.0), 0.0],
    );
    let mx = (b1x + b2x) / 2.0;
    c.b(
        g,
        [0.068, 0.042, (b2z - b1z).abs() + 0.02],
        [mx, 0.181, 0.0],
        m.kamien_hi,
    );
    c.prism_z(g, 0.052, 0.10, [mx - 0.002, 0.228, 0.0], m.kamien);
    g
}

/// `placGrecki(g, m, rozmiar)`.
fn plac_grecki(c: &mut CityModel, g: NodeId, m: &Mg, rz: Rozmiar) {
    match rz {
        Rozmiar::Male => {
            c.plac(g, 0.135, 6, [0.13, 0.011, 0.02], m.klepisko);
            c.b(g, [0.16, 0.01, 0.07], [0.27, 0.005, 0.02], m.sciezka);
        }
        Rozmiar::Srednie => {
            c.plac(g, 0.15, 6, [0.14, 0.011, 0.03], m.klepisko);
            c.b(g, [0.18, 0.01, 0.075], [0.28, 0.005, 0.03], m.sciezka);
            c.br(
                g,
                [0.17, 0.01, 0.065],
                [-0.24, 0.005, 0.15],
                m.sciezka,
                [0.0, 0.6, 0.0],
            );
        }
        Rozmiar::Duze => {
            c.plac(g, 0.15, 6, [0.14, 0.011, 0.06], m.klepisko);
            c.b(g, [0.72, 0.01, 0.08], [0.05, 0.005, 0.03], m.sciezka);
            c.b(g, [0.07, 0.01, 0.55], [0.09, 0.0052, -0.02], m.sciezka);
        }
    }
}

/// `skladFazaMalaG(g, m, L)`.
fn sklad_faza_mala_g(c: &mut CityModel, g: NodeId, m: &Mg, l: f64) {
    let meg = megaron(c, m, 1.0, false);
    c.set_pos(meg, -0.09, 0.0, 0.0);
    c.attach(g, meg);
    if l >= 2.0 {
        let o = dom_grecki(c, m, 1.0, false, None);
        c.put(g, o, 322.0, 0.245, ku_srodkowi_az(322.0, 0.245));
        let o = amfora(c, m, 1.0, false);
        c.put(g, o, 126.0, 0.185, 0.3);
    }
    if l >= 3.0 {
        let o = dom_grecki(c, m, 0.95, false, None);
        c.put(g, o, 38.0, 0.25, ku_srodkowi_az(38.0, 0.25) - 0.1);
        let o = dom_grecki(c, m, 0.92, false, Some(m.biel_dk));
        c.put(g, o, 205.0, 0.245, ku_srodkowi_az(205.0, 0.245) + 0.1);
        let o = amfora(c, m, 0.9, true);
        c.put(g, o, 118.0, 0.155, 1.1);
        let o = oliwka(c, m, 1.0);
        c.put(g, o, 258.0, 0.29, 0.4);
        let o = oltarz(c, m);
        c.put(g, o, 68.0, 0.20, 0.5);
    }
}

/// `skladFazaSredniaG(g, m, L)`.
fn sklad_faza_srednia_g(c: &mut CityModel, g: NodeId, m: &Mg, l: f64) {
    let meg = megaron(c, m, 1.12, true);
    c.set_pos(meg, -0.10, 0.0, -0.02);
    c.attach(g, meg);
    let o = dom_grecki(c, m, 1.0, true, None);
    c.put(g, o, 318.0, 0.27, ku_srodkowi_az(318.0, 0.27));
    let o = dom_grecki(c, m, 0.95, false, None);
    c.put(g, o, 352.0, 0.275, ku_srodkowi_az(352.0, 0.275) + 0.12);
    let o = dom_grecki(c, m, 0.92, false, Some(m.biel_dk));
    c.put(g, o, 152.0, 0.27, ku_srodkowi_az(152.0, 0.27));
    let o = amfora(c, m, 1.0, false);
    c.put(g, o, 122.0, 0.20, 0.5);
    let o = oliwka(c, m, 1.0);
    c.put(g, o, 252.0, 0.305, 0.2);
    let o = oltarz(c, m);
    c.put(g, o, 335.0, 0.175, 0.2);
    if l >= 5.0 {
        let o = studnia_gr(c, m);
        c.put(g, o, 100.0, 0.235, tang_rot_y(100.0));
        let o = dom_grecki(c, m, 0.95, false, None);
        c.put(g, o, 208.0, 0.265, ku_srodkowi_az(208.0, 0.265) - 0.12);
        let o = amfora(c, m, 0.92, true);
        c.put(g, o, 113.0, 0.165, 1.3);
    }
    if l >= 6.0 {
        let o = dom_grecki(c, m, 0.98, true, None);
        c.put(g, o, 42.0, 0.265, ku_srodkowi_az(42.0, 0.265) - 0.1);
        let o = oliwka(c, m, 0.9);
        c.put(g, o, 68.0, 0.30, 1.5);
    }
}

/// `skladFazaDuzaG(g, m, L)`.
fn sklad_faza_duza_g(c: &mut CityModel, g: NodeId, m: &Mg, l: f64) {
    let sw = swiatynia_mykenska(c, m, 1.15);
    c.set_pos(sw, -0.115, 0.0, -0.045);
    c.attach(g, sw);
    let o = dom_grecki(c, m, 1.0, true, None);
    c.put(g, o, 315.0, 0.285, ku_srodkowi_az(315.0, 0.285));
    let o = dom_grecki(c, m, 0.93, false, None);
    c.put(g, o, 345.0, 0.29, ku_srodkowi_az(345.0, 0.29) + 0.1);
    let o = dom_grecki(c, m, 0.98, true, None);
    c.put(g, o, 25.0, 0.285, ku_srodkowi_az(25.0, 0.285) - 0.1);
    let o = dom_grecki(c, m, 0.95, false, None);
    c.put(g, o, 145.0, 0.285, ku_srodkowi_az(145.0, 0.285) + 0.1);
    let o = stoa(c, m, 1.0);
    c.put(g, o, 135.0, 0.27, tang_rot_y(135.0) + PI);
    let o = amfora(c, m, 1.0, false);
    c.put(g, o, 128.0, 0.205, 0.4);
    let o = amfora(c, m, 0.9, true);
    c.put(g, o, 108.0, 0.19, 1.2);
    let o = oliwka(c, m, 1.0);
    c.put(g, o, 250.0, 0.315, 0.6);
    let o = oliwka(c, m, 0.92);
    c.put(g, o, 70.0, 0.325, 1.8);
    let o = studnia_gr(c, m);
    c.put(g, o, 92.0, 0.245, tang_rot_y(92.0));
    let o = oltarz(c, m);
    c.put(g, o, 84.0, 0.14, 0.1);
    if l >= 8.0 {
        let o = dom_grecki(c, m, 1.0, true, None);
        c.put(g, o, 175.0, 0.29, ku_srodkowi_az(175.0, 0.29));
        let o = amfora(c, m, 0.95, false);
        c.put(g, o, 99.0, 0.215, 2.0);
    }
    if l >= 9.0 {
        let o = dom_grecki(c, m, 0.9, false, Some(m.biel_dk));
        c.put(g, o, 55.0, 0.30, ku_srodkowi_az(55.0, 0.30));
    }
    if l >= 10.0 {
        let o = dom_grecki(c, m, 0.92, false, Some(m.biel_dk));
        c.put(g, o, 215.0, 0.28, ku_srodkowi_az(215.0, 0.28) - 0.1);
    }
}

// ========================= RZYM ========================================

/// Roman palette `PR` as materials (`interface MR`, `miasto-braz.ts:500-530`).
#[derive(Debug, Clone, Copy)]
struct Mr {
    strzecha: CityMatId,
    strzecha_dk: CityMatId,
    daub: CityMatId,
    tuf: CityMatId,
    tuf_dk: CityMatId,
    tynk: CityMatId,
    terakota: CityMatId,
    terakota_dk: CityMatId,
    podium: CityMatId,
    kamien: CityMatId,
    kamien_dk: CityMatId,
    drewno: CityMatId,
    drewno_dk: CityMatId,
    zebro: CityMatId,
    pal: CityMatId,
    ziemia: CityMatId,
    ziemia_dk: CityMatId,
    woda: CityMatId,
    swinia: CityMatId,
    ogien: CityMatId,
    plomien: CityMatId,
    dym: CityMatId,
    klepisko: CityMatId,
    sciezka: CityMatId,
    czern: CityMatId,
    frakcja: CityMatId,
    kalenica: CityMatId,
}

/// `makeMatsR(color)` (creation order of the web object literal; `daubDk`
/// is created but never used).
fn make_mats_r(c: &mut CityModel, color: u32) -> Mr {
    let kal = Color::from_hex(0x0093_402a).lerp(Color::from_hex(color & 0x00ff_ffff), 0.40);
    let mut mat = |hex: u32| c.lambert(hex, true);
    let strzecha = mat(0x00cd_a45c);
    let strzecha_dk = mat(0x00a3_8147);
    let daub = mat(0x00dc_be93);
    let _daub_dk = mat(0x00c7_a97c);
    let tuf = mat(0x00c4_693a);
    let tuf_dk = mat(0x009f_5330);
    let tynk = mat(0x00ee_e0c0);
    let terakota = mat(0x00b5_502f);
    let terakota_dk = mat(0x0093_402a);
    let podium = mat(0x00b3_a591);
    let kamien = mat(0x009d_9080);
    let kamien_dk = mat(0x007f_7466);
    let drewno = mat(0x008a_5f36);
    let drewno_dk = mat(0x006b_4527);
    let zebro = mat(0x007a_5a33);
    let pal = mat(0x0077_502c);
    let ziemia = mat(0x009b_7a4e);
    let ziemia_dk = mat(0x0083_653f);
    let woda = mat(0x005a_8bb0);
    let swinia = mat(0x00df_9d96);
    let ogien = mat(0x00ff_6b2e);
    let plomien = mat(0x00ff_c02e);
    let dym = mat(0x00d2_d2c8);
    let klepisko = mat(0x00ac_9166);
    let sciezka = mat(0x00bd_9a5f);
    let czern = mat(0x0014_100b);
    let frakcja = mat(color & 0x00ff_ffff);
    let kalenica = c.lambert_color(kal, true);
    Mr {
        strzecha,
        strzecha_dk,
        daub,
        tuf,
        tuf_dk,
        tynk,
        terakota,
        terakota_dk,
        podium,
        kamien,
        kamien_dk,
        drewno,
        drewno_dk,
        zebro,
        pal,
        ziemia,
        ziemia_dk,
        woda,
        swinia,
        ogien,
        plomien,
        dym,
        klepisko,
        sciezka,
        czern,
        frakcja,
        kalenica,
    }
}

/// `vexillum(m, s)` — 36 tri.
fn vexillum(c: &mut CityModel, m: &Mr, s: f64) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.012 * s, 0.21 * s, 0.012 * s],
        [0.0, 0.105 * s, 0.0],
        m.drewno_dk,
    );
    c.b(
        g,
        [0.012 * s, 0.012 * s, 0.078 * s],
        [0.0, 0.206 * s, 0.0],
        m.drewno,
    );
    c.b(
        g,
        [0.011 * s, 0.068 * s, 0.064 * s],
        [0.005 * s, 0.168 * s, 0.0],
        m.frakcja,
    );
    g
}

/// `capanna(m, s, wodz)` — 96 tri (+36 vexillum).
fn capanna(c: &mut CityModel, m: &Mr, s: f64, wodz: bool) -> NodeId {
    let g = c.detached_group();
    let a = c.cyl(
        g,
        0.066 * s,
        0.078 * s,
        0.062 * s,
        [0.0, 0.031 * s, 0.0],
        m.daub,
        6,
        R0,
    );
    c.tree.node(a).scale.z = 0.84;
    let b = c.cone(
        g,
        0.115 * s,
        0.15 * s,
        [0.0, 0.137 * s, 0.0],
        m.strzecha,
        6,
        R0,
    );
    c.tree.node(b).scale.z = 0.84;
    for a in [0.72, -0.72] {
        c.br(
            g,
            [0.013 * s, 0.155 * s, 0.013 * s],
            [
                js_cos(a) * 0.060 * s,
                0.132 * s,
                js_sin(a) * 0.060 * s * 0.84,
            ],
            m.zebro,
            [0.0, -a, 0.66],
        );
    }
    c.br(
        g,
        [0.012 * s, 0.062 * s, 0.012 * s],
        [0.0, 0.219 * s, 0.011 * s],
        m.zebro,
        [0.5, 0.0, 0.0],
    );
    c.br(
        g,
        [0.012 * s, 0.062 * s, 0.012 * s],
        [0.0, 0.219 * s, -0.011 * s],
        m.zebro,
        [-0.5, 0.0, 0.0],
    );
    c.b(
        g,
        [0.013 * s, 0.05 * s, 0.04 * s],
        [0.072 * s, 0.025 * s, 0.0],
        m.czern,
    );
    if wodz {
        let v = vexillum(c, m, s);
        c.set_pos(v, 0.0, 0.10 * s, 0.0);
        c.attach(g, v);
    }
    g
}

/// `domTufu(m, s, ciemny)` — 60 tri.
fn dom_tufu(c: &mut CityModel, m: &Mr, s: f64, ciemny: bool) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.16 * s, 0.115 * s, 0.14 * s],
        [0.0, 0.0575 * s, 0.0],
        if ciemny { m.tuf_dk } else { m.tuf },
    );
    c.br(
        g,
        [0.185 * s, 0.028 * s, 0.10 * s],
        [0.0, 0.132 * s, 0.042 * s],
        m.terakota,
        [0.68, 0.0, 0.0],
    );
    c.br(
        g,
        [0.185 * s, 0.028 * s, 0.10 * s],
        [0.0, 0.132 * s, -0.042 * s],
        m.terakota,
        [-0.68, 0.0, 0.0],
    );
    c.b(
        g,
        [0.18 * s, 0.026 * s, 0.05 * s],
        [0.0, 0.163 * s, 0.0],
        m.terakota_dk,
    );
    c.b(
        g,
        [0.013 * s, 0.065 * s, 0.045 * s],
        [0.081 * s, 0.0325 * s, 0.0],
        m.czern,
    );
    g
}

/// `swiatynkaEtruska(m, s, vex)` — 160/196 tri.
fn swiatynka_etruska(c: &mut CityModel, m: &Mr, s: f64, vex: bool) -> NodeId {
    let g = c.detached_group();
    c.b(
        g,
        [0.26 * s, 0.065 * s, 0.20 * s],
        [-0.02 * s, 0.0325 * s, 0.0],
        m.podium,
    );
    c.b(
        g,
        [0.05 * s, 0.022 * s, 0.11 * s],
        [0.138 * s, 0.011 * s, 0.0],
        m.kamien_dk,
    );
    c.b(
        g,
        [0.05 * s, 0.022 * s, 0.11 * s],
        [0.118 * s, 0.033 * s, 0.0],
        m.kamien,
    );
    c.b(
        g,
        [0.15 * s, 0.105 * s, 0.165 * s],
        [-0.055 * s, 0.1175 * s, 0.0],
        m.tynk,
    );
    c.cyl(
        g,
        0.0145 * s,
        0.0175 * s,
        0.088 * s,
        [0.062 * s, 0.099 * s, -0.055 * s],
        m.drewno,
        5,
        R0,
    );
    c.cyl(
        g,
        0.0145 * s,
        0.0175 * s,
        0.088 * s,
        [0.062 * s, 0.099 * s, 0.055 * s],
        m.drewno,
        5,
        R0,
    );
    c.b(
        g,
        [0.05 * s, 0.02 * s, 0.185 * s],
        [0.062 * s, 0.153 * s, 0.0],
        m.drewno_dk,
    );
    c.br(
        g,
        [0.30 * s, 0.026 * s, 0.13 * s],
        [-0.005 * s, 0.185 * s, 0.058 * s],
        m.terakota,
        [0.55, 0.0, 0.0],
    );
    c.br(
        g,
        [0.30 * s, 0.026 * s, 0.13 * s],
        [-0.005 * s, 0.185 * s, -0.058 * s],
        m.terakota,
        [-0.55, 0.0, 0.0],
    );
    c.b(
        g,
        [0.30 * s, 0.024 * s, 0.05 * s],
        [-0.005 * s, 0.214 * s, 0.0],
        m.kalenica,
    );
    c.b(
        g,
        [0.022 * s, 0.03 * s, 0.022 * s],
        [0.132 * s, 0.228 * s, 0.0],
        m.terakota_dk,
    );
    c.b(
        g,
        [0.012 * s, 0.062 * s, 0.045 * s],
        [0.021 * s, 0.086 * s, 0.0],
        m.czern,
    );
    if vex {
        let v = vexillum(c, m, s * 1.05);
        c.set_pos(v, -0.165 * s, 0.0, 0.085 * s);
        c.attach(g, v);
    }
    g
}

/// `westa(m, duza)` — 52/76 tri.
fn westa(c: &mut CityModel, m: &Mr, duza: bool) -> NodeId {
    let g = c.detached_group();
    c.cyl(g, 0.045, 0.05, 0.03, [0.0, 0.015, 0.0], m.kamien_dk, 6, R0);
    c.cone(g, 0.028, 0.065, [0.0, 0.062, 0.0], m.ogien, 4, R0);
    c.cone(g, 0.015, 0.042, [0.004, 0.098, 0.004], m.plomien, 4, R0);
    c.br(
        g,
        [0.042, 0.042, 0.042],
        [0.012, 0.15, 0.008],
        m.dym,
        [0.2, 0.4, 0.15],
    );
    if duza {
        c.br(
            g,
            [0.052, 0.046, 0.052],
            [0.03, 0.208, 0.024],
            m.dym,
            [-0.1, 0.2, 0.3],
        );
        c.br(
            g,
            [0.085, 0.02, 0.03],
            [-0.075, 0.014, 0.03],
            m.drewno,
            [0.0, 0.5, 0.0],
        );
    }
    g
}

/// `spichlerzykRz(m)` — 68 tri.
fn spichlerzyk_rz(c: &mut CityModel, m: &Mr) -> NodeId {
    let g = c.detached_group();
    for (px, pz) in [
        (-0.032, -0.026),
        (0.032, -0.026),
        (-0.032, 0.026),
        (0.032, 0.026),
    ] {
        c.b(g, [0.014, 0.05, 0.014], [px, 0.025, pz], m.pal);
    }
    c.b(g, [0.095, 0.058, 0.078], [0.0, 0.079, 0.0], m.drewno);
    c.cone(g, 0.078, 0.055, [0.0, 0.135, 0.0], m.strzecha_dk, 4, R0);
    g
}

/// `zagroda(m)` — 60 tri.
fn zagroda(c: &mut CityModel, m: &Mr) -> NodeId {
    let g = c.detached_group();
    c.b(g, [0.115, 0.026, 0.012], [0.0, 0.026, -0.045], m.pal);
    c.b(g, [0.115, 0.026, 0.012], [0.0, 0.026, 0.045], m.pal);
    c.b(g, [0.012, 0.026, 0.09], [-0.057, 0.026, 0.0], m.pal);
    c.br(
        g,
        [0.04, 0.026, 0.024],
        [0.012, 0.013, 0.008],
        m.swinia,
        [0.0, 0.4, 0.0],
    );
    c.br(
        g,
        [0.017, 0.015, 0.017],
        [0.034, 0.017, 0.014],
        m.swinia,
        [0.0, 0.4, 0.0],
    );
    g
}

/// `cysterna(m)` — 24 tri.
fn cysterna(c: &mut CityModel, m: &Mr) -> NodeId {
    let g = c.detached_group();
    c.b(g, [0.06, 0.035, 0.06], [0.0, 0.0175, 0.0], m.kamien);
    c.b(g, [0.044, 0.012, 0.044], [0.0, 0.037, 0.0], m.woda);
    g
}

/// `walAgger(m, r)` (`miasto-braz.ts:644-670`) — 344 tri.
fn wal_agger(c: &mut CityModel, m: &Mr, r: f64) -> NodeId {
    let g = c.detached_group();
    for i in 0..16u32 {
        let az = f64::from(i) * 22.5 + 3.0;
        if gates(az % 360.0) {
            continue;
        }
        let (x, z) = az_xz(az, r - 0.008);
        let mat = if i % 2 == 1 { m.ziemia_dk } else { m.ziemia };
        c.br(
            g,
            [0.19, 0.05, 0.08],
            [x, 0.025, z],
            mat,
            [0.0, tang_rot_y(az), 0.0],
        );
    }
    for i in 0..18u32 {
        let az = f64::from(i) * 20.0 + 10.0;
        if gates(az) {
            continue;
        }
        let (x, z) = az_xz(az, r - 0.008);
        let h = 0.125 + 0.03 * f64::from((i * 37) % 3) / 2.0;
        c.cone(
            g,
            0.034,
            h,
            [x, 0.042 + h / 2.0, z],
            m.pal,
            4,
            [
                0.04 * js_cos((az * PI) / 180.0),
                f64::from(i % 3) * 0.4,
                -0.04 * js_sin((az * PI) / 180.0),
            ],
        );
    }
    let (b1x, b1z) = az_xz(72.0, r);
    let (b2x, b2z) = az_xz(108.0, r);
    c.b(g, [0.045, 0.185, 0.045], [b1x, 0.0925, b1z], m.drewno_dk);
    c.b(g, [0.045, 0.185, 0.045], [b2x, 0.0925, b2z], m.drewno_dk);
    let mx = (b1x + b2x) / 2.0;
    c.b(
        g,
        [0.052, 0.024, (b2z - b1z).abs() + 0.05],
        [mx, 0.172, 0.0],
        m.drewno,
    );
    c.b(g, [0.075, 0.058, 0.085], [mx + 0.002, 0.213, 0.0], m.drewno);
    c.cone(
        g,
        0.060,
        0.052,
        [mx + 0.002, 0.268, 0.0],
        m.strzecha_dk,
        4,
        R0,
    );
    let (gx, gz) = az_xz(90.0, r - 0.022);
    c.b(g, [0.08, 0.016, 0.06], [gx, 0.008, gz], m.ziemia_dk);
    g
}

/// `placRzymski(g, m, rozmiar, L)`.
fn plac_rzymski(c: &mut CityModel, g: NodeId, m: &Mr, rz: Rozmiar, l: f64) {
    match rz {
        Rozmiar::Male => {
            if l >= 2.0 {
                c.plac(g, 0.125, 6, [0.08, 0.011, 0.03], m.klepisko);
            }
            c.b(g, [0.16, 0.01, 0.07], [0.26, 0.005, 0.02], m.sciezka);
        }
        Rozmiar::Srednie => {
            c.plac(g, 0.145, 6, [0.12, 0.011, 0.04], m.klepisko);
            c.b(g, [0.18, 0.01, 0.075], [0.28, 0.005, 0.03], m.sciezka);
            c.br(
                g,
                [0.17, 0.01, 0.065],
                [-0.22, 0.005, 0.17],
                m.sciezka,
                [0.0, 0.55, 0.0],
            );
        }
        Rozmiar::Duze => {
            c.plac(g, 0.15, 6, [0.14, 0.011, 0.07], m.klepisko);
            c.b(g, [0.72, 0.01, 0.08], [0.05, 0.005, 0.04], m.sciezka);
            c.b(g, [0.07, 0.01, 0.55], [0.10, 0.0052, -0.01], m.sciezka);
        }
    }
}

/// `skladFazaMalaR(g, m, L)`.
fn sklad_faza_mala_r(c: &mut CityModel, g: NodeId, m: &Mr, l: f64) {
    let wodz = capanna(c, m, 1.05, true);
    c.set_pos(wodz, -0.08, 0.0, -0.04);
    c.set_rot_y(wodz, 0.1);
    c.attach(g, wodz);
    let w = westa(c, m, false);
    c.set_pos(w, 0.07, 0.012, 0.04);
    c.attach(g, w);
    if l >= 2.0 {
        let o = capanna(c, m, 0.95, false);
        c.put(g, o, 210.0, 0.24, ku_srodkowi_az(210.0, 0.24));
    }
    if l >= 3.0 {
        let o = capanna(c, m, 0.9, false);
        c.put(g, o, 322.0, 0.25, ku_srodkowi_az(322.0, 0.25) + 0.15);
        let o = spichlerzyk_rz(c, m);
        c.put(g, o, 145.0, 0.26, tang_rot_y(145.0));
        let o = zagroda(c, m);
        c.put(g, o, 52.0, 0.27, tang_rot_y(52.0) + 0.3);
    }
}

/// `skladFazaSredniaR(g, m, L)`.
fn sklad_faza_srednia_r(c: &mut CityModel, g: NodeId, m: &Mr, l: f64) {
    let sw = swiatynka_etruska(c, m, 1.0, true);
    c.set_pos(sw, -0.10, 0.0, -0.02);
    c.attach(g, sw);
    let w = westa(c, m, true);
    c.set_pos(w, 0.11, 0.012, 0.08);
    c.attach(g, w);
    let o = capanna(c, m, 0.95, false);
    c.put(g, o, 210.0, 0.265, ku_srodkowi_az(210.0, 0.265));
    let o = capanna(c, m, 1.0, false);
    c.put(g, o, 318.0, 0.27, ku_srodkowi_az(318.0, 0.27) - 0.1);
    let o = spichlerzyk_rz(c, m);
    c.put(g, o, 250.0, 0.28, tang_rot_y(250.0));
    let o = zagroda(c, m);
    c.put(g, o, 115.0, 0.30, tang_rot_y(115.0) - 0.2);
    if l >= 5.0 {
        let o = dom_tufu(c, m, 1.0, false);
        c.put(g, o, 152.0, 0.27, ku_srodkowi_az(152.0, 0.27));
    }
    if l >= 6.0 {
        let o = capanna(c, m, 0.9, false);
        c.put(g, o, 40.0, 0.265, ku_srodkowi_az(40.0, 0.265) + 0.1);
    }
}

/// `skladFazaDuzaR(g, m, L)`.
fn sklad_faza_duza_r(c: &mut CityModel, g: NodeId, m: &Mr, l: f64) {
    let sw = swiatynka_etruska(c, m, if l >= 9.0 { 1.22 } else { 1.15 }, true);
    c.set_pos(sw, -0.115, 0.0, -0.05);
    c.attach(g, sw);
    let w = westa(c, m, true);
    c.set_pos(w, 0.14, 0.012, 0.09);
    c.attach(g, w);
    let o = dom_tufu(c, m, 1.0, false);
    c.put(g, o, 305.0, 0.28, ku_srodkowi_az(305.0, 0.28));
    let o = dom_tufu(c, m, 1.0, false);
    c.put(g, o, 25.0, 0.285, ku_srodkowi_az(25.0, 0.285) - 0.1);
    let o = capanna(c, m, 0.92, false);
    c.put(g, o, 60.0, 0.295, ku_srodkowi_az(60.0, 0.295));
    let o = capanna(c, m, 0.98, false);
    c.put(g, o, 145.0, 0.285, ku_srodkowi_az(145.0, 0.285) + 0.1);
    let o = capanna(c, m, 0.95, false);
    c.put(g, o, 215.0, 0.28, ku_srodkowi_az(215.0, 0.28));
    let o = spichlerzyk_rz(c, m);
    c.put(g, o, 245.0, 0.30, tang_rot_y(245.0));
    let o = zagroda(c, m);
    c.put(g, o, 112.0, 0.31, tang_rot_y(112.0) - 0.2);
    if l >= 8.0 {
        let o = dom_tufu(c, m, 0.95, true);
        c.put(g, o, 335.0, 0.29, ku_srodkowi_az(335.0, 0.29) + 0.1);
    }
    if l >= 9.0 {
        let o = cysterna(c, m);
        c.put(g, o, 95.0, 0.245, 0.3);
    }
    if l >= 10.0 {
        let o = capanna(c, m, 0.9, false);
        c.put(g, o, 175.0, 0.29, ku_srodkowi_az(175.0, 0.29) - 0.1);
    }
}

// ========================= API =========================================

/// `zapakuj(inner, model, rz, L)` (`miasto-braz.ts:798-806`).
fn zapakuj(c: &mut CityModel, inner: NodeId, model: &'static str, rz: Rozmiar, l: f64) {
    c.set_scale_scalar(inner, 1.0 / MIASTO_BRAZ_CITY_MODEL_SCALE);
    c.attach(ROOT, inner);
    c.user_data = CityUserData {
        model: Some(model),
        poziom: Some(l),
        rozmiar: Some(rz),
    };
}

/// `buildMiastoBrazGrecja(poziom = 10, opts = {})` (`miasto-braz.ts:818-833`).
#[must_use]
pub fn build_miasto_braz_grecja(poziom: Poziom, opts: MiastoBrazOpts) -> CityModel {
    let l = poziom_z_argumentu(poziom);
    let rz = rozmiar_of_clamped(l);
    let mut c = CityModel::new();
    let m = make_mats_g(&mut c, opts.color.unwrap_or(MIASTO_BRAZ_DEFAULT_COLOR));
    let inner = c.detached_group();
    plac_grecki(&mut c, inner, &m, rz);
    match rz {
        Rozmiar::Male => sklad_faza_mala_g(&mut c, inner, &m, l),
        Rozmiar::Srednie => sklad_faza_srednia_g(&mut c, inner, &m, l),
        Rozmiar::Duze => sklad_faza_duza_g(&mut c, inner, &m, l),
    }
    if opts.mur {
        let w = mur_cyklopowy(&mut c, &m, os_muru(rz));
        c.attach(inner, w);
    } else if opts.palisada {
        let w = build_palisada_wal(&mut c, rz, opts.color);
        c.attach(inner, w);
    }
    zapakuj(&mut c, inner, "miasto-braz-grecja", rz, l);
    c
}

/// `buildMiastoBrazRzym(poziom = 10, opts = {})` (`miasto-braz.ts:842-857`).
#[must_use]
pub fn build_miasto_braz_rzym(poziom: Poziom, opts: MiastoBrazOpts) -> CityModel {
    let l = poziom_z_argumentu(poziom);
    let rz = rozmiar_of_clamped(l);
    let mut c = CityModel::new();
    let m = make_mats_r(&mut c, opts.color.unwrap_or(MIASTO_BRAZ_DEFAULT_COLOR));
    let inner = c.detached_group();
    plac_rzymski(&mut c, inner, &m, rz, l);
    match rz {
        Rozmiar::Male => sklad_faza_mala_r(&mut c, inner, &m, l),
        Rozmiar::Srednie => sklad_faza_srednia_r(&mut c, inner, &m, l),
        Rozmiar::Duze => sklad_faza_duza_r(&mut c, inner, &m, l),
    }
    if opts.mur {
        let w = wal_agger(&mut c, &m, os_muru(rz));
        c.attach(inner, w);
    } else if opts.palisada {
        let w = build_palisada_wal(&mut c, rz, opts.color);
        c.attach(inner, w);
    }
    zapakuj(&mut c, inner, "miasto-braz-rzym", rz, l);
    c
}

/// `buildMiastoBraz(civ, poziom, opts)` (`miasto-braz.ts:866-873`): `'rzym'`
/// gets the Roman set, every other string (any civ, unknown, empty) the
/// Greek one.
#[must_use]
pub fn build_miasto_braz(civ: &str, poziom: Poziom, opts: MiastoBrazOpts) -> CityModel {
    if civ == "rzym" {
        build_miasto_braz_rzym(poziom, opts)
    } else {
        build_miasto_braz_grecja(poziom, opts)
    }
}

/// Set used by [`build_miasto_braz`] for a civ string.
#[must_use]
pub fn cyw_brazu(civ: &str) -> CywBrazu {
    if civ == "rzym" {
        CywBrazu::Rzym
    } else {
        CywBrazu::Grecja
    }
}
