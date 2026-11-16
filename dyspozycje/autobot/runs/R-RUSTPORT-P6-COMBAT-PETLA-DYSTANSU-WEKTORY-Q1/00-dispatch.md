# DISPATCH R-RUSTPORT-P6-COMBAT-PETLA-DYSTANSU-WEKTORY-Q1 (runda 1) — wektory pinu pętli dystansu resolveCombat (#100, #169)

DOMENA: test wektorowy walki (engine). MODEL: HAIKU (Operator), SONNET (Evaluator, FC). Nie 3D.
BAZA: `origin/rust-port/parity-v2` = `3a8f068f6`. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Odblokowany: decyzja DYSTANS (#10) zakończona; port pętli dystansu do `ranged_phase::resolve_ranged_phase` (#136) zintegrowany.
Pin: `gra/src/game/combat.ts` — `resolveCombat` (linia ~842), `resolveAmmo` (~784). Lokalizacje potwierdź przez `git grep -n "resolveCombat\|resolveAmmo" 07d2fbd72 -- gra/src/game/combat.ts`.
Rust: `rust-port/engine/src/domain/combat.rs` — `pub mod ranged_phase` (~1061), `resolve_ranged_phase` (~1136).

## ZAKRES
- Wektory pinu dla PĘTLI DYSTANSU (faza strzelecka przed zwarciem): kolejność strzałów, liczba rund, sufit `maxRounds`, zużycie amunicji przez `resolveAmmo`, warunek zakończenia fazy.
- NIE ROBIĆ: faza zwarcia (osobny temat #134/#135), NaN/Inf w amunicji (#137 — rozpoznanie w toku), zmian w produkcyjnym kodzie walki.

## WEKTORY / TESTY
- Generator w stylu istniejących (`rust-port/engine/tests/p6_k5doc_geometry_gen.mjs`): wykonuje pin przez przechwycenie, zapisuje `rust-port/engine/tests/p6_combat_ranged_vectors/vectors.json` (NOWE) i `rust-port/engine/tests/p6_combat_ranged_gen.mjs` (NOWY).
- Test: `rust-port/engine/tests/p6_combat_ranged_petla.rs` (NOWY). Każdy wektor z `plik:linia` pinu w komentarzu.
- Mutacje (MUSZĄ dać FAIL): (a) sufit rund pominięty; (b) amunicja nie odejmowana po strzale; (c) kolejność strzelców odwrócona.

## ALLOWLISTA
- `rust-port/engine/tests/p6_combat_ranged_petla.rs`, `rust-port/engine/tests/p6_combat_ranged_gen.mjs`, `rust-port/engine/tests/p6_combat_ranged_vectors/**` (wszystkie NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-PETLA-DYSTANSU-WEKTORY-Q1/**`

## KRYTERIA KOŃCA
1. Wektory zielone; mutacje a/b/c dają FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: fmt, clippy `-D warnings`, PEŁNY `cargo test --all-targets --no-fail-fast` w tle. df >= 8 GB przed bramką.
3. Brak `#[ignore]`, brak osłabionych asercji; zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`); bez Cargo.lock; bez push do parity.
