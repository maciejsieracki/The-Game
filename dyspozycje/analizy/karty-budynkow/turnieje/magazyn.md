# Turniej: Magazyn (`magazyn`)

Kategoria: Produkcja+Pieniadz · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Handel · definicja: `gra/data/buildings.json:1154` · dzisiejszy top3: `:1190`

Cena korzyści (nie jest kandydatem): budowa 20 Pracy, 50 drewno + 30 kamien, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +20% pojemności magazynu państwa | Każdy Magazyn zwiększa limit każdego surowca w całym państwie o 20% bazy (np. 50 000 → 60 000 w Kamieniu). | 3 | 3 | 5 | 5 | 3 | 5 | 49 | gra/data/econ-params.json:613-619; gra/src/game/economy-upkeep.ts:398; gra/src/game/economy-upkeep.ts:431 |
| b | own | +1 Pracy i +1 pieniądza (po 2 w Żelazie) | Drobny dochód miasta, rośnie z epoką. | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/data/buildings.json:1154; gra/src/game/production.ts:252-271 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 1), suma ważona 49:25.

## 4. Ranking

1. **a** — +20% pojemności magazynu państwa — wygrane: 1, suma: 49
2. **b** — +1 Pracy i +1 pieniądza (po 2 w Żelazie) — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+20% pojemności magazynu państwa** — Każdy Magazyn zwiększa limit każdego surowca w całym państwie o 20% bazy (np. 50 000 → 60 000 w Kamieniu).
- Top2: **+1 Pracy i +1 pieniądza (po 2 w Żelazie)** — Drobny dochód miasta, rośnie z epoką.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy i dochodu” → ZACHOWANE (w nowym TOP 5)
- 2. „Niski koszt utrzymania” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Handel” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +20% pojemności magazynu państwa

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Magazyn, aby zwiększyć pojemność magazynu państwa o 20%.

## 8. Uwagi

Dzisiejszy top3 pomija główny efekt (+20% pojemności). „Niski koszt utrzymania” i „Otwiera Handel” to masło maślane.
