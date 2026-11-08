# Turniej: Murarstwo

Epoka: Kamień · Poziom: 2 · Koszt nauki: 56 · tech.json — wiersz odkrycia patrz `Technologia: "Murarstwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Kamieniołom: +50 kamienia na turę do magazynu | 4 | 4 | 5 | 5 | 5 | 5 | 59 | gra/data/terrain-improvements.json:136; gra/data/terrain-improvements.json:146 |
| b | Warsztat kamieniarski: +4 Pracy (+2 na poziom) | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:61 |
| c | Każdy Warsztat kamieniarski: +10% kamienia w państwie | 3 | 3 | 4 | 5 | 3 | 4 | 46 | gra/data/econ-params.json:292; gra/src/game/turn-economy.ts:1539 |
| d | Stela: +1 Kultury (+1 na poziom), bez utrzymania | 1 | 1 | 2 | 2 | 4 | 4 | 26 | gra/data/buildings.json:1202; gra/data/society-params.json:446 |
| e | Posterunek (z Obróbką drewna): strefa 3 pól, +50% Obrony | 2 | 4 | 3 | 3 | 2 | 3 | 37 | gra/data/terrain-improvements.json:394; gra/src/game/improvement-tech.ts:46-47 |
| f | Cuda narodowe: Piramidy (Egipt) i inne | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:77-81; gra/data/wonders.json:347-351; gra/data/wonders.json:468-472 |
| g | Otwiera Brązownictwo i Budownictwo (Mury) | 2 | 0 | 3 | 5 | 1 | 4 | 28 | gra/data/tech.json:166; gra/data/tech.json:294 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 7 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 59:30.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 3), suma ważona 59:46.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 59:26.
- a vs e → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 2), suma ważona 59:37.
- a vs f → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 2), suma ważona 59:37.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 59:28.
- b vs c → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:30.
- b vs d → **b** — przewaga w kryterium SKALA (2 vs 1), suma ważona 30:26.
- b vs e → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 37:30.
- b vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:30.
- b vs g → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 30:28.
- c vs d → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:26.
- c vs e → **c** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 46:37.
- c vs f → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:37.
- c vs g → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 46:28.
- d vs e → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 37:26.
- d vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:26.
- d vs g → **g** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 28:26.
- e vs f → **f** — remis 37:37, rozstrzyga SKALA (3 vs 2).
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 37:28.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:28.

## 3. Ranking

1. **a** — Kamieniołom: +50 kamienia na turę do magazynu — wygrane: 6, suma: 59
2. **c** — Każdy Warsztat kamieniarski: +10% kamienia w państwie — wygrane: 5, suma: 46
3. **f** — Cuda narodowe: Piramidy (Egipt) i inne — wygrane: 4, suma: 37
4. **e** — Posterunek (z Obróbką drewna): strefa 3 pól, +50% Obrony — wygrane: 3, suma: 37
5. **b** — Warsztat kamieniarski: +4 Pracy (+2 na poziom) — wygrane: 2, suma: 30
6. **g** — Otwiera Brązownictwo i Budownictwo (Mury) — wygrane: 1, suma: 28
7. **d** — Stela: +1 Kultury (+1 na poziom), bez utrzymania — wygrane: 0, suma: 26

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Kamieniołom: +50 kamienia na turę do magazynu
- Top2: Każdy Warsztat kamieniarski: +10% kamienia w państwie
- Top3: Cuda narodowe: Piramidy (Egipt) i inne
- Top4: Posterunek (z Obróbką drewna): strefa 3 pól, +50% Obrony
- Top5: Warsztat kamieniarski: +4 Pracy (+2 na poziom)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Postaw Kamieniołom na wzgórzu lub w górach: kandydaci a(59) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Warsztat kamieniarski: kandydaci b(30), c(46) → wybrany **c** (najwyższa suma ważona).
- Postaw Stelę / Pomnik: kandydaci d(26) → wybrany **d** (najwyższa suma ważona).
- Postaw Posterunek na skraju granic (wymaga też Murarstwa/Obróbki drewna): kandydaci e(37) → wybrany **e** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci g(28) → wybrany **g** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: kamien, ruda.
- [Najpierw spełnij] Zbuduj Warsztat kamieniarski lub Stela / Pomnik, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Kamieniołom, Posterunek (Strażnica) na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Postaw Kamieniołom na wzgórzu lub w górach, aby wydobywać 50 kamienia na turę (mury, świątynie).
- Zbuduj Warsztat kamieniarski, aby zwiększyć wydobycie kamienia państwa o 10%.
- Postaw Posterunek na skraju granic (wymaga też Murarstwa/Obróbki drewna), aby zabezpieczyć granicę strefą 3 pól.
- Postaw Stelę / Pomnik, aby zyskać Kulturę bez kosztów utrzymania.

## 6. Uwagi

Pole tech.json „Odblokowuje surowiec: kamien, ruda" opisowe; ruda faktycznie z Kopalni miedzi (Brązownictwo).
