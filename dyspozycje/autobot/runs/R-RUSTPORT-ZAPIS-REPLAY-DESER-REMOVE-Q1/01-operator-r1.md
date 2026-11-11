STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1 (poz. 6, wariant B; etap 1/4 Operator, runda 1/5)
GOAL: usunąć derive/impl Deserialize z ReplayLog i ReplayStep; jedyna ścieżka wczytania replayu z JSON to ReplayLog::load_json_with_migration_reports (z migracją snapshotów i raportem).
BAZA: origin/rust-port/parity-v2 = ca25d6fd2 (worktree detach). Gałąź robocza: R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1-wip/operator-r1. Nie pushowano, nie integrowano.
ZMIANY/COMMIT: daacaa9af08462d7a3e34845040ccb355eaee0d6 (kod); commit raportu i 00-dispatch.md następny na tej samej gałęzi.
  - rust-port/engine/src/domain/replay.rs: usunięto `impl Deserialize` dla ReplayStep i ReplayLog oraz struct ReplayWire (martwy po usunięciu impl). Zostają ReplayStepWire i ReplayRawWire (prywatne typy wire, używane wyłącznie przez load_json_with_migration_reports). Usunięto import Deserializer. Zaktualizowano komentarze.
  - rust-port/engine/tests/replay.rs: wczytania przepięte na lokalny helper load_replay(), który woła load_json_with_migration_reports (bez raportu). Asercje i komunikaty błędów bez zmian.
  - rust-port/engine/tests/p6_zapis_replay_migrate.rs: wszystkie 3 wczytania serde_json::from_str przepięte na load_json_with_migration_reports; komentarz o "zwykłym Deserialize" zaktualizowany.
  - Nie dotykano: gra/**, WERSJE.md, Cargo.toml, Cargo.lock (untracked, nie commitowany), save_load.rs, inne pliki domain/.
TESTY:
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: EXIT 0, 28 passed, 0 failed
  - cargo test --test replay --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate: EXIT 0; p6_zapis_loader_migrate 4 passed, p6_zapis_replay_migrate 6 passed, replay 6 passed
  - Środowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (w scratchpad).
DOWÓD GOAL:
  - GOAL 1: `grep -n Deserial rust-port/engine/src/domain/replay.rs` zwraca wyłącznie derive na ReplayStepWire (l.48) i ReplayRawWire (l.170) oraz `de::DeserializeOwned` w load_json. Brak impl Deserialize dla ReplayLog/ReplayStep. Brak wywołań ReplayLog/ReplayStep z serde_json::from_str w rust-port/ poza load_json_with_migration_reports.
  - GOAL 2: wszystkie wejścia replayu w tests/replay.rs i tests/p6_zapis_replay_migrate.rs idą przez load_json_with_migration_reports. Grep po ReplayLog/ReplayStep/ReplayFrame w rust-port/ nie pokazuje innych wejść z JSON.
  - GOAL 3: testy zielone (powyżej).
  - GOAL 4 (behawioralny brak wczytania bez migracji): realizowane na poziomie kompilacji. ReplayLog<I> i ReplayStep<I> nie implementują Deserialize, więc `serde_json::from_str::<ReplayLog<_>>(..)` się nie kompiluje; jedyna ścieżka to load_json_with_migration_reports, które zawsze wykonuje migrate_on_load i zwraca raport (asercje w p6_zapis_replay_migrate). NIE_ZMIERZONO: test compile-fail (trybuild) nie został dodany, bo wymagałby zmiany Cargo.toml (poza allowlistą).
BLOKADY: brak. Uwaga: w bazie nie było katalogu dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1; 00-dispatch.md skopiowano z origin/claude/rust-sivvrn.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) na gałęzi R-RUSTPORT-ZAPIS-REPLAY-DESER-REMOVE-Q1-wip/operator-r1, następnie Final Control; integracja wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
