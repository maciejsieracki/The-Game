//! `render/bronzeCityRoblox.ts` (web `edb8fb56`, 437 LOC): the bronze-age
//! settlement in the `roblox` block style, per [`BronzeCiv`]. Live only as
//! the city-founding ghost (`main.ts:13023` → `settlementModel.ts:22`), see
//! P4-4 §2.2.

use std::f64::consts::PI;

use super::model::{CityGeo, CityMatId, CityModel};
use crate::core::bronze::{rnd, BronzeCiv};
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::model::{NodeId, ROOT};
use crate::pick::hex::{js_round, HEX_R};
use crate::pick::three::{js_max, js_min};

/// `CITY_MODEL_SCALE` (`bronzeCityRoblox.ts:13`).
const CITY_MODEL_SCALE: f64 = 1.38;
/// `WALL_HEX_FILL` (`:15`).
const WALL_HEX_FILL: f64 = 0.70;
/// `WALL_BAND` (`:16`).
const WALL_BAND: f64 = 0.058;
/// `WALL_HEIGHT` (`:17`).
const WALL_HEIGHT: f64 = 0.15;

/// Huts per level (`bronzeCityRoblox.ts:407`).
pub const HUT_COUNT: [u32; 10] = [2, 3, 5, 7, 9, 12, 15, 18, 22, 26];

/// `RP` palette (`bronzeCityRoblox.ts:99-113`).
#[derive(Debug, Clone, Copy)]
struct Rp {
    wall: CityMatId,
    roof: CityMatId,
    roof2: CityMatId,
    stone: CityMatId,
    stone2: CityMatId,
    wood: CityMatId,
    clay: CityMatId,
    brick: CityMatId,
    white_brick: CityMatId,
    accent: CityMatId,
    gold: CityMatId,
    owner: CityMatId,
    trim: CityMatId,
}

/// `palette(civ, ownerCol)` (`bronzeCityRoblox.ts:115-173`): base materials
/// first, then the per-civ overrides (`{ ...base, … }`).
#[allow(clippy::too_many_lines)]
fn palette(c: &mut CityModel, civ: BronzeCiv, owner_col: u32) -> Rp {
    let mut rbx = |hex: u32| c.lambert_mat(hex, true);
    let stone = rbx(0x00aa_bbcc);
    let stone2 = rbx(0x0088_99aa);
    let wood = rbx(0x00cd_853f);
    let clay = rbx(0x00c4_a574);
    let brick = rbx(0x00b5_523a);
    let white_brick = rbx(0x00f2_ece4);
    let gold = rbx(0x00ff_d54a);
    let owner = rbx(owner_col);
    let trim = rbx(0x0033_4455);
    let mut p = Rp {
        wall: 0,
        roof: 0,
        roof2: 0,
        stone,
        stone2,
        wood,
        clay,
        brick,
        white_brick,
        accent: 0,
        gold,
        owner,
        trim,
    };
    match civ {
        BronzeCiv::Grecja => {
            p.wall = rbx(0x00f8_f9fc);
            p.stone = rbx(0x00f2_f4f7);
            p.stone2 = rbx(0x00e8_eaed);
            p.roof = rbx(0x00f5_f6f8);
            p.roof2 = rbx(0x00ee_eeee);
            p.accent = rbx(0x0015_65c0);
            p.trim = rbx(0x0042_a5f5);
            p.wood = rbx(0x00e8_eaed);
        }
        BronzeCiv::Rzym => {
            p.wall = rbx(0x00ff_f8e7);
            p.roof = rbx(0x00e5_3935);
            p.roof2 = rbx(0x00c6_2828);
            p.accent = rbx(0x00ff_cc80);
            p.stone = rbx(0x00d7_ccc8);
        }
        BronzeCiv::Sumer => {
            p.wall = rbx(0x00d4_a574);
            p.roof = rbx(0x00a1_887f);
            p.roof2 = rbx(0x008d_6e63);
            p.accent = rbx(0x00ff_8a65);
            p.stone = rbx(0x00bc_aaa4);
            p.stone2 = rbx(0x008d_6e63);
        }
        BronzeCiv::Egipt => {
            p.wall = rbx(0x00ff_e082);
            p.roof = rbx(0x00ff_ca28);
            p.roof2 = rbx(0x00ff_a000);
            p.accent = rbx(0x00ff_d54a);
            p.gold = rbx(0x00ff_eb3b);
            p.stone = rbx(0x00ff_cc80);
        }
        BronzeCiv::Inka => {
            p.wall = rbx(0x00b0_bec5);
            p.roof = rbx(0x00ff_a726);
            p.roof2 = rbx(0x00fb_8c00);
            p.accent = rbx(0x00ff_d54a);
            p.stone = rbx(0x0090_a4ae);
            p.stone2 = rbx(0x0078_909c);
        }
        BronzeCiv::Aztek => {
            p.wall = rbx(0x008d_6e63);
            p.roof = rbx(0x0043_a047);
            p.roof2 = rbx(0x002e_7d32);
            p.accent = rbx(0x00d3_2f2f);
            p.gold = rbx(0x0000_e676);
            p.stone = rbx(0x0079_5548);
        }
        BronzeCiv::Chiny => {
            p.wall = rbx(0x00ff_f3e0);
            p.roof = rbx(0x0042_4242);
            p.roof2 = rbx(0x0021_2121);
            p.accent = rbx(0x00d3_2f2f);
            p.gold = rbx(0x00ff_d54a);
            p.trim = rbx(0x00b7_1c1c);
        }
        BronzeCiv::Zulu => {
            p.wall = rbx(0x00d7_ccc8);
            p.roof = rbx(0x00ff_b74d);
            p.roof2 = rbx(0x00ff_9800);
            p.accent = rbx(0x006d_4c41);
        }
        BronzeCiv::Celtowie => {
            p.wall = rbx(0x00d7_ccc8);
            p.roof = rbx(0x008b_c34a);
            p.roof2 = rbx(0x0068_9f38);
            p.accent = rbx(0x0079_5548);
            p.stone = rbx(0x009e_9e9e);
        }
        BronzeCiv::Germanie => {
            p.wall = rbx(0x00a1_887f);
            p.roof = rbx(0x006d_4c41);
            p.roof2 = rbx(0x004e_342e);
            p.accent = rbx(0x00ff_5722);
            p.wood = rbx(0x005d_4037);
        }
        BronzeCiv::Hetyci => {
            p.wall = rbx(0x009e_9e9e);
            p.roof = rbx(0x0075_7575);
            p.roof2 = rbx(0x0061_6161);
            p.stone = rbx(0x009e_9e9e);
            p.stone2 = rbx(0x0075_7575);
            p.accent = rbx(0x0054_6e7a);
            p.trim = rbx(0x0042_4242);
            p.wood = rbx(0x006d_4c41);
        }
    }
    p
}

