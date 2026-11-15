//! Owners and cities (contract §3.4).
//!
//! Web literals cite the pin `07d2fbd72` (`gra/src/…`).

use crate::ids::{CityId, HexCoord, OwnerRef};
use serde::{Deserialize, Serialize};

/// `CityMapOutlineKind` (`render/cityMapOutline.ts:10`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MapOutlineKind {
    /// `'player'`.
    Player,
    /// `'war'`.
    War,
    /// `'neutral'`.
    Neutral,
    /// `'ally'`.
    Ally,
}

/// Relation of an owner to the viewer (contract §3.4 `relationToViewer`):
/// `self` for the viewer's own owner (`isMe`), else the web
/// `RelationBorderStatus` (`game/civ-visual.ts:89`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RelationToViewer {
    /// The viewer itself (`isMe(ownerId)`, `main.ts:4065-4068`).
    #[serde(rename = "self")]
    Own,
    /// `'wojna'`.
    #[serde(rename = "wojna")]
    Wojna,
    /// `'pokoj'`.
    #[serde(rename = "pokoj")]
    Pokoj,
    /// `'sojusz'`.
    #[serde(rename = "sojusz")]
    Sojusz,
    /// `'neutralni'`.
    #[serde(rename = "neutralni")]
    Neutralni,
}

/// `CityWallKind` (`render/cities.ts:306`; `render/cityMapStatChip.ts:15`).
/// The producer maps the engine `city_fortification_kind` `'mur'` to `stone`
/// (`main.ts:2961-2965`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WallKind {
    /// `'none'`.
    None,
    /// `'palisada'`.
    Palisada,
    /// `'stone'`.
    Stone,
}

/// `ProductionKind` (`game/production.ts:95`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProductionKind {
    /// `'budynek'`.
    Budynek,
    /// `'jednostka'`.
    Jednostka,
}

/// The viewer of the snapshot (contract §3.1 `viewer`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ViewerDto {
    /// Active seat (`playerOwnerId`, `HUMAN_OWNER_PRIMARY`).
    pub owner_id: OwnerRef,
    /// `fogOn` (`render/cities.ts:740` @ `07d2fbd72`).
    pub fog_active: bool,
}

/// One owner (contract §3.4 `OwnerViewDto`). Order of `owners[]`: ascending
/// by [`OwnerRef`].
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OwnerViewDto {
    /// The owner.
    pub owner_id: OwnerRef,
    /// `ownerColorFn` / `civColorFn`, `0xRRGGBB`.
    pub color: u32,
    /// `getCivIconId`.
    ///
    /// A `String` as contract §3.4 says, also for barbarians. The web emblem
    /// resolver sends `civId: isBarbarian(ownerId) ? null : civTypeForOwner(…)`
    /// (`main.ts:10377` @ `07d2fbd72`) and the renderer has
    /// `OwnerEmblemContext.civ_id: Option<String>`
    /// (`renderer/src/units/overlay/emblem.rs:29`), so the adapter (P4-1G)
    /// must set `civ_id = None` when [`Self::is_barbarian`] is `true`, whatever
    /// this field holds. Which value the producer writes here for barbarians
    /// is NIE_ZMIERZONO (a gap of contract §3.4, to be closed in P4-1).
    pub civ_icon_id: String,
    /// `getCiv` → `ikonaIdToBronzeCiv(…)` (city model key).
    pub bronze_civ: String,
    /// `getEra` (1 stone, 2 bronze, 3 iron), a JS number.
    pub era: f64,
    /// `isCityStateOwner`.
    pub is_city_state: bool,
    /// `OwnerEmblemContext.is_barbarian`.
    pub is_barbarian: bool,
    /// `'#' + civColorFn(ownerId)` (6 hex digits), `None` for barbarians and
    /// city-states (`main.ts:10373-10384`).
    pub ring_hex: Option<String>,
    /// `getCivDisplayName`.
    pub display_name: Option<String>,
    /// `getMapOutlineKind`.
    pub map_outline_kind: Option<MapOutlineKind>,
    /// `getCapitalCityId`.
    pub capital_city_id: Option<CityId>,
    /// Relation colour input (`relationColorFn`).
    pub relation_to_viewer: RelationToViewer,
}

/// City map badge (contract §3.4 `CityBadgeDto`): `CityMapBadgeInput`
/// (`render/cityMapStatChip.ts:17-78`, 19 fields) without the UI/renderer
/// state `hoverExpanded` and `lodLevel`. Values as filled by
/// `_buildBadgeInput` (`render/cities.ts:905-929`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CityBadgeDto {
    /// Label (`format_city_map_label`).
    pub city_name: String,
    /// `city.population ?? 1`.
    pub population: f64,
    /// `CityMapDefenseTier` `0 | 1 | 2` (`cityMapStatChip.ts:12`).
    pub defense_tier: u8,
    /// `getCivIconId(ownerId) ?? 'grecy'`.
    pub civ_icon_id: String,
    /// Owner colour `0xRRGGBB`.
    pub owner_color: u32,
    /// `front !== null && !paused`.
    pub prod_active: bool,
    /// `front?.kind ?? null`.
    pub prod_kind: Option<ProductionKind>,
    /// `front?.id ?? null`.
    pub prod_id: Option<String>,
    /// `front?.nazwa ?? null`.
    pub prod_item_name: Option<String>,
    /// `'Budynek' | 'Jednostka' | null`.
    pub prod_category_label: Option<String>,
    /// `prod?.wstrzymana === true`.
    pub prod_paused: bool,
    /// Growth % per turn, only for the viewer's cities (`cities.ts:902`).
    pub growth_percent: Option<f64>,
    /// `!growth.nakarmione` (false when no growth).
    pub growth_starving: bool,
    /// `!canAffordBuildingStock(…)`.
    pub resource_warning: bool,
    /// `isCityStateOwner`.
    pub is_city_state: bool,
    /// `getEra(ownerId) ?? 1`.
    pub era: f64,
    /// Capital of its state.
    pub is_capital: bool,
}

/// One city (contract §3.4 `CityViewDto`). Order of `cities[]`: the engine
/// `cities` array (D-DTO-5).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CityViewDto {
    /// `City.id`.
    pub id: CityId,
    /// `City.ownerId`.
    pub owner_id: OwnerRef,
    /// `City.q/r`.
    pub hex: HexCoord,
    /// `City.population`.
    pub population: f64,
    /// `getLevel`.
    pub level: f64,
    /// `getWallKind`.
    pub wall_kind: WallKind,
    /// `getRevolt`.
    pub revolt: bool,
    /// `c.oblegane`.
    pub besieged: bool,
    /// Fog part of `isVisible`.
    pub fog_visible: bool,
    /// `getUnitCountOnHex`.
    pub unit_count_on_hex: u32,
    /// Map badge.
    pub badge: CityBadgeDto,
}
