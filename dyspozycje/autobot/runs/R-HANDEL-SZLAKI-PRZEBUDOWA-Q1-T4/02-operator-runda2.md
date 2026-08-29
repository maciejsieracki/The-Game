STATUS: PASS
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4
GOAL: Zastąpić stary globalny mnożnik +5% Handlu (`handelBrutto *= (1+0.05*liczbaTrasHandlowych)`, liczony ze WSZYSTKICH połączonych tras niezależnie od budynku) addytywną sumą per-trasowych bonusów `0.05 × własny dochód dystansowy trasy`, naliczaną WYŁĄCZNIE dla tras z `budynekOdblokowany===true` (ECHO Q3 Wariant C), z realnym podłączeniem w rozgrywce (turn-economy.ts/main.ts/cityPanel.ts), zgodnie z rozszerzoną allowlistą z decision-abc.md rundy 1.

PRZYCZYNA/PROJEKT: Kontynuacja rundy 2 po BLOCK rundy 1 (konflikt kontraktu allowlisty, opisany w `decision-abc.md`, rozstrzygnięty przez orkiestratora jako techniczna korekta zakresu bez wpływu na gameplay/balans). Implementacja dokładnie wg planu z reconu rundy 1: nowa funkcja `computeTradeRouteBuildingBonusByCity()` w trade-routes.ts (suma 0.05×tradeRouteTotalDistanceIncome per trasa z budynkiem, BEZ mnożnika bonusu cudów), zastąpienie starego mnożnika addytywnym `handelBrutto += premiaTrasHandlowych` w TYM SAMYM miejscu Step-ów economy.ts (po Targowisku/civHandelMult, przed Step 5 korupcja), przekabelowanie kształtu danych przez `turn-economy.ts` (2 funkcje: previewCityEconomy, advanceCityEconomy) i WSZYSTKIE 10 punktów wpięcia w `main.ts` znalezione grepem na starcie rundy (import, deklaracja, 2× reassign, 2× getCityBuildingFlags, 1× przekazanie do advanceCityEconomy, 4× .clear()), oraz naprawa jednej zduplikowanej ścieżki wyświetlania w `cityPanel.ts` (funkcja `activeTradeRouteCountForCity` + 3 miejsca używające starej stałej procentowej — teraz liczą tylko trasy z budynkiem i pokazują absolutną kwotę premii zamiast fałszywego "+X%", bo nowy mechanizm nie jest już czysto procentowy per trasa).

ZMIANY/COMMIT: branch `autobot/HANDEL-T4-Q1`, kolejny commit na wierzchu `127143bb`, wypchnięty do `origin/autobot/HANDEL-T4-Q1`.
- `gra/src/game/trade-routes.ts` (+24/-6): nowa funkcja `computeTradeRouteBuildingBonusByCity()`, usunięcie `computeTradeRouteCountByCity()`.
- `gra/src/game/economy.ts` (+18/-11): pole `CityYieldContext.liczbaAktywnychTrasHandlowych` → `premiaHandluTrasHandlowych` (number, addytywne), Step 4 zmieniony z mnożnika na dodawanie.
- `gra/src/game/turn-economy.ts` (+8/-7): parametr `tradeRouteCountByCity: ReadonlyMap<string,number>` → `tradeRouteBuildingBonusByCity: ReadonlyMap<string,number>` w `previewCityEconomy` i `advanceCityEconomy`, przekabelowanie do ctx w obu miejscach.
- `gra/src/main.ts` (+15/-12): import `computeTradeRouteBuildingBonusByCity`, zmienna `tradeRouteBuildingBonusByCity`, 2× wywołanie po `refreshTradeRoutes`, 2× `getCityBuildingFlags`, 1× przekazanie do `advanceCityEconomy`, 4× `.clear()` — wszystkie 10 znalezionych grepem punktów wpięcia zaktualizowane.
- `gra/src/ui/cityPanel.ts` (+21/-16): import nowej funkcji, `activeTradeRouteCountForCity` liczy tylko trasy z budynkiem, usunięta martwa stała `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE`, 3 miejsca wyświetlania (grid row, formuła, algo bullet) pokazują teraz absolutną kwotę premii (`+X Handlu`) zamiast fałszywego `+X%`.
- `gra/tools/trade-routes-income-test.cjs` (+70/-35): sekcja F rozszerzona o test nowej funkcji (scenariusze a/b/c/d z kryterium 7), sekcja G przepisana na test addytywny (nie mnożnikowy), sekcja H zaktualizowana do nowej sygnatury `advanceCityEconomy`.

TESTY:
- `tsc --noEmit`: 0 błędów.
- `vite build` (outDir poza drzewem repo, C-001): czysty, 846 modułów, build OK.
- `trade-routes-income-test.cjs`: 94 passed, 0 failed (baseline PRZED zmianą, zweryfikowany przez `git stash`: 91 passed, 1 failed — pre-istniejący FAIL H2 rozwiązany przez przepisanie testu na nowy mechanizm, nie przez ukrycie regresji; scenariusze T4 (a)/(b)/(c)/(d) z kryterium 7 dispatchu dodane i zielone).
- `ai-major-economy-test`, `diplomacy-currency-trade-test`, `diplomacy-deposit-trade-test`, `diplomacy-economy-test`, `diplomacy-resource-cyclic-trade-test`, `diplomacy-resource-trade-pick-test`, `diplomacy-tech-trade-e2e-test`, `diplomacy-tech-trade-execute-test`, `diplomacy-tech-trade-test`, `diplomacy-trade-flex-test`, `mennica-uspienie-test`, `owner-economy-test`, `trade-grant-test`, `trade-routes-test`, `zloto-szlak-test`: wszystkie zielone, 0 FAIL.
- `trade-ilosc-test.cjs`: 35 passed, 5 failed — plik NIEDOTKNIĘTY (brak diff), potwierdzone identyczne z pre-istniejącym stanem z dispatchu (5 FAIL: capacityPerRoutePerTurn/limit tury ×3, kon w TRADE_ROUTE_STOCK_FLOW_KEYS ×2).
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — wszystkie zielone.
- `praca-global-default-live-test.cjs` (poza allowlistą, referencjonuje stary parametr pozycyjnie jako `undefined`): sprawdzony, 7/7 PASS — brak regresji mimo zmiany nazwy parametru (pozycyjne wywołanie, bez zmiany zachowania).

BLOKADY: brak.

RUNDY: 1/5 (pierwsza runda licząca się do licznika — runda 1 była BLOCK-bez-kodu, nie zużywa rundy zgodnie z R-PROC-AUTOBOT.md §3a/C-054).

NASTĘPNY KROK: Evaluator, runda 1.

DEPLOY/PUSH: NIE WYKONANO (poza zakresem Operatora — commit + push na branchu roboczym `autobot/HANDEL-T4-Q1`, brak integracji do `main`, brak deployu).
