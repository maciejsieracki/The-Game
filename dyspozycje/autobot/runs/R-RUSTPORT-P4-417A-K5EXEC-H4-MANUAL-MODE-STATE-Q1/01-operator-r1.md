STATUS: PASS-WITH-NOTES (Operator r1; kod i testy gotowe, bez nowych wektorów kroku z pinu — patrz NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb ręczny gracza w ciele bitwy (`ProdBody`), część A: stan `ru.playerOrder`, wykonanie rozkazów `hold`/`none`/`move`/`attack`/`attackMove`/oblężenie ręczne z predykatami liczonymi przez ciało, kolejka `_executeUnitsImmediate`; domyślnie wyłączone (dotychczasowe wektory bez zmian).
ZMIANY/COMMIT: kod `f29f0e420` (łańcuch: `213f00924` kod, `9fe793281` testy, `ecdbad382` testy zabijające mutanty, `f29f0e420` komentarze); gałąź `claude/rust-417a-h4`, baza `617185ba8` = `origin/rust-port/parity-v2` (rodzic łańcucha = baza). Pliki: siege_prod_manual.rs (nowy), mod.rs, siege_tactics_loop.rs, tests/p4_417a_manual_mode_state.rs, ten raport
TESTY: patrz sekcja „Testy i bramki”
BLOKADY: brak blokad technicznych; luki pomiarowe w sekcji NIE_ZMIERZONO
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md); rekomendowana runda 2 Operatora/dodatek: wektory kroku z pinu na ciele (kryteria 2–4 dispatchu) — patrz NIE_ZMIERZONO
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji)

## Co zostało zbudowane (web pin `07d2fbd72` najpierw, potem Rust)

Najpierw przeczytany web (`gra/src/battle/battleScene.ts`, `git show`): `_activateUnit` :6048-6112 (wejście `_performPlayerOrder` :6067-6069, reset rozkazu w AUTO :6093-6095, bezczynna jednostka gracza :6020-6025), `_performPlayerOrder` :18280-18428, `_performSiegeManualOrder` :18435-18475, `_executeUnitsImmediate` :18578-18614, `_findPlayerUnit` :12432, krok doktryny wystawiający `playerOrder = move` :18072-18082 i :18112-18122, `_effectiveMetaForUnit` :17633-17636, `_isUnitDoctrineAuto` :17621-17630.

Pliki (wszystkie z allowlisty):
- NOWY `rust-port/engine/src/domain/siege_prod_manual.rs` + wpis w `mod.rs`: `ManualState` (flaga `exec`, strona gracza, `ru.playerOrder` per jednostka, `finish` kroku doktryny, ślad `records`), `ManualRun` (wykonanie), `run_of_move` / `run_of_attack` / `run_of_siege` (tłumaczenie decyzji portów T3/T4/H3 na wykonanie i nowy `playerOrder`).
- `siege_tactics_loop.rs` (uzasadnione dopiski, nie przebudowa): pole `ProdBody::manual` + `direct_order`; `ProdBody::plan_manual_order`/`decide_manual` (składa `perform_player_order` + `siege_manual_order_step` z predykatami ciała: `ProdMoveGrid`/`ProdMoveGates`, nowy `ProdAttackEnv` implementujący `AttackOrderEnv` (przejezdność, zajętość `PlayerSide/OtherSide/SelfUnit`, `_canStrikeTargetFrom` z `_meleeBlockedByWall`, `_priorityScore`, `_firstStepAlongPathToAttack` przez `ProdPathEnv`), `ProdSiegeManualEnv`; `_siegeSafeApproach` liczone portem `siege_safe_approach_goal` z zagrożeniami `_siegeShooterThreats` ciała (wyciągnięte do `siege_threats_now`, współdzielone z `_siegeMoveRefused`) — wartości NIE są brane z pinu); `exec_order_move` (wyciągnięte 1:1 z ramienia `MoveOrderRun::Move` kroku doktryny, wspólne dla doktryny i rozkazów gracza); `move_order_input` (wyciągnięte z `move_order_start`); `start()` bez tagu `tryb-reczny` przy `manual.exec`, `scene.manual_mode`/`is_player_side` per jednostka, `au.player_order_none` ze stanu ciała, zdarzenie `ResetPlayerOrder` zeruje rozkaz (AUTO :6094), blok wykonania rozkazu po maszynie; API: `enable_manual_exec`, `set_player_order`, `player_order`, `perform_order_direct` (wywołanie poza aktywacją, bez `_applyTerrainRange` :18608), `ManualQueue` (`PlayerOrderExec` dla `execute_units_immediate`: busy-gate z `st.busy`, `mark_acted`, filtr `dead/removed/routed/acted/queued`); `LoopBody::player_unit_idle` (domyślnie `false`) spięte z `SiegeEnv::player_unit_idle` (:6020-6025).
- NOWY test `rust-port/engine/tests/p4_417a_manual_mode_state.rs` (31 testów).
- NIE zmieniono: `p6_k5loop_wiring_a_gen.mjs` (strażnik SHA-256 pinu `3eeeb760…` bez zmian), `siege_battle_session.rs`, `siege_battle_adapter_body.rs` (`manual_mode: false` na sztywno zostaje; flaga trafia do ciała dopiero przez `enable_manual_exec` w części B), istniejących wektorów, `gra/`, mostu, klienta, renderera.

