//! Port of `gra/src/render/cities.ts` (pin `edb8fb56`), CPU part of
//! `CityRenderer`: which settlement model each city gets
//! (`buildSettlementModelForStyle`, `roblox` branch), placement on its hex
//! (terrain top + `CITY_LIFT`, uniform scale `CITY_MODEL_SCALE`), model
//! reuse keyed by `visualKey`, fog visibility and the hex outlines
//! (`cityMapOutline`). The `THREE.Scene` is an ordered list of
//! [`SceneObject`]s in `scene.children` order.
//!
//! Out of scope here (MOD-10 / overlays, they need a text/canvas
//! rasteriser): the stat chip (`_syncStatChip`, `syncStatChips`,
//! `pickStatChipCityIdAt`, badge LOD `setBadgeZoomLod`/`getBadgeZoomLod`)
//! and the revolt sprite (`_syncRevolt`). Not ported: the private, unused
//! `_ownerIndex` (`cities.ts:924-932`, 0 callers) and GPU `dispose()` calls.

use std::collections::HashSet;

use super::braz::{build_miasto_braz, MiastoBrazOpts};
use super::kamien::{build_miasto_kamien, MiastoKamienOpts, Poziom};
use super::model::{js_number_to_string, CityGeo, CityMaterial, CityModel};
use super::outline::{
    build_city_map_outline, place_city_map_outline, CityMapOutlineKind, OutlineData,
};
use crate::core::bronze::BronzeCiv;
use crate::core::map_style::{civ_terrain_vis, terrain_visual_for_style, GAME_MAP_RENDER_STYLE};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::model::ROOT;
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;
use crate::pick::three::{js_max, js_min};
use crate::terrain::color::Color;

/// `OWNER_COLORS` (`cities.ts:92-101`).
pub const OWNER_COLORS: [u32; 8] = [
    0x00ff_d54a,
    0x00e5_3935,
    0x0043_a047,
    0x001e_88e5,
    0x00fb_8c00,
    0x008e_24aa,
    0x0000_acc1,
    0x00f0_6292,
];

/// `CITY_LIFT = 0.008 * R` (`cities.ts:138`).
pub const CITY_LIFT: f64 = 0.008 * HEX_R;
/// `CITY_MODEL_SCALE` (`cities.ts:140`).
pub const CITY_MODEL_SCALE: f64 = 1.38;
/// `HUMAN_OWNER_PRIMARY` (`game/human-owners.ts:21`), default player of
/// [`CityRenderer::apply_fog_visibility`].
pub const HUMAN_OWNER_PRIMARY: i32 = 0;

/// `ownerColor(ownerId)` = `OWNER_COLORS[ownerId % 8]` (`cities.ts:103-105`).
/// A negative id with a non-zero remainder reads `undefined` (`None`).
#[must_use]
pub fn owner_color(owner_id: i32) -> Option<u32> {
    usize::try_from(owner_id % 8).ok().map(|i| OWNER_COLORS[i])
}

/// `DEFAULT_CIV_MAP[ownerIndex % 8] ?? 'grecja'` (`cities.ts:258-267`, `:480`).
#[must_use]
pub fn default_civ(owner_id: i32) -> BronzeCiv {
    match owner_id % 8 {
        1 => BronzeCiv::Rzym,
        2 => BronzeCiv::Egipt,
        3 => BronzeCiv::Chiny,
        4 => BronzeCiv::Sumer,
        5 => BronzeCiv::Zulu,
        6 => BronzeCiv::Celtowie,
        7 => BronzeCiv::Germanie,
        _ => BronzeCiv::Grecja,
    }
}

/// `terrainTopY(hex)` (`cities.ts:82-86`) with the game style.
#[must_use]
pub fn terrain_top_y(t: Terrain) -> f64 {
    let spec = terrain_visual_for_style(t, GAME_MAP_RENDER_STYLE, civ_terrain_vis(t));
    spec.height + spec.y_offset
}

/// `CityWallKind` (`cities.ts:275`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CityWallKind {
    /// `'none'`.
    None,
    /// `'stone'`.
    Stone,
    /// `'palisada'`.
    Palisada,
}

impl CityWallKind {
    /// Web string.
    #[must_use]
    pub const fn web_id(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Stone => "stone",
            Self::Palisada => "palisada",
        }
    }
}

