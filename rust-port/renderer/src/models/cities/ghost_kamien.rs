//! `render/stoneCityRoblox.ts` (web `edb8fb56`, 471 LOC): the stone-age
//! settlement in the `roblox` block style. Live only as the city-founding
//! ghost (`main.ts:13023` → `settlementModel.ts:23`, which always passes a
//! civ, i.e. the per-civ overload). The level-only overload
//! (`buildStoneAgeCityRoblox(level, owner, walls)`, the "universal" style)
//! is ported too ([`build_stone_age_city_roblox_universal`]).

use std::f64::consts::PI;

use super::ghost_braz::{place_rings, table_count};
use super::model::{CityGeo, CityMatId, CityModel};
use super::stone_civ::StoneCiv;
use crate::core::bronze::{rnd, BronzeCiv};
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::model::{NodeId, ROOT};
use crate::pick::hex::{js_round, HEX_R};
use crate::pick::three::{js_max, js_min};

const CITY_MODEL_SCALE: f64 = 1.38;
const WALL_HEX_FILL: f64 = 0.70;
const WALL_BAND: f64 = 0.058;
/// `WALL_HEIGHT` (`stoneCityRoblox.ts:16`).
const WALL_HEIGHT: f64 = 0.13;

/// Huts per level (`stoneCityRoblox.ts:358`, `:407`).
pub const HUT_COUNT: [u32; 10] = [1, 2, 3, 5, 7, 9, 12, 15, 18, 22];

/// `SP` palette (`stoneCityRoblox.ts:30-42`).
#[derive(Debug, Clone, Copy)]
struct Sp {
    mud: CityMatId,
    thatch: CityMatId,
    brick: CityMatId,
    brick_dk: CityMatId,
    stone: CityMatId,
    stone_dk: CityMatId,
    wood: CityMatId,
    fire: CityMatId,
    gold: CityMatId,
    owner: CityMatId,
}

/// `stonePalette(civ, ownerCol)` (`stoneCityRoblox.ts:44-78`).
fn stone_palette(c: &mut CityModel, civ: StoneCiv, owner_col: u32) -> Sp {
    let mut rbx = |hex: u32| c.lambert_mat(hex, true);
    let stone = rbx(0x009a_9a94);
    let stone_dk = rbx(0x0077_694f);
    let wood = rbx(0x008b_6914);
    let fire = rbx(0x00ff_6b2b);
    let gold = rbx(0x00d4_af37);
    let owner = rbx(owner_col);
    // (mud, thatch, thatchDk, brick, brickDk) per civ; `thatchDk` is created
    // but never drawn.
    let set = |a: u32, b: u32, t: u32, d: u32, e: u32| (a, b, t, d, e);
    let (mud, thatch, thatch_dk, brick, brick_dk) = match civ {
        BronzeCiv::Grecja => set(
            0x008a_7050,
            0x00c2_a262,
            0x009a_7d44,
            0x00b8_a078,
            0x008a_7050,
        ),
        BronzeCiv::Rzym => set(
            0x008a_6848,
            0x00b8_9a5e,
            0x008a_6848,
            0x00c9_a36b,
            0x009c_763f,
        ),
        BronzeCiv::Sumer | BronzeCiv::Egipt => set(
            0x009a_7a50,
            0x00c9_a36b,
            0x009c_763f,
            0x00c9_a36b,
            0x00a0_7c44,
        ),
        BronzeCiv::Inka => set(
            0x008f_857a,
            0x00c6_a64e,
            0x008a_7a40,
            0x008a_8076,
            0x006f_665c,
        ),
        BronzeCiv::Aztek => set(
            0x008a_7f70,
            0x009a_8f80,
            0x0072_6a5c,
            0x009a_8f80,
            0x0072_6a5c,
        ),
        BronzeCiv::Chiny => set(
            0x008a_7058,
            0x00b8_9a5e,
            0x008a_6848,
            0x00e7_ddc7,
            0x00b2_3a2a,
        ),
        BronzeCiv::Zulu => set(
            0x009c_7b50,
            0x00c2_a766,
            0x008a_6a45,
            0x009c_7b50,
            0x008a_6a45,
        ),
        BronzeCiv::Celtowie => set(
            0x009a_8060,
            0x00b8_9a5e,
            0x008a_6a45,
            0x00cd_bb95,
            0x009a_8060,
        ),
        BronzeCiv::Germanie => set(
            0x008a_7048,
            0x008f_7a45,
            0x006f_5e34,
            0x00b8_a06a,
            0x008a_3a2a,
        ),
        BronzeCiv::Hetyci => set(
            0x008a_8a8a,
            0x0075_7575,
            0x0061_6161,
            0x009e_9e9e,
            0x0061_6161,
        ),
    };
    let mut p = Sp {
        mud: rbx(mud),
        thatch: rbx(thatch),
        brick: 0,
        brick_dk: 0,
        stone,
        stone_dk,
        wood,
        fire,
        gold,
        owner,
    };
    let _thatch_dk = rbx(thatch_dk);
    p.brick = rbx(brick);
    p.brick_dk = rbx(brick_dk);
    match civ {
        BronzeCiv::Sumer | BronzeCiv::Egipt => {
            p.stone = rbx(0x00c2_9a62);
            p.stone_dk = rbx(0x00a0_7c44);
            p.gold = rbx(0x00e6_c64a);
        }
        BronzeCiv::Aztek => p.stone = rbx(0x009a_8f80),
        BronzeCiv::Hetyci => {
            p.stone = rbx(0x009e_9e9e);
            p.stone_dk = rbx(0x0061_6161);
        }
        _ => {}
    }
    p
}

