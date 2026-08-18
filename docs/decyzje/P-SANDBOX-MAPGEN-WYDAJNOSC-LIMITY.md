# P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY — semantyka bramki czasu generatora

**Status:** 🟡 **ZAPISANA — ECHO B; gotowe do dispatchu Operatora Workflow**
**Data ECHO:** 2026-08-18

## Decyzja właściciela

**B** — czas generowania mapy ma być ostrzeżeniem, a twarde pozostają
kryteria poprawności generatora: determinizm, ujścia rzek i poprawność mapy.

## Kontekst

Mapa standardowa generuje się w tym środowisku około **76–114 sekund** przy
historycznym limicie **7 sekund**. Duża mapa osiąga około **1016 sekund** przy
limicie **15 sekund**. Większość czasu CPU przypada na `riversMain` i
`riversFill`; to znany limit środowiska, nie potwierdzona regresja jakości mapy.

## Kontrakt Operatora

- zmienić wyłącznie semantykę progów czasu w `map-gen-regression-test.cjs`;
- przekroczenie czasu ma emitować ostrzeżenie, nie powodować FAIL/exit 1;
- zachować twarde FAIL dla determinizmu, braku ujścia rzek i pozostałych
  kryteriów poprawności;
- nie zmieniać generatora terenu, liczby rzek ani parametrów gameplayu;
- dodać test negacji: poprawność FAIL nadal kończy się błędem, sam czas ponad
  próg nie;
- uruchomić test celowany i typecheck; pełny mapgen może mieć jawny TIMEOUT.

## Następny gate

Operator Workflow → niezależny Evaluator → finalna kontrola → integracja.
