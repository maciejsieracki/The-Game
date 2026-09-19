//! Pure, deterministic planner for one civilization AI turn.
//!
//! The planner is deliberately an engine boundary: it reads an immutable turn
//! snapshot and returns commands.  It never mutates units, cities, the map, or
//! a production queue.  The executor may therefore validate/apply each command
//! using exactly the same movement, production, and founding rules as a human
//! player.
//!
//! The wire shape follows the TypeScript `AICommand` contract from
//! `Civ-AI/Spec-AI-architektura.md`: production commands first, at most one
//! action per unit, and `endTurn` as the final command.

use serde::{Deserialize, Serialize};
use std::cmp::Reverse;
use std::collections::{BTreeMap, BTreeSet, BinaryHeap};

pub const DEFAULT_MIN_CITY_DISTANCE: u32 = 5;
pub const DEFAULT_THREAT_RANGE: u32 = 5;
pub const DEFAULT_CITY_SCORE_ENEMY_PENALTY: i32 = -3;
pub const DEFAULT_CITY_SCORE_FOOD: i32 = 3;
pub const DEFAULT_CITY_SCORE_WORK: i32 = 2;
pub const DEFAULT_CITY_SCORE_TRADE: i32 = 1;
pub const DEFAULT_CITY_SCORE_RIVER: i32 = 2;
pub const DEFAULT_CITY_SCORE_RESOURCE: i32 = 2;

/// Axial coordinate on the pointy-top hex grid used by the game.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
}

pub type Hex = HexCoord;

impl HexCoord {
    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }

    pub const fn s(self) -> i32 {
        -self.q - self.r
    }

    pub const fn distance(self, other: Self) -> u32 {
        let dq = (self.q - other.q).unsigned_abs();
        let dr = (self.r - other.r).unsigned_abs();
        let ds = (self.s() - other.s()).unsigned_abs();
        let max_qr = if dq > dr { dq } else { dr };
        if max_qr > ds {
            max_qr
        } else {
            ds
        }
    }

    /// Neighbours are in the same stable order as the engine pathfinder.
    pub const fn neighbours(self) -> [Self; 6] {
        [
            Self::new(self.q + 1, self.r),
            Self::new(self.q + 1, self.r - 1),
            Self::new(self.q, self.r - 1),
            Self::new(self.q - 1, self.r),
            Self::new(self.q - 1, self.r + 1),
            Self::new(self.q, self.r + 1),
        ]
    }

    pub const fn is_adjacent(self, other: Self) -> bool {
        self.distance(other) == 1
    }

    pub fn key(self) -> String {
        format!("{},{}", self.q, self.r)
    }
}

/// Base terrain needed by the AI's city-site and ordinary land-unit rules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Terrain {
    Grassland,
    Plains,
    Hills,
    Mountains,
    ShallowWater,
    Ocean,
    Desert,
    Tundra,
}

pub type TerrainType = Terrain;

impl Terrain {
    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    /// Cost to enter this terrain, matching the player pathfinder.
    pub const fn movement_cost(self) -> Option<u32> {
        match self {
            Self::Grassland | Self::Plains | Self::Desert => Some(1),
            Self::Hills => Some(2),
            Self::Mountains | Self::ShallowWater | Self::Ocean | Self::Tundra => None,
        }
    }

    pub const fn is_passable(self) -> bool {
        self.movement_cost().is_some()
    }

    pub const fn can_found_city(self) -> bool {
        !self.is_water() && !matches!(self, Self::Mountains)
    }
}

/// Immutable map-field facts consumed by the planner.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MapTile {
    pub terrain: Terrain,
    #[serde(default)]
    pub food: i32,
    #[serde(default)]
    pub work: i32,
    #[serde(default)]
    pub trade: i32,
    #[serde(default)]
    pub river: bool,
    #[serde(default)]
    pub resource: Option<String>,
    #[serde(default)]
    pub village: bool,
    /// `None` is neutral; a value marks an occupied territory.
    #[serde(default)]
    pub owner_id: Option<u64>,
}

pub type Tile = MapTile;

impl MapTile {
    pub const fn new(terrain: Terrain) -> Self {
        Self {
            terrain,
            food: 0,
            work: 0,
            trade: 0,
            river: false,
            resource: None,
            village: false,
            owner_id: None,
        }
    }

    pub const fn with_yields(mut self, food: i32, work: i32, trade: i32) -> Self {
        self.food = food;
        self.work = work;
        self.trade = trade;
        self
    }

    pub const fn with_river(mut self, river: bool) -> Self {
        self.river = river;
        self
    }

    pub fn with_resource(mut self, resource: impl Into<String>) -> Self {
        self.resource = Some(resource.into());
        self
    }

    pub const fn with_village(mut self, village: bool) -> Self {
        self.village = village;
        self
    }

    pub const fn owned(mut self, owner_id: u64) -> Self {
        self.owner_id = Some(owner_id);
        self
    }

