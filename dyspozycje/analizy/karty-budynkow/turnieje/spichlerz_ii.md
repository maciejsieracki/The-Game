# Turniej: Spichlerz Królewski (`spichlerz_ii`)

Kategoria: Zywnosc · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Pismo · definicja: `gra/data/buildings.json:505` · dzisiejszy top3: `:542`

Cena korzyści (nie jest kandydatem): budowa 35 Pracy, 40 drewno + 50 kamien, utrzymanie 2 złota/turę, zużywa 25 Soli i 25 Ceramiki na turę (econ-params.json:397-410).

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Limit ludności miasta 8 → 12 | Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców. | 4 | 2 | 3 | 2 | 3 | 5 | 39 | gra/data/econ-params.json:38-44; gra/src/game/economy.ts:1053 |
| b | own | +1500 pojemności spichlerza państwa (zamiast 1000) | Większy wkład w centralny zapas żywności państwa. | 2 | 1 | 3 | 5 | 4 | 4 | 37 | gra/src/game/empire-food.ts:187; gra/src/game/building-resource-gate.ts:549 |
| c | own | +3 żywności i +5 Szczęścia w mieście | O 1 żywności więcej niż Spichlerz. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:505; gra/src/game/economy.ts:509-535 |
| d | own | −50% kosztu racji żywnościowej (Spichlerz: −25%) | Mieszkańcy tego miasta zjadają o połowę mniej żywności ze spichlerza państwa (racje ×0,5). | 3 | 2 | 4 | 2 | 3 | 4 | 37 | gra/src/game/building-resource-gate.ts:486-491; gra/src/game/population-growth-v85.ts:206-223; gra/src/game/turn-economy.ts:1671 |
| e | own | +10 zdrowia w mieście (Spichlerz: +5) | Lepsze zdrowie przyspiesza wzrost ludności miasta. | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/src/game/building-resource-gate.ts:472-477; gra/src/game/turn-economy.ts:2023 |
| f | own | +2% wzrostu ludności na turę (Spichlerz: +1%) | Składnik „Spichlerz” w procencie wzrostu miasta. | 1 | 1 | 3 | 2 | 2 | 4 | 24 | gra/src/game/building-resource-gate.ts:479-484; gra/src/game/population-growth-v85.ts:262-277 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „po wzroście miasto zachowuje 70% zapasu żywności” — Obrona r1 (zarzut Evaluatora 1): stała 0,7 żyje tylko w populationGrowth (economy.ts:1107), które nie ma wywołania w gra/src (grep „populationGrowth(”); żywy wzrost to applyFractionalGrowthV85 bez bufora — nie pokazywać. [gra/src/game/economy.ts:1150-1155; gra/src/game/population-growth-v85.ts:306-342]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:37.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:30.
- a vs d → **a** — przewaga w kryterium SKALA (4 vs 3), suma ważona 39:37.
- a vs e → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:28.
- a vs f → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 39:24.
- b vs c → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:30.
- b vs d → **d** — remis 37:37, rozstrzyga SKALA (3 vs 2).
- b vs e → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:28.
- b vs f → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 37:24.
- c vs d → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 37:30.
- c vs e → **c** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 3), suma ważona 30:28.
- c vs f → **c** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 30:24.
- d vs e → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 37:28.
- d vs f → **d** — przewaga w kryterium SKALA (3 vs 1), suma ważona 37:24.
- e vs f → **e** — przewaga w kryterium SKALA (2 vs 1), suma ważona 28:24.

## 4. Ranking

1. **a** — Limit ludności miasta 8 → 12 — wygrane: 5, suma: 39
2. **d** — −50% kosztu racji żywnościowej (Spichlerz: −25%) — wygrane: 4, suma: 37
3. **b** — +1500 pojemności spichlerza państwa (zamiast 1000) — wygrane: 3, suma: 37
4. **c** — +3 żywności i +5 Szczęścia w mieście — wygrane: 2, suma: 30
5. **e** — +10 zdrowia w mieście (Spichlerz: +5) — wygrane: 1, suma: 28
6. **f** — +2% wzrostu ludności na turę (Spichlerz: +1%) — wygrane: 0, suma: 24

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Limit ludności miasta 8 → 12** — Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców.
- Top2: **−50% kosztu racji żywnościowej (Spichlerz: −25%)** — Mieszkańcy tego miasta zjadają o połowę mniej żywności ze spichlerza państwa (racje ×0,5).
- Top3: **+1500 pojemności spichlerza państwa (zamiast 1000)** — Większy wkład w centralny zapas żywności państwa.
- Top4: **+3 żywności i +5 Szczęścia w mieście** — O 1 żywności więcej niż Spichlerz.
- Top5: **+10 zdrowia w mieście (Spichlerz: +5)** — Lepsze zdrowie przyspiesza wzrost ludności miasta.

## 6. Porównanie z dzisiejszym top3

- 1. „Więcej żywności i zadowolenia” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga ceramiki i soli” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Wyższy limit populacji i armii” → ZACHOWANE (w nowym TOP 5)
- DODANE: −50% kosztu racji żywnościowej (Spichlerz: −25%)
- DODANE: +1500 pojemności spichlerza państwa (zamiast 1000)
- DODANE: +10 zdrowia w mieście (Spichlerz: +5)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Spichlerz do Spichlerza Królewskiego, aby podnieść limit ludności miasta z 8 do 12.

## 8. Uwagi

Dzisiejsza pozycja 3 mówi „limit populacji i armii” bez liczb; limit armii nie ma pokrycia w kodzie (uwagi „cap armii 150” → realnie +1500 pojemności spichlerza państwa). Obrona r1: premie −50% racji, +10 zdrowia, +2% wzrostu działają tylko przy opłaconej Ceramice i Soli; bez Soli budynek daje premie Spichlerza (building-resource-gate.ts:465-469).
