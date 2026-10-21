//! Konsolidacja modułów danych z fali P3.5A-E pod jeden moduł `data`,
//! podpięty do `lib.rs` (temat R-RUSTPORT-P3-9-DATA-CONSOLIDATION-Q1).
//!
//! Każdy z poniższych modułów odwzorowuje 1:1 kształt odpowiednich plików
//! JSON z `gra/data/` (kopie w `rust-port/engine/data/`). Dane NIE są tu
//! jeszcze powiązane z logiką domenową (`domain/**`) — to osobny, przyszły
//! temat rewiringu.

pub mod buildings_tech;
pub mod civilizations;
pub mod economy_society;
pub mod economy_society_part2;
pub mod loader;
pub mod terrain_map;
pub mod units_combat;
