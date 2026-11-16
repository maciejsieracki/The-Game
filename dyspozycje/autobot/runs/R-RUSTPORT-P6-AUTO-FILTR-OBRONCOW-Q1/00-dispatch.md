# DISPATCH R-RUSTPORT-P6-AUTO-FILTR-OBRONCOW-Q1 (runda 1) — test czułości filtra obrońców w finish_auto_batch_phase (#311, zarzut FC #118)

MODEL: HAIKU (Operator), SONNET (Evaluator, FC). Test, bez zmiany kodu produkcyjnego.
BAZA: FC `6cda54727` (zawiera wektory V1/V5/V6 i generator `rust-port/engine/tests/p6_k5loop_auto_gen.mjs`). Worktree detached z tej bazy. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).

## PROBLEM
Mutacja (d) przeżyła: usunięcie filtra `acted/fading/removed` przy budowie listy obrońców w `finish_auto_batch_phase` (pin `battleScene.ts:5964`) nie daje FAIL, bo `begin_phase_calls.ids` jest liczone z `st.resolutions`, a nie z listy przekazanej do `begin_auto_batch_phase`.

## ZAKRES
1. W `VecEnv::plan_unit` (generator / test Rust) zapisz `unit_id` przekazany do `begin_auto_batch_phase`.
2. Asercję w teście V5 zrób po tej liście, nie po `st.resolutions`.
3. Potwierdź: mutacja (d) (usunięcie filtra) daje teraz FAIL; mutacje (a)(b)(c) z dispatchu V1/V5/V6 nadal dają FAIL.
4. NIE zmieniaj kodu w `rust-port/engine/src/domain/` ani `gra/`.

## ALLOWLISTA
- `rust-port/engine/tests/p6_k5loop_auto_v1v5v6.rs`, `rust-port/engine/tests/p6_k5loop_auto_gen.mjs`, `rust-port/engine/tests/p6_k5loop_auto_vectors/**`
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-FILTR-OBRONCOW-Q1/**`

## BRAMKI (rust-port/engine)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie.
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5loop_auto_v1v5v6`; mutacje (a)(b)(c)(d) z wynikami w raporcie.
- df >= 8 GB przed bramką. Nie commituj Cargo.lock; bez push do parity; commit bez nazw modeli w wiadomości.

## DODATEK r2 — integracja na parity (BAZA: origin/rust-port/parity-v2 = d66aaa3a7)
- Wynik FC: commit `597bdcd8a` (rodzic FC 6cda54727), zmiana wyłącznie w `rust-port/engine/tests/p6_k5loop_auto_v1v5v6.rs`. Mutacja (d) daje teraz FAIL.
- Merge-tree 597bdcd8a -> d66aaa3a7: CZYSTY.
- Zadanie: worktree detached z d66aaa3a7, `git merge --no-ff 597bdcd8a`, pełne bramki w rust-port/engine (fmt --check, clippy -D warnings, pełny cargo test --all-targets w tle, setsid nohup). df >= 8 GB przed bramką.
- Nie pushuj do parity. Nie commituj Cargo.lock. Bez git add -A. Commit bez nazw modeli w wiadomości.
- Zwróć SHA merge, EXIT bramek, sumy test result, verdict PASS albo FAIL/BLOCK.
