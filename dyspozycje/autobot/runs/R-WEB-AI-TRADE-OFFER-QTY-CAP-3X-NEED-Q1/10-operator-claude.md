STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-QTY-CAP-3X-NEED-Q1
GOAL: ilość odbioru AI w ofercie handlowej do gracza = min(nadwyżka gracza, 3 × potrzeba AI); stały sufit iteracji w pętli ilości; mnożnik 3 i sufit jako parametry w ai-params.json; uczciwość wyceny, cooldown 15 i limit 1 oferty bez zmian.

BAZA: origin/main 45ded9579 (ROBOCZA 9e372ec7, FALA 738). Dispatch wskazywał kandydata dc9c4db99 (linia dispatchów), ale DODATEK 1 wymaga portu na origin/main, więc kod powstał od 45ded9579. Kandydat r1 9d515ae76 użyty jako źródło zmian w ai-trade-proposal.ts (pełny plik, bo różnica z main to tylko hunk FALI 730).

ZMIANY-COMMIT: commit na gałęzi wip (SHA w polu sha orkiestratora). Allowlista:
- gra/src/game/ai-trade-proposal.ts: receiveMax ograniczone needCapMax = 3 × potrzeba (potrzeba = max(krok, ceil(-netRate)), ta sama miara co dotąd); boundedQtyCandidates(max, krok, sufit) — stała lista ≤64 kandydatów na oś; eksportowane AI_TRADE_RECEIVE_NEED_MULTIPLIER i AI_TRADE_QTY_SEARCH_MAX_CANDIDATES czytane z ai-params.json (fallback 3 / 64); parametry testowe receiveNeedMultiplier / maxSearchCandidates.
- DODATEK PORTU (nowe względem r1): dla każdej ilości odbioru pętla dokłada kandydatów oddania z estymaty ceny PW (probe resolvePayloadPn, ±3 kroki). Powód: stała lista oddania pomijała uczciwe oferty w gęstym zakresie (bez estymaty, przy nadwyżce 1000 i potrzebie 10, pętla zwracała odbiór 10 zamiast 30, bo wymagane oddanie 600 jednostek drewna leżało między kandydatami; z estymatą zwraca 30). Koszt nadal stały na ilość odbioru.
- gra/data/ai-params.json: propozycja_wymiany_surowcow_ilosc_mnoznik_potrzeby = 3; propozycja_wymiany_surowcow_sufit_iteracji = 64.
- gra/tools/ai-trade-oneshot-overpay-limit-test.cjs: tolerancyjny regex (wywołanie ptr(...) przed return) — dług #379 zamknięty (10/10).
- gra/tools/ai-trade-need-from-surplus-test.cjs: asercja A2 zmieniona z „ściśle rosnąco” na „niemalejąco i ≤ 3 × potrzeba (30)”. Powód: stary test kodował semantykę FALI 730 (odbiór = cała nadwyżka), którą decyzja właściciela zastępuje sufitem 3×.
- gra/tools/ai-trade-qty-cap-test.cjs (nowy, 15 asercji): scenariusze A–F z dispatchu (potrzeba 40 / nadwyżka 5000 ⇒ 120; nadwyżka 50 ⇒ 50; bramka; sufit iteracji; liczba wywołań bramki).
- gra/tools/ai-trade-qty-cap-bench.cjs (nowy): pomiar czasu pętli.

