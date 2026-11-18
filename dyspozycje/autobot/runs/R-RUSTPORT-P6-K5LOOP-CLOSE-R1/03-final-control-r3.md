# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Final Control, runda 3 (DODATEK r3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5. Zakres r3: `_rangedAction` z `_fallBackStep` (strażnik `strzelec` zdjęty), `_phalanxAction`, a `_fleeStep` tylko wtedy, gdy zmieści się w rundzie. DODATEK r3 pozwala przenieść `_fleeStep` na r4.
BADANY COMMIT: `12d95dc65` (gałąź `obrona/k5loop-close-r3`, obrona r3) = Operator `1e67ae15c` + obrona. Rodzic Operatora to BAZA r3 `7bd030ead38946ffcfe8824f3431790137581533` (`merge-base --is-ancestor 7bd030ead 12d95dc65` = prawda). Raport Evaluatora `02-evaluator-r3.md` leży na lokalnej gałęzi `eval/k5loop-close-r3` (`ca9840350`) i nie jest przodkiem `12d95dc65`, więc orkiestrator dołącza go przy integracji.
ZMIANY/COMMIT: FC nie zmieniał kodu. Dodał tylko ten raport, w lokalnym commicie na gałęzi `fc/k5loop-close-r3` nad `12d95dc65`. Nic nie zostało wypchnięte.
TESTY: wszystkie bramki odtworzone niezależnie, wyniki niżej. Pełny engine: EXIT 0, 530 binarek, 3965 passed, 0 failed, 1 ignored.
BLOKADY: brak
RUNDY: 3/5
NASTĘPNY KROK: integracja orkiestratora (`12d95dc65` + `02-evaluator-r3.md` + ten raport). Potem r4 tego ID: `_fleeStep` `battleScene.ts:9845-9895`, `strzelec-bez-strzelania` i uwagi FC-U1..U3.
DEPLOY/PUSH: NIE WYKONANO

## Bramki (odtworzone przez FC)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. `CARGO_TARGET_DIR` = scratchpad `fck5r3/tgt`, poza repo, usunięty po bramkach. Całość szła w tle (`setsid nohup`), a kody wyjścia trafiały do `status.log`. Dysk przed pełnym engine: 15 GB wolne (wymagane ≥ 8 GB).

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | — |
| `cargo test --test p6_k5loop_close_r3` | 0 | 6 passed |
| `cargo test --test p6_k5loop_close --test p6_k5loop_close_r2` | 0 | 5 + 6 passed |
| `cargo test` na wszystkich `tests/p6_siege*.rs` (40 binarek) | 0 | 40 × `ok`, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (engine) | **0** | **530 binarek, 3965 passed, 0 failed, 1 ignored** (`p6_order_lane dump_tick1`, istniał przed tematem) |

Wynik zgadza się co do sztuki z raportem obrony: 3965, czyli 3964 u Evaluatora plus nowy test N1.

