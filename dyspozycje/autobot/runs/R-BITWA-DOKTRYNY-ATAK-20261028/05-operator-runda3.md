# AutoBot Operator — Atak/Obrona/Szturm: runda 3/5

TEMAT: `R-BITWA-DOKTRYNY-ATAK-20261028`
STATUS: **LUKA TESTU NAPRAWIONA; GOTOWE DO NIEZALEŻNEJ EWALUACJI**
DATA: 2026-10-28
BAZA: `/workspace/all-topics-candidate`, `integration/robocza-all-topics-20261027`; współdzielony checkout z wcześniejszymi niezatwierdzonymi zmianami.

## Zmiana

Zmieniono wyłącznie `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`. Test Szturmu wywołuje teraz produkcyjne `_pickTargetByPriority()` i `_chargeMoveDest()` zamiast ręcznie podawać cel z `_nearestEnemy()` do `_bestChargeStepKey()`. Scena testowa ma jawnie ustawione domyślne priorytety celów.

Dla dwóch jednostek Szturmu test potwierdza wybór dwóch różnych najbliższych celów, oczekiwany pierwszy krok produkcyjnego `_chargeMoveDest()` oraz ścisłe zmniejszenie odległości do wybranego celu. Fixture pozostawia otwarty teren i deterministyczny BFS; nie dowodzi zachowania przy przeszkodach, animacji ani pełnego runtime.

Nie zmieniono `battleScene.ts`: evaluator nie wskazał jeszcze potwierdzonego defektu produkcyjnej implementacji, tylko brak dowodu w teście.

## Weryfikacja

- `node gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **12/12 PASS**.
- `node gra/tools/battle-formation-rules-test.cjs` — **PASS**.
- `npm run typecheck -- --pretty false` w `gra/` — **PASS**.
- `git diff --check` dla ścieżek zakresu — **PASS**; osobny `git diff --no-index --check /dev/null` dla nowego/nieśledzonego testu — **PASS**.

## Tożsamość i zakres

- `gra/src/battle/battleScene.ts` SHA-256: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8` (bez zmian w tej rundzie).
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` SHA-256: `fa855db232b56ae238ab46078db196077a60f35783c2106f731b083452f57f96`.
- Regresja: nie stwierdzono w dozwolonym zakresie; niezmieniony diff `battleScene.ts` należy do wcześniejszego tematu szyku i nie został przypisany tej rundzie.
- Nie wykonano commit, integracji, pushu ani deployu.

NASTĘPNY KROK: niezależna ewaluacja rundy 3 na tym samym ID.
