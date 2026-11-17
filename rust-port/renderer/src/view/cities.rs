//! Q3 `R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES`: owners, cities, wonders and
//! their markers (`P4-1G-ADAPTER-ROZPOZNANIE.md` §3.4, §3.6, §7).
//!
//! DTO → renderer input, pin `07d2fbd72`:
//! - `cities[]` + `owners[]` → [`City`] + the [`CityRenderOptions`]
//!   callbacks of `_cityRenderOpts` (`gra/src/main.ts:2939-3005`), owned by
//!   [`CityInputs`];
//! - `wonders[]` → [`PlacedWonder`] + [`WonderRenderOptions`]
//!   (`wonderRenderer.sync(placedWonderSnapshot(), { ownerColorFn:
//!   civColorFn })`, `main.ts:4316`), owned by [`WonderInputs`];
//! - `owners[]` → [`OwnerEmblemContext`] of `setOwnerEmblemResolver`
//!   (`main.ts:10373-10384`): `civId: isBarbarian ? null : …`;
//! - `cities[].badge` → [`CityMapBadgeInput`] of `_buildBadgeInput`
//!   (`render/cities.ts:875-929`). There is no integrator yet
//!   (`CityRenderer.syncStatChips`, R5 of the document §4): this module only
//!   builds the input;
//! - fog: `cityRenderer.applyFogVisibility(vis, fogOn, ME())` and
//!   `wonderRenderer.applyFogVisibility(vis, fogOn)` (`main.ts:13503-13504`,
//!   `:13512-13513`) fed by [`FogSets`].
//!
//! Not carried by the DTO, so not handled here (no invented field): the
//! `revealAllLand` mode (gap L1), wonder build sites `wonderBuildSites`
//! (gap L5), the UI part of `isVisible` (`cityPanelViewCityId`, gap L4).
//!
//! `getRevolt` / `getUnitCountOnHex` (R6) are carried as [`RevoltInputs`]
//! and fed to [`RevoltRenderer::sync`] by [`CityInputs::sync_revolt`], the
//! `_syncRevolt` / `_removeRevolt` calls of `CityRenderer.sync`
//! (`render/cities.ts:541`, `:551`, `:586`, `:597-599`).
//!
//! No game rules: every value is the producer's; the adapter only looks them
//! up by owner / city id.

use std::collections::hash_map::Entry;
use std::collections::HashMap;

use civ_view_model as vm;

use super::convert::{
    city_id_string, city_wall_kind, map_outline_kind, owner_i32, pick_hex, terrain,
};
use super::{FogSets, ViewAdapterError};
use crate::cities::revolt::{RevoltInputs, RevoltRenderer};
use crate::core::bronze::BronzeCiv;
use crate::models::cities::outline::CityMapOutlineKind;
use crate::models::cities::renderer::{City, CityRenderOptions, CityRenderer, CityWallKind};
use crate::models::wonders::{PlacedWonder, WonderRenderOptions, WonderRenderer};
use crate::raster::atlas::keys::{
    CityMapBadgeInput, OwnerEmblemContext as AtlasOwnerEmblemContext,
};
use crate::units::overlay::emblem::OwnerEmblemContext;

/// A cities/wonders DTO the renderer input cannot represent. Reported, never
/// replaced by a default.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CityAdapterError {
    /// A shared conversion failed (e.g. an owner outside `i32`).
    View(ViewAdapterError),
    /// `owners[].bronze_civ` is not a [`BronzeCiv`] web id
    /// (`BronzeCiv::from_web_id`, `core/bronze.rs:72`). The producer already
    /// applied `ikonaIdToBronzeCiv` (`main.ts:2955`), so an unknown key is a
    /// contract violation, not a fallback case.
    UnknownBronzeCiv {
        /// Legacy owner number.
        owner: i64,
        /// The rejected value.
        value: String,
    },
    /// Two `owners[]` entries for one owner.
    DuplicateOwner {
        /// Legacy owner number.
        owner: i64,
    },
    /// Two `cities[]` entries with one id.
    DuplicateCity {
        /// The city id (decimal).
        id: String,
    },
    /// A city or a wonder whose owner has no `owners[]` entry: its era, civ
    /// and colour would have to be invented.
    MissingOwner {
        /// Legacy owner number.
        owner: i64,
    },
}

impl From<ViewAdapterError> for CityAdapterError {
    fn from(e: ViewAdapterError) -> Self {
        Self::View(e)
    }
}