    pub const fn is_passable(&self) -> bool {
        self.terrain.is_passable()
    }

    pub const fn is_city_site(&self) -> bool {
        self.terrain.can_found_city()
    }
}

/// Sparse immutable map snapshot.  Missing fields are not traversable.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
struct AiMapTileEntry {
    coordinate: HexCoord,
    tile: MapTile,
}

mod ai_map_tiles {
    use super::{AiMapTileEntry, HexCoord, MapTile};
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use std::collections::BTreeMap;

    pub fn serialize<S>(
        tiles: &BTreeMap<HexCoord, MapTile>,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        tiles
            .iter()
            .map(|(coordinate, tile)| AiMapTileEntry {
                coordinate: *coordinate,
                tile: tile.clone(),
            })
            .collect::<Vec<_>>()
            .serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<BTreeMap<HexCoord, MapTile>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let entries = Vec::<AiMapTileEntry>::deserialize(deserializer)?;
        Ok(entries
            .into_iter()
            .map(|entry| (entry.coordinate, entry.tile))
            .collect())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct AiMap {
    /// JSON uses an array of coordinate/tile entries instead of object keys,
    /// because JSON object keys must be strings while `HexCoord` is structured.
    #[serde(with = "ai_map_tiles")]
    pub tiles: BTreeMap<HexCoord, MapTile>,
}

pub type GameMap = AiMap;
pub type Map = AiMap;

impl AiMap {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn from_tiles<I>(tiles: I) -> Self
    where
        I: IntoIterator<Item = (HexCoord, MapTile)>,
    {
        Self {
            tiles: tiles.into_iter().collect(),
        }
    }

    pub fn insert(&mut self, coordinate: HexCoord, tile: MapTile) -> Option<MapTile> {
        self.tiles.insert(coordinate, tile)
    }

    pub fn tile(&self, coordinate: HexCoord) -> Option<&MapTile> {
        self.tiles.get(&coordinate)
    }

    pub fn tile_mut(&mut self, coordinate: HexCoord) -> Option<&mut MapTile> {
        self.tiles.get_mut(&coordinate)
    }

    pub fn contains(&self, coordinate: HexCoord) -> bool {
        self.tiles.contains_key(&coordinate)
    }
}

/// Unit categories needed for action ordering and basic strategy.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UnitKind {
    Super,
    Settler,
    Scout,
    Warrior,
    Archer,
    Spearman,
    Slinger,
    Worker,
    Civilian,
    Other(String),
}

pub type AiUnitKind = UnitKind;

impl UnitKind {
    pub const fn is_settler(&self) -> bool {
        matches!(self, Self::Settler)
    }

    pub const fn is_civilian(&self) -> bool {
        matches!(
            self,
            Self::Settler | Self::Scout | Self::Worker | Self::Civilian
        )
    }

    pub const fn is_ranged(&self) -> bool {
        matches!(self, Self::Archer | Self::Slinger)
    }

    pub const fn is_military(&self) -> bool {
        matches!(
            self,
            Self::Super
                | Self::Warrior
                | Self::Archer
                | Self::Spearman
                | Self::Slinger
                | Self::Other(_)
        )
    }

    /// Lower values act first, matching the super → military → civilian rule.
    pub const fn action_priority(&self) -> u8 {
        match self {
            Self::Super => 0,
            Self::Warrior | Self::Archer | Self::Spearman | Self::Slinger => 1,
            Self::Settler => 2,
            Self::Scout => 3,
            Self::Worker | Self::Civilian | Self::Other(_) => 4,
        }
    }
}

/// Unit snapshot passed to the planner.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AiUnit {
    pub id: u64,
    pub owner_id: u64,
    pub q: i32,
    pub r: i32,
    pub kind: UnitKind,
    #[serde(default = "default_movement")]
    pub movement_left: u32,
    /// `None` means health is not tracked by this caller; otherwise 0.0..=1.0.
    #[serde(default)]
    pub health_fraction: Option<f64>,
    #[serde(default)]
    pub embarked: bool,
}

pub type AIUnit = AiUnit;

const fn default_movement() -> u32 {
    1
}

impl AiUnit {
    pub fn new(id: u64, owner_id: u64, kind: UnitKind, q: i32, r: i32) -> Self {
        Self {
            id,
            owner_id,
            q,
            r,
            kind,
            movement_left: 1,
            health_fraction: None,
            embarked: false,
        }
    }

    pub const fn position(&self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }

    pub const fn with_movement(mut self, movement_left: u32) -> Self {
        self.movement_left = movement_left;
        self
    }

    pub const fn with_health_fraction(mut self, health_fraction: f64) -> Self {
        self.health_fraction = Some(health_fraction);
        self
    }

    pub const fn with_embarked(mut self, embarked: bool) -> Self {
        self.embarked = embarked;
        self
    }
}

