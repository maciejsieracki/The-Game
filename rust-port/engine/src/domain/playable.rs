//! Minimal, deterministic end-to-end game slice used by the Tauri shell.
//!
//! This module intentionally stops at the first playable loop: create a map and
//! a human start, select one unit, move it to a legal adjacent hex, and advance
//! the turn through the canonical event queue.  Larger game systems remain
//! separate domains and are not pulled into this vertical slice.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::{error::Error, fmt};

use super::brake_power::{objective_power_for_owner, ObjectivePowerRaw};
use super::building_costs::p6_7b::StockRecord;
use super::mapgen::cluster_mass::{start_reveal_radius_for_difficulty, StartDifficulty};
use super::pathfinding::ruch_jednostek::Klucz;
use super::pathfinding::ruch_jednostek::MoveOccupancy;
use super::playable_movement::{
    klucz_of, occupied_for_move, plan_march_to, stack_limit_block_message, PlayableMoveModel,
    MARCH_FOREIGN_CITY_HINT, MARCH_NO_ROUTE_HINT,
};
use super::player::is_awaiting_first_player_city;
use super::siege_battle_apply::{self, ActiveSiegeBattle, SiegeBattleError, SiegeBattlePayload};
use super::terrain::visibility::fog_view::ExploredByHuman;
use super::turn_war_dipl_steps::apply_dipl_deltas_to_state;
use super::turn_war_inputs::{
    build_war_inputs, power_raw_for_owner, production_config, start_epoch_number,
};
use super::turn_war_pipeline::{run_war_turn, WarTurnContext};
use super::types::Difficulty;
use super::unit_replace::{UnitReplaceFail, UnitReplaceResult, UnitReplaceTarget};
use super::unit_replace_cost::ReplaceUnitProgress;
use super::unit_replace_defs::production_replace_defs_for_civ;
use super::unit_replace_wiring::{replace_unit_wired, ReplaceCity, ReplaceUnitDef};
use super::victory::{
    check_victory, VictoryInput, VictoryMode, VictoryResult, OSTATNIA_EPOKA_GRY_V1,
};
use super::war_turn_state::WarTurnState;
use super::{events::*, CityId, OwnerRef, PlayerId, PositionDto, UnitId};

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
    /// P6-STAN-ULEPSZENIA: warstwy ulepszen terenu (web `hex.ulepszenie` / `hex.ulepszenia`) dla heksow,
    /// ktore je maja. Brak wpisu = heks bez pol ulepszen. Pusta lista jest pomijana w zapisie, wiec zapisy
    /// sprzed zmiany laduja sie i zapisuja bajt w bajt.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub improvements: Vec<PlayableHexImprovement>,
}

/// P6-STAN-ULEPSZENIA: pola ulepszen jednego heksa (lustro `BuildHex.ulepszenie` / `BuildHex.ulepszenia`).
/// Lista zamiast mapy: klucz JSON nie moze byc krotka `(q, r)`. `None` = pole nieobecne (jak web undefined/null).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableHexImprovement {
    pub position: PositionDto,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ulepszenie: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ulepszenia: Option<Vec<String>>,
}

/// P6-STAN-ULEPSZENIA: rodzaj fortu w stanie (web `FortImprovementType`, `fort-territory.ts:30`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PlayableFortKind {
    Fort,
    Posterunek,
}

/// P6-STAN-ULEPSZENIA: fort lub posterunek (web `FortNode`, `fort-territory.ts`). Wezel zakladajacy terytorium
/// i wspolna granice; `contested_useless = Some(true)` = wezel bezuzyteczny (web odfiltrowuje go z wezlow).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableFort {
    pub q: i32,
    pub r: i32,
    pub owner_id: PlayerId,
    pub kind: PlayableFortKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contested_useless: Option<bool>,
    /// Web `builtAtTurn` (fort-territory.ts `FortNode`): tura budowy; z `seq` tworzy `order` wezla terytorium.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub built_at_turn: Option<i64>,
    /// Web `seq` (fort-territory.ts `FortNode`): kolejnosc budowy. Brak = wezel bez `order` (rozstrzyga odleglosc).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seq: Option<i64>,
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
            improvements: Vec::new(),
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
    /// Populacja miasta (web `City.population`). Zapis sprzed W8 r6 klocek 2 nie ma pola: domyslnie
    /// `FOUNDING_CITY_POPULATION` (1 = populacja zalozonego miasta, dotychczasowe zalozenie producentow).
    /// `PlayableState` NIE symuluje fazy Economy, wiec wartosc nie rosnie miedzy turami (znana luka).
    #[serde(default = "default_city_population")]
    pub population: u32,
    /// Skumulowana kultura miasta (web `kultura_skumulowana`); domyslnie 0 (zapis sprzed zmiany).
    /// Nie rosnie miedzy turami (brak symulacji Economy, znana luka).
    #[serde(default)]
    pub culture: u32,
}

/// Populacja nowo zalozonego miasta (web: miasto startuje z `population` 1).
pub const FOUNDING_CITY_POPULATION: u32 = 1;

fn default_city_population() -> u32 {
    FOUNDING_CITY_POPULATION
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
    /// Web `ruchLeft` (`number`, `RuntimeUnit`, `setup.ts:40`); P4-1H Q6: `f64` w [`MovementPoints`].
    pub movement: MovementPoints,
    /// Web `ruch` (`number`); P4-1H Q6: `f64` w [`MovementPoints`].
    pub movement_max: MovementPoints,
    pub selected: bool,
}

/// P4-1H Q6 (`R-RUSTPORT-P4-1H-MOVE-Q6`, errata 1 z Q4): punkty ruchu jednostki jako `f64` (web
/// `ruch` / `ruchLeft` to `number`; koszty drog sa ulamkowe: 1/3, 2/3, 0,2 - `road-movement.ts`).
///
/// Cienka obwoluta `f64` (wartosc: [`MovementPoints::get`]) zamiast golego `f64`, bo:
/// - `PlayableState` derywuje `Eq` (bridge derywuje `Eq` nad stanem): jak `PlayableReplaceEconomy`,
///   `Eq` jest reczny przy niezmienniku "tylko skonczone wartosci" (zrodla: `u8` ze startu, JSON - bez
///   NaN/Inf - oraz `max(0, pula - koszt)` z kosztem odcinka, ktory nigdy nie jest `Infinity`, bo
///   `truncatePathToBudget` nie wpuszcza heksa o koszcie `Infinity`);
/// - zapis/odczyt JSON pozostaje bajt w bajt: calkowita wartosc serializuje sie jak dawne `u8` (`1`,
///   nie `1.0`; tak tez `JSON.stringify` weba), ulamkowa jako liczba zmiennoprzecinkowa; odczyt
///   przyjmuje obie formy;
/// - istniejace wolania `f64::from(unit.movement)` (np. `war_world_view.rs`) zostaja bez zmian.
#[derive(Debug, Clone, Copy, Default, PartialEq, PartialOrd)]
pub struct MovementPoints(f64);

impl MovementPoints {
    pub const ZERO: Self = Self(0.0);

    /// Niezmiennik typu (podstawa recznego `Eq`): tylko skonczone wartosci. Pilnowany w buildach
    /// debug/test (`debug_assert!`); w release brak kosztu (obrona Q6, zarzut 4 Evaluatora).
    pub const fn new(value: f64) -> Self {
        debug_assert!(
            value.is_finite(),
            "MovementPoints: wartosc nieskonczona lub NaN"
        );
        Self(value)
    }

    pub const fn get(self) -> f64 {
        self.0
    }
}

/// Niezmiennik: tylko skonczone wartosci (patrz typ), wiec `==` jest zwrotne.
impl Eq for MovementPoints {}

impl From<u8> for MovementPoints {
    fn from(value: u8) -> Self {
        Self(f64::from(value))
    }
}

impl From<f64> for MovementPoints {
    fn from(value: f64) -> Self {
        Self::new(value)
    }
}

impl From<MovementPoints> for f64 {
    fn from(value: MovementPoints) -> Self {
        value.0
    }
}

/// Porownanie z literalem calkowitym (web `u.ruchLeft === 0`); dawne asercje `movement == 1` na `u8`.
impl PartialEq<i32> for MovementPoints {
    fn eq(&self, other: &i32) -> bool {
        self.0 == f64::from(*other)
    }
}

/// Najwieksza liczba calkowita dokladnie reprezentowana w `f64` (`Number.MAX_SAFE_INTEGER` + 1).
const MOVEMENT_EXACT_INT_LIMIT: f64 = 9_007_199_254_740_992.0;

impl Serialize for MovementPoints {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let value = self.0;
        if value.is_finite() && value.fract() == 0.0 && value.abs() <= MOVEMENT_EXACT_INT_LIMIT {
            // Calkowita wartosc jak dawne `u8` / web `JSON.stringify` (`-0` -> `0`).
            #[allow(clippy::cast_possible_truncation)]
            let int = value as i64;
            if int >= 0 {
                serializer.serialize_u64(int.unsigned_abs())
            } else {
                serializer.serialize_i64(int)
            }
        } else {
            serializer.serialize_f64(value)
        }
    }
}

impl<'de> Deserialize<'de> for MovementPoints {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        f64::deserialize(deserializer).map(Self)
    }
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
    /// Postep jednostki: web `battlesSurvived` (wejscie bonusu weterana do HP zamiany). Pomijane,
    /// gdy brak lub 0, wiec zapisy sprzed zmiany nie zmieniaja sie.
    #[serde(skip_serializing_if = "is_zero_opt_f64")]
    pub battles_survived: Option<f64>,
    /// Postep jednostki: web `parametryBonusProc` (wejscie bonusu parametrow do HP zamiany). Pomijane,
    /// gdy brak lub 0.
    #[serde(skip_serializing_if = "is_zero_opt_f64")]
    pub parametry_bonus_proc: Option<f64>,
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
    /// P6-WIRE-WAR-R7K7-C: skarbce AI (web `aiSkarbiecByOwner`), klucz: id wlasciciela AI. Gracz ludzki NIE
    /// wpisuje sie tu (jego skarbiec to `treasury`); `set_owner_treasury` to wymusza. Brak wpisu = producent
    /// nieobecny (blad przy uzyciu w handlu/danince), NIE zero.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub ai_treasury_by_owner: BTreeMap<u64, f64>,
    /// P6-WIRE-WAR-R7K7-C: pule Pracy wlascicieli (web `ownerPracaPool`), klucz: id wlasciciela (takze
    /// gracza). Brak wpisu = producent nieobecny (blad przy uzyciu), NIE zero.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub praca_pool_by_owner: BTreeMap<u64, f64>,
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

/// Pole postepu pomijane w zapisie, gdy brak (`None`) albo zerowe (liczone jak brak w web).
fn is_zero_opt_f64(value: &Option<f64>) -> bool {
    value.is_none_or(|v| v == 0.0)
}

/// Etykieta trudnosci stanu (`StartGameParams.difficulty`, domyslnie "Normalny") -> `Difficulty`.
/// Mapa 1:1 z web `main.ts:44372-44374` (`'Łatwy': 'easy'`, `'Normalny': 'normal'`, `'Trudny': 'hard'`)
/// oraz klucze `_menuDifficulty` (`easy` / `normal` / `hard`). Nieznana etykieta = blad.
fn replace_difficulty_of(label: &str) -> Result<Difficulty, PlayableError> {
    match label {
        "Normalny" | "normal" => Ok(Difficulty::Normal),
        "Łatwy" | "easy" => Ok(Difficulty::Easy),
        "Trudny" | "hard" => Ok(Difficulty::Hard),
        other => Err(PlayableError::ReplaceDifficultyUnknown(other.to_owned())),
    }
}