impl std::fmt::Display for CityAdapterError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::View(e) => e.fmt(f),
            Self::UnknownBronzeCiv { owner, value } => {
                write!(f, "owner {owner}: unknown bronze civ {value:?}")
            }
            Self::DuplicateOwner { owner } => write!(f, "owner {owner} listed twice"),
            Self::DuplicateCity { id } => write!(f, "city {id} listed twice"),
            Self::MissingOwner { owner } => write!(f, "owner {owner} has no owners[] entry"),
        }
    }
}

impl std::error::Error for CityAdapterError {}

// ------------------------------------------------------------ renderers

/// `new CityRenderer(scene, map)` (`main.ts`, `render/cities.ts` `hexGrid`
/// from `map.hexes`): the static map as `(HexCoord, Terrain)` pairs.
#[must_use]
pub fn city_renderer(map: &vm::MapViewDto) -> CityRenderer {
    CityRenderer::new(
        map.hexes
            .iter()
            .map(|h| (pick_hex(h.coord), terrain(h.teren_bazowy))),
    )
}

/// `new WonderRenderer(scene, map)`: same `hexGrid` as [`city_renderer`].
#[must_use]
pub fn wonder_renderer(map: &vm::MapViewDto) -> WonderRenderer {
    WonderRenderer::new(
        map.hexes
            .iter()
            .map(|h| (pick_hex(h.coord), terrain(h.teren_bazowy))),
    )
}

// ------------------------------------------------------------ owners

/// The per-owner values `_cityRenderOpts` reads (`main.ts:2949-2978`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OwnerRenderEntry {
    /// `getEra: empireEpochForOwner` (`main.ts:2949`).
    pub era: f64,
    /// `getCiv: ikonaIdToBronzeCiv(civTypeForOwner(…))` (`main.ts:2955`).
    pub civ: BronzeCiv,
    /// `ownerColorFn: civColorFn` (`main.ts:2978`).
    pub color: u32,
    /// `getMapOutlineKind: cityMapOutlineKindForOwner` (`main.ts:2972`).
    pub map_outline_kind: Option<CityMapOutlineKind>,
}

fn owner_table(
    owners: &[vm::OwnerViewDto],
) -> Result<HashMap<i32, OwnerRenderEntry>, CityAdapterError> {
    let mut out = HashMap::with_capacity(owners.len());
    for o in owners {
        let id = owner_i32(o.owner_id)?;
        let civ = BronzeCiv::from_web_id(&o.bronze_civ).ok_or_else(|| {
            CityAdapterError::UnknownBronzeCiv {
                owner: o.owner_id.legacy_i64(),
                value: o.bronze_civ.clone(),
            }
        })?;
        let entry = OwnerRenderEntry {
            era: o.era,
            civ,
            color: o.color,
            map_outline_kind: o.map_outline_kind.map(map_outline_kind),
        };
        match out.entry(id) {
            Entry::Occupied(_) => {
                return Err(CityAdapterError::DuplicateOwner {
                    owner: o.owner_id.legacy_i64(),
                })
            }
            Entry::Vacant(v) => {
                v.insert(entry);
            }
        }
    }
    Ok(out)
}

/// `setOwnerEmblemResolver` (`main.ts:10373-10384`) for one owner:
/// - `civId: isBarbarian(ownerId) ? null : civTypeForOwner(ownerId)` — the
///   adapter forces `None` for barbarians whatever `civ_icon_id` holds
///   (`owners.rs:92-98`);
/// - `era: empireEpochForOwner`, `isCityState: portraitForceCultureIcon`,
///   `isBarbarian`;
/// - `ringHex: isBarbarian || isCityState ? null : civRingHexFn(ownerId)`.
///
/// The renderer has two identical context types (document §3.4, NIE_ZMIERZONO
/// 10); this one feeds the unit emblem and stat plate
/// (`units/overlay/emblem.rs:28`, `stat_plate.rs`). The atlas twin is
/// [`atlas_owner_emblem_context`].
#[must_use]
pub fn owner_emblem_context(o: &vm::OwnerViewDto) -> OwnerEmblemContext {
    let plain = !(o.is_barbarian || o.is_city_state);
    OwnerEmblemContext {
        civ_id: (!o.is_barbarian).then(|| o.civ_icon_id.clone()),
        era: o.era,
        is_city_state: o.is_city_state,
        is_barbarian: o.is_barbarian,
        ring_hex: o.ring_hex.clone().filter(|_| plain),
    }
}

