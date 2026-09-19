//! Minimal, deterministic end-to-end game slice used by the Tauri shell.
//!
//! This module intentionally stops at the first playable loop: create a map and
//! a human start, select one unit, move it to a legal adjacent hex, and advance
//! the turn through the canonical event queue.  Larger game systems remain
//! separate domains and are not pulled into this vertical slice.

use serde::{Deserialize, Serialize};
use std::{error::Error, fmt};

use super::{events::*, PositionDto};

pub const PLAYABLE_STATE_VERSION: u16 = 1;
const DEFAULT_SEED: u32 = 42;
const HUMAN_PLAYER_ID: u64 = 1;
const CAPITAL_ID: u64 = 1;
const STARTING_UNIT_ID: u64 = 1;
const START_X: u16 = 2;
const START_Y: u16 = 1;
const MOVE_TARGET_X: u16 = 3;

/// World-generation density controls collected by the web-parity wizard.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct PlayableWorldDensity {
    pub resources: String,
    pub rivers: String,
    pub desert: String,
    pub forest: String,
    pub relief: String,
}

impl Default for PlayableWorldDensity {
    fn default() -> Self {
        Self {
            resources: "medium".to_owned(),
            rivers: "medium".to_owned(),
            desert: "medium".to_owned(),
            forest: "medium".to_owned(),
            relief: "medium".to_owned(),
        }
    }
}

/// Advanced parameters carried by the web-parity wizard.
///
/// The first slice stores these values in the versioned start DTO so a later
/// generator can consume them without changing the bridge shape.  Values not
/// executed by the slice are explicitly marked in `unsupported_features`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct PlayableAdvancedParams {
    pub barbarians_level: String,
    pub battle_always_manual: bool,
    pub victory_mode: String,
    pub building_cost_pace: String,
    #[serde(rename = "kosztJednostekPace")]
    pub unit_cost_pace: String,
    #[serde(rename = "wzrostLudnosciPace")]
    pub population_growth_pace: String,
    #[serde(rename = "ruchSwiataPace")]
    pub world_movement_pace: String,
    pub land_fraction_percent: u8,
    pub land_fraction_custom: bool,
    pub city_state_difficulty_override: Option<String>,
    pub city_limit_base: u16,
}

impl Default for PlayableAdvancedParams {
    fn default() -> Self {
        Self {
            barbarians_level: "normalny".to_owned(),
            battle_always_manual: false,
            victory_mode: "moc_i_dominacja".to_owned(),
            building_cost_pace: "niski".to_owned(),
            unit_cost_pace: "niski".to_owned(),
            population_growth_pace: "wysoki".to_owned(),
            world_movement_pace: "krotki".to_owned(),
            land_fraction_percent: 30,
            land_fraction_custom: false,
            city_state_difficulty_override: None,
            city_limit_base: 10,
        }
    }
}

/// Parameters collected by the web-parity new-game wizard.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct StartGameParams {
    pub civ_id: String,
    pub civ_name: String,
    pub epoch: String,
    pub epoch_id: String,
    pub difficulty: String,
    pub map_size: String,
    pub rivals: u16,
    pub speed: String,
    pub world_type: String,
    /// Canonical engine key matching the web DTO's `typSwiata` field.
    #[serde(rename = "typSwiata")]
    pub world_type_id: String,
    pub seed: u32,
    pub map_quality_label: String,
    pub map_quality: String,
    pub render_quality_label: String,
    pub render_quality: String,
    pub map_detail_quality_label: String,
    pub map_detail_quality: String,
    pub civ_types_count: u16,
    pub city_states_count: u16,
    pub world_density: PlayableWorldDensity,
    pub world_density_labels: PlayableWorldDensity,
    pub land_fraction_percent: u8,
    pub advanced: PlayableAdvancedParams,
    pub selected_ai_civ_ids: Vec<String>,
    pub village_rewards_enabled: bool,
    /// Feature-level status prevents unsupported wizard values being silently
    /// presented as implemented gameplay.
    pub unsupported_features: Vec<String>,
}

