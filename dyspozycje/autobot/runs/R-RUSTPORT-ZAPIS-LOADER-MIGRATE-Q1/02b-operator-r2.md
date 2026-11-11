STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1 (pozycja 6 REJESTR-RUST), Operator runda 2 (wariant A)
GOAL: Produkcyjny loader zapisu (SaveSnapshot z tekstu) zawsze wola migrate_on_load i zwraca raport migracji; test behawioralny przez loader.
BAZA: origin/rust-port/parity-v2 = f207ea6b1 (detached); galaz robocza wip/R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1-operator-r2; NIE pushowano, NIE integrowano.
ZMIANY/COMMIT: kod = 75c390866 (commit bezposrednio na f207ea6b1).
  - rust-port/engine/src/domain/mod.rs: pub mod replay / save_load / zapis_loader (3 x [#[cfg(not(test))] + pub mod]).
  - rust-port/engine/src/domain/zapis_loader.rs (NOWY): LoadError { Json(serde_json::Error) }; load_save_snapshot(text, era_for_owner) -> Result<(SaveSnapshot, LoadMigrationReport), LoadError>.
  - rust-port/engine/src/domain/replay.rs: 2 linie, #[allow(clippy::should_implement_trait)] na ReplayPlayback::next (publiczne API kursora, zmiana nazwy odrzucona).
  - rust-port/engine/tests/p6_zapis_loader_migrate.rs (NOWY): 4 testy.
  - save_load.rs: BEZ zmian.
  - Cargo.lock: wygenerowany przez cargo, NIE commitowany (untracked).
KROK 0 (cargo check --lib po dopisaniu pub mod save_load; pub mod replay;): EXIT=0.
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR=/home/user/target-zapis):
  - cargo fmt --check: EXIT=0
  - cargo clippy --all-targets -- -D warnings: EXIT=0
  - cargo test --lib: EXIT=0, 28 passed, 0 failed
  - cargo test --test p6_zapis_loader_migrate --test p6_zapis_migracje_snapshot_load: EXIT=0; p6_zapis_loader_migrate 4 passed; p6_zapis_migracje_snapshot_load 10 passed
  - Kryterium 1: git grep "from_str::<SaveSnapshot>" w rust-port/engine/src -> jedyne trafienie to komentarz doc w save_load.rs:640; 0 wywolan bez migracji.
  - Kryterium 2 (behawioralne): p6_zapis_loader_migrates_old_save_through_production_path: zapis z 4 wodzami (przed migracja) -> load_save_snapshot(era 2) -> demoted [12], generals [10,11,20], 4 jednostki; kontrola surowym from_str zachowuje 4 wodzow.
  - Test idempotencji (drugi odczyt, raport pusty), test epoki per wlasciciel (era 1 gracz / era 3 obcy -> demoted [11,12]), test bledu JSON bez paniki.
  - Brak #[ignore], brak oslabionych asercji.
BLOKADY / ODCHYLENIA OD DISPATCHU (do oceny Evaluatora):
  1. Sygnatura: dispatch podaje load_save_snapshot(text). Dodano parametr era_for_owner: impl Fn(PlayerId) -> f64, bo migrate_on_load wymaga epoki wlasciciela, a silnik nie ma zrodla epok. Stala (np. 1.0) cicho degradowalaby wodzow. Decyzja dla orkiestratora: skad ma pochodzic era w produkcji (wywolujacy).
  2. Typ raportu: w kodzie nazywa sie LoadMigrationReport (save_migrations.rs), nie MigrationReport.
  3. DLUG: save_load.rs i replay.rs maja podwojny import (cfg(not(test)) dla lib, cfg(test) z civ_engine:: dla fixture #[path]). Build lib-test nie rozwiazuje galezi civ_engine::, wiec bez cfg(not(test)) na 3 liniach mod.rs `cargo test --lib` i clippy --all-targets padaja (E0432/E0433). Skutek: lib unit testy NIE kompiluja save_load/replay/zapis_loader; pokrywa je tylko tests/. Do usuniecia przy porzadku w fixture.
  4. Brak zmian w logice save_load.rs; WIRE-EPOCH-WAR-FLAG-Q1 nie dodawany (testy przeszly bez niego).
  5. Brak produkcyjnych wolajacych loadera poza samym loaderem: w silniku nie ma innej sciezki wczytania zapisu z tekstu; replay.rs przyjmuje gotowy SaveSnapshot. Wpiecie w warstwe wyzsza poza zakresem.
RUNDY: 2/5 (Operator r2)
NASTEPNY KROK: Evaluator (Sonnet) na commicie 75c390866, z uwzglednieniem punktow 1-3 powyzej.
DEPLOY/PUSH: NIE WYKONANO (brak push; zadnych zmian w gra/, origin/main, WERSJE.md, Cargo.toml, Cargo.lock).
