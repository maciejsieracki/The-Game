//! R-RUSTPORT-P4-1E-CITY-VIEW-Q1: producent widoku miast dla renderera i webview
//! (`P4-1-RENDER-DTO-CONTRACT.md` §3.4, §8 wiersz 1E).
//!
//! Czyta [`PlayableState`] (wylacznie odczyt) i zwraca typy `civ-view-model`:
//! [`OwnerViewDto`] ([`owner_views`]) oraz [`CityViewDto`] z [`CityBadgeDto`] ([`city_views`]).
//!
//! Zrodlo prawdy: web na pinie `07d2fbd72` (`gra/src/…`):
//! * plakietka = `CityRenderer._buildBadgeInput` (`render/cities.ts:875-931`) bez pol stanu UI/renderera
//!   (`hoverExpanded`, `lodLevel`), etykieta = `_cityMapLabel` (`render/cities.ts:862-873`) ->
//!   `formatCityMapLabel` (`game/display-names.ts:171`), stolica = `_isCapitalCity` (`render/cities.ts:855-859`);
//! * wywolania zwrotne = `_cityRenderOpts` (`main.ts:2939-3004`): `getEra` (`:2949`), `getCiv` (`:2955`),
//!   `getLevel` (`:2956-2959`), `getWallKind` (`:2961-2966`), `getRevolt` (`:2967-2970`),
//!   `getUnitCountOnHex` (`:2971`), `getMapOutlineKind` (`:2972`), `isVisible` (`:2973-2976`),
//!   `ownerColorFn` (`:2978`), `getBuiltBuildingIds` (`:2979`), `getCivIconId` (`:2983`),
//!   `getProduction` (`:2984`), `getOwnerResourceStock` (`:2985`), `getProductionItemStockCost` (`:2986`),
//!   `playerOwnerId` (`:2988`), `isCityStateOwner` (`:2989`), `getCapitalCityId` (`:2995`),
//!   `getCivDisplayName` (`:2996`), `getCityGrowth` (`:3003`);
//! * emblemat wlasciciela (`ringHex`, `isBarbarian`) = `setOwnerEmblemResolver` (`main.ts:10373-10384`).
//!
//! Wejscia, ktorych `PlayableState` NIE niesie (jawnie, bez cichych domyslnych): kolejka produkcji miasta,
//! stan porzadku (bunt), oblezenie, wzrost na zywo (`cityGrowthLive`), flaga `startCityState`, zbiory
//! miast-panstw, widocznosc heksow gracza (mgla) i koszt surowcowy pozycji kolejki. Podaje je wolajacy w
//! [`CityViewInputs`]; brak wpisu miasta w [`CityViewInputs::cities`] = blad [`CityViewError::MissingCityFacts`].
//!
//! Funkcje silnika uzyte jako zrodla (kontrakt §8 1E): `format_city_map_label` (`state.rs:1306`),
//! `front_item` (`production_queue.rs:28`), `can_afford_building_stock` (`building_costs.rs:582`),
//! `owner_resource_stock_all` (`building_costs.rs:698`), `city_fortification_kind`
//! (`siege_city_fortification.rs:35`), `should_force_culture_icon_for_owner` (`state.rs:1270`),
//! `empire_epoch_for_owner` (`turn_war_epoch.rs:96`). `growthPercent` przychodzi gotowy z
//! [`CityGrowthLive`] (web `cityGrowthLive`, `ui/cityPanel.ts:1687-1720`); jego producent (`computeView`
//! panelu miasta) nie jest portowany w tym temacie (NIE_ZMIERZONO, raport 01-operator-impl.md).
//!
//! Male czyste funkcje webu potrzebne tylko widokowi sa portowane tutaj 1:1: `civColorForOwner` /
//! `parseHexColor` (`game/civ-visual.ts:22-70`), `ikonaIdToBronzeCiv` (`render/bronzeCity.ts:23-40`),
//! `civDisplayNameForOwner` (`main.ts:10451-10466`), `civRingHexFn` (`main.ts:4080-4082`),
//! `cityMapOutlineKindForOwner` (`main.ts:22659-22672`), `isAllianceDealKind` (`main.ts:22653-22656`),
//! `defenseTierFromWallKind` (`render/cityMapStatChip.ts:379-383`), `capitalCityIdForOwner`
//! (`main.ts:34999-35003`) z `oldestCityOfOwner` (`game/capital-capture.ts:66-85`).
#![forbid(unsafe_code)]

