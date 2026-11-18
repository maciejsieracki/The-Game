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

## OBRONA r3 (Operator HAIKU 5.5, baza c8be716df)
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: stały garnizon min. 1 jednostka bojowa w każdym mieście AI także w pokoju; garnizon nie dołącza do armii.
ZMIANY-COMMIT: tools/ai-city-garrison-min-one-test.cjs -- test C4 (dyskryminujący: pokojowa konsolidacja/front-merge, ai.ts ~4322). Kod gry bez zmian w tej rundzie.
TESTY: tsc --noEmit 0; min-one 23/0 (mutacja usunięcia `!cityGarrisonUnitIds.has` ai.ts:4322 -> 22/1, czerwień C4, źródło przywrócone git checkout); ai-home-defense-vs-barbarians 46/0; army-concentration 57/0; ai-war-city-garrison 21/0. Oryginalne pliki z bazy 1484bdc1e na kodzie kandydata: home-defense-vs-barbarians 38/2 (FAIL T2(b), T4(b)); army-concentration 56/0.
POMIAR W ŻYWEJ GRZE: NIE ZMIERZONO w tej rundzie (brak nowego biegu; liczby z 10-operator/dowody-r3 nie są zmieniane).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Cel niespełniony (t30 pokój 32/90, t60 49 pustych). Nie naprawiono.
2. PRZYJMUJĘ. Przyczyna nieudiagnozowana. Hipoteza (NIE ZMIERZONA): decyzja rekrutacji działa (`emptyCityGarrisonRecruitIds`, ai.ts:1946, zwraca każde puste miasto), więc blokada jest w warstwie zakupu (main.ts ~47000: runway/NNS hold/kolejka budynków), nie w regule garnizonu. Wymaga pomiaru z logiem decyzji zakupu.
3. PRZYJMUJĘ. Wzrost odejść 73 -> 162 nie wyjaśniony. Kod r3 blokuje marsz garnizonu po wioski/patrol/idle (ai.ts ~4475), ale brak pomiaru po tej zmianie.
4. PRZYJMUJĘ częściowo. Dodano C4 (front-merge pokojowy, mutacja czerwona). NIE pokryte testem dyskryminującym: 3 miejsca kampanii wodza (ai.ts ~5359–5470) i csGarrisonUnitIds (państwa-miasta, ai.ts ~5703+). Otwarte.
5. ODRZUCAM część z dowodem. (a) Zmiana progu sc.4 była wymagana dispatchem r3 pkt 4 (wzmocnij G7/próg albo uzasadnij); obecny test 57/0, dowód klastrów poza miastami <=6. (b) Oryginalne T2/T4 na kodzie kandydata dają FAIL 2 (teza wymaga, by jedyna jednostka miasta maszerowała, co łamie regułę właściciela). Korekta setupu (garnizon a0) uzasadniona. PROSZĘ o dopisanie obu plików do allowlisty; ich zatwierdzenie to decyzja FC.
6. DECISION_REQUIRED (ABC dla właściciela): sufit rezerwy GARRISON_RESERVE_MAX_CITIES=3 jest arbitralny. Opcje: A) zostawić 3 (rekomendacja: ogranicza zamrożenie skarbca, ale dotąd bez dowodu); B) rezerwa dla wszystkich pustych miast (ryzyko zamrożenia, 1530–10728 skarbca w t60); C) sufit wyznaczony z pomiaru. Kod bez zmian do decyzji.
7. PRZYJMUJĘ. armyMerge.ts, ai-siege-relief.ts, zwiad: NIE zmienione w c8be716df (diff stat to potwierdza). Wykluczenie garnizonu z tych ścieżek nie wykonane; NIE DOTYCZY było błędnym oznaczeniem.

BLOKADY: (1) pomiar PRZED/PO nie wykonany; (2) decyzja ABC z pkt 6; (3) allowlista T2/T4 i sc.4 do potwierdzenia; (4) pkt 4 i 7 otwarte.
RUNDY: Obrona r3 (1 runda w tym przebiegu), razem Operator 3/5.
NASTĘPNY KROK: FC r3 z tym raportem; Operator następnej rundy: armyMerge + siege-relief + campaign-mutation test + pomiar 4242 t30/t60 PRZED/PO z liczbami.
DEPLOY/PUSH: NIE WYKONANO
