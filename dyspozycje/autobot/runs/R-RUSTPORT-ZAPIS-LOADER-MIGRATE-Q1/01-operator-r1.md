STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1 (pozycja 6 REJESTR-RUST, runda 1/5, Operator)
GOAL: Wpiac produkcyjny loader zapisu tak, by zawsze wolal `migrate_on_load` i zwracal/zapisywal raport migracji.
BAZA: origin/rust-port/parity-v2 = a4087f332 (checkout detached w worktree).

ZMIANY/COMMIT: brak zmian kodu. Commit zawiera wylacznie ten raport. Kod nie zmieniony, bo premisa dispatchu nie zgadza sie z kodem (ponizej).

USTALENIA (zmierzone na a4087f332):
1. Brak produkcyjnego loadera. `git grep` po `rust-port/engine/src`:
   - `from_str::<SaveSnapshot>` i `migrate_on_load`: zero wywolan w src/. Jedyna definicja `migrate_on_load` to save_load.rs:575; wzmianki w save_load.rs:640-642 (komentarz) i war_turn_state.rs:21.
   - Wywolania `from_str::<SaveSnapshot>` sa wylacznie w testach: tests/p6_zapis_migracje_snapshot_load.rs, tests/save_load.rs (oraz pokrewne p6_*).
2. Modul `save_load` NIE jest zadeklarowany w bibliotece. `rust-port/engine/src/domain/mod.rs` nie zawiera `mod save_load` ani `mod replay`. Oba pliki sa kompilowane wylacznie przez `#[path = "../src/domain/save_load.rs"]` w testach. Komentarz w save_load.rs:642 potwierdza: "Rust nie ma dzis loadera plikow (`replay.rs` przyjmuje gotowy `SaveSnapshot`)".
3. Eksperyment (przywrocony, `git checkout`): dopisanie `pub mod save_load;` do domain/mod.rs i `cargo check --lib` nie pokazalo linii `^error`. Kodu zwrotu NIE przechwycono (grep po wyjsciu), wiec to slabszy dowod niz exit code.

DLACZEGO BLOCK / DECISION_REQUIRED:
- Kryterium 2 (test behawioralny: stary zapis przez PRODUKCYJNY loader daje stan po migracji) wymaga loadera w bibliotece. Taki loader nie istnieje, a jego dodanie wymaga:
  (a) zmiany domain/mod.rs (poza allowlista), zeby zaczac kompilowac save_load w lib;
  (b) decyzji, gdzie zyje loader i jaki ma kontrakt: funkcja domenowa `load_snapshot_json(text, era_for_owner, human_owner_ids) -> Result<(SaveSnapshot, LoadMigrationReport), _>` czy adapter pliku/Tauri. Zalezy od tego `auto_build_allowed_for_owner`.
- Kryterium 1 jest spelnione trywialnie (0 wywolan bez migracji w src/), ale bez loadera nie ma czego "wpiac".
- Dodanie loadera to nowe publiczne API produkcyjne i zmiana tego, co kompiluje sie do biblioteki. Nie wolno tego zrobic bez decyzji wlasciciela (zasada: decyzje architektoniczne i zakres -> pytanie ABC).

OPCJE DLA ORKIESTRATORA / WLASCICIELA:
A) Rekomendowana: rozszerzyc allowliste o `rust-port/engine/src/domain/mod.rs` i nowy plik loadera (np. `rust-port/engine/src/domain/save_load_loader.rs`); loader = `from_str::<SaveSnapshot>` + `migrate_on_load` + zwrot raportu; test behawioralny w `tests/p6_zapis_loader_migrate_*.rs` na starym zapisie (przyklad: 3 wodzow gracza przy era 2 -> `demoted_generals == [12]`, po wczytaniu 2 wodzow). Maly zakres, ale zmienia zbior modulow w bibliotece.
B) Zamknac temat jako dlug: loader powstanie razem z adapterem pliku/Tauri; w tym temacie tylko zapis dlugu. Bez zmian kodu.
Wybor A/B: pytanie ABC do wlasciciela. Nie wybieram sam.
EPOCH-WAR-FLAG (WIRE-EPOCH-WAR-FLAG-Q1): nie wprowadzany; nic w obecnych testach nie wymaga go do przejscia.

TESTY:
- Baseline: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=/home/user/target-zapis cargo test --test p6_zapis_migracje_snapshot_load` -> 10 passed, 0 failed, 0 ignored.
- `cargo fmt --check` (rust-port/engine) -> exit 0.
- `cargo clippy --all-targets -D warnings` -> NIE_ZMIERZONO (brak zmian kodu; nie uruchamiano).
- `cargo test --lib` -> NIE_ZMIERZONO (brak zmian kodu; nie uruchamiano).
- Test `p6_zapis_loader_migrate*` -> nie napisany (brak loadera).
- Target `/home/user/target-zapis` usuniety po bramkach; `rust-port/engine/Cargo.lock` (wygenerowany przez cargo, nieskomitowany) usuniety.

BLOKADY:
- Brak produkcyjnego loadera SaveSnapshot w bibliotece (pkt 1-2).
- Wymagana decyzja A/B i rozszerzenie allowlisty przed kodem.

RUNDY: 1/5 (Operator). Ostatni werdykt: brak (Operator nie uruchamia Evaluatora).
NASTEPNY KROK: orkiestrator: pytanie ABC do wlasciciela (A/B). Po A: nowy dispatch z rozszerzona allowlista; po B: zamknac temat z dlugiem. Evaluator nie startuje przed decyzja.
DEPLOY/PUSH: NIE WYKONANO (commit tylko lokalnie na galezi roboczej; bez push, bez integracji).
