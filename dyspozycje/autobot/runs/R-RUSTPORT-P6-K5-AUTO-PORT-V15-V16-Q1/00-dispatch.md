# DISPATCH R-RUSTPORT-P6-K5-AUTO-PORT-V15-V16-Q1 (runda 1) — port `_executeQueuedOrders` (V15) i `_ffEnterAuto` (V16) — K5-AUTO, blokada z #118

DOMENA: GAME (bitwa oblężnicza, tryb AUTO i odłożone dyspozycje). MODEL: HAIKU (Operator), SONNET (Evaluator, Final Control), HAIKU (Obrona) — silnik gry, reguła projektu.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `9f1a29af3` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: raport `R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1` (FC PASS-WITH-NOTES `9a79cc1e3`, notatka 2 i 7: V15 i V16 to blokady portu). Dispatch #118 nie mógł zmieniać `src/`; ten temat jest osobnym portem.
Kod: `rust-port/engine/src/domain/siege_tactics_turnseq.rs` (pole `queued_order_ids: BTreeSet<u64>`, ok. `:98`, `:146`), `rust-port/engine/src/domain/siege_tactics_loop.rs` (`FfEvent::EnterAuto` → `halt_unsupported`, ok. `:698-702`).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## PIN (wartości do odtworzenia)
- **V15 `_executeQueuedOrders`** (`gra/src/battle/battleScene.ts:3603-3611`): jeśli zbiór odłożonych jednostek pusty → komunikat, koniec. W przeciwnym razie `ids = [...this._queuedOrderUnitIds]` (**kolejność wstawienia**), `clear()`, `_executeUnitsImmediate(ids)`, komunikat „Wykonano N dyspozycji”.
- **V16 `_ffEnterAuto`** (`battleScene.ts:3709-3712`): jeśli `_manualMode` → `_toggleManualMode()`; jeśli `_battleAwaitingOrders` → `_kickoffBattleTurn()`.

## ZAKRES
1. **V15:** zmień kontener `queued_order_ids` z `BTreeSet<u64>` na strukturę zachowującą kolejność wstawienia (np. `Vec<u64>` z deduplikacją przy wstawianiu, zgodnie z semantyką `Set` JS: ponowne dodanie istniejącego id NIE zmienia jego pozycji). Port `_executeQueuedOrders` jako funkcja: zwraca listę id w kolejności wstawienia i czyści kolejkę; wywołanie `_executeUnitsImmediate` MUSI mieć istniejący port w `src/` — jeśli nie ma, zatrzymaj ten punkt i zapisz **BLOCK** z `grep` jako dowodem (nie portuj `_executeUnitsImmediate` w tym temacie).
2. **V16:** zastąp `halt_unsupported` dla `FfEvent::EnterAuto` portem `_ffEnterAuto`: stan ręcznego trybu i oczekiwania na rozkazy zgodnie z pinem; `_kickoffBattleTurn` wykonaj tylko jeśli istnieje port w `src/`, w przeciwnym razie BLOCK z dowodem.
3. Wektory: wynik 1:1 względem pinu (plik:linia każdej wartości). Co najmniej: kolejność wstawienia `[3,1,2]` → `[3,1,2]` (nie `[1,2,3]`); ponowne dodanie `1` nie zmienia pozycji; pusta kolejka → brak wykonania; `EnterAuto` przy `manual=true` przełącza tryb; `EnterAuto` przy `awaiting=true` startuje turę.

## KRYTERIA KOŃCA
1. Port V15 i V16 zrealizowany lub BLOCK z dowodem dla każdego punktu osobno; wektory zielone; mutacje FAIL (np. `BTreeSet` zamiast kolejności wstawienia; pominięcie `_kickoffBattleTurn`) — wyniki w raporcie.
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny test; wymagane ≥8 GB wolnego, inaczej NIE_ZMIERZONO z zatrzymaniem).
3. Brak `#[ignore]`, brak osłabionych asercji. Zmiana `queued_order_ids` musi zaktualizować istniejące testy (`tests/p6_siege_tactics_turnseq.rs`, `tests/p6_siege_tactics_loop.rs`) do zachowania kolejności — NIE usuwać asercji, tylko je dopasować do pinu.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_turnseq.rs`
- `rust-port/engine/src/domain/siege_tactics_loop.rs`
- `rust-port/engine/tests/p6_siege_tactics_turnseq.rs`
- `rust-port/engine/tests/p6_siege_tactics_loop.rs`
- `rust-port/engine/tests/p6_k5_port_v15_v16*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-PORT-V15-V16-Q1/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