impl Default for StartGameParams {
    fn default() -> Self {
        Self {
            civ_id: "rzymianie".to_owned(),
            civ_name: "Rzymianie".to_owned(),
            epoch: "Epoka Kamienia".to_owned(),
            epoch_id: "kamien".to_owned(),
            difficulty: "Normalny".to_owned(),
            map_size: "Standardowy".to_owned(),
            rivals: 6,
            speed: "Normalna".to_owned(),
            world_type: "Kontynenty".to_owned(),
            world_type_id: "kontynenty".to_owned(),
            seed: DEFAULT_SEED,
            map_quality_label: "Średnia".to_owned(),
            map_quality: "medium".to_owned(),
            render_quality_label: "Średnia".to_owned(),
            render_quality: "medium".to_owned(),
            map_detail_quality_label: "Średnia".to_owned(),
            map_detail_quality: "medium".to_owned(),
            civ_types_count: 6,
            city_states_count: 6,
            world_density: PlayableWorldDensity::default(),
            world_density_labels: PlayableWorldDensity {
                resources: "Normalnie".to_owned(),
                rivers: "Normalnie".to_owned(),
                desert: "Normalnie".to_owned(),
                forest: "Normalnie".to_owned(),
                relief: "Normalnie".to_owned(),
            },
            land_fraction_percent: 30,
            advanced: PlayableAdvancedParams::default(),
            selected_ai_civ_ids: Vec::new(),
            village_rewards_enabled: true,
            unsupported_features: vec![
                "rivals:NOT_IMPLEMENTED".to_owned(),
                "difficulty:NOT_IMPLEMENTED".to_owned(),
                "speed:NOT_IMPLEMENTED".to_owned(),
                "worldType:NOT_IMPLEMENTED".to_owned(),
                "typSwiata:NOT_IMPLEMENTED".to_owned(),
                "mapQuality:NOT_IMPLEMENTED".to_owned(),
                "renderQuality:NOT_IMPLEMENTED".to_owned(),
                "mapDetailQuality:NOT_IMPLEMENTED".to_owned(),
                "civTypesCount:NOT_IMPLEMENTED".to_owned(),
                "cityStatesCount:NOT_IMPLEMENTED".to_owned(),
                "worldDensity:NOT_IMPLEMENTED".to_owned(),
                "landFractionPercent:NOT_IMPLEMENTED".to_owned(),
                "advanced:NOT_IMPLEMENTED".to_owned(),
                "selectedAiCivIds:NOT_IMPLEMENTED".to_owned(),
                "villageRewardsEnabled:NOT_IMPLEMENTED".to_owned(),
            ],
        }
    }
}

impl StartGameParams {
    fn normalized(self) -> Self {
        Self {
            seed: if self.seed == 0 {
                DEFAULT_SEED
            } else {
                self.seed
            },
            ..self
        }
    }

