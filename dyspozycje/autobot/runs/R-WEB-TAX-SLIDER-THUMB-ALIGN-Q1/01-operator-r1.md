STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TAX-SLIDER-THUMB-ALIGN-Q1
GOAL: Na suwakach „Domyślny podział podatku" (Skarb/Nauka/Zamożność) kropka stoi na końcu kolorowego wypełnienia, nie na szarej części.

ZMIANY/COMMIT: 7c7a882cb (kod, test, zrzuty, raport; baza origin/main c4a541a27). Kolejny commit tylko dopisuje ten SHA.
- `gra/src/ui/empireDetailPanel.ts` — jedyna zmiana kodu produkcyjnego.
- `gra/tools/tax-slider-thumb-align-real-render-test.cjs` — NOWY test (Chromium).
- `dyspozycje/autobot/runs/R-WEB-TAX-SLIDER-THUMB-ALIGN-Q1/` — raport, zrzuty (30 KB każdy), gate-*.txt.
Poza allowlistą: brak zmian. CSS suwaków żyje w tym samym pliku (stała `.civ-emp-slider`).

POMIAR PRZED (plik:linia, origin/main c4a541a27):
- Przyczyna: `sliderFillStyle(pct, ...)` (empireDetailPanel.ts:1057) malował gradient do `pct`% szerokości toru,
  a natywna kropka stoi na `value/max`. Suwak Nauka ma `max=MAX_PROCENT_NAUKA=60` (linie 111, 1204), więc 40%
  daje wypełnienie 40% toru, a kropkę na 66,7%. Skarb i Zamożność mają max 100, więc tam się zgadzało.
- Druga wada: kropka porusza się w zakresie [7 px, szer.-7 px] (uchwyt 14 px), a gradient w [0, szer.], więc
  nawet przy max=100 był błąd do 7 px.
- Trzecia wada: przy przeciąganiu `other.style.background = sliderFillStyle(...)` przypisywało ciąg
  „background:linear-gradient(...)" do `style.background`, czyli wartość nieprawidłową, którą przeglądarka
  ignoruje (wypełnienia pozostałych suwaków nie odświeżały się po zmianie). Ta sama wada przy suwaku Wyżywienia (linia 255).
- Panel miasta (`cityPanel.ts` makeSlider, linia ~4750): suwaki bez kolorowego wypełnienia (szary tor), więc
  rozjazdu nie ma i kodu nie zmieniałem.
- Pomiar w px (skan pikseli środkowego rzędu toru z ukrytą kropką, panel 404 px i 260 px, 8 kombinacji
  100/0/0, 40/40/20, 20/40/40, 0/50/50, 10/10/80, 0/0/100, 60/30/10, 0/60/40; render + po przeciągnięciu):
  stara logika (bundle z mutacją) daje różnicę do 131,0 px, 85 pomiarów powyżej 1 px.
  33/33/34 pominięte (niedozwolone przy kroku 10%).

NAPRAWA: jedna wspólna ścieżka w empireDetailPanel.ts: `sliderRangePct(value,min,max)` (pozycja w pełnym
zakresie), `sliderThumbCenterCss()` (koniec wypełnienia = `calc(7px + (100% - 14px) * f)`, czyli środek kropki),
`sliderFillGradient()`/`sliderFillStyle()`. Użyte w: sekcji podatku (render + odświeżanie po `input`, z
`input.min/max`), suwaku Wyżywienia (kropka też była przesunięta o ≤7 px) i `laborSliderFillStyle` (suwak Pracy
0–50). Odświeżanie po `input` przypisuje teraz wartość gradientu, nie deklarację. Zero zmian logiki podziału
(wartości, kroki 10%, suma 100%, `adjustHandelSplit` bez zmian).

TESTY:
- NOWY `tax-slider-thumb-align-real-render-test.cjs`: PO najwyższa różnica 0,4 px (≤1 px, 0 pomiarów >1 px, 0 błędów strony),
  widok szeroki+wąski, motyw ciemny (`colorScheme: dark`), ścieżka po przeciągnięciu; MUTACJA (stara logika)
  daje FAIL (131 px) — 3 PASS / 0 FAIL, `gate-tax-slider-test.txt` EXIT=0.
- Zrzuty PRZED/PO: `shot-przed.png` (Nauka: wypełnienie 40%, kropka 66,7%), `shot-po.png` (kropka na końcu wypełnienia).
- tsc `--noEmit` po `npm ci --ignore-scripts`: EXIT=0 (`gate-tsc.txt`).
- Regresje (14 narzędzi z dispatchu): ai-slider, city-panel-growth-percent-separator, danina-podatek-nazwa,
  danina-podatek-tooltip-ui, empire-panel-drobiazgi-runda2, econ-slider-visibility, sliders-always-visible,
  empire-panel-split, hint-toast-zindex-empire-panel, labor-to-tax-conversion-gold,
  praca-budmode-slider-max-real-render, work-tax-conversion: EXIT=0.
  `empire-panel-miasto-obywatele-content-test` i `empire-panel-moc-scroll-preserve-test`: EXIT=1 zarówno PO, jak i
  na gołym origin/main (sprawdzone, plik zamieniony na wersję z main) — wady wcześniejsze, niezwiązane z suwakami
  (FAIL R2-2 side.myCityId; „snap is not defined"). NIE naprawiałem (poza zakresem).
- NIE_ZMIERZONO: Firefox (`::-moz-range-thumb`, ta sama szerokość 14 px, brak pomiaru), panel miasta w żywej grze.

BLOKADY: brak. Konflikt z R-WEB-POPCAP (cityPanel) i R-WEB-AUTOIMPROVE-SIMPLE-FOOD (buildModeHud): brak,
cityPanel/buildModeHud nietknięte.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (te same ID). Po wdrożeniu REPIN Rust (UI podatków) zanotuje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
Sprzątanie: `gra/node_modules` i pliki tymczasowe testu usunięte po pracy.
