# R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1 — Operator r1

STATUS: PASS (wynik pełnego testu engine niżej; ostateczny SHA w sekcji ZMIANY/COMMIT)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1
GOAL: port `_performSiegeManualOrder(ru, ord, done)` (pin `07d2fbd72`, `battleScene.ts:18435-18475`) jako czysta funkcja
z decyzją i wynikiem `handled` zgodnym z pinem, wynik wpięty w `perform_player_order` (`siege_manual_handled`) w zakresie
testów; `_trySiegeTowerClimb` (`:8056-8084`) zgodny z pinem na wektorach kroku.

## Baza i gałąź
- BAZA: `origin/rust-port/parity-v2` = `53e4188f2` (zgodna z dispatchem).
- Gałąź robocza: `rust-port-wip/416-siege-manual-q1` (worktree `.claude/worktrees/wf_efffd3b1-392-1`).

## Najpierw web (pin)
Przeczytane z `git show 07d2fbd72:gra/src/battle/battleScene.ts`: `_performSiegeManualOrder` `:18435-18475`,
`_siegeRamTowerStep` `:8022-8053`, `_trySiegeTowerClimb` `:8056-8084`, `_siegeInfantryToTowerStep` `:8087-8101`,
`_siegeApproachRestricted` `:7951-7960`, `_siegeSafeApproach` `:8107-8136`, `_rangedTargetInRange` `:7041-7052`,
`_targetInRange` `:8373-…`, `_enemiesOf` `:8291-8294`, `_isUnitDoctrineAuto` `:17621-17630`, `_effectiveMetaForUnit`
`:17633-…`, `canShoot` `:1457`, `isSiegeUnit` `:1552`, `isSiegeTower` `:1561`, `_isRam` `:7402`.

## Korekta stanu z dispatchu (jawna)
Dispatch twierdzi: „brak portu `_trySiegeTowerClimb`, `git grep "fn .*climb"` = 0 trafień”. Na bazie `53e4188f2`
port ISTNIEJE: `rust-port/engine/src/domain/siege_tactics_tower.rs:399` `pub fn siege_tower_climb` (K3, #217, doc
`:5` „= `_trySiegeTowerClimb` (`:8056-8084`)”). Decyzja Operatora D-416-OP1: nie duplikuję portu; H3 woła go wprost
przez adapter, a kryterium 2 spełniam NOWYMI wektorami kroku #416 (sekcja `climbs`) i mutantami na tym porcie.

## ZMIANY/COMMIT
Allowlista (bez wyjątków):
- NOWY `rust-port/engine/src/domain/player_order_siege_manual.rs` (401 linii): `siege_manual_order_step`
  (= `_performSiegeManualOrder`), decyzja `SiegeManualStep` (+ `handled()`, `direct_done_calls()`, `attack_target()`,
  `clears_order()`), `NotHandledAt`, `ApproachClear`, `siege_manual_doctrine_auto` (`:18443-18444`), trait
  `SiegeManualEnv` (podfunkcje pinu w kolejności pinu, z krótkimi spięciami), adapter `TowerSiegeEnv` (K3 + K1 wprost:
  `siege_ram_tower_step`, `siege_tower_climb`, `siege_infantry_to_tower_step`, `siege_approach_restricted`), trait
  `SiegeTargets` (`_rangedTargetInRange`, `_targetInRange`, `_siegeSafeApproach` — dostarcza wołający),
  `siege_manual_unit_of` / `siege_manual_scene_of`.
- `rust-port/engine/src/domain/mod.rs`: `pub mod player_order_siege_manual;` (1 linia).
- NOWY `rust-port/engine/tests/p4_416_siege_manual_order.rs` (6 testów).
- `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`: dopisany tryb `WIRING_A_SIEGE_MANUAL_STEPS=1` (blok przed
  `PIN2-PROBE`); strażnik SHA-256 i stałe bez zmian; inne tryby nietknięte.
- NOWY `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/siege_manual_order_step_vectors.json`
  (MD5 `614ddfdb45e073b508ada90727ce635c`, 4 153 828 B; regeneracja powtórzona: MD5 identyczne — generator
  deterministyczny).
