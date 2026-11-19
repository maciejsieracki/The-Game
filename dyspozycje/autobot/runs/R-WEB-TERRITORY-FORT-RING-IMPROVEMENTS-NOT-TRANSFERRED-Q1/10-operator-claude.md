STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1
GOAL: heks z ulepszeniem w pierscieniu fortu/posterunku nie przechodzi pod nowe miasto innej cywilizacji (ABC C 2026-11-19).
ZMIANY/COMMIT: baza origin/main 3e978f882; commit zawiera tylko pliki z allowlisty. Zmiany:
- gra/src/map/territory.ts: pole TerritoryNode.shieldsHex; territoryOwnerAt oddaje heks wlascicielowi fortu, gdy heks ma ulepszenie, wygrywa cudze miasto i heks lezy w pierscieniu fortu; nodesEntryFor zwraca null przy shieldsHex (bez cache/indeksu).
- gra/src/game/fort-territory.ts: fortTerritoryNodes(forts, improvedAt?) ustawia shieldsHex.
- gra/src/main.ts: buildAllTerritoryNodes podaje predykat na zywo z placedImprovements.
- testy: city-founding-no-fort-takeover-test (RF-1..RF-13, 41/0); fort-outpost-hard-territory-test: pin E1 poluzowany do 2. argumentu + obecnosci predykatu (92/0). fort-strazniaca bez zmian (82/0).
TESTY: tsc --noEmit exit 0; logic 213/213; tech-tree exit 0; research 33/33; unit-replace exit 0; combat exit 0; city-founding 41/0; fort-outpost-hard-territory 92/0; fort-strazniaca 82/0; ai-territory-race 29 OK / 0 FAIL.
BLOKADY: (1) improvement-build.ts NIE jest w allowliscie: gracz/AI moze nadal POSTAWIC ulepszenie na heksie w pierscieniu cudzego fortu, jesli miasto budujacego go posiada; po budowie heks przechodzi do wlasciciela fortu. Wymaga rozszerzenia allowlisty o improvement-build.ts (blokada budowy). (2) Mutacja: dowod to test kontrolny bez predykatu (RF-M1/RF-8), nie mutacja pliku produkcyjnego. (3) Chromium live NIE ZMIERZONO. (4) Wydajnosc NIE ZMIERZONO: gdy zestaw zawiera fort z predykatem, cache zakresowy (territoryNodesContentId = -1) i indeks wlasnosci sa wylaczone; callerzy traktuja -1 jako brak cache.
RUNDY: 1/5
NASTEPNY KROK: FC; decyzja orkiestratora o allowliscie improvement-build.ts (pkt 1) oraz o zakresie: regula dotyczy kazdego miasta, nie tylko nowo zalozonego (ZALOZENIE; stare miasto x fort tez zmienia wynik na heksie z ulepszeniem).
DEPLOY/PUSH: NIE WYKONANO
