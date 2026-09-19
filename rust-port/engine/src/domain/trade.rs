//! Pure trade-route validation, income and resource-transfer rules.
//!
//! The browser game keeps trade routes as derived state.  This module follows
//! the same boundary: map snapshots, buildings, treaties and stock callbacks
//! are inputs, while every public operation returns a new value and leaves the
//! caller's state untouched.  The small DTOs are intentionally self-contained
//! so the module can be wired into the engine without coupling it to Tauri or
//! the renderer.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, HashMap, VecDeque};
use std::fmt;

mod trade_map_tiles {
    use super::{HexCoord, TradeTile};
    use serde::de::Error as DeError;
    use serde::ser::SerializeMap;
    use serde::{Deserialize, Deserializer, Serializer};
    use std::collections::BTreeMap;

    pub fn serialize<S>(
        tiles: &BTreeMap<HexCoord, TradeTile>,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut map = serializer.serialize_map(Some(tiles.len()))?;
        for (coordinate, tile) in tiles {
            let key = coordinate.key();
            map.serialize_entry(&key, tile)?;
        }
        map.end()
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<BTreeMap<HexCoord, TradeTile>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let encoded = BTreeMap::<String, TradeTile>::deserialize(deserializer)?;
        let mut tiles = BTreeMap::new();
        for (key, tile) in encoded {
            let (q, r) = key.split_once(',').ok_or_else(|| {
                D::Error::custom(format!("invalid trade-map coordinate key {key:?}"))
            })?;
            let q = q.parse::<i32>().map_err(|_| {
                D::Error::custom(format!("invalid q in trade-map coordinate key {key:?}"))
            })?;
            let r = r.parse::<i32>().map_err(|_| {
                D::Error::custom(format!("invalid r in trade-map coordinate key {key:?}"))
            })?;
            let coordinate = HexCoord::new(q, r);
            if tiles.insert(coordinate, tile).is_some() {
                return Err(D::Error::custom(format!(
                    "duplicate trade-map coordinate key {key:?}"
                )));
            }
        }
        Ok(tiles)
    }
}

/// A pointy-top axial hex coordinate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
}

pub type Hex = HexCoord;

impl HexCoord {
    /// The neighbour order is part of the deterministic path contract.
    pub const DIRECTIONS: [Self; 6] = [
        Self { q: 1, r: 0 },
        Self { q: -1, r: 0 },
        Self { q: 0, r: 1 },
        Self { q: 0, r: -1 },
        Self { q: 1, r: -1 },
        Self { q: -1, r: 1 },
    ];

    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }

    pub fn distance(self, other: Self) -> u32 {
        let dq = (i64::from(self.q) - i64::from(other.q)).unsigned_abs();
        let dr = (i64::from(self.r) - i64::from(other.r)).unsigned_abs();
        let self_s = -i64::from(self.q) - i64::from(self.r);
        let other_s = -i64::from(other.q) - i64::from(other.r);
        let ds = (self_s - other_s).unsigned_abs();
        dq.max(dr).max(ds).min(u64::from(u32::MAX)) as u32
    }

    pub fn neighbours(self) -> impl Iterator<Item = Self> {
        Self::DIRECTIONS
            .into_iter()
            .map(move |direction| Self::new(self.q + direction.q, self.r + direction.r))
    }

    pub fn key(self) -> String {
        format!("{},{}", self.q, self.r)
    }
}

/// Base terrain needed by the trade connectivity rules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerrainType {
    Grassland,
    Plains,
    Forest,
    Hills,
    Mountains,
    Desert,
    Tundra,
    ShallowWater,
    Ocean,
}

pub type Terrain = TerrainType;

#[allow(non_upper_case_globals)]
impl TerrainType {
    pub const Laka: Self = Self::Grassland;
    pub const Rownina: Self = Self::Plains;
    pub const Las: Self = Self::Forest;
    pub const Wzgorza: Self = Self::Hills;
    pub const Gory: Self = Self::Mountains;
    pub const Pustynia: Self = Self::Desert;
    pub const Tundra: Self = Self::Tundra;
    pub const Wybrzeze: Self = Self::ShallowWater;
    pub const PlytkieMorze: Self = Self::ShallowWater;
    pub const Morze: Self = Self::Ocean;

    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    /// Land routes may cross every land terrain except mountains.
    pub const fn is_land_passable(self) -> bool {
        !self.is_water() && !matches!(self, Self::Mountains)
    }

    pub const fn is_water_passable(self) -> bool {
        self.is_water()
    }
}

/// A minimal immutable map field.  Overlays do not affect trade connectivity.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeTile {
    pub terrain: TerrainType,
}

impl TradeTile {
    pub const fn new(terrain: TerrainType) -> Self {
        Self { terrain }
    }
}

impl From<TerrainType> for TradeTile {
    fn from(terrain: TerrainType) -> Self {
        Self::new(terrain)
    }
}

/// Sparse map snapshot used by route validation.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct TradeMap {
    #[serde(default, rename = "widthQ", alias = "szerokoscQ")]
    pub width_q: u32,
    #[serde(default, rename = "heightR", alias = "wysokoscR")]
    pub height_r: u32,
    #[serde(default, with = "trade_map_tiles")]
    pub tiles: BTreeMap<HexCoord, TradeTile>,
}

pub type Map = TradeMap;

impl TradeMap {
    pub const fn new(width_q: u32, height_r: u32) -> Self {
        Self {
            width_q,
            height_r,
            tiles: BTreeMap::new(),
        }
    }

    pub fn insert<T>(&mut self, coordinate: HexCoord, tile: T) -> Option<TradeTile>
    where
        T: Into<TradeTile>,
    {
        self.tiles.insert(coordinate, tile.into())
    }

    pub fn tile(&self, coordinate: HexCoord) -> Option<&TradeTile> {
        self.tiles.get(&coordinate)
    }

    pub fn from_tiles<I, T>(tiles: I) -> Self
    where
        I: IntoIterator<Item = (HexCoord, T)>,
        T: Into<TradeTile>,
    {
        Self {
            tiles: tiles
                .into_iter()
                .map(|(coordinate, tile)| (coordinate, tile.into()))
                .collect(),
            ..Self::default()
        }
    }

    pub fn with_dimensions(mut self, width_q: u32, height_r: u32) -> Self {
        self.width_q = width_q;
        self.height_r = height_r;
        self
    }

    fn max_steps(&self) -> usize {
        let dimensions = self.width_q.saturating_add(self.height_r);
        if dimensions > 0 {
            dimensions as usize
        } else {
            self.tiles.len().max(1)
        }
    }
}

/// Minimal city snapshot needed to validate and identify a route.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeCity {
    #[serde(rename = "id")]
    pub id: String,
    #[serde(rename = "ownerId", alias = "owner_id")]
    pub owner_id: u64,
    pub q: i32,
    pub r: i32,
}

pub type TradeRouteCityRef = TradeCity;

impl TradeCity {
    pub fn new(id: impl Into<String>, owner_id: u64, q: i32, r: i32) -> Self {
        Self {
            id: id.into(),
            owner_id,
            q,
            r,
        }
    }

    pub const fn coordinate(&self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }
}

/// A territory centre and its effective radius.  The map layer can construct
/// this from its population/outpost/fort rules before calling this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TerritoryNode {
    #[serde(rename = "ownerId", alias = "owner_id")]
    pub owner_id: u64,
    pub q: i32,
    pub r: i32,
    pub radius: u32,
}

