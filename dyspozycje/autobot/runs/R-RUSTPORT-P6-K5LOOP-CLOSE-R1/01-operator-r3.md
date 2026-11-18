# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — raport Operatora, runda 3 (DODATEK r3)

STATUS: PASS-WITH-NOTES (runda niepełna wg D-K5C-r3-1: pozycje 1 (strzelec `_rangedAction` + odwrót `_fallBackStep`) i 2 (`_phalanxAction`) ZROBIONE; pozycja 3 (`Flee`/`_fleeStep` `:9845`) NIE zrobiona, przeniesiona na r4 z linią pinu i powodem niżej)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: każde `ActivateEvent` spoza listy wykonane wg pinu albo jawnie oznaczone; r3: strzelec + odwrót, falanga, ucieczka.
BAZA r3: `7bd030ead38946ffcfe8824f3431790137581533` (= `origin/rust-port/parity-v2`, zawiera FC r2). Gałąź robocza: `rust-port-wip/k5loop-close-r3`.

## ZMIANY/COMMIT
Jeden commit nad `7bd030ead` (SHA w wyniku Operatora; raport jest w tym samym commicie, więc nie zawiera własnego SHA).

Pliki:
- `rust-port/engine/src/domain/siege_tactics_loop.rs` — kod (strzelec, odwrót, falanga, nowe pola, akcja `Shot`).
- `rust-port/engine/src/domain/siege_tactics_actions.rs` — WYŁĄCZNIE nowy wariant `BattleAction::Shot { attacker, target, land_at }`, `ActionError::ShotWithoutDto(UnitRef)` i jedno ramię w `actions_to_dto` (jak `Move` w r2; istniejące warianty bez zmian).
- `rust-port/engine/tests/p4_1i3_actions.rs` — MECHANICZNE ramię `match` dla `Shot` w `enc()` (wymuszone wariantem; scenariusze testu nie mają strzelców). Jedyne miejsce poza allowlistą `p6_k5loop_close*` (grep `BattleAction::` w `rust-port/**`).
- nowe: `tests/p6_k5loop_close_r3.rs` (5 testów), `tests/p6_k5loop_close_r3_gen.mjs`, `tests/p6_k5loop_close_vectors/vectors_r3.json` (1040), `vectors_r3_nan.json` (1040).
- ten raport.

Nie ruszano: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, klocki T5a/T5b/T7a/T7b (`siege_tactics_kite.rs`, `_ranged_forward.rs`, `_phalanx.rs`, `_fallback.rs`) i T2 (`ranged_target_in_range`) — tylko wołane (D-K5C-3). Wektory r1 i r2 bajt w bajt (sha256: `vectors.json` 798a2f94…, `vectors_r2.json` 2cf29030…4a5945, `vectors_r2_nan.json` 2f88474f…cf69ec — identyczne z FC r2).

