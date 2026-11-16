STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1 (runda 1, obrona Operatora wobec zarzutów Evaluatora)
GOAL: Odpowiedzieć na każdy z 8 zarzutów z 01-rozpoznanie.md: PRZYJMUJĘ (poprawka w tym pliku + dowód) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1/02a-obrona.md`). Kod, `rust-port/`, `gra/`, `origin/main` nietknięte. 01-rozpoznanie.md NIE zmieniany; poprawki są w §2 niżej i mają pierwszeństwo przed tabelą z 01.
TESTY: NIE DOTYCZY (tryb wyłącznie odczyt, bez cargo). Dowody: `git show 07d2fbd72:gra/src/battle/battleScene.ts` (eksport do scratchpad, 20771 linii), `git grep` w `rust-port/engine/src`, odczyt plików Rust `sed -n`.
BLOKADY: NIE_ZMIERZONO wskazane wprost w §2 (zarzut 5, normalna ścieżka zdjęcia `busy`; zarzut 8, sposób wydobycia wartości z pinu przez generator).
RUNDY: 1/5 (obrona w rundzie 1)
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki; orkiestrator decyduje o kolejności tematów wg §3 (kolejność z 01 jest zmieniona).
DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push, bez integracji).
Baza: `origin/rust-port/parity-v2` = `474487792`. Commit Operatora: `f373952ff` (gałąź `R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1-wip`). Obrona na gałęzi `R-RUSTPORT-P6-K5-AUTO-EXEC-ROZP-Q1-obrona-r1`.

---

## 1. Odpowiedzi na zarzuty

| # | Zarzut | Werdykt | Dowód |
|---|---|---|---|
| 1 | `_compactAttackAllowsStep` błędnie BRAK; rdzeń portowany jako `compact_line_allows_advance` | PRZYJMUJĘ | §2.1 |
| 2 | `_adjacentEnemy` / `_pickAdjacentTargetByPriority` opisane bez czytania ciała; zależności niezmapowane | PRZYJMUJĘ | §2.2 |
| 3 | Fałszywie: brak pola `acted` w `TurnSeqState`; semantyka `acted` pominięta | PRZYJMUJĘ | §2.3 |
| 4 | `runNext` utożsamione z `begin_turn`/`activate_next`; brak uwagi o kontrakcie traita | PRZYJMUJĘ | §2.4 |
| 5 | `siege_tactics_autobatch.rs:768` podane jako zdejmowanie `busy` po ruchu/ataku; to reset awaryjny | PRZYJMUJĘ | §2.5 |
| 6 | Kryterium 2 (grep per wiersz) niedomknięte; zdanie „poza siege_tactics_*” błędne | PRZYJMUJĘ | §2.6 |
| 7 | Brak drzewa wywołań `_performPlayerOrder`; zależność T3/T4 odwrócona | PRZYJMUJĘ | §2.7 |
| 8 | Allowlisty niekompletne (`mod.rs`, katalog wektorów, `activate.rs` przy zmianie traita) | PRZYJMUJĘ | §2.8 |

Odrzuconych zarzutów: 0. Wszystkie 8 przyjęte; poprawki poniżej. Zarzut 6 i 7 wymagają zmiany kolejności tematów (§3).

---

## 2. Poprawki i dowody

### 2.1 (zarzut 1) `_compactAttackAllowsStep`, pin 8139

- Pin: `8139` `private _compactAttackAllowsStep(ru, candidateCol)`; wewnątrz `8166` wywołuje `compactLineAllowsAdvance({...})` (import pin `:256` z `./formationRules`).
- Rust: `rust-port/engine/src/domain/formation_rules.rs:423` `pub fn compact_line_allows_advance(side, candidate_col, ...)`. Komentarz w pliku: web `formationRules.ts:148-160`.
- Poprawiona klasyfikacja: **PARTIAL** — rdzeń (`compactLineAllowsAdvance`) = PORT-JEST (`formation_rules.rs:423`); opakowanie w pinie `8139-8170` (zbudowanie argumentów z `ru`, pozycji i stanu grupy) = BRAK.
- Konsekwencja: T2 ma **reużyć** `compact_line_allows_advance`, nie portować go ponownie. Allowlista T2 nie obejmuje `formation_rules.rs` (edycja nie jest potrzebna, tylko wywołanie).

### 2.2 (zarzut 2) `_adjacentEnemy` / `_pickAdjacentTargetByPriority`

Ciało przeczytane (pin):
- `17481` `_adjacentEnemy(ru)` = `_pickAdjacentTargetByPriority(ru)` (jedno wywołanie, `17482`).
- `17545-~17585` `_pickAdjacentTargetByPriority(ru)`: filtr `this._enemiesOf(ru)` po `manhattan(...) === 1` (`17546`); `bestByPriority` po `this._priorityScore(ru, e)` z tiebreakiem `e.bu.hp`; w `~17563` gałąź C-FLANK: `relativeHit(e.facing, ru.q, ru.r, e.q, e.r) === desired` (kierunek natarcia `desired`).
- `17512` `_priorityScore(ru, enemy)`: `_unitBattleClass(ru)`, `_prefsForUnit(ru)`, `_unitBattleClass(enemy)`, `prefs.indexOf`, premia `+0.45` gdy `ac === 'mounted' && enemy.antiCavSpear`.
- `17496` `_prefsForUnit(ru)`: gdy `ru.useUnitPriorities`, czyta `ru.unitTargetPriorities?.[ac]` (długość 3); w przeciwnym razie `this._targetPriorities[ac]` (domyślna tabela `2328`, zapis `13285-13296`).
- `17486` `_unitBattleClass(ru)`: `ru.mounted` → `'mounted'`; `ru.primaryRanged || ru.rangedBase` → `'ranged'`; inaczej `'melee'`.
- `antiCavSpear` ustawiane w `4558`, `4713`, `5469` (`isAntiCavSpear(bu)`).

Rust (odpowiedniki):
- `_enemiesOf` = PORT-JEST `rust-port/engine/src/domain/siege_tactics_loop.rs:976` `fn enemies_of`.
- `relativeHit` = PORT-JEST `rust-port/engine/src/domain/siege_tactics_inputs_pos.rs:205` `pub fn relative_hit` (używane też w `siege_tactics_loop.rs:46,1188`).
- `_unitBattleClass`, `_prefsForUnit`, `_priorityScore`, `_pickAdjacentTargetByPriority`, `_adjacentEnemy`, tabela `_targetPriorities`: BRAK (logika gry, grep `priority|battle_class` w `engine/src` nie daje odpowiedników obejmujących tę semantykę — do potwierdzenia w T3).

Poprawiona klasyfikacja: `_adjacentEnemy` / `_pickAdjacentTargetByPriority` / `_priorityScore` / `_prefsForUnit` / `_unitBattleClass` = **BRAK** (logika), zależności: `relative_hit` PORT-JEST, `enemies_of` PORT-JEST, reszta BRAK. Wymagane pola jednostki w Rust: `mounted`, `primary_ranged`/`ranged_base`, `anti_cav_spear`, `use_unit_priorities`, `unit_target_priorities`, tabela priorytetów klas — NIE_ZMIERZONO, czy istnieją w `ProdUnit`/`TurnSeqState` (do sprawdzenia w T3).

### 2.3 (zarzut 3) pole `acted`

Dowód obecności pola w Rust:
- `rust-port/engine/src/domain/siege_tactics_unit.rs:53` `pub acted: bool` (model jednostki, inicjalizacja `:129`).
- `rust-port/engine/src/domain/siege_tactics_turnseq.rs:268` reset `u.c.acted = false` (początek tury); `:306` filtr wyboru `alive_power(&su.c) && !su.c.acted`; `:352` `st.unit_mut(unit).c.acted = true` w `activation_done`.
- `siege_tactics_autobatch.rs:589` `u.c.acted = true`; `:328-329` `unit_alive_and_unacted`.
- `siege_tactics_loop.rs:1368` `c.acted = true` (`_startRout`).

Różnica semantyczna (poprawka):
- Pin `_executeUnitsImmediate` `18608-18610`: `this._performPlayerOrder(u, () => { u.acted = true; runNext(idx + 1); })` — ustawienie **bezwarunkowe** po `done`.
- Rust `activation_done` (`turnseq.rs:344-353`): przy `auto_battle_suspended` kończy bez ustawienia `acted`; gdy `idle_player_unit` (`manual_mode && is_player_side && env.player_unit_idle`) **nie** ustawia `acted`. To odpowiednik pinu `_activateUnit` (warunkowe `acted`), nie `_executeUnitsImmediate`.
- Wniosek dla T1: `_executeUnitsImmediate` wymaga osobnej ścieżki zapisu `acted = true` bezwarunkowo; nie wolno reużyć `activation_done`.

### 2.4 (zarzut 4) `runNext` a `begin_turn`/`activate_next`

- Pin: `_executeUnitsImmediate` wywoływane z: `3610` (`_executeQueuedOrders`, `3603`), `18649` (`_issueBattleAttack`, `18635`), `18677` (`_issueBattleMove`, `18654`), `18699` (`_issueBattleAttackMove`, `18682`). Są to natychmiastowe kolejki rozkazów gracza poza sekwencją tury (`TurnSeqState`), a nie aktywacje z `_activateNext`.
- Rust punkt wejścia do `_performPlayerOrder`: `rust-port/engine/src/domain/siege_tactics_activate.rs:117` `fn perform_player_order(&mut self) -> bool;` (trait `ActivateOps`), wołany w `:238-240` wyłącznie w gałęzi `scene.manual_mode && scene.is_player_side` ścieżki `_activateUnit`. Produkcyjna implementacja: `siege_tactics_loop.rs:773` `ProdOps::perform_player_order` → `false` (atrapa).
- Wniosek: **w silniku nie ma żadnego wejścia dla `_executeUnitsImmediate`**. Trait nie przyjmuje jednostki ani `done` (`perform_player_order(&mut self) -> bool`), więc T1 wymaga zmiany kontraktu: nowy trait (np. `PlayerOrderOps::perform_for_unit(unit, done) -> bool`) albo rozszerzenie `ActivateOps`. Zmiana sygnatury dotyka `siege_tactics_activate.rs` — patrz §2.8.

### 2.5 (zarzut 5) zdejmowanie `busy`

- `rust-port/engine/src/domain/siege_tactics_autobatch.rs:768` jest w `halt_auto_battle_turn` (komentarz: web `_haltAutoBattleTurn`, `battleScene.ts:17333-17344`) — reset awaryjny, NIE zdjęcie po ruchu/ataku.
- `siege_tactics_turnseq.rs:346` (`st.busy = false` w gałęzi `auto_battle_suspended` w `activation_done`) — gałąź przerwania, NIE zdjęcie po ruchu/ataku.
- `git grep -n 'busy = \|\.busy = ' -- rust-port/engine/src` daje wyłącznie te dwa trafienia. Normalna ścieżka zdjęcia `busy` po zakończeniu ruchu/ataku w Rust: **NIE_ZMIERZONO** (nie znaleziono przypisania; nie ustalono, czy odbywa się przez env/callback poza silnikiem).
- Pin: linie `8715`, `9097`, `9180`, `9228` (ustawienia `busy` w ruchu/ataku) NIE sprawdzałem w tej obronie — nie są dowodem w tym pliku.

### 2.6 (zarzut 6) `git grep` per wiersz i zdanie o `siege_tactics_*`

Odtwarzalne liczniki (`git grep -rn -- <nazwa> rust-port/engine/src | wc -l`, wykonane w worktree):

| Symbol | Trafienia w `rust-port/engine/src` | Uwaga |
|---|---|---|
| `_passableForUnit` | 6 | PARTIAL: `siege_tactics_walk.rs:98` `passable_free` (bez `ru`) |
| `_ensureGroupMeta` | 0 | BRAK |
| `_liveGroupMemberIds` | 0 | BRAK |
| `_orderMoveForUnits` | 0 | BRAK (stan rozkazu grupy; renderer `orders.rs` ma tylko atak-marsz) |
| `_isUnitDoctrineAuto` | 3 | BRAK (trafienia w `siege_tactics_activate.rs`/`loop.rs`, to deklaracje traita, nie logika) |
| `_firstStepOnAttackMovePath` | 0 | BRAK (pin `18570`, dodane do tabeli §2.7) |
| `occByKey` | 13 | trafienia są, ale odpowiednik semantyczny NIE_ZMIERZONO (nie czytano) |
| `cellKey` | 3 | NIE_ZMIERZONO, czy 1:1 |
| `_playerControlSide` | 2 | NIE_ZMIERZONO (trafienia do potwierdzenia w T1) |
| `_playerRoster` | 0 | BRAK |
| `blockadeActive` / `blockadeCol` | 0 / 0 | BRAK |
| `_battleRosterOrder` | 0 | BRAK (pin `20008`, używane w `_advanceToNextBattleUnit` — UI) |
| `_executeUnitsImmediate` | 0 | BRAK (punkt wejścia) |

Zdanie „0 trafień poza `siege_tactics_*`” było błędne. Polecenie `grep -rniE 'blockade|attack_move|attackmove' rust-port/engine/src` daje **1 trafienie**: `rust-port/engine/src/domain/pathfinding.rs:1172` (komentarz o blokadzie obleganego miasta, `R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1`, nie jest to blokada rozkazu z pinu `_destAllowedByBlockade`). Logika blokady rozkazu i attack-move: BRAK w silniku.

### 2.7 (zarzut 7) drzewo wywołań `_performPlayerOrder` (pin 18280-18433)

Kolejność gałęzi (pin):
- `18282` `hold` → `done()`, `return true`.
- `18286` (dla wszystkich nie-hold) `_performSiegeManualOrder(ru, ord, done)` (`18435`): BRAK (taran/wieża; w silniku `siege_tactics_tower.rs`/`ram_tower_step`, produkcja STUB).
- `18287` `none` → jeśli `_isUnitDoctrineAuto` (`17621`) i `_effectiveMetaForUnit` (`17633`) z `meta.doctrine !== 'manual'` → `_executeGroupDoctrineStep` (`17966`, STUB `loop.rs:776`); inaczej `done()`.
- `18297` `move`:
  - zapis stanu: gdy cel = pozycja → `ru.playerOrder = {type:'none'}`, `_refreshQueuedOrderVisuals`, `done` (`18299-18303`);
  - **`_adjacentEnemy` (17481) → `_doAttack` (8787), `return true` (`18306-18308`)** — gałąź `move` zależy od ataku;
  - krok: `_passableForUnit` (7446), `occByKey`, `cellKey`, `isImmediateBacktrack`, `_firstStepTowardMoveDestination` (18478), `_shouldAvoidAutoBacktrack` (8191), `_compactAttackAllowsStep` (8139), `_destAllowedByBlockade` (17809);
  - efekt: `_doMove` (8685) z callbackiem ustawiającym `ru.lastAutoMoveFrom` (`~18420`) i `_refreshQueuedOrderVisuals`, `done`.
- `18353` `attackMove`: `_attackMovePath` (18535), `_enemiesOf`, `_canStrikeTargetFrom` (8487), `_priorityScore` (17512), `_doAttack` (`~18370`), `_firstStepAlongPathToAttack` (8565), `_firstStepOnAttackMovePath` (18570), `_destAllowedByBlockade`, `_doMove`.
- `18396` `attack`: wyszukanie celu po `ord.targetId` z `!dead && !fadingOut` (`18397`); `_canStrikeTargetFrom` → `_doAttack` (`18405`); inaczej `_firstStepAlongPathToAttack` z `_shouldAvoidAutoBacktrack` i `_compactAttackAllowsStep`; `_destAllowedByBlockade`; `_doMove`.

Poprawiona zależność: **T3 (move) zależy od prymitywów ataku** (`_adjacentEnemy`, `_doAttack`, `_priorityScore`), a NIE odwrotnie. Stąd zmiana kolejności w §3.

### 2.8 (zarzut 8) allowlisty

- Dodać `rust-port/engine/src/domain/mod.rs` do każdego tematu wprowadzającego nowy moduł (istniejące deklaracje: `mod.rs:60` `formation_rules`, `:107` `siege_tactics_activate`, `:127` `siege_tactics_loop`, `:131` `siege_tactics_turnseq`; nowy moduł wymaga `pub mod`).
- Dodać test-wektory. Konwencja repo (zweryfikowana): `rust-port/engine/tests/p6_*.rs` + generator `rust-port/engine/tests/p6_*_gen.mjs` (np. `p6_combat_melee_gen.mjs`, `p6_brake_inputs_gen.mjs`) oraz wektory: katalog `rust-port/engine/tests/<nazwa>_vectors/` z `gen.mjs` + `vectors.json` (wzorzec `p4_1j_general_target_vectors/`). Allowlista T1: `rust-port/engine/tests/p6_player_order_queue.rs`, `rust-port/engine/tests/p6_player_order_queue_gen.mjs`, `rust-port/engine/tests/p6_player_order_queue_vectors/` (katalog z `vectors.json`).
- T7 (WIRING) i T1 (zmiana kontraktu traita) muszą obejmować `rust-port/engine/src/domain/siege_tactics_activate.rs` (sygnatura `:117`, wywołanie `:238-240`).
- Generator: sposób wydobycia wartości prywatnej metody z 20771-liniowej sceny (np. ręczny harness odtwarzający ciało vs. eksport wektorów z pinu w Node) — NIE_ZMIERZONO w tej obronie. Przed T1 Operator ma podać, którą metodą wektory są generowane; bez tego grozi test ręczny zamiast behawioralnego.

---

## 3. Poprawiona kolejność tematów (zamiast §4 z 01-rozpoznanie.md)

| Kolejność | Temat | Zakres | Zależy od |
|---|---|---|---|
| T1 | EXEC-QUEUE | `_executeUnitsImmediate` 18578–18614; nowy kontrakt wejścia (unit + done), bezwarunkowe `acted=true`, `busy`-gate przez `VirtualClock` (`siege_tactics_clock.rs:108`); `_performPlayerOrder` wstrzyknięte jako trait | — |
| T2 | MOVE-GATE | `_destAllowedByBlockade` 17809, `_shouldAvoidAutoBacktrack` 8191; `_compactAttackAllowsStep` 8139 jako opakowanie nad reużytym `formation_rules.rs:423` | — |
| T3 | ATTACK-PRIMITIVES | `_adjacentEnemy` 17481, `_pickAdjacentTargetByPriority` 17545, `_priorityScore` 17512, `_prefsForUnit` 17496, `_unitBattleClass` 17486, `_canStrikeTargetFrom` 8487, `_doAttack` 8787 (delegat) | T1 |
| T4 | MOVE-ORDER | gałęzie `move` 18297 i `attackMove` 18353 z `_attackMovePath` 18535, `_firstStepTowardMoveDestination` 18478, `_firstStepOnAttackMovePath` 18570 | T1, T2, T3 |
| T5 | ATTACK-ORDER | gałąź `attack` 18396, `_firstStepAlongPathToAttack` 8565 | T1, T3 |
| T6 | SIEGE-MANUAL | `_performSiegeManualOrder` 18435 | T1 |
| T7 | DOCTRINE | `_executeGroupDoctrineStep` 17966, `_isUnitDoctrineAuto` 17621, `_effectiveMetaForUnit` 17633, `_ensureGroupMeta` 17586 (osobny temat, duży) | T1 |
| T8 | WIRING | zastąpienie atrap `ProdOps::perform_player_order` (`siege_tactics_loop.rs:773`) i `doctrine_step` (`:776`); `siege_tactics_activate.rs` | T1–T7 |

Uwaga: poprzednia kolejność (T2 move-gate → T3 move → T4 attack) była błędna, bo gałąź `move` woła `_adjacentEnemy`/`_doAttack`. Decyzja o kolejności należy do orkiestratora.

---

## 4. Otwarte punkty (NIE_ZMIERZONO w tej obronie)

- Normalna ścieżka zdjęcia `busy` po ruchu/ataku w Rust (§2.5).
- Pin `busy`-ustawienia `8715`, `9097`, `9180`, `9228` nie czytane w tej obronie.
- Istnienie pól jednostki (`mounted`, `primaryRanged`/`rangedBase`, `antiCavSpear`, `useUnitPriorities`, `unitTargetPriorities`) w modelu Rust (§2.2).
- Metoda generowania wektorów z prywatnej metody pinu (§2.8).
- Zgodność `rust-port/renderer/src/battle/orders.rs` z pinem `07d2fbd72` (zastrzeżenie z 01-rozpoznanie.md, §2 uwaga) — nie badane w tej obronie.

## 5. Odtwarzalne polecenia

```
git show 07d2fbd72:gra/src/battle/battleScene.ts > <scratchpad>/pin.ts
sed -n 18280,18433p <scratchpad>/pin.ts ; sed -n 17481,17600p <scratchpad>/pin.ts ; sed -n 3603,3611p <scratchpad>/pin.ts
git grep -n 'perform_player_order\|doctrine_step' -- rust-port/engine/src
git grep -n 'acted' -- rust-port/engine/src
git grep -n 'busy = ' -- rust-port/engine/src
grep -rniE 'blockade|attack_move|attackmove' rust-port/engine/src
for t in _passableForUnit _ensureGroupMeta _liveGroupMemberIds _orderMoveForUnits _isUnitDoctrineAuto _firstStepOnAttackMovePath occByKey cellKey _playerControlSide _playerRoster blockadeActive blockadeCol _battleRosterOrder _executeUnitsImmediate; do echo "$t: $(grep -rn -- "$t" rust-port/engine/src | wc -l)"; done
sed -n 115,120p rust-port/engine/src/domain/siege_tactics_activate.rs ; sed -n 236,241p rust-port/engine/src/domain/siege_tactics_activate.rs
sed -n 300,356p rust-port/engine/src/domain/siege_tactics_turnseq.rs
```