impl TerritoryNode {
    pub const fn new(owner_id: u64, q: i32, r: i32, radius: u32) -> Self {
        Self {
            owner_id,
            q,
            r,
            radius,
        }
    }

    pub const fn coordinate(self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }
}

/// Lookup abstraction for the built-building snapshot supplied by the caller.
pub trait BuildingLookup {
    fn contains_building(&self, city_id: &str, building_id: &str) -> bool;
}

impl BuildingLookup for BTreeMap<String, Vec<String>> {
    fn contains_building(&self, city_id: &str, building_id: &str) -> bool {
        self.get(city_id)
            .is_some_and(|buildings| buildings.iter().any(|id| id == building_id))
    }
}

impl BuildingLookup for HashMap<String, Vec<String>> {
    fn contains_building(&self, city_id: &str, building_id: &str) -> bool {
        self.get(city_id)
            .is_some_and(|buildings| buildings.iter().any(|id| id == building_id))
    }
}

impl BuildingLookup for () {
    fn contains_building(&self, _city_id: &str, _building_id: &str) -> bool {
        false
    }
}

/// Buildings which provide a building-covered route slot.
pub const TRADE_BUILDING_IDS: [&str; 3] = ["targowisko", "port", "port_wielki"];

/// Port levels which enable a sea route endpoint.
pub const PORT_BUILDING_IDS: [&str; 2] = ["port", "port_wielki"];

pub fn trade_route_limit_for_city<B>(city_id: &str, built_by_city: &B) -> u32
where
    B: BuildingLookup + ?Sized,
{
    TRADE_BUILDING_IDS
        .iter()
        .filter(|building_id| built_by_city.contains_building(city_id, building_id))
        .count() as u32
}

/// Existence has one baseline slot even when the city has no trade building.
pub fn trade_route_existence_limit_for_city<B>(city_id: &str, built_by_city: &B) -> u32
where
    B: BuildingLookup + ?Sized,
{
    1 + trade_route_limit_for_city(city_id, built_by_city)
}

/// Land or sea route medium.  Serde names match the browser-game save shape.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TradeRouteMedium {
    #[serde(rename = "lad", alias = "land")]
    Land,
    #[serde(rename = "morze", alias = "sea")]
    Sea,
}

pub type TradeMedium = TradeRouteMedium;

#[allow(non_upper_case_globals)]
impl TradeRouteMedium {
    pub const Lad: Self = Self::Land;
    pub const Morze: Self = Self::Sea;

    pub const fn key(self) -> &'static str {
        match self {
            Self::Land => "lad",
            Self::Sea => "morze",
        }
    }
}

impl fmt::Display for TradeRouteMedium {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.key())
    }
}

/// Geometric connection status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeRouteStatus {
    #[serde(rename = "polaczony", alias = "connected")]
    Connected,
    #[serde(
        rename = "brak_polaczenia",
        alias = "no_connection",
        alias = "disconnected"
    )]
    NoConnection,
}

pub type TradeStatus = TradeRouteStatus;

#[allow(non_upper_case_globals)]
impl TradeRouteStatus {
    pub const Polaczony: Self = Self::Connected;
    pub const BrakPolaczenia: Self = Self::NoConnection;
    pub const Active: Self = Self::Connected;
    pub const Suspended: Self = Self::NoConnection;
}

/// Persistable route record.  It contains no mutable transfer ledger: income,
/// grants and stock flows are recomputed from the current active route list.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeRoute {
    pub id: String,
    #[serde(rename = "fromCityId", alias = "from_city_id")]
    pub from_city_id: String,
    #[serde(rename = "toCityId", alias = "to_city_id")]
    pub to_city_id: String,
    #[serde(rename = "ownerId", alias = "owner_id")]
    pub owner_id: u64,
    #[serde(rename = "toOwnerId", alias = "to_owner_id")]
    pub to_owner_id: u64,
    pub medium: TradeRouteMedium,
    #[serde(rename = "dystans", alias = "distance")]
    pub distance: u32,
    pub status: TradeRouteStatus,
    #[serde(rename = "budynekOdblokowany", alias = "building_unlocked")]
    pub building_unlocked: bool,
}

impl TradeRoute {
    #[allow(clippy::too_many_arguments)]
    pub fn from_parts(
        id: impl Into<String>,
        from_city_id: impl Into<String>,
        to_city_id: impl Into<String>,
        owner_id: u64,
        to_owner_id: u64,
        medium: TradeRouteMedium,
        distance: u32,
        status: TradeRouteStatus,
        building_unlocked: bool,
    ) -> Self {
        Self {
            id: id.into(),
            from_city_id: from_city_id.into(),
            to_city_id: to_city_id.into(),
            owner_id,
            to_owner_id,
            medium,
            distance,
            status,
            building_unlocked,
        }
    }

    pub fn new(
        from: &TradeCity,
        to: &TradeCity,
        medium: TradeRouteMedium,
        distance: u32,
        status: TradeRouteStatus,
        building_unlocked: bool,
    ) -> Self {
        Self::from_parts(
            trade_route_id(&from.id, &to.id, medium),
            &from.id,
            &to.id,
            from.owner_id,
            to.owner_id,
            medium,
            distance,
            status,
            building_unlocked,
        )
    }

    pub const fn is_connected(&self) -> bool {
        matches!(self.status, TradeRouteStatus::Connected)
    }

    pub const fn dystans(&self) -> u32 {
        self.distance
    }

    pub const fn building_unlocked(&self) -> bool {
        self.building_unlocked
    }
}

/// Result of a pure geometric route check.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CityConnectionResult {
    pub connected: bool,
    pub distance: u32,
    #[serde(rename = "pathHexes", alias = "path_hexes")]
    pub path_hexes: Vec<String>,
}

pub type ConnectionResult = CityConnectionResult;

impl CityConnectionResult {
    pub fn connected(distance: u32, path_hexes: Vec<String>) -> Self {
        Self {
            connected: true,
            distance,
            path_hexes,
        }
    }

    pub fn not_connected(distance: u32) -> Self {
        Self {
            connected: false,
            distance,
            path_hexes: Vec::new(),
        }
    }
}

/// Legacy geometry fields.  They remain available for save/config parity but
/// do not cap connectivity; physical BFS is the only route validator.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeRouteParams {
    #[serde(rename = "ladMaxDist", alias = "land_max_distance")]
    pub land_max_distance: u32,
    #[serde(rename = "morzeMaxDist", alias = "sea_max_distance")]
    pub sea_max_distance: u32,
}

impl Default for TradeRouteParams {
    fn default() -> Self {
        Self {
            land_max_distance: 12,
            sea_max_distance: 20,
        }
    }
}

impl TradeRouteParams {
    pub const fn new(land_max_distance: u32, sea_max_distance: u32) -> Self {
        Self {
            land_max_distance,
            sea_max_distance,
        }
    }

    pub const fn lad_max_dist(self) -> u32 {
        self.land_max_distance
    }

    pub const fn morze_max_dist(self) -> u32 {
        self.sea_max_distance
    }
}

pub const DEFAULT_TRADE_ROUTE_PARAMS: TradeRouteParams = TradeRouteParams {
    land_max_distance: 12,
    sea_max_distance: 20,
};