### Co zmieniono w `siege_tactics_loop.rs`
1. **Strażnik `strzelec` zdjęty.** Zamiast `can_shoot || primary_ranged` zostaje wąski tag `strzelec-bez-strzelania` dla `can_shoot && shooting_disabled` (UI `shootingEnabled=false`: pin idzie wtedy ścieżką wręcz z zasięgiem strzału w `_targetInRange`/`_canAttackFrom` `:8373-8377`, `:8436`, czego adaptery `reach = 1` nie niosą) — lista r4.
2. **`_rangedAction` (`:6656-6739`) = `ProdBody::ranged_action`.** KITE (`:6689-6722`: `primaryRanged && rangedKite`, `_nearestEnemyMelee` T5a, `<= MELEE_SAFE_GAP`, `_bestKiteShotStep` T5a, strzał po kroku w `_rangedTargetInRange ?? meleeThreat` w zasięgu, przyparty = strzał z miejsca w `_rangedTargetInRange ?? nearest`); STRZAŁ (`:6727-6731`); MARSZ `_rangedForwardStep` (`:6776-6809`: preludium `moveLeft <= 0` (NaN przechodzi), `_bestForwardStep` T5b, bramka `lineAllowsRangedStep` `:6791-6798` z nowym portem `_rangedFiringStepStaysBehindMelee` `:8175-8189` i istniejącym `_compactAttackAllowsStep`, krok `_doMove`, callback: w zasięgu → `_rangedAction` od nowa w tej samej chwili, `ru.moveLeft > 0` jako dokładna negacja `<= 0 || is_nan` (lekcja r2a) → `STEP_GAP_MS` i kolejny krok). `_rangedTargetInRange` = T2 `ranged_target_in_range`.
3. **Strzał `_doAttack` → `_doRangedAttack` (`:9179-9235`).** W `start`: zwrot strzelca `facingFromTo` (`BattleAction::Facing`, zawsze), `BattleAction::Shot` z `land_at = t + RANGED_FLY_MS`; czas aktywacji `t + 380 + 320` (`RANGED_FLY_MS`, `RANGED_GAP_MS`, nowe stałe). W `complete` (`complete_shot`): `ammoLeft -= 1` tylko dla skończonej (`:9191`), `can_shoot = rangedBase && ammo > 0`, `_singleBlow(…, true)` przez istniejące `strike` (jeden rzut, łuk z facing celu, skutki `_resolveBlowOutcome`, bez `engaged`, bez kontrataku), `Damage` gdy `dmg > 0 && !dead && !fadingOut`; akcje trafienia mają `t0 = hit_at`. Brak szablonu strzału na cel wybrany przez pin = jawny tag `strzal-bez-szablonu`.
4. **U7.6 + `_fallBackStep` (`:6250-6273`, `:7228-7244`).** `ProdOps::advance_coord` (`_advanceCoord` `:6537`) i `nearest_enemy_pos` (`_nearestEnemy`) liczone z pozycji (wcześniej `0`/`None`); `dryCol`/`heldAfterFallback` zapisywane z powrotem do `ProdUnit::activate` (trwają między aktywacjami, D-K5C-4). `ProdBody::fall_back`: pętla `fall_back_step_decide`/`fall_back_after_move` (T7b, bez zmian) + prawdziwy `_doMove`.
5. **`_phalanxAction` (`:6546-6578`) = `ProdBody::phalanx_action`** przez `phalanx_action_decide` (T7a): sąsiad = cios wspólną ścieżką (`melee_target` adaptera), samotna falanga = istniejące `advance_step`, wyprzedzenie linii = `done()`, krok = jeden `_doMove` i koniec (`:6635`, bez `_schedule`).
6. **Gałęzie ruchowe bez `MoveTerrain`** (jak `kawaleria-brak-terenu` r2): tagi `strzelec-brak-terenu`, `odwrot-brak-terenu`, `falanga-brak-terenu`, brak akcji. Dzięki temu `p6_siege_tactics_loop_body_pin` i `p4_1i3_actions` (bez terenu, stub `_phalanxAction` = brak akcji) zachowują się bajt w bajt.
7. **Nowe pola (D-K5C-4)** w `ProdBody` (nie w `ProdUnit`, literał poza allowlistą): `ammo_left` (domyślnie `Infinity` dla `can_shoot`, inaczej `0`; adapter podaje `ammo0`), `ranged_blows` (szablon strzału per cel, wejście adaptera). `rangedKite` czytane z istniejącego `ProdDoctrineState::ranged_kite`.

## Tabela wariantów `ActivateEvent` (stan PO r3)
| wariant | tag / stan | linia pinu | klocek Rust | stan |
|---|---|---|---|---|
| `Done`, `ApplyTerrainRange`, `UpdateMoraleBar`, `StartRout`, `UpdateFacing`, wieże/taran bez muru, `Attack` | brak | jak r1 | jak r1 | OK |
| `AdvanceStep` (front + C-FLANK) | brak | 8198-8285 | T4a-c, T6 | OK (r1/r2) |
| `CavalryAction` | brak (bez terenu `kawaleria-brak-terenu`) | 6372-6412 | T6 | OK (r2) |
| `RangedAction` | ~~`strzelec`~~ → **wykonywane**; bez terenu `strzelec-brak-terenu`; bez szablonu `strzal-bez-szablonu` | 6241 → 6656-6739, 6776-6809, 9179-9235 | T5a, T5b, T2 | **ZROBIONE r3**: `ranged` 480 + `ranged-nan` 480 |
| `FallBackStep` (+ U7.6 cios/stoi) | ~~`strzelec`~~ → **wykonywane**; bez terenu `odwrot-brak-terenu` | 6250-6273 → 7228-7244 | T7b | **ZROBIONE r3**: `fallback` 260 + `fallback-nan` 260 |
| `PhalanxAction` | ~~`falanga`~~ → **wykonywane**; bez terenu `falanga-brak-terenu` | 6290 → 6546-6578, 6588-6636 | T7a | **ZROBIONE r3**: `phalanx` 300 + `phalanx-nan` 300 |
| strzelec z `shootingEnabled=false` | `strzelec-bez-strzelania` | 6241 (nie wchodzi), 8373-8377 | brak `reach = range` w adapterach | **r4** |
| `Flee` (routed / po okrążeniu) | `ucieczka-routed` | 6055 / 6118-6120 → 9845-9895 | brak portu `_fleeStep` | **r4** |
| `DoctrineStep`, mur, tryb ręczny | `doktryna`/`oblezenie`/`tryb-reczny` | 6099-6103, 6201-6216, 6067 | poza tematem | #264, oblężenie, K5EXEC |

