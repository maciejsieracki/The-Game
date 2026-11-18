# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1
GOAL: strona ATAKUJĄCA przy murze w ProdBody: wejście na mur od wieży, piechota pod wieżę, taran/wieża
      (_siegeRamTowerStep), marsz (_advanceToward, _siegeWalkTo); zdjęcie tagów wieza-wejscie, piechota-do-wiezy,
      taran-wieza, marsz; nowa akcja silnika ClimbWall bez DTO (ActionError::ClimbWallWithoutDto).
ZMIANY/COMMIT: gałąź rust-port-wip/siege-atk-a-q1-op-r1: kod = 197d98d42 (rodzic 48832747b, tylko allowlista);
               raport = commit-dziecko 197d98d42 na tej samej gałęzi
TESTY: fmt/clippy EXIT 0; nowy test 6/6; bramkowe 8 plików zielone; pełny engine EXIT 0 (4043 passed, 0 failed,
       1 ignored = istniejący e2e::dump_tick1_econ_for_web_generator); mutanty 22/22 zabite
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `origin/rust-port/parity-v2` = `48832747bcb3285b7311c20c90358150ad27bea0` (zgodnie z dispatchem, faktyczny SHA
przy starcie). Pin webu: `07d2fbd72` (`git show`, `gra/` nietknięte).

## 1. Web najpierw — numery linii pinu (`gra/src/battle/battleScene.ts`, zweryfikowane, generator ma strażnik)

| Element | Pin | Uwagi |
|---|---|---|
| wywołania w `_activateUnit` | `:6179` `_trySiegeTowerClimb`, `:6180` `_siegeInfantryToTowerStep`, `:6187-6220` machiny | `:6192` `_siegeRamTowerStep`; katapulta `:6194-6219` (ostrzał `:6211` = T2b, marsz `:6214-6216`) |
| bramka doktryny machin | `:6091` `siegeMachineNeverDoctrine` | piechota atakującego w AUTO idzie najpierw w krok doktryny (`:6092-6099`) |
| `_advanceToward` | `:7892-7916` | kierunki `[[0,-1],[0,1],[-1,0],[1,0]]` (N,S,W,E), `=== Infinity` (koszt NaN NIE odrzuca), `d < bestDist` |
| `_siegeApproachRestricted` / `_siegeMoveRefused` | `:7951-7960` / `:7963-7970` | bramka `_doMove` `:8689` |
| `_bfsFirstStep` | `:7973-8003` | port K1b `bfs_first_step` (bez zmian) |
| `_siegeWalkTo` | `:8006-8019` | port K1b `siege_walk_to` (bez zmian), `STEP_GAP_MS = 70` |
| `_siegeRamTowerStep` | `:8022-8053` | taran: `nearGate` `:8027` → `_attackGate` (T2b), BFS z `prefRow` `:8031-8032`, `_advanceToward` `:8035`; wieża: `:8040` dopisanie, BFS z `arrive` `:8044-8048`, `_advanceToward(…, arrive)` `:8049` |
| `_trySiegeTowerClimb` | `:8056-8084` | wyłom `:8071-8074` (`attackerWallEntryIsBreach`, `city-fortification.ts:96-98`), `moveLeft = 0` `:8080` |
| `_siegeInfantryToTowerStep` | `:8087-8101` | cel `:8093-8096`, czekanie `:8097`, BFS `:8098-8099` |
| `_doMove` | `:8685-8776` | koszt `[1, 99]`, bród, `_updateFacing` z nowego pola, `t0` po facing |
| stan sceny | `siegeGateCol/Row` `:2450/:2452` (init −1), `siegeWallTilesInit` `:2458` (0), `towerAtWallRows` `:2499` | wartości inicjalne pinu = domyślne w Rust |

Dispatch wymienia `:6179-6220` — potwierdzone. Akcje wołane przez pin w tych gałęziach: tylko wejście na mur (pozycja
modelu na koronie bez animacji, `:8076-8079`) i wpis dziennika wyłomu (`this.log.push`, `:8074`). `Ram` (animacja
`_attackGate`) jest w T2b, `TowerDestroyed`/`LeaveField` nie występują w T2a — nie dodane (dispatch: „tylko te, które pin
wywołuje w tych gałęziach”).