/// The fields of the web `City` the renderer reads.
#[derive(Debug, Clone, PartialEq)]
pub struct City {
    /// `id`.
    pub id: String,
    /// `ownerId`.
    pub owner_id: i32,
    /// `q`.
    pub q: i32,
    /// `r`.
    pub r: i32,
    /// `population`.
    pub population: f64,
}

/// The `CityRenderOptions` callbacks of the CPU part (`cities.ts:277-393`).
/// `None` = callback absent (web default used).
#[derive(Default, Clone, Copy)]
#[allow(clippy::type_complexity)]
pub struct CityRenderOptions<'a> {
    /// `getEra(ownerId)`; default 1.
    pub get_era: Option<&'a dyn Fn(i32) -> f64>,
    /// `getCiv(ownerId)`; default [`default_civ`].
    pub get_civ: Option<&'a dyn Fn(i32) -> BronzeCiv>,
    /// `getLevel(cityId)`; default `max(1, min(10, population))`.
    pub get_level: Option<&'a dyn Fn(&str) -> f64>,
    /// `getWalls(cityId)`; default false.
    pub get_walls: Option<&'a dyn Fn(&str) -> bool>,
    /// `getWallKind(cityId)`; default `getWalls ? 'stone' : 'none'`.
    pub get_wall_kind: Option<&'a dyn Fn(&str) -> CityWallKind>,
    /// `isVisible(city)`; default true.
    pub is_visible: Option<&'a dyn Fn(&City) -> bool>,
    /// `getMapOutlineKind(ownerId)`; `None` result = `null` (no outline).
    pub get_map_outline_kind: Option<&'a dyn Fn(i32) -> Option<CityMapOutlineKind>>,
    /// `ownerColorFn(ownerId)`; default [`owner_color`].
    pub owner_color_fn: Option<&'a dyn Fn(i32) -> u32>,
}

impl CityRenderOptions<'_> {
    fn color(&self, owner: i32) -> Option<u32> {
        match self.owner_color_fn {
            Some(f) => Some(f(owner)),
            None => owner_color(owner),
        }
    }
}

/// One city group on the map.
#[derive(Debug, Clone, PartialEq)]
pub struct RenderedCity {
    /// `userData.cityId`.
    pub city_id: String,
    /// `userData.visualKey` = `` `${style}|${era}|${civ}|${level}|${wallKind}` ``.
    pub visual_key: String,
    /// `userData.ownerId`.
    pub owner_id: i32,
    /// `userData.q`.
    pub q: i32,
    /// `userData.r`.
    pub r: i32,
    /// `group.visible`.
    pub visible: bool,
    /// The model; its root carries `position` and `scale` (1.38).
    pub model: CityModel,
}

/// One outline group on the map.
#[derive(Debug, Clone, PartialEq)]
pub struct RenderedOutline {
    /// City the outline belongs to (key of `mapOutlines`).
    pub city_id: String,
    /// `mapOutlineKeys` value `` `${ownerId}:${kind}:${civColor}` ``.
    pub key: String,
    /// `userData` of the outline.
    pub data: OutlineData,
    /// `group.visible`.
    pub visible: bool,
    /// The two line loops (root carries the position).
    pub model: CityModel,
}

/// A child of the scene.
#[derive(Debug, Clone, PartialEq)]
pub enum SceneObject {
    /// A settlement model.
    City(RenderedCity),
    /// A hex outline.
    Outline(RenderedOutline),
}

/// `buildSettlementModelForStyle(era, civ, level, ownerCol, wallKind)`
/// (`cities.ts:229-250`), `roblox` branch: era ≥ 2 → `buildMiastoBraz`
/// (era 3+ falls back to bronze), otherwise `buildMiastoKamien`.
#[must_use]
pub fn build_settlement_model_for_style(
    era: f64,
    civ: BronzeCiv,
    level: f64,
    owner_col: Option<u32>,
    wall_kind: CityWallKind,
) -> CityModel {
    let with_walls = wall_kind != CityWallKind::None;
    if era >= 2.0 {
        return build_miasto_braz(
            civ.web_id(),
            Poziom::Level(level),
            MiastoBrazOpts {
                mur: wall_kind == CityWallKind::Stone,
                palisada: wall_kind == CityWallKind::Palisada,
                color: owner_col,
            },
        );
    }
    build_miasto_kamien(
        Poziom::Level(level),
        MiastoKamienOpts {
            mur: with_walls,
            color: owner_col,
        },
    )
}

