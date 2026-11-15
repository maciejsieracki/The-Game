# R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod i testy strażnikowe gotowe; bramki pełne i test w realnej turze NIE WYKONANE — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1
GOAL: aktywny szlak handlowy nie przesuwa zapasów żadnej strony. Zostaje dochód ze szlaku, boolean-grant dostępu do jednostek, limity i kontakt szlaku.
BAZA: 005cd9ab0cbe527a3be49d7d2104d70e1bb53871 (czubek gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0; ta gałąź NIE jest potomkiem origin/main 06fcc8526, a w origin/main nie ma pliku 00-dispatch.md tego tematu — dispatch i dodatek odczytano z gałęzi)

## ZMIANY-COMMIT
- gra/src/main.ts: usunięto blok „Handel E3c” (wywołanie loadTradeRouteResourceFlowParams, computeTradeRouteResourceFlow, deductBuildingStockCostAcrossCities i creditOwnerResourceStock dla przepływu szlaku, ok. 36 linii) i dwa nieużywane importy (computeTradeRouteResourceFlow, loadTradeRouteResourceFlowParams) oraz import typu TradeRouteStockFlowResourceKey. Zostawiono krótki komentarz w miejscu bloku. Blok grantu dostępu (boolean) nietknięty.
- gra/tools/surow-civ-storage-test.cjs: sekcja I (strażnik tekstowy wcześniej wymagający przepływu z capem) zastąpiona strażnikiem odwrotnym: main.ts NIE wywołuje computeTradeRouteResourceFlow(, loadTradeRouteResourceFlowParams(, nie ma pętli tradeFlows ani bloku „Handel E3c”. Mutacja (przywrócenie przepływu) = czerwony test.
- Funkcje computeTradeRouteResourceFlow / loadTradeRouteResourceFlowParams / TRADE_ROUTE_STOCK_FLOW_KEYS / DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS ZOSTAJĄ w trade-routes.ts (eksport). Nadal używa ich 7 testów (trade-ilosc-test, zloto-szlak-test, surow-civ-storage-test i inne), więc usunięcie byłoby sprzeczne z dispatchem („usuń martwy kod TYLKO jeśli nic poza testami ich nie używa” — używają testy, zostają, opisane tutaj).
- Commit: SHA w polu sha wyniku StructuredOutput (commit „R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 (Operator r1)”).

## TESTY (surowe wyniki z tej sesji)
- `npx tsc --noEmit` (gra/): exit 0, bez błędów.
- surow-civ-storage-test.cjs: 63 passed, 4 failed. Wszystkie 4 FAIL to sekcja G (strażnik wyrębu lasu, `drewnoCap`/`creditOwnerResourceStock` w pętli wyrębu). Sekcja G jest poza zakresem tego tematu i jej obszar kodu (main.ts ok. 40303–40320, 44620–44627) nie został zmieniony przez ten diff. Błąd pochodzi z wcześniejszej zmiany (applyStolarniaDrewnoMapInflow) — DŁUG, do osobnego tematu.
- Sekcja I (nowa): PASS w całości (4 asercje).
- Weryfikacja mutacji (ręcznie, bez wpływu na repo): regex strażnika `computeTradeRouteResourceFlow\s*\(` daje TRUE na main.ts z bazy 005cd9ab0 i FALSE na zmienionym main.ts. Strażnik rozróżnia stan przed i po zmianie.
- trade-grant-test.cjs: 62 passed, 0 failed (boolean-grant bez zmian).
- zloto-szlak-test.cjs: 54 passed, 0 failed.
- trade-routes-income-test.cjs: 134 passed, 0 failed.
- trade-routes-test.cjs: 96 passed, 0 failed.
- trade-routes-contact-only-test.cjs: 36 passed, 0 failed.
- trade-routes-limit-test.cjs: 76 passed, 0 failed.
- trade-routes-ownership-income-test.cjs: 18 passed, 0 failed.
- trade-routes-hud-filter-test.cjs: 58 passed, 0 failed.
- trade-ilosc-test.cjs: 35 passed, 5 failed — FAIL B (3 asercje: capacityPerRoutePerTurn, limit na turę) i E (2 asercje: TRADE_ROUTE_STOCK_FLOW_KEYS ma 6 kluczy, zawiera „kon”). Plik trade-routes.ts NIE został zmieniony w tym temacie, więc te FAIL są PRZED tym tematem (pre-existing, rozjazd z późniejszym dodaniem „zloto”/„sol” do kluczy). Nie naprawiałem — poza zakresem; do osobnego tematu (test trade-ilosc do zaktualizowania do aktualnego stanu klucza i limitu).

## NIE ZMIERZONO (z powodu)
- Kryterium (a): test w realnej turze z dwiema cywilizacjami i pomiar zapasów przed/po w przeglądarce — NIE ZMIERZONO (brak uruchomienia gry w przeglądarce w tej rundzie; wymagane narzędzie run/Chromium).
- Bramki referencyjne (5 bramek z PROC) — NIE ZMIERZONO w tej rundzie.
- Krok 3 (docs/encyklopedia/**, docs/PORADNIK-GRACZA/**, wikiBundle.json, regeneracja `node tools/bundle-wiki-for-game.cjs`) — NIE WYKONANO. Pełny przegląd tekstów dla gracza o przesyłaniu surowca szlakiem nie został zrobiony w tej rundzie.
- Krok 4 (resource-ledger.ts, źródło „szlak”) — plik gra/src/game/resource-ledger.ts NIE istnieje w bazie 005cd9ab0 (księga zasobów jest w innej gałęzi, FALA 733), więc krok nie dotyczy tej bazy.
- Dysk: przed startem 6,7 GB wolne (df /), próg dispatchu ≥ 6 GB spełniony co do progu, ale margines mały.

## BLOKADY
1. Brak pomiaru w realnej turze (kryterium a) i brak pełnych bramek — wymaga osobnej rundy lub etapu Evaluatora z przeglądarką.
2. Dokumentacja i wikiBundle (krok 3) do wykonania w kolejnej rundzie.
3. Test trade-ilosc-test (B, E) i sekcja G surow-civ-storage-test są czerwone przed tym tematem — do osobnych tematów.
4. gra/tools/perf-large-empire-stress-live-test.cjs (poza allowlistą) wykonuje replaceOnce na tekście bloku E3c (`const tradeFlowParams = loadTradeRouteResourceFlowParams(` i `trade_route_stock_flow`). Po tej zmianie ten skrypt pomiarowy przestanie znajdować tekst i przerwie się przy uruchomieniu. Nie edytowałem go (poza allowlistą). Do zgłoszenia orkiestratorowi.

## RUNDY
1/5 — pierwsza runda Operatora.

## NASTĘPNY KROK
Evaluator: (a) pomiar w realnej turze dwóch cywilizacji z aktywnym szlakiem (zapasy przed/po, dochód Pieniądza ze szlaku); (b) mutacja — przywrócić przepływ lokalnie i potwierdzić czerwony surow-civ-storage-test sekcja I; (c) bramki referencyjne; (d) krok 3 docs/wiki i regeneracja wikiBundle w tej samej gałęzi, jeśli orkiestrator to przydzieli.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch w origin/main nie istnieje (plik 00-dispatch.md tego tematu jest tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0). Dispatch wzięto z tej gałęzi.
- Baza w dispatchu raz podana jako 06fcc8526 (origin/main), raz jako 005cd9ab0 — użyto 005cd9ab0 zgodnie z poleceniem tej rundy.
- perf-large-empire-stress-live-test.cjs wymaga aktualizacji (poza allowlistą) — patrz BLOKADY 4.
- Nie tworzono żadnych sesji ani zadań, nie integrowano, nie pushowano na main.

DEPLOY-PUSH: NIE WYKONANO
