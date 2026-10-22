//! Deterministic movement costs, field qualification, and hex pathfinding.
//!
//! The module is deliberately pure.  The caller supplies a map snapshot and
//! occupied coordinates; no game state, RNG, or rendering state is consulted.
//! Costs use fixed-point units (`SCALE = 15`) so road multipliers remain exact
//! without making route selection depend on floating-point rounding.

use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet, BinaryHeap};

/// Fixed-point movement cost denominator.
pub const COST_SCALE: u32 = 15;

/// Axial pointy-top coordinate.  `s` is derived as `-q-r`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
}

pub type Hex = HexCoord;

impl HexCoord {
    pub const DIRECTIONS: [Self; 6] = [
        Self { q: 1, r: 0 },
        Self { q: 1, r: -1 },
        Self { q: 0, r: -1 },
        Self { q: -1, r: 0 },
        Self { q: -1, r: 1 },
        Self { q: 0, r: 1 },
    ];

    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }

    pub const fn distance(self, other: Self) -> u32 {
        let dq = (self.q - other.q).unsigned_abs();
        let dr = (self.r - other.r).unsigned_abs();
        let ds = ((-self.q - self.r) - (-other.q - other.r)).unsigned_abs();
        let max_dq_dr = if dq > dr { dq } else { dr };
        if max_dq_dr > ds {
            max_dq_dr
        } else {
            ds
        }
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

/// Base terrain labels used by the map and movement rules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerrainType {
    Grassland,
    Plains,
    Hills,
    Mountains,
    ShallowWater,
    Ocean,
    Desert,
    Tundra,
}

pub type Terrain = TerrainType;

#[allow(non_upper_case_globals)]
impl TerrainType {
    pub const Laka: Self = Self::Grassland;
    pub const Rownina: Self = Self::Plains;
    pub const Wzgorza: Self = Self::Hills;
    pub const Gory: Self = Self::Mountains;
    pub const PlytkieMorze: Self = Self::ShallowWater;
    pub const Morze: Self = Self::Ocean;
    pub const Pustynia: Self = Self::Desert;
    pub const Polarny: Self = Self::Tundra;

    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    pub const fn is_land(self) -> bool {
        !self.is_water()
    }

    /// Whether a city may work this field.  This is intentionally not the
    /// movement predicate: shallow water is workable, while mountains/ocean
    /// are not.
    pub const fn is_workable(self) -> bool {
        !matches!(self, Self::Mountains | Self::Ocean)
    }

    /// Ordinary land-unit traversal.  Tundra is land but not passable in the
    /// current movement contract.
    pub const fn is_passable(self) -> bool {
        matches!(
            self,
            Self::Grassland | Self::Plains | Self::Hills | Self::Desert
        )
    }

    pub const fn can_found_city(self) -> bool {
        self.is_land() && !matches!(self, Self::Mountains)
    }
}

/// Terrain improvements that affect entry cost.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum Improvement {
    #[default]
    None,
    Road,
    PavedRoad,
}

#[allow(non_upper_case_globals)]
impl Improvement {
    pub const Brak: Self = Self::None;
    pub const Droga: Self = Self::Road;
    pub const DrogaBrukowana: Self = Self::PavedRoad;
}

/// Minimal immutable map-field snapshot needed by traversal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tile {
    pub terrain: TerrainType,
    #[serde(default)]
    pub forest: bool,
    #[serde(default)]
    pub river: bool,
    #[serde(default)]
    pub improvement: Improvement,
}

impl Tile {
    pub const fn new(terrain: TerrainType) -> Self {
        Self {
            terrain,
            forest: false,
            river: false,
            improvement: Improvement::None,
        }
    }

    pub const fn with_forest(mut self, forest: bool) -> Self {
        self.forest = forest;
        self
    }

    pub const fn with_river(mut self, river: bool) -> Self {
        self.river = river;
        self
    }

    pub const fn with_improvement(mut self, improvement: Improvement) -> Self {
        self.improvement = improvement;
        self
    }
}

/// Sparse map keyed by axial coordinates.  A missing tile is not traversable.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct PathMap {
    pub tiles: BTreeMap<HexCoord, Tile>,
}

pub type Map = PathMap;

impl PathMap {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&mut self, coordinate: HexCoord, tile: Tile) -> Option<Tile> {
        self.tiles.insert(coordinate, tile)
    }

    pub fn tile(&self, coordinate: HexCoord) -> Option<&Tile> {
        self.tiles.get(&coordinate)
    }

    pub fn from_tiles<I>(tiles: I) -> Self
    where
        I: IntoIterator<Item = (HexCoord, Tile)>,
    {
        Self {
            tiles: tiles.into_iter().collect(),
        }
    }
}

/// One movement cost in fixed-point units.  One ordinary point is 15 raw
/// units; roads therefore cost exactly one third and paved roads one fifth.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct MovementCost(u32);

impl MovementCost {
    pub const fn from_whole(points: u32) -> Self {
        Self(points * COST_SCALE)
    }

    pub const fn raw(self) -> u32 {
        self.0
    }

    pub const fn as_f64(self) -> f64 {
        self.0 as f64 / COST_SCALE as f64
    }
}

impl PartialEq<u32> for MovementCost {
    fn eq(&self, other: &u32) -> bool {
        self.0 == other.saturating_mul(COST_SCALE)
    }
}

/// Data-driven movement overrides.  Defaults mirror `terrain-movement.json`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MovementRules {
    pub grassland: Option<u32>,
    pub plains: Option<u32>,
    pub desert: Option<u32>,
    pub hills: Option<u32>,
    pub forest_extra: u32,
    pub river_cost: u32,
    pub road_divisor: u32,
    pub paved_road_divisor: u32,
}

impl Default for MovementRules {
    fn default() -> Self {
        Self {
            grassland: Some(1),
            plains: Some(1),
            desert: Some(2),
            hills: Some(2),
            forest_extra: 1,
            river_cost: 1,
            // P3-23 (RUCH 35i): dzielniki z data/derived/road-movement-multipliers.json.
            road_divisor: crate::data::derived::road_movement_divisor("ROAD_MOVE_SPEED_MULT"),
            paved_road_divisor: crate::data::derived::road_movement_divisor(
                "ROAD_BRUK_MOVE_SPEED_MULT",
            ),
        }
    }
}

impl MovementRules {
    pub fn base_cost(&self, terrain: TerrainType) -> Option<u32> {
        match terrain {
            TerrainType::Grassland => self.grassland,
            TerrainType::Plains => self.plains,
            TerrainType::Desert => self.desert,
            TerrainType::Hills => self.hills,
            TerrainType::Mountains
            | TerrainType::ShallowWater
            | TerrainType::Ocean
            | TerrainType::Tundra => None,
        }
    }
}

/// Base entry cost before overlays and improvements.
pub fn terrain_movement_cost(terrain: TerrainType) -> Option<u32> {
    MovementRules::default().base_cost(terrain)
}

/// Default cost to enter a tile.  `None` means the tile is impassable.
pub fn movement_cost(tile: &Tile) -> Option<MovementCost> {
    movement_cost_with_rules(tile, &MovementRules::default())
}

pub fn movement_cost_with_rules(tile: &Tile, rules: &MovementRules) -> Option<MovementCost> {
    let base = rules.base_cost(tile.terrain)?;

    // Rivers flatten the land entry cost and ignore forest/hills modifiers,
    // matching the map movement contract.
    let whole = if tile.river {
        rules.river_cost
    } else {
        base.saturating_add(if tile.forest { rules.forest_extra } else { 0 })
    };

    let divisor = match tile.improvement {
        Improvement::None => 1,
        Improvement::Road => rules.road_divisor.max(1),
        Improvement::PavedRoad => rules.paved_road_divisor.max(1),
    };
    let raw = whole.saturating_mul(COST_SCALE);
    Some(MovementCost((raw / divisor).max(1)))
}

/// Qualification facts are kept separate so callers do not confuse city
/// workability with movement passability.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FieldQualification {
    pub workable: bool,
    pub passable: bool,
    pub city_site: bool,
}

pub type TileQualification = FieldQualification;

pub fn qualify_field(terrain: TerrainType) -> FieldQualification {
    FieldQualification {
        workable: terrain.is_workable(),
        passable: terrain.is_passable(),
        city_site: terrain.can_found_city(),
    }
}

pub fn field_qualification(terrain: TerrainType) -> FieldQualification {
    qualify_field(terrain)
}

pub fn qualify_tile(tile: &Tile) -> FieldQualification {
    let mut qualification = qualify_field(tile.terrain);
    qualification.passable = movement_cost(tile).is_some();
    qualification
}

pub const fn is_passable(terrain: TerrainType) -> bool {
    terrain.is_passable()
}

pub const fn is_workable(terrain: TerrainType) -> bool {
    terrain.is_workable()
}

pub const fn is_passable_terrain(terrain: TerrainType) -> bool {
    is_passable(terrain)
}

pub const fn is_workable_terrain(terrain: TerrainType) -> bool {
    is_workable(terrain)
}

/// A path excludes the origin and includes the destination.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PathResult {
    pub steps: Vec<HexCoord>,
    pub total_cost: MovementCost,
}

#[derive(Debug, Clone, Eq, PartialEq)]
struct SearchState {
    cost: MovementCost,
    coordinate: HexCoord,
    path: Vec<HexCoord>,
}

// BinaryHeap is a max-heap; reverse every ordering so the smallest cost and
// then lexicographically smallest complete path is expanded first.
impl Ord for SearchState {
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .cost
            .cmp(&self.cost)
            .then_with(|| other.path.cmp(&self.path))
            .then_with(|| other.coordinate.cmp(&self.coordinate))
    }
}

