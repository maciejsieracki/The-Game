# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — raport Operatora, runda 4 (DODATEK r4)

STATUS: PASS-WITH-NOTES (zakres DODATKU r4 zrobiony w całości: `_fleeStep` z `_removeUnitFromScene` i ripple `_shakeAlliesOnLoss`, tag `strzelec-bez-strzelania` zdjęty, wektory FC-U1 i FC-U2; `unported` PUSTE dla wszystkich wektorów pinu r1+r2+r3+r4. Uwagi: ripple przy ZABICIU (`_resolveBlowOutcome`, poza `_activateUnit`) nadal z tagiem `shakeAlliesOnLoss`, bo zmiana wymaga zmiany asercji w testach spoza allowlisty; FC-U3 przekazane do I5)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: każde `ActivateEvent` wykonane wg pinu albo jawnie oznaczone; `unported` puste dla scenariuszy wektorowych pinu.
BAZA r4: `38f5939e2c74f553c5f1c3928ee7a66cf1f0df5a` (= `origin/rust-port/parity-v2`, zawiera r3 FC `97bc32f36`). Gałąź robocza: `rust-port-wip/k5loop-close-r4`.

## ZMIANY/COMMIT
Kod i testy: commit `aeb9cfcf1c7cfb3e724e20e7bd15b676cc056eed` nad `38f5939e2` (ten raport jest w osobnym, następnym commicie).

Pliki:
- `rust-port/engine/src/domain/siege_tactics_loop.rs` — kod (ucieczka, ripple, strzelec bez strzelania, `reach`).
- `rust-port/engine/src/domain/siege_tactics_actions.rs` — WYŁĄCZNIE dwa nowe warianty `BattleAction::Leave { unit }` (`_removeUnitFromScene` z `_fleeStep`) i `BattleAction::Shaken { unit, fallen, morale }` (ripple), `ActionError::LeaveWithoutDto`/`ShakenWithoutDto` i dwa ramiona `actions_to_dto` (jak `Move`/`Shot`; istniejące warianty bez zmian; DTO dostarcza I5).
- `rust-port/engine/tests/p4_1i3_actions.rs` — MECHANICZNE ramiona `match` dla `Leave`/`Shaken` w `enc()` (+14/−0; scenariusze bez terenu, ramiona nie występują w danych). Jedyne miejsce poza `p6_k5loop_close*` (grep `BattleAction::` w `rust-port/**`).
- nowe: `tests/p6_k5loop_close_r4.rs` (5 testów), `tests/p6_k5loop_close_r4_gen.mjs`, `tests/p6_k5loop_close_vectors/vectors_r4.json` (1180), `vectors_r4_nan.json` (1080).
- ten raport.

