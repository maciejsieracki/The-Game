//! Pure barbarian-domain rules.
//!
//! The module keeps camp placement/spawning, deterministic movement, and the
//! special city interaction rules independent from the turn loop.  Callers
//! provide snapshots and apply the returned commands/results; no input slice
//! is mutated by the resolver except the per-unit visit memory, which is an
//! intentional part of the movement decision state.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, VecDeque};

/// Sentinel owner used by the neutral hostile faction.
pub const BARBARIAN_OWNER_ID: i64 = -1;

/// Axial pointy-top coordinate used by map and movement rules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
}

impl HexCoord {
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

    pub const fn distance(self, other: Self) -> u32 {
        let dq = (self.q - other.q).unsigned_abs();
        let dr = (self.r - other.r).unsigned_abs();
        let ds = ((-self.q - self.r) - (-other.q - other.r)).unsigned_abs();
        let max = if dq > dr { dq } else { dr };
        if max > ds {
            max
        } else {
            ds
        }
    }

    pub fn neighbours(self) -> impl Iterator<Item = Self> {
        Self::DIRECTIONS
            .into_iter()
            .map(move |d| Self::new(self.q + d.q, self.r + d.r))
    }
}

/// Terrain labels relevant to barbarian camp placement and movement.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
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

impl Terrain {
    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    pub const fn is_passable_land(self) -> bool {
        !self.is_water() && !matches!(self, Self::Mountains)
    }
}

/// Minimal immutable map snapshot consumed by the barbarian rules.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MapTile {
    pub terrain: Terrain,
    /// `None` is neutral/unowned. Camp candidates must be neutral.
    #[serde(default)]
    pub owner_id: Option<i64>,
}

impl MapTile {
    pub const fn new(terrain: Terrain) -> Self {
        Self {
            terrain,
            owner_id: None,
        }
    }

    pub const fn owned(terrain: Terrain, owner_id: i64) -> Self {
        Self {
            terrain,
            owner_id: Some(owner_id),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct BarbarianMap {
    pub tiles: BTreeMap<HexCoord, MapTile>,
}

impl BarbarianMap {
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
}

/// A city snapshot used for spacing, targeting, and capture checks.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CitySnapshot {
    pub id: u64,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
}

impl CitySnapshot {
    pub const fn new(id: u64, owner_id: i64, q: i32, r: i32) -> Self {
        Self { id, owner_id, q, r }
    }

    pub const fn position(&self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }
}

/// A barbarian camp is a stationary source of new units.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BarbCamp {
    pub id: u64,
    pub q: i32,
    pub r: i32,
    pub spawn_cooldown: u32,
    #[serde(default)]
    pub naval: bool,
}

impl BarbCamp {
    pub const fn new(id: u64, q: i32, r: i32) -> Self {
        Self {
            id,
            q,
            r,
            spawn_cooldown: 0,
            naval: false,
        }
    }

    pub const fn position(&self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }
}

/// A unit snapshot.  `camp_id` remains set after the camp is destroyed so the
/// movement resolver can distinguish an orphaned unit from a unit merely far
/// from a living camp.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BarbUnit {
    pub id: u64,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    pub movement_left: u32,
    pub health_fraction: Option<f64>,
    pub camp_id: Option<u64>,
    #[serde(default)]
    pub embarked: bool,
    #[serde(default)]
    pub sea_raider: bool,
    #[serde(default)]
    pub cleared_city_ids: BTreeSet<u64>,
    #[serde(default)]
    pub orphaned_at_turn: Option<u32>,
}

impl BarbUnit {
    pub fn new(id: u64, q: i32, r: i32) -> Self {
        Self {
            id,
            owner_id: BARBARIAN_OWNER_ID,
            q,
            r,
            movement_left: 1,
            health_fraction: None,
            camp_id: None,
            embarked: false,
            sea_raider: false,
            cleared_city_ids: BTreeSet::new(),
            orphaned_at_turn: None,
        }
    }

