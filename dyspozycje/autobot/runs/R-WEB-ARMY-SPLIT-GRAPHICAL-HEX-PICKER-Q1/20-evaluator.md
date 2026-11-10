# 20-evaluator — R-WEB-ARMY-SPLIT-GRAPHICAL-HEX-PICKER-Q1

**Wynik: PASS. OBRONA POMINIĘTA.** Nie znalazłem blokującego problemu w dozwolonym zakresie.

## Niezależna walidacja

- Drzewo sprawdzone przy `HEAD=origin/main=f293fc643ac3a808b36080935fc08dec94e85fea`.
- `node gra/tools/army-split-graphical-hex-picker-test.cjs --shots /tmp/army-split-evaluator-shots` na `/usr/bin/chromium`: **14 PASS / 0 FAIL**. Sprawdziłem oba wygenerowane zrzuty: diagram ma centralny stos ARMIA i sześć pól, tekst trybu graficznego nie pokazuje współrzędnych, a układ mieści się w widoku 150%-equivalent (853×533 CSS px).
- Zrzuty niezależne mają te same SHA-256 co poprawione zrzuty operatora: 1280×800 `065117e78d347ecc51e6a3151909fd8e392d11d4d19552b07837b3e2fab0dec2`, 150%-equivalent `ac272207de98102593a08e810d9533f56c45e2a0b727cfb0252b2d47a4dd9888`.
- `NODE_OPTIONS=--require=/tmp/army-split-playwright-system-chromium.cjs node gra/tools/army-split-panel-scroll-grid-test.cjs --post-only`: **15 PASS / 0 FAIL**. To sprawdza ścieżkę bez `neighbors` (legacy), brak poziomego overflow, klawiaturową obsługę listy, odmowę pustego/całkowitego podziału i dotychczasową logikę callbacku.
- `node gra/tools/army-split-movement-test.cjs`: **4 PASS / 0 FAIL**.
- `npm run typecheck -- --pretty false` w `gra/`: **exit 0**.
- `git diff --check`: **PASS**.

## Ocena zakresu

Adapter w `main.ts` podaje kierunki E/NE/NW/W/SW/SE jako delty osiowe `(+1,0)`, `(+1,-1)`, `(0,-1)`, `(-1,0)`, `(-1,+1)`, `(0,+1)`. Zgadza się to z kolejnością sąsiadów `hexNeighborCoords` w `units/setup.ts`; po zastosowaniu wzorów pointy-top z `render/hexutil.ts` te delty odpowiadają położeniom na diagramie. Sześć kierunków oraz ich dokładne cele `q,r` przeszły niezależny test kliknięć.

Test UI potwierdził widoczne pole źródłowe, sześć sąsiadów, brak widocznych współrzędnych w trybie graficznym, centralny wybór celu miejskiego, wyszarzony cel z powodem, pozostawienie jednostki w źródle, focus klawiatury i dopasowanie widoku 150%. Kod zachowuje dotychczasowe `onSplit(ids,q,r)`; ograniczenie co najmniej jednej jednostki u źródła pozostaje w `canSplit()`. Adapter jedynie opisuje sześć pól na podstawie istniejącej mapy i funkcji legalności.

Zakres tej oceny obejmuje wskazane testy panelu, regresji legacy, kosztu ruchu i typów oraz ręczne porównanie mapowania osi/directions. Nie uruchamiałem pełnej kampanii ani nie przypisuję temu raportowi pokrycia end-to-end całej gry.
