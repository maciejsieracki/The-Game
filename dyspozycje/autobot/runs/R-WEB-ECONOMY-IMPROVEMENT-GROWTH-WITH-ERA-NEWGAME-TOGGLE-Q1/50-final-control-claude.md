STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-IMPROVEMENT-GROWTH-WITH-ERA-NEWGAME-TOGGLE-Q1
GOAL: ustawienie nowej gry "Wzrost surowców z epoką" (WYŁ. domyślnie = stałe z Kamienia; WŁ. = dawny wzrost).
ZMIANY/COMMIT: kandydat 02a406ddbdcae0972a26e973e3784303b51d6b10; merge-base --is-ancestor 3e978f882 -> TAK. Diff: econ-era-rebalance.ts, main.ts, newGameFlow.ts, 2 testy w gra/tools, raporty operatora/obrony (7 plików, +452/-3), wszystko w allowliście; brak gra-robocza/kanon/WERSJE/rust-port.
TESTY (własne, surowe wyjście): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; toggle 41 ok/0 FAIL; improvement-era-scaling 144/0; econ-era-rebalance 38/0; era-improvement-cost-upkeep 124/0; improvement-cost-owner-era 49/0; live Chromium (CHROME_PATH=/usr/bin/google-chrome) 8 OK/0 FAIL: WYŁ. farma 3/3/3, tartak 50/50/50; WŁ. farma 3/4/5, tartak 50/75/113.
OCENA ZARZUTÓW: (1) brak Chromium - ODDALONY, dowiedziony żywo i powtórzony przeze mnie. (2) pokrycie okablowania - częściowo: start pokryty żywo, migrateAdvanced/restoreGameFromSave pinowane źródłowo (G8); żywe wczytanie zapisu NIE ZMIERZONO - uwaga. (3) brak EN/podsumowania kreatora - uwaga, spójne z resztą ustawień (wiersz tylko PL). Jedno źródło prawdy: isEraRebalanceImprovementFlat; stare zapisy/brak pola = false.
BLOKADY: brak. NIE ZMIERZONO: żywe wczytanie zapisu, DOM kafelka/HUD, fishing-boats-666 (znany czerwony). Hook probeWzrostYields/parametr startNewGame w main.ts jest testowy i nieszkodliwy.
RUNDY: FC po rundzie 2/5.
UWAGI-DLA-ORKIESTRATORA: rozważyć osobny temat na EN/podsumowanie kreatora i żywy test wczytania zapisu.
NASTĘPNY KROK: integracja orkiestratora (FF/merge, rejestry), osobna bramka deploy.
DEPLOY/PUSH: NIE WYKONANO