Nie ruszano: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, klocki T2/T4/T5/T6/T7 (`siege_tactics_doctrine_target.rs` — tylko wołane `target_in_range`, `_cavalry`, `_advance`, `_fallback`, `_phalanx`, `_kite`, `_ranged_forward`), `siege_tactics_activate.rs` (K5H), testy `p6_siege_tactics_loop*`, `p6_k5loop_outcome_pin.rs`. Wektory r1/r2/r3 bajt w bajt (sha256 prefiksy: `vectors.json` 798a2f94…, `vectors_r2.json` 2cf29030…, `vectors_r2_nan.json` 2f88474f…, `vectors_r3.json` 9cde90b7…, `vectors_r3_nan.json` bdf9e2fd…, `vectors_r3_tie.json` 6bb4fb26… — pliki poza diffem). Commity bez linii `Co-Authored-By` (#289).

### Co zmieniono w `siege_tactics_loop.rs`
1. **`_fleeStep` (`battleScene.ts:9845-9898`) = `ProdBody::flee_run`.** Preludium `finished`/`dead`/`fadingOut`/`removed`/`moveLeft <= 0` (NaN przechodzi); krawędź własna (atak `q <= 0`, obrona `q >= BF_COLS - 1`) = zniknięcie + ripple; pole docelowe `q + dir`, wiersze `r + 0, +1, -1, +2, -2` (plansza `BF_COLS`/`BF_ROWS`, `occByKey`, `_passableForUnit`); brak pola = `fleeStuck += 1`, przy `>= 2` zniknięcie + ripple; inaczej `fleeStuck = 0`, krok przez prawdziwy `_doMove` (`body_step` → koszt, bród, `_updateFacing`, `Move`), callback: zniknięcie na krawędzi, `ru.moveLeft > 0` jako dokładna negacja `<= 0 || is_nan` (lekcja r2) → `STEP_GAP_MS` i kolejny krok. Ucieczka nie losuje.
2. **`_removeUnitFromScene` (`:9910-9925`)** = `remove_unit_from_scene`: idempotentne (`removed`), `removed = dead = true`, `fadingOut = false`, `occByKey.delete` pozycji (bez sprawdzania właściciela, jak w pinie), akcja `Leave`.
3. **`_shakeAlliesOnLoss` (`:9743-9753`)** = `shake_allies_on_loss`: sojusznicy żywi/nieznikający/nieuciekający w promieniu `MORALE_DEATH_RADIUS` od pola poległego tracą `MORALE_ALLY_DEATH_LOSS = 12` (nowa stała, `:1118`), akcja `Shaken` (pasek `:9749`), `_checkRout` (kaskada przez istniejące `start_rout`); na końcu `_checkMeleeScreenLost` gdy poległy nie jest `primaryRanged`.
4. **Dwie drogi wejścia ucieczki.** (a) jednostka już rozbita (`:6055`, przed trybem ręcznym i doktryną): `start` wykonuje `flee_run`; (b) okrążenie w tej aktywacji (`:6105-6118`): zdarzenia K5H `StartRout` + `Flee` — `start` stosuje morale okrążenia, wykonuje pełny `_startRout` (osłona wręcz, boost wrogów, zwolnienie pola, zwrot ku krawędzi) w chwili aktywacji, POTEM `flee_run` (kolejność pinu: `_fleeStep` czyta pola zwolnione przez rout/kaskadę i facing po `_startRout`).
   `start` dostaje `&TurnSeqState`, więc ucieczka działa na kopii stanu; nowe pole `ProdBody::flee_after` trzyma strony po aktywacji, a `complete` tej samej jednostki je przepisuje (`ProdPending::flee`). Bezpieczne, bo gałąź działa tylko bez muru (brak zegarów wież między `start` a `complete`); przy murze jawny tag `ucieczka-oblezenie` (`_doMove` czyta `_siegeMoveRefused`, `:8689`, wejście poza ciałem).
5. **Bez `MoveTerrain` (D1 K5DOC-T4e-0)** tag `ucieczka-routed` jak dotąd (bez ruchu; rout z okrążenia wykonuje wtedy `complete`, jak przed r4). Dzięki temu testy spoza allowlisty (`p6_siege_tactics_loop_body.rs:277`, `p6_k5loop_close.rs:678`, `p4_1i3_actions`, `p6_siege_tactics_loop_body_pin`) są bajt w bajt.
6. **Strzelec z amunicją i `shootingEnabled = false` (tag `strzelec-bez-strzelania` zdjęty).** Pin (`:6241` nie wchodzi) idzie ścieżkami wręcz, ale:
   - `_targetInRange` (`:8373-8410`) liczy zasięg strzału `1 <= dd <= ru.range` z kierunkiem natarcia (`:8402-8407`) i `lowestHp` — ciało liczy cel przez istniejący T2 `target_in_range` (Combatant z `can_shoot`), zamiast wejścia adaptera `melee_target`; dotyczy U7.6, falangi i U7.9;
   - `_doAttack` (`:8787-8797`) przy `canShoot` = `_doRangedAttack`: każdy „cios” takiej jednostki (U7.6 sąsiad w zasięgu, kawaleria, falanga, U7.9) jest STRZAŁEM (`Facing` + `Shot`, trafienie `_singleBlow(…, true)` po `RANGED_FLY_MS`, koniec po `RANGED_GAP_MS`), wspólny helper `begin_shot` (wydzielony z r3, bez zmiany zachowania strzelca);
   - `reach = canShoot ? range : 1` (`ProdBody::reach_of`) w `_canAttackFrom`/`_makeCanAttackFromTest` (`ProdAdvanceWorld::can_attack_from`: `1 <= dd <= reach`), `_canStrikeTargetFrom` C-FLANK „już w pozycji” i w `with_cav_terrain` (BFS T6). Dla jednostek wręcz `reach = 1` daje dokładnie dotychczasowe `dd == 1`.
   - D-K5C-r2-3 / dispatch r4 p.2: `attackDirection` dla `_targetInRange` (`:8402`) był konieczny (pin filtruje cele po łuku) — użyte istniejące pole `ProdBody::attack_direction`.
7. **Nowe pola (D-K5C-4)**: `ProdBody::flee_stuck` (`ru.fleeStuck`, `:2018`, spawn `0`, trwa między aktywacjami), `flee_after` (prywatne). Stała `MORALE_ALLY_DEATH_LOSS`.

## Tabela wariantów `ActivateEvent` (stan PO r4)
| wariant / gałąź | tag / stan | linia pinu | klocek Rust | stan |
|---|---|---|---|---|
| `Done`, `ApplyTerrainRange`, `UpdateMoraleBar`, `StartRout`, `UpdateFacing`, wieże/taran bez muru, `Attack` | brak | jak r1 | jak r1 | OK |
| `AdvanceStep` (front + C-FLANK) | brak | 8198-8285 | T4a-c, T6 | OK (r1/r2; r4: `reach`) |
| `CavalryAction` | brak (bez terenu `kawaleria-brak-terenu`) | 6372-6412 | T6 | OK (r2; r4: `reach`, cios strzelca = strzał) |
| `RangedAction` | brak (bez terenu/szablonu: tagi r3) | 6656-6741 | T5a, T5b, T2 | OK (r3) |
| `FallBackStep` | brak (bez terenu `odwrot-brak-terenu`) | 7228-7244 | T7b | OK (r3) |
| `PhalanxAction` | brak (bez terenu `falanga-brak-terenu`) | 6546-6578 | T7a | OK (r3; r4: cel T2 i strzał) |
| strzelec z `shootingEnabled=false` | ~~`strzelec-bez-strzelania`~~ → **wykonywane** | 6241, 8373-8410, 8436-8444, 8454, 8487-8493, 8787-8797 | T2 `target_in_range`, `reach` | **ZROBIONE r4**: `nobow` 480 + `nobow-nan` 480 |
| `Flee` (rozbita na starcie, `:6055`) | ~~`ucieczka-routed`~~ → **wykonywane**; bez terenu `ucieczka-routed`; mur `ucieczka-oblezenie` | 6055 → 9845-9898, 9910-9925, 9743-9753 | nowy port | **ZROBIONE r4**: `flee` 400 + `flee-nan` 400 |
| `StartRout` + `Flee` (okrążenie, `:6105-6118`) | ~~`ucieczka-routed`~~ → **wykonywane**; bez terenu `ucieczka-routed` | 6116-6117 → 9799-9834, 9845-9898 | `start_rout` + nowy port | **ZROBIONE r4**: `surround` 200 + `surround-nan` 200 |
| `DoctrineStep`, mur, tryb ręczny | `doktryna`/`oblezenie`/`tryb-reczny` | 6099-6103, 6201-6216, 6067 | poza tematem | #264, oblężenie, K5EXEC |

### Pozostałe tagi `unported` (żaden nie występuje w wektorach r1–r4)
- Wejścia adaptera (D1): `*-brak-terenu`, `ucieczka-routed` (bez `MoveTerrain`), `strzal-bez-szablonu`, `cios-bez-szablonu`, `kontratak-bez-szablonu`.
- Poza `_activateUnit` / zakresem tematu: `shakeAlliesOnLoss` przy ZABICIU (`_resolveBlowOutcome` `:9048`; funkcja `shake_allies_on_loss` już istnieje, ale `p6_siege_tactics_loop_body_pin.rs:407/688` i `p6_k5loop_outcome_pin.rs:268` sprawdzają liczbę tych tagów = liczba wywołań pinu — wpięcie wymaga zmiany tych asercji, poza allowlistą; propozycja: osobny mały temat), `wieza-resolveBlowOutcome-efekty`, `dowodca-*`, `kontratak-strzelec`, `ucieczka-oblezenie`, `doktryna`, `oblezenie`, `tryb-reczny`.
- Nieosiągalne z dowodem (r1): `krok-naprzod-atak`.

## WEKTORY
Generator `node rust-port/engine/tests/p6_k5loop_close_r4_gen.mjs` (ziarno 5404, ~3 s) wykonuje TEKST pinu `07d2fbd72`: wycinki r3 + `MORALE_ALLY_DEATH_LOSS` (1118), `MORALE_DEATH_RADIUS` (1129), `MORALE_ENEMY_BREAK_GAIN` (1141), `_gainMorale` (9695), `_boostEnemiesOnBreak` (9707), `_shakeAlliesOnLoss` (9743), `_checkMeleeScreenLost` (9761), `_startRout` (9799), `_fleeStep` (9845), `_removeUnitFromScene` (9910). Strażnik: nagłówki, końce metod (`_fleeStep` 9898, `_removeUnitFromScene` 9925, `_shakeAlliesOnLoss` 9753, `_startRout` 9834 + końce r3) i SHA-256 wycinków `72337be6046fd0541c25dbf2bcd79d10c34e07e6bdf24136c5d6b21d80b92c48` (generator + test). Atrapy jak r3 plus: `_updateMoraleBar` (pasek THREE, zapis wywołań z pętli ripple), `toCombatUnit`/`terrainDefenseMultiplier` w `_checkRout` (mnożnik obrony terenu = wejście adaptera `terrain_defence_mult`), `_sfxRout`, log, `routedUnits`, scena. FC-U2: selekcja scenariuszy porównuje pin z kopią z `Math.max` postępu pasa (`:8187`) — wyłącznie do wyboru; oczekiwanie z tekstu pinu.

| rodzina | liczba | pokrycie (licznik testu) |
|---|---|---|
| `flee` | 400 | zniknięcie z pola 190, ≥1 krok 210, ≥2 kroki 133, zablokowany/bez ruchu 90, ripple 109, kaskada rout 59 |
| `surround` | 200 | rout z okrążenia 200 (asercja), krok ucieczki 193 |
| `nobow` | 480 | strzał 279, ruch bez strzału 103, bez akcji 98 (w tym 70 jazda, 95 falanga, 217 primaryRanged, 236 bok/tył) |
| `ammo2` (FC-U1) | 60 | druga aktywacja bez strzału (U7.6) 60, w tym cios sąsiada 8, odwrót 19; `canShoot = false` po ostatnim pocisku |
| `steady2` (FC-U2) | 40 | ≥2 sojuszników wręcz w najbliższym wierszu; każdy wektor rozróżnia `min`/`max` (krok ≥ 1: 40) |
| `*-nan` (osobny plik) | 1080 | kopie `flee`/`surround`/`nobow` z `moveLeft = NaN`; ucieczka ≤ 1 krok (asercja w generatorze i teście) |

Porównanie na każdym wektorze (`check_activation`): ślad, czas, pozycja, `moveLeft` bitowo, `facing`, zmiany facing z czasem, `Move` na każdy krok, strzał (`Facing` + `Shot` + rekord: cel, łuk; rzut = pudło, żeby stan celu nie zależał od formuły), cios wręcz, `dryCol`/`heldAfterFallback`, amunicja, `fleeStuck`, akcje `Rout`/`Leave`/`Shaken` z czasem i morale bitowo, stan WSZYSTKICH jednostek po aktywacji (morale bitowo, `routed`, `dead`, `removed`, `fadingOut`, `acted`, `facing`, `screenLostApplied`), `occByKey`, liczba rzutów = liczba `_singleBlow` pinu, **`unported` PUSTE** (2260 scenariuszy r4; r1–r3 bez zmian, nadal puste).

## TESTY
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `k5r4/tgt` (usunięty po bramkach). Dysk przed pełną bramką: 12 GB wolne.

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close_r4` | 0 | 5 passed (zgodność 1180, NaN 1080 ze strażnikiem 90 s, tagi bez terenu, tag przy murze, `Leave`/`Shaken` bez DTO) |
| konsumenci ciała: `p6_k5loop*`, `p6_siege*`, `p6_k5doc*`, `p4_1i*` | 0 | 65 binarek, 452 passed, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | **532 binarki, 3993 passed, 0 failed, 1 ignored** (istniejący `#[ignore]` `p6_order_lane dump_tick1` sprzed tematu; r3 FC: 530/3965) |

### Mutacje (`scratchpad/k5r4/mut.py`: podmiana w `siege_tactics_loop.rs`, `cargo test --test p6_k5loop_close_r4 --test p6_k5loop_close_r3 --test p6_k5loop_close_r2 --test p6_k5loop_close`, przywrócenie; `RESTORED True`) — 24/24 ZABITE
| mutant | wynik |
|---|---|
| M1 `flee_run` nic nie robi | ZABITY |
| M2 ucieczka rozbitej (`:6055`) wyłączona | ZABITY |
| M3 ucieczka po okrążeniu wyłączona | ZABITY |
| M4 krawędź na starcie bez zniknięcia | ZABITY |
| M5 zablokowana znika po 3 zamiast 2 | ZABITY |
| M6 `fleeStuck` nie zerowany po kroku | ZABITY |
| M7 kolejność wierszy `-1` przed `+1` | ZABITY |
| M8 NaN w ucieczce (`|| is_nan` → `|| false`) | ZABITY (`nan_move_left_zgodne_z_pinem`) |
| M9 ripple wyłączony | ZABITY |
| M10 promień ripple `>=` | ZABITY |
| M11 ripple bez `_checkRout` | ZABITY |
| M12 ripple bez `_checkMeleeScreenLost` | ZABITY |
| M13 okrążenie: ucieczka przed `_startRout` | ZABITY |
| M14 `complete` nie przepisuje stanu ucieczki | ZABITY |
| M15 RNG: rzut w ucieczce | ZABITY |
| N1 strzelec bez strzelania: cel z adaptera (zasięg 1) | ZABITY |
| N2 strzelec bez strzelania: cios zamiast strzału | ZABITY |
| N3 `_canAttackFrom` `reach = 1` | ZABITY |
| N4 C-FLANK „już w pozycji” `reach = 1` | ZABITY |
| N5 kawaleria `reach = 1` | ZABITY |
| N6 strzał bez `RANGED_GAP_MS` | ZABITY |
| N7 RNG: dodatkowy rzut przed strzałem (kolejność rzutów) | ZABITY |
| F1 (FC-U1) `canShoot` nie przeliczane po strzale | ZABITY (r3: przeżył) |
| F3 (FC-U2) `max` zamiast `min` postępu pasa | ZABITY (r3: przeżył) |

## BLOKADY
- Brak blokad technicznych.
- NIE_ZMIERZONO / dla #113 i I5: (1) czasy nominalne 240/70/380/320 ms (D-K5C-r2-4); (2) `Leave`, `Shaken` (oraz `Move`, `Shot`) bez wariantu DTO — `actions_to_dto` zwraca jawne błędy; (3) FC-U3 (akcja `Damage` strzału, warunek `dmg > 0 && !dead && !fadingOut`) — przekazane do I5 zgodnie z FC r3 (wektory r4 używają pudła, obrażenia strzału pokrywa K5I/`body_pin`); (4) ripple przy zabiciu (`shakeAlliesOnLoss`) — patrz tabela tagów, wymaga zmiany asercji `p6_siege_tactics_loop_body_pin`/`p6_k5loop_outcome_pin` (poza allowlistą), decyzja orkiestratora; (5) dla #113: adapter podaje `MoveTerrain` (inaczej `ucieczka-routed`), `flee_stuck` (stan między turami), szablony `ranged_blows` także dla celów `_targetInRange` strzelca bez strzelania; ucieczka przy murze (`ucieczka-oblezenie`) wymaga wejścia `_siegeMoveRefused`; (6) generator wektorów `ammo2` symuluje `_beginTurn` tylko w zakresie `moveLeft`/`acted` (reszta `_beginTurn` poza tematem).

## RUNDY
4/5

## NASTĘPNY KROK
Evaluator r4. Po FC PASS: K5LOOP-WIRING (#113), potem I5 (DTO `Move`/`Shot`/`Leave`/`Shaken`, FC-U3). Proponowany mały temat: wpięcie `shake_allies_on_loss` w ścieżkę zabicia (`_resolveBlowOutcome` `:9048`) ze zmianą asercji `p6_siege_tactics_loop_body_pin`/`p6_k5loop_outcome_pin`.

## DEPLOY/PUSH
NIE WYKONANO
