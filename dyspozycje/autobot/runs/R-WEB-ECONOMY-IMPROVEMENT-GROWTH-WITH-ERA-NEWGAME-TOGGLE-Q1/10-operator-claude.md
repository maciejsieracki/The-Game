STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-IMPROVEMENT-GROWTH-WITH-ERA-NEWGAME-TOGGLE-Q1
GOAL: ustawienie nowej gry „Wzrost surowców z epoką": WYŁ. (domyślnie) = stałe wartości z Kamienia w każdej epoce; WŁ. = dawny wzrost ulepszeń z epoką. Zakres: plony pola ulepszenia i produkcja surowców ulepszeń.
ZMIANY/COMMIT: baza origin/main 3e978f882. Allowlista: gra/src/game/econ-era-rebalance.ts (stan aktywny, normalizacja, isEraRebalanceImprovementFlat z bramką WŁ.), gra/src/ui/newGameFlow.ts (pole opcjonalne wzrostSurowcowZEpoka, domyślnie false, migracja, wiersz w Zaawansowanych), gra/src/main.ts (applyMenuParams i restoreGameFromSave; zapis przez istniejące meta.newGameParams), gra/tools/improvement-growth-toggle-test.cjs (nowy). SHA: czubek commita w polu sha.
TESTY:
- tsc --noEmit: exit 0
- improvement-growth-toggle-test.cjs: 37 ok, 0 FAIL (mutanty M1-M4 czerwone)
- improvement-era-scaling-test: 144 PASS, 0 FAIL
- econ-era-rebalance-test: 38 ok, 0 FAIL
- era-improvement-cost-upkeep-test: 124 pass, 0 fail
- improvement-cost-owner-era-test: 49 pass, 0 fail
- kamieniolom-kamien-epoka-test: 37 PASS, 0 FAIL
- fishing-boats-666-test: 16 OK, 6 FAIL (oczekiwane +1/+2 Brąz/Żelazo przy legacy). Test pinowany do dawnego wzrostu; domyślna ścieżka (WYŁ. + rebalans ON) jest taka sama jak przed zmianą, więc to nie regresja tej zmiany. Porównania z bazą NIE ZMIERZONO; wpis w TEST-DEBT (#37).
- NIE ZMIERZONO: logic 213, tech-tree 20, research 33, unit-replace 21, combat 6 (nie uruchamiane w tej rundzie).
- NIE ZMIERZONO: dowód na żywym Chromium (farma 4 / tartak 75 przy WŁ.; 3 / 50 przy WYŁ.). Nie wykonano w tej rundzie.
BLOKADY:
- Chromium: NIE ZMIERZONO (patrz wyżej).
- ZAŁOŻENIE: próbka jednostek „w rekrutacji" = po jednej jednostce z epok Kamień/Brąz/Żelazo z units.json (z żywnością > 0), zgodnie z prośbą właściciela, żeby nie mnożyć macierzy; pełnej macierzy nie mierzono.
- ZAŁOŻENIE: przełącznik działa tylko przy włączonym rebalansie (eraRebalansAktywny); przy rebalansie OFF ścieżka legacy (wzrost) bez zmian.
- ZAŁOŻENIE: brak wpisu EN w i18n (wiersz „Trafienia" też go nie ma); brak pozycji w podsumowaniu kreatora.
- Spójność wyświetlania: hexContextTooltip.ts i economy.ts wołają te same funkcje (improvementBonusForKey / improvementYieldForEra / resourceProductionAmountForEra), więc nie wymagają zmian; improvementAdapter.ts i resource-gross-net.ts nie mają własnej logiki epok.
RUNDY: 1/5
NASTĘPNY KROK: Final Control: dowód na żywym Chromium (WŁ./WYŁ.) i pozostałe bramki z listy.
DEPLOY/PUSH: NIE WYKONANO
