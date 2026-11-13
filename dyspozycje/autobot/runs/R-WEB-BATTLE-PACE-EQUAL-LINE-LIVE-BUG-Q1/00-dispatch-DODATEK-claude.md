
## DODATEK (runda 2, 2026-11-13) — DECYZJA WŁAŚCICIELA (ABC): metryka i sufit
DECYZJA: „równe tempo” = w każdej turze różnica między najszybszą a najwolniejszą jednostką w linii wynosi co najwyżej 1 hex, aż do wzwarcia. Sufit obejmuje WSZYSTKIE jednostki mieszanej armii: strzelców, konnicę i machiny tak samo jak piechotę (najwolniejsza jednostka wyznacza tempo linii).
ZADANIE: zaimplementuj sufit tempa dla pełnego zestawu jednostek; test na żywo-symulacji (ten sam scenariusz, różne składy) pokazuje różnicę ≤1 hex w każdej turze do wzwarcia; mutacja (wyłączenie sufitu dla jednej klasy) czerwieni test.
ZAKRES: bitwa — tylko tempo/ruch linii w battleScene.ts i powiązane testy. Zakaz zmian statystyk jednostek, zasięgów ostrzału i JSON balansu.
KRYTERIA KOŃCA: tsc 0; 5 bramek z surowym wyjściem; test tempa: 0 tur z różnicą >1 hex dla każdego składu; mutacja czerwieni test; raport 10-operator-claude.md z SHA. Nie integrujesz, nie pushujesz na main.
UWAGA NUMERACJI: numer rundy zgodny z tą notatką (2); orkiestrator sprawdza licznik rund przed każdą kolejną.
