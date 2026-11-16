# R-RUSTPORT-P4-1H-PREVIEW-Q5 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-PREVIEW-Q5 (#251)
GOAL: zapytanie `preview_path` (web `refreshHoverPathPreview` + `refreshPlannedMarchPreview`) zwracajace `PathRouteDto { hexes, turn_stops }`, czysta funkcja, `budget = None`.
ZMIANY/COMMIT: gałąź `wip/R-RUSTPORT-P4-1H-PREVIEW-Q5-op`, baza `b3c0b2209578a09000a45040ec5b03c3aa444e5f` (= `origin/rust-port/parity-v2` przy starcie, zawiera Q4 `ee3207b5a`); SHA commitu — w `git log` tej gałęzi (commit zawiera ten raport, więc SHA podaje wynik dla orkiestratora).
- `rust-port/engine/src/domain/playable_movement.rs` (+ funkcje Q5 na końcu pliku)
- `rust-port/engine/tests/p4_1h_preview_path.rs` (NOWY, 11 testów)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-PREVIEW-Q5/01-operator-r1.md`, `mutacje-r1.sh`
- `Cargo.lock` NIE commitowany. `bridge.rs`, `view-model/**` — bez zmian (patrz decyzje).
TESTY: patrz §Bramki i §Mutacje.
BLOKADY: brak blokujących; NIE_ZMIERZONO: koszt ruchu dla właściciela z Żeglugą (§NIE_ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Co zrobiono

Nowe funkcje w `playable_movement.rs` (adapter Q4 użyty, nic nie zduplikowano z Q3/Q4):

| Funkcja Rust | Pin `07d2fbd72` |
|---|---|
| `player_stack_at(jednostki, unit)` | `playerStackAt` `main.ts:14694-14699` → `activeUnitStack` `armyMerge.ts:243-252` → `visibleStackOnHex` `armyMerge.ts:89-105` + `stackGroupIdOf` `:57-62` (Rust: `pathfinding::ruch_jednostek::stack_group_id_of`) |
| `unit_with_planning_stack_ruch(unit, stack)` | `unitWithPlanningStackRuch` `armyMerge.ts:1180-1186`, `planningStackRuchLeft` `:918-921`, `planningUnitRuchLeft` `:923-929` |
| `per_turn_move_for_unit(unit)` | `perTurnMoveForUnit` `main.ts:31084-31095` (`Math.max(1, normFieldVal(u.ruch, …))`, `:31094`) |
| `preview_path_plan(state, unit_id, destination)` | `marchPathPlan` `main.ts:31110-31122` wołane z `refreshPlannedMarchPreview` `:31146-31179` i `refreshHoverPathPreview` `:31181-31209`; `planPathTurns_occ` (Q3) + `apply_fog_to_path_plan` |
| `preview_path(state, unit_id, destination) -> Option<PathRouteDto>` | `unitRenderer.setPathRoute([{q:u.q,r:u.r}, ...plan.fullPath], {turnStops})` `main.ts:31175-31178`, `:31204-31207`; `fullPath.length === 0` → `clearPathRoute()` `:31171-31173`, `:31203`, `:31209` |

Wartości przekazywane do `planPathTurns` (plik:linia):
- stos: `playerStackAt(u)` `main.ts:31158` / `:31182`;
- zajętość: `occupiedForMove(u.ownerId, ...stack ids)` `:31159` / `:31183` → Q4 `occupied_for_move`;
- mover: `unitWithPlanningStackRuch(u, stack)` `:31160` / `:31184`;
- `perTurn = perTurnMoveForUnit(u)` `:31166` / `:31198`;
- `budget = undefined` `:31167` / `:31199` → `None` (w `planPathTurns` `budget = movementBudget ?? perTurn`, `planned-march.ts:270`);
- mgła: `applyFogToPathPlan` zwraca plan bez zmian (C-RUCH-Q1=B), więc `buildMarchFogContext` i `hoverDest.attackUnitId` (`:31185-31192`) nie zmieniają wyniku → `fog = None`;
- oblężenie: `siegeBlocksEntry` — `PlayableState` nie ma stanu oblężenia → `siege = None` (jak w Q4);
- koszt: `moveCostFnForUnit(u)` → `None` (patrz NIE_ZMIERZONO).

Wybór celu (`main.ts:32335-32340`): przy `plannedMarches.has(uSel.id)` web woła `refreshPlannedMarchPreview` i kończy (kursor ignorowany) → w Rust plan z `state.planned_marches` ma pierwszeństwo nad `destination`; bez planu i bez `destination` → `None`; nieznana jednostka → `None` (`:31154-31156`).

## Decyzje techniczne

1. **Miejsce wywołania i typ zwracany:** funkcja adaptera `playable_movement::preview_path(&PlayableState, UnitId, Option<PositionDto>) -> Option<PathRouteDto>` (dispatch pkt 1 dopuszcza „funkcję adaptera”). NIE dodano wariantu `EngineCommand`: (a) ścieżka z dispatchu `rust-port/engine/src/domain/bridge.rs` nie istnieje — bridge to `rust-port/engine/src/bridge.rs`, spoza allowlisty; (b) `BridgeResult`/`EngineState` zwraca snapshot stanu, a podgląd nie jest stanem — wpięcie w protokół należy do warstwy `path_route` (#237/#242). Sygnatura `&PlayableState` wyklucza zapis do stanu na poziomie typów.
2. `preview_path_plan` jest publiczne (zwraca pełny `PathTurnPlan`), żeby test mógł odróżnić `budget = None` od `Some(..)` — `budget` wpływa tylko na `segment_path`, którego `PathRouteDto` nie zawiera (bez tego mutacja (a) byłaby równoważna).
3. `PathRouteDto { hexes, turn_stops }` i `PathTurnStopDto` już istnieją w `view-model/src/overlays.rs` (P4-1F1), walidacja `turn` w `validate.rs:350-366`, klucze JSON w `tests/json_keys.rs:299-305` — nic nie zmieniono w view-model. Producent pola `overlays.path_route` NIE wdrożony (#237/#242, dispatch pkt 4).
4. Stos: `PlayableState` nie ma `inGarnizon`/`stackGroupId`/`fortifyRuchSnapshot` (adapter Q4 daje web-falsy), więc stos = jednostki tego samego właściciela na heksie, pula ruchu = minimum `ruch_left`. Funkcje stosu z `recruitment.rs` (`StosJednostka`) nie użyte — wymagałyby drugiego adaptera typu; logika to 1:1 filtr z `armyMerge.ts:101-104` na `RuchJednostka` z użyciem istniejącego `stack_group_id_of`.
5. `per_turn_move_for_unit` = `max(1, movement_max)`: `normFieldVal(u.ruch, …)` zwraca `u.ruch`, bo `movement_max` (u8→f64) jest zawsze skończoną liczbą; fallback `def['Ruch']` nieosiągalny.

## NIE_ZMIERZONO

- **Koszt ruchu przy Żegludze (erratum P4-1H):** `moveCostFnForUnit` → `ownerHasSeafaring(ownerId)` (`main.ts:14589-14593`) ma gałąź `ownerId === 0` (gracz weba) i `isAiOwner(humanSeats, ownerId)`. Adapter przekazuje surowe `PlayerId` (gracz = 1). Zgodnie z dispatchem nie zgadywałem mapowania: podgląd przyjmuje `ownerHasSeafaring = false` → `canUnitEmbark` = false (stan nie ma `embarked`) → web `undefined` → `cost_fn = None` (woda nieprzejezdna poza celem). Wynik jest zgodny z webem dla właściciela BEZ Żeglugi; dla właściciela z Żeglugą (`researched_techs_by_owner` zawiera `embark_tech()`) trasa przez wodę jest NIE_ZMIERZONO. Do rozstrzygnięcia przy mapowaniu PlayerId→ownerId (Q6 lub osobny temat).
- Oblężenie (`siegeBlocksEntry`) — brak stanu w `PlayableState` (jak Q4); bez wektora.

## Wektory (ręcznie z pinu, plik:linia w `tests/p4_1h_preview_path.rs`)

Mapy = korytarz jednego rzędu (jednoznaczna trasa `computePath`).
- W1: 5×Plains, ruch 2, (0,0)→(4,0): `hexes` (0..4), `turn_stops [{2,t1},{4,t2}]` — dwa przystanki (`planned-march.ts:241`, `:247-248`, `:249-258`, `:260`, `:264-268`).
- W2: Plains/Hills/Plains/Hills/Plains, ruch 2: `[{1,t1},{2,t2},{3,t3},{4,t4}]`.
- W3: `ruchLeft 0`, `ruch 3`: perTurn z `ruch` (`main.ts:31094`) → `[{3,t1},{5,t2}]`.
- jednoturowa: (0,0)→(2,0) → `[{2,t1}]`.
- plan ma pierwszeństwo nad `destination` (`main.ts:32335-32338`), także `destination = None`.
- brak trasy → `None`: woda w środku korytarza (`setup.ts:1156`), cel = heks jednostki (`planned-march.ts:234-236`), cel poza mapą, brak celu i planu, nieznana jednostka.
- cel na wodzie MA trasę: heks docelowy zawsze przejezdny (`setup.ts:1141-1152`), `pathCost` liczy `Infinity` jako 0 (`setup.ts:1211-1212`) → `[{2,t1}]` (wektor dodany po tym, jak pierwotne założenie „woda = brak trasy” okazało się sprzeczne z pinem).
- zajętość: własna jednostka na trasie = przejście, obca = blokada (`setup.ts:759-776`, `:1157`).
- `budget None`: ruchLeft 1, ruch 2 → `segment_path [(1,0),(2,0)]`, `segment_cost 2` (`planned-march.ts:270`, `:186-212`).
- czystość: serializacja stanu przed = po (bez planu i z planem); `planned_marches` puste po podglądzie.
- stos/pula ruchu (`armyMerge.ts`): stos `["900","901"]`, pula `min = 1`, pusty stos → 0.

## Mutacje (`mutacje-r1.sh`, każda MUSI dać FAIL)

```
MUTACJA a-budget-some: FAIL (dobrze)
MUTACJA b-bez-turn-stops: FAIL (dobrze)
MUTACJA c-zapis-planu: FAIL (dobrze)        # &mut PlayableState: wywołania testów z &state nie kompilują się
MUTACJA d-plan-ignorowany: FAIL (dobrze)
MUTACJA e-bez-heksa-jednostki: FAIL (dobrze)
MUTACJA f-per-turn-z-ruch-left: FAIL (dobrze)
MUTACJA g-stos-pusta-pula: FAIL (dobrze)
```
Uwaga do (c): przez `&PlayableState` zapis planu jest niemożliwy bez zmiany sygnatury; mutant zmieniający sygnaturę na `&mut` daje FAIL kompilacji testów, a test `zapytanie_nie_zmienia_stanu` porównuje serializację.

## Bramki (CARGO_INCREMENTAL=0, DEV/TEST_DEBUG=0, CARGO_TARGET_DIR w scratchpad poza repo, usunięty po bramkach)

`rust-port/engine`:
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets --no-fail-fast` → **uruchomione w częściach z powodu braku miejsca na dysku** (wolumen zszedł do 0 MB przy jednym przebiegu przez inne procesy; 485 binarek testowych nie mieściło się). Wykonano: `cargo test --lib --bins --examples --benches --no-fail-fast` → EXIT 0 (lib 124 passed), potem każda z 485 binarek `tests/*.rs` osobno `cargo test --test <nazwa> --no-fail-fast` z usuwaniem binarki po przebiegu: **485/485 EXIT 0, 3449 passed, 0 failed, 1 ignored** (ignorowany test istniał wcześniej: `p6_order_lane`, poza tym tematem). Zakres = `--all-targets`, różni się tylko podział na wywołania.

`rust-port/view-model` (bez zmian w tym temacie):
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets --no-fail-fast` → EXIT 0 (96 passed, 0 failed, 0 ignored)

`git diff --check` → czysto. Brak `#[ignore]` w nowych testach, brak zmian poza allowlistą.