/// [`owner_emblem_context`] as the atlas key type
/// (`raster/atlas/keys.rs:264`, same fields, same rule).
#[must_use]
pub fn atlas_owner_emblem_context(o: &vm::OwnerViewDto) -> AtlasOwnerEmblemContext {
    let c = owner_emblem_context(o);
    AtlasOwnerEmblemContext {
        civ_id: c.civ_id,
        era: c.era,
        is_city_state: c.is_city_state,
        is_barbarian: c.is_barbarian,
        ring_hex: c.ring_hex,
    }
}

// ------------------------------------------------------------ cities

/// The per-city values `_cityRenderOpts` reads by city id.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityRenderEntry {
    /// `getLevel` (`main.ts:2956-2959`), computed by the producer.
    pub level: f64,
    /// `getWallKind` (`main.ts:2961-2966`).
    pub wall_kind: CityWallKind,
    /// Fog part of `isVisible` (`cityFogVisible`, `main.ts:2973-2976`).
    pub fog_visible: bool,
}

/// `cities[]` + `owners[]` as the inputs of `CityRenderer::sync` /
/// `sync_map_outlines` (`render/cities.ts:459-558`, `:635-651`).
///
/// `CityRenderOptions` borrows its callbacks, so this value owns the tables
/// and lends the options through [`Self::with_render_options`].
#[derive(Debug, Clone, PartialEq)]
pub struct CityInputs {
    /// The cities in `cities[]` order (D-DTO-5).
    pub cities: Vec<City>,
    owners: HashMap<i32, OwnerRenderEntry>,
    by_city: HashMap<String, CityRenderEntry>,
    /// `getRevolt` / `getUnitCountOnHex` of the same `cities[]` (R6).
    revolt: RevoltInputs,
}

impl CityInputs {
    /// Builds the inputs.
    ///
    /// # Errors
    ///
    /// - [`CityAdapterError::View`] with [`ViewAdapterError::OwnerOutOfI32`]
    ///   for an owner outside `i32` (never truncated or saturated);
    /// - [`CityAdapterError::UnknownBronzeCiv`], [`CityAdapterError::DuplicateOwner`],
    ///   [`CityAdapterError::DuplicateCity`], [`CityAdapterError::MissingOwner`].
    pub fn from_dto(
        owners: &[vm::OwnerViewDto],
        cities: &[vm::CityViewDto],
    ) -> Result<Self, CityAdapterError> {
        let owners = owner_table(owners)?;
        let mut out = Self {
            cities: Vec::with_capacity(cities.len()),
            owners,
            by_city: HashMap::with_capacity(cities.len()),
            revolt: RevoltInputs::from_dto(cities),
        };
        for c in cities {
            let owner_id = owner_i32(c.owner_id)?;
            if !out.owners.contains_key(&owner_id) {
                return Err(CityAdapterError::MissingOwner {
                    owner: c.owner_id.legacy_i64(),
                });
            }
            let id = city_id_string(c.id);
            let entry = CityRenderEntry {
                level: c.level,
                wall_kind: city_wall_kind(c.wall_kind),
                fog_visible: c.fog_visible,
            };
            match out.by_city.entry(id.clone()) {
                Entry::Occupied(_) => return Err(CityAdapterError::DuplicateCity { id }),
                Entry::Vacant(v) => {
                    v.insert(entry);
                }
            }
            out.cities.push(City {
                id,
                owner_id,
                q: c.hex.q,
                r: c.hex.r,
                population: c.population,
            });
        }
        Ok(out)
    }

    /// The owner entry (`None` = owner not in `owners[]`).
    #[must_use]
    pub fn owner(&self, owner_id: i32) -> Option<&OwnerRenderEntry> {
        self.owners.get(&owner_id)
    }

    /// The city entry (`None` = id not in `cities[]`).
    #[must_use]
    pub fn city(&self, id: &str) -> Option<&CityRenderEntry> {
        self.by_city.get(id)
    }

