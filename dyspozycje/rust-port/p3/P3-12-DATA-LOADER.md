# P3.9 + P3.12 — Loader/walidator danych z katalogu (R-RUSTPORT-P3-12-DATA-LOADER-Q1)

Runda 2 (odpowiedź Operatora na FAIL z rundy 1). Odpowiedź punkt po punkcie:
`dyspozycje/autobot/runs/R-RUSTPORT-P3-12-DATA-LOADER-Q1/02-operator-obrona.md`.

## 1. Zakres

Bramka P3 wymaga „dane ładowane ze źródła (nie hard-coded)”. Temat dodaje loader,
który ładuje i waliduje 29 plików danych z katalogu podanego argumentem, z jawnymi
błędami i testami negatywnymi/pozytywnymi. Zero zmian zachowania istniejących modułów
`data::*` (ich `parse_*` nadal czytają `include_str!`).

## 2. Zmiany

- `rust-port/engine/src/data/loader.rs` (NOWY):
  - `DATA_FILES: &[&str]` — nazwy 29 plików. Lista, pola `DataSet` i wywołania
    `load_file` powstają z JEDNEJ tabeli (makro `data_table!`), więc lista nie może
    rozjechać się z `load_all` (w rundzie 1 były to dwa osobne miejsca).
  - `load_file<T: DeserializeOwned>(dir, name) -> Result<T, LoadError>`.
  - `load_all(dir) -> Result<DataSet, LoadError>`; `DataSet` trzyma typy z istniejących
    modułów `data::*` (bez duplikacji struktur).
  - `LoadError` (Display + `Error::source`), warianty:
    - `DirectoryMissing { path }` — ścieżka nie istnieje, nie jest katalogiem lub nie da się jej
      odczytać jako katalogu (komunikat: „missing or not a directory”),
    - `FileMissing { file }` — `io::ErrorKind::NotFound`,
    - `Io { file, source }` — inny błąd odczytu (np. EISDIR, uprawnienia),
    - `Empty { file }` — zero bajtów lub same białe znaki,
    - `NotUtf8 { file, source }`,
    - `InvalidJson { file, line, column, message }` — składnia lub ucięty dokument,
    - `ShapeMismatch { file, line, column, message }` — poprawny JSON, zły typ/brak pola
      (`line`/`column` z `serde_json`, komunikat z nazwą pola/typu).
- `rust-port/engine/src/data/mod.rs`: dopisane wyłącznie `pub mod loader;`.
- `rust-port/engine/tests/data_loader.rs` (NOWY): 14 testów (patrz §3).

Brak zmian w `Cargo.toml`, `lib.rs`, innych `src/**`, `gra/**`. Brak nowych zależności
(`tempfile` nieużyty — katalogi tymczasowe przez `std::env::temp_dir()`, sprzątane w `Drop`).
Brak `unwrap`/`expect`/`panic!` w `loader.rs` (grep: 0 trafień).

## 3. Testy

Pozytywne (2): `loads_all_29_files_from_data_dir` (wszystkie 29 plików z `CARGO_MANIFEST_DIR/data`;
15 cywilizacji, 11 start_gry, 93 param_defs, 75 jednostek) oraz `data_files_list_matches_directory_contents`
(lista `DATA_FILES` = pliki `*.json` na dysku).

Negatywne (12), każdy z asercją na KONKRETNY wariant (i nazwę pliku / pozycję):

| Test | Wariant |
|---|---|
| `neg_missing_file_is_file_missing` | `FileMissing` (`tech.json`) |
| `neg_every_listed_file_is_required_by_load_all` | `FileMissing` dla KAŻDEGO z 29 plików po kolei (dowód, że `load_all` czyta wszystkie) |
| `neg_unreadable_file_is_io` | `Io` (katalog w miejscu `civs.json`, EISDIR; bez uprawnień) |
| `neg_empty_file_is_empty` | `Empty` |
| `neg_whitespace_only_file_is_empty` | `Empty` |
| `neg_truncated_json_is_invalid_json_with_position` | `InvalidJson` (line 1, column ≥ 1) |
| `neg_syntax_error_is_invalid_json_on_second_line` | `InvalidJson` (line 2) |
| `neg_number_where_object_expected_is_shape_mismatch_with_position` | `ShapeMismatch` (line 1, column ≥ 1, `invalid type`) |
| `neg_missing_required_field_is_shape_mismatch_naming_field` | `ShapeMismatch` (line 1, `missing field \`start_gry\``) |
| `neg_missing_directory_is_directory_missing` | `DirectoryMissing` |
| `neg_path_that_is_a_file_is_directory_missing` | `DirectoryMissing` (ścieżka wskazuje na plik) |
| `neg_non_utf8_file_is_not_utf8` | `NotUtf8` |