/// Typ startowy jednostki (units.json) dla `PlayableUnitKind`.
pub(crate) const fn base_type_id(kind: PlayableUnitKind) -> &'static str {
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
    /// P6-WIRE-WAR-STORES (W8 r6 klocek 3): magazyny budynkow, badan i religii miast; pusty => pole
    /// pomijane w DTO i zapisie (zapis sprzed zmiany ladowany przez `#[serde(default)]`).
    #[serde(default, skip_serializing_if = "PlayableStores::is_default")]
    pub stores: PlayableStores,
    /// P6-UNIT-REPLACE-L3 etap 2: ekonomia zamiany jednostek; pusta => pole pomijane.
    #[serde(default, skip_serializing_if = "PlayableReplaceEconomy::is_default")]
    pub economy: PlayableReplaceEconomy,
    /// P6-STAN-ULEPSZENIA: forty i posterunki (wezly zakladajace terytorium i wspolna granice); pusta => pole
    /// pomijane w DTO i zapisie (zapis sprzed zmiany laduje sie przez `#[serde(default)]`).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub forts: Vec<PlayableFort>,
    /// P6-ZWYCIESTWO-WIRING: flaga `graczKiedysMialMiasto` (pin main.ts:43472, per-owner set
    /// `playerEverOwnedCityByOwner` dla fotela 1). Pin NIE zapisuje tej flagi (gra/src/game/save.ts nie
    /// zawiera nazwy pola), wiec `#[serde(skip)]` jest zgodne z pinem i nie zmienia JSON (golden).
    /// Po wczytaniu flaga = `false`, a efektywna wartosc przy ocenie = `flaga || gracz ma miasto`,
    /// co odpowiada odtworzeniu ze miast z pinu (main.ts:46368-46370).
    #[serde(skip)]
    pub gracz_kiedys_mial_miasto: bool,
    /// R-RUSTPORT-P4-364-AWAITING-SEAT-R1 (D-AS-1): web `playerEverOwnedCityByOwner` (pin
    /// `main.ts:3042`, `Set<number>` per fotel) dla wlascicieli INNYCH niz fotel glowny
    /// `HUMAN_PLAYER_ID` (web `HUMAN_OWNER_PRIMARY`). Wpis fotela glownego to
    /// [`Self::gracz_kiedys_mial_miasto`] (pin czyta go jako `playerEverOwnedCityByOwner.has(
    /// HUMAN_OWNER_PRIMARY)`, `main.ts:34022`, `:43472`), wiec jeden fakt nie ma dwoch zrodel (D-AS-2,
    /// raport `01-operator-r1.md`). Odczyt i zapis wylacznie przez [`Self::ever_owned_city`] /
    /// [`Self::record_ever_owned_city`]; pelny zbior pinu: [`Self::player_ever_owned_city_by_owner`].
    /// Pin NIE zapisuje zbioru (odtwarza go przy wczytaniu ze miast, `main.ts:46368-46370`), wiec pole nie
    /// jest serializowane (`skip_serializing`: JSON stanu i zapisu bez zmian), a `default` laduje zapisy i
    /// stany sprzed zmiany.
    #[serde(default, skip_serializing)]
    pub player_ever_owned_city: BTreeSet<PlayerId>,
    /// P6-ZWYCIESTWO-WIRING: wynik konca gry (pin `gameOver`). `#[serde(skip)]`: pin nie zapisuje
    /// `gameOver` i resetuje go do `false` przy wczytaniu (main.ts:47333), wiec po wczytaniu gra trwa.
    #[serde(skip)]
    pub koniec_gry: Option<VictoryResult>,
    /// P4-1J: plany marszu, web `plannedMarches` (`main.ts:31004`, `Map<unitId, PlannedMarchDest>`).
    /// Kolejnosc wektora = kolejnosc web `Map` (iterowana np. `main.ts:31063`, `:31324`); jeden wpis na
    /// jednostke. Zapis/odczyt: `save_load` (`SavedPlannedMarch`, web `plannedMarchesToSave` /
    /// `plannedMarchesFromSave`). Pusty => pole pomijane w DTO i zapisie.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub planned_marches: Vec<PlayablePlannedMarch>,
    /// P4-1J: web `marchAttackTargets` (`main.ts:31016`, jednostka -> wroga jednostka). Web go NIE
    /// zapisuje: po wczytaniu odbudowuje z `attackUnitId` planow (`main.ts:46279`, `:46284-46286`).
    /// Czytany tylko po kluczu (`main.ts:25782`, `:25795`), wiec kolejnosc mapy nie ma znaczenia.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub march_attack_targets: BTreeMap<UnitId, UnitId>,
    /// P4-1J: web `marchStopNotified` (`main.ts:31007`): ostatni powiadomiony powod zatrzymania
    /// marszu. Web go NIE zapisuje i czysci przy wczytaniu (`main.ts:46273`).
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub march_stop_notified: BTreeMap<UnitId, PlayableMarchStopReason>,
    /// P4-1J: web `marchStopDetail` (`main.ts:31009`): etykieta wstrzymania trasy dla panelu
    /// jednostki (`main.ts:25737`). Web jej NIE zapisuje i czysci przy wczytaniu (`main.ts:46274`).
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub march_stop_detail: BTreeMap<UnitId, String>,
    /// P4-1H Q4: web `movedByPlayerThisTurn` (`main.ts:31010-31014`, `Set<string>`): jednostki gracza,
    /// ktore w biezacej turze dostaly rozkaz ruchu (`markPlayerMovedUnit`, `main.ts:31026-31028`,
    /// wolane z `planMarchTo` `:31284`). Czyszczone przy odnowieniu ruchu na starcie tury
    /// (`main.ts:38144`), przy nowej grze (`:45066`) i przy wczytaniu (`:46280`). Web go NIE zapisuje
    /// (brak w `save.ts`); pusty => pole pomijane w DTO, wiec stan bez pola jest bajt w bajt jak dawniej.
    /// Web czyta tylko `has` / `add` / `clear` / `size`, wiec kolejnosc zbioru nie ma znaczenia.
    #[serde(default, skip_serializing_if = "BTreeSet::is_empty")]
    pub moved_by_player_this_turn: BTreeSet<UnitId>,
    /// P4-1F3: web `City.oblegane` (`game/cities.ts:858` @ `07d2fbd72`, `boolean?`): miasta oblegane.
    /// Trzymane obok `PlayableCity` (nie w niej), jak `PlayableReplaceUnit`, zeby nie lamac literalow
    /// tej struktury. Brak id = `oblegane` falsy (web `undefined`/`false`). Czyta je producent
    /// `overlays_view::siege_views` (web `refreshSiegeMarkers`, `main.ts:17492-17530`). Pusty => pole
    /// pomijane w DTO i zapisie (stan sprzed zmiany bajt w bajt).
    #[serde(default, skip_serializing_if = "BTreeSet::is_empty")]
    pub oblegane: BTreeSet<CityId>,
    /// P4-1F3: web `City.siegeMachines.ready` (`game/cities.ts:884`, `game/siegeMachines.ts:6-26`):
    /// gotowe machiny miasta w kolejnosci tablicy. Brak wpisu = web `city.siegeMachines?.ready ?? []`
    /// (`render/siegeCampSync.ts:7-12`). Kolejka i postep budowy (`queue`, `buildProgress`) nie naleza
    /// do tego tematu. Pusty => pole pomijane w DTO i zapisie.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub siege_machines_ready: BTreeMap<CityId, Vec<PlayableSiegeMachineKind>>,
    /// P4-1F3: web `placedWorldWonders` (`main.ts:4025`, `PlacedWonder[]` bez `ruin`), kolejnosc
    /// tablicy. `ruin` liczy producent `overlays_view::wonder_views` (web `placedWonderSnapshot`,
    /// `main.ts:4205-4210`). Pusty => pole pomijane w DTO i zapisie.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub placed_world_wonders: Vec<PlayablePlacedWonder>,
}

/// P4-1F3: web `SiegeMachineKind` (`game/siegeMachines.ts:6`); forma serde = napisy weba.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PlayableSiegeMachineKind {
    /// `'taran'`.
    Taran,
    /// `'wieza'`.
    Wieza,
}

/// P4-1F3: jeden postawiony cud, web `PlacedWonder` (`render/wonderRenderer.ts:12-19`) bez `ruin`
/// (web nie trzyma `ruin` w `placedWorldWonders`; dopisuje go `placedWonderSnapshot`). Nazwy pol = web
/// (`wonderId`, `q`, `r`, `ownerId`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayablePlacedWonder {
    pub wonder_id: String,
    pub q: i32,
    pub r: i32,
    pub owner_id: PlayerId,
}

/// P4-1J: jeden plan marszu, web `PlannedMarchDest` (`planned-march.ts:16-23`) z kluczem mapy
/// `plannedMarches` jako `unit_id`. Wspolrzedne jak `PlayableFort` (`q` = `position.x`, `r` =
/// `position.y`). `general_target_id` (web `generalTargetId`, `planned-march.ts:22`) zapisuje i
/// odczytuje ten sam pin; kontrakt `P4-1-RENDER-DTO-CONTRACT.md` §8 go nie wymienia (DTO widoku).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayablePlannedMarch {
    pub unit_id: UnitId,
    pub dest_q: i32,
    pub dest_r: i32,
    /// Web `attackUnitId`: marsz, a po dotarciu atak na te jednostke (`main.ts:29572`).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub attack_unit_id: Option<UnitId>,
    /// Web `generalTargetId` (`planned-march.ts:22`): id zywego generala, za ktorym podaza marsz.
    /// `None` = brak pola; pusty napis nie wchodzi tu (filtrowany przy odczycie, jak w webie).
    /// Przeliczanie celu na pozycje generala (`syncGeneralMarchTargets`) nie nalezy do tej warstwy.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub general_target_id: Option<String>,
}

/// P4-1J: web `MarchStopReason` (`planned-march.ts:35`); forma serde = napisy weba.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PlayableMarchStopReason {
    Obstacle,
    NoPath,
    NoMovement,
    BlockedCity,
    Fog,
}

/// P6-WIRE-WAR-STORES: minimalne magazyny stanu potrzebne producentom `infra` / `tech` / `religia`
/// skladnikow mocy. Klucze to surowe id (`CityId` / `PlayerId` jako `u64`). `PlayableState` NIE symuluje
/// ekonomii ani badan, wiec magazyny zmieniaja sie wylacznie przez zapis / budowe stanu (znana luka):
/// PUSTY magazyn to REALNY stan pusty (miasto bez budynkow, wlasciciel bez zbadanych technologii), nie
/// brak danych. Dane juz wyprowadzalne ze stanu NIE sa duplikowane: religia panstwowa wlasciciela to
/// religia jego cywilizacji (web `ownerReligionForOwnerId`, main.ts:5535), liczona z `players`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableStores {
    /// Web `cityBuilt` (id miasta -> `blt`, lista id budynkow; `blt.length` zasila `infra`).
    #[serde(default)]
    pub buildings_by_city: BTreeMap<u64, Vec<String>>,
    /// Web `ownerResearchedTechs(owner)` (czlowiek) / `aiResearchDone.get(owner)` (AI): zbior zbadanych technologii.
    #[serde(default)]
    pub researched_techs_by_owner: BTreeMap<u64, BTreeSet<String>>,
    /// Web `cityRelig` (id miasta -> religia -> wyznawcy). Brak wpisu = web `cityRelig.get` undefined:
    /// stan miasta wyprowadza `resolveCityReligionState` (religia cywilizacji wlasciciela x populacja).
    #[serde(default)]
    pub religion_by_city: BTreeMap<u64, BTreeMap<String, u32>>,
}

impl PlayableStores {
    pub fn is_default(&self) -> bool {
        *self == Self::default()
    }
}

