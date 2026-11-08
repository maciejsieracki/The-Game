# Turniej: Trybunał (`trybunal`)

Kategoria: Administracja · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Kodeks · definicja: `gra/data/buildings.json:1938` · dzisiejszy top3: `:1979`

Cena korzyści (nie jest kandydatem): budowa 30 Pracy, 30 drewno + 40 kamien, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +17 pkt Prawa w mieście | Dowolne miasto, także stolica (+22 łatwy, +13 trudny). | 3 | 3 | 4 | 3 | 4 | 4 | 44 | gra/data/society-params.json:802-808; gra/src/game/society-breakdown.ts:850-853 |
| b | own | +1 pieniądza i +2 Szczęścia (rośnie z epoką) | W epoce Żelaza +2 pieniądza i +3 Szczęścia. | 1 | 1 | 2 | 2 | 4 | 5 | 27 | gra/data/buildings.json:1938; gra/src/game/economy.ts:509-535; gra/src/game/production.ts:252-271 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „Ogranicza korupcję jeszcze zanim miasto zbuduje Sąd” — Trybunału nie ma w KORUPCJA_REDUKCJA_BUDYNKI (economy.ts:1226) — nie zmniejsza korupcji; realny efekt to Prawo +17. [gra/src/game/economy.ts:1225-1250]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:27.

## 4. Ranking

1. **a** — +17 pkt Prawa w mieście — wygrane: 1, suma: 44
2. **b** — +1 pieniądza i +2 Szczęścia (rośnie z epoką) — wygrane: 0, suma: 27

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+17 pkt Prawa w mieście** — Dowolne miasto, także stolica (+22 łatwy, +13 trudny).
- Top2: **+1 pieniądza i +2 Szczęścia (rośnie z epoką)** — W epoce Żelaza +2 pieniądza i +3 Szczęścia.

## 6. Porównanie z dzisiejszym top3

- 1. „Dochód i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Wczesny porządek administracyjny” → USUNIĘTE — efekt martwy/nieprawdziwy
- 3. „Odblokowany przez Kodeks” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +17 pkt Prawa w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Trybunał, aby dodać miastu 17 pkt Prawa.

## 8. Uwagi

Pozycja 2 dzisiejszego top3 jest NIEPRAWDZIWA. Pozycja 3 to wymaganie technologii.
