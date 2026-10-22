//! `render/styleResources.ts` (`edb8fb56`), roblox branch only (D-RR-8 =
//! A): resource overlays on the map (`buildStyledResourceOverlay`) and the
//! livestock figures used by the food stacks (`placeLivestockPair`).
//!
//! The `civ` branch (`buildResourceOverlay*` of `render/resources.ts`) and
//! the `minecraft` branches are unreachable in the game
//! (`GAME_MAP_RENDER_STYLE` is the constant `'roblox'`) and are not ported.

#![allow(clippy::too_many_arguments)]

use crate::models::unit_core::horse::build_zloze_konie;
use crate::models::unit_core::model::{MatId, NodeId, Prim, ROOT};

use super::model::{ExtraGeo, ImprovementModel, UserData};
use super::p3b::{build_zloze_into, ZlozeTyp};
use super::zwierzeta::{build_trzoda_into, build_zloze_owce_into, JakoscTrzody};

/// `S = 2.05 / 3` (`styleResources.ts`).
fn s_small() -> f64 {
    2.05 / 3.0
}

/// `Nakladka` (`types/hex.ts:30-39`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Nakladka {
    /// `'brak'`.
    Brak,
    /// `'las'`.
    Las,
    /// `'zloze_gliny'`.
    ZlozeGliny,
    /// `'zloze_rudy'`.
    ZlozeRudy,
    /// `'zloze_konia'`.
    ZlozeKonia,
    /// `'zloze_owiec'`.
    ZlozeOwiec,
    /// `'zloze_bydla'`.
    ZlozeBydla,
    /// `'zloze_lamy'`.
    ZlozeLamy,
}

impl Nakladka {
    /// All values in declaration order.
    pub const ALL: [Self; 8] = [
        Self::Brak,
        Self::Las,
        Self::ZlozeGliny,
        Self::ZlozeRudy,
        Self::ZlozeKonia,
        Self::ZlozeOwiec,
        Self::ZlozeBydla,
        Self::ZlozeLamy,
    ];

    /// The web string value.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Brak => "brak",
            Self::Las => "las",
            Self::ZlozeGliny => "zloze_gliny",
            Self::ZlozeRudy => "zloze_rudy",
            Self::ZlozeKonia => "zloze_konia",
            Self::ZlozeOwiec => "zloze_owiec",
            Self::ZlozeBydla => "zloze_bydla",
            Self::ZlozeLamy => "zloze_lamy",
        }
    }
}

/// Local `box(g, w, h, d, x, y, z, m)`: bottom at `y`, cast shadow.
fn bx(
    m: &mut ImprovementModel,
    g: NodeId,
    w: f64,
    h: f64,
    d: f64,
    x: f64,
    y: f64,
    z: f64,
    mat: MatId,
) {
    let id = m.mesh(g, Prim::bx(w, h, d), mat);
    m.node(id).set_pos(x, y + h / 2.0, z);
    m.shadows(id, true, false);
}

/// Local `leg(g, x, z, h, m)`.
fn leg(m: &mut ImprovementModel, g: NodeId, x: f64, z: f64, h: f64, mat: MatId) {
    bx(
        m,
        g,
        0.022 * s_small(),
        h,
        0.022 * s_small(),
        x,
        0.0,
        z,
        mat,
    );
}