impl PlayableState {
    /// P6-ZWYCIESTWO-WIRING: odtworzenie flagi `graczKiedysMialMiasto` ze miast po wczytaniu zapisu
    /// (pin main.ts:46368-46370: `playerEverOwnedCityByOwner` = fotele z miastem). Wywolywac po
    /// deserializacji, PRZED pierwsza tura; bez tego flaga po wczytaniu = false (pole nie jest w zapisie).
    /// Tylko `cfg(test)`: produkcyjnej sciezki wczytania `PlayableState` nie ma (zakres r3, osobny temat),
    /// wiec funkcja nie moze byc czescia zwyklego kodu. Test `wczytany_zapis_odtwarza_flage_ze_miast_przed_utrata`
    /// opisuje kontrakt; po wpieciu wczytania nalezy usunac `cfg(test)` i wolac ja z tej sciezki.
    #[cfg(test)]
    pub fn odtworz_flage_zwyciestwa_ze_miast(&mut self) {
        self.gracz_kiedys_mial_miasto = self.gracz_kiedys_mial_miasto
            || self
                .cities
                .iter()
                .any(|city| city.owner_id == HUMAN_PLAYER_ID);
        // R-RUSTPORT-P4-364-AWAITING-SEAT-R1: pozostale fotele ludzkie z zapisu (pin `saved.humanOwnerIds`,
        // `main.ts:46369-46370`).
        let seats: Vec<PlayerId> = self
            .players
            .iter()
            .filter(|p| p.is_human && p.id != HUMAN_PLAYER_ID)
            .map(|p| p.id)
            .collect();
        for seat in seats {
            if self.cities.iter().any(|city| city.owner_id == seat) {
                self.record_ever_owned_city(seat);
            }
        }
    }

    /// R-RUSTPORT-P4-364-AWAITING-SEAT-R1: web `playerEverOwnedCityByOwner.has(owner)` (`main.ts:12883`).
    /// Fotel glowny czyta [`Self::gracz_kiedys_mial_miasto`], pozostali wlasciciele
    /// [`Self::player_ever_owned_city`] (D-AS-2).
    #[must_use]
    pub fn ever_owned_city(&self, owner: PlayerId) -> bool {
        if owner == HUMAN_PLAYER_ID {
            self.gracz_kiedys_mial_miasto
        } else {
            self.player_ever_owned_city.contains(&owner)
        }
    }

    /// R-RUSTPORT-P4-364-AWAITING-SEAT-R1: web `playerEverOwnedCityByOwner.add(owner)` (miejsca zapisu
    /// pinu: zalozenie `main.ts:16508`, kapitulacja `:17816`, zdobycie `:36218`, nowa gra `:45646`).
    pub fn record_ever_owned_city(&mut self, owner: PlayerId) {
        if owner == HUMAN_PLAYER_ID {
            self.gracz_kiedys_mial_miasto = true;
        } else {
            self.player_ever_owned_city.insert(owner);
        }
    }

    /// R-RUSTPORT-P4-364-AWAITING-SEAT-R1: caly zbior pinu `playerEverOwnedCityByOwner` (fotel glowny z
    /// flagi + pozostali), np. jako argument `dto_bridge::*` (D-BR-1).
    #[must_use]
    pub fn player_ever_owned_city_by_owner(&self) -> BTreeSet<PlayerId> {
        let mut all = self.player_ever_owned_city.clone();
        if self.gracz_kiedys_mial_miasto {
            all.insert(HUMAN_PLAYER_ID);
        }
        all
    }

    /// R-RUSTPORT-P4-364-AWAITING-SEAT-R1: web `isAwaitingFirstPlayerCity(ownerId)` (`main.ts:12882-12884`,
    /// `first-player-city.ts:14-20`) dla DOWOLNEGO fotela: `!playerEverOwnedCityByOwner.has(ownerId)` i
    /// zadne miasto stanu nie nalezy do `ownerId`.
    #[must_use]
    pub fn is_awaiting_first_city(&self, owner: PlayerId) -> bool {
        is_awaiting_first_player_city(
            self.ever_owned_city(owner),
            self.cities
                .iter()
                .map(|city| OwnerRef::Player(city.owner_id)),
            owner,
        )
    }

    /// Adapter zdarzenia "wygrana bitwy" dla akumulatora mocy (R-RUSTPORT-P6-POWER-AKUMULATORY-WIRING-Q1).
    /// Deleguje do `WarTurnState::record_battle_win` (web main.ts:34487-34490). BRAK wolajacego w produkcji:
    /// petla walki Rust (`combat::resolve_combat`) nie ma produkcyjnego wywolania - patrz raport.
    pub fn power_record_battle_win(&mut self, winner_owner_id: i64, enemy_field_m: f64) {
        self.war.record_battle_win(winner_owner_id, enemy_field_m);
    }

    /// Adapter zdarzenia "zdobycie stolicy / obozu barbarzyncow" dla akumulatora mocy
    /// (web main.ts:35669-35675). Deleguje do `WarTurnState::record_capture_power_gain`.
    /// BRAK wolajacego w produkcji: `apply_transfer_with_effects` nie jest wolany poza testami.
    pub fn power_record_city_capture(
        &mut self,
        new_owner_id: i64,
        lost_power: f64,
        barb_captor: bool,
    ) {
        self.war
            .record_capture_power_gain(new_owner_id, lost_power, barb_captor);
    }

    /// Adapter eliminacji wlasciciela dla akumulatorow mocy (web main.ts:35399, :35410).
    /// Deleguje do `WarTurnState::clear_power_accumulators_for_owner`. BRAK wolajacego w produkcji.
    pub fn power_clear_eliminated_owner(&mut self, owner_id: i64) {
        self.war.clear_power_accumulators_for_owner(owner_id);
    }

    /// P4-1H (`R-RUSTPORT-P4-1H-CANCEL-Q2`): 1:1 z galezia `unitId !== undefined` web
    /// `clearPlannedMarch(unitId, force)` (`gra/src/main.ts:31051-31056` @ `07d2fbd72`):
    /// - `!force` i plan jednostki ma `attackUnitId` -> brak zmian (`:31052`, `return`);
    /// - w pozostalych przypadkach usuwa wpis jednostki z `plannedMarches`, `marchAttackTargets`,
    ///   `marchStopNotified`, `marchStopDetail` (`:31053-31056`); brak wpisu = `Map.delete` bez efektu.
    ///
    /// Kolejnosc pozostalych planow zachowana (web `Map.delete`). Nie zmienia `status`: web nie
    /// pokazuje tu hintu (hint „Zatrzymano” nalezy do `stopPlannedMarchForSelected`, poza zakresem).
    /// Czyszczenie trasy w rendererze (`:31071-31073`) to efekt UI, poza stanem. Walidacja jednostki
    /// (istnienie, wlasciciel) nalezy do `PlayableGame::cancel_planned_march`.
    ///
    /// Wskazowka dla przyszlych wywolan wewnatrz silnika (rozwiazanie jednostki, nowy rozkaz,
    /// `tryLaunchMarchAttack`; web `main.ts:25920/25946/26013/26060/26085` @ `07d2fbd72`): wolac TE
    /// funkcje bezposrednio, PRZED usunieciem jednostki z `units`. Komenda
    /// `PlayableGame::cancel_planned_march` zwraca `UnitNotFound` dla jednostki, ktorej juz nie ma,
    /// wiec osierocony plan nie zostalby przez nia wyczyszczony (web `Map.delete` by go usunal).
    pub fn clear_planned_march_for_unit(&mut self, unit_id: UnitId, force: bool) {
        if !force
            && self
                .planned_marches
                .iter()
                .any(|plan| plan.unit_id == unit_id && plan.attack_unit_id.is_some())
        {
            return;
        }
        self.planned_marches.retain(|plan| plan.unit_id != unit_id);
        self.march_attack_targets.remove(&unit_id);
        self.march_stop_notified.remove(&unit_id);
        self.march_stop_detail.remove(&unit_id);
    }
}

impl PlayableState {
    /// P4-1H Q4: web `markPlayerMovedUnit(unitId)` (`main.ts:31026-31028`): `movedByPlayerThisTurn.add`.
    pub fn mark_player_moved_unit(&mut self, unit_id: UnitId) {
        self.moved_by_player_this_turn.insert(unit_id);
    }

    /// P4-1H Q4: web `movedByPlayerThisTurn.has(unitId)` (`main.ts:31566`, `:31696`, `:31702`).
    pub fn is_moved_by_player_this_turn(&self, unit_id: UnitId) -> bool {
        self.moved_by_player_this_turn.contains(&unit_id)
    }

    /// P4-1H Q4: wejscia modelu ruchu weba (`RuchMapa`, `RuchJednostka`, `CityHexRef`) z tego stanu;
    /// adapter: [`super::playable_movement`].
    pub fn move_model(&self) -> PlayableMoveModel {
        PlayableMoveModel::from_state(self)
    }

