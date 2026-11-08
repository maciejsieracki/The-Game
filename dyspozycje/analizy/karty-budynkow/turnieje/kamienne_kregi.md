# Turniej: Kamienne kręgi (`kamienne_kregi`)

Kategoria: Religia · Epoka wejścia: Kamień · maksPoziom: 3 · technologia: Mistycyzm · definicja: `gra/data/buildings.json:649` · dzisiejszy top3: `:685`

Cena korzyści (nie jest kandydatem): budowa 18 Pracy, 40 kamien, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Religia +2% na turę w mieście | Przyspiesza szerzenie twojej religii w mieście (+3% łatwy, +1% trudny). | 2 | 4 | 3 | 2 | 3 | 4 | 38 | gra/data/society-params.json:588-594; gra/src/game/culture-religion.ts:550 |
| b | own | +1 Kultury i +2 Szczęścia (rośnie z epoką) | Po 1 Kultury i zadowolenia więcej z każdą epoką. | 2 | 2 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:649; gra/src/game/economy.ts:509-535; gra/src/game/production.ts:252-271 |
| c | next (R-B1) | Warunek Świątyni (+4% religii na turę) | Świątynię zbudujesz tylko w mieście z Kamiennymi kręgami. | 3 | 0 | 5 | 2 | 1 | 4 | 29 | gra/src/game/building-resource-gate.ts:110-121 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 38:35.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 38:29.
- b vs c → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 35:29.

## 4. Ranking

1. **a** — Religia +2% na turę w mieście — wygrane: 2, suma: 38
2. **b** — +1 Kultury i +2 Szczęścia (rośnie z epoką) — wygrane: 1, suma: 35
3. **c** — Warunek Świątyni (+4% religii na turę) — wygrane: 0, suma: 29

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Religia +2% na turę w mieście** — Przyspiesza szerzenie twojej religii w mieście (+3% łatwy, +1% trudny).
- Top2: **+1 Kultury i +2 Szczęścia (rośnie z epoką)** — Po 1 Kultury i zadowolenia więcej z każdą epoką.
- Top3: **Warunek Świątyni (+4% religii na turę)** — Świątynię zbudujesz tylko w mieście z Kamiennymi kręgami.

## 6. Porównanie z dzisiejszym top3

- 1. „Kultura i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Przyspiesza konwersję religijną” → ZACHOWANE (w nowym TOP 5)
- 3. „Otwiera Mistycyzm” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Warunek Świątyni (+4% religii na turę)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Kamienne kręgi, aby szerzyć swoją religię o 2% na turę.
- Zbuduj obok Świątynię (Religia), aby szerzyć religię o kolejne 4% na turę.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to wymaganie technologii.