/// `addStud(g, x, y, z, m, r = 0.018)`.
fn add_stud(c: &mut CityModel, g: NodeId, x: f64, y: f64, z: f64, m: CityMatId) {
    let r = 0.018;
    c.add_cyl(g, r, r, 0.012, x, y, z, m, 8);
}

/// `steps(g, n, w, d, h, shrink, m, y0 = 0)`.
#[allow(clippy::too_many_arguments)]
fn steps(
    c: &mut CityModel,
    g: NodeId,
    n: u32,
    w: f64,
    d: f64,
    h: f64,
    shrink: f64,
    m: CityMatId,
) -> f64 {
    let mut y = 0.0;
    let mut cw = w;
    let mut cd = d;
    for _ in 0..n {
        c.add_box(g, cw, h, cd, 0.0, y, 0.0, m);
        y += h;
        cw *= shrink;
        cd *= shrink;
    }
    y
}

/// `temple(civ, s, p)` (`bronzeCityRoblox.ts:212-317`).
#[allow(clippy::too_many_lines)]
fn temple(c: &mut CityModel, civ: BronzeCiv, s: f64, p: &Rp) -> NodeId {
    let g = c.detached_group();
    match civ {
        BronzeCiv::Grecja => {
            let marble = p.stone;
            let blue = p.accent;
            c.add_box(g, 0.34 * s, 0.04 * s, 0.24 * s, 0.0, 0.0, 0.0, marble);
            for sx in [-1.0, 0.0, 1.0] {
                for sz in [-1.0, 1.0] {
                    let is_blue = sz == 1.0 && sx != 0.0;
                    c.add_cyl(
                        g,
                        0.022 * s,
                        0.026 * s,
                        0.16 * s,
                        sx * 0.12 * s,
                        0.04 * s,
                        sz * 0.08 * s,
                        if is_blue { blue } else { marble },
                        6,
                    );
                }
            }
            c.add_box(g, 0.36 * s, 0.05 * s, 0.26 * s, 0.0, 0.2 * s, 0.0, marble);
            c.add_box(
                g,
                0.28 * s,
                0.04 * s,
                0.04 * s,
                0.0,
                0.26 * s,
                0.1 * s,
                marble,
            );
            c.add_box(
                g,
                0.22 * s,
                0.05 * s,
                0.012 * s,
                0.0,
                0.285 * s,
                0.12 * s,
                blue,
            );
        }
        BronzeCiv::Rzym => {
            c.add_box(g, 0.3 * s, 0.08 * s, 0.22 * s, 0.0, 0.0, 0.0, p.stone);
            for i in -2i32..=2 {
                let fi = f64::from(i);
                c.add_cyl(
                    g,
                    0.02 * s,
                    0.024 * s,
                    0.14 * s,
                    fi * 0.06 * s,
                    0.08 * s,
                    0.1 * s,
                    p.wall,
                    6,
                );
            }
            c.add_box(g, 0.32 * s, 0.05 * s, 0.24 * s, 0.0, 0.22 * s, 0.0, p.roof);
            add_stud(c, g, 0.0, 0.28 * s, 0.0, p.gold);
        }
        BronzeCiv::Sumer => {
            steps(c, g, 4, 0.4 * s, 0.32 * s, 0.07 * s, 0.74, p.stone);
            c.add_box(g, 0.18 * s, 0.08 * s, 0.14 * s, 0.0, 0.3 * s, 0.0, p.accent);
            c.add_box(
                g,
                0.1 * s,
                0.04 * s,
                0.28 * s,
                0.0,
                0.12 * s,
                0.14 * s,
                p.stone2,
            );
        }
        BronzeCiv::Egipt => {
            for sx in [-1.0, 1.0] {
                c.add_box(
                    g,
                    0.1 * s,
                    0.28 * s,
                    0.12 * s,
                    sx * 0.08 * s,
                    0.0,
                    0.0,
                    p.wall,
                );
                c.add_box(
                    g,
                    0.12 * s,
                    0.04 * s,
                    0.14 * s,
                    sx * 0.08 * s,
                    0.28 * s,
                    0.0,
                    p.gold,
                );
            }
            c.add_box(
                g,
                0.22 * s,
                0.04 * s,
                0.08 * s,
                0.0,
                0.22 * s,
                0.0,
                p.accent,
            );
            for sx in [-1.0, 1.0] {
                c.add_cyl(
                    g,
                    0.02 * s,
                    0.024 * s,
                    0.18 * s,
                    sx * 0.14 * s,
                    0.0,
                    0.06 * s,
                    p.gold,
                    4,
                );
            }
        }
        BronzeCiv::Inka => {
            steps(c, g, 3, 0.36 * s, 0.28 * s, 0.06 * s, 0.8, p.stone);
            c.add_box(g, 0.2 * s, 0.12 * s, 0.16 * s, 0.0, 0.2 * s, 0.0, p.wall);
            c.add_box(g, 0.22 * s, 0.025 * s, 0.18 * s, 0.0, 0.28 * s, 0.0, p.gold);
            c.add_box(g, 0.14 * s, 0.06 * s, 0.14 * s, 0.0, 0.34 * s, 0.0, p.roof);
        }
        BronzeCiv::Aztek => {
            steps(c, g, 5, 0.42 * s, 0.38 * s, 0.055 * s, 0.78, p.stone);
            c.add_box(
                g,
                0.12 * s,
                0.08 * s,
                0.14 * s,
                -0.08 * s,
                0.32 * s,
                0.0,
                p.accent,
            );
            c.add_box(
                g,
                0.12 * s,
                0.08 * s,
                0.14 * s,
                0.08 * s,
                0.32 * s,
                0.0,
                p.gold,
            );
            c.add_box(
                g,
                0.14 * s,
                0.03 * s,
                0.32 * s,
                0.0,
                0.14 * s,
                0.16 * s,
                p.stone2,
            );
        }
        BronzeCiv::Chiny => {
            c.add_box(g, 0.4 * s, 0.05 * s, 0.4 * s, 0.0, 0.0, 0.0, p.stone);
            let mut y = 0.05 * s;
            for tier in 0..3u32 {
                let bw = (0.28 - f64::from(tier) * 0.05) * s;
                c.add_box(g, bw, 0.1 * s, bw, 0.0, y, 0.0, p.wall);
                c.add_box(
                    g,
                    bw * 1.15,
                    0.04 * s,
                    bw * 1.15,
                    0.0,
                    y + 0.1 * s,
                    0.0,
                    p.roof,
                );
                for sx in [-1.0, 1.0] {
                    c.add_cyl(
                        g,
                        0.016 * s,
                        0.016 * s,
                        0.1 * s,
                        sx * bw * 0.42,
                        y,
                        bw * 0.42,
                        p.accent,
                        6,
                    );
                }
                y += 0.16 * s;
            }
            c.add_cyl(g, 0.01 * s, 0.02 * s, 0.08 * s, 0.0, y, 0.0, p.gold, 6);
        }
        BronzeCiv::Zulu => {
            c.add_cyl(g, 0.2 * s, 0.22 * s, 0.08 * s, 0.0, 0.0, 0.0, p.wood, 8);
            c.add_cyl(
                g,
                0.18 * s,
                0.2 * s,
                0.14 * s,
                0.0,
                0.08 * s,
                0.0,
                p.roof,
                8,
            );
            c.add_box(
                g,
                0.08 * s,
                0.1 * s,
                0.02 * s,
                0.0,
                0.05 * s,
                0.19 * s,
                p.wood,
            );
        }
        BronzeCiv::Celtowie => {
            for i in 0..8u32 {
                let a = (f64::from(i) / 8.0) * PI * 2.0;
                c.add_box(
                    g,
                    0.04 * s,
                    0.14 * s,
                    0.03 * s,
                    js_cos(a) * 0.16 * s,
                    0.0,
                    js_sin(a) * 0.16 * s,
                    p.stone,
                );
            }
            c.add_cyl(g, 0.035 * s, 0.04 * s, 0.22 * s, 0.0, 0.0, 0.0, p.wood, 6);
            c.add_box(
                g,
                0.07 * s,
                0.06 * s,
                0.07 * s,
                0.0,
                0.24 * s,
                0.0,
                p.accent,
            );
            c.add_box(g, 0.05 * s, 0.05 * s, 0.05 * s, 0.0, 0.32 * s, 0.0, p.gold);
        }
        BronzeCiv::Germanie => {
            c.add_box(g, 0.36 * s, 0.12 * s, 0.18 * s, 0.0, 0.0, 0.0, p.wall);
            c.add_box(g, 0.38 * s, 0.04 * s, 0.2 * s, 0.0, 0.14 * s, 0.0, p.roof);
            for sx in [-1.0, 1.0] {
                c.add_cyl(
                    g,
                    0.022 * s,
                    0.026 * s,
                    0.2 * s,
                    sx * 0.14 * s,
                    0.0,
                    0.12 * s,
                    p.wood,
                    6,
                );
                c.add_box(
                    g,
                    0.05 * s,
                    0.05 * s,
                    0.05 * s,
                    sx * 0.14 * s,
                    0.22 * s,
                    0.12 * s,
                    p.accent,
                );
            }
        }
        BronzeCiv::Hetyci => {
            let tw = 0.11 * s;
            let th = 0.28 * s;
            let td = 0.14 * s;
            let gap = 0.1 * s;
            for sx in [-1.0, 1.0] {
                let x = sx * (gap / 2.0 + tw / 2.0);
                c.add_box(g, tw, th, td, x, 0.0, 0.0, p.stone);
                c.add_box(g, tw * 1.08, 0.04 * s, td * 1.08, x, th, 0.0, p.stone2);
                for i in 0..3u32 {
                    c.add_box(
                        g,
                        tw * 0.92,
                        0.05 * s,
                        td * 0.35,
                        x,
                        0.06 * s + f64::from(i) * th * 0.28,
                        td * 0.22,
                        p.stone2,
                    );
                }
            }
            c.add_box(
                g,
                gap + tw * 1.4,
                0.06 * s,
                td * 0.55,
                0.0,
                th * 0.78,
                0.0,
                p.stone2,
            );
            c.add_box(
                g,
                gap * 0.72,
                th * 0.42,
                td * 0.42,
                0.0,
                th * 0.36,
                0.0,
                p.stone,
            );
            c.add_box(
                g,
                gap + tw * 2.0,
                0.025 * s,
                0.22 * s,
                0.0,
                0.0,
                -0.15 * s,
                p.stone2,
            );
        }
    }
    g
}

