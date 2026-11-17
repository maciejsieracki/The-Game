# R-RUSTPORT-P4-1-R5-INTEG-R1 — integracja R5 CITY-CHIPS (plakietki miast) na parity-v2

STATUS: dispatch orkiestratora, runda integracyjna (Operator Haiku, Evaluator Sonnet, FC Sonnet).
DOMAIN: GAME? NIE — PROCESS/INFRA (merge gałęzi renderera). Gameplay bez zmian.

## GOAL
Zintegrować gałąź R5 (`56c84ea45`, R-RUSTPORT-P4-1-R5-CITY-CHIPS, FC PASS-WITH-NOTES) na `origin/rust-port/parity-v2`
i zamknąć konflikt merge w `rust-port/renderer/src/cities/mod.rs`. Parity-v2 jest już po R6 (`2edc808d7`),
Q5, R1, R3, R2 (`ba7f3734a`). Wynik: `parity-v2` z R5 wchodzi FF, bramka renderera zielona.

## BAZA (absolutny priorytet)
- Baza: `origin/rust-port/parity-v2` = `ba7f3734a`.
- Worktree: `git worktree add --detach <ścieżka> ba7f3734a` (świeży, nie reużywać).
- Źródło: `git merge --no-ff 56c84ea45`.

## ROZSTRZYGNIĘCIE KONFLIKTU (orkiestrator, wykonawca NIE wybiera)
- Konflikt: `rust-port/renderer/src/cities/mod.rs`. Obie strony dopisują deklaracje modułów/reeksporty.
- Reguła: ZACHOWAĆ OBIE strony (unia). Kolejność: linie parity (R6) przed liniami R5 albo odwrotnie,
  byle bez duplikatów i bez usunięcia jakiejkolwiek linii z parity.
- Pliki R5 spoza konfliktu wchodzą bez zmian: `cities/sync/mod.rs`, `cities/sync/stat_chips.rs`,
  `tests/cities_sync_stat_chips.rs`, `tests/fixtures/cities_sync/cities.json`.
- Zakaz: nie zmieniać logiki `stat_chips.rs` ani testów R5. Nie zmieniać tekstu R6.

## ALLOWLISTA
Wyłącznie: `rust-port/renderer/src/cities/mod.rs` (rozwiązanie konfliktu) oraz pliki wchodzące z merge R5
(wymienione wyżej) i katalog `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R5-INTEG-R1/`. Nic innego.

## BRAMKI (wszystkie muszą dać EXIT 0)
Katalog: `rust-port/renderer`. Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` POZA repo (usuń po bramkach).
1. `cargo fmt --check`
2. `cargo clippy --all-targets -- -D warnings`
3. `cargo test --test cities_sync_stat_chips`
4. `cargo test --all-targets --no-fail-fast` (timeout 1700 s)
Raport z kodami wyjścia i liczbą `test result: ok` oraz zerem FAILED/panicked.

## DYSK
≥ 8 GB przed startem (`df -h /`). Przy < 8 GB: BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
1. Merge `56c84ea45` w worktree bez markerów konfliktu; diff względem `ba7f3734a` tylko w allowliście.
2. Wszystkie 4 bramki EXIT 0.
3. Commit merge z komunikatem bez nazwy modelu (#289). Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`.
4. Raport `01-operator-r1.md` w tym katalogu: SHA merge, diff --stat, wyniki bramek.

## NIE WOLNO
- Nie pushować do `rust-port/parity-v2` (FF robi orkiestrator po FC).
- Nie `git add -A`, nie `npm run build` w `gra/`.
- Nie obchodzić bramki, nie wyłączać testów.