fn is_land_passable(terrain: TerrainType) -> bool {
    terrain.is_land_passable()
}

fn is_water_passable(terrain: TerrainType) -> bool {
    terrain.is_water_passable()
}

fn territory_owner_at(coordinate: HexCoord, nodes: &[TerritoryNode]) -> Option<u64> {
    let mut best: Option<(u32, u64)> = None;
    for node in nodes {
        let distance = coordinate.distance(node.coordinate());
        if distance > node.radius {
            continue;
        }
        if best.is_none_or(|(best_distance, _)| distance < best_distance) {
            best = Some((distance, node.owner_id));
        }
    }
    best.map(|(_, owner_id)| owner_id)
}

/// Return whether two different owners have adjacent, passable land territory.
pub fn owners_have_shared_land_border(
    owner_a: u64,
    owner_b: u64,
    territory_nodes: &[TerritoryNode],
    map: &TradeMap,
) -> bool {
    if owner_a == owner_b {
        return false;
    }
    if !territory_nodes.iter().any(|node| node.owner_id == owner_a)
        || !territory_nodes.iter().any(|node| node.owner_id == owner_b)
    {
        return false;
    }

    // A sparse scan over the effective territory radii mirrors the map-layer
    // territory ownership rule without requiring the whole world rectangle.
    for node in territory_nodes
        .iter()
        .filter(|node| node.owner_id == owner_a)
    {
        let radius = i64::from(node.radius);
        for dq in -radius..=radius {
            let r_min = (-radius).max(-dq - radius);
            let r_max = radius.min(-dq + radius);
            for dr in r_min..=r_max {
                let q = i64::from(node.q) + dq;
                let r = i64::from(node.r) + dr;
                let Ok(q) = i32::try_from(q) else {
                    continue;
                };
                let Ok(r) = i32::try_from(r) else {
                    continue;
                };
                let coordinate = HexCoord::new(q, r);
                let Some(tile) = map.tile(coordinate) else {
                    continue;
                };
                if !is_land_passable(tile.terrain)
                    || territory_owner_at(coordinate, territory_nodes) != Some(owner_a)
                {
                    continue;
                }
                if coordinate.neighbours().any(|neighbour| {
                    map.tile(neighbour)
                        .is_some_and(|tile| is_land_passable(tile.terrain))
                        && territory_owner_at(neighbour, territory_nodes) == Some(owner_b)
                }) {
                    return true;
                }
            }
        }
    }
    false
}

fn city_has_port<B>(city_id: &str, built_by_city: &B) -> bool
where
    B: BuildingLookup + ?Sized,
{
    PORT_BUILDING_IDS
        .iter()
        .any(|building_id| built_by_city.contains_building(city_id, building_id))
}

fn bfs_path<F>(
    map: &TradeMap,
    starts: &[HexCoord],
    goals: &BTreeSet<HexCoord>,
    passable: F,
) -> Option<Vec<String>>
where
    F: Fn(TerrainType) -> bool,
{
    if starts.is_empty() || goals.is_empty() {
        return None;
    }

    let mut visited = BTreeSet::new();
    let mut parent = BTreeMap::new();
    let mut frontier = VecDeque::new();

    for start in starts {
        if visited.insert(*start) {
            frontier.push_back(*start);
            if goals.contains(start) {
                return Some(vec![start.key()]);
            }
        }
    }

    for _ in 0..map.max_steps() {
        let level_len = frontier.len();
        if level_len == 0 {
            break;
        }
        for _ in 0..level_len {
            let Some(current) = frontier.pop_front() else {
                break;
            };
            for neighbour in current.neighbours() {
                if visited.contains(&neighbour) {
                    continue;
                }
                let is_goal = goals.contains(&neighbour);
                if !is_goal
                    && !map
                        .tile(neighbour)
                        .is_some_and(|tile| passable(tile.terrain))
                {
                    continue;
                }
                visited.insert(neighbour);
                parent.insert(neighbour, current);
                if is_goal {
                    let mut path = vec![neighbour];
                    let mut current = neighbour;
                    while let Some(previous) = parent.get(&current).copied() {
                        path.push(previous);
                        current = previous;
                    }
                    path.reverse();
                    return Some(path.into_iter().map(HexCoord::key).collect());
                }
                frontier.push_back(neighbour);
            }
        }
    }
    None
}

fn coastal_water_neighbours(map: &TradeMap, city: &TradeCity) -> Vec<HexCoord> {
    city.coordinate()
        .neighbours()
        .filter(|coordinate| {
            map.tile(*coordinate)
                .is_some_and(|tile| is_water_passable(tile.terrain))
        })
        .collect()
}

fn find_city_connection_internal<B>(
    from_city: &TradeCity,
    to_city: &TradeCity,
    map: &TradeMap,
    medium: TradeRouteMedium,
    built_by_city: &B,
    territory_nodes: Option<&[TerritoryNode]>,
    need_path: bool,
) -> CityConnectionResult
where
    B: BuildingLookup + ?Sized,
{
    let distance = from_city.coordinate().distance(to_city.coordinate());
    match medium {
        TradeRouteMedium::Land => {
            if let Some(nodes) = territory_nodes {
                if !owners_have_shared_land_border(from_city.owner_id, to_city.owner_id, nodes, map)
                {
                    return CityConnectionResult::not_connected(distance);
                }
            }
            let mut goals = BTreeSet::new();
            goals.insert(to_city.coordinate());
            let Some(path) = bfs_path(map, &[from_city.coordinate()], &goals, is_land_passable)
            else {
                return CityConnectionResult::not_connected(distance);
            };
            if need_path {
                CityConnectionResult::connected(distance, path)
            } else {
                CityConnectionResult::connected(distance, Vec::new())
            }
        }
        TradeRouteMedium::Sea => {
            if !city_has_port(&from_city.id, built_by_city)
                || !city_has_port(&to_city.id, built_by_city)
            {
                return CityConnectionResult::not_connected(distance);
            }
            let starts = coastal_water_neighbours(map, from_city);
            let goals: BTreeSet<_> = coastal_water_neighbours(map, to_city).into_iter().collect();
            let Some(water_path) = bfs_path(map, &starts, &goals, is_water_passable) else {
                return CityConnectionResult::not_connected(distance);
            };
            if !need_path {
                return CityConnectionResult::connected(distance, Vec::new());
            }
            let mut path = Vec::with_capacity(water_path.len() + 2);
            path.push(from_city.coordinate().key());
            path.extend(water_path);
            path.push(to_city.coordinate().key());
            CityConnectionResult::connected(distance, path)
        }
    }
}

/// Validate a route with default params and no territory-border requirement.
pub fn find_city_connection(
    from_city: &TradeCity,
    to_city: &TradeCity,
    map: &TradeMap,
    medium: TradeRouteMedium,
) -> CityConnectionResult {
    find_city_connection_internal(from_city, to_city, map, medium, &(), None, true)
}

/// Extended validator used by the turn refresh path.
#[allow(clippy::too_many_arguments)]
pub fn find_city_connection_with_options<B>(
    from_city: &TradeCity,
    to_city: &TradeCity,
    map: &TradeMap,
    medium: TradeRouteMedium,
    built_by_city: &B,
    territory_nodes: Option<&[TerritoryNode]>,
    need_path: bool,
) -> CityConnectionResult
where
    B: BuildingLookup + ?Sized,
{
    find_city_connection_internal(
        from_city,
        to_city,
        map,
        medium,
        built_by_city,
        territory_nodes,
        need_path,
    )
}