    /// P4-1H Q4: web `occupiedForMove(moverOwnerId, ...exceptIds)` (`main.ts:14578-14584`) na tym
    /// stanie; adapter: [`super::playable_movement::occupied_for_move`].
    pub fn occupied_for_move(
        &self,
        mover_owner_id: PlayerId,
        except_ids: &[UnitId],
    ) -> MoveOccupancy {
        let owner = i64::try_from(mover_owner_id.get()).expect("PlayerId miesci sie w i64");
        occupied_for_move(self, owner, except_ids)
    }

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
            stores: PlayableStores::default(),
            economy: PlayableReplaceEconomy::default(),
            forts: Vec::new(),
            gracz_kiedys_mial_miasto: false,
            player_ever_owned_city: BTreeSet::new(),
            koniec_gry: None,
            planned_marches: Vec::new(),
            march_attack_targets: BTreeMap::new(),
            march_stop_notified: BTreeMap::new(),
            march_stop_detail: BTreeMap::new(),
            moved_by_player_this_turn: BTreeSet::new(),
            oblegane: BTreeSet::new(),
            siege_machines_ready: BTreeMap::new(),
            placed_world_wonders: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlayableError {
    InvalidStartParams(String),
    UnitNotFound(u64),
    UnitNotOwned(u64),
    UnitNotSelected(u64),
    /// P4-1H Q6: web `planMarchTo` `plan.fullPath.length === 0` (`main.ts:31267-31270`): hint
    /// „Marsz przerwany: brak trasy do celu”. Obejmuje cel poza mapa (`computePath`: `!map.hexes.has`
    /// -> `[]`) i cel = pozycja jednostki (`planPathTurns` -> `fullPath: []`).
    MarchNoRoute,
    /// P4-1H Q6: web `!attackTarget && !canOccupyHexForUnit(u, destQ, destR)` (`main.ts:31271-31277`).
    MarchForeignCity,
    /// P4-1H Q6: web `!attackTarget && !canJoinStackAt(units, stack, destQ, destR, armyStackLimit())`
    /// (`main.ts:31279-31282`); `limit` = `armyStackLimit()` = 500.
    MarchStackLimit {
        limit: i64,
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
    /// P6-WIRE-WAR-R7K7-C: skarbiec gracza ludzkiego zapisuje sie w `economy.treasury`, nie w mapie AI.
    EconomyOwnerIsHuman(u64),
    /// P6-UNIT-REPLACE-L3-KOSZT: etykieta trudnosci stanu bez odpowiednika `Difficulty` (odrzucane, nie zgadywane).
    ReplaceDifficultyUnknown(String),
    /// P6-UNIT-REPLACE-L3: zamiana odrzucona przez reguly pinu (koszt, magazyn, blokada, uzycie).
    UnitReplaceRejected {
        reason: UnitReplaceFail,
        detail: Option<String>,
    },
    /// P6-ZWYCIESTWO-WIRING: koniec tury odrzucony po zakonczeniu gry (pin main.ts:37997, :38043, :43827).
    GameAlreadyOver(VictoryResult),
    /// P6-ZWYCIESTWO-WIRING: wejscie warunkow zwyciestwa (moc, epoka) nie da sie zbudowac ze stanu.
    VictoryCheck(String),
    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (D-WIRB-2): komenda mapy w trakcie bitwy oblezniczej (pin: scena zaslania mape,
    /// `main.ts:36940-37024`); stan bez zmian.
    SiegeBattleInProgress {
        city_id: u64,
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
            Self::MarchNoRoute => formatter.write_str(MARCH_NO_ROUTE_HINT),
            Self::MarchForeignCity => formatter.write_str(MARCH_FOREIGN_CITY_HINT),
            Self::MarchStackLimit { limit } => {
                formatter.write_str(&stack_limit_block_message(*limit))
            }
            Self::TurnPhaseQueueIncomplete { expected, actual } => write!(
                formatter,
                "turn phase queue resolved {actual} phases; expected {expected}"
            ),
            Self::DuplicatePlayer(id) => write!(formatter, "player {id} already exists"),
            Self::WarTurn(message) => write!(formatter, "war turn: {message}"),
            Self::NonFiniteEconomy => {
                formatter.write_str("economy value must be finite (no NaN or infinity)")
            }
            Self::EconomyOwnerIsHuman(id) => write!(
                formatter,
                "owner {id} is the human player; use the human treasury field instead"
            ),
            Self::NoCityForReplace => {
                formatter.write_str("unit replacement needs a city owned by the human player")
            }
            Self::ReplaceDifficultyUnknown(label) => {
                write!(
                    formatter,
                    "unit replacement: unknown difficulty label {label:?}"
                )
            }
            Self::UnitReplaceRejected { reason, detail } => match detail {
                Some(detail) => write!(
                    formatter,
                    "unit replacement rejected: {reason:?} ({detail})"
                ),
                None => write!(formatter, "unit replacement rejected: {reason:?}"),
            },
            Self::GameAlreadyOver(result) => {
                write!(formatter, "game is over: {:?}", result.rodzaj)
            }
            Self::VictoryCheck(message) => write!(formatter, "victory check: {message}"),
            Self::SiegeBattleInProgress { city_id } => {
                write!(formatter, "siege battle in progress (city {city_id})")
            }
        }
    }
}

impl Error for PlayableError {}

/// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 (D-364-2): stan mgly SESJI - wejscia `refreshFog`
/// (`main.ts:13475-13513`), ktorych [`PlayableState`] nie niesie (Z-FOG-1). Zyje w [`PlayableGame`],
/// NIE w `PlayableState`: nie wchodzi do DTO stanu, zapisu, snapshotu ani replay (determinizm tury
/// bez zmian). Inicjalizacja przy `CreateSession` = web nowa gra (`seedStartingFog`, `main.ts:12868-12873`).
#[derive(Debug, Clone, PartialEq)]
pub struct PlayableFogSession {
    /// Web `ME()` = `humanSeats.activeHumanOwnerId` (`main.ts:13729-13731`); bez hot-seat = fotel glowny
    /// `HUMAN_OWNER_PRIMARY` (tu `HUMAN_PLAYER_ID`).
    pub active_seat: PlayerId,
    /// Web `fogOn` (`main.ts:12801`, `seedStartingFog` `:12870`): `true`. Przelacznik F to dev-UI.
    pub fog_on: bool,
    /// Web `revealAllLand` (`main.ts:12803`, `:12871`): `false`. Przelacznik M to dev-UI.
    pub reveal_all_land: bool,
    /// Web `playerStartHexByOwner` (`main.ts:3025-3027`): fotel glowny -> heks startu. Pionowy wycinek
    /// zaklada stolice gracza przy starcie, wiec heks startu = pozycja stolicy fotela glownego (jak
    /// `cluster_compute` `player_start_hex: cap_pos`); brak stolicy = brak wpisu (web `null`).
    pub player_start_hex_by_owner: BTreeMap<PlayerId, Klucz>,
    /// Web `startRevealRadius = startRevealRadiusForDifficulty(diff)` (`main.ts:3033`, `:44370-44381`,
    /// `startScoring.ts:17-23`); nieznana etykieta trudnosci -> `'normal'` (web `?? 'normal'`).
    pub start_reveal_radius: f64,
    /// Web `exploredByHuman` (`main.ts:13759`): po nowej grze wpis fotela glownego = pusty zbior
    /// (`explored.clear()`, `:12872`). Kumulowany przez kazde zapytanie warstw (`refreshFog` -> `addExplored`).
    pub explored_by_human: ExploredByHuman,
}

impl PlayableFogSession {
    /// Stan mgly nowej sesji dla `state` (web `seedStartingFog` + `startRevealRadius` z trudnosci).
    #[must_use]
    pub fn for_new_game(state: &PlayableState) -> Self {
        let diff = match state.params.difficulty.as_str() {
            "Łatwy" | "easy" => StartDifficulty::Easy,
            "Trudny" | "hard" => StartDifficulty::Hard,
            _ => StartDifficulty::Normal,
        };
        // Promien to mala liczba calkowita z danych (5 / 8 / 10) - JS `number`.
        #[allow(clippy::cast_precision_loss)]
        let start_reveal_radius = start_reveal_radius_for_difficulty(diff) as f64;
        let player_start_hex_by_owner = state
            .cities
            .iter()
            .find(|c| c.owner_id == HUMAN_PLAYER_ID && c.is_capital)
            .map(|c| (HUMAN_PLAYER_ID, klucz_of(c.position)))
            .into_iter()
            .collect();
        let mut explored_by_human = ExploredByHuman::new();
        explored_by_human.insert(HUMAN_PLAYER_ID, BTreeSet::new());
        Self {
            active_seat: HUMAN_PLAYER_ID,
            fog_on: true,
            reveal_all_land: false,
            player_start_hex_by_owner,
            start_reveal_radius,
            explored_by_human,
        }
    }

    /// R-RUSTPORT-P4-364-FOG-SAVE-R1 (D-FS-3): eksploracja z wczytanego zapisu, web `main.ts:46393-46411`:
    /// mapa eksploracji = wpisy zapisu (kazdy fotel osobno), fotel glowny ma ZAWSZE wpis (brak w zapisie =
    /// pusty zbior, web `if (!exploredByHuman.has(HUMAN_OWNER_PRIMARY))`), `revealAllLand = false`. Web
    /// mutuje istniejacy `explored` fotela glownego (alias zmiennej modulu); w Rust aliasu nie ma, wiec
    /// zbior jest po prostu ustawiany.
    pub fn restore_explored_by_human(&mut self, saved: ExploredByHuman) {
        self.explored_by_human = saved;
        self.explored_by_human.entry(HUMAN_PLAYER_ID).or_default();
        self.reveal_all_land = false;
    }
}

/// Mutable first-slice game with a deterministic phase queue.
#[derive(Debug, Clone)]
pub struct PlayableGame {
    state: PlayableState,
    phase_queue: EventQueue<TurnEvent>,
    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: stan mgly sesji (poza `PlayableState`).
    fog: PlayableFogSession,
    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (D-WIRB-1): trwajaca bitwa obleznicza (poza `PlayableState`, poza zapisem).
    siege_battle: Option<ActiveSiegeBattle>,
    /// D-WIR-5: licznik bitew oblezniczych sesji (numer bitwy w ziarnie RNG `SessionRolls::derive`).
    siege_battles_started: u32,
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
            population: FOUNDING_CITY_POPULATION,
            culture: 0,
        }];
        let units = vec![PlayableUnit {
            id: UnitId::new(STARTING_UNIT_ID),
            owner_id: HUMAN_PLAYER_ID,
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(START_X, START_Y),
            movement: MovementPoints::from(1_u8),
            movement_max: MovementPoints::from(1_u8),
            selected: false,
        }];
        // P6-ZWYCIESTWO-WIRING: flaga startowa = miasto gracza zalozone przy starcie (pin main.ts:16508 /
        // nowa gra main.ts:45645-45646 dodaja fotel do zbioru miast). Nie jest sztywnym `true`.
        let gracz_kiedys_mial_miasto = cities.iter().any(|city| city.owner_id == HUMAN_PLAYER_ID);
        let status = format!(
            "Sesja {} · {} · mapa {}. Wybierz jednostkę.",
            params.civ_name, params.epoch, params.map_size
        );
        let state = PlayableState {
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
            stores: PlayableStores::default(),
            economy: PlayableReplaceEconomy::default(),
            forts: Vec::new(),
            gracz_kiedys_mial_miasto,
            // Pin `main.ts:45645-45646`: `clear()` + fotel glowny (wpis fotela glownego = flaga wyzej).
            player_ever_owned_city: BTreeSet::new(),
            koniec_gry: None,
            planned_marches: Vec::new(),
            march_attack_targets: BTreeMap::new(),
            march_stop_notified: BTreeMap::new(),
            march_stop_detail: BTreeMap::new(),
            moved_by_player_this_turn: BTreeSet::new(),
            oblegane: BTreeSet::new(),
            siege_machines_ready: BTreeMap::new(),
            placed_world_wonders: Vec::new(),
        };
        // R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: nowa gra = swieza mgla sesji (`seedStartingFog`).
        let fog = PlayableFogSession::for_new_game(&state);
        let mut game = Self {
            state,
            phase_queue: EventQueue::new(),
            fog,
            siege_battle: None,
            siege_battles_started: 0,
        };
        game.enqueue_turn_phases(1);
        Ok(game)
    }

    /// P4-1H Q6: gra z gotowego stanu (scenariusz startowy/testowy, jak `set_human_treasury`; brak
    /// komendy w UI i brak produkcyjnej sciezki wczytania). Kolejka faz = swieza kolejka biezacej tury
    /// (`enqueue_turn_phases(state.turn)`), tak jak po `new` i po `advance_turn`.
    pub fn from_state(state: PlayableState) -> Self {
        let turn = state.turn;
        let fog = PlayableFogSession::for_new_game(&state);
        let mut game = Self {
            state,
            phase_queue: EventQueue::new(),
            fog,
            siege_battle: None,
            siege_battles_started: 0,
        };
        game.enqueue_turn_phases(turn);
        game
    }

    pub fn state(&self) -> &PlayableState {
        &self.state
    }

    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: stan mgly sesji (odczyt).
    pub fn fog_session(&self) -> &PlayableFogSession {
        &self.fog
    }

    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: stan gry (odczyt) i stan mgly sesji (zapis) naraz - zapytanie
    /// warstw renderera dopisuje eksploracje (`refreshFog`), nie zmieniajac `PlayableState`.
    pub fn fog_session_parts(&mut self) -> (&PlayableState, &mut PlayableFogSession) {
        (&self.state, &mut self.fog)
    }

    pub fn pending_phase_count(&self) -> usize {
        self.phase_queue.len()
    }

    pub fn add_player(&mut self, id: u64, name: String) -> Result<(), PlayableError> {
        // D-WIRB-2 (obrona r1, U1): w trakcie bitwy stan gry = migawka startu bitwy.
        self.ensure_no_siege_battle()?;
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
        // D-WIRB-2 (obrona r1, U1): scena zaslania mape (`main.ts:36940-37024`), zaznaczenie niedostepne.
        self.ensure_no_siege_battle()?;
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

    /// Komenda `move_unit { unit_id, destination }` bez jawnego celu ataku; patrz
    /// [`PlayableGame::move_unit_with_attack`].
    pub fn move_unit(
        &mut self,
        unit_id: u64,
        destination: PositionDto,
    ) -> Result<(), PlayableError> {
        self.move_unit_with_attack(unit_id, destination, None)
    }

    /// P4-1H Q6 (`R-RUSTPORT-P4-1H-MOVE-Q6`, #252): komenda `move_unit { unit_id, destination,
    /// attack_unit_id? }` = web `planMarchTo(destQ, destR, attackUnitId?)` (`main.ts:31213-31298` @
    /// `07d2fbd72`) + pierwszy segment `executeMarchSegmentForUnit` (`main.ts:31477-31544`) ze skutkami
    /// konca animacji w zakresie stanu (`main.ts:44100-44111`, `:44180-44194`). Logika:
    /// [`super::playable_movement::plan_march_to`]. Cel moze byc dowolnie daleko (brak reguly
    /// "tylko sasiad"); trasa z `planPathTurns`.
    ///
    /// Bramki komendy przed `planMarchTo` (jak dotad): jednostka istnieje (`UnitNotFound`), nalezy do
    /// gracza (`UnitNotOwned`, web `!isMe(u.ownerId)` `:31228`), jest zaznaczona (`UnitNotSelected`,
    /// web `units.find(x => x.id === selectedId)` `:31227`). Odrzucony rozkaz nie zmienia stanu.
    pub fn move_unit_with_attack(
        &mut self,
        unit_id: u64,
        destination: PositionDto,
        attack_unit_id: Option<u64>,
    ) -> Result<(), PlayableError> {
        self.ensure_no_siege_battle()?;
        let unit = self
            .state
            .units
            .iter()
            .find(|unit| unit.id.get() == unit_id)
            .ok_or(PlayableError::UnitNotFound(unit_id))?;
        if unit.owner_id != HUMAN_PLAYER_ID {
            return Err(PlayableError::UnitNotOwned(unit_id));
        }
        if self.state.selected_unit_id != Some(unit_id) {
            return Err(PlayableError::UnitNotSelected(unit_id));
        }
        let id = unit.id;
        plan_march_to(
            &mut self.state,
            id,
            destination,
            attack_unit_id.map(UnitId::new),
        )
        .map(|_| ())
    }

    /// D-WIRB-2: bramka komend mapy w trakcie bitwy oblezniczej.
    fn ensure_no_siege_battle(&self) -> Result<(), PlayableError> {
        match &self.siege_battle {
            Some(b) => Err(PlayableError::SiegeBattleInProgress { city_id: b.city_id }),
            None => Ok(()),
        }
    }

    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: trwajaca bitwa obleznicza (odczyt).
    pub fn siege_battle(&self) -> Option<&ActiveSiegeBattle> {
        self.siege_battle.as_ref()
    }

    /// Komenda `StartSiegeStorm { city_id, unit_id }`: web `launchSiegeStormFromMap` -> `onBattlefield` -> `new
    /// BattleScene` -> `bs.play` (`main.ts:36799-37019`). Stan gry bez zmian (machiny zuzywa wynik, `:37023`).
    pub fn start_siege_storm(
        &mut self,
        city_id: u64,
        unit_id: u64,
    ) -> Result<SiegeBattlePayload, SiegeBattleError> {
        if let Some(b) = &self.siege_battle {
            return Err(SiegeBattleError::BattleInProgress { city_id: b.city_id });
        }
        let index = self.siege_battles_started.wrapping_add(1);
        let mut battle = siege_battle_apply::prepare_storm(&self.state, city_id, unit_id, index)?;
        let payload = siege_battle_apply::start_payload(&mut battle)?;
        self.siege_battles_started = index;
        self.siege_battle = Some(battle);
        Ok(payload)
    }

    /// Komenda `StepSiegeBattle { wall_ms }`: krok czasu rzeczywistego (D-WIR-3).
    pub fn step_siege_battle(
        &mut self,
        wall_ms: f64,
    ) -> Result<SiegeBattlePayload, SiegeBattleError> {
        let battle = self
            .siege_battle
            .as_mut()
            .ok_or(SiegeBattleError::NoActiveBattle)?;
        siege_battle_apply::step(battle, wall_ms)
    }

    /// Komenda `SkipSiegeBattle`: przewijanie do wyniku (`skip()`, `battleScene.ts:3680-3707`).
    pub fn skip_siege_battle(&mut self) -> Result<SiegeBattlePayload, SiegeBattleError> {
        let battle = self
            .siege_battle
            .as_mut()
            .ok_or(SiegeBattleError::NoActiveBattle)?;
        siege_battle_apply::skip(battle)
    }

    /// Komenda `FinishSiegeBattle`: wynik sceny zastosowany do stanu (`consumeReadyMachines` + `finishSiegeStormBattle`
    /// bez zdobycia, D-WIRB-3). D-WIRB-8 (obrona r1, Z6): `NotFinished` = bitwa trwa (stan i bitwa bez zmian, dostepne
    /// `Skip`); kazdy inny blad (sciezka nieportowana, `LoopUnsupported`, blad zastosowania) ZAMYKA bitwe bez zmiany
    /// stanu i zwraca `Aborted`, wiec komendy mapy nie zostaja zablokowane na zawsze.
    pub fn finish_siege_battle(&mut self) -> Result<SiegeBattlePayload, SiegeBattleError> {
        let battle = self
            .siege_battle
            .as_ref()
            .ok_or(SiegeBattleError::NoActiveBattle)?;
        let mut next = self.state.clone();
        match siege_battle_apply::finish(&mut next, battle) {
            Ok(payload) => {
                self.state = next;
                self.siege_battle = None;
                Ok(payload)
            }
            Err(
                e @ SiegeBattleError::Session(
                    super::siege_battle_session::SessionError::NotFinished,
                ),
            ) => Err(e),
            Err(e) => {
                let city_id = battle.city_id;
                self.siege_battle = None;
                Err(SiegeBattleError::Aborted {
                    city_id,
                    reason: e.to_string(),
                })
            }
        }
    }

    /// P4-1H (`R-RUSTPORT-P4-1H-CANCEL-Q2`): komenda `cancel_planned_march { unit_id, force }`,
    /// web `clearPlannedMarch(unitId, force)` z podanym `unitId` (`main.ts:31051-31056`); logika w
    /// `PlayableState::clear_planned_march_for_unit`. Brak planu -> `Ok(())` bez zmian (idempotencja).
    /// Nieznana jednostka -> `UnitNotFound`, obca -> `UnitNotOwned` (decyzja techniczna,
    /// `REJESTR-RUST.md` 15.11, spojnie z `move_unit`; web tej sciezki nie ma). Bledy nie zmieniaja stanu.
    /// Nie wymaga zaznaczenia jednostki: web wola to takze dla jednostek z petli HUD (`:25920` i dalej).
    pub fn cancel_planned_march(&mut self, unit_id: u64, force: bool) -> Result<(), PlayableError> {
        self.ensure_no_siege_battle()?;
        let unit = self
            .state
            .units
            .iter()
            .find(|unit| unit.id.get() == unit_id)
            .ok_or(PlayableError::UnitNotFound(unit_id))?;
        if unit.owner_id != HUMAN_PLAYER_ID {
            return Err(PlayableError::UnitNotOwned(unit_id));
        }
        let id = unit.id;
        self.state.clear_planned_march_for_unit(id, force);
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

    /// P6-WIRE-WAR-R7K7-C: ustawia skarbiec AI (scenariusz startowy/testowy; producent `ownerTreasury`).
    /// Wartosci NaN i nieskonczone sa odrzucane; gracz ludzki jest odrzucany (ma wlasne pole).
    pub fn set_owner_treasury(&mut self, owner: u64, value: f64) -> Result<(), PlayableError> {
        if self.is_human_owner(owner) {
            return Err(PlayableError::EconomyOwnerIsHuman(owner));
        }
        if !value.is_finite() {
            return Err(PlayableError::NonFiniteEconomy);
        }
        self.state.economy.ai_treasury_by_owner.insert(owner, value);
        Ok(())
    }

    /// P6-WIRE-WAR-R7K7-C: ustawia pule Pracy wlasciciela (takze gracza ludzkiego; `ownerPracaPool`).
    /// Wartosci NaN i nieskonczone sa odrzucane.
    pub fn set_owner_praca_pool(&mut self, owner: u64, value: f64) -> Result<(), PlayableError> {
        if !value.is_finite() {
            return Err(PlayableError::NonFiniteEconomy);
        }
        self.state.economy.praca_pool_by_owner.insert(owner, value);
        Ok(())
    }

    fn is_human_owner(&self, owner: u64) -> bool {
        self.state
            .players
            .iter()
            .any(|p| p.is_human && p.id.get() == owner)
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

    /// Ustawia stan zamiany jednostki (HP, typ, postep `battlesSurvived`/`parametryBonusProc`) dla
    /// scenariusza startowego/testowego, jak `set_human_treasury`. Jednostka musi istniec; wartosci
    /// NaN i nieskonczone sa odrzucane. Nie jest to zapis z bitwy: stan postepu ustawia wywolujacy.
    pub fn set_replace_unit_state(
        &mut self,
        unit_id: u64,
        state: PlayableReplaceUnit,
    ) -> Result<(), PlayableError> {
        if !self.state.units.iter().any(|unit| unit.id.get() == unit_id) {
            return Err(PlayableError::UnitNotFound(unit_id));
        }
        let finite = [
            state.hp,
            state.hp_max,
            state.battles_survived,
            state.parametry_bonus_proc,
        ]
        .into_iter()
        .flatten()
        .all(f64::is_finite);
        if !finite {
            return Err(PlayableError::NonFiniteEconomy);
        }
        self.state.economy.units.insert(unit_id, state);
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
    /// Zrodlem `defs` jest produkcyjna tabela `unit_replace_defs::production_replace_defs`
    /// (units.json + kategoria `categoryOf`, P6-UNIT-REPLACE-L3-DEFS).
    pub fn replace_unit(
        &mut self,
        unit_id: u64,
        new_type_id: &str,
        gate: Option<String>,
    ) -> Result<(), PlayableError> {
        let defs = self.replace_defs()?;
        self.replace_unit_with_defs(unit_id, new_type_id, &defs, gate)
    }

    /// Produkcyjna tabela definicji dla stanu gracza (P6-UNIT-REPLACE-L3-KOSZT). Zalozenia stanu
    /// jawnie: wlasciciel gracza = `params.civ_id` (macierz cywilizacji), tempo kosztu =
    /// `params.advanced.unit_cost_pace` (web `kosztJednostekPace`), trudnosc = etykieta
    /// `params.difficulty` (web `_menuDifficulty`; nieznana etykieta = blad, nie domyslna).
    fn replace_defs(&self) -> Result<BTreeMap<String, ReplaceUnitDef>, PlayableError> {
        let difficulty = replace_difficulty_of(&self.state.params.difficulty)?;
        Ok(production_replace_defs_for_civ(
            &self.state.params.civ_id,
            &self.state.params.advanced.unit_cost_pace,
            difficulty,
        ))
    }

    /// Wariant z jawnie podana tabela `defs` (wstrzykniecie w testach i scenariuszach L3).
    /// Logika identyczna z `replace_unit`; jedyna roznica to zrodlo definicji.
    pub fn replace_unit_with_defs(
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
        // Postep zamienianej jednostki (web `u.battlesSurvived`, `u.parametryBonusProc`) wchodzi do HP
        // (`newMaxHp` i `oldMaxHp` z tej samej jednostki). Brak pola = 0, jak w web.
        let progress = ReplaceUnitProgress {
            parametry_bonus_proc: replace_state.parametry_bonus_proc,
            battles_survived: replace_state.battles_survived,
        };
        // Tryb gracza: bez synchronizacji hpMax (ta galaz nalezy do AI w web).
        match replace_unit_wired(
            &mut target,
            new_type_id,
            defs,
            &mut city,
            gate,
            false,
            progress,
        ) {
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
                        // Postep nie zmienia sie przy zamianie (tylko model i odczyt; zapis = inne tematy).
                        battles_survived: replace_state.battles_survived,
                        parametry_bonus_proc: replace_state.parametry_bonus_proc,
                    },
                );
                // Adapter zeruje ruch_left (web: zamiana zuzywa ruch).
                self.state.units[unit_index].movement = MovementPoints::new(target.ruch_left);
                self.state.status = format!("Jednostka {unit_id} zamieniona na {new_type_id}.");
                Ok(())
            }
            UnitReplaceResult::Fail { reason, detail, .. } => {
                Err(PlayableError::UnitReplaceRejected { reason, detail })
            }
        }
    }

    pub fn advance_turn(&mut self) -> Result<(), PlayableError> {
        self.ensure_no_siege_battle()?;
        // P6-ZWYCIESTWO-WIRING: po koncu gry koniec tury jest odrzucany zanim cokolwiek sie zmieni (pin main.ts:37997).
        if let Some(result) = self.state.koniec_gry {
            return Err(PlayableError::GameAlreadyOver(result));
        }
        let current_turn = self.state.turn;
        // Migawka przed przejsciem tury: blad fazy wojny cofa kolejke i stan wojny (brak polowicznego zuzycia).
        let queue_before = self.phase_queue.clone();
        let war_before = self.state.war.clone();
        // P6-WIRE-R7K7C (zarzut obrony r1): migawka ekonomii cofa przyrosty skarbcow/pul Pracy zastosowane przez
        // faze Diplomacy, gdy tura nie zostanie zaliczona (kolejka niekompletna).
        let economy_before = self.state.economy.clone();
        // Migawka pol zwyciestwa: niekompletna kolejka faz (blad przejscia tury) cofa tez koniec gry i flage.
        // Sam blad sprawdzenia zwyciestwa nie cofa tury (semantyka pina, zob. faza Victory nizej).
        let koniec_before = self.state.koniec_gry;
        let flag_before = self.state.gracz_kiedys_mial_miasto;
        let ever_owned_before = self.state.player_ever_owned_city.clone();
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
                    self.state.economy = economy_before;
                    return Err(error);
                }
            }
            // P6-ZWYCIESTWO-WIRING: sprawdzenie zwyciestwa/porazki gracza na fazie Victory (pin main.ts:43441-43483).
            // Semantyka bledu jak w pinie: blad sprawdzenia jest logowany (pin: console.error w catch) i tura
            // trwa dalej; NIE cofa tury ani stanu wojny. Flaga i koniec gry zostaja nietkniete.
            if entry.phase() == TurnPhase::Victory {
                match self.evaluate_victory() {
                    Ok((flag, result)) => {
                        self.state.gracz_kiedys_mial_miasto = flag;
                        // R-RUSTPORT-P4-364-AWAITING-SEAT-R1: ten sam punkt synchronizacji co flaga dla
                        // pozostalych wlascicieli (pin dopisuje przy zalozeniu/zdobyciu miasta; Rust nie ma
                        // produkcyjnej sciezki zalozenia, wiec wpis = wlasciciel ma miasto na koniec tury).
                        let owners: Vec<PlayerId> =
                            self.state.cities.iter().map(|c| c.owner_id).collect();
                        for owner in owners {
                            self.state.record_ever_owned_city(owner);
                        }
                        if self.state.koniec_gry.is_none() {
                            self.state.koniec_gry = result;
                        }
                    }
                    Err(error) => {
                        eprintln!("[Victory] Blad sprawdzania warunkow zwyciestwa: {error}");
                    }
                }
            }
            // P6-UNIT-REPLACE-L3 (kryterium 3c): PUNKT PODPIECIA AI-zamiany jednostek (`ai_replace_*`)
            // na fazie TurnPhase::Ai. Galaz celowo nie wykonuje nic: stan ekonomii zamiany (skarbiec,
            // pule miast, stan jednostek) jest juz w PlayableState.economy (etap 2), ale brakuje
            // definicji jednostek (produkcyjne zrodlo ReplaceUnitDef) i limitu udzialu AI; atrapa bylaby
            // falszywym dowodem wiringu. Decyzja zakresu: zob. runs/R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1.
            phases.push(entry.phase());
        }
        if phases.len() != PHASE_COUNT {
            self.state.koniec_gry = koniec_before;
            self.state.gracz_kiedys_mial_miasto = flag_before;
            self.state.player_ever_owned_city = ever_owned_before;
            self.state.economy = economy_before;
            return Err(PlayableError::TurnPhaseQueueIncomplete {
                expected: PHASE_COUNT,
                actual: phases.len(),
            });
        }
        self.state.turn = self.state.turn.saturating_add(1);
        self.state.phase = TurnPhase::PlayerActions;
        self.state.last_advanced_phases = phases;
        self.state.selected_unit_id = None;
        // P4-1H Q4: web `movedByPlayerThisTurn.clear()` tuz przed odnowieniem ruchu (`main.ts:38144-38146`).
        self.state.moved_by_player_this_turn.clear();
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
        let inputs = build_war_inputs(&self.state, &self.state.war)
            .map_err(|error| PlayableError::WarTurn(error.to_string()))?;
        let config = production_config(&self.state)
            .map_err(|error| PlayableError::WarTurn(error.to_string()))?;
        let mut ctx = WarTurnContext {
            war: &mut self.state.war,
            turn: f64::from(self.state.turn),
            inputs: &inputs,
            config: &config,
        };
        let report =
            run_war_turn(&mut ctx).map_err(|error| PlayableError::WarTurn(error.to_string()))?;
        // P6-WIRE-R7K7C (#106): przyrosty skarbcow i pul Pracy z krokow D1-D7 (raport `dipl`) stosowane do
        // stanu gry, jak web `ownerTreasury`/`setOwnerPracaPool` w pinie. Blad = zero zmian w ekonomii
        // (walidacja przed zapisem); migawka wojny cofa `advance_turn` przy bledzie tej fazy.
        apply_dipl_deltas_to_state(
            &mut self.state,
            &report.dipl.treasury_deltas,
            &report.dipl.praca_deltas,
        )
        .map_err(|error| PlayableError::WarTurn(error.to_string()))?;
        Ok(())
    }

    /// P6-ZWYCIESTWO-WIRING: warunki zwyciestwa/porazki gracza (pin main.ts:43441-43483, gracz = fotel czlowieka).
    /// Zwraca nowa flage `graczKiedysMialMiasto` (zapisana wczesniejsza albo miasto gracza teraz) i wynik.
    /// Rakieta nigdy nie jest ustawiana (parytet z pinem), wiec nauka pozostaje nieosiagalna przy
    /// `NAUKA_WYMAGA_RAKIETY`; `wszystkieTechZbadane` przekazywane jako false (bez wplywu na wynik).
    fn evaluate_victory(&self) -> Result<(bool, Option<VictoryResult>), PlayableError> {
        let state = &self.state;
        let gracz = HUMAN_PLAYER_ID.get() as i64;
        let (powers, era) = victory_power_inputs(state)?;
        let potega = *powers.get(&gracz).ok_or_else(|| {
            PlayableError::VictoryCheck("brak mocy gracza w wejsciu warunkow".to_owned())
        })?;
        let input = VictoryTurnInput {
            city_owner_ids: state
                .cities
                .iter()
                .map(|c| c.owner_id.get() as i64)
                .collect(),
            gracz,
            flaga_zapisana: state.gracz_kiedys_mial_miasto,
            potega_gracza: potega,
            potegi_wszystkich: powers.values().copied().collect(),
            gracz_era: era,
            ostatnia_epoka: OSTATNIA_EPOKA_GRY_V1,
        };
        Ok(victory_turn_decision(&input))
    }

    fn enqueue_turn_phases(&mut self, turn: u32) {
        for phase in TurnPhase::all() {
            self.phase_queue
                .enqueue(turn, *phase, event_for_phase(turn, *phase));
        }
    }
}

