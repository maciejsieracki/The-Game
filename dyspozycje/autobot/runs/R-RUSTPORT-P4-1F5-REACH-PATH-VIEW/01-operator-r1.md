# 01-operator-r1 — R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (P4-1F5 / PRIO-3D-5, #273 · #242)
GOAL: producent `overlays.reachable` (`reachableWithMergeTargets` + `occupiedForMove` z `passThrough` + `foreignCityHexKeys`) i `overlays.pathRoute` z `turnStops` (`marchPathPlan` = `plan_path_turns` + `apply_fog_to_path_plan`, plan z `planned_marches`, hover przez `preview_path` P4-1H).
BAZA: `origin/rust-port/parity-v2` = `585bb48e0f926a14435fa96b9402a711095ee16c` (worktree detached, potem gałąź robocza worktree). Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
ZMIANY/COMMIT: patrz §1; SHA commitu w §6.
TESTY: patrz §4.
BLOKADY: brak blokad technicznych. Dwie rozbieżności dispatch ↔ pin opisane w §3 (rozstrzygnięte wg pinu, zasada 9/11 CLAUDE.md).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (brak push; brak integracji).

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/overlays_view.rs` (NOWY) | `reachable_with_merge_targets(state, unit_id)` (web `reachableWithMergeTargets` `main.ts:14706-14731`), `reachable_overlay(state)` (bramki `syncPlayerUnitSelectionOnMap` `main.ts:7115-7134`), `march_path_plan(...)` (web `marchPathPlan` `main.ts:31110-31122` = `plan_path_turns_occ` + `apply_fog_to_path_plan`), `path_route_of(unit_hex, plan)` (`setPathRoute([{u.q,u.r}, ...fullPath], {turnStops})` `main.ts:31175-31178`), `path_route_overlay(state, hover)` (selekcja → `preview_path` P4-1H bez zmiany kontraktu). |
| `rust-port/engine/src/domain/pathfinding.rs` | TYLKO nowa funkcja `ruch_jednostek::compute_reachable_occ(unit, map, occ: &MoveOccupancy, siege, cost_fn)` = web `computeReachable` z `MoveOccupancy` (`setup.ts:840-975`): heks `passThrough` przechodni (heapPush), ale nie w zasięgu (`:948-949`), także w MIN-MOVE (`:965`); `siegeBlocksEntry` jako opcjonalny predykat. `build_move_occupancy` z `passThrough` JUŻ ISTNIAŁ (`pathfinding.rs:1207`) — bez zmian. Istniejące `compute_reachable` nie zmienione (inni wołający). |
| `rust-port/engine/src/domain/mod.rs` | jeden wpis `pub mod overlays_view;` |
| `rust-port/engine/tests/view_overlays_reach_path.rs` (NOWY) | 12 testów (wektory z `plik:linia` pinu w komentarzach). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW/01-operator-r1.md` | ten raport |

`Cargo.lock` nie commitowany. Poza allowlistą: brak zmian. `renderer/`, `gra/`, `preview_path`, `move_unit` nietknięte.

## 2. Decyzje techniczne

1. `overlays_view.rs` nie istniał w bazie `585bb48e0` — utworzony. Równoległe P4-1F3/P4-1F4 dopiszą do tego pliku; konflikt (nagłówek modułu, `use`, wpis w `mod.rs`) rozwiązuje orkiestrator — moje funkcje są samodzielne.
2. `moveCostFnForUnit(u)` → `None` (jak `preview_path_plan` P4-1H, erratum `ownerHasSeafaring` dla fotela; stan nie ma `embarked`). `siegeBlocksEntry` → `None` (brak stanu oblężenia w `PlayableState`).
3. `isSiegeMapPanelOpen()` = stan UI, nie stanu gry — producent go nie widzi (opisane w nagłówku modułu).
4. `isAwaitingFirstPlayerCity()` = istniejące `player::is_awaiting_first_player_city(state.gracz_kiedys_mial_miasto, miasta, właściciel)`.
5. `isMe(u.ownerId)` = `players.any(is_human && id == owner)`.
6. `armyStackLimit()` = `save_migrations::ARMY_STACK_LIMIT` (500), `canJoinStackAt` = istniejące `army_follow_auto_merge::can_join_stack_at`.
7. Kolejność `reachable` = kolejność wstawiania web `Set` (`OrderedHexSet`): najpierw `computeReachable`, potem heksy stosów w kolejności `units`.
8. `path_route_overlay` deleguje do `preview_path` (zakres pkt 3: hover przez P4-1H); plan marszu ma pierwszeństwo nad kursorem — zachowane w `preview_path`.

