# P4-1H — rozpoznanie komend mapy: `cancel_planned_march`, `preview_path`, `move_unit` wieloheksowy (#217)

**Temat:** `R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1` · **Rola:** Operator r1 · **Tryb:** tylko odczyt, zero zmian kodu.
**Baza:** `origin/rust-port/parity-v2` = `2f9a12786` (w chwili startu). **Pin webu:** `07d2fbd72` (`gra/src/**`, `git show`).
**Skróty:** `main.ts` = `gra/src/main.ts@07d2fbd72`; `pm.ts` = `gra/src/game/planned-march.ts@07d2fbd72`;
`setup.ts` = `gra/src/units/setup.ts@07d2fbd72`; `RJ` = moduł `ruch_jednostek` w `rust-port/engine/src/domain/pathfinding.rs`.

---

## 0. Wnioski najważniejsze (do decyzji orkiestratora)

1. **W webie nie ma funkcji o nazwach z dispatchu.** `grep -rn "cancelPlannedMarch\|previewPath\|moveUnit" gra/src` → 0 trafień
   (poza `executeMarchStep` itp.). Komendy to nazwy po stronie Rust (kontrakt `P4-1-RENDER-DTO-CONTRACT.md` §5.1/§5.2, D-DTO-8).
   Odpowiedniki webowe: `clearPlannedMarch` (cancel), `refreshHoverPathPreview` + `refreshPlannedMarchPreview` (preview),
   `planMarchTo` + `executeMarchSegmentForUnit` + zakończenie animacji (move).
2. **ROZBIEŻNOŚĆ w kontrakcie P4-1 §5.1 (wiersz `MapClick`) i w P2-5 U2:** obie pozycje wskazują `beginMoveSelectedUnitTo`
   (`main.ts:32037`) jako ścieżkę kliknięcia. Na pinie ta funkcja **nie ma żadnego wołającego**
   (`git grep -n "beginMoveSelectedUnitTo" 07d2fbd72 -- gra/src` → wyłącznie definicja `main.ts:32037`).
   Każde kliknięcie heksu przy zaznaczonej jednostce idzie przez **`planMarchTo`** (`main.ts:32679`, `:32696`, `:32700`, `:32710`,
   miasta `:32574`, `:32602`). `move_unit` wieloheksowy = **plan marszu + natychmiastowy pierwszy segment**, nie ruch bezpośredni.
3. **Port czystej logiki marszu w Rust jest z pinu `edb8fb56`, nie `07d2fbd72`.** Wektory `engine/tests/p6_4_vectors/march.json`
   mają `"pin":"edb8fb56"`. Dryf `edb8fb56→07d2fbd72` w plikach ruchu: `git diff --stat` → `planned-march.ts` 85 linii,
   `setup.ts` 199, `army-stack-limit.ts` 228 (nowy), `armyMerge.ts` 222, `city-siege-state.ts` 80 (razem +771/−43).
   Brakuje w Rust: przejścia przez własne jednostki (`MoveOccupancy.passThrough`, `trimSegmentEndOffPassThrough`,
   `isPassThroughHex`), blokady wejścia do oblężonego miasta (`siegeBlocksEntry`), limitu stosu na trasie
   (`canJoinStackAt` jest, `trimPathToStackRoom` BRAK), funkcji powiadomień o przerwaniu marszu (`isNotifiableMarchStop`,
   `marchPausedLabel`, `registerMarchStop`, `clearMarchStop`). To blokuje parytet `preview_path` i `move_unit` (§3).
4. **`PlayableState` nie ma modelu ruchu weba.** `PlayableUnit` ma `movement: u8` (`playable.rs:390`), brak `ruchLeft` (f64),
   kategorii, stosu, zaokrętowania; `PlayableMap` ma 4 tereny i `passable` (`playable.rs:247-279`), brak dróg/rzek/kosztów `RuchHex`.
   Nie istnieje adapter `PlayableState → RuchMapa/RuchJednostka` (jedyne `RuchJednostka::new` w `src/` to `save_load.rs:927`,
   do filtra zapisu). Bez tego adaptera `preview_path`/`move_unit` nie mogą wołać portu `RJ`.