/// `blockRoof(g, w, h, d, y, m)`.
#[allow(clippy::too_many_arguments)]
fn block_roof(c: &mut CityModel, g: NodeId, w: f64, h: f64, d: f64, y: f64, m: CityMatId) {
    c.add_box(g, w, h * 0.45, d, 0.0, y, 0.0, m);
    c.add_box(g, w * 0.72, h * 0.35, d * 0.72, 0.0, y + h * 0.45, 0.0, m);
    c.add_box(g, w * 0.42, h * 0.22, d * 0.42, 0.0, y + h * 0.8, 0.0, m);
}

/// `lepianka(rad, seed, p)`.
fn lepianka(c: &mut CityModel, rad: f64, seed: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let w = rad * 1.5;
    let h = rad * (0.55 + rnd(seed, 2.0) * 0.25);
    let d = rad * 1.35;
    c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.mud);
    block_roof(c, g, w * 1.08, rad * 0.85, d * 1.08, h, p.thatch);
    g
}

/// `roundHut(rad, p)`.
fn round_hut(c: &mut CityModel, rad: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    c.add_cyl(g, rad * 0.95, rad, rad * 0.7, 0.0, 0.0, 0.0, p.mud, 8);
    c.add_cyl(
        g,
        rad * 1.05,
        rad * 0.4,
        rad * 0.75,
        0.0,
        rad * 0.7,
        0.0,
        p.thatch,
        8,
    );
    g
}

/// `longHut(rad, p)`.
fn long_hut(c: &mut CityModel, rad: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let w = rad * 2.2;
    let h = rad * 0.72;
    let d = rad * 1.05;
    c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.mud);
    c.add_box(g, w * 1.05, rad * 0.12, d * 1.08, 0.0, h, 0.0, p.thatch);
    g
}

/// `brickHut(rad, seed, p)`.
fn brick_hut(c: &mut CityModel, rad: f64, seed: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let w = rad * 1.6;
    let h = rad * (1.0 + rnd(seed, 3.0) * 0.35);
    let d = rad * 1.4;
    c.add_box(g, w, h, d, 0.0, 0.0, 0.0, p.brick);
    c.add_box(g, w * 1.05, rad * 0.1, d * 1.05, 0.0, h, 0.0, p.brick_dk);
    g
}

/// `beehiveHut(rad, p)`.
fn beehive_hut(c: &mut CityModel, rad: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    c.add_cyl(
        g,
        rad * 0.9,
        rad * 0.95,
        rad * 0.85,
        0.0,
        0.0,
        0.0,
        p.mud,
        8,
    );
    c.add_cyl(
        g,
        rad * 1.05,
        rad * 0.5,
        rad * 0.9,
        0.0,
        rad * 0.85,
        0.0,
        p.thatch,
        8,
    );
    g
}

/// `firePit(y, p)`.
fn fire_pit(c: &mut CityModel, y: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    c.add_cyl(g, 0.07, 0.075, 0.025, 0.0, y, 0.0, p.stone, 8);
    c.add_box(g, 0.05, 0.08, 0.05, 0.0, y + 0.02, 0.0, p.fire);
    g
}

