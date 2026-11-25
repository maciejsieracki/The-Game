//! Versioned save/load snapshot for the Rust/Tauri boundary.
//!
//! The wire contract is deliberately small and explicit:
//!
//! * version 1 contains `version`, a validated `state`, and the raw `rng_state`;
//! * version 2 is the current format and contains `version`, `state`, `rng`, and
//!   the serializable deterministic `event_queue`;
//! * loading version 1 migrates it to version 2 by restoring the RNG state and
//!   starting with an empty event queue;
//! * every other version is rejected instead of being silently defaulted.
//!
//! This module only defines the serializable domain value.  A Tauri command or
//! file adapter can use serde's `Serialize` implementation at its JSON boundary
//! without coupling the engine to storage or UI code.  `SaveSnapshot` has no
//! public `Deserialize`: loading goes through a public load path that runs the
//! migrations, `zapis_loader::load_save_snapshot` (replay logs use
//! `ReplayLog::load_json_with_migration_reports`).

use std::{collections::BTreeMap, error::Error, fmt};

use serde::{de, Deserialize, Deserializer, Serialize};
use serde_json::{Map, Number, Value};

// The source file is currently exercised as an integration-test path module.
// The production branch resolves these types from the sibling domain modules;
// the test branch resolves them from the same path-loaded dependency module.
#[cfg(not(test))]
use super::auto_improvements::auto_build_gate::auto_build_from_save_meta;
#[cfg(not(test))]
use super::auto_improvements::auto_build_gate::is_auto_build_allowed_for_owner;
#[cfg(not(test))]
use super::diplomacy_multiwar::player_epoch_war_enabled;
#[cfg(not(test))]
use super::save_migrations::{migrate_loaded_state, LoadMigrationReport};
#[cfg(not(test))]
use super::war_turn_state::{managed_meta_keys, WarTurnState};
#[cfg(not(test))]
use super::PlayerId;
#[cfg(not(test))]
use super::{
    pathfinding::ruch_jednostek::{
        planned_marches_from_save, planned_marches_to_save, AutoMarchSave, PlannedMarchDest,
        PlannedMarchSaved, RuchJednostka,
    },
    playable::{
        PlayableFogSession, PlayablePlacedWonder, PlayablePlannedMarch, PlayableSiegeMachineKind,
        PlayableState,
    },
    CityId, UnitId,
};
#[cfg(not(test))]
use super::{GameStateDto, Rng};
#[cfg(test)]
use civ_engine::domain::auto_improvements::auto_build_gate::auto_build_from_save_meta;
#[cfg(test)]
use civ_engine::domain::auto_improvements::auto_build_gate::is_auto_build_allowed_for_owner;
#[cfg(test)]
use civ_engine::domain::diplomacy_multiwar::player_epoch_war_enabled;
#[cfg(test)]
use civ_engine::domain::save_migrations::{migrate_loaded_state, LoadMigrationReport};
#[cfg(test)]
use civ_engine::domain::war_turn_state::{managed_meta_keys, WarTurnState};
#[cfg(test)]
use civ_engine::PlayerId;
#[cfg(test)]
use civ_engine::{
    domain::pathfinding::ruch_jednostek::{
        planned_marches_from_save, planned_marches_to_save, AutoMarchSave, PlannedMarchDest,
        PlannedMarchSaved, RuchJednostka,
    },
    domain::playable::{
        PlayableFogSession, PlayablePlacedWonder, PlayablePlannedMarch, PlayableSiegeMachineKind,
        PlayableState,
    },
    CityId, UnitId,
};
#[cfg(test)]
use civ_engine::{GameStateDto, Rng};

#[cfg(not(test))]
pub use super::events::{EventQueue, TurnEvent, TurnPhase};
#[cfg(test)]
pub use crate::events::{EventQueue, TurnEvent, TurnPhase};

/// The current on-disk snapshot format.
pub const CURRENT_SNAPSHOT_VERSION: u16 = 2;

/// The only legacy format accepted by the migration boundary.
pub const LEGACY_SNAPSHOT_VERSION: u16 = 1;

/// Errors raised when a snapshot cannot be restored safely.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SnapshotError {
    /// The version field was not present in the input object.
    MissingVersion,
    /// The version is outside the explicitly supported migration boundary.
    UnsupportedVersion { found: u16, current: u16 },
    /// A field required by a known version was absent.
    MissingField { version: u16, field: &'static str },
    /// The state DTO violated one of its domain invariants.
    InvalidState(String),
}

impl fmt::Display for SnapshotError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingVersion => formatter.write_str("snapshot version is missing"),
            Self::UnsupportedVersion { found, current } => write!(
                formatter,
                "unsupported snapshot version {found}; current version is {current}"
            ),
            Self::MissingField { version, field } => {
                write!(
                    formatter,
                    "snapshot version {version} is missing field {field:?}"
                )
            }
            Self::InvalidState(error) => write!(formatter, "snapshot state is invalid: {error}"),
        }
    }
}

impl Error for SnapshotError {}

/// The minimal, current save/load snapshot.
///
/// The version is private so a caller cannot serialize a version-2 payload
/// stamped as an unsupported version.  Use [`SaveSnapshot::version`] to inspect
/// it and [`SaveSnapshot::new`] to construct a current snapshot.
///
/// `SaveSnapshot` nie implementuje `Deserialize`: wczytanie wymaga migracji, wiec jedyne sciezki
/// to `zapis_loader::load_save_snapshot` i `ReplayLog::load_json_with_migration_reports`.
/// Ponizszy doctest pilnuje tego na poziomie kompilacji (R-RUSTPORT-ZAPIS-SAVESNAPSHOT-DESER-Q1).
///
/// ```compile_fail,E0277
/// fn requires_deserialize<T: serde::de::DeserializeOwned>() {}
/// requires_deserialize::<civ_engine::domain::save_load::SaveSnapshot>();
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SaveSnapshot {
    version: u16,
    state: GameStateDto,
    event_queue: EventQueue<TurnEvent>,
    rng: Rng,
    /// Additive, optional save metadata (REPIN-WOJNA-2 R4). Absent in older saves.
    #[serde(skip_serializing_if = "SaveMeta::is_empty")]
    meta: SaveMeta,
    /// Additive, optional `plannedMarches` entries (web `planned-march.ts:466`).
    #[serde(
        rename = "plannedMarches",
        default,
        skip_serializing_if = "Vec::is_empty"
    )]
    planned_marches: Vec<SavedPlannedMarch>,
    /// Additive legacy `autoMarch` fallback (web `planned-march.ts:424-431`).
    #[serde(rename = "autoMarch", default, skip_serializing_if = "Option::is_none")]
    auto_march: Option<SavedAutoMarch>,
    /// P6-ZAPIS-ERA-ZAPISU: epoka wlascicieli wyprowadzona z zapisu (klucz = id wlasciciela), zrodla
    /// jak web `empireEpochForOwner` (`main.ts:2069`): ludzie z `gracze[].era`, AI z `meta.ownerEraByOwner`.
    /// Pomijana przy serializacji (zrodla pozostaja w zapisie jak dotad).
    #[serde(skip)]
    owner_eras: BTreeMap<u64, Number>,
    /// Surowe top-level `gracze` z zapisu (web `playerStateByHuman`). Przepisywane bez zmian przy
    /// serializacji, zeby epoka ludzi przezyla ponowny zapis i odczyt.
    #[serde(rename = "gracze", skip_serializing_if = "Option::is_none")]
    gracze: Option<Value>,
    /// P4-1F3: stan oblezenia miast `PlayableState` (web `City.oblegane` i `City.siegeMachines.ready`,
    /// `game/cities.ts:858`, `:884`). Web zapisuje je w obiektach miast, a `GameStateDto` ich nie
    /// niesie, wiec Rust trzyma je w addytywnym kluczu `citySiege` (pola wpisu = nazwy weba). Pusty =>
    /// klucz pomijany (zapis sprzed zmiany bajt w bajt).
    #[serde(rename = "citySiege", default, skip_serializing_if = "Vec::is_empty")]
    city_siege: Vec<SavedCitySiege>,
    /// R-RUSTPORT-P4-364-FOG-SAVE-R1 (D-FS-1): odkryta mgla per fotel czlowieka, web `exploredByHuman`
    /// (`game/save.ts:359-363`, zapis `main.ts:37229-37239`): tablica par `[ownerId, ["q,r", ...]]`.
    /// Zrodlo: [`PlayableFogSession::explored_by_human`] (poza `GameStateDto`/replay, D-FS-2). Pusty =>
    /// klucz pomijany (zapis bez eksploracji bajt w bajt jak przed zmiana).
    #[serde(
        rename = "exploredByHuman",
        default,
        skip_serializing_if = "Vec::is_empty"
    )]
    explored_by_human: Vec<SavedExploredSeat>,
    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (U5): web top-level `activeHumanOwnerId` (`game/save.ts:376-377`,
    /// zapis `main.ts:37242`, odczyt `:46379-46382`): aktywny fotel czlowieka (`ME()`). Id = `PlayerId` sesji
    /// Rust (fotel glowny = 1, D-FS-5). Brak => klucz pomijany (zapis bez sesji bajt w bajt jak przed zmiana);
    /// przy odczycie brak albo nie-liczba => fotel glowny (web `typeof === 'number' ? v : 0`, `save.ts:728`).
    #[serde(
        rename = "activeHumanOwnerId",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    active_human_owner_id: Option<u64>,
    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (D-SLB-1): stan `PlayableGame`, ktorego `GameStateDto` nie niesie
    /// (pola web `units[]` / `cities[]` / map sesji Rust). Brak => klucz pomijany; zapis bez sesji jest bajt w
    /// bajt jak przed zmiana. Zly ksztalt => blad wczytania (to forma Rust, nie weba).
    #[serde(rename = "playable", default, skip_serializing_if = "Option::is_none")]
    playable: Option<SavedPlayableSession>,
}

/// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (D-SLB-1): cialo sesji `PlayableGame` w zapisie.
///
/// `state` to `PlayableState` BEZ pol niesionych przez klucze w formacie weba (te zapisuje i odtwarza
/// wolajacy, `PlayableGame::save_snapshot` / `PlayableGame::from_save_snapshot`): `war` (w `state.war`
/// snapshotu), plany marszu (`plannedMarches` / `autoMarch`), `oblegane` / `siegeMachines.ready`
/// (`citySiege`), `placedWorldWonders` (`meta`). Pola, ktorych pin nie zapisuje (zaznaczenie, dziennik
/// zdarzen zdobycia, mapy powiadomien marszu), sa puste.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedPlayableSession {
    /// Stan gry sesji (patrz opis typu).
    pub state: PlayableState,
    /// D-WIR-5: licznik bitew oblezniczych sesji = punkt kontrolny strumienia RNG bitew
    /// (`SessionRolls::derive(seed, numer bitwy)`); web zapisuje `seed` (`main.ts:37236`), ktory jest w
    /// `state.params.seed`. Brak pola => 0.
    #[serde(default)]
    pub siege_battles_started: u32,
}

/// R-RUSTPORT-P4-364-FOG-SAVE-R1: jeden wpis `exploredByHuman` zapisu - web `[ownerId, string[]]`.
/// Klucze heksow trzymane jako `(q, r)`; w JSON jak web `hexKey` (`"q,r"`, `main.ts:13480-13483`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SavedExploredSeat {
    /// Id wlasciciela-fotela (`PlayerId` sesji Rust).
    pub owner_id: u64,
    /// Odkryte heksy fotela `(q, r)`, w kolejnosci zapisu.
    pub keys: Vec<(i32, i32)>,
}

impl Serialize for SavedExploredSeat {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let keys: Vec<String> = self.keys.iter().map(|(q, r)| format!("{q},{r}")).collect();
        (self.owner_id, keys).serialize(serializer)
    }
}

/// R-RUSTPORT-P4-364-FOG-SAVE-R1 (D-FS-3): blad wczytania `exploredByHuman` - jawny, z numerem pozycji
/// (zakaz cichego pominiecia wpisu albo klucza).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExploredByHumanLoadError {
    /// Wpis `entry` nie jest para `[ownerId, string[]]` z calkowitym `ownerId >= 0`.
    BadEntry { entry: usize },
    /// Klucz `key` wpisu `entry` nie jest kanonicznym kluczem heksu `"q,r"` (liczby calkowite `i32`);
    /// `value` = ten klucz jako tekst JSON.
    BadKey {
        entry: usize,
        key: usize,
        value: String,
    },
}

impl fmt::Display for ExploredByHumanLoadError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BadEntry { entry } => write!(
                formatter,
                "exploredByHuman[{entry}] is not an [ownerId, string[]] pair"
            ),
            Self::BadKey { entry, key, value } => write!(
                formatter,
                "exploredByHuman[{entry}][1][{key}] = {value} is not a hex key \"q,r\""
            ),
        }
    }
}

impl Error for ExploredByHumanLoadError {}

/// R-RUSTPORT-P4-364-FOG-SAVE-R1: kanoniczny klucz heksu web `${q},${r}` -> `(q, r)`; inna forma
/// (spacje, `+`, zera wiodace, brak przecinka, poza `i32`) -> `None`.
fn parse_canonical_hex_key(text: &str) -> Option<(i32, i32)> {
    let (q, r) = text.split_once(',')?;
    let q: i32 = q.parse().ok()?;
    let r: i32 = r.parse().ok()?;
    (format!("{q},{r}") == text).then_some((q, r))
}

/// R-RUSTPORT-P4-364-FOG-SAVE-R1: `exploredByHuman` z surowego JSON zapisu. Jak web `normalize`
/// (`game/save.ts:725`): brak klucza albo nie-tablica => `[]`. W tablicy kazdy wpis i kazdy klucz musi
/// byc poprawny, inaczej jawny blad z numerem pozycji (D-FS-3).
fn explored_by_human_from_save(
    value: Option<&Value>,
) -> Result<Vec<SavedExploredSeat>, ExploredByHumanLoadError> {
    let Some(Value::Array(items)) = value else {
        return Ok(Vec::new());
    };
    let mut out = Vec::with_capacity(items.len());
    for (entry, item) in items.iter().enumerate() {
        let bad_entry = || ExploredByHumanLoadError::BadEntry { entry };
        let Value::Array(pair) = item else {
            return Err(bad_entry());
        };
        let [owner, keys] = pair.as_slice() else {
            return Err(bad_entry());
        };
        // Jak `placedWorldWonders.ownerId`: liczba JS calkowita `>= 0` (takze `1.0`), inaczej blad.
        let owner_id = owner.as_f64().and_then(js_owner_id).ok_or_else(bad_entry)?;
        let Value::Array(keys) = keys else {
            return Err(bad_entry());
        };
        let mut parsed = Vec::with_capacity(keys.len());
        for (key, raw) in keys.iter().enumerate() {
            let hex = raw
                .as_str()
                .and_then(parse_canonical_hex_key)
                .ok_or_else(|| ExploredByHumanLoadError::BadKey {
                    entry,
                    key,
                    value: raw.to_string(),
                })?;
            parsed.push(hex);
        }
        out.push(SavedExploredSeat {
            owner_id,
            keys: parsed,
        });
    }
    Ok(out)
}

/// P4-1F3: stan oblezenia jednego miasta w zapisie (`citySiege[]`), pola jak web `City`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedCitySiege {
    /// Id miasta (`GameStateDto` / `PlayableState`).
    pub city_id: CityId,
    /// Web `city.oblegane` (`undefined`/`false` => pole pominiete).
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub oblegane: bool,
    /// Web `city.siegeMachines` (tylko `ready`; `queue`/`buildProgress` poza zakresem P4-1F3).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub siege_machines: Option<SavedSiegeMachines>,
}

/// P4-1F3: web `SiegeMachinesState.ready` (`game/siegeMachines.ts:8-12`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SavedSiegeMachines {
    /// Gotowe machiny w kolejnosci tablicy.
    #[serde(default)]
    pub ready: Vec<PlayableSiegeMachineKind>,
}

/// Web `AutoMarchSave` (`autoMarch` in the save). Only `leaderId` as non-empty string survives.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SavedAutoMarch {
    #[serde(
        rename = "leaderId",
        default,
        deserialize_with = "lenient_nonempty_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub leader_id: Option<String>,
    #[serde(
        rename = "destQ",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_q: Option<Number>,
    #[serde(
        rename = "destR",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_r: Option<Number>,
}