    pub const fn position(&self) -> HexCoord {
        HexCoord::new(self.q, self.r)
    }

    pub fn with_camp(mut self, camp_id: u64) -> Self {
        self.camp_id = Some(camp_id);
        self
    }

    pub fn with_health(mut self, health_fraction: f64) -> Self {
        self.health_fraction = Some(health_fraction);
        self
    }
}

/// Unit spawn emitted by a camp tick.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BarbSpawn {
    pub camp_id: u64,
    pub q: i32,
    pub r: i32,
    pub unit_type: String,
    #[serde(default)]
    pub embarked: bool,
}

/// Commands for the movement phase.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BarbCommand {
    Move { unit_id: u64, to: HexCoord },
    Attack { unit_id: u64, target_unit_id: u64 },
}

impl BarbCommand {
    pub const fn unit_id(&self) -> u64 {
        match self {
            Self::Move { unit_id, .. } | Self::Attack { unit_id, .. } => *unit_id,
        }
    }
}

/// Data-driven coefficients.  Defaults mirror the canonical barbarian rules.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BarbParams {
    pub start_turn: u32,
    pub max_camps: usize,
    pub min_distance_from_city: u32,
    pub camp_spacing: u32,
    pub spawn_interval: u32,
    pub units_per_camp: usize,
    pub camp_control_radius: u32,
    pub aggro_radius: u32,
    pub retreat_health_fraction: f64,
    pub unit_type: String,
    pub orphaned_chase_turn_limit: u32,
}

impl Default for BarbParams {
    fn default() -> Self {
        Self {
            start_turn: 5,
            max_camps: 6,
            min_distance_from_city: 5,
            camp_spacing: 6,
            spawn_interval: 6,
            units_per_camp: 2,
            camp_control_radius: 3,
            aggro_radius: 6,
            retreat_health_fraction: 0.30,
            unit_type: "Wojownik".to_owned(),
            orphaned_chase_turn_limit: 10,
        }
    }
}

pub static FALLBACK_BARB_PARAMS: std::sync::LazyLock<BarbParams> =
    std::sync::LazyLock::new(BarbParams::default);

/// The game difficulty gate for empty-city capture.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Difficulty {
    Easy,
    Normal,
    Hard,
}

pub const fn is_barbarian(owner_id: i64) -> bool {
    owner_id == BARBARIAN_OWNER_ID
}

