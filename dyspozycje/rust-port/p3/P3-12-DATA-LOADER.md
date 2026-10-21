# P3.9 + P3.12 — Loader/walidator danych z katalogu (R-RUSTPORT-P3-12-DATA-LOADER-Q1)

## 1. Zakres

Bramka P3 wymaga „dane ładowane ze źródła (nie hard-coded)”. Ten temat dodaje
loader, który ładuje i waliduje 29 plików danych z katalogu podanego argumentem,
z jawnymi błędami i testami negatywnymi/pozytywnymi. Zero zmian zachowania
istniejących modułów `data::*` (ich `parse_*` nadal czytają `include_str!`).

## 2. Zmiany

- `rust-port/engine/src/data/loader.rs` (NOWY):
  - `DATA_FILES: [&str; 29]` — nazwy plików obsługiwanych przez loader.
  - `load_file<T: DeserializeOwned>(dir, name) -> Result<T, LoadError>` — jeden plik do typu z `data::*`.
  - `load_all(dir) -> Result<DataSet, LoadError>` — wszystkie 29 plików; `DataSet` trzyma typy z istniejących modułów (bez duplikacji struktur).
  - `LoadError` (Display + `Error::source`), warianty:
    - `DirectoryMissing { path }` — katalog nie istnieje / nie jest katalogiem,
    - `FileMissing { file }` — `io::ErrorKind::NotFound`,
    - `Io { file, source }` — inny błąd odczytu,
    - `Empty { file }` — zero bajtów lub same białe znaki,
    - `NotUtf8 { file, source }`,
    - `InvalidJson { file, line, column, message }` — składnia lub ucięty dokument (`Category::Syntax`/`Eof`),
    - `ShapeMismatch { file, message }` — poprawny JSON, zły typ/brak pola/nieznane pole (`Category::Data`).
- `rust-port/engine/src/data/mod.rs`: dopisane wyłącznie `pub mod loader;`.
- `rust-port/engine/tests/data_loader.rs` (NOWY): 11 testów (patrz §3).

Brak zmian w `Cargo.toml`, `lib.rs`, innych `src/**`, `gra/**`. Brak nowych zależności
(`tempfile` nieużyty — katalogi tymczasowe przez `std::env::temp_dir()` z unikalną nazwą, sprzątane w `Drop`).

## 3. Testy

Pozytywne (1): `loads_all_29_files_from_data_dir` (wszystkie 29 plików z `CARGO_MANIFEST_DIR/data`, liczniki zgodne z istniejącymi testami: 15 cywilizacji, 11 start_gry, 93 param_defs, 75 jednostek) oraz `data_files_list_matches_directory_contents` (lista `DATA_FILES` = pliki `*.json` na dysku).

Negatywne (8), każdy z asercją na KONKRETNY wariant i nazwę pliku:

| Test | Wariant |
|---|---|
| `neg_missing_file_is_file_missing` | `FileMissing` (`tech.json` usunięty z kopii katalogu) |
| `neg_empty_file_is_empty` | `Empty` |
| `neg_whitespace_only_file_is_empty` | `Empty` |
| `neg_truncated_json_is_invalid_json_with_position` | `InvalidJson` (line 1, column ≥ 1) |
| `neg_syntax_error_is_invalid_json_on_second_line` | `InvalidJson` (line 2) |
| `neg_number_where_object_expected_is_shape_mismatch` | `ShapeMismatch` (`invalid type`) |
| `neg_missing_required_field_is_shape_mismatch_naming_field` | `ShapeMismatch` (`missing field \`start_gry\``) |
| `neg_missing_directory_is_directory_missing` | `DirectoryMissing` |
| `neg_non_utf8_file_is_not_utf8` | `NotUtf8` |

Wariant `Io` nie ma osobnego testu: wymagałby wymuszenia błędu odczytu innego niż
`NotFound` (np. uprawnienia lub katalog w miejscu pliku), a test zależny od uprawnień
bywa niestabilny między środowiskami — wariant jest obsłużony w kodzie i opisany w §4.

