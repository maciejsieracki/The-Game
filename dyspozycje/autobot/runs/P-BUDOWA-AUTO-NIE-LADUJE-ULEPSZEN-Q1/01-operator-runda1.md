STATUS: PASS
DOMAIN: GAME
TEMAT: P-BUDOWA-AUTO-NIE-LADUJE-ULEPSZEN-Q1
GOAL: Auto-budowa laduje ulepszenia budynkow do kolejki, gdy pula nowych budynkow
wyczerpana, priorytet dwupoziomowy (nowe budynki najpierw, ulepszenia jako fallback).

DIAGNOZA (zywa symulacja, PRZED naprawa, dane realne z data/buildings.json, miasto
epoka 2, wszystkie budynki epoki 1 zbudowane, pula nowych pusta):
`buildableProduction()` wyklucza z kandydatow KAZDY budynek juz w `builtBuildingIds`
(`buildingTypeCommitted`) — poprawne dla nowych budynkow, ale oznacza ze "Ulepsz"
(przycisk manualny w cityPanel.ts: ten sam `id`, wyzszy `targetLevel` wg maksPoziom/
buildingLevelForEpoch) NIGDY nie trafia do `candidates`. Wszystkie TRZY tryby
(priorytet/lista/zrownowazone) czytaja ta sama tablice `candidates` w
`pickAutoBuildItem` -> `pickAutoBuildItem` zwracal `null` w KAZDYM z trzech trybow
mimo dostepnych "Ulepsz". Jedna wspolna wada, nie trzy osobne (hipotezy dispatchu
a/b/c z dyspozycji dotyczyly innego mechanizmu — lancucha `upgradeFrom` z innym
`id`, ktory JUZ jest normalnym kandydatem w `buildableProduction` i nie jest dotkniety;
realny problem z ekranu wlasciciela to poziomowe "Ulepsz" tego samego budynku).

ZMIANY/COMMIT: gra/src/game/auto-manage.ts (import buildingLevelForEpoch/
buildingProductionItem/buildingTypeQueued z production.ts; nowa funkcja
buildUpgradeCandidates — mirror logiki cityPanel.ts "Ulepsz"; nowa funkcja
pickForTryb — wspolna selekcja dla obu poziomow puli; pickAutoBuildItem: poziom 1
= dotychczasowe candidates, poziom 2 fallback = buildUpgradeCandidates gdy poziom 1
nie da wyniku, we WSZYSTKICH trzech trybach; tryb 'lista' bez zadnego dopasowania w
obu pulach spada dodatkowo na bestCandidateForFocus('zrownowazone') zamiast
bezczynnosci). gra/tools/auto-manage-ulepszenia-fallback-test.cjs (nowa bramka,
11/11, PRZED/PO na realnych danych buildings.json, wszystkie 3 tryby + regresja
listy z dopasowaniem + reczny + front niepusty + brak kandydatow). Commit: patrz
`git log -1` na tej galezi.

TESTY: node ./node_modules/typescript/bin/tsc --noEmit -> 0 bledow. logic-test
213/213. tech-tree-test 19/19. research-test 33/33. unit-replace-test 13/13.
combat-test 6/6 (wszystkie zgodne z wynikiem referencyjnym z R-PROC-AUTOBOT §6).
auto-manage-test.cjs (istniejaca bramka) 45/45 — bez regresji. Nowa bramka
auto-manage-ulepszenia-fallback-test.cjs 11/11 — dowod PRZED (null w 3/3 trybach)
udokumentowany w tym pliku wyzej, dowod PO (enqueue ulepszenia w 3/3 trybach)
w assercjach testu 1-3; test 4 potwierdza ze dopasowanie gracza w licie do NOWEGO
budynku nadal wygrywa nad ulepszeniem (brak regresji sterowania recznego).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Operator -> Evaluator.
DEPLOY/PUSH: NIE WYKONANO
