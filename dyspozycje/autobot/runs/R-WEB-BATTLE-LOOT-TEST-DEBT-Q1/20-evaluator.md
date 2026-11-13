STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LOOT-TEST-DEBT-Q1
MODEL: requested independent evaluator; runtime model metadata unavailable
WYNIK: Niezależnie potwierdziłem koszt Brązu Włócznika na podstawie `gra/data/units.json` (`Epoka: "Brąz"`, `Surowiec: "Brąz"`, `Surowiec (ilość): 25`) oraz rzeczywistego `unitStockCost()` z `gra/src/game/building-stock-cost.ts`. Funkcja przekazuje ilość do `scaleCostByEpoch`, a wspólny mnożnik epoki Brązu wynosi ×2; bezpośrednie wywołanie helpera na rekordzie Włócznika zwróciło `{"braz":50}`. `gra/src/game/battle-loot.ts` liczy łup przez tę samą funkcję `unitStockCost()`, zgodnie z aktualną regułą pełnego kosztu rekrutacji jako łupu. Oczekiwania 50, 100 i 25 wynikają więc z bieżących zasad i liniowego skalowania łupu.

W diffie `gra/tools/battle-loot-test.cjs` zmieniono wyłącznie cztery przestarzałe oczekiwania: łup Brązu Włócznika `2 → 50`, format notki `+2 → +50`, dwa Włóczniki `4 → 100` i 50% łupu `1 → 25`. Żadna asercja nie została usunięta, osłabiona ani zastąpiona sprawdzeniem warunkowym; pozostałe asercje są zachowane.

WERYFIKACJA: z `/workspace/main-integration-20261029/gra` uruchomiłem `node tools/battle-loot-test.cjs`; wynik `battle-loot-test: 12 pass, 0 fail`, exit code `0`. Dodatkowe bezpośrednie wywołanie rzeczywistego helpera na rekordzie Włócznika zwróciło epokę `Brąz`, bazowe `25` i koszt `{braz: 50}`. `git diff --check -- gra/tools/battle-loot-test.cjs` zakończył się bez uwag.

BAZA: `b477ecb70196f18d28857e112e25860e710600a6`.
OBRONA: POMINIĘTA — BRAK ZARZUTÓW.