/// Params are retained in this named variant for callers mirroring the TS API;
/// connectivity deliberately ignores their distance fields.
#[allow(clippy::too_many_arguments)]
pub fn find_city_connection_with_params<B>(
    from_city: &TradeCity,
    to_city: &TradeCity,
    map: &TradeMap,
    medium: TradeRouteMedium,
    _params: &TradeRouteParams,
    built_by_city: &B,
    territory_nodes: Option<&[TerritoryNode]>,
    need_path: bool,
) -> CityConnectionResult
where
    B: BuildingLookup + ?Sized,
{
    find_city_connection_with_options(
        from_city,
        to_city,
        map,
        medium,
        built_by_city,
        territory_nodes,
        need_path,
    )
}

/// Construct a route using the default building snapshot (no building bonus).
pub fn create_trade_route(
    from_city: &TradeCity,
    to_city: &TradeCity,
    map: &TradeMap,
    medium: TradeRouteMedium,
) -> TradeRoute {
    create_trade_route_with_options(from_city, to_city, map, medium, &(), None)
}

pub fn create_trade_route_with_options<B>(
    from_city: &TradeCity,
    to_city: &TradeCity,
    map: &TradeMap,
    medium: TradeRouteMedium,
    built_by_city: &B,
    territory_nodes: Option<&[TerritoryNode]>,
) -> TradeRoute
where
    B: BuildingLookup + ?Sized,
{
    let connection = find_city_connection_internal(
        from_city,
        to_city,
        map,
        medium,
        built_by_city,
        territory_nodes,
        true,
    );
    let building_unlocked = trade_route_limit_for_city(&from_city.id, built_by_city) > 0
        && trade_route_limit_for_city(&to_city.id, built_by_city) > 0;
    TradeRoute::from_parts(
        trade_route_id(&from_city.id, &to_city.id, medium),
        &from_city.id,
        &to_city.id,
        from_city.owner_id,
        to_city.owner_id,
        medium,
        connection.distance,
        if connection.connected {
            TradeRouteStatus::Connected
        } else {
            TradeRouteStatus::NoConnection
        },
        building_unlocked,
    )
}

pub fn trade_route_id(from_city_id: &str, to_city_id: &str, medium: TradeRouteMedium) -> String {
    format!("{from_city_id}->{to_city_id}:{medium}")
}

pub fn trade_route_pair_key(city_id_a: &str, city_id_b: &str) -> String {
    if city_id_a < city_id_b {
        format!("{city_id_a}~{city_id_b}")
    } else {
        format!("{city_id_b}~{city_id_a}")
    }
}

struct TradeRouteCandidate<'a> {
    from: &'a TradeCity,
    to: &'a TradeCity,
    medium: TradeRouteMedium,
    distance: u32,
    id: String,
    is_existing: bool,
}

fn detect_best_connection<'a, B>(
    from: &'a TradeCity,
    to: &'a TradeCity,
    map: &TradeMap,
    built_by_city: &B,
    params: &TradeRouteParams,
    territory_nodes: Option<&[TerritoryNode]>,
) -> Option<(TradeRouteMedium, u32)>
where
    B: BuildingLookup + ?Sized,
{
    let land = find_city_connection_with_params(
        from,
        to,
        map,
        TradeRouteMedium::Land,
        params,
        built_by_city,
        territory_nodes,
        false,
    );
    if land.connected {
        return Some((TradeRouteMedium::Land, land.distance));
    }
    let sea = find_city_connection_with_params(
        from,
        to,
        map,
        TradeRouteMedium::Sea,
        params,
        built_by_city,
        None,
        false,
    );
    sea.connected
        .then_some((TradeRouteMedium::Sea, sea.distance))
}

/// Refresh routes for the common case: defaults, no explicit territory list,
/// and every owner having the trade technology.
pub fn refresh_trade_routes<B, FWar, FTreaty>(
    cities: &[TradeCity],
    existing_routes: &[TradeRoute],
    map: &TradeMap,
    built_by_city: &B,
    is_at_war: FWar,
    has_trade_treaty: FTreaty,
) -> Vec<TradeRoute>
where
    B: BuildingLookup + ?Sized,
    FWar: Fn(u64, u64) -> bool,
    FTreaty: Fn(u64, u64) -> bool,
{
    refresh_trade_routes_with_options(
        cities,
        existing_routes,
        map,
        built_by_city,
        is_at_war,
        has_trade_treaty,
        &DEFAULT_TRADE_ROUTE_PARAMS,
        None,
        &DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
        |_owner_id| true,
    )
}

