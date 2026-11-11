//! P6-ZAPIS-LOADER-MIGRATE: jedyna produkcyjna sciezka ladowania [`SaveSnapshot`] z tekstu JSON.
//!
//! Deserializacja `serde_json::from_str::<SaveSnapshot>` NIE wykonuje migracji (patrz komentarz
//! przy `impl Deserialize for SaveSnapshot` w `save_load.rs`). Ta funkcja deserializuje snapshot
//! i od razu wola [`SaveSnapshot::migrate_on_load`], zwracajac raport migracji. Kazdy nowy kod
//! ladujacy zapis powinien przechodzic przez te funkcje, a nie przez surowe `from_str`.

use std::error::Error;
use std::fmt;

use super::save_load::SaveSnapshot;
use super::save_migrations::LoadMigrationReport;

/// Bledy ladowania zapisu z tekstu.
#[derive(Debug)]
pub enum LoadError {
    /// Tekst nie jest poprawnym JSON-em snapshotu (skladnia, brak wersji, nieobslugiwana wersja, bledne pola).
    Json(serde_json::Error),
}

impl fmt::Display for LoadError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Json(error) => write!(formatter, "save snapshot JSON is invalid: {error}"),
        }
    }
}

impl Error for LoadError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Json(error) => Some(error),
        }
    }
}

/// Wczytuje [`SaveSnapshot`] z tekstu JSON i wykonuje migracje przy wczytaniu.
///
/// Epoka kazdego wlasciciela (limit wodzow zalezy od epoki) pochodzi z DANYCH ZAPISU: ludzie z
/// `gracze[].era`, AI z `meta.ownerEraByOwner` (zob. [`SaveSnapshot::owner_era`]). Zapis bez
/// epoki dostaje udokumentowany wynik (`SaveMeta::start_era_fallback`). Zwraca snapshot po migracji
/// oraz raport tego, co migracja zmienila (zdegradowani wodzowie, przeniesione jednostki).
pub fn load_save_snapshot(text: &str) -> Result<(SaveSnapshot, LoadMigrationReport), LoadError> {
    let mut snapshot: SaveSnapshot = serde_json::from_str(text).map_err(LoadError::Json)?;
    let report = snapshot.migrate_on_load();
    Ok((snapshot, report))
}
