# R-RUSTPORT-P6-K5LOOP-WIRING-ROZP-Q1 — rozpoznanie #369 K5LOOP-WIRING (#113) i #370 I5 BATTLE-ACTIONS-SIEGE (#280)

```text
STATUS: PASS-WITH-NOTES (rozpoznanie tylko do odczytu)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-ROZP-Q1
GOAL: ustalić, co trzeba zrobić, żeby ProdBody + SiegeLoop były produkcyjną pętlą bitwy oblężniczej (#369),
      a pętla oddawała Vec<BattleActionDto> z ruchem i strzałem (#370); podział na tematy Workflow.
ZMIANY/COMMIT: brak (jeden plik raportu, niezacommitowany)
TESTY: pominięte (rozpoznanie, zakaz cargo)
BLOKADY: opisane w §2 i §5
RUNDY: 1/1
NASTĘPNY KROK: orkiestrator — wpis decyzji §4 do REJESTR-RUST.md, dispatche tematów z §3
DEPLOY/PUSH: NIE WYKONANO
```

Źródła: `origin/rust-port/parity-v2` = `38f5939e2` (K5LOOP-CLOSE r3 już zintegrowany, wbrew stanowi wejściowemu z
zadania: „r3 w toku”), pin webu `07d2fbd72` (`gra/src/main.ts`, `gra/src/battle/battleScene.ts`,
`gra/src/battle/battle-terrain.ts`). Odczyt wyłącznie przez `git show` / `git grep`. Linie Rust podane dla
`38f5939e2`. Linie pinu dla `07d2fbd72`.

---

## 0. Najważniejsze ustalenia (skrót)

1. **W webie bitwę oblężniczą na scenie uruchamia wyłącznie gracz.** AI nigdy nie odpala `BattleScene` dla
   oblężenia: szturm AI to `executeSilentSiegeStorm` (rachunek mocy, `main.ts:36730`, wołany z
   `scanAutoSiegesAfterAiTurn` `:18060` i `:18151`). „Auto” w oknie przed bitwą to `doSiegeAutoResolve`
   (`resolveAutoBattleByPower`, `main.ts:~36928`), także bez sceny. Scena powstaje tylko w gałęzi
   `onBattlefield` po `launchSiegeStormFromMap` (`main.ts:36799`, `new BattleScene` `:36980`, `bs.play` `:37008`).
   **Wniosek: `advance_turn` i `run_war_turn` NIE są wołającymi pętli.** Wołającym ma być nowa komenda mostu
   wywoływana przez gracza (§4 D-WIR-1).
2. **`ProdBody` dziś nie gra oblężenia.** W `ProdBody::start` (`siege_tactics_loop.rs:3084-3101`) każda
   aktywacja przy `scene.wall_col >= 0 || st.siege_wall_col >= 0` dostaje tag `oblezenie` i nic nie robi. Gałęzie
   oblężnicze `_activateUnit` (mur, wieża oblężnicza, taran, katapulta, obrońca na murze, obrońca nie wychodzi,
   `battleScene.ts:6129-6230`) nie są wpięte w ciało. `ProdOps::tower_climb` / `infantry_to_tower` /
   `ram_tower_step` / `doctrine_step` zwracają stałe `false` (`:1074-1085`). Moduły czyste istnieją
   (`siege_tactics_tower.rs:344/399/439`, `siege_tactics_breach.rs:92-171`, `siege_tactics_walk.rs:235`,
   `siege_tactics_approach.rs:155-231`), ale ciało ich nie woła.
3. **Krok doktryny jest obowiązkowy w AUTO.** Pin: `_getEffectiveDoctrine` zwraca domyślnie `'steady'`
   (`:17612-17619`), `_isUnitDoctrineAuto` domyślnie `true` (`:17621-17630`). Dlatego w AUTO każda jednostka
   atakującego, która nie jest machiną, najpierw idzie do `_executeGroupDoctrineStep` (`:6087-6099`, ciało
   `:17966+`), a gałąź `steady` zawsze kończy się `return true` (`_cavalryAction` / strzał / `_rangedAction` /
   `_advanceStep`, `:17992-18024`). Wyjątki: obrońca w oblężeniu (`siegeDefenderNeverDoctrine`, `:6087`) i machina
   atakującego (`:6091`). W Rust jest tag `doktryna` (`:3094-3095`), a `ProdOps::doctrine_step` = `false`.
   Bez #264 (K5DOC-T8) produkcja dałaby inną kolejność decyzji niż pin.
4. **Ustawienie bitwy (teren, wycięcie muru, rozstawienie jednostek) nie istnieje w silniku.** Generator
   `generateBattleTerrain` (`battle-terrain.ts:403`, deterministyczny, ziarno `'bf:' + teren`,
   `battleScene.ts:2795-2805`), `_carveBattleBox` `:3917`, `_carveWallTiles` `:4026`, `_placeSiegeTowers` `:4158`,
   `_placeSiegeDefenders` `:4442`, `_placeUnits(..., siegeMode)` `:5276`, `_repositionSiegeAttackers` `:4427` są
   częściowo tylko w rendererze (`renderer/src/battle/field.rs:437 carve_wall_tiles`, `units.rs`), a renderer sam
   deklaruje, że generator i punktacja rozstawienia „należą do domeny bitwy (P6.13)” (`field.rs:13-16`,
   `units.rs:36-40`). W silniku nie ma `MoveTerrain` poza testami (4 `impl MoveTerrain` tylko w
   `engine/tests/p6_k5*`), nie ma rosterów szturmu (`collectSiegeAtkRoster` / `collectSiegeDefRoster`), nie ma
   `runtimeToBattleUnit`, nie ma `_applyStartingMoralePowerPenalty` (`:5597`).