/// P6-ZWYCIESTWO-WIRING: wejscie decyzji po turze (pin main.ts:43441-43483). `gracz` = fotel czlowieka.
#[derive(Debug, Clone, PartialEq)]
pub struct VictoryTurnInput {
    /// Wlasciciele miast (ta sama kolejnosc co `cities`).
    pub city_owner_ids: Vec<i64>,
    pub gracz: i64,
    /// Zapamietana flaga `graczKiedysMialMiasto` przed ocena (pin: Set `playerEverOwnedCityByOwner`).
    pub flaga_zapisana: bool,
    pub potega_gracza: f64,
    pub potegi_wszystkich: Vec<f64>,
    pub gracz_era: i64,
    pub ostatnia_epoka: i64,
}

/// P6-ZWYCIESTWO-WIRING: decyzja warunkow zwyciestwa/porazki po turze. Zwraca (nowa flaga, wynik `checkVictory`).
/// Nowa flaga = zapamietana albo gracz ma miasto teraz (pin: `Set.has` po dopisaniu miasta przy zalozeniu).
/// Pin (main.ts:43479): `_menuAdvanced?.victoryMode ?? 'moc_i_dominacja'`. Brak menu w Rust (UI poza zakresem),
/// wiec zawsze domyslny tryb pina. Rakieta zawsze false (pin nigdzie nie ustawia `rakietaWystrzelona`), wiec
/// nauka pozostaje nieosiagalna przy `NAUKA_WYMAGA_RAKIETY`. `wszystkieTechZbadane` = false bez wplywu na wynik.
pub fn victory_turn_decision(input: &VictoryTurnInput) -> (bool, Option<VictoryResult>) {
    let flag = input.flaga_zapisana || input.city_owner_ids.contains(&input.gracz);
    let victory_input = VictoryInput {
        city_owner_ids: input.city_owner_ids.clone(),
        gracz: input.gracz,
        victory_mode: Some(VictoryMode::MocIDominacja),
        potega_gracza: Some(input.potega_gracza),
        potegi_wszystkich: Some(input.potegi_wszystkich.clone()),
        gracz_era: Some(input.gracz_era),
        ostatnia_epoka: Some(input.ostatnia_epoka),
        wszystkie_tech_zbadane: Some(false),
        rakieta_wystrzelona: Some(false),
        epoka_koncowa: None,
        nauka_ukonczona: None,
        gracz_kiedys_mial_miasto: Some(flag),
    };
    (flag, check_victory(&victory_input))
}

