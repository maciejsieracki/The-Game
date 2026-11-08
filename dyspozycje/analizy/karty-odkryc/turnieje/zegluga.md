# Turniej: Żegluga

Epoka: Brąz · Poziom: 4 · Koszt nauki: 160 · tech.json — wiersz odkrycia patrz `Technologia: "Żegluga"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Wojsko lądowe może wchodzić na wodę (zaokrętowanie) | 5 | 5 | 5 | 5 | 5 | 4 | 64 | gra/src/game/embarkation.ts:25; gra/src/game/embarkation.ts:28-36 |
| b | Port handlowy: +5 pieniądza i +1 Pracy | 3 | 1 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:361 |
| c | Port: +1 trasa handlowa miasta | 3 | 3 | 3 | 2 | 3 | 4 | 38 | gra/src/game/trade-routes.ts:908-921 |
| d | Łodzie rybackie: +2 żywności, +3 Pracy, +3 handlu | 3 | 4 | 5 | 3 | 4 | 5 | 50 | gra/data/terrain-improvements.json:234 |
| e | Galera: okręt wojenny (miasto nad wodą + Koszary) | 3 | 4 | 5 | 1 | 1 | 3 | 38 | gra/data/units.json:669; gra/src/game/production.ts:1075-1083 |
| f | Cud Kamień Ha'amonga: +15% dochodu z tras morskich | 3 | 3 | 5 | 4 | 2 | 3 | 43 | gra/data/wonders.json:247-255 |
| g | Z Pismem otwiera Handel (Emporion, Magazyn) | 3 | 0 | 4 | 5 | 1 | 3 | 32 | gra/data/tech.json:266 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 7 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 64:35.
- a vs c → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 64:38.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 64:50.
- a vs e → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 64:38.
- a vs f → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 2), suma ważona 64:43.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 64:32.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:35.
- b vs d → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 50:35.
- b vs e → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 38:35.
- b vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 43:35.
- b vs g → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 35:32.
- c vs d → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 50:38.
- c vs e → **c** — remis 38:38, rozstrzyga ZASIĘG (2 vs 1).
- c vs f → **f** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 43:38.
- c vs g → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:32.
- d vs e → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 50:38.
- d vs f → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 50:43.
- d vs g → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 50:32.
- e vs f → **f** — przewaga w kryterium ZASIĘG (4 vs 1), suma ważona 43:38.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 38:32.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 43:32.

## 3. Ranking

1. **a** — Wojsko lądowe może wchodzić na wodę (zaokrętowanie) — wygrane: 6, suma: 64
2. **d** — Łodzie rybackie: +2 żywności, +3 Pracy, +3 handlu — wygrane: 5, suma: 50
3. **f** — Cud Kamień Ha'amonga: +15% dochodu z tras morskich — wygrane: 4, suma: 43
4. **c** — Port: +1 trasa handlowa miasta — wygrane: 3, suma: 38
5. **e** — Galera: okręt wojenny (miasto nad wodą + Koszary) — wygrane: 2, suma: 38
6. **b** — Port handlowy: +5 pieniądza i +1 Pracy — wygrane: 1, suma: 35
7. **g** — Z Pismem otwiera Handel (Emporion, Magazyn) — wygrane: 0, suma: 32

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Wojsko lądowe może wchodzić na wodę (zaokrętowanie)
- Top2: Łodzie rybackie: +2 żywności, +3 Pracy, +3 handlu
- Top3: Cud Kamień Ha'amonga: +15% dochodu z tras morskich
- Top4: Port: +1 trasa handlowa miasta
- Top5: Galera: okręt wojenny (miasto nad wodą + Koszary)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zaokrętuj wojsko lądowe: kandydaci a(64) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Port handlowy w mieście nad wodą: kandydaci b(35), c(38) → wybrany **c** (najwyższa suma ważona).
- Postaw Łodzie rybackie na ławicy: kandydaci d(50) → wybrany **d** (najwyższa suma ważona).
- Zbuduj Galerę w mieście nad wodą: kandydaci e(38) → wybrany **e** (najwyższa suma ważona).
- Wznieś cud Kamień Ha'amonga: kandydaci f(43) → wybrany **f** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci g(32) → wybrany **g** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Port handlowy, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Łodzie rybackie na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zaokrętuj wojsko lądowe, aby przerzucić armię przez morze lub rzekę bez budowy floty.
- Postaw Łodzie rybackie na ławicy, aby wykorzystać morze (+2 żywności, +3 Pracy).
- Zbuduj Port handlowy w mieście nad wodą, aby otworzyć miastu kolejną trasę handlową.
- Zbuduj Galerę w mieście nad wodą, aby mieć własną flotę wojenną.

## 6. Uwagi

Zaokrętowanie (embarkation.ts:25) niepokazane. Badanie wymaga Tartaku w państwie (tech.json:181 „wymagane ulepszenie"; research.ts:224). Galera wymaga Koszar (epoka Brąz).