## Allowlista, wektory, proces (sprawdzone samodzielnie)
- `git diff --name-status 7bd030ead 12d95dc65` zmienia te pliki: `siege_tactics_loop.rs`, `siege_tactics_actions.rs` (tylko wariant `Shot`, `ShotWithoutDto` i jedno ramię `actions_to_dto`; istniejące warianty bez zmian), `tests/p4_1i3_actions.rs` (jedno mechaniczne ramię `match`, +12/−0), nowe `p6_k5loop_close_r3.rs`/`_gen.mjs`, `vectors_r3*.json` (3 pliki), raporty w runs. Wszystko mieści się w allowliście DODATKU r3. Nie ruszono `gra/**`, `data/**`, `Cargo.*` ani klocków T2/T5a/T5b/T7a/T7b.
- `git diff --check` jest czysty. Commity nie mają linii `Co-Authored-By` (#289). Nowe pliki nie zawierają `#[ignore]`.
- Wektory r1/r2 są bajt w bajt identyczne (sha256 `vectors.json` 798a2f94…, `vectors_r2.json` 2cf29030…, `vectors_r2_nan.json` 2f88474f…, poza diffem).
- Regenerację uruchomił FC: `node rust-port/engine/tests/p6_k5loop_close_r3_gen.mjs` (Node 22, 1,1 s). Strażnik SHA wycinków pinu `2bba6a05…2cebd` się zgadza. `vectors_r3.json`, `vectors_r3_nan.json` i `vectors_r3_tie.json` wyszły identyczne z commitem (`git status` czysty). Generator wykonuje tekst pinu `07d2fbd72` (`git show`, `new Function`).
- `git merge-tree --write-tree origin/rust-port/parity-v2 (acf238f59) 12d95dc65` przeszło bez konfliktu (drzewo `42e31d6ba…`). Parity poszło do przodu od bazy r3 (FOG-SAVE, RENDER-FRAME r2), ale zmiany są rozłączne.

## Kod wobec pinu (czytane linia po linii)
- `_activateUnit` `:6241-6290`: kolejność `canShoot && shootingEnabled !== false` → `_rangedAction`; `primaryRanged` → U7.6 (`dryCol`, `_targetInRange`, `movedBack`/`distThreat`, `heldAfterFallback`, `_fallBackStep`); `mounted`; `phalanx`. Wszystko zgodne. `ProdOps::advance_coord` i `nearest_enemy_pos` (`_enemiesOf` `:8291-8294` z filtrem `!routed`, ściśle `<` jak `_nearestEnemy` `:8296-8304`) zastępują stuby `0`/`None`.
- `_rangedAction` `:6656-6741`: KITE (`primaryRanged && rangedKite !== false`, `<= MELEE_SAFE_GAP`, krok, a w callbacku `_rangedTargetInRange` albo zagrożenie w zasięgu; przyparty strzela w `_rangedTargetInRange ?? nearest`), potem STRZAŁ (`1 <= dNear <= range`), potem MARSZ. Zgodne.
- `_rangedForwardStep` `:6776-6809`: preludium `moveLeft <= 0` (NaN przechodzi), stop w zasięgu, `_bestForwardStep`, bramka `lineAllowsRangedStep`, callback z `_rangedAction` od nowa (`continue 'ra`), `ru.moveLeft > 0` jako dokładna negacja `<= 0 || is_nan` (lekcja r2a). Zgodne.
- `_rangedFiringStepStaysBehindMelee` `:8175-8189`: filtr sojuszników, `min` odstępu wiersza, `min` postępu pasa, `<=`. Zgodne.
- `_doRangedAttack` `:9179-9235`: `facingFromTo` → `Facing`, `ammoLeft -= 1` tylko dla skończonej, `_singleBlow(…, true)` w `t + 380`, etykieta przy `dmg > 0 && !dead && !fadingOut`, `done` po `+ 320`. Zgodne. Amunicja schodzi w `complete`, a nie przy wystrzale, ale tej różnicy nie da się zaobserwować, bo aktywacja jest szeregowa. Akceptuję ustalenie Evaluatora.
- `_fallBackStep` `:7228-7244`: T7b bez zmian, pętla `STEP_GAP_MS`, NaN kończy po jednym kroku. Zgodne.
- `_phalanxAction` `:6546-6578`: T7a bez zmian, krok to jeden `_doMove` i `done()`. Zgodne.
- D-K5C-1…5 i lekcje r2 (a, b) spełnione. Każda gałąź, która nie wykonuje akcji, zostawia jawny tag w `unported`: `strzelec-bez-strzelania`, `strzal-bez-szablonu`, `*-brak-terenu`, `ucieczka-routed`.

## Mutacje niezależne FC (`scratchpad/fck5r3/mut.py`, za każdym razem `RESTORED True`, `git status` czysty)
| mutant | wynik |
|---|---|
| E11 (zarzut N1 Evaluatora) przyparty: `nearest` zamiast `_rangedTargetInRange ?? nearest` | **zabity** (`kite_przyparty_remis_odleglosci_nizsze_hp`), poprawka obrony potwierdzona |
| F2 KITE bez warunku `primaryRanged` | zabity |
| F5 `_nearestEnemy` w `ProdOps` (U7.6) = pierwszy żywy zamiast najbliższego | zabity |
| F6 marsz strzelca: preludium `< 0` zamiast `<= 0` | zabity |
| F8 `Shot.land_at` bez `RANGED_FLY_MS` | zabity |
| F7 strzał z miejsca: `d_near >= 0` | przeżył. **Równoważny**: żywe jednostki stoją na różnych polach (`occByKey`), więc `dNear = 0` nie występuje |
| F9 odwrót: `_nearestEnemy` z `<=` (ostatni z równo bliskich) | przeżył. **Równoważny**: T7b `best_fall_back_step` używa `nearest_enemy` tylko do `dNow` (odległość), jak w pinie `:7189-7190`; przy remisie odległość jest ta sama |
| F1 po strzale nie przeliczono `can_shoot` (`canShoot = rangedBase && ammoLeft > 0`) | przeżył. **Nie równoważny**: skutek widać dopiero w następnej aktywacji. Każdy wektor r3 to jedna aktywacja |
| F3 `_rangedFiringStepStaysBehindMelee`: `max` zamiast `min` postępu pasa | przeżył. **Nie równoważny**: brak wektora z ≥ 2 sojusznikami wręcz w tym samym, najbliższym wierszu i z różnymi kolumnami |
| F4 etykieta `Damage` przy `dmg >= 0` | przeżył. **Nie równoważny**: wektory r3 nie porównują akcji `Damage` strzału (atrapa `_singleBlow` = 0, por. N3) |

## Rozstrzygnięcie zarzutów
| # | zarzut | orzeczenie | uzasadnienie |
|---|---|---|---|
| N1 | E11 przeżywa (KITE przyparty, remis odległości i HP) | **ODDAL** (naprawione w obronie) | Obrona dodała 8 wektorów pinu `vectors_r3_tie.json` i test. FC odtworzył mutant E11: zabity. |
| N2 | licznik `phalanxHold` generatora ≠ „stoi 55” | **ODDAL** (naprawione) | Generator drukuje teraz `phalanxNoAttackNoStep: 65` i `phalanxHold: 55`. Zgadza się z raportem i z licznikiem testu. Tablica `cases` się nie zmieniła. |
| N3 | obrażenia strzału nieporównywane | **ODDAL** | Jawnie w NIE_ZMIERZONO (3). Formułę pokrywa K5I/`body_pin`. W r3 porównywane są cel, chwila, łuk i liczba rzutów. |
| N4 | tag `*-brak-terenu` także dla gałęzi bez kroku | **ODDAL** | Reguła D1 K5DOC-T4e-0, ta sama co `kawaleria-brak-terenu` r2. Wymóg „`MoveTerrain` obowiązkowy” dla #113 jest już w dispatchu r3. Nie ma regresji. |
| N5 | `_fleeStep` i `strzelec-bez-strzelania` przechodzą na r4 | **ODDAL** (zakres r4) | DODATEK r3 wprost pozwala to przenieść. Linie pinu i powód są wypisane, tagi zostają jawnie w `unported`. GOAL całości nie jest jeszcze zamknięty, więc temat idzie do r4, a nie do zamknięcia. |
| FC-U1 | mutant F1 (`can_shoot` po wyczerpaniu amunicji) przeżywa | **ODDAL** jako wada r3, wymóg r4 | Kod jest zgodny z pinem `:1457`, `:9191`. Luka dotyczy tylko pokrycia stanu między aktywacjami, której nie wymagał zestaw mutacji dispatchu. W r4 dodać wektor pinu z dwiema kolejnymi aktywacjami strzelca z `ammoLeft = 1`, gdzie druga aktywacja idzie ścieżką U7.6. |
| FC-U2 | mutant F3 (`min`/`max` postępu pasa) przeżywa | **ODDAL** jako wada r3, wymóg r4 | Kod jest zgodny z `:8188`. W r4 dodać rodzinę `steady` z ≥ 2 sojusznikami wręcz w najbliższym wierszu i różnymi kolumnami. |
| FC-U3 | mutant F4 (warunek etykiety `Damage` strzału) przeżywa | **ODDAL** jako wada r3, wymóg r4/I5 | Kod jest zgodny z `:9226`. Akcję `Damage` strzału trzeba porównać w wektorach, gdy I5 zacznie zamieniać `Shot`/`Damage` na DTO. Na razie to NIE_ZMIERZONO, jak N3. |
| proces | dysk 7,4 GB u Evaluatora przy pełnym engine | **ODDAL** | Spadek dał się odtworzyć przez równoległych workerów. U FC przed pełnym engine było 15 GB. |

Żaden zarzut nie dostał NAPRAW ani DO DECYZJI CZŁOWIEKA. Werdykt: **PASS-WITH-NOTES**.

## Uwagi dla orkiestratora
1. Do integracji: `12d95dc65`, raport Evaluatora z `ca9840350` i ten raport. Merge z bieżącym `parity-v2` (`acf238f59`) przechodzi bez konfliktu.
2. Runda 4 tego ID: `_fleeStep` `:9845-9895` (z `_removeUnitFromScene` `:9910`, `_shakeAlliesOnLoss`, `fleeStuck`; tag `ucieczka-routed`), `strzelec-bez-strzelania` (`:6241`, `:8373-8377`, `:8436`) oraz wektory FC-U1, FC-U2 i FC-U3 (FC-U3 można przekazać do I5).
3. Target FC usunięty. Po sprzątaniu wolne 14 GB.
