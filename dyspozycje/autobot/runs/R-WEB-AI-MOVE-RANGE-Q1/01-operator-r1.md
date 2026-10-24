STATUS: DOKUMENT_ODTWORZONY (oryginalny log r1 nie został zapisany w repo; treść z commitu bc291361 i logu r2 pkt 1-2)
DOMAIN: GAME
TEMAT: R-WEB-AI-MOVE-RANGE-Q1
GOAL: AI, miasta-państwa i barbarzyńcy idą w jednej turze pełnym budżetem ruchu jak gracz (nie 1 heks).
ZMIANY/COMMIT: bc291361 (r1) -- ai-move-range.ts (nowy), ai.ts, barbarians.ts, ai-city-capture-executor.ts, main.ts (wiązanie truncatePath), warAllInCapital.ts (extendWalk), testy harness/barbarzyńcy.
RUNDY: 1/5

## Przyczyna (pliki:linie w drzewie 96d1c4b0, przed r3)
- AI: `gra/src/game/ai.ts:860` -- dawniej `return path[0]` (1 heks na turę). Teraz `farthestStepWithinBudget(...) ?? path[0]`.
- Barbarzyńcy: `gra/src/game/barbarians.ts:759` -- dawniej `path[0]`.
- Zerowanie ruchu w egzekutorze: `gra/src/game/ai-city-capture-executor.ts:138` (`unit.ruchLeft = 0`) -- przycięcie trasy nie było możliwe bez wstrzyknięcia `truncatePath`.
- Gałąź barbarzyńców w main.ts: `gra/src/main.ts:36289` i `:36312` (`bu.ruchLeft = 0`, `bu.q = bcmd.toQ`) -- przeskok na cel komendy, więc zasięg zależy od kroku z decyzji.
- Gracz: reset ruchu `gra/src/main.ts:31732` (`u.ruchLeft = u.ruch`), trasa przycinana przez `truncatePathToBudget` (`gra/src/game/planned-march.ts`).
- Planer wojny all-in: `gra/src/game/warAllInCapital.ts` (`extendWalk`), krok budżetowy = 1 gdy brak `ruchLeft`.

## Wynik r1 (zmierzony w r2 na tym samym kodzie, mapa płaska 40x20)
- Budżet 1/2/5/8: PRZED 1,00 heks/jedn.; PO 1,00 / 2,00 / 5,00 / 8,00 (test F-AVG w ai-move-range-test.cjs).
- Pełna tura (decideAITurn/main.ts) NIE_ZMIERZONO w r1/r2.

## Otwarte z r2 (przeniesione do r3)
- Sekcja 6 war-allin-capital-test.cjs: referencje do odświeżenia (Z7).
- Pomiar na mapie z terenem (Z3).
- Pytanie produktowe FC o wejście na cel w tej samej turze: rozstrzygnięte przez orkiestratora (patrz r3).

DEPLOY/PUSH: NIE WYKONANO
