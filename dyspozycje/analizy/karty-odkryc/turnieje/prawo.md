# Turniej: Prawo

Epoka: Żelazo · Poziom: 8 · Koszt nauki: 620 · tech.json — wiersz odkrycia patrz `Technologia: "Prawo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Sąd: −30% korupcji w mieście | 4 | 3 | 3 | 2 | 3 | 5 | 42 | gra/src/game/economy.ts:1225-1235; gra/src/game/economy.ts:1247-1249 |
| b | Sąd: +19 pkt Prawa | 3 | 2 | 3 | 2 | 3 | 4 | 35 | gra/data/society-params.json:809 |
| c | Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia | 3 | 1 | 2 | 2 | 3 | 4 | 30 | gra/data/buildings.json:1742; gra/data/society-params.json:453 |
| d | Pretorium: −30% korupcji i 38 pkt Prawa w regionie | 4 | 3 | 3 | 2 | 3 | 4 | 41 | gra/src/game/economy.ts:1225-1235; gra/data/society-params.json:795; gra/data/buildings.json:1888 |
| e | Pretorium: +3 pieniądza, +5 Kultury, +2 Pracy | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:1888 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 42:35.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:30.
- a vs d → **a** — przewaga w kryterium CZYTELNOŚĆ (5 vs 4), suma ważona 42:41.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:28.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 35:30.
- b vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 41:35.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 35:28.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:30.
- c vs e → **c** — przewaga w kryterium SKALA (3 vs 2), suma ważona 30:28.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:28.

## 3. Ranking

1. **a** — Sąd: −30% korupcji w mieście — wygrane: 4, suma: 42
2. **d** — Pretorium: −30% korupcji i 38 pkt Prawa w regionie — wygrane: 3, suma: 41
3. **b** — Sąd: +19 pkt Prawa — wygrane: 2, suma: 35
4. **c** — Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia — wygrane: 1, suma: 30
5. **e** — Pretorium: +3 pieniądza, +5 Kultury, +2 Pracy — wygrane: 0, suma: 28

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Sąd: −30% korupcji w mieście
- Top2: Pretorium: −30% korupcji i 38 pkt Prawa w regionie
- Top3: Sąd: +19 pkt Prawa
- Top4: Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia
- Top5: Pretorium: +3 pieniądza, +5 Kultury, +2 Pracy

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Sąd: kandydaci a(42) → wybrany **a** (najwyższa suma ważona).
- Rozbuduj Dwór Zarządcy do Pretorium: kandydaci d(41) → wybrany **d** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Sąd lub Pretorium, jeśli spełniasz ich wymagania.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Sąd, aby obniżyć korupcję w mieście o 30%.
- Rozbuduj Dwór Zarządcy do Pretorium, aby obniżyć korupcję miasta regionalnego o 30%.

## 6. Uwagi

Brak kolejnych technologii.
