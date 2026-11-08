# Turniej: Koszary (`koszary`)

Kategoria: Wojsko · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Wojskowość · definicja: `gra/data/buildings.json:1047` · dzisiejszy top3: `:1083`

Cena korzyści (nie jest kandydatem): budowa 25 Pracy, 40 drewno + 40 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Rekrutacja wojska epoki Brązu i Żelaza | Bez Koszar w mieście nie zrekrutujesz tam żadnej jednostki epoki Brązu ani Żelaza. | 5 | 5 | 5 | 3 | 4 | 5 | 59 | gra/src/game/production.ts:1068-1076 |
| b | own | +20% parametrów bojowych jednostek (na stałe) | Jednostka zrekrutowana lub odwiedzająca miasto dostaje trwale +20% ataku, obrony i zdrowia (bez Pancerza). | 4 | 4 | 4 | 3 | 3 | 5 | 49 | gra/data/buildings.json:1047; gra/src/game/unit-building-bonuses.ts:23-33; gra/src/game/unit-building-bonuses.ts:179-184 |
| c | own | +2 Pracy w mieście (3 w Żelazie) | Drobny dodatek Pracy. | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/data/buildings.json:1047; gra/src/game/production.ts:252-271 |
| d | next (R-B1) | Warunek Warsztatu, Akademii wojskowej i 2 badań | Bez Koszar nie zbudujesz Warsztatu oblężniczego ani Akademii wojskowej i nie zbadasz Oblężnictwa ani Sztuki wojennej. | 4 | 0 | 5 | 3 | 1 | 4 | 34 | gra/src/game/building-resource-gate.ts:110-121; gra/data/tech.json:369; gra/data/tech.json:453; gra/src/game/research.ts:154-180 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 59:49.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 59:25.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 59:34.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 49:25.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 49:34.
- c vs d → **d** — przewaga w kryterium SKALA (4 vs 1), suma ważona 34:25.

## 4. Ranking

1. **a** — Rekrutacja wojska epoki Brązu i Żelaza — wygrane: 3, suma: 59
2. **b** — +20% parametrów bojowych jednostek (na stałe) — wygrane: 2, suma: 49
3. **d** — Warunek Warsztatu, Akademii wojskowej i 2 badań — wygrane: 1, suma: 34
4. **c** — +2 Pracy w mieście (3 w Żelazie) — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Rekrutacja wojska epoki Brązu i Żelaza** — Bez Koszar w mieście nie zrekrutujesz tam żadnej jednostki epoki Brązu ani Żelaza.
- Top2: **+20% parametrów bojowych jednostek (na stałe)** — Jednostka zrekrutowana lub odwiedzająca miasto dostaje trwale +20% ataku, obrony i zdrowia (bez Pancerza).
- Top3: **Warunek Warsztatu, Akademii wojskowej i 2 badań** — Bez Koszar nie zbudujesz Warsztatu oblężniczego ani Akademii wojskowej i nie zbadasz Oblężnictwa ani Sztuki wojennej.
- Top4: **+2 Pracy w mieście (3 w Żelazie)** — Drobny dodatek Pracy.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy” → ZACHOWANE (w nowym TOP 5)
- 2. „Wzmacnia jednostki” → ZACHOWANE (w nowym TOP 5)
- 3. „Otwiera Wojskowość” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Rekrutacja wojska epoki Brązu i Żelaza
- DODANE: Warunek Warsztatu, Akademii wojskowej i 2 badań

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Koszary, aby rekrutować wojsko epoki Brązu i Żelaza.
- Zbuduj obok Akademię wojskową (Sztuka wojenna), aby wzmocnić jednostki o kolejne +20%.

## 8. Uwagi

Dzisiejszy top3 NIE wspomina, że Koszary są bramką rekrutacji wojska Brązu i Żelaza (production.ts:1075). Pozycja 3 to wymaganie technologii.