/// Additive save metadata. Mirrors the web `meta` block only for the fields that gate
/// battle-mode semantics (web `main.ts:40818-40820` and `main.ts:32378`).
///
/// Values are kept as raw JSON so that a non-conforming value (string, `null`, `NaN`
/// written as `null`) is normalized by the same rules as the web, never by a load error.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SaveMeta {
    #[serde(
        rename = "battleModeSettingVersion",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    battle_mode_setting_version: Option<Value>,
    /// Web `meta.newGameParams` (carries `advanced.battleAlwaysManual`).
    #[serde(
        rename = "newGameParams",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    new_game_params: Option<Value>,
    /// P6-ZAPIS-ERAWAR: web `meta.warRulesEraWarCountByCiv` (R-WEB-ERA-WAR-COUNTER-Q1), tablica
    /// par `[klucz, n]` w kolejności wstawiania. Trzymane jako surowy JSON: zły typ w tym polu nie
    /// może unieważnić całego bloku `meta`; reguły odczytu są w
    /// `diplomacy_multiwar::restore_era_war_counts` (web `restoreEraWarCounts`).
    #[serde(
        rename = "warRulesEraWarCountByCiv",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    era_war_count_by_civ: Option<Value>,
    /// P6-WIRE-WAR-STATE: pozostale klucze `meta` (web `buildSaveGameSnapshot`, `main.ts:36874-37051`),
    /// zachowane jako surowy JSON, zeby round-trip nie gubil danych. Stan wojny czyta/pisze
    /// `war_turn_state::WarTurnState` (`war_turn_state` / `with_war_turn_state`).
    #[serde(flatten, default, skip_serializing_if = "Map::is_empty")]
    extra: Map<String, Value>,
}

impl SaveMeta {
    /// True when no metadata field is present (used to omit the block from the output).
    pub fn is_empty(&self) -> bool {
        self.battle_mode_setting_version.is_none()
            && self.new_game_params.is_none()
            && self.era_war_count_by_civ.is_none()
            && self.extra.is_empty()
    }

    /// Stan wojny tury odczytany z pozostalych kluczy `meta` (brak kluczy => stan pusty).
    pub fn war_turn_state(&self) -> WarTurnState {
        WarTurnState::from_meta_json(&self.extra)
    }

    /// Surowy `meta.ownerEraByOwner` (web: tablica `[[ownerId, era]]` epok AI), gdy jest w zapisie.
    pub fn owner_era_entries(&self) -> Option<&Value> {
        self.extra.get("ownerEraByOwner")
    }

    /// P6-ZAPIS-ERA-ZAPISU: epoka startowa wlasciciela BEZ wpisu epoki w zapisie. Wyprowadzona z
    /// `meta.newGameParams.epochId` tak jak web `loadStartEra` (`main.ts:38405-38411`): `zelazo` = 3,
    /// `braz` = 2, `kamien` = 1. Brak pola albo nieznany id = 1. ODCHYLENIE od weba: web w takim
    /// przypadku bierze `player.era` z sesji, a Rust nie ma sesji, wiec przyjmuje 1.
    pub fn start_era_fallback(&self) -> f64 {
        match self
            .new_game_params
            .as_ref()
            .and_then(|params| params.get("epochId"))
            .and_then(Value::as_str)
        {
            Some("zelazo") => 3.0,
            Some("braz") => 2.0,
            _ => 1.0,
        }
    }

    /// Zapisuje stan wojny do `meta`. Stan domyslny nie zostawia kluczy wojennych (zapis jak przed W1).
    pub fn with_war_turn_state(mut self, war: &WarTurnState) -> Self {
        for key in managed_meta_keys() {
            self.extra.remove(&key);
        }
        if *war != WarTurnState::default() {
            self.extra.extend(war.to_meta_json());
        }
        self
    }

    /// Sets `warRulesEraWarCountByCiv` from counter entries in insertion order (web
    /// `Array.from(eraWarCountByCivKey.entries())`). The web writes it only when the multiwar flag
    /// is on; that gate belongs to the caller that builds the save.
    pub fn with_era_war_counts(mut self, entries: &[(String, i64)]) -> Self {
        self.era_war_count_by_civ = Some(Value::Array(
            entries
                .iter()
                .map(|(key, n)| Value::Array(vec![Value::String(key.clone()), Value::from(*n)]))
                .collect(),
        ));
        self
    }

    /// Raw `warRulesEraWarCountByCiv` value as stored in the save (`None` when absent).
    pub fn era_war_count_by_civ(&self) -> Option<&Value> {
        self.era_war_count_by_civ.as_ref()
    }

    /// Sets the raw `battleModeSettingVersion` value (web `meta.battleModeSettingVersion`).
    pub fn with_battle_mode_setting_version(mut self, value: Value) -> Self {
        self.battle_mode_setting_version = Some(value);
        self
    }

    /// Sets the raw `newGameParams` value.
    pub fn with_new_game_params(mut self, value: Value) -> Self {
        self.new_game_params = Some(value);
        self
    }

    /// Raw numeric marker (web `meta.battleModeSettingVersion`); non-numbers give `None`.
    /// The web normalization `=== 1 ? 1 : undefined` (`main.ts:40819-40821`) is applied by
    /// `battle_mode::restored_setting_version`, so the rule has a single owner.
    pub fn battle_mode_setting_value(&self) -> Option<f64> {
        self.battle_mode_setting_version
            .as_ref()
            .and_then(Value::as_f64)
    }

    /// Web `_lastNewGameParams?.advanced?.battleAlwaysManual`: only a JSON boolean is `Some`.
    pub fn battle_always_manual(&self) -> Option<bool> {
        self.new_game_params
            .as_ref()?
            .get("advanced")?
            .get("battleAlwaysManual")?
            .as_bool()
    }

    /// Web `autoBuildFromSaveMeta(saved.meta?.autoBuildEnabled)` (`main.ts:46701`): tylko JSON `true`
    /// wlacza; brak pola / inny typ = wylaczona (`auto_build_gate::auto_build_from_save_meta`).
    pub fn auto_build_enabled(&self) -> bool {
        auto_build_from_save_meta(self.extra.get("autoBuildEnabled"))
    }

    /// Web `meta.playerEpochWarEnabled` (`main.ts:46706`): boolean z zapisu, brak pola / inny typ = `true`
    /// (`diplomacy_multiwar::player_epoch_war_enabled`).
    pub fn player_epoch_war_enabled(&self) -> bool {
        player_epoch_war_enabled(
            self.extra
                .get("playerEpochWarEnabled")
                .and_then(Value::as_bool),
        )
    }
}

/// One `plannedMarches` entry of the save (web `PlannedMarchesSave` value).
///
/// Field rules follow the web load path (`planned-march.ts:438-462`): a destination
/// must be a JSON number; `attackUnitId` / `generalTargetId` survive only as non-empty
/// strings. Filtering against live units is done by the caller.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SavedPlannedMarch {
    #[serde(rename = "unitId")]
    pub unit_id: String,
    #[serde(
        rename = "destQ",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_q: Option<Number>,
    #[serde(
        rename = "destR",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_r: Option<Number>,
    #[serde(
        rename = "attackUnitId",
        default,
        deserialize_with = "lenient_nonempty_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub attack_unit_id: Option<String>,
    #[serde(
        rename = "generalTargetId",
        default,
        deserialize_with = "lenient_nonempty_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub general_target_id: Option<String>,
}

/// Destination coordinates: only JSON numbers survive (web `Number.isFinite` on a parsed save).
/// `Number` (not `f64`) keeps `Eq` derivable on the snapshot, which `replay.rs` requires.
fn lenient_number<'de, D>(deserializer: D) -> Result<Option<Number>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(match Option::<Value>::deserialize(deserializer)? {
        Some(Value::Number(number)) => Some(number),
        _ => None,
    })
}

fn lenient_nonempty_string<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(match Option::<Value>::deserialize(deserializer)? {
        Some(Value::String(text)) if !text.is_empty() => Some(text),
        _ => None,
    })
}

/// Object-only field (web `saved.meta?.x`, `saved.autoMarch`): any other JSON type gives `None`.
fn lenient_object<'de, D, T>(deserializer: D) -> Result<Option<T>, D::Error>
where
    D: Deserializer<'de>,
    T: de::DeserializeOwned,
{
    Ok(match Option::<Value>::deserialize(deserializer)? {
        Some(object @ Value::Object(_)) => serde_json::from_value::<T>(object).ok(),
        _ => None,
    })
}

