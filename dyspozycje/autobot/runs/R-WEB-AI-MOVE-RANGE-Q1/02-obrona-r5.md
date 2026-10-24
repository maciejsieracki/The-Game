STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-MOVE-RANGE-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora r5 wobec commita 04d6a88f.
ZMIANY-COMMIT: tylko ten plik (dyspozycje/autobot/runs/R-WEB-AI-MOVE-RANGE-Q1/02-obrona-r5.md). Kod bez zmian względem 04d6a88f. Bez pusha, bez deployu.
BAZA: odtworzona na 04d6a88f (detached). Przed zapisem drzewo czyste. `npm ci --ignore-scripts` w gra/.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (błąd w raporcie r5). Dispatch wymaga czasu tury nie gorszego niż x1,3 (00-dispatch.md, KRYTERIA pkt 3). Raport r5 (01-operator-r5.md:18, :51, BLOKADY 1) porównywał z x1,10, którego nie ma w dispatchu ani w r2-r4. Pomiar: pooled x1,12, biegi x1,147 i x1,160 (r5, sekcja Decyzja 1). Przy progu x1,3 kryterium 3 JEST spełnione. DECISION_REQUIRED z tego powodu odpada; blokada 1 r5 wycofana. Dane pomiarowe bez zmian, zmienia się tylko próg.

2. PRZYJMUJĘ. Odtworzony `node gra/tools/ai-move-range-collision-test.cjs` -> `WYNIK: 12 passed, 0 failed`. Raport r5 i opis commita (`13/0`) są błędne; poprawne 12/0. Poprawka tylko w tekście raportu (ten plik).

3. PRZYJMUJĘ jako ograniczenie (bez zmian kodu). Sekcja D to kontrola źródła main.ts (liczba wywołań `claimHexForMove(barbOcc,` = 2). Zachowania barbarzyńców w pełnej grze nie testuje. Oznaczone NIE_ZMIERZONO w r5.

4. ODRZUCAM (dowód). Guard blokuje wejście tylko wtedy, gdy heks jest zajęty w momencie wykonania komendy, czyli po wcześniejszym ruchu tej samej tury. Zajęte heksy są już wykluczone w decyzji:
   - ruch: `farthestStepWithinBudget(..., occupied)` i `firstStep` z `occupied` (barbarians.ts:754-759),
   - rajd: warunek `!occ.has(keyOf(nearestImpr.q, nearestImpr.r))` przed `commands.push({type:'raid'...})` (barbarians.ts:2627, 2663), gdzie `occ = addForeignCityBlocks(occupiedExcluding(allUnits, unit.id), ...)` (barbarians.ts:2605-2608).
   Więc rajd na ulepszenie zajęte przez własny stos barbarzyńców w chwili decyzji nie powstaje. Odmowa w egzekutorze dotyczy tylko kolizji z tej samej tury, czyli dokładnie tego, co naprawia r5. Brak zmiany kodu.

5. PRZYJMUJĘ jako ograniczenie, NIE_ZMIERZONO. Komenda barbarzyńcy niesie tylko koniec kroku, więc bonus odwiedzin jest liczony na heksie docelowym. U AI jest na całej trasie. Dla miast bez budynków efekt zerowy. Bez zmiany kodu w tej rundzie.

6. PRZYJMUJĘ jako hipotezę, NIE_ZMIERZONO. Przyczyn per jednostka nie zmierzyłem. Arytmetyka z ewaluacji (start q=16, cel q=34, 18 heksów, B=8 => 3-4 tury dojścia, potem postój) jest spójna, ale niepotwierdzona. Poza zakresem tej rundy.

7. PRZYJMUJĘ jako notatkę. Sekcja 6 war-allin używa przypiętych hashy (REF_OFF, REF_BASE_PRE_RANGE, WAR_ALLIN_BASE_REF = fcd86933). To snapshot regresji, nie dowód równoważności. `war-allin-capital-test`: 95 passed, 0 failed (odtworzone).

8. PRZYJMUJĘ jako notatkę. Reguła wojny jest sprawdzona w benchu (hex/jednostkę do 2,01 przy B=8). Brak osobnego scenariusza dla państw-miast; korzystają z tej samej ścieżki `decideAITurn` i `executeAiCityMove`. Brak zmiany kodu.

## Odtworzone testy (04d6a88f)
- ai-move-range-test: 46 passed, 0 failed
- ai-move-range-collision-test: 12 passed, 0 failed
- war-allin-capital-test: 95 passed, 0 failed
- barbarzyncy-krazenie-test: 249 passed, 0 failed
- logic-test: LOGIC OK (213/213)
- barb-city-behavior-test: 178 passed, 0 failed
- ai-test: 276 passed, 18 failed (bez zmiany względem baseline)
- tsc --noEmit: exit 0
- Build Vite i pomiar endTurn w Chromium: NIE_ZMIERZONO przeze mnie. Przyjmuję liczby z 01-operator-r5.md.

## Stan po obronie
- Kryterium 3 spełnione przy progu x1,3 (x1,12 zmierzone).
- Brak blokad technicznych. Zarzuty 3, 5, 6, 8 to ograniczenia i notatki.
- DECISION_REQUIRED z r5 nie jest już potrzebny.

RUNDY: 5/5 operatora (ta odpowiedź to obrona na zarzuty Evaluatora r5, bez nowej rundy kodu).
NASTĘPNY KROK: Evaluator r6 / Final Control na 04d6a88f + commit dokumentu obrony.
DEPLOY/PUSH: NIE WYKONANO
