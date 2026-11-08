# Turniej: Warsztat kamieniarski (`kamieniarski`)

Kategoria: Produkcja · Epoka wejścia: Kamień · maksPoziom: 3 · technologia: Murarstwo · definicja: `gra/data/buildings.json:61` · dzisiejszy top3: `:97`

Cena korzyści (nie jest kandydatem): budowa 20 Pracy, 30 drewno, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +10% kamienia w całym państwie | Każdy Warsztat kamieniarski zwiększa wydobycie kamienia całego państwa o 10% (warsztaty sumują się). | 3 | 3 | 4 | 5 | 3 | 4 | 46 | gra/data/econ-params.json:292-298; gra/src/game/turn-economy.ts:1539 |
| b | own | +4 Pracy w mieście (6 w Brązie, 8 w Żelazie) | Daje miastu 4 Pracy, a z każdą kolejną epoką o 2 więcej. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:61; gra/src/game/production.ts:252-271 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:30.

## 4. Ranking

1. **a** — +10% kamienia w całym państwie — wygrane: 1, suma: 46
2. **b** — +4 Pracy w mieście (6 w Brązie, 8 w Żelazie) — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+10% kamienia w całym państwie** — Każdy Warsztat kamieniarski zwiększa wydobycie kamienia całego państwa o 10% (warsztaty sumują się).
- Top2: **+4 Pracy w mieście (6 w Brązie, 8 w Żelazie)** — Daje miastu 4 Pracy, a z każdą kolejną epoką o 2 więcej.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga dostępu do kamienia” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Murarstwo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +10% kamienia w całym państwie

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Warsztat kamieniarski, aby zwiększyć wydobycie kamienia całego państwa o 10%.

## 8. Uwagi

Dzisiejszy top3 pomija główny efekt (+10% kamienia w państwie).