- `player_order_move.rs`: BEZ zmian (wpięcie przez istniejący argument `siege_manual_handled`, test w #416).
- Istniejące pliki wektorów: bez zmian (`git diff --stat 53e4188f2` pokazuje tylko 5 plików wyżej).

Commity: `a050a6bb4` (WIP port + generator + wektory), `9ba8e3fe5` (test + mutanty), commit raportu = SHA końcowy
podany w odpowiedzi Operatora (ten plik jest w nim zawarty).

## Projekt rozwiązania
- Funkcja czysta: wejście `SiegeManualUnit` (flagi klas = wynik portów `siege_tactics_classify`), `SiegeManualScene`
  (`siegeWallCol >= 0`, `gateOpen`), `PlayerOrder`, `OrderDoctrine`, lista wrogów `SiegeEnemy` (filtr `_enemiesOf`
  + `find(id && !dead && !fadingOut)`, `:18466`), `SiegeManualEnv`. Wynik: decyzja; wykonanie (`_doAttack`, `done`,
  `_refreshQueuedOrderVisuals`, `ru.playerOrder = none`) należy do wołającego.
- Wpięcie (D-416-1): `perform_player_order(order, siege_manual_order_step(..).handled(), ...)` — sprawdzone testem
  `siege_manual_handled_wires_into_perform_player_order` na 1361 przypadkach (wszystkie poza `move`).
- `hold`: pin nie podaje go z produkcji (`:18282` przed `:18286`), ale bramka `:18438` go przepuszcza; port odwzorowuje
  tekst funkcji także dla `hold` (wektory zawierają 125 przypadków `hold`, zgodne).

## TESTY
Wektory kroku: generator wykonuje cały tekst pinu (strażnik SHA-256 `3eeeb760…34d` OK), 3 sceny z murem
(`mury`, `palisada`, `mury+baszta` w lesie), 1500 przypadków `_performSiegeManualOrder` wołanego WPROST + 450
przypadków `_trySiegeTowerClimb`. Ślad podfunkcji (głębokość 1) z wynikami, argumentami i pierwszymi efektami sceny.
Port liczy na portach: klasyfikację, doktrynę, `_siegeRamTowerStep` / `_trySiegeTowerClimb` /
`_siegeInfantryToTowerStep` (K3, w tym marsz BFS do pierwszego kroku) i `_siegeApproachRestricted` (K1); z pinu brane
wyłącznie wyniki `_rangedTargetInRange`, `_targetInRange`, `_siegeSafeApproach` (porównane argumenty wywołania).

`cargo test --test p4_416_siege_manual_order`: 6/6 zielone (42,6 s):
- `siege_manual_order_matches_pin_step_vectors`: 1500/1500 zgodne (ślad, `ret`, bezpośrednie `done`, `_doAttack`,
  `_refreshQueuedOrderVisuals`, `playerOrder` po, `towerAtWallRows` po). Histogram gałęzi:
  Gate 307, OtherSiegeUnit 156, IdleNoShot 68, Fallthrough 286, RamTower(true) 252, Shoot 15, WalkwayStrike(cel) 8,
  WalkwayStrike(brak) 96, Climb 45, InfantryToTower 182, ApproachStrike 8, ApproachClear(TargetGone) 21,
  ApproachClear(AtTarget) 7, ApproachSafe(true) 37, ApproachSafe(false) 12.
- `siege_manual_gate_conditions_covered_by_vectors`: bramka `:18438` z każdym z trzech warunków osobno (≥ 20 każdy).
- `siege_manual_handled_wires_into_perform_player_order`: zielony.
- `siege_tower_climb_matches_pin_step_vectors`: 450/450 zgodne (ret, done, pozycja, `onWallWalkway`, `moveLeft` z NaN,
  `wallEverBreached`, log WYŁOM, `occByKey`); tak ≥ 30 (39 + 45 w rozkazach), nie 411, wyłom 30, NaN 25.
- `siege_manual_order_mutants_are_killed_by_vectors`: M0 (kopia) 0 rozbieżności; 12/12 mutantów zabitych
  (liczba rozbieżnych przypadków): M1 odwrócona strona w bramce 1026, M2 `move` przez bramkę 104, M3 taran przy
  otwartej bramie 35, M4 odwrócone `doctrineAuto` 267, M5 pominięty `shootingEnabled` 9, M6 brak `onWallWalkway` 104,
  M7 piechota-do-wieży przed wspinaczką 598, M8 podejście ograniczone także dla `none`/`hold` 126, M9 cel `routed`
  uznany za żywy 2, M10 cel = pozycja bez `none` 7, M11 zły `return` w podejściu ograniczonym 12, M12 koniec funkcji
  zwraca `true` 286.
- `siege_tower_climb_mutants_are_killed_by_vectors`: M0 0 rozbieżności, 7/7 zabitych (`onWallWalkway`, `mounted`,
  zły rząd wieży, kafel muru, zajęta korona, brak wyłomu, brak `moveLeft = 0`).

Bramki engine (D-416-4; client/renderer nie zmieniane — nie uruchamiane):
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-fail-fast`: EXIT 0; 561 binarek testowych, 4389 passed, 0 failed, 1 ignored
  (istniejący `#[ignore]` sprzed tematu, nie dodany w #416). Istniejące wektory (`vectors.json`, `speed_vectors`,
  `speed_change*`, `tower_due_order`, `move_order*`, `attack_order`) bez regresji (te same testy zielone, pliki bez zmian).