impl PartialOrd for SearchState {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Least-cost deterministic path.  An occupied destination is allowed as the
/// final step (for an attack/stack handoff), but occupied intermediate tiles
/// are blocked.  An impassable destination is also allowed as that final step
/// with the canonical fallback cost of one movement point.
pub fn find_path(
    map: &PathMap,
    start: HexCoord,
    destination: HexCoord,
    occupied: &BTreeSet<HexCoord>,
) -> Option<Vec<HexCoord>> {
    find_path_with_rules(map, start, destination, occupied, &MovementRules::default())
        .map(|result| result.steps)
}

pub fn find_path_with_rules(
    map: &PathMap,
    start: HexCoord,
    destination: HexCoord,
    occupied: &BTreeSet<HexCoord>,
    rules: &MovementRules,
) -> Option<PathResult> {
    if start == destination {
        return Some(PathResult {
            steps: Vec::new(),
            total_cost: MovementCost(0),
        });
    }
    if map.tile(start).is_none() || map.tile(destination).is_none() {
        return None;
    }
    let mut heap = BinaryHeap::new();
    let mut best: BTreeMap<HexCoord, (MovementCost, Vec<HexCoord>)> = BTreeMap::new();
    let initial = SearchState {
        cost: MovementCost(0),
        coordinate: start,
        path: Vec::new(),
    };
    best.insert(start, (initial.cost, initial.path.clone()));
    heap.push(initial);

    while let Some(state) = heap.pop() {
        let Some((best_cost, best_path)) = best.get(&state.coordinate) else {
            continue;
        };
        if state.cost != *best_cost || state.path != *best_path {
            continue;
        }
        if state.coordinate == destination {
            return Some(PathResult {
                steps: state.path,
                total_cost: state.cost,
            });
        }

        for neighbour in state.coordinate.neighbours() {
            let Some(tile) = map.tile(neighbour) else {
                continue;
            };
            if neighbour != destination && occupied.contains(&neighbour) {
                continue;
            }
            let step_cost = if neighbour == destination {
                movement_cost_with_rules(tile, rules).unwrap_or_else(|| MovementCost::from_whole(1))
            } else {
                let Some(step_cost) = movement_cost_with_rules(tile, rules) else {
                    continue;
                };
                step_cost
            };
            let new_cost = MovementCost(state.cost.raw().saturating_add(step_cost.raw()));
            let mut new_path = state.path.clone();
            new_path.push(neighbour);
            let better = best
                .get(&neighbour)
                .map(|(old_cost, old_path)| {
                    new_cost < *old_cost || (new_cost == *old_cost && new_path < *old_path)
                })
                .unwrap_or(true);
            if better {
                best.insert(neighbour, (new_cost, new_path.clone()));
                heap.push(SearchState {
                    cost: new_cost,
                    coordinate: neighbour,
                    path: new_path,
                });
            }
        }
    }

    None
}

/// Sum the entry costs of an already selected path.  Missing or impassable
/// fields return `None` instead of silently producing a misleading total.
pub fn path_cost(map: &PathMap, path: &[HexCoord]) -> Option<MovementCost> {
    path_cost_with_rules(map, path, &MovementRules::default())
}

pub fn path_cost_with_rules(
    map: &PathMap,
    path: &[HexCoord],
    rules: &MovementRules,
) -> Option<MovementCost> {
    let mut total = 0u32;
    for coordinate in path {
        let tile = map.tile(*coordinate)?;
        total = total.checked_add(movement_cost_with_rules(tile, rules)?.raw())?;
    }
    Some(MovementCost(total))
}

/// All reachable fields within a fixed-point movement budget.
pub fn reachable(
    map: &PathMap,
    start: HexCoord,
    budget: MovementCost,
    occupied: &BTreeSet<HexCoord>,
) -> BTreeSet<HexCoord> {
    reachable_with_rules(map, start, budget, occupied, &MovementRules::default())
}

pub fn reachable_with_rules(
    map: &PathMap,
    start: HexCoord,
    budget: MovementCost,
    occupied: &BTreeSet<HexCoord>,
    rules: &MovementRules,
) -> BTreeSet<HexCoord> {
    let mut result = BTreeSet::new();
    let mut frontier = BinaryHeap::new();
    let mut best = BTreeMap::new();
    if map.tile(start).is_none() {
        return result;
    }
    best.insert(start, MovementCost(0));
    frontier.push((std::cmp::Reverse(MovementCost(0)), start));

    while let Some((std::cmp::Reverse(cost), coordinate)) = frontier.pop() {
        if cost != *best.get(&coordinate).unwrap_or(&MovementCost(u32::MAX)) {
            continue;
        }
        for neighbour in coordinate.neighbours() {
            if occupied.contains(&neighbour) {
                continue;
            }
            let Some(tile) = map.tile(neighbour) else {
                continue;
            };
            let Some(step) = movement_cost_with_rules(tile, rules) else {
                continue;
            };
            let new_cost = MovementCost(cost.raw().saturating_add(step.raw()));
            if new_cost > budget {
                continue;
            }
            if best
                .get(&neighbour)
                .map(|old| new_cost >= *old)
                .unwrap_or(false)
            {
                continue;
            }
            best.insert(neighbour, new_cost);
            result.insert(neighbour);
            frontier.push((std::cmp::Reverse(new_cost), neighbour));
        }
    }
    // MIN-MOVE: with at least one whole movement point, every direct,
    // passable, unoccupied neighbour is reachable even when its full entry
    // cost exceeds the remaining budget.  This mirrors the canonical TS
    // movement contract while keeping impassable fields excluded.
    if budget >= MovementCost::from_whole(1) {
        for neighbour in start.neighbours() {
            if occupied.contains(&neighbour) {
                continue;
            }
            let Some(tile) = map.tile(neighbour) else {
                continue;
            };
            if movement_cost_with_rules(tile, rules).is_some() {
                result.insert(neighbour);
            }
        }
    }

    result.remove(&start);
    result
}

// ---------------------------------------------------------------------------
// P6.3 (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1): port `gra/src/game/city-hex-movement.ts`.
// Reguly zajmowania heksu miasta (garnizon vs obcy). Lista budynkow obronnych blokujacych
// wejscie AI jest w `data/derived/teren-ruch-reguly.json`; kod nie zawiera jej literalow.
// ---------------------------------------------------------------------------

/// Web `CityHexRef` (`city-hex-movement.ts:9`): `q`, `r`, `ownerId` oraz opcjonalne `maMur`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CityHexRef {
    pub q: i32,
    pub r: i32,
    pub owner_id: i64,
    pub ma_mur: Option<bool>,
}

/// Web `cityAtHex` (`city-hex-movement.ts:11`): pierwsze miasto na heksie `(q, r)`.
pub fn city_at_hex(q: i32, r: i32, cities: &[CityHexRef]) -> Option<&CityHexRef> {
    cities.iter().find(|city| city.q == q && city.r == r)
}

/// Web `canUnitOccupyCityHex` (`city-hex-movement.ts:23`): heks miasta obcego wlasciciela jest
/// zablokowany (tylko zdobycie z sasiedztwa).
pub fn can_unit_occupy_city_hex(unit_owner_id: i64, q: i32, r: i32, cities: &[CityHexRef]) -> bool {
    city_at_hex(q, r, cities).is_none_or(|city| city.owner_id == unit_owner_id)
}

/// Web `canAiEnterEmptyEnemyCity` (`city-hex-movement.ts:48`): zwykle AI wchodzi na obce miasto
/// tylko z sasiedniego heksu, bez obroncow, bez muru i fortyfikacji; jednostka cywilna nigdy.
pub fn can_ai_enter_empty_enemy_city(
    unit_owner_id: i64,
    unit_q: i32,
    unit_r: i32,
    city: &CityHexRef,
    city_built_ids: &[String],
    has_defenders: bool,
    unit_is_civilian: bool,
) -> bool {
    if city.owner_id == unit_owner_id {
        return false;
    }
    if unit_is_civilian {
        return false;
    }
    if HexCoord::new(unit_q, unit_r).distance(HexCoord::new(city.q, city.r)) != 1 {
        return false;
    }
    if has_defenders {
        return false;
    }
    if city.ma_mur == Some(true) {
        return false;
    }
    let defensive = &crate::data::derived::teren_ruch_reguly()
        .miasto_obce
        .budynki_obronne;
    !city_built_ids.iter().any(|id| defensive.contains(id))
}

/// Web `foreignCityHexKeys` (`city-hex-movement.ts:66`): klucze `"q,r"` heksow miast, ktorych
/// wlascicielem NIE jest dana frakcja.
pub fn foreign_city_hex_keys(unit_owner_id: i64, cities: &[CityHexRef]) -> BTreeSet<String> {
    cities
        .iter()
        .filter(|city| city.owner_id != unit_owner_id)
        .map(|city| HexCoord::new(city.q, city.r).key())
        .collect()
}

/// Web `addForeignCityBlocks` (`city-hex-movement.ts:77`): `occupied` + heksy obcych miast.
pub fn add_foreign_city_blocks(
    occupied: &BTreeSet<String>,
    unit_owner_id: i64,
    cities: &[CityHexRef],
) -> BTreeSet<String> {
    let mut out = occupied.clone();
    out.extend(foreign_city_hex_keys(unit_owner_id, cities));
    out
}

/// Wariant `add_foreign_city_blocks` na wspolrzednych, czytany przez `find_path` / `reachable`
/// (parametr `occupied`): obce miasta sa nieprzechodnie dla jednostek frakcji `unit_owner_id`.
pub fn add_foreign_city_block_coords(
    occupied: &BTreeSet<HexCoord>,
    unit_owner_id: i64,
    cities: &[CityHexRef],
) -> BTreeSet<HexCoord> {
    let mut out = occupied.clone();
    out.extend(
        cities
            .iter()
            .filter(|city| city.owner_id != unit_owner_id)
            .map(|city| HexCoord::new(city.q, city.r)),
    );
    out
}

