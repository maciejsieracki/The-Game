# Turniej: Inżynieria

Epoka: Żelazo · Poziom: 7 · Koszt nauki: 520 · tech.json — wiersz odkrycia patrz `Technologia: "Inżynieria"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Cytadela: +100% Obrony ponad Mury (razem +300%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/miasto-params.json:84; gra/src/game/city-defense.ts:67-69; gra/data/buildings.json:1498 |
| b | Baszta: kolejne +100% Obrony (komplet +400%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/miasto-params.json:89; gra/src/game/city-defense.ts:73; gra/data/buildings.json:1547 |
| c | Port wielki: +10 pieniądza i +1 trasa handlowa | 3 | 1 | 3 | 2 | 3 | 5 | 33 | gra/data/buildings.json:409; gra/src/game/trade-routes.ts:908-909 |
| d | Cud Brama narodów: +15% dochodu z tras, +10 Wpływu | 4 | 3 | 5 | 4 | 2 | 3 | 46 | gra/data/wonders.json:440-448 |
| e | Z Budownictwem otwiera Drogi brukowane | 3 | 3 | 5 | 4 | 1 | 3 | 41 | gra/data/tech.json:407 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — remis 41:41 we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- a vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 46:41.
- a vs e → **a** — remis 41:41, rozstrzyga SKALA (4 vs 3).
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- b vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 46:41.
- b vs e → **b** — remis 41:41, rozstrzyga SKALA (4 vs 3).
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 46:33.
- c vs e → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:33.
- d vs e → **d** — przewaga w kryterium SKALA (4 vs 3), suma ważona 46:41.

## 3. Ranking

1. **d** — Cud Brama narodów: +15% dochodu z tras, +10 Wpływu — wygrane: 4, suma: 46
2. **a** — Cytadela: +100% Obrony ponad Mury (razem +300%) — wygrane: 3, suma: 41
3. **b** — Baszta: kolejne +100% Obrony (komplet +400%) — wygrane: 2, suma: 41
4. **e** — Z Budownictwem otwiera Drogi brukowane — wygrane: 1, suma: 41
5. **c** — Port wielki: +10 pieniądza i +1 trasa handlowa — wygrane: 0, suma: 33

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Cud Brama narodów: +15% dochodu z tras, +10 Wpływu
- Top2: Cytadela: +100% Obrony ponad Mury (razem +300%)
- Top3: Baszta: kolejne +100% Obrony (komplet +400%)
- Top4: Z Budownictwem otwiera Drogi brukowane
- Top5: Port wielki: +10 pieniądza i +1 trasa handlowa

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Cytadelę (obok Murów): kandydaci a(41) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Basztę (obok Murów): kandydaci b(41) → wybrany **b** (najwyższa suma ważona).
- Rozbuduj Port handlowy do Portu wielkiego: kandydaci c(33) → wybrany **c** (najwyższa suma ważona).
- Wznieś cud Brama wszystkich narodów (z Wojskowością): kandydaci d(46) → wybrany **d** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci e(41) → wybrany **e** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Port wielki lub Cytadela lub Baszta, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Wznieś cud Brama wszystkich narodów (z Wojskowością), aby zwiększyć dochód z tras o 15% i zyskać 10 Wpływu.
- Zbuduj Cytadelę (obok Murów), aby podnieść obronę miasta do +300%.
- Zbuduj Basztę (obok Murów), aby podnieść obronę miasta do +400%.
- Wybierz kolejne badanie, aby dojść do Dróg brukowanych (ruch 5×).

## 6. Uwagi

Cud Brama narodów wymaga też Wojskowości (wonders.json:448; wonder-availability.ts:65) i jest wyścigiem: maxNaSwiecie=1 (wonders.json:440-448 blok cudu) — kto pierwszy, ten zbuduje.
