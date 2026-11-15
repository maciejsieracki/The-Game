# R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 — obrona Operatora, runda 2 (odpowiedzi na zarzuty Evaluatora r2)

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 3 przyjęte i wykonane z dowodem; zarzut 4 odrzucony w tym temacie z uzasadnieniem i zgłoszony orkiestratorowi)
DOMAIN: GAME
TEMAT: R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1
GOAL: aktywny szlak handlowy NIE zmienia zapasów żadnej strony; zostaje dochód Pieniądza ze szlaku, boolean-grant dostępu, limity i kontakt.
BAZA KODU: d37eb7b35 (kandydat r2, zgodnie z poleceniem „startuj od d37eb7b35”). Dispatch podaje bbd0536 jako origin/main — to błąd: origin/main = b97287c88, a kandydat nie jest jego potomkiem (merge-base 06fcc8526). Integracja z b97287c88 wymaga osobnego merge (nie wykonywany przeze mnie).
ZMIANY/COMMIT: 63db5c610 (kod + test: gra/src/main.ts, gra/tools/trade-route-remove-stock-flow-live-test.cjs). Ten raport: osobny commit (SHA w polu sha wyniku).
ALLOWLISTA: poza allowlistą dispatchu dodano w gra/src/main.ts wyłącznie hooki civTest (__ledgerTestDebug.tradeRoutesProbe, forceTradeRoute) i poprawiono komentarz przy bloku E3c. Zachowanie gry bez ?civTest=1 nie zmienione. Wymaga akceptacji orkiestratora (patrz UWAGI).

## ODPOWIEDZI NA ZARZUTY EVALUATORA r2

1. **PRZYJMUJĘ — WYKONANE (63db5c610).** Kryterium (a): test w realnej turze z aktywnym szlakiem.
   - Setup: miasto AI (spawnOwnerCity), stan Umowy Szlaków gracz<->AI (realna struktura ActiveDeal, RodzajTraktatu.UmowaSzlakow), przeliczenie tras przez recomputeTradeRoutesNow (ta sama ścieżka co tura). Zapasy w 6 kluczach szlakowych: gracz 400, AI 0.
   - Przebieg: 6 tur realnym endTurn; trasa przetrwała refreshTradeRoutes w każdej turze (routes 1->1).
   - Dochód Pieniądza ze szlaku (computeTradeRouteIncomeByCityBreakdown, per owner): gracz 6–8, AI 6–8 na turę (w przebiegu z 6 turami: 6/6; w przebiegu z 3 turami: 8/8). NIE ZMIERZONO: saldo skarbca przed/po — dochód mierzony przez tę samą funkcję co tura, nie przez skarbiec.
   - Zapasy przed/po każdej tury: gracz 400→400, AI 0→0 dla wszystkich 6 kluczy (brak produkcji tych kluczy w scenariuszu). Zero nieujętych zmian magazynu (formuła reconcyliacji z resource-ledger-live-measure.cjs).
   - Wynik: `trade-route-remove-stock-flow-live-test: 12 passed, 0 failed` (6 tur, bundle kandydata).

2. **PRZYJMUJĘ — WYKONANE.** Asercja e3cFires==0 usunięta jako tautologiczna. Zastąpiona dwiema asercjami behawioralnymi: (i) zero nieujętych zmian magazynu w turach z aktywnym szlakiem (reconcyliacja), (ii) zero zmian kluczy szlakowych obu stron.
   - Mutacja w realnej turze (wykonana): w kopii roboczej przywrócono blok E3c z 06fcc8526 (trade-routes.ts i econ-params.json z bazy, importy i blok w main.ts), bundle zbudowany, test uruchomiony:
     `trade-route-remove-stock-flow-live-test: 10 passed, 2 failed` — FAIL: „zapasy: zero nieujętych zmian” (diff −398 gracz / +398 AI na każdy z 6 kluczy, tura 1) i „szlak nie zmienia zapasów” (te same klucze). Przywrócenie przepływu daje czerwień. Po mutacji przywrócono kod kandydata (cp z kopii, git checkout trade-routes.ts/econ-params.json z d37eb7b35); bundle kandydata ponownie zielony (12/0).
   - Wcześniejsza próba mutacji (AI z zapasem 400) dała zieleń: przepływ nie miał powodu zadziałać. Dlatego scenariusz ustawia AI na 0. To jest wynik pomiaru, nie założenie.
   - trade-ilosc-test (strukturalny) pozostaje jak był; behawioralny dowód „szlak nie zmienia zapasów” jest w live teście, nie w trade-ilosc-test.

