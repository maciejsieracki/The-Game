//! `render/robloxImprovements.ts` (`edb8fb56`): the 24 `BUILDERS`, the food
//! stack compositions (`buildRobloxFoodStack`) and their local helpers,
//! plus `buildStyleTarasyTerrace('roblox', …)` of `render/mapRenderStyle.ts`
//! (the terraces builder that `BUILDERS.tarasy` calls).
//!
//! `setImprovementDetailQuality` (`:33-34`) only stores a value that no
//! builder reads, so it has no Rust counterpart.

#![allow(clippy::too_many_arguments)]

use std::f64::consts::PI;

use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{NodeId, Prim, ROOT};

use super::droga::{build_droga_gwiazda_into, RoadTyp, ROAD_MASK_FULL};
use super::kopalnie::{build_kopalnia_cyny_into, build_kopalnia_zlota_into, MineMats};
use super::model::ImprovementExt;
use super::model::ImprovementModel;
use super::p2::{self, WariantFarmy};
use super::p3a;
use super::p3b;
use super::zasoby::{place_livestock_pair, Livestock};
use super::zwierzeta::{build_lama_into, build_trzoda_into, build_zloze_owce_into, JakoscTrzody};

/// Palette `C` (`robloxImprovements.ts:57-80`), entries the live code uses.
mod pal {
    pub const SOIL: u32 = 0x8b6914;
    pub const CROP: u32 = 0x7cfc00;
    pub const CROP_DK: u32 = 0x44aa22;
    pub const WATER: u32 = 0x00bfff;
    pub const WOOD: u32 = 0xcd853f;
    pub const WOOD_DK: u32 = 0x8b4513;
}
use pal::*;

/// Local `box` + `addBox(g, w, h, d, x, y, z, c)`: bottom at `y`, new
/// material, cast + receive shadow.
pub(super) fn add_box(
    m: &mut ImprovementModel,
    g: NodeId,
    w: f64,
    h: f64,
    d: f64,
    x: f64,
    y: f64,
    z: f64,
    c: u32,
) {
    let mat = m.lambert(c);
    let id = m.mesh(g, Prim::bx(w, h, d), mat);
    m.node(id).set_pos(x, y + h / 2.0, z);
    m.shadows(id, true, true);
}

/// `rbxFarmHut(g, x, z, scale = 1)` (`:105-114`).
pub(super) fn rbx_farm_hut(m: &mut ImprovementModel, g: NodeId, x: f64, z: f64, scale: f64) {
    let w = 0.14 * scale;
    let h = 0.11 * scale;
    add_box(m, g, w, h, w * 0.9, x, 0.0, z, WOOD_DK);
    let mat = m.lambert(0xff7043);
    let roof = m.mesh(g, Prim::cone(w * 0.85, h * 0.95, 4), mat);
    m.node(roof).set_pos(x, h + h * 0.42, z).rot_y(PI / 4.0);
    m.shadows(roof, true, false);
}

/// `rbxFarmMiniField(g, cx, cz, w, d)` (`:116-128`).
pub(super) fn rbx_farm_mini_field(
    m: &mut ImprovementModel,
    g: NodeId,
    cx: f64,
    cz: f64,
    w: f64,
    d: f64,
) {
    add_box(m, g, w, 0.03, d, cx, 0.0, cz, SOIL);
    for row in 0..2_u32 {
        for col in 0..3_u32 {
            let px = cx - w * 0.32 + f64::from(col) * (w * 0.32);
            let pz = cz - d * 0.28 + f64::from(row) * (d * 0.38);
            let c = if (row + col) % 2 == 1 { CROP } else { CROP_DK };
            add_box(m, g, 0.05, 0.1, 0.05, px, 0.03, pz, c);
            add_box(m, g, 0.035, 0.05, 0.035, px, 0.12, pz, CROP_DK);
        }
    }
}

/// `rbxFarmSettlement(g, { livestock })` (`:131-139`).
pub(super) fn rbx_farm_settlement(m: &mut ImprovementModel, g: NodeId, bydlo: bool) {
    rbx_farm_hut(m, g, -0.46, 0.22, 1.0);
    rbx_farm_hut(m, g, -0.46, -0.18, 0.82);
    add_box(m, g, 0.08, 0.06, 0.1, -0.46, 0.03, -0.02, WOOD);
    rbx_farm_mini_field(m, g, -0.38, 0.02, 0.44, 0.4);
    if bydlo {
        place_livestock_pair(m, g, Livestock::Cow, 0.4, 0.02);
    }
}