## 3. Rozbieżności dispatch ↔ pin (rozstrzygnięte wg pinu)

- **Wektor „trasa skrócona przez mgłę”**: w pinie `applyFogToPathPlan` (`gra/src/game/planned-march.ts:56-75`, C-RUCH-Q1=B) zwraca plan BEZ zmian; wariant ucinający `_applyFogToPathPlanBlind` (`:78+`) jest martwy. Rust `apply_fog_to_path_plan` też jest tożsamością. Trasa przez mgłę NIE jest skracana. Wektor P2 testuje zachowanie pinu: mgła aktywna, widoczne tylko (0,0),(1,0), cel (5,0) w mgle → `fullPath` i `turnStops` pełne, `pathRoute` producenta = trasa z `marchPathPlan` po mgle. Zgodnie z dispatchem „Nie wdrażaj mgły jako decyzji” — nic nie zmieniono w regule mgły.
- **Mutacja (c) „turnStops bez przeliczenia po mgle”**: w dosłownym brzmieniu (wziąć `turnStops` z planu surowego zamiast po mgle) jest **mutantem równoważnym** — mgła w pinie jest tożsamością, więc żaden test parytetowy nie może jej wykryć (wynik w §5: przeżywa, zgodnie z oczekiwaniem). Dodano wykrywalny wariant tej samej klasy błędu: (c) mgła ucina `fullPath` (wariant ślepy), a `turnStops` NIE przeliczone → FAIL; (d) `turnStops` nie przeniesione do DTO → FAIL.

## 4. Testy / bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

Dysk przed bramkami: `df -h /` → 9.0 GB wolne (≥ 8 GB).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test view_overlays_reach_path` | 12 passed, 0 failed, 0 ignored |
| `cargo test --all-targets --no-fail-fast` | __PELNY__ |

Wektory (`tests/view_overlays_reach_path.rs`):
- R1 zasięg z własnym stosem w zasięgu → heks dopisany: [(2,0),(3,0),(1,0)] (`main.ts:14716-14729`, `setup.ts:948-949`);
- R2 przejście przez własne jednostki (`passThrough`) vs obca jednostka blokuje (`setup.ts:766-773`);
- R3 własny stos poza kosztem ruchu → niedopisany (`main.ts:14728`);
- R4 stos pełny 500 (`canJoinStackAt` = false) → niedopisany; granica 499 → dopisany (`army-stack-limit.ts:55-66`);
- R5 obce miasto blokuje heks; własne nie (`main.ts:14580-14583`);
- R6 obce miasto zdejmuje `passThrough` (`main.ts:14582`);
- bramki selekcji/ruchu/pierwszego miasta (`main.ts:7115-7134`, `:14701-14703`, `first-player-city.ts:16`); minimum ruchu stosu (`armyMerge.ts:1180-1186`);
- P1 trasa wieloturowa `turnStops` [(2,1),(4,2),(5,3)] (`planned-march.ts:241-268`), plan ma pierwszeństwo nad kursorem (`main.ts:32335-32338`);
- hover przez `preview_path` (`main.ts:31181-31211`), brak selekcji / kursor na jednostce → `None`;
- P2 mgła nie skraca trasy, `turnStops` po mgle (`planned-march.ts:56-75`);
- trasa przez własne tak, przez obce nie (`setup.ts:1019+`).

Brak `#[ignore]`, brak osłabionych asercji.

## 5. Mutacje (skrypt w scratchpadzie, pliki przywrócone, `cmp` = RESTORED)

| Mutacja | Wynik |
|---|---|
| (a) `canJoinStackAt` pominięte (`if false && !can_join_stack_at`) | **FAIL** — `r4_stos_pelny_can_join_stack_at_false_niedopisany` (11/12) |
| (b) `passThrough` wyłączone (własne jednostki blokują w `compute_reachable_occ`) | **FAIL** — r1, r2, r4 (9/12) |
| (c) mgła ucina `fullPath`, `turnStops` nieprzeliczone | **FAIL** — `p2_mgla_nie_skraca_trasy_turn_stops_po_mgle` (11/12) |
| (c-lit) `turnStops` z planu surowego zamiast po mgle | przeżywa (12/12) — mutant równoważny, patrz §3 |
| (d) `turnStops` puste w `path_route_of` | **FAIL** — p2 (11/12) |
| (e) heksy `passThrough` dopisywane do zasięgu (`setup.ts:949` pominięty) | **FAIL** — r1, r4 (10/12) |

## 6. Commit

SHA: __SHA__ (gałąź robocza worktree `worktree-wf_79711bb8-e3b-1`, rodzic `585bb48e0`).
