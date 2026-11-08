# Turniej: Obróbka żelaza

Epoka: Żelazo · Poziom: 9 · Koszt nauki: 740 · tech.json — wiersz odkrycia patrz `Technologia: "Obróbka żelaza"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Wielka odlewnia (stal) — dziś niedostępna (epoka 4) | 0 | 2 | 5 | 2 | 0 | 2 | 22 | gra/data/buildings.json:253; gra/src/game/production.ts:966; gra/src/game/converters.ts:100-102 |
| b | Wielka Kuźnia (Pancerz) — dziś niedostępna (epoka 4) | 0 | 2 | 5 | 2 | 0 | 2 | 22 | gra/data/buildings.json:1448; gra/src/game/production.ts:966 |
| c | Jednostki Celtów i Germanów, np. Berserker Atak 10 | 3 | 1 | 3 | 1 | 1 | 3 | 25 | gra/data/units.json:2963; gra/data/units.json:3081; gra/data/units.json:3182; gra/data/units.json:3256 |
| d | Cud narodowy: Posąg Peruna (Słowianie) | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:517-521 |
| e | Z Oblężnictwem otwiera Sztukę wojenną | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:449 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — remis 22:22 we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście.
- a vs c → **c** — przewaga w kryterium SKALA (3 vs 0), suma ważona 25:22.
- a vs d → **d** — przewaga w kryterium SKALA (3 vs 0), suma ważona 37:22.
- a vs e → **e** — przewaga w kryterium SKALA (3 vs 0), suma ważona 32:22.
- b vs c → **c** — przewaga w kryterium SKALA (3 vs 0), suma ważona 25:22.
- b vs d → **d** — przewaga w kryterium SKALA (3 vs 0), suma ważona 37:22.
- b vs e → **e** — przewaga w kryterium SKALA (3 vs 0), suma ważona 32:22.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:25.
- c vs e → **e** — przewaga w kryterium ZASIĘG (4 vs 1), suma ważona 32:25.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:32.

## 3. Ranking

1. **d** — Cud narodowy: Posąg Peruna (Słowianie) — wygrane: 4, suma: 37
2. **e** — Z Oblężnictwem otwiera Sztukę wojenną — wygrane: 3, suma: 32
3. **c** — Jednostki Celtów i Germanów, np. Berserker Atak 10 — wygrane: 2, suma: 25
4. **a** — Wielka odlewnia (stal) — dziś niedostępna (epoka 4) — wygrane: 1, suma: 22
5. **b** — Wielka Kuźnia (Pancerz) — dziś niedostępna (epoka 4) — wygrane: 0, suma: 22

Reguła E1: żaden kandydat jej nie spełnia — Top1 zostaje wynikiem turnieju z zastrzeżeniem (Q7).

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: d > e > c > a > b (Obrona: d > e > c > a > b).

Status: FINALNE-WARUNKOWE (FC r1: trzeci turniej zgodny z Obroną; Top1 czeka na decyzję właściciela Q7 — żaden kandydat nie spełnia E1)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Cud narodowy: Posąg Peruna (Słowianie)
- Top2: Z Oblężnictwem otwiera Sztukę wojenną
- Top3: Jednostki Celtów i Germanów, np. Berserker Atak 10
- Top4: Wielka odlewnia (stal) — dziś niedostępna (epoka 4)
- Top5: Wielka Kuźnia (Pancerz) — dziś niedostępna (epoka 4)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Rekrutuj jednostki narodowe: kandydaci c(25) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci e(32) → wybrany **e** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: stal (prereq).
- [Najpierw spełnij] Zbuduj Wielka odlewnia lub Wielka Kuźnia, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Wybierz kolejne badanie, aby dojść do Akademii wojskowej.
- Rekrutuj jednostki narodowe, aby wystawić elitę Celtów i Germanów (np. Berserker z Atakiem 10).

## 6. Uwagi

Wielka odlewnia i Wielka Kuźnia mają epokaWejscia=4 (PARKOWANE), a production.ts:966 blokuje budynki z wyższej epoki — w obecnej grze (3 epoki) są niedostępne. Realne efekty: tylko jednostki narodowe, cud narodowy, droga do Sztuki wojennej.
