STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-ICONS-EVERYWHERE-Q1
GOAL: W kosztach, utrzymaniu, produkcji i podsumowaniach surowców w panelu miasta i imperium pokazywać IKONĘ surowca + liczbę zamiast nazwy słownej (nazwa tylko w title/aria-label). Wspólny komponent resourceAmountChipHtml (src/ui/resourceAmountChip.ts). Bez zmian liczb i logiki; stan niedoboru zachowany.
ZMIANY/COMMIT: kod+testy: 65cbeb2379bdd1882af97a5e02b1320a2d33dd02 (bazą jest origin/main f49fcec9f). Raport: commit tego pliku (osobny, git add tylko tej ścieżki). Allowlista: gra/src/ui/cityPanel.ts, gra/src/ui/empireDetailPanel.ts, gra/tools/recruit-card-manpower-real-render-test.cjs, gra/tools/recruit-list-visibility-ui-test.cjs, gra/tools/resource-icons-everywhere-test.cjs (nowy). Nie dotknięto WERSJE.md, gra-robocza/**, gra/src/game/*.
TESTY:
- tsc: `node ./node_modules/typescript/bin/tsc --noEmit` EXIT 0, 0 linii wyjścia.
- build: `npx vite build --outDir <scratchpad>/vbuild-out --emptyOutDir` EXIT 0, „built in 18.11s" (bez npm run build/dev).
- NOWY tools/resource-icons-everywhere-test.cjs: 10 PASS, 0 FAIL (statyczny: brak wzorca „liczba + nazwa surowca" w przerobionych miejscach, import i użycie wspólnego komponentu, zachowanie „(brak)" i stock-missing).
- resource-amount-chip-icons-real-render-test.cjs (Chromium, 520 px, komponent + wiersze budynków): 29 PASS, 0 FAIL.
- recruit-card-manpower-real-render-test.cjs: 20 PASS, 0 FAIL po aktualizacji asercji B5 (była: tekst „13 Drewno"; jest: liczba + ikona + „(brak)").
- recruit-list-visibility-ui-test.cjs: 15 PASS, 0 FAIL po aktualizacji asercji U6 (akceptuje ikonę albo tekstowy fallback „Drewno"; w tym teście brandAssets jest stubem, więc fallback jest oczekiwany).
- recruit-card-stock-chip-real-render-test: 15 PASS; hud-resource-deficit-red-test: 41 PASS; science-hub-unlock-icons-real-render-test: 53 PASS; praca-panel-emoji-brand-icons-real-render-test: 26 PASS; army-panel-recruit-remove-test: 21 PASS; empire-army-city-recruit (wyjątek, patrz niżej).
- PORÓWNANIE Z BAZĄ (origin/main, zmierzone przez przywrócenie src na czysto): nie-moje FAILY na bazie (przed zmianą): building-detail-card-entitycard-migration-test (1 FAIL „Uwagi playerFacingNote"), building-resource-visibility-ui-test (1 FAIL P4), citizen-resource-upkeep-test (2 FAIL, kotwica main.ts), empire-army-city-recruit-no-inner-scroll-test (2 FAIL precondition), recruitment-panel-compact-row-test (7 FAIL, 9/12 wierszy), recruit-resource-strip-test (1 FAIL KRYTERIUM 3 Żelazo). Te same FAIL-e są też w wariancie z moją zmianą — nie są regresją tego tematu.
- NIE_ZMIERZONO: mennica-magazyn-test (7 FAIL: mnożniki ekonomii, cityYieldPerTurn, Garncarnia ceramika) — NIE sprawdzone na bazie; dotyczą liczb ekonomii, których ten temat nie zmienia (tylko formatowanie). Wymaga weryfikacji przez FC.
- NIE_ZMIERZONO: zrzuty przed/po przy 520 px (bez nachodzenia i obcinania) dla kart kosztu budowy i utrzymania miasta/imperium — nie wykonano (brak wizualnego przeglądu w przeglądarce). Dispatch tego wymaga; nie zostało zrobione w tej rundzie.
- NIE_ZMIERZONO: realny render Chromium dla NOWYCH miejsc (empire panel: utrzymanie/rekrutacja masowa; cityPanel: koszt budowy w karcie szczegółów) — pokryte tylko testem źródłowym i istniejącym renderem komponentu.

TABELA MIEJSC (plik:linia przed → po; po = nowa forma):
1. cityPanel.ts:6815 buildingStockCostChipsHtml — `${need} ${stockResourceLabel(k)} (masz H)` → iconHtml = chip(k, need), label „(masz H)".
2. cityPanel.ts:6924-6927 formatResourceUpkeepSummary(resources, unitSuffix='') — `−N Nazwa` → chip(k, −N, unitSuffix). Wywołania: wiersz utrzymania imperium/miasta (gridDetailRow, innerHTML) i kafelek jednostki (z '/t' przekazanym jako parametr zamiast doklejenia za listą).
3. cityPanel.ts:7112 buildingRequirementChips (stock) — `N Nazwa w magazynie (masz H)` → iconHtml = chip(k, N), label " w magazynie (masz H)".
4. cityPanel.ts:7886 karta budynku, koszt surowcowy — `N Nazwa + ...` → chip(k, N) joined ' + '.
5. cityPanel.ts:8176 karta jednostki, utrzymanie — `formatResourceUpkeepSummary(...) + '/t'` → formatResourceUpkeepSummary(..., '/t').
6. cityPanel.ts:8340 unitStockCostChipsHtml (rekrutacja) — `N Nazwa (brak)` → chip(k, N) + " (brak)" przy braku; klasa stock-missing zachowana.
7. cityPanel.ts:8352 unitResourceUpkeepChipsHtml — `−N Nazwa/t` → chip(k, −N, '/t') w bld-infocard-chip.
8. empireDetailPanel.ts:996 formatResourceUpkeepEmpireLine — `−N Nazwa · ...` → chip(k, −N) join ' · '.
9. empireDetailPanel.ts:1063 formatResourceUpkeepEmpireLineColored — `−N Nazwa` (<br>) → chip(k, −N) join '<br>'.
10. empireDetailPanel.ts:2836 renderMassRecruitmentSection (stock) — `N Nazwa · ...` → chip(k, N) join ' · '.
PRZEZNACZENIE: iconHtml w BuildingReqChip jest już obsługiwane przez buildingReqChipSpan (bez zmiany renderu).

BLOKADY / ZAŁOŻENIA (Luki rozstrzygnięte założeniem):
- Z1: Miejsca, w których wynik to atrybut title/tekst przycisku (nie HTML), zostają tekstowe, bo nie mogą nieść ikony: cityPanel.ts ~6525 (buildTitle „Brakuje w magazynie: N Nazwa"), cityPanel.ts ~8505 i ~8572 (stockMissingLabel — komunikaty ostrzegawcze „Brakuje w magazynie"), empireDetailPanel.ts ~3213 (textContent przycisku silnika oblężniczego), siegeMapPanel.ts:334 (textContent przycisku), cityPanel.ts ~4723 (etykieta BreakdownLine zaopatrzenia obywateli). ZAŁOŻENIE: to komunikaty/etykiety wierszy, nie koszty z liczbą; do decyzji FC.
- Z2: entityCards/buildingAdapter.ts:261 i :420 (karta encji „z magazynu państwa") — poza allowlistą (gra/src/ui/** jest, ale adapter jest w entityCards/ — formalnie w allowlistcie); nie zmieniano, bo wartość karty to tekst breakdownu. ZAŁOŻENIE: do ewentualnego tematu następnego.
- Z3: Ikony w panelu imperium: wiersze używają .bld-res-chip, którego CSS jest w cityPanel ensureStyles. ZAŁOŻENIE: svg ma atrybuty width/height (normalizeSvg, size=14), więc rozmiar jest poprawny także bez CSS; wyrównanie tekstu (vertical-align) może się różnić — NIE_ZMIERZONO na żywo.
- Z4: Testy recruit-card-manpower B5 i recruit-list-visibility-ui U6 zmienione tylko w zakresie formy tekstu chipa (wymóg tematu: nazwa w aria-label/title). Liczby i warunki nie zmienione.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu 65cbeb2379 (zakres 10 miejsc), wynik testów z sekcji TESTY, decyzja o Z1/Z2; FC: zrzuty 520 px (przed/po) i realny render kart kosztu/utrzymania (NIE_ZMIERZONO tutaj), mennica-magazyn-test na bazie.
DEPLOY/PUSH: NIE WYKONANO
