# Turniej: Sąd (`sad`)

Kategoria: Administracja · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Prawo · definicja: `gra/data/buildings.json:1742` · dzisiejszy top3: `:1783`

Cena korzyści (nie jest kandydatem): budowa 55 Pracy, 30 drewno + 50 cegla, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | −30% korupcji w mieście | Zmniejsza straty z korupcji w mieście, w którym stoi. | 4 | 3 | 3 | 2 | 3 | 5 | 42 | gra/src/game/economy.ts:1225-1250 |
| b | own | +19 pkt Prawa w mieście | Dodatkowe Prawo ponad administrację (+25 łatwy, +16 trudny). | 3 | 2 | 3 | 2 | 3 | 4 | 35 | gra/data/society-params.json:809-815; gra/src/game/society-breakdown.ts:854-857 |
| c | own | +5 Kultury, +2 pieniądza i +3 Szczęścia | Stały dochód kultury i nastrojów. | 3 | 1 | 2 | 2 | 3 | 4 | 30 | gra/data/buildings.json:1742; gra/src/game/economy.ts:509-535 |
| d | own | Asymilacja kultury +2% na turę | Podbite miasto szybciej przyjmuje twoją kulturę. | 2 | 3 | 3 | 1 | 3 | 4 | 33 | gra/data/society-params.json:453-459; gra/src/game/culture-religion.ts:458; gra/src/game/conquest-stability.ts:63-72 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 42:35.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 42:30.
- a vs d → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 42:33.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 35:30.
- b vs d → **b** — przewaga w kryterium SKALA (3 vs 2), suma ważona 35:33.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 33:30.

## 4. Ranking

1. **a** — −30% korupcji w mieście — wygrane: 3, suma: 42
2. **b** — +19 pkt Prawa w mieście — wygrane: 2, suma: 35
3. **d** — Asymilacja kultury +2% na turę — wygrane: 1, suma: 33
4. **c** — +5 Kultury, +2 pieniądza i +3 Szczęścia — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **−30% korupcji w mieście** — Zmniejsza straty z korupcji w mieście, w którym stoi.
- Top2: **+19 pkt Prawa w mieście** — Dodatkowe Prawo ponad administrację (+25 łatwy, +16 trudny).
- Top3: **Asymilacja kultury +2% na turę** — Podbite miasto szybciej przyjmuje twoją kulturę.
- Top4: **+5 Kultury, +2 pieniądza i +3 Szczęścia** — Stały dochód kultury i nastrojów.

## 6. Porównanie z dzisiejszym top3

- 1. „Kultura i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Ograniczenie korupcji” → ZACHOWANE (w nowym TOP 5)
- 3. „Odblokowany przez Prawo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +19 pkt Prawa w mieście
- DODANE: Asymilacja kultury +2% na turę

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Sąd, aby obniżyć korupcję w mieście o 30%.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to wymaganie technologii.