use std::collections::{BTreeMap, BTreeSet, HashSet};
use std::fmt;

use civ_view_model as vm;
use civ_view_model::{
    CityBadgeDto, CityViewDto, MapOutlineKind, OwnerViewDto, ProductionKind as VmProductionKind,
    RelationToViewer, WallKind,
};

use crate::data::civilizations::{parse_civs, CivsFile};
use crate::domain::building_costs::p6_7b::{
    can_afford_building_stock, owner_resource_stock_all, StockCity, StockRecord,
};
use crate::domain::diplomacy::{CivilizationPair, RelationStatus, TreatyKind};
use crate::domain::playable::{PlayableCity, PlayablePlayer, PlayableState};
use crate::domain::production_queue::front_item;
use crate::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use crate::domain::siege_city_fortification::{city_fortification_kind, CityFortificationKind};
use crate::domain::state::p6_6b::display_names::{
    format_city_map_label, should_force_culture_icon_for_owner, CityMapLabelCity, CityMapLabelOpts,
    ForceCultureIconOpts, OwnerCityRef, OwnerCityStateOpts,
};
use crate::domain::turn_war_epoch::{
    empire_epoch_for_owner, game_start_era, owner_era_facts, OwnerEpochError,
};
use crate::domain::PlayerId;

/// Web `cityGrowthLive(city, map)` (`ui/cityPanel.ts:1687-1720`): `{ procentNaTure, nakarmione }`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityGrowthLive {
    /// `procentNaTure` (WZROST% na ture, ten sam co w panelu miasta).
    pub procent_na_ture: f64,
    /// `nakarmione` (miasto nakarmione w tej turze).
    pub nakarmione: bool,
}

/// Fakty jednego miasta, ktorych `PlayableState` nie niesie (web: mapy stanu w `main.ts`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CityViewCityFacts {
    /// `cityProd.get(cityId) ?? null` (`main.ts:3451`); `None` = brak kolejki.
    pub production: Option<CityProduction>,
    /// `cityOrderState.get(cityId)?.bunt === true` (`main.ts:2969`).
    pub order_bunt: bool,
    /// `cityOrderState.get(cityId)?.revoltWarning === true` (`main.ts:2969`).
    pub order_revolt_warning: bool,
    /// `c.oblegane` (`main.ts:17493`), flaga oblezenia miasta.
    pub besieged: bool,
    /// `cityGrowthLive(city, map)` (`main.ts:3003`); `None` = web `null` (segment nie rysowany).
    /// Czytane wylacznie dla miast widza (web nie wola callbacku dla obcych, `render/cities.ts:904`).
    pub growth: Option<CityGrowthLive>,
    /// `City.startCityState` (`game/cities.ts:1037`); `None` = pole nieobecne.
    pub start_city_state: Option<bool>,
}

/// Zbiory miast-panstw (`ownerCityStateOpts()`, `main.ts:10388-10394`, oraz `clusterCapitalOwnerIds`).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct CityStateFacts {
    /// `simplifiedDiplomacyOwners`.
    pub simplified_owners: HashSet<i64>,
    /// `typCityCopyOwners`.
    pub typ_copy_owners: HashSet<i64>,
    /// `clusterCapitalOwnerIds`.
    pub cluster_capital_owner_ids: HashSet<i64>,
}

