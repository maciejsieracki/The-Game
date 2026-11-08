# AutoBot Operator — rozmieszczenie domyślne bitwy, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1
GOAL: Domyślne rozstawienie i reset bitwy wyznaczają wymagane pasy ról przez jeden produkcyjny klasyfikator, który jest bezpośrednio testowany na kategoriach/nazwach rzeczywistych jednostek.
RUNDA: 2/5

## Odpowiedź na zarzut Evaluatora

`initialBattleRoleOf()` nie ma już własnych rozgałęzień dla rodzajów jednostek. Adapter produkcyjnego `BattleUnit` przekazuje `isArmyCommander`, `kategoria`, nazwę jednostki z `stats['Jednostka']`/`nazwa`, `stats['Typ']` oraz istniejący wynik `isPrimaryRanged()` do `classifyInitialBattleRole()` z `formationRules.ts`. Ten eksportowany klasyfikator jest bezpośrednio wywoływany przez test i używany z tą samą funkcją w dwóch ścieżkach BattleScene: początkowym rozmieszczeniu i resecie.

Test używa deskryptorów odpowiadających danym jednostek (Wojownik/miecznik, Oszczepnik, Procarz, Katapulta/Typ=Siege, Jeździec/konnica, Łucznik/lucznik, Wódz/isArmyCommander, Rydwan (woły)/rydwan). Dodano również przypadki nazw z polskimi znakami przy ogólnej kategorii oraz generycznego strzelca. Test nadal sprawdza pasy formacji, 45 piechurów, 500 jednostek konnych, unikalność slotów, fallback skrzydeł i oba podłączenia w BattleScene.

## Tożsamość plików

- Checkout: `/workspace/all-topics-candidate`
- Branch: `integration/robocza-all-topics-20261027`
- Baza/punkt kontroli rundy: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3` plus niezacommitowane zmiany tematu.
- `gra/src/battle/formationRules.ts`: SHA-256 `0cfd3d249af3453c7b900f36c88e67d2c85c7439743b03be6d6e322c35df2f7b`
- `gra/src/battle/battleScene.ts`: SHA-256 `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`
- `gra/tools/battle-formation-rules-test.cjs`: SHA-256 `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b`

## Weryfikacja Operatora

- `node gra/tools/battle-formation-rules-test.cjs`: PASS.
- `node ./node_modules/typescript/bin/tsc --noEmit` z `gra/`: PASS.
- `node ./node_modules/vite/bin/vite.js build --outDir /tmp/battle-formation-r2-operator-dist --emptyOutDir` z `gra/`: PASS; 916 modułów.
- `git diff --check` dla trzech plików allowlisty: PASS.
- Doktryny Atak/Obrona/Szturm nie były edytowane.

## Ograniczenia

Nie wykonano renderu rzeczywistej bitwy w Chromium. Test bezpośrednio pokrywa produkcyjny klasyfikator oraz planowanie pozycji, a statyczne asercje wiążą go z adapterem `BattleUnit` i obiema ścieżkami sceny; nie zastępuje to wizualnego playtestu.

DEPLOY/PUSH: NIE WYKONANO.
NASTĘPNY KROK: niezależny Evaluator rundy 2.
