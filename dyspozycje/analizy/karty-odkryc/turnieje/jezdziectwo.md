# Turniej: Jeździectwo

Epoka: Brąz · Poziom: 4 · Koszt nauki: 224 · tech.json — wiersz odkrycia patrz `Technologia: "Jeździectwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Konnica: Atak 12, 320 HP, ruch 4 (koszt: brąz i 25 koni) | 4 | 3 | 4 | 1 | 1 | 4 | 37 | gra/data/units.json:595; gra/src/game/production.ts:1075; gra/src/game/building-stock-cost.ts:362-369 |
| b | Rydwan konny: 360 HP, ruch 4 | 3 | 2 | 3 | 1 | 1 | 3 | 28 | gra/data/units.json:1779 |
| c | Stadnina: +25 koni/turę — koszt 1 jednostki konnej | 3 | 4 | 5 | 3 | 3 | 4 | 47 | gra/data/terrain-improvements.json:100; gra/data/terrain-improvements.json:109; gra/src/game/building-stock-cost.ts:362-369 |
| d | Rydwany i jeźdźcy narodowi (6 cywilizacji) | 3 | 1 | 3 | 1 | 1 | 3 | 25 | gra/data/units.json:1039; gra/data/units.json:1927; gra/data/units.json:2297; gra/data/units.json:2593; gra/data/units.json:2815; gra/data/units.json:4394 |

Liczba kandydatów: 4 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 37:28.
- a vs c → **c** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 47:37.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:25.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 47:28.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 28:25.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 47:25.

## 3. Ranking

1. **c** — Stadnina: +25 koni/turę — koszt 1 jednostki konnej — wygrane: 3, suma: 47
2. **a** — Konnica: Atak 12, 320 HP, ruch 4 (koszt: brąz i 25 koni) — wygrane: 2, suma: 37
3. **b** — Rydwan konny: 360 HP, ruch 4 — wygrane: 1, suma: 28
4. **d** — Rydwany i jeźdźcy narodowi (6 cywilizacji) — wygrane: 0, suma: 25

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Stadnina: +25 koni/turę — koszt 1 jednostki konnej
- Top2: Konnica: Atak 12, 320 HP, ruch 4 (koszt: brąz i 25 koni)
- Top3: Rydwan konny: 360 HP, ruch 4
- Top4: Rydwany i jeźdźcy narodowi (6 cywilizacji)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Rekrutuj Konnicę (w mieście z Koszarami): kandydaci a(37) → wybrany **a** (najwyższa suma ważona).
- Postaw Stadninę na złożu koni: kandydaci c(47) → wybrany **c** (najwyższa suma ważona).

Obecnie na karcie:

- (sekcja pusta — niewyrenderowana)

Propozycja:

- Postaw Stadninę na złożu koni, aby hodować 25 koni na turę — tyle kosztuje rekrutacja 1 jednostki konnej.
- Rekrutuj Konnicę (w mieście z Koszarami), aby mieć najszybszą jednostkę uderzeniową (ruch 4).

## 6. Uwagi

Stadnina (terrain-improvements.json:100, tech=Jeździectwo) niepokazana na karcie. Wszystkie jednostki wymagają Koszar i brązu. Brak kolejnych technologii. 4 efekty — Top5 = NIE_USTALONO.
