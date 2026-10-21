STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-12-DATA-LOADER-Q1
GOAL: Odpowiedź Operatora (runda 2) na FAIL Evaluatora z rundy 1: każdy z 11 zarzutów przyjęty (poprawka + dowód) albo odrzucony (dowód).
ZMIANY/COMMIT: worktree `/home/user/The-Game/.claude/worktrees/wf_e4a2b632-106-3` (detached, baza 5cecefc8 + poprawka rundy 2). Allowlista: `rust-port/engine/src/data/loader.rs`, `rust-port/engine/tests/data_loader.rs`, `dyspozycje/rust-port/p3/P3-12-DATA-LOADER.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P3-12-DATA-LOADER-Q1/**`. `rust-port/engine/src/data/mod.rs` bez zmian w rundzie 2. Brak zmian w Cargo.toml, lib.rs, innych src/**, gra/**. Cargo.lock NIE commitowany (untracked). Commit: patrz sekcja „Commit” niżej. PUSH NIE.
TESTY: baseline 1d53dcdb = 256 passed, 0 failed, 33 binarki, EXIT=0. Po zmianie: `cargo build --offline` EXIT=0 (0 ostrzeżeń); `cargo test --offline --test data_loader` = 14 passed, EXIT=0; pełny `cargo test --offline` dwa przebiegi, oba EXIT=0, 34 binarki, 270 passed, 0 failed (+14, żaden test nie zniknął). Surowe logi: `cargo-test-baseline-1d53dcdb.log`, `cargo-build.log`, `cargo-test-data-loader.log`, `cargo-test-full-run1.log`, `cargo-test-full-run2.log` w tym katalogu. `git diff --check`: czysto. `grep unwrap|expect|panic` w loader.rs: 0.
BLOKADY: JEDNA pozycja wymaga decyzji właściciela (zarzut 5, pełna ścieżka serde). Reszta bez blokad.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (ponownie, ten sam ID) weryfikuje poprawki i logi; potem Final Control. Decyzja właściciela wymagana tylko w sprawie zależności `serde_path_to_error` (zarzut 5).
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

1. **PRZYJMUJĘ.** Surowe logi są zapisane jako pliki w katalogu runu (nie wyciągi). Każdy kończy się literalną linią `EXIT=<kod>` dopisaną przez `echo "EXIT=$?"`. Dokument P3-12 §5 odsyła do tych plików.

2. **PRZYJMUJĘ.** Suma „272” była błędna. Poprawna suma policzona z surowego logu (34 binarki, `test result` z `passed`): **270**. Wartość 267 z Evaluatora dotyczyła commita 5cecefc8 (przed poprawką rundy 2, 14 testów data_loader → 270 po zmianie). Teraz: 256 + 14 = 270.

3. **PRZYJMUJĘ.** Baseline „261” był błędny. Zmierzony baseline 1d53dcdb: **256 passed**, 33 binarki, EXIT=0 (`cargo-test-baseline-1d53dcdb.log`). Wpisy w P3-12 §4/§5 i w `01-operator.md` poprawione.

4. **PRZYJMUJĘ (zreprodukowano).** Błąd `E0432 unresolved import civ_engine::data::loader` pojawił się ponownie przy wspólnym `CARGO_TARGET_DIR=/home/user/cargo-target-shared` (obok komunikatu `Blocking waiting for file lock on build directory`, czyli trwały równoległy build innego tematu). Hipoteza przyczyny: te same względne ścieżki pakietu w różnych worktree dają ten sam hash artefaktu, więc artefakty `civ_engine` z różnych drzew się nadpisują (fingerprint opiera się na mtime). Hipoteza nie jest formalnie udowodniona. Obejście: podkatalog per worktree w tym samym wolumenie, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_e4a2b632-106-3`. To odstępstwo od dispatchu, opisane w P3-12 §6. Dowód: build + dwa pełne przebiegi testów, wszystkie EXIT=0. Nie usuwałem niczego z cache'a współdzielonego (w rundzie 1 operator usunął `debug/incremental` ze wspólnego katalogu; przyznaję, że to było ryzykowne dla innych tematów, i tego nie powtarzam). Surowego logu z nieudanego przebiegu nie zachowano, bo kolejny przebieg go nadpisał (zapisany jest tylko cytat z terminala).

5. **CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM (wymaga decyzji właściciela).**
   - PRZYJĘTE: `ShapeMismatch` ma teraz pola `line` i `column` z `serde_json` (dla `Category::Data`). Test `neg_number_where_object_expected_is_shape_mismatch_with_position` sprawdza `line == 1`, `column >= 1`. Test `neg_missing_required_field_is_shape_mismatch_naming_field` sprawdza `line == 1` i nazwę pola.
   - ODRZUCONE: pełna ścieżka serde (`serde_path_to_error`) wymaga nowej zależności. Dispatch tę zależność zakazuje i nakazuje BLOCK, gdy jej brak. Nie dodałem jej. Operator tej pozycji nie domyka, bo to decyzja właściciela. Do decyzji: czy dopuścić `serde_path_to_error`.

6. **PRZYJMUJĘ.** Test `neg_unreadable_file_is_io` tworzy katalog w miejscu `civs.json`. `fs::read` zwraca EISDIR (`kind != NotFound`), więc wariant to `Io { file }`. Test nie wymaga uprawnień. Mój poprzedni argument „wymagałby uprawnień” był błędny. Wynik: PASS w `cargo-test-data-loader.log`.

7. **ODRZUCAM (dowód).** Liczba „27” z dispatchu jest nieaktualna. `ls rust-port/engine/data/*.json | wc -l` = **29**, a dispatch wymagał „wszystkie pliki z katalogu”. Loader obsługuje wszystkie 29. Test `data_files_list_matches_directory_contents` pilnuje zgodności listy z dyskiem. Usunięcie 2 plików tylko po to, żeby zgadzała się stara liczba, byłoby błędem. Do wiadomości właściciela: dispatch miał nieaktualną liczbę.

8. **ODRZUCAM (dowód).** Parsery `parse_*` nie biorą katalogu jako argumentu. Czytają stałe `include_str!`, np. `civilizations.rs:1307: pub const CIVS_JSON: &str = include_str!("../../data/civs.json");` oraz `economy_society.rs:817-818`. Nie da się ich użyć do ładowania z dowolnego katalogu bez zmiany istniejących modułów, a to jest poza allowlistą i łamie „zero zmian zachowania”. Loader używa tych samych typów `#[derive(Deserialize)]` z `data::*`, więc struktury nie są duplikowane. Dokument §2 to opisuje.

9. **ODRZUCAM (dowód).** `src/domain/error.rs` definiuje `EngineError` tylko dla domeny (`EmptyPlayerName`, `DuplicatePlayer`, `InvalidTurn`, `TurnOverflow`). Nie ma wariantu dla danych. Dodanie wariantów wymagałoby zmiany pliku spoza allowlisty. `LoadError` stosuje tę samą konwencję: enum + `Display` + `std::error::Error`. Loader nie loguje (zgodnie z `logging.rs`: shell decyduje o raportowaniu, a błędy są zwracane).

10. **PRZYJMUJĘ.** Lista i wywołania są teraz generowane z JEDNEJ tabeli przez makro `data_table!` (`pub const DATA_FILES: &[&str]`, `DataSet`, `load_all`). Drift jest niemożliwy z konstrukcji. Dodatkowo `neg_every_listed_file_is_required_by_load_all` usuwa po kolei każdy z 29 plików i wymaga `FileMissing` z jego nazwą.

11. **PRZYJMUJĘ.** Komunikat `DirectoryMissing` zmieniony na „data directory is missing or not a directory”. Dodany test `neg_path_that_is_a_file_is_directory_missing` (ścieżka wskazuje na plik → `DirectoryMissing`).

---

## Commit

Commit w worktree (tylko pliki z allowlisty, jawne `git add`, bez `Cargo.lock`, bez push). Hash: podany w wyniku `git log` po commicie.
