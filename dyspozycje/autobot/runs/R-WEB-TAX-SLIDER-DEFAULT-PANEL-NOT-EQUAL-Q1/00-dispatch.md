# R-WEB-TAX-SLIDER-DEFAULT-PANEL-NOT-EQUAL-Q1 — dispatch (2026-11-09)

GOAL (zgłoszenie właściciela + zrzut): w panelu „DOMYŚLNY PODZIAŁ PODATEK” suwaki Skarb 50% / Nauka 50% / Zamożność 0% pokazują różne pozycje kropek i długości wypełnienia: Skarb kropka ~50%, Nauka kropka ~83% toru (wypełnienie dłuższe), mimo identycznej wartości 50%. Pozycja kropki i długość wypełnienia każdego suwaka MUSZĄ odpowiadać jego własnej wartości procentowej na skali 0–100% (ta sama długość toru dla wszystkich suwaków; 50% = środek toru, 100% = koniec, 0% = początek).
KONTEKST: wcześniej wdrożono R-WEB-TAX-SLIDER-THUMB-ALIGN-Q1 (kropka na końcu kolorowej części). Możliwa regresja lub błędna skala (max/step/kroki 10%, ograniczenie sumy 100% obniżające max suwaka, albo wypełnienie liczone kumulatywnie/z innej szerokości). Sprawdź też suwaki podatków w panelu miasta (override) — ten sam komponent.
BAZA: main po FALA 567. Operator: HAIKU 5.5.
ZAKRES:
1. Diagnoza: znajdź komponent „Domyślny podział podatek” (szukaj w gra/src/ui i main.ts: „DOMYŚLNY PODZIAŁ”, taxSlider, „Zamożność”), przyczynę rozjazdu (CSS --fill/--pct, max atrybutu, width toru, margines kropki).
2. Naprawa: wspólna skala; kropka i wypełnienie zgodne z wartością dla Skarb/Nauka/Zamożność we wszystkich kombinacjach (0/50/50, 50/50/0, 100/0/0, 33-kroki 10%); zgodnie z poprzednim THUMB-ALIGN (kropka na końcu kolorowej części).
3. Test: `gra/tools/tax-slider-default-panel-scale-test.cjs` (strukturalny + jeśli możliwe Chromium zrzut 3 pozycji; pomiar offsetLeft kropki vs oczekiwane % toru, tolerancja ±1 px), plus istniejące testy tax-slider.
ALLOWLISTA: gra/src/ui/* (suwaki podatków), gra/src/main.ts (tylko jeśli konieczne), gra/styles/* lub CSS tych komponentów, nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev w gra/, git add -A, push/deploy. Wizualna weryfikacja w przeglądarce wymagana (zrzut przed/po).