/// Full deterministic route refresh, including war/treaty/technology gates,
/// land-border validation and existence/building slot arbitration.
#[allow(clippy::too_many_arguments)]
pub fn refresh_trade_routes_with_options<B, FWar, FTreaty, FTech>(
    cities: &[TradeCity],
    existing_routes: &[TradeRoute],
    map: &TradeMap,
    built_by_city: &B,
    is_at_war: FWar,
    has_trade_treaty: FTreaty,
    route_params: &TradeRouteParams,
    territory_nodes: Option<&[TerritoryNode]>,
    income_params: &TradeRouteIncomeParams,
    has_trade_tech: FTech,
) -> Vec<TradeRoute>
where
    B: BuildingLookup + ?Sized,
    FWar: Fn(u64, u64) -> bool,
    FTreaty: Fn(u64, u64) -> bool,
    FTech: Fn(u64) -> bool,
{
    if cities.is_empty() {
        return Vec::new();
    }

    let city_by_id: BTreeMap<&str, &TradeCity> =
        cities.iter().map(|city| (city.id.as_str(), city)).collect();
    let mut cities_by_owner: BTreeMap<u64, Vec<&TradeCity>> = BTreeMap::new();
    for city in cities {
        cities_by_owner.entry(city.owner_id).or_default().push(city);
    }
    let owner_ids: Vec<u64> = cities_by_owner.keys().copied().collect();

    let mut still_valid = Vec::new();
    for route in existing_routes {
        let Some(from) = city_by_id.get(route.from_city_id.as_str()).copied() else {
            continue;
        };
        let Some(to) = city_by_id.get(route.to_city_id.as_str()).copied() else {
            continue;
        };
        let internal = from.owner_id == to.owner_id;
        if internal {
            if !has_trade_tech(from.owner_id) {
                continue;
            }
        } else if is_at_war(from.owner_id, to.owner_id)
            || !has_trade_treaty(from.owner_id, to.owner_id)
            || !has_trade_tech(from.owner_id)
            || !has_trade_tech(to.owner_id)
        {
            continue;
        }
        let territory = if internal { None } else { territory_nodes };
        let connection = find_city_connection_with_params(
            from,
            to,
            map,
            route.medium,
            route_params,
            built_by_city,
            territory,
            false,
        );
        if connection.connected {
            still_valid.push(TradeRouteCandidate {
                from,
                to,
                medium: route.medium,
                distance: connection.distance,
                id: route.id.clone(),
                is_existing: true,
            });
        }
    }

    let mut existing_pairs = BTreeSet::new();
    let mut unique_existing = Vec::new();
    for candidate in still_valid {
        let pair = trade_route_pair_key(&candidate.from.id, &candidate.to.id);
        if existing_pairs.insert(pair) {
            unique_existing.push(candidate);
        }
    }

    let mut fresh = Vec::new();
    for (owner_index, owner_a) in owner_ids.iter().enumerate() {
        for owner_b in owner_ids.iter().skip(owner_index + 1) {
            if is_at_war(*owner_a, *owner_b)
                || !has_trade_treaty(*owner_a, *owner_b)
                || !has_trade_tech(*owner_a)
                || !has_trade_tech(*owner_b)
            {
                continue;
            }
            let Some(cities_a) = cities_by_owner.get(owner_a) else {
                continue;
            };
            let Some(cities_b) = cities_by_owner.get(owner_b) else {
                continue;
            };
            for from in cities_a {
                for to in cities_b {
                    let pair = trade_route_pair_key(&from.id, &to.id);
                    if existing_pairs.contains(&pair) {
                        continue;
                    }
                    let Some((medium, distance)) = detect_best_connection(
                        from,
                        to,
                        map,
                        built_by_city,
                        route_params,
                        territory_nodes,
                    ) else {
                        continue;
                    };
                    fresh.push(TradeRouteCandidate {
                        from,
                        to,
                        medium,
                        distance,
                        id: trade_route_id(&from.id, &to.id, medium),
                        is_existing: false,
                    });
                }
            }
        }
    }

    for owner_id in &owner_ids {
        let Some(owner_cities) = cities_by_owner.get(owner_id) else {
            continue;
        };
        if owner_cities.len() < 2 || !has_trade_tech(*owner_id) {
            continue;
        }
        let mut sorted = owner_cities.clone();
        sorted.sort_by(|left, right| left.id.cmp(&right.id));
        for (index, from) in sorted.iter().enumerate() {
            for to in sorted.iter().skip(index + 1) {
                let pair = trade_route_pair_key(&from.id, &to.id);
                if existing_pairs.contains(&pair) {
                    continue;
                }
                let Some((medium, distance)) =
                    detect_best_connection(from, to, map, built_by_city, route_params, None)
                else {
                    continue;
                };
                fresh.push(TradeRouteCandidate {
                    from,
                    to,
                    medium,
                    distance,
                    id: trade_route_id(&from.id, &to.id, medium),
                    is_existing: false,
                });
            }
        }
    }

    let mut combined = unique_existing;
    combined.extend(fresh);
    combined.sort_by(|left, right| {
        total_distance_income_impl(right.distance, right.medium, income_params)
            .cmp(&total_distance_income_impl(
                left.distance,
                left.medium,
                income_params,
            ))
            .then_with(|| right.is_existing.cmp(&left.is_existing))
            .then_with(|| left.id.cmp(&right.id))
    });

    let mut used_existence_slots: BTreeMap<&str, u32> = BTreeMap::new();
    let mut used_building_slots: BTreeMap<&str, u32> = BTreeMap::new();
    let mut kept_pairs = BTreeSet::new();
    let mut kept = Vec::new();

    for candidate in combined {
        let pair = trade_route_pair_key(&candidate.from.id, &candidate.to.id);
        if kept_pairs.contains(&pair) {
            continue;
        }
        let from_used = used_existence_slots
            .get(candidate.from.id.as_str())
            .copied()
            .unwrap_or_default();
        let to_used = used_existence_slots
            .get(candidate.to.id.as_str())
            .copied()
            .unwrap_or_default();
        if from_used >= trade_route_existence_limit_for_city(&candidate.from.id, built_by_city)
            || to_used >= trade_route_existence_limit_for_city(&candidate.to.id, built_by_city)
        {
            continue;
        }
        kept_pairs.insert(pair);
        *used_existence_slots
            .entry(candidate.from.id.as_str())
            .or_default() += 1;
        *used_existence_slots
            .entry(candidate.to.id.as_str())
            .or_default() += 1;

        let from_buildings = used_building_slots
            .get(candidate.from.id.as_str())
            .copied()
            .unwrap_or_default();
        let to_buildings = used_building_slots
            .get(candidate.to.id.as_str())
            .copied()
            .unwrap_or_default();
        let from_limit = trade_route_limit_for_city(&candidate.from.id, built_by_city);
        let to_limit = trade_route_limit_for_city(&candidate.to.id, built_by_city);
        let building_unlocked = from_buildings < from_limit && to_buildings < to_limit;
        if building_unlocked {
            *used_building_slots
                .entry(candidate.from.id.as_str())
                .or_default() += 1;
            *used_building_slots
                .entry(candidate.to.id.as_str())
                .or_default() += 1;
        }

        kept.push(TradeRoute::from_parts(
            candidate.id,
            &candidate.from.id,
            &candidate.to.id,
            candidate.from.owner_id,
            candidate.to.owner_id,
            candidate.medium,
            candidate.distance,
            TradeRouteStatus::Connected,
            building_unlocked,
        ));
    }
    kept
}

pub fn cities_have_trade_connection<B>(
    cities_a: &[TradeCity],
    cities_b: &[TradeCity],
    map: &TradeMap,
    built_by_city: &B,
) -> bool
where
    B: BuildingLookup + ?Sized,
{
    cities_have_trade_connection_with_options(
        cities_a,
        cities_b,
        map,
        built_by_city,
        &DEFAULT_TRADE_ROUTE_PARAMS,
        None,
    )
}

pub fn cities_have_trade_connection_with_options<B>(
    cities_a: &[TradeCity],
    cities_b: &[TradeCity],
    map: &TradeMap,
    built_by_city: &B,
    params: &TradeRouteParams,
    territory_nodes: Option<&[TerritoryNode]>,
) -> bool
where
    B: BuildingLookup + ?Sized,
{
    cities_a.iter().any(|from| {
        cities_b.iter().any(|to| {
            detect_best_connection(from, to, map, built_by_city, params, territory_nodes).is_some()
        })
    })
}

/// Explain the common reasons an external partner has no route.
pub fn diagnose_missing_trade_route_for_partner<B, FWar>(
    player_owner_id: u64,
    partner_owner_id: u64,
    cities: &[TradeCity],
    map: &TradeMap,
    built_by_city: &B,
    is_at_war: FWar,
) -> Option<String>
where
    B: BuildingLookup + ?Sized,
    FWar: Fn(u64, u64) -> bool,
{
    diagnose_missing_trade_route_for_partner_with_options(
        player_owner_id,
        partner_owner_id,
        cities,
        map,
        built_by_city,
        is_at_war,
        &DEFAULT_TRADE_ROUTE_PARAMS,
        None,
        None,
    )
}

