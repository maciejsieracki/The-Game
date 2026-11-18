# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Evaluator (adwersarialny), runda 3

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5; r3 (DODATEK r3): `_rangedAction` + `_fallBackStep` (strażnik `strzelec` zdjęty), `_phalanxAction`, `_fleeStep` (ten ostatni dopuszczalnie na r4).
BADANY COMMIT: `1e67ae15c` (gałąź `rust-port-wip/k5loop-close-r3`), rodzic = BAZA r3 `7bd030ead38946ffcfe8824f3431790137581533` (`git merge-base --is-ancestor 7bd030ead 1e67ae15c` = prawda, jeden commit nad bazą).
Worktree Evaluatora: `.claude/worktrees/wf_a42554e9-0cc-2`, gałąź lokalna `eval/k5loop-close-r3` = `1e67ae15c` + ten raport.

## ZMIANY/COMMIT
Evaluator nie zmieniał kodu. Jedyny nowy plik: ten raport (commit lokalny, bez push).

## TESTY (odtworzone niezależnie)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `evr3/tgt-evr3` (poza repo, usunięty po bramkach). Cała sekwencja w tle (`setsid nohup`, kody wyjścia w `status.log`).

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close_r3` | 0 | 5 passed, 0 failed |
| `cargo test --test p6_k5loop_close --test p6_k5loop_close_r2` | 0 | 6 + 5 passed |
| `cargo test` na wszystkich 40 binarkach `tests/p6_siege*.rs` | 0 | wszystkie `ok`, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (engine) | **0** | **530 binarek, 3964 passed, 0 failed, 1 ignored** |

Jedyny `ignored` = `p6_order_lane::e2e::dump_tick1_econ_for_web_generator` (istniejący, poza tematem). Liczby zgodne co do sztuki z raportem Operatora.
Dysk: 11 GB wolne przy starcie bramek; w chwili wejścia w pełny engine 7,4 GB (spadek przez równoległe workery innych tematów, nie przez ten temat; build tego tematu był już w większości skompilowany). Odnotowane jako uwaga procesowa, bez wpływu na wynik.

## Allowlista
`git diff --name-status 7bd030ead..1e67ae15c`:
- M `rust-port/engine/src/domain/siege_tactics_loop.rs` — allowlista.
- M `rust-port/engine/src/domain/siege_tactics_actions.rs` — dozwolone przez DODATEK r3 („tylko jeśli konieczne dla nowych akcji”): wyłącznie nowy wariant `BattleAction::Shot`, `ActionError::ShotWithoutDto`, jedno ramię w `actions_to_dto` (sprawdzone w diffie: brak zmian semantyki istniejących wariantów).
- M `rust-port/engine/tests/p4_1i3_actions.rs` — sekcja „Pliki spoza allowlisty”: jedno mechaniczne ramię `match` `BattleAction::Shot` w `enc()` (+12 linii, 0 usuniętych); dozwolone jako „mechaniczne ramiona match w testach”. Zweryfikowane: nic poza tym ramieniem.
- A `tests/p6_k5loop_close_r3.rs`, `p6_k5loop_close_r3_gen.mjs`, `p6_k5loop_close_vectors/vectors_r3.json`, `vectors_r3_nan.json`, raport `01-operator-r3.md` — allowlista.
- Nie ruszono: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, klocki T5a/T5b/T7a/T7b/T2 (D-K5C-3 spełnione).
- Wektory r1/r2 bajt w bajt: sha256 `vectors.json` 798a2f94…728056, `vectors_r2.json` 2cf29030…4a5945, `vectors_r2_nan.json` 2f88474f…cf69ec — pliki nieobecne w diffie.
- `git diff --check` czysty; commit bez linii `Co-Authored-By` (#289).

## `#[ignore]` i osłabione asercje
- Brak `#[ignore]` w nowych plikach (grep).
- 14 usuniętych linii w `siege_tactics_loop.rs` sprawdzone jedna po drugiej: import, komentarze, dwa stuby `0.0`/`None` w `ProdOps` (zastąpione wartościami z pozycji), stary strażnik `strzelec` (zastąpiony węższym `strzelec-bez-strzelania`), konstruktor `ProdOps`. Żadna asercja nie została usunięta ani osłabiona.
- Test r3 porównuje na każdym wektorze: ślad zdarzeń, czas, pozycję, `moveLeft` bitowo, facing końcowy i zmiany facing z czasem, `Move` na każdy krok, cel ciosu, strzał (`Facing` + `Shot` z `land_at`), trafienie (cel, łuk), liczbę rzutów, `dryCol`, `heldAfterFallback`, amunicję, `occByKey` oraz **`unported` puste** (rozbieżność = FAIL).

