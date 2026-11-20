# R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1: Obrona Operatora (runda 1)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1
GOAL: klasa A (c1 118/196/221) bajt w bajt z pinem 07d2fbd72 @1 i @16 ms; marsz krok po kroku; ROZBIEZNE_B_WIRA_PIN_3 pusta
ZMIANY/COMMIT: 2e2b8c5a6 (5 testów lib w march_incremental_tests, tylko #[cfg(test)]; kod produkcyjny bez zmian) + ten raport
               (SHA w commicie raportu); baza: e9b67e659 (raport Evaluatora) nad kodem Operatora 13a0d2f95, baza dispatchu 3e5db0673
TESTY: §2 (bramki), §3 (mutanty: Z1–Z5 zabite, E1 równoważny, sonda 0/373 tys.)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

| Zarzut | Werdykt | Poprawka / dowód |
|---|---|---|
| Z1 (E3): brak testu, że krok C-FLANK nie zapisuje `lastAutoMoveFrom` (pin `:8222-8229`) | **PRZYJMUJĘ** | Test `krok_c_flank_nie_zapisuje_last_auto_move_from`. Kontynuacja marszu niesie `prev` z wcześniejszego kroku czołowego (`(-5,4)`), a `attack_direction = Bok`. Wejście `_advanceStep` wykonuje krok manewru (`StepEnd`, pole ≠ start). Asercje: `c.prev == None` oraz po `advance_step_end` `last_auto_move_from == None`. Kontrola w tym samym teście: przy `front` ten sam stan daje krok czołowy `(1,0)`, więc test rzeczywiście przechodzi przez gałąź C-FLANK. Mutant E3: **FAIL**, czyli zabity |
| Z2 (E5): brak testu, że wejście z przerwy strzelca to `_rangedForwardStep`, nie `_rangedAction` | **PRZYJMUJĘ** | Test `przerwa_strzelca_wraca_do_ranged_forward_step`: strzelec ma zasięg 1 i stoi na (3,0), wróg wręcz na (5,0) (odległość 2), etap `Gap` przez `march_fire`. Pin (`:6806`): krok naprzód na (4,0), a marsz czeka na koniec kroku (`StepEnd`, `RangedForward`). Kontrola: `_rangedAction` z tego samego stanu daje KITE przyparty, czyli `Shot(0)` bez kroku (`:6719-6721`). Mutant E5: **FAIL**, zabity |
| Z3 (E7): gałąź strzału z pierwszego wejścia `_rangedAction` w marszu całkowicie niepokryta | **PRZYJMUJĘ** | Test `strzal_z_pierwszego_wejscia_marszu_ma_czas_do_skutku`, dwa przypadki z tą samą sekwencją co gałąź strzelca w `start` (`ranged_action_enter` → `march_advance` → `march_start_dur`): `rangedKite=false` daje strzał w miejscu (`:6727-6731`), `rangedKite=true` daje KITE przyparty (`:6719-6721`). Asercje: `Shot(0)`, brak marszu w toku i zegarów, czas `start` > 0 i równy `frame_sched(16, RANGED_FLY_MS)` (przy strzale z modelem czasu pinu dochodzi `tail = RANGED_GAP_MS`) albo `fly + frame_sched(16, RANGED_GAP_MS)` (bez strzału), pole bez zmian. Mutant E7: **FAIL**, zabity. Uwaga: przez wektory i kandydatów ta ścieżka nadal nie przechodzi (sonda Evaluatora: 0 przypadków), więc pokrycie daje wyłącznie test lib. Odnotowuję to jako NIE_ZMIERZONO na pinie (§4) |
| Z4 (E8): brak testu, że wejście w zasięg po kroku woła `_rangedAction` od nowa | **PRZYJMUJĘ** | Test `wejscie_w_zasieg_po_kroku_wola_ranged_action_od_nowa`: koniec kroku `_rangedForwardStep`, strzelec z zasięgiem 3 na (4,0), wróg wręcz na (6,0) (w zasięgu, zagrożenie 2 ≤ `MELEE_SAFE_GAP`). Pin `:6805` → `_rangedAction` → KITE: wynik `StepEnd`, `c.kind = Kite`, krok z dala od zagrożenia. Kontrola: przy `rangedKite=false` ten sam stan daje `Shot(0)`. Mutant E8 (strzał bez `_rangedAction`): **FAIL**, zabity |
| Z5 (E10): brak odpowiednika testu A8 dla strzelca (`ru.routed` odświeżane przy każdym wejściu `_rangedForwardStep`) | **PRZYJMUJĘ** | Test `strzelec_rozbicie_w_trakcie_marszu_widoczne_w_bramce_kolejnego_kroku`: wejście z przerwy → krok → koniec kroku (`fire_timer`) → przerwa; jednostka zostaje rozbita między krokami (`st.atk[0].c.routed = true`). Kolejne wejście z zegara przerwy (`_rangedForwardStep`) daje `mover_routed == true` (bramka `_doMove` `:8689`, `_siegeApproachRestricted` `:7953`). Mutant E10: **FAIL**, zabity |
| E1: `raf_pending` LIFO zamiast FIFO przeżywa | **ODRZUCAM jako lukę (mutant równoważny)**, równoważność zapisana z dowodem | (a) **Argument z kodu.** Do `raf_pending` trafiają wyłącznie `BodyDone(u)` oraz `BodyTimer(id)` z `timer_raf(id)` = koniec kroku marszu (`march.id == id && stage == StepEnd`). Wpis powstaje tylko w `defer_to_raf`, które jest wołane wyłącznie z wywołania zwrotnego `drain_timers` (`step_realtime`) i z `FfEvent::TimerFired` (przewijanie). Kolejka jest opróżniana w tej samej klatce lub iteracji. Aktywacje są sekwencyjne: pin `_activateUnit(u, done)` czeka na `done`, a kolejna aktywacja startuje dopiero po `activation_done`, czyli po odpaleniu `BodyDone`. Marsz ma jeden slot i jeden zegar naraz. `BodyDone` jednostki nie jest planowane, gdy marsz trwa (`start`: `!march_pending(u)`; `BodyTimer`: dopiero po `take_march_done`). Na zegarze leży więc naraz najwyżej jeden klocek klasy „raf”, a `raf_pending.len() ≤ 1`, przy czym kolejność FIFO i LIFO jest wtedy identyczna. Zastrzeżenie: przyszłe planowanie AUTO-batch w ciele, które teraz ma `autobatch = None` (uwaga N1 Evaluatora). (b) **Pomiar (sonda tymczasowa, cofnięta):** `eprintln!` długości kolejki przed każdym `push` w `defer_to_raf`, binarka `p6_k5loop_wiring_a_pin` w release. Wyniki: 45 wektorów — 44 541 wstawień, wszystkie do pustej kolejki; 128 kandydatów @1 ms (tryb `WIRING_A_RUST_FF_STEP=1`, ścieżka przewijania) — 164 601, wszystkie do pustej; 128 kandydatów @16 ms — 164 948, wszystkie do pustej. **0 wstawień do niepustej kolejki** na ok. 374 tys. Kandydaci w sondzie: 128/128 @1 i 128/128 @16. Mutant E1 przeżywa testy lib, co jest zgodne z równoważnością |

## 2. Bramki (worktree Obrony, checkout 2e2b8c5a6, `CARGO_INCREMENTAL=0 CARGO_PROFILE_*_DEBUG=0`, target w scratchpadzie `march-inc-obr-tgt`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --release --lib march_incremental` | 16 passed / 0 failed (11 dawnych i 5 nowych) |
| `cargo test --release --all-targets --no-fail-fast` (engine, w tle) | **FULL_EXIT=0**: 553 × `test result: ok`, **4237 passed / 0 failed / 1 ignored** (4232 u Evaluatora + 5 nowych testów obrony; ignorowany test spoza diffu) |

Kod produkcyjny jest bez zmian: diff `e9b67e659..2e2b8c5a6` dotyczy wyłącznie modułu `#[cfg(test)] march_incremental_tests` w `siege_tactics_loop.rs` (+200 linii). Wektory, generator i `p6_k5loop_wiring_a_pin.rs` nie zostały ruszone, więc MD5 `vectors.json` `dae3e46e…` i `pin_data.json` `432eed76…` pozostają takie jak w raporcie Evaluatora.

## 3. Mutanty Obrony (skrypt Evaluatora z podmienionymi ścieżkami: `scratchpad/march-inc-obr/march-inc-obr-mut.py --lib`, log `march-inc-obr-mut-lib.log`)

| ID | Mutant | Testy lib (przed obroną) | Testy lib (po obronie) |
|---|---|---|---|
| E1 | `raf_pending` LIFO | ok | ok (równoważny, §1) |
| E3 | C-FLANK bez `c.prev = None` | ok | **FAIL** |
| E5 | przerwa strzelca → `_rangedAction` | ok | **FAIL** |
| E7 | `march_start_dur` zawsze 0 | ok | **FAIL** |
| E8 | wejście w zasięg = strzał bez `_rangedAction` | ok | **FAIL** |
| E10 | `ranged_forward_enter` bez odświeżenia `mover_routed` | ok | **FAIL** |

Po obronie: wszystkie 34 mutanty (24 Operatora i 10 Evaluatora) są zabite albo jawnie równoważne. Równoważne są A9, A17 (przyjęte przez Evaluatora) oraz E1 (§1).

## 4. Długi

| Pozycja | Stan |
|---|---|
| Klasa A (118/196/221 @1/@16) | ZAMKNIĘTE (bez zmian w tej rundzie) |
| Luki testów Z1–Z5 | ZAMKNIĘTE testami lib (2e2b8c5a6) |
| E1 | równoważny, dowód z kodu i pomiar 0/≈374 tys. |
| Strzał z pierwszego wejścia `_rangedAction` w marszu (Z3) na wektorach pinu | NIE_ZMIERZONO na pinie: żaden wektor ani kandydat nie przechodzi przez tę ścieżkę; pokrycie wyłącznie testem lib. Ewentualny wektor = osobny dopisek do generatora (poza zakresem obrony) |
| N1 (`debug_assert!` slotu marszu przy AUTO-batch) | dług do tematu wpięcia planowania AUTO-batch |
| MARCH-INCREMENTAL-RESZTA, FQ-SPEED, D-PIN3-3-SHOT-ID | bez zmian (poza zakresem) |

Sprzątanie: sonda cofnięta (`git status` czysty przed commitem raportu), target `march-inc-obr-tgt` usunięty po bramkach; logi w `scratchpad/march-inc-obr/`.
