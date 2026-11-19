# R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1
GOAL: maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja; za flagą domyślnie OFF (parytet).
BAZA: 9e84787f13e50439d5d91c19afe2fc9c4886fa01 (ancestor origin/main: TAK).

ZMIANY-COMMIT: patrz SHA w polu sha odpowiedzi; commit obejmuje wyłącznie allowlistę:
- nowy gra/src/game/diplomacy-war-limit.ts: `TypWojny`, `parseTypWojny` (brak pola/nieznana wartość = 'naturalna'), `loadWarLimitParams`, `countWarsOfType`, `warLimitAllows(typ, attackerWars, defenderWars, params)` (zabronione, gdy atakujący LUB obrońca ma już tyle wojen typu T, ile wynosi maksimum), hak `setWarLimitEnabledForTest`;
- nowy gra/data/diplomacy-war-limit-params.json: `limitWojenAktywny=false`, `maxWojenEpoki=1`, `maxWojenNaturalnych=1`;
- gra/src/game/diplomacy-pn-engine.ts: pole opcjonalne `typWojny?: 'epoki'|'naturalna'` w DiploPairMeta;
- gra/src/main.ts: bramka limitu w pętli wypowiedzeń AI (przed `chargeWarDeclarationCredibility`), tag typu po charge, typ `naturalna` przy wojnie z progu (diploCrisisWarGateBlocked), przy wypowiedzeniu gracza i w charge; kaskada sojuszy `applyAllianceObligationsOnWar(..., typWojny)` odmawia dołączenia sojusznika przy limicie i dziedziczy typ; log konsolowy `[war-limit]` (console.debug); hak `setWarLimitEnabled` w `__diploHarderMeasure` (tylko ?civTest=1); pole `typWojny` w wierszach pomiaru pairs;
- nowy gra/tools/diplomacy-war-concurrency-analyze.cjs (analizator jsonl: rozkład 0/1/2/3+, maksimum, tury z >1 wojną);
- testy: gra/tools/diplomacy-war-limit-unit-test.cjs, gra/tools/diplomacy-war-limit-analyze-test.cjs;
- ten raport.

ODSTĘPSTWO OD DISPATCHU (zgłaszam świadomie): gra/src/game/ai.ts NIE zmieniony. Egzekucja limitu jest w bramce declaration w main.ts, która obejmuje jednym punktem P4 (naturalna), wojny epoki, kryzysowe i kaskadę sojuszy. Skutek: AI nadal proponuje komendę, a bramka ją pomija (bez kary, próba w kolejnej turze). Wpięcie w ai.ts wymagałoby przekazania liczników wojen per partner w DiplomacjaInputs (nie zrobione).

TESTY (wyniki z surowego wyjścia):
- `npx tsc --noEmit -p gra/tsconfig.json`: exit 0, 0 linii błędów (po wszystkich edycjach).
- diplomacy-war-limit-unit-test: pass=29 fail=0.
- Mutacja kopii (`>=` zmienione na `>` w warLimitAllows): 5 FAIL, przywrócone; test czerwony na mutacji.
- diplomacy-war-limit-analyze-test (syntetyczny jsonl): pass=15 fail=0.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass 0 fail; research-test: 33/0; ai-unit-replace-same-rules-test: 45/0; combat-test: 6/6; diplomacy-test: 149 passed 0 failed; diplomacy-alliance-strength-unit-test: 33 OK 0 FAIL; diplomacy-zero-trust-unit-test: PASS=43 FAIL=0 (dispatch podaje 45 — liczba z surowego wyjścia to 43, NIE_ZMIERZONO rozbieżności); ai-ai-alliance-tick-test: suite 19/19, mutants 8/8.
- Flaga OFF = parytet: bramka zwraca true przed jakąkolwiek zmianą decyzji; jedyna zmiana danych to dopisane pole typWojny w meta.

BLOKADY / NIE_ZMIERZONO:
- Bieg dymny ≤40 tur seed 4242 z flagą ON (przeglądarka, hak ?civTest=1): NIE WYKONANO w tej rundzie. Brak zmierzonego raportu maks. równoczesnych wojen z żywego biegu.
- Build vite (bundle poza repo): NIE_ZMIERZONO (tsc przeszedł).
- Barbarzyńcy wykluczani w warTypesForOwner przez isBarbarian — nie pokryte testem jednostkowym (kod w main.ts), tylko przeglądem.
- Sojusznik-gracz w pendingPlayer nie dostaje tagu typu (ścieżka enqueueAllianceWarCall).
- Stare zapisy bez typWojny: traktowane jako 'naturalna' (testowane w parseTypWojny).

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: (a) Evaluator — zweryfikować odstępstwo od ai.ts i pokrycie barbarzyńców; (b) bieg dymny ON seed 4242 ≤40 tur z analizatorem gra/tools/diplomacy-war-concurrency-analyze.cjs.
DEPLOY-PUSH: NIE WYKONANO