/// `house(civ, idx, r, p)` (`bronzeCityRoblox.ts:319-381`).
fn house(c: &mut CityModel, civ: BronzeCiv, idx: f64, r: f64, p: &Rp) -> NodeId {
    let g = c.detached_group();
    let j = 0.85 + rnd(idx, 2.0) * 0.3;
    let w = r * 1.6 * j;
    let h = r * (0.75 + rnd(idx, 3.0) * 0.45);
    let d = r * 1.35 * j;
    match civ {
        BronzeCiv::Grecja => {
            c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.wall);
            c.add_box(g, w * 1.05, r * 0.12, d * 1.05, 0.0, h, 0.0, p.roof);
        }
        BronzeCiv::Sumer | BronzeCiv::Egipt | BronzeCiv::Aztek => {
            c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.wall);
            c.add_box(g, w * 1.05, r * 0.12, d * 1.05, 0.0, h, 0.0, p.roof);
            add_stud(c, g, 0.0, h + r * 0.12, 0.0, p.trim);
        }
        BronzeCiv::Rzym | BronzeCiv::Inka => {
            c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.wall);
            c.add_box(
                g,
                w * 1.08,
                r * 0.14,
                d * 0.5,
                0.0,
                h + r * 0.04,
                0.0,
                p.roof,
            );
            c.add_box(
                g,
                w * 1.08,
                r * 0.14,
                d * 0.5,
                0.0,
                h + r * 0.04,
                0.0,
                p.roof2,
            );
        }
        BronzeCiv::Chiny => {
            c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.wall);
            c.add_box(g, w * 1.1, r * 0.08, d * 1.1, 0.0, h, 0.0, p.roof);
            c.add_cyl(
                g,
                r * 0.06,
                r * 0.06,
                h,
                w * 0.42,
                0.0,
                d * 0.38,
                p.accent,
                6,
            );
        }
        BronzeCiv::Zulu => {
            c.add_cyl(g, r * 0.9, r * 0.95, h * 0.85, 0.0, 0.0, 0.0, p.wall, 8);
            c.add_cyl(g, r * 1.05, r * 0.5, r * 0.9, 0.0, h * 0.85, 0.0, p.roof, 8);
        }
        BronzeCiv::Celtowie => {
            if idx % 4.0 == 0.0 {
                c.add_cyl(g, r * 0.85, r * 0.85, h, 0.0, 0.0, 0.0, p.wall, 8);
                c.add_cyl(g, r, r * 0.3, r * 0.95, 0.0, h, 0.0, p.roof, 8);
            } else {
                c.add_box(g, w, h, d * 1.15, 0.0, 0.0, 0.0, p.wall);
                c.add_box(g, w * 1.1, r * 0.12, d * 0.55, 0.0, h, 0.0, p.roof);
            }
        }
        BronzeCiv::Germanie => {
            if idx % 5.0 == 0.0 {
                c.add_box(g, w * 1.6, h, d, 0.0, 0.0, 0.0, p.wall);
                c.add_box(g, w * 1.65, r * 0.12, d * 1.05, 0.0, h, 0.0, p.roof);
            } else {
                c.add_cyl(g, r * 0.85, r * 0.85, h, 0.0, 0.0, 0.0, p.wall, 6);
                c.add_cyl(g, r, r * 0.35, r, 0.0, h, 0.0, p.roof, 6);
            }
        }
        BronzeCiv::Hetyci => {
            c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.stone);
            c.add_box(g, w * 1.05, r * 0.1, d * 1.05, 0.0, h, 0.0, p.stone2);
            add_stud(c, g, 0.0, h + r * 0.1, 0.0, p.trim);
        }
    }
    g
}