5. **Jedynym sterownikiem czasu jest przewijanie.** `SiegeLoop::resume` ustawia `set_ff_active(true)`
   (`siege_tactics_loop.rs:691-700`), więc ciało nigdy nie emituje `BattleAction::Damage` (pin `:9943`). W webie
   zwykła bitwa idzie w czasie rzeczywistym (`_drainTimers` `:9616-9634`), a przewijanie tylko po `skip()`
   (`:3680-3707`). `VirtualClock` ma `advance_v_clock` i `drain_timers` (`siege_tactics_clock.rs:90`, `:126`), ale
   `SiegeLoop` nie ma publicznego kroku czasu rzeczywistego. Bez niego renderer nie dostanie etykiet obrażeń ani
   aktualizacji paska HP (`playback.rs` aktualizuje HP tylko na `Damage`/`Kill`).
6. **`BattleAction::Move` ma już wszystkie pola potrzebne do DTO** (`siege_tactics_actions.rs:90-95`: `unit`,
   `from`, `to`, `arrive_at`). `actions_to_dto` zwraca `Err(MoveWithoutDto)` (`:526`) i `Err(ShotWithoutDto)`
   (`:527-529`). Dodanie wariantu do `BattleActionKindDto` (`view-model/src/battle.rs:550-633`) łamie
   wyczerpujący `match` w `renderer/src/battle/playback.rs:449-560`. **I5 wymaga więc builda renderera.**
7. **RNG produkcyjny nie istnieje.** Jedyny `impl RollSource` to `SequenceRolls` (`siege_tactics_blow.rs:46`).
   `PlayableState` ma `seed` (`playable.rs:129`) i jest `domain/rng.rs`.

---

## 1. STAN na `parity-v2` (`38f5939e2`)

### 1a. Pętla i ciało

| Element | Plik:linie | Stan |
|---|---|---|
| `LoopBody` (port ciała `_activateUnit`) | `engine/src/domain/siege_tactics_loop.rs:105-140` | gotowy; `set_ff_active`, `take_actions`, `set_now`, `tower_blow` |
| `SiegeEnv` (wieże, ratio morale, `TurnSeqEnv`) | `:376-526` | gotowy; `movement_points`, `fire_siege_towers`, `player_unit_idle` |
| `SiegeLoop` (`start`/`resume`/`run`, akcje, ramki, wieże zniszczone) | `:528-990` | gotowy; jedyny sterownik czasu = `run_fast_forward` (`:691-700`) |
| `SiegeLoop::actions_dto` | `:596-598` | woła `actions_to_dto`; dziś błąd przy `Move`/`Shot` |
| `ProdUnit` (konfiguracja jednostki, szablony ciosów) | `:1015-1033` | `blow`, `counter_blows`, `body_ms`, `facing`, `melee_target` = wejścia adaptera |
| `ProdBody` (ciało produkcyjne) | `:1150-1240`, `new` `:1594`, `start` `:3066` | cios, kontratak, rout, śmierć, facing, ruch pieszy (`_advanceStep`), jazda, strzelec (KITE/marsz/strzał), odwrót, falanga |
| Strażnik zakresu w `start` | `:3084-3101` | `tryb-reczny`, **`oblezenie`**, `strzelec-bez-strzelania` (r4), **`doktryna`** |
| Tagi nieportowane w ciele | `:1986-2047`, `:3079`, `:3196` (`prod_tag` `:1101-1117`), `:3213`, `:3278`, `:3310`, `:3661`, `:3727`, `:3801`, `:3809` | `krok-naprzod-brak-terenu`, `krok-naprzod-atak`, `ucieczka-routed` (r4), `kawaleria-brak-terenu`, `strzal-bez-szablonu`, `cios-bez-szablonu`, `dowodca-rout`, `dowodca-fade`, `kontratak-strzelec`, `kontratak-bez-szablonu`, oraz z `prod_tag`: `wieza-wejscie`, `piechota-do-wiezy`, `taran-wieza`, `atak-muru`, `marsz`, `doktryna` |
| `ProdOps` (zapytania maszyny K5H) | `:1057-1098` | `doctrine_step`, `tower_climb`, `infantry_to_tower`, `ram_tower_step` = `false` |
| Teren ruchu | `ProdBody::terrain: Option<Box<dyn MoveTerrain>>` `:1204-1206` | brak terenu = jawny tag `*-brak-terenu`; `impl MoveTerrain` tylko w testach |
| RNG | `RollSource`, `SequenceRolls` (`siege_tactics_blow.rs:46`) | brak źródła produkcyjnego |

### 1b. Akcje i DTO

