STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (TRUCEPRICE3): cena 0 = symboliczna opłata (10B); okno propozycji gracza przyjmuje surowce przy braku miasta (11A)
GOAL: po końcu rozejmu cena wyliczona na 0 nie oznacza wojny, tylko pokój za symboliczną opłatę (domyślnie 1 Pn z nowego klucza pokojPoRozejmie.minimalnaOplataSymbolicznaPn); w oknie propozycji gracza w paśmie >20% bez cedowalnego miasta pakiet surowców ≥ ceny pokrywa pokój (ten sam wariant zastępczy co w ofercie AI).
ZMIANY/COMMIT: baza 7148b2f4e. Allowlista: gra/src/game/diplomacy-truce-end-price.ts (truceEndDuePn, truceEndSurowceSubstituteCovers), gra/src/game/diplomacy-peace-lock.ts (tick: cena z truceEndDuePn; brak ceny = wojna), gra/src/game/diplomacy-proposals.ts (okno 11A + import), gra/src/main.ts (settleTruceEndPrice, truceEndWindowFor: requiredPn i cityAvailable), gra/data/diplomacy-war-peace-params.json (TYLKO nowy klucz pokojPoRozejmie), gra/tools/truce-end-peace-price-test.cjs, gra/tools/truce-end-window-test.cjs, ten raport. POZA ALLOWLISTA (ZAŁOŻENIE, konieczne dla tsc): gra/src/game/diplomacy-war-peace-profile.ts, jedno pole w interfejsie WarPeaceParams (pokojPoRozejmie), bez zmiany zachowania.
TESTY:
- tsc --noEmit: exit 0
- truce-end-peace-price-test: 67 PASS / 0 FAIL (nowe: d0 cena 0 → oferta z opłatą ok. 1; d0s NaN → wojna; d0u truceEndDuePn i truceEndSurowceSubstituteCovers; wiring; mutant M-SYM czerwony)
- truce-end-window-test: PASS=43 FAIL=0 (nowe 11A: brak miasta + surowce ≥ cena → przyjęte; brak miasta + surowce < cena → nie; miasto dostępne → nie; tick cena 0 → oferta; mutant M-SUB czerwony)
- truce-end-settle-exec-test: 30 PASS / 0 FAIL
- diplo-truce-impl-test: 93 PASS / 0 FAIL
- diplo-human-peace-no-war-test: PASS=13 FAIL=0
- diplo-war-tribute-once-test: PASS=8 FAIL=0
- research-test: PASSED 33 / FAILED 0
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- logic-test, tech-tree-test, unit-replace-test, combat-test, truce-end-war-notice-test, war-limit-truce-count-test: exit 0 (skrypty nie drukują sumy; NIE ZMIERZONO liczby PASS)
- Bramka live w przeglądarce: NIE ZMIERZONO
ZMIENIONE ASERCJE (stary kontrakt „cena 0 = wojna”): truce-end-peace-price-test (d0) i truce-end-window-test (tick cena 0). Zastąpione nowym kontraktem 10B; NaN nadal = wojna (d0s). Asercje dla cen dodatnich nie osłabione.
BLOKADY: brak.
ZAŁOŻENIA:
- Symboliczna opłata = 1 Pn (wartość startowa wg dispatchu „1 surowiec”; przelicznik surowiec→Pn nie był sprawdzany w kodzie; plan ogona dobiera jednostki do pokrycia 1 Pn).
- Cena 0 obsługiwana w truceEndDuePn (jedno źródło prawdy); pickTruceEndSettlementPlan dla requiredPn ≤ 0 nadal zwraca null (czysta funkcja bez zmian).
- cityAvailable = płatnik ma choć jedno cedowalne miasto (aiPeacePaymentAssets). Wariant zastępczy w oknie gracza działa tylko przy cityAvailable = false.
- ROZBIEŻNOŚĆ DO DECYZJI: po stronie AI pickTruceEndSettlementPlan przechodzi na surowce także wtedy, gdy miasta istnieją, ale nie wystarczają (plan niepełny). Okno gracza tego nie robi. Do ujednolicenia, jeśli orkiestrator uzna pełną zgodność za wymaganą.
- Oferta po rozejmie przy cenie 0 niesie kwotę symboliczną w treści („ok. 1”).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (zakres: wyjątek poza allowlistą w diplomacy-war-peace-profile.ts; decyzja o ujednoliceniu cityAvailable z pickTruceEndSettlementPlan).
DEPLOY/PUSH: NIE WYKONANO
