STATUS: INTEGRATION_PENDING
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1 (runda 1, Operator, model HAIKU)
GOAL: port `_executeUnitsImmediate` (pin 07d2fbd72, `gra/src/battle/battleScene.ts:18578-18614`) jako pętla po indeksach w module Rust; `_performPlayerOrder` wstrzyknięty jako trait; busy-gate i odroczenia przez `VirtualClock`; zdarzenia jako `Vec` (wzorem `siege_tactics_autobatch.rs`).
BAZA: `origin/rust-port/parity-v2` = `316ded4b7` (worktree detached na tym SHA; status czysty przed startem). Pin `07d2fbd72` tylko do odczytu.
ZMIANY/COMMIT: patrz sekcja COMMIT poniżej (SHA commita Operatora podane po zapisie).
  - `rust-port/engine/src/domain/player_order_queue.rs` (NOWY): `execute_units_immediate`, `on_timer`, `on_order_done`, trait `PlayerOrderExec`, `OrderQueueEvent`, `StepResult`, `PlayerUnitFlags`, `OrderOutcome`, `BUSY_RETRY_MS = 40.0`.
  - `rust-port/engine/src/domain/mod.rs` (wyłącznie linia `pub mod player_order_queue;`).
  - `rust-port/engine/tests/p6_player_order_queue_gen.mjs` (NOWY): generator wektorów WYKONUJE metodę z pinu (wycinek 18578-18614 przez `git show`, `stripTypeScriptTypes`, atrapy zależności sceny). Nie jest to transkrypcja.
  - `rust-port/engine/tests/p6_player_order_queue_vectors/vectors.json` (NOWY): 15 scenariuszy; `fragment_sha256` = `db40eb37544c98982858347cb3f60165ce79dc1ce66151938f77e37dc76c76cf`.
  - `rust-port/engine/tests/p6_player_order_queue.rs` (NOWY): 4 testy (wektory + 3 nazwane: kolejność tablicy id, pusta lista, busy blokuje do zdarzenia zegara).
  - `dyspozycje/autobot/runs/R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1/01-operator-r1.md` (ten raport).
  - Cargo.lock: wygenerowany lokalnie przez cargo, NIE commitowany, usunięty z worktree.
TESTY:
  - `cargo test --test p6_player_order_queue`: 4 passed, 0 failed.
  - Bramki (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
    - `cargo fmt --check`: EXIT 0 (pliki nowe sformatowane rustfmt).
    - `cargo clippy --all-targets -- -D warnings`: EXIT 0.
    - `cargo test --all-targets --no-fail-fast`: EXIT 0; 3631 passed, 0 failed; 1 ignored (pre-existing `#[ignore]` w `tests/p6_order_lane.rs:1530`, poza allowlistą, nie dotknięte).
  - Pokrycie minimum z dispatchu: kolejność = kolejność tablicy id (vec `kolejnosc_tablicy_id`, `kolejnosc_nie_sortowana`); pominięcie martwych/usuniętych/rozbitych/działających/zakolejkowanych (`filtr_dead_removed_routed_acted_queued`); jednostka `acted` nie wykonana drugi raz (`duplikat_wykonywany_raz`, `juz_acted_nie_wykonywana`); pusta lista → tylko `suspend:false` + `refresh` (`pusta_lista`); busy blokuje do zdarzenia zegara (`busy_blokuje_do_zdarzenia_zegara`, `busy_co_jednostke`).
  - Wektory = wynik wykonania pinu; Rust odtwarza je 1:1 (4/4 zielone).
MUTACJE (zmiana źródła, test, przywrócenie; `cmp` potwierdził identyczność po przywróceniu):
  - (a1) usunięty `!u.acted` z filtra startowego: PASS (NIE_ZMIERZONO jako FAIL). Mutant jest RÓWNOWAŻNY: pin ma drugi strażnik `if (u.acted || u.dead || u.routed)` w `runNext`, który przechwytuje tę samą jednostkę. Zachowanie identyczne, więc test nie może go wykryć.
  - (a2) usunięte `acted` w OBU miejscach (filtr startowy i recheck w `runNext`): FAIL (wektory pinu, `wektory_pinu_zgodne_z_wykonaniem_weba`). Spełnia wymóg mutacji (a) w sensie efektywnym.
  - (b) odwrócona kolejność (`queue.reverse()`): FAIL (3 testy nazwane + wektory).
  - (c) brak busy-gate (`if false && exec.is_busy()`): FAIL (2 testy + wektory).
BLOKADY: brak dla zakresu T1. Uwaga przy T2/T3: `_performPlayerOrder` jest tu atrapą w testach (zgodnie z zakresem).
RUNDY: 1/5 (Operator, runda 1). Bez FAIL.
NASTĘPNY KROK: Evaluator (SONNET) → Obrona/Final Control wg obiegu; w szczególności weryfikacja wektorów wobec pinu (ponowne `node rust-port/engine/tests/p6_player_order_queue_gen.mjs 07d2fbd72`) i przegląd mutacji (a1 jest równoważny, nie FAIL).
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje, nie integruje; push do rust-port/parity-v2 zabroniony dispatchem).

ZAŁĄCZNIK: pytania/odchylenia od pinu
  - Pin ma w filtrze `!this._queuedOrderUnitIds.has(id)` i kontrolę `if (!u)` w `runNext`; obie zachowane. Warunek `removed` nie występuje w recheck `runNext` (pin: tylko `acted || dead || routed`); zachowane 1:1.
  - Efekt uboczny pinu `this._autoBattleSuspended = false` (`:18579`) przekazany jako zdarzenie `ClearAutoBattleSuspended` (scena ustawia pole).
  - Planowanie AUTO (`_autoBatchPlanning`) → `ScheduleOutcome::RunNow` ponownie wykonuje `runNext` synchronicznie, jak web. Przy stale `busy` w trybie planowania pętla nie kończy się (web przepełniłby stos); bramki tego nie testują.
