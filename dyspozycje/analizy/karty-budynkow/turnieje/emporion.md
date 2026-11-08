# Turniej: Emporion (`emporion`)

Kategoria: Pieniadz · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Handel · definicja: `gra/data/buildings.json:1095` · dzisiejszy top3: `:1133`

Cena korzyści (nie jest kandydatem): budowa 50 Pracy, 80 drewno + 60 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +1 trasa handlowa i premia 5% trasy | Miasto utrzymuje o jedną trasę więcej, a kolejna trasa dostaje +5% dochodu. | 3 | 3 | 3 | 2 | 3 | 4 | 38 | gra/src/game/trade-routes.ts:908-921; gra/src/game/trade-routes.ts:1659 (E1-B2: efekt warunkowy) |
| b | own | +8 pieniądza w mieście | Większy dochód niż Targowisko (+5). | 3 | 1 | 3 | 2 | 4 | 5 | 35 | gra/data/buildings.json:1095 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:35.

## 4. Ranking

1. **a** — +1 trasa handlowa i premia 5% trasy — wygrane: 1, suma: 38
2. **b** — +8 pieniądza w mieście — wygrane: 0, suma: 35

Reguła E1-B: a to efekt warunkowy — 0 bez stanu gry, którego budynek nie zapewnia (E1-B2) → Top1 = **b** (najwyżej w rankingu efekt własny bez warunku).

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+8 pieniądza w mieście** — Większy dochód niż Targowisko (+5).
- Top2: **+1 trasa handlowa i premia 5% trasy** — Miasto utrzymuje o jedną trasę więcej, a kolejna trasa dostaje +5% dochodu.

## 6. Porównanie z dzisiejszym top3

- 1. „Dalekosiężna wymiana” → ZACHOWANE (w nowym TOP 5)
- 2. „+5% handlu” → ZACHOWANE (w nowym TOP 5)
- 3. „Dodatkowa linia handlowa” → ZACHOWANE (w nowym TOP 5)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Emporion, aby dać miastu 8 pieniądza.

## 8. Uwagi

Pole przyrost (4) martwe przy maksPoziom=1. Pozycje 2 i 3 dzisiejszego top3 opisują ten sam efekt (slot + 5%).