/// City snapshot passed to the planner.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AiCity {
    pub id: u64,
    pub owner_id: u64,
    pub q: i32,
    pub r: i32,
    #[serde(default = "default_population")]
    pub population: u32,
    #[serde(default)]
    pub built_buildings: BTreeSet<String>,
    /// `Some` means the executor already has production queued; the planner
    /// must not interrupt it.
    #[serde(default)]
    pub production_queue: Option<String>,
}

pub type AICity = AiCity;

const fn default_population() -> u32 {
    1
}

impl AiCity {
    pub fn new(id: u64, owner_id: u64, q: i32, r: i32) -> Self {
        Self {
            id,
            owner_id,
            q,
            r,
            population: 1,
            built_buildings: BTreeSet::new(),
            production_queue: None,
        }
    }

    pub const fn position(&self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }

    pub const fn with_population(mut self, population: u32) -> Self {
        self.population = population;
        self
    }

    pub fn with_built_buildings<I, S>(mut self, buildings: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.built_buildings = buildings.into_iter().map(Into::into).collect();
        self
    }

    pub fn with_production(mut self, item_id: impl Into<String>) -> Self {
        self.production_queue = Some(item_id.into());
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProductionKind {
    Building,
    Unit(UnitKind),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProductionItem {
    pub id: String,
    pub kind: ProductionKind,
}

impl ProductionItem {
    pub fn building(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            kind: ProductionKind::Building,
        }
    }

    pub fn unit(id: impl Into<String>, kind: UnitKind) -> Self {
        Self {
            id: id.into(),
            kind: ProductionKind::Unit(kind),
        }
    }
}

/// Archetype deltas used by production priorities.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ArchetypeMods {
    pub military: i32,
    pub science: i32,
    pub economy: i32,
    pub defense: i32,
}

impl ArchetypeMods {
    pub const fn new(military: i32, science: i32, economy: i32, defense: i32) -> Self {
        Self {
            military,
            science,
            economy,
            defense,
        }
    }

    pub const fn wojsko(self) -> i32 {
        self.military
    }

    pub const fn nauka(self) -> i32 {
        self.science
    }

    pub const fn ekonomia(self) -> i32 {
        self.economy
    }

    pub const fn obrona(self) -> i32 {
        self.defense
    }
}

/// Weights copied from the city-site heuristic in Spec-AI §3.3.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct CityScoreWeights {
    pub food: i32,
    pub work: i32,
    pub trade: i32,
    pub river: i32,
    pub resource: i32,
    pub enemy_penalty: i32,
}

impl Default for CityScoreWeights {
    fn default() -> Self {
        Self {
            food: DEFAULT_CITY_SCORE_FOOD,
            work: DEFAULT_CITY_SCORE_WORK,
            trade: DEFAULT_CITY_SCORE_TRADE,
            river: DEFAULT_CITY_SCORE_RIVER,
            resource: DEFAULT_CITY_SCORE_RESOURCE,
            enemy_penalty: DEFAULT_CITY_SCORE_ENEMY_PENALTY,
        }
    }
}

/// Optional knobs are explicit input, not hidden global AI state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AiTurnOptions {
    #[serde(default)]
    pub civ_type: Option<String>,
    #[serde(default)]
    pub archetype_mods: Option<ArchetypeMods>,
    #[serde(default)]
    pub city_buildings: BTreeMap<u64, BTreeSet<String>>,
    #[serde(default = "default_production_items")]
    pub production_items: Vec<ProductionItem>,
    #[serde(default = "default_min_city_distance")]
    pub min_city_distance: u32,
    #[serde(default = "default_threat_range")]
    pub threat_range: u32,
    #[serde(default)]
    pub require_village_for_founding: bool,
    /// When present, enemy units/cities outside this set are not targets.
    #[serde(default)]
    pub visible_hexes: Option<BTreeSet<HexCoord>>,
    #[serde(default)]
    pub city_score_weights: CityScoreWeights,
}

const fn default_min_city_distance() -> u32 {
    DEFAULT_MIN_CITY_DISTANCE
}

const fn default_threat_range() -> u32 {
    DEFAULT_THREAT_RANGE
}

fn default_production_items() -> Vec<ProductionItem> {
    vec![
        ProductionItem::building("Spichlerz"),
        ProductionItem::building("Koszary"),
        ProductionItem::building("Mury"),
        ProductionItem::building("Tartak"),
        ProductionItem::building("Cegielnia"),
        ProductionItem::building("Huta"),
        ProductionItem::building("Magazyn"),
        ProductionItem::building("Targowisko"),
        ProductionItem::unit("Osadnik", UnitKind::Settler),
        ProductionItem::unit("Wojownik", UnitKind::Warrior),
        ProductionItem::unit("Lucznik", UnitKind::Archer),
        ProductionItem::unit("Robotnik", UnitKind::Worker),
    ]
}

