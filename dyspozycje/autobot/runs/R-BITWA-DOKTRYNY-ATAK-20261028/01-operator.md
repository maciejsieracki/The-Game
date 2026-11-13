# AutoBot Operator — Atak/Obrona/Szturm: marsz wielojednostkowy

STATUS: PASS-WITH-NOTES — brak defektu reprodukowanego w sprawdzonym przepływie.
DOMAIN: GAME
TEMAT: R-BITWA-DOKTRYNY-ATAK-20261028
GOAL: W bitwie Atak prowadzi zwartą piechotę do przodu, dystansowi idą za nią bez bocznych obejść i wyprzedzania; Obrona utrzymuje pozycję; Szturm kieruje każdą jednostkę do jej najbliższego przeciwnika.
RUNDA: 1/5
MODEL + EFFORT: GPT-6 Luna Medium

## Checkout i tożsamość

- Checkout: `/workspace/all-topics-candidate`.
- Branch: `integration/robocza-all-topics-20261027`.
- HEAD: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3`.
- `gra/src/battle/battleScene.ts` SHA-256: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`.
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` SHA-256: `cdb4c034aa3261f4c8a8c40981117696d242b53cb982a5873287df2cecaa9c7c`.
- Nie zmieniałem kodu produkcyjnego ani testu.

## Weryfikacja

- `node gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **11/11 PASS**.
- `node gra/tools/battle-formation-rules-test.cjs` — **PASS**.
- `git diff --check -- gra/src/battle/battleScene.ts gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **PASS**.

Fixture uruchamia aktualny `BattleScene` przez jego prototyp. Weryfikuje rzeczywiste ścieżki planowania i kolizji `_beginAutoBatchPhase`, `_executeGroupDoctrineStep`, `_performPlayerOrder`, `_compactAttackAllowsStep`, `_resolveAutoBatchMovement` oraz `_nearestEnemy`.

## Wynik względem GOAL

- **Atak:** piechota wykonuje ruch do przodu. Łucznik na zablokowanym polu pozostaje za piechotą, nie wykonuje bocznego obejścia ani jej nie wyprzedza. Gdy piechota zwolni pole, łucznik przesuwa się w tej samej linii w kolejnym kroku.
- **Obrona:** przy odległym przeciwniku pozostaje w miejscu.
- **Szturm:** dwie jednostki wybierają różne najbliższe cele.
- Całkowitego braku ruchu z raportu właściciela nie odtworzyłem w tym ograniczonym fixture; weryfikacja potwierdza zachowanie tych metod, a nie każdy stan pełnej bitwy.

## Ograniczenia dowodu

- `_doMove` jest deterministycznym stubem zatwierdzającym zmianę heksu; teren/przejście i blokada marszu również są stubowane jako dostępne.
- Dla Szturmu `_firstStepAlongPathToAttack` jest stubowany, aby ujawnić wybrany cel. Test dowodzi wyboru celu, nie rzeczywistego BFS/flankowania ani pełnej trasy.
- Fixture zadaje prawidłowe `formationRank` i offsety ręcznie; przypisanie początkowych rang jest sprawdzane oddzielnie przez test formacji.
- Nie wykonano renderu prawdziwej bitwy w Chromium ani długiego scenariusza AI.

NASTĘPNY KROK: niezależny Evaluator ocenia zakres i ograniczenia dowodu.
DEPLOY/PUSH: NIE WYKONANO.