/// `megalithCenter(scale, p)`.
fn megalith_center(c: &mut CityModel, scale: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let ring_r = 0.09 * scale;
    for i in 0..6u32 {
        let a = (f64::from(i) / 6.0) * PI * 2.0;
        c.add_box(
            g,
            0.035 * scale,
            0.14 * scale,
            0.028 * scale,
            js_cos(a) * ring_r,
            0.0,
            js_sin(a) * ring_r,
            p.stone,
        );
    }
    for sx in [-1.0, 1.0] {
        c.add_box(
            g,
            0.04 * scale,
            0.12 * scale,
            0.04 * scale,
            sx * 0.045 * scale,
            0.0,
            0.0,
            p.stone_dk,
        );
    }
    c.add_box(
        g,
        0.16 * scale,
        0.04 * scale,
        0.07 * scale,
        0.0,
        0.12 * scale,
        0.0,
        p.stone_dk,
    );
    g
}

/// `protoZiggurat(scale, p)`.
fn proto_ziggurat(c: &mut CityModel, scale: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let mut w = 0.28 * scale;
    let mut y = 0.0;
    for _ in 0..3 {
        let h = 0.045 * scale;
        c.add_box(g, w, h, w * 0.85, 0.0, y, 0.0, p.brick);
        y += h;
        w *= 0.74;
    }
    c.add_box(g, w * 1.1, 0.035 * scale, w * 0.9, 0.0, y, 0.0, p.gold);
    g
}

/// `protoObelisk(scale, p)`.
fn proto_obelisk(c: &mut CityModel, scale: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    c.add_cyl(
        g,
        0.018 * scale,
        0.024 * scale,
        0.22 * scale,
        0.0,
        0.0,
        0.0,
        p.brick,
        4,
    );
    c.add_cyl(
        g,
        0.024 * scale,
        0.01 * scale,
        0.05 * scale,
        0.0,
        0.24 * scale,
        0.0,
        p.gold,
        4,
    );
    g
}

/// `protoPyramid(steps, scale, p)`.
fn proto_pyramid(c: &mut CityModel, steps: u32, scale: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let mut w = 0.3 * scale;
    let mut y = 0.0;
    for _ in 0..steps {
        let h = 0.04 * scale;
        c.add_box(g, w, h, w, 0.0, y, 0.0, p.stone);
        y += h;
        w *= 0.78;
    }
    c.add_box(g, w * 1.1, 0.035 * scale, w * 1.1, 0.0, y, 0.0, p.gold);
    g
}

/// `protoNemeton(scale, p)`.
fn proto_nemeton(c: &mut CityModel, scale: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let ring_r = 0.1 * scale;
    for i in 0..6u32 {
        let a = (f64::from(i) / 6.0) * PI * 2.0;
        c.add_box(
            g,
            0.03 * scale,
            0.12 * scale,
            0.025 * scale,
            js_cos(a) * ring_r,
            0.0,
            js_sin(a) * ring_r,
            p.stone,
        );
    }
    c.add_cyl(
        g,
        0.022 * scale,
        0.026 * scale,
        0.16 * scale,
        0.0,
        0.0,
        0.0,
        p.wood,
        6,
    );
    g
}

/// `protoHittiteGate(scale, p)`.
fn proto_hittite_gate(c: &mut CityModel, scale: f64, p: &Sp) -> NodeId {
    let g = c.detached_group();
    let tw = 0.09 * scale;
    let th = 0.2 * scale;
    let gap = 0.08 * scale;
    for sx in [-1.0, 1.0] {
        let x = sx * (gap / 2.0 + tw / 2.0);
        c.add_box(g, tw, th, tw * 0.9, x, 0.0, 0.0, p.stone);
        c.add_box(g, tw * 1.08, 0.03 * scale, tw, x, th, 0.0, p.stone_dk);
    }
    c.add_box(
        g,
        gap + tw * 1.2,
        0.05 * scale,
        tw * 0.7,
        0.0,
        th * 0.75,
        0.0,
        p.stone_dk,
    );
    g
}

