# Turniej: Rolnictwo

Epoka: Kamień · Poziom: 1 · Koszt nauki: 5 · tech.json — wiersz odkrycia patrz `Technologia: "Rolnictwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Farma: +3 żywności, +3 Pracy, +3 handlu na polu | 4 | 4 | 4 | 3 | 5 | 5 | 53 | gra/data/terrain-improvements.json:12 |
| b | Tarasy (Chiny, Inkowie): +3 żywności na wzgórzu | 3 | 3 | 4 | 2 | 3 | 4 | 40 | gra/data/terrain-improvements.json:212 |
| c | Otwiera Gospodarkę wodną (Irygacja +5 żywności) | 3 | 2 | 4 | 3 | 2 | 3 | 36 | gra/data/tech.json:138; gra/data/terrain-improvements.json:29 |
| d | Warunek Wymiany — klucza do tras handlowych | 3 | 3 | 4 | 5 | 1 | 3 | 41 | gra/data/tech.json:124; gra/src/game/trade-routes.ts:1093 |

Liczba kandydatów: 4 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 3), suma ważona 53:40.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 2), suma ważona 53:36.
- a vs d → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 53:41.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 40:36.
- b vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 41:40.
- c vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 41:36.

## 3. Ranking

1. **a** — Farma: +3 żywności, +3 Pracy, +3 handlu na polu — wygrane: 3, suma: 53
2. **d** — Warunek Wymiany — klucza do tras handlowych — wygrane: 2, suma: 41
3. **b** — Tarasy (Chiny, Inkowie): +3 żywności na wzgórzu — wygrane: 1, suma: 40
4. **c** — Otwiera Gospodarkę wodną (Irygacja +5 żywności) — wygrane: 0, suma: 36

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Farma: +3 żywności, +3 Pracy, +3 handlu na polu
- Top2: Warunek Wymiany — klucza do tras handlowych
- Top3: Tarasy (Chiny, Inkowie): +3 żywności na wzgórzu
- Top4: Otwiera Gospodarkę wodną (Irygacja +5 żywności)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Postaw Farmę na łące lub równinie: kandydaci a(53) → wybrany **a** (najwyższa suma ważona).
- Postaw Tarasy uprawne na wzgórzu (Chińczycy, Inkowie): kandydaci b(40) → wybrany **b** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci c(36) → wybrany **c** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Przygotuj Farma, Tarasy uprawne na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Postaw Farmę na łące lub równinie, aby zyskać +3 żywności, +3 Pracy i +3 handlu z pola.
- Postaw Tarasy uprawne na wzgórzu (Chińczycy, Inkowie), aby uprawiać wzgórza (+3 żywności).
- Wybierz kolejne badanie, aby dojść do Irygacji (+5 żywności przy rzece).

## 6. Uwagi

Tylko 4 realne efekty; Top5 = NIE_USTALONO (brak 5. efektu w danych/kodzie).