/// `plannedMarches` in either shape: the Rust list form (`[{unitId, ...}]`) or the web object
/// form (`{uid: {destQ, destR, attackUnitId?, generalTargetId?} | null}`, `planned-march.ts:440-462`).
/// Web skips `null` entries; other malformed entries are dropped here or filtered by the caller.
///
/// The object form is read with a map visitor (NOT through `serde_json::Value`, whose default
/// map is key-sorted): web `Object.entries` yields insertion order, so the entry order (which
/// drives the march planning order) must survive loading (REPIN-WOJNA-3, order vector
/// `p6_repin_wojna_3_hook`). JS puts array-index keys (canonical `0..2^32-2`) first, ascending
/// (`Object.keys({b:1,"7":2,a:3})` = `["7","b","a"]`, measured on node v22); that is reproduced.
fn lenient_planned_marches<'de, D>(
    deserializer: D,
) -> Result<Option<Vec<SavedPlannedMarch>>, D::Error>
where
    D: Deserializer<'de>,
{
    deserializer.deserialize_any(PlannedMarchesVisitor)
}

struct PlannedMarchesVisitor;

impl<'de> de::Visitor<'de> for PlannedMarchesVisitor {
    type Value = Option<Vec<SavedPlannedMarch>>;

    fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("a plannedMarches list or object (any other value reads as empty)")
    }

    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
    where
        A: de::SeqAccess<'de>,
    {
        let mut out = Vec::new();
        while let Some(item) = seq.next_element::<Value>()? {
            if let Ok(march) = serde_json::from_value::<SavedPlannedMarch>(item) {
                out.push(march);
            }
        }
        Ok(Some(out))
    }

    fn visit_map<A>(self, mut map: A) -> Result<Self::Value, A::Error>
    where
        A: de::MapAccess<'de>,
    {
        // `(unit_id, entry)` in text order; a repeated key keeps its first position and the
        // last value (JSON.parse semantics); `null`/non-object values are skipped later.
        let mut raw: Vec<(String, Value)> = Vec::new();
        while let Some((unit_id, dest)) = map.next_entry::<String, Value>()? {
            if let Some(slot) = raw.iter_mut().find(|(key, _)| *key == unit_id) {
                slot.1 = dest;
            } else {
                raw.push((unit_id, dest));
            }
        }
        // Stable: array-index keys first (ascending), the rest in insertion order.
        raw.sort_by_key(|(key, _)| array_index_key(key).map_or((1, 0), |index| (0, index)));
        Ok(Some(
            raw.into_iter()
                .filter_map(|(unit_id, dest)| web_planned_march(unit_id, &dest))
                .collect(),
        ))
    }

    fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_any(self)
    }

    fn visit_unit<E>(self) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }

    fn visit_none<E>(self) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }

    fn visit_bool<E>(self, _: bool) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }

    fn visit_i64<E>(self, _: i64) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }

    fn visit_u64<E>(self, _: u64) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }

    fn visit_f64<E>(self, _: f64) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }

    fn visit_str<E>(self, _: &str) -> Result<Self::Value, E> {
        Ok(Some(Vec::new()))
    }
}

/// ECMAScript array-index property key: canonical decimal of an integer in `0..=2^32-2`.
fn array_index_key(key: &str) -> Option<u32> {
    let canonical = key == "0" || (!key.starts_with('0') && !key.is_empty());
    if !canonical || !key.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    key.parse::<u32>().ok().filter(|index| *index != u32::MAX)
}

fn web_planned_march(unit_id: String, dest: &Value) -> Option<SavedPlannedMarch> {
    let dest = dest.as_object()?;
    Some(SavedPlannedMarch {
        unit_id,
        dest_q: dest.get("destQ").and_then(json_number),
        dest_r: dest.get("destR").and_then(json_number),
        attack_unit_id: dest.get("attackUnitId").and_then(json_nonempty_string),
        general_target_id: dest.get("generalTargetId").and_then(json_nonempty_string),
    })
}

fn json_number(value: &Value) -> Option<Number> {
    match value {
        Value::Number(number) => Some(number.clone()),
        _ => None,
    }
}

fn json_nonempty_string(value: &Value) -> Option<String> {
    match value {
        Value::String(text) if !text.is_empty() => Some(text.clone()),
        _ => None,
    }
}

/// Version-aware input accepted by [`RawSnapshot`]'s custom deserializer.
///
/// Optional fields are kept here, rather than on `SaveSnapshot`, so omission is
/// handled only by the matching legacy migration.  A current snapshot missing
/// `rng` or `event_queue` is rejected explicitly.
#[derive(Debug, Deserialize)]
struct SnapshotWire {
    #[serde(default)]
    version: Option<u16>,
    state: GameStateDto,
    #[serde(default)]
    event_queue: Option<EventQueue<TurnEvent>>,
    #[serde(default)]
    rng: Option<Rng>,
    #[serde(default)]
    rng_state: Option<u32>,
    // Web reads these fields as optional lookups (`saved.meta?.x`): a wrong JSON type is
    // ignored, never a load error (R4 Z-5). `plannedMarches` also accepts the web object form.
    #[serde(default, deserialize_with = "lenient_object")]
    meta: Option<SaveMeta>,
    #[serde(
        default,
        rename = "plannedMarches",
        deserialize_with = "lenient_planned_marches"
    )]
    planned_marches: Option<Vec<SavedPlannedMarch>>,
    #[serde(default, rename = "autoMarch", deserialize_with = "lenient_object")]
    auto_march: Option<SavedAutoMarch>,
    /// P6-ZAPIS-ERA-ZAPISU: web top-level `gracze` (`[[ownerId, {era, ...}]]`, wpisy ludzi).
    /// Zla forma nie jest bledem ladowania - wpis po prostu nie daje epoki.
    #[serde(default)]
    gracze: Option<Value>,
    /// P4-1F3: `citySiege` (addytywny klucz Rust). Zla forma wpisu nie jest bledem ladowania - wpis
    /// jest pomijany (jak pozostale pola opcjonalne zapisu).
    #[serde(default, rename = "citySiege", deserialize_with = "lenient_city_siege")]
    city_siege: Option<Vec<SavedCitySiege>>,
    /// R-RUSTPORT-P4-364-FOG-SAVE-R1: web `exploredByHuman` (surowy JSON; walidacja w
    /// `explored_by_human_from_save`, zly wpis/klucz = blad wczytania).
    #[serde(default, rename = "exploredByHuman")]
    explored_by_human: Option<Value>,
    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (U5): web `activeHumanOwnerId`; nie-liczba => brak (fotel glowny).
    #[serde(default, rename = "activeHumanOwnerId")]
    active_human_owner_id: Option<Value>,
    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (D-SLB-1): cialo sesji `PlayableGame` (scisle: zla forma = blad).
    #[serde(default)]
    playable: Option<SavedPlayableSession>,
}

/// P4-1F3: `citySiege` jako tablica; wpisy o zlej formie (i nie-tablica) sa pomijane.
fn lenient_city_siege<'de, D>(deserializer: D) -> Result<Option<Vec<SavedCitySiege>>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Value::deserialize(deserializer)?;
    Ok(match value {
        Value::Array(items) => Some(
            items
                .into_iter()
                .filter_map(|item| serde_json::from_value::<SavedCitySiege>(item).ok())
                .collect(),
        ),
        _ => None,
    })
}

/// P6-ZAPIS-ERA-ZAPISU: epoki wlascicieli z zapisu, zrodla jak web `empireEpochForOwner`
/// (`main.ts:2069-2072`). AI: `meta.ownerEraByOwner` = `[[ownerId, era]]`. Ludzie: `gracze` =
/// `[[ownerId, {era, ...}]]`, ktorzy maja pierwszenstwo (web: `isHuman` -> `playerStateByHuman.era`).
/// Wpis bez poprawnego id (calkowite, >= 0) albo bez liczbowej epoki jest pomijany.
fn owner_eras_from_save(
    gracze: Option<&Value>,
    ai_entries: Option<&Value>,
) -> BTreeMap<u64, Number> {
    let ai = owner_era_pairs(ai_entries, Value::as_f64);
    let human = owner_era_pairs(gracze, |state| state.get("era").and_then(Value::as_f64));
    let mut eras = BTreeMap::new();
    for (owner, era) in ai.into_iter().chain(human) {
        if let Some(number) = Number::from_f64(era) {
            eras.insert(owner, number);
        }
    }
    eras
}