impl Default for AiTurnOptions {
    fn default() -> Self {
        Self {
            civ_type: None,
            archetype_mods: None,
            city_buildings: BTreeMap::new(),
            production_items: default_production_items(),
            min_city_distance: DEFAULT_MIN_CITY_DISTANCE,
            threat_range: DEFAULT_THREAT_RANGE,
            require_village_for_founding: false,
            visible_hexes: None,
            city_score_weights: CityScoreWeights::default(),
        }
    }
}

impl AiTurnOptions {
    pub fn without_production(mut self) -> Self {
        self.production_items.clear();
        self
    }

    pub fn resolved_archetype_mods(&self) -> ArchetypeMods {
        self.archetype_mods
            .unwrap_or_else(|| archetype_mods_for_civ(self.civ_type.as_deref()))
    }
}

/// Input contract for one pure planning call.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AiTurnInput {
    pub player_id: u64,
    pub units: Vec<AiUnit>,
    pub cities: Vec<AiCity>,
    pub map: AiMap,
    #[serde(default)]
    pub options: AiTurnOptions,
}

pub type AITurnInput = AiTurnInput;

impl AiTurnInput {
    pub fn new(player_id: u64, units: Vec<AiUnit>, cities: Vec<AiCity>, map: AiMap) -> Self {
        Self {
            player_id,
            units,
            cities,
            map,
            options: AiTurnOptions::default(),
        }
    }

    pub fn with_options(mut self, options: AiTurnOptions) -> Self {
        self.options = options;
        self
    }
}

/// Commands consumed by the engine executor.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AiCommand {
    #[serde(rename = "move")]
    Move {
        #[serde(rename = "unitId")]
        unit_id: u64,
        #[serde(rename = "toQ")]
        to_q: i32,
        #[serde(rename = "toR")]
        to_r: i32,
    },
    #[serde(rename = "foundCity")]
    FoundCity {
        #[serde(rename = "unitId")]
        unit_id: u64,
    },
    /// Compatibility command for executors that use the explicit current hex
    /// instead of resolving a settler id before founding.
    #[serde(rename = "foundCityAt")]
    FoundCityAt { q: i32, r: i32 },
    #[serde(rename = "attack")]
    Attack {
        #[serde(rename = "unitId")]
        unit_id: u64,
        #[serde(rename = "targetUnitId")]
        target_unit_id: u64,
    },
    #[serde(rename = "build")]
    Build {
        #[serde(rename = "cityId")]
        city_id: u64,
        #[serde(rename = "buildingId")]
        building_id: String,
    },
    #[serde(rename = "endTurn")]
    EndTurn,
}

pub type AICommand = AiCommand;

/// The output contract is intentionally a value object so callers can attach
/// diagnostics later without changing the command executor API.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct AiTurnPlan {
    pub commands: Vec<AiCommand>,
}

pub type AITurnPlan = AiTurnPlan;

impl AiTurnPlan {
    pub fn new(commands: Vec<AiCommand>) -> Self {
        Self { commands }
    }

    pub fn commands(&self) -> &[AiCommand] {
        &self.commands
    }

    pub fn into_commands(self) -> Vec<AiCommand> {
        self.commands
    }
}

/// Return the canonical archetype deltas.  Unknown civilization types follow
/// the documented Greek fallback instead of introducing random behaviour.
pub fn archetype_mods_for_civ(civ_type: Option<&str>) -> ArchetypeMods {
    let key = normalize(civ_type.unwrap_or("grecy"));
    match key.as_str() {
        "rzymianie" | "rzym" => ArchetypeMods::new(1, 0, 0, 0),
        "chinczycy" | "chiny" => ArchetypeMods::new(-1, 1, 1, 0),
        "zulusi" => ArchetypeMods::new(2, -1, -1, 0),
        "inkowie" => ArchetypeMods::new(0, 0, 0, 1),
        "egipt" => ArchetypeMods::new(0, 0, 1, 0),
        "babilon" | "sumer" | "sumerowie" => ArchetypeMods::new(-1, 2, 0, 0),
        // Current data contains additional roster entries without a distinct
        // v0.1 production profile; they intentionally use the Greek fallback.
        _ => ArchetypeMods::new(0, 1, 0, 0),
    }
}

/// Public helper matching the TypeScript helper's purpose.
pub fn read_archetype_mods(civ_type: Option<&str>) -> ArchetypeMods {
    archetype_mods_for_civ(civ_type)
}

/// Score a city site with the data-driven v0.1 heuristic.
pub fn hex_city_score(
    tile: &MapTile,
    position: HexCoord,
    enemy_cities: &[AiCity],
    weights: CityScoreWeights,
) -> i32 {
    let mut score = 0;
    if tile.food >= 3 {
        score += weights.food;
    }
    if tile.work >= 2 {
        score += weights.work;
    }
    if tile.trade >= 1 {
        score += weights.trade;
    }
    if tile.river {
        score += weights.river;
    }
    if tile.resource.is_some() {
        score += weights.resource;
    }
    if enemy_cities
        .iter()
        .any(|city| position.distance(city.position()) < DEFAULT_THREAT_RANGE)
    {
        score += weights.enemy_penalty;
    }
    score
}

