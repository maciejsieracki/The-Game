# K5DOC-T4 — ROZPOZNANIE: ruch pieszego (`_advanceStep`) — #258 (#123 zablokowany)

**Rodzaj:** rozpoznanie, tylko odczyt. Bez zmian kodu, bez `cargo`, bez push do `rust-port/parity-v2`.
**Baza:** `origin/rust-port/parity-v2` = `0fccd8dbf` (worktree odłączony od tej bazy).
**Pin (web, tylko odczyt):** `07d2fbd72`, plik `gra/src/battle/battleScene.ts`.
**Dispatch:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4-ROZP-Q1/00-dispatch.md`, który leży na gałęzi `claude/rust-sivvrn` (`origin/claude/rust-sivvrn` = `01584aab6`), a nie w `parity-v2`.
**Werdykt:** PASS-WITH-NOTES (szczegóły: sekcja 8).

Numery linii pinu odczytane przez `grep -n` i `sed -n`. Mogą różnić się o kilka linii od numeracji w komentarzach kodu Rust. Oznaczenie **NIE_ZMIERZONO** wskazuje miejsca, których nie sprawdzono.

---

## 1. Co jest zablokowane i dlaczego

* `siege_tactics_activate.rs` (`activate_unit`, gałąź U7.9 melee, ok. linia 474): gdy nie ma celu w zasięgu i jednostka nie jest konna ani falangą, maszyna emituje `ActivateEvent::AdvanceStep`. Odpowiada to pinowi `:6293-6298`, gdzie `_advanceStep(ru, done)` jest wywoływane po `_targetInRange` i `_doAttack`.
* `siege_tactics_loop.rs` (`ProdBody::start`, ok. linii 1460-1485): zdarzenia spoza zakresu trafiają do `skipped`. `prod_tag(AdvanceStep)` zwraca `"krok-naprzod"`. Potem `pend.attack = None` i `return 0.0`. Jednostka nic nie robi, a ścieżka trafia do `ProdBody::unported`. Dokładnie to opisuje komentarz w nagłówku sterownika (ok. linii 960-975).
* `AdvanceStep` jest też emitowany z innych miejsc pinu, których Rust jeszcze nie obsługuje:
  * falanga bez sąsiadów, pin `:6556` (`_phalanxAction` -> `_advanceStep`). Rust: `PhalanxAction` (T7, #261);
  * doktryna `steady`/`aggressive`, pin `:18023`, `:18048` (`_executeGroupDoctrineStep`). Rust: `ProdOps::doctrine_step` zwraca `false` (T8, #264).
* Dispatch pyta o `siege_tactics_move` i `skipped`. Plik `siege_tactics_move` nie istnieje w Rust. Marsz oblężniczy jest w `siege_tactics_walk.rs` (K1b). Liczenie `skipped` jest w `siege_tactics_loop.rs`.

---

## 2. Tabela: pin ↔ Rust

Legenda: **PORTED** = jest port 1:1 z wektorami. **CZĘŚCIOWO** = jest port, ale zakres albo semantyka się różni. **BRAK** = brak w Rust.

| # | Funkcja / blok pinu | Linie pinu | Stan w Rust (`parity-v2`) | Uwagi |
|---|---|---|---|---|
| 1 | `_advanceStep(ru, done)` | 8198-8290 | BRAK | Emisja `AdvanceStep` jest w `siege_tactics_activate.rs` (U7.9). Konsument `ProdBody` pomija zdarzenie. |
| 2 | Blok C-FLANK (`desiredDir`, `already`, `_doMove` + `_schedule`) | 8207-8244 | CZĘŚCIOWO | `desired_hit_for_direction` = PORTED (`siege_tactics_doctrine_target.rs:40`). Reszta BRAK. |
| 3 | `_firstStepTowardDirectedAttack` | 8509-8563 | BRAK | Używane tylko przy `attackDirection` = bok/tyl. Wymaga `relative_hit` (PORTED, `siege_tactics_inputs_pos.rs:205`). |
| 4 | `_canAttackFrom(ru, col, row)` | 8436-8447 | BRAK (jako funkcja domeny) | Jest tylko metoda traitu `AutoBatchEnv::can_strike_target_from` (`siege_tactics_autobatch.rs:284`), bez konkretnej implementacji. |
| 5 | `_makeCanAttackFromTest` (test celu bez `target`) | ok. 8452-8485 | BRAK | Dla zasięgu `<= 4` skanuje sąsiedztwo, dla większego zasięgu iteruje po wrogach. Filtr `_meleeBlockedByWall` jest PORTED (`siege_city_fortification.rs:66`). |
| 6 | `_canStrikeTargetFrom(ru, col, row, target)` | 8487-8500 | BRAK (konkretnie) | Trait w autobatch, bez implementacji produkcyjnej. |
| 7 | `_firstStepAlongPathToAttack(ru, allowFirstStep?, target?)` | 8565-8617 | BRAK | BFS z rodzicami. Ma `allowFirstStep` tylko dla pierwszego kroku, filtr `occByKey`, `_passableForUnit`, regułę muru (`wallCol-1`). Najbliższy odpowiednik to `bfs_first_step` (`siege_tactics_walk.rs:116`), ale **nie jest zamiennikiem**: brak `allowFirstStep`, brak rekonstrukcji przez rodziców, brak reguły muru. |
| 8 | `_firstStepTowardMelee(ru)` | ok. 8625-8680 | BRAK | Wspólny helper: wg komentarza przy tej funkcji strzelec też z niego korzysta (zbliża się do linii wroga). Wpływa na #260 (T5b). |
| 9 | `_stepToward(ru, target)` (greedy fallback) | 8413-8434 | BRAK | Używane, gdy BFS nie zwróci kroku. Sprawdza `occByKey` i `_passableForUnit`, minimalizuje odległość Manhattan do celu. |
| 10 | `_compactAttackAllowsStep(ru, col)` | 8139-8172 | PORTED | `player_order_move_gate.rs:100` `compact_attack_allows_step`, z `compact_line_allows_advance` (`formation_rules.rs:423`). Wejście `line` musi być przygotowane przez wołającego (`in_play` = `!dead && !fadingOut && !removed && !routed`). |
| 11 | `_shouldAvoidAutoBacktrack(ru)` | 8191-8196 | PORTED | `player_order_move_gate.rs:177` `should_avoid_auto_backtrack`. Pole `lastAutoMoveFrom`: `siege_tactics_doctrine_state.rs:61`. |
| 12 | `_effectiveMetaForUnit(ru)` | 17633 | BRAK (jako funkcja) | W Rust wołający podaje `doctrine` jako wejście (`CompactStepUnit`). Brak portu samej funkcji. |
| 13 | `_doMove(ru, col, row, done)`: bramka odmowy | 8689-8693 | PORTED | `siege_tactics_walk.rs:208` `do_move_gate` + `siege_move_refused` (`siege_tactics_approach.rs`). |
| 14 | `_doMove`: przeniesienie w `occByKey`, `ru.q/ru.r` | 8699-8706 (okolice) | BRAK w `ProdBody` | Komentarz w `siege_tactics_loop.rs` mówi wprost: „occByKey (brak konsumenta w ProdBody)”. Jedyny `impl WalkWorld` to `TowerWalk` (`siege_tactics_tower.rs:247`). |
| 15 | `_doMove`: koszt wejścia `_moveCostForUnit` | 7436-7444 (wywołanie w 8700-8716) | BRAK | **Uwaga:** `siege_tactics_tower.rs:47` `move_cost` to atrapa harnessu (`COST[(3c+5r) mod 5]`, komentarz „atrapa harnessu”). **Nie wolno jej reużyć** w T4. |
| 16 | `_passableForUnit(ru, col, row)` | 7446-7449 | BRAK | Pin: `Number.isFinite(_moveCostForUnit)`, czyli teren + mnożnik konnych. `TowerWalk::passable_free` (`siege_tactics_tower.rs:256`) używa zbiorów `occupied`/`blocked`, a nie terenu. |
| 17 | `_doMove`: bród (`isFordTile`, `BROD_RUCH_MULT`) | 8716-8720 (okolice) | CZĘŚCIOWO | `is_ford_tile` = PORTED (`siege_tactics_inputs_pos.rs:227`). Mnożnik ruchu: NIE_ZMIERZONO, czy `data/units_combat.rs:228` (`ruch_mult`) to ten sam wpis co `BROD_RUCH_MULT`. |
| 18 | `_doMove`: `_updateFacing(ru)` po kroku | 8721-8723 (okolice) | CZĘŚCIOWO | `ProdBody::update_facing` (`siege_tactics_loop.rs:1252`) jest, ale wywoływane tylko na zdarzeniu `UpdateFacing` na początku aktywacji. Po kroku nie. |
| 19 | `_doMove`: tryb planowania `_autoBatchPlanning` | 8694-8712 | PORTED | `siege_tactics_autobatch.rs` (`planning_move`). |
| 20 | `_doMove`: animacja, `busy`, `_raf`, `MOVE_STEP_MS = 240` | 8724-8786; stała `:1010` | BRAK (efekt sceny) | Według kontraktu K1b (`siege_tactics_walk.rs:9-16`) animacja zostaje po stronie sceny. Czas trzeba przenieść do `VirtualClock`. |
| 21 | `_schedule(STEP_GAP_MS, ...)`, `STEP_GAP_MS = 70` | 9595-9606; `:1011` | PORTED | `siege_tactics_clock.rs` (`VirtualClock`); `siege_tactics_walk.rs:35` `STEP_GAP_MS`. |
| 22 | Gałąź U7.9 melee (`_targetInRange` -> `_doAttack` -> `_advanceStep`) | 6293-6298 | CZĘŚCIOWO | Emisja w `activate.rs` PORTED. Cel to wejście adaptera (`ProdUnit::melee_target`), nie `target_in_range`. |
| 23 | `_targetInRange(ru)` | 8373-8410 | PORTED, ale NIEPODPIĘTE | `siege_tactics_doctrine_target.rs` `target_in_range`. `ProdOps::target_in_range` zwraca `self.melee_target` (wejście adaptera). |
| 24 | `_nearestEnemy(ru)` | (wiele miejsc) | BRAK w `ProdBody` | `ProdOps::nearest_enemy_pos` zwraca `None` (`siege_tactics_loop.rs:1037`). Zadanie #107 (K5LOOP-FACING). |
| 25 | `_pickTargetByPriority`, `_pickAdjacentTargetByPriority` | 17523-17569 | PORTED | `siege_tactics_doctrine_target.rs:232`, `:257`. |
| 26 | `_bfsFirstStep` / `_siegeWalkTo` (marsz do celu oblężniczego) | 7973-8003; 8006-8020 | PORTED | `siege_tactics_walk.rs:116` (`bfs_first_step`), `siege_walk_to` w tym samym pliku (K1b). Dotyczy marszu oblężniczego, **nie** `_advanceStep`. |
| 27 | Falanga bez sąsiadów -> `_advanceStep` | 6556 | BRAK | `PhalanxAction` = T7 (#261). |
| 28 | Doktryna steady/aggressive -> `_advanceStep` | 18023, 18048 | BRAK | `DoctrineStep` = T8 (#264). `ProdOps::doctrine_step` = `false`. |

---

## 3. Szczegóły pinu wymagane przez port

### 3.1 `_advanceStep` (8198-8290), kolejność decyzji

1. Warunki wstępne: `finished` -> done; `dead`/`fadingOut` -> done; `moveLeft <= 0` -> done.
2. **C-FLANK** (tylko gdy `desiredHitForDirection(attackDirection)` nie jest `null`):
   * cel = `_pickTargetByPriority(ru) ?? _nearestEnemy(ru)`;
   * jeśli już jest w pozycji (`_canStrikeTargetFrom` i `relativeHit` = kierunek) -> done;
   * krok = `_firstStepTowardDirectedAttack`; jeśli jest: `_doMove`, potem albo done (gdy `_canAttackFrom`), albo `_schedule(STEP_GAP_MS)` gdy `moveLeft > 0`, albo done;
   * jeśli nie ma kroku, przechodzi do zwykłego marszu czołowego.
3. Jeśli `_canAttackFrom(ru, ru.q, ru.r)`: `_pickAdjacentTargetByPriority` -> `_doAttack` albo done.
4. `target = _nearestEnemy(ru)`; brak -> done.
5. `avoidAutoBacktrack = _shouldAvoidAutoBacktrack(ru)`.
6. `stepKey = _firstStepAlongPathToAttack(ru, allow, undefined) ?? _stepToward(ru, target)`, gdzie `allow(q,r) = _compactAttackAllowsStep(ru,q) && !(avoidAutoBacktrack && lastAutoMoveFrom == (q,r))`.
7. Brak kroku -> done.
8. `if (!_compactAttackAllowsStep(ru, nc)) done()`. Ta bramka działa także dla kroku zachłannego, który nie przeszedł filtru BFS.
9. `previousPosition` = `(ru.q, ru.r)` przed krokiem, tylko gdy `avoidAutoBacktrack`.
10. `_doMove(ru, nc, nr, cb)`. W `cb`: zapis `lastAutoMoveFrom = previousPosition`; `finished` -> done; `_canAttackFrom` -> done; `moveLeft > 0` -> `_schedule(STEP_GAP_MS, _advanceStep)`; w przeciwnym razie done.

**Różnica do zapamiętania:** w pinie `allowFirstStep` obejmuje tylko pierwszy krok BFS. Dalsze kroki BFS mogą przechodzić przez kafle, które bramka kompaktu by odrzuciła. Port musi zachować tę asymetrię, bo inaczej zmieni trasę.

### 3.2 `_doMove` (8685-8786), efekty do odtworzenia

* Bramka odmowy (`siegeWallCol >= 0 && _siegeMoveRefused`): `moveLeft = 0`, `done()`. **PORTED.**
* Zmiana zajętości: `occByKey.delete(stary)`, `occByKey.set(nowy)`. **BRAK w `ProdBody`.**
* `ru.q/ru.r` = nowe; `moveLeft -= stepCost`, gdzie `stepCost = enterCost` lub `enterCost / BROD_RUCH_MULT` przy bродzie na jednym z końców kroku. `enterCost = max(1, min(_moveCostForUnit, 99))`. **BRAK.**
* `_updateFacing(ru)`. **CZĘŚCIOWO.**
* Animacja i `busy` (sceniczne). Zegar: `MOVE_STEP_MS = 240` do `VirtualClock`. **Do zrobienia.**

---

## 4. Co już istnieje i można reużyć bez zmian

* `compact_attack_allows_step`, `should_avoid_auto_backtrack`, `dest_allowed_by_blockade`: `player_order_move_gate.rs` (K5EXEC-T2, wektory `p6_player_order_move_gate_gen.mjs`).
* `do_move_gate`, `siege_move_refused`, `bfs_first_step`, `siege_walk_to`, `STEP_GAP_MS`: `siege_tactics_walk.rs`, `siege_tactics_approach.rs`.
* `desired_hit_for_direction`, `pick_target_by_priority`, `pick_adjacent_target_by_priority`, `target_in_range`: `siege_tactics_doctrine_target.rs`.
* `relative_hit`, `is_ford_tile`: `siege_tactics_inputs_pos.rs`.
* `VirtualClock`: `siege_tactics_clock.rs`.
* `ActivateEvent::AdvanceStep` i gałąź U7.9: `siege_tactics_activate.rs`.

**Nie reużywać:** `siege_tactics_tower::move_cost` (atrapa), `TowerWalk::passable_free` (zbiory zamiast terenu).

---

## 5. Lista brakujących elementów

1. **Terenowe `_moveCostForUnit` i `_passableForUnit`** (pin 7436-7449). Wymaga wejścia terenu (`terrainMap.passable`, `moveCost`, `combatTerrainName` dla konnych). NIE_ZMIERZONO, czy `pathfinding.rs:1590` (`move_cost_fn_for`) jest odpowiednikiem dla bitwy. Trzeba to sprawdzić, zanim ktokolwiek zacznie T4c.
2. **Zajętość `occByKey` w `ProdBody`** i implementacja `WalkWorld::do_move` (albo odpowiednik) dla jednostki pieszej. Bez tego krok nie przenosi jednostki.
3. **`_firstStepAlongPathToAttack`** (8565-8617) z `allowFirstStep`, regułą muru (`wallCol-1`) i rekonstrukcją przez rodziców. Razem z `_canAttackFrom`, `_makeCanAttackFromTest`, `_canStrikeTargetFrom` (8436-8500). To jest rdzeń T4a.
4. **`_stepToward`** (8413-8434), greedy fallback.
5. **`_firstStepTowardDirectedAttack`** (8509-8563), C-FLANK. Potrzebne tylko dla bok/tyl.
6. **Konsument `AdvanceStep` w `ProdBody`** i orkiestracja łańcucha kroków (`_schedule` między krokami). `ProdBody::start` zwraca czas trwania synchronicznie. Łańcuch wielu kroków wymaga decyzji o kontrakcie: planowanie na klonie (jak `siege_tactics_autobatch`) albo zdarzenia czasowe w `VirtualClock`. To jest zakres **#284** (ActivateOps: zmiana kontraktu, status: pending).
7. **Facing po kroku** (`_updateFacing` w `_doMove`). Zależy od #107 (K5LOOP-FACING).
8. **Cel i odległość**: `_nearestEnemy` i `_targetInRange` są w `ProdOps` jako zaślepki (`None` i adapter). Zależy od #107 i #109.

---

## 6. Proponowany podział na mniejsze tematy

| Temat | Zakres | Zależności |
|---|---|---|
| **T4a** — helpery ścieżki | `first_step_along_path_to_attack` (+ `allowFirstStep`, mur), `can_attack_from`, `can_strike_target_from`, `step_toward`. Czyste funkcje, bez sceny. Wektory z pinu 8413-8617 i ok. 8625-8680. Wspólny helper dla T5b (#260). | Brak (wejścia jawne: mapa zajętości, przeszkody, wrogowie, mur). |
| **T4b** — decyzja `_advanceStep` | Czysta funkcja `advance_step_decide` zwracająca `Done` / `Attack` / `Move{col,row,then}`, analogicznie do `walk_decide`. Bez C-FLANK. Wektory: sekwencje pinu z podstawionym `_doMove`/`_schedule`. | T4a, `compact_attack_allows_step` (PORTED), `should_avoid_auto_backtrack` (PORTED). |
| **T4c** — efekty `_doMove` w `ProdBody` | Zajętość, koszt terenu (`_moveCostForUnit`, `_passableForUnit`), bród, facing po kroku, `moveLeft`. | Terenowy port kosztu i przechodzenia (pkt 1 z sekcji 5); #107 (facing). |
| **T4d** — C-FLANK | `_firstStepTowardDirectedAttack` i gałąź `desiredDir`. Może zostać wydzielone, bo dotyczy tylko bok/tyl. | T4a, `relative_hit` (PORTED). |
| **T4e** — wpięcie w `ProdBody` | Konsumpcja `AdvanceStep` zamiast `skipped`, łańcuch kroków, czas `STEP_GAP_MS` / `MOVE_STEP_MS` w `VirtualClock`. | T4b, T4c, **#284** (kontrakt `ActivateOps`), #107, #109. |

**Kolejność:** T4a -> T4b -> T4c -> T4e; T4d może iść równolegle po T4a.
**Ścieżki zależne od T4:** T7 falanga (#261, `PhalanxAction` -> `_advanceStep`, pin 6556), #123 (K5LOOP-RUCH, facing po krokach), T5b (#260, wspólny `_firstStepTowardMelee`).
**Zależności od innych tematów:** #257 (T5a, kite) nie blokuje T4, ale dzieli helpery z T5b. #259 (T6, jazda) ma własne ścieżki; nie blokuje T4.

---

## 7. Wejścia do wektorów (generator wykonujący wycinek pinu)

Wzorzec do naśladowania: `rust-port/engine/tests/p6_player_order_move_gate_gen.mjs` (kod z pinu) albo `p6_siege_tactics_tower_gen.mts` (z kontrolą SHA).

Wejścia sceny i jednostki:

* `finished` (bool), `dead`, `fadingOut`, `moveLeft` (**tylko skończone wartości**: pin dla NaN w marszu zapętla się, zob. notatkę w `P6-SIEGE-TAKTYKA.md`, wiersz 30);
* `q`, `r`, `side` (atk/def), `mounted`, `siege`, `phalanx`, `formationRank`, `rangedBase`, `range`, `canShoot`, `shootingEnabled`;
* lista wrogów i sojuszników (`dead`, `fadingOut`, `routed`, `removed`), `occByKey` jako zbiór;
* `siegeWallCol`, `siegeGateRow`, `wallEverBreached` (dla `_siegeMoveRefused`);
* `attackDirection` (front/bok/tyl), `facing`, `lastAutoMoveFrom`, `groupMeta` i `unitDoctrine` (dla `_effectiveMetaForUnit`);
* terrain: `passable`, `moveCost`, `combatTerrainName` (dla konnych), `isFordTile`.

Wyjścia do porównania:

* sekwencja wywołań: `_doMove(col,row)` (z wynikiem bramki), `_schedule(70, …)`, `done()`;
* końcowe `q`, `r`, `moveLeft`, `facing`, `lastAutoMoveFrom`, zawartość `occByKey`.

Stałe: `STEP_GAP_MS = 70` (`:1011`), `MOVE_STEP_MS = 240` (`:1010`).

---

## 8. Werdykt i uwagi

**Werdykt: PASS-WITH-NOTES.**

Rozpoznanie jest kompletne dla tematu. Blokada #123 to brak trzech rzeczy: (a) BFS do celu ataku z regułami kompaktu i muru, (b) efektów `_doMove` w `ProdBody` (zajętość, koszt terenu, facing), (c) kontraktu łańcucha kroków w `ActivateOps`/`ProdBody` (#284). Żadna z nich nie jest niemożliwa do wykonania. Trzeba je rozdzielić zgodnie z sekcją 6.

**Ryzyka i uwagi:**

* Atrapa `move_cost` w `siege_tactics_tower.rs:47` nie może wejść do T4c. Jeśli ktoś ją reużyje, wyniki ruchu będą błędne.
* Asymetria `allowFirstStep` (tylko pierwszy krok) jest łatwa do pominięcia. Port musi ją zachować.
* Mnożnik brodu (`BROD_RUCH_MULT`) i jego źródło w danych: NIE_ZMIERZONO.
* Odpowiednik `_moveCostForUnit` w `pathfinding.rs:1590`: NIE_ZMIERZONO.

**Czego nie zrobiono (NIE_ZMIERZONO):**

* Nie uruchamiano `cargo` ani testów (zgodnie z dispatchem).
* Nie odczytano w całości `_firstStepAlongPathToAttack` (8565-8617) ani ciała `_firstStepTowardMelee` (ok. 8625-8680); odczytano tylko początek i koniec.
* Nie odczytano pól `ActivateUnit` w `siege_tactics_activate.rs` ponad to, co potrzebne do U7.9.
* Numery linii pinu mogą różnić się o 1-2 linie od stanu po ewentualnym rebase pinu.
