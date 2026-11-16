# DISPATCH R-RUSTPORT-P6-K5LOOP-AUTO-WEKTORY-V1V5V6-Q1 (runda 1) — wektory pinu AUTO: V1, V5, V6 (#118, część bez blokady)

DOMENA: test wektorowy silnika oblężenia (engine). MODEL: HAIKU (Operator), Sonnet (Evaluator, FC) — reguła właściciela; nie 3D.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `75de326bc`. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
ŹRÓDŁO ZAKRESU: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1/01-rozpoznanie.md` §3 (wiersze V1, V5, V6) i §5 pkt 1.
Lokalizacje w pinie ustal przez `git grep -n "_beginAutoBatchTurnFromCurrentState\|_beginAutoBatchPhase\|_finishAutoBatchPhase\|_haltAutoBattleTurn" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek.
Moduł Rust: znajdź przez `grep -rn "auto_batch" rust-port/engine/src` (moduł K5G z testem).

## ZAKRES (tylko te trzy wektory)
- V1 `auto-batch-kolejnosc-atk-def`: zestaw 2 atakujących + 2 obrońców bez grupy, `siegeWallCol=-1` → kolejność faz wsadowych jak w pinie (`_beginAutoBatchTurnFromCurrentState` + `_beginAutoBatchPhase`).
- V5 `auto-batch-zakonczenie-tury`: `_finishAutoBatchPhase` + `_checkEnd`: atakujący wygrywa w fazie atakującego.
- V6 `auto-batch-halt-token`: `_haltAutoBattleTurn`: przerwanie w połowie fali, spóźniony callback nie zmienia stanu.
NIE ROBIĆ: V2 (doktryna #112 — nie dotykać), V7–V14 (zależą od #109/#112 lub tryb ręczny — zakres zablokowany), zmian w `ProdBody`/produkcji, zmian w `gra/`.

## WEKTORY / TESTY
- Generator w stylu istniejących (np. `rust-port/engine/tests/p6_k5doc_geometry_gen.mjs`): wykonuje tekst pinu z przechwyceniem wywołań → `rust-port/engine/tests/p6_k5loop_auto_vectors/` (NOWE: `vectors.json`, `SHA256SUMS`) i `rust-port/engine/tests/p6_k5loop_auto_gen.mjs` (NOWY).
- Test Rust: `rust-port/engine/tests/p6_k5loop_auto_v1v5v6.rs` (NOWY). Każdy wektor z `plik:linia` pinu w komentarzu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) zamiana kolejności atk/def w V1; (b) zakończenie tury bez sprawdzenia `_checkEnd` w V5; (c) halt ignorowany przy spóźnionym callbacku w V6.

## ALLOWLISTA
- `rust-port/engine/tests/p6_k5loop_auto_v1v5v6.rs` (NOWY), `rust-port/engine/tests/p6_k5loop_auto_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5loop_auto_vectors/**` (NOWE)
- `rust-port/engine/src/domain/<moduł K5G>.rs` — TYLKO jeśli trzeba dostępu do istniejącego API testowego (`pub(crate)`), bez zmiany zachowania
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-AUTO-WEKTORY-V1V5V6-Q1/**`

## KRYTERIA KOŃCA
1. V1, V5, V6 zielone; mutacje (a)(b)(c) dają FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny, w tle). Przed bramką `df -h /`; < 8 GB → BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`); NIE commituj `Cargo.lock`; NIE pushuj do parity. Raport w katalogu runu.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (unikalny); usuń po bramkach.