pub fn score_city_site(tile: &MapTile, position: HexCoord, enemy_cities: &[AiCity]) -> i32 {
    hex_city_score(tile, position, enemy_cities, CityScoreWeights::default())
}

/// Find the highest-scoring reachable city site for a settler.
pub fn find_settler_target(
    settler: &AiUnit,
    map: &AiMap,
    own_cities: &[AiCity],
    enemy_cities: &[AiCity],
    options: &AiTurnOptions,
) -> Option<HexCoord> {
    let no_occupied_fields = BTreeSet::new();
    let mut best: Option<(i32, u32, HexCoord)> = None;
    for (coordinate, tile) in &map.tiles {
        if !tile.is_city_site()
            || (options.require_village_for_founding && !tile.village)
            || tile.owner_id.is_some_and(|owner| owner != settler.owner_id)
        {
            continue;
        }
        if own_cities
            .iter()
            .any(|city| coordinate.distance(city.position()) < options.min_city_distance)
        {
            continue;
        }
        if first_step_towards(
            map,
            settler.position(),
            *coordinate,
            no_occupied_fields.clone(),
        )
        .is_none()
        {
            continue;
        }
        let score = hex_city_score(tile, *coordinate, enemy_cities, options.city_score_weights);
        let distance = settler.position().distance(*coordinate);
        let candidate = (score, distance, *coordinate);
        let better = best
            .map(|current| {
                score > current.0
                    || (score == current.0 && distance < current.1)
                    || (score == current.0 && distance == current.1 && *coordinate < current.2)
            })
            .unwrap_or(true);
        if better {
            best = Some(candidate);
        }
    }
    best.map(|(_, _, coordinate)| coordinate)
}

/// Pick one production item for a city without mutating its queue.
pub fn choose_city_production(input: &AiTurnInput, city_id: u64) -> Option<String> {
    let city = input.cities.iter().find(|city| city.id == city_id)?;
    choose_city_production_for(input, city)
}

pub fn choose_production(input: &AiTurnInput, city_id: u64) -> Option<String> {
    choose_city_production(input, city_id)
}

fn choose_city_production_for(input: &AiTurnInput, city: &AiCity) -> Option<String> {
    if city.production_queue.is_some() || input.options.production_items.is_empty() {
        return None;
    }

    let own_cities: Vec<&AiCity> = input
        .cities
        .iter()
        .filter(|candidate| candidate.owner_id == input.player_id)
        .collect();
    let enemy_units: Vec<&AiUnit> = input
        .units
        .iter()
        .filter(|unit| unit.owner_id != input.player_id && visible(&input.options, unit.position()))
        .collect();
    // Threat is based on enemy units, matching the player-facing executor's
    // threat signal; a distant enemy city alone is a strategic target, not an
    // immediate production threat.
    let under_threat = enemy_units
        .iter()
        .any(|unit| city.position().distance(unit.position()) <= input.options.threat_range);
    let garrisoned = input.units.iter().any(|unit| {
        unit.owner_id == input.player_id
            && unit.kind.is_military()
            && unit.position().distance(city.position()) <= 1
    });
    let mods = input.options.resolved_archetype_mods();
    let early_phase = own_cities.len() < 3;
    let mut built = city.built_buildings.clone();
    if let Some(recorded_buildings) = input.options.city_buildings.get(&city.id) {
        built.extend(recorded_buildings.iter().cloned());
    }

    input
        .options
        .production_items
        .iter()
        .filter(|item| match item.kind {
            ProductionKind::Building => !built.contains(&item.id),
            ProductionKind::Unit(_) => true,
        })
        .filter_map(|item| {
            let score = production_score(
                item,
                early_phase,
                under_threat,
                garrisoned,
                own_cities.len(),
                mods,
            )?;
            Some((score, item.id.clone()))
        })
        .max_by(|(left_score, left_id), (right_score, right_id)| {
            left_score
                .cmp(right_score)
                .then_with(|| right_id.cmp(left_id))
        })
        .map(|(_, item_id)| item_id)
}

fn production_score(
    item: &ProductionItem,
    early_phase: bool,
    under_threat: bool,
    garrisoned: bool,
    city_count: usize,
    mods: ArchetypeMods,
) -> Option<i32> {
    let id = normalize(&item.id);
    let military = 100 + mods.military * 20;
    let defense = 100 + mods.defense * 20;
    let economy = 100 + mods.economy * 20;

    if under_threat {
        if is_wall(&id) {
            return Some(300 + defense);
        }
        if is_warrior(&id) {
            return Some(280 + military);
        }
        if is_archer(&id) || is_spearman(&id) {
            return Some(270 + military);
        }
        return match item.kind {
            ProductionKind::Unit(_) if item_is_military(&id) => Some(200 + military),
            _ => None,
        };
    }

    if is_granary(&id) && early_phase {
        return Some(250);
    }
    if is_settler_item(&id, &item.kind) {
        return Some(if early_phase && city_count < 3 {
            200
        } else {
            100
        });
    }
    if is_barracks(&id) && !early_phase {
        return Some(200 + military);
    }
    if is_warrior(&id) {
        return Some(if early_phase && !garrisoned {
            190 + military
        } else {
            170 + military
        });
    }
    if is_archer(&id) {
        return Some(if early_phase { 180 } else { 165 } + military);
    }
    if is_worker(&id) {
        return Some(160 + economy);
    }
    if is_economic_building(&id) {
        return Some(140 + economy);
    }
    if matches!(item.kind, ProductionKind::Unit(_)) {
        return Some(100 + military);
    }
    Some(50 + economy)
}

