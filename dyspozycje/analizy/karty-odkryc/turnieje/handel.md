# Turniej: Handel

Epoka: Brąz · Poziom: 5 · Koszt nauki: 296 · tech.json — wiersz odkrycia patrz `Technologia: "Handel"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Emporion: +8 pieniądza (+4 na poziom) | 3 | 1 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:1095 |
| b | Emporion: +1 trasa handlowa i premia 5% trasy | 3 | 3 | 3 | 2 | 3 | 4 | 38 | gra/src/game/trade-routes.ts:908-921; gra/src/game/trade-routes.ts:1659; gra/data/buildings.json:1095 |
| c | Magazyn: +20% pojemności magazynu państwa | 3 | 3 | 5 | 5 | 3 | 5 | 49 | gra/data/econ-params.json:613; gra/src/game/economy-upkeep.ts:431 |
| d | Magazyn: +1 Pracy i +1 pieniądza | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/data/buildings.json:1154 |
| e | Z Matematyką otwiera Walutę (Mennica) | 4 | 3 | 5 | 5 | 1 | 3 | 46 | gra/data/tech.json:308 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:35.
- a vs c → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 49:35.
- a vs d → **a** — przewaga w kryterium SKALA (3 vs 1), suma ważona 35:25.
- a vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:35.
- b vs c → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 49:38.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:25.
- b vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:38.
- c vs d → **c** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 1), suma ważona 49:25.
- c vs e → **c** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 49:46.
- d vs e → **e** — przewaga w kryterium SKALA (4 vs 1), suma ważona 46:25.

## 3. Ranking

1. **c** — Magazyn: +20% pojemności magazynu państwa — wygrane: 4, suma: 49
2. **e** — Z Matematyką otwiera Walutę (Mennica) — wygrane: 3, suma: 46
3. **b** — Emporion: +1 trasa handlowa i premia 5% trasy — wygrane: 2, suma: 38
4. **a** — Emporion: +8 pieniądza (+4 na poziom) — wygrane: 1, suma: 35
5. **d** — Magazyn: +1 Pracy i +1 pieniądza — wygrane: 0, suma: 25

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Magazyn: +20% pojemności magazynu państwa
- Top2: Z Matematyką otwiera Walutę (Mennica)
- Top3: Emporion: +1 trasa handlowa i premia 5% trasy
- Top4: Emporion: +8 pieniądza (+4 na poziom)
- Top5: Magazyn: +1 Pracy i +1 pieniądza

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Emporion (obok Targowiska): kandydaci a(35), b(38) → wybrany **b** (najwyższa suma ważona).
- Zbuduj Magazyn: kandydaci c(49) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci e(46) → wybrany **e** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Emporion lub Magazyn, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Magazyn, aby zwiększyć pojemność magazynu państwa o 20%.
- Wybierz kolejne badanie, aby dojść do Mennicy.
- Zbuduj Emporion (obok Targowiska), aby otworzyć miastu kolejną trasę handlową.

## 6. Uwagi

Emporion wymaga Targowiska w mieście (buildings.json:1095 uwagi).