/// `rbxIrygacjaLarge(g, false)` (`:258-277`; `cornerHut` is never true).
pub(super) fn rbx_irygacja_large(m: &mut ImprovementModel, g: NodeId) {
    add_box(m, g, 1.42, 0.04, 1.22, 0.0, 0.0, 0.0, SOIL);
    for z in [-0.34, 0.0, 0.34] {
        add_box(m, g, 1.36, 0.06, 0.12, 0.0, 0.04, z, WATER);
        add_box(m, g, 1.36, 0.07, 0.05, 0.0, 0.04, z + 0.1, WOOD_DK);
        add_box(m, g, 1.36, 0.07, 0.05, 0.0, 0.04, z - 0.1, WOOD_DK);
    }
    let row_z = [-0.17, -0.51, 0.17, 0.51];
    for (ri, &z) in row_z.iter().enumerate() {
        for j in 0..7_u32 {
            let x = -0.54 + f64::from(j) * 0.18;
            let (c1, c2) = if ri % 2 == 1 {
                (CROP, CROP_DK)
            } else {
                (CROP_DK, CROP)
            };
            add_box(m, g, 0.07, 0.13, 0.07, x, 0.05, z, c1);
            let dz = if j % 2 == 1 { 0.04 } else { -0.04 };
            add_box(m, g, 0.04, 0.06, 0.04, x + 0.04, 0.04, z + dz, c2);
        }
    }
}

/// `buildStyleTarasyTerrace('roblox', lite, R)` (`mapRenderStyle.ts:988-1000`
/// → `addSteppedTerraceHill(…, 'roblox', lite, 'cultivated')`, `:885-985`)
/// into `g`.
pub fn build_style_tarasy_terrace_into(
    m: &mut ImprovementModel,
    g: NodeId,
    lite: bool,
    r_hex: f64,
) {
    let (q, r, x, z, base_y, seed) = (0, 0, 0.0, 0.0, 0.0, 17);
    let tiers = if lite { 3 } else { 5 };
    let yaw = (hash2d_style(q, r, seed, 4) * 6.0).floor() * (PI / 3.0);
    let wall_color = 0xc4a574;
    let wall_dk = 0xa08050;
    let grass_a = 0x55ee55;
    let grass_b = 0x44cc55;
    let face_color = wall_dk;
    let mut radius = r_hex * 0.9;
    let mut y = base_y;
    for i in 0..tiers {
        let wall_h = 0.048 + if i == 0 { 0.012 } else { 0.0 };
        let wm = m.lambert(if i % 2 == 1 { wall_color } else { wall_dk });
        let wall = m.mesh(g, Prim::cyl(radius, radius * 1.03, wall_h, 6), wm);
        m.node(wall).set_pos(x, y + wall_h / 2.0, z).rot_y(yaw);
        m.shadows(wall, true, true);
        let top_h = 0.028;
        let top_r = radius * 0.86;
        let tc = if i == tiers - 1 {
            grass_a
        } else if i % 2 == 1 {
            grass_b
        } else {
            grass_a
        };
        let tm = m.lambert(tc);
        let top = m.mesh(g, Prim::cyl(top_r, top_r, top_h, 6), tm);
        m.node(top)
            .set_pos(x, y + wall_h + top_h / 2.0, z)
            .rot_y(yaw);
        m.shadows(top, true, true);
        if !lite && i >= 1 {
            let fm = m.lambert(face_color);
            let face = m.mesh(g, Prim::bx(radius * 0.92, wall_h * 1.15, 0.07), fm);
            m.node(face)
                .set_pos(
                    x + js_cos(yaw) * radius * 0.52,
                    y + wall_h / 2.0,
                    z + js_sin(yaw) * radius * 0.52,
                )
                .rot_y(yaw);
            m.shadows(face, true, false);
        }
        y += wall_h + top_h;
        radius *= 0.74;
    }
    if !lite {
        let shrub_count = 1 + (hash2d_style(q, r, seed, 8) * 2.0).floor() as i32;
        for si in 0..shrub_count {
            let angle = yaw + hash2d_style(q, r, seed, 200 + si) * 0.8 - 0.4;
            let spread = hash2d_style(q, r, seed, 230 + si) * r_hex * 0.22;
            let sx = x + js_cos(angle) * spread;
            let sz = z + js_sin(angle) * spread;
            let bb = r_hex * 0.07;
            let sm = m.lambert(0x2d8a27);
            let shrub = m.mesh(g, Prim::bx(bb, bb * 1.3, bb), sm);
            m.node(shrub).set_pos(sx, y + bb * 0.5, sz);
            m.shadows(shrub, true, false);
        }
    }
}

