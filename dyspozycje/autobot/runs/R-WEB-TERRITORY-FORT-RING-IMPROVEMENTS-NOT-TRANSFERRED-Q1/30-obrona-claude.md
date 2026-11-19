STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1
GOAL: heks z ulepszeniem wlasciciela fortu/posterunku w pierscieniu nie przechodzi pod nowe miasto innej cywilizacji (ABC C 2026-11-19).
ZMIANY/COMMIT: baza 2279300976 (kandydat); commit obrony r2 (SHA w polu sha). Pliki z allowlisty:
- gra/src/map/territory.ts: predykat shieldsHex jest WLASCIWOSCIOWY: (q, r, fortOwnerId) => true tylko gdy ulepszenie na (q,r) nalezy do fortOwnerId. territoryOwnerAt wola predykat z najlepszego fortu.
- gra/src/game/fort-territory.ts: sygnatura improvedAt(q, r, fortOwnerId).
- gra/src/main.ts: PRZYWROCONE do 3e978f882. Produkcja NIE podpina predykatu (patrz BLOKADA 1).
- gra/tools/fort-outpost-hard-territory-test.cjs: PRZYWROCONE do 3e978f882 (pin E1 bez zmian).
- gra/tools/city-founding-no-fort-takeover-test.cjs: blok RF przepisany (RF-1..RF-15d, RF-M1, RF-11..13).
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Regresja (ulepszenie starego miasta Y w pierscieniu fortu X przechodzi do X) usunieta: predykat sprawdza wlasciciela ulepszenia; RF-14 (miasto Y=1, fort X=0) daje 1. Produkcja nie podpina predykatu, wiec regresji w grze nie ma.
2. PRZYJMUJĘ. improvement-build.ts poza allowlista; blokada budowy NIE zrobiona.
3. PRZYJMUJĘ i WYKONANE: mutacja kopii produkcyjnej territory.ts (warunek ochrony -> false): city-founding 43 passed, 5 FAIL. Przywrocone; po przywroceniu 48/0.
4. PRZYJMUJĘ: Chromium NIE ZMIERZONO. Produkcja nie zmienia zachowania (predykat niepodpiety), wiec przed/po byloby identyczne; pomiar bezsensowny do czasu podpiecia.
5. PRZYJMUJĘ jako ograniczenie: produkcja bez shieldsHex -> wpis rejestru i indeks wlasnosci aktywne (brak regresji wydajnosci). Tryb z predykatem nadal wylacza cache; liczby NIE ZMIERZONO.
6. Test dodany (RF-15/15c/15d): fort A (gracz, wczesniejszy) i fort B (AI 2) na sasiednich heksach, miasto AI 1; sporny heks z ulepszeniem A -> 0, lookup >=12 wezlow zgodny z territoryOwnerAt. PASS.
BLOKADY:
1. DECYZJA WLASCICIELA (nie mozna rozstrzygnac w tym temacie): placedImprovements przechowuje tylko klucze ulepszen (PlacedLayers = string[]), bez wlasciciela; zapis w ~13 miejscach main.ts + save/load. Wlasciciel ulepszenia = dzis implicite terytorium (placedImprovementsForOwner), co jest kolem. Bez rejestru wlasciciela (builder owner per hex, z zapisem) regula ABC C nie da sie poprawnie zaimplementowac. Wymaga: zgody na rozszerzenie allowlisty (main.ts, save.ts, improvement-build.ts) albo innej decyzji.
2. Blokada budowy ulepszenia w pierscieniu cudzego fortu (improvement-build.ts) poza allowlista.
3. Chromium NIE ZMIERZONO (patrz pkt 4 odpowiedzi).
4. Zakres: regula dotyczy kazdego miasta czy tylko nowego: NIE ROZSTRZYGNIETE (ZALOZENIE: dziala jak territoryOwnerAt, czyli kazde miasto w zasiegu).
TESTY (surowe wyniki, runda obrony r2):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213), exit 0
- tech-tree-test: 20 pass, 0 fail, exit 0
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
- combat-test: All sanity checks passed, exit 0
- city-founding-no-fort-takeover-test: 48 passed, 0 failed
- fort-outpost-hard-territory-test: 92 passed, 0 failed
- fort-strazniaca-zasieg-zakladania-test: 82 passed, 0 failed
- ai-territory-race-test: WYNIK 29 OK / 0 FAIL
RUNDY: 2/5 (r1 FAIL/BLOCK z zarzutami Evaluatora; r2 ta runda)
NASTEPNY KROK: decyzja orkiestratora/wlasciciela: (a) rozszerzyc allowliste o rejestr wlasciciela ulepszen i blokade budowy, albo (b) zamknac temat jako "predykat gotowy, niepodpiety". Nie wdrazac bez decyzji.
DEPLOY/PUSH: NIE WYKONANO
