//! `map_units` — unit tokens of the strategic map (R1 of
//! `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §4, topic
//! `R-RUSTPORT-P4-1-R1-UNIT-TOKENS`).
//!
//! Port of the `UnitRenderer` class of `gra/src/render/units.ts` at pin
//! `07d2fbd72` (`:5762-6950`): `sync` (`:6095-6263`) with the stack display
//! (`:6266-6371`), `setHighlight` / `clearHighlight` (`:6524-6568`),
//! `setSelectionHex` / `clearSelectionHex` (`:6571-6602`), `setPathRoute` /
//! `clearPathRoute` (`:6608-6744`), the general band
//! (`_syncGeneralRing`, `applyGeneralRingLod`, `:5787-5791`, `:6915-6940`,
//! module [`general_ring`] = `render/generalHexRing.ts`) and `dispose`
//! (`:6747-6857`). It also provides the token meshes for
//! [`UnitPickModel::meshes`]; `topYAt` and `pickUnitIdAt` themselves are
//! ported elsewhere (`TerrainPickScene::top_y_at`, `pick::ray_to_unit`).
//!
//! Not the battle map (that is [`crate::battle::units`]), and not the
//! DTO → input adapter (`view/units.rs`, topic Q6): [`MapUnitRenderer::sync`]
//! takes the DTO records the contract defines for units
//! ([`civ_view_model::UnitViewDto`], [`civ_view_model::StackViewDto`]) as they
//! are; the other methods take renderer values (hexes, owners as the legacy
//! `i64` number, opacity), like the web methods.
//!
//! **CPU only.** Tokens are [`crate::scene::Scene`] trees (model + owner
//! rings); "dispose" drops them. The memory optimisations of the web class
//! (`MaterialContentPool`, `GeometryContentPool`, `mergeUnitStaticParts`,
//! `SmallPartLod`) change neither what is drawn nor its state and are not
//! ported here. The plate, badges, stack badge and suffering icons are kept
//! as the inputs the web passes to their builders ([`TokenOverlays`]); the
//! trees and textures come from [`crate::units::overlay`] in the GPU layer.

pub mod consts;
pub mod general_ring;
pub mod overlays;
pub mod token;

use std::collections::{HashMap, HashSet};

use civ_view_model as vm;

use self::consts::{
    CITY_UNIT_EXTRA_LIFT, CITY_UNIT_OFFSET, CITY_UNIT_OFFSET_ANGLE, CITY_UNIT_RENDER_ORDER,
    CITY_UNIT_SCALE, HIGHLIGHT_OPACITY, HUMAN_OWNER_PRIMARY, OWNER_COLORS, RELIEF_GORY,
    RELIEF_WZGORZA, TOKEN_LIFT,
};
use self::general_ring::{
    general_ring_world_width, general_ring_y, GeneralHexRing, GENERAL_RING_BASE_WIDTH,
    GENERAL_RING_HEX_OFFSETS, GENERAL_RING_MIN_PX,
};
pub use self::overlays::{
    HighlightLayer, PathRoute, PathRouteOptions, RouteLabel, SelectionMarker, TurnStop,
};
use self::token::TokenSpec;
pub use self::token::{BadgeRow, MapToken, RingStance, SufferingIcon, TokenOverlays};
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::registry::NotYetPorted;
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::raycast::{PickMesh, Side as PickSide, TriGeometry};
use crate::pick::terrain::Terrain;
use crate::pick::three::Mat4 as PMat4;
use crate::pick::UnitPickModel;
use crate::scene::Side;
use crate::units::overlay::emblem::OwnerEmblemContext;
use crate::units::overlay::stat_plate::StatPlateVitals;

/// `ownerColor(ownerId)` (`units.ts:250-252`): `OWNER_COLORS[ownerId % 8]`.
/// A negative id gives `undefined` in the web (JS `%` keeps the sign) and
/// Three keeps the material default white; this returns `0xffffff` then.
#[must_use]
pub fn default_owner_color(owner_id: i64) -> u32 {
    usize::try_from(owner_id % 8)
        .ok()
        .and_then(|i| OWNER_COLORS.get(i).copied())
        .unwrap_or(0x00ff_ffff)
}

/// Default ring stance (`units.ts:5850-5851`): `own` for
/// `HUMAN_OWNER_PRIMARY`, `hostile` otherwise.
#[must_use]
pub fn default_ring_stance(owner_id: i64) -> RingStance {
    if owner_id == HUMAN_OWNER_PRIMARY {
        RingStance::Own
    } else {
        RingStance::Hostile
    }
}

