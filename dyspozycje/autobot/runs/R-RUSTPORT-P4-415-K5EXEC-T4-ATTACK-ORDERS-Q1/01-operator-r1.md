# R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 — raport Operatora, runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1
GOAL: port gałęzi `attackMove` (`:18353-18394`) i `attack` (`:18395-18428`) `_performPlayerOrder` oraz `_attackMovePath` (`:18535-18566`) i `_firstStepOnAttackMovePath` (`:18568-18572`) z pinu `07d2fbd72` do Rust, z dowodem na wektorach KROKU wykonanych z tekstu pinu.
ZMIANY/COMMIT: gałąź `rust-port-wip/415-k5exec-t4-attack-orders`, baza `origin/rust-port/parity-v2` = `1dedba56c`. Commity: `e88a2f207` (port), `48c7b00ed` (wektory, generator, test), `de92f6ccb` (fmt + clippy), plus commit tego raportu (SHA w odpowiedzi Operatora). Pliki:
- nowy `rust-port/engine/src/domain/player_order_attack.rs` (362 linii) + wpis w `src/domain/mod.rs`;
- `rust-port/engine/src/domain/player_order_move.rs`: warianty `PlayerOrder::AttackMove { col, row }` / `PlayerOrder::Attack { target_id }` zamiast `Other`, `PerformOrder::Attack(AttackOrderStep)` zamiast `Other`, nowy leniwy argument `attack` w `perform_player_order`;
- `rust-port/engine/tests/p4_404_move_order.rs`: plik spoza allowlisty, zmiana wyłącznie mechaniczna. 5 wywołań `perform_player_order` dostało nowy argument `|| unreachable!(...)`. Asercje są bez zmian. Bez tego test T3 się nie kompiluje po zmianie sygnatury;
- nowy `rust-port/engine/tests/p4_415_attack_orders.rs` (3 testy);
- `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`: nowy tryb `WIRING_A_ATTACK_ORDER_STEPS=1`. Strażnik SHA-256 jest bez zmian (`3eeeb760…`), a tekst pinu nie jest podmieniany;
- nowy `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/attack_order_step_vectors.json` (MD5 `a16ce98fe3891fbd22ee4aedbadc8adf`, 5,9 MB; dwa przebiegi generatora dały identyczny MD5).
- `siege_tactics_loop.rs`: bez zmian (nie było potrzeby).
TESTY: (CARGO_INCREMENTAL=0, profile debug=0, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach)
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- pełny `cargo test --all-targets --no-fail-fast` (engine): EXIT 0. 560 binarek/sekcji: 4383 passed, 0 failed, 1 ignored. Przypadek ignorowany jest wcześniejszy, w tym temacie nie dodano `#[ignore]`.
- `p4_415_attack_orders`: 3/3 ok:
  - `rozkazy_attack_i_attack_move_zgodne_z_pinem`: 1650 przypadków `_performPlayerOrder` (1050 `attackMove`, w tym 450 z wymuszoną blokadą linii, i 600 `attack`), 0 rozbieżności. Porównywane są: decyzja, krok, cel, `playerOrder` po wywołaniu, `lastAutoMoveFrom`, `ret`/`done`, dziennik `_canStrikeTargetFrom` (port pyta tylko o pola z dziennika pinu), ślad wywołań `_firstStepAlongPathToAttack` (allow, cel, wynik) i ślad `_attackMovePath`. Pokrycie (min. 3 na klucz, asercja): `attackMove`: atak 181, krok ku zagrożeniu 117, krok trasy 141, brak kroku 379, rozkaz `none` (cel = pozycja) 45, wiele zagrożeń 179, remis priorytetu (tie-break Manhattan) 68, `removed` w rosterze 55, zagrożenie z krokiem odrzuconym przez blokadę i przejściem dalej 11, oblężenie ręczne 187. `attack`: atak 38, krok ku celowi 184, w tym z `lastAutoMoveFrom` 93, brak kroku 13, blokada 26, `none` 125 (dead 12, fadingOut 22, routed 11, brak w rosterze / sojusznik 80), unik cofania przy sąsiednim `lastAutoMoveFrom` 29, `compact` odmawia sąsiada 90, oblężenie ręczne 121.
  - `droga_attack_move_zgodna_z_pinem`: 672 przypadki `_attackMovePath` + `_firstStepOnAttackMovePath` (obie wartości `allowEnemyCells`), 0 rozbieżności. 72 z nich są na scenie otwartej (cały teren Plains), gdzie decyduje limit `queue.length < BF_COLS*BF_ROWS`. Wyniki: z drogą 489, brak drogi 183, cel = start 54, droga przez pole wroga 55.
  - `kolejnosc_zagrozen_priorytet_potem_manhattan`: kontrakt komparatora `a - b || m`, w tym `NaN`.
