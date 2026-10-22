//! The 15 `rbx*` builders of `render/robloxImprovements.ts` (`edb8fb56`) that
//! no web code calls any more, plus their local `addCyl` (`:49-54`).
//!
//! Ported because of the owner decision D-MOD-3 = B ("port ALL existing
//! models, also unused ones"); these are `roblox`-style models, so D-MOD-1
//! (roblox only) does not exclude them. In the web file they are private
//! (not exported) and unreachable from `BUILDERS` (`:388-427`); the reference
//! vectors (`tests/fixtures/improvements/legacy.json`) come from the web
//! module with only an `export { … }` line appended in the scratch copy, see
//! `tests/fixtures/improvements/README.md`.
//!
//! The functions the live code still uses (`rbxFarmHut`, `rbxFarmMiniField`,
//! `rbxFarmSettlement`, `rbxIrygacjaLarge`, `addBox`) are shared with
//! [`super::roblox`].

#![allow(clippy::too_many_arguments)]

use std::f64::consts::PI;

use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::{NodeId, Prim, ROOT};

use super::model::ImprovementModel;
use super::roblox::{
    add_box, rbx_farm_hut, rbx_farm_mini_field, rbx_farm_settlement, rbx_irygacja_large,
};
use super::zasoby::{place_livestock_pair, Livestock};

/// Palette `C` (`robloxImprovements.ts:57-80`), entries these builders use.
mod pal {
    pub const ROAD: u32 = 0xc4a574;
    pub const ROAD_DASH: u32 = 0xffee88;
    pub const COBBLE: u32 = 0x8899aa;
    pub const WOOD: u32 = 0xcd853f;
    pub const WOOD_DK: u32 = 0x8b4513;
    pub const HIDE: u32 = 0xffa726;
    pub const FIRE: u32 = 0xff5722;
    pub const ORE: u32 = 0xff8800;
    pub const STONE: u32 = 0xaabbcc;
    pub const STONE_DK: u32 = 0x667788;
    pub const CLAY: u32 = 0xff8844;
    pub const SALT: u32 = 0xffffff;
    pub const BRINE: u32 = 0xaaddff;
    pub const FISH: u32 = 0x80deea;
    pub const TENT: u32 = 0xff7043;
}
use pal::*;

/// `addCyl(g, rt, rb, h, x, y, z, c, seg = 6)` (`:49-54`): bottom at `y`, new
/// material, `castShadow` only.
pub fn add_cyl(
    m: &mut ImprovementModel,
    g: NodeId,
    rt: f64,
    rb: f64,
    h: f64,
    x: f64,
    y: f64,
    z: f64,
    c: u32,
    seg: u32,
) {
    let mat = m.lambert(c);
    let id = m.mesh(g, Prim::cyl(rt, rb, h, seg), mat);
    m.node(id).set_pos(x, y + h / 2.0, z);
    m.shadows(id, true, false);
}

/// `const x = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), mat(c));
/// x.position.set(…); x.rotation.y = Math.PI / 4; x.castShadow = true;
/// g.add(x)` — the pattern of every pyramid roof / tent in this file.
fn cone4(m: &mut ImprovementModel, g: NodeId, r: f64, h: f64, x: f64, y: f64, z: f64, c: u32) {
    let mat = m.lambert(c);
    let id = m.mesh(g, Prim::cone(r, h, 4), mat);
    m.node(id).set_pos(x, y, z).rot_y(PI / 4.0);
    m.shadows(id, true, false);
}

