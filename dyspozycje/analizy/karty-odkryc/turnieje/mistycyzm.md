# Turniej: Mistycyzm

Epoka: Kamień · Poziom: 2 · Koszt nauki: 40 · tech.json — wiersz odkrycia patrz `Technologia: "Mistycyzm"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Kamienne kręgi: +1 Kultury i +1 zadowolenia (na poziom) | 2 | 2 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:649 |
| b | Kamienne kręgi: szerzą religię +2% na turę | 2 | 4 | 3 | 2 | 3 | 4 | 38 | gra/data/society-params.json:588 |
| c | Cud Wyrocznia: +3 Kultury, +3 Zaufania, +2 Wpływu | 3 | 4 | 5 | 4 | 2 | 3 | 46 | gra/data/wonders.json:147-155 |
| d | Otwiera Religię (Świątynia) | 2 | 2 | 4 | 3 | 2 | 4 | 34 | gra/data/tech.json:210 |

Liczba kandydatów: 4 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 38:35.
- a vs c → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 46:35.
- a vs d → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 35:34.
- b vs c → **c** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 46:38.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 38:34.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 46:34.

## 3. Ranking

1. **c** — Cud Wyrocznia: +3 Kultury, +3 Zaufania, +2 Wpływu — wygrane: 3, suma: 46
2. **b** — Kamienne kręgi: szerzą religię +2% na turę — wygrane: 2, suma: 38
3. **a** — Kamienne kręgi: +1 Kultury i +1 zadowolenia (na poziom) — wygrane: 1, suma: 35
4. **d** — Otwiera Religię (Świątynia) — wygrane: 0, suma: 34

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Cud Wyrocznia: +3 Kultury, +3 Zaufania, +2 Wpływu
- Top2: Kamienne kręgi: szerzą religię +2% na turę
- Top3: Kamienne kręgi: +1 Kultury i +1 zadowolenia (na poziom)
- Top4: Otwiera Religię (Świątynia)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Kamienne kręgi: kandydaci a(35), b(38) → wybrany **b** (najwyższa suma ważona).
- Wznieś cud Wyrocznia: kandydaci c(46) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci d(34) → wybrany **d** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Kamienne kręgi, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Wznieś cud Wyrocznia, aby zdobyć +3 Zaufania i +2 Wpływu u innych państw.
- Zbuduj Kamienne kręgi, aby szerzyć swoją religię o 2% na turę.
- Wybierz kolejne badanie, aby dojść do Świątyni.

## 6. Uwagi

4 efekty — Top5 = NIE_USTALONO. Cud Wyrocznia (dla wszystkich 15 cywilizacji, maxNaSwiecie=1 — wyścig) nie jest pokazany na karcie.
