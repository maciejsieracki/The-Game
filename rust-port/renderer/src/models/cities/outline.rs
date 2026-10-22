//! `render/cityMapOutline.ts` (web `edb8fb56`, 85 LOC): the double hex
//! outline of a city on the world map (owner colour; red outer accent at
//! war). Two `LineLoop`s, `renderOrder = 12`, transparent line materials
//! without depth write.

use super::model::{CityGeo, CityMaterial, CityModel, DrawKind};
use crate::models::unit_core::model::{NodeId, ROOT};
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::terrain::color::Color;

/// `CIV_INNER_OPACITY` (`cityMapOutline.ts:12`).
pub const CIV_INNER_OPACITY: f64 = 0.92;
/// `CIV_OUTER_OPACITY` (`:13`).
pub const CIV_OUTER_OPACITY: f64 = 0.52;
/// `WAR_ACCENT_COLOR` (`:14`).
pub const WAR_ACCENT_COLOR: u32 = 0x00ff_4444;
/// `WAR_ACCENT_OPACITY` (`:15`).
pub const WAR_ACCENT_OPACITY: f64 = 0.55;
/// `OUTLINE_LIFT` (`:17`).
pub const OUTLINE_LIFT: f64 = 0.085;

/// `CityMapOutlineKind` (`cityMapOutline.ts:10`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CityMapOutlineKind {
    /// `'player'`.
    Player,
    /// `'war'`.
    War,
    /// `'neutral'`.
    Neutral,
    /// `'ally'`.
    Ally,
}

impl CityMapOutlineKind {
    /// Web string.
    #[must_use]
    pub const fn web_id(self) -> &'static str {
        match self {
            Self::Player => "player",
            Self::War => "war",
            Self::Neutral => "neutral",
            Self::Ally => "ally",
        }
    }
}

/// `group.userData` of an outline (`outlineCivColor`, `outlineAtWar`,
/// `outlineHex`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OutlineData {
    /// `outlineCivColor` (`None` = `undefined`).
    pub civ_color: Option<u32>,
    /// `outlineAtWar`.
    pub at_war: bool,
    /// `outlineHex`.
    pub hex: HexCoord,
}

/// `makeHexRing(R, color, opacity, y)` (`cityMapOutline.ts:19-35`).
///
/// `color = None` is the web `undefined` (`ownerColor` of a negative owner):
/// `Material.setValues` skips an `undefined` parameter, so the colour stays
/// the `LineBasicMaterial` default white.
fn make_hex_ring(
    c: &mut CityModel,
    parent: NodeId,
    r: f64,
    color: Option<u32>,
    opacity: f64,
    y: f64,
) {
    let mat = c.add_material(CityMaterial::LineBasic {
        color: Color::from_hex(color.unwrap_or(0x00ff_ffff)),
        transparent: true,
        opacity,
        depth_write: false,
    });
    let id = c.drawable(parent, DrawKind::LineLoop, CityGeo::HexLoop { r, y }, mat);
    c.drawable_mut(id).render_order = 12;
}

/// `buildCityMapOutline(q, r, topY, civColor, atWar = false)`
/// (`cityMapOutline.ts:38-64`): group at the hex centre lifted by
/// [`OUTLINE_LIFT`], children `outer` (R·1.06) then `inner` (R·0.98, y 0.004).
#[must_use]
pub fn build_city_map_outline(
    q: i32,
    r: i32,
    top_y: f64,
    civ_color: Option<u32>,
    at_war: bool,
) -> (CityModel, OutlineData) {
    let mut c = CityModel::new();
    let (x, z) = axial_to_world(HexCoord::new(q, r), HEX_R);
    c.set_pos(ROOT, x, top_y + OUTLINE_LIFT, z);
    let outer_color = if at_war {
        Some(WAR_ACCENT_COLOR)
    } else {
        civ_color
    };
    let outer_opacity = if at_war {
        WAR_ACCENT_OPACITY
    } else {
        CIV_OUTER_OPACITY
    };
    // `g.add(outer, inner)`: child order outer → inner (the web creates
    // `inner` first; creation order is not observable).
    make_hex_ring(&mut c, ROOT, HEX_R * 1.06, outer_color, outer_opacity, 0.0);
    make_hex_ring(
        &mut c,
        ROOT,
        HEX_R * 0.98,
        civ_color,
        CIV_INNER_OPACITY,
        0.004,
    );
    (
        c,
        OutlineData {
            civ_color,
            at_war,
            hex: HexCoord::new(q, r),
        },
    )
}

/// `placeCityMapOutline(group, q, r, topY)` (`cityMapOutline.ts:67-76`).
pub fn place_city_map_outline(
    model: &mut CityModel,
    data: &mut OutlineData,
    q: i32,
    r: i32,
    top_y: f64,
) {
    let (x, z) = axial_to_world(HexCoord::new(q, r), HEX_R);
    model.set_pos(ROOT, x, top_y + OUTLINE_LIFT, z);
    data.hex = HexCoord::new(q, r);
}
