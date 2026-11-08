STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-PLAYER-PARITY-FIXES-Q1
GOAL: Naprawic asymetrie AI vs gracz (seed suwakow, dyplomacja, miasta-panstwa, fallback ownerId===0) bez ruszania armii AI, progu zakupu ani ai_rush_jednostka_rezerwa_zlota.
ZMIANY/COMMIT: kod do integracji = 1815bba39572b7a4eb296cfa86760c3f0a0e1eed (baza origin/main 59868d84f; 8de6a3bc4 -> 1815bba39 zmienia tylko gra/tools/ai-player-parity-fixes-test.cjs). Allowlista zgodna: ai.ts, turn-economy.ts, main.ts, nowy test, 01-operator-r1.md. Zero zmian w gra-robocza, WERSJE.md, rust-port, render, ai-params.json. git diff --check czysto.
TESTY (odtworzone samodzielnie na 1815bba39, npm ci, node_modules usuniete): nowy test 44/44; logic-test 213/213; tsc --noEmit czysto; ai-test 274 passed / 20 failed = identycznie jak baza (Evaluator: lista FAIL identyczna, src bez zmian od 8de6a3bc4).
ROZSTRZYGNIECIE ZARZUTOW:
1. Poprawka 3 tylko testy tekstowe: ODDAL. purchaseRecruitmentUnit to closure w main.ts (bez DOM nieimportowalna); asercje wiazania call-site padaja na bazie (12 FAIL), dodana macierz 9 kombinacji. Ograniczenie jawnie zgloszone.
2. Utrzymanie miast-panstw na globalnym _menuDifficulty: ODDAL do osobnego tematu (R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1) - wymaga trudnosci per wlasciciel w advanceCityEconomy, poza allowlista i zakresem (zakup + produkcja).
3. Pomiar T2-T10 bez live Chromium: ODDAL. Obrona zmierzyla T1-T10 przez lustro petli suwakow AI i skorygowala raport operatora (suma T1-T10: Skarb 70->20, Nauka 40->70, Zamoznosc 0->20). Efekt T2+ to zamierzony wynik normalizacji (AI dazy do 60/20/20), nie decyzja produktowa. Pomiar live nie wykonany - nota.
4. Poprawka 4 konsolidacja do legacyEraForOwner: ODDAL (dispatch dopuszcza "usun lub uzasadnij", uzasadnienie w komentarzu, testy pilnuja resolvera).
Poprawka 2 (dyplomacja): potwierdzone - platnik sprawdzany przed add(), podloga 0 kasowala tylko dlug odbiorcy AI; brak podstaw do DECISION_REQUIRED.
BLOKADY: brak. Zero NAPRAW.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora 1815bba39 na main. Wzgledem origin/rust-port/parity-v2: roznice parity-v2 vs main nie dotykaja gra/src ani gra/tools, wiec kolejnosc dowolna; rekomendacja: najpierw main, parity-v2 pozniej bez konfliktu. Osobny temat: CITYSTATE-UPKEEP-DIFFICULTY.
DEPLOY/PUSH: NIE WYKONANO