/// The uncalled builders, in file order.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RbxLegacy {
    /// `rbxDroga` (`:82-93`).
    Droga,
    /// `rbxDrogaBrukowana` (`:95-103`).
    DrogaBrukowana,
    /// `rbxFarma` (`:146-148`).
    Farma,
    /// `rbxPastwisko` (`:150-154`).
    Pastwisko,
    /// `rbxKopalnia` (`:188-199`).
    Kopalnia,
    /// `rbxKamieniolom` (`:201-211`).
    Kamieniolom,
    /// `rbxObozLowiecki` (`:213-226`).
    ObozLowiecki,
    /// `rbxWyrab` (`:228-239`).
    Wyrab,
    /// `rbxTartak` (`:241-256`).
    Tartak,
    /// `rbxPoleIrygowane` (`:290-292`).
    PoleIrygowane,
    /// `rbxGlinianka` (`:294-303`).
    Glinianka,
    /// `rbxLodzie` (`:309-319`).
    Lodzie,
    /// `rbxWarzelniaSoli` (`:321-332`).
    WarzelniaSoli,
    /// `rbxFort(g, ownerCol)` (`:334-359`).
    Fort,
    /// `rbxPosterunek(g, ownerCol)` (`:361-386`).
    Posterunek,
}

impl RbxLegacy {
    /// All 15, in file order.
    pub const ALL: [Self; 15] = [
        Self::Droga,
        Self::DrogaBrukowana,
        Self::Farma,
        Self::Pastwisko,
        Self::Kopalnia,
        Self::Kamieniolom,
        Self::ObozLowiecki,
        Self::Wyrab,
        Self::Tartak,
        Self::PoleIrygowane,
        Self::Glinianka,
        Self::Lodzie,
        Self::WarzelniaSoli,
        Self::Fort,
        Self::Posterunek,
    ];

    /// The web function name.
    #[must_use]
    pub fn web_name(self) -> &'static str {
        match self {
            Self::Droga => "rbxDroga",
            Self::DrogaBrukowana => "rbxDrogaBrukowana",
            Self::Farma => "rbxFarma",
            Self::Pastwisko => "rbxPastwisko",
            Self::Kopalnia => "rbxKopalnia",
            Self::Kamieniolom => "rbxKamieniolom",
            Self::ObozLowiecki => "rbxObozLowiecki",
            Self::Wyrab => "rbxWyrab",
            Self::Tartak => "rbxTartak",
            Self::PoleIrygowane => "rbxPoleIrygowane",
            Self::Glinianka => "rbxGlinianka",
            Self::Lodzie => "rbxLodzie",
            Self::WarzelniaSoli => "rbxWarzelniaSoli",
            Self::Fort => "rbxFort",
            Self::Posterunek => "rbxPosterunek",
        }
    }
}

fn rbx_droga(m: &mut ImprovementModel, g: NodeId) {
    add_box(m, g, 1.75, 0.07, 0.52, 0.0, 0.0, 0.0, ROAD);
    add_box(m, g, 1.78, 0.02, 0.54, 0.0, 0.08, 0.0, 0x6b5344);
    for i in -3..=3_i32 {
        add_box(
            m,
            g,
            0.12,
            0.035,
            0.08,
            f64::from(i) * 0.22,
            0.09,
            0.0,
            ROAD_DASH,
        );
    }
    for z in [-0.23, 0.23] {
        for i in -4..=4_i32 {
            // JS `i % 2` is -1/0/1; truthy for odd `i` of either sign.
            let c = if i % 2 != 0 { COBBLE } else { 0x778899 };
            add_box(m, g, 0.1, 0.05, 0.1, f64::from(i) * 0.2, 0.075, z, c);
        }
    }
}

fn rbx_droga_brukowana(m: &mut ImprovementModel, g: NodeId) {
    add_box(m, g, 1.75, 0.08, 0.54, 0.0, 0.0, 0.0, COBBLE);
    for row in 0..4_u32 {
        for col in 0..8_u32 {
            let c = if (row + col) % 2 == 1 {
                0xc4b8a8
            } else {
                0x908878
            };
            add_box(
                m,
                g,
                0.18,
                0.04,
                0.1,
                -0.63 + f64::from(col) * 0.18,
                0.06,
                -0.15 + f64::from(row) * 0.1,
                c,
            );
        }
    }
}

fn rbx_pastwisko(m: &mut ImprovementModel, g: NodeId) {
    rbx_farm_hut(m, g, -0.44, 0.18, 0.88);
    rbx_farm_mini_field(m, g, -0.38, -0.06, 0.4, 0.34);
    place_livestock_pair(m, g, Livestock::Cow, 0.36, 0.02);
}