Wszystkie 7 wariantów `LoadError` ma test negatywny.

## 4. Liczby (zmierzone, nie szacowane)

- Baseline `1d53dcdb` (przed zmianą): **256 passed, 0 failed, 33 binarek, EXIT=0**
  (log: `runs/.../cargo-test-baseline-1d53dcdb.log`).
- Po zmianie (`5cecefc8` + poprawka rundy 2): **270 passed, 0 failed, 34 binarki** (+14 = 14 testów `data_loader`).
  Żaden istniejący test nie zniknął (256 z bazy nadal przechodzi).
- Dispatch mówił o „27 plikach”; na dysku `rust-port/engine/data/*.json` jest **29** plików.
  Loader obsługuje wszystkie 29, a test `data_files_list_matches_directory_contents` pilnuje zgodności z dyskiem.

## 5. Weryfikacja (surowe logi w katalogu runu)

Surowe wyjścia `cargo` są zapisane w `dyspozycje/autobot/runs/R-RUSTPORT-P3-12-DATA-LOADER-Q1/`:

- `cargo-test-baseline-1d53dcdb.log` — baseline, `EXIT=0`, 256 passed.
- `cargo-build.log` — `cargo build --offline`, `EXIT=0`, 0 ostrzeżeń.
- `cargo-test-data-loader.log` — `cargo test --offline --test data_loader`, `14 passed; 0 failed`, `EXIT=0`.
- `cargo-test-full-run1.log` i `cargo-test-full-run2.log` — pełny `cargo test --offline`, dwa kolejne przebiegi,
  oba `EXIT=0`, 34 binarki, 270 passed, 0 failed, 0 ostrzeżeń.

Komendy (CARGO_TARGET_DIR wskazuje podkatalog per worktree, patrz §6):

```
$ CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_e4a2b632-106-3 CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline --manifest-path rust-port/engine/Cargo.toml
...
EXIT=0
```

## 6. Środowisko i wyścig artefaktów (wyjaśnienie)

- Wspólny `CARGO_TARGET_DIR=/home/user/cargo-target-shared` (sam katalog, bez podkatalogu) przy
  równoległych buildach innych worktree dał `error[E0432]: unresolved import civ_engine::data::loader`
  (`Blocking waiting for file lock on build directory` tuż przed błędem). Nie został złapany surowy log
  tego przebiegu (kolejny przebieg go nadpisał).
- Hipoteza przyczyny (zgodna z obserwacją, nieformalnie udowodniona): identyczne względne ścieżki pakietu
  w różnych worktree dają ten sam hash jednostki kompilacji, więc artefakty `civ_engine` z różnych drzew
  nadpisują się w jednym katalogu; fingerprint opiera się na mtime.
- Obejście (rozszerzenie dispatchu, ten sam wolumen): podkatalog per worktree
  `/home/user/cargo-target-shared/wf_e4a2b632-106-3`. Koszt dysku: ok. 1–2 GB, wolumen ma ok. 19 GB wolnego.
- Historia z rundy 1: wolumen był chwilowo pełny (ENOSPC); operator usunął regenerowalny cache
  `debug/incremental` (750 MB) we WSPÓLNYM katalogu, co mogło wpłynąć na inne tematy. W rundzie 2
  nie usuwano niczego z cache'a współdzielonego.

## 7. Uwagi

- Logowanie (`tracing`) nie zostało dodane: loader zwraca błędy, a shell decyduje o raportowaniu.
- Pełna ścieżka serde (`serde_path_to_error`) jest ODRZUCONA w tej rundzie: wymagałaby zależności,
  której dispatch zakazuje. Zamiast tego błąd kształtu niesie `line`/`column` i komunikat serde.
  Pozostaje decyzją właściciela, czy dopuścić tę zależność.