#[allow(clippy::too_many_arguments)]
pub fn diagnose_missing_trade_route_for_partner_with_options<B, FWar>(
    player_owner_id: u64,
    partner_owner_id: u64,
    cities: &[TradeCity],
    map: &TradeMap,
    built_by_city: &B,
    is_at_war: FWar,
    params: &TradeRouteParams,
    partner_label: Option<&str>,
    territory_nodes: Option<&[TerritoryNode]>,
) -> Option<String>
where
    B: BuildingLookup + ?Sized,
    FWar: Fn(u64, u64) -> bool,
{
    if is_at_war(player_owner_id, partner_owner_id) {
        return Some("wojna — szlaki zawieszone".to_owned());
    }
    let player_cities: Vec<_> = cities
        .iter()
        .filter(|city| city.owner_id == player_owner_id)
        .collect();
    let partner_cities: Vec<_> = cities
        .iter()
        .filter(|city| city.owner_id == partner_owner_id)
        .collect();
    let label = partner_label
        .map(str::to_owned)
        .unwrap_or_else(|| format!("cywilizacja {partner_owner_id}"));
    if player_cities.is_empty() || partner_cities.is_empty() {
        return Some("brak miast do handlu".to_owned());
    }
    let player_cities: Vec<TradeCity> = player_cities.into_iter().cloned().collect();
    let partner_cities: Vec<TradeCity> = partner_cities.into_iter().cloned().collect();
    if cities_have_trade_connection_with_options(
        &player_cities,
        &partner_cities,
        map,
        built_by_city,
        params,
        territory_nodes,
    ) {
        return None;
    }
    let any_ports = player_cities
        .iter()
        .any(|city| city_has_port(&city.id, built_by_city))
        && partner_cities
            .iter()
            .any(|city| city_has_port(&city.id, built_by_city));
    let sea_geometry = cities_have_trade_connection_with_options(
        &player_cities,
        &partner_cities,
        map,
        built_by_city,
        params,
        None,
    );
    if !any_ports && sea_geometry {
        return Some(format!("{label}: wymagany Port w obu miastach"));
    }
    if territory_nodes.is_some()
        && cities_have_trade_connection_with_options(
            &player_cities,
            &partner_cities,
            map,
            built_by_city,
            params,
            None,
        )
    {
        return Some(format!("{label}: brak wspólnej granicy lądowej"));
    }
    Some(format!("{label}: brak fizycznego połączenia"))
}

/// Distance-income parameters.  Both media reach the same peak at different
/// reference distances.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeRouteIncomeParams {
    #[serde(rename = "dochodPodloga", alias = "income_floor")]
    pub income_floor: u64,
    #[serde(rename = "dochodSzczyt", alias = "income_peak")]
    pub income_peak: u64,
    #[serde(rename = "ladMaxDist", alias = "land_max_distance")]
    pub land_max_distance: u32,
    #[serde(rename = "morzeMaxDist", alias = "sea_max_distance")]
    pub sea_max_distance: u32,
}

impl TradeRouteIncomeParams {
    pub const fn new(
        income_floor: u64,
        income_peak: u64,
        land_max_distance: u32,
        sea_max_distance: u32,
    ) -> Self {
        Self {
            income_floor,
            income_peak,
            land_max_distance,
            sea_max_distance,
        }
    }
}

pub const DEFAULT_TRADE_ROUTE_INCOME_PARAMS: TradeRouteIncomeParams = TradeRouteIncomeParams {
    income_floor: 5,
    income_peak: 40,
    land_max_distance: 12,
    sea_max_distance: 20,
};

impl Default for TradeRouteIncomeParams {
    fn default() -> Self {
        DEFAULT_TRADE_ROUTE_INCOME_PARAMS
    }
}

fn distance_income_impl(
    distance: u32,
    medium: TradeRouteMedium,
    params: &TradeRouteIncomeParams,
) -> u64 {
    let max_distance = match medium {
        TradeRouteMedium::Land => params.land_max_distance,
        TradeRouteMedium::Sea => params.sea_max_distance,
    }
    .max(1);
    let clipped_distance = distance.min(max_distance);
    let floor = params.income_floor as f64;
    let peak = params.income_peak as f64;
    let raw = floor + (peak - floor) * f64::from(clipped_distance) / f64::from(max_distance);
    raw.floor().clamp(floor.min(peak), floor.max(peak)).max(0.0) as u64
}

/// Canonical distance curve using default tuning.
pub fn trade_route_distance_income(distance: u32, medium: TradeRouteMedium) -> u64 {
    distance_income_impl(distance, medium, &DEFAULT_TRADE_ROUTE_INCOME_PARAMS)
}

pub fn trade_route_distance_income_with_params(
    distance: u32,
    medium: TradeRouteMedium,
    params: &TradeRouteIncomeParams,
) -> u64 {
    distance_income_impl(distance, medium, params)
}

fn total_distance_income_impl(
    distance: u32,
    medium: TradeRouteMedium,
    params: &TradeRouteIncomeParams,
) -> u64 {
    let base = distance_income_impl(distance, medium, params);
    let pre_scale = match medium {
        TradeRouteMedium::Land => base,
        TradeRouteMedium::Sea => base.saturating_mul(2),
    };
    // Math.round(x) for a non-negative value is floor(x + 0.5).  Keeping the
    // calculation in f64 matches the browser rule even for a custom peak.
    ((pre_scale as f64 / 5.0).floor() + if pre_scale % 5 >= 3 { 1.0 } else { 0.0 }).max(1.0) as u64
}

pub fn trade_route_total_distance_income(distance: u32, medium: TradeRouteMedium) -> u64 {
    total_distance_income_impl(distance, medium, &DEFAULT_TRADE_ROUTE_INCOME_PARAMS)
}

pub fn trade_route_total_distance_income_with_params(
    distance: u32,
    medium: TradeRouteMedium,
    params: &TradeRouteIncomeParams,
) -> u64 {
    total_distance_income_impl(distance, medium, params)
}

pub fn compute_trade_route_income_by_city(routes: &[TradeRoute]) -> BTreeMap<String, u64> {
    compute_trade_route_income_by_city_with_params(
        routes,
        &DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
        |_owner_id, _medium| 0.0,
    )
}

pub fn compute_trade_route_income_by_city_with_params<F>(
    routes: &[TradeRoute],
    params: &TradeRouteIncomeParams,
    wonder_trade_bonus_for_owner: F,
) -> BTreeMap<String, u64>
where
    F: Fn(u64, TradeRouteMedium) -> f64,
{
    let mut result = BTreeMap::new();
    for route in routes.iter().filter(|route| route.is_connected()) {
        let base = total_distance_income_impl(route.distance, route.medium, params);
        let from_bonus = wonder_trade_bonus_for_owner(route.owner_id, route.medium);
        let to_bonus = wonder_trade_bonus_for_owner(route.to_owner_id, route.medium);
        let from_income = if from_bonus == 0.0 {
            base
        } else {
            (base as f64 * (1.0 + from_bonus)).floor().max(0.0) as u64
        };
        let to_income = if to_bonus == 0.0 {
            base
        } else {
            (base as f64 * (1.0 + to_bonus)).floor().max(0.0) as u64
        };
        *result.entry(route.from_city_id.clone()).or_default() += from_income;
        *result.entry(route.to_city_id.clone()).or_default() += to_income;
    }
    result
}

pub const TRADE_ROUTE_BUILDING_BONUS_RATE: f64 = 0.05;

pub fn trade_route_building_bonus_for_route(route: &TradeRoute) -> f64 {
    trade_route_building_bonus_for_route_with_params(route, &DEFAULT_TRADE_ROUTE_INCOME_PARAMS)
}

pub fn trade_route_building_bonus_for_route_with_params(
    route: &TradeRoute,
    params: &TradeRouteIncomeParams,
) -> f64 {
    if !route.is_connected() || !route.building_unlocked {
        return 0.0;
    }
    TRADE_ROUTE_BUILDING_BONUS_RATE
        * total_distance_income_impl(route.distance, route.medium, params) as f64
}