// ---------------------------------------------------------------------------
// P6.4 (R-RUSTPORT-P6-4-JEDNOSTKI-RUCH-Q1): port 1:1 `embarkation.ts`, `planned-march.ts`,
// `rally-point.ts`, `scout-auto-explore.ts` (pin `edb8fb56`) wraz z zaleznosciami potrzebnymi do
// ich uruchomienia: `units/setup.ts` (terrainMoveCost, computePath, computeReachable, pathCost,
// hexDistance, keyOf), `game/visibility.ts` (computeVisibleAt, addExplored) i
// `game/armyMerge.ts` (stackGroupIdOf).
//
// Model web (zmiennoprzecinkowy, `Infinity` = nieprzejezdny) jest odwzorowany osobno od
// stalo-przecinkowego pathfindera P3 powyzej: wektory z uruchomionego weba wymagaja IDENTYCZNEJ
// kolejnosci przeszukiwania (kopiec binarny z `setup.ts`), identycznych sum `f64` i identycznej
// kolejnosci wstawiania do zbiorow (`Set` JS). Stale, mnozniki i teksty: `data/derived/
// ruch-jednostek-params.json`, `data/terrain-movement.json`, `data/derived/
// road-movement-multipliers.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub mod ruch_jednostek {
    use std::collections::{BTreeMap, HashMap, HashSet};
    use std::sync::OnceLock;

    use crate::data::derived::{road_movement_value, ruch_jednostek_params};
    use crate::data::terrain_map::{parse_terrain_movement, TerrainMovementFile};
    use crate::domain::civ_bonuses::{civ_movement_multiplier, CivBonusEntry, CivBonusUnitShape};
    use crate::domain::improvements::{improvement_keys_for_hex, HexLike};

    /// Klucz heksa `(q, r)`; web: napis `"q,r"` (`keyOf`, `setup.ts:346`).
    pub type Klucz = (i32, i32);

    /// Funkcja kosztu wejscia na heks (web `MarchCostFn` / `costFn`).
    pub type CostFn<'a> = dyn Fn(&RuchHex) -> f64 + 'a;

    /// Funkcja kosztu zwracana przez `move_cost_fn_for` (web: closure).
    pub type BoxedCostFn<'a> = Box<dyn Fn(&RuchHex) -> f64 + 'a>;

    /// Web `keyOf` (`setup.ts:346`).
    pub fn key_of(q: i32, r: i32) -> String {
        format!("{q},{r}")
    }

    /// Klucz calkowity z pary liczb weba; `None` dla liczb niecalkowitych / nieskonczonych (taki
    /// klucz `"1.5,2"` nie istnieje w `map.hexes`).
    pub fn int_key(q: f64, r: f64) -> Option<Klucz> {
        let ok = |x: f64| x.is_finite() && x.fract() == 0.0 && x.abs() <= f64::from(i32::MAX);
        if ok(q) && ok(r) {
            Some((q as i32, r as i32))
        } else {
            None
        }
    }

    /// Web `Math.max(a, b)`: `NaN` jesli ktorykolwiek argument to `NaN`.
    fn js_max(a: f64, b: f64) -> f64 {
        if a.is_nan() || b.is_nan() {
            f64::NAN
        } else {
            a.max(b)
        }
    }

    // -----------------------------------------------------------------------
    // Model danych (podzbior `Hex` / `GameMap` / `RuntimeUnit` czytany przez te funkcje)
    // -----------------------------------------------------------------------

    /// Web `TerenBazowy` (`types/hex.ts:12`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub enum TerenBazowy {
        Laka,
        Rownina,
        Wzgorza,
        Gory,
        PlytkieMorze,
        Morze,
        Pustynia,
        Polarny,
    }

    impl TerenBazowy {
        /// Wartosc tekstowa weba (`'laka'`, ..., `'polarny'`).
        pub fn web_value(self) -> &'static str {
            match self {
                Self::Laka => "laka",
                Self::Rownina => "rownina",
                Self::Wzgorza => "wzgorza",
                Self::Gory => "gory",
                Self::PlytkieMorze => "plytkie_morze",
                Self::Morze => "morze",
                Self::Pustynia => "pustynia",
                Self::Polarny => "polarny",
            }
        }

        pub fn from_web(value: &str) -> Option<Self> {
            [
                Self::Laka,
                Self::Rownina,
                Self::Wzgorza,
                Self::Gory,
                Self::PlytkieMorze,
                Self::Morze,
                Self::Pustynia,
                Self::Polarny,
            ]
            .into_iter()
            .find(|terrain| terrain.web_value() == value)
        }
    }

    /// Web `isWaterTerrain` (`setup.ts:678`).
    pub fn is_water_terrain(terrain: TerenBazowy) -> bool {
        terrain == TerenBazowy::Morze || terrain == TerenBazowy::PlytkieMorze
    }

    /// Podzbior web `Hex` czytany przez ruch: teren, las (`nakladka === Las`), rzeka, warstwy
    /// ulepszen, wioska (`wioska.istnieje`) i flaga `wlasciciel !== null`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct RuchHex {
        pub teren: TerenBazowy,
        pub las: bool,
        pub rzeka: bool,
        pub ulepszenie: Option<String>,
        pub ulepszenia: Option<Vec<String>>,
        pub wioska: bool,
        pub ma_wlasciciela: bool,
    }

    impl RuchHex {
        pub fn new(teren: TerenBazowy) -> Self {
            Self {
                teren,
                las: false,
                rzeka: false,
                ulepszenie: None,
                ulepszenia: None,
                wioska: false,
                ma_wlasciciela: false,
            }
        }
    }

    /// Podzbior web `GameMap`: `hexes` po kluczu `"q,r"`.
    #[derive(Debug, Clone, Default, PartialEq)]
    pub struct RuchMapa {
        pub hexes: BTreeMap<Klucz, RuchHex>,
    }

    impl RuchMapa {
        pub fn new() -> Self {
            Self::default()
        }

        pub fn insert(&mut self, key: Klucz, hex: RuchHex) {
            self.hexes.insert(key, hex);
        }

        pub fn get(&self, key: Klucz) -> Option<&RuchHex> {
            self.hexes.get(&key)
        }

        pub fn contains(&self, key: Klucz) -> bool {
            self.hexes.contains_key(&key)
        }
    }

    /// Podzbior web `RuntimeUnit` (`setup.ts:40`) czytany przez te cztery pliki.
    #[derive(Debug, Clone, PartialEq)]
    pub struct RuchJednostka {
        pub id: String,
        pub owner_id: i64,
        pub type_id: Option<String>,
        pub category: String,
        pub q: i32,
        pub r: i32,
        pub ruch: f64,
        pub ruch_left: f64,
        pub in_garnizon: bool,
        /// Web `embarked?: boolean` (`None` = pole nieobecne).
        pub embarked: Option<bool>,
        /// Web `oblegaCityId?: string` (pusty napis = falsy).
        pub oblega_city_id: Option<String>,
        pub auto_explore: Option<bool>,
        pub sentry: Option<bool>,
        /// Web `stackGroupId?: string` (pusty napis = falsy).
        pub stack_group_id: Option<String>,
    }

    impl RuchJednostka {
        pub fn new(id: &str, owner_id: i64, category: &str, q: i32, r: i32) -> Self {
            Self {
                id: id.to_owned(),
                owner_id,
                type_id: None,
                category: category.to_owned(),
                q,
                r,
                ruch: 0.0,
                ruch_left: 0.0,
                in_garnizon: false,
                embarked: None,
                oblega_city_id: None,
                auto_explore: None,
                sentry: None,
                stack_group_id: None,
            }
        }
    }

    /// Zbior kluczy heksow z zachowaniem kolejnosci wstawiania (web `Set<string>`).
    #[derive(Debug, Clone, Default, PartialEq, Eq)]
    pub struct OrderedHexSet {
        order: Vec<Klucz>,
        set: HashSet<Klucz>,
    }

    impl OrderedHexSet {
        pub fn new() -> Self {
            Self::default()
        }

        pub fn from_keys<I: IntoIterator<Item = Klucz>>(keys: I) -> Self {
            let mut out = Self::new();
            for key in keys {
                out.insert(key);
            }
            out
        }

        /// `Set.add`: ponowne dodanie nie zmienia pozycji.
        pub fn insert(&mut self, key: Klucz) {
            if self.set.insert(key) {
                self.order.push(key);
            }
        }

        /// `Set.delete`.
        pub fn remove(&mut self, key: Klucz) -> bool {
            if self.set.remove(&key) {
                self.order.retain(|existing| *existing != key);
                true
            } else {
                false
            }
        }

        pub fn contains(&self, key: Klucz) -> bool {
            self.set.contains(&key)
        }

        pub fn len(&self) -> usize {
            self.order.len()
        }

        pub fn is_empty(&self) -> bool {
            self.order.is_empty()
        }

        pub fn iter(&self) -> impl Iterator<Item = Klucz> + '_ {
            self.order.iter().copied()
        }

        pub fn to_vec(&self) -> Vec<Klucz> {
            self.order.clone()
        }
    }

    // -----------------------------------------------------------------------
    // setup.ts - koszt ruchu, hexDistance, computeReachable, computePath, pathCost
    // -----------------------------------------------------------------------

    struct TerenKoszty {
        by_terrain: HashMap<TerenBazowy, f64>,
        forest_extra: f64,
    }

    fn terrain_costs() -> &'static TerenKoszty {
        static COSTS: OnceLock<TerenKoszty> = OnceLock::new();
        COSTS.get_or_init(|| {
            let file: TerrainMovementFile =
                parse_terrain_movement().expect("terrain-movement.json must parse");
            let threshold = ruch_jednostek_params().teren.prog_nieprzejezdny;
            // Web `configureTerrainMovement` (`setup.ts:446`): wartosc >= prog to Infinity.
            let cost = |value: i64| {
                let value = value as f64;
                if value >= threshold {
                    f64::INFINITY
                } else {
                    value
                }
            };
            let c = &file.costs;
            let by_terrain = HashMap::from([
                (TerenBazowy::Laka, cost(c.laka)),
                (TerenBazowy::Rownina, cost(c.rownina)),
                (TerenBazowy::Pustynia, cost(c.pustynia)),
                (TerenBazowy::PlytkieMorze, cost(c.wybrzeze)),
                (TerenBazowy::Wzgorza, cost(c.wzgorza)),
                (TerenBazowy::Gory, cost(c.gory)),
                (TerenBazowy::Morze, cost(c.morze)),
                (TerenBazowy::Polarny, cost(c.polarny)),
            ]);
            TerenKoszty {
                by_terrain,
                forest_extra: cost(file.forest_extra),
            }
        })
    }

    /// Web `applyRoadMovementModifier` (`map/road-movement.ts:73`).
    pub fn apply_road_movement_modifier(cost: f64, hex: &RuchHex) -> f64 {
        if cost == f64::INFINITY {
            return f64::INFINITY;
        }
        let names = &ruch_jednostek_params().teren;
        let keys = improvement_keys_for_hex(&HexLike {
            ulepszenie: hex.ulepszenie.clone(),
            ulepszenia: hex.ulepszenia.clone(),
            nakladka: None,
            zloze: None,
        });
        let has = |name: &str| {
            keys.iter().any(|key| key == name) || hex.ulepszenie.as_deref() == Some(name)
        };
        if has(&names.ulepszenie_droga_brukowana) {
            return js_max(
                road_movement_value("ROAD_BRUK_MIN_MOVE_COST"),
                cost / road_movement_value("ROAD_BRUK_MOVE_SPEED_MULT"),
            );
        }
        if has(&names.ulepszenie_droga) {
            return cost / road_movement_value("ROAD_MOVE_SPEED_MULT");
        }
        cost
    }

    /// Web `terrainMoveCost` (`setup.ts:653`): koszt wejscia na heks; `Infinity` = nieprzejezdny.
    pub fn terrain_move_cost(hex: &RuchHex) -> f64 {
        let params = ruch_jednostek_params();
        if hex.rzeka {
            if is_water_terrain(hex.teren) || hex.teren == TerenBazowy::Polarny {
                return f64::INFINITY;
            }
            return apply_road_movement_modifier(params.teren.koszt_rzeki, hex);
        }
        let costs = terrain_costs();
        let base = costs
            .by_terrain
            .get(&hex.teren)
            .copied()
            .expect("koszt kazdego terenu jest w terrain-movement.json");
        if base == f64::INFINITY {
            return base;
        }
        let mut cost = base;
        if hex.las {
            let extra = costs.forest_extra;
            if extra == f64::INFINITY {
                return f64::INFINITY;
            }
            cost = base + extra;
        }
        apply_road_movement_modifier(cost, hex)
    }

    /// Web `embarkMoveCost` (`setup.ts:691`).
    pub fn embark_move_cost(hex: &RuchHex) -> f64 {
        if is_water_terrain(hex.teren) {
            return ruch_jednostek_params().embarkacja.koszt_wody;
        }
        terrain_move_cost(hex)
    }

    /// Web `hexDistance` (`setup.ts:354`).
    pub fn hex_distance(aq: i32, ar: i32, bq: i32, br: i32) -> i64 {
        let dq = (i64::from(aq) - i64::from(bq)).abs();
        let dr = (i64::from(ar) - i64::from(br)).abs();
        let ds = ((-i64::from(aq) - i64::from(ar)) - (-i64::from(bq) - i64::from(br))).abs();
        dq.max(dr).max(ds)
    }

    fn hex_distance_f(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
        let dq = (aq - bq).abs();
        let dr = (ar - br).abs();
        let ds = ((-aq - ar) - (-bq - br)).abs();
        js_max(js_max(dq, dr), ds)
    }

    fn neighbours() -> impl Iterator<Item = (i32, i32)> {
        ruch_jednostek_params()
            .teren
            .sasiedzi
            .iter()
            .map(|offset| (offset[0], offset[1]))
    }

    fn cost_of(cost_fn: Option<&CostFn<'_>>, hex: &RuchHex) -> f64 {
        match cost_fn {
            Some(function) => function(hex),
            None => terrain_move_cost(hex),
        }
    }

    type Entry = (f64, i32, i32);

    /// Kopiec binarny 1:1 z `setup.ts` (kolejnosc remisow zalezy od dokladnej sekwencji zamian).
    fn heap_push(heap: &mut Vec<Entry>, entry: Entry) {
        heap.push(entry);
        let mut i = heap.len() - 1;
        while i > 0 {
            let parent = (i - 1) >> 1;
            if heap[parent].0 <= heap[i].0 {
                break;
            }
            heap.swap(parent, i);
            i = parent;
        }
    }

    fn heap_pop(heap: &mut Vec<Entry>) -> Option<Entry> {
        if heap.is_empty() {
            return None;
        }
        let top = heap[0];
        let last = heap.pop().expect("niepusty kopiec");
        if !heap.is_empty() {
            heap[0] = last;
            let mut i = 0;
            loop {
                let l = 2 * i + 1;
                let r = 2 * i + 2;
                let mut smallest = i;
                if l < heap.len() && heap[l].0 < heap[smallest].0 {
                    smallest = l;
                }
                if r < heap.len() && heap[r].0 < heap[smallest].0 {
                    smallest = r;
                }
                if smallest == i {
                    break;
                }
                heap.swap(i, smallest);
                i = smallest;
            }
        }
        Some(top)
    }

    /// Web `computeReachable` (`setup.ts:721`): zbior heksow w zasiegu `unit.ruch_left`
    /// (kolejnosc = kolejnosc wstawiania `Set` weba), bez heksu startowego.
    pub fn compute_reachable(
        unit: &RuchJednostka,
        map: &RuchMapa,
        occupied: &HashSet<Klucz>,
        cost_fn: Option<&CostFn<'_>>,
    ) -> OrderedHexSet {
        let mut reachable = OrderedHexSet::new();
        let start = (unit.q, unit.r);
        let budget = unit.ruch_left;
        let mut dist: HashMap<Klucz, f64> = HashMap::new();
        dist.insert(start, 0.0);
        let mut heap: Vec<Entry> = vec![(0.0, unit.q, unit.r)];

        while let Some((cost, cq, cr)) = heap_pop(&mut heap) {
            if let Some(best) = dist.get(&(cq, cr)) {
                if cost > *best {
                    continue;
                }
            }
            for (dq, dr) in neighbours() {
                let (nq, nr) = (cq + dq, cr + dr);
                let Some(hex) = map.get((nq, nr)) else {
                    continue;
                };
                let mov_cost = cost_of(cost_fn, hex);
                if mov_cost == f64::INFINITY {
                    continue;
                }
                if occupied.contains(&(nq, nr)) {
                    continue;
                }
                let new_cost = cost + mov_cost;
                if new_cost <= budget {
                    let better = match dist.get(&(nq, nr)) {
                        None => true,
                        Some(prev) => new_cost < *prev,
                    };
                    if better {
                        dist.insert((nq, nr), new_cost);
                        reachable.insert((nq, nr));
                        heap_push(&mut heap, (new_cost, nq, nr));
                    }
                }
            }
        }

        // MIN-MOVE: przy budzecie >= 1 kazdy przejezdny, wolny sasiad jest osiagalny.
        if budget >= ruch_jednostek_params().marsz.min_budzet_kroku {
            for (dq, dr) in neighbours() {
                let key = (unit.q + dq, unit.r + dr);
                let Some(hex) = map.get(key) else {
                    continue;
                };
                let mov_cost = cost_of(cost_fn, hex);
                if mov_cost != f64::INFINITY && !occupied.contains(&key) {
                    reachable.insert(key);
                }
            }
        }
        reachable.remove(start);
        reachable
    }

    /// Web `computePath` (`setup.ts:884`): trasa PO starcie, konczaca sie na celu; `[]` gdy cel
    /// = start lub nieosiagalny. Cel nieprzejezdny / zajety jest dozwolony jako ostatni krok.
    pub fn compute_path(
        unit: &RuchJednostka,
        map: &RuchMapa,
        dest_q: f64,
        dest_r: f64,
        occupied: &HashSet<Klucz>,
        cost_fn: Option<&CostFn<'_>>,
    ) -> Vec<Klucz> {
        let start = (unit.q, unit.r);
        let Some(dest) = int_key(dest_q, dest_r) else {
            return Vec::new();
        };
        if !map.contains(dest) {
            return Vec::new();
        }
        if start == dest {
            return Vec::new();
        }
        let trasa = &ruch_jednostek_params().trasa;
        let max_radius = hex_distance(unit.q, unit.r, dest.0, dest.1) * trasa.mnoznik_promienia
            + trasa.bufor_promienia;

        let mut dist: HashMap<Klucz, f64> = HashMap::new();
        let mut parent: HashMap<Klucz, Option<Klucz>> = HashMap::new();
        dist.insert(start, 0.0);
        parent.insert(start, None);
        let mut heap: Vec<Entry> = vec![(0.0, unit.q, unit.r)];
        let mut found = false;

        while let Some((cost, cq, cr)) = heap_pop(&mut heap) {
            let cur = (cq, cr);
            if let Some(best) = dist.get(&cur) {
                if cost > *best {
                    continue;
                }
            }
            if cur == dest {
                found = true;
                break;
            }
            for (dq, dr) in neighbours() {
                let (nq, nr) = (cq + dq, cr + dr);
                let n_key = (nq, nr);
                if hex_distance(unit.q, unit.r, nq, nr) > max_radius {
                    continue;
                }
                if let Some(settled) = dist.get(&n_key) {
                    if *settled <= cost {
                        continue;
                    }
                }
                let Some(hex) = map.get(n_key) else {
                    continue;
                };
                let mov_cost = cost_of(cost_fn, hex);
                if n_key == dest {
                    let enter_cost = if mov_cost == f64::INFINITY {
                        trasa.koszt_celu_nieprzejezdnego
                    } else {
                        mov_cost
                    };
                    let new_cost = cost + enter_cost;
                    let better = match dist.get(&n_key) {
                        None => true,
                        Some(prev) => new_cost < *prev,
                    };
                    if better {
                        dist.insert(n_key, new_cost);
                        parent.insert(n_key, Some(cur));
                        heap_push(&mut heap, (new_cost, nq, nr));
                    }
                    continue;
                }
                if mov_cost == f64::INFINITY {
                    continue;
                }
                if occupied.contains(&n_key) {
                    continue;
                }
                let new_cost = cost + mov_cost;
                let better = match dist.get(&n_key) {
                    None => true,
                    Some(prev) => new_cost < *prev,
                };
                if better {
                    dist.insert(n_key, new_cost);
                    parent.insert(n_key, Some(cur));
                    heap_push(&mut heap, (new_cost, nq, nr));
                }
            }
        }

        if !found && !parent.contains_key(&dest) {
            return Vec::new();
        }
        let mut path: Vec<Klucz> = Vec::new();
        let mut cur = dest;
        while cur != start {
            path.push(cur);
            match parent.get(&cur) {
                Some(Some(prev)) => cur = *prev,
                _ => return Vec::new(),
            }
        }
        path.reverse();
        path
    }

    /// Web `pathCost` (`setup.ts:1052`): suma kosztow wejscia; `Infinity` liczy sie jako 0,
    /// brakujacy heks jako 0.
    pub fn path_cost(path: &[Klucz], map: &RuchMapa, cost_fn: Option<&CostFn<'_>>) -> f64 {
        let mut total = 0.0;
        for key in path {
            if let Some(hex) = map.get(*key) {
                let c = cost_of(cost_fn, hex);
                total += if c == f64::INFINITY { 0.0 } else { c };
            }
        }
        total
    }

    // -----------------------------------------------------------------------
    // visibility.ts - computeVisibleAt, addExplored
    // -----------------------------------------------------------------------

    /// Web `computeVisibleAt` (`visibility.ts:64`): heksy mapy w promieniu `sight` (kolejnosc
    /// wstawiania `dq` rosnaco, w srodku `dr` rosnaco).
    pub fn compute_visible_at(q: i32, r: i32, map: &RuchMapa, sight: f64) -> OrderedHexSet {
        let mut visible = OrderedHexSet::new();
        let (qf, rf) = (f64::from(q), f64::from(r));
        let mut dq = -sight;
        while dq <= sight {
            let mut dr = -sight;
            while dr <= sight {
                if hex_distance_f(qf, rf, qf + dq, rf + dr) <= sight {
                    if let Some(key) = int_key(qf + dq, rf + dr) {
                        if map.contains(key) {
                            visible.insert(key);
                        }
                    }
                }
                dr += 1.0;
            }
            dq += 1.0;
        }
        visible
    }

    /// Web `addExplored` (`visibility.ts:190`).
    pub fn add_explored(explored: &mut OrderedHexSet, visible: &OrderedHexSet) {
        for key in visible.iter() {
            explored.insert(key);
        }
    }

    // -----------------------------------------------------------------------
    // armyMerge.ts - stackGroupIdOf
    // -----------------------------------------------------------------------

    /// Web `stackGroupIdOf` (`armyMerge.ts:56`).
    pub fn stack_group_id_of(unit: &RuchJednostka) -> String {
        if let Some(id) = unit.stack_group_id.as_ref().filter(|id| !id.is_empty()) {
            return id.clone();
        }
        let stos = &ruch_jednostek_params().stos;
        let base = format!("{}{}{},{}", unit.owner_id, stos.separator, unit.q, unit.r);
        if unit.in_garnizon {
            format!("{base}{}", stos.przyrostek_garnizon)
        } else {
            base
        }
    }

    // -----------------------------------------------------------------------
    // embarkation.ts
    // -----------------------------------------------------------------------

    /// Web `EMBARK_TECH` (`embarkation.ts:25`).
    pub fn embark_tech() -> &'static str {
        &ruch_jednostek_params().embarkacja.technologia
    }

    /// Web `EMBARK_DEFENSE_MULT` (`embarkation.ts:28`).
    pub fn embark_defense_mult() -> f64 {
        ruch_jednostek_params().embarkacja.mnoznik_obrony
    }

    /// Web `EMBARKED_WATER_MOVE_COST` (`setup.ts:683`).
    pub fn embarked_water_move_cost() -> f64 {
        ruch_jednostek_params().embarkacja.koszt_wody
    }

    /// Web `canUnitEmbark` (`embarkation.ts:36`).
    pub fn can_unit_embark(
        category: &str,
        embarked: Option<bool>,
        owner_has_seafaring: bool,
    ) -> bool {
        if embarked == Some(true) {
            return true;
        }
        if category == ruch_jednostek_params().embarkacja.kategoria_okretu {
            return false;
        }
        owner_has_seafaring
    }

    /// Web `moveCostFnFor` (`embarkation.ts:50`): `None` (web `undefined`) gdy jednostka nie moze
    /// sie zaokretowac; inaczej koszt z woda przejezdna (+ mnoznik cywilizacji na plytkim morzu).
    pub fn move_cost_fn_for<'a>(
        unit: &RuchJednostka,
        owner_has_seafaring: bool,
        civ_bonusy: &'a [CivBonusEntry],
    ) -> Option<BoxedCostFn<'a>> {
        if !can_unit_embark(&unit.category, unit.embarked, owner_has_seafaring) {
            return None;
        }
        let shape = CivBonusUnitShape {
            typ_nazwa: unit
                .type_id
                .clone()
                .unwrap_or_else(|| unit.category.clone()),
            rola: unit.category.clone(),
            missile_attack: None,
            counter_typ: None,
        };
        Some(Box::new(move |hex: &RuchHex| {
            let base = embark_move_cost(hex);
            if hex.teren != TerenBazowy::PlytkieMorze {
                return base;
            }
            let mult = civ_movement_multiplier(civ_bonusy, &shape, "", true);
            base / js_max(ruch_jednostek_params().embarkacja.min_mnoznik_ruchu, mult)
        }))
    }

    /// Web `isWaterHexAt` (`embarkation.ts:66`).
    pub fn is_water_hex_at(map: &RuchMapa, q: i32, r: i32) -> bool {
        map.get((q, r))
            .is_some_and(|hex| is_water_terrain(hex.teren))
    }

    /// Web `applyEmbarkStateAfterMove` (`embarkation.ts:77`): mutuje jednostki; `true` gdy cos sie
    /// zmienilo.
    pub fn apply_embark_state_after_move(units: &mut [RuchJednostka], map: &RuchMapa) -> bool {
        let mut changed = false;
        for unit in units.iter_mut() {
            let on_water = is_water_hex_at(map, unit.q, unit.r);
            if on_water && unit.embarked != Some(true) {
                unit.embarked = Some(true);
                changed = true;
            } else if !on_water && unit.embarked == Some(true) {
                unit.embarked = None;
                changed = true;
            }
        }
        changed
    }

    /// Web `nearestFreeWaterHex` (`embarkation.ts:100`).
    pub fn nearest_free_water_hex(
        map: &RuchMapa,
        q: i32,
        r: i32,
        occupied: &HashSet<Klucz>,
    ) -> Option<Klucz> {
        let is_free_water = |key: Klucz| -> bool {
            match map.get(key) {
                None => false,
                Some(hex) => !occupied.contains(&key) && is_water_terrain(hex.teren),
            }
        };
        for (dq, dr) in neighbours() {
            let key = (q + dq, r + dr);
            if is_free_water(key) {
                return Some(key);
            }
        }
        let mut seen: HashSet<Klucz> = HashSet::from([(q, r)]);
        for (dq, dr) in neighbours() {
            for (dq2, dr2) in neighbours() {
                let key = (q + dq + dq2, r + dr + dr2);
                if !seen.insert(key) {
                    continue;
                }
                if is_free_water(key) {
                    return Some(key);
                }
            }
        }
        None
    }

    // -----------------------------------------------------------------------
    // rally-point.ts
    // -----------------------------------------------------------------------

    /// Web `RallyPoint` (`rally-point.ts:12`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct RallyPoint {
        pub q: f64,
        pub r: f64,
    }

    /// Web `Map<number, RallyPoint>` (kolejnosc wstawiania zachowana).
    #[derive(Debug, Clone, Default, PartialEq)]
    pub struct RallyPoints {
        entries: Vec<(i64, RallyPoint)>,
    }

    impl RallyPoints {
        pub fn new() -> Self {
            Self::default()
        }

        /// Web `new Map(entries)`: omija walidacje `setRallyPoint` (dopuszcza q/r nieskonczone).
        pub fn from_entries<I: IntoIterator<Item = (i64, RallyPoint)>>(entries: I) -> Self {
            let mut out = Self::new();
            for (owner_id, point) in entries {
                out.set(owner_id, point);
            }
            out
        }

        /// `Map.set`: nadpisanie zachowuje pozycje.
        fn set(&mut self, owner_id: i64, point: RallyPoint) {
            match self.entries.iter_mut().find(|(id, _)| *id == owner_id) {
                Some(entry) => entry.1 = point,
                None => self.entries.push((owner_id, point)),
            }
        }

        fn delete(&mut self, owner_id: i64) {
            self.entries.retain(|(id, _)| *id != owner_id);
        }

        pub fn get(&self, owner_id: i64) -> Option<RallyPoint> {
            self.entries
                .iter()
                .find(|(id, _)| *id == owner_id)
                .map(|(_, point)| *point)
        }

        pub fn len(&self) -> usize {
            self.entries.len()
        }

        pub fn is_empty(&self) -> bool {
            self.entries.is_empty()
        }

        pub fn iter(&self) -> impl Iterator<Item = (i64, RallyPoint)> + '_ {
            self.entries.iter().copied()
        }
    }

    /// Web `Number.isInteger`.
    pub fn js_is_integer(value: f64) -> bool {
        value.is_finite() && value.fract() == 0.0
    }

    /// Web `setRallyPoint` (`rally-point.ts:20`): `owner_id` jak liczba weba.
    pub fn set_rally_point(points: &mut RallyPoints, owner_id: f64, point: RallyPoint) {
        if !js_is_integer(owner_id) || !point.q.is_finite() || !point.r.is_finite() {
            return;
        }
        points.set(
            owner_id as i64,
            RallyPoint {
                q: point.q.trunc(),
                r: point.r.trunc(),
            },
        );
    }

    /// Web `clearRallyPoint` (`rally-point.ts:30`).
    pub fn clear_rally_point(points: &mut RallyPoints, owner_id: i64) {
        points.delete(owner_id);
    }

    /// Web `rallyLaunchLeaderIds` (`rally-point.ts:39`).
    pub fn rally_launch_leader_ids(units: &[RuchJednostka], owner_id: i64) -> Vec<String> {
        let mut occupied: HashSet<String> = HashSet::new();
        let mut result = Vec::new();
        for unit in units {
            if unit.owner_id != owner_id || unit.in_garnizon {
                continue;
            }
            if !occupied.insert(stack_group_id_of(unit)) {
                continue;
            }
            result.push(unit.id.clone());
        }
        result
    }

    /// Web `rallyPointsToSave` (`rally-point.ts:56`): `None` gdy stan pusty / nic do zapisu.
    pub fn rally_points_to_save(points: &RallyPoints) -> Option<BTreeMap<String, RallyPoint>> {
        if points.is_empty() {
            return None;
        }
        let mut out = BTreeMap::new();
        for (owner_id, point) in points.iter() {
            if !point.q.is_finite() || !point.r.is_finite() {
                continue;
            }
            out.insert(
                owner_id.to_string(),
                RallyPoint {
                    q: point.q.trunc(),
                    r: point.r.trunc(),
                },
            );
        }
        if out.is_empty() {
            None
        } else {
            Some(out)
        }
    }

    /// Surowy punkt z zapisu: `Some` tylko dla obiektu; `q` / `r` `Some` tylko dla liczb.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct RawRallyPoint {
        pub q: Option<f64>,
        pub r: Option<f64>,
    }

    /// Wejscie `rallyPointsFromSave`: wpisy `Object.entries(saved)` w kolejnosci weba; wartosc
    /// `None` = nie-obiekt / `null`.
    pub type RallyPointsSaved = Vec<(String, Option<RawRallyPoint>)>;

    /// Web `Number(string)` (StringToNumber, ECMA-262): bialy znak, hex/oct/bin, `Infinity`,
    /// notacja dziesietna; pusty napis = 0; blad = `NaN`.
    pub fn js_number_from_str(raw: &str) -> f64 {
        let s = raw.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
        if s.is_empty() {
            return 0.0;
        }
        for (prefix, radix) in [
            ("0x", 16),
            ("0X", 16),
            ("0o", 8),
            ("0O", 8),
            ("0b", 2),
            ("0B", 2),
        ] {
            if let Some(digits) = s.strip_prefix(prefix) {
                if digits.is_empty() || !digits.chars().all(|c| c.is_digit(radix)) {
                    return f64::NAN;
                }
                return digits.chars().fold(0.0, |acc, c| {
                    acc * f64::from(radix) + f64::from(c.to_digit(radix).expect("cyfra"))
                });
            }
        }
        let (sign, body) = match s.as_bytes()[0] {
            b'+' => (1.0, &s[1..]),
            b'-' => (-1.0, &s[1..]),
            _ => (1.0, s),
        };
        if body == "Infinity" {
            return sign * f64::INFINITY;
        }
        let bytes = body.as_bytes();
        let mut i = 0;
        let mut int_digits = 0;
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1;
            int_digits += 1;
        }
        let mut frac_digits = 0;
        if i < bytes.len() && bytes[i] == b'.' {
            i += 1;
            while i < bytes.len() && bytes[i].is_ascii_digit() {
                i += 1;
                frac_digits += 1;
            }
        }
        if int_digits + frac_digits == 0 {
            return f64::NAN;
        }
        if i < bytes.len() && (bytes[i] == b'e' || bytes[i] == b'E') {
            i += 1;
            if i < bytes.len() && (bytes[i] == b'+' || bytes[i] == b'-') {
                i += 1;
            }
            let start = i;
            while i < bytes.len() && bytes[i].is_ascii_digit() {
                i += 1;
            }
            if i == start {
                return f64::NAN;
            }
        }
        if i != bytes.len() {
            return f64::NAN;
        }
        match body.parse::<f64>() {
            Ok(value) => sign * value,
            Err(_) => f64::NAN,
        }
    }

    /// Web `rallyPointsFromSave` (`rally-point.ts:69`).
    pub fn rally_points_from_save(saved: Option<&RallyPointsSaved>) -> RallyPoints {
        let mut out = RallyPoints::new();
        let Some(saved) = saved else {
            return out;
        };
        for (raw_owner_id, raw_point) in saved {
            let owner_id = js_number_from_str(raw_owner_id);
            if !js_is_integer(owner_id) {
                continue;
            }
            let Some(point) = raw_point else {
                continue;
            };
            let (Some(q), Some(r)) = (point.q, point.r) else {
                continue;
            };
            if !q.is_finite() || !r.is_finite() {
                continue;
            }
            out.set(
                owner_id as i64,
                RallyPoint {
                    q: q.trunc(),
                    r: r.trunc(),
                },
            );
        }
        out
    }

    // -----------------------------------------------------------------------
    // planned-march.ts
    // -----------------------------------------------------------------------

    /// Web `PlannedMarchDest` (`planned-march.ts:14`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct PlannedMarchDest {
        pub dest_q: f64,
        pub dest_r: f64,
        pub attack_unit_id: Option<String>,
    }

    /// Web `MarchStopReason` (`planned-march.ts:31`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum MarchStopReason {
        Obstacle,
        NoPath,
        NoMovement,
        BlockedCity,
        Fog,
    }

    impl MarchStopReason {
        pub fn web_value(self) -> &'static str {
            match self {
                Self::Obstacle => "obstacle",
                Self::NoPath => "no_path",
                Self::NoMovement => "no_movement",
                Self::BlockedCity => "blocked_city",
                Self::Fog => "fog",
            }
        }
    }

    /// Web `MarchFogContext` (`planned-march.ts:34`).
    #[derive(Debug, Clone)]
    pub struct MarchFogContext {
        pub fog_active: bool,
        pub visible: HashSet<Klucz>,
        pub attack_on_visible_enemy: bool,
    }

    /// Web `truncatePathAtFogFrontier` (`planned-march.ts:43`).
    pub fn truncate_path_at_fog_frontier(
        path: &[Klucz],
        visible: &HashSet<Klucz>,
    ) -> (Vec<Klucz>, bool) {
        if path.is_empty() {
            return (Vec::new(), false);
        }
        let mut out = Vec::new();
        for hex in path {
            if !visible.contains(hex) {
                break;
            }
            out.push(*hex);
        }
        let limited = out.len() < path.len();
        (out, limited)
    }

    /// Web `PathTurnStop` (`planned-march.ts:154`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct PathTurnStop {
        pub q: i32,
        pub r: i32,
        pub turn: u32,
    }

    /// Web `PathTurnPlan` (`planned-march.ts:160`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct PathTurnPlan {
        pub full_path: Vec<Klucz>,
        pub turn_stops: Vec<PathTurnStop>,
        pub segment_path: Vec<Klucz>,
        pub segment_cost: f64,
        pub reachable: bool,
        pub stop_reason: Option<MarchStopReason>,
        /// Web `fogLimited?` - `applyFogToPathPlan` zwraca plan bez zmian, wiec zawsze `None`.
        pub fog_limited: Option<bool>,
    }

    /// Web `ExecuteMarchResult` (`planned-march.ts:172`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct ExecuteMarchResult {
        pub ok: bool,
        pub move_path: Vec<Klucz>,
        pub cost: f64,
        pub arrived: bool,
        pub stop_reason: Option<MarchStopReason>,
        pub stop_detail: Option<String>,
    }

    /// Web `applyFogToPathPlan` (`planned-march.ts:67`): od C-RUCH-Q1=B zwraca plan bez zmian.
    pub fn apply_fog_to_path_plan(
        plan: PathTurnPlan,
        _map: &RuchMapa,
        _per_turn_move: f64,
        _movement_budget: Option<f64>,
        _fog: Option<&MarchFogContext>,
    ) -> PathTurnPlan {
        plan
    }

    /// Web `truncatePathToBudget` (`planned-march.ts:182`).
    pub fn truncate_path_to_budget(
        path: &[Klucz],
        budget: f64,
        map: &RuchMapa,
        cost_fn: Option<&CostFn<'_>>,
    ) -> Vec<Klucz> {
        if budget <= 0.0 || path.is_empty() {
            return Vec::new();
        }
        let mut out = Vec::new();
        for i in 0..path.len() {
            let c = path_cost(&path[..=i], map, cost_fn);
            if c > budget {
                break;
            }
            out.push(path[i]);
        }
        // MIN-MOVE (spojne z computeReachable).
        if out.is_empty() && budget >= ruch_jednostek_params().marsz.min_budzet_kroku {
            let first = path[0];
            if let Some(hex) = map.get(first) {
                if cost_of(cost_fn, hex) != f64::INFINITY {
                    out.push(first);
                }
            }
        }
        out
    }

    /// Web `planPathTurns` (`planned-march.ts:211`).
    #[allow(clippy::too_many_arguments)] // sygnatura 1:1 z webem
    pub fn plan_path_turns(
        unit: &RuchJednostka,
        dest_q: f64,
        dest_r: f64,
        map: &RuchMapa,
        occupied: &HashSet<Klucz>,
        per_turn_move: f64,
        movement_budget: Option<f64>,
        cost_fn: Option<&CostFn<'_>>,
    ) -> PathTurnPlan {
        let empty = PathTurnPlan {
            full_path: Vec::new(),
            turn_stops: Vec::new(),
            segment_path: Vec::new(),
            segment_cost: 0.0,
            reachable: false,
            stop_reason: Some(MarchStopReason::NoPath),
            fog_limited: None,
        };
        if f64::from(unit.q) == dest_q && f64::from(unit.r) == dest_r {
            return PathTurnPlan {
                reachable: true,
                stop_reason: None,
                ..empty
            };
        }
        let path = compute_path(unit, map, dest_q, dest_r, occupied, cost_fn);
        if path.is_empty() {
            return empty;
        }
        let per_turn = js_max(ruch_jednostek_params().marsz.min_tury_ruchu, per_turn_move);
        let mut turn_stops: Vec<PathTurnStop> = Vec::new();
        let mut turn_acc = 0.0;
        let mut turn_num: u32 = 1;
        for i in 0..path.len() {
            let before = if i > 0 {
                path_cost(&path[..i], map, cost_fn)
            } else {
                0.0
            };
            let step_cost = path_cost(&path[..=i], map, cost_fn) - before;
            if turn_acc + step_cost > per_turn {
                if i > 0 {
                    let prev = path[i - 1];
                    let differs = match turn_stops.last() {
                        None => true,
                        Some(last) => last.q != prev.0 || last.r != prev.1,
                    };
                    if differs {
                        turn_stops.push(PathTurnStop {
                            q: prev.0,
                            r: prev.1,
                            turn: turn_num,
                        });
                    }
                }
                turn_num += 1;
                turn_acc = step_cost;
            } else {
                turn_acc += step_cost;
            }
        }
        let last = path[path.len() - 1];
        let needs_last = match turn_stops.last() {
            None => true,
            Some(stop) => stop.q != last.0 || stop.r != last.1,
        };
        if needs_last {
            turn_stops.push(PathTurnStop {
                q: last.0,
                r: last.1,
                turn: turn_num,
            });
        }
        let budget = movement_budget.unwrap_or(per_turn);
        let segment_path = truncate_path_to_budget(&path, budget, map, cost_fn);
        let segment_cost = if segment_path.is_empty() {
            0.0
        } else {
            path_cost(&segment_path, map, cost_fn)
        };
        PathTurnPlan {
            full_path: path,
            turn_stops,
            segment_path,
            segment_cost,
            reachable: true,
            stop_reason: None,
            fog_limited: None,
        }
    }

    /// Wynik `shouldStopAtObstacle`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct StopDecision {
        pub stop: bool,
        pub reason: Option<MarchStopReason>,
        pub detail: Option<String>,
    }

    fn go() -> StopDecision {
        StopDecision {
            stop: false,
            reason: None,
            detail: None,
        }
    }

    fn halt(reason: MarchStopReason, detail: &str) -> StopDecision {
        StopDecision {
            stop: true,
            reason: Some(reason),
            detail: Some(detail.to_owned()),
        }
    }

    fn is_march_attack_dest(q: i32, r: i32, dest: &PlannedMarchDest) -> bool {
        f64::from(q) == dest.dest_q && f64::from(r) == dest.dest_r
    }

    /// Web `shouldStopAtObstacle` (`planned-march.ts:280`).
    pub fn should_stop_at_obstacle(
        unit: &RuchJednostka,
        dest: &PlannedMarchDest,
        map: &RuchMapa,
        occupied: &HashSet<Klucz>,
        segment_path: &[Klucz],
        movement_budget: f64,
        cost_fn: Option<&CostFn<'_>>,
    ) -> StopDecision {
        let texts = &ruch_jednostek_params().marsz.teksty;
        if movement_budget <= 0.0 {
            return halt(MarchStopReason::NoMovement, &texts.brak_ruchu);
        }
        let path = compute_path(unit, map, dest.dest_q, dest.dest_r, occupied, cost_fn);
        if path.is_empty() {
            return halt(MarchStopReason::NoPath, &texts.brak_trasy);
        }
        let arrived = segment_path.last().is_some_and(|last| {
            f64::from(last.0) == dest.dest_q && f64::from(last.1) == dest.dest_r
        });
        if arrived {
            return go();
        }
        let truncated = truncate_path_to_budget(&path, movement_budget, map, cost_fn);
        if truncated.is_empty() {
            return halt(MarchStopReason::NoMovement, &texts.brak_ruchu);
        }
        let seg_end = truncated[truncated.len() - 1];
        if let Some(seg_end_idx) = path.iter().position(|hex| *hex == seg_end) {
            if seg_end_idx < path.len() - 1 {
                let next = path[seg_end_idx + 1];
                if occupied.contains(&next) && !is_march_attack_dest(next.0, next.1, dest) {
                    return halt(MarchStopReason::Obstacle, &texts.zablokowany_heks);
                }
            }
        }
        let full_cost = path_cost(&path, map, cost_fn);
        let seg_cost = path_cost(&truncated, map, cost_fn);
        if seg_cost < movement_budget
            && f64::from(seg_end.0) != dest.dest_q
            && f64::from(seg_end.1) != dest.dest_r
            && truncated.len() == path.len()
            && full_cost <= movement_budget
        {
            return go();
        }
        if truncated.len() < path.len() && seg_cost >= movement_budget {
            return go();
        }
        if truncated.len() < path.len() {
            let next_idx = truncated.len();
            if next_idx < path.len() {
                let next = path[next_idx];
                if occupied.contains(&next) && !is_march_attack_dest(next.0, next.1, dest) {
                    return halt(MarchStopReason::Obstacle, &texts.zablokowany_heks);
                }
            }
        }
        go()
    }

    fn march_failure(reason: MarchStopReason, detail: &str) -> ExecuteMarchResult {
        ExecuteMarchResult {
            ok: false,
            move_path: Vec::new(),
            cost: 0.0,
            arrived: false,
            stop_reason: Some(reason),
            stop_detail: Some(detail.to_owned()),
        }
    }

    /// Web `executeMarchStep` (`planned-march.ts:343`).
    #[allow(clippy::too_many_arguments)] // sygnatura 1:1 z webem
    pub fn execute_march_step(
        unit: &RuchJednostka,
        dest: &PlannedMarchDest,
        map: &RuchMapa,
        occupied: &HashSet<Klucz>,
        movement_budget: f64,
        can_occupy_hex: &dyn Fn(i32, i32) -> bool,
        per_turn_move: f64,
        fog: Option<&MarchFogContext>,
        cost_fn: Option<&CostFn<'_>>,
    ) -> ExecuteMarchResult {
        let texts = &ruch_jednostek_params().marsz.teksty;
        let mut plan = plan_path_turns(
            unit,
            dest.dest_q,
            dest.dest_r,
            map,
            occupied,
            per_turn_move,
            Some(movement_budget),
            cost_fn,
        );
        plan = apply_fog_to_path_plan(plan, map, per_turn_move, Some(movement_budget), fog);
        if !plan.reachable || plan.full_path.is_empty() {
            return march_failure(MarchStopReason::NoPath, &texts.brak_trasy);
        }
        if movement_budget <= 0.0 {
            return march_failure(MarchStopReason::NoMovement, &texts.brak_ruchu);
        }
        let move_path = plan.segment_path.clone();
        if move_path.is_empty() {
            return march_failure(MarchStopReason::NoMovement, &texts.brak_ruchu);
        }
        let last = move_path[move_path.len() - 1];
        if !can_occupy_hex(last.0, last.1) {
            return march_failure(MarchStopReason::BlockedCity, &texts.obce_miasto);
        }
        let arrived = f64::from(last.0) == dest.dest_q && f64::from(last.1) == dest.dest_r;
        let obstacle = should_stop_at_obstacle(
            unit,
            dest,
            map,
            occupied,
            &move_path,
            movement_budget,
            cost_fn,
        );
        let fog_limited = plan.fog_limited == Some(true);
        let mut stop_reason = if obstacle.stop && !arrived {
            obstacle.reason
        } else {
            None
        };
        let mut stop_detail = obstacle.detail;
        if fog_limited && !arrived {
            stop_reason = Some(MarchStopReason::Fog);
            stop_detail = Some(texts.mgla.clone());
        }
        ExecuteMarchResult {
            ok: true,
            move_path,
            cost: plan.segment_cost,
            arrived,
            stop_reason,
            stop_detail,
        }
    }

    /// Web `AutoMarchSave` (`planned-march.ts:22`) po dekodowaniu zapisu: pola `None` = brak /
    /// nie-liczba / nie-napis.
    #[derive(Debug, Clone, PartialEq)]
    pub struct AutoMarchSave {
        pub leader_id: Option<String>,
        pub dest_q: Option<f64>,
        pub dest_r: Option<f64>,
    }

    /// Wpis `plannedMarches` z zapisu (`attackUnitId` tylko gdy napis).
    #[derive(Debug, Clone, PartialEq)]
    pub struct PlannedMarchSaved {
        pub dest_q: Option<f64>,
        pub dest_r: Option<f64>,
        pub attack_unit_id: Option<String>,
    }

    /// Web `validateAutoMarchFromSave` (`planned-march.ts:424`): `(leaderId, destQ, destR)`.
    pub fn validate_auto_march_from_save(
        saved: Option<&AutoMarchSave>,
        units: &[RuchJednostka],
        player_owner_id: i64,
    ) -> Option<(String, f64, f64)> {
        let saved = saved?;
        let leader_id = saved.leader_id.as_ref()?;
        let unit = units.iter().find(|candidate| &candidate.id == leader_id)?;
        if unit.owner_id != player_owner_id {
            return None;
        }
        if Some(f64::from(unit.q)) == saved.dest_q && Some(f64::from(unit.r)) == saved.dest_r {
            return None;
        }
        let (dest_q, dest_r) = (saved.dest_q?, saved.dest_r?);
        if !dest_q.is_finite() || !dest_r.is_finite() {
            return None;
        }
        Some((leader_id.clone(), dest_q, dest_r))
    }

    /// Web `plannedMarchesFromSave` (`planned-march.ts:438`): kolejnosc wpisow = kolejnosc `Map`.
    pub fn planned_marches_from_save(
        saved: Option<&AutoMarchSave>,
        planned_marches: Option<&[(String, Option<PlannedMarchSaved>)]>,
        units: &[RuchJednostka],
        player_owner_id: i64,
    ) -> Vec<(String, PlannedMarchDest)> {
        let mut out: Vec<(String, PlannedMarchDest)> = Vec::new();
        if let Some(entries) = planned_marches {
            for (uid, dest) in entries {
                let Some(dest) = dest else {
                    continue;
                };
                let (Some(dest_q), Some(dest_r)) = (dest.dest_q, dest.dest_r) else {
                    continue;
                };
                if !dest_q.is_finite() || !dest_r.is_finite() {
                    continue;
                }
                let Some(unit) = units.iter().find(|candidate| &candidate.id == uid) else {
                    continue;
                };
                if unit.owner_id != player_owner_id {
                    continue;
                }
                if f64::from(unit.q) == dest_q && f64::from(unit.r) == dest_r {
                    continue;
                }
                let attack_unit_id = dest
                    .attack_unit_id
                    .as_ref()
                    .filter(|id| !id.is_empty())
                    .cloned();
                out.push((
                    uid.clone(),
                    PlannedMarchDest {
                        dest_q,
                        dest_r,
                        attack_unit_id,
                    },
                ));
            }
        }
        if let Some((leader_id, dest_q, dest_r)) =
            validate_auto_march_from_save(saved, units, player_owner_id)
        {
            if !out.iter().any(|(uid, _)| *uid == leader_id) {
                out.push((
                    leader_id,
                    PlannedMarchDest {
                        dest_q,
                        dest_r,
                        attack_unit_id: None,
                    },
                ));
            }
        }
        out
    }

    /// Wynik `plannedMarchesToSave`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct PlannedMarchesSaveOut {
        pub auto_march: Option<(String, f64, f64)>,
        pub planned_marches: Option<Vec<(String, PlannedMarchDest)>>,
    }

    /// Web `plannedMarchesToSave` (`planned-march.ts:466`).
    pub fn planned_marches_to_save(
        marches: &[(String, PlannedMarchDest)],
    ) -> PlannedMarchesSaveOut {
        if marches.is_empty() {
            return PlannedMarchesSaveOut {
                auto_march: None,
                planned_marches: None,
            };
        }
        let mut planned: Vec<(String, PlannedMarchDest)> = Vec::new();
        let mut first: Option<(String, f64, f64)> = None;
        for (unit_id, dest) in marches {
            let attack_unit_id = dest
                .attack_unit_id
                .as_ref()
                .filter(|id| !id.is_empty())
                .cloned();
            planned.push((
                unit_id.clone(),
                PlannedMarchDest {
                    dest_q: dest.dest_q,
                    dest_r: dest.dest_r,
                    attack_unit_id,
                },
            ));
            if first.is_none() {
                first = Some((unit_id.clone(), dest.dest_q, dest.dest_r));
            }
        }
        PlannedMarchesSaveOut {
            auto_march: first,
            planned_marches: Some(planned),
        }
    }

    // -----------------------------------------------------------------------
    // scout-auto-explore.ts
    // -----------------------------------------------------------------------

    /// Web `isScoutUnit` (`scout-auto-explore.ts:23`).
    pub fn is_scout_unit(unit: &RuchJednostka) -> bool {
        let zwiad = &ruch_jednostek_params().zwiad;
        unit.category == zwiad.kategoria
            || unit.type_id.as_deref() == Some(zwiad.typ_jednostki.as_str())
    }

    /// Web `clearScoutAutoExplore` (`scout-auto-explore.ts:28`).
    pub fn clear_scout_auto_explore(unit: &mut RuchJednostka) -> bool {
        if !is_scout_unit(unit) {
            return false;
        }
        if unit.auto_explore != Some(true) {
            return false;
        }
        unit.auto_explore = Some(false);
        true
    }

    /// Web `scoreMarginalReveal` (`scout-auto-explore.ts:36`).
    pub fn score_marginal_reveal(
        from: Klucz,
        to: Klucz,
        explored: &OrderedHexSet,
        map: &RuchMapa,
        sight: f64,
    ) -> u32 {
        let from_visible = compute_visible_at(from.0, from.1, map, sight);
        let to_visible = compute_visible_at(to.0, to.1, map, sight);
        let mut count = 0;
        for key in to_visible.iter() {
            if !explored.contains(key) && !from_visible.contains(key) {
                count += 1;
            }
        }
        count
    }

    /// Web `scoreHexForExplore` (`scout-auto-explore.ts:55`).
    pub fn score_hex_for_explore(
        q: i32,
        r: i32,
        explored: &OrderedHexSet,
        map: &RuchMapa,
        sight: f64,
    ) -> i64 {
        let zwiad = &ruch_jednostek_params().zwiad;
        let mut score = 0;
        for key in compute_visible_at(q, r, map, sight).iter() {
            if !explored.contains(key) {
                score += zwiad.punkty_nieodkryty_w_zasiegu;
            }
        }
        for (dq, dr) in neighbours() {
            let key = (q + dq, r + dr);
            if map.contains(key) && !explored.contains(key) {
                score += zwiad.punkty_sasiad_ukryty;
            }
        }
        score
    }

    fn occupied_except(units: &[RuchJednostka], unit_id: &str) -> HashSet<Klucz> {
        units
            .iter()
            .filter(|unit| unit.id != unit_id)
            .map(|unit| (unit.q, unit.r))
            .collect()
    }

    fn deduct_step_cost(unit: &mut RuchJednostka, cost: f64) {
        if !cost.is_finite() || cost <= 0.0 {
            return;
        }
        if cost <= unit.ruch_left {
            unit.ruch_left -= cost;
        } else if unit.ruch_left >= ruch_jednostek_params().zwiad.min_ruch_do_kroku {
            unit.ruch_left = 0.0;
        }
    }

    fn pick_known_village_target(
        unit: &RuchJednostka,
        map: &RuchMapa,
        explored: &OrderedHexSet,
        occupied: &HashSet<Klucz>,
        sight: f64,
    ) -> Option<Klucz> {
        let visible = compute_visible_at(unit.q, unit.r, map, sight);
        let reachable = compute_reachable(unit, map, occupied, None);
        let mut best_path_len = f64::INFINITY;
        let mut best: Option<Klucz> = None;
        for key in explored.iter() {
            let Some(hex) = map.get(key) else {
                continue;
            };
            if !hex.wioska {
                continue;
            }
            if hex.ma_wlasciciela {
                continue;
            }
            if !visible.contains(key) && !reachable.contains(key) {
                continue;
            }
            let path = compute_path(
                unit,
                map,
                f64::from(key.0),
                f64::from(key.1),
                occupied,
                None,
            );
            if path.is_empty() {
                continue;
            }
            if (path.len() as f64) < best_path_len {
                best_path_len = path.len() as f64;
                best = Some(key);
            }
        }
        best
    }

    fn pick_best_explore_step(
        unit: &RuchJednostka,
        map: &RuchMapa,
        explored: &OrderedHexSet,
        occupied: &HashSet<Klucz>,
        sight: f64,
        rng: &mut dyn FnMut() -> f64,
    ) -> Option<Klucz> {
        let zwiad = &ruch_jednostek_params().zwiad;
        let mut reachable = compute_reachable(unit, map, occupied, None);
        reachable.remove((unit.q, unit.r));
        if reachable.is_empty() {
            return None;
        }
        let mut positive: Vec<(Klucz, f64)> = Vec::new();
        let mut zero: Vec<Klucz> = Vec::new();
        for key in reachable.iter() {
            let path = compute_path(
                unit,
                map,
                f64::from(key.0),
                f64::from(key.1),
                occupied,
                None,
            );
            if path.len() != 1 {
                continue;
            }
            let gain = score_marginal_reveal((unit.q, unit.r), key, explored, map, sight);
            if gain > 0 {
                positive.push((key, f64::from(gain)));
            } else if gain == 0 {
                zero.push(key);
            }
        }
        let pool: Vec<(Klucz, f64)> = if positive.is_empty() {
            zero.into_iter().map(|key| (key, 0.0)).collect()
        } else {
            positive
        };
        if pool.is_empty() {
            return None;
        }
        let mut best_gain = f64::NEG_INFINITY;
        let mut candidates: Vec<Klucz> = Vec::new();
        for (key, gain) in pool {
            let score = gain + rng() * zwiad.szum_losowania;
            if score > best_gain + zwiad.tolerancja_remisu {
                best_gain = score;
                candidates.clear();
                candidates.push(key);
            } else if (score - best_gain).abs() <= zwiad.tolerancja_remisu {
                candidates.push(key);
            }
        }
        if candidates.is_empty() {
            return None;
        }
        // `candidates[Math.floor(rng() * length)]`: indeks poza zakresem = `undefined` (falsy).
        let index = (rng() * candidates.len() as f64).floor();
        if index >= 0.0 && index < candidates.len() as f64 {
            Some(candidates[index as usize])
        } else {
            None
        }
    }

    /// Web `pickScoutExploreTarget` (`scout-auto-explore.ts:182`).
    pub fn pick_scout_explore_target(
        unit: &RuchJednostka,
        map: &RuchMapa,
        explored: &OrderedHexSet,
        occupied: &HashSet<Klucz>,
        sight: f64,
        rng: &mut dyn FnMut() -> f64,
    ) -> Option<Klucz> {
        if let Some(village) = pick_known_village_target(unit, map, explored, occupied, sight) {
            return Some(village);
        }
        pick_best_explore_step(unit, map, explored, occupied, sight, rng)
    }

    /// Web `advanceScoutAutoExplore` (`scout-auto-explore.ts:199`): `(moved, steps)`.
    /// `rng` jest wymagany (web: domyslnie `Math.random`, nieodtwarzalny).
    pub fn advance_scout_auto_explore(
        unit: &mut RuchJednostka,
        map: &RuchMapa,
        explored: &OrderedHexSet,
        all_units: &[RuchJednostka],
        sight: f64,
        rng: &mut dyn FnMut() -> f64,
        mut on_after_step: Option<&mut dyn FnMut(&RuchJednostka)>,
    ) -> (bool, u32) {
        if !is_scout_unit(unit) {
            return (false, 0);
        }
        if unit.ruch_left <= 0.0
            || unit.in_garnizon
            || unit
                .oblega_city_id
                .as_ref()
                .is_some_and(|id| !id.is_empty())
        {
            return (false, 0);
        }
        let zwiad = &ruch_jednostek_params().zwiad;
        let mut working = explored.clone();
        add_explored(
            &mut working,
            &compute_visible_at(unit.q, unit.r, map, sight),
        );
        let mut steps: u32 = 0;
        let mut moved = false;
        while unit.ruch_left > 0.0 {
            let occ = occupied_except(all_units, &unit.id);
            let Some(target) = pick_scout_explore_target(unit, map, &working, &occ, sight, rng)
            else {
                break;
            };
            let path = compute_path(
                unit,
                map,
                f64::from(target.0),
                f64::from(target.1),
                &occ,
                None,
            );
            if path.is_empty() {
                break;
            }
            let step = path[0];
            let Some(hex) = map.get(step) else {
                break;
            };
            let cost = terrain_move_cost(hex);
            if cost == f64::INFINITY {
                break;
            }
            if cost > unit.ruch_left && unit.ruch_left < zwiad.min_ruch_do_kroku {
                break;
            }
            unit.q = step.0;
            unit.r = step.1;
            deduct_step_cost(unit, cost);
            add_explored(
                &mut working,
                &compute_visible_at(unit.q, unit.r, map, sight),
            );
            steps += 1;
            moved = true;
            if let Some(callback) = on_after_step.as_deref_mut() {
                callback(unit);
            }
            if steps > zwiad.limit_krokow {
                break;
            }
        }
        (moved, steps)
    }

    /// Web `runScoutsAutoExplore` (`scout-auto-explore.ts:249`): `(movedUnitIds, totalSteps)`.
    #[allow(clippy::too_many_arguments)] // sygnatura 1:1 z webem
    pub fn run_scouts_auto_explore(
        units: &mut [RuchJednostka],
        map: &RuchMapa,
        explored: &OrderedHexSet,
        player_owner_id: i64,
        sight_resolver: &dyn Fn(&RuchJednostka) -> f64,
        rng: &mut dyn FnMut() -> f64,
        mut on_after_step: Option<&mut dyn FnMut(&RuchJednostka)>,
    ) -> (Vec<String>, u32) {
        let mut moved_unit_ids = Vec::new();
        let mut total_steps = 0;
        let mut forward = |unit: &RuchJednostka| {
            if let Some(callback) = on_after_step.as_deref_mut() {
                callback(unit);
            }
        };
        for index in 0..units.len() {
            let candidate = &units[index];
            if candidate.owner_id != player_owner_id {
                continue;
            }
            if !is_scout_unit(candidate) {
                continue;
            }
            if candidate.auto_explore != Some(true) {
                continue;
            }
            if candidate.sentry == Some(true) {
                continue;
            }
            let sight = sight_resolver(candidate);
            let mut working = candidate.clone();
            let (moved, steps) = advance_scout_auto_explore(
                &mut working,
                map,
                explored,
                units,
                sight,
                rng,
                Some(&mut forward),
            );
            units[index] = working;
            if moved {
                moved_unit_ids.push(units[index].id.clone());
                total_steps += steps;
            }
        }
        (moved_unit_ids, total_steps)
    }
}