fn item_is_military(id: &str) -> bool {
    matches!(
        id,
        "wojownik" | "warrior" | "lucznik" | "archer" | "wlocznik" | "spearman" | "procarz"
    )
}

fn is_wall(id: &str) -> bool {
    matches!(id, "mury" | "mur" | "walls")
}

fn is_warrior(id: &str) -> bool {
    matches!(id, "wojownik" | "warrior")
}

fn is_archer(id: &str) -> bool {
    matches!(id, "lucznik" | "archer" | "procarz" | "slinger")
}

fn is_spearman(id: &str) -> bool {
    matches!(id, "wlocznik" | "spearman")
}

fn is_granary(id: &str) -> bool {
    matches!(id, "spichlerz" | "granary")
}

fn is_settler_item(id: &str, kind: &ProductionKind) -> bool {
    matches!(id, "osadnik" | "settler") || matches!(kind, ProductionKind::Unit(UnitKind::Settler))
}

fn is_barracks(id: &str) -> bool {
    matches!(id, "koszary" | "barracks")
}

fn is_worker(id: &str) -> bool {
    matches!(id, "robotnik" | "worker")
}

fn is_economic_building(id: &str) -> bool {
    matches!(
        id,
        "tartak" | "cegielnia" | "huta" | "magazyn" | "targowisko" | "sawmill" | "market"
    )
}

/// Plan a complete AI turn from an immutable snapshot.
pub fn plan_ai_turn(input: &AiTurnInput) -> AiTurnPlan {
    let mut commands = Vec::new();
    let mut cities: Vec<&AiCity> = input
        .cities
        .iter()
        .filter(|city| city.owner_id == input.player_id)
        .collect();
    cities.sort_by_key(|city| city.id);

    // Production is decided before movement, exactly as the TypeScript turn
    // contract specifies.  The city snapshot remains unchanged, so there is
    // never an accidental "one build consumes another city's budget" effect.
    for city in cities {
        if let Some(item_id) = choose_city_production_for(input, city) {
            commands.push(AiCommand::Build {
                city_id: city.id,
                building_id: item_id,
            });
        }
    }

    let mut units: Vec<&AiUnit> = input
        .units
        .iter()
        .filter(|unit| unit.owner_id == input.player_id)
        .collect();
    units.sort_by_key(|unit| (unit.kind.action_priority(), unit.id));

    for unit in units {
        if unit.movement_left == 0 || unit.embarked {
            continue;
        }
        if let Some(command) = plan_unit_action(input, unit) {
            commands.push(command);
        }
    }

    commands.push(AiCommand::EndTurn);
    AiTurnPlan::new(commands)
}

/// Compatibility name used by the TypeScript entry point; only the returned
/// value differs from `plan_ai_turn`, not the decisions.
pub fn decide_ai_turn(input: &AiTurnInput) -> Vec<AiCommand> {
    plan_ai_turn(input).into_commands()
}

pub fn plan_turn(input: &AiTurnInput) -> AiTurnPlan {
    plan_ai_turn(input)
}

pub fn decide_turn(input: &AiTurnInput) -> Vec<AiCommand> {
    decide_ai_turn(input)
}

