use serde::{Deserialize, Serialize};

/// Base terrain types used by the world map.
///
/// Forests, deposits and rivers are overlays in the game model rather than
/// base terrain values. `ShallowWater` is the coastal water band; it remains
/// workable by a city but is not traversable by land units.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TerrainType {
    #[serde(rename = "laka")]
    Grassland,
    #[serde(rename = "rownina")]
    Plains,
    #[serde(rename = "wzgorza")]
    Hills,
    #[serde(rename = "gory")]
    Mountains,
    #[serde(rename = "plytkie_morze")]
    ShallowWater,
    #[serde(rename = "morze")]
    Ocean,
    #[serde(rename = "pustynia")]
    Desert,
    #[serde(rename = "polarny")]
    Tundra,
}

/// Short alias for callers that prefer `Terrain` as the domain name.
pub type Terrain = TerrainType;

/// Alias matching the terminology used by the map layer.
pub type BaseTerrain = TerrainType;
pub type TerenBazowy = TerrainType;

#[allow(non_upper_case_globals)]
impl TerrainType {
    // Source-data aliases. They keep the Rust API readable in English while
    // allowing direct use of the established map vocabulary.
    pub const Laka: Self = Self::Grassland;
    pub const Rownina: Self = Self::Plains;
    pub const Wzgorza: Self = Self::Hills;
    pub const Gory: Self = Self::Mountains;
    pub const PlytkieMorze: Self = Self::ShallowWater;
    pub const Wybrzeze: Self = Self::ShallowWater;
    pub const Morze: Self = Self::Ocean;
    pub const Pustynia: Self = Self::Desert;
    pub const Polarny: Self = Self::Tundra;

    // Common singular/legacy names.
    pub const Mountain: Self = Self::Mountains;
    pub const Coast: Self = Self::ShallowWater;
    pub const CoastalWater: Self = Self::ShallowWater;

    /// True for both shallow and deep water.
    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    pub const fn is_land(self) -> bool {
        !self.is_water()
    }

    /// Whether the cell can be worked for city yields.
    ///
    /// This intentionally follows the game rule rather than movement rules:
    /// only deep ocean and mountains are excluded. Coastal shallow water can
    /// therefore be a productive city field even though land units cannot
    /// enter it.
    pub const fn is_workable(self) -> bool {
        !matches!(self, Self::Ocean | Self::Mountains)
    }

    /// Whether an ordinary land unit can enter this terrain.
    pub const fn is_passable(self) -> bool {
        matches!(
            self,
            Self::Grassland | Self::Plains | Self::Hills | Self::Desert
        )
    }

    /// Whether the terrain is a legal city site before map/distance checks.
    pub const fn can_found_city(self) -> bool {
        self.is_land() && !matches!(self, Self::Mountains)
    }

    pub const fn is_city_site(self) -> bool {
        self.can_found_city()
    }

    /// Base movement cost for a land unit, or `None` when impassable.
    pub const fn movement_cost(self) -> Option<u8> {
        match self {
            Self::Hills => Some(2),
            Self::Grassland | Self::Plains => Some(1),
            Self::Desert => Some(2),
            Self::Mountains | Self::ShallowWater | Self::Ocean | Self::Tundra => None,
        }
    }

    pub const fn is_coastal_water(self) -> bool {
        matches!(self, Self::ShallowWater)
    }
}

/// Pure qualification of a map field independent of ownership and distance.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TileQualification {
    pub workable: bool,
    pub passable: bool,
    pub city_site: bool,
}

impl TileQualification {
    pub const fn for_terrain(terrain: TerrainType) -> Self {
        Self {
            workable: terrain.is_workable(),
            passable: terrain.is_passable(),
            city_site: terrain.can_found_city(),
        }
    }
}

pub const fn is_workable_terrain(terrain: TerrainType) -> bool {
    terrain.is_workable()
}

pub const fn is_passable_terrain(terrain: TerrainType) -> bool {
    terrain.is_passable()
}

