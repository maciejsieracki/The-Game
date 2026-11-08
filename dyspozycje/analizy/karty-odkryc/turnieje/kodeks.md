# Turniej: Kodeks

Epoka: Brąz · Poziom: 5 · Koszt nauki: 248 · tech.json — wiersz odkrycia patrz `Technologia: "Kodeks"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Dwór Zarządcy: 33 pkt Prawa w mieście regionalnym | 3 | 2 | 4 | 2 | 3 | 4 | 37 | gra/data/society-params.json:788; gra/data/society-params.json:781; gra/data/buildings.json:1838 |
| b | Dwór Zarządcy: +2 pieniądza, +3 Kultury, +1 Pracy | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:1838 |
| c | Trybunał: +17 pkt Prawa w każdym mieście | 3 | 3 | 4 | 3 | 4 | 4 | 44 | gra/data/society-params.json:802 |
| d | Trybunał: +1 pieniądza i +1 zadowolenia | 1 | 1 | 2 | 2 | 4 | 5 | 27 | gra/data/buildings.json:1938 |
| e | Z Filozofią otwiera Prawo (Sąd, Pretorium) | 3 | 2 | 5 | 4 | 1 | 3 | 38 | gra/data/tech.json:393 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 37:28.
- a vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 44:37.
- a vs d → **a** — przewaga w kryterium SKALA (3 vs 1), suma ważona 37:27.
- a vs e → **e** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 38:37.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:28.
- b vs d → **b** — przewaga w kryterium SKALA (2 vs 1), suma ważona 28:27.
- b vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 38:28.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:27.
- c vs e → **c** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 44:38.
- d vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 38:27.

## 3. Ranking

1. **c** — Trybunał: +17 pkt Prawa w każdym mieście — wygrane: 4, suma: 44
2. **e** — Z Filozofią otwiera Prawo (Sąd, Pretorium) — wygrane: 3, suma: 38
3. **a** — Dwór Zarządcy: 33 pkt Prawa w mieście regionalnym — wygrane: 2, suma: 37
4. **b** — Dwór Zarządcy: +2 pieniądza, +3 Kultury, +1 Pracy — wygrane: 1, suma: 28
5. **d** — Trybunał: +1 pieniądza i +1 zadowolenia — wygrane: 0, suma: 27

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Trybunał: +17 pkt Prawa w każdym mieście
- Top2: Z Filozofią otwiera Prawo (Sąd, Pretorium)
- Top3: Dwór Zarządcy: 33 pkt Prawa w mieście regionalnym
- Top4: Dwór Zarządcy: +2 pieniądza, +3 Kultury, +1 Pracy
- Top5: Trybunał: +1 pieniądza i +1 zadowolenia

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Rozbuduj Dom Starszyzny do Dworu Zarządcy: kandydaci a(37) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Trybunał: kandydaci c(44) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci e(38) → wybrany **e** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Dwór Zarządcy lub Trybunał, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Trybunał, aby dodać 17 pkt Prawa w dowolnym mieście.
- Wybierz kolejne badanie, aby dojść do Sądu (−30% korupcji).
- Rozbuduj Dom Starszyzny do Dworu Zarządcy, aby utrzymać porządek w mieście regionalnym (33 pkt Prawa).

## 6. Uwagi

Dwór Zarządcy tylko w mieście regionalnym (upgrade Domu Starszyzny).