/// `wallMassKind(civ)` → material (`bronzeCityRoblox.ts:21-54`).
fn wall_mass_material(civ: BronzeCiv, p: &Rp) -> CityMatId {
    match civ {
        BronzeCiv::Celtowie => p.wood,
        BronzeCiv::Sumer | BronzeCiv::Zulu | BronzeCiv::Germanie => p.clay,
        BronzeCiv::Egipt => p.white_brick,
        BronzeCiv::Rzym | BronzeCiv::Chiny => p.brick,
        BronzeCiv::Hetyci | BronzeCiv::Grecja | BronzeCiv::Inka | BronzeCiv::Aztek => p.stone,
    }
}

/// `walls(civ, spread, p)` (`bronzeCityRoblox.ts:383-395`).
fn walls(c: &mut CityModel, civ: BronzeCiv, spread: f64, p: &Rp) -> NodeId {
    let g = c.detached_group();
    let hex_target = (WALL_HEX_FILL * HEX_R) / CITY_MODEL_SCALE;
    let outer = js_max(hex_target, spread * 1.22);
    let inner = js_max(outer - WALL_BAND, spread * 0.92);
    let mat = wall_mass_material(civ, p);
    let id = c.mesh(
        g,
        CityGeo::HexWallRing {
            outer,
            inner,
            height: WALL_HEIGHT,
        },
        mat,
    );
    let d = c.node(id);
    d.cast_shadow = true;
    d.receive_shadow = true;
    g
}

