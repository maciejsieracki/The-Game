# Turniej: Drogi brukowane

Epoka: Żelazo · Poziom: 8 · Koszt nauki: 680 · tech.json — wiersz odkrycia patrz `Technologia: "Drogi brukowane"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Droga brukowana: ruch 5× szybszy (Droga: 3×) | 4 | 2 | 5 | 4 | 3 | 5 | 47 | gra/data/terrain-improvements.json:303; gra/src/map/road-movement.ts:29 |
| b | Droga brukowana: +3 handlu na polu (Droga: +2) | 2 | 1 | 4 | 3 | 3 | 5 | 34 | gra/data/terrain-improvements.json:303 |
| c | Z Hutnictwem otwiera Obróbkę żelaza | 3 | 3 | 5 | 4 | 1 | 3 | 41 | gra/data/tech.json:435 |

Liczba kandydatów: 3 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 47:34.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 47:41.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:34.

## 3. Ranking

1. **a** — Droga brukowana: ruch 5× szybszy (Droga: 3×) — wygrane: 2, suma: 47
2. **c** — Z Hutnictwem otwiera Obróbkę żelaza — wygrane: 1, suma: 41
3. **b** — Droga brukowana: +3 handlu na polu (Droga: +2) — wygrane: 0, suma: 34

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Droga brukowana: ruch 5× szybszy (Droga: 3×)
- Top2: Z Hutnictwem otwiera Obróbkę żelaza
- Top3: Droga brukowana: +3 handlu na polu (Droga: +2)
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Przebuduj Drogi na Drogi brukowane: kandydaci a(47) → wybrany **a** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci c(41) → wybrany **c** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Przygotuj Droga brukowana na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Przebuduj Drogi na Drogi brukowane, aby przyspieszyć ruch po drogach z 3× do 5×.
- Wybierz kolejne badanie, aby dojść do Obróbki żelaza.

## 6. Uwagi

bonus_ruch=2 w danych to martwe pole (terrain-improvements.json:303 uwaga) — ruch liczony stałą 5 (road-movement.ts:29). 3 efekty — Top4–Top5 = NIE_USTALONO.
