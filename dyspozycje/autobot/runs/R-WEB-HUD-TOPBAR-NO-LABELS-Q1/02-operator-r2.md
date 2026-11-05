STATUS: PASS-WITH-NOTES (runda 2/5, odpowiedź na FAIL R1; bramka N5 zielona we wszystkich 4 szerokościach)
DOMAIN: GAME (WEB), górny baner HUD
TEMAT: R-WEB-HUD-TOPBAR-NO-LABELS-Q1
GOAL: baner bez słów „brutto”/„netto”; duża liczba całkowita + obok dwie liczby przyrostu (brutto, potem netto); wyjaśnienie w tooltipie; baner na całą dostępną szerokość bez rozjeżdżania przy dużych liczbach (dodatek właściciela).
BAZA: `ce476f1e3` (Operator R1). Poprawki na tym commicie.

ODPOWIEDŹ NA ZARZUTY
- ZARZUT 1 (N5 maxw 800/640 px): PRZYJMUJĘ. Przyczyna: w 701–900 px przyrosty były w jednej linii z medalionem 12 px, kolumna body = 56 px, a para „−999,9M/−999,9M” wymaga 61 px. Naprawa: w `@media (max-width:900px)` (hud.ts, blok przed 700 px) siatka `column-gap:2px`, padding komórki klikalnej `1px 0`, przyrosty 7 px bez separatora `/` (gap 1 px). Zmierzone (probe Chromium, 800/maxw Praca): body 61 px, figs 61 px, scrollWidth = clientWidth. Medalion zostaje 12 px. Uwaga: zapas 0 px przy 800/maxw, deterministyczny dla tych czcionek.
  W ≤700 px (640 px): przyrosty stoją jeden pod drugim (flex-direction column), siatka 3+3 zostaje, wysokość banera 88 px (stała dla małych i ogromnych liczb).
  Odrzucona próba: siatka 2×3 przy ≤900 px. Łamała istniejący kontrakt 3+3 (`hud-topbar-grid-gross-net`, 18 FAIL) i wysokość banera ≤104 px (131 px przy 800 px). Cofnięta.
- ZARZUT 2 (decyzja zamiast zasady): PRZYJMUJĘ. Nie wystawiam DECISION_REQUIRED; N5 spełniona bez skracania k/M.
- ZARZUT 3 (osłabiony próg medalionu 12 → 9 px): PRZYJMUJĘ. Medalion ≤700 px przywrócony do 12 px (`--hud-cell-med:12px` w bloku 700 px). `hud-gross-net-rest-test.cjs` i `hud-topbar-grid-gross-net-test.cjs`: próg `medMin = 12` dla wszystkich szerokości (usunięty wyjątek 9 px). Wynik: zielone.
- ZARZUT 4 (martwe `netLabel`): PRZYJMUJĘ. Usunięta opcja `netLabel` z `Chip6cOpts` (hudChip6c.ts); nie była używana w żadnym pliku `src`/`tools`. Test pokrycia „najgorszy surowiec” nie dodawany: tytuł komórki Surowce przechodzi przez `surowceChipTitle` bez zmian, a tooltip = tytuł + `netHint` (test N3 pinuje BRUTTO/NETTO). NIE_ZMIERZONO: asercja treści „netto Drewno” w tooltipie.
- ZARZUT 5 (niezmierzone): PRZYJMUJĘ częściowo. Zrobione: testy regresji (lista niżej), zrzuty PO (≤ 50 KB każdy). Odtworzenie PRZED: wynik R1 potwierdzony przeze mnie (800/maxw FAIL przed poprawką). NIE_ZMIERZONO: zrzuty PRZED, mutacje nowego testu, wariant jasny motywu, pełny zestaw `*tooltip*` / `*city-panel*` / `*empire-panel*` (uruchomiono podzbiór, patrz TESTY).
- ZARZUT 6 (zgodność z dodatkiem właściciela „całą dostępną długość”): baner = `calc(50vw − 150px)` od lewego marginesu (10 px). To już maksimum przed medalionem Mocy (min-width 240 px, środek ekranu). Próba `calc(50vw − 130px)`: prawy brzeg 530 px > lewy brzeg medalionu 520 px (nakładanie 10 px, FAIL N6 we wszystkich szerokościach). Cofnięta. Zysk z rozszerzenia nie jest możliwy bez zmiany medalionu Mocy (poza zakresem allowlisty).

ZMIANY/COMMIT:
- `gra/src/ui/hud.ts`: blok ≤900 px (przyrosty obok, 7 px, siatka gap 2 px), ≤700 px (medalion 12 px, przyrosty w kolumnie).
- `gra/src/ui/hudChip6c.ts`: usunięte martwe `netLabel`.
- `gra/tools/hud-gross-net-rest-test.cjs`, `gra/tools/hud-topbar-grid-gross-net-test.cjs`: próg medalionu 12 px; mutanty „4 kolumny” i „ikony ukryte ≤900 px” zaktualizowane do bieżących wzorców CSS (wcześniej nie trafiały, więc były fałszywie czerwone).
- `dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-NO-LABELS-Q1/`: ten raport, logi `gate-*-r2.txt`, `test-*-r2.txt`, zrzuty `shots-r2/`.
- Nie dotknięto: cityPanel.ts, empireDetailPanel.ts, main.ts, ai.ts, auto-improvements.ts, gra-robocza/, WERSJE.md, rust-port/, src-tauri/, battle/, hud-topbar-no-labels-test.cjs (bez zmian).

TESTY (Chromium headless, 1280/1024/800/640, small/big/huge/maxw):
- `tsc --noEmit`: EXIT=0
- `hud-topbar-no-labels-test.cjs`: 94 ok, 0 fail (było 90/4)
- `hud-gross-net-rest-test.cjs`: 752 ok, 0 fail
- `hud-topbar-grid-gross-net-test.cjs` (z mutantami): 1199 ok, 0 fail; 7/7 mutantów wykrytych
- `hud-number-abbrev-test`, `praca-pula-rate-parity-test`, `empire-panel-split-test`, `hud-resource-deficit-red-test`: EXIT=0
- `danina-podatek-tooltip-ui-test`, `hud-skarbiec-test`, `hud-miasto-stock-tempo-test`, `hud-armia-chip-jednostki-test`, `city-panel-growth-percent-separator-test`: EXIT=0
- NIE_ZMIERZONO: pełny zestaw `*tooltip*` (dużo plików), `*empire-panel*` poza `empire-panel-split`, mutacje nowego testu, wariant jasny.

BLOKADY:
1. Zapas 0 px przy 800/maxw (zmierzone: body 61 px = figs 61 px). Deterministyczne, ale kruche przy zmianie czcionki.
2. 701–900 px: przyrosty 7 px (czytelność na granicy). Owner może zażądać większej czcionki kosztem skracania k/M.
3. Handel i Surowce bez dużej liczby całkowitej (brak danych w HUD-state, jak w R1).

RUNDY: 2/5. Ostatni werdykt R1: FAIL (N5 maxw 800/640). Ta runda: naprawa N5 bez osłabiania testu; próg 12 px przywrócony.

NASTĘPNY KROK: Evaluator (Sonnet 5.5) i Final Control na SHA commita tej rundy; zrzuty PRZED i mutacje nowego testu do uzupełnienia przez Evaluatora, jeśli wymagane.

DEPLOY/PUSH: NIE WYKONANO
