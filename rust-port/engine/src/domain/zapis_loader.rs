//! P6-ZAPIS-LOADER-MIGRATE: jedyna produkcyjna sciezka ladowania [`SaveSnapshot`] z tekstu JSON.
//!
//! Deserializacja `serde_json::from_str::<SaveSnapshot>` NIE wykonuje migracji (patrz komentarz
//! przy `impl Deserialize for SaveSnapshot` w `save_load.rs`). Ta funkcja deserializuje snapshot
//! i od razu wola [`SaveSnapshot::migrate_on_load`], zwracajac raport migracji. Kazdy nowy kod
//! ladujacy zapis powinien przechodzic przez te funkcje, a nie przez surowe `from_str`.

use std::error::Error;
use std::fmt;

use serde::de::DeserializeOwned;

use super::replay::{ReplayLog, ReplayMigrationReports};
use super::save_load::SaveSnapshot;
use super::save_migrations::LoadMigrationReport;
use super::PlayerId;

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
/// `era_for_owner` podaje epoke wlasciciela (limit wodzow zalezy od epoki); wywolujacy musi go
/// dostarczyc, bo silnik nie ma wlasnego zrodla epok. Zwraca snapshot po migracji oraz raport
/// tego, co migracja zmienila (zdegradowani wodzowie, przeniesione jednostki).
pub fn load_save_snapshot(
    text: &str,
    era_for_owner: impl Fn(PlayerId) -> f64,
) -> Result<(SaveSnapshot, LoadMigrationReport), LoadError> {
    let mut snapshot: SaveSnapshot = serde_json::from_str(text).map_err(LoadError::Json)?;
    let report = snapshot.migrate_on_load(era_for_owner);
    Ok((snapshot, report))
}

/// P6-ZAPIS-REPLAY-MIGRATE: produkcyjna sciezka ladowania [`ReplayLog`] z tekstu JSON.
///
/// Deserializacja samego `ReplayLog` zostawia checkpointy niezmigrowane i blokuje odtwarzanie
/// (`ReplayError::SnapshotsNotMigrated`). Ta funkcja deserializuje replay i od razu migruje
/// kazdy snapshot przez [`SaveSnapshot::migrate_on_load`], zwracajac raport per krok
/// (klucz: sekwencja kroku). Analogiczny wzorzec do [`load_save_snapshot`].
pub fn load_replay_log_json<I: DeserializeOwned>(
    text: &str,
    era_for_owner: impl Fn(PlayerId) -> f64,
) -> Result<(ReplayLog<I>, ReplayMigrationReports), LoadError> {
    let mut replay: ReplayLog<I> = serde_json::from_str(text).map_err(LoadError::Json)?;
    let reports = replay.migrate_on_load(era_for_owner);
    Ok((replay, reports))
}
