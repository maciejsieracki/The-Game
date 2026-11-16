# DISPATCH R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1 (runda 1) — wektory NaN/Inf/ułamków dla amunicji i maxRounds (#137)

MODEL: HAIKU (Operator), SONNET (Evaluator, FC). Tylko testy, bez zmian w kodzie produkcyjnym.
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf`. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
ŹRÓDŁO: `dyspozycje/rust-port/p6/NAN-INF-AMUNICJA-ROZPOZNANIE.md` (na `claude/rust-sivvrn`), §5, wiersze V-A1, V-A2, V-A3, V-K2, V-K3.
Lokalizacje w pinie: `git grep -n "resolveAmmo\|Limit rund osiagniety\|Faza dystansowa" 07d2fbd72 -- gra/src/game/combat.ts`. NIE zgaduj ścieżek.

## ZAKRES
- V-A1: `ammoAtk` ∈ {NaN, +Inf, -Inf, -0, 0, 0.5, 1, 2.5} w fazie dystansowej (obrońca bez dystansu): oczekiwane strzały wg §5.
- V-A2: `ammoAtk = NaN`, `ammoDef = 3`: atakujący 0 strzałów, obrońca 3.
- V-A3: `ammoAtk = +Inf`, `maxRounds = 5`: 5 strzałów i log `Limit rund osiagniety w fazie dystansowej.`.
- V-K2: cztery jednostki z `missileAttack > 0` i amunicją `—`: 0 strzałów, nagłówek `=== Faza dystansowa ===`, flaga dystansowa `true`.
- V-K3: mutacje `>` → `>=` w limicie i `ammo > 0` → `ammo >= 0` muszą dać FAIL na V-A* i V-M*.
- NIE ROBIĆ: V-K1 (funkcje konwersji — wymagają kodu, osobny temat), V-M3 (NaN w zwarciu z hitPct = NaN — ryzyko zawieszenia, bez limitu kroków nie wolno).

## WEKTORY / TESTY
- Generator w stylu istniejących (`rust-port/engine/tests/p6_combat_harness_gen.mjs`): wykonuje pin, zapisuje `rust-port/engine/tests/p6_combat_nan_inf_vectors/` (NOWE) i `rust-port/engine/tests/p6_combat_nan_inf_gen.mjs` (NOWY).
- Test: `rust-port/engine/tests/p6_combat_nan_inf.rs` (NOWY). Każdy wektor z `plik:linia` pinu w komentarzu. Harness wymaga w Rust wartości całkowitych przez `as_i64().expect` — jeśli wektor z NaN/Inf nie da się przekazać, zapisz to jako NIE_ZMIERZONO z powodem, nie zmieniaj kodu.
- Twardy limit kroków w każdym teście (żadnego zawieszenia).

## ALLOWLISTA
- `rust-port/engine/tests/p6_combat_nan_inf*` (wszystkie NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1/**`

## BRAMKI (rust-port/engine)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie.
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_combat_nan_inf`; mutacje V-K3 z wynikami.
- df >= 8 GB przed bramką. Nie commituj Cargo.lock; bez push do parity; commit bez nazw modeli (tylko Claude-Session).
