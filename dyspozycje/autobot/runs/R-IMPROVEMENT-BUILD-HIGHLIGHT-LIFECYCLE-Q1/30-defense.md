# Obrona poprawki — R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1

## Odpowiedź na uwagi Evaluatora

Werdykt Evaluatora: `PASS-WITH-NOTES`. Uwagi dotyczyły (1) braku jednego
zintegrowanego przejścia przez budowę/cofnięcie/koniec tury oraz (2) słabo skadrowanych
zrzutów ekranu do oceny zmiany jasności.

### 1. Zintegrowana budowa, cofnięcie i rozliczenie tury

Uzupełniono test live Chromium o sekwencję na rzeczywistym `main.ts` i produkcyjnym buildzie:

1. Nieudana próba bez wymaganej Pracy pozostawia pole i overlay bez zmian.
2. Budowa farmy zapisuje pending i natychmiast usuwa heks z bieżącego overlay.
3. Cofnięcie farmy usuwa warstwę ulepszenia i przywraca pole do overlay.
4. Ponowna budowa na tym samym polu ponownie rejestruje pending.
5. `__eraTestDebug.endTurn()` wywołuje produkcyjną `advanceSeat()`/sekwencję końca tury.
6. Po przejściu z tury 1 do 2 farma pozostaje w stanie gry, wpis pending jest rozliczony,
   a overlay trybu budowy jest wyczyszczony.

Wynik `improvement-build-highlight-lifecycle-live-test.cjs`: **50/50 PASS**, zero błędów
JS i konsoli. Nie zmieniano kodu produktu w odpowiedzi na uwagę; doprecyzowano wyłącznie
testowe kryterium EOT: po zamknięciu trybu budowy sprawdzamy brak narysowanego overlay,
nie kwalifikującą listę wejściową API, która jest osobnym źródłem danych.

### 2. Jasność i zrzuty ekranu

Wartości są mierzone bezpośrednio z materiału renderera podczas live production Chromium:

- standardowe ulepszenia: `0.35 × 1.20 = 0.42`;
- kopalnie: `0.30 × 1.20 = 0.36`.

Zmiana jest więc dokładnie o 20% względnie dla obu dotychczasowych wartości. Test asercyjny
sprawdza te liczby dla wszystkich widocznych typów ulepszeń. Zrzuty w `dowody/` zachowują
kontekst mapy i pomagają wskazać stan przed/po; nie są traktowane jako precyzyjny pomiar
jasności ani jako dowód pixel-difference. Zgodnie z notą Evaluatora pomiar opacity jest
podstawowym dowodem dla kryterium jasności. Nie powstał dodatkowy crop, bo kadr mapy bez
deterministycznego UI highlightu dawałby fałszywą pewność wizualną.

## Ponowne kontrole

- Live Chromium, build produkcyjny: **50/50 PASS** (w tym EOT).
- Logika lifecycle: **39/39 PASS**.
- Istniejący test overlay kopalń: **76/76 PASS**.
- Typecheck i produkcyjny build: **PASS**.
- `git diff --check`: **PASS**.

Obrona zamyka uwagę dotyczącą integracji build/undo/turn i wyjaśnia ograniczenie
wizualnych zrzutów. Gotowe do Final Control (**etap 7/11**). Brak merge, deployu i pushu.
