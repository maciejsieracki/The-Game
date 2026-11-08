# Turniej: Łaźnia publiczna (`laznia_publiczna`)

Kategoria: Zdrowie · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Medycyna · definicja: `gra/data/buildings.json:2034` · dzisiejszy top3: `:2075`

Cena korzyści (nie jest kandydatem): budowa 50 Pracy, 40 drewno + 60 cegla, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +5 zdrowia w mieście | Najsilniejsze źródło zdrowia z budynku (+6 łatwy, +4 trudny). | 3 | 2 | 4 | 2 | 3 | 5 | 38 | gra/data/society-params.json:31-37; gra/src/game/turn-economy.ts:476-498 |
| b | own | +3 Kultury, +4 Szczęścia i +1 żywności | Termy poprawiają nastroje i kulturę miasta. | 3 | 1 | 3 | 2 | 3 | 4 | 32 | gra/data/buildings.json:2034; gra/src/game/economy.ts:509-535 |
| c | own | Asymilacja kultury +1% na turę | Podbite miasto szybciej przyjmuje twoją kulturę. | 1 | 2 | 3 | 1 | 3 | 4 | 27 | gra/data/society-params.json:460-466; gra/src/game/culture-religion.ts:459; gra/src/game/conquest-stability.ts:63-72 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 38:32.
- a vs c → **a** — przewaga w kryterium SKALA (3 vs 1), suma ważona 38:27.
- b vs c → **b** — przewaga w kryterium SKALA (3 vs 1), suma ważona 32:27.

## 4. Ranking

1. **a** — +5 zdrowia w mieście — wygrane: 2, suma: 38
2. **b** — +3 Kultury, +4 Szczęścia i +1 żywności — wygrane: 1, suma: 32
3. **c** — Asymilacja kultury +1% na turę — wygrane: 0, suma: 27

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+5 zdrowia w mieście** — Najsilniejsze źródło zdrowia z budynku (+6 łatwy, +4 trudny).
- Top2: **+3 Kultury, +4 Szczęścia i +1 żywności** — Termy poprawiają nastroje i kulturę miasta.
- Top3: **Asymilacja kultury +1% na turę** — Podbite miasto szybciej przyjmuje twoją kulturę.

## 6. Porównanie z dzisiejszym top3

- 1. „Zadowolenie i kultura” → ZACHOWANE (w nowym TOP 5)
- 2. „Niewielki dodatek żywności” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga Studni” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +5 zdrowia w mieście
- DODANE: Asymilacja kultury +1% na turę

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Łaźnię publiczną, aby podnieść zdrowie miasta o 5.

## 8. Uwagi

Dzisiejszy top3 nie podaje liczb ani zdrowia (+5). Pozycja 3 to warunek.