/// `buildCityModel(ownerCol)` (`cities.ts:148-219`): the legacy fallback
/// used by `sync` when the settlement builder throws. The Rust builders
/// cannot fail, so the renderer never takes this path (conscious
/// deviation: unreachable); it is kept as a public builder and verified
/// against the web output.
#[must_use]
pub fn build_legacy_city_model(owner_col: Option<u32>) -> CityModel {
    use std::f64::consts::PI;
    let r = HEX_R;
    let platform_radius = 0.55 * r;
    let platform_height = 0.04 * r;
    let (house_w, house_h, house_d) = (0.18 * r, 0.16 * r, 0.18 * r);
    let (roof_w, roof_h, roof_d) = (0.20 * r, 0.12 * r, 0.20 * r);
    let house_dist = 0.28 * r;
    let (temple_w, temple_h, temple_d) = (0.24 * r, 0.24 * r, 0.24 * r);
    let temple_roof_radius = 0.17 * r;
    let temple_roof_height = 0.20 * r;
    let pole_radius = 0.010 * r;
    let pole_height = 0.55 * r;
    let flag_radius = 0.07 * r;
    let flag_height = 0.10 * r;

    let mut c = CityModel::new();
    // `MeshLambertMaterial({ color })`; `color: undefined` keeps white.
    let mut mat = |hex: Option<u32>| {
        c.add_material(CityMaterial::Lambert {
            color: Color::from_hex(hex.unwrap_or(0x00ff_ffff)),
            flat_shading: false,
        })
    };
    let m_platform = mat(Some(0x009b_9b8a));
    let m_house_wall = mat(Some(0x00cd_a77a));
    let m_house_roof = mat(Some(0x00b5_532f));
    let m_temple_body = mat(Some(0x008a_8a7a));
    let m_temple_roof = mat(owner_col);
    let m_pole = mat(Some(0x00aa_aaaa));
    let m_flag = mat(owner_col);

    let id = c.mesh(
        ROOT,
        CityGeo::Cylinder {
            rt: platform_radius,
            rb: platform_radius,
            h: platform_height,
            radial: 6,
        },
        m_platform,
    );
    c.tree.node(id).position.y = platform_height * 0.5;
    let platform_top = platform_height;

    for angle in [PI * 0.0, PI * (2.0 / 3.0), PI * (4.0 / 3.0)] {
        let hx = js_cos(angle) * house_dist;
        let hz = js_sin(angle) * house_dist;
        let body = c.mesh(
            ROOT,
            CityGeo::Box {
                w: house_w,
                h: house_h,
                d: house_d,
            },
            m_house_wall,
        );
        c.set_pos(body, hx, platform_top + house_h * 0.5, hz);
        let roof = c.mesh(
            ROOT,
            CityGeo::Box {
                w: roof_w,
                h: roof_h,
                d: roof_d,
            },
            m_house_roof,
        );
        c.set_pos(roof, hx, platform_top + house_h + roof_h * 0.35, hz);
        c.tree.node(roof).rot_x(PI * 0.25);
    }

    let temple = c.mesh(
        ROOT,
        CityGeo::Box {
            w: temple_w,
            h: temple_h,
            d: temple_d,
        },
        m_temple_body,
    );
    c.tree.node(temple).position.y = platform_top + temple_h * 0.5;
    let temple_top = platform_top + temple_h;

    let troof = c.mesh(
        ROOT,
        CityGeo::Cone {
            r: temple_roof_radius,
            h: temple_roof_height,
            radial: 4,
        },
        m_temple_roof,
    );
    c.tree.node(troof).position.y = temple_top + temple_roof_height * 0.5;
    c.tree.node(troof).rot_y(PI * 0.25);

    let pole_base = temple_top + temple_roof_height;
    let pole = c.mesh(
        ROOT,
        CityGeo::Cylinder {
            rt: pole_radius,
            rb: pole_radius,
            h: pole_height,
            radial: 5,
        },
        m_pole,
    );
    c.tree.node(pole).position.y = pole_base + pole_height * 0.5;

    let flag = c.mesh(
        ROOT,
        CityGeo::Cone {
            r: flag_radius,
            h: flag_height,
            radial: 4,
        },
        m_flag,
    );
    c.tree.node(flag).position.y = pole_base + pole_height + flag_height * 0.5;
    c.tree.node(flag).rot_z(PI * 0.5);
    c.tree.node(flag).position.x = flag_radius * 0.5;
    c
}

/// `CityRenderer` (`cities.ts:399-946`), CPU part.
#[derive(Debug, Clone, Default)]
pub struct CityRenderer {
    hex_grid: std::collections::HashMap<HexCoord, Terrain>,
    scene: Vec<SceneObject>,
}