## BLOKADY
Brak.

## NIE_ZMIERZONO (jawnie)
1. Pełne marsze podfunkcji poza pierwszym krokiem: generator zatrzymuje marsz na pierwszym `_doMove` (stub bez
   callbacku); dalsze kroki `_siegeWalkTo` są pokryte wektorami K1b/K3, nie #416. `towerAtWallRows` po wywołaniu
   porównywane tylko, gdy pin nie wykonał kroku marszu.
2. `_rangedTargetInRange`, `_targetInRange`, `_siegeSafeApproach`: wyniki wzięte z pinu (ich porty są poza H3;
   `_targetInRange` ma port w K5LOOP-OUTCOME, `_siegeSafeApproach` cel BFS w K1 — złożenie z H3 nie zmierzone).
3. Skutek uboczny `_effectiveMetaForUnit` → `_ensureGroupMeta(groupId)` (dopisanie domyślnego wpisu `_groupMeta`):
   nie wykonywany w porcie (należy do wołającego, H4/T5); na decyzję nie wpływa.
4. `ru.group.position` / `hpBarGroup` (render) w `_trySiegeTowerClimb`: poza zakresem (render).
5. Bitwy w czasie rzeczywistym z ręcznym rozkazem oblężniczym: celowo nie generowane (D-416-3).

## Mapa pozostałych kroków (H4/T5, #417)
- `_activateUnit` tryb ręczny: `:6066-6069` (`_manualMode && _isPlayerSide(ru.side)` → `_performPlayerOrder(ru, done)`).
- `_performPlayerOrder` `:18280-18428`: `hold` `:18282-18285`, oblężenie ręczne `:18286` (tu: H3), `none`
  `:18287-18296`, `move` (T3), `attackMove`/`attack` (T4).
- Wołający kolejki rozkazów UI: `:18076-18083` i `:18116-18123` (`finish` czyści/odświeża rozkaz), `_executeUnitsImmediate`
  `:18600-18612` (busy-gate 40 ms, `acted`).
- AUTO oblężenia (te same podfunkcje, osobny wołający): `:6179-6180` (`_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`),
  `:6192` (`_siegeRamTowerStep`).
- Do H4: produkcyjny wołający `siege_manual_order_step` w ciele pętli (ProdBody), wykonanie decyzji (`_doAttack`,
  `done`, czyszczenie rozkazu, render kolejki), `_ensureGroupMeta`, porty `SiegeTargets` (`_rangedTargetInRange`,
  `_targetInRange`, `_siegeSafeApproach` z marszem).

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator (`02-evaluator.md`) na gałęzi `rust-port-wip/416-siege-manual-q1`.

## DEPLOY/PUSH
NIE WYKONANO (Operator nie pushuje i nie integruje).