fn plan_unit_action(input: &AiTurnInput, unit: &AiUnit) -> Option<AiCommand> {
    let own_cities: Vec<&AiCity> = input
        .cities
        .iter()
        .filter(|city| city.owner_id == input.player_id)
        .collect();
    let enemy_units: Vec<&AiUnit> = input
        .units
        .iter()
        .filter(|candidate| {
            candidate.owner_id != input.player_id && visible(&input.options, candidate.position())
        })
        .collect();
    let enemy_cities: Vec<&AiCity> = input
        .cities
        .iter()
        .filter(|candidate| {
            candidate.owner_id != input.player_id && visible(&input.options, candidate.position())
        })
        .collect();
    let occupied = occupied_without(input.units.as_slice(), unit.id);

    // A wounded unit retreats and never attacks in the same turn.
    if unit.health_fraction.is_some_and(|health| health < 0.30) {
        if let Some(home) =
            nearest_reachable_city(unit.position(), &own_cities, &input.map, &occupied)
        {
            if let Some(step) = first_step_towards(
                &input.map,
                unit.position(),
                home.position(),
                occupied.clone(),
            ) {
                return Some(AiCommand::Move {
                    unit_id: unit.id,
                    to_q: step.q,
                    to_r: step.r,
                });
            }
        }
        return None;
    }

    if unit.kind.is_settler() {
        if can_found_at(
            unit,
            unit.position(),
            &input.map,
            &own_cities,
            &input.options,
        ) {
            return Some(AiCommand::FoundCity { unit_id: unit.id });
        }
        let own_city_values: Vec<AiCity> = own_cities.into_iter().cloned().collect();
        let enemy_city_values: Vec<AiCity> = enemy_cities.into_iter().cloned().collect();
        let target = find_settler_target(
            unit,
            &input.map,
            &own_city_values,
            &enemy_city_values,
            &input.options,
        )?;
        return move_command_towards(input, unit, target);
    }

    // Scouts race for neutral villages and never enter the combat branch.
    if matches!(&unit.kind, UnitKind::Scout) {
        if let Some(village) = nearest_reachable_village(unit.position(), &input.map, &occupied) {
            return move_command_towards(input, unit, village);
        }
        return None;
    }

    // Workers and other civilian units do not issue combat orders.  Settlers
    // were handled above; custom `Other` kinds remain military by contract.
    if !unit.kind.is_military() {
        return None;
    }

    // Adjacent enemy units are always the first military decision.
    if let Some(enemy) = enemy_units
        .iter()
        .filter(|enemy| unit.position().is_adjacent(enemy.position()))
        .min_by_key(|enemy| enemy.id)
    {
        return Some(AiCommand::Attack {
            unit_id: unit.id,
            target_unit_id: enemy.id,
        });
    }

    // An adjacent enemy city is a move command; the engine resolves capture.
    if let Some(city) = enemy_cities
        .iter()
        .filter(|city| unit.position().is_adjacent(city.position()))
        .min_by_key(|city| city.id)
    {
        return move_command_towards(input, unit, city.position());
    }

    // Ranged units stay behind the melee line when an enemy city is close.
    // This mirrors the TypeScript planner's <=3-hex hold-back rule.
    if unit.kind.is_ranged() {
        if let Some(city) = nearest_city(unit.position(), &enemy_cities) {
            if unit.position().distance(city.position()) <= 3 {
                if let Some(home) =
                    nearest_reachable_city(unit.position(), &own_cities, &input.map, &occupied)
                {
                    if unit.position().distance(home.position()) > 2 {
                        if let Some(step) = first_step_towards(
                            &input.map,
                            unit.position(),
                            home.position(),
                            occupied.clone(),
                        ) {
                            return Some(AiCommand::Move {
                                unit_id: unit.id,
                                to_q: step.q,
                                to_r: step.r,
                            });
                        }
                    }
                }
                return None;
            }
        }
    }

    let nearest_city_target =
        nearest_reachable_city(unit.position(), &enemy_cities, &input.map, &occupied);
    let nearest_unit_target = enemy_units
        .iter()
        .filter(|enemy| {
            first_step_towards(
                &input.map,
                unit.position(),
                enemy.position(),
                occupied.clone(),
            )
            .is_some()
        })
        .min_by_key(|enemy| (unit.position().distance(enemy.position()), enemy.id));
    if let (Some(city), Some(enemy)) = (nearest_city_target, nearest_unit_target) {
        let unit_distance = unit.position().distance(enemy.position());
        let city_distance = unit.position().distance(city.position());
        if unit_distance < city_distance && unit_distance <= 3 {
            return move_command_towards(input, unit, enemy.position());
        }
        return move_command_towards(input, unit, city.position());
    }
    if let Some(city) = nearest_city_target {
        return move_command_towards(input, unit, city.position());
    }

    // With no hostile city, units explore the closest neutral village.
    if let Some(village) = nearest_reachable_village(unit.position(), &input.map, &occupied) {
        return move_command_towards(input, unit, village);
    }

    // Otherwise patrol back to the nearest own city if it is more than two
    // fields away.  Units already at home intentionally produce no command.
    if let Some(home) = nearest_reachable_city(unit.position(), &own_cities, &input.map, &occupied)
    {
        if unit.position().distance(home.position()) > 2 {
            return move_command_towards(input, unit, home.position());
        }
    }
    None
}

fn can_found_at(
    unit: &AiUnit,
    coordinate: HexCoord,
    map: &AiMap,
    own_cities: &[&AiCity],
    options: &AiTurnOptions,
) -> bool {
    let Some(tile) = map.tile(coordinate) else {
        return false;
    };
    if !tile.is_city_site()
        || (options.require_village_for_founding && !tile.village)
        || tile.owner_id.is_some_and(|owner| owner != unit.owner_id)
    {
        return false;
    }
    !own_cities
        .iter()
        .any(|city| coordinate.distance(city.position()) < options.min_city_distance)
}

