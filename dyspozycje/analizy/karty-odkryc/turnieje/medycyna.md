# Turniej: Medycyna

Epoka: Żelazo · Poziom: 8 · Koszt nauki: 648 · tech.json — wiersz odkrycia patrz `Technologia: "Medycyna"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Łaźnia publiczna: +5 zdrowia miasta | 3 | 2 | 4 | 2 | 3 | 5 | 38 | gra/data/society-params.json:31; gra/src/game/turn-economy.ts:486 |
| b | Łaźnia: +3 Kultury, +3 zadowolenia, +1 żywności | 3 | 1 | 3 | 2 | 3 | 4 | 32 | gra/data/buildings.json:2034; gra/data/society-params.json:460 |

Liczba kandydatów: 2 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 38:32.

## 3. Ranking

1. **a** — Łaźnia publiczna: +5 zdrowia miasta — wygrane: 1, suma: 38
2. **b** — Łaźnia: +3 Kultury, +3 zadowolenia, +1 żywności — wygrane: 0, suma: 32

Status: FINALNE (FC r1: zatwierdzone bez trzeciego turnieju — zgodność Operator/Evaluator ≥ 3/5, sporne pozycje rozstrzygnięte w Obronie)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Łaźnia publiczna: +5 zdrowia miasta
- Top2: Łaźnia: +3 Kultury, +3 zadowolenia, +1 żywności
- Top3: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Łaźnię publiczną (obok Studni): kandydaci a(38), b(32) → wybrany **a** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Łaźnia publiczna, jeśli spełniasz ich wymagania.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Łaźnię publiczną (obok Studni), aby podnieść zdrowie miasta o 5.

## 6. Uwagi

„Lazaret" z tech.json nie istnieje w buildings.json (0 trafień). Badanie wymaga Studni. 2 efekty — Top3–Top5 = NIE_USTALONO.
