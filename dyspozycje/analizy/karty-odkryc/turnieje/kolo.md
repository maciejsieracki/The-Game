# Turniej: Koło

Epoka: Kamień · Poziom: 3 · Koszt nauki: 88 · tech.json — wiersz odkrycia patrz `Technologia: "Koło"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Droga: ruch po niej 3× szybszy | 5 | 5 | 4 | 4 | 4 | 5 | 59 | gra/data/terrain-improvements.json:288; gra/src/map/road-movement.ts:14 |
| b | Droga: +2 handlu na polu | 2 | 1 | 3 | 3 | 4 | 5 | 34 | gra/data/terrain-improvements.json:288 |
| c | Rydwan (woły): Atak 12, 400 HP, bez Koszar | 4 | 4 | 4 | 1 | 4 | 4 | 46 | gra/data/units.json:521; gra/src/game/production.ts:1071-1076 |
| d | Z Brązownictwem otwiera Jeździectwo (Konnica) | 3 | 0 | 4 | 4 | 1 | 3 | 30 | gra/data/tech.json:224 (reguła R-K1: N=0, O≤1) |
| e | Wódz epoki Kamienia to Rydwan (woły): 400 HP zamiast 60 | 3 | 3 | 4 | 3 | 3 | 4 | 42 | gra/src/game/generals.ts:71-73; gra/src/main.ts:7304-7305; gra/data/units.json:19; gra/data/units.json:537 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 59:34.
- a vs c → **a** — przewaga w kryterium ZASIĘG (4 vs 1), suma ważona 59:46.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 59:30.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 59:42.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 46:34.
- b vs d → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 34:30.
- b vs e → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:34.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 46:30.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 46:42.
- d vs e → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 42:30.

## 3. Ranking

1. **a** — Droga: ruch po niej 3× szybszy — wygrane: 4, suma: 59
2. **c** — Rydwan (woły): Atak 12, 400 HP, bez Koszar — wygrane: 3, suma: 46
3. **e** — Wódz epoki Kamienia to Rydwan (woły): 400 HP zamiast 60 — wygrane: 2, suma: 42
4. **b** — Droga: +2 handlu na polu — wygrane: 1, suma: 34
5. **d** — Z Brązownictwem otwiera Jeździectwo (Konnica) — wygrane: 0, suma: 30

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Droga: ruch po niej 3× szybszy
- Top2: Rydwan (woły): Atak 12, 400 HP, bez Koszar
- Top3: Wódz epoki Kamienia to Rydwan (woły): 400 HP zamiast 60
- Top4: Droga: +2 handlu na polu
- Top5: Z Brązownictwem otwiera Jeździectwo (Konnica)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Połącz miasta Drogą: kandydaci a(59), b(34) → wybrany **a** (najwyższa suma ważona).
- Rekrutuj Rydwan (woły): kandydaci c(46) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci d(30) → wybrany **d** (najwyższa suma ważona).
- Rekrutuj Wodza w stolicy: kandydaci e(42) → wybrany **e** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: krowa/byk.
- [Najpierw spełnij] Przygotuj Droga na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Połącz miasta Drogą, aby przyspieszyć ruch wojsk między miastami 3×.
- Rekrutuj Rydwan (woły), aby wystawić silną jednostkę uderzeniową już w epoce Kamienia.
- Rekrutuj Wodza w stolicy, aby mieć wodza na Rydwanie (woły) z 400 HP zamiast Wojownika z 60 HP.
- Wybierz kolejne badanie, aby dojść do Konnicy.

## 6. Uwagi

„Sprawdź dostęp do surowca: krowa/byk" — opisowe. 4 efekty — Top5 = NIE_USTALONO.
