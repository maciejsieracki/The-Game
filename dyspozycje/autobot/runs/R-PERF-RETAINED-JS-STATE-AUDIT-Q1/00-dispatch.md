# R-PERF-RETAINED-JS-STATE-AUDIT-Q1 — dispatch

TEMAT: `R-PERF-RETAINED-JS-STATE-AUDIT-Q1`
RUNDA: 1/5
DATA: 2026-10-28
DOMAIN: GAME / READ-ONLY AUDIT
MODEL+EFFORT: Operator — Luna 6, effort medium
BAZA: `origin/main` / Robocza source, `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`

## GOAL

Zidentyfikować stan JavaScript, który może pozostawać osiągalny przez wiele tur mimo stabilnej liczby miast/jednostek. Sprawdzić mapy/cache, logi, snapshoty, listenery/timery oraz reset/load/cleanup. Oddzielić dowiedzioną retencję strukturalną od hipotezy o przyczynie zgłaszanego wzrostu pamięci do ~2 GB.

## GRANICE

Audyt wyłącznie read-only względem kodu gry. Nie naprawiać ani nie edytować źródeł, nie uruchamiać pełnej długiej symulacji, nie integrować, nie deployować i nie pushować. Zapis dozwolony wyłącznie w tym katalogu runu. Osobna dyspozycja orkiestratora zajmuje się wyciekiem szczegółów logu wojennego.

## KRYTERIA

1. Podać dokładne punkty zapisu, limit/eviction, dismiss i reset/load dla map szczegółów zdarzeń.
2. Wypisać inne append-only lub limitowane kolekcje oraz ich wzrostową zależność.
3. Zaproponować eksperyment z próbkowaniem liczności przy stabilnym świecie.
4. Nie przypisywać 2 GB konkretnej kolekcji bez pomiaru.

## OBIEG

Operator → niezależny Evaluator → Final Control. Ten run nie zezwala na zmianę źródeł ani wdrożenie.
