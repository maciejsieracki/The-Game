# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — raport Operatora, runda 2 (DODATEK r2)

STATUS: PASS-WITH-NOTES (runda niepełna wg D-K5C-r2-1: pozycje (1) C-FLANK i (2) kawaleria oraz akcja `Move` ZROBIONE; pozycja (3) strzelec `RangedAction` + `FallBackStep` NIE zrobiona w tej rundzie, lista z liniami pinu niżej)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: każde `ActivateEvent` spoza listy wykonane wg pinu albo jawnie udowodnione jako nieosiągalne; r2: C-FLANK (T4d), `_cavalryAction`, strzelec + odwrót, akcja `Move` dla I5.
BAZA r2: `0941c8225b984b9b46aca3a71691b52338c01130` (= `origin/rust-port/parity-v2`, zawiera r1 FC `fc5027e53`). Gałąź robocza: `rust-port-wip/k5loop-close-r2`.

## ZMIANY/COMMIT

SHA commitu: patrz sekcja „COMMIT” na końcu (kod, wektory i raport w jednym commicie nad `0941c8225`).

Pliki (allowlista dispatchu + rozszerzenie D-K5C-r2-2):
- `rust-port/engine/src/domain/siege_tactics_loop.rs` — kod (C-FLANK, kawaleria, emisja `Move`, nowe pola).
- `rust-port/engine/src/domain/siege_tactics_actions.rs` — WYŁĄCZNIE dodany wariant `BattleAction::Move { unit, from, to, arrive_at }` i `ActionError::MoveWithoutDto(UnitRef)` + jedno ramię w `actions_to_dto` (D-K5C-r2-2; istniejące warianty bez zmiany semantyki).
- `rust-port/engine/tests/p4_1i3_actions.rs` — MECHANICZNA zmiana wymuszona nowym wariantem: ramię `BattleAction::Move` w wyczerpującym `match` funkcji `enc()` (scenariusze tego testu nie ruszają jednostek, ramię nie występuje w danych). Jedyne miejsce poza allowlistą `p6_k5loop_close*`, które dopisanie wariantu wymusiło (grep `BattleAction::` w `rust-port/**`: poza nim tylko `siege_tactics_actions.rs`, `siege_tactics_loop.rs`, testy `p6_k5loop_close*`; renderer konsumuje `BattleActionKindDto`, nie `BattleAction`).
- `rust-port/engine/tests/p6_k5loop_close.rs` — test r1: 94 scenariusze `flank`, w których r1 oczekiwało tagu `krok-naprzod-flanka`, są teraz pomijane w porównaniu r1 (liczone do pokrycia) i porównywane z PEŁNYM tekstem pinu w teście r2 (rodzina `flank-r1`, te same wejścia). Plik `vectors.json` r1 BAJT W BAJT bez zmian (600 wektorów).
- `rust-port/engine/tests/p6_k5loop_close_r2.rs` — nowy test (5 testów).
- `rust-port/engine/tests/p6_k5loop_close_r2_gen.mjs` — nowy generator (wykonuje tekst pinu; strażnik SHA-256 wycinków `c5a5bc11…3619`).
- `rust-port/engine/tests/p6_k5loop_close_vectors/vectors_r2.json` — 760 wektorów.
- ten raport.

Nie ruszano: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, `siege_tactics_cavalry.rs` i inne klocki T4/T6 (D-K5C-3: tylko wołane), istniejące wektory `p6_siege_tactics_loop*` (bez zmian, zielone).

