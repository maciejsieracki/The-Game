# 02a-obrona — R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1 (runda 2 Operatora, odpowiedź na Evaluator r1)

STATUS: BLOCK (V5/V6 zielone i mutacje M1-M3 dają FAIL; V15/V16 nadal BLOCK z dowodem; pełny `--all-targets` NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1
GOAL: wektory pinu 07d2fbd72 dla AUTO bez oblężenia: V5, V6 (zielone z mutacjami), V15 i V16 (BLOCK z dowodem).
BAZA: `b3c0b2209` (`origin/rust-port/parity-v2`, ancestry OK). Punkt wyjścia: `104bc216a` (Operator r1). Commit obrony: patrz sekcja ZMIANY/COMMIT.
ZMIANY/COMMIT: allowlista zachowana. Zmienione: `rust-port/engine/tests/p6_k5_auto_vectors.rs`; nowe: `rust-port/engine/tests/p6_k5_auto_vectors/gen_pin_fragments.sh`, `.../pin_fragments.txt`, `.../pin_fragments.sha256`; raport `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1/02a-obrona.md`. Zero zmian w `src/` (mutacje cofane przez `git checkout --`). `Cargo.lock` NIE commitowany.
NASTĘPNY KROK: Evaluator r2 (weryfikacja poprawek + mutacje M1-M3 powtórzyć), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora (02-evaluator.md, commit `277f9283b`)

1. **KRYTYCZNY, V5a filtr obrońców — PRZYJMUJĘ.** `v5a` ma teraz pięciu obrońców: `d0` (zywy, nieaktywny, przechodzi), `d1` (fadingOut), `d2` (acted), `d3` (dead), `d4` (removed). Asercje: `hits["plan_clone"] == 1` (jeden klon = jeden obrońca w fazie Def) i `resolutions.unit_id == ["d0"]`. Dowód: mutacja M1 (`src/domain/siege_tactics_autobatch.rs:749`, filtr w `finish_auto_batch_phase` zamieniony na `!u.c.dead`) → `v5a` FAILED (przed poprawką 8/8 zielone). Źródło cofnięte.
2. **KRYTYCZNY, V6a/V5b zerowanie resolutions/completed — PRZYJMUJĘ.** `v6a` ustawia niepuste `resolutions` (2 wpisy) i `completed` przed `halt`; po `halt` asercja `is_empty()`. `v5b` startuje z niepustymi `resolutions`/`completed`. Dowód: mutacja M2 (`halt_auto_battle_turn` bez `st.resolutions.clear(); st.completed.clear();`, linie 771-772) → `v6a` FAILED. Źródło cofnięte.
3. **WYSOKI, brak generatora i straźnika SHA-256 — PRZYJMUJĘ z korektą.** Operator r1 błędnie twierdził, że allowlista nie dopuszcza generatora; allowlista dopuszcza `tests/p6_k5_auto_vectors/**`. Dodano:
   - `rust-port/engine/tests/p6_k5_auto_vectors/gen_pin_fragments.sh` — wycina z `git show 07d2fbd72:gra/src/battle/battleScene.ts` zakresy 1021-1024, 3600-3614, 3685-3715, 5958-5975, 17330-17346; tryb domyślny zapisuje, `--check` porównuje `cmp` i `sha256sum -c`.
   - `pin_fragments.txt` (90 linii), `pin_fragments.sha256`: `9497cccef8cd4393014c45ee0d809f842e37f5612511aff2f7ca1c4d465f7a05  pin_fragments.txt`.
   - test `pin_fragments_hold_pinned_lines` (`include_str!`) sprawdza dokładne linie pinu: `TURN_GAP_MS     = 240;` (`:1023`), filtr `:5964`, straźnik `:5962`, `_schedule(TURN_GAP_MS, ...)` (`:5971`), `_autoBatchResolutions = [];` (`:5969`).
   - Hash `0b85fad1...` z r1 NIE jest odtwarzalny (fragmenty były tylko w scratchpadzie); zastąpiony powyższym.
   - Ograniczenie: sprawdzenie SHA-256 jest w skrypcie `--check`, NIE w `cargo test` (brak zależności hashującej; `Cargo.toml` poza allowlistą). NIE_ZMIERZONO w cargo test.
4. **ŚREDNI, V5c atrapa `check_end` — CZĘŚCIOWO PRZYJMUJĘ.** Dodano asercję `st.finished()` i brak `plan_clone` (brak fazy Def). Realny `_checkEnd` (pin `:10172-10220`) NIE jest objęty V5: w porcie wstrzykiwany przez `AutoBatchEnv::check_end`; `domain::siege_tactics_endcheck` ma tylko 2 testy jednostkowe. Zakres V5 = kontrakt wywołania. Realny `_checkEnd` = NIE_ZMIERZONO w tym temacie, do osobnego tematu.
5. **ŚREDNI, V6b porównanie tylko 3 pól — PRZYJMUJĘ.** `v6b` robi pełne `assert_eq!(st, expected)` (`BatchState: PartialEq`), gdzie `expected` = stan po `halt` z jedyną dozwoloną zmianą `hits["finish_stale"] += 1`.
6. **ŚREDNI, V6 bez ścieżki `fire_timers` — PRZYJMUJĘ.** Dodano `v6d` (późny `FinishPhase{token: stary}` zaplanowany na zegarze PO halt, odpalony przez `fire_timers`, `suspended = true`) i `v6e` (to samo z `suspendInFlight = false`, więc jedynym strażem jest token). Dowód: mutacja M3 (`halt_auto_battle_turn` bez `st.token += 1`, linia 769) → `v6a` FAILED i `v6e` FAILED. Mutacja (a) z dispatchu daje FAIL.
7. **INFO, V15/V16 BLOCK i mutacje (b)/(c) — PRZYJMUJĘ (bez zmian kodu).** Potwierdzone: brak `execute_queued_orders` i `ff_enter_auto` w `rust-port/engine/src`; `siege_tactics_loop.rs:698-702` EnterAuto → `halt_unsupported`; pin `:3603-3611` i `:3709-3712`. Mutacje (b) i (c) NIE_ZMIERZONO: nie ma kodu portu do mutowania; wymagają osobnych tematów portu. Wektory V15/V16 pozostają BLOCK.
8. **INFO, brak pełnego `--all-targets` — PRZYJMUJĘ.** Powtórzone w tej rundzie (wynik niżej).

## Mutacje (wszystkie cofnięte; `src/` czyste)

| Mutacja | Miejsce | Wynik |
|---|---|---|
| M1: filtr obrońców w finish → `!u.c.dead` | `siege_tactics_autobatch.rs:749` | `v5a` FAILED (FAIL = OK) |
| M2: halt bez `resolutions.clear()`/`completed.clear()` | `:771-772` | `v6a` FAILED |
| M3: halt bez `token += 1` | `:769` | `v6a` FAILED, `v6e` FAILED |
| (b) kolejność rozkazów odwrócona (V15) | brak kodu portu | NIE_ZMIERZONO (BLOCK) |
| (c) wejście AUTO bez przewijania (V16) | brak kodu portu | NIE_ZMIERZONO (BLOCK) |

## Bramki (rust-port/engine, CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR poza repo)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p6_k5_auto_vectors`: EXIT 0, 11/11 ok (`pin_fragments_hold_pinned_lines`, `v5a`-`v5e`, `v6a`-`v6e`)
- `cargo test --all-targets --no-fail-fast`: NIE_ZMIERZONO. Uruchomiony w tle; na współdzielonej maszynie kompilacja 485 binarek testowych nie zakończyła się w ~2 h (114 z 485 zbudowanych), proces zatrzymany przez Operatora. Wynik r1 (487 ok) NIE został tą rundą powtórzony. Do powtórzenia przez Evaluatora r2 / FC na czystej maszynie.

Brak `#[ignore]`. Brak osłabionych asercji (v6b/v5b/v6a wzmocnione). Cargo.lock wygenerowany przez cargo, untracked, nie dodany do commita.

## Blokady (bez zmian wobec r1)

- V15 `_executeQueuedOrders` (pin `battleScene.ts:3603-3611`): brak portu; `queued_order_ids` to BTreeSet (`siege_tactics_turnseq.rs:98`), porządek id a nie wstawienia. BLOCK.
- V16 `_ffEnterAuto` (pin `:3709-3712`): `siege_tactics_loop.rs:698-702` obsługuje EnterAuto przez `halt_unsupported`. BLOCK.
- Tryb ręczny `_performPlayerOrder` (`:18280`) / `_toggleManualMode` (`:17348`): poza zakresem, NIE_ZMIERZONO (luka do zgłoszenia).
- Realny `_checkEnd` (pin `:10172-10220`) poza V5: NIE_ZMIERZONO w tym temacie.
- Brak zależności do SHA-256 w cargo test: strażnik fragmentów działa przez `gen_pin_fragments.sh --check`.

## Wnioski dla orkiestratora

- Zarzuty 1, 2, 3, 5, 6 zaakceptowane i naprawione; zarzut 4 częściowo; 7 i 8 przyjęte jako informacyjne.
- Zalecenie: po FC rozstrzygnąć, czy V15/V16 to osobne tematy portu (zgodnie z dispatchem: tak). Pełny test `--all-targets` powtórzyć poza tym cyklem.