## Wektory z TEKSTU pinu
- Generator czyta pin przez `git show 07d2fbd72:…` (`battleScene.ts`, `formationRules.ts`, `combat.ts`, dane JSON), sprawdza nagłówki metod (`expectLine`/`METHODS`), końce metod i SHA-256 wycinków `2bba6a05…2cebd` (ta sama stała w teście). Wykonywane są wycinki pinu (`_rangedAction`, `_rangedForwardStep`, `_bestForwardStep`, `_bestKiteShotStep`, `_rangedTargetInRange`, `_bestFallBackStep`, `_fallBackStep`, `_phalanxAction`, `_phalanxStep`, `_rangedFiringStepStaysBehindMelee`, `_nearestEnemyMelee`, `_doAttack`, `_doRangedAttack` …), atrapy wyłącznie dla THREE/pocisku/dźwięku/paska oraz `_doMeleeAttack`/`_singleBlow` (zapis celu, łuk liczony tekstem pinu `relativeHit`).
- Regeneracja przez Evaluatora (`node rust-port/engine/tests/p6_k5loop_close_r3_gen.mjs`, Node 22): 1,1 s, pliki `vectors_r3.json` (5879b223…d7618) i `vectors_r3_nan.json` (bdf9e2fd…55d0) **identyczne bajt w bajt** z commitem (`git status` czysty). Wektory są deterministyczne i pochodzą z pinu.

