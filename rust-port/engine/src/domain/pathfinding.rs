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
            road_divisor: 3,
            paved_road_divisor: 5,
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
