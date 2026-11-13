# R-WEB-DETERMINISM-GAME-RNG-Q1 — Operator (runda 1/5, HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-GAME-RNG-Q1 (#349)
GOAL: to samo ziarno gry daje ten sam przebieg (stan co turę) w trybie ?civTest=1 i w grze z ziarna nowej gry; zamiana nieseedowanych `Math.random` w pętli tury na generatory z ziarnem; test zakazu `Math.random` w gra/src/game/**; pomiar powtarzalności.
BAZA: ed95085a2 (origin/main), worktree detached. Model: Operator HAIKU (Sonnet nie użyto).

## 1. Źródła niedeterminizmu w pętli tury (plik:linia w BAZIE ed95085a2) i co zrobiono
Numery z audytu (2b6f6576f) są nieaktualne; poniżej bieżące.

| Miejsce | Co losuje | Stan przed | Stan po |
|---|---|---|---|
| main.ts:41203 `resolveClusterCityStateWarOnPlayer(..., Math.random)` | wypowiedzenia wojny klastra państw-miast (zmienia stan wojny) | nieseedowane | `gameStreamRng(_gameSeed, turn, 'cs-war-cluster')` |
| main.ts:44469 `runScoutsAutoExplore(..., Math.random, ...)` | auto-zwiad zwiadowców gracza (pozycje, mgła) | nieseedowane | `gameStreamRng(_gameSeed, turn, 'scout-auto-explore', humanOwnerId)` |
| main.ts:32550 `pickVillageReward(Math.random(), ...)` | rodzaj nagrody z wioski | nieseedowane | strumień per (tura, q, r, owner) |
| main.ts:32514 `villageGoldAmount(era)` (domyślny rand = Math.random) | ilość złota z wioski | nieseedowane | strumień per (tura, q, r, owner) |
| main.ts:42362 i :42385 `rollAiCsAccept('trybut'|'wasal', ...)` (bez rng = Math.random) | akceptacja trybutu/wasalstwa przez AI-państwo-miasto | nieseedowane | `gameStreamRng(_gameSeed, turn, 'cs-accept:<akcja>', ownerId)` |
| villageRewards.ts:133 `villageGoldAmount(era, rand = Math.random)` | domyślny rng | nieseedowane | domyślny = deterministyczny mulberry32 (stałe ziarno); ścieżka tury podaje własny |
| main.ts ID: `prod_`, `diffbonus_`, `siege-engine-`, `wioska_`, `rec_`, `barb_`, `barbcity_`, `hotseat5_testunit_` (8 miejsc) | sufiks ID `Math.random().toString(36)` | nieseedowane (wpływ tylko przy remisach sortowania po id) | `detIdSuffix(salt)` = hash(ziarno, tura, salt, licznik w przebiegu), unikalne w przebiegu |
| main.ts:2005 `SEED` (start) | ziarno gry | losowe | `civTestSeedOverride(location.search) ?? Math.random` (hak tylko z ?civTest=1; zwykła gra bez zmian) |
| main.ts ~46561 (hak playtest) | ziarno mapy | tylko mapa (`civSeed`) | ustawia też `_gameSeed` (ziarno gry = ziarno mapy w tym haku) |
| main.ts:45744 `newSeed` (nowa gra) | ziarno nowej gry | losowe | BEZ ZMIAN (rozkład losowości gracza zachowany) |

Nowy moduł: gra/src/game/game-rng.ts (mulberry32, hashStr FNV-1a, mixSeed, gameStreamRng, gameIdSuffix). Czysty, bez DOM.

Zapis/wczyt gry: format zapisu NIE zmieniony (pole `seed` w zapisie już istniało; ID pozostają stringami). Brak migracji. Stare zapisy wczytują się jak dotąd; ich dalszy przebieg jest deterministyczny od zapisanego ziarna dla tur, których dotyczą nowe strumienie.

Pozostałe `Math.random` w gra/src/game/** (świadomie NIE zmienione, patrz §3): city-founding.ts:63,90 (ai.ts:3215 podaje rand = aiFoundingRand), city-state-difficulty.ts:120,146, scout-auto-explore.ts:211,263 (main podaje rng), ai-cs-absorption.ts:285 (default; main już podaje), combat.ts:890, siege.ts:659, auto-battle-power.ts:156.

## 2. Pomiar (narzędzie istniejące: gra/tools/measure-ai-trade-offer-frequency.cjs, bez zmian; MEAS_ARM=prepared, MEAS_REL=20, MEAS_TURNS=30)
Surowe JSON: dyspozycje/autobot/runs/R-WEB-DETERMINISM-GAME-RNG-Q1/evidence/*.json. Porównanie: perTurn + offerLog + pairs + tableEnd + relTotalLast (hash sha256, 12 znaków).

| Przebieg | Ziarno | Tryb | turnsRun | oferty (tura:para) | hash | consoleErrors |
|---|---|---|---|---|---|---|
| fast-1 | 2222 | przyspieszony | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| fast-2 | 2222 | przyspieszony | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| fast-3 | 2222 | przyspieszony | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| fast-4 | 2222 | przyspieszony | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| fast-5 | 2222 | przyspieszony | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| fast-6 | 2222 | przyspieszony | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| normal-1 | 2222 | normalny | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| normal-2 | 2222 | normalny | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| normal-3 | 2222 | normalny | 30 | 25:sol->glina | 8da3e7f6d584 | 0 |
| fast-1 | 1717 | przyspieszony | 30 | brak | ce32c5a5bd03 | 0 |
| fast-2 | 1717 | przyspieszony | 30 | brak | ce32c5a5bd03 | 0 |
| fast-3 | 1717 | przyspieszony | 30 | brak | ce32c5a5bd03 | 0 |

Wynik: 6/6 identycznych (fast, 2222), 3/3 identycznych (normal, 2222), 3/3 identycznych (fast, 1717, drugie ziarno). Różne ziarna dają inny hash (2222 vs 1717).

Porównanie z audytem (baseline, bez naprawy, 6 przebiegów fast 2222): 3/6 rozbieżne od t25 (sól->glina t25 vs drewno->glina t26). Po naprawie 0/6 rozbieżnych.

Ograniczenia pomiaru (NIE_ZMIERZONO / jawnie):
- Skrót stanu jest częściowy: perTurn ma tylko cities, pending, deals, table, rejCd, relTotalAi, relAtDecision. BRAK liczby jednostek, skarbca i zasobów (wymóg z audytu). Hash porównuje te pola, nie pełny stan. Runnera nie rozszerzano.
- Tylko 30 tur; brak pomiaru dłuższych przebiegów.
- Pomiar na poziomie przebiegu z mutacją (przywrócenie Math.random w jednym miejscu i powtórka pomiaru) NIE wykonany (budżet). Mutacja na poziomie źródła wykonana (§3).

## 3. Test: gra/tools/determinism-same-seed-test.cjs (NOWY)
- A (generator): ten sam (ziarno, tura, salt) => ten sam ciąg; inna tura/salt/ziarno => inny; wartości w [0,1); 500 sufiksów ID unikalnych. 7/7 PASS.
- B (reguła źródła): brak nieuzasadnionego Math.random w gra/src/game/**; jawna lista 8 wyjątków z uzasadnieniem; wyjątek bez trafienia = FAIL. PASS (B1, B2).
- C (main.ts): dozwolone wyłącznie 2 wystąpienia (SEED startowe i newSeed). PASS.
- MUTACJA: w main.ts przywrócono `Math.random` w miejscu scout-auto-explore => `FAIL C1 ... NIEDOZWOLONE: 44474 Math.random,`, exit=1. Plik przywrócony (cmp OK).

Lista wszystkich wystąpień Math.random w gra/src/game/** (plik:linia, wpływ na stan):
- city-founding.ts:63 (parametr domyślny rand): wpływ TAK, gdy wołający nie podaje rand; ai.ts:3215 podaje rand; inne wołania NIE_ZMIERZONO.
- city-founding.ts:90 (opts?.rand ?? Math.random): jw.
- city-state-difficulty.ts:120 i :146 (domyślny rng): main podaje gameStreamRng; :146 bez wołających w kodzie.
- scout-auto-explore.ts:211 i :263 (domyślny rng): main podaje rng; domyślny tylko dla testów.
- ai-cs-absorption.ts:285 (rollAiCsAccept, domyślny): main podaje gameStreamRng (naprawione w tym temacie).
- combat.ts:890 (opts.rng ?? Math.random): wpływ na stan możliwy; NIE_ZMIERZONO wołających w turze.
- siege.ts:659 (opts.rng ?? Math.random): wpływ możliwy; NIE_ZMIERZONO wołających.
- auto-battle-power.ts:156 (input.rng ?? Math.random): WPŁYW NA STAN TAK. resolveAutoBattleByPower wołane z main.ts (6 miejsc) i z battle/mapFieldBattle.ts:476 BEZ rng. NIE naprawione (poza allowlistą dispatchu). KANDYDAT do osobnego tematu, wysoki priorytet dla pełnego determinizmu walk automatycznych.
Komentarze z Math.random (ai.ts, barbarians.ts, diplomacy-economy.ts, turn-economy.ts, road-network-plan.ts, auto-improvements.ts, inca-llama-seed.ts) są pomijane przez test.
W main.ts po zmianach zostały 2 wystąpienia kodu (SEED startowe i newSeed przy nowej grze).

## 4. Testy regresji
- `npx tsc --noEmit` (w gra/): exit 0 po wszystkich zmianach.
- logic-test: LOGIC OK (213/213), exit 0.
- tech-tree-test: 20 pass, 0 fail, exit 0.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, exit 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- combat-test: COMBAT TEST: 6/6 pass, exit 0.
- Asercje zależne od losowości: NIE osłabiano (nie zmieniano żadnej asercji ani istniejącego testu). Pełnego zestawu tools/*.cjs nie uruchomiono (NIE_ZMIERZONO).

## 5. Zmiany (git diff --name-only ed95085a2)
- gra/src/main.ts (tylko miejsca z §1, import, hak playtest)
- gra/src/game/villageRewards.ts (domyślny rng deterministyczny, import mulberry32)
- gra/src/game/game-rng.ts (NOWY)
- gra/tools/determinism-same-seed-test.cjs (NOWY)
- dyspozycje/autobot/runs/R-WEB-DETERMINISM-GAME-RNG-Q1/** (raport + evidence/*.json)
Nie zmieniano: civ-test-hooks.ts (podanie ziarna przez istniejące civTestSeedOverride), ai.ts, diplomacy*.ts, WERSJE.md, gra-robocza/, rust-port/, JSON balansu. Commit przez `git add <ścieżki>`, nie `-A`.

## 6. UWAGI-DLA-ORKIESTRATORA
1. auto-battle-power.ts:156: walki automatyczne (resolveAutoBattleByPower) nadal na Math.random przy wywołaniach z main.ts. Nie wpływa na pomiar 30-turowy (skrót nie obejmuje walk), ale łamie cel „pełny determinizm”. Osobny temat.
2. combat.ts:890 i siege.ts:659: domyślne rng walki; wołający NIE_ZMIERZONO.
3. ai.ts:3215 (aiFoundingRand): poza allowlistą, nie zmieniano; NIE zweryfikowano, czy jest deterministyczny.
4. Skrót stanu w runnerze nie zawiera jednostek/skarbca/zasobów (wymóg Evaluatora z audytu niespełniony w pełni).
5. Hak ?civTest=1 ustawia teraz ziarno gry (nie tylko mapy). Zwykła gra bez haka: bez zmian.

## RUNDY
1/5 (pierwsza runda Operatora; brak FAIL).

## NASTĘPNY KROK
Evaluator (SONNET): zweryfikować diff (miejsca main.ts, villageRewards.ts, game-rng.ts), wyniki z evidence/*.json, mutację C1 i decyzję o pozostawieniu auto-battle-power/combat/siege jako osobnych tematów (UWAGI 1–2).

DEPLOY/PUSH: NIE WYKONANO
