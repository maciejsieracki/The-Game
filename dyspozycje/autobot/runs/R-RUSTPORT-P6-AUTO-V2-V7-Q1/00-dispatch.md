# DISPATCH R-RUSTPORT-P6-AUTO-V2-V7-Q1 (runda 1) — wektory pinu AUTO: V2 (migawka planowania) i V7 (doktryna steady bez oblężenia) (#296, część)

MODEL: HAIKU (Operator), SONNET (Evaluator, FC). Tylko testy wektorowe, bez zmian w kodzie produkcyjnym.
BAZA: `origin/rust-port/parity-v2` = `d66aaa3a7` (zawiera V1/V5/V6 i #112 doktrynę). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
ŹRÓDŁO ZAKRESU: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1/01-rozpoznanie.md` §3, wiersze V2 i V7 (V2: `_snapshotAutoBatchIntents`; V7: `_executeGroupDoctrineStep` steady, cel dwóch kolumn).
Lokalizacje w pinie: `git grep -n "_snapshotAutoBatchIntents\|_executeGroupDoctrineStep" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek.

## ZAKRES
- V2 `auto-batch-migawka-planowania`: zestaw 2 atakujących + 2 obrońców bez grupy, plan kroków z klonów; oczekiwany plan z pinu.
- V7 `auto-doktryna-steady-bez-oblezenia`: jednostka grupy `steady`, bez strzelca; krok doktryny i wybór celu wg pinu.
- NIE ROBIĆ: V8–V14 (zależą od #148, #109, #107 i trybu ręcznego), zmian w `rust-port/engine/src/domain/`, zmian w `gra/`.

## WEKTORY / TESTY
- Generator w stylu `p6_k5loop_auto_gen.mjs`: wykonuje ciała z pinu z przechwyceniem → `rust-port/engine/tests/p6_k5loop_auto_v2v7_vectors/` (NOWE) i `rust-port/engine/tests/p6_k5loop_auto_v2v7_gen.mjs` (NOWY).
- Test: `rust-port/engine/tests/p6_k5loop_auto_v2v7.rs` (NOWY). Każdy wektor z `plik:linia` pinu w komentarzu.
- Asercje po wyniku/liście przekazanej do funkcji (nie po stanie wejściowym), żeby mutacje były czułe.
- Mutacje (MUSZĄ dać FAIL): (a) V2 plan bez klonów (błąd kolejności kroków); (b) V7 steady bez wyboru celu dwóch kolumn.

## ALLOWLISTA
- `rust-port/engine/tests/p6_k5loop_auto_v2v7*.rs`, `rust-port/engine/tests/p6_k5loop_auto_v2v7_gen.mjs`, `rust-port/engine/tests/p6_k5loop_auto_v2v7_vectors/**` (wszystkie NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-V2-V7-Q1/**`

## BRAMKI (rust-port/engine)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (unikalny).
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5loop_auto_v2v7`; mutacje (a) i (b).
- df >= 8 GB przed bramką. Nie commituj Cargo.lock; bez push do parity; bez git add -A; commit bez nazw modeli (tylko Claude-Session).
