STATUS: READY_FOR_DEPLOY
DOMAIN: GAME
TEMAT: R-BADANIA-KOSZT-PODWOJENIE-Q1
GOAL: Koszt nauki w gra/data/tech.json podwojony dla 28 technologii (poza
Obróbka drewna, Rolnictwo, Łowiectwo, Oswojenie zwierząt).

ZMIANY/COMMIT: merge --no-ff `autobot/R-BADANIA-KOSZT-PODWOJENIE-Q1` do `main`.
Po merge'u na `main`, ponownie zweryfikowane przez orkiestratora:
tsc --noEmit 0 błędów; logic-test 213/213; tech-tree-test 19/19; research-test
33/33; unit-replace-test 13/13; combat-test 6/6.

TESTY: patrz wyżej — wszystkie zielone na aktualnym stanie main po scaleniu.
BLOKADY: brak.
RUNDY: 1/5 (zamknięte w rundzie 1).
NASTĘPNY KROK: osobna bramka deploy/push do ROBOCZA (poza tym tematem, razem
z innymi tematami tej fali, zgodnie z konwencją projektu).
DEPLOY/PUSH: NIE WYKONANO (kod zintegrowany do `main`, publikacja ROBOCZA to
osobna, późniejsza bramka).