/// Ring loop shared by both ghost builders: `rings` of `[cap, radius]`,
/// `hutCount` (NaN when the level is outside the table, like the web
/// `undefined`), one call of `make(placed, ang, rr)` per hut.
pub(crate) fn place_rings(
    rings: &[(f64, f64)],
    hut_count: f64,
    mut make: impl FnMut(f64, f64, f64),
) {
    let mut placed = 0.0;
    for &(cap, ring_r) in rings {
        let per = js_min(hut_count - placed, cap);
        let mut i = 0.0;
        while i < per {
            // `6.2832` is the web literal (not `TAU`): keep it for bit parity.
            #[allow(clippy::approx_constant)]
            let ang = (i / per) * 6.2832 + rnd(placed, 1.0);
            make(placed, ang, ring_r);
            placed += 1.0;
            i += 1.0;
        }
        if placed >= hut_count {
            break;
        }
    }
}

/// `hutCount = table[L - 1]` (`undefined` → NaN outside the table).
pub(crate) fn table_count(table: &[u32; 10], l: f64) -> f64 {
    if !(1.0..=10.0).contains(&l) {
        return f64::NAN;
    }
    // `l` is an integer in 1..=10 here (clamped and rounded by the caller).
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let i = l as usize - 1;
    f64::from(table[i])
}

