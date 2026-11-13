STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-TAX-SLIDER-DEFAULT-PANEL-NOT-EQUAL-Q1
GOAL: suwaki Skarb/Nauka/Zamożność w „DOMYŚLNY PODZIAŁ PODATEK” (i w panelu miasta) mają kropkę i wypełnienie zgodne z własną wartością na wspólnej skali 0–100%.

DIAGNOZA: suwak Nauki miał atrybut max=60 (MAX_PROCENT_NAUKA) przy max=100 pozostałych. Kropka i wypełnienie liczone względem własnego zakresu, więc Nauka 50% = 83% toru (Skarb 50% = 50%). To nie regresja THUMB-ALIGN (kropka = koniec wypełnienia była zachowana), tylko niespójna skala toru.
NAPRAWA: max=100 dla wszystkich suwaków (empireDetailPanel.ts: renderDefaultHandelSplitSection, renderSkarbiecTaxSplitSection; cityPanel.ts: suwaki override w panelu miasta). Limit Nauki 60% nadal egzekwuje adjustHandelSplit (clamp + reset value w handlerze input), logika gry bez zmian. Usunięto nieużywane importy MAX_PROCENT_NAUKA z obu plików UI.

ZMIANY/COMMIT: gra/src/ui/empireDetailPanel.ts, gra/src/ui/cityPanel.ts, nowy gra/tools/tax-slider-default-panel-scale-test.cjs, ten raport. SHA: patrz commit na gałęzi worktree-wf_44ddbc27-e0d-1 (baza origin/main 8718bbd26). Bez zmian w buildings.json/WERSJE.md/gra-robocza.
TESTY:
- tax-slider-default-panel-scale-test.cjs: 3 PASS / 0 FAIL (Chromium, 10 kombinacji x widok szeroki/wąski x render/drag; max odchyłka 0,4 px; równe wartości Skarb/Nauka = równe pozycje; mutacja max=60 daje FAIL: 50 pomiarów >1 px, max 132 px).
- tax-slider-thumb-align-real-render-test.cjs (istniejący): 3 PASS / 0 FAIL.
- adjust-handel-split-suma-test.cjs: 46 PASS / 0 FAIL.
- Weryfikacja wizualna: zrzuty przed/po (40/40/20): przed Nauka 40% kropka ~66% toru, po ~40% jak Skarb. Zrzuty w scratchpadzie sesji (before.png/after.png), nie w repo.
- NIE_ZMIERZONO: pełny build/dev gry (zabronione), test panelu miasta w przeglądarce (zmiana tylko atrybutu max, brak własnego wypełnienia w tym komponencie), tsc całego projektu.
BLOKADY: brak
RUNDY: 1/5 (numeracja dispatchu: start od nowa po DODATKU 1)
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
