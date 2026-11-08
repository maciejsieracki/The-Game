# AutoBot Operator — Atak/Obrona/Szturm: marsz wielojednostkowy

STATUS: PASS-WITH-NOTES — Szturm ma teraz niezależny dowód z produkcyjnego planera i BFS na fixture z dwoma różnymi najbliższymi celami.
TEMAT: R-BITWA-DOKTRYNY-ATAK-20261028
RUNDA: 2/5
MODEL + EFFORT: GPT-6 Luna Medium

## Zmiana

Zaktualizowałem wyłącznie `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`. Usunąłem stub `_firstStepAlongPathToAttack` z fixture Szturmu. Test używa produkcyjnych `_nearestEnemy` i `_bestChargeStepKey`, który uruchamia rzeczywisty `_firstStepAlongPathToAttack` BFS. Dla dwóch atakujących z różnymi najbliższymi celami sprawdza cele `enemy-a` i `enemy-b` oraz kroki `2,2` i `9,8`.

Kod produkcyjny nie został zmieniony. `battleScene.ts` ma istniejący, niepowiązany diff w checkoutcie; zachowałem go bez edycji.

## Weryfikacja

- `node gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **11/11 PASS**.
- `node gra/tools/battle-formation-rules-test.cjs` — **PASS**.
- `npm run typecheck -- --pretty false` z `gra/` — **PASS**.
- `git diff --check -- gra/src/battle/battleScene.ts gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` — **PASS**.

## Ograniczenia

- Fixture nadal stubuje `_doMove` jako deterministyczne zatwierdzenie ruchu oraz przejście/teren jako dostępne. Szturm w tej rundzie sprawdza planowanie celu i pierwszy krok BFS, nie animację ani pełny runtime bitwy.
- BFS produkcyjnie wyszukuje osiągalne pole ataku przeciw dowolnemu żywemu wrogowi. Ten fixture wykazuje właściwy krok przy zadanym rozmieszczeniu dwóch różnych najbliższych celów; nie dowodzi ogólnej własności, że każda geometria/każda przeszkoda kieruje BFS do wybranego najbliższego celu.
- Test Ataku i Obrony zachowuje zakres i ograniczenia opisane w raporcie rundy 1.

## SHA-256

- `00-dispatch.md`: `362408a320c88ddacba7451e31c427cb97a8d6fc2a2a6b519d2868007b65d897`
- `01-operator.md`: `2d6c7f19c34dafa0bce1b634eb6ddce42bbf125d8bbd13d58457e5b332406fe9`
- `02-evaluator.md`: `8b34a84671c22e8deddbe08f4ee29b60de7ffc275d82cc683de9cca9d2f1c030`
- `gra/src/battle/battleScene.ts`: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`
- `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`: `4b3672437b7e230ebfd356565e79b881e343b70e20089458408238bc70ba1472`
- `gra/tools/battle-formation-rules-test.cjs`: `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b`

NIE WYKONANO: zmian produktu, commitu, integracji, pushu ani deployu.
