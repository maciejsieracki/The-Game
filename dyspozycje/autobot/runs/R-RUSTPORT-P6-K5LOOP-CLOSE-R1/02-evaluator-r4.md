# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Evaluator (adwersarialny), runda 4

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5: każde `ActivateEvent` wykonane wg pinu albo jawnie oznaczone; `unported` puste dla scenariuszy wektorowych pinu (DODATEK r4: `_fleeStep` + `_removeUnitFromScene` + ripple `_shakeAlliesOnLoss`, tag `strzelec-bez-strzelania`).

## Co oceniano
- BAZA r4: `38f5939e2c74f553c5f1c3928ee7a66cf1f0df5a` (wg dispatchu). `git merge-base --is-ancestor 38f5939e2 76a483a1a` = TAK.
- Kod Operatora: `aeb9cfcf1` (gałąź `rust-port-wip/k5loop-close-r4`), raport `76a483a1a`. Oceniane w odłączonym checkoutcie `76a483a1a`.
- Pin: `07d2fbd72`, `gra/src/battle/battleScene.ts` czytany przez `git show` (linie 6048-6125, 8334-8341, 8373-8493, 8700-8760, 8787-8797, 9179-9235, 9743-9925).

## ZMIANY/COMMIT (Evaluator)
Tylko ten raport. Kod bez zmian (mutacje przywrócone, `RESTORED True`). Bez push.

## Allowlista (diff `38f5939e2..aeb9cfcf1`)
| plik | +/− | ocena |
|---|---|---|
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | +366/−66 | w allowliście |
| `rust-port/engine/src/domain/siege_tactics_actions.rs` | +21/−0 | w allowliście r3/r4: tylko warianty `Leave`, `Shaken`, `LeaveWithoutDto`, `ShakenWithoutDto` i dwa ramiona `actions_to_dto`; istniejące warianty bez zmian |
| `rust-port/engine/tests/p4_1i3_actions.rs` | +14/−0 | mechaniczne ramiona `match` (dozwolone w r4) |
| `tests/p6_k5loop_close_r4.rs`, `p6_k5loop_close_r4_gen.mjs`, `vectors_r4.json`, `vectors_r4_nan.json` | nowe | w allowliście |
| `01-operator-r4.md` | nowy | katalog runs |

