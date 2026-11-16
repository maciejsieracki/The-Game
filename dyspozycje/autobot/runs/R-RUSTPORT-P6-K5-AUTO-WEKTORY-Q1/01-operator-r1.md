STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1
GOAL: wektory pinu 07d2fbd72 dla AUTO bez oblężenia: V5 (_finishAutoBatchPhase), V6 (_haltAutoBattleTurn), V15 (_executeQueuedOrders), V16 (_ffEnterAuto).
ZMIANY/COMMIT: nowy plik rust-port/engine/tests/p6_k5_auto_vectors.rs (8 testów: V5a-V5e, V6a-V6c); zero zmian w src/ w wyniku (mutacja testowa w src/domain/siege_tactics_autobatch.rs wykonana i cofnięta `git checkout`). Commit kodu i raportu: SHA w sekcji "COMMIT" poniżej. Cargo.lock nie commitowany.
BAZA: origin/rust-port/parity-v2 = b3c0b2209 (worktree detached). Pin: 07d2fbd72.

## Wyniki wektorów

| Wektor | Pin (plik:linia) | Port Rust | Wynik |
|---|---|---|---|
| V5 `_finishAutoBatchPhase` | battleScene.ts:5961-5973; TURN_GAP_MS=240 (:1023) | siege_tactics_autobatch.rs:727 `finish_auto_batch_phase`; filtr obrońców `alive_power && !acted` (alive_power = !dead && !fadingOut && !removed, siege_tactics_unit.rs:57) jest równoważny pinowemu `!dead && !fadingOut && !removed && !acted` | ZIELONY: V5a (przejście atk->def, filtr fadingOut), V5b (koniec def: phase=null, pending=0, Schedule 240 BeginTurn), V5c (checkEnd=true wychodzi przed przejściem), V5d (stary token: brak efektów), V5e (manualMode: brak efektów) |
| V6 `_haltAutoBattleTurn` | battleScene.ts:17333-17344 | siege_tactics_autobatch.rs:765 `halt_auto_battle_turn` | ZIELONY: V6a (zegar wyczyszczony, token+1, faza/rozstrzygnięcia/pending zerowane, awaiting=true, suspended), V6b (spóźniony FinishPhase ze starym tokenem nic nie zmienia), V6c (suspendInFlight=false nie zawiesza) |
| V15 `_executeQueuedOrders` | battleScene.ts:3603-3611 (kolejka `[...this._queuedOrderUnitIds]` w kolejności wstawienia, potem `_executeUnitsImmediate(ids)`) | BRAK ODPOWIEDNIKA. Brak funkcji `execute_queued_orders` / `execute_units_immediate` w rust-port/engine/src (grep: zero trafień). W porcie jest tylko pole `queued_order_ids: BTreeSet<u64>` (siege_tactics_turnseq.rs:98), które służy wyłącznie do usuwania wpisów; BTreeSet porządkuje po id rosnąco, a pin iteruje po kolejności wstawienia (JS Set), więc nawet to pole nie odtwarza kolejności pinu. | BLOCK (brak portu). Nie napisano wektora, bo nie ma czego porównać. |
| V16 `_ffEnterAuto` | battleScene.ts:3709-3712 (`if manualMode -> _toggleManualMode(); if _battleAwaitingOrders -> _kickoffBattleTurn()`); wywołanie z skip() :3689-3690 | siege_tactics_fastforward.rs:76-77 emituje `FfEvent::EnterAuto`, ale siege_tactics_loop.rs:698-702 obsługuje go przez `halt_unsupported(...)`: "sterownik K5-LOOP nie wchodzi w AUTO z przewijania (pending_auto zawsze false)". Ciało pinu (wyjście z trybu ręcznego i start tury) NIE jest zaimplementowane; ścieżka `pending_auto` jest nieosiągalna. | BLOCK (port inny niż pin: przewijanie z trybu ręcznego zatrzymuje się zamiast wejść w AUTO). Nie napisano wektora porównującego, bo oczekiwanym wynikiem jest zmiana trybu, a port go nie wykonuje. |

Zakres wykonany: V5 i V6. Wykonanie poza zakresem: nic.

## Mutacje (wymóg dispatchu)

- (a) przerwanie fali ignorowane (V6): usunięto `st.token += 1` z `halt_auto_battle_turn` (tymczasowo, w worktree). Wynik: v6a FAILED (panic p6_k5_auto_vectors.rs:188). Źródło przywrócone `git checkout`. MUTACJA (a) -> FAIL, wymóg spełniony.
- (b) kolejność rozkazów odwrócona (V15): NIE_ZMIERZONO. Brak kodu do mutacji (patrz V15).
- (c) wejście AUTO bez przewijania (V16): NIE_ZMIERZONO. Port nie ma ciała `_ffEnterAuto` do zmutowania; obecne zachowanie to halt_unsupported.

## Bramki (rust-port/engine, EXIT codes)

- `cargo fmt --check`: EXIT 0 (po `rustfmt` na nowym pliku testowym).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-fail-fast`: EXIT 0 (487 wierszy `test result: ok`, zero FAILED; pierwszy przebieg został przerwany przez zakończenie tła, drugi przebieg w pełni zakończony z `test_rc=0`).
- Brak `#[ignore]`, brak osłabionych asercji w nowym pliku.

## Strażnik SHA-256 wyciętych fragmentów pinu

Fragmenty pinu (5960-5973, 17332-17344, 1023, 3603-3611, 3708-3712) zapisane w scratchpadzie jako `pin_k5_auto_fragments.txt`, SHA-256 = `0b85fad19d6c772b537c4fde3dbae8956a9fde69d922e61f7e06b4d63baded63`. Generator nie został dodany do repo (allowlista dispatchu nie zawiera pliku generatora poza `p6_k5_auto_vectors*.rs`); wartości pinu w testach są zapisane ręcznie z komentarzami plik:linia.

## BLOKADY

1. V15: brak portu `_executeQueuedOrders` / `_executeUnitsImmediate` w Rust. Tryb ręczny (`_performPlayerOrder`, `_toggleManualMode`) jest poza zakresem tego dispatchu i nie ma tematu w kolejce (NIE_ZMIERZONO, do zgłoszenia jako luka, nie port).
2. V16: rozbieżność portu z pinem: `FfEvent::EnterAuto` w siege_tactics_loop.rs:698-702 jest halt_unsupported. To jest realna różnica wobec pinu `:3709-3712`; wymaga osobnego tematu portu (nie zmieniam kodu źródłowego zgodnie z allowlistą).
3. Zakres dispatchu wskazywał, że V1, V2, V7-V13 są poza zakresem; nie tknięte.

## RUNDY

1/5 (runda 1). Werdykt operatora: BLOCK z dowodem dla V15 i V16; V5 i V6 zielone.

## NASTĘPNY KROK

Orkiestrator: (1) zdecydować, czy V15 zgłosić jako lukę (manual-mode poza zakresem) i (2) otworzyć temat portu EnterAuto z przewijania (V16: siege_tactics_loop.rs:698-702 -> ciało `_ffEnterAuto` wg pinu :3709-3712 + toggle manual + kickoff), zanim powstanie wektor V16. Evaluator ma zweryfikować, czy halt_unsupported dla EnterAuto jest świadomą luką czy błędem.

DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje; push tylko commit lokalny na gałęzi roboczej).

COMMIT: (SHA ustawiany po commicie)