### Co zmieniono w `siege_tactics_loop.rs`
1. **C-FLANK (`_advanceStep` `:8204-8235`), tag `krok-naprzod-flanka` ZDJĘTY.** Każde wejście `_advanceStep` (także z `_schedule`) po preludium `moveLeft <= 0` (`NaN` przechodzi jak w JS) dla `attackDirection` `'bok'`/`'tyl'` wykonuje `ProdBody::flank_decide`: cel `_pickTargetByPriority ?? _nearestEnemy` (`pick_target_by_priority` z K5DOC-T2 + pierwszy ściśle najbliższy), „już w pozycji” (`_canStrikeTargetFrom` dd=1 i `relativeHit` == `desired`) = `done()`, krok `_firstStepTowardDirectedAttack` (`first_step_toward_directed_attack` z T6), brak celu/kroku = marsz czołowy (`:8231-8233`, istniejący T4b). Ruch przez `move_step_core` (T4c + `_updateFacing` + `Move`), callback = `advance_after_move` (ten sam kod pinu `:8222-8229` i `:8275-8283`, bez `lastAutoMoveFrom`). Brak `MoveTerrain` przy BFS = jawny tag `krok-naprzod-brak-terenu`.
2. **`_cavalryAction` (`:6372-6412`), tag `kawaleria` ZDJĘTY.** `ProdBody::cavalry_action`: (1) `cav_adjacent_non_spear` -> cios; (2) `cavalry_target`, brak = `done()`; C-FLANK `cav_directed_maneuver_step` z pętlą callbacku (`:6436-6443`, cel `_cavalryTarget ?? tgt`); `cav_maneuver_step` z pętlą (`:6492-6499`); (3) wymuszony cios w pierwszego sąsiada `_enemiesOf`; (4) `best_charge_step` przy `moveLeft > 0`. Funkcje T6 wołane bez zmian; `cavalry_action_decide` (emulacja `moveLeft -= 1`) NIE jest używane — każdy krok to prawdziwy `_doMove` (`move_step_core`: koszt z mnożnikiem jazdy, bród `/ BROD_RUCH_MULT`, `_updateFacing`, `Move`). Rekursja kawalerii nie ma `_schedule` (kroki co `MOVE_STEP_MS`, bez `STEP_GAP_MS`) — jak w pinie. Helpery T6 biorą `moves_left: i64` tylko do testu `<= 0`; ciało podaje `1`/`0` z `ru.moveLeft` (f64), żeby nie obciąć `0.5`. Cios jazdy idzie wspólną ścieżką ciosu (`Facing` + `Melee` w `start`, `strike` w `complete`); szablon ciosu = wejście adaptera (`ProdUnit::melee_target`/`blow`), inny wybór celu niż szablon = istniejący tag `cios-bez-szablonu`.
   - **Brak `MoveTerrain` = jawny tag `kawaleria-brak-terenu` dla CAŁEJ gałęzi** (także bez ciosu w sąsiada). Uzasadnienie: decyzja jazdy jest ruchowa (D1 K5DOC-T4e-0), a wektory `p6_siege_tactics_loop_body_pin` (bez terenu) mają w generatorze stub `_cavalryAction` = brak akcji; zachowują się bajt w bajt. Produkcyjny adapter (#113) MUSI podać teren.
3. **Akcja `Move` (D-K5C-r2-2).** `move_step_core` emituje `BattleAction::Move { unit, from, to, arrive_at = t0 + MOVE_STEP_MS }` po `Facing` (kolejność wywołań sceny `:8704`/`:8746`), tylko poza planowaniem AUTO-batch (`autobatch.is_none()`, `:8694-8713` bez animacji). Dotyczy też ruchu r1 (`_advanceStep` czołowy) i publicznego `move_step`. `actions_to_dto` dla `Move` zwraca `Err(ActionError::MoveWithoutDto(unit))` — `BattleActionKindDto` (view-model) nie ma wariantu ruchu; jawny błąd zamiast cichego pominięcia, I5 doda wariant DTO 1:1.
4. **Nowe pola (D-K5C-4)** w `ProdBody` (nie w `ProdUnit`: literał `ProdUnit` w testach spoza allowlisty):
   - `ranged_base: [Vec<bool>; 2]` — `ru.rangedBase` dla `_unitBattleClass` (`:17486-17489`); domyślnie `activate.can_shoot` (pin `canShoot = rangedBase && ammoLeft > 0`, `:1457-1459`, więc `can_shoot ⇒ rangedBase`).
   - `target_priorities: TargetPriorities` — `this._targetPriorities` (`:2328-2332`), domyślnie `DEFAULT_TARGET_PRIORITIES`. `useUnitPriorities`/`useGroupPriorities` (pola UI gracza) w ciele = `false`/brak (nie ma ich w `GroupMeta` silnika).
   - `anti_cav_spear` czytane z istniejącego `ProdDoctrineState::anti_cav_spear` (T0).
   - Testy: każdy wektor ustawia `ranged_base`, `anti_cav_spear`, `hp`, klasy wrogów.
5. `move_step_core`: zmienna `planning` (bez zmiany semantyki ruchu).

## Tabela wariantów `ActivateEvent` (stan PO r2)

| wariant | trafia do `skipped`/tag? | linia pinu | klocek Rust | stan |
|---|---|---|---|---|
| `Done`, `ApplyTerrainRange`, `UpdateMoraleBar`, `StartRout`, `UpdateFacing`, `TowerClimb`/`InfantryToTower`/`RamTowerStep` (bez muru), `Attack` (melee) | nie | jak w r1 | jak w r1 | OK (bez zmian) |
| `AdvanceStep` front | nie | 6298 → 8236-8285 | T4a/T4b/T4c | r1 + teraz emisja `Move` |
| `AdvanceStep` C-FLANK `bok`/`tyl` | ~~tag `krok-naprzod-flanka`~~ → **wykonywane (r2)** | 8204-8235 | T2 `pick_target_by_priority`, T6 `first_step_toward_directed_attack` | **ZROBIONE**: `flank-r1` 120 + `flank-full` 220 wektorów |
| `CavalryAction` | ~~TAK → `kawaleria`~~ → **wykonywane (r2)**; bez terenu tag `kawaleria-brak-terenu` | 6284 → 6372-6412, 6426-6501, 17736-17775 | T6 helpery + `move_step_core` | **ZROBIONE**: `cavalry` 320 + `cavalry-spear` 40 + `cavalry-adj` 60 |
| `RangedAction` | nie: strażnik `strzelec` (`can_shoot`) | 6241 → 6656 | T5a `siege_tactics_kite`, T5b `siege_tactics_ranged_forward` | **NIEZROBIONE (r3)** |
| `FallBackStep` | nie: strażnik `strzelec` (`primary_ranged`) | 6250-6273 → 7228 | T7b `siege_tactics_fallback` | **NIEZROBIONE (r3)** |
| `PhalanxAction` | TAK → `falanga` | 6290 → 6546-6578 (+6588-6636) | T7a | r3 (zgodnie z D-K5C-r2-1) |
| `Flee` (wejście routed / po okrążeniu) | TAK → `ucieczka-routed` | 6055 / 6118-6120 → 9845 | brak portu `_fleeStep` | r3 (zgodnie z D-K5C-r2-1) |
| `DoctrineStep`, mur (`AttackWallTile`/`AdvanceToward`), tryb ręczny | strażniki `doktryna`/`oblezenie`/`tryb-reczny` | 6099-6103, 6201-6216, 6067 | poza tematem | #264, oblężenie, K5EXEC |

### Gałęzie NIEZROBIONE w r2 (runda 3 tego ID)
1. Strzelec: `RangedAction` `battleScene.ts:6241` → `_rangedAction` `:6656` (T5a kite `:6656-6740`, T5b `_rangedForwardStep`, `_rangedTargetInRange` `:7041-7053`, `_doRangedAttack` + RNG trafienia) RAZEM z `FallBackStep` `:6250-6273` → `_fallBackStep` `:7228` (T7b) i zdjęciem strażnika `strzelec` (stan `dryCol`/`heldAfterFallback` jest w `ActivateUnit`). Powód odłożenia: zakres r2 wyczerpany przez (1)+(2)+`Move` z pełnymi wektorami i 12 mutantami; strzał wymaga jeszcze szablonu strzału (`FullBlowInput` ranged) i pocisku (`RANGED_FLY_MS`) w ciele — osobna partia.
2. `PhalanxAction` `:6546-6578` (+ `_phalanxStep` `:6588-6636`) — tag `falanga`.
3. `Flee` `_fleeStep` `:9845` (nowy port) — tag `ucieczka-routed`.
4. D-K5C-r2-3 `attackDirection` dla `_targetInRange` (`:8402`): NIE był potrzebny do (1) (cel C-FLANK liczy `_pickTargetByPriority`, nie `_targetInRange`); `_targetInRange` z preferencją łuku nadal jest wejściem adaptera (`melee_target`) — NIE_ZMIERZONO dla #113.

## WEKTORY

Generator `node rust-port/engine/tests/p6_k5loop_close_r2_gen.mjs` (ziarno 5209) wykonuje TEKST pinu `07d2fbd72` (transpilacja TS, bez wstawek w logice): wycinki r1 + `FORD_AI_AVOID_PENALTY` (998), `_targetPriorities` (2328-2332), `_cavPriority` (6313), `_cavalryTarget` (6326), `_cavAdjacentNonSpear` (6351), `_cavalryAction` (6372-6412), `_cavDirectedManeuverStep` (6426), `_cavManeuverStep` (6457), `_canStrikeTargetFrom` (8487), `_firstStepTowardDirectedAttack` (8509), `_unitBattleClass` (17486), `_prefsForUnit` (17496), `_priorityScore` (17512), `_pickTargetByPriority` (17523), `_bestChargeStepKey` (17736); `combat.ts`: `normTerrain` (620), `findTerrainEntry` (706), `cavalryTerrainMultiplier` (756) na danych `gra/data/terrain-combat.json` (Las ×2, Góry `Infinity`). Strażnik: nagłówki linii, końce metod (`_cavalryAction` = 6412), SHA-256 wycinków `c5a5bc11db1471b17b61da5ce6a73951e34ee8790711386a179ea97bf1153619` (twardo w generatorze i w teście).
Stuby jak w r1 poza portowanymi; `_doAttack` = zapis celu i `done()` (sam cios pokrywają `p6_siege_tactics_loop_body_pin`/`p6_k5loop_outcome_pin`); okrążenie (`_updateMoraleBar`) poza zakresem — scenariusz je wywołujący jest odrzucany po komunikacie stuba (nie liczony).

| rodzina | liczba | co pokrywa |
|---|---|---|
| `flank-r1` | 120 | te same wejścia co rodzina `flank` r1 (94 wchodziło w blok, 26 preludium); teraz pełny pin, `unported` puste; 90 z ruchem |
| `flank-full` | 220 | piechota `bok`/`tyl`, wrogowie z klasami (jazda/strzelec/włócznik), priorytety `_pickTargetByPriority`, BFS manewru, fallback czołowy |
| `cavalry` | 320 | jazda `front`/`bok`/`tyl`, teren walki z mnożnikiem jazdy, bród; 25 ciosów, 279 z ruchem, 198 wielokrokowych, 137 C-FLANK z ruchem, 16 bez akcji, 55 z kosztem kroku > 1 |
| `cavalry-spear` | 40 | jedyny sąsiad = włócznik, brak kroku manewru (`moveLeft` 0 albo pozostałe pola Góry) → wymuszony cios (`:6397-6401`) |
| `cavalry-adj` | 60 | dwóch sąsiadów nie-włóczników różnych klas/HP/facing → wybór `_cavAdjacentNonSpear` |

Razem 760 (pierwsze 660 niezależne od rodzin celowanych, sprawdzone porównaniem przed/po dopisaniu). Porównanie na każdym wektorze: ślad aktywacji, czas, pozycja, `moveLeft` bitowo, `facing`, każda zmiana facing z czasem, każdy krok jako `Move` (pole startu/celu, `t0`, `arrive_at`), cel ciosu (`Melee`), `occByKey`, `lastAutoMoveFrom`, `unported` PUSTE, zero rzutów (`SequenceRolls::new(vec![])` panikuje przy rzucie).

**Asercja końcowa dispatchu**: `unported` puste dla wszystkich scenariuszy wektorów r2, w tym 94 scenariuszy r1, które wcześniej miały `krok-naprzod-flanka`.

## TESTY

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `tgt_k5c_r2` (usunięty po bramkach). Dysk przed pełną bramką: 13 GB wolne.

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close` | 0 | 5 passed |
| `cargo test --test p6_k5loop_close_r2` | 0 | 5 passed |
| `cargo test --test 'p6_siege*'` | 0 | 40 binarek, 222 passed, 0 failed |
| konsumenci ciała: `p6_siege*`, `p6_k5loop*`, `p6_k5doc*`, `p4_1i3_actions`, `p4_1i2*`, `p6_tower_target_wiring`, `p6_wieze*` | 0 | 64 binarki, 434 passed, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | **529 binarek, 3958 passed, 0 failed, 1 ignored** (istniejący `#[ignore]` sprzed tematu) |

Generator: EXIT 0, `vectors.json` r1 niezmieniony (`git diff` pusty).

### Mutacje (skrypt w scratchpadzie: podmiana w `siege_tactics_loop.rs`, `cargo test --test p6_k5loop_close_r2 --test p6_k5loop_close`, przywrócenie + porównanie = RESTORED)
| mutant | wynik |
|---|---|
| M1 C-FLANK piechoty wyłączony | FAIL (zabity) |
| M2 gałąź kawalerii pominięta | FAIL (3 testy) |
| M3 C-FLANK jazdy wyłączony | FAIL |
| M4 manewr jazdy bez pętli callbacku (1 krok) | FAIL |
| M5 C-FLANK jazdy bez pętli (1 krok) | FAIL |
| M6 wymuszony cios we włócznika usunięty | FAIL (po dodaniu rodziny `cavalry-spear`; w losowych rodzinach przeżywał) |
| M7 emisja `Move` wyłączona | FAIL (2 testy) |
| M8 b4 z r1: `_passableForUnit` = samo `passable` (jazda) | FAIL — mutant r1 zabity |
| M9 mnożnik jazdy pominięty w koszcie | FAIL |
| M10 C-FLANK bez testu „już w pozycji” | FAIL (test `flanka_juz_w_pozycji_konczy_bez_akcji`; gałąź nieosiągalna z `_activateUnit` dla piechoty — dowód w teście, więc wektor pinu jej nie ma) |
| M11 cel C-FLANK bez priorytetów (tylko najbliższy) | FAIL |
| M12 wybór sąsiada jazdy bez priorytetu | FAIL (po dodaniu rodziny `cavalry-adj`) |
| (c) kolejność rzutów RNG | N/A: C-FLANK, `_cavalryAction`, `_doMove` w pinie nie losują; test używa pustego `SequenceRolls` (każdy rzut = panika). Rzuty ciosu jazdy = istniejący `strike` (bez zmian, pokryty `body_pin`). Mutacja (c) wraca w r3 ze strzelcem. |

## BLOKADY
- Brak blokad technicznych.
- NIE_ZMIERZONO: (1) czas kroku nominalny 240 ms (+70 ms `_schedule` piechoty), kwantyzacja rAF poza zakresem (D-K5C-r2-4); (2) `Move` bez wariantu DTO — `actions_to_dto` zwraca `MoveWithoutDto` do czasu I5 (#280/#336), więc `SiegeLoop::actions_dto` dla bitwy z ruchem jest błędem aż do I5; (3) `_targetInRange` z `attackDirection` (`:8402`) nadal wejście adaptera (D-K5C-r2-3); (4) `useUnitPriorities`/`useGroupPriorities` (UI gracza) nieobecne w ciele — AUTO ich nie ustawia; (5) cios jazdy wymaga szablonu adaptera na cel wybrany przez T6 (inaczej tag `cios-bez-szablonu`).

## RUNDY
2/5

## NASTĘPNY KROK
Evaluator r2. Runda 3 tego ID: strzelec (`RangedAction` + `FallBackStep`, zdjęcie strażnika `strzelec`), `PhalanxAction`, `_fleeStep`. Po FC PASS całości: K5LOOP-WIRING (#113), potem I5 (wariant DTO `Move`).

## DEPLOY/PUSH
NIE WYKONANO

## COMMIT
SHA podany w wyniku Operatora (commit na `rust-port-wip/k5loop-close-r2`, rodzic `0941c8225`); raport jest w tym samym commicie, więc nie może zawierać własnego SHA.
