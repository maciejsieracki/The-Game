# Turniej: Wojskowość

Epoka: Brąz · Poziom: 4 · Koszt nauki: 208 · tech.json — wiersz odkrycia patrz `Technologia: "Wojskowość"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Koszary: rekrutacja wojska epoki Brązu i Żelaza | 5 | 5 | 5 | 3 | 4 | 5 | 59 | gra/src/game/production.ts:1071-1076; gra/data/buildings.json:1047 |
| b | Koszary: +20% parametrów bojowych jednostek | 4 | 4 | 4 | 3 | 3 | 5 | 49 | gra/data/buildings.json:1047; gra/src/game/unit-building-bonuses.ts:23-33; gra/src/game/unit-building-bonuses.ts:178 |
| c | Koszary: +2 Pracy | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/data/buildings.json:1047 |
| d | Fort: +100% Obrony obozujących i strefa 5 pól | 4 | 4 | 4 | 3 | 3 | 4 | 48 | gra/data/terrain-improvements.json:270 (pewność ŚREDNIA) |
| e | Cuda: Terakotowa armia, Yerkapı, Brama narodów | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:371-375; gra/data/wonders.json:491-496; gra/data/wonders.json:440-448 |
| f | Otwiera Oblężnictwo (Katapulta) | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:365 (reguła R-K1: N=0, O≤1) |
| g | Koszary są warunkiem Warsztatu i Akademii wojskowej | 2 | 2 | 4 | 2 | 1 | 3 | 29 | gra/src/game/building-resource-gate.ts:111; gra/src/game/building-resource-gate.ts:115 |

Liczba kandydatów: 7 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 59:49.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 59:25.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 59:48.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 59:37.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 59:32.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 59:29.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 49:25.
- b vs d → **b** — przewaga w kryterium CZYTELNOŚĆ (5 vs 4), suma ważona 49:48.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 49:37.
- b vs f → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 49:32.
- b vs g → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 49:29.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 48:25.
- c vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 1), suma ważona 37:25.
- c vs f → **f** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 1), suma ważona 32:25.
- c vs g → **g** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 1), suma ważona 29:25.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 48:37.
- d vs f → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 48:32.
- d vs g → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 48:29.
- e vs f → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:32.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 37:29.
- f vs g → **f** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 32:29.

## 3. Ranking

1. **a** — Koszary: rekrutacja wojska epoki Brązu i Żelaza — wygrane: 6, suma: 59
2. **b** — Koszary: +20% parametrów bojowych jednostek — wygrane: 5, suma: 49
3. **d** — Fort: +100% Obrony obozujących i strefa 5 pól — wygrane: 4, suma: 48
4. **e** — Cuda: Terakotowa armia, Yerkapı, Brama narodów — wygrane: 3, suma: 37
5. **f** — Otwiera Oblężnictwo (Katapulta) — wygrane: 2, suma: 32
6. **g** — Koszary są warunkiem Warsztatu i Akademii wojskowej — wygrane: 1, suma: 29
7. **c** — Koszary: +2 Pracy — wygrane: 0, suma: 25

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Koszary: rekrutacja wojska epoki Brązu i Żelaza
- Top2: Koszary: +20% parametrów bojowych jednostek
- Top3: Fort: +100% Obrony obozujących i strefa 5 pól
- Top4: Cuda: Terakotowa armia, Yerkapı, Brama narodów
- Top5: Otwiera Oblężnictwo (Katapulta)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Koszary: kandydaci a(59), b(49) → wybrany **a** (najwyższa suma ważona).
- Postaw Fort na granicy: kandydaci d(48) → wybrany **d** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci f(32) → wybrany **f** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Koszary, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Fort na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Koszary, aby rekrutować jednostki epoki Brązu i Żelaza (np. Włócznik; Konnica wraz z Jeździectwem).
- Postaw Fort na granicy, aby lepiej bronić granic (+100% Obrony, strefa 5 pól).
- Wybierz kolejne badanie, aby dojść do Katapult.

## 6. Uwagi

Fort-ulepszenie ma epoka=3 w danych (terrain-improvements.json:270); w gra/src/game nie znaleziono bramki epoki dla ulepszeń (terrain-improvements.ts:101-105 używa epoki tylko w koszcie) — pewność ŚREDNIA. „Zbuduj Koszary, jeśli spełniasz ich wymagania" — Koszary nie mają wymagań (buildings.json:1047 wymagania="").