| Element | Plik:linie | Stan |
|---|---|---|
| `BattleAction` (silnik) | `engine/src/domain/siege_tactics_actions.rs:49-109` | `Turn`, `Facing`, `Melee`, `TowerShot`, `Damage`, `Clash`, `Rout`, `Kill`, `Log`, `End`, **`Move{unit,from,to,arrive_at}`** (`:90-95`), **`Shot{attacker,target,land_at}`** (`:102-106`) |
| `ActionError::{MoveWithoutDto,ShotWithoutDto}` | `:398-402` | jawny błąd zamiast cichego pominięcia |
| `actions_to_dto` | `:445-535` | `Move` → `Err` (`:526`), `Shot` → `Err` (`:527-529`); `validate_actions` na końcu |
| `BattleActionKindDto` (view-model) | `view-model/src/battle.rs:550-633` | 10 wariantów, brak `Move`/`Shot` i wariantów oblężniczych |
| `BattleActionDto::validate_at`, `validate_actions` | `:680-770`, `:772-783` | `hitAt/landAt >= t0`, `t0` niemalejące |
| Konsument renderera | `renderer/src/battle/playback.rs:443-570` | `match` wyczerpujący; `MoveAnim` (`dynamics.rs:322-370`), `launch_projectile` (`:268`) gotowe, niepodpięte (`playback.rs:31-37`) |
| Ramka | `engine/src/domain/siege_tactics_frame.rs:114 battle_frame`, `:196 record_frames` | pozycje i `on_wall_walkway` jako wejście adaptera (`FrameInput`) |
| Wynik | `siege_tactics_outcome.rs:298 build_battle_outcome`, `:363 build_battle_outcome_instant` | E1–E4 |
| „Pomiń” | `siege_tactics_instant.rs:332 compute_instant_result`, `:548 skip_instant_fallback` | rozstrzygnięcie pary wstrzyknięte (`InstantPairResolver`) |

### 1c. Ścieżki produkcyjne Rust

| Ścieżka | Plik:linie | Czy woła pętlę |
|---|---|---|
| `PlayableGame::advance_turn` | `engine/src/domain/playable.rs:1567-1655` | nie (i nie powinien, §0.1) |
| `run_diplomacy_war_phase` → `run_war_turn` | `playable.rs:~1657-1685`, `turn_war_pipeline.rs:251` | nie (faza dyplomacji; oblężenie AI to rachunek mocy, nie scena) |
| Most (`EngineCommand`) | `engine/src/bridge.rs:28-84` | brak komendy bitwy/szturmu; są `MoveUnit`, `AdvanceTurn`, `DeclareWar`, `GetRender*` |
| Producent `BattleSetupDto` | brak w silniku; konsument `renderer/src/view/battle.rs` | — |
| Wywołania `SiegeLoop::new` / `ProdBody::new` | tylko `engine/tests/*` (16 plików, m.in. `p6_k5loop_close*.rs`, `p4_1i3_actions.rs`, `p4_1i2_frame*.rs`) | wyłącznie testy |

### 1d. Web: start bitwy oblężniczej i wejścia pętli

| Krok | Pin |
|---|---|
| Wejście gracza (panel oblężenia, akcja „Szturm”) | `main.ts:17953`, `:18162`, `:32528` → `launchSiegeStormFromMap` `:36799` |
| Rostery | `collectSiegeAtkRoster` + `appendReadyMachinesToRoster`, `collectSiegeDefRoster` (`:36920-36937` w funkcji) |
| Miasto bez obrońców | `captureCityWithoutBattle` (bez sceny) |
| Teren pola | `dTeren = map.hexes[key].terenBazowy ?? 'Rownina'`, `worldTerrainFromHex(dHex)` |
| Okno przed bitwą | `showPreBattle(pbInfo, {onAuto, onBattlefield, onCancel})`, `automaticOnly: playerBattleAutomaticOnly(...)` |
| Auto | `doSiegeAutoResolve` → `resolveAutoBattleByPower` → `finishSiegeStormBattle` (bez sceny) |
| Pole bitwy | `new BattleScene({attacker, defender, teren, worldTerrain, data, deploy: atk ma generała, deployPlayerSide:'atk', manualControlAllowed: atk ma generała, siege:{defCiv, builtBuildingIds}, civBonusy, era, głód, deficyt złota, poziom trudności})` `:36980-37006` |
| Zakończenie | `bs.play(res => { consumeReadyMachines(city); finishSiegeStormBattle(city, atk, def, res, ...) })` `:37008-37020`; `finishSiegeStormBattle` `:36596` |
| Konstruktor sceny | `battleScene.ts:2717`; `_manualCommanderGate = opts.manualControlAllowed !== undefined` `:2718`; teren `:2795-2805`; `deployPhase` `:3490` |
| Start | `play` `:3547` (czeka przy `deployPhase`), `_startBattle` `:3558-3600` (`_applyStartingMoralePowerPenalty`, `_manualMode = !gate \|\| hasCommander`), `_kickoffBattleTurn` `:3615` (`_beginTurn` w turze 0) |
| Ciało | `_activateUnit` `:6048-6300` (doktryna `:6087-6099`, okrążenie `:6101-6117`, facing `:6121`, obrońca na murze `:6129-6170`, wieża oblężnicza `:6179-6180`, machiny atakującego `:6187-6220`, obrońca oblężenia `:6225+`, strzelec `:6241`, jazda `:6284`, falanga `:6290`, krok `:6298`) |
| Ruch | `_doMove` `:8700-8775`: `occByKey`, koszt, `_updateFacing` (`:8750`) **przed** `t0 = this._now()` (`:8752`), animacja `MOVE_STEP_MS` |
| Czas | czas rzeczywisty: `_drainTimers` `:9616-9634`; przewijanie tylko po `skip()` `:3680-3707` |

