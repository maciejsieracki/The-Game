# 04 — INTEGRATION — `R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1`

STATUS: PASS-WITH-NOTES
TEMAT: `R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1`
GOAL: gracz zawsze niebieski/lewy, przeciwnik zawsze czerwony/prawy, niezależnie od ataku/obrony.
BAZA: `47cdca15`

## Zakres zintegrowany

Wyłącznie zatwierdzona allowlista:

- `gra/src/battle/battleScene.ts`
- `gra/src/ui/preBattle.ts`
- `gra/src/ui/postBattleSummary.ts`
- `gra/src/game/battle-summary.ts`
- `gra/src/main.ts` — tylko przekazanie `playerSide` do podsumowania
- `gra/tools/r-bitwa-kolory-gracz-przeciwnik-q1-test.cjs`

Obce zmiany z izolacji nie zostały skopiowane.

## Testy

- test tematu: **26/26 PASS**;
- `git diff --check`: **PASS**;
- `tsc`: niedostępny w tym środowisku — `npm` zakończył się `EPERM` przy tworzeniu
  cache; dwa znane błędy bazowe pozostają poza zakresem.

READY_FOR_DEPLOY: TAK — selektywnie, z notą środowiskową powyżej.
DEPLOY/PUSH: NIE WYKONANO.
