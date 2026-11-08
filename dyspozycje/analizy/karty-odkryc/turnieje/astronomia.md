# Turniej: Astronomia

Epoka: Brąz · Poziom: 6 · Koszt nauki: 440 · tech.json — wiersz odkrycia patrz `Technologia: "Astronomia"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Obserwatorium (Biblioteka poz. 6) — dziś niedostępne | 0 | 1 | 5 | 2 | 0 | 2 | 19 | gra/data/buildings.json:797; gra/data/buildings.json:750; gra/src/game/production.ts:252-271 |

Liczba kandydatów: 1 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

Jeden kandydat — brak pojedynków.

## 3. Ranking

1. **a** — Obserwatorium (Biblioteka poz. 6) — dziś niedostępne — wygrane: 0, suma: 19

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Obserwatorium (Biblioteka poz. 6) — dziś niedostępne
- Top2: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top3: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top4: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)
- Top5: NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Bibliotekę: kandydaci a — żaden nie jest korzyścią do zdania „aby…” (warunek/martwy efekt) → pominięty.

Obecnie na karcie:

- (sekcja pusta — niewyrenderowana)

Propozycja:

- NIE_USTALONO — odkrycie nie daje dziś żadnej czynności o realnej korzyści (patrz Uwagi)

## 6. Uwagi

Jedyny efekt (poziomTechGate {"6":"Astronomia"} Biblioteki, buildings.json:797) jest nieosiągalny: maksPoziom Biblioteki = 2 (buildings.json:750). Żadna technologia nie wymaga Astronomii. Realnie: brak korzyści — Top2–Top5 = NIE_USTALONO.
