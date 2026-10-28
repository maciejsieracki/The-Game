# R-CIV-ALL-TOPICS-ROBOCZA-20261027 — Operator: audyt domknięcia EOT

**STATUS: PASS-WITH-NOTES (brak potwierdzonego błędu produkcyjnego)**
**DOMAIN:** GAME
**ROLA:** Operator / diagnostyka statyczna i readback artefaktu stres-testu.
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
**ZAKRES:** wyjaśnić odczyt `turn=40`, `DONE tura 40`, lecz sample `busy=true`; bez browser runów i zmian w kodzie produktu.

## Wniosek

Zapis nie dowodzi, że produkcyjna flaga została po zakończeniu tury. W tym samym wyniku `runWorldEndTurn_total` dla tury 40 trwa 69,796 s, a koniec testu próbował czekać maksymalnie 60 s. Harness więc kwalifikuje tę turę jako przekroczenie limitu i przechodzi do ścieżki pobierania stanu. Ostrzeżenie `triggerPlayerEndTurn: DONE tura 40` potwierdza, że `finally` `endActiveHumanTurn()` doszło do końca.

W `main.ts` kolejność w tym `finally` jest jednoznaczna: najpierw `activeWorldEndTurnPipeline = false`, `endTurnTransition()`, `endTurnInProgress = false`, `endTurnStartedAt = 0`; dopiero potem flush odroczonych elementów i log `DONE` (okolice linii 37944–37992). W tym przebiegu nie ma osobnego zapisu `endTurnInProgress=true` poza startem `endActiveHumanTurn()` oraz jednym jego wywołaniem w harnessie.

Odczyt timeoutu jest wewnętrznie niespójny przez kolejność test hooków. Harness buduje obiekt tak: `busy: isEndTurnInProgress()` **przed** `deals: __dealsLiveDebug.snapshot()`. `snapshot()` najpierw kopiuje bieżące `endTurnInProgress`, a następnie liczy `canEnd` przez `canPlayerInitiateEndTurn()`. To wywołuje `healStaleEndTurnBlockers()`, która może zmienić flagę busy między odczytanymi polami. Dlatego `{ busy: true, deals.endTurnInProgress: true }` nie jest atomowym odczytem stanu po snapshotcie i nie dowodzi, że flaga nadal była true po zakończeniu asynchronicznego EOT.

Wartość `canEnd=false` także nie dowodzi busy: `canPlayerInitiateEndTurn()` może blokować się na `isPreBattleOpen()`/`hasPendingAutoPreBattle()`, `aiTurnAwaitingBattle`/`aiCmdResume`, galerii, ekranie onboardingu lub innych bramkach. `deals.snapshot()` raportuje tylko pending negocjacje; `pending=[]` nie opisuje kolejki bitew. Screenshot timeoutu pokazuje otwartą Audiencję Dyplomatyczną z panelem Civpedii nad nią, nie ekran bitwy. Nie udało się z tych danych stwierdzić, czy jakaś odroczona bitwa nadal blokowała następny klik.

## Sprawdzone dowody

- `/tmp/large-empire-stress-summary-37176-efzk9u.json`: `turnBefore=39`, `turn=40`, `advanced=false`, `wallMs=77678`, `completedTurns=38`, stop reason `EOT timeout or blocker`.
- Dla tury 40 `runWorldEndTurn_total=69795.6ms`, `runAiPhase=37545.2ms`, `scanAutoSiegesAfterAiTurn=30734ms`; faza świata przekroczyła limit harnessu o ok. 9,8 s, a wall snapshot o ok. 17,7 s.
- Warning tail zawiera `triggerPlayerEndTurn: DONE tura 40`; nie ma błędów JS ani ostrzeżeń `Force-clearing stuck transition`.
- `/tmp/large-empire-stress-timeout-37176-efzk9u.png`: świat doszedł do tury 40; widoczne są Audiencja Dyplomatyczna i zagnieżdżony panel Civpedii.
- Read-only source audit: `endActiveHumanTurn()` ma `finally`, który kasuje guardy przed `DONE`; `healStaleEndTurnBlockers()` pomija czyszczenie wyłącznie gdy `activeWorldEndTurnPipeline=true`.

## Ograniczenia i następny krok

To jest potwierdzony **przekroczony limit czasu**, ale nie potwierdzony deadlock po ukończeniu świata. `DONE` oraz `finally` przeczą tezie, że EOT nadal trwa po zakończeniu wrappera; konflikt wynika z timeoutu 60 s oraz nieatomowego/side-effectowego readbacku. Nie zmieniałem źródeł ani testów.

Do poprawy samego pomiaru należy w harnessie osobno odczytać stan po `snapshot()` albo dodać read-only debug snapshot z: `activeWorldEndTurnPipeline`, `endTurnInProgress`, `isTurnTransitionActive()`, `isPreBattleOpen()`, `hasPendingAutoPreBattle()` i `aiCmdResume != null`. Ponadto po timeoutcie trzeba ponownie obserwować zakończenie aż do końca limitu diagnostycznego (bez kolejnej akcji EOT), aby odróżnić „przekroczył 60 s, ale skończył” od „nadal busy po DONE”. Ponowny browser run nie był zlecany.

Niezależnie od tego pozostaje realny wydajnościowy blocker: turn39→40 trwała 69,8 s w fazie silnika i 77,7 s wall, a skan oblężeń miał szczyt 30,7 s. Ten raport nie zaleca zmian produkcyjnych dla flagi EOT.

**MERGE / DEPLOY / PUSH:** nie wykonano.