/// Pary `[ownerId, X]` z tablicy zapisu; `era_of` wyciaga epoke z `X`.
fn owner_era_pairs(
    entries: Option<&Value>,
    era_of: impl Fn(&Value) -> Option<f64>,
) -> Vec<(u64, f64)> {
    let Some(Value::Array(items)) = entries else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let Value::Array(pair) = item else {
                return None;
            };
            let owner = pair.first()?.as_f64()?;
            if !owner.is_finite() || owner < 0.0 || owner.fract() != 0.0 {
                return None;
            }
            let era = era_of(pair.get(1)?)?;
            Some((owner as u64, era))
        })
        .collect()
}

impl SaveSnapshot {
    /// Creates a current version-2 snapshot.
    pub fn new(state: GameStateDto, event_queue: EventQueue<TurnEvent>, rng: Rng) -> Self {
        Self {
            version: CURRENT_SNAPSHOT_VERSION,
            state,
            event_queue,
            rng,
            meta: SaveMeta::default(),
            planned_marches: Vec::new(),
            auto_march: None,
            owner_eras: BTreeMap::new(),
            gracze: None,
            city_siege: Vec::new(),
            explored_by_human: Vec::new(),
            active_human_owner_id: None,
            playable: None,
        }
    }

    /// Returns a copy carrying the legacy `autoMarch` fallback entry.
    pub fn with_auto_march(mut self, auto_march: Option<SavedAutoMarch>) -> Self {
        self.auto_march = auto_march;
        self
    }

    /// Returns a copy carrying the owner eras read from the save (see `owner_eras_from_save`).
    fn with_owner_eras(mut self, owner_eras: BTreeMap<u64, Number>) -> Self {
        self.owner_eras = owner_eras;
        self
    }

    /// Returns a copy carrying the raw top-level `gracze` of the save (re-emitted on serialize).
    fn with_gracze(mut self, gracze: Option<Value>) -> Self {
        self.gracze = gracze;
        self
    }

    /// P6-ZAPIS-ERA-ZAPISU: epoka wlasciciela wedlug zapisu (ludzie: `gracze`, AI:
    /// `meta.ownerEraByOwner`). Brak wpisu daje [`SaveMeta::start_era_fallback`] (udokumentowany
    /// domyslny wynik, nie cicha wartosc).
    pub fn owner_era(&self, owner: PlayerId) -> f64 {
        self.owner_eras
            .get(&owner.get())
            .and_then(Number::as_f64)
            .unwrap_or_else(|| self.meta.start_era_fallback())
    }

    /// Returns the legacy `autoMarch` entry, if the save carried one.
    pub fn auto_march(&self) -> Option<&SavedAutoMarch> {
        self.auto_march.as_ref()
    }

    /// Returns a copy carrying the additive save metadata.
    pub fn with_meta(mut self, meta: SaveMeta) -> Self {
        self.meta = meta;
        self
    }

    /// Returns a copy carrying the additive `plannedMarches` entries.
    pub fn with_planned_marches(mut self, planned_marches: Vec<SavedPlannedMarch>) -> Self {
        self.planned_marches = planned_marches;
        self
    }

    /// Stan wojny tury (D1=B: nosnikiem jest `state.war`).
    pub fn war_turn_state(&self) -> &WarTurnState {
        self.state.war_turn_state()
    }

    /// Kopia ze stanem wojny w `state.war`; klucze wojenne w `meta` sa usuwane (jedno zrodlo prawdy).
    pub fn with_war_turn_state(mut self, war: WarTurnState) -> Self {
        self.meta = self.meta.with_war_turn_state(&WarTurnState::default());
        self.state.set_war_turn_state(war);
        self
    }

    /// Blok `meta` w formacie weba z kluczami wojny z `state.war` (eksport/interop; zapis wlasny
    /// niesie wojne w `state.war`, nie w `meta`).
    pub fn web_meta(&self) -> SaveMeta {
        self.meta
            .clone()
            .with_war_turn_state(self.state.war_turn_state())
    }

    /// P6-ZAPIS-MIGRACJE (r3): migracje przy wczytaniu zapisu w kolejnosci weba (`main.ts:46566-46573`):
    /// degradacja nadmiaru wodzow ponad limit epoki, potem podzial stosow ponad limit na sasiednie
    /// heksy. Zmienia stan snapshotu; stary zapis bez nadmiaru zostaje bez zmian (raport pusty).
    /// Epoka kazdego wlasciciela pochodzi z DANYCH ZAPISU ([`SaveSnapshot::owner_era`]), nie od
    /// wywolujacego. Ta sama siatka stosu obowiazuje na starcie tury (`main.ts:37754`): wywolujacy moze uzyc
    /// `save_migrations::enforce_army_stack_limit`.
    pub fn migrate_on_load(&mut self) -> LoadMigrationReport {
        let eras = &self.owner_eras;
        let fallback = self.meta.start_era_fallback();
        migrate_loaded_state(&mut self.state, |owner| {
            eras.get(&owner.get())
                .and_then(Number::as_f64)
                .unwrap_or(fallback)
        })
    }

    /// Jawne nadpisanie epoki wlascicieli, uzywane WYLACZNIE w testach migracji, ktore celowo
    /// podmieniaja epoke. Produkcyjna sciezka ladowania uzywa [`SaveSnapshot::migrate_on_load`].
    pub fn migrate_on_load_with_era_override_for_test(
        &mut self,
        era_for_owner: impl Fn(PlayerId) -> f64,
    ) -> LoadMigrationReport {
        migrate_loaded_state(&mut self.state, era_for_owner)
    }

    /// Konsument flagi `meta.autoBuildEnabled`: web `isAutoBuildAllowedForOwner` z wartoscia z zapisu
    /// (AI zawsze tak, gracz tylko gdy zapis ma `true`; brak pola = wylaczona).
    pub fn auto_build_allowed_for_owner(&self, owner_id: f64, human_owner_ids: &[f64]) -> bool {
        is_auto_build_allowed_for_owner(owner_id, human_owner_ids, self.meta.auto_build_enabled())
    }

    /// Returns the additive save metadata (empty for saves written before R4).
    pub fn meta(&self) -> &SaveMeta {
        &self.meta
    }

    /// Returns the saved `plannedMarches` entries (empty when absent).
    pub fn planned_marches(&self) -> &[SavedPlannedMarch] {
        &self.planned_marches
    }

    /// P4-1J: kopia z planami marszu stanu gry w polach `plannedMarches` / `autoMarch`, jak web
    /// `buildSaveGameSnapshot` (`main.ts:37184`, `:37243-37244`). Zasady: [`playable_planned_marches_to_save`].
    pub fn with_playable_planned_marches(self, state: &PlayableState) -> Self {
        let (planned, auto_march) = playable_planned_marches_to_save(&state.planned_marches);
        self.with_planned_marches(planned)
            .with_auto_march(auto_march)
    }

    /// P4-1J: odczyt planow marszu z zapisu do stanu gry, jak web `main.ts:46272-46287`. Zasady:
    /// [`restore_playable_planned_marches`].
    pub fn restore_planned_marches(
        &self,
        state: &mut PlayableState,
        player_owner_id: PlayerId,
    ) -> PlannedMarchRestoreReport {
        restore_playable_planned_marches(
            state,
            &self.planned_marches,
            self.auto_march.as_ref(),
            player_owner_id,
        )
    }

    /// P4-1F3: kopia z wpisami `citySiege` (stan oblezenia miast).
    pub fn with_city_siege(mut self, city_siege: Vec<SavedCitySiege>) -> Self {
        self.city_siege = city_siege;
        self
    }

    /// P4-1F3: zapisane wpisy `citySiege` (puste, gdy brak).
    pub fn city_siege(&self) -> &[SavedCitySiege] {
        &self.city_siege
    }

    /// P4-1F3: kopia ze stanem oblezen i cudow `PlayableState`, jak web `buildSaveGameSnapshot`:
    /// `meta.placedWorldWonders` = `placedWorldWonders.slice()` (`main.ts:37450`), a `oblegane` /
    /// `siegeMachines.ready` (w webie pola miast) w `citySiege` ([`playable_city_siege_to_save`]).
    /// Pusty stan nie zostawia kluczy (web zawsze pisze `placedWorldWonders: []`; tu pominiete, zeby
    /// zapis bez nowych pol byl bajt w bajt jak przed zmiana).
    pub fn with_playable_siege_wonders(mut self, state: &PlayableState) -> Self {
        if state.placed_world_wonders.is_empty() {
            self.meta.extra.remove(PLACED_WORLD_WONDERS_KEY);
        } else {
            let wonders = serde_json::to_value(&state.placed_world_wonders)
                .unwrap_or_else(|_| Value::Array(Vec::new()));
            self.meta
                .extra
                .insert(PLACED_WORLD_WONDERS_KEY.to_owned(), wonders);
        }
        self.with_city_siege(playable_city_siege_to_save(state))
    }

