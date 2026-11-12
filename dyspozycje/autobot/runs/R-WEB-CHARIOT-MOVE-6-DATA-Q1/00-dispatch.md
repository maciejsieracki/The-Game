# R-WEB-CHARIOT-MOVE-6-DATA-Q1 — dispatch (decyzja właściciela, 2026-11-12: tylko bitwa)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

DECYZJA WŁAŚCICIELA (zamyka temat ruchu): w bitwie rydwany mają ruch 6, konnica ruch 7. Zmiana TYLKO w bitwie (pole „Ruch w bitwie (heksy)” w gra/data/units.json), bez zmian na mapie świata („Ruch”). Właściciel sprawdzi na polu bitwy, jak to przekłada się na uciekające wojska; zmierzenie zachowania to osobny temat.

STAN WYJŚCIOWY (units.json): rydwany = 6 z wyjątkiem „Rydwan (woły)” = 5; konnica („Konnica”, „Konnica lancowa asyryjska”, „Konnica łucznicza asyryjska”, „Jeździec z oszczepami”, „Jeździec chiński”) = 6.

GOAL: w gra/data/units.json, pole „Ruch w bitwie (heksy)”:
- wszystkie rydwany (typ Mount, nazwa zawiera „Rydwan”) = 6 (w tym „Rydwan (woły)”: 5 → 6);
- wszystkie konnice (nazwa zaczyna się od „Konnica” lub „Jeździec”) = 7.
Pole „Ruch” (mapa świata) NIE zmieniać.

KRYTERIA KOŃCA (binarne):
1. Każdy wpis rydwanu ma „Ruch w bitwie (heksy)” = 6.
2. Każdy wpis konnicy/jeźdźca ma „Ruch w bitwie (heksy)” = 7.
3. Pole „Ruch” (mapa) nie zmienione w żadnym wpisie.
4. Test gra/tools/chariot-move-6-data-test.cjs sprawdza 1–3 i czerwieni się przy zmianie wartości.
5. tsc --noEmit zielone; bramki referencyjne zielone.

ALLOWLISTA: gra/data/units.json (wyłącznie pole „Ruch w bitwie (heksy)” wymienionych wpisów), nowy gra/tools/chariot-move-6-data-test.cjs. ZAKAZ: wszystko inne, git add -A.

IZOLACJA: worktree na izolowanej gałęzi, baza aeb52465e845d29acb5f7b628370789af399d673.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/. Dozwolone: tsc --noEmit; node tools/*-test.cjs.
