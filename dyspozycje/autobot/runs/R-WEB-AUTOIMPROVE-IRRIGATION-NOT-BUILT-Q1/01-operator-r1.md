STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-IRRIGATION-NOT-BUILT-Q1
GOAL: po farmach i trzodzie na polach obywateli automat (Żywność, Zrównoważone, AI) buduje irygację tam, gdzie jest legalna; filtr „tylko pola obywateli” nieosłabiony; ręczna budowa bez zmian.

ZMIANY/COMMIT: 1b4a792a5 (kod + nowy test + logi bramek; raport w następnym commicie, SHA w `git log`)
- `gra/src/map/improvement-build.ts`: nowe opcjonalne pole stanu `visibleRiverNeighborCountsForIrrigation` (domyślnie brak = reguła ręczna i tooltipy bez zmian); `isRiverAdjacent` uznaje wtedy sąsiada z samym `rzeka.obecna`.
- `gra/src/game/auto-improvements.ts`: picker ustawia flagę na true (tylko automat, gracz i AI).
- NOWY `gra/tools/autoimprove-irrigation-after-farms-test.cjs` (43 asercje). Zero zmian w main.ts, ai.ts, gra-robocza, WERSJE.md, rust-port.

PRZYCZYNY (zmierzone na prawdziwych funkcjach, 3 ziarna x 2 światy x 100 tur x 3 aktorzy):
1. DEFEKT (naprawiony). Picker uznaje za „przy rzece” dla farmy i trzody (`onRiverHex`, auto-improvements.ts ~1290, E1–E3) także heks, którego sąsiad ma samo `rzeka.obecna` (bez wpisu w `riverPaths`). Irygacja (`qualifies`, improvement-build.ts:~1015 + `isRiverAdjacent` :~968) tej rzeki nie widziała. Skutek dokładnie jak w zgłoszeniu: heks dostaje farmę i trzodę, irygacji nigdy; po E3 stage E4 nie ma kandydata. Komentarz r3 w pickerze zostawił to jako „osobny temat”. Skala: 4–6% płaskich heksów mapy ma rzekę widoczną tylko przez sąsiada (np. 26/410, 76/1187). PRZED: 2 takie pola na aktora (6 map), RED. PO: 0.
2. REGUŁA ZAMIERZONA, nie bug (DECYZJA_WYMAGANA niżej). Irygacja (KANON-ULEPSZENIA-ZYWNOSC-HODOWLA §3) i trzoda (E3) tylko przy rzece. Mapa bez rzek: farmy 86, irygacja 0, trzoda 0, pula niewydana, picker nie ma kandydata (anyCandidate=false), wskaźnik „Budżet niewydany” świeci 6/6 (Żywność i Zrównoważone). Każda niezirygowana farma ma powód „brak-rzeki” (86/86). Pola poza rzeką nie kwalifikują się z reguły gry.
3. Próg budżetu (design STAGES2). Irygacja kosztuje 60 (3 x farma 20). Przy 33% puli i rezerwie 30 rusza dopiero od puli >= 182 (test: 180 nie, 183 tak). Przy małym przychodzie (15/tura) po 100 turach 42 pola farma+trzoda czekają na irygację, pula „odkładana” ~150. To jawna decyzja właściciela (brak wyjątku od %), nie ruszałem.

HISTOGRAM PRZED -> PO (rzeki, budżet 40/tura, kumulowany, filtr włączony):
- Żywność: farma 72, irygacja 72 -> 75, trzoda 72; zalegające 2 -> 0; poza obywatelami 0 -> 0.
- Zrównoważone: 71/71 -> 71/74/71; zalegające 2 -> 0; poza obywatelami 0.
- AI: 71/71 -> 71/74/71; zalegające 2 -> 0; poza obywatelami 0.
+3 irygacje to pustynia (solo, legalne) przy widocznej rzece, ścieżka zapasowa.
Mapa bez rzek PRZED = PO (identycznie). Pula niewydana w tym scenariuszu: Żywność 21347, Zrównoważone/AI 16812 (suma 6 map).

TESTY: nowy test PRZED (źródło origin/main): 37 OK / 6 FAIL (RED); PO: 43 OK / 0 FAIL. Mutacja A (flaga false w pickerze): 5 FAIL. Mutacja B (flaga zawsze true = zmiana reguły ręcznej): 1 FAIL. Regresje PO, wszystkie EXIT=0: ai-food-only-worked-hexes 81, ai-improvements 56, auto-improve-no-item-cap 15, auto-improve-q3 48, auto-improvements 46, autoimprove-stages-q1 302, ai-food-improvement-priority-stages 13, farma-cofnij 21, farma-lesie-usun 143, farma-nie-w-lesie 138, improvement-territory-gate 6, map-improvement-qualify 133, food-hodowla 24, empire-food-b5 34. tsc --noEmit EXIT=0. 
Wyjątek: autoimprove-live-hooks-test 1 FAIL („main.ts importuje installCivTestHooks”, test statyczny czytający main.ts, który nie był zmieniany; PRZED = to samo z konstrukcji, nie uruchamiano osobno na bazie).
NIE_ZMIERZONO: zapis/mapa właściciela; testy live-verify-* i Chromium (bez buildu); `*irrigation*`/`*irygac*`/`*trzoda*` poza wymienionymi (brak takich plików).
Logi: `gate-*.txt` (po jednej linii EXIT=).

BLOKADY: brak. DECYZJA_WYMAGANA (nieblokująca, opcje):
D1. Mapy/pola bez rzeki: A) zostaje (irygacja i trzoda tylko przy rzece, budżet leży; rekomendacja, zgodne z KANONEM); B) pozwolić na irygację w pobliżu jeziora/morza; C) zwolnić hodowlę z rzeki. A nie zmienia nic.
D2. Wyrównać RĘCZNĄ budowę z automatem (jedna definicja „przy rzece” = sąsiad z `rzeka.obecna`): A) tak, jedna linia, usuwa flagę (rekomendacja); B) zostawić rozbieżność ręczna/auto.
D3. Próg 3 x koszt przy 33%: A) bez zmian; B) dopuścić irygację, gdy koszt <= cała dostępna pula (wyjątek od % tylko dla E4) — wymaga odwołania decyzji STAGES2.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R1), następnie Obrona i Final Control; D1–D3 do orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