/// `unitTerrainRelief(t)` (`units.ts:229-233`).
#[must_use]
pub fn unit_terrain_relief(t: Terrain) -> f64 {
    match t {
        Terrain::Wzgorza => RELIEF_WZGORZA,
        Terrain::Gory => RELIEF_GORY,
        _ => 0.0,
    }
}

/// A general band and the state it was built for (`generalRings` entry,
/// `units.ts:5810`).
#[derive(Clone, Debug, PartialEq)]
pub struct GeneralRingEntry {
    /// The band.
    pub ring: GeneralHexRing,
    /// Owner it was coloured for.
    pub owner_id: i64,
    /// Hex it was placed on.
    pub hex: HexCoord,
}

type OwnerFn<T> = Box<dyn Fn(i64) -> T>;

/// `UnitRenderer` of the strategic map (see the module docs).
pub struct MapUnitRenderer {
    /// `hexGrid` (`:5794`): terrain per hex (`terrainTopY`,
    /// `unitTerrainRelief`).
    hex_grid: HashMap<HexCoord, Terrain>,
    /// `tokens` (`:5797`): by unit id; `order` keeps the `Map` order.
    tokens: HashMap<String, MapToken>,
    order: Vec<String>,
    /// `generalRings` (`:5810`), `Map` order.
    general_rings: Vec<(String, GeneralRingEntry)>,
    highlight: Option<HighlightLayer>,
    route: Option<PathRoute>,
    selection: Option<SelectionMarker>,
    force_visible_unit_id: Option<String>,
    city_hex_keys: HashSet<HexCoord>,
    ring_stance_for_owner: OwnerFn<RingStance>,
    owner_color_fn: OwnerFn<u32>,
    owner_emblem_resolver: Option<OwnerFn<Option<OwnerEmblemContext>>>,
}

impl std::fmt::Debug for MapUnitRenderer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MapUnitRenderer")
            .field("tokens", &self.order)
            .field("general_rings", &self.general_rings.len())
            .field("highlight", &self.highlight.is_some())
            .field("route", &self.route.is_some())
            .field("selection", &self.selection.is_some())
            .finish_non_exhaustive()
    }
}

impl MapUnitRenderer {
    /// `new UnitRenderer(scene, map)` (`:5864-5867`): the hex grid of the
    /// map (`Object.entries(map.hexes)`).
    #[must_use]
    pub fn new(hexes: impl IntoIterator<Item = (HexCoord, Terrain)>) -> Self {
        Self {
            hex_grid: hexes.into_iter().collect(),
            tokens: HashMap::new(),
            order: Vec::new(),
            general_rings: Vec::new(),
            highlight: None,
            route: None,
            selection: None,
            force_visible_unit_id: None,
            city_hex_keys: HashSet::new(),
            ring_stance_for_owner: Box::new(default_ring_stance),
            owner_color_fn: Box::new(default_owner_color),
            owner_emblem_resolver: None,
        }
    }

    // ------------------------------------------------------------ setters

    /// `setForceVisibleUnitId(id)` (`:5874-5876`).
    pub fn set_force_visible_unit_id(&mut self, id: Option<String>) {
        self.force_visible_unit_id = id;
    }

    /// `setCityHexKeys(keys)` (`:5879-5881`).
    pub fn set_city_hex_keys(&mut self, keys: HashSet<HexCoord>) {
        self.city_hex_keys = keys;
    }

    /// `setRingStanceResolver(fn)` (`:5884-5886`).
    pub fn set_ring_stance_resolver(&mut self, f: impl Fn(i64) -> RingStance + 'static) {
        self.ring_stance_for_owner = Box::new(f);
    }

    /// `setOwnerColorFn(fn)` (`:5889-5891`).
    pub fn set_owner_color_fn(&mut self, f: impl Fn(i64) -> u32 + 'static) {
        self.owner_color_fn = Box::new(f);
    }

    /// `setOwnerEmblemResolver(fn)` (`:5898-5900`).
    pub fn set_owner_emblem_resolver(
        &mut self,
        f: Option<Box<dyn Fn(i64) -> Option<OwnerEmblemContext>>>,
    ) {
        self.owner_emblem_resolver = f;
    }