    /// P4-1F3: odczyt stanu oblezen i cudow do `PlayableState`. Zasady:
    /// [`restore_playable_siege_wonders`].
    pub fn restore_siege_wonders(&self, state: &mut PlayableState) -> SiegeWonderRestoreReport {
        restore_playable_siege_wonders(
            state,
            self.meta.extra.get(PLACED_WORLD_WONDERS_KEY),
            &self.city_siege,
        )
    }

    /// R-RUSTPORT-P4-364-FOG-SAVE-R1: kopia z wpisami `exploredByHuman`.
    pub fn with_explored_by_human(mut self, explored_by_human: Vec<SavedExploredSeat>) -> Self {
        self.explored_by_human = explored_by_human;
        self
    }

    /// R-RUSTPORT-P4-364-FOG-SAVE-R1: zapisane wpisy `exploredByHuman` (puste, gdy brak).
    pub fn explored_by_human(&self) -> &[SavedExploredSeat] {
        &self.explored_by_human
    }

    /// R-RUSTPORT-P4-364-FOG-SAVE-R1 (D-FS-4): kopia z eksploracja mgly sesji, jak web
    /// `buildSaveGameSnapshot` (`main.ts:37229-37239`). Zasady: [`playable_explored_by_human_to_save`].
    pub fn with_playable_explored_by_human(self, fog: &PlayableFogSession) -> Self {
        self.with_explored_by_human(playable_explored_by_human_to_save(fog))
    }

    /// R-RUSTPORT-P4-364-FOG-SAVE-R1 (D-FS-2/D-FS-3): odtworzenie eksploracji do mgly sesji, jak web
    /// wczytanie (`main.ts:46385-46411`). Zasady: [`restore_playable_explored_by_human`].
    pub fn restore_explored_by_human(&self, fog: &mut PlayableFogSession) {
        restore_playable_explored_by_human(fog, &self.explored_by_human);
    }

    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (U5): kopia z aktywnym fotelem czlowieka (web `activeHumanOwnerId`).
    pub fn with_active_human_owner_id(mut self, owner_id: Option<u64>) -> Self {
        self.active_human_owner_id = owner_id;
        self
    }

    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (U5): zapisany aktywny fotel (`None` = brak lub zla forma w zapisie).
    pub const fn active_human_owner_id(&self) -> Option<u64> {
        self.active_human_owner_id
    }

    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (D-SLB-1): kopia z cialem sesji `PlayableGame`.
    pub fn with_playable_session(mut self, session: Option<SavedPlayableSession>) -> Self {
        self.playable = session;
        self
    }

    /// R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (D-SLB-1): cialo sesji `PlayableGame` (`None` = zapis bez sesji).
    pub fn playable_session(&self) -> Option<&SavedPlayableSession> {
        self.playable.as_ref()
    }

    /// Returns the format version stamped on this snapshot.
    pub const fn version(&self) -> u16 {
        self.version
    }

    /// Returns the validated game state.
    pub fn state(&self) -> &GameStateDto {
        &self.state
    }

    /// Returns the deterministic events waiting to be resolved.
    pub fn event_queue(&self) -> &EventQueue<TurnEvent> {
        &self.event_queue
    }

    /// Returns the RNG stream checkpoint used by the next random step.
    pub const fn rng(&self) -> &Rng {
        &self.rng
    }

    /// Checks the format and state invariants before handing a snapshot to the
    /// game runtime.
    pub fn validate(&self) -> Result<(), SnapshotError> {
        if self.version != CURRENT_SNAPSHOT_VERSION {
            return Err(SnapshotError::UnsupportedVersion {
                found: self.version,
                current: CURRENT_SNAPSHOT_VERSION,
            });
        }
        self.state
            .validate()
            .map_err(|error| SnapshotError::InvalidState(error.to_string()))
    }

    /// Decomposes the snapshot for a runtime restore operation.
    pub fn into_parts(self) -> (GameStateDto, EventQueue<TurnEvent>, Rng) {
        (self.state, self.event_queue, self.rng)
    }
}

/// P4-1J: pominiecia przy odczycie planow marszu do `PlayableState` (jawne, nie ciche).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PlannedMarchRestoreReport {
    /// Id jednostek, ktorych wpis web `plannedMarchesFromSave` przyjmuje, a `PlayableState` nie umie
    /// wyrazic: cel nie jest liczba calkowita z zakresu `i32` albo `attackUnitId` nie jest kanonicznym
    /// zapisem `UnitId`. Taki wpis jest pominiety w calosci (odchylenie od weba, ktory go trzyma).
    pub unrepresentable: Vec<String>,
}

/// P4-1J: web `plannedMarchesToSave` (`planned-march.ts:485-500`) dla planow `PlayableState`.
///
/// Semantyka `Map` i `autoMarch` (pierwszy wpis mapy) pochodzi z portu
/// `ruch_jednostek::planned_marches_to_save`. Kolejnosc wynikowej listy = kolejnosc kluczy obiektu
/// `plannedMarches` w webie: klucze-indeksy tablicy (kanoniczne liczby `0..=2^32-2`) rosnaco, potem
/// pozostale w kolejnosci wstawienia (ta sama regula co odczyt, [`array_index_key`]). Dlatego zapis
/// i odczyt daja ten sam porzadek co web po `JSON.stringify` / `JSON.parse`. Pusta lista daje
/// `(vec![], None)`, wiec zapis bez planow nie ma kluczy `plannedMarches` / `autoMarch` (web `{}`).
pub fn playable_planned_marches_to_save(
    marches: &[PlayablePlannedMarch],
) -> (Vec<SavedPlannedMarch>, Option<SavedAutoMarch>) {
    let entries: Vec<(String, PlannedMarchDest)> = marches
        .iter()
        .map(|march| {
            (
                march.unit_id.to_string(),
                PlannedMarchDest {
                    dest_q: f64::from(march.dest_q),
                    dest_r: f64::from(march.dest_r),
                    attack_unit_id: march.attack_unit_id.map(|id| id.to_string()),
                    general_target_id: march.general_target_id.clone(),
                },
            )
        })
        .collect();
    let out = planned_marches_to_save(&entries);
    let auto_march = out
        .auto_march
        .map(|(leader_id, dest_q, dest_r)| SavedAutoMarch {
            leader_id: Some(leader_id),
            dest_q: integral_number(dest_q),
            dest_r: integral_number(dest_r),
        });
    let mut planned: Vec<SavedPlannedMarch> = out
        .planned_marches
        .unwrap_or_default()
        .into_iter()
        .map(|(unit_id, dest)| SavedPlannedMarch {
            unit_id,
            dest_q: integral_number(dest.dest_q),
            dest_r: integral_number(dest.dest_r),
            attack_unit_id: dest.attack_unit_id,
            general_target_id: dest.general_target_id,
        })
        .collect();
    planned.sort_by_key(|march| array_index_key(&march.unit_id).map_or((1, 0), |index| (0, index)));
    (planned, auto_march)
}

/// Wspolrzedna `i32` zapisana jako liczba calkowita JSON (web `JSON.stringify(3)` = `3`, nie `3.0`).
fn integral_number(value: f64) -> Option<Number> {
    js_i32(value).map(Number::from)
}

/// Liczba JS bedaca calkowita z zakresu `i32` (`-0` daje `0`); inaczej `None`.
fn js_i32(value: f64) -> Option<i32> {
    let in_range = value >= f64::from(i32::MIN) && value <= f64::from(i32::MAX);
    if in_range && value.fract() == 0.0 {
        Some(value as i32)
    } else {
        None
    }
}

/// Kanoniczny zapis dziesietny `UnitId` (`"7"`; nie `"07"`, `"+7"`, `"u7"`).
fn canonical_unit_id(text: &str) -> Option<UnitId> {
    let value = text.parse::<u64>().ok()?;
    (value.to_string() == text).then_some(UnitId::new(value))
}

