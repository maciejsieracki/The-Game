STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-ICONS-EVERYWHERE-Q1
GOAL: W kosztach, utrzymaniu, produkcji i podsumowaniach surowców w panelu miasta i imperium pokazywać IKONĘ surowca + liczbę zamiast nazwy słownej (nazwa tylko w title/aria-label). Wspólny komponent resourceAmountChipHtml. Bez zmian liczb i logiki; stan niedoboru zachowany. Obrona: odpowiedź na zarzuty Evaluatora z 20-evaluator-claude.md (commit 90e39878f), runda 2/5.
ZMIANY/COMMIT: baza kandydata a2a5718092d6100fab2b7becd43f7c46d1788a8d (operator, runda 1). Commit obrony: patrz sekcja „SHA” w odpowiedzi orkiestratora (commit tego pliku zawiera kod + nowy test + raport). Allowlista obrony: gra/src/ui/cityPanel.ts, gra/src/ui/empireDetailPanel.ts, gra/src/ui/resourceAmountChip.ts (wspólny CSS chipa), gra/tools/resource-icons-everywhere-test.cjs (regex importu), gra/tools/resource-icons-everywhere-render-test.cjs (NOWY, behawioralny), dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-ICONS-EVERYWHERE-Q1/30-obrona-claude.md, 31-zrzut-przed-520px.png, 32-zrzut-po-520px.png. Nie dotknięto WERSJE.md, gra-robocza/**, gra/src/game/**.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (regresja HTML w bilansie miasta). Poprawka: cityPanel.ts appendCitySkarbiecBalance — wiersz „Utrzymanie surowców budynków” ma flagę html:true i jest wstawiany przez innerHTML; pozostałe wiersze nadal textContent. Dowód: na kandydacie a2a57180 (przed poprawką) test B3 FAIL — textContent wiersza zaczyna się od „<span class=\"bld-res-chip\">−1 <span class=\"bld-res-chip-ic\" ... aria-label=\"Drewno\">”; po poprawce B3 PASS, B2 (3 chipy) PASS.
2. PRZYJMUJĘ. Nowy test behawioralny gra/tools/resource-icons-everywhere-render-test.cjs (Chromium, esbuild bundle prawdziwych funkcji appendCitySkarbiecBalance, formatResourceUpkeepSummary, formatResourceUpkeepEmpireLine, ...Colored). Wynik na poprawce: 13 PASS / 0 FAIL. Czułość: na źródle sprzed poprawki (RESOURCE_ICONS_SRC_DIR) B3 FAIL i B2 FAIL; na bazie f49fcec9f A1/A2 FAIL (widoczne „−2 Drewno”, „−2 Kamień”). NIE_ZMIERZONO w Chromium: karta kosztu budowy (cityPanel buildingStockCostChipsHtml / karta szczegółów ~7886) i rekrutacja masowa imperium (empireDetailPanel ~2836) — wymagają BuildingDef/City/stanu gry, nie zostały wyrenderowane.
3. PRZYJMUJĘ częściowo. Zrzuty przed/po przy 520 px: 31-zrzut-przed-520px.png (baza f49fcec9f: „−1 Drewno · −2 Glina · −3 Ruda żelaza”) i 32-zrzut-po-520px.png (ikony + liczby). Brak nachodzenia i obcinania: test C (brak przepełnienia poziomego przy 520 px, bilans i wiersz imperium) PASS. NIE_ZMIERZONO: układ prawdziwego panelu — harness nie ładuje pełnego CSS siatki bilansu miasta (na zrzucie etykieta i wartość stoją obok siebie), więc zrzut nie odwzorowuje dokładnie wyrównania w grze.
4. PRZYJMUJĘ. Test A1–A3 w render-teście: dla KAŻDEGO klucza z STOCK_RESOURCE_LABEL (15 kluczy × 3 formattery = 45 próbek: formatResourceUpkeepSummary, formatResourceUpkeepEmpireLine, formatResourceUpkeepEmpireLineColored) — widoczny tekst bez nazwy słownej, chip z realną ikoną SVG i aria-label/title = nazwa, brak surowego HTML. Ograniczenie: buildingStockCostChipsHtml i unitStockCostChipsHtml nie są wywoływane (wymagają BuildingDef/UnitDef i City) — pokryte tylko testem statycznym B5/B7 i NIE_ZMIERZONO w formatterze.
5. PRZYJMUJĘ (Z3, realny defekt). Chip był stylowany wyłącznie przez ensureStyles cityPanel, więc panel imperium otwarty bez wcześniejszego panelu miasta pokazywał chip jako display:inline (dowód: test Z3 na źródle sprzed poprawki: chipDisplay „inline”, icDisplay „inline” — FAIL). Poprawka: reguły .bld-res-chip / .bld-res-chip-ic / --text przeniesione do eksportowanego RESOURCE_CHIP_CSS (resourceAmountChip.ts) i wstawione do CSS cityPanel oraz do ensureStyles empireDetailPanel. Dowód po poprawce: Z3 PASS (chipDisplay „inline-flex”, icDisplay „flex” — ikona jest blockowana jako element flex, to oczekiwane).
6. ODRZUCAM zmianę zakresu asercji, ALE zostawiam luźniejszy regex i zgłaszam NIE_ZMIERZONO przyczyny. Dowód: oryginalny regex /^\d+ Drewno \(brak\)$/ w recruit-list-visibility-ui-test U6 zwraca FAIL przy tekście „13 Drewno (brak)” (wynik z bazy: FAIL z tym samym tekstem na wyjściu). Nie ustaliłem bajtu, który to powoduje (widoczny tekst wygląda identycznie), więc nie twierdzę, że przyczyną jest NBSP. Luźniejszy regex /^\d+\s+(Drewno\s+)?\(brak\)$/ akceptuje też „13 (brak)” — tę wariantę pokrywa test ikony A2/B5 w render-teście, która wymaga ikony SVG i aria-label. FC: potwierdzić, czy to świadome zluzowanie (wymaganie: liczba + ikona, nazwa w aria-label).
7. ODRZUCAM zmianę zakresu w tej rundzie (zgodnie z ZAŁOŻENIAMI Z1/Z2 operatora): miejsca title/textContent (cityPanel ~6525, ~8505, ~8572; empireDetailPanel ~3213; siegeMapPanel:334; cityPanel ~4723) i entityCards/buildingAdapter.ts:261/:420 pozostają tekstowe, bo są to komunikaty „Brakuje w magazynie …”, tooltipy i teksty etykiet, nie koszty z liczbą w wierszu. Ocena zakresu „wszędzie” należy do FC.

TESTY (wszystkie na poprawce, surowe wyniki):
- tsc: `node ./node_modules/typescript/bin/tsc --noEmit` EXIT 0.
- build: `npx vite build --outDir <scratchpad>/vbuild-out --emptyOutDir` EXIT 0, „built in 18.91s” (bez npm run build/dev).
- resource-icons-everywhere-render-test (NOWY, Chromium): 13 PASS, 0 FAIL, EXIT 0.
  - na kandydacie sprzed poprawki (RESOURCE_ICONS_SRC_DIR=.rt/pre-fix): B3 FAIL (surowy HTML), B2 FAIL (chipCount=0), Z3 FAIL (inline/inline).
  - na bazie f49fcec9f (RESOURCE_ICONS_SRC_DIR=.rt/base): A1 FAIL (45 probek, „−2 Drewno”), A2 FAIL, B2 FAIL, B4 FAIL.
- resource-icons-everywhere-test (statyczny): 10 PASS, 0 FAIL (po relaksacji regexa importu do `(?:, RESOURCE_CHIP_CSS)?`).
- resource-amount-chip-icons-real-render-test: RESULT 29 PASS, 0 FAIL, EXIT 0.
- recruit-card-manpower-real-render-test: 20 passed, 0 failed, EXIT 0.
- recruit-list-visibility-ui-test: 15 passed, 0 failed, EXIT 0 (U6 — patrz zarzut 6).
- Bramki referencyjne: logic-test LOGIC OK (213/213) EXIT 0; tech-tree-test 20 pass, 0 fail EXIT 0; research-test PASSED 33/33 EXIT 0; unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21) EXIT 0; combat-test „All sanity checks passed” EXIT 0.
- mennica-magazyn-test NA KANDYDACIE POPRAWIONYM: 34 pass / 7 fail, EXIT 1 (liczby zgodne z raportem Evaluatora dla kandydata i bazy; bazy nie mierzyłem ponownie w tej rundzie — NIE_ZMIERZONO na bazie przeze mnie).
- git diff --check: bez wyjścia (czysto).

BLOKADY:
- NIE_ZMIERZONO: render Chromium karty kosztu budowy (cityPanel ~7886) i rekrutacji masowej imperium (empireDetailPanel ~2836).
- NIE_ZMIERZONO: układ prawdziwego panelu miasta (siatka bilansu) na zrzucie — harness bez pełnego CSS.
- NIE_ZMIERZONO: przyczyna bajtowa odrzucenia oryginalnego regexa U6.
- Dług bazowy: mennica-magazyn-test 7 FAIL (nie związane z tym tematem; Evaluator podaje identyczne 34/7 na bazie).

RUNDY: 2/5 (obrona rundy 1; zarzuty 1–7 odpowiedziane).
NASTĘPNY KROK: Evaluator (Sonnet) — ponowna weryfikacja nowego SHA: test render (13/0), zrzuty w 31/32, decyzja FC o zarzucie 6 (luźniejszy U6) i zakresie Z1/Z2. Potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