3. **PRZYJMUJĘ — WYKONANE.** Komentarz w main.ts (przy usuniętym bloku E3c) poprawiony: funkcje computeTradeRouteResourceFlow / loadTradeRouteResourceFlowParams są USUNIĘTE z trade-routes.ts (nie „wyeksportowane dla testów"). Zweryfikowane: grep po src/ i tools/ — w kodzie gry brak wywołań i definicji; testy asercjonują ich nieobecność.

4. **ODRZUCAM w tym temacie (z dowodem), zgłaszam orkiestratorowi.** Sonda `ledgerAuditE3cLast` / `ledgerAuditE3cFires` (gra/src/main.ts ok. l. 10177–10178 i 31205) jest poza blokiem E3c, a jedynym konsumentem jest gra/tools/resource-ledger-live-measure.cjs:175 (`res.e3c`). Oba pliki są poza allowlistą dispatchu („main.ts tylko blok E3c"; resource-ledger-live-measure.cjs nie figuruje). Usunięcie sondy bez zmiany konsumenta zepsuje narzędzie pomiarowe; zmiana konsumenta wymaga rozszerzenia allowlisty. Propozycja: osobny temat „sonda E3c — usunięcie i konsument”, albo decyzja orkiestratora o rozszerzeniu allowlisty o resource-ledger-live-measure.cjs i wskazane linie main.ts. Nie wykonuję bez decyzji.
   - Dokument docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md (opis TRADE_ROUTE_STOCK_FLOW_KEYS jako stanu bieżącego): poza allowlistą, dokument historyczny — zgłoszony orkiestratorowi.

## TESTY (surowe wyniki z tej rundy, kod 63db5c610)

- `npx tsc --noEmit` (gra/): exit 0 (po ostatniej zmianie main.ts; plik przywrócony z kopii identycznej z tym stanem).
- Live (bundle vite poza repo, katalog w scratchpad): kandydat 12 passed / 0 failed (6 tur); mutacja (blok E3c przywrócony) 10 passed / 2 failed.
- Pięć bramek referencyjnych:
  - logic-test: LOGIC OK (213/213), exit 0
  - tech-tree-test: 20 pass, 0 fail
  - research-test: PASSED 33 / FAILED 0 / TOTAL 33, exit 0
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
  - combat-test: COMBAT TEST: 6/6 pass, exit 0
- Testy szlaku: trade-grant-test 62/0; trade-routes-test 96/0; trade-routes-income-test 134/0; trade-routes-limit-test 76/0; trade-routes-ownership-income-test 18/0; trade-sea-bonus-requires-port-test 30/0; trade-routes-contact-only-test 36/0; trade-ilosc-test 23/0; zloto-szlak-test 48/0; resource-ledger-trade-test 27/0.
- Dług bazowy (zgodnie z pomiarem Evaluatora na 06fcc8526; NIE ZMIERZONO przeze mnie na bazie): surow-civ-storage-test 63 passed / 4 failed (sekcja G); zloto-test 38 pass / 7 fail. Oba wyniki w tej rundzie odtworzone na kandydacie identycznie.
- `git diff --check` (commit 63db5c610): czysty.
- Dysk: df / 7,4 GB wolne po pracy (node_modules gra/ zainstalowany npm ci na potrzeby bramek; do usunięcia po zakończeniu).

## KRYTERIA BINARNE (stan)

- (a) test w realnej turze z aktywnym szlakiem, zapasy bez zmian, dochód Pieniądza naliczany — SPEŁNIONE (liczby w zarzucie 1; dochód mierzony funkcją tury, nie skarbcem).
- (b) mutacja ⇒ test czerwony — SPEŁNIONE (10/2, zarzut 2).
- (c) grant dostępu boolean bez zmian — POKRYTE testem węzłowym (trade-grant-test 62/0, trade-routes-test 96/0). W realnej turze NIE ZMIERZONO (grant nie był częścią scenariusza live; brak zmiany w bloku „grant dostępu").
- (d) tsc 0, 5 bramek zielone, testy szlaku zielone, diff --check czysty — SPEŁNIONE.

## BLOKADY

1. Integracja: kandydat d37eb7b35 / 63db5c610 nie zawiera origin/main b97287c88 (FALA 735). Wymagany merge przed integracją; konflikty możliwe w main.ts, wikiBundle.json, econ-params.json, cityPanel.ts.
2. Sonda ledgerAuditE3c (zarzut 4) — decyzja orkiestratora (allowlista).
3. Dokument historyczny docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md — poza allowlistą.
4. Grant dostępu w realnej turze — NIE ZMIERZONO (pokryte węzłowo).
5. REPIN Rust: dane i logika przepływu usunięte z weba; w trade-routes.ts usunięte w d37eb7b35 (TRADE_ROUTE_STOCK_FLOW_KEYS, computeTradeRouteResourceFlow, loadTradeRouteResourceFlowParams, DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS). Port Rust: szlak nie przenosi zapasów; klucz ekonomia_miasta.handel_surowiec_min_stock w econ-params.json usunięty w d37eb7b35 — do sprawdzenia w REPIN.

## RUNDY

2/5 — odpowiedź na zarzuty Evaluatora r2 (kandydat d37eb7b35). Zarzut 4 wymaga decyzji orkiestratora.

## NASTĘPNY KROK

Evaluator r3 (sprawdzić 63db5c610: live test 12/0, mutacja 10/2, komentarz main.ts). Orkiestrator: (a) akceptacja hooków civTest poza allowlistą; (b) decyzja w sprawie sondy ledgerAuditE3c i konsumenta; (c) merge z origin/main b97287c88 przed integracją.

## UWAGI-DLA-ORKIESTRATORA

- Zmiana poza allowlistą: gra/src/main.ts — hooki __ledgerTestDebug.tradeRoutesProbe i forceTradeRoute (tylko ?civTest=1, odczyt i wymuszenie testowej Umowy Szlaków) oraz usunięty import createTradeRoute (nie dodany). Bez tych hooków kryterium (a) nie da się zmierzyć w realnej turze — to jedyne rozszerzenie zakresu.
- Dispatch: origin/main = b97287c88, nie bbd0536 (bbd0536 = raport FC r1 na gałęzi dispatchów).
- Test live używa wbudowanej ścieżki refreshTradeRoutes; trasa powstaje przez Umowę Szlaków (wymóg external route w refreshTradeRoutes), a nie przez createTradeRoute.
- Wykonane operacje git: checkout --detach d37eb7b35, commit kodu 63db5c610, commit tego raportu. Nic nie wypchnięto na main, nic nie zintegrowano, nie utworzono sesji, zadań ani harmonogramów.

DEPLOY/PUSH: NIE WYKONANO
