STATUS: PASS
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1 / RUNDA 1/5
MODEL+EFFORT: Sonnet 5, effort=medium (Workflow, Ścieżka A)
GOAL: tradeRouteTotalDistanceIncome zwraca Math.max(1, Math.round(dawny_wynik/5)).

ZMIANY-COMMIT: branch `autobot/R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1`, SHA `0de31417`
(po rebase orkiestratora na aktualny origin/main po integracji R-BADANIA-KOSZT-PODWOJENIE-Q1).
Pliki: `gra/src/game/trade-routes.ts` (wyłącznie ciało `tradeRouteTotalDistanceIncome`),
`gra/tools/trade-routes-income-test.cjs` (asercje). `trade-routes-test.cjs` bez zmian.

PRZED/PO (dawny_wynik → /5 → round → max(.,1)):
```
LAD d=0: 5 -> 1.0 -> 1 -> 1
LAD d=12 (szczyt): 40 -> 8.0 -> 8 -> 8
MORZE d=0: 10 -> 2.0 -> 2 -> 2
MORZE d=20 (szczyt): 80 -> 16.0 -> 16 -> 16
LAD d=5: 19 -> 3.8 -> 4 -> 4
LAD d=8: 28 -> 5.6 -> 6 -> 6
MORZE d=10: 44 -> 8.8 -> 9 -> 9
K(a) trasa morska d=20: 80 -> 16.0 -> 16 (0.05*16=0.8, bylo 0.05*80=4)
```

TESTY (surowe wyniki): tsc --noEmit 0 błędów · logic-test 213/213 ·
tech-tree-test 19/0 · research-test 33/33 · unit-replace-test 13/13 ·
combat-test 6/6 · trade-routes-income-test 107/107 · trade-routes-test 65/65.

BLOKADY: brak.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
