# Turniej: Spichlerz (`spichlerz`)

Kategoria: Zywnosc · Epoka wejścia: Kamień · maksPoziom: 1 · technologia: Garncarstwo · definicja: `gra/data/buildings.json:458` · dzisiejszy top3: `:494`

Cena korzyści (nie jest kandydatem): budowa 20 Pracy, 40 drewno, utrzymanie 1 złota/turę, zużywa 25 Ceramiki na turę (econ-params.json:390-396, building-resource-gate.ts:335).

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Limit ludności miasta 5 → 8 | Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców. | 5 | 4 | 4 | 2 | 4 | 5 | 52 | gra/data/econ-params.json:24-37; gra/src/game/economy.ts:1053 |
| b | own | +1000 pojemności spichlerza państwa | Każdy Spichlerz zwiększa centralny zapas żywności państwa o 1000 (×2 na epokę). | 3 | 3 | 4 | 5 | 4 | 4 | 48 | gra/src/game/empire-food.ts:175-192; gra/src/game/building-resource-gate.ts:548 |
| c | own | −25% kosztu racji żywnościowej w mieście | Mieszkańcy tego miasta zjadają o jedną czwartą mniej żywności ze spichlerza państwa (racje ×0,75). | 3 | 3 | 4 | 2 | 3 | 4 | 40 | gra/src/game/building-resource-gate.ts:486-491; gra/src/game/population-growth-v85.ts:206-223; gra/src/game/turn-economy.ts:1671 |
| d | own | +2 żywności i +5 Szczęścia w mieście | Najwyższy ryczałt Szczęścia wśród budynków Kamienia. | 3 | 1 | 2 | 2 | 4 | 5 | 33 | gra/data/buildings.json:458; gra/src/game/economy.ts:509-535 |
| e | next (R-B1) | Rozbudowa do Spichlerza Królewskiego: limit 12 | Po Piśmie i z dostępem do soli limit ludności rośnie do 12. | 4 | 0 | 3 | 2 | 1 | 5 | 29 | gra/data/buildings.json:505; gra/data/econ-params.json:38-44 |
| f | own | +5 zdrowia w mieście | Lepsze zdrowie przyspiesza wzrost ludności miasta. | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/src/game/building-resource-gate.ts:472-477; gra/src/game/turn-economy.ts:2023 |
| g | own | +1% wzrostu ludności na turę | Składnik „Spichlerz” w procencie wzrostu miasta. | 1 | 1 | 3 | 2 | 2 | 4 | 24 | gra/src/game/building-resource-gate.ts:479-484; gra/src/game/population-growth-v85.ts:262-277 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „pojemność zapasów armii 100 na Spichlerz” — Klucz spichlerz_pojemnosc_zapasow_panstwa nie ma konsumenta w gra/src (grep) — nie pokazywać. [gra/data/econ-params.json:171-177]
- „po wzroście miasto zachowuje 50% zapasu żywności” — Obrona r1: działa tylko w populationGrowth (economy.ts:1107), które nie ma wywołania w gra/src (grep „populationGrowth(”); żywy wzrost to applyFractionalGrowthV85 — ułamek wzrostu bez bufora, nic się nie zeruje ani nie zachowuje — nie pokazywać. [gra/src/game/economy.ts:1099; gra/src/game/economy.ts:1150-1155; gra/src/game/population-growth-v85.ts:306-342]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:48.
- a vs c → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:40.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 52:33.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 52:29.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 52:28.
- a vs g → **a** — przewaga w kryterium SKALA (5 vs 1), suma ważona 52:24.
- b vs c → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:40.
- b vs d → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:33.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 48:29.
- b vs f → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:28.
- b vs g → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:24.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 40:33.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 40:29.
- c vs f → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 40:28.
- c vs g → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 40:24.
- d vs e → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:29.
- d vs f → **d** — przewaga w kryterium SKALA (3 vs 2), suma ważona 33:28.
- d vs g → **d** — przewaga w kryterium SKALA (3 vs 1), suma ważona 33:24.
- e vs f → **e** — przewaga w kryterium SKALA (4 vs 2), suma ważona 29:28.
- e vs g → **e** — przewaga w kryterium SKALA (4 vs 1), suma ważona 29:24.
- f vs g → **f** — przewaga w kryterium SKALA (2 vs 1), suma ważona 28:24.

## 4. Ranking

1. **a** — Limit ludności miasta 5 → 8 — wygrane: 6, suma: 52
2. **b** — +1000 pojemności spichlerza państwa — wygrane: 5, suma: 48
3. **c** — −25% kosztu racji żywnościowej w mieście — wygrane: 4, suma: 40
4. **d** — +2 żywności i +5 Szczęścia w mieście — wygrane: 3, suma: 33
5. **e** — Rozbudowa do Spichlerza Królewskiego: limit 12 — wygrane: 2, suma: 29
6. **f** — +5 zdrowia w mieście — wygrane: 1, suma: 28
7. **g** — +1% wzrostu ludności na turę — wygrane: 0, suma: 24

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Limit ludności miasta 5 → 8** — Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców.
- Top2: **+1000 pojemności spichlerza państwa** — Każdy Spichlerz zwiększa centralny zapas żywności państwa o 1000 (×2 na epokę).
- Top3: **−25% kosztu racji żywnościowej w mieście** — Mieszkańcy tego miasta zjadają o jedną czwartą mniej żywności ze spichlerza państwa (racje ×0,75).
- Top4: **+2 żywności i +5 Szczęścia w mieście** — Najwyższy ryczałt Szczęścia wśród budynków Kamienia.
- Top5: **Rozbudowa do Spichlerza Królewskiego: limit 12** — Po Piśmie i z dostępem do soli limit ludności rośnie do 12.

## 6. Porównanie z dzisiejszym top3

- 1. „Żywność i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga ceramiki” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Podnosi limit populacji” → ZACHOWANE (w nowym TOP 5)
- DODANE: +1000 pojemności spichlerza państwa
- DODANE: −25% kosztu racji żywnościowej w mieście
- DODANE: Rozbudowa do Spichlerza Królewskiego: limit 12

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Spichlerz, aby podnieść limit ludności miasta z 5 do 8.
- Rozbuduj go do Spichlerza Królewskiego (Pismo, sól), aby podnieść limit ludności miasta z 8 do 12.

## 8. Uwagi

Pole przyrost martwe (maksPoziom=1). Pozycja 3 dzisiejszego top3 mówi o limicie ludności bez liczby. Obrona r1: premie −25% racji, +5 zdrowia, +1% wzrostu oraz plony działają tylko w turze, w której Ceramika jest opłacona (building-resource-gate.ts:451-470).
