# Niezależny przegląd F-05 — 2026-10-17

STATUS: FAIL
DOMAIN: GAME
Zakres: lokalny diff F-05, tylko odczyt produktu i testy; bez pełnego runtime, commitów i publikacji.

## Zarzuty

1. **P1 — 4B rozszerzono z Egiptu na inne cywilizacje.** `gra/src/game/civ-bonuses.ts:336` wyklucza `walka_ruch_bitwa_proc` oraz `walka_ruch_rydwany` z embarkacji niezależnie od cywilizacji. Decyzja 4B w `owner-decisions/26-owner-decisions-20261015.md` mówi: „Bonus Egiptu dotyczy wyłącznie ruchu w bitwie”; decyzja 1B również zabrania rozszerzania zakresu bez rozstrzygnięcia. Aktualna macierz ma `zulusi.walka_ruch_bitwa_proc = 0.2`. Reprodukcja na rzeczywistych danych: `civMatrixBonusyForCivKey('zulusi')`, jednostka `{typeId:'Wojownik',category:'piechota'}`, Żegluga dostępna i heks `PlytkieMorze`: stary wyraz `base / Math.max(1, civMovementMultiplier(..., '', true))` daje **0.8333333333333334**, nowy `moveCostFnFor(...)(hex)` daje **1**. To zmienia rzeczywisty ruch Zulusów poza decyzją Egiptu. Test `egypt-movement-precedence-test.cjs:56` dodatkowo utrwala usuwanie ogólnego bonusu greckiej fikstury. Zalecenie: zachować pozostałe cywilizacje przy rozdzielaniu Egiptu albo uzyskać odrębną decyzję zakresu; zaktualizować test regresji na realnych Zulusach.

## Sprawdzenia bez dalszych zarzutów

- Decyzja 1B: Egipt wyłącza pole ogólne nawet przy specyficznym 0; dodatnie 0.17, 0 i ujemne -0.1 są objęte testem. Brak podwójnego naliczania. Egipska piechota nie dostaje bonusu rydwanów, inne cywilizacje zachowują ogólny bonus w bitwie.
- BattleScene korzysta z `civMovementMultiplier` w `_movementPointsFor` (linia 7179), a ta metoda zasila inicjalizację, reset aktywacji i posiłki. Zachowane minimum 1 i zaokrąglenie punktów ruchu.
- `main.ts:11970` przekazuje bonusy właściciela do `moveCostFnFor`; ten wrapper jest używany w ścieżkach gracza i AI, w tym w wyznaczaniu kosztu/tras.
- Dedykowane pole płytkiego morza pozostaje aktywne; gate Żeglugi zachowany. Nie wykonano pełnego runu runtime po run55 ani acceptance 93×15. F-04 i pozostałe owner holdy pozostają poza tym przeglądem.
- F05 test wykonany: **21/21 PASS**.
- `civ-bonusy-test.cjs` w trakcie równoległej edycji G11: **33 PASS / 3 FAIL**, wszystkie trzy dotyczą rabatu rekrutacji Zulusów; nie traktuję ich jako regresji F05 ani jako dowodu gotowości po G11.

Nie edytowałem produktu ani testów. Raport zapisano poza repozytorium. Brak push/deploy.

## Recheck po poprawce zakresu

STATUS: PASS-WITH-NOTES
DOMAIN: GAME

Zarzut 1 **usunięty**. Pole `matrixCivKey` jest nadawane w adapterze macierzy, a helper embarkacji odfiltrowuje egipskie pola ruchu, zachowując dawną semantykę innych cywilizacji. Nowy test obejmuje rzeczywistych Zulusów (`1/1.2`) oraz składanie pól dla greckiej fikstury (`1/1.48`). Test wykonany niezależnie: **24/24 PASS**. Sprawdziłem również zdolność testu do wykrywania regresji: esbuild otrzymał w pamięci wariant wyłączający ruch wszystkich cywilizacji (bez edycji plików); test prawidłowo upadł na `0.8 != 0.6756756756756757`.

Aktualna lista otwartych zarzutów F05: **pusta**. Werdykt obejmuje ograniczoną zmianę F05 i powyższe testy, nie pełne acceptance runtime/93×15, G11 ani gotowość wydania. Odnotowane wcześniej 3 błędy legacy rekrutacji dotyczą pracy G11; przekazano je agentowi G11.