/// `styledSheep('roblox')` into `g`.
pub fn styled_sheep_into(m: &mut ImprovementModel, g: NodeId) {
    let wool = m.lambert(0xf5f5f5);
    let dark = m.lambert(0x2a2420);
    let s = s_small();
    leg(m, g, -0.04 * s, 0.022 * s, 0.04 * s, dark);
    leg(m, g, -0.04 * s, -0.022 * s, 0.04 * s, dark);
    leg(m, g, 0.04 * s, 0.022 * s, 0.04 * s, dark);
    leg(m, g, 0.04 * s, -0.022 * s, 0.04 * s, dark);
    let body = m.mesh(
        g,
        Prim::Icosahedron {
            r: 0.09 * s,
            detail: 0,
        },
        wool,
    );
    m.node(body)
        .set_pos(0.0, 0.1 * s, 0.0)
        .set_scale(1.35, 1.0, 1.15);
    m.shadows(body, true, false);
    let puff1 = m.mesh(
        g,
        Prim::Icosahedron {
            r: 0.06 * s,
            detail: 0,
        },
        wool,
    );
    m.node(puff1).set_pos(0.03 * s, 0.12 * s, 0.04 * s);
    m.shadows(puff1, true, false);
    let puff2 = m.mesh(
        g,
        Prim::Icosahedron {
            r: 0.055 * s,
            detail: 0,
        },
        wool,
    );
    m.node(puff2).set_pos(-0.025 * s, 0.11 * s, -0.035 * s);
    bx(
        m,
        g,
        0.045 * s,
        0.04 * s,
        0.04 * s,
        0.1 * s,
        0.1 * s,
        0.0,
        dark,
    );
    bx(
        m,
        g,
        0.02 * s,
        0.018 * s,
        0.015 * s,
        0.12 * s,
        0.1 * s,
        0.012 * s,
        dark,
    );
    let pink = m.lambert(0xffaaaa);
    bx(
        m,
        g,
        0.008 * s,
        0.008 * s,
        0.006 * s,
        0.125 * s,
        0.108 * s,
        0.018 * s,
        pink,
    );
}

/// `styledCow('roblox')` into `g`.
pub fn styled_cow_into(m: &mut ImprovementModel, g: NodeId) {
    let brown = m.lambert(0x5c4030);
    let white = m.lambert(0xf0ebe3);
    let dark = m.lambert(0x1e1814);
    let horn_col = m.lambert(0xf5f0d8);
    let horn_tip = m.lambert(0xddd8c0);
    let pink = m.lambert(0xffaaaa);
    let s = s_small();
    let leg_h = 0.085 * s;
    leg(m, g, -0.055 * s, 0.028 * s, leg_h, dark);
    leg(m, g, -0.055 * s, -0.028 * s, leg_h, dark);
    leg(m, g, 0.055 * s, 0.028 * s, leg_h, dark);
    leg(m, g, 0.055 * s, -0.028 * s, leg_h, dark);
    let body_y = leg_h + 0.035 * s;
    bx(m, g, 0.2 * s, 0.1 * s, 0.11 * s, 0.0, body_y, 0.0, brown);
    bx(
        m,
        g,
        0.09 * s,
        0.095 * s,
        0.1 * s,
        0.045 * s,
        body_y + 0.005 * s,
        0.01 * s,
        white,
    );
    bx(
        m,
        g,
        0.065 * s,
        0.075 * s,
        0.065 * s,
        -0.055 * s,
        body_y,
        -0.025 * s,
        white,
    );
    bx(
        m,
        g,
        0.075 * s,
        0.065 * s,
        0.075 * s,
        0.13 * s,
        body_y + 0.02 * s,
        0.0,
        brown,
    );
    bx(
        m,
        g,
        0.055 * s,
        0.048 * s,
        0.055 * s,
        0.175 * s,
        body_y + 0.015 * s,
        0.0,
        brown,
    );
    bx(
        m,
        g,
        0.04 * s,
        0.032 * s,
        0.04 * s,
        0.2 * s,
        body_y + 0.012 * s,
        0.0,
        dark,
    );
    bx(
        m,
        g,
        0.025 * s,
        0.02 * s,
        0.015 * s,
        0.215 * s,
        body_y + 0.01 * s,
        0.0,
        pink,
    );
    for side in [-1.0, 1.0] {
        let hb = m.mesh(g, Prim::cyl(0.016 * s, 0.022 * s, 0.055 * s, 5), horn_col);
        m.node(hb)
            .set_pos(0.155 * s, body_y + 0.075 * s, side * 0.038 * s);
        m.set_rotation(hb, side * 0.55, 0.1, side * 0.35);
        m.shadows(hb, true, false);
        let ht = m.mesh(g, Prim::cone(0.014 * s, 0.045 * s, 5), horn_tip);
        m.node(ht)
            .set_pos(0.148 * s, body_y + 0.11 * s, side * 0.055 * s);
        m.set_rotation(ht, side * 0.7, 0.15, side * 0.4);
        m.shadows(ht, true, false);
    }
    bx(
        m,
        g,
        0.045 * s,
        0.038 * s,
        0.032 * s,
        -0.025 * s,
        body_y - 0.01 * s,
        0.0,
        pink,
    );
}

