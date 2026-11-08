# Turniej: Port wielki (`port_wielki`)

Kategoria: Pieniadz · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Inżynieria · definicja: `gra/data/buildings.json:409` · dzisiejszy top3: `:445`

Cena korzyści (nie jest kandydatem): budowa 55 Pracy, 60 drewno + 50 kamien, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +10 pieniądza i +2 Pracy w mieście (Port: +5) | Podwaja dochód Portu handlowego, który zastępuje. | 3 | 1 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:409 |
| b | own | Zachowuje trasę handlową i premię morską Portu | Po rozbudowie miasto nie traci slotu trasy ani +1 pieniądza za trasę morską. | 2 | 1 | 3 | 2 | 5 | 3 | 32 | gra/src/game/trade-routes.ts:908-921; gra/src/game/trade-routes.ts:208; gra/src/game/trade-routes.ts:1755-1772 |
| c | own | +1 Szczęścia w mieście | Ryczałt Szczęścia za budynek szczęściodajny. | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/src/game/economy.ts:509-535 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (3 vs 2), suma ważona 35:32.
- a vs c → **a** — przewaga w kryterium SKALA (3 vs 1), suma ważona 35:25.
- b vs c → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (3 vs 1), suma ważona 32:25.

## 4. Ranking

1. **a** — +10 pieniądza i +2 Pracy w mieście (Port: +5) — wygrane: 2, suma: 35
2. **b** — Zachowuje trasę handlową i premię morską Portu — wygrane: 1, suma: 32
3. **c** — +1 Szczęścia w mieście — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+10 pieniądza i +2 Pracy w mieście (Port: +5)** — Podwaja dochód Portu handlowego, który zastępuje.
- Top2: **Zachowuje trasę handlową i premię morską Portu** — Po rozbudowie miasto nie traci slotu trasy ani +1 pieniądza za trasę morską.
- Top3: **+1 Szczęścia w mieście** — Ryczałt Szczęścia za budynek szczęściodajny.

## 6. Porównanie z dzisiejszym top3

- 1. „Wysoki dochód” → ZACHOWANE (w nowym TOP 5)
- 2. „Rozbudowa portu handlowego” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Inżynierię” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Zachowuje trasę handlową i premię morską Portu
- DODANE: +1 Szczęścia w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Port handlowy do Portu wielkiego, aby podwoić dochód portu (+10 pieniądza).

## 8. Uwagi

Port wielki nie daje drugiego slotu trasy — zastępuje Port w liście budynków (trade-routes.ts:900-903). Pozycje 2–3 dzisiejszego top3 to warunek i wymaganie.
