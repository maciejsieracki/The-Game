# Final Control — R-BITWA-LARGE-MIXED-ARMY-SCENARIOS-Q1

**Werdykt: PASS-WITH-NOTES dla zakresu macierzy headless. Etap 8/11.**
**Produkt: bez zmian; nie ma potwierdzonego błędu gry w pierwotnych trzech czerwonych przypadkach.**

## Kontrola zakresu

Sprawdziłem commit operatora 4a78c6c2f1ac04528d0e394c79f98825a5c0f602, raport Operator Defense, niezależną ewaluację i ślady bazowe oraz poprawione. Diff produkcyjny nie zawiera zmian w gra/src; zmieniono wyłącznie harness macierzy oraz run/evidence. Korekta nie wycisza dowolnych zatrzymanych strzelców: warunek rezerwy dotyczy wyłącznie wielorzędowego składu, jednostki tej samej roli w niższym ranku, stojącej w bezpośrednim pasie w tym samym wierszu, która oddała strzał. Testy linii 1, pustego pasa, innej roli i nieaktywnego strzelca nadal podlegają dotychczasowym asercjom.

Bazowe czerwone przypadki pochodziły z zamrożonej sceny bez ruchu obrońcy i bez obrażeń. Strzelec z pierwszego ranku zajmował prosty pas tylnej jednostki i oddawał strzały, ale fixture nigdy nie otwierał pola przez straty. Wymóg, by tylny strzelec obchodził aktywną jednostkę tego samego szeregu, premiowałby boczne rozproszenie zamiast zwartej linii. Raporty pokazują, że strzelcy dostępnego ranku strzelają, a wariant 1-liniowy nadal jest kontrolowany.

## Niezależna weryfikacja Final Control

Na commicie operatora ponownie uruchomiłem:

- pełną macierz: **36 scenariuszy**, 42 aktywne jednostki na stronę, 5 aktywacji — **0 czerwonych warunków**;
- steady, 2 linie, engaged, oba priorytety, po 8 aktywacji — **0 czerwonych warunków**;
- node --check harnessu oraz git diff --check — PASS.

Test uruchomiony przez Final Control pozostawił ślad 01-matrix.json przywrócony do treści z commitu operatora; nie zmodyfikowano pliku testu ani produktu. Niezależny evaluator dodatkowo potwierdził npm run typecheck, reguły formacji i doktryny dystansowo-konne.

## Ograniczenia i dalszy zakres

To macierz headless produkcyjnej logiki BattleScene, nie pełna bitwa 42v42 w Chromium. Fixture nie symuluje ruchu obrońców, strat, animacji ani otwierania luk po śmierci jednostki z pierwszego ranku. W poprawionym śladzie rezerwowy łucznik może pozostać bez ruchu za aktywnie strzelającym partnerem w pierwszym ranku; jest to zamierzone zachowanie zwartego szyku w tym fixture, nie dowód, że każda taka rezerwa ruszy po otwarciu pasa w prawdziwej bitwie. Nie przedstawiam wyniku jako walidacji wizualnej ani pełnego testu żywej walki.

Wnioski: macierz wykryła fałszywie dodatnie kryterium, które zostało zawężone i niezależnie sprawdzone. Nie ma podstaw do poprawki produktu. Dalsze rzeczywiste testy ręcznej bitwy oraz cykli rozkazów pozostają w odrębnych rejestrach (R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1, R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1). Dla tego zakresu etap 9 to integracja harnessu i dokumentacji do main; etap 10 deploy gry do Roboczej jest **N/A**, bo nie zmieniono produktu. Potem wykonać push/readback jako etap 11.
