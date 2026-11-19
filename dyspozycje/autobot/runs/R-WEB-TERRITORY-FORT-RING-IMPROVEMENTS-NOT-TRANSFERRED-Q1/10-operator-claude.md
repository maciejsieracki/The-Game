STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1
GOAL: heks z ulepszeniem wlasciciela fortu w pierscieniu nie przechodzi pod nowe miasto innej cywilizacji (ABC C, 2026-11-19); runda 2, wariant (a) z DODATKU: rejestr wlasciciela ulepszen + podpiecie predykatu w main.ts + blokada budowy.
ZMIANY/COMMIT: baza 495682128 (runda 1 po Obronie). Commit: SHA w polu sha (raport 10-operator-claude.md). Pliki:
- gra/src/main.ts: rejestr `improvementOwnerByHex` (klucz "q,r" -> ownerId); helpery `setPlacedLayersOwned` / `deletePlacedLayersOwned` / `clearPlacedLayersOwned` zamiast 19 surowych zapisow placedImprovements (set/delete/clear); predykat `improvedByFortOwner` (true tylko gdy ulepszenie nalezy do wlasciciela fortu); `fortRingHasImprovement` (predykat podpinany TYLKO do fortu z ulepszeniem w pierscieniu, inaczej cache zakresowy zostaje); zapis meta.improvementOwners; wczytanie: rejestr z zapisu, dla starych zapisow fallback = territoryOwnerAt na biezacych wezlach (przyblizenie, OGRANICZENIE), bez NaN/undefined.
- gra/src/game/fort-territory.ts: fortTerritoryNodes(forts, shieldFor?) - fabryka predykatu per fort (typ TerritoryNodeShield).
- gra/src/map/improvement-build.ts: qualifies() (wspolna bramka gracz/AI/autopilot): heks w pierscieniu CUDZEGO fortu/posterunku przyjmuje ulepszenie tylko gdy territoryOwnerAt(heks) === budujacy.
- gra/tools/city-founding-no-fort-takeover-test.cjs: wywolania predykatu przepisane na fabryke (`() => pred`); nowe RF-16 (granica r=5), RF-16b, RF-17 (ulepszenie starego miasta zostaje przy miescie), RF-18a/b/c (straznik main.ts: zapis meta, podpiecie per fort, 3 surowe zapisy tylko w helperach).
- gra/tools/fort-outpost-hard-territory-test.cjs: PIN E1 zmieniony z `fortTerritoryNodes(fortNodes)` na `fortTerritoryNodes(fortNodes, ...)` (regex `fortTerritoryNodes\(\s*fortNodes\s*,`). Zmiana sygnatury, zachowanie bez zmian dla fortow bez ulepszen.
- territory.ts: BEZ zmian (predykat z r1 zostaje).
TESTY (surowe wyniki):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed
- city-founding-no-fort-takeover-test: 54 passed, 0 failed
- mutacja kopii territory.ts (warunek ochrony -> false): 48 passed, 6 failed (CZERWONE); po przywroceniu 54/0; git diff territory.ts pusty
- fort-outpost-hard-territory-test: 92 passed, 0 failed
- fort-strazniaca-zasieg-zakladania-test: 82 passed, 0 failed
- ai-territory-race-test: WYNIK 29 OK / 0 FAIL
PERF (mikro-benchmark, esbuild + node, 400000 lookupow, 36 wezlow, poza repo): A bez predykatu (indeks zakresowy) 8.3 ms; B z predykatem fortu z ulepszeniem (bez indeksu) 236.9 ms (~28x wolniej, TYLKO gdy fort ma ulepszenie w pierscieniu). Budowa 2000 list wezlow: A 4.2 ms, B 1.1 ms. Wplyw na gre w realnej rozgrywce: NIE ZMIERZONO.
CHROMIUM (pkt 6 DODATKU): NIE ZMIERZONO - nie przeprowadzono scenariusza fort+stadnina+miasto AI w zywej przegladarce w tej rundzie.
BLOKADY/OGRANICZENIA:
1. Stare zapisy: wlasciciel ulepszenia = territoryOwnerAt w chwili wczytania (przyblizenie); nie zweryfikowane na zapisie.
2. Zapis/wczytanie rejestru: tylko przez straznik tekstowy i kod; NIE ZMIERZONO round-trip realnym zapisem.
3. Blokada budowy dziala w qualifies(); applyBuildRequest (main.ts) nie powtarza qualifies() - sciezka wywolania bez bramki UI NIE zweryfikowana.
4. Ulepszenie budowane na pustym heksie przypisuje wlasciciela budujacego; kolejne warstwy na tym heksie zachowuja pierwszego wlasciciela.
5. Demo-seed (demoKeysForHex) i testowe helpery (tartak/stadnina) ustawiaja wlasciciela 0 lub brak wpisu - brak wpisu = brak ochrony (zachowanie jak dotad).
RUNDY: 2/5 (r1 FC BLOCK -> r2 ta runda)
NASTEPNY KROK: FC rundy 2: sprawdzic zywy zapis/wczytanie, sciezke applyBuildRequest i pomiar Chromium (pkt 6); decyzja wlasciciela o ograniczeniu starych zapisow.
UWAGI-DLA-ORKIESTRATORA: brak nowych sesji/zadan (zakaz przestrzegany). Dependencje zainstalowane w gra/node_modules (npm ci --ignore-scripts, poza commitem; katalog ignorowany).
DEPLOY/PUSH: NIE WYKONANO