/// Wejscia producenta widoku miast (poza `PlayableState`).
pub struct CityViewInputs<'a> {
    /// Widz: aktywny fotel (`playerOwnerId` / `ME()` / `meNow()`, `main.ts:2988`).
    pub viewer: PlayerId,
    /// `fogOn` (`main.ts:13083`).
    pub fog_active: bool,
    /// `currentVisible()` widza jako `(q, r)` (klucz web `"q,r"`, `main.ts:13085`). Czytane tylko przy
    /// `fog_active`.
    pub visible_hexes: &'a BTreeSet<(i32, i32)>,
    /// Fakty miast spoza stanu; klucz = surowe id miasta. Kazde miasto stanu musi miec wpis.
    pub cities: &'a BTreeMap<u64, CityViewCityFacts>,
    /// Zbiory miast-panstw.
    pub city_states: &'a CityStateFacts,
    /// `productionItemStockCostForRender(item)` (`main.ts:9879-9885`): koszt surowcowy pozycji kolejki.
    pub item_stock_cost: &'a dyn Fn(&ProductionItem) -> StockRecord,
}

/// Blad producenta widoku miast (zamiast cichych wartosci domyslnych).
#[derive(Debug, Clone, PartialEq)]
pub enum CityViewError {
    /// Wlasciciel miasta albo widz nie ma wpisu w `players` (web `civTypeForOwner` spadlby na `'grecy'`).
    UnknownOwner(u64),
    /// Miasto stanu bez wpisu w [`CityViewInputs::cities`].
    MissingCityFacts(u64),
    /// Id powyzej `2^53 - 1` (kontrakt §4 pkt 4).
    IdOutOfRange(u64),
    /// `growthPercent` nieskonczony albo NaN (JSON go nie przeniesie).
    NonFiniteGrowth { city_id: u64, value: f64 },
    /// Blad producenta epoki wlasciciela.
    Epoch(OwnerEpochError),
    /// `civs.json` silnika nie parsuje sie.
    CivsData(String),
}

impl fmt::Display for CityViewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownOwner(id) => write!(f, "widok miast: wlasciciel {id} spoza players"),
            Self::MissingCityFacts(id) => write!(f, "widok miast: brak faktow miasta {id}"),
            Self::IdOutOfRange(id) => write!(f, "widok miast: id {id} > 2^53 - 1"),
            Self::NonFiniteGrowth { city_id, value } => {
                write!(f, "widok miast: growthPercent miasta {city_id} = {value}")
            }
            Self::Epoch(e) => write!(f, "widok miast: {e}"),
            Self::CivsData(e) => write!(f, "widok miast: civs.json: {e}"),
        }
    }
}

impl std::error::Error for CityViewError {}

impl From<OwnerEpochError> for CityViewError {
    fn from(e: OwnerEpochError) -> Self {
        Self::Epoch(e)
    }
}

// ---------------------------------------------------------------------------------------------
// Male czyste funkcje webu (port 1:1)
// ---------------------------------------------------------------------------------------------

/// Web `OWNER_COLORS_FALLBACK` (`game/civ-visual.ts:8-17`).
pub const OWNER_COLORS_FALLBACK: [u32; 8] = [
    0xffd54a, 0xe53935, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa, 0x00acc1, 0xf06292,
];

/// Web `parseHexColor(hex)` (`game/civ-visual.ts:22-31`).
pub fn parse_hex_color(hex: &str) -> u32 {
    let trimmed = hex.trim();
    let h = trimmed.strip_prefix('#').unwrap_or(trimmed);
    let expanded: String = if h.chars().count() == 3 {
        h.chars().flat_map(|c| [c, c]).collect()
    } else {
        h.to_owned()
    };
    if expanded.len() != 6 || !expanded.bytes().all(|b| b.is_ascii_hexdigit()) {
        return OWNER_COLORS_FALLBACK[0];
    }
    u32::from_str_radix(&expanded, 16).unwrap_or(OWNER_COLORS_FALLBACK[0])
}

