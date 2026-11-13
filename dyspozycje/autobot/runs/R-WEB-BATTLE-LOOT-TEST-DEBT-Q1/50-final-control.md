STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LOOT-TEST-DEBT-Q1
GOAL: Niezależnie potwierdzić, że cztery skorygowane oczekiwania testu łupu odpowiadają aktualnemu kosztowi Włócznika oraz że zmiana nie osłabia testu.

ZMIANY/COMMIT: Final Control bez zmian w kodzie gry. Sprawdzony diff Operatora na `gra/tools/battle-loot-test.cjs`: cztery oczekiwane wartości zmieniono na 50, +50, 100 i 25; dodano komentarz o bazowych 25 Brązu i mnożniku ×2. Pozostałe asercje i ich warunki pozostały bez zmian. Diff ograniczony do tego pliku w zakresie tematu; HEAD w badanym drzewie `7bf9f074070bd3891ba53e33de830726ca1d40ab`, baza zapisana w dispatchu `b477ecb70196f18d28857e112e25860e710600a6`.

WERYFIKACJA ŹRÓDŁA: `gra/data/units.json` zapisuje Włócznika jako epokę `Brąz`, surowiec `Brąz`, ilość `25`. `gra/src/game/building-stock-cost.ts::unitStockCost()` przelicza ten koszt przez `scaleCostByEpoch(ilosc, unit.Epoka)`; wspólny mnożnik epoki Brązu w `epochCostMultiplier()` wynosi ×2, więc rzeczywisty koszt magazynowy wynosi `{ braz: 50 }`. `gra/src/game/battle-loot.ts::computeBattleLoot()` importuje i wywołuje właśnie `unitStockCost()`, więc łup korzysta ze wspólnego helpera kosztu jednostki. Dwie jednostki dają 100, a próg 50% daje 25.

TESTY (z katalogu `gra/`):
- `node tools/battle-loot-test.cjs` — `battle-loot-test: 12 pass, 0 fail`, exit 0.
- `git diff --check -- tools/battle-loot-test.cjs` — czysto, exit 0.
- Kontrola zakresu — jedyną zmienioną ścieżką tematyczną jest `gra/tools/battle-loot-test.cjs`; pliki produkcyjne nie zostały zmienione. Liczba asercji pozostaje 12; nie usunięto asercji, nie zmieniono ich warunków ani nie dodano warunkowego pomijania.

OGRANICZENIA: To kontrola testu jednostkowego i statycznego przepływu helpera. Przeglądarki ani pełnego buildu nie uruchamiałem; nie są wymagane dla zmiany oczekiwań w teście `.cjs`.

BLOKADY: brak.
RUNDY: Final Control 1/5 (Operator PASS, Evaluator PASS; brak zarzutów wymagających Obrony).
NASTĘPNY KROK: Integracja orkiestratora zgodnie z allowlistą i bieżącym stanem Git.
DEPLOY/PUSH: NIE WYKONANO.