Ograniczenie „ścieżki serde”: bez `serde_path_to_error` (zabroniona zależność) pozycja
w błędzie kształtu to komunikat `serde_json` z `line`/`column` i nazwą pola/typu.

## 4. Uwagi

- Liczba plików: dispatch mówi „27”, na dysku jest 29 (`rust-port/engine/data/*.json`). Loader obsługuje wszystkie 29; wszystkie mają istniejący `parse_*`-odpowiednik typu.
- Baseline przed zmianą: `cargo test --offline` = 261 passed (dispatch oczekiwał 256). Po zmianie: 272 passed (+11), żaden test nie zniknął.
- Logowanie (`tracing`) nie zostało dodane: loader zwraca błędy, a shell decyduje o raportowaniu.

## 5. Weryfikacja (surowe wyjścia)

Test celowany loadera:

```
$ cargo test --offline --test data_loader
running 11 tests
test neg_empty_file_is_empty ... ok
test data_files_list_matches_directory_contents ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch ... ok
test neg_missing_file_is_file_missing ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test loads_all_29_files_from_data_dir ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s
EXIT=0
```

Build:

```
$ cargo build --offline
   Finished `dev` profile [unoptimized] target(s) in 11.16s
BUILD_EXIT=0
```

Pełny zestaw testów (`cargo test --offline`, wszystkie binarki; wynik zliczony z `test result`):

```
test result: ok. 6 passed; ... (lib)
test result: ok. 11 passed; ... (ai_turn)
test result: ok. 10 passed; ... (barbarians)
test result: ok. 1 passed; ... (bridge_add_player)
test result: ok. 10 passed; ... (building_costs)
test result: ok. 10 passed; ... (city_growth)
test result: ok. 7 passed; ... (combat)
test result: ok. 3 passed; ... (data_buildings_tech)
test result: ok. 7 passed; ... (data_civilizations)
test result: ok. 9 passed; ... (data_economy_society)
test result: ok. 11 passed; ... (data_loader)
test result: ok. 4 passed; ... (data_terrain_map)
test result: ok. 6 passed; ... (data_units_combat)
test result: ok. 31 passed; ... (diplomacy)
test result: ok. 8 passed; ... (events)
test result: ok. 10 passed; ... (hex_terrain)
test result: ok. 13 passed; ... (improvements)
test result: ok. 6 passed; ... (map_generator)
test result: ok. 11 passed; ... (parity_suite)
test result: ok. 8 passed; ... (pathfinding)
test result: ok. 7 passed; ... (playable_slice)
test result: ok. 7 passed; ... (recruitment)
test result: ok. 6 passed; ... (replay)
test result: ok. 5 passed; ... (resource_production)
test result: ok. 4 passed; ... (rng)
test result: ok. 6 passed; ... (save_load)
test result: ok. 2 passed; ... (smoke)
test result: ok. 10 passed; ... (state_dto)
test result: ok. 5 passed; ... (steam_adapter)
test result: ok. 9 passed; ... (terrain_movement_fix)
test result: ok. 12 passed; ... (trade)
test result: ok. 7 passed; ... (turn_economy)
test result: ok. 5 passed; ... (unit_epoch)
test result: ok. 0 passed; ... (Doc-tests civ_engine)
SUMA passed = 272, failed = 0
EXIT=0
```

Uwaga o środowisku: katalog `CARGO_TARGET_DIR=/home/user/cargo-target-shared` był pełny
(ENOSPC). Usunięto regenerowalny cache `debug/incremental` (750 MB) i budowano z
`CARGO_INCREMENTAL=0`. Równoległe buildy innych tematów w tym samym katalogu docelowym
powodowały jednorazowy błąd `unresolved import` (wyścig artefaktów); po `touch` źródeł
i ponownym uruchomieniu wynik jest czysty, jak wyżej.
