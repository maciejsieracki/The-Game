# 01-transition-receipt.md — R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922

STATUS: PASS
FROM: Operator
TO: Evaluator (niezależny)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922

## Co przekazuję Evaluatorowi

Zmiany NIESCOMMITOWANE w working tree (git status --short):

```
M gra/data/civ-matrix.json
M gra/src/battle/battleScene.ts
M gra/src/game/city-defense.ts
M gra/src/game/siegeMachines.ts
M gra/src/main.ts
?? dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/01-evidence.json
?? dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/01-operator.md
?? dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/01-transition-receipt.md
?? gra/tools/civ-matrix-oblezenie-wiring-test.cjs
```

Wszystkie w zakresie SCOPE/allowlist z dyspozycji.

## Weryfikacja niezależna dla Evaluatora — jak sprawdzić od zera

1. `git diff gra/data/civ-matrix.json` — policz zmienione linie (powinno być
   dokładnie 45, po jednej per zmienioną komórkę `obl_*`), porównaj z
   `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/INPUT-converted-values.json`.
2. `cd gra && npx tsc --noEmit` — musi być PASS.
3. `cd gra && node tools/civ-matrix-oblezenie-wiring-test.cjs` — nowy test,
   musi być 0 fail.
4. `cd gra && node tools/city-defense-terrain-gate-test.cjs && node tools/defense-breakdown-test.cjs && node tools/fortify-pole-test.cjs && node tools/mur-paradoks-test.cjs` —
   istniejące testy city-defense, muszą pozostać 0 fail każdy.
5. Sprawdź PARYTET osobiście: `grep -n "civMatrixParam(this._defenderCivIconId" gra/src/battle/battleScene.ts`
   i `grep -n "civMurObronaProcFor" gra/src/main.ts` — oba miejsca MUSZĄ
   przekazywać civ-matrix parametry do `cityWallDefenseBonusPercent`, inaczej
   to FAIL zgodnie z ANTI-SELF-DECEPTION w dyspozycji.
6. `git diff --check` — musi być czyste (brak whitespace errors).
7. `git log --oneline -3` — musi NIE zawierać nowego commitu (brak
   commit/push wykonanego przez Operatora).

## Znane, świadomie zaakceptowane odchylenia

- `tools/empire-panel-miasto-obywatele-content-test.cjs` (1 fail) i
  `tools/koszty-surowcowe-test.cjs` (3 fail) mają faile PRE-ISTNIEJĄCE na tym
  branchu przed jakąkolwiek zmianą tego tematu — zweryfikowane `git stash` +
  ponowny run, identyczne faile bez moich zmian. Nie są regresją tego tematu.

PUSH/DEPLOY: NIE WYKONANO
