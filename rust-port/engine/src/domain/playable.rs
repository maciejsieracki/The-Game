//! Minimal, deterministic end-to-end game slice used by the Tauri shell.
//!
//! This module intentionally stops at the first playable loop: create a map and
//! a human start, select one unit, move it to a legal adjacent hex, and advance
//! the turn through the canonical event queue.  Larger game systems remain
//! separate domains and are not pulled into this vertical slice.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::{error::Error, fmt};

use super::building_costs::p6_7b::StockRecord;
use super::turn_war_pipeline::{run_war_turn, WarTurnConfig, WarTurnContext, WarTurnInputs};
use super::unit_replace::{UnitReplaceFail, UnitReplaceResult, UnitReplaceTarget};
use super::unit_replace_wiring::{replace_unit_wired, ReplaceCity, ReplaceUnitDef};
use super::war_turn_state::WarTurnState;
use super::{events::*, CityId, PlayerId, PositionDto, UnitId};

pub const PLAYABLE_STATE_VERSION: u16 = 1;
const DEFAULT_SEED: u32 = 42;
const HUMAN_PLAYER_ID: PlayerId = PlayerId::new(1);
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
    pub id: PlayerId,
    pub name: String,
    pub civilization: String,
    pub is_human: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCity {
    pub id: CityId,
    pub owner_id: PlayerId,
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
    pub id: UnitId,
    pub owner_id: PlayerId,
    pub kind: PlayableUnitKind,
    pub position: PositionDto,
    pub movement: u8,
    pub movement_max: u8,
    pub selected: bool,
}

/// P6-UNIT-REPLACE-L3 etap 2: stan jednostki potrzebny do zamiany (web: pola `unit`).
/// Trzymany obok `PlayableUnit` (nie w nim), zeby nie lamac literalow tej struktury w testach.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct PlayableReplaceUnit {
    /// Typ units.json; `None` = typ startowy (`base_type_id`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub type_id: Option<String>,
    /// Kategoria modelu po zamianie (web: `unit.category`); `None` = jeszcze nie zamieniana.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    /// HP; `None` = brak pola (web `unit.hp ?? oldMaxHp`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hp: Option<f64>,
    /// Maks. HP; `None` = brak pola.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hp_max: Option<f64>,
    /// Zamiana uzyta w biezacej turze (web: `replaceUsedThisTurn`).
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub replace_used_this_turn: bool,
}

/// P6-UNIT-REPLACE-L3 etap 2: ekonomia potrzebna do zamiany jednostek (web: skarbiec gracza,
/// `city.surowce`, stan jednostek). Domyslna = zachowanie sprzed etapu 2; pole jest pomijane
/// w DTO i zapisie, gdy jest domyslne, wiec zapisy sprzed zmiany ladują sie i zapisuja bajt w bajt.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct PlayableReplaceEconomy {
    /// Skarbiec gracza ludzkiego (Pieniadz).
    #[serde(skip_serializing_if = "is_zero_f64")]
    pub treasury: f64,
    /// Pula surowcow miast (klucz: id miasta).
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub city_stock: BTreeMap<u64, StockRecord>,
    /// Stan zamiany jednostek (klucz: id jednostki); brak wpisu = stan domyslny.
    #[serde(skip_serializing_if = "BTreeMap::is_empty")]
    pub units: BTreeMap<u64, PlayableReplaceUnit>,
}

impl PlayableReplaceEconomy {
    pub fn is_default(&self) -> bool {
        *self == Self::default()
    }
}

/// `Eq` jest wymagany przez `PlayableState` (bridge.rs derywuje `Eq` nad `EngineState`).
/// Ekonomia przyjmuje tylko skonczone liczby: ustawiaja ja `set_*` (odrzucaja NaN/Inf),
/// JSON ich nie niesie, a adapter odejmuje tylko skonczone kwoty, wiec `==` jest zwrotne.
impl Eq for PlayableReplaceEconomy {}

fn is_zero_f64(value: &f64) -> bool {
    *value == 0.0
}