## Decyzje techniczne orkiestratora D-417A-1..4: zastosowane

- D-417A-1 (zakres = stan + wykonanie + kolejka): tak. Poza zakresem (część B) nic nie dotknięte.
- D-417A-2 (nowy moduł + minimalne dopiski): tak (powyżej).
- D-417A-3 (dowód = wektory kroku z pinu): NIE SPEŁNIONE w tej rundzie, patrz NIE_ZMIERZONO.
- D-417A-4 (mutanty na pliku produkcyjnym): spełnione, patrz niżej.

Decyzje dopisane przez Operatora (do wpisu w `REJESTR-RUST.md` przez orkiestratora):
- D-417A-5: rozkaz `move` wystawiony przez krok doktryny w trybie ręcznym TRWA (pin :18072-18079: callback `finish` ustawia `move`/`none` wg pozycji po ruchu; reset następuje tylko w AUTO :6094). Ciało trzyma to jako `finish` rozstrzygane leniwie z aktualną pozycją (`ManualState::settle`/`order_at`), bo marsz jest atomowy albo krokowy.
- D-417A-6: kolejka `perform_order_direct` kończy jednostkę synchronicznie tylko gdy `start` zwrócił czas 0 i brak marszu w toku (`completed`); inaczej wołający domyka po `dur` (`LoopBody::complete`) i woła `on_order_done` (część B). Rozkaz z krokiem ruchu ma czas > 0, więc kolejka czeka (`awaiting`), jak `done` asynchroniczne pinu.
- D-417A-7: ustawienia blokady generała (`_generalSettings`, `blockadeActive`) zostają nieaktywne (wartości startowe pinu) także w rozkazach gracza; zmienia je wyłącznie panel gracza (część B).
- D-417A-8: `ActivateUnit::doctrine_auto` (`_isUnitDoctrineAuto`) pozostaje wejściem adaptera maszyny (jak w AUTO przed #417A); rozkazy gracza liczą `is_unit_doctrine_auto` portem ze stanu doktryny ciała.

## Testy i bramki (liczby)

- `cargo test --test p4_417a_manual_mode_state`: 31 passed, 0 failed (pokrycie: wyłączone domyślnie = tag `tryb-reczny`; `hold`; `none` z i bez doktryny AUTO; `none`+`skirmish` (rozkaz trwa); `move` (krok, zdjęcie na celu, cel = pozycja, sąsiad → atak, obejście zajętego pola); `attack` (w zasięgu, daleki cel, cel martwy/nieznany); `attackMove` (zagrożenie w zasięgu, wróg NA trasie, sojusznik na trasie, marsz, cel); druga strona w trybie ręcznym; AUTO zeruje rozkaz; bezczynność jednostki; kolejka: filtr, busy-gate 40 ms, `acted`, asynchroniczne `done`; oblężenie: podejście ograniczone z celem w zasięgu, zdjęcie rozkazu (cel nieznany / na celu), bezpieczne podejście (tag), `move` omija `_performSiegeManualOrder`, `_ensureGroupMeta`).
- Mutanty na PLIKU PRODUKCYJNYM (`siege_prod_manual.rs`, `siege_tactics_loop.rs`; skrypt zapisuje mutację w pliku produkcyjnym, uruchamia test, przywraca plik): 22 mutanty M01–M22. Pierwsze przejście: 13 zabitych, 7 przeżyło (M05, M07, M10, M11, M17, M18, M19), po dopisaniu 7 testów (sekcje 9–10 pliku testowego) wszystkie 22 zabite. Wariant `dd >= 0` w `can_strike_from` jest RÓWNOWAŻNY (wymagałby jednostki i wroga na tym samym polu; BFS pomija zajęte pola), zastąpiony mutantem `dd >= 2` (zabity) i `dd < reach` (zabity). Wynik końcowy: 22/22 zabite, 0 równoważnych w puli.
- `cargo fmt --check`: EXIT 0. `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- Pełny `cargo test --all-targets --no-fail-fast` (engine): EXIT 0; 562 binarek/sekcji `test result`, 4420 passed, 0 failed, 1 ignored (istniejący na bazie, nie dodany; `#[ignore]` w diffie: 0). Baza raportowała 4389, +31 nowych. Pełny przebieg wykonany na `ecdbad382`; później zmieniono WYŁĄCZNIE komentarze (numery linii pinu, commit `f29f0e420`), po czym ponowiono `cargo fmt --check` (0), `cargo clippy --all-targets -- -D warnings` (0) i `cargo test --test p4_417a_manual_mode_state` (31/31).
- Wolny dysk przed bramką: 13 GB (`df -h /`). Jeden build na raz, własny `CARGO_TARGET_DIR` w scratchpadzie.

## Tagi `unported` w trybie ręcznym (jawna lista; `tryb-reczny` tylko bez `manual.exec`)

- `tryb-reczny` — wyłącznie gdy `scene.manual_mode` bez `ManualState::exec` (zachowanie sprzed #417A).
- `rozkaz-gracza-brak-terenu` — decyzja czyta przejezdność bez `MoveTerrain` (D1, jak T3).
- `rozkaz-ruchu-bez-wykonania` — rozkaz ruchu przy `move_order_exec = false` (sesja produkcyjna ustawia `true`).
- `reczny-oblezenie-bezpieczne-podejscie` — `_siegeSafeApproach` znalazł cel (decyzja policzona portem), WYKONANIE marszu `_siegeWalkTo(..., safe)` (:8006-8019 z filtrem `safe`) = część B.
- `reczny-oblezenie-bez-planu` — nieosiągalne w praktyce (plan oblężenia jest `Some`, gdy brama `_performSiegeManualOrder` przepuszcza), tag ochronny.
- Dziedziczone bez zmian z AUTO (to samo wykonanie ciosu/ruchu): `cios-bez-szablonu`, `rozkaz-ruchu-brak-terenu`, oraz tagi z audytu #419.

## NIE_ZMIERZONO / luki (jawnie)

1. Kryterium 2/3/4 dispatchu (wektory KROKU z wykonania tekstu pinu dla ciała, progi pokrycia rozbite na `dead`/`fadingOut`/`routed`/cel = pozycja): NIE ZMIERZONO. Nie dodano nowych trybów generatora ani nowych plików wektorów. Powód: zakres kodu (stan + 3 gałęzie wykonania + kolejka + oblężenie) wyczerpał budżet rundy; decyzje portów T3/T4/H3 mają własne wektory z pinu (1140+642+120 `move_order_step`, 1650+672 `attack_order_step`, 1500+450 `siege_manual_order_step`, wszystkie zielone w pełnym teście), a ten krok sprawdza wpięcie testami z oczekiwaniami wyliczonymi z tekstu pinu. Wektor body-level (pin wykonany na scenie z `ru`, porównanie skutku z `ProdBody`) pozostaje do rundy 2. Warunek N1/N2 z #416 (predykaty z portów Rust, nie z pinu) jest spełniony w kodzie (`ProdAttackEnv`, `siege_threats_now` + `siege_safe_approach_goal`, `_rangedTargetInRange`/`_targetInRange` przez `ranged_target_in_range_js`/`target_in_range_cmb`), ale porównanie `fx` `_siegeSafeApproach` z pinem na wektorze: NIE ZMIERZONO.
2. Ścieżka `march_incremental = true` dla rozkazów gracza: kod współdzieli `exec_order_move`/`march_move` z krokiem doktryny (T3), ale rozkazy gracza w trybie krokowym NIE zostały pokryte testem (testy działają w marszu atomowym).
3. Pętla `SiegeLoop` z trybem ręcznym end-to-end (`SeqUnit`/`activation_done`/`player_unit_idle` z realną kolejnością tur i `acted`): NIE ZMIERZONO; `LoopBody::player_unit_idle` jest spięte i testowane na ciele, nie w pętli.
4. Gałęzie oblężenia `U7.2`-podobne wykonane w trybie ręcznym: `ram_tower_step` / `tower_climb` / `infantry_to_tower` wykonują te same funkcje `siege_atk_*` co AUTO; w trybie ręcznym NIE pokryte testem (tylko podejście ograniczone, pomost, `_ensureGroupMeta`, bezpieczne podejście).
5. Ustawienia blokady generała w rozkazach gracza (D-417A-7).
6. Pamiętaj: `acted` po kolejce ustawia `ManualQueue::mark_acted`; zdarzenie `RefreshQueuedOrderVisuals` jest wyłącznie renderem.

## Mapa kroków części B (#422) z numerami linii pinu

1. Wołający produkcyjny: API sesji dla UI ustawiające rozkazy (`ru.playerOrder = ...`): pin :11509/:11514 (rozkaz ruchu grupy), :18641 (`attack`), :18692 (`attackMove`), :18708 (`none`), :18904 (`hold`), :18959 (cofanie), :20317/:20376; resetujące rozkaz przy zmianie doktryny :17360/:17382/:17670/:17918. Ciało ma `set_player_order`/`enable_manual_exec`; brak wołającego w `siege_battle_session.rs` (stałe `manual_mode: false` w `siege_battle_session.rs:1117`, `siege_battle_adapter_body.rs:454`).
2. Kolejka UI: `_collectOrderUnitIds` :18617, `_queuedOrderUnitIds` add/delete przy `attack` :18642-18643, `_executeUnitsImmediate` :18578, `_refreshQueuedOrderVisuals` :11520; ciało ma `ManualQueue` (sterownik musi planować `complete` po `dur` i wołać `on_order_done`).
3. Wektory bitew z rozkazem gracza w czasie rzeczywistym (30-80 s każda); w AUTO pin zeruje rozkaz :6093-6095, a doktryna emituje tylko `move`, więc wektor musi ustawiać `playerOrder` w scenie przed bitwą.
4. Decyzja o ścieżce atomowej `move_order_exec && !march_incremental` (D-417A-1).
5. Wykonanie `_siegeSafeApproach` (marsz `_siegeWalkTo` z filtrem `safe`, :8107-8136 + :8006-8019); w ciele tag `reczny-oblezenie-bezpieczne-podejscie`.
6. Panel generała: `_generalSettings`/blokada :17809-17815, :17830.
7. `activation_done` w `SiegeLoop` z `player_unit_idle` (:6020-6025) i `turn_order` w trybie ręcznym (`siege_tactics_turnseq.rs`).
