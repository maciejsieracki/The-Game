# AutoBot Evaluator — rozmieszczenie domyślne bitwy, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1
RUNDA: 2/5

## Wynik

Zarzut z rundy 1 został naprawiony: test ładuje dokładny eksportowany `classifyInitialBattleRole()` z `formationRules.ts` i wywołuje go na przypadkach testowych. `initialBattleRoleOf()` w `battleScene.ts` jest adapterem do tego klasyfikatora; obie ścieżki sceny — `_placeUnits()` oraz `_placeUnitsOneSide()` używane przy resecie — korzystają z `initialBattleFormation(..., initialBattleRoleOf)` i `initialBattleSlots()`. Asercje testu wiążą adapter z klasyfikatorem i sprawdzają dwa podłączenia planera oraz ograniczenie awaryjnego rozmieszczenia konnicy do skrzydeł.

Próbki obejmują polskie nazwy i kategorie piechoty/miecznika, oszczepnika, procarza, łucznika, konnicy i rydwanu; machinę przez nazwę `Katapulta` i rzeczywiste `Typ: Siege`; dowódcę przez znacznik `isArmyCommander`. Dodatkowe przypadki sprawdzają diakrytyki w `Łucznik egipski`, `Jeździec konny` i `Wieża oblężnicza`, a także generyczny strzelec. Sprawdziłem dane `units.json` i `categoryOf()` — właściwe nazwy, `Typ: Siege`, polskie kategorie oraz regułę kategorii dowódcy są zgodne ze ścieżką produkcyjną.

Sloty są asertywnie sprawdzane: piechota przód, oszczepnicy drugi rząd, łucznicy trzeci, procarze czwarty, machiny za dystansowymi, dowódca z tyłu; konnica i rydwany są na przeciwnych skrzydłach. Test zatłoczonego składu pokrywa 45 piechurów, 500 jednostek konnych, brak kolizji slotów i brak wpychania konnicy do środkowych rzędów. Istniejące asercje tempa linii Ataku/Obrony, zachowania Szarży oraz pierwszego strzału jednostki dystansowej również przechodzą.

Nie znalazłem zmian w doktrynach Atak/Obrona/Szturm w scoped diff. Nie wykonano wizualnego playtestu w przeglądarce, więc ten raport potwierdza logikę klasyfikacji i planowania slotów, nie wygląd finalnego renderu. Fixture machiny używa pomocniczej kategorii `maszyna`; produkcyjna `categoryOf()` nadaje machinie `obleznicza`, ale test klasyfikuje ją do `siege` przez rzeczywiste `Typ: Siege` i polską nazwę, więc rozpoznanie produkcyjne jest pokryte.

## Niezależna weryfikacja

- `node gra/tools/battle-formation-rules-test.cjs` — PASS.
- `node ./node_modules/typescript/bin/tsc --noEmit` z `gra/` — PASS.
- Bezpośredni `vite build --outDir /tmp/battle-formation-r2-evaluator-dist --emptyOutDir` z `gra/` — PASS, 916 modułów; build skierowany poza repozytorium.
- Scoped `git diff --check` dla trzech plików allowlisty — PASS.
- Punkt kontrolny: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3`.
- SHA-256 zgodne z raportem Operatora:
  - `gra/src/battle/formationRules.ts`: `0cfd3d249af3453c7b900f36c88e67d2c85c7439743b03be6d6e322c35df2f7b`
  - `gra/src/battle/battleScene.ts`: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`
  - `gra/tools/battle-formation-rules-test.cjs`: `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b`

## Bramka

PASS-WITH-NOTES dla zakresu rundy 2. Brak nowych blokerów. Współdzielone drzewo robocze zawiera wiele niepowiązanych zmian; nie edytowałem ich ani nie integrowałem niczego. Brak commit, push i deploy.