/// `protoCenter(civ, L, platH, p)` (`stoneCityRoblox.ts:258-308`).
fn proto_center(c: &mut CityModel, civ: StoneCiv, l: f64, plat_h: f64, p: &Sp) -> Option<NodeId> {
    let sc = 0.85 + (l - 6.0) * 0.08;
    if l >= 6.0 {
        return Some(match civ {
            BronzeCiv::Grecja | BronzeCiv::Rzym => megalith_center(c, sc, p),
            BronzeCiv::Sumer => proto_ziggurat(c, sc, p),
            BronzeCiv::Egipt => proto_obelisk(c, sc, p),
            BronzeCiv::Inka => proto_pyramid(c, 2, sc, p),
            BronzeCiv::Aztek => proto_pyramid(c, 4, sc, p),
            BronzeCiv::Chiny => {
                let g = c.detached_group();
                for (x, z) in [(-0.06, -0.06), (0.06, -0.06), (-0.06, 0.06), (0.06, 0.06)] {
                    c.add_cyl(g, 0.012, 0.014, 0.16 * sc, x * sc, 0.0, z * sc, p.wood, 5);
                }
                c.add_box(
                    g,
                    0.22 * sc,
                    0.04 * sc,
                    0.22 * sc,
                    0.0,
                    0.16 * sc,
                    0.0,
                    p.brick_dk,
                );
                g
            }
            BronzeCiv::Zulu => beehive_hut(c, 0.18 * sc, p),
            BronzeCiv::Celtowie => proto_nemeton(c, sc, p),
            BronzeCiv::Germanie => {
                let g = c.detached_group();
                for sx in [-1.0, 1.0] {
                    c.add_cyl(
                        g,
                        0.018 * sc,
                        0.022 * sc,
                        0.18 * sc,
                        sx * 0.08 * sc,
                        0.0,
                        0.05 * sc,
                        p.wood,
                        6,
                    );
                    c.add_box(
                        g,
                        0.04 * sc,
                        0.04 * sc,
                        0.04 * sc,
                        sx * 0.08 * sc,
                        0.2 * sc,
                        0.05 * sc,
                        p.brick_dk,
                    );
                }
                g
            }
            BronzeCiv::Hetyci => proto_hittite_gate(c, sc, p),
        });
    }
    if l >= 3.0 {
        let g = fire_pit(c, plat_h, p);
        if l >= 4.0
            && matches!(
                civ,
                BronzeCiv::Egipt | BronzeCiv::Grecja | BronzeCiv::Celtowie | BronzeCiv::Hetyci
            )
        {
            c.add_box(g, 0.03, 0.12, 0.025, 0.07, plat_h, 0.04, p.stone);
            c.add_box(g, 0.025, 0.1, 0.02, -0.06, plat_h, -0.03, p.stone_dk);
        }
        return Some(g);
    }
    None
}

/// `dwelling(civ, idx, rad, L, p)` (`stoneCityRoblox.ts:310-329`).
fn dwelling(c: &mut CityModel, civ: StoneCiv, idx: f64, rad: f64, l: f64, p: &Sp) -> NodeId {
    let adv = l >= 6.0 && idx % 3.0 == 1.0;
    match civ {
        BronzeCiv::Zulu => beehive_hut(c, rad, p),
        BronzeCiv::Celtowie => {
            if adv || idx % 2.0 == 0.0 {
                round_hut(c, rad, p)
            } else {
                lepianka(c, rad, idx, p)
            }
        }
        BronzeCiv::Germanie => {
            if idx % 4.0 == 0.0 {
                long_hut(c, rad, p)
            } else {
                round_hut(c, rad, p)
            }
        }
        BronzeCiv::Inka | BronzeCiv::Aztek => {
            if adv {
                brick_hut(c, rad, idx, p)
            } else {
                beehive_hut(c, rad, p)
            }
        }
        _ => {
            if adv {
                brick_hut(c, rad, idx, p)
            } else {
                lepianka(c, rad, idx, p)
            }
        }
    }
}

