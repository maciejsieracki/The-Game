STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-HARDER-RELATIONS-A-NEIGHBOR-TENSION-Q1
GOAL: Twardsza dyplomacja etap 1 (część A): A1 narastające napięcie graniczne, A2 handel nie daje przyjaźni (sufit 50 bez NAP/sojuszu), A3 zazdrość wobec lidera Mocy — wszystko za flagą twardaDyplomacjaAktywna, domyślnie OFF (zachowanie gry bez zmian).
ZMIANY/COMMIT: baza e29f8c8b3 (origin/main). Allowlista: gra/src/game/diplomacy.ts, gra/src/game/diplomacy-factors.ts, gra/src/main.ts (import, leader cache, buildDiplomacyTickCtxForPair, wiersz w getRelationBreakdown, cap wymiany P7), NOWE gra/src/game/diplomacy-harder.ts, gra/data/diplomacy-harder-params.json, gra/tools/diplomacy-harder-unit-test.cjs. SHA: patrz pole sha w odpowiedzi (commit operatora). Brak zmian w diplomacy-credibility.ts, diplomacy-tick-war-brake.ts, diplomacy-tick-params.json.
TESTY:
- tsc --noEmit: 0 błędów (bez wyjścia).
- logic-test: LOGIC OK (213/213).
- research-test: PASSED 33 / FAILED 0.
- ai-unit-replace-same-rules-test: 45 passed, 0 failed (dispatch podawał 21; zaraportowano surowy wynik).
- combat-test: 6/6 pass.
- tech-tree 20: NIE_ZMIERZONO (nie zlokalizowałem pliku bramki o tej nazwie).
- diplo-tick-war-brake-unit-test: 69/0; diplo-tick-war-brake-test: 51/0; diplomacy-test: 149/0; diplo-trust-war-drift-test: 14/0; diplomacy-economy-test: 21/21; diplo-factors-military-row-current-only-test: prod 20/0, mutant fail 12.
- diplo-trust-numbers-test: 22/0 (po zachowaniu literalnej postaci karaWspolnaGranicaDelta w main.ts, której pilnuje regex w teście; test nie był edytowany).
- NOWY diplomacy-harder-unit-test.cjs: PASS 31 / FAIL 0 (A1 progi 0/9/10/25/59/60/500, licznik idempotentny i reset; A2 cap przy 40/50/80 i z NAP; A3 −1/−2/0 dla partnera-gracza, sojusznika, braku lidera; tickDiplomacy flaga OFF handel 60→61, flaga ON 60→60, NAP 60→63, zazdrość −2 w ticku).
- Mutacje kopii modułu (ręcznie, przywrócono plik, potem 31/0): cap A2 usunięty → 3 FAIL; zazdrość bez rozróżnienia przewagi → 1 FAIL; A1 bez granicaMax → 1 FAIL. Każda mutacja czerwona.
- Flaga OFF = zero zmian: pokryte testem computeTickZaufanieDelta (pusty ctx = 0), zmiany ścieżki OFF są gałęziami `if (isHarderDiplomacyEnabled())` / `if (!…) return ctxBazowy` w main.ts. Brak pełnego porównania przed/po na zapisanym stanie gry — NIE_ZMIERZONO.
- (c) Pomiar w żywej grze (seed 4242, 100 tur, flaga OFF vs ON, bieg dymny ≤20 tur, runner/analizator jak ECONMEASURE): NIE_ZMIERZONO. Runnera i analizatora NIE dostarczono w tej rundzie.
- Build/dev: nie uruchamiane (zakaz). npm ci --ignore-scripts wykonany w gra/ (71 pakietów), df / przed startem: 13 GB wolne.
BLOKADY:
- Zapis stanu: licznik A1 (neighborSinceTurn) jest w pamięci modułu, NIE w SaveGame. Po wczytaniu zapisu licznik startuje od nowa (tura pierwszego odczytu). Wymaga decyzji orkiestratora przed włączeniem flagi.
- Pomiar live (c) nie wykonany — bez danych o Zaufaniu par sąsiadów, liczbie wojen i NAP/sojuszy przy ON/OFF.
- Zazdrość (A3) liczona tylko dla par ticków obecnie przeliczanych w pętli gracz↔AI oraz AI↔AI przy aktywnym hamulcu P3; nie zweryfikowano, czy wszystkie ścieżki tickDiplomacy dostają zazdroscDelta (np. ścieżka UI buildRelationBreakdown dostaje wiersz tylko przez getRelationBreakdown).
- Koszt objectivePowerForOwnerEffective po wszystkich właścicielach raz na turę (cache diploHarderLeaderCache) — nie zmierzony.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator: (1) integracja i weryfikacja merge-tree; (2) bieg dymny ≤20 tur ON/OFF (runner do napisania albo wskazanie hooku __aiEconomyMeasure/__truceTestDebug); (3) decyzja ABC o zapisie licznika A1 w SaveGame przed jakimkolwiek włączeniem flagi.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- A2 obcina wyłącznie przyrost handlu (aktywnyHandel +1/turę oraz bonus wymiany P7 w applyDiploP7Bonuses). Dryf Wiarygodności i dobra wola nie są obcinane — przyjęte założenie, bo dispatch mówi o bonusie z handlu.
- Pary AI↔AI dostają karę graniczną tylko przy kryteriach karaWspolnaGranica (>2 miasta obu stron + lądowa granica), tak jak w bazie.
