STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CORRUPTION-REDUCTION-PALACE-TIERS-TRIBUNAL-Q1
GOAL: Pałac II i III dają −30% korupcji jak Pałac I, a Trybunał dostaje −30% jak Pretorium.
ZMIANY/COMMIT: commit obrony R1 (bazuje na 553bb26fa); zmiana: wyłącznie przeformatowanie komentarza nad KORUPCJA_REDUKCJA_SUFIT w gra/src/game/economy.ts (zarzut 2, kosmetyka). Kod i dane bez zmian.

ODPOWIEDZI NA ZARZUTY:
1. Allowlista: PRZYJMUJĘ jako potwierdzenie, bez poprawki. Diff 14f2af1b0..553bb26fa obejmuje tylko economy.ts, nowy test .cjs i raport operatora. Stare testy i JSON nietknięte.
2. Komentarz w jednej, długiej linii: PRZYJMUJĘ. Zdanie o sufitie 0.60 przełamane na linie komentarza, treść bez zmian.
3. Sufit 0.60 realnie osiągalny (informacja): ODRZUCAM potrzebę DECISION_REQUIRED. Reguła jest jednoznaczna w kodzie (Math.min(0.60, suma)) i zgodna z decyzją właściciela. Potwierdzenie z właścicielem pozostaje po stronie orkiestratora.
4. Pretorium bez parametru w JSON: ODRZUCAM jako uwagę do zmiany. Zgodnie z dispatchem używamy tego samego mechanizmu stałych w kodzie (KORUPCJA_REDUKCJA_NA_BUDYNEK = 0.30, KORUPCJA_REDUKCJA_SUFIT = 0.60). Brak nowych pól JSON.
5. Nieaktualne opisy w buildings.json (trybunal opis/uwagi/top3; palac, palac_ii, palac_iii opis/top3): PRZYJMUJĘ jako zgłoszenie, bez zmian. Zgodnie z dispatchem punkt D; top3 i opis nie były ruszane. Zostają dla wdrożenia kart budynków.

TESTY (worktree, npm ci w gra/, TypeScript 5.9.3):
- tools/corruption-reduction-palace-tribunal-test.cjs: PASSED 34 / FAILED 0
- tools/korupcja-test.cjs: PASSED 18 / FAILED 0 / TOTAL 18, ALL GREEN
- npx tsc --noEmit: bez błędów (exit 0)
- Zmiana dotyczy tylko komentarza. logic-test 213/213, ai-test 289/0, owner-economy 20/0, grupy-budynkow 84/0, building-happiness 14/0 przeszły na 553bb26fa (wynik Evaluatora); nie były ponownie uruchamiane po zmianie komentarza.
- NIE_ZMIERZONO: npm run build/dev (zakazane), weryfikacja w przeglądarce (zmiana niewizualna).
- node_modules w gra/ usunięty po testach.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (runda 2) na SHA obrony, potem Final Control
DEPLOY/PUSH: NIE WYKONANO
