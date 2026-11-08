# Turniej: Inżynieria

Epoka: Żelazo · Poziom: 7 · Koszt nauki: 520 · tech.json — wiersz odkrycia patrz `Technologia: "Inżynieria"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Cytadela: +100% Obrony ponad Mury (razem +300%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/miasto-params.json:84; gra/src/game/city-defense.ts:67-69; gra/data/buildings.json:1498 |
| b | Baszta: kolejne +100% Obrony (komplet +400%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/miasto-params.json:89; gra/src/game/city-defense.ts:73; gra/data/buildings.json:1547 |
| c | Port wielki: +10 pieniądza i +1 trasa handlowa | 3 | 1 | 3 | 2 | 3 | 5 | 33 | gra/data/buildings.json:409; gra/src/game/trade-routes.ts:908-909 |
| d | Cud Brama narodów: +15% dochodu z tras, +10 Wpływu | 4 | 3 | 5 | 4 | 2 | 3 | 46 | gra/data/wonders.json:440-448 |
| e | Z Budownictwem otwiera Drogi brukowane | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:407 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — remis 41:41 we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- a vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 46:41.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 41:32.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- b vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 46:41.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 41:32.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 46:33.
- c vs e → **c** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 33:32.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 46:32.

## 3. Ranking

1. **d** — Cud Brama narodów: +15% dochodu z tras, +10 Wpływu — wygrane: 4, suma: 46
2. **a** — Cytadela: +100% Obrony ponad Mury (razem +300%) — wygrane: 3, suma: 41
3. **b** — Baszta: kolejne +100% Obrony (komplet +400%) — wygrane: 2, suma: 41
4. **c** — Port wielki: +10 pieniądza i +1 trasa handlowa — wygrane: 1, suma: 33
5. **e** — Z Budownictwem otwiera Drogi brukowane — wygrane: 0, suma: 32

Reguła E1 (Top1 = korzyść od ręki dla każdej cywilizacji, bez kolejnego badania i bez wyścigu): d nie spełnia E1 → Top1 = **a** (najwyżej w rankingu spośród spełniających E1); pozostałe miejsca w kolejności turnieju.

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: a > d > b > c > e (Obrona: a > d > b > c > e).

Status: FINALNE (FC r1: trzeci turniej — zgodny z Obroną)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Cytadela: +100% Obrony ponad Mury (razem +300%)
- Top2: Cud Brama narodów: +15% dochodu z tras, +10 Wpływu
- Top3: Baszta: kolejne +100% Obrony (komplet +400%)
- Top4: Port wielki: +10 pieniądza i +1 trasa handlowa
- Top5: Z Budownictwem otwiera Drogi brukowane

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Cytadelę (obok Murów): kandydaci a(41) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Basztę (obok Murów): kandydaci b(41) → wybrany **b** (najwyższa suma ważona).
- Rozbuduj Port handlowy do Portu wielkiego: kandydaci c(33) → wybrany **c** (najwyższa suma ważona).
- Wznieś cud Brama wszystkich narodów (z Wojskowością): kandydaci d(44) → wybrany **d** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci e(32) → wybrany **e** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Port wielki lub Cytadela lub Baszta, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Cytadelę (obok Murów), aby podnieść obronę miasta do +300%.
- Zbuduj Basztę (obok Murów), aby podnieść obronę miasta do +400%.
- Rozbuduj Port handlowy do Portu wielkiego, aby podwoić dochód portu (+10 pieniądza).
- Wznieś cud Brama wszystkich narodów (z Wojskowością), aby zwiększyć dochód z tras o 15% i zyskać 10 Wpływu.

## 6. Uwagi

Cud Brama narodów wymaga też Wojskowości (wonders.json:448; wonder-availability.ts:65) i jest wyścigiem: maxNaSwiecie=1 (wonders.json:440-448 blok cudu) — kto pierwszy, ten zbuduje.