/// Web `civColorForOwner(civs, ownerId, civTypeForOwner)` (`game/civ-visual.ts:59-70`) dla gotowego
/// `ikonaId`. Indeks palety: `ownerId % 8` (identyfikatory graczy sa nieujemne).
pub fn civ_color_for_owner(civs: &CivsFile, owner_id: u64, ikona_id: &str) -> u32 {
    let row = civs.cywilizacje.iter().find(|c| c.ikona_id == ikona_id);
    if let Some(row) = row {
        if !row.kolor_hex.trim().is_empty() {
            return parse_hex_color(&row.kolor_hex);
        }
    }
    let idx = usize::try_from(owner_id % 8).unwrap_or(0);
    OWNER_COLORS_FALLBACK[idx]
}

/// Web `IKONA_TO_BRONZE` + `ikonaIdToBronzeCiv` (`render/bronzeCity.ts:23-40`).
pub fn ikona_id_to_bronze_civ(ikona_id: &str) -> &'static str {
    match ikona_id {
        "grecy" | "grecja" => "grecja",
        "rzymianie" | "rzym" => "rzym",
        "chinczycy" | "chiny" => "chiny",
        "inkowie" | "inka" => "inka",
        "zulusi" | "zulu" => "zulu",
        "egipt" => "egipt",
        "babilon" | "babilonia" | "sumerowie" | "sumer" | "harappa" | "asyria" => "sumer",
        "celtowie" => "celtowie",
        "germanie" | "slowianie" => "germanie",
        "hetyci" | "fenicjanie" => "hetyci",
        "aztek" => "aztek",
        _ => "grecja",
    }
}

/// Web `civDisplayNameForOwner` (`main.ts:10451-10466`) dla gotowego klucza `civTypeForOwner`.
pub fn civ_display_name(civs: &CivsFile, civ_key: &str) -> Option<String> {
    if civ_key.is_empty() {
        return None;
    }
    civs.cywilizacje
        .iter()
        .find(|c| c.ikona_id == civ_key || c.typ_cywilizacji == civ_key)
        .map(|c| c.cywilizacja.clone())
}

/// Web `civRingHexFn` (`main.ts:4080-4082`): `'#' + color.toString(16).padStart(6, '0')`.
pub fn ring_hex(color: u32) -> String {
    format!("#{color:06x}")
}

/// Web `defenseTierFromWallKind` (`render/cityMapStatChip.ts:379-383`).
pub const fn defense_tier(kind: WallKind) -> u8 {
    match kind {
        WallKind::Stone => 2,
        WallKind::Palisada => 1,
        WallKind::None => 0,
    }
}

/// Web `getWallKind` (`main.ts:2961-2966`): `'mur'` -> `'stone'`.
pub const fn wall_kind_of(kind: CityFortificationKind) -> WallKind {
    match kind {
        CityFortificationKind::Mur => WallKind::Stone,
        CityFortificationKind::Palisada => WallKind::Palisada,
        CityFortificationKind::None => WallKind::None,
    }
}

/// Web `isAllianceDealKind` (`main.ts:22653-22656`); legacy `sojusz_wojskowy` normalizuje serde
/// (`TreatyKind::FullAlliance`, alias), jak `normalizeTreatyKind` (`game/diplomacy-treaties.ts:212`).
pub const fn is_alliance_deal_kind(kind: TreatyKind) -> bool {
    matches!(
        kind,
        TreatyKind::FullAlliance | TreatyKind::DefensiveAlliance
    )
}

// ---------------------------------------------------------------------------------------------
// Producent
// ---------------------------------------------------------------------------------------------

fn civs() -> Result<CivsFile, CityViewError> {
    parse_civs().map_err(|e| CityViewError::CivsData(e.to_string()))
}

