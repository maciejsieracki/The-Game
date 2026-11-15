# R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 — raport Operatora, runda 2/5

STATUS: PASS-WITH-NOTES (Operator; wymaga Evaluatora i Final Control)
DOMAIN: GAME
TEMAT: R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 (decyzja ABC 2026-11-15, wariant A, #311)
GOAL: aktywny szlak handlowy NIE przesuwa zapasów żadnej strony; zostaje dochód ze szlaku i boolean-grant dostępu.

## Baza i merge
- Start: `bbd053657` (FC r1 FAIL, na gałęzi dispatchów; zawiera kod Operatora r1 `9e25e4713`), detached.
- Merge `origin/main` = `06fcc8526` (FALA 734) wykonany; konflikty: `gra/src/main.ts` (rozwiązane: zachowany blok usunięcia E3c + cały nowy kod main), `gra/src/data/wikiBundle.json` (regeneracja `node tools/bundle-wiki-for-game.cjs`).
- Uwaga: `origin/main` = 06fcc8526, a dispatch wskazywał bbd0536 jako „origin/main"; bbd0536 nie jest przodkiem origin/main — rozstrzygnięcie: baza kodu = bbd0536 + merge origin/main (zgodnie z DODATKIEM r2).

## Zmiany (ZMIANY-COMMIT: commit merge na czubku gałęzi detached; SHA w polu sha wyniku)
1. `gra/src/main.ts` — usunięty blok „Handel E3c” (wywołanie `loadTradeRouteResourceFlowParams` / `computeTradeRouteResourceFlow` / `creditOwnerResourceStock`, pętla `deductBuildingStockCostAcrossCities`). Zostają: dochód ze szlaku, grant boolean (blok wyżej — nietknięty).
2. `gra/src/game/trade-routes.ts` — usunięty martwy kod: `TradeRouteStockFlowResourceKey`, `TRADE_ROUTE_STOCK_FLOW_KEYS`, `TradeRouteResourceFlowParams`, `DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS`, `loadTradeRouteResourceFlowParams`, `TradeRouteResourceFlow`, `computeTradeRouteResourceFlow` (sekcja E3c, koniec pliku). Grep: poza testami użycia tylko w komentarzach (poprawione).
3. `gra/data/econ-params.json` — usunięty klucz `ekonomia_miasta.handel_surowiec_min_stock` (używany wyłącznie przez usunięty loader).
4. Teksty/komentarze: `gra/src/game/citizen-resource-upkeep.ts` (3 komentarze), `gra/src/game/zloto-access.ts` (nagłówek + `@deprecated`), `gra/src/game/trade-routes.ts` (komentarz 'sol'), `gra/src/ui/cityPanel.ts` (ostrzeżenie Mennicy: usunięte „szlak handlowy” jako źródło Złota).
   Dokumentacja (`docs/encyklopedia/**`, `docs/PORADNIK-GRACZA/08`) już zawiera zdania „szlak nie przesuwa zapasów” (z bazy); nie zmieniano.
5. `gra/src/data/wikiBundle.json` — zregenerowany po merge (`node tools/bundle-wiki-for-game.cjs`: 22 rozdz. + 182 hasła).
6. Księga „Skąd zapasy” (`gra/src/game/resource-ledger.ts`): grep `szlak`/`trade` — brak źródła szlakowego; bez zmian.
7. Testy:
   - `gra/tools/trade-ilosc-test.cjs` — przepisany: brak eksportu przepływu (A), grant boolean braz/zelazo/kon bez zmian (B), parytet AI (C), zgodność zapisu (D), brak przepływu w źródłach (E). 23 PASS.
   - `gra/tools/zloto-szlak-test.cjs` — sekcje 3, 4, 5 przepisane na „szlak nie zasila magazynu” (Mennica NIEBUDOWALNA bez złoża; runtime gate przez sam grant nadal działa). Sekcja F: fixture magazynu zamiast `empireStockAfterFlow`. 48 PASS.
   - `gra/tools/perf-large-empire-stress-live-test.cjs` — usunięta faza `trade_route_stock_flow` (replaceOnce); faza `trade_route_income_aggregation` zachowana (wejście przeniesione na `loadTradeRouteIncomeParams`). `node --check` OK; NIE URUCHAMIANY w całości (NIE ZMIERZONO).
   - NOWY `gra/tools/trade-route-remove-stock-flow-live-test.cjs` — live (Chromium, bundle vite poza repo, `?playtest=mapa&civTest=1`): start, założenie miasta, prepare (kontakt, nie-wojna), 3 tury REALNYM endTurn. Asercje: e3cFires == 0, brak źródła „szlak” w księdze, zero pageerror/console.error. 7 PASS.
   - `gra/tools/surow-civ-storage-test.cjs` — bez zmian (asercje regex na brak wywołania przepływu PASS); sekcja G 4 FAIL = dług bazowy (zgodnie z dispatchem).

## TESTY (liczby z surowego wyjścia)
- `npx tsc --noEmit -p .` (gra/): exit 0.
- `node tools/trade-ilosc-test.cjs`: 23 passed, 0 failed.
- `node tools/zloto-szlak-test.cjs`: 48 passed, 0 failed.
- `node tools/trade-routes-test.cjs`: 96 passed, 0 failed.
- `node tools/trade-grant-test.cjs`: 62 passed, 0 failed.
- `node tools/trade-routes-income-test.cjs`: 134 passed, 0 failed.
- `node tools/trade-routes-contact-only-test.cjs`: 36 passed, 0 failed.
- `node tools/trade-routes-limit-test.cjs`: 76 passed, 0 failed.
- `node tools/trade-routes-ownership-income-test.cjs`: 18 passed, 0 failed.
- `node tools/trade-sea-bonus-requires-port-test.cjs`: 30 passed, 0 failed.
- `node tools/trade-treaty-free-break-after-10-test.cjs`: 35 pass, 0 fail.
- `node tools/resource-ledger-trade-test.cjs`: 27 passed, 0 failed.
- `node tools/surow-civ-storage-test.cjs`: 63 passed, 4 failed — 4 FAIL to sekcja G (dług bazowy, nie ruszana).
- `node tools/zloto-test.cjs`: 2 FAIL w „Parytet AI / Mennica DOSTĘPNA” (asercje o bramce budowy Mennicy przy Targowisku i Walucie bez złota). Plik nie odwołuje się do usuniętych symboli przepływu (grep); bramka budowy (production.ts / building-resource-gate.ts) NIE była zmieniana w tym temacie. NIE ZMIERZONO na origin/main (brak osobnego checkoutu main w tym worktree) — status: pre-existing do potwierdzenia przez Evaluatora.
- `node tools/trade-route-remove-stock-flow-live-test.cjs` (BUNDLE_DIR=/tmp/civ-e3c-dist, 3 tury): 7 passed, 0 failed; e3cFires = 0 we wszystkich turach; brak pageerror.
- Bramki referencyjne „5 bramek” — NIE ZMIERZONO: dispatch nie wymienia ich nazw w dostępnym dokumencie; uruchomiono powyższe testy trade/zloto.

## Kryteria binarne (stan)
- (a) test w realnej turze: CZĘŚCIOWO. Live smoke 3 tury bez błędów i e3cFires == 0 — ZMIERZONE. Liczby zapasów obu stron przed/po z aktywnym szlakiem oraz dochód Pieniądza ze szlaku — NIE ZMIERZONO: scenariusz nie zbudował aktywnej trasy (brak hooka ustawiającego targowisko/trasę); `zapasy wlascicieli=1` w snapshocie (księga zwraca tylko właściciela 0 w tej sesji).
- (b) mutacja (przywrócenie przepływu) ⇒ czerwono: NIE ZMIERZONO na żywo. Statycznie: `trade-ilosc-test` A/E i `zloto-szlak-test` (brak eksportu) padłyby po przywróceniu eksportu/wywołania.
- (c) grant dostępu boolean bez zmian: ZMIERZONE testami `trade-ilosc-test` B/C i `trade-grant-test` (62 PASS).
- (d) tsc 0: ZMIERZONE. Trade-routes-*-test zielone: ZMIERZONE. `git diff --check`: czysty (pusty wynik).

## BLOKADY
- Brak hooka do ustawienia aktywnej trasy handlowej w scenariuszu live → kryteria (a) liczby i (b) mutacja na żywo NIE ZMIERZONE.
- `zloto-test` 2 FAIL (patrz wyżej).
- Pozostaje w `main.ts` probe `ledgerAuditE3cLast` / `ledgerAuditE3cFires` (hak `__ledgerTestDebug`, czyta `resource-ledger-live-measure.cjs`): po usunięciu bloku zawsze pusty/0. Nie usunięto (poza allowlistą minimalną; konsument w tools/). Zalecenie: usunąć w porządkach razem z `resource-ledger-live-measure.cjs`.

## REPIN Rust (dług)
- Dane: klucz `handel_surowiec_min_stock` usunięty z `econ-params.json`; dane `TRADE_ROUTE_STOCK_FLOW_KEYS` nie istnieją w web.
- Logika: przepływ ilościowy szlaku (E3c) usunięty; port Rust musi odzwierciedlić brak przepływu (szlak = premia + boolean-grant).

## UWAGI-DLA-ORKIESTRATORA
- Rozbieżność bazy: dispatch podaje „origin/main = bbd0536”; faktycznie origin/main = 06fcc8526 (FALA 734), bbd0536 jest na gałęzi dispatchów. Wykonano merge origin/main do bbd0536 wg DODATKU.
- Pozostaje `gra/tools/resource-ledger-live-measure.cjs` czytający `e3cLast`/`e3cFires` (patrz BLOKADY).
- Zalecany osobny temat: test mutacji live (wymaga hooka ustawiającego trasę), oraz pełny pomiar perf-skryptu.
- Nie integrowano, nie pushowano na main, nie deployowano.

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu merge (`git diff --stat origin/main..HEAD` i `git merge-base --is-ancestor origin/main HEAD`), potwierdzenie zloto-test jako pre-existing na origin/main, decyzja o kryterium (a)/(b).
DEPLOY/PUSH: NIE WYKONANO
