STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1
GOAL: w wierszach budynków panelu miasta nazwy surowców jako ikony + liczby (bez widocznej nazwy słownej), ikona z tego samego źródła co HUD/Spichlerz, nazwa w title/aria-label; brak nachodzenia przy 520 px.
BAZA: origin/main 546fdf6bf; start obrony od dc24a03e6 (kandydat Operatora).

## Odpowiedzi na zarzuty Evaluatora (e9b603b49e40fa149a2a7ed6e71ff722235e901d)

ZARZUT 1 (zakres: nazwy zostają w kosztach budowy, formatResourceUpkeepSummary, unitResourceUpkeepChipsHtml): ODRZUCAM w zakresie tej rundy, z ZAŁOŻENIEM.
- buildingStockCostChipsHtml (cityPanel.ts:6736–6748) jest używany w kartach budowy (cityPanel.ts:7211, 7893), a nie w wierszach posiadanych budynków, których dotyczy zrzut właściciela (utrzymanie i produkcja).
- formatResourceUpkeepSummary (cityPanel.ts:6856) zasila bloki szczegółów „Utrzymanie surowców budynków" (4864, 5981, 5993, 8108), czyli sekcje kart, a nie wiersze listy.
- unitResourceUpkeepChipsHtml (cityPanel.ts:8279–8284) dotyczy jednostek, nie budynków.
- GOAL mówi „w wierszach budynków panelu miasta (oraz nagłówku „Utrzymanie łączne”)". Zakres jest więc założeniem. Ryzyko: wypowiedź właściciela „zamieniłbym wszystkie te nazwy” może obejmować też karty. To pytanie do właściciela (ABC), a nie rozszerzanie zakresu przez Operatora.

ZARZUT 2 (nazwa budynku obcinana „Odlewnia brą…”, „Spichlerz Kró…”): ODRZUCAM.
- GOAL mówi wprost: „nazwa budynku ma priorytet (tooltip przy obcięciu)". Mechanizmem wskazanym przez GOAL jest tooltip, a nie brak obcięcia. Dodano bn.title = pełna nazwa (cityPanel.ts, appendOwnedBuildingRow).
- CSS nazwy: .bld-owned-name{flex:0 1 auto;max-width:9.5em;overflow:hidden;text-overflow:ellipsis} (cityPanel.ts:3054). Obcięcie na zrzucie „przed” było identyczne, więc nie jest to regresja.
- Zrzut jest z fixture'ów, nie z żywej gry (ZAŁOŻENIE 3 z 10-operator-claude.md).

ZARZUT 3 (nowy plik gra/src/ui/resourceAmountChip.ts poza literalną allowlistą `cityPanel*.ts`): PRZYJMUJĘ jako fakt, NIE ROZSTRZYGAM sam.
- Plik jest nowym modułem pomocniczym tej funkcji i jest importowany przez test (gra/tools/resource-amount-chip-icons-real-render-test.cjs:159). Dispatch dopuszcza „powiązane style, nowy test", ale nie wymienia nowego modułu.
- Rozszerzenie allowlisty wymaga akceptacji FC albo orkiestratora (zgodnie z zarzutem). Proszę FC/orkiestratora o decyzję: zaakceptować plik albo wbudować go w cityPanel.ts. Nie zmieniano allowlisty ani układu plików w tej rundzie.

ZARZUT 4 (ikony małe, ~9 px, trudne do odróżnienia; brak testu fallbacku tekstowego; czytelność NIE_ZMIERZONO): PRZYJMUJĘ jako ryzyko.
- Brak zmiany kodu: bez zmierzonej czytelności na żywej grze nie ma podstaw do zmiany rozmiaru. NIE_ZMIERZONO na żywej grze.
- Fallback tekstowy (bld-res-chip-ic--text) nie ma osobnego testu. Dodanie go nie jest w zakresie tej rundy; zostaje jako dług testowy.

ZARZUT 5 (wartość „+50” wygląda na białą, nie zieloną): ODRZUCAM na podstawie CSS, z zastrzeżeniem.
- .bld-owned-conv-out{color:var(--green)} (cityPanel.ts:3078). Chip (.bld-res-chip, .bld-res-chip-ic) nie ustawia koloru, więc dziedziczy zielony z rodzica span.bld-owned-conv-out (cityPanel.ts:6942).
- Jedyna reguła zmieniająca kolor konwersji to .bld-owned-conv-row--inactive (cityPanel.ts:3083–3085), ustawiająca #6a6458 (szary, nie biały). Wiersz nieaktywny daje szarość, nie biel.
- Obliczony kolor (computed style) w żywym panelu NIE_ZMIERZONO. Nie uruchamiano pomiaru getComputedStyle w tej rundzie.