    /// `_ringColorForOwner` = `_resolveOwnerColor` (`:5902-5908`).
    fn ring_color(&self, owner: i64) -> u32 {
        (self.owner_color_fn)(owner)
    }

    // ------------------------------------------------------------ queries

    /// `topYAt(q, r)` (`:6515-6518`): `terrainTopY(hex)`, 0 outside the map.
    #[must_use]
    pub fn top_y_at(&self, hex: HexCoord) -> f64 {
        self.hex_grid.get(&hex).map_or(0.0, |t| t.top_y())
    }

    /// `getTokenPlacement(q, r)` = `_tokenPlacement` (`:5911-5913`,
    /// `:5982-5997`).
    #[must_use]
    pub fn token_placement(&self, hex: HexCoord) -> (f64, f64, f64) {
        let terrain = self.hex_grid.get(&hex).copied();
        let top_y = terrain.map_or(0.0, Terrain::top_y);
        let on_city = self.city_hex_keys.contains(&hex);
        let relief = terrain.map_or(0.0, unit_terrain_relief);
        let y = top_y + TOKEN_LIFT + (if on_city { CITY_UNIT_EXTRA_LIFT } else { 0.0 }) + relief;
        let (x, z) = axial_to_world(hex, HEX_R);
        if !on_city {
            return (x, y, z);
        }
        let a = CITY_UNIT_OFFSET_ANGLE;
        (
            x + js_cos(a) * CITY_UNIT_OFFSET,
            y,
            z + js_sin(a) * CITY_UNIT_OFFSET,
        )
    }

    /// Number of tokens (`tokens.size`).
    #[must_use]
    pub fn token_count(&self) -> usize {
        self.order.len()
    }

    /// Token of `id`.
    #[must_use]
    pub fn token(&self, id: &str) -> Option<&MapToken> {
        self.tokens.get(id)
    }

    /// Tokens in `Map` order.
    pub fn tokens(&self) -> impl Iterator<Item = &MapToken> {
        self.order.iter().filter_map(|id| self.tokens.get(id))
    }

    /// Unit ids in `tokens` `Map` order.
    #[must_use]
    pub fn token_ids(&self) -> &[String] {
        &self.order
    }

    /// General bands in `Map` order.
    #[must_use]
    pub fn general_rings(&self) -> &[(String, GeneralRingEntry)] {
        &self.general_rings
    }

    /// General band of unit `id`.
    #[must_use]
    pub fn general_ring(&self, id: &str) -> Option<&GeneralRingEntry> {
        self.general_rings
            .iter()
            .find(|(k, _)| k == id)
            .map(|(_, e)| e)
    }

    /// Current highlight discs (`highlightGroup`).
    #[must_use]
    pub const fn highlight(&self) -> Option<&HighlightLayer> {
        self.highlight.as_ref()
    }

    /// Current selection ring (`selectionRing`).
    #[must_use]
    pub const fn selection(&self) -> Option<&SelectionMarker> {
        self.selection.as_ref()
    }

    /// Current route (`routeObjects`).
    #[must_use]
    pub const fn path_route(&self) -> Option<&PathRoute> {
        self.route.as_ref()
    }

    // ------------------------------------------------------------ sync

