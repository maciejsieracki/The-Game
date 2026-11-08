# Turniej: Sztuka wojenna

Epoka: Żelazo · Poziom: 9 · Koszt nauki: 800 · tech.json — wiersz odkrycia patrz `Technologia: "Sztuka wojenna"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Akademia wojskowa: +20% parametrów (z Koszarami +40%) | 4 | 3 | 4 | 3 | 3 | 5 | 46 | gra/data/buildings.json:2082; gra/src/game/unit-building-bonuses.ts:23-33; gra/src/game/unit-building-bonuses.ts:178 |
| b | Akademia wojskowa: +3 Pracy, +2 pieniądza | 1 | 1 | 1 | 2 | 3 | 5 | 23 | gra/data/buildings.json:2082 |

Liczba kandydatów: 2 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 46:23.

## 3. Ranking

1. **a** — Akademia wojskowa: +20% parametrów (z Koszarami +40%) — wygrane: 1, suma: 46
2. **b** — Akademia wojskowa: +3 Pracy, +2 pieniądza — wygrane: 0, suma: 23

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Akademia wojskowa: +20% parametrów (z Koszarami +40%)
- Top2: Akademia wojskowa: +3 Pracy, +2 pieniądza
- Top3: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Akademię wojskową (obok Koszar): kandydaci a(46) → wybrany **a** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Akademia wojskowa, jeśli spełniasz ich wymagania.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Akademię wojskową (obok Koszar), aby wzmocnić jednostki o kolejne +20% (razem do +50%).

## 6. Uwagi

„Bramka elit UNITS" z uwag tech.json — brak bramki akademia_wojskowa w production.ts (grep): NIE_USTALONO. 2 efekty — Top3–Top5 = NIE_USTALONO.
