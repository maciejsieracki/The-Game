# DISPATCH — R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1 (pozycja 6 REJESTR-RUST, runda 1/5, Operator)
Orkiestrator: czat RUST (gałąź `claude/rust-sivvrn`). Dispatch zapisany PRZED Workflow.

## Baza
- `origin/rust-port/parity-v2` = `a4087f332`. Worktree: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`.
- Nie zależy od W6 (inne pliki).

## Problem (zmierzony)
- `rust-port/engine/src/domain/save_load.rs:575` — `SaveSnapshot::migrate_on_load(...)` istnieje i jest pokryty testami (`tests/p6_zapis_migracje_snapshot_load.rs`).
- Komentarz `save_load.rs:640`: po `serde_json::from_str::<SaveSnapshot>` MUSI wywołać `migrate_on_load`.
- Brak wołającego w produkcyjnym loaderze zapisu: migracja działa tylko w testach. Zmierz: `git grep -n "from_str::<SaveSnapshot>\|migrate_on_load" origin/rust-port/parity-v2 -- rust-port/engine/src`.

## GOAL
Wpiąć produkcyjny loader zapisu (ten, który deserializuje `SaveSnapshot` z pliku/tekstu) tak, aby zawsze wołał `migrate_on_load` i zwracał/zapisywał raport migracji. Dodać EPOCH-WAR-FLAG (`WIRE-EPOCH-WAR-FLAG-Q1`) tylko jeśli jest to konieczne do przejścia testu — w przeciwnym razie zapisać jako dług.

## Kryteria końca (binarne)
1. Każda ścieżka produkcyjna ładowania `SaveSnapshot` wywołuje `migrate_on_load` (grep pokazuje 0 wywołań `from_str::<SaveSnapshot>` bez migracji w `src/`).
2. Test BEHAWIORALNY: zapis w starej wersji (przed migracją) wczytany produkcyjnym loaderem daje stan po migracji (nie tylko wywołanie funkcji).
3. Brak zmian poza allowlistą; brak `#[ignore]`; brak osłabionych asercji.
4. Bramki zielone albo NIE_ZMIERZONO uczciwie.

## Allowlista (naruszenie = FAIL)
- `rust-port/engine/src/domain/save_load.rs` (tylko podpięcie / dokumentacja)
- plik(i) produkcyjnego loadera zapisu w `rust-port/engine/src/**` (zidentyfikowany grepem; wymień go w raporcie)
- `rust-port/engine/tests/p6_zapis_loader_migrate*.rs` (nowy)
- `dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1/**`
- ZAKAZ: `gra/**`, `origin/main`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock` (nie commitować), `REJESTR-PROSB-I-ZADAN.md`.

## Bramki
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_zapis_loader_migrate* --test p6_zapis_migracje_snapshot_load`.
Zmienne: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; `CARGO_TARGET_DIR` POZA repo (`/home/user/target-zapis`), usuń po bramkach.

## Format raportu
STATUS / DOMAIN: GAME / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY: 1/5 / NASTĘPNY KROK: Evaluator / DEPLOY-PUSH: NIE WYKONANO. Raport `01-operator-r1.md` w run dir, commit na gałęzi roboczej.