/// `styledLlama('roblox')` into `g`.
pub fn styled_llama_into(m: &mut ImprovementModel, g: NodeId) {
    let tan = m.lambert(0xffcc88);
    let dark = m.lambert(0x5a4430);
    let s = s_small();
    leg(m, g, -0.04 * s, 0.022 * s, 0.075 * s, dark);
    leg(m, g, -0.04 * s, -0.022 * s, 0.075 * s, dark);
    leg(m, g, 0.04 * s, 0.022 * s, 0.075 * s, dark);
    leg(m, g, 0.04 * s, -0.022 * s, 0.075 * s, dark);
    bx(
        m,
        g,
        0.11 * s,
        0.065 * s,
        0.07 * s,
        0.0,
        0.095 * s,
        0.0,
        tan,
    );
    bx(
        m,
        g,
        0.04 * s,
        0.14 * s,
        0.04 * s,
        0.02 * s,
        0.155 * s,
        0.0,
        tan,
    );
    bx(
        m,
        g,
        0.05 * s,
        0.055 * s,
        0.04 * s,
        0.04 * s,
        0.235 * s,
        0.0,
        tan,
    );
    bx(
        m,
        g,
        0.035 * s,
        0.03 * s,
        0.03 * s,
        0.055 * s,
        0.265 * s,
        0.0,
        tan,
    );
    bx(
        m,
        g,
        0.012 * s,
        0.055 * s,
        0.008 * s,
        0.05 * s,
        0.295 * s,
        0.014 * s,
        tan,
    );
    bx(
        m,
        g,
        0.012 * s,
        0.055 * s,
        0.008 * s,
        0.05 * s,
        0.295 * s,
        -0.014 * s,
        tan,
    );
    bx(
        m,
        g,
        0.018 * s,
        0.012 * s,
        0.012 * s,
        0.055 * s,
        0.278 * s,
        0.018 * s,
        dark,
    );
    bx(
        m,
        g,
        0.018 * s,
        0.012 * s,
        0.012 * s,
        0.055 * s,
        0.278 * s,
        -0.018 * s,
        dark,
    );
}

/// `styledOre('roblox')` (legacy `Nakladka.ZlozeRudy`) into `g`.
pub fn styled_ore_into(m: &mut ImprovementModel, g: NodeId) {
    let rock = m.lambert(0x667788);
    let rock_dk = m.lambert(0x556066);
    let ore = m.lambert(0xffdd00);
    let ore_hi = m.lambert(0xffee66);
    let s = s_small();
    let spots = [
        (0.0, 0.0, 1.0),
        (0.08 * s, 0.035 * s, 0.78),
        (-0.06 * s, 0.05 * s, 0.7),
    ];
    for (px, pz, sc) in spots {
        let r = m.mesh_extra(
            g,
            ExtraGeo::Dodecahedron {
                r: 0.05 * s * sc,
                detail: 0,
            },
            Prim::Icosahedron {
                r: 0.05 * s * sc,
                detail: 0,
            },
            rock,
        );
        m.node(r).set_pos(px, 0.045 * s * sc, pz);
        m.set_rotation(r, px * 2.0, pz * 3.0, sc);
        m.shadows(r, true, false);
        bx(
            m,
            g,
            0.028 * s * sc,
            0.02 * s * sc,
            0.022 * s * sc,
            px + 0.02 * s,
            0.055 * s * sc,
            pz,
            rock_dk,
        );
        bx(
            m,
            g,
            0.024 * s * sc,
            0.024 * s * sc,
            0.024 * s * sc,
            px + 0.015 * s,
            0.07 * s * sc,
            pz + 0.01 * s,
            ore,
        );
        bx(
            m,
            g,
            0.014 * s * sc,
            0.014 * s * sc,
            0.014 * s * sc,
            px - 0.01 * s,
            0.06 * s * sc,
            pz - 0.008 * s,
            ore_hi,
        );
    }
}

/// Livestock kind of `placeLivestockFigure`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Livestock {
    /// `'cow'`.
    Cow,
    /// `'sheep'`.
    Sheep,
}

/// `LIVESTOCK_FIGURE_SCALE`.
pub const LIVESTOCK_FIGURE_SCALE: f64 = 1.0;