- `p4_404_move_order` (T3): bez regresji (w pełnym teście). Generator w trybie `WIRING_A_MOVE_ORDER_STEPS` po dopisku daje identyczny `move_order_step_vectors.json` (MD5 `8f2c1cbee02088696f16c5659415411c`). Pozostałe pliki wektorów są nietknięte (git status).
- Mutanty: 22 (skrypt w scratchpadzie `p415/mut415.py`; każdy mutant to jedna podmiana tekstu i `cargo test --test p4_415_attack_orders`). Zabite: 20/22. Jawnie równoważne: 2/22.
  - Zabite: M1 `allowEnemyCells` trasy odwrócone; M2 krok trasy z `allowEnemyCells=true`; M3 sortowanie tylko po Manhattan; M4 priorytet malejąco; M5 brak filtra `removed`; M6 brak filtra `routed` w `_enemiesOf`; M7 BFS trasy bez `_destAllowedByBlockade`; M8 zły limit BFS (1024); M9 `attack` bez `lastAutoMoveFrom`; M10 `attackMove` z celem = pozycja bez `none`; M11b `attack` bez `fadingOut` w `find` i w `_enemiesOf`; M12 krok ku zagrożeniu bez blokady; M13 `attack` bez blokady kroku; M15 filtr `attack` bez `_compactAttackAllowsStep`; M16 filtr `attack` bez anty-cofania; M17 `_performSiegeManualOrder` nie dla `attack`/`attackMove`; M18 zagrożenie tylko na polu trasy (bez `_canStrikeTargetFrom` z trasy); M19 trasa przez własne jednostki; M20 `attackMove` bez uderzenia z miejsca; M21 `attack` bez `allowFirstStep`.
  - Równoważne: M11a (`attack`: `find` bez `!fadingOut`). Pin filtruje `fadingOut` już w `_enemiesOf` (`:8293`), więc warunek w `find` (`:18396`) jest nadmiarowy. Wariant usuwający oba filtry (M11b) jest zabity.
  - Równoważne: M14 (`attackMove`: brak `_destAllowedByBlockade` po `_firstStepOnAttackMovePath`, `:18392`). BFS `_attackMovePath` odrzuca już każde pole z kolumną poza blokadą (`:18554`), więc `path[1]` zawsze ją spełnia i odmowa jest nieosiągalna. Test ma asercję, że wariant `BlockadeBlocked{Waypoint}` nie występuje w żadnym przypadku pinu.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (`02-evaluator.md`).
DEPLOY/PUSH: NIE WYKONANO.

