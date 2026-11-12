STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-MACHINES-ONLY-TECH-AVAILABLE-VISIBLE-Q1
GOAL: w panelu oblężenia widoczne wyłącznie machiny dostępne wg technologii (niedostępne nieobecne w DOM); bez machin szturm obwarowanego miasta niemożliwy (zostaje oblężenie).
ZMIANY/COMMIT: baza origin/main dee73a067. Zmienione: gra/src/game/city-fortification.ts (stormBlockedWithoutMachines + STORM_NEEDS_SIEGE_MACHINES_MSG, tylko odczyt warunku R1), gra/src/ui/siegeMapPanel.ts (akcja isStormBlocked, przycisk Szturm disabled + komunikat), gra/src/main.ts (playerStormBlockedWithoutMachines, bramka w launchSiegeStormFromMap PRZED preBattle, podpięcie isStormBlocked), nowy gra/tools/siege-storm-needs-machines-test.cjs. Brak zmian danych balansu, kosztów, progu 10 jednostek, WERSJE.md. SHA: patrz pole sha zwrotu.
TESTY (surowe wyjście):
- siege-storm-needs-machines-test.cjs --vite (Chromium + Vite HTTP, prawdziwy siegeMapPanel.ts): 24 PASS / 0 FAIL. Mutacja źródła (usunięcie `&& !stormBlockedNoMachines`) -> 22 PASS / 2 FAIL (czerwieni); mutacje wewnętrzne (lista bez filtra techu, brak bramki szturmu) wykrywane.
- tsc --noEmit: 0 błędów.
- Bramki: logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- Powiązane: siege-engines-built-during-siege 33/0; siege-tower-breach-everywhere 47/0; recruit-reset-close-and-siege-visibility 11/0; siege-ai 17/0; siege-defenders 12/0; siege-blockade-no-recruit-reinforce 57/0; map-siege 6/0; unit-replace-full-cost 40/0.
- city-siege-wall-rules-test: 46 OK / 4 FAIL — IDENTYCZNIE na czystym origin/main (dług wcześniejszy, nie spowodowany zmianą): "konstruktor wallDefenseTotalProc z builtBuildingIds (palisada w P)" oraz "R1 okablowanie — szturm gracza: puste obwarowane miasto bez machin nie pada" (+ ich mutacje). Do osobnego tematu (test szuka tekstu okablowania, którego już nie ma w main.ts).
POMIARY (DODATEK 2):
0. Widoczność machin: JUŻ wdrożona w origin/main (visibleSiegeEngineOptions w main.ts getSiegeEngineOptions + blok [data-siege-engine-build] usuwany przy 0 opcji; temat R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1). Tu dodano test prawdziwego DOM per zestaw technologii (start: zero; Obróbka drewna: tylko Taran; +Brązownictwo: Taran/Taran okuty/Wieża; Katapulta dopiero ze Sztuką wojenną).
1. Czy armia bez machin zdobywa ufortyfikowane miasto? ZDOBYCIE: NIE — silnik stosuje R1 (canCaptureCity + autoStormBreach(hasMachine)) w finishSiegeStormFromMap/captureCityWithoutBattle/fortifiedCityCaptureBlocked, także dla pustego miasta i AUTO. LUKA UI/gracza: przycisk Szturm i launchSiegeStormFromMap otwierały preBattle/bitwę (obrońcy ginęli, miasto nie padało, komunikat dopiero po bitwie).
2. Naprawa: bramka przed bitwą (panel: przycisk disabled + "Potrzebne machiny oblężnicze — pozostaje oblężenie"; launchSiegeStormFromMap: ten sam komunikat, return przed preBattle). Obejmuje wejście z menu wyboru ataku (cityAttackChoice) i skrót klawiaturowy (guard w launch). Oblężenie głodowe bez zmian. Machiny gotowe w kolejce (peek) liczą się jako obecne.
3. Miasto bez fortyfikacji: bez zmian (stormBlockedWithoutMachines(false,*)=false; launch i tak wymaga city.maMur).
4. AI: executeSilentSiegeStorm już blokuje szturm bez machin (fortifiedCityCaptureBlocked -> startMapSiege). Brak rozjazdu, BEZ zmian w AI.
BLOKADY: brak. Uwaga: zrzuty w /tmp/claude-0/w18-shots (nieskomitowane) zrobione tuż po animacji wejścia panelu (przyciemnione) — dowód to asercje DOM; zrzut do ponownego wykonania przez Evaluatora z opóźnieniem >300 ms. Nie wykonano pełnego przebiegu gry w Chromium (bramka testowana na realnym panelu przez Vite + wstrzyknięty kontekst, nie na świecie gry); decyzja co do dalszej weryfikacji: Evaluator.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (opcjonalnie live-run gry: szturm z armią bez machin na miasto z murem, zrzut panelu po 400 ms).
DEPLOY/PUSH: NIE WYKONANO