fn owner_i64(id: PlayerId) -> i64 {
    // Identyfikatory przechodza przez `vm_player` (<= 2^53 - 1), wiec rzutowanie jest bezstratne.
    i64::try_from(id.get()).unwrap_or(i64::MAX)
}

fn vm_player(id: PlayerId) -> Result<vm::PlayerId, CityViewError> {
    vm::PlayerId::try_new(id.get()).map_err(|e| CityViewError::IdOutOfRange(e.value))
}

fn vm_city(id: u64) -> Result<vm::CityId, CityViewError> {
    vm::CityId::try_new(id).map_err(|e| CityViewError::IdOutOfRange(e.value))
}

fn player_of(state: &PlayableState, id: PlayerId) -> Result<&PlayablePlayer, CityViewError> {
    state
        .players
        .iter()
        .find(|p| p.id == id)
        .ok_or(CityViewError::UnknownOwner(id.get()))
}

/// Web `civTypeForOwner` (`main.ts:4031-4047`): w stanie Rust = `PlayablePlayer.civilization`
/// (ten sam klucz co `_menuCivIdByOwner` / `aiOwnerCivMap`; konwencja `turn_war_inputs.rs:390`).
fn civ_type_for_owner(state: &PlayableState, id: PlayerId) -> Result<&str, CityViewError> {
    Ok(player_of(state, id)?.civilization.as_str())
}

/// Web `capitalCityIdForOwner` (`main.ts:34999-35003`): jawna stolica (w stanie Rust: pierwsze miasto
/// wlasciciela z `is_capital`, konwencja `war_world_view.rs:103`), inaczej `oldestCityOfOwner`
/// (`capital-capture.ts:73-85`): najmniejszy numer zalozenia; web `cityFoundOrder('city' + N)` = `N`,
/// w stanie Rust `N` = `CityId`.
pub fn capital_city_id_for_owner(state: &PlayableState, owner: PlayerId) -> Option<u64> {
    if let Some(c) = state
        .cities
        .iter()
        .find(|c| c.is_capital && c.owner_id == owner)
    {
        return Some(c.id.get());
    }
    let mut best: Option<u64> = None;
    for c in state.cities.iter().filter(|c| c.owner_id == owner) {
        let order = c.id.get();
        if best.is_none_or(|b| order < b) {
            best = Some(order);
        }
    }
    best
}

/// Status relacji `getDiploRelation(a, b).status` (`main.ts:10312-10335`): brak wpisu pary = relacja
/// startowa `defaultNeutralRelation()` ze statusem `'neutralni'` (`game/diplomacy-layers.ts:214-221`).
fn relation_status(state: &PlayableState, a: PlayerId, b: PlayerId) -> RelationStatus {
    state
        .war
        .diplomacy
        .relation(a, b)
        .map_or(RelationStatus::Neutral, |r| r.status)
}

/// Web `cityMapOutlineKindForOwner` (`main.ts:22659-22672`).
pub fn map_outline_kind(
    state: &PlayableState,
    viewer: PlayerId,
    owner: PlayerId,
) -> MapOutlineKind {
    if owner == viewer {
        return MapOutlineKind::Player;
    }
    match relation_status(state, viewer, owner) {
        RelationStatus::War => return MapOutlineKind::War,
        RelationStatus::Alliance => return MapOutlineKind::Ally,
        RelationStatus::Neutral | RelationStatus::Peace => {}
    }
    let pair = CivilizationPair::new(viewer, owner);
    if state.war.diplomacy.deals.iter().any(|d| {
        is_alliance_deal_kind(d.kind)
            && CivilizationPair::new(d.parties.first, d.parties.second) == pair
    }) {
        return MapOutlineKind::Ally;
    }
    MapOutlineKind::Neutral
}

