# Turniej: Oblężnictwo

Epoka: Żelazo · Poziom: 7 · Koszt nauki: 560 · tech.json — wiersz odkrycia patrz `Technologia: "Oblężnictwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Katapulta: ostrzał z 6 pól, 1000 HP | 3 | 3 | 4 | 1 | 2 | 3 | 35 | gra/data/units.json:3482 |
| b | Warsztat oblężniczy: +10% parametrów jednostek | 3 | 3 | 4 | 3 | 2 | 5 | 41 | gra/data/buildings.json:1596; gra/src/game/unit-building-bonuses.ts:23-33; gra/src/game/unit-building-bonuses.ts:178 |
| c | Warsztat oblężniczy: +4 Pracy, +2 pieniądza | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:1596 |
| d | Z Obróbką żelaza otwiera Sztukę wojenną | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:449 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 4 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **b** — przewaga w kryterium ZASIĘG (3 vs 1), suma ważona 41:35.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 35:28.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 35:32.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:28.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 41:32.
- c vs d → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 32:28.

## 3. Ranking

1. **b** — Warsztat oblężniczy: +10% parametrów jednostek — wygrane: 3, suma: 41
2. **a** — Katapulta: ostrzał z 6 pól, 1000 HP — wygrane: 2, suma: 35
3. **d** — Z Obróbką żelaza otwiera Sztukę wojenną — wygrane: 1, suma: 32
4. **c** — Warsztat oblężniczy: +4 Pracy, +2 pieniądza — wygrane: 0, suma: 28

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: a > b > d > c (Obrona: b > a > d > c).

Status: FINALNE (FC r1: trzeci turniej — zmiana kolejności względem Obrony: a > b > d > c)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Katapulta: ostrzał z 6 pól, 1000 HP
- Top2: Warsztat oblężniczy: +10% parametrów jednostek
- Top3: Z Obróbką żelaza otwiera Sztukę wojenną
- Top4: Warsztat oblężniczy: +4 Pracy, +2 pieniądza
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Rekrutuj Katapulty: kandydaci a(34) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Warsztat oblężniczy (obok Koszar): kandydaci b(33) → wybrany **b** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci d(32) → wybrany **d** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Warsztat oblężniczy, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Rekrutuj Katapulty, aby burzyć mury z dystansu 6 pól.
- Zbuduj Warsztat oblężniczy (obok Koszar), aby wzmocnić jednostki z tego miasta o kolejne +10% (z Koszarami razem +30%).
- Wybierz kolejne badanie, aby dojść do Akademii wojskowej.

## 6. Uwagi

Badanie wymaga Koszar. W production.ts nie znaleziono bramki Warsztatu oblężniczego dla Katapulty (cities.ts:844-850: flaga „REZERWA") — Katapulta wymaga tylko technologii, żelaza i Koszar. 4 efekty — Top5 = NIE_USTALONO.