/// `hash2D(q, r, seed, salt)` of `mapRenderStyle.ts:345-351` (note: a
/// shorter mix than the `scene.ts` hash in `terrain::hash2d`).
#[must_use]
#[allow(clippy::cast_sign_loss)]
pub fn hash2d_style(q: i32, r: i32, seed: i32, salt: i32) -> f64 {
    let mut h = (q as u32).wrapping_mul(0x27d4_eb2d)
        ^ (r as u32).wrapping_mul(0x1656_67b1)
        ^ (seed as u32).wrapping_mul(0x9e37_79b1)
        ^ (salt as u32).wrapping_mul(0x85eb_ca6b);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2c1b_3c6d);
    h ^= h >> 12;
    f64::from(h) / 4_294_967_296.0
}

/// `buildStyleTarasyTerrace('roblox', lite, R)` as a standalone model.
#[must_use]
pub fn build_style_tarasy_terrace(lite: bool, r_hex: f64) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_style_tarasy_terrace_into(&mut m, ROOT, lite, r_hex);
    m
}

/// Builds a sub-group with `f`, sets `rotation.y = rot_y` and adds it to `g`
/// (the `const m = buildX(); m.rotation.y = …; g.add(m)` pattern).
fn sub_rot(
    m: &mut ImprovementModel,
    g: NodeId,
    rot_y: Option<f64>,
    f: impl FnOnce(&mut ImprovementModel, NodeId),
) {
    let s = m.detached();
    f(m, s);
    if let Some(r) = rot_y {
        m.node(s).rot_y(r);
    }
    m.attach(g, s);
}

/// `BUILDERS[key](g, owner)` (`:388-427`). Returns `false` for a key that is
/// not in `BUILDERS` (the web then leaves `g` empty).
pub fn roblox_builder(
    m: &mut ImprovementModel,
    cache: &mut MineMats,
    g: NodeId,
    key: &str,
    owner: u32,
) -> bool {
    match key {
        "droga" => sub_rot(m, g, None, |m, s| {
            build_droga_gwiazda_into(m, s, RoadTyp::Droga, ROAD_MASK_FULL, 1.0);
        }),
        "droga_brukowana" => sub_rot(m, g, None, |m, s| {
            build_droga_gwiazda_into(m, s, RoadTyp::DrogaBrukowana, ROAD_MASK_FULL, 1.0);
        }),
        "farma" => sub_rot(m, g, None, |m, s| {
            p2::build_farma_into(m, s, WariantFarmy::Solo)
        }),
        "bydlo" => sub_rot(m, g, None, |m, s| {
            build_trzoda_into(m, s, JakoscTrzody::Wysoka, 1.0);
        }),
        "owce" => sub_rot(m, g, None, |m, s| build_zloze_owce_into(m, s, 1.0)),
        "lama" => {
            let l = m.detached();
            build_lama_into(m, l);
            m.node(l).set_pos(0.63, 0.0, 0.04);
            m.attach(g, l);
        }
        "stadnina" => sub_rot(m, g, None, |m, s| p3a::build_stadnina_into(m, s, 1)),
        "kopalnia_zelaza" | "kopalnia_miedzi" => {
            sub_rot(
                m,
                g,
                Some(p2::layout::KOPALNIA_ROT_Y),
                p2::build_kopalnia_into,
            );
        }
        "kamieniolom" => {
            sub_rot(
                m,
                g,
                Some(p2::layout::KAMIENIOLOM_ROT_Y),
                p2::build_kamieniolom_into,
            );
        }
        "oboz_lowiecki" => sub_rot(
            m,
            g,
            Some(p3a::layout::OBOZ_LOWIECKI_ROT_Y),
            p3a::build_oboz_lowiecki_into,
        ),
        "wyrab" => sub_rot(m, g, Some(p3a::layout::WYRAB_ROT_Y), p3a::build_wyrab_into),
        "tartak" => sub_rot(m, g, Some(p2::layout::TARTAK_ROT_Y), p2::build_tartak_into),
        "irygacja" => sub_rot(
            m,
            g,
            Some(p3b::layout::IRYGACJA_ROT_Y),
            p3b::build_irygacja_into,
        ),
        "pole_irygowane" => sub_rot(
            m,
            g,
            Some(p3b::layout::POLE_IRYGOWANE_ROT_Y),
            p3b::build_pole_irygowane_into,
        ),
        "glinianka" => sub_rot(
            m,
            g,
            Some(p3a::layout::GLINIANKA_ROT_Y),
            p3a::build_glinianka_into,
        ),
        "tarasy" => sub_rot(m, g, None, |m, s| {
            build_style_tarasy_terrace_into(m, s, false, 0.88)
        }),
        "lodzie_rybackie" => sub_rot(
            m,
            g,
            Some(p3a::layout::LODZIE_RYBACKIE_ROT_Y),
            p3a::build_lodzie_rybackie_into,
        ),
        "warzelnia_soli" => sub_rot(
            m,
            g,
            Some(p3a::layout::WARZELNIA_SOLI_ROT_Y),
            p3a::build_warzelnia_soli_into,
        ),
        "fort" => sub_rot(m, g, Some(p3b::layout::FORT_ROT_Y), |m, s| {
            p3b::build_fort_into(m, s, owner);
        }),
        "posterunek" => sub_rot(m, g, Some(p3b::layout::POSTERUNEK_ROT_Y), |m, s| {
            p3b::build_posterunek_into(m, s, owner);
        }),
        "pastwisko" => {
            sub_rot(m, g, Some(p2::layout::FARMA_PASTWISKO_ROT_Y), |m, s| {
                p2::build_farma_into(m, s, WariantFarmy::Pastwisko);
            });
            sub_rot(m, g, None, |m, s| {
                build_trzoda_into(m, s, JakoscTrzody::Wysoka, 1.0)
            });
            sub_rot(m, g, None, |m, s| p2::build_zagroda_dodatki_into(m, s, 1.0));
        }
        "kopalnia_zlota" => sub_rot(m, g, None, |m, s| build_kopalnia_zlota_into(m, cache, s)),
        "kopalnia_cyny" => sub_rot(m, g, None, |m, s| build_kopalnia_cyny_into(m, cache, s)),
        _ => return false,
    }
    true
}

