# R-PR141-CODEX-F04-WEALTH-RELIGION-DECISIONS-20261018 — zakres dwóch pól

**Data:** 2026-10-18  
**Status:** OWNER DECISIONS — semantyczny scope, bez nowych wartości i bez implementacji  
**Zakres:** `wealth_mnoznik_proc` oraz `religia_spread_proc`, w granicach zatwierdzonego source approval F-04. Decyzje te nie aktywują konsumentów i nie stanowią gameplay/product acceptance.

## Q1 — `wealth_mnoznik_proc`

**Literalne pytanie właściciela:** „wealth_mnoznik_proc — co skalujemy? Przy Wealth 5 i premii +20% wariant A daje mnożnik 1,72 zamiast 1,60, a B daje 1,92. Zachowujemy istniejące minimum ×1.”

**Literalna odpowiedź właściciela, 2026-10-18:** „A — przyrost mnożnika na poziom Wealth; poziom 1 pozostaje ×1.”

**Zakres decyzji:** wybór A oznacza przyrost mnożnika na każdy poziom Wealth; poziom 1 pozostaje bazowym ×1. Zachować istniejące minimum ×1. Przykład 1,72 kontra 1,92 pozostaje częścią rozróżnienia wariantów z pytania; nie dopisuje się tu dodatkowego capu ani szczegółów wzoru poza zatwierdzonym wyborem.

## Q2 — `religia_spread_proc`

**Literalne pytanie właściciela:** „religia_spread_proc — który istniejący mechanizm obejmuje? Mnożnik działa na bazowe tempo, a oddzielne dodatki świątyni/kamiennego kręgu pozostają osobne; siła nacisku na pojedynczy cel pozostaje bez zmian.”

**Literalna odpowiedź właściciela, 2026-10-18:** „A — tylko bazową liczbę sąsiednich miast obejmowanych szerzeniem na turę (z obecnym zaokrągleniem do slotów).”

**Zakres decyzji:** pole skaluje wyłącznie bazową liczbę sąsiednich miast obejmowanych szerzeniem na turę, z obecnym zaokrągleniem do slotów. Oddzielne dodatki świątyni/kamiennego kręgu pozostają niezależne; siła nacisku na pojedynczy cel pozostaje bez zmian.

## Granice

To są wyłącznie decyzje semantyczne o zakresie dwóch istniejących pól. Nie ustanawiają nowych wartości, nie rozszerzają zatwierdzenia na inne parametry, nie aktywują adapterów i nie zmieniają kodu, danych, runtime ani statusu acceptance. Implementacja wymaga własnego bounded dispatchu i review.