/// `buildBronzeCityRoblox(civ, level, ownerCol, withWalls = false)`
/// (`bronzeCityRoblox.ts:398-437`).
#[must_use]
pub fn build_bronze_city_roblox(
    civ: BronzeCiv,
    level: f64,
    owner_col: u32,
    with_walls: bool,
) -> CityModel {
    let l = js_max(1.0, js_min(10.0, js_round(level)));
    let mut c = CityModel::new();
    let group = ROOT;
    let p = palette(&mut c, civ, owner_col);
    let hut_count = table_count(&HUT_COUNT, l);
    let spread = 0.13 + l * 0.05;
    let hut_r = 0.06;
    let t_scale = 0.8 + (l - 1.0) * 0.06;

    let t = temple(&mut c, civ, t_scale, &p);
    c.attach(group, t);

    let rings = [
        (6.0, spread * 0.62),
        (10.0, spread * 0.9),
        (18.0, spread * 1.15),
    ];
    let mut huts: Vec<(f64, f64, f64)> = Vec::new();
    place_rings(&rings, hut_count, |placed, ang, ring_r| {
        huts.push((placed, ang, ring_r))
    });
    for (placed, ang, ring_r) in huts {
        let rr = ring_r * (0.85 + rnd(placed, 2.0) * 0.3);
        let h = house(
            &mut c,
            civ,
            placed,
            hut_r * (0.9 + rnd(placed, 3.0) * 0.3),
            &p,
        );
        c.set_pos(h, js_cos(ang) * rr, 0.0, js_sin(ang) * rr);
        let rot = if matches!(civ, BronzeCiv::Germanie | BronzeCiv::Chiny) {
            js_atan2(-js_sin(ang), -js_cos(ang))
        } else {
            js_round(rnd(placed, 4.0) * 4.0) * (PI / 2.0)
        };
        c.set_rot_y(h, rot);
        c.attach(group, h);
    }

    c.add_cyl(
        group,
        0.014,
        0.016,
        0.32,
        spread * 0.95,
        0.0,
        spread * 0.2,
        p.wood,
        6,
    );
    c.add_box(
        group,
        0.07,
        0.05,
        0.002,
        spread * 0.95,
        0.3,
        spread * 0.24,
        p.owner,
    );

    if with_walls {
        let w = walls(&mut c, civ, spread, &p);
        c.attach(group, w);
    }
    c
}
