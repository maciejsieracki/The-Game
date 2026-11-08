# AutoBot Evaluator — Atak/Obrona/Szturm: marsz wielojednostkowy

STATUS: OBJECTION — kryterium Szturmu nie ma niezależnego dowodu produkcyjnego.
TEMAT: R-BITWA-DOKTRYNY-ATAK-20261028
RUNDA: 1/5
CHECKOUT: `/workspace/all-topics-candidate`
BRANCH: `integration/robocza-all-topics-20261027`
HEAD: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3`

## Niezależna weryfikacja

- `node gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **11/11 PASS**.
- `node gra/tools/battle-formation-rules-test.cjs` — **PASS**.
- `git diff --check -- gra/src/battle/battleScene.ts gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **PASS**.
- Operator nie zmienił kodu produkcyjnego w tym temacie. Obecny diff `battleScene.ts` zawiera zmiany z innego zakresu; nie przypisuję ich temu runowi.

## Ocena kryteriów

- **Atak — wykazane w ramach fixture:** piechota przesuwa się do przodu; łucznik za zajętym polem pozostaje w linii bez bocznego obejścia i wyprzedzania, a po zwolnieniu pola wchodzi na nie w kolejnym kroku.
- **Obrona — wykazane w ograniczonym fixture:** jednostka pozostaje na pozycji, kiedy przeciwnik jest daleko.
- **Szturm — nieudowodnione przez test:** test zastępuje produkcyjną metodę `_firstStepAlongPathToAttack` funkcją, która sama wywołuje `_nearestEnemy`, zapisuje wynik i zwraca krok w jego kierunku. Asercje z osobnymi celami sprawdzają zatem zachowanie stubu, nie rzeczywisty wybór celu ani trasę produkcyjnego planera Szturmu.
- **Jawne ograniczenia:** raport Operatora ujawnia deterministyczny stub `_doMove`, stuby dostępności terenu/przejścia, ręcznie ustawione rangi formacji i stub ścieżki Szturmu. Nie ma dowodu z renderowanej bitwy ani z pełnego scenariusza AI.

## Zastrzeżenie

1. `bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` stubuje `_firstStepAlongPathToAttack` w teście Szturmu (okolice linii 187–200). W produkcyjnym `_firstStepAlongPathToAttack` wyszukuje dowolne pole ataku osiągalne przeciw dowolnemu żywemu wrogowi; nie dostaje wybranego celu. Dlatego przechodzący test nie dowodzi wymaganego kontraktu „każda jednostka Szturmu idzie do swojego najbliższego przeciwnika”. Test powinien uruchomić produkcyjny BFS na fixture z dwoma różnymi najbliższymi celami i sprawdzić wynik planowania/ruchu bez podmiany tej metody (albo zakres powinien jawnie zawęzić twierdzenie do samego `_nearestEnemy`).

To zastrzeżenie nie obala wyników Ataku ani Obrony. Blokuje jednak pełne zaliczenie GOAL, którego kryterium binarne wymaga również dowodu Szturmu.

## SHA-256

- `00-dispatch.md`: `362408a320c88ddacba7451e31c427cb97a8d6fc2a2a6b519d2868007b65d897`
- `01-operator.md`: `2d6c7f19c34dafa0bce1b634eb6ddce42bbf125d8bbd13d58457e5b332406fe9`
- `gra/src/battle/battleScene.ts`: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`: `cdb4c034aa3261f4c8a8c40981117696d242b53cb982a5873287df2cecaa9c7c`
- `gra/tools/battle-formation-rules-test.cjs`: `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b`

NIE WYKONANO: zmian produktu, commitu, integracji, pushu ani deployu.
