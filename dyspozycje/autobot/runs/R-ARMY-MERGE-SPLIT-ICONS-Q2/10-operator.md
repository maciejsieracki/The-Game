# Operator — R-ARMY-MERGE-SPLIT-ICONS-Q2

**Status:** implemented, operator verification passed; awaiting independent evaluator and Final Control.

## Zgłoszenie i przyczyna

Właściciel ponownie zgłosił, że ikony akcji łączenia i rozdzielania armii wyglądają identycznie. Ustalona semantyka jest jednoznaczna: przy łączeniu strzałki kierują się do środka; przy rozdzieleniu kierują się na zewnątrz.

W `gra/src/ui/unitActionBarHtml.ts` obie akcje miały tę samą geometrię dwóch grotów skierowanych na zewnątrz oraz pionową kreskę pośrodku. Dlatego oba przyciski pokazywały ten sam symbol.

## Zmiana

- Ikona `split` rysuje teraz pionowy znacznik stosu i dwa poziome strzałki z trzonami, skierowane na zewnątrz.
- Ikona `merge` rysuje pionowy znacznik środka oraz dwie poziome strzałki z trzonami, skierowane do środka.
- Zachowałem istniejące ID, etykiety, kolejność i obsługę akcji; zmieniła się tylko geometria SVG.
- Dodałem test wykonujący prawdziwy renderer paska akcji, odczytujący wyrenderowane SVG i sprawdzający kierunek każdego grotu.

## Testy i artefakty

- `TMPDIR=/workspace/army-icons-tmp node tools/army-merge-split-direction-icons-test.cjs` — PASS.
- `node tools/unit-action-bar-completeness-test.cjs` — 31/31 PASS.
- `node tools/unfortify-all-action-bar-test.cjs` — 16/16 PASS.
- `./node_modules/.bin/tsc --noEmit` — PASS.
- Chromium render rzeczywistego wyniku `buildUnitActionBarHtml`: [01-merge-split-icons.png](01-merge-split-icons.png).
- `git diff --check` — PASS.

Nie przeprowadzono niezależnej ewaluacji ani Final Control w ramach tego raportu. Nie wykonano integracji, pushu ani deployu.