/// `relationToViewer` (kontrakt §3.4; `relationColorFn`, `main.ts:4065-4068`).
pub fn relation_to_viewer(
    state: &PlayableState,
    viewer: PlayerId,
    owner: PlayerId,
) -> RelationToViewer {
    if owner == viewer {
        return RelationToViewer::Own;
    }
    match relation_status(state, viewer, owner) {
        RelationStatus::War => RelationToViewer::Wojna,
        RelationStatus::Peace => RelationToViewer::Pokoj,
        RelationStatus::Alliance => RelationToViewer::Sojusz,
        RelationStatus::Neutral => RelationToViewer::Neutralni,
    }
}

/// Web `portraitForceCultureIcon(ownerId)` (`main.ts:10442-10449`) =
/// `shouldForceCultureIconForOwner` z `ownerCityStateOpts()`.
fn is_city_state_owner(
    state: &PlayableState,
    inputs: &CityViewInputs<'_>,
    owner: PlayerId,
    city_refs: &[OwnerCityRef],
) -> Result<bool, CityViewError> {
    let player_key = civ_type_for_owner(state, inputs.viewer)?;
    let owner_key = civ_type_for_owner(state, owner)?;
    let opts = ForceCultureIconOpts {
        base: OwnerCityStateOpts {
            simplified_owners: Some(&inputs.city_states.simplified_owners),
            typ_copy_owners: Some(&inputs.city_states.typ_copy_owners),
            cities: Some(city_refs),
        },
        cluster_capital_owner_ids: Some(&inputs.city_states.cluster_capital_owner_ids),
        player_civ_key: Some(player_key),
        owner_civ_key: Some(owner_key),
    };
    Ok(should_force_culture_icon_for_owner(
        owner_i64(owner),
        Some(&opts),
    ))
}

fn city_facts<'a>(
    inputs: &CityViewInputs<'a>,
    city: &PlayableCity,
) -> Result<&'a CityViewCityFacts, CityViewError> {
    inputs
        .cities
        .get(&city.id.get())
        .ok_or(CityViewError::MissingCityFacts(city.id.get()))
}

fn city_refs(
    state: &PlayableState,
    inputs: &CityViewInputs<'_>,
) -> Result<Vec<OwnerCityRef>, CityViewError> {
    state
        .cities
        .iter()
        .map(|c| {
            Ok(OwnerCityRef {
                owner_id: owner_i64(c.owner_id),
                start_city_state: city_facts(inputs, c)?.start_city_state,
            })
        })
        .collect()
}

/// Wspolne fakty wlasciciela (raz na wlasciciela, uzywane przez wlasciciela i plakietki jego miast).
struct OwnerFacts {
    view: OwnerViewDto,
    capital_city_id: Option<u64>,
}

fn owner_facts(
    state: &PlayableState,
    inputs: &CityViewInputs<'_>,
    civs: &CivsFile,
    refs: &[OwnerCityRef],
    owner: PlayerId,
) -> Result<OwnerFacts, CityViewError> {
    let civ_key = civ_type_for_owner(state, owner)?;
    let color = civ_color_for_owner(civs, owner.get(), civ_key);
    let is_city_state = is_city_state_owner(state, inputs, owner, refs)?;
    let (era, _source) = empire_epoch_for_owner(
        owner_i64(owner),
        &owner_era_facts(state),
        game_start_era(&state.params.epoch_id),
    )?;
    let capital = capital_city_id_for_owner(state, owner);
    // Gracze stanu Rust nigdy nie sa barbarzyncami (`OwnerRef::Barbarian` nie ma miast w `PlayableState`).
    let is_barbarian = false;
    let view = OwnerViewDto {
        owner_id: vm::OwnerRef::Player(vm_player(owner)?),
        color,
        civ_icon_id: civ_key.to_owned(),
        bronze_civ: ikona_id_to_bronze_civ(civ_key).to_owned(),
        era,
        is_city_state,
        is_barbarian,
        ring_hex: if is_barbarian || is_city_state {
            None
        } else {
            Some(ring_hex(color))
        },
        display_name: civ_display_name(civs, civ_key),
        map_outline_kind: Some(map_outline_kind(state, inputs.viewer, owner)),
        capital_city_id: capital.map(vm_city).transpose()?,
        relation_to_viewer: relation_to_viewer(state, inputs.viewer, owner),
    };
    Ok(OwnerFacts {
        view,
        capital_city_id: capital,
    })
}

