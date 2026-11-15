STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy/narzędzia; kod gry src/ NIETKNIĘTY)
TEMAT: R-WEB-TEST-DEBT-BASE-RED-FALA741-Q1
GOAL: zielone (albo jawnie sklasyfikowane) znane czerwone testy na origin/main f3adf3443 spoza trwających tematów; klasyfikacja A/B/C/D z dowodem.
BAZA: f3adf3443209b860558c9958b91c60d8b3eb19f6 (detached), gałąź robocza: commit z tym raportem (SHA w polu sha orkiestratora).
ZMIANY-COMMIT: allowlista (gra/tools/*test*.cjs, *live*.cjs wskazanych skryptów; whitelista w mgla-sciezka-inwariant-test.cjs jest wewnątrz tego pliku) + runs/R-WEB-TEST-DEBT-BASE-RED-FALA741-Q1/10-operator-claude.md. Zmodyfikowane: gra/tools/surow-civ-storage-test.cjs, diplomacy-city-cession-r3-test.cjs, mgla-sciezka-inwariant-test.cjs, build-panel-ulepszenia-scroll-real-render-test.cjs, r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs, diplo-truce-live-test.cjs. Brak zmian w gra/src, gra/data, wikiBundle, WERSJE.md, gra-robocza/, rust-port/. Dowody PNG przywrócone (git checkout) po teście live (R-WEB-TRUCE-Q1/evidence/truce-01-*.png).

## Tabela klasyfikacji (przed = f3adf344; po = ten commit)

| Skrypt | Przed | Przyczyna | Klasa | Działanie | Po |
|---|---|---|---|---|---|
| surow-civ-storage-test.cjs (sekcja G) | 64 pass / 4 FAIL (G) | Strażnik tekstowy szuka końca pętli wyrębu markerem `refreshPlayerCityEcon(econ.perCity);`, a kod ma `refreshPlayerCityEcon(econ.perCity, humanOwnerId);` (R-HOTSEAT-ETAP6C) → ciało pętli puste; regex wywołania `creditOwnerResourceStock(cities, ownerId, 'drewno', ...)` nie toleruje wieloliniowego formatowania Prettier. | A | Marker bez zamykającego `);`; regex tolerujący białe znaki (grupa 1 = cap). | 68 pass / 0 FAIL |
| diplomacy-city-cession-r3-test.cjs | 56 pass / 17 FAIL | Asercje oparte na progu rw (aiMiastoPrzekazRwProg), a bramką oddania jest od R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 pozycja siły militarnej (`peacePosMil==='slabsza'`, ai.ts ~7062). Zmęczenie wojną ≥0,8 (tura 16 przy samej długości, war-weariness-params.json) wyprzedza oddanie i żądanie miasta (R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1). Desperacja przegrywającego obniża minimum miast do 2 (R-WEB-AI-WAR-WEARINESS-PEACE-Q1). | A | Scenariusze z jawną siłą militarną (100 vs 200 = slabsza; noSila = pasmo); czas wojny 10 tur (zmęczenie 0,5); żądanie testowane przez `zdobyte>0`; asercje 20-turowe zmienione na obecne zachowanie (pokój bezwarunkowy); N-1 dla 2 miast na wariancie bez desperacji; pure-funkcje progu rw zostały bez zmian. | 75 pass / 0 FAIL |
| mgla-sciezka-inwariant-test.cjs | 41 pass / 1 FAIL ([1]) | Cztery zapisy `.q/.r` w ai.ts (linie 3741, 3776, 3777, 3824) dodane w a95d6589e (R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1) poza inwentaryzacją. Dowód: wszystkie cztery zapisują do KOPII pozycji (`sim` = new Map(units.map(u => ({...u}))), `pos` = new Map z {q,r}), nie do RuntimeUnit gry. | A | Wpisy KLASYFIKACJA „SYMULACJA-KOPIA” z uzasadnieniem i odwołaniem do commita. Skaner [5] (syntetyczny) nadal wykrywa nowe, nieuzasadnione zapisy. | 42 pass / 0 FAIL |
| build-panel-ulepszenia-scroll-real-render-test.cjs (G2b) | NIE ZMIERZONO pełnym biegiem przed zmianą (przyczyna z kodu) | interpolateHudCss zna MAP bez dwóch placeholderów, które hud.ts dołożył do CSS: `${TOOLBAR_TOP_PX}` (hud.ts:743) i `${Z_MAP_CONTROLS}` (hud.ts:820, 922) → G2b `unknown.length===0` czerwone. | A | Odczyt obu stałych z hudLayout.ts (TOOLBAR_TOP_PX=104, Z_MAP_CONTROLS=309) i dopisanie do MAP. | 43 pass / 0 FAIL (real render Chromium) |
| r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs | przebieg przerwany: TypeError w readCorners (`medalOf` na undefined) — asercje nie doszły do końca | Race z bootem gry: po załadowaniu hooka `__postBattleSummaryTestDebug` overlay podsumowania podany zaraz po wczytaniu nie jest w DOM (w 1,5 s później top:30px absolute = 0 elementów; po ustabilizowaniu body — są). Test-only, nie wada produkcyjna (hook wołany wyłącznie z Playwright). | D | Czekanie na stan: `.civ-menu` obecne + liczba dzieci <body> stabilna przez 3 kolejne próbki (co 500 ms), zamiast stałego czasu. | WSZYSTKIE ASERCJE PASS (13 OK + komunikat końcowy, 0 błędów konsoli) |
| diplo-truce-live-test.cjs (Chromium) | 22 pass / 1 FAIL (L2b) | Od #169 DIPLO-TRUCE-IMPL po końcu rozejmu nie ma natychmiastowej wojny: truceEndTickPair (diplomacy-peace-lock.ts) — adresat AI rozstrzyga od razu: zgoda (proponujący ≥20% słabszy, truceEndAiAccepts) = pokój stały, odmowa = wojna. Scenariusz zasiany daje zgodę (status 'pokoj' po wygaśnięciu). | A | L2b: oczekiwany status 'pokoj' (zgoda AI wynikająca z armii), L2c-L2e (brak kary, brak flagi agresora, wyczyszczony truceUntilTurn) bez zmian. | 23 pass / 0 FAIL |
| diplo-truce-r1-test.cjs | 31 pass / 0 FAIL (zmierzone na f3adf344) | — | — | brak zmian | bez zmian (zielony) |
| json-descriptions-sync-test.cjs | 19 pass / 0 FAIL (zmierzone na f3adf344; dispatch podawał 17/2) | — | — | brak zmian | bez zmian (zielony) |

Uwaga do tabeli: dispatch wymieniał diplo-truce-r1 i json-descriptions jako czerwone; na f3adf344 zmierzono je zielone, więc nie zmieniano ich asercji (zakaz osłabiania bez potrzeby).

## Mutacje (dowód czułości asercji)
- surow G: w pętli wyrębu usunięty 5. argument (cap) z `creditOwnerResourceStock` w kopii src/main.ts → `FAIL: main.ts:~21045 ... PRZEKAZUJE 5. argument` (67 pass / 1 FAIL). Plik przywrócony z kopii.
- city-cession: w kopii src/game/ai.ts warunek `peacePosMil === 'slabsza'` zastąpiony `true` → `FAIL: oddanie: brak danych siły (pasmo) → NIE oddaje` (74 pass / 1 FAIL). ai.ts przywrócony z kopii, src/ bez zmian (git status czysty dla src).
- mgla: nie wykonano mutacji skanera osobno; czułość skanera na nowe, nieuzasadnione zapisy pokrywa sekcja [5] (syntetyczne źródło), która przeszła 42/0.
- truce live: NIE ZMIERZONO mutacji (test live, koszt czasu); L2b jest teraz wiązany z konkretną gałęzią (pokój stały), więc mutacja „natychmiastowa wojna przy wygaśnięciu” powinna go czerwienić — nie potwierdzone uruchomieniem.

## Bramki referencyjne (zmierzone po zmianach, worktree z npm ci --ignore-scripts)
- `tsc --noEmit`: exit 0
- logic-test: `LOGIC OK (213/213)`, 0 FAIL
- tech-tree-test: 20 pass / 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: exit 0 (wszystkie sekcje OK, w tym matrix 15 cywilizacji)
- combat-test: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`
- `git diff --check`: czysto

## BLOKADY
- Brak blokad technicznych. Pełny bieg build-panel przed zmianą nie był wykonany (przyczyna zidentyfikowana z kodu, po zmianie 43/0).
- Nie integrowano, nie pushowano, nie deployowano.

## RUNDY
1/5 (ostatni werdykt: brak; to pierwsza runda Operatora)

## UWAGI-DLA-ORKIESTRATORA (kandydaty; decyzje, nie zmieniano logiki gry)
1. DECYZJA ABC (klasa B/decyzja, nie blokuje tego tematu): AI_MIASTO_ZADANIE_TURY_WOJNY = 20 jest praktycznie nieosiągalne. Zmęczenie ≥0,8 (tura 16) wyprzedza żądanie miasta blokiem „pokój bezwarunkowy” (ai.ts ~7050 przed ~7100). Gałąź „tury wojny ≥ 20” żądania jest więc martwa; pozostaje tylko gałąź „zdobyte miasto gracza”. Pytanie do właściciela: czy żądanie miasta po 20 turach ma mieć pierwszeństwo przed pokojem bezwarunkowym, czy zostaje obecna kolejność (wtedy gałąź czasowa do usunięcia/przeformułowania).
2. Test r-bitwa jest teraz zależny od czasu bootu gry; warto rozważyć jawny znacznik gotowości w hooku (osobny temat R-WEB, bez tego tematu).
3. mgla-sciezka-inwariant: 4 nowe wpisy whitelisty (SYMULACJA-KOPIA) — ECHO właściciela wymagany tylko jeśli orkiestrator uzna, że „kopia” nie wystarcza jako dowód.

## NASTĘPNY KROK
Orkiestrator: integracja/ocena tego commita (Evaluator/FC); pozostałe bramki wymienione w dispatchu zielone lokalnie.

DEPLOY/PUSH: NIE WYKONANO