fn move_command_towards(input: &AiTurnInput, unit: &AiUnit, target: HexCoord) -> Option<AiCommand> {
    let step = first_step_towards(
        &input.map,
        unit.position(),
        target,
        occupied_without(input.units.as_slice(), unit.id),
    )?;
    Some(AiCommand::Move {
        unit_id: unit.id,
        to_q: step.q,
        to_r: step.r,
    })
}

fn visible(options: &AiTurnOptions, coordinate: HexCoord) -> bool {
    options
        .visible_hexes
        .as_ref()
        .map(|visible_hexes| visible_hexes.contains(&coordinate))
        .unwrap_or(true)
}

fn occupied_without(units: &[AiUnit], excluded_id: u64) -> BTreeSet<HexCoord> {
    units
        .iter()
        .filter(|unit| unit.id != excluded_id)
        .map(AiUnit::position)
        .collect()
}

fn nearest_city<'a>(from: HexCoord, cities: &[&'a AiCity]) -> Option<&'a AiCity> {
    cities
        .iter()
        .min_by_key(|city| (from.distance(city.position()), city.id))
        .copied()
}

fn nearest_reachable_city<'a>(
    from: HexCoord,
    cities: &[&'a AiCity],
    map: &AiMap,
    occupied: &BTreeSet<HexCoord>,
) -> Option<&'a AiCity> {
    cities
        .iter()
        .filter(|city| first_step_towards(map, from, city.position(), occupied.clone()).is_some())
        .min_by_key(|city| (from.distance(city.position()), city.id))
        .copied()
}

fn nearest_reachable_village(
    from: HexCoord,
    map: &AiMap,
    occupied: &BTreeSet<HexCoord>,
) -> Option<HexCoord> {
    map.tiles
        .iter()
        .filter(|(_, tile)| tile.village && tile.owner_id.is_none())
        .filter(|(coordinate, _)| {
            first_step_towards(map, from, **coordinate, occupied.clone()).is_some()
        })
        .min_by_key(|(coordinate, _)| (from.distance(**coordinate), **coordinate))
        .map(|(coordinate, _)| *coordinate)
}

/// Deterministic Dijkstra first-step planner.  The destination may be an
/// occupied field (attack/capture handoff); occupied intermediate fields and
/// impassable terrain are blocked.  Queue ties are ordered by coordinate after
/// accumulated cost, so equal-cost paths have a stable result.
fn first_step_towards(
    map: &AiMap,
    start: HexCoord,
    destination: HexCoord,
    occupied: BTreeSet<HexCoord>,
) -> Option<HexCoord> {
    if start == destination {
        return None;
    }
    if map.tile(destination).is_none() || map.tile(start).is_none() {
        return None;
    }

    let mut queue: BinaryHeap<Reverse<(u32, HexCoord)>> = BinaryHeap::new();
    let mut distance: BTreeMap<HexCoord, u32> = BTreeMap::new();
    let mut previous: BTreeMap<HexCoord, Option<HexCoord>> = BTreeMap::new();
    queue.push(Reverse((0, start)));
    distance.insert(start, 0);
    previous.insert(start, None);

    while let Some(Reverse((cost, current))) = queue.pop() {
        if distance.get(&current).copied() != Some(cost) {
            continue;
        }
        if current == destination {
            return reconstruct_first_step(start, destination, &previous);
        }

        for neighbour in current.neighbours() {
            let Some(tile) = map.tile(neighbour) else {
                continue;
            };
            let entry_cost = match tile.terrain.movement_cost() {
                Some(cost) => cost,
                // The executor permits an occupied or impassable destination as
                // the final attack/capture handoff, matching the player pathfinder.
                None if neighbour == destination => 1,
                None => continue,
            };
            if neighbour != destination && occupied.contains(&neighbour) {
                continue;
            }
            let Some(next_cost) = cost.checked_add(entry_cost) else {
                continue;
            };
            let improves = distance
                .get(&neighbour)
                .map(|known_cost| next_cost < *known_cost)
                .unwrap_or(true);
            if improves {
                distance.insert(neighbour, next_cost);
                previous.insert(neighbour, Some(current));
                queue.push(Reverse((next_cost, neighbour)));
            }
        }
    }
    None
}

fn reconstruct_first_step(
    start: HexCoord,
    destination: HexCoord,
    previous: &BTreeMap<HexCoord, Option<HexCoord>>,
) -> Option<HexCoord> {
    let mut current = destination;
    loop {
        let predecessor = previous.get(&current).copied().flatten()?;
        if predecessor == start {
            return Some(current);
        }
        current = predecessor;
    }
}

fn normalize(value: &str) -> String {
    value
        .trim()
        .to_lowercase()
        .chars()
        .map(|character| match character {
            'ą' => 'a',
            'ć' => 'c',
            'ę' => 'e',
            'ł' => 'l',
            'ń' => 'n',
            'ó' => 'o',
            'ś' => 's',
            'ź' | 'ż' => 'z',
            other => other,
        })
        .collect()
}