### NIEZROBIONE w r3 (runda 4 tego ID)
1. `Flee` → `_fleeStep` `battleScene.ts:9845-9895`. Powód: wymaga `_removeUnitFromScene` (`:9910`) i `_shakeAlliesOnLoss` (dziś nieportowany, tag `shakeAlliesOnLoss` w ścieżce zabicia), oraz stanu `fleeStuck`; bez portu ripple `unported` nie byłoby puste nawet po porcie samego ruchu. Zakres r3 wyczerpany przez pozycje 1–2 z pełnymi wektorami i 20 mutantami.
2. `strzelec-bez-strzelania` (`shootingEnabled=false` przy `canShoot`): `_targetInRange` / `_canAttackFrom` / `_advanceStep` z zasięgiem strzału (`:8373-8377`, `:8436-8444`); w AUTO ustawiane tylko z UI gracza.

## WEKTORY
Generator `node rust-port/engine/tests/p6_k5loop_close_r3_gen.mjs` (ziarno 5309, < 2 s) wykonuje TEKST pinu `07d2fbd72`: wycinki r2 + `MELEE_SAFE_GAP` (968), `RANGED_FLY_MS`/`RANGED_GAP_MS` (1012-1013), `PHALANX_LEAD_TOLERANCE` (1168), `canShoot` (1457), `_phalanxLineFront` (6519), `_advanceCoord` (6537), `_phalanxAdvanceOf` (6542), `_phalanxAction` (6546), `_phalanxStep` (6588), `_rangedAction` (6656), `_rangedForwardStep` (6776), `_bestForwardStep` (6822), `_bestKiteShotStep` (6959), `_rangedTargetInRange` (7041), `_bestFallBackStep` (7186), `_fallBackStep` (7228), `_rangedFiringStepStaysBehindMelee` (8175), `_nearestEnemyMelee` (8315), `_doAttack` (8787), `_doRangedAttack` (9179). Strażnik: nagłówki, końce metod (`_rangedAction` 6739, `_phalanxAction` 6578, `_fallBackStep` 7244) i SHA-256 wycinków `2bba6a05f81e66287314361878b2fbc510dc598664ef729c2ef71f02e8c2cebd` (generator + test). Atrapy: `_doMeleeAttack` (zapis celu), `_singleBlow` (zapis celu, `ranged`, czasu, łuku z tekstu pinu `relativeHit`, facing strzelca; 0 obrażeń), THREE/pocisk/dźwięk/pasek amunicji bez logiki gry.

| rodzina | liczba | pokrycie (licznik z testu) |
|---|---|---|
| `ranged` | 480 | strzał z miejsca 183, strzał po ruchu (KITE lub marsz) 145, ruch bez strzału 85, ≥2 kroki 104, bez akcji 67 |
| `fallback` | 260 | odwrót z krokiem 150 (≥2 kroki 123), cios sąsiada U7.6 40, stoi (`heldAfterFallback`/brak kroku) 70 |
| `phalanx` | 300 | cios 26, jeden krok `_phalanxStep` 75, samotna → `_advanceStep` 144, stoi 55 |
| `*-nan` (osobny plik) | 1040 | kopie z `moveLeft = NaN`; pin ≤ 1 krok marszu/odwrotu (asercja w generatorze i teście) |

Porównanie na każdym wektorze: ślad aktywacji (bez `Attack`/`Done`), czas, pozycja, `moveLeft` bitowo, `facing`, zmiany facing z czasem, `Move` na każdy krok, cel ciosu (`Melee`), strzał (`Facing` strzelca + `Shot` z `land_at`), rekord trafienia (cel, łuk), `dryCol`, `heldAfterFallback`, amunicja, `occByKey`, liczba rzutów = liczba `_singleBlow` pinu, **`unported` PUSTE** (asercja końcowa dispatchu dla wszystkich 2080 scenariuszy).

