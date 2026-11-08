# Turniej: Hutnictwo żelaza

Epoka: Brąz · Poziom: 6 · Koszt nauki: 480 · tech.json — wiersz odkrycia patrz `Technologia: "Hutnictwo żelaza"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Awans do epoki Żelaza: nowe budynki i wyższe ich poziomy | 5 | 5 | 5 | 5 | 4 | 3 | 61 | gra/data/tech.json:347; gra/src/game/playerState.ts:310-323; gra/src/game/production.ts:252-262; gra/src/game/production.ts:966 |
| b | Limit wodzów rośnie z 2 do 3 | 4 | 3 | 5 | 5 | 4 | 5 | 54 | gra/src/game/generals.ts:2-4 |
| c | Odlewnia żelaza: żelazo i brąz, +12 Pracy | 4 | 5 | 5 | 5 | 2 | 3 | 54 | gra/src/game/converters.ts:98-99; gra/data/buildings.json:204 |
| d | Kopalnia żelaza: +20 rudy żelaza na turę | 3 | 4 | 5 | 5 | 3 | 4 | 51 | gra/data/terrain-improvements.json:340; gra/data/terrain-improvements.json:349 |
| e | Kuźnia żelaza: kolejne +15% Pancerza (razem +30%) | 3 | 2 | 4 | 3 | 2 | 5 | 38 | gra/data/buildings.json:1398; gra/src/game/unit-building-bonuses.ts:15-22 |
| f | 19 narodowych jednostek z żelaza, np. Falanga (Obrona 10) | 4 | 3 | 4 | 2 | 1 | 3 | 38 | gra/data/units.json:743; gra/data/units.json:891; gra/src/game/production.ts:1075; gra/src/game/production.ts:1092 |
| g | Z Drogami brukowanymi otwiera Obróbkę żelaza | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:435 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 7 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 61:54.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 61:54.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 61:51.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:38.
- a vs f → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 61:38.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 61:32.
- b vs c → **c** — remis 54:54, rozstrzyga NOWA MECHANIKA (5 vs 3).
- b vs d → **b** — przewaga w kryterium SKALA (4 vs 3), suma ważona 54:51.
- b vs e → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 54:38.
- b vs f → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 54:38.
- b vs g → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 54:32.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 54:51.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 54:38.
- c vs f → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 54:38.
- c vs g → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 54:32.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 51:38.
- d vs f → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 51:38.
- d vs g → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 51:32.
- e vs f → **f** — remis 38:38, rozstrzyga SKALA (4 vs 3).
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 38:32.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:32.

## 3. Ranking

1. **a** — Awans do epoki Żelaza: nowe budynki i wyższe ich poziomy — wygrane: 6, suma: 61
2. **c** — Odlewnia żelaza: żelazo i brąz, +12 Pracy — wygrane: 5, suma: 54
3. **b** — Limit wodzów rośnie z 2 do 3 — wygrane: 4, suma: 54
4. **d** — Kopalnia żelaza: +20 rudy żelaza na turę — wygrane: 3, suma: 51
5. **f** — 19 narodowych jednostek z żelaza, np. Falanga (Obrona 10) — wygrane: 2, suma: 38
6. **e** — Kuźnia żelaza: kolejne +15% Pancerza (razem +30%) — wygrane: 1, suma: 38
7. **g** — Z Drogami brukowanymi otwiera Obróbkę żelaza — wygrane: 0, suma: 32

Status: FINALNE (FC r1: zatwierdzone bez trzeciego turnieju — zgodność Operator/Evaluator ≥ 3/5, sporne pozycje rozstrzygnięte w Obronie)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Awans do epoki Żelaza: nowe budynki i wyższe ich poziomy
- Top2: Odlewnia żelaza: żelazo i brąz, +12 Pracy
- Top3: Limit wodzów rośnie z 2 do 3
- Top4: Kopalnia żelaza: +20 rudy żelaza na turę
- Top5: 19 narodowych jednostek z żelaza, np. Falanga (Obrona 10)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Rozbuduj Odlewnię brązu do Odlewni żelaza: kandydaci c(54) → wybrany **c** (najwyższa suma ważona).
- Postaw Kopalnię żelaza na złożu: kandydaci d(51) → wybrany **d** (najwyższa suma ważona).
- Rozbuduj Kuźnię brązu do Kuźni żelaza: kandydaci e(38) → wybrany **e** (najwyższa suma ważona).
- Rekrutuj jednostki z żelaza (w mieście z Koszarami): kandydaci f(38) → wybrany **f** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci g(32) → wybrany **g** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: żelazo.
- [Najpierw spełnij] Zbuduj Odlewnia żelaza lub Kuźnia żelaza, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Rozbuduj Odlewnię brązu do Odlewni żelaza, aby wytwarzać żelazo do najlepszego wojska.
- Postaw Kopalnię żelaza na złożu, aby wydobywać 20 rudy żelaza na turę.
- Rozbuduj Kuźnię brązu do Kuźni żelaza, aby podnieść Pancerz jednostek do +30%.
- Rekrutuj jednostki z żelaza (w mieście z Koszarami), aby wystawić narodową piechotę epoki Żelaza (np. Falanga z Obroną 10).

## 6. Uwagi

Badanie wymaga Odlewni brązu (tech.json:336). Wszystkie 19 jednostek z Tech=Hutnictwo żelaza mają przypisaną nację (units.json) — brak ogólnodostępnej jednostki żelaznej. Kopalnia żelaza niepokazana na karcie. Po awansie do epoki 3 jednostki epoki Kamienia znikają z rekrutacji (production.ts:1051).