    /// `sync(units, stackDisplay, dimmedUnitIds)` (`:6095-6263`). The DTO
    /// carries `dimmedUnitIds` per unit ([`vm::UnitViewDto::dimmed`]).
    ///
    /// # Errors
    /// [`NotYetPorted`] when a model builder is missing (none since MOD-07;
    /// the error type is the one of [`crate::models::unit_core::routing::build_model`]).
    pub fn sync(
        &mut self,
        units: &[vm::UnitViewDto],
        stack: Option<&vm::StackViewDto>,
    ) -> Result<(), NotYetPorted> {
        let vitals_by_rep: HashMap<String, &vm::StackVitalsDto> = stack
            .map(|s| {
                s.vitals_by_rep_id
                    .iter()
                    .map(|(id, v)| (id.to_string(), v))
                    .collect()
            })
            .unwrap_or_default();
        let mut present: HashSet<String> = HashSet::new();

        for unit in units {
            let id = unit.id.to_string();
            present.insert(id.clone());
            let hex = HexCoord::new(unit.hex.q, unit.hex.r);
            let on_city = self.city_hex_keys.contains(&hex);
            let (x, y_base, z) = self.token_placement(hex);
            let owner = unit.owner_id.legacy_i64();
            let ring_stance = (self.ring_stance_for_owner)(owner);
            let embarked = unit.embarked;
            let dimmed = unit.dimmed;

            let rebuild = self.tokens.get(&id).map(|t| {
                t.category != unit.category
                    || t.type_id != unit.type_id
                    || t.ring_stance != ring_stance
                    || t.owner_id != owner
                    || t.embarked != embarked
            });
            match rebuild {
                Some(false) => {
                    let t = self.tokens.get_mut(&id).expect("checked above");
                    t.set_position(x, y_base, z);
                    apply_city_token_style(t, on_city);
                }
                Some(true) | None => {
                    if rebuild == Some(true) {
                        self.remove_token(&id);
                    }
                    let color = self.ring_color(owner);
                    let mut t = MapToken::build(&TokenSpec {
                        id: &id,
                        hex,
                        owner_id: owner,
                        category: &unit.category,
                        type_id: &unit.type_id,
                        embarked,
                        ring_stance,
                        owner_color: color,
                        ring_color: color,
                    })?;
                    t.set_position(x, y_base, z);
                    apply_city_token_style(&mut t, on_city);
                    self.tokens.insert(id.clone(), t);
                    self.order.push(id.clone());
                }
            }
            if let Some(t) = self.tokens.get_mut(&id) {
                t.hex = hex;
                t.apply_deferred_dim(dimmed);
            }

            let vitals = vitals_by_rep.get(&id).copied();
            let has_cmd = vitals.map_or(unit.is_general, |v| v.has_commander);
            self.sync_general_ring(&id, hex, owner, has_cmd);
            let owner_color = self.ring_color(owner);
            let plate_owner = self.owner_emblem_resolver.as_ref().and_then(|f| f(owner));
            if let Some(t) = self.tokens.get_mut(&id) {
                let o = &mut t.overlays;
                o.commander_star = has_cmd;
                if let Some(v) = vitals {
                    o.badge_row = BadgeRow {
                        armor: v.armor_badge_level,
                        soft: v.soft_badge_level,
                        stars: v.veteran_stars,
                    };
                    o.veteran_stars = v.veteran_stars;
                } else {
                    o.badge_row = BadgeRow {
                        armor: unit.armor_badge_level,
                        soft: unit.soft_badge_level,
                        stars: unit.veteran_stars,
                    };
                    o.veteran_stars = unit.veteran_stars;
                }
                o.plate_owner = plate_owner;
                o.plate_vitals = StatPlateVitals {
                    ruch_left: Some(vitals.map_or(unit.ruch_left, |v| v.ruch_left)),
                    ruch_max: Some(vitals.map_or(unit.ruch_max, |v| v.ruch_max)),
                    hp: Some(vitals.map_or(unit.hp, |v| v.hp)),
                    // `hpMax: vitals ? vitals.hpMax : undefined` (`:6233`).
                    hp_max: vitals.map(|v| v.hp_max),
                    field_power_m: vitals.map(|v| v.field_power_m),
                    owner_color: Some(owner_color),
                };
            }
        }

        let gone: Vec<String> = self
            .general_rings
            .iter()
            .filter(|(k, _)| !present.contains(k))
            .map(|(k, _)| k.clone())
            .collect();
        for id in gone {
            self.remove_general_ring(&id);
        }

        let gone: Vec<String> = self
            .order
            .iter()
            .filter(|k| !present.contains(*k))
            .cloned()
            .collect();
        for id in gone {
            self.remove_token(&id);
        }

        self.apply_stack_display(units, stack);
        for (id, entry) in &mut self.general_rings {
            let v = self.tokens.get(id).is_some_and(MapToken::visible);
            entry.ring.set_visible(v);
        }
        Ok(())
    }

    fn remove_token(&mut self, id: &str) {
        if self.tokens.remove(id).is_some() {
            self.order.retain(|k| k != id);
        }
    }

