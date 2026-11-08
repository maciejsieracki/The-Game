# Turniej: Port handlowy (`port`)

Kategoria: Pieniadz · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Żegluga · definicja: `gra/data/buildings.json:361` · dzisiejszy top3: `:397`

Cena korzyści (nie jest kandydatem): budowa 30 Pracy, 60 drewno + 30 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +1 trasa handlowa i premia 5% trasy | Miasto portowe utrzymuje o jedną trasę więcej, a jedna trasa dostaje +5% dochodu. | 3 | 3 | 3 | 2 | 3 | 4 | 38 | gra/src/game/trade-routes.ts:908-921; gra/src/game/trade-routes.ts:1659 |
| b | own | +5 pieniądza i +1 Pracy w mieście | Stały dochód miasta nad wodą. | 3 | 1 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:361 |
| c | own | +1 pieniądza za każdą trasę morską ponad pierwszą | Premia morska należy się tylko miastu z Portem. | 1 | 3 | 5 | 2 | 3 | 4 | 36 | gra/src/game/trade-routes.ts:1755-1772 |
| d | own | +1 Szczęścia w mieście | Ryczałt Szczęścia za budynek szczęściodajny. | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/src/game/economy.ts:509-535 |
| e | next (R-B1) | Rozbudowa do Portu wielkiego: +10 pieniądza | Po Inżynierii rozbudowa podwaja dochód portu. | 3 | 0 | 3 | 2 | 1 | 5 | 26 | gra/data/buildings.json:409 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:35.
- a vs c → **a** — przewaga w kryterium SKALA (3 vs 1), suma ważona 38:36.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:25.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:26.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 36:35.
- b vs d → **b** — przewaga w kryterium SKALA (3 vs 1), suma ważona 35:25.
- b vs e → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 35:26.
- c vs d → **c** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 1), suma ważona 36:25.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 36:26.
- d vs e → **e** — przewaga w kryterium SKALA (3 vs 1), suma ważona 26:25.

## 4. Ranking

1. **a** — +1 trasa handlowa i premia 5% trasy — wygrane: 4, suma: 38
2. **c** — +1 pieniądza za każdą trasę morską ponad pierwszą — wygrane: 3, suma: 36
3. **b** — +5 pieniądza i +1 Pracy w mieście — wygrane: 2, suma: 35
4. **e** — Rozbudowa do Portu wielkiego: +10 pieniądza — wygrane: 1, suma: 26
5. **d** — +1 Szczęścia w mieście — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+1 trasa handlowa i premia 5% trasy** — Miasto portowe utrzymuje o jedną trasę więcej, a jedna trasa dostaje +5% dochodu.
- Top2: **+1 pieniądza za każdą trasę morską ponad pierwszą** — Premia morska należy się tylko miastu z Portem.
- Top3: **+5 pieniądza i +1 Pracy w mieście** — Stały dochód miasta nad wodą.
- Top4: **Rozbudowa do Portu wielkiego: +10 pieniądza** — Po Inżynierii rozbudowa podwaja dochód portu.
- Top5: **+1 Szczęścia w mieście** — Ryczałt Szczęścia za budynek szczęściodajny.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost dochodu” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga dostępu do wody” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Żeglugę i dalszy rozwój” → ZACHOWANE (w nowym TOP 5)
- DODANE: +1 trasa handlowa i premia 5% trasy
- DODANE: +1 pieniądza za każdą trasę morską ponad pierwszą
- DODANE: +1 Szczęścia w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Port handlowy w mieście nad wodą, aby otworzyć miastu kolejną trasę handlową.
- Rozbuduj go do Portu wielkiego (Inżynieria), aby podwoić dochód portu (+10 pieniądza).

## 8. Uwagi

Pole przyrost martwe (maksPoziom=1). Pozycja 2 dzisiejszego top3 to warunek (woda).