pub fn compute_trade_route_building_bonus_by_city(routes: &[TradeRoute]) -> BTreeMap<String, f64> {
    compute_trade_route_building_bonus_by_city_with_params(
        routes,
        &DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
    )
}

pub fn compute_trade_route_building_bonus_by_city_with_params(
    routes: &[TradeRoute],
    params: &TradeRouteIncomeParams,
) -> BTreeMap<String, f64> {
    let mut result = BTreeMap::new();
    for route in routes
        .iter()
        .filter(|route| route.is_connected() && route.building_unlocked)
    {
        let bonus = trade_route_building_bonus_for_route_with_params(route, params);
        *result.entry(route.from_city_id.clone()).or_default() += bonus;
        *result.entry(route.to_city_id.clone()).or_default() += bonus;
    }
    result
}

pub fn compute_sea_trade_route_count_by_city(routes: &[TradeRoute]) -> BTreeMap<String, u32> {
    let mut result = BTreeMap::new();
    for route in routes
        .iter()
        .filter(|route| route.is_connected() && route.medium == TradeRouteMedium::Sea)
    {
        *result.entry(route.from_city_id.clone()).or_default() += 1;
        *result.entry(route.to_city_id.clone()).or_default() += 1;
    }
    result
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct SeaTradeBonusParams {
    #[serde(rename = "bonusPerExtraRoute", alias = "bonus_per_extra_route")]
    pub bonus_per_extra_route: u64,
}

impl Default for SeaTradeBonusParams {
    fn default() -> Self {
        Self {
            bonus_per_extra_route: 1,
        }
    }
}

impl From<u64> for SeaTradeBonusParams {
    fn from(bonus_per_extra_route: u64) -> Self {
        Self {
            bonus_per_extra_route,
        }
    }
}

pub const PORT_SEA_TRADE_BONUS_PIENIADZ: u64 = 1;

pub fn compute_sea_trade_bonus_income_by_city<P>(
    sea_trade_route_count_by_city: &BTreeMap<String, u32>,
    params: P,
) -> BTreeMap<String, u64>
where
    P: Into<SeaTradeBonusParams>,
{
    let params = params.into();
    sea_trade_route_count_by_city
        .iter()
        .filter_map(|(city_id, count)| {
            count
                .checked_sub(1)
                .filter(|extra| *extra > 0)
                .map(|extra| {
                    (
                        city_id.clone(),
                        u64::from(extra) * params.bonus_per_extra_route,
                    )
                })
        })
        .collect()
}

pub const TRADE_ROUTE_RESOURCE_KEYS: [&str; 5] = ["braz", "zelazo", "kon", "cegla", "zloto"];
pub const TRADE_ROUTE_STOCK_FLOW_KEYS: [&str; 6] =
    ["braz", "zelazo", "kon", "cegla", "zloto", "sol"];
pub type TradeRouteResourceKey = String;
pub type TradeRouteStockFlowResourceKey = String;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeRouteResourceGrant {
    #[serde(rename = "ownerId", alias = "owner_id")]
    pub owner_id: u64,
    #[serde(rename = "resourceKey", alias = "resource_key")]
    pub resource_key: String,
    #[serde(rename = "viaOwnerId", alias = "via_owner_id")]
    pub via_owner_id: u64,
    #[serde(rename = "viaCityId", alias = "via_city_id")]
    pub via_city_id: String,
    #[serde(rename = "routeId", alias = "route_id")]
    pub route_id: String,
}

impl TradeRouteResourceGrant {
    pub fn new(
        owner_id: u64,
        resource_key: impl Into<String>,
        via_owner_id: u64,
        via_city_id: impl Into<String>,
        route_id: impl Into<String>,
    ) -> Self {
        Self {
            owner_id,
            resource_key: resource_key.into(),
            via_owner_id,
            via_city_id: via_city_id.into(),
            route_id: route_id.into(),
        }
    }
}

pub fn compute_trade_route_resource_grants<F>(
    routes: &[TradeRoute],
    owner_has_native_access: F,
) -> Vec<TradeRouteResourceGrant>
where
    F: Fn(u64, &str) -> bool,
{
    compute_trade_route_resource_grants_with_keys(
        routes,
        owner_has_native_access,
        &TRADE_ROUTE_RESOURCE_KEYS,
    )
}

pub fn compute_trade_route_resource_grants_with_keys<F>(
    routes: &[TradeRoute],
    owner_has_native_access: F,
    resource_keys: &[&str],
) -> Vec<TradeRouteResourceGrant>
where
    F: Fn(u64, &str) -> bool,
{
    let mut grants = Vec::new();
    for route in routes.iter().filter(|route| route.is_connected()) {
        for resource_key in resource_keys {
            if owner_has_native_access(route.owner_id, resource_key)
                && !owner_has_native_access(route.to_owner_id, resource_key)
            {
                grants.push(TradeRouteResourceGrant::new(
                    route.to_owner_id,
                    *resource_key,
                    route.owner_id,
                    &route.to_city_id,
                    &route.id,
                ));
            }
            if owner_has_native_access(route.to_owner_id, resource_key)
                && !owner_has_native_access(route.owner_id, resource_key)
            {
                grants.push(TradeRouteResourceGrant::new(
                    route.owner_id,
                    *resource_key,
                    route.to_owner_id,
                    &route.from_city_id,
                    &route.id,
                ));
            }
        }
    }
    grants
}

pub fn has_trade_route_resource_access(
    grants: &[TradeRouteResourceGrant],
    owner_id: u64,
    resource_key: &str,
) -> bool {
    grants
        .iter()
        .any(|grant| grant.owner_id == owner_id && grant.resource_key == resource_key)
}

pub fn first_trade_route_resource_grant<'a>(
    grants: &'a [TradeRouteResourceGrant],
    owner_id: u64,
    resource_key: &str,
) -> Option<&'a TradeRouteResourceGrant> {
    grants
        .iter()
        .filter(|grant| grant.owner_id == owner_id && grant.resource_key == resource_key)
        .min_by(|left, right| left.route_id.cmp(&right.route_id))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeRouteResourceFlowParams {
    #[serde(rename = "minStockReserve", alias = "min_stock_reserve")]
    pub min_stock_reserve: u64,
}

impl Default for TradeRouteResourceFlowParams {
    fn default() -> Self {
        Self {
            min_stock_reserve: 2,
        }
    }
}

pub const DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS: TradeRouteResourceFlowParams =
    TradeRouteResourceFlowParams {
        min_stock_reserve: 2,
    };

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradeRouteResourceFlow {
    #[serde(rename = "routeId", alias = "route_id")]
    pub route_id: String,
    #[serde(rename = "resourceKey", alias = "resource_key")]
    pub resource_key: String,
    #[serde(rename = "fromOwnerId", alias = "from_owner_id")]
    pub from_owner_id: u64,
    #[serde(rename = "toOwnerId", alias = "to_owner_id")]
    pub to_owner_id: u64,
    pub amount: u64,
}

impl TradeRouteResourceFlow {
    pub fn new(
        route_id: impl Into<String>,
        resource_key: impl Into<String>,
        from_owner_id: u64,
        to_owner_id: u64,
        amount: u64,
    ) -> Self {
        Self {
            route_id: route_id.into(),
            resource_key: resource_key.into(),
            from_owner_id,
            to_owner_id,
            amount,
        }
    }
}