/// Typ startowy jednostki (units.json) dla `PlayableUnitKind`.
const fn base_type_id(kind: PlayableUnitKind) -> &'static str {
    match kind {
        PlayableUnitKind::Warrior => "Wojownik",
    }
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
    /// P6-WIRE-WAR-STATE (D1=B): stan wojny tury; pusty => pole pomijane w DTO i zapisie.
    #[serde(default, skip_serializing_if = "WarTurnState::is_default")]
    pub war: WarTurnState,
    /// P6-UNIT-REPLACE-L3 etap 2: ekonomia zamiany jednostek; pusta => pole pomijane.
    #[serde(default, skip_serializing_if = "PlayableReplaceEconomy::is_default")]
    pub economy: PlayableReplaceEconomy,
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
            war: WarTurnState::default(),
            economy: PlayableReplaceEconomy::default(),
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
    DestinationOutOfRange {
        distance: u32,
        movement: u8,
    },
    TurnPhaseQueueIncomplete {
        expected: usize,
        actual: usize,
    },
    DuplicatePlayer(u64),
    WarTurn(String),
    /// P6-UNIT-REPLACE-L3: brak miasta gracza (pula surowcow zamiany).
    NoCityForReplace,
    /// P6-UNIT-REPLACE-L3: skarbiec/pula z wartoscia NaN lub nieskonczona (odrzucane).
    NonFiniteEconomy,
    /// P6-UNIT-REPLACE-L3: zamiana odrzucona przez reguly pinu (koszt, magazyn, blokada, uzycie).
    UnitReplaceRejected {
        reason: UnitReplaceFail,
        detail: Option<String>,
    },
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
            Self::WarTurn(message) => write!(formatter, "war turn: {message}"),
            Self::NonFiniteEconomy => {
                formatter.write_str("economy value must be finite (no NaN or infinity)")
            }
            Self::NoCityForReplace => {
                formatter.write_str("unit replacement needs a city owned by the human player")
            }
            Self::UnitReplaceRejected { reason, detail } => match detail {
                Some(detail) => write!(
                    formatter,
                    "unit replacement rejected: {reason:?} ({detail})"
                ),
                None => write!(formatter, "unit replacement rejected: {reason:?}"),
            },
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
            id: CityId::new(CAPITAL_ID),
            owner_id: HUMAN_PLAYER_ID,
            name: capital_name(&params),
            position: PositionDto::new(1, 1),
            is_capital: true,
        }];
        let units = vec![PlayableUnit {
            id: UnitId::new(STARTING_UNIT_ID),
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
                war: WarTurnState::default(),
                economy: PlayableReplaceEconomy::default(),
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
        if self
            .state
            .players
            .iter()
            .any(|player| player.id.get() == id)
        {
            return Err(PlayableError::DuplicatePlayer(id));
        }
        self.state.players.push(PlayablePlayer {
            id: PlayerId::new(id),
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
            .find(|unit| unit.id.get() == unit_id)
            .ok_or(PlayableError::UnitNotFound(unit_id))?;
        if unit.owner_id != HUMAN_PLAYER_ID {
            return Err(PlayableError::UnitNotOwned(unit_id));
        }
        for candidate in &mut self.state.units {
            candidate.selected = candidate.id.get() == unit_id;
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
            .position(|unit| unit.id.get() == unit_id)
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

    /// Ustawia skarbiec gracza ludzkiego (scenariusz startowy/testowy; brak komendy w UI).
    /// Wartosci NaN i nieskonczone sa odrzucane (patrz `impl Eq` dla ekonomii).
    pub fn set_human_treasury(&mut self, value: f64) -> Result<(), PlayableError> {
        if !value.is_finite() {
            return Err(PlayableError::NonFiniteEconomy);
        }
        self.state.economy.treasury = value;
        Ok(())
    }

    /// Ustawia pule surowcow stolicy gracza ludzkiego (scenariusz startowy/testowy).
    /// Wartosci NaN i nieskonczone sa odrzucane.
    pub fn set_capital_stock(&mut self, stock: StockRecord) -> Result<(), PlayableError> {
        let city_id = self
            .capital_id_of_human()
            .ok_or(PlayableError::NoCityForReplace)?;
        if !stock.values().all(|amount| amount.is_finite()) {
            return Err(PlayableError::NonFiniteEconomy);
        }
        self.state.economy.city_stock.insert(city_id, stock);
        Ok(())
    }

    fn capital_id_of_human(&self) -> Option<u64> {
        self.state
            .cities
            .iter()
            .find(|city| city.owner_id == HUMAN_PLAYER_ID && city.is_capital)
            .map(|city| city.id.get())
    }

    /// P6-UNIT-REPLACE-L3 etap 2: komenda gracza "Zastap" przez adapter `replace_unit_wired`.
    /// Pieniadz z skarbca gracza, surowce z puli stolicy (jedyne miasto gracza w tym wycinku).
    /// `defs` = tabela definicji jednostek; `gate` = blokada z reguly pinu (np. limit super-jednostek).
    /// Odrzucenie zwraca `UnitReplaceRejected` i nie zmienia stanu.
    pub fn replace_unit(
        &mut self,
        unit_id: u64,
        new_type_id: &str,
        defs: &BTreeMap<String, ReplaceUnitDef>,
        gate: Option<String>,
    ) -> Result<(), PlayableError> {
        let unit_index = self
            .state
            .units
            .iter()
            .position(|unit| unit.id.get() == unit_id)
            .ok_or(PlayableError::UnitNotFound(unit_id))?;
        let unit = &self.state.units[unit_index];
        if unit.owner_id != HUMAN_PLAYER_ID {
            return Err(PlayableError::UnitNotOwned(unit_id));
        }
        let city_id = self
            .capital_id_of_human()
            .ok_or(PlayableError::NoCityForReplace)?;
        let replace_state = self
            .state
            .economy
            .units
            .get(&unit_id)
            .cloned()
            .unwrap_or_default();
        let mut target = UnitReplaceTarget {
            type_id: replace_state
                .type_id
                .clone()
                .unwrap_or_else(|| base_type_id(unit.kind).to_owned()),
            category: replace_state.category.clone(),
            hp: replace_state.hp,
            hp_max: replace_state.hp_max,
            ruch_left: f64::from(unit.movement),
            replace_used_this_turn: replace_state.replace_used_this_turn,
        };
        let mut city = ReplaceCity {
            treasury: self.state.economy.treasury,
            pool: self
                .state
                .economy
                .city_stock
                .get(&city_id)
                .cloned()
                .unwrap_or_default(),
        };
        // Tryb gracza: bez synchronizacji hpMax (ta galaz nalezy do AI w web).
        match replace_unit_wired(&mut target, new_type_id, defs, &mut city, gate, false) {
            UnitReplaceResult::Ok { .. } => {
                self.state.economy.treasury = city.treasury;
                self.state.economy.city_stock.insert(city_id, city.pool);
                self.state.economy.units.insert(
                    unit_id,
                    PlayableReplaceUnit {
                        type_id: Some(target.type_id),
                        category: target.category,
                        hp: target.hp,
                        hp_max: target.hp_max,
                        replace_used_this_turn: target.replace_used_this_turn,
                    },
                );
                // Adapter zeruje ruch_left (web: zamiana zuzywa ruch).
                self.state.units[unit_index].movement = target.ruch_left as u8;
                self.state.status = format!("Jednostka {unit_id} zamieniona na {new_type_id}.");
                Ok(())
            }
            UnitReplaceResult::Fail { reason, detail, .. } => {
                Err(PlayableError::UnitReplaceRejected { reason, detail })
            }
        }
    }

    pub fn advance_turn(&mut self) -> Result<(), PlayableError> {
        let current_turn = self.state.turn;
        // Migawka przed przejsciem tury: blad fazy wojny cofa kolejke i stan wojny (brak polowicznego zuzycia).
        let queue_before = self.phase_queue.clone();
        let war_before = self.state.war.clone();
        let mut phases = Vec::with_capacity(PHASE_COUNT);
        while let Some(entry) = self.phase_queue.peek_next() {
            if entry.turn() != current_turn {
                break;
            }
            let entry = self
                .phase_queue
                .pop_next()
                .expect("peeked event remains in queue");
            if entry.phase() == TurnPhase::Diplomacy {
                if let Err(error) = self.run_diplomacy_war_phase() {
                    self.phase_queue = queue_before;
                    self.state.war = war_before;
                    return Err(error);
                }
            }
            // P6-UNIT-REPLACE-L3 (kryterium 3c): PUNKT PODPIECIA AI-zamiany jednostek (`ai_replace_*`)
            // na fazie TurnPhase::Ai. Galaz celowo nie wykonuje nic: PlayableState nie niesie danych
            // ekonomii (skarbiec, pula miasta, definicje jednostek, limit udzialu), a atrapa bylaby
            // falszywym dowodem wiringu. Decyzja zakresu: zob. runs/R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1.
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
        for replace_state in self.state.economy.units.values_mut() {
            replace_state.replace_used_this_turn = false;
        }
        self.enqueue_turn_phases(self.state.turn);
        self.state.status = format!("Tura {} rozpoczęta.", self.state.turn);
        Ok(())
    }

    /// P6-WIRE-WAR-PIPELINE: jedyne wywolanie `run_war_turn` (faza Diplomacy).
    /// Deklaracje wojny z hamulca nie maja jeszcze efektow (W4/W8); zwracane sa tylko przez raport.
    fn run_diplomacy_war_phase(&mut self) -> Result<(), PlayableError> {
        let inputs = WarTurnInputs::from_playable(&self.state, &self.state.war);
        // Produkcja: brak ustawien par wojny i trybu multiwar w PlayableState (r4).
        let config = WarTurnConfig::new(BTreeMap::new(), false);
        let mut ctx = WarTurnContext {
            war: &mut self.state.war,
            turn: f64::from(self.state.turn),
            inputs: &inputs,
            config: &config,
        };
        run_war_turn(&mut ctx).map_err(|error| PlayableError::WarTurn(error.to_string()))?;
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

#[cfg(test)]
mod war_pipeline_advance_tests {
    use super::*;

    /// Gracz AI z miastem = para wojny, ktorej producenci (moc) nie istnieja w r3 -> fail-loud.
    fn game_with_ai_city() -> PlayableGame {
        let mut game = PlayableGame::new(StartGameParams {
            seed: 11,
            ..StartGameParams::default()
        })
        .expect("scenario");
        game.add_player(2, "AI".to_owned()).expect("ai");
        game.state.cities.push(PlayableCity {
            id: CityId::new(900),
            owner_id: PlayerId::new(2),
            name: "AI-city".to_owned(),
            position: PositionDto::new(5, 5),
            is_capital: true,
        });
        game
    }

    #[test]
    fn failing_war_phase_restores_queue_turn_and_war_state() {
        let mut game = game_with_ai_city();
        let queue_len = game.pending_phase_count();
        let turn = game.state().turn;
        let err = game.advance_turn().expect_err("brak wejsc mocy -> blad");
        assert!(matches!(err, PlayableError::WarTurn(_)), "{err:?}");
        assert_eq!(game.pending_phase_count(), queue_len, "kolejka cofnieta");
        assert_eq!(game.state().turn, turn, "tura sie nie zwieksza");
        assert!(game.state().war.is_default(), "stan wojny bez zmian");
        assert!(game.state().last_advanced_phases.is_empty());
    }

    #[test]
    fn repeated_advance_after_failure_fails_the_same_way_not_with_queue_incomplete() {
        let mut game = game_with_ai_city();
        let first = game.advance_turn().expect_err("blad 1");
        let second = game.advance_turn().expect_err("blad 2");
        assert_eq!(first, second);
        assert!(!matches!(
            second,
            PlayableError::TurnPhaseQueueIncomplete { .. }
        ));
    }
}