Pliki spoza allowlisty: BRAK. Nietknięte: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, wektory r1/r2/r3 (brak w diffie, więc bajt w bajt). `git diff --check`: czysto. Brak nowych `#[ignore]` (jedyny w pełnej bramce: `p6_order_lane::e2e::dump_tick1_econ_for_web_generator`, istniał w bazie `38f5939e2:rust-port/engine/tests/p6_order_lane.rs:1530`). Brak usuniętych asercji (`git diff | grep '^-.*assert'` = 0). Commity bez `Co-Authored-By` (#289).

## Bramki odtworzone (Evaluator, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `k5r4ev/tgt`, usunięty po bramkach; dysk przed pełną bramką 13 GB wolne)
| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close_r4` | 0 | 5 passed |
| `cargo test --test p6_k5loop_close --test …_r2 --test …_r3 --test …_r4` | 0 | 5 + 6 + 6 + 5 passed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | **0** | **532 binarki, 3993 passed, 0 failed, 1 ignored** (zgodne z raportem Operatora) |

Generator (`node rust-port/engine/tests/p6_k5loop_close_r4_gen.mjs`, Node 22.23.4): SHA-256 wycinków pinu `72337be6…92c48`, 1180 + 1080 wektorów, po uruchomieniu `git status` czysty = wektory odtwarzalne bajt w bajt. Liczniki zgodne z raportem.

## Zgodność z tekstem pinu (przegląd adwersarialny)
- `_fleeStep` (`:9845-9898`) vs `flee_run`: preludium `finished`/`dead`/`fadingOut`/`removed`/`moveLeft <= 0` (NaN przechodzi, jak w JS) — zgodne; krawędź własna (`q <= 0` / `q >= BF_COLS-1`) — zgodne; kolumna `q+dir`, wiersze `[0,1,-1,2,-2]`, plansza, `occByKey`, `_passableForUnit` (= skończony `_moveCostForUnit`) — zgodne; `fleeStuck += 1`, przy `>= 2` zniknięcie + ripple — zgodne; `fleeStuck = 0` przed `_doMove` — zgodne; callback: `finished`/`removed`/`dead`, krawędź, `moveLeft > 0` jako `<= 0 || is_nan` (lekcja r2) — zgodne. Ucieczka nie losuje (M15 zabity).
- `_removeUnitFromScene` (`:9910-9925`): idempotencja `removed`, `removed = dead = true`, `fadingOut = false`, zwolnienie pola — zgodne.
- `_shakeAlliesOnLoss` (`:9743-9753`): pomija `fallen`/`dead`/`fadingOut`/`routed`, promień Manhattan `> MORALE_DEATH_RADIUS`, `Math.max(0, morale - 12)`, pasek, `_checkRout`, na końcu `_checkMeleeScreenLost` gdy `!primaryRanged` — zgodne. `MORALE_ALLY_DEATH_LOSS = 12` = pin `:1118`.
- Dwie drogi wejścia (`:6055` rozbita na starcie; `:6105-6118` okrążenie: `_checkRout` → `_startRout` PRZED `_fleeStep`) — zgodne co do kolejności (M13 zabity).
- Strzelec z `shootingEnabled = false`: `_targetInRange` (`:8373-8410`, `1 <= dd <= ru.range`, `attackDirection` i `lowestHp`) przez T2 `target_in_range` bez zmian w T2; `reach = canShoot ? range : 1` w `_canAttackFrom` (`:8437`), `_makeCanAttackFromTest` (`:8455`), `_canStrikeTargetFrom` (`:8491`); `_doAttack` (`:8795`) → `_doRangedAttack` (`Facing` + `Shot`, trafienie po `RANGED_FLY_MS`, koniec po `RANGED_GAP_MS`) — zgodne. Wektory `nobow` mają strzały na dystansach 1..6 (d1 48, d2 71, d3 66, d4 48, d5 30, d6 16) i zasięgi 2..6, więc obie gałęzie `_makeCanAttackFromTest` (`reach <= 4` i `> 4`) są ćwiczone.
- D-K5C-2 (RNG): ucieczka bez rzutów; strzał = jeden rzut `_singleBlow(…, true)`; liczba rzutów porównywana z pinem (N7 zabity). D-K5C-3: T2/T4/T5/T6/T7 tylko wołane (diff ich nie dotyka). D-K5C-4: nowe pola `flee_stuck` (pin `:2018`, spawn 0), `flee_after`, wypisane. D-K5C-5: czasy nominalne jak dotąd.

## Tabela wariantów `ActivateEvent` i brak cichych pominięć
Tabela w `01-operator-r4.md` zgodna z kodem: `Flee` (obie drogi) i `strzelec-bez-strzelania` wykonywane; pozostałe tagi jawne (`*-brak-terenu`, `ucieczka-routed` bez `MoveTerrain`, `ucieczka-oblezenie` przy murze, `strzal-bez-szablonu`, `cios-bez-szablonu`, `doktryna`, `oblezenie`, `tryb-reczny`, `shakeAlliesOnLoss` przy zabiciu, `krok-naprzod-atak` nieosiągalny z dowodem r1). Każdy wektor r1–r4 kończy się asercją `unported` puste (`p6_k5loop_close_r4.rs:781`). Ścieżki bez terenu/przy murze mają testy na jawny tag (`:1034-1097`).

## Mutacje
Operator: 24/24 zabite (lista w `01-operator-r4.md`). Evaluator, własne (skrypt `scratchpad/k5r4ev/mut.py`, testy `p6_k5loop_close{,_r2,_r3,_r4}`):
| mutant | wynik |
|---|---|
| E1 ripple nie pomija uciekających sojuszników | ZABITY |
| E2 `_removeUnitFromScene` bez zwolnienia pola | ZABITY |
| E3 `fleeStuck` zerowany na starcie ucieczki (brak pamięci między turami) | ZABITY |
| E4 ripple: `_checkRout` przed paskiem (`Shaken` po `Rout`) | **PRZEŻYŁ** |
| E5 strzelec bez strzelania: cel bez kierunku natarcia | ZABITY |

E4: stan gry identyczny (te same wywołania, ta sama kolejność; zmienia się tylko kolejność emisji akcji `Shaken` względem `Rout` w tej samej chwili). Test porównuje `Rout`/`Leave`/`Shaken` jako osobne listy z czasem, nie globalną kolejność strumienia akcji. Uwaga U1 niżej.

## UWAGI (nieblokujące; do decyzji orkiestratora)
- U1 (testy, I5): kolejność akcji w strumieniu `BattleAction` między `Shaken`, `Rout`, `Leave` w tej samej chwili nie jest sprawdzana (mutant E4 przeżywa). Pin: `_updateMoraleBar(a)` przed `_checkRout(a)` (`:9749-9750`). Dla I5 (animacje z tym samym `t0`) skutek kosmetyczny; propozycja: przy I5 porównywać globalną kolejność akcji.
- U2 (parytet, poza zakresem r4): ripple przy ZABICIU (`_resolveBlowOutcome`, `battleScene.ts:9048`; także `:5937` poza `_activateUnit`) nadal tylko tagiem `shakeAlliesOnLoss` (`siege_tactics_loop.rs:3837`), mimo że funkcja `shake_allies_on_loss` już istnieje. Wektory r1–r4 mają `unported` puste, bo nie zawierają zabójstw (strzały r4 to pudła). Wpięcie wymaga zmiany asercji w `p6_siege_tactics_loop_body_pin.rs:407/688` i `p6_k5loop_outcome_pin.rs:268/281` (poza allowlistą, „nie osłabiać"). Jawne i z linią pinu, więc nie jest cichym pominięciem; potrzebny osobny mały temat przed #113 (gra w Rust bez tego ma mniejszy spadek morale sojuszników po śmierci jednostki).
- U3 (pokrycie): `surroundLeft = 0` — żaden wektor `surround` nie kończy się zniknięciem z pola (krawędź / zablokowanie po okrążeniu). Ta sama funkcja `flee_run` jest pokryta rodziną `flee` (190 zniknięć), więc ryzyko niskie.
- U4 (nazwy liczników): licznik generatora `nobowShotAdjFar` liczy „strzał bez kroku”, nie „sąsiad i daleko” (nazwa nie mówi, co liczy; lekcja r2 b). Licznik testu Rust (`nobow_shot`) jest poprawny.
- U5: `flee_after` + nadpisanie `st.atk/st.def` w `complete` — poprawne tylko, gdy między `start` a `complete` nic nie zmienia jednostek (Operator: brak muru = brak zegarów wież). Zabezpieczone jedynie `debug_assert_eq!`; dla #113 warto dodać twardą asercję lub udokumentować kontrakt sterownika.
- NIE_ZMIERZONO: czasy rAF (D-K5C-r2-4), DTO `Move`/`Shot`/`Leave`/`Shaken` (I5), FC-U3 (`Damage` strzału).

## TESTY
Jak w tabeli bramek: wszystkie EXIT 0; pełny engine 532/3993/0/1 ignored (istniejący).

## BLOKADY
Brak.

## RUNDY
4/5

## NASTĘPNY KROK
Obrona r4 (`02a-obrona-r4.md`), potem Final Control r4. Po FC PASS: integracja orkiestratora; osobny temat na U2 (ripple przy zabiciu) przed K5LOOP-WIRING (#113).

## DEPLOY/PUSH
NIE WYKONANO
