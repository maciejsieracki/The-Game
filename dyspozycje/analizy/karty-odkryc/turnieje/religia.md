# Turniej: Religia

Epoka: Brąz · Poziom: 4 · Koszt nauki: 192 · tech.json — wiersz odkrycia patrz `Technologia: "Religia"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Świątynia: szerzy religię +4% na turę | 3 | 3 | 4 | 2 | 3 | 4 | 40 | gra/data/society-params.json:581 |
| b | Świątynia: +2 Kultury i +2 zadowolenia | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:696 |
| c | Cud narodowy: Stupa w Sanchi (Harappa) | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:200-204 |
| d | Otwiera Kodeks, Filozofię, Astronomię | 3 | 3 | 5 | 5 | 2 | 3 | 45 | gra/data/tech.json:280; gra/data/tech.json:379; gra/data/tech.json:322 |

Liczba kandydatów: 4 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 40:30.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 2), suma ważona 40:37.
- a vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 45:40.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:30.
- b vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 45:30.
- c vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 45:37.

## 3. Ranking

1. **d** — Otwiera Kodeks, Filozofię, Astronomię — wygrane: 3, suma: 45
2. **a** — Świątynia: szerzy religię +4% na turę — wygrane: 2, suma: 40
3. **c** — Cud narodowy: Stupa w Sanchi (Harappa) — wygrane: 1, suma: 37
4. **b** — Świątynia: +2 Kultury i +2 zadowolenia — wygrane: 0, suma: 30

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Otwiera Kodeks, Filozofię, Astronomię
- Top2: Świątynia: szerzy religię +4% na turę
- Top3: Cud narodowy: Stupa w Sanchi (Harappa)
- Top4: Świątynia: +2 Kultury i +2 zadowolenia
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Świątynię (obok Kamiennych kręgów): kandydaci a(40), b(30) → wybrany **a** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci d(45) → wybrany **d** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Świątynia, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Wybierz kolejne badanie, aby dojść do Kodeksu i Filozofii.
- Zbuduj Świątynię (obok Kamiennych kręgów), aby szerzyć swoją religię o 4% na turę.

## 6. Uwagi

Świątynia wymaga Kamiennych kręgów w mieście. 4 efekty — Top5 = NIE_USTALONO.
