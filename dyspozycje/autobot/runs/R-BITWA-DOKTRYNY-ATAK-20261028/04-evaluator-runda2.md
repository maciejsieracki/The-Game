# AutoBot Evaluator — Atak/Obrona/Szturm: marsz wielojednostkowy

STATUS: OBJECTION — test usuwa stub BFS, ale nadal nie dowodzi wyboru celu przez produkcyjną ścieżkę Szturmu.
TEMAT: R-BITWA-DOKTRYNY-ATAK-20261028
RUNDA: 2/5
CHECKOUT: `/workspace/all-topics-candidate`
BRANCH: `integration/robocza-all-topics-20261027`

## Niezależna weryfikacja

- `node gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **11/11 PASS**.
- `node gra/tools/battle-formation-rules-test.cjs` — **PASS**.
- `npm run typecheck -- --pretty false` z `gra/` — **PASS**.
- `git diff --check -- gra/src/battle/battleScene.ts gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **PASS**.

Test nie podmienia już `_firstStepAlongPathToAttack`: `_bestChargeStepKey` uruchamia obecny BFS, więc zarzut z rundy 1 o stubowanym algorytmie trasy został usunięty. Produkcyjny diff `battleScene.ts` pozostaje zastanym, niepowiązanym diffem checkoutu; nie przypisuję go tej rundzie.

## Ocena kryteriów

- **Atak — wykazane w ograniczonym fixture:** piechota przesuwa się naprzód; łucznik czeka za zajętym polem, nie robi bocznego obejścia ani nie wyprzedza; w kolejnym planowaniu wchodzi na zwolnione pole i pozostaje w tym samym pasie.
- **Obrona — wykazane w ograniczonym fixture:** obrońca trzyma pozycję przy odległym przeciwniku.
- **Szturm — częściowy dowód, kryterium celu niezaliczone:** `_nearestEnemy` zwraca dwa różne cele w tym fixture, a produkcyjny `_bestChargeStepKey` wraz z BFS zwraca kroki `2,2` i `9,8`. Jednak test jawnie przekazuje wynik `_nearestEnemy` do `_bestChargeStepKey`; produkcyjny ruch Szturmu w `_chargeMoveDest` wybiera cel przez `_pickTargetByPriority`, nie `_nearestEnemy`. Co więcej, `_bestChargeStepKey` przekazuje BFS żadnego celu: `_firstStepAlongPathToAttack(ru)` sprawdza osiągalne pole ataku wobec dowolnego żywego wroga. Zatem asercja kroku nie dowodzi, że produkcyjny planner wybrał ani śledził indywidualny najbliższy cel.
- **Jawne ograniczenia:** fixture opisuje stub `_doMove` jako deterministyczny commit pozycji, a teren/przejście jako dostępne. Test sprawdza planowanie/ruch na modelu sceny; nie sprawdza animacji ani pełnego runtime bitwy. BFS nadal nie dowodzi ogólnej własności dla każdej geometrii i przeszkód.

## Wymagane domknięcie

Aby zaliczyć binarne kryterium Szturmu, test powinien wywołać produkcyjną ścieżkę ruchu/planowania, która wybiera cel (np. `_chargeMoveDest`), oraz fixture/asercje powinny wykazać, że dwie jednostki otrzymują odrębne najbliższe cele i kroki rzeczywiście prowadzące ku nim. Obecny test jest poprawnym ulepszeniem względem rundy 1, lecz nie zamyka tej luki. Wobec tego brak pełnego PASS nie wynika z błędu wykonania testów.

## SHA-256

- `00-dispatch.md`: `362408a320c88ddacba7451e31c427cb97a8d6fc2a2a6b519d2868007b65d897`
- `03-operator-runda2.md`: `a844fd67c1c41712662f9f313aee8348d90ba603713a118248db38d4dbc4ffd8`
- `gra/src/battle/battleScene.ts`: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`: `4b3672437b7e230ebfd356565e79b881e343b70e20089458408238bc70ba1472`
- `gra/tools/battle-formation-rules-test.cjs`: `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b`

NIE WYKONANO: zmian kodu, commitu, integracji, pushu ani deployu.
