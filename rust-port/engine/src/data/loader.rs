//! Loader/walidator plików danych z katalogu (P3.9 „Loader/walidator”,
//! P3.12 „testy brakujących/uszkodzonych danych”; temat R-RUSTPORT-P3-12-DATA-LOADER-Q1).
//!
//! Dane są ładowane z katalogu przekazanego argumentem (nigdy hard-coded).
//! Struktury NIE są duplikowane: każdy plik deserializowany jest do typu
//! z istniejącego modułu `data::*` (te same `#[derive(Deserialize)]`, co w
//! `parse_*`). Parsery `parse_*` pozostają nietknięte — czytają wbudowane
//! `include_str!` o stałej ścieżce, bez argumentu katalogu, więc loader
//! nie może ich wywołać; zamiast tego używa tych samych typów.
//!
//! Lista plików, pola `DataSet` i wywołania `load_file` powstają z JEDNEJ
//! tabeli (`data_table!`), więc `DATA_FILES` nie może rozjechać się z `load_all`.
//!
//! Błędy (`LoadError`) zawsze niosą ścieżkę pliku. Ścieżka nie jest panikującą:
//! brak `unwrap`/`expect` w ścieżkach błędów.
//!
//! Uwaga o „ścieżce serde”: pełna ścieżka pola (`serde_path_to_error`) wymagałaby
//! nowej zależności, która jest zakazana. Zamiast tego błąd kształtu niesie
//! `line`/`column` z `serde_json` oraz komunikat z nazwą pola/typu.

use std::error::Error;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::str::Utf8Error;

use serde::de::DeserializeOwned;
use serde_json::error::Category;

use super::buildings_tech::{Building, TechFile, Wonders};
use super::civilizations::{
    AcceptancePointsFile, CityNamesPoolsFile, CivAiFile, CivMatrixFile, CivParamsFile, CivsFile,
    DiplomacyFile,
};
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

/// Jawne błędy ładowania. Każdy wariant (poza `DirectoryMissing`) niesie `file`.
#[derive(Debug)]
pub enum LoadError {
    /// Ścieżka nie istnieje, nie jest katalogiem albo nie da się jej odczytać jako katalogu.
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
    /// Poprawny JSON o złym kształcie/typie (zły typ pola, brakujące pole, nieznane pole);
    /// pozycja (`line`/`column`) z `serde_json` wskazuje miejsce w pliku.
    ShapeMismatch {
        file: PathBuf,
        line: usize,
        column: usize,
        message: String,
    },
}

impl fmt::Display for LoadError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DirectoryMissing { path } => write!(
                formatter,
                "data directory is missing or not a directory: {}",
                path.display()
            ),
            Self::FileMissing { file } => {
                write!(formatter, "data file is missing: {}", file.display())
            }
            Self::Io { file, source } => {
                write!(
                    formatter,
                    "cannot read data file {}: {source}",
                    file.display()
                )
            }
            Self::Empty { file } => write!(formatter, "data file is empty: {}", file.display()),
            Self::NotUtf8 { file, source } => {
                write!(
                    formatter,
                    "data file is not valid UTF-8 {}: {source}",
                    file.display()
                )
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
            Self::ShapeMismatch {
                file,
                line,
                column,
                message,
            } => write!(
                formatter,
                "unexpected shape in {} at line {line} column {column}: {message}",
                file.display()
            ),
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
            line: error.line(),
            column: error.column(),
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

/// Jedna tabela: pole `DataSet` ↔ typ z `data::*` ↔ nazwa pliku w katalogu danych.
/// Z tej tabeli powstają `DATA_FILES`, struktura `DataSet` i `load_all`.
macro_rules! data_table {
    ($( $field:ident : $ty:ty => $name:literal ),* $(,)?) => {
        /// Nazwy plików danych obsługiwanych przez loader (kopie `rust-port/engine/data/`).
        pub const DATA_FILES: &[&str] = &[$($name),*];

        /// Wszystkie pliki danych, każdy już zdeserializowany do typu z `data::*`.
        pub struct DataSet {
            $(pub $field: $ty,)*
        }

        /// Ładuje wszystkie pliki z `dir` (kolejność zgodna z tabelą). Zwraca pierwszy błąd.
        pub fn load_all(dir: &Path) -> Result<DataSet, LoadError> {
            if !dir.is_dir() {
                return Err(LoadError::DirectoryMissing {
                    path: dir.to_path_buf(),
                });
            }
            Ok(DataSet {
                $($field: load_file::<$ty>(dir, $name)?,)*
            })
        }
    };
}

data_table! {
    civs: CivsFile => "civs.json",
    civ_matrix: CivMatrixFile => "civ-matrix.json",
    civ_params: CivParamsFile => "civ-params.json",
    civ_ai: CivAiFile => "civ-ai.json",
    diplomacy: DiplomacyFile => "diplomacy.json",
    diplomacy_acceptance_points: AcceptancePointsFile => "diplomacy-acceptance-points.json",
    city_names_pools: CityNamesPoolsFile => "city-names-pools.json",
    buildings: Vec<Building> => "buildings.json",
    wonders: Wonders => "wonders.json",
    tech: TechFile => "tech.json",
    econ_params: EconParams => "econ-params.json",
    society_params: SocietyParams => "society-params.json",
    epoka_ludnosc_manpower: EpokaLudnoscManpower => "epoka-ludnosc-manpower.json",
    citizen_resource_upkeep: CitizenResourceUpkeep => "citizen-resource-upkeep.json",
    miasto_params: MiastoParams => "miasto-params.json",
    resources: Vec<ResourceItem> => "resources.json",
    e_start_params: EStartParams => "e-start-params.json",
    ai_params: AiParams => "ai-params.json",
    ui_params: UiParams => "ui-params.json",
    terrain_improvements: TerrainImprovementsFile => "terrain-improvements.json",
    terrain_movement: TerrainMovementFile => "terrain-movement.json",
    terrain_yields: TerrainYieldsFile => "terrain-yields.json",
    map_gen_params: MapGenParamsFile => "map-gen-params.json",
    units: Vec<UnitRecord> => "units.json",
    combat_params: CombatParamsFile => "combat-params.json",
    terrain_combat: Vec<TerrainCombatRecord> => "terrain-combat.json",
    counters: Vec<CounterRule> => "counters.json",
    auto_battle_params: AutoBattleParamsFile => "auto-battle-params.json",
    power_params: PowerParamsFile => "power-params.json",
}