pub const fn barbarians_active(turn: u32, params: &BarbParams, highest_player_era: u8) -> bool {
    turn >= params.start_turn && highest_player_era < 4
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BarbariansLevel {
    Easy,
    Normal,
    Hard,
    Disabled,
}

pub fn barbarians_enabled(level: BarbariansLevel) -> bool {
    !matches!(level, BarbariansLevel::Disabled)
}

pub fn barbarian_units_per_camp_for_difficulty(difficulty: Option<Difficulty>) -> usize {
    match difficulty {
        Some(Difficulty::Easy) => 1,
        Some(Difficulty::Hard) => 3,
        Some(Difficulty::Normal) | None => 2,
    }
}

/// Migrate legacy save/config values without rejecting unknown input.
pub fn migrate_barbarians_level(level: &str) -> BarbariansLevel {
    match level {
        "latwy" | "easy" => BarbariansLevel::Easy,
        "normalny" | "normal" | "nieliczni" => BarbariansLevel::Normal,
        "trudny" | "hard" | "wielu" => BarbariansLevel::Hard,
        "brak" | "disabled" | "wylaczeni" => BarbariansLevel::Disabled,
        _ => BarbariansLevel::Normal,
    }
}

fn lcg_next(state: u32) -> (u32, u32) {
    let next = state.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
    (next, next)
}

fn shuffled_coordinates(mut coordinates: Vec<HexCoord>, seed: u32) -> Vec<HexCoord> {
    let mut state = seed;
    for i in (1..coordinates.len()).rev() {
        let (next, random) = lcg_next(state);
        state = next;
        let j = ((u64::from(random) * (i as u64 + 1)) >> 32) as usize;
        coordinates.swap(i, j);
    }
    coordinates
}

/// Deterministically choose new neutral land camps.
pub fn spawn_camps(
    map: &BarbarianMap,
    existing: &[BarbCamp],
    cities: &[CitySnapshot],
    params: &BarbParams,
    seed: u32,
) -> Vec<BarbCamp> {
    spawn_camps_with_cleared(map, existing, cities, params, seed, &BTreeSet::new())
}

/// Variant of [`spawn_camps`] that permanently excludes cleared camp hexes.
pub fn spawn_camps_with_cleared(
    map: &BarbarianMap,
    existing: &[BarbCamp],
    cities: &[CitySnapshot],
    params: &BarbParams,
    seed: u32,
    cleared_hexes: &BTreeSet<HexCoord>,
) -> Vec<BarbCamp> {
    let slots = params.max_camps.saturating_sub(existing.len());
    if slots == 0 {
        return Vec::new();
    }

    let candidates =
        map.tiles
            .iter()
            .filter_map(|(coordinate, tile)| {
                if !tile.terrain.is_passable_land()
                    || tile.owner_id.is_some()
                    || cleared_hexes.contains(coordinate)
                {
                    return None;
                }
                if cities.iter().any(|city| {
                    coordinate.distance(city.position()) < params.min_distance_from_city
                }) {
                    return None;
                }
                Some(*coordinate)
            })
            .collect::<Vec<_>>();
    let mut placed = existing.iter().map(BarbCamp::position).collect::<Vec<_>>();
    let mut result = Vec::new();

    for candidate in shuffled_coordinates(candidates, seed) {
        if result.len() == slots {
            break;
        }
        if placed
            .iter()
            .any(|other| candidate.distance(*other) < params.camp_spacing)
        {
            continue;
        }
        let id = u64::from(seed)
            .saturating_mul(1_000)
            .saturating_add(existing.len() as u64 + result.len() as u64 + 1);
        placed.push(candidate);
        result.push(BarbCamp::new(id, candidate.q, candidate.r));
    }
    result
}

fn occupied_units(units: &[BarbUnit]) -> BTreeSet<HexCoord> {
    units.iter().map(BarbUnit::position).collect()
}

fn free_adjacent_land(
    origin: HexCoord,
    map: &BarbarianMap,
    occupied: &BTreeSet<HexCoord>,
) -> Option<HexCoord> {
    let ring_one = origin.neighbours().find(|coordinate| {
        !occupied.contains(coordinate)
            && map
                .tile(*coordinate)
                .is_some_and(|tile| tile.terrain.is_passable_land())
    });
    if ring_one.is_some() {
        return ring_one;
    }

    let mut ring_two = BTreeSet::new();
    for middle in origin.neighbours() {
        for coordinate in middle.neighbours() {
            if coordinate != origin {
                ring_two.insert(coordinate);
            }
        }
    }
    ring_two.into_iter().find(|coordinate| {
        !occupied.contains(coordinate)
            && map
                .tile(*coordinate)
                .is_some_and(|tile| tile.terrain.is_passable_land())
    })
}

fn camp_owned_units(camp: &BarbCamp, units: &[BarbUnit], radius: u32) -> usize {
    units
        .iter()
        .filter(|unit| {
            unit.camp_id == Some(camp.id)
                || (unit.camp_id.is_none() && unit.position().distance(camp.position()) <= radius)
        })
        .count()
}

/// Advance all camp cooldowns and emit at most one spawn per camp.
pub fn tick_camps(
    camps: &[BarbCamp],
    barb_units: &[BarbUnit],
    all_units: &[BarbUnit],
    map: &BarbarianMap,
    params: &BarbParams,
) -> (Vec<BarbCamp>, Vec<BarbSpawn>) {
    let mut occupied = occupied_units(all_units);
    let mut updated = Vec::with_capacity(camps.len());
    let mut spawns = Vec::new();

    for camp in camps {
        // Naval camps are legacy save data. R-LUDY-MORZA Q1=A removes them;
        // Sea Peoples are spawned directly as embarked raiders instead.
        if camp.naval {
            continue;
        }
        let cooldown = camp.spawn_cooldown.saturating_sub(1);
        if cooldown > 0
            || camp_owned_units(camp, barb_units, params.camp_control_radius)
                >= params.units_per_camp
        {
            updated.push(BarbCamp {
                spawn_cooldown: cooldown,
                ..camp.clone()
            });
            continue;
        }
        let Some(spot) = free_adjacent_land(camp.position(), map, &occupied) else {
            updated.push(BarbCamp {
                spawn_cooldown: 0,
                ..camp.clone()
            });
            continue;
        };
        let embarked = false;
        occupied.insert(spot);
        spawns.push(BarbSpawn {
            camp_id: camp.id,
            q: spot.q,
            r: spot.r,
            unit_type: params.unit_type.clone(),
            embarked,
        });
        updated.push(BarbCamp {
            spawn_cooldown: params.spawn_interval,
            ..camp.clone()
        });
    }
    (updated, spawns)
}

/// Remove the camp entered by a non-barbarian unit, preserving spawned units.
pub fn destroy_camp_at(camps: &[BarbCamp], coordinate: HexCoord) -> (Vec<BarbCamp>, Option<u64>) {
    let destroyed = camps
        .iter()
        .find(|camp| camp.position() == coordinate)
        .map(|camp| camp.id);
    let remaining = camps
        .iter()
        .filter(|camp| camp.position() != coordinate)
        .cloned()
        .collect();
    (remaining, destroyed)
}

pub const fn should_allow_barbarian_city_capture(difficulty: Difficulty) -> bool {
    matches!(difficulty, Difficulty::Hard)
}

pub fn is_city_capture_blocked_by_defenders(
    attacker_owner_id: i64,
    units: &[BarbUnit],
    city: &CitySnapshot,
) -> bool {
    is_barbarian(attacker_owner_id)
        && units
            .iter()
            .any(|unit| unit.position() == city.position() && !is_barbarian(unit.owner_id))
}

pub fn can_capture_empty_city(
    attacker_owner_id: i64,
    city: &CitySnapshot,
    units: &[BarbUnit],
    difficulty: Difficulty,
) -> bool {
    is_barbarian(attacker_owner_id)
        && !is_barbarian(city.owner_id)
        && should_allow_barbarian_city_capture(difficulty)
        && !is_city_capture_blocked_by_defenders(attacker_owner_id, units, city)
}

fn path_step(
    map: &BarbarianMap,
    start: HexCoord,
    destination: HexCoord,
    occupied: &BTreeSet<HexCoord>,
) -> Option<HexCoord> {
    if start == destination {
        return None;
    }
    let mut queue = VecDeque::from([start]);
    let mut previous = BTreeMap::from([(start, None)]);
    while let Some(current) = queue.pop_front() {
        for next in current.neighbours() {
            if previous.contains_key(&next) {
                continue;
            }
            let is_destination = next == destination;
            let passable = map
                .tile(next)
                .is_some_and(|tile| tile.terrain.is_passable_land());
            if !is_destination && (!passable || occupied.contains(&next)) {
                continue;
            }
            previous.insert(next, Some(current));
            if is_destination {
                let mut cursor = next;
                while let Some(Some(parent)) = previous.get(&cursor) {
                    if *parent == start {
                        return Some(cursor);
                    }
                    cursor = *parent;
                }
                return None;
            }
            queue.push_back(next);
        }
    }
    None
}

fn nearest<T>(
    origin: HexCoord,
    items: impl IntoIterator<Item = T>,
    position: impl Fn(&T) -> HexCoord,
) -> Option<T> {
    items
        .into_iter()
        .min_by_key(|item| origin.distance(position(item)))
}

fn home_camp<'a>(unit: &BarbUnit, camps: &'a [BarbCamp], radius: u32) -> Option<&'a BarbCamp> {
    unit.camp_id
        .and_then(|id| camps.iter().find(|camp| camp.id == id))
        .or_else(|| {
            camps
                .iter()
                .filter(|camp| unit.position().distance(camp.position()) <= radius)
                .min_by_key(|camp| unit.position().distance(camp.position()))
        })
}

