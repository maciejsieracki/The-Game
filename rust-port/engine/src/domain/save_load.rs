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
//! file adapter can use serde's `Serialize`/`Deserialize` implementations at
//! its JSON boundary without coupling the engine to storage or UI code.

use std::{error::Error, fmt};

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

/// Version-aware input accepted by [`SaveSnapshot`]'s custom deserializer.
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
        }
    }

    /// Returns a copy carrying the legacy `autoMarch` fallback entry.
    pub fn with_auto_march(mut self, auto_march: Option<SavedAutoMarch>) -> Self {
        self.auto_march = auto_march;
        self
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
    /// Ta sama siatka stosu obowiazuje na starcie tury (`main.ts:37754`): wywolujacy moze uzyc
    /// `save_migrations::enforce_army_stack_limit`.
    pub fn migrate_on_load(
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

/// Deserializacja NIE wykonuje migracji P6-ZAPIS-MIGRACJE: limit wodzow zalezy od epoki wlasciciela,
/// a limit stosu od listy ludzkich graczy, czyli od kontekstu wołajacego. Kazdy wczytujacy zapis
/// MUSI po `serde_json::from_str::<SaveSnapshot>` wywolac [`SaveSnapshot::migrate_on_load`]
/// (i `auto_build_allowed_for_owner` przy decyzji o budowie). Rust nie ma dzis loadera plikow
/// (`replay.rs` przyjmuje gotowy `SaveSnapshot`), wiec ta odpowiedzialnosc lezy po stronie wolajacego.
impl<'de> Deserialize<'de> for SaveSnapshot {
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
        let snapshot = snapshot
            .with_meta(meta)
            .with_planned_marches(wire.planned_marches.unwrap_or_default())
            .with_auto_march(wire.auto_march);
        snapshot.validate().map_err(de::Error::custom)?;
        Ok(snapshot)
    }
}

/// Migrates the explicitly supported version-1 representation to version 2.
///
/// Version 1 had no event queue.  The queue is therefore initialized empty,
/// while `rng_state` becomes the exact checkpoint for the restored [`Rng`].
pub fn migrate_v1(state: GameStateDto, rng_state: u32) -> SaveSnapshot {
    SaveSnapshot::new(state, EventQueue::new(), Rng::from_state(rng_state))
}
