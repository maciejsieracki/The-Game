STATUS: DECISION_REQUIRED
DOMAIN: GAME (zachowanie AI, nowa funkcja)
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: stały garnizon min. 1 jednostki bojowej w każdym mieście AI, także w pokoju, poza armią; wariant C (rezerwacja z priorytetem); pomiar PRZED/PO w grze.
ZMIANY-COMMIT: baza 8889a7751 (obrona r3). Pliki: gra/src/main.ts (import uporządkowany, bramka priorytetu = isGarrisonPriorityPurchase, literówka naprawiona), gra/src/game/ai-city-garrison.ts (+isGarrisonPriorityPurchase), gra/tools/ai-city-garrison-min-one-test.cjs (+H6, H6b, H7). SHA: patrz pole sha.
ODPOWIEDZI NA ZARZUTY FC:
1. PRZYJMUJĘ, NIE ZROBIONE: wykluczenie garnizonu z homeDefenderPool wchodzi w konflikt z zasadą (g) dispatchu (garnizon liczy się do obrońców miasta). Wymaga decyzji właściciela (pytanie ABC).
2. PRZYJMUJĘ, CZĘŚCIOWO: armyMerge, marsze wojenne, all-in, wysyłanie do generała, odsiecz i zwiad nadal NIE wykluczają garnizonu. Próba z r2 psuła ai-war-city-garrison-test (17/4); nie zdiagnozowana, nie powtórzona.
3. PRZYJMUJĘ, NIE ZROBIONE: próg army-concentration sc.4 pozostaje 9 (r2: klastrów=9 przy progu 6). Test G7 nie wzmocniony. Brak nowego dowodu.
4. PRZYJMUJĘ: pomiar PRZED/PO w grze NIE ZMIERZONO (brak uruchomienia Chromium w tej rundzie).
5. ZROBIONE: isGarrisonPriority ogranicza się do candId === EMPTY_CITY_GARRISON_UNIT_ID (Wojownik). Drozsze jednostki nie omijają runway/rezerwy. Test H6/H6b/H7 w ai-city-garrison-min-one-test.cjs (16/0).
6. PRZYJMUJĘ, NIE ZMIERZONO: aiGarrisonGoldReserve liczy cityNeedsGarrison per kandydat (O(miasta x jednostki) x kandydaci). Ryzyko zamrożenia ekonomii przy ~80 pustych miastach nie jest zmierzone. Nie zoptymalizowano.
7. ZROBIONE: zdublowany import z './game/ai' scalony w jeden; literówka formatowania (`loadAiPurchaseReserveParams,decideAIEconomySliders`) poprawiona.
TESTY (liczby z surowego wyjścia, worktree 8889a7751 + ta runda):
- npx tsc --noEmit: exit 0
- ai-city-garrison-min-one-test: 16 passed, 0 failed
- ai-war-city-garrison-test: 21 PASS, 0 FAIL
- army-concentration-test: 56 passed, 0 failed
- ai-home-defense-vs-barbarians-test: 46 passed, 0 failed
- ai-war-defend-home-test: 30 passed, 0 failed
- siege-ai-test: 17 ok, 0 fail
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; combat-test: All sanity checks passed
- POMIAR: NIE ZMIERZONO
BLOKADY: (1) decyzja właściciela: homeDefenderPool vs zasada (g); (2) armyMerge/marsze/all-in/generał/odsiecz bez wykluczenia; (3) pomiar PRZED/PO w grze; (4) próg sc.4 i G7; (5) koszt i ryzyko zamrożenia rezerwy (pkt 6).
RUNDY: 3/5 (runda obrony 3 Operatora).
NASTĘPNY KROK: FC ocenia main.ts i predykat; przed deployem wymagany pomiar PRZED/PO (seed 4242, t30/t60) i decyzja właściciela dla homeDefenderPool.
UWAGI-DLA-ORKIESTRATORA: npm ci --ignore-scripts wykonany w worktree (gra/node_modules zostawiony). Dysk / : 15 GB wolne.
DEPLOY/PUSH: NIE WYKONANO
