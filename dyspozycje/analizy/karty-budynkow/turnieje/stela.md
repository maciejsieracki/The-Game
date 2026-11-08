# Turniej: Stela / Pomnik (`stela`)

Kategoria: Kultura · Epoka wejścia: Kamień · maksPoziom: 3 · technologia: Murarstwo · definicja: `gra/data/buildings.json:1202` · dzisiejszy top3: `:1238`

Cena korzyści (nie jest kandydatem): budowa 15 Pracy, 30 kamien, utrzymanie 0 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +1 Kultury i +1 Szczęścia, bez utrzymania | Kultura rośnie o 1 z każdą epoką (do +3), a budynek nic nie kosztuje co turę. | 1 | 1 | 2 | 2 | 4 | 4 | 26 | gra/data/buildings.json:1202; gra/src/game/economy.ts:509-535; gra/src/game/production.ts:252-271 |
| b | own | Asymilacja kultury +0,5% na turę | Podbite miasto nieco szybciej przyjmuje twoją kulturę. | 1 | 2 | 2 | 1 | 3 | 4 | 25 | gra/data/society-params.json:446-452; gra/src/game/culture-religion.ts:457; gra/src/game/conquest-stability.ts:63-72 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 3), suma ważona 26:25.

## 4. Ranking

1. **a** — +1 Kultury i +1 Szczęścia, bez utrzymania — wygrane: 1, suma: 26
2. **b** — Asymilacja kultury +0,5% na turę — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+1 Kultury i +1 Szczęścia, bez utrzymania** — Kultura rośnie o 1 z każdą epoką (do +3), a budynek nic nie kosztuje co turę.
- Top2: **Asymilacja kultury +0,5% na turę** — Podbite miasto nieco szybciej przyjmuje twoją kulturę.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Kultury” → ZACHOWANE (w nowym TOP 5)
- 2. „Brak kosztów utrzymania” → ZACHOWANE (w nowym TOP 5)
- 3. „Otwiera Murarstwo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Asymilacja kultury +0,5% na turę

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Postaw Stelę, aby zyskać Kulturę bez kosztów utrzymania.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to wymaganie technologii.