fn all_owner_facts(
    state: &PlayableState,
    inputs: &CityViewInputs<'_>,
) -> Result<BTreeMap<u64, OwnerFacts>, CityViewError> {
    player_of(state, inputs.viewer)?;
    let civs = civs()?;
    let refs = city_refs(state, inputs)?;
    let mut out = BTreeMap::new();
    for p in &state.players {
        out.insert(p.id.get(), owner_facts(state, inputs, &civs, &refs, p.id)?);
    }
    for c in &state.cities {
        if !out.contains_key(&c.owner_id.get()) {
            return Err(CityViewError::UnknownOwner(c.owner_id.get()));
        }
    }
    Ok(out)
}

/// `owners[]` (kontrakt §3.4): wszyscy gracze stanu, rosnaco po [`vm::OwnerRef`].
pub fn owner_views(
    state: &PlayableState,
    inputs: &CityViewInputs<'_>,
) -> Result<Vec<OwnerViewDto>, CityViewError> {
    let facts = all_owner_facts(state, inputs)?;
    let mut owners: Vec<OwnerViewDto> = facts.into_values().map(|f| f.view).collect();
    owners.sort_by_key(|o| o.owner_id);
    Ok(owners)
}

fn production_kind(kind: ProductionKind) -> VmProductionKind {
    match kind {
        ProductionKind::Budynek => VmProductionKind::Budynek,
        ProductionKind::Jednostka => VmProductionKind::Jednostka,
    }
}

/// Web `_buildBadgeInput` (`render/cities.ts:875-931`) bez `hoverExpanded` i `lodLevel`.
fn badge(
    inputs: &CityViewInputs<'_>,
    city: &PlayableCity,
    facts: &CityViewCityFacts,
    owner: &OwnerFacts,
    wall_kind: WallKind,
    stock_cities: &[StockCity],
) -> Result<CityBadgeDto, CityViewError> {
    let owner_view = &owner.view;
    // `_isCapitalCity` (`render/cities.ts:855-859`).
    let is_capital = !owner_view.is_city_state && owner.capital_city_id == Some(city.id.get());
    // `_cityMapLabel` (`render/cities.ts:862-873`).
    let city_name = format_city_map_label(
        &CityMapLabelCity {
            name: &city.name,
            owner_id: owner_i64(city.owner_id),
            start_city_state: facts.start_city_state,
        },
        Some(&CityMapLabelOpts {
            player_owner_id: Some(owner_i64(inputs.viewer)),
            is_capital: Some(is_capital),
            civ_display_name: owner_view.display_name.as_deref(),
            is_city_state_owner: Some(owner_view.is_city_state),
        }),
    );
    let prod = facts.production.as_ref();
    let front = prod.and_then(front_item);
    let paused = prod.is_some_and(|p| p.wstrzymana == Some(true));
    let mut resource_warning = false;
    if let Some(item) = front {
        let pool = owner_resource_stock_all(stock_cities, owner_i64(city.owner_id));
        let cost = (inputs.item_stock_cost)(item);
        if !cost.is_empty() {
            resource_warning = !can_afford_building_stock(Some(&pool), &cost);
        }
    }
    let is_player_city = city.owner_id == inputs.viewer;
    let growth = if is_player_city { facts.growth } else { None };
    if let Some(g) = growth {
        if !g.procent_na_ture.is_finite() {
            return Err(CityViewError::NonFiniteGrowth {
                city_id: city.id.get(),
                value: g.procent_na_ture,
            });
        }
    }
    Ok(CityBadgeDto {
        city_name,
        population: f64::from(city.population),
        defense_tier: defense_tier(wall_kind),
        civ_icon_id: owner_view.civ_icon_id.clone(),
        owner_color: owner_view.color,
        prod_active: front.is_some() && !paused,
        prod_kind: front.map(|f| production_kind(f.kind)),
        prod_id: front.map(|f| f.id.clone()),
        prod_item_name: front.map(|f| f.nazwa.clone()),
        prod_category_label: front.map(|f| match f.kind {
            ProductionKind::Budynek => "Budynek".to_owned(),
            ProductionKind::Jednostka => "Jednostka".to_owned(),
        }),
        prod_paused: paused,
        growth_percent: growth.map(|g| g.procent_na_ture),
        growth_starving: growth.is_some_and(|g| !g.nakarmione),
        resource_warning,
        is_city_state: owner_view.is_city_state,
        era: owner_view.era,
        is_capital,
    })
}

