# R-WEB-CHARIOT-MOVE-6-DATA-Q1 — dispatch (decyzja właściciela „dwójka”, 2026-11-12)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

DECYZJA WŁAŚCICIELA: rydwany mają ruch w bitwie 6 (2× zwykła piechota: oszczepnik 3, włócznik 3, wojownik 4 → rydwan 6).

STAN (z gra/data/units.json): wszystkie rydwany i konnica mają „Ruch w bitwie (heksy)” = 6, z wyjątkiem „Rydwan (woły)” = 5. Jedyna zmiana danych: Rydwan (woły) 5 → 6. Ta zmiana NIE usuwa problemu ucieczek — to jest osobny temat (mechanika, nie dane).

GOAL: każdy rydwan w gra/data/units.json ma „Ruch w bitwie (heksy)” = 6.

KRYTERIA KOŃCA: (1) Rydwan (woły) = 6; (2) żaden inny wpis rydwanu/konnicy nie zmieniony; (3) test: odczyt units.json — wszystkie wpisy typu rydwan mają 6; (4) tsc zielone; (5) bramki referencyjne zielone.

ALLOWLISTA: gra/data/units.json (tylko pole „Ruch w bitwie (heksy)” wpisu „Rydwan (woły)”), nowy gra/tools/chariot-move-6-data-test.cjs. ZAKAZ: wszystko inne.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/. Dozwolone: tsc --noEmit; node tools/*-test.cjs.
