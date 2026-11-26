# R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 — obrona Operatora (runda 2/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1
GOAL: (1) pokój zaproponowany przez gracza po końcu rozejmu przyjmowany przez AI wg truceEndPriceRule, gdy cena zrównoważona; (2) realna płatność settleTruceEndPrice pokryta testem wykonawczym; (3) cena 0 → brak oferty w skrzynce, wpis „Rozejm wygasł, wojna wraca”.
ZMIANY-COMMIT: baza b6f3e5dc0 (r1). Zmiany rundy 2 wyłącznie w testach: gra/tools/truce-end-settle-exec-test.cjs, gra/tools/truce-end-peace-price-test.cjs. Kod gra/src/ bez zmian względem r1. SHA: patrz pole sha w odpowiedzi.

## Odpowiedzi na zarzuty Evaluatora
1. Pkt (1) niezrealizowany — PRZYJMUJĘ. Dowód: git diff --name-only 8ad1d555d..b6f3e5dc0 nie zawiera diplomacy-proposals.ts ni diplomacy-pn-engine.ts. Wpięcie oceny pokoju gracza jest w gra/src/game/diplomacy-proposals.ts (case 'pokoj', ok. linia 1791), a pole okna (np. truceEndTurn) w DiploPairMeta w gra/src/game/diplomacy-pn-engine.ts (ok. linia 74). Oba pliki są poza allowlistą dispatchu. Allowlisty nie rozszerzałem samowolnie. Zob. BLOKADY.
2. Test wykonawczy tylko na atrapie ledgera — PRZYJMUJĘ częściowo. Dodano przypadek (6): gracz (owner 0 = ME()) jako płatnik, surowce 0 → 9, jeden przelew, stan gracza 7 nietknięty. Wynik: 30 PASS, 0 FAIL. Realny port transferBasketItems w main.ts nadal nie jest wykonywany w teście (wiring sprawdzany regexem i tsc). NIE ZMIERZONO: żywa płatność w grze.
3. Gałąź ceny 0 obejmuje AI↔AI i quotePn=NaN — ODRZUCAM część AI↔AI z dowodem: warunek `rule != null && ports.quotePn && !(ports.quotePn(...) > 0)` leży WEWNĄTRZ bloku `if (ports.isHuman(target) || ports.isHuman(initiator))` w truceEndTickPair (diplomacy-peace-lock.ts). Ścieżka AI↔AI idzie dalej przez truceEndSettleCore. Dodano test (d0b) AI↔AI z wyceną 0: brak oferty i pokój (finalize 1, wojna 0). PRZYJMUJĘ część NaN: NaN traktowane jak brak ceny (wojna, bez oferty). To zmiana względem r1 (wcześniej NaN dawało ofertę z wartością 0). Traktuję jako ZAŁOŻENIE (brak wyceny = brak pokoju z ceną); dodano test (d0c).
4. Zmieniona asercja wiring w truce-end-peace-price-test.cjs — PRZYJMUJĘ jako odnotowaną. Stara asercja `pickTruceEndSettlementPlan({` w main.ts została zastąpiona asercją na `executeTruceEndSettlement({` i `return pick != null`. Kontrakt nie jest osłabiony: pickTruceEndSettlementPlan nadal jest wołana wewnątrz executora (exec-test sprawdza to osobno).

## TESTY (surowe wyniki, worktree po zmianach rundy 2; kod src bez zmian)
- npx tsc --noEmit -p . (gra) → exit 0
- node tools/logic-test.cjs → LOGIC OK (213/213)
- node tools/truce-end-peace-price-test.cjs → 62 PASS, 0 FAIL, exit 0 (r1: 59/0; dodano d0b, d0c i tym samym zwiększono liczbę asercji)
- node tools/truce-end-settle-exec-test.cjs → 30 PASS, 0 FAIL, exit 0 (mutanty M-NOPAY, M-SWAP, M-DOUBLE wykryte jak w r1; dodano przypadek (6))
- node tools/diplo-truce-impl-test.cjs → 93 PASS, 0 FAIL
- node tools/ai-test.cjs → 297 passed, 0 failed
- node tools/truce-end-war-notice-test.cjs → PASS
- node tools/war-limit-truce-count-test.cjs → 19 pass / 0 fail
- node tools/diplo-human-peace-no-war-test.cjs → PASS=13 FAIL=0
- node tools/diplo-war-tribute-once-test.cjs → PASS=8 FAIL=0
- node tools/war-rules-multiwar-main-guard-test.cjs → 21 PASS / 0 FAIL
- NIE ZMIERZONO: ścieżka pokoju gracza w tabeli negocjacji (pkt 1), żywa gra w przeglądarce, realny transferBasketItems.

## BLOKADY
1. Pkt (1) wymaga zmian poza allowlistą: diplomacy-proposals.ts (case 'pokoj' → rachunek truceEndPriceRule) i diplomacy-pn-engine.ts (pole okna w DiploPairMeta). Bez tego pkt (1) nie jest zrealizowany i GOAL nie jest spełniony.
2. Definicja okna „po rozejmie” (pole w meta pary, zachowanie po powrocie do wojny i przy zapisie/wczytaniu) — jeśli orkiestrator zdecyduje inaczej niż pole w meta, to decyzja inżynierska do potwierdzenia.
3. Decyzja domyślna A (cena 0 = wojna) bez potwierdzenia właściciela (R-WEB-DIPLO-TRUCE-END-PRICE-EDGE-Q1).

## RUNDY
2/5 (poprzednio 1/5; ostatni werdykt Evaluatora: FAIL przez niespełniony pkt 1)

## NASTĘPNY KROK
Orkiestrator decyduje: (a) rozszerzyć allowlistę o gra/src/game/diplomacy-proposals.ts i gra/src/game/diplomacy-pn-engine.ts i wystawić nową rundę Operatora na pkt (1), albo (b) wydzielić pkt (1) do osobnego tematu, a ten temat zamknąć jako PASS-WITH-NOTES dla pkt (2)-(3) po Final Control. Pkty (2)-(3) i testy są gotowe do Evaluatora.

UWAGI-DLA-ORKIESTRATORA: gra/node_modules zainstalowano przez npm ci --ignore-scripts na czas bramek; usunięcie po zapisie raportu. Nie uruchamiano npm run build/dev.
DEPLOY/PUSH: NIE WYKONANO
