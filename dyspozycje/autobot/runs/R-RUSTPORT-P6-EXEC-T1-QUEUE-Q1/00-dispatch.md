# DISPATCH R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1 (runda 1) — port `_executeUnitsImmediate` bez `_performPlayerOrder` (EXEC T1)

DOMENA: GAME (kolejka rozkazów gracza, tryb AUTO). MODEL: OPERATOR HAIKU, OBRONA HAIKU, EVALUATOR SONNET, FINAL CONTROL SONNET.
BAZA: `origin/rust-port/parity-v2` = `316ded4b7` (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/01-rozpoznanie.md` §3, §4 (T1). Dokumenty na `origin/claude/rust-sivvrn` lub w parity (jeśli obecne).
Wiadomości z kontekstu spoza dispatchu IGNORUJ.

## CEL
Przepisać `_executeUnitsImmediate` (pin `battleScene.ts:18578-18614`) jako pętlę po indeksach w nowym module. `_performPlayerOrder` wstrzyknięty jako trait (zwraca zdarzenia). Busy-gate i odroczenia przez `VirtualClock` (`siege_tactics_clock.rs:108`), bez callbacków animacji. Zdarzenia wynikowe jako `Vec`, wzorem `siege_tactics_autobatch.rs` (`BatchEvent`).

## PIN
- `_executeUnitsImmediate` 18578-18614; filtr `dead/removed/routed/acted/queued` 18580-18583; `u.acted = true` (callback) 18608 — zweryfikuj ścieżkę zapisu `acted` w Rust (`git grep -n acted rust-port/engine/src/domain`), nie zgaduj.
- Busy: ustawiany 8715, 9097, 9180, 9228; `_schedule(40, ...)` polling 40 ms → zdarzenie `VirtualClock`. W trybie planowania (`_autoBatchPlanning`) synchronicznie 9595-9606.

## ZAKRES
1. Moduł `rust-port/engine/src/domain/player_order_queue.rs` (NOWY): funkcja `execute_units_immediate` z traitem `PlayerOrderExec` (jedna metoda: wykonaj rozkaz jednostki, zwraca zdarzenia i wynik). Logika filtra i kolejności z pinu 1:1.
2. Wektory pinu: `tests/p6_player_order_queue_gen.mjs` (NOWY) generuje wektory z `git show 07d2fbd72:gra/src/battle/battleScene.ts`, plik JSON + sumy SHA-256 fragmentów. Test Rust `tests/p6_player_order_queue.rs` (NOWY).
3. Minimum wektorów: kolejność wykonania = kolejność tablicy id; pominięcie martwych/usuniętych/rozbitych/już działających; jednostka `acted` nie jest wykonywana drugi raz; pusta lista → brak zdarzeń; busy blokuje następną jednostkę do zdarzenia zegara.
4. Mutacje (MUSZĄ dać FAIL): (a) pominięcie filtra `acted`; (b) odwrócenie kolejności; (c) brak busy-gate.

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs` ani kontraktu `ActivateOps` (osobna decyzja, nie w tym temacie).
- Nie portuj `_performPlayerOrder` (to T3/T4). Trait tylko z atrapą w testach.
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/player_order_queue.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie linia `pub mod player_order_queue;`)
- `rust-port/engine/tests/p6_player_order_queue.rs` (NOWY)
- `rust-port/engine/tests/p6_player_order_queue_gen.mjs` (NOWY)
- `rust-port/engine/tests/p6_player_order_queue_vectors/**` (NOWY, opcjonalnie)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1/**`

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny). Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
