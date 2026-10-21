//! Loader/walidator plików danych z katalogu (P3.9 „Loader/walidator”,
//! P3.12 „testy brakujących/uszkodzonych danych”; temat R-RUSTPORT-P3-12-DATA-LOADER-Q1).
//!
//! Dane są ładowane z katalogu przekazanego argumentem (nigdy hard-coded).
//! Struktury NIE są duplikowane: każdy plik deserializowany jest do typu
//! z istniejącego modułu `data::*` (te same `#[derive(Deserialize)]`, co w
//! `parse_*`). Parsery `parse_*` pozostają nietknięte — czytają wbudowane
//! `include_str!`, loader czyta z dysku.
//!
//! Błędy (`LoadError`) zawsze niosą ścieżkę pliku. Ścieżka nie jest panikującą:
//! brak `unwrap`/`expect` w ścieżkach błędów.
//!
//! Uwaga o „ścieżce serde”: bez nowej zależności (`serde_path_to_error`
//! jest zabroniona) lokalizacja w pliku to `line`/`column` z `serde_json`
//! dla błędów składni, a dla błędów kształtu nazwa pola/typu pochodzi
//! z komunikatu `serde_json` (np. ``missing field `start_gry` at line 1``).

use std::error::Error;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::str::Utf8Error;

use serde::de::DeserializeOwned;
use serde_json::error::Category;

use super::civilizations::{
    AcceptancePointsFile, CityNamesPoolsFile, CivAiFile, CivMatrixFile, CivParamsFile, CivsFile,
    DiplomacyFile,
};
use super::buildings_tech::{Building, TechFile, Wonders};
use super::economy_society::{
    CitizenResourceUpkeep, EconParams, EpokaLudnoscManpower, MiastoParams, ResourceItem,
    SocietyParams,
};
use super::economy_society_part2::{AiParams, EStartParams, UiParams};
use super::terrain_map::{
    MapGenParamsFile, TerrainImprovementsFile, TerrainMovementFile, TerrainYieldsFile,
};
use super::units_combat::{
    AutoBattleParamsFile, CombatParamsFile, CounterRule, PowerParamsFile, TerrainCombatRecord,
    UnitRecord,
};

/// Nazwy 29 plików danych obsługiwanych przez loader (kopie `rust-port/engine/data/`).
pub const DATA_FILES: [&str; 29] = [
    "civs.json",
    "civ-matrix.json",
    "civ-params.json",
    "civ-ai.json",
    "diplomacy.json",
    "diplomacy-acceptance-points.json",
    "city-names-pools.json",
    "buildings.json",
    "wonders.json",
    "tech.json",
    "econ-params.json",
    "society-params.json",
    "epoka-ludnosc-manpower.json",
    "citizen-resource-upkeep.json",
    "miasto-params.json",
    "resources.json",
    "e-start-params.json",
    "ai-params.json",
    "ui-params.json",
    "terrain-improvements.json",
    "terrain-movement.json",
    "terrain-yields.json",
    "map-gen-params.json",
    "units.json",
    "combat-params.json",
    "terrain-combat.json",
    "counters.json",
    "auto-battle-params.json",
    "power-params.json",
];

/// Jawne błędy ładowania. Każdy wariant (poza `DirectoryMissing`) niesie `file`.
#[derive(Debug)]
pub enum LoadError {
    /// Katalog nie istnieje albo nie jest katalogiem.
    DirectoryMissing { path: PathBuf },
    /// Plik nie istnieje (`io::ErrorKind::NotFound`).
    FileMissing { file: PathBuf },
    /// Inny błąd odczytu (uprawnienia, EISDIR itp.).
    Io { file: PathBuf, source: io::Error },
    /// Plik ma zero bajtów albo wyłącznie białe znaki.
    Empty { file: PathBuf },
    /// Plik nie jest poprawnym UTF-8.
    NotUtf8 { file: PathBuf, source: Utf8Error },
    /// Uszkodzony JSON (składnia lub ucięty dokument); pozycja z `serde_json`.
    InvalidJson {
        file: PathBuf,
        line: usize,
        column: usize,
        message: String,
    },
    /// Poprawny JSON o złym kształcie/typie (zły typ pola, brakujące pole, nieznane pole).
    ShapeMismatch { file: PathBuf, message: String },
}

impl fmt::Display for LoadError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DirectoryMissing { path } => {
                write!(formatter, "data directory does not exist: {}", path.display())
            }
            Self::FileMissing { file } => {
                write!(formatter, "data file is missing: {}", file.display())
            }
            Self::Io { file, source } => {
                write!(formatter, "cannot read data file {}: {source}", file.display())
            }
            Self::Empty { file } => write!(formatter, "data file is empty: {}", file.display()),
            Self::NotUtf8 { file, source } => {
                write!(formatter, "data file is not valid UTF-8 {}: {source}", file.display())
            }
            Self::InvalidJson {
                file,
                line,
                column,
                message,
            } => write!(
                formatter,
                "invalid JSON in {} at line {line} column {column}: {message}",
                file.display()
            ),
            Self::ShapeMismatch { file, message } => {
                write!(formatter, "unexpected shape in {}: {message}", file.display())
            }
        }
    }
}