5. **`cancel_planned_march` jest wykonalne od razu** (stan P4-1J jest w `PlayableState`, `playable.rs:531-549`).
   Zależność od P4-1J `general_target_id` (#221): na bazie `2f9a12786` pole **jeszcze nie jest** w `PlayablePlannedMarch`
   (`playable.rs:556-565`, komentarz `:554-555`); wdrożenie `R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1` jest w toku (dispatch r2).
   `clearPlannedMarch` nie czyta `generalTargetId`, więc cancel **nie zależy** od #221 semantycznie; zależy tylko konfliktowo
   (oba tematy dotykają `playable.rs`) — kolejność: #221 przed implementacją cancel albo rebase.

---

## 1. Tabela: komenda → web (plik:linia) → warunki → efekt → Rust

### 1.1 `cancel_planned_march { unit_id, force }`

| Element | Web (pin `07d2fbd72`) | Warunki | Efekt na stan | Rust (baza `2f9a12786`) | Status |
|---|---|---|---|---|---|
| rdzeń | `clearPlannedMarch(unitId, force)` `main.ts:31050-31074` (gałąź `unitId !== undefined` `:31051-31056`) | `!force && plannedMarches.get(unitId)?.attackUnitId` → **return, bez zmian** (`:31052`) | usuwa wpis z `plannedMarches`, `marchAttackTargets`, `marchStopNotified`, `marchStopDetail` (`:31053-31056`); trasa w rendererze czyszczona gdy jednostka zaznaczona / brak zaznaczenia (`:31071-31073`, efekt UI) | stan: `planned_marches` `playable.rs:536`, `march_attack_targets` `:541`, `march_stop_notified` `:545`, `march_stop_detail` `:549`; **komenda BRAK** (`grep -rn "cancel_planned\|clear_planned" engine/src` → 0); `EngineCommand` `bridge.rs:26-48` bez wariantu | **BRAK** |
| gałęzie globalne | `unitId === undefined` (`:31057-31070`) | — | czyszczenie wszystkich (force) / wszystkich bez ataku | nie potrzebne: brak wołającego bez argumentu (`grep "clearPlannedMarch()"` → 0; `clearAutoMarch` `:31076` bez wołającego) | poza zakresem |
| PPM / Esc (`force=false`) | `dismissPlayerUnitSelectionIfAny` `:7138-7143` → `clearPlayerUnitSelection()` `:7090-7093` → `clearPlannedMarch(selectedId, false)` | `selectedId !== null && isWorldMapUnitMode()` (UI) | jak wyżej; **uwaga:** zwykły plan (bez `attackUnitId`) **jest kasowany** przy odznaczeniu, marsz-z-atakiem przetrwa | brak | BRAK |
| przycisk „Zatrzymaj” (`force=true`) | `stopPlannedMarchForSelected` `:31729-31736` (HUD `march-stop` `:25916`) | `plannedMarches.has(selectedId)`; brak planu → nic (bez hintu) | `clearPlannedMarch(id, true)` + hint „Zatrzymano” | brak (P2-5 U11 `march_stop` BRAK) | BRAK |
| inne `force=true` | rozwiązanie jednostki (`clearPlayerUnitSelection(true)` `:7373`), `tryLaunchMarchAttack` `:31141`, nowy rozkaz natychmiastowy `:32110` (martwy, §0 pkt 2), HUD `:25920`, `:25946`, `:26013`, `:26060`, `:26085` (garnizon/Czuwaj/Zwiedzaj/Pomiń/follow) | — | jak wyżej | brak | BRAK (poza #217, osobne komendy) |
| wybór innej jednostki | `selectPlayerUnit` `:7233-7269` | — | **nie** kasuje planu (tylko `clearPathRoute`, podgląd planu nowej jednostki `:7265-7267`) | `select_unit` `playable.rs:880-896` nie dotyka planów | ZGODNE |
| koniec tury | `clearPlayerUnitSelectionStateOnly` `:7096-7106` | — | odznacza **bez** kasowania planów | `advance_turn` `playable.rs:1221` zeruje `selected_unit_id`, planów nie rusza | ZGODNE |

Idempotencja: drugie wywołanie dla tej samej jednostki trafia na brak wpisu → `Map.delete` bez efektu. Wynik w Rust: `Ok(())` bez zmian stanu (nie błąd) — kontrakt §5.2 pkt 4.

### 1.2 `preview_path { unit_id, dest } → Option<PathRoute>` (zapytanie, bez zmiany stanu)

| Element | Web | Warunki | Wynik | Rust | Status |
|---|---|---|---|---|---|
| hover bez planu | `refreshHoverPathPreview(uSel, q, r)` `main.ts:31181-31211`, wołane z `mousemove` `:32340` | zaznaczona jednostka gracza (`:32302`), heks pod myszą (`:32309`), zmiana heksu (`hoverKey`, `:32317-32318`), jednostka **bez** planu (`:32335`) | `[start, ...plan.fullPath]` + `turnStops` albo czyszczenie trasy gdy `fullPath` puste | **BRAK** komendy/zapytania; czysta funkcja `RJ::plan_path_turns` `pathfinding.rs:1860` | BRAK (+ ROZBIEŻNE §3) |
| hover z planem | `refreshPlannedMarchPreview(uid)` `:31146-31179` (z `:32336`, `selectPlayerUnit` `:7266`, `finishMarchSegmentHints` `:31474`, `planMarchTo` `:31292`) | jednostka **ma** plan → **ignoruje heks pod myszą**, rysuje trasę do celu planu | jak wyżej, cel = `dest.destQ/destR` | BRAK | BRAK |
| planowanie | `marchPathPlan` `:31110-31122` = `planPathTurns` (`pm.ts:215-285`) + `applyFogToPathPlan` (`pm.ts:71-79`, **no-op** od C-RUCH-Q1=B) | `budget = undefined` (hover i podgląd planu) → `segmentPath` liczony od `perTurn` | `fullPath`, `turnStops` | `plan_path_turns` `pathfinding.rs:1860-1950`, `apply_fog_to_path_plan` `:1818-1826` (no-op, ZGODNE) | ROZBIEŻNE (pass-through, §3) |
| wejścia ruchu | `playerStackAt` `:14694` → `activeUnitStack` (`armyMerge.ts:243`); `occupiedForMove(owner, ...stackIds)` `:14578-14584` (`buildMoveOccupancy` `setup.ts:759` + obce miasta); `unitWithPlanningStackRuch` (`armyMerge.ts:1180`); `perTurnMoveForUnit` `:31084-31095`; `moveCostFnForUnit` `:14656` | zajętość z **wszystkich** jednostek (także niewidocznych we mgle) — parytet weba, nie ujawniamy dodatkowo | — | `active_unit_stack` `recruitment.rs:606`, `unit_with_planning_stack_ruch` `:1281`, `move_cost_fn_for` `pathfinding.rs:1380`, `foreign_city_hex_keys` `:630`; **BRAK** `build_move_occupancy`/`passThrough` | CZĘŚCIOWE |
| mgła | `buildMarchFogContext` `:31097-31108`, `hoverDest` z `attackUnitId` gdy wróg widoczny `:31186-31192` | wpływa tylko na kontekst, a `applyFogToPathPlan` go ignoruje → **mgła nie zmienia trasy** | — | `MarchFogContext` `pathfinding.rs:1760` | ZGODNE (no-op) |
| renderer | `unitRenderer.setPathRoute(hexes, { turnStops })` `render/units.ts:6608-6680` (etykiety numerów tur w heksach `turnStops`) | `hexes.length < 2` → nic | — | `OverlaysDto.path_route: Option<Vec<HexCoord>>` `view-model/src/overlays.rs:188` — **bez `turn_stops`** | **ROZBIEŻNE** (DTO gubi numery tur) |

### 1.3 `move_unit` wieloheksowy (`{ unit_id, destination, attack_unit_id? }`)

| Element | Web | Warunki | Efekt | Rust | Status |
|---|---|---|---|---|---|
| wejście | klik mapy `main.ts:32671-32711` → `planMarchTo(q, r[, attackUnitId])` `:31213-31298` | zob. bramki niżej | — | `EngineCommand::MoveUnit { unit_id, destination }` `bridge.rs:37-40` → `PlayableGame::move_unit` `playable.rs:898-946` | **ROZBIEŻNE** |
| bramki UI/sesji | `selectedId === null \|\| isAnimating` `:31214`; `isAwaitingFirstPlayerCity` `:31215`; panel oblężenia `:31219`; `isCityUnitPickOpen` `:31226`; `!isMe(owner)` `:31228` | — | odmowa + hint | Rust: wymaga `selected_unit_id == unit_id` `playable.rs:924`, właściciela `:921` | CZĘŚCIOWE |
| oblężenie | `u.oblegaCityId` → odmowa `:31230-31237` | jednostka obleguje | hint | brak pola `obleganie` w `PlayableUnit` | BRAK |
| zwiad | `clearScoutAutoExplore(u)` `:31229` | — | wyłącza auto-zwiedzanie | `RJ::clear_scout_auto_explore` `pathfinding.rs:2299` (niepodpięte do `PlayableUnit`) | BRAK (stan) |
| cel-atak | `attackTarget` = jawny `attackUnitId` albo obca (nie-moja) jednostka na celu `:31243-31247` | cel niewidoczny → odmowa „Cel niewidoczny (mgła).” `:31248-31251` | `marchDest.attackUnitId` | `PlayablePlannedMarch.attack_unit_id` `playable.rs:563-564`; brak widoczności w `PlayableState` | BRAK (widoczność) |
| trasa | `marchPathPlan(..., budget = planningStackRuchLeft(stack), ...)` `:31257-31266` | `fullPath` puste → „Marsz przerwany: brak trasy do celu” `:31267-31270` | — | `plan_path_turns` (ROZBIEŻNE §3) | ROZBIEŻNE |
| obce miasto | `!attackTarget && !canOccupyHexForUnit` `:31271-31277` (`canUnitOccupyCityHex`) | — | odmowa | `can_unit_occupy_city_hex` `pathfinding.rs:592` | CZĘŚCIOWE (brak wołającego z `PlayableState`) |
| limit stosu | `!attackTarget && !canJoinStackAt(units, stack, q, r, armyStackLimit())` `:31279-31282` | — | odmowa + `stackLimitBlockMessage` | `can_join_stack_at` `army_follow_auto_merge.rs:63`; `armyStackLimit` `main.ts:4358` — NIE_ZMIERZONO w Rust | CZĘŚCIOWE |
| zapis planu | `markPlayerMovedUnit` `:31284`; `plannedMarches.set` `:31285`; `marchStopNotified/Detail.delete` `:31288-31289`; `syncMarchAttackTarget` `:31290` | — | plan + nowy epizod przerwań | pola P4-1J istnieją; **BRAK** `movedByPlayerThisTurn` (web `:31014`, czyszczone `:38144`, `:45066`, `:46280`) | BRAK |
| pierwszy segment | `planningStackRuchLeft(stack) > 0` → `executeMarchSegmentForUnit(id)` `:31294-31296`, `:31477-31544` | brak MP → hint, `false` `:31490-31493` | `executeMarchStep` (`pm.ts:353-434`); porażka → `noteMarchStop` `:31512-31515`; `trimPathToStackRoom` `:31518-31528` (puste → **usuwa plan** `:31520`); animacja `startAnimatedMove` `:31373-31429` | `execute_march_step` `pathfinding.rs:2055-2121` (bez pass-through); `trim_path_to_stack_room` BRAK | ROZBIEŻNE |
| koniec segmentu | zakończenie animacji `main.ts:44084-44204`: pozycja stosu, `deductStackRuchLeft` `:44101-44107`, zaokrętowanie `:44110`, `syncGeneralMarchTargets` `:44120`, `validateActiveSieges` `:44122`, mgła wzdłuż ścieżki `:44136-44138`, chatki `:44139`, obozy barbarzyńców `:44140`, bonusy wizyty miasta `:44141-44146`, `tryAutoCaptureEmptyCityAt` `:44157`, `sweepFortCaptures` `:44158`, propozycja scalenia `:44159-44165`, atak po dotarciu `tryLaunchMarchAttack` `:44184` albo `finishMarchSegmentHints` `:44187` (dotarcie → `plannedMarches.delete` `:31464`) | — | — | Rust: tylko `position` i `movement -= distance` `playable.rs:940-943`; `deduct_stack_ruch_left` `recruitment.rs:1254`, `apply_embark_state_after_move` `pathfinding.rs:1415` istnieją bez wołającego z `PlayableState` | BRAK (większość skutków) |
| obecne Rust | `move_unit` odrzuca `distance != 1` (`playable.rs:937-939`), `distance > movement` (`:931-936`), heks nieprzejezdny (`:911-913`); nie tworzy planu | — | ruch 1 heks | — | **ROZBIEŻNE** z webem (web: dowolny cel osiągalny, plan wieloturowy) |
| koniec tury | `runPlannedMarchesAtPlayerEndTurn` `:31684-31706` (wołane `:43718`, `:43865`) → `applyMarchSegmentInstant` `:31573-31678` (pomija `movedByPlayerThisTurn`) | MP > 0 | segmenty bez animacji, te same skutki co wyżej | `advance_turn` `playable.rs:1158-1232`: brak wykonania planów | BRAK (poza #217 — osobny temat) |
| kontynuuj (HUD) | `continuePlannedMarchForSelected` `:31708-31712` | — | `markPlayerMovedUnit` + segment | brak (P2-5 U11 `march_continue`) | BRAK |

---

## 2. Wejścia z DTO i z modelu

### 2.1 Komendy (nowe pola `EngineCommand`, `bridge.rs:26`)
- `CancelPlannedMarch { unit_id: u64, force: bool }` — kontrakt §5.2 pkt 2. Wynik: `Ok` także bez planu.
- `PreviewPath { unit_id: u64, destination: PositionDto }` — **zapytanie** (bez eventu `engine_state_changed`; przy D-RR-10 wywołanie w procesie). Gdy jednostka ma plan, `destination` jest ignorowane (web `:32335-32337`). Wynik: `Option<PathRouteDto>`.
- `MoveUnit { unit_id, destination, attack_unit_id: Option<u64> }` — rozszerzenie istniejącego wariantu (`bridge.rs:37`); `attack_unit_id` odpowiada `planMarchTo(..., cu.id)` `:32696`, `:32700`. Przy braku pola web sam szuka wroga na celu (`:31245-31247`).

### 2.2 DTO widoku (view-model)
- `OverlaysDto.path_route` (`overlays.rs:188`) → potrzebne `{ hexes: Vec<HexCoord> /* ze startem */, turn_stops: Vec<{q, r, turn: u32}> }` (web `setPathRoute` opts.turnStops, `render/units.ts:6610`, `:6666-6674`). **Zmiana kontraktu P4-1 §3.7** (wiersz `pathRoute`) — do decyzji technicznej orkiestratora (web rozstrzyga: turnStops są rysowane).
- `OverlaysDto.reachable` (`overlays.rs:182`) — web przelicza po każdym ruchu (`:44172`); producent `reachableWithMergeTargets` `:14700+` poza #217 (P4-1F).
- `selection` — stan UI (D-CMD-12), bez zmian.
- Panel jednostki: `march_stop_detail` (`playable.rs:549`) już w stanie; etykieta = `marchPausedLabel` (`pm.ts`) — BRAK w Rust.

### 2.3 Model (silnik) potrzebny do parytetu
| Wejście weba | Źródło w webie | W `PlayableState` |
|---|---|---|
| `ruchLeft`/`ruch` stosu (f64) | `planningStackRuchLeft` (`armyMerge.ts:918`), `perTurnMoveForUnit` `main.ts:31084` | **BRAK** (`movement: u8`, `movement_max: u8`) |
| stos (`activeUnitStack`) | `armyMerge.ts:243` | BRAK (każda jednostka osobno) |
| koszt terenu / drogi / rzeki / woda | `moveCostFnForUnit` `main.ts:14656` → `moveCostFnFor` | BRAK (`PlayableTerrain` 4 warianty, `playable.rs:247`) |
| zajętość (obce = blok, własne = przejście, obce miasta) | `occupiedForMove` `main.ts:14578` | jednostki i miasta są; brak budowniczego zajętości |
| oblężenie (`siegeBlocksEntry`, `oblegaCityId`) | `setup.ts:723`, `main.ts:13140`, `:31230` | BRAK |
| widoczność (cel ataku) | `currentVisible()` | BRAK w `PlayableState` (P4-1C FOG-VIEW) |
| limit stosu | `armyStackLimit()` `main.ts:4358`, `canJoinStackAt`, `trimPathToStackRoom` | `can_join_stack_at` jest; limit i trim BRAK |
| `movedByPlayerThisTurn` | `main.ts:31014` | BRAK |
| id jednostek | `string` | `UnitId` (u64); `RJ` operuje na `&str` — mapowanie `to_string()` |

---

## 3. Rozbieżności portu `RJ` względem pinu `07d2fbd72` (dryf z `edb8fb56`)

| # | Web `@07` | Rust | Skutek |
|---|---|---|---|
| R1 | `planPathTurns`: `segmentPath = trimSegmentEndOffPassThrough(truncatePathToBudget(...), path.length, occupied)` (`pm.ts:271-275`) | `plan_path_turns` `pathfinding.rs:1935` bez trimu | segment może kończyć się na własnej jednostce (web: nie) |
| R2 | `shouldStopAtObstacle`: trim jak wyżej (`pm.ts:311-313`) | `should_stop_at_obstacle` `:2004` bez trimu | inne decyzje stopu |
| R3 | `executeMarchStep`: pusty segment + `isPassThroughHex(fullPath[0])` → `obstacle` + detail „własna jednostka na trasie — brak wolnego heksu w zasięgu” (`pm.ts:388-400`) | `execute_march_step` `:2084-2087` zawsze `NoMovement` | inny powód/komunikat |
| R4 | `computePath` w `withSiegeScope`, `siegeBlocksEntry` także dla celu (`setup.ts:1027`, `:1139`) | `compute_path` `:1171-1277` bez blokady oblężenia | trasa przez oblężone miasto |
| R5 | `computePath`/`computeReachable` czytają `MoveOccupancy.passThrough` (`setup.ts:856-857`, `:953`, `:974`) | `compute_reachable` `:1106` — NIE_ZMIERZONO, czy różni się w samym `computePath` (wg odczytu `setup.ts:1155-1157` `computePath` nie czyta `passThrough`; różnica dotyczy `computeReachable`) | dotyczy `reachable` (P4-1F), nie trasy |
| R6 | `isNotifiableMarchStop`, `marchPausedLabel`, `registerMarchStop`, `clearMarchStop` (`pm.ts:511-546`) | BRAK (`grep` → 0) | `march_stop_notified/detail` bez producenta |
| R7 | `PlannedMarchDest.generalTargetId` | `RJ::PlannedMarchDest.general_target_id` `:1714-1719` jest; w `PlayablePlannedMarch` BRAK (#221 w toku) | zapis/odczyt — #221 |

R1–R4 i R6 wymagają **nowych wektorów z pinu `07d2fbd72`** (obecne `p6_4_vectors/march.json` są z `edb8fb56` i nie pokrywają przejścia przez własne jednostki). Decyzja techniczna (zasada 9: parytet 1:1, bez pytania właściciela).

---

## 4. Propozycja podziału na wdrożenia (NIE wdrażać w tym temacie)

Kolejność: Q2 → Q3 → Q4 → Q5 → Q6. Q2 można zacząć od razu (po zintegrowaniu #221 albo z rebase na nim). Q3 jest warunkiem Q5 i Q6.

| ID | Zakres | Allowlista | Wektory / testy | Zależności | Model |
|---|---|---|---|---|---|
| `R-RUSTPORT-P4-1H-CANCEL-Q2` | `PlayableGame::cancel_planned_march(unit_id, force)` 1:1 z `clearPlannedMarch` gałąź `unitId` (`main.ts:31051-31056`) + `EngineCommand::CancelPlannedMarch` w obu adapterach `bridge.rs` (`:270-300` i `:375-395`) | `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/src/bridge.rs`, `rust-port/engine/tests/p4_1h_cancel_planned_march.rs` (NOWY), run dir | testy: (a) `force=false` + `attack_unit_id` → stan bajt-w-bajt bez zmian; (b) `force=false` bez ataku → 4 mapy wyczyszczone; (c) `force=true` z atakiem → wyczyszczone; (d) brak planu → `Ok`, bez zmian; (e) podwójne wywołanie; (f) inne jednostki nietknięte (kolejność `planned_marches` zachowana); (g) nieznana / obca jednostka — zachowanie web: `Map.delete` bez błędu → NIE_ZMIERZONO, czy Rust ma zwracać błąd (rekomendacja: `Ok` jak web) ; mutacja „pomiń warunek attack” musi dać FAIL | #221 (konflikt pliku) | HAIKU |
| `R-RUSTPORT-P4-1H-RJ-REPIN-Q3` | dryf `RJ` do `07d2fbd72`: R1–R4, R6 (`MoveOccupancy` z `pass_through`, `trim_segment_end_off_pass_through`, `is_pass_through_hex`, `siege_blocks_entry` jako wstrzyknięty predykat, 4 funkcje powiadomień) + `trim_path_to_stack_room` (`army-stack-limit.ts:86`) | `rust-port/engine/src/domain/pathfinding.rs`, `rust-port/engine/src/domain/army_follow_auto_merge.rs` (lub nowy moduł limitu), `rust-port/engine/tests/p4_1h_rj_repin*.rs` + `p4_1h_rj_repin_vectors/` (NOWE: `gen.mjs` na pinie, `vectors.json`, strażnik SHA-256 fragmentów), stare `p6_4_*` tylko gdy wektor `edb8fb56` zmienia wynik (aktualizacja oczekiwań, nie luzowanie) | ≥ 200 przypadków z URUCHOMIONEGO `pm.ts`/`setup.ts@07` z `MoveOccupancy` (pass-through na środku trasy, na końcu segmentu, jedyny heks w zasięgu, cel = własna jednostka = scalenie), oblężenie celu i heksu pośredniego; mutacje: usunięcie trimu → FAIL | brak | SONNET uzasadniony (synteza dryfu 771 linii, wiele ścieżek) albo HAIKU wg zasady 2 — decyzja orkiestratora |
| `R-RUSTPORT-P4-1H-MOVE-MODEL-Q4` | adapter `PlayableState → RuchMapa/RuchJednostka/MoveOccupancy` (koszt terenu `PlayableTerrain`→`TerenBazowy`, `movement`→`ruch_left`), `moved_by_player_this_turn` w stanie (czyszczone w `advance_turn`), bez zmiany zachowania `move_unit` | `playable.rs`, nowy `rust-port/engine/src/domain/playable_movement.rs`, testy | test zgodności adaptera: dla mapy testowej koszt/zajętość = ręcznie policzone z webu | Q3; decyzja o reprezentacji ruchu (u8 vs f64) — techniczna, zapis w `REJESTR-RUST.md` | HAIKU |
| `R-RUSTPORT-P4-1H-PREVIEW-Q5` | zapytanie `preview_path` (`refreshHoverPathPreview` + `refreshPlannedMarchPreview`), `PathRouteDto { hexes, turn_stops }` w view-model, `budget=None` | `bridge.rs`, `playable_movement.rs`, `rust-port/view-model/src/overlays.rs` (zmiana pola), testy | wektory `planPathTurns` z pinu na adapterze; test: jednostka z planem ignoruje `destination`; brak trasy → `None`; brak eventu stanu | Q3, Q4; uzgodnienie zmiany `path_route` z P4-1F/P4-1G | HAIKU |
| `R-RUSTPORT-P4-1H-MOVE-Q6` | `move_unit` = `planMarchTo` + `executeMarchSegmentForUnit` (bez animacji: skutki z `main.ts:44100-44111` i `:44180-44194` w zakresie dostępnego stanu); usunięcie reguły „tylko sąsiad” (`playable.rs:937`); `attack_unit_id` w komendzie | `playable.rs`, `playable_movement.rs`, `bridge.rs`, testy; aktualizacja `tests/playable_slice.rs:58-68` (oczekiwania sąsiedztwa) | scenariusze: cel w zasięgu (dotarcie, plan usunięty), cel wieloturowy (plan zostaje, `turn_stops`), brak trasy, obce miasto, limit stosu, cel = własna jednostka, cel = wróg (atak — tylko zapis planu, bitwa poza zakresem), brak MP (plan zapisany, bez segmentu) | Q3, Q4, Q2 | SONNET uzasadniony (wiele ścieżek, stan) albo HAIKU — decyzja orkiestratora |

Poza #217 (osobne tematy, jawnie NIE_ZMIERZONO tutaj): wykonanie planów na koniec tury (`runPlannedMarchesAtPlayerEndTurn`), `march_continue` (P2-5 U11), skutki ruchu wymagające stanu spoza `PlayableState` (chatki, obozy, mgła/`explored`, bonusy wizyty miasta, forty, auto-zdobycie miasta, propozycja scalenia, `syncGeneralMarchTargets` — #221 pkt 4), atak po dotarciu (`tryLaunchMarchAttack` → bitwa).

---

## 5. NIE_ZMIERZONO

1. Zachowanie `cancel_planned_march` dla nieistniejącej / obcej jednostki: web nie ma takiej ścieżki (wołający zawsze podaje `selectedId`); propozycja `Ok` bez zmian — do potwierdzenia przez Evaluatora.
2. Czy `computeReachable@07` vs `compute_reachable` różnią się poza `passThrough` (R5) — nieuruchomione.
3. Pełny diff `setup.ts`/`armyMerge.ts` `edb8fb56→07d2fbd72` przeczytany tylko w części dotyczącej ruchu (`planned-march.ts` przeczytany w całości).
4. `armyStackLimit()` (`main.ts:4358`) — wartość i źródło nieodczytane.
5. Kolejność zdarzeń `mouseup`/`contextmenu` na platformach (kontrakt §5.2 pkt 4, `P4-5B` Z15) — poza tym tematem.
6. Stan wdrożenia #221 (`R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1` r2) — na bazie `2f9a12786` niezintegrowany; ostateczny stan sprawdzić przy dispatchu Q2.
7. Żadnych testów nie uruchomiono (temat tylko odczytu, bez `cargo`).

## 6. Dowody (polecenia)
- `git fetch origin rust-port/parity-v2` → `2f9a12786`; `git show 07d2fbd72:gra/src/{main.ts,game/planned-march.ts,units/setup.ts}` do scratchpadu.
- `git grep -n "cancelPlannedMarch\|previewPath\|function moveUnit\|moveUnit(" 07d2fbd72 -- gra/src` → 0.
- `git grep -n "beginMoveSelectedUnitTo\|planMarchTo\|refreshHoverPathPreview\|stopPlannedMarchForSelected\|continuePlannedMarchForSelected" 07d2fbd72 -- gra/src`.
- `git grep -n "cancel_planned_march\|preview_path\|move_unit" rust-port/`; `Grep` po `execute_march_step|plan_path_turns\(|trim_path_to_stack_room|pass_through|occupied_for_move` (tylko definicje w `pathfinding.rs`), `siege_blocks_entry` → 0, `is_notifiable_march_stop|...` → 0.
- `git diff --stat edb8fb56 07d2fbd72 -- gra/src/game/planned-march.ts gra/src/units/setup.ts gra/src/game/army-stack-limit.ts gra/src/game/armyMerge.ts gra/src/game/city-siege-state.ts gra/src/ui/mapUnitCursor.ts` → 5 plików, +771/−43; `git diff edb8fb56 07d2fbd72 -- gra/src/game/planned-march.ts` (przeczytany).
- `head -c 400 rust-port/engine/tests/p6_4_vectors/march.json` → `"pin":"edb8fb56"`.