/// `hexWall(spread, p, mat)` (`stoneCityRoblox.ts:331-341`).
fn hex_wall(c: &mut CityModel, spread: f64, mat: CityMatId) -> NodeId {
    let g = c.detached_group();
    let hex_target = (WALL_HEX_FILL * HEX_R) / CITY_MODEL_SCALE;
    let outer = js_max(hex_target, spread * 1.18);
    let inner = js_max(outer - WALL_BAND, spread * 0.88);
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

/// Shared tail of both overloads: owner flag (`L >= 5`) and walls.
fn flag(c: &mut CityModel, l: f64, spread: f64, plat_h: f64, p: &Sp) {
    if l >= 5.0 {
        c.add_cyl(
            ROOT,
            0.012,
            0.014,
            0.28,
            spread * 0.88,
            plat_h,
            spread * 0.15,
            p.wood,
            6,
        );
        c.add_box(
            ROOT,
            0.055,
            0.045,
            0.002,
            spread * 0.88,
            plat_h + 0.3,
            spread * 0.18,
            p.owner,
        );
    }
}

/// `buildStoneAgeCityRoblox(civ, level, ownerCol, withWalls = false)` — the
/// per-civ overload (`buildStoneAgeCityRobloxPerCiv`, `:349-396`).
#[must_use]
pub fn build_stone_age_city_roblox(
    civ: StoneCiv,
    level: f64,
    owner_col: u32,
    with_walls: bool,
) -> CityModel {
    let l = js_max(1.0, js_min(10.0, js_round(level)));
    let mut c = CityModel::new();
    let p = stone_palette(&mut c, civ, owner_col);
    let hut_count = table_count(&HUT_COUNT, l);
    let spread = 0.11 + l * 0.045;
    let hut_r = 0.055;
    let plat_h = 0.025;

    c.add_cyl(
        ROOT,
        spread * 1.05,
        spread * 1.08,
        plat_h,
        0.0,
        0.0,
        0.0,
        p.mud,
        6,
    );
    if let Some(center) = proto_center(&mut c, civ, l, plat_h, &p) {
        c.node(center).position.y = plat_h;
        c.attach(ROOT, center);
    }

    let rings = [
        (4.0, spread * 0.55),
        (7.0, spread * 0.82),
        (14.0, spread * 1.08),
    ];
    let mut huts: Vec<(f64, f64, f64)> = Vec::new();
    place_rings(&rings, hut_count, |placed, ang, ring_r| {
        huts.push((placed, ang, ring_r))
    });
    for (placed, ang, ring_r) in huts {
        let rr = ring_r * (0.82 + rnd(placed, 2.0) * 0.28);
        let hut = dwelling(
            &mut c,
            civ,
            placed,
            hut_r * (0.9 + rnd(placed, 3.0) * 0.25),
            l,
            &p,
        );
        c.set_pos(hut, js_cos(ang) * rr, plat_h, js_sin(ang) * rr);
        let rot = if civ == BronzeCiv::Germanie {
            js_atan2(-js_sin(ang), -js_cos(ang))
        } else {
            js_round(rnd(placed, 4.0) * 4.0) * (PI / 2.0)
        };
        c.set_rot_y(hut, rot);
        c.attach(ROOT, hut);
    }

    flag(&mut c, l, spread, plat_h, &p);
    if with_walls {
        let mat = if matches!(
            civ,
            BronzeCiv::Zulu | BronzeCiv::Germanie | BronzeCiv::Celtowie
        ) {
            p.wood
        } else {
            p.stone
        };
        let w = hex_wall(&mut c, spread, mat);
        c.attach(ROOT, w);
    }
    c
}

/// `buildStoneAgeCityRoblox(level, ownerCol, withWalls = false)` — the
/// level-only overload (`buildStoneAgeCityRobloxUniversal`, `:399-443`):
/// Greek palette, fire pit from level 3, only `lepianka` huts.
#[must_use]
pub fn build_stone_age_city_roblox_universal(
    level: f64,
    owner_col: u32,
    with_walls: bool,
) -> CityModel {
    let l = js_max(1.0, js_min(10.0, js_round(level)));
    let mut c = CityModel::new();
    let p = stone_palette(&mut c, BronzeCiv::Grecja, owner_col);
    let hut_count = table_count(&HUT_COUNT, l);
    let spread = 0.11 + l * 0.045;
    let hut_r = 0.055;
    let plat_h = 0.025;

    c.add_cyl(
        ROOT,
        spread * 1.05,
        spread * 1.08,
        plat_h,
        0.0,
        0.0,
        0.0,
        p.mud,
        6,
    );
    if l >= 3.0 {
        let center = fire_pit(&mut c, plat_h, &p);
        c.node(center).position.y = plat_h;
        c.attach(ROOT, center);
    }

    let rings = [
        (4.0, spread * 0.55),
        (7.0, spread * 0.82),
        (14.0, spread * 1.08),
    ];
    let mut huts: Vec<(f64, f64, f64)> = Vec::new();
    place_rings(&rings, hut_count, |placed, ang, ring_r| {
        huts.push((placed, ang, ring_r))
    });
    for (placed, ang, ring_r) in huts {
        let rr = ring_r * (0.82 + rnd(placed, 2.0) * 0.28);
        let hut = lepianka(&mut c, hut_r * (0.9 + rnd(placed, 3.0) * 0.25), placed, &p);
        c.set_pos(hut, js_cos(ang) * rr, plat_h, js_sin(ang) * rr);
        c.set_rot_y(hut, js_round(rnd(placed, 4.0) * 4.0) * (PI / 2.0));
        c.attach(ROOT, hut);
    }

    flag(&mut c, l, spread, plat_h, &p);
    if with_walls {
        let w = hex_wall(&mut c, spread, p.stone);
        c.attach(ROOT, w);
    }
    c
}