/// `cities[]` (kontrakt §3.4): kolejnosc tablicy `state.cities` (D-DTO-5).
pub fn city_views(
    state: &PlayableState,
    inputs: &CityViewInputs<'_>,
) -> Result<Vec<CityViewDto>, CityViewError> {
    let owners = all_owner_facts(state, inputs)?;
    // `ownerSurowcePoolFor` (`main.ts:9874-9876`) = `ownerResourceStockAll(cities, ownerId)`; `City.surowce`
    // w stanie Rust = `economy.city_stock` (brak wpisu = pole nieobecne, jak `dipl_steps_inputs`).
    let stock_cities: Vec<StockCity> = state
        .cities
        .iter()
        .map(|c| StockCity {
            id: c.id.get().to_string(),
            owner_id: owner_i64(c.owner_id),
            surowce: state.economy.city_stock.get(&c.id.get()).cloned(),
        })
        .collect();
    let empty: Vec<String> = Vec::new();
    let mut out = Vec::with_capacity(state.cities.len());
    for city in &state.cities {
        let facts = city_facts(inputs, city)?;
        let owner = owners
            .get(&city.owner_id.get())
            .ok_or(CityViewError::UnknownOwner(city.owner_id.get()))?;
        let q = i32::from(city.position.x());
        let r = i32::from(city.position.y());
        // `getBuiltBuildingIds` (`main.ts:2979`) = `cityBuilt.get(id) ?? []`; w stanie Rust
        // `stores.buildings_by_city`.
        let built = state
            .stores
            .buildings_by_city
            .get(&city.id.get())
            .unwrap_or(&empty);
        let wall_kind = wall_kind_of(city_fortification_kind(Some(built.as_slice())));
        let population = f64::from(city.population);
        // `isVisible` bez filtra panelu miasta (stan UI): `cityFogVisible` (`main.ts:13082-13086`).
        let fog_visible = !inputs.fog_active
            || city.owner_id == inputs.viewer
            || inputs.visible_hexes.contains(&(q, r));
        // `unitCountOnHex` (`main.ts:2901-2907`).
        let unit_count_on_hex = state
            .units
            .iter()
            .filter(|u| u.position == city.position)
            .count();
        out.push(CityViewDto {
            id: vm_city(city.id.get())?,
            owner_id: owner.view.owner_id,
            hex: vm::HexCoord::new(q, r),
            population,
            // `getLevel` (`main.ts:2956-2959`): `Math.max(1, Math.min(10, population ?? 1))`.
            level: population.clamp(1.0, 10.0),
            wall_kind,
            revolt: facts.order_bunt || facts.order_revolt_warning,
            besieged: facts.besieged,
            fog_visible,
            unit_count_on_hex: u32::try_from(unit_count_on_hex).unwrap_or(u32::MAX),
            badge: badge(inputs, city, facts, owner, wall_kind, &stock_cities)?,
        });
    }
    Ok(out)
}
