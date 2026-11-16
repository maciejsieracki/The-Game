# DISPATCH R-RUSTPORT-P6-K5LOOP-RUCH-FACING-Q1 (runda 1) — facing po krokach ruchu w ProdBody (#123)

MODEL: HAIKU (Operator), SONNET (Evaluator, FC). Kod produkcyjny ProdBody + test wektorowy.
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf`. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
WZORZEC: facing już zrobiony w `923540b65` (`_nearestEnemy`/`_updateFacing`/`relative_hit` w ProdBody) — użyj tej samej konwencji.
LOKALIZACJE: `git grep -n "_advanceStep\|_fallBackStep\|_cavalryAction\|_updateFacing" 07d2fbd72 -- gra/src/battle` (NIE zgaduj).

## ZAKRES
- Po każdym kroku ruchu (`_advanceStep`, `_fallBackStep`, `_cavalryAction`) zaktualizuj facing jednostki wg pinu.
- NIE ROBIĆ: efektów po ciosie (#109, morale/rout/engaged), zmian w `_updateFacing` poza wywołaniem po kroku, zmian w `gra/`.

## WEKTORY / TESTY
- Generator w stylu istniejących (`rust-port/engine/tests/p6_siege_tactics_loop_body_gen.mjs` lub najbliższy): wektory `rust-port/engine/tests/p6_k5loop_ruch_facing_vectors/` (NOWE) i generator `rust-port/engine/tests/p6_k5loop_ruch_facing_gen.mjs` (NOWY).
- Test: `rust-port/engine/tests/p6_k5loop_ruch_facing.rs` (NOWY). Każdy wektor z `plik:linia` pinu.
- Mutacja: pominięcie aktualizacji facing po kroku musi dać FAIL.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (tylko wywołanie aktualizacji facing po kroku ruchu)
- `rust-port/engine/tests/p6_k5loop_ruch_facing*` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-RUCH-FACING-Q1/**`

## BRAMKI
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie.
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5loop_ruch_facing`; `cargo test --test 'p6_siege*'`; mutacja z wynikiem.
- df >= 8 GB przed bramką. Bez Cargo.lock; bez push do parity; bez git add -A; commit bez nazw modeli.
