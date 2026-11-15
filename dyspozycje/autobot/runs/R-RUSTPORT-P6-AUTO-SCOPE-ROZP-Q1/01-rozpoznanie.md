# R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1 — 01 rozpoznanie (Operator, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (read-only; zero zmian kodu gry)
TEMAT: zakres wektorów K5-LOOP-AUTO: które ścieżki AUTO bez oblężenia i tryb ręczny w pinie nie mają odpowiednika w Rust.
GOAL: tabela ścieżek pin → Rust, zależności od #97/#118 oraz #109/#147, lista wektorów do osobnego tematu.
BAZA: `f7baa3848` (detached, zgodnie z dispatchem; `origin/rust-port/parity-v2` nie użyte jako baza).
PIN: `07d2fbd72:gra/src/battle/battleScene.ts` (20771 linii).

ZMIANY/COMMIT: wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1/01-rozpoznanie.md`). Kod nie zmieniany. Brak push.

TESTY: NIE_URUCHAMIANO (rozpoznanie tylko odczyt; dispatch nie wymaga bramek cargo). Weryfikacja: `grep`/`sed` na pinie i na Rust, numery linii odczytane z plików na SHA bazy i pina.

BLOKADY:
- Pin `_toggleManualMode` / `_performPlayerOrder` (tryb ręczny, ~340 linii) nie ma w Rust odpowiednika ani tematu w kolejce. Trzeba go zlecić osobno (patrz sekcja 5).
- Zależności #109/#147 (OUTCOME) i #112 (doktryna) są twarde dla #97 — patrz sekcja 4.

RUNDY: 1/5
NASTĘPNY KROK: FC/Evaluator wg dispatchu; po akceptacji temat wektorów (sekcja 5) po zamknięciu #112 i #109.
DEPLOY/PUSH: NIE WYKONANO

---

## 1. Kluczowe ustalenia

1. **Ścieżka AUTO bez oblężenia w pinie to nie jest `_activateNext`, tylko faza wsadowa.** `_kickoffBattleTurn` (pin 3615) wybiera `_beginAutoBatchTurnFromCurrentState` (5696) gdy `!_manualMode && siegeWallCol < 0`; dla oblężenia — sekwencyjny `_activateNext` (5979). Rust: moduł K5g0/K5G (`siege_tactics_autobatch.rs`) implementuje fazę wsadową i ma test `p6_siege_tactics_autobatch.rs`, ale **nie jest podpięty do produkcyjnej pętli**. `SiegeLoop` na `SeqEvent::BeginAutoBatchPhase` wywołuje `halt_unsupported` (`siege_tactics_loop.rs:541-545`) z komunikatem „AUTO bez oblężenia poza zakresem”.
2. **Najważniejsza luka: doktryna jest domyślną ścieżką AUTO bez oblężenia.** Pin `_isUnitDoctrineAuto` (17621) zwraca `true`, chyba że doktryna = `manual`; `_getEffectiveDoctrine` (17612) domyślnie daje `'steady'`. W `_activateUnit` (6092-6097) każda jednostka bez jawnej doktryny i bez grupy (lub z grupą `autoPlay ?? true`) wchodzi najpierw w `_executeGroupDoctrineStep` (17966). Rust oznacza to jako `doktryna` i wycofuje z pętli (`siege_tactics_loop.rs:1002-1003`). Oznacza to, że **praktycznie cała AUTO bez oblężenia w Rust jest dziś poza zakresem**, nie tylko rzadkie przypadki.
3. **Tryb ręczny** w pinie: `_manualMode` domyślnie `true` (2287), przełączany `_toggleManualMode` (17348); w `_activateUnit` gałąź gracza `_performPlayerOrder` (6067-6068, 18280). Rust: `perform_player_order()` = `false` (`siege_tactics_loop.rs:753-755`), `player_unit_idle` = `false` (444-448), a `manual_mode` jest wyłapywany jako `tryb-reczny` (995-996). Brak portu rozkazów gracza.
4. **Kolejka zgodna z dispatchem nie ma wpisu „AUTO bez oblężenia” w pętli produkcyjnej** — pętla obsługuje wyłącznie oblężenie (`siege_tactics_loop.rs:19-20` w nagłówku).

---

## 2. Tabela: ścieżka w pinie → odpowiednik Rust

Legenda: POKRYTE (test) = port + wektory/test pinu; CZĘŚCIOWO = port jest, brakuje gałęzi lub testu; BRAK = brak odpowiednika w produkcyjnej pętli; ROZBIEŻNE = port istnieje, ale zachowanie inne.

### 2a. Faza AUTO bez oblężenia (wsadowa)

| Pin (plik:linia) | Rust (plik:linia) | Status |
|---|---|---|
| `_kickoffBattleTurn` 3615, gałąź `!_manualMode && siegeWallCol<0` | `siege_tactics_loop.rs:541-545` (halt); `siege_tactics_turnseq.rs:280-281` (emituje `BeginAutoBatchPhase`) | BRAK w pętli (zdarzenie emitowane, sterownik przerywa) |
| `_beginAutoBatchTurnFromCurrentState` 5696 | `siege_tactics_autobatch.rs:346` `begin_auto_batch_turn_from_current_state` | POKRYTE (moduł), BRAK w pętli |
| `_beginAutoBatchPhase` 5707 (migawka, planowanie, token) | `siege_tactics_autobatch.rs:396` `begin_auto_batch_phase` | POKRYTE (test `p6_siege_tactics_autobatch.rs`), BRAK w pętli |
| `_snapshotAutoBatchIntents` 5752 (klony, `_activateUnit` na klonie) | `siege_tactics_autobatch.rs:446` | CZĘŚCIOWO: planowanie korzysta z `plan_unit` wstrzykiwanego przez trait; produkcyjna implementacja `plan_unit` = BRAK (zależy od doktryny i strzelca) |
| `_launchAutoBatchResolution` 5865 | `siege_tactics_autobatch.rs:515` | POKRYTE (moduł), BRAK w pętli |
| `_resolveAutoBatchAttack` 5907 | `siege_tactics_autobatch.rs:605` | POKRYTE (moduł) |
| `_resolveAutoBatchMovement` 5924 | `siege_tactics_autobatch.rs:647` | POKRYTE (moduł); ruch pojedynczych kroków w produkcji = BRAK (#123) |
| `_finishAutoBatchPhase` 5961 (+ `_checkEnd`) | `siege_tactics_autobatch.rs:727` | POKRYTE (moduł), `check_end` wstrzykiwany |
| `_haltAutoBattleTurn` 17333 (inkrementacja tokenu) | `siege_tactics_autobatch.rs:765` `halt_auto_battle_turn` | POKRYTE (moduł) |
| `_drainTimers` / `_schedule` (ACT_GAP, TURN_GAP) | `siege_tactics_autobatch.rs:332` `schedule`, `:782` `fire_timers`; zegar `siege_tactics_clock.rs` | POKRYTE |
| `resolveAutoBatchPhase` (K5G0) | `siege_tactics_autophase.rs` (`resolve_auto_batch_phase`) | POKRYTE (`p6_siege_tactics_autophase.rs`) |

### 2b. Gałęzie `_activateUnit` używane w AUTO bez oblężenia

Numery pin: `_activateUnit` 6048-6372. Rust: `ProdBody::start` (`siege_tactics_loop.rs` ok. 977-1085), tabela wyłączeń (`siege_tactics_loop.rs:985-1010`).

| Pin (plik:linia) | Gałąź | Rust (plik:linia) | Status |
|---|---|---|---|
| 6049-6050 `finished` / `dead` / `fadingOut` → `done()` | wczesne wyjście | `siege_tactics_loop.rs:~980-985` (maszyna K5H) | POKRYTE (`p6_siege_tactics_loop_body_pin`) |
| 6055 `ru.routed` → `_fleeStep` (9845) | ucieczka | `siege_tactics_loop.rs:988-991` (`unported` „ucieczka-routed”); `BatchEnv::flee_step` tylko jako trait (`siege_tactics_autobatch.rs:278`) | BRAK |
| 6064 `_applyTerrainRange` | teren | `BatchEnv::apply_terrain_range` (`autobatch.rs:273`) — trait | CZĘŚCIOWO |
| 6067-6068 `_manualMode && playerSide` → `_performPlayerOrder` (18280) | tryb ręczny | `siege_tactics_loop.rs:753-755` (stub `false`), `:995-996` (`tryb-reczny`) | BRAK |
| 6092-6097 `_isUnitDoctrineAuto` → `_executeGroupDoctrineStep` (17966) | **doktryna AUTO (domyślna)** | `siege_tactics_loop.rs:756-758` (stub `false`), `:1002-1003` (`doktryna`) | **BRAK — krytyczne** |
| 6105-6117 `surroundApplied` (≥3 wrogów sąsiadów → morale, `_checkRout`) | okrążenie | pola `surround` (`siege_tactics_loop.rs:853, 931`); logika morale/rout bez portu | CZĘŚCIOWO (stan jest, efekt — BRAK, #109) |
| 6123 `_updateFacing` (8334) | facing na starcie aktywacji | `siege_tactics_loop.rs:900-928` `update_facing` | CZĘŚCIOWO (kod jest; wektory/test czułości #124 pending) |
| 6129-6133 `onWallWalkway` | mur | — | NIE_DOTYCZY w AUTO bez oblężenia (brak muru) |
| 6136-6157 `canShoot` → `_rangedTargetInRange` (7041) → `_doAttack` | strzelec w zwarciu/dystansie | `siege_tactics_loop.rs:1000-1001` (`strzelec`) | BRAK (#148) |
| 6167-6168 `_targetInRange` (8373) → `_doAttack` | cios w zwarciu | `ProdBody::target_in_range` (`siege_tactics_loop.rs:771`) — cel podany przez adapter (`ProdUnit::melee_target`, komentarz 711) | CZĘŚCIOWO (bez `facing`/`attackDirection` z pina) |
| 6241-6246 `_rangedAction` (6656) | strzelec bez doktryny | `siege_tactics_loop.rs:1000-1001` (`strzelec`) | BRAK |
| 6249-6276 `primaryRanged` / `_fallBackStep` (7228) | odwrót strzelca | `siege_tactics_loop.rs:1000-1001` (`primary_ranged`) | BRAK |
| 6284 `ru.mounted` → `_cavalryAction` (6372) | kawaleria | — | BRAK |
| 6290 `ru.phalanx` → `_phalanxAction` (6546) | falanga | — | BRAK |
| 6293-6298 `_targetInRange` → `_doAttack`, w przeciwnym razie `_advanceStep` (8198) | zwarcie / marsz | cios: `ProdBody::strike` (`:1120`) → `single_blow_full`; marsz: — | cios POKRYTE (`p6_siege_tactics_loop_body_pin`, #108 kontratak); marsz BRAK (#123) |

### 2c. Cios i wynik (wspólne dla AUTO i ręcznej)

| Pin (plik:linia) | Rust (plik:linia) | Status |
|---|---|---|
| `_doAttack` 8787 → `_doMeleeAttack` 9096 | `ProdBody::strike` `siege_tactics_loop.rs:1120` | POKRYTE (zwarcie) |
| `_doAttack` → `_doRangedAttack` 9179 | — | BRAK (#148) |
| `_singleBlow` (K5I) | `siege_tactics_blow_full.rs` `single_blow_full` | POKRYTE (K5I2a/b) |
| `_resolveBlowOutcome` 9019 (morale, rout po ciosie) | brak; komentarz `siege_tactics_loop.rs:700-701` wprost mówi „NIE zaimplementowane” | **BRAK — #109 / #147** |
| `_updateMoraleBar` 9652, `_checkRout` 9783 | brak | **BRAK — #109 / #147** |
| `_defenderCounters` (kontratak) | `ProdBody::counter_strike` `siege_tactics_loop.rs:1199` | POKRYTE (#108) |
| `engaged` (`attacker>defender`, 8899) | `siege_tactics_loop.rs:846-847` | POKRYTE (zbiór); efekt zależy od #109 |
| `_disableManualIfCommanderLost` 10007 | brak | BRAK (tryb ręczny) |

### 2d. Sterowanie fazami i przewijanie

| Pin (plik:linia) | Rust (plik:linia) | Status |
|---|---|---|
| `skip()` 3680 | brak w produkcji; `skip_instant_fallback` (`siege_tactics_breach.rs:160`) tylko dla oblężenia | BRAK dla AUTO bez oblężenia |
| `_ffEnterAuto` 3709 | `FfEvent::EnterAuto` (`siege_tactics_fastforward.rs:7`), wyjście z ręcznego przez `_ffPendingAuto` | CZĘŚCIOWO |
| `_runFastForward` 9415 | `siege_tactics_fastforward.rs` (`run_fast_forward`), `siege_tactics_loop.rs:496` | POKRYTE (dla oblężenia) |
| `_roundCapVerdict` 9449 (sufit 150 / 400 tur) | `siege_tactics_roundcap.rs`, `siege_tactics_loop.rs:649` (`round_cap`) | POKRYTE (oblężenie); ścieżka bez oblężenia (sufit FF_MAX_ROUNDS=400, morale) — do wektorów |
| `_ffRoundCapResult` 9485 / `_finishDraw` | `siege_tactics_loop.rs:517` (`finish`) | POKRYTE (oblężenie) |
| `_kickoffBattleTurn` 3615 | `siege_tactics_turnseq.rs` (`begin_turn`) | POKRYTE (oblężenie) |

### 2e. Tryb ręczny (pełna lista punktów pina)

| Pin (plik:linia) | Opis | Rust | Status |
|---|---|---|---|
| `_manualMode = true` 2287; `_manualCommanderGate` 2289, 2718, 3572 | stan + bramka dowódcy | `BatchState::manual_mode` (`siege_tactics_autobatch.rs:161`), `TurnSeqState::manual_mode` (`siege_tactics_turnseq.rs:89`) | ROZBIEŻNE: brak bramki dowódcy |
| `_toggleManualMode` 17348 | przełączenie AUTO↔RĘCZNY, czyszczenie zaznaczeń i rozkazów | brak | BRAK |
| `_performPlayerOrder` 18280 (~340 linii) | rozkaz gracza na jednostce | `perform_player_order` stub (`siege_tactics_loop.rs:753`) | BRAK |
| `_executeQueuedOrders` 3603, `_executeUnitsImmediate` 18578 | kolejka rozkazów Ctrl/Shift, SPACJA | `queued_order_ids` (`siege_tactics_turnseq.rs:310, 342`) | CZĘŚCIOWO (kolejka w sekwencji, brak wykonania rozkazów) |
| `_turnSeq` w trybie ręcznym: gracz pierwszy (`order`) | kolejność ręczna | `siege_tactics_turnseq.rs:243-246` | POKRYTE (test `p6_siege_tactics_turnseq`) |
| `_isManualInputActive` 11304 | wejście UI | NIE_DOTYCZY (warstwa UI) | — |

---

## 3. Wektory do napisania (lista dla osobnego tematu)

Kolejność: najpierw to, co da się pokryć bez #109 i #112. Każdy wektor musi mieć pinową funkcję i wejścia.

| Nr | Nazwa wektora | Pinowa funkcja | Wejścia | Zależność |
|---|---|---|---|---|
| V1 | `auto-batch-kolejnosc-atk-def` | `_beginAutoBatchTurnFromCurrentState` 5696 + `_beginAutoBatchPhase` 5707 | zestaw: 2 atk + 2 def bez grupy, `siegeWallCol=-1` | brak (moduł K5G istnieje) |
| V2 | `auto-batch-migawka-planowania` | `_snapshotAutoBatchIntents` 5752 | j.w., plan kroków z klonów | #112 dla doktryny (fallback: jednostki z `unitDoctrine='manual'` lub bez AUTO) |
| V3 | `auto-batch-ruch-frozen-path` | `_resolveAutoBatchMovement` 5924 | ścieżka 3 kroków, kolizja zajętego pola | #123 (facing po kroku) |
| V4 | `auto-batch-atak-zamrozony-cel` | `_resolveAutoBatchAttack` 5907 | cel zabity przed uderzeniem | #109 (efekt po ciosie) |
| V5 | `auto-batch-zakonczenie-tury` | `_finishAutoBatchPhase` 5961 + `_checkEnd` | atk wygrywa w fazie atk | brak |
| V6 | `auto-batch-halt-token` | `_haltAutoBattleTurn` 17333 | przerwanie w połowie fali, spóźniony callback | brak |
| V7 | `auto-doktryna-steady-bez-oblezenia` | `_executeGroupDoctrineStep` 17966 (`steady`, cel 2 kolumny 8193-8195) | jednostka grupy `steady`, bez strzelca | **#112 (twardy)** |
| V8 | `auto-doktryna-defensive-strzelec` | `_executeGroupDoctrineStep` 17966 (gałąź `defensive`) | strzelec w zasięgu | **#112 + #148** |
| V9 | `auto-ucieczka-routed` | `_activateUnit` 6055 → `_fleeStep` 9845 | jednostka `routed` | **#109 (rout po morale)** |
| V10 | `auto-surround-3-wrogow` | `_activateUnit` 6105-6117 | 3 wrogów sąsiadów, `surroundApplied` jednorazowo | #109 (morale) |
| V11 | `auto-facing-aktywacja` | `_updateFacing` 8334 (wywołanie 6123) | 0 / 1 / 2 wrogów o różnej odległości | #107 / #124 (test czułości) |
| V12 | `auto-cios-zwarcie-engaged` | `_doMeleeAttack` 9096 + `engaged` 8899 | cios chybiony i trafiony | #109 (efekt), #108 kontratak (już POKRYTE) |
| V13 | `auto-sufit-400-bez-oblezenia` | `_roundCapVerdict` 9449 (gałąź nie-oblężenie) + `_ffRoundCapResult` 9485 | 400 tur, remis morale → obrońca | #109 (morale) |
| V14 | `reczny-gate-dowodcy` | `_toggleManualMode` 17348 (bramka 17350-17351) | brak dowódcy → przełączenie zablokowane | decyzja o portowaniu trybu ręcznego |

---

## 4. Zależności

| Ścieżka | Zależy od | Dlaczego |
|---|---|---|
| Cała AUTO bez oblężenia (#97, #118, #157) | **#112 K5LOOP-DOCTRINA-STRZELEC** | Domyślna doktryna `steady` (17612-17621) wchodzi PRZED resztą `_activateUnit`. Bez niej produkcja nie wykona większości ruchów AUTO bez oblężenia. Twardy. |
| Cała AUTO bez oblężenia (#97) | **#113 K5LOOP-WIRING** | Zdarzenie `BeginAutoBatchPhase` przerywa pętlę (541-545). Trzeba podpiąć moduł K5G do produkcji (albo wydzielić pętlę nie-oblężeniową). |
| Rout, ucieczka, surround, efekty po ciosie (#97, V9-V10, V12-V13) | **#109 / #147 K5LOOP-OUTCOME** | `_resolveBlowOutcome`, `_updateMoraleBar`, `_checkRout` brak (`siege_tactics_loop.rs:700-701`). |
| Facing po kroku i w ruchu (V3, V11) | **#107 / #123 / #124** | `update_facing` istnieje, brak facing po `_advanceStep`. |
| Strzelec w AUTO bez oblężenia (#148, V8) | **#148 K5LOOP-KONTRATAK-STRZELEC** | Gałęzie `canShoot` 6136, `_rangedAction` 6656 — w Rust wyłączone (1000-1001). |
| Tryb ręczny (#97 część „tryb ręczny”, V14) | **nowy temat (brak numeru)** | `_performPlayerOrder` 18280 (~340 linii) i `_toggleManualMode` 17348 nie mają tematu w kolejce. Zalecam nowy temat „K5-LOOP-RECZNY-ROZKAZ” po #112. |
| #98 WYLOM (poza zakresem) | #109 + oblężenie | Nie dotyczy AUTO bez oblężenia. |

Ścieżki od #97/#118 **niezależne od #109**: V1, V2 (tylko dla jednostek bez doktryny), V5, V6, V7 nie (zależy od #112), V11 (częściowo).

---

## 5. Rekomendacja

1. Wektory V1, V5, V6 (faza wsadowa, zakończenie, halt) można napisać od razu — moduł K5G istnieje i ma test. To zamyka część #118 bez blokady.
2. Wektory V7-V8, V9-V13 czekają na #112 i #109. Nie zaczynać przed nimi, bo wynik zależy od nieportowanych gałęzi.
3. Tryb ręczny (V14) wymaga osobnego tematu. Nie wchodzi w #97 bez decyzji o zakresie. (Dla gameplay: pin jest źródłem; decyzja techniczna, nie produktowa.)
4. Bramka #97 nie powinna startować przed #112 i #113.

---

## 6. NIE_ZMIERZONO

- Nie uruchomiono testów `p6_siege_tactics_autobatch` i `p6_siege_tactics_loop_*` (rozpoznanie tylko odczyt; zgodność wektorów nieweryfikowana).
- Nie sprawdzono, czy dane jednostek w produkcyjnym stanie mają `unitDoctrine` ustawione (czy domyślne `steady` faktycznie dotyczy większości jednostek bez oblężenia w grze). Wynika to z kodu pina (17612-17621), nie z danych.
- Nie zbadano pełnej treści `_executeGroupDoctrineStep` (17966-18130): odnotowano tylko gałąź `defensive` i wynik `true/false`.
- Nie sprawdzono, czy `_pickRangedTargetByPriority`, `_pickAdjacentTargetByPriority` mają odpowiedniki w Rust (poza `ranged_target_in_range` stub).
- Numery linii Rust odczytane z drzewa na `f7baa3848`; przy innym SHA mogą się przesunąć.