fn camp_raid_ready(camp: &BarbCamp, units: &[BarbUnit], params: &BarbParams) -> bool {
    units
        .iter()
        .filter(|unit| {
            !unit.embarked
                && !unit.sea_raider
                && (unit.camp_id == Some(camp.id)
                    || (unit.camp_id.is_none()
                        && unit.position().distance(camp.position()) <= params.camp_control_radius))
        })
        .count()
        >= params.units_per_camp
}

/// Rally two or more land units assigned to the same camp before they chase
/// civilization targets. The returned commands are pure and deterministic.
pub fn plan_barbarian_rally(
    units: &[BarbUnit],
    camps: &[BarbCamp],
    map: &BarbarianMap,
    all_units: &[BarbUnit],
) -> Vec<BarbCommand> {
    let land_camps = camps.iter().filter(|camp| !camp.naval).collect::<Vec<_>>();
    let mut groups: BTreeMap<u64, Vec<&BarbUnit>> = BTreeMap::new();
    for unit in units.iter().filter(|unit| {
        unit.owner_id == BARBARIAN_OWNER_ID
            && unit.movement_left > 0
            && !unit.embarked
            && !unit.sea_raider
    }) {
        let camp = unit
            .camp_id
            .and_then(|id| land_camps.iter().find(|camp| camp.id == id))
            .or_else(|| {
                land_camps
                    .iter()
                    .filter(|camp| unit.position().distance(camp.position()) <= 3)
                    .min_by_key(|camp| unit.position().distance(camp.position()))
            });
        if let Some(camp) = camp {
            groups.entry(camp.id).or_default().push(unit);
        }
    }

    let occupied = occupied_units(all_units);
    let mut commands = Vec::new();
    for (camp_id, group) in groups {
        if group.len() < 2 {
            continue;
        }
        let Some(camp) = land_camps.iter().find(|camp| camp.id == camp_id) else {
            continue;
        };
        for unit in group {
            if unit.position().distance(camp.position()) <= 1 {
                continue;
            }
            let mut blocked = occupied.clone();
            blocked.remove(&unit.position());
            if let Some(step) = path_step(map, unit.position(), camp.position(), &blocked) {
                commands.push(BarbCommand::Move {
                    unit_id: unit.id,
                    to: step,
                });
            }
        }
    }
    commands
}

