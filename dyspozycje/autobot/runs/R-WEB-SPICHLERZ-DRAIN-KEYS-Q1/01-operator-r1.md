STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-SPICHLERZ-DRAIN-KEYS-Q1
GOAL: zużycie Spichlerza (Ceramika I, Ceramika II, Sól II) czytane z econ-params.json wg trudności; wartości 25/25/25 bez zmian; zachowanie gry identyczne.
ZMIANY/COMMIT: kod 1c7c17e92 (branch lokalny web/R-WEB-SPICHLERZ-DRAIN-KEYS-Q1; baza: wip b928b687f na origin/main 4d1916f2c). Pliki: gra/src/game/building-resource-gate.ts (naprawa odwróconego ternary I/II w spichlerzCeramikaDrainAmount), gra/data/econ-params.json (tylko opisy 3 kluczy, wartości nietknięte; odwołania :418/:1375/:1407/:1548/:2479), gra/tools/spichlerz-drain-keys-test.cjs, gra/tools/owned-building-inactive-test.cjs (z WIP). Logi bramek: runs/R-WEB-SPICHLERZ-DRAIN-KEYS-Q1/gates-head/ i gates-base/ (gate-*.txt, jedna linia EXIT=).
TESTY:
- tsc --noEmit: EXIT=0.
- spichlerz-drain-keys-test: 44 pass, 0 fail (golden N-1/N/N+1, odczyt kluczy per trudność, fallback).
- Mutacja A (ignorowanie JSON, fallback 25): test pada (wiele FAIL).
- Mutacja B (zamiana I<->II): test pada.
- Regresja bramek main 4d1916f2c vs head: 32 testy, diff wyników = 0 linii. Czerwone identycznie na main: spichlerz-deficyt-scalenie 54/4, spichlerz-widocznosc 37/8, spichlerz-wzrost 2/7, resource-usage-breakdown 98/2, hex-plony-magazyn 10/4, mennica-magazyn 34/7, deposit-building-gate 46/1, pr141-matrix-only-economy EXIT=1, szczescie-przebudowa-skali EXIT=1, cities-buildings-production-owner-contract EXIT=1, ai-major-economy EXIT=1.
- Zielone: diplomacy-test 148/148, war-era-counter 82/82, unit-owner-emblem-ring 15/15, converters 49/49, converter-era-scaling 87/87, owner-economy 20/20, owned-building-inactive 4/4, owned-building-detail-side 17/17, spichlerz-panel-food-parity 11/11, spichlerz-cap-citypanel 12/12, magazyn-era-scaling 58/58, empire-food-b5 34/34, empire-skarbiec-bilans 11/11, building-resource-visibility 15/15, building-stock-visibility 7/7, r-wzrost-szczescie 59/59, wonder-yields 11/11, auto-wyzywienie-flow-balance 17/17, logic-test PASS, sawmill-quarry-50 EXIT=0, hotseat-etap6c EXIT=0.
BLOKADY: gra/src/ui/cityPanel.ts:1281 (paySpichlerzDrainForCity bez params) i :9278 (resolveOwnedBuildingInactiveStatus bez drainParams) używają fallbacku 25 zamiast JSON. Przy obecnych danych identyczne; po strojeniu JSON podgląd HUD rozjedzie się z grą. Plik spoza allowlisty: NIE zmieniony (ZAŁOŻENIE: osobny temat lub rozszerzenie allowlisty).
ZAŁOŻENIA: semantyka zachowana: jedna wypłata ceramiki na miasto (klucz II gdy jest Spichlerz II, inaczej I); sól imperium-wide wg solII. Fallback 25 udokumentowany (brak/NaN/ujemny/null/brak raw).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (niezależny) -> Final Control; rozstrzygnięcie luki cityPanel.ts (osobny temat).
DEPLOY/PUSH: NIE WYKONANO
