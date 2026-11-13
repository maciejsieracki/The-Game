STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-AUTOIMPROVE-STAGES2-Q1
GOAL: Final Control — werdykt końcowy po Operator R1, Evaluator R1 (PASS-WITH-NOTES), Obrona R1 (ec0ab1370).
ZMIANY/COMMIT: SHA do integracji = ec0ab1370 (baza 0f9f60a10 + merge a6bd3712c = 77e554803; kod 40e9fc240, raport d6f40e7e7, obrona ec0ab1370). Final Control nie zmienia kodu; ten raport to osobny commit docs.

Allowlista: git diff --name-only 0f9f60a10 ec0ab1370 poza dyspozycje/ = gra/src/game/{ai,auto-improvements}.ts + 4 testy gra/tools. Brak main.ts, gra-robocza, WERSJE.md, rust-port.

ROZSTRZYGNIĘCIE ZARZUTÓW
1. Luka testu sztywnego budżetu (KROK 0 / FAZA 2 / FAZA 0): ODDAL (naprawione w obronie). Blok s5 w autoimprove-stages-q1-test.cjs. Zweryfikowałem własną mutacją: usunięcie capu KROK 0 (auto-improvements.ts:1414) -> test pada (K1 i K2, w tym pct 2 x pula 100). Log obrony mutacje-r2-obrona.txt: M8 (FAZA 2, l.1503/1505) 4 FAIL, M9 (FAZA 0, l.1152/1168) 1 FAIL. Nie powtarzałem M8/M9 samodzielnie; log spójny z kodem (te linie zawierają effectiveCityCap).
2. ai.ts poza literą allowlisty: ODDAL, jawnie ZAAKCEPTOWANE. Dispatch (DOPRECYZOWANIE BUDŻETU pkt 2) każe usunąć każdy limit % dla AI, w tym MAX_PROCENT_PULI_IMPERIUM w ai.ts; sprzeczność wewnętrzna rozstrzygnięta późniejszym szczegółowym zapisem. Zmiana minimalna (2 fallbacki + import), w grze bez skutku (main.ts już daje AI 100%).
3a. Test 11 ai-improvements (tautologia <=80): ODDAL (naprawione: asercje spent > floor(80*50%), 56/0).
3b. ai2 'I' (obóz): ODDAL — obóz nie ma gdzie powstać na heksach bez obywateli; D-R5-1/2 pokryte w s3/s4.
4. Z1 dla D-R5-1: ODDAL jako założenie dozwolone przez dispatch; DO DECYZJI CZŁOWIEKA = ABC-1 (orkiestrator): A zostaw Z1 (obowiązuje), B ścisła (tartak AI 123 -> 26), C ścisła tylko dla gracza z wycinką ON. Stan Drewna: NIE_ZMIERZONO.
5. Brak saveload-praca-pool-live: ODDAL (wymaga builda, zakazany; dispatch: "jeśli czas").
NAPRAW: brak. => PASS-WITH-NOTES.

TESTY (własne, na ec0ab1370, node_modules z npm ci --ignore-scripts, usunięte po etapie):
tsc --noEmit EXIT=0; autoimprove-stages-q1 269/0; ai-improvements 56/0; auto-improvements 46/0; ai-food-improvement-priority-stages 13/0; ai2-heks-po-heksie 37/0; hodowla-las 113/0; ai4-popyt-obywatele 55/0; wyrab-rzeka-krok0 3/0; ai-ulepszenia-malo-budowane 13/0; city-clears-forest 18/0; fort-outpost-hard-territory 80/0; spichlerz-hud-params-parity 66/0.
Nie powtórzone przeze mnie (zaufane: logi gate-r1 EXIT=0 + Evaluator, kod produktu niezmieniony od 40e9fc240): wyrab-rzeka r2/d1, diplomacy 148, war-era-counter 82, unit-owner-emblem-ring 15.
Czerwone już na bazie (poza zakresem): ai-major-economy, tartak-oboz-wyscig-race, ai-praca-split-parity 23/4, food-hodowla 20/4, oboz-lowiecki-las 72/19, praca-jeden-podzial-kontrakt 635/2.

DO ORKIESTRATORA: ABC-1 (powyżej), ABC-2 (limit 3 budów/etap/miasto + bramka wejścia AI), ABC-3 (wskaźnik UI Pracy, empireDetailPanel.ts:1376-1412).
KOLEJNOŚĆ: ec0ab1370 bazuje na origin/main 0f9f60a10 i dotyka wyłącznie gra/ (linia WEB); origin/rust-port/parity-v2 dotyka rust-port/. Brak konfliktu plików, integracja niezależna; zalecane najpierw main (WEB), potem parity-v2 bez zmian.
BLOKADY: brak
RUNDY: 1/5 (FC po Obronie R1)
NASTĘPNY KROK: integracja orkiestratora (merge ec0ab1370 + commit tego raportu), bramki na wyniku, READY_FOR_DEPLOY po ABC.
DEPLOY/PUSH: NIE WYKONANO