## Zgodność z D-K5C i porównanie z pinem (czytane linia po linii)
- `_activateUnit` `:6241-6290` (kolejność `canShoot && shootingEnabled !== false` → `_rangedAction`; `primaryRanged` → U7.6; `mounted`; `phalanx`) odwzorowana w `start` (maszyna K5H + nowe ramiona `RangedAction`/`FallBackStep`/`PhalanxAction`).
- `_rangedAction` `:6656-6741`: kolejność KITE → STRZAŁ → MARSZ zgodna; `ru.rangedKite !== false` = `ProdDoctrineState::ranged_kite` (domyślnie `true`, `:4572`); callback KITE `:6704-6716` z fallbackiem na `meleeThreat` w zasięgu; przyparty `_rangedTargetInRange ?? nearest`.
- `_rangedForwardStep` `:6776-6809`: preludium `moveLeft <= 0` (NaN przechodzi), stop w zasięgu, `lineAllowsRangedStep` (`meleeLine && steady ? _rangedFiringStepStaysBehindMelee : _compactAttackAllowsStep`), callback z `_rangedAction` od nowa i dokładną negacją `ru.moveLeft > 0` (`<= 0.0 || is_nan()`, lekcja r2a spełniona).
- `_rangedFiringStepStaysBehindMelee` `:8175-8189`: filtr sojuszników (dead/fadingOut/removed/routed/mounted/rangedBase/siege), min. odstęp wiersza, min. postęp pasa, `<=` — zgodne.
- `_doRangedAttack` `:9179-9235`: zwrot `facingFromTo` (= `facingToward(dq-aq, dr-ar, facing)`), `ammoLeft -= 1` tylko dla skończonej, `_singleBlow(…, true)` po `RANGED_FLY_MS = 380`, etykieta przy `dmg > 0 && !dead && !fadingOut`, `done()` po `RANGED_GAP_MS = 320`. Różnica techniczna: amunicja zmniejszana w `complete` (chwila trafienia), a w pinie w chwili wystrzału — nieobserwowalna, bo aktywacja jest szeregowa (`busy`) i nic nie czyta `ammoLeft` strzelca między wystrzałem a trafieniem (sam szablon ciosu jest wejściem adaptera). Akceptowane.
- `_fallBackStep` `:7228-7244` przez T7b bez zmian, `_nearestEnemy` ze ścisłym `<` (pierwszy najbliższy), pętla `STEP_GAP_MS`.
- `_phalanxAction` `:6546-6578` / `_phalanxStep` `:6588-6636` przez T7a bez zmian; krok = jeden `_doMove` i `done()` (bez `_schedule`), samotna falanga → `_advanceStep`, sąsiad → wspólna ścieżka ciosu.
- D-K5C-1: facing tylko przez `_doMove` (`move_step_core`) i zwrot strzelca z `_doRangedAttack` — brak własnej heurystyki.
- D-K5C-2: rzut tylko w `_singleBlow` trafienia; test `rzuty_strzalow_w_kolejnosci_aktywacji` + licznik rzutów na każdym wektorze.
- D-K5C-3: klocki T2/T5a/T5b/T7a/T7b nietknięte, tylko adaptery (`ProdFallBackWorld`, `ProdPhalanxWorld`, `kite_units`, `forward_unit`).
- D-K5C-4: nowe pola `ammo_left`, `ranged_blows` (w `ProdBody`, z domyślnymi wartościami) oraz trwałe `dry_col`/`held_after_fallback` w `ProdUnit::activate` — wypisane w raporcie Operatora.
- D-K5C-5: czasy wirtualne (`MOVE_STEP_MS`, `STEP_GAP_MS`, `RANGED_FLY_MS`, `RANGED_GAP_MS`), bez nowego mechanizmu.

## Tabela wariantów `ActivateEvent` — weryfikacja
Tabela Operatora zgodna z kodem `start` (`siege_tactics_loop.rs` ~3066-3300): `RangedAction`, `FallBackStep`, `PhalanxAction` wykonywane; `Flee` (routed `:6055` i po okrążeniu `:6118-6120`) → `ucieczka-routed`/`prod_tag`; doktryna/mur/tryb ręczny → jawne tagi spoza tematu. Każde niewykonane odgałęzienie ma jawny tag w `unported`; brak ścieżki, która kończy aktywację bez tagu i bez akcji (nowe tagi: `strzelec-bez-strzelania`, `strzal-bez-szablonu`, `strzelec-/odwrot-/falanga-brak-terenu`; test `bez_terenu_jawne_tagi` i `strzal_bez_dto_to_jawny_blad`).
Pozycja 3 DODATKU r3 (`_fleeStep` `:9845-9895`) NIE zrobiona — dozwolone przez DODATEK r3 („jeśli runda się nie mieści, zrób 1, potem 2, i wypisz jawnie”); Operator wypisał linie pinu i powód (`_removeUnitFromScene` `:9910`, `_shakeAlliesOnLoss`, `fleeStuck`). Zakres r4 jawny.