pub const fn can_found_city_on(terrain: TerrainType) -> bool {
    terrain.can_found_city()
}

// ---------------------------------------------------------------------------
// P6.3 (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1): port `gra/src/game/fort-territory.ts` wraz z
// zaleznosciami z `map/territory.ts` (`axialDistance`, `cityTerritoryRadius`, `CityNode`) i
// `game/okolica.ts` (`cityRangeForPopulation`). Promien miasta czytany z `miasto-params.json`,
// promien fortu / posterunku z `terrain-improvements.json` (`zasieg_terytorium`), maksymalny
// pierscien ewakuacji z `data/derived/teren-ruch-reguly.json`; kod nie zawiera tych liczb.
// ---------------------------------------------------------------------------

use super::hex::HexCoord;
use crate::data::derived::teren_ruch_reguly;
use crate::data::economy_society::parse_miasto_params;
use crate::data::terrain_map::parse_terrain_improvements;
use std::collections::BTreeSet;
use std::sync::OnceLock;

/// Wartosci strukturalne opakowania `FortNode -> CityNode` (web `fortNodeAsCityNode`): wezel fortu
/// nie ma populacji, a `level` jest tylko polem zgodnosci interfejsu. To NIE sa parametry balansu.
const FORT_NODE_POPULATION: f64 = 0.0;
const FORT_NODE_LEVEL: f64 = 1.0;

/// Web `CityNode` (`map/territory.ts:23`).
#[derive(Debug, Clone, PartialEq)]
pub struct CityNode {
    pub q: i32,
    pub r: i32,
    pub is_outpost: Option<bool>,
    pub is_fort: Option<bool>,
    pub pop: f64,
    pub level: f64,
    pub civ: Option<String>,
}

impl CityNode {
    /// Zwykle miasto: bez znacznikow fortu / posterunku, `level` 1 jak w webowych wywolaniach.
    pub fn city(q: i32, r: i32, pop: f64) -> Self {
        Self {
            q,
            r,
            is_outpost: None,
            is_fort: None,
            pop,
            level: FORT_NODE_LEVEL,
            civ: None,
        }
    }
}

/// Web `FortImprovementType` (`fort-territory.ts:30`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FortImprovementType {
    Fort,
    Posterunek,
}

impl FortImprovementType {
    pub fn from_web_value(value: &str) -> Option<Self> {
        let rules = &teren_ruch_reguly().fort;
        if value == rules.ulepszenie_fort {
            Some(Self::Fort)
        } else if value == rules.ulepszenie_posterunek {
            Some(Self::Posterunek)
        } else {
            None
        }
    }

    pub fn web_value(self) -> &'static str {
        let rules = &teren_ruch_reguly().fort;
        match self {
            Self::Fort => rules.ulepszenie_fort.as_str(),
            Self::Posterunek => rules.ulepszenie_posterunek.as_str(),
        }
    }
}

/// Web `FortNode` (`fort-territory.ts:33`): wezel zarejestrowanego Fortu/Posterunka.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FortNode {
    pub q: i32,
    pub r: i32,
    pub owner_id: i64,
    pub kind: FortImprovementType,
    pub contested_useless: Option<bool>,
}

/// Web `NewCityFoundingInfo` (`fort-territory.ts:98`).
#[derive(Debug, Clone, PartialEq)]
pub struct NewCityFoundingInfo {
    pub q: i32,
    pub r: i32,
    pub owner_id: i64,
    pub population: f64,
}

/// Web `FortTakeoverEvent` (`fort-territory.ts:106`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FortTakeoverEvent {
    pub q: i32,
    pub r: i32,
    pub kind: FortImprovementType,
    pub prev_owner_id: i64,
    pub new_owner_id: i64,
}

/// Web `axialDistance` (`map/territory.ts:47`).
pub fn axial_distance(aq: i32, ar: i32, bq: i32, br: i32) -> f64 {
    let a_s = -i64::from(aq) - i64::from(ar);
    let b_s = -i64::from(bq) - i64::from(br);
    let sum = (i64::from(aq) - i64::from(bq)).abs()
        + (i64::from(ar) - i64::from(br)).abs()
        + (a_s - b_s).abs();
    sum as f64 / 2.0
}