    /// `_applyStackDisplay(units, stackDisplay)` (`:6266-6307`) and
    /// `_applySufferingIcons` (`:6319-6371`), as the resulting state.
    fn apply_stack_display(&mut self, units: &[vm::UnitViewDto], stack: Option<&vm::StackViewDto>) {
        let visible: Option<HashSet<String>> =
            stack.map(|s| s.visible_ids.iter().map(ToString::to_string).collect());
        let badges: HashMap<String, u32> = stack
            .map(|s| {
                s.badge_by_rep_id
                    .iter()
                    .map(|(id, n)| (id.to_string(), *n))
                    .collect()
            })
            .unwrap_or_default();
        let starving: HashSet<String> = stack
            .map(|s| s.starving_rep_ids.iter().map(ToString::to_string).collect())
            .unwrap_or_default();
        let gold: HashSet<String> = stack
            .map(|s| {
                s.gold_deficit_rep_ids
                    .iter()
                    .map(ToString::to_string)
                    .collect()
            })
            .unwrap_or_default();

        for unit in units {
            let id = unit.id.to_string();
            let force = self.force_visible_unit_id.as_deref() == Some(id.as_str());
            let Some(t) = self.tokens.get_mut(&id) else {
                continue;
            };
            let show = visible.as_ref().is_none_or(|v| v.contains(&id) || force);
            t.set_visible(show);
        }

        for t in self.tokens.values_mut() {
            let vis = t.visible();
            let o = &mut t.overlays;
            o.stack_badge = badges.get(&t.id).copied().filter(|&n| n > 1 && vis);
            o.starving_icon = (vis && starving.contains(&t.id))
                .then(|| SufferingIcon::starving(gold.contains(&t.id)));
            o.gold_deficit_icon = (vis && gold.contains(&t.id))
                .then(|| SufferingIcon::gold_deficit(starving.contains(&t.id)));
        }
    }

    // ------------------------------------------------------------ general band

    /// `_syncGeneralRing(unit, hasCommander)` (`:6915-6932`).
    fn sync_general_ring(&mut self, id: &str, hex: HexCoord, owner: i64, has_cmd: bool) {
        let cur = self.general_rings.iter().position(|(k, _)| k == id);
        if !has_cmd {
            if cur.is_some() {
                self.remove_general_ring(id);
            }
            return;
        }
        if let Some(i) = cur {
            let e = &self.general_rings[i].1;
            if e.owner_id == owner && e.hex == hex {
                return;
            }
            self.remove_general_ring(id);
        }
        let mut ring = GeneralHexRing::new(self.ring_color(owner), GENERAL_RING_BASE_WIDTH);
        // Highest terrain of the 7 hexes, so the band does not sink behind a
        // higher neighbour.
        let tops: Vec<f64> = GENERAL_RING_HEX_OFFSETS
            .iter()
            .map(|&(dq, dr)| self.top_y_at(HexCoord::new(hex.q + dq, hex.r + dr)))
            .collect();
        let (x, z) = axial_to_world(hex, HEX_R);
        ring.set_position(x, general_ring_y(&tops), z);
        // `this.tokens.get(unit.id)?.visible !== false`.
        ring.set_visible(self.tokens.get(id).is_none_or(MapToken::visible));
        self.general_rings.push((
            id.to_owned(),
            GeneralRingEntry {
                ring,
                owner_id: owner,
                hex,
            },
        ));
    }

    /// `_removeGeneralRing(id)` (`:6934-6940`).
    fn remove_general_ring(&mut self, id: &str) {
        self.general_rings.retain(|(k, _)| k != id);
    }

    /// `applyGeneralRingLod(camDist, fovDeg, viewportH)` (`:5787-5791`).
    pub fn apply_general_ring_lod(&mut self, cam_dist: f64, fov_deg: f64, viewport_h: f64) {
        if self.general_rings.is_empty() {
            return;
        }
        let w = general_ring_world_width(cam_dist, fov_deg, viewport_h, GENERAL_RING_MIN_PX);
        for (_, e) in &mut self.general_rings {
            e.ring.set_width(w);
        }
    }

    /// `setTokenWorldPosition(id, x, y, z)` (`:6498-6509`): the token and
    /// the X/Z of its general band (the band height stays).
    pub fn set_token_world_position(&mut self, id: &str, x: f64, y: f64, z: f64) {
        if let Some(t) = self.tokens.get_mut(id) {
            t.set_position(x, y, z);
        }
        if let Some((_, e)) = self.general_rings.iter_mut().find(|(k, _)| k == id) {
            let (_, gy, _) = e.ring.position();
            e.ring.set_position(x, gy, z);
        }
    }

    // ------------------------------------------------------------ overlays