TESTY:
- npx tsc --noEmit: EXIT 0, 0 błędów.
- node tools/ai-trade-qty-cap-test.cjs: 15 passed, 0 failed.
- node tools/ai-trade-need-from-surplus-test.cjs: 12 passed, 0 failed (po zmianie A2; przed zmianą A1 było 10/2 z powodu sufitu, A1 teraz zielone: odbiór 30 przy nadwyżce 1000).
- node tools/ai-trade-oneshot-overpay-limit-test.cjs: 10 assertions passed (dług #379 zamknięty).
- node tools/ai-trade-proposal-branch-test.cjs: 10 passed, 0 failed.
- node tools/ai-trade-proposal-to-player-test.cjs: 25 assertions passed.
- node tools/ai-trade-offer-frequency-up-test.cjs: EXIT 0 (skrypt nie drukuje podsumowania).
- ai-trade-wiring-e2e-live-test.cjs (Chromium, bundle vite poza repo przez BUNDLE_DIR): 46 pass, 0 fail.
- Bramki referencyjne (R-PROC-AUTOBOT §Bramki): logic-test PASS 213; tech-tree-test 20/0; research-test 33/0; unit-replace-test EXIT 0 (wszystkie macierze OK, brak liczby w podsumowaniu); combat-test EXIT 0 („All sanity checks passed”); unit-power-test 6/0.
- mgla-sciezka-inwariant-test.cjs: 41 pass / 1 FAIL — jedyny FAIL dotyczy zapisu pozycji w src/game/ai.ts (linie 3742, 3777, 3778, 3825…), którego ten temat nie dotyka; grep na zmienionym ai-trade-proposal.ts nie znajduje zapisów pozycji. NIE ZMIERZONO na czystym main (problem najpewniej istnieje wcześniej; do potwierdzenia przez orkiestratora przed uznaniem za regresję).
- git diff --check: czysto (brak wyjścia).

MUTACJE (cofnięte, po cofnięciu 15/0):
- zdjęcie sufitu 3× (feasibleReceiveMax = receiveMax): ai-trade-qty-cap-test 13 passed, 2 FAIL (czerwono).
- zdjęcie sufitu iteracji (maxSearchCandidates → 1e8): F1 FAIL, wywołań bramki 999950001 (czerwono).

BENCH (ai-trade-qty-cap-bench.cjs, stub cen = surowa ilość):
- Z=20000: 6.5 ms, 4001 wywołań bramki.
- Z=100000: 3.2 ms, 4001 wywołań bramki.
- Koszt jest stały względem zapasu. UWAGA: nie zmierzono „przed” na main w tej rundzie (FALA 730 podawała 763 ms przy 20000 i 2681 ms przy 100000 przy innym układzie pętli); bench używa stubowej wyceny, więc to nie jest pomiar czasu w grze.

POMIAR POMINIĘĆ NA REALNEJ WYCENIE (diplomacyPnSurowiecIlosc + handelFairnessGate + evaluateProposal; drewno→żelazo, rezerwa 30, turns 10):
- potrzeba 10 / nadwyżka 50: brak oferty (uncapped też brak).
- potrzeba 10 / nadwyżka 400: odbiór 30 (= 3×10 sufit; uncapped znajduje 40, cap ogranicza).
- potrzeba 10 / nadwyżka 5000: odbiór 30 (sufit).
- potrzeba 40 / 50: brak; / 400: 40 (zgodne z uncapped); / 5000: 120 (= 3×40).
- potrzeba 100 / 50: brak; / 400: 40 (zgodne z uncapped); / 5000: 300 (= 3×100).
- Wynik: we wszystkich 6 przypadkach z ofertą wyszukiwanie zwraca największą uczciwą ilość w limicie (0 pominięć). Próbka 9 scenariuszy — to nie jest dowód ogólny.

BLOKADY:
- Deploy/push: NIE WYKONANO (zakaz dla operatora).
- docs/encyklopedia i wikiBundle nie regenerowane w tej rundzie (allowlista dopuszcza; zmiana tekstów nie była wymagana przez kryteria). FC decyduje, czy wymaga.
- Dług Rust REPIN (mnożnik 3, sufit 64) — do zaplanowania po wdrożeniu; nie wykonywane.
- mgla-sciezka-inwariant FAIL — patrz wyżej.

RUNDY: 2/5 (r1 FC PASS-WITH-NOTES na kandydacie 9d515ae76, konflikt przy integracji; r2 = port na origin/main + dodatek estymaty oddania).

UWAGI-DLA-ORKIESTRATORA:
- Istnieje ryzyko semantyczne: estymata oddania z probe ceny zakłada prawie liniową wycenę per krok; przy blokach cenowych (10/50/100) może pominąć ofertę dalej niż ±3 kroki. Zmierzone tylko na 9 scenariuszach.
- Do potwierdzenia przez orkiestratora: czy mgla-sciezka-inwariant FAIL (ai.ts) jest już na main (nie sprawdzone na czystym main).
- Gałąź ma node_modules w gra/ (usunięte po commicie, patrz sprzątanie).

NASTĘPNY KROK: Evaluator (SONNET) — sprawdzić SCOPE (allowlista), mutacje, uczciwość (bramka/cooldown/limit 1 bez zmian), pomiar pominięć na realnej bramce i ewentualne zarzuty dot. mgla-inwariant.
DEPLOY/PUSH: NIE WYKONANO
