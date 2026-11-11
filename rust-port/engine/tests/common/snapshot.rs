//! Wspolne helpery testow zapisu (dolaczane przez `#[path = "common/snapshot.rs"] mod snapshot;`).
//!
//! Wczytanie zapisu jak produkcyjny loader (`zapis_loader::load_save_snapshot`): prywatny typ wire
//! `RawSnapshot` + migracja. `SaveSnapshot` nie ma publicznej deserializacji (zob. `save_load.rs`).
//! Plik zaklada, ze w korzeniu crate'u testowego jest modul `save_load` (dolaczony przez `#[path]`).

use crate::save_load::{RawSnapshot, SaveSnapshot};

/// Wczytanie zapisu z tekstu JSON; semantyka jak produkcyjny loader.
pub fn decode_snapshot_str(text: &str) -> Result<SaveSnapshot, serde_json::Error> {
    let raw: RawSnapshot = serde_json::from_str(text)?;
    let mut snapshot = raw.into_snapshot();
    snapshot.migrate_on_load();
    Ok(snapshot)
}

/// Wariant dla juz sparsowanego `Value`; semantyka jak `decode_snapshot_str`.
pub fn decode_snapshot_value(value: serde_json::Value) -> Result<SaveSnapshot, serde_json::Error> {
    let raw: RawSnapshot = serde_json::from_value(value)?;
    let mut snapshot = raw.into_snapshot();
    snapshot.migrate_on_load();
    Ok(snapshot)
}