Gameplay = 1:1 z pinem; brak pytań ABC.

## 2. Zmiany kodu (allowlista)

### 2.1 `engine/src/domain/siege_tactics_atk.rs` (NOWY) + `pub mod siege_tactics_atk;` w `domain/mod.rs`

Czyste decyzje (bez stanu, bez skutków): `goal_holds` (`isGoal` trzech marszów), `first_step` (BFS K1b z produkcyjną
przechodniością), `tower_climb_allowed`, `infantry_to_tower_plan` (`NotHandled`/`Wait`/`Walk`), `ram_tower_plan`
(`NotHandled`/`AttackGate`/`Walk{prefRow, arrive}`/`AdvanceToward{arrive}`/`AtWall`), `advance_toward_pick`.
Re-eksport `attacker_wall_entry_is_breach`, `WYLOM_LOG` z K3. K3 (`siege_tactics_tower.rs`) NIE zmieniony: ma atrapę
kosztu z harnessu (`move_cost` = tabela generatora) i własny adapter marszu, więc nie nadaje się do produkcji; predykaty
celu są te same (port 1:1 z pinu), test zgodności z pinem pokrywa oba.

### 2.2 `engine/src/domain/siege_tactics_loop.rs`

- `ProdBody::start`: usunięty strażnik `oblezenie` przed maszyną dla strony `atk`. Atakujący przy murze przechodzi przez
  maszynę K5H; po maszynie:
  - `U7.2-climb` → `siege_atk_climb` (zwolnienie pola, `q = wallCol`, `onWallWalkway`, wyłom + `Log` raz, zajęcie
    korony, `ClimbWall`, `moveLeft = 0`, czas 0);
  - `U7.2-inf` → `siege_atk_infantry` (marsz `_siegeWalkTo`);
  - `U7.3-ramtower` → `siege_atk_ram_tower` (`AttackGate` = tag `atak-bramy` T2b; `AtWall` = dopisanie wiersza; marsz
    BFS; `_advanceToward` z `arrive`);
  - `AdvanceToward{col,row}` katapulty → `siege_atk_advance_toward`;
  - `AttackWallTile` = tag `atak-muru` (T2b, bez zmian);
  - pozostałe gałęzie atakującego przy murze (krok doktryny, cios U7.1/U7.6/U7.9, `_rangedAction`, `_fallBackStep`,
    `_cavalryAction`, `_phalanxAction`, `_advanceStep`) = jeden jawny tag `oblezenie` (T2b/T4), bez akcji i bez kroku
    doktryny. Uzasadnienie: przy murze ruch tych klocków przechodzi przez bramkę `_siegeMoveRefused` (`:8689`), której
    klocki T4b/T5/T6 w ciele nie mają (zagrożenia `_siegeShooterThreats` = T2b).
- `ProdOps::tower_climb / infantry_to_tower / ram_tower_step` zwracają decyzje policzone przed maszyną
  (`siege_atk_plan`, ta sama pozycja i zajętość: między startem aktywacji a tymi wywołaniami pin zmienia tylko morale
  okrążenia i `facing`, których te funkcje nie czytają). Brak `MoveTerrain` przy BFS = maszyna dostaje `true`, ciało
  zapisuje jawny tag `piechota-do-wiezy-brak-terenu` / `taran-wieza-brak-terenu` / `marsz-brak-terenu` (D1 K5DOC-T4e-0,
  jak `krok-naprzod-brak-terenu`).
- Marsz: adapter `ProdSiegeWalk` (`WalkWorld` K1b): cel na bieżącej zajętości, `passable_free` = `!occByKey.has &&
  isFinite(_moveCostForUnit)`, `do_move` = bramka `_siegeApproachRestricted` + `move_step_core` (efekty T4c, facing,
  `Move`). Czas: `MOVE_STEP_MS` na krok + `STEP_GAP_MS` na `_schedule`; `t0` k-tego kroku = `k·(240+70)`.