/// P4-1J: odczyt planow marszu z zapisu do stanu gry, web `main.ts:46272-46287`:
///
/// 1. czysci `plannedMarches`, `marchStopNotified`, `marchStopDetail`, `marchAttackTargets`
///    (`main.ts:46272-46274`, `:46279`); trzech ostatnich map web nie zapisuje; czysci tez
///    `moved_by_player_this_turn` (web `movedByPlayerThisTurn.clear()`, `main.ts:46280`, niezapisywane);
/// 2. filtruje wpisy jak web `plannedMarchesFromSave(saved.autoMarch, saved.plannedMarches, units, 0)`
///    (`main.ts:46283`, `planned-march.ts:451-482`) przez port `ruch_jednostek::planned_marches_from_save`:
///    jednostka musi istniec w `state.units` (id = kanoniczny zapis `UnitId`) i nalezec do
///    `player_owner_id` (web `0`; w `PlayableState` czlowiek ma inne id, podaje je wolajacy);
/// 3. dla kazdego wpisu `plannedMarches.set` + `syncMarchAttackTarget` (`main.ts:46284-46286`,
///    `:31124-31130`): `attackUnitId` trafia do `march_attack_targets`.
///
/// Wpis powtorzony w liscie (forma listowa Rust; obiekt weba po `JSON.parse` nie ma powtorzen)
/// jest scalany PRZED filtrem: pierwsza pozycja, ostatnia wartosc (jak `JSON.parse` dla
/// powtorzonego klucza obiektu, ta sama regula co `visit_map`). Filtr i raport widza wiec tylko
/// ostatnia wartosc: odrzucona albo niewyrazalna ostatnia wartosc nie zostawia planu z wczesniejszego
/// wpisu. Pominiecia sa w raporcie.
pub fn restore_playable_planned_marches(
    state: &mut PlayableState,
    planned: &[SavedPlannedMarch],
    auto_march: Option<&SavedAutoMarch>,
    player_owner_id: PlayerId,
) -> PlannedMarchRestoreReport {
    // Wlasciciel porownywany dokladnie w przestrzeni `PlayerId`: 0 = gracz, 1 = ktos inny.
    const PLAYER: i64 = 0;
    const OTHER: i64 = 1;

    state.planned_marches.clear();
    state.march_stop_notified.clear();
    state.march_stop_detail.clear();
    state.march_attack_targets.clear();
    // P4-1H Q4: web czysci `movedByPlayerThisTurn` w tym samym miejscu wczytania (`main.ts:46280`).
    state.moved_by_player_this_turn.clear();

    let units: Vec<RuchJednostka> = state
        .units
        .iter()
        .map(|unit| {
            let owner = if unit.owner_id == player_owner_id {
                PLAYER
            } else {
                OTHER
            };
            RuchJednostka::new(
                &unit.id.to_string(),
                owner,
                "",
                i32::from(unit.position.x()),
                i32::from(unit.position.y()),
            )
        })
        .collect();
    // Scalanie powtorzen przed filtrem `plannedMarchesFromSave`: web filtruje wpisy obiektu juz po
    // `JSON.parse`, ktory dla powtorzonego klucza trzyma pierwsza pozycje i ostatnia wartosc.
    let mut entries: Vec<(String, Option<PlannedMarchSaved>)> = Vec::with_capacity(planned.len());
    for march in planned {
        let value = Some(PlannedMarchSaved {
            dest_q: march.dest_q.as_ref().and_then(Number::as_f64),
            dest_r: march.dest_r.as_ref().and_then(Number::as_f64),
            attack_unit_id: march.attack_unit_id.clone(),
            general_target_id: march.general_target_id.clone(),
        });
        match entries.iter_mut().find(|(key, _)| *key == march.unit_id) {
            Some(slot) => slot.1 = value,
            None => entries.push((march.unit_id.clone(), value)),
        }
    }
    let legacy = auto_march.map(|saved| AutoMarchSave {
        leader_id: saved.leader_id.clone(),
        dest_q: saved.dest_q.as_ref().and_then(Number::as_f64),
        dest_r: saved.dest_r.as_ref().and_then(Number::as_f64),
    });

    let mut report = PlannedMarchRestoreReport::default();
    let loaded = planned_marches_from_save(legacy.as_ref(), Some(&entries), &units, PLAYER);
    for (unit_id, dest) in loaded {
        let attack_unit_id = match dest.attack_unit_id.as_deref() {
            None => Some(None),
            Some(text) => canonical_unit_id(text).map(Some),
        };
        let (Some(id), Some(dest_q), Some(dest_r), Some(attack_unit_id)) = (
            canonical_unit_id(&unit_id),
            js_i32(dest.dest_q),
            js_i32(dest.dest_r),
            attack_unit_id,
        ) else {
            report.unrepresentable.push(unit_id);
            continue;
        };
        let entry = PlayablePlannedMarch {
            unit_id: id,
            dest_q,
            dest_r,
            attack_unit_id,
            general_target_id: dest.general_target_id,
        };
        match state
            .planned_marches
            .iter_mut()
            .find(|existing| existing.unit_id == id)
        {
            Some(slot) => *slot = entry,
            None => state.planned_marches.push(entry),
        }
        match attack_unit_id {
            Some(target) => {
                state.march_attack_targets.insert(id, target);
            }
            None => {
                state.march_attack_targets.remove(&id);
            }
        }
    }
    report
}

/// P4-1F3: klucz `meta` z postawionymi cudami (web `main.ts:37450`, odczyt `:46459-46461`).
pub const PLACED_WORLD_WONDERS_KEY: &str = "placedWorldWonders";

/// P4-1F3: pominiecia przy odczycie oblezen i cudow (jawne, nie ciche).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SiegeWonderRestoreReport {
    /// Indeksy wpisow `meta.placedWorldWonders`, ktorych `PlayableState` nie umie wyrazic
    /// (`wonderId` nie-napis, `q`/`r` nie calkowite `i32`, `ownerId` nie calkowite `>= 0`).
    pub unrepresentable_wonders: Vec<usize>,
    /// Id miast z `citySiege`, ktorych nie ma w `state.cities` (wpis pominiety).
    pub unknown_cities: Vec<CityId>,
}

/// P4-1F3: `citySiege` z `PlayableState`: jeden wpis na miasto z `oblegane` albo gotowymi machinami,
/// rosnaco po id miasta. Pusta lista machin nie tworzy pola `siegeMachines`.
pub fn playable_city_siege_to_save(state: &PlayableState) -> Vec<SavedCitySiege> {
    let mut ids: Vec<CityId> = state.oblegane.iter().copied().collect();
    ids.extend(
        state
            .siege_machines_ready
            .iter()
            .filter(|(_, ready)| !ready.is_empty())
            .map(|(id, _)| *id),
    );
    ids.sort();
    ids.dedup();
    ids.into_iter()
        .map(|city_id| SavedCitySiege {
            city_id,
            oblegane: state.oblegane.contains(&city_id),
            siege_machines: state
                .siege_machines_ready
                .get(&city_id)
                .filter(|ready| !ready.is_empty())
                .map(|ready| SavedSiegeMachines {
                    ready: ready.clone(),
                }),
        })
        .collect()
}

/// Liczba JS calkowita `>= 0` mieszczaca sie dokladnie w `f64` (`-0` daje `0`).
fn js_owner_id(value: f64) -> Option<u64> {
    const EXACT_LIMIT: f64 = 9_007_199_254_740_991.0;
    if value.is_finite() && (0.0..=EXACT_LIMIT).contains(&value) && value.fract() == 0.0 {
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let id = value as u64;
        Some(id)
    } else {
        None
    }
}

/// Jeden wpis `placedWorldWonders` z zapisu w postaci `PlayableState` (`None` = niewyrazalny).
fn saved_placed_wonder(item: &Value) -> Option<PlayablePlacedWonder> {
    let wonder_id = item.get("wonderId")?.as_str()?.to_owned();
    let q = js_i32(item.get("q")?.as_f64()?)?;
    let r = js_i32(item.get("r")?.as_f64()?)?;
    let owner_id = js_owner_id(item.get("ownerId")?.as_f64()?)?;
    Some(PlayablePlacedWonder {
        wonder_id,
        q,
        r,
        owner_id: PlayerId::new(owner_id),
    })
}