/// P6-ZWYCIESTWO-WIRING: moc (`objectivePowerForOwner`) wszystkich wlascicieli i epoka gracza do warunkow
/// zwyciestwa. Zrodlo: te same producenty co faza wojny (`build_war_inputs`); gdy nie ma miasta AI, wejscia
/// wojny nie zbieraja mocy, wiec moc liczy sie wylacznie dla gracza z epoka startu (jak `DerivedFromStartEra`).
fn victory_power_inputs(state: &PlayableState) -> Result<(BTreeMap<i64, f64>, i64), PlayableError> {
    let to_error = |message: String| PlayableError::VictoryCheck(message);
    let human = HUMAN_PLAYER_ID.get() as i64;
    let inputs = build_war_inputs(state, &state.war).map_err(|e| to_error(e.to_string()))?;
    let config = production_config(state).map_err(|e| to_error(e.to_string()))?;
    let start_epoch =
        start_epoch_number(&state.params.epoch_id).map_err(|e| to_error(e.to_string()))?;
    let (mut raws, epoch) = if inputs.power_raw.is_empty() {
        (BTreeMap::new(), start_epoch)
    } else {
        (
            inputs.power_raw.clone(),
            inputs.epochs.get(&human).copied().unwrap_or(start_epoch),
        )
    };
    if let std::collections::btree_map::Entry::Vacant(slot) = raws.entry(human) {
        let raw: ObjectivePowerRaw =
            power_raw_for_owner(state, human, epoch).map_err(|e| to_error(e.to_string()))?;
        slot.insert(raw);
    }
    let mut powers = BTreeMap::new();
    for (id, raw) in &raws {
        let value = objective_power_for_owner(
            raw,
            &config.power.coeffs,
            config.power.battle,
            &config.power.military,
        )
        .map_err(|e| to_error(format!("moc wlasciciela {id}: {e:?}")))?;
        powers.insert(*id, value);
    }
    Ok((powers, epoch as i64))
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
        improvements: Vec::new(),
    }
}