/// Web `cityRangeForPopulation` (`okolica.ts:47`): `max(baza, min(pop, cap))`, 0 dla pop <= 0.
pub fn city_range_for_population(population: f64) -> f64 {
    static RANGE: OnceLock<(f64, f64)> = OnceLock::new();
    let (min, cap) = *RANGE.get_or_init(|| {
        let params = parse_miasto_params().expect("miasto-params.json must parse");
        (
            params.zasieg_okolicy_baza.wartosc as f64,
            params.zasieg_okolicy_max.wartosc as f64,
        )
    });
    let pop = if population.is_finite() {
        population.floor()
    } else {
        0.0
    };
    if pop <= 0.0 {
        return 0.0;
    }
    pop.max(min).min(cap)
}

/// Web `cityTerritoryRadius` (`map/territory.ts:74`): fort i posterunek maja stale promienie
/// (`terrain-improvements.json: zasieg_terytorium`), miasto - zasieg z populacji.
pub fn city_territory_radius(node: &CityNode) -> f64 {
    static RADII: OnceLock<(f64, f64)> = OnceLock::new();
    let (fort, outpost) = *RADII.get_or_init(|| {
        let improvements = parse_terrain_improvements().expect("terrain-improvements.json");
        (
            improvements
                .fort
                .zasieg_terytorium
                .expect("fort.zasieg_terytorium") as f64,
            improvements
                .posterunek
                .zasieg_terytorium
                .expect("posterunek.zasieg_terytorium") as f64,
        )
    });
    if node.is_fort == Some(true) {
        return fort;
    }
    if node.is_outpost == Some(true) {
        return outpost;
    }
    city_range_for_population(node.pop)
}

/// Web `fortNodeAsCityNode` (`fort-territory.ts:51`).
pub fn fort_node_as_city_node(q: i32, r: i32, kind: FortImprovementType) -> CityNode {
    CityNode {
        q,
        r,
        pop: FORT_NODE_POPULATION,
        level: FORT_NODE_LEVEL,
        is_fort: Some(kind == FortImprovementType::Fort),
        is_outpost: Some(kind == FortImprovementType::Posterunek),
        civ: None,
    }
}

fn fort_as_city_node(fort: &FortNode) -> CityNode {
    fort_node_as_city_node(fort.q, fort.r, fort.kind)
}

/// Web `isHexReservedByRivalFort` (`fort-territory.ts:68`): czy heks lezy w promieniu CUDZEGO,
/// nie-bezuzytecznego fortu / posterunku.
pub fn is_hex_reserved_by_rival_fort(
    q: i32,
    r: i32,
    builder_owner_id: i64,
    existing_forts: &[FortNode],
) -> bool {
    existing_forts.iter().any(|fort| {
        fort.owner_id != builder_owner_id
            && fort.contested_useless != Some(true)
            && axial_distance(q, r, fort.q, fort.r)
                <= city_territory_radius(&fort_as_city_node(fort))
    })
}

/// Web `foundingNodesForOwner` (`fort-territory.ts:86`): wlasne miasta + wlasne, nie-bezuzyteczne
/// forty/posterunki.
pub fn founding_nodes_for_owner(
    owner_id: i64,
    own_city_nodes: &[CityNode],
    forts: &[FortNode],
) -> Vec<CityNode> {
    let mut nodes = own_city_nodes.to_vec();
    nodes.extend(
        forts
            .iter()
            .filter(|fort| fort.owner_id == owner_id && fort.contested_useless != Some(true))
            .map(fort_as_city_node),
    );
    nodes
}