impl CityRenderer {
    /// `new CityRenderer(scene, map)`: `hexGrid` from `map.hexes`.
    ///
    /// ZAŁOŻENIE: the web keys `map.hexes` by `` `${q},${r}` ``; here the
    /// key is the [`HexCoord`] itself (same lookup).
    #[must_use]
    pub fn new(hexes: impl IntoIterator<Item = (HexCoord, Terrain)>) -> Self {
        Self {
            hex_grid: hexes.into_iter().collect(),
            scene: Vec::new(),
        }
    }

    /// The scene children in order.
    #[must_use]
    pub fn scene(&self) -> &[SceneObject] {
        &self.scene
    }

    /// The city group of a city id.
    #[must_use]
    pub fn city(&self, id: &str) -> Option<&RenderedCity> {
        self.scene.iter().find_map(|o| match o {
            SceneObject::City(c) if c.city_id == id => Some(c),
            _ => None,
        })
    }

    fn city_index(&self, id: &str) -> Option<usize> {
        self.scene
            .iter()
            .position(|o| matches!(o, SceneObject::City(c) if c.city_id == id))
    }

    fn outline_index(&self, id: &str) -> Option<usize> {
        self.scene
            .iter()
            .position(|o| matches!(o, SceneObject::Outline(c) if c.city_id == id))
    }

    fn top_y(&self, q: i32, r: i32) -> f64 {
        self.hex_grid
            .get(&HexCoord::new(q, r))
            .map_or(0.0, |&t| terrain_top_y(t))
    }

    /// `sync(cities, options)` (`cities.ts:459-558`).
    pub fn sync(&mut self, cities: &[City], o: &CityRenderOptions<'_>) {
        let mut present: HashSet<&str> = HashSet::new();
        for city in cities {
            present.insert(city.id.as_str());
            let (q, r) = (city.q, city.r);
            let top_y = self.top_y(q, r);
            let y_base = top_y + CITY_LIFT;
            let owner = city.owner_id;
            let era = o.get_era.map_or(1.0, |f| f(owner));
            let level = o.get_level.map_or_else(
                || js_max(1.0, js_min(10.0, city.population)),
                |f| f(&city.id),
            );
            let walls = o.get_walls.is_some_and(|f| f(&city.id));
            let wall_kind = o.get_wall_kind.map_or(
                if walls {
                    CityWallKind::Stone
                } else {
                    CityWallKind::None
                },
                |f| f(&city.id),
            );
            let civ = o.get_civ.map_or_else(|| default_civ(owner), |f| f(owner));
            let visual_key = format!(
                "{}|{}|{}|{}|{}",
                GAME_MAP_RENDER_STYLE.web_id(),
                js_number_to_string(era),
                civ.web_id(),
                js_number_to_string(level),
                wall_kind.web_id()
            );
            let visible = o.is_visible.is_none_or(|f| f(city));
            let (x, z) = axial_to_world(HexCoord::new(q, r), HEX_R);

            if let Some(i) = self.city_index(&city.id) {
                let SceneObject::City(grp) = &mut self.scene[i] else {
                    unreachable!("city_index returns a city");
                };
                grp.owner_id = owner;
                grp.q = q;
                grp.r = r;
                grp.visible = visible;
                if grp.visual_key == visual_key {
                    grp.model.set_pos(ROOT, x, y_base, z);
                    grp.model.set_scale_scalar(ROOT, CITY_MODEL_SCALE);
                    self.sync_map_outline(&city.id, q, r, top_y, owner, o, visible);
                    continue;
                }
                self.remove_map_outline(&city.id);
                if let Some(i) = self.city_index(&city.id) {
                    self.scene.remove(i);
                }
            }
            let col = o.color(owner);
            let mut model = build_settlement_model_for_style(era, civ, level, col, wall_kind);
            model.set_pos(ROOT, x, y_base, z);
            model.set_scale_scalar(ROOT, CITY_MODEL_SCALE);
            self.scene.push(SceneObject::City(RenderedCity {
                city_id: city.id.clone(),
                visual_key,
                owner_id: owner,
                q,
                r,
                visible,
                model,
            }));
            self.sync_map_outline(&city.id, q, r, top_y, owner, o, visible);
        }

        let stale: Vec<String> = self
            .scene
            .iter()
            .filter_map(|ob| match ob {
                SceneObject::City(c) if !present.contains(c.city_id.as_str()) => {
                    Some(c.city_id.clone())
                }
                _ => None,
            })
            .collect();
        for id in stale {
            self.remove_map_outline(&id);
            if let Some(i) = self.city_index(&id) {
                self.scene.remove(i);
            }
        }
    }