    fn validate(&self) -> Result<(), PlayableError> {
        if self.civ_id.trim().is_empty() {
            return Err(PlayableError::InvalidStartParams(
                "civId must not be empty".to_owned(),
            ));
        }
        if self.civ_name.trim().is_empty() {
            return Err(PlayableError::InvalidStartParams(
                "civName must not be empty".to_owned(),
            ));
        }
        if self.epoch_id.trim().is_empty() {
            return Err(PlayableError::InvalidStartParams(
                "epochId must not be empty".to_owned(),
            ));
        }
        if self.world_type_id.trim().is_empty() {
            return Err(PlayableError::InvalidStartParams(
                "typSwiata must not be empty".to_owned(),
            ));
        }
        if self.rivals > 32 {
            return Err(PlayableError::InvalidStartParams(
                "rivals must be at most 32".to_owned(),
            ));
        }
        if self.civ_types_count == 0 {
            return Err(PlayableError::InvalidStartParams(
                "civTypesCount must be greater than zero".to_owned(),
            ));
        }
        if self.land_fraction_percent > 100 {
            return Err(PlayableError::InvalidStartParams(
                "landFractionPercent must be between 0 and 100".to_owned(),
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlayableTerrain {
    Plains,
    Hills,
    Forest,
    Water,
}

impl PlayableTerrain {
    pub const fn is_passable(self) -> bool {
        !matches!(self, Self::Water)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableTile {
    pub position: PositionDto,
    pub terrain: PlayableTerrain,
    pub passable: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableMap {
    pub width: u16,
    pub height: u16,
    pub tiles: Vec<PlayableTile>,
}

impl PlayableMap {
    pub fn tile(&self, position: PositionDto) -> Option<&PlayableTile> {
        if !self.contains(position) {
            return None;
        }
        let index = usize::from(position.y()) * usize::from(self.width) + usize::from(position.x());
        self.tiles.get(index)
    }

    pub const fn contains(&self, position: PositionDto) -> bool {
        position.x() < self.width && position.y() < self.height
    }

    fn empty() -> Self {
        Self {
            width: 0,
            height: 0,
            tiles: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayablePlayer {
    pub id: u64,
    pub name: String,
    pub civilization: String,
    pub is_human: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCity {
    pub id: u64,
    pub owner_id: u64,
    pub name: String,
    pub position: PositionDto,
    pub is_capital: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlayableUnitKind {
    Warrior,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableUnit {
    pub id: u64,
    pub owner_id: u64,
    pub kind: PlayableUnitKind,
    pub position: PositionDto,
    pub movement: u8,
    pub movement_max: u8,
    pub selected: bool,
}

/// The state DTO sent to the Tauri frontend after every command.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableState {
    pub state_version: u16,
    pub session_id: String,
    pub params: StartGameParams,
    pub map: PlayableMap,
    pub players: Vec<PlayablePlayer>,
    pub cities: Vec<PlayableCity>,
    pub units: Vec<PlayableUnit>,
    pub selected_unit_id: Option<u64>,
    pub turn: u32,
    pub phase: TurnPhase,
    pub last_advanced_phases: Vec<TurnPhase>,
    pub status: String,
}

impl PlayableState {
    /// Empty state used only by the deterministic bridge mock.
    pub fn empty() -> Self {
        Self {
            state_version: PLAYABLE_STATE_VERSION,
            session_id: "mock".to_owned(),
            params: StartGameParams::default(),
            map: PlayableMap::empty(),
            players: Vec::new(),
            cities: Vec::new(),
            units: Vec::new(),
            selected_unit_id: None,
            turn: 1,
            phase: TurnPhase::PlayerActions,
            last_advanced_phases: Vec::new(),
            status: "Brak aktywnej sesji.".to_owned(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlayableError {
    InvalidStartParams(String),
    UnitNotFound(u64),
    UnitNotOwned(u64),
    UnitNotSelected(u64),
    DestinationOutOfBounds(PositionDto),
    DestinationImpassable(PositionDto),
    DestinationNotAdjacent,
    DestinationOutOfRange { distance: u32, movement: u8 },
    TurnPhaseQueueIncomplete { expected: usize, actual: usize },
    DuplicatePlayer(u64),
}

impl fmt::Display for PlayableError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidStartParams(message) => {
                write!(formatter, "invalid start params: {message}")
            }
            Self::UnitNotFound(id) => write!(formatter, "unit {id} does not exist"),
            Self::UnitNotOwned(id) => {
                write!(formatter, "unit {id} is not owned by the human player")
            }
            Self::UnitNotSelected(id) => write!(formatter, "select unit {id} before moving it"),
            Self::DestinationOutOfBounds(position) => {
                write!(formatter, "destination {position} is outside the map")
            }
            Self::DestinationImpassable(position) => {
                write!(formatter, "destination {position} is not passable")
            }
            Self::DestinationNotAdjacent => {
                formatter.write_str("a unit may move only to an adjacent hex")
            }
            Self::DestinationOutOfRange { distance, movement } => write!(
                formatter,
                "destination is {distance} hexes away but only {movement} movement remains"
            ),
            Self::TurnPhaseQueueIncomplete { expected, actual } => write!(
                formatter,
                "turn phase queue resolved {actual} phases; expected {expected}"
            ),
            Self::DuplicatePlayer(id) => write!(formatter, "player {id} already exists"),
        }
    }
}

impl Error for PlayableError {}

/// Mutable first-slice game with a deterministic phase queue.
#[derive(Debug, Clone)]
pub struct PlayableGame {
    state: PlayableState,
    phase_queue: EventQueue<TurnEvent>,
}

impl PlayableGame {
    pub fn new(params: StartGameParams) -> Result<Self, PlayableError> {
        let params = params.normalized();
        params.validate()?;
        let map = build_map(&params);
        let players = vec![PlayablePlayer {
            id: HUMAN_PLAYER_ID,
            name: params.civ_name.clone(),
            civilization: params.civ_id.clone(),
            is_human: true,
        }];
        let cities = vec![PlayableCity {
            id: CAPITAL_ID,
            owner_id: HUMAN_PLAYER_ID,
            name: capital_name(&params),
            position: PositionDto::new(1, 1),
            is_capital: true,
        }];
        let units = vec![PlayableUnit {
            id: STARTING_UNIT_ID,
            owner_id: HUMAN_PLAYER_ID,
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(START_X, START_Y),
            movement: 1,
            movement_max: 1,
            selected: false,
        }];
        let status = format!(
            "Sesja {} · {} · mapa {}. Wybierz jednostkę.",
            params.civ_name, params.epoch, params.map_size
        );
        let mut game = Self {
            state: PlayableState {
                state_version: PLAYABLE_STATE_VERSION,
                session_id: format!("{}-{}", params.civ_id, params.seed),
                params,
                map,
                players,
                cities,
                units,
                selected_unit_id: None,
                turn: 1,
                phase: TurnPhase::PlayerActions,
                last_advanced_phases: Vec::new(),
                status,
            },
            phase_queue: EventQueue::new(),
        };
        game.enqueue_turn_phases(1);
        Ok(game)
    }

    pub fn state(&self) -> &PlayableState {
        &self.state
    }

    pub fn pending_phase_count(&self) -> usize {
        self.phase_queue.len()
    }

    pub fn add_player(&mut self, id: u64, name: String) -> Result<(), PlayableError> {
        if self.state.players.iter().any(|player| player.id == id) {
            return Err(PlayableError::DuplicatePlayer(id));
        }
        self.state.players.push(PlayablePlayer {
            id,
            civilization: format!("player-{id}"),
            name,
            is_human: false,
        });
        self.state.status = "Dodano gracza testowego.".to_owned();
        Ok(())
    }

    pub fn select_unit(&mut self, unit_id: u64) -> Result<(), PlayableError> {
        let unit = self
            .state
            .units
            .iter()
            .find(|unit| unit.id == unit_id)
            .ok_or(PlayableError::UnitNotFound(unit_id))?;
        if unit.owner_id != HUMAN_PLAYER_ID {
            return Err(PlayableError::UnitNotOwned(unit_id));
        }
        for candidate in &mut self.state.units {
            candidate.selected = candidate.id == unit_id;
        }
        self.state.selected_unit_id = Some(unit_id);
        self.state.status = format!("Wybrano jednostkę {}. Kliknij sąsiedni heks.", unit_id);
        Ok(())
    }

    pub fn move_unit(
        &mut self,
        unit_id: u64,
        destination: PositionDto,
    ) -> Result<(), PlayableError> {
        if !self.state.map.contains(destination) {
            return Err(PlayableError::DestinationOutOfBounds(destination));
        }
        let tile = self
            .state
            .map
            .tile(destination)
            .expect("map contains destination");
        if !tile.passable {
            return Err(PlayableError::DestinationImpassable(destination));
        }
        let unit_index = self
            .state
            .units
            .iter()
            .position(|unit| unit.id == unit_id)
            .ok_or(PlayableError::UnitNotFound(unit_id))?;
        let unit = &self.state.units[unit_index];
        if unit.owner_id != HUMAN_PLAYER_ID {
            return Err(PlayableError::UnitNotOwned(unit_id));
        }
        if self.state.selected_unit_id != Some(unit_id) {
            return Err(PlayableError::UnitNotSelected(unit_id));
        }
        let distance = axial_distance(unit.position, destination);
        if distance == 0 {
            return Err(PlayableError::DestinationNotAdjacent);
        }
        if distance > u32::from(unit.movement) {
            return Err(PlayableError::DestinationOutOfRange {
                distance,
                movement: unit.movement,
            });
        }
        if distance != 1 {
            return Err(PlayableError::DestinationNotAdjacent);
        }
        let mut moved = unit.clone();
        moved.position = destination;
        moved.movement = moved.movement.saturating_sub(distance as u8);
        self.state.units[unit_index] = moved;
        self.state.status = format!("Jednostka {} ruszyła na {}.", unit_id, destination);
        Ok(())
    }

    pub fn advance_turn(&mut self) -> Result<(), PlayableError> {
        let current_turn = self.state.turn;
        let mut phases = Vec::with_capacity(PHASE_COUNT);
        while let Some(entry) = self.phase_queue.peek_next() {
            if entry.turn() != current_turn {
                break;
            }
            let entry = self
                .phase_queue
                .pop_next()
                .expect("peeked event remains in queue");
            phases.push(entry.phase());
        }
        if phases.len() != PHASE_COUNT {
            return Err(PlayableError::TurnPhaseQueueIncomplete {
                expected: PHASE_COUNT,
                actual: phases.len(),
            });
        }
        self.state.turn = self.state.turn.saturating_add(1);
        self.state.phase = TurnPhase::PlayerActions;
        self.state.last_advanced_phases = phases;
        self.state.selected_unit_id = None;
        for unit in &mut self.state.units {
            unit.selected = false;
            unit.movement = unit.movement_max;
        }
        self.enqueue_turn_phases(self.state.turn);
        self.state.status = format!("Tura {} rozpoczęta.", self.state.turn);
        Ok(())
    }

    fn enqueue_turn_phases(&mut self, turn: u32) {
        for phase in TurnPhase::all() {
            self.phase_queue
                .enqueue(turn, *phase, event_for_phase(turn, *phase));
        }
    }
}

fn capital_name(params: &StartGameParams) -> String {
    if params.civ_id == "rzymianie" {
        "Roma".to_owned()
    } else {
        format!("Stolica {}", params.civ_name)
    }
}

fn map_dimensions(map_size: &str) -> (u16, u16) {
    let normalized = map_size.to_lowercase();
    if normalized.contains("malenki")
        || normalized.contains("maleńki")
        || normalized.contains("tiny")
    {
        (5, 4)
    } else if normalized.contains("mały")
        || normalized.contains("maly")
        || normalized.contains("small")
    {
        (6, 4)
    } else if normalized.contains("duż")
        || normalized.contains("duz")
        || normalized.contains("large")
    {
        (10, 6)
    } else if normalized.contains("super") {
        (16, 10)
    } else if normalized.contains("ogrom") || normalized.contains("huge") {
        (12, 8)
    } else {
        (8, 5)
    }
}

fn build_map(params: &StartGameParams) -> PlayableMap {
    let (width, height) = map_dimensions(&params.map_size);
    let mut state = params.seed;
    let mut tiles = Vec::with_capacity(usize::from(width) * usize::from(height));
    for y in 0..height {
        for x in 0..width {
            let sample = next_seed(&mut state);
            let terrain = if (x == 0 && y == 0) || (x == 0 && y == 1) {
                PlayableTerrain::Water
            } else if y == 1 && x <= MOVE_TARGET_X + 1 {
                PlayableTerrain::Plains
            } else {
                match sample % 10 {
                    0 => PlayableTerrain::Water,
                    1..=2 => PlayableTerrain::Hills,
                    3..=4 => PlayableTerrain::Forest,
                    _ => PlayableTerrain::Plains,
                }
            };
            tiles.push(PlayableTile {
                position: PositionDto::new(x, y),
                terrain,
                passable: terrain.is_passable(),
            });
        }
    }
    PlayableMap {
        width,
        height,
        tiles,
    }
}

fn next_seed(state: &mut u32) -> u32 {
    *state = state.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
    *state
}

fn axial_distance(from: PositionDto, to: PositionDto) -> u32 {
    let dq = (i32::from(from.x()) - i32::from(to.x())).unsigned_abs();
    let dr = (i32::from(from.y()) - i32::from(to.y())).unsigned_abs();
    let ds = (i32::from(from.x()) + i32::from(from.y()) - i32::from(to.x()) - i32::from(to.y()))
        .unsigned_abs();
    dq.max(dr).max(ds)
}

fn event_for_phase(turn: u32, phase: TurnPhase) -> TurnEvent {
    match phase {
        TurnPhase::StartTurn => TurnEvent::TurnStarted(turn),
        TurnPhase::PlayerActions => TurnEvent::PlayerTurnEnded(turn),
        TurnPhase::Diplomacy => TurnEvent::DiplomacyTick,
        TurnPhase::Economy => TurnEvent::EconomyTick,
        TurnPhase::Production => TurnEvent::ProductionTick,
        TurnPhase::Ai => TurnEvent::AiTurn(turn),
        TurnPhase::Barbarians => TurnEvent::BarbariansTick,
        TurnPhase::Victory => TurnEvent::VictoryCheck,
        TurnPhase::EndTurn => TurnEvent::TurnEnded(turn),
    }
}
