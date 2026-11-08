# Turniej: Spichlerz Królewski (`spichlerz_ii`)

Kategoria: Zywnosc · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Pismo · definicja: `gra/data/buildings.json:505` · dzisiejszy top3: `:542`

Cena korzyści (nie jest kandydatem): budowa 35 Pracy, 40 drewno + 50 kamien, utrzymanie 2 złota/turę, zużywa 25 Soli i 25 Ceramiki na turę (econ-params.json:397-410).

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Limit ludności miasta 8 → 12 | Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców. | 4 | 2 | 3 | 2 | 3 | 5 | 39 | gra/data/econ-params.json:38-44; gra/src/game/economy.ts:1053 |
| b | own | +1500 pojemności spichlerza państwa (zamiast 1000) | Większy wkład w centralny zapas żywności państwa. | 2 | 1 | 3 | 5 | 4 | 4 | 37 | gra/src/game/empire-food.ts:187; gra/src/game/building-resource-gate.ts:549 |
| c | own | +3 żywności i +5 Szczęścia w mieście | O 1 żywności więcej niż Spichlerz. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:505; gra/src/game/economy.ts:509-535 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:37.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:30.
- b vs c → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:30.

## 4. Ranking

1. **a** — Limit ludności miasta 8 → 12 — wygrane: 2, suma: 39
2. **b** — +1500 pojemności spichlerza państwa (zamiast 1000) — wygrane: 1, suma: 37
3. **c** — +3 żywności i +5 Szczęścia w mieście — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Limit ludności miasta 8 → 12** — Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców.
- Top2: **+1500 pojemności spichlerza państwa (zamiast 1000)** — Większy wkład w centralny zapas żywności państwa.
- Top3: **+3 żywności i +5 Szczęścia w mieście** — O 1 żywności więcej niż Spichlerz.

## 6. Porównanie z dzisiejszym top3

- 1. „Więcej żywności i zadowolenia” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga ceramiki i soli” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Wyższy limit populacji i armii” → ZACHOWANE (w nowym TOP 5)
- DODANE: +1500 pojemności spichlerza państwa (zamiast 1000)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Spichlerz do Spichlerza Królewskiego, aby podnieść limit ludności miasta z 8 do 12.

## 8. Uwagi

Dzisiejsza pozycja 3 mówi „limit populacji i armii” bez liczb; limit armii nie ma pokrycia w kodzie (uwagi „cap armii 150” → realnie +1500 pojemności spichlerza państwa).