/// Decide one deterministic movement/attack command per movable barbarian.
pub fn decide_barbarian_moves(
    units: &mut [BarbUnit],
    enemy_units: &[BarbUnit],
    cities: &[CitySnapshot],
    camps: &[BarbCamp],
    map: &BarbarianMap,
    params: &BarbParams,
    turn: u32,
) -> Vec<BarbCommand> {
    let enemies = enemy_units
        .iter()
        .filter(|unit| !is_barbarian(unit.owner_id))
        .collect::<Vec<_>>();
    let all_units = units
        .iter()
        .chain(enemy_units.iter())
        .map(BarbUnit::position)
        .collect::<BTreeSet<_>>();
    let unit_snapshot = units.to_vec();
    let mut rally_occupants = unit_snapshot.clone();
    rally_occupants.extend_from_slice(enemy_units);
    let mut commands = Vec::new();
    let rally_commands = plan_barbarian_rally(units, camps, map, &rally_occupants);
    let rallied_ids = rally_commands
        .iter()
        .map(BarbCommand::unit_id)
        .collect::<BTreeSet<_>>();
    commands.extend(rally_commands);

    for unit in units.iter_mut() {
        if unit.movement_left == 0
            || unit.owner_id != BARBARIAN_OWNER_ID
            || unit.embarked
            || unit.sea_raider
            || rallied_ids.contains(&unit.id)
        {
            continue;
        }
        let occupied = all_units
            .iter()
            .copied()
            .filter(|coordinate| *coordinate != unit.position())
            .collect::<BTreeSet<_>>();

        if unit
            .health_fraction
            .is_some_and(|health| health < params.retreat_health_fraction)
        {
            if let Some(camp) = nearest(unit.position(), camps.iter(), |camp| camp.position()) {
                if unit.position().distance(camp.position()) > 1 {
                    if let Some(step) = path_step(map, unit.position(), camp.position(), &occupied)
                    {
                        commands.push(BarbCommand::Move {
                            unit_id: unit.id,
                            to: step,
                        });
                    }
                }
            }
            continue;
        }

        if let Some(enemy) = enemies
            .iter()
            .find(|enemy| unit.position().distance(enemy.position()) == 1)
        {
            commands.push(BarbCommand::Attack {
                unit_id: unit.id,
                target_unit_id: enemy.id,
            });
            continue;
        }

        let own_cities = cities
            .iter()
            .filter(|city| !is_barbarian(city.owner_id))
            .collect::<Vec<_>>();
        let home = home_camp(unit, camps, params.camp_control_radius);
        let orphaned =
            unit.camp_id.is_some() && !camps.iter().any(|camp| Some(camp.id) == unit.camp_id);
        if orphaned {
            if unit.orphaned_at_turn.is_none() {
                unit.orphaned_at_turn = Some(turn);
            }
        } else {
            unit.orphaned_at_turn = None;
        }
        let orphaned_expired = orphaned
            && unit.orphaned_at_turn.is_some_and(|started| {
                turn.saturating_sub(started) >= params.orphaned_chase_turn_limit
            });
        let raid_ready = (orphaned && !orphaned_expired)
            || home.is_some_and(|camp| camp_raid_ready(camp, &unit_snapshot, params));
        let chase_radius = if raid_ready {
            u32::MAX
        } else {
            params.aggro_radius
        };
        let mut city_targets = own_cities
            .iter()
            .copied()
            .filter(|city| {
                let undefended = !enemies
                    .iter()
                    .any(|enemy| enemy.position() == city.position());
                !undefended || !unit.cleared_city_ids.contains(&city.id)
            })
            .collect::<Vec<_>>();
        if city_targets.is_empty() {
            city_targets = own_cities.clone();
            if !city_targets.is_empty() {
                if let Some(last) = unit.cleared_city_ids.iter().next_back().copied() {
                    unit.cleared_city_ids.clear();
                    unit.cleared_city_ids.insert(last);
                }
            }
        }

        // Revisit candidates are a last resort. A defended or otherwise new
        // city always wins over a city this unit has already cleared.
        let considered = city_targets
            .iter()
            .map(|city| city.id)
            .collect::<BTreeSet<_>>();

        let nearest_enemy = nearest(unit.position(), enemies.iter(), |enemy| enemy.position());
        let mut targets = city_targets
            .clone()
            .into_iter()
            .map(|city| {
                (
                    city.position(),
                    city.id,
                    unit.position().distance(city.position()),
                    true,
                )
            })
            .collect::<Vec<_>>();
        targets.extend(
            own_cities
                .iter()
                .filter(|city| !considered.contains(&city.id))
                .map(|city| {
                    (
                        city.position(),
                        city.id,
                        unit.position().distance(city.position()),
                        true,
                    )
                }),
        );
        if let Some(enemy) = nearest_enemy {
            targets.push((
                enemy.position(),
                enemy.id,
                unit.position().distance(enemy.position()),
                false,
            ));
        }
        targets.sort_by_key(|target| (target.2, target.0));

        if let Some(city) = city_targets
            .iter()
            .min_by_key(|city| unit.position().distance(city.position()))
        {
            if unit.position().distance(city.position()) <= 1
                && !enemies
                    .iter()
                    .any(|enemy| enemy.position() == city.position())
            {
                unit.cleared_city_ids.insert(city.id);
            }
        }

        let mut moved = false;
        for (target, _target_id, distance, _is_city) in targets {
            if distance > chase_radius {
                continue;
            }
            if let Some(step) = path_step(map, unit.position(), target, &occupied) {
                commands.push(BarbCommand::Move {
                    unit_id: unit.id,
                    to: step,
                });
                moved = true;
                break;
            }
        }
        if moved || raid_ready {
            continue;
        }
        if let Some(camp) =
            home.or_else(|| nearest(unit.position(), camps.iter(), |camp| camp.position()))
        {
            if unit.position().distance(camp.position()) > 1 {
                if let Some(step) = path_step(map, unit.position(), camp.position(), &occupied) {
                    commands.push(BarbCommand::Move {
                        unit_id: unit.id,
                        to: step,
                    });
                }
            }
        }
    }
    commands
}