- Cele atakującego przy murze liczone w ciele tym samym kodem co obrońcy (T1): `_rangedTargetInRange` /
  `_targetInRange` z `_meleeBlockedByWall` (maszyna czyta je w U7.1 — cios/strzał albo trzymanie korony; przed T2a
  atakujący brał `ProdUnit::melee_target` z adaptera).
- Nowe pola `ProdBody` (wartości inicjalne pinu): `siege_gate_col/row = -1`, `siege_wall_tiles_init = 0`,
  `tower_at_wall_rows = {}`, `siege_machine_range: [Vec<Option<f64>>; 2]` (pin `_siegeMachineRange(ru)` jest per
  jednostka, `ActivateScene::siege_machine_range` jest jedną wartością sceny; `None` = wartość sceny, zachowanie sprzed
  T2a).
- `prod_tag`: usunięte `wieza-wejscie`, `piechota-do-wiezy`, `taran-wieza`, `marsz` (zostaje `atak-muru`).

### 2.3 `engine/src/domain/siege_tactics_actions.rs` (tylko wariant + błąd)

`BattleAction::ClimbWall { unit, from, to }` i `ActionError::ClimbWallWithoutDto(UnitRef)`; `actions_to_dto` zwraca ten
błąd (DTO i konsument = I5b #370).

### 2.4 Nowe testy

`engine/tests/p6_k5loop_siege_atk_a.rs`, generator `engine/tests/p6_k5loop_siege_atk_a_gen.mjs`, wektory
`engine/tests/p6_k5loop_siege_atk_a_vectors/{vectors.json (1240), vectors_nan.json (460)}`.

Nie ruszane: `renderer/`, `view-model/`, `bridge.rs`, `battle_setup*.rs`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`,
`siege_tactics_tower.rs`, `siege_tactics_walk.rs`, `siege_tactics_activate.rs`.

## 3. Zmiany istniejących asercji (D-INT-2/D-INT-5)

### 3.1 `engine/tests/p4_1i3_actions.rs`

1. **Wyczerpujący `match` na `BattleAction` (`enc`)**: dodane ramię `ClimbWall` (mechaniczne, jak `Move`/`Shot`/`Leave`
   w r2–r4). Stara wartość: brak ramienia (błąd kompilacji po dodaniu wariantu). Nowa: kodowanie `climbWall …`. Dane
   testu go nie zawierają (puste `tower_at_wall_rows`). Asercji nie usunięto ani nie poluzowano.
2. **`zgodnosc_akcji_strzalu_wiezy_z_pinem` — okno akcji wieży**: przed T2a atakujący przy murze dostawał tag
   `oblezenie` PRZED maszyną (brak `_updateFacing`). Po T2a jego aktywacja w pętli wykonuje `_updateFacing` (pin `:6123`,
   wspólne dla obu stron) i emituje `Facing`. Generator pinu (`p4_1i3_actions_gen.mjs`, `runTower`, ok. `:875-889`) NIE
   aktywuje jednostek w oknie wieży (woła wyłącznie `_fireOneTower`), więc taki zwrot nie należy do okna (analogicznie
   do istniejącego wykluczenia `synthetic_def` z T1). Stara wartość: okno bez filtra atakującego → błąd „trafienie w 336
   poza klatką lądowania 396” (zwrot aktywacji atk w środku lotu pocisku). Nowa: pominięty `Facing` atakującego, KTÓRY
   NIE jest pierwszym `Facing` tej jednostki po jej `Rout` — zwrot z `_startRout` (`:9818`) celu trafionego przez wieżę
   zostaje w oknie i jest porównywany z pinem jak dotąd. Wektory (`vectors.json`) bez zmian.

### 3.2 Bez zmian (sprawdzone, przechodzą)

`p6_k5doc_t8.rs::cialo_przy_murze_zostaje_tagiem_oblezenie`, `p6_k5loop_siege_def.rs::atakujacy_przy_murze_zostaje_tagiem_oblezenie`,
`p6_siege_tactics_loop_body.rs` (`[(atk0, "oblezenie")]`) — scenariusze bez wież/machin trafiają w gałęzie spoza T2a,
więc nadal dokładnie jeden tag `oblezenie` (teraz po maszynie, nie przed). `p6_k5loop_outcome_pin`,
`p6_siege_tactics_loop_body_pin`, `p6_k5loop_close_r4`, `bridge_contract`: bez zmian. Wektory r1–r4 nietknięte.

## 4. Generator (orakul = wykonanie tekstu pinu)

`p6_k5loop_siege_atk_a_gen.mjs`: wycinki pinu (`_activateUnit`, `_advanceToward`, `_siegeShooterThreats`,
`_threatSlack`, `_siegeApproachRestricted`, `_siegeMoveRefused`, `_bfsFirstStep`, `_siegeWalkTo`, `_siegeRamTowerStep`,
`_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, `_doMove`, `_updateFacing`, `_nearestEnemy`, `_enemiesOf`,
`_targetInRange`, `_meleeBlockedByWall`, `_rangedTargetInRange`, `_moveCostForUnit`, `_passableForUnit`, `_checkRout`,
`_advanceCoord`, `_getEffectiveDoctrine`, `_isUnitDoctrineAuto`, `_ensureGroupMeta`, stałe, `facing*`/`relativeHit`,
`cavalryTerrainMultiplier`, `meleeBlockedByWall`, `attackerWallEntryIsBreach`) + strażnik końców metod i SHA-256
(`c3ec2390…87325`); ziarno 7207, deterministyczny. Atrapy-znaczniki dla gałęzi spoza T2a (doktryna, cios, strzelec, jazda,
falanga, krok, odwrót, `_attackGate`, `_attackWallTile`); `_effectiveMetaForUnit` = `{doctrine: _getEffectiveDoctrine}`
(jedyne pole czytane przez `_activateUnit`, `:6096`; scenariusze bez grup). Teren: mur w `wallCol` (przechodni tylko
w otwartej bramie), kafle specjalne (nieprzechodnie, koszt 2/3/0.5/120, bród, NaN).

