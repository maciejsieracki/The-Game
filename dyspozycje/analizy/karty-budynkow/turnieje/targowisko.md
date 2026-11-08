# Turniej: Targowisko (Rynek) (`targowisko`)

Kategoria: Pieniadz · Epoka wejścia: Kamień · maksPoziom: 3 · technologia: Wymiana · definicja: `gra/data/buildings.json:303` · dzisiejszy top3: `:350`

Cena korzyści (nie jest kandydatem): budowa 25 Pracy, 30 drewno, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +50% dochodu z tras handlowych miasta | Każda trasa handlowa tego miasta przynosi o połowę więcej (+62% łatwy, +38% trudny). | 4 | 3 | 4 | 2 | 3 | 5 | 44 | gra/data/econ-params.json:278-284; gra/src/main.ts:4194-4198 (E1-B2: efekt warunkowy) |
| b | own | Zamiana Pracy na podatek 1:1 w całym państwie | Pierwsze Targowisko pozwala przelewać nadwyżkę Pracy na podatek w panelu państwa (tylko gracz). | 1 | 3 | 4 | 5 | 4 | 3 | 41 | gra/src/game/work-tax.ts:14-22; gra/data/econ-params.json:341-347; gra/src/main.ts:25922-25927 (E1-B2: efekt warunkowy) |
| c | own | +1 trasa handlowa i premia 5% trasy | Miasto może utrzymać o jedną trasę więcej, a jedna jego trasa dostaje +5% dochodu. | 3 | 3 | 3 | 2 | 3 | 4 | 38 | gra/src/game/trade-routes.ts:908-921; gra/src/game/trade-routes.ts:925-945; gra/src/game/trade-routes.ts:1659 (E1-B2: efekt warunkowy) |
| d | own | +5 pieniądza w mieście (8 w Brązie, 11 w Żelazie) | Stały dochód, rośnie o 3 z każdą epoką. | 3 | 1 | 2 | 2 | 4 | 5 | 33 | gra/data/buildings.json:303; gra/src/game/production.ts:252-271 |
| e | own | +2 zdrowia i +1 Szczęścia w mieście | Lepsze zaopatrzenie poprawia zdrowie i nastroje mieszkańców. | 1 | 1 | 2 | 2 | 4 | 5 | 27 | gra/data/society-params.json:24-30; gra/src/game/turn-economy.ts:476-485; gra/src/game/economy.ts:509-535 |
| f | next (R-B1) | Warunek Mennicy (stolica) i Emporionu | Bez Targowiska w tym samym mieście nie zbudujesz Mennicy ani Emporionu. | 4 | 0 | 4 | 2 | 1 | 3 | 29 | gra/src/game/building-resource-gate.ts:110-121 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 44:41.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 3), suma ważona 44:38.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:33.
- a vs e → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 44:27.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 44:29.
- b vs c → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 41:38.
- b vs d → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 41:33.
- b vs e → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 41:27.
- b vs f → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 41:29.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:33.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:27.
- c vs f → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:29.
- d vs e → **d** — przewaga w kryterium SKALA (3 vs 1), suma ważona 33:27.
- d vs f → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:29.
- e vs f → **f** — przewaga w kryterium SKALA (4 vs 1), suma ważona 29:27.

## 4. Ranking

1. **a** — +50% dochodu z tras handlowych miasta — wygrane: 5, suma: 44
2. **b** — Zamiana Pracy na podatek 1:1 w całym państwie — wygrane: 4, suma: 41
3. **c** — +1 trasa handlowa i premia 5% trasy — wygrane: 3, suma: 38
4. **d** — +5 pieniądza w mieście (8 w Brązie, 11 w Żelazie) — wygrane: 2, suma: 33
5. **f** — Warunek Mennicy (stolica) i Emporionu — wygrane: 1, suma: 29
6. **e** — +2 zdrowia i +1 Szczęścia w mieście — wygrane: 0, suma: 27

Reguła E1-B: a to efekt warunkowy — 0 bez stanu gry, którego budynek nie zapewnia (E1-B2) → Top1 = **d** (najwyżej w rankingu efekt własny bez warunku).

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+5 pieniądza w mieście (8 w Brązie, 11 w Żelazie)** — Stały dochód, rośnie o 3 z każdą epoką.
- Top2: **+50% dochodu z tras handlowych miasta** — Każda trasa handlowa tego miasta przynosi o połowę więcej (+62% łatwy, +38% trudny).
- Top3: **Zamiana Pracy na podatek 1:1 w całym państwie** — Pierwsze Targowisko pozwala przelewać nadwyżkę Pracy na podatek w panelu państwa (tylko gracz).
- Top4: **+1 trasa handlowa i premia 5% trasy** — Miasto może utrzymać o jedną trasę więcej, a jedna jego trasa dostaje +5% dochodu.
- Top5: **Warunek Mennicy (stolica) i Emporionu** — Bez Targowiska w tym samym mieście nie zbudujesz Mennicy ani Emporionu.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost dochodu” → ZACHOWANE (w nowym TOP 5)
- 2. „Niski koszt wejścia” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Wymianę” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +50% dochodu z tras handlowych miasta
- DODANE: Zamiana Pracy na podatek 1:1 w całym państwie
- DODANE: +1 trasa handlowa i premia 5% trasy
- DODANE: Warunek Mennicy (stolica) i Emporionu

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Targowisko, aby dać miastu 5 pieniądza.
- Zbuduj w stolicy Mennicę (Waluta), aby pomnożyć podatek wszystkich miast ×1,5.

## 8. Uwagi

Pozycje 2–3 dzisiejszego top3 („Niski koszt wejścia”, „Otwiera Wymianę”) to masło maślane. Zamiana Pracy na podatek działa tylko dla gracza (work-tax.ts:20 isHumanOwner). Obrona r1 (zarzut Evaluatora 3): +50% z tras i slot trasy są warte 0 bez aktywnej trasy (dochód lądowej trasy 1–8 wg dystansu, econ-params.json dochody_ladowe) → reguła E1-B2; to samo dotyczy zamiany Pracy na podatek (0 bez nadwyżki Pracy i decyzji gracza, AI nie korzysta) → Top1 = +5 pieniądza. +2 zdrowia (turn-economy.ts:420,485) zostaje poza TOP 5 (29:27 z „Warunkiem Mennicy”); wchodzi automatycznie, jeśli właściciel w Q2 wybierze B.
