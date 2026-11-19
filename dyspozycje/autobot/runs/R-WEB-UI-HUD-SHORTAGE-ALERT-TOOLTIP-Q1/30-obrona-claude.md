STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/raportowanie, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-SHORTAGE-ALERT-TOOLTIP-Q1
GOAL: alert niedoboru i tooltip „Brutto · netto” jako jedno źródło z netto HUD (z wejściami konwerterów); diagnoza Ceramika netto 77 vs Δstanu 67 (bez zmiany ekonomii).
ZMIANY-COMMIT: patrz sekcja SHA w odpowiedzi orkiestratora (commit obrony na gałęzi worktree, baza d6fe0a2ac). Pliki: gra/src/main.ts (2 komentarze: ~23920 i ~23926 — zaktualizowane do netto HUD/resourceIsShortage), gra/src/ui/hud.ts (komentarz pola surowceNiedoborLabels, ~238), gra/tools/hud-shortage-alert-converter-test.cjs (sprzątanie katalogu tymczasowego TMP po biegu i po błędzie). Kod logiki (resource-gross-net.ts, main.ts alert/etykiety/chip, tooltip) BEZ zmian względem ac1885068.

ODPOWIEDZI NA ZARZUTY EVALUATORA
1. Ceramika nieodtworzona w teście/biegu — PRZYJMUJĘ. Diagnozę traktuję jako wskazaną w kodzie hipotezę (nie pomiar). Sprawdzone odczytem: turn-economy.ts:2067 wywołuje paySpichlerzDrainForCity(..., dryRun=false); building-resource-gate.ts:432–437 odejmuje ceramika z magazynu państwa (deductBuildingStockCostAcrossCities, gdy !dryRun). Wartość 10/t zgodna z data/econ-params.json „budynek_spichlerz_zuzywa_ceramika” (normal=10). NIE ZMIERZONO: test czysty i bieg dymny seed 4242 nie zostały wykonane w tej rundzie.
2. Nieaktualne komentarze (main.ts ~23920, hud.ts ~238) — PRZYJMUJĘ, NAPRAWIONE w tym commicie.
3. resStateOf w empireDetailPanel.ts:3408 (r.ratePerTurn < 0) — PRZYJMUJĘ jako niespójność, NIE NAPRAWIONE: plik jest poza allowlistą dispatchu (gra/src/game/resource-gross-net.ts, gra/src/main.ts, gra/src/ui/hud.ts). Zmiana wymaga decyzji orkiestratora (rozszerzenie allowlisty albo osobny temat R-WEB-*). Propozycja: resStateOf używa resourceIsShortage(r).
4. Słabe pokrycie wiązania main.ts/hud.ts — PRZYJMUJĘ jako ograniczenie. Sekcja C testu pozostaje statyczna (regex). Wiersz tooltipu w surowceChipTitle i wywołanie w main.ts NIE są wykonywane przez żaden test. NIE ZMIERZONO w przeglądarce ani bundlem vite. Nie dodano testu runtime (wymagałby renderowania HUD; poza zakresem tej rundy).
5. Zmiana semantyki niedoboru — PRZYJMUJĘ jako informację dla właściciela (bez zmiany kodu, bo jest zgodna z dispatchem „to samo netto co HUD”). Konsekwencje: (a) netto jest zaokrąglane (Math.round), więc deficyt ułamkowy np. −0,4 daje netto 0 i BRAK alertu (dawny ratePerTurn<0 alarmował); (b) niedobór obejmuje zużycie (usage: obywatele+budynki+wojsko), nie tylko wejścia konwerterów. Do decyzji właściciela (ABC), czy zostawić.

TESTY (surowe wyniki z tej rundy, po poprawkach):
- node ./node_modules/typescript/bin/tsc --noEmit: exit 0 (brak wyjścia).
- node tools/hud-shortage-alert-converter-test.cjs: RESULT: 17 ok, 0 FAIL, exit 0.
- node tools/resource-gross-net-converter-inputs-test.cjs: RESULT: 18 ok, 0 FAIL.
- node tools/hud-resource-deficit-red-test.cjs: 41 pass, 0 fail, exit 0.
- node tools/hud-gross-net-rest-test.cjs: OK (820 ok, 0 fail), exit 0.
- node tools/hud-topbar-grid-gross-net-test.cjs: OK (1150 ok, 0 fail), exit 0.
- Nie uruchomiono ponownie logic/tech-tree/research/combat/ai-economy (zmiany są komentarzami i sprzątaniem testu; kod logiki nie zmieniony względem ac1885068, który Operator i Evaluator już zbadali).
- Nie uruchomiono bundla vite, Chromium ani biegu dymnego seed 4242 (NIE ZMIERZONO).

SPRZĄTANIE: usunięto 8 katalogów /tmp/hud-shortage-alert-* pozostałych po poprzednich biegach testu (test ich nie kasował). Test od teraz sam kasuje swój katalog TMP. Stan dysku przed startem: / 15G wolne (63% użycia).
UWAGA: w worktree istnieje nieśledzony symlink gra/node_modules -> worktree wf_fbb87104-1ca-1/gra/node_modules (tylko do uruchomienia tsc/testów, nie commitowany). Do usunięcia przy sprzątaniu worktree przez orkiestratora.

BLOKADY: brak dla tej rundy; pozycja 3 wymaga decyzji orkiestratora (allowlista), pozycja 5 wymaga decyzji właściciela (ABC).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator ponownie (runda 2) i Final Control; decyzja orkiestratora w sprawie empireDetailPanel.ts:3408 (zarzut 3); ABC do właściciela: semantyka niedoboru (zaokrąglenie netto, zużycie w niedoborze) oraz drain Spichlerza w netto (diagnoza Ceramiki).
DEPLOY/PUSH: NIE WYKONANO
