# DISPATCH R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1 (runda 1) — zadanie #111 / #143

TEMAT: pokrycie łuczników w teście blow_full: asercja lucznik>=14 oraz generator z gałęzią łuczników.
DOMENA: GAME (testy). Baza: `cfa1edd31`. Worktree na `wip/R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/combat.ts` i `battleScene.ts` — gałąź łuczników.

## KROK 0 (obowiązkowy, zatrzymuje temat jeśli już działa)
Uruchom `cargo test --test p6_siege_tactics_blow_full` na `cfa1edd31`. Jeśli asercja `lucznik>=14` PRZECHODZI i generator daje ≥14 łuczników — STATUS PASS bez zmian w kodzie, wypisz liczby. Jeśli NIE — przejdź dalej.

## GOAL
Generator `p6_siege_tactics_blow_full_gen.mjs` obejmuje gałąź łuczników z pinu, wektory `p6_siege_tactics_blow_full_vectors/vectors.json` regenerowane bajt-w-bajt, asercja `lucznik >= 14` w `p6_siege_tactics_blow_full.rs` przechodzi na wektorach z pinu.

## ALLOWLISTA
- `rust-port/engine/tests/p6_siege_tactics_blow_full_gen.mjs`
- `rust-port/engine/tests/p6_siege_tactics_blow_full_vectors/vectors.json`
- `rust-port/engine/tests/p6_siege_tactics_blow_full.rs` (tylko asercja pokrycia; nie zmieniać asercji wartości ani wektorów poza regeneracją)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1/01-operator-r1.md`
ZAKAZ: `src/**`, `gra/`, `Cargo.toml`, `Cargo.lock`, osłabianie asercji.

## KRYTERIA KOŃCA
1. Generator odtwarza vectors.json bajt-w-bajt; strażnik SHA-256 zgodny.
2. Asercja `lucznik >= 14` przechodzi (zmierzone liczniki w raporcie).
3. Bramki EXIT 0: fmt, clippy `-D warnings`, `cargo test --lib`, `p6_siege_tactics_blow_full`, pełny `cargo test --no-fail-fast` z liczbami. `CARGO_TARGET_DIR` poza repo.
4. Brak `#[ignore]`, brak osłabionych asercji.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