fn next_seed(state: &mut u32) -> u32 {
    *state = state.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
    *state
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

    /// Gracz AI z miastem = para fazy Diplomacy z produkcyjnymi wejsciami (W8 r4).
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
            population: FOUNDING_CITY_POPULATION,
            culture: 0,
        });
        game
    }

    #[test]
    fn advance_turn_with_ai_city_passes_three_turns_after_stores() {
        // r6 klocek 3 (WIRE-WAR-STORES): infra/tech/religia maja producentow z `PlayableStores` (puste
        // magazyny = realny stan pusty), wiec ostatnie blokery `advance_turn` z AI z miastami znikaja.
        // Zamiana oczekiwania z r6 klocek 2 (`PowerComponentsMissing` z "infra") na przejscie 3 tur.
        let mut game = game_with_ai_city();
        for expected in 2..=4 {
            game.advance_turn().expect("advance_turn z AI z miastami");
            assert_eq!(game.state().turn, expected);
        }
    }

    #[test]
    fn failing_war_phase_restores_queue_turn_and_war_state() {
        // Zepsuty zapis blokad pokoju (nie tablica) = jawny blad producenta, stan wraca.
        let mut game = game_with_ai_city();
        game.state.war.opaque.insert(
            "forcedEraPeaceUntilNextEraByPairKey".to_owned(),
            serde_json::json!("zepsute"),
        );
        let queue_len = game.pending_phase_count();
        let turn = game.state().turn;
        let before = game.state().war.clone();
        let err = game.advance_turn().expect_err("zly zapis blokad -> blad");
        assert!(matches!(err, PlayableError::WarTurn(_)), "{err:?}");
        assert_eq!(game.pending_phase_count(), queue_len, "kolejka cofnieta");
        assert_eq!(game.state().turn, turn, "tura sie nie zwieksza");
        assert_eq!(game.state().war, before, "stan wojny bez zmian");
        assert!(game.state().last_advanced_phases.is_empty());
    }

    #[test]
    fn repeated_advance_after_failure_fails_the_same_way_not_with_queue_incomplete() {
        let mut game = game_with_ai_city();
        game.state.war.opaque.insert(
            "forcedEraPeaceUntilNextEraByPairKey".to_owned(),
            serde_json::json!("zepsute"),
        );
        let first = game.advance_turn().expect_err("blad 1");
        let second = game.advance_turn().expect_err("blad 2");
        assert_eq!(first, second);
        assert!(!matches!(
            second,
            PlayableError::TurnPhaseQueueIncomplete { .. }
        ));
    }
}

#[cfg(test)]
mod awaiting_seat_rollback_tests {
    //! R-RUSTPORT-P4-364-AWAITING-SEAT-R1 (obrona r1, zarzut N3 Evaluatora): niekompletna kolejka faz
    //! (`TurnPhaseQueueIncomplete`) cofa wpisy `player_ever_owned_city` dopisane w fazie Victory, tak jak
    //! cofa flage `gracz_kiedys_mial_miasto` (migawka `ever_owned_before`).
    use super::*;
    use crate::domain::events::EventQueue;

    fn game_with_owner2_city() -> PlayableGame {
        let mut game = PlayableGame::new(StartGameParams {
            seed: 11,
            ..StartGameParams::default()
        })
        .expect("scenario");
        game.add_player(2, "AI".to_owned()).expect("wlasciciel 2");
        game.state.cities.push(PlayableCity {
            id: CityId::new(900),
            owner_id: PlayerId::new(2),
            name: "miasto-2".to_owned(),
            position: PositionDto::new(5, 5),
            is_capital: true,
            population: FOUNDING_CITY_POPULATION,
            culture: 0,
        });
        game
    }

    #[test]
    fn pelna_kolejka_zapisuje_wpis_wlasciciela_2() {
        // Kontrola pozytywna: ta sama gra z pelna kolejka dopisuje wpis w fazie Victory.
        let mut game = game_with_owner2_city();
        assert!(!game.state().ever_owned_city(PlayerId::new(2)));
        game.advance_turn().expect("koniec tury");
        assert!(game.state().ever_owned_city(PlayerId::new(2)));
    }

    #[test]
    fn niekompletna_kolejka_cofa_wpis_zbioru_z_fazy_victory() {
        let mut game = game_with_owner2_city();
        let turn = game.state().turn;
        // Kolejka bez fazy AI: Victory (ostatnia) wykona sie i dopisze wlasciciela 2, a potem
        // `advance_turn` odrzuci niekompletna kolejke i musi cofnac zbior.
        game.phase_queue = EventQueue::new();
        for phase in TurnPhase::all() {
            if *phase != TurnPhase::Ai {
                game.phase_queue
                    .enqueue(turn, *phase, event_for_phase(turn, *phase));
            }
        }
        let err = game
            .advance_turn()
            .expect_err("niekompletna kolejka -> blad");
        assert!(
            matches!(err, PlayableError::TurnPhaseQueueIncomplete { .. }),
            "{err:?}"
        );
        assert!(
            game.state().player_ever_owned_city.is_empty(),
            "wpis z fazy Victory cofniety: {:?}",
            game.state().player_ever_owned_city
        );
        assert_eq!(game.state().turn, turn, "tura sie nie zwieksza");
    }
}

#[cfg(test)]
mod replace_difficulty_label_tests {
    use super::*;

    /// Kazda etykieta stanu z web (`main.ts:44372-44374`) i klucz `_menuDifficulty` ma wlasne mapowanie.
    #[test]
    fn kazda_etykieta_trudnosci_ma_mapowanie() {
        assert_eq!(replace_difficulty_of("Normalny"), Ok(Difficulty::Normal));
        assert_eq!(replace_difficulty_of("normal"), Ok(Difficulty::Normal));
        assert_eq!(replace_difficulty_of("Łatwy"), Ok(Difficulty::Easy));
        assert_eq!(replace_difficulty_of("easy"), Ok(Difficulty::Easy));
        assert_eq!(replace_difficulty_of("Trudny"), Ok(Difficulty::Hard));
        assert_eq!(replace_difficulty_of("hard"), Ok(Difficulty::Hard));
    }

    #[test]
    fn nieznana_etykieta_trudnosci_jest_bledem() {
        assert_eq!(
            replace_difficulty_of("Koszmar"),
            Err(PlayableError::ReplaceDifficultyUnknown(
                "Koszmar".to_owned()
            ))
        );
    }
}

#[cfg(test)]
mod unit_replace_error_tests {
    use super::*;
    use crate::domain::unit_replace_wiring::ReplaceUnitDef;

    fn defs() -> BTreeMap<String, ReplaceUnitDef> {
        let mut table = BTreeMap::new();
        table.insert(
            "Wojownik".to_owned(),
            ReplaceUnitDef {
                category: "Wrecz".to_owned(),
                money_cost: 2.0,
                stock_source: None,
                max_hp: 10.0,
            },
        );
        table.insert(
            "Wlocznik".to_owned(),
            ReplaceUnitDef {
                category: "Wrecz".to_owned(),
                money_cost: 4.0,
                stock_source: None,
                max_hp: 14.0,
            },
        );
        table
    }

    fn game_with_treasury() -> PlayableGame {
        let mut game = PlayableGame::new(StartGameParams {
            seed: 7,
            ..StartGameParams::default()
        })
        .expect("scenariusz startowy");
        game.set_human_treasury(100.0).expect("skarbiec");
        game
    }

    /// Jednostka gracza ludzkiego z wycinka startowego.
    fn human_unit_id(game: &PlayableGame) -> u64 {
        game.state()
            .units
            .iter()
            .find(|unit| unit.owner_id == HUMAN_PLAYER_ID)
            .map(|unit| unit.id.get())
            .expect("jednostka gracza")
    }

    #[test]
    fn nieistniejaca_jednostka_daje_unit_not_found() {
        let mut game = game_with_treasury();
        let before = game.state().clone();
        assert_eq!(
            game.replace_unit_with_defs(999_999, "Wlocznik", &defs(), None),
            Err(PlayableError::UnitNotFound(999_999))
        );
        assert_eq!(game.state(), &before, "brak mutacji");
    }

    #[test]
    fn jednostka_innego_gracza_daje_unit_not_owned() {
        let mut game = game_with_treasury();
        game.add_player(2, "AI".to_owned()).expect("ai");
        game.state.units.push(PlayableUnit {
            id: UnitId::new(900),
            owner_id: PlayerId::new(2),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(5, 5),
            movement: MovementPoints::from(2_u8),
            movement_max: MovementPoints::from(2_u8),
            selected: false,
        });
        let before = game.state().clone();
        assert_eq!(
            game.replace_unit_with_defs(900, "Wlocznik", &defs(), None),
            Err(PlayableError::UnitNotOwned(900))
        );
        assert_eq!(game.state(), &before, "brak mutacji");
    }

    #[test]
    fn brak_miasta_gracza_daje_no_city_for_replace() {
        let mut game = game_with_treasury();
        let unit = human_unit_id(&game);
        game.state
            .cities
            .retain(|city| city.owner_id != HUMAN_PLAYER_ID);
        let before = game.state().clone();
        assert_eq!(
            game.replace_unit_with_defs(unit, "Wlocznik", &defs(), None),
            Err(PlayableError::NoCityForReplace)
        );
        assert_eq!(game.state(), &before, "brak mutacji");
    }

    #[test]
    fn miasto_gracza_bez_stolicy_daje_no_city_for_replace() {
        let mut game = game_with_treasury();
        for city in &mut game.state.cities {
            if city.owner_id == HUMAN_PLAYER_ID {
                city.is_capital = false;
            }
        }
        let unit = human_unit_id(&game);
        assert_eq!(
            game.replace_unit_with_defs(unit, "Wlocznik", &defs(), None),
            Err(PlayableError::NoCityForReplace)
        );
        assert_eq!(
            game.set_capital_stock(StockRecord::from([("drewno".to_owned(), 5.0)])),
            Err(PlayableError::NoCityForReplace)
        );
        assert!(
            game.state().economy.city_stock.is_empty(),
            "brak puli bez stolicy"
        );
    }

    #[test]
    fn set_capital_stock_odrzuca_nieskonczone_wartosci() {
        let mut game = game_with_treasury();
        assert_eq!(
            game.set_capital_stock(StockRecord::from([("drewno".to_owned(), f64::NAN)])),
            Err(PlayableError::NonFiniteEconomy)
        );
        assert!(game.state().economy.city_stock.is_empty(), "stan bez zmian");
    }

    /// P6-ZWYCIESTWO-WIRING (kryterium 1, pin main.ts:34018-34025 / checkDefeat): gracz, ktory mial miasto
    /// i stracil wszystkie, przegrywa na fazie Victory. Test w module, bo wymaga ustawienia stanu miast.
    #[test]
    fn przegrana_po_utracie_wszystkich_miast_konczy_gre() {
        let mut game = PlayableGame::new(StartGameParams {
            epoch_id: "kamien".to_owned(),
            ..StartGameParams::default()
        })
        .expect("nowa gra");
        game.advance_turn().expect("tura z miastem");
        assert!(game.state.gracz_kiedys_mial_miasto);
        assert_eq!(game.state.koniec_gry, None, "kamien: brak dominacji");
        game.state
            .cities
            .retain(|city| city.owner_id != HUMAN_PLAYER_ID);
        game.advance_turn().expect("tura po eliminacji");
        let result = game.state.koniec_gry.expect("przegrana po eliminacji");
        assert_eq!(
            result.rodzaj,
            crate::domain::victory::VictoryKind::Przegrana
        );
    }

    fn kamien_game() -> PlayableGame {
        PlayableGame::new(StartGameParams {
            epoch_id: "kamien".to_owned(),
            ..StartGameParams::default()
        })
        .expect("nowa gra")
    }

    /// Pin checkDefeat z flaga `false` (`graczKiedysMialMiasto` = false): utrata miast nie przegrywa.
    #[test]
    fn bez_zapamietanego_miasta_utrata_miast_nie_daje_przegranej() {
        let mut game = kamien_game();
        game.state.cities.clear();
        game.state.gracz_kiedys_mial_miasto = false;
        game.advance_turn().expect("koniec tury");
        assert_eq!(game.state.koniec_gry, None);
        assert!(!game.state.gracz_kiedys_mial_miasto);
    }