/// `placeLivestockFigure(g, kind, x, z, rotY, 'roblox', scale)`.
pub fn place_livestock_figure(
    m: &mut ImprovementModel,
    g: NodeId,
    kind: Livestock,
    x: f64,
    z: f64,
    rot_y: f64,
    scale: f64,
) {
    let fig = m.detached();
    match kind {
        Livestock::Cow => styled_cow_into(m, fig),
        Livestock::Sheep => styled_sheep_into(m, fig),
    }
    m.node(fig)
        .set_scale_scalar(scale)
        .rot_y(rot_y)
        .set_pos(x, 0.0, z);
    m.attach(g, fig);
}

/// `placeLivestockPair(g, kind, cx, cz, 'roblox')`.
pub fn place_livestock_pair(
    m: &mut ImprovementModel,
    g: NodeId,
    kind: Livestock,
    cx: f64,
    cz: f64,
) {
    place_livestock_figure(m, g, kind, cx, cz, 0.15, LIVESTOCK_FIGURE_SCALE);
    place_livestock_figure(
        m,
        g,
        kind,
        cx + 0.11,
        cz - 0.1,
        -0.35,
        LIVESTOCK_FIGURE_SCALE,
    );
}

/// `buildStyledCow('roblox')`.
#[must_use]
pub fn build_styled_cow() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    styled_cow_into(&mut m, ROOT);
    m
}

/// `buildStyledSheep('roblox')`.
#[must_use]
pub fn build_styled_sheep() -> ImprovementModel {
    let mut m = ImprovementModel::new();
    styled_sheep_into(&mut m, ROOT);
    m
}

/// `buildZlozeKonie()` of `kon-nowy-model.ts` (MOD-04
/// `unit_core::horse::build_zloze_konie`) grafted into `g`.
fn zloze_konie_into(m: &mut ImprovementModel, g: NodeId) {
    let um = build_zloze_konie(1.0);
    m.graft_standard(g, &um);
}

/// `buildStyledResourceOverlay(nakladka, 'roblox', zloze)`
/// (`styleResources.ts:444-499`); `None` = the web `null`.
#[must_use]
pub fn build_styled_resource_overlay(
    nakladka: Nakladka,
    zloze: Option<&str>,
) -> Option<ImprovementModel> {
    let mut m = ImprovementModel::new();
    let g = ROOT;
    let depo2 = |m: &mut ImprovementModel| {
        m.ext(ROOT).user_data = Some(UserData {
            mats: None,
            per_token_geos: None,
            deposit_display_scale: Some(2.0),
        });
    };
    let done = match nakladka {
        Nakladka::ZlozeKonia => {
            zloze_konie_into(&mut m, g);
            depo2(&mut m);
            true
        }
        Nakladka::ZlozeOwiec => {
            build_zloze_owce_into(&mut m, g, 1.0);
            true
        }
        Nakladka::ZlozeBydla => {
            build_trzoda_into(&mut m, g, JakoscTrzody::Wysoka, 1.0);
            true
        }
        Nakladka::ZlozeLamy => {
            styled_llama_into(&mut m, g);
            true
        }
        Nakladka::ZlozeGliny => {
            build_zloze_into(&mut m, g, ZlozeTyp::Glina);
            true
        }
        Nakladka::ZlozeRudy => {
            styled_ore_into(&mut m, g);
            true
        }
        Nakladka::Brak | Nakladka::Las => false,
    };
    if done {
        return Some(m);
    }
    match zloze? {
        "miedz" => build_zloze_into(&mut m, g, ZlozeTyp::Miedz),
        "zelazo" => build_zloze_into(&mut m, g, ZlozeTyp::Zelazo),
        "wegiel" => build_zloze_into(&mut m, g, ZlozeTyp::Wegiel),
        "sol" => build_zloze_into(&mut m, g, ZlozeTyp::Sol),
        "zloto" => build_zloze_into(&mut m, g, ZlozeTyp::Zloto),
        "cyna" => build_zloze_into(&mut m, g, ZlozeTyp::Cyna),
        "glina" => build_zloze_into(&mut m, g, ZlozeTyp::Glina),
        "konie" => {
            zloze_konie_into(&mut m, g);
            depo2(&mut m);
        }
        "owce" => build_zloze_owce_into(&mut m, g, 1.0),
        "bydlo" => build_trzoda_into(&mut m, g, JakoscTrzody::Wysoka, 1.0),
        _ => return None,
    }
    Some(m)
}
