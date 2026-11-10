# P6.M00 - Szkielet portu generatora mapy

Temat: `R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1` (DOMAIN: GAME, rozmiar S, 0 LOC web, zero wektorow).
Baza: `origin/rust-port/parity-v2` @ `d8429335`. Zrodlo planu: `P6-25-MAPA-GAP.md` §6, §6a, §9 (ZALOZENIE Z1).

## 1. Co zrobiono

Utworzono PUSTE pliki (wylacznie komentarze `//!` z tematem wlascicielem i zakresem web wg P6-25 §6) oraz deklaracje `pub mod`. Zadnej logiki, zadnych danych. Model `MapHex`/`types.rs` NIE jest w M00 (zostaje dla M01; `types.rs` to pusty plik).

Kolizje nazw: `ls rust-port/engine/src/domain | grep -E 'territory|wonder|roads|improvement_build|map_snapshot|mapgen'` na bazie - puste (brak kolizji). Istnieje tylko `improvements.rs` (inna nazwa, nietkniety).

## 2. Lista plikow i wlasciciel tematu

| plik (`rust-port/engine/src/domain/`) | wlasciciel |
|---|---|
| `mod.rs` | M00 (tylko `pub mod`: `improvement_build`, `map_snapshot`, `mapgen`, `roads`, `territory`, `wonder_placement`) |
| `mapgen/mod.rs` | M00 (22 x `pub mod`) |
| `mapgen/types.rs` | M01 (model `MapHex`, Z2) |
| `mapgen/prims.rs` | M01 |
| `mapgen/params.rs` | M02 |
| `mapgen/masks.rs` | M03 |
| `mapgen/terrain_class.rs` | M04 |
| `mapgen/relief.rs` | M05A, potem M05B (wspolny plik, sekwencyjnie) |
| `mapgen/landsea.rs` | M06A |
| `mapgen/coast.rs` | M06B |
| `mapgen/rivers_a.rs` .. `rivers_e2.rs` | M07A, M07B, M07C, M07D, M07E1, M07E2 (po jednym) |
| `mapgen/deposits.rs` | M08 |
| `mapgen/cluster_rivals.rs` | M09 |
| `mapgen/cluster_mass.rs` | M10 |
| `mapgen/cluster_layout.rs` | M11 |
| `mapgen/cluster_compute.rs` | M12 |
| `mapgen/starts.rs`, `mapgen/villages.rs` | M13 |
| `mapgen/generate.rs` | M18 |
| `territory.rs`, `wonder_placement.rs` | M14 |
| `roads.rs` | M15 |
| `improvement_build.rs` | M16 |
| `map_snapshot.rs` | M17 |

Zakres web per plik jest w komentarzach `//!` danego pliku (zgodny z kolumna "zakres web" P6-25 §6). Po M00 zaden temat M* nie edytuje `domain/mod.rs`.

## 3. Zaleznosci i sekwencja (z P6-25 §6; zakres M01..M18, M18 = `generate.rs`)

- Start: M00 (ten temat). Po M00 rownolegle: M01, M02, M09, M14, M15, M17 (rozlaczne pliki).
- M03, M04 po M01+M02 (rownolegle ze soba). M05A -> M05B -> M06A -> M06B -> M07A -> M07B -> M07C -> M07D -> M07E1 -> M07E2 (lancuch).
- M08 po M02+M06B (rownolegle z M07*).
- M10 po M09 (i M01); M11 po M10; M12 po M11 i M07E2; M13 po M06B i M10.
- M16 po P6.3 (i M00). M17 przed P6.20. M15: wiring w `pathfinding.rs` dopiero po P6.4.
- M18 ostatni (M01..M08, M12, M13), przepiecie `generate_map`.
- Znane przeciecia plikow (sekwencyjnie): `relief.rs` (M05A/M05B), `prims.rs` (M00/M01), `params.rs` (M00/M02) - M00 tworzy pliki pierwszy.

## 4. Test

`rust-port/engine/tests/p6_m00_skeleton.rs` (5 testow; po M14 patrz §8): moduly kompiluja sie i sa publiczne (`use civ_engine::domain::{mapgen, ...}` oraz wszystkie 22 podmoduly), lista plikow/modulow zgodna z wierszem M00 tabeli P6-25 §6 zapisanym w runie (`dyspozycje/autobot/runs/R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1/p6-25-sec6-m00-row.txt`, linia 740 dokumentu), pliki zawieraja wylacznie `//!`, `mapgen/mod.rs` deklaruje dokladnie moduly z dokumentu i nie ma plikow-sierot, `domain/mod.rs` deklaruje moduly szkieletu. Dodatkowo `skeleton_headers_name_full_owner_ids_from_table` porownuje pelne ID wlasciciela z naglowka `//!` kazdego pliku z kolumna "allowlista Rust" wierszy M01..M18 (`p6-25-sec6-rows-m00-m18.txt`, linie 740-765 P6-25); wyjatek jawny: `mapgen/types.rs` = M01 (ZALOZENIE Z2; wiersz M01 nie wymienia pliku). Test czerwienieje przy blednym wlascicielu (mutacja M04->M99 sprawdzona). Zalezy od artefaktu w runie, bo tak wymagal dispatch; run jest trwalym zapisem audytu. Bez pinow wartosci.

## 5. Bramki (surowe logi w runie, EXIT=0)

- `gate-fmt.log` - `cargo fmt --check`: EXIT=0
- `gate-clippy.log` - `cargo clippy --all-targets -- -D warnings`: EXIT=0
- `gate-test.log` - `cargo test`: EXIT=0, 563 passed / 0 failed (baza 558, +5 nowych)
- `gate-diffcheck.log` - diff --check wzgledem d8429335: EXIT=0

## 6. Tabela bylo/jest

| | bylo | jest |
|---|---|---|
| testy silnika | 558 | 562 (+4 `p6_m00_skeleton`) |
| zmiany istniejacych testow | - | brak |
| symbole portowane | - | 0 (temat S, zero portu web) |

## 7. Granice

Zero zmian w `data/**`, `bridge.rs`, `Cargo.toml`, `gra/**`, renderer, `src-tauri`; `Cargo.lock`/`target` niecommitowane; `domain/mod.rs` zmieniony tylko addytywnie (6 deklaracji `pub mod`). Mozliwy konflikt addytywny w `mod.rs` z rownoleglym P6.4 - do rozwiazania przez orkiestratora.

## 8. Zmiana po M14: test szkieletu

Test `files_exist_and_are_empty_doc_only` zmieniono na `files_exist_and_start_with_owner_doc_header`. Wymagal, by CALY plik szkieletu byl komentarzami `//!`, wiec po wypelnieniu pliku przez temat M* byl czerwony (blad projektu testu, nie kodu). Teraz test nadal wymaga: (1) istnienia kazdego pliku z listy, (2) bloku `//!` na poczatku pliku zawierajacego pelne ID tematu-wlasciciela zgodne z tabela z pliku w runie, (3) ze pierwszy niepusty wiersz to `//!`. Usunieto wylacznie wymog, ze caly plik to komentarze. Pozostale testy bez zmian.
