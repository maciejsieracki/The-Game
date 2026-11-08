# Turniej: Kuźnia brązu (`kuznia`)

Kategoria: Produkcja+Wojsko · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Brązownictwo · definicja: `gra/data/buildings.json:108` · dzisiejszy top3: `:144`

Cena korzyści (nie jest kandydatem): budowa 30 Pracy, 30 drewno + 30 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +15% Pancerza jednostek (na stałe) | Jednostka zrekrutowana w tym mieście albo wchodząca do niego dostaje trwale +15% Pancerza. | 4 | 4 | 4 | 3 | 3 | 5 | 49 | gra/data/buildings.json:108; gra/src/game/unit-building-bonuses.ts:9-21; gra/src/game/unit-building-bonuses.ts:171-176 |
| b | own | +6 Pracy i +1 pieniądza w mieście | Stały dochód miasta niezależny od epoki. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:108 |
| c | next (R-B1) | Rozbudowa do Kuźni żelaza: Pancerz do +30% | Po Hutnictwie żelaza rozbudowa do Kuźni żelaza podnosi premię do +30% Pancerza. | 3 | 0 | 4 | 3 | 1 | 5 | 30 | gra/data/buildings.json:1398; gra/src/game/unit-building-bonuses.ts:9-21 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „maksymalnie do +45%” z Wielką Kuźnią — Wielka Kuźnia ma epokaWejscia=4 — w grze z 3 epokami niedostępna; realny sufit to +30%. [gra/data/buildings.json:1448; gra/src/game/production.ts:966]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 49:30.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 49:30.
- b vs c → **c** — remis 30:30, rozstrzyga SKALA (3 vs 2).

## 4. Ranking

1. **a** — +15% Pancerza jednostek (na stałe) — wygrane: 2, suma: 49
2. **c** — Rozbudowa do Kuźni żelaza: Pancerz do +30% — wygrane: 1, suma: 30
3. **b** — +6 Pracy i +1 pieniądza w mieście — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+15% Pancerza jednostek (na stałe)** — Jednostka zrekrutowana w tym mieście albo wchodząca do niego dostaje trwale +15% Pancerza.
- Top2: **Rozbudowa do Kuźni żelaza: Pancerz do +30%** — Po Hutnictwie żelaza rozbudowa do Kuźni żelaza podnosi premię do +30% Pancerza.
- Top3: **+6 Pracy i +1 pieniądza w mieście** — Stały dochód miasta niezależny od epoki.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy i dochodu” → ZACHOWANE (w nowym TOP 5)
- 2. „Bonus do Pancerza” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga rudy miedzi” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Rozbudowa do Kuźni żelaza: Pancerz do +30%

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Kuźnię brązu, aby dać jednostkom trwale +15% Pancerza.
- Rozbuduj ją do Kuźni żelaza (Hutnictwo żelaza), aby podnieść Pancerz jednostek do +30%.

## 8. Uwagi

Pole przyrost (praca 3) martwe przy maksPoziom=1 (uwagi buildings.json:108). Pozycja 3 dzisiejszego top3 to warunek (ruda).