    /// Lends the [`CityRenderOptions`] of `_cityRenderOpts`.
    ///
    /// Every city of [`Self::cities`] has its owner and its own entry
    /// (checked by [`Self::from_dto`]). For any other argument a callback
    /// falls back to the renderer / pin default: `getEra` 1
    /// (`renderer.rs:137`), `getCiv` `default_civ`, `getLevel` 1
    /// (`main.ts:2958`, city not found), `getWallKind` `'none'` (no built
    /// buildings, `main.ts:2962-2965`), `isVisible` `true` (`?? true`,
    /// `main.ts:2975`), no outline; the colour of an unknown owner is the
    /// `cities.ts` default `ownerColor` and `0` where that is `undefined`
    /// (unreachable from [`Self::cities`]).
    ///
    /// `get_walls` stays `None`: `getWallKind` is given, so `getWalls` is
    /// never read (`renderer.rs:498-506`).
    pub fn with_render_options<R>(&self, f: impl FnOnce(&CityRenderOptions<'_>) -> R) -> R {
        let get_era = |o: i32| self.owners.get(&o).map_or(1.0, |e| e.era);
        let get_civ = |o: i32| {
            self.owners.get(&o).map_or_else(
                || crate::models::cities::renderer::default_civ(o),
                |e| e.civ,
            )
        };
        let get_level = |id: &str| self.by_city.get(id).map_or(1.0, |e| e.level);
        let get_wall_kind = |id: &str| {
            self.by_city
                .get(id)
                .map_or(CityWallKind::None, |e| e.wall_kind)
        };
        let is_visible = |c: &City| self.by_city.get(&c.id).is_none_or(|e| e.fog_visible);
        let get_map_outline_kind = |o: i32| self.owners.get(&o).and_then(|e| e.map_outline_kind);
        let owner_color_fn = |o: i32| {
            self.owners.get(&o).map_or_else(
                || crate::models::cities::renderer::owner_color(o).unwrap_or(0),
                |e| e.color,
            )
        };
        let opts = CityRenderOptions {
            get_era: Some(&get_era),
            get_civ: Some(&get_civ),
            get_level: Some(&get_level),
            get_walls: None,
            get_wall_kind: Some(&get_wall_kind),
            is_visible: Some(&is_visible),
            get_map_outline_kind: Some(&get_map_outline_kind),
            owner_color_fn: Some(&owner_color_fn),
        };
        f(&opts)
    }

    /// `cityRenderer.sync(cities, _cityRenderOpts())`.
    pub fn sync(&self, renderer: &mut CityRenderer) {
        self.with_render_options(|o| renderer.sync(&self.cities, o));
    }

    /// The revolt calls of `cityRenderer.sync(cities, _cityRenderOpts())`
    /// (`render/cities.ts:541`, `:551`, `:586`, `:597-599`): the same
    /// `cities[]` as [`Self::sync`], as [`RevoltInputs`], given to
    /// [`RevoltRenderer::sync`]. Call it after [`Self::sync`] on the same
    /// [`CityRenderer`]: in the web `_syncRevolt` runs inside `sync`, on the
    /// group that `sync` has just kept or built. Called before [`Self::sync`]
    /// it finds no group for a new city and makes no sprite in that frame;
    /// [`Self::sync_with_revolt`] runs both in the web order.
    ///
    /// Wired at the adapter level only: no app / bridge caller yet, it
    /// depends on the engine -> renderer DTO path (audit L6).
    pub fn sync_revolt(&self, renderer: &mut RevoltRenderer, cities: &CityRenderer) {
        renderer.sync(&self.revolt, cities);
    }

    /// `cityRenderer.sync(cities, _cityRenderOpts())` with its revolt calls,
    /// as the one web call: [`Self::sync`] then [`Self::sync_revolt`] on the
    /// same [`CityRenderer`], so the order cannot be swapped.
    pub fn sync_with_revolt(&self, cities: &mut CityRenderer, revolt: &mut RevoltRenderer) {
        self.sync(cities);
        self.sync_revolt(revolt, cities);
    }

    /// `cityRenderer.syncMapOutlines(cities, _cityRenderOpts())`
    /// (`main.ts:11437`).
    pub fn sync_map_outlines(&self, renderer: &mut CityRenderer) {
        self.with_render_options(|o| renderer.sync_map_outlines(&self.cities, o));
    }
}

/// `cityRenderer.applyFogVisibility(vis, fogOn, ME())` (`main.ts:13503`,
/// `:13512`): `vis` and `fogOn` from [`FogSets`] (fog off = `ALL_KEYS`,
/// `false`), `ME()` = `viewer.owner_id`.
///
/// # Errors
///
/// [`CityAdapterError::View`] when the viewer owner does not fit `i32`.
pub fn apply_city_fog(
    renderer: &mut CityRenderer,
    fog: &FogSets,
    viewer: &vm::ViewerDto,
) -> Result<(), CityAdapterError> {
    let me = owner_i32(viewer.owner_id)?;
    renderer.apply_fog_visibility(&fog.visible_keys, fog.fog_on, me);
    Ok(())
}

// ------------------------------------------------------------ wonders

/// `PlacedWonderDto` → `PlacedWonder` (`wonderRenderer.ts:12-19`).
///
/// # Errors
///
/// [`ViewAdapterError::OwnerOutOfI32`] for an owner outside `i32`.
pub fn placed_wonder(w: &vm::PlacedWonderDto) -> Result<PlacedWonder, ViewAdapterError> {
    Ok(PlacedWonder {
        wonder_id: w.wonder_id.clone(),
        q: w.hex.q,
        r: w.hex.r,
        owner_id: owner_i32(w.owner_id)?,
        ruin: w.ruin,
    })
}

/// `wonders[]` + `owners[]` as the inputs of `WonderRenderer::sync`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WonderInputs {
    /// `placedWonderSnapshot()` in `wonders[]` order.
    pub placed: Vec<PlacedWonder>,
    colors: HashMap<i32, u32>,
}