    /// `setHighlight(hexes, opacity = HIGHLIGHT_OPACITY)` (`:6524-6556`).
    pub fn set_highlight(&mut self, hexes: &[HexCoord], opacity: f64) {
        self.clear_highlight();
        let grid = &self.hex_grid;
        let top_y = |h: HexCoord| grid.get(&h).map_or(0.0, |t| t.top_y());
        self.highlight = HighlightLayer::build(hexes, opacity, &top_y);
    }

    /// `setHighlight(hexes)` with the default opacity.
    pub fn set_highlight_default(&mut self, hexes: &[HexCoord]) {
        self.set_highlight(hexes, HIGHLIGHT_OPACITY);
    }

    /// `clearHighlight()` (`:6559-6568`).
    pub fn clear_highlight(&mut self) {
        self.highlight = None;
    }

    /// `setSelectionHex(q, r, ownerId = HUMAN_OWNER_PRIMARY)` (`:6571-6591`).
    pub fn set_selection_hex(&mut self, hex: HexCoord, owner_id: i64) {
        self.clear_selection_hex();
        let terrain = self.hex_grid.get(&hex).copied();
        let top_y = terrain.map_or(0.0, Terrain::top_y);
        let relief = terrain.map_or(0.0, unit_terrain_relief);
        let color = self.ring_color(owner_id);
        self.selection = Some(SelectionMarker::build(hex, owner_id, color, top_y, relief));
    }

    /// `clearSelectionHex()` (`:6593-6602`).
    pub fn clear_selection_hex(&mut self) {
        self.selection = None;
    }

    /// `setPathRoute(hexes, opts)` (`:6608-6684`).
    pub fn set_path_route(&mut self, hexes: &[HexCoord], opts: &PathRouteOptions) {
        self.clear_path_route();
        let grid = &self.hex_grid;
        let top_y = |h: HexCoord| grid.get(&h).map_or(0.0, |t| t.top_y());
        self.route = PathRoute::build(hexes, opts, &top_y);
    }

    /// `clearPathRoute()` (`:6716-6744`).
    pub fn clear_path_route(&mut self) {
        self.route = None;
    }

    /// `dispose()` (`:6747-6857`): route, highlight, every token and every
    /// general band. Like the web it leaves the selection ring alone.
    pub fn dispose(&mut self) {
        self.clear_path_route();
        self.clear_highlight();
        self.tokens.clear();
        self.order.clear();
        self.general_rings.clear();
    }

    // ------------------------------------------------------------ picking

    /// The pickable models of the **visible** tokens (`pickUnitIdAt` roots,
    /// `:5933`), in `tokens` order, for [`crate::pick::ray_to_unit`]: every
    /// triangle mesh of the token subtree with its world matrix (also
    /// invisible children: `intersectObjects` does not test `visible`).
    /// The general band is not a child of the token and is not pickable
    /// (`mesh.raycast = () => {}`).
    #[must_use]
    pub fn pick_models(&self) -> Vec<UnitPickModel> {
        self.tokens()
            .filter(|t| t.visible())
            .map(|t| UnitPickModel {
                id: t.id.clone(),
                hex: t.hex,
                meshes: token_pick_meshes(t),
            })
            .collect()
    }
}

/// `_applyCityTokenStyle(obj, onCity)` (`:5999-6002`).
fn apply_city_token_style(t: &mut MapToken, on_city: bool) {
    t.on_city = on_city;
    let root = &mut t.model.nodes[crate::scene::ROOT];
    root.set_scale_scalar(if on_city { CITY_UNIT_SCALE } else { 1.0 });
    root.render_order = if on_city { CITY_UNIT_RENDER_ORDER } else { 0 };
}

/// Triangle meshes of one token with their world matrices.
fn token_pick_meshes(t: &MapToken) -> Vec<PickMesh> {
    let world = t.model.world_matrices(None);
    t.model
        .traverse()
        .into_iter()
        .filter_map(|id| {
            let n = &t.model.nodes[id];
            if !n.is_mesh() {
                return None;
            }
            let md = n.mesh()?;
            let mesh = md.geo.mesh();
            let side = match t.model.materials.get(md.material()).map(|m| m.side) {
                Some(Side::Back) => PickSide::Back,
                Some(Side::Double) => PickSide::Double,
                _ => PickSide::Front,
            };
            Some(PickMesh {
                geometry: TriGeometry::new(mesh.positions.clone(), mesh.indices.clone()),
                world: PMat4 { e: world[id].e },
                side,
            })
        })
        .collect()
}