## TESTY
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `k5r3/tgt` (usunięty po bramkach). Dysk przed pełną bramką: 11 GB wolne.

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close_r3` | 0 | 5 passed (zgodność 1040, NaN 1040 ze strażnikiem 90 s, tagi bez terenu, `Shot` bez DTO, kolejność rzutów) |
| konsumenci ciała: `p6_siege*`, `p6_k5loop*`, `p6_k5doc*`, `p4_1i*` | 0 | 64 binarki, 446 passed, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | **530 binarek, 3964 passed, 0 failed, 1 ignored** (istniejący `#[ignore]` sprzed tematu; r2: 529/3959) |

### Mutacje (`scratchpad/k5r3/mut.py`: podmiana w `siege_tactics_loop.rs`, `cargo test --test p6_k5loop_close_r3 --test p6_k5loop_close_r2 --test p6_k5loop_close`, przywrócenie, `RESTORED True`)
| mutant | wynik |
|---|---|
| M1 KITE wyłączony | FAIL (zabity) |
| M2 strzał z miejsca wyłączony | FAIL |
| M3 marsz strzelca wyłączony | FAIL |
| M4 brak ponownego `_rangedAction` po wejściu w zasięg | FAIL |
| M5 NaN w marszu strzelca (`|| is_nan` → `|| false`) | FAIL (`nan_move_left_zgodne_z_pinem`) |
| M6 bramka `lineAllowsRangedStep` wyłączona | FAIL |
| M7 gałąź `steady` (`_rangedFiringStepStaysBehindMelee`) wyłączona | FAIL |
| M8 KITE: brak celu-zagrożenia po kroku | PRZEŻYŁ — **równoważny**: `_bestKiteShotStep` (`:6986-6987`, T5a) przyjmuje tylko pole, z którego jakiś wróg jest w `[1..range]`, więc `_rangedTargetInRange` z nowego pola nigdy nie jest `null` (komentarz pinu `:6707` „the chosen tile guarantees something is in range”); gałąź `meleeThreat` (`:6709-6712`) nieosiągalna |
| M9 RNG: dodatkowy rzut przed trafieniem strzału (kolejność/przesunięcie sekwencji) | FAIL (4 testy, w tym `rzuty_strzalow_w_kolejnosci_aktywacji`) |
| M10 odwrót wyłączony | FAIL |
| M11 odwrót bez pętli (1 krok) | FAIL |
| M12 `dryCol` nie zapisywany między aktywacjami | FAIL |
| M13 `_advanceCoord = 0` | FAIL |
| M14 krok falangi wyłączony | FAIL |
| M15 cios falangi wyłączony | FAIL |
| M16 samotna falanga bez `_advanceStep` | FAIL |
| M17 amunicja bez zmniejszenia | FAIL |
| M18 czas strzału bez `RANGED_GAP_MS` | FAIL |
| M19 emisja `Shot` wyłączona | FAIL |
| M20 `_nearestEnemy` dla U7.6 = `None` | FAIL |
RNG w odwrocie i falandze: pin nie losuje (poza ciosem wręcz, istniejące `strike`); test używa rzutów z licznikiem, każdy rzut ponad liczbę `_singleBlow` pinu = panika (FAIL), więc dodatkowy rzut w tych gałęziach jest wykrywany tym samym mechanizmem co M9.

## BLOKADY
- Brak blokad technicznych.
- NIE_ZMIERZONO: (1) czasy nominalne 240/70/380/320 ms (kwantyzacja rAF poza zakresem, D-K5C-r2-4); (2) `Shot` i `Move` bez wariantu DTO — `actions_to_dto` zwraca `ShotWithoutDto`/`MoveWithoutDto` do I5; (3) formuła obrażeń strzału nie jest porównywana w tych wektorach (atrapa `_singleBlow`; formuła pokryta wektorami K5I/`body_pin`), porównywane są cel, chwila, łuk, liczba rzutów; (4) `range` jako `i64` w T2 `Combatant` (zasięgi pinu są całkowite); (5) dla #113: adapter musi podać `MoveTerrain`, `ammo_left` (`ammo0`) i szablony strzału na cele wybierane przez `_rangedAction`.

## RUNDY
3/5

## NASTĘPNY KROK
Evaluator r3. Runda 4 tego ID: `_fleeStep` `:9845` (z `_removeUnitFromScene` i ripple `_shakeAlliesOnLoss`) oraz `strzelec-bez-strzelania`. Po FC PASS całości: K5LOOP-WIRING (#113), potem I5 (DTO `Move`/`Shot`).

## DEPLOY/PUSH
NIE WYKONANO