/// P4-1F3: odczyt oblezen i cudow do `PlayableState`:
///
/// 1. `placed_world_wonders` = web `Array.isArray(saved.meta?.placedWorldWonders) ? slice : []`
///    (`main.ts:46459-46461`): nie-tablica albo brak => pusta lista; wpis niewyrazalny w Rust jest
///    pominiety i zgloszony w raporcie (odchylenie od weba, ktory trzyma surowy obiekt). Pole `ruin`
///    zapisu jest ignorowane (liczy je producent widoku);
/// 2. `oblegane` i `siege_machines_ready` czyszczone i odtwarzane z `citySiege` dla miast obecnych w
///    `state.cities`; wpis nieznanego miasta jest pominiety i zgloszony. Pusta lista machin = brak wpisu.
pub fn restore_playable_siege_wonders(
    state: &mut PlayableState,
    placed: Option<&Value>,
    city_siege: &[SavedCitySiege],
) -> SiegeWonderRestoreReport {
    let mut report = SiegeWonderRestoreReport::default();
    state.placed_world_wonders.clear();
    if let Some(Value::Array(items)) = placed {
        for (index, item) in items.iter().enumerate() {
            match saved_placed_wonder(item) {
                Some(wonder) => state.placed_world_wonders.push(wonder),
                None => report.unrepresentable_wonders.push(index),
            }
        }
    }
    state.oblegane.clear();
    state.siege_machines_ready.clear();
    for entry in city_siege {
        if !state.cities.iter().any(|city| city.id == entry.city_id) {
            report.unknown_cities.push(entry.city_id);
            continue;
        }
        if entry.oblegane {
            state.oblegane.insert(entry.city_id);
        }
        match entry.siege_machines.as_ref() {
            Some(machines) if !machines.ready.is_empty() => {
                state
                    .siege_machines_ready
                    .insert(entry.city_id, machines.ready.clone());
            }
            _ => {
                state.siege_machines_ready.remove(&entry.city_id);
            }
        }
    }
    report
}

/// Surowy wczyt snapshotu: wersja, wymagane pola, walidacja. NIE wykonuje migracji P6-ZAPIS-MIGRACJE:
/// limit wodzow zalezy od epoki wlasciciela (odczytywanej z zapisu przez [`SaveSnapshot::owner_era`]),
/// a limit stosu od listy ludzkich graczy, czyli od kontekstu wolajacego.
///
/// Typ prywatny (`pub(crate)`): [`SaveSnapshot`] NIE ma publicznej deserializacji. Jedyne publiczne
/// sciezki wczytania to `zapis_loader::load_save_snapshot` (migracja w srodku) oraz
/// `ReplayLog::load_json_with_migration_reports`, ktore wolaja [`RawSnapshot::into_snapshot`]
/// i zaraz [`SaveSnapshot::migrate_on_load`]. Oddzielny typ wejsciowy nie pozwala wyprodukowac
/// niezmigrowanego `SaveSnapshot` przez zwykle `serde_json::from_str`.
#[derive(Debug)]
pub(crate) struct RawSnapshot(SaveSnapshot);

impl RawSnapshot {
    /// Oddaje niezmigrowany snapshot. Wolajacy MUSI wykonac migracje przed uzyciem w domenie.
    pub(crate) fn into_snapshot(self) -> SaveSnapshot {
        self.0
    }
}

impl<'de> Deserialize<'de> for RawSnapshot {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let wire = SnapshotWire::deserialize(deserializer)?;
        let version = wire
            .version
            .ok_or_else(|| de::Error::custom(SnapshotError::MissingVersion))?;

        let snapshot = match version {
            LEGACY_SNAPSHOT_VERSION => {
                let rng_state = wire.rng_state.ok_or_else(|| {
                    de::Error::custom(SnapshotError::MissingField {
                        version,
                        field: "rng_state",
                    })
                })?;
                migrate_v1(wire.state, rng_state)
            }
            CURRENT_SNAPSHOT_VERSION => {
                let event_queue = wire.event_queue.ok_or_else(|| {
                    de::Error::custom(SnapshotError::MissingField {
                        version,
                        field: "event_queue",
                    })
                })?;
                let rng = wire.rng.ok_or_else(|| {
                    de::Error::custom(SnapshotError::MissingField {
                        version,
                        field: "rng",
                    })
                })?;
                SaveSnapshot::new(wire.state, event_queue, rng)
            }
            found => {
                return Err(de::Error::custom(SnapshotError::UnsupportedVersion {
                    found,
                    current: CURRENT_SNAPSHOT_VERSION,
                }));
            }
        };

        // Migracja W1 (D4): zapis w formacie weba niesie stan wojny w kluczach `meta`; gdy
        // `state.war` jest pusty, a `meta` ma klucze wojny, przenosimy je do `state.war`.
        let meta = wire.meta.unwrap_or_default();
        let snapshot = if snapshot.state.war_turn_state().is_default() {
            let war = meta.war_turn_state();
            if war.is_default() {
                snapshot
            } else {
                let mut snapshot = snapshot;
                snapshot.state.set_war_turn_state(war);
                snapshot
            }
        } else {
            snapshot
        };
        let meta = if snapshot.state.war_turn_state().is_default() {
            meta
        } else {
            meta.with_war_turn_state(&WarTurnState::default())
        };
        let owner_eras = owner_eras_from_save(wire.gracze.as_ref(), meta.owner_era_entries());
        let snapshot = snapshot
            .with_meta(meta)
            .with_planned_marches(wire.planned_marches.unwrap_or_default())
            .with_auto_march(wire.auto_march)
            .with_owner_eras(owner_eras)
            .with_gracze(wire.gracze)
            .with_city_siege(wire.city_siege.unwrap_or_default());
        let explored_by_human = explored_by_human_from_save(wire.explored_by_human.as_ref())
            .map_err(de::Error::custom)?;
        let active_human_owner_id = wire
            .active_human_owner_id
            .as_ref()
            .and_then(Value::as_f64)
            .and_then(js_owner_id);
        let snapshot = snapshot
            .with_explored_by_human(explored_by_human)
            .with_active_human_owner_id(active_human_owner_id)
            .with_playable_session(wire.playable);
        snapshot.validate().map_err(de::Error::custom)?;
        Ok(RawSnapshot(snapshot))
    }
}

/// Migrates the explicitly supported version-1 representation to version 2.
///
/// Version 1 had no event queue.  The queue is therefore initialized empty,
/// while `rng_state` becomes the exact checkpoint for the restored [`Rng`].
pub fn migrate_v1(state: GameStateDto, rng_state: u32) -> SaveSnapshot {
    SaveSnapshot::new(state, EventQueue::new(), Rng::from_state(rng_state))
}

/// R-RUSTPORT-P4-364-FOG-SAVE-R1: `exploredByHuman` z mgly sesji (web `Array.from(exploredByHuman
/// .entries(), ([oid, set]) => [oid, Array.from(set)])`, `main.ts:37229-37232`). Kolejnosc: fotele
/// rosnaco, klucze rosnaco po `(q, r)` (`BTreeMap`/`BTreeSet`; web: kolejnosc wstawiania - kolejnosc
/// nie niesie znaczenia, wczytanie buduje zbior). Fotele z PUSTYM zbiorem sa pomijane: wczytanie i tak
/// zaklada pusty wpis fotela glownego (web `main.ts:46407-46410`), a fotel bez wpisu dostaje pusty zbior
/// przy pierwszym zapytaniu warstw (`session_render_layers`) - dzieki temu zapis bez eksploracji jest
/// bajt w bajt jak przed zmiana (D-FS-1).
pub fn playable_explored_by_human_to_save(fog: &PlayableFogSession) -> Vec<SavedExploredSeat> {
    fog.explored_by_human
        .iter()
        .filter(|(_, keys)| !keys.is_empty())
        .map(|(owner, keys)| SavedExploredSeat {
            owner_id: owner.get(),
            keys: keys.iter().copied().collect(),
        })
        .collect()
}

/// R-RUSTPORT-P4-364-FOG-SAVE-R1: web wczytanie `exploredByHuman` (`main.ts:46393-46411`):
/// `exploredByHuman.clear()`, kazdy wpis zapisu ustawia zbior swojego fotela (powtorzony fotel: wygrywa
/// ostatni, jak `Map.set`), a fotel glowny zawsze ma wpis - patrz
/// [`PlayableFogSession::restore_explored_by_human`].
pub fn restore_playable_explored_by_human(
    fog: &mut PlayableFogSession,
    saved: &[SavedExploredSeat],
) {
    let mut explored = BTreeMap::new();
    for seat in saved {
        explored.insert(
            PlayerId::new(seat.owner_id),
            seat.keys.iter().copied().collect(),
        );
    }
    fog.restore_explored_by_human(explored);
}
