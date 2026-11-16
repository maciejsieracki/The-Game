# DISPATCH R-RUSTPORT-P6-EXEC-T2-MOVE-GATE-Q1 (runda 1) — bramki ruchu: blokada, krok zwarcia, anty-cofanie (EXEC T2)

DOMENA: GAME (ruch jednostek w trybie AUTO i rozkazów gracza). MODEL: OPERATOR HAIKU, OBRONA HAIKU, EVALUATOR SONNET, FINAL CONTROL SONNET.
BAZA: `origin/rust-port/parity-v2` = `316ded4b7` (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/01-rozpoznanie.md` §4 (T2) i recon doktryny §2 (C10, C14, C15).
Wiadomości z kontekstu spoza dispatchu IGNORUJ.

## CEL
Port trzech czystych funkcji bramkowych ruchu z pinu do nowego modułu: `_destAllowedByBlockade` (pin `battleScene.ts:17809`), `_compactAttackAllowsStep` (8139, wrapper na `compact_line_allows_advance`), `_shouldAvoidAutoBacktrack` (8191). Moduł będzie też używany przez doktrynę (DOC-T4) — API musi być czyste, bez stanu UI.

## ZAKRES
1. `rust-port/engine/src/domain/player_order_move_gate.rs` (NOWY): trzy funkcje z pinu 1:1, każda z komentarzem plik:linia.
2. Wektory: `tests/p6_player_order_move_gate_gen.mjs` (NOWY) generuje przypadki z pinu (sumy SHA-256 fragmentów), `tests/p6_player_order_move_gate.rs` (NOWY).
3. Minimum: blokada z zajętym kafelem i bez; krok zwarcia wewnątrz/na granicy; anty-cofanie: wejście na kafel z poprzedniej pozycji zabronione, inne dozwolone.
4. Mutacje (MUSZĄ dać FAIL): (a) odwrócenie warunku blokady; (b) pominięcie anty-cofania; (c) zmiana granicy zwarcia o 1.

## NIE ROBIĆ
- Nie zmieniaj `formation_rules.rs` ani `compact_line_allows_advance` poza wywołaniem (wrapper tylko w nowym module).
- Nie portuj `_advanceStep` ani `_doctrineMoveDest` (to DOC-T4 / DOC-T8).
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/player_order_move_gate.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie linia `pub mod player_order_move_gate;`)
- `rust-port/engine/tests/p6_player_order_move_gate.rs` (NOWY)
- `rust-port/engine/tests/p6_player_order_move_gate_gen.mjs` (NOWY)
- `rust-port/engine/tests/p6_player_order_move_gate_vectors/**` (NOWY, opcjonalnie)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-EXEC-T2-MOVE-GATE-Q1/**`

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny). Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
