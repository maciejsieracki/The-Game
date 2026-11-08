# Turniej: Pretorium (`pretorium`)

Kategoria: Administracja · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Prawo · definicja: `gra/data/buildings.json:1888` · dzisiejszy top3: `:1931`

Cena korzyści (nie jest kandydatem): budowa 75 Pracy, 40 drewno + 50 cegla, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | −30% korupcji w mieście regionalnym | Jedyny — obok Sądu — budynek zmniejszający korupcję poza stolicą. | 4 | 3 | 3 | 2 | 3 | 5 | 42 | gra/src/game/economy.ts:1225-1250 |
| b | own | Prawo miasta 33 → 38 pkt | Najwięcej Prawa w łańcuchu administracji regionalnej (+50 łatwy, +31 trudny). | 2 | 1 | 3 | 2 | 3 | 4 | 29 | gra/data/society-params.json:795-801; gra/src/game/society-breakdown.ts:846-849 |
| c | own | +3 pieniądza, +5 Kultury i +2 Pracy | Największy dochód w łańcuchu. | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:1888 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:29.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:28.
- b vs c → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (3 vs 2), suma ważona 29:28.

## 4. Ranking

1. **a** — −30% korupcji w mieście regionalnym — wygrane: 2, suma: 42
2. **b** — Prawo miasta 33 → 38 pkt — wygrane: 1, suma: 29
3. **c** — +3 pieniądza, +5 Kultury i +2 Pracy — wygrane: 0, suma: 28

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **−30% korupcji w mieście regionalnym** — Jedyny — obok Sądu — budynek zmniejszający korupcję poza stolicą.
- Top2: **Prawo miasta 33 → 38 pkt** — Najwięcej Prawa w łańcuchu administracji regionalnej (+50 łatwy, +31 trudny).
- Top3: **+3 pieniądza, +5 Kultury i +2 Pracy** — Największy dochód w łańcuchu.

## 6. Porównanie z dzisiejszym top3

- 1. „Najwyższy porządek prawny” → ZACHOWANE (w nowym TOP 5)
- 2. „Największa produkcja w łańcuchu” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga ulepszenia” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: −30% korupcji w mieście regionalnym

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Dwór Zarządcy do Pretorium, aby obniżyć korupcję miasta o 30%.

## 8. Uwagi

Dzisiejszy top3 pomija −30% korupcji. Pozycja 3 to warunek.
