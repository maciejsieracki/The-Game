STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING
GOAL: wpiąć ruch pieszego (advance_step_decide -> do_move_effects) w ProdBody (#315, odblokowuje #123)
ZMIANY/COMMIT: brak zmian w kodzie; raport 01-operator-r1.md (commit na gałęzi roboczej, SHA w odpowiedzi orkiestratorowi)
BAZA: origin/rust-port/parity-v2 = 760be5187 (worktree detached)
PIN: 07d2fbd72 (tylko odczyt)
TESTY: NIE WYKONANO. Brak zmian w kodzie, więc bramki (fmt, clippy, p6_k5doc_t4e, all-targets) i mutacje (a)(b)(c) nie były uruchomione. Stan dysku na starcie: 8.8 GB wolne (`df -h /`).
BLOKADY: patrz sekcja BLOKADA
RUNDY: 1/5
NASTĘPNY KROK: decyzje orkiestratora D1–D4 (niżej), potem dispatch T4e-0 (kontrakt wejść ruchu) i T4e-1 (wiring + test end-to-end)
DEPLOY/PUSH: NIE WYKONANO

## Rozpoznanie (odczyt, bez mutacji)

1. ProdBody nie ma danych terenu. `ProdBody::new(units, scene, rolls)` (`rust-port/engine/src/domain/siege_tactics_loop.rs:1148`) przyjmuje tylko `ProdUnit`, `ActivateScene` i RollSource. Brak passable, moveCost, isFordTile, combatTerrainName i mnożnika kawalerii. `ProdUnit::activate` niesie tylko `terrain_defence_mult` (wejście adaptera), nie koszt wejścia.
2. Brak `occByKey`. Żadna struktura ProdBody ani TurnSeqState nie trzyma mapy zajętości kafli. Pole `occ` istnieje tylko w `BatchBoard` (`siege_tactics_autobatch.rs:77-82`), którego ProdBody nie używa.
3. Kontrakt LoopBody jest jednoetapowy. `start` zwraca jeden `f64` (czas), a `complete` jest wołane raz po `BodyDone` (`siege_tactics_loop.rs:797-803`). Pin `_advanceStep` (`battleScene.ts:8198-8285`) łączy kolejne kroki przez `_schedule(STEP_GAP_MS)` wewnątrz jednej aktywacji. ProdBody nie ma mechanizmu ponownego wejścia w aktywację.
4. Czas kroku nie ma wejścia. `do_move_effects` (T4c) celowo pomija animację: `done()` przychodzi po animacji (`siege_tactics_move_effects.rs`, nagłówek i `MoveOutcome.done`). Nie ma pola `move_ms` analogicznego do `ProdUnit::body_ms`.
5. Koszt per jednostka. Pin `_moveCostForUnit` (`battleScene.ts:7436-7444`): `!passable -> Infinity`; `base = moveCost`; dla `mounted` mnożnik `cavalryTerrainMultiplier(combatTerrainName)`, a niefinite mnożnik daje `Infinity`. Decyzja orkiestratora (per jednostka) jest zgodna z pinem, ale źródło danych terenu z pkt 1 nie istnieje.
6. `siege_tactics_tower.rs:47` `move_cost(col,row)` jest atrapą harnessu (komentarz w pliku: `_moveCostForUnit` jest atrapa harnessu). Nie wolno jej użyć jako produkcyjnego kosztu.
7. `AutoBatchEnv` (`siege_tactics_autobatch.rs:257`) wymaga ok. 12 metod (plan_unit, check_end, passable_for_unit, do_move, do_attack, flee_step, remove_unit_from_scene, ...), potrzebnych do BFS `first_step_along_path_to_attack` (`siege_tactics_pathstep.rs:51`). ProdBody go nie implementuje.
8. Istnieje synchroniczny driver `siege_walk_to` (`siege_tactics_walk.rs:235`) z własnym `WalkWorld`. Jego nagłówek mówi wprost, że efekty `_doMove` i `_schedule` należą do wołającego. Nie jest to wiring.
9. Generator wektorów T4e (`p6_k5doc_t4e_gen.mjs`) musiałby wykonywać pin `_advanceStep` z zależnościami: `_canAttackFrom`, `_pickAdjacentTargetByPriority`, `_nearestEnemy`, `_shouldAvoidAutoBacktrack`, `_compactAttackAllowsStep`, `_firstStepAlongPathToAttack`, `_stepToward`. Bez stubów nie da się tego wykonać. Gotowe porty `player_order_move_gate.rs` (compact/backtrack), `siege_tactics_doctrine_target.rs` (pick_adjacent_target_by_priority) i `siege_tactics_pathstep.rs` pokrywają część, ale nie całość.

## BLOKADA

Wiring wymaga trzech wejść i jednego kontraktu, których dispatch nie podaje i których Operator nie może wprowadzić bez decyzji technicznej. Zgodnie z zasadą „decyzje techniczne podejmuje orkiestrator" wysyłam BLOCK zamiast częściowego kodu. Częściowy wiring (stały koszt, zmyślony czas kroku, mapa zajętości bez konsumenta) dałby zielone testy na błędnym modelu.

## Decyzje do orkiestratora (każda z rekomendacją)

D1. Źródło terenu dla ProdBody. Rekomendacja: nowy trait `MoveTerrain` (passable, move_cost, is_ford, combat_terrain_name, cavalry_mult) podpinany setterem `with_move_terrain(...)` z domyślnym `None`. Przy `None` gałąź `krok-naprzod` zostaje nieportowana, więc istniejące testy `ProdBody::new` nie zmieniają zachowania. Alternatywa: rozszerzyć `ProdUnit` o wartości per kafel (odrzucona: brak kafli w jednostce, duplikacja danych).
D2. Czas kroku. Rekomendacja: wejście adaptera `move_ms` per jednostka (analogicznie do `body_ms`) oraz wariant synchroniczny: jedna aktywacja wykonuje łańcuch kroków w `start` i zwraca sumę `move_ms + STEP_GAP_MS` na krok. Odpowiada to `siege_walk_to`. Jest równoważne web tylko dla jednej jednostki bez przeplatających się timerów (uwaga z nagłówka `siege_tactics_walk.rs`). Alternatywa: rozbić aktywację na osobne zdarzenia kroku (wymaga zmiany `LoopBody`, poza allowlistą).
D3. Właściciel `occByKey`. Rekomendacja: pole w ProdBody inicjalizowane z pozycji jednostek w `new`, z `MoveWorld::occ_mut` zwracającym to pole. Dzięki temu `do_move_effects` (T4c) zostaje bez zmian.
D4. Generator wektorów T4e. Rekomendacja: podzielić na dwa etapy. T4e-0: wektory dla samego łańcucha efektów (`do_move_effects` z terenem i brodem) z pinu `_moveCostForUnit` i `_doMove`, bez `_advanceStep`. T4e-1: wektory decyzji `_advanceStep` przez już istniejące wektory T4a/T4b, bez nowego generatora. Pełne wykonanie `_advanceStep` ze stubami poza wycinkiem wymaga osobnej decyzji (stuby oznaczone jawnie w wektorze).

## Propozycja podziału (bez wykonania)

- T4e-0 (Operator, Haiku): trait `MoveTerrain`, pole occByKey w ProdBody, setter, testy efektów ruchu na ProdBody (bez zmiany `start`). Bramki: fmt, clippy, p6_k5doc_t4e, all-targets, mutacje (a)(b)(c).
- T4e-1 (Operator, Haiku po FC T4e-0): gałąź `AdvanceStep` w `start` zgodnie z D2, test end-to-end tury pieszej, mutacje.

Priorytet: D1–D3 przed startem. Bez nich każdy Operator dojdzie do tego samego BLOCK.