    /// `syncMapOutlines(cities, options)` (`cities.ts:635-651`).
    pub fn sync_map_outlines(&mut self, cities: &[City], o: &CityRenderOptions<'_>) {
        for city in cities {
            let top_y = self.top_y(city.q, city.r);
            let visible = o.is_visible.is_none_or(|f| f(city));
            let grp_visible = self.city(&city.id).is_none_or(|g| g.visible);
            self.sync_map_outline(
                &city.id,
                city.q,
                city.r,
                top_y,
                city.owner_id,
                o,
                visible && grp_visible,
            );
        }
    }

    /// `applyFogVisibility(vis, fogOn, playerOwnerId = HUMAN_OWNER_PRIMARY)`
    /// (`cities.ts:657-680`); `vis` holds `` `${q},${r}` `` keys.
    pub fn apply_fog_visibility(
        &mut self,
        vis: &HashSet<String>,
        fog_on: bool,
        player_owner_id: i32,
    ) {
        for ob in &mut self.scene {
            if let SceneObject::City(grp) = ob {
                if !fog_on || grp.owner_id == player_owner_id {
                    grp.visible = true;
                    continue;
                }
                grp.visible = vis.contains(&format!("{},{}", grp.q, grp.r));
            }
        }
        let vis_of: Vec<(String, bool)> = self
            .scene
            .iter()
            .filter_map(|ob| match ob {
                SceneObject::City(c) => Some((c.city_id.clone(), c.visible)),
                SceneObject::Outline(_) => None,
            })
            .collect();
        for ob in &mut self.scene {
            if let SceneObject::Outline(ol) = ob {
                ol.visible = vis_of
                    .iter()
                    .find(|(id, _)| *id == ol.city_id)
                    .is_some_and(|(_, v)| *v);
            }
        }
    }

    /// `dispose()` (`cities.ts:683-702`): every model and outline leaves the
    /// scene.
    pub fn dispose(&mut self) {
        self.scene.clear();
    }

    fn remove_map_outline(&mut self, city_id: &str) {
        if let Some(i) = self.outline_index(city_id) {
            self.scene.remove(i);
        }
    }

    /// `_syncMapOutline(cityId, q, r, topY, ownerId, options, show)`
    /// (`cities.ts:888-917`).
    #[allow(clippy::too_many_arguments)]
    fn sync_map_outline(
        &mut self,
        city_id: &str,
        q: i32,
        r: i32,
        top_y: f64,
        owner: i32,
        o: &CityRenderOptions<'_>,
        show: bool,
    ) {
        let kind = o.get_map_outline_kind.and_then(|f| f(owner));
        let Some(kind) = kind.filter(|_| show) else {
            self.remove_map_outline(city_id);
            return;
        };
        let civ_color = o.color(owner);
        let at_war = kind == CityMapOutlineKind::War;
        let key = format!(
            "{owner}:{}:{}",
            kind.web_id(),
            civ_color.map_or_else(|| "undefined".to_owned(), |c| c.to_string())
        );
        if let Some(i) = self.outline_index(city_id) {
            if let SceneObject::Outline(ol) = &mut self.scene[i] {
                if ol.key == key {
                    place_city_map_outline(&mut ol.model, &mut ol.data, q, r, top_y);
                    ol.visible = true;
                    return;
                }
            }
        }
        self.remove_map_outline(city_id);
        let (model, data) = build_city_map_outline(q, r, top_y, civ_color, at_war);
        self.scene.push(SceneObject::Outline(RenderedOutline {
            city_id: city_id.to_owned(),
            key,
            data,
            visible: true,
            model,
        }));
    }
}

/// Root position of a rendered object (`group.position`).
#[must_use]
pub fn root_position(m: &CityModel) -> Vec3 {
    m.tree.nodes[ROOT].position
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn owner_color_and_civ_follow_js_remainder() {
        assert_eq!(owner_color(0), Some(0x00ff_d54a));
        assert_eq!(owner_color(9), Some(0x00e5_3935));
        assert_eq!(owner_color(-1), None);
        assert_eq!(owner_color(-8), Some(0x00ff_d54a));
        assert_eq!(default_civ(12), BronzeCiv::Sumer);
        assert_eq!(default_civ(-3), BronzeCiv::Grecja);
    }
}