    /// Wczytanie zapisu bez flagi (pin jej nie zapisuje): flaga = false po deserializacji; odtworzenie ze
    /// miast (pin main.ts:46368-46370) przed utrata miasta daje przegrana na fazie Victory.
    #[test]
    fn wczytany_zapis_odtwarza_flage_ze_miast_przed_utrata() {
        let game = kamien_game();
        let json = serde_json::to_string(&game.state).expect("zapis");
        let mut loaded: PlayableState = serde_json::from_str(&json).expect("wczytanie");
        assert!(
            !loaded.gracz_kiedys_mial_miasto,
            "po wczytaniu flaga = false"
        );
        assert_eq!(loaded.koniec_gry, None);
        loaded.odtworz_flage_zwyciestwa_ze_miast();
        assert!(loaded.gracz_kiedys_mial_miasto, "stolica w zapisie");
        loaded
            .cities
            .retain(|city| city.owner_id != HUMAN_PLAYER_ID);
        let mut resumed = PlayableGame {
            state: loaded,
            phase_queue: game.phase_queue.clone(),
            fog: game.fog.clone(),
            siege_battle: None,
            siege_battles_started: 0,
        };
        resumed.advance_turn().expect("tura po wczytaniu");
        let result = resumed.state.koniec_gry.expect("przegrana po wczytaniu");
        assert_eq!(
            result.rodzaj,
            crate::domain::victory::VictoryKind::Przegrana
        );
    }
    /// P6-ZWYCIESTWO-WIRING (r3, semantyka pina main.ts:43441-43483): blad sprawdzenia zwyciestwa jest logowany
    /// (pin: console.error w catch) i tura trwa; blad NIE cofa tury. Wymuszenie bledu: nieznana epoka startu,
    /// ktora `victory_power_inputs` odrzuca.
    #[test]
    fn blad_sprawdzenia_zwyciestwa_nie_cofa_tury() {
        let mut game = kamien_game();
        game.state.params.epoch_id = "nieznana-epoka".to_owned();
        assert!(
            game.evaluate_victory().is_err(),
            "scenariusz: blad sprawdzenia"
        );
        let turn_before = game.state.turn;
        game.advance_turn()
            .expect("tura przechodzi mimo bledu sprawdzenia zwyciestwa");
        assert_eq!(game.state.turn, turn_before + 1);
        assert_eq!(game.state.koniec_gry, None, "blad nie ustawia konca gry");
    }
}

/// P4-1H (`R-RUSTPORT-P4-1H-CANCEL-Q2`): komenda gry z planami w stanie i obca jednostka; stanu
/// `PlayableGame` nie da sie zbudowac z zewnatrz modulu, wiec te przypadki sa tutaj, a wektory
/// czystej logiki w `tests/p4_1h_cancel_planned_march.rs`.
#[cfg(test)]
mod cancel_planned_march_game_tests {
    use super::*;

    const FOREIGN_UNIT: u64 = 900;

    fn plan(unit: u64, attack: Option<u64>) -> PlayablePlannedMarch {
        PlayablePlannedMarch {
            unit_id: UnitId::new(unit),
            dest_q: 4,
            dest_r: 2,
            attack_unit_id: attack.map(UnitId::new),
            general_target_id: None,
        }
    }

    fn game_with_plan(attack: Option<u64>) -> PlayableGame {
        let mut game = PlayableGame::new(StartGameParams::default()).expect("scenariusz");
        let mut foreign = game.state.units[0].clone();
        foreign.id = UnitId::new(FOREIGN_UNIT);
        foreign.owner_id = PlayerId::new(2);
        game.state.units.push(foreign);
        let own = UnitId::new(STARTING_UNIT_ID);
        game.state
            .planned_marches
            .push(plan(STARTING_UNIT_ID, attack));
        game.state.planned_marches.push(plan(FOREIGN_UNIT, None));
        if let Some(target) = attack {
            game.state
                .march_attack_targets
                .insert(own, UnitId::new(target));
        }
        game.state
            .march_stop_notified
            .insert(own, PlayableMarchStopReason::Obstacle);
        game.state
            .march_stop_detail
            .insert(own, "Wstrzymano: przeszkoda".to_owned());
        game
    }

    fn has_own_entries(state: &PlayableState) -> bool {
        let own = UnitId::new(STARTING_UNIT_ID);
        state.planned_marches.iter().any(|p| p.unit_id == own)
            || state.march_attack_targets.contains_key(&own)
            || state.march_stop_notified.contains_key(&own)
            || state.march_stop_detail.contains_key(&own)
    }

    #[test]
    fn attack_plan_survives_without_force_and_is_cleared_with_force() {
        let mut game = game_with_plan(Some(FOREIGN_UNIT));
        let before = game.state.clone();
        game.cancel_planned_march(STARTING_UNIT_ID, false)
            .expect("wlasna jednostka");
        assert_eq!(game.state, before, "web main.ts:31052 return");
        game.cancel_planned_march(STARTING_UNIT_ID, true)
            .expect("wlasna jednostka");
        assert!(!has_own_entries(&game.state));
        assert_eq!(game.state.planned_marches, vec![plan(FOREIGN_UNIT, None)]);
    }

    #[test]
    fn plain_plan_is_cleared_without_force() {
        let mut game = game_with_plan(None);
        game.cancel_planned_march(STARTING_UNIT_ID, false)
            .expect("wlasna jednostka");
        assert!(!has_own_entries(&game.state));
        let after = game.state.clone();
        game.cancel_planned_march(STARTING_UNIT_ID, false)
            .expect("drugie wywolanie = Map.delete bez efektu");
        assert_eq!(game.state, after);
    }

    #[test]
    fn foreign_and_unknown_units_are_rejected_without_changes() {
        for force in [false, true] {
            let mut game = game_with_plan(Some(FOREIGN_UNIT));
            let before = game.state.clone();
            assert_eq!(
                game.cancel_planned_march(FOREIGN_UNIT, force),
                Err(PlayableError::UnitNotOwned(FOREIGN_UNIT))
            );
            assert_eq!(
                game.cancel_planned_march(424_242, force),
                Err(PlayableError::UnitNotFound(424_242))
            );
            assert_eq!(game.state, before);
        }
    }
}

#[cfg(test)]
mod r7k7c_rollback_tests {
    //! P6-WIRE-R7K7C (zarzut 6, runda 2): cofniecie salda skarbca po bledzie kolejki faz.
    //! Faza Diplomacy zdazy zastosowac przyrost (danina AI 2 -> gracz 1), a potem kolejka okazuje sie
    //! niekompletna (`phases.len() != PHASE_COUNT`). Migawka `economy_before` musi cofnac skarbiec i skarbiec AI.
    use super::*;
    use crate::domain::diplomacy::{ActiveDeal, TreatyEconomy, TreatyKind};
    use crate::domain::events::EventQueue;
    use crate::domain::PlayerId;

    fn tribute_game() -> PlayableGame {
        let mut game = PlayableGame::new(StartGameParams {
            seed: 11,
            ..StartGameParams::default()
        })
        .expect("scenario");
        game.add_player(2, "AI".to_owned()).expect("ai");
        let mut deal = ActiveDeal::new(
            TreatyKind::Vassalization,
            PlayerId::new(2),
            PlayerId::new(1),
            1,
            None,
        );
        deal.id = "danina".to_owned();
        deal.economy = Some(TreatyEconomy {
            payer_owner_id: PlayerId::new(2),
            receiver_owner_id: PlayerId::new(1),
            money_per_turn: 40.0,
        });
        let mut state = game.state().clone();
        state.economy.treasury = 10.0;
        state.economy.ai_treasury_by_owner.insert(2, 100.0);
        state.war.diplomacy.add_deal(deal);
        PlayableGame::from_state(state)
    }

    #[test]
    fn niekompletna_kolejka_cofa_przyrost_skarbca_z_fazy_dyplomacji() {
        let mut game = tribute_game();
        let turn = game.state().turn;
        // Kolejka bez fazy AI: Diplomacy zastosuje platnosc, a `advance_turn` odrzuci niekompletna kolejke.
        game.phase_queue = EventQueue::new();
        for phase in TurnPhase::all() {
            if *phase != TurnPhase::Ai {
                game.phase_queue
                    .enqueue(turn, *phase, event_for_phase(turn, *phase));
            }
        }
        let err = game
            .advance_turn()
            .expect_err("niekompletna kolejka -> blad");
        assert!(
            matches!(err, PlayableError::TurnPhaseQueueIncomplete { .. }),
            "{err:?}"
        );
        // Bez cofniecia byloby 50 (gracz) i 60 (AI): przyrost z Diplomacy musi zostac cofniety.
        assert_eq!(
            game.state().economy.treasury,
            10.0,
            "skarbiec gracza cofniety"
        );
        assert_eq!(
            game.state().economy.ai_treasury_by_owner.get(&2).copied(),
            Some(100.0),
            "skarbiec AI cofniety"
        );
        assert_eq!(game.state().turn, turn, "tura sie nie zwieksza");
    }
}

#[cfg(test)]
mod siege_battle_exit_tests {
    //! R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 obrona r1 (Z6, D-WIRB-8): `FinishSiegeBattle` jest zawsze wyjsciem z bitwy.
    //! Blad zastosowania wyniku (tu: miasto usuniete ze stanu gry poza komendami — jedyny sposob, by w tescie wywolac
    //! blad po koncu bitwy bez sciezki nieportowanej) zamyka bitwe bez zmiany stanu i odblokowuje komendy mapy.
    use super::*;
    use crate::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
    use crate::domain::siege_battle_session::SessionError;
    use crate::domain::{CityId, PlayerId, UnitId};

    const CITY: u64 = 900;

    fn add_unit(st: &mut PlayableState, id: u64, owner: u64, pos: (u16, u16)) {
        st.units.push(PlayableUnit {
            id: UnitId::new(id),
            owner_id: PlayerId::new(owner),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(pos.0, pos.1),
            movement: 1u8.into(),
            movement_max: 1u8.into(),
            selected: false,
        });
        st.economy.units.insert(
            id,
            PlayableReplaceUnit {
                type_id: Some("Wojownik".to_owned()),
                ..PlayableReplaceUnit::default()
            },
        );
    }

    fn storm_game() -> PlayableGame {
        let mut st = PlayableGame::new(StartGameParams {
            seed: 11,
            ..StartGameParams::default()
        })
        .expect("start")
        .state()
        .clone();
        for t in &mut st.map.tiles {
            t.terrain = PlayableTerrain::Plains;
            t.passable = true;
        }
        st.units.clear();
        st.economy.units.clear();
        st.players.push(PlayablePlayer {
            id: PlayerId::new(101),
            name: "wrog".into(),
            civilization: "rzymianie".into(),
            is_human: false,
        });
        st.war.diplomacy.set_relation(
            CivilizationPair::new(PlayerId::new(1), PlayerId::new(101)),
            Relation::new(50.0, 50.0, RelationStatus::War),
        );
        st.cities.push(PlayableCity {
            id: CityId::new(CITY),
            owner_id: PlayerId::new(101),
            name: "Twierdza".into(),
            position: PositionDto::new(4, 3),
            is_capital: false,
            population: 3,
            culture: 0,
        });
        st.stores
            .buildings_by_city
            .insert(CITY, vec!["palisada".to_owned()]);
        st.oblegane.insert(CityId::new(CITY));
        for i in 0..5 {
            add_unit(&mut st, 7001 + i, 1, (5, 3));
        }
        add_unit(&mut st, 8001, 101, (4, 3));
        PlayableGame::from_state(st)
    }

    #[test]
    fn finish_z_bledem_zamyka_bitwe_bez_zmiany_stanu() {
        let mut g = storm_game();
        g.start_siege_storm(CITY, 7001).expect("start");
        // Przed koncem: `NotFinished` nie zamyka bitwy.
        assert_eq!(
            g.finish_siege_battle(),
            Err(SiegeBattleError::Session(SessionError::NotFinished))
        );
        assert!(g.siege_battle().is_some());
        g.skip_siege_battle().expect("skip");
        g.state.cities.retain(|c| c.id.get() != CITY);
        let before = g.state.clone();
        let e = g.finish_siege_battle().expect_err("blad zastosowania");
        assert!(
            matches!(e, SiegeBattleError::Aborted { city_id: CITY, .. }),
            "{e:?}"
        );
        assert!(g.siege_battle().is_none(), "bitwa zamknieta");
        assert_eq!(g.state, before, "stan bez zmian");
        assert!(!matches!(
            g.advance_turn(),
            Err(PlayableError::SiegeBattleInProgress { .. })
        ));
        assert_eq!(
            g.finish_siege_battle(),
            Err(SiegeBattleError::NoActiveBattle)
        );
    }
}
