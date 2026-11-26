# R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1 — obrona Operatora (runda 2/5, HAIKU 5.5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1 (tag TRUCEPRICE)
GOAL: po wygaśnięciu rozejmu AI składa propozycję pokoju z ceną; pokój po rozejmie nie jest za darmo; odmowa gracza = wojna.
BAZA: d50918ef7e7215a5d4ae25518dd7d7acff307e28 (kandydat; checkout --detach).

## ODPOWIEDZI NA ZARZUTY

1. PRZYJMUJĘ, NAPRAWIONE. Decyzja płatności po rozejmie przeniesiona do czystej funkcji `pickTruceEndSettlementPlan` (gra/src/game/diplomacy-truce-end-price.ts), wołanej przez `settleTruceEndPrice` w main.ts. Test (gra/tools/truce-end-peace-price-test.cjs, część 5) wykonuje tę funkcję na atrapach planów: cena 0/ujemna/NaN, plan niepełny, plan bez pozycji, bilans PW, miasto→surowce. Mutanty M-FREE, M-FULL, M-FALL (część 6) są czerwone. Uwaga: same plany (`peacePlanWithTail`, `aiPeacePaymentAssets`) i przelew (`transferBasketItems`) nadal nie są wykonane w teście (wymagają silnika); to zostaje NIE ZMIERZONO w runtime.
2. PRZYJMUJĘ, NAPRAWIONE. Treść oferty w skrzynce gracza niesie teraz kierunek, walutę i wartość: `truceEndOfferReason` (diplomacy-truce-end-price.ts) → np. „Rozejm wygasł — pokój stały za cenę: Ty płacisz surowcami (złoto, brąz, żelazo, rudy), wartość ok. 50 (odmowa = wojna)”. Wartość z portu `quotePn` (main.ts: `aiAiPeacePriceFor(payee, payer, 'pokoj').requiredPn`). Port jest opcjonalny (stare atrapy działają bez niego). Kwota jest orientacyjna: przy zgodzie cena liczona jest na żywo od sił. Test część 5 (j) sprawdza tekst i wartość z atrapy.
3. PRZYJMUJĘ, NIE NAPRAWIONE W TEJ RUNDZIE (dowód: własne przyznanie z 10-operator-claude.md, BLOKADY pkt 2; stan kodu: `previewNegotiationEntryImpl` w main.ts ~l. 22514 wywołuje ogólne `evaluateProposal` dla `pokoj`, bez gałęzi po rozejmie). Powód braku naprawy: ścieżka propozycji gracza nie wie „po rozejmie” bez ustalenia stanu (`truceInitiatorId` ustawiony + status 'wojna' + brak `truceUntilTurn` i `truceEndOffer` — to moja proponowana definicja, dispatch pozostawia ją do ustalenia), a dodatkowo zaakceptowany pokój z tej ścieżki musiałby też przelać cenę (obecna ścieżka zawierania pokoju od propozycji gracza nie wywołuje płatności). To dwa haki w kodzie, którego nie objęła ta runda. Pozostaje do zrobienia; patrz NASTĘPNY KROK.
4. PRZYJMUJĘ, NAPRAWIONE. Cena ≤ 0 nie wchodzi w ogóle (`pickTruceEndSettlementPlan` zwraca null → wojna). Test (g). Konsekwencja do wiadomości orkiestratora: gdy `relBasedPn ≤ 0` (bramka relacji), pokój po rozejmie kończy się wojną, a nie darmowym pokojem. To jest zgodne z GOAL („brak cichego pokoju za darmo”), ale zmienia zachowanie względem obecnej wyceny i może wymagać potwierdzenia właściciela (ZAŁOŻENIE).
5. PRZYJMUJĘ, NAPRAWIONE WG ZAŁOŻENIA Z DISPATCHU. Dispatch pkt 4 nakazuje najbliższy dozwolony wariant z istniejącego koszyka; wdrożono: przy >20% gdy plan miastem jest niepełny, płatność idzie surowcami (ogon) z tego samego koszyka, o ile pełna (test (i)). Odrzucam poprzednie DECISION_REQUIRED jako sprzeczne z dispatchem. ZAŁOŻENIE do potwierdzenia przez właściciela: wariant zastępczy (surowce zamiast miasta) przy braku cedowalnego miasta.
6. PRZYJMUJĘ. Zgoda gracza jako płatnika (ME() w `aiPeacePaymentAssets`) nie jest przetestowana wykonawczo; testy live w Chromium NIE ZMIERZONO. Brak dowodu w tej rundzie = przyjęty zarzut. Naprawy nie wprowadzono (brak uruchomienia przeglądarki w tej rundzie).

## ZMIANY-COMMIT

