# Turniej: Matematyka

Epoka: Brąz · Poziom: 5 · Koszt nauki: 272 · tech.json — wiersz odkrycia patrz `Technologia: "Matematyka"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Otwiera Budownictwo, Walutę, Astronomię, Oblężnictwo | 4 | 0 | 5 | 5 | 1 | 3 | 37 | gra/data/tech.json:294; gra/data/tech.json:308; gra/data/tech.json:322; gra/data/tech.json:365 (reguła R-K1: N=0, O≤1) |
| b | Cuda narodowe: Ziggurat (+15% Nauki), Mundo Perdido | 4 | 3 | 4 | 3 | 2 | 3 | 42 | gra/data/wonders.json:326-330; gra/data/wonders.json:347-351 |

Liczba kandydatów: 2 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 42:37.

## 3. Ranking

1. **b** — Cuda narodowe: Ziggurat (+15% Nauki), Mundo Perdido — wygrane: 1, suma: 42
2. **a** — Otwiera Budownictwo, Walutę, Astronomię, Oblężnictwo — wygrane: 0, suma: 37

Reguła E1: żaden kandydat jej nie spełnia — Top1 zostaje wynikiem turnieju z zastrzeżeniem (Q7).

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: b > a (Obrona: b > a).

Status: FINALNE-WARUNKOWE (FC r1: trzeci turniej zgodny z Obroną; Top1 czeka na decyzję właściciela Q7 — żaden kandydat nie spełnia E1)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Cuda narodowe: Ziggurat (+15% Nauki), Mundo Perdido
- Top2: Otwiera Budownictwo, Walutę, Astronomię, Oblężnictwo
- Top3: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Wybierz kolejne badanie: kandydaci a(37) → wybrany **a** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Wybierz kolejne badanie, aby dojść do Murów, Mennicy i Katapult.

## 6. Uwagi

Brak budynków, jednostek i ulepszeń dla wszystkich; tylko drogi badań + 2 cuda narodowe. Top3–Top5 = NIE_USTALONO.