fn rbx_kopalnia(m: &mut ImprovementModel, g: NodeId) {
    add_cyl(m, g, 0.55, 0.72, 0.2, 0.0, 0.1, 0.1, STONE_DK, 6);
    add_box(m, g, 0.36, 0.28, 0.08, 0.0, 0.22, 0.38, WOOD);
    add_box(m, g, 0.24, 0.2, 0.06, 0.0, 0.18, 0.42, 0x1a1208);
    for (x, z) in [(-0.28, 0.2), (0.3, 0.08), (0.08, -0.22)] {
        add_box(m, g, 0.12, 0.12, 0.12, x, 0.22, z, ORE);
    }
    add_box(m, g, 0.22, 0.12, 0.16, 0.42, 0.12, -0.08, WOOD_DK);
    for sx in [-1.0, 1.0] {
        add_cyl(
            m,
            g,
            0.05,
            0.05,
            0.04,
            0.42,
            0.04,
            -0.08 + sx * 0.08,
            0x222222,
            8,
        );
    }
}

fn rbx_kamieniolom(m: &mut ImprovementModel, g: NodeId) {
    add_cyl(m, g, 0.62, 0.58, 0.06, 0.0, 0.03, 0.0, STONE_DK, 8);
    let mut y = 0.06;
    for i in 0..3_u32 {
        let fi = f64::from(i);
        let s = 0.48 - fi * 0.1;
        let c = if i % 2 == 1 { STONE } else { 0xb0bec5 };
        add_box(m, g, s, 0.1, s, -0.08 + fi * 0.04, y, -0.04 + fi * 0.04, c);
        y += 0.1;
    }
    add_box(m, g, 0.18, 0.14, 0.18, 0.38, 0.1, 0.28, STONE);
    add_box(m, g, 0.14, 0.1, 0.14, 0.42, 0.08, -0.12, STONE);
}

fn rbx_oboz_lowiecki(m: &mut ImprovementModel, g: NodeId) {
    cone4(m, g, 0.34, 0.52, -0.12, 0.26, 0.0, TENT);
    add_box(m, g, 0.04, 0.04, 0.42, 0.42, 0.34, 0.0, WOOD_DK);
    for sx in [-1.0, 1.0] {
        add_cyl(m, g, 0.02, 0.025, 0.36, 0.42, 0.18, sx * 0.18, WOOD_DK, 5);
    }
    add_box(m, g, 0.04, 0.2, 0.24, 0.42, 0.22, 0.0, HIDE);
    add_box(m, g, 0.1, 0.1, 0.1, -0.1, 0.08, 0.42, FIRE);
    add_box(m, g, 0.06, 0.14, 0.06, -0.1, 0.16, 0.42, 0xffab00);
}

fn rbx_wyrab(m: &mut ImprovementModel, g: NodeId) {
    for i in 0..3_u32 {
        let mat = m.lambert(WOOD);
        let log = m.mesh(g, Prim::cyl(0.08, 0.08, 0.65, 6), mat);
        m.node(log).rot_x(PI / 2.0).set_pos(
            -0.18,
            0.1 + f64::from(i % 2) * 0.14,
            -0.08 + f64::from(i) * 0.16,
        );
        m.shadows(log, true, false);
    }
    add_cyl(m, g, 0.14, 0.15, 0.14, 0.36, 0.07, 0.26, WOOD_DK, 8);
    add_cyl(m, g, 0.014, 0.014, 0.32, 0.36, 0.2, 0.26, WOOD_DK, 5);
    add_box(m, g, 0.12, 0.08, 0.03, 0.46, 0.32, 0.26, 0xb0bec5);
}