/// `FOOD_STACK_KEYS` (`:436`).
pub const FOOD_STACK_KEYS: [&str; 4] = ["farma", "irygacja", "bydlo", "owce"];

/// `buildRobloxFoodStack(keys)` (`:439-484`) into `g`; `false` = the web
/// `null` (no food key).
pub fn build_roblox_food_stack_into(m: &mut ImprovementModel, g: NodeId, keys: &[&str]) -> bool {
    let n: Vec<&str> = keys
        .iter()
        .copied()
        .filter(|k| !k.is_empty() && *k != "brak" && FOOD_STACK_KEYS.contains(k))
        .collect();
    if n.is_empty() {
        return false;
    }
    let has = |k: &str| n.contains(&k);
    let (f, i, b, o) = (has("farma"), has("irygacja"), has("bydlo"), has("owce"));
    if f && b && o {
        rbx_farm_settlement(m, g, false);
        place_livestock_pair(m, g, Livestock::Cow, 0.44, 0.24);
        place_livestock_pair(m, g, Livestock::Sheep, 0.34, -0.34);
    } else if f && i {
        rbx_irygacja_large(m, g);
        rbx_farm_settlement(m, g, false);
    } else if f && b {
        rbx_farm_settlement(m, g, true);
    } else if f && o {
        rbx_farm_settlement(m, g, false);
        place_livestock_pair(m, g, Livestock::Sheep, 0.44, 0.24);
    } else if b && o {
        place_livestock_pair(m, g, Livestock::Cow, 0.12, 0.08);
        place_livestock_pair(m, g, Livestock::Sheep, -0.12, -0.08);
    } else if f {
        rbx_farm_settlement(m, g, false);
    } else if i {
        rbx_irygacja_large(m, g);
    } else if b {
        place_livestock_pair(m, g, Livestock::Cow, 0.02, 0.0);
    } else {
        place_livestock_pair(m, g, Livestock::Sheep, 0.02, 0.0);
    }
    true
}

/// `buildRobloxFoodStack(keys)` as a standalone model (`None` = `null`).
#[must_use]
pub fn build_roblox_food_stack(keys: &[&str]) -> Option<ImprovementModel> {
    let mut m = ImprovementModel::new();
    build_roblox_food_stack_into(&mut m, ROOT, keys).then_some(m)
}
