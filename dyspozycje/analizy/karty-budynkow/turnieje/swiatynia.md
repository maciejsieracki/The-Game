# Turniej: Świątynia (`swiatynia`)

Kategoria: Religia · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Religia · definicja: `gra/data/buildings.json:696` · dzisiejszy top3: `:732`

Cena korzyści (nie jest kandydatem): budowa 25 Pracy, 30 drewno + 40 kamien, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Religia +4% na turę w mieście | Dwa razy szybsze szerzenie religii niż Kamienne kręgi (+6% łatwy, +2% trudny). | 3 | 3 | 4 | 2 | 3 | 4 | 40 | gra/data/society-params.json:581-587; gra/src/game/culture-religion.ts:549 |
| b | own | +2 Kultury i +3 Szczęścia (rośnie z epoką) | W epoce Żelaza +3 Kultury i +4 Szczęścia. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:696; gra/src/game/economy.ts:509-535; gra/src/game/production.ts:252-271 |
| c | own | Religia sięga 2 sąsiednich miast na turę (zamiast 1) | Dominująca religia miasta co turę zyskuje wyznawcę w kolejnym mieście w zasięgu 3 heksów (+2 łatwy, 0 trudny). | 2 | 3 | 4 | 3 | 2 | 4 | 37 | gra/data/society-params.json:504-510; gra/src/game/culture-religion.ts:1064; gra/src/main.ts:37700-37712 (pewność ŚREDNIA) |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 40:30.
- a vs c → **a** — przewaga w kryterium SKALA (3 vs 2), suma ważona 40:37.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:30.

## 4. Ranking

1. **a** — Religia +4% na turę w mieście — wygrane: 2, suma: 40
2. **c** — Religia sięga 2 sąsiednich miast na turę (zamiast 1) — wygrane: 1, suma: 37
3. **b** — +2 Kultury i +3 Szczęścia (rośnie z epoką) — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Religia +4% na turę w mieście** — Dwa razy szybsze szerzenie religii niż Kamienne kręgi (+6% łatwy, +2% trudny).
- Top2: **Religia sięga 2 sąsiednich miast na turę (zamiast 1)** — Dominująca religia miasta co turę zyskuje wyznawcę w kolejnym mieście w zasięgu 3 heksów (+2 łatwy, 0 trudny).
- Top3: **+2 Kultury i +3 Szczęścia (rośnie z epoką)** — W epoce Żelaza +3 Kultury i +4 Szczęścia.

## 6. Porównanie z dzisiejszym top3

- 1. „Kultura i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Przyspiesza konwersję religijną” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga Kamiennych kręgów” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Religia sięga 2 sąsiednich miast na turę (zamiast 1)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Świątynię, aby szerzyć swoją religię o 4% na turę.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to warunek (Kamienne kręgi). Obrona r1 (zarzut Evaluatora 2): dodano premię szerzenia na sąsiednie miasta — działa tylko, gdy religia jest w mieście dominująca (culture-religion.ts:1050-1053); na poziomie trudnym premia = 0 (society-params.json:507).
