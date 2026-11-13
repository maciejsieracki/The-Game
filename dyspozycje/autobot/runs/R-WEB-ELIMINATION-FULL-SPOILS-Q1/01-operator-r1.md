STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ELIMINATION-FULL-SPOILS-Q1
GOAL: przy eliminacji cywilizacji zwycięzca przejmuje 100% majątku państwa (surowce, Praca, Nauka, złoto skarbca, żywność Spichlerza), a okno „Bilans zdobycia” pokazuje komplet.

## 1. Znalezisko (plik:linia, baza origin/main ae292911f)
- Okno: `gra/src/main.ts` `buildCityCaptureReportRows` (~1639-1715), użyte w `runCapitalCapturePlunder` (~32269-32471, gałąź eliminacji).
- Rdzeń transferu: `gra/src/game/capital-capture.ts` `applyCapitalCapturePlunder`. Przy eliminacji przenosił: skarbiec, Pracę, Naukę, techy. NIE przenosił żywności Spichlerza (`EmpireFoodState.zapasyPanstwa`, `empire-food.ts:30`); okno nie miało pozycji Spichlerza.
- Surowce: magazyn państwa = suma `City.surowce` po miastach ownera (SUROW-CIV-01, `building-stock-cost.ts:164`, `main.ts:3330`). `City.surowce` jedzie z miastem (zmiana `ownerId`, nigdy zerowane). Eliminacja = brak innych miast ofiary, więc przejęte miasta wcześniejsze niosły własne surowce do swoich zdobywców. Zrzut „Glina +134, Ruda +40” jest zgodny z modelem (to magazyn OSTATNIEGO miasta); fizyczny transfer surowców działał, okno pokazywało je poprawnie. Dwa oddzielne błędy: (A) brak transferu i pozycji Spichlerza (naprawione), (B) surowce — brak błędu transferu; dodano jawną listę `outcome.surowcePrzejete` (miasto + ewent. inne miasta ofiary), z której okno korzysta.
- Inne ścieżki eliminacji (`annexCityStateToOwner` main.ts:~32020, dyplomatyczne wchłonięcie) NIE przechodzą przez `applyCapitalCapturePlunder` — poza zakresem (zasady eliminacji bez zmian); do decyzji orkiestratora, jeśli właściciel chce majątek także tam.

## 2. Zmiany
- `capital-capture.ts`: `OwnerResourceAccess` + opcjonalne `getFoodReserve/setFoodReserve/getFoodCapacity`; `CapitalCaptureOutcome` + `zywnoscPrzejeta/zywnoscUtracona/zywnoscOfiaryRazem/surowcePrzejete`; tylko Zdarzenie 2: żywność ofiary → zdobywca do pojemności Spichlerza zdobywcy (nadwyżka ginie), ofiara zerowana; barbarzyńcy nie dziedziczą (wrapper no-opuje zapis do newOwner).
- `main.ts` (tylko eliminacja/okno): akcesory Spichlerza (`empireFoodStates`, owner-agnostycznie gracz/AI/hot-seat, `getEmpireFoodMaxCap`); wiersz „Żywność ze spichlerza” (`+X`, przy limicie `+X — przejęto X z Y (limit pojemności)`), grupa `lup`; raport eliminacji bierze surowce z `outcome.surowcePrzejete`. Zwykłe zdobycie i stolica bez eliminacji — bez zmian. Teksty okna poza dodaną pozycją — bez zmian.
- ZAŁOŻENIE: pojemność nieznana (getEmpireFoodMaxCap = 0, brak ticku) = bez przycięcia; następny tick `advanceEmpireFood` przytnie do limitu.
- Nowy `gra/tools/elimination-full-spoils-test.cjs`.

## 3. Testy
- `node ./node_modules/typescript/bin/tsc --noEmit` (po `npm ci --ignore-scripts`): EXIT=0.
- `elimination-full-spoils-test.cjs`: PO 114 passed / 0 failed (EXIT=0); PRZED (zrewertowane src) EXIT=1, 5 FAIL + crash (Spichlerz niezerowany/nieprzejęty, brak `surowcePrzejete`). Pokrycie: 8 surowców + 500 złota + 1200 żywności + 300 Pracy + 900 Nauki, ofiara wyzerowana, okno (rows + HTML `reportRowsHtml` z „Pokaż wszystkie surowce (8)”), zwykłe zdobycie bez zmian, limit pojemności (częściowy/pełny/nieznany), AI-zdobywca/AI-ofiara/fotel 1 hot-seat/barbarzyńcy, idempotencja, wiązanie main.ts po źródle; 7 mutacji rdzenia, wszystkie CZERWIENIĄ test.
- Regresje (24 bramki `*capture*|*eliminat*|*conquest*|*siege*|*empire-food*|*skarbiec*|*zdobycie*`): PRZED i PO identyczne; FAIL w obu: ai-zdobycie-miasta-adiacencja, barb-city-capture-cluster, conquest-stability, hud-skarbiec, rekrutacja-skarbiec-only (istniejące, niezwiązane z tą zmianą — zweryfikowane na bazie). Reszta EXIT=0 (w tym capital-capture, miasto-zdobycie-raport, elimination-toast-merge, empire-food-b5, empire-skarbiec-*).
- Zrzut okna PRZED/PO: `okno-przed.html` (1.6 KB), `okno-po.html` (2.8 KB) w tym katalogu (render `reportRowsHtml`, nie screenshot przeglądarki).

## 4. NIE_ZMIERZONO / BLOKADY
- Odtworzenie w Chromium z hookami `?civTest=1` NIE wykonane: main.ts jest jednym domknięciem bez eksportów, a `npm run build/dev` zabronione; dowód = prawdziwy rdzeń + prawdziwy blok raportu + prawdziwy render wierszy + wiązanie po źródle. Do zmierzenia w Final Control/orkiestratorze.
- main.ts: konflikt z innymi tematami możliwy (zmiany ograniczone do bloku raportu i `capitalCaptureResourceAccess`, `runCapitalCapturePlunder`).
- Zero zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`. `node_modules` usunięty.

COMMIT: 2d1bf8a6da96f36af4ad56a81ebe5c57dc3f2e4a (kod+test+raport; ten wiersz dodany kolejnym commitem)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5), zwłaszcza weryfikacja w przeglądarce i decyzja ws. wchłonięcia dyplomatycznego.
DEPLOY/PUSH: NIE WYKONANO