Porównanie (test Rust) na każdym wektorze: ślad maszyny, czas aktywacji, kroki `Move` (pole, `t0`, łańcuch `from`),
zmiany `facing` z chwilą, `ClimbWall`, `Log` i ich kolejność, stan końcowy (pole, `moveLeft` bitowo, `facing`,
`onWallWalkway`, morale), `towerAtWallRows`, `wallEverBreached`, `occByKey`, tag. Brak rzutów (`NoRolls` panikuje).

NaN (osobny plik): `moveLeft = NaN` (220 wektorów, 90 z marszem ≥ 2 kroków — marsz kończy się u celu, nie z braku
ruchu) i koszt terenu NaN na polu sąsiednim (12 kroków `_advanceToward` na pole NaN: `=== Infinity` go nie odrzuca,
`moveLeft` staje się NaN). Strażnik czasu 90 s (`guarded`) na obu testach zgodności.

Pokrycie (liczniki = gałąź, którą wykonał pin; nazwy liczą to, co mówią), `vectors.json`: `inf-walk` 208, `climb` 104,
`ramtower-walk` 228, `ramtower-walk-idle` 44, `tower-atwall` 33, `ramtower-toward-step` 53, `ramtower-toward-idle` 49,
`cata-toward-step` 87, `cata-toward-idle` 35, `tag-attackGate` 11, `tag-attackWallTile` 38, `tag-doctrine` 175,
`tag-attack` 45, `tag-advanceStep` 54, `tag-cavalryAction` 32, `tag-rangedAction` 24, `tag-phalanxAction` 9, `hold` 11;
wyłom z wpisem dziennika 92, okrążenie (cios morale bez routu) 109, zmiana `facing` 809, kroki przez bród 9, marsz ≥ 2
kroków 216.

