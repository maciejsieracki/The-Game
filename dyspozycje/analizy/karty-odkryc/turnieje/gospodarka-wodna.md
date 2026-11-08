# Turniej: Gospodarka wodna

Epoka: Kamień · Poziom: 2 · Koszt nauki: 72 · tech.json — wiersz odkrycia patrz `Technologia: "Gospodarka wodna"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Irygacja: +5 żywności, +2 Pracy, +2 handlu przy rzece | 4 | 3 | 4 | 3 | 4 | 5 | 48 | gra/data/terrain-improvements.json:29; gra/src/game/improvement-tech.ts:39 |
| b | Studnia: +2 zdrowia i koniec kary −2 za brak wody | 3 | 3 | 4 | 2 | 4 | 4 | 42 | gra/data/society-params.json:17; gra/data/society-params.json:116; gra/src/game/turn-economy.ts:476-498 |
| c | Studnia: +1 zadowolenia (+1 na poziom) | 1 | 1 | 2 | 2 | 4 | 5 | 27 | gra/data/buildings.json:806 |
| d | Studnia jest warunkiem Akweduktu (limit 20) i Łaźni | 3 | 2 | 5 | 2 | 1 | 3 | 34 | gra/data/buildings.json:853; gra/data/buildings.json:2034; gra/data/econ-params.json:45 |
| e | Studnia w państwie jest warunkiem badania Medycyny | 2 | 2 | 5 | 5 | 1 | 3 | 37 | gra/data/tech.json:421; gra/src/game/research.ts:180 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 3), suma ważona 48:42.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 48:27.
- a vs d → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 48:34.
- a vs e → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 48:37.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:27.
- b vs d → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 42:34.
- b vs e → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 42:37.
- c vs d → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 34:27.
- c vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:27.
- d vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:34.

## 3. Ranking

1. **a** — Irygacja: +5 żywności, +2 Pracy, +2 handlu przy rzece — wygrane: 4, suma: 48
2. **b** — Studnia: +2 zdrowia i koniec kary −2 za brak wody — wygrane: 3, suma: 42
3. **e** — Studnia w państwie jest warunkiem badania Medycyny — wygrane: 2, suma: 37
4. **d** — Studnia jest warunkiem Akweduktu (limit 20) i Łaźni — wygrane: 1, suma: 34
5. **c** — Studnia: +1 zadowolenia (+1 na poziom) — wygrane: 0, suma: 27

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Irygacja: +5 żywności, +2 Pracy, +2 handlu przy rzece
- Top2: Studnia: +2 zdrowia i koniec kary −2 za brak wody
- Top3: Studnia w państwie jest warunkiem badania Medycyny
- Top4: Studnia jest warunkiem Akweduktu (limit 20) i Łaźni
- Top5: Studnia: +1 zadowolenia (+1 na poziom)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Postaw Irygację przy rzece: kandydaci a(48) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Studnię: kandydaci b(42), c(27) → wybrany **b** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Studnia, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Irygacja na odpowiednim złożu.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Postaw Irygację przy rzece, aby zyskać +5 żywności z pola przy rzece.
- Zbuduj Studnię, aby dać miastu czystą wodę (+2 zdrowia, bez kary −2).

## 6. Uwagi

terrain-improvements.json:29 ma tech „Irygacja", mapowane na Gospodarkę wodną (improvement-tech.ts:39).