impl Error for LoadError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Io { source, .. } => Some(source),
            Self::NotUtf8 { source, .. } => Some(source),
            _ => None,
        }
    }
}

/// Ładuje jeden plik `name` z katalogu `dir` do typu `T` (typ z `data::*`).
pub fn load_file<T: DeserializeOwned>(dir: &Path, name: &str) -> Result<T, LoadError> {
    let file = dir.join(name);
    let bytes = fs::read(&file).map_err(|source| match source.kind() {
        io::ErrorKind::NotFound => LoadError::FileMissing { file: file.clone() },
        _ => LoadError::Io {
            file: file.clone(),
            source,
        },
    })?;
    let text = std::str::from_utf8(&bytes).map_err(|source| LoadError::NotUtf8 {
        file: file.clone(),
        source,
    })?;
    if text.trim().is_empty() {
        return Err(LoadError::Empty { file });
    }
    serde_json::from_str::<T>(text).map_err(|error| match error.classify() {
        Category::Data => LoadError::ShapeMismatch {
            file,
            message: error.to_string(),
        },
        Category::Syntax | Category::Eof | Category::Io => LoadError::InvalidJson {
            file,
            line: error.line(),
            column: error.column(),
            message: error.to_string(),
        },
    })
}

/// Wszystkie 29 plików danych, każdy już zdeserializowany do typu z `data::*`.
pub struct DataSet {
    pub civs: CivsFile,
    pub civ_matrix: CivMatrixFile,
    pub civ_params: CivParamsFile,
    pub civ_ai: CivAiFile,
    pub diplomacy: DiplomacyFile,
    pub diplomacy_acceptance_points: AcceptancePointsFile,
    pub city_names_pools: CityNamesPoolsFile,
    pub buildings: Vec<Building>,
    pub wonders: Wonders,
    pub tech: TechFile,
    pub econ_params: EconParams,
    pub society_params: SocietyParams,
    pub epoka_ludnosc_manpower: EpokaLudnoscManpower,
    pub citizen_resource_upkeep: CitizenResourceUpkeep,
    pub miasto_params: MiastoParams,
    pub resources: Vec<ResourceItem>,
    pub e_start_params: EStartParams,
    pub ai_params: AiParams,
    pub ui_params: UiParams,
    pub terrain_improvements: TerrainImprovementsFile,
    pub terrain_movement: TerrainMovementFile,
    pub terrain_yields: TerrainYieldsFile,
    pub map_gen_params: MapGenParamsFile,
    pub units: Vec<UnitRecord>,
    pub combat_params: CombatParamsFile,
    pub terrain_combat: Vec<TerrainCombatRecord>,
    pub counters: Vec<CounterRule>,
    pub auto_battle_params: AutoBattleParamsFile,
    pub power_params: PowerParamsFile,
}

/// Ładuje wszystkie 29 plików z `dir`. Zwraca pierwszy napotkany błąd
/// (kolejność zgodna z `DATA_FILES`). Pliki spoza listy są ignorowane.
pub fn load_all(dir: &Path) -> Result<DataSet, LoadError> {
    if !dir.is_dir() {
        return Err(LoadError::DirectoryMissing {
            path: dir.to_path_buf(),
        });
    }
    Ok(DataSet {
        civs: load_file(dir, "civs.json")?,
        civ_matrix: load_file(dir, "civ-matrix.json")?,
        civ_params: load_file(dir, "civ-params.json")?,
        civ_ai: load_file(dir, "civ-ai.json")?,
        diplomacy: load_file(dir, "diplomacy.json")?,
        diplomacy_acceptance_points: load_file(dir, "diplomacy-acceptance-points.json")?,
        city_names_pools: load_file(dir, "city-names-pools.json")?,
        buildings: load_file(dir, "buildings.json")?,
        wonders: load_file(dir, "wonders.json")?,
        tech: load_file(dir, "tech.json")?,
        econ_params: load_file(dir, "econ-params.json")?,
        society_params: load_file(dir, "society-params.json")?,
        epoka_ludnosc_manpower: load_file(dir, "epoka-ludnosc-manpower.json")?,
        citizen_resource_upkeep: load_file(dir, "citizen-resource-upkeep.json")?,
        miasto_params: load_file(dir, "miasto-params.json")?,
        resources: load_file(dir, "resources.json")?,
        e_start_params: load_file(dir, "e-start-params.json")?,
        ai_params: load_file(dir, "ai-params.json")?,
        ui_params: load_file(dir, "ui-params.json")?,
        terrain_improvements: load_file(dir, "terrain-improvements.json")?,
        terrain_movement: load_file(dir, "terrain-movement.json")?,
        terrain_yields: load_file(dir, "terrain-yields.json")?,
        map_gen_params: load_file(dir, "map-gen-params.json")?,
        units: load_file(dir, "units.json")?,
        combat_params: load_file(dir, "combat-params.json")?,
        terrain_combat: load_file(dir, "terrain-combat.json")?,
        counters: load_file(dir, "counters.json")?,
        auto_battle_params: load_file(dir, "auto-battle-params.json")?,
        power_params: load_file(dir, "power-params.json")?,
    })
}
