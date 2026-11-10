# Turniej: Filozofia

Epoka: Żelazo · Poziom: 7 · Koszt nauki: 600 · tech.json — wiersz odkrycia patrz `Technologia: "Filozofia"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Akademia: +20% Nauki (z Biblioteką razem +50%) | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/econ-params.json:327; gra/src/game/economy.ts:979-981; gra/data/buildings.json:1645 |
| b | Akademia: +6 Nauki, +5 Kultury, +3 zadowolenia | 3 | 1 | 3 | 2 | 3 | 5 | 33 | gra/data/buildings.json:1645 |
| c | Otwiera Prawo i Medycynę | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:393; gra/data/tech.json:421 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 3 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 41:32.
- b vs c → **b** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 33:32.

## 3. Ranking

1. **a** — Akademia: +20% Nauki (z Biblioteką razem +50%) — wygrane: 2, suma: 41
2. **b** — Akademia: +6 Nauki, +5 Kultury, +3 zadowolenia — wygrane: 1, suma: 33
3. **c** — Otwiera Prawo i Medycynę — wygrane: 0, suma: 32

Status: FINALNE (FC r1: zatwierdzone bez trzeciego turnieju — zgodność Operator/Evaluator ≥ 3/5, sporne pozycje rozstrzygnięte w Obronie)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Akademia: +20% Nauki (z Biblioteką razem +50%)
- Top2: Akademia: +6 Nauki, +5 Kultury, +3 zadowolenia
- Top3: Otwiera Prawo i Medycynę
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Akademię (obok Biblioteki): kandydaci a(41), b(33) → wybrany **a** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci c(32) → wybrany **c** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Akademia lub Teatr, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Akademię (obok Biblioteki), aby zwiększyć Naukę miasta o kolejne 20%.
- Wybierz kolejne badanie, aby dojść do Sądu i Łaźni.

## 6. Uwagi

Teatr jest na karcie, ale ma suppressed=true (buildings.json:1728) — nie da się go zbudować. Badanie wymaga Biblioteki. 3 efekty — Top4–Top5 = NIE_USTALONO.