## Mutacje niezależne Evaluatora (`scratchpad/evr3/mut.py`, przywrócenie `RESTORED True`, `git status` czysty)
| mutant | wynik |
|---|---|
| E1 brak emisji `Facing` przed `Shot` | zabity |
| E2 KITE `gap < MELEE_SAFE_GAP` zamiast `<=` | zabity |
| E3 `rangedKite` ignorowane | zabity |
| E4 `_rangedFiringStepStaysBehindMelee`: `<` zamiast `<=` | zabity |
| E5 brak `STEP_GAP_MS` w marszu strzelca | zabity |
| E6 krok falangi z czasem 0 | zabity |
| E7 `_nearestEnemy` U7.6 z `<=` (ostatni równo bliski) | przeżył — **równoważny**: U7.6 używa `nearest` wyłącznie do `distThreat` (odległość), remis daje tę samą wartość |
| E8 amunicja zmniejszana także dla `Infinity` | przeżył — **równoważny**: `Infinity - 1 = Infinity` |
| E9 `heldAfterFallback` nie zapisywany | zabity |
| E10 brak ponownego `_rangedAction` po wejściu w zasięg | zabity |
| E11 KITE „przyparty”: `nearest` zamiast `_rangedTargetInRange ?? nearest` | **przeżył — NIE równoważny** (patrz uwaga N1) |
| E12 STRZAŁ z miejsca: `nearest` zamiast `_rangedTargetInRange` | zabity |
| E13 KITE „przyparty”: brak strzału | zabity |
| E14 KITE po kroku: bez `_rangedTargetInRange` | zabity |
Mutant M8 Operatora (równoważność gałęzi `meleeThreat` po kroku KITE) potwierdzony z tekstu pinu: `_bestKiteShotStep` `:6976-6987` dopuszcza tylko pole z wrogiem w `[1..range]` liczonym na tym samym `_enemiesOf`, więc `_rangedTargetInRange` z nowego pola nie jest `null`.

## Zarzuty / uwagi (bez blokady)
- N1 (pokrycie, do r4): gałąź KITE „przyparty” (`:6719-6721`) jest pokryta (E13 zabity), ale wektory nie mają remisu odległości z różnym HP w tej gałęzi, więc zamiana `_rangedTargetInRange ?? nearest` na `nearest` przeżywa (E11). Kod jest zgodny z pinem; brakuje rodziny/zasiewu z remisem HP dla strzelca przypartego (np. dwa wrogie oddziały w odległości 2, niższe HP dalej na liście).
- N2 (dokumentacja): raport podaje „stoi 55” dla falangi, a generator drukuje `phalanxHold: 65` (generator liczy z inną kategoryzacją, nakładającą się na `phalanxAdvance`); licznik testu (`phalanx_no_action` = 300−26−75−144 = 55) jest zgodny z raportem. Nazwa licznika generatora nie mówi dokładnie, co liczy (lekcja r2 b) — kosmetyka.
- N3 (zakres #113): obrażenia strzału nie są porównywane w wektorach r3 (atrapa `_singleBlow` = 0); porównywane są cel, chwila, łuk i liczba rzutów. Formułę pokrywają inne wektory (K5I/`body_pin`). Jawnie w NIE_ZMIERZONO Operatora — akceptowane.
- N4 (zakres #113): gałęzie strzelca/odwrotu/falangi bez `MoveTerrain` dają jawny tag także wtedy, gdy pin nie potrzebowałby terenu (np. falanga z sąsiadem → cios). Brak regresji (wcześniej tag `falanga`), ale adapter #113 musi zawsze podać teren — zgodne z wymaganiami Operatora dla #113.
- N5 (proces): `_fleeStep` i `strzelec-bez-strzelania` zostają na r4 — `unported` nie jest jeszcze puste dla ścieżek ucieczki; cel końcowy GOAL nie jest osiągnięty w tej rundzie, zgodnie z dopuszczeniem DODATKU r3.

## BLOKADY
Brak.

## RUNDY
3/5

## NASTĘPNY KROK
Obrona r3 (N1–N5), potem Final Control r3. Runda 4 tego ID: `_fleeStep` `:9845-9895` (z `_removeUnitFromScene`, `_shakeAlliesOnLoss`, `fleeStuck`), `strzelec-bez-strzelania`, oraz wektor z remisem HP dla KITE „przyparty” (N1).

## DEPLOY/PUSH
NIE WYKONANO
