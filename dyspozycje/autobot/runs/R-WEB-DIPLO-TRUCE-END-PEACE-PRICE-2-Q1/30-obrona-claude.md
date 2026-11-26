# R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 — Obrona Operatora (Claude, HAIKU 5.5, runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1
GOAL: poprawić kandydata 0ee8ad4ef wg zarzutów Evaluatora r2 (d5e25225f): okno „po rozejmie" zgodne z dispatchem (waluta wg pasma, akcja tylko 'pokoj', niepokryta oferta idzie dalej evaluateProposal, czyszczenie oferty AI przy pokoju z propozycji gracza), testy mutacyjne na te punkty.
BAZA: 0ee8ad4ef (kandydat r2); poprawki w tym commicie.

## ZMIANY-COMMIT
- gra/src/game/diplomacy-proposals.ts — typ `truceEndWindow` dostaje `currency?: 'surowce' | 'miasto'`. Blok okna: przyjęcie tylko gdy pokryta cena wg waluty (miasto → liczą się WYŁĄCZNIE miasta w giveItems; surowce → wartość pakietu). Niepokryta oferta NIE jest już odrzucana wprost: przechodzi do dotychczasowego evaluateProposal (dispatch r2: „w pozostałych przypadkach evaluateProposal bez zmian").
- gra/src/main.ts — truceEndWindowFor zwraca także `currency: rule.currency`; w ścieżce akceptacji pokoju z tabeli (cywAction === 'pokoj') przed finalizePeaceTreatyBetween: jeśli meta.truceEndOffer != null → clearTruceEndOffer (usuwa wpis w skrzynce i meta). Inne miejsca bez zmian.
- gra/tools/truce-end-window-test.cjs — asercja „niedopłata → odrzucona" zmieniona na „wynik jak bez okna" (koduje stary kontrakt, dispatch r2 dopuszcza); nowe asercje: waluta miasto/surowce, akcja 'rozejm' w oknie = jak bez okna, wiązanie main.ts (źródłowe); M-THR przepisany na kotwicę `: offeredPn >= truceWindow.requiredPn;` (poprzednia kotwica nie istnieje po przebudowie bloku); nowe mutanty M-ACTION (warunek actionId zdjęty) i M-CUR (waluta miasto liczona surowcami).
- Plik runs/.../30-obrona-claude.md (ten raport).

## ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. Dodany test: akcja 'rozejm' w oknie daje wynik identyczny z kontekstem bez okna i brak powodu „pokryta". Mutant M-ACTION (zdjęcie actionId === 'pokoj') wykryty (1 trafienie, test czerwony).
2. PRZYJMUJĘ. Waluta miejska (pasmo >20%) jest egzekwowana: w oknie przyjmowane są tylko miasta w giveItems o wartości >= requiredPn. Test: surowce o wystarczającej wartości przy currency 'miasto' nie są przyjmowane przez okno. Mutant M-CUR wykryty. Uwaga: NIE dodano testu dodatniego z realnym miastem (kształt pozycji miasta w testach nie był zbadany) — NIE ZMIERZONO. Uwaga: gdy w paśmie >20% gracz nie ma cedowalnego miasta, reguła AI-owa (pickTruceEndSettlementPlan) przechodzi na surowce; okno tego fallbacku nie odtwarza — taka oferta idzie dalej evaluateProposal (założenie, do potwierdzenia przez FC).
3. PRZYJMUJĘ (poprawione w main.ts, ścieżka akceptacji pokoju z tabeli). Kod kompiluje się (tsc 0). Zachowanie NIE ZMIERZONO w grze; test źródłowy sprawdza obecność linii czyszczącej.
4. PRZYJMUJĘ częściowo. Dodany test źródłowy (grep na main.ts) dla warunków truceEndWindowFor (ME()/isHuman, truceEndWindowOpen, payerId, requiredPn z aiAiPeacePriceFor, currency) i czyszczenia oferty. Nie jest to test zachowania — pełne okablowanie nadal NIE ZMIERZONO w grze.
5. PRZYJMUJĘ ZARZUT, NIE NAPRAWIONO w tej rundzie — patrz BLOKADY. Ścieżka deklaracji wojny (main.ts, declareWar po pokoju/oknie) jest poza allowlistą rundy 2 (DODATEK r2: tylko diplomacy-proposals.ts i diplomacy-pn-engine.ts + porty rozejmu). Bez zerowania truceEndTurn przy nowej wojnie okno zostaje otwarte w najbliższej turze, a warunek w oknie nie wymaga PEACE_PROPOSAL_MIN_WAR_TURNS. Wymaga decyzji orkiestratora (rozszerzenie allowlisty o miejsce deklaracji wojny i decyzja, czy okno ma respektować bramkę 10 tur wojny).
6. PRZYJMUJĘ (procesowe). Wywołanie spawn_task z r1/r2 odrzucone, bez skutku; w tej rundzie żadnych narzędzi tworzących sesje nie użyto.
7. PRZYJMUJĘ i POPRAWIONO: w oknie niedopłata przechodzi do evaluateProposal bez zmian (zgodnie z dispatchem). Odnotowuję: wynik niedopłaty w oknie może być więc przyjęciem wg zwykłej oceny pokoju, jeśli ta ocena go przepuszcza — to zgodne z brzmieniem dispatchu, ale FC powinien to potwierdzić wobec zasady „cena zrównoważona".

## TESTY (surowe wyniki, ten commit)
- npm ci w gra/ (71 pakietów) — exit 0 (potrzebne do esbuild w testach; node_modules usunięte po bramkach).
- npx tsc --noEmit (gra/) — exit 0.
- truce-end-window-test.cjs — PASS=39 FAIL=0 (mutanty M-OPEN, M-THR, M-ACCEPT, M-SETTURN, M-ACTION, M-CUR wykryte; każda mutacja 1 trafienie).
- truce-end-peace-price-test.cjs — 62 PASS, 0 FAIL (liczba 62, nie 54 z dispatchu; plik nie zmieniony w tej rundzie).
- truce-end-settle-exec-test.cjs — 30 PASS, 0 FAIL.
- truce-end-war-notice-test.cjs — PASS (exit 0).
- diplo-truce-impl-test.cjs — 93 PASS, 0 FAIL.
- war-limit-truce-count-test.cjs — 19 pass / 0 fail.
- diplo-human-peace-no-war-test.cjs — PASS=13 FAIL=0.
- diplo-war-tribute-once-test.cjs — PASS=8 FAIL=0.
- war-rules-multiwar-main-guard-test.cjs — 21 PASS / 0 FAIL.
- ai-test.cjs — 297 passed, 0 failed.
- logic-test.cjs — LOGIC OK (213/213).
- tech-tree-test.cjs — 20 pass, 0 fail.
- research-test.cjs — ALL GREEN.
- combat-test.cjs — All sanity checks passed.
- unit-replace-test.cjs — WSZYSTKIE TESTY ZIELONE (21/21).
- git diff --check — czysto.
- Przeglądarka / live: NIE ZMIERZONO.

## BLOKADY
- ZARZUT 5 (nowa wojna w oknie): wymaga rozszerzenia allowlisty (miejsce deklaracji wojny w main.ts) i decyzji, czy okno respektuje bramkę 10 tur wojny. DECISION_REQUIRED dla orkiestratora — nie rozstrzygam sam; do decyzji przed READY_FOR_DEPLOY.
- Zarzut 3 (wpis w skrzynce po pokoju) i zarzut 2 (brak cedowalnego miasta) — zamknięte w kodzie jak wyżej, z NIE ZMIERZONO w grze.

## RUNDY
2/5 (Operator HAIKU 5.5, obrona). Ostatni werdykt: Evaluator r2 PASS-WITH-NOTES (zarzuty 1–7).

## NASTĘPNY KROK
Final Control r2 (Sonnet): przegląd diffu w 3 plikach (proposals, main, test) + decyzja orkiestratora w sprawie zarzutu 5 (allowlista deklaracji wojny) oraz potwierdzenie założeń: niedopłata w oknie idzie dalej evaluateProposal; okno bez cedowalnego miasta w paśmie >20% nie przyjmuje surowców.

DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
- Brak nowych sesji/tasków: w tej rundzie nie wywoływano spawn_task, create_session ani create_trigger.
- Liczba testu truce-end-peace-price: 62 (dispatch r1 podawał 54) — rozbieżność z r1, nie wyjaśniona przez dispatch.