pub fn compute_trade_route_resource_flow<F>(
    routes: &[TradeRoute],
    owner_stock: F,
) -> Vec<TradeRouteResourceFlow>
where
    F: Fn(u64, &str) -> u64,
{
    compute_trade_route_resource_flow_with_options(
        routes,
        owner_stock,
        &DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS,
        &TRADE_ROUTE_STOCK_FLOW_KEYS,
    )
}

pub fn compute_trade_route_resource_flow_with_options<F>(
    routes: &[TradeRoute],
    owner_stock: F,
    params: &TradeRouteResourceFlowParams,
    resource_keys: &[&str],
) -> Vec<TradeRouteResourceFlow>
where
    F: Fn(u64, &str) -> u64,
{
    let mut ledger: BTreeMap<(u64, String), u64> = BTreeMap::new();
    let mut active_routes: Vec<&TradeRoute> =
        routes.iter().filter(|route| route.is_connected()).collect();
    active_routes.sort_by(|left, right| left.id.cmp(&right.id));

    let mut flows = Vec::new();
    for route in active_routes {
        for resource_key in resource_keys {
            let from_stock = ledger_stock(&mut ledger, route.owner_id, resource_key, &owner_stock);
            let to_stock = ledger_stock(&mut ledger, route.to_owner_id, resource_key, &owner_stock);
            if from_stock == to_stock {
                continue;
            }
            let (donor, recipient, donor_stock) = if from_stock > to_stock {
                (route.owner_id, route.to_owner_id, from_stock)
            } else {
                (route.to_owner_id, route.owner_id, to_stock)
            };
            let amount = donor_stock.saturating_sub(params.min_stock_reserve);
            if amount == 0 {
                continue;
            }
            let donor_key = (donor, (*resource_key).to_owned());
            let recipient_key = (recipient, (*resource_key).to_owned());
            let donor_after =
                ledger_stock(&mut ledger, donor, resource_key, &owner_stock).saturating_sub(amount);
            let recipient_after = ledger_stock(&mut ledger, recipient, resource_key, &owner_stock)
                .saturating_add(amount);
            ledger.insert(donor_key, donor_after);
            ledger.insert(recipient_key, recipient_after);
            flows.push(TradeRouteResourceFlow::new(
                &route.id,
                *resource_key,
                donor,
                recipient,
                amount,
            ));
        }
    }
    flows
}

fn ledger_stock<F>(
    ledger: &mut BTreeMap<(u64, String), u64>,
    owner_id: u64,
    resource_key: &str,
    owner_stock: &F,
) -> u64
where
    F: Fn(u64, &str) -> u64,
{
    *ledger
        .entry((owner_id, resource_key.to_owned()))
        .or_insert_with(|| owner_stock(owner_id, resource_key))
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct TradeRouteDiff {
    pub added: Vec<TradeRoute>,
    pub removed: Vec<TradeRoute>,
}

pub fn diff_trade_routes(prev_routes: &[TradeRoute], next_routes: &[TradeRoute]) -> TradeRouteDiff {
    let previous: BTreeSet<&str> = prev_routes.iter().map(|route| route.id.as_str()).collect();
    let next: BTreeSet<&str> = next_routes.iter().map(|route| route.id.as_str()).collect();
    TradeRouteDiff {
        added: next_routes
            .iter()
            .filter(|route| !previous.contains(route.id.as_str()))
            .cloned()
            .collect(),
        removed: prev_routes
            .iter()
            .filter(|route| !next.contains(route.id.as_str()))
            .cloned()
            .collect(),
    }
}

/// Difficulty labels used by the data loader.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Difficulty {
    Easy,
    Normal,
    Hard,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, Default)]
pub struct RawParamRow {
    pub easy: Option<f64>,
    pub normal: Option<f64>,
    pub hard: Option<f64>,
}

impl RawParamRow {
    fn value(self, difficulty: Difficulty) -> Option<f64> {
        let value = match difficulty {
            Difficulty::Easy => self.easy,
            Difficulty::Normal => self.normal,
            Difficulty::Hard => self.hard,
        }?;
        value.is_finite().then_some(value)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct RawTradeParameters {
    #[serde(default, rename = "handel_szlaki")]
    pub trade_routes: BTreeMap<String, RawParamRow>,
    #[serde(default, rename = "ekonomia_miasta")]
    pub city_economy: BTreeMap<String, RawParamRow>,
}

pub fn load_trade_route_params(
    raw: &RawTradeParameters,
    difficulty: Difficulty,
) -> TradeRouteParams {
    let value = |key: &str, fallback: u32| {
        raw.trade_routes
            .get(key)
            .and_then(|row| row.value(difficulty))
            .filter(|value| *value >= 0.0)
            .map(|value| value as u32)
            .unwrap_or(fallback)
    };
    TradeRouteParams::new(
        value(
            "lad_max_dystans",
            DEFAULT_TRADE_ROUTE_PARAMS.land_max_distance,
        ),
        value(
            "morze_max_dystans",
            DEFAULT_TRADE_ROUTE_PARAMS.sea_max_distance,
        ),
    )
}

pub fn load_trade_route_income_params(
    raw: &RawTradeParameters,
    difficulty: Difficulty,
) -> TradeRouteIncomeParams {
    let value = |key: &str, fallback: u64| {
        raw.trade_routes
            .get(key)
            .and_then(|row| row.value(difficulty))
            .filter(|value| *value >= 0.0)
            .map(|value| value as u64)
            .unwrap_or(fallback)
    };
    TradeRouteIncomeParams::new(
        value(
            "dochod_podloga",
            DEFAULT_TRADE_ROUTE_INCOME_PARAMS.income_floor,
        ),
        value(
            "dochod_szczyt",
            DEFAULT_TRADE_ROUTE_INCOME_PARAMS.income_peak,
        ),
        value(
            "lad_max_dystans",
            u64::from(DEFAULT_TRADE_ROUTE_INCOME_PARAMS.land_max_distance),
        ) as u32,
        value(
            "morze_max_dystans",
            u64::from(DEFAULT_TRADE_ROUTE_INCOME_PARAMS.sea_max_distance),
        ) as u32,
    )
}

pub fn load_trade_route_resource_flow_params(
    raw: &RawTradeParameters,
    difficulty: Difficulty,
) -> TradeRouteResourceFlowParams {
    let reserve = raw
        .city_economy
        .get("handel_surowiec_min_stock")
        .and_then(|row| row.value(difficulty))
        .filter(|value| *value >= 0.0)
        .map(|value| value as u64)
        .unwrap_or(DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS.min_stock_reserve);
    TradeRouteResourceFlowParams {
        min_stock_reserve: reserve,
    }
}

// Compatibility spellings for callers porting names directly from the
// TypeScript domain module.
#[allow(non_snake_case)]
pub fn tradeRouteId(from_city_id: &str, to_city_id: &str, medium: TradeRouteMedium) -> String {
    trade_route_id(from_city_id, to_city_id, medium)
}

#[allow(non_snake_case)]
pub fn tradeRoutePairKey(city_id_a: &str, city_id_b: &str) -> String {
    trade_route_pair_key(city_id_a, city_id_b)
}
