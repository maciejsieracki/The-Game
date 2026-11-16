# 03-final-control — R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (runda 1, Final Control SONNET)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt, bez zmian kodu)
TEMAT: R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (rozpoznanie doktryny AUTO, strzelca i muru w ProdBody, #112)
GOAL: orzec na dowodzie, czy rozpoznanie (`01-rozpoznanie.md`) po zarzutach Evaluatora (`02-evaluator.md`) i obronie Operatora (`02a-obrona.md`) daje poprawną podstawę do podziału portu #112 na tematy; wydać wiążący, skorygowany podział.
ZMIANY/COMMIT: wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/03-final-control.md`). Brak zmian w `gra/` i `rust-port/`. `01-rozpoznanie.md` NIE jest edytowany; wiążące sprostowania są w §3 i §5 tego pliku (erratum).
TESTY: nie uruchamiano cargo ani npm (tryb odczytu). Weryfikacja własna przez `git show 07d2fbd72:gra/src/battle/battleScene.ts` (zapisany lokalnie w scratchpadzie do `sed`/`grep`) i `git show origin/rust-port/parity-v2:...` (`59746d373`). Polecenia w §7.
BLOKADY: brak technicznych. Brak pytań do właściciela (gameplay): wszystko rozstrzyga web (zasada 9 i 11). Pozostałe NIE_ZMIERZONO w §6.
RUNDY: 1/5 (Final Control; Operator, Evaluator i Obrona w rundzie 1)
NASTĘPNY KROK: orkiestrator integruje (3 pliki raportu + ten) i rozpisuje dispatche T0, T2', T6, T5a (fala 1) wg §5; zadanie #112 zostaje rozbite, a #97/#118/#113 dostają zależności z §5.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push do parity).

---

## 1. Zakres commitów (niezależna weryfikacja)

| Commit | Rodzic | Pliki (z `git show --name-only`) | Wynik |
|---|---|---|---|
| `caeca2d6b` (Operator, `01-rozpoznanie.md`) | `459354a12` | wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/01-rozpoznanie.md` | POTWIERDZONE |
| `b09020eef` (Evaluator, `02-evaluator.md`) | `caeca2d6b` | wyłącznie `.../02-evaluator.md` | POTWIERDZONE |
| `b8f092415` (Obrona, `02a-obrona.md`) | `caeca2d6b` | wyłącznie `.../02a-obrona.md` | POTWIERDZONE |

`git diff --name-only 459354a12 HEAD` (po zebraniu trzech commitów w worktree FC) zwraca dokładnie trzy pliki, wszystkie w katalogu tematu. Nic w `gra/`, nic w `rust-port/`. `c3e3617b2` (OUTCOME) jest przodkiem `59746d373` (`git merge-base --is-ancestor` zwraca sukces), więc #112 jest odblokowany. Uwaga formalna: Evaluator i Obrona nałożyli commity równolegle na `caeca2d6b` (dwie gałęzie wf), więc FC zbiera je merge'em w swoim worktree; żaden commit nie dotyka niczego poza katalogiem tematu.

## 2. Co FC sprawdził sam na pinie (nie na słowo raportów)

Pin: `07d2fbd72:gra/src/battle/battleScene.ts` (20771 linii, zgodnie z raportem).

| Sprawdzenie | Wynik |
|---|---|
| `_unitBattleClass` 17486-17490, `_prefsForUnit` 17496-17510, `_priorityScore` 17512-17520; `_targetPriorities` domyślne 2328-2332 | POTWIERDZONE (Z1). Raport 01 §7 „nie zlokalizowane" jest błędny. |
| `_getEffectiveDoctrine` 17612-17619 → domyślnie `steady`; `_isUnitDoctrineAuto` 17621-17631 → `true` bez grupy/`unitDoctrine`; `_effectiveMetaForUnit` 17633-17655 | POTWIERDZONE. |
| Łańcuch w `_executeGroupDoctrineStep` 17966-18083: defensive → skirmish → steady+mounted → steady+strzał → steady+`_rangedAction` → steady+`_advanceStep` → aggressive → gałąź domyślna 18051-18082 | POTWIERDZONE. Gałąź domyślna jest osiągalna tylko dla `doctrine === 'manual'` (typ `GroupDoctrine` 1938 ma pięć wartości). |
| Wywołania `_executeGroupDoctrineStep`: tylko 6097 i 18291; oba za bramką `meta.doctrine !== 'manual'` (6094, 18290) | POTWIERDZONE → B9 (18051-18082) martwy. |
| `_doctrineMoveDest`: wołane tylko z 18063 (B9, martwe) i 18103 (skirmish) | POTWIERDZONE. |
| `_attackFormationRallyPoint`: jedyne wołanie 17939; `_chargeMoveDest`: jedyne wołanie 17948 (oba wewnątrz `_doctrineMoveDest`, gałęzie `steady`/`aggressive` nieosiągalne ze skirmisha) | POTWIERDZONE → C7 i C8 martwe na pinie. |
| `_bestChargeStepKey` (17736) | ŻYWE: wołane z `_cavalryAction` (6403) i z martwego `_chargeMoveDest` (17780). Raport 01 wrzucił je do C8. To jest nowe sprostowanie FC (F2 w §4). |
| `groupId: null` przy tworzeniu 4574, 4720, 5489, 17262; `ru.groupId = gid` tylko 13877 (`_restoreDeployGroupSnapshot`) i 19808 (`_groupSelected`); `unitDoctrine =` tylko 17669 (`_setUnitsDoctrine`); `_setGroupDoctrine` z 17858, 18205, 19821 | POTWIERDZONE (Z2): grupy i doktryny jednostek powstają wyłącznie w UI. |
| `_performPlayerOrder` 18280: gałąź `none` + doktryna → `_executeGroupDoctrineStep` (18288-18291); gałąź `move` 18297-18429 (greedy, `_adjacentEnemy`, `_shouldAvoidAutoBacktrack`, `_firstStepTowardMoveDestination` 18478, `_compactAttackAllowsStep`, `_destAllowedByBlockade`, `lastAutoMoveFrom`) | POTWIERDZONE (Z4, Z5). |
| `_performSiegeManualOrder` 18435-18470; `doctrineAuto` 18443-18444; wejście z `_performPlayerOrder` 18286 | POTWIERDZONE (Z4). |
| `_isUnitDoctrineAuto(` wołane: 6024, 6093, 13002 (UI), 17641, 18288, 18443, 18511 | POTWIERDZONE (Z7b). |
| `shootingEnabled !== false` w 17971, 18001, 18014, 18032, 18051, 18091, 18447 (i 6241, 7954, 8090, 18485) | POTWIERDZONE (Z7c); rozszerzenie: także gałąź domyślna 18051 i `_performSiegeManualOrder` 18447. |
| `_destAllowedByBlockade` 17809-17815: bez `blockadeActive` zwraca `true`; `blockadeActive` domyślnie `false` (2337), ustawiane przez setter 17830 (UI) | POTWIERDZONE: C5 jest bez efektu w bitwie bez ręcznej blokady. |
| Rust: `ProdBody::start` `siege_tactics_loop.rs:1035-1045` (else-if: `tryb-reczny`, `oblezenie`, `strzelec`, `doktryna`); `perform_player_order` = `false` (773); `doctrine_step` = `false` (776); `player_unit_idle` stub `false` (456; trait `siege_tactics_turnseq.rs:140`, użycie 350) | POTWIERDZONE (S2, Z5, Z6, Z7a). |

## 3. Orzeczenie per zarzut (NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA)

Znaczenie: NAPRAW = zarzut trafny, korekta jest wiążąca (erratum w tym pliku, bo `01` nie jest edytowany w tej rundzie); ODDAL = zarzut obalony; DO DECYZJI CZŁOWIEKA = decyzja gameplay/produktowa, której web nie rozstrzyga.

| Zarzut | Orzeczenie | Uzasadnienie na dowodzie |
|---|---|---|
| Z1 (`_unitBattleClass`/`_prefsForUnit`, stan gracza) | NAPRAW | Pin 17486-17520, 2328-2332 (potwierdzone §2). §7 raportu 01 usunąć w całości; T2 musi objąć klasę bojową, tabelę domyślną `_targetPriorities` i wejścia preferencji. Pola gracza (`useUnitPriorities`, `unitTargetPriorities`, `useGroupPriorities`, `groupTargetPriorities`) są wejściami adaptera z domyślnym „brak" (UI-only); `antiCavSpear` żyje w domyślnej bitwie. |
| Z2 (osiągalność `groupId`/`unitDoctrine`) | NAPRAW (z korektą Obrony N2, patrz F1 w §4) | Pola ustawiane tylko w UI (potwierdzone §2). Wniosek Obrony „domyślna bitwa przechodzi przez gałąź AUTO" jest niepełny: bramka `!this._manualMode` (6092) pomija tę gałąź w trybie ręcznym. Zakres nie jest decyzją gameplay: web ma bitwę gracza z UI, więc parytet (zasada 9) wymaga wejść konfiguracji w adapterze. Rozstrzygnięcie techniczne orkiestratora, zapis w `REJESTR-RUST.md`; bez pytania do właściciela. |
| Z3 (martwy kod B9, C7, C8) | NAPRAW | Łańcuch wywołań potwierdzony §2. B9, C7, C8 i gałąź `else` w `_effectiveMetaForUnit` (17647-17651; warunek zostawia tylko `steady`/`skirmish`) nie mają wykonania na pinie. Nie portować jako zachowania; port ma mieć jawny test „nieosiągalne" (patrz §5, uwaga o B9). `_bestChargeStepKey` NIE jest martwe (F2) i przechodzi do T6. |
| Z4 (`_performSiegeManualOrder`, drugie wejście `_performPlayerOrder`) | NAPRAW | Potwierdzone §2. Tryb ręczny: pozycje H1/H2 dopisać do tabeli §2 (BRAK w Rust, poza zakresem `ProdBody`); przypisanie do #97/#118, nie do T1-T9. |
| Z5 (brak właściciela gałęzi `move` w `_performPlayerOrder`) | NAPRAW | Potwierdzone §2 i `loop.rs:773`. Nowy temat T9 (§5). Bez niego skirmish piechoty (B10) i tryb ręczny nie mogą się wykonać. |
| Z6 (łańcuch else-if w ProdBody; „PORT-JEST" tylko w maszynie) | NAPRAW | Potwierdzone `loop.rs:1035-1045`. Trzy tagi muszą zniknąć w różnych tematach (§5): `strzelec` (po T5a/T5b), `doktryna` (T8), `oblezenie` (#113). Dodatkowa kolumna „działa w ProdBody" jest obowiązkowa w tabeli §2 (E4-E12, F1-F6 = tylko maszyna, w pętli nieaktywne). |
| Z7 (a)-(d) | NAPRAW (wszystkie cztery) | (a) `player_unit_idle` (turnseq 139-140, 350; stub `loop.rs:456`) wchodzi do #97/#118 (H); (b) 18511 do T4, 17641 informacyjnie; (c) `shootingEnabled !== false` jako wejście `ProdUnit` w T5/T2; (d) numery linii: `_ensureGroupMeta` 17586, `_applySkirmishFlagsForUnit` 17658, `_applySkirmishFlags` 17817. |
| Nowe N1-N4 Obrony | N1 PRZYJĘTE, N2 PRZYJĘTE Z KOREKTĄ (F1), N3 PRZYJĘTE, N4 PRZYJĘTE | N2 poprawione niżej. |

Brak zarzutu ODDAL: żaden z siedmiu nie został obalony. Brak pozycji DO DECYZJI CZŁOWIEKA: każda otwarta kwestia jest zakresem technicznym lub kolejnością tematów (zasady 9 i 11: web rozstrzyga, orkiestrator wybiera kolejność).

## 4. Nowe ustalenia FC (nie wykryte ani przez Operatora, ani przez Evaluatora)

**F1 (istotne, koryguje N2 Obrony): osiągalność zależy od `_manualMode`, a nie tylko od UI grup.**
- Pin: pole `_manualMode = true` (2286); w konstruktorze `_manualCommanderGate = opts.manualControlAllowed !== undefined` (2718); na starcie walki `_manualMode = !_manualCommanderGate || (_manualCommanderGate && hasCommander)` (3572, `hasCommander` = żywy `isArmyCommander` po stronie gracza). Wszystkie produkcyjne wywołania w `main.ts` przekazują `manualControlAllowed: <rosterRef>.some(u => u.isGeneral === true)` (`git grep manualControlAllowed 07d2fbd72 -- gra/src`: `main.ts:33581, 33635, 34312, 34399, 36988, 37043`). Zatem produkcyjnie: armia gracza z generałem → tryb ręczny; bez generała → AUTO.
- Gałąź AUTO w `_activateUnit` (6092-6097) ma warunek `!this._manualMode`. W trybie ręcznym:
  - jednostki strony gracza: `_performPlayerOrder` (6067-6068); przy rozkazie `none` i `_isUnitDoctrineAuto` → `_executeGroupDoctrineStep` (18288-18291), czyli doktryna jest wykonywana także tu;
  - jednostki drugiej strony (AI): gałąź AUTO jest pominięta, więc idą generycznymi gałęziami `_activateUnit` (odpowiedniki U7.5-U7.9 w `siege_tactics_activate.rs`: `_rangedAction`, `_cavalryAction`, `_phalanxAction`, `_advanceStep`).
- Konsekwencja dla planu: ciała `_advanceStep`, `_rangedAction`, `_cavalryAction`, `_phalanxAction`, `_fallBackStep` są potrzebne w OBU trybach (bezpośrednio z maszyny i przez doktrynę), więc kolejność „najpierw ciała żywe" (T2, T4, T5a/b, T6) jest słuszna. Natomiast twierdzenie „domyślna bitwa wykonuje doktrynę steady dla każdej jednostki" jest prawdziwe tylko w trybie AUTO. NIE_ZMIERZONO: jak `_playerControlSide()` (12420) jest wyznaczane w bitwach AI-vs-AI i ile z nich wchodzi do `battleScene.ts`.

**F2 (średnie): `_bestChargeStepKey` jest żywe.** Pin 17736 (definicja), wołane z `_cavalryAction` (6403). Raport 01 przypisał je do C8 (`_chargeMoveDest`, martwe). Po zawężeniu T3 (Z3) zniknęłoby z planu, a T6 (jazda) go wymaga. Wiążąco: `_bestChargeStepKey` należy do T6.

**F3 (średnie, do potwierdzenia w #113): sprzeczność zakresu w ProdBody.** Dokumentacja modułu `siege_tactics_loop.rs:1-30` deklaruje zakres „oblężenie (`siege_wall_col >= 0`)", a `ProdBody::start` (1038-1039) wyłącza jako `oblezenie` każdą aktywację przy `wall_col >= 0 || siege_wall_col >= 0`. Wniosek (z kodu, nie z uruchomienia): w oblężeniu z murem produkcyjne ciało nie wykonuje akcji żadnej jednostki; wykonuje je tylko poza murem, gdzie zaś sterownik zatrzymuje się na `BeginAutoBatchPhase` (`:556`). NIE_ZMIERZONO: czy w Rust istnieje oblężenie bez muru (`siege_wall_col < 0`), które przechodzi przez tę ścieżkę, i jaki test to pokrywa (nie uruchamiano). To wzmacnia Z6: tag `oblezenie` musi być jawnie rozstrzygnięty w #113, nie w #112.

**F4 (informacyjne): wejścia stanu jednostki, których `ProdUnit` nie ma.** Do wykonania ciał potrzebne są co najmniej: `unitDoctrine`, `groupId`, `rangedKite`, `shootingEnabled`, `dryCol`, `heldAfterFallback`, `lastAutoMoveFrom`, `antiCavSpear`, `mounted`, wejścia preferencji celów (`ProdUnit` w `siege_tactics_loop.rs:734-760` ich nie ma). Rozszerzenie `ProdUnit` leży w `siege_tactics_loop.rs`, który jest współdzielony z #109, #113, #147-#150. Jeśli każdy temat T2/T4/T5/T6 dopisałby swoje pola, równoległe tematy konfliktowałyby się na tym pliku. Stąd osobny, mały temat T0 (§5).

## 5. Wiążący, skorygowany podział na tematy portu (zastępuje §5 raportu 01)

Zasada: web najpierw (pin `07d2fbd72`), potem Rust; jeden temat = jedna funkcja logiki + wektory pinu; Operator Haiku. Allowlisty to propozycje do dispatchu; nazwy nowych modułów zatwierdza orkiestrator. Wektory generować z kodu pinu (`_gen.mjs`), nie z Rust.

| Temat | Zakres (pin) | Allowlista (propozycja) | Zależności | Równolegle z |
|---|---|---|---|---|
| T0 `K5DOC-PROD-UNIT-STAN` | Pola z F4 w `ProdUnit`/`ActivateUnit`, bez zmiany zachowania; `_forwardCol` (6748, C6) jako czysta funkcja; wejścia preferencji celów z domyślnym „brak" | `domain/siege_tactics_loop.rs` (tylko struktura `ProdUnit` i konstruktory), `domain/siege_tactics_doctrine_state.rs` (nowy), `tests/p6_siege_tactics_loop_body*.rs` (dopasowanie konstruktorów) | brak | — (pierwszy, krótki; reszta fali 1 startuje po jego integracji) |
| T2' `K5DOC-CELE` | `_unitBattleClass`, `_prefsForUnit`, `_priorityScore`, `_pickTargetByPriority`, `_pickAdjacentTargetByPriority`, `_pickRangedTargetByPriority` (17486-17583), `_rangedTargetInRange` (7041), `_targetInRange` (8373); warunek `shootingEnabled !== false` | `domain/siege_tactics_doctrine_target.rs` (nowy), `tests/p6_k5doc_target*.rs` + `_vectors/` + `_gen.mjs` | T0 | T6, T5a |
| T6 `K5DOC-JAZDA` | `_cavalryAction` (6372), `_cavalryTarget`, `_cavAdjacentNonSpear`, `_cavDirectedManeuverStep`, `_cavManeuverStep`, `_bestChargeStepKey` (17736, F2) | `domain/siege_tactics_cavalry.rs` (nowy), `tests/p6_k5doc_cavalry*` | T0, T2' (cele) | T5a |
| T5a `K5DOC-STRZELEC-KITE` | `_bestKiteShotStep` (6959), KITE w `_rangedAction` (6690-6720), stan `rangedKite`/`dryCol`/`heldAfterFallback` | `domain/siege_tactics_ranged_kite.rs` (nowy), `tests/p6_k5doc_kite*` | T0, T2' | T6 |
| T4 `K5DOC-PIESZY-SZYK` | `_compactAttackAllowsStep` (8139, wrapper na `compact_line_allows_advance`), `_shouldAvoidAutoBacktrack` (8191), `_advanceStep` (8198-~8290, przeczytać w całości), reguła anty-cofania w BFS 18511 | `domain/siege_tactics_doctrine_step.rs` (nowy), `domain/formation_rules.rs` (tylko wrapper) | T0, T2' | T5a, T6 |
| T5b `K5DOC-STRZELEC-MARSZ` | `_rangedFiringStepStaysBehindMelee` (8175), `lineAllowsRangedStep` (6794), `_rangedForwardStep` (6776), `_bestForwardStep` (6822), APPROACH w `_rangedAction` (6738) | `domain/siege_tactics_ranged_forward.rs` (nowy), `tests/p6_k5doc_forward*` | T4, T5a | T7 |
| T7 `K5DOC-FALANGA-COFANIE` | `_phalanxAction` (6546, przeczytać w całości), `_fallBackStep` (7228), stan `dryCol`/`heldAfterFallback` | `domain/siege_tactics_phalanx_fallback.rs` (nowy), `tests/p6_k5doc_phalanx*` | T4, T5a | T5b |
| T9 `K5DOC-RUCH-ROZKAZ` | gałąź `move` `_performPlayerOrder` (18297-18429) + `_firstStepTowardMoveDestination` (18478) + `_destAllowedByBlockade` (17809, C5) + `_moveTargetForUnit` (11442, C9, tylko część używana tu) | `domain/siege_tactics_player_move.rs` (nowy), `tests/p6_k5doc_player_move*` | T4 | T5b, T7 |
| T8 `K5DOC-KROK-DOKTRYNY` | `_executeGroupDoctrineStep` bez B9 (17966-18050, 18051-18082 jako jawnie nieosiągalne), `_executeSkirmishDoctrineStep` (18087-18122), `_doctrineMoveDest` tylko gałąź skirmish/rally (17931-17962 bez gałęzi `steady`/`aggressive`); wpięcie `ProdOps::doctrine_step`; zdjęcie tagu `doktryna` (`loop.rs:1043-1044`); zdjęcie tagu `strzelec` po T5a/T5b | `domain/siege_tactics_doctrine_dispatch.rs` (nowy), `domain/siege_tactics_loop.rs`, `tests/p6_siege_tactics_loop_body*` | T2', T4, T5a, T5b, T6, T7, T9 | — |
| T1 `K5DOC-MODEL-UI` (po T8, tylko konfiguracja gracza) | `_ensureGroupMeta` (17586), `_setGroupDoctrine` (17864), `_setUnitsDoctrine` (17666), `_applySkirmishFlags*` (17658, 17817), `_attackFormationRallyPoint` NIE (martwe), rally z `_setGroupDoctrine` (17894-17912, do przeczytania) | `domain/siege_tactics_doctrine_meta.rs` (nowy) | T8 | — |
| H (zakres #97/#118, poza #112) | `_performSiegeManualOrder` (18435-18470), `player_unit_idle` (turnseq 139-140), wejścia 6068, 18286, 18608 | wg #97/#118 | T1, T9 | — |
| #113 (poza #112) | rozstrzygnięcie tagu `oblezenie` i gałęzi E4-E12/F1-F6 w ProdBody (F3) | wg #113 | T8, H | — |

Kolejność i równoległość:
- Fala 1: T0 (sam, krótki) → po integracji T0: T2', T6, T5a, T4 (rozłączne pliki; T6 i T5a zależą od T2' tylko przez interfejs wyboru celu, więc T2' idzie pierwszy albo wspólnie z kontraktem typów z T0).
- Fala 2: T5b, T7, T9 (po T4/T5a).
- Fala 3: T8, potem T1, H, #113.
- Konflikt współdzielonego pliku: wyłącznie `siege_tactics_loop.rs` (T0 i T8, plus #109/#113/#147-#150); reszta tematów dotyka tylko nowych modułów. Dlatego T0 jest pierwszy i osobny.
- Tematy z jawnym pominięciem: C7 (`_attackFormationRallyPoint`), C8 (`_chargeMoveDest`), B9 (gałąź domyślna), `else` w `_effectiveMetaForUnit` (17647-17651): nieosiągalne na pinie. Zapis w `REJESTR-RUST.md` jako NIEOSIĄGALNE-NA-PINIE; w T8 gałąź B9 jako jawny panic-free zwrot `false` z testem „doktryna spoza czterech = niewykonywana".
- Uwaga: Q1 Operatora (kolejność wpięcia vs #113): rekomendacja B (T0-T9 osobno, wpięcie tagów w T8/#113) jest zgodna z powyższym i nie jest decyzją gameplay; orkiestrator zatwierdza kolejność technicznie.

## 6. NIE_ZMIERZONO (nie rozstrzygnięte w tej rundzie)

- Pełne ciała: `_advanceStep` (8198-~8290), `_rangedAction` (6656), `_cavalryAction` (6372), `_cavManeuverStep`/`_cavDirectedManeuverStep`, `_phalanxAction` (6546), `_fleeStep` (9845), `_bestForwardStep`, `_bestKiteShotStep`, `_siegeMachineRange` (7530), `_bestChargeStepKey` (17736). Każdy temat portu zaczyna od pełnego odczytu swojego ciała (dispatch ma to wymusić).
- `_setGroupDoctrine` rally (17894-17912): czy ustawia `rallyCol` dla grup w sposób wpływający na żywą gałąź skirmish (wpływa tylko na T1).
- Bitwy AI-vs-AI: `_playerControlSide()` (12420-12422) i to, czy przechodzą przez `battleScene.ts` z grupami (F1).
- Rust: czy istnieje oblężenie z `siege_wall_col < 0` przechodzące przez ProdBody (F3); nie uruchamiano cargo.
- UI (G4: etykiety, chipy, panel generała): poza portem silnika z założenia.

## 7. Odtwarzalne polecenia FC

```
git show --name-only --format=%h caeca2d6b b09020eef b8f092415
git diff --name-only 459354a12 HEAD
git merge-base --is-ancestor c3e3617b2 59746d373 && echo ANCESTOR
git show 07d2fbd72:gra/src/battle/battleScene.ts > <scratch>/bs.ts
sed -n '17486,17520p;2325,2333p' <scratch>/bs.ts                                   # Z1
sed -n '17612,17660p;17931,17965p;17966,18125p' <scratch>/bs.ts                      # Z3, B-gałęzie
grep -n '_executeGroupDoctrineStep(\|_doctrineMoveDest(\|_attackFormationRallyPoint(\|_chargeMoveDest(\|_isUnitDoctrineAuto(\|_bestChargeStepKey' <scratch>/bs.ts
grep -n 'groupId\s*[:=][^=]\|unitDoctrine\s*=[^=]\|_setGroupDoctrine(\|_setUnitsDoctrine(' <scratch>/bs.ts   # Z2
sed -n '6060,6100p;18276,18345p;18435,18475p' <scratch>/bs.ts                         # Z4, Z5, F1
grep -n '_manualMode\s*=\|_manualCommanderGate' <scratch>/bs.ts; sed -n '3568,3573p;17809,17815p' <scratch>/bs.ts   # F1, C5
git grep -n 'manualControlAllowed' 07d2fbd72 -- gra/src                              # F1
git show origin/rust-port/parity-v2:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '1,30p;452,460p;550,560p;770,780p;1030,1050p'
git grep -n 'player_unit_idle' origin/rust-port/parity-v2 -- rust-port/engine/src
```

## 8. Werdykt

PASS-WITH-NOTES. Rozpoznanie jest użyteczne jako podstawa: tabela §2 raportu 01 jest w większości zgodna z pinem i bazą (S1-S8 Evaluatora, powtórzone przez FC dla bramki 6087-6097, ProdBody 1035-1045, brak symboli doktryny w Rust), siedem zarzutów Evaluatora jest trafnych i przyjętych przez Obronę, a FC dodaje cztery ustalenia (F1-F4), z czego F1 koryguje wniosek N2 Obrony. Raport 01 sam w sobie zawiera błędy (Z1, Z3, Z4, Z5, Z6) i nie wolno z niego dispatchować wprost: obowiązuje §3 i §5 tego pliku. Zakres tej rundy (odczyt, jeden katalog) dotrzymany.
