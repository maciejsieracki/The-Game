//! Wersjonowanie danych i schematu engine.
//!
//! `SCHEMA_VERSION` to podstawa przyszłego wersjonowania zapisów i danych
//! (P2.11 / P2.7). Na tym etapie to wyłącznie stała i dokumentacja; pełny
//! mechanizm migracji NIE jest zaimplementowany.
//!
//! Relacja do istniejących wersji:
//! - `contractVersion` w `BridgeRequest` (P2.5 §1, `bridge.rs`) wersjonuje
//!   kontrakt wymiany komunikatów UI <-> engine, a nie format danych.
//! - `SCHEMA_VERSION` (ten plik) wersjonuje strukturę danych domenowych
//!   (identyfikatory, pola `PlayablePlayer`/`CombatUnit`/`AiUnit`/`BarbUnit`).
//! - `SAVE_VERSION` (P2.11) będzie przyszłą wersją formatu zapisu gry; wtedy
//!   zostanie zdefiniowany jako osobna stała, powiązana z `SCHEMA_VERSION`
//!   regułą migracji opisaną w P2.11.

/// Aktualna wersja schematu danych domenowych engine.
///
/// Podbijać przy każdej zmianie kształtu danych trwałych lub serializowanych
/// (zmiana typu pola ID z surowego `u64` na newtype nie zmienia JSON, bo
/// newtypy są `#[serde(transparent)]`; zmiana nazw lub zbioru pól już tak).
pub const SCHEMA_VERSION: u32 = 1;
