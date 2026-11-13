STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-SIEGE-WITHOUT-WAR-Q1
GOAL: Oblężenie/szturm miasta tylko w stanie wojny między stronami (AI i gracz); koniec wojny zdejmuje oblężenie, także w starych zapisach.

## Diagnoza (pliki:linie z bazy origin/main 23dd158e9)
(a) REALNE oblężenie bez wojny — przyczyna: brak bramki wojny w ścieżce auto-oblężenia.
- `gra/src/game/mapSiegeDetect.ts:84-95` `detectAutoSiegeOnCity`: kotwicą jest KAŻDA obca jednostka (`u.ownerId !== city.ownerId`) przy murze miasta gracza — bez sprawdzenia relacji (karawana, zwiadowca, wojsko w pokoju/NAP/sojuszu).
- `gra/src/main.ts` `scanAutoSiegesAfterAiTurn` (po turze AI) woła ją dla każdego miasta gracza z murem i przez `startMapSiege` ustawia `city.oblegane=true` → czerwona nakładka „OBLĘŻENIE <miasto>" (`refreshSiegeMarkers`/`refreshSiegeHtmlLabels`). To dokładnie obraz ze zgłoszenia (stosy AI wokół Delf, brak wojny).
- `startMapSiege`, `executeSilentSiegeStorm`, `offerCityAttackChoice`, `refreshSiegeMarkers` (obóz = każda obca jednostka obok) — żadna nie sprawdzała wojny.
(b) Nieczyszczony stan: `validateActiveSieges` (main.ts) utrzymywało oblężenie dopóki oblegający stał przy murze, niezależnie od relacji. Czyszczenie przy pokoju istniało tylko dla jednej ścieżki (`cancelSiegesBetweenPeaceOwners`, traktat pokojowy); rozejm/NAP/sojusz/zerowanie wojny (`setDiploRelation(... 'neutralni')`) oblężenia nie zdejmowały. Zapisy: brak migracji.
(c) Wojna AI→gracz faktycznie nie musi istnieć: AI decyzyjnie atakuje tylko przez `aiCanEngageOwner` (ai.ts:534, bramka OK) — błąd jest wyłącznie w warstwie wykrywania/utrzymania oblężenia main.ts. Barbarzyńcy: `getDiploRelation` wymusza status 'wojna' (main.ts ~9095), więc `areEnemyOwners` (main.ts ~11691) obejmuje barbarzyńców, wojny wymuszone i państw-miast (wszystkie = 'wojna').
Pomiar w grze (Chromium, 5 ziaren × 150 tur PRZED/PO): NIE_ZMIERZONO — patrz BLOKADY.

## Poprawka
- NOWY `gra/src/game/diplomacy-siege-war-gate.ts` (czysty, reuse `areEnemyOwners`): `siegeAllowedBetween`, `enemyUnitsAdjacentToCity`, `detectWarAutoSiegeOnCity`, `isSiegeStillValid`.
- `gra/src/main.ts` (tylko oblężenie): bramka w `startMapSiege` (jeden punkt ustanawiania; gracz dostaje komunikat), `scanAutoSiegesAfterAiTurn` (kotwica tylko wróg), `validateActiveSieges` (koniec wojny/pokój/rozejm/NAP/sojusz zdejmuje oblężenie — wołane po każdym ruchu, turze AI, bitwie), `executeSilentSiegeStorm` (bez wojny: brak szturmu, zdjęcie oblężenia), `offerCityAttackChoice`, `refreshSiegeMarkers` (obóz tylko z wrogich jednostek), klik w panel oblężenia (wróg), MIGRACJA wczytania zapisu (`validateActiveSieges()` po odtworzeniu relacji).
- Nie zmieniono: wypowiadanie wojny, kary za granice, ai.ts, combat.ts, barbarians.ts.
- Uwaga allowlisty: predykat umieszczono w nowym pliku `diplomacy-siege-war-gate.ts` (zgodnym ze wzorcem `diplomacy-*.ts`), bo `mapSiegeDetect.ts` nie jest na allowliście.