fn rbx_tartak(m: &mut ImprovementModel, g: NodeId) {
    add_box(m, g, 0.58, 0.1, 0.48, 0.0, 0.05, 0.0, WOOD_DK);
    add_box(m, g, 0.38, 0.05, 0.03, 0.0, 0.14, 0.0, 0xeceff1);
    for i in 0..2_u32 {
        let fi = f64::from(i);
        let mat = m.lambert(WOOD);
        let log = m.mesh(g, Prim::cyl(0.07, 0.07, 0.52, 6), mat);
        m.node(log)
            .rot_z(PI / 2.0)
            .set_pos(-0.04, 0.12 + fi * 0.14, -0.06 + fi * 0.18);
        m.shadows(log, true, false);
    }
    cone4(m, g, 0.3, 0.16, 0.16, 0.26, 0.0, WOOD_DK);
}

fn rbx_glinianka(m: &mut ImprovementModel, g: NodeId) {
    add_cyl(m, g, 0.58, 0.52, 0.08, 0.0, 0.04, 0.0, 0x6d4c2b, 10);
    add_cyl(m, g, 0.42, 0.42, 0.03, 0.0, 0.08, 0.0, 0x7a5230, 10);
    for (x, z) in [(-0.32, 0.28), (0.38, 0.18), (0.18, -0.32)] {
        add_box(m, g, 0.14, 0.1, 0.14, x, 0.08, z, CLAY);
    }
    for (x, z) in [(-0.08, 0.38), (0.14, 0.4)] {
        add_cyl(m, g, 0.06, 0.08, 0.14, x, 0.1, z, CLAY, 6);
    }
}

fn rbx_lodzie(m: &mut ImprovementModel, g: NodeId) {
    let mat = m.lambert(WOOD);
    let hull = m.mesh(g, Prim::bx(0.22, 0.12, 0.62), mat);
    m.node(hull).set_pos(0.0, 0.08, 0.0);
    m.shadows(hull, true, false);
    add_cyl(m, g, 0.014, 0.014, 0.32, 0.0, 0.22, 0.0, WOOD_DK, 5);
    add_box(m, g, 0.02, 0.18, 0.2, 0.0, 0.26, 0.04, 0xffffff);
    for i in 0..4_u32 {
        add_box(
            m,
            g,
            0.06,
            0.04,
            0.1,
            -0.28 + f64::from(i) * 0.18,
            0.04,
            0.34,
            FISH,
        );
    }
}

fn rbx_warzelnia_soli(m: &mut ImprovementModel, g: NodeId) {
    for (gx, gz) in [(-0.34, -0.34), (0.34, -0.34), (-0.34, 0.34), (0.34, 0.34)] {
        add_box(m, g, 0.48, 0.06, 0.48, gx, 0.03, gz, WOOD_DK);
        add_box(m, g, 0.4, 0.03, 0.4, gx, 0.07, gz, BRINE);
        add_box(m, g, 0.34, 0.04, 0.34, gx, 0.09, gz, SALT);
    }
    cone4(m, g, 0.14, 0.2, 0.0, 0.12, 0.0, SALT);
}

fn rbx_fort(m: &mut ImprovementModel, g: NodeId, owner_col: u32) {
    let inner = m.detached();
    let s = 0.62;
    let h = 0.24;
    add_box(m, inner, s * 2.1, 0.06, s * 2.1, 0.0, 0.03, 0.0, STONE_DK);
    let wall = |m: &mut ImprovementModel, w: f64, d: f64, x: f64, z: f64| {
        add_box(m, inner, w, h, d, x, 0.06, z, STONE);
    };
    wall(m, s * 2.0, 0.08, 0.0, -s);
    wall(m, 0.08, s * 2.0, -s, 0.0);
    wall(m, 0.08, s * 2.0, s, 0.0);
    wall(m, s * 0.68, 0.08, -s * 0.64, s);
    wall(m, s * 0.68, 0.08, s * 0.64, s);
    for sx in [-1.0, 1.0] {
        for sz in [-1.0, 1.0] {
            add_box(m, inner, 0.22, 0.36, 0.22, sx * s, 0.12, sz * s, WOOD_DK);
            cone4(m, inner, 0.2, 0.16, sx * s, 0.38, sz * s, 0xff7043);
        }
    }
    add_cyl(m, inner, 0.014, 0.014, 0.36, 0.0, 0.22, 0.0, WOOD_DK, 5);
    add_box(
        m,
        inner,
        0.02,
        0.1,
        0.14,
        0.0,
        0.36,
        0.08,
        owner_col & 0x00ff_ffff,
    );
    m.node(inner).set_scale_scalar(1.0 / 3.0);
    m.attach(g, inner);
}