Gałąź `_siegeInfantryToTowerStep` „przy wieży czeka” (`:8097`) jest w AUTO NIEOSIĄGALNA: warunki celu (`:8093-8096`)
implikują `canClimb` i wolną koronę tego samego wiersza (`:8060-8066`), a `_trySiegeTowerClimb` jest wołane wcześniej
(`:6179`). Generator ma scenariusze startujące na polu celu — wszystkie kończą się wejściem na mur (pokrycie `climb`).
Bramka odmowy `_siegeMoveRefused` w marszach T2a jest strukturalnie nieosiągalna (machiny: `isSiegeUnit` `:7953`;
piechota pod wieżę: `towerAtWallRows.size > 0` `:7959`); kod zostawia jawny tag `oblezenie-odmowa-ruchu` zamiast zgadywać
zagrożenia.

## 5. Kryteria końca

- Atakujący przy `siege_wall_col >= 0`: brak tagów `wieza-wejscie`, `piechota-do-wiezy`, `taran-wieza`, `marsz`
  (usunięte z `prod_tag`; test `brak_tagow_t2a_dla_atakujacego` na 1700 wektorach: z terenem jedyne tagi to
  `oblezenie`/`atak-muru`/`atak-bramy`). Bez terenu: jawne `*-brak-terenu` (test `bez_terenu_jawne_tagi_ruchu`).
- Wektory pinu z generatora wykonującego tekst pinu (SHA, deterministyczne): wejście na wieżę, piechota do wieży,
  taran/wieża (kroki), marsz `_siegeWalkTo` i `_advanceToward` — §4.
- NaN/Inf: `moveLeft` NaN, koszt NaN, strażnik 90 s.
- Mutanty: 22, wszystkie zabite (§7).

## 6. Bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` w scratchpadzie `siegeatka/target`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_a` | 6 passed |
| `cargo test --test p6_k5loop_siege_def --test p6_siege_tactics_loop_body --test p6_siege_tactics_loop_body_pin --test p6_k5loop_outcome_pin --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions --test bridge_contract` | 10 + 8 + 2 + 8 + 7 + 6 + 9 + 9 passed |
| `cargo test --lib siege_tactics_atk` | 2 passed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, log `siegeatka/full.log`) | `EXIT 0`; 537 binarek `test result: ok`, 0 `FAILED`; razem 4043 passed, 0 failed, 1 ignored (istniejący `p6_order_lane.rs:1530` `e2e::dump_tick1_econ_for_web_generator`, nie z tego tematu) |

## 7. Mutanty (`siegeatka/mutants.py`, każdy: podmiana → `cargo test --test p6_k5loop_siege_atk_a` → przywrócenie)

Wszystkie 22 zabite, żaden nie uznany za równoważny. Kolumna = testy, które padły (nazwy z `cargo test`).
Skrypt `mutants.py` (scratchpad tematu, nie w repo) przywraca plik po każdym mutancie; źródła po przebiegu porównane
`diff` z kopią sprzed przebiegu (identyczne).

