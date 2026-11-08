# Turniej: Oswojenie zwierząt

Epoka: Kamień · Poziom: 1 · Koszt nauki: 5 · tech.json — wiersz odkrycia patrz `Technologia: "Oswojenie zwierząt"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Trzoda: +2 żywności, +4 Pracy, +3 handlu, bez złoża | 4 | 4 | 4 | 3 | 5 | 5 | 53 | gra/data/terrain-improvements.json:45 |
| b | Owce: +1 żywności, +2 Pracy, +2 handlu na wzgórzu | 2 | 2 | 4 | 3 | 4 | 4 | 38 | gra/data/terrain-improvements.json:63 |
| c | Lama (Inkowie): +3 Pracy także w górach i lesie | 3 | 2 | 4 | 2 | 4 | 4 | 39 | gra/data/terrain-improvements.json:81 |
| d | Otwiera Koło (Drogi, Rydwan) | 3 | 3 | 4 | 4 | 2 | 3 | 41 | gra/data/tech.json:152 |
| e | Warunek Wymiany — klucza do tras handlowych | 3 | 3 | 4 | 5 | 1 | 3 | 41 | gra/data/tech.json:124; gra/src/game/trade-routes.ts:1093 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 53:38.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 53:39.
- a vs d → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 2), suma ważona 53:41.
- a vs e → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 53:41.
- b vs c → **c** — przewaga w kryterium SKALA (3 vs 2), suma ważona 39:38.
- b vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 41:38.
- b vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 41:38.
- c vs d → **d** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 41:39.
- c vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 41:39.
- d vs e → **e** — remis 41:41, rozstrzyga ZASIĘG (5 vs 4).

## 3. Ranking

1. **a** — Trzoda: +2 żywności, +4 Pracy, +3 handlu, bez złoża — wygrane: 4, suma: 53
2. **e** — Warunek Wymiany — klucza do tras handlowych — wygrane: 3, suma: 41
3. **d** — Otwiera Koło (Drogi, Rydwan) — wygrane: 2, suma: 41
4. **c** — Lama (Inkowie): +3 Pracy także w górach i lesie — wygrane: 1, suma: 39
5. **b** — Owce: +1 żywności, +2 Pracy, +2 handlu na wzgórzu — wygrane: 0, suma: 38

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Trzoda: +2 żywności, +4 Pracy, +3 handlu, bez złoża
- Top2: Warunek Wymiany — klucza do tras handlowych
- Top3: Otwiera Koło (Drogi, Rydwan)
- Top4: Lama (Inkowie): +3 Pracy także w górach i lesie
- Top5: Owce: +1 żywności, +2 Pracy, +2 handlu na wzgórzu

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Postaw Trzodę na łące lub równinie: kandydaci a(53) → wybrany **a** (najwyższa suma ważona).
- Postaw Owce na wzgórzu: kandydaci b(38) → wybrany **b** (najwyższa suma ważona).
- Postaw Lamy w górach (Inkowie): kandydaci c(39) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci d(41) → wybrany **d** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: krowa/byk, owce, bydlo, lama.
- [Najpierw spełnij] Przygotuj Trzoda, Owce, Lama na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Postaw Trzodę na łące lub równinie, aby zyskać +4 Pracy i +2 żywności z pola bez złoża.
- Wybierz kolejne badanie, aby dojść do Dróg i Rydwanów.
- Postaw Lamy w górach (Inkowie), aby zagospodarować góry (+3 Pracy).
- Postaw Owce na wzgórzu, aby zagospodarować wzgórza (+2 Pracy).

## 6. Uwagi

„Sprawdź dostęp do surowca: krowa/byk, owce, bydlo, lama" — surowe klucze, pole opisowe. Trzoda nie wymaga złoża (terrain-improvements.json:45 uwaga).
