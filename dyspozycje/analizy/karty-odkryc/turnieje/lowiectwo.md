# Turniej: Łowiectwo

Epoka: Kamień · Poziom: 1 · Koszt nauki: 5 · tech.json — wiersz odkrycia patrz `Technologia: "Łowiectwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Obóz łowiecki: +1 żywności, +1 Pracy, +1 pieniądza, +2 handlu | 2 | 3 | 4 | 3 | 3 | 4 | 39 | gra/data/terrain-improvements.json:154; gra/data/terrain-improvements.json:155-160; gra/src/game/turn-economy.ts:223 |
| b | Otwiera Łucznictwo (Łucznik) | 3 | 0 | 4 | 2 | 1 | 4 | 27 | gra/data/tech.json:82 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 2 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 39:27.

## 3. Ranking

1. **a** — Obóz łowiecki: +1 żywności, +1 Pracy, +1 pieniądza, +2 handlu — wygrane: 1, suma: 39
2. **b** — Otwiera Łucznictwo (Łucznik) — wygrane: 0, suma: 27

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: a > b (Obrona: a > b).

Status: FINALNE (FC r1: trzeci turniej — zgodny z Obroną)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Obóz łowiecki: +1 żywności, +1 Pracy, +1 pieniądza, +2 handlu
- Top2: Otwiera Łucznictwo (Łucznik)
- Top3: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Postaw Obóz łowiecki w lesie z Tartakiem: kandydaci a(37) → wybrany **a** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci b(27) → wybrany **b** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Przygotuj Obóz łowiecki na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Postaw Obóz łowiecki w lesie z Tartakiem, aby zagospodarować las (+1 żywności, +1 Pracy, +1 pieniądza, +2 handlu).
- Wybierz kolejne badanie, aby dojść do Łuczników.

## 6. Uwagi

Tylko 2 realne efekty (Obóz łowiecki, droga do Łucznictwa); Top3–Top5 = NIE_USTALONO.