| Mutant | Wynik |
|---|---|
| M01 wspinaczka: konny moze wejsc na mur | ZABITY (zgodnosc_z_pinem_atakujacy_przy_murze) |
| M02 wspinaczka: korona bez kafla muru | ZABITY (bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M03 wspinaczka: wallBase przesuniety | ZABITY (wejscie_na_mur_bez_dto_jawny_blad; wylom_przez_wieze_raz; bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M04 piechota: strzelec bez amunicji wylaczony | ZABITY (bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M05 cel piechoty: kolumna wallBase-1 | ZABITY (bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M06 taran: przy bramie <= 1 -> < 1 | ZABITY (bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M07 taran: BFS bez prefRow | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M08 wieza: q >= wallBase -> q > wallBase | ZABITY (bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_atakujacy_przy_murze; zgodnosc_z_pinem_nan) |
| M09 cel wiezy: bez warunku !towerAtWallRows.has(r) | ZABITY (zgodnosc_z_pinem_atakujacy_przy_murze) |
| M10 arrive marszu: >= -> > | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M11 _advanceToward: d < best -> d <= best | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M12 _advanceToward: koszt NaN odrzucony (isFinite zamiast === Infinity) | ZABITY (zgodnosc_z_pinem_nan) |
| M13 _advanceToward: kolejnosc kierunkow N/S | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M14 wylom: log takze przy wallEverBreached | ZABITY (wylom_przez_wieze_raz; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M15 wspinaczka: moveLeft bez zmiany | ZABITY (zgodnosc_z_pinem_atakujacy_przy_murze; zgodnosc_z_pinem_nan) |
| M16 czas marszu bez STEP_GAP | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M17 t0 kroku bez STEP_GAP | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M18 doktryna atakujacego przy murze bez tagu | ZABITY (brak_tagow_t2a_dla_atakujacego; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M19 cele atakujacego przy murze z wejscia adaptera | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M20 _siegeMachineRange sceny zamiast jednostki | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M21 piechota: brak wejscia przy zajetej koronie (crownFree bez occ) | ZABITY (bez_terenu_jawne_tagi_ruchu; zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |
| M22 _advanceToward: preludium moveLeft <= 0 pominiete | ZABITY (zgodnosc_z_pinem_nan; zgodnosc_z_pinem_atakujacy_przy_murze) |

## 8. Długi (dla orkiestratora)

- **T2b**: `_attackGate` (tag `atak-bramy`), `_attackWallTile` (tag `atak-muru`), `_breachWallTile`/`_breachGate`,
  `MORALE_*`, odwrót z muru, `destroy_tower_at_row` przy wyłomie, czyszczenie `towerAtWallRows` (`:10523`), akcje
  `Boulder`/`WallDamage`/`Ram`/`GateDamage`/`WallBreach`/`GateBreach`/`TowerDestroyed`; aktualizacja
  `ActivateScene::wall_tile_hp`/`gate_open` w trakcie bitwy (dziś stałe wejście sceny).
- **T2b/T4**: tag `oblezenie` dla pozostałych gałęzi atakującego przy murze (krok doktryny, cios, strzelec, jazda,
  falanga, `_advanceStep`, `_fallBackStep`) — wymaga bramki `_siegeMoveRefused` z `_siegeShooterThreats` w
  `move_step_core` (dziś `refused = false`) i reguł muru w ciosie atakującego.
- **T2/T7 (#369)**: synchronizacja `ProdBody::wall_ever_breached` z `SiegeEnv::wall_ever_breached` — wejście na mur od
  wieży ustawia teraz flagę w ciele (`:8071-8074`), ale `SiegeEnv` (sufit tur bez wyłomu, koniec bitwy) jej nie widzi.
  Podobnie `ProdBody::tower_at_wall_rows` (stan ciała) vs przyszły stan sterownika.
- **T6 (adapter)**: `siege_gate_col/row`, `siege_wall_tiles_init`, `siege_machine_range` per jednostka (`_attackRangeFor`
  + `civAttackRangeMultiplier`, `:7525-7534`), klasy `is_siege_tower`/`is_ram` z `normName`, teren `MoveTerrain` sceny.
- **I5b (#370)**: DTO `ClimbWall` (`from`, `to`, model na wysokości korony `walkY = 2.5`, `:8077`) + konsument
  (`climb_onto_wall_walkway`), dziś `ActionError::ClimbWallWithoutDto`.
- **Tryb ręczny** (`_performSiegeManualOrder` `:18440`, `:18458` woła te same funkcje): K5EXEC #268.
- Kosmetyka: duplikacja predykatów celu K3 (`siege_tactics_tower.rs`, harness) i produkcyjnych (`siege_tactics_atk.rs`)
  — oba porównane z pinem; scalenie poza allowlistą (K3).

## 9. Commit i sprzątanie

- Kod: `197d98d42` na `rust-port-wip/siege-atk-a-q1-op-r1` (rodzic = baza `48832747b`), 9 plików,
  `git diff 48832747b --stat`: 2555 wstawień, 23 usunięcia (z tego ok. 7,6 MB wektorów JSON).
- Raport: commit-dziecko `197d98d42` (ten plik).
- Bez push/deploy/integracji (zakaz). `CARGO_TARGET_DIR` (`siegeatka/target`) usunięty po bramkach.
- Generator: `node rust-port/engine/tests/p6_k5loop_siege_atk_a_gen.mjs` odtwarza oba pliki wektorów bajt w bajt
  (ziarno 7207, strażnik SHA `c3ec2390…87325`).
