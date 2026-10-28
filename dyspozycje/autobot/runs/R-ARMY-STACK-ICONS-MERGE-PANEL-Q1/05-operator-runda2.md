# AutoBot Operator — runda 2: dolny viewport gap przy 150%

TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
RUNDA: 2/5
STATUS: PASS
DEPLOY/PUSH/COMMIT: NIE WYKONANO

## Zmiana

Przy krótkim viewportcie (`max-height:500px`) overlay wyrównuje panel do górnej
krawędzi obszaru z 24-pikselowym paddingiem. Wcześniejsze centrowanie dawało
przy DPR 1.5 i viewportcie CSS `600×413` dolny odstęp około `22.16px`. Panel
zostaje ograniczony przez istniejące `max-height:calc(100vh - 48px)` /
`100dvh`, a scroll nadal należy wyłącznie do jego body. Zmiana obejmuje tylko
`gra/src/ui/armyMergePanel.ts`; testów ani tolerancji nie zmieniano.

## Weryfikacja

- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **26/26 PASS**;
  w tym marginesy przy DPR 1.5, widoczne i klikalne oba CTA, scroll do ostatniego
  wiersza stosu oraz negatywna kontrola.
- `node tools/army-split-ruch-icons-test.cjs` — **7/7 PASS**.
- `npm run typecheck` — **PASS**.
- `git diff --check -- gra/src/ui/armyMergePanel.ts` — **PASS**.
- `npm run build` — **PASS** (`vite build`, 916 modułów).

Poza `armyMergePanel.ts` i tym raportem nie zmieniałem plików z allowlisty.
Dirty worktree poza zakresem pozostawiono bez zmian.
