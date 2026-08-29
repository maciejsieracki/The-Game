STATUS: READY_FOR_DEPLOY
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1
GOAL: Dochód z tras handlowych (tradeRouteTotalDistanceIncome) obniżony 5x,
zaokrąglony do liczby całkowitej, nigdy niższy niż 1. Struktura per-miasto
(wariant A właściciela) i krzywa dystansowa niezmienione.

ZMIANY/COMMIT: merge --no-ff `autobot/R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1` do `main`.
Po merge'u ponownie zweryfikowane: tsc --noEmit 0 błędów; logic-test 213/213;
tech-tree-test 19/19; research-test 33/33; unit-replace-test 13/13;
combat-test 6/6; trade-routes-income-test 107/107; trade-routes-test 65/65.

TESTY: patrz wyżej — wszystkie zielone na aktualnym stanie main po scaleniu.
BLOKADY: brak.
RUNDY: 1/5 (zamknięte w rundzie 1).
NASTĘPNY KROK: osobna bramka deploy/push do ROBOCZA (razem z pozostałymi
tematami tej fali).
DEPLOY/PUSH: NIE WYKONANO
