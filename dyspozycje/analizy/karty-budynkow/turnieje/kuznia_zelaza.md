# Turniej: Kuźnia żelaza (`kuznia_zelaza`)

Kategoria: Produkcja+Wojsko · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Hutnictwo żelaza · definicja: `gra/data/buildings.json:1398` · dzisiejszy top3: `:1436`

Cena korzyści (nie jest kandydatem): budowa 60 Pracy, 40 drewno + 50 cegla, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Pancerz jednostek do +30% (brąz + żelazo) | Przejmuje +15% Kuźni brązu i dokłada własne +15% — trwale dla jednostek z miasta. | 3 | 2 | 4 | 3 | 3 | 5 | 40 | gra/data/buildings.json:1398; gra/src/game/unit-building-bonuses.ts:9-21; gra/src/game/unit-building-bonuses.ts:171-176 |
| b | own | +8 Pracy i +2 pieniądza w mieście | Więcej niż Kuźnia brązu (+6 i +1). | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:1398 |
| c | next (R-B1) | Warunek badania Obróbki żelaza | Bez Kuźni żelaza w państwie nie zbadasz Obróbki żelaza. | 2 | 0 | 5 | 5 | 1 | 4 | 32 | gra/data/tech.json:439; gra/src/game/research.ts:154-180 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „maksymalnie do +45%” z Wielką Kuźnią — Wielka Kuźnia ma epokaWejscia=4 — niedostępna. [gra/data/buildings.json:1448; gra/src/game/production.ts:966]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 40:30.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 40:32.
- b vs c → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 32:30.

## 4. Ranking

1. **a** — Pancerz jednostek do +30% (brąz + żelazo) — wygrane: 2, suma: 40
2. **c** — Warunek badania Obróbki żelaza — wygrane: 1, suma: 32
3. **b** — +8 Pracy i +2 pieniądza w mieście — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Pancerz jednostek do +30% (brąz + żelazo)** — Przejmuje +15% Kuźni brązu i dokłada własne +15% — trwale dla jednostek z miasta.
- Top2: **Warunek badania Obróbki żelaza** — Bez Kuźni żelaza w państwie nie zbadasz Obróbki żelaza.
- Top3: **+8 Pracy i +2 pieniądza w mieście** — Więcej niż Kuźnia brązu (+6 i +1).

## 6. Porównanie z dzisiejszym top3

- 1. „Wysoka produkcja” → ZACHOWANE (w nowym TOP 5)
- 2. „Wzmacnia pancerz jednostek” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga dostępu do żelaza” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Warunek badania Obróbki żelaza

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Kuźnię brązu do Kuźni żelaza, aby podnieść Pancerz jednostek do +30%.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to warunek (żelazo).
