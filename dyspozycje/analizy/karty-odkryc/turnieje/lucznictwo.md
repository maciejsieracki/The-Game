# Turniej: Łucznictwo

Epoka: Kamień · Poziom: 3 · Koszt nauki: 56 · tech.json — wiersz odkrycia patrz `Technologia: "Łucznictwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Łucznik: zasięg 3 pola, Obrona 6 (Oszczepnik: 2 i 4) | 3 | 2 | 3 | 2 | 5 | 4 | 39 | gra/data/units.json:225; gra/data/units.json:151 |
| b | Łucznicy narodowi Egiptu i Sumeru: 40 HP zamiast 20 | 3 | 1 | 3 | 1 | 4 | 3 | 31 | gra/data/units.json:1853; gra/data/units.json:2223 |
| c | Łucznicy Brązu (nubijski, akadyjski, asyryjski) — z Koszarami | 2 | 1 | 3 | 1 | 1 | 3 | 22 | gra/data/units.json:2149; gra/data/units.json:2889; gra/data/units.json:3968; gra/src/game/production.ts:1075 |

Liczba kandydatów: 3 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 39:31.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 39:22.
- b vs c → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 31:22.

## 3. Ranking

1. **a** — Łucznik: zasięg 3 pola, Obrona 6 (Oszczepnik: 2 i 4) — wygrane: 2, suma: 39
2. **b** — Łucznicy narodowi Egiptu i Sumeru: 40 HP zamiast 20 — wygrane: 1, suma: 31
3. **c** — Łucznicy Brązu (nubijski, akadyjski, asyryjski) — z Koszarami — wygrane: 0, suma: 22

Status: FINALNE (FC r1: zatwierdzone bez trzeciego turnieju — zgodność Operator/Evaluator ≥ 3/5, sporne pozycje rozstrzygnięte w Obronie)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Łucznik: zasięg 3 pola, Obrona 6 (Oszczepnik: 2 i 4)
- Top2: Łucznicy narodowi Egiptu i Sumeru: 40 HP zamiast 20
- Top3: Łucznicy Brązu (nubijski, akadyjski, asyryjski) — z Koszarami
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Rekrutuj Łuczników: kandydaci a(39), b(31) → wybrany **a** (najwyższa suma ważona).

Obecnie na karcie:

- (sekcja pusta — niewyrenderowana)

Propozycja:

- Rekrutuj Łuczników, aby razić wroga z 3 pól (lepiej niż Oszczepnik).

## 6. Uwagi

Brak kolejnych technologii wymagających Łucznictwa (tech.json). 3 efekty — Top4–Top5 = NIE_USTALONO. Łucznik ma epokę Kamień → bez Koszar (production.ts:1075).