/// Web `applyFortTakeoverOnCityFounded` (`fort-territory.ts:144`): nowe miasto PRZEJMUJE cudze
/// forty/posterunki w swoim zasiegu (mutuje `forts`), a fort dokladnie na heksie miasta jest
/// USUWANY. Zwraca zdarzenia w kolejnosci przegladu od konca listy (jak web).
pub fn apply_fort_takeover_on_city_founded(
    new_city: &NewCityFoundingInfo,
    forts: &mut Vec<FortNode>,
) -> Vec<FortTakeoverEvent> {
    let radius =
        city_territory_radius(&CityNode::city(new_city.q, new_city.r, new_city.population));
    let mut events = Vec::new();
    for index in (0..forts.len()).rev() {
        let fort = &forts[index];
        if fort.q == new_city.q && fort.r == new_city.r {
            if fort.owner_id != new_city.owner_id {
                events.push(FortTakeoverEvent {
                    q: fort.q,
                    r: fort.r,
                    kind: fort.kind,
                    prev_owner_id: fort.owner_id,
                    new_owner_id: new_city.owner_id,
                });
            }
            forts.remove(index);
            continue;
        }
        if fort.owner_id == new_city.owner_id {
            continue;
        }
        if axial_distance(new_city.q, new_city.r, fort.q, fort.r) > radius {
            continue;
        }
        events.push(FortTakeoverEvent {
            q: fort.q,
            r: fort.r,
            kind: fort.kind,
            prev_owner_id: fort.owner_id,
            new_owner_id: new_city.owner_id,
        });
        let fort = &mut forts[index];
        fort.owner_id = new_city.owner_id;
        fort.contested_useless = Some(false);
    }
    events
}

/// Web `hexKeysWithinRadius` (`okolica.ts:66`) dla mapy opisanej predykatem istnienia heksu:
/// kolejnosc petli `dq` (zewnetrzna) i `dr` (wewnetrzna).
fn hexes_within_radius(
    center: HexCoord,
    radius: u32,
    has_hex: &dyn Fn(HexCoord) -> bool,
) -> Vec<HexCoord> {
    let radius = i32::try_from(radius).expect("promien miesci sie w i32");
    let mut out = Vec::new();
    for dq in -radius..=radius {
        let lo = (-radius).max(-dq - radius);
        let hi = radius.min(-dq + radius);
        for dr in lo..=hi {
            let hex = HexCoord::new(center.q + dq, center.r + dr);
            if has_hex(hex) {
                out.push(hex);
            }
        }
    }
    out
}

/// Web `findEvacuationHexOutsideCity` (`fort-territory.ts:185`): najblizszy heks POZA zasiegiem
/// terytorium nowego wlasciciela, szukany pierscieniami od heksu fortu; remis odleglosci wygrywa
/// mniejsze `(q, r)`. `max_ring = None` -> wartosc z `teren-ruch-reguly.json`.
pub fn find_evacuation_hex_outside_city(
    fort_q: i32,
    fort_r: i32,
    new_city_node: &CityNode,
    has_hex: &dyn Fn(HexCoord) -> bool,
    is_free: &dyn Fn(i32, i32) -> bool,
    max_ring: Option<u32>,
) -> Option<HexCoord> {
    let radius = city_territory_radius(new_city_node);
    let max_ring = max_ring.unwrap_or(teren_ruch_reguly().fort.ewakuacja_maks_pierscien);
    let center = HexCoord::new(fort_q, fort_r);
    let mut prev_ring: BTreeSet<HexCoord> = BTreeSet::new();
    for ring in 1..=max_ring {
        let within = hexes_within_radius(center, ring, has_hex);
        let mut candidates: Vec<HexCoord> = within
            .iter()
            .filter(|hex| !prev_ring.contains(hex))
            .filter(|hex| {
                axial_distance(hex.q, hex.r, new_city_node.q, new_city_node.r) > radius
                    && is_free(hex.q, hex.r)
            })
            .copied()
            .collect();
        if !candidates.is_empty() {
            candidates.sort_by_key(|hex| (hex.q, hex.r));
            return candidates.first().copied();
        }
        prev_ring = within.into_iter().collect();
    }
    None
}