fn rbx_posterunek(m: &mut ImprovementModel, g: NodeId, owner_col: u32) {
    let rr = 0.64;
    let n = 14_u32;
    for i in 0..n {
        let a = (f64::from(i) / f64::from(n)) * PI * 2.0;
        if (a - PI / 2.0).abs() < 0.35 {
            continue;
        }
        let bx = js_cos(a) * rr;
        let bz = js_sin(a) * rr;
        add_box(m, g, 0.06, 0.24, 0.06, bx, 0.04, bz, WOOD_DK);
        add_box(m, g, 0.08, 0.06, 0.08, bx, 0.28, bz, 0xff7043);
    }
    for sx in [-1.0, 1.0] {
        for sz in [-1.0, 1.0] {
            add_cyl(
                m,
                g,
                0.028,
                0.034,
                0.44,
                sx * 0.14,
                0.22,
                sz * 0.14,
                WOOD,
                6,
            );
        }
    }
    add_box(m, g, 0.42, 0.06, 0.42, 0.0, 0.46, 0.0, WOOD);
    add_box(m, g, 0.32, 0.2, 0.32, 0.0, 0.58, 0.0, HIDE);
    cone4(m, g, 0.32, 0.18, 0.0, 0.76, 0.0, WOOD_DK);
    add_cyl(m, g, 0.014, 0.014, 0.22, 0.0, 0.88, 0.0, WOOD_DK, 5);
    add_box(
        m,
        g,
        0.02,
        0.08,
        0.12,
        0.0,
        0.88,
        0.08,
        owner_col & 0x00ff_ffff,
    );
}

/// `rbxX(g[, ownerCol])` into `g`; `owner_col` is read only by
/// [`RbxLegacy::Fort`] and [`RbxLegacy::Posterunek`] (already a JS `ToInt32`
/// bit pattern, masked with `& 0xffffff` like the web).
pub fn build_rbx_legacy_into(m: &mut ImprovementModel, g: NodeId, kind: RbxLegacy, owner_col: u32) {
    match kind {
        RbxLegacy::Droga => rbx_droga(m, g),
        RbxLegacy::DrogaBrukowana => rbx_droga_brukowana(m, g),
        // `rbxFarma` = `rbxFarmSettlement(g, {})`.
        RbxLegacy::Farma => rbx_farm_settlement(m, g, false),
        RbxLegacy::Pastwisko => rbx_pastwisko(m, g),
        RbxLegacy::Kopalnia => rbx_kopalnia(m, g),
        RbxLegacy::Kamieniolom => rbx_kamieniolom(m, g),
        RbxLegacy::ObozLowiecki => rbx_oboz_lowiecki(m, g),
        RbxLegacy::Wyrab => rbx_wyrab(m, g),
        RbxLegacy::Tartak => rbx_tartak(m, g),
        // `rbxPoleIrygowane` → `rbxFarmIrygacja` (`:280-283`).
        RbxLegacy::PoleIrygowane => {
            rbx_irygacja_large(m, g);
            rbx_farm_settlement(m, g, false);
        }
        RbxLegacy::Glinianka => rbx_glinianka(m, g),
        RbxLegacy::Lodzie => rbx_lodzie(m, g),
        RbxLegacy::WarzelniaSoli => rbx_warzelnia_soli(m, g),
        RbxLegacy::Fort => rbx_fort(m, g, owner_col),
        RbxLegacy::Posterunek => rbx_posterunek(m, g, owner_col),
    }
}

/// `const g = new THREE.Group(); rbxX(g, ownerCol); return g`.
#[must_use]
pub fn build_rbx_legacy(kind: RbxLegacy, owner_col: u32) -> ImprovementModel {
    let mut m = ImprovementModel::new();
    build_rbx_legacy_into(&mut m, ROOT, kind, owner_col);
    m
}