ZARZUT 6 (test A1 nie sprawdza kompletności względem buildings.json): PRZYJMUJĘ i NAPRAWIAM.
- Zweryfikowane: A1 przed poprawką obejmował tylko koszty i utrzymanie z buildings.json (drewno, kamien, cegla, ceramika) oraz dwie receptury fixture (garncarnia, odlewnia_brazu). Pełna lista receptur konwerterów z src/game/converters.ts:85+ (DEFAULT_CONVERTER_RECIPES) nie była objęta. Pominięte klucze: ruda_zelaza, zelazo, stal (plus ewentualne inne z pełnej listy).
- Poprawka (commit poniżej): test importuje DEFAULT_CONVERTER_RECIPES i dodaje do zbioru kluczy wszystkie inputs oraz output każdej receptury. Zbiór wzrósł z 8 do 11 kluczy (raport testu: „[coverage] 11 resource keys").
- Wynik po poprawce: A1 PASS (wszystkie 11 kluczy ma SVG). Pozostałe checki bez zmian.
- Kompletność względem buildings.json dla kosztów i utrzymania: koszt_surowce = drewno, kamien, cegla; utrzymanie_surowce = ceramika (sprawdzone node'em na data/buildings.json). Wszystkie w zbiorze.

## ZMIANY-COMMIT
- Commit kodu obrony: patrz `git rev-parse HEAD` w raporcie orkiestratora (SHA końcowy w polu sha). Zmieniony plik: gra/tools/resource-amount-chip-icons-real-render-test.cjs (+DEFAULT_CONVERTER_RECIPES, +pętla po receptarach). Brak zmian w gra/src/**.
- Ten raport: dyspozycje/autobot/runs/R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1/30-obrona-claude.md (commit razem z poprawką, osobny `git add` ścieżek).
- Nie zmieniano: WERSJE.md, gra-robocza/**, buildings.json, logiki ekonomii, liczb.
- Środowisko: `npm ci --ignore-scripts` w gra/ (71 pakietów, bez `npm run build`/`dev`). Artefakty testu (.resource-amount-chip-entry.ts, bundle .cjs) są generowane i nie trafiają do commitu.

## TESTY (surowe wyniki, uruchomione w tej rundzie)
- resource-amount-chip-icons-real-render-test (CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome, po poprawce A1): `[coverage] 11 resource keys`; wszystkie checki PASS; `RESULT: 29 PASS, 0 FAIL`; exit 0.
- git diff --check: bez wyjścia (czysto). Wcześniej NIE_ZMIERZONO przez Evaluatora; w tej rundzie zmierzone.
- Brak zmian w TS (gra/src/**), więc tsc, logic i pozostałe testy z Operatora nie były ponownie uruchamiane; ich wyniki z 10-operator-claude.md nie zmieniają się przez tę poprawkę.
- NIE_ZMIERZONO: czytelność na żywej grze; computed color „+50"; zachowanie przy wąskich nazwach budynków poza fixture'ami.

## BLOKADY
- Otwarte decyzje dla FC/orkiestratora: (a) akceptacja nowego modułu gra/src/ui/resourceAmountChip.ts poza literalną allowlistą (zarzut 3); (b) zakres: czy karty budowy i bloki „Utrzymanie surowców budynków" mają też być ikonowe (zarzut 1, pytanie ABC do właściciela).
- Brak blokad technicznych.

## ZAŁOŻENIA (rozstrzygnięte w tej rundzie)
1. Zakres wierszy = wiersze posiadanych budynków, produkcja konwertera i nagłówek „Utrzymanie łącznie" (jak w 10-operator, założenie 4). Karty budowy i bloki szczegółów nie zmienione.
2. Obcięcie nazwy budynku z tooltipem jest zgodne z GOAL (priorytet nazwy = tooltip przy obcięciu).
3. Czytelność i kolor w żywej grze NIE_ZMIERZONO; zrzuty z fixture'ów.

## RUNDY
1/5 (runda obrony Operatora po werdykcie Evaluatora PASS-WITH-NOTES, e9b603b49).

## NASTĘPNY KROK
Evaluator (runda 2) weryfikuje poprawkę testu A1 (11 kluczy, 29/0) oraz decyzje ODRZUCAM dla zarzutów 1, 2 i 5; następnie Final Control. Orkiestrator rozstrzyga akceptację modułu (zarzut 3) i pyta właściciela o zakres (zarzut 1).

## DEPLOY/PUSH
NIE WYKONANO (Operator nie integruje, nie deployuje i nie pushuje).