## TESTY
- Nowy `gra/tools/ai-siege-requires-war-test.cjs`: 42 OK, 0 FAIL (gate-nowy-test.txt, EXIT=0). Pokrywa: brak oblężenia dla neutralni/pokoj/rozejm/nap/sojusz (AI→gracz i odwrotnie), dowód buga (legacy `detectAutoSiegeOnCity` zakłada oblężenie w pokoju), wojna → oblężenie, po pokoju → nieważne, kotwica mieszana, barbarzyńcy (prawdziwy `BARBARIAN_OWNER_ID`), wojna wymuszona/państwo-miasto, własne miasto, strażnik main.ts (8 punktów podpięcia). Mutacja bramki `return true` → 24 asercje padają (mutacja zabita).
- RED przed: na origin/main brak modułu i `grep -c siegeAllowedBetween main.ts` = 0 → strażnik main.ts i test nie przechodzą.
- tsc `--noEmit`: EXIT=0 (gate-tsc.txt).
- Regresje (108–120 plików nielive: siege/oblez/war/peace/diplomacy/capital-capture/forced-war): PRZED 16 FAIL, PO 16 FAIL — identyczny zbiór (stare czerwone: civ-matrix-ai-diplomacy-wiring, diplomacy-audience-close-flush, diplomacy-lista-podglad-przed-wizyta, diplomacy-negotiation-table, diplomacy-package-ai-counter-actionable, diplomacy-proposal, dyplo-warunek-niespelniony-czerwony-tooltip, ekonomia-5x-inwariant, forced-war-bronze-main-guard, forced-war-bronze-new-game-reset, forced-war-waves, hud-moc-warstwa, mgla-sciezka-inwariant, pr141-hotseat-diplomacy-owner, war-allin-capital, war-epoch-player-first-main-guard). Logi: gate-regres-przed.txt / gate-regres-po.txt. Różnica TOTAL (120/118) wynika z plików `.cjs` generowanych w tools/ przez same testy.
- Zaktualizowane testy (uzasadnienie): `oblezenie-remis-endsiege-test.cjs`, `oblezenie-siege-lifted-po-bitwie-test.cjs` — harnessy wycinają `validateActiveSieges` z main.ts i eval-ują z atrapami zależności; dodano atrapy `areEnemyOwners/siegeAllowedBetween/isSiegeStillValid` (strony = wrogowie, testują przyległość) oraz licznik wywołań `validateActiveSieges()` 4→5 (nowe wywołanie: migracja zapisu). Po zmianie: 271/0 i 16/0 (przed nimi PO-bez-poprawki padały na ReferenceError).

## BLOKADY
- Symulacja pełnych gier AI (≥5 ziaren, 150+ tur) PRZED/PO: NIE_ZMIERZONO. Zbudowałem w /dev/shm bundle PRE i POST z hookiem audytu (`__siegeAudit`: start/szturm bez wojny, miasta oblegane bez wojny, sąsiedztwo) i runner Playwright; próba 20 tur × 2 równolegle nie zmieściła się w 580 s (swiftshader, ~dziesiątki s/tura), a procesów w tle nie wolno. Efekt PO jest udowodniony testem na prawdziwych funkcjach i strażnikiem main.ts, nie pomiarem pełnej gry. Do Evaluatora/orkiestratora: ewentualny pomiar live na zewnętrznej maszynie (skrypty: scratchpad siege-prep/run/launch.cjs, nie w repo).
- Weryfikacja wizualna nakładki w przeglądarce: NIE_ZMIERZONO (j.w.).
- Ryzyko: kontynuacja wojskowych stosów AI przy murach w pokoju zostaje wg reguł granic (zgodnie z dispatchem) — teraz bez nakładki i bez oblężenia.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (przejrzeć diff main.ts + test; ewentualnie live-pomiar).
DEPLOY/PUSH: NIE WYKONANO
ZMIANY/COMMIT: patrz SHA poniżej
COMMIT: (uzupełniony po commicie)