/// Alias matching the TypeScript domain name.
pub fn decide_moves(
    units: &mut [BarbUnit],
    enemy_units: &[BarbUnit],
    cities: &[CitySnapshot],
    camps: &[BarbCamp],
    map: &BarbarianMap,
    params: &BarbParams,
    turn: u32,
) -> Vec<BarbCommand> {
    decide_barbarian_moves(units, enemy_units, cities, camps, map, params, turn)
}

/// A barbarian-owned city uses the camp cadence to grow a free garrison.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BarbCityGarrison {
    pub city_id: u64,
    pub q: i32,
    pub r: i32,
    pub spawn_cooldown: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BarbCityGarrisonSpawn {
    pub city_id: u64,
    pub q: i32,
    pub r: i32,
    pub unit_type: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct BarbCityGarrisonTick {
    pub cities: Vec<BarbCityGarrison>,
    pub spawns: Vec<BarbCityGarrisonSpawn>,
}

pub fn tick_barbarian_city_garrisons(
    cities: &[BarbCityGarrison],
    barb_units: &[BarbUnit],
    all_units: &[BarbUnit],
    map: &BarbarianMap,
    params: &BarbParams,
) -> BarbCityGarrisonTick {
    let mut occupied = occupied_units(all_units);
    let mut result = BarbCityGarrisonTick::default();
    for city in cities {
        let cooldown = city.spawn_cooldown.saturating_sub(1);
        let owned = barb_units
            .iter()
            .filter(|unit| {
                unit.position().distance(HexCoord::new(city.q, city.r))
                    <= params.camp_control_radius
            })
            .count();
        if cooldown > 0 || owned >= params.units_per_camp {
            result.cities.push(BarbCityGarrison {
                spawn_cooldown: cooldown,
                ..city.clone()
            });
            continue;
        }
        let Some(spot) = free_adjacent_land(HexCoord::new(city.q, city.r), map, &occupied) else {
            result.cities.push(BarbCityGarrison {
                spawn_cooldown: 0,
                ..city.clone()
            });
            continue;
        };
        occupied.insert(spot);
        result.spawns.push(BarbCityGarrisonSpawn {
            city_id: city.city_id,
            q: spot.q,
            r: spot.r,
            unit_type: params.unit_type.clone(),
        });
        result.cities.push(BarbCityGarrison {
            spawn_cooldown: params.spawn_interval,
            ..city.clone()
        });
    }
    result
}

/// Compatibility aliases for callers using explicit barbarian prefixes.
pub fn spawn_barbarian_camps(
    map: &BarbarianMap,
    existing: &[BarbCamp],
    cities: &[CitySnapshot],
    params: &BarbParams,
    seed: u32,
) -> Vec<BarbCamp> {
    spawn_camps(map, existing, cities, params, seed)
}

pub fn tick_barbarian_camps(
    camps: &[BarbCamp],
    barb_units: &[BarbUnit],
    all_units: &[BarbUnit],
    map: &BarbarianMap,
    params: &BarbParams,
) -> (Vec<BarbCamp>, Vec<BarbSpawn>) {
    tick_camps(camps, barb_units, all_units, map, params)
}
