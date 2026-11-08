# Turniej: Dwór Zarządcy (`dwor_zarzadcy`)

Kategoria: Administracja · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: Kodeks · definicja: `gra/data/buildings.json:1838` · dzisiejszy top3: `:1881`

Cena korzyści (nie jest kandydatem): budowa 45 Pracy, 30 drewno + 30 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Prawo miasta regionalnego 28 → 33 pkt | Zastępuje Dom Starszyzny i daje więcej Prawa (+43 łatwy, +26 trudny). | 3 | 1 | 3 | 2 | 3 | 4 | 32 | gra/data/society-params.json:788-794; gra/src/game/society-breakdown.ts:842-845 |
| b | own | +2 pieniądza, +3 Kultury i +1 Pracy | Więcej niż Dom Starszyzny (+1/+2/+1). | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:1838 |
| c | next (R-B1) | Rozbudowa do Pretorium: −30% korupcji i 38 Prawa | Po Prawie ostatni stopień administracji regionalnej. | 4 | 0 | 3 | 2 | 1 | 4 | 28 | gra/data/buildings.json:1888; gra/src/game/economy.ts:1225-1250; gra/data/society-params.json:795-801 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (3 vs 2), suma ważona 32:28.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 32:28.
- b vs c → **c** — remis 28:28, rozstrzyga SKALA (4 vs 2).

## 4. Ranking

1. **a** — Prawo miasta regionalnego 28 → 33 pkt — wygrane: 2, suma: 32
2. **c** — Rozbudowa do Pretorium: −30% korupcji i 38 Prawa — wygrane: 1, suma: 28
3. **b** — +2 pieniądza, +3 Kultury i +1 Pracy — wygrane: 0, suma: 28

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Prawo miasta regionalnego 28 → 33 pkt** — Zastępuje Dom Starszyzny i daje więcej Prawa (+43 łatwy, +26 trudny).
- Top2: **Rozbudowa do Pretorium: −30% korupcji i 38 Prawa** — Po Prawie ostatni stopień administracji regionalnej.
- Top3: **+2 pieniądza, +3 Kultury i +1 Pracy** — Więcej niż Dom Starszyzny (+1/+2/+1).

## 6. Porównanie z dzisiejszym top3

- 1. „Wyższy porządek prawny” → ZACHOWANE (w nowym TOP 5)
- 2. „Większa produkcja” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga ulepszenia” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Rozbudowa do Pretorium: −30% korupcji i 38 Prawa

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Dom Starszyzny do Dworu Zarządcy, aby podnieść Prawo miasta do 33 pkt.
- Rozbuduj go do Pretorium (Prawo), aby obniżyć korupcję miasta o 30%.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to warunek.
