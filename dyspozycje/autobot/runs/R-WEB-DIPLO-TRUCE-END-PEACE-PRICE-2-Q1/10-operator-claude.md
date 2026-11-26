STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1
GOAL: (1) pokój zaproponowany przez gracza po końcu rozejmu przyjmowany przez AI wg rachunku truceEndPriceRule, gdy cena zrównoważona; (2) realna płatność settleTruceEndPrice pokryta testem wykonawczym; (3) cena 0 → brak oferty w skrzynce, wpis „Rozejm wygasł, wojna wraca”.
ZMIANY-COMMIT: baza 8ad1d555d (origin/main). Commit z kodem i raportem: sha w odpowiedzi Operatora.
  Allowlista użyta: gra/src/game/diplomacy-truce-end-price.ts, gra/src/game/diplomacy-peace-lock.ts, gra/src/main.ts (tylko settleTruceEndPrice i import), gra/tools/truce-end-peace-price-test.cjs, nowy gra/tools/truce-end-settle-exec-test.cjs, ten raport.
  - (3) diplomacy-peace-lock.ts, truceEndTickPair: gdy quotePn(payer,payee) nie jest > 0 → truceEndToWarCore i return (bez enqueueOffer, bez truceEndOffer). Port quotePn opcjonalny: bez niego zachowanie bez zmian.
  - (2) diplomacy-truce-end-price.ts: nowa czysta funkcja executeTruceEndSettlement(input, payerId, payeeId, transfer). Wybór planu przez pickTruceEndSettlementPlan; transfer wołany dokładnie raz i tylko gdy plan ma pozycje. main.ts settleTruceEndPrice używa jej z portem transferBasketItems(payer, payee, basket); zachowanie bez zmian.
  - Test wykonawczy gra/tools/truce-end-settle-exec-test.cjs: ledger surowców i właściciela miast. Surowce 7→9 (złoto 30, brąz 20), cesja miasta c-7-1 do 9, wariant zastępczy surowcami, cena 0 i plan niepełny (zero przelewów), mutanty M-NOPAY, M-SWAP, M-DOUBLE wykryte.
  - truce-end-peace-price-test.cjs: dodane (d0) cena 0 → brak oferty i powrót do wojny; (d0) cena 40 → oferta (kontrola); asercje wiring dla executeTruceEndSettlement i ceny 0. Asercja „settleTruceEndPrice wybiera plan przez pickTruceEndSettlementPlan” zmieniona na nowy kształt main.ts (kontrakt nie osłabiony: pickTruceEndSettlementPlan nadal jest używana wewnątrz executora).
  - Pkt (1) NIE zaimplementowany (patrz BLOKADY).
TESTY (surowe liczby, worktree po zmianach):
  - npx tsc --noEmit -p gra → exit 0
  - logic-test.cjs → LOGIC OK (213/213)
  - truce-end-peace-price-test.cjs → 59 PASS, 0 FAIL (było 54/0)
  - truce-end-settle-exec-test.cjs (nowy) → 25 PASS, 0 FAIL; mutanty M-NOPAY, M-SWAP, M-DOUBLE: applied=1 i wykryte
  - diplo-truce-impl-test.cjs → 93 PASS, 0 FAIL
  - ai-test.cjs → 297 passed, 0 failed
  - truce-end-war-notice-test.cjs → PASS
  - war-limit-truce-count-test.cjs → 19 pass / 0 fail
  - diplo-human-peace-no-war-test.cjs → PASS=13 FAIL=0
  - diplo-war-tribute-once-test.cjs → PASS=8 FAIL=0
  - war-rules-multiwar-main-guard-test.cjs → 21 PASS / 0 FAIL
  - NIE ZMIERZONO: ścieżka pokoju gracza w tabeli negocjacji (pkt 1) i żywa gra w przeglądarce (testy live nie uruchamiane).
BLOKADY:
  1. Pkt (1), definicja okna „po rozejmie”. Potrzebne jest pole w meta pary (np. truceEndTurn: tura końca rozejmu, zachowane po powrocie do wojny; okno = ta tura lub poprzednia). Pole należy do DiploPairMeta w gra/src/game/diplomacy-pn-engine.ts, który jest POZA allowlistą dispatchu. Bez niego nie da się odróżnić pokoju po rozejmie od zwykłego pokoju: truceEndOffer jest czyszczony przy wygaśnięciu i odmowie, więc nie wyznacza okna po powrocie do wojny.
  2. Pkt (1), wpięcie. Ścieżka oceny pokoju gracza w tabeli negocjacji (resolveNegotiationEntryAt → evaluateProposal, case 'pokoj' w gra/src/game/diplomacy-proposals.ts) nie korzysta dziś z truceEndPriceRule. Wpięcie wymaga wyliczenia wartości pakietu gracza, a to dotyka diplomacy-proposals.ts, również poza allowlistą.
  3. Decyzja domyślna A (cena 0 = wojna) zastosowana zgodnie z dispatchem. Potwierdzenie właściciela w R-WEB-DIPLO-TRUCE-END-PRICE-EDGE-Q1 pozostaje otwarte.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje: (a) rozszerzyć allowlistę o diplomacy-pn-engine.ts (pole truceEndTurn) i diplomacy-proposals.ts, albo (b) wydzielić pkt (1) do osobnego tematu z tym zakresem. Pkty (2) i (3) gotowe do Final Control.
UWAGI-DLA-ORKIESTRATORA: wiring settleTruceEndPrice w main.ts sprawdzony testem tekstowym i pełnym tsc, bez uruchomienia gry. gra/node_modules zainstalowany na czas bramek i usunięty po nich. Pliki .truce-end-*.cjs usunięte.
DEPLOY/PUSH: NIE WYKONANO
