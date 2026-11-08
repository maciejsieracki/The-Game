# Turniej: Garncarnia (`garncarnia`)

Kategoria: Produkcja · Epoka wejścia: Kamień · maksPoziom: 3 · technologia: Garncarstwo · definicja: `gra/data/buildings.json:554` · dzisiejszy top3: `:590`

Cena korzyści (nie jest kandydatem): budowa 18 Pracy, 30 drewno, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Wytwarza ceramikę: do 50 sztuk na turę | Zamienia glinę i drewno w ceramikę; każdy Spichlerz zużywa jej 25 na turę. | 3 | 4 | 5 | 5 | 3 | 3 | 50 | gra/src/game/converters.ts:85; gra/data/econ-params.json:383-389; gra/data/econ-params.json:390-396 |
| b | own | +10% żywności w mieście | Premia procentowa do żywności miasta, w którym stoi. | 2 | 2 | 3 | 2 | 3 | 5 | 33 | gra/data/econ-params.json:299-305; gra/src/game/economy.ts:1008 |
| c | own | +3 Pracy w mieście (5 w Brązie, 7 w Żelazie) | Daje miastu 3 Pracy, a z każdą epoką o 2 więcej. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:554; gra/src/game/production.ts:252-271 |
| d | next (R-B1) | Otwiera Spichlerz w każdym mieście (limit 5 → 8) | Jedna Garncarnia gdziekolwiek spełnia bramkę ceramiki Spichlerza w całym państwie. | 4 | 0 | 4 | 5 | 1 | 4 | 36 | gra/data/buildings.json:458; gra/data/econ-params.json:31-37 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 50:33.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 50:30.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 50:36.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 33:30.
- b vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 36:33.
- c vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 36:30.

## 4. Ranking

1. **a** — Wytwarza ceramikę: do 50 sztuk na turę — wygrane: 3, suma: 50
2. **d** — Otwiera Spichlerz w każdym mieście (limit 5 → 8) — wygrane: 2, suma: 36
3. **b** — +10% żywności w mieście — wygrane: 1, suma: 33
4. **c** — +3 Pracy w mieście (5 w Brązie, 7 w Żelazie) — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Wytwarza ceramikę: do 50 sztuk na turę** — Zamienia glinę i drewno w ceramikę; każdy Spichlerz zużywa jej 25 na turę.
- Top2: **Otwiera Spichlerz w każdym mieście (limit 5 → 8)** — Jedna Garncarnia gdziekolwiek spełnia bramkę ceramiki Spichlerza w całym państwie.
- Top3: **+10% żywności w mieście** — Premia procentowa do żywności miasta, w którym stoi.
- Top4: **+3 Pracy w mieście (5 w Brązie, 7 w Żelazie)** — Daje miastu 3 Pracy, a z każdą epoką o 2 więcej.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy” → ZACHOWANE (w nowym TOP 5)
- 2. „Wytapia ceramikę” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga gliny i otwiera Garncarstwo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Otwiera Spichlerz w każdym mieście (limit 5 → 8)
- DODANE: +10% żywności w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Garncarnię, aby wytwarzać ceramikę dla Spichlerzy.
- Zbuduj w miastach Spichlerze, aby podnieść limit ludności miast z 5 do 8.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 („Wymaga gliny i otwiera Garncarstwo”) to warunek + wymaganie. Brak +10% żywności na karcie.
