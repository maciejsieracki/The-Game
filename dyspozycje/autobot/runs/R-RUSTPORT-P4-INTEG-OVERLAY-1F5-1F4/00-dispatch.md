# DISPATCH R-RUSTPORT-P4-INTEG-OVERLAY-1F5-1F4 (runda 1) — integracja nakładek 1F5 + 1F4 na parity (PRIO-3D-4/5)

MODEL: OPUS (temat 3D, nakładki; reguła właściciela dla tematów 3D).
BAZA: `origin/rust-port/parity-v2` = `9f7c55499` (zawiera I2 i I3). Worktree detached.
ŹRÓDŁA: FC 1F5 = `63b4f0dd8` (R-RUSTPORT-P4-1F5-REACH-PATH-VIEW, PASS-WITH-NOTES); FC 1F4 = `1724516c2` (R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW, PASS-WITH-NOTES).

## ZAKRES
1. `git merge --no-ff 63b4f0dd8`, potem `git merge --no-ff 1724516c2`.
2. Konflikt w `rust-port/engine/src/domain/overlays_view.rs` (oba tematy tworzą plik od zera; baza ma już plik z P4-1F6): zachować WSZYSTKIE funkcje, struktury i testy obu stron; bez zmiany semantyki.
3. `rust-port/engine/src/domain/mod.rs`: zachować wszystkie linie `pub mod`.

## BRAMKI (rust-port/engine)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo.
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; PEŁNY `cargo test --all-targets --no-fail-fast` w tle (setsid nohup, odpytywanie logu).
- Wymóg: >= 8 GB wolnego przed bramką.

## ALLOWLISTA
- `rust-port/engine/src/domain/overlays_view.rs`
- `rust-port/engine/src/domain/mod.rs` (tylko `pub mod`)
- pliki testów obu tematów
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-INTEG-OVERLAY-1F5-1F4/**`

## KRYTERIA KOŃCA
- Bramki zielone; utrata funkcji z którejkolwiek strony = FAIL; brak `#[ignore]`; brak push do parity.
- Raport zawiera SHA końcowego merge, kody wyjścia bramek i sumy `test result`.
- Orkiestrator robi FF na parity po zielonych bramkach i FC.