Wniosek dla trybu: bez generała atakującego `deploy = false`, `_manualCommanderGate = true`, `hasCommander = false`,
więc `_manualMode = false` i bitwa idzie w AUTO od razu. Z generałem jest faza rozstawienia i tryb ręczny
(K5EXEC, #268), co jest poza zakresem #369.

---

## 2. LUKI do produkcyjnego wołającego

| # | Luka | Dowód | Kto zamyka |
|---|---|---|---|
| L-W1 | Gałęzie oblężnicze ciała: obrońca na murze (w tym kontrbateria katapulty), obrońca oblężenia nie wychodzi, wieża oblężnicza (wejście na mur, piechota do wieży), taran/wieża (`_siegeRamTowerStep`), katapulta (`_attackWallTile` + `_advanceToward`), wpięcie `ProdOps::tower_climb/infantry_to_tower/ram_tower_step` | `siege_tactics_loop.rs:3086-3088` (tag `oblezenie`), `:1077-1085`; pin `:6129-6230` | T1, T2 |
| L-W2 | Mur i brama w pętli: `attack_wall_tile`, `breach_wall_tile` (odwrót obrońców z muru, `MORALE_WALL_BREACH`), `attack_gate`/`breach_gate` (`MORALE_GATE_BREACH`), `destroy_tower_at_row` przy wyłomie | `siege_tactics_breach.rs:92-171` (czyste), luka L3 z `P4-1I-BATTLE-ROZPOZNANIE.md` §3 | T2 |
| L-W3 | Krok doktryny (`_executeGroupDoctrineStep`, gałąź `steady` domyślna) | §0.3; tag `doktryna` `:3094` | T3 = #264 |
| L-W4 | Ucieczka (`_fleeStep`), `_shakeAlliesOnLoss`, `strzelec-bez-strzelania` | tagi `:3079`, `:3092`; D-K5C-r4-1 | r4 (#368, w toku) |
| L-W5 | Dowódca (`dowodca-rout`, `dowodca-fade`), kontratak strzelca (`kontratak-strzelec`) | `:3661`, `:3727`, `:3801` | T4 (domknięcie tagów) |
| L-W6 | Ustawienie pola: teren (`generateBattleTerrain`), `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles`, rzędy wież, rozstawienie obu stron (`_placeUnits` siege, `_placeSiegeDefenders`, `_repositionSiegeAttackers`), `MoveTerrain` z siatki | §0.4 | T5 |
| L-W7 | Adapter `PlayableState → ProdBody`: rostery szturmu, `runtimeToBattleUnit` (+ `armyLeaderMoraleBonusFrac`, `civBonusy`, `difficultyCombatMult`), `to_combat_unit`, flagi klas (`siege_tactics_class_adapters.rs:30-96`), szablony ciosów `blow`/`counter_blows`/`ranged_blows` dla **każdej pary** (dziś jeden `melee_target` z wejścia), `ammo_left`, `ranged_base`, `facing` startowy, `names`, `tower_shooter_nazwa`, `ActivateScene`, kara morale na starcie (`:5597-5629`) | `ProdUnit` `:1015-1033`; FC r3 N4 (REJESTR-RUST: „adapter musi podawać `MoveTerrain`, `ammo_left`, szablony `ranged_blows`”) | T6 |
| L-W8 | Wybór celu w ciele: `ProdUnit::melee_target` to wejście (`:1020-1021`), a pin liczy `_targetInRange` w chwili aktywacji z bieżących pozycji | `:3118-3123` | T6 (szablony per para) + sprawdzić, czy r2/r3 nie przeniosły już wyboru do ciała (C-FLANK używa `pick_target_by_priority`) — NIE_ZMIERZONO dla zwykłego ciosu |
| L-W9 | Sterownik czasu rzeczywistego (`ff_active = false`, `Damage` emitowane) | §0.5 | T7 (#369) |
| L-W10 | RNG produkcyjny `RollSource` | §0.7 | T7 |
| L-W11 | Komenda mostu i sesja bitwy (start, krok, „Pomiń”, wynik) | `bridge.rs:28-84` | T7 |
| L-W12 | Zastosowanie wyniku na mapie (`finishSiegeStormBattle`: HP ocalałych, straty, zdobycie miasta, zużycie machin) | `main.ts:36596`, `:37010` | T8 = #354/#115 (zdobycie) + część T7 (HP/straty) |
| L-W13 | DTO `Move`, `Shot` i wariantów oblężniczych + konsument renderera | §0.6 | T9 = #370 I5 |
| L-W14 | Producent `BattleSetupDto` (dla renderera) z ustawienia T5 | brak w silniku | T5 (dane) + T9/#371 (droga do renderera) |

---

## 3. PODZIAŁ na tematy Workflow

Model wg zasad orkiestratora: tematy 3D/grafiki/renderera = Opus wszystkie etapy; czysty silnik bez grafiki
domyślnie Haiku (Operator/Obrona) i Sonnet (Evaluator/FC). Linia K5 była dotąd prowadzona na Opusie (REJESTR
2026-11-18); decyzję o modelu dla T1–T8 podejmuje orkiestrator i wpisuje uzasadnienie do dispatchu.
Wszystkie tematy: baza = SHA po integracji r4 K5LOOP-CLOSE, pin `07d2fbd72`, generator TS wykonujący tekst
pinu (jak `p6_k5loop_close_r3`), mutanty, `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR` w scratchpadzie tematu.

| Kol. | ID | GOAL | Allowlista | Kryteria końca | Bramki | Dysk / renderer |
|---|---|---|---|---|---|---|
| 0 | `R-RUSTPORT-P6-K5LOOP-CLOSE-R1` r4 (#368, w toku) | `_fleeStep` + `_removeUnitFromScene` + `_shakeAlliesOnLoss` + `strzelec-bez-strzelania` + FC-U1/U2 (FC-U3 → I5) | jak r3 | tagi `ucieczka-routed` i `strzelec-bez-strzelania` zniknęły z kodu; wektory pinu | fmt, clippy `-D warnings`, `p6_k5loop_close_r4`, pełny engine | ≥ 8 GB, bez renderera |
| 1 | `R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1` (T1) | obrońca w oblężeniu w ciele: `onWallWalkway` (zasięg +1, kontrbateria katapulty `bestCata`, trzymanie muru, cios sąsiada), obrońca oblężenia nie wychodzi (`:6225+`); zdjęcie tagu `oblezenie` **tylko dla strony `def`** | `engine/src/domain/siege_tactics_loop.rs`, nowy `engine/tests/p6_k5loop_siege_def*.rs`, generator `engine/tests/gen/p6_k5loop_siege_def*.mjs`, `vectors_*` | dla `def` przy `siege_wall_col >= 0` zero tagu `oblezenie`; wektory pinu gałęzi `:6129-6170`, `:6225-6235` z wyborem celu i facing; ≥ 10 mutantów, wszystkie zabite albo jawnie równoważne | jw. + nowy test | ≥ 8 GB, bez renderera |
| 2 | `R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-Q1` (T2) | machiny i piechota atakującego: `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, `_siegeRamTowerStep`, katapulta `_attackWallTile`/`_advanceToward` (+ `_siegeMachineRange`), `_siegeWalkTo`; mur/brama/wyłom w pętli z `MORALE_*`, odwrotem z muru, `destroy_tower_at_row`; akcje silnika: `Boulder`, `WallDamage`, `Ram`, `GateDamage`, `WallBreach`, `GateBreach`, `TowerDestroyed`, `ClimbWall`, `LeaveField` (tylko `BattleAction`, bez DTO) | `siege_tactics_loop.rs`, `siege_tactics_actions.rs` (tylko enum + `actions_to_dto` → nowe `ActionError::*WithoutDto`), nowe testy/generator | tag `oblezenie` zdjęty całkowicie; `prod_tag` nie zwraca `wieza-wejscie`, `piechota-do-wiezy`, `taran-wieza`, `atak-muru`, `marsz`; wektory pinu `:6179-6220`, `_attackWallTile`, `_attackGate`, `_breachWallTile` `:7697-7750`, `_breachGate` `:7804-7810` | jw. | ≥ 8 GB; temat duży — rozważyć podział T2a (wieża/taran/wejście na mur) i T2b (katapulta, mur, brama, wyłom) |
| 3 | `R-RUSTPORT-P6-K5DOC-T8-Q1` (#264, T3) | `_executeGroupDoctrineStep` (`:17966-18070`, w tym `_executeSkirmishDoctrineStep`, `defensive`, `aggressive`) w ciele; `ProdOps::doctrine_step`; bramki `siegeDefenderNeverDoctrine`/`siegeMachineNeverDoctrine` | `siege_tactics_loop.rs`, ewentualnie `siege_tactics_doctrine_*.rs`, testy | tag `doktryna` usunięty; domyślna doktryna `steady` z `doctrine_auto = true` daje te same zdarzenia co pin dla ≥ 4 rodzin (jazda, strzelec w zasięgu, strzelec poza zasięgiem, piechota) | jw. | ≥ 8 GB |
| 4 | `R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1` (T4) | reszta tagów: `dowodca-rout`, `dowodca-fade` (efekty dowódcy), `kontratak-strzelec`, `krok-naprzod-atak` | `siege_tactics_loop.rs`, testy | `ProdBody::unported` pusty dla każdej bitwy AUTO bez trybu ręcznego, gdy adapter podał teren i szablony (tagi `*-brak-terenu`, `*-bez-szablonu` zostają jako błędy wejścia) | jw. | ≥ 8 GB |
| 5 | `R-RUSTPORT-P6-BATTLE-SETUP-Q1` (T5) | domena ustawienia pola: `generateBattleTerrain` + `presetForWorldTerrain` + `battleSafeCols`/`battleClearSideCap`, `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles`, rzędy wież, rozstawienie `_placeUnits(siegeMode)`/`_placeSiegeDefenders`/`_repositionSiegeAttackers`; `impl MoveTerrain` na siatce; producent `BattleSetupDto` | nowe `engine/src/domain/battle_setup*.rs`, `engine/src/domain/mod.rs`, testy + generator; **bez** zmian w `renderer/` | ten sam wynik siatki i pozycji co pin dla ≥ 6 scenariuszy (z/bez presetu, różne liczności, mur/palisada/cytadela); test równości z `renderer/src/battle/field.rs::carve_wall_tiles` i `tile_jitter` (tylko odczyt, test w engine nie może zależeć od renderera — porównanie przez fiksturę JSON) | fmt, clippy, nowe testy, pełny engine | ≥ 8 GB; można podzielić T5a (teren+mur) i T5b (rozstawienie) |
| 6 | `R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1` (T6) | adapter `PlayableState → (TurnSeqState, SiegeEnv<ProdBody>)`: rostery szturmu (`collectSiegeAtkRoster`, `appendReadyMachinesToRoster`, `collectSiegeDefRoster`, limit `BATTLE_MAX_PER_SIDE`), `runtimeToBattleUnit`, `to_combat_unit`, flagi klas, szablony `blow`/`counter_blows`/`ranged_blows` dla wszystkich par, `ammo_left`, `ranged_base`, `names`, `tower_shooter_nazwa`, `ActivateScene`, `_applyStartingMoralePowerPenalty` | nowy `engine/src/domain/siege_battle_adapter.rs`, `mod.rs`, testy | dla stanu gry z miastem z murem adapter daje rostery i szablony równe wektorom pinu (`rosterToBattleUnits` + `toCombatUnit` + `_singleBlow` input); brak cichych zer (błąd przy brakującej definicji jednostki) | jw. | ≥ 8 GB; zależy od T5 (pozycje) |
| 7 | `R-RUSTPORT-P6-K5LOOP-WIRING-Q1` (#369, T7) | produkcyjny wołający: `SiegeBattleSession` (start → kroki czasu rzeczywistego `ff_active=false` → `skip()` = przewijanie → wynik), RNG z `PlayableState.seed`, komendy mostu `StartSiegeStorm{city_id, unit_id}` (odrzucenie, gdy atakujący ma generała: tryb ręczny poza zakresem), `StepSiegeBattle{wall_ms}` (zwraca `BattleFrameDto` + akcje), `SkipSiegeBattle`, `FinishSiegeBattle`; zastosowanie HP ocalałych/strat do `PlayableState` (część `finishSiegeStormBattle` bez zdobycia miasta) | `engine/src/domain/siege_tactics_loop.rs` (publiczny krok czasu rzeczywistego), nowy `engine/src/domain/siege_battle_session.rs`, `engine/src/bridge.rs`, `engine/tests/bridge_contract.rs`, nowe testy | jedna bitwa od komendy mostu do `BattleOutcomeDto` bez `unsupported` i z pustym `unported`; ten sam wynik przy podziale kroków (test niezależności jak `p6_siege_tactics_loop_resume`); `Damage` emitowane w trybie czasu rzeczywistego, pomijane po `skip`; brak zmian w `advance_turn`/`run_war_turn` | fmt, clippy, pełny engine, `bridge_contract` | ≥ 8 GB, bez renderera |
| 8 | `R-RUSTPORT-P6-ZDOBYCIE-MIASTA-WIRING` (#354/#115) | zdobycie miasta po wygranym szturmie (`apply_transfer_with_effects`, `run_capital_capture_plunder`, zużycie machin `consumeReadyMachines`) wołane z T7 | wg dispatchu #354 | jw. | jw. | ≥ 8 GB |
| 9 | `R-RUSTPORT-P4-1I5-BATTLE-ACTIONS-SIEGE` (#370, T9) | DTO: `Move`, `Shot`, oraz warianty T2 (`Boulder`, `WallDamage`, `Ram`, `GateDamage`, `WallBreach`, `GateBreach`, `TowerDestroyed`, `ClimbWall`, `LeaveField`); `actions_to_dto` bez `*WithoutDto`; walidacja; konsument w `playback.rs` (`MoveAnim::start`, `launch_projectile`, `RamAnim`, `Boulder`, `breach_*`, `destroy_tower_at_row`, `climb_onto_wall_walkway`); FC-U3 (`Damage` strzału w wektorach) | `view-model/src/battle.rs`, `view-model/tests/battle_actions.rs`, `engine/src/domain/siege_tactics_actions.rs`, `engine/tests/p4_1i3_actions.rs` (+ nowy `p4_1i5_*`), `renderer/src/battle/playback.rs`, `renderer/tests/battle_playback.rs` | `actions_to_dto` nie ma żadnego wariantu błędu „bez DTO”; scena po odtworzeniu akcji = scena po wywołaniach pinu (fikstury `tests/fixtures/battle3d/`); serde round-trip | fmt, clippy (engine, view-model, renderer), pełny engine, testy renderera | **renderer: ≥ 12 GB wolnego, bez równoległego builda renderera** (reguła REJESTR 2026-11-18); Opus |

Kolejność i zależności:

```text
r4 (#368) ─┬─> T1 SIEGE-DEF ─┐
           ├─> T3 DOC-T8 ────┼─> T4 TAGS-REST ─┐
           └─> T2 SIEGE-ATK ─┘                 │
T5 SETUP ──> T6 ADAPTER ───────────────────────┴─> T7 WIRING (#369) ──> T8 ZDOBYCIE (#354)
I5a (Move/Shot DTO) może iść równolegle po r4; I5b (warianty oblężnicze) po T2.
```

- T5 nie zależy od K5 (czysty generator i rozstawienie) — można startować od razu po zwolnieniu slotu, równolegle
  z r4.
- T1 i T3 dotykają tego samego pliku (`siege_tactics_loop.rs`) co r4 i T2: **jeden temat naraz na tym pliku**
  albo sekwencyjnie z rebase (ryzyko konfliktów, §5 R1).
- I5 rekomenduję podzielić: **I5a** = `Move` + `Shot` (pola już są w silniku, można zaraz po r4) i **I5b** =
  warianty oblężnicze (po T2). Oba z buildem renderera.

Warunki startu #369 (T7): zintegrowane r4, T1, T2, T3, T4, T5, T6; `ProdBody::unported` pusty w teście
pełnej bitwy AUTO z murem; jest `impl MoveTerrain` produkcyjny i `impl RollSource` produkcyjny (ten drugi może
wejść w T7). Warunek startu #370: I5a — po integracji r4 (żeby `Shot`/`Move` z r3/r4 były stabilne); I5b — po
T2.

---

## 4. DECYZJE techniczne (do wpisania do `REJESTR-RUST.md`)

- **D-WIR-1 (wołający).** Produkcyjnym wołającym `SiegeLoop` jest komenda mostu wydana przez gracza
  (odpowiednik `launchSiegeStormFromMap` → `onBattlefield`), nie `advance_turn` ani `run_war_turn`.
  Uzasadnienie: w pinie AI szturmuje wyłącznie przez `executeSilentSiegeStorm` (`main.ts:36730`, wołane z
  `:18060`, `:18151`), a „Auto” gracza przez `resolveAutoBattleByPower` (`doSiegeAutoResolve`). Scena powstaje
  tylko w `onBattlefield` (`:36980`). Port `executeSilentSiegeStorm`/`resolveAutoBattleByPower` to osobny temat
  (nie K5).
- **D-WIR-2 (zakres trybu).** #369 obejmuje AUTO bez generała po stronie atakującego (`deploy = false`,
  `_manualMode = false`, `battleScene.ts:2718`, `:3567-3570`). Z generałem komenda zwraca jawny błąd
  „tryb ręczny/rozstawienie nieportowane” (K5EXEC #268), bez cichego przejścia na AUTO.
- **D-WIR-3 (czas).** Dwa sterowniki jak w pinie: czas rzeczywisty (`_drainTimers`, `ff_active = false`,
  `Damage` emitowane) i przewijanie po `skip` (`run_fast_forward`, `ff_active = true`, `:3680-3707`). Sterownik
  czasu rzeczywistego przyjmuje `wall_ms` od klienta (`VirtualClock::advance_v_clock`, `siege_tactics_clock.rs:90`).
  Kwantyzacja klatek rAF = wejście klienta (NIE_ZMIERZONO zgodność animacji przy różnych FPS).
- **D-WIR-4 (ustawienie pola w silniku).** Generator terenu, wycięcie pola/muru i rozstawienie jednostek
  należą do silnika (pozycje są wejściem logiki: `_targetInRange`, ruch, wyłom). Renderer zostaje konsumentem
  `BattleSetupDto`. Istniejące `renderer/src/battle/field.rs::carve_wall_tiles` i `tile_jitter` zostają do czasu
  przepięcia renderera na DTO; równość pilnuje fikstura. Uzasadnienie: deklaracja w `field.rs:13-16` i
  `units.rs:36-40` (P6.13) oraz deterministyczny generator pinu (`battle-terrain.ts:403`, ziarno `'bf:' + teren`).
- **D-WIR-5 (RNG).** `RollSource` produkcyjny = `domain/rng.rs` z ziarnem pochodnym `PlayableState.seed` i
  licznika bitew; jeden rzut na wywołanie `Math.random` w tej samej kolejności co pin. Nie jest to gameplay
  (web używa `Math.random`, rozkład ten sam), ale daje powtarzalność zapisu i powtórki.
- **D-WIR-6 (kształt DTO `Move`).** `BattleActionKindDto::Move { id, from_col, from_row, to_col, to_row,
  arrive_at }`, `t0` = chwila `const t0 = this._now()` (`:8752`), `arrive_at = t0 + MOVE_STEP_MS` (240,
  `dynamics.rs:53`). Walidacja: `arrive_at >= t0`, `from != to`, sąsiedztwo nie jest wymagane przez DTO (pin
  `_doMove` nie sprawdza go). Konsument: błąd, gdy bieżąca komórka jednostki w scenie ≠ `from`, i błąd, gdy
  `arrive_at != t0 + MOVE_STEP_MS` (jak `HitAt` dla `Melee`). `Facing` z `_updateFacing` (`:8750`) idzie przed
  `Move` z tym samym `t0` — kolejność listy to zachowuje (`t0` niemalejące). Uzasadnienie: pola 1:1 z
  `BattleAction::Move` (`siege_tactics_actions.rs:90-95`) i z wejścia `MoveAnim::start(grid, unit, col, row, t0)`
  (`dynamics.rs:342`).
- **D-WIR-7 (kształt DTO `Shot`).** `BattleActionKindDto::Shot { attacker, target, land_at }`,
  `land_at = t0 + RANGED_FLY_MS` (380). Rodzaj pocisku liczy renderer z jednostki strzelca
  (`projectile_kind(category, name)`, `dynamics.rs:142`), jak web w `_doRangedAttack`; DTO go nie niesie.
  NIE_ZMIERZONO, czy `PlacedUnit` ma kategorię i nazwę jednostki — jeśli nie, I5a dodaje pole `kind` do DTO
  (decyzja w I5a po sprawdzeniu, bez pytania właściciela).
- **D-WIR-8 (renderer w I5).** Nowe warianty łamią wyczerpujący `match` (`playback.rs:449`). Nie dodajemy
  `#[non_exhaustive]` ani gałęzi `_ =>` (ukryłoby brak konsumenta). I5 ma w allowliście `renderer/src/battle/playback.rs`
  i buduje renderer.
- **D-WIR-9 (krok doktryny).** #264 jest warunkiem #369, nie dodatkiem: domyślne `steady` + `autoPlay = true`
  (`:17612-17630`) kieruje każdą jednostkę atakującego (poza machinami) przez krok doktryny.

**Pytania ABC do właściciela: brak.** Web rozstrzyga wszystkie powyższe sprawy (wołający, tryb, czas, ruch,
strzał, doktryna). Jedyne decyzje są techniczne (D-WIR-1…9). Gdyby orkiestrator chciał, żeby AI także
rozgrywało szturm na scenie (inaczej niż pin), byłoby to świadome odstępstwo od webu i wymagałoby pytania ABC —
nie rekomenduję.

---

## 5. RYZYKA

- **R1 — konflikty w `siege_tactics_loop.rs` (3944 linie).** r4, T1, T2, T3, T4 i T7 zmieniają ten sam plik.
  Równoległe tematy dadzą konflikty w `ProdBody::start` (`:3066-3200`). Mitygacja: sekwencja r4 → T3 → T1 → T2
  → T4 na tym pliku. Równolegle mogą iść tylko tematy z innymi plikami: T5, T6 (nowe pliki), I5a (view-model,
  `siege_tactics_actions.rs`, renderer). Rozważyć wydzielenie gałęzi oblężniczych do nowego modułu
  `siege_tactics_body_siege.rs`, żeby T1/T2 nie dotykały tych samych linii.
- **R2 — „zielone testy, brak produkcji”.** Wszystkie dotychczasowe wywołania pętli są w testach z ręcznymi
  szablonami ciosu i `melee_target`. Adapter T6 przeniesie wybór szablonu na pary; jeśli ciało nadal czyta
  `ProdUnit::melee_target` jako wejście (L-W8), produkcja może bić inny cel niż pin. Sprawdzić w T6 i dodać test
  pełnej bitwy z wyborem celu z pozycji.
- **R3 — rozmiar T2.** Mur, brama, wyłom, wieża, taran, katapulta, odwrót z muru i 9 nowych akcji w jednym
  temacie to ryzyko przekroczenia 5 rund. Rekomendowany podział T2a/T2b.
- **R4 — dysk.** Engine: ok. 3,5 GB na build tematu; renderer: ≥ 12 GB wolnego przed I5 i bez równoległego
  builda renderera. Stan w chwili rozpoznania: 12 GB wolnego na `/` (odczyt `df -h /`). Maksymalnie 2 buildy
  engine naraz poniżej 12 GB (reguła REJESTR 2026-11-18).
- **R5 — czas rzeczywisty vs przewijanie.** Pin w przewijaniu ma sufit tur `_ffRoundCapResult` (E3), a w czasie
  rzeczywistym go nie ma. T7 musi zachować obie ścieżki końca; test: ta sama bitwa w obu trybach może dać różny
  wynik tylko na ścieżce sufitu (NIE_ZMIERZONO, czy pin ma inny sufit w czasie rzeczywistym — sprawdzić w T7
  `_updateStallWatch` `:5568`).
- **R6 — `BattleSetupDto` i renderer.** T5 wytwarza dane, które renderer dziś liczy sam. Do czasu przepięcia
  renderera (#371/DTO-BRIDGE #364) są dwa źródła prawdy; równość tylko przez fiksturę.
- **R7 — zakres „Pomiń” przed startem.** `skip()` przed `started` woła `_skipInstantFallback` (`:3698`), który
  wymaga `InstantPairResolver` = pełne `resolveCombat` (dziś brak portu wejść, #135/#167). T7 musi albo
  zablokować „Pomiń” przed startem, albo poczekać na COMBAT-WEJSCIA. Rekomendacja: T7 obsługuje `skip` tylko po
  starcie (przewijanie), a przed startem zwraca jawny błąd do czasu #167.
- **R8 — stan wejściowy zadania nieaktualny.** Zadanie zakładało „r3 w toku”; `parity-v2` = `38f5939e2` ma r3.
  Plan powyżej bazuje na r3 zintegrowanym i r4 w toku (`wf_79ae731c-340`).