## Decyzje techniczne Operatora
- D-415-T1: osobny moduł `player_order_attack.rs` zamiast rozszerzania `player_order_move.rs`. Moduł T3 ma 438 linii, a T4 ma własne wejścia: roster wroga z flagami, `_canStrikeTargetFrom`, `_priorityScore` i klasyfikację zajętości `_isPlayerSide` dla `allowEnemyCells`. `player_order_move.rs` dostaje tylko warianty rozkazu i rozgałęzienie.
- D-415-T2: `perform_player_order` dostaje leniwy argument `attack: impl FnOnce() -> AttackOrderStep`, tak samo jak istniejący `mv` dla `move`. Wołający liczy decyzję przez `attack_move_order_step` / `attack_order_step`. Kolejność jest jak w pinie: `hold`, potem `_performSiegeManualOrder` (teraz także dla `attack`/`attackMove`, bo bramka `:18436` ich nie wyłącza), potem gałąź.
- D-415-T3: `_firstStepAlongPathToAttack(ru, allowFirstStep, target)` wchodzi przez `AttackOrderEnv::first_step_along_path_to_attack`. Wołający podaje istniejący port T4a `siege_tactics_pathstep::first_step_along_path_to_attack` z `is_goal = _canStrikeTargetFrom(ru, ., ., target)` (`:8571-8573`). Test robi dokładnie to na planszy przypadku, więc T4a jest sprawdzany razem z T4.
- D-415-T4: `targetId` jest typu `u64`, zgodnie z `id: u64` jednostki w `siege_tactics_turnseq.rs`. W teście `bu.id` `'aN'`/`'dN'` mapuje się na 1000+N / 2000+N, a napis spoza rosteru na `u64::MAX`.
- D-415-T5: sortowanie zagrożeń jest stabilne (`sort_by`, jak TimSort V8) z komparatorem `a - b || m`: gdy różnica priorytetów wynosi `0` albo `NaN`, decyduje Manhattan. `_priorityScore` w pinie jest skończony (`:17512-17520`), więc niespójny komparator nie występuje.

## Rozbieżności z pinem
Brak w zakresie T4 (0/1650 rozkazów, 0/672 dróg). Uwaga strukturalna: dwa warunki pinu są nadmiarowe, ale port zachowuje je dosłownie (M11a, M14 powyżej).

## Jak powstały wektory (D-415-3)
`WIRING_A_ATTACK_ORDER_STEPS=1 node rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (około 30 s). Na scenach pinu (`st_mur`, `st_rzeka`, `st_las`) ustawiany jest stan: pozycje, flagi `dead`/`fadingOut`/`routed`/`removed`, `occByKey`, doktryna, `lastAutoMoveFrom`, amunicja, blokada linii, `_deployPlayerSideOpt` i `siegeWallCol` (połowa przypadków bez muru). Potem wykonywane jest jedno wywołanie `_performPlayerOrder` z tekstu pinu. `_doMove`/`_doAttack` tylko zapisują decyzję, a callback ruchu wołany jest od razu. Bitew w czasie rzeczywistym nie ma: są nieosiągalne w AUTO (`:6093`, wniosek z #404).

## NIE_ZMIERZONO
- Tekstu `_performSiegeManualOrder` (H3) nie sprawdzano. Test sprawdza tylko, że przy jego wyniku `true` rozkaz kończy się w `SiegeManual` (308 przypadków).
- `_canStrikeTargetFrom`, `_priorityScore`, `_compactAttackAllowsStep`, `_destAllowedByBlockade` i `_shouldAvoidAutoBacktrack` są wejściami z pinu. Ich porty mają osobne wektory (T2, K5DOC-T2), a tutaj nie są liczone przez Rust.
- Brak produkcyjnego wołającego: `ProdBody` nie trzyma `ru.playerOrder` gracza (T5/H4). Przebieg w pętli bitwy NIE_ZMIERZONO.
- Efekty wykonania (`_doMove`, `_doAttack`, `_refreshQueuedOrderVisuals` = render) leżą poza tym modułem.

## Mapa pozostałych kroków (pin `07d2fbd72`)
- H3: `_performSiegeManualOrder` `:18435-18475` (w tym `_siegeRamTowerStep`, `_siegeSafeApproach`). Pełny wynik (nie sama bramka `:18436`) musi wejść jako `siege_manual_handled` także dla `attack`/`attackMove`.
- T5: stan rozkazów gracza w ciele (`ru.playerOrder`, `_executeUnitsImmediate` → `_performPlayerOrder`), tryb ręczny `_activateUnit` `:6066-6071`, zdjęcie tagu `tryb-reczny`. Wtedy `ProdOps::perform_player_order` zaczyna wołać `attack_move_order_step` / `attack_order_step` z `ProdBody` jako `AttackOrderEnv`.
- H4 / T6–T7: wpięcie kolejki rozkazów (`player_order_queue.rs`, T1) i mostu klienta (wydanie `attack`/`attackMove` z UI); `_refreshQueuedOrderVisuals` `:11520` (render).
