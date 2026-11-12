# R-WEB-CHARIOT-MOVE-6-DATA-Q1 — dispatch (decyzja właściciela, 2026-11-12: final)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

DECYZJA WŁAŚCICIELA (ostateczna): w bitwie „Ruch w bitwie (heksy)”:
- Rydwan (woły) = 5 (bez zmiany);
- rydwany konne (pozostałe rydwany) = 6 (bez zmiany);
- Konnica (wpis „Konnica”) = 7 (zmiana z 6).
Pole „Ruch” (mapa świata) NIE zmieniać. Inne wpisy kawalerii (konnice epok/nacji, jeźdźcy) bez zmiany.

STAN WYJŚCIOWY: Rydwan (woły) = 5; pozostałe rydwany = 6; Konnica = 6.

GOAL: jedyna zmiana danych: „Konnica” → „Ruch w bitwie (heksy)” = 7 w gra/data/units.json.

KRYTERIA KOŃCA (binarne):
1. Wpis „Konnica” ma „Ruch w bitwie (heksy)” = 7.
2. Wpis „Rydwan (woły)” nadal = 5; pozostałe rydwany nadal = 6.
3. Żadne pole „Ruch” (mapa) nie zmienione.
4. Test gra/tools/chariot-move-6-data-test.cjs sprawdza 1–3 i czerwieni się przy zmianie wartości.
5. tsc --noEmit zielone; bramki referencyjne zielone.

ALLOWLISTA: gra/data/units.json (wyłącznie pole „Ruch w bitwie (heksy)” wpisu „Konnica”), nowy gra/tools/chariot-move-6-data-test.cjs. ZAKAZ: wszystko inne, git add -A.

IZOLACJA: worktree na izolowanej gałęzi, baza aeb52465e845d29acb5f7b628370789af399d673.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/. Dozwolone: tsc --noEmit; node tools/*-test.cjs.