Allowlista (wszystkie pliki z allowlisty dispatchu):
- gra/src/game/diplomacy-truce-end-price.ts — `TruceEndPlanLike`, `pickTruceEndSettlementPlan`, `truceEndOfferReason` (czyste).
- gra/src/game/diplomacy-peace-lock.ts — port `quotePn?` (opcjonalny), treść oferty z ceną w `truceEndTickPair`.
- gra/src/main.ts — `settleTruceEndPrice` przepięte na `pickTruceEndSettlementPlan`; port `quotePn` w `truceEndPorts()`. Żadnych zmian poza portami rozejmu.
- gra/tools/truce-end-peace-price-test.cjs — porty atrapy (quotePn), eksport nowych funkcji, zaktualizowane asercje wiringu (płatność), część 5 (g–j), część 6 (M-FREE, M-FULL, M-FALL).
- dyspozycje/autobot/runs/R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1/30-obrona-claude.md — ten raport.

Zmiany asercji w istniejących testach: BRAK (diplo-truce-impl-test.cjs i truce-end-war-notice-test.cjs bez zmian; w tej rundzie nie trzeba było zmieniać ich asercji).

SHA: patrz sekcja SHA w odpowiedzi (commit po zacommitowaniu tych plików).

## TESTY (liczby z surowego wyjścia)

- `./node_modules/.bin/tsc --noEmit` (gra/, npm ci w worktree) → exit 0.
- `node tools/truce-end-peace-price-test.cjs` → Wynik: 54 PASS, 0 FAIL (exit 0).
- `node tools/diplo-truce-impl-test.cjs` → Wynik: 93 PASS, 0 FAIL (exit 0).
- `node tools/truce-end-war-notice-test.cjs` → PASS truce-end-war-notice-test (exit 0).
- `node tools/ai-test.cjs` → ai-test: 297 passed, 0 failed (exit 0).
- `node tools/diplo-human-peace-no-war-test.cjs` → 13 PASS (exit 0).
- `node tools/diplo-war-tribute-once-test.cjs` → 8 PASS (exit 0).
- `node tools/war-rules-multiwar-main-guard-test.cjs` → 21 PASS (exit 0).
- `node tools/diplo-truce-n6-saveload-test.cjs` → 8 PASS; `diplo-truce-r1-test.cjs` → 31 PASS; `diplo-truce-r4-ai-test.cjs` → 24 PASS; `diplo-truce-until-turn-test.cjs` → 15 PASS (exit 0).
- `war-limit-truce-count-test.cjs`, `diplomacy-war-limit-unit-test.cjs` → exit 0 (skrypty nie wypisują linii PASS/OK; ich wynik to kod wyjścia 0).
- NIE ZMIERZONO: testy live (diplo-truce-live, diplo-truce-saveload-live, diplo-truce-ai-table-live), Chromium, zgoda gracza i płatność na żywo w turze, treść oferty w UI.
- Nie uruchomiono bramek logic-test, tech-tree, research, combat, unit-replace (zmiany nie dotykają tych modułów); nie zmierzono ich w tej rundzie.

## BLOKADY

1. Zarzut 3 (ścieżka propozycji pokoju gracza po rozejmie): nieukończone. Wymaga: (a) definicji stanu „po rozejmie” dla propozycji gracza, (b) wpięcia płatności przy zawarciu pokoju z własnej propozycji gracza. Poza zakresem tej rundy.
2. Zarzut 6 (live): NIE ZMIERZONO.
3. Konsekwencja pkt 4 (cena 0 = wojna) i pkt 5 (zastępczy surowcowy wariant) to ZAŁOŻENIA; warto je potwierdzić u właściciela przed merge (zmieniają skutek dla gracza, nie tylko kod).

## NASTĘPNY KROK

Orkiestrator: (1) zdecydować, czy zarzut 3 dopisać jako osobny temat R-WEB-DIPLO-TRUCE-END-PLAYER-PROPOSAL-Q1 (haki w previewNegotiationEntryImpl + płatność przy zawarciu), czy domknąć w tym temacie w kolejnej rundzie; (2) pytanie ABC do właściciela o dwa założenia z pkt 4 i 5 (skutek dla gracza: pokój za 0 nie istnieje; przy braku miasta płatność surowcami); (3) uruchomić testy live po decyzji.

## UWAGI-DLA-ORKIESTRATORA

- `quotePn` w TruceEndPorts jest opcjonalny celowo: stare atrapy w innych testach nie mają tego portu.
- Dispatch wymagał „zmiany ASERCJI tylko dla wprost kodujących stary kontrakt”. Tu żadnej nie zmieniono.
- Plik gra/tools/.truce-end-peace-price-*.cjs (bundle testu) jest generowany i nie wchodzi do commita.

RUNDY: 2/5 (Operator HAIKU 5.5; runda 1 = 10-operator-claude.md)
DEPLOY/PUSH: NIE WYKONANO