impl WonderInputs {
    /// Builds the inputs.
    ///
    /// # Errors
    ///
    /// As [`CityInputs::from_dto`] for the owners; [`CityAdapterError::MissingOwner`]
    /// for a wonder whose owner has no `owners[]` entry.
    pub fn from_dto(
        owners: &[vm::OwnerViewDto],
        wonders: &[vm::PlacedWonderDto],
    ) -> Result<Self, CityAdapterError> {
        let colors: HashMap<i32, u32> = owner_table(owners)?
            .into_iter()
            .map(|(k, e)| (k, e.color))
            .collect();
        let mut placed = Vec::with_capacity(wonders.len());
        for w in wonders {
            let p = placed_wonder(w)?;
            if !colors.contains_key(&p.owner_id) {
                return Err(CityAdapterError::MissingOwner {
                    owner: w.owner_id.legacy_i64(),
                });
            }
            placed.push(p);
        }
        Ok(Self { placed, colors })
    }

    /// `wonderRenderer.sync(placedWonderSnapshot(), { ownerColorFn: civColorFn })`
    /// (`main.ts:4316`): no `isVisible` (fog comes from
    /// [`apply_wonder_fog`]); an owner outside the table (unreachable from
    /// [`Self::placed`]) gets the `wonderRenderer.ts` default colour, `0`
    /// where that is `undefined`.
    pub fn sync(&self, renderer: &mut WonderRenderer) {
        let owner_color_fn = |o: i32| {
            self.colors
                .get(&o)
                .copied()
                .unwrap_or_else(|| crate::models::wonders::default_owner_color(o).unwrap_or(0))
        };
        renderer.sync(
            &self.placed,
            WonderRenderOptions {
                is_visible: None,
                owner_color_fn: Some(&owner_color_fn),
            },
        );
    }
}

/// `wonderRenderer.applyFogVisibility(vis, fogOn)` (`main.ts:13504`,
/// `:13513`). Unlike cities, own wonders are filtered too (the pin passes no
/// owner).
pub fn apply_wonder_fog(renderer: &mut WonderRenderer, fog: &FogSets) {
    renderer.apply_fog_visibility(&fog.visible_keys, fog.fog_on);
}

// ------------------------------------------------------------ badge

/// `ProductionKind` → `prodKind` string (`game/production.ts:95`).
#[must_use]
pub const fn production_kind(k: vm::ProductionKind) -> &'static str {
    match k {
        vm::ProductionKind::Budynek => "budynek",
        vm::ProductionKind::Jednostka => "jednostka",
    }
}

/// `CityBadgeDto` → `CityMapBadgeInput` (`render/cities.ts:905-929`), all 17
/// DTO fields. The two renderer/UI fields are parameters, never defaults:
/// `hoverExpanded = options.hoverStatChipCityId === city.id` (`:889`) and
/// `lodLevel = this.badgeLodLevel` (`:929`).
///
/// No integrator: `CityRenderer.syncStatChips` is not ported yet (R5).
#[must_use]
pub fn city_badge_input(
    b: &vm::CityBadgeDto,
    hover_expanded: bool,
    lod_level: Option<f64>,
) -> CityMapBadgeInput {
    CityMapBadgeInput {
        city_name: b.city_name.clone(),
        population: b.population,
        defense_tier: b.defense_tier,
        civ_icon_id: b.civ_icon_id.clone(),
        owner_color: Some(b.owner_color),
        prod_active: b.prod_active,
        prod_kind: b.prod_kind.map(|k| production_kind(k).to_owned()),
        prod_id: b.prod_id.clone(),
        growth_percent: b.growth_percent,
        growth_starving: b.growth_starving,
        resource_warning: b.resource_warning,
        hover_expanded,
        prod_category_label: b.prod_category_label.clone(),
        prod_item_name: b.prod_item_name.clone(),
        prod_paused: b.prod_paused,
        is_city_state: b.is_city_state,
        era: Some(b.era),
        is_capital: b.is_capital,
        lod_level,
    }
}
